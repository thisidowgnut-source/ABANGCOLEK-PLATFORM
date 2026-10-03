# Pelan Upgrade ABANGCOLEK-OS

Tarikh: 2 Oktober 2026. Status: cadangan, belum diimplementasikan. Asas: lima kajian rasmi, sintesis JEV dan semakan semula source `jevEngine.ts` serta package projek.

## 1. Sasaran produk

ABANGCOLEK menjadi workspace operasi F&B yang membantu owner memahami keadaan bisnes, membuat keputusan dengan bukti, menyelesaikan kerja dan memulihkan kegagalan. Aspirasi UNDEFEATED/UNSTOPPABLE diterjemahkan kepada ketepatan, continuity, inspectability dan manfaat operator yang boleh diukur. Tiada sistem boleh dijamin tidak pernah gagal; standard produk ialah kegagalan dikesan, kerja dijaga dan pemulihan dibuktikan.

## 2. Tujuh upgrade utama

| Upgrade | Hasil untuk client | Gate penerimaan |
|---|---|---|
| JEV evidence dan business policy | Keputusan yang dapat dijelaskan | Output kosong menjadi unknown; draft tidak send; refund dinilai mengikut rekod/policy |
| Rekod bisnes autoritatif | Angka dashboard boleh dipercayai | KPI membuka rekod pembentuk angka; demo/local/live dan freshness dinyatakan |
| Runtime tahan kegagalan | Kerja dapat disambung selepas restart | Durable jobs, checkpoint, lease, idempotency, retries terkawal, recovery test |
| Dashboard mengikut keputusan | Owner tahu tindakan seterusnya | Queue attention, evidence drawer, action preview dan outcome memakai state sama |
| Specialist dengan capability terhad | Delegasi jelas kepada Operasi, Kualiti, Logistik, Workspace | Setiap role mempunyai scope, owner, skill version dan executor yang diuji |
| Workflow F&B yang mendalam | Produk memahami batch, stok, ejen, kargo dan aduan | Satu pilot end-to-end menggunakan rekod sebenar/ujian yang dikenal pasti |
| Delivery engineering | Upgrade konsisten dan boleh dipulihkan | Automated gates, observability, backup restore, migration dan rollback proof |

## 3. JEV yang boleh dipercayai

Source semasa masih parse `{}` untuk respons kosong, mempunyai default confidence tinggi serta laluan email kepada recipient tetap. Dahulukan schema validator, unknown path, provenance kaedah dan pengasingan draft/send. Klasifikasi LLM menentukan routing; validator deterministik menguatkuasakan invariant; authorization service memutuskan kuasa execution.

Set ujian perlu merangkumi Bahasa Melayu/English, negasi (“botol tidak bocor”), isu bercampur, bukti bercanggah, kelas unknown dan arahan adversarial dalam mesej. Ground truth dilabel operator dengan rekod justification. Ukur false positive, missed critical issue, abstention dan calibration; jumlah skor confidence sahaja tidak mengukur kualiti.

## 4. Runtime dan sumber data

Pisahkan React frontend daripada worker/executor. Job store tahan restart menyimpan state, attempts dan receipt. Lease/heartbeat membantu mengenal pasti worker yang hilang; retry diberi had dan backoff. Side effect memakai idempotency key serta reconciliation apabila timeout meninggalkan outcome tidak pasti. Fail provider menghasilkan keadaan degraded/blocked yang jelas, bukan kejayaan palsu.

Provider fallback hanya dilakukan selepas error dikategorikan dan compatibility capability diuji. Untuk tindakan yang outcome-nya tidak pasti, semak receipt sebelum mengulang. Secrets kekal pada credential boundary. Scope actor/resource diperiksa oleh server walaupun UI menyembunyikan kawalan.

Model rekod pesanan, pembayaran, stok, batch, ejen, penghantaran dan aduan perlu saling dirujuk. Nilai pesanan berasingan daripada bayaran diterima. Inventory movement ledger menyokong adjustment dengan sebab/actor, bukannya angka stok yang ditukar tanpa history. Pilihan storage diselaraskan dengan infrastructure sedia ada selepas audit, tanpa pemasangan semula automatik.

## 5. Dashboard dan sidebar

Dashboard disusun kepada ringkasan, keputusan owner, KPI, kerja aktif, cadangan berasaskan rekod dan hasil terkini. Setiap item membuka entity/evidence drawer yang sama. Kosong/error/loading/stale mempunyai component standard. Tiada progress percent jika jumlah kerja tidak diketahui.

