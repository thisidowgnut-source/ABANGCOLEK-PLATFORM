import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Plus, X } from 'lucide-react';
import { BRAND_ASSETS } from '../brand/brand-assets';

const details = [
  { title: 'Kenali colek anda.', label: 'Terokai produk', text: 'Lihat foto asal Sambal Colek dan buka katalog untuk pilihan, harga serta ketersediaan yang disahkan.', points: ['Foto daripada TikTok rasmi ABANG COLEK.', 'Harga dan stok mengikut katalog semasa.'], action: 'Buka katalog', path: '/products' },
  { title: 'Satu pesanan. Satu timeline.', label: 'Terokai proses packing', text: 'Sambung urusan pesanan dalam ruang pelanggan. Semak perkembangan packing dan bukti pembayaran pada pesanan anda.', points: ['Upload resit dihantar untuk semakan.', 'Pengesahan bayaran memerlukan semakan pihak yang dibenarkan.'], action: 'Lihat pesanan saya', path: '/customer/orders' },
  { title: 'Dari sini, ke anda.', label: 'Terokai penghantaran', text: 'Semak lokasi pickup yang diterbitkan dan ikuti update dispatch melalui pesanan anda.', points: ['Pilihan fulfilment mengikut pesanan dan lokasi.', 'Rujuk timeline pesanan untuk status sebenar.'], action: 'Semak lokasi pickup', path: '/locations' },
  { title: 'Grow the connection.', label: 'Terokai ejen & stokis', text: 'Mohon menjadi rakan bisnes ABANGCOLEK. Profil dan terma perniagaan disemak sebelum ruang B2B diaktifkan.', points: ['MOQ, pack size dan harga tertakluk kepada terma yang diluluskan.', 'Tiada pendapatan atau komisen dijamin.'], action: 'Mohon ejen / stokis', path: '/become-dealer' },
] as const;

interface WorldHotspotProps {
  active: number;
  paused: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (path: string) => void;
}

/** Native dialog supplies focus containment; all routes come from the existing public journey. */
export default function WorldHotspot({ active, paused, onOpenChange, onNavigate }: WorldHotspotProps) {
  const detail = details[active] ?? details[0];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => {
    dialogRef.current?.close();
    setOpen(false);
    onOpenChange(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (open && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [open]);

  // A display-mode change unmounts the hotspot. Release the parent's input block as well.
  useEffect(() => () => onOpenChange(false), [onOpenChange]);

  return <div className={`ac-world-hotspot-wrap${paused ? ' is-paused' : ''}`}>
    <span className="ac-world-hotspot-ring" aria-hidden="true" />
    <button ref={triggerRef} className="ac-world-hotspot" aria-label={detail.label} aria-haspopup="dialog" aria-expanded={open} aria-controls="ac-world-detail" onClick={() => { setOpen(true); onOpenChange(true); }}>
      <Plus size={20} /><span>{detail.label}</span>
    </button>
    <dialog ref={dialogRef} id="ac-world-detail" className="ac-world-dialog" aria-labelledby="ac-world-detail-title" aria-describedby="ac-world-detail-description" onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); onOpenChange(false); }} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <div className="ac-world-dialog-top"><span>0{active + 1} / THE COLEK CONNECTION</span><button autoFocus onClick={close} aria-label="Tutup maklumat"><X size={20} /></button></div>
      {active === 0 && <figure className="ac-world-dialog-photo"><img src={BRAND_ASSETS.productEditorial.src} alt={BRAND_ASSETS.productEditorial.alt} width={405} height={720} /><figcaption><a href={BRAND_ASSETS.productEditorial.source} target="_blank" rel="noopener noreferrer">Foto TikTok rasmi <ArrowUpRight size={13} /></a></figcaption></figure>}
      <h2 id="ac-world-detail-title">{detail.title}</h2>
      <p id="ac-world-detail-description">{detail.text}</p>
      <ul>{detail.points.map(point => <li key={point}>{point}</li>)}</ul>
      <button className="ac-button" onClick={() => { close(); onNavigate(detail.path); }}>{detail.action}<ArrowUpRight size={17} /></button>
    </dialog>
  </div>;
}
