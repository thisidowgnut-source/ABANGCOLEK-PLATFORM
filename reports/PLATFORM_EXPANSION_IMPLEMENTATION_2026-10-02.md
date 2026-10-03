# ABANGCOLEK platform expansion — implementation ledger

Plan: `docs/superpowers/plans/2026-10-02-platform-expansion.md`

**Dikemas kini:** 2 Oktober 2026 (MYT). **Status: FIRST-PARTY IMPLEMENTED; FINAL VERIFICATION IN PROGRESS.** Pengguna mengarahkan pelaksanaan selepas dokumen siap. Jadual di bawah memetakan seluruh 17-task plan kepada source dan bukti; ia bukan founder sign-off, live cloud deployment atau claim semua vendor connected.

## Planning and review evidence

- Research 01–12, masterplan, index and 17-task technical plan saved.
- All local Markdown document links resolved in a filesystem check.
- Independent review raised seven gaps: reservation dependency, stock formula, remote cancellation, lifecycle states, prerender, functional traceability and storage quota failure. Documents/plan updated accordingly.
- Working branch: `codex/unified-platform-expansion`. Existing uncommitted work preserved.

## Implementation decisions

**Ruling: independent local platform database for the new audience system.** Existing Supabase source templates expose broad table access and have mismatched contracts; live policies/schema have not been verified. Use Bun's built-in SQLite transaction store for the new local server under `var/lib/platform/`, without migrating or overwriting existing cloud data. Existing Supabase/Google views remain a separate integration surface. Cost if changed: a repository adapter/data migration will be needed before cloud cutover. No dual write is enabled.

**Ruling: local canonical password/session authentication plus one-time owner bootstrap.** Browser role selection, email naming and metadata cannot grant founder/staff powers. Provision first founder with a random local bootstrap token; public signup is customer only. Supabase authentication can later be bridged only after verified issuer/membership mapping. Cost: users of the new local workspace provision their account once; existing cloud identities are not silently converted.

**Ruling: preserve the current checkout and carry out scoped work on a new branch.** A clean worktree would omit current uncommitted theme/components that this expansion must preserve. No checkout restoration, recreation, reset or root staging is performed. Cost: final review must distinguish previous work from newly added changes.

**Ruling: parallel implementation has separate file owners and shared contracts.** Backend owns `server/` except `server/platform/jev/`; JEV owns that directory, `shared/jev-contracts.ts`, existing JEV engine and JEV UI/tests. Root owns application routing/client and integration. Cost: shared endpoint/type contracts need explicit coordination and integration tests.

**Ruling: consolidated domain files replace proposed repository filenames.** Nama fail dalam plan ialah proposal. Auth/membership berada dalam `auth.ts`; order/catalogue/inventory/payment dalam `commerce.ts`; task/document/case/calendar dalam `work.ts`; shared workspace UI berada dalam `src/features/workspaces/`. Acceptance dinilai melalui behavior/contracts dan bukti, bukan bilangan fail proposal. Existing legacy App tidak dimount sebagai aplikasi utama. AGENTS.md pengguna mengarahkan subagents proaktif; scoped parallel ownership digunakan dengan integration tests.

## 17-task requirement → implementation → evidence matrix

Semua path di bawah relatif kepada root projek. **Lokal diuji** bermaksud first-party commands/projections mempunyai tests yang disenaraikan. Final snapshot lint/build/browser/PWA/review berada di verification register; disabled transport tidak dikira connected integration.

