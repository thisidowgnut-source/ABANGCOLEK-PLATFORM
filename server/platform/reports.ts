import type { CatalogueProduct, PublicProduct, OrderRecord,TaskRecord,ExpenseRecord,CampaignRecord,ShiftRecord,InventoryMovement } from '../../shared/platform-contracts';
import type { AssignedTaskSummary, FinanceSummary, BuiltReport,DerivedCalendarEvent,ReportFilter,ReportKind,SavedReportDefinition } from '../../shared/report-contracts';
import type { DealerSettlementPayment } from '../../shared/dealer-contracts';
import { Auth,type Principal } from './auth';
import { Commerce,type PaymentRecord } from './commerce';
import { Work } from './work';
import { fields,fail,id,integer,now,object,oneOf,PlatformStore,text } from './store';

const kinds:ReportKind[]=['orders','tasks','expenses','payments','stock'];
const html=(value:unknown)=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const csv=(value:unknown)=>{const raw=String(value??''),safe=/^\s*[=+@-]/.test(raw)?"'"+raw:raw;return '"'+safe.replaceAll('"','""')+'"';};
function boundary(raw:string,end=false){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))fail('INVALID_REPORT_DATE');
  const value=new Date(raw+'T00:00:00+08:00');
  if(!Number.isFinite(value.getTime())||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).format(value)!==raw)fail('INVALID_REPORT_DATE');
  return value.getTime()+(end?24*3600_000:0);
}

