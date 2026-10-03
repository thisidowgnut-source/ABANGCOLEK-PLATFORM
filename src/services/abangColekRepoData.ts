/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ABANG COLEK OFFICIAL REPOSITORY DATA & WOCS INTELLIGENCE SERVICE
 * Extracted directly from https://github.com/thisisniagahub/ABANG-COLEK.git
 */

export interface TikTokViralHook {
  id: string;
  text: string;
  tags: string[];
  performance: {
    views: number;
    likes: number;
    shares: number;
    engagement: number;
  };
  usedCount: number;
  lastUsed?: string;
  createdAt: string;
}

export interface MotivationalQuote {
  id: string;
  quote: string;
  author: string;
  category: "business" | "product" | "growth" | "founder";
}

export interface BrandTagline {
  id: string;
  text: string;
  context: "formal" | "social" | "emotional";
  emoji: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "customer_service" | "event" | "lucky_draw" | "order" | "marketing";
  trigger: string[];
  message: string;
  requiresAdmin: boolean;
  variables?: string[];
  createdAt: string;
}

export interface WocsParsedCommand {
  type: "landing_page" | "app_config" | "agent_task" | "content_schedule" | "report" | "tiktok" | "unknown";
  payload: Record<string, string>;
  raw: string;
  requiresApproval: boolean;
}

export interface WocsExecutionResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  requiresAdminApproval?: boolean;
}

// 1. TikTok Viral Hooks Bank
export const TIKTOK_VIRAL_HOOKS: TikTokViralHook[] = [
  {
    id: "hook-1",
    text: "Pedas sampai menangis tapi masih nak lagi! 🌶️😭",
    tags: ["reaction", "pedas", "viral"],
    performance: { views: 125000, likes: 8900, shares: 450, engagement: 7.5 },
    usedCount: 12,
    createdAt: "2026-01-01T00:00:00Z"
  },
  {
    id: "hook-2",
    text: "Rahsia sambal yang buat pelanggan jatuh cinta 🥭🌶️",
    tags: ["product", "sambal", "tips"],
    performance: { views: 89000, likes: 6200, shares: 320, engagement: 7.3 },
    usedCount: 8,
    createdAt: "2025-12-15T00:00:00Z"
  },
  {
    id: "hook-3",
    text: "Dari booth kecil ke viral TikTok - Journey Abang Colek 📈",
    tags: ["founder", "motivation", "story"],
    performance: { views: 210000, likes: 15400, shares: 890, engagement: 7.8 },
    usedCount: 5,
    createdAt: "2025-11-20T00:00:00Z"
  },
  {
    id: "hook-4",
    text: "3 cara makan Colek yang ramai tak tahu! 🤯",
    tags: ["tips", "product", "viral"],
    performance: { views: 156000, likes: 11200, shares: 670, engagement: 7.6 },
    usedCount: 15,
    createdAt: "2026-01-10T00:00:00Z"
  },
  {
    id: "hook-5",
    text: "Behind the scenes: Prep 100 boxes untuk event 🎪",
    tags: ["bts", "event", "hustle"],
    performance: { views: 67000, likes: 4800, shares: 210, engagement: 7.5 },
    usedCount: 6,
    createdAt: "2026-01-05T00:00:00Z"
  },
  {
    id: "hook-6",
    text: "Customer reaction: First time try Jumbo Colek! 😱",
    tags: ["reaction", "customer", "jumbo"],
    performance: { views: 98000, likes: 7100, shares: 380, engagement: 7.7 },
    usedCount: 10,
    createdAt: "2026-01-12T00:00:00Z"
  },
  {
    id: "hook-7",
    text: "POV: Kau order level pedas 10 🔥💀",
    tags: ["pov", "pedas", "challenge"],
    performance: { views: 187000, likes: 13200, shares: 720, engagement: 7.5 },
    usedCount: 18,
    createdAt: "2025-12-25T00:00:00Z"
  },
  {
    id: "hook-8",
    text: "Kenapa sambal kami MANIS dulu baru PEDAS? 🥭🌶️",
    tags: ["product", "education", "unique"],
    performance: { views: 143000, likes: 9800, shares: 540, engagement: 7.2 },
    usedCount: 9,
    createdAt: "2025-12-18T00:00:00Z"
  },
  {
    id: "hook-9",
    text: "Bila customer tanya 'Ada yang kurang pedas tak?' 😅",
    tags: ["funny", "customer", "relatable"],
    performance: { views: 112000, likes: 8100, shares: 410, engagement: 7.4 },
    usedCount: 7,
    createdAt: "2026-01-08T00:00:00Z"
  },
  {
    id: "hook-10",
    text: "Setup booth dari pagi sampai malam - Worth it! 💪",
    tags: ["hustle", "bts", "motivation"],
    performance: { views: 45000, likes: 3200, shares: 150, engagement: 7.4 },
    usedCount: 4,
    createdAt: "2025-11-10T00:00:00Z"
  }
];

