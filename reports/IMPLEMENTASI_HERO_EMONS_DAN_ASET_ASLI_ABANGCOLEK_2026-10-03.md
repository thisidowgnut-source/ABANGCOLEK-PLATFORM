---
title: "Pelaksanaan hero scroll Emons dan aset asli ABANGCOLEK"
date: "2026-10-03"
status: "COMPLETE_LOCAL_HERO_SCOPE"
project: "D:/ABANGCOLEK-OS"
scope: "Homepage scroll journey, original brand assets, editorial product image, browser acceptance"
---

# Pelaksanaan hero Emons dan aset asli ABANGCOLEK

## 1. Hasil dan status semasa

Homepage mempunyai hero dengan empat bab: Produk, Packing, Penghantaran dan Rangkaian pelanggan/ejen. Stage kekal pinned sepanjang perjalanan, manakala kamera ilustrasi bergerak mengikut kedudukan scroll. Butang bab membolehkan pengguna memilih destinasi dan pautan “Terus ke katalog” membawa pengguna kepada katalog sebenar.

**Status: COMPLETE untuk skop hero lokal yang dipersetujui.** Browser live, 150 ujian, TypeScript, production build selepas pembaikan resize terakhir dan review berasingan lulus. Sesi utama telah menutup QA akhir. Provenance aset serta had keputusan direkodkan di bawah.

Logo ialah artwork asal daripada repositori sumber. Foto Sambal Colek menggunakan poster video TikTok yang menunjukkan balang berpenutup hitam dan label merah jambu. Ilustrasi dunia ialah aset dekoratif yang dijana; ia dipaparkan bersama label “Ilustrasi dunia ABANGCOLEK”.

## 2. Struktur pelaksanaan

```text
┌─────────────────────────────────────────────┐
│ Homepage / LandingPage                      │
│ Logo asal + navigasi + pilihan tema          │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│ ScrollWorldHero                             │
│ Produk → Packing → Penghantaran → Rangkaian │
│ Stage pinned + kamera ikut scroll           │
│ Butang bab + pilihan statik + skip katalog  │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│ Katalog / API sebenar                       │
│ Nama, harga, stok dan published version     │
│ Loading / error / empty / pagination        │
└─────────────────────────────────────────────┘
```

| Fail | Tanggungjawab |
| --- | --- |
| `src/features/landing/story-model.ts` | Progress scroll, sempadan empat bab, target scroll serta pemeliharaan kedudukan viewport ketika mod paparan berubah. |
| `src/features/landing/ScrollWorldHero.tsx` | Hero, empat bab, kamera Motion, navigation, skip, mod statik serta fallback ilustrasi. |
| `src/features/landing/scroll-world.css` | Geometri pin, layer visual, responsive layout, focus, hover dan reduced motion. |
| `src/features/landing/LandingPage.tsx` | Integrasi hero dengan katalog dan navigasi public; metadata lifecycle sedia ada. |
| `src/features/brand/brand-assets.ts` | Rujukan aset logo, dunia dan foto editorial bersama dimensi serta URL sumber. |
| `src/features/brand/BrandLogo.tsx` | Komponen logo asal yang digunakan pada landing dan workspace. |
| `src/features/landing/landing.css` | Saiz logo dan susunan public landing. |
| `src/features/platform/AppRouter.tsx` | Penggunaan logo asal pada brand workspace. |
| `src/features/platform/platform-shell.css` | Saiz logo pada sidebar workspace. |
| `index.html` dan aset platform icon | Favicon menggunakan identiti jenama. |
| `tests/platform/landing-story.test.ts` | Ujian progress, geometri tidak sah, sempadan, reverse serta target bab. |

Listener scroll dan resize bersifat passive. Satu `requestAnimationFrame` menjadualkan pengiraan progress, manakala `ResizeObserver` mengesan perubahan geometri. Cleanup membuang listener, observer dan frame tertangguh. Transform kamera menggunakan Motion values supaya perubahan scroll tidak memerlukan render React bagi setiap pixel; state bab hanya berubah apabila bab aktif berubah.

