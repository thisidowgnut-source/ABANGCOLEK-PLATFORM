---
title: "WhatsApp Flows dan ABANGCOLEK Flow: pelan tanpa langganan tambahan"
document_id: "ABANGCOLEK-WHATSAPP-FLOW-ZERO-COST-20261002"
date: "2026-10-02"
timezone: "Asia/Kuala_Lumpur"
status: "RESEARCH_AND_PROPOSAL"
implementation_status: "NOT_IMPLEMENTED"
evidence_method: "Manual evidence ledger; bukan panggilan model TypeSafe Jev atau engine JEV projek"
---

# WhatsApp Flows dan ABANGCOLEK Flow

## 1. Keputusan yang dicadangkan

**Bina ABANGCOLEK Flow sebagai pengalaman borang perbualan milik projek.** Pelanggan membuka link/QR, menjawab langkah ringkas, menyemak ringkasan dan menerima receipt. Staff dan founder menyelesaikan permintaan melalui inbox dalaman yang menggunakan rekod sama. WhatsApp menjadi saluran masuk atau handoff pilihan.

Cadangan ini tidak memerlukan lesen builder pihak ketiga atau penghantaran mesej Cloud API. Ia boleh menghasilkan pengalaman seperti ordering, onboarding dan support flow. Pengalaman tersebut berjalan dalam web/PWA ABANGCOLEK; **ia bukan native WhatsApp Flow di dalam chat**. Memasang PWA juga pilihan, bukan syarat untuk pelanggan membuat pesanan.

Untuk founder kekal di satu aplikasi, letakkan submission inbox, timeline, draft balasan, SOP, bukti, assignment, keputusan dan receipt dalam workspace. Founder tidak perlu WhatsApp bagi mengurus submission yang masuk melalui portal. Apabila penghantaran WhatsApp sebenar diperlukan tanpa integrasi API, operator masih perlu membuka aplikasi WhatsApp dan menekan Send. Jangan menyembunyikan batas itu dengan status “sent” palsu.

## 2. Maksud sifar kos yang realistik

Sasaran ialah **sifar langganan atau caj API tambahan untuk workflow asas**, menggunakan aset dan runtime yang sudah tersedia. Ia tidak bermaksud elektrik, internet, domain, perkakasan, penyelenggaraan, bandwidth dan kapasiti storage tidak mempunyai kos. Free tier juga mempunyai quota dan polisi yang boleh berubah.

Bezakan tiga jalur dalam product settings:

| Jalur | Kegunaan | Kos/limit yang perlu dilihat |
|---|---|---|
| `OWN_WEB_FLOW` | Ordering, feedback, aduan, onboarding, checklist | Infrastruktur sedia ada; quota dan availability deployment |
| `MANUAL_WHATSAPP_HANDOFF` | Buka chat dengan draft/link | Tiada panggilan messaging API dari projek; operator sendiri menghantar |
| `OFFICIAL_WHATSAPP_API` | Inbox mesej sebenar, webhook, delivery status, native Flows | Akses akaun, permission, kadar Meta, quota dan kemungkinan fee provider |

Jalur API kekal tidak aktif secara default. Jangan membeli BSP atau mengaktifkan billing untuk memenuhi demo. Jika founder kemudian mahukan automasi WhatsApp sebenar, gate teknikal dan kos perlu disahkan bagi akaun itu.

## 3. Apa native WhatsApp Flows sebenarnya