// 2. Motivational Quotes Bank
export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  { id: "1", quote: "Rasa Sekali, Jatuh Cinta Selamanya", author: "Abang Colek", category: "product" },
  { id: "2", quote: "Pedas Manis Likat Melekat - Macam perniagaan, kena ada balance!", author: "Founder (Epull)", category: "business" },
  { id: "3", quote: "Setiap event adalah peluang untuk buat customer jatuh cinta", author: "Founder (Epull)", category: "growth" },
  { id: "4", quote: "Dari dapur rumah ke seluruh Malaysia - Mimpi boleh jadi kenyataan", author: "Founder Story", category: "founder" },
  { id: "5", quote: "Bukan calang-calang pedas, bukan calang-calang usahawan", author: "Abang Colek", category: "business" },
  { id: "6", quote: "Konsisten macam rasa sambal kita - Hari-hari padu!", author: "Founder (Epull)", category: "growth" },
  { id: "7", quote: "Setiap booth adalah stage untuk showcase passion kita", author: "Founder (Epull)", category: "business" },
  { id: "8", quote: "Sticky macam sambal, memorable macam brand", author: "Abang Colek", category: "product" }
];

// 3. Taglines
export const BRAND_TAGLINES: BrandTagline[] = [
  { id: "1", text: "Rasa Padu, Pedas Menggamit", context: "formal", emoji: "🌶️" },
  { id: "2", text: "PEDAS MANIS LIKAT MELEKAT", context: "social", emoji: "🌶️🥭" },
  { id: "3", text: "Rasa Sekali Jatuh Cinta Selamanya", context: "emotional", emoji: "❤️" },
  { id: "4", text: "Pedas Tapi Puas", context: "social", emoji: "🌶️" },
  { id: "5", text: "Colek Sampai Licin", context: "social", emoji: "🥭" },
  { id: "6", text: "Bukan Calang-Calang Pedas", context: "formal", emoji: "🌶️" }
];

// 4. Booth Ops Checklists
export const BOOTH_OPS_CHECKLISTS = {
  preEvent: [
    "Semak inventory sambal (kiraan botol/pek)",
    "Sediakan kelengkapan booth (meja, kain skirting, banner, standee)",
    "Print QR code untuk cabutan bertuah (lucky draw)",
    "Cas penuh power bank, terminal kad dan phone",
    "Sediakan tunai apung / cash float (duit kecil)",
    "Bungkus merchandise (sticker, flyer, business card)",
    "Siapkan cooler box bersama ice pack",
    "Brief staff tentang USP produk dan struktur pricing",
    "Uji kelancaran sistem pembayaran DuitNow QR pay",
    "Sediakan shot list untuk rakaman video TikTok"
  ],
  duringEvent: [
    "Setup booth dan susun produk 30 minit sebelum acara bermula",
    "Display produk secara bertingkat dan kemas",
    "Pasang banner dan standee di laluan utama",
    "Sambut pelanggan dengan senyuman dan sapaan mesra",
    "Rakam reaksi jujur pelanggan semasa ujian rasa percuma",
    "Promote pendaftaran kod QR lucky draw",
    "Pantau stok sambal setiap 2 jam",
    "Jalin hubungan baik dengan pelanggan (community building)",
    "Rakam detik-detik behind-the-scenes",
    "Catat soalan lazim dan maklum balas pelanggan"
  ],
  postEvent: [
    "Kemas semua peralatan dengan rapi dan selamat",
    "Kira jumlah jualan tunai + QR dan baki stok",
    "Kumpul borang maklum balas dan ulasan",
    "Pindahkan video rakaman dari phone ke storan",
    "Kemas kini sistem inventori",
    "Ucap terima kasih kepada Event Organizer (EO) dan simpan kontak",
    "Muat naik sorotan video ke TikTok dan Instagram",
    "Buat post-mortem: apa yang berjaya dan apa yang perlu ditambah baik",
    "Rehat dan raikan pencapaian hari ini! 🎉"
  ]
};

