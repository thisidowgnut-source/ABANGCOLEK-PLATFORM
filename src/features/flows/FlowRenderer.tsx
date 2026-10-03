import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, MessageSquare, Package, ShieldCheck } from 'lucide-react';
import type { FlowDefinition, FlowSession, PublicProduct, SafeDraft,OrderRecord } from '../../../shared/platform-contracts';
import { api, jsonMutation, useResource } from '../platform/client';
import { usePlatformSession } from '../platform/AppRouter';
import { readOfflineDraft, saveOfflineDraft } from '../platform/offlineDrafts';
import './flows.css';
import { lineAnswers } from './flow-answers';
import { FlowForm } from './FlowForm';

const money = (sen: number) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(sen / 100);
const labels: Record<string,string> = { lines: 'Produk & kuantiti', catalogueVersion: 'Versi katalog', fulfilment: 'Cara terima', contactRef: 'Maklumat penerimaan', orderId: 'Pesanan', subject: 'Tajuk aduan', description: 'Penerangan', organization: 'Nama bisnes', quoteId: 'Quote restock', shipmentId: 'Restock shipment' };

export default function FlowRenderer({ slug, onNavigate }: { slug: string; onNavigate: (path: string) => void }) {
  const { session: identity } = usePlatformSession();
  const definition = useResource<FlowDefinition>(`/flows/${encodeURIComponent(slug)}`);
  const catalogue = useResource<PublicProduct[]>('/catalogue');
  const orders=useResource<OrderRecord[]>('/orders');
  const [flow, setFlow] = useState<FlowSession | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [value, setValue] = useState(''); const [quantity, setQuantity] = useState(1);
  const [optIn, setOptIn] = useState(false); const [saved, setSaved] = useState(false);
  const [formMode, setFormMode] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = definition.data?.nodes.find(node => node.id === flow?.currentNode);
  const key = `abangcolek-flow-session:${identity?.user.id ?? ''}:${slug}`;
  const submitKey = useRef(crypto.randomUUID());
  const restoredDraft = useRef<SafeDraft | null>(null);
  useEffect(() => {
    let active = true;
    setFlow(null); setError(''); setSaved(false); restoredDraft.current = null; submitKey.current = crypto.randomUUID();
    try {
      const id = sessionStorage.getItem(key);
      if (id) void api<FlowSession>(`/flow-sessions/${encodeURIComponent(id)}`).then(result => {
        if (!active || result.status === 'expired') return;
        const offline = identity ? readOfflineDraft(localStorage, identity.user.id, slug) : null;
        if (offline && offline.version === result.version && result.status === 'draft') {
          restoredDraft.current = offline; setOptIn(true); setSaved(true);
        }
        setFlow(result);
      }).catch(() => { if (active) sessionStorage.removeItem(key); });
    } catch { /* A flow can still be completed without browser persistence. */ }
    return () => { active = false; };
  }, [key]);
  useEffect(() => {
    if (!flow || !current) return;
    const draft = restoredDraft.current?.version === flow.version ? restoredDraft.current : null;
    const answer = current.field ? draft?.answers[current.field] ?? flow.answers[current.field] : undefined;
    const preferred = new URLSearchParams(window.location.search).get('product');
    if (current.field === 'lines') {
      const line = Array.isArray(answer) ? answer[0] as {productId?:string;quantity?:number} : null;
      setValue(line?.productId ?? preferred ?? catalogue.data?.find(product => product.availableQuantity > 0)?.id ?? ''); setQuantity(line?.quantity ?? 1);
    } else setValue(typeof answer === 'string' || typeof answer === 'number' ? String(answer) : '');
    heading.current?.focus();
  }, [flow?.currentNode, flow?.revision, catalogue.data]);
  async function start() {
    if (!definition.data) return;
    setBusy(true); setError('');
    try {
      const next = await api<FlowSession>('/flow-sessions', jsonMutation({ flowId: definition.data.id }));
      const offline = identity ? readOfflineDraft(localStorage, identity.user.id, slug) : null;
      if (offline && offline.version === definition.data.version) { restoredDraft.current = offline; setOptIn(true); setSaved(true); }
      setFlow(next); try { sessionStorage.setItem(key, next.id); } catch { /* Server receipt still exists. */ }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Flow tidak tersedia.'); }
    finally { setBusy(false); }
  }
  async function move(operation: 'advance' | 'back' | 'review' | 'submit' | 'form', answers?: Record<string,unknown>) {
    if (!flow) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const next = await api<FlowSession>(`/flow-sessions/${flow.id}/${operation}`, { ...jsonMutation({ expectedRevision: flow.revision, ...(answers ? { answers } : {}) }), ...(operation === 'submit' ? { headers: { 'Idempotency-Key': submitKey.current } } : {}) });
      if(restoredDraft.current&&answers){
        const pending={...restoredDraft.current.answers};for(const field of Object.keys(answers))delete pending[field];
        restoredDraft.current={...restoredDraft.current,answers:pending};
      }
      setFlow(next);
      if(operation==='form')setFormMode(false);
      if (identity && optIn && next.status === 'draft') setSaved(saveOfflineDraft(localStorage, identity.user.id, { flowId: slug, version: next.version, answers: {...next.answers,...restoredDraft.current?.answers}, updatedAt: new Date().toISOString(), expiresAt: next.expiresAt }, true));
      if (next.status === 'submitted') { restoredDraft.current = null; try { sessionStorage.removeItem(key); if (identity) localStorage.removeItem(`abangcolek-private-draft:${encodeURIComponent(identity.user.id)}:${encodeURIComponent(slug)}`); } catch { /* Receipt is authoritative. */ } }
    } catch (reason) {
      if (identity && optIn && answers) setSaved(saveOfflineDraft(localStorage, identity.user.id, { flowId: slug, version: flow.version, answers: { ...flow.answers,...restoredDraft.current?.answers, ...answers }, updatedAt: new Date().toISOString(), expiresAt: flow.expiresAt }, true));
      setError(reason instanceof Error ? reason.message : 'Request belum disahkan.');
    } finally { setBusy(false); }
  }
  function answer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!current?.field) { void move('advance', {}); return; }
    if (current.field === 'lines') {
      const chosen = catalogue.data?.find(product => product.id === value);
      if (!chosen || !Number.isSafeInteger(quantity) || quantity <= 0) { setError('Pilih produk diterbitkan dan kuantiti yang sah.'); return; }
      try { void move('advance', lineAnswers(definition.data!.intent, chosen, quantity)); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Kuantiti tidak sah.'); }
    } else if (current.field === 'expectedRevision') {
      const revision = Number(value); if (!Number.isSafeInteger(revision) || revision < 1) { setError('Versi penghantaran mesti integer positif.'); return; }
      void move('advance', { expectedRevision: revision });
    } else void move('advance', { [current.field]: value });
  }
  const index = definition.data?.nodes.findIndex(node => node.id === current?.id) ?? 0;
  const completed = flow?.status === 'submitted';
  return <main id="platform-main" className="flow-page">
    <div className="flow-heading"><span className="platform-eyebrow"><MessageSquare size={16} />ABANGCOLEK GUIDED FLOW</span><h1>{definition.data?.title ?? 'Sambung urusan anda'}</h1><p>Pilih, semak dan hantar. Setiap permintaan membawa receipt yang boleh dirujuk.</p></div>
    {definition.loading && <p role="status">Memuatkan definisi flow…</p>}
    {definition.error && <p role="alert" className="platform-alert">{definition.error}<button onClick={definition.reload}>Cuba semula</button></p>}
    {definition.data && !flow && <section className="flow-intro"><span className="flow-icon"><ShieldCheck size={32} /></span><h2>Urusan lebih mudah, langkah demi langkah.</h2><p>Jawapan disemak terhadap versi produk dan polisi semasa. Anda boleh kembali sebelum submit.</p><div><span>Web / PWA</span><span>Semak sebelum hantar</span><span>Receipt dalam portal</span></div><button className="platform-primary" disabled={busy} onClick={start}>{busy ? 'Membuka flow…' : 'Mulakan flow'}<ArrowRight size={18}/></button></section>}
    {flow && definition.data && !completed && <>
      <div className="flow-progress" aria-label={`Langkah ${index + 1} daripada ${definition.data.nodes.length}`}><span style={{ width: `${Math.max(8, (index + 1) / definition.data.nodes.length * 100)}%` }}/></div>
      <div className="flow-step-info"><span>Langkah {index + 1} · v{flow.version}</span><button className="platform-text-button" onClick={() => setFormMode(value => !value)}>{formMode ? 'Paparan perbualan' : 'Paparan form'}</button></div>
      {catalogue.hasMore&&<button className="platform-text-button" onClick={()=>void catalogue.loadMore()} disabled={catalogue.loadingMore}>Muat lagi produk</button>}
      {orders.hasMore&&definition.data.intent==='complaint'&&<button className="platform-text-button" onClick={()=>void orders.loadMore()} disabled={orders.loadingMore}>Muat lagi pesanan</button>}
      {formMode?<FlowForm definition={definition.data} flow={flow} products={catalogue.data??[]} orders={orders.data??[]} busy={busy} onReview={answers=>move('form',answers)}/>:<section className="flow-card"><h2 ref={heading} tabIndex={-1}>{current?.label ?? 'Semak urusan'}</h2>
        {current?.kind === 'review' ? <><p className="flow-muted">Semak maklumat. Harga dan availability disahkan semula oleh server sebelum receipt dikeluarkan.</p><dl className="flow-review">{Object.entries(flow.answers).map(([field, answer]) => <div key={field}><dt>{labels[field] ?? field}</dt><dd>{field === 'lines' && Array.isArray(answer) ? answer.map((line: {productId:string;quantity:number}) => `${catalogue.data?.find(product => product.id === line.productId)?.name ?? line.productId} × ${line.quantity}`).join(', ') : typeof answer === 'object' ? JSON.stringify(answer) : String(answer)}</dd></div>)}</dl><button className="platform-primary" disabled={busy} onClick={() => void move(flow.reviewVersion === undefined ? 'review' : 'submit')}>{busy ? 'Mengesahkan…' : flow.reviewVersion === undefined ? 'Sahkan semakan server' : 'Hantar permintaan'}{flow.reviewVersion === undefined ? <ShieldCheck size={18}/> : <Check size={18}/>}</button></> : <form onSubmit={answer}>
          {current?.field === 'lines' ? <><label>Produk<select value={value} onChange={event => setValue(event.target.value)} required><option value="">Pilih produk</option>{catalogue.data?.map(product => <option key={product.id} value={product.id} disabled={definition.data?.intent !== 'stock_receipt' && product.availableQuantity < 1}>{product.name} · {money(product.priceSen)} · {product.availableQuantity} unit tersedia</option>)}</select></label><label>Kuantiti<input type="number" value={quantity} min={1} step={1} required onChange={event => setQuantity(Number(event.target.value))}/></label>{!catalogue.loading && !catalogue.data?.length && <p className="flow-muted">Katalog belum diterbitkan. Tiada harga atau stok contoh digunakan.</p>}</> : current?.kind === 'choice' ? <fieldset><legend className="sr-only">{current.label}</legend><div className="flow-options">{current.options?.map(option => <label key={option.value} className={value === option.value ? 'is-selected' : ''}><input type="radio" name="answer" value={option.value} checked={value === option.value} onChange={() => setValue(option.value)} required/><span>{option.label}</span>{value === option.value && <CheckCircle2 size={19}/>}</label>)}</div></fieldset> : <label>{current?.label ?? 'Jawapan'}{current?.field === 'description' || current?.field === 'contactRef' ? <textarea value={value} onChange={event => setValue(event.target.value)} required={current.required} maxLength={current.maxLength ?? 4000} rows={5}/> : <input value={value} onChange={event => setValue(event.target.value)} required={current?.required} maxLength={current?.maxLength ?? 500}/>}</label>}
          <button className="platform-primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Teruskan'}<ArrowRight size={18}/></button>
        </form>}
      </section>}
      {!formMode&&current?.kind==='review'&&flow.reviewQuote&&<section className="flow-card" aria-label="Harga disahkan server"><h3>Semakan harga</h3><dl className="flow-review">{flow.reviewQuote.lines.map(line=><div key={line.productId}><dt>{line.name} × {line.quantity}</dt><dd>{money(line.priceSen*line.quantity)}</dd></div>)}<div><dt>Jumlah produk</dt><dd><strong>{money(flow.reviewQuote.totalSen)}</strong></dd></div></dl><p className="flow-muted">Quote {flow.reviewQuote.id} · Katalog v{flow.reviewQuote.catalogueVersion}. Caj penghantaran belum ditentukan dan tidak termasuk.</p></section>}
      {current?.id !== definition.data.entry && <button className="platform-text-button" disabled={busy} onClick={() => void move('back')}><ArrowLeft size={16}/>Kembali satu langkah</button>}
      <label className="flow-offline-option"><input type="checkbox" checked={optIn} onChange={event => setOptIn(event.target.checked)}/><span>Simpan draft pada device ini jika offline. Elakkan pada telefon yang dikongsi.</span></label>
      <p className="flow-muted">Draft bukan receipt. ID sesi: {flow.id}</p>
    </>}
    {completed && <section className="flow-receipt"><span className="flow-icon"><CheckCircle2 size={38}/></span><p className="platform-eyebrow">SERVER RECEIPT</p><h2>Permintaan telah diterima.</h2><p>Rekod: <strong>{flow.receipt?.entityId}</strong></p><p className="flow-muted">{flow.receipt?.submittedAt ? new Date(flow.receipt.submittedAt).toLocaleString('ms-MY') : ''} · Status pembayaran/fulfilment disemak berasingan.</p><button className="platform-primary" onClick={() => { const role = identity?.memberships.some(membership => membership.role === 'customer' && membership.status === 'active') ? 'customer' : 'founder'; const section = definition.data?.intent === 'complaint' ? 'cases' : definition.data?.intent === 'dealer_application' || definition.data?.intent === 'restock' || definition.data?.intent === 'stock_receipt' ? role === 'founder' ? 'dealers' : 'business' : 'orders'; onNavigate(`/${role}/${section}`); }}>Buka rekod saya<ArrowRight size={18}/></button></section>}
    {error && <p className="platform-alert" role="alert">{error}</p>}{saved && <p role="status" className="flow-muted">Draft tersimpan pada device ini; belum diterima server.</p>}
    <footer className="flow-footer"><Package size={16}/><span>Guided web flow ABANGCOLEK. Penghantaran WhatsApp, jika diperlukan, disemak berasingan.</span></footer>
  </main>;
}
