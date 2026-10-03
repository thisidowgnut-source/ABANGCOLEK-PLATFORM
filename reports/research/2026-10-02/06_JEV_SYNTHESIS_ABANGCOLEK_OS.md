---
title: "Sintesis Lima Ekosistem Agen dan Pelan Penambahbaikan ABANGCOLEK-OS"
review_date: "2026-10-02"
status: "RESEARCH_AND_SOURCE_REVIEW_COMPLETE_RECOMMENDATIONS_NOT_IMPLEMENTED"
method: "Primary-source review + manual evidence ledger + targeted source review"
---

# Sintesis JEV dan Cadangan Penambahbaikan ABANGCOLEK-OS

## 1. Keputusan utama

**Cadangan saya: bangunkan ABANGCOLEK sebagai workspace operasi yang menghubungkan rekod, keputusan dan hasil.** Dashboard menjadi tempat owner memahami keadaan bisnes, membuka bukti, mengambil tindakan dan menyemak hasil dalam aliran yang sama. Tema charcoal/lime/violet/lilac yang sudah diselaraskan menjadi asas visualnya.

Kelima-lima rujukan tidak perlu dipasang bersama. Projek memerlukan satu kontrak task, evidence dan capability yang stabil; runtime boleh dipilih kemudian melalui pilot terasing. Menghubungkan lima runtime serentak akan menambah state, credential dan kemungkinan konflik sebelum manfaat operasi dibuktikan.

Sintesis ini ialah cadangan engineering asli berdasarkan lima laporan sumber dan pembacaan source tempatan terhad. Ia tidak mengisytiharkan integrasi produk tersebut sudah tersedia, API produk telah disahkan, model telah dibenchmark atau automation telah diaktifkan.

## 2. Peta laporan dan prinsip yang diambil

