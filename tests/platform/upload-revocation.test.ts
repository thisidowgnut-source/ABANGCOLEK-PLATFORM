import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('membership revoked while multipart body streams cannot commit private evidence',async()=>{
  const {app}=harness(),founder=await user(app,'stream-founder',true),customer=await user(app,'stream-customer'),staff=await user(app,'stream-staff');
  const grant=(await call(app,'/people/grants',{userId:staff.userId,role:'staff',outletIds:['hq'],expectedVersion:0},founder)).json.data;
  const product=(await call(app,'/catalogue',{name:'QA',description:'Test',priceSen:100,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:product.id,ownerId:'business',locationId:'hq',quantity:1,status:'available',reason:'Test'},founder);
  const order=(await call(app,'/orders',{lines:[{productId:product.id,quantity:1}],catalogueVersion:1,fulfilment:'pickup',contactRef:'Test'},customer)).json.data;
  const boundary='qa-stream-boundary',bytes=new TextEncoder().encode(`--${boundary}\r\nContent-Disposition: form-data; name="entityId"\r\n\r\n${order.id}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="proof.txt"\r\nContent-Type: text/plain\r\n\r\nTest proof\r\n--${boundary}--\r\n`);
  let streamController!:ReadableStreamDefaultController<Uint8Array>;
  const stream=new ReadableStream<Uint8Array>({start(controller){streamController=controller;controller.enqueue(bytes.slice(0,100));}});
  const pending=app.fetch(new Request('http://localhost:3010/api/platform/evidence/upload',{method:'POST',headers:{Origin:'http://localhost:3000',Cookie:staff.cookie,'X-CSRF-Token':staff.csrf,'Content-Type':`multipart/form-data; boundary=${boundary}`},body:stream,duplex:'half'} as RequestInit & {duplex:string}));
  await call(app,'/people/revoke',{membershipId:grant.id,expectedVersion:grant.version},founder);
  streamController.enqueue(bytes.slice(100));streamController.close();
  expect((await pending).status).toBe(403);expect(app.store.all('evidence')).toHaveLength(0);
});
