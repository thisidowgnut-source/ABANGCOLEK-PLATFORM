import { useState } from 'react';
import { Download, ExternalLink, Plus } from 'lucide-react';
import type { AutomationCapability, PreparedPostizExport, ResearchSessionGrant, ResearchSourceRecord, SavedResearchBrief } from '../../../shared/automation-contracts';
import type { CampaignRecord, WorkspaceRole } from '../../../shared/platform-contracts';
import { api, jsonMutation, useResource } from '../platform/client';
import { dateLabel, downloadText, malaysiaDateTime } from './experience-model';
import { Empty, field, FormPanel, MutationButton, Panel, Refresh, ResourceState, Status } from './ui';

export function AutomationWorkspace({ role, onChanged }: { role: WorkspaceRole; onChanged?: () => void }) {
  const capabilities = useResource<AutomationCapability[]>('/automation/capabilities');
  return <>
    <Panel title="Automation readiness" eyebrow="Configured capabilities · explicit authorization" action={<Refresh onClick={capabilities.reload} />}>
      <ResourceState {...capabilities} />
      <div className="xp-detail-grid">{capabilities.data?.map(capability => <article key={capability.providerId}>
        <h3>{capability.providerId === 'manual' ? 'Manual research & export' : capability.providerId.replaceAll('_', ' ')}</h3>
        <Status value={capability.status} />
        <p>{capability.providerId === 'manual' ? 'Sources, tafsiran manusia dan approved export disimpan dalam aplikasi.' : capability.reasonCode === 'REMOTE_PUBLISH_DISABLED' ? 'Remote publish disabled. Approved pack boleh dieksport secara manual.' : capability.configured ? 'Host transport configured; penggunaan dan source grant masih perlu disahkan.' : 'Runtime belum configured. Gunakan research manual di bawah.'}</p>
        {capability.providerId !== 'manual' && <p className="xp-muted">Usage {capability.usage.observedUnits === null ? 'unknown' : capability.usage.observedUnits} · Last verified {capability.verifiedAt ? dateLabel(capability.verifiedAt) : 'Belum verified'}</p>}
      </article>)}</div>
    </Panel>
    {role === 'founder' && <ResearchDesk onChanged={onChanged} />}
  </>;
}

