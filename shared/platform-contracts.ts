/** Browser-safe public contracts. Authority is resolved by the server for every request. */
export type WorkspaceRole = 'customer' | 'staff' | 'founder' | 'developer';
export type Result<T> = { ok: true; data: T } | { ok: false; code: string; requestId: string; message?: string };
export interface Actor { userId: string; workspaceId: string; membershipVersion: number }
export interface Decision { allowed: boolean; reasonCode: string }
export interface Membership { id: string; userId: string; workspaceId: string; role: WorkspaceRole; outletIds: string[]; dealerOrgId?: string; status: 'active' | 'revoked'; version: number }
export interface SessionData { user: { id: string; email: string; name: string }; memberships: Membership[]; csrfToken: string; capabilities: string[] }
export interface RouteMatch { kind: 'public' | 'workspace' | 'flow' | 'not_found'; path: string; role?: WorkspaceRole; entityId?: string }
export interface NavigationItem { id: string; label: string; path: string; requiredCapability: string }
export type FulfilmentStatus = 'requested' | 'review' | 'accepted' | 'packing' | 'packed' | 'dispatched' | 'received' | 'cancelled';
export type PaymentState = 'pending' | 'verified' | 'refund_requested' | 'part_refunded' | 'refunded' | 'rejected';
export interface PublicProduct { id: string; name: string; description: string; priceSen: number; currency: 'MYR'; packSize: number; publishedVersion: number; availableQuantity: number }
export interface CatalogueProduct extends PublicProduct { revision: number; status: 'draft' | 'published' | 'retired' }
export interface OrderInput { lines: { productId: string; quantity: number }[]; catalogueVersion: number; fulfilment: 'pickup' | 'delivery'; contactRef: string; outletId?: string }
export interface OrderLine { productId: string; name: string; quantity: number; priceSen: number; publishedVersion: number }
export interface OrderRecord { id: string; customerId: string; dealerOrgId?: string; lines: OrderLine[]; amountSen: number; fulfilment: 'pickup' | 'delivery'; contactRef: string; outletId: string; fulfilmentStatus: FulfilmentStatus; revision: number; paymentState: PaymentState; paidAmountSen: number; refundAmountSen: number; createdAt: string; updatedAt: string }
export interface InventoryReservation { id: string; orderId: string; productId: string; ownerId: string; locationId: string; quantity: number; status: 'active' | 'consumed' | 'released' | 'expired'; expiresAt: string; revision: number }
export interface InventoryMovement { id: string; productId: string; ownerId: string; locationId: string; quantityDelta: number; operationKey: string; sourceEntityId: string; createdAt: string }
export interface StockLot { id: string; productId: string; ownerId: string; locationId: string; custodyId: string; quantity: number; status: 'available' | 'quarantine' | 'damaged'; batchId?: string; expiryAt?: string; revision: number }
export interface CaseRecord { id: string; orderId: string; customerId: string; assignedStaffId?: string; status: 'open' | 'investigating' | 'resolved'; revision: number; subject: string; description: string; determination?: string; createdAt: string }
export interface CaseMessage { id: string; caseId: string; authorId: string; body: string; createdAt: string; channel: 'in_app' }
export interface EvidenceRecord { id: string; entityId: string; ownerId: string; mimeType: string; storageRef: string; visibility: 'private' | 'case'; createdAt: string; name: string; size: number; sha256?: string; kind: 'metadata' | 'file' }
export interface JevAssessment { caseId: string; schemaVersion: number; method: string; dimensions: Record<string,string>; evidenceIds: string[]; unknownReasons: string[]; assessedAt: string }
export interface ActionPreview { id: string; entityId: string; operation: string; recipient?: string; revision: number; expiresAt: string; body?: string }
export interface ExecutionReceipt { id: string; requestId: string; status: 'confirmed' | 'failed' | 'unknown'; evidenceIds: string[]; createdAt?: string }
export type FlowIntent = 'order' | 'complaint' | 'dealer_application' | 'restock' | 'stock_receipt';
export interface FlowNode { id: string; kind: 'choice' | 'text' | 'attachment' | 'review' | 'receipt'; field?: string; label?: string; required?: boolean; maxLength?: number; next?: string; options?: { label: string; value: string; next: string }[] }
export interface FlowDefinition { id: string; slug: string; title: string; version: number; entry: string; nodes: FlowNode[]; intent: FlowIntent; audience: WorkspaceRole[]; status: 'draft' | 'published' | 'deprecated' }
export interface FlowSession { id: string; flowId: string; version: number; currentNode: string; revision: number; status: 'draft' | 'submitted' | 'expired'; answers: Record<string,unknown>; expiresAt: string; ownerId: string; reviewVersion?: number; reviewQuote?: VersionedQuote; receipt?: { entityId: string; submittedAt: string } }
export interface SafeDraft { flowId: string; version: number; answers: Record<string,unknown>; updatedAt: string; expiresAt: string }
export interface WorkTaskInput { entityId: string; title: string; assigneeId: string; dueAt?: string; documentIds: string[]; outletId?: string }
export interface TaskRecord extends WorkTaskInput { id: string; ownerId: string; status: 'open' | 'in_progress' | 'done'; revision: number; outcome?: string; createdAt: string }
export interface DocumentRecord { id: string; title: string; body: string; version: number; visibility: 'private' | 'business'; entityIds: string[]; ownerId: string; approvedVersion?: number; createdAt: string }
export interface KnowledgeEntry { id: string; documentId: string; version: number; status: 'draft' | 'review' | 'approved' | 'retired'; sourceRefs: SourceRef[]; expiresAt?: string; approvedBy?: string; title: string; body: string }
export interface CalendarEventRecord { id: string; title: string; entityIds: string[]; ownerId: string; startAt: string; endAt: string; timezone: 'Asia/Kuala_Lumpur'; revision: number; entityLinks?: {id:string;kind:'order'|'case'|'task'|'document'|'campaign'|'restock'|'lot'|'qc'|'shift'|'expense'|'dayclose'|'business';path:string}[] }
export interface QcReading { name: string; value: number; unit: string }
export interface QcRecord { id: string; batchId: string; sopVersion: number; sopId: string; readings: QcReading[]; operatorId: string; outletId: string; status: 'draft' | 'review' | 'released'; revision: number; evidenceIds: string[] }
export interface ShiftRecord { id: string; outletId: string; staffIds: string[]; status: 'open' | 'handoff' | 'closed'; openedAt: string; closedAt?: string; revision: number; openingCount: number; closingCount?: number; handoffNote?: string; acknowledgedBy?: string }
export interface DayCloseRecord { id: string; outletId: string; date: string; expectedCashSen: number; countCashSen: number; paymentRefs: string[]; discrepancySen: number; status: 'draft' | 'review' | 'approved'; revision: number; reason?: string }
export interface ExpenseRecord { id: string; outletId: string; amountSen: number; category: string; evidenceIds: string[]; status: 'draft' | 'approved' | 'rejected'; revision: number; ownerId: string; createdAt: string }
export interface ReconciliationRecord { id: string; period: string; paymentRefs: string[]; expenseRefs: string[]; discrepancies: string[]; status: 'review' | 'approved'; revision: number; sourceHashes?: Record<string,string> }
export interface MembershipChange { userId: string; workspaceId: string; role: WorkspaceRole; scopes: string[]; expectedVersion: number }
export interface SettingChange { key: string; value: unknown; expectedVersion: number }
export interface BusinessSettings { id: string; version: number; approvedPolicies: { dealer?: DealerTerms; paymentInstructions?: string; locations?: { id: string; name: string; address: string; hours: string; verifiedAt: string }[]; contact?: string }; locale: 'ms-MY'; timezone: 'Asia/Kuala_Lumpur' }
export interface DealerTerms { version: number; minimumQuantity: number; packMultiple: number; priceBasisPoints: number; ownership: 'owned' | 'consigned'; returnRules: string; approvedAt: string }
export interface DealerApplication { id: string; customerId: string; organization: string; description: string; status: 'pending' | 'approved' | 'rejected'; revision: number; dealerOrgId?: string; createdAt: string }
export interface RestockInput { dealerOrgId: string; lines: { productId: string; quantity: number }[]; priceVersion: number }
export interface VersionedQuote { id: string; priceVersion: number; catalogueVersion: number; lines: OrderLine[]; totalSen: number; expiresAt: string; dealerOrgId?: string; ownerId: string }
export interface ReceiptInput { shipmentId: string; lines: { productId: string; quantity: number }[]; expectedRevision: number }
export interface StockReceipt { id: string; movementIds: string[]; receivedAt: string }
export interface RestockRecord { id: string; dealerOrgId: string; customerId: string; quoteId: string; lines: OrderLine[]; totalSen: number; status: 'requested' | 'approved' | 'dispatched' | 'received' | 'rejected'; revision: number; ownership: 'owned' | 'consigned'; receipt?: StockReceipt; receivedQuantities?: Record<string,number>; receipts?: StockReceipt[] }
export interface EligiblePaidOrder { orderId: string; paidAmountSen: number; paymentConfirmedAt?: string; refundAmountSen: number; productIds?: string[] }
export interface CommissionPolicy { id: string; version: number; eligibleProductIds: string[]; rateBasisPoints: number; approvedAt: string }
export interface EarnedBenefit { orderId: string; policyVersion: number; amountSen: number; reasonCode: string }
export interface CampaignAsset { id: string; name: string; evidenceId?: string; rights: string; consent: string }
export interface CampaignRecord { id: string; title: string; objective: string; copy: string; status: 'draft' | 'approved' | 'planned' | 'exported'; ownerId: string; revision: number; assets: CampaignAsset[]; productIds: string[]; catalogueVersion: number; scheduledAt?: string; approvedBy?: string; approvalExpiresAt?: string; createdAt: string }
export interface PublishIntent { id: string; campaignId: string; assetVersion: number; channel: string; accountId?: string; scheduledAt?: string; approvalId: string; approvalExpiresAt: string; grantVersion: number; idempotencyKey: string }
export interface PublishOutcome { intentId: string; status: 'published' | 'blocked' | 'unknown'; providerRef?: string; evidenceIds: string[]; reasonCode: string }
export interface CancelOutcome { providerRef: string; status: 'cancelled' | 'cancel_pending' | 'unknown'; evidenceIds: string[] }
export interface ChannelCapability { provider: string; channel: string; accountScope: string; allowedOperations: string[]; verifiedAt: string }
export interface ExportArtifact { id: string; campaignRevision: number; format: 'text' | 'asset_bundle'; fileRefs: string[]; status: 'exported'; content?: string }
export interface SourceRef { url: string; title: string; retrievedAt: string; contentHash?: string; accessMethod: string; termsCheck: string; publishedAt?: string }
export interface ResearchRequest { question: string; allowedSources: string[]; sessionGrantId?: string; maxItems: number }
export interface ResearchBrief { id: string; summary: string; sourceRefs: SourceRef[]; unknownReasons: string[]; retrievedAt: string }
export interface JobInput { kind: 'morning_brief' | 'case_summary' | 'research'; entityId: string; skillVersion: string; scope: string }
export interface JobRecord extends JobInput { id: string; ownerId: string; status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown' | 'blocked'; attempt: number; leaseOwner?: string; leaseUntil?: string; checkpoint?: string; idempotencyKey: string; reasonCode?: string; createdAt: string; result?: AgentResult }
export interface ReadOnlyAgentTask { jobId: string; objective: string; allowedToolIds: string[]; sourceRefs: SourceRef[] }
export interface AgentResult { status: 'completed' | 'partial' | 'unknown' | 'blocked'; artifactIds: string[]; evidenceIds: string[]; unknownReasons: string[] }
export interface WorkEstimate { operation: string; providerId: string; estimatedUnits: number }
export interface UsageSnapshot { providerId: string; observedUnits: number | null; limitUnits: number | null; resetAt?: string; observedAt: string; available: boolean }
export interface RedactedHealth { component: string; status: 'ready' | 'unavailable' | 'degraded'; observedAt: string; reasonCode: string }
export interface ReportDefinition { id: string; metricIds: string[]; filterScope: string; sourceVersion: number }
export interface ReportArtifact { id: string; sourceVersions: Record<string,number>; generatedAt: string; fileRefs: string[] }
export interface PlatformOverview { orders: number; orderValueSen: number; verifiedPaymentSen: number; fulfilledOrders: number; openCases: number; openTasks: number; pendingDealerApplications: number; stockAvailable: number; generatedAt: string; source: 'local_authoritative'; empty: boolean }
