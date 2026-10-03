import { useEffect } from 'react';
import { ArrowRight,ArrowUpRight,MapPin,Package,ShoppingBag,Truck,Users,Moon,Sun } from 'lucide-react';
import type { PublicProduct } from '../../../shared/platform-contracts';
import { useResource } from '../platform/client';
import { money } from '../workspaces/experience-model';
import ScrollWorldHero from './ScrollWorldHero';
import BrandLogo from '../brand/BrandLogo';
import './landing.css';

export interface LandingPageProps { onNavigate: (path: string) => void; view?: 'home'|'products'|'locations'|'become-dealer'|'help'; productId?: string; theme?: 'dark'|'light'; onToggleTheme?: () => void; }
interface PublicInfo { contact?: string|null; locations?: { id: string; name: string; address: string; hours: string; verifiedAt: string; }[]; }
const descriptions={ home: 'ABANGCOLEK — katalog produk yang disahkan, pesanan anda dan ruang ejen / stokis.',products: 'Katalog published ABANGCOLEK dengan harga dan ketersediaan semasa.',locations: 'Lokasi pickup ABANGCOLEK dan waktu operasi yang telah disahkan.','become-dealer': 'Mohon menjadi ejen atau stokis ABANGCOLEK dan semak commercial terms yang diluluskan.',help: 'Bantuan untuk pesanan, payment evidence dan aduan ABANGCOLEK.' };
export default function LandingPage({ onNavigate,view='home',productId,theme='dark',onToggleTheme }: LandingPageProps) {
  const catalogue=useResource<PublicProduct[]|PublicProduct>(productId? `/catalogue/${encodeURIComponent(productId)}`:'/catalogue');
  const info=useResource<PublicInfo>('/public-info');
  const visibleProducts=catalogue.data? (Array.isArray(catalogue.data)? catalogue.data:catalogue.data.id===productId? [catalogue.data]:[]):null;
  useEffect(() => {
    const product=productId? visibleProducts?.find(item => item.id===productId):undefined;
    document.title=product? `${product.name} | ABANGCOLEK`:view==='home'? 'ABANGCOLEK — Colek. Connect. Repeat.':`${view==='products'? 'Produk':view==='locations'? 'Lokasi':view==='help'? 'Bantuan':'Ejen & Stokis'} | ABANGCOLEK`;
    let meta=document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if(!meta) { meta=document.createElement('meta'); meta.name='description'; document.head.append(meta); }
    meta.content=product?.description??descriptions[view];
    for(const [property,content] of [['og:title',document.title],['og:description',meta.content]]){
      let tag=document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if(!tag){tag=document.createElement('meta');tag.setAttribute('property',property);document.head.append(tag);}tag.content=content;
    }
    let canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}
    canonical.href=new URL(window.location.pathname,window.location.origin).href;
    let structured=document.querySelector<HTMLScriptElement>('#platform-product-metadata');
    const items=['home','products'].includes(view)?visibleProducts??[]:[];
    if(items.length){
      if(!structured){structured=document.createElement('script');structured.id='platform-product-metadata';structured.type='application/ld+json';document.head.append(structured);}
      const records=items.map(item=>({'@context':'https://schema.org','@type':'Product',name:item.name,description:item.description,sku:item.id,offers:{'@type':'Offer',priceCurrency:'MYR',price:(item.priceSen/100).toFixed(2),availability:item.availableQuantity>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'}}));
      structured.textContent=JSON.stringify(records.length===1?records[0]:records);
    }else structured?.remove();
    return () => {
      // Public product semantics must not follow the user into private operational screens.
      document.querySelector('#platform-product-metadata')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
      document.title='ABANGCOLEK — Workspace';
      meta.content='Ruang kerja ABANGCOLEK. Akses memerlukan pengesahan dan permission yang sah.';
      document.querySelector('meta[property="og:title"]')?.remove();
      document.querySelector('meta[property="og:description"]')?.remove();
    };
  },[view,productId,catalogue.data]);
  return <div className={`ac-landing${view==='home' ? ' ac-landing-home' : ''}`}>
    <nav className="ac-nav" aria-label="Public navigation">
      <button className="ac-wordmark" onClick={() => onNavigate('/')} aria-label="ABANGCOLEK home"><BrandLogo />
      </button>
      <div className="ac-nav-links">
        <a href="/products" onClick={event => { event.preventDefault(); onNavigate('/products'); }}>Produk</a>
        <a href="/locations" onClick={event => { event.preventDefault(); onNavigate('/locations'); }}>Lokasi</a>
        <a href="/become-dealer" onClick={event => { event.preventDefault(); onNavigate('/become-dealer'); }}>Ejen & stokis</a>
        <a href="/help" onClick={event => { event.preventDefault(); onNavigate('/help'); }}>Bantuan</a>
      </div>{onToggleTheme&&<button className="ac-theme-toggle" onClick={onToggleTheme} aria-label="Tukar tema">{theme==='dark'? <Sun size={18} />:<Moon size={18} />}</button>}<button className="ac-button ac-button-dark" onClick={() => onNavigate('/login')}>Masuk <ArrowUpRight size={17} />
      </button>
    </nav>
    <main className="ac-main" id="platform-main">{view==='home'&&<>
      <ScrollWorldHero onNavigate={onNavigate} />
      <div className="ac-marquee" aria-hidden="true">
        <span>YOUR NEXT DIP</span>
        <b>✳</b>
        <span>ABANGCOLEK</span>
        <b>✳</b>
        <span>COLEK. CONNECT. REPEAT.</span>
        <b>✳</b>
      </div>
    </>}{(view==='home'||view==='products')&&<section className="ac-catalogue" id="catalogue" tabIndex={-1}>
      <div className="ac-section-heading">
        <div>
          <p className="ac-eyebrow">The collection</p>
          <h2>Pilih colek anda.</h2>
        </div>
        <p>Produk, harga dan ketersediaan<br />daripada katalog yang disahkan.</p>
      </div>{catalogue.loading&&<p className="ac-notice" role="status">Memuatkan katalog semasa…</p>}{catalogue.error&&<div className="ac-notice" role="alert">
        <p>{catalogue.error}</p>
        <button className="ac-button ac-button-outline" onClick={catalogue.reload}>Cuba semula</button>
      </div>}{productId&&!catalogue.loading&&!catalogue.error&&!visibleProducts?.length&&<div className="ac-notice" role="status">
        <h2>Produk tidak ditemui</h2>
        <p>Produk ini belum tersedia dalam katalog semasa.</p>
        <button className="ac-button ac-button-dark" onClick={() => onNavigate('/products')}>Lihat semua produk</button>
      </div>}<div className="ac-product-grid">{visibleProducts?.map((product,index) => <article className="ac-product" key={product.id}>
        <div className={`ac-product-visual ac-product-color-${index%3}`}>
          <Package size={74} strokeWidth={1} />
          <span>ABANG<br />COLEK</span>
          <small>Pack {product.packSize}</small>
        </div>
        <div className="ac-product-content">
          <p className="ac-eyebrow">Collection · v{product.publishedVersion}</p>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div>
            <strong>{money(product.priceSen)}</strong>
            <span>{product.availableQuantity>0? `${product.availableQuantity} available units`:'Stok belum tersedia'}</span>
          </div>
          <button className="ac-button ac-button-dark" disabled={product.availableQuantity<1} onClick={() => onNavigate(`/flows/order?product=${encodeURIComponent(product.id)}`)}>Pilih produk <ArrowUpRight size={17} />
          </button>
        </div>
      </article>)}</div>{!productId&&catalogue.hasMore&&<button className="ac-button ac-button-outline" disabled={catalogue.loadingMore} onClick={()=>void catalogue.loadMore()}>{catalogue.loadingMore?'Memuatkan…':'Muat lagi produk'}</button>}{!catalogue.loading&&!catalogue.error&&!visibleProducts?.length&&<div className="ac-catalogue-empty">
        <Package size={36} />
        <h3>Katalog sedang disediakan.</h3>
        <p>Produk akan dipaparkan selepas nama, harga dan stok disahkan. Semak kembali atau masuk untuk mengurus pesanan anda.</p>
        <button className="ac-button ac-button-dark" onClick={() => onNavigate('/customer/orders')}>Pesanan saya <ArrowRight size={17} />
        </button>
      </div>}</section>}{view==='home'&&<section className="ac-how">
        <div className="ac-section-heading">
          <div>
            <p className="ac-eyebrow">How it works</p>
            <h2>From your pick<br />to your doorstep.</h2>
          </div>
          <span className="ac-how-symbol" aria-hidden="true">↗</span>
        </div>
        <div className="ac-step-grid">{[{ icon: ShoppingBag,title: '01 / Pilih & semak',text: 'Pilih produk available, semak harga semasa dan hantar permintaan pesanan.' },{ icon: Truck,title: '02 / Ikuti update',text: 'Payment evidence, packing dan dispatch dikemas kini pada timeline pesanan anda.' },{ icon: Users,title: '03 / Kekal connected',text: 'Bantuan dan aduan berkongsi context order. B2B dealer mempunyai workspace tersendiri.' }].map(step => <article key={step.title}>
          <step.icon size={28} />
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>)}</div>
      </section>}{(view==='home'||view==='become-dealer')&&<section className="ac-dealer">
        <div>
          <p className="ac-eyebrow">The next connection</p>
          <h2>Grow with<br />
            <span>ABANGCOLEK.</span>
          </h2>
          <p>Berminat menjadi ejen atau stokis? Hantar profil bisnes anda. Founder menyemak permohonan dan commercial terms sebelum akses B2B diaktifkan.</p>
          <div className="ac-hero-actions">
            <button className="ac-button ac-button-dark" onClick={() => onNavigate('/flows/dealer-application')}>Mohon ejen / stokis <ArrowUpRight size={18} />
            </button>
            <button className="ac-button ac-button-outline" onClick={() => onNavigate('/customer/business')}>Ruang bisnes saya</button>
          </div>
        </div>
        <div className="ac-dealer-note">
          <Users size={32} />
          <h3>A partnership with clear terms.</h3>
          <ul>
            <li>Terma, MOQ dan pack size yang diluluskan</li>
            <li>Restock quote menggunakan harga berversi</li>
            <li>Ownership & custody yang boleh dijejak</li>
            <li>Receiving evidence dan variance records</li>
          </ul>
          <p>Kelulusan diperlukan. Tiada pendapatan atau komisen dijamin.</p>
        </div>
      </section>}{view==='locations'&&<section className="ac-public-section">
        <p className="ac-eyebrow">Find your pickup</p>
        <h1>Lokasi yang<br />
          <span>disahkan.</span>
        </h1>{info.loading&&<p role="status">Memuatkan lokasi…</p>}{info.error&&<p className="ac-notice" role="alert">{info.error}</p>}<div className="ac-location-grid">{info.data?.locations?.map(location => <article key={location.id}>
          <MapPin size={28} />
          <h2>{location.name}</h2>
          <p>{location.address}</p>
          <strong>{location.hours}</strong>
          <small>Disemak {new Intl.DateTimeFormat('ms-MY',{ dateStyle: 'medium',timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(location.verifiedAt))}</small>
        </article>)}</div>{!info.loading&&!info.error&&!info.data?.locations?.length&&<div className="ac-notice">Belum ada lokasi pickup yang disahkan. Pilihan fulfilment tersedia dalam order flow apabila dikonfigurasi.</div>}</section>}{(view==='home'||view==='help')&&<section className="ac-faq">
          <div>
            <p className="ac-eyebrow">A little clarity</p>
            <h2>Need a hand?</h2>
            <p>Own order. Shared context.<br />Bantuan yang boleh dijejak.</p>
            <button className="ac-button ac-button-dark" onClick={() => onNavigate('/customer/cases')}>Buka bantuan <ArrowUpRight size={17} />
            </button>{info.data?.contact&&<p className="ac-approved-contact">Contact: {info.data.contact}</p>}</div>
          <div>{[{ title: 'Bagaimana saya buat pesanan?',text: 'Pilih produk yang tersedia, lengkapkan order flow dan semak receipt selepas permintaan anda disimpan.' },{ title: 'Adakah upload resit terus mengesahkan bayaran?',text: 'Upload resit direkod sebagai bukti untuk semakan. Authorized operator mengesahkan pembayaran daripada sumber sebenar sebelum status verified.' },{ title: 'Bagaimana saya jejak pesanan atau hantar aduan?',text: 'Masuk ke Customer Portal untuk melihat timeline pesanan anda dan membuka case berkaitan. Mesej dan evidence berada dalam context yang sama.' },{ title: 'Bagaimana menjadi ejen atau stokis?',text: 'Hantar permohonan dealer. Setelah diluluskan dengan commercial terms dan membership B2B, anda boleh membuat restock dan merekod receiving.' }].map(item => <details key={item.title}>
            <summary>{item.title}<span aria-hidden="true">+</span>
            </summary>
            <p>{item.text}</p>
          </details>)}</div>
        </section>}</main>
    <footer className="ac-footer">
      <div>
        <BrandLogo className="ac-footer-logo" loading="lazy" />
        <p>Colek. Connect. Repeat.</p>
      </div>
      <div>
        <button onClick={() => onNavigate('/products')}>Katalog</button>
        <button onClick={() => onNavigate('/help')}>Bantuan</button>
        <button onClick={() => onNavigate('/login')}>Workspace login</button>
      </div>
      <small>Harga & ketersediaan dikemas kini.<br />Bahasa Malaysia / English</small>
    </footer>
  </div>;
}
