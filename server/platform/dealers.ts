import type { BusinessSettings, DealerApplication, DealerTerms, RestockRecord, VersionedQuote, InventoryReservation, InventoryMovement, StockLot, StockReceipt, EligiblePaidOrder, CommissionPolicy, EarnedBenefit, OrderRecord } from '../../shared/platform-contracts';
import { Auth, type Principal } from './auth';
import { Commerce, type PaymentRecord } from './commerce';
import { fields, fail, id, integer, now, object, oneOf, PlatformStore, strings, text } from './store';
import type { DealerBenefit, DealerDispatchAllocation, DealerLedger, DealerLedgerEntry, DealerRestockRecord, DealerReturnAllocation, DealerReturnRecord, DealerSettlement, DealerSettlementPayment, DealerStockLot } from '../../shared/dealer-contracts';

export function calculateEarnedBenefit(order:EligiblePaidOrder,policy:CommissionPolicy):EarnedBenefit {
  const valid=!!order.paymentConfirmedAt&&Number.isSafeInteger(order.paidAmountSen)&&order.paidAmountSen>0&&Number.isSafeInteger(order.refundAmountSen)&&order.refundAmountSen>=0&&order.refundAmountSen<=order.paidAmountSen&&!!policy.approvedAt&&Number.isSafeInteger(policy.rateBasisPoints)&&policy.rateBasisPoints>=0&&policy.rateBasisPoints<=10000&&!!order.productIds?.length&&order.productIds.every(p=>policy.eligibleProductIds.includes(p));
  return {orderId:order.orderId,policyVersion:policy.version,amountSen:valid?Number(BigInt(order.paidAmountSen-order.refundAmountSen)*BigInt(policy.rateBasisPoints)/10000n):0,reasonCode:valid?'CONFIRMED_ELIGIBLE_NET_PAYMENT':'PAYMENT_OR_POLICY_UNCONFIRMED'};
}
export class Dealers {
  constructor(readonly store:PlatformStore,readonly auth:Auth,readonly commerce:Commerce) {}
  saveCommissionPolicy(actor:Principal,raw:unknown){this.auth.founder(actor);const input=object(raw);fields(input,['expectedVersion','eligibleProductIds','rateBasisPoints']);const policies=this.store.all<CommissionPolicy>('commission_policies'),version=Math.max(0,...policies.map(p=>p.version));this.store.revision(version,input.expectedVersion);const eligibleProductIds=strings(input.eligibleProductIds);if(!eligibleProductIds.length)fail('ELIGIBLE_PRODUCTS_REQUIRED');for(const productId of eligibleProductIds)if(!this.commerce.catalogue().some(p=>p.id===productId))fail('PRODUCT_UNAVAILABLE',409);const policy:CommissionPolicy={id:id(),version:version+1,eligibleProductIds,rateBasisPoints:integer(input.rateBasisPoints,'Commission basis points',0,10000),approvedAt:now()};this.store.save('commission_policies',policy);this.store.audit(actor.user.id,'commission.policy_approve',policy.id,policy.version);return policy;}
  private organizations(actor: Principal): Set<string> {
    return new Set(actor.memberships.filter(member => member.status === 'active' && member.role === 'customer' && member.dealerOrgId).map(member => member.dealerOrgId!));
  }
  benefits(actor: Principal): DealerBenefit[] {
    const organizations = this.organizations(actor), founder = this.auth.has(actor, 'founder');
    if (!founder && !organizations.size) fail('DEALER_SCOPE', 403);
    const payments = this.store.all<PaymentRecord>('payments'), policies = this.store.all<CommissionPolicy>('commission_policies');
    return this.store.all<OrderRecord>('orders').filter(order => order.dealerOrgId && (founder || organizations.has(order.dealerOrgId))).map(order => {
      const payment = payments.find(candidate => candidate.orderId === order.id && candidate.state === 'confirmed' && candidate.amountSen === order.paidAmountSen);
      const policy = policies.filter(candidate => payment && candidate.approvedAt <= payment.createdAt).sort((a, b) => b.version - a.version)[0];
      const benefit: EarnedBenefit = policy && order.fulfilmentStatus === 'received'
        ? calculateEarnedBenefit({ orderId: order.id, paidAmountSen: order.paidAmountSen, refundAmountSen: order.refundAmountSen, paymentConfirmedAt: payment?.createdAt, productIds: order.lines.map(line => line.productId) }, policy)
        : { orderId: order.id, policyVersion: policy?.version ?? 0, amountSen: 0, reasonCode: 'POLICY_PAYMENT_OR_FULFILMENT_UNCONFIRMED' };
      // This is a read-time derivation, never a payout or a write to business history.
      return { id: `${order.id}:${order.revision}:${benefit.policyVersion}`, dealerOrgId: order.dealerOrgId!, orderRevision: order.revision, paymentId: payment?.id ?? null, policyId: policy?.id ?? null, ...benefit, generatedAt: now(), status: 'derived_not_paid' };
    });
  }
  dealer(actor:Principal,organizationId:string){if(this.auth.has(actor,'founder'))return;if(!this.organizations(actor).has(organizationId))fail('DEALER_SCOPE',403);}
  ledger(actor: Principal): DealerLedger {
    const organizations = this.organizations(actor), founder = this.auth.has(actor, 'founder');
    if (!founder && !organizations.size) fail('DEALER_SCOPE', 403);
    const allowed = (record: { dealerOrgId: string }) => founder || organizations.has(record.dealerOrgId);
    const restockIds = new Set(this.store.all<RestockRecord>('restocks').filter(allowed).map(record => record.id));
    const lots = this.store.all<DealerStockLot>('lots').filter(lot => restockIds.has(lot.sourceRestockId));
    const movementSources = new Set([...restockIds, ...lots.map(lot => lot.id)]);
    return {
      entries: this.store.all<DealerLedgerEntry>('dealer_ledger').filter(allowed),
      returns: this.store.all<DealerReturnRecord>('dealer_returns').filter(allowed),
      settlements: this.store.all<DealerSettlement>('dealer_settlements').filter(allowed),
      payments: this.store.all<DealerSettlementPayment>('dealer_settlement_payments').filter(allowed),
      lots,
      movements: this.store.all<InventoryMovement>('movements').filter(movement => movementSources.has(movement.sourceEntityId)),
      reservations: this.store.all<InventoryReservation & { sourceRestockId: string }>('reservations').filter(reservation => restockIds.has(reservation.sourceRestockId)),
    };
  }
  private restock(actor: Principal, restockId: string): DealerRestockRecord {
    const record = this.store.require<DealerRestockRecord>('restocks', restockId);
    this.dealer(actor, record.dealerOrgId);
    return record;
  }
  private immutable<T extends { id: string }>(kind: string, record: T): T {
    // INSERT deliberately prevents overwriting an event or a payment receipt.
    this.store.db.query('INSERT INTO records(kind,id,data,updated_at) VALUES(?,?,?,?)').run(kind, record.id, JSON.stringify(record), now());
    return record;
  }
  private entry(actor: Principal, restock: RestockRecord, input: Pick<DealerLedgerEntry, 'kind' | 'sourceEntityId' | 'lines' | 'amountSen' | 'evidenceIds' | 'movementIds' | 'reference'>): DealerLedgerEntry {
    return this.immutable('dealer_ledger', { id: id(), dealerOrgId: restock.dealerOrgId, restockId: restock.id, sourceRevision: restock.revision, actorId: actor.user.id, createdAt: now(), ...input });
  }
  private bump(restock: DealerRestockRecord): DealerRestockRecord {
    return this.store.save('restocks', { ...restock, revision: restock.revision + 1 });
  }
  private receivedLines(restock: RestockRecord, raw: unknown): RestockRecord['lines'] {
    if (!['dispatched', 'received'].includes(restock.status)) fail('STOCK_NOT_RECEIVED', 409);
    return this.commerce.lines(raw).map(input => {
      const quoted = restock.lines.find(line => line.productId === input.productId);
      if (!quoted) fail('PRODUCT_SCOPE', 403);
      return { ...quoted, quantity: input.quantity };
    });
  }
  private stock(restock: RestockRecord, productId: string): DealerStockLot[] {
    const owner = restock.ownership === 'consigned' ? 'business' : restock.dealerOrgId;
    return this.store.all<DealerStockLot>('lots').filter(lot => lot.sourceRestockId === restock.id && lot.productId === productId && lot.ownerId === owner && lot.locationId === restock.dealerOrgId && lot.custodyId === restock.dealerOrgId && lot.provenanceStatus === 'verified' && lot.status === 'available' && (!lot.expiryAt || lot.expiryAt > now()));
  }
  private availableAtDealer(restock: RestockRecord, productId: string): number {
    const lots = this.stock(restock, productId), stock = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const holds = this.store.all<InventoryReservation & { sourceRestockId?: string; custodyLotId?: string }>('reservations').filter(hold => hold.sourceRestockId === restock.id && hold.productId === productId && hold.status === 'active' && (!hold.custodyLotId || lots.some(lot => lot.id === hold.custodyLotId))).reduce((sum, hold) => sum + hold.quantity, 0);
    // The global ledger may contain another operational reservation at this location.
    return Math.min(stock - holds, this.commerce.available(productId, restock.ownership === 'consigned' ? 'business' : restock.dealerOrgId, restock.dealerOrgId));
  }
  private removeStock(restock: RestockRecord, lines: RestockRecord['lines'], operationKey: string): string[] {
    const movementIds: string[] = [];
    for (const line of lines) {
      let remaining = line.quantity;
      for (const lot of this.stock(restock, line.productId)) {
        const held = this.store.all<DealerReturnRecord>('dealer_returns').filter(record => record.status === 'requested').flatMap(record => record.allocations ?? []).filter(allocation => allocation.lotId === lot.id).reduce((sum, allocation) => sum + allocation.quantity, 0);
        const removed = Math.min(remaining, Math.max(0, lot.quantity - held));
        if (!removed) continue;
        this.store.save('lots', { ...lot, quantity: lot.quantity - removed, revision: lot.revision + 1 });
        const movement: InventoryMovement = { id: id(), productId: line.productId, ownerId: lot.ownerId, locationId: lot.locationId, quantityDelta: -removed, operationKey: `${operationKey}:${lot.id}`, sourceEntityId: restock.id, createdAt: now() };
        this.immutable('movements', movement); movementIds.push(movement.id); remaining -= removed;
      }
      if (remaining) fail('INSUFFICIENT_DEALER_STOCK', 409);
    }
    return movementIds;
  }
  private allocateReturn(restock: RestockRecord, lines: RestockRecord['lines']): DealerReturnAllocation[] {
    const pending = this.store.all<DealerReturnRecord>('dealer_returns').filter(record => record.restockId === restock.id && record.status === 'requested');
    if (pending.some(record => !record.allocations)) fail('RETURN_PROVENANCE_REVIEW_REQUIRED', 409);
    const result: DealerReturnAllocation[] = [], ownerId = restock.ownership === 'consigned' ? 'business' : restock.dealerOrgId;
    for (const line of lines) {
      let remaining = line.quantity;
      const saleable = (lot: DealerStockLot) => lot.status === 'available' && (!lot.expiryAt || lot.expiryAt > now()) ? 1 : 0;
      const lots = this.store.all<DealerStockLot>('lots').filter(lot => lot.sourceRestockId === restock.id && lot.productId === line.productId && lot.ownerId === ownerId && lot.locationId === restock.dealerOrgId && lot.custodyId === restock.dealerOrgId).sort((a, b) => saleable(a) - saleable(b) || (a.expiryAt ?? '9999').localeCompare(b.expiryAt ?? '9999'));
      for (const lot of lots) {
        const held = pending.flatMap(record => record.allocations ?? []).filter(allocation => allocation.lotId === lot.id).reduce((sum, allocation) => sum + allocation.quantity, 0);
        const quantity = Math.min(remaining, Math.max(0, lot.quantity - held));
        if (!quantity) continue;
        result.push({ lotId: lot.id, productId: lot.productId, quantity, provenanceStatus: lot.provenanceStatus ?? 'unknown', ...(lot.sourceLotId ? { sourceLotId: lot.sourceLotId } : {}), ...(lot.batchId ? { batchId: lot.batchId } : {}), ...(lot.expiryAt ? { expiryAt: lot.expiryAt } : {}) });
        remaining -= quantity; if (!remaining) break;
      }
      if (remaining) fail('INSUFFICIENT_DEALER_STOCK', 409);
    }
    return result;
  }
  sellThrough(actor: Principal, restockId: string, raw: unknown, key: unknown): DealerLedgerEntry {
    this.restock(actor, restockId);
    return this.commerce.idem(actor, `dealer.sell_through:${restockId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'lines', 'evidenceIds', 'reference']);
      const restock = this.restock(actor, restockId); this.store.revision(restock.revision, input.expectedRevision);
      if (restock.ownership !== 'consigned') fail('CONSIGNMENT_REQUIRED', 409);
      const lines = this.receivedLines(restock, input.lines), evidenceIds = this.commerce.evidence(actor, input.evidenceIds, restockId, 1);
      const reference = text(input.reference, 'Rujukan sell-through', 200);
      if (this.store.all<DealerLedgerEntry>('dealer_ledger').some(entry => entry.restockId === restockId && entry.kind === 'sell_through' && entry.reference === reference)) fail('SELL_THROUGH_REFERENCE_USED', 409);
      for (const line of lines) if (line.quantity > this.availableAtDealer(restock, line.productId)) fail('INSUFFICIENT_DEALER_STOCK', 409);
      const amountSen = integer(lines.reduce((sum, line) => sum + line.priceSen * line.quantity, 0), 'Jumlah konsainan', 0, 1_000_000_000);
      const movementIds = this.removeStock(restock, lines, `sell-through:${text(key)}`);
      const entry = this.entry(actor, restock, { kind: 'sell_through', sourceEntityId: restockId, lines, amountSen, evidenceIds, movementIds, reference });
      this.bump(restock); this.store.audit(actor.user.id, 'dealer.sell_through', entry.id, restock.revision + 1);
      return entry;
    });
  }
  requestReturn(actor: Principal, restockId: string, raw: unknown, key: unknown): DealerReturnRecord {
    this.restock(actor, restockId);
    return this.commerce.idem(actor, `dealer.return:${restockId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'lines', 'evidenceIds', 'reason']);
      const restock = this.restock(actor, restockId); this.store.revision(restock.revision, input.expectedRevision);
      const lines = this.receivedLines(restock, input.lines), evidenceIds = this.commerce.evidence(actor, input.evidenceIds, restockId, 1), reason = text(input.reason, 'Sebab return', 3000);
      const allocations = this.allocateReturn(restock, lines);
      const record: DealerReturnRecord = { id: id(), dealerOrgId: restock.dealerOrgId, restockId, lines, allocations, status: 'requested', reason, evidenceIds, revision: 1, requestedBy: actor.user.id, createdAt: now() };
      this.store.save('dealer_returns', record);
      for (const allocation of allocations) this.store.save<InventoryReservation & { sourceRestockId: string; custodyLotId: string }>('reservations', { id: id(), orderId: record.id, sourceRestockId: restockId, custodyLotId: allocation.lotId, productId: allocation.productId, ownerId: restock.ownership === 'consigned' ? 'business' : restock.dealerOrgId, locationId: restock.dealerOrgId, quantity: allocation.quantity, status: 'active', expiresAt: '9999-12-31T23:59:59.999Z', revision: 1 });
      this.entry(actor, restock, { kind: 'return_requested', sourceEntityId: record.id, lines, amountSen: 0, evidenceIds, movementIds: [], reference: reason });
      this.bump(restock); this.store.audit(actor.user.id, 'dealer.return_requested', record.id);
      return record;
    });
  }
  decideReturn(actor: Principal, returnId: string, raw: unknown, key: unknown, receive: boolean): DealerReturnRecord {
    this.auth.founder(actor);
    return this.commerce.idem(actor, `dealer.return_${receive ? 'receive' : 'reject'}:${returnId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'evidenceIds', 'reason']);
      const record = this.store.require<DealerReturnRecord>('dealer_returns', returnId), restock = this.restock(actor, record.restockId);
      this.store.revision(record.revision, input.expectedRevision);
      if (record.status !== 'requested') fail('INVALID_TRANSITION', 409);
      const reason = text(input.reason, 'Sebab keputusan return', 3000), evidenceIds = this.commerce.evidence(actor, input.evidenceIds, restock.id, 1);
      const movementIds: string[] = [];
      if (receive) {
        if (!record.allocations) fail('RETURN_PROVENANCE_REVIEW_REQUIRED', 409);
        for (const allocation of record.allocations) {
          const source = this.store.require<DealerStockLot>('lots', allocation.lotId);
          if (source.sourceRestockId !== restock.id || source.locationId !== restock.dealerOrgId || source.quantity < allocation.quantity || source.batchId !== allocation.batchId || source.expiryAt !== allocation.expiryAt) fail('RETURN_ALLOCATION_CONFLICT', 409);
          this.store.save('lots', { ...source, quantity: source.quantity - allocation.quantity, revision: source.revision + 1 });
          const outbound: InventoryMovement = { id: id(), productId: source.productId, ownerId: source.ownerId, locationId: source.locationId, quantityDelta: -allocation.quantity, operationKey: `return:${text(key)}:${source.id}`, sourceEntityId: restock.id, createdAt: now() };
          this.immutable('movements', outbound); movementIds.push(outbound.id);
          // A physical return enters quarantine; receipt does not transfer ownership or release QC.
          const lot: DealerStockLot = { ...source, id: id(), locationId: 'hq', custodyId: 'business', quantity: allocation.quantity, status: 'quarantine', revision: 1, provenanceStatus: allocation.provenanceStatus };
          this.store.save('lots', lot);
          const movement: InventoryMovement = { id: id(), productId: source.productId, ownerId: lot.ownerId, locationId: 'hq', quantityDelta: allocation.quantity, operationKey: `return-received:${text(key)}:${source.id}`, sourceEntityId: restock.id, createdAt: now() };
          this.immutable('movements', movement); movementIds.push(movement.id);
        }
      }
      for (const hold of this.store.all<InventoryReservation>('reservations').filter(row => row.orderId === returnId && row.status === 'active')) this.store.save('reservations', { ...hold, status: receive ? 'consumed' : 'released', revision: hold.revision + 1 });
      const updated: DealerReturnRecord = { ...record, status: receive ? 'received' : 'rejected', revision: record.revision + 1, receiptEvidenceIds: evidenceIds, receiptReason: reason, ...(receive ? { receivedBy: actor.user.id } : {}) };
      this.store.save('dealer_returns', updated);
      this.entry(actor, restock, { kind: receive ? 'return_received' : 'return_rejected', sourceEntityId: record.id, lines: record.lines, amountSen: 0, evidenceIds, movementIds, reference: reason });
      this.bump(restock); this.store.audit(actor.user.id, `dealer.return_${updated.status}`, record.id, updated.revision);
      return updated;
    });
  }
  createSettlement(actor: Principal, restockId: string, raw: unknown, key: unknown): DealerSettlement {
    this.auth.founder(actor);
    return this.commerce.idem(actor, `dealer.settlement:${restockId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'sellThroughIds', 'evidenceIds']);
      const restock = this.restock(actor, restockId); this.store.revision(restock.revision, input.expectedRevision);
      if (restock.ownership !== 'consigned') fail('CONSIGNMENT_REQUIRED', 409);
      const sellThroughIds = strings(input.sellThroughIds);
      if (!sellThroughIds.length || new Set(sellThroughIds).size !== sellThroughIds.length) fail('SELL_THROUGH_REQUIRED');
      const usedIds = new Set(this.store.all<DealerSettlement>('dealer_settlements').flatMap(settlement => settlement.sellThroughIds));
      const sales = sellThroughIds.map(entryId => {
        const sale = this.store.require<DealerLedgerEntry>('dealer_ledger', entryId);
        if (sale.restockId !== restockId || sale.dealerOrgId !== restock.dealerOrgId || sale.kind !== 'sell_through') fail('SETTLEMENT_SOURCE_SCOPE', 403);
        if (usedIds.has(entryId)) fail('SELL_THROUGH_ALREADY_SETTLED', 409);
        return sale;
      });
      const amountSen = integer(sales.reduce((sum, sale) => sum + sale.amountSen, 0), 'Jumlah settlement', 1, 1_000_000_000), evidenceIds = this.commerce.evidence(actor, input.evidenceIds, restockId, 1);
      const settlement: DealerSettlement = { id: id(), dealerOrgId: restock.dealerOrgId, restockId, sellThroughIds, amountSen, recordedPaidSen: 0, status: 'due', revision: 1, evidenceIds, paymentIds: [], createdAt: now() };
      this.store.save('dealer_settlements', settlement);
      this.entry(actor, restock, { kind: 'settlement_created', sourceEntityId: settlement.id, lines: sales.flatMap(sale => sale.lines), amountSen, evidenceIds, movementIds: [], reference: settlement.id });
      this.bump(restock); this.store.audit(actor.user.id, 'dealer.settlement_created', settlement.id);
      return settlement;
    });
  }
  recordSettlementPayment(actor: Principal, settlementId: string, raw: unknown, key: unknown): DealerSettlementPayment {
    this.auth.founder(actor);
    return this.commerce.idem(actor, `dealer.settlement_payment:${settlementId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'amountSen', 'method', 'reference', 'evidenceIds', 'confirmation']);
      const settlement = this.store.require<DealerSettlement>('dealer_settlements', settlementId), restock = this.restock(actor, settlement.restockId);
      this.store.revision(settlement.revision, input.expectedRevision);
      oneOf(input.confirmation, ['manual_confirmed_receipt'] as const);
      const reference = text(input.reference, 'Rujukan bayaran manual', 200), evidenceIds = this.commerce.evidence(actor, input.evidenceIds, restock.id, 1);
      const existingPayments = this.store.all<DealerSettlementPayment>('dealer_settlement_payments');
      const recordedTotal = existingPayments.filter(payment => payment.settlementId === settlementId).reduce((sum, payment) => sum + payment.amountSen, 0);
      if (recordedTotal !== settlement.recordedPaidSen) fail('SETTLEMENT_TOTAL_CONFLICT', 409);
      if (recordedTotal >= settlement.amountSen) fail('SETTLEMENT_ALREADY_RECORDED', 409);
      const amountSen = integer(input.amountSen, 'Jumlah bayaran', 1, settlement.amountSen - recordedTotal);
      if (existingPayments.some(payment => payment.reference === reference) || this.store.all<PaymentRecord>('payments').some(payment => payment.reference === reference)) fail('PAYMENT_REFERENCE_USED', 409);
      const payment: DealerSettlementPayment = { id: id(), settlementId, restockId: restock.id, dealerOrgId: settlement.dealerOrgId, amountSen, method: oneOf(input.method, ['cash', 'bank'] as const), reference, state: 'recorded_by_user', evidenceIds, recordedBy: actor.user.id, createdAt: now() };
      this.immutable('dealer_settlement_payments', payment);
      const recordedPaidSen = recordedTotal + amountSen;
      this.store.save<DealerSettlement>('dealer_settlements', { ...settlement, recordedPaidSen, status: recordedPaidSen === settlement.amountSen ? 'recorded_by_user' : 'part_recorded', revision: settlement.revision + 1, paymentIds: [...settlement.paymentIds, payment.id] });
      this.entry(actor, restock, { kind: 'payment_recorded', sourceEntityId: payment.id, lines: [], amountSen, evidenceIds, movementIds: [], reference });
      this.store.audit(actor.user.id, 'dealer.payment_recorded_by_user', payment.id);
      return payment;
    });
  }
  terms():DealerTerms{return this.store.get<BusinessSettings>('settings','business')?.approvedPolicies.dealer??fail('DEALER_POLICY_UNAVAILABLE',409,'Polisi dealer belum diluluskan.');}
  applications(actor:Principal){return this.store.all<DealerApplication>('dealer_applications').filter(a=>a.customerId===actor.user.id||this.auth.has(actor,'founder'));}
  apply(actor:Principal,raw:unknown){const input=object(raw);fields(input,['organization','description']);if(this.applications(actor).some(a=>a.customerId===actor.user.id&&a.status==='pending'))fail('APPLICATION_PENDING',409);const record:DealerApplication={id:id(),customerId:actor.user.id,organization:text(input.organization,'Organisasi',200),description:text(input.description,'Penerangan',6000),status:'pending',revision:1,createdAt:now()};this.store.save('dealer_applications',record);this.store.audit(actor.user.id,'dealer.apply',record.id);return record;}
  decide(actor:Principal,applicationId:string,raw:unknown,approve:boolean){this.auth.founder(actor);const input=object(raw);fields(input,['expectedRevision','reason']);const record=this.store.require<DealerApplication>('dealer_applications',applicationId);this.store.revision(record.revision,input.expectedRevision);if(record.status!=='pending')fail('INVALID_TRANSITION',409);if(!approve)text(input.reason,'Sebab penolakan',3000);const organizationId=approve?id():undefined,updated={...record,status:approve?'approved' as const:'rejected' as const,revision:record.revision+1,...(organizationId?{dealerOrgId:organizationId}:{})};this.store.save('dealer_applications',updated);if(organizationId){const current=this.auth.memberships(record.customerId).find(m=>m.role==='customer')!;this.auth.grant(actor,{userId:record.customerId,role:'customer',outletIds:[],dealerOrgId:organizationId,expectedVersion:current.version});}this.store.audit(actor.user.id,'dealer.decide',applicationId,updated.revision);return updated;}
  quote(actor:Principal,raw:unknown){const input=object(raw);fields(input,['dealerOrgId','lines','priceVersion']);const organizationId=text(input.dealerOrgId);this.dealer(actor,organizationId);const terms=this.terms();if(integer(input.priceVersion)!==terms.version)fail('REQUOTE_REQUIRED',409);const lines=this.commerce.lines(input.lines);const quantity=lines.reduce((sum,l)=>sum+l.quantity,0);if(quantity<terms.minimumQuantity||lines.some(l=>l.quantity%terms.packMultiple!==0))fail('DEALER_QUANTITY_POLICY',400);const standard=this.commerce.quote(actor,{lines,catalogueVersion:this.commerce.version()});const quote:VersionedQuote={...standard,id:id(),dealerOrgId:organizationId,priceVersion:terms.version,lines:standard.lines.map(l=>({...l,priceSen:Math.floor(l.priceSen*terms.priceBasisPoints/10000)})),totalSen:0};quote.totalSen=quote.lines.reduce((sum,l)=>sum+l.priceSen*l.quantity,0);this.store.save('quotes',quote);return quote;}
  restocks(actor:Principal){const organizations=this.organizations(actor);return this.store.all<RestockRecord>('restocks').filter(r=>this.auth.has(actor,'founder')||organizations.has(r.dealerOrgId));}
  request(actor:Principal,raw:unknown,key:unknown){const input=object(raw);fields(input,['quoteId']);const quote=this.store.require<VersionedQuote>('quotes',text(input.quoteId));if(!quote.dealerOrgId)fail('INVALID_QUOTE');this.dealer(actor,quote.dealerOrgId);return this.commerce.idem(actor,'restock.request',key,raw,()=>{const terms=this.terms();if(quote.priceVersion!==terms.version||quote.catalogueVersion!==this.commerce.version()||quote.expiresAt<=now())fail('REQUOTE_REQUIRED',409);for(const line of quote.lines)if(this.commerce.available(line.productId)<line.quantity)fail('INSUFFICIENT_STOCK',409);const record:DealerRestockRecord={id:id(),dealerTermsVersion:terms.version,returnRules:terms.returnRules,dealerOrgId:quote.dealerOrgId!,customerId:actor.user.id,quoteId:quote.id,lines:quote.lines,totalSen:quote.totalSen,status:'requested',revision:1,ownership:terms.ownership};this.store.save('restocks',record);for(const line of quote.lines)this.store.save<InventoryReservation>('reservations',{id:id(),orderId:record.id,productId:line.productId,ownerId:'business',locationId:'hq',quantity:line.quantity,status:'active',expiresAt:new Date(Date.now()+24*3600_000).toISOString(),revision:1});this.store.audit(actor.user.id,'restock.request',record.id);return record;});}
  transition(actor:Principal,restockId:string,raw:unknown){this.auth.founder(actor);const input=object(raw);fields(input,['expectedRevision','next','evidenceIds']);const record=this.store.require<DealerRestockRecord>('restocks',restockId);this.store.revision(record.revision,input.expectedRevision);let dispatchAllocations=record.dispatchAllocations;const next=oneOf(input.next,['approved','dispatched','rejected'] as const);if((record.status==='requested'&&!['approved','rejected'].includes(next))||(record.status==='approved'&&next!=='dispatched')||!['requested','approved'].includes(record.status))fail('INVALID_TRANSITION',409);if(next==='dispatched'){this.commerce.evidence(actor,input.evidenceIds,record.id,1);dispatchAllocations=this.commerce.consume({id:record.id,lines:record.lines});}if(next==='approved'){for(const reservation of this.store.all<InventoryReservation>('reservations').filter(r=>r.orderId===record.id&&r.status==='active')){if(reservation.expiresAt<=now())fail('RESERVATION_EXPIRED',409);this.store.save('reservations',{...reservation,expiresAt:'9999-12-31T23:59:59.999Z',revision:reservation.revision+1});}}if(next==='rejected')for(const reservation of this.store.all<InventoryReservation>('reservations').filter(r=>r.orderId===record.id&&r.status==='active'))this.store.save('reservations',{...reservation,status:'released' as const,revision:reservation.revision+1});const updated={...record,...(dispatchAllocations?{dispatchAllocations}:{}),status:next,revision:record.revision+1};this.store.save('restocks',updated);this.store.audit(actor.user.id,`restock.${next}`,restockId,updated.revision);return updated;}
  receive(actor: Principal, restockId: string, raw: unknown, key: unknown): StockReceipt {
    this.restock(actor, restockId);
    return this.commerce.idem(actor, `restock.receive:${restockId}`, key, raw, () => {
      const record = this.restock(actor, restockId), input = object(raw); fields(input, ['expectedRevision', 'lines']);
      this.store.revision(record.revision, input.expectedRevision);
      if (record.status !== 'dispatched') fail('INVALID_TRANSITION', 409);
      const lines = this.commerce.lines(input.lines), receivedQuantities = { ...record.receivedQuantities }, receivedAllocationQuantities = { ...record.receivedAllocationQuantities };
      const movements: string[] = [];
      for (const line of lines) {
        const shipped = record.lines.find(quoted => quoted.productId === line.productId);
        const previousQuantity = receivedQuantities[line.productId] ?? 0;
        if (!shipped || previousQuantity + line.quantity > shipped.quantity) fail('RECEIPT_DISCREPANCY', 409);
        const sources = record.dispatchAllocations?.filter(allocation => allocation.productId === line.productId) ?? [];
        const trackedPreviously = sources.reduce((sum, allocation) => sum + (receivedAllocationQuantities[allocation.sourceLotId] ?? 0), 0);
        let remaining = line.quantity;
        // Older partial receipts cannot be retroactively assigned to a guessed batch.
        if (sources.length && trackedPreviously === previousQuantity) {
          for (const allocation of sources) {
            const consumed = receivedAllocationQuantities[allocation.sourceLotId] ?? 0;
            const quantity = Math.min(remaining, allocation.quantity - consumed);
            if (quantity <= 0) continue;
            movements.push(this.receiveAllocation(record, line.productId, quantity, text(key), allocation));
            receivedAllocationQuantities[allocation.sourceLotId] = consumed + quantity; remaining -= quantity;
            if (!remaining) break;
          }
          if (remaining) fail('DISPATCH_ALLOCATION_CONFLICT', 409);
        } else {
          movements.push(this.receiveAllocation(record, line.productId, remaining, text(key)));
        }
        receivedQuantities[line.productId] = previousQuantity + line.quantity;
      }
      const receipt: StockReceipt = { id: id(), movementIds: movements, receivedAt: now() };
      this.immutable('stock_receipts', receipt);
      const complete = record.lines.every(line => receivedQuantities[line.productId] === line.quantity);
      this.store.save<DealerRestockRecord>('restocks', { ...record, status: complete ? 'received' : 'dispatched', revision: record.revision + 1, receipt, receivedQuantities, receivedAllocationQuantities, receipts: [...(record.receipts ?? []), receipt] });
      this.store.audit(actor.user.id, 'restock.receive', restockId, record.revision + 1);
      return receipt;
    });
  }
  private receiveAllocation(record: DealerRestockRecord, productId: string, quantity: number, key: string, source?: DealerDispatchAllocation): string {
    const ownerId = record.ownership === 'owned' ? record.dealerOrgId : 'business';
    const status = source && source.status === 'available' && (!source.expiryAt || source.expiryAt > now()) ? 'available' : 'quarantine';
    const lot: DealerStockLot = { id: id(), sourceRestockId: record.id, productId, ownerId, locationId: record.dealerOrgId, custodyId: record.dealerOrgId, quantity, status, revision: 1, provenanceStatus: source ? 'verified' : 'unknown', ...(source ? { sourceLotId: source.sourceLotId, ...(source.batchId ? { batchId: source.batchId } : {}), ...(source.expiryAt ? { expiryAt: source.expiryAt } : {}) } : {}) };
    this.store.save('lots', lot);
    const movement: InventoryMovement = { id: id(), productId, ownerId, locationId: record.dealerOrgId, quantityDelta: quantity, operationKey: `receive:${record.id}:${key}:${lot.id}`, sourceEntityId: record.id, createdAt: now() };
    this.immutable('movements', movement);
    return movement.id;
  }
}
