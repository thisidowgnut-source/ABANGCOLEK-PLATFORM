import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('expense evidence attaches to exact record and reopens prior approval; unrelated QC evidence cannot release batch',async()=>{
  const {app}=harness(),founder=await user(app,'boundary-founder',true);
  const expense=(await call(app,'/expenses',{outletId:'hq',amountSen:150,category:'Operational purchase',evidenceIds:[]},founder)).json.data;
  await call(app,'/evidence',{entityId:expense.id,name:'Supplier receipt',mimeType:'text/plain',size:0},founder);
  const updated=(await call(app,'/expenses',undefined,founder)).json.data[0];
  expect(updated.evidenceIds).toHaveLength(1);
  expect((await call(app,`/expenses/${expense.id}/approve`,{expectedRevision:updated.revision},founder)).response.status).toBe(200);
  await call(app,'/evidence',{entityId:expense.id,name:'Correction receipt',mimeType:'text/plain',size:0},founder);
  expect((await call(app,'/expenses',undefined,founder)).json.data[0].status).toBe('draft');
  const proof=(await call(app,'/evidence',{entityId:'business',name:'Unrelated board note',mimeType:'text/plain',size:0},founder)).json.data;
  const doc=(await call(app,'/documents',{title:'SOP',body:'Real packaging test requirements',visibility:'business',entityIds:[]},founder)).json.data;
  const knowledge=(await call(app,`/documents/${doc.id}/publish`,{expectedVersion:1},founder)).json.data;
  const sop=(await call(app,'/qc/sops',{knowledgeId:knowledge.id,readings:[{name:'pack count',unit:'count',minimum:1,maximum:1}]},founder)).json.data;
  expect((await call(app,'/qc',{batchId:'unrelated-batch',sopId:sop.id,sopVersion:1,outletId:'hq',readings:[{name:'pack count',value:1,unit:'count'}],evidenceIds:[proof.id]},founder)).json.code).toBe('QC_EVIDENCE_SCOPE');
});
test('revoked founder cannot replay privileged idempotent mutation',async()=>{
  const {app}=harness(),founder=await user(app,'revoke-founder',true),second=await user(app,'revoke-second');
  const member=(await call(app,'/people/grants',{userId:second.userId,role:'founder',outletIds:['hq'],expectedVersion:0},founder)).json.data;
  const product=(await call(app,'/catalogue',{name:'Sos',description:'Sos',priceSen:100,packSize:1,publish:true},founder)).json.data;
  const body={productId:product.id,ownerId:'business',locationId:'hq',quantity:1,reason:'Real opening count',status:'available'};
  expect((await call(app,'/inventory/receive',body,second,{'Idempotency-Key':'revoked-stock-retry'})).response.status).toBe(200);
  await call(app,'/people/revoke',{membershipId:member.id,expectedVersion:1},founder);
  expect((await call(app,'/inventory/receive',body,second,{'Idempotency-Key':'revoked-stock-retry'})).response.status).toBe(403);
});
