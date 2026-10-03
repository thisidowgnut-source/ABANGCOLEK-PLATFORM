import { randomUUID } from 'node:crypto';
import type { BusinessSettings, CatalogueProduct, PlatformOverview, CaseRecord, EvidenceRecord, JobRecord } from '../../shared/platform-contracts';
import { Auth, type Principal } from './auth';
import { Commerce } from './commerce';
import { DomainError, fail, now, object, PlatformStore, text, fields, oneOf, strings, list } from './store';
import { Work } from './work';
import { Dealers } from './dealers';
import { Marketing } from './marketing';
import { Operations } from './operations';
import { Flows } from './flows';
import { Jobs } from '../automation/jobs';
import { boundedBody, EvidenceFiles } from './evidenceFiles';
import { assessState } from './jev/assessment';
import type { JevAssessment, JevPackId, JevState } from '../../shared/jev-contracts';
import { generateLegacyContent } from './legacyAi';
import { RuntimeControlCommands } from './runtimeControls';
import { Automation } from '../automation/automation';
import { JevEvaluations } from './jev/evaluations';
import { Reports } from './reports';
import { OperationalAmendments } from './operationalAmendments';

export interface PlatformAppOptions { databasePath?:string; bootstrapToken?:string; origin?:string; allowedOrigins?:string[]; rateLimits?:{identityGlobal:number;identityAccount:number;actor:number}; log?:(entry:{requestId:string;code:string;status:number})=>void }
const cookieClear='platform_session=; HttpOnly; SameSite=Strict; Path=/api/platform; Max-Age=0';
export function createPlatformApp(options:PlatformAppOptions={}) {
  const store=new PlatformStore(options.databasePath??'var/lib/platform/platform.sqlite');
  const auth=new Auth(store,options.bootstrapToken),commerce=new Commerce(store,auth),work=new Work(store,auth,commerce);
  const dealers=new Dealers(store,auth,commerce),marketing=new Marketing(store,auth,commerce,work),operations=new Operations(store,auth,commerce,work);
  const flows=new Flows(store,auth,commerce,work,dealers),jobs=new Jobs(store,auth,commerce,work),evidenceFiles=new EvidenceFiles(store,work,options.databasePath??'var/lib/platform/platform.sqlite');
  const runtimeControls=new RuntimeControlCommands(store,auth);
  const automation=new Automation(store,auth,commerce,work,marketing),jevEvaluations=new JevEvaluations(store,auth,commerce,work);
  const reports=new Reports(store,auth,commerce,work);
  const amendments=new OperationalAmendments(store,auth,operations,work);
  const origin=options.origin??'http://localhost:3000';
  const allowedOrigins=options.allowedOrigins??[origin];
  function json(data:unknown,status=200,extra:Record<string,string>={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});}
  function collection(data:unknown[],url:URL) {
    const limitValue=url.searchParams.get('limit')??'100',offsetValue=url.searchParams.get('offset')??'0';
    if(!/^\d+$/.test(limitValue)||!/^\d+$/.test(offsetValue))fail('INVALID_PAGINATION');
    const limit=Math.min(100,Number(limitValue)),offset=Number(offsetValue);
    if(limit<1||!Number.isSafeInteger(offset)||offset<0)fail('INVALID_PAGINATION');
    return json({ok:true,data:data.slice(offset,offset+limit)},200,{'X-Total-Count':String(data.length),'X-Next-Offset':offset+limit<data.length?String(offset+limit):''});
  }
  function overview(actor:Principal):PlatformOverview {auth.founder(actor);const orders=commerce.orders(actor);return {orders:orders.length,orderValueSen:orders.filter(o=>o.fulfilmentStatus!=='cancelled').reduce((sum,o)=>sum+o.amountSen,0),verifiedPaymentSen:orders.reduce((sum,o)=>sum+o.paidAmountSen-o.refundAmountSen,0),fulfilledOrders:orders.filter(o=>o.fulfilmentStatus==='received').length,openCases:work.cases(actor).filter(c=>c.status!=='resolved').length,openTasks:work.tasks(actor).filter(t=>t.status!=='done').length,pendingDealerApplications:store.all<{status:string}>('dealer_applications').filter(a=>a.status==='pending').length,stockAvailable:commerce.catalogue().reduce((sum,p)=>sum+p.availableQuantity,0),generatedAt:now(),source:'local_authoritative',empty:orders.length===0};}
  function postRoute(actor:Principal,path:string,input:unknown,key:string|null,url:URL) {
    if(!['/tasks','/documents','/calendar','/campaigns','/cases'].includes(path))return route(actor,'POST',path,input,key,url);
    const body=object(input);
    // Receipt replay must recheck current source authority before reading cached data.
    if(path==='/cases')commerce.order(actor,text(body.orderId));
    else {
      work.staff(actor);
      if(body.entityId&&body.entityId!=='business')work.entity(actor,text(body.entityId));
      if(path==='/tasks'){for(const documentId of strings(body.documentIds??[]))work.document(actor,documentId);if(body.outletId)auth.operational(actor,text(body.outletId));}
      if(path==='/calendar'||path==='/documents')for(const entityId of strings(body.entityIds??[]))if(entityId!=='business')work.entity(actor,entityId);
      if(path==='/documents'&&body.researchBriefIds!==undefined){auth.founder(actor);for(const briefId of strings(body.researchBriefIds)){const brief=store.require<{ownerId:string}>('research_briefs',briefId);if(brief.ownerId!==actor.user.id)fail('FORBIDDEN',403);}}
      if(path==='/campaigns')for(const item of list(body.assets??[],50)){const asset=object(item);if(asset.evidenceId){const evidence=store.require<EvidenceRecord>('evidence',text(asset.evidenceId));work.entity(actor,evidence.entityId);}}
    }
    return commerce.idem(actor,'create:'+path,key,input,()=>route(actor,'POST',path,input,key,url));
  }
  function route(actor:Principal,method:string,path:string,input:unknown,key:string|null,url:URL):unknown {
    const segments=path.split('/').filter(Boolean), recordId=segments[1], command=segments[2];
    if(method==='GET') {
      if(path==='/session')return auth.refreshCsrf(actor);
      if(path==='/catalogue/admin'){auth.founder(actor);return store.all<CatalogueProduct>('catalogue').map(p=>({...p,availableQuantity:commerce.available(p.id)}));}
      if(path==='/orders')return commerce.orders(actor);
      if(segments[0]==='orders'&&recordId)return commerce.order(actor,recordId);
      if(path==='/cases')return work.cases(actor);
      if(segments[0]==='cases'&&recordId){if(command==='messages')return work.messages(actor,recordId);return work.case(actor,recordId);}
      if(path==='/evidence')return evidenceFiles.list(actor,url.searchParams.get('entityId')??'');
      if(path==='/tasks')return work.tasks(actor);
      if(path==='/tasks/summary')return reports.taskSummary(actor);
      if(path==='/finance/summary')return reports.financeSummary(actor);
      if(segments[0]==='tasks'&&recordId&&command==='collaboration')return work.collaboration(actor,recordId);
      if(segments[0]==='documents'&&recordId&&command==='versions')return work.documentVersions(actor,recordId);
      if(path==='/documents')return work.documents(actor);
      if(segments[0]==='documents'&&recordId&&!command)return work.document(actor,recordId);
      if(segments[0]==='tasks'&&recordId&&!command)return work.task(actor,recordId);
      if(path==='/knowledge')return work.knowledge(actor,url.searchParams.get('q')??'');
      if(path==='/calendar')return work.calendar(actor);
      if(path==='/calendar/derived')return reports.calendar(actor);
      if(path==='/reports/definitions')return reports.definitions(actor);
      if(path==='/reports/build')return reports.build(actor,Object.fromEntries(url.searchParams),oneOf(url.searchParams.get('format')??'csv',['csv','html'] as const));
      if(path==='/campaigns')return marketing.all(actor);
      if(path==='/dealer/applications')return dealers.applications(actor);
      if(path==='/dealer/restocks')return dealers.restocks(actor);
      if(path==='/dealer/terms'){if(!actor.memberships.some(m=>m.dealerOrgId)&&!auth.has(actor,'founder'))fail('FORBIDDEN',403);return operations.settings().approvedPolicies.dealer??null;}
      if(path==='/dealer/benefits')return dealers.benefits(actor);
      if(path==='/dealer/ledger')return dealers.ledger(actor);
      if(path==='/dealer/commission-policies'){auth.founder(actor);return store.all('commission_policies');}
      if(path==='/expenses')return operations.expenses(actor);
      if(path==='/dayclose/amendments')return amendments.dayCloseHistory(actor);
      if(path==='/expense-postings')return amendments.postings(actor);
      if(path==='/expense-postings/summary')return amendments.postingSummary(actor);
      if(path==='/people/invitations')return amendments.invitations(actor);
      if(path==='/availability')return amendments.availability(actor);
      if(path==='/notification-preferences')return amendments.preferences(actor);
      if(path==='/notifications')return amendments.notifications(actor);
      if(segments[0]==='record-context'&&recordId){
        const section=oneOf(url.searchParams.get('section'),['marketing','dealers','business','inventory','qc','shifts','finance'] as const);
        const kinds:Record<string,string[]>={marketing:['campaigns'],dealers:['restocks'],business:['restocks'],inventory:['lots'],qc:['qc'],shifts:['shifts','dayclose'],finance:['expenses','dayclose']};
        work.entity(actor,recordId);const kind=kinds[section].find(value=>store.get(value,recordId));if(!kind)fail('NOT_FOUND',404);
        return {kind,record:store.require<Record<string,unknown>>(kind,recordId)};
      }
      if(path==='/shifts')return operations.scoped(actor,'shifts');
      if(path==='/qc')return operations.scoped(actor,'qc');
      if(path==='/qc/sops'){work.staff(actor);return store.all('qc_sops');}
      if(path==='/dayclose')return operations.scoped(actor,'dayclose');
      if(path==='/reconciliations'){auth.founder(actor);return store.all('reconciliations');}
      if(path==='/payments'){auth.founder(actor);return store.all('payments');}
      if(path==='/jobs')return jobs.all(actor);
      if(path==='/runtime-controls')return runtimeControls.get(actor);
      if(path==='/automation/capabilities')return automation.capabilities(actor);
      if(path==='/automation/exports')return automation.exports(actor);
      if(path==='/research/sources')return automation.sources(actor);
      if(path==='/research/briefs')return automation.briefs(actor);
      if(path==='/research/grants')return automation.grants(actor);
      if(path==='/jev/packs')return jevEvaluations.packs(actor);
      if(path==='/jev/assessments')return jevEvaluations.assessments(actor);
      if(path==='/jev/evaluations')return jevEvaluations.evaluations(actor);
      if(path==='/jev/context')return jevEvaluations.context(actor,url.searchParams.get('packId')??'',url.searchParams.get('entityId')??'');
      if(path==='/quotas'){runtimeControls.authorized(actor);return [jobs.usage(),...['hermes','nvidia','postiz','agent_reach'].map(providerId=>({providerId,observedUnits:null,limitUnits:null,available:false,observedAt:now()}))];}
      if(segments[0]==='jobs'&&recordId&&command==='artifacts'){auth.founder(actor);return store.all<{jobId:string}>('job_artifacts').filter(a=>a.jobId===recordId);}
      if(path==='/flows')return flows.all();
      if(segments[0]==='flow-sessions'&&recordId)return flows.session(actor,recordId);
      if(path==='/decisions'){auth.founder(actor);return {cases:work.cases(actor).filter(c=>c.status!=='resolved'),dealerApplications:dealers.applications(actor).filter(a=>a.status==='pending'),campaigns:marketing.all(actor).filter(c=>c.status==='draft'),expenses:operations.expenses(actor).filter(e=>e.status==='draft'),dayclose:operations.scoped<{outletId:string;status:string}>(actor,'dayclose').filter(d=>d.status==='review')};}
      if(path==='/reports/export'){auth.founder(actor);const kind=oneOf(url.searchParams.get('kind'),['orders','tasks','expenses'] as const);const rows=kind==='orders'?commerce.orders(actor).map(o=>({id:o.id,createdAt:o.createdAt,amountSen:o.amountSen,paymentState:o.paymentState,fulfilmentStatus:o.fulfilmentStatus,revision:o.revision})):kind==='tasks'?work.tasks(actor).map(t=>({id:t.id,title:t.title,status:t.status,outcome:t.outcome??'',revision:t.revision})):operations.expenses(actor).map(e=>({id:e.id,outletId:e.outletId,amountSen:e.amountSen,category:e.category,status:e.status,revision:e.revision}));const columns=kind==='orders'?['id','createdAt','amountSen','paymentState','fulfilmentStatus','revision']:kind==='tasks'?['id','title','status','outcome','revision']:['id','outletId','amountSen','category','status','revision'];const escape=(value:unknown)=>{const safe=String(value??'');return `"${(/^\s*[=+@-]/.test(safe)?"'"+safe:safe).replaceAll('"','""')}"`;};const content=[columns.map(escape).join(','),...rows.map(row=>columns.map(key=>escape((row as Record<string,unknown>)[key])).join(','))].join('\r\n');return {content,filename:`abangcolek-${kind}-${now().slice(0,10)}.csv`,generatedAt:now(),sourceVersions:{catalogue:commerce.version()},recordCount:rows.length};}
      if(path==='/inventory'){if(auth.has(actor,'developer')&&!auth.has(actor,'founder'))fail('FORBIDDEN',403);return commerce.inventory(actor);}
      if(path==='/overview')return overview(actor);
      if(path==='/people'){auth.founder(actor);return store.db.query<{id:string;email:string;name:string},[]>('SELECT id,email,name FROM users ORDER BY created_at').all().map(u=>({...u,memberships:auth.memberships(u.id)}));}
      if(path==='/settings'){if(auth.has(actor,'founder'))return operations.settings();const s=operations.settings();return {...s,approvedPolicies:{paymentInstructions:s.approvedPolicies.paymentInstructions,contact:s.approvedPolicies.contact,locations:s.approvedPolicies.locations,...(actor.memberships.some(m=>m.dealerOrgId)?{dealer:s.approvedPolicies.dealer}:{})}};}
      if(path==='/health'){if(!auth.has(actor,'founder')&&!auth.has(actor,'developer'))fail('FORBIDDEN',403);return [{component:'platform_database',status:'ready',observedAt:now(),reasonCode:'LOCAL_SQLITE'},{component:'hermes',status:'unavailable',observedAt:now(),reasonCode:'ADAPTER_NOT_VERIFIED'},{component:'native_whatsapp',status:'unavailable',observedAt:now(),reasonCode:'FEATURE_DISABLED'},{component:'postiz',status:'unavailable',observedAt:now(),reasonCode:'ADAPTER_NOT_VERIFIED'},{component:'agent_reach',status:'unavailable',observedAt:now(),reasonCode:'ADAPTER_NOT_VERIFIED'}];}
    }
    if(method==='POST') {
      if(path==='/auth/logout'){auth.logout(actor);return {loggedOut:true};}
      if(path==='/catalogue')return commerce.saveProduct(actor,input);
      if(path==='/flows')return flows.save(actor,input);
      if(path==='/flow-sessions')return flows.start(actor,input);
      if(segments[0]==='flow-sessions'&&recordId){if(command==='advance')return flows.advance(actor,recordId,input);if(command==='back')return flows.advance(actor,recordId,input,true);if(command==='review')return flows.review(actor,recordId,input);if(command==='form')return flows.form(actor,recordId,input);if(command==='submit')return flows.submit(actor,recordId,input,key);}
      if(path==='/quotes')return commerce.quote(actor,input);
      if(path==='/orders')return commerce.submitOrder(actor,input,key);
      if(segments[0]==='orders'&&recordId){if(command==='transition')return commerce.transition(actor,recordId,input);if(command==='payment')return commerce.payment(actor,recordId,input,key);}
      if(path==='/inventory/receive')return commerce.receive(actor,input,key);
      if(segments[0]==='inventory'&&recordId&&command==='quarantine')return commerce.quarantine(actor,recordId,input);
      if(segments[0]==='inventory'&&recordId&&command==='adjust')return commerce.adjust(actor,recordId,input,key);
      if(segments[0]==='inventory'&&recordId&&command==='transfer')return commerce.transfer(actor,recordId,input,key);
      if(path==='/cases')return work.createCase(actor,input);
      if(segments[0]==='cases'&&recordId){if(command==='reply')return work.reply(actor,recordId,input);if(command==='assign')return work.assignCase(actor,recordId,input);if(command==='resolve')return work.resolveCase(actor,recordId,input);if(command==='preview')return work.prepareMessage(actor,recordId,input);if(command==='assessment'){fields(object(input),[]);const complaint=work.case(actor,recordId);return jevEvaluations.assess(actor,{packId:'support',entityId:recordId,expectedRevision:complaint.revision});}}
      if(segments[0]==='previews'&&recordId&&command==='confirm')return work.confirmMessage(actor,recordId,input,key);
      if(path==='/evidence')return work.createEvidence(actor,input);
      if(path==='/tasks')return work.createTask(actor,input);
      if(segments[0]==='tasks'&&recordId){if(command==='update')return work.updateTask(actor,recordId,input,key);if(command==='checklist'&&segments[3]&&segments[4]==='check')return work.checkChecklist(actor,recordId,segments[3],input,key);if(command==='checklist')return work.addChecklist(actor,recordId,input,key);if(command==='comments')return work.commentTask(actor,recordId,input,key);if(command==='complete')return work.completeTask(actor,recordId,input,key);}
      if(path==='/documents')return work.saveDocument(actor,input);
      if(segments[0]==='documents'&&recordId){if(command==='update')return work.saveDocument(actor,input,recordId);if(command==='publish')return work.publishDocument(actor,recordId,input);if(command==='research')return work.linkResearch(actor,recordId,input,key);}
      if(segments[0]==='knowledge'&&recordId&&command==='retire')return work.retireKnowledge(actor,recordId,input);
      if(path==='/calendar')return work.saveCalendar(actor,input);
      if(path==='/reports/definitions')return reports.save(actor,input);
      if(segments[0]==='reports'&&segments[1]==='definitions'&&segments[2]&&segments[3]==='update')return reports.save(actor,input,segments[2]);
      if(segments[0]==='calendar'&&recordId&&command==='update')return work.saveCalendar(actor,input,recordId);
      if(path==='/people/grants')return auth.grant(actor,input);
      if(path==='/people/revoke')return auth.revoke(actor,input);
      if(path==='/settings')return operations.saveSettings(actor,input);
      if(path==='/campaigns')return marketing.save(actor,input);
      if(segments[0]==='campaigns'&&recordId){if(command==='update')return marketing.save(actor,input,recordId);if(command==='approve')return marketing.approve(actor,recordId,input);if(command==='export'){const artifact=marketing.export(actor,recordId,input,key);return evidenceFiles.export(actor,artifact,marketing.get(actor,recordId));}if(command==='publish')fail('PUBLISHER_UNAVAILABLE',409,'Saluran penerbit belum disahkan. Eksport manual tersedia.');}
      if(path==='/dealer/applications')return dealers.apply(actor,input);
      if(path==='/dealer/commission-policies')return dealers.saveCommissionPolicy(actor,input);
      if(segments[0]==='dealer'&&segments[1]==='applications'&&segments[2]){if(segments[3]==='approve')return dealers.decide(actor,segments[2],input,true);if(segments[3]==='reject')return dealers.decide(actor,segments[2],input,false);}
      if(path==='/dealer/quotes')return dealers.quote(actor,input);
      if(path==='/dealer/restocks')return dealers.request(actor,input,key);
      if(segments[0]==='dealer'&&segments[1]==='restocks'&&segments[2]){if(segments[3]==='transition')return dealers.transition(actor,segments[2],input);if(segments[3]==='receive')return dealers.receive(actor,segments[2],input,key);}
      if(segments[0]==='dealer'&&segments[1]==='restocks'&&segments[2]){if(segments[3]==='sell-through')return dealers.sellThrough(actor,segments[2],input,key);if(segments[3]==='returns')return dealers.requestReturn(actor,segments[2],input,key);if(segments[3]==='settlements')return dealers.createSettlement(actor,segments[2],input,key);}
      if(segments[0]==='dealer'&&segments[1]==='returns'&&segments[2]&&['receive','reject'].includes(segments[3]))return dealers.decideReturn(actor,segments[2],input,key,segments[3]==='receive');
      if(segments[0]==='dealer'&&segments[1]==='settlements'&&segments[2]&&segments[3]==='payments')return dealers.recordSettlementPayment(actor,segments[2],input,key);
      if(path==='/expenses')return operations.createExpense(actor,input,key);
      if(segments[0]==='dayclose'&&recordId&&command==='reopen')return amendments.reopenDayClose(actor,recordId,input);
      if(segments[0]==='expenses'&&recordId&&command==='post')return amendments.postExpense(actor,recordId,input,key);
      if(segments[0]==='expense-postings'&&recordId&&command==='reverse')return amendments.reverseExpense(actor,recordId,input,key);
      if(path==='/people/invitations')return amendments.createInvitation(actor,input);
      if(path==='/people/invitations/accept')return amendments.acceptInvitation(actor,input);
      if(segments[0]==='people'&&segments[1]==='invitations'&&segments[2]&&segments[3]==='revoke')return amendments.revokeInvitation(actor,segments[2],input);
      if(path==='/availability')return amendments.saveAvailability(actor,input);
      if(path==='/notification-preferences')return amendments.savePreferences(actor,input);
      if(segments[0]==='expenses'&&recordId&&command==='approve')return operations.approveExpense(actor,recordId,input);
      if(path==='/reconciliations')return operations.reconcile(actor,input);
      if(segments[0]==='reconciliations'&&recordId&&command==='approve')return operations.approveReconciliation(actor,recordId,input);
      if(path==='/shifts')return operations.createShift(actor,input);
      if(segments[0]==='shifts'&&recordId){if(command==='handoff')return operations.handoff(actor,recordId,input);if(command==='acknowledge')return operations.acknowledgeShift(actor,recordId,input);}
      if(path==='/dayclose')return operations.createDayClose(actor,input);
      if(segments[0]==='dayclose'&&recordId&&command==='review')return operations.reviewDayClose(actor,recordId,input);
      if(segments[0]==='dayclose'&&recordId&&command==='approve')return operations.approveDayClose(actor,recordId,input);
      if(path==='/qc')return operations.createQc(actor,input);
      if(path==='/qc/sops')return operations.saveQcSop(actor,input);
      if(segments[0]==='qc'&&recordId&&command==='release')return operations.releaseQc(actor,recordId,input);
      if(path==='/jobs')return jobs.enqueue(actor,input,key);
      if(path==='/runtime-controls')return runtimeControls.change(actor,input);
      if(path==='/research/sources')return automation.captureSource(actor,input,key);
      if(path==='/research/briefs')return automation.saveBrief(actor,input,key);
      if(path==='/research/grants')return automation.grant(actor,input);
      if(segments[0]==='research'&&segments[1]==='grants'&&segments[2]&&segments[3]==='revoke')return automation.revoke(actor,segments[2],input);
      if(segments[0]==='campaigns'&&recordId&&command==='postiz-prepare')return automation.preparePostiz(actor,recordId,input,key);
      if(path==='/jev/assessments')return jevEvaluations.assess(actor,input);
      if(path==='/jev/evaluations')return jevEvaluations.evaluate(actor,input);
      if(segments[0]==='jobs'&&recordId&&command==='cancel'){fields(object(input),[]);return jobs.cancel(actor,recordId);}
      if(path==='/research'){auth.founder(actor);fail('RESEARCH_ADAPTER_UNAVAILABLE',409,'Research automatik belum disahkan. Rekod sumber secara manual dalam dokumen.');}
    }
    fail('NOT_FOUND',404,'Laluan tidak ditemui.');
  }
  return {
    store, auth, commerce, work, jobs,
    async fetch(request:Request):Promise<Response> {
      const requestId=randomUUID();
      try {
        const url=new URL(request.url),path=url.pathname.replace(/^\/api\/platform/,'');
        if(!url.pathname.startsWith('/api/platform/'))fail('NOT_FOUND',404);
        if(!['GET','POST'].includes(request.method))fail('METHOD_NOT_ALLOWED',405);
        if(request.method==='POST'&&!allowedOrigins.includes(request.headers.get('origin')??''))fail('ORIGIN_DENIED',403,'Asal permintaan tidak dibenarkan.');
        if(request.method==='POST'&&path==='/evidence/upload'){const actor=auth.resolve(request);store.rate(`upload:${actor.user.id}`,12);auth.csrf(actor,request.headers.get('x-csrf-token'));if(runtimeControls.current().activeRelease==='platform-local-readonly-v1')fail('RELEASE_READ_ONLY',409);if(!request.headers.get('content-type')?.startsWith('multipart/form-data;'))fail('CONTENT_TYPE',415);return json({ok:true,data:await evidenceFiles.upload(actor,request)});}
        let input:unknown=undefined;
        if(request.method==='POST') {if(!request.headers.get('content-type')?.includes('application/json'))fail('CONTENT_TYPE',415);const body=new TextDecoder().decode(await boundedBody(request,256*1024));try{input=JSON.parse(body);}catch{fail('INVALID_JSON',400);}object(input);}
        if(request.method==='GET'&&path==='/catalogue')return collection(commerce.catalogue(),url);
        if(request.method==='GET'&&path==='/catalogue/version')return json({ok:true,data:{version:commerce.version()}});
        if(request.method==='GET'&&/^\/catalogue\/[^/]+$/.test(path)&&path!=='/catalogue/admin')return json({ok:true,data:reports.publishedProduct(path.split('/')[2])});
        if(request.method==='GET'&&path==='/bootstrap-status')return json({ok:true,data:{required:!store.metadata('owner_bootstrapped'),localOnly:true}});
        if(request.method==='GET'&&path==='/public-info'){const p=operations.settings().approvedPolicies;return json({ok:true,data:{contact:p.contact??null,paymentInstructions:p.paymentInstructions??null,locations:p.locations??[],version:operations.settings().version}});}
        if(request.method==='GET'&&path==='/flows')return json({ok:true,data:flows.all()});
        if(request.method==='GET'&&path.startsWith('/flows/'))return json({ok:true,data:flows.definition(path.slice(7))});
        if(request.method==='POST'&&['/auth/signup','/auth/login','/auth/bootstrap'].includes(path)) {
          store.rate('identity-global',options.rateLimits?.identityGlobal??30);const authInput=object(input);if(typeof authInput.email==='string')store.rate(`identity:${authInput.email.toLowerCase()}`,options.rateLimits?.identityAccount??6);
          const result=await auth.authenticate(path.slice(6) as 'signup'|'login'|'bootstrap',input);
          return json({ok:true,data:result.data},200,{'Set-Cookie':result.cookie+(url.protocol==='https:'?'; Secure':'')});
        }
        const actor=auth.resolve(request);store.rate(`actor:${actor.user.id}`,options.rateLimits?.actor??180);
        if(request.method==='GET'&&/^\/evidence\/[^/]+\/file$/.test(path))return evidenceFiles.download(actor,path.split('/')[2],url);
        if(request.method==='GET'&&/^\/exports\/[^/]+\/file$/.test(path))return await evidenceFiles.downloadExport(actor,path.split('/')[2],url);
        if(request.method==='POST')auth.csrf(actor,request.headers.get('x-csrf-token'));
        if(request.method==='POST'&&runtimeControls.current().activeRelease==='platform-local-readonly-v1'&&!['/runtime-controls','/auth/logout'].includes(path))fail('RELEASE_READ_ONLY',409,'Release semasa hanya membenarkan bacaan. Data kekal tersimpan.');
        if(request.method==='POST'&&path.startsWith('/legacy-ai/'))return json(await generateLegacyContent(auth,actor,path,input));
        if(request.method==='POST'&&path==='/research/run')return json({ok:true,data:await automation.research(actor,input,request.headers.get('idempotency-key'))});
        const data=request.method==='POST'?store.atomic(()=>postRoute(actor,path,input,request.headers.get('idempotency-key'),url)):route(actor,request.method,path,input,null,url);
        if(Array.isArray(data))return collection(data,url);
        return json({ok:true,data},200,path==='/auth/logout'?{'Set-Cookie':cookieClear}:{});
      } catch(error) {
        const domain=error instanceof DomainError?error:new DomainError('INTERNAL_ERROR',500,'Perkhidmatan tidak tersedia. Cuba semula.');
        try{options.log?.({requestId,code:domain.code,status:domain.status});}catch{console.warn('Platform redacted audit logging unavailable.');}
        return json({ok:false,code:domain.code,requestId,message:domain.message},domain.status,domain.status===429?{'Retry-After':'60'}:{});
      }
    },
    close(){store.close();},
  };
}