| Task / requirement | Actual implementation (proposal consolidated) | Evidence | Status / limitation |
|---|---|---|---|
| **1 — Identity/membership**: fresh session/grants, customer ownership, staff outlet, founder/developer separation | `server/platform/auth.ts`, `app.ts`, `store.ts`; password hashing/session/CSRF/rate limits; customer-only signup, owner bootstrap, invitation, async authority recheck | `tests/platform/backend-security.test.ts`, `backend-boundaries.test.ts`, `upload-revocation.test.ts`, `client-session-race.test.ts`, `operational-amendments-api.test.ts` | Lokal diuji; owner sebenar belum diprovision bagi pihak pengguna; live Supabase RLS/identity bridge belum disahkan |
| **2 — URL shell empat role**: deep link/refresh/back/404, role spoof denial, mobile keyboard | `src/features/platform/AppRouter.tsx`, `routes.ts`, `src/features/workspaces/WorkspaceContent.tsx`; lazy loading/session-keyed subtree/mobile inert/focus trap/Escape/direct ID read | `tests/platform/routes.test.ts`; `tests/e2e/platform-shell.spec.ts`, `record-navigation.spec.ts`, `privacy-offline.spec.ts` | Lokal diuji; public host SPA fallback ialah deployment gate |
| **3 — Canonical API/transactions**: published catalogue, integer sen, revision/idempotency, stock reservations, payment vs fulfilment, no seed | `server/platform/commerce.ts`, `store.ts`, `app.ts`, `evidenceFiles.ts`; exact lifecycle/evidence/scoped stock; separate refunds/physical returns; limit/offset pagination | `backend-lifecycle.test.ts`, `backend-benefits.test.ts`, `backend-boundaries.test.ts`, `create-retry.test.ts`, `no-seeded-business.test.ts`; `platform-commerce.spec.ts` | Lokal diuji; actual business products/stock/policies kekal input pemilik |
| **4 — Shared Flow Engine**: pinned graph, advance/back/review/quote expiry/retry/form fallback | `server/platform/flows.ts`, `src/features/flows/FlowRenderer.tsx`, `flow-answers.ts`; order/complaint/dealer application/restock/stock receipt; invalidates stale review; preserves pending draft fields | `backend-flows-jobs.test.ts`, `flow-review-pagination.test.ts`, `flow-answers.test.ts`; `platform-commerce.spec.ts`, `privacy-offline.spec.ts` | Lokal diuji; web/PWA flows bukan native WhatsApp Flows |
| **5 — Landing/customer/prerender**: approved content, product detail/own orders/cases, served HTML/metadata | `src/features/landing/LandingPage.tsx`, `scripts/prerender-public.ts`, `public-html.ts`; published snapshot/price/source version/canonical/JSON-LD; product detail beyond page1 | `public-html.test.ts`, `workspace-experiences.spec.ts`, `public-metadata.spec.ts`, `full-collection-summaries.spec.ts` | Focused source/browser diuji; final served production snapshot masih dikumpulkan |
| **6 — Staff/founder/developer**: assigned work, decision queue, redacted runtime, honest state | `WorkspaceContent.tsx`, domain UI `commerce.tsx`, `work.tsx`, `business.tsx`, `operations.tsx`, `LinkedRecordContext.tsx`; real projections/full task summary | `backend-workspaces.test.ts`, `experience-model.test.ts`; `workspace-experiences.spec.ts`, `full-collection-summaries.spec.ts` | Lokal diuji; diagnostics bukan payment authority |
| **7 — PWA/offline drafts**: public-only cache, opt-in/user scope/logout purge/quota failure/session expiry | `public/platform-sw.js`, `manifest.webmanifest`, `src/features/platform/offlineDrafts.ts`, `AppRouter.tsx`; excludes private API/evidence/workspace HTML; reauthentication after expiry | `offline-cache.test.ts`, `client-session-race.test.ts`; `privacy-offline.spec.ts`; `var/log/public-release-probe.json` | Fokus produksi diuji; final build probe pending; tiada field INP/SLA claim |
| **8 — Evidence/JEV/messaging**: typed review, scoped file upload/download, current preview/grant/revision/receipt | `server/platform/work.ts`, `evidenceFiles.ts`, `jev/assessment.ts`, `policyEngine.ts`; SHA-256 actual file bytes; case assessment history/in-app replies/manual WhatsApp handoff | `backend-evidence.test.ts`, `backend-review-regressions.test.ts`, `upload-revocation.test.ts`; `tests/jev/api.test.ts`, `execution-policy.test.ts` | Lokal diuji; tiada native send/inbox/delivery receipt claim |
| **9 — Durable jobs/Hermes**: persistence/leases/checkpoints/revoked grant/recovery/bounded read adapter | `server/automation/jobs.ts`, worker loop `server/index.ts`, `adapters.ts`; local morning brief/case summary source-safe, three attempts/job console | `backend-flows-jobs.test.ts`, `backend-workspaces.test.ts`, `automation-completion.test.ts`; **`worker-process-recovery.test.ts` actual child kill/restart** | Local worker diuji; Hermes runtime belum connected; transport contract bukan install/deployment |
| **10 — Zero spend/quality/recovery**: known quotas/unknown denial/pause/read-only/runbook/backup | `server/platform/runtimeControls.ts`, `backup.ts`, `server/runtime-config.ts`, `scripts/dev.ts`, `platform-backup.ts`, `RuntimeControls.tsx`; [runbook](../docs/runbooks/platform-recovery.md) | `runtime-config.test.ts`, `backend-lifecycle.test.ts`, `backend-workspaces.test.ts`, `backup-restore.test.ts`; corruption/hash/no-overwrite restore drill | Lokal diuji; TLS/host capacity/off-site retention/sign-off external gates |
| **11 — Ejen/stokis**: approved terms/organization, quotes, exact dispatch/partial receive, ownership/custody/benefits | `server/platform/dealers.ts`, `src/features/workspaces/DealerLedger.tsx`, `shared/dealer-contracts.ts`; consignment sell-through/exact return holds/batch-expiry/HQ quarantine/settlement vs receipts | `dealer-completion.test.ts`, `backend-benefits.test.ts`, `backend-lifecycle.test.ts`; `dealer-completion.spec.ts` | Lokal diuji; actual rates/policies mesti founder approved, bukan recruitment-only rewards |
| **12 — Marketing/Postiz**: rights, exact approval/expiry/grant, manual exports, truthful remote outcomes | `server/platform/marketing.ts`, `assetBundle.ts`, `src/features/workspaces/marketing.tsx`, `AutomationWorkspace.tsx`; actual caption/archive bytes; source-linked Postiz preparation | `backend-domains.test.ts`, `backend-workspaces.test.ts`, `automation-completion-api.test.ts`; `marketing-operations.spec.ts` inspects downloaded bytes | Manual workflow diuji; Postiz live publish disabled/cancel unknown; exported bukan published |
| **13 — Research/Agent-Reach**: permitted provenance/manual fallback/grants/revocation/timeouts | `server/automation/automation.ts`, `sourcePolicy.ts`, `adapters.ts`, `AutomationWorkspace.tsx`; immutable source/brief/hash; retrieved vs published dates; interrupted no-replay outcome | `automation-completion.test.ts`, `automation-completion-api.test.ts`, `work-collaboration.test.ts` | Manual workflow diuji; actual Agent-Reach/Hermes collection belum connected; no scrape coverage claim |
| **14 — Documents/tasks/knowledge**: scope, checklist/comments/outcome, version/approval/search/source lineage | `server/platform/work.ts`, `src/features/workspaces/work.tsx`, `shared/work-collaboration-contracts.ts`; immutable completion receipt/source visibility/research-to-document | `work-collaboration.test.ts`, `work-collaboration-api.test.ts`; `workspace-experiences.spec.ts`, `record-navigation.spec.ts` | Lokal diuji; external Google work tidak silently migrated |
| **15 — QC/shifts/day-close**: approved SOP/readings/stale denial, handoff/ack, variance/review/correction history | `server/platform/operations.ts`, `operationalAmendments.ts`, operations UI; source-versioned thresholds/evidence; approved close archive/hash before reopen | `backend-review-regressions.test.ts`, `backend-lifecycle.test.ts`, `operational-amendments.test.ts`; `founder-complete.spec.ts`, `marketing-operations.spec.ts` | Lokal diuji; QA unit thresholds bukan food-safety policy/certification |
| **16 — Cross-platform JEV**: six packs/Choice/Score/Noul/context/policy/unknown/abstain/evals | `server/platform/jev/questionRegistry.ts`, `assessment.ts`, `policyEngine.ts`, `evaluations.ts`, `shared/jev-contracts.ts`, `JevEvaluationWorkspace.tsx`; support/marketing/dealer/developer/order_exception/qc | `tests/jev/assessment.test.ts`, `platform-evaluation.test.ts`, `api.test.ts`; 20 BM/English held-out QA fixtures | Lokal review/evaluation diuji; native adapter all-or-abstain; tiada calibrated probability/native latency claim |
| **17 — Founder tools**: calendar/report exports/full finance/reconciliation/people/settings/personal operations | `server/platform/reports.ts`, `operationalAmendments.ts`, `ReportBuilder.tsx`, `DerivedCalendar.tsx`, `OperationalAmendments.tsx`; full >100 aggregates/expense posting+reversal/invite/availability/real scoped activity preferences | `report-builder.test.ts`, `finance-review.test.ts`, `full-collection-summaries.test.ts`, `operational-amendments-api.test.ts`; `founder-complete.spec.ts`, `workspace-experiences.spec.ts`, `full-collection-summaries.spec.ts` | Lokal diuji; activity feed bukan push/email/WhatsApp delivery; founder-complete bukan owner sign-off |

