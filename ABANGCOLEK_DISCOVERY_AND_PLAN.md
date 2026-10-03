# ABANGCOLEK: Penyelidikan Forensik, Sintesis Data & Pelan Pembangunan Operasi (Business OS)

Dokumen ini mengumpulkan keseluruhan data daripada repositori rasmi:  
**`https://github.com/thisisabangcolek-web/Abang-Colek.git`**  
*(Intelligence & Business Discovery Engine v4.2.0, Standard Pengurusan Sovereign SMS-v1.0)*  
serta menetapkan pelan penaiktarafan (*improvement plan*) untuk sistem **ABANGCOLEK-OS**.

---

## 1. Profil Jenama & Entiti Perniagaan yang Ditemui

| Entiti / Jenama | Saluran / Handle | Status Forensik | Keterangan Operasi |
| :--- | :--- | :---: | :--- |
| **ABANGCOLEK** | TikTok `@styloairpool`<br>Instagram `@airpoolstylo`<br>Instagram `@abangcolek` | **DISAHKAN AWAM** | Jenama utama F&B Malaysia terkenal dengan **Kuah Colek Buah**, rojak buah segar, jeruk asam boi, dan set pencicah pedas manis. Beroperasi melalui gerai pop-up bergerak, festival makanan, dan jualan langsung. |
| **STYLOAIRPOOL** | TikTok `@styloairpool`<br>Threads `@airpoolstylo` | **DISAHKAN AWAM** | Entiti penjenamaan/kolektif pasukan operasi yang mengendalikan jualan pop-up, karnival, dan penciptaan kandungan video TikTok. |
| **LIURLELEH / LIUR LELEH HOUSE** | Dikaji bersama | **DALAM KAJIAN** | Jenama/rakan produk kuah colek & jeruk mangga/kedondong. Hubungan rasmi entiti (anak syarikat / rakan niaga) kekal diasingkan tanpa andaian pemilikan mutlak sehingga disahkan pemilik. |
| **JERUX / THE FAMOUS JERUX** | Dikaji bersama | **DALAM KAJIAN** | Jenama produk jeruk buah potong rangup & kuah pencicah. |
| **EJEN / STOKIS REGIONAL** | `@jeruxsliurlelehterengganu` | **DISAHKAN RESELLER** | Rangkaian ejen dan stokis pengedaran di Terengganu dan seluruh Malaysia. |

---

## 2. Metrik Forensik Sebenar (Empirical Ground Truth)

Berdasarkan audit pangkalan data forensik dan semakan ujian kod 53/53:

* **Tangkapan Bukti Mentah (*Raw Evidence Captures*)**: **167 snapshot** (100% dipadankan dengan hash kriptografi SHA-256).
* **Deduplikasi Bukti**: **39 snapshot berulang** diketepikan secara dinamik, menghasilkan **128 rekod bukti unik ternormal**.
* **Pengasingan Identiti Rentas-Platform**: Sifar pertembungan ID (*0 collisions*) menggunakan SHA-256 partition platform.
* **Kiraan Kandungan BI**: **123 pos/video/foto** (79 video TikTok yt-dlp, 2 foto gallery-dl, 42 snapshot Threads & Instagram).
* **Klasifikasi Pintar JEV System-1**: **389 keputusan live** menggunakan model TypeSafe `jev-1.13.0` dengan 100% cache determinisme.
* **Knowledge Graph**: **131 entiti**, **128 hubungan berarah**, dan **124 peristiwa garis masa** tersimpan di pangkalan data SQLite dan dimigrasikan ke Supabase PostgreSQL (11 jadual ber-RLS).
* **Integriti Data**: Sifar data sintetik / palsu dalam pengeluaran. Ketiadaan bukti dilabel sebagai `UNKNOWN`.

---

## 3. Papan 8 Soalan Asas Operasi (Foundational Business Questions)

Sebelum membina perisian ERP/OS yang terlalu rumit, 8 aliran kerja (*workflows*) operasi sebenar berikut disahkan perlu dilengkapkan bersama pemilik perniagaan (*Human-in-the-Loop*):

1. **`ORDER_FLOW` (Aliran Pesanan Sebenar)**:  
   Bagaimana pesanan pelanggan diterima (WhatsApp, TikTok Shop, gerai pop-up), direkodkan, dan diserahkan kepada pelanggan tanpa kehilangan resit transaksi?
2. **`STOCK_OWNERSHIP` (Pemilikan Stok & Inventori)**:  
   Siapa yang memiliki inventori di HQ vs. van gerai bergerak pop-up vs. pegangan stok ejen/reseller?
3. **`AGENT_RESTOCK` (Penambahan Stok & Pematuhan Ejen)**:  
   Apakah syarat kelayakan, harga borong, diskaun kuantiti, dan prosedur penambahan stok bagi ejen dan stokis?
4. **`COMPLAINT_TRACE` (Jejak Aduan & Kerosakan Produk)**:  
   Bagaimana aduan pelanggan seperti **kebocoran penutup botol kuah colek (`LEAKAGE`)** atau perubahan rasa (`TASTE`) dijejaki kembali ke nombor lot pembungkusan, pembekal botol, atau syarikat kurier?
5. **`PRODUCTION_TRACE` (Jejak Pembuatan & Pembungkusan)**:  
   Apakah rekod resipi (BOM), bancuhan kuah, kawalan suhu, dan pemeriksaan QC penutup botol sebelum keluar dari dapur/kilang?
6. **`TRANSPORT_TRACE` (Logistik & Pengangkutan)**:  
   Bagaimana stok dihantar antara HQ ke lokasi acara/pasar malam atau dipos kepada pelanggan luar negeri?
