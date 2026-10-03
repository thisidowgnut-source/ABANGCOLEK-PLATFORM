# ABANGCOLEK — Runbook operasi dan pemulihan platform

**Dikemas kini:** 2 Oktober 2026 (Asia/Kuala_Lumpur). **Scope:** runtime first-party Bun/SQLite dan React/Vite dalam checkout ini. Runbook ini tidak mengesahkan cloud deployment, founder sign-off atau sambungan vendor.

Rujukan: [implementation ledger](../../reports/PLATFORM_EXPANSION_IMPLEMENTATION_2026-10-02.md) · [17-task plan](../superpowers/plans/2026-10-02-platform-expansion.md).

## 1. Peta runtime dan sumber kebenaran

```text
+--------------------------------------------+
| Browser: landing / empat workspace / flows  |
| Local UI: http://127.0.0.1:3000              |
+----------------------+---------------------+
                       |
+--------------------------------------------+
| Bun API: 127.0.0.1:3010                     |
| Session + membership + CSRF + revision      |
| Transactions + idempotency + scoped evidence|
+----------------------+---------------------+
                       |
+--------------------------------------------+
| var/lib/platform/platform.sqlite           |
| var/lib/platform/evidence/                  |
| Worker leases + audit + approved policies   |
+--------------------------------------------+
```

| Lokasi | Tujuan |
|---|---|
| `var/lib/platform/platform.sqlite` | Database bisnes lokal; kosong sehingga pengguna menyimpan rekod sebenar |
| `var/lib/platform/evidence/` | Fail evidence yang dirujuk oleh rekod dan SHA-256 |
| `var/run/owner-bootstrap.token` | Token provisioning sekali guna; maklumat peribadi host |
| `var/run/platform.pid` | PID API; nombor ini mesti disahkan terhadap proses sebelum operasi host |
| `var/log/dev-api.log` | Output API yang dilancarkan oleh `bun run dev` |
| `var/log/platform-api.jsonl` | Request ID, code dan status yang direkodkan API |
| `var/log/platform-worker.jsonl` | Ralat worker yang sudah diredact |
| `var/lib/qa/` | Database QA disposable; bukan rekod bisnes |

`PLATFORM_RUNTIME_ROOT` boleh memilih root runtime berasingan. Setiap command mesti menggunakan root yang disengajakan. Tiada dual-write ke Supabase; cloud data dan cloud identities terdahulu tidak dipindahkan secara automatik.

## 2. Startup dan pemeriksaan readiness

Jalankan dari checkout sedia ada. Jangan clone, reinstall, reset atau recreate projek untuk mengatasi kegagalan listener.

```powershell
Set-Location -LiteralPath 'D:\ABANGCOLEK-OS'
bun run dev
```

Command sebenar [`scripts/dev.ts`](../../scripts/dev.ts) melancarkan API lokal jika readiness belum tersedia, kemudian Vite pada port 3000. Ia menggunakan semula API ready pada port yang dipilih dan hanya menghentikan child process yang dimulakannya sendiri. `Ctrl+C` menamatkan launcher dan child yang dimilikinya; API sedia ada yang digunakan semula kekal di bawah pemilik asal.

Semak dari terminal kedua:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3010/api/platform/bootstrap-status'
Invoke-WebRequest -Uri 'http://127.0.0.1:3000/' | Select-Object StatusCode
Get-NetTCPConnection -State Listen -LocalPort 3000,3010 |
    Select-Object LocalAddress,LocalPort,OwningProcess
