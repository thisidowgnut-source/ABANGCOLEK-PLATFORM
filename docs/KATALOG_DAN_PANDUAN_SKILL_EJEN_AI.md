# KATALOG DAN PANDUAN PEMASANGAN SKILL EJEN AI (136 MODUL SKILL)
**Dokumentasi Pemasangan & Pengaktifan Pustaka Kemahiran Kejuruteraan & Seni Bina Sistem**  
*Tarikh Pemasangan: 2026-10-01 | Sistem: ABANGCOLEK-OS*  
*Lokasi Direktori Kemahiran: `./skills/`*  
*Fail Rujukan Rasmi: `/docs/KATALOG_DAN_PANDUAN_SKILL_EJEN_AI.md`*

---

## 1. RINGKASAN PEMASANGAN SKILL

Sebanyak **136 fail modul kemahiran (skills)** merangkumi **9 domain kejuruteraan perisian utama** telah berjaya dipasang dan diaktifkan terus ke dalam direktori projek `./skills/`. Ejen AI Gemini 2.5 (`gemini-3.8-flash`) kini disambungkan secara natif kepada kesemua kemahiran ini melalui `MASTER_SYSTEM_INSTRUCTION`.

---

## 2. MATRIKS 9 DOMAIN KEMAHIRAN YANG DIPASANG

### 1. Architecture & System Design (`./skills/architecture-design/`) - 15 Modul
1. `api-design-and-versioning`: Reka bentuk API REST/GraphQL berserta strategi versi & deprecation.
2. `api-gateway-configurator`: Konfigurasi laluan API gateway, rate-limiting, dan token validation.
3. `clean-architecture-scaffolder`: Pemisahan lapisan entiti, use-cases, interfaces, dan adapters.
4. `contract-first-api-development`: Pembangunan API berasaskan spesifikasi OpenAPI/Protobuf.
5. `distributed-system-patterns`: Corak sistem teragih (circuit breaker, retry, saga, bulkhead).
6. `domain-driven-design-builder`: Pemodelan domain kompleks dengan bounded contexts dan aggregates.
7. `event-driven-system-designer`: Seni bina berasaskan peristiwa (Kafka, RabbitMQ, Webhooks).
8. `hexagonal-architecture-builder`: Seni bina Ports & Adapters untuk sistem mudah diuji.
9. `microservices-architect`: Pemecahan servis modular, pengasingan pangkalan data.
10. `modular-monolith-designer`: Reka bentuk monolit modular berprestasi tinggi.
11. `monolith-to-microservices-migrator`: Strategi migrasi berperingkat (Strangler Fig pattern).
12. `multi-tenancy-architect`: Pengasingan data berbilang penyewa (tenant isolation & RLS).
13. `real-time-system-designer`: Sistem masa nyata berasaskan WebSockets, SSE, dan gRPC.
14. `serverless-architecture-generator`: Seni bina fungsi tanpa pelayan (Lambda, Cloud Functions).
15. `system-design-documentation`: Penghasilan rajah C4 dan dokumentasi sistem komprehensif.

---

### 2. Code Generation & Scaffolding (`./skills/codegen-scaffolding/`) - 15 Modul
1. `api-mocking-server`: Pelayan olokan API (MSW, Prism) untuk ujian awal.
2. `boilerplate-project-scaffolder`: Penjana templat projek standard dengan TypeScript & linter.
3. `cli-tool-builder`: Pembina perkakas arahan terminal berasaskan Node.js/Go.
4. `code-template-engine`: Enjin templat kod (Handlebars, Plop.js) untuk fungsi berulang.
5. `component-library-creator`: Pembina pustaka komponen UI reaktif (Tailwind + Storybook).
6. `crud-generator`: Penjana kod CRUD hujung-ke-hujung (API, Skema DB, Antara Muka).
7. `database-schema-generator`: Penjana skema pangkalan data SQL/Prisma/Drizzle.
8. `dockerfile-generator`: Penghasilan Dockerfile berbilang fasa (multi-stage builds) optimum.
9. `full-stack-feature-generator`: Penjana ciri penuh merangkumi backend, frontend, dan ujian.
10. `github-actions-workflow`: Penjanaan alur kerja CI/CD GitHub Actions automatik.
11. `graphql-schema-builder`: Penjana skema dan resolver GraphQL jenis selamat.
12. `mock-data-generator`: Penjana data tiruan berasaskan skema Zod/Faker untuk ujian.
13. `openapi-code-generator`: Penjanaan klien TypeScript automatik dari spesifikasi Swagger.
14. `react-hook-generator`: Penjanaan custom React hooks berprestasi tinggi.
15. `terraform-module-generator`: Penjanaan modul Terraform untuk infrastruktur awan.

