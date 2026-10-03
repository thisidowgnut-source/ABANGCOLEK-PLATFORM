import { useMemo,useState } from 'react';
import { ArrowRight,ArrowUpRight,ClipboardList,Code2,CreditCard,Package,ShieldCheck,ShoppingBag,Sparkles,Users } from 'lucide-react';
import type { CaseRecord,JobRecord,OrderRecord,PlatformOverview,RedactedHealth,SessionData,TaskRecord,WorkspaceRole } from '../../../shared/platform-contracts';
import type { AssignedTaskSummary } from '../../../shared/report-contracts';
import { api,useResource } from '../platform/client';
import { assessState,JevAssessmentCard } from '../jev';
import type { JevAssessment } from '../../../shared/jev-contracts';
import { Dealers,Inventory,Orders,Shop } from './commerce';
import { Cases,Documents,Knowledge,Tasks } from './work';
import { Calendar,Qc,Shifts } from './operations';
import { Finance,People,Reports,Settings } from './business';
import { Marketing } from './marketing';
import { dateLabel,money } from './experience-model';
import { Empty,MutationButton,NavigateButton,Panel,RecordMeta,Refresh,ResourceState,Status } from './ui';
import './workspaces.css';
import { RuntimeControls } from './RuntimeControls';
import { AutomationWorkspace } from './AutomationWorkspace';
import { JevEvaluationWorkspace } from './JevEvaluationWorkspace';
import { ReportBuilder } from './ReportBuilder';
import { DerivedCalendar } from './DerivedCalendar';
import { LinkedRecordContext } from './LinkedRecordContext';
import { DayCloseAmendments,ExpensePostings,PeopleInvitations,PersonalOperationalSettings } from './OperationalAmendments';

