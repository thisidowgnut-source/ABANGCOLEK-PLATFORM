import { useState, type ReactNode } from 'react';
import type { CommissionPolicy, PublicProduct, RestockRecord, SessionData, WorkspaceRole } from '../../../shared/platform-contracts';
import type { DealerBenefit, DealerLedger as DealerLedgerData, DealerRestockRecord, DealerReturnRecord, DealerSettlement } from '../../../shared/dealer-contracts';
import { api, useResource } from '../platform/client';
import { amountToSen, dateLabel, money, positiveQuantity } from './experience-model';
import { Empty, field, FormPanel, Panel, RecordMeta, Refresh, ResourceState, splitRefs, Status } from './ui';

interface Props { role: WorkspaceRole; onChanged?: () => void; renderEvidence?: (entityId: string, onChanged: () => void) => ReactNode }

export function DealerLedger(props: Props) {
  const session = useResource<SessionData>('/session');
  const enabled = props.role === 'founder' || session.data?.memberships.some(member => member.status === 'active' && member.role === 'customer' && member.dealerOrgId);
  if (!enabled) return <Panel title="Stock & settlement ledger"><ResourceState {...session} /><p className="xp-notice">Ledger tersedia selepas membership dealer diluluskan.</p></Panel>;
  return <ScopedDealerLedger {...props} />;
}