---

### 3. Data & Analytics (`./skills/data-analytics/`) - 15 Modul
1. `analytics-dashboard-generator`: Reka bentuk papan pemuka analitik metrik jualan & operasi.
2. `cdc-pipeline`: Saluran paip Change Data Capture (Debezium, Supabase Realtime).
3. `data-catalog-creator`: Katalog metadata dan kamus data perusahaan.
4. `data-lake-architecture`: Seni bina penyimpanan data analitik berskala besar.
5. `data-mesh-implementation`: Pemilikan data berasaskan domain perniagaan.
6. `data-pipeline-builder`: Pembina paip ETL/ELT automatik.
7. `data-quality-framework`: Ujian integriti data dan pengesahan anomali.
8. `data-warehouse-designer`: Reka bentuk skema bintang (*star schema*) untuk pelaporan.
9. `database-migration-orchestrator`: Pengurusan migrasi skema tanpa masa henti (*zero-downtime*).
10. `feature-store-builder`: Penyimpanan ciri data untuk model ramalan machine learning.
11. `graph-database-modeler`: Pemodelan graf hubungan entiti (Neo4j, Memgraph).
12. `ml-model-deployment`: Pelancaran model AI ke dalam persekitaran pengeluaran.
13. `sql-query-optimizer`: Pengoptimuman indeks, pemprofilan EXPLAIN ANALYZE SQL.
14. `stream-processing`: Pemprosesan aliran data masa nyata (Flink, Kafka Streams).
15. `time-series-database`: Pengendalian data siri masa (TimescaleDB, InfluxDB).

---

### 4. DevOps & Cloud Infrastructure (`./skills/devops-infra/`) - 20 Modul
1. `alerting-and-monitoring`: Konfigurasi sistem amaran (PagerDuty, Prometheus alerts).
2. `build-optimization`: Percepat masa kompilasi dan caching pintar (Turbo, esbuild).
3. `ci-cd-pipeline-orchestrator`: Orkestrasi saluran paip ujian, binaan, dan pelancaran automatik.
4. `cloud-migration`: Panduan pemindahan sistem ke Google Cloud / AWS / Vercel.
5. `configuration-management`: Pengurusan konfigurasi persekitaran selamat (12-Factor App).
6. `container-orchestration`: Pengurusan kluster kontena Docker & Podman.
7. `cost-optimization`: Pengurangan kos pelayan awan dan penggunaan skala-ke-sifar.
8. `database-administration-automation`: Sandaran automatik, vakum pangkalan data, failover.
9. `disaster-recovery-planner`: Pelan pemulihan bencana (RPO/RTO) dan replikasi sandaran.
10. `gitops-workflow`: Aliran kerja GitOps berasaskan ArgoCD/Flux.
11. `infrastructure-as-code-generator`: Penjanaan kod Terraform dan Pulumi.
12. `kubernetes-cluster-manager`: Pengurusan manifes Kubernetes, Ingress, dan Helm charts.
13. `logging-aggregation`: Pengagregatan log berpusat (Loki, Elasticsearch, Datadog).
14. `multi-region-deployment`: Pelancaran merentas zon serantau dengan kependaman rendah.
15. `network-infrastructure`: Konfigurasi VPC, subnet, firewall, dan DNS.
16. `observability-stack`: Pelaksanaan OpenTelemetry merangkumi jejak, metrik, dan log.
17. `rolling-update-strategies`: Strategi pelancaran Blue/Green dan Canary releases.
18. `secret-injection`: Pengurusan rahsia selamat (HashiCorp Vault, Cloud Secret Manager).
19. `serverless-framework`: Penyelenggaraan perkhidmatan tanpa pelayan.
20. `service-mesh-configurator`: Konfigurasi Istio/Linkerd untuk trafik mTLS.