function ResearchDesk({ onChanged }: { onChanged?: () => void }) {
  const sources = useResource<ResearchSourceRecord[]>('/research/sources');
  const briefs = useResource<SavedResearchBrief[]>('/research/briefs');
  const grants = useResource<ResearchSessionGrant[]>('/research/grants');
  const exports = useResource<PreparedPostizExport[]>('/automation/exports');
  const campaigns = useResource<CampaignRecord[]>('/campaigns');
  const [form, setForm] = useState<'source' | 'brief' | 'grant' | 'research' | 'export' | null>(null);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const refresh = () => { sources.reload(); briefs.reload(); grants.reload(); exports.reload(); campaigns.reload(); onChanged?.(); };
  const eligibleSources = sources.data?.filter(source => source.termsCheck !== 'restricted') ?? [];
  return <>
    <Panel title="Research sources" eyebrow="Source fact → human interpretation → retained history" action={<div className="xp-actions"><Refresh onClick={refresh} /><button className="xp-button" onClick={() => setForm('source')}><Plus size={17} /> Capture source</button><button className="xp-button xp-secondary" onClick={() => setForm('brief')}>Simpan research brief</button></div>}>
      <ResourceState {...sources} />
      <p className="xp-muted">Masukkan pautan public dan excerpt yang anda dibenarkan gunakan. Capture ini tidak mengambil kandungan laman secara automatik. Arahan dalam kandungan sumber tidak memberikan hak tindakan.</p>
      {sources.data?.map(source => <details key={source.id} className="xp-knowledge">
        <summary><span><strong>{source.title}</strong><small>Captured {dateLabel(source.retrievedAt)} · {source.accessMethod}</small></span><Status value={source.termsCheck} /></summary>
        <p><a href={source.url} target="_blank" rel="noopener noreferrer">Buka sumber <ExternalLink size={14} aria-hidden="true" /></a></p>
        <blockquote>{source.snippet}</blockquote>
        <p>{source.author && `Author: ${source.author} · `}Published {source.publishedAt ? dateLabel(source.publishedAt) : 'Unknown'} · Permitted use: {source.permittedUse}</p>
        <p className="xp-record-meta">SHA-256 {source.contentHash}</p>
      </details>)}
      {!sources.loading && !sources.error && !sources.data?.length && <Empty description="Belum ada sumber. Simpan sumber sebenar untuk menyokong research brief." />}
    </Panel>
    {form === 'source' && <FormPanel title="Capture source dengan provenance" description="Retrieved time ialah masa anda membaca sumber; publication date disimpan berasingan jika diketahui." fields={[
      field('url', 'Public source URL', { type: 'url', max: 2000 }), field('title', 'Source title', { max: 300 }), field('snippet', 'Excerpt / pemerhatian sebenar', { type: 'textarea', max: 8000 }),
      field('retrievedAt', 'Masa sumber dibaca (MYT)', { type: 'datetime-local' }), field('publishedAt', 'Publication date jika diketahui (MYT)', { type: 'datetime-local', required: false }), field('author', 'Author jika diketahui', { required: false, max: 200 }),
      field('termsCheck', 'Permission / source terms', { options: [{ value: 'allowed', label: 'Allowed · permission sudah disemak' }, { value: 'unknown', label: 'Unknown · tandakan batas penggunaan' }, { value: 'restricted', label: 'Restricted · simpan reference sahaja' }] }), field('permittedUse', 'Penggunaan yang dibenarkan / batas', { type: 'textarea', max: 2000 }),
    ]} onCancel={() => setForm(null)} submitLabel="Simpan source record" onSubmit={async values => {
      const result = await api('/research/sources', jsonMutation({ ...values, retrievedAt: malaysiaDateTime(values.retrievedAt), publishedAt: values.publishedAt ? malaysiaDateTime(values.publishedAt) : undefined, author: values.author || undefined })); refresh(); return result;
    }} />}
    {form === 'brief' && <FormPanel title="Simpan tafsiran manusia" description="Brief ini ialah tafsiran anda berdasarkan source yang dipilih. Ia tidak mengubah approved campaign atau catalogue." fields={[field('question', 'Research question', { type: 'textarea', max: 2000 }), field('summary', 'Interpretation / hypotheses', { type: 'textarea', max: 12000 }), field('unknownReasons', 'Batas / unknowns (satu setiap baris)', { type: 'textarea', required: false, max: 2000 })]} onCancel={() => setForm(null)} submitLabel="Simpan source-linked brief" onSubmit={async values => {
      if (!sourceIds.length) throw new Error('Pilih sekurang-kurangnya satu source yang dibenarkan.');
      const result = await api('/research/briefs', jsonMutation({ question: values.question, summary: values.summary, sourceIds, unknownReasons: values.unknownReasons.split('\n').map(value => value.trim()).filter(Boolean) })); refresh(); return result;
    }}>
      <fieldset><legend>Supporting sources</legend>{eligibleSources.map(source => <label key={source.id} className="xp-checkbox"><input type="checkbox" checked={sourceIds.includes(source.id)} onChange={event => setSourceIds(current => event.target.checked ? [...current, source.id] : current.filter(value => value !== source.id))} /> {source.title} · {source.termsCheck}</label>)}{!eligibleSources.length && <p>Simpan source yang boleh digunakan terlebih dahulu.</p>}</fieldset>
    </FormPanel>}
    <Panel title="Research brief history" eyebrow="Persisted receipts · explicit unknowns">
      <ResourceState {...briefs} />
      {briefs.data?.map(brief => <details key={brief.id} className="xp-knowledge"><summary><span><strong>{brief.question}</strong><small>{dateLabel(brief.createdAt)} · {brief.synthesis === 'human_authored' ? 'Human interpretation' : 'Untrusted external synthesis'}</small></span><Status value={brief.status} /></summary>
        <p style={{ whiteSpace: 'pre-wrap' }}>{brief.summary || 'Tiada synthesis yang dapat disahkan.'}</p>
        <ul>{brief.sourceRefs.map((source, index) => <li key={`${source.url}:${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> · captured {dateLabel(source.retrievedAt)}</li>)}</ul>
        {brief.unknownReasons.length > 0 && <p className="xp-notice">Unknowns: {brief.unknownReasons.join(' · ')}</p>}
      </details>)}
      {!briefs.loading && !briefs.error && !briefs.data?.length && <Empty description="Brief dan source links akan kekal sebagai rekod history selepas disimpan." />}
    </Panel>
    <Panel title="Optional external research" eyebrow="Explicit origin scope · expiry · revocation" action={<div className="xp-actions"><button className="xp-button xp-secondary" onClick={() => setForm('grant')}>Opt-in source grant</button><button className="xp-button xp-secondary" onClick={() => setForm('research')}>Request read-only research</button></div>}>
      <p className="xp-muted">Grant ini membenarkan public source research dalam origin yang dipilih. Ia tidak log masuk, menyalin browser cookies, mengakses inbox atau memberikan publishing privileges. Jika runtime/usage unavailable, request menghasilkan blocked receipt.</p>
      <ResourceState {...grants} />
      {grants.data?.map(grant => <article className="xp-knowledge" key={grant.id}><h3>{grant.purpose}</h3><p>{grant.allowedOrigins.join(' · ')} · Expires {dateLabel(grant.expiresAt)}</p><Status value={grant.status} />{grant.status === 'active' && <MutationButton path={`/research/grants/${grant.id}/revoke`} input={{ expectedVersion: grant.version }} onChanged={refresh} confirmLabel="Sahkan revoke source grant">Revoke</MutationButton>}</article>)}
    </Panel>
    {form === 'grant' && <FormPanel title="Opt-in public source scope" fields={[field('allowedOrigins', 'Allowed public origins (satu setiap baris)', { type: 'textarea', help: 'Contoh https://example.org. Tiada path, local IP atau credentials.', max: 2000 }), field('purpose', 'Tujuan source research', { max: 1000 }), field('expiresAt', 'Expiry dalam 7 hari (MYT)', { type: 'datetime-local' })]} onCancel={() => setForm(null)} submitLabel="Authorize scope ini" onSubmit={async values => { const result = await api('/research/grants', jsonMutation({ allowedOrigins: values.allowedOrigins.split('\n').map(value => value.trim()).filter(Boolean), purpose: values.purpose, expiresAt: malaysiaDateTime(values.expiresAt) })); refresh(); return result; }} />}
    {form === 'research' && <FormPanel title="Request read-only research" fields={[field('question', 'Research question', { type: 'textarea', max: 2000 }), field('allowedSources', 'Exact permitted source URLs (satu setiap baris)', { type: 'textarea', max: 8000 }), field('sessionGrantId', 'Active explicit grant', { options: grants.data?.filter(grant => grant.status === 'active' && grant.expiresAt > new Date().toISOString()).map(grant => ({ value: grant.id, label: grant.purpose })) ?? [] }), field('maxItems', 'Maximum sources', { type: 'number', min: 1, max: 20, defaultValue: '5' })]} onCancel={() => setForm(null)} submitLabel="Simpan request & jalankan jika admitted" onSubmit={async values => { const result = await api('/research/run', jsonMutation({ question: values.question, allowedSources: values.allowedSources.split('\n').map(value => value.trim()).filter(Boolean), sessionGrantId: values.sessionGrantId, maxItems: Number(values.maxItems) })); refresh(); return result; }} />}
    <Panel title="Approved publishing handoff" eyebrow="Exported pack · manual delivery · no publish receipt" action={<button className="xp-button xp-secondary" onClick={() => setForm('export')}>Prepare approved export</button>}>
      <ResourceState {...exports} />
      {exports.data?.map(artifact => <article key={artifact.id} className="xp-knowledge"><h3>{campaigns.data?.find(campaign => campaign.id === artifact.campaignId)?.title ?? 'Approved campaign'} · v{artifact.campaignRevision}</h3><p>{artifact.channel} · {artifact.accountId ?? 'Manual account selection'} · {dateLabel(artifact.createdAt)}</p><Status value={artifact.status} /><p>Manual delivery diperlukan. Export tidak membuktikan post diterbitkan.</p><button className="xp-button xp-secondary" onClick={() => downloadText(`campaign-v${artifact.campaignRevision}.txt`, artifact.content ?? '')}><Download size={16} /> Download exact approved caption</button></article>)}
      {!exports.loading && !exports.error && !exports.data?.length && <Empty description="Sediakan exact approved revision untuk manual channel handoff." />}
    </Panel>
    {form === 'export' && <FormPanel title="Prepare approved channel pack" fields={[field('campaignId', 'Approved campaign', { options: campaigns.data?.filter(campaign => ['approved', 'planned'].includes(campaign.status)).map(campaign => ({ value: campaign.id, label: `${campaign.title} · v${campaign.revision}` })) ?? [] }), field('channel', 'Intended channel', { max: 120, help: 'Label sahaja. Tidak menyambungkan atau menerbit ke platform.' }), field('accountId', 'Intended account label', { required: false, max: 120 })]} onCancel={() => setForm(null)} submitLabel="Prepare & save export" onSubmit={async values => { const campaign = campaigns.data?.find(item => item.id === values.campaignId); if (!campaign) throw new Error('Pilih approved campaign.'); const result = await api(`/campaigns/${campaign.id}/postiz-prepare`, jsonMutation({ expectedRevision: campaign.revision, channel: values.channel, accountId: values.accountId || undefined })); refresh(); return result; }} />}
  </>;
}
