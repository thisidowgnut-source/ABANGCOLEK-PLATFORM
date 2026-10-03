import type { EarnedBenefit, InventoryMovement, InventoryReservation, OrderLine, RestockRecord, StockLot } from './platform-contracts';

/** Receipt provenance is additive; owner and custody remain the canonical stock fields. */
export interface DealerDispatchAllocation { sourceLotId: string; productId: string; quantity: number; batchId?: string; expiryAt?: string; status: StockLot['status'] }
export interface DealerStockLot extends StockLot { sourceRestockId: string; sourceLotId?: string; provenanceStatus?: 'verified' | 'unknown' }
export interface DealerRestockRecord extends RestockRecord { dealerTermsVersion?: number; returnRules?: string; dispatchAllocations?: DealerDispatchAllocation[]; receivedAllocationQuantities?: Record<string, number> }
export interface DealerReturnAllocation { lotId: string; sourceLotId?: string; productId: string; quantity: number; batchId?: string; expiryAt?: string; provenanceStatus: 'verified' | 'unknown' }
export interface DealerLedgerEntry {
  id: string;
  dealerOrgId: string;
  restockId: string;
  kind: 'sell_through' | 'return_requested' | 'return_received' | 'return_rejected' | 'settlement_created' | 'payment_recorded';
  sourceEntityId: string;
  sourceRevision: number;
  lines: OrderLine[];
  amountSen: number;
  evidenceIds: string[];
  movementIds: string[];
  actorId: string;
  reference: string;
  createdAt: string;
}
export interface DealerReturnRecord {
  id: string;
  restockId: string;
  dealerOrgId: string;
  lines: OrderLine[];
  status: 'requested' | 'received' | 'rejected';
  allocations?: DealerReturnAllocation[];
  reason: string;
  evidenceIds: string[];
  receiptEvidenceIds?: string[];
  receiptReason?: string;
  revision: number;
  requestedBy: string;
  receivedBy?: string;
  createdAt: string;
}
export interface DealerSettlement {
  id: string;
  dealerOrgId: string;
  restockId: string;
  sellThroughIds: string[];
  amountSen: number;
  recordedPaidSen: number;
  status: 'due' | 'part_recorded' | 'recorded_by_user';
  revision: number;
  evidenceIds: string[];
  paymentIds: string[];
  createdAt: string;
}
/** An explicit manual attestation; it never claims bank/provider verification. */
export interface DealerSettlementPayment {
  id: string;
  settlementId: string;
  restockId: string;
  dealerOrgId: string;
  amountSen: number;
  method: 'cash' | 'bank';
  reference: string;
  state: 'recorded_by_user';
  evidenceIds: string[];
  recordedBy: string;
  createdAt: string;
}
export interface DealerBenefit extends EarnedBenefit {
  id: string;
  dealerOrgId: string;
  orderRevision: number;
  paymentId: string | null;
  policyId: string | null;
  generatedAt: string;
  status: 'derived_not_paid';
}
export interface DealerLedger {
  entries: DealerLedgerEntry[];
  returns: DealerReturnRecord[];
  settlements: DealerSettlement[];
  payments: DealerSettlementPayment[];
  lots: DealerStockLot[];
  movements: InventoryMovement[];
  reservations: (InventoryReservation & { sourceRestockId: string; custodyLotId?: string })[];
}
