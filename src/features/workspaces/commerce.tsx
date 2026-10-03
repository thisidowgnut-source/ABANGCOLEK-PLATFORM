import { useEffect,useState } from 'react';
import { ArrowRight,Box,Package,ShoppingBag,Truck } from 'lucide-react';
import type { CatalogueProduct,DealerApplication,DealerTerms,InventoryMovement,OrderRecord,PublicProduct,RestockRecord,SessionData,StockLot,VersionedQuote,WorkspaceRole } from '../../../shared/platform-contracts';
import { api,useResource } from '../platform/client';
import { DealerLedger } from './DealerLedger';
import { amountToSen,dateLabel,money,nextFulfilment,positiveQuantity } from './experience-model';
import { Empty,field,FormPanel,MutationButton,Panel,RecordMeta,Refresh,ResourceState,SearchBox,splitRefs,Status } from './ui';

export function Shop({ onNavigate }: { onNavigate: (path: string) => void; }) {
  const resource=useResource<PublicProduct[]>('/catalogue');
  return <Panel title="Pilih colek anda" eyebrow="Published catalogue" action={<Refresh onClick={resource.reload} />}>
    <ResourceState {...resource} />
    <div className="xp-product-grid">{resource.data?.map(product => <article className="xp-product" key={product.id}>
      <div className="xp-product-art">
        <Package size={50} strokeWidth={1} />
        <span>ABANG<br />COLEK</span>
      </div>
      <p className="xp-eyebrow">Pack {product.packSize} · Version {product.publishedVersion}</p>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="xp-product-footer">
        <strong>{money(product.priceSen)}</strong>
        <Status value={product.availableQuantity>0? 'available':'out_of_stock'} />
      </div>
      <button className="xp-button" disabled={product.availableQuantity<1} onClick={() => onNavigate(`/flows/order?product=${encodeURIComponent(product.id)}`)}>Beli sekarang <ArrowRight size={17} />
      </button>
    </article>)}</div>{!resource.loading&&!resource.error&&!resource.data?.length&&<Empty title="Katalog belum diterbitkan" description="Founder perlu mengesahkan produk, harga dan stok sebelum pesanan boleh dibuat." />}</Panel>;
}
export function Orders({ role,onChanged,entityId }: { entityId?:string;role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<OrderRecord[]>('/orders');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState<OrderRecord|null>(null);
  const [deepError,setDeepError]=useState('');
  useEffect(()=>{if(!entityId)return;const controller=new AbortController();api<OrderRecord>('/orders/'+encodeURIComponent(entityId),{signal:controller.signal}).then(setSelected).catch(error=>{if(!controller.signal.aborted)setDeepError(error instanceof Error?error.message:'Rekod tidak tersedia.');});return()=>controller.abort();},[entityId]);
  const refresh=() => { resource.reload(); setSelected(null); onChanged?.(); };
  const orders=resource.data?.filter(order => `${order.id} ${order.lines.map(line => line.name).join(' ')} ${order.fulfilmentStatus}`.toLowerCase().includes(search.toLowerCase()))??[];
  return <>
    {deepError&&<p role="alert" className="platform-alert">{deepError}</p>}<Panel title={role==='customer'? 'Pesanan saya':'Order & fulfilment'} eyebrow="One order, one timeline" action={<Refresh onClick={refresh} />}>
      <ResourceState {...resource} />
      <div className="xp-toolbar">
        <SearchBox value={search} onChange={setSearch} />
        <span className="xp-muted">{orders.length} rekod</span>
      </div>
      <div className="xp-record-list">{orders.map(order => <button className={`xp-record-button ${selected?.id===order.id? 'xp-selected':''}`} key={order.id} onClick={() => setSelected(order)}>
        <span className="xp-record-icon">
          <ShoppingBag size={22} />
        </span>
        <span className="xp-record-main">
          <strong>{order.lines.map(line => `${line.name} × ${line.quantity}`).join(', ')}</strong>
          <span>{order.id} · {dateLabel(order.createdAt)}</span>
        </span>
        <span className="xp-record-end">
          <strong>{money(order.amountSen)}</strong>
          <Status value={order.fulfilmentStatus} />
        </span>
      </button>)}</div>{!resource.loading&&!resource.error&&!orders.length&&<Empty description={search? 'Tiada rekod sepadan dengan carian.':'Pesanan yang disahkan server akan muncul di sini.'} />}</Panel>{selected&&<OrderDetail key={`${selected.id}:${selected.revision}`} order={selected} role={role} refresh={refresh} />}</>;
}
function OrderDetail({ order,role,refresh }: { order: OrderRecord; role: WorkspaceRole; refresh: () => void; }) {
  const next=nextFulfilment(order.fulfilmentStatus,order.paymentState,role);
  const [tab,setTab]=useState('summary');
  return <Panel title={`Pesanan ${order.id}`} eyebrow="Order detail">
    <RecordMeta id={order.id} revision={order.revision} />
    <div className="xp-tablist" aria-label="Maklumat pesanan">{['summary','payment','evidence'].map(item => <button className={tab===item? 'xp-tab-active':''} key={item} onClick={() => setTab(item)}>{item==='summary'? 'Ringkasan':item==='payment'? 'Pembayaran':'Bukti'}</button>)}</div>{tab==='summary'&&<>
      <div className="xp-detail-grid">
        <div>
          <span className="xp-muted">Fulfilment</span>
          <p>
            <Status value={order.fulfilmentStatus} />
          </p>
          <p>{order.fulfilment} · Outlet {order.outletId}</p>
        </div>
        <div>
          <span className="xp-muted">Payment</span>
          <p>
            <Status value={order.paymentState} />
          </p>
          <p>{money(order.paidAmountSen)} verified · {money(order.refundAmountSen)} refunded</p>
        </div>
        <div>
          <span className="xp-muted">Contact / delivery reference</span>
          <p>{order.contactRef}</p>
        </div>
      </div>
      <ol className="xp-timeline">{(['requested','accepted','packing','packed','dispatched','received'] as const).map((status,index) => <li key={status} className={['requested','accepted','packing','packed','dispatched','received'].indexOf(order.fulfilmentStatus)>=index? 'xp-timeline-done':''}>
        <span>{index+1}</span>{status}</li>)}</ol>{next&&<FormPanel title={`Teruskan ke ${next}`} fields={[field('evidenceIds','Evidence IDs',{ required: false,help: 'IDs bukti yang telah dimuat naik, pisahkan dengan koma. Dispatch dan penerimaan memerlukan bukti.' })]} submitLabel={`Sahkan ${next}`} onSubmit={async values => { const result=await api(`/orders/${order.id}/transition`,{ method: 'POST',body: JSON.stringify({ expectedRevision: order.revision,next,evidenceIds: splitRefs(values.evidenceIds) }) }); refresh(); return result; }} />}</>}{tab==='payment'&&<>
          <p className="xp-notice">Resit ialah bukti untuk semakan. Hanya pengesahan authorized operator mengubah status pembayaran.</p>{role==='founder'? <FormPanel title="Semakan bayaran" description="Semak sumber bank/cash sebenar sebelum verify. Refund memerlukan amaun dan bukti tersendiri." fields={[field('action','Tindakan',{ options: [{ value: 'verify',label: 'Verify payment' },{ value: 'reject',label: 'Reject evidence' },{ value: 'request_refund',label: 'Request refund' },{ value: 'refund',label: 'Record refund' }] }),field('amount','Amaun (RM)',{ type: 'number',min: 0.01,step: '0.01',defaultValue: String((order.amountSen-order.paidAmountSen)/100) }),field('method','Sumber',{ options: [{ value: 'bank',label: 'Bank statement' },{ value: 'cash',label: 'Cash received' }] }),field('reference','Reference sumber sebenar'),field('evidenceIds','Evidence IDs',{ required: false })]} submitLabel="Sahkan keputusan bayaran" onSubmit={async values => { const result=await api(`/orders/${order.id}/payment`,{ method: 'POST',body: JSON.stringify({ expectedRevision: order.revision,action: values.action,amountSen: amountToSen(values.amount),method: values.method,reference: values.reference,evidenceIds: splitRefs(values.evidenceIds) }) }); refresh(); return result; }} />:<div className="xp-detail-grid">
            <p>Verified: <strong>{money(order.paidAmountSen)}</strong>
            </p>
            <p>Refunded: <strong>{money(order.refundAmountSen)}</strong>
            </p>
          </div>}</>}{tab==='evidence'&&<EvidenceUpload entityId={order.id} onChanged={refresh} />}</Panel>;
}
export function EvidenceUpload({ entityId,onChanged }: { entityId: string; onChanged: () => void; }) {
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const evidence=useResource<{ id: string; name: string; kind: string; createdAt: string; downloadUrl?: string; }[]>(`/evidence?entityId=${encodeURIComponent(entityId)}`);
  async function upload() {
    if(!file||busy) return; setMessage('');
    if(file.size>10*1024*1024) { setMessage('Fail maksimum 10 MB.'); return; }
    setBusy(true);
    try {
      const form=new FormData(); form.append('entityId',entityId); form.append('file',file);
      const saved=await api<{ id: string; }>('/evidence/upload',{ method: 'POST',body: form }); setMessage(`Bukti disimpan · ${saved.id}`); evidence.reload(); onChanged();
    }
    catch(failure) { setMessage(failure instanceof Error? failure.message:'Upload gagal.'); }
    finally { setBusy(false); }
  }
  return <div className="xp-evidence">
    <h3>Bukti / attachments</h3>
    <p className="xp-muted">Gambar atau PDF. Bukti disimpan secara private; upload tidak mengesahkan payment atau QC.</p>
    <label className="xp-field">
      <span>Pilih fail</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => setFile(event.target.files?.[0]??null)} />
    </label>
    <button className="xp-button xp-secondary" disabled={!file||busy} onClick={upload}>{busy? 'Memuat naik…':'Muat naik bukti'}</button>{message&&<p role="status" className="xp-notice">{message}</p>}<ResourceState {...evidence} />{evidence.data?.map(item => <p className="xp-evidence-item" key={item.id}>
      <strong>{item.name}</strong>
      <code>{item.id}</code>
      <Status value={item.kind} />{item.downloadUrl?.startsWith('/api/platform/evidence/')&&<a className="xp-button xp-secondary" href={item.downloadUrl} download>Download file</a>}</p>)}</div>;
}
export function Inventory({ role,onChanged }: { role: WorkspaceRole; onChanged?: () => void; }) {
  const resource=useResource<{ lots: StockLot[]; movements: InventoryMovement[]; }>('/inventory');
  const catalogue=useResource<CatalogueProduct[]>(role==='founder'? '/catalogue/admin':'/catalogue');
  const [create,setCreate]=useState(false);
  const [productForm,setProductForm]=useState<CatalogueProduct|'new'|null>(null);
  const refresh=() => { resource.reload(); catalogue.reload(); onChanged?.(); };
  return <>
    <Panel title="Stok, batch & custody" eyebrow="Canonical inventory ledger" action={<div className="xp-actions">
      <Refresh onClick={refresh} />{role==='founder'&&<button className="xp-button" onClick={() => setCreate(!create)}>Receive stock</button>}</div>}>
      <ResourceState {...resource} />
      <div className="xp-stat-row">
        <div>
          <Box size={20} />
          <strong>{resource.data?.lots.filter(lot => lot.status==='available').reduce((sum,lot) => sum+lot.quantity,0)??'—'}</strong>
          <span>Available physical units</span>
        </div>
        <div>
          <Package size={20} />
          <strong>{resource.data?.lots.filter(lot => lot.status==='quarantine').reduce((sum,lot) => sum+lot.quantity,0)??'—'}</strong>
          <span>Quarantined units</span>
        </div>
        <div>
          <Truck size={20} />
          <strong>{resource.data?.movements.length??'—'}</strong>
          <span>Ledger movements</span>
        </div>
      </div>
      <div className="xp-record-list">{resource.data?.lots.map(lot => <article className="xp-stock-card" key={lot.id}>
        <div>
          <h3>{catalogue.data?.find(product => product.id===lot.productId)?.name??lot.productId}</h3>
          <p>{lot.batchId? `Batch ${lot.batchId}`:'Batch belum direkod'} · {lot.locationId}</p>
          <RecordMeta id={lot.id} revision={lot.revision} />
        </div>
        <div>
          <strong className="xp-large-number">{lot.quantity}</strong>
          <Status value={lot.status} />
        </div>
        <p className="xp-muted">Owner {lot.ownerId} · Custodian {lot.custodyId}</p>
        <StockCommand lot={lot} refresh={refresh} role={role} />
      </article>)}</div>{!resource.loading&&!resource.error&&!resource.data?.lots.length&&<Empty description="Terima stok sebenar untuk membuka ledger. Nombor stok tidak boleh diedit tanpa movement." />}<details className="xp-details">
        <summary>Movement history</summary>{resource.data?.movements.map(movement => <div className="xp-list-row" key={movement.id}>
          <span>{movement.productId} · {movement.locationId}</span>
          <strong>{movement.quantityDelta>0? '+':''}{movement.quantityDelta}</strong>
          <span>{dateLabel(movement.createdAt)}</span>
        </div>)}</details>
    </Panel>{create&&<FormPanel title="Rekod penerimaan stok" description="Setiap receipt menghasilkan movement yang disimpan. Gunakan quarantine sehingga QC yang diperlukan selesai." fields={[field('productId','Produk',{ options: catalogue.data?.map(product => ({ value: product.id,label: product.name }))??[] }),field('locationId','Outlet / lokasi'),field('quantity','Kuantiti unit',{ type: 'number',min: 1,step: '1' }),field('batchId','Batch ID',{ required: false }),field('status','Keadaan stok',{ defaultValue: 'quarantine',options: ['available','quarantine','damaged'].map(value => ({ value,label: value })) }),field('reason','Sebab / receiving reference',{ type: 'textarea' })]} onCancel={() => setCreate(false)} onSubmit={async values => { const result=await api('/inventory/receive',{ method: 'POST',body: JSON.stringify({ ...values,ownerId: 'business',quantity: positiveQuantity(values.quantity) }) }); refresh(); return result; }} />}<Panel title="Produk & harga" eyebrow="Versioned catalogue" action={role==='founder'&&<button className="xp-button xp-secondary" onClick={() => setProductForm('new')}>Tambah produk</button>}>
      <ResourceState {...catalogue} />{catalogue.data?.map(product => <article className="xp-list-row" key={product.id}>
        <div>
          <strong>{product.name}</strong>
          <p>{money(product.priceSen)} · Pack {product.packSize} · v{product.publishedVersion}</p>
        </div>
        <Status value={product.status??'published'} />{role==='founder'&&<button className="xp-button xp-secondary" onClick={() => setProductForm(product)}>Edit / publish</button>}</article>)}{!catalogue.loading&&!catalogue.error&&!catalogue.data?.length&&<Empty description="Tiada produk diterbitkan. Harga, pack size dan deskripsi memerlukan kelulusan founder." />}</Panel>{productForm&&<FormPanel key={typeof productForm==='string'? 'new':productForm.id} title={typeof productForm==='string'? 'Produk baharu':'Edit produk'} fields={[field('name','Nama produk',{ defaultValue: typeof productForm!=='string'? productForm.name:'' }),field('description','Deskripsi disahkan',{ type: 'textarea',defaultValue: typeof productForm!=='string'? productForm.description:'' }),field('price','Harga / unit (RM)',{ type: 'number',min: .01,step: '.01',defaultValue: typeof productForm!=='string'? String(productForm.priceSen/100):'' }),field('packSize','Pack size',{ type: 'number',min: 1,step: '1',defaultValue: typeof productForm!=='string'? String(productForm.packSize):'1' }),field('publish','Publication',{ options: [{ value: 'false',label: 'Simpan draft' },{ value: 'true',label: 'Publish harga & produk' }],defaultValue: 'false' })]} onCancel={() => setProductForm(null)} onSubmit={async values => { const result=await api('/catalogue',{ method: 'POST',body: JSON.stringify({ id: typeof productForm!=='string'? productForm.id:undefined,expectedRevision: typeof productForm!=='string'? productForm.revision:undefined,name: values.name,description: values.description,priceSen: amountToSen(values.price),packSize: positiveQuantity(values.packSize),publish: values.publish==='true' }) }); refresh(); return result; }} />}</>;
}