```

Readiness memerlukan response `ok: true` dan `data.localOnly: true`. HTTP 200 halaman utama sahaja tidak membuktikan session, database, order atau worker berfungsi. Jika gagal, semak `var/log/dev-api.log`, origin/proxy dan proses sebenar yang memiliki port. Jangan kill semua proses Bun/Node atau menganggap observation timeout sebagai proses mati.

Pilihan command yang wujud:

```powershell
bun run server
bun run dev:ui
bun run lint
bun run build
bun run test:platform
```

`server` dan `dev:ui` boleh dijalankan berasingan oleh operator yang mahu mengurus lifecycle sendiri. `build` menghasilkan Vite bundle dan public HTML daripada published snapshot; ia tidak memulakan server atau menerbitkan laman.

## 3. Provisioning founder dan akses pasukan

1. Buka `http://127.0.0.1:3000/setup` pada host lokal yang dipercayai.
2. Pemilik membaca token daripada `var/run/owner-bootstrap.token` secara peribadi dan memasukkannya pada medan **Token founder**. Jangan paste token ke chat, log, screenshot atau laporan.
3. Gunakan nama, email dan password sebenar yang dipilih pemilik; password 12–128 aksara. Sistem tidak mencipta founder atau password contoh secara automatik.
4. Selepas bootstrap berjaya, metadata `owner_bootstrapped` menghalang bootstrap kedua. Runtime membersihkan fail token selepas pemerhatian bootstrap.
5. Founder menggunakan **Pasukan & akses** untuk membership/invitation Staff atau Developer dengan scope yang disahkan. Invitation terikat email, hashed, mempunyai expiry dan hanya boleh diterima sekali.

Public signup hanya Customer. URL, dropdown, email yang kelihatan seperti founder atau LocalStorage tidak memberi role. Invitation yang dicipta tidak bermaksud email dihantar; tiada provider email dinyatakan connected. Jangan padam database, ubah metadata atau buat akaun alternatif untuk bypass kehilangan akses. Tiada password-reset service atau operator account-recovery automatik dibuktikan; kehilangan semua founder credentials memerlukan prosedur pemilik yang dinilai berasingan sebelum perubahan identity.

## 4. Kawalan runtime ketika insiden

Developer membuka **Runtime & integrasi**; Founder juga mempunyai runtime controls dalam workspace yang berkenaan. Dua kawalan sebenar:

- `workerAdmission: paused` menghentikan claim job baharu. Ia bukan bukti proses external sudah dibatalkan.
- `activeRelease: platform-local-readonly-v1` mengekalkan bacaan tetapi menolak business writes dan upload. Tukar kembali kepada `platform-local-v1` selepas sumber/issue disemak.

Command menggunakan `expectedVersion`; konflik memerlukan refresh, bukannya memaksa version lama. Status bukan deployment rollback binari; kedua-dua release adalah mode operasi lokal yang tersedia dalam kod semasa. Founder/Developer permissions tidak memberi Developer kuasa approve pembayaran atau membaca kandungan customer penuh.

## 5. Durable jobs dan pemulihan crash

Worker lokal memeriksa queue setiap satu saat. Job mempunyai attempt, lease owner/expiry, checkpoint dan result. Lease default 30 saat; selepas lease expired, job boleh dituntut semula sehingga had tiga attempts. Callback worker lama ditolak selepas lease hilang. Source dan grant founder diperiksa sebelum execution.

Selepas crash:

1. Semak PID/listener dan log; pastikan proses lama benar-benar berhenti.
2. Mulakan command yang sama dengan **database yang sama**. Jangan seed atau reset queue.
3. Semak job console: status, attempt, reason code dan artifact/receipt sebenar. Jangan menganggap timer atau queue masuk sebagai completed.
4. Jika attempts habis atau source/grant tidak sah, semak punca dahulu. Jangan menukar `failed`, `blocked` atau `unknown` kepada completed melalui edit database.

Bukti crash sebenar berada dalam [`worker-process-recovery.test.ts`](../../tests/platform/worker-process-recovery.test.ts): child worker ditamatkan selepas claim, worker kedua memulihkan lease, hanya satu result tersimpan dan stale completion ditolak. Ini ialah drill pada database disposable, bukan gangguan pada API bisnes.

## 6. Backup dan restore yang tidak overwrite

