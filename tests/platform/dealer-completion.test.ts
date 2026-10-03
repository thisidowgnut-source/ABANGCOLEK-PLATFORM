import { afterEach, expect, test, setSystemTime } from 'bun:test';
import { createPlatformApp } from '../../server/platform/app';
import { Dealers } from '../../server/platform/dealers';
import type { Principal } from '../../server/platform/auth';
import type { InventoryReservation } from '../../shared/platform-contracts';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const opened: ReturnType<typeof createPlatformApp>[] = [];
const directories: string[] = [];
afterEach(() => { setSystemTime(); for (const app of opened.splice(0)) app.close(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

async function setup(databasePath = ':memory:', options: { deferReceive?: boolean; batches?: { quantity: number; batchId: string; expiryAt: string }[] } = {}) {
  const app = createPlatformApp({ databasePath, bootstrapToken: 'dealer-completion-bootstrap-test' });
  opened.push(app);
  async function actor(name: string, founder = false): Promise<Principal> {
    const session = await app.auth.authenticate(founder ? 'bootstrap' : 'signup', {
      email: `${name}@example.test`, name, password: 'local isolated test password',
      ...(founder ? { token: 'dealer-completion-bootstrap-test' } : {}),
    });
    return app.auth.resolve(new Request('http://localhost', { headers: { Cookie: session.cookie } }));
  }
  const founder = await actor('founder', true), dealer = await actor('dealer'), outsider = await actor('outsider');
  const dealers = new Dealers(app.store, app.auth, app.commerce);
  app.store.save('settings', { id: 'business', version: 1, approvedPolicies: { dealer: {
    version: 1, minimumQuantity: 1, packMultiple: 1, priceBasisPoints: 7500,
    ownership: 'consigned', returnRules: 'Founder checks returned units before quarantine receipt', approvedAt: new Date().toISOString(),
  } }, locale: 'ms-MY', timezone: 'Asia/Kuala_Lumpur' });
  const application = dealers.apply(dealer, { organization: 'Isolated test business', description: 'Test fixture only' });
  const approved = dealers.decide(founder, application.id, { expectedRevision: 1 }, true);
  dealer.memberships = app.auth.memberships(dealer.user.id);
  const product = app.commerce.saveProduct(founder, { name: 'Isolated product', description: 'Test only', priceSen: 1000, packSize: 1, publish: true });
  for (const [index, batch] of (options.batches ?? [{ quantity: 6 }]).entries()) app.commerce.receive(founder, { productId: product.id, ownerId: 'business', locationId: 'hq', status: 'available', reason: 'Isolated test count', ...batch }, `opening-stock-${index}-01`);
  const quote = dealers.quote(dealer, { dealerOrgId: approved.dealerOrgId, lines: [{ productId: product.id, quantity: 6 }], priceVersion: 1 });
  let restock = dealers.request(dealer, { quoteId: quote.id }, 'restock-request-01');
  restock = dealers.transition(founder, restock.id, { expectedRevision: 1, next: 'approved' });
  const proof = app.work.createEvidence(founder, { entityId: restock.id, name: 'Isolated dispatch and count note', mimeType: 'text/plain', size: 0 });
  restock = dealers.transition(founder, restock.id, { expectedRevision: 2, next: 'dispatched', evidenceIds: [proof.id] });
  if (!options.deferReceive) dealers.receive(dealer, restock.id, { expectedRevision: 3, lines: [{ productId: product.id, quantity: 6 }] }, 'receiving-stock-01');
  const latest = () => dealers.restocks(dealer).find(row => row.id === restock.id)!;
  return { app, dealers, founder, dealer, outsider, product, proof, latest, restockId: restock.id };
}

test('sell-through preserves owner/custody, integer quoted price, scoped immutable movements and retry', async () => {
  const f = await setup();
  const input = { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reference: 'physical counter tally' };
  expect(() => f.dealers.sellThrough(f.outsider, f.restockId, input, 'outsider-sale-01')).toThrow('Permintaan');
  const sale = f.dealers.sellThrough(f.dealer, f.restockId, input, 'sell-through-01');
  expect(sale).toMatchObject({ kind: 'sell_through', amountSen: 1500 });
  expect(f.dealers.sellThrough(f.dealer, f.restockId, input, 'sell-through-01').id).toBe(sale.id);
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { ...input, lines: [{ productId: f.product.id, quantity: 3 }] }, 'sell-through-01')).toThrow();
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, input, 'stale-sell-through')).toThrow();
  expect(() => f.dealers.sellThrough(f.founder, f.restockId, { ...input, expectedRevision: f.latest().revision }, 'same-tally-new-key')).toThrow();
  const ledger = f.dealers.ledger(f.dealer);
  expect(ledger.lots.filter(lot => lot.locationId !== 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(4);
  expect(ledger.lots.every(lot => lot.ownerId === 'business')).toBe(true);
  expect(ledger.entries.filter(entry => entry.kind === 'sell_through')).toHaveLength(1);
  expect(() => f.dealers.ledger(f.outsider)).toThrow();
  expect(f.app.store.all('payments')).toEqual([]);
});

test('dispatch allocations retain every batch and expiry through partial receipt and physical return', async () => {
  const expiryA = new Date(Date.now() + 60_000).toISOString(), expiryB = new Date(Date.now() + 120_000).toISOString();
  const f = await setup(':memory:', { deferReceive: true, batches: [{ quantity: 2, batchId: 'batch-A', expiryAt: expiryA }, { quantity: 4, batchId: 'batch-B', expiryAt: expiryB }] });
  const dispatched = f.app.store.require<{ dispatchAllocations?: { sourceLotId: string; batchId: string; expiryAt: string; quantity: number }[] }>('restocks', f.restockId);
  expect(dispatched.dispatchAllocations).toHaveLength(2);
  expect(dispatched.dispatchAllocations?.map(allocation => allocation.batchId).sort()).toEqual(['batch-A', 'batch-B']);
  f.dealers.receive(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 1 }] }, 'batch-partial-receipt-01');
  f.dealers.receive(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 5 }] }, 'batch-final-receipt-01');
  const received = f.dealers.ledger(f.dealer).lots;
  expect(received.filter(lot => lot.batchId === 'batch-A').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
  expect(received.filter(lot => lot.batchId === 'batch-B').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(4);
  expect(received.every(lot => !!lot.expiryAt)).toBe(true);
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }], evidenceIds: [f.proof.id], reason: 'Return all physical batches' }, 'batch-return-request-01');
  f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Both batches physically received' }, 'batch-return-receipt-01', true);
  const hq = f.dealers.ledger(f.dealer).lots.filter(lot => lot.locationId === 'hq');
  expect(hq.filter(lot => lot.batchId === 'batch-A').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
  expect(hq.filter(lot => lot.batchId === 'batch-B').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(4);
  expect(hq.every(lot => lot.status === 'quarantine' && [expiryA, expiryB].includes(lot.expiryAt!))).toBe(true);
});