export class Reports{
  constructor(readonly store:PlatformStore,readonly auth:Auth,readonly commerce:Commerce,readonly work:Work){}
  financeSummary(actor: Principal): FinanceSummary {
    this.auth.founder(actor);
    return this.store.atomic(() => {
      const orders = this.commerce.orders(actor), orderIds = new Set(orders.map(order => order.id));
      const payments = this.store.all<PaymentRecord>('payments').filter(payment => orderIds.has(payment.orderId));
      const expenses = this.store.all<ExpenseRecord>('expenses').filter(expense => expense.status === 'approved');
      const manual = this.store.all<DealerSettlementPayment>('dealer_settlement_payments').filter(payment => payment.state === 'recorded_by_user');
      const sum = (amounts: number[]) => amounts.reduce((total, amount) => integer(total + integer(amount, 'Source amount', 0, Number.MAX_SAFE_INTEGER), 'Aggregate amount', 0, Number.MAX_SAFE_INTEGER), 0);
      const confirmed = payments.filter(payment => payment.state === 'confirmed'), refunds = payments.filter(payment => payment.state === 'refunded');
      const confirmedReceiptsSen = sum(confirmed.map(payment => payment.amountSen)), refundSen = sum(refunds.map(payment => payment.amountSen));
      const paidByOrder = new Map<string, number>();
      for (const payment of confirmed) paidByOrder.set(payment.orderId, sum([paidByOrder.get(payment.orderId) ?? 0, payment.amountSen]));
      // Receivables use gross confirmed allocations; refunds do not silently reopen an invoice.
      const receivablesSen = sum(orders.filter(order => order.fulfilmentStatus !== 'cancelled').map(order => Math.max(0, integer(order.amountSen, 'Order amount', 0, Number.MAX_SAFE_INTEGER) - (paidByOrder.get(order.id) ?? 0))));
      return { confirmedReceiptsSen, refundSen, netConfirmedReceiptsSen: confirmedReceiptsSen - refundSen, receivablesSen, approvedExpensesSen: sum(expenses.map(expense => expense.amountSen)), manualDealerReceiptsSen: sum(manual.map(payment => payment.amountSen)), sourceCounts: { orders: orders.length, paymentRecords: payments.length, approvedExpenses: expenses.length, manualDealerReceipts: manual.length }, generatedAt: now(), scope: 'all_authorized_records' };
    });
  }
  taskSummary(actor: Principal): AssignedTaskSummary {
    const tasks = this.work.tasks(actor).filter(task => task.assigneeId === actor.user.id);
    return { totalAssignedTasks: tasks.length, openAssignedTasks: tasks.filter(task => task.status !== 'done').length, completedAssignedTasks: tasks.filter(task => task.status === 'done').length, generatedAt: now() };
  }
  publishedProduct(productId: string): PublicProduct {
    const product = this.store.get<CatalogueProduct>('catalogue', text(productId, 'Produk', 120));
    if (!product || product.status !== 'published') fail('NOT_FOUND', 404, 'Produk published tidak ditemui.');
    return { id: product.id, name: product.name, description: product.description, priceSen: product.priceSen, currency: product.currency, packSize: product.packSize, publishedVersion: this.commerce.version(), availableQuantity: this.commerce.available(product.id) };
  }
  filters(raw:unknown):ReportFilter{
    const input=object(raw),kind=oneOf(input.kind,kinds),filter:ReportFilter={kind};
    for(const key of ['from','to','outletId','dealerOrgId'] as const)if(input[key]!==undefined&&input[key]!=='')filter[key]=text(input[key],key,120);
    if(filter.from)boundary(filter.from);if(filter.to)boundary(filter.to,true);
    if(filter.from&&filter.to&&boundary(filter.from)>=boundary(filter.to,true))fail('INVALID_REPORT_RANGE');
    if(filter.dealerOrgId&&kind!=='orders'&&kind!=='payments')fail('UNSUPPORTED_REPORT_FILTER',400,'Dealer filter tersedia untuk orders dan payments.');
    if(filter.outletId&&kind==='stock')fail('UNSUPPORTED_REPORT_FILTER',400,'Stock menggunakan lokasi fizikal; gunakan stock ledger.');
    return filter;
  }
  definitions(actor:Principal){this.auth.founder(actor);return this.store.all<SavedReportDefinition>('report_definitions');}
  save(actor:Principal,raw:unknown,recordId?:string){
    this.auth.founder(actor);const input=object(raw);fields(input,['title','kind','from','to','outletId','dealerOrgId','expectedRevision']);
    const previous=recordId?this.store.require<SavedReportDefinition>('report_definitions',recordId):null;
    if(previous)this.store.revision(previous.revision,input.expectedRevision);
    const record:SavedReportDefinition={...this.filters(input),id:previous?.id??id(),title:text(input.title,'Report title',180),revision:(previous?.revision??0)+1,createdAt:previous?.createdAt??now()};
    this.store.save('report_definitions',record);this.store.audit(actor.user.id,'report.definition_save',record.id,record.revision);return record;
  }
  build(actor:Principal,raw:unknown,format:'csv'|'html'='csv'):BuiltReport{
    this.auth.founder(actor);const filter=this.filters(raw),from=filter.from?boundary(filter.from):-Infinity,to=filter.to?boundary(filter.to,true):Infinity;
    const eligible=(record:{createdAt:string;outletId?:string;dealerOrgId?:string})=>Date.parse(record.createdAt)>=from&&Date.parse(record.createdAt)<to&&(!filter.outletId||record.outletId===filter.outletId)&&(!filter.dealerOrgId||record.dealerOrgId===filter.dealerOrgId);
    const orders=this.commerce.orders(actor),orderMap=new Map(orders.map(order=>[order.id,order]));
    let rows:Record<string,unknown>[]=[];
    const metrics={orderValueSen:0,confirmedReceiptsSen:0,refundSen:0,approvedExpensesSen:0};
    if(filter.kind==='orders'){
      const selected=orders.filter(eligible);metrics.orderValueSen=selected.filter(order=>order.fulfilmentStatus!=='cancelled').reduce((sum,order)=>sum+order.amountSen,0);metrics.confirmedReceiptsSen=selected.reduce((sum,order)=>sum+order.paidAmountSen,0);metrics.refundSen=selected.reduce((sum,order)=>sum+order.refundAmountSen,0);
      rows=selected.map(order=>({id:order.id,createdAt:order.createdAt,outletId:order.outletId,dealerOrgId:order.dealerOrgId??'',amountSen:order.amountSen,paidAmountSen:order.paidAmountSen,refundAmountSen:order.refundAmountSen,paymentState:order.paymentState,fulfilmentStatus:order.fulfilmentStatus,revision:order.revision}));
    }else if(filter.kind==='tasks')rows=this.work.tasks(actor).filter(eligible).map(task=>({id:task.id,title:task.title,status:task.status,outletId:task.outletId??'',assigneeId:task.assigneeId,dueAt:task.dueAt??'',outcome:task.outcome??'',createdAt:task.createdAt,revision:task.revision}));
    else if(filter.kind==='expenses'){
      const selected=this.store.all<ExpenseRecord>('expenses').filter(eligible);metrics.approvedExpensesSen=selected.filter(record=>record.status==='approved').reduce((sum,record)=>sum+record.amountSen,0);rows=selected.map(record=>({id:record.id,outletId:record.outletId,amountSen:record.amountSen,category:record.category,status:record.status,evidenceIds:record.evidenceIds.join('|'),createdAt:record.createdAt,revision:record.revision}));
    }else if(filter.kind==='payments'){
      const selected=this.store.all<PaymentRecord>('payments').filter(payment=>{const order=orderMap.get(payment.orderId);return order&&eligible({...payment,outletId:order.outletId,dealerOrgId:order.dealerOrgId});});
      rows=selected.map(payment=>({...payment}));
      metrics.confirmedReceiptsSen=selected.filter(payment=>payment.state==='confirmed').reduce((sum,payment)=>sum+payment.amountSen,0);metrics.refundSen=selected.filter(payment=>payment.state==='refunded').reduce((sum,payment)=>sum+payment.amountSen,0);
    }else rows=this.store.all<InventoryMovement>('movements').filter(eligible).map(record=>({...record}));
    rows.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))||String(a.id).localeCompare(String(b.id)));
    const columns=Object.keys(rows[0]??{id:'',createdAt:''}),generatedAt=now(),sourceVersions=Object.fromEntries(rows.map(row=>[String(row.id),Number(row.revision??1)]));
    const metricScope=filter.kind==='orders'?'Order creation cohort in MYT; receipts and refunds are cumulative for these orders. This is not period cash flow or profit.':'Eligible immutable transaction rows in the selected MYT period. Amounts are integer sen; no profit estimate.';
    const content=format==='csv'?[columns.map(csv).join(','),...rows.map(row=>columns.map(column=>csv(row[column])).join(','))].join('\r\n'):
      '<!doctype html><html lang="ms"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>ABANGCOLEK Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#181818}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ddd;padding:8px;text-align:left;overflow-wrap:anywhere}th{background:#eee}@media print{body{padding:0}}</style></head><body><h1>ABANGCOLEK · '+html(filter.kind)+'</h1><p>'+html(generatedAt)+' · '+rows.length+' source rows</p><p>'+html(metricScope)+'</p><table><thead><tr>'+columns.map(column=>'<th>'+html(column)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+columns.map(column=>'<td>'+html(row[column])+'</td>').join('')+'</tr>').join('')+'</tbody></table></body></html>';
    return {content,format,filename:`abangcolek-${filter.kind}-${generatedAt.slice(0,10)}.${format}`,recordCount:rows.length,generatedAt,sourceVersions,metrics,metricScope};
  }
  calendar(actor:Principal):DerivedCalendarEvent[]{
    this.work.staff(actor);const role=this.auth.has(actor,'founder')?'founder':'staff',events:DerivedCalendarEvent[]=[];
    for(const task of this.work.tasks(actor))if(task.dueAt)events.push({id:'task:'+task.id,entityId:task.id,sourceKind:'task',title:task.title,startAt:task.dueAt,sourceRevision:task.revision,path:`/${role}/tasks`});
    if(role==='founder')for(const campaign of this.store.all<CampaignRecord>('campaigns'))if(campaign.scheduledAt)events.push({id:'campaign:'+campaign.id,entityId:campaign.id,sourceKind:'campaign',title:campaign.title,startAt:campaign.scheduledAt,sourceRevision:campaign.revision,path:'/founder/marketing'});
    for(const shift of this.store.all<ShiftRecord>('shifts'))if(role==='founder'||actor.memberships.some(member=>member.role==='staff'&&member.outletIds.includes(shift.outletId)))events.push({id:'shift:'+shift.id,entityId:shift.id,sourceKind:'shift',title:'Shift · '+shift.outletId,startAt:shift.openedAt,...(shift.closedAt?{endAt:shift.closedAt}:{}),sourceRevision:shift.revision,path:`/${role}/shifts`});
    return events.sort((a,b)=>a.startAt.localeCompare(b.startAt));
  }
}