Proposal individual repositories, `FlowFormView.tsx`, `FounderWorkspace.tsx`, `JobConsole.tsx` dan per-role folders digabungkan seperti di atas. Shared TypeScript contracts berada dalam `shared/platform-contracts.ts`, `jev-contracts.ts`, `dealer-contracts.ts`, `automation-contracts.ts`, `operation-amendment-contracts.ts`, `work-collaboration-contracts.ts` dan `report-contracts.ts`. Legacy integration entry menggunakan `IntegrationWorkspace.tsx` dengan readiness sebenar, bukan mounted legacy demo application.

## Preflight dependencies

| Producer → consumer | Contract/gate |
|---|---|
| Auth → every private route/action | Server membership, fresh session, CSRF and ownership |
| Catalog + stock ledger → order/flow/dealer | Published revision, integer sen, transactional reservation |
| Case/evidence + JEV → action inbox | Assessment is not authority; authenticated preview and receipts |
| Durable job/approval → marketing | Revision/expiry/grant check at dispatch; unknown outcomes reconciled |
| Runtime storage → all writes | Failure is not persisted-success; no demo fallback |
| Published catalog → public HTML | Public approved fields only; missing data not fabricated |

## External readiness gates

Native WhatsApp, native TypeSafe Jev, Postiz accounts/instance and Agent-Reach/Hermes runtime are not assumed connected. Implement adapters and first-party fallback workflows; record actual unavailable reasons. No new paid provider, external publication, OAuth grant or live cloud migration is authorized merely by local implementation.

