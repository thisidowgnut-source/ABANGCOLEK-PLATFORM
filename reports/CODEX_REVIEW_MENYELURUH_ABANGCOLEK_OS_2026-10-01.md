# Review Menyeluruh ABANGCOLEK-OS

**Tarikh:** 1 Oktober 2026 (Asia/Kuala_Lumpur)

**Skop:** Kod aplikasi, konfigurasi, aliran deployment, dokumentasi, aset dan katalog skill, termasuk semua 22 skill JEV.

**Kaedah:** Inventori Git; semakan kod dan panggilan antara modul; `jev-review`, `skill-quality-gate` dan `multi-skill-orchestration`; semakan dokumentasi rasmi TypeSafe, Supabase dan Google Maps; audit dependency menggunakan `bun audit --audit-level=high`.

**Status:** Review baca sahaja. Dapatan pangkalan data langsung, bundle production dan UI berjalan belum disahkan.

## Ringkasan

Inventori menemui **329 fail yang dijejaki Git**, termasuk **48 fail di `src/`** dan **172 fail `SKILL.md`**, dengan **22 skill JEV**. Dapatan paling mendesak ialah kemungkinan pendedahan kunci Gemini dalam bundle pelayar, pintasan login staf dengan kelayakan bersama, dasar RLS yang terlalu luas dalam SQL projek, dan operasi pesanan yang boleh melaporkan kejayaan walaupun simpanan awan gagal.

Laporan sedia ada `reports/FORENSIK_AUDIT_JEV_DAN_KOD_ABANGCOLEK_OS_2026.md` tidak diubah. Fail itu belum dijejaki Git semasa review ini. Beberapa dakwaannya bercanggah dengan kod semasa; rujuk bahagian **Pembetulan terhadap laporan terdahulu**.

## Dapatan mengikut keutamaan

### 1. Kritikal — Kunci Gemini berisiko dihantar kepada pelayar

- **Bukti:** `vite.config.ts:11-17` memuatkan `GEMINI_API_KEY` dan memasukkannya melalui `define` sebagai `process.env.GEMINI_API_KEY`. Kod klien menggunakannya dalam `src/services/gemini.ts:45` dan `src/services/jevEngine.ts:14`.
- **Kesan:** Jika kunci dibekalkan semasa build, nilainya boleh terkandung dalam JavaScript yang dihantar kepada pengguna. Had kadar dan kawalan kos di server aplikasi juga tiada pada laluan ini.
- **Cadangan:** Pindahkan panggilan Gemini ke endpoint server yang mengesahkan pengguna, mengehadkan kadar permintaan dan memberi kebenaran bagi setiap tindakan. Putar kunci jika bundle yang mengandunginya pernah diterbitkan. Semak bundle yang benar-benar dihidang sebelum menyatakan pendedahan production telah berlaku.

### 2. Kritikal — Pintasan login staf menggunakan kelayakan bersama

- **Bukti:** `src/services/supabaseAuth.ts:117-144` mengandungi kata laluan bersama untuk `quickStaffSignIn`. Butang HQ dan stokis boleh dicapai dari `src/App.tsx:295-309` dan `src/App.tsx:1554-1556`. Pada kegagalan auth, fungsi itu membina objek `User` yang kelihatan mempunyai audience `authenticated` tetapi tiada sesi sebenar.
- **Kesan:** Jika kelayakan tersebut sah, pengguna yang mendapat kod klien boleh cuba masuk sebagai staf. Jika gagal, UI masih boleh tersalah anggap pengguna telah log masuk.
- **Cadangan:** Buang pintasan awam, putar kelayakan berkaitan, dan tentukan peranan daripada sesi Supabase yang sah serta semakan kebenaran di server/RLS. Kesahan kelayakan pada sistem langsung belum diuji.

### 3. Kritikal jika digunakan — SQL projek memberi akses awam yang terlalu luas

