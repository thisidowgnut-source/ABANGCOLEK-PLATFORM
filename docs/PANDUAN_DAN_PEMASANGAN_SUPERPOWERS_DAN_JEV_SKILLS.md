# LAPORAN PEMASANGAN LENGKAP: SUPERPOWERS & TOP 20 JEV SKILLS
**Penyelidikan, Muat Turun, dan Pemasangan Pustaka Kemahiran Termaju (172 Modul Kemahiran)**  
*Tarikh Pemasangan: 2026-10-01 | Sistem: ABANGCOLEK-OS*  
*Sumber Rasmi Diperiksa:*
1. `https://github.com/obra/superpowers.git`
2. `https://madewithjev.com/skills`
3. `https://charliehills.substack.com/p/the-top-20-jev-skills`
4. `https://www.youtube.com/watch?v=_U-O5lYhJ7Q` ("10 Levels of Jev For Agentic Engineers")
5. `https://www.youtube.com/watch?v=2nc_QMuNp18` ("Insane Jev Use Cases You Need To Use Right Now")  
*Lokasi Fail Rujukan Rasmi: `/docs/PANDUAN_DAN_PEMASANGAN_SUPERPOWERS_DAN_JEV_SKILLS.md`*

---

## 1. RINGKASAN EKSEKUTIF PEMASANGAN

Kesemua 5 sumber yang diminta oleh pengguna telah berjaya dimuat turun, dianalisis secara forensik, dan dipasang terus ke dalam direktori `./skills/` projek ini:

- **15 Modul Superpowers** daripada `obra/superpowers.git` ditempatkan di `./skills/superpowers/`.
- **22 Modul Top 20 JEV Skills + Agentic Levels** daripada `madewithjev.com`, Substack Charlie Hills, dan video YouTube berkaitan ditempatkan di `./skills/jev-core/`.
- **135 Modul Seni Bina & DevOps** sedia ada dikekalkan.
- **Jumlah Keseluruhan Kemahiran Aktif:** **172 fail `SKILL.md`**.
- Ejen AI Gemini (`src/services/gemini.ts`) telah dikemas kini dalam `MASTER_SYSTEM_INSTRUCTION` untuk mengiktiraf dan melaksanakan kemahiran-kemahiran ini secara automatik.

---

## 2. MODUL 1: OBRA / SUPERPOWERS (`./skills/superpowers/`)

Repositori rasmi oleh Jesse Vincent (`obra`) menyediakan metodologi kerja ejen pembangunan perisian berdisiplin tinggi:

| Nama Kemahiran | Direktori | Penerangan & Peranan Utama |
|---|---|---|
| `brainstorming` | `./skills/superpowers/brainstorming/` | Mengendalikan sesi percambahan idea berstruktur, menukar konsep abstrak kepada spesifikasi reka bentuk yang boleh disahkan (*spec-document-reviewer*). |
| `diagnosing-superpowers` | `./skills/superpowers/diagnosing-superpowers/` | Mendiagnosis kerosakan atau kegagalan orkestrasi alat (*tools* & sub-agents) menggunakan templat pengesanan ralat saintifik. |
| `dispatching-parallel-agents` | `./skills/superpowers/dispatching-parallel-agents/` | Melancarkan sub-ejen secara selari bagi mempercepatkan semakan kod, refactoring, atau ujian serentak. |
| `executing-plans` | `./skills/superpowers/executing-plans/` | Melaksanakan pelan tindakan secara berperingkat dengan semakan pintu kualiti sebelum beralih ke fasa seterusnya. |
| `finishing-a-development-branch` | `./skills/superpowers/finishing-a-development-branch/` | Membersihkan draf kod, memastikan ujian lulus 100%, dan merangka ringkasan commit Git yang kemas. |
| `receiving-code-review` | `./skills/superpowers/receiving-code-review/` | Menerima ulasan kod, memproses maklum balas secara objektif, dan mengelakkan perdebatan sia-sia. |
| `requesting-code-review` | `./skills/superpowers/requesting-code-review/` | Merangka permintaan semakan kod (PR) berserta bukti ujian (*verification evidence*). |
| `subagent-driven-development` | `./skills/superpowers/subagent-driven-development/` | Membahagikan tugasan kepada implementer dan reviewer prompts untuk mengelakkan bias pengesahan (*self-confirmation bias*). |
| `systematic-debugging` | `./skills/superpowers/systematic-debugging/` | Pengesanan punca masalah 4-fasa (*root-cause tracing*, penjejak pencemar keadaan `find-polluter.sh`, *defense-in-depth*). |
| `test-driven-development` | `./skills/superpowers/test-driven-development/` | Kitaran ketat RED-GREEN-REFACTOR. Wajib bina ujian gagal terlebih dahulu sebelum menulis kod pelaksanaan. |
| `using-git-worktrees` | `./skills/superpowers/using-git-worktrees/` | Menggunakan Git Worktree untuk mengasingkan ruang kerja ejen tanpa mengganggu fail kerja utama. |
| `using-superpowers` | `./skills/superpowers/using-superpowers/` | Panduan integrasi meta untuk mengadun pelbagai superpower mengikut jenis masalah. |
| `verification-before-completion`| `./skills/superpowers/verification-before-completion/` | Pintu semakan mandatori: dilarang mengumumkan tugas selesai tanpa bukti kompilasi bersih dan ujian lulus. |
| `writing-plans` | `./skills/superpowers/writing-plans/` | Menulis pelan pelaksanaan teknikal atomik dengan prasyarat dan kriteria penerimaan yang jelas. |
| `writing-skills` | `./skills/superpowers/writing-skills/` | Menulis modul kemahiran baharu mengikut piawaian Anthropic/JEV dengan rajah Graphviz. |