## Verification log

### Evidence register yang diperiksa

| Evidence | Keputusan | Batas |
|---|---|---|
| `var/log/latest-platform-coverage.log` | **139 pass, 0 fail, 806 assertions, 40 files, 23.34s; 87.26% functions / 91.74% lines** | Snapshot sebelum worker/metadata/appearance tambahan terakhir. Coverage hanya fail yang dimuatkan suite; bukan branch coverage atau audit seluruh repo |
| `var/log/latest-platform-e2e.log` | **18 Chrome journeys pass, 1.9 min** | Snapshot sebelum final expanded suite; final run perlu menggantikan register ini |
| Focused worker process test | Parent melaporkan **3 pass / 29 assertions**, termasuk imported security tests | Actual child kill/restart pada disposable DB; bukan kill API bisnes |
| Focused public HTML test | Parent melaporkan **4 pass / 15 assertions** | Canonical/JSON-LD regeneration dan public snapshot; bukan live domain proof |
| `var/log/latest-metadata-e2e.log` | Parent melaporkan **1 browser test pass** | Hydrated metadata routes; belum final all-suite run |
| `var/log/playwright-marketing-ops-final/` | Parent melaporkan **3 browser journeys pass, 28.9s** | Isolated QA campaign/caption/archive/SOP/batch release/shift handoff/day-close; archive bytes diperiksa |
| `var/log/public-release-probe.json`, run 15:24 UTC | Production SW controlled/public published HTML; **0 private cache entries**, offline private route memerlukan auth, online recovery, tiada browser errors. LCP 404–768ms; CLS 0.00114–0.00168; sampled EventTiming32ms | Build terdahulu. Windows local Chrome headless390×844/no throttle/3 fresh contexts; bukan field INP atau universal client SLA |
| Lint/build/screenshots | Intermediate runs pass; final snapshot sedang dikumpulkan | Source selepas final edit perlu current checks dan stable captures |
| Independent code reviews | Confirmed backend/TypeScript findings direproduksi, dibetulkan dan diuji; final reviewer menutup confirmed P1/P2 dalam boundary yang diperiksa | Final marketing/metadata/appearance review pending; scoped approval bukan security certificate |

