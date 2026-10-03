import { useState } from 'react';
import { CalendarDays,ClipboardCheck,Plus } from 'lucide-react';
import type { CalendarEventRecord,DayCloseRecord,KnowledgeEntry,QcRecord,SessionData,ShiftRecord,WorkspaceRole } from '../../../shared/platform-contracts';
import { api,useResource } from '../platform/client';
import { amountToSen,dateLabel,malaysiaDateTime,money,positiveQuantity } from './experience-model';
import { Empty,field,FormPanel,MutationButton,Panel,RecordMeta,Refresh,ResourceState,splitRefs,Status } from './ui';

const localInput=(value: string) => new Date(new Date(value).getTime()+8*3600000).toISOString().slice(0,16);
interface QcSop { id: string; knowledgeId: string; knowledgeVersion: number; version: number; readings: { name: string; unit: string; minimum: number; maximum: number; }[]; approvedBy: string; }
export function Calendar({ onNavigate,role,onChanged }: { onNavigate: (path: string) => void; role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<CalendarEventRecord[]>('/calendar');
  const [editing,setEditing]=useState<CalendarEventRecord|'new'|null>(null);
  const [month,setMonth]=useState('');
  const refresh=() => { resource.reload(); onChanged?.(); };
  const events=[...(resource.data??[])].filter(event => !month||localInput(event.startAt).startsWith(month)).sort((a,b) => a.startAt.localeCompare(b.startAt));
  return <>
    <Panel title="Operational calendar" eyebrow="Asia/Kuala_Lumpur · linked work" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setEditing('new')}>
        <Plus size={17} /> Tambah event</button>
    </div>}>
      <ResourceState {...resource} />
      <label className="xp-month-filter">
        <CalendarDays size={18} />
        <span>Tapis bulan</span>
        <input type="month" value={month} onChange={event => setMonth(event.target.value)} />
        <button className="xp-text-button" onClick={() => setMonth('')}>Semua</button>
      </label>
      <div className="xp-calendar-agenda">{events.map(event => {
        const local=localInput(event.startAt); return <article className="xp-event" key={event.id}>
          <div className="xp-date-block">
            <strong>{local.slice(8,10)}</strong>
            <span>{new Intl.DateTimeFormat('ms-MY',{ month: 'short',timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(event.startAt))}</span>
          </div>
          <div>
            <h3>{event.title}</h3>
            <p>{dateLabel(event.startAt)} → {dateLabel(event.endAt)}</p>
            <RecordMeta id={event.id} revision={event.revision} />{!!event.entityLinks?.length&&<div className="xp-actions">{event.entityLinks.map(link=><button className="xp-text-button" key={link.id} onClick={()=>onNavigate(link.path)}>Linked {link.kind}: {link.id}</button>)}</div>}</div>
          <button className="xp-button xp-secondary" onClick={() => setEditing(event)}>Edit</button>
        </article>;
      })}</div>{!resource.loading&&!resource.error&&!events.length&&<Empty title="Ruang untuk kerja yang dirancang" description="Jadual shift, delivery, meeting dan marketing boleh dihubungkan kepada record IDs." />}</Panel>{editing&&<FormPanel key={editing==='new'? 'new':`${editing.id}:${editing.revision}`} title={editing==='new'? 'Jadualkan event':'Edit event'} fields={[field('title','Tajuk',{ defaultValue: editing!=='new'? editing.title:'' }),field('startAt','Mula (MYT)',{ type: 'datetime-local',defaultValue: editing!=='new'? localInput(editing.startAt):'' }),field('endAt','Tamat (MYT)',{ type: 'datetime-local',defaultValue: editing!=='new'? localInput(editing.endAt):'' }),field('entityIds','Linked record IDs',{ required: false,defaultValue: editing!=='new'? editing.entityIds.join(', '):'' })]} onCancel={() => setEditing(null)} onSubmit={async values => {
        const startAt=malaysiaDateTime(values.startAt);
        const endAt=malaysiaDateTime(values.endAt); if(endAt<=startAt) throw new Error('Masa tamat mesti selepas masa mula.');
        const result=await api(editing==='new'? '/calendar':`/calendar/${editing.id}/update`,{ method: 'POST',body: JSON.stringify({ title: values.title,startAt,endAt,entityIds: splitRefs(values.entityIds),...(editing!=='new'? { expectedRevision: editing.revision }:{}) }) }); refresh(); return result;
      }} />}</>;
}
export function Shifts({ role,onChanged }: { role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<ShiftRecord[]>('/shifts');
  const session=useResource<SessionData>('/session');
  const [create,setCreate]=useState(false);
  const [handoff,setHandoff]=useState<ShiftRecord|null>(null);
  const refresh=() => { resource.reload(); onChanged?.(); };
  return <>
    <Panel title="Shift & custody handoff" eyebrow="Opening → work → count → acknowledge" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setCreate(!create)}>Buka shift</button>
    </div>}>
      <ResourceState {...resource} />{resource.data?.map(shift => <article className="xp-shift" key={shift.id}>
        <div>
          <h3>Outlet {shift.outletId}</h3>
          <p>{dateLabel(shift.openedAt)} · {shift.staffIds.length} assigned staff</p>
          <RecordMeta id={shift.id} revision={shift.revision} />
          <div className="xp-count-pair">
            <div>
              <span>Opening count</span>
              <strong>{shift.openingCount}</strong>
            </div>
            <div>
              <span>Closing count</span>
              <strong>{shift.closingCount??'—'}</strong>
            </div>
          </div>{shift.handoffNote&&<p className="xp-outcome">{shift.handoffNote}</p>}{shift.acknowledgedBy&&<p className="xp-muted">Acknowledged by {shift.acknowledgedBy}</p>}</div>
        <div className="xp-actions">
          <Status value={shift.status} />{shift.status==='open'&&<button className="xp-button xp-secondary" onClick={() => setHandoff(shift)}>Handoff shift</button>}{shift.status==='handoff'&&<MutationButton path={`/shifts/${shift.id}/acknowledge`} input={{ expectedRevision: shift.revision }} onChanged={refresh} confirmLabel="Sahkan penerimaan custody">Acknowledge</MutationButton>}</div>
      </article>)}{!resource.loading&&!resource.error&&!resource.data?.length&&<Empty description="Opening count, unresolved work dan custody kekal bersama rekod shift." />}</Panel>{create&&<FormPanel title="Buka shift" fields={[field('outletId','Outlet ID',{ defaultValue: session.data?.memberships.find(member => member.role===role)?.outletIds[0] }),field('staffIds','Assigned staff IDs',{ defaultValue: session.data?.user.id,help: 'Pisahkan dengan koma.' }),field('openingCount','Opening unit count',{ type: 'number',min: 0,step: '1',defaultValue: '0' })]} onCancel={() => setCreate(false)} onSubmit={async values => {
        const openingCount=Number(values.openingCount); if(!Number.isSafeInteger(openingCount)||openingCount<0) throw new Error('Count mesti nombor bulat, minimum 0.');
        const result=await api('/shifts',{ method: 'POST',body: JSON.stringify({ ...values,staffIds: splitRefs(values.staffIds),openingCount }) }); refresh(); return result;
      }} />} {handoff&&<FormPanel key={handoff.id} title="Serahan shift" description="Rekod count sebenar, variance dan kerja belum selesai. Staff penerima perlu acknowledge custody." fields={[field('closingCount','Closing unit count',{ type: 'number',min: 0,step: '1' }),field('handoffNote','Handoff / unresolved issues',{ type: 'textarea' })]} onCancel={() => setHandoff(null)} submitLabel="Simpan handoff" onSubmit={async values => {
        const closingCount=Number(values.closingCount); if(!Number.isSafeInteger(closingCount)||closingCount<0) throw new Error('Closing count mesti nombor bulat, minimum 0.');
        const result=await api(`/shifts/${handoff.id}/handoff`,{ method: 'POST',body: JSON.stringify({ expectedRevision: handoff.revision,closingCount,handoffNote: values.handoffNote }) }); setHandoff(null); refresh(); return result;
      }} />}</>;
}
export function Qc({ role,onChanged }: { role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<QcRecord[]>('/qc');
  const knowledge=useResource<QcSop[]>('/qc/sops');
  const closes=useResource<DayCloseRecord[]>('/dayclose');
  const session=useResource<SessionData>('/session');
  const [create,setCreate]=useState(false);
  const [closeDay,setCloseDay]=useState(false);
  const refresh=() => { resource.reload(); closes.reload(); onChanged?.(); };
  return <>
    <Panel title="QC & batch release" eyebrow="SOP-linked evidence" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setCreate(!create)}>
        <ClipboardCheck size={17} /> Rekod inspection</button>
    </div>}>
      <ResourceState {...resource} />
      <p className="xp-notice">Threshold dan readings datang daripada SOP approved. Unknown atau bukti tidak lengkap tidak dianggap lulus.</p>{resource.data?.map(qc => <article className="xp-qc" key={qc.id}>
        <div>
          <h3>Batch {qc.batchId}</h3>
          <RecordMeta id={qc.id} revision={qc.revision} />
          <p>SOP {qc.sopId} · v{qc.sopVersion} · Outlet {qc.outletId}</p>
          <div className="xp-reading-grid">{qc.readings.map((reading,index) => <div key={`${reading.name}:${index}`}>
            <span>{reading.name}</span>
            <strong>{reading.value} <small>{reading.unit}</small>
            </strong>
          </div>)}</div>
          <p className="xp-muted">{qc.evidenceIds.length} evidence IDs · Operator {qc.operatorId}</p>
        </div>
        <div className="xp-actions">
          <Status value={qc.status} />{role==='founder'&&qc.status!=='released'&&<MutationButton path={`/qc/${qc.id}/release`} input={{ expectedRevision: qc.revision }} onChanged={refresh} confirmLabel="Sahkan SOP, readings & release">Review & release</MutationButton>}</div>
      </article>)}{!resource.loading&&!resource.error&&!resource.data?.length&&<Empty description="Mulakan inspection daripada approved SOP dan batch sebenar. Tiada food-safety guarantee direka." />}</Panel>{role==='founder'&&<QcSopEditor onChanged={() => { knowledge.reload(); refresh(); }} />} {create&&<FormPanel title="Rekod QC inspection" description="Readings: satu setiap baris, format nama|nilai|unit. Contoh format sahaja: ukuran|1|unit; gunakan parameter SOP sebenar." fields={[field('batchId','Batch ID'),field('outletId','Outlet ID',{ defaultValue: session.data?.memberships.find(member => member.role===role)?.outletIds[0] }),field('sopId','Approved SOP',{ options: knowledge.data?.map(entry => ({ value: entry.id,label: 'SOP '+entry.id+' · v'+entry.version }))??[] }),field('readings','Actual readings',{ type: 'textarea' }),field('evidenceIds','Evidence IDs',{ required: false })]} onCancel={() => setCreate(false)} submitLabel="Simpan QC untuk review" onSubmit={async values => {
        const sop=knowledge.data?.find(entry => entry.id===values.sopId); if(!sop) throw new Error('Approved SOP diperlukan.');
        const readings=values.readings.split('\n').filter(Boolean).map(line => {
          const [name,rawValue,unit]=line.split('|').map(part => part.trim());
          const value=Number(rawValue); if(!name||!unit||!rawValue||!Number.isFinite(value)) throw new Error('Setiap reading mesti nama|nilai nombor|unit.'); return { name,value,unit };
        });
        const result=await api('/qc',{ method: 'POST',body: JSON.stringify({ batchId: values.batchId,outletId: values.outletId,sopId: sop.id,sopVersion: sop.version,readings,evidenceIds: splitRefs(values.evidenceIds) }) }); refresh(); return result;
      }} />}<Panel title="Day close & variance" eyebrow="Cash evidence · explicit review" action={<button className="xp-button xp-secondary" onClick={() => setCloseDay(!closeDay)}>Rekod closing count</button>}>
      <ResourceState {...closes} />{closes.data?.map(close => <article className="xp-close" key={close.id}>
        <div>
          <h3>{close.date} · {close.outletId}</h3>
          <RecordMeta id={close.id} revision={close.revision} />
          <div className="xp-detail-grid">
            <p>Expected <strong>{money(close.expectedCashSen)}</strong>
            </p>
            <p>Counted <strong>{money(close.countCashSen)}</strong>
            </p>
            <p className={close.discrepancySen? 'xp-inline-error':''}>Variance <strong>{money(close.discrepancySen)}</strong>
            </p>
          </div>{close.reason&&<p>{close.reason}</p>}</div>
        <Status value={close.status} />{close.status==='review'&&<FormPanel title="Semak semula sumber closing" description="Gunakan selepas rekod tunai berubah. Semakan ini mengekalkan kiraan dan variance untuk approval berikutnya." fields={[field('amount','Kiraan tunai semasa (RM)',{type:'number',min:0,step:'.01',defaultValue:(close.countCashSen/100).toFixed(2)})]} submitLabel="Refresh sumber closing" onSubmit={async values=>{const result=await api(`/dayclose/${close.id}/review`,{method:'POST',body:JSON.stringify({expectedRevision:close.revision,countCashSen:Number(values.amount)===0?0:amountToSen(values.amount)})});refresh();return result;}}/>}{role==='founder'&&close.status!=='approved'&&<FormPanel title="Review close" fields={[field('reason','Review / variance resolution',{ type: 'textarea' })]} submitLabel="Approve close" onSubmit={async values => { const result=await api(`/dayclose/${close.id}/approve`,{ method: 'POST',body: JSON.stringify({ expectedRevision: close.revision,reason: values.reason }) }); refresh(); return result; }} />}</article>)}{!closes.loading&&!closes.error&&!closes.data?.length&&<Empty description="Expected cash dikira daripada authoritative transactions; counted cash direkod operator." />}</Panel>{closeDay&&<FormPanel title="Closing cash count" fields={[field('outletId','Outlet ID',{ defaultValue: session.data?.memberships.find(member => member.role===role)?.outletIds[0] }),field('date','Business date (MYT)',{ type: 'date' }),field('amount','Counted cash (RM)',{ type: 'number',min: 0,step: '.01',defaultValue: '0' })]} onCancel={() => setCloseDay(false)} onSubmit={async values => { const result=await api('/dayclose',{ method: 'POST',body: JSON.stringify({ outletId: values.outletId,date: values.date,countCashSen: values.amount==='0'||values.amount==='0.00'? 0:amountToSen(values.amount) }) }); refresh(); return result; }} />}</>;
}

