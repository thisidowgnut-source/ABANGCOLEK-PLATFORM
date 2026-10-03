import { useState } from 'react';
import type { JevAllowedContext, JevAssessment, JevEvaluationRun, JevPackId, JevQuestion } from '../../../shared/jev-contracts';
import { api, jsonMutation, useResource } from '../platform/client';
import { Empty, FormPanel, Panel, ResourceState, Status, field } from './ui';

interface Pack { id: JevPackId; version: string; providerVersion: string; activation: string; questions: JevQuestion[] }
type AssessmentRecord = JevAssessment & { contextStatus: 'CURRENT' | 'STALE' };

/** First-party evaluation history; benchmark fixtures never populate this workspace. */
export function JevEvaluationWorkspace({ canEvaluate = true }: { canEvaluate?: boolean }) {
  const packs = useResource<Pack[]>('/jev/packs');
  const history = useResource<AssessmentRecord[]>('/jev/assessments');
  const [latest, setLatest] = useState<JevAssessment | null>(null);
  function reload() { history.reload(); }
  return <div className="xp-grid">
    <Panel title="JEV · bukti dan semakan" eyebrow="Local rules · review only">
      <p>Penilaian membantu routing dan semakan. Bayaran, refund, penerbitan dan pelepasan QC memerlukan polisi serta kuasa domain yang sah.</p>
      <p className="xp-muted">Confidence dan probability tidak tersedia untuk local rules. Native TypeSafe belum diaktifkan.</p>
      <ResourceState {...packs}/>
      {packs.data && <dl className="xp-detail-grid">{packs.data.map(pack => <div key={pack.id}><dt>{pack.id.replaceAll('_', ' ')}</dt><dd>Pack {pack.version} · {pack.questions.length} soalan · {pack.providerVersion}</dd><Status value={pack.activation}/></div>)}</dl>}
    </Panel>
    {packs.data && <FormPanel title="Nilai konteks rekod sebenar" description="Server memilih source dan revision mengikut akses anda. Evidence yang berubah memerlukan penilaian semula." submitLabel="Nilai untuk semakan" fields={[
      field('packId', 'Question pack', { options: packs.data.map(pack => ({ value: pack.id, label: pack.id.replaceAll('_', ' ') })) }),
      field('entityId', 'ID rekod', { help: 'Gunakan ID case/order/restock/campaign/QC; developer menggunakan runtime.' }),
      field('text', 'Nota untuk semakan', { required: false, type: 'textarea', max: 8000, help: 'Nota dianggap dakwaan yang belum disahkan.' }),
    ]} onSubmit={async values => {
      const context = await api<JevAllowedContext>(`/jev/context?packId=${encodeURIComponent(values.packId)}&entityId=${encodeURIComponent(values.entityId)}`);
      const result = await api<JevAssessment>('/jev/assessments', jsonMutation({ packId: values.packId, entityId: values.entityId, expectedRevision: context.entityRevision, ...(values.text ? { text: values.text } : {}) }));
      setLatest(result); reload(); return result;
    }}/>} 
    {latest && <AssessmentDetail assessment={latest}/>}
    <Panel title="Sejarah penilaian rekod" eyebrow="Permission-filtered evidence">
      <ResourceState {...history}/>
      {history.data?.length === 0 && <Empty description="Tiada penilaian yang tersimpan untuk rekod dalam akses anda."/>}
      {history.data?.map(assessment => <div className="xp-list-row" key={assessment.id}><div><strong>{assessment.packId.replaceAll('_', ' ')}</strong><p className="xp-muted">{assessment.entityId} · revision {assessment.entityRevision} · {new Date(assessment.createdAt).toLocaleString('ms-MY')}</p><Status value={assessment.status}/> <Status value={assessment.contextStatus}/></div><button className="xp-button xp-secondary" onClick={() => setLatest(assessment)}>Lihat penilaian</button></div>)}
    </Panel>
    {canEvaluate && <EvaluationRuns/>}
  </div>;
}

