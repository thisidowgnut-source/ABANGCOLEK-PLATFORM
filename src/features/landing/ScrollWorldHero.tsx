import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Box, CirclePause, CirclePlay, PackageCheck, ShoppingBag, Truck, Users } from 'lucide-react';
import { storyModeScrollTarget, storyModeSnapshot, type StoryViewportSnapshot } from './story-model';
import { useSceneController } from './useSceneController';
import AnimatedColekWorld from './AnimatedColekWorld';
import WorldHotspot from './WorldHotspot';
import { BRAND_ASSETS } from '../brand/brand-assets';
import './scroll-world.css';

const chapters = [
  { id: 'produk', label: 'Produk', icon: ShoppingBag, eyebrow: '01 / The colek connection', title: ['Colek.', 'Connect.', 'Repeat.'], description: 'Dari pilihan pertama hingga pesanan anda. Terokai dunia ABANGCOLEK, satu perjalanan pada satu masa.', action: 'Jom pilih produk', path: '/products', detail: 'Pilih produk daripada katalog yang disahkan.' },
  { id: 'packing', label: 'Packing', icon: PackageCheck, eyebrow: '02 / Behind your next dip', title: ['Setiap pesanan.', 'Ada perjalanan.'], description: 'Pilih, semak dan ikuti perkembangan pesanan. Status packing dikemas kini dalam timeline pesanan anda.', action: 'Lihat pesanan saya', path: '/customer/orders', detail: 'Status pesanan berada dalam satu timeline.' },
  { id: 'penghantaran', label: 'Penghantaran', icon: Truck, eyebrow: '03 / From here to you', title: ['Lebih dekat.', 'Lebih connected.'], description: 'Semak update dispatch dalam ruang pelanggan. Pilihan fulfilment mengikut pesanan dan lokasi yang dikonfigurasi.', action: 'Lihat lokasi pickup', path: '/locations', detail: 'Semak lokasi dan pilihan pickup yang disahkan.' },
  { id: 'rangkaian', label: 'Rangkaian', icon: Users, eyebrow: '04 / Grow the connection', title: ['Satu jenama.', 'Banyak peluang.'], description: 'Pelanggan, ejen dan stokis dalam satu ekosistem. Mohon menjadi rakan bisnes dan sambung kerja dalam ruang anda.', action: 'Jadi ejen / stokis', path: '/become-dealer', detail: 'Permohonan dan terma bisnes melalui semakan founder.' },
] as const;
const SHORT_VIEWPORT_QUERY = '(max-height: 560px), (max-width: 750px) and (max-height: 740px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
interface ModeChangeSnapshot extends StoryViewportSnapshot { viewportWidth: number; chapter: number; manual: boolean; }

