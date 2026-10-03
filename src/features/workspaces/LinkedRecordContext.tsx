import {useResource} from '../platform/client';
import {money,dateLabel} from './experience-model';
import {Panel,RecordMeta,ResourceState,Status} from './ui';
const labels:Record<string,string>={title:'Tajuk',objective:'Tujuan',copy:'Caption',outletId:'Outlet',batchId:'Batch',productId:'Produk',ownerId:'Pemilik',custodyId:'Custody',locationId:'Lokasi',dealerOrgId:'Organisasi dealer',returnRules:'Polisi return',amountSen:'Amaun',quantity:'Kuantiti',category:'Kategori',date:'Tarikh',reason:'Sebab',handoffNote:'Nota serahan',expiryAt:'Tarikh luput',createdAt:'Direkod',expectedCashSen:'Tunai dijangka',countCashSen:'Kiraan tunai',discrepancySen:'Perbezaan'};
export function LinkedRecordContext({section,entityId}:{section:string;entityId:string}){
 const source=useResource<{kind:string;record:Record<string,unknown>}>(`/record-context/${encodeURIComponent(entityId)}?section=${encodeURIComponent(section)}`);
 const record=source.data?.record;
 return <Panel title="Rekod daripada pautan" eyebrow="Current source · authorized context">
  <ResourceState {...source}/>{record&&<><RecordMeta id={entityId} revision={typeof record.revision==='number'?record.revision:undefined}/>{typeof record.status==='string'&&<Status value={record.status}/>}
   <dl className="flow-review">{Object.entries(record).filter(([key,value])=>key in labels&&['number','string'].includes(typeof value)).map(([key,value])=><div key={key}><dt>{labels[key]}</dt><dd>{key.endsWith('Sen')&&typeof value==='number'?money(value):key.endsWith('At')&&typeof value==='string'?dateLabel(value):String(value)}</dd></div>)}</dl>
   <p className="xp-muted">Rekod {source.data?.kind} · {entityId}. Kawalan modul di bawah menggunakan revision dan permission semasa.</p>
  </>}
 </Panel>;
}
