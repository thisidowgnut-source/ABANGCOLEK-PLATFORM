# Review LIVE Scroll Emons → ABANGCOLEK

**Tarikh:** 3 Oktober 2026  
**Rujukan:** [Emons, laman English](https://www.emons.de/en)  
**Status:** Review LIVE selesai untuk skop desktop, mobile viewport dan pemeriksaan sekunder di bawah.  
**Skop:** Tingkah laku hero sewaktu input, idle, navigasi, reverse, exit dan re-entry; perbandingan terhad dengan source hero ABANGCOLEK semasa.

## Keputusan utama

Hero Emons mempunyai perjalanan video dengan bab, transition, gerakan idle dan pelepasan ke halaman. Wheel mengubah perjalanan ketika `window.scrollY = 0`; selepas input berhenti, video terus bergerak dalam bab tersebut.

ABANGCOLEK menggunakan satu ilustrasi dengan perubahan scale/x/y dan empat bab copy. Adaptasi image pan ini belum melaksanakan perilaku utama Emons LIVE. Tanggapan bahawa pengalaman semasa sudah “sama seperti Emons” perlu diperbetulkan; persamaan susunan hero tidak membuktikan kesetaraan interaction.

Kekalkan kekuatan ABANGCOLEK: kawalan mengurangkan animasi, static mode untuk reduced motion/viewport pendek, chapter buttons semantik, kandungan tidak aktif `inert` dan akses terus ke katalog.

## Kaedah dan tahap bukti

Browser LIVE diuji pada desktop **1440 × 900** dan mobile emulation **390 × 844** melalui wheel, navigasi asal, hotspot pointer, keyboard dan reduced-motion preference. DOM runtime merekod playhead, playback, active chapter, stage dan native scroll. Idle disampel selepas input berhenti. **Tiada screenshot digunakan sebagai bukti.**

Angka ialah bacaan runtime sesi ini. Source ABANGCOLEK dibaca berasingan. Bukti browser tidak menentukan library, formula input atau keseluruhan engine Emons. Julat loop belum dipetakan hingga frame terakhir. [Log pemerhatian](D:/ABANGCOLEK-OS/var/log/emons-live-review/observations.json) menyimpan 36 entri bacaan ringkas; butiran manual/mobile tambahan turut direkodkan dalam laporan ini.

## Dapatan desktop LIVE

| Ujian | Bukti semasa | Implikasi pengalaman |
|---|---|---|
| Struktur hero | `.hero_video_el` ialah HTML video berdurasi kira-kira **46 saat**; `.scroll_wrap` setinggi **900px**; `.hero_video_wrap` sticky pada `top: 0` | Satu media timeline menjadi asas perjalanan; stage kekal di viewport semasa bab diterokai. |
| Wheel ke hadapan | Pada native `scrollY = 0`, playhead bergerak **9.175 → 19.601 → 26.640**; active nav berubah melalui Road, Logistics, Air & Sea dan Rail | Hero mempunyai kemajuan cerita yang boleh berubah sebelum halaman bergerak secara normal. |
| Idle Logistics | Sampel **0 / 500 / 1000 / 1500ms**: **16.864 → 11.248 → 11.749 → 12.263**, dengan `paused = false` | Gerakan diteruskan tanpa input. Lompatan balik kemudian kenaikan masa menyokong pemerhatian loop dalam scene. |
| Reverse | Dari Rail, input ke belakang kembali kepada Air & Sea, playhead **20.134**, `scrollY = 0` | Perjalanan menerima arah balik; reverse mesti ditentukan sebagai perilaku tersendiri. |
| Klik Logistics | Navigasi asal membawa video ke **11.886**, `scrollY = 0` | Chapter navigation boleh mengubah scene secara terus tanpa native page displacement. |
| Klik Digital | Bab kelima mencapai section `top = 0`, playhead **36.654**, tetapi active class tiada pada semua chapter buttons ketika diperiksa | Target visual dicapai; penanda bab aktif mempunyai caveat yang perlu direkodkan. |
| Exit dan re-entry | Digital idle dibaca **41.692**; wheel berikutnya menghasilkan `scrollY = 705`, stage `top = −705`, kemudian `1615 / −1615`. Naik dua halaman kembali kepada `scrollY = 0`, masa **28.356** | Stage akhirnya melepaskan pengguna ke halaman. Re-entry berlaku, tetapi tidak membuktikan ia mengembalikan scene terakhir secara tepat. |

Scene berubah sebelum native page scroll; setelah scene akhir, input membawa halaman turun. ABANGCOLEK perlu kontrak konsisten untuk wheel, trackpad, touch, keyboard dan chapter buttons, termasuk cara keluar yang jelas.

## Hotspot, keyboard dan motion preference

Hotspot Digital ialah `DIV` tanpa `role`, `tabindex` atau label ARIA. Pointer click mengembangkan `.hero_card_wrap` daripada **0** kepada **360.734px**. Escape tidak menutupnya; klik semula memulakan penutupan. Akses keyboard yang setara belum terbukti.

Dengan fokus Road, PageDown tidak memajukan scene; native y masih `0` pada bacaan susulan. Ini tidak membuktikan semua keyboard paths gagal. ABANGCOLEK memerlukan Tab, Enter/Space, akses keluar hero serta close control dan pengurusan fokus panel.

Video mempunyai `muted = true`, `controls = false`, `loop = false`, tanpa autoplay attribute, tetapi runtime `paused = false`. Ketiadaan attribute itu tidak bermakna playback berhenti. Pause/motion control tidak ditemui dalam hero yang diperiksa.

Dynamic reduced motion dan fresh load dengan preference tersebut masih memainkan video; fresh load: **0.692s**, `readyState = 4`, `paused = false`. Keadaan ujian tidak menghasilkan hero statik. Ini bukan audit penuh WCAG. Media baharu ABANGCOLEK mesti menghormati reduced motion sejak load pertama.

## Dapatan mobile LIVE

Fresh load **390 × 844**, preference normal: hero **844px**, video wrap `display: block`, desktop rail tersembunyi dengan sifar pautan terlihat. Overlay scene/nombor bab kekal; mobile turut menggunakan perjalanan video.

Wheel separuh halaman mengubah playhead kepada **9.445**, native y `0`. Transition: Road `top = −790`, Logistics `54`; setelah settle: Logistics `0`, Road `−844`, video **13.714**, stage `0`. Reverse wheel diuji. Gerak camera atau objek tertentu tidak dinilai secara visual.

Hotspot Logistics: `DIV` **36px**, tanpa role/tabindex. Klik membuka panel **339.61px** tinggi, **344.67px** lebar, `left = 16.06px`; lebar scroll dokumen **390px**, tanpa horizontal overflow keadaan tersebut. **Finger touch, momentum gesture dan hardware telefon tidak diuji**; bukti menggunakan viewport emulation/wheel. Touch sebenar diperlukan sebelum mobile dinyatakan siap.

## Scroll halaman dan FAQ

Selepas Digital, wheel menghasilkan native y **720**, stage `top = −720`. Pada y **1967**, `.home_sticky_s` berada pada `−197.625` dengan tinggi **1800px**; child `.home_sticky_content` pada **41.796875**, tinggi **900px**. Wheel ke y **2428** mengubah section kepada `−658.625` sementara child kekal **41.796875**: pinned panel kedua disahkan. End membawa pengguna ke footer pada y **9040**.

Klik FAQ “What does a freight forwarding company do?” menghasilkan `aria-expanded = true`, content height **125.390625px**; klik kedua: `false`, tinggi **0**. Heading FAQ masih German, “Häufige Fragen rund um Spedition und Transport”, dalam halaman English: caveat localization kecil. Dapatan ini mengesahkan perjalanan bersambung kepada scroll biasa dan kawalan kandungan halaman, bukan hanya hero.

## Perbandingan dengan source ABANGCOLEK semasa

| Aspek | Source ABANGCOLEK yang dibaca | Jurang terhadap rujukan LIVE |
|---|---|---|
| Media dunia | [`ScrollWorldHero.tsx:156`](D:/ABANGCOLEK-OS/src/features/landing/ScrollWorldHero.tsx:156) merender `motion.img`; camera transform ditentukan pada baris 38–40 | Tiada segmented video atau timeline gerakan scene dalam komponen ini. |
| Pembahagian cerita | Empat bab Produk, Packing, Penghantaran dan Rangkaian; [`story-model.ts:12`](D:/ABANGCOLEK-OS/src/features/landing/story-model.ts:12) membahagi progress kepada empat bahagian | Scene berubah mengikut progress; intro, transition dan idle belum dimodelkan berasingan. |
| Input dan exit | [`story-model.ts:7`](D:/ABANGCOLEK-OS/src/features/landing/story-model.ts:7) mengira progress daripada geometri section/stage; chapter click menggunakan native `window.scrollTo` | Mekanisme asas berbeza daripada pergerakan Emons ketika native y kekal sifar. |
| Interaksi dunia | Visual dunia `aria-hidden`; actions berada dalam articles dan chapter navigation | Tiada world hotspots interaktif dalam komponen yang dibaca. |
| Motion accessibility | `staticMode` menggabungkan reduced motion, manual pause dan viewport pendek; butang kawalan pada baris 165 | Asas yang baik untuk dibawa ke media engine baharu, dengan verifikasi LIVE selepas implementasi. |
| Akses kandungan | Inactive articles menggunakan `aria-hidden` dan `inert`; chapter buttons mempunyai `aria-current`; skip memindahkan scroll serta fokus ke katalog | Kawalan semantik ini patut kekal semasa interaction diperluas. |

Perbandingan ini terhad kepada dua fail source; ia tidak membuktikan served behavior ABANGCOLEK. Kod aplikasi tidak diubah.

## Prioriti adaptasi yang dicadangkan

```text
+-----------------------------+
| Intro media ABANGCOLEK       |
+--------------+--------------+
               |
               v
+-----------------------------+
| Scene aktif + gerakan idle   |
| Chapter / hotspot / input    |
+--------------+--------------+
               |
               v
+-----------------------------+
| Transition ke depan/belakang |
+--------------+--------------+
               |
               v
+-----------------------------+
| Scene akhir -> exit hero     |
| Kandungan + katalog biasa    |
+-----------------------------+

Reduced motion / media gagal
               |
               v
+-----------------------------+
| Cerita statik + actions      |
| Akses terus ke katalog       |
+-----------------------------+
```

| Prioriti | Kerja | Syarat penerimaan |
|---|---|---|
| **P0 — Kontrak scene** | Tetapkan intro, transition, idle, reverse, exit dan re-entry sebagai state yang boleh diperiksa | Input berturut-turut tidak melangkau state secara rawak; arah balik, chapter click dan exit menghasilkan scene serta fokus yang dijangka. |
| **P0 — Media asal** | Sediakan gerakan dunia ABANGCOLEK yang tersendiri; tetapkan per scene media atau segment boundaries serta poster fallback | Gunakan produk sebenar dan logo yang disahkan. Semak sumber, hak penggunaan, bentuk packaging dan resolusi; elakkan salinan aset Emons. |
| **P0 — Akses selamat** | Kekalkan skip, reduced-motion fallback, pause dan cara membaca cerita tanpa animasi | Fresh load reduced motion tidak memulakan gerakan besar; keyboard dan touch boleh keluar; error media tidak mengunci halaman. |
| **P1 — Hotspot bermakna** | Gunakan button semantik dengan label, focus state, close control dan tindakan daripada data sebenar | Enter/Space membuka, Escape menutup apabila sesuai, fokus kembali ke pemicu; setiap hotspot membawa manfaat produk atau navigasi nyata. |
| **P1 — Mobile dan prestasi** | Tentukan touch contract, chapter access dan layout panel; hadkan preload dan decode media | Uji finger touch sebenar; kandungan, bab dan CTA boleh dicapai tanpa overlap; media lambat mempunyai fallback; tiada scroll trap. |
| **P2 — Ketepatan state UI** | Selaraskan active chapter, copy, hotspot dan media time; ukur transition ketika input cepat | Penanda tidak hilang pada bab akhir seperti caveat Digital yang diperhatikan; status tidak bergantung pada CSS visual sahaja. |

Gunakan produk disahkan, proses benar dan tindakan tersedia. Jangan reka jumlah pesanan, aktiviti packing, metrik pelanggan, status fulfilment atau confidence/kemampuan JEV. Data belum tersedia: gunakan copy penerangan dan pautan sebenar.

## Batas review dan kerja susulan

Frame pacing, download size, bandwidth conditions, screen reader, seluruh hotspot dan semua kombinasi keyboard belum diuji. Tiada performance benchmark dilakukan. Playhead bukan segment specification final. Tiada canvas ditemui dalam hero; GSAP/engine khusus tidak disahkan. Touch hardware belum diuji.

Seterusnya: kunci spesifikasi scene/media asal, kemudian sahkan LIVE forward, reverse, idle, chapter navigation, hotspot, exit, re-entry, reduced motion dan gagal media. Keputusan siap memerlukan bukti served behavior. Pengalaman Emons belum diterapkan sepenuhnya pada ABANGCOLEK.