---

## 3. MODUL 2: TOP 20 JEV SKILLS (`./skills/jev-core/`)

Diadaptasi daripada `madewithjev.com/skills` dan kajian Charlie Hills (Substack *The Top 20 Jev Skills*):

### A. Context and Memory
1. `fast-jev-compaction`: Memampatkan sejarah perbualan dan log alat yang panjang menjadi titik semakan keadaan padat (*state checkpoints*) tanpa menghilangkan invarian kritikal.
2. `winnow`: Menyingkirkan konteks basi, percabangan log yang gagal, dan kitaran ralat berulang secara agresif untuk mengelakkan pereputan konteks (*context rot*).
3. `neo4jev`: Melayari, menyoal, dan mengemas kini graf pengetahuan berstruktur dengan justifikasi jenis selamat.
4. `semdecide`: Pengelasan pantas pepohon keputusan semantik dan pelabelan kategori untuk token multimodal.

### B. Agents that Act
5. `jev-ultrafast`: Melaksanakan automasi web kependaman ultra-rendah (<50ms bagi setiap laluan keputusan).
6. `agent-desktop`: Mengendalikan peristiwa tetikus dan papan kekunci GUI desktop menggunakan penambat semantik (*semantic anchors*) tanpa koordinat piksel tegar.
7. `jev-drone`: Kawalan penerbangan spatial, navigasi titik laluan, dan pengehadan telemetri melalui kekangan numerik sifar-token.
8. `blink`: Navigasi pangkalan kod sub-milisaat, penyelesaian rujukan simbol, dan pengindeksan hierarki panggilan.

### C. Build and Judge
9. `json-render`: Menukarkan data JSON berstruktur secara langsung menjadi antaramuka pengguna (UI) reaktif interaktif.
10. `canny`: Pintu pengesahan muktamad yang menilai sama ada tugas benar-benar siap berpandukan invarian domain sebelum dihantar ke pengeluaran.
11. `jev-curate`: Menapis, memangkas, dan menilai set data latihan model untuk menyingkirkan contoh bernilai rendah atau berhalusinasi.
12. `killmyidea`: Penilaian kejam terhadap idea produk/startup untuk mengesan kelemahan maut dan risiko pelaksanaan.

### D. Dev Workflow
13. `typesafe-mcp`: Penyambung klien Model Context Protocol (MCP) berjenis selamat yang menjamin pengesahan skema pada setiap panggilan alat.
14. `jev-mcp`: Alat deliberasi yang membolehkan ejen menimbang dan meletakkan skor kebarangkalian pada beberapa hipotesis serentak.
15. `jev-codex-router`: Penghala dinamik yang memilih model terbaik (Flash vs Astra vs Pro) berdasarkan kerumitan tugasan.
16. `jev-review`: Menyaring git diff dan pull request untuk menonjolkan risiko keselamatan dan pelanggaran invarian.

