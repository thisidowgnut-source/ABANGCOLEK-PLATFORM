---
title: "DeepSeek Harness — Review Dokumentasi, JEV dan Cadangan ABANGCOLEK-OS"
review_date: "2026-10-02"
requested_url: "https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart"
status: "Dokumentasi disahkan; runtime tidak diuji"
---

# DeepSeek Harness: review menyeluruh dokumentasi

## 1. Skop dan cara membaca laporan

URL yang diminta berjaya dibuka pada **2 Oktober 2026**. Tajuk semasanya ialah **Use the Web UI**, walaupun laluan masih bernama `quickstart`. Laporan ini membaca halaman itu bersama README, seni bina, keselamatan, konfigurasi model, SDK Python, pembangunan plugin, webhook GitHub, reminder dan memory MCP. Semua sumber produk ialah dokumentasi penerbit atau repositori rasmi yang dipautkan olehnya.

**VERIFIED** bermaksud tuntutan ditemui pada sumber yang dibaca. **INFERENCE** bermaksud cadangan reka bentuk hasil analisis, bukan ciri yang sudah ada dalam projek. **UNKNOWN** bermaksud perkara belum disahkan melalui ujian. JEV di sini ialah ledger semakan tuntutan berasaskan bukti; tiada panggilan kepada model JEV/TypeSafe dibuat. Skor confidence numerik tidak direka.

Dokumentasi web boleh berubah. Ini snapshot analisis bertarikh, bukan jaminan bahawa runtime pengguna sama dengan versi dokumentasi. Tiada pemasangan, clone, perubahan model, pembelian atau pelaksanaan command dibuat untuk laporan ini.

## 2. Identiti produk dan tahap kematangan

**VERIFIED:** DeepSeek Harness, dengan command `dsh`, ialah agent harness sumber terbuka daripada DeepSeek AI. README menjelaskan seni bina everything-is-a-plugin berasaskan Cordis dan lesen MIT. Ia berada dalam **developer preview** dengan potensi perubahan yang memecahkan compatibility. Arahan npm rasmi berikut memulakan UI pada loopback port 3080 secara lalai. [README rasmi](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md).

```powershell
# Contoh dokumentasi; tidak dijalankan dalam review ini.
npx @deepseek-ai/dsh web
```

**INFERENCE:** Nilai utama untuk ABANGCOLEK ialah pemisahan capability, lifecycle dan policy. Membina semula aplikasi retail di atas framework preview bukan langkah pertama yang munasabah. Ambil prinsip modular dan sediakan adapter supaya runtime boleh ditukar tanpa memindahkan keseluruhan UI.

## 3. Aliran quickstart sebenar

Halaman quickstart bermula **selepas server dihidupkan**. Direktori ketika `dsh` dipanggil menjadi lokasi filesystem lalai, tetapi UI baharu belum mempunyai workspace terpilih. Pengguna perlu memilih workspace; composer kekal tidak tersedia sehingga langkah itu selesai. Settings → Models menyediakan konfigurasi model, kemudian pengguna memulakan session. Agent boleh membaca, mengedit, menjalankan command, mendelegasi dan menyelenggara plan, tertakluk policy approval aktif. [Use the Web UI](https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart).

**INFERENCE untuk UX projek:** status konfigurasi perlu dilihat sebelum input AI tersedia. Paparkan secara berasingan `Server tersedia`, `Workspace dipilih`, `Provider disahkan` dan `Capability dibenarkan`. Satu lampu hijau “AI online” tidak cukup: server yang menjawab HTTP belum membuktikan model atau tool berfungsi. Sediakan tindakan pembaikan tepat pada status yang gagal.

## 4. Model, provider dan credential

