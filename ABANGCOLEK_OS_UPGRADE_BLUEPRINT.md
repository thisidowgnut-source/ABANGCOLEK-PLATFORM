# PELAN INDUK NAIK TARAF ABANGCOLEK-OS
## SENI BINA "TRITUNGGAL AUTONOMI" (THE TRINITY AUTONOMOUS RETAIL OS)
**Penggabungan Menyeluruh:** Data Operasi Abang Colek × JEV System-1 × DeepSeek Harness (DSH) × Hermes Agent (Nous Research)  
**Dokumen Rujukan:** `ABANGCOLEK_OS_UPGRADE_BLUEPRINT.md`  
**Tarikh Penggubalan:** 30 September 2026  
**Status Dokumen:** Dokumen Spesifikasi Arkitektur & Pelan Tindakan Rasmi  

---

## 1. PENGENALAN & LATAR BELAKANG EKOSISTEM

### 1.1 Konteks Perniagaan & Operasi Fizikal
**ABANGCOLEK** dan sub-jenama **STYLOAIRPOOL** ialah jenama makanan dan minuman (F&B) kuah colek buah dan jeruk premium Malaysia. Operasi perniagaan ini berpusat di Johor Bahru dengan cawangan serta rakan niaga di seluruh semenanjung:
* **Hab Utama & Gerai Fizikal:**
  * Ibu Pejabat (HQ) Johor Bahru.
  * Gerai malam fizikal di **Pasar Karat JB** (aliran tunai harian pantas, interaksi pelanggan bersemuka).
  * Kiosk jenama di **Toppen Shopping Centre JB**.
  * Hab pengedaran Pantai Barat di **Shah Alam & Bangi** (pembungkusan dan pengedaran Lembah Klang).
  * Ejen Pantai Timur di **Kuala Terengganu** (dikendalikan oleh rakan niaga rasmi `@jeruxsliurlelehterengganu`).
* **Data Kewangan & Realiti Inventori Sebenar:**
  * Pangkalan data langsung (`MOCK_DB` bervalidasi) merekodkan **12 pesanan aktif bernilai RM 4,953.00**.
  * Produk teras: Kuah Colek Buah Original (500g - RM 28), Colek Padu Crispy, Jeruk Mangga Asam Boi, Jeruk Kedondong, dan Pakej Ejen Permulaan (50 botol - RM 1,000).
  * **Titik Panas Operasi (*Operational Friction Point*):** Kadar aduan kerosakan bungkusan dan penutup botol longgar semasa penghantaran kurier jarak jauh mencecah **10.0%**.

---

## 2. AUDIT KEADAAN KOD SEMASA (CURRENT CODEBASE AUDIT)

Aplikasi telah dibina berasaskan susunan teknologi moden (React 19, Vite, TypeScript, Tailwind CSS, Google Gemini 3.8 Flash, dan Google Workspace API):