| Rujukan | Laporan terperinci | Prinsip adaptasi untuk projek |
|---|---|---|
| [Grok Bot](https://docs.x.ai/grok-bot/overview) | [01_GROK_BOT_OVERVIEW.md](01_GROK_BOT_OVERVIEW.md) | Pemilik tugas, handoff dan skill/routine yang berasingan |
| [Meta Muse](https://ai.meta.com/muse/) | [02_META_MUSE.md](02_META_MUSE.md) | Goal, activity, artifact dan permission gate yang jelas |
| [OpenAI dots](https://openai.com/index/introducing-dots/) | [03_OPENAI_INTRODUCING_DOTS.md](03_OPENAI_INTRODUCING_DOTS.md) | Tanggungjawab berterusan dan keputusan yang boleh diperiksa |
| [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart) | [04_DEEPSEEK_HARNESS_QUICKSTART.md](04_DEEPSEEK_HARNESS_QUICKSTART.md) | Adapter capability, lifecycle dan pemisahan acknowledgement daripada outcome |
| [Hermes Agent](https://hermes-agent.nousresearch.com/docs) | [05_HERMES_AGENT_DOCS.md](05_HERMES_AGENT_DOCS.md) | Specialist, skill lifecycle dan memory dengan provenance |

Baris prinsip ialah tafsiran untuk reka bentuk ABANGCOLEK. Bukti ciri vendor, syarat availability, percanggahan dokumentasi serta ledger sumber berada dalam setiap laporan supaya fakta vendor tidak bercampur dengan proposal projek.

## 3. Cara JEV digunakan dalam review ini

**JEV digunakan sebagai kaedah semakan bukti manual**, dengan claim, entity, source, status dan keputusan. Tiada model TypeSafe Jev atau `evaluateWithJev()` projek dipanggil untuk menilai laman ini. Tiada angka confidence atau latency hasil model direka.

Ini perlu dijelaskan kerana `JEV.md`, dokumentasi dalaman dan `jevEngine.ts` menggunakan istilah JEV dalam konteks berbeza. Memanggil Gemini dengan JSON output juga tidak dengan sendiri membuktikan execution model TypeSafe yang non-autoregressive. Laporan ini tidak menyamakan schema valid dengan fakta benar.

| Status | Makna | Peraturan keputusan |
|---|---|---|
| VERIFIED_DOC | Claim hadir dalam dokumentasi primer | Kekalkan batas vendor; jangan anggap runtime diuji |
| VERIFIED_SOURCE | Laluan source tempatan menunjukkan tingkah laku tertentu | Nyatakan fail/baris; bezakan daripada hasil external runtime |
| INFERENCE | Cadangan hasil analisis | Perlu acceptance test dan validasi workflow |
| UNKNOWN | Bukti belum cukup | Paparkan unknown, blocked atau prerequisite |
| NOT_TESTED | Operasi tidak dijalankan | Jangan label completed/production-ready |

**Had sumber:** Muse URL asal hanya memberikan tajuk melalui extractor; indeks rasmi dan halaman rasmi berkaitan menyokong review. Hermes mempunyai percanggahan dokumentasi Intel macOS yang ditandakan. DSH menyatakan developer preview dan batas keselamatan. Account availability serta API awam keseluruhan produk cloud tidak disahkan. Laporan individu merekodkan semua batas ini.

## 4. Keadaan projek yang benar-benar diperiksa

Source yang dibaca untuk sintesis: `src/services/jevEngine.ts`, `src/services/googleGmail.ts`, `src/components/AbangColekDiscoveryView.tsx`, `src/components/WorkspaceSidebar.tsx`, `src/features/dashboard/model.ts`, feature tema serta App routing yang terlibat dalam migrasi UI. Ini bukan audit semula setiap fail projek.

- Navigasi semasa mempunyai 18 route dalam tiga kumpulan: Bisnes & operasi, Intelligence, Google Workspace.
- Dashboard mengira metrik secara deterministik daripada `OrderItem[]`. Nilai/purata mengecualikan refunded/cancelled; kadar selesai menggunakan semua pesanan sebagai denominator. Ia tidak menjalankan JEV. [Model dashboard](../../../src/features/dashboard/model.ts).
- UI yang diperiksa menyatakan data awal contoh + rekod tempatan, belum disahkan backend. Keadaan ini mesti kekal kelihatan sehingga pipeline data sebenar dibuktikan.
- Tema dark/light dikongsi seluruh route dan pilihan disimpan. Ini sudah dilaksanakan dalam kerja UI terdahulu; **task store, policy gate dan routines dalam dokumen ini masih proposal**.

Laporan pelaksanaan UI: [GLOBAL_THEME_SIDEBAR_IMPLEMENTATION_2026-10-02.md](../../GLOBAL_THEME_SIDEBAR_IMPLEMENTATION_2026-10-02.md).

## 5. Penemuan JEV tempatan yang perlu didahulukan

Semakan ini disahkan semula oleh reviewer berasingan. Tiada tindakan Google dipanggil.

### P0. Draf email dan penghantaran tidak selaras

**VERIFIED_SOURCE:** `AbangColekDiscoveryView.tsx:1628` menyebut “Draf maklum balas gantian”. `jevEngine.ts:307–313` memanggil `sendGmailMessage` kepada penerima tetap `pelanggan@abangcolek.com`. `googleGmail.ts:199` menggunakan `/messages/send`. Jika OAuth dan scope sah, laluan ini menghantar email; ia tidak mencipta draft.

**Cadangan:** asingkan `create_reply_draft` daripada `send_customer_reply`. Recipient mesti datang daripada rekod pelanggan yang dibenarkan; UI menunjukkan penerima, subjek dan isi. Grant execution terikat kepada action dan payload sebenar. Ujian acceptance mesti membuktikan butang draft tidak mencapai endpoint send. Kejayaan penghantaran sebenar belum diuji dalam review ini.

### P0. Missing output dianggap keputusan berkepastian tinggi

**VERIFIED_SOURCE:** `jevEngine.ts:157` parse `{}` apabila response text kosong. Default issue pada `187–189` ialah `LEAKAGE`, confidence `0.96`; dimensi lain juga memakai default tinggi. JSON malformed masuk catch regex tempatan di `237–258`, bukannya terus menggunakan laluan default objek kosong. Regex fallback itu juga memberi confidence tinggi tanpa label kaedah/kalibrasi yang jelas.

**Cadangan:** schema validation mesti berlaku sebelum klasifikasi diterima. Response kosong/enum tidak sah menghasilkan `UNKNOWN` atau validation failure; model confidence absent/null jika tiada nilai yang sah. Fallback tempatan dilabel `deterministic_rule`, dengan rule ID dan evidence match. Jangan mentafsir skor regex sebagai calibrated model probability.

### P0. Klasifikasi bukan keputusan refund

**VERIFIED_SOURCE:** `isRefundEligible` dibina daripada model/default, dan fallback leakage menetapkan eligibility afirmatif. Ini membuktikan label eligibility dalam classifier; **ia bukan bukti bahawa projek memproses pembayaran refund**.

**Cadangan:** label menjadi `refund_review_required` sehingga server menyemak order ID, policy, pembayaran, deadline dan hak actor. Classifier boleh route isu; server deterministik menentukan tindakan yang layak. Ini mengelakkan pelanggan menerima janji yang tiada asas transaksi.

### P1. Value dan probability boleh bercanggah

**VERIFIED_SOURCE:** `167–194` menormalkan enum `value` tetapi menggunakan raw parsed value sebagai key probability. Nilai tidak sah boleh menghasilkan `value: LEAKAGE` bersama key `INVALID`. `198–202` memaksa unknown untuk raw leakage/seal, tetapi probability sentiasa `{UNDETERMINED:0.98}`, termasuk ketika non-leak root cause value ialah VERIFIED.

**Cadangan:** normalized result menjadi satu sumber bagi semua medan. Jika tiada taburan penuh/kalibrasi, gunakan score berlabel dengan provenance dan jangan panggilnya distribution. Root cause mempunyai evidence requirements berasingan; UI membezakan invariant lock daripada confidence model. Uji empty, missing, invalid enum, NaN, negative score dan conflicting root cause.

### P1. Sejarah browser tidak mencukupi untuk audit pasukan

**VERIFIED_SOURCE:** `365–379` menyimpan maksimum 50 klasifikasi dalam LocalStorage. Hasil tindakan Discovery ditunjukkan melalui React state pada `225–235`. Laluan tindakan `286–359` tidak menyimpan execution audit bersama.

**Cadangan:** simpan task events serta action receipts pada store tahan restart yang berakses mengikut actor/tenant. Setiap execution merekod target, authorization, attempts, result dan external receipt. Ini penemuan laluan yang diperiksa; ia tidak mendakwa semua modul lain dalam projek tiada audit.

## 6. Reka bentuk sasaran: rekod → keputusan → hasil

```text
+--------------------------------------------+
| Dashboard: keadaan + keputusan + aktiviti   |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| Task / entity / evidence contract bersama  |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| JEV classifier + deterministic validation  |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| Identity + capability + authorization gate |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| Executor adapter + credential boundary     |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| Receipt + verification + event history     |
+---------------------+----------------------+
                      |
+---------------------v----------------------+
| UI menunjukkan outcome dan next action     |
+--------------------------------------------+
```

Rajah ialah proposal, bukan gambaran backend yang sudah wujud. Provider inference, runtime executor dan data bisnes ialah tiga dependency berbeza. UI tidak perlu tahu format dalaman DSH/Hermes untuk memaparkan task. Adapter menukar hasil kepada contract milik ABANGCOLEK.

## 7. Susunan UI/UX yang disyorkan

### 7.1 Dashboard

Susun mengikut urutan kerja harian:

1. **Ringkasan hari ini:** data source, masa update, wilayah/tempoh dan status synchronization.
2. **Perlu keputusan anda:** aduan belum cukup bukti, draft perlu semakan, pesanan perlu follow-up. Item mempunyai owner, sebab dan pautan entity.
3. **Keadaan bisnes:** KPI sedia ada dengan definisi dan denominator; trend hanya apabila previous period sah tersedia.
4. **Kerja sedang berjalan:** hanya task yang mempunyai execution event/heartbeat, langkah terakhir dan sebab menunggu.
5. **Cadangan berguna:** beberapa idea berasaskan rekod, dengan “Mengapa cadangan ini?” serta expiry apabila data berubah.
6. **Hasil terkini:** artifact atau operasi yang mempunyai bukti siap, boleh dibuka atau diperiksa.

Jangan menyamakan Processing dengan lewat SLA: model dashboard kini menggabungkan Processing/Delayed sebagai attention. Label “melepasi SLA” memerlukan due date dan policy sebenar. Kosong ialah state sah: apabila tiada kerja, tunjuk keadaan selesai tanpa menghasilkan tugas rekaan.

### 7.2 Sidebar

Kekalkan tiga kumpulan semasa supaya pengguna tidak perlu mempelajari semula semua route. Tambah satu destinasi **Kerja & automasi** di bawah Intelligence hanya apabila task backend tersedia. Ia mempunyai tabs Keutamaan, Aktiviti, Rutin, Skills dan Memory. Roster specialist kecil berada dalam page tersebut; sidebar tidak menjadi senarai puluhan agen.

Badge hanya dikira daripada store autoritatif: waiting input, failed atau attention. Count modul 18 ialah inventory, bukan count kerja. Semua status mempunyai label, masa terakhir dan pautan pemulihan. Collapse/expand dan group auto-open yang sudah dibuat kekal asas navigasi.

### 7.3 Task drawer dan quality desk

Task drawer: ringkasan tujuan, linked order/complaint, owner, sumber, status evidence, action preview dan outcome. Activity menunjukkan ringkasan tindakan serta receipt; ia tidak memerlukan paparan internal chain-of-thought model.

Kad JEV: kelas isu, kaedah penilaian, sumber, bukti belum ada, root cause status dan tindakan layak. Bagi aduan botol bocor, paparkan `UNDETERMINED` serta permintaan batch/foto/rekod pengendalian yang relevan. Penentuan punca fizikal memerlukan bukti yang disahkan.

### 7.4 Integrasi dan readiness

Setiap integrasi membezakan: configured, authorized, reachable, capability tested dan last successful execution. UI owner menggunakan bahasa mudah, contohnya “Akaun disambung; sesi perlu diperbaharui”. Detail protokol/provider tinggal dalam drawer teknikal. Ketiadaan worker tidak dipaparkan sebagai AI running.

### 7.5 Visual dan aksesibiliti

Gunakan tokens global: charcoal untuk permukaan, lime primary, violet selection/analysis, lilac secondary. Status semantik kekal berlabel. Motion digunakan ketika state berubah, dengan reduced-motion support. Button stabil, target sekurang-kurangnya 44px dan focus ring jelas. Mobile mengutamakan evidence serta tindakan; dock tidak menutup item terakhir. Semakan tema sedia ada bukan pensijilan formal WCAG.

## 8. Kontrak data minimum yang dicadangkan

Ini pseudo-schema milik projek, bukan SDK vendor dan belum ditulis ke source.

| Rekod | Medan penting | Invariant |
|---|---|---|
| Task | ID, entity reference, owner, state, created/updated/due, source version | Transition disahkan server; task selesai memerlukan outcome |
| Evidence | ID, source URI/record, observedAt, method, freshness, scope | Unknown tidak ditukar menjadi verified melalui prose |
| Action proposal | capability, target, payload, payload hash, expected effect | Perubahan payload membatalkan authorization terdahulu |
| Authorization | actor, scope, decision, expiry, target/payload hash | Read scope tidak memberi write permission |
| Execution | attempt ID, task ID, idempotency key, state, timeout, result | Retry tidak menggandakan side effect |
| Receipt | external operation ID, returned target, verifiedAt | Accepted request berasingan daripada hasil operasi |
| Routine | schedule, MYT timezone, enabled, last/next run, overlap policy | Pause task tidak dianggap cancel schedule |
| Skill | name/version, owner, source, tests, status, allowed capabilities | Catalog, installed, enabled dan approved berasingan |
| Memory | statement, provenance, scope, expiry, correction history | Memory bukan sumber autoritatif transaksi |

Task states cadangan: draft → queued → running → waiting_for_input / waiting_for_authorization / blocked → succeeded / failed / cancelled. `succeeded` memerlukan kriteria outcome, bukan hanya HTTP 200 atau loop model berhenti. Pause dan cancel mempunyai semantik berasingan. Model tidak boleh mengubah permission hanya dengan menjana teks.

## 9. Organisasi komponen dan fungsi

| Cadangan modul | Tanggungjawab | Hubungan dengan kod semasa |
|---|---|---|
| `features/operations` | Task inbox, detail drawer, activity | Boleh digunakan dashboard dan chat |
| `features/quality` | Evidence desk, JEV result UI | Ekstrak paparan relevan daripada Discovery selepas trace dependency |
| `features/integrations` | Health, capability, reconnect | Gunakan service adapter sedia ada, asingkan UI readiness |
| `features/automation` | Routines, history, pause/retry | Memerlukan worker/store terlebih dahulu |
| `features/skills` | Registry dan promotion | Jangan campur marketplace dengan installed state |
| `components/ui` | PageHeader, Card, StatusBadge, Empty/ErrorState, Drawer | Reuse tokens global; audit pattern sebelum ekstraksi |
| Backend adapter layer | Credential, authorization, executor, audit | Tidak dibundel ke Vite frontend |

Cadangan paths ialah sasaran refactor; kewujudannya tidak didakwa. Elakkan memindah semua fail serentak. Mulakan dengan contract dan satu workflow, kemudian ekstrak komponen yang benar-benar berulang. App routing boleh beralih kepada route registry dan lazy loading untuk mengurangkan bundle, dengan ujian import serta navigation gate.

## 10. Pilot paling bernilai

**Pilot pertama: semakan pesanan perlu perhatian secara read-only.** Ia menggunakan rekod yang sah, menghasilkan senarai dengan sebab dan membuka order berkaitan. Tiada mesej dihantar. Selepas query, freshness dan task lifecycle terbukti, tambah penyediaan draft follow-up.

**Pilot kedua: quality complaint review.** Masukkan aduan, link order/batch jika ada, klasifikasi, semak evidence, sediakan draft dan rekod keputusan operator. Punca kekal unknown apabila bukti kurang. Delivery/receipt diuji hanya pada data dan recipient ujian yang dikenal pasti.

Provider menggunakan ekosistem sedia ada yang pengguna benarkan. Model percuma tetap memerlukan probe tool calling, schema, timeout dan failure. Runtime DSH/Hermes ialah pilihan adapter pilot, bukan dependency UI. Produk cloud yang dikaji memberi inspirasi; tiada subscription, installer atau credential baharu diaktifkan oleh review ini.

## 11. Pelan pelaksanaan dan gate

| Keutamaan | Deliverable | Gate sebelum maju |
|---|---|---|
| P0 | Bezakan draft/send, recipient sebenar, validation unknown | Draft tidak send; missing JSON tidak high-confidence complaint |
| P0 | Task/evidence/action contract dan permission boundary | Actor/target/payload diuji; invalid input gagal sebelum external call |
| P1 | Store execution tahan restart + idempotency | Duplicate event/retry tidak mencipta dua tindakan |
| P1 | Decision queue, task drawer, activity, health | Semua badge/card berasal daripada contract yang sama |
| P1 | Pilot read-only + freshness + failure UI | Source putus menghasilkan blocked; rekod lama dilabel stale |
| P2 | Rutin exception MYT | Restart, overlap, cancellation dan next-run disahkan |
| P2 | Skill lifecycle dan memory inspector | Promotion/correction mempunyai provenance dan history |
| P2 | Route lazy loading serta UI component extraction | Build/nav lulus; ukur bundle selepas perubahan |

P0/P1/P2 menunjukkan dependency dan risiko, bukan anggaran harga atau janji tempoh. Setiap fasa menghasilkan workflow yang boleh diperiksa sebelum ciri seterusnya ditambah.

## 12. Ujian penerimaan yang bermakna

- Empty/malformed model response, enum tidak sah, conflicting probability dan unknown root cause.
- Draft preview dibandingkan dengan payload yang diluluskan; edit recipient/isi tidak menggunakan grant lama.
- Provider timeout, OAuth expired dan missing scope mempunyai sebab serta recovery action.
- Duplicate webhook dan retry selepas timeout mempunyai satu external outcome.
- Worker restart mengekalkan job/history; cancel child dan cancel routine diuji berasingan.
- Cross-actor/resource access ditolak oleh backend, bukan hanya UI hidden button.
- KPI click membuka rekod yang membentuk angka; payment received tidak disamakan dengan order value.
- Mobile 320/375/768 dan desktop; keyboard, focus, reduced motion, light/dark dan item bawah dock.

Ukuran manfaat: masa operator mencapai rekod punca masalah, jumlah tindakan salah, duplicate operation, keputusan yang mempunyai evidence dan masa recovery kegagalan. Baseline dikumpulkan dahulu; tiada target peningkatan revenue atau latency direka.

## 13. Keputusan JEV akhir

| Kesimpulan | Status | Keputusan |
|---|---|---|
| Lima laporan dokumentasi disediakan dengan sumber primer | VERIFIED_ARTIFACT | Fail individu tersedia dalam folder ini |
| Tema seluruh 18 route diperiksa dark/light | VERIFIED_UI | Bukti dan batas dalam laporan UI berasingan |
| Dashboard certified oleh model JEV | UNSUPPORTED | Model KPI tidak menjalankan JEV |
| Respons kosong boleh menghasilkan default confidence tinggi | VERIFIED_SOURCE | Dahulukan validation dan unknown path |
| Butang draft menuju send path | VERIFIED_SOURCE | Dahulukan draft/send separation; runtime tidak diuji |
| Runtime agent projek sudah always-on | UNKNOWN | Perlukan service/worker/deployment proof |
| Mengambil task/evidence/capability contract akan membantu konsistensi | INFERENCE | Buktikan melalui pilot dan acceptance tests |
| Semua vendor perlu diintegrasi | TIDAK DISYORKAN | Pilih prinsip; runtime melalui adapter dan pilot |

**Rumusan:** wow factor yang paling kuat ialah owner membuka satu item, melihat bukti, memberi keputusan dan menyaksikan hasil yang benar-benar direkod. Tema premium sudah menjadi asas visual; keutamaan pembangunan seterusnya ialah ketepatan JEV, task lifecycle, execution boundary dan outcome yang dapat dipercayai.