test('expired in-transit stock is quarantined at receipt and can only physically return', async () => {
  const expiryAt = new Date(Date.now() + 60_000).toISOString();
  const f = await setup(':memory:', { deferReceive: true, batches: [{ quantity: 6, batchId: 'expiring-transit-batch', expiryAt }] });
  setSystemTime(new Date(Date.now() + 120_000));
  f.dealers.receive(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }] }, 'expired-transit-receipt');
  expect(f.dealers.ledger(f.dealer).lots.every(lot => lot.status === 'quarantine' && lot.expiryAt === expiryAt)).toBe(true);
  expect(f.app.commerce.available(f.product.id, 'business', f.latest().dealerOrgId)).toBe(0);
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 1 }], evidenceIds: [f.proof.id], reference: 'Expired units cannot sell' }, 'expired-sale-denied')).toThrow();
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }], evidenceIds: [f.proof.id], reason: 'Physically return expired batch' }, 'expired-return-request');
  f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Expired batch received in quarantine' }, 'expired-return-received', true);
  expect(f.dealers.ledger(f.dealer).lots.filter(lot => lot.locationId === 'hq').every(lot => lot.status === 'quarantine' && lot.batchId === 'expiring-transit-batch' && lot.expiryAt === expiryAt)).toBe(true);
});

