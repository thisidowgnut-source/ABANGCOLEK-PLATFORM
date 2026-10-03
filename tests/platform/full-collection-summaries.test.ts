import { expect, test } from 'bun:test';
import { call, harness, user } from './backend-security.test';
import type { CatalogueProduct, ExpenseRecord, OrderRecord, TaskRecord } from '../../shared/platform-contracts';
import type { PaymentRecord } from '../../server/platform/commerce';

test('finance summary includes every canonical row beyond the page cap and excludes drafts/manual receipts', async () => {
  const { app } = harness(), founder = await user(app, 'summary-founder', true), customer = await user(app, 'summary-customer'), developer = await user(app, 'summary-developer');
  await call(app, '/people/grants', { userId: developer.userId, role: 'developer', outletIds: [], expectedVersion: 0 }, founder);
  for (let index = 0; index < 105; index++) {
    const order: OrderRecord = { id: `summary-order-${index}`, customerId: customer.userId, lines: [], amountSen: 1000, fulfilment: 'pickup', contactRef: 'Isolated fixture', outletId: 'hq', fulfilmentStatus: 'review', revision: 2, paymentState: 'part_refunded', paidAmountSen: 600, refundAmountSen: 100, createdAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z' };
    app.store.save('orders', order);
    app.store.save<PaymentRecord>('payments', { id: `summary-payment-${index}`, orderId: order.id, amountSen: 600, method: 'cash', reference: `isolated-${index}`, state: 'confirmed', confirmedBy: founder.userId, createdAt: order.createdAt });
    app.store.save<PaymentRecord>('payments', { id: `summary-refund-${index}`, orderId: order.id, amountSen: 100, method: 'cash', reference: `isolated-refund-${index}`, state: 'refunded', confirmedBy: founder.userId, createdAt: order.createdAt });
    app.store.save<ExpenseRecord>('expenses', { id: `summary-expense-${index}`, outletId: 'hq', amountSen: 25, category: 'Isolated approved expense', evidenceIds: [], status: 'approved', revision: 2, ownerId: founder.userId, createdAt: order.createdAt });
  }
  const cancelled = { ...app.store.require<OrderRecord>('orders', 'summary-order-0'), id: 'summary-cancelled', amountSen: 5000, paidAmountSen: 0, refundAmountSen: 0, fulfilmentStatus: 'cancelled' as const };
  app.store.save('orders', cancelled);
  for (const status of ['draft', 'rejected'] as const) app.store.save('expenses', { ...app.store.require<ExpenseRecord>('expenses', 'summary-expense-0'), id: `summary-${status}`, status, amountSen: 99999 });
  app.store.save('dealer_settlement_payments', { id: 'isolated-manual-dealer-receipt', amountSen: 999999, state: 'recorded_by_user' });
  expect((await call(app, '/orders', undefined, founder)).json.data).toHaveLength(100);
  const summary = await call(app, '/finance/summary', undefined, founder);
  expect(summary.response.status).toBe(200);
  expect(summary.json.data).toMatchObject({ confirmedReceiptsSen: 63000, refundSen: 10500, netConfirmedReceiptsSen: 52500, receivablesSen: 42000, approvedExpensesSen: 2625, manualDealerReceiptsSen: 999999, sourceCounts: { orders: 106, paymentRecords: 210, approvedExpenses: 105 } });
  expect((await call(app, '/finance/summary', undefined, customer)).response.status).toBe(403);
  expect((await call(app, '/finance/summary', undefined, developer)).response.status).toBe(403);
  const before = app.store.db.query<{ count: number }, []>('SELECT COUNT(*) AS count FROM records').get()!.count;
  await call(app, '/finance/summary', undefined, founder);
  expect(app.store.db.query<{ count: number }, []>('SELECT COUNT(*) AS count FROM records').get()!.count).toBe(before);
});

test('staff summary counts all own assigned tasks and excludes another assignee and completed work', async () => {
  const { app } = harness(), founder = await user(app, 'tasks-summary-founder', true), staff = await user(app, 'tasks-summary-staff'), outsider = await user(app, 'tasks-summary-other');
  await call(app, '/people/grants', { userId: staff.userId, role: 'staff', outletIds: ['hq'], expectedVersion: 0 }, founder);
  for (let index = 0; index < 107; index++) app.store.save<TaskRecord>('tasks', { id: `assigned-${index}`, entityId: 'business', title: 'Isolated assigned work', assigneeId: staff.userId, ownerId: founder.userId, status: index < 105 ? 'open' : 'done', documentIds: [], revision: 1, createdAt: '2026-10-02T00:00:00.000Z' });
  app.store.save<TaskRecord>('tasks', { ...app.store.require<TaskRecord>('tasks', 'assigned-0'), id: 'other-assignee', assigneeId: outsider.userId, ownerId: staff.userId });
  expect((await call(app, '/tasks', undefined, staff)).json.data).toHaveLength(100);
  const summary = await call(app, '/tasks/summary', undefined, staff);
  expect(summary.response.status).toBe(200);
  expect(summary.json.data).toMatchObject({ totalAssignedTasks: 107, openAssignedTasks: 105, completedAssignedTasks: 2 });
  expect((await call(app, '/tasks/summary', undefined, outsider)).response.status).toBe(403);
});

test('public product detail resolves beyond the first catalogue page without leaking draft/admin data', async () => {
  const { app } = harness(), founder = await user(app, 'catalogue-summary-founder', true);
  for (let index = 0; index < 105; index++) app.store.save<CatalogueProduct>('catalogue', { id: `published-${index}`, name: `Isolated product ${index}`, description: 'Published fixture', priceSen: 1234, currency: 'MYR', packSize: 1, publishedVersion: 7, availableQuantity: 0, revision: 1, status: 'published' });
  app.store.setMetadata('catalogue_version', '7');
  const first = (await call(app, '/catalogue')).json.data as { id: string }[];
  const beyond = app.store.all<CatalogueProduct>('catalogue').find(product => !first.some(visible => visible.id === product.id))!;
  expect(first).toHaveLength(100);
  const detail = await call(app, `/catalogue/${beyond.id}`);
  expect(detail.response.status).toBe(200);
  expect(detail.json.data).toMatchObject({ id: beyond.id, name: beyond.name, priceSen: 1234, publishedVersion: 7 });
  expect(detail.json.data).not.toHaveProperty('revision');
  expect(detail.json.data).not.toHaveProperty('status');
  app.store.save('catalogue', { ...beyond, id: 'unpublished-fixture', status: 'draft' });
  app.store.save('catalogue', { ...beyond, id: 'retired-fixture', status: 'retired' });
  expect((await call(app, '/catalogue/unpublished-fixture')).response.status).toBe(404);
  expect((await call(app, '/catalogue/retired-fixture')).response.status).toBe(404);
  expect((await call(app, '/catalogue/missing-fixture')).response.status).toBe(404);
  expect((await call(app, '/catalogue/admin')).response.status).toBe(401);
  expect((await call(app, '/catalogue/admin', undefined, founder)).response.status).toBe(200);
});
