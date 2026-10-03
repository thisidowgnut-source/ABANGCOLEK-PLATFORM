import { describe, expect, test } from 'bun:test';
import { PlatformStore } from '../../server/platform/store';
import { Auth, type Principal } from '../../server/platform/auth';
import { Commerce } from '../../server/platform/commerce';
import { Work } from '../../server/platform/work';
import { Operations } from '../../server/platform/operations';
import { OperationalAmendments } from '../../server/platform/operationalAmendments';

async function fixture() {
  const store = new PlatformStore(':memory:'), auth = new Auth(store, 'amendment-test-bootstrap');
  const commerce = new Commerce(store, auth), work = new Work(store, auth, commerce), operations = new Operations(store, auth, commerce, work);
  const service = new OperationalAmendments(store, auth, operations, work);
  async function user(name: string, founder = false): Promise<Principal> {
    const result = await auth.authenticate(founder ? 'bootstrap' : 'signup', { email: `${name}@test.invalid`, password: 'test-only secure password 123', name, ...(founder ? { token: 'amendment-test-bootstrap' } : {}) });
    return auth.resolve(new Request('http://localhost/api/platform/session', { headers: { Cookie: result.cookie.split(';')[0] } }));
  }
  const founder = await user('founder', true), staff = await user('staff'), other = await user('other');
  auth.grant(founder, { userId: staff.user.id, role: 'staff', outletIds: ['hq'], expectedVersion: 0 });
  staff.memberships = auth.memberships(staff.user.id);
  return { store, auth, commerce, operations, service, user, founder, staff, other };
}

