import { expect,test } from 'bun:test';
import {call,harness,user} from './backend-security.test';

test('reconciliation pins reviewed source contents, not only the current status',async()=>{
 const {app}=harness(),owner=await user(app,'reconcile-pin',true);
 app.store.save('expenses',{id:'approved-test',outletId:'hq',amountSen:100,evidenceIds:[],category:'QA',status:'approved',revision:2,ownerId:owner.userId,createdAt:new Date().toISOString()});
 const review=(await call(app,'/reconciliations',{period:'QA',expenseRefs:['approved-test'],paymentRefs:[]},owner)).json.data;
 app.store.save('expenses',{...app.store.require<{id:string}>('expenses','approved-test'),amountSen:900,revision:4});
 const approval=await call(app,`/reconciliations/${review.id}/approve`,{expectedRevision:review.revision},owner);
 expect(approval.response.status).toBe(409);expect(approval.json.code).toBe('RECONCILIATION_SOURCE_CHANGED');
});
test('removed location cannot accept new orders and business is not a complaint-summary source',async()=>{
 const {app}=harness(),owner=await user(app,'removed-location',true);
 const product=(await call(app,'/catalogue',{name:'QA',description:'QA',priceSen:100,packSize:1,publish:true},owner)).json.data;
 app.store.save('locations',{id:'historic-outlet'});
 const order=await call(app,'/orders',{lines:[{productId:product.id,quantity:1}],catalogueVersion:1,outletId:'historic-outlet',fulfilment:'pickup',contactRef:'QA'},owner);
 expect(order.json.code).toBe('LOCATION_UNAVAILABLE');
 const job=await call(app,'/jobs',{kind:'case_summary',entityId:'business',skillVersion:'v1',scope:'founder'},owner);
 expect(job.response.status).toBe(400);expect(job.json.code).toBe('JOB_SOURCE_MISMATCH');
});