DSH menyediakan provider katalog dan custom API. Custom route memilih satu daripada OpenAI Chat Completions, OpenAI Responses atau Anthropic Messages; dua protokol memerlukan dua provider. Credential yang disimpan melalui UI adalah write-only, dibalas sebagai descriptor redacted, dengan secret dalam `$DSH_HOME/.credentials.yaml`. Perubahan model berkuat kuasa pada request seterusnya. UI ini belum menyokong provider OAuth seperti Codex. Discovery model ialah kemudahan, bukan bukti semua endpoint pasti compatible. [Configure models](https://deepseek-harness.github.io/deepseek-harness/en/guide/providers).

**INFERENCE:** bina registry provider milik projek pada server. Model, protokol, capability, hasil probe dan masa probe perlu disimpan berasingan. Kekalkan keutamaan model sedia ada yang pengguna benarkan; jangan menambah subscription kerana harness menyokong sesuatu provider. Semak tool calling, streaming dan input imej dengan fixture sebenar sebelum melabel provider `Ready`. Keserasian URL `/v1` sahaja bukan acceptance criterion.

## 5. Seni bina dan lifecycle

Cordis menggunakan shared context dengan service, typed event dan reversible effect. Model adapter, tool registry, session log serta agent loop sendiri ialah plugin. Profiles menyusun bundles bersama patch pada beberapa lapisan; row config yang diganti menggantikan keseluruhan config row. Profile seperti `web`, `headless`, `sdk`, `sdk-minimal` dan `acp` mempunyai komposisi berlainan. `sdk-minimal` tidak mewarisi `dsh-base`. [Architecture](https://deepseek-harness.github.io/deepseek-harness/en/reference/).

```text
+-------------------------+
| Dashboard / Chat        |
+------------+------------+
             |
+------------v------------+
| Capability adapter      |
+------------+------------+
             |
+------------v------------+
| Policy + JEV validation |
+------------+------------+
             |
+------------v------------+
| Runtime / provider      |
+------------+------------+
             |
+------------v------------+
| Event + evidence store  |
+-------------------------+
```

Rajah di atas ialah **cadangan ABANGCOLEK**, bukan salinan rajah DSH. Boundary memberi peluang UI menggunakan keadaan task yang sama walaupun executor berubah. Adapter mesti membungkus timeout, cancellation dan result schema; React tidak sepatutnya bergantung pada struktur dalaman Cordis.

## 6. Plugin dan kebersihan resource

Tutorial rasmi menunjukkan plugin TypeScript dengan fungsi `apply(ctx)`. Registration melalui context dibersihkan ketika unload; resource yang memerlukan cleanup khusus menggunakan disposer melalui `ctx.effect()`. Tutorial meminta laluan plugin absolute apabila dimasukkan melalui overlay. [Your first plugin](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/).

**INFERENCE:** setiap capability ABANGCOLEK patut mempunyai manifest yang menerangkan input/output, policy, dependency dan lifecycle. Unmount view tidak boleh meninggalkan listener atau timer yang terus menduplikasi event. Nyahaktif integrasi melalui UI perlu memutuskan resource secara jelas dan mengekalkan audit history. Jangan memanggil arbitrary module path daripada data pengguna. UI boleh menyediakan katalog plugin, tetapi pemasangan kod ialah operasi server dengan sumber dan versi yang dikenal pasti.

## 7. SDK Python dan perbezaan profile

SDK rasmi menyokong Windows x64 bersama platform lain dan Python 3.10+. Installed SDK membawa native runtime; operasi normal SDK tidak memerlukan system Node. Tutorial menggunakan workspace serta Harness home eksplisit. **`sdk-minimal` mempunyai akses shell `danger-full-access`, tiada compaction dan banyak capability asas tidak dimuatkan.** Dokumen turut menyatakan contributor session log menghantar event belum diterima bersama request DeepSeek secara lalai; ia boleh dinyahaktif melalui konfigurasi. [Python SDK](https://deepseek-harness.github.io/deepseek-harness/en/guide/python-sdk).

**INFERENCE:** “minimal” mesti diterangkan sebagai komposisi kecil, bukannya mod selamat. Untuk proof of concept projek, asingkan home dan workspace, guna data sintetik, dan tentukan policy penghantaran log dahulu. Jangan beri runtime ini folder sebenar pelanggan atau credential produksi hanya kerana SDK mudah dipanggil. Runtime berasingan boleh berbual dengan aplikasi melalui contract; ia tidak perlu dibundel ke browser Vite.

## 8. Webhook dan semantik acknowledgement

Guide GitHub memberi contoh endpoint signed pada listener berasingan, sementara UI utama kekal pada port 3080. Rule mengehadkan repository, event dan action, kemudian menghasilkan session read-only. HTTP **202 hanya membuktikan signature/JSON diterima dan rule dijadualkan dalam memori**, bukan session berjaya dicipta. Penghantaran berulang boleh menghasilkan session tambahan; pending rule boleh hilang akibat crash. Secret inbound tidak memberi kuasa outbound GitHub. [GitHub review sessions](https://deepseek-harness.github.io/deepseek-harness/en/guide/github-review).

**INFERENCE:** prinsip ini sangat sesuai untuk pesanan retail. Pisahkan `received`, `validated`, `queued`, `running`, `succeeded` dan `failed`. Gunakan idempotency key serta event ID supaya webhook ulang tidak menghantar mesej dua kali atau mengubah fulfillment dua kali. Badge UI hendaklah datang daripada execution record, bukan respons HTTP penerimaan.

## 9. Reminder dan pengalaman operasi proaktif

Schedule bukan sebahagian profile Web yang dihantar secara lalai; bundle Automation tasks perlu diaktifkan. Guide membezakan one-shot, interval, local-time daily/weekly serta cron dengan IANA time zone. Automation page boleh melihat enabled/inactive dan mengedit reminder aktif. [Schedule reminders](https://deepseek-harness.github.io/deepseek-harness/en/guide/schedule).

**INFERENCE:** rutin ABANGCOLEK perlu memaparkan jadual `Asia/Kuala_Lumpur`, run terakhir, hasil dan run seterusnya. Mulakan dengan digest exception: pesanan tertangguh, penghantaran belum lengkap atau aduan tanpa evidence. Elakkan pemberitahuan berkala yang mengulangi status sama. Sediakan pause, retry dan sejarah yang boleh disemak. Rutin mestilah mempunyai deduplication dan window supaya restart tidak menghantar alert lama secara berulang.

## 10. Memory MCP dan credential boundary

Guide memory menyatakan konfigurasi rujukan default-off dan third-party contoh bukan endorsement. Client DSH memulakan stdio atau menyambung HTTP, menemui tool dan mengeksposnya kepada agent. Ia tidak memasang database vendor atau menyelia service HTTP upstream. Client stdio menapis pembolehubah yang lazim menandakan credential dan semua `DSH_*`; secret diperlukan diberi secara eksplisit. [Memory MCP](https://deepseek-harness.github.io/deepseek-harness/en/guide/mcp-memory).

**INFERENCE:** asingkan business truth daripada memory assistant. Harga, stok, status pesanan dan keputusan refund perlu datang daripada rekod autoritatif. Memory boleh menyimpan SOP atau preference yang diluluskan, dengan provenance serta expiry. UI integrasi hendaklah menunjukkan owner service upstream, transport dan scope; “connected” tidak bermakna semua tool dibenarkan.

## 11. Keselamatan dan had penggunaan

Safety notice rasmi menyatakan projek belum melalui security audit dan tidak boleh dianggap secure atau production-ready. Plugin serta command model mempunyai akses kepada resource yang diberikan. Sandbox/approval boleh mengurangkan risiko tetapi tidak menjamin containment; penerbit mengesyorkan least privilege, environment disposable, backup dan semakan plugin. [SAFETY.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md).

**INFERENCE:** gunakan OS isolation sebagai boundary sebenar dan business policy sebagai lapisan kedua. Model boleh mencadangkan refund tetapi server deterministik perlu memeriksa hak pengguna, jumlah, order ID dan state transition sebelum executor dibenarkan. Secret provider kekal server-side. Bukti keselamatan bukan bilangan dialog approval; ia ialah operasi yang ditolak dengan betul, audit record dan recovery yang boleh diuji.

## 12. Pemetaan khusus kepada projek

Semakan tempatan terbatas membaca `JEV.md` dan bahagian navigasi `src/components/WorkspaceSidebar.tsx`. Sidebar sudah memetakan Bisnes & operasi, Intelligence dan Google Workspace. Laporan ini **tidak mendakwa** audit source penuh atau integrasi DSH sudah berlaku.

| Kawasan projek | Cadangan INFERENCE | Bukti penerimaan |
|---|---|---|
| Sidebar | Agent Operations diletakkan dalam Intelligence dengan queued/blocked count | Semua count berasal daripada task store yang sama |
| Chat | Timeline request, validation, approval, execution, evidence | Retry tidak menduplikasi side effect |
| JEV | Verdict gate bertipe sebelum tool mutasi | Input tidak sah gagal sebelum external call |
| Plugins | Manifest capability dan dependency, config masked | Disable menutup resource; re-enable terkawal |
| Dashboard | Kad perhatian memaut ke task/order sebenar | Click membuka rekod yang membentuk angka |

## 13. Ledger JEV dan keputusan

| Tuntutan | Status | Keputusan |
|---|---|---|
| URL quickstart rasmi tersedia | VERIFIED | Halaman dibaca terus |
| Semua capability asas ialah plugin | VERIFIED | Architecture menerangkannya |
| DSH production-secure | Tidak disokong | Safety notice menolaknya |
| Custom route boleh cuba provider sedia ada | INFERENCE bersyarat | Perlu probe protokol/tool calling |
| `sdk-minimal` ialah sandbox selamat | Tidak disokong | Full access dinyatakan |
| DSH sudah terintegrasi dengan projek | UNKNOWN / belum dibuat | Review dokumentasi sahaja |
| Latency, reliability dan kos sifar pengguna | UNKNOWN | Tiada benchmark atau akaun diperiksa |

**Keputusan:** ambil model capability/lifecycle, session event, readiness dan status automation. Tangguhkan penggunaan langsung sebagai runtime produksi hingga pilot terasing membuktikan policy, persistence, privacy serta rollback. Kekuatan UI datang daripada state yang boleh dipercayai, bukan menambah label agent tanpa executor sebenar.

## 14. Cadangan urutan pelaksanaan

1. Inventori tool projek dan asingkan read-only daripada mutasi.
2. Takrif contract task/evidence serta state transition deterministik.
3. Bina Agent Operations UI menggunakan contract itu, tema yang sama dengan dashboard/sidebar.
4. Pilot satu tugas read-only pada runtime terasing dan provider sedia ada.
5. Uji crash, duplicate delivery, timeout, cancel dan credential masking.
6. Pertimbangkan satu mutasi berisiko rendah hanya selepas gate dan audit terbukti.

Setiap langkah ialah cadangan. Laporan ini tidak menukar source aplikasi, konfigurasi DSH atau server pengguna.

## 15. Ledger sumber

Semua diakses 2026-10-02: [quickstart](https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart), [README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md), [providers](https://deepseek-harness.github.io/deepseek-harness/en/guide/providers), [architecture](https://deepseek-harness.github.io/deepseek-harness/en/reference/), [plugin tutorial](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/), [SDK](https://deepseek-harness.github.io/deepseek-harness/en/guide/python-sdk), [GitHub review](https://deepseek-harness.github.io/deepseek-harness/en/guide/github-review), [schedule](https://deepseek-harness.github.io/deepseek-harness/en/guide/schedule), [memory MCP](https://deepseek-harness.github.io/deepseek-harness/en/guide/mcp-memory), [safety](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md). Tarikh review ialah tarikh akses, bukan tarikh setiap ciri dilancarkan. Versi installed pengguna dan commit tepat belum dipin.
