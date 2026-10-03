import { expect,test } from 'bun:test';
import { call,harness,user } from './backend-security.test';

test('runtime pause and read-only release preserve records, deny customer changes and stale controls',async()=>{
  const {app}=harness(),founder=await user(app,'runtime-founder',true),developer=await user(app,'runtime-developer'),customer=await user(app,'runtime-customer');
  await call(app,'/people/grants',{userId:developer.userId,role:'developer',outletIds:[],expectedVersion:0},founder);
  const task=(await call(app,'/tasks',{title:'Persist across rollback',entityId:'business',assigneeId:founder.userId,documentIds:[]},founder)).json.data;
  await call(app,'/jobs',{kind:'morning_brief',entityId:'business',skillVersion:'local-v1',scope:'business'},founder,{'Idempotency-Key':'paused-runtime-job'});
  expect((await call(app,'/runtime-controls',{expectedVersion:0,workerAdmission:'paused'},customer)).response.status).toBe(403);
  const pause=(await call(app,'/runtime-controls',{expectedVersion:0,workerAdmission:'paused'},developer)).json.data;
  expect(app.jobs.claimJob('paused-worker')).toBeNull();
  expect((await call(app,'/runtime-controls',{expectedVersion:0,workerAdmission:'running'},developer)).json.code).toBe('REVISION_CONFLICT');
  await call(app,'/runtime-controls',{expectedVersion:pause.version,workerAdmission:'running',activeRelease:'platform-local-readonly-v1'},developer);
  expect(app.jobs.claimJob('readonly-worker')).toBeNull();
  expect((await call(app,`/tasks/${task.id}/update`,{expectedRevision:1,status:'done',outcome:'Cannot mutate rollback'},founder)).json.code).toBe('RELEASE_READ_ONLY');
  expect((await call(app,'/tasks',undefined,founder)).json.data[0].id).toBe(task.id);
  expect((await call(app,'/runtime-controls',{expectedVersion:2,workerAdmission:'running',activeRelease:'platform-local-v1',externalFlags:{hermes:true}},developer)).json.code).toBe('UNKNOWN_FIELD');
  await call(app,'/runtime-controls',{expectedVersion:2,activeRelease:'platform-local-v1'},developer);
  expect(app.jobs.claimJob('resume-worker')).not.toBeNull();
});

test('task outcomes, private documents, calendar ownership, shift handoff and source-safe CSV are enforced',async()=>{
  const {app}=harness(),founder=await user(app,'work-founder',true),staff=await user(app,'work-staff'),other=await user(app,'work-other');
  for(const actor of [staff,other])await call(app,'/people/grants',{userId:actor.userId,role:'staff',outletIds:['hq'],expectedVersion:0},founder);
  const privateDoc=(await call(app,'/documents',{title:'Private note',body:'Only author sees this',visibility:'private',entityIds:[]},staff)).json.data;
  expect((await call(app,'/documents',undefined,other)).json.data).toEqual([]);
  expect((await call(app,`/documents/${privateDoc.id}/publish`,{expectedVersion:1},founder)).response.status).toBe(403);
  const task=(await call(app,'/tasks',{title:' @SUM(A1)',entityId:'business',assigneeId:staff.userId,documentIds:[]},founder)).json.data;
  expect((await call(app,`/tasks/${task.id}/update`,{expectedRevision:1,status:'done'},staff)).json.code).toBe('OUTCOME_REQUIRED');
  expect((await call(app,`/tasks/${task.id}/update`,{expectedRevision:1,status:'done',outcome:'Verified actual handoff'},staff)).response.status).toBe(200);
  expect((await call(app,`/tasks/${task.id}/update`,{expectedRevision:2,status:'open'},other)).response.status).toBe(403);
  const event=(await call(app,'/calendar',{title:'Shift roster',entityIds:[],startAt:'2026-10-02T01:00:00Z',endAt:'2026-10-02T02:00:00Z'},staff)).json.data;
  expect((await call(app,'/calendar',undefined,other)).json.data).toEqual([]);
  expect((await call(app,`/calendar/${event.id}/update`,{expectedRevision:1,title:'Updated roster',entityIds:[],startAt:'2026-10-02T01:00:00Z',endAt:'2026-10-02T03:00:00Z'},staff)).response.status).toBe(200);
  const shift=(await call(app,'/shifts',{outletId:'hq',staffIds:[staff.userId],openingCount:10},founder)).json.data;
  expect((await call(app,`/shifts/${shift.id}/handoff`,{expectedRevision:1,closingCount:9,handoffNote:'One sale; task outstanding'},staff)).response.status).toBe(200);
  expect((await call(app,`/shifts/${shift.id}/acknowledge`,{expectedRevision:2},other)).json.data.acknowledgedBy).toBe(other.userId);
  const report=(await call(app,'/reports/export?kind=tasks',undefined,founder)).json.data;
  expect(report.content).toContain("'@SUM(A1)");
  expect((await call(app,'/tasks?limit=1&offset=0',undefined,founder)).response.headers.get('x-total-count')).toBe('1');
});

test('campaign asset bundle is a real private archive of approved revision and files',async()=>{
  const {app}=harness(),founder=await user(app,'bundle-founder',true),other=await user(app,'bundle-other');
  const input={title:'Bundle',objective:'Export approved first party content',copy:'Approved caption',assets:[],productIds:[],catalogueVersion:0};
  const campaign=(await call(app,'/campaigns',input,founder)).json.data;
  const form=new FormData();form.set('entityId',campaign.id);form.set('file',new File(['approved asset bytes'],'approved.txt',{type:'text/plain'}));
  const upload=await app.fetch(new Request('http://localhost:3010/api/platform/evidence/upload',{method:'POST',headers:{Origin:'http://localhost:3000',Cookie:founder.cookie,'X-CSRF-Token':founder.csrf},body:form}));
  const file=(await upload.json()).data;
  const updated=(await call(app,`/campaigns/${campaign.id}/update`,{...input,expectedRevision:1,assets:[{id:'asset1',name:'Approved note',rights:'Business-owned',consent:'No people depicted',evidenceId:file.id}]},founder)).json.data;
  const approved=(await call(app,`/campaigns/${campaign.id}/approve`,{expectedRevision:updated.revision,approvalExpiresAt:new Date(Date.now()+3600000).toISOString()},founder)).json.data;
  const artifact=(await call(app,`/campaigns/${campaign.id}/export`,{expectedRevision:approved.revision,format:'asset_bundle'},founder,{'Idempotency-Key':'actual-asset-export'})).json.data;
  const response=await app.fetch(new Request(`http://localhost:3010${artifact.downloadUrl}`,{headers:{Cookie:founder.cookie}}));
  expect(response.status).toBe(200);
  const files=await new Bun.Archive(await response.arrayBuffer()).files();
  expect(await files.get('caption.txt')!.text()).toBe('Approved caption');
  expect(await files.get(`${file.id}.txt`)!.text()).toBe('approved asset bytes');
  expect((await app.fetch(new Request(`http://localhost:3010${artifact.downloadUrl}`,{headers:{Cookie:other.cookie}}))).status).toBe(403);
});