function StockCommand({ lot,refresh,role }: { lot: StockLot; refresh: () => void; role: WorkspaceRole; }) {
  const [action,setAction]=useState('');
  return <div className="xp-stock-commands">
    <div className="xp-actions">
      <button className="xp-button xp-secondary" onClick={() => setAction('transfer')}>Transfer units</button>
      <button className="xp-button xp-secondary" onClick={() => setAction('quarantine')}>Damage / quarantine</button>{role==='founder'&&<button className="xp-button xp-secondary" onClick={() => setAction('adjust')}>Physical count adjustment</button>}</div>{action&&<FormPanel key={`${lot.id}:${action}:${lot.revision}`} title={action==='adjust'? 'Reconcile physical count':action==='transfer'? 'Transfer custody location':'Hold stock for review'} description="Setiap perubahan menyimpan reason, actor dan ledger movement. Reserved units dilindungi server." fields={[...(action==='transfer'? [field('locationId','Destination location'),field('quantity','Units to transfer',{ type: 'number',min: 1,step: '1' })]:action==='adjust'? [field('quantity','Actual total units counted',{ type: 'number',min: 0,step: '1',defaultValue: String(lot.quantity) })]:[field('status','Hold status',{ options: [{ value: 'quarantine',label: 'Quarantine · investigation required' },{ value: 'damaged',label: 'Damaged · unavailable' }] })]),field('reason','Reason / physical evidence reference',{ type: 'textarea' })]} onCancel={() => setAction('')} submitLabel="Sahkan stock movement" onSubmit={async values => {
        const quantity=values.quantity!=null? Number(values.quantity):undefined; if(quantity!=null&&(!Number.isSafeInteger(quantity)||quantity<(action==='adjust'? 0:1))) throw new Error('Kuantiti unit tidak sah.');
        const result=await api(`/inventory/${lot.id}/${action}`,{ method: 'POST',body: JSON.stringify({ ...values,...(quantity!=null? { quantity }:{}),expectedRevision: lot.revision }) }); setAction(''); refresh(); return result;
      }} />}</div>;
}
export function Dealers({ role,onNavigate,onChanged }: { role: WorkspaceRole; onNavigate: (path: string) => void; onChanged?: () => void; }) {
  const applications=useResource<DealerApplication[]>('/dealer/applications');
  const restocks=useResource<RestockRecord[]>('/dealer/restocks');
  const settings=useResource<{ approvedPolicies: { dealer?: DealerTerms; }; }>('/settings');
  const session=useResource<SessionData>('/session');
  const refresh=() => { applications.reload(); restocks.reload(); onChanged?.(); };
  const terms=settings.data?.approvedPolicies.dealer;
  return <>
    <Panel title={role==='founder'? 'Dealer approvals':'Ruang bisnes anda'} eyebrow="Ejen · stokis · B2B" action={<Refresh onClick={refresh} />}>
      <p className="xp-form-description">Permohonan dan restock berkongsi rekod yang sama. Akses B2B bermula selepas membership diluluskan.</p>{role==='customer'&&<div className="xp-actions">
        <button className="xp-button" onClick={() => onNavigate('/flows/dealer-application')}>Mohon ejen / stokis <ArrowRight size={16} />
        </button>
        <button className="xp-button xp-secondary" onClick={() => onNavigate('/flows/restock')} disabled={!session.data?.memberships.some(member => member.dealerOrgId&&member.status==='active')}>Restock</button>
      </div>}<ResourceState {...applications} />{applications.data?.map(application => <article className="xp-dealer-card" key={application.id}>
        <div>
          <h3>{application.organization}</h3>
          <p>{application.description}</p>
          <RecordMeta id={application.id} revision={application.revision} />
        </div>
        <Status value={application.status} />{role==='founder'&&application.status==='pending'&&<div className="xp-actions">
          <MutationButton path={`/dealer/applications/${application.id}/approve`} input={{ expectedRevision: application.revision }} onChanged={refresh} confirmLabel="Sahkan membership B2B" disabled={!terms}>Approve dealer</MutationButton>
          <MutationButton path={`/dealer/applications/${application.id}/reject`} input={{ expectedRevision: application.revision,reason: 'Permohonan tidak memenuhi polisi semasa.' }} onChanged={refresh} confirmLabel="Sahkan reject">Reject</MutationButton>
        </div>}</article>)}{!applications.loading&&!applications.error&&!applications.data?.length&&<Empty description="Permohonan dealer muncul selepas customer menghantar borang." />}</Panel>
    <Panel title="Approved commercial terms" eyebrow="Policy version">{terms? <div className="xp-detail-grid">
      <div>
        <span className="xp-muted">MOQ / pack multiple</span>
        <h3>{terms.minimumQuantity} / {terms.packMultiple}</h3>
      </div>
      <div>
        <span className="xp-muted">Price basis</span>
        <h3>{terms.priceBasisPoints/100}% of published retail</h3>
      </div>
      <div>
        <span className="xp-muted">Ownership</span>
        <h3>{terms.ownership}</h3>
      </div>
      <div>
        <span className="xp-muted">Return rules · v{terms.version}</span>
        <p>{terms.returnRules}</p>
      </div>
    </div>:<p className="xp-notice">Polisi dealer belum diluluskan. Approval dan binding restock quote memerlukan terma founder.</p>}</Panel>{role==='customer'&&terms&&session.data?.memberships.find(member => member.dealerOrgId)?.dealerOrgId&&<DealerQuote terms={terms} dealerOrgId={session.data.memberships.find(member => member.dealerOrgId)!.dealerOrgId!} refresh={refresh} />}<Panel title="Restock & receiving" eyebrow="Owned vs consigned">
      <ResourceState {...restocks} />{restocks.data?.map(restock => <article className="xp-dealer-card" key={restock.id}>
        <div>
          <h3>{restock.lines.map(line => `${line.name} × ${line.quantity}`).join(', ')}</h3>
          <p>{money(restock.totalSen)} · {restock.ownership}</p>
          <RecordMeta id={restock.id} revision={restock.revision} />
        </div>
        <Status value={restock.status} />{role==='founder'&&restock.status==='requested'&&<MutationButton path={`/dealer/restocks/${restock.id}/transition`} input={{ expectedRevision: restock.revision,next: 'approved' }} onChanged={refresh} confirmLabel="Approve restock">Approve</MutationButton>}{(role==='founder'||role==='staff')&&restock.status==='approved'&&<FormPanel title="Dispatch restock" fields={[field('evidenceIds','Dispatch evidence IDs')]} onSubmit={async values => { const result=await api(`/dealer/restocks/${restock.id}/transition`,{ method: 'POST',body: JSON.stringify({ expectedRevision: restock.revision,next: 'dispatched',evidenceIds: splitRefs(values.evidenceIds) }) }); refresh(); return result; }} />} {role==='customer'&&restock.status==='dispatched'&&<button className="xp-button xp-secondary" onClick={() => onNavigate(`/flows/stock-receipt?shipment=${restock.id}`)}>Rekod penerimaan</button>}{restock.receipt&&<p className="xp-notice xp-success">Received {dateLabel(restock.receipt.receivedAt)} · {restock.receipt.movementIds.length} ledger movements</p>}</article>)}{!restocks.loading&&!restocks.error&&!restocks.data?.length&&<Empty title="Belum ada restock" description="Approved dealer boleh meminta quote melalui restock flow." />}</Panel>
    <DealerLedger role={role} onChanged={refresh} renderEvidence={(entityId,onChanged)=><EvidenceUpload entityId={entityId} onChanged={onChanged}/>}/>
  </>;
}

