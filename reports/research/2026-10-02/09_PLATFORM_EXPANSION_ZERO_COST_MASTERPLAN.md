---
title: "ABANGCOLEK-OS — Pelan Platform Lengkap, Empat Portal dan Flow Kos Sifar"
version: "1.1.0"
review_date: "2026-10-02"
status: "IMPLEMENTATION_IN_PROGRESS"
implementation_status: "Authorized selepas pelan selesai; semak implementation ledger untuk bukti setiap gate"
---

# ABANGCOLEK-OS: Satu Tempat untuk Menjalankan Bisnes

## 1. Keputusan produk

Bangunkan satu platform dengan **landing page awam + Customer Portal + Staff Workspace + Founder Cockpit + Developer Console**. Ejen dan stokis menggunakan dealer workspace di dalam Customer Portal, dengan capability dan scope B2B tersendiri. Dealer tidak secara automatik menjadi staff HQ.

Founder boleh meneruskan kerja daripada isu kepada keputusan, draft, tugasan, dokumen dan hasil melalui konteks yang sama. Semua permukaan membaca rekod bisnes bersama. Antara muka disesuaikan mengikut tugas serta permission pengguna.

Arahan terbaru pengguna ialah **pelan lengkap dahulu dalam `.md`**. Dokumen ini menetapkan produk, dependency dan gate; tiada source aplikasi, database, credential, installer atau deployment diubah oleh penyediaan pelan.

### Maksud sasaran kos sifar

Sasaran ialah **RM0 tambahan untuk subscription software dan API dalam quota yang diluluskan**. Gunakan kod milik projek, free tier yang telah disemak dan hardware/akaun sedia ada. Domain, internet, elektrik, peranti, acquiring/payment fees dan penghantaran fizikal bukan percuma secara automatik. Availability 24/7 serta SLA enterprise tidak diwarisi daripada free tier.

Kualiti seperti syarikat Fortune 500 diterjemahkan kepada traceability, least privilege, pemilikan kerja, versi data, consistency UI, recovery, export dan bukti outcome. Ia bukan dakwaan kapasiti, certification atau SLA yang telah dicapai.

## 2. Asas dan jurang projek semasa

Semakan source pada 2 Oktober 2026 menunjukkan:

- Satu React/Vite SPA dengan 18 modul menggunakan `activeTab` di `src/App.tsx`; portal/path router berasingan belum ditemui dalam laluan yang diperiksa.
- Theme global serta sidebar sudah diperbaiki. Ia digunakan semula, bukan dibina semula.
- `supabaseAuth.ts` mempunyai session API sebenar, tetapi `quickStaffSignIn` boleh menghasilkan user simulasi apabila sign-in gagal. Mock user itu bukan session/JWT yang sah.
- App render modul tanpa pemeriksaan audience/role; hidden navigation belum menjadi authorization boundary.
- Embedded SQL di `supabaseClient.ts` memberi public read orders/JEV serta public insert orders. Ini template source; policy live belum diperiksa.
- Kontrak embedded orders berbeza dengan payload `supabaseOrders.ts`; migration contract perlu diputuskan sebelum portal multi-user.
- Source orders boleh memberi success ketika cloud persistence gagal, serta seed sample ketika hasil fetch kosong. Kedua-dua tingkah laku perlu dibetulkan sebelum data customer produksi digunakan.
- Cache local belum diasingkan mengikut identiti. History JEV bukan execution audit pasukan.

Penemuan ialah source evidence, bukan audit live database. Dokumen lama yang menyebut data contoh sebagai live atau integrasi sudah siap tidak dijadikan bukti produksi.

## 3. Peta platform

```text
+-----------------------------------------+
| ABANGCOLEK: landing + katalog + entry QR |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| Identity: session + membership + scope   |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| Empat pengalaman                        |
| Customer / Staff / Founder / Developer  |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| Rekod + Flow Engine + task + evidence   |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| JEV + deterministic business policy     |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| Executor + credential + audit + quota   |
+--------------------+--------------------+
                     |
+--------------------v--------------------+
| Receipt + status + dashboard projection |
+-----------------------------------------+
```

Pilih **modular monolith**: satu aplikasi dan boundary modul yang jelas, satu sumber autoritatif per rekod. Elakkan microservices, lima runtime serentak atau dual-write ke dua database untuk data sama. Ini adaptasi prinsip Profile A repo (React/Vite + Postgres), dengan AWS/Redis baharu dikecualikan bagi memenuhi kos sifar. Bukan pelaksanaan literal seluruh profile skill.

## 4. Lima permukaan dan struktur route

