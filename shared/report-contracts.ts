export type ReportKind='orders'|'tasks'|'expenses'|'payments'|'stock';
export interface ReportFilter{kind:ReportKind;from?:string;to?:string;outletId?:string;dealerOrgId?:string}
export interface SavedReportDefinition extends ReportFilter{id:string;title:string;revision:number;createdAt:string}
export interface BuiltReport{content:string;format:'csv'|'html';filename:string;recordCount:number;generatedAt:string;sourceVersions:Record<string,number>;metrics:{orderValueSen:number;confirmedReceiptsSen:number;refundSen:number;approvedExpensesSen:number};metricScope:string}
export interface DerivedCalendarEvent{id:string;entityId:string;sourceKind:'task'|'campaign'|'shift';title:string;startAt:string;endAt?:string;sourceRevision:number;path:string}
export interface FinanceSummary {
  confirmedReceiptsSen: number;
  refundSen: number;
  netConfirmedReceiptsSen: number;
  receivablesSen: number;
  approvedExpensesSen: number;
  manualDealerReceiptsSen: number;
  sourceCounts: { orders: number; paymentRecords: number; approvedExpenses: number; manualDealerReceipts: number };
  generatedAt: string;
  scope: 'all_authorized_records';
}
export interface AssignedTaskSummary { totalAssignedTasks: number; openAssignedTasks: number; completedAssignedTasks: number; generatedAt: string }
