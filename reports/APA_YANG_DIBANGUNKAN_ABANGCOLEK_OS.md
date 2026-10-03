# Apa yang sedang dibangunkan dalam ABANGCOLEK-OS

**Dikemas kini:** 3 Oktober 2026, Asia/Kuala_Lumpur. **Status:** platform lokal dibina; final verification dan review preview AI Studio masih berasingan.

## 1. Produk yang dibina

ABANGCOLEK-OS diperluas menjadi satu platform operasi bisnes. Ia mempunyai landing page dan empat ruang kerja yang menggunakan rekod sama, dengan akses mengikut pengguna sebenar.

```text
+-----------------------+
| Landing page / katalog|
+-----------+-----------+
            |
+-----------------------+
| Customer | Staff      |
| Founder  | Developer  |
+-----------+-----------+
            |
+-----------------------+
| API + satu DB lokal   |
| Orders, stok, evidence|
| tugas, approval, audit|
+-----------------------+
```

| Ruang | Kerja yang dibekalkan |
|---|---|
| Landing page | Kenali jenama, lihat produk published, lokasi disahkan, permohonan ejen dan bantuan |
| Customer | Beli produk, pesanan sendiri, bukti pembayaran, aduan, balasan dan subspace ejen/stokis |
| Staff | Tugasan assigned, pesanan dalam scope, customer support, QC, shift/handoff, dokumen dan SOP |
| Founder | Dashboard keputusan, pesanan/bayaran/refund, stok/batch, stokis, marketing, task/docs/SOP, calendar, finance/report, pasukan dan policy |
| Developer | Runtime/health, durable jobs, quota/controls dan JEV evaluation; tiada kuasa bayaran daripada role ini |

## 2. Contoh satu kerja yang bersambung

Customer membuat pesanan. Server mengira harga dan reserve stok. Customer upload bukti pembayaran; founder mengesahkannya. Staff/founder meneruskan review, packing dan dispatch. Customer mengesahkan penerimaan dengan bukti. Founder melihat rekod pembayaran dan laporan daripada transaksi yang sama. Aduan merujuk order ID yang sama; tiada salinan manual antara portal.

## 3. Fungsi tambahan

- Flow berpandu dan full form daripada kontrak sama; opt-in draft untuk resume selepas offline.
- Ejen/stokis: permohonan, commercial terms, restock, receiving, custody/ownership, consignment/returns dan benefits berdasarkan policy diluluskan.
- Marketing: campaign/copy, asset rights/consent, exact-version approval, caption dan asset bundle export.
- Operasi: approved SOP, QC/evidence, release batch, shift handoff, day-close dan pembetulan berjejak.
- Kerja pasukan: task/outcome, dokumen/version, knowledge/SOP, calendar dan reporting.
- JEV: typed assessments, evidence, unknowns/abstention, enam pack domain dan evaluation. Local rules tidak mendakwa calibrated native probabilities atau membenarkan financial action sendiri.
- Local automation: durable morning brief/case summary, lease/recovery, quota dan pause/read-only controls.

## 4. Lokasi dan perubahan struktur

Kod dibangunkan dalam checkout lokal **`D:\ABANGCOLEK-OS`**. Perubahan lokal tidak diselaraskan secara automatik ke Google AI Studio atau diterbitkan ke internet.

`src/main.tsx` kini memount `src/features/platform/AppRouter.tsx`. Fail `src/App.tsx` lama masih berada dalam checkout tetapi tidak dimount sebagai aplikasi utama. Banyak fungsi operasi mendapat UI/server boundary baharu; integrasi Google/Supabase dan data cloud lama tidak dipindahkan atau disambung secara automatik.

API lokal menggunakan Bun dengan database SQLite di `var/lib/platform/platform.sqlite`. QA menggunakan database berasingan di `var/lib/qa/`. Data QA tidak menjadi produk, pesanan atau pelanggan bisnes sebenar.

### 4.1 Mengapa URL utama berubah

`src/main.tsx` sekarang merender `AppRouter`, yang memilih landing page untuk `/`, login untuk `/login`, dan workspace mengikut URL serta membership. Sebelum ini `src/App.tsx` mengurus paparan melalui `activeTab`, dengan default dashboard. Sebab itu URL `/` kini memaparkan landing page, bukan dashboard lama.

Router ialah pemilih halaman; workspace ialah ruang kerja untuk role yang dibenarkan. URL founder tidak memberi permission founder. Menu bagi customer, staff, founder dan developer menggunakan source yang sama dengan scope berlainan.

### 4.2 Kod lama masih ada, tetapi feature parity belum lengkap

