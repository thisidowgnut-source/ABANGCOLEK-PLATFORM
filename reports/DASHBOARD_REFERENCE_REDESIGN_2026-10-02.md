# Dashboard reference redesign — ABANGCOLEK-OS

Tarikh: 2 Oktober 2026
Status: Pelaksanaan sumber selesai; `bun run lint` dan `bun run build` lulus. Semakan visual browser dilaksanakan dalam sesi utama dan bukti disimpan berasingan.

## Semakan tiga imej rujukan

### 1. Smart Home mobile bento

Imej pertama menggunakan latar hampir hitam, kad dengan bucu bulat besar dan ruang rapat. Biru memberi identiti kepada header; mint menonjolkan kawalan utama, kuning membezakan modul hiburan dan violet membezakan connectivity. Bentuk bulat pada kawalan memberi petunjuk bahawa elemen boleh ditekan. Bottom navigation kecil dengan satu tab berlabel menjimatkan ruang.

Kelemahannya: teks kecil, sebahagian ikon tidak berlabel, dan terlalu banyak toggle setara boleh mengaburkan tindakan yang paling penting. Dalam aplikasi operasi bisnes, suis palsu atau ilustrasi peranti akan mengelirukan. Terjemahan untuk ABANGCOLEK ialah kad metrik yang boleh membuka rekod sebenar, ikon status berbentuk bulat, shortcut berwarna mengikut fungsi dan susunan dua lajur pada mobile.

### 2. ORBITAL desktop workspace

Imej kedua mempunyai sidebar hitam, canvas charcoal, active navigation violet dan modul dengan kepadatan terkawal. Header, view switcher dan filter berdekatan dengan kandungan. Saiz kad berlainan membentuk hierarki dan whitespace memisahkan projek, jadual serta progress.

Kelemahannya: label sekunder sangat kecil dan sesetengah status bergantung pada warna. Calendar sesuai dengan data projek bertarikh tetapi tidak patut diperkenalkan kepada ABANGCOLEK tanpa fungsi jadual sebenar. Pelaksanaan meminjam bahasa workspace, kepadatan modular dan pembahagian kandungan. Data pesanan kekal sebagai sumber operasi.

### 3. Design system lime / violet / lilac

Imej ketiga menetapkan tiga warna tersendiri: lime `#CFFF5E`, violet `#8C7DFF` dan lilac `#B87EED`, di atas charcoal. Tipografi bersih dan rounded rectangular cards mengekalkan satu identiti visual. Komponen menunjukkan normal, active dan disabled states; ini lebih berguna daripada kesan hiasan semata-mata.

Mabry Pro ditunjukkan dalam imej tetapi tidak tersedia sebagai aset berlesen dalam projek. Pelaksanaan mengekalkan DM Sans yang sudah digunakan. Teks gelap digunakan pada kad terang, teks hampir putih pada charcoal dan focus ring violet pada kawalan.

## Pemetaan kepada dashboard sebenar

| Elemen | Pelaksanaan |
|---|---|
| Canvas | Matte charcoal untuk dark theme; neutral lilac untuk light theme |
| Kad utama | Lime untuk nilai pesanan, dengan rekod yang layak sebagai drilldown |
| Ringkasan delivery | Violet dengan peratus Delivered, progress sebenar dan rekod selesai |
| Desktop bento | Kad nilai menggunakan 4 daripada 6 lajur; kad delivery 2 daripada 6; tiga metrik kecil di baris berikutnya |
| Mobile bento | Dua lajur untuk nilai/delivery dan metrik; perhatian satu kad penuh |
| Header | Sapaan ringkas menggantikan hero marketing yang tinggi |
| Toolbar | Wilayah, tempoh, reset filter dan label sumber berdekatan dengan metrik |
| Shortcut | Mint, kuning, lilac dan violet untuk pesanan, logistik, laporan dan prestasi AI |
| Evidence | Rekod tempatan dilabel, setiap KPI membuka rekod dan penerangan formula |
| Actions | Eksport CSV, carian/kosongkan carian, tab status dan navigasi modul kekal berfungsi |

## Invarian data dan JEV

- Nilai pesanan bukan pengesahan wang diterima. Refund dan pesanan batal dikecualikan daripada nilai dan purata.
- Delivery menggunakan jumlah Delivered dibahagi semua pesanan dalam filter aktif.
- Tiada growth trend, countdown, jadual, AI waveform atau status live direka untuk menghias dashboard.
- Laluan semakan JEV kekal tersedia; angka dashboard tidak dinamakan sebagai output model JEV.
- Default pengguna baharu ialah dark. Pilihan tema light yang sudah disimpan dihormati.

## Responsive dan accessibility

Kawalan mempunyai tinggi minimum 44px, icon button mempunyai lebar 44px, focus ring jelas, hover hanya pada pointer fine, pressed state segera dan reduced motion dihormati. Pada <=360px, nilai kewangan dikecilkan untuk mengelakkan pemotongan. Pada <=380px, donut dan senarai status disusun menegak. Senarai mempunyai kelegaan bawah dan halaman mengekalkan ruang safe area untuk dock mobile.

## Fail dan verifikasi

- `src/features/dashboard/DashboardView.tsx`: ringkasan operasi, kad delivery, default theme dan susunan dashboard.
- `src/features/dashboard/dashboard.css`: CSS disusun semula sebagai satu stylesheet yang koheren; lapisan override emerald/gold terdahulu dikeluarkan.
- `bun run lint`: lulus TypeScript.
- `bun run build`: lulus, 2,938 modules. Bundle JavaScript kira-kira 2.066MB sebelum gzip; warning saiz bundle aplikasi masih wujud dan tidak diselesaikan oleh perubahan visual ini.
- Semakan kod bebas menemui risiko overflow fulfillment pada 320px; CSS stacking pada <=380px telah ditambah sebelum semakan browser akhir.

## Pengesahan browser akhir

- Desktop 1280 x 855: bento asimetri, sidebar violet, dark/light toggle dan KPI dipaparkan.
- Mobile 390 x 844: dua lajur, dock aktif lime, satu scrollbar dashboard.
- Mobile 320 x 740: lebar halaman tepat 320px; nilai kewangan muat; header ringkas; fulfillment disusun column, senarai status 209px.
- Filter Bangi: nilai RM90, delivery 0% (0 daripada 1). Reset kembali ke semua rekod.
- Klik kad delivery: dialog 13 pesanan Delivered dengan formula/sumber dipaparkan.
- Carian AC-ORD-1003: satu rekod tepat; kosongkan carian berfungsi.
- Semakan TypeScript akhir lulus. Ujian metrik 3 pass / 0 fail / 10 assertions.
- Code reviewer bebas APPROVE selepas pembetulan header dan fulfillment mobile.

Bukti screenshot: reports/dashboard-ui/reference-desktop-dark.png, reference-desktop-light.png, reference-mobile-dark.png. Paparan sebelum: reference-before.png.

Shell turut diubah dalam src/components/workspace-sidebar.css. App.tsx hanya menerima class semantic ws-mobile-header/ws-bottom-nav dan aria-current pada dock untuk skop CSS yang jelas. Tiada auth behavior diubah.

Had: pengesahan ini bukan audit WCAG penuh atau pengesahan backend. Angka seed/tempatan tetap dilabel; tiada model JEV luaran dipanggil. Tiada deploy dibuat.