```
                                  ABANGCOLEK-OS (App.tsx)
                                             │
      ┌────────────────────────┬─────────────┴───────────────┬────────────────────────┐
      │                        │                             │                        │
┌─────▼───────────────┐  ┌─────▼──────────────────────┐  ┌───▼──────────────────┐  ┌──▼───────────────────┐
│ JEV System-1 Engine │  │ Gemini 3.8 Multi-Tool Core │  │ 11 Plugin Pihak Ke-3 │  │   Google Workspace   │
│ (jevEngine.ts)      │  │ (gemini.ts)                │  │ (pluginService.ts)   │  │ (Gmail, Sheets, dll) │
├─────────────────────┤  ├────────────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ • 7 Dimensi Klasik  │  │ • Strim Dwiarah & Tool Call│  │ • Skyscanner/Booking │  │ • 9 Modul Workspace  │
│ • Strict Invariant  │  │ • pub/sub Tool Execution   │  │ • Canva / Adobe      │  │ • Peta Logistik Hab  │
│ • 8 Soalan Bisnes   │  │ • Sidebar Pulse Telemetry  │  │ • GitHub / Vercel    │  │ • Client OAuth Flow  │
│ • Zero Halusinasi   │  │ • RM4,953 Real Store DB    │  │ • Supabase / COROS   │  │ • Audit & Status Borang│
└─────────────────────┘  └────────────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### Kekuatan Semasa:
1. **Invarian JEV Teguh (`src/services/jevEngine.ts`):** Mengelakkan tuduhan palsu terhadap vendor botol. Jika isu melibatkan `LEAKAGE` atau `SEAL_FAILURE`, nilai punca **wajib kekal `UNDETERMINED`** sehingga bukti nombor *lot* atau video pembukaan bungkusan disahkan.
2. **Gedung Plugin Terbuka (`src/services/pluginService.ts`):** 11 plugin aktif merentasi 6 kategori dengan sistem pengesahan modal (*auth token simulation*).
3. **Telemetri Visual Masa Nyata:** Animasi denyutan ambar (*subtle pulse*) pada ikon bar sisi sewaktu alatan dipanggil.

### Kekurangan & Had Seni Bina Semasa:
* **Risiko Mutasi Tanpa Kawalan (*Unchecked State Mutations*):** Ejen boleh melaksanakan fungsi sensitif seperti `issue_refund` secara terus tanpa pengesahan dua faktor daripada pemilik perniagaan.
* **Kecelaruan Konteks (*Context Window Pollution*):** Respon alatan yang panjang (cth: puluhan jadual penerbangan Skyscanner atau log kod GitHub) membanjiri perbualan sembang utama.
* **Ketiadaan Ingatan Prosedur (*Amnesia of Learned SOPs*):** Sebarang SOP baharu yang diajar oleh manusia kepada ejen dalam sesi sembang akan hilang apabila halaman dimuat semula.

---

## 3. PENANDA ARAS SENI BINA MASA DEPAN (THE BENCHMARKS)

Pelan naik taraf ini menyerap intipati terbaik daripada dua rangka kerja ejen AI termaju di dunia:

### 3.1 DeepSeek Harness (DSH) — *Powered by Cordis*
* **Falsafah:** *"Everything is a Plugin"* — tiada kod monolitik teras yang terkunci.
* **Modul Rujukan Utama:**
  * `@deepseek-ai/dsh-goal`: Pengurusan matlamat berbilang langkah (*multi-step persistent goals*).
  * `@deepseek-ai/dsh-feedback`: Mekanisme *Human-in-the-Loop* (HITL) untuk menggantung giliran (*suspend execution*) sebelum mutasi sensitif berlaku.
  * `@deepseek-ai/dsh-deliverables`: Pengasingan artifak penyerahan (invois, PDF, poster) daripada teks sembang biasa.
  * `@deepseek-ai/dsh-ptc-runtime`: *Program-aided Tool Calling* untuk penyatuan rantaian alatan pelbagai fungsi.
  * `@deepseek-ai/dsh-bundle`: Profil konfigurasi sedia pasang (`web`, `headless`, `sdk`).

### 3.2 Hermes Agent — *By Nous Research*
* **Falsafah:** *Closed Learning Loop* & *Self-Improvement*.
* **Modul Rujukan Utama:**
  * **Autonomous Skill Creation (`/learn` & `SKILL.md`):** Ejen menulis fail kemahiran sendiri mengikut piawaian terbuka **agentskills.io** untuk menghapuskan masalah *cold-start*.
  * **Multi-Layered Persistent Memory:** Pangkalan data SQLite tempatan dengan **FTS5 Full-Text Search** untuk mengekalkan ingatan rentas sesi tanpa kehilangan fakta akibat ringkasan LLM (*lossless recall*).
  * **Subagent Delegation Architecture:** Melantik sub-ejen terasing untuk tugasan berat supaya tidak membebankan tetingkap konteks ejen utama.

---

## 4. FORMULASI SOLUSI: SENI BINA "TRITUNGGAL AUTONOMI"

Seni bina naik taraf ABANGCOLEK-OS distrukturkan kepada **3 Lapisan Utama**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAPISAN PENGGUNA (OMNI-CHANNEL UI)                       │
│    Desktop OS • Mobile PWA • Turn Deliverables Drawer • Goal Tracker Bar    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│  TONGGAK 1: THE GUARD (Teras Keselamatan JEV System-1)                      │
│  • Sequence Rails: Memastikan identiti disahkan sebelum pemulangan tunai.   │
│  • Limit Rails: Had siling pampasan maksimum RM100 bagi setiap insiden.     │
│  • Root Cause Invariant: Menyekat spekulasi salah vendor botol kilang.      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│  TONGGAK 2: THE CHASSIS (Rangka Kerja Orkestrasi DSH)                       │
│  • HITL Feedback Seam: Kad Kelulusan Tindakan [Lulus / Batal / Ubah].       │
│  • Goal Lifecycle Engine: Penjejakan misi operasi berperingkat.             │
│  • Deliverables Registry: Pengurusan artifak rasmi sedia muat turun.        │
│  • Dynamic Bundle Profiles: Suis profil pantas mengikut peranan kerja.       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│  TONGGAK 3: THE BRAIN (Enjin Pembelajaran Kendiri Hermes)                   │
│  • Autonomous Procedural Skills: Menulis & mengemas kini SKILL.md (/learn). │
│  • Multi-Layered Memory (FTS5): Memori fakta operasi tanpa susut nilai.     │
│  • Subagent Delegation Swarm: Sub-Ejen Logistik, Sub-Ejen Pemasaran, dll.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SPESIFIKASI TEKNIKAL 6 MODUL NAIK TARAF

### Modul 1: Human-in-the-Loop (HITL) Action Approval Gatekeeper
* **Objektif:** Menyekat sebarang mutasi kekal atau transaksi kewangan daripada dilaksanakan secara automatik oleh AI tanpa kebenaran manusia.
* **Aliran Kerja (*Workflow*):**
  1. Ejen mengesan keperluan untuk memanggil alatan berisiko tinggi (`issue_refund`, pemadaman pesanan, e-mel amaran rasmi, atau kemas kini status stokis).
  2. Aliran fungsi **digantung (*suspended*)**.
  3. Kad kelulusan visual dipaparkan di bahagian bawah mesej ejen:
     * **Tajuk Tindakan:** Contoh: `PULANGAN WANG (REFUND) - RM 28.00`
     * **Penerima:** `Siti Norhaliza (KT-003)`
     * **Justifikasi JEV:** `Kebocoran Penutup Botol (Status: UNDETERMINED - Menunggu video unboxing)`
     * **Butang Pilihan:** `[ LULUSKAN SEKARANG ]` | `[ BATALKAN ]` | `[ PINDA BUTIRAN ]`
  4. Hanya selepas butang ditekan, mutasi pada `appStore` atau API luar dilaksanakan.

### Modul 2: Operational Goal Lifecycle Engine
* **Objektif:** Menjejaki objektif operasi berbilang langkah yang memerlukan masa dan beberapa siri interaksi.
* **Komponen Antaramuka:**
  * Widget jalur kemajuan (*Progress Banner*) di bahagian atas ruang sembang.
* **Ciri-Ciri Misi:**
  * Setiap misi mempunyai ID, Tajuk, Penerangan, Peratusan Kemajuan (0–100%), dan Senarai Sub-Tugasan.
  * Status Misi: `PLANNED` | `IN_PROGRESS` | `BLOCKED` | `COMPLETED`.
  * *Contoh Misi:*
    * **Misi #GOAL-01:** *"Penyelesaian Isu Botol Bocor Hab Terengganu"*
    * *Sub-tugasan 1:* Kumpul 3 laporan pelanggan KT (Selesai).
    * *Sub-tugasan 2:* Hubungi pihak kurier untuk semakan hentakan bungkusan (Sedang Berjalan).
    * *Sub-tugasan 3:* Semak nombor kelompok botol kilang (Belum).
    * *Sub-tugasan 4:* Keluarkan baucar pampasan RM10 (Belum).

### Modul 3: Turn Deliverables Drawer (Laci Artifak Rasmi)
* **Objektif:** Mengasingkan hasil kerja dokumen penting daripada perbualan sembang supaya pengguna tidak perlu menatal semula perbualan yang panjang.
* **Kategori Artifak yang Didaftarkan:**
  * **Dokumen & Hamparan:** Baucar diskaun Google Docs, analisis jualan Google Sheets.
  * **Bahan Pemasaran:** Pautan reka bentuk poster promosi Canva & aset Adobe.
  * **Logistik:** E-tiket penerbangan kru Skyscanner, baucar tempahan hotel Booking.com.
  * **Laporan:** Ringkasan audit aduan pembungkusan dan penyata kewangan jualan RM4,953.
* **Tindakan Klien:** Butang laci di sudut atas memaparkan lencana nombor artifak aktif dengan fungsi *Preview* dan *1-Click Export*.

### Modul 4: Autonomous Procedural Skill Generation (`/learn`)
* **Objektif:** Membolehkan ejen belajar dan mendokumentasikan prosedur operasi standard (SOP) baharu secara berterusan.
* **Mekanisme Pelaksanaan:**
  * Apabila pengguna mengajar satu SOP baharu melalui arahan biasa, contohnya:
    > *"Lepas ni kalau ada aduan botol pecah di Terengganu, jangan terus refund duit. Minta nombor siri botol dulu, catat dalam Google Sheets, dan bagi kupon diskaun 20% untuk pembelian seterusnya."*
  * Ejen mengenali ini sebagai arahan penubuhan SOP, memanggil enjin pembelajaran, dan menjana fail kemahiran maya:
    * `/skills/procedural/skill_terengganu_leakage_sop.md`
  * Fail ini mematuhi piawaian **agentskills.io** lengkap dengan penerangan, langkah pelaksanaan (*step-by-step*), dan syarat sekatan.
  * Ejen mendaftarkan arahan pintas (*slash command*): `/aduan-terengganu` untuk kegunaan pantas masa hadapan.

### Modul 5: Subagent Delegation Engine (Pemisahan Beban Konteks)
* **Objektif:** Mengelakkan tetingkap konteks ejen utama daripada tepu dengan data teknikal yang tidak perlu.
* **Hierarki Ejen:**
  * **Ejen Utama (Master Retail Conductor):** Menjaga hubungan dengan pengguna, menguatkuasakan invarian JEV, dan menyelaraskan laporan akhir.
  * **Sub-Ejen A (Logistics & Travel Runner):** Mengendalikan panggilan alatan Skyscanner, Booking.com, dan Google Maps secara terasing.
  * **Sub-Ejen B (Creative & Marketing Runner):** Mengendalikan panggilan Canva, Adobe, dan penghasilan teks promosi jualan.
  * **Sub-Ejen C (DevOps & Data Runner):** Mengendalikan pertanyaan Supabase SQL, semakan commit GitHub, dan status pelancaran Vercel.
* **Hasil:** Konteks sembang utama kekal bersih, pantas, dan menjimatkan penggunaan token secara ketara.

### Modul 6: Bundle Profiles Switcher (Pengurusan Profil Plugin)
* **Objektif:** Membolehkan pengguna menukar mod kerja aplikasi mengikut konteks tugas harian dengan 1-klik di halaman Gedung Plugin.
* **4 Profil Standard yang Disediakan:**
  1. **Profil HQ & Eksekutif:** JEV Engine + Gmail + Google Sheets + Google Docs + Supabase.
  2. **Profil Pemasaran & Media Sosial:** Canva + Adobe + Mixpanel + Google Drive.
  3. **Profil Operasi Gerai & Kru Jelajah:** Skyscanner + Booking.com + Google Maps + COROS + Apple Health.
  4. **Profil Kejuruteraan & Sistem:** GitHub + Vercel + Supabase + Google Tasks.

---

## 6. DEFINISI STRUKTUR DATA & SKEMA TYPESCRIPT

Berikut ialah model data TypeScript yang akan disuntik ke dalam kod aplikasi:

```typescript
// --- 1. Human-in-the-Loop Proposal ---
export interface PendingActionProposal {
  id: string;
  toolName: string;
  category: 'financial' | 'inventory' | 'communication' | 'database';
  title: string;
  description: string;
  payload: Record<string, any>;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: string;
}

