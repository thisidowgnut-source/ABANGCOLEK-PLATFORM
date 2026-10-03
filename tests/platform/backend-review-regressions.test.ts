import { expect, test } from 'bun:test';
import { call, harness, user } from './backend-security.test';

test('cached message receipts recheck current case access after reassignment', async () => {
  const { app } = harness(); const founder = await user(app, 'owner', true), first = await user(app, 'first'), next = await user(app, 'next');
  for (const staff of [first, next]) await call(app, '/people/grants', { userId: staff.userId, role: 'staff', outletIds: ['hq'], expectedVersion: 0 }, founder);
  const product = (await call(app, '/catalogue', { name: 'QA', description: 'test', priceSen: 1200, packSize: 1, publish: true }, founder)).json.data;
  await call(app, '/inventory/receive', { productId: product.id, quantity: 1, ownerId: 'business', locationId: 'hq', status: 'available', reason: 'Test' }, founder, { 'Idempotency-Key': 'stock-test-review' });
  const order = (await call(app, '/orders', { lines: [{ productId: product.id, quantity: 1 }], catalogueVersion: product.publishedVersion, fulfilment: 'pickup', contactRef: 'Test pickup' }, founder, { 'Idempotency-Key': 'order-test-review' })).json.data;
  const complaint = (await call(app, '/cases', { orderId: order.id, subject: 'Issue', description: 'Review customer details' }, founder)).json.data;
  await call(app, `/cases/${complaint.id}/assign`, { expectedRevision: 1, assignedStaffId: first.userId }, founder);
  const preview = (await call(app, `/cases/${complaint.id}/preview`, { expectedRevision: 2, body: 'Private case reply', channel: 'manual_whatsapp' }, first)).json.data;
  const confirm = { expectedRevision: 2 }, key = { 'Idempotency-Key': 'review-private-confirm' };
  expect((await call(app, `/previews/${preview.id}/confirm`, confirm, first, key)).json.data.content).toBe('Private case reply');
  await call(app, `/cases/${complaint.id}/assign`, { expectedRevision: 2, assignedStaffId: next.userId }, founder);
  expect((await call(app, `/previews/${preview.id}/confirm`, confirm, first, key)).response.status).toBe(403);
});
test('QC readings cannot hide an out of range duplicate under a passing value', async () => {
  const { app } = harness(), founder = await user(app, 'owner', true);
  const doc = (await call(app, '/documents', { title: 'Test SOP', body: 'Approved test ranges', visibility: 'business', entityIds: [] }, founder)).json.data;
  const knowledge = (await call(app, `/documents/${doc.id}/publish`, { expectedVersion: 1 }, founder)).json.data;
  const sop = (await call(app, '/qc/sops', { knowledgeId: knowledge.id, readings: [{ name: 'test', unit: 'unit', minimum: 0, maximum: 10 }] }, founder)).json.data;
  const result = await call(app, '/qc', { batchId: 'batch', outletId: 'hq', sopId: sop.id, sopVersion: 1, evidenceIds: [], readings: [{ name: 'test', unit: 'unit', value: 1 }, { name: 'test', unit: 'unit', value: 99 }] }, founder);
  expect(result.response.status).toBe(400);
  expect(result.json.code).toBe('DUPLICATE_QC_READING');
});
test('reconciliation approval rechecks current expense approval', async () => {
  const { app } = harness(), founder = await user(app, 'owner', true);
  const evidence = (await call(app, '/evidence', { entityId: 'business', name: 'Receipt', mimeType: 'text/plain', size: 0 }, founder)).json.data;
  const expense = (await call(app, '/expenses', { outletId: 'hq', amountSen: 1000, category: 'Test', evidenceIds: [evidence.id] }, founder)).json.data;
  await call(app, `/expenses/${expense.id}/approve`, { expectedRevision: 1 }, founder);
  const reconciliation = (await call(app, '/reconciliations', { period: 'Test', paymentRefs: [], expenseRefs: [expense.id] }, founder)).json.data;
  await call(app, '/evidence', { entityId: expense.id, name: 'New receipt requires review', mimeType: 'text/plain', size: 0 }, founder);
  const result = await call(app, `/reconciliations/${reconciliation.id}/approve`, { expectedRevision: 1 }, founder);
  expect(result.response.status).toBe(409);
  expect(result.json.code).toBe('RECONCILIATION_SOURCE_CHANGED');
});
test('day close approval rejects a changed cash source snapshot', async () => {
  const { app } = harness(), founder = await user(app, 'owner', true);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const close = (await call(app, '/dayclose', { outletId: 'hq', date: day, countCashSen: 0 }, founder)).json.data;
  // Reproduces a payment committed by another request after review; this is an isolated test store.
  app.store.save('orders', { id: 'test-order', outletId: 'hq' });
  app.store.save('payments', { id: 'later-payment', orderId: 'test-order', amountSen: 1000, method: 'cash', state: 'confirmed', createdAt: new Date().toISOString() });
  const result = await call(app, `/dayclose/${close.id}/approve`, { expectedRevision: 1 }, founder);
  expect(result.response.status).toBe(409);
  expect(result.json.code).toBe('DAY_CLOSE_SOURCE_CHANGED');
  const reviewed=await call(app,`/dayclose/${close.id}/review`,{expectedRevision:1,countCashSen:1000},founder);
  expect(reviewed.json.data.expectedCashSen).toBe(1000);
  expect((await call(app,`/dayclose/${close.id}/approve`,{expectedRevision:reviewed.json.data.revision},founder)).response.status).toBe(200);
});
