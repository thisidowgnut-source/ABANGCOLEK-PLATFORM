import { expect, test } from 'bun:test';
import { call, harness, user } from './backend-security.test';

test('flow review returns a canonical price breakdown and removes it when answers change', async () => {
  const { app } = harness(), founder = await user(app, 'flow-price', true);
  const product = (await call(app, '/catalogue', { name: 'QA price', description: 'Isolated test', priceSen: 1234, packSize: 1, publish: true }, founder)).json.data;
  await call(app, '/inventory/receive', { productId: product.id, quantity: 5, ownerId: 'business', locationId: 'hq', status: 'available', reason: 'Test' }, founder, { 'Idempotency-Key': 'flow-price-stock' });
  let flow = (await call(app, '/flow-sessions', { flowId: 'order-v1' }, founder)).json.data;
  for (const answers of [{ lines: [{ productId: product.id, quantity: 2 }], catalogueVersion: 1 }, { fulfilment: 'pickup' }, { contactRef: 'Test pickup' }]) flow = (await call(app, `/flow-sessions/${flow.id}/advance`, { expectedRevision: flow.revision, answers }, founder)).json.data;
  flow = (await call(app, `/flow-sessions/${flow.id}/review`, { expectedRevision: flow.revision }, founder)).json.data;
  expect(flow.reviewQuote?.totalSen).toBe(2468);
  expect(flow.reviewQuote?.lines[0].priceSen).toBe(1234);
  expect(flow.reviewQuote?.ownerId).toBe(founder.userId);
  flow = (await call(app, `/flow-sessions/${flow.id}/back`, { expectedRevision: flow.revision }, founder)).json.data;
  expect(flow.reviewQuote).toBeUndefined();
  expect(flow.reviewVersion).toBeUndefined();
});

test('public catalogue uses bounded pages with an explicit next offset', async () => {
  const { app } = harness();
  for (let index = 0; index < 103; index++) app.store.save('catalogue', { id: `sku-${index}`, name: `Test ${index}`, description: 'QA only', priceSen: 100, currency: 'MYR', packSize: 1, publishedVersion: 1, revision: 1, status: 'published' });
  const first = await call(app, '/catalogue?limit=100');
  expect(first.json.data).toHaveLength(100);
  expect(first.response.headers.get('X-Total-Count')).toBe('103');
  expect(first.response.headers.get('X-Next-Offset')).toBe('100');
  const last = await call(app, '/catalogue?limit=100&offset=100');
  expect(last.json.data).toHaveLength(3);
  expect(last.response.headers.get('X-Next-Offset')).toBe('');
  expect((await call(app, '/catalogue?offset=-1')).response.status).toBe(400);
});

test('accessible full form reaches the same reviewed server contract as guided steps',async()=>{
  const {app}=harness(),founder=await user(app,'full-form',true);
  const product=(await call(app,'/catalogue',{name:'QA',description:'Isolated',priceSen:750,packSize:1,publish:true},founder)).json.data;
  await call(app,'/inventory/receive',{productId:product.id,quantity:3,ownerId:'business',locationId:'hq',status:'available',reason:'Test'},founder,{'Idempotency-Key':'full-form-stock'});
  const started=(await call(app,'/flow-sessions',{flowId:'order-v1'},founder)).json.data;
  const reviewed=await call(app,`/flow-sessions/${started.id}/form`,{expectedRevision:1,answers:{lines:[{productId:product.id,quantity:2}],catalogueVersion:1,fulfilment:'pickup',contactRef:'Test'}},founder);
  expect(reviewed.response.status).toBe(200);expect(reviewed.json.data.currentNode).toBe('review');expect(reviewed.json.data.reviewQuote.totalSen).toBe(1500);
  const submitted=await call(app,`/flow-sessions/${started.id}/submit`,{expectedRevision:reviewed.json.data.revision},founder,{'Idempotency-Key':'full-form-submit'});
  expect(submitted.json.data.status).toBe('submitted');
});
