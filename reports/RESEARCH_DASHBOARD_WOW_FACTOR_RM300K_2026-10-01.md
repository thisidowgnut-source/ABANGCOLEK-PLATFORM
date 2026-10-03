# Research Dashboard & Cadangan Wow Factor — ABANGCOLEK-OS

Tarikh research: **1 Oktober 2026 (MYT)**  
Bajet perancangan: **RM300,000** (andaian mata wang berdasarkan konteks projek Malaysia)  
Status: cadangan produk dan perancangan; bukan quotation atau komitmen ROI.

## 1. Keputusan yang disyorkan

Bina **ABANGCOLEK Business Command Centre**: pusat keputusan untuk pemilik, operasi, logistik dan kualiti. Gabungkan konsep visual 1 (tindakan harian) dan 2 (analitik eksekutif) sebagai halaman utama; konsep 3, 4 dan 5 menjadi workspace khusus. Jangan himpunkan lima konsep ke dalam satu skrin.

Wow factor utama ialah satu pengalaman bersambung: sistem menunjukkan perubahan penting, pengguna membuka rekod bukti, menilai cadangan, meluluskan tindakan mengikut peranan, kemudian melihat hasil tindakan. Visual premium mengukuhkan pengalaman ini.

Ini ialah inferens reka bentuk daripada research dan konteks codebase, bukan bukti bahawa pengguna ABANGCOLEK sudah meminta setiap ciri. Ujian dengan pengguna sebenar masih diperlukan.

## 2. Kaedah dan batas research

- Sumber rasmi produk dan dokumentasi disemak pada tarikh di atas; tempoh rujukan merangkumi 2025–September 2026.
- Rujukan lama ditandakan sebagai asas matang, bukan pelancaran baharu 2026.
- Ciri GA, beta dan eksperimen dibezakan apabila sumber menyatakan statusnya.
- Research ini menilai arah produk; bukan audit visual baharu terhadap aplikasi semasa. Pemeriksaan source dilakukan semula pada fail yang dinyatakan di bawah.
- Artikel Power BI September 2026 ditemui melalui indeks carian rasmi, tetapi pembukaan halaman penuh timeout. Hanya maklumat citation/sensitivity labels yang jelas pada petikan rasmi digunakan; status rollout dan eligibility belum disahkan.
- Sumber vendor membuktikan ciri yang mereka umumkan, bukan membuktikan keberkesanan ciri untuk pelanggan ini.
- Skill Product Design dan skill projek JEV `json-render`/`killmyidea` dibaca. Tiada panggilan model JEV dilakukan; tiada skor probabilistik atau benchmark latency dihasilkan.
- Preflight Product Design melalui Python gagal tanpa output; semakan manual tidak menemukan fail saved context. Konteks sesi dan source projek digunakan.

## 3. Perkembangan yang relevan setakat hari research

