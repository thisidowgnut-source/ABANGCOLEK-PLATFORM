# 📑 LAPORAN AUDIT & FORENSIK LENGKAP KESELURUHAN REPOSITORI
## Repositori: [https://github.com/thisisniagahub/ABANG-COLEK.git](https://github.com/thisisniagahub/ABANG-COLEK.git)
**Tarikh Penilaian:** 30 September 2026  
**Penilai:** Enjin Analitik & Pembangunan AI (Typesafe.ai / Google AI Studio)  
**Tujuan:** Kajian forensik setiap fail, inventori data menyeluruh, dan pelan integrasi data ke dalam platform aplikasi Abang Colek.

---

## 📑 JADUAL KANDUNGAN
1. [Ringkasan Eksekutif & Struktur Matriks Repositori](#1-ringkasan-eksekutif--struktur-matriks-repositori)
2. [Inventori Penuh Setiap Fail & Folder](#2-inventori-penuh-setiap-fail--folder)
3. [Analisis Terperinci Seni Bina WOCS (WhatsApp OPS Control System)](#3-analisis-terperinci-seni-bina-wocs-whatsapp-ops-control-system)
4. [Analisis Strategi Jenama & Kandungan TikTok (@styloairpool)](#4-analisis-strategi-jenama--kandungan-tiktok-styloairpool)
5. [Skema Pangkalan Data Drizzle ORM & Struktur SQL](#5-skema-pangkalan-data-drizzle-orm--struktur-sql)
6. [Koleksi Data Pratetap (Preset Data Bank)](#6-koleksi-data-pratetap-preset-data-bank)
   - 6.1 Bank 10 Viral TikTok Hooks & Metrik Prestasi
   - 6.2 8 Mutiara Kata Motivasi Pengasas (Founder's Corner)
   - 6.3 6 Slogan Rasmi Kontekstual (Taglines)
   - 6.4 Senarai Semak Operasi Booth 3 Peringkat (Pre/During/Post Event)
   - 6.5 Sistem Lencana Pencapaian (Achievement Badges) & Testimoni
7. [Enjin Templat Mesej WhatsApp (11 Templat Rasmi)](#7-enjin-templat-mesej-whatsapp-11-templat-rasmi)
8. [Identiti Audio & Lagu Tema Rasmi ("Kasi Lagi-Lagi")](#8-identiti-audio--lagu-tema-rasmi-kasi-lagi-lagi)
9. [Inventori Aset Visual & Imej Jenama](#9-inventori-aset-visual--imej-jenama)
10. [Pelan Tindakan Penambahbaikan Projek (Data Utilization Plan)](#10-pelan-tindakan-penambahbaikan-projek-data-utilization-plan)

---

## 1. Ringkasan Eksekutif & Struktur Matriks Repositori

Repositori `thisisniagahub/ABANG-COLEK.git` merupakan ekosistem bersepadu perniagaan makanan berasaskan sambal/colek jenama **ABANG COLEK** (di bawah naungan syarikat **Liurleleh House**). Ekosistem ini merangkumi pelbagai subsistem dari operasi fizikal booth acara (*event ops*), pengurusan jenama (*Brand OS*), automasi perkhidmatan pelanggan WhatsApp (*WOCS*), penjejakan metrik kandungan TikTok pengasas (@styloairpool / Epull), hingga ke skema pangkalan data hubungan dan aplikasi mudah alih.

### Matriks Komponen Mengikut `REPOS.md`:
| Sub-Projek | Jenis | Stack Teknologi | Git Submodul / Lokasi | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Brand OS** | Web Dashboard | React 19 + TypeScript + Vite | `abang-colek-brand-os` | ✅ Pengeluaran (Production) |
| **WOCS Extension** | Chrome Extension | Vanilla JS + CSS (Manifest V3) | `abang-colek-wocs-extension` | ✅ Pengeluaran (Production) |
| **WOCS Server** | Backend API | Node.js + Express + TypeScript | `wocs-server` | 🔧 Pembangunan (Local/Render) |
| **Mobile App** | Aplikasi Mudah Alih | React Native (Expo) + NativeWind | `abang-colek-mobile` | 📋 Aktif Ditala |
| **WAWCD** | Arkib Tangkapan Skrin | PNG Media Artifacts | `WAWCD/` | 📦 Arkib Perbualan WhatsApp Web |
| **Brand Assets** | Aset Grafik & Maskot | PNG/JPG Rasmi | `sample-image/` | 🎨 18 Fail Media Resolusi Tinggi |
| **Audio Anthem** | Audio Master | MP3 320kbps | `Kasi Lagi-Lagi.mp3` | 🎵 Lagu Tema Rasmi |

---

## 2. Inventori Penuh Setiap Fail & Folder

Semakan teliti ke atas keseluruhan struktur fail telah menemui fail-fail berikut:

### A. Fail Root (Peringkat Utama)
1. **`REPOS.md`** (10,297 bait)
   - Dokumentasi seni bina payung (umbrella repo matrix).
   - Menghuraikan aliran komunikasi antara WOCS Extension $\leftrightarrow$ WhatsApp Web $\leftrightarrow$ WOCS Server $\leftrightarrow$ Meta Cloud API.
   - Menggariskan peraturan commit berasingan dan panduan arahan permulaan pantas (*quickstart*).
2. **`Kasi Lagi-Lagi.mp3`** (1,483,085 bait)
   - Fail audio master rasmi lagu tema Abang Colek ciptaan Liurleleh House.
   - Berdurasi 1:00 minit, genre Hip-Hop/Trap Anthem, tempo 85-95 BPM.
3. **`.gemini/settings.json`**
   - Tetapan persekitaran pembangun bagi integrasi model Gemini AI.
4. **`WAWCD/`** (Folder mengandungi 14 tangkapan skrin)
   - `screencapture-web-whatsapp-2026-01-17-10_27_51.png` sehingga `10_35_06.png`.
   - Mengandungi aliran sebenar perbualan pelanggan, pendaftaran ejen, semakan stok, dan interaksi pesanan melalui WhatsApp Web.
5. **`sample-image/`** (Folder mengandungi 18 fail grafik jenama)
   - Logo jenama: `ABANG-COLEX-LOGO-2.png`, `ABANG-COLEX-LOGO-3.png`.
   - Foto pengasas: `epull.png`, `founder.png`, `FOUNDER2.png`.
   - Siri ilustrasi maskot cili/mangga: `MASKOT-1.PNG`, `MASKOT-2.PNG`, `MASKOT-3.PNG`, `MASKOT-4.PNG`, `MASKOT-5.PNG`, `MASKOT-LOGO.PNG`.
   - Aset visual promosi Gemini AI: `Gemini_Generated_Image_*.png`.
   - Ikon pelayar web & ekstensi: `icon128.png`.

---

### B. Folder `abang-colek-mobile` (Teras Logik Perniagaan & Skema)
Fail-fail teras dalam sub-direktori ini mengandungi kod sumber lengkap:

1. **Dokumentasi Produk & Kejuruteraan:**
   - **`PRD.md`**: Dokumen Keperluan Produk (*Product Requirements Document*) setebal 500+ baris. Menggariskan 3 Persona Pengguna (Ahmad - Pengasas 32 tahun, Siti - Operator Booth 24 tahun, Zul - Pencipta Kandungan 27 tahun), Matriks Keperluan Fungsian (FR1 hingga FR10), dan Hala Tuju Versi 1.0 ke 2.0.
   - **`ERP.md`**: Dokumen Perancangan & Keperluan Kejuruteraan (*Engineering Requirements & Planning*). Menghuraikan seni bina tRPC, MySQL dengan Drizzle ORM, barisan giliran Redis BullMQ, tahap insiden P0-P3, dan prosedur pemantauan APM.
   - **`design.md`**: Garis panduan reka bentuk UI/UX berasaskan tema kuning (#FFC107), merah cili (#E53935), dan hitam arang (#1A1A1A).
   - **`todo.md`**: Senarai semak pelaksanaan ciri terperinci dari fasa 1 hingga fasa 6.
   - **`tiktok-brand-analysis.md`**: Analisis jenama profil TikTok `@styloairpool` (75.2K pengikut, 793.2K tanda suka).
   - **`tiktok-content-analysis.md`**: Analisis kandungan video TikTok, formula cangkuk (*hooks*), dan strategi dwi-penentududukan (*dual-positioning*).

2. **Perpustakaan Data & Templat (`lib/`):**
   - **`lib/preset-data.ts`**: Mengandungi senarai 10 cangkuk video viral TikTok dengan data capaian (*views/likes/engagement*), 8 mutiara kata motivasi pengasas, 6 slogan rasmi, senarai semak booth 3 fasa, dan 4 lencana pencapaian.
   - **`lib/whatsapp-templates.ts`**: Mengandungi 11 templat mesej WhatsApp rasmi lengkap dengan kata kunci pencetus (*triggers*) dan penukaran pemboleh ubah dinamik (*variable replacement*).
   - **`lib/whatsapp-bot-types.ts`**: Definisi antaramuka TypeScript untuk WhatsAppConfig, MessageTemplate, WhatsAppMessage, CustomerInquiry, EventRegistration, OrderMessage, BroadcastMessage, dan BotAnalytics. Termasuk nombor telefon pentadbir rasmi (`01168444656`, `0178245667`).
   - **`lib/jingle-lyrics.ts`**: Lirik penuh lagu tema rasmi beserta metadata audio (genre, BPM, durasi, nilai teras jenama).
   - **`lib/types.ts`**: Jenis data TypeScript untuk acara (*Event*), senarai semak (*ChecklistItem*), cangkuk (*Hook*), pelan kandungan (*ContentPlan*), ulasan (*Review*), dan pencapaian (*Milestone*).

3. **Pangkalan Data & Migrasi (`drizzle/` & `server/`):**
   - **`drizzle/schema.ts`**: Definisi skema jadual Drizzle ORM untuk MySQL: `users`, `wocs_users`, `wocs_tasks`, `wocs_task_logs`, `wocs_attachments`, `wocs_landing_versions`, dan `wocs_app_configs`.
   - **`drizzle/0000_elite_eternals.sql`**: Migrasi SQL awal bagi jadual pengguna.
   - **`drizzle/0001_fantastic_jetstream.sql`**: Migrasi SQL lengkap bagi 6 jadual enjin WOCS.
   - **`server/wocs-schema.sql`**: Definisi skema SQL mentah bagi WOCS.

4. **Enjin Kawalan Operasi WhatsApp (`server/wocs/`):**
   - **`server/wocs/commandParser.ts`**: Penghurai arahan teks WhatsApp yang menyokong arahan `/landing`, `/config`, `/assign`, `/schedule`, `/report`, `/tiktok` dengan sokongan pasangan `key=value` dan gerbang kelulusan pentadbir (*approval gates*).
   - **`server/wocs/executors.ts`**: Logik pelaksanaan tugas bagi setiap jenis arahan (simpanan draf landing page, kemas kini tetapan `featureFlags`, agihan tugas agen, penjadualan kandungan, dan penjanaan laporan).
   - **`server/wocs/taskEngine.ts`**: Mesin keadaan kitaran hayat tugasan (*state machine*) dengan penyegerakan barisan Redis dan penjadual berkala (*scheduler*).
   - **`server/wocs/templates.ts`**: Templat tugas siap guna untuk automasi pantas.
   - **`server/wocs/voice.ts`**: Integrasi transkripsi suara lebih pantas (*faster-whisper*) untuk menukar audio suara WhatsApp kepada arahan sistem.
   - **`server/wocs/queue.ts` & `rollback.ts`**: Pengendalian barisan giliran berprioriti tinggi dan mekanisme pemulihan (*undo/rollback*).

---

## 3. Analisis Terperinci Seni Bina WOCS (WhatsApp OPS Control System)

WOCS adalah tulang belakang automasi operasi Abang Colek. Ia bertindak sebagai pusat kawalan maya di mana pengasas atau staf menghantar arahan melalui aplikasi WhatsApp dan sistem memprosesnya secara automatik.

### Sintaks & Tatabahasa Arahan WOCS:
Sistem menghuraikan arahan awalan slash (`/`) berserta parameter berpasangan (`key=value`):
1. **`/landing pageSlug=<nama> [title=<tajuk>]`**
   - *Jenis:* `landing_page`
   - *Gerbang Kelulusan:* **Diperlukan (true)**
   - *Tindakan:* Menjana draf versi landing page baharu ke jadual `wocs_landing_versions`.
2. **`/config appName=<nama> configKey=<kunci> [value=<nilai>]`**
   - *Jenis:* `app_config`
   - *Gerbang Kelulusan:* **Diperlukan (true)**
   - *Tindakan:* Mengemas kini nilai konfigurasi atau bendera ciri (*feature flags*) ke dalam `wocs_app_configs`.
3. **`/assign agent=<nama> task=<tugasan> [priority=high]`**
   - *Jenis:* `agent_task`
   - *Gerbang Kelulusan:* **Tidak diperlukan (false)**
   - *Tindakan:* Merekod tugasan agen ke dalam barisan tugas untuk tindakan segera.
4. **`/schedule date=<tarikh> hook=<id_hook> platform=tiktok`**
   - *Jenis:* `content_schedule`
   - *Gerbang Kelulusan:* **Tidak diperlukan (false)**
   - *Tindakan:* Memasukkan entri kalendar kandungan media sosial.
5. **`/report range=<7d|30d|event> [format=pdf]`**
   - *Jenis:* `report`
   - *Gerbang Kelulusan:* **Tidak diperlukan (false)**
   - *Tindakan:* Menghasilkan ringkasan prestasi jualan atau metrik agen.
6. **`/tiktok action=create_draft [hookId=<id>]`**
   - *Jenis:* `tiktok`
   - *Gerbang Kelulusan:* **Tidak diperlukan (false)**
   - *Tindakan:* Menghubungkan cangkuk video dengan draf video TikTok.

---

## 4. Analisis Strategi Jenama & Kandungan TikTok (@styloairpool)

Analisis profil rasmi TikTok mendapati jenama Abang Colek mempunyai identiti yang sangat unik berbanding jenama makanan konvensional:

### Statistik Akaun:
* **Pengendali:** Epull / Ahmad (Founder & Motivator 📈)
* **Pengikut:** **75,200 (75.2K)**
* **Tanda Suka (Likes):** **793,200 (793.2K)** (Nisbah tinggi: ~10.5 tanda suka bagi setiap pengikut)
* **Mengikuti:** 768

### Formula Dwi-Penentududukan (Dual Positioning):
Jenama ini tidak hanya menjual sambal botol atau hidangan colek buah, tetapi menjual **gaya hidup keusahawanan dan motivasi**:
1. **Dimensi Produk:** Cita rasa unik yang menggabungkan rasa **PEDAS**, **MANIS**, dan **MASAM** (mangga) dengan tekstur pekat melekat (*"LIKAT MELEKAT"*).
2. **Dimensi Pengasas:** Perkongsian perjalanan dari dapur rumah ke festival makanan mega di seluruh Malaysia, mempamerkan usaha gigih (*hustle*), disiplin niaga, dan inspirasi anak muda.

### Strategi Emotikon Rasmi:
* 🌶️ **Cili:** Menggambarkan rasa pedas kick yang menjadi teras produk.
* 🥭 **Mangga:** Elemen manis dan masam semulajadi yang membezakan Colek daripada sambal biasa.
* 📈 **Carta Graf Menaik:** Mewakili pertumbuhan jualan, pencapaian diri, dan motivasi bisnes.

---

## 5. Skema Pangkalan Data Drizzle ORM & Struktur SQL

Dalam fail `abang-colek-mobile/drizzle/schema.ts`, skema hubungan telah direka dengan piawaian jenis-selamat (Typesafe):

```typescript
// 1. Pengguna Utama & Auth
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// 2. Pengguna WOCS WhatsApp Whitelist
export const wocsUsers = mysqlTable("wocs_users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: mysqlEnum("role", ["admin", "agent", "viewer"]).notNull(),
  waNumber: varchar("waNumber", { length: 20 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// 3. Tugasan Operasi WOCS
export const wocsTasks = mysqlTable("wocs_tasks", {
  id: varchar("id", { length: 20 }).primaryKey(), // Format: TASK-XXXX
  type: varchar("type", { length: 50 }).notNull(),
  commandRaw: text("commandRaw").notNull(),
  payload: text("payload").notNull(), // JSON
  status: mysqlEnum("status", ["pending", "awaiting_approval", "running", "done", "failed", "cancelled", "rolled_back"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["high", "normal", "low"]).default("normal").notNull(),
  requestedBy: int("requestedBy"),
  assignedTo: int("assignedTo"),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  result: text("result"), // JSON
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

---

## 6. Koleksi Data Pratetap (Preset Data Bank)

### 6.1 Bank 10 Viral TikTok Hooks & Metrik Prestasi
Berikut adalah 10 formula cangkuk video yang telah terbukti menjana impak tinggi:
1. **Hook #1 (Reaksi):** *"Pedas sampai menangis tapi masih nak lagi! 🌶️😭"*
   - Tontonan: **125,000** | Suka: 8,900 | Kongsi: 450 | Penglibatan: **7.5%**
2. **Hook #2 (Produk):** *"Rahsia sambal yang buat pelanggan jatuh cinta 🥭🌶️"*
   - Tontonan: **89,000** | Suka: 6,200 | Kongsi: 320 | Penglibatan: **7.3%**
3. **Hook #3 (Kisah Pengasas):** *"Dari booth kecil ke viral TikTok - Journey Abang Colek 📈"*
   - Tontonan: **210,000** | Suka: 15,400 | Kongsi: 890 | Penglibatan: **7.8%**
4. **Hook #4 (Tips/Edukasi):** *"3 cara makan Colek yang ramai tak tahu! 🤯"*
   - Tontonan: **156,000** | Suka: 11,200 | Kongsi: 670 | Penglibatan: **7.6%**
5. **Hook #5 (Di Sebalik Tabir):** *"Behind the scenes: Prep 100 boxes untuk event 🎪"*
   - Tontonan: **67,000** | Suka: 4,800 | Kongsi: 210 | Penglibatan: **7.5%**
6. **Hook #6 (Ulasan Pelanggan):** *"Customer reaction: First time try Jumbo Colek! 😱"*
   - Tontonan: **98,000** | Suka: 7,100 | Kongsi: 380 | Penglibatan: **7.7%**
7. **Hook #7 (Cabaran POV):** *"POV: Kau order level pedas 10 🔥💀"*
   - Tontonan: **187,000** | Suka: 13,200 | Kongsi: 720 | Penglibatan: **7.5%**
8. **Hook #8 (Keunikan Rasa):** *"Kenapa sambal kami MANIS dulu baru PEDAS? 🥭🌶️"*
   - Tontonan: **143,000** | Suka: 9,800 | Kongsi: 540 | Penglibatan: **7.2%**
9. **Hook #9 (Kelakar/Situasi):** *"Bila customer tanya 'Ada yang kurang pedas tak?' 😅"*
   - Kategori: Humor & Santai
10. **Hook #10 (Hustle/Kerja Keras):** *"Setup booth dari pagi sampai malam - Worth it! 💪"*
    - Tontonan: **45,000** | Suka: 3,200 | Kongsi: 150 | Penglibatan: **7.4%**

### 6.2 8 Mutiara Kata Motivasi Pengasas (Founder's Corner)
1. *"Rasa Sekali, Jatuh Cinta Selamanya"* — Abang Colek (Falsafah Produk)
2. *"Pedas Manis Likat Melekat - Macam perniagaan, kena ada balance!"* — Founder (Perniagaan)
3. *"Setiap event adalah peluang untuk buat customer jatuh cinta"* — Founder (Pertumbuhan)
4. *"Dari dapur rumah ke seluruh Malaysia - Mimpi boleh jadi kenyataan"* — Founder Story (Inspirasi)
5. *"Bukan calang-calang pedas, bukan calang-calang usahawan"* — Abang Colek (Keberanian)
6. *"Konsisten macam rasa sambal kita - Hari-hari padu!"* — Founder (Disiplin)
7. *"Setiap booth adalah stage untuk showcase passion kita"* — Founder (Pemasaran)
8. *"Sticky macam sambal, memorable macam brand"* — Abang Colek (Kesan Jenama)

### 6.3 6 Slogan Rasmi Kontekstual (Taglines)
* **Formal / Cetakan:** *"Rasa Padu, Pedas Menggamit"* 🌶️
* **Media Sosial / Viral:** *"PEDAS MANIS LIKAT MELEKAT"* 🌶️🥭
* **Emosi / Retensi Pelanggan:** *"Rasa Sekali Jatuh Cinta Selamanya"* ❤️
* **Reaksi Santai:** *"Pedas Tapi Puas"* 🌶️
* **Kepuasan Hidangan:** *"Colek Sampai Licin"* 🥭
* **Keyakinan Kualiti:** *"Bukan Calang-Calang Pedas"* 🌶️

### 6.4 Senarai Semak Operasi Booth (3 Peringkat)
* **Sebelum Acara (Pre-Event):**
  1. Semak inventori sambal (kiraan botol/pek).
  2. Sediakan kelengkapan booth (meja, kain skirting, banner, bunting standee).
  3. Cetak kod QR untuk Cabutan Bertuah (Lucky Draw).
  4. Cas penuh power bank, terminal kad, dan telefon pintar.
  5. Sediakan duit apung kecil (cash float).
  6. Bungkus barang dagangan promosi (pelekat, risalah, kad perniagaan).
  7. Siapkan kotak pendingin (*cooler box*) bersama pek ais kering.
  8. Taklimat staf bertugas tentang keunikan produk dan struktur harga.
  9. Uji kelancaran sistem pembayaran DuitNow QR Pay & tunai.
  10. Sediakan senarai rakaman video (*shot list*) untuk video TikTok harian.
* **Semasa Acara (During-Event):**
  1. Siapkan susun atur booth 30 minit sebelum acara dibuka.
  2. Pamerkan produk secara bertingkat dan kemas.
  3. Pasang sepanduk promosi di laluan utama pelanggan.
  4. Sambut pelanggan dengan senyuman dan sapaan mesra.
  5. Rakam reaksi jujur pelanggan semasa sesi ujian rasa percuma.
  6. Galakkan pendaftaran kod QR cabutan bertuah.
  7. Pantau baki stok setiap 2 jam.
  8. Catat soalan lazim pelanggan.
* **Selepas Acara (Post-Event):**
  1. Kemas dan kira semula semua peralatan dengan rapi.
  2. Kira jumlah jualan tunai + QR dan baki inventori.
  3. Kumpul borang maklum balas dan ulasan pelanggan.
  4. Pindahkan semua rakaman media ke storan komputer.
  5. Kemas kini stok dalam sistem inventori.
  6. Ucap terima kasih kepada penganjur acara (EO) dan simpan maklumat perhubungan.
  7. Muat naik sorotan video acara ke TikTok dan Instagram.
  8. Nilai apa yang berjaya dan kenal pasti ruang penambahbaikan.

---

## 7. Enjin Templat Mesej WhatsApp (11 Templat Rasmi)

Sistem WOCS dilengkapi dengan 11 templat dinamik untuk interaksi automatik:
1. **`cs-welcome` (Sapaan Utama):** Kata kunci: `hi`, `hello`, `assalamualaikum`, `salam`. Menyenaraikan menu info produk, lokasi booth, lucky draw, dan tempahan.
2. **`cs-product-info` (Senarai Produk & Harga):**
   - Sambal Colek Original (Pedas Manis)
   - Sambal Colek Extra Pedas
   - Sambal Colek Mango Twist
   - Pakej: 250ml (RM15), 500ml (RM28), 1 Liter (RM50). Promosi: Beli 3 Percuma 1!
3. **`cs-location` (Lokasi Booth Semasa):** Menggantikan pemboleh ubah `{current_events}` secara dinamik.
4. **`event-register` (Pendaftaran Acara):** Mengumpul nama, telefon, dan pilihan acara pelanggan.
5. **`lucky-draw-info` (Maklumat Cabutan Bertuah):** Hadiah: Bekalan Percuma Abang Colek Selama 1 Tahun (12 botol x 12 bulan).
6. **`lucky-draw-join` (Pautan Borang Cabutan Bertuah):** Menghantar pautan borang `{form_link}`.
7. **`order-inquiry` (Pertanyaan Tempahan):** Mengumpul senarai produk, saiz, kuantiti, dan alamat pengeposan.
8. **`order-confirmation` (Pengesahan Pesanan & Akaun Bank):** Akaun Maybank `1234567890` (Liurleleh House) dengan butiran `{order_details}` dan `{total}`.
9. **`marketing-new-flavor` (Pelancaran Perisa Baru):** Sambal Colek Mango Twist 500ml pada harga pelancaran RM25 (Jimat RM3).
10. **`marketing-event-announcement` (Hebahan Acara Baru):** Menyebarkan tarikh, lokasi, dan masa acara berserta promosi rasa percuma.
11. **`admin-new-inquiry` (Notifikasi Admin Pentadbir):** Menghantar isyarat segera ke nombor telefon admin (`01168444656`, `0178245667`).

---

## 8. Identiti Audio & Lagu Tema Rasmi ("Kasi Lagi-Lagi")

Fail `Kasi Lagi-Lagi.mp3` adalah aset penjenamaan audio berkualiti tinggi yang telah disepadukan ke dalam repositori:
* **Tajuk:** Kasi Lagi-Lagi
* **Artis:** Abang Colek (Liurleleh House)
* **Genre:** Hip-Hop / Trap Anthem
* **Tempo (BPM):** 85 - 95 BPM
* **Penyusunan Muzik:** Dentuman bass 808 yang padu, ketukan perkusi tajam, dan sintesis vokal minimalis bersemangat tinggi.
* **Lirik Utama:**
  > *"ABANG CHO-LEK! SAMBAL CHO-LEK! PEDAS! PADU! SEKALI RASA. YOU KNOW. PEDAS MANIS. STAYS."*

---

## 9. Inventori Aset Visual & Imej Jenama

Semua 18 fail grafik resolusi tinggi daripada folder `sample-image` telah disahkan dan disalin ke `public/assets/brand/`:
1. `ABANG-COLEX-LOGO-2.png` & `ABANG-COLEX-LOGO-3.png` — Logo rasmi dengan teks bold dan lambang cili.
2. `epull.png`, `founder.png`, `FOUNDER2.png` — Potret pengasas (Epull / Ahmad) berimej usahawan berwawasan.
3. `MASKOT-1.PNG` hingga `MASKOT-5.PNG` & `MASKOT-LOGO.PNG` — Siri ilustrasi watak maskot cili bertenaga dengan pelbagai ekspresi gaya jalanan (*streetwear*).
4. `icon128.png` — Ikon pelayar web 128x128.
5. `Screenshot 2026-01-16 193536.png` — Tangkapan skrin aliran kerja asal.

---

## 10. Pelan Tindakan Penambahbaikan Projek (Data Utilization Plan)

Berdasarkan keseluruhan repositori, data ini dimanfaatkan sepenuhnya ke dalam platform AI Studio ini melalui langkah-langkah berikut:

1. **Modul Bank Kandungan TikTok (TikTok Viral Engine):**
   - Menghubungkan 10 cangkuk viral lengkap dengan penapis tag (`#pedas`, `#viral`, `#reaction`, `#founder`, `#bts`), carian masa nyata, dan butang salin satu-klik untuk kegunaan pengurus media sosial.
2. **Pemain Audio & Lirik Interaktif:**
   - Menyediakan pemain audio terbina untuk lagu tema `kasi-lagi-lagi.mp3` dengan paparan lirik berirama (*karaoke style*) untuk menaikkan semangat pasukan sebelum bertugas di booth.
3. **Pusat Kawalan WhatsApp WOCS Interaktif:**
   - Menyediakan konsol ujian arahan WOCS sebenar dengan penghurai tatabahasa (*grammar parser*), simulasi gerbang kelulusan pentadbir (*admin approval*), dan paparan 11 templat mesej rasmi lengkap dengan penjana pautan terus `wa.me`.
4. **Papan Pemuka Motivasi Pengasas (Founder's Corner):**
   - Integrasi sistem putaran kata-kata semangat harian (Daily Quote of the Day) daripada 8 mutiara kata pengasas serta statistik pengikut TikTok (75.2K pengikut & 793.2K tanda suka).
5. **Skema Telemetri Supabase & Drizzle Simetri:**
   - Memastikan medan pangkalan data seperti `task_id`, `tool_name`, `latency_ms`, dan `status` sepadan sepenuhnya dengan skema `wocs_tasks` dan `agent_task_logs`.

---

*Laporan ini disimpan secara rasmi di `docs/FORENSIK_AUDIT_LENGKAP_REPO_ABANG_COLEK.md` dan diduplikasi di `reports/FORENSIK_AUDIT_LENGKAP_REPO_ABANG_COLEK.md` sebagai rujukan kekal.*
