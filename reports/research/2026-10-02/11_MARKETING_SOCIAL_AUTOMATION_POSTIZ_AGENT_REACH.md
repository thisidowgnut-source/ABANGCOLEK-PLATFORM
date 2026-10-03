---
title: "ABANGCOLEK Marketing — Postiz, Agent-Reach dan Automation Berasaskan Bukti"
version: "1.0.0"
review_date: "2026-10-02"
status: "RESEARCH_AND_PROPOSED_PLAN_ONLY"
---

# Marketing yang Bersambung kepada Operasi ABANGCOLEK

## 1. Keputusan yang disyorkan

Bina **Marketing Workspace dalam ABANGCOLEK** sebagai tempat founder menyusun campaign, meluluskan kandungan, menyediakan kit ejen/stokis dan melihat outcome. Gunakan Postiz melalui server adapter sebagai pilihan publishing selepas readiness dibuktikan. Gunakan Agent-Reach sebagai pilihan research bagi Hermes, dengan sources dan akses yang dibenarkan.

Baseline tanpa subscription baharu ialah calendar, asset library, template, approval, export pack, campaign links dan first-party measurement milik projek. Publishing automatik ialah capability tambahan yang mesti lulus gate channel; produk kekal berguna melalui manual export apabila integrasi belum tersedia.

**Status:** dokumentasi dan cadangan sahaja. Tiada pemasangan kedua-dua repo, OAuth, akaun sosial, scheduler atau post sebenar diuji/dilaksanakan. Kajian sumber diakses pada **2 Oktober 2026**; pautan branch `main` boleh berubah dan perlu dipin pada execution.

## 2. Peta pengalaman founder

```text
+---------------------------------------+
| ABANGCOLEK / Founder / Marketing       |
| Campaign + Calendar + Assets + Results |
+------------------+--------------------+
                   |
                   v
+---------------------------------------+
| Research / product & offer facts       |
| Agent-Reach optional + canonical data  |
+------------------+--------------------+
                   |
                   v
+---------------------------------------+
| Hermes drafts / content variants       |
| JEV assessment + deterministic checks  |
+------------------+--------------------+
                   |
                   v
+---------------------------------------+
| Founder approval of exact revision     |
| Account + media + time + consent       |
+------------------+--------------------+
                   |
                   v
+---------------------------------------+
| Execute allowed publishing mode        |
| Manual export / scoped Postiz adapter   |
+------------------+--------------------+
                   |
                   v
+---------------------------------------+
| Receipt + attributed orders + learning |
| Customer flow / dealer restock / stock |
+---------------------------------------+
```

Semua kotak ialah seni bina cadangan. JEV memberikan assessment; authorization dan executor mengawal tindakan.

## 3. Review Postiz: apa yang relevan