Route berikut ialah sasaran yang dicadangkan; belum wujud.

| Permukaan | Route cadangan | Tujuan |
|---|---|---|
| Landing awam | `/`, `/products`, `/locations`, `/become-dealer`, `/help` | Discovery, jualan dan onboarding |
| Guided journeys | `/flows/:slug` | Pesanan, aduan, pendaftaran dan restock |
| Customer | `/customer/*` | Rekod dan komunikasi milik customer |
| Dealer B2B | `/customer/business/*` | Ejen/stokis yang mempunyai membership B2B |
| Staff | `/staff/*` | Tugas dan cawangan yang ditetapkan |
| Founder | `/founder/*` | Keputusan serta oversight dalam business scope |
| Developer | `/developer/*` | Diagnosis dan konfigurasi teknikal yang dibenarkan |

Audience bukan authorization role tunggal. Staff boleh menjadi crew, packing, supervisor atau finance operator. Seorang manusia boleh mempunyai beberapa membership sah dan memilih context; setiap request masih membawa resource scope yang disahkan server.

## 5. Landing page lengkap

### Kandungan dan conversion

- Hero jenama dengan satu CTA beli dan satu CTA ejen/stokis.
- Katalog produk daripada versi yang founder telah publish: nama, saiz, harga, stock availability, gambar dan maklumat produk yang disahkan.
- Cara penggunaan/resipi sebagai kandungan editorial yang diluluskan.
- Lokasi pickup/gerai serta waktu operasi dengan tarikh semakan; jangan paparkan waktu tidak disahkan.
- Kempen dengan validity, inventory rules dan terms; harga dikira server.
- Perjalanan menjadi reseller/stokis: tanggungjawab, jenis model dan application flow.
- FAQ, contact, polisi penghantaran/aduan serta permission bagi penggunaan data.
- Testimonial hanya dengan sumber/permission; tiada rating atau claim halal/kesihatan rekaan.
- QR entry pada booth, label botol, invoice dan pack ejen.

### Pelaksanaan yang efisien

Prerender/SSG kandungan awam untuk crawler, metadata/OG serta struktur produk yang sepadan dengan katalog published. Hero dan katalog ringan, responsive serta BM/English. Founder mengedit content draft dari cockpit; preview dan publish mempunyai version/audit. Staff tidak mempublish harga sendiri.

Gate: pengguna awam dapat membeli/mohon ejen tanpa melihat data dalaman. Harga final dan lokasi tidak bergantung pada content statik yang stale. Custom domain pilihan hanya apabila aset sedia ada atau belanja diluluskan.

## 6. Customer Portal — beli, jejak dan selesaikan isu

### Modul utama

1. **Shop & reorder:** katalog published, pack/quantity, alamat/pickup, order summary dan reorder dengan harga semasa.
2. **My orders:** timeline request, payment verification, packing, dispatch dan received. Status datang daripada rekod sebenar.
3. **Payment evidence:** arahan pembayaran yang disahkan, upload receipt, status pending verification. Screenshot bukan bukti pembayaran automatik.
4. **Help & complaints:** pilih own order, isu, batch jika tersedia, bukti dan submission receipt.
5. **Conversations:** mesej in-app dengan staff/owner, attachments yang dibenarkan dan status sebenar.
6. **Profile & consent:** alamat, preference notification, history permintaan dan kawalan akses.
7. **Membership/dealer:** customer boleh memohon B2B; kelulusan memberi scope tambahan yang tertentu.

Guest boleh browse dan menyediakan draft. Untuk rekod persendirian, gunakan login atau flow session grant minimum yang dibenarkan; order ID sahaja tidak membuktikan pemilikan. Guest tracking memakai token opaque, expiry dan resource scope yang minimum. PII tidak dimasukkan dalam URL atau mesej share.

Gate: customer A tidak dapat membaca order B walaupun mengubah URL/body. Public search tidak mendedahkan nombor telefon, alamat atau resit.

## 7. Staff Workspace — kerja harian yang fokus

### Modul utama

- **My shift:** tugas hari ini, assigned branch, SOP dan handoff.
- **Order queue:** pick, pack, QC dan dispatch dengan state transition yang dibenarkan.
- **Stock movements:** receive, transfer, count, damaged/quarantine dan adjustment dengan sebab.
- **Batch/QC:** pemeriksaan yang ditentukan oleh SOP, bukti dan sign-off supervisor apabila diperlukan.
- **Dispatch:** konsainan, cartons/bottles, batch, recipient, handoff proof dan exception.
- **Customer inbox:** isu assigned, context order, draft dan escalation; maklumat minimum untuk tugas.
- **Daily close:** sales/receipt evidence, variance dan laporan serahan; operator tidak menandakan bank cleared daripada screenshot sahaja.
- **Training:** SOP version, checklist dan acknowledgements.