test('legacy dispatch without source allocations receives into quarantine with unknown provenance', async () => {
  const f = await setup(':memory:', { deferReceive: true });
  const legacy = f.app.store.require<Record<string, unknown> & { id: string }>('restocks', f.restockId);
  delete legacy.dispatchAllocations; f.app.store.save('restocks', legacy);
  f.dealers.receive(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }] }, 'unknown-dispatch-receipt');
  expect(f.dealers.ledger(f.dealer).lots.every(lot => lot.status === 'quarantine')).toBe(true);
  expect(f.dealers.ledger(f.dealer).lots.every(lot => lot.provenanceStatus === 'unknown' && !lot.sourceLotId)).toBe(true);
  expect(f.app.commerce.available(f.product.id, 'business', f.latest().dealerOrgId)).toBe(0);
});

test('sell-through consumes only unheld batch units and a return retains its exact held allocation', async () => {
  const expiryAt = new Date(Date.now() + 60_000).toISOString();
  const f = await setup(':memory:', { batches: [{ quantity: 2, batchId: 'held-A', expiryAt }, { quantity: 4, batchId: 'held-B', expiryAt }] });
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reason: 'Held physical batch' }, 'held-batch-return');
  f.dealers.sellThrough(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 4 }], evidenceIds: [f.proof.id], reference: 'Unheld batch tally' }, 'unheld-batch-tally');
  for (const allocation of returned.allocations!) expect(f.app.store.require<{ quantity: number }>('lots', allocation.lotId).quantity).toBe(allocation.quantity);
  setSystemTime(new Date(Date.now() + 120_000));
  f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Held batch expired while pending; physical quarantine receipt' }, 'held-expired-receipt', true);
  const hq = f.dealers.ledger(f.dealer).lots.filter(lot => lot.locationId === 'hq');
  expect(hq.reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
  expect(hq.every(lot => lot.expiryAt === expiryAt && lot.status === 'quarantine')).toBe(true);
});

