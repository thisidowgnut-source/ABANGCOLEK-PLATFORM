import { useId, type CSSProperties } from 'react';
import './animated-colek-world.css';

export interface AnimatedColekWorldProps {
  active: number;
  phase: 'idle' | 'transition';
  direction: 1 | -1;
  paused: boolean;
}

interface ArtProps { id: string }

/** Plain shipping boxes deliberately avoid suggesting unverified product packaging. */
function Parcel({ x, y, size = 1, className = '' }: { x: number; y: number; size?: number; className?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <g className={className}>
      <path d="M0 0 35-18 70 0 35 18Z" fill="#efb76f" />
      <path d="M0 0 35 18 35 58 0 40Z" fill="#d58b4c" />
      <path d="M35 18 70 0 70 40 35 58Z" fill="#ad6239" />
      <path d="M14-7 49 11 49 28 42 32 42 15 7-3Z" fill="#ffe3a4" opacity=".8" />
      <path d="M10 19 23 26M10 25 19 30" stroke="#754528" strokeWidth="2" />
    </g>
  </g>;
}

function Palm({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cx="0" cy="5" rx="27" ry="12" fill="#12151c" opacity=".6" />
    <path d="M-5 3Q5-37-4-83" fill="none" stroke="#a08060" strokeWidth="9" />
    <path d="M-4-83Q-46-115-57-76Q-25-95-4-83M-4-83Q29-122 57-84Q22-99-4-83M-4-83Q-20-130-37-109Q-15-102-4-83M-4-83Q1-129 25-118Q7-99-4-83" fill="#8fba55" />
    <path d="M-4-83Q-30-66-38-43Q-6-57-4-83M-4-83Q35-70 42-43Q14-48-4-83" fill="#b7db69" />
  </g>;
}

function SceneLabel({ number, title, x = 487, y = 117 }: { number: string; title: string; x?: number; y?: number }) {
  return <g transform={`translate(${x} ${y})`} className="ac-aw-label">
    <rect x="-18" y="-24" width="203" height="51" rx="11" fill="#22232b" stroke="#d5d0ef" strokeOpacity=".22" />
    <circle cx="3" cy="0" r="4" fill="#cfff5e" />
    <text x="18" y="5" fill="#eeeaf8">{number} / {title}</text>
    <path d="M17 27V70" stroke="#b5acce" strokeOpacity=".35" strokeDasharray="3 5" />
    <circle cx="17" cy="74" r="3" fill="#c6b3f5" />
  </g>;
}

function Selection({ id }: ArtProps) {
  return <>
    <SceneLabel number="01" title="Pilih & connect" />
    <ellipse cx="390" cy="342" rx="211" ry="92" className="ac-aw-orbit-line" transform="rotate(-13 390 342)" />
    <ellipse cx="390" cy="342" rx="250" ry="112" className="ac-aw-orbit-line ac-aw-orbit-line-outer" transform="rotate(12 390 342)" />
    <g className="ac-aw-layer ac-aw-selection-platform">
      <path d="M236 349 391 270 548 349 391 430Z" fill={`url(#${id}-roof)`} />
      <path d="M236 349V383L391 462V430Z" fill="#666080" />
      <path d="M391 430 548 349V383L391 462Z" fill="#413954" />
      <path d="M249 348 391 279 535 348 391 420Z" fill="none" stroke="#d9cff2" strokeOpacity=".4" />
      <path d="M264 378 358 426" stroke="#cfff5e" strokeWidth="3" strokeLinecap="round" />
      <path d="M391 430 548 349" stroke="#cfff5e" strokeOpacity=".5" />
      <ellipse cx="391" cy="350" rx="81" ry="41" fill="#d8cdf8" opacity=".2" />
      <ellipse cx="391" cy="350" rx="57" ry="28" fill="#cfff5e" opacity=".16" className="ac-aw-selection-glow" />
      <g className="ac-aw-fruit ac-aw-fruit-mango">
        <path d="M358 286C335 257 347 218 378 210 411 197 433 219 426 245 420 276 380 303 358 286Z" fill={`url(#${id}-mango)`} />
        <path d="M383 211Q406 175 429 196Q401 203 383 211Z" fill="#9ac85c" />
        <path d="M363 242Q360 225 378 219" fill="none" stroke="#fff5b6" strokeWidth="5" strokeLinecap="round" opacity=".7" />
      </g>
      <g className="ac-aw-fruit ac-aw-fruit-guava">
        <ellipse cx="489" cy="298" rx="38" ry="44" transform="rotate(24 489 298)" fill="#b8d36c" />
        <ellipse cx="489" cy="298" rx="29" ry="35" transform="rotate(24 489 298)" fill="#ef989f" />
        <ellipse cx="489" cy="298" rx="19" ry="24" transform="rotate(24 489 298)" fill="#f7b4ab" />
        <path d="M484 284 487 288M499 287 496 291M482 302 486 302M492 311 493 307M502 300 498 300" stroke="#a45c70" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g className="ac-aw-fruit ac-aw-fruit-chilli">
        <path d="M300 319C321 305 339 303 340 316 338 337 312 363 265 358 287 349 297 330 300 319Z" fill={`url(#${id}-chilli)`} />
        <path d="M337 314Q348 294 358 299" fill="none" stroke="#aaca62" strokeWidth="6" strokeLinecap="round" />
        <path d="M314 322Q305 340 292 347" fill="none" stroke="#ffd6bf" strokeWidth="3" strokeLinecap="round" opacity=".65" />
      </g>
    </g>
    <g className="ac-aw-fruit ac-aw-orbit-slice">
      <path d="M190 236Q238 205 267 245Q225 282 190 236Z" fill="#bbd66b" />
      <path d="M199 235Q236 216 255 244Q224 268 199 235Z" fill="#f8b894" />
      <path d="M220 235 224 246M233 231 233 242M243 236 240 246" stroke="#b4666c" strokeWidth="2" strokeLinecap="round" />
    </g>
    <g className="ac-aw-floating-dot"><circle cx="580" cy="360" r="9" fill="#cfff5e" /><circle cx="580" cy="360" r="20" fill="none" stroke="#cfff5e" strokeOpacity=".23" /></g>
    <Palm x={614} y={432} size={.88} />
    <path d="M144 422 171 408 197 422 171 436Z" fill="#c6b3f5" opacity=".45" />
  </>;
}

function Packing({ id }: ArtProps) {
  return <>
    <SceneLabel number="02" title="Semak & packing" />
    <g className="ac-aw-layer ac-aw-warehouse">
      <path d="M182 211 348 127 527 218 360 303Z" fill={`url(#${id}-roof)`} />
      <path d="M182 211V345L360 437V303Z" fill="#615379" />
      <path d="M360 303 527 218V353L360 437Z" fill="#423b56" />
      <path d="M193 208 348 137 514 218 359 294Z" fill="none" stroke="#eee7ff" strokeOpacity=".23" />
      <path d="M199 271 346 347V370L199 294Z" fill="#cfff5e" />
      <path d="M199 294 346 370 366 360 219 284Z" fill="#9cae50" />
      <path d="M214 300V360L264 386V326Z" fill="#25262c" />
      <path d="M225 316V358L254 373V332Z" fill="#fbc77e" opacity=".6" />
      <path d="M388 306 475 262V359L388 403Z" fill="#22232c" />
      <path d="M397 311 466 276V288L397 323ZM397 331 466 296V308L397 343ZM397 351 466 316V328L397 363Z" fill="#73618c" />
      <path d="M488 252V366M505 243V357" stroke="#89799c" strokeWidth="5" />
    </g>
    <g className="ac-aw-layer ac-aw-conveyor">
      <path d="M337 370 492 290 640 365 483 446Z" fill="#363641" />
      <path d="M337 370V392L483 468V446Z" fill="#847496" />
      <path d="M483 446 640 365V387L483 468Z" fill="#544860" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(index => <path key={index} d={`M${351 + index * 19} ${368 - index * 10}l126 65`} stroke="#9990a6" strokeWidth="5" strokeLinecap="round" />)}
      <path d="M353 389V434M466 449V491M622 393V432" stroke="#4c465d" strokeWidth="9" />
      <Parcel x={417} y={331} size={.78} className="ac-aw-parcel-flow ac-aw-parcel-first" />
      <Parcel x={513} y={380} size={.78} className="ac-aw-parcel-flow ac-aw-parcel-second" />
      <path d="M511 311V230L552 209 595 230V353" fill="none" stroke="#c3b0e2" strokeWidth="11" strokeLinejoin="round" />
      <path d="M518 276 588 312" fill="none" stroke="#cfff5e" strokeWidth="3" className="ac-aw-scan-line" />
      <circle cx="551" cy="221" r="4" fill="#cfff5e" className="ac-aw-status-light" />
    </g>
    <Parcel x={177} y={390} size={.8} /><Parcel x={229} y={416} size={.8} /><Parcel x={177} y={349} size={.8} />
    <Palm x={660} y={443} size={.73} />
    <g className="ac-aw-label" transform="translate(527 469)"><path d="M0 0 86-43" stroke="#cfff5e" strokeWidth="2" /><text x="0" y="22" fill="#d6cce8">PILIH · SEMAK · PACK</text></g>
  </>;
}

function Delivery({ id }: ArtProps) {
  return <>
    <SceneLabel number="03" title="Sampai ke anda" />
    <path d="M134 323 319 232 671 409 486 502Z" fill="#373641" stroke="#8d839f" strokeWidth="2" />
    <path d="M156 323 319 243 649 409M649 409 486 490 157 323" fill="none" stroke="#a99bbb" strokeWidth="2" />
    <path d="M220 322 319 273 585 409 487 458" fill="none" stroke="#cfff5e" strokeWidth="3" strokeDasharray="11 13" className="ac-aw-route" />
    <g className="ac-aw-layer ac-aw-van">
      <ellipse cx="393" cy="401" rx="112" ry="39" fill="#14151d" opacity=".7" />
      <path d="M276 276 358 235 474 294 393 335Z" fill={`url(#${id}-lime)`} />
      <path d="M276 276V351L393 411V335Z" fill="#adcf56" />
      <path d="M393 335 474 294 512 345V384L430 426 393 411Z" fill="#8aab43" />
      <path d="M474 294 492 315 413 355 393 335Z" fill="#d4ef95" />
      <path d="M404 357 488 315 503 344 420 386Z" fill="#292d3b" />
      <path d="M449 336 465 329 480 357 464 365Z" fill="#68716f" opacity=".75" />
      <path d="M293 294 356 326V357L293 325Z" fill="#d0e87e" />
      <path d="M319 340 350 356" stroke="#73953c" strokeWidth="3" strokeLinecap="round" />
      <path d="M421 389 504 347V378L430 416Z" fill="#bddb75" />
      <path d="M433 393 451 384V393L436 401ZM485 368 499 360V370L488 377Z" fill="#ffe6b3" />
      <path d="M456 394 480 382" stroke="#4f6540" strokeWidth="6" />
      <ellipse cx="316" cy="376" rx="17" ry="23" transform="rotate(-25 316 376)" fill="#21232c" />
      <ellipse cx="316" cy="376" rx="8" ry="12" transform="rotate(-25 316 376)" fill="#a5a1b2" className="ac-aw-wheel" />
      <ellipse cx="412" cy="425" rx="17" ry="23" transform="rotate(-25 412 425)" fill="#21232c" />
      <ellipse cx="412" cy="425" rx="8" ry="12" transform="rotate(-25 412 425)" fill="#a5a1b2" className="ac-aw-wheel" />
      <path d="M504 381 524 371" stroke="#dfd7ee" strokeWidth="5" strokeLinecap="round" />
    </g>
    <g className="ac-aw-waypoint ac-aw-waypoint-first" transform="translate(224 320)">
      <ellipse cy="8" rx="25" ry="12" fill="#cfff5e" opacity=".15" />
      <path d="M0-20C-42-56-18-86 0-86S42-56 0-20Z" fill="#c6b3f5" /><circle cy="-61" r="9" fill="#615079" />
    </g>
    <g className="ac-aw-waypoint ac-aw-waypoint-second" transform="translate(591 414)">
      <ellipse cy="8" rx="25" ry="12" fill="#cfff5e" opacity=".15" />
      <path d="M0-20C-42-56-18-86 0-86S42-56 0-20Z" fill="#cfff5e" /><circle cy="-61" r="9" fill="#688739" />
    </g>
    <Palm x={165} y={391} size={.8} /><Palm x={583} y={287} size={.7} />
    <g className="ac-aw-label" transform="translate(289 488)"><text fill="#d6cce8">DISPATCH → PICKUP / DELIVERY</text></g>
    <path d="M245 390 268 402M225 400 258 417M464 272 490 285" stroke="#cfbedf" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" className="ac-aw-speed-lines" />
  </>;
}

function Shop({ x, y, size = 1, accent = 'lime' }: { x: number; y: number; size?: number; accent?: 'lime' | 'purple' | 'orange' }) {
  const colors = { lime: ['#d6ef91', '#aac956'], purple: ['#c4b0ed', '#8c73b5'], orange: ['#ffd095', '#e8a25d'] }[accent];
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M-65-105 0-139 83-96 18-62Z" fill="#b3a3cf" />
    <path d="M-65-105V-13L18 30V-62Z" fill="#79668e" />
    <path d="M18-62 83-96V-4L18 30Z" fill="#51465f" />
    <path d="M-72-75 10-32 22-51-60-94Z" fill={colors[0]} />
    <path d="M-72-75V-62L10-19V-32Z" fill={colors[1]} />
    <path d="M-55-57-24-41V-3L-55-19Z" fill="#ffc883" opacity=".83" />
    <path d="M-16-37 5-26V14L-16 3Z" fill="#252730" />
    <path d="M-40-49V-11M-55-36-24-20" stroke="#795c68" strokeWidth="3" />
    <path d="M33-54 63-69V-31L33-16Z" fill="#bdafd3" opacity=".5" />
    <path d="M18 30 83-4" stroke={colors[1]} strokeWidth="3" />
  </g>;
}

function Network() {
  return <>
    <SceneLabel number="04" title="Rangkaian kita" />
    <g className="ac-aw-connections" fill="none" strokeLinecap="round">
      <path d="M230 346 416 443 608 346 416 249 230 346Z" stroke="#aaa0bc" strokeOpacity=".25" strokeWidth="19" />
      <path d="M230 346 416 443 608 346 416 249 230 346Z" stroke="#cfff5e" strokeWidth="3" strokeDasharray="6 12" className="ac-aw-network-route" />
      <path d="M230 346 608 346M416 249V443" stroke="#c6b3f5" strokeWidth="2" strokeDasharray="5 10" className="ac-aw-network-route ac-aw-network-secondary" />
    </g>
    <g className="ac-aw-layer ac-aw-shop-back"><Shop x={413} y={269} size={.75} accent="purple" /></g>
    <g className="ac-aw-layer ac-aw-shop-left"><Shop x={231} y={351} size={1.03} /></g>
    <g className="ac-aw-layer ac-aw-shop-right"><Shop x={608} y={351} size={1.03} accent="orange" /></g>
    <g className="ac-aw-layer ac-aw-shop-front"><Shop x={415} y={449} size={.9} accent="purple" /></g>
    {[{ x: 231, y: 368 }, { x: 415, y: 287 }, { x: 608, y: 368 }, { x: 415, y: 465 }].map((point, index) => <g key={index} transform={`translate(${point.x} ${point.y})`}>
      <ellipse rx="16" ry="8" fill="#cfff5e" opacity=".16" className={`ac-aw-network-pulse ac-aw-network-pulse-${index}`} />
      <ellipse rx="5" ry="2.5" fill="#cfff5e" />
    </g>)}
    <Palm x={144} y={400} size={.7} /><Palm x={677} y={401} size={.76} />
    <g className="ac-aw-label" transform="translate(451 501)"><text fill="#d6cce8">PELANGGAN · EJEN · STOKIS</text></g>
  </>;
}

const SCENES = [Selection, Packing, Delivery, Network] as const;
const SCENE_NAMES = ['produk', 'packing', 'penghantaran', 'rangkaian'] as const;

/** An explanatory illustration, independent of live orders, inventory or network data. */
export default function AnimatedColekWorld({ active, phase, direction, paused }: AnimatedColekWorldProps) {
  const id = `ac-aw-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scene = Number.isFinite(active) ? Math.max(0, Math.min(3, Math.trunc(active))) : 0;
  return <div className="ac-animated-world" data-active-scene={SCENE_NAMES[scene]} data-animation={paused ? 'paused' : 'running'} data-phase={phase} data-direction={direction} aria-hidden="true" style={{ '--ac-aw-direction': direction } as CSSProperties}>
    <svg className="ac-aw-canvas" viewBox="0 0 800 600" fill="none" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-ground`} x1="400" y1="258" x2="400" y2="551" gradientUnits="userSpaceOnUse"><stop stopColor="#393540" /><stop offset="1" stopColor="#24252b" /></linearGradient>
        <linearGradient id={`${id}-roof`} x1="245" y1="166" x2="460" y2="379" gradientUnits="userSpaceOnUse"><stop stopColor="#d4c6ef" /><stop offset="1" stopColor="#927cae" /></linearGradient>
        <linearGradient id={`${id}-lime`} x1="310" y1="238" x2="454" y2="334" gradientUnits="userSpaceOnUse"><stop stopColor="#e8ffab" /><stop offset="1" stopColor="#b9df60" /></linearGradient>
        <linearGradient id={`${id}-mango`} x1="357" y1="214" x2="420" y2="285" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe2a1" /><stop offset=".55" stopColor="#f7b760" /><stop offset="1" stopColor="#e78c48" /></linearGradient>
        <linearGradient id={`${id}-chilli`} x1="293" y1="314" x2="310" y2="358" gradientUnits="userSpaceOnUse"><stop stopColor="#ffae88" /><stop offset="1" stopColor="#e56758" /></linearGradient>
        <radialGradient id={`${id}-halo`}><stop stopColor="#ae95d3" stopOpacity=".15" /><stop offset="1" stopColor="#ae95d3" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="413" cy="335" rx="340" ry="250" fill={`url(#${id}-halo)`} />
      <g className="ac-aw-ground">
        <ellipse cx="401" cy="502" rx="294" ry="56" fill="#0a0d15" opacity=".36" />
        <path d="M70 375 400 210 730 375V417L400 583 70 417Z" fill="#1e1f27" />
        <path d="M70 375 400 210 730 375 400 541Z" fill={`url(#${id}-ground)`} stroke="#796d8c" strokeOpacity=".4" />
        <path d="M70 375 400 541 730 375M400 541V583" stroke="#b3a3cf" strokeOpacity=".2" />
        {[0, 1, 2, 3, 4].map(index => <g key={index} stroke="#aaa0bc" strokeOpacity=".065"><path d={`M${125 + index * 55} ${348 - index * 27.5}l330 166`} /><path d={`M${455 + index * 55} ${237.5 + index * 27.5}l-330 165`} /></g>)}
        <path d="M104 405 244 476" stroke="#cfff5e" strokeOpacity=".42" strokeWidth="2" />
      </g>
      {SCENES.map((Scene, index) => <g key={SCENE_NAMES[index]} className={`ac-aw-scene${scene === index ? ' is-active' : ''}`} data-scene={SCENE_NAMES[index]}><Scene id={id} /></g>)}
      <g className="ac-aw-label ac-aw-art-caption" transform="translate(85 555)"><circle cy="-3" r="3" fill="#cfff5e" /><text x="12" fill="#bdb4ce">ILUSTRASI PERJALANAN</text></g>
    </svg>
  </div>;
}
