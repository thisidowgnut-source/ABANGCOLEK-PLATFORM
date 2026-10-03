import { expect, test } from 'bun:test';
import { call, harness, user } from './backend-security.test';
test('posted expense net includes reversals beyond page one and has complete source count',async()=>{
 const {app}=harness(),owner=await user(app,'posting-summary',true);
 for(let index=0;index<101;index++)app.store.save('expense_postings',{id:'QA-post-'+index,kind:'EXPENSE',expenseId:'QA-expense-'+index,amountSen:100});
 app.store.save('expense_postings',{id:'QA-reversal',kind:'REVERSAL',expenseId:'QA-expense-0',reversesId:'QA-post-0',amountSen:-100});
 const page=await call(app,'/expense-postings',undefined,owner);expect(page.json.data).toHaveLength(100);
 const summary=await call(app,'/expense-postings/summary',undefined,owner);
 expect(summary.json.data.netAmountSen).toBe(10000);expect(summary.json.data.recordCount).toBe(102);expect(summary.json.data.scope).toBe('complete_ledger');expect(summary.json.data.reversedPostingIds).toContain('QA-post-0');
});

test('amendment API preserves approved snapshots and immutable expense reversal with csrf and founder gates', async () => {
  const { app } = harness(), founder = await user(app, 'amendment-owner', true), staff = await user(app, 'amendment-staff');
  await call(app, '/people/grants', { userId: staff.userId, role: 'staff', outletIds: ['hq'], expectedVersion: 0 }, founder);
  const close = (await call(app, '/dayclose', { outletId: 'hq', date: '2026-10-04', countCashSen: 0 }, founder)).json.data;
  const approved = (await call(app, `/dayclose/${close.id}/approve`, { expectedRevision: close.revision }, founder)).json.data;
  expect((await call(app, `/dayclose/${close.id}/reopen`, { expectedRevision: approved.revision, countCashSen: 0, reason: 'Recount verified' }, staff)).response.status).toBe(403);
  const correction = await call(app, `/dayclose/${close.id}/reopen`, { expectedRevision: approved.revision, countCashSen: 0, reason: 'Recount verified' }, founder);
  expect(correction.response.status).toBe(200);
  expect(correction.json.data.status).toBe('review');
  expect((await call(app, '/dayclose/amendments', undefined, founder)).json.data[0].approvedSnapshot).toEqual(approved);
  const expense = (await call(app, '/expenses', { outletId: 'hq', amountSen: 1200, category: 'Test invoice', evidenceIds: [] }, founder, { 'Idempotency-Key': 'amendment-expense-001' })).json.data;
  await call(app, '/evidence', { entityId: expense.id, name: 'Invoice document', mimeType: 'text/plain', size: 0 }, founder);
  const latest = (await call(app, '/expenses', undefined, founder)).json.data[0];
  const approvedExpense = (await call(app, `/expenses/${expense.id}/approve`, { expectedRevision: latest.revision }, founder)).json.data;
  const payload = { expectedRevision: approvedExpense.revision };
  expect((await call(app, `/expenses/${expense.id}/post`, payload, { ...founder, csrf: 'wrong' }, { 'Idempotency-Key': 'amendment-post-001' })).response.status).toBe(403);
  const posting = await call(app, `/expenses/${expense.id}/post`, payload, founder, { 'Idempotency-Key': 'amendment-post-001' });
  expect(posting.response.status).toBe(200);
  expect((await call(app, `/expenses/${expense.id}/post`, payload, founder, { 'Idempotency-Key': 'amendment-post-001' })).json.data.id).toBe(posting.json.data.id);
  const reversal = await call(app, `/expense-postings/${posting.json.data.id}/reverse`, { reason: 'Recorded duplicate' }, founder, { 'Idempotency-Key': 'amendment-reverse-001' });
  expect(reversal.response.status).toBe(200);
  const entries = (await call(app, '/expense-postings', undefined, founder)).json.data;
  expect(entries).toHaveLength(2);
  expect(entries.reduce((sum: number, entry: { amountSen: number }) => sum + entry.amountSen, 0)).toBe(0);
  expect(entries.every((entry: { bankSettlement: string }) => entry.bankSettlement === 'NOT_ASSERTED')).toBe(true);
});