Postiz menyediakan perancangan kandungan sosial, calendar dan publishing dengan konfigurasi mengikut channel. ABANGCOLEK boleh mengekalkan UI sendiri dan memanggil Public API melalui backend. Dalam API, connected account disebut `integration`; payload dan media constraints berbeza mengikut provider. API key/OAuth token tidak boleh dimasukkan ke bundle Vite. [API overview](https://docs.postiz.com/public-api/introduction), [posting rules](https://docs.postiz.com/general/platforms/overview).

Cadangan pemilihan: satu channel bisnes milik founder dahulu; kemudian tambah channel apabila permission dan outcome telah dibuktikan. Jangan jadikan jumlah logo integrasi sebagai ukuran siap. TikTok Shop commerce, social posting, inbox dan analytics ialah capability berbeza.

### Perkara penting tentang approval

Docs Postiz menerangkan preview/comment workflow, tetapi **tiada approved state yang menghalang publishing**. Preview URL juga tidak dilindungi password. Oleh itu ABANGCOLEK perlu approval gate sendiri: hanya revision yang diluluskan boleh dihantar ke scheduler. Kandungan sulit kekal dalam authenticated preview milik ABANGCOLEK. [Approval documentation](https://docs.postiz.com/general/approvals).

### Analytics mempunyai batas

Metrik yang tersedia bergantung platform dan jenis akaun. Tiada angka analytics bukan bermakna zero views. Simpan `observedAt`, period, provider, account dan definisi metrik; account totals serta post totals tidak boleh dicampur. UI membezakan unavailable, delayed, imported dan measured. [Analytics documentation](https://docs.postiz.com/general/analytics).

## 4. Postiz self-hosting dan lesen

Self-host memerlukan app serta PostgreSQL, Redis dan Temporal; local storage boleh digunakan. Dokumentasi hardware menyatakan floor 2 vCPU/2 GB untuk light use dan cadangan 4 vCPU/8 GB, dengan disk serta persistent uploads. Ini syarat vendor, **bukan benchmark host projek ini**. Ia bukan aplikasi statik yang boleh dipindahkan terus ke free Pages/Worker. [Installation](https://docs.postiz.com/self-host/installation/overview), [system requirements](https://docs.postiz.com/self-host/installation/system-requirements).

Repo menggunakan **AGPL-3.0**. Semak attribution, distribution dan kewajipan source yang berkenaan sebelum fork/modification/network deployment; adapter berasingan bukan alasan untuk menganggap semua kewajipan lesen selesai. Cadangan awal ialah instance berasingan dengan API yang jelas, bukan menyalin source Postiz ke komponen proprietari. [Postiz LICENSE](https://github.com/gitroomhq/postiz-app/blob/main/LICENSE).

Most relevant channels memerlukan developer app dan credentials provider apabila self-host. Logo yang muncul dalam pilihan channel bukan bukti konfigurasi lengkap. Cloud onboarding tidak boleh dianggap sama dengan instance self-host. [Provider setup](https://docs.postiz.com/self-host/providers/overview).

Baseline kos sifar bersyarat menggunakan hardware sedia ada; tiada assumption host sentiasa hidup atau pemasangan Docker sedia tersedia. AI/media generation berbayar, cloud trial dan editor pihak ketiga tidak diaktifkan sebagai dependency wajib. Account/provider pricing dan syarat semasa disemak sebelum channel diaktifkan.

## 5. Review Agent-Reach: kedudukannya

Agent-Reach ialah capability/routing layer untuk ejen mengakses sumber melalui upstream tools; ia mengurus pemilihan backend dan diagnostics. Ia **bukan publisher sosial universal**. README menyenaraikan public web/RSS/video/GitHub serta channel yang bergantung cookies atau sesi browser. Sebahagian readiness check hanya memeriksa credential presence; ia bukan bukti end-to-end channel berfungsi. [English README](https://github.com/Panniantong/Agent-Reach/blob/main/docs/README_en.md).

Repo MIT dan package Python mempunyai dependencies/runtime tersendiri. Label open source/free tidak menjamin upstream sentiasa percuma, stabil atau sesuai untuk semua penggunaan. Install instructions boleh mengubah sistem apabila pilihan tertentu digunakan; tiada installer dijalankan dalam kajian ini. [LICENSE](https://github.com/Panniantong/Agent-Reach/blob/main/LICENSE), [package definition](https://github.com/Panniantong/Agent-Reach/blob/main/pyproject.toml).

Use case utama ABANGCOLEK: analyst research yang mengumpulkan pautan, tarikh dan snippets relevan untuk ideation. Hak penerbitan asset, permission akaun dan kebenaran mengakses sumber mesti disemak secara berasingan. Jangan menganggap browsing capability memberikan hak menyalin kandungan.

## 6. Batas research yang praktikal

- Mulakan RSS, public web yang dibenarkan, pautan manual founder dan asset/transkrip milik sendiri.
- Source record membawa URL, retrieved time, author jika tersedia, capture method, penggunaan yang dibenarkan dan expiry.
- Unknown channel kekal unavailable; jangan menghantar workflow secara senyap ke paid proxy/provider.
- Browser-session research memerlukan akaun khusus dan explicit opt-in setiap scope; cookie/token tidak masuk model prompt, laporan atau log.
- Login, CAPTCHA dan access controls tidak dibypass. Tidak membaca inbox/personal founder di latar belakang sebagai default.
- Kandungan luar dianggap untrusted: arahan dalam post/webpage tidak boleh mengubah tool grant, prompt policy atau recipient.
- Pin package/runtime setelah review dependency; SECURITY.md ialah reporting policy, bukan audit keselamatan bebas. [Security policy](https://github.com/Panniantong/Agent-Reach/blob/main/SECURITY.md).

## 7. Modul Marketing Workspace

| Modul | Kerja founder/staff | Outcome yang disimpan |
|---|---|---|
| Campaign Desk | Matlamat, audience, SKU, offer, lokasi, tarikh | Versioned brief, owner dan approved offer |
| Research Inbox | Semak signal dan sumber | Accepted/rejected insight dengan evidence |
| Content Studio | Draft BM/English, storyboard, captions | Content revision dan variants |
| Asset Library | Foto/video/brand templates/UGC | Ownership, consent, expiry dan asset hash |
| Calendar | Slot MYT, channel, status dan collision | Schedule UTC + timezone + account |
| Approval Inbox | Preview tepat dan perubahan | Approver, scope, revision, expiry |
| Publishing Monitor | Queued/published/failed/unknown | Provider references dan reconciliation |
| Dealer Campaign Kits | Approved local variants dan pickup CTA | Kit version, eligible dealer scope |
| Results | Campaign visits, submissions, orders | Defined attribution dan denominator |

Sidebar founder mengelompokkan modul ini di bawah **Marketing**; staff hanya mendapat tugas content yang assigned. Developer melihat health/quotas sanitized, bukan publishing privileges secara automatik.

## 8. Content pillars khusus ABANGCOLEK

1. **Cara makan / resipi:** demonstrasi menggunakan produk yang founder sahkan; tiada dakwaan nutrisi baharu.
2. **Founder story:** proses niaga, cabaran dan keputusan yang founder benarkan untuk publik.
3. **Behind the scenes:** packing, QC dan kerja staff dengan consent; jangan bocorkan alamat/label customer.
4. **Lokasi & availability:** gerai/pop-up/dealer pickup menggunakan lokasi/jadual approved, bukannya sample lama.
5. **UGC/testimoni:** petikan sebenar berizin dengan konteks; tiada review atau before/after rekaan.
6. **Dealer education:** handling, receiving, shelf-life berdasarkan polisi produk sebenar dan kit jualan.

Satu shoot boleh menghasilkan video utama, short cuts, foto, caption dan FAQ. Baseline menggunakan footage sendiri dan template setempat; musik/stock media memerlukan hak penggunaan. AI yang tersedia boleh membantu draft, tetapi content masih melalui fact/rights review.

## 9. Enam automation yang memberi nilai operasi

### A. Weekly campaign assistant

Founder pilih produk, audience, offer dan matlamat → sistem membaca published catalogue serta availability → Hermes menyusun draft mingguan → JEV menilai soalan atomik → founder approve → export/schedule channel yang ready. Tiada harga atau offer dijana daripada ingatan model.

### B. Stock-aware campaign preparation

Campaign berkaitan SKU membaca stock snapshot dengan timestamp. Apabila inventory/offer version berubah, upcoming content yang belum dihantar ditandakan `needs_review`. Worker menyemak semula pada dispatch. Pause/cancel pada provider memerlukan confirmation provider; UI tidak mendakwa scheduled post telah ditahan sebelum confirmation. Founder menerima exception yang actionable, bukan notifikasi setiap polling.

### C. Dealer local campaign kit

HQ menyediakan asset dan offer approved → dealer mendapat caption lokasi/pickup sendiri, QR serta eligible stock → dealer eksport atau connect account dengan grant sendiri. Dealer tidak boleh mengubah official product claim/harga policy HQ atau menerbit ke akaun dealer lain. Setiap campaign kit mempunyai expiry dan version.

### D. Booth/event campaign pack

Event approved menghasilkan checklist: teaser, location card, reminder, on-site product flow dan recap. Masa serta stock disahkan manusia. Visitor QR masuk customer buy flow, dengan campaign ID yang tidak mendedahkan customer PII. Native map/provider dialogs boleh kekal handoff yang dilabel.

### E. Content-to-order measurement

Campaign link → landing/flow → submission → order → verified payment → fulfilment. Rekod menunjukkan tahap yang diukur, kaedah attribution, consent dan known limitations. Platform views tidak dianggap pembeli; campaign attribution tidak membuktikan causation.

### F. Research-to-experiment loop

Agent-Reach mengumpulkan sources yang dibenarkan → Hermes mencadangkan hipotesis → founder memilih satu eksperimen creative/audience → sistem menyimpan baseline, tempoh dan outcome. Cadangan berdasarkan evidence kecil dilabel tentative; tiada janji viral atau kemenangan terhadap semua pesaing.

## 10. Maksimumkan JEV dalam marketing

Gunakan tiga primitives untuk soalan yang kecil dan boleh diuji: **Choice** bagi content intent/format/routing; **Score** bagi rubrik kejelasan CTA atau kesesuaian brand; **Noul** bagi likelihood bahawa kandungan mengandungi claim tidak disokong atau PII. Gabungkan keputusan dengan polisi deterministik dan human approval. [TypeSafe primitives overview](https://docs.typesafe.ai/introduction).

Market signal confidence tidak sama dengan content factual correctness atau probability jualan. Numeric rules seperti price equality, offer validity, consent expiry dan account grant diuji terus dalam kod; classifier tidak menggantikannya. Low evidence/invalid output menghasilkan `UNKNOWN`/review, bukan peluang auto-publish.

Question packs cadangan: `marketing.claims`, `marketing.brand_fit`, `marketing.privacy`, `marketing.cta`, `dealer.local_campaign`, `research.source_quality`. Setiap pack mempunyai rubric version dan test set BM/English termasuk slang, ambiguity dan prompt injection.

Keupayaan projek kini menggunakan Gemini untuk JEV-like JSON; native Jev API bukan dependency yang telah disahkan percuma. Pelan JEV terperinci: [12_JEV_PLATFORM_CAPABILITY_PLAN.md](12_JEV_PLATFORM_CAPABILITY_PLAN.md).

## 11. Approval dan execution contract

Approval mengikat `businessId`, campaign/revision, asset hashes, channels/account IDs, scheduled time, approved price/offer version dan grant expiry. Sebarang edit relevant membatalkan approval. Preview memaparkan kandungan sebenar bagi setiap platform, bersama warning media/claim yang belum selesai.

Scheduled time tidak boleh melebihi approval/grant/rights expiry. Jika edit/revoke berlaku selepas Postiz menerima schedule, block local dispatch sahaja tidak mencukupi: request remote cancellation melalui supported API, simpan `cancel_pending`, kemudian reconcile sehingga cancellation disahkan. Timeout menghasilkan `unknown`; founder diberi alert bahawa post masih mungkin diterbitkan. Invalidate UI approval tidak boleh dipaparkan sebagai remote cancellation yang berjaya.

Cadangan status:

```text
draft -> awaiting_review -> approved -> scheduled
scheduled -> publishing -> published
publishing -> failed / unknown
unknown -> reconciliation -> published / failed / needs_review
```

`manual_required` ialah delivery mode/fallback yang jelas. Export/copy/open composer tidak sama dengan publish. API request accepted/scheduled tidak sama dengan live post; hanya evidence provider yang mencukupi boleh mengesahkan published.

Satu content revision/account/time mempunyai local idempotency key. Jika request timeout, cari reference/outcome terlebih dahulu; jangan replay create-post membuta tuli. Semak kemampuan remote idempotency semasa execution. Approval sahaja tidak menjamin exactly-once publishing pada provider yang tidak menyokong kontrak itu.

## 12. Capability matrix sebelum auto-publish

| Capability | Default | Gate |
|---|---|---|
| Draft/calendar/assets dalam app | Boleh dibina | Identity, versioning, persistence |
| Manual export pack | Baseline | Approved assets dan recipient/channel label |
| Postiz connection | Not tested | Instance health, owner grant, secrets, app setup |
| Publishing satu channel | Disabled | Real permitted account + test post approval + receipt |
| Cross-channel publishing | Disabled | Per-channel format/settings/error verification |
| Analytics import | Unknown per channel | Supported API/scopes/sample reconciliation |
| Social DM/comment auto-reply | Tidak menjadi baseline | Separate official API scope, moderation, consent |
| Paid ads/ad spend | Disabled | Arahan eksplisit di luar zero-new-spend baseline |
| TikTok Shop order sync | Tidak diwarisi daripada social publishing | Commerce integration berasingan |
| Native WhatsApp campaign | Disabled | Official eligibility, consent dan pricing verified |

Angka supported-platform dalam docs tidak konsisten antara halaman overview/API; jangan jadikan count sebagai kontrak capability. Uji akaun/channel sebenar yang diperlukan.

## 13. Data dan permissions

Records cadangan: `Campaign`, `CampaignRevision`, `ContentVariant`, `AssetRights`, `ResearchSource`, `Assessment`, `Approval`, `ChannelGrant`, `PublishAttempt`, `ProviderReceipt`, `MetricObservation`, `AttributionEvent`, `DealerKit`.

- Founder/business marketing approver: boleh publish dalam scope yang diberikan.
- Staff creator: draft/upload untuk task assigned; tiada arbitrary channel send.
- Dealer: own kit/account/source orders sahaja; separate membership dan consent.
- Customer: public approved content dan own submissions; UGC consent boleh ditarik mengikut policy.
- Developer: configuration/runtime/redacted errors; tidak memperoleh marketing approval secara automatik.

Keep credentials server-side encrypted at rest dengan key management yang dipilih semasa execution. Rotate/revoke mengikut provider; local revocation mesti block new jobs segera dan memulakan remote cancellation/reconciliation untuk schedule sedia ada. Tidak menjanjikan revocation menggugurkan post yang telah diterbitkan.

## 14. Dashboard dan UX

Overview memperlihatkan **Needs approval**, **Scheduled**, **Channel issues** dan **Campaign outcomes**. Setiap KPI mempunyai time range/source/freshness. Calendar ada list view pada mobile, filter brand/channel/dealer dan accessible keyboard controls; drag-and-drop bukan satu-satunya cara reschedule.

Content drawer menyatukan brief, source facts, per-channel preview, JEV uncertainty, approval dan execution history. Tindakan utama satu pada satu masa: review, approve, export atau reconcile. Sidebar menggunakan global theme dark/light dan palette reference yang telah dipilih. Status menggunakan teks/icon bersama warna; reduced motion dan touch controls wajib.

## 15. Measurement yang berguna

Ukur masa dari brief ke approved content, revision count, publish failure/unknown rate, duplicate posts, manual recovery time, consent exceptions dan app switches. Ukur flow-start → submission → verified-paid order dengan denominator/time window yang jelas. Dealer campaign performance menggunakan data own-scope, sell-through dan stock freshness.

A/B experiments memerlukan minimum sample dan perbezaan audience/date yang diketahui; pilih sasaran selepas baseline. Jangan mengagregat views daripada platform berbeza seolah-olah unique people atau menganggap organic attribution sebagai incremental sales.

## 16. Pelaksanaan berfasa

| Fasa | Deliverable | Bukti acceptance |
|---|---|---|
| 1 | In-app campaign, assets, calendar, approval, export | Role isolation, edit invalidates approval, manual label jujur |
| 2 | Satu self-host Postiz channel pilot | Capacity/license/app gate, schedule/receipt/revoke/timeout tests |
| 3 | Read-only research melalui Hermes/Agent-Reach | Sources retained; unavailable channel abstains; no side effects |
| 4 | Dealer kits + campaign attribution | Own-scope account/QR; paid-order linkage dan duplicate checks |
| 5 | Conditional routines + exceptions | Stock/offer changes re-review; retry/restart/reconcile verified |

Tiada tempoh delivery direka tanpa team/capacity baseline. Tiada paid service ditambah untuk menutup failure. Marketing core tidak bergantung kepada research bot atau Postiz uptime untuk editing/export.

## 17. JEV evidence ledger untuk kajian ini

| Pernyataan | Status | Bukti/batas |
|---|---|---|
| Postiz mempunyai Public API dan self-host path | VERIFIED_DOC | API dan installation docs |
| Postiz approval menguatkuasakan approved flag | FALSE menurut docs semasa | Approval page menyatakan tiada blocking flag |
| ABANGCOLEK boleh menggunakan UI sendiri + adapter | INFERENCE | Cadangan engineering; belum diimplementasikan |
| Agent-Reach boleh membantu source research | VERIFIED_DOC, runtime NOT_TESTED | Repo README; upstream channels tidak diuji |
| Agent-Reach publish semua akaun sosial | NOT_SUPPORTED oleh bukti review | Jangan jadikan research tool universal publisher |
| Semua analytics tersedia dan percuma | UNKNOWN/tidak dijanjikan | Per-channel capability/scopes/pricing |
| Native Jev dalam projek telah berjalan | Tidak dibuktikan | Source semasa menggunakan Gemini generateContent |
| Campaign menghasilkan jualan/viral automatik | UNKNOWN | Tiada campaign execution/data experiment |

Ledger ialah review manual berasaskan dokumen/source; tiada TypeSafe/Gemini model call dibuat untuk kajian ini. Ia bukan security certification atau license opinion.

## 18. Sumber dan deliverable berkaitan

Sumber lain yang diperiksa: [Postiz repository](https://github.com/gitroomhq/postiz-app), [compose source](https://github.com/gitroomhq/postiz-app/blob/main/docker-compose.yaml), [OAuth documentation](https://docs.postiz.com/public-api/oauth), [Agent-Reach repository](https://github.com/Panniantong/Agent-Reach). Sumber third-party tool dalam README tidak diluluskan secara automatik sebagai dependency projek.

Baca bersama [masterplan](09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md), [agent/stokis research](10_AGENT_STOKIS_BUSINESS_SYSTEM.md), [WhatsApp flow research](08_WHATSAPP_FLOW_ZERO_COST.md), [JEV capability plan](12_JEV_PLATFORM_CAPABILITY_PLAN.md) dan [technical implementation plan](../../../docs/superpowers/plans/2026-10-02-platform-expansion.md).

**Cadangan utama:** marketing berkongsi catalogue, inventory, approvals, customer flows dan dealer outcomes dengan operasi. Founder boleh menyiapkan campaign hingga semakan hasil dalam satu workspace, dengan handoff provider yang kelihatan serta bukti tindakan yang sebenar.
