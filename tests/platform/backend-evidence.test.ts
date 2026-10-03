import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('file evidence validates content signature and signed download enforces own entity plus current session',async()=>{
  const {app}=harness(),founder=await user(app,'file-founder',true),customer=await user(app,'file-customer'),other=await user(app,'file-other');
  const product=(await call(app,'/catalogue',{name:'Sos',description:'Sos',priceSen:100,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:product.id,ownerId:'business',locationId:'hq',quantity:1,reason:'Opening',status:'available'},founder,{'Idempotency-Key':'file-opening-01'});
  const order=(await call(app,'/orders',{lines:[{productId:product.id,quantity:1}],catalogueVersion:1,fulfilment:'pickup',contactRef:'HQ'},customer,{'Idempotency-Key':'file-order-001'})).json.data;
  async function upload(file:File){const data=new FormData();data.set('entityId',order.id);data.set('file',file);return app.fetch(new Request('http://localhost:3010/api/platform/evidence/upload',{method:'POST',headers:{Origin:'http://localhost:3000',Cookie:customer.cookie,'X-CSRF-Token':customer.csrf},body:data}));}
  expect((await upload(new File(['malicious contents'],'wrong.png',{type:'image/png'}))).status).toBe(400);
  const response=await upload(new File(['receipt metadata captured manually'],'receipt.txt',{type:'text/plain'}));
  const payload=await response.json();
  expect(response.status,JSON.stringify(payload)).toBe(200);
  const uploaded=payload.data;
  const entries=(await call(app,`/evidence?entityId=${order.id}`,undefined,customer)).json.data;
  const entry=entries.find((e:{id:string})=>e.id===uploaded.id);
  expect(entry.kind).toBe('file');
  expect(entry.downloadUrl).toBeDefined();
  const download=await app.fetch(new Request(`http://localhost:3010${entry.downloadUrl}`,{headers:{Cookie:customer.cookie}}));
  expect(await download.text()).toBe('receipt metadata captured manually');
  expect((await app.fetch(new Request(`http://localhost:3010${entry.downloadUrl}`,{headers:{Cookie:other.cookie}}))).status).toBe(403);
  await call(app,'/auth/logout',{},customer);
  expect((await app.fetch(new Request(`http://localhost:3010${entry.downloadUrl}`,{headers:{Cookie:customer.cookie}}))).status).toBe(401);
});