test('holding expired quarantine stock for return never reduces saleable stock from another batch', async () => {
  const expiryAt = new Date(Date.now() + 60_000).toISOString(), validExpiry = new Date(Date.now() + 3600_000).toISOString();
  const f = await setup(':memory:', { deferReceive: true, batches: [{ quantity: 2, batchId: 'expired-return', expiryAt }, { quantity: 4, batchId: 'valid-sale', expiryAt: validExpiry }] });
  setSystemTime(new Date(Date.now() + 120_000));
  f.dealers.receive(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }] }, 'mixed-batch-receipt');
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reason: 'Expired physical stock set aside for return' }, 'mixed-expired-return');
  expect(returned.allocations!.every(allocation => allocation.batchId === 'expired-return')).toBe(true);
  expect(f.app.commerce.available(f.product.id, 'business', f.latest().dealerOrgId)).toBe(4);
  expect(f.dealers.sellThrough(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 4 }], evidenceIds: [f.proof.id], reference: 'Only valid batch sold' }, 'mixed-valid-sale').amountSen).toBe(3000);
  f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Expired batch physically received' }, 'mixed-expired-return-received', true);
  const lots = f.dealers.ledger(f.dealer).lots;
  expect(lots.filter(lot => lot.locationId !== 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(0);
  expect(lots.filter(lot => lot.locationId === 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
  expect(lots.filter(lot => lot.locationId === 'hq').every(lot => lot.batchId === 'expired-return' && lot.expiryAt === expiryAt && lot.status === 'quarantine')).toBe(true);
});

test('inventory transfer, adjustment and ordinary consumption protect the exact custody lot held for return', async () => {
  const expiryAt = new Date(Date.now() + 3600_000).toISOString();
  const f = await setup(':memory:', { batches: [{ quantity: 3, batchId: 'hold-guard-A', expiryAt }, { quantity: 3, batchId: 'hold-guard-B', expiryAt }] });
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reason: 'Physical units held in this exact batch' }, 'primitive-held-return');
  const allocation = returned.allocations![0], held = f.app.store.require<{ id: string; revision: number; quantity: number }>('lots', allocation.lotId);
  expect(f.app.commerce.available(f.product.id, 'business', f.latest().dealerOrgId)).toBe(4);
  expect(() => f.app.commerce.transfer(f.founder, held.id, { expectedRevision: held.revision, locationId: 'hq', quantity: 3, reason: 'Must not steal held lot' }, 'blocked-held-transfer')).toThrow();
  expect(() => f.app.commerce.adjust(f.founder, held.id, { expectedRevision: held.revision, quantity: 1, reason: 'Must not erase held units' }, 'blocked-held-adjustment')).toThrow();
  expect(f.app.store.require<{ quantity: number }>('lots', held.id).quantity).toBe(3);
  // Ordinary non-lot-specific reservations still consume available unheld stock normally.
  const consumeId = 'isolated-consume-other-units';
  f.app.store.save<InventoryReservation>('reservations', { id: 'ordinary-held-guard-reservation', orderId: consumeId, productId: f.product.id, ownerId: 'business', locationId: f.latest().dealerOrgId, quantity: 4, status: 'active', expiresAt: new Date(Date.now() + 60_000).toISOString(), revision: 1 });
  const consumed = f.app.commerce.consume({ id: consumeId, lines: [{ ...f.latest().lines[0], quantity: 4 }] });
  expect(consumed.reduce((sum, source) => sum + source.quantity, 0)).toBe(4);
  expect(f.app.store.require<{ quantity: number }>('lots', held.id).quantity).toBe(2);
  f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Exact held units physically received' }, 'held-guard-physical-return', true);
  expect(f.dealers.ledger(f.dealer).lots.filter(lot => lot.locationId === 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
});

test('return reserves unsold units, requires receipt evidence, moves to HQ quarantine and never becomes sale', async () => {
  const f = await setup();
  const input = { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reason: 'Physical damage reported' };
  expect(() => f.dealers.requestReturn(f.dealer, f.restockId, { ...input, evidenceIds: [] }, 'missing-return-proof')).toThrow();
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, input, 'return-request-01');
  expect(f.dealers.requestReturn(f.dealer, f.restockId, input, 'return-request-01').id).toBe(returned.id);
  expect(f.dealers.ledger(f.dealer).reservations.filter(hold => hold.status === 'active').reduce((sum, hold) => sum + hold.quantity, 0)).toBe(2);
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 5 }], evidenceIds: [f.proof.id], reference: 'Too many' }, 'oversell-return-units')).toThrow();
  expect(() => f.dealers.decideReturn(f.dealer, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Receipt' }, 'denied-return-01', true)).toThrow();
  expect(() => f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [], reason: 'Missing receipt' }, 'missing-receipt-01', true)).toThrow();
  const receipt = f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Physically received damaged stock' }, 'return-receipt-01', true);
  expect(receipt.status).toBe('received');
  expect(f.dealers.decideReturn(f.founder, returned.id, { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Physically received damaged stock' }, 'return-receipt-01', true).id).toBe(receipt.id);
  const ledger = f.dealers.ledger(f.dealer);
  expect(ledger.lots.filter(lot => lot.locationId === 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(2);
  expect(ledger.lots.filter(lot => lot.locationId === 'hq').every(lot => lot.status === 'quarantine')).toBe(true);
  expect(f.app.commerce.available(f.product.id)).toBe(0);
  expect(ledger.entries.filter(entry => entry.kind === 'return_received')).toHaveLength(1);
  expect(f.app.store.all('payments')).toEqual([]);
});

test('settlement is an obligation; only a separate founder manual payment records receipts', async () => {
  const f = await setup();
  const sale = f.dealers.sellThrough(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reference: 'Actual tally' }, 'settlement-sale-01');
  const body = { expectedRevision: f.latest().revision, sellThroughIds: [sale.id], evidenceIds: [f.proof.id] };
  expect(() => f.dealers.createSettlement(f.dealer, f.restockId, body, 'denied-settlement')).toThrow();
  const settlement = f.dealers.createSettlement(f.founder, f.restockId, body, 'settlement-draft-01');
  expect(settlement).toMatchObject({ amountSen: 1500, recordedPaidSen: 0, status: 'due' });
  expect(() => f.dealers.createSettlement(f.founder, f.restockId, { ...body, expectedRevision: f.latest().revision }, 'duplicate-source-01')).toThrow();
  const payment = { expectedRevision: 1, amountSen: 1000, method: 'bank', reference: 'actual manual bank receipt reference', evidenceIds: [f.proof.id], confirmation: 'manual_confirmed_receipt' };
  expect(() => f.dealers.recordSettlementPayment(f.founder, settlement.id, { ...payment, confirmation: 'bank_verified' }, 'unverified-auto-receipt')).toThrow();
  expect(() => f.dealers.recordSettlementPayment(f.dealer, settlement.id, payment, 'denied-payment-01')).toThrow();
  expect(() => f.dealers.recordSettlementPayment(f.founder, settlement.id, { ...payment, evidenceIds: [] }, 'missing-payment-proof')).toThrow();
  const receipt = f.dealers.recordSettlementPayment(f.founder, settlement.id, payment, 'manual-payment-01');
  expect(receipt.state).toBe('recorded_by_user');
  expect(f.dealers.recordSettlementPayment(f.founder, settlement.id, payment, 'manual-payment-01').id).toBe(receipt.id);
  expect(f.dealers.ledger(f.dealer).settlements[0]).toMatchObject({ recordedPaidSen: 1000, status: 'part_recorded' });
  expect(() => f.dealers.recordSettlementPayment(f.founder, settlement.id, { ...payment, expectedRevision: 2, amountSen: 501, reference: 'overpay ref' }, 'overpayment-01')).toThrow();
  expect(() => f.dealers.recordSettlementPayment(f.founder, settlement.id, { ...payment, expectedRevision: 2, amountSen: 500 }, 'duplicate-reference-01')).toThrow();
  expect(f.app.store.all('payments')).toEqual([]);
});

test('benefits GET derivation has no business writes and excludes revoked dealer access', async () => {
  const f = await setup();
  f.app.commerce.receive(f.founder, { productId: f.product.id, ownerId: 'business', locationId: 'hq', quantity: 1, status: 'available', reason: 'Isolated additional unit' }, 'benefit-extra-stock');
  const order = f.app.commerce.submitOrder(f.dealer, { lines: [{ productId: f.product.id, quantity: 1 }], catalogueVersion: 1, fulfilment: 'pickup', contactRef: 'Test' }, 'benefit-extra-order');
  // The source record is isolated; no production opening stock or sales are seeded.
  f.app.store.save('orders', { ...order, dealerOrgId: f.latest().dealerOrgId });
  const before = f.app.store.db.query<{ total: number }, []>('SELECT total_changes() AS total').get()!.total;
  f.dealers.benefits(f.dealer); f.dealers.benefits(f.dealer);
  expect(f.app.store.db.query<{ total: number }, []>('SELECT total_changes() AS total').get()!.total).toBe(before);
  expect(f.app.store.all('benefit_history')).toEqual([]);
  expect(() => f.dealers.benefits({ ...f.dealer, memberships: f.dealer.memberships.map(member => ({ ...member, status: 'revoked' })) })).toThrow();
});

test('validation and evidence scope fail atomically; a rejected return releases stock with an immutable outcome', async () => {
  const f = await setup();
  const input = { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 1 }], evidenceIds: [f.proof.id], reference: 'Real tally' };
  const unrelated = f.app.work.createEvidence(f.founder, { entityId: 'business', name: 'Unrelated evidence', mimeType: 'text/plain', size: 0 });
  for (const invalid of [0, -1, 0.5]) expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { ...input, lines: [{ productId: f.product.id, quantity: invalid }] }, `invalid-stock-${String(invalid).padEnd(8, 'x')}`)).toThrow();
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { ...input, evidenceIds: [unrelated.id] }, 'cross-entity-proof')).toThrow();
  expect(() => f.dealers.sellThrough(f.dealer, f.restockId, { ...input, amountSen: 1 }, 'forged-authoritative-price')).toThrow();
  expect(f.dealers.ledger(f.dealer).entries).toHaveLength(0);
  const returned = f.dealers.requestReturn(f.dealer, f.restockId, { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }], evidenceIds: [f.proof.id], reason: 'Request all stock' }, 'return-all-units-01');
  const decision = { expectedRevision: 1, evidenceIds: [f.proof.id], reason: 'Return request withdrawn; stock remains onsite' };
  expect(f.dealers.decideReturn(f.founder, returned.id, decision, 'reject-all-return-01', false).status).toBe('rejected');
  expect(() => f.dealers.decideReturn(f.founder, returned.id, decision, 'reject-all-return-01', true)).toThrow();
  const sale = f.dealers.sellThrough(f.dealer, f.restockId, { ...input, expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 6 }] }, 'sell-released-units-01');
  expect(sale.amountSen).toBe(4500);
  expect(f.dealers.ledger(f.dealer).entries.filter(entry => entry.kind === 'return_rejected')).toHaveLength(1);
});

