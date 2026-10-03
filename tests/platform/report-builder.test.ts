import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('report filters use MYT boundaries, full canonical rows and safe HTML/CSV',async()=>{
  const {app}=harness(),founder=await user(app,'reports',true),customer=await user(app,'reports-customer');
  for(let index=0;index<102;index++)app.store.save('orders',{id:`qa-${index}`,customerId:customer.userId,outletId:'hq',dealerOrgId:'dealer-a',createdAt:'2026-10-01T16:30:00.000Z',revision:1,amountSen:100,paidAmountSen:100,refundAmountSen:20,fulfilmentStatus:'received',paymentState:'part_refunded',lines:[]});
  const result=await call(app,'/reports/build?kind=orders&from=2026-10-02&to=2026-10-02&format=html',undefined,founder);
  expect(result.response.status).toBe(200);expect(result.json.data.recordCount).toBe(102);expect(result.json.data.metrics.orderValueSen).toBe(10200);expect(result.json.data.metrics.refundSen).toBe(2040);
  expect((await call(app,'/reports/build?kind=orders&from=2026-10-01&to=2026-10-01',undefined,founder)).json.data.recordCount).toBe(0);
  expect((await call(app,'/reports/build?kind=orders&outletId=other',undefined,founder)).json.data.recordCount).toBe(0);
  expect((await call(app,'/reports/build?kind=orders',undefined,customer)).response.status).toBe(403);
  app.store.save('tasks',{id:'qa-task',title:'=HYPERLINK("evil")<script>',createdAt:'2026-10-02T01:00:00.000Z',revision:1,status:'done',outcome:'<img onerror=evil>',ownerId:founder.userId,assigneeId:founder.userId,entityId:'business',documentIds:[]});
  const csv=(await call(app,'/reports/build?kind=tasks&format=csv',undefined,founder)).json.data.content;
  expect(csv).toContain("'=HYPERLINK");
  const html=(await call(app,'/reports/build?kind=tasks&format=html',undefined,founder)).json.data.content;
  expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');
});

test('saved report definitions are versioned and derived calendar events link to original records',async()=>{
  const {app}=harness(),founder=await user(app,'saved-reports',true);
  const saved=await call(app,'/reports/definitions',{title:'Daily orders',kind:'orders',from:'2026-10-02',to:'2026-10-02'},founder);
  expect(saved.response.status).toBe(200);expect(saved.json.data.revision).toBe(1);
  expect((await call(app,`/reports/definitions/${saved.json.data.id}/update`,{expectedRevision:0,title:'Stale',kind:'orders'},founder)).response.status).toBe(409);
  const task=(await call(app,'/tasks',{entityId:'business',title:'Test due',assigneeId:founder.userId,documentIds:[],dueAt:'2026-10-02T08:00:00.000Z'},founder)).json.data;
  const events=(await call(app,'/calendar/derived',undefined,founder)).json.data;
  expect(events).toContainEqual(expect.objectContaining({entityId:task.id,startAt:task.dueAt,sourceKind:'task',path:'/founder/tasks'}));
});
