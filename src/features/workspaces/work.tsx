import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText,MessageSquare,Plus,ShieldCheck } from 'lucide-react';
import type { ActionPreview,CaseMessage,CaseRecord,DocumentRecord,ExecutionReceipt,OrderRecord,SessionData,TaskRecord,WorkspaceRole } from '../../../shared/platform-contracts';
import type { SourcedDocumentRecord,SourcedKnowledgeEntry,TaskCollaboration } from '../../../shared/work-collaboration-contracts';
import type { SavedResearchBrief } from '../../../shared/automation-contracts';
import { api,useResource } from '../platform/client';
import { dateLabel,malaysiaDateTime } from './experience-model';
import { EvidenceUpload } from './commerce';
import { Empty,field,FormPanel,MutationButton,Panel,RecordMeta,Refresh,ResourceState,SearchBox,splitRefs,Status } from './ui';

export function Tasks({ role,onChanged,entityId }: { entityId?:string;role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<TaskRecord[]>('/tasks');
  const session=useResource<SessionData>('/session');
  const [filter,setFilter]=useState('open');
  const [create,setCreate]=useState(false);
  const [selected,setSelected]=useState<TaskRecord|null>(null);
  const [deepError,setDeepError]=useState('');
  useEffect(()=>{if(!entityId)return;const controller=new AbortController();api<TaskRecord>('/tasks/'+encodeURIComponent(entityId),{signal:controller.signal}).then(setSelected).catch(error=>{if(!controller.signal.aborted)setDeepError(error instanceof Error?error.message:'Rekod tidak tersedia.');});return()=>controller.abort();},[entityId]);
  const refresh=() => { resource.reload(); onChanged?.(); };
  const tasks=resource.data?.filter(task => filter==='all'||(filter==='open'? task.status!=='done':task.status==='done'))??[];
  return <>
    {deepError&&<p role="alert" className="platform-alert">{deepError}</p>}<Panel title={role==='staff'? 'Tugasan saya':'Tasks & outcomes'} eyebrow="Assigned work · durable receipts" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setCreate(!create)}>
        <Plus size={17} /> Tugasan baharu</button>
    </div>}>
      <ResourceState {...resource} />
      <div className="xp-tablist" aria-label="Task filter">{['open','done','all'].map(value => <button className={value===filter? 'xp-tab-active':''} key={value} onClick={() => setFilter(value)}>{value==='open'? 'Perlu tindakan':value==='done'? 'Selesai':'Semua'}</button>)}</div>
      <div className="xp-record-list">{tasks.map(task => <article className="xp-task" key={task.id}>
        <div>
          <h3>{task.title}</h3>
          <p>Assigned: {task.assigneeId}{task.dueAt? ` · Due ${dateLabel(task.dueAt)}`:''}</p>
          <RecordMeta id={task.id} revision={task.revision} />
          <p className="xp-muted">Context: {task.entityId||'General work'}{task.outletId? ` · ${task.outletId}`:''}</p>{task.outcome&&<p className="xp-outcome">{task.outcome}</p>}</div>
        <div className="xp-actions">
          <Status value={task.status} /><button className="xp-button xp-secondary" onClick={() => setSelected(task)}>{task.status==='done'?'View collaboration':'Update outcome'}</button></div>
      </article>)}</div>{!resource.loading&&!resource.error&&!tasks.length&&<Empty title={filter==='done'? 'Belum ada outcome':'Queue anda kosong'} description="Tugasan memerlukan assignment, context dan outcome apabila diselesaikan." />}</Panel>{create&&<FormPanel title="Cipta tugasan" fields={[field('title','Tajuk tugasan'),field('entityId','Linked record ID',{ required: false,help: 'Order, case, document atau general work.' }),field('assigneeId','Assigned user ID',{ defaultValue: session.data?.user.id }),field('outletId','Outlet scope',{ required: false,defaultValue: session.data?.memberships.find(member => member.role===role)?.outletIds[0] }),field('dueAt','Due date / time (MYT)',{ type: 'datetime-local',required: false }),field('documentIds','Document IDs',{ required: false })]} onCancel={() => setCreate(false)} onSubmit={async values => { const result=await api('/tasks',{ method: 'POST',body: JSON.stringify({ ...values,entityId: values.entityId||'business',documentIds: splitRefs(values.documentIds),dueAt: values.dueAt? malaysiaDateTime(values.dueAt):undefined,outletId: values.outletId||undefined }) }); refresh(); return result; }} />} {selected&&<TaskCollaborationPanel key={selected.id} taskId={selected.id} onChanged={refresh} onClose={() => setSelected(null)} />}</>;
}
function TaskCollaborationPanel({ taskId,onChanged,onClose }: { taskId:string;onChanged:()=>void;onClose:()=>void }) {
  const collaboration=useResource<TaskCollaboration>(`/tasks/${taskId}/collaboration`);
  const refresh=()=>{collaboration.reload();onChanged();};
  const task=collaboration.data?.task;
  return <Panel title="Checklist & task conversation" eyebrow="Scoped collaboration · immutable completion receipts" action={<div className="xp-actions"><Refresh onClick={refresh}/><button className="xp-button xp-secondary" onClick={onClose}>Tutup task</button></div>}>
    <ResourceState {...collaboration}/>
    {task&&<>
      <RecordMeta id={task.id} revision={task.revision}/>
      {(task.checklist??[]).map(item=><article key={item.id} className="xp-task"><div><strong>{item.title}</strong><p>{item.required?'Wajib':'Optional'} · {item.checked?'Checked':'Belum checked'}{item.checkedAt?` · ${dateLabel(item.checkedAt)} oleh ${item.checkedBy}`:''}</p></div>{task.status!=='done'&&<MutationButton path={`/tasks/${task.id}/checklist/${item.id}/check`} input={{expectedRevision:task.revision,checked:!item.checked}} onChanged={refresh}>{item.checked?'Uncheck':'Confirm checked'}</MutationButton>}</article>)}
      {!task.checklist?.length&&<p className="xp-muted">Tiada checklist. Outcome masih wajib untuk menyelesaikan task ini.</p>}
      {task.status!=='done'&&<FormPanel key={`checklist-${task.revision}`} title="Tambah checklist item" fields={[field('title','Kerja yang perlu disemak',{max:300}),field('required','Completion requirement',{defaultValue:'true',options:[{value:'true',label:'Wajib sebelum done'},{value:'false',label:'Optional'}]})]} submitLabel="Simpan checklist item" onSubmit={async values=>{const result=await api(`/tasks/${taskId}/checklist`,{method:'POST',body:JSON.stringify({expectedRevision:task.revision,title:values.title,required:values.required==='true'})});refresh();return result;}}/>}
      <h3>Task comments</h3>
      <div className="xp-conversation">{collaboration.data?.comments.map(comment=><article className="xp-message" key={comment.id}><p>{comment.body}</p><small>{comment.authorId} · {dateLabel(comment.createdAt)} · revision {comment.taskRevision}</small></article>)}</div>
      <FormPanel key={`comment-${task.revision}`} title="Simpan progress / handoff comment" fields={[field('body','Comment',{type:'textarea',max:4000})]} submitLabel="Simpan comment" onSubmit={async values=>{const result=await api(`/tasks/${taskId}/comments`,{method:'POST',body:JSON.stringify({expectedRevision:task.revision,body:values.body})});refresh();return result;}}/>
      {task.status!=='done'&&<FormPanel key={`completion-${task.revision}`} title={`Outcome: ${task.title}`} description="Semua checklist wajib mesti checked. Receipt menyimpan actor, masa, exact task revision dan checklist snapshot." fields={[field('status','Status',{defaultValue:task.status,options:['open','in_progress','done'].map(value=>({value,label:value.replaceAll('_',' ')}))}),field('outcome','Kerja dilaksanakan / evidence / follow-up',{type:'textarea',required:false,max:6000,help:'Outcome wajib apabila done.'})]} submitLabel="Simpan outcome" onSubmit={async values=>{if(values.status==='done'&&!values.outcome)throw new Error('Outcome diperlukan sebelum task diselesaikan.');const result=await api(`/tasks/${taskId}/${values.status==='done'?'complete':'update'}`,{method:'POST',body:JSON.stringify({expectedRevision:task.revision,outcome:values.outcome||undefined,...(values.status==='done'?{}:{status:values.status})})});refresh();return result;}}/>}
      {task.status==='done'&&<MutationButton path={`/tasks/${task.id}/update`} input={{expectedRevision:task.revision,status:'open'}} onChanged={refresh} confirmLabel="Sahkan reopen task">Reopen task</MutationButton>}
      <h3>Completion receipts</h3>
      {collaboration.data?.receipts.map(receipt=><article className="xp-knowledge" key={receipt.id}><Status value={receipt.status}/><p>{receipt.outcome}</p><small>{receipt.completedBy} · {dateLabel(receipt.createdAt)} · task v{receipt.taskRevision}</small><RecordMeta id={receipt.id}/><ul>{receipt.checklist.map(item=><li key={item.id}>{item.title} · {item.checked?'Checked':'Unchecked'} · {item.required?'Required':'Optional'}</li>)}</ul></article>)}
    </>}
  </Panel>;
}
export function Documents({ onChanged,entityId }: { entityId?:string;onChanged?: () => void; }) {
  const resource=useResource<SourcedDocumentRecord[]>('/documents');
  const session=useResource<SessionData>('/session');
  const [search,setSearch]=useState('');
  const [editing,setEditing]=useState<SourcedDocumentRecord|'new'|null>(null);
  const [preview,setPreview]=useState<SourcedDocumentRecord|null>(null);
  const [deepError,setDeepError]=useState('');
  useEffect(()=>{if(!entityId)return;const controller=new AbortController();api<SourcedDocumentRecord>('/documents/'+encodeURIComponent(entityId),{signal:controller.signal}).then(setPreview).catch(error=>{if(!controller.signal.aborted)setDeepError(error instanceof Error?error.message:'Rekod tidak tersedia.');});return()=>controller.abort();},[entityId]);
  const refresh=() => { resource.reload(); onChanged?.(); };
  const documents=resource.data?.filter(document => `${document.title} ${document.body}`.toLowerCase().includes(search.toLowerCase()))??[];
  return <>
    {deepError&&<p role="alert" className="platform-alert">{deepError}</p>}<Panel title="Documents & decisions" eyebrow="Write · version · publish" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setEditing('new')}>
        <Plus size={17} /> Dokumen baharu</button>
    </div>}>
      <ResourceState {...resource} />
      <SearchBox value={search} onChange={setSearch} label="Cari tajuk atau kandungan" />
      <div className="xp-document-grid">{documents.map(document => <article className="xp-document" key={document.id}>
        <span className="xp-document-icon">
          <FileText size={26} />
        </span>
        <div className="xp-document-top">
          <Status value={document.visibility} />
          <span>v{document.version}</span>
        </div>
        <h3>{document.title}</h3>
        <p className="xp-document-excerpt">{document.body.slice(0,180)}</p>
        <RecordMeta id={document.id} />
        <p className="xp-muted">{document.approvedVersion? `Approved version ${document.approvedVersion}`:'Draft · belum diluluskan'}</p>
        <div className="xp-actions">
          <button className="xp-button xp-secondary" onClick={() => setPreview(document)}>Baca</button>
          <button className="xp-button xp-secondary" onClick={() => setEditing(document)}>Edit</button>
        </div>
      </article>)}</div>{!resource.loading&&!resource.error&&!documents.length&&<Empty description="Tulis nota, decision memo atau SOP. Version lama kekal selepas edit." />}</Panel>{editing&&<FormPanel key={editing==='new'? 'new':`${editing.id}:${editing.version}`} title={editing==='new'? 'Dokumen baharu':`Edit ${editing.title}`} description="Markdown disokong. Raw HTML tidak dijalankan. Publishing SOP menggunakan exact version ini." fields={[field('title','Tajuk',{ defaultValue: editing!=='new'? editing.title:'' }),field('body','Kandungan Markdown',{ type: 'textarea',defaultValue: editing!=='new'? editing.body:'',max: 100000 }),field('visibility','Visibility',{ defaultValue: editing!=='new'? editing.visibility:'private',options: [{ value: 'private',label: 'Private / owner' },{ value: 'business',label: 'Business workspace' }] }),field('entityIds','Linked entity IDs',{ required: false,defaultValue: editing!=='new'? editing.entityIds.join(', '):'' })]} onCancel={() => setEditing(null)} onSubmit={async values => {
        const input={ ...values,entityIds: splitRefs(values.entityIds),...(editing!=='new'? { expectedVersion: editing.version }:{}) };
        const result=await api<SourcedDocumentRecord>(editing==='new'? '/documents':`/documents/${editing.id}/update`,{ method: 'POST',body: JSON.stringify(input) }); setEditing(result); refresh(); return result;
      }} />} {preview&&<Panel title={preview.title} eyebrow={`Document v${preview.version}`} action={<button className="xp-button xp-secondary" onClick={() => setPreview(null)}>Tutup</button>}>
        <div className="xp-markdown">
          <ReactMarkdown skipHtml>{preview.body}</ReactMarkdown>
        </div>
        <RecordMeta id={preview.id} revision={preview.version} />
        <DocumentProvenance document={preview}/>
        {session.data?.memberships.some(member=>member.role==='founder')&&<DocumentResearchLink key={`${preview.id}:${preview.version}`} document={preview} onChanged={document=>{setPreview(document);refresh();}}/>}
        <DocumentVersionHistory key={`versions-${preview.id}:${preview.version}`} documentId={preview.id}/>
      </Panel>}</>;
}
function DocumentProvenance({ document }: { document:SourcedDocumentRecord }) {
  return <section><h3>Source provenance</h3><p className="xp-record-meta">Document SHA-256 {document.contentHash}</p>{!document.sourceRefs?.length&&<p className="xp-muted">Tiada research sources dilink kepada version ini.</p>}<ul>{document.sourceRefs?.map((source,index)=><li key={`${source.url}:${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · captured {dateLabel(source.retrievedAt)} · terms {source.termsCheck}</li>)}</ul>{document.researchLineage?.map(lineage=><details key={lineage.briefId}><summary>Research brief {lineage.briefId} · {lineage.synthesis==='human_authored'?'Human interpretation':'Untrusted external synthesis'}</summary><p className="xp-record-meta">Summary SHA-256 {lineage.summaryHash}</p><p>Snapshot {dateLabel(lineage.capturedAt)} · {lineage.sourceHashes.length} source hashes</p></details>)}</section>;
}
function DocumentResearchLink({ document,onChanged }: { document:SourcedDocumentRecord;onChanged:(document:SourcedDocumentRecord)=>void }) {
  const briefs=useResource<SavedResearchBrief[]>('/research/briefs');
  return <><ResourceState {...briefs}/><FormPanel title="Link owned research brief" description="Server menyalin source provenance daripada saved brief anda. Link ini mencipta document version baharu; publishing masih memerlukan human approval." fields={[field('researchBriefId','Saved source-linked brief',{options:briefs.data?.filter(brief=>['completed','partial'].includes(brief.status)&&brief.sourceRefs.length>0).map(brief=>({value:brief.id,label:brief.question}))??[]})]} submitLabel="Create version dengan source lineage" onSubmit={async values=>{const researchBriefIds=[...new Set([...(document.researchLineage??[]).map(lineage=>lineage.briefId),values.researchBriefId])];const result=await api<SourcedDocumentRecord>(`/documents/${document.id}/research`,{method:'POST',body:JSON.stringify({expectedVersion:document.version,researchBriefIds})});onChanged(result);return result;}}/></>;
}
function DocumentVersionHistory({ documentId }: { documentId:string }) {
  const versions=useResource<SourcedDocumentRecord[]>(`/documents/${documentId}/versions`);
  return <section><h3>Immutable version history</h3><ResourceState {...versions}/>{versions.data?.map(version=><details className="xp-knowledge" key={version.version}><summary>{version.title} · version {version.version}</summary><div className="xp-markdown"><ReactMarkdown skipHtml>{version.body}</ReactMarkdown></div><DocumentProvenance document={version}/></details>)}</section>;
}
export function Knowledge({ role,onChanged }: { role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<SourcedKnowledgeEntry[]>('/knowledge');
  const documents=useResource<DocumentRecord[]>('/documents');
  const [search,setSearch]=useState('');
  const [publishing,setPublishing]=useState(false);
  const refresh=() => { resource.reload(); documents.reload(); onChanged?.(); };
  const entries=resource.data?.filter(entry => `${entry.title} ${entry.body}`.toLowerCase().includes(search.toLowerCase()))??[];
  return <>
    <Panel title="Knowledge & approved SOP" eyebrow="Exact source version · explicit expiry" action={<div className="xp-actions">
      <Refresh onClick={refresh} />{role==='founder'&&<button className="xp-button" onClick={() => setPublishing(!publishing)}>
        <ShieldCheck size={17} /> Publish knowledge</button>}</div>}>
      <ResourceState {...resource} />
      <SearchBox value={search} onChange={setSearch} label="Cari SOP atau knowledge" />{entries.map(entry => <details className="xp-knowledge" key={entry.id}>
        <summary>
          <span>
            <strong>{entry.title}</strong>
            <small>Document {entry.documentId} · v{entry.version}{entry.expiresAt? ` · Expires ${dateLabel(entry.expiresAt)}`:''}</small>
          </span>
          <Status value={entry.status} />
        </summary>
        <div className="xp-markdown">
          <ReactMarkdown skipHtml>{entry.body}</ReactMarkdown>
        </div>
        <p className="xp-muted">Approved by {entry.approvedBy??'—'} · {entry.sourceRefs.length} source references</p>
        <ul>{entry.sourceRefs.map((source,index)=><li key={`${source.url}:${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · captured {dateLabel(source.retrievedAt)}</li>)}</ul>
        {entry.documentContentHash&&<p className="xp-record-meta">Approved document SHA-256 {entry.documentContentHash}</p>}
        {entry.researchLineage?.map(lineage=><p className="xp-record-meta" key={lineage.briefId}>Brief {lineage.briefId} · {lineage.synthesis==='human_authored'?'Human interpretation':'Untrusted external synthesis'} · summary SHA-256 {lineage.summaryHash}</p>)}
        {role==='founder'&&entry.status!=='retired'&&<MutationButton path={`/knowledge/${entry.id}/retire`} input={{ expectedVersion: entry.version }} onChanged={refresh} confirmLabel="Sahkan retire SOP">Retire version</MutationButton>}</details>)}{!resource.loading&&!resource.error&&!entries.length&&<Empty description="Hanya knowledge yang dibenarkan scope anda dipaparkan. Draft tidak dianggap current SOP." />}</Panel>{publishing&&<FormPanel title="Publish document sebagai SOP / knowledge" description="Semak kandungan dan exact document version sebelum publish. Edit selepas publication tidak menukar SOP approved." fields={[field('documentId','Source document',{ options: documents.data?.map(document => ({ value: document.id,label: `${document.title} · v${document.version}` }))??[] }),field('expiresAt','Expiry (MYT)',{ type: 'datetime-local',required: false })]} submitLabel="Approve & publish exact version" onCancel={() => setPublishing(false)} onSubmit={async values => {
          const document=documents.data?.find(item => item.id===values.documentId); if(!document) throw new Error('Pilih source document yang sah.');
          const result=await api(`/documents/${document.id}/publish`,{ method: 'POST',body: JSON.stringify({ expectedVersion: document.version,expiresAt: values.expiresAt? malaysiaDateTime(values.expiresAt):undefined }) }); refresh(); return result;
        }} />}</>;
}
export function Cases({ role,onChanged,renderAssessment,entityId }: { entityId?:string;role: WorkspaceRole; onChanged?: () => void; renderAssessment?: (caseId: string) => React.ReactNode; }) {
  const resource=useResource<CaseRecord[]>('/cases');
  const orders=useResource<OrderRecord[]>('/orders');
  const [selected,setSelected]=useState<CaseRecord|null>(null);
  const [deepError,setDeepError]=useState('');
  useEffect(()=>{if(!entityId)return;const controller=new AbortController();api<CaseRecord>('/cases/'+encodeURIComponent(entityId),{signal:controller.signal}).then(setSelected).catch(error=>{if(!controller.signal.aborted)setDeepError(error instanceof Error?error.message:'Rekod tidak tersedia.');});return()=>controller.abort();},[entityId]);
  const [create,setCreate]=useState(false);
  const [search,setSearch]=useState('');
  // Refresh the selected context after a reply or decision so its next command uses the current revision.
  useEffect(() => { if (selected && resource.data) { const current = resource.data.find(item => item.id === selected.id); if (current && current.revision !== selected.revision) setSelected(current); } }, [resource.data, selected]);
  const refresh=() => { resource.reload(); onChanged?.(); };
  const cases=resource.data?.filter(item => `${item.id} ${item.subject} ${item.status}`.toLowerCase().includes(search.toLowerCase()))??[];
  return <>
    {deepError&&<p role="alert" className="platform-alert">{deepError}</p>}<Panel title={role==='customer'? 'Bantuan & aduan saya':'Case investigation inbox'} eyebrow="Evidence before determination" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setCreate(!create)}>
        <Plus size={17} /> Aduan baharu</button>
    </div>}>
      <ResourceState {...resource} />
      <SearchBox value={search} onChange={setSearch} />
      <div className="xp-record-list">{cases.map(item => <button className={`xp-record-button ${selected?.id===item.id? 'xp-selected':''}`} key={item.id} onClick={() => setSelected(item)}>
        <span className="xp-record-icon">
          <MessageSquare size={22} />
        </span>
        <span className="xp-record-main">
          <strong>{item.subject}</strong>
          <span>Order {item.orderId} · {dateLabel(item.createdAt)}</span>
        </span>
        <Status value={item.status} />
      </button>)}</div>{!resource.loading&&!resource.error&&!cases.length&&<Empty description="Aduan, balasan dan bukti berada dalam context order yang sama." />}</Panel>{create&&<><ResourceState {...orders}/><FormPanel title="Hantar aduan" fields={[field('orderId','Pesanan berkaitan',{ options: orders.data?.map(order => ({ value: order.id,label: `${order.id} · ${order.lines.map(line => line.name).join(', ')}` }))??[] }),field('subject','Tajuk masalah'),field('description','Apa yang berlaku?',{ type: 'textarea',help: 'Nyatakan pemerhatian sebenar, batch dan masa jika diketahui.' })]} onCancel={() => setCreate(false)} submitLabel="Hantar aduan" onSubmit={async values => { const result=await api('/cases',{ method: 'POST',body: JSON.stringify(values) }); refresh(); return result; }} /></>} {selected&&<CaseDetail key={`${selected.id}:${selected.revision}`} item={selected} role={role} refresh={refresh} close={() => setSelected(null)} renderAssessment={renderAssessment} />}</>;
}
function CaseDetail({ item,role,refresh,close,renderAssessment }: { item: CaseRecord; role: WorkspaceRole; refresh: () => void; close: () => void; renderAssessment?: (caseId: string) => React.ReactNode; }) {
  const messages=useResource<CaseMessage[]>(`/cases/${item.id}/messages`);
  return <Panel title={item.subject} eyebrow={`Case · ${item.status}`} action={<button className="xp-button xp-secondary" onClick={close}>Tutup</button>}>
    <RecordMeta id={item.id} revision={item.revision} />
    <p className="xp-case-description">{item.description}</p>
    <div className="xp-detail-grid">
      <p>Order <strong>{item.orderId}</strong>
      </p>
      <p>Assigned <strong>{item.assignedStaffId??'Belum assigned'}</strong>
      </p>
      <p>Determination <strong>{item.determination??'Unknown · perlu siasatan'}</strong>
      </p>
    </div>{role!=='customer'&&renderAssessment?.(item.id)}{role==='founder'&&<CaseActions item={item} refresh={refresh} />}<EvidenceUpload entityId={item.id} onChanged={refresh} />
    <h3>Perbualan in-app</h3>
    <ResourceState {...messages} />
    <div className="xp-conversation">{messages.data?.map(message => <article key={message.id} className="xp-message">
      <p>{message.body}</p>
      <small>{message.authorId} · {dateLabel(message.createdAt)} · {message.channel}</small>
    </article>)}{!messages.loading&&!messages.error&&!messages.data?.length&&<p className="xp-muted">Belum ada balasan. Mesej di bawah disimpan dalam case ini.</p>}</div>
    <FormPanel title="Balas dalam context case" fields={[field('body','Mesej',{ type: 'textarea' })]} submitLabel="Simpan & hantar in-app" onSubmit={async values => { const result=await api(`/cases/${item.id}/reply`,{ method: 'POST',body: JSON.stringify({ expectedRevision: item.revision,body: values.body }) }); messages.reload(); refresh(); return result; }} />
  </Panel>;
}

