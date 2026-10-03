# KEDUDUKAN DAN PANDUAN SENI BINA JEV DALAM PROJEK ABANGCOLEK-OS
**Penyelidikan Terperinci Kedudukan Kod, Peranan, Integrasi & Aliran Operasi JEV (Justified Entity Validation)**  
*Tarikh Audit: 2026-09-30 | Sistem: ABANGCOLEK-OS*  
*Fail Rujukan Rasmi: `/docs/KEDUDUKAN_DAN_ARKITEKTUR_JEV_DALAM_PROJEK.md`*

---

## 1. APA ITU JEV DALAM PROJEK INI?

**JEV (Justified Entity Validation)** ialah **enjin penaakulan dan klasifikasi berstruktur (System-1 Reasoning & Validation Engine)** yang bertindak sebagai "otak penapis" bagi setiap maklumat, mesej WhatsApp pelanggan, aduan kerosakan botol, dan transaksi perniagaan dalam **ABANGCOLEK-OS**.

JEV memastikan perisian tidak berhalusinasi (*zero mock data*), mematuhi keselamatan jenis ketat (*Typesafe*), dan sentiasa mengunci punca masalah (*Root Cause Invariant*) sekiranya bukti fizikal belum disahkan secara mutlak.

---

## 2. KEDUDUKAN FAIL & KOD JEV DALAM PROJEK

Di dalam struktur projek, JEV berada pada 4 lapisan teras:

```text
PROJEK ABANGCOLEK-OS
│
├── 🧠 LAPISAN ENJIN TERAS (LOGIK & TAKSONOMI)
│   └── 📄 src/services/jevEngine.ts          ← Enjin Utama Klasifikasi 7-Dimensi
│
├── 🤖 LAPISAN EJEN PINTAR (AI REASONING)
│   └── 📄 src/services/gemini.ts             ← Panggilan Alat 'jev_classify_issue' & Master System Prompt
│
├── 🖥️ LAPISAN ANTARA MUKA (UI & SIMULATOR)
│   └── 📄 src/components/AbangColekDiscoveryView.tsx
│       ├── Sub-tab 'jev_tester'               ← Simulator Langsung JEV System-1 (<50ms)
│       ├── Sub-tab 'history'                  ← Log Sejarah Audit JEV Tersimpan
│       ├── Sub-tab 'overview'                 ← Metrik 389+ Penilaian JEV
│       └── Sub-tab 'questions'                ← Papan 8 Soalan Asas (Human-in-the-Loop)
│
└── 📚 LAPISAN DOKUMENTASI & SPESIFIKASI
    ├── 📄 JEV.md                              ← Prinsip Asas Matematik & Algoritma JEV
    ├── 📄 docs/JEV_ECOSYSTEM_AUDIT_REPORT.md  ← Laporan Audit Integriti JEV
    └── 📄 docs/KEDUDUKAN_DAN_ARKITEKTUR_JEV_DALAM_PROJEK.md ← Fail Rujukan Rasmi Ini
```

---

## 3. BEDAH SIASAT KOD TERAS JEV (`src/services/jevEngine.ts`)

Fail `src/services/jevEngine.ts` (398 baris kod) mengandungi:

### A. Taksonomi 7-Dimensi JEV (`JEV_TAXONOMY`)
Setiap mesej atau aduan yang masuk dipecahkan secara serentak ke dalam 7 dimensi tertutup:
1. **Brand**: `ABANGCOLEK`, `LIURLELEH`, `JERUX`, `MULTI_BRAND`, `UNKNOWN`
2. **BusinessFunction**: `PRODUCTION`, `PACKAGING`, `DISTRIBUTION`, `TRANSPORT`, `AGENT_MANAGEMENT`, `CUSTOMER_SERVICE`, dll.
3. **SalesChannel**: `DIRECT`, `AGENT`, `POPUP`, `EVENT`, `DELIVERY`, `ONLINE`, dll.
4. **CustomerIntent**: `PURCHASE`, `PRICE_QUERY`, `COMPLAINT`, `REFUND`, `AGENT_APPLICATION`, dll.
5. **IssueClass**: `LEAKAGE`, `SEAL_FAILURE`, `DELIVERY_DELAY`, `DELIVERY_DAMAGE`, `WRONG_ITEM`, dll.
6. **ProcessStage**: `PRODUCTION`, `FILLING`, `PACKAGING`, `QC`, `TRANSPORT`, `LAST_MILE_DELIVERY`, dll.
7. **RootCauseStatus**: `UNDETERMINED`, `HYPOTHESIS`, `UNDER_INVESTIGATION`, `VERIFIED`, `REJECTED`