test('people invitation and personal settings API reject cross-account tokens and scope forgery', async () => {
  const { app } = harness(), founder = await user(app, 'invite-owner', true), invited = await user(app, 'invite-staff'), outsider = await user(app, 'invite-other');
  const payload = { email: 'invite-staff@example.test', role: 'staff', outletIds: ['hq'], expiresAt: new Date(Date.now() + 3600000).toISOString() };
  expect((await call(app, '/people/invitations', payload, invited)).response.status).toBe(403);
  const invitation = await call(app, '/people/invitations', payload, founder);
  expect(invitation.response.status).toBe(200);
  expect((await call(app, '/people/invitations', undefined, founder)).json.data[0]).not.toHaveProperty('tokenHash');
  expect((await call(app, '/people/invitations/accept', { token: invitation.json.data.token }, outsider)).response.status).toBe(403);
  expect((await call(app, '/people/invitations/accept', { token: invitation.json.data.token }, invited)).response.status).toBe(200);
  expect((await call(app, '/people/invitations/accept', { token: invitation.json.data.token }, invited)).response.status).toBe(403);
  const slots = [{ outletId: 'hq', startAt: '2026-10-04T01:00:00Z', endAt: '2026-10-04T02:00:00Z', status: 'available' }];
  expect((await call(app, '/availability', { expectedRevision: 0, slots }, invited)).response.status).toBe(200);
  expect((await call(app, '/availability', { expectedRevision: 0, slots }, invited)).response.status).toBe(409);
  expect((await call(app, '/availability', undefined, outsider)).response.status).toBe(403);
  expect((await call(app, '/notification-preferences', { expectedRevision: 0, inAppEnabled: true, topics: ['runtime'] }, outsider)).response.status).toBe(400);
  expect((await call(app, '/notification-preferences', { expectedRevision: 0, inAppEnabled: false, topics: ['orders'], userId: invited.userId }, outsider)).response.status).toBe(400);
  expect((await call(app, '/notification-preferences', { expectedRevision: 0, inAppEnabled: true, topics: ['orders', 'cases'] }, outsider)).response.status).toBe(200);
  expect((await call(app, '/notification-preferences', undefined, outsider)).json.data.channel).toBe('in_app');
});

test('notification activity API applies preferences and current permissions to real assigned records', async () => {
  const { app } = harness(), founder = await user(app, 'activity-owner', true), staff = await user(app, 'activity-staff'), other = await user(app, 'activity-other');
  const member = (await call(app, '/people/grants', { userId: staff.userId, role: 'staff', outletIds: ['hq'], expectedVersion: 0 }, founder)).json.data;
  const task = (await call(app, '/tasks', { entityId: 'business', title: 'Assigned activity source', assigneeId: staff.userId, documentIds: [] }, founder)).json.data;
  await call(app, '/notification-preferences', { expectedRevision: 0, inAppEnabled: true, topics: ['tasks'] }, staff);
  const activity = await call(app, '/notifications', undefined, staff);
  expect(activity.response.status).toBe(200);
  expect(activity.json.data.items[0].id).toBe(task.id);
  expect((await call(app, '/notifications', undefined, other)).json.data.items).toEqual([]);
  await call(app, '/notification-preferences', { expectedRevision: 1, inAppEnabled: false, topics: ['tasks'] }, staff);
  expect((await call(app, '/notifications', undefined, staff)).json.data.items).toEqual([]);
  await call(app, '/notification-preferences', { expectedRevision: 2, inAppEnabled: true, topics: ['tasks'] }, staff);
  await call(app, '/people/revoke', { membershipId: member.id, expectedVersion: member.version }, founder);
  expect((await call(app, '/notifications', undefined, staff)).json.data.items).toEqual([]);
});
