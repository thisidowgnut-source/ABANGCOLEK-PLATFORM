import { useState,useId,type FormEvent,type ReactNode } from 'react';
import { AlertCircle,ArrowUpRight,CheckCircle2,LoaderCircle,RefreshCw,Search,X } from 'lucide-react';
import { api } from '../platform/client';

export interface FieldDefinition { name: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string; }[]; help?: string; defaultValue?: string; min?: number; max?: number; step?: string; placeholder?: string; }
export function Empty({ title='Belum ada rekod',description='Rekod yang disimpan akan muncul di sini.' }: { title?: string; description?: string; }) {
  return <div className="xp-empty">
    <span className="xp-empty-orbit" aria-hidden="true">↗</span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>;
}
export function Status({ value }: { value: string; }) { return <span className={`xp-status xp-status-${value.replaceAll('_','-')}`}>{value.replaceAll('_',' ')}</span>; }
export function Panel({ title,eyebrow,children,action,className='' }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode; className?: string; }) {
  return <section className={`xp-panel ${className}`}>
    <div className="xp-panel-head">
      <div>{eyebrow&&<p className="xp-eyebrow">{eyebrow}</p>}<h2>{title}</h2>
      </div>{action}</div>{children}</section>;
}
export function ResourceState({ loading,error,reload,hasMore=false,loadingMore=false,loadMore,total }: { loading: boolean; error: string; reload: () => void; hasMore?:boolean;loadingMore?:boolean;loadMore?:()=>void;total?:number|null }) {
  return loading? <p className="xp-notice" role="status">
    <LoaderCircle className="xp-spin" size={18} /> Memuatkan rekod…</p>:error? <div className="xp-notice xp-error" role="alert">
      <AlertCircle size={18} />
      <span>{error}</span>
      <button className="xp-button xp-secondary" onClick={reload}>Cuba semula</button>
    </div>:hasMore&&loadMore?<div className="xp-notice"><span>{total!=null?`${total} rekod tersedia.`:'Ada rekod seterusnya.'}</span><button className="xp-button xp-secondary" disabled={loadingMore} onClick={loadMore}>{loadingMore?'Memuatkan…':'Muat lagi rekod'}</button></div>:null;
}
export function Refresh({ onClick }: { onClick: () => void; }) {
  return <button type="button" className="xp-icon-button" onClick={onClick} aria-label="Muat semula rekod">
    <RefreshCw size={18} />
  </button>;
}
export function SearchBox({ value,onChange,label='Cari rekod' }: { value: string; onChange: (value: string) => void; label?: string; }) {
  return <label className="xp-search">
    <Search size={18} />
    <span className="xp-sr-only">{label}</span>
    <input value={value} onChange={event => onChange(event.target.value)} placeholder={label} type="search" />
  </label>;
}
export function RecordMeta({ id,revision }: { id: string; revision?: number; }) {
  return <p className="xp-record-meta">
    <span>{id}</span>{revision!=null&&<span>Revision {revision}</span>}</p>;
}
export function NavigateButton({ label,to,onNavigate }: { label: string; to: string; onNavigate: (path: string) => void; }) {
  return <button className="xp-button xp-secondary" onClick={() => onNavigate(to)}>{label}<ArrowUpRight size={16} />
  </button>;
}
export function FormPanel({ title,description,fields,submitLabel='Simpan rekod',onSubmit,children,onCancel }: { title: string; description?: string; fields: FieldDefinition[]; submitLabel?: string; onSubmit: (values: Record<string,string>) => Promise<unknown>; children?: ReactNode; onCancel?: () => void; }) {
  const formId=useId();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [receipt,setReceipt]=useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy) return;
    const form=event.currentTarget;
    const values=Object.fromEntries(Array.from(new FormData(form).entries()).map(([key,value]) => [key,String(value).trim()]));
    setBusy(true); setError(''); setReceipt('');
    try {
      const result=await onSubmit(values);
      const record=result as { id?: string; receipt?: { id?: string; }; status?: string; }|undefined;
      setReceipt(`Disimpan oleh server${record?.id? ` · ${record.id}`:record?.receipt?.id? ` · ${record.receipt.id}`:''}.`);
    } catch(failure) { setError(failure instanceof Error? failure.message:'Rekod gagal disimpan. Cuba semula.'); }
    finally { setBusy(false); }
  }
  return <section className="xp-form-panel">
    <div className="xp-panel-head">
      <div>
        <p className="xp-eyebrow">Workspace action</p>
        <h2>{title}</h2>
      </div>{onCancel&&<button type="button" className="xp-icon-button" aria-label="Tutup borang" onClick={onCancel}>
        <X size={18} />
      </button>}</div>{description&&<p className="xp-form-description">{description}</p>}<form onSubmit={submit}>
      <div className="xp-form-grid">{fields.map(field => <div key={field.name} className={field.type==='textarea'? 'xp-field xp-field-wide':'xp-field'}>
        <label htmlFor={`${formId}-${field.name}`}>{field.label}{field.required&&<span aria-label="wajib"> *</span>}</label>{field.options? <select id={`${formId}-${field.name}`} aria-describedby={field.help? `${formId}-${field.name}-help`:undefined} name={field.name} required={field.required} defaultValue={field.defaultValue??''}>
          <option value="" disabled>Pilih…</option>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>:field.type==='textarea'? <textarea id={`${formId}-${field.name}`} aria-describedby={field.help? `${formId}-${field.name}-help`:undefined} name={field.name} required={field.required} rows={4} maxLength={field.max??20000} defaultValue={field.defaultValue} placeholder={field.placeholder} />:<input id={`${formId}-${field.name}`} aria-describedby={field.help? `${formId}-${field.name}-help`:undefined} name={field.name} type={field.type??'text'} required={field.required} defaultValue={field.defaultValue} min={field.min} max={field.type==='number'? field.max:undefined} maxLength={field.type!=='number'? field.max??500:undefined} step={field.step} placeholder={field.placeholder} />}{field.help&&<small id={`${formId}-${field.name}-help`}>{field.help}</small>}</div>)}</div>{children}{error&&<p className="xp-notice xp-error" role="alert">
            <AlertCircle size={18} />{error}</p>}{receipt&&<p className="xp-notice xp-success" role="status">
              <CheckCircle2 size={18} />{receipt}</p>}<div className="xp-form-actions">
        <button className="xp-button" disabled={busy}>{busy? <LoaderCircle className="xp-spin" size={18} />:<CheckCircle2 size={18} />} {busy? 'Menyimpan…':submitLabel}</button>{onCancel&&<button type="button" className="xp-button xp-secondary" onClick={onCancel}>Tutup</button>}</div>
    </form>
  </section>;
}
export function MutationButton({ children,path,input,onChanged,confirmLabel,disabled=false,className='' }: { children: ReactNode; path: string; input: unknown; onChanged: () => void; confirmLabel?: string; disabled?: boolean; className?: string; }) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [confirming,setConfirming]=useState(false);
  async function act() {
    if(busy||disabled) return;
    if(confirmLabel&&!confirming) { setConfirming(true); return; }
    setBusy(true); setError('');
    try { await api(path,{ method: 'POST',body: JSON.stringify(input) }); onChanged(); setConfirming(false); }
    catch(failure) { setError(failure instanceof Error? failure.message:'Tindakan gagal.'); }
    finally { setBusy(false); }
  }
  return <div className="xp-mutation">
    <button type="button" className={`xp-button xp-secondary ${className}`} onClick={act} disabled={disabled||busy}>{busy? 'Memproses…':confirming? confirmLabel:children}</button>{confirming&&<button type="button" className="xp-text-button" onClick={() => setConfirming(false)}>Batal</button>}{error&&<p role="alert" className="xp-inline-error">{error}</p>}</div>;
}
export const splitRefs=(value: string) => value.split(',').map(ref => ref.trim()).filter(Boolean);
export const field=(name: string,label: string,extra: Partial<FieldDefinition>={}): FieldDefinition => ({ name,label,required: true,...extra });