// --- 2. Goal Lifecycle Management ---
export interface GoalTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface OperationalGoal {
  id: string;
  title: string;
  description: string;
  category: 'logistics' | 'quality_control' | 'sales' | 'event';
  status: 'planned' | 'in_progress' | 'blocked' | 'completed';
  progressPercentage: number;
  tasks: GoalTask[];
  assignedSubagent?: string;
  targetDate?: string;
}

// --- 3. Turn Deliverables ---
export interface DeliverableArtifact {
  id: string;
  title: string;
  type: 'spreadsheet' | 'document' | 'design_poster' | 'travel_ticket' | 'invoice_receipt';
  sourcePlugin: string;
  downloadUrl?: string;
  viewUrl?: string;
  metadata: Record<string, any>;
  timestamp: string;
}

// --- 4. Autonomous Skill Manifest ---
export interface AutonomousSkill {
  id: string;
  command: string; // e.g. "/aduan-terengganu"
  title: string;
  description: string;
  author: 'system' | 'learned_from_human';
  instructions: string;
  requiredPlugins: string[];
  createdAt: string;
  executionCount: number;
}
```

---

## 7. PELAN TINDAKAN PELAKSANAAN (PHASED ROADMAP)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     FASA PELAKSANAAN NAIK TARAF ABANGCOLEK-OS                   │
├───────────────────────┬───────────────────────────┬─────────────────────────────┤
│        FASA 1         │          FASA 2           │           FASA 3            │
│  (Teras Kawalan & UI) │ (Memori & Artifak Pintar) │    (Skala Autonomi Penuh)   │
├───────────────────────┼───────────────────────────┼─────────────────────────────┤
│ • Kad Kelulusan HITL  │ • Laci Turn Deliverables  │ • Enjin Pembelajaran /learn │
│ • Widget Goal Tracker │ • Suis Profil Plugins     │ • Orkestrasi Sub-Ejen Swarm │
│ • Penalaan Invarian   │ • Eksport Laporan Rasmi   │ • PWA Sokongan Luar Talian  │
└───────────────────────┴───────────────────────────┴─────────────────────────────┘
```