7. **`EVENT_CREW` (Pengurusan Pasukan Acara / Gerai)**:  
   Bagaimana jadual giliran krew gerai, pembahagian komisen jualan harian, dan baki stok selepas karnival direkodkan?
8. **`PAYMENT_CLOSE` (Penutupan Tunai & Imbasan DuitNow QR)**:  
   Bagaimana jualan tunai gerai pop-up, pembayaran DuitNow QR, dan bayaran COD diselaraskan dengan penyata akaun bank syarikat?

---

## 4. Taksonomi JEV 7 Dimensi untuk Abang Colek

Sistem menggunakan model TypeSafe JEV (`jev-1.13.0`) dengan 7 dimensi taksonomi berkecuali:

1. **`Brand`**: `ABANGCOLEK`, `LIURLELEH`, `JERUX`, `MULTI_BRAND`, `UNKNOWN`
2. **`BusinessFunction`**: `PRODUCTION`, `PROCUREMENT`, `PACKAGING`, `WAREHOUSING`, `INVENTORY`, `DISTRIBUTION`, `TRANSPORT`, `AGENT_MANAGEMENT`, `DIRECT_SALES`, `RETAIL`, `POPUP`, `EVENT`, `CUSTOMER_SERVICE`, `MARKETING`, `CONTENT`, `RECRUITMENT`, `FINANCE`, `COMPLIANCE`, `OTHER`, `UNKNOWN`
3. **`SalesChannel`**: `DIRECT`, `SOCIAL_COMMERCE`, `AGENT`, `HOME_SELLER`, `POPUP`, `EVENT`, `RETAIL`, `DELIVERY`, `COD`, `ONLINE`, `UNKNOWN`
4. **`CustomerIntent`**: `PURCHASE`, `PRICE_QUERY`, `STOCK_QUERY`, `LOCATION_QUERY`, `DELIVERY_QUERY`, `PRODUCT_QUERY`, `CUSTOMIZATION`, `AGENT_APPLICATION`, `JOB_APPLICATION`, `COMPLAINT`, `REFUND`, `RETURN`, `PRAISE`, `GENERAL_CHAT`, `UNKNOWN`
5. **`IssueClass`**: `PRODUCT_QUALITY`, `PACKAGING`, `LEAKAGE`, `SEAL_FAILURE`, `FRESHNESS`, `TASTE`, `APPEARANCE`, `QUANTITY`, `WRONG_ITEM`, `STOCKOUT`, `DELIVERY_DELAY`, `DELIVERY_DAMAGE`, `TRANSPORT`, `STORAGE`, `AGENT_HANDLING`, `CUSTOMER_SERVICE`, `PAYMENT`, `PRICE`, `LOCATION`, `UNKNOWN`
6. **`ProcessStage`**: `SUPPLIER`, `RAW_MATERIAL_RECEIVING`, `PRODUCTION`, `FILLING`, `PACKAGING`, `QC`, `COLD_STORAGE`, `WAREHOUSE`, `DISPATCH`, `TRANSPORT`, `AGENT_RECEIVING`, `AGENT_STORAGE`, `POS`, `POINT_OF_SALE`, `LAST_MILE`, `LAST_MILE_DELIVERY`, `CUSTOMER_STORAGE`, `UNKNOWN`
7. **`RootCauseStatus`**: `UNDETERMINED`, `HYPOTHESIS`, `UNDER_INVESTIGATION`, `VERIFIED`, `REJECTED`

---

## 5. Pelan Tindakan Menaiktaraf ABANGCOLEK-OS

### Fasa 1: Transformasi Data Teras Aplikasi (Immediate Upgrade)
* Gantikan dataset generik e-dagang luar negara dengan **dataset operasi sebenar Abang Colek**:
  - Produk: *Kuah Colek Buah Original (500g)*, *Colek Padu Crispy*, *Jeruk Mangga Asam Boi*, *Jeruk Kedondong Rangup*, *Pakej Niaga Ejen Permulaan (50 Botol)*.
  - Bandar & Hub Malaysia: Johor Bahru (Toppen, Pasar Karat), Shah Alam Hub, Bangi, Kuala Terengganu, Kota Bharu, Penang, Melaka.
  - Isu & Tiket: Aduan penutup botol bocor (`LEAKAGE` / `SEAL_FAILURE`), pertanyaan lokasi gerai pop-up, permohonan pendaftaran ejen baru.

### Fasa 2: Pembinaan Modul "Discovery & JEV Engine" dalam UI
* Cipta tab interaktif **"Abang Colek Discovery"**:
  - Paparan metrik forensik 167 snapshot, 128 normalized records, 389 keputusan JEV.
  - Antaramuka pengesahan 8 Soalan Operasi Pemilik (*Owner Review Board*).
  - Simulator masa-nyata JEV System-1 untuk menguji teks aduan pelanggan/mesej WhatsApp menggunakan 7 dimensi taksonomi.

### Fasa 3: Penyelarasan Peta Logistik Google Maps
* Pindahkan titik peta logistik dari Brazil ke Malaysia:
  - Hub Utama: Johor Bahru (Toppen / Kilang Pengeluaran).
  - Hub Stokis & Pop-up: Pasar Karat JB, Shah Alam Central Hub, Stokis Terengganu, Hub Pasir Gudang.

### Fasa 4: Penyesuaian Ejen AI Gemini & Google Workspace
* Selaraskan prompt dan perkakas Gemini untuk memahami perniagaan Abang Colek:
  - Draf emel permohonan ejen & maklum balas aduan kuah colek di Gmail.
  - Tugasan siasatan kualiti pembungkusan botol di Google Tasks.
  - SOP bancuhan kuah & piawaian QC di Google Docs.
  - Penjejak stok jualan gerai di Google Sheets.
  - Borang maklum balas pelanggan gerai di Google Forms.
  - Bilik kecemasan operasi stokis di Google Meet.