test('sell-through, settlement, immutable receipt and idempotency survive database restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'abangcolek-dealer-completion-'));
  directories.push(directory);
  const databasePath = join(directory, 'dealer.sqlite'), f = await setup(databasePath);
  const saleInput = { expectedRevision: f.latest().revision, lines: [{ productId: f.product.id, quantity: 2 }], evidenceIds: [f.proof.id], reference: 'Durable physical tally' };
  const sale = f.dealers.sellThrough(f.dealer, f.restockId, saleInput, 'durable-sale-01');
  const settlement = f.dealers.createSettlement(f.founder, f.restockId, { expectedRevision: f.latest().revision, sellThroughIds: [sale.id], evidenceIds: [f.proof.id] }, 'durable-settlement-01');
  const paymentInput = { expectedRevision: 1, amountSen: 1500, method: 'cash', reference: 'Durable manual cash receipt', evidenceIds: [f.proof.id], confirmation: 'manual_confirmed_receipt' };
  const payment = f.dealers.recordSettlementPayment(f.founder, settlement.id, paymentInput, 'durable-payment-01');
  f.app.close(); opened.splice(opened.indexOf(f.app), 1);
  const restarted = createPlatformApp({ databasePath }); opened.push(restarted);
  const dealers = new Dealers(restarted.store, restarted.auth, restarted.commerce);
  const dealer = { ...f.dealer, memberships: restarted.auth.memberships(f.dealer.user.id) }, founder = { ...f.founder, memberships: restarted.auth.memberships(f.founder.user.id) };
  expect(dealers.sellThrough(dealer, f.restockId, saleInput, 'durable-sale-01').id).toBe(sale.id);
  expect(dealers.recordSettlementPayment(founder, settlement.id, paymentInput, 'durable-payment-01').id).toBe(payment.id);
  const ledger = dealers.ledger(dealer);
  expect(ledger.settlements[0]).toMatchObject({ recordedPaidSen: 1500, status: 'recorded_by_user' });
  expect(ledger.entries.filter(entry => entry.kind === 'sell_through')).toHaveLength(1);
  expect(ledger.payments).toHaveLength(1);
  expect(ledger.lots.filter(lot => lot.locationId !== 'hq').reduce((sum, lot) => sum + lot.quantity, 0)).toBe(4);
});
