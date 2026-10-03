import { useState } from 'react';
import { Download } from 'lucide-react';
import type { BuiltReport,ReportKind,SavedReportDefinition } from '../../../shared/report-contracts';
import { api,useResource } from '../platform/client';
import { downloadText,money,dateLabel } from './experience-model';
import { Empty,field,FormPanel,Panel,Refresh,ResourceState } from './ui';

const options=[{value:'orders',label:'Order cohort'},{value:'payments',label:'Payment & refund transactions'},{value:'expenses',label:'Expense register'},{value:'tasks',label:'Work outcomes'},{value:'stock',label:'Stock movements'}];
export function ReportBuilder(){
  const [kind,setKind]=useState<ReportKind>('orders'),[from,setFrom]=useState(''),[to,setTo]=useState(''),[outlet,setOutlet]=useState(''),[dealer,setDealer]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const query=new URLSearchParams({kind,...(from?{from}:{}),...(to?{to}:{}),...(outlet?{outletId:outlet}:{}),...(dealer?{dealerOrgId:dealer}:{})});
  const result=useResource<BuiltReport>('/reports/build?'+query),saved=useResource<SavedReportDefinition[]>('/reports/definitions');
  async function exportFile(format:'csv'|'html'){
    setBusy(true);setError('');
    try{const report=await api<BuiltReport>('/reports/build?'+query+'&format='+format);downloadText(report.filename,report.content,format==='html'?'text/html;charset=utf-8':'text/csv;charset=utf-8');}
    catch(reason){setError(reason instanceof Error?reason.message:'Export tidak tersedia.');}finally{setBusy(false);}
  }
  return <>
    <Panel title="Report builder" eyebrow="Complete source rows · MYT filters" action={<Refresh onClick={result.reload}/>}>
      <div className="xp-form-grid">
        <label className="xp-field">Report<select value={kind} onChange={event=>{setKind(event.target.value as ReportKind);setDealer('');setOutlet('');}}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="xp-field">Dari tarikh MYT<input type="date" value={from} onChange={event=>setFrom(event.target.value)}/></label>
        <label className="xp-field">Hingga tarikh MYT<input type="date" value={to} onChange={event=>setTo(event.target.value)}/></label>
        {kind!=='stock'&&<label className="xp-field">Outlet ID<input value={outlet} onChange={event=>setOutlet(event.target.value)} placeholder="Semua outlet"/></label>}
        {['orders','payments'].includes(kind)&&<label className="xp-field">Dealer organization ID<input value={dealer} onChange={event=>setDealer(event.target.value)} placeholder="Semua dealer"/></label>}
      </div><ResourceState {...result}/>
      {result.data&&<><p>{result.data.recordCount} canonical source rows · {dateLabel(result.data.generatedAt)}</p><p className="xp-notice">{result.data.metricScope}</p><div className="xp-detail-grid">
        {[['Order value',result.data.metrics.orderValueSen],['Confirmed receipts',result.data.metrics.confirmedReceiptsSen],['Recorded refunds',result.data.metrics.refundSen],['Approved expenses',result.data.metrics.approvedExpensesSen]].map(([label,value])=><div key={String(label)}><span className="xp-muted">{label}</span><h3>{money(Number(value))}</h3></div>)}
      </div><p className="xp-muted">Source revisions: {Object.keys(result.data.sourceVersions).length}. Profit tidak dikira tanpa COGS yang disahkan.</p></>}
      <div className="xp-actions"><button className="xp-button" disabled={busy||result.loading||!!result.error} onClick={()=>void exportFile('csv')}><Download size={18}/>Download CSV</button><button className="xp-button xp-secondary" disabled={busy||result.loading||!!result.error} onClick={()=>void exportFile('html')}>Download printable HTML</button></div>
      <p className="xp-muted">Buka fail HTML dalam browser dan gunakan Print untuk PDF. CSV melindungi formula-like input.</p>{error&&<p className="xp-notice xp-error" role="alert">{error}</p>}
    </Panel>
    <FormPanel title="Simpan definisi report" description="Menyimpan filter semasa; report dikira semula daripada source ketika dibuka." fields={[field('title','Nama report')]} submitLabel="Simpan definisi" onSubmit={async values=>{const record=await api('/reports/definitions',{method:'POST',body:JSON.stringify({...Object.fromEntries(query),title:values.title})});saved.reload();return record;}}/>
    <Panel title="Saved reports" eyebrow="Versioned definitions"><ResourceState {...saved}/>{saved.data?.map(definition=><article className="xp-list-row" key={definition.id}><div><h3>{definition.title}</h3><p>{definition.kind} · v{definition.revision} · {definition.from??'Semua tarikh'} → {definition.to??'Semua tarikh'}</p></div><button className="xp-button xp-secondary" onClick={()=>{setKind(definition.kind);setFrom(definition.from??'');setTo(definition.to??'');setOutlet(definition.outletId??'');setDealer(definition.dealerOrgId??'');}}>Buka report</button></article>)}{!saved.loading&&!saved.error&&!saved.data?.length&&<Empty description="Simpan filter pertama daripada data sebenar."/>}</Panel>
  </>;
}