Meta menerangkan Flows sebagai interaksi berstruktur dalam mesej WhatsApp untuk perkara seperti booking, product browsing dan feedback. Ia bukan sekadar mesej panjang atau deep link. [Meta official Postman workspace](https://www.postman.com/meta/whatsapp-business-platform/overview).

Collection rasmi mempunyai create, JSON update, publish, metadata, deprecate dan delete. Create dikaitkan dengan WABA dan bearer token. Oleh itu, UI ABANGCOLEK yang menyerupai flow tidak dengan sendiri memberi akses kepada native Flows. [Meta Create Flow](https://www.postman.com/meta/whatsapp-business-platform/documentation/y5swede/moved-whatsapp-flows-api?entity=request-cea2e676-895a-4f5b-a431-ef59e3019836).

Metadata termasuk kategori dan endpoint URI. Contoh kategori meliputi lead generation, support dan survey; mapping use case ABANGCOLEK kepada kategori Meta perlu dinilai semasa export. [Meta Update Flow Metadata](https://www.postman.com/meta/whatsapp-business-platform/request/wkmr7hj/update-flow-metadata).

Meta juga menyediakan operasi pendaftaran encryption public key pada phone number. Data exchange memerlukan implementation protocol yang tepat; parameter crypto tidak patut diteka atau dipetik daripada blog sebelum shipping. [Meta Setup Endpoint Encryption](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api?entity=request-13382743-d4b46bcd-2cae-451a-8320-edfc7b7da07e).

Repository WhatsApp rasmi menyediakan tools dan code examples di bawah MIT. Contoh berguna sebagai rujukan konsep, tetapi versi API lama yang muncul di contoh tidak boleh dianggap versi production semasa. [WhatsApp Flows Tools](https://github.com/WhatsApp/WhatsApp-Flows-Tools), [Meta survey example](https://github.com/WhatsApp/WhatsApp-Flows-Tools/blob/main/articles/creating-surveys/main.py).

### Prasyarat yang mesti dibuktikan sebelum pilot native

- Pemilik business assets, WABA dan phone number yang betul.
- Akses app, token serta permission yang sah; secrets hanya pada server.
- Eligibility/integrity/business verification yang diperlukan oleh akaun dan deployment semasa. **Keperluan tepat belum disahkan melalui developer page kerana fetch gagal.** Jangan menyamakan blue-check subscription dengan business verification.
- Flow JSON yang lulus validator versi sasaran.
- Endpoint/webhook, pemetaan submission dan penanganan event berulang.
- Untuk data exchange: TLS, key handling, request/response encryption dan health handling.
- Ujian device sebenar, supported components, publish lifecycle dan message/template rules.
- Rate card semasa serta billing behaviour yang boleh diaudit.

## 4. Semakan harga semasa: jangan menjanjikan window percuma tanpa batas

Pada **2 Oktober 2026 MYT**, halaman marketing rasmi yang boleh diekstrak masih menyatakan service serta utility reply tidak dikenakan caj dan menerangkan customer service window 24 jam. Halaman sama menyatakan pricing berdasarkan mesej delivered, market dan kategori. [WhatsApp Business Platform Pricing](https://whatsappbusiness.com/products/platform-pricing/?no_head=1).

Namun carian web menemukan laporan baru tentang perubahan bermula 1 Oktober 2026. Developer pricing dan non-template pricing rasmi tidak dapat dibuka: fetch menghasilkan 429/throttling. Oleh itu laporan ini **tidak mengesahkan** jumlah free tier, kadar Malaysia atau exemption utility selepas tarikh tersebut. Halaman marketing boleh belum dikemas kini; statement lama tidak digunakan sebagai kontrak kos deployment. Rujukan yang perlu diperiksa semula: [Meta developer pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), [Meta non-template pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/).

Keputusan engineering:

- Jangan label automasi API “free unlimited” atau menganggap semua mesej dalam 24 jam percuma.
- Jangan menganggap Flow sendiri menjamin mesej pencetusnya percuma.
- Paparkan last verified date, rate source, category, market dan billing status.
- Dalam mode zero additional cost, executor menolak tindakan berbayar atau berharga unknown, lalu menawarkan portal notification/manual handoff.
- Iklan sebagai free-entry mechanism bukan strategi sifar kos: acquisition ad boleh berbayar.
- Broadcast dalam aplikasi Business juga tidak patut dianggap percuma; Help Center menyatakan Business broadcasts berbayar mengikut delivered recipient. [WhatsApp Business broadcast pricing](https://faq.whatsapp.com/1356785542323967/?cms_platform=web).

## 5. Deep link WhatsApp: apa yang boleh dibuktikan

Help Center rasmi mendokumenkan `https://wa.me/<number>` dengan nombor antarabangsa tanpa bracket, tanda tambah atau dash. Parameter `text` menyediakan prefilled message dalam composer. **Membuka link bukan menghantar mesej.** [WhatsApp Click to Chat](https://faq.whatsapp.com/5913398998672934/?locale=fi_FI).

Integrasi projek perlu menyimpan event secara berasingan:

- `draft_prepared`: teks disediakan.
- `handoff_opened`: link WhatsApp dibuka.
- `operator_confirmed`: operator mengatakan penghantaran dibuat, dengan provenance manual.
- `provider_sent`, `delivered`, `read`: hanya apabila provider rasmi memberi bukti yang sesuai.

Tanpa API, jangan menjanjikan inbound sync, delivery/read receipts, full conversation history atau automated follow-up. Website form submission mempunyai receipt dalaman sendiri; WhatsApp handoff tidak menggantikan receipt itu.

## 6. Bukti source projek semasa

Semakan bertarget pada 2 Oktober 2026 menemukan:

- [`busFreightService.ts`](../../../src/services/busFreightService.ts), baris 625–631: `formatWhatsAppUrl` membersihkan digit, menganggap nombor Malaysia dan menggunakan `encodeURIComponent(message)`. Ia asas untuk handoff. Boundary validation nombor perlu ditambah sebelum data tidak sah membentuk destination yang salah.
- [`AbangColekDiscoveryView.tsx`](../../../src/components/AbangColekDiscoveryView.tsx), sekitar baris 1001: copy UI menyebut extension WOCS dan Meta webhook.
- Fail sama sekitar baris 1284–1289 memaparkan tree monorepo lain termasuk content injection dan server webhook. **Tree berbentuk teks dalam UI tidak membuktikan runtime tersebut tersedia atau terhubung dalam checkout ini.**
- Carian source bertarget belum menemukan shared `FlowDefinition`. Ini bukan audit menyeluruh semua codepath atau repository luaran.

Status yang dicadangkan bagi UI: `Templat tersedia`, `Handoff manual tersedia`, `Cloud API belum disahkan`. Integration badge perlu datang daripada readiness check, bukan ayat marketing hardcoded.

## 7. Reka bentuk di luar kotak: konteks datang daripada fizikal bisnes

### 7.1 QR pada botol, booth dan dokumen

QR botol membawa route batch/product context; QR booth membawa event context; QR invoice membawa reference. Setiap URL membuka flow yang relevan tanpa meminta pelanggan mengisi konteks berulang.

**Batch code ialah konteks, bukan credential.** QR awam tidak boleh membuka data pelanggan lain atau keputusan dalaman. Untuk order-specific actions, gunakan capability token rawak, terhad tujuan, expiry dan revocation. Token hanya boleh mengakses scope yang dibenarkan.

### 7.2 Pelanggan isi di portal, founder terima kerja siap konteks

Pelanggan memilih isu, memasukkan reference dan memuat naik bukti. Inbox founder menerima submission berstruktur dengan next step, owner dan perkara belum diketahui. Pengguna boleh menambah WhatsApp handoff selepas submission, tetapi inquiry sudah wujud dalam sistem meskipun mereka membatalkan handoff.

### 7.3 Tiga renderer untuk satu definisi

Definisi flow boleh dipaparkan sebagai:

- Borang perbualan untuk mobile/customer.
- Borang ringkas untuk staff yang memproses banyak rekod.
- Read-only timeline/ringkasan untuk founder.

Output domain sama, bukan tiga salinan state. Bentuk visual disesuaikan mengikut tugas.

### 7.4 Receipt sebagai pusat sambung kerja

Receipt menyediakan ID, status, ringkasan, masa MYT dan tindakan seterusnya. Customer boleh sambung dari link yang dibenarkan. Staff membuka entity drawer yang sama. Founder memantau exception. Developer melihat event IDs dan diagnostics tanpa membaca semua kandungan sensitif.

## 8. Flow yang memberi nilai dahulu

| Flow | Customer | Staff | Founder |
|---|---|---|---|
| Beli/reorder | Produk, kuantiti, lokasi, review | Semak fulfilment dan payment status | Lihat exception/conversion |
| Aduan kualiti | Reference, jenis isu, bukti | Triage dan minta bukti tambahan | Luluskan resolusi mengikut kuasa |
| Ejen/stokis | Pendaftaran dan pilihan kawasan | Semak onboarding | Keputusan eligibility |
| Booth/pickup | Tempahan slot atau collection preference | Queue dan handoff receipt | Kapasiti/exception |
| Penghantaran | Tracking/request help | Dispatch, terminal, penerimaan | Eskalasi kelewatan |
| Staff QC | Tiada akses dalaman | Batch checklist + bukti | Lihat penyimpangan |

Harga datang daripada catalog sah; availability slot daripada kapasiti sebenar. Upload resit hanya bukti yang perlu disemak, bukan jaminan pembayaran diterima. Refund tidak dilaksanakan oleh classifier.

## 9. Kontrak bersama yang dicadangkan

Ini spesifikasi architecture, bukan code production yang telah dipasang.

| Kontrak | Medan utama |
|---|---|
| `FlowDefinition` | ID, version, purpose, locale, audience, steps, conditions, validation rules, output schema, retention policy |
| `FlowSession` | Session ID, definition version, capability scope, current step, revision, answers, expiry |
| `FlowSubmission` | Submission ID, session ID, validated output, entity references, evidence IDs, receivedAt |
| `ActionRequest` | Actor, authorization scope, operation, target, preview, idempotency key |
| `ExecutionReceipt` | Attempt, provider/method, status, timestamps, outcome evidence, failure/reconciliation state |

Conditions ialah declarative allowlisted rules, bukan arbitrary JavaScript dari flow editor. Server mengesahkan semula harga, scope dan output. Transition tetap sah walaupun browser skip screen.

Flow version pinning memastikan session lama tidak rosak apabila founder mengubah definisi. Retry submit dengan idempotency key menghasilkan submission yang sama. Pending offline draft dilabel jelas; ia menjadi `received` hanya selepas server acknowledgment.

### Export native Flows

Compiler pilihan boleh memetakan subset field/screens kepada Meta Flow JSON. Tidak semua upload, layout, condition atau application behaviour mempunyai padanan native. Compiler menghasilkan compatibility report dan menolak unsupported features. Ia tidak auto-publish atau send. Versi JSON dan API perlu dipin semasa pilot, bersama test device sebenar.

## 10. Kedudukan JEV dan agent

JEV membantu routing selepas submission valid: jenis aduan, keperluan bukti, urgency dan specialist yang sesuai. Unknown kekal unknown. Rules deterministik mengawal eligibility, ownership, perubahan status dan financial decisions.

Hermes boleh menjadi calon worker yang menyediakan draft atau triage menggunakan skill version tertentu. Grok Bot memberi rujukan ownership/handoff. Flow asas tetap berfungsi apabila model unavailable. AI tidak diperlukan untuk memaparkan form, menyimpan submission, mengira total atau membuka receipt.

Consent privacy dan consent marketing ialah tujuan berbeza. Customer tidak perlu bersetuju menerima promo untuk membuat aduan. Teks pelanggan/bukti tidak menjadi arahan kepada executor; extraction output melalui schema dan allowlist.

## 11. Pelaksanaan dan acceptance gates

### Gate A: prototype tanpa provider

- Flow reorder dan quality complaint berfungsi di mobile.
- Back/next, validation, resume dan receipt bekerja.
- Invalid/negative quantity ditolak; total daripada catalog.
- Draft offline tidak dipaparkan sebagai diterima.
- Link WhatsApp hanya handoff; status tidak berubah kepada sent/delivered.

### Gate B: shared backend dan roles

- Customer hanya melihat submission sendiri.
- Staff melihat assigned/authorized scope; founder permissions eksplisit.
- Developer diagnostics tidak secara automatik membuka semua PII.
- Token tampering/expiry/replay ditolak atau dikendalikan mengikut action.
- Submit berulang dan reconnect menghasilkan satu rekod domain.
- File type/size validation, private evidence storage dan scoped download diterapkan.

### Gate C: readiness dan operasi

- Inbox, assignment, decision, draft dan receipt boleh diselesaikan dalam workspace.
- Export/backup dan restore flow version/session diuji.
- Reliability dashboard menunjukkan backlog, failure dan last successful run.
- No paid operation apabila cost status unknown.

### Gate D: native hanya apabila diperlukan

- Eligibility, account access, pricing dan messages policy disahkan pada tarikh pilot.
- JSON compiler lulus official validator.
- Real-device completion, webhook duplication, credential expiry dan data exchange failure diuji.
- Delivery status datang daripada provider evidence.

## 12. JEV manual evidence ledger

| Claim | Status | Evidence / implication |
|---|---|---|
| Native Flows menyokong interaksi berstruktur | VERIFIED_DOC | Meta official workspace |
| Create Flow dikaitkan WABA/token | VERIFIED_DOC | Meta official collection |
| wa.me menyediakan draft composer | VERIFIED_DOC | WhatsApp Help Center |
| Project mempunyai URL formatter | VERIFIED_SOURCE | service lines 625–631 |
| WOCS/webhook live dalam checkout | UNKNOWN | UI prose bukan runtime proof |
| Semua API replies24h percuma selepas1Oct2026 | NOT_ESTABLISHED | Official page conflict risk + developer page inaccessible |
| PWA workflow tidak memerlukan messaging API fee | ARCHITECTURE_INFERENCE | Flow disubmit ke backend projek; tiada Cloud API operation |
| Satu definition boleh diexport lengkap ke native | UNKNOWN | Perlu compatibility mapping dan version validation |
| Founder boleh mengurus submission portal dalam satu workspace | PROPOSAL | Perlukan shared backend/roles/inbox |

Tiada model JEV dipanggil, confidence numerik tidak direka, dan capability yang belum dipasang tidak dilabel live.

## 13. Ringkasan keputusan

**Bina portal flow milik ABANGCOLEK dahulu.** Ini memberi kawalan pengalaman, data dan kerja sambungan dengan sifar langganan builder tambahan. Ia menyatukan customer, staff dan founder pada rekod serta receipt yang sama. Native WhatsApp Flows ialah adapter pilihan selepas eligibility, compatibility dan kos disahkan. Handoff manual kekal jujur tentang batas penghantaran.
