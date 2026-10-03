---
title: "JEV untuk seluruh platform ABANGCOLEK: keputusan bertipe, bukti dan tindakan terkawal"
document_id: "ABANGCOLEK-JEV-PLATFORM-2026-10-02"
version: "1.0.0"
reviewed_on: "2026-10-02"
language: "Bahasa Melayu / Technical English"
status: "RESEARCH_AND_PROPOSED_PLAN"
execution_status: "DOCUMENT_ONLY_NO_JEV_API_CALLS"
---

# JEV untuk seluruh platform ABANGCOLEK

## 1. Keputusan utama

Gunakan JEV sebagai lapisan **penilaian semantik bertipe** yang membantu setiap ruang kerja: landing page, customer, staff, founder, developer, ejen/stokis dan marketing. Pelaksanaan yang dicadangkan menghubungkan penilaian kepada fakta perniagaan, polisi, manusia yang bertanggungjawab dan bukti tindakan.

Hasil yang dicari ialah founder dapat menjawab lima perkara dari satu skrin: **apa berlaku, bukti apa tersedia, perkara mana belum diketahui, siapa perlu bertindak, dan tindakan mana benar-benar selesai**. JEV boleh membantu mengatur dan menilai konteks tersebut; status pembayaran, baki stok, hak akses, keputusan pemulangan wang dan penerbitan sosial media tetap disahkan oleh sistem domain dan pelaksana yang berautoriti.

Dokumen ini ialah pelan, bukan pengumuman integrasi siap. Pemeriksaan dibuat terhadap fail projek dan dokumentasi rasmi. Tiada panggilan model JEV, pemasangan SDK, pemindahan pangkalan data, penghantaran emel atau penerbitan post dilaksanakan dalam penyediaan dokumen ini.

Dokumen berkaitan:

- [Masterplan platform](09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md).
- [Flow pelanggan dan WhatsApp](08_WHATSAPP_FLOW_ZERO_COST.md).
- [Sistem ejen dan stokis](10_AGENT_STOKIS_BUSINESS_SYSTEM.md).
- [Marketing, Postiz dan Agent-Reach](11_MARKETING_SOCIAL_AUTOMATION_POSTIZ_AGENT_REACH.md).
- [Pelan pelaksanaan teknikal](../../../docs/superpowers/plans/2026-10-02-platform-expansion.md).

## 2. Tiga lapisan yang mesti dibezakan

| Lapisan | Apa sebenarnya | Status dan implikasi |
| --- | --- | --- |
| Native Jev TypeSafe | Model System One rasmi yang menjawab soalan bertipe | Belum disahkan tersedia dalam runtime projek; memerlukan integrasi, kelayakan akaun dan polisi kos |
| JEV emulation dalam projek | `jevEngine.ts` meminta Gemini menghasilkan JSON lalu memparse respons | Wujud dalam sumber; kualiti, latency, biaya dan calibration tidak boleh dianggap sama seperti native Jev |
| JEV-inspired local rules | Kod deterministik untuk taxonomy, validation, policy dan routing konservatif | Baseline cadangan tanpa panggilan API; rules tidak menghasilkan probabiliti model yang terkalibrasi |

**Pilihan kos tambahan sifar:** jalankan domain rules dan semakan manual dahulu. Adapter generatif hanya boleh menggunakan provider sedia ada yang telah disahkan layak dan tidak menambah belanja; tandakan hasilnya `EMULATED`. Native Jev ialah adapter pilihan yang **ditutup secara lalai** sehingga terdapat entitlement percuma yang boleh dibuktikan atau kelulusan pengguna untuk belanja tambahan.

