import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('expense retry keeps one record and payment evidence and shared references are enforced',async()=>{
  const {app}=harness(),founder=await user(app,'finance-review',true);
  const body={outletId:'hq',amountSen:1000,category:'Test expense',evidenceIds:[]},key={'Idempotency-Key':'expense-review-repeat'};
  const first=await call(app,'/expenses',body,founder,key),retry=await call(app,'/expenses',body,founder,key);
  expect(first.json.data.id).toBe(retry.json.data.id);expect(app.store.all('expenses')).toHaveLength(1);
  const product=(await call(app,'/catalogue',{name:'QA',description:'Test',priceSen:1000,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:product.id,ownerId:'business',locationId:'hq',quantity:2,reason:'Test',status:'available'},founder,{'Idempotency-Key':'finance-review-stock'});
  const order=(await call(app,'/orders',{lines:[{productId:product.id,quantity:1}],catalogueVersion:1,fulfilment:'pickup',contactRef:'Test'},founder,{'Idempotency-Key':'finance-review-order'})).json.data;
  const payment={expectedRevision:1,action:'verify',amountSen:1000,reference:'bank-reference-review',method:'bank'};
  expect((await call(app,`/orders/${order.id}/payment`,payment,founder,{'Idempotency-Key':'finance-review-no-proof'})).json.code).toBe('EVIDENCE_REQUIRED');
  const unrelated=(await call(app,'/evidence',{entityId:'business',name:'Other business proof',mimeType:'text/plain',size:0},founder)).json.data;
  expect((await call(app,`/orders/${order.id}/payment`,{...payment,evidenceIds:[unrelated.id]},founder,{'Idempotency-Key':'finance-review-wrong-proof'})).json.code).toBe('EVIDENCE_SCOPE');
  const evidence=(await call(app,'/evidence',{entityId:order.id,name:'Payment proof',mimeType:'text/plain',size:0},founder)).json.data;
  app.store.save('dealer_settlement_payments',{id:'isolated-prior-receipt',reference:payment.reference});
  expect((await call(app,`/orders/${order.id}/payment`,{...payment,evidenceIds:[evidence.id]},founder,{'Idempotency-Key':'finance-review-used-ref'})).json.code).toBe('PAYMENT_REFERENCE_USED');
});
