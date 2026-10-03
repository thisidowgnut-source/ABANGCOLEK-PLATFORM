import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';
test('dealer attribution comes from membership and a real fulfilled net payment earns a derived benefit',async()=>{
  const {app}=harness(),founder=await user(app,'benefit-founder',true),dealer=await user(app,'benefit-dealer');
  const application=(await call(app,'/dealer/applications',{organization:'Test retailer',description:'Test business'},dealer)).json.data;
  const approved=(await call(app,`/dealer/applications/${application.id}/approve`,{expectedRevision:1},founder)).json.data;
  const product=(await call(app,'/catalogue',{name:'QA',description:'Test',priceSen:1000,packSize:1,publish:true},founder)).json.data;
  await call(app,'/dealer/commission-policies',{expectedVersion:0,eligibleProductIds:[product.id],rateBasisPoints:1000},founder);
  await call(app,'/inventory/receive',{productId:product.id,quantity:1,ownerId:'business',locationId:'hq',status:'available',reason:'Test'},founder,{'Idempotency-Key':'benefit-opening-stock'});
  let order=(await call(app,'/orders',{lines:[{productId:product.id,quantity:1}],catalogueVersion:1,fulfilment:'pickup',contactRef:'Test'},dealer,{'Idempotency-Key':'benefit-real-order'})).json.data;
  expect(order.dealerOrgId).toBe(approved.dealerOrgId);
  const evidence=(await call(app,'/evidence',{entityId:order.id,name:'Confirmed test receipt',mimeType:'text/plain',size:0},founder)).json.data;
  order=(await call(app,`/orders/${order.id}/payment`,{expectedRevision:order.revision,action:'verify',amountSen:1000,reference:'test-confirmed-payment',method:'cash',evidenceIds:[evidence.id]},founder,{'Idempotency-Key':'benefit-confirmed-payment'})).json.data;
  for(const next of ['review','accepted','packing','packed','dispatched','received']){
    const result=await call(app,`/orders/${order.id}/transition`,{expectedRevision:order.revision,next,evidenceIds:[evidence.id]},founder);expect(result.response.status).toBe(200);order=result.json.data;
  }
  const benefits=(await call(app,'/dealer/benefits',undefined,dealer)).json.data;
  expect(benefits[0]).toMatchObject({orderId:order.id,amountSen:100,status:'derived_not_paid'});
  await call(app,`/orders/${order.id}/payment`,{expectedRevision:order.revision,action:'refund',amountSen:500,reference:'test-confirmed-refund',method:'cash',evidenceIds:[evidence.id]},founder,{'Idempotency-Key':'benefit-confirmed-refund'});
  expect((await call(app,'/dealer/benefits',undefined,dealer)).json.data[0].amountSen).toBe(50);
});
