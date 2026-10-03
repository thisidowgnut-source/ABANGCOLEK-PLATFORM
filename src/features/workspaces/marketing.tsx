import { useState } from 'react';
import { CalendarDays,Download,Megaphone,Plus } from 'lucide-react';
import type { CampaignAsset,CampaignRecord,ExportArtifact,PublicProduct,WorkspaceRole } from '../../../shared/platform-contracts';
import { api,useResource } from '../platform/client';
import { campaignApprovalIssues,dateLabel,downloadText,malaysiaDateTime } from './experience-model';
import { Empty,field,FormPanel,Panel,RecordMeta,Refresh,ResourceState,splitRefs,Status } from './ui';

export function Marketing({ role,onChanged }: { role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<CampaignRecord[]>('/campaigns');
  const catalogue=useResource<PublicProduct[]>('/catalogue');
  const [editing,setEditing]=useState<CampaignRecord|'new'|null>(null);
  const [approving,setApproving]=useState<CampaignRecord|null>(null);
  const [filter,setFilter]=useState('all');
  const [exportError,setExportError]=useState('');
  const [exporting,setExporting]=useState('');
  const refresh=() => { resource.reload(); onChanged?.(); };
  const campaigns=resource.data?.filter(campaign => filter==='all'||campaign.status===filter)??[];
  async function exportCampaign(campaign: CampaignRecord,format: 'text'|'asset_bundle'='text') {
    setExportError(''); setExporting(campaign.id);
    try {
      const artifact=await api<ExportArtifact&{ downloadUrl?: string; }>(`/campaigns/${campaign.id}/export`,{ method: 'POST',body: JSON.stringify({ expectedRevision: campaign.revision,format }) }); if(format==='asset_bundle') {
        if(!artifact.downloadUrl?.startsWith('/api/platform/exports/')) throw new Error('Download grant tidak sah.');
        const anchor=document.createElement('a'); anchor.href=artifact.downloadUrl; anchor.download=''; anchor.click();
      } else { if(!artifact.content) throw new Error('Server tidak memulangkan export content.'); downloadText(`${campaign.title.replace(/[^\w\- ]/g,'').slice(0,50)||'campaign'}-v${campaign.revision}.txt`,artifact.content); } refresh();
    }
    catch(failure) { setExportError(failure instanceof Error? failure.message:'Export gagal.'); }
    finally { setExporting(''); }
  }
  return <>
    <Panel title="Marketing studio" eyebrow="Plan · review rights · approve · export" action={<div className="xp-actions">
      <Refresh onClick={refresh} />
      <button className="xp-button" onClick={() => setEditing('new')}>
        <Plus size={17} /> Kempen baharu</button>
    </div>}>
      <ResourceState {...resource} />
      <div className="xp-channel-status">
        <Megaphone size={22} />
        <div>
          <strong>Manual export available</strong>
          <p>Auto-publish memerlukan verified channel grant dan provider receipt. Tiada akaun social connected yang disahkan di workspace ini.</p>
        </div>
        <Status value="gated" />
      </div>
      <div className="xp-tablist" aria-label="Campaign filter">{['all','draft','approved','planned','exported'].map(value => <button key={value} className={filter===value? 'xp-tab-active':''} onClick={() => setFilter(value)}>{value}</button>)}</div>{exportError&&<p className="xp-notice xp-error" role="alert">{exportError}</p>}<div className="xp-campaign-grid">{campaigns.map(campaign => {
        const issues=campaignApprovalIssues(campaign); return <article className="xp-campaign" key={campaign.id}>
          <div className="xp-campaign-top">
            <span className="xp-campaign-icon">
              <Megaphone size={24} />
            </span>
            <Status value={campaign.status} />
          </div>
          <p className="xp-eyebrow">{campaign.objective}</p>
          <h3>{campaign.title}</h3>
          <p className="xp-campaign-copy">{campaign.copy}</p>
          <RecordMeta id={campaign.id} revision={campaign.revision} />
          <p className="xp-muted">Catalogue v{campaign.catalogueVersion} · {campaign.productIds.length} linked products</p>{campaign.scheduledAt&&<p className="xp-campaign-schedule">
            <CalendarDays size={16} />{dateLabel(campaign.scheduledAt)} MYT</p>}<details className="xp-details">
            <summary>Assets & rights ({campaign.assets.length})</summary>{campaign.assets.map(asset => <div className="xp-asset" key={asset.id}>
              <strong>{asset.name}</strong>
              <p>Rights: {asset.rights||'Unknown'} · Consent: {asset.consent||'Unknown'}</p>{asset.evidenceId&&<code>{asset.evidenceId}</code>}</div>)}</details>{campaign.approvedBy&&<p className="xp-muted">Approved by {campaign.approvedBy}{campaign.approvalExpiresAt? ` · Expires ${dateLabel(campaign.approvalExpiresAt)}`:''}</p>}{issues.map(issue => <p className="xp-inline-error" key={issue}>{issue}</p>)}<div className="xp-actions">
            <button className="xp-button xp-secondary" onClick={() => setEditing(campaign)}>Edit revision</button>{role==='founder'&&campaign.status==='draft'&&<button className="xp-button xp-secondary" disabled={issues.length>0} onClick={() => setApproving(campaign)}>Review & approve</button>}{campaign.status!=='draft'&&<button className="xp-button" onClick={() => exportCampaign(campaign)} disabled={Boolean(exporting)}>
              <Download size={16} />{exporting===campaign.id? 'Exporting…':'Export caption'}</button>}{campaign.status!=='draft'&&campaign.assets.length>0&&<button className="xp-button xp-secondary" onClick={() => exportCampaign(campaign,'asset_bundle')} disabled={Boolean(exporting)}>Download asset bundle</button>}</div>
        </article>;
      })}</div>{!resource.loading&&!resource.error&&!campaigns.length&&<Empty title="Idea anda bermula sebagai draft" description="Tulis campaign, semak product claims, asset rights dan consent sebelum approval. Export tidak dilabel published." />}</Panel>{editing&&<FormPanel key={editing==='new'? 'new':`${editing.id}:${editing.revision}`} title={editing==='new'? 'Campaign draft':`Edit ${editing.title}`} description="Perubahan copy atau aset menghasilkan revision baharu dan memerlukan approval semula. Harga/stock claims mesti merujuk published catalogue." fields={[field('title','Nama kempen',{ defaultValue: editing!=='new'? editing.title:'' }),field('objective','Objektif kempen',{ defaultValue: editing!=='new'? editing.objective:'' }),field('copy','Caption / approved claims draft',{ type: 'textarea',defaultValue: editing!=='new'? editing.copy:'',max: 20000 }),field('productIds','Linked published product IDs',{ required: false,defaultValue: editing!=='new'? editing.productIds.join(', '):'',help: catalogue.data?.map(product => `${product.name}: ${product.id}`).join(' · ')||'Tiada produk diterbitkan.' }),field('scheduledAt','Planned calendar time (MYT)',{ type: 'datetime-local',required: false,defaultValue: editing!=='new'&&editing.scheduledAt? new Date(new Date(editing.scheduledAt).getTime()+8*3600000).toISOString().slice(0,16):'' }),field('assets','Aset: ID | nama | rights | consent | evidence ID',{ type: 'textarea',required: false,defaultValue: editing!=='new'? editing.assets.map(asset => `${asset.id}|${asset.name}|${asset.rights}|${asset.consent}|${asset.evidenceId??''}`).join('\n'):'',help: 'Satu aset setiap baris. Gunakan aset milik sendiri atau yang mempunyai permission sebenar.' })]} onCancel={() => setEditing(null)} submitLabel="Simpan draft revision" onSubmit={async values => {
        const assets: CampaignAsset[]=values.assets.split('\n').filter(Boolean).map(line => { const [id,name,rights,consent,evidenceId]=line.split('|').map(part => part.trim()); if(!id||!name) throw new Error('Aset memerlukan ID dan nama.'); return { id,name,rights: rights||'',consent: consent||'',...(evidenceId? { evidenceId }:{}) }; });
        const productIds=splitRefs(values.productIds); if(productIds.some(id => !catalogue.data?.some(product => product.id===id))) throw new Error('Produk mesti daripada published catalogue.');
        const result=await api(editing==='new'? '/campaigns':`/campaigns/${editing.id}/update`,{ method: 'POST',body: JSON.stringify({ title: values.title,objective: values.objective,copy: values.copy,assets,productIds,catalogueVersion: Math.max(0,...(catalogue.data?.map(product => product.publishedVersion)??[])),scheduledAt: values.scheduledAt? malaysiaDateTime(values.scheduledAt):undefined,...(editing!=='new'? { expectedRevision: editing.revision }:{}) }) }); refresh(); return result;
      }} />} {approving&&<FormPanel key={approving.id} title={`Approve exact revision ${approving.revision}`} description={`Review: ${approving.copy}`} fields={[field('approvalExpiresAt','Approval expiry (MYT)',{ type: 'datetime-local' })]} submitLabel="Sahkan copy, assets & revision" onCancel={() => setApproving(null)} onSubmit={async values => {
        const approvalExpiresAt=malaysiaDateTime(values.approvalExpiresAt); if(new Date(approvalExpiresAt).getTime()<=Date.now()) throw new Error('Expiry mesti pada masa akan datang.');
        const result=await api(`/campaigns/${approving.id}/approve`,{ method: 'POST',body: JSON.stringify({ expectedRevision: approving.revision,approvalExpiresAt }) }); setApproving(null); refresh(); return result;
      }} />}</>;
}