// 5. WhatsApp Message Templates
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "cs-welcome",
    name: "Welcome Message",
    category: "customer_service",
    trigger: ["hi", "hello", "hey", "assalamualaikum", "salam"],
    message: `Assalamualaikum! 🌶️
Terima kasih kerana hubungi *Abang Colek*!
Kami sedia bantu anda:
1️⃣ Info produk & harga
2️⃣ Lokasi event & booth
3️⃣ Lucky draw & promosi
4️⃣ Tempah order

_"PEDAS MANIS STAYS"_ 🥭🌶️
Sila taip nombor atau soalan anda!`,
    requiresAdmin: false,
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "cs-product-info",
    name: "Product Information & Pricing",
    category: "customer_service",
    trigger: ["produk", "product", "sambal", "harga", "price", "berapa"],
    message: `🌶️ *ABANG COLEK - SAMBAL COLEK*

✨ *Pilihan Produk Kami:*
• Sambal Colek Original (Pedas Manis)
• Sambal Colek Extra Pedas 🔥
• Sambal Colek Mango Twist 🥭

📦 *Saiz & Harga Rasmi:*
• 250ml - RM15
• 500ml - RM28
• 1 Liter - RM50

🎁 *Promosi Hari Ini:*
Beli 3 botol PERCUMA 1 botol!

💬 Nak order? Sila balas *"ORDER"* sekarang!`,
    requiresAdmin: false,
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "cs-location",
    name: "Event & Booth Location",
    category: "customer_service",
    trigger: ["lokasi", "location", "event", "booth", "mana", "where"],
    message: `📍 *LOKASI BOOTH ABANG COLEK*

Kami kini beroperasi di:
📅 *Event Semasa:*
{current_events}

📢 Ikuti TikTok rasmi kami untuk siaran langsung:
@styloairpool

🔔 Ingin makluman acara baharu? Balas *"DAFTAR EVENT"*`,
    requiresAdmin: false,
    variables: ["current_events"],
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "event-register",
    name: "Event Registration",
    category: "event",
    trigger: ["daftar event", "register event", "join event"],
    message: `📝 *PENDAFTARAN ACARA ABANG COLEK*

Terima kasih berminat hadir! Sila berikan maklumat berikut:
1. Nama penuh:
2. Nombor telefon WhatsApp:
3. Acara pilihan:

Contoh:
Ahmad bin Ali
0123456789
Makan Fest KL Gateway

Admin kami akan sahkan pendaftaran dalam tempoh 24 jam! ✅`,
    requiresAdmin: false,
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "lucky-draw-info",
    name: "Lucky Draw Campaign Info",
    category: "lucky_draw",
    trigger: ["lucky draw", "cabutan", "contest", "hadiah", "prize", "menang"],
    message: `🎁 *LUCKY DRAW ABANG COLEK*

*Hadiah Utama:*
1 TAHUN BEKALAN PERCUMA ABANG COLEK!
(12 botol x 12 bulan)

*Syarat Penyertaan:*
1️⃣ Ikuti @styloairpool di TikTok
2️⃣ Kongsi video kami ke Story anda
3️⃣ Tag 3 orang rakan di ruang komen
4️⃣ Isi borang pendaftaran: {form_link}

*Tarikh Tutup:* {end_date}
Balas *"JOIN LUCKY DRAW"* untuk terima pautan borang!`,
    requiresAdmin: false,
    variables: ["form_link", "end_date"],
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "order-inquiry",
    name: "Order Inquiry & Booking",
    category: "order",
    trigger: ["order", "beli", "buy", "nak beli", "tempah", "booking"],
    message: `🛒 *TEMPAHAN RASMI ABANG COLEK*

Terima kasih atas sokongan! Sila kemukakan butiran pesanan anda:
1. Produk & Saiz:
2. Kuantiti:
3. Alamat Penghantaran:
4. Nama Penerima:
5. Nombor Telefon:

Contoh:
Sambal Colek Original 500ml
3 botol
No 12, Jalan Sultan Ismail, 50250 KL
Ahmad
0123456789

Admin kami akan kirakan sebut harga rasmi + caj pos laju! 📦`,
    requiresAdmin: false,
    createdAt: "2026-01-16T00:00:00Z"
  },
  {
    id: "order-confirmation",
    name: "Order Confirmation & Bank Details",
    category: "order",
    trigger: [],
    message: `✅ *PESANAN DISAHKAN*

Terima kasih {customer_name}!

*Ringkasan Pesanan:*
{order_details}

*Jumlah Keseluruhan: RM{total}* (Termasuk kos penghantaran)

*Akaun Pembayaran Rasmi:*
Bank: *Maybank*
No. Akaun: *1234567890*
Nama Pemegang: *Liurleleh House*

Sila muat naik resit transaksi selepas bayaran dibuat. Nombor penjejakan kurier akan diberikan dalam 1-2 hari bekerja. 📦`,
    requiresAdmin: true,
    variables: ["customer_name", "order_details", "total"],
    createdAt: "2026-01-16T00:00:00Z"
  }
];