function ScopedDealerLedger({ role, onChanged, renderEvidence }: Props) {
  const ledger = useResource<DealerLedgerData>('/dealer/ledger');
  const restocks = useResource<DealerRestockRecord[]>('/dealer/restocks');
  const benefits = useResource<DealerBenefit[]>('/dealer/benefits');
  const refresh = () => { ledger.reload(); restocks.reload(); benefits.reload(); onChanged?.(); };
  const eligible = restocks.data?.filter(record => ['dispatched', 'received'].includes(record.status)) ?? [];
  return <>
    <Panel title="Consignment & return ledger" eyebrow="Owner · custody · immutable events" action={<Refresh onClick={refresh} />}>
      <p className="xp-form-description">Sell-through mengurangkan stock konsainan dan membentuk obligation pada harga quote asal. Return memerlukan semakan founder dan masuk quarantine selepas diterima.</p>
      <ResourceState {...ledger} /><ResourceState {...restocks} />
      {eligible.map(record => <article className="xp-dealer-card" key={record.id}>
        <div><h3>{record.lines.map(line => line.name).join(', ')} · {record.ownership}</h3><RecordMeta id={record.id} revision={record.revision} />
          {record.dealerTermsVersion && <p className="xp-muted">Recorded commercial terms v{record.dealerTermsVersion} · {record.returnRules}</p>}
          {ledger.data?.lots.filter(lot => lot.sourceRestockId === record.id && lot.quantity > 0).map(lot => <p key={lot.id}>Stock {lot.productId} · {lot.quantity} units · owner {lot.ownerId} · custody {lot.custodyId} · {lot.status} · Batch {lot.batchId ?? 'not recorded'} · Expiry {lot.expiryAt ? dateLabel(lot.expiryAt) : 'not recorded'} · Provenance {lot.provenanceStatus ?? 'unknown'}</p>)}
          {ledger.data?.reservations?.filter(reservation => reservation.sourceRestockId === record.id && reservation.status === 'active').map(reservation => <p className="xp-notice" key={reservation.id}>Held for return review · {reservation.quantity} units · {reservation.productId} · Return {reservation.orderId}</p>)}
          <StockActions restock={record} refresh={refresh} renderEvidence={renderEvidence} />
        </div>
      </article>)}
      {!restocks.loading && !restocks.error && !eligible.length && <Empty description="Stock diterima daripada restock sebenar akan muncul di sini." />}
      {ledger.data?.returns.map(record => <ReturnReview key={record.id} record={record} role={role} refresh={refresh} />)}
      {ledger.data?.entries.map(entry => <article className="xp-dealer-card" key={entry.id}>
        <div><h3>{entry.kind.replaceAll('_', ' ')}</h3><p>{entry.lines.map(line => `${line.name} × ${line.quantity}`).join(', ')} · {money(entry.amountSen)}</p><p>{entry.reference}</p><RecordMeta id={entry.id} revision={entry.sourceRevision} /><p className="xp-muted">{dateLabel(entry.createdAt)} · Evidence {entry.evidenceIds.join(', ')} · Source {entry.sourceEntityId} · Movements {entry.movementIds.join(', ') || 'none'}</p></div>
      </article>)}
      <details><summary>Canonical stock movements</summary>{ledger.data?.movements.map(movement => <p className="xp-muted" key={movement.id}>{movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta} units · {movement.productId} · Owner {movement.ownerId} · Location {movement.locationId} · Source {movement.sourceEntityId} · Movement {movement.id}</p>)}</details>
    </Panel>
    <Panel title="Settlement obligations" eyebrow="Amount due ≠ payment receipt">
      <p className="xp-notice">Bayaran di sini ialah rekod manual founder dengan evidence. Status recorded by user tidak mendakwa bank atau payment provider telah mengesahkan transaksi.</p>
      {role === 'founder' && eligible.filter(record => record.ownership === 'consigned').map(record => {
        const used = new Set(ledger.data?.settlements.flatMap(settlement => settlement.sellThroughIds) ?? []);
        const sales = ledger.data?.entries.filter(entry => entry.restockId === record.id && entry.kind === 'sell_through' && !used.has(entry.id)) ?? [];
        return sales.length > 0 && <FormPanel key={`${record.id}:${record.revision}`} title={`Create settlement · ${record.id}`} description={`Unsettled sell-through: ${sales.length} · ${money(sales.reduce((sum, sale) => sum + sale.amountSen, 0))}. Jumlah diputuskan server daripada source events.`} fields={[field('evidenceIds', 'Settlement evidence IDs')]} submitLabel="Rekod amount due" onSubmit={async values => {
          const result = await api(`/dealer/restocks/${record.id}/settlements`, { method: 'POST', body: JSON.stringify({ expectedRevision: record.revision, sellThroughIds: sales.map(sale => sale.id), evidenceIds: splitRefs(values.evidenceIds) }) }); refresh(); return result;
        }} />;
      })}
      {ledger.data?.settlements.map(settlement => <SettlementCard key={settlement.id} settlement={settlement} role={role} refresh={refresh} />)}
      {!ledger.loading && !ledger.error && !ledger.data?.settlements.length && <Empty description="Settlement diwujudkan daripada sell-through yang direkod, bukan daripada stock dispatched." />}
      {ledger.data?.payments.map(payment => <article className="xp-dealer-card" key={payment.id}>
        <div><h3>Manual receipt · {money(payment.amountSen)}</h3><p>{payment.method} · {payment.reference}</p><RecordMeta id={payment.id} /><p className="xp-muted">Settlement {payment.settlementId} · Recorded by {payment.recordedBy} · {dateLabel(payment.createdAt)} · Evidence {payment.evidenceIds.join(', ')}</p></div><Status value={payment.state} />
      </article>)}
    </Panel>
    {role === 'founder' && <CommissionControls onChanged={refresh} />}
    <Panel title="Earned benefit statements" eyebrow="Confirmed eligible net payment · policy version">
      <p className="xp-form-description">Benefit ialah derivation bagi order attributed, fulfilled dan pembayaran confirmed, selepas refund. Enrollment tidak menghasilkan commission; derived amount belum dibayar.</p>
      <ResourceState {...benefits} />
      {benefits.data?.map(benefit => <article className="xp-dealer-card" key={benefit.id}>
        <div><h3>{money(benefit.amountSen)} · derived, not paid</h3><RecordMeta id={benefit.orderId} revision={benefit.orderRevision} /><p>Policy v{benefit.policyVersion} · {benefit.reasonCode}</p><p className="xp-muted">Payment {benefit.paymentId ?? 'unconfirmed'} · Policy {benefit.policyId ?? 'unapproved'} · {dateLabel(benefit.generatedAt)}</p></div><Status value={benefit.status} />
      </article>)}
      {!benefits.loading && !benefits.error && !benefits.data?.length && <Empty description="Tiada attributed order yang menghasilkan statement. Tiada sample earning dipaparkan." />}
    </Panel>
  </>;
}