Backup CLI menyimpan serialized database, fail evidence yang dirujuk dan manifest hash. SHA-256/size evidence diperiksa sebelum snapshot dipublish. Restore menyemak semua bytes, SQLite integrity, record count dan evidence references; destination **mesti belum wujud** dan berada di luar snapshot. Implementasi [`backup.ts`](../../server/platform/backup.ts) menggunakan [SQLite serialization rasmi Bun](https://bun.sh/docs/runtime/sqlite).

Contoh PowerShell — semak source dan gunakan nama destination baharu:

```powershell
Set-Location -LiteralPath 'D:\ABANGCOLEK-OS'
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$databasePath = Join-Path (Get-Location) 'var\lib\platform\platform.sqlite'
$snapshotPath = Join-Path (Get-Location) "var\lib\backups\platform-$backupStamp"
$restorePath = Join-Path (Get-Location) "var\lib\restore-drills\platform-$backupStamp"
if (-not (Test-Path -LiteralPath $databasePath -PathType Leaf)) {
    throw 'Database source sedia ada diperlukan.'
}
bun scripts/platform-backup.ts backup $databasePath $snapshotPath
if ($LASTEXITCODE -ne 0) { throw 'Snapshot gagal; jangan teruskan restore.' }
bun scripts/platform-backup.ts restore $snapshotPath $restorePath
if ($LASTEXITCODE -ne 0) { throw 'Restore verification gagal.' }
```

Restore drill hanya menghasilkan directory baharu, bukan mengaktifkan database pulih. **Jangan copy fail ke atas database aktif atau menukar `PLATFORM_RUNTIME_ROOT` semasa API masih berjalan.** Cutover sebenar memerlukan pause writes, shutdown yang disahkan, snapshot terkini, keputusan pemilik tentang data selepas snapshot, kemudian pemilihan root/host yang betul dan smoke test scoped. Runbook ini tidak melakukan cutover. Snapshot lokal juga bukan off-site backup; operator perlu memilih retention, host encryption dan salinan luar secara berasingan.

## 7. Recovery pesanan, kewangan dan stok

| Situasi | Tindakan dalam sistem |
|---|---|
| Submit timeout | Semak rekod/receipt. Retry operasi sama dengan idempotency key asal; jangan mencipta submission kedua |
| `REVISION_CONFLICT` | Refresh source, semak perubahan, ulang review; jangan overwrite revision semasa |
| Bukti pembayaran uploaded | Founder menyemak dan verify; upload bukan pembayaran verified |
| Refund | Rekod outcome dan evidence berasingan; refund tidak automatik memulangkan stok fizikal |
| Restock partial receive | Terima kuantiti sebenar per source allocation. Batch/expiry/owner/custody dikekalkan |
| Return stok | Hold allocation tepat; terima evidence barang kembali sebelum ledger movement. Return ke HQ quarantine bukan sale |
| QC missing/stale/out-of-range | Kekalkan review/quarantine. Gunakan approved SOP/readings semasa; tiada auto-pass |
| Day close source berubah | Review semula. Reopen menghasilkan snapshot approved terdahulu yang immutable dan hash |
| Expense salah selepas posting | Reversal negatif yang merujuk posting asal; jangan edit atau padam posting immutable |
| Reconciliation source berubah | Review source/version semasa; approval lama tidak meluluskan angka baharu |

Policies, price versions, opening balances dan produk sebenar perlu disediakan pemilik. Empty state adalah status jujur; QA fixture tidak boleh dipindahkan sebagai data operasi.

## 8. Marketing/research dan outcome yang tidak diketahui

First-party workflow: campaign draft → rights/evidence → exact revision approval/expiry → **manual caption atau asset bundle export**. `exported` bukan `published`; tiada delivery receipt vendor direka. Download archive mempunyai caption dan bytes evidence yang diluluskan.

Postiz remote publish sekarang `REMOTE_PUBLISH_DISABLED`. Cancel remote yang tidak disahkan kekal `unknown`, bukan `cancelled`. Jika adapter diluluskan kemudian dan request mempunyai outcome tidak pasti, simpan intent/provider reference dan reconcile dengan provider dahulu; jangan blind retry publication yang boleh duplicate.

Research desk menyimpan URL, snippet, hash, access method, retrieved date, permitted use dan unknowns. Published date berasingan daripada retrieved date. Interrupted remote research dikekalkan `RESEARCH_INTERRUPTED_NO_REPLAY`; review source atau jalankan permintaan baharu selepas akses sah, bukan mendakwa output sudah diperoleh.

Hermes/Agent-Reach transport memerlukan declared zero-new-spend, scoped read capabilities, explicit session grant/source allowlist, known usage dan timeout. Runtime sebenar tidak connected. Grok Bot, Muse, Dots dan DeepSeek Harness merupakan research inputs, bukan connector hidup.

## 9. Private cache dan penggunaan offline

Service worker [`platform-sw.js`](../../public/platform-sw.js) menyimpan public shell/static assets sahaja. Private API, evidence dan workspace HTML tidak menjadi cache data. Offline private reload meminta authentication; reconnect mendapatkan source semasa.

Opt-in drafts berada dalam storage per user/flow dan hanya field yang dibenarkan, maksimum 12,000 aksara serta expiry yang sah. Token, payment credentials dan attachment binary tidak disimpan. Logout atau confirmed account change memadam draft/resume keys milik pengguna lama. Session expiry menutup private workspace tetapi membenarkan draft opt-in untuk reauthentication pengguna sama.

Pada telefon kongsi, jangan enable draft opt-in kecuali pemilik memahami local persistence. Storage quota/write failure ditunjukkan sebagai draft tidak tersimpan; bukan success palsu. Offline draft tidak menerima order, reserve stock atau verify payment.

## 10. HTTPS dan release gates

Local launcher bind pada loopback. [`runtime-config.ts`](../../server/runtime-config.ts) menolak origin wildcard/path/credential dan menghendaki explicit HTTPS origins apabila public binding `0.0.0.0`. Ia tidak menyediakan TLS certificate, reverse proxy, DNS, firewall, monitoring host atau cloud deployment.

Sebelum public rollout, buktikan HTTPS/origin/cookie routing, SPA deep-link fallback, served public snapshots, private no-cache, backup/restore, kapasiti disk/host, owner provisioning dan policies sebenar. `bun run preview` adalah preview build, bukan production hosting approval. Jika catalogue/settings published berubah, regenerate public HTML melalui build sebelum refresh snapshot yang disajikan.

JEV mode sekarang `LOCAL_RULES`: typed review, source version, unknown/abstention dan scoped context. Ia tidak memberi permission kewangan dan tidak mendakwa native TypeSafe latency, calibration atau probabilistic confidence.

## 11. Commands verifikasi dan batas bukti

```powershell
bun run lint
bun test --coverage tests/jev tests/platform tests/dashboard-model.test.ts
bun run build
```

Untuk browser journeys, mulakan API QA berasingan dan UI yang proxy kepada QA; jangan arahkan fixture runner ke API bisnes:

```powershell
bun run qa:server
```

Dalam terminal UI QA berasingan:

```powershell
$env:PLATFORM_API_TARGET = 'http://127.0.0.1:3011'
bunx vite --host 127.0.0.1 --port 3001 --strictPort
```

Dalam terminal test berasingan:

```powershell
$env:PLATFORM_TEST_URL = 'http://127.0.0.1:3001'
bunx playwright test -c tests/playwright.config.ts --output var/log/playwright-release
```

Runner QA menulis ignored fixture/credentials ke `var/run/e2e-fixture.json`; jangan sertakan fail ini dalam report. Setiap browser run selari mesti mempunyai output directory berlainan. Screenshot, test artifacts dan reports dikecualikan daripada Vite watch supaya penulisan evidence tidak reload flow yang sedang diuji.

Keputusan terakhir dan limitation disimpan dalam implementation ledger. Coverage hanya merangkumi fail yang dimuatkan suite; ia bukan audit semua legacy files, WCAG certification, SLA, field INP atau founder business acceptance.