// 6. Official Audio Anthem Metadata
export const OFFICIAL_AUDIO_IDENTITY = {
  title: "Kasi Lagi-Lagi",
  artist: "Abang Colek",
  company: "Liurleleh House",
  genre: "Hip-Hop / Trap Anthem",
  style: "Punchy, confident chant hook",
  production: "Tight 808s, crisp percussion, minimal synth",
  bpm: "85-95",
  duration: "1:00",
  audioUrl: "/audio/kasi-lagi-lagi.mp3",
  lyricsSnippet: `ABANG CHO-LEK! SAMBAL CHO-LEK! PEDAS! PADU! SEKALI RASA. YOU KNOW. PEDAS MANIS. STAYS.`
};

// 7. WOCS Command Parser (Mirror of server/wocs/commandParser.ts)
export function parseWocsCommand(raw: string): WocsParsedCommand {
  const trimmed = raw.trim();
  const normalized = trimmed.replace(/^\/+/, "");
  const [keyword, ...rest] = normalized.split(/\s+/);

  const payload: Record<string, string> = {};
  for (const token of rest) {
    const [key, ...valParts] = token.split("=");
    if (key && valParts.length > 0) {
      payload[key.trim()] = valParts.join("=").trim();
    }
  }

  if (!keyword) {
    return { type: "unknown", payload: {}, raw, requiresApproval: false };
  }

  switch (keyword.toLowerCase()) {
    case "landing":
      return { type: "landing_page", payload, raw, requiresApproval: true };
    case "config":
      return { type: "app_config", payload, raw, requiresApproval: true };
    case "assign":
      return { type: "agent_task", payload, raw, requiresApproval: false };
    case "schedule":
      return { type: "content_schedule", payload, raw, requiresApproval: false };
    case "report":
      return { type: "report", payload, raw, requiresApproval: false };
    case "tiktok":
      return { type: "tiktok", payload, raw, requiresApproval: false };
    default:
      return { type: "unknown", payload, raw, requiresApproval: false };
  }
}

// 8. WOCS Executor Simulation (Mirror of server/wocs/executors.ts)
export function executeWocsCommand(cmd: WocsParsedCommand): WocsExecutionResult {
  switch (cmd.type) {
    case "landing_page": {
      const pageSlug = cmd.payload.pageSlug || "promo-merdeka";
      return {
        ok: true,
        message: `Draf versi Landing Page untuk [${pageSlug}] telah disimpan ke pangkalan data wocs_landing_versions.`,
        requiresAdminApproval: true,
        data: { pageSlug, version: Date.now(), status: "draft" }
      };
    }
    case "app_config": {
      const configKey = cmd.payload.configKey || "featureFlags";
      return {
        ok: true,
        message: `Konfigurasi aplikasi [${configKey}] dikemas kini secara automatik.`,
        requiresAdminApproval: true,
        data: { configKey, updatedBy: "Admin WOCS", status: "applied" }
      };
    }
    case "agent_task": {
      const task = cmd.payload.task || "Semak inventori cawangan";
      const agent = cmd.payload.agent || "Agent-Siti";
      return {
        ok: true,
        message: `Tugasan [${task}] berjaya diagihkan kepada [${agent}].`,
        data: { agent, task, status: "assigned", timestamp: new Date().toISOString() }
      };
    }
    case "content_schedule": {
      const date = cmd.payload.date || "Esok 8:00 PM";
      const hook = cmd.payload.hook || "hook-1";
      return {
        ok: true,
        message: `Jadual kandungan video TikTok telah didaftarkan untuk [${date}] menggunakan cangkuk [${hook}].`,
        data: { date, hook, platform: "tiktok", scheduled: true }
      };
    }
    case "report": {
      const range = cmd.payload.range || "7d";
      return {
        ok: true,
        message: `Laporan prestasi jualan bagi julat [${range}] berjaya dijana.`,
        data: { range, generatedAt: new Date().toISOString(), status: "ready" }
      };
    }
    case "tiktok": {
      const action = cmd.payload.action || "create_draft";
      return {
        ok: true,
        message: `Tindakan TikTok [${action}] telah dimasukkan ke dalam barisan giliran pemprosesan.`,
        data: { action, queueStatus: "enqueued" }
      };
    }
    default:
      return {
        ok: false,
        message: `Arahan [${cmd.raw}] tidak dikenali. Taip /help atau cuba /landing, /config, /assign, /schedule, /report, atau /tiktok.`
      };
  }
}

