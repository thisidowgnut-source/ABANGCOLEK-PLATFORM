import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';
import { calculateEarnedBenefit } from '../../server/platform/dealers';
import { admitWork } from '../../server/automation/jobs';

test('verified cash, fulfilment evidence and refund truth persist independently; developer cannot approve payment',async()=>{
  const {app}=harness(),founder=await user(app,'life-founder',true),customer=await user(app,'life-customer'),developer=await user(app,'life-dev');
  await call(app,'/people/grants',{userId:developer.userId,role:'developer',outletIds:[],expectedVersion:0},founder);
  const p=(await call(app,'/catalogue',{name:'Sos',description:'Sos',priceSen:1500,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:p.id,ownerId:'business',locationId:'hq',quantity:2,reason:'Verified count',status:'available'},founder,{'Idempotency-Key':'lifecycle-opening'});
  let order=(await call(app,'/orders',{lines:[{productId:p.id,quantity:1}],catalogueVersion:1,fulfilment:'pickup',contactRef:'Own pickup'},customer,{'Idempotency-Key':'lifecycle-order'})).json.data;
  order=(await call(app,`/orders/${order.id}/transition`,{expectedRevision:1,next:'review'},founder)).json.data;
  expect((await call(app,`/orders/${order.id}/transition`,{expectedRevision:2,next:'accepted'},founder)).json.code).toBe('PAYMENT_NOT_VERIFIED');
  const proof=(await call(app,'/evidence',{entityId:order.id,name:'Counter handoff log',mimeType:'text/plain',size:0},founder)).json.data;
  const body={expectedRevision:2,action:'verify',amountSen:1500,reference:'actual-cash-handoff-001',method:'cash',evidenceIds:[proof.id]};
  expect((await call(app,`/orders/${order.id}/payment`,body,developer,{'Idempotency-Key':'dev-denied-payment'})).response.status).toBe(403);
  order=(await call(app,`/orders/${order.id}/payment`,body,founder,{'Idempotency-Key':'founder-confirm-payment'})).json.data;
  for(const next of ['accepted','packing','packed','dispatched','received'])order=(await call(app,`/orders/${order.id}/transition`,{expectedRevision:order.revision,next,evidenceIds:[proof.id]},founder)).json.data;
  expect(order.fulfilmentStatus).toBe('received');
  order=(await call(app,`/orders/${order.id}/payment`,{expectedRevision:order.revision,action:'request_refund'},customer,{'Idempotency-Key':'refund-request-001'})).json.data;
  order=(await call(app,`/orders/${order.id}/payment`,{expectedRevision:order.revision,action:'refund',amountSen:500,reference:'actual-cash-refund-001',method:'cash',evidenceIds:[proof.id]},founder,{'Idempotency-Key':'refund-confirm-001'})).json.data;
  expect(order.paymentState).toBe('part_refunded');expect(order.fulfilmentStatus).toBe('received');
  const inventory=(await call(app,'/inventory',undefined,founder)).json.data;
  expect(inventory.lots.reduce((sum:number,l:{quantity:number})=>sum+l.quantity,0)).toBe(1);
  const report=(await call(app,'/reports/export?kind=orders',undefined,founder)).json.data;
  expect(report.recordCount).toBe(1);expect(report.content).toContain('part_refunded');
  expect((await call(app,'/reports/export?kind=orders',undefined,developer)).response.status).toBe(403);
  expect((await call(app,'/legacy-ai/v1beta/models/gemini-2.5-flash:generateContent',{contents:[]},founder)).json.code).toBe('LEGACY_AI_DISABLED');
});

test('partial dealer receiving is durable, consigned stock retains business owner, and double retry cannot add units',async()=>{
  const {app}=harness(),founder=await user(app,'dealer-founder',true),dealer=await user(app,'dealer-customer'),outsider=await user(app,'dealer-outsider');
  await call(app,'/settings',{expectedVersion:0,dealerTerms:{minimumQuantity:1,packMultiple:1,priceBasisPoints:10000,ownership:'consigned',returnRules:'Written commercial terms approved by founder'}},founder);
  const product=(await call(app,'/catalogue',{name:'Sos',description:'Sos',priceSen:1000,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:product.id,ownerId:'business',locationId:'hq',quantity:4,reason:'Opening count',status:'available'},founder,{'Idempotency-Key':'dealer-stock-opening'});
  const application=(await call(app,'/dealer/applications',{organization:'Retail shop',description:'Actual outlet application'},dealer)).json.data;
  const approved=(await call(app,`/dealer/applications/${application.id}/approve`,{expectedRevision:1},founder)).json.data;
  const quote=(await call(app,'/dealer/quotes',{dealerOrgId:approved.dealerOrgId,lines:[{productId:product.id,quantity:2}],priceVersion:1},dealer)).json.data;
  expect((await call(app,'/dealer/quotes',{dealerOrgId:approved.dealerOrgId,lines:[{productId:product.id,quantity:1}],priceVersion:1},outsider)).response.status).toBe(403);
  let restock=(await call(app,'/dealer/restocks',{quoteId:quote.id},dealer,{'Idempotency-Key':'dealer-restock-01'})).json.data;
  restock=(await call(app,`/dealer/restocks/${restock.id}/transition`,{expectedRevision:1,next:'approved'},founder)).json.data;
  const proof=(await call(app,'/evidence',{entityId:restock.id,name:'Dispatch manifest',mimeType:'text/plain',size:0},founder)).json.data;
  restock=(await call(app,`/dealer/restocks/${restock.id}/transition`,{expectedRevision:2,next:'dispatched',evidenceIds:[proof.id]},founder)).json.data;
  const receiptBody={expectedRevision:restock.revision,lines:[{productId:product.id,quantity:1}]};
  const receipt=(await call(app,`/dealer/restocks/${restock.id}/receive`,receiptBody,dealer,{'Idempotency-Key':'dealer-partial-receipt'})).json.data;
  expect((await call(app,`/dealer/restocks/${restock.id}/receive`,receiptBody,dealer,{'Idempotency-Key':'dealer-partial-receipt'})).json.data.id).toBe(receipt.id);
  const inventory=(await call(app,'/inventory',undefined,dealer)).json.data;
  expect(inventory.lots[0].ownerId).toBe('business');expect(inventory.lots[0].custodyId).toBe(approved.dealerOrgId);expect(inventory.lots[0].quantity).toBe(1);
  const partial=(await call(app,'/dealer/restocks',undefined,dealer)).json.data[0];expect(partial.status).toBe('dispatched');expect(partial.receivedQuantities[product.id]).toBe(1);
  expect((await call(app,'/inventory',undefined,outsider)).json.data.lots).toEqual([]);
});

test('QC requires current approved structured SOP and does not release from missing or stale readings',async()=>{
  const {app}=harness(),founder=await user(app,'qc-founder',true),staff=await user(app,'qc-staff'),outside=await user(app,'qc-outside');
  await call(app,'/people/grants',{userId:staff.userId,role:'staff',outletIds:['hq'],expectedVersion:0},founder);
  await call(app,'/people/grants',{userId:outside.userId,role:'staff',outletIds:['other'],expectedVersion:0},founder);
  const p=(await call(app,'/catalogue',{name:'Sos',description:'Sos',priceSen:100,packSize:1,publish:true},founder)).json.data;
  const lot=(await call(app,'/inventory/receive',{productId:p.id,ownerId:'business',locationId:'hq',quantity:1,reason:'Awaiting packaging QC',status:'quarantine',batchId:'real-batch-1'},founder,{'Idempotency-Key':'qc-opening-stock'})).json.data;
  const doc=(await call(app,'/documents',{title:'Verified packaging SOP',body:'Packaging checklist approved by founder',visibility:'business',entityIds:[]},founder)).json.data;
  const knowledge=(await call(app,`/documents/${doc.id}/publish`,{expectedVersion:1},founder)).json.data;
  const sop=(await call(app,'/qc/sops',{knowledgeId:knowledge.id,readings:[{name:'intact seals',unit:'count',minimum:1,maximum:1}]},founder)).json.data;
  const proof=(await call(app,'/evidence',{entityId:lot.id,name:'Packaging inspection note',mimeType:'text/plain',size:0},staff)).json.data;
  const qc=(await call(app,'/qc',{batchId:'real-batch-1',sopId:sop.id,sopVersion:1,outletId:'hq',readings:[],evidenceIds:[proof.id]},staff)).json.data;
  expect((await call(app,`/qc/${qc.id}/release`,{expectedRevision:1},founder)).json.code).toBe('QC_READING_FAILED');
  expect((await call(app,'/qc',{batchId:'real-batch-1',sopId:sop.id,sopVersion:1,outletId:'hq',readings:[{name:'intact seals',value:1,unit:'count'}],evidenceIds:[proof.id]},outside)).response.status).toBe(403);
  const valid=(await call(app,'/qc',{batchId:'real-batch-1',sopId:sop.id,sopVersion:1,outletId:'hq',readings:[{name:'intact seals',value:1,unit:'count'}],evidenceIds:[proof.id]},staff)).json.data;
  await call(app,`/knowledge/${knowledge.id}/retire`,{expectedVersion:1},founder);
  expect((await call(app,`/qc/${valid.id}/release`,{expectedRevision:1},founder)).json.code).toBe('SOP_NOT_APPROVED');
  expect((await call(app,'/catalogue')).json.data[0].availableQuantity).toBe(0);
});

test('unknown quotas and unconfirmed benefits deny authority; expenses require evidence and exports neutralize formulas',async()=>{
  expect(admitWork({operation:'AI',providerId:'nim',estimatedUnits:1},{providerId:'nim',observedUnits:null,limitUnits:null,observedAt:new Date().toISOString(),available:false}).allowed).toBe(false);
  expect(calculateEarnedBenefit({orderId:'unpaid',paidAmountSen:1000,refundAmountSen:0,productIds:['p']},{id:'policy',version:1,eligibleProductIds:['p'],rateBasisPoints:100,approvedAt:new Date().toISOString()}).amountSen).toBe(0);
  const {app}=harness(),founder=await user(app,'finance-founder',true);
  const expense=(await call(app,'/expenses',{outletId:'hq',amountSen:100,category:'=IMPORTDATA("hostile")',evidenceIds:[]},founder)).json.data;
  expect((await call(app,`/expenses/${expense.id}/approve`,{expectedRevision:1},founder)).json.code).toBe('EVIDENCE_REQUIRED');
  const reconcile=(await call(app,'/reconciliations',{period:'2026-10',paymentRefs:['screenshot-id'],expenseRefs:[expense.id]},founder)).json.data;
  expect(reconcile.discrepancies).toHaveLength(2);
  expect((await call(app,`/reconciliations/${reconcile.id}/approve`,{expectedRevision:1,reason:'Override'},founder)).json.code).toBe('RECONCILIATION_DISCREPANCY');
  expect((await call(app,'/reports/export?kind=expenses',undefined,founder)).json.data.content).toContain("'=IMPORTDATA");
});
