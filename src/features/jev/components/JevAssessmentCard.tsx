import { useState } from 'react';
import { ArrowUpRight, ChevronDown, ClipboardCheck, FileText, ShieldCheck } from 'lucide-react';
import type { JevAssessment } from '../../../../shared/jev-contracts';
import './jev-assessment.css';

export interface JevAssessmentCardProps {
  assessment: JevAssessment;
  onReview?: (assessment: JevAssessment) => void;
  title?: string;
}

const labels: Record<string, string> = {
  intent: 'Tujuan', issue: 'Isu dilaporkan', rootCause: 'Punca fizikal', urgency: 'Keutamaan',
  refundRequested: 'Permintaan refund', humanRequested: 'Permintaan staf', pillar: 'Pillar kandungan',
  healthClaim: 'Isyarat claim kesihatan', priceMention: 'Harga disebut', readiness: 'Kesiapsiagaan',
  trainingRequested: 'Permintaan latihan', risk: 'Boundary semakan', reviewRequired: 'Semakan diperlukan',
};
const values: Record<string, string> = {
  UNKNOWN: 'Belum diketahui', UNDETERMINED: 'Belum disahkan', LEAKAGE: 'Kebocoran dilaporkan',
  SEAL_FAILURE: 'Isu penutup dilaporkan', COMPLAINT: 'Aduan', LOCATION_QUERY: 'Pertanyaan lokasi',
  AGENT_APPLICATION: 'Permohonan ejen', REFUND: 'Permintaan refund',
};
const display = (value: string | number | boolean | null) => value === null ? 'Perlu semakan' :
  typeof value === 'boolean' ? (value ? 'Isyarat ditemui' : 'Tiada isyarat ditemui') : values[String(value)] ?? String(value).replaceAll('_', ' ');

export function JevAssessmentCard({ assessment, onReview, title = 'JEV • Evidence & Action' }: JevAssessmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const empty = assessment.status === 'ABSTAIN';
  const detailsId = `jev-details-${assessment.id}`;
  return (
    <article className="jev-assessment" aria-label={title}>
      <header className="jev-assessment__header">
        <span className="jev-assessment__icon"><ShieldCheck size={20} aria-hidden="true" /></span>
        <div><h3>{title}</h3><p>{empty ? 'Maklumat belum mencukupi' : 'Cadangan tempatan untuk semakan'}</p></div>
        <span className="jev-assessment__badge">Local rules</span>
      </header>
      <p className="jev-assessment__notice">{empty ? 'Tambah mesej dan bukti untuk memulakan semakan.' : 'Routing berdasarkan kata kunci. Tiada probability model, approval komersial atau tindakan luaran dihasilkan.'}</p>
      {Object.keys(assessment.answers).length > 0 && (
        <dl className="jev-assessment__grid">
          {Object.entries(assessment.answers).map(([name, answer]) => (
            <div key={name}><dt>{labels[name] ?? name}</dt><dd>{display(answer.value)}</dd></div>
          ))}
        </dl>
      )}
      <footer className="jev-assessment__footer">
        <span><ClipboardCheck size={15} aria-hidden="true" />Semakan manusia diperlukan</span>
        <div className="jev-assessment__actions">
          <button type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded(value => !value)}>
            Bukti & sebab <ChevronDown size={15} aria-hidden="true" />
          </button>
          {onReview && <button type="button" className="jev-assessment__primary" onClick={() => onReview(assessment)}>Buka semakan <ArrowUpRight size={15} aria-hidden="true" /></button>}
        </div>
      </footer>
      {expanded && <section id={detailsId} className="jev-assessment__details" aria-label="Bukti dan batas penilaian">
        <p><strong>Sumber:</strong> {assessment.evidence.length ? `${assessment.evidence.length} rekod dibekalkan` : 'Mesej sahaja; bukti fizikal belum disahkan.'}</p>
        {assessment.evidence.length > 0 && <ul>{assessment.evidence.map((source, index) => <li key={`${source.id}-${index}`}><FileText size={14} aria-hidden="true" /><span>{source.id} · {source.kind}{source.observedAt ? ` · ${new Date(source.observedAt).toLocaleString('ms-MY')}` : ''}</span></li>)}</ul>}
        <p><strong>Polisi:</strong> {assessment.policy.reasonCodes.join(' · ')}</p>
        <p className="jev-assessment__metadata">{assessment.id} · Question set {assessment.questionSetVersion} · {assessment.latencyMs} ms diperhatikan · {new Date(assessment.createdAt).toLocaleString('ms-MY')}</p>
      </section>}
    </article>
  );
}