export interface WorkspaceContentProps { role: WorkspaceRole; section: string; entityId?:string; onNavigate: (path: string) => void; onChanged?: () => void; }
const titles: Record<string,[string,string]>={
  overview: ['Make the next move.','Satu tempat untuk rekod, keputusan dan kerja yang selesai.'],orders: ['Every order. In context.','Payment, packing dan delivery daripada rekod yang sama.'],shop: ['Pilih. Order. Enjoy.','Published products, harga semasa dan pesanan anda.'],inventory: ['Know what moves.','Stok fizikal, ownership dan custody dalam satu ledger.'],cases: ['Resolve with evidence.','Siasat pemerhatian, semak unknowns dan bantu customer.'],tasks: ['Move work forward.','Tugasan yang assigned, due dates dan outcome sebenar.'],documents: ['Write it. Keep it.','Dokumen berpusat dengan visibility dan versi yang jelas.'],knowledge: ['Good work has a source.','Approved knowledge dan SOP yang versioned.'],calendar: ['Plan the week ahead.','Jadual kerja dalam MYT, linked kepada rekod bisnes.'],finance: ['Keep the numbers honest.','Verified receipts, expenses dan reconciliation.'],dealers: ['Build the network.','Kelulusan dealer, terma dan fulfilment B2B.'],business: ['Your business, connected.','Permohonan, restock dan stock receiving milik organisasi anda.'],marketing: ['Make something worth sharing.','Draft, rights, exact approval dan manual export.'],qc: ['Quality leaves a trail.','Inspection readings, approved SOP dan day close.'],shifts: ['A clear handoff.','Count, custody dan isu belum selesai antara shift.'],people: ['The right access.','Team roles dan outlet scope, enforced oleh server.'],settings: ['Your operating rules.','Policy yang diluluskan dengan version dan audit.'],reports: ['See the source.','Reports boleh dijejak kepada transaksi yang sebenar.'],health: ['Know the runtime.','Status komponen yang observed, tanpa credential exposure.'],jobs: ['Automation with receipts.','Queue, attempts dan recovery yang boleh diperiksa.'],
};
export function WorkspaceContent({ role,section,entityId,onNavigate,onChanged }: WorkspaceContentProps) {
  const [title,description]=titles[section]??titles.overview;
  let content;
  if(role==='developer') content=<Developer section={section} />;
  else switch(section) {
    case 'orders': content=<Orders entityId={entityId} role={role} onChanged={onChanged} />; break;
    case 'shop': content=<Shop onNavigate={onNavigate} />; break;
    case 'inventory': content=<Inventory role={role} onChanged={onChanged} />; break;
    case 'cases': content=<Cases entityId={entityId} role={role} onChanged={onChanged} renderAssessment={caseId => <CaseAssessment caseId={caseId} />} />; break;
    case 'tasks': content=<Tasks entityId={entityId} role={role} onChanged={onChanged} />; break;
    case 'documents': content=<Documents entityId={entityId} onChanged={onChanged} />; break;
    case 'knowledge': content=<Knowledge role={role} onChanged={onChanged} />; break;
    case 'calendar': content=<><Calendar role={role} onNavigate={onNavigate} onChanged={onChanged}/><DerivedCalendar onNavigate={onNavigate}/></>; break;
    case 'finance': content=<><Finance onChanged={onChanged}/><ExpensePostings onChanged={onChanged}/></>; break;
    case 'dealers': case 'business': content=<Dealers role={role} onNavigate={onNavigate} onChanged={onChanged} />; break;
    case 'marketing': content=<><Marketing role={role} onChanged={onChanged}/>{role==='founder'&&<AutomationWorkspace role={role} onChanged={onChanged}/>}</>; break;
    case 'jev': content=<JevEvaluationWorkspace/>;break;
    case 'qc': content=<><Qc role={role} onChanged={onChanged}/>{role==='founder'&&<DayCloseAmendments onChanged={onChanged}/>}</>; break;
    case 'shifts': content=<Shifts role={role} onChanged={onChanged} />; break;
    case 'people': content=<><People onChanged={onChanged}/><PeopleInvitations onChanged={onChanged}/></>; break;
    case 'settings': content=<Settings onChanged={onChanged} />; break;
    case 'reports': content=<ReportBuilder/>; break;
    default: content=role==='founder'? <FounderOverview onNavigate={onNavigate} />:<PersonalOverview role={role} onNavigate={onNavigate} />;
  }
  return <div className="xp-workspace">
    <header className="xp-page-header">
      <div>
        <p className="xp-eyebrow">
          <span className="xp-live-dot" /> ABANGCOLEK / {role} workspace</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <span className="xp-workspace-label">{role==='founder'? 'Founder cockpit':role==='staff'? 'Staff workspace':role==='developer'? 'Developer console':'Customer portal'}</span>
    </header>
    <div className="xp-content">{entityId&&['marketing','dealers','business','inventory','qc','shifts','finance'].includes(section)&&<LinkedRecordContext entityId={entityId} section={section}/>} {content}{(section==='overview'||section==='settings')&&<PersonalOperationalSettings role={role} onChanged={onChanged}/>}</div>
    <footer className="xp-workspace-footer">
      <span>ABANGCOLEK OS</span>
      <span>Asia/Kuala_Lumpur · ABANGCOLEK workspace</span>
    </footer>
  </div>;
}
function CaseAssessment({ caseId }: { caseId: string; }) {
  const resource=useResource<CaseRecord>(`/cases/${caseId}`);
  const [savedAssessment,setSavedAssessment]=useState<JevAssessment|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const assessment=useMemo(() => resource.data? assessState('support',{ text: resource.data.description,entityId: resource.data.id,entityRevision: resource.data.revision,evidence: [{ id: resource.data.id,kind: 'CUSTOMER_CLAIM',text: resource.data.description,observedAt: resource.data.createdAt }] }):null,[resource.data]);
  async function assess() { setBusy(true); setError(''); try { setSavedAssessment(await api<JevAssessment>(`/cases/${caseId}/assessment`,{ method: 'POST',body: '{}' })); } catch(failure) { setError(failure instanceof Error? failure.message:'Assessment gagal.'); } finally { setBusy(false); } }
  return assessment? <div>
    <JevAssessmentCard assessment={savedAssessment??assessment} title={savedAssessment? 'JEV · recorded case assessment':'JEV · local review preview'} />
    <button className="xp-button xp-secondary" disabled={busy} onClick={assess}>{busy? 'Assessing…':'Assess latest evidence & save review'}</button>{error&&<p className="xp-inline-error" role="alert">{error}</p>}</div>:<ResourceState {...resource} />;
}
function FounderOverview({ onNavigate }: { onNavigate: (path: string) => void; }) {
  const resource=useResource<PlatformOverview>('/overview');
  const data=resource.data;
  const metrics=[{ label: 'Order value',value: data? money(data.orderValueSen):'—',note: 'Active order amounts',icon: ShoppingBag },{ label: 'Verified net receipts',value: data? money(data.verifiedPaymentSen):'—',note: 'Paid minus recorded refunds',icon: CreditCard },{ label: 'Available stock',value: data?.stockAvailable??'—',note: 'Published products / available units',icon: Package }];
  return <>
    <ResourceState {...resource} />
    <section className="xp-hero-bento">
      <div className="xp-hero-card">
        <p className="xp-eyebrow">Founder morning brief</p>
        <h2>Your business.<br />
          <em>Within reach.</em>
        </h2>
        <p>{data?.empty? 'Rekod bisnes anda masih kosong. Mulakan dengan produk approved, stok sebenar dan assignment team.':'Semak keputusan tertunda dan sambung kerja terus daripada context yang sama.'}</p>
        <div className="xp-actions">
          <button className="xp-button" onClick={() => onNavigate('/founder/inventory')}>Urus produk & stok <ArrowUpRight size={18} />
          </button>
          <button className="xp-button xp-dark-secondary" onClick={() => onNavigate('/founder/tasks')}>Buka work inbox</button>
        </div>
        <span className="xp-hero-shape" aria-hidden="true">✳</span>
      </div>
      <div className="xp-morning-card">
        <span className="xp-icon-tile">
          <Sparkles size={26} />
        </span>
        <p className="xp-eyebrow">Needs your attention</p>
        <strong>{data? data.openCases+data.openTasks+data.pendingDealerApplications:'—'}</strong>
        <p>Cases, tasks dan dealer applications yang belum selesai.</p>
        <small>{data? `Updated ${dateLabel(data.generatedAt)}`:'Waiting for server'}</small>
      </div>
    </section>
    <div className="xp-metrics">{metrics.map(metric => <article className="xp-metric" key={metric.label}>
      <div className="xp-metric-top">
        <span>{metric.label}</span>
        <metric.icon size={19} />
      </div>
      <strong>{metric.value}</strong>
      <small>{metric.note}</small>
    </article>)}</div>
    <div className="xp-overview-grid">
      <Panel title="Decision queue" eyebrow="Act where the record lives" action={<Refresh onClick={resource.reload} />}>
        <div className="xp-decision-list">{[{ title: 'Quality & customer cases',count: data?.openCases,path: 'cases',icon: ShieldCheck,text: 'Semak evidence, unknowns dan balas customer.' },{ title: 'Open work & outcomes',count: data?.openTasks,path: 'tasks',icon: ClipboardList,text: 'Assign, unblock atau rekod completion outcome.' },{ title: 'Dealer applications',count: data?.pendingDealerApplications,path: 'dealers',icon: Users,text: 'Approved terms sebelum B2B membership.' }].map(item => <button key={item.path} className="xp-decision" onClick={() => onNavigate(`/founder/${item.path}`)}>
          <span className="xp-record-icon">
            <item.icon size={22} />
          </span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.text}</small>
          </span>
          <b>{item.count??'—'}</b>
          <ArrowUpRight size={18} />
        </button>)}</div>
      </Panel>
      <Panel title="Continue the work" eyebrow="Your operating desk">
        <div className="xp-quick-links">{[{ title: 'Marketing studio',subtitle: 'Draft → rights → approve → export',path: 'marketing' },{ title: 'Calendar',subtitle: 'Plan operational events in MYT',path: 'calendar' },{ title: 'Finance',subtitle: 'Evidence, variance & reconciliation',path: 'finance' },{ title: 'Reports',subtitle: 'Traceable records, CSV export',path: 'reports' }].map(link => <button key={link.path} onClick={() => onNavigate(`/founder/${link.path}`)}>
          <strong>{link.title}</strong>
          <span>{link.subtitle}</span>
          <ArrowUpRight size={17} />
        </button>)}</div>
      </Panel>
    </div>
  </>;
}
function PersonalOverview({ role,onNavigate }: { role: 'customer'|'staff'; onNavigate: (path: string) => void; }) {
  const orders=useResource<OrderRecord[]>('/orders');
  return <>
    <section className="xp-hero-card xp-personal-hero">
      <p className="xp-eyebrow">{role==='customer'? 'Your ABANGCOLEK space':'Your daily work'}</p>
      <h2>{role==='customer'? 'Good colek.':'A clear start.'}<br />
        <em>{role==='customer'? 'Closer to you.':'A better handoff.'}</em>
      </h2>
      <p>{role==='customer'? 'Beli, jejak pesanan dan dapatkan bantuan. Setiap update datang daripada rekod sebenar.':'Tugasan assigned, SOP dan pesanan outlet anda berada dalam satu workspace.'}</p>
      <div className="xp-actions">
        <button className="xp-button" onClick={() => onNavigate(role==='customer'? '/customer/shop':'/staff/tasks')}>{role==='customer'? 'Beli produk':'Buka tugasan'}<ArrowRight size={18} />
        </button>
        <button className="xp-button xp-dark-secondary" onClick={() => onNavigate(`/${role}/orders`)}>Semak pesanan</button>
      </div>
      <span className="xp-hero-shape" aria-hidden="true">✳</span>
    </section>
    <div className="xp-overview-grid">
      <Panel title={role==='customer'? 'Pesanan terkini':'Order queue'} eyebrow="Scoped to your membership">
        <ResourceState {...orders} />{orders.data?.slice(0,4).map(order => <button className="xp-record-button" key={order.id} onClick={() => onNavigate(`/${role}/orders`)}>
          <span className="xp-record-main">
            <strong>{order.lines.map(line => line.name).join(', ')}</strong>
            <span>{money(order.amountSen)} · {order.id}</span>
          </span>
          <Status value={order.fulfilmentStatus} />
        </button>)}{!orders.loading&&!orders.error&&!orders.data?.length&&<Empty description={role==='customer'? 'Pesanan anda akan muncul selepas submission disimpan.':'Tiada pesanan assigned dalam outlet scope anda.'} />}</Panel>
      <Panel title={role==='customer'? 'Perlu bantuan?':'Shift essentials'} eyebrow={role==='customer'? 'We keep the context':'Counts, SOP & unresolved work'}>{role==='customer'? <>
        <p>Laporkan masalah dengan own order supaya bukti, aduan dan balasan dapat dijejak bersama.</p>
        <NavigateButton label="Buka bantuan & aduan" to="/customer/cases" onNavigate={onNavigate} />
        <hr />
        <p>Mahukan ruang B2B? Mohon sebagai ejen atau stokis dan semak approved commercial terms.</p>
        <NavigateButton label="Ruang ejen & stokis" to="/customer/business" onNavigate={onNavigate} />
      </>:<StaffEssentials onNavigate={onNavigate} />}</Panel>
    </div>
  </>;
}
function StaffEssentials({ onNavigate }: { onNavigate: (path: string) => void }) {
  const summary=useResource<AssignedTaskSummary>('/tasks/summary');
  const session=useResource<SessionData>('/session');
  return <>
    <ResourceState {...summary} />
    <div className="xp-count-pair">
      <div><span>Open assigned tasks</span><strong>{summary.data?.openAssignedTasks??'—'}</strong><small>All assigned records</small></div>
      <div><span>Assigned outlets</span><strong>{session.data?.memberships.find(member=>member.role==='staff'&&member.status==='active')?.outletIds.length??'—'}</strong></div>
    </div>
    <div className="xp-actions"><NavigateButton label="Shift & handoff" to="/staff/shifts" onNavigate={onNavigate} /><NavigateButton label="Approved SOP" to="/staff/knowledge" onNavigate={onNavigate} /></div>
  </>;
}
function Developer({ section }: { section: string; }) {
  if(section==='jev')return <JevEvaluationWorkspace/>;
  return <DeveloperRuntime section={section}/>;
}
function DeveloperRuntime({ section }: { section: string; }) {
  const health=useResource<RedactedHealth[]>('/health');
  const jobs=useResource<JobRecord[]>('/jobs');
  const showHealth=section!=='jobs';
  return <>
    <section className="xp-developer-banner">
      <Code2 size={34} />
      <div>
        <p className="xp-eyebrow">Zero new spend · server-side credentials</p>
        <h2>Observed state. Clear boundaries.</h2>
        <p>Health dan queue metadata disanitasi. Unknown usage tidak diberi label free atau unlimited.</p>
      </div>
    </section>{showHealth&&<Panel title="Runtime & adapter readiness" eyebrow="Observed health" action={<Refresh onClick={health.reload} />}>
      <ResourceState {...health} />
      <div className="xp-health-grid">{health.data?.map(component => <article className="xp-health" key={component.component}>
        <div className="xp-health-top">
          <ShieldCheck size={22} />
          <Status value={component.status} />
        </div>
        <h3>{component.component.replaceAll('_',' ')}</h3>
        <code>{component.reasonCode}</code>
        <small>Observed {dateLabel(component.observedAt)}</small>
      </article>)}</div>{!health.loading&&!health.error&&!health.data?.length&&<Empty description="Health observations belum tersedia." />}</Panel>}<Panel title="Automation jobs" eyebrow="Attempts · checkpoints · outcomes" action={<Refresh onClick={jobs.reload} />}>
      <ResourceState {...jobs} />{jobs.data?.map(job => <article className="xp-job" key={job.id}>
        <div>
          <h3>{job.kind.replaceAll('_',' ')}</h3>
          <RecordMeta id={job.id} />
          <p>Attempt {job.attempt} · Skill {job.skillVersion}</p>
          <p className="xp-muted">{job.reasonCode??'No failure reason observed'}</p>{job.checkpoint&&<p>Checkpoint: {job.checkpoint}</p>}</div>
        <Status value={job.status} />{['queued','blocked','failed'].includes(job.status)&&<MutationButton path={`/jobs/${job.id}/cancel`} input={{}} onChanged={jobs.reload} confirmLabel="Sahkan cancel job">Cancel admission</MutationButton>}</article>)}{!jobs.loading&&!jobs.error&&!jobs.data?.length&&<Empty title="No queued automation" description="Read-only jobs muncul selepas authorized operator membuat request. Tiada provider execution direka." />}</Panel>
    <RuntimeControls/>
    <AutomationWorkspace role="developer"/>
    <Panel title="Quota & release controls" eyebrow="Admission policy">
      <div className="xp-detail-grid">
        <div>
          <Status value="unknown" />
          <h3>External quota usage</h3>
          <p>Belum ada provider usage observation yang disahkan. Paid fallback disekat.</p>
        </div>
        <div>
          <Status value="disabled" />
          <h3>External publication</h3>
          <p>Native WhatsApp, Postiz dan Agent-Reach memerlukan verified grants serta cost/capability gate.</p>
        </div>
        <div>
          <Status value="local" />
          <h3>Operational continuity</h3>
          <p>Local first-party records dan manual export tersedia tanpa akaun publisher.</p>
        </div>
      </div>
    </Panel>
  </>;
}