---

### 5. Documentation & Knowledge (`./skills/documentation-knowledge/`) - 15 Modul
1. `api-documentation`: Penjanaan dokumentasi API interaktif (Swagger, Redoc).
2. `architecture-decision-records`: Templat ADR untuk mendokumenkan keputusan teknikal.
3. `changelog-automation`: Automasi penghasilan nota keluaran versi (*Keep a Changelog*).
4. `code-comment-enricher`: Penulisan ulasan kod standard JSDoc/TSDoc.
5. `database-schema-documentation`: Pendokumentasian skema ERD automatik.
6. `dependency-graph-visualizer`: Pemetaan visual kebergantungan pakej perisian.
7. `diagram-as-code`: Penghasilan gambar rajah seni bina (Mermaid.js, PlantUML).
8. `incident-post-mortem`: Templat laporan pasca-insiden (PMR) tanpa menyalahkan individu.
9. `knowledge-base-builder`: Pembinaan pangkalan pengetahuan organisasi.
10. `living-documentation-generator`: Dokumentasi yang dijana terus daripada kod sumber.
11. `onboarding-guide-creator`: Panduan pantas kemasukan pembangun perisian baharu.
12. `performance-baseline-documentation`: Rekod garis asas metrik kelajuan sistem.
13. `readme-generator`: Penjana fail README standard antarabangsa.
14. `runbook-generator`: Panduan SOP operasi krew pelayan semasa kecemasan.
15. `tutorial-generator`: Penjanaan panduan langkah demi langkah untuk pengguna.

---

### 6. Maintenance & Performance Optimization (`./skills/maintenance-optimization/`) - 15 Modul
1. `api-response-optimizer`: Pemampatan data JSON dan pengurangan kependaman API.
2. `bundle-size-optimizer`: Pengecilan saiz fail JavaScript (Tree-shaking, Dynamic Imports).
3. `cache-strategy-implementer`: Pelaksanaan caching bertingkat (SWR, Redis, CDN).
4. `code-complexity-reducer`: Pengurangan kerumitan siklomatik kod (*Cyclomatic Complexity*).
5. `code-duplication-remover`: Penghapusan kod bertindih (Prinsip DRY).
6. `container-image-optimizer`: Pengecilan saiz imej Docker (distroless, alpine).
7. `database-query-optimizer`: Pembetulan N+1 queries dan penalaan indeks.
8. `dead-code-eliminator`: Pengesanan dan penghapusan fungsi tidak digunapakai.
9. `dependency-updater`: Kemas kini pakej selamat dengan pengesahan semver.
10. `error-handling-standardizer`: Penyeragaman pengendalian ralat dan kod status HTTP.
11. `logging-optimizer`: Pengurangan bunyi bising log dan pemformatan JSON berstruktur.
12. `memory-leak-detector`: Pengesanan kebocoran memori heap dan penutupan sambungan DB.
13. `performance-optimizer`: Pengoptimuman prestasi render frontend (React memoization).
14. `smart-refactoring-engine`: Enjin penambahbaikan struktur kod tanpa mengubah fungsi.
15. `technical-debt-analyzer`: Pengukuran hutang teknikal dan perancangan pembaharuan.

---

### 7. Governance, Meta & Delivery (`./skills/meta/`) - 11 Modul
1. `architecture-review-and-approval`: Proses semakan seni bina dan kelulusan rasmi.
2. `change-management-and-rollback`: Prosedur kawalan perubahan dan pembatalan (*rollback*).
3. `compliance-evidence-pack`: Pengumpulan bukti audit keselamatan perisian.
4. `delivery-checklist-and-handoff`: Senarai semak penyerahan sistem pengeluaran.
5. `multi-skill-orchestration`: Orkestrasi pelbagai kemahiran serentak untuk isu kompleks.
6. `performance-budgeting`: Penetapan bajet kelajuan dan had saiz binaan.
7. `risk-and-assumption-tracker`: Penjejak risiko dan andaian teknikal projek.
8. `skill-intake-and-triage`: Saringan keperluan kemahiran baharu.
9. `skill-quality-gate`: Pintu kawalan kualiti kod sebelum digabungkan (*merge*).
10. `stack-profile-manager`: Pengurusan profil tindanan teknologi (`STACK_PROFILES.md`).
11. `STACK_PROFILES.md`: Profil rasmi tindanan teknologi (Profile A, B, dan C).