function StockActions({ restock, refresh, renderEvidence }: { restock: RestockRecord; refresh: () => void; renderEvidence?: Props['renderEvidence'] }) {
  const [action, setAction] = useState<'sell-through' | 'returns' | ''>('');
  return <>
    <div className="xp-actions">{restock.ownership === 'consigned' && <button className="xp-button xp-secondary" onClick={() => setAction('sell-through')}>Rekod sell-through</button>}<button className="xp-button xp-secondary" onClick={() => setAction('returns')}>Request stock return</button></div>
    {renderEvidence?.(restock.id, refresh)}
    {action && <FormPanel key={`${action}:${restock.revision}`} title={action === 'sell-through' ? 'Record consignment sell-through' : 'Request return review'} description="Gunakan tally dan bukti sebenar. Server mengehadkan unit kepada stock diterima yang belum dijual atau dipegang oleh return lain." onCancel={() => setAction('')} fields={[
      field('productId', 'Stock product', { options: restock.lines.map(line => ({ value: line.productId, label: line.name })) }),
      field('quantity', 'Unit quantity', { type: 'number', min: 1, step: '1' }), field('evidenceIds', 'Stock evidence IDs'),
      field('reference', action === 'sell-through' ? 'Sell-through tally reference' : 'Return reason', { type: 'textarea' }),
    ]} submitLabel={action === 'sell-through' ? 'Rekod actual sell-through' : 'Hantar return request'} onSubmit={async values => {
      const result = await api(`/dealer/restocks/${restock.id}/${action}`, { method: 'POST', body: JSON.stringify({ expectedRevision: restock.revision, lines: [{ productId: values.productId, quantity: positiveQuantity(values.quantity) }], evidenceIds: splitRefs(values.evidenceIds), [action === 'sell-through' ? 'reference' : 'reason']: values.reference }) }); refresh(); setAction(''); return result;
    }} />}
  </>;
}

function ReturnReview({ record, role, refresh }: { record: DealerReturnRecord; role: WorkspaceRole; refresh: () => void }) {
  return <article className="xp-dealer-card"><div><h3>Return · {record.lines.map(line => `${line.name} × ${line.quantity}`).join(', ')}</h3><p>{record.reason}</p><RecordMeta id={record.id} revision={record.revision} /><Status value={record.status} />
    {record.receiptReason && <p>{record.receiptReason} · Evidence {record.receiptEvidenceIds?.join(', ')}</p>}
    {role === 'founder' && record.status === 'requested' && <FormPanel title="Review physical return" fields={[field('decision', 'Return decision', { options: [{ value: 'receive', label: 'Physically received → quarantine' }, { value: 'reject', label: 'Reject → release held stock' }] }), field('evidenceIds', 'Return receipt evidence IDs'), field('reason', 'Receipt / rejection reason', { type: 'textarea' })]} onSubmit={async values => {
      const result = await api(`/dealer/returns/${record.id}/${values.decision}`, { method: 'POST', body: JSON.stringify({ expectedRevision: record.revision, evidenceIds: splitRefs(values.evidenceIds), reason: values.reason }) }); refresh(); return result;
    }} />}
  </div></article>;
}

