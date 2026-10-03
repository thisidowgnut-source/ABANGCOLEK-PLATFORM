# Design QA — Hero ABANGCOLEK

Tarikh: 3 Oktober 2026. **Keputusan: PASS untuk skop hero lokal.**

## Rujukan dan hasil

Screenshot rujukan [Emons](https://www.emons.de/en) dan implementasi dibuka bersama pada viewport 1280×800. Kriteria ialah adaptasi konsep yang dipilih pengguna: visual dunia isometrik, stage pinned, perubahan fokus mengikut scroll, copy kiri dan navigasi bab bawah. Warna, logo, foto produk dan narrative mengikuti ABANGCOLEK. Implementasi ini menggunakan transform pada ilustrasi; ia tidak menyediakan animasi objek/renderer 3D seperti rakaman dunia Emons.

| Rujukan | Implementasi |
| --- | --- |
| [Emons 1280×800](../var/log/hero-emons/emons-reference-1280.png) | [Hero ABANGCOLEK 1280×800](../var/log/hero-emons/desktop-1280.png) |
| Dunia logistik, copy kiri, bar bab bawah | Dunia ABANGCOLEK, foto Sambal Colek asli, copy kiri, empat bab bawah |

## Masalah yang diperbaiki

| Pemerhatian | Pembetulan | Bukti akhir |
| --- | --- | --- |
| Foto bertindih dengan perenggan pada 390×700 | Mobile tinggi ≤740px menggunakan semua bab statik; 741–780px mengecilkan foto dan mengurangkan CTA sekunder | 390×700/320×568 statik; 430×760/320×760 scroll tanpa pertindihan teks/foto |
| Snapshot menganggap metadata boolean sebagai geometri tidak sah | Senarai medan nombor yang jelas dan regression test actual caller shape | Ujian model lulus |
| Perubahan viewport ketika bab pinned menghantar pengguna ke bawah story | Geometri viewport sebelum perubahan disimpan sehingga mode selesai diselaraskan | 320×760 bab 4 →390×700: bab 4 top120px, scrollY1108; sebelumnya top−2287px |
| Jar generik ilustrasi tidak mewakili produk sebenar | Jar generik dibuang daripada v2; foto TikTok asli digunakan secara berasingan | Screenshot desktop dan mobile; source link foto |

## Penerimaan runtime

- Desktop1280×800: stage top80px ketika bab aktif. Scroll berbalik bergerak rangkaian→penghantaran→produk; scroll ke packing memberikan camera scale1.31212 dan perubahan translation. Rentang finite melepaskan stage selepas hero.
- Keyboard Enter mengaktifkan bab 4. Inactive cards/produk menggunakan `inert`; outline focus tersedia.
- Skip katalog memfokuskan `#catalogue`, top104px; stage telah dilepaskan pada top−695px.
- Manual pause dari bab akhir kembali ke awal story dan memfokuskan toggle; resume kembali ke scroll.
- Dynamic reduced motion membuka semua empat bab. Ketika pengguna berada di katalog, tukar reduce/no-preference mengekalkan catalogue top103–103.5px tanpa ditarik semula ke hero. Pada desktop dua lajur, pemulihan memilih bab pertama dalam baris yang sedang kelihatan.
- Viewport diperiksa: 1280×800, 1366×600, 430×760, 375×812, 320×760, 390×700 dan 320×568. `scrollWidth` tidak melebihi `innerWidth` pada ukuran ini.
- Desktop1366×600: copy bottom459px dan navigator top508px. Tema light dan dark diperiksa; hero kekal cinematic dengan teks jelas.
- Sekatan kedua-dua world/mascot media menghasilkan tiada artwork, tetapi copy, CTA dan logo terus usable. Sekatan ujian dipadam selepas semakan.
- CTA produk membuka catalogue sebenar yang kosong; CTA pesanan membawa pengguna tanpa session ke login; lokasi dan halaman dealer berfungsi dengan keadaan kosong/terma yang jujur.

## Capture

- [Desktop bab 4](../var/log/hero-emons/desktop-chapter-four.png)
- [Desktop rendah tema light](../var/log/hero-emons/desktop-short-light.png)
- [Mobile430×760](../var/log/hero-emons/mobile-430-760.png)
- [Mobile320×760](../var/log/hero-emons/mobile-320-760.png)
- [Mobile bab 4](../var/log/hero-emons/mobile-chapter-four.png)
- [Mobile statik390×700](../var/log/hero-emons/mobile-static-390-700.png)

## Had keputusan

QA ini ialah browser lokal dan ukuran yang dinyatakan, bukan sijil WCAG penuh atau pengukuran Core Web Vitals. Logo sidebar disemak pada source; workspace authenticated tidak diwujudkan untuk screenshot. Foto TikTok ialah editorial dengan sumber, bukan produk/SKU/harga yang diterbitkan. Tiada business records disemai, native JEV assessment dijalankan atau perubahan diselaraskan ke AI Studio dalam skop ini.
