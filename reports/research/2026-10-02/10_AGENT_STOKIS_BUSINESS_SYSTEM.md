---
title: "Kajian Model Ejen dan Stokis serta Sistem Pengedaran ABANGCOLEK"
review_date: "2026-10-02"
status: "RESEARCH_AND_PROPOSED_BUSINESS_SYSTEM"
implementation_status: "NOT_IMPLEMENTED"
method: "Primary-source research + manual JEV evidence ledger + project synthesis"
---

# Ejen dan Stokis: Model Bisnes serta Sistem Operasi ABANGCOLEK

## 1. Keputusan yang disyorkan

Gunakan **model pengedaran hibrid yang bermula dengan reseller buy-resell dan stokis berkelayakan**, kemudian tambah dropship atau konsainan hanya apabila ownership, fulfillment dan settlement dapat dijejaki. Penambahan dealer mesti mengikuti permintaan serta capacity operasi yang boleh dibuktikan.

Dalam dokumen ini, **ejen ialah rakan jualan manusia/perniagaan**. Ia berbeza daripada AI agent Hermes yang membantu menyemak data, menyediakan cadangan dan mengurus task. AI tidak boleh memberi status stokis, kredit, harga atau komisen sendiri.

Matlamat sistem: founder mempunyai satu senarai rakan niaga, satu rekod order/restock, satu ledger stock movement, satu statement dan satu laluan menyelesaikan aduan. Ejen/stokis bekerja dalam dealer portal sendiri tanpa akses dalaman HQ atau dealer lain.

Semua cadangan commercial ialah **INFERENCE**, bukan polisi rasmi ABANGCOLEK. Starter pack, MOQ dan harga dalam dokumen lama tidak konsisten; tiada satu nilai diangkat menjadi terma sebenar. Founder mesti menetapkan harga, kos, pack, ownership transfer dan eligibility sebelum publish.

## 2. Research: corak yang boleh diambil

### B2B catalog dan quantity rules