Mobile-first: camera/QR entry sebagai shortcut, fallback input manual, target touch jelas dan last item tidak ditutup dock. QR mengenal pasti entity; server masih memeriksa kuasa actor. Offline hanya captures/drafts yang diberi label pending; stock reservation, pembayaran verified dan mutation kritikal memerlukan pengesahan server.

Gate: staff luar cawangan tidak membaca/ubah rekod bukan scope. Adjustment dan override mempunyai actor, reason dan audit.

## 8. Founder Cockpit — sambung kerja dalam konteks yang sama

### Modul utama

1. **Morning brief:** keadaan sumber, pesanan exception, stock risk, aduan dan keputusan tertunda.
2. **Decision inbox:** approve draft, stock adjustment, dealer application, kempen dan commercial exception.
3. **Business dashboard:** order value, received payment, fulfilled orders, stock, refund review dan dealer sell-through dengan denominator/freshness.
4. **Customer/Dealer CRM:** journey, last interaction, linked orders dan next task dalam scope.
5. **Inventory & production:** per lokasi, batch, ownership, quarantine, expiry apabila data tersedia, procurement/replenishment.
6. **Finance operations:** reconciliation, expenses, receivables, payout proposals dan variance. Bukan pensijilan accounting/statutory compliance.
7. **Agent/stokis oversight:** approval, supply, pricing version, performance, distribution coverage dan issues.
8. **Content studio:** katalog, campaign, landing content, template replies serta asset library dengan draft/preview/publish.
9. **Workspace tools:** tasks, calendar, dokumen dalaman, report builder dan export. Existing Google modules dipakai melalui adapter yang telah diuji.
10. **Agent Operations:** specialist, task lifecycle, handoff, routines dan evidence.
11. **People & SOP:** role assignment, shifts, approvals serta prosedur approved.
12. **Business settings:** price/pack, delivery, return, approval limit dan scope; perubahan versioned.

### Cara mengurangkan pertukaran aplikasi

Gunakan entity drawer universal: order → customer → receipt → complaint → task → draft → outcome. Founder boleh mencipta task, menyemak draft, menghasilkan laporan dan merekod keputusan dari drawer yang sama. Notifikasi membawa pengguna terus ke kerja yang perlu dilakukan. Search/command palette mengembalikan rekod mengikut permission.

Editor dokumen dalaman menyediakan block teks, table, checklist dan template untuk workflow ABANGCOLEK. Import/export Google/PDF/CSV ialah capability berasingan; ia tidak menjanjikan semua ciri editing Docs/Sheets/Canva tersedia dalam iframe. Provider apps yang melarang embed menggunakan API atau handoff yang jelas.

**Batas sebenar:** perbankan, OTP, OAuth, CAPTCHA serta WhatsApp tanpa API rasmi mungkin memerlukan app/takeover luar. Founder tetap mengurus rekod dan follow-up dalam cockpit, tetapi penghantaran WhatsApp manual tidak boleh didakwa berlaku dalam app. Sasaran ukur ialah kurang pertukaran dalam workflow terpilih; bukan janji menghapuskan semua sistem pihak ketiga.

## 9. Developer Console — sokongan teknikal terkawal

- Readiness setiap adapter: configured, authorized, reachable, capability tested, last success.
- Job/flow diagnostics dengan correlation ID, state, latency dan error category.
- Schema/version, release status, health dan feature flags.
- Quota, usage, retention dan kos tambahan yang disekat.
- Flow registry dengan draft/version/published/deprecated.
- Model capability probes menggunakan synthetic inputs.
- Fixture import hanya explicit demo/test environment; tiada seed sample ketika live fetch kosong.
- Export/backup verification dan recovery runbook.
- Redacted support bundles; PII dan secret tidak muncul dalam browser logs.

Developer tidak mendapat kuasa refund, commercial approval, melihat semua resit atau membuat role founder melalui console. Source-control/deployment changes menggunakan workflow review; console production tidak menawarkan arbitrary shell/script executor. Break-glass akses jika diperlukan mempunyai scope, expiry dan founder approval yang khusus.

## 10. Permission matrix ringkas