---

### 8. Security & Compliance (`./skills/security-compliance/`) - 15 Modul
1. `access-control-matrix`: Matriks kebenaran pengguna berasaskan peranan (RBAC).
2. `api-security-enforcer`: Perlindungan API (OWASP API Top 10, sanitasi input).
3. `audit-logger`: Pengauditan aktiviti pengguna yang tidak boleh diubah (*immutable log*).
4. `authentication-system-builder`: Sistem pengesahan selamat (JWT, OAuth 2.0, Passkeys).
5. `certificate-manager`: Pengurusan sijil SSL/TLS dan pembaharuan automatik Let's Encrypt.
6. `compliance-checker`: Semakan pematuhan privasi (PDPA Malaysia, GDPR, SOC 2).
7. `container-security-scanner`: Imbasan kelemahan kontena (Trivy, Grype).
8. `data-privacy-guardian`: Perlindungan data peribadi dan penyamaran maklumat sulit (*data masking*).
9. `penetration-testing-runner`: Ujian penembusan keselamatan dan analisis kelemahan.
10. `secrets-management`: Perlindungan kunci API dan pencegahan kebocoran ke repositori git.
11. `security-hardening-auditor`: Audit peneguhan pelayan dan penyemak imbas (CSP, HSTS).
12. `security-incident-response`: Pelan tindakan kecemasan sekiranya berlaku pencerobohan.
13. `supply-chain-security`: Pemeriksaan kebergantungan pakej berniat jahat (*dependency safety*).
14. `threat-modeling-framework`: Pemodelan ancaman keselamatan (STRIDE framework).
15. `zero-trust-architecture`: Seni bina sifar amanah (tiada perimeter yang dipercayai mutlak).

---

### 9. Testing & Quality Assurance (`./skills/testing-quality/`) - 15 Modul
1. `accessibility-testing`: Ujian kebolehcapaian antaramuka (WCAG 2.1 AA, axe-core).
2. `api-testing-suite`: Suite ujian automatik API REST dan GraphQL.
3. `chaos-engineering-runner`: Ujian ketahanan kegagalan sistem (Chaos Monkey, latency injection).
4. `contract-testing`: Ujian kontrak antara perkhidmatan microservices (Pact).
5. `cross-browser-testing`: Ujian keserasian pelayar web (Playwright, Cypress).
6. `database-testing`: Ujian integriti pangkalan data dan kekangan transaksi ACID.
7. `fuzz-testing`: Ujian input rawak untuk mengesan ralat tidak dijangka (*crash test*).
8. `mobile-testing-framework`: Kerangka ujian aplikasi mudah alih (Appium, Detox).
9. `performance-testing-framework`: Ujian beban dan daya tahan (k6, Locust, JMeter).
10. `property-based-testing`: Ujian berasaskan sifat matematik (fast-check).
11. `security-testing-automation`: Automasi imbasan keselamatan kod statik (SAST/DAST).
12. `smoke-test-generator`: Penjana ujian pantas untuk mengesahkan fungsi kritikal selepas deploy.
13. `snapshot-testing`: Ujian snap-shot antaramuka untuk mengesan perubahan visual tidak sengaja.
14. `test-automation-suite-generator`: Penjana suite ujian hujung-ke-hujung secara menyeluruh.
15. `visual-regression-tester`: Pengesanan perbezaan piksel visual antara versi UI.

---

## 3. PENGESAHAN DAN STATUS OPERASI

- Direktori Sasaran: `./skills/` (Tersimpan dalam fail sistem projek).
- Integrasi Ejen: Dikemas kini dalam `src/services/gemini.ts` (`MASTER_SYSTEM_INSTRUCTION`).
- Ujian Kompilasi: **LULUS (100% Bersih)**.
- Ujian Jenis TypeScript: **0 Ralat (`tsc --noEmit`)**.

Kini, bila-bila masa anda meminta saya melaksanakan sebarang tugasan kejuruteraan, audit keselamatan, ujian beban, migrasi pangkalan data, atau pengoptimuman kod, saya akan merujuk terus kepada prosedur standard dalam pustaka 136 kemahiran ini.