### Fasa 1: Teras Kawalan & Keselamatan Operasi (Immediate - Hari Ini)
* Membina komponen kad kelulusan **HITL Action Confirmation** di dalam ruang sembang.
* Membina widget **Goal Lifecycle Tracker** di bahagian atas antaramuka sembang untuk memaparkan misi aktif.
* Menghubungkan fungsi pengesahan ini kepada alatan sensitif (`issue_refund` dan pengubahsuaian status pesanan).

### Fasa 2: Pengurusan Artifak & Pengoptimuman Profil (Jangka Sederhana)
* Membina komponen **Deliverables Drawer** untuk menyimpan pautan invois, fail Google Sheets, dan poster Canva siap.
* Menambah suis **Bundle Profiles** di dalam tab *Gedung Plugins* untuk pertukaran mod kerja pantas.

### Fasa 3: Pembelajaran Autonomi & Skala Operasi (Jangka Panjang)
* Mengintegrasikan protokol `/learn` bagi membolehkan ejen membina fail `SKILL.md` sendiri.
* Melaksanakan seni bina sub-ejen terasing untuk tugasan logistik dan analitik berat.

---

## 8. KESIMPULAN

Dokumen ini merumuskan visi masa depan bagi **ABANGCOLEK-OS**. Dengan menggabungkan **ketegasan logik JEV System-1**, **fleksibiliti runtime DeepSeek Harness**, dan **kecerdasan adaptif Hermes Agent**, sistem ini bersedia menjadi piawaian emas automasi operasi runcit berautonomi di Malaysia.

*Dokumen ini sedia dijadikan panduan kod rasmi untuk fasa pelaksanaan seterusnya.*
