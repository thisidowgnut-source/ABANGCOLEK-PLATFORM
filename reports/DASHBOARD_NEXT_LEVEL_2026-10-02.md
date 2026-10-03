# Dashboard UI/UX Next Level — 2 Oktober 2026

## Perubahan

- Hero command centre emerald dengan accent emas, visual hierarchy jelas dan meja operasi yang membuka rekod sebenar.
- Snapshot fulfillment berdasarkan filter aktif: kadar selesai, bilangan selesai, tertunda dan wilayah mempunyai nilai. Paparan tanpa rekod menggunakan dash untuk kadar selesai.
- Palette cream/emerald untuk light theme dan emerald gelap untuk dark theme; KPI, panel, table dan carta diselaraskan.
- Reset filter muncul apabila wilayah/tempoh aktif. Carian pesanan mempunyai tindakan kosongkan yang berasingan.
- Mobile layout responsif, tiga lajur shortcut, ruang bawah safe area; hover hanya bagi pointer fine, active response dan reduced-motion.
- Sumber rekod tempatan/seed contoh terus dilabel. Tiada data atau trend direka. JEV digunakan sebagai prinsip bukti dahulu; tiada panggilan model JEV baharu atau integrasi model luar ditambah.

## Verification

- bun run lint: lulus (TypeScript).
- bun run build: lulus; bundle aplikasi masih ~2.067MB sebelum gzip dan menghasilkan amaran chunk >500KB. Code splitting aplikasi kekal kerja susulan.
- Semakan rendered desktop/mobile dilaksanakan oleh ejen utama; bukti dan keputusan akhir dicatat dalam laporan/QA utamanya.

## Skop fail

- src/features/dashboard/DashboardView.tsx
- src/features/dashboard/dashboard.css

## Pengesahan live akhir

1. Desktop 1280 x 855: hero, KPI dan tindakan utama dipaparkan dalam tema gelap dan cerah.
2. Filter Bangi: snapshot berubah kepada 0 selesai, 0 tertunda, 1 wilayah bernilai. Reset kembali ke semua rekod.
3. Buka meja operasi: dialog memaparkan 5 rekod Delayed/Processing yang sepadan.
4. Mobile 390 x 844: lebar halaman 390px, tiada overflow mendatar; hero 369px. Jadual menggunakan overflow-x auto.
5. Carian AC-ORD-1003: satu rekod sepadan; butang kosongkan carian berfungsi.
6. Ujian metrik: 3 pass, 0 fail, 10 assertions.

Semakan kod bebas selesai; regresi CSS touch containment ditemui dan dibetulkan sebelum handoff. Screenshot dalam reports/dashboard-ui/next-level-desktop-dark.png, next-level-desktop-light.png dan next-level-mobile-light.png.

Had pengesahan: semakan ini bukan pensijilan WCAG menyeluruh. Rekod seed/tempatan belum disahkan dengan backend. Model JEV luaran tidak dipanggil. Bundle besar masih memerlukan kerja code splitting.