| Resource/tindakan | Public | Customer | Staff | Founder | Developer |
|---|---|---|---|---|---|
| Katalog published | Baca | Baca | Baca | Draft/publish jika capability | Diagnosis versi |
| Pesanan | Tiada rekod peribadi | Own | Assigned branch/task | Business scope | Redacted teknikal |
| Harga B2B | Tiada | Dealer grant sahaja | Ikut tugas | Commercial approval | Tiada override |
| Payment verification | Tiada | Submit bukti own | Finance capability | Approval dalam scope | Tiada |
| Complaint/JEV | Entry minimum | Own case | Assigned quality | Business oversight | Redacted probe |
| Stock adjustment | Tiada | Tiada; dealer own capture | Capability + scope | Approval jika policy | Tiada |
| Roles/permissions | Tiada | Tiada self-promote | Tiada self-promote | Grant melalui server policy | Tiada founder grant |
| Technical logs/flags | Tiada | Tiada | Minimum service status | Summary/authorized controls | Scoped |
| External send | Tiada | Own in-app submission | Explicit capability/policy | Explicit capability/policy | Test environment sahaja |

Canonical membership/resource predicates dikuatkuasakan backend/RLS. `user_metadata` dan localStorage tidak menjadi sumber authority. App metadata JWT juga perlu mengambil kira freshness/revocation; perubahan sensitif menyemak membership server semasa. RLS mesti mempunyai ownership/branch scope yang sebenar, bukan hanya authenticated. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 11. Flow Engine: pengalaman seperti WhatsApp Flows

### Strategi utama kos sifar

Bina **guided conversational web flows** dalam platform: soalan pendek, pilihan, branching, review screen, resume dan submission receipt. Customer membuka melalui landing, QR atau pautan yang dikongsi melalui WhatsApp. Founder/staff menerima submission dalam inbox ABANGCOLEK secara langsung.

Ini flow web milik projek. Ia bukan native UI WhatsApp Flows dan tidak memberikan akses membaca WhatsApp personal. Native WhatsApp adapter hanya dipertimbangkan selepas prerequisites, compatibility serta pricing sah disahkan. Laporan khusus: [08_WHATSAPP_FLOW_ZERO_COST.md](08_WHATSAPP_FLOW_ZERO_COST.md).

### Satu definisi, beberapa pengalaman

Kontrak `FlowDefinition` mempunyai id/version, audience, entry grants, steps, field validation, branching rules, completion intent dan data requirements. Renderer web membaca kontrak ini. Staff-assisted mode boleh mengisi bagi customer dengan actor/consent yang direkod. Native export kelak ialah compiler subset mengikut kemampuan Meta yang disahkan; tidak semua komponen web boleh dieksport.

Tiada arbitrary JavaScript/eval dalam flow schema. Price, stock, discount dan membership diperiksa server pada submission. Published definition immutable; session terikat versi. Perubahan harga/source menghasilkan review baharu sebelum submit. Final submit menggunakan idempotency key dan menghasilkan durable receipt; browser animation sahaja tidak menjadi proof.

### Flow awal

| Flow | Hasil | Penerima kerja |
|---|---|---|
| Beli produk | Order request dengan quote/version | Staff operasi |
| Reorder | Draft daripada order own, harga semasa | Staff operasi |
| Aduan produk | Case + evidence, tanpa keputusan punca automatik | Kualiti |
| Mohon ejen/stokis | Application + commercial review task | Founder/dealer manager |
| Restock dealer | Quote/order B2B + quantity/pack checks | Supply team |
| Bukti bayaran | Evidence pending verification | Finance operator |
| Terima penghantaran | Receipt/variance/damage evidence | Logistik |
| Daily close staff | Count, sales evidence dan variance | Supervisor |

### Idea yang menghubungkan fizikal dan digital

- QR booth membawa pickup context yang sah, tanpa membenarkan harga ditukar melalui URL.
- QR botol/batch membuka help/complaint dengan batch reference; public label tidak mengandungi data pembeli.
- QR invoice dealer membuka flow penerimaan/variance melalui scoped grant.
- Campaign link membawa attribution; server memeriksa campaign published dan validity.
- Saved draft boleh disambung pada peranti sama; cross-device resume memerlukan session authentication/scoped grant.
- “Tindakan seterusnya” menghubungkan flow selesai kepada staff queue serta notification in-app.

## 12. Messaging tanpa memaksa kos WhatsApp

Tiga capability berbeza dipaparkan dengan jujur:

1. **In-app inbox:** mesej dan submission antara customer/dealer/staff/founder dalam platform, persistence/permission/receipt sendiri.
2. **Manual WhatsApp handoff:** template/pautan membuka aplikasi rasmi, pengguna menghantar sendiri. Delivery/read status WhatsApp tidak disahkan oleh platform.
3. **Official API adapter:** webhook/delivery serta native flows apabila account dan quota/pricing telah disahkan; default off dalam pelan kos sifar.

