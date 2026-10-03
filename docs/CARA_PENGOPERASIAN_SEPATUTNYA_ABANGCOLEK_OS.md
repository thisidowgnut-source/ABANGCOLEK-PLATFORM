# CARA PENGOPERASIAN SEPATUTNYA SISTEM ABANGCOLEK-OS
**Pelan Induk Aliran Kerja Hujung-ke-Hujung (End-to-End Operational Blueprint)**  
*Sistem: ABANGCOLEK-OS (v4.2.0) | Pengasas: Megat Shaifulreza (Epull)*  
*Entiti: Liurleleh House Malaysia | Akaun TikTok: @styloairpool*  
*Fail Rujukan Rasmi: `/docs/CARA_PENGOPERASIAN_SEPATUTNYA_ABANGCOLEK_OS.md`*

---

## 1. MISI & REALITI PERNIAGAAN ABANG COLEK

**ABANGCOLEK-OS** bukan sekadar aplikasi biasa, ia adalah **Sistem Operasi Peruncitan & Logistik Pintar (Smart Retail & Logistics OS)** yang dibina khusus untuk menyelesaikan cabaran sebenar perniagaan makanan jalanan (*street food F&B*) jenama **Abang Colek**:

1. **Pengasas (Megat Shaifulreza / Epull)** sentiasa turun padang di gerai (Pasar Karat JB, Toppen, festival makanan jelajah) — pengasas tiada masa menghadap komputer untuk menaip laporan panjang.
2. **Pesanan WhatsApp Sangat Banyak & Berserabut**: Ratusan mesej masuk bertanya harga, lokasi gerai, nak beli borong, atau aduan kerosakan.
3. **Logistik Bas Ekspres Rentas Negeri**: Penghantaran stok kuah colek ke Pantai Timur (Kuala Terengganu, Kota Bharu) dan Utara dihantar menggunakan kargo bas ekspres (TBS ke MBKT / Lembah Sireh) dan memerlukan amaran 1 jam sebelum bas sampai.
4. **Isu Botol Pecah / Penutup Bocor (*LEAKAGE*)**: Cecair kuah colek yang likat berisiko bocor jika penutup tidak kemas atau dicampak semasa logistik. Puncanya perlu disiasat secara saintifik (JEV) tanpa menuduh melulu.

---

## 2. BAGAIMANA 5 KORIDOR SISTEM INI BERFUNGSI SEPATUTNYA

```text
               ┌────────────────────────────────────────────────────────┐
               │         1. KORIDOR PEMASARAN & VIRAL (TIKTOK)          │
               │   @styloairpool (75.2k Followers, Lagu Kasi Lagi-Lagi) │
               └──────────────────────────┬─────────────────────────────┘
                                          │ Pelanggan tertarik & klik pautan
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │         2. KORIDOR PENGAMBILAN & AUTOMATIK WOCS        │
               │   Mesej WhatsApp Masuk -> 12 Templat & Arahan /command │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [Aduan Kerosakan / Bocor]                         [Pesanan Jualan Sah]
                  │                                               │
                  ▼                                               ▼
┌───────────────────────────────────┐           ┌───────────────────────────────────┐
│     3. KORIDOR KESELAMATAN JEV    │           │    4. LOGISTIK KARGO BAS EKSPRES  │
│ - Klasifikasi 7-Dimensi (<50ms)   │           │ - TBS -> MBKT -> Lembah Sireh     │
│ - Kunci Invarian: 'UNDETERMINED'  │           │ - Amaran WhatsApp 1 Jam Sebelum   │
│ - Cipta Google Task & Emel Kupon  │           │ - Kod DuitNow QR Bayaran Tambang  │
└───────────────────────────────────┘           └───────────────────────────────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │    5. KOKPIT EJEN AI GEMINI & GOOGLE WORKSPACE         │
               │   Pengasas beri arahan suara/teks ringkas di telefon: │
               │   - Google Calendar & Meet (Mesyuarat Stokis)          │
               │   - Google Sheets (Lejar Kiraan Stok & Jualan Harian) │
               │   - Peta Armada Google Maps (Taburan Hab & Ejen)       │
               └────────────────────────────────────────────────────────┘
```

---

## 3. PERINCIAN SETIAP KORIDOR OPERASI

### KORIDOR 1: Pemasaran Kandungan & Tarikan Viral TikTok
- **Platform:** TikTok `@styloairpool` (75.2K Pengikut, 793.2K Suka).
- **Rhythm Siaran (SOP Mingguan):**
  - *Isnin*: Video reaksi muka pertama kali rasa (*First Bite Reaction*).
  - *Rabu*: Cabaran pedas tahap dewa (*Pedas Challenge*).
  - *Jumaat*: Momen jujur pengasas (*Founder Epull Moment*).
  - *Sabtu*: Suasana gerak padu gerai malam (*Crowd Energy*).
- **Lagu Tema Wajib:** Lagu jingle rasmi *"Kasi Lagi-Lagi"* (85-95 BPM) dimainkan di latar belakang video bagi memupuk ingatan jenama (*brand recall*).
- **Hasil:** Penonton terliur dan menekan pautan bio WhatsApp atau datang ke gerai terdekat.

---

### KORIDOR 2: Pengendalian Mesej WhatsApp (WOCS Engine)
- Pelanggan menghantar mesej ke nombor WhatsApp rasmi (01168444656 / 0178245667).
- Sistem WOCS menggunakan **12 Templat Mesej Piawai**:
  - Mesej Aluan & Senarai Harga Rasmi:
    * 250ml: RM 15
    * 500ml: RM 28 (Paling laris)
    * 1 Liter: RM 50
    * **Promosi Jimat:** Beli 3 Botol Percuma 1 Botol!
  - Borang pendaftaran cabutan bertuah (*Lucky Draw*) menggunakan Google Forms.