Bab yang tidak aktif mempunyai `aria-hidden` dan `inert`. Mod statik mendedahkan keempat-empat bab dalam susunan bacaan biasa. Mod tersebut dipilih apabila pengguna meminta reduced motion, memilih butang pengurangan animasi atau menggunakan viewport rendah yang tidak sesuai untuk pinned stage: tinggi ≤560px pada semua lebar, atau lebar ≤750px bersama tinggi ≤740px. Pada mobile yang masih animasi antara 741–780px, foto dikecilkan kepada 110px dan CTA sekunder disembunyikan bagi memberi ruang bacaan. Snapshot geometri sebelum pertukaran mod membolehkan hero yang sedang dibaca ditambat semula dan kandungan selepas hero mengekalkan offset viewport; pertukaran preference tidak sepatutnya menghantar pengguna katalog kembali ke bahagian atas halaman.

## 3. Provenance aset dan sempadan penggunaan

### 3.1 Repositori sumber dan logo kanonikal

Sumber: [ABANG-COLEK — sample-image pada revision yang disemak](https://github.com/thisisniagahub/ABANG-COLEK/tree/e3f6498446414417feb1e583dad5bb6c0fc3eadc/sample-image).

Revision sumber ialah `e3f6498446414417feb1e583dad5bb6c0fc3eadc`. Pemeriksaan sumber oleh sesi utama membandingkan kesemua 18 fail asal lokal dengan bytes/SHA sumber pada revision tersebut. Pemeriksaan ini merujuk kepada fail asal; versi WebP ialah output encoding berasingan.

`ABANG-COLEX-LOGO-3.png` dipilih sebagai logo kanonikal kerana Git blob sumber `8dac33f28286cd7673c3f3173c8227de5771f00b` sama dengan `mobile/assets/images/abang-colek-logo.png`. Kod mobile `mobile/app/(tabs)/index.tsx:122` menggunakan aset tersebut. Pemilihan logo mempunyai rujukan penggunaan sebenar dalam aplikasi sumber.

SHA-256 fail PNG asal yang turut dibaca daripada worktree semasa:

```text
8970F768DAB551B7E5EB222BF8EF88D7DB8534A8E7DAF5C009BB7C8A7BDBF760
```

WebP `abang-colex-logo-original.webp` mengekalkan 1200 × 880 pixel dan berukuran 472,358 bytes. Perbandingan sesi utama mengesahkan RGB bagi pixel yang kelihatan serta alpha sama; komposit atas hitam dan putih juga sama. RGB tersembunyi di bawah alpha 0 sahaja dinormalisasi oleh encoding. Oleh itu bentuk, warna kelihatan dan ketelusan artwork asal dipelihara; fail WebP tidak mempunyai hash fail yang sama dengan PNG sumber.

### 3.2 Foto produk daripada TikTok

Sumber: [Video Sambal Colek pada akaun @styloairpool](https://www.tiktok.com/@styloairpool/video/7683047307016834322).

Sesi utama memeriksa sumber live. Poster asal ialah AVIF 405 × 720 pixel dan disimpan sebagai `var/lib/brand-reference/tiktok-sambal-colek-launch.avif`. Versi paparan `public/assets/brand/tiktok-sambal-colek-launch.webp` ialah WebP lossless, 405 × 720 pixel, 208,600 bytes. MD5 RGBA hasil perbandingan pixel ialah `84c84e53365121e76634055155595eae`.

Foto dipaparkan dalam bab Produk serta versi statik, dengan pautan sumber TikTok. Ia ialah foto editorial Sambal Colek. Ia tidak digunakan untuk menetapkan harga, stok, saiz pek atau hubungan SKU katalog yang belum disahkan. Nama/harga/stok katalog terus datang daripada API sebenar.

### 3.3 Ilustrasi dunia

`public/assets/brand/abangcolek-world-v2.webp` ialah ilustrasi dekoratif yang dijana melalui ImageGen built-in. Aset mempunyai dimensi 1774 × 887 pixel dan berukuran 289,212 bytes. Dunia tersebut mengandungi warehouse, van, booth dan crates buah untuk menyokong perjalanan visual.

Balang generik berwarna lime yang terdapat pada versi awal telah dibuang. Foto produk sebenar dipaparkan sebagai elemen editorial berasingan. Ilustrasi tidak membuktikan rupa premis, fleet, kapasiti stok, status penghantaran atau rangkaian operasi sebenar ABANGCOLEK.

#### Ringkasan arahan edit aset akhir

Mod generation ialah **built-in ImageGen image edit**, menggunakan ilustrasi v1 sebagai sumber. Ringkasan ini menerangkan arahan edit akhir; ia bukan salinan verbatim prompt asal.

Arahan edit membuang sepenuhnya balang lime besar berpenutup gelap pada foreground serta stone plinth, kemudian mengisi kawasan tersebut dengan permukaan tanah charcoal yang kelihatan semula jadi. Dunia miniatur violet/lime, workshop, van, booth Malaysia, crates buah, tanaman, lighting dan komposisi kamera nisbah 2:1 dipelihara. Tiada balang pengganti, label, logo atau teks ditambah pada ilustrasi.

Foto sumber TikTok tidak dimasukkan ke dalam proses edit ilustrasi. Ia kekal sebagai aset lossless berasingan yang dipaparkan melalui HTML dalam hero.

## 4. Data sebenar dan routing

`LandingPage` masih menggunakan `useResource` untuk `/catalogue` atau `/catalogue/:id`, serta `/public-info`. Nama produk, description, `priceSen`, `availableQuantity`, `packSize` dan `publishedVersion` dibaca daripada kontrak `PublicProduct`.

Katalog menyediakan loading, retry apabila error, keadaan kosong yang jujur dan pagination. CTA hero menghala kepada `/products`, `/customer/orders`, `/locations` dan `/become-dealer`; akses private diteruskan melalui router/membership sedia ada. Foto editorial tidak menambah produk ke katalog. Tiada business data disemai untuk menjadikan landing kelihatan penuh.

Metadata Product berstruktur mengikuti produk API dan dibuang apabila keluar ke workspace private. Skop hero tidak menambah metrik operasi, testimoni, prestasi perniagaan, confidence JEV atau keputusan native JEV assessment. Tiada penilaian native JEV dijalankan untuk menyokong laporan ini.

## 5. Matriks penerimaan

Keputusan runtime berikut direkodkan daripada pemeriksaan browser live oleh sesi utama pada worktree lokal. Ia meliputi skop hero dan integrasi public yang dinyatakan; keputusan source review sahaja tidak digunakan sebagai pengganti browser QA.

| Kriteria | Implementasi / bukti sumber | Status runtime |
| --- | --- | --- |
| Empat bab lengkap | Produk, Packing, Penghantaran, Rangkaian dalam `ScrollWorldHero.tsx`. | Lulus live; empat bab dan empat kad statik |
| Scroll forward | Kamera transform serta bab berubah mengikut progress. | Lulus live; packing pada scrollY 1048, camera scale 1.31212 |
| Scroll reverse | Progress dikira daripada geometri semasa. | Lulus live; rangkaian 2248 → penghantaran 1448 → produk 648 |
| Stage pinned | CSS sticky dengan top header. | Lulus live; stage top 80px pada desktop 1280 × 800 |
| Unpin selepas bab terakhir | Rentang pin finite dan katalog selepas hero. | Lulus live; stage top −695px selepas skip |
| Chapter navigation | Empat butang dengan `aria-current="step"` dan target inset. | Lulus live; Enter bab 4 menuju scrollY 2122 |
| Skip katalog | Anchor ke `#catalogue`, scroll dan focus. | Lulus live; focus `catalogue`, catalogue top 104px |
| Keyboard / focus | Native controls, inactive scenes inert dan outline `focus-visible`. | Lulus live; chapter Enter, catalogue focus dan toggle focus |
| Mobile 320px | Animasi 320 × 760, statik 320 × 568. | Lulus live; tiada overflow pada viewport diperiksa |
| Tiada horizontal overflow | Lebar/layout diukur pada viewport mobile dan desktop. | Lulus live pada viewport dalam jadual QA |
| Tindakan tidak bertindih | Geometri copy/foto/navigator diukur selepas pembaikan. | Lulus live; 320 × 760 CTA kanan 150px < foto kiri 171px |
| Light dan dark | Theme toggle melalui landing/router. | Lulus live; light turut diperiksa |
| Reduced motion | Semua empat bab dibaca dalam mod statik. | Lulus live; bab 4 top 80px selepas preference reduce |
| Toggle statik | Focus manual dan offset downstream dipelihara. | Lulus live; catalogue top 103px/103.5px apabila reduce/unreduce |
| Resize ke statik | Snapshot sebelum svh resize mengekalkan bab yang sedang dibaca. | Lulus live; 320 × 760 bab 4 → 390 × 700, bab 4 top 120px |
| Media failure | World → maskot → tiada imej, copy/CTA kekal. | Lulus live; kedua-dua media diblok, 0 artwork dan CTA masih usable |
| Logo asal | SHA-256, Git blob dan perbandingan pixel asal. | Disahkan sumber serta imej live 1200px lebar intrinsic |
| Foto produk asli | Poster TikTok live dan RGBA lossless. | Disahkan sumber; foto dipaparkan pada viewport QA |
| Tiada jar generik pada dunia akhir | World v2 dipaparkan dengan foto editorial berasingan. | Disahkan visual sesi utama |
| API/catalogue sebenar | `useResource`/`PublicProduct`; keadaan kosong jujur. | Lulus live; /products empty state sebenar |
| TypeScript | Dua konfigurasi melalui script lint sedia ada. | Lulus menurut output sesi utama |
| Ujian model/platform | Full suite selepas regression resize terakhir. | 150 pass / 0 fail; 856 assertions; targeted akhir 9 pass / 29 assertions |
| Production build | Script `build` sedia ada termasuk prerender public. | Lulus, exit 0 |
| Review berasingan | Kedua-dua reviewer source gate clear; generic reviewer membaca semula viewport patch akhir. | Lulus; final review APPROVE |

## 6. Bukti runtime dan pemeriksaan akhir

Bahagian ini merekodkan hasil yang dihantar sesi utama serta build yang dijalankan untuk laporan. Tiada console-error count, byte transfer atau Core Web Vitals direka daripada pemeriksaan ini.

| Pemeriksaan | Keputusan | Bukti |
| --- | --- | --- |
| Full suite selepas regression resize akhir | 150 pass, 0 fail, 856 assertions, 42 fail ujian, 23.58s | `var/log/hero-emons/tests-final.log`, timeout budget 15s. |
| Targeted selepas regression resize akhir | 9 pass, 29 assertions | Ujian model geometri/resize, disahkan sesi utama. |
| TypeScript | Lulus | Dua konfigurasi TypeScript melalui script lint, disahkan sesi utama. |
| Production build | Lulus, exit 0 selepas pembaikan resize akhir | `var/log/hero-emons/build.log`; 2,280 modules, Vite 11.06s. |
| Browser desktop | Lulus live | 1280 × 800: stage top 80px, forward/reverse dan chapter navigation; 1366 × 600: copy bottom 459px < chapter rail 508px. |
| Browser mobile animasi | Lulus live | 375 × 812: description bottom 353px < photo top 447px; 320 × 760: 353px < 395px; 430 × 760: sekitar 360px < 395px. |
| Browser mobile statik | Lulus live | 390 × 700 dan 320 × 568: empat kad, tiada overflow; resize akhir mengekalkan bab 4 pada top 120px. |
| Accessibility interaction | Lulus live | Enter bab 4, focus catalogue, focus toggle manual, preference reduce/unreduce ketika hero dan selepas hero. |
| Media fallback | Lulus live | World dan maskot diblok: tiada artwork, CTA usable; aset dipulihkan selepas ujian. |
| Served assets / routes | Lulus live bagi skop | Logo intrinsic 1200px; products empty, packing menuju login, locations honest empty dan ejen landing valid. |
| Reload akhir / cleanup QA | Lulus live | Semua imej loaded; 0 error logs sejak final load; preference emulation dan sekatan media ujian dibuang. |
| Screenshot akhir | Tersimpan | Fail capture disenaraikan di bawah. |

### Screenshot penerimaan

| Viewport / keadaan | Fail |
| --- | --- |
| Desktop hero | [desktop-1280.png](../var/log/hero-emons/desktop-1280.png) |
| Desktop rendah, light theme | [desktop-short-light.png](../var/log/hero-emons/desktop-short-light.png) |
| Mobile 320 × 760 | [mobile-320-760.png](../var/log/hero-emons/mobile-320-760.png) |
| Mobile 430 × 760 | [mobile-430-760.png](../var/log/hero-emons/mobile-430-760.png) |
| Mobile bab Rangkaian | [mobile-chapter-four.png](../var/log/hero-emons/mobile-chapter-four.png) |
| Mobile statik 390 × 700 | [mobile-static-390-700.png](../var/log/hero-emons/mobile-static-390-700.png) |

Rujukan Emons 1280 × 800 dan implementasi lokal pada viewport sama telah dibuka bersama. Keputusan perbandingan visual serta penerimaan terperinci ialah PASS dalam [Design QA hero](DESIGN_QA_HERO_EMONS_2026-10-03.md). Screenshot tambahan: [rujukan Emons](../var/log/hero-emons/emons-reference-1280.png) dan [desktop bab Rangkaian](../var/log/hero-emons/desktop-chapter-four.png).

Selepas QA, browser kembali menggunakan preference sistem sebenar. Preference default browser ialah reduced motion, maka hero statik pada reload default ialah tingkah laku yang betul. Emulation preference sementara dan blocked media URLs telah dibersihkan.

Build selepas pembaikan resize akhir menghasilkan chunk landing JavaScript 149.57 kB (gzip 48.83 kB) dan CSS 25.41 kB (gzip 5.68 kB). Saiz ini ialah output build, bukan pengukuran network atau Core Web Vitals peranti. Prerender merekodkan catalogue version 0 dan 0 published products. Keadaan kosong tersebut digunakan dengan jujur; produk tidak disemai untuk memenuhi screenshot. HTML public perlu dibina semula apabila katalog berubah, mengikut mesej script prerender.

Run full suite pertama merekodkan 148 pass dan satu timeout pada public catalogue dengan had 5s ketika build/QA turut berjalan. Pengulangan menggunakan timeout budget 15s lulus sepenuhnya; tiada source workaround ditambah untuk menutup kegagalan tersebut. Selepas regression resize terakhir ditambah, full suite dijalankan semula dan menghasilkan 150 pass / 0 fail. Coverage run akhir ialah 87.61% functions dan 91.97% lines bagi modules yang diimport oleh suite. `story-model.ts` ialah 100% functions dan lines. Angka aggregate ini tidak merangkumi semua React component atau membuktikan seluruh repository mempunyai coverage yang sama.

## 7. Penutupan dan had skop

Kriteria skop hero mempunyai bukti runtime, TypeScript/ujian/build lulus, reviewer menutup penemuan skop dan sumber aset telah direkodkan. QA visual membandingkan adaptasi konsep: ilustrasi dunia isometrik, copy kiri, stage pinned, fokus melalui scroll dan navigasi bab. Kamera transform raster ini tidak menyediakan animasi objek atau renderer 3D seperti dunia Emons.

Pengesahan ini ialah untuk pelaksanaan lokal pada viewport yang dinyatakan. Ia bukan sijil WCAG penuh, pengukuran Core Web Vitals, deployment production atau audit semula keseluruhan fungsi bisnes. Logo sidebar telah disemak pada source; authenticated workspace tidak diwujudkan untuk screenshot. Tiada perubahan diselaraskan ke AI Studio dalam skop ini.

Delegasi sesi ini meliputi behavior hero, review kod, dokumentasi/build dan pemeriksaan CLI. Lihat [laporan delegasi AGY/Hermes](DELEGASI_JIMAT_TOKEN_AGY_HERMES_2026-10-03.md). Executable/help kedua-dua CLI diperiksa sahaja; tiada inference AGY/Hermes dijalankan, tiada model berbayar baharu digunakan dan tiada kadar penjimatan token direka.