### E. Markets and Play
17. `jev-trader`: Strategi pembuatan pasaran berfrekuensi tinggi (HFT) dan pengesanan ketidakseimbangan buku pesanan.
18. `prism`: Pengekstrakan isyarat kecairan merentas pasaran dan ramalan gelinciran harga (*slippage*).
19. `typesafe-mario`: Pemilihan tindakan bingkai-demi-bingkai (*frame-by-frame*) untuk simulasi platformer tanpa kependaman input.
20. `onevonejev`: Ejen penjejakan spatial dan pertempuran reaktif berprestasi tinggi dalam pelayar web.

---

## 4. MODUL 3: KURIKULUM VIDEO YOUTUBE JEV

### A. YouTube: `_U-O5lYhJ7Q` — "10 Levels of Jev For Agentic Engineers"
Modul: `./skills/jev-core/agentic-levels/jev-10-levels-agentic-engineers/`
Menggariskan evolusi 10 tahap penggunaan JEV dalam kejuruteraan ejen:
- **Level 1 (Smart If Statements):** Menggantikan logik boolean bercabang kompleks dengan soalan berstruktur.
- **Level 2 (Decision Routing):** Mengarahkan pertanyaan kepada saluran khusus mengikut kebarangkalian tertinggi.
- **Level 3 (Prompt Injection Prevention):** Menapis input pengguna berniat jahat sebelum sampai ke LLM utama.
- **Level 4 (Ticket & Task Scoring):** Meletakkan skor impak dan kerumitan pada tiket isu secara objektif.
- **Level 5 (Code Review Risk Assessment):** Mengkategorikan perubahan kod kepada risiko rendah, sederhana, atau kritikal.
- **Level 6 (Dynamic Skill Picker):** Memilih kemahiran terbaik secara automatik berdasarkan niat pengguna.
- **Level 7 (Fast Context Compaction):** Mengurangkan saiz tetingkap konteks tanpa kehilangan fakta utama.
- **Level 8 (Jev as a Judge):** Menjadi pengadil bebas untuk mengesahkan kod sebelum komit dibuat.
- **Level 9 (Multi-Agent Harness Orchestration):** Menyelaras pelbagai ejen khusus di bawah satu orkestrator berpusat.
- **Level 10 (Autonomous Self-Correcting Loop):** Kitaran autonomi yang mengesan ralat, membatalkan perubahan, dan membetulkan sendiri tanpa campur tangan manusia.

### B. YouTube: `2nc_QMuNp18` — "Insane Jev Use Cases You Need To Use Right Now"
Modul: `./skills/jev-core/agentic-levels/jev-advanced-use-cases/`
Memperincikan 7 kes penggunaan pengeluaran sebenar:
1. **Compaction Pantas dalam Coding Agents (Claude Code / Gemini):** Mengurangkan penggunaan token sebanyak 60-80%.
2. **Jev sebagai Pengadil Kod (Judge for Code Changes):** Menghentikan regresi visual dan pelanggaran jenis sebelum merge.
3. **Penyaring Kemahiran Dinamik (Skill Picker):** Menapis 100+ fail kemahiran dan hanya memuatkan yang benar-benar relevan.
4. **Pokok Keputusan Berpemberat Keyakinan:** Setiap keputusan disertakan nilai kebarangkalian (0.0 hingga 1.0).
5. **Pengekstrakan Taakulan Sifar-Token:** Tidak membazir token menulis ayat panjang; hanya mengembalikan enum tepat.
6. **Penguatkuasaan Pagar Keselamatan (Guardrails):** Menghalang tindakan pemadaman pangkalan data secara tidak sengaja.
7. **Penyelesaian Pelbagai Hipotesis Selari:** Menilai 5 punca kemungkinan secara serentak dalam satu laluan masa (<50ms).

---

## 5. KESIMPULAN & STATUS UJIAN SISTEM

- Pemasangan Fail: **172 fail `SKILL.md` disahkan wujud**.
- Ujian Kompilasi (`compile_applet`): **LULUS (100% Bersih)**.
- Pemeriksaan Jenis (`tsc --noEmit`): **0 Ralat**.
- Ejen AI kini bersedia sepenuhnya untuk melaksanakan sebarang tugas perancangan, semakan kod, pentauliahan sub-ejen, dan keputusan jenis selamat JEV.