Dokumentasi Shopify memisahkan katalog produk/harga yang boleh dilihat buyer B2B mengikut company/location. Dokumentasi quantity rules membezakan minimum, maksimum dan increment setiap variant, serta price breaks mengikut quantity. [B2B catalogs](https://help.shopify.com/en/manual/b2b/catalogs), [Quantity rules](https://help.shopify.com/en/manual/b2b/catalogs/quantity-pricing).

**Adaptasi projek:** dealer hanya melihat katalog/price policy yang diluluskan untuk membership mereka. Cart menunjukkan pack increment dan MOQ sebelum submit, sementara server mengesahkannya semula. Quote membawa version, validity, freight dan exclusions. Ini konsep untuk dibina dalam ABANGCOLEK; ia tidak memerlukan langganan Shopify.

### Konsainan: lokasi berbeza daripada pemilikan

Dokumentasi Odoo membezakan barang yang disimpan oleh consignee daripada barang yang dimilikinya. Stock moves dan laporan boleh dipisahkan mengikut owner. Kandungan ini tersedia melalui indeks web rasmi; fetch terus halaman ketika review mengalami timeout. [Odoo consignment](https://www.odoo.com/documentation/saas-18.4/applications/inventory_and_mrp/inventory/shipping_receiving/daily_operations/owned_stock.html).

**Adaptasi projek:** simpan `owner`, `custodian`, `location`, `batch` serta movement. Penghantaran ke booth konsainan tidak automatik menjadi jualan kepada dealer. Receipt di lokasi tidak mengubah ownership kecuali event/policy yang dipersetujui.

### Replenishment dan produk mempunyai tarikh luput

Dokumentasi Odoo menyokong reordering rules berdasarkan stock forecast dan lead time; FEFO memilih lot yang perlu dikeluarkan dahulu mengikut tarikh berkaitan expiry/removal. Kandungan rasmi diperoleh melalui carian; fetch halaman FEFO terus timeout. [Reordering rules](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/reordering_rules.html), [FEFO](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/shipping_receiving/removal_strategies/fefo.html).

**Adaptasi projek:** gunakan data batch/expiry yang QC telah sahkan; jangan reka shelf life kuah/jeruk. Forecast menghasilkan restock proposal dahulu. Jika expiry/lead time tiada, UI menyatakan data belum cukup. Odoo digunakan sebagai sumber corak, bukan cadangan membeli atau memasang ERP.

### Konteks Malaysia

KPDN menyediakan teks Akta 500 tentang jualan langsung dan skim anti-piramid. PDF yang dibaca menyatakan cetakan semula sebagaimana pada **1 Disember 2011**; ia tidak membuktikan semua amendment/aturan terkini telah disemak. [Teks KPDN](https://www.kpdn.gov.my/images/2024/awam/akta/kpdn/Akta%20500.pdf).

**Gate commercial:** klasifikasi, keperluan lesen, marketing plan, kontrak dan claim pendapatan perlu disemak terhadap aturan semasa apabila model sebenar ditentukan. Dokumen ini tidak membuat keputusan bahawa ABANGCOLEK ialah MLM, dikecualikan atau sudah compliant. Cadangan produk tidak memberi reward untuk enrollment sahaja; terma wilayah dan resale pricing juga perlu semakan sebelum diaktifkan.

## 3. Perbandingan empat model

| Model cadangan | Pemilikan/custody | Cara hasil diperoleh | Kelebihan | Prasyarat operasi |
|---|---|---|---|---|
| Reseller buy-resell | Dealer membeli; titik ownership transfer ikut kontrak | Beza hasil jualan sebenar dan landed cost | Cash/stock mudah dijejak | Harga, receiving, returns dan batch |
| Stokis/hub | Dealer membeli atau konsainan ikut agreement; jangan campur | Margin wholesale/service yang diluluskan | Restock setempat dan liputan | Capacity storage, demand, replenishment dan territory terms |
| Dropship/referral fulfillment HQ | HQ menyimpan dan fulfill | Benefit atas eligible order yang attributed | Entry tanpa physical stock dealer | Attribution, payment, fulfillment, refund reversal |
| Konsainan | Owner dan lokasi/custodian berasingan | Settlement/margin/fee mengikut policy approved | Uji booth/channel tanpa immediate buy-in | Counts, sell-through, settlement, damage/return ownership |

**Cadangan awal:** aktifkan reseller dan stokis dalam satu sistem B2B yang sama. Dropship ialah capability kemudian; konsainan bermula pada pilot lokasi yang mempunyai daily count/settlement. Jangan paksa semua rakan membeli starter pack besar untuk mendapat rank.

## 4. Segmentasi dan qualification

Gunakan status lifecycle yang jelas: `applicant`, `under_review`, `approved`, `active`, `suspended`, `closed`. Tier commercial mempunyai version tersendiri; suspension perlu sebab dan laluan review, bukan AI score tunggal.

Qualification yang dicadangkan:

- Business identity/contact yang diperlukan dan verified owner.
- Lokasi/capacity penyimpanan yang relevan dengan SOP produk.
- Channel jualan dan bukti permintaan yang munasabah.
- Rekod receiving, stock count dan payment discipline.
- Penyelesaian training/QC serta complaint handling.
- Sell-through dan service evidence apabila data sudah tersedia.

Tiada tier diberikan berdasarkan bilangan recruit atau belian sendiri sahaja. Stokis tidak mendapat hak eksklusif automatik daripada poskod. Territory service coverage dan exclusivity ialah dua keputusan berasingan dengan tempoh, syarat dan founder sign-off.

## 5. Dealer portal yang dicadangkan

Route B2B: `/customer/business/*`; portal memerlukan membership organisasi dealer, bukannya role staff global.

1. **My business:** application, status, users authorised dan agreement version.
2. **Eligible catalog:** SKU, pack, price, validity serta quota/allocation yang diluluskan.
3. **Restock:** draft, quote, payment evidence, approval, dispatch dan timeline.
4. **My stock:** owned/consigned, available/reserved/quarantine serta batch.
5. **Receiving:** quantity, damage/variance, timestamp dan evidence.
6. **Sell-through:** capture/import jualan yang sah dengan provenance; purchase from HQ dibezakan daripada retail sold.
7. **Statements:** invoice/order, payment, credit/debit, earned benefit dan settlement.
8. **Claims:** linked batch/order, evidence, status, keputusan dan receipt.
9. **Marketing kit:** approved product assets, content version, promotion validity dan SOP.
10. **Support:** in-app inbox, task handoff dan flow forms.

Dealer boleh mempunyai beberapa authorised users. Staff HQ hanya melihat records yang perlu untuk fulfillment/quality/finance. Founder melihat business scope. Developer mendapat diagnostics redacted. Daftar ejen AI sendiri tidak menjadi bukti approved dealer.

## 6. Onboarding end-to-end

```text
+--------------------------------+
| Landing: mohon ejen / stokis    |
+---------------+----------------+
                |
+---------------v----------------+
| Flow: identity + channel + area |
+---------------+----------------+
                |
+---------------v----------------+
| Review: evidence + terms       |
+---------------+----------------+
                |
+---------------v----------------+
| Founder: approve scoped offer  |
+---------------+----------------+
                |
+---------------v----------------+
| Dealer: acknowledge + training |
+---------------+----------------+
                |
+---------------v----------------+
| Order + receive + pilot sales  |
+---------------+----------------+
                |
+---------------v----------------+
| Review outcome dan next supply |
+--------------------------------+
```

Application mengumpul data minimum untuk review; dokumen sensitif hanya apabila perlu, akses/retention jelas. Offer mengandungi model, SKU/pack, harga, payment terms, freight, claim/return policy, territory serta version. Agreement changes tidak mengubah order lama secara senyap.

Training memberi SOP packaging, storage dan customer response yang founder/QC telah sahkan. Sistem tidak menganggap klik “sudah baca” sebagai bukti physical storage compliant; bukti atau audit tambahan perlu ditentukan policy.

## 7. Restock, fulfillment dan receiving

Aliran sistem:

1. Dealer pilih SKU/quantity daripada catalog yang layak.
2. Server semak pack increment, MOQ/max, membership, inventory availability dan price version.
3. Quote menunjukkan amount dalam sen, freight, validity serta payment terms.
4. Reservation mempunyai expiry; tidak reserve stock selama-lamanya pada cart draft.
5. Payment evidence masuk pending review; paid status memerlukan reconciliation yang sah.
6. Staff pick/QC/pack batch; dispatch event membawa entity/reference dan custody.
7. Dealer receive atau declare variance/damage dengan bukti.
8. Ledger update atomik; duplicate receipt tidak menambah stock dua kali.
9. Settlement/claim mempunyai action owner dan timeline.

Default commercial cadangan ialah prepaid, **jika founder meluluskannya**. Kredit bukan reward automatik; limit, due date, overdue action dan authority perlu policy tersendiri. Dokumen ini tidak memberi kredit sebenar atau menilai kelayakan kewangan pihak tertentu.

Freight boleh digabung mengikut destination/cutoff yang approved apabila lebih efisien, tetapi penjimatan mesti dikira daripada quote nyata. Jadual bas dalam sample bukan availability booking yang disahkan.

## 8. Stock ledger dan konsainan

Movement mempunyai transaction ID, SKU, batch, unit, quantity, owner, custodian, from/to location, reason, actor dan timestamp. Physical count, inventory ownership dan company-wide stock valuation ialah pandangan berbeza.

**Contoh ilustrasi sahaja:** HQ menyerahkan 60 botol kepada booth secara konsainan. Booth menjual 18, memulangkan 2 rosak untuk review dan menyimpan 40. Ledger ialah 60 dispatched = 18 sold + 2 returned/quarantined + 40 remaining. Payment settlement untuk 18 sold mengikuti policy; 60 dispatched tidak dilabel 60 retail sales.

Stock buy-resell mempunyai titik ownership transfer yang kontrak tentukan. Jika barang dalam transit, jangan serentak dikira available di HQ dan available pada dealer. Kuantiti negatif, duplicate adjustment dan lot tak diketahui memerlukan conflict/review.

## 9. Margin, komisen dan benefit ledger

Pisahkan **reseller margin**, **HQ contribution**, **referral commission** dan **consignment settlement**. Ia bukan angka yang sama.

Formula cadangan untuk analisis operasi:

```text
Dealer gross profit = realised net sales - cost of units sold
Dealer gross margin % = gross profit / realised net sales * 100
Dealer net contribution = gross profit - relevant selling/logistics costs

HQ contribution = eligible net revenue
                  - variable product cost
                  - allocated fulfillment subsidy
                  - approved benefit
                  - returns/claims cost
```

Jika denominator sifar, margin ialah unavailable; sistem tidak membahagi sifar. Accounting recognition/statutory treatment perlu ditetapkan berasingan. Formula ini cadangan pengukuran, bukan nasihat financial reporting.

**Contoh hipotetikal, bukan harga ABANGCOLEK:** dealer menjual 10 unit pada RM20/unit dan cost unit sold RM12. Net sales RM200, cost RM120, gross profit RM80 dan gross margin 40%. Jika selling/logistics cost RM15, contribution sebelum kos lain ialah RM65. Membeli 50 unit tetapi menjual 10 tidak menghasilkan gross profit untuk semua 50.

Optional referral benefit hanya bagi order attributed yang memenuhi policy, pembayaran verified, fulfillment/return eligibility dan tidak duplicate. Ledger states: pending → eligible → approved → settled; reversal linked apabila order dibatalkan/refunded. Formula, base amount dan eligibility date versioned. Tidak ada benefit daripada registration/recruitment sahaja. Buy-resell tidak diberi komisen tambahan secara default yang menyebabkan double reward.

## 10. Replenishment yang efisien

Mulakan cadangan deterministik:

```text
Inventory position = gross on-hand usable stock + confirmed inbound - unfulfilled commitments
Reorder trigger = approved average daily demand * replenishment lead days + safety stock
Suggested quantity = approved target stock - inventory position
```

Gross on-hand usable stock mengecualikan quarantine/expired stock tetapi masih termasuk reserved units. Unfulfilled commitments merangkumi reserved orders serta unreserved backorders sekali sahaja. Jangan menggunakan available-after-reservation sebagai gross stock lalu menolak reservation kali kedua. Contoh hipotetikal: gross usable 100 + inbound 20 - commitments 30 = position 90; available-now 70 sudah menolak commitments itu dan tidak boleh ditolak 30 sekali lagi.

Formula ialah design proposal. Unit/horizon, pack rounding, minimum/max, inbound certainty dan seasonal effects perlu consistency. Jika demand/lead time belum ada, gunakan manual threshold yang approved dan label kekurangan data. Stockout periods boleh menyebabkan recorded sales merendahkan demand; sistem perlu menandakan bias itu.

Batch expiry yang verified boleh memandu FEFO. Unknown expiry tidak dianggap produk selamat atau tarikh far-future. Replenishment menghasilkan proposal; founder/dealer authority mengesahkan order. AI boleh menerangkan sebab atau mengenal pasti missing data, tetapi tidak mencipta sales/expiry/lead time.

## 11. Dashboard HQ dan KPI dealer

| KPI | Definisi yang dicadangkan | Batas |
|---|---|---|
| Sell-through | Units sold daripada cohort stock tersedia dalam window ditetapkan | Perlu retail sales sah; HQ purchase bukan sold-to-consumer |
| Days of stock | Usable stock / validated daily demand | Undefined jika demand sifar/unknown |
| Fulfillment reliability | Dispatch/receipt sesuai due date agreed | Perlu SLA sebenar, bukan assumed |
| Stock variance | Count dibanding expected ledger | Timestamp/cutoff sama |
| Receivable ageing | Outstanding invoiced obligation mengikut due date | Tidak berdasarkan screenshot belum verified |
| Claim rate | Valid case denominator serta window yang dinyatakan | Asingkan pending claim daripada confirmed defect |
| Contribution | Policy-defined net sales less applicable variable costs | Cost source dan exclusions jelas |
| Dealer service health | Training, records, receiving, complaint response | Transparent rules; no AI rank opaque |

Dashboard membuka underlying records bagi setiap angka. Dealer dibanding dalam context window/channel/stock availability yang sama. Small sample menunjukkan denominator dan uncertainty. Tier review memakai bukti serta human decision; sistem menyediakan appeal/correction.

## 12. Territory dan pengembangan rangkaian

Coverage map menunjukkan approved service points serta data last verified. Exact home addresses tidak public. Lead routing berdasarkan area, stock availability, service capability dan customer choice yang dibenarkan.

Pilot stokis baharu dipertimbangkan apabila demand/backlog/freight/lead-time data menyokongnya. Founder menilai storage, working capital, fulfillment capacity dan existing dealer performance. Exclusive territory jika digunakan perlu agreement, duration dan review gate; sistem tidak mencipta exclusive right daripada location field.

Mulakan hubungan supply/fulfillment satu lapisan yang boleh diaudit. Jika stokis membekalkan reseller, simpan sales/transfer contract dan ownership event mereka; jangan secara automatik menambah komisen upline bagi pembelian atau recruitment. Financial/business/legal terms perlu disahkan sebelum network reward berkembang.

## 13. Idea efisiensi yang boleh dibina tanpa subscription tambahan

- QR restock dari pack/invoice membuka dealer flow dengan own approved context.
- Reorder draft daripada order terdahulu, tetapi harga/stock disemak semula.
- One receiving flow bagi count, damage, foto dan batch mismatch.
- Weekly exception digest: stock kritikal, disputed receiving, unpaid obligation dan complaint tanpa owner.
- Approved marketing kit versioned supaya ejen tidak menyebarkan harga lama.
- Consolidated dispatch proposal mengikut cutoff/lokasi, dengan per-order receipts.
- Founder decision queue bagi application, credit exception dan claims.
- Statement export CSV/PDF supaya dealer dapat mereconcile sendiri.
- Hermes Dealer specialist menyemak records read-only dan menyediakan ringkasan; JEV menilai aduan/evidence; mutation tetap melalui policy.

Semua automasi memakai in-app notifications dahulu. Native WhatsApp terikat pricing/access gate daripada laporan 08. Tiada quota bypass, paid plugin atau unofficial WhatsApp automation diperlukan sebagai baseline.

## 14. Pelan rollout dan acceptance

1. **Policy register:** founder publish SKU/pack/price, ownership, payment, return dan territory terms.
2. **Dealer registry:** membership, users, agreement version dan scoped catalog.
3. **Restock pilot:** quote → evidence → dispatch → receive → statement pada dealer ujian yang dikenal pasti.
4. **Ledger:** audit movements, counts, quarantine dan settlement; reconcile dengan physical sample.
5. **Konsainan pilot:** satu lokasi, daily close dan owner/custodian rules.
6. **KPI/forecast:** aktifkan apabila input sufficient; label manual/self-reported/verified.
7. **Routines/AI:** read-only digest, kemudian action proposal berpermission.

Acceptance: dealer A tidak membaca B; unapproved buyer tidak mendapat B2B price; invalid pack ditolak; stale quote di-review semula; payment evidence tidak paid; duplicate receiving tidak duplicate stock; consignment bukan company sales automatik; unpaid/refunded/ineligible order tidak settled benefit; recruiter count tidak menentukan earning. Failed persistence menghasilkan pending/error, bukan success.

## 15. Ledger JEV dan keputusan akhir

| Claim | Status | Keputusan |
|---|---|---|
| B2B catalog dan quantity rules didokumentasikan Shopify | VERIFIED_DOC | Ambil design pattern sahaja |
| Ownership consignment berasingan daripada location | VERIFIED_DOC melalui indeks rasmi | Bina ledger owner/custodian |
| Reordering/FEFO ialah corak documented | VERIFIED_DOC melalui indeks rasmi | Input batch/demand perlu sah |
| ABANGCOLEK punya starter pack/margin rasmi tertentu | UNKNOWN | Founder approval; jangan gunakan sample sebagai policy |
| Semua dealer semasa sesuai diberi kredit/territory exclusive | UNKNOWN | Tiada penilaian individu dibuat |
| Licensing/compliance model lengkap sudah disahkan | UNKNOWN | PDF sumber lama; semakan semasa diperlukan |
| Modul dealer telah diimplementasikan | BELUM | Research/plan sahaja |

**Rumusan:** kecekapan datang daripada memisahkan jenis hubungan bisnes, mengikat setiap order kepada terma versi, membezakan stock ownership/custody, dan mereconcile sale/payment/receiving. Cadangan awal ialah reseller + stokis scoped, kemudian dropship/konsainan selepas ledger dan pilot terbukti.

## 16. Ledger sumber dan batas

Diakses 2 Oktober 2026: Shopify catalogs dan quantity rules dibaca terus. Odoo consignment/reorder/FEFO dibaca melalui search-index rasmi; direct fetch untuk beberapa halaman timeout. KPDN PDF dibaca, tetapi versi cetakan 2011 bukan semakan undang-undang terkini menyeluruh. Tiada interview founder/dealer, actual cost audit, live DB, inventory count, legal classification atau runtime benchmark dibuat. JEV ialah semakan claim manual; tiada model luaran dipanggil.

Rujukan platform: [09 master plan](09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md), [08 WhatsApp flow](08_WHATSAPP_FLOW_ZERO_COST.md), [implementation plan](../../../docs/superpowers/plans/2026-10-02-platform-expansion.md).
