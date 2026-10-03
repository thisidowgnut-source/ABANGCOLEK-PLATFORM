import type { DerivedCalendarEvent } from '../../../shared/report-contracts';
import { useResource } from '../platform/client';
import { dateLabel } from './experience-model';
import { Empty,Panel,RecordMeta,Refresh,ResourceState } from './ui';
export function DerivedCalendar({onNavigate}:{onNavigate:(path:string)=>void}){
  const resource=useResource<DerivedCalendarEvent[]>('/calendar/derived');
  return <Panel title="Source-linked schedule" eyebrow="Tasks · marketing · shifts" action={<Refresh onClick={resource.reload}/>}><ResourceState {...resource}/><p className="xp-notice">Jadual ini ialah projection. Edit rekod asal untuk menukar masa; tiada event berganda dicipta.</p>{resource.data?.map(event=><article className="xp-list-row" key={event.id}><div><h3>{event.title}</h3><p>{dateLabel(event.startAt)} · {event.sourceKind}</p><RecordMeta id={event.entityId} revision={event.sourceRevision}/></div><button className="xp-button xp-secondary" onClick={()=>onNavigate(event.path)}>Buka sumber</button></article>)}{!resource.loading&&!resource.error&&!resource.data?.length&&<Empty description="Due task, scheduled campaign dan shift sebenar akan muncul di sini."/>}</Panel>;
}
