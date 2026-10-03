import type { CaseRecord, CaseMessage, EvidenceRecord, TaskRecord, DocumentRecord, KnowledgeEntry, CalendarEventRecord, ActionPreview, ExecutionReceipt, OrderRecord } from '../../shared/platform-contracts';
import type { CollaborationTask, ResearchLineage, SourcedDocumentRecord, SourcedKnowledgeEntry, TaskChecklistItem, TaskCollaboration, TaskComment, TaskCompletionReceipt } from '../../shared/work-collaboration-contracts';
import type { SavedResearchBrief } from '../../shared/automation-contracts';
import { Auth, hash, type Principal } from './auth';
import { Commerce } from './commerce';
import { DomainError, fields, fail, id, integer, now, object, oneOf, PlatformStore, strings, text, date } from './store';

export class Work {
  constructor(readonly store:PlatformStore,readonly auth:Auth,readonly commerce:Commerce) {}
  staff(actor:Principal) { if (!this.auth.has(actor,'founder')&&!this.auth.has(actor,'staff')) fail('FORBIDDEN',403); }
  entity(actor:Principal,entityId:string) {
    const order=this.store.get<OrderRecord>('orders',entityId);if(order){this.commerce.order(actor,entityId);return;}
    const complaint=this.store.get<CaseRecord>('cases',entityId);if(complaint){this.case(actor,entityId);return;}
    const task=this.store.get<TaskRecord>('tasks',entityId);if(task){this.task(actor,entityId);return;}
    const doc=this.store.get<DocumentRecord>('documents',entityId);if(doc){this.document(actor,entityId);return;}
    const campaign=this.store.get<{ownerId:string}>('campaigns',entityId);if(campaign){this.staff(actor);if(!this.auth.has(actor,'founder')&&campaign.ownerId!==actor.user.id)fail('FORBIDDEN',403);return;}
    const restock=this.store.get<{customerId:string;dealerOrgId:string}>('restocks',entityId);if(restock){if(!this.auth.has(actor,'founder')&&!actor.memberships.some(m=>m.role==='customer'&&m.status==='active'&&m.dealerOrgId===restock.dealerOrgId))fail('FORBIDDEN',403);return;}
    const lot=this.store.get<{ownerId:string;custodyId:string;locationId:string}>('lots',entityId);if(lot){if(!this.auth.has(actor,'founder')&&!actor.memberships.some(m=>(m.role==='staff'&&m.outletIds.includes(lot.locationId))||m.dealerOrgId===lot.ownerId||m.dealerOrgId===lot.custodyId))fail('FORBIDDEN',403);return;}
    for(const kind of ['qc','shifts','expenses','dayclose']){const operation=this.store.get<{outletId:string}>(kind,entityId);if(operation){this.auth.operational(actor,operation.outletId);return;}}
    if(entityId==='business'){this.auth.founder(actor);return;}
    fail('NOT_FOUND',404,'Rekod berkaitan tidak ditemui.');
  }
  createCase(actor:Principal,raw:unknown):CaseRecord {
    const input=object(raw);fields(input,['orderId','subject','description']);const order=this.commerce.order(actor,text(input.orderId));
    const record:CaseRecord={id:id(),orderId:order.id,customerId:order.customerId,subject:text(input.subject,'Tajuk',160),description:text(input.description,'Penerangan',6000),status:'open',revision:1,createdAt:now()};this.store.save('cases',record);this.store.audit(actor.user.id,'case.create',record.id);return record;
  }
  case(actor:Principal,caseId:string):CaseRecord {const record=this.store.require<CaseRecord>('cases',caseId);const order=this.store.require<OrderRecord>('orders',record.orderId);this.auth.own(actor,record.customerId,order.outletId,record.assignedStaffId);return record;}
  cases(actor:Principal) {return this.store.all<CaseRecord>('cases').filter(c=>{const order=this.store.get<OrderRecord>('orders',c.orderId);return c.customerId===actor.user.id||this.auth.has(actor,'founder')||actor.memberships.some(m=>m.role==='staff'&&order&&m.outletIds.includes(order.outletId)&&(!c.assignedStaffId||c.assignedStaffId===actor.user.id));});}
  assignCase(actor:Principal,caseId:string,raw:unknown) {
    this.auth.founder(actor);const input=object(raw);fields(input,['expectedRevision','assignedStaffId']);const record=this.case(actor,caseId);this.store.revision(record.revision,input.expectedRevision);const staffId=text(input.assignedStaffId);const order=this.store.require<OrderRecord>('orders',record.orderId);
    if (!this.auth.memberships(staffId).some(m=>m.role==='staff'&&m.outletIds.includes(order.outletId)))fail('ASSIGNEE_SCOPE',409);
    const updated={...record,assignedStaffId:staffId,status:'investigating' as const,revision:record.revision+1};this.store.save('cases',updated);this.store.audit(actor.user.id,'case.assign',caseId,updated.revision);return updated;
  }
  resolveCase(actor:Principal,caseId:string,raw:unknown) {
    this.auth.founder(actor);const input=object(raw);fields(input,['expectedRevision','determination']);const record=this.case(actor,caseId);this.store.revision(record.revision,input.expectedRevision);const updated={...record,determination:text(input.determination,'Keputusan manusia',6000),status:'resolved' as const,revision:record.revision+1};this.store.save('cases',updated);this.store.audit(actor.user.id,'case.resolve',caseId,updated.revision);return updated;
  }
  reply(actor:Principal,caseId:string,raw:unknown) {
    const input=object(raw);fields(input,['expectedRevision','body']);const record=this.case(actor,caseId);this.store.revision(record.revision,input.expectedRevision);
    const message:CaseMessage={id:id(),caseId,authorId:actor.user.id,body:text(input.body,'Mesej',6000),createdAt:now(),channel:'in_app'};this.store.save('messages',message);this.store.save('cases',{...record,revision:record.revision+1});this.store.audit(actor.user.id,'case.reply',caseId,record.revision+1);return message;
  }
  messages(actor:Principal,caseId:string) {this.case(actor,caseId);return this.store.all<CaseMessage>('messages').filter(m=>m.caseId===caseId).reverse();}
  createEvidence(actor:Principal,raw:unknown) {
    const input=object(raw);fields(input,['entityId','name','mimeType','size','description','sha256']);const entityId=text(input.entityId);this.entity(actor,entityId);
    const mimeType=oneOf(input.mimeType,['image/jpeg','image/png','image/webp','application/pdf','text/plain'] as const);
    const record:EvidenceRecord={id:id(),entityId,ownerId:actor.user.id,name:text(input.name,'Nama bukti',180),mimeType,size:integer(input.size,'Saiz',0,5*1024*1024),storageRef:'metadata-only',visibility:'case',createdAt:now(),kind:'metadata'};
    if(input.sha256!==undefined){const digest=text(input.sha256,'Hash',64);if(!/^[a-f\d]{64}$/i.test(digest))fail('INVALID_HASH');record.sha256=digest;}
    if(input.description!==undefined)text(input.description,'Penerangan',2000);
    this.linkEvidence(record);this.store.audit(actor.user.id,'evidence.metadata',record.id);return record;
  }
  linkEvidence(record:EvidenceRecord){this.store.save('evidence',record);for(const kind of ['qc','expenses']){const entity=this.store.get<{id:string;evidenceIds:string[];revision:number;status:string}>(kind,record.entityId);if(entity){if(kind==='qc'&&entity.status==='released')fail('QC_ALREADY_RELEASED',409);this.store.save(kind,{...entity,evidenceIds:[...new Set([...entity.evidenceIds,record.id])],revision:entity.revision+1,...(kind==='expenses'?{status:'draft'}:{})});}}const complaint=this.store.get<CaseRecord>('cases',record.entityId);if(complaint)this.store.save('cases',{...complaint,revision:complaint.revision+1});}
  evidence(actor:Principal,entityId:string) {this.entity(actor,entityId);return this.store.all<EvidenceRecord>('evidence').filter(e=>e.entityId===entityId);}
  task(actor:Principal,taskId:string) {const record=this.store.require<CollaborationTask>('tasks',taskId);if(!this.auth.has(actor,'founder')&&record.assigneeId!==actor.user.id&&record.ownerId!==actor.user.id)fail('FORBIDDEN',403);this.staff(actor);return record;}
  tasks(actor:Principal) {this.staff(actor);return this.store.all<CollaborationTask>('tasks').filter(t=>this.auth.has(actor,'founder')||t.assigneeId===actor.user.id||t.ownerId===actor.user.id);}
  createTask(actor:Principal,raw:unknown) {
    this.staff(actor);const input=object(raw);fields(input,['entityId','title','assigneeId','dueAt','documentIds','outletId']);const assigneeId=text(input.assigneeId),entityId=text(input.entityId,'Rekod berkaitan',120);
    if(entityId!=='business')this.entity(actor,entityId);
    if(assigneeId!==actor.user.id)this.auth.founder(actor);
    if(!this.auth.memberships(assigneeId).some(m=>['founder','staff'].includes(m.role)))fail('ASSIGNEE_SCOPE',409);
    const documentIds=strings(input.documentIds??[]);for(const documentId of documentIds)this.document(actor,documentId);
    const record:TaskRecord={id:id(),entityId,title:text(input.title,'Tajuk',200),assigneeId,documentIds,ownerId:actor.user.id,status:'open',revision:1,createdAt:now(),...(input.dueAt?{dueAt:date(input.dueAt)}:{}),...(input.outletId?{outletId:text(input.outletId)}:{})};this.store.save('tasks',record);this.store.audit(actor.user.id,'task.create',record.id);return record;
  }
  updateTask(actor:Principal,taskId:string,raw:unknown,key?:unknown):CollaborationTask {
    this.task(actor,taskId);
    const command=()=>{
      const input=object(raw);fields(input,['expectedRevision','status','outcome']);const record=this.task(actor,taskId);this.store.revision(record.revision,input.expectedRevision);const status=oneOf(input.status,['open','in_progress','done'] as const);
      const outcome=input.outcome===undefined?undefined:text(input.outcome,'Hasil kerja',6000);
      if(status==='done'&&!outcome)fail('OUTCOME_REQUIRED',409);
      if(status==='done'&&record.status==='done')fail('INVALID_TRANSITION',409);
      if(status==='done'&&(record.checklist??[]).some(item=>item.required&&!item.checked))fail('REQUIRED_CHECKLIST_INCOMPLETE',409,'Semak semua checklist wajib sebelum menyelesaikan task.');
      const nextRevision=record.revision+1;
      const receipt:TaskCompletionReceipt|undefined=status==='done'?{id:id(),taskId,taskRevision:nextRevision,completedBy:actor.user.id,outcome:outcome!,checklist:(record.checklist??[]).map(item=>({...item})),status:'completed',createdAt:now()}:undefined;
      const updated:CollaborationTask={...record,status,revision:nextRevision,...(outcome?{outcome}:{}),completionReceiptId:receipt?.id};
      if(status==='done'){
        this.store.save('task_completion_receipts',receipt!);
      }
      this.store.save('tasks',updated);this.store.audit(actor.user.id,'task.update',taskId,updated.revision);return updated;
    };
    return key===undefined||key===null?this.store.atomic(command):this.commerce.idem(actor,`task.update:${taskId}`,key,raw,command);
  }
  collaboration(actor:Principal,taskId:string):TaskCollaboration {
    const task=this.task(actor,taskId);
    return {task,comments:this.store.all<TaskComment>('task_comments').filter(comment=>comment.taskId===taskId).sort((a,b)=>a.taskRevision-b.taskRevision),receipts:this.store.all<TaskCompletionReceipt>('task_completion_receipts').filter(receipt=>receipt.taskId===taskId)};
  }
  addChecklist(actor:Principal,taskId:string,raw:unknown,key:unknown):CollaborationTask {
    this.task(actor,taskId);
    return this.commerce.idem(actor,`task.checklist.add:${taskId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedRevision','title','required']);const task=this.task(actor,taskId);this.store.revision(task.revision,input.expectedRevision);
      if(task.status==='done')fail('TASK_ALREADY_COMPLETED',409);
      if((task.checklist??[]).length>=50)fail('CHECKLIST_LIMIT',409);
      if(input.required!==undefined&&typeof input.required!=='boolean')fail('INVALID_INPUT');
      const item:TaskChecklistItem={id:id(),title:text(input.title,'Checklist',300),required:input.required===undefined?true:input.required as boolean,checked:false};
      const updated={...task,revision:task.revision+1,checklist:[...(task.checklist??[]),item]};
      this.store.save('tasks',updated);this.store.audit(actor.user.id,'task.checklist.add',taskId,updated.revision);return updated;
    });
  }
  checkChecklist(actor:Principal,taskId:string,itemId:string,raw:unknown,key:unknown):CollaborationTask {
    this.task(actor,taskId);
    return this.commerce.idem(actor,`task.checklist.check:${taskId}:${itemId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedRevision','checked']);const task=this.task(actor,taskId);this.store.revision(task.revision,input.expectedRevision);
      if(task.status==='done')fail('TASK_ALREADY_COMPLETED',409);
      if(typeof input.checked!=='boolean')fail('INVALID_INPUT');
      if(!(task.checklist??[]).some(item=>item.id===itemId))fail('NOT_FOUND',404);
      const checklist=(task.checklist??[]).map(item=>item.id===itemId?{id:item.id,title:item.title,required:item.required,checked:input.checked as boolean,...(input.checked?{checkedBy:actor.user.id,checkedAt:now()}:{})}:item);
      const updated={...task,revision:task.revision+1,checklist};this.store.save('tasks',updated);this.store.audit(actor.user.id,'task.checklist.check',taskId,updated.revision);return updated;
    });
  }
  commentTask(actor:Principal,taskId:string,raw:unknown,key:unknown):TaskComment {
    this.task(actor,taskId);
    return this.commerce.idem(actor,`task.comment:${taskId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedRevision','body']);const task=this.task(actor,taskId);this.store.revision(task.revision,input.expectedRevision);
      if(this.store.all<TaskComment>('task_comments').filter(comment=>comment.taskId===taskId).length>=500)fail('COMMENT_LIMIT',409);
      const comment:TaskComment={id:id(),taskId,authorId:actor.user.id,body:text(input.body,'Comment',4000),taskRevision:task.revision+1,createdAt:now()};
      this.store.save('task_comments',comment);this.store.save('tasks',{...task,revision:comment.taskRevision});this.store.audit(actor.user.id,'task.comment',taskId,comment.taskRevision);return comment;
    });
  }
  completeTask(actor:Principal,taskId:string,raw:unknown,key:unknown):TaskCompletionReceipt {
    this.task(actor,taskId);
    return this.commerce.idem(actor,`task.complete:${taskId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedRevision','outcome']);
      const task=this.updateTask(actor,taskId,{...input,status:'done'});
      return this.store.require<TaskCompletionReceipt>('task_completion_receipts',task.completionReceiptId!);
    });
  }
  private sourcedDocument(record:DocumentRecord&Partial<SourcedDocumentRecord>):SourcedDocumentRecord {
    return {...record,sourceRefs:record.sourceRefs??[],researchLineage:record.researchLineage??[],contentHash:record.contentHash??hash(JSON.stringify({title:record.title,body:record.body}))};
  }
  document(actor:Principal,documentId:string):SourcedDocumentRecord {this.staff(actor);const record=this.store.require<DocumentRecord>('documents',documentId);if(record.visibility==='private'&&record.ownerId!==actor.user.id)fail('FORBIDDEN',403);return this.sourcedDocument(record);}
  documents(actor:Principal) {this.staff(actor);return this.store.all<DocumentRecord>('documents').filter(d=>d.visibility==='business'||d.ownerId===actor.user.id).map(record=>this.sourcedDocument(record));}
  documentVersions(actor:Principal,documentId:string):SourcedDocumentRecord[] {
    const current=this.document(actor,documentId);
    return [current,...this.store.all<DocumentRecord&{documentId:string}>('document_revisions').filter(record=>record.documentId===documentId&&(record.visibility==='business'||record.ownerId===actor.user.id)).map(record=>this.sourcedDocument(record))].sort((a,b)=>b.version-a.version);
  }
  saveDocument(actor:Principal,raw:unknown,documentId?:string) {
    this.staff(actor);const input=object(raw);fields(input,documentId?['title','body','visibility','entityIds','expectedVersion','researchBriefIds']:['title','body','visibility','entityIds','researchBriefIds']);const existing=documentId?this.document(actor,documentId):null;
    if(existing){if(existing.ownerId!==actor.user.id)this.auth.founder(actor);this.store.revision(existing.version,input.expectedVersion);}
    const entityIds=strings(input.entityIds??[]);for(const entityId of entityIds)if(entityId!=='business')this.entity(actor,entityId);
    let sourceRefs=existing?.sourceRefs??[],researchLineage=existing?.researchLineage??[];
    if(input.researchBriefIds!==undefined){
      this.auth.founder(actor);
      const briefs=[...new Set(strings(input.researchBriefIds,20))].map(briefId=>{
        const brief=this.store.require<SavedResearchBrief>('research_briefs',briefId);
        if(brief.ownerId!==actor.user.id)fail('FORBIDDEN',403);
        if(!['completed','partial'].includes(brief.status)||!brief.sourceRefs.length||brief.sourceRefs.some(source=>source.termsCheck==='restricted'))fail('RESEARCH_BRIEF_NOT_USABLE',409);
        return brief;
      });
      sourceRefs=briefs.flatMap(brief=>brief.sourceRefs.map(source=>({...source})));
      researchLineage=briefs.map((brief):ResearchLineage=>({briefId:brief.id,capturedAt:brief.retrievedAt,summaryHash:hash(brief.summary),sourceHashes:brief.sourceRefs.map(source=>source.contentHash??hash(source.url)),synthesis:brief.synthesis}));
    }
    const title=text(input.title,'Tajuk',200),body=text(input.body,'Dokumen',100_000);
    const record:SourcedDocumentRecord={id:existing?.id??id(),title,body,visibility:oneOf(input.visibility,['private','business'] as const),entityIds,ownerId:existing?.ownerId??actor.user.id,version:(existing?.version??0)+1,createdAt:existing?.createdAt??now(),sourceRefs,researchLineage,contentHash:hash(JSON.stringify({title,body}))};
    if(existing)this.store.save('document_revisions',{...existing,id:`${existing.id}:${existing.version}`,documentId:existing.id});
    this.store.save('documents',record);this.store.audit(actor.user.id,'document.save',record.id,record.version);return record;
  }
  linkResearch(actor:Principal,documentId:string,raw:unknown,key:unknown):SourcedDocumentRecord {
    this.auth.founder(actor);this.document(actor,documentId);
    return this.commerce.idem(actor,`document.research:${documentId}`,key,raw,()=>{
      const input=object(raw);fields(input,['expectedVersion','researchBriefIds']);const document=this.document(actor,documentId);
      if(input.researchBriefIds===undefined)fail('SOURCE_REQUIRED');
      return this.saveDocument(actor,{title:document.title,body:document.body,visibility:document.visibility,entityIds:document.entityIds,expectedVersion:input.expectedVersion,researchBriefIds:input.researchBriefIds},documentId);
    });
  }
  publishDocument(actor:Principal,documentId:string,raw:unknown) {
    this.auth.founder(actor);const input=object(raw);fields(input,['expectedVersion','expiresAt']);const record=this.document(actor,documentId);this.store.revision(record.version,input.expectedVersion);if(record.visibility!=='business')fail('PRIVATE_DOCUMENT',409);
    const expiresAt=input.expiresAt?date(input.expiresAt):undefined;if(expiresAt&&expiresAt<=now())fail('INVALID_EXPIRY');
    for(const previous of this.store.all<KnowledgeEntry>('knowledge').filter(k=>k.documentId===documentId&&k.status==='approved'))this.store.save('knowledge',{...previous,status:'retired' as const});
    const knowledge:SourcedKnowledgeEntry={id:id(),documentId,version:record.version,status:'approved',sourceRefs:record.sourceRefs.map(source=>({...source})),researchLineage:record.researchLineage.map(lineage=>({...lineage,sourceHashes:[...lineage.sourceHashes]})),documentContentHash:record.contentHash,approvedBy:actor.user.id,title:record.title,body:record.body,...(expiresAt?{expiresAt}:{})};this.store.save('knowledge',knowledge);this.store.save('documents',{...record,approvedVersion:record.version});this.store.audit(actor.user.id,'knowledge.publish',knowledge.id,knowledge.version);return knowledge;
  }
  knowledge(actor:Principal,query='') {this.staff(actor);return this.store.all<KnowledgeEntry>('knowledge').filter(k=>k.status==='approved'&&(!k.expiresAt||k.expiresAt>now())&&`${k.title} ${k.body}`.toLowerCase().includes(query.toLowerCase()));}
  retireKnowledge(actor:Principal,knowledgeId:string,raw:unknown){this.auth.founder(actor);const input=object(raw);fields(input,['expectedVersion']);const record=this.store.require<KnowledgeEntry>('knowledge',knowledgeId);this.store.revision(record.version,input.expectedVersion);this.store.audit(actor.user.id,'knowledge.retire',knowledgeId,record.version);return this.store.save('knowledge',{...record,status:'retired' as const});}
  calendar(actor:Principal):CalendarEventRecord[] {
    this.staff(actor);
    const role=this.auth.has(actor,'founder')?'founder':'staff';
    const kinds:[string,NonNullable<CalendarEventRecord['entityLinks']>[number]['kind'],string][]=[['orders','order','orders'],['cases','case','cases'],['tasks','task','tasks'],['documents','document','documents'],['campaigns','campaign','marketing'],['restocks','restock','dealers'],['lots','lot','inventory'],['qc','qc','qc'],['shifts','shift','shifts'],['expenses','expense','finance'],['dayclose','dayclose','finance']];
    return this.store.all<CalendarEventRecord>('calendar').filter(event=>role==='founder'||event.ownerId===actor.user.id).map(event=>({
      ...event,entityLinks:event.entityIds.flatMap(entityId=>{
        try{this.entity(actor,entityId);}catch(error){if(error instanceof DomainError&&['FORBIDDEN','NOT_FOUND'].includes(error.code))return [];throw error;}
        if(entityId==='business')return [{id:entityId,kind:'business' as const,path:`/${role}/overview`}];
        const resolved=kinds.find(([recordKind])=>this.store.get(recordKind,entityId)!==null);
        if(!resolved)return [];
        const [,kind,section]=resolved;
        if(role==='staff'&&['marketing','dealers','inventory','finance'].includes(section))return [];
        return [{id:entityId,kind,path:`/${role}/${section}/${encodeURIComponent(entityId)}`}];
      })
    }));
  }
  saveCalendar(actor:Principal,raw:unknown,eventId?:string){this.staff(actor);const input=object(raw);fields(input,eventId?['title','entityIds','startAt','endAt','expectedRevision']:['title','entityIds','startAt','endAt']);const existing=eventId?this.store.require<CalendarEventRecord>('calendar',eventId):null;if(existing){if(existing.ownerId!==actor.user.id)this.auth.founder(actor);this.store.revision(existing.revision,input.expectedRevision);}const startAt=date(input.startAt),endAt=date(input.endAt);if(endAt<=startAt)fail('INVALID_DATE_RANGE');const entityIds=strings(input.entityIds??[]);for(const entityId of entityIds)if(entityId!=='business')this.entity(actor,entityId);const record:CalendarEventRecord={id:existing?.id??id(),title:text(input.title,'Tajuk',200),entityIds,ownerId:existing?.ownerId??actor.user.id,startAt,endAt,timezone:'Asia/Kuala_Lumpur',revision:(existing?.revision??0)+1};this.store.save('calendar',record);this.store.audit(actor.user.id,'calendar.save',record.id,record.revision);return record;}
  prepareMessage(actor:Principal,caseId:string,raw:unknown) {this.staff(actor);const input=object(raw);fields(input,['expectedRevision','body','channel']);const record=this.case(actor,caseId);this.store.revision(record.revision,input.expectedRevision);const channel=oneOf(input.channel,['in_app','manual_whatsapp'] as const);const preview:ActionPreview={id:id(),entityId:caseId,operation:channel==='in_app'?'message.in_app':'message.manual_export',recipient:record.customerId,revision:record.revision,body:text(input.body,'Mesej',6000),expiresAt:new Date(Date.now()+10*60_000).toISOString()};this.store.save('previews',preview);return preview;}
  confirmMessage(actor:Principal,previewId:string,raw:unknown,key:unknown){this.staff(actor);const authorizedPreview=this.store.require<ActionPreview>('previews',previewId);this.case(actor,authorizedPreview.entityId);return this.commerce.idem(actor,'message.confirm:'+previewId,key,raw,()=>{const input=object(raw);fields(input,['expectedRevision']);const preview=this.store.require<ActionPreview>('previews',previewId),record=this.case(actor,preview.entityId);this.store.revision(preview.revision,input.expectedRevision);if(record.revision!==preview.revision||record.customerId!==preview.recipient||preview.expiresAt<=now())fail('PREVIEW_EXPIRED',409);if(preview.operation==='message.in_app')this.reply(actor,record.id,{expectedRevision:record.revision,body:preview.body});const receipt:ExecutionReceipt={id:id(),requestId:id(),status:preview.operation==='message.in_app'?'confirmed':'unknown',evidenceIds:[],createdAt:now()};this.store.save('execution_receipts',receipt);this.store.audit(actor.user.id,preview.operation,record.id,record.revision);return {...receipt,...(preview.operation==='message.manual_export'?{content:preview.body,reasonCode:'MANUAL_SEND_UNCONFIRMED'}:{})};});}
}