- **Bukti:** `src/services/supabaseClient.ts:129-138` mengandungi dasar yang membenarkan bacaan awam pada pesanan dan log JEV, serta sisipan awam pada pesanan dengan syarat yang sentiasa benar.
- **Kesan:** Jika SQL ini digunakan pada pangkalan data yang terdedah melalui Data API, data pelanggan boleh dibaca dan pesanan boleh disisip tanpa kawalan pemilikan yang sesuai.
- **Cadangan:** Audit dasar RLS **pada pangkalan data langsung**, kemudian tetapkan dasar mengikut pemilik, peranan dan operasi. Uji permintaan sebagai `anon`, pengguna biasa dan staf. Kod repositori tidak membuktikan dasar tersebut sudah digunakan pada database langsung.
- **Rujukan:** [Supabase — Securing your data](https://supabase.com/docs/guides/database/secure-data).

### 4. Tinggi — Kegagalan simpan pesanan boleh dilaporkan sebagai berjaya

- **Bukti:** `src/services/supabaseOrders.ts:157-180` boleh mengembalikan `success: true` selepas sisipan Supabase gagal kerana data telah disimpan setempat. Laluan kemas kini pada `:191-209` tidak mengesahkan ralat atau bilangan baris yang berubah. `src/components/OrdersView.tsx:73-103` mengabaikan keputusan operasi sebelum menutup modal atau memuat semula senarai.
- **Kesan:** Pesanan, status penghantaran atau refund mungkin kelihatan selesai dalam UI tetapi tidak wujud dalam pangkalan data awan.
- **Cadangan:** Bezakan `saved_locally`, `synced` dan `failed`; semak ralat serta bilangan baris yang diubah; paparkan status sebenar kepada pengguna dan sediakan proses penyelarasan semula.

### 5. Tinggi — Skema pesanan tidak sepadan dengan kod penulisan

- **Bukti:** SQL dalam `src/services/supabaseClient.ts:95-105` mentakrif `location` dan `total_amount`, sedangkan `src/services/supabaseOrders.ts:29-39` dan `:145-155` menulis `city`, `amount`, `order_id` dan beberapa kolum lain yang tiada dalam skema tersebut.
- **Kesan:** Pemasangan baharu yang menggunakan SQL projek ini akan menolak operasi simpan pesanan.
- **Cadangan:** Wujudkan satu migrasi dan model data kanonik. Uji cipta pesanan, kemas kini status dan refund terhadap skema kosong yang dibina daripada migrasi itu.

### 6. Tinggi — Import konfigurasi Firebase tidak dapat diselesaikan dalam checkout ini

- **Bukti:** `src/services/googleAuth.ts:15` mengimport `../../firebase-applet-config.json`. Fail tersebut tiada di akar projek atau direktori induk yang dirujuk semasa review.
- **Kesan:** Resolusi modul build akan gagal jika tiada mekanisme luar yang menyediakan fail itu.
- **Cadangan:** Gunakan konfigurasi environment yang sah, dokumentasikan pemboleh ubah yang diperlukan, kemudian jalankan build sebenar. Build belum dijalankan kerana dependency tidak tersedia dalam checkout ini.

### 7. Tinggi — JEV memberi keyakinan tinggi kepada hasil yang tiada bukti lengkap

- **Bukti:** `src/services/jevEngine.ts:159-230` mengisi medan model yang hilang dengan kelas dan skor keyakinan tinggi. Apabila panggilan model gagal, `:235-275` menghasilkan keputusan peraturan tempatan dengan keyakinan sekitar 0.9 atau lebih bagi banyak dimensi.
- **Kesan:** Pengguna dan automasi boleh membaca hasil sandaran sebagai keputusan model yang telah dibuktikan.
- **Cadangan:** Sahkan respons terhadap skema penuh; sertakan `source` dan `fallbackReason`; gunakan kelas `UNKNOWN` atau keperluan semakan manusia apabila bukti tidak cukup. Jangan reka taburan kebarangkalian daripada nilai default.

### 8. Tinggi — Tindakan “draf emel” JEV sebenarnya menghantar emel

- **Bukti:** `src/services/jevEngine.ts:307-314` memanggil `sendGmailMessage` ke alamat tetap, tetapi mesej kejayaan menyebut draf. UI memanggil tindakan ini dari `src/components/AbangColekDiscoveryView.tsx:225-234`.
- **Kesan:** Teks pelanggan boleh dihantar kepada penerima yang tidak dimaksudkan dan pengguna diberi gambaran bahawa emel belum dihantar.
- **Cadangan:** Gunakan API draf sebenar, benarkan penerima dipilih dan disahkan, serta paparkan tindakan yang benar-benar berlaku.

### 9. Tinggi — Pelaksanaan “JEV System-1” menggunakan Gemini, bukan API Jev

- **Bukti:** `src/services/jevEngine.ts:110-152` meminta Gemini menjana JSON lalu memprosesnya. Tiada dependency TypeSafe dalam `package.json`. `README.md:18` pula mendakwa enjin TypeSafe JEV berkependaman kurang daripada 50 ms.
- **Kesan:** Sifat keputusan bertaip, taburan kebarangkalian dan kependaman Jev rasmi tidak boleh diandaikan bagi pelaksanaan ini. Angka keyakinan yang dibina oleh kod bukan keluaran TypeSafe.
- **Cadangan:** Sama ada integrasikan API rasmi TypeSafe pada server dengan `state` dan soalan `Choice`/`Score`/`Noul`, atau namakan modul ini secara jujur sebagai pengelas berasaskan Gemini. Ukur kependaman sebenar sebelum mengekalkan sebarang dakwaan prestasi.
- **Rujukan:** [TypeSafe — Introduction](https://docs.typesafe.ai/introduction), [TypeSafe — Quick start](https://docs.typesafe.ai/introduction/quickstart).

### 10. Sederhana — Invarian punca kebocoran dan taburan kebarangkalian tidak konsisten

- **Bukti:** Prompt dalam `src/services/jevEngine.ts:122` membenarkan punca disahkan jika ada bukti fizikal. Tetapi `:196-202` memaksa `UNDETERMINED` bagi semua `LEAKAGE`/`SEAL_FAILURE`, serta sentiasa meletakkan `UNDETERMINED` dalam `probabilities` walaupun nilai keputusan lain dibenarkan.
- **Kesan:** Bukti sah boleh diabaikan dan paparan nilai serta kebarangkalian boleh bercanggah.
- **Cadangan:** Tentukan secara eksplisit bukti yang diterima, asingkan pengesahan bukti daripada klasifikasi model, dan pastikan peta kebarangkalian sejajar dengan nilai keputusan.

### 11. Sederhana — CI, ujian dan dependency belum menjadi quality gate yang boleh diulang

- **Bukti:** `.github/workflows/vercel-deploy.yml:21-43` menggunakan cache dan `npm install`, tetapi repositori hanya mempunyai `bun.lock`, tanpa `package-lock.json` atau `npm-shrinkwrap.json`. Workflow membina sebelum deploy tanpa typecheck dan ujian aplikasi. `package.json:11` menamakan `tsc --noEmit` sebagai `lint`; `tsconfig.json` tidak mengaktifkan `strict`. Tiada fail ujian aplikasi ditemui di luar katalog skill.
- **Kesan:** Pemasangan CI berkemungkinan gagal sebelum build, dan perubahan pesanan/auth/JEV boleh terlepas tanpa ujian tingkah laku.
- **Cadangan:** Pilih satu package manager dan pemasangan terkunci; tambah typecheck, ujian integrasi pesanan/auth/RLS, dan ujian aliran kritikal sebelum deploy. Jalankan gate itu pada commit yang sama dengan deployment.

### 12. Sederhana — Audit dependency menemui advisory tahap tinggi

- **Bukti:** `bun audit --audit-level=high` keluar dengan kod 1 untuk `@grpc/grpc-js@1.9.16` melalui rantaian Firebase; advisory [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j).
- **Kesan:** Rantaian dependency mengandungi versi terjejas. Kebolehcapaian isu ini dalam bundle pelayar belum dibuktikan.
- **Cadangan:** Kemas kini rantaian dependency kepada versi yang menutup advisory, semak kesan pada lockfile, kemudian ulang audit dan build.

### 13. Sederhana — Kunci Google Maps diulang dan panduan environment mengelirukan

- **Bukti:** Nilai kunci Maps yang kelihatan nyata berada dalam `.env.example:1`, `.github/workflows/vercel-deploy.yml:35`, `src/components/MapsView.tsx:31` dan `src/components/BusFreightView.tsx:67` sebagai konfigurasi/fallback.
- **Kesan:** Kunci Maps pelayar memang kelihatan kepada pengguna; risiko sebenar bergantung pada sekatan HTTP referrer, API dan kuota, yang belum disahkan dalam review ini. Mengulang nilainya dalam kod menyukarkan putaran dan menggalakkan konfigurasi yang salah.
- **Cadangan:** Semak sekatan dan penggunaan di Google Cloud, buang fallback berkod keras, guna placeholder dalam `.env.example`, dan putar kunci jika ia tidak disekat atau telah disalah guna. Kunci Supabase `sb_publishable_` ialah pengecam klien yang dibenarkan; keselamatannya bergantung pada RLS.
- **Rujukan:** [Google Maps — API security best practices](https://developers.google.com/maps/api-security-best-practices), [Supabase — Securing your data](https://supabase.com/docs/guides/database/secure-data).

### 14. Sederhana — Katalog skill luas tetapi kebanyakannya belum operasional

- **Bukti:** Semua 22 fail di `skills/jev-core/` mempunyai langkah pelaksanaan umum yang sama. `skills/jev-core/dev-workflow/jev-review/SKILL.md:22-27`, misalnya, tidak menetapkan cara membaca diff, kriteria risiko, format dapatan atau langkah pengesahan. `skills/jev-core/build-and-judge/canny/SKILL.md:22-27` menggunakan langkah serupa walaupun tujuannya lain. Sebanyak 135 skill lain juga banyak berkongsi templat generik; `skills/meta/skill-quality-gate/SKILL.md` dan contoh lain merujuk kepada profil stack umum yang tidak semestinya sepadan dengan projek.
- **Kesan:** Nama skill memberi gambaran keupayaan khusus yang belum disokong oleh prosedur, skema, fixture atau benchmark dalam direktori berkenaan.
- **Cadangan:** Utamakan skill yang digunakan dalam operasi sebenar. Bagi setiap satu, nyatakan input, alat, langkah khusus, bukti yang perlu dikumpul, kriteria lulus/gagal, contoh dan cara menangani kegagalan. Anggap dakwaan `<50ms` sebagai sasaran sehingga diukur.

### 15. Rendah hingga sederhana — Dokumentasi dan laporan audit tidak selaras dengan keadaan semasa

- **Bukti:** `docs/KATALOG_DAN_PANDUAN_SKILL_EJEN_AI.md:1` menyebut 136 skill sedangkan inventori menemui 172. `docs/AUDIT_TERPERINCI_KESELURUHAN_PROJEK_ABANGCOLEK_OS.md:270-277` membuat dakwaan typecheck dan kesiapan production yang tidak dibuktikan bagi checkout semasa. Terdapat dua pasangan laporan dalam `docs/` dan `reports/` yang sama secara byte.
- **Cadangan:** Hasilkan angka inventori secara automatik, letakkan tarikh dan bukti build pada dakwaan status, dan pilih satu lokasi kanonik untuk setiap laporan.

## Pembetulan terhadap laporan terdahulu

Laporan tidak dijejaki Git `reports/FORENSIK_AUDIT_JEV_DAN_KOD_ABANGCOLEK_OS_2026.md` menyatakan `msg.hasJev` tiada daripada chat. Kod semasa **mempunyai** butang `msg.hasJev` yang membuka Hab JEV di `src/App.tsx:740-746`. Dapatan yang tepat ialah butiran `jevData` tidak dipaparkan terus di dalam mesej chat; laluan ke hab sudah wujud.

Laporan itu juga menganggap kunci Supabase publishable sebagai kebocoran rahsia. Kunci `sb_publishable_` direka untuk digunakan dalam klien; risiko akses data perlu dinilai melalui dasar RLS. Bagi Google Maps, kehadiran kunci dalam pelayar sahaja tidak membuktikan penyalahgunaan. Sebaliknya, `GEMINI_API_KEY` yang disuntik ke bundle ialah risiko rahsia server yang perlu diberi keutamaan.

## Susunan pembaikan yang dicadangkan

1. **Sekat risiko akses dan rahsia:** keluarkan Gemini dari pelayar; buang pintasan staf; semak dan ketatkan RLS pada database langsung.
2. **Pulihkan integriti transaksi:** satukan skema pesanan, betulkan hasil operasi awan dan UI, serta uji kes kegagalan dan penyelarasan.
3. **Pulihkan build yang boleh diulang:** selesaikan konfigurasi Firebase, seragamkan package manager, kemudian tambah typecheck dan ujian kepada CI.
4. **Betulkan automasi JEV:** hentikan penghantaran emel yang dilabel draf; bezakan fallback daripada keputusan model; pilih antara integrasi Jev rasmi atau penamaan semula modul Gemini.
5. **Kemas kini dokumentasi dan skill:** ukur prestasi sebenar, tulis prosedur khusus untuk skill aktif, dan selaraskan semua dakwaan dengan hasil ujian terkini.

## Pengesahan dan had

- `git diff` dan `git diff --staged` kosong semasa audit asal; satu fail laporan audit sedia ada belum dijejaki Git.
- `bun audit --audit-level=high` melaporkan satu advisory tahap tinggi seperti dinyatakan di atas.
- `node_modules` tiada. `npm run lint` tidak mencapai semakan TypeScript kerana `tsc` tidak tersedia; build dan ujian aplikasi tidak dijalankan. Tiada dependency dipasang.
- Status RLS langsung, kesahan kelayakan staf, sekatan kunci Google Maps, bundle production dan tingkah laku UI berjalan belum disahkan. Semakan kod setempat tidak boleh menggantikan pengesahan tersebut.
- Review ini ialah senarai dapatan dan cadangan, bukan dakwaan bahawa masalah telah dibaiki.
