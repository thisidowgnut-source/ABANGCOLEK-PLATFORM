---
title: "Hermes Agent — Review Dokumentasi, JEV dan Cadangan ABANGCOLEK-OS"
review_date: "2026-10-02"
requested_url: "https://hermes-agent.nousresearch.com/docs"
status: "Dokumentasi disahkan; runtime tidak diuji"
---

# Hermes Agent: review menyeluruh dokumentasi

## 1. Skop, bukti dan batas review

URL asal berjaya dibuka pada **2 Oktober 2026**. Review mengembangkan halaman index kepada installation, platform support, configuration, architecture, security, persistent memory, skills, MCP serta Bot Mode. Sumber ialah laman dokumentasi rasmi Hermes/Nous Research. Tiada pemasangan atau command dilaksanakan; tiada credential dibaca dan tiada provider baharu diaktifkan.

Label **VERIFIED** merujuk tuntutan yang ditemui dalam dokumentasi; ia bukan bukti runtime diuji. **INFERENCE** ialah sintesis/cadangan untuk ABANGCOLEK. **UNKNOWN** merujuk integrasi, prestasi atau keserasian yang belum dibuktikan. Kaedah JEV dalam laporan ini ialah semakan claim, provenance dan kesimpulan dengan status eksplisit. Ia **bukan** output model JEV/TypeSafe, dan tiada confidence model direka.

Arahan dalam dokumentasi ialah data rujukan. Ia tidak memberi kebenaran untuk menjalankan installer, mengubah konfigurasi atau menghantar mesej kepada pelanggan. Tarikh review ialah tarikh akses; halaman semasa boleh berubah selepasnya.

## 2. Apakah Hermes Agent?