Jangan menjadikan unofficial WhatsApp Web scraping atau session sharing sebagai asas reliability. Hermes gateway support juga tidak membuktikan official Cloud API access atau API percuma. Web flow completion dan WhatsApp message sent ialah dua event yang berbeza.

Quota zero-cost policy menyekat adapter yang memerlukan bayaran tanpa authorization belanja. Unknown billing dianggap unavailable untuk automation, bukan free. Bukti pricing semasa dan batas terdapat dalam laporan WhatsApp.

## 13. Agent dan stokis sebagai modul teras

Kajian khusus: [10_AGENT_STOKIS_BUSINESS_SYSTEM.md](10_AGENT_STOKIS_BUSINESS_SYSTEM.md).

### Cadangan struktur

- **Reseller/ejen:** beli stock untuk jual semula apabila model buy-resell diluluskan; scope orders/stock sendiri.
- **Stokis:** memegang inventory lebih besar dan menyokong replenishment dalam territory yang dipersetujui; lokasi bukan hak eksklusif automatik.
- **Dropship:** fulfillment HQ dengan attribution/referral terverifikasi; tidak dianggap memegang stock fizikal.
- **Konsainan:** ownership stock kekal pada consignor sehingga event yang ditetapkan policy; custody dan settlement direkod berasingan.

Satu portal dealer merangkumi application, approval, price list yang layak, restock, payment evidence, dispatch, receiving variance, batch trace, marketing assets dan statement. HQ menyemak readiness serta performance berasaskan sell-through/service, bukan bilangan orang direkrut.

MOQ, starter pack, margin, commission, credit, return allowance serta exclusivity ialah **commercial decisions belum disahkan**. Nilai dalam dokumen lama bercanggah; katalog/policy mesti founder-published sebelum digunapakai. Default kredit tidak diberi secara automatik. Pembelian awal tidak menjadi bukti revenue retail akhir.

Owner, custodian, physical location, available, reserved dan quarantine perlu dibezakan. Tiada kiraan stock berganda apabila HQ memindah barang kepada konsainan. Reorder recommendation menggunakan sell-through sah, replenishment lead time dan threshold approved; data tiada menghasilkan unknown.

## 14. Hermes, Grok Bot dan JEV dalam platform ini

| Rujukan | Peranan cadangan | Boundary |
|---|---|---|
| Hermes Agent | Calon runtime pilot untuk specialist dan skills/routines | Service berasingan pada hardware sedia ada; compatibility belum diuji |
| Grok Bot | Task owner, delegation dan handoff UX | Tidak dianggap API produk percuma/tersedia |
| Meta Muse | Goals/activity/artifacts/ideas serta permission boundary | Inspirasi architecture, bukan inherited security guarantee |
| OpenAI dots | Continuity, keputusan owner dan inspectability | Tiada subscription/produk baharu diwajibkan |
| DeepSeek Harness | Adapter/runtime alternatif dan capability lifecycle | Preview; isolation dan log policy perlu diuji |
| JEV projek | Classification/routing dan evidence status | Tidak memberi hak execution atau menentukan pembayaran sendiri |

Specialist awal: Operasi, Kualiti, Logistik, Dealer dan Workspace. Mula dengan satu read-only skill yang mempunyai fixture, owner/version dan output yang boleh disemak. Memory menyimpan SOP/preference approved dengan provenance; stock/price/payment sentiasa dibaca daripada business record.

Agent hanya melihat data/capability actor yang sah. Output kosong unknown; high confidence bukan authorization. Approval terikat target/payload/hash/expiry. Job lifecycle dan external receipt dipaparkan tanpa perlu menunjukkan internal chain-of-thought.

## 15. Stack kos sifar dan had yang nyata

### Baseline yang disyorkan

| Lapisan | Pilihan baseline | Syarat |
|---|---|---|
| Frontend | React/Vite/Tailwind sedia ada, public prerender, PWA | Reuse tokens; lazy load portals |
| Hosting statik | Cloudflare free deployment sebagai calon | Akaun/quota/access perlu disahkan; tiada deployment dalam pelan |
| Identity/data | Supabase sedia ada sebagai primary, selepas audit/migration | No paid upgrade; backup/export disediakan sendiri |
| Executor | Bun/Node adapter + Hermes pilot pada PC sedia ada | PC offline bermaksud execution local unavailable |
| Light API | Existing/local backend; Workers optional setelah compatibility | Jangan pindahkan Hermes heavy compute ke free Worker |
| Notifications | In-app terlebih dahulu; channel lain optional | Delivery/consent/quota sebenar |
| Files | Private storage sedia ada, compression dan retention | Bucket tidak public untuk receipt/evidence |
| Observability | Structured logs/correlation + built-in status | Retention berhad, export redacted |
| Payments | Arahan dan manual reconciliation approved | Tidak menjamin bank/payment rails bebas caj |
| AI inference | Provider/model percuma sedia ada yang diluluskan | Inventory/capability/quota diuji; keys tidak dibaca untuk plan |

