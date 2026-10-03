/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PluginCategory = 
  | 'all'
  | 'email_files'
  | 'creativity_design'
  | 'dev_coding'
  | 'db_analytics'
  | 'travel_booking'
  | 'health_fitness';

export interface PluginItem {
  id: string;
  name: string;
  category: PluginCategory;
  categoryLabel: string;
  developer: string;
  description: string;
  detailedDescription: string;
  installed: boolean;
  enabled: boolean;
  requiresAuth: boolean;
  authType: 'oauth' | 'api_key' | 'token' | 'none';
  connectedAccount: string | null;
  iconType: string;
  accentColor: string;
  capabilities: string[];
  examplePrompts: string[];
  version: string;
  lastUsed?: string;
  rating: number;
  reviewCount: number;
}

const STORAGE_KEY = 'abangcolek_plugins_state_v1';

export const PLUGIN_CATEGORIES: { id: PluginCategory; label: string; count?: number }[] = [
  { id: 'all', label: 'Semua Plugin' },
  { id: 'email_files', label: 'Pengurusan E-mel & Fail' },
  { id: 'creativity_design', label: 'Kreativiti & Reka Bentuk' },
  { id: 'dev_coding', label: 'Pembangunan & Pengekodan' },
  { id: 'db_analytics', label: 'Pangkalan Data & Analitik' },
  { id: 'travel_booking', label: 'Perjalanan & Tempahan' },
  { id: 'health_fitness', label: 'Kesihatan & Kecergasan' },
];