function AssessmentDetail({ assessment }: { assessment: JevAssessment }) {
  return <Panel title="Hasil penilaian" eyebrow={`${assessment.packId} · ${assessment.providerMode}`}>
    <p><Status value={assessment.status}/> · {assessment.id}</p>
    {Object.keys(assessment.answers).length === 0 ? <p>Abstain: maklumat belum membolehkan keputusan yang boleh dipercayai.</p> : <dl className="xp-detail-grid">{Object.entries(assessment.answers).map(([name, answer]) => <div key={name}><dt>{name}</dt><dd>{answer.value === null ? 'Unknown / tidak dinilai' : String(answer.value)}</dd><p className="xp-muted">{answer.reason}</p></div>)}</dl>}
    <p className="xp-muted">{assessment.policy.reasonCodes.join(' · ')}</p>
    <p>{assessment.evidence.length} bukti dibenarkan · context {assessment.contextVersion?.slice(0, 12) ?? 'tidak tersedia'} · latency {assessment.latencyMs} ms</p>
    {assessment.evidence.length > 0 && <ul>{assessment.evidence.map(evidence => <li key={evidence.id}>{evidence.id} · {evidence.kind} · {evidence.text}</li>)}</ul>}
  </Panel>;
}

function EvaluationRuns() {
  const runs = useResource<JevEvaluationRun[]>('/jev/evaluations');
  const [selected, setSelected] = useState<JevEvaluationRun | null>(null);
  return <>
    <FormPanel title="Jalankan evaluation held-out" description="Masukkan dataset berlabel yang telah disanitasi. Fixtures ujian tidak menjadi data bisnes. Text kes tidak disimpan dalam sejarah; hanya hash, metrics dan ID error direkod." submitLabel="Jalankan evaluation" fields={[
      field('datasetId', 'Dataset ID'), field('datasetVersion', 'Dataset version'),
      field('cases', 'Cases JSON', { type: 'textarea', max: 180000, help: 'Array: id, locale (ms/en), errorClass, packId, text, expected (question ID → value), expectedStatus optional. Maksimum 100 kes. Score local: null; Noul local: boolean/null.' }),
    ]} onSubmit={async values => {
      let cases: unknown;
      try { cases = JSON.parse(values.cases); } catch { throw new Error('Cases JSON tidak sah. Semak syntax array.'); }
      if (!Array.isArray(cases)) throw new Error('Cases mesti JSON array.');
      const result = await api<JevEvaluationRun>('/jev/evaluations', jsonMutation({ datasetId: values.datasetId, datasetVersion: values.datasetVersion, split: 'held_out', cases }));
      setSelected(result); runs.reload(); return result;
    }}/>
    <Panel title="Evaluation history" eyebrow="Observed results · no calibrated confidence">
      <ResourceState {...runs}/>
      {runs.data?.length === 0 && <Empty description="Belum ada evaluation dataset berlabel yang dijalankan."/>}
      {runs.data?.map(run => <div className="xp-list-row" key={run.id}><div><strong>{run.datasetId} · {run.datasetVersion}</strong><p>{run.caseCount} kes · match {(run.metrics.matchRate * 100).toFixed(1)}% · abstain {(run.metrics.abstentionRate * 100).toFixed(1)}%</p><p className="xp-muted">{run.providerVersion} · review only</p></div><button className="xp-button xp-secondary" onClick={() => setSelected(run)}>Lihat metrics</button></div>)}
      {selected && <><h3>{selected.datasetId} · {selected.datasetVersion}</h3><dl className="xp-detail-grid"><div><dt>Coverage</dt><dd>{(selected.metrics.coverage * 100).toFixed(1)}% non-unknown answers</dd></div><div><dt>Latency p95</dt><dd>{selected.observedLatency.p95Ms} ms</dd></div><div><dt>Provider calls / kos baharu</dt><dd>{selected.usage.providerCalls} / RM0.00</dd></div><div><dt>Calibration</dt><dd>{selected.calibration.status}</dd></div></dl><p className="xp-muted">{selected.calibration.reason}</p><h3>Error classes</h3><dl className="xp-detail-grid">{Object.entries(selected.byErrorClass).map(([name, metrics]) => <div key={name}><dt>{name.replaceAll('_', ' ')}</dt><dd>{metrics.matchedCases}/{metrics.cases} match · {metrics.abstentions} abstain</dd></div>)}</dl>{selected.errors.length > 0 && <ul>{selected.errors.map(error => <li key={error.caseId}>{error.caseId} · {error.errorClass} · {error.questionIds.join(', ')}</li>)}</ul>}</>}
    </Panel>
  </>;
}