Cloudflare menyatakan static assets percuma/unlimited; free dynamic Workers mempunyai limit request dan CPU. D1 free mempunyai read/write/storage allowance dan operasi boleh gagal apabila limit habis. Ini pilihan quota-bound, bukan compute tanpa batas. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

Supabase free menyatakan database 500 MB, file storage 1 GB dan 50,000 MAU; automatic backups tidak termasuk dan projek boleh paused selepas inactivity. Built-in SMTP ialah best-effort untuk non-production; public onboarding memerlukan delivery path sah, atau social OAuth yang configured tanpa bergantung pada OTP SMS. Akses akaun/projek sebenar belum diperiksa. [Pricing](https://supabase.com/pricing), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

**Keputusan:** kekalkan Supabase sebagai calon primary bagi reuse. D1 bukan database kedua yang di-sync serentak; ia alternatif storage adapter hanya selepas dependency serta migration cost dinilai. Redis/Kafka/Kubernetes/paid office suite tidak diperlukan untuk baseline.

### Quota policy cadangan

- 70% allowance: amaran developer/founder.
- 85%: kurangkan nonessential AI/refresh/background work.
- 100% atau usage unknown: sekat operasi channel berbayar/unsupported; tunjuk recovery dan manual path.
- Tiada paid fallback atau auto-upgrade.
- Export compact, file compression, pagination, caching dan incremental queries.
- Baseline usage diukur; angka policy di atas ialah threshold cadangan, bukan limit vendor.

Free tier masih boleh menghasilkan downtime. PWA read-only cache dan pending drafts menyokong continuity; ia tidak mengesahkan transaksi offline atau mengatasi kuota provider.

## 16. Shared records dan invariant

Kontrak domain cadangan, bukan SQL migration yang telah digunakan:

- Identity/membership: actor, business, branch, capabilities, active/revoked/version.
- Catalog/price: SKU, pack, approved version, applicability dan validity.
- Order/quote: customer/dealer reference, amount server-calculated, source version, state dan timestamps.
- Payment evidence/reconciliation: pending/reviewed/verified/rejected, verifier, source dan receipt reference.
- Inventory movement: owner, custodian, location, batch, quantity/unit, movement reason dan external reference.
- Complaint/evidence/JEV: linked order/batch, method, unknowns, investigator dan decision history.
- Task/action/execution: owner, scope, idempotency, approval, attempts, outcome dan receipt.
- Flow: immutable definition version, scoped session, draft, completion intent dan submission receipt.
- Conversation/artifact/content: subject/entity, access scope, version dan delivery/publish status.
- Dealer/territory/commercial policy: membership, ownership model, price version, earned benefit ledger dan exceptions.
- Marketing: campaign/revision, asset rights, research sources, channel grants, approval hash, publish attempt/receipt dan metric observations.
- JEV: question pack/rubric version, provider/method, state/evidence hash, assessment validity, uncertainty, human override reason dan evaluation outcome.

Invariants: no receipt→no persisted-success claim; no verified payment→no paid label; no authorised target→no execution; no physical proof→no verified root cause; no membership→no private records; no published price→no binding quote; no canonical inventory movement→no available stock change.

## 17. Tiga workflow demonstrasi lengkap

### A. Customer membeli dan staff fulfill

Landing → buy flow → server quote → customer submit → order request receipt → payment evidence pending → finance verify → staff pack/QC → dispatch → customer own timeline → receiving evidence. Founder boleh melihat exception serta menghasilkan laporan dari rekod sama.

### B. Aduan botol dan quality follow-up

Customer own order → complaint flow → batch/foto → JEV classification → unknown root cause → staff investigation → founder decision apabila policy memerlukan → draft preview → channel yang dibenarkan → receipt/history. Model tidak menyalahkan kurier/pembekal tanpa bukti.

### C. Stokis restock dan settle

Dealer approved → scoped price list → restock flow → pack/stock checks → quote version → approved payment terms → dispatch → receive/variance → ownership/movement update → statement. Founder menyemak sell-through dan working capital; ejen tidak mendapat akses kepada customer/stokis lain.

## 18. Pelaksanaan berfasa

| Fasa | Deliverable | Gate |
|---|---|---|
| 0 | Audit source/live-schema, canonical contract, remove false success/seed | No demo contamination; schema/persistence/roles verified |
| 1 | Identity/membership, route shells, public catalog projection | Direct API cross-user/branch denied; mock cannot grant access |
| 2 | Landing + customer buy/complaint flow + staff inbox | Durable submission/own records; quote validated server |
| 3 | Founder decision drawer + tasks/drafts/records | Satu complete outcome dengan audit dan permission |
| 4 | Dealer/stokis lifecycle + inventory/receiving | Ownership/custody/settlement reconcile |
| 5 | Worker, Hermes read-only pilot, routines, PWA | Restart/timeout/offline/conflict gates; quota no paid fallback |
| 6 | Content/workspace expansion + developer diagnostics | Redaction, publish/version, live route and performance proof |
| 7 | Marketing calendar, rights, approval dan manual export | Exact revision approval; no public confidential preview; no fake published badge |
| 8 | Optional Postiz pilot, Agent-Reach research dan dealer kits | Capacity/license/channel grants; read-only research; provider receipts; no paid fallback |
| Optional | Official native WhatsApp adapter | Prerequisites, pricing, allowed templates dan delivery diuji |

Pelan teknikal dengan paths, interfaces dan task tests: [2026-10-02-platform-expansion.md](../../../docs/superpowers/plans/2026-10-02-platform-expansion.md).

## 19. Acceptance dan ukuran kejayaan

- Public tidak membaca order/customer/JEV audit dalaman.
- Customer A tidak membaca B; dealer tidak self-upgrade price tier.
- Staff luar scope ditolak server; developer tidak approve refund.
- Cache cleared/partitioned pada identity change; private data tidak disimpan dalam shared public service-worker cache.
- Flow submit double-click/retry mempunyai satu outcome; stale price di-review semula.
- Receipt upload tidak menandakan paid; persistence failure bukan success.
- Inventory transfer/consignment tidak double-count; rejection/returns merekod sebab dan batch.
- Draft email tidak send; manual WhatsApp tidak mempunyai delivery badge palsu.
- Native pricing unknown tidak diaktifkan sebagai free automation.
- Worker restart/checkpoint/timeout dan backup restore dibuktikan.
- Mobile 320/375/768 dan desktop, focus/reduced-motion/light-dark/error states diperiksa.
- Landing claims/harga/produk berasaskan founder-published version.
- Marketing edit/account/media/time changes membatalkan approval; retries tidak menerbitkan duplicate post secara membuta tuli.
- Channel tanpa permission, unknown quota atau unsupported capability menawarkan manual export yang jelas.
- JEV invalid/empty output menjadi abstention; model estimate bukan verified physical fact atau authority untuk execute.

Kumpulkan baseline app switches, masa mencari bukti, waktu menutup issue, duplicate operations, sell-through, variance stock/payment dan quota utilisation. Sasaran selepas baseline; tiada revenue uplift atau uptime rekaan.

## 20. Keputusan JEV dan perkara founder perlu tetapkan

| Claim/keputusan | Status |
|---|---|
| Tema global/18 modul tersedia | VERIFIED_SOURCE + validasi UI terdahulu |
| Empat portal dan landing sudah siap | BELUM; dokumen ini plan sahaja |
| Mock role bukan real auth session | VERIFIED_SOURCE |
| Public RLS template semasa sesuai produksi | TIDAK DISYORKAN; live policies belum diperiksa |
| Native WhatsApp Flows unlimited/free | UNKNOWN/tidak boleh dijanjikan |
| Guided web flows boleh dibina tanpa subscription flow builder | INFERENCE engineering; hosting/runtime quota masih berkenaan |
| Semua founder work boleh berlaku tanpa sebarang app lain | Tidak boleh dijamin; channel/auth/bank boundaries dijelaskan |
| RM0 subscription baseline boleh dirancang | INFERENCE bersyarat free quota/hardware/akaun |

Founder sign-off diperlukan sebelum publish: katalog/harga/pack, stock ownership, dealer terms, refund/replacement policy, payment verification authority, wilayah, SOP QC, retention evidence, sender/channel dan allowed approval limits. Tiada terma ini diambil bulat-bulat daripada data contoh lama.

**Hasil sasaran:** customer membuat permintaan, staff melaksanakan tugas, founder membuat keputusan dan developer menyokong sistem—dalam platform yang sama, dengan flow, rekod dan outcome yang konsisten.

## 21. Marketing dan sosial media sebagai sebahagian operasi

Spec penuh: [11_MARKETING_SOCIAL_AUTOMATION_POSTIZ_AGENT_REACH.md](11_MARKETING_SOCIAL_AUTOMATION_POSTIZ_AGENT_REACH.md).

Marketing Workspace membawa Campaign Desk, Research Inbox, Content Studio, Asset Library, Calendar, Approval Inbox, Publishing Monitor, Dealer Kits dan Results. Founder menyambung brief → draft → approval → scheduling/export → evidence → attributed orders melalui entity yang sama. Staff mendapat tugas assigned; dealer melihat kit/account milik mereka; developer hanya diagnostics sanitized.

**Postiz** dinilai sebagai optional self-host publishing service dengan server adapter. Ia memerlukan runtime/database/Redis/Temporal dan configured developer apps bagi channel berkenaan. Lesen AGPL perlu dipatuhi sebelum deployment/fork. Baseline tidak mewajibkan Postiz Cloud, paid media generator atau host baharu. [Self-host documentation](https://docs.postiz.com/self-host/installation/overview), [license](https://github.com/gitroomhq/postiz-app/blob/main/LICENSE).

**Agent-Reach** dinilai sebagai optional capability layer bagi Hermes research. Mulakan public/authorized sources dan owner-supplied links; browser-session scopes memerlukan explicit opt-in. Research reading tidak memberikan publishing privilege atau hak menggunakan media. [Agent-Reach README](https://github.com/Panniantong/Agent-Reach/blob/main/docs/README_en.md).

ABANGCOLEK mempunyai approval enforcement sendiri: docs Postiz tidak menyediakan approved flag yang menyekat publishing. Approval mengikat content/media revision, account, time, offer dan scope; changes membatalkannya. Scheduled/accepted tidak dipaparkan sebagai published tanpa provider evidence. [Postiz approval workflow](https://docs.postiz.com/general/approvals).

Enam use cases: weekly campaign draft, stock-aware upcoming-post review, local dealer kit, booth/event pack, campaign-to-order measurement dan research-to-experiment loop. Tiada auto ad-spend, inbox scraping, unsupported social reply atau janji viral. Quota/provider failure mengekalkan manual export path dalam app.

## 22. JEV sebagai assessment layer merentas platform

Spec penuh: [12_JEV_PLATFORM_CAPABILITY_PLAN.md](12_JEV_PLATFORM_CAPABILITY_PLAN.md).

Gunakan **Choice** untuk routing/classification, **Score** untuk rubric priority/readiness dan **Noul** untuk bounded judgment bahawa sesuatu statement benar berdasarkan state yang diberikan. Soalan atomik dinilai terhadap evidence snapshot yang sama; deterministic code menggabungkan assessment dengan polisi bisnes. Output jenis selamat tidak menjamin fact betul, physical causation atau permission. [TypeSafe introduction](https://docs.typesafe.ai/introduction).

Current engine projek memanggil Gemini `generateContent`; ini emulation dan tidak membuktikan native Jev/non-autoregressive/sub50ms. Label method/provider secara eksplisit. Native TypeSafe API mempunyai pricing dan tidak diaktifkan sebagai baseline kos sifar tanpa entitlement percuma yang disahkan. [TypeSafe models](https://docs.typesafe.ai/models).

Question packs meliputi customer intent/complaint, staff QC/exception, dealer onboarding/restock evidence, founder decision readiness, marketing claim/rights/brand fit dan developer runtime triage. Gunakan 7 dimensions sedia ada untuk business issues; jangan memaksa marketing/security events ke taxonomi aduan yang tidak sesuai. Tambah packs berversi dengan migration contract dan tests.

JEV UX memaparkan **apa diketahui, evidence apa, apa belum pasti dan siapa perlu bertindak**. Staff/dealer mendapat task scope; founder boleh drill down evidence, approve atau override dengan sebab. Customer mendapat status/resolution yang relevan, bukan internal blame/probability dump. Developer melihat latency/invalid/abstention/drift mengikut provider dan pack tanpa private payload.

Rules tetap: empty/invalid output abstains; low evidence tidak menjadi high confidence; no model-only verified root cause; no model-only refund, stock write, tier promotion atau publish. Confidence thresholds dan rubrics dipilih melalui labeled BM/English test set serta cost-of-error, bukan nombor global rekaan. Assessment/history disimpan durable dengan provenance dan privacy scope; compaction tidak membuang consent, price version atau evidence links.

**JEV dalam laporan research ini ialah semakan ledger manual.** Native Jev/Gemini inference, calibration dan benchmark platform belum dijalankan. Semua capability tambahan memerlukan tests serta runtime proof pada execution.