| Corak | Bukti rasmi dan status | Implikasi untuk ABANGCOLEK |
|---|---|---|
| Jawapan AI dengan provenance | Power BI September 2026: petikan rasmi menyatakan jawapan memetik kandungan Power BI dan memaparkan sensitivity labels. Status availability belum disahkan. [Sumber](https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-september-2026-feature-summary/5325831) | Setiap ringkasan mesti membuka sumber, tempoh dan filter yang digunakan. |
| Analytics proaktif | Tableau April 2026: Inspector dalam Slack ialah beta; semantic model scope/page filters dalam Concierge ialah GA. [Sumber](https://www.tableau.com/en-gb/2026-1-april-features) | Amaran ambang dengan follow-up; mula dengan inbox dalaman, tambah saluran luaran kemudian. |
| AI berasaskan definisi data | Tableau Next MCP dinyatakan GA dalam April 2026. [Sumber](https://www.tableau.com/en-gb/2026-1-april-features) | Definisi revenue, refund dan margin mesti konsisten sebelum chatbot diberi akses. |
| Commerce assistant dalam workflow | Shopify Winter ’26 menerangkan Sidekick menghasilkan workflow Shopify Flow dan custom analytics reports. [Sumber](https://www.shopify.com/editions/winter2026) | Pertanyaan BM/English menghasilkan analisis dan draf tindakan yang berguna kepada operasi. |
| Modular + drill-through + tindakan | Linear Dashboards dilancarkan 24 Julai 2025; modular, boleh difilter, membuka isu asas dan membolehkan assign/triage. Ini asas matang, bukan trend baharu 2026. [Sumber](https://linear.app/changelog/page/5) | Widget patut membawa pengguna ke senarai pesanan/kes sebenar dengan filter sama. |
| Generative UI terkawal | Dokumentasi AI SDK UI menunjukkan hasil tool boleh dirender sebagai komponen UI. [Sumber](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces) | AI memilih komponen daripada katalog yang disahkan; permission dan execution kekal di server. |
| Penilaian keputusan bertipe | TypeSafe menerangkan Choice/Score dengan probability dan confidence; Noul memberi nilai 0–1. [Sumber](https://docs.typesafe.ai/introduction) | JEV sesuai menilai faktor kecil seperti kategori kes, bukti mencukupi dan keperluan semakan manusia. |

**Rumusan research:** arah yang relevan ialah analytics yang boleh dijelaskan dan disambungkan kepada kerja sebenar. Bento grid, dark mode dan animasi merupakan pilihan visual; research ini tidak membuktikan satu gaya visual sebagai paling baharu atau paling berkesan untuk semua dashboard.

## 4. Signature experience: demo client dalam tiga minit

Semua angka demo mesti datang daripada dataset demo berlabel; jangan tampilkan sebagai hasil operasi sebenar.

1. **0:00–0:30 — Morning Brief.** Pemilik melihat ringkasan jualan, pesanan belum selesai dan satu perubahan penting. Setiap angka mempunyai tempoh dan masa kemas kini.
2. **0:30–1:00 — Klik perubahan.** Ringkasan membuka senarai pesanan/kes yang menyumbang kepada perubahan, bersama filter yang digunakan. Jika bukti hanya menunjukkan korelasi, jangan nyatakan punca sudah terbukti.
3. **1:00–1:30 — Tanya dalam BM.** “Tunjukkan aduan botol bocor minggu ini mengikut batch.” Sistem memaparkan carta dan jadual daripada query sah, bersama sumber.
4. **1:30–2:15 — Semak kes JEV.** Drawer menunjukkan bukti tersedia, bukti hilang, klasifikasi, punca belum ditentukan dan draf tindakan. Pengguna boleh ubah cadangan sebelum submit.
5. **2:15–3:00 — Assign dan jejak.** Tindakan disahkan server, muncul dalam tugasan pegawai, dan masuk audit timeline. Keputusan sebenar dikemas kini apabila kes selesai.

Client patut dapat membuka satu angka dan sampai kepada rekod asasnya. Itulah momen kepercayaan yang menjadikan demo bernilai.

## 5. Susunan halaman utama

### Desktop

- Sidebar sekitar 224px dengan navigation berkelompok, boleh collapse.
- Header: konteks organisasi, tarikh, lokasi/channel, global search dan notification inbox.
- Morning Brief: satu ringkasan pendek dengan maksimum tiga perubahan penting dan pautan bukti.
- Empat KPI: jualan bersih, margin sumbangan apabila kos lengkap, pesanan perlu perhatian, kadar aduan. Definisi KPI boleh dibuka.
- Ruang utama: trend perniagaan kira-kira dua pertiga lebar; queue “Perlu Tindakan” di sebelahnya.
- Baris bawah: prestasi channel dan fulfillment. Map muncul apabila konteks penghantaran relevan.
- Detail drawer: bukti, rekod berkaitan, cadangan, owner dan sejarah tindakan tanpa kehilangan filter halaman.
- Copilot contextual dibuka atas permintaan; pertanyaan terikat kepada tarikh, lokasi dan permission aktif.

### Mobile

- Susunan brief → tindakan penting → KPI → detail operasi.
- Bottom navigation: Utama, Pesanan, Kes, Lagi; semua modul boleh dicapai melalui Lagi/search.
- Chart ringkas, jadual adaptif, tindakan utama mudah dicapai; tiada miniatur dashboard desktop.

## 6. Information architecture seluruh fungsi

| Workspace | Fungsi utama | Peranan lazim |
|---|---|---|
| Utama | Brief, KPI, queue, saved views | Pemilik/manager |
| Operasi | Pesanan, pembayaran status, stok, fulfillment | Operasi |
| Logistik | Penghantaran, kargo bas, lokasi, serahan | Logistik |
| Kualiti & JEV | Aduan, bukti, batch, review, keputusan | QA/support |
| Analitik | Revenue, margin, channel, cohort jika data cukup, laporan | Pemilik/analyst |
| Pasukan | Tugasan, owner, SLA, serahan syif | Manager/staff |
| Workspace | Dokumen, calendar, sheets, meet, email drafts | Mengikut akses |
| Pentadbiran | Integrasi, akses, audit log, konfigurasi AI | Admin |

Agent performance berada dalam Pentadbiran/Analitik AI. Ia tidak patut mendahului prestasi perniagaan pada halaman pemilik.

## 7. Art direction premium

- Kekalkan identiti kuning cili, merah sambal dan charcoal; gunakan cream sebagai surface light.
- Kuning untuk tindakan utama, merah untuk keadaan kritikal; elakkan penggunaan warna brand bagi semua status data.
- Typography konsisten dengan angka tabular; aset brand dan font mesti mempunyai hak penggunaan yang sesuai.
- Chart ringkas: line untuk masa, bar untuk perbandingan, heatmap untuk pola masa/channel. Sankey hanya apabila aliran benar-benar perlu dijelaskan.
- Light mode untuk kerja analitik panjang, dark mode untuk monitor operasi; kedua-duanya diuji.
- Motion pendek dan berfungsi: drawer, filter, perubahan status; support reduced motion. Elakkan animasi berterusan yang mengganggu pembacaan.
- Personalization terhad: saved view, susunan widget, hide/show dan density. Layout default kekal mudah dijangka.
- Status data: Live apabila disahkan, terakhir disegerak, cache, demo, unavailable. Jangan ganti kegagalan dengan angka contoh yang kelihatan sebenar.
- Accessibility: keyboard, fokus jelas, nama control, kontras dan alternatif jadual untuk chart. [Rujukan W3C](https://www.w3.org/WAI/WCAG22/quickref/)

## 8. JEV dan generative UI

### Peranan yang dicadangkan

JEV menilai soalan kecil berdasarkan state kes yang diketahui: kelas isu, bukti mencukupi, urgency dan keperluan human review. Gabungkan faktor melalui polisi kod yang boleh diaudit. Jangan jadikan satu score AI sebagai satu-satunya syarat refund atau keputusan kewangan.

Katalog UI yang disahkan: MetricCard, TrendChart, OrdersTable, EvidencePanel, CaseReviewCard dan ActionDraft. Payload bertipe menentukan komponen/data yang sah; model tidak menghantar arbitrary executable UI atau memilih permission.

Aliran: query sah → data scope → penilaian → polisi → cadangan UI → semakan manusia apabila diperlukan → execution server → audit event → hasil.

### Kontrak data minimum

- Rekod: ID, source, timestamp, tenant/scope, currency, timezone dan status completeness.
- Metric: definisi/formula, period, filters, source records, freshness dan missing-data status.
- Decision: evaluator sebenar, version, input references, result, uncertainty jika tersedia, policy version dan review status.
- Action: actor, permission, idempotency key, approval apabila perlu, execution receipt dan error status.

### Gap semasa yang disahkan daripada source

- `src/App.tsx:1134` mengandungi DashboardsView; AgentInsightCard dirender pada `src/App.tsx:1160`.
- `src/services/gemini.ts:199` mengandungi MOCK_DB; dashboard dicipta dengan push ke array pada baris 1132 dan 1872.
- `src/components/AgentInsightCard.tsx:51` memulakan realtimeConnected sebagai true.
- `src/services/jevEngine.ts` menggunakan generateContent dan mengandungi confidence fallback tinggi. Ia tidak membuktikan integrasi rasmi TypeSafe atau calibration.

Prioriti ialah repository data persisten, sumber metric yang konsisten, status sync sebenar dan evaluator metadata sebelum melabel UI sebagai intelligent/live.

## 9. Organisasi komponen dan fungsi

Cadangan sempadan modul, disesuaikan dengan struktur sedia ada semasa implementation:

```text
src/
  app/                 shell, routes, routeRegistry, providers
  design-system/       tokens, primitives, charts, table, drawer, states
  features/
    dashboard/         page, widgets, selectors, savedViews
    orders/            pages, queries, actions
    logistics/         shipments, freight, handover
    quality/           cases, evidence, review
    analytics/         metrics, definitions, reports
    team/              tasks, shiftHandover
    workspace/         docs, calendar, drafts
    administration/    access, integrations, audit
  agent/               toolRegistry, schemas, policy, executors
  data/                repositories, query keys, source adapters
```

Satu routeRegistry memberi data kepada sidebar, mobile menu dan command palette. UI tidak mengimport MOCK_DB daripada gemini.ts. Tool executor tidak menulis terus ke state UI; ia melalui domain service dan repository. Refactor secara bertahap supaya navigation dan integrasi sedia ada boleh diuji setiap fasa.

## 10. Cadangan pecahan RM300,000

Ini anggaran alokasi perancangan, bukan kadar vendor yang disahkan. Andaian: web responsive dengan peranan HQ/operasi/QA, maksimum tiga integrasi utama yang mempunyai API/access, migrasi data sederhana, tiada native app atau perkakasan baharu. Tempoh indikatif 18–22 minggu bergantung akses data dan pasukan.

| Workstream | Bajet | Deliverable |
|---|---:|---|
| Discovery & product definition | RM20,000 | Interview, KPI dictionary, flow, data/integration feasibility |
| UX/UI & design system | RM40,000 | Prototype diuji, tokens, component states, responsive/themes |
| Frontend dashboard/workspaces | RM60,000 | Overview, drill-through, filters, queue, detail drawer |
| Backend/data/integrations | RM65,000 | Persistence, normalization, permissions, sync, audit |
| AI/JEV & decision workflow | RM30,000 | Grounded queries, constrained UI, evaluation, review workflow |
| QA/security/performance/UAT | RM25,000 | Critical flows, data reconciliation, access tests, browser verification |
| Delivery/training/documentation | RM15,000 | Deployment, guides, onboarding, 30-day stabilization |
| Contingency | RM30,000 | API constraints, migration/data gaps, scope adjustments |
| Pilot infrastructure/AI allowance | RM15,000 | Capped project-period service costs |
| **Jumlah** | **RM300,000** | |

Confirm sebelum commercial sign-off: SST/tax treatment, recurring licenses/cloud selepas pilot, ownership hosting/accounts, support SLA, data volume, API restrictions dan scope connector. Allocation perlu diubah jika item tersebut mesti termasuk dalam had RM300k.

## 11. Delivery gates

| Fasa | Tempoh indikatif | Gate |
|---|---|---|
| Discovery | Minggu 1–2 | KPI, role, source, tiga connector dan demo scenario disahkan |
| Design prototype | Minggu 3–5 | Pengguna boleh mengenal masalah dan membuka rekod tanpa bantuan |
| Data foundation | Minggu 4–9 | Data reconcilable, tenant access diuji, sync/error states benar |
| Core workspaces | Minggu 7–13 | Overview → detail → assign → outcome bekerja end-to-end |
| Intelligence | Minggu 12–16 | Query grounded, uncertainty dan failure paths diuji |
| UAT & stabilization | Minggu 17–22 | Acceptance criteria dipenuhi, latihan dan handover selesai |

Parallel schedule ini ialah rancangan delivery, bukan arahan memulakan implementation sekarang.

## 12. Kriteria penerimaan dan ukuran nilai

- Setiap KPI mempunyai formula, period, filters, source dan timestamp; aggregate konsisten dengan drill-through.
- Dataset demo dibezakan jelas daripada live; sync failure dan unavailable terlihat kepada pengguna.
- Akses data dan tindakan diuji mengikut role/tenant, termasuk permintaan terus kepada API.
- Tiada duplicate action akibat retry; audit event dan receipt tersedia bagi tindakan berjaya/gagal.
- JEV diuji menggunakan set kes berlabel sebenar yang disanitasi; calibration dan abstention diukur sebelum threshold ditetapkan.
- Sasaran UX pilot: sekurang-kurangnya 80% peserta menyelesaikan tiga tugas utama tanpa fasilitator; sampel dan tugas ditentukan semasa discovery.
- Sasaran performance selepas scope/load disahkan: LCP p75 ≤2.5s, INP p75 ≤200ms, CLS ≤0.1; query lazim p95 ≤2s pada dataset dan environment yang dipersetujui. Ini sasaran, bukan bacaan semasa.
- Critical flow diuji desktop dan mobile; keyboard/reduced-motion/error/empty states diperiksa.
- Ukur baseline dan perubahan: masa triage aduan, masa menyediakan laporan, pesanan terlepas SLA dan adoption mingguan. ROI tidak dijanjikan sebelum baseline tersedia.

## 13. Idea yang wajar ditangguhkan

- Peta 3D seluruh Malaysia sebagai hero default: kos/rendering tinggi; map 2D kontekstual lebih mudah digunakan.
- AI yang mereka semula layout setiap sesi: mengganggu muscle memory; gunakan katalog dan saved views.
- Refund/komunikasi luaran autonomi sebelum polisi, permission dan audit mantap.
- Ramalan margin atau demand apabila kos/refund/history tidak lengkap; gunakan scenario dengan andaian jelas dahulu.
- Semua connector marketplace sekali gus: mulakan tiga paling bernilai berdasarkan transaksi sebenar dan akses API.

## 14. Langkah seterusnya

Hasilkan satu prototype terperinci Business Command Centre dengan tiga state: normal, perlu tindakan dan data tidak tersedia. Uji aliran demo serta tugasan harian dengan pemilik, operasi dan QA. Kunci definisi KPI, connector dan acceptance criteria sebelum pembangunan penuh.

Dokumen ini menyampaikan cadangan; source aplikasi belum diubah sebagai sebahagian research ini.