export const INITIAL_PLUGINS: PluginItem[] = [
  // 1. Pengurusan E-mel & Fail
  {
    id: 'gmail',
    name: 'Gmail Workspace',
    category: 'email_files',
    categoryLabel: 'Pengurusan E-mel & Fail',
    developer: 'Google Workspace',
    description: 'Menyambungkan Gmail untuk membaca, merumus, menguruskan peti masuk, dan mendraf respons pelanggan secara langsung.',
    detailedDescription: 'Plugin rasmi Google Gmail membolehkan pembantu AI membaca mesej belum dibaca, mengekstrak aduan pesanan atau pertanyaan ejen borong, dan menghantar draf emel rasmi atas nama perniagaan anda.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: 'thisisabangcolek@gmail.com',
    iconType: 'Mail',
    accentColor: '#EA4335',
    capabilities: ['Baca emel terbaru', 'Cari emel mengikut subjek/pengirim', 'Draf & hantar emel rasmi', 'Rumus bebenang emel'],
    examplePrompts: [
      'Tolong rumuskan e-mel terbaru daripada pembekal botol di Gmail',
      'Cari e-mel permohonan ejen baru dalam tempoh 7 hari lepas',
      'Draf e-mel maklum balas ganti rugi kepada pelanggan di Gmail'
    ],
    version: '2.4.0',
    rating: 4.9,
    reviewCount: 1420
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    category: 'email_files',
    categoryLabel: 'Pengurusan E-mel & Fail',
    developer: 'Google Workspace',
    description: 'Akses fail dokumen (Docs), hamparan (Sheets), fail PDF katalog produk, dan persembahan slaid secara terus.',
    detailedDescription: 'Sambungkan storan awan Google Drive perniagaan anda untuk mencari invois PDF, membaca senarai harga borong, dan memuat turun dokumen SOP pembungkusan makanan secara automatik.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: 'thisisabangcolek@gmail.com',
    iconType: 'HardDrive',
    accentColor: '#4285F4',
    capabilities: ['Cari fail Google Drive', 'Muat turun & baca ringkasan dokumen', 'Susun folder aset perniagaan', 'Segerak dokumen SOP'],
    examplePrompts: [
      'Cari dokumen senarai harga borong kuah colek di Google Drive',
      'Buka fail hamparan inventori stokis terkini dalam Drive',
      'Senaraikan fail PDF katalog produk yang disimpan dalam Google Drive'
    ],
    version: '2.1.2',
    rating: 4.8,
    reviewCount: 980
  },

  // 2. Kreativiti & Reka Bentuk
  {
    id: 'canva',
    name: 'Canva Design Hub',
    category: 'creativity_design',
    categoryLabel: 'Kreativiti & Reka Bentuk',
    developer: 'Canva Pty Ltd',
    description: 'Reka bentuk, semak, dan sunting visual grafik, poster promosi gerai pop-up, dan sepanduk TikTok/Instagram melalui teks.',
    detailedDescription: 'Integrasi terus dengan Canva API untuk menjana templat poster promosi F&B, banner karnival makanan Toppen JB, dan kad ucapan terima kasih pembeli secara automatik dengan dimensi tepat media sosial.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: 'thisisabangcolek@gmail.com (Canva Pro)',
    iconType: 'Palette',
    accentColor: '#00C4CC',
    capabilities: ['Jana templat poster promosi', 'Pilih saiz (Instagram 1:1, Story 9:16, Banner 16:9)', 'Eksport pautan reka bentuk Canva', 'Gandingkan palet jenama'],
    examplePrompts: [
      'Reka poster promosi gerai pop-up Abang Colek di Canva untuk festival Toppen',
      'Bina grafik promosi kombo Jeruk Mangga + Kuah Colek saiz Instagram 1:1',
      'Jana sepanduk jualan kilat ejen 50 botol dengan tema merah pedas'
    ],
    version: '3.1.0',
    rating: 4.9,
    reviewCount: 3200
  },
  {
    id: 'adobe',
    name: 'Adobe Creative Cloud',
    category: 'creativity_design',
    categoryLabel: 'Kreativiti & Reka Bentuk',
    developer: 'Adobe Inc.',
    description: 'Sunting aset visual resolusi tinggi, laras palet warna jenama, dan jana grafik vektor untuk pembungkusan botol.',
    detailedDescription: 'Manfaatkan keupayaan Adobe Express & Firefly untuk menala imej produk kuah colek, melaraskan kontras label botol, dan menyediakan reka bentuk sedia cetak (print-ready) 300 DPI.',
    installed: false,
    enabled: false,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: null,
    iconType: 'Sparkles',
    accentColor: '#FF0000',
    capabilities: ['Penyingkiran latar belakang (Background Remove)', 'Peningkatan resolusi imej', 'Penyesuaian palet CMYK sedia cetak', 'Eksport format SVG & PDF'],
    examplePrompts: [
      'Buang latar belakang foto botol kuah colek menggunakan Adobe',
      'Tingkatkan kualiti resolusi label pembungkusan 500g untuk cetakan kilang',
      'Jana palet warna hangat sedia cetak untuk penutup botol kuah'
    ],
    version: '1.9.4',
    rating: 4.7,
    reviewCount: 1850
  },

  // 3. Pembangunan & Pengekodan
  {
    id: 'github',
    name: 'GitHub Dev Assistant',
    category: 'dev_coding',
    categoryLabel: 'Pembangunan & Pengekodan',
    developer: 'GitHub / Microsoft',
    description: 'Uruskan Pull Requests (PR), pantau kod diff, semak isu bug, dan jejak aktiviti repositori kod Abang Colek.',
    detailedDescription: 'Hubungkan repositori GitHub `thisisabangcolek-web/Abang-Colek` untuk menyemak commit forensik terkini, menyemak laporan isu kebocoran botol, dan mengesahkan PR kod sebelum pelancaran.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'token',
    connectedAccount: 'thisisabangcolek-web (Personal Access Token Active)',
    iconType: 'GitPullRequest',
    accentColor: '#24292F',
    capabilities: ['Semak senarai PR & Issues terbuka', 'Buka isu bug botol bocor atau pesanan', 'Lihat commit diff kod repositori', 'Sahkan status CI/CD'],
    examplePrompts: [
      'Semak Pull Request terbaru di repositori GitHub Abang Colek',
      'Buka isu baru di GitHub bertajuk "Siasatan Kebocoran Penutup Botol Batch Lot 24"',
      'Senaraikan 5 commit terkini dalam cawangan main'
    ],
    version: '4.0.2',
    rating: 4.9,
    reviewCount: 5100
  },
  {
    id: 'vercel',
    name: 'Vercel Deployment (vprod)',
    category: 'dev_coding',
    categoryLabel: 'Pembangunan & Pengekodan',
    developer: 'Vercel Inc.',
    description: 'Auto-deployment dari GitHub ke Vercel production (vprod), pantau status binaan, dan periksa domain production.',
    detailedDescription: 'Disambungkan dengan akaun Vercel thisidowgnut@gmail.com, token rasmi vprod dan repositori GitHub thisisabangcolek-web/Abang-Colek dengan sokongan CI/CD automatik.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'api_key',
    connectedAccount: 'thisidowgnut@gmail.com (vprod · Token Active)',
    iconType: 'Cpu',
    accentColor: '#000000',
    capabilities: ['Auto-deployment dari GitHub ke Vercel (vprod)', 'Semak status pelancaran (Production / Preview)', 'Picu deploy semula (Instant Redeploy)', 'Sahkan pautan domain abangcolek-os.vercel.app'],
    examplePrompts: [
      'Deploy projek ini ke Vercel production (vprod) sekarang',
      'Semak status auto-deployment dari GitHub ke Vercel',
      'Adakah domain production abangcolek-os.vercel.app beroperasi tanpa ralat?'
    ],
    version: '3.0.0',
    rating: 4.9,
    reviewCount: 3100
  },

  // 4. Pangkalan Data & Analitik
  {
    id: 'supabase',
    name: 'Supabase Database',
    category: 'db_analytics',
    categoryLabel: 'Pangkalan Data & Analitik',
    developer: 'Supabase Inc.',
    description: 'Uruskan pangkalan data PostgreSQL ber-RLS, jalankan query SQL analitik, dan pantau rekod bukti forensik.',
    detailedDescription: 'Integrasi terus dengan pangkalan data PostgreSQL Supabase (Projek: bktksvhcgszaoqkdyhil.supabase.co) untuk menyimpan rekod pesanan, audit invarian JEV, dan jadual inventori perniagaan secara masa nyata.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'api_key',
    connectedAccount: 'bktksvhcgszaoqkdyhil.supabase.co (Active & Live)',
    iconType: 'Database',
    accentColor: '#3ECF8E',
    capabilities: ['Jalankan query SQL SELECT / COUNT selamat', 'Semak jadual bukti forensik & snapshot', 'Pantau integriti data pesanan', 'Audit status keselamatan RLS'],
    examplePrompts: [
      'Jalankan query SQL di Supabase untuk mengira jumlah pesanan mengikut bandar',
      'Semak status sambungan pelayan Supabase bktksvhcgszaoqkdyhil',
      'Papar jadual skema pangkalan data Supabase Abang Colek OS'
    ],
    version: '3.3.1',
    rating: 4.9,
    reviewCount: 1670
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel Product Analytics',
    category: 'db_analytics',
    categoryLabel: 'Pangkalan Data & Analitik',
    developer: 'Mixpanel Inc.',
    description: 'Analisis corong penukaran jualan (conversion funnels), pengekalan pembeli, dan peristiwa klik katalog.',
    detailedDescription: 'Jejak bagaimana pengguna di media sosial TikTok (@styloairpool) menekan pautan pembelian WhatsApp dan menyelesaikan pesanan botol kuah colek di gerai pop-up.',
    installed: false,
    enabled: false,
    requiresAuth: true,
    authType: 'token',
    connectedAccount: null,
    iconType: 'BarChart3',
    accentColor: '#7856FF',
    capabilities: ['Visualisasi corong penukaran (Conversion Funnels)', 'Kadar pengekalan pelanggan (Cohort Retention)', 'Jejak peristiwa pembelian botol kuah', 'Segmentasi pelanggan ejen'],
    examplePrompts: [
      'Analisis corong jualan pembeli TikTok ke WhatsApp dalam Mixpanel',
      'Berapakah kadar belian semula (retention rate) produk kuah colek bulan ini?',
      'Bandingkan penukaran gerai pop-up JB vs Shah Alam di Mixpanel'
    ],
    version: '2.0.5',
    rating: 4.6,
    reviewCount: 920
  },

  // 5. Perjalanan & Tempahan
  {
    id: 'skyscanner',
    name: 'Skyscanner Flight Finder',
    category: 'travel_booking',
    categoryLabel: 'Perjalanan & Tempahan',
    developer: 'Skyscanner Ltd',
    description: 'Rancang percutian atau perjalanan karnival gerai dengan mencari penerbangan murah merentas syarikat penerbangan.',
    detailedDescription: 'Cari tiket penerbangan tambang murah untuk pengurusan pengedaran stokis negeri, perjalanan karnival makanan luar negeri, mahupun rancangan percutian peribadi anda (cth: AirAsia, Malaysia Airlines, Scoot, ANA).',
    installed: true,
    enabled: true,
    requiresAuth: false,
    authType: 'none',
    connectedAccount: 'Akses Awam Skyscanner API',
    iconType: 'Plane',
    accentColor: '#00A698',
    capabilities: ['Cari tambang penerbangan termurah', 'Bandingkan syarikat penerbangan & waktu transit', 'Pantau trend harga mengikut tarikh', 'Pautan tempahan terus rasmi'],
    examplePrompts: [
      'Cari tiket penerbangan murah ke Tokyo Jepun untuk minggu depan',
      'Cari penerbangan pergi balik Johor Bahru ke Kuala Terengganu untuk semakan stokis',
      'Bandingkan harga tiket AirAsia vs Malaysia Airlines ke Kota Kinabalu'
    ],
    version: '3.5.0',
    rating: 4.9,
    reviewCount: 6400
  },
  {
    id: 'booking_com',
    name: 'Booking.com Hotels',
    category: 'travel_booking',
    categoryLabel: 'Perjalanan & Tempahan',
    developer: 'Booking Holdings Inc.',
    description: 'Cari dan tempah hotel, homestay, atau penginapan krew karnival pop-up dengan ulasan dan harga terbaik.',
    detailedDescription: 'Penyelesaian pantas mencari penginapan krew Styloairpool semasa festival makanan pop-up luar negeri atau merancang tempahan hotel percutian anda lengkap dengan penarafan dan polisi pembatalan percuma.',
    installed: true,
    enabled: true,
    requiresAuth: false,
    authType: 'none',
    connectedAccount: 'Akses Awam Booking.com Partner',
    iconType: 'Building',
    accentColor: '#003580',
    capabilities: ['Cari hotel & homestay mengikut bandar', 'Tapis penarafan ulasan (8.0+)', 'Semak harga setiap malam & kemudahan', 'Pilihan pembatalan percuma'],
    examplePrompts: [
      'Cari hotel berhampiran Toppen Shopping Centre Johor Bahru untuk krew gerai',
      'Cari hotel bajet 4 bintang di Kuala Terengganu untuk 2 malam',
      'Senaraikan 3 penginapan terbaik di Tokyo Shinjuku bawah RM400 semalam'
    ],
    version: '4.1.0',
    rating: 4.8,
    reviewCount: 4890
  },
  {
    id: 'redbus_freight',
    name: 'redBus Malaysia & Freight Bas',
    category: 'travel_booking',
    categoryLabel: 'Perjalanan & Tempahan',
    developer: 'redBus Malaysia & ABANGCOLEK Logistics',
    description: 'Jadual bas ekspres masa nyata dari TBS ke seluruh Semenanjung, pengurusan konsinan kargo, bayaran DuitNow QR driver, dan protokol SOP amaran 1 jam sebelum sampai.',
    detailedDescription: 'Sistem pengedaran stok kuah colek melalui bas ekspres (Sani Express, Adik Beradik, Perdana, KKKL, E-Mutiara). Menyelaras serahan di terminal (TBS), pembayaran upah DuitNow QR pemandu, pendaftaran masa berlepas & tiba, nombor plat bas & contact driver, notis automatik kepada ejen, serta hak komunikasi terus ejen-driver.',
    installed: true,
    enabled: true,
    requiresAuth: false,
    authType: 'none',
    connectedAccount: 'redBus.my Live Schedule & PayNet DuitNow Active',
    iconType: 'Truck',
    accentColor: '#D8232A',
    capabilities: [
      'Semak jadual bas ekspres masa nyata redBus.my mengikut laluan & terminal',
      'Daftar serahan kargo di TBS bersama No Plat & No Tel Driver',
      'Bayaran upah kargo segera melalui DuitNow National QR',
      'Kemaskini notis WhatsApp rasmi ke Ejen & Pemandu Bas',
      'SOP panggilan 1 jam sebelum bas sampai ke destinasi',
      'Pautan komunikasi terus Ejen ↔ Driver Bas untuk semakan lokasi'
    ],
    examplePrompts: [
      'Semak jadual bas ekspres TBS ke Kuala Terengganu di redBus untuk hantar stok kuah colek',
      'Daftar penghantaran kargo bas Sani Express plat VDF 8821 ke Ejen Kak Mas Terengganu',
      'Picu notis SOP 1 jam sebelum sampai untuk driver hubungi ejen',
      'Beri pautan WhatsApp terus ejen untuk berhubung dengan driver bas'
    ],
    version: '4.5.0',
    rating: 5.0,
    reviewCount: 1840
  },

  // 6. Kesihatan & Kecergasan
  {
    id: 'coros',
    name: 'COROS Training Hub',
    category: 'health_fitness',
    categoryLabel: 'Kesihatan & Kecergasan',
    developer: 'COROS Wearables Inc.',
    description: 'Pantau data latihan fizikal, zon kadar denyutan jantung (Heart Rate), beban latihan harian, dan masa pemulihan krew.',
    detailedDescription: 'Sambungkan jam sukan pintar COROS anda untuk memantau status kecergasan fizikal, stamina kerja fizikal semasa karnival gerai bergerak, dan skor pemulihan tubuh badan selepas hari acara.',
    installed: true,
    enabled: true,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: 'thisisabangcolek@gmail.com (COROS PACE 3)',
    iconType: 'Activity',
    accentColor: '#F56C2B',
    capabilities: ['Pantau beban latihan mingguan (Training Load)', 'Zon kadar denyutan jantung (HR Zones)', 'Anggaran masa pemulihan badan (Recovery Time)', 'Jarak larian & langkah harian'],
    examplePrompts: [
      'Semak data latihan COROS dan kadar pemulihan saya hari ini',
      'Berapakah zon kadar denyutan jantung dan beban kerja fizikal saya minggu ini?',
      'Adakah badan saya sudah pulih untuk latihan seterusnya mengikut COROS?'
    ],
    version: '2.2.0',
    rating: 4.8,
    reviewCount: 890
  },
  {
    id: 'apple_health',
    name: 'Apple Health Sync',
    category: 'health_fitness',
    categoryLabel: 'Kesihatan & Kecergasan',
    developer: 'Apple Inc.',
    description: 'Pantau data langkah berjalan harian, pembakaran kalori aktif, corak kualiti tidur, dan metrik kesihatan holistik.',
    detailedDescription: 'Penyegerakan data Apple Health membolehkan pembantu AI menilai keletihan fizikal krew gerai pop-up, jumlah pergerakan aktif di tapak festival, dan waktu tidur berkualiti.',
    installed: false,
    enabled: false,
    requiresAuth: true,
    authType: 'oauth',
    connectedAccount: null,
    iconType: 'Heart',
    accentColor: '#FF2D55',
    capabilities: ['Kiraan langkah berjalan kaki harian', 'Kalori aktif terbakar', 'Analisis tempoh tidur (Deep & REM sleep)', 'Kadar rehat denyutan jantung (Resting HR)'],
    examplePrompts: [
      'Berapa banyakkah langkah yang saya buat semasa menguruskan gerai hari ini?',
      'Rumuskan corak tidur dan kadar denyutan jantung rehat saya minggu ini',
      'Adakah kalori aktif saya mencapai sasaran kesihatan harian di Apple Health?'
    ],
    version: '1.6.0',
    rating: 4.7,
    reviewCount: 1340
  },
];