`src/App.tsx` masih mengimport komponen Gmail, Docs, Sheets, Calendar, Maps, Meet, Chat Workspace, Plugins, Bus Freight dan Agent Performance. Komponen itu tidak automatik menjadi reachable apabila entrypoint bertukar kepada `AppRouter`.

Route founder `legacy` sekarang merender `IntegrationWorkspace`, iaitu readiness/status dan shortcut ke task/document/calendar/case/marketing baharu. Ia **tidak memount `src/App.tsx` lama**. Oleh itu, menu itu tidak membuktikan semua integration views lama sudah tersedia dalam shell baharu. Retention source, integration connection, feature parity dan migration completion mesti dinilai berasingan.

### 4.3 Akaun dan rekod tidak berkongsi authority secara automatik

Login workspace baharu memanggil API `/api/platform/auth/...` dengan session dan membership daripada server lokal. Hook Supabase auth dan Google/Firebase auth masih ada dalam source legacy, tetapi bukan login utama bagi workspace baharu.

Email sama tidak membuktikan dua akaun itu identiti sama. Akaun Supabase/Google lama tidak automatik mendapat founder/staff membership dalam database lokal.

Dokumen, calendar, tasks dan customer cases baharu ialah rekod platform lokal. Dokumen platform tidak automatik menjadi Google Doc, event lokal tidak automatik muncul dalam Google Calendar, dan balasan in-app tidak automatik dihantar melalui Gmail/WhatsApp.

Tiada import atau dual-write cloud/local dijalankan dalam pelaksanaan ini. Keadaan database cloud sebenar belum diverifikasi melalui explanation ini; jangan menyimpulkan data cloud sudah dipadam atau sudah selamat dipindahkan daripada source yang masih wujud sahaja.

Migration memerlukan mapping identity/ownership, record IDs, SKU/quantity, amaun sen, lifecycle/payment dan evidence; duplicate prevention serta reconciliation mesti diuji sebelum cutover. Legacy status tunggal tidak cukup untuk mereka payment verification atau fulfilment evidence baharu.

### 4.4 Lokal dan AI Studio ialah dua salinan yang berasingan

Perubahan fail di `D:\ABANGCOLEK-OS` mempengaruhi server lokal yang membaca checkout ini. Preview AI Studio menggunakan projek yang diberikan dalam tab AI Studio. Tiada proses upload/import/sync AI Studio dijalankan dalam sesi ini, dan preview tersebut belum berjaya diaudit melalui browser.

Folder lokal, Git branch dan projek AI Studio mempunyai state masing-masing. Commit/push sahaja tidak membuktikan AI Studio telah mengimport versi tersebut; import/sync, environment variables, server runtime dan preview behavior perlu disahkan. Platform baharu memerlukan API Bun/database juga; menyalin frontend sahaja tidak menyediakan backend itu.

**Status tepat:** core platform baharu mempunyai implementation/tests; keseluruhan legacy feature parity, cloud migration dan AI Studio synchronization belum dibuktikan selesai. Penjelasan ini tidak mengubah kod atau melakukan migration.

## 5. Status yang perlu dibezakan

| Item | Status |
|---|---|
| Source platform lokal | Dibina; matriks 17 task dalam implementation ledger |
| Ujian business/JEV semasa | 141 pass, 0 fail, 827 assertions; run 29.22s |
| Suite Chrome semasa | 25 pass, 3.0 min; isolated QA |
| Input bisnes sebenar | Founder/account/produk/stok/SOP/policy mesti disediakan pemilik; tiada auto-seed production |
| Native WhatsApp / Postiz live publish | Belum aktif; web flow/manual export tersedia |
| Native TypeSafe JEV / Hermes / Agent-Reach | Transport/capability boundaries dibina; runtime vendor belum connected |
| Grok Bot / Muse / Dots / DeepSeek Harness | Sumber research/sintesis; tiada connector hidup didakwa |
| Google AI Studio preview | Review belum dapat disahkan kerana akses tab/capture tidak betul |
| Public deployment dan cloud migration | Belum dibuat; domain/HTTPS/capacity/accounts ialah gate berasingan |

Source dan ujian hijau tidak membuktikan semua integrasi luar aktif atau memberi production SLA. Final release evidence masih dikemas kini; keseluruhan objective tidak ditutup melalui dokumen ini.

## 6. Rujukan

- [Implementation ledger dan matriks 17 task](PLATFORM_EXPANSION_IMPLEMENTATION_2026-10-02.md)
- [Recap keseluruhan chat dan sintesis](RECAP_SINTESIS_DAN_PELAKSANAAN_ABANGCOLEK_2026-10-02.md)
- [Runbook startup dan pemulihan](../docs/runbooks/platform-recovery.md)
- [Status review preview AI Studio](REVIEW_GOOGLE_AI_STUDIO_ABANGCOLEK_2026-10-03.md)