Dokumentasi rasmi pada tarikh semakan menyenaraikan native `jev-1.13.0` dengan caj input token. Halaman yang sama menyatakan inputnya text-only, sokongan bahasa perlu diuji dan alias model boleh berpindah versi. Oleh itu, native Jev tidak dijanjikan percuma dan tidak dianggap dapat membaca gambar atau video terus. [TypeSafe Models](https://docs.typesafe.ai/models).

## 3. Features rasmi yang boleh dimanfaatkan

### 3.1 Choice: keputusan kategori yang jelas

Choice memilih satu pilihan daripada set yang ditakrifkan dan memulangkan pilihan, distribution serta confidence. Ia sesuai untuk intent, jabatan, jenis aduan, kategori kandungan dan calon SOP. Tambah `UNKNOWN`, `OTHER` atau `NOT_APPLICABLE` apabila domain mungkin tidak meliputi input. [Choice](https://docs.typesafe.ai/primitives/choice).

**Cadangan ABANGCOLEK:** kekalkan tujuh dimensi sedia ada sebagai taxonomy operasi, tetapi version setiap taxonomy dan asingkan dimensi yang tidak berkaitan. Permohonan ejen tidak memerlukan root-cause packaging; sistem hendaklah memaparkannya sebagai tidak terpakai.

### 3.2 Score: rubric deskriptif, bukan angka rekaan

Score rasmi menilai aras rubric yang tersusun; untuk N aras, kedudukan mentah berada pada `0..N-1`, dan output turut membawa probabilities, confidence dan legend. Skor boleh berada di antara aras. Jika UI mahu `1..5` atau `0..100`, aplikasi mesti menyimpan mapping tersebut dengan jelas. [Score](https://docs.typesafe.ai/primitives/score).

**Cadangan ABANGCOLEK:** rubric berasingan untuk urgency aduan, kesediaan kandungan, kesesuaian SOP dan kekuatan sokongan sumber. Paparkan nama rubric serta versinya. Skor kesiapsiagaan ejen ialah ringkasan rubric, bukan ramalan pendapatan atau kelulusan automatik.

### 3.3 Noul: satu proposition pada satu masa

Noul rasmi memulangkan `noul` pada `0..1`, iaitu kebarangkalian jawapan ya. Ia tidak membawa medan confidence berasingan. Soalan seperti “Adakah pelanggan meminta manusia?” dan “Adakah pelanggan meminta refund?” hendaklah dipisahkan. Nilai tengah boleh dihantar untuk semakan. [Noul](https://docs.typesafe.ai/primitives/noul).

**Cadangan ABANGCOLEK:** gunakan Noul untuk isyarat semantik seperti permintaan callback, dakwaan kualiti, kandungan menyebut harga dan claim kesihatan. Kewujudan dokumen wajib, tarikh tamat promosi, hak penerbitan serta stok cukup diperiksa menggunakan kod dan rekod berautoriti.

### 3.4 Atomic questions dan batching

Dokumentasi rasmi menyatakan soalan dalam satu permintaan dinilai secara bebas terhadap state yang sama. Pecahkan keputusan besar kepada soalan atomik kemudian gabungkan jawapan dalam kod. Jangan bina soalan kedua yang mengandaikan ia boleh membaca jawapan soalan pertama dalam batch yang sama. [TypeSafe Introduction](https://docs.typesafe.ai/introduction), [Speculative Fan-Out](https://docs.typesafe.ai/patterns/fan-out).

Contoh set soalan untuk aduan: intent, issue class, urgency, permintaan manusia dan permintaan pemulangan. Kod menentukan jawapan mana relevan selepas batch selesai. Batching bukan tiket untuk menambah soalan tidak berkaitan secara tidak terbatas; hanya kumpulkan yang diperlukan oleh workflow dan quota semasa.

### 3.5 Confidence, fan-out, composite score dan routing

Confidence Choice/Score diringkaskan daripada distribution, bukannya nama lain untuk probability pilihan tertinggi. Threshold perlu mengikuti risiko dan prestasi domain. [Confidence](https://docs.typesafe.ai/confidence).

Untuk platform ini, manfaatkan empat pola: fan-out bagi triage, confidence routing untuk eskalasi, composite scoring bagi keutamaan yang boleh dijelaskan dan intent routing kepada handler yang tepat. Semua pemberat, dependency dan cabang operasi ditentukan dalam kod. [Patterns](https://docs.typesafe.ai/patterns).

## 4. Audit sumber JEV sedia ada

Lokasi utama: `src/services/jevEngine.ts`, `src/services/gemini.ts`, `src/App.tsx`, `src/components/AbangColekDiscoveryView.tsx`.

| Bukti sumber | Penemuan | Pembaikan yang dicadangkan |
| --- | --- | --- |
| `jevEngine.ts:146–157` | Model generatif menghasilkan JSON; komen mendakwa non-autoregressive System One | Label adapter `GENERATIVE_EMULATION`; betulkan dokumentasi sebelum menyamakan dengan native |
| `jevEngine.ts:168–194` | Default confidence tinggi dan default kategori complaint/leakage boleh wujud walaupun respons `{}` | Missing/invalid payload menghasilkan `ABSTAIN` bersama sebab; jangan fallback kepada aduan confident |
| `jevEngine.ts:169–194` | Probability hanya satu key, kadangkala key asal tidak sah sedangkan value telah difallback | Validate set pilihan dan distribution lengkap bagi native; emulation tanpa distribution sah tidak mendapat confidence native |
| `jevEngine.ts:196–202` | Root cause leakage dipaksa `UNDETERMINED`, tetapi probability sentiasa `UNDETERMINED: 0.98` walau kategori lain mungkin `VERIFIED` | Pisahkan `modelProposal` daripada `policyDecision`; jangan rekaan confidence untuk polisi |
| `jevEngine.ts:206–214` | Score 1..5 tiada distribution/legend; label boleh tidak selaras dengan score | Rubric versioned dan mapping paparan; hasil tidak konsisten ditolak atau disemak |
| `jevEngine.ts:216–226` | Boolean Noul menggunakan nilai mentah sedangkan probability diclamp berasingan | Boolean hanya diterbitkan daripada nilai tervalidasi dan threshold polisi; invalid menjadi tidak diketahui |
| `jevEngine.ts:235–276` | Regex fallback memberi confidence tinggi dan eligibility refund berdasarkan kata kunci bocor | Simpan `RULE_HINT` tanpa probabiliti rekaan; refund ialah policy workflow yang memerlukan bukti dan hak akses |
| `jevEngine.ts:284–366` | Fungsi eksekusi boleh mencipta task/event/sheet dan menghantar Gmail kepada penerima tetap | Gunakan action preview, penerima sah, OAuth scope, approval, idempotency dan receipt; beza draft dengan sent |
| `jevEngine.ts:363–383` | History localStorage hanya 50 penilaian; kegagalan simpan tidak menyekat pulangan hasil | Repository berpartition pengguna/workspace dengan status penyimpanan nyata; queue local tidak dikatakan tersimpan pusat |
| `jevEngine.ts:447` dan validator Hermes selepasnya | Nama/kategori/description divalidasi dan disimpan ke localStorage | Ini belum membuktikan pendaftaran skill kepada proses Hermes sebenar; adapter runtime dan capability receipt diperlukan |
| `App.tsx:462–469` | Chat kini mempunyai butang `hasJev` membuka Discovery | Dakwaan laporan lama bahawa `hasJev` tiada sepenuhnya sudah tidak tepat pada sumber semasa; tambah kad hasil inline berdasarkan `jevData` dan navigation berasaskan record ID |

Penemuan di atas ialah bukti sumber. Panggilan provider, persistensi berpusat, polisi pangkalan data hidup dan penghantaran sebenar belum diuji dalam kerja dokumentasi ini.

## 5. Skills JEV: guna tujuan, sahkan dakwaan

Skill projek yang dibaca untuk pelan ini:

| Skill tempatan dalam `skills/jev-core/` | Penggunaan cadangan |
| --- | --- |
| `agentic-levels/jev-advanced-use-cases/SKILL.md` | Pecahan use case dan pemilihan keputusan semantik yang bernilai |
| `dev-workflow/jev-review/SKILL.md` | Triage perubahan kod, risiko schema dan invariant sebelum semakan manusia |
| `context-and-memory/fast-jev-compaction/SKILL.md` | Checkpoint state berkaitan task tanpa membuang approval atau bukti |
| `context-and-memory/winnow/SKILL.md` | Singkir konteks lapuk daripada working set sambil mengekalkan audit asal |
| `context-and-memory/semdecide/SKILL.md` | Routing intent kategori terkawal |
| `build-and-judge/json-render/SKILL.md` | Render typed assessment kepada komponen UI yang diizinkan |
| `build-and-judge/canny/SKILL.md` | Semakan penerimaan berasaskan bukti; test runner dan pengesahan manusia tetap menentukan gate |

Fail skill ini ringkas dan menggunakan protokol hampir sama. Frasa seperti “sub-50ms”, “guarantees”, Score `0..1` dan input multimodal tidak membuktikan fungsi runtime, calibration atau kesesuaian model rasmi. Pelan menggunakan tujuan skill, lalu menyemak kemampuan terhadap dokumentasi provider dan sumber projek. Jangan tampilkan semua 22 skill JEV sebagai 22 integrasi yang sudah berjalan.

## 6. Seni bina cadangan

```text
+---------------------------------------+
| Landing / Customer / Staff / Founder   |
| Developer / Dealer / Marketing         |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| State builder                         |
| scope + source IDs + facts + revision  |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| Question registry + evaluator adapter |
| local rules / emulated / native opt-in |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| Result validator + abstention         |
| schema / provenance / freshness       |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| Policy engine + permissions           |
| read / draft / review / block          |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| Preview + authorized approval         |
| canonical price / stock / recipient   |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
| Domain executor + verified receipt    |
| idempotency + audit + reconciliation  |
+---------------------------------------+
```

Evaluator tidak menyimpan service key dalam browser. State builder hanya mengambil rekod yang boleh diakses actor semasa. Approval memerlukan versi payload yang sama dengan yang dilaksanakan; perubahan kandungan, akaun, penerima, harga atau stok boleh membatalkan approval lama.

## 7. Kontrak yang perlu direka sebelum integrasi

Kontrak berikut ialah schema platform yang dicadangkan, bukan signature SDK TypeSafe.

| Rekod | Medan minimum dan tujuan |
| --- | --- |
| `JevQuestionDefinition` | `id`, `version`, `primitive`, `instructions`, `criteria`, `scope`, `risk`, `rubricVersion`, `requiredEvidence`, `owner` |
| `JevStateSnapshot` | `id`, `workspaceId`, `actorId`, `entityId`, `entityRevision`, `sourceRefs`, `observedAt`, `expiresAt`, `redactionVersion`, `payloadHash` |
| `JevAssessment` | `id`, `stateId`, `questionSetVersion`, `providerMode`, `actualModelVersion`, `status`, `answers`, `validationErrors`, `latencyMs`, `usage`, `createdAt` |
| `JevPolicyDecision` | `assessmentId`, `policyVersion`, `outcome`, `reasonCodes`, `blockingEvidence`, `requiredApproverRole`, `nextStep` |
| `JevActionPreview` | `id`, `decisionId`, `operation`, `targetEntity`, `recipientOrAccount`, `payloadHash`, `entityRevision`, `expiresAt`, `approvalStatus` |
| `JevExecutionReceipt` | `requestId`, `previewId`, `operation`, `status`, `providerObjectId`, `confirmedAt`, `evidenceRefs`, `retryDisposition` |

Assessment status: `VALID`, `ABSTAIN`, `INVALID`, `UNAVAILABLE`, `STALE`. Policy outcome: `READ_ONLY`, `DRAFT`, `REVIEW_REQUIRED`, `BLOCKED`, `APPROVED_FOR_EXECUTION`. Receipt status: `QUEUED`, `CONFIRMED`, `FAILED`, `UNKNOWN`.

`UNKNOWN` receipt bermakna outcome belum dibuktikan; jangan ulang side effect secara membuta tuli. Rekod `usage` atau probability yang provider tidak sediakan hendaklah `null`/tidak tersedia dengan penjelasan, bukan angka yang direka. State hash membolehkan deduplication tetapi bukan bukti kebenaran fakta.

## 8. Penggunaan mengikut audience dan modul

| Audience / modul | Choice | Score | Noul | Polisi dan hasil yang dapat dilihat |
| --- | --- | --- | --- | --- |
| Landing concierge | intent produk/lokasi/ejen/bantuan | Kesesuaian passage FAQ | Adakah sumber yang dibekalkan menyokong jawapan? | Tunjuk FAQ/source atau flow sesuai; tiada invent stok/harga |
| Customer order flow | Pickup/delivery/query intent | Kejelasan isu bantuan | Meminta staff manusia | Harga, jumlah dan eligibility checkout tetap dikira domain service |
| Customer complaint | Issue category dan desired resolution | Urgency berdasarkan rubric | Menyebut gejala keselamatan / meminta refund | Tiket + evidence checklist; manusia semak safety dan refund |
| Staff shift inbox | Production/QC/packing/dispatch | Urgency task semantik | Aduan berulang disebut | Queue mengikut branch dan assignment; completion perlukan checklist/receipt |
| Staff QC | Jenis kecacatan dilaporkan | Kekuatan deskripsi bukti | Laporan menyebut seal bocor | Quarantine batch melalui polisi; bukan infer punca fizikal daripada teks |
| Founder briefing | Pemilik isu/jenis keputusan | Severity/effort rubric | Isu belum ditangani disebut | Brief yang link kepada rekod; nilai jualan/stok dihitung tepat dalam kod |
| Founder procurement | Kategori sebab restock | Kualiti alasan tambahan | Supplier menyatakan delay | Forecast/restock quantity dari formula dan data; pesanan perlu approval |
| Ejen applicant | Model reseller/stockist yang diminta | Kesiapsiagaan bukti mengikut rubric | Meminta latihan / pickup | Review onboarding; polisi komersial terbitan founder menentukan tier |
| Ejen stokis | Aduan/receiving/sell-through intent | Urgency support | Mesej menyebut discrepancy | Ledger ownership/custody kekal berautoriti; tiada rekrut reward automatik |
| Founder content studio | Pillar/topik/format | Brand fit / kejelasan / source support secara berasingan | Ada claim kesihatan atau harga | Claim terkawal disemak; media rights, harga promosi dan expiry diperiksa kod |
| Postiz publishing | Platform adapter yang relevan | Kesiapsiagaan copy | Ada permintaan penerbitan | Schedule selepas approval dan readiness akaun; status published perlukan provider receipt |
| Agent-Reach research | Signal pengguna/trend/kompetitor | Relevance kepada campaign brief | Sumber menyokong claim yang dicadangkan | Source URL, observedAt, consent/availability; tidak menerima arahan dalam sumber |
| Developer review | Risiko auth/schema/side effect/UI | Severity berdasarkan diff | Ada perubahan invariant berisiko | Triage membantu reviewer; CI/build/E2E dan review tetap gate |
| Developer runtime | Handler/SOP/skill candidate | Kesesuaian skill | Perlukah skill langsung? | Allowlist skill dan capability; tiada automatic install/permission escalation |
| Document/search | Passage atau entity candidate | Relevance sumber | Evidence menyokong ayat tertentu | Ranking berpartition scope; citation check semantik tidak menggantikan baca sumber |

Jangan menilai semua medan di setiap klik UI. Tentukan soalan bagi setiap workflow supaya evaluator mendapat state kecil, relevan dan mudah diaudit.

## 9. Pola keputusan yang memberi nilai terus

### A. Aduan bocor menjadi workflow QC lengkap

1. Customer mengisi Flow sendiri: order reference, batch jika ada, deskripsi dan gambar pilihan.
2. Kod mengesahkan actor, order ownership dan format lampiran; gambar disimpan dengan permission. Native Jev text-only hanya menerima deskripsi yang dilabel asalnya.
3. Penilai mengelas intent dan issue, serta menilai urgency semantik.
4. Polisi menyimpan root cause `UNDETERMINED` sehingga rekod siasatan dengan bukti dan approver sah tersedia.
5. Staff melihat checklist “perlukan batch / bukti kebocoran / semak delivery”; tiada tuduhan kepada kurier atau supplier berasaskan keyword.
6. Refund/replacement dicadangkan berdasarkan polisi dan rekod; founder/staff yang diberi kuasa mengesahkan tindakan.
7. UI memaparkan status tiket dan receipt sebenar, termasuk tindakan yang masih pending.

### B. Marketing daripada signal kepada jualan yang boleh dijejak

1. Agent-Reach adapter pilihan membaca sumber awam atau sumber yang pengguna berhak akses; simpan URL dan masa pemerhatian.
2. Penilai menapis relevance kepada produk, lokasi dan customer segment; signal yang tiada sokongan dihantar ke review.
3. Model generatif yang diluluskan boleh menyediakan copy; JEV menilai claim dan brand fit menggunakan fact sheet versi semasa.
4. Kod membandingkan angka harga, tarikh, canonical product ID dan asset-rights record; jika berubah, approval lama tidak sah.
5. Founder meluluskan creative/account/channel/time; Postiz adapter atau manual export menjalankan tindakan yang dibenarkan.
6. UTM/campaign ID menghubungkan flow submission dan order sah. Sistem membezakan attribution yang dapat dilihat dengan sebab sebenar pertambahan jualan yang belum dibuktikan.

### C. Dealer restock tanpa tekaan autonomi

Kod mengira inventory position dan reorder berdasarkan stok boleh jual, allocation, inbound, lead time dan polisi buffer. JEV boleh mengelas nota stokis seperti “event hujung minggu” atau “penghantaran tertangguh” sebagai konteks untuk founder. Penilai tidak menentukan baki stok atau meluluskan kredit/pesanan berdasarkan confidence.

### D. Founder daily briefing yang boleh disiasat

Ringkasan menggabungkan KPI daripada query domain yang sah, tiga isu paling memerlukan tindakan, evidence yang kurang dan suggestion SOP. Klik mana-mana card membuka sumber, keputusan polisi, approver dan receipt. Apabila data lama, paparkan masa kemas kini serta sebab; jangan menghasilkan “semua berjalan lancar” daripada response kosong.

## 10. Threshold dan uncertainty yang jujur

Tiada threshold global untuk seluruh platform. Bentuk tiga kelas policy:

| Kelas risiko | Contoh | Pendekatan |
| --- | --- | --- |
| Boleh pulih, read-only | Routing FAQ atau cadangan tab | Selepas validation dan ujian domain, confidence memadai boleh memilih paparan; sediakan laluan pembetulan |
| Operasi dalaman | Triage task atau draf tindakan | Confidence sederhana atau evidence kurang menghasilkan review/draft; execution memerlukan permission dan entity revision |
| Komersial/luaran/sensitif | Refund, publish, email, kredit, status pembayaran, pengambilan staff | Evidence dan polisi deterministik wajib; approval manusia serta receipt tetap diperlukan walaupun model sangat confident |

Untuk Noul, reka ambang ya dan tidak dengan zon review di tengah; nombor perlu ditune pada dataset domain. Threshold pada Choice tidak dipindah terus ke Noul. Probability bukan ukuran sah hak akses. Ketiadaan sumber penting menghasilkan `ABSTAIN` walaupun model memberikan confidence tinggi.

Untuk local regex dan rule hints, UI menunjukkan sebab rule serta batasannya. Jangan memaparkan `98% yakin` tanpa kaedah probabiliti yang sah. Untuk emulation, confidence self-reported ditandakan jelas dan tidak menjadi trigger execution berisiko.

## 11. Composite scoring yang telus

Cadangkan queue ranking berdasarkan faktor yang terasing: severity semantik, deadline yang dikira kod, bilangan order/batch terjejas yang disahkan, freshness evidence dan ownership. Formula, pemberat dan denominator dicatat dalam `policyVersion`.

Rules penting:

- Evidence wajib yang hilang tidak ditutup dengan purata score faktor lain.
- Isu safety mendapat review priority melalui policy, bukan sistem berpura-pura telah mendiagnosis bahaya.
- Skor tidak berkaitan tidak diisi sifar lalu merendahkan result; tandakan `NOT_APPLICABLE`.
- Jangan gandakan pengiraan signal yang sama di beberapa faktor.
- Ranking memberi susunan kerja; ia tidak mengubah rekod pembayaran, eligibility refund atau kuasa approver.

## 12. Retrieval, compaction dan skill routing

Gunakan indexed search/filter deterministik dahulu untuk mendapat calon SOP dan rekod dalam scope actor; JEV boleh menilai relevance bagi shortlist. Source ID/version mesti dibawa ke jawapan. Hasil citation check ialah sokongan semantik yang perlu boleh disemak terhadap petikan sumber, bukan jaminan kebenaran dunia sebenar. [Double-checking Citations](https://docs.typesafe.ai/cookbooks/citation_check).

Checkpoint compaction dicadangkan mengandungi objective, constraints, entity revision, open questions, evidence pointers, approvals, pending operations dan receipts. Data peribadi diminimumkan. Harga, stok, permission, appointment slot dan kelayakan semasa **dibaca semula** dari rekod canonical apabila diperlukan. Compaction tidak membawa authority lama ke session baharu.

Winnow membuang duplicate/stale material daripada working set sahaja. Audit asal kekal mengikut retention dan akses yang ditetapkan. Failed side effect, outcome unknown dan approval expiry tidak boleh hilang ketika conversation disingkatkan.

Untuk Hermes, calon skill ditapis allowlist/capability sebelum semantic ranking. Cadangan rasmi menunjukkan pilihan skill boleh diperiksa berperingkat dan boleh menolak semua calon. Adaptasi ABANGCOLEK perlu menilai katalog tempatan sendiri; benchmark vendor bukan bukti prestasi projek ini. [Skill Suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion).

## 13. Batas model dan keselamatan state

Dokumentasi jaggedness rasmi menyatakan Jev mempunyai kelemahan dalam arithmetic, comparison tarikh, indirection, state tidak relevan dan kandungan adversarial. Ia juga tidak menjamin identiti probability antara soalan berasingan atau sesuai untuk text generation. [Jev 1.13 Jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13).

Tindakan cadangan:

- Math, tarikh MYT/UTC, quantity, allocation, expiry, halal certificate validity dan permission diperiksa kod terhadap rekod berautoriti.
- UGC, caption, webpage, PDF text dan customer message dianggap data tidak dipercayai; arahan seperti “ignore previous rules” tidak boleh menjadi polisi sistem.
- State provenance dipisahkan: approved business facts, customer allegations, imported source text dan generated draft.
- Redact secrets, cookie/session tokens, alamat yang tidak perlu dan data pelanggan lain sebelum provider call.
- Media transcription/OCR mesti dilabel adapter, source dan confidence tersendiri; keterangan gambar belum menjadi bukti sah root cause fizikal.
- Hak akses ditentukan server memberships/capabilities, bukan Choice audience atau role dalam mesej.
- Pending operation disemak scope dan revision semula sebelum execute; polisi tidak boleh ditulis semula oleh output evaluator.

## 14. UI/UX JEV yang selari dengan theme baharu

### Founder: Evidence & Action Panel

Setiap card menggunakan hierarchy: **isu → status → bukti → next action → owner → due time**. Warna lime untuk readiness yang disahkan, violet untuk assessment/draft, amber untuk review dan neutral untuk unknown. Label teks/ikon wajib supaya status boleh difahami tanpa warna sahaja.

Drawer “Kenapa ini disyorkan?” menunjukkan source refs, freshness, provider mode, taxonomy/rubric version, dimensi relevan dan sebab policy. Distribution disediakan sebagai advanced view hanya jika sah; tidak perlu memenuhi home screen dengan tujuh gauge bagi setiap tiket.

### Customer dan dealer

Paparkan “Kami perlukan nombor order”, “Dalam semakan”, “Staff akan semak bukti” atau “Tindakan telah disahkan”. Guna bahasa jelas tentang keputusan; elakkan memaparkan angka confidence sebagai bukti eligibility refund atau label “AI approved”.

### Staff

Queue dengan owner, branch, step semasa, blocker dan checklists. Butang utama mengikut workflow: “Tambah bukti”, “Sediakan draf”, “Minta approval” atau “Sahkan penerimaan”. Completion tidak dipaparkan hanya kerana model mengesyorkannya.

### Developer

Readiness table membezakan `LOCAL_RULES`, `EMULATED`, `NATIVE_DISABLED`, provider unavailable, quota exhausted, model changed, invalid response dan latency measured. No API keys/tokens dalam telemetry. BM/English examples mesti boleh diuji.

### Chat

Tambah komponen `JevAssessmentCard` yang render data tervalidasi daripada `jevData`, buka record yang sama dengan ID dan tidak sekadar melompat ke simulator umum. Komponen allowlist menerima schema sahaja; jangan jalankan HTML atau executable code daripada evaluator. Kad masih boleh membaca assessment ketika provider offline, sambil menandakan freshness.

## 15. Eval dan TDD sebelum automation

Dataset hendaklah dibina daripada contoh yang pengguna berhak gunakan, dianonimkan, dipisahkan kepada calibration dan held-out evaluation. Test fixtures sintetik dibenarkan **sebagai fixtures berlabel**, tidak dimasukkan sebagai order, customer atau hasil perniagaan sebenar. Reviewer domain merekod disagreements dan label unknown.

### Kes wajib

| Kategori | Contoh test | Kriteria lulus |
| --- | --- | --- |
| Payload | `{}`, malformed JSON, partial, invalid enum, string boolean, null, NaN/out-of-range | Invalid/abstain; tiada confident default atau side effect |
| Distribution | Missing options, illegal keys, negative values, jumlah tidak sah, value mismatch | Native result ditolak jika melanggar kontrak; emulation dikenal pasti |
| Semantik BM | Slang “tak bocor”, “bukan nak refund”, “nak jadi stokis”, ayat bercampur English | Nilai error dan abstention dilaporkan ikut kelas; tiada substring false assurance |
| Domain | Root cause belum disiasat, stale price, batch tidak diketahui, stok reserved | Evidence gate dipatuhi; polisi tidak ditumbangkan confidence |
| Scope | Dealer A cuba order Dealer B, staff branch lain, metadata role spoof | Server menolak akses dan tiada data bocor ke evaluator |
| Approval | Payload/recipient/media/account berubah selepas approval | Approval lama tidak boleh execute |
| Eksekusi | Timeout selepas request diterima, duplicate click/retry | Outcome unknown direconcile; side effect tidak digandakan |
| Marketing | Claim kesihatan tanpa bukti, promosi expired, hak UGC tiada, provider queued | Review/block sesuai; queued tidak dilabel published |
| Context | Compaction task belum selesai, source injection, stale receipt | Pending/unknown/constraint dikekalkan; imported instruction tidak jadi policy |
| UI | Keyboard, mobile, empty/error/loading, longtext, theme | Status dan action boleh dicapai; tiada overlap atau angka confidence palsu |

Metrik: confusion matrix per dimension, precision/recall label berisiko, abstention rate, coverage pada threshold, false escalation, human override, source-support disagreement, duplicate execution, latency p50/p95 dan invalid-response rate. Calibration probability dinilai dengan metrik sesuai seperti Brier score bagi output yang benar-benar probabilistik; jangan uji self-reported emulation seolah-olah native calibrated.

Gate sebelum live publish/refund/send: tiada kebocoran scope atau execution tanpa approval dalam suite kritikal, domain owner menerima hasil held-out evaluation dan workflow mempunyai rollback/reconciliation yang terbukti. Sasaran coverage 80%+ merujuk logic penting yang dipersetujui, bukan bukti automatik kualiti model.

## 16. Pelaksanaan berfasa

| Fasa | Deliverable | Gate |
| --- | --- | --- |
| J0: Betulkan kontrak | Audit model labels, unknown defaults, result validation, history status, draft-vs-send | Tests membuktikan invalid response tidak menghasilkan aksi |
| J1: Rules dan registry | Question/rubric/taxonomy/policy registry; local evidence + permissions | Tiada network spend; source facts berpartition |
| J2: UI dan workflow | Inline card, evidence drawer, owner queue, preview/approval/receipt | Aduan dan customer-human handoff diuji end-to-end |
| J3: Emulation pilihan | Provider approved sedia ada, quota, labelled outputs, timeout | Zero-additional-cost entitlement disahkan; shadow evaluation sebelum action integration |
| J4: Dealer dan marketing | Applicant/SOP/research/content assessment; Postiz/manual modes | Commercial rules/media rights/current facts enforced; dealer scope terasing |
| J5: Developer dan Hermes | Read-only skill suggestion, diff triage, compaction checkpoints | Actual runtime readiness proof; no new privilege inferred |
| J6: Native pilihan | TypeSafe adapter versi pinned dan per-domain calibration | Free entitlement verified atau approval belanja; tiada silent paid fallback |

Kod cadangan ditempatkan mengikut responsibility, dengan nama akhir diselaraskan kepada patterns repo ketika implementasi:

- `src/shared/contracts/jev.ts`: schema yang boleh dikongsi, tanpa secrets.
- `server/platform/jev/questionRegistry.ts`, `stateBuilder.ts`, `resultValidator.ts`, `policyEngine.ts`.
- `server/platform/jev/adapters/localRules.ts`, `generativeEmulation.ts`, `typesafeNative.ts` pilihan.
- `server/platform/jev/assessmentRepository.ts`, `actionPreview.ts`, `receiptReconciliation.ts`.
- `src/features/jev/components/JevAssessmentCard.tsx`, `JevEvidenceDrawer.tsx`, `JevActionPreview.tsx`.
- `tests/jev/`: validation, policy, scope, evaluation fixtures dan execution boundary tests.

Ini cadangan fail baharu, bukan dakwaan fail sudah wujud. Provider keys berada server-side. Fail operasi mengikuti `var/log/`, `var/run/`, `var/lib/` dan `var/spool/`; tiada queue/PID/log di root projek.

## 17. Cadangan keutamaan untuk founder

1. **Complaint → Evidence → QC → Resolution**: dapatkan workflow yang lengkap dan keputusan yang boleh disiasat.
2. **Founder Action Inbox**: satukan blocker, owner dan next action merentas jualan, staff dan dealer.
3. **Marketing Claim Review → Approved Creative → Publish Receipt**: gabungkan Postiz dan research tanpa mengorbankan fakta produk atau media rights.
4. **Dealer Support dan Restock Context**: bantu stokis bergerak dengan SOP dan ledger yang tepat.
5. **Hermes Skill Routing + Context Checkpoint**: kurangkan context tidak relevan dan cadangkan tool yang sesuai tanpa membuka privilege baru.

Impak perlu diukur melalui masa menyelesaikan tiket, masa menyediakan campaign, kadar kerja yang memerlukan pembetulan, overdue task dan kemampuan founder menamatkan workflow dalam portal. Tiada janji viral, tiada jaminan no-hallucination, tiada latency sub-50ms tanpa pengukuran runtime.

## 18. Ledger bukti dan perkara belum disahkan

| Pernyataan | Status | Bukti / langkah seterusnya |
| --- | --- | --- |
| Choice/Score/Noul rasmi tersedia sebagai primitive | VERIFIED_DOCS | Halaman primitives rasmi dirujuk dalam seksyen 3 |
| `jevEngine.ts` menggunakan Gemini JSON | VERIFIED_SOURCE | Import `getGeminiClient` dan panggilan `generateContent` |
| Native Jev percuma tanpa had untuk projek | NOT_VERIFIED / NOT_BASELINE | Docs models menyatakan caj; perlu entitlement sebenar |
| Local JEV skills menjamin latency/calibration | NOT_PROVEN | SKILL.md ialah instructions; tiada benchmark projek |
| UI chat tiada semakan `hasJev` | OUTDATED_IN_OLDER_REPORT | Sumber semasa `App.tsx:462` mempunyai butang |
| Semua tujuh dimensi terkalibrasi untuk BM | NOT_VERIFIED | Perlu dataset BM/slang, hold-out eval dan thresholds per domain |
| Hermes skill registration benar-benar sampai runtime | NOT_PROVEN | Fungsi kini menyimpan localStorage; perlukan adapter receipt |
| Google Workspace actions selamat/recipient tepat | SOURCE_GAP | Preview, recipient, approval dan reconciliation perlu implementasi |
| JEV diterapkan menyeluruh melalui dokumen ini | PROPOSED | Module map dan phases wujud; runtime belum diubah |

**Kaedah review dokumen:** semakan manual berasaskan sumber, schema, invariants dan batas provider. Dokumen ini tidak mendakwa native Jev menilai pelan, kerana tiada inference call dibuat.

## 19. Sumber primer

Disemak pada 2 Oktober 2026; harga, model, rate limits dan API perlu disemak semula apabila integrasi bermula.

- [TypeSafe Introduction](https://docs.typesafe.ai/introduction).
- [Choice](https://docs.typesafe.ai/primitives/choice).
- [Score](https://docs.typesafe.ai/primitives/score).
- [Noul](https://docs.typesafe.ai/primitives/noul).
- [Confidence](https://docs.typesafe.ai/confidence).
- [Models, input dan harga](https://docs.typesafe.ai/models).
- [Patterns](https://docs.typesafe.ai/patterns).
- [Speculative Fan-Out](https://docs.typesafe.ai/patterns/fan-out).
- [Jev 1.13 Jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13).
- [Skill Suggestion](https://docs.typesafe.ai/cookbooks/skill_suggestion).
- [Double-checking Citations](https://docs.typesafe.ai/cookbooks/citation_check).

Sumber projek yang dibaca: `src/services/jevEngine.ts`, bahagian berkaitan `src/services/gemini.ts`, `src/App.tsx`, `src/components/AbangColekDiscoveryView.tsx` melalui search penggunaan, dan tujuh `SKILL.md` JEV yang dinamakan dalam seksyen 5. Referensi source ialah snapshot kerja semasa; baris boleh berubah selepas implementasi.