export default function ScrollWorldHero({ onNavigate }: { onNavigate: (path: string) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [shortViewport, setShortViewport] = useState(() => window.matchMedia(SHORT_VIEWPORT_QUERY).matches);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);
  const [worldAsset, setWorldAsset] = useState<'world' | 'mascot' | 'none'>('world');
  const [hotspotOpen, setHotspotOpen] = useState(false);
  const staticMode = Boolean(reducedMotion || motionPaused || shortViewport);
  const { active, phase, direction, visible, selectScene, releaseScene } = useSceneController({ sectionRef, enabled: !staticMode, blocked: hotspotOpen, sceneCount: chapters.length });
  const modeRef = useRef({ staticMode, motionPaused, active });
  modeRef.current = { staticMode, motionPaused, active };
  const modeChangeRef = useRef<ModeChangeSnapshot | null>(null);
  const settledViewportRef = useRef<ModeChangeSnapshot | null>(null);

  const readViewportSnapshot = (manual = false): ModeChangeSnapshot | null => {
    const section = sectionRef.current;
    if (!section) return null;
    const rect = section.getBoundingClientRect();
    const stickyTop = Number.parseFloat(getComputedStyle(section).getPropertyValue('--ac-world-header')) || 0;
    const visibleChapter = Array.from(section.querySelectorAll<HTMLElement>('.ac-world-copy')).findIndex(article => {
      const bounds = article.getBoundingClientRect();
      return bounds.bottom > stickyTop && bounds.top < window.innerHeight;
    });
    return { sectionTop: rect.top, sectionHeight: rect.height, viewportHeight: window.innerHeight, viewportWidth: window.innerWidth, stickyTop, manual, chapter: modeRef.current.staticMode ? Math.max(0, visibleChapter) : modeRef.current.active };
  };
  const captureModeChange = (manual: boolean) => {
    const current = readViewportSnapshot(manual);
    if (current) modeChangeRef.current = manual ? current : storyModeSnapshot(settledViewportRef.current, current);
  };

  useEffect(() => {
    const query = window.matchMedia(SHORT_VIEWPORT_QUERY);
    const reducedQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => {
      const nextStaticMode = Boolean(query.matches || reducedQuery.matches || modeRef.current.motionPaused);
      if (nextStaticMode !== modeRef.current.staticMode) captureModeChange(false);
      setShortViewport(query.matches);
      setReducedMotion(reducedQuery.matches);
    };
    update();
    query.addEventListener('change', update);
    reducedQuery.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); reducedQuery.removeEventListener('change', update); };
  }, []);

  useLayoutEffect(() => {
    const before = modeChangeRef.current;
    const section = sectionRef.current;
    if (!before || !section) return;
    modeChangeRef.current = null;
    const rect = section.getBoundingClientRect();
    const documentTop = rect.top + window.scrollY;
    const header = Number.parseFloat(getComputedStyle(section).getPropertyValue('--ac-world-header')) || 0;
    const chapter = section.querySelector<HTMLElement>(`#world-${chapters[before.chapter].id}`);
    const target = staticMode && chapter ? chapter.getBoundingClientRect().top + window.scrollY - header : documentTop - header;
    const top = storyModeScrollTarget(before, documentTop + rect.height, target);
    if (top !== null) window.scrollTo({ top, behavior: 'auto' });
    if (!staticMode) selectScene(before.chapter);
    if (before.manual) {
      if (staticMode) chapter?.focus({ preventScroll: true });
      else stageRef.current?.querySelector<HTMLButtonElement>('.ac-world-motion')?.focus({ preventScroll: true });
    }
  }, [staticMode, selectScene]);

  useLayoutEffect(() => {
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const nextStatic = Boolean(window.matchMedia(SHORT_VIEWPORT_QUERY).matches || window.matchMedia(REDUCED_MOTION_QUERY).matches || modeRef.current.motionPaused);
      if (nextStatic === modeRef.current.staticMode) settledViewportRef.current = readViewportSnapshot();
    };
    const schedule = () => { if (frame === null) frame = window.requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    if (sectionRef.current) observer.observe(sectionRef.current);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [active, staticMode]);

  const goToChapter = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const header = Number.parseFloat(getComputedStyle(section).getPropertyValue('--ac-world-header')) || 0;
    window.scrollTo({ top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - header), behavior: 'auto' });
    selectScene(index);
  };
  const skipToCatalogue = (event: MouseEvent<HTMLAnchorElement>) => {
    const catalogue = document.getElementById('catalogue');
    if (!catalogue) return;
    event.preventDefault();
    releaseScene();
    catalogue.scrollIntoView({ behavior: 'auto', block: 'start' });
    catalogue.focus({ preventScroll: true });
  };

  return <section ref={sectionRef} className={`ac-world-journey${staticMode ? ' is-static' : ''}`} tabIndex={staticMode ? undefined : 0} aria-label="Terokai dunia ABANGCOLEK" aria-describedby={staticMode ? undefined : 'ac-world-instructions'} data-scene={chapters[active].id} data-motion={staticMode ? 'static' : 'scene'} data-phase={staticMode ? 'idle' : phase} data-direction={direction}>
    <div ref={stageRef} className="ac-world-stage">
      <div className={`ac-world-visual${worldAsset !== 'world' ? ' asset-fallback' : ''}`} aria-hidden="true">
        {worldAsset !== 'none' && <img key={worldAsset} className="ac-world-camera" src={worldAsset === 'mascot' ? '/assets/brand/MASKOT-1.PNG' : BRAND_ASSETS.world.src} alt="" width={BRAND_ASSETS.world.width} height={BRAND_ASSETS.world.height} decoding="async" onError={() => setWorldAsset(current => current === 'world' ? 'mascot' : 'none')} />}
      </div>
      <div className="ac-world-shade" aria-hidden="true" />
      {!staticMode && <div className="ac-world-animation"><AnimatedColekWorld active={active} phase={phase} direction={direction} paused={!visible || hotspotOpen} /></div>}
      {!staticMode && active === 0 && <figure className="ac-world-product-photo">
        <div><img src={BRAND_ASSETS.productEditorial.src} alt={BRAND_ASSETS.productEditorial.alt} width={405} height={720} decoding="async" fetchPriority="high" /></div>
        <figcaption><strong>Sambal Colek</strong><a href={BRAND_ASSETS.productEditorial.source} target="_blank" rel="noopener noreferrer">Foto TikTok rasmi <ArrowUpRight size={12} /></a></figcaption>
      </figure>}
      <div className="ac-world-topline">
        <span className="ac-world-edition"><Box size={15} /> THE ABANGCOLEK WORLD</span>
        <button className="ac-world-motion" onClick={() => { captureModeChange(true); setMotionPaused(value => !value); }} aria-pressed={motionPaused} disabled={Boolean(reducedMotion || shortViewport)} aria-label={motionPaused ? 'Aktifkan animasi dunia' : staticMode ? 'Paparan tanpa animasi' : 'Kurangkan animasi'}>
          {staticMode ? <CirclePlay size={17} /> : <CirclePause size={17} />}<span>{staticMode ? 'Paparan statik' : 'Kurangkan animasi'}</span>
        </button>
      </div>
      <div className="ac-world-scenes">
        {chapters.map((chapter, index) => <article key={chapter.id} id={`world-${chapter.id}`} tabIndex={-1} className={`ac-world-copy${index === active ? ' is-active' : ''}`} aria-hidden={!staticMode && index !== active} inert={!staticMode && index !== active}>
          <p className="ac-world-eyebrow"><span />{chapter.eyebrow}</p>
          {index === 0 ? <h1>{chapter.title.map((line, lineIndex) => <span key={line} className={lineIndex === 2 ? 'ac-world-accent' : ''}>{line}</span>)}</h1> : <h2>{chapter.title.map(line => <span key={line}>{line}</span>)}</h2>}
          <p className="ac-world-description">{chapter.description}</p>
          <div className="ac-world-actions">
            <button className="ac-button" onClick={() => onNavigate(chapter.path)}>{chapter.action}<ArrowUpRight size={18} /></button>
            {index === 0 && <button className="ac-world-secondary" onClick={() => onNavigate('/become-dealer')}>Jadi rakan bisnes <ArrowRight size={16} /></button>}
          </div>
          <p className="ac-world-detail"><chapter.icon size={15} />{chapter.detail}</p>
          {index === 0 && staticMode && <a className="ac-world-static-product" href={BRAND_ASSETS.productEditorial.source} target="_blank" rel="noopener noreferrer"><img src={BRAND_ASSETS.productEditorial.src} alt={BRAND_ASSETS.productEditorial.alt} width={405} height={720} loading="lazy" /><span>Sambal Colek · Foto TikTok rasmi <ArrowUpRight size={14} /></span></a>}
        </article>)}
      </div>
      {!staticMode && <WorldHotspot active={active} paused={!visible || hotspotOpen} onOpenChange={setHotspotOpen} onNavigate={onNavigate} />}
      <span className="ac-world-art-note">Ilustrasi perjalanan ABANGCOLEK</span>
      <div className="ac-world-bottom">
        {!staticMode && <nav className="ac-world-chapters" aria-label="Bab perjalanan ABANGCOLEK">
          {chapters.map((chapter, index) => <button key={chapter.id} aria-label={`Bab ${index + 1}: ${chapter.label}`} aria-current={index === active ? 'step' : undefined} onClick={() => goToChapter(index)}>
            <span className="ac-world-chapter-number">0{index + 1}</span><chapter.icon size={18} /><span>{chapter.label}</span>
          </button>)}
          <div className="ac-world-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / chapters.length})` }} /></div>
        </nav>}
        <a className="ac-world-skip" href="#catalogue" onClick={skipToCatalogue}>Terus ke katalog <ArrowDown size={16} /></a>
      </div>
      {!staticMode && <p id="ac-world-instructions" className="ac-world-scroll-hint">{active === chapters.length - 1 ? 'SCROLL UNTUK TERUSKAN' : 'SCROLL / SWIPE UNTUK TEROKAI'}<ArrowDown size={15} /><span className="ac-world-sr-only">Gunakan PageDown atau PageUp apabila fokus pada ruang ini. Butang bab dan pautan terus ke katalog juga tersedia.</span></p>}
      <span className="ac-world-sr-only" role="status" aria-live="polite" aria-atomic="true">{!staticMode ? `Bab ${active + 1} daripada ${chapters.length}: ${chapters[active].label}` : 'Paparan statik. Semua bab boleh dibaca.'}</span>
    </div>
  </section>;
}