function QcSopEditor({ onChanged }: { onChanged: () => void; }) {
  const knowledge=useResource<KnowledgeEntry[]>('/knowledge');
  const sops=useResource<QcSop[]>('/qc/sops');
  const [create,setCreate]=useState(false);
  return <Panel title="Approved QC measurement policy" eyebrow="Sourced from approved knowledge" action={<button className="xp-button xp-secondary" onClick={() => setCreate(!create)}>Define SOP readings</button>}>
    <ResourceState {...sops} />{sops.data?.map(sop => <article className="xp-list-row" key={sop.id}>
      <div>
        <h3>SOP {sop.id}</h3>
        <p>Knowledge {sop.knowledgeId} · v{sop.knowledgeVersion}</p>{sop.readings.map(reading => <p key={reading.name}>{reading.name}: {reading.minimum} – {reading.maximum} {reading.unit}</p>)}</div>
      <Status value="approved" />
    </article>)}{!sops.loading&&!sops.error&&!sops.data?.length&&<p className="xp-notice">Inspection release memerlukan approved SOP dengan parameter sebenar. Tiada suhu atau shelf-life default.</p>}{create&&<FormPanel title="Sahkan measurement thresholds" description="Satu parameter setiap baris: nama|unit|minimum|maximum. Masukkan threshold yang disahkan dalam approved SOP sahaja." fields={[field('knowledgeId','Approved source knowledge',{ options: knowledge.data?.filter(entry => entry.status === 'approved').map(entry => ({ value: entry.id,label: entry.title+' · v'+entry.version }))??[] }),field('readings','Verified thresholds',{ type: 'textarea' })]} onCancel={() => setCreate(false)} submitLabel="Approve QC policy" onSubmit={async values => {
      const readings=values.readings.split('\n').filter(Boolean).map(line => {
        const [name,unit,min,max]=line.split('|').map(value => value.trim());
        const minimum=Number(min);
        const maximum=Number(max); if(!name||!unit||min===''||max===''||!Number.isFinite(minimum)||!Number.isFinite(maximum)||minimum>maximum) throw new Error('Format threshold: nama|unit|minimum|maximum, dengan minimum <= maximum.'); return { name,unit,minimum,maximum };
      });
      const result=await api('/qc/sops',{ method: 'POST',body: JSON.stringify({ knowledgeId: values.knowledgeId,readings }) }); sops.reload(); onChanged(); return result;
    }} />}</Panel>;
}