function SettlementCard({ settlement, role, refresh }: { settlement: DealerSettlement; role: WorkspaceRole; refresh: () => void }) {
  return <article className="xp-dealer-card"><div><h3>Settlement {settlement.id}</h3><p>Amount due {money(settlement.amountSen)} · Manual receipts {money(settlement.recordedPaidSen)} · Remaining {money(settlement.amountSen - settlement.recordedPaidSen)}</p><RecordMeta id={settlement.id} revision={settlement.revision} /><Status value={settlement.status} /><p className="xp-muted">Source sell-through {settlement.sellThroughIds.join(', ')} · Payment receipts {settlement.paymentIds.join(', ') || 'none'}</p>
    {role === 'founder' && settlement.recordedPaidSen < settlement.amountSen && <FormPanel title="Record manual settlement receipt" description="Founder mesti semak pembayaran sebenar dan evidence. Gambar resit sahaja tidak memberikan automatic bank verification." fields={[
      field('amount', 'Manual receipt amount (RM)', { type: 'text', placeholder: '0.00' }), field('method', 'Receipt method', { options: [{ value: 'cash', label: 'Cash · manually confirmed' }, { value: 'bank', label: 'Bank · manually checked by founder' }] }), field('reference', 'Actual payment reference'), field('evidenceIds', 'Manual payment evidence IDs'), field('confirmation', 'Founder attestation', { options: [{ value: 'manual_confirmed_receipt', label: 'Saya telah menyemak penerimaan sebenar' }] }),
    ]} submitLabel="Rekod manual receipt" onSubmit={async values => {
      const result = await api(`/dealer/settlements/${settlement.id}/payments`, { method: 'POST', body: JSON.stringify({ expectedRevision: settlement.revision, amountSen: amountToSen(values.amount), method: values.method, reference: values.reference, evidenceIds: splitRefs(values.evidenceIds), confirmation: values.confirmation }) }); refresh(); return result;
    }} />}
  </div></article>;
}

function CommissionControls({ onChanged }: { onChanged: () => void }) {
  const policies = useResource<CommissionPolicy[]>('/dealer/commission-policies');
  const products = useResource<PublicProduct[]>('/catalogue');
  const version = Math.max(0, ...(policies.data?.map(policy => policy.version) ?? []));
  return <Panel title="Commission policy register" eyebrow="Founder approved · versioned">
    <ResourceState {...policies} />{policies.data?.map(policy => <p key={policy.id}>Policy v{policy.version} · {policy.rateBasisPoints / 100}% · Products {policy.eligibleProductIds.join(', ')} · Approved {dateLabel(policy.approvedAt)}</p>)}
    <ResourceState {...products} />{products.data?.map(product => <p className="xp-muted" key={product.id}>{product.name} · {product.id}</p>)}
    {!policies.loading && !policies.error && <FormPanel key={version} title="Approve commission policy" description="Polisi baharu dipakai kepada confirmed payment selepas approval. Existing statements kekal berasaskan policy pada masa payment." fields={[field('eligibleProductIds', 'Eligible published product IDs', { type: 'textarea', help: 'Salin IDs daripada senarai produk di atas, dipisahkan dengan koma.' }), field('rateBasisPoints', 'Commission basis points (100 = 1%)', { type: 'number', min: 0, max: 10000, step: '1' })]} submitLabel="Approve versioned policy" onSubmit={async values => {
      const rateBasisPoints = Number(values.rateBasisPoints);
      if (!/^\d+$/.test(values.rateBasisPoints) || !Number.isSafeInteger(rateBasisPoints) || rateBasisPoints < 0 || rateBasisPoints > 10000) throw new Error('Rate mesti integer antara 0 dan 10000 basis points.');
      const result = await api('/dealer/commission-policies', { method: 'POST', body: JSON.stringify({ expectedVersion: version, eligibleProductIds: splitRefs(values.eligibleProductIds), rateBasisPoints }) }); policies.reload(); onChanged(); return result;
    }} />}
  </Panel>;
}
