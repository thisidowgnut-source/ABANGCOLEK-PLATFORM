import { afterEach, expect, test } from 'bun:test';
import { createPlatformApp } from '../../server/platform/app';

const cleanups:(()=>void)[]=[];
afterEach(()=>cleanups.splice(0).forEach(close=>close()));
type Session={cookie:string;csrf:string;id:string};
async function fixture(){
  const app=createPlatformApp({databasePath:':memory:',bootstrapToken:'work-api-bootstrap',origin:'http://localhost:3000'});
  cleanups.push(()=>app.close());
  async function call(path:string,body?:unknown,session?:Session,key='collaboration-api-key'){
    const response=await app.fetch(new Request(`http://localhost:3010/api/platform${path}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json',Origin:'http://localhost:3000','Idempotency-Key':key}),...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
    return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')};
  }
  async function user(name:string,founder=false):Promise<Session>{
    const result=await call(founder?'/auth/bootstrap':'/auth/signup',{email:`${name}@example.test`,name,password:'a long secure local password',...(founder?{token:'work-api-bootstrap'}:{})});
    expect(result.status).toBe(200);return {cookie:result.cookie!.split(';')[0],csrf:result.data.data.csrfToken,id:result.data.data.user.id};
  }
  return {app,call,user};
}

test('task collaboration API handles scoped checked completion, retry and historical receipt',async()=>{
  const {call,user}=await fixture(),owner=await user('task-owner',true),staff=await user('task-staff'),other=await user('task-other');
  for(const actor of [staff,other])await call('/people/grants',{userId:actor.id,role:'staff',outletIds:['hq'],expectedVersion:0},owner,`grant-${actor.id}`);
  const task=(await call('/tasks',{entityId:'business',title:'Verified handoff',assigneeId:staff.id,documentIds:[]},owner)).data.data;
  const item=(await call(`/tasks/${task.id}/checklist`,{expectedRevision:1,title:'Check actual batch label',required:true},staff)).data.data;
  expect((await call(`/tasks/${task.id}/collaboration`,undefined,other)).status).toBe(403);
  expect((await call(`/tasks/${task.id}/complete`,{expectedRevision:2,outcome:'Done'},staff)).data.code).toBe('REQUIRED_CHECKLIST_INCOMPLETE');
  const checked=(await call(`/tasks/${task.id}/checklist/${item.checklist[0].id}/check`,{expectedRevision:2,checked:true},staff)).data.data;
  const comment=await call(`/tasks/${task.id}/comments`,{expectedRevision:checked.revision,body:'Label verified'},staff,'comment-api-key');
  expect(comment.status).toBe(200);
  const collaboration=(await call(`/tasks/${task.id}/collaboration`,undefined,staff)).data.data;
  const raw={expectedRevision:collaboration.task.revision,outcome:'Actual handoff completed'};
  const result=await call(`/tasks/${task.id}/complete`,raw,staff,'complete-api-key');
  expect(result.status).toBe(200);expect(result.data.data.status).toBe('completed');
  expect((await call(`/tasks/${task.id}/complete`,raw,staff,'complete-api-key')).data.data.id).toBe(result.data.data.id);
  expect((await call(`/tasks/${task.id}/collaboration`,undefined,staff)).data.data.receipts).toHaveLength(1);
});

test('document source lineage API blocks forging and protects source-safe version history',async()=>{
  const {call,user}=await fixture(),owner=await user('source-owner',true),staff=await user('source-staff');
  await call('/people/grants',{userId:staff.id,role:'staff',outletIds:['hq'],expectedVersion:0},owner);
  const source=(await call('/research/sources',{url:'https://example.org/reference',title:'Reference',snippet:'Actual excerpt',retrievedAt:new Date().toISOString(),termsCheck:'allowed',permittedUse:'Internal attribution'},owner)).data.data;
  const brief=(await call('/research/briefs',{question:'Question',summary:'Human synthesis',sourceIds:[source.id],unknownReasons:[]},owner)).data.data;
  const document=(await call('/documents',{title:'Memo',body:'Reviewed text',visibility:'business',entityIds:[]},owner)).data.data;
  expect((await call(`/documents/${document.id}/research`,{expectedVersion:1,researchBriefIds:[brief.id]},staff)).status).toBe(403);
  const linked=await call(`/documents/${document.id}/research`,{expectedVersion:1,researchBriefIds:[brief.id]},owner);
  expect(linked.status).toBe(200);expect(linked.data.data.version).toBe(2);
  const knowledge=(await call(`/documents/${document.id}/publish`,{expectedVersion:2},owner)).data.data;
  expect(knowledge.sourceRefs[0].contentHash).toBe(source.contentHash);
  expect(knowledge.researchLineage[0].briefId).toBe(brief.id);
  expect((await call(`/documents/${document.id}/versions`,undefined,staff)).data.data).toHaveLength(2);
});