Artifacts di `var/` diabaikan Git dan boleh hilang. Ledger mengekalkan keputusan serta konteks, tanpa QA credentials atau bootstrap token. Run connection-refused akibat listener tiada, locator failures dan unstable HMR captures tidak dikira sebagai product verification.

### Regression/fix penting yang sudah ditutup

- Async evidence upload/download menyemak current authority semula; revoked dealer membership tidak mendapat restock creator bypass.
- Reconciliation dan day close pin reviewed source contents; reapproved-but-changed sources tetap memerlukan review baharu.
- Cached case reply menyemak assignment semasa; QC duplicate/out-of-range/missing/stale readings tidak release batch.
- Exact custody allocation holds dilindungi daripada consume/transfer/adjust; expired/unknown-provenance receiving masuk quarantine.
- Task/document/calendar/campaign retry tidak duplicate; paginated lists dan complete aggregates tidak kehilangan rekod selepas page pertama.
- Session response race tidak menggantikan CSRF/identity baharu; confirmed account switch menghapus old private workspace state.
- Accepted flow answers tidak ditimpa restored draft lama; pending fields kekal pada advance/back/reload.
- Calendar links menggunakan actual stored record kind dan current authorization; UUID prefix tidak diteka.
- Vite watch mengecualikan `var`, reports/tests/docs supaya evidence writes tidak reload browser journey.
- Simulated staff login, seeded live cloud orders dan failure→success fallback dibuang daripada reachable platform. Unmounted legacy files tidak dianggap seluruhnya audit bersih.

### Final first-party gates — status kekal aktif sehingga bukti diterima

1. Expanded final Chrome suite, current coverage/lint/build dan current production PWA/public snapshot.
2. Stable desktop/mobile/light captures, source fake/mock scan dan business listener/no-seed recheck.
3. Narrow final metadata/appearance/marketing review dan local Markdown link validation.

### External/configuration gates yang tidak digambarkan sudah selesai

- Founder credential/actual identity mesti dipilih pemilik melalui one-time bootstrap; tiada guessed account atau sign-off dibuat.
- Actual produk, stok, opening balances, SOP dan commercial/financial policy perlu owner-approved inputs; QA tidak mengisi data bisnes.
- Public domain/TLS/reverse proxy/host capacity, off-site backups dan cloud migration belum deployed/disahkan.
- Native WhatsApp, native TypeSafe JEV, Postiz live publication/cancel dan actual Hermes/Agent-Reach collection kekal unavailable/disabled. Test transport doubles membuktikan boundary, bukan vendor connection.
- Grok Bot, Muse, Dots dan DeepSeek Harness ialah research/synthesis inputs; tiada connector hidup didakwa.
- LOCAL_RULES JEV tidak memberi financial authority, calibrated probabilities atau native latency guarantee.

**Completion ruling:** Semua first-party requirements dinilai melalui matriks 17 task, bukan subset task yang kebetulan green. Final status hanya berubah selepas release evidence lengkap. Tiada audit pensijilan, worldwide performance claim atau founder business acceptance dibuat.

Full recap: [RECAP_SINTESIS_DAN_PELAKSANAAN_ABANGCOLEK_2026-10-02.md](RECAP_SINTESIS_DAN_PELAKSANAAN_ABANGCOLEK_2026-10-02.md).