describe('Auditable operational amendments', () => {
  test('founder correction archives approved day-close and refreshes live cash sources for new approval', async () => {
    const { store, service, operations, founder, staff } = await fixture();
    store.save('orders', { id: 'order', outletId: 'hq' });
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const close = operations.createDayClose(staff, { outletId: 'hq', date: day, countCashSen: 0 });
    const approved = operations.approveDayClose(founder, close.id, { expectedRevision: 1 });
    store.save('payments', { id: 'cash', orderId: 'order', amountSen: 500, method: 'cash', state: 'confirmed', createdAt: new Date().toISOString() });
    expect(() => service.reopenDayClose(staff, close.id, { expectedRevision: approved.revision, countCashSen: 500, reason: 'Late verified cash source' })).toThrow();
    expect(() => service.reopenDayClose(founder, close.id, { expectedRevision: approved.revision, countCashSen: 500, reason: '' })).toThrow();
    const corrected = service.reopenDayClose(founder, close.id, { expectedRevision: approved.revision, countCashSen: 500, reason: 'Late verified cash source' });
    expect(corrected.status).toBe('review');
    expect(corrected.expectedCashSen).toBe(500);
    expect(corrected.discrepancySen).toBe(0);
    expect(service.dayCloseHistory(founder)[0].approvedSnapshot).toEqual(approved);
    expect(() => service.reopenDayClose(founder, close.id, { expectedRevision: approved.revision, countCashSen: 500, reason: 'Replay' })).toThrow();
    expect(operations.approveDayClose(founder, close.id, { expectedRevision: corrected.revision }).status).toBe('approved');
    store.close();
  });
  test('approved expense posts once with immutable sources and one idempotent reversal', async () => {
    const { store, service, founder, staff } = await fixture();
    store.save('evidence', { id: 'invoice', entityId: 'business', name: 'Approved invoice', kind: 'file', sha256: 'a'.repeat(64), ownerId: founder.user.id });
    store.save('expenses', { id: 'expense', outletId: 'hq', amountSen: 1250, category: 'Packaging', evidenceIds: ['invoice'], status: 'approved', revision: 2, ownerId: founder.user.id, createdAt: new Date().toISOString() });
    expect(() => service.postExpense(staff, 'expense', { expectedRevision: 2 }, 'post-denied-001')).toThrow();
    const posted = service.postExpense(founder, 'expense', { expectedRevision: 2 }, 'post-expense-001');
    expect(service.postExpense(founder, 'expense', { expectedRevision: 2 }, 'post-expense-001').id).toBe(posted.id);
    expect(service.postExpense(founder, 'expense', { expectedRevision: 2 }, 'post-expense-002').id).toBe(posted.id);
    expect(posted.amountSen).toBe(1250);
    expect(posted.bankSettlement).toBe('NOT_ASSERTED');
    const reverse = service.reverseExpense(founder, posted.id, { reason: 'Duplicate commercial charge was documented' }, 'reverse-expense-001');
    expect(reverse.amountSen).toBe(-1250);
    expect(service.reverseExpense(founder, posted.id, { reason: 'Duplicate commercial charge was documented' }, 'reverse-expense-001').id).toBe(reverse.id);
    expect(service.postings(founder).reduce((sum, entry) => sum + entry.amountSen, 0)).toBe(0);
    expect(store.require<{ id: string; amountSen: number }>('expense_postings', posted.id).amountSen).toBe(1250);
    expect(store.require<{ id: string; status: string }>('expenses', 'expense').status).toBe('approved');
    store.save('expenses', { id: 'duplicate', outletId: 'hq', amountSen: 1250, category: 'Duplicate', evidenceIds: ['invoice'], status: 'approved', revision: 1 });
    expect(() => service.postExpense(founder, 'duplicate', { expectedRevision: 1 }, 'post-duplicate-001')).toThrow();
    store.close();
  });
  test('invites store only hash, bind email, expire, consume once and recheck founder issuer', async () => {
    const { store, auth, service, founder, staff, other, user } = await fixture();
    const invited = service.createInvitation(founder, { email: staff.user.email, role: 'developer', outletIds: [], expiresAt: new Date(Date.now() + 3600000).toISOString() });
    expect(JSON.stringify(store.all('people_invitations'))).not.toContain(invited.token);
    expect(JSON.stringify(service.invitations(founder))).not.toContain('tokenHash');
    expect(() => service.acceptInvitation(other, { token: invited.token })).toThrow();
    expect(service.acceptInvitation(staff, { token: invited.token }).membership.role).toBe('developer');
    expect(() => service.acceptInvitation(staff, { token: invited.token })).toThrow();
    const secondFounder = await user('second-founder');
    auth.grant(founder, { userId: secondFounder.user.id, role: 'founder', outletIds: ['hq'], expectedVersion: 0 });
    const pending = service.createInvitation(founder, { email: other.user.email, role: 'staff', outletIds: ['hq'], expiresAt: new Date(Date.now() + 3600000).toISOString() });
    const founderMember = founder.memberships.find(member => member.role === 'founder')!;
    secondFounder.memberships = auth.memberships(secondFounder.user.id);
    auth.revoke(secondFounder, { membershipId: founderMember.id, expectedVersion: founderMember.version });
    expect(() => service.acceptInvitation(other, { token: pending.token })).toThrow();
    const issuer = { ...secondFounder, memberships: auth.memberships(secondFounder.user.id) };
    const expired = service.createInvitation(issuer, { email: other.user.email, role: 'developer', outletIds: [], expiresAt: new Date(Date.now() + 3600000).toISOString() });
    store.save('people_invitations', { ...store.require<{ id: string }>('people_invitations', expired.id), expiresAt: '2020-01-01T00:00:00Z' });
    expect(() => service.acceptInvitation(other, { token: expired.token })).toThrow();
    store.close();
  });
  test('own availability and in-app preferences enforce revision, outlet and role topic scope', async () => {
    const { store, service, founder, staff, other } = await fixture();
    const slot = { outletId: 'hq', startAt: new Date(Date.now() + 3600000).toISOString(), endAt: new Date(Date.now() + 7200000).toISOString(), status: 'available' };
    const record = service.saveAvailability(staff, { expectedRevision: 0, slots: [slot] });
    expect(record.userId).toBe(staff.user.id);
    expect(() => service.saveAvailability(staff, { expectedRevision: 0, slots: [] })).toThrow();
    expect(() => service.saveAvailability(staff, { expectedRevision: 1, slots: [{ ...slot, outletId: 'foreign' }] })).toThrow();
    expect(() => service.saveAvailability(staff, { expectedRevision: 1, slots: [slot, slot] })).toThrow();
    expect(() => service.saveAvailability(other, { expectedRevision: 0, slots: [slot] })).toThrow();
    expect(service.availability(founder)[0].id).toBe(record.id);
    const prefs = service.savePreferences(other, { expectedRevision: 0, inAppEnabled: true, topics: ['orders', 'cases'] });
    expect(service.preferences(other).revision).toBe(prefs.revision);
    expect(() => service.savePreferences(other, { expectedRevision: 1, inAppEnabled: true, topics: ['runtime'] })).toThrow();
    expect(() => service.savePreferences(other, { expectedRevision: 1, inAppEnabled: true, topics: [], userId: staff.user.id })).toThrow();
    store.close();
  });
  test('in-app activity respects selected topics, disable switch, current grants and bounded items', async () => {
    const { store, auth, service, founder, staff, other } = await fixture();
    for (let index = 0; index < 15; index++) store.save('tasks', { id: `task-${index}`, assigneeId: staff.user.id, ownerId: founder.user.id, title: `Assigned work ${index}`, status: 'open', revision: 1, createdAt: new Date(Date.now() + index).toISOString() });
    service.savePreferences(staff, { expectedRevision: 0, inAppEnabled: true, topics: ['tasks'] });
    const activity = service.notifications(staff);
    expect(activity.items).toHaveLength(10);
    expect(activity.counts.tasks).toBe(10);
    expect(activity.items.every(item => item.topic === 'tasks')).toBe(true);
    expect(service.notifications(other).items).toEqual([]);
    service.savePreferences(staff, { expectedRevision: 1, inAppEnabled: false, topics: ['tasks'] });
    expect(service.notifications(staff).items).toEqual([]);
    service.savePreferences(staff, { expectedRevision: 2, inAppEnabled: true, topics: ['tasks'] });
    const membership = staff.memberships.find(member => member.role === 'staff')!;
    auth.revoke(founder, { membershipId: membership.id, expectedVersion: membership.version });
    expect(service.notifications(staff).items).toEqual([]);
    expect(service.notifications(staff).topics).not.toContain('tasks');
    store.close();
  });
});