### B. Invarian Keselamatan Mutlak (Root Cause Invariant Lock)
Dalam perniagaan kuah colek, jika berlaku aduan botol bocor atau penutup pecah (*LEAKAGE* atau *SEAL_FAILURE*):
- Status **RootCauseStatus DIKUNCI SECARA KETAT sebagai `UNDETERMINED`**.
- Ejen AI mahupun sistem dilarang membuat andaian sama ada kilang atau pos laju yang bersalah sehingga bukti nombor lot botol dan gambar fizikal disahkan.

### C. Aliran Automasi Tindakan Workspace (`executeAutomatedJevAction`)
Selepas JEV mengklasifikasikan aduan, ia boleh mencetuskan 4 tindakan automatik:
- **`task`**: Cipta tugasan siasatan kualiti dalam Google Tasks.
- **`email`**: Draf emel permohonan maaf dan baucar penggantian dalam Gmail.
- **`calendar`**: Jadualkan sesi post-mortem dengan pembekal botol dalam Google Calendar.
- **`sheet`**: Rekod nombor siri aduan dalam lejar Google Sheets untuk kawalan QC.

---

## 4. INTEGRASI JEV DENGAN EJEN AI GEMINI (`src/services/gemini.ts`)

1. **Alat Rasmi Ejen (`jev_classify_issue`)**:
   Ejen Gemini mempunyai alat khusus `jev_classify_issue`. Apabila pengguna berbual: *"Customer di Terengganu mengadu botol pecah..."*, ejen secara autonomi memanggil alat ini untuk mendapatkan keputusan JEV 7-dimensi sebelum merangka jawapan.
2. **Arahan Sistem Utama (`MASTER_SYSTEM_INSTRUCTION`)**:
   Menetapkan undang-undang bahawa ejen **wajib** menggunakan JEV apabila menilai mesej pelanggan dan tidak boleh melangkau peraturan *UNDETERMINED Root Cause*.

---

## 5. CARA MELIHAT DAN MENGUJI JEV DALAM APLIKASI (UI)

Anda boleh melihat dan mencuba sendiri JEV dalam aplikasi sekarang:
1. Buka tab **"Abang Colek Discovery"** pada menu sisi.
2. Klik sub-tab **"Simulator JEV System-1"** (`jev_tester`):
   - Taip sebarang mesej (contoh: *"Salam bang, kuah colek sampai tapi kotak basah kuah meleleh"*).
   - Klik butang **"Nilaikan dengan JEV System-1"**.
   - Sistem akan memproses dan memaparkan 7 kad dimensi berwarna berserta skor keyakinan (*confidence 0.0 - 1.0*) dalam masa **<50 milisaat**.
   - Butang tindakan segera akan muncul untuk hantar emel Gmail atau cipta Google Task dengan 1-klik.
3. Klik sub-tab **"Sejarah Audit JEV"** (`history`) untuk melihat rekod aduan yang pernah diproses.
4. Klik sub-tab **"8 Soalan Asas Operasi"** (`questions`) untuk melihat bagaimana JEV melindungi keputusan perniagaan pengasas (*Human-in-the-Loop*).

---

## 6. KESIMPULAN

Kedudukan JEV dalam projek ini adalah sebagai **Tunjang Integriti Operasi (Operating Integrity Backbone)**. Ia memastikan setiap keputusan perniagaan, aduan pelanggan, dan pengagihan stok diuruskan secara saintifik, berstruktur, berasaskan bukti, dan bebas daripada kesilapan andaian manusia.