function CaseActions({ item,refresh }: { item: CaseRecord; refresh: () => void; }) {
  const [action,setAction]=useState('');
  const [preview,setPreview]=useState<ActionPreview|null>(null);
  const [receipt,setReceipt]=useState<ExecutionReceipt|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function confirm() {
    if(!preview||busy) return; setBusy(true); setError('');
    try { const result=await api<ExecutionReceipt>(`/previews/${preview.id}/confirm`,{ method: 'POST',body: JSON.stringify({ expectedRevision: preview.revision }) }); setReceipt(result); refresh(); }
    catch(failure) { setError(failure instanceof Error? failure.message:'Confirmation gagal.'); }
    finally { setBusy(false); }
  }
  return <div className="xp-case-actions">
    <div className="xp-actions">
      <button className="xp-button xp-secondary" onClick={() => setAction('assign')}>Assign investigation</button>
      <button className="xp-button xp-secondary" onClick={() => setAction('resolve')} disabled={item.status==='resolved'}>Resolve with determination</button>
      <button className="xp-button xp-secondary" onClick={() => setAction('preview')}>Preview reply / manual handoff</button>
    </div>{action==='assign'&&<FormPanel title="Assign investigator" fields={[field('assignedStaffId','Staff ID',{ help: 'Staff mesti assigned kepada outlet order yang berkaitan.' })]} onCancel={() => setAction('')} onSubmit={async values => { const result=await api(`/cases/${item.id}/assign`,{ method: 'POST',body: JSON.stringify({ expectedRevision: item.revision,assignedStaffId: values.assignedStaffId }) }); refresh(); return result; }} />} {action==='resolve'&&<FormPanel title="Human determination" description="Simpan keputusan dan sebab berdasarkan bukti. Unknown root cause boleh dinyatakan; jangan mereka physical cause." fields={[field('determination','Keputusan / bukti / follow-up',{ type: 'textarea' })]} onCancel={() => setAction('')} submitLabel="Sahkan & resolve case" onSubmit={async values => { const result=await api(`/cases/${item.id}/resolve`,{ method: 'POST',body: JSON.stringify({ expectedRevision: item.revision,determination: values.determination }) }); refresh(); return result; }} />} {action==='preview'&&<FormPanel title="Preview communication" fields={[field('body','Draf mesej',{ type: 'textarea' }),field('channel','Channel',{ options: [{ value: 'in_app',label: 'In-app · persisted delivery' },{ value: 'manual_whatsapp',label: 'Manual WhatsApp handoff · delivery unknown' }] })]} submitLabel="Create scoped preview" onCancel={() => setAction('')} onSubmit={async values => { const result=await api<ActionPreview>(`/cases/${item.id}/preview`,{ method: 'POST',body: JSON.stringify({ expectedRevision: item.revision,...values }) }); setPreview(result); return result; }} />} {preview&&<section className="xp-preview">
      <h3>Preview · exact revision {preview.revision}</h3>
      <p className="xp-outcome">{preview.body}</p>
      <p>Recipient {preview.recipient??'Scoped customer'} · Expires {dateLabel(preview.expiresAt)}</p>
      <button className="xp-button" disabled={busy||Boolean(receipt)} onClick={confirm}>{busy? 'Confirming…':'Confirm this preview'}</button>{error&&<p className="xp-inline-error" role="alert">{error}</p>}{receipt&&<p className="xp-notice" role="status">
        <Status value={receipt.status} /> Receipt {receipt.id}{receipt.status==='unknown'? ' · Manual handoff tidak membuktikan delivery.':''}</p>}</section>}</div>;
}