// 9. Official 15-Slide Investor & Brand Pitch Deck (From abang-colek-brand-os presetData)
export interface PitchDeckSlide {
  id: string;
  slideNumber: number;
  title: string;
  category: "Vision" | "Market" | "Product" | "Strategy" | "Traction";
  body: string;
  highlight?: string;
}

export const PITCH_DECK_SLIDES: PitchDeckSlide[] = [
  {
    id: "slide-1",
    slideNumber: 1,
    title: "ABANG COLEK",
    category: "Vision",
    body: "Street Taste. Real Talk.\nBold street food brand built from the ground up.",
    highlight: "Street Taste. Real Talk."
  },
  {
    id: "slide-2",
    slideNumber: 2,
    title: "What We Are",
    category: "Vision",
    body: "Abang Colek ialah jenama street food berasaskan rasa ekstrem + karakter manusia, dibina melalui interaksi sebenar di jalanan dan dikuatkan oleh kandungan viral.",
    highlight: "Rasa Ekstrem + Karakter Manusia"
  },
  {
    id: "slide-3",
    slideNumber: 3,
    title: "Founder",
    category: "Vision",
    body: "Megat Shaifulreza — Pengasas & Wajah Jenama (Liurleleh House).\nFounder yang turun padang, menjual sendiri, bercakap sendiri, dan membina kepercayaan terus dengan pelanggan.",
    highlight: "Founder Turun Padang"
  },
  {
    id: "slide-4",
    slideNumber: 4,
    title: "Market Problem",
    category: "Market",
    body: "Street food banyak.\nJenama kuat, sedikit.\nRasa ada, karakter tiada.",
    highlight: "Street Food Banyak, Karakter Tiada"
  },
  {
    id: "slide-5",
    slideNumber: 5,
    title: "Our Answer",
    category: "Product",
    body: "Kami tidak jual makanan semata-mata.\nKami jual pengalaman, cabaran rasa, dan cerita persahabatan di jalanan.",
    highlight: "Pengalaman & Cabaran Rasa"
  },
  {
    id: "slide-6",
    slideNumber: 6,
    title: "Product Truth",
    category: "Product",
    body: "Pedas kami bukan gimik.\nReaksi tulen pelanggan adalah iklan terbaik yang tidak boleh dibeli dengan wang.",
    highlight: "Reaksi Pelanggan Ialah Iklan Terbaik"
  },
  {
    id: "slide-7",
    slideNumber: 7,
    title: "Brand DNA",
    category: "Strategy",
    body: "Pedas • Berani • Kelakar • Street\nEmpat tonggak yang membentuk setiap botol dan setiap interaksi gerai.",
    highlight: "Pedas • Berani • Kelakar • Street"
  },
  {
    id: "slide-8",
    slideNumber: 8,
    title: "Content Engine",
    category: "Strategy",
    body: "TikTok sebagai enjin utama.\nReaksi sebenar. Tiada skrip. Tiada lakonan. 100% natural engagement.",
    highlight: "Tiada Skrip, Tiada Lakonan"
  },
  {
    id: "slide-9",
    slideNumber: 9,
    title: "Target Audience",
    category: "Market",
    body: "Gen Z & Millennial urban.\nPeminat street culture dan makanan pedas.\nPencari pengalaman rasa, bukan produk kosong.",
    highlight: "Gen Z & Millennial Street Culture"
  },
  {
    id: "slide-10",
    slideNumber: 10,
    title: "Traction & Bukti Pasaran",
    category: "Traction",
    body: "Booth penuh sesak.\nVideo tular mencecah jutaan tontonan.\nKadar belian ulangan (repeat customer) yang luar biasa.",
    highlight: "Booth Penuh & Repeat Customer Tinggi"
  },
  {
    id: "slide-11",
    slideNumber: 11,
    title: "Competitive Edge",
    category: "Strategy",
    body: "Resipi dan rasa mungkin boleh ditiru pesaing.\nTetapi karakter, jiwa, dan ikatan founder dengan komuniti tidak boleh ditiru.",
    highlight: "Rasa Boleh Ditiru, Karakter Tidak"
  },
  {
    id: "slide-12",
    slideNumber: 12,
    title: "Expansion Pipeline",
    category: "Strategy",
    body: "Pop-up Event Tour → Barangan Dagangan (Merch) → Lagu Jenama Viral → Media & Francais Hab Serantau.",
    highlight: "Ekspres Bas Logistics & Ejen Hab"
  },
  {
    id: "slide-13",
    slideNumber: 13,
    title: "Vision 2026",
    category: "Vision",
    body: "Menjadi ikon street food Malaysia yang mempunyai tapak budaya (cultural footprint) kukuh di serata Nusantara.",
    highlight: "Cultural Footprint Street Food"
  },
  {
    id: "slide-14",
    slideNumber: 14,
    title: "Closing Statement",
    category: "Vision",
    body: "ABANG COLEK\nBukan semua orang tahan. Berani rasa, kau faham.",
    highlight: "Bukan Semua Orang Tahan"
  },
  {
    id: "slide-15",
    slideNumber: 15,
    title: "Hubungan & Rangkaian",
    category: "Traction",
    body: "TikTok: @styloairpool (75.2K Followers)\nInstagram: @abangcolek\nWhatsApp HQ: 6019-XXX-XXXX\nOperasi: Liurleleh House Malaysia",
    highlight: "@styloairpool | Liurleleh House"
  }
];