class PluginManager {
  private plugins: PluginItem[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.plugins = this.loadPlugins();
  }

  private loadPlugins(): PluginItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Partial<PluginItem>[] = JSON.parse(raw);
        return INITIAL_PLUGINS.map(initial => {
          const match = saved.find(s => s.id === initial.id);
          if (match) {
            return {
              ...initial,
              installed: match.installed ?? initial.installed,
              enabled: match.enabled ?? initial.enabled,
              connectedAccount: match.connectedAccount !== undefined ? match.connectedAccount : initial.connectedAccount,
              lastUsed: match.lastUsed || initial.lastUsed
            };
          }
          return initial;
        });
      }
    } catch (e) {
      console.warn('Failed to load plugins from storage:', e);
    }
    return INITIAL_PLUGINS;
  }

  private savePlugins() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.plugins));
    } catch (e) {
      console.warn('Failed to save plugins to storage:', e);
    }
    this.notify();
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getAll(): PluginItem[] {
    return [...this.plugins];
  }

  public getInstalled(): PluginItem[] {
    return this.plugins.filter(p => p.installed);
  }

  public getEnabled(): PluginItem[] {
    return this.plugins.filter(p => p.installed && p.enabled);
  }

  public getById(id: string): PluginItem | undefined {
    return this.plugins.find(p => p.id === id);
  }

  public installPlugin(id: string, defaultAccount?: string): boolean {
    const idx = this.plugins.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.plugins[idx] = {
        ...this.plugins[idx],
        installed: true,
        enabled: true,
        connectedAccount: defaultAccount || this.plugins[idx].connectedAccount || (this.plugins[idx].requiresAuth ? 'thisisabangcolek@gmail.com' : null),
        lastUsed: new Date().toISOString()
      };
      this.savePlugins();
      return true;
    }
    return false;
  }

  public uninstallPlugin(id: string): boolean {
    const idx = this.plugins.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.plugins[idx] = {
        ...this.plugins[idx],
        installed: false,
        enabled: false,
        connectedAccount: null
      };
      this.savePlugins();
      return true;
    }
    return false;
  }

  public togglePluginEnabled(id: string): boolean {
    const idx = this.plugins.findIndex(p => p.id === id);
    if (idx !== -1 && this.plugins[idx].installed) {
      this.plugins[idx] = {
        ...this.plugins[idx],
        enabled: !this.plugins[idx].enabled
      };
      this.savePlugins();
      return true;
    }
    return false;
  }

  public connectAccount(id: string, accountEmail: string): boolean {
    const idx = this.plugins.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.plugins[idx] = {
        ...this.plugins[idx],
        installed: true,
        enabled: true,
        connectedAccount: accountEmail,
        lastUsed: new Date().toISOString()
      };
      this.savePlugins();
      return true;
    }
    return false;
  }

  public recordUsage(id: string) {
    const idx = this.plugins.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.plugins[idx] = {
        ...this.plugins[idx],
        lastUsed: new Date().toISOString()
      };
      this.savePlugins();
    }
  }
}

export const pluginManager = new PluginManager();