Kekalkan tiga kumpulan sidebar sedia ada. Tambah satu destinasi Kerja & automasi apabila backend tersedia, dengan inbox, activity, routines, skills dan memory di dalamnya. Count badge daripada task store. Tema global lime/violet/lilac/charcoal kekal; komponen header, card, status, drawer dan feedback diseragamkan seluruh route. Role view owner/crew/stockist memakai permission sebenar, bukan perubahan rupa sahaja.

## 6. Kelebihan domain yang dicadangkan

1. **Batch traceability:** aduan → pesanan → batch → production/QC → handling/penghantaran. Bukti tambahan membuka siasatan tanpa membuat tuduhan punca.
2. **Stok dan replenishment:** threshold dipersetujui serta sumber stok sah; recommendation mempunyai sebab dan owner.
3. **Operasi ejen:** order, penerimaan barang, status bayaran dan follow-up berasaskan rekod; elakkan ranking model tanpa formula.
4. **Kargo:** dispatch, handoff, penerimaan dan exception dengan timestamp; lokasi/status tidak dikatakan real-time tanpa feed.
5. **Quality resolution:** triage, evidence request, draft, keputusan dan receipt dalam satu aliran.

Keunikan produk bertambah apabila SOP yang diluluskan, relationship rekod dan outcome sebenar membentuk pengetahuan operasi. Chat history sahaja tidak cukup sebagai business memory.

## 7. Urutan pembangunan

### Fasa A — Ketepatan dan kawalan

Baiki JEV validation, draft/send, target recipient, refund review semantics dan execution contract. Gate: semua invalid/missing inputs selamat, UI sepadan dengan tindakan dan tiada side effect pada preview.

### Fasa B — Satu workflow lengkap

Pesanan perlu perhatian → bukti → draft follow-up → keputusan operator → receipt. Simpan task, event dan authorization. Gate: klik KPI ke entity, retry tidak duplicate, source terputus memberi blocked.

### Fasa C — Continuity dan automasi

Worker, scheduler MYT, checkpoint, recovery, exception digest dan connection health. Gate: restart, timeout, cancel, overlap serta expired authorization diuji.

### Fasa D — Domain dan specialist

Tambah batch/stock/agent/logistics relationships dan empat specialist apabila capability tersedia. Gate: setiap skill mempunyai fixture/version; tenant/role boundary terbukti.

### Fasa E — Prestasi dan keluaran

Lazy load route, pecahkan bundle, audit dependency usage, ukur runtime dan accessibility, bina release/rollback gates. Gate: semua route boleh dicapai, critical flows diuji serta restore backup dibuktikan. Jangan padam dependency hanya kerana namanya nampak bertindih; trace imports dan bundle dahulu.

## 8. Ukuran kejayaan

Kumpulkan baseline: masa owner mencari evidence, masa isu diselesaikan, tindakan salah, duplicate operation, recovery time, freshness data dan peratus outcome dengan receipt. Tetapkan SLO selepas baseline dan environment deployment diketahui. Zero duplicate side effects dalam set ujian, semua action mutation mempunyai target/authorization dan semua KPI memaparkan sumber ialah acceptance invariants yang boleh diuji sekarang.

## 9. Demo client yang dicadangkan

Owner membuka brief, memilih pesanan bermasalah, menyemak rekod/bukti, menerima draft yang sah, membuat keputusan dan melihat status/outcome dikemas kini. Demo kedua mensimulasikan gangguan worker/provider: UI menerangkan masalah dan kerja disambung tanpa tindakan berganda. Kedua-duanya mesti dilabel data ujian apabila bukan operasi sebenar.

## 10. Keputusan

Upgrade pertama yang disyorkan ialah Fasa A bersama skeleton task/evidence bagi Fasa B. Satu workflow yang lengkap dan dipercayai memberikan asas untuk seluruh dashboard, automation dan specialist. Integrasi lima produk sekaligus, pertukaran model tanpa benchmark serta jumlah agen yang besar bukan acceptance metric.

Rujukan utama: [Sintesis dan bukti source](06_JEV_SYNTHESIS_ABANGCOLEK_OS.md). Pelan ini tidak memasang runtime, mengubah provider atau melaksanakan automation.
