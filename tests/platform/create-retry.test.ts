import {expect,test} from 'bun:test';
import {call,harness,user} from './backend-security.test';
test('uncertain creation retries return one task, document, calendar and campaign receipt',async()=>{
 const {app}=harness(),owner=await user(app,'create-retry',true);
 for(const [path,body,kind] of [
  ['/tasks',{title:'QA retry',assigneeId:owner.userId,entityId:'business',documentIds:[]},'tasks'],
  ['/documents',{title:'QA retry',body:'QA source',visibility:'private'},'documents'],
  ['/calendar',{title:'QA retry',entityIds:[],startAt:'2026-10-03T01:00:00Z',endAt:'2026-10-03T02:00:00Z'},'calendar'],
  ['/campaigns',{title:'QA retry',objective:'QA objective',copy:'QA copy',assets:[],productIds:[],catalogueVersion:0},'campaigns'],
 ] as const){const headers={'Idempotency-Key':'retry-'+kind};const first=await call(app,path,body,owner,headers),retry=await call(app,path,body,owner,headers);expect(first.response.status).toBe(200);expect(retry.json.data.id).toBe(first.json.data.id);expect(app.store.all(kind)).toHaveLength(1);}
});