- **Pintasan Arahan Pantas Staf (`/commands`):**
  - `/landing`: Cipta laman jualan promosi kilat.
  - `/assign`: Tugaskan penghantaran stok kepada ejen.
  - `/tiktok`: Jadualkan video viral seterusnya.
  - `/report`: Dapatkan ringkasan jualan mingguan.

---

### KORIDOR 3: Penapis Kebenaran JEV (Audit Kualiti Botol Bocor)
Apabila pelanggan menghantar mesej aduan (contoh: *"Bang kuah tumpah meleleh dlm kotak"*):
1. **Analisis Pantas (<50ms):** Enjin JEV System-1 mengkategorikan mesej ke dalam 7 dimensi (Brand, BusinessFunction, SalesChannel, CustomerIntent, IssueClass, ProcessStage, RootCauseStatus).
2. **Kunci Invarian Keselamatan:** Status punca masalah **DIKUNCI KETAT sebagai `UNDETERMINED`**.
   - Sistem tidak membenarkan ejen membuat tuduhan bahawa kurier yang cuai atau kilang yang rosak sehingga ada bukti nombor lot botol dan gambar penutup.
3. **Tindakan Automatik Serta-Merta:**
   - **Google Tasks:** Cipta tugasan siasatan kualiti untuk staf semak nombor lot.
   - **Gmail:** Hantar draf emel permohonan maaf dan kod baucar gantian kepada pelanggan.
   - **Google Sheets:** Catat insiden ke dalam lejar kawalan kualiti (QC).

---

### KORIDOR 4: Logistik Kargo Bas Ekspres & SOP 1 Jam
Bagi penghantaran stok ke Terengganu, Kelantan, atau Johor:
1. Kotak stok dihantar ke kargo bas ekspres di **Terminal Bersepadu Selatan (TBS)**.
2. Sistem menjejak anggaran waktu tiba (ETA) bas di terminal destinasi (MBKT Kuala Terengganu / Lembah Sireh Kota Bharu / Larkin JB).
3. **Pemberitahuan Automatik 1 Jam Sebelum Tiba:**
   - Sistem menjana pautan pantas WhatsApp kepada ejen (cth: Kak Mas di MBKT): *"Perhatian Kak Mas, bas ekspres membawa 50 botol kuah colek dijangka tiba di Platform 4 MBKT dalam masa 1 jam lagi. Sila bersedia untuk ambil kargo."*
   - Dilampirkan kod **DuitNow QR** untuk bayaran kos tambang kargo kepada pemandu bas.

---

### KORIDOR 5: Kokpit Ejen AI & Google Workspace (Bilik Kawalan Pengasas)
Pengasas Megat Shaifulreza hanya perlu bercakap atau menaip secara santai dengan Ejen AI:
- *"Gemini, susun jadual jumpa stokis Pantai Timur esok petang."*  
  👉 Ejen cipta acara dalam **Google Calendar** dan sediakan pautan **Google Meet**.
- *"Berapa kutipan jualan gerai Pasar Karat malam tadi?"*  
  👉 Ejen semak pangkalan data dan lejar **Google Sheets**, kemudian paparkan carta palang hasil.
- *"Tengok peta mana kawasan stokis yang kurang stok."*  
  👉 Ejen buka **Peta Armada Google Maps** dengan pin hijau (stok mencukupi) dan pin merah (perlu restock segera).

---

## 4. CONTOH SEHARI DALAM OPERASI ABANG COLEK (DAY-IN-THE-LIFE)

| Waktu | Tindakan Operasi | Modul ABANGCOLEK-OS Yang Bertindak |
|---|---|---|
| **10:00 AM** | Siasat aduan pelanggan dari Kota Bharu | Enjin JEV System-1 mengelaskan `LEAKAGE` -> Buka tugasan Google Task & draf emel ganti rugi. |
| **02:00 PM** | Penghantaran 100 botol ke Kuala Terengganu | Modul `Bus Freight` jana waybill TBS-MBKT, jana pautan WhatsApp ejen & DuitNow QR. |
| **05:00 PM** | Persediaan buka gerai malam | Buka sub-tab `Booth Ops` -> Tanda senarai semak 10 perkara Pre-Event. |
| **08:30 PM** | Gerai dibuka & lagu dimainkan | Pemain jingle memainkan *"Kasi Lagi-Lagi"* di reruai untuk tarik pelanggan. |
| **11:00 PM** | Bas ekspres hampir sampai di Terengganu | Notifikasi amaran automatik 1 Jam dihantar kepada Kak Mas di MBKT. |
| **01:30 AM** | Gerai ditutup & kira hasil | Pengasas beritahu AI -> Data jualan terus masuk lejar Google Sheets & Supabase. |

---

## 5. KESIMPULAN
**ABANGCOLEK-OS sepatutnya berfungsi sebagai "Pengurus Operasi Digital 24 Jam" bagi Megat Shaifulreza.** 

Pengasas boleh fokus pada apa yang beliau paling hebat — iaitu beramah mesra dengan pelanggan, mencipta kandungan video viral di TikTok, dan menjaga rasa kuah colek yang padu — sementara sistem ini menguruskan kargo, pesanan WhatsApp, penyiasatan botol bocor, dan lejar kewangan secara automatik di belakang tabir.