// 10. Official Brand Manifestos
export const BRAND_MANIFESTOS = [
  {
    id: "manifesto-1",
    title: "Manifesto Rasa Jujur (Varian 1)",
    text: "We believe taste shouldn't lie. Kalau pedas, biar pedas. Kalau berani, tunjuk berani. Kami bukan untuk semua orang — dan itu kekuatan kami.\n\nAbang Colek lahir dari jalanan, hidup dengan manusia, dan berkembang melalui cerita sebenar."
  },
  {
    id: "manifesto-2",
    title: "Manifesto Budaya Jalanan (Varian 2)",
    text: "Street taste bukan trend. Ia budaya.\n\nKami bina jenama dengan reaksi sebenar, bukan lakonan. Kami menang dengan karakter, bukan kosmetik.\n\nAbang Colek: pedas yang jujur, berani yang konsisten."
  }
];

// 11. TikTok SOP Posting Cadence & Golden Rules
export const TIKTOK_WEEKLY_CADENCE = [
  { day: "Isnin", focus: "First Bite Reaction", description: "Fokus ekspresi muka pelanggan, gigitan pertama mangga/jambu bersalut kuah pekat." },
  { day: "Rabu", focus: "Pedas Challenge", description: "Ujian keberanian pelanggan mencuba kuah pedas ekstra level 10 tanpa minum air." },
  { day: "Jumaat", focus: "Founder Moment", description: "Megat Shaifulreza bercakap santai, menyakat pelanggan, atau berkongsi tips bisnes jalanan." },
  { day: "Sabtu", focus: "Crowd Energy & Booth Hype", description: "Suasana gerai pack, barisan beratur panjang, dan jeritan krew 'KASI LAGI-LAGI!'." }
];

export const TIKTOK_GOLDEN_RULES = [
  "Rakaman telefon pintar sahaja (elak kamera produksi terlalu formal)",
  "Gunakan bahasa pasar dan dialek tempatan santai",
  "Jangan over-polish atau sunting berlebihan",
  "Jangan berlakon atau bayar reaksi palsu — biarkan reaksi tulen",
  "Sentiasa gunakan audio jingle 'Kasi Lagi-Lagi' sebagai sound rasmi"
];

// 12. TikTok Profile Metrics & Bio Architecture (@styloairpool)
export const TIKTOK_PROFILE_METRICS = {
  handle: "@styloairpool",
  brandName: "ABANG COLEK 🥭",
  founderName: "Megat Shaifulreza (Epull)",
  followers: "75.2K",
  likes: "793.2K",
  likesPerFollower: "10.5x (Super High Engagement)",
  bio: "Founder | Motivator 📈\nPEDAS MANIS LIKAT MELEKAT 🌶️🥭\n\"Rasa Sekali Jatuh Cinta Selamanya\"",
  emojiStrategy: [
    { emoji: "🌶️", meaning: "Cili & Pedas Ekstrem" },
    { emoji: "🥭", meaning: "Mangga Lemak Manis Pembeda" },
    { emoji: "📈", meaning: "Pertumbuhan Usahawan & Motivasi" }
  ]
};
