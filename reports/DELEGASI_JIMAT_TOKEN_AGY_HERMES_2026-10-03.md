# Delegasi untuk menjimatkan konteks utama

Tarikh: 3 Oktober 2026. Projek: `D:\ABANGCOLEK-OS`.

## Keputusan yang disahkan

- AGY CLI tersedia di `C:\Users\megat\AppData\Local\agy\bin\agy.exe`; `agy --help` selesai dengan exit 0.
- Hermes CLI tersedia di `C:\Users\megat\AppData\Local\hermes\bin\hermes.exe`; `hermes --help` selesai dengan exit 0.
- Help AGY mengesahkan `--print`, `--mode plan`, `--sandbox`, `--model`, `--print-timeout` dan `--output-format json`.
- Help Hermes mengesahkan `--oneshot`, `--in`, `--model`, `--provider`, `--toolsets` dan `--usage-file`.
- Kos model, baki quota dan authentication untuk inference belum disahkan. Kehadiran executable tidak membuktikan panggilan model percuma atau integrasi dalam aplikasi sudah connected.
- Runtime Hermes aplikasi masih melaporkan `ADAPTER_NOT_VERIFIED`; adapter memerlukan transport, scoped tools, quota diketahui dan kontrak `zeroNewSpend: true`. Lihat `server/automation/adapters.ts` dan `server/platform/app.ts`.

## Pembahagian kerja

```text
┌───────────────────────────────────────┐
│ Codex: scope, keputusan, integrasi QA  │
└───────────────────┬───────────────────┘
                    │ paket kecil
┌───────────────────▼───────────────────┐
│ Ujian/pencarian deterministik dahulu  │
│ CLI tersedia + model percuma sah      │
└───────────────────┬───────────────────┘
                    │ laporan terhad
┌───────────────────▼───────────────────┐
│ Codex semak bukti dan hasil sebenar   │
└───────────────────────────────────────┘
```

| Kerja | Pelaksana yang sesuai | Hasil yang diminta |
| --- | --- | --- |
| Cari fail, import, ralat binaan, kira keputusan ujian | Alat deterministik lokal | Laluan fail, baris dan status exit |
| Audit modul terhad dan cadangan kod | AGY dalam plan/sandbox selepas model disahkan | Maksimum lima findings dengan bukti |
| Penyelidikan sumber atau dokumentasi berstruktur | Hermes dengan tools terhad selepas provider disahkan | Sumber, fakta, unknowns dan laporan ringkas |
| Pembaikan fail berasingan | Sub-agent dengan ownership jelas | Patch, ujian relevan dan fail berubah |
| Gabungan kod, auth/data, semakan browser, penerimaan | Codex + reviewer berasingan | Hasil live dan gate penerimaan |

## Paket tugas

Hantar hanya objektif, fail yang dibenarkan, kekangan, kriteria penerimaan dan format output. Jangan hantar seluruh sejarah chat, keseluruhan repository, secrets atau log panjang. Simpan butiran dalam laporan lokal; pulangkan ringkasan 300–600 perkataan dengan laluan bukti. Kerja berasingan tidak berkongsi ownership fail.

Contoh paket audit: “Semak hanya tiga fail hero dan model. Read only. Laporkan correctness/accessibility findings dengan file:line, severity, bukti dan remedy. Tiada pemasangan, model berbayar, perubahan database atau browser. Jika bukti tidak cukup, nyatakan unknown. Maksimum lima findings.”

## Mengukur penjimatan

Delegasi berpotensi mengecilkan konteks Codex, tetapi jumlah token semua agen boleh meningkat. Rekod penggunaan sebelum/selepas, model/provider, tempoh, saiz input/output dan kadar kerja semula. Hermes menyediakan `--usage-file`; ia bukan pengesahan kos sifar. Tiada peratus penjimatan token telah diukur dalam sesi ini.

## Syarat penggunaan

Gunakan provider/model percuma sedia ada yang telah disahkan atau model lokal tersedia. Jangan memasang sistem baharu atau menggunakan model berbayar untuk menyelesaikan isu authentication/quota. Hermes `--oneshot` menurut help memintas approvals dan masih memuatkan tools/memory/rules; gunakan hanya dengan toolset serta workspace yang dibatasi dan disemak. Prompt sahaja tidak menguatkuasakan akses read only.

Dalam sesi ini sub-agent digunakan untuk behavior hero, review kod, dokumentasi/build dan semakan CLI. Tiada inference AGY/Hermes dijalankan dan tiada adapter production diaktifkan berdasarkan executable sahaja.
