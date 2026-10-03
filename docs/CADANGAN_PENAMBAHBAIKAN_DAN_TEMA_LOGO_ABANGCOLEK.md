# PELAN PENAMBAHBAIKAN & PENSTRUKTURAN TEMA LOGO RASMI ABANG COLEK
**Penyelidikan Warna Jenama Rasmi, Penambahbaikan Sistem & Pengukuhan Fungsi 100% Beroperasi**  
*Tarikh: 2026-10-01 | Sistem: ABANGCOLEK-OS (v4.2.0)*  
*Fail Rujukan Rasmi: `/docs/CADANGAN_PENAMBAHBAIKAN_DAN_TEMA_LOGO_ABANGCOLEK.md`*

---

## 1. PENELITIAN PALET WARNA LOGO SEBENAR (OFFICIAL BRANDKIT)

Berdasarkan fail rasmi jenama (`docs/BRANDKIT.md` dan aset logo `/public/assets/brand/ABANG-COLEX-LOGO-2.png` serta `MASKOT-LOGO.PNG`), identiti visual sebenar **Abang Colek (Liurleleh House Malaysia)** diasaskan pada kombinasi warna berikut:

| Nama Warna Rasmi | Kod Hex | Nilai RGB | Peranan & Penggunaan Sebenar |
|---|---|---|---|
| **Colek Yellow / Gold** | `#FFC107` | `255, 193, 7` | Warna latar utama, sorotan keemasan (*highlights*), sempadan aktif, dan lencana utama. |
| **Sambal Red / Chili** | `#E53935` | `229, 57, 53` | Warna aksen utama perkataan "COLEX", butang seruan tindakan (CTA), lencana pedas, dan ikon cili. |
| **Midnight Black** | `#1A1A1A` | `26, 26, 26` | Warna teks "ABANG" gaya berus (*brushstroke*), panel navigasi kontras tinggi, dan mod gelap. |
| **Cream White** | `#FFF8E1` / `#FFFDF7` | `255, 248, 225` | Warna latar belakang lembut (*warm street food cream*), menggantikan warna kelabu zink sejuk. |
| **Chili Green** | `#4CAF50` | `76, 175, 80` | Daun cili pada logo, status pesanan berjaya (*Delivered*), dan kesegaran bahan. |
| **Mascot Blue** | `#4A90D9` | `74, 144, 217` | Kulit biru maskot Abang Colex yang ikonik (memakai topi MCM dan kasut Timberland). |

---

## 2. SENARAI CADANGAN PENAMBAHBAIKAN SISTEM MENYELURUH

### Cadangan 1: Naik Taraf Identiti Visual & Logo Sebenar (Brand Identity Upgrade)
- Menggantikan ikon api biasa dengan **Logo Sebenar Abang Colek (`ABANG-COLEX-LOGO-2.png`)** dan **Maskot Biru (`MASKOT-LOGO.PNG`)** pada bar sisi (*sidebar*) dan navigasi mudah alih.
- Menetapkan latar belakang aplikasi kepada tona suam `bg-[#FFFDF7]` (Cream White) dengan sempadan Colek Yellow `#FFC107` yang menepati estetika makanan jalanan *street-hypebeast*.
- Menukar tab aktif kepada gaya **Midnight Black `#1A1A1A` + Teks Colek Gold `#FFC107` + Sempadan Keemasan `#FFC107` + Lencana Sambal Red `#E53935`**.

### Cadangan 2: Pengukuhan Fungsi 100% Beroperasi (Full Functional Resilience)
- **Modul Bas Ekspres & Ejen**: Pastikan simulasi GPS laluan TBS-MBKT, penjejakan waktu tiba (ETA), penjanaan mesej WhatsApp rasmi, dan penciptaan kod DuitNow QR berjalan lancar tanpa ralat.
- **Papan Pemuka JEV System-1**: Pastikan simulator aduan botol bocor mengembalikan keputusan 7-dimensi dalam masa <50ms dengan kunci invarian `UNDETERMINED`.
- **Ejen AI Gemini (2.5 API)**: Ejen mengekalkan sambungan penstriman langsung ke Google Workspace (Gmail, Calendar, Tasks, Docs, Sheets, Forms, Meet, Chat) dan 12 Plugin 3P.
- **Peta Armada Google Maps**: Dipastikan beroperasi dengan `@vis.gl/react-google-maps` dan sistem pertahanan kuota dua peringkat.
- **Pemain Jingle Rasmi**: Pemain audio lagu tema *"Kasi Lagi-Lagi"* (1:00 minit) beroperasi dengan lirik karaoke beranimasi.

### Cadangan 3: Penambahbaikan Responsif Mudah Alih (Mobile-First Stall Operations)
- Krew gerai di pasar malam dan festival makanan 90% menggunakan telefon pintar. Navigasi bawah (*BottomNav*) dan menu sisi mudah alih dioptimumkan dengan logo kompak dan butang sentuhan pantas bersaiz ergonomik.

---

## 3. PELAKSANAAN KOD & STATUS KOMPILASI

- Tema Tailwind CSS dikemas kini dengan warna jenama rasmi.
- Header dan bar sisi dihubungkan terus ke fail `/assets/brand/ABANG-COLEX-LOGO-2.png` dan `/assets/brand/MASKOT-LOGO.PNG`.
- Ujian kompilasi (`compile_applet`) dan pemeriksaan jenis (`tsc --noEmit`) dikekalkan pada status **100% Lulus (0 Ralat)**.