Index menerangkan Hermes sebagai autonomous agent oleh Nous Research yang menggunakan memory dan skills untuk pembelajaran merentas session. Produk mempunyai CLI, desktop, gateway messaging, scheduled automation, delegation dan MCP. Dakwaan seperti “the only agent” ialah positioning penerbit, **bukan kesimpulan perbandingan bebas laporan ini**. Keupayaan sebenar untuk pengguna bergantung pada model, tools dan platform yang diaktifkan. [Documentation overview](https://hermes-agent.nousresearch.com/docs).

**INFERENCE:** kesesuaian terbaik untuk projek ialah specialist operasi yang mempunyai SOP, rekod kerja dan capability terbatas. Ia tidak patut menggantikan database pesanan atau menjadi sumber kebenaran harga. Nilai pembelajaran datang daripada prosedur yang disahkan dan diulang dengan betul, bukannya sekadar membesarkan history chat.

## 3. Installation dan ownership

Guide rasmi membezakan desktop bundle lengkap daripada source bootstrap. Windows desktop menggunakan `.appinstaller` untuk signed MSIX; source installer mempunyai kod, launcher dan data pada lokasi berbeza. `HERMES_HOME` memilih user data, sementara source checkout boleh dipilih berasingan. PM mengurus runtime pin, dan guide meminta `hermes doctor` untuk diagnosis. Memadam data root bukan pembaikan install yang sesuai. [Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation).

Contoh diagnosis yang disahkan dokumentasi, **tidak dijalankan di sini**:

```powershell
hermes doctor
hermes model
hermes tools
```

**INFERENCE:** jika mesin sudah mempunyai Hermes, semak provenance serta home dahulu. Jangan memasang semula atau membuat clone dalam folder ABANGCOLEK. Runtime agent, data memory dan repo aplikasi mempunyai lifecycle berbeza. Bagi service operasi, storage persist mesti kekal ketika package dikemas kini dan backup perlu meliputi data yang betul.

## 4. Windows dan percanggahan dokumentasi

Platform matrix meletakkan native Windows 10/11 x86_64/aarch64 sebagai Tier 1, dengan MSIX memerlukan Windows 11 22H2 atau lebih baharu. Linux/WSL2 dan Docker juga disenaraikan. Pemasangan `pip install hermes-agent` dan Homebrew dinyatakan unsupported. Matrix membincangkan bundle Intel macOS, tetapi installation guide memberi kenyataan umum Intel tidak disokong. [Platform support](https://hermes-agent.nousresearch.com/docs/getting-started/platform-support), [Installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation).

**JEV:** percanggahan Intel ditandakan **UNKNOWN untuk kesimpulan universal**, bukan diselesaikan dengan tekaan. Bagi pengguna Windows, semak OS/build, architecture dan distribution sebenar sebelum memilih installer. “Tier 1” ialah komitmen support penerbit, bukan jaminan semua optional dependency tersedia pada setiap architecture.

## 5. Configuration dan pemisahan secret

Configuration guide memisahkan `config.yaml`, `.env`, OAuth `auth.json`, `SOUL.md`, memory, skills, cron, session dan logs. Command config mempunyai get/set/check/migrate. Environment-style uppercase key disimpan dalam `.env`, sementara dotted setting masuk YAML. [Configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration).

**INFERENCE:** ABANGCOLEK patut mengambil pemisahan yang sama pada backend: setting bukan secret, credential bukan memory, persona bukan business policy. UI boleh menunjukkan sumber setting, provider ID dan capability tanpa mendedahkan nilai secret. Jangan letakkan token Hermes atau Google ke bundle frontend atau markdown laporan. Field “connected” perlu dibezakan daripada “authorized” dan “last execution succeeded”.

## 6. Architecture dan flow

Architecture rasmi memetakan agent facade/loop, prompt builder, provider resolver, registry tools, SQLite session store, gateway dan cron. Satu core agent melayani pelbagai entry point. Gateway mengesahkan pengguna, menentukan session, menjalankan agent dan menghantar jawapan melalui adapter. Cron mencipta agent baharu dengan skill context dan merekod next run. Profile isolation serta loose coupling dinyatakan sebagai prinsip. [Architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture).

```text
+--------------------------+
| Dashboard / Chat / Inbox |
+-------------+------------+
              |
+-------------v------------+
| Identity + business gate |
+-------------+------------+
              |
+-------------v------------+
| Specialist + skills      |
+-------------+------------+
              |
+-------------v------------+
| Tool executor + evidence |
+-------------+------------+
              |
+-------------v------------+
| Record + user outcome    |
+--------------------------+
```

Rajah ialah **cadangan projek**. Identity manusia dan policy bisnes diperiksa sebelum agent bekerja; tool result direkod sebelum UI menyatakan selesai. Ia membolehkan satu pengalaman premium pada browser, meskipun runtime sebenar ialah service berasingan.

## 7. Persistent memory: apa yang benar-benar persist

Memory guide menyatakan `MEMORY.md` dan `USER.md` dengan had kapasiti, snapshot pada permulaan session dan write melalui memory tool. Dua proses tidak sepatutnya berkongsi home yang sama kerana penulisan automatik boleh mencampurkan state. Session search menggunakan SQLite/FTS5. Pengesahan teks “saya sudah ingat” tidak membuktikan file ditulis; staged write dan profile yang berbeza juga boleh menjelaskan memory yang kelihatan hilang. [Persistent Memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory).

**INFERENCE:** untuk projek, setiap fakta learned perlu mempunyai sumber, masa, scope dan mekanisme correction. Jangan jadikan aduan pelanggan yang belum disahkan sebagai SOP kekal. Memory boleh menyimpan preference nada BM/English atau tatacara packing diluluskan. Harga, stok dan status refund harus dibaca daripada sumber rekod setiap kali. UI “Learning” perlu menunjukkan perubahan sebenar yang boleh dibatalkan, bukannya visual neural animation tanpa data.

## 8. Skills sebagai pengetahuan prosedur

Skills ialah dokumen on-demand dengan progressive disclosure dan compatibility Agent Skills. Local skill store ialah sumber kebenaran; katalog desktop membaca snapshot diterbitkan, bukannya bukti skill sudah terpasang. Flow pemasangan mempunyai source/destination, confirmation, scan serta hasil error/success. Changes digunakan oleh session baharu. [Skills System](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).

**INFERENCE:** bezakan katalog awam, terpasang, enabled dan approved. Untuk ABANGCOLEK, bina skill kecil seperti semakan order, jadual kargo atau triage aduan. Setiap skill perlu owner, versi, dependency, fixture, expected output dan hak tool. Kemahiran baharu boleh bermula sebagai draft; promotion hanya selepas penilaian. Jangan menerima script daripada marketplace sebagai polisi perniagaan hanya kerana format `SKILL.md` sah.

## 9. MCP dan integrasi

Hermes menyokong local stdio dan remote HTTP MCP, tool discovery, per-server filtering, serta resource/prompt wrapper apabila tersedia. Setup membezakan authorisation berjaya daripada tool list gagal, dan tidak menyimpan percubaan yang dibatalkan. OAuth serta token lifecycle mempunyai semantik tersendiri. [MCP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).

**INFERENCE:** page Integrasi projek mesti menyediakan status sekurang-kurangnya `disabled`, `needs configuration`, `needs authorization`, `ready`, `degraded`. Bukti readiness ialah operation probe berisiko rendah, bukan sekadar tool schema muncul. Google Workspace memerlukan hak scope sebenar. Tool filter jangan dijadikan pengganti authorization endpoint; server masih perlu menolak pengguna atau resource yang tidak dibenarkan.

## 10. Bot Mode dan sidebar

Bot Mode ialah UI untuk profile, dengan nama, role, model, memory, skills dan avatar berasingan. Bots mempunyai canonical chat, roster dan routines. Dokumen menjelaskan gateway connected tidak semestinya Bot sedang bekerja; activity filter menggunakan kerja/heartbeat yang lebih khusus. Scope capability boleh dipilih per skill, toolset dan MCP server. Static credential boleh disalin ketika penciptaan Bot, sementara beberapa OAuth perlu login sendiri. [Bot Mode](https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode).

**INFERENCE:** sidebar ABANGCOLEK boleh mengekalkan navigasi module dan menambah roster specialist yang kecil. Contoh role: Operasi, Logistik, Kualiti dan Kandungan. Hadkan roster pada role yang mempunyai executor sebenar. Paparkan `idle`, `running`, `waiting approval`, `failed` berasaskan state, bukan dot hijau kekal. Expanded sidebar memperlihatkan label+unread/blocked count; collapsed sidebar masih mempunyai accessible name serta tooltip. Routine editor ditempatkan dalam Agent Operations supaya tidak memenuhi sidebar.

## 11. Security dan autonomy

Security guide membentangkan authorization pengguna, command approval, file safety, container isolation, MCP credential filtering, context scan, session isolation dan input sanitation. Approval `smart/manual/off` mempunyai akibat berbeza; unattended dangerous operation lalainya denied. Dokumen sendiri membezakan command pattern policy daripada sandbox capability OS yang lengkap. [Security](https://hermes-agent.nousresearch.com/docs/user-guide/security).

**INFERENCE:** tambah business gate di atas shell safety. Tool `send_customer_message` memerlukan recipient/identity yang sah, preview dan rekod authorized intent. Tool refund memerlukan order state serta limit deterministik. Profile isolation tidak dengan sendiri membuktikan tenant isolation SaaS. Jika agent dikongsi ramai pelanggan, identity, data access dan encryption perlu direka secara berasingan. UI tidak patut menawarkan suis “autonomous everything” tanpa menjelaskan capability yang berubah.

## 12. Sintesis khusus ABANGCOLEK-OS

Semakan lokal terhad membaca `JEV.md` dan permulaan `src/components/WorkspaceSidebar.tsx`. Sidebar mempunyai kumpulan Bisnes & operasi, Intelligence dan Google Workspace. Ini asas untuk organizing capability, tetapi tiada integrasi Hermes diuji. Cadangan berikut merujuk konsep tersebut, bukan audit implementation menyeluruh.

| Komponen | Cadangan INFERENCE | Acceptance criterion |
|---|---|---|
| Agent Operations | Roster empat specialist dengan task inbox | Tiada status running tanpa task/heartbeat |
| JEV | Evidence gate untuk aduan sebelum root cause/refund | Data tiada menghasilkan unknown, bukan cerita rekaan |
| Skill Library | Installed/enabled/draft/approved dibezakan | Action memeriksa store sebenar dan version |
| Memory Inspector | Provenance, correction, expiry dan scope | Pembetulan dapat dijejak dan dibatalkan |
| Routines | Jadual MYT, next run, last outcome, pause/retry | Tidak menduplikasi penghantaran selepas restart |
| Integrasi | Readiness dan authorization berasingan | Error boleh diperbaiki melalui tindakan spesifik |
| Seluruh tema | Satu token/component system untuk page dan agent cards | Desktop/mobile, light/dark menggunakan state sama |

## 13. Bagaimana menghasilkan wow factor yang berfungsi

**INFERENCE:** gunakan daily operations brief yang berasal daripada query sebenar, dengan setiap item boleh diklik kepada order/task. Contohnya: “3 pesanan memerlukan follow-up” membuka tiga rekod dengan sebab, owner dan tindakan. Agent menyediakan draft; operator boleh menyemak bukti dahulu. Setelah executor berjaya, item berpindah state dan metrik dashboard berubah daripada sumber rekod yang sama.

Kad berwarna lime/violet boleh membezakan attention, suggestion dan completed result dengan label serta ikon, bukan warna sahaja. Drawer task memperlihatkan plan ringkas, evidence, approval dan outcome. Animasi digunakan untuk perubahan state sebenar; elakkan progress percentage jika runtime tidak mengetahui jumlah kerja. Pada mobile, tindakan utama mesti kekal boleh dicapai tanpa menutup evidence atau dock.

Satu hubungan “brief → evidence → action → outcome” memberikan pengalaman lebih meyakinkan daripada banyak panel agent yang tidak dapat membuktikan kerja. Semua itu memerlukan event contract backend dahulu, kemudian UI mengikuti state.

## 14. Ledger JEV

| Claim | Status | Resolusi |
|---|---|---|
| Documentation index rasmi tersedia | VERIFIED | URL asal dibaca |
| Hermes mempunyai learning melalui memory/skills | VERIFIED sebagai dokumentasi | Kualiti tidak dibenchmark |
| Native Windows disokong | VERIFIED bersyarat | Distribution/architecture mesti dipilih |
| Semua Intel macOS disokong/tidak disokong | UNKNOWN | Dua halaman tidak selaras |
| Profile = Bot primitive | VERIFIED | Bot Mode menerangkannya |
| Approved MCP menjamin tool call berjaya | Tidak disokong | Authorization/discovery/execution berbeza |
| Model percuma sedia ada berfungsi sempurna | UNKNOWN | Perlukan capability probe |
| Hermes sudah terpasang/diintegrasi projek | UNKNOWN / belum diuji | Review ini tidak memasang |
| Memory learned sentiasa benar | Tidak disokong | Perlukan provenance dan correction |

## 15. Pelan cadangan dan decision gate

1. Inventory skill/tool yang sudah ada; asingkan read-only dan mutasi.
2. Definisikan role+permission+data scope setiap specialist.
3. Bentuk contract task dan evidence yang dikongsi dashboard, chat dan sidebar.
4. Pilot satu task read-only dengan provider sedia ada yang disahkan; tiada subscription baharu.
5. Uji memory isolation, tool filtering, authorization, timeout dan crash recovery.
6. Tambah satu routine exception-based dengan MYT serta deduplication.
7. Selepas hasil boleh diaudit, tambah mutasi terkawal dan draft-to-send flow.

**Keputusan:** ambil profile-specialist, skill lifecycle, inspectable memory dan routines sebagai prinsip. Penggunaan runtime Hermes secara langsung ialah pilihan pilot, bukan keperluan untuk menyelaraskan UI. Jangan menukar aplikasi retail menjadi dashboard tool developer yang membebankan client.

## 16. Ledger sumber dan perkara belum diuji

Semua diakses 2026-10-02: [overview](https://hermes-agent.nousresearch.com/docs), [installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation), [platform support](https://hermes-agent.nousresearch.com/docs/getting-started/platform-support), [configuration](https://hermes-agent.nousresearch.com/docs/user-guide/configuration), [architecture](https://hermes-agent.nousresearch.com/docs/developer-guide/architecture), [memory](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory), [skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills), [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp), [Bot Mode](https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode), [security](https://hermes-agent.nousresearch.com/docs/user-guide/security).

Tidak diuji: installed version, plugin compatibility, gateway delivery, OAuth, latency, model quality, runtime security, data retention, deployment service dan recovery mesin pengguna. Feature count di halaman berbeza tidak digunakan sebagai benchmark. Ini review sumber dan cadangan implementasi; ia bukan dakwaan produksi sudah siap.