function DealerQuote({ terms,dealerOrgId,refresh }: { terms: DealerTerms; dealerOrgId: string; refresh: () => void; }) {
  const products=useResource<PublicProduct[]>('/catalogue');
  const [quote,setQuote]=useState<VersionedQuote|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [submitted,setSubmitted]=useState('');
  async function requestRestock() {
    if(!quote||busy) return; setBusy(true); setError('');
    try { const result=await api<RestockRecord>('/dealer/restocks',{ method: 'POST',body: JSON.stringify({ quoteId: quote.id }) }); setSubmitted(result.id); refresh(); }
    catch(failure) { setError(failure instanceof Error? failure.message:'Restock gagal.'); }
    finally { setBusy(false); }
  }
  return <Panel title="Request scoped restock quote" eyebrow={`Commercial policy v${terms.version}`}>
    <FormPanel title="Pilih produk & kuantiti" description={`Minimum ${terms.minimumQuantity} units. Setiap produk mesti gandaan ${terms.packMultiple}.`} fields={[field('productId','Published product',{ options: products.data?.map(product => ({ value: product.id,label: `${product.name} · ${money(product.priceSen)} retail` }))??[] }),field('quantity','Kuantiti unit',{ type: 'number',min: terms.minimumQuantity,step: String(terms.packMultiple),defaultValue: String(Math.ceil(terms.minimumQuantity/terms.packMultiple)*terms.packMultiple) })]} submitLabel="Semak server quote" onSubmit={async values => {
      const quantity=positiveQuantity(values.quantity); if(quantity<terms.minimumQuantity||quantity%terms.packMultiple!==0) throw new Error('Kuantiti tidak memenuhi MOQ / pack multiple yang diluluskan.');
      const result=await api<VersionedQuote>('/dealer/quotes',{ method: 'POST',body: JSON.stringify({ dealerOrgId,lines: [{ productId: values.productId,quantity }],priceVersion: terms.version }) }); setQuote(result); setSubmitted(''); return result;
    }} />{quote&&<div className="xp-quote-review">
      <h3>Review binding quote</h3>{quote.lines.map(line => <p key={line.productId}>{line.name} × {line.quantity} · {money(line.priceSen)} / unit</p>)}<strong className="xp-large-number">{money(quote.totalSen)}</strong>
      <p>Quote {quote.id} · Price v{quote.priceVersion} · Expires {dateLabel(quote.expiresAt)}</p>
      <p>Ownership: {terms.ownership} · {terms.returnRules}</p>
      <button className="xp-button" disabled={busy||Boolean(submitted)} onClick={requestRestock}>{busy? 'Submitting…':'Confirm & request restock'}</button>{error&&<p role="alert" className="xp-inline-error">{error}</p>}{submitted&&<p role="status" className="xp-notice xp-success">Restock request saved · {submitted}</p>}</div>}</Panel>;
}
