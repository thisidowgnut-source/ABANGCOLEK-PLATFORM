# PANDUAN PENGGUNAAN & INTEGRASI COMMAND PALETTE (CTRL+K)
**Pintas Navigasi Pantas, Carian Pintar Arahan, dan Penukaran Ruang Kerja ABANGCOLEK-OS**  
*Tarikh Pemasangan: 2026-10-01 | Sistem: ABANGCOLEK-OS (v4.2.0)*  
*Komponen Teras: `src/components/CommandPalette.tsx`*  
*Lokasi Fail Rujukan Rasmi: `/docs/PANDUAN_COMMAND_PALETTE.md`*

---

## 1. PENGENALAN

Komponen **Command Palette** membolehkan pengguna (termasuk pengasas Megat Shaifulreza dan staf operasi) menavigasi keseluruhan sistem **ABANGCOLEK-OS** secara pantas tanpa perlu klik menu satu demi satu.

### Ciri-Ciri Utama:
- **Pintasan Papan Kekunci Global:** Tekan `Ctrl + K` (Windows/Linux) atau `Cmd + K` (macOS) pada mana-mana tab atau skrin.
- **Navigasi Kekunci:** Gunakan panah `↑` dan `↓` untuk memilih arahan, `↵ Enter` untuk buka, dan `Esc` untuk tutup.
- **Carian Pintar (Fuzzy Keyword Search):** Menyokong carian mengikut tajuk, penerangan, kategori, dan kata kunci (contoh: *"jingle"*, *"kargo"*, *"wocs"*, *"bas"*, *"jev"*, *"gmail"*).
- **Butang Pencetus Visual:** Disediakan butang carian pintas pada bar sisi desktop (*Sidebar*) dan bar navigasi mudah alih (*Mobile Header*).
- **Tema Rasmi Jenama:** Berpaksikan palet rasmi Colek Yellow (`#FFC107`), Sambal Red (`#E53935`), Midnight Black (`#1A1A1A`), dan Cream White (`#FFFDF7`).

---

## 2. KATEGORI & SENARAI ARAHAN YANG TERSEDIA

### A. Workspaces & AI
1. **Abang Colek Hub (`discovery`)**: Hab penemuan jenama, Pitch Deck 15-slaid, TikTok hooks, jingle player.
2. **Agent Chat (`chat`)**: Sembang terus dengan ejen operasi Gemini 2.5 dengan alat Workspace & Plugins.
3. **Ekspres Bas & Ejen (`bus_freight`)**: Penjejakan kargo bas ekspres TBS-MBKT, amaran 1 jam WhatsApp, DuitNow QR.
4. **Gedung Plugins 3P (`plugins`)**: 12 Plugin aktif (Skyscanner, Booking, Canva, Adobe, GitHub, Vercel, Mixpanel, COROS, Apple Health).
5. **Prestasi Agen AI (`agent_performance`)**: Telemetri kependaman masa nyata (<50ms), carta Recharts, dan penggunaan alat.

### B. Google Workspace Suite (8 API)
6. **Gmail (`gmail`)**: Kotak masuk emel rasmi dan draf emel gantian botol bocor.
7. **Google Calendar (`calendar`)**: Jadual acara jualan gerai, festival makanan, dan taklimat stokis.
8. **Google Tasks (`tasks`)**: Senarai tugasan siasatan kualiti QC, nombor lot botol, dan persediaan krew.
9. **Google Docs (`docs`)**: Penyuntingan dokumen SOP, minit mesyuarat, dan manifesto jenama.
10. **Google Sheets (`sheets`)**: Lejar kiraan stok botol colek, kutipan jualan gerai, dan formula kewangan.
11. **Google Forms (`forms`)**: Borang cabutan bertuah (*Lucky Draw*) dan maklum balas pelanggan.
12. **Google Meet (`meet`)**: Cipta bilik telesidang Google Meet untuk taklimat staf dan stokis.
13. **Google Chat Workspace (`chat_workspace`)**: Saluran komunikasi pantas pasukan operasi dalaman.
14. **Logistics Map (`maps`)**: Peta armada Google Maps Platform dengan Advanced Marker dan tapisan bandar.

### C. Operasi & Data
15. **Pengurusan Pesanan (`orders`)**: Rekod 80+ transaksi pelanggan, status kargo, dan kelulusan *refund*.
16. **Dashboards Analitik (`dashboards`)**: Ringkasan visual KPI hasil jualan dan bandar tertinggi.
17. **Ulasan & Maklum Balas (`reviews`)**: Maklum balas rasa colek dan kepuasan pelanggan.

### D. Tindakan Pantas (1-Click Action Shortcuts)
18. 🎵 **Mainkan Lagu Tema "Kasi Lagi-Lagi"**: Lompat terus ke pemain audio jingle rasmi dengan lirik karaoke.
19. 📑 **Buka Pitch Deck 15-Slaid Pelabur**: Slaid pembentangan investor rasmi Abang Colek.
20. 📱 **12 Templat Mesej Rasmi WhatsApp WOCS**: Senarai harga SKU, promosi Beli 3 Percuma 1, dan pendaftaran gerai.
21. 🎯 **10 Cangkuk Viral TikTok @styloairpool**: Cangkuk video viral dan jadual siaran mingguan 4 hari.
22. ⚡ **Uji Aduan Pelanggan (Simulator JEV)**: Uji mesej aduan kerosakan botol bocor dalam masa <50ms dengan kunci invarian `UNDETERMINED`.
23. 💬 **Tanya AI: "Buat ringkasan jualan mingguan"**: Menghantar prompt automatik ke ejen Gemini untuk menganalisis lejar jualan.

### E. Staf & Sesi
24. 🔄 **Tukar Sesi: HQ Admin**: Akses pentadbir utama operasi Abang Colek di Johor Bahru.
25. 🔄 **Tukar Sesi: Stokis KT**: Akses pengurus stokis wilayah Pantai Timur di MBKT Terengganu.

---

## 3. STATUS KOMPILASI & PENGESAHAN

- Kompilasi Binaan: **100% Lulus (`compile_applet`)**.
- Pemeriksaan Jenis TypeScript: **0 Ralat (`tsc --noEmit`)**.
- Keserasian Platform: Berfungsi lancar pada pelayar web desktop dan sentuhan skrin telefon pintar.
