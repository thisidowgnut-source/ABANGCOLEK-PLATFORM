# ABANGCOLEK Unified Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use superpowers:subagent-driven-development only when delegation is authorized. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membina landing page dan workspace Customer, Staff, Founder serta Developer yang berkongsi rekod operasi, conversational flows dan bukti tindakan, menggunakan sumber sedia ada tanpa langganan berbayar baharu.

**Architecture:** Perluas React/Vite secara incremental. Tambah satu server boundary untuk authentication, membership, transaksi, evidence dan durable jobs; browser tidak menentukan kuasa pengguna. Kekalkan komponen/tema semasa dan letakkan messaging serta agent runtime di belakang adapter yang boleh dimatikan.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Bun tests dan Supabase client sedia ada. Runtime API Bun lokal ialah cadangan implementasi; akses HTTPS awam, kapasiti host dan ketersediaan Bun mesti dibuktikan sebelum rollout. Provider/hosting percuma tertakluk quota dan terma semasa.

**Spec:** [09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md](../../../reports/research/2026-10-02/09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md).

**Status:** PLAN READY — 2 Oktober 2026. Pengguna telah mengarahkan pelaksanaan terus selepas dokumentasi lengkap; tidak perlu meminta pengesahan execution sekali lagi. Fail ini menerangkan rancangan dan gates, bukan bukti semua task sudah siap. Penulisan dokumen ini tidak melakukan install, migration atau side effect luaran.

## Global Constraints

- Tiada langganan/model berbayar baharu; feature yang memerlukan caj kekal disabled sehingga arahan khusus pengguna.
- Tiada clone, reinstall atau rewrite projek. Lindungi perubahan lain dan migrasi data secara additive.
- Gunakan BM/English, dark/light token semasa, sasaran WCAG AA dan kawalan minimum 44px.
- Customer, Staff, Founder, Developer ialah experience; server membership ialah sumber permission.
- Pengalaman Flow dalam web/PWA bukan WhatsApp native. Deep link/manual handoff tidak memberikan akses inbox atau delivery receipt.
- Demo data mesti dilabel dan diasingkan. Production read tidak boleh auto-seed sample.
- JEV ialah classifier/evidence aid; ia tidak meluluskan refund, pembayaran, role atau penghantaran mesej.
- Logs/PID/dynamic data menggunakan `var/log`, `var/run`, `var/lib`, `var/spool`; jangan menambah runtime files pada root.

## Review Focus

1. Tukar role melalui URL/LocalStorage/metadata tidak boleh membuka rekod terlarang — Task 1/2.
2. Request dihantar dua kali selepas timeout tidak boleh menggandakan order, stok atau mesej — Task 3/4/8.
3. Session tamat semasa flow mesti mengekalkan draft yang selamat dan meminta re-authentication — Task 4/5.
4. Customer pada shared phone/offline tidak boleh melihat evidence atau cache customer lain — Task 7.
5. Provider/quota/worker gagal mesti menghasilkan status jujur dan recovery tanpa claim selesai — Task 9/10.

## Bukti Source dan Peta Fail

Source diperiksa pada 2 Oktober 2026: `src/App.tsx:926` menggunakan `activeTab`; `src/services/supabaseAuth.ts` mempunyai simulated staff fallback; `src/services/store.ts` membaca data.json/LocalStorage. `src/services/supabaseOrders.ts` boleh auto-seed apabila hasil kosong. Semua ini perlu boundary baharu sebelum akses awam. Satu suite sedia ada ialah `tests/dashboard-model.test.ts`.

| Fail/folder | Tindakan dan tanggungjawab |
|---|---|
| `src/App.tsx`, `src/main.tsx` | Integrasikan app router; pindahkan workspace lama secara berperingkat |
| `src/features/platform/` **baharu** | URL router, session context, workspace resolver |
| `src/features/customer/`, `staff/`, `founder/`, `developer/`, `landing/` **baharu** | Experience berasingan dengan capability daripada server |
| `src/features/flows/` **baharu** | Renderer conversational dan form daripada definisi sama |
| `shared/platform-contracts.ts` **baharu** | Role, Actor, entity, flow dan execution contracts |
| `server/platform/` **baharu** | Authorization, repositories, transaksi dan HTTP handlers |
| `server/automation/` **baharu** | Jobs, lease, quota dan agent adapter |
| `src/features/marketing/`, `server/marketing/` **baharu** | Campaign, calendar, approved assets, manual export dan optional publisher adapter |
| `src/features/work/`, `server/platform/workRepository.ts` **baharu** | Shared documents, tasks dan approved knowledge dengan revision/scope |
| `src/features/operations/`, `server/operations/` **baharu** | QC, shift handoff dan day-close reconciliation |
| `src/services/store.ts`, `supabaseOrders.ts`, `supabaseAuth.ts` | Compatibility adapter, demo boundary dan real auth |
| `src/features/theme/`, `src/components/WorkspaceSidebar.tsx` | Reuse token; role-specific navigation tanpa security claim |
| `tests/platform/`, `tests/flows/`, `tests/e2e/` **baharu** | Unit, API/policy dan role journey tests |

Semua laluan **baharu** di atas ialah proposal, bukan fail yang sudah wujud. Migration filename ditentukan melalui workflow/CLI rasmi ketika execution; dokumen ini tidak mereka SQL production.

## Contracts Bersama

```typescript
type WorkspaceRole = 'customer' | 'staff' | 'founder' | 'developer';
type Actor = { userId: string; workspaceId: string; membershipVersion: number };
type Decision = { allowed: boolean; reasonCode: string };
type Result<T> = { ok: true; data: T } | { ok: false; code: string; requestId: string };
type FlowDefinition = { id: string; version: number; entry: string; nodes: FlowNode[] };
type FlowNode = { id: string; kind: 'choice' | 'text' | 'attachment' | 'review' | 'receipt'; field?: string; next?: string; options?: { label: string; value: string; next: string }[] };
type FlowSession = { id: string; flowId: string; version: number; currentNode: string; revision: number; status: 'draft' | 'submitted' | 'expired' };
type ActionPreview = { id: string; entityId: string; operation: string; recipient?: string; revision: number; expiresAt: string };
type ExecutionReceipt = { id: string; requestId: string; status: 'confirmed' | 'failed' | 'unknown'; evidenceIds: string[] };
```

Role bindings, prices, stock, recipients dan flow answers disimpan server-side; jangan percaya nilai autoritatif yang dihantar browser. Monetary amounts menggunakan integer sen; audit menyimpan actor, entity, revision dan timestamp UTC, dengan paparan MYT.

### Contract Register: Definisi Wajib Sebelum Penggunaan

Blok TypeScript di atas ialah core contract, bukan keseluruhan schema. Semua nama dalam Interfaces mesti diexport daripada `shared/platform-contracts.ts` oleh task pemilik di bawah, dengan runtime validator di server. Additive fields dibenarkan; schema mesti mengehadkan field yang boleh diubah client. Jangan menggunakan `any`, local duplicate type atau placeholder response untuk menutup dependency belum siap.

| Pemilik | Types dan minimum fields yang diputuskan |
|---|---|
| Task 1 | `Membership`: userId/workspaceId/role/outletIds/dealerOrgId?/status/version; `Actor` seperti di atas, tanpa role yang ditentukan browser |
| Task 2 | `RouteMatch`: kind/public-or-workspace/path/role?/entityId?; `NavigationItem`: id/label/path/requiredCapability |
| Task 3 | `OrderInput`: lines `{productId, quantity}`/catalogueVersion/fulfilment/contactRef; `OrderRecord`: id/customerId/lines/amountSen/fulfilmentStatus/revision/paymentState; `FulfilmentStatus`: requested/review/accepted/packing/packed/dispatched/received/cancelled; `PaymentState`: pending/verified/refund_requested/part_refunded/refunded/rejected; `PublicProduct`: id/name/description/priceSen/currency/packSize/publishedVersion; `InventoryReservation`: id/orderId/productId/ownerId/locationId/quantity/status/expiresAt/revision; `InventoryMovement`: id/productId/ownerId/locationId/quantityDelta/operationKey/sourceEntityId/createdAt. `quantity` integer positif; server menentukan amountSen. Legacy Processing/Delivered/etc hanya UI compatibility mapping, bukan transaction state baharu |
| Task 6 | `TaskRecord`: id/entityId/assigneeId/status/dueAt?/revision; `RedactedHealth`: component/status/observedAt/reasonCode dengan tiada credential/raw customer data |
| Task 7 | `SafeDraft`: flowId/version/answers/updatedAt/expiresAt; validator menolak token, payment credential dan attachment binary |
| Task 8 | `JevAssessment`: caseId/schemaVersion/method/dimensions/evidenceIds/unknownReasons/assessedAt; `CaseRecord`: id/orderId/customerId/assignedStaffId?/status/revision; `EvidenceRecord`: id/entityId/ownerId/mimeType/storageRef/visibility/createdAt |
| Task 9 | `JobInput`: kind/entityId/skillVersion/scope; `JobRecord`: id/status/attempt/leaseOwner?/leaseUntil?/checkpoint?/idempotencyKey; `ReadOnlyAgentTask`: jobId/objective/allowedToolIds/sourceRefs; `AgentResult`: status/artifactIds/evidenceIds/unknownReasons |
| Task 10 | `WorkEstimate`: operation/providerId/estimatedUnits; `UsageSnapshot`: providerId/observedUnits/limitUnits/resetAt?/observedAt/available. Unknown usage tidak menjadi zero |
| Task 11 | `RestockInput`: dealerOrgId/lines/priceVersion; `VersionedQuote`: id/priceVersion/lines/totalSen/expiresAt; `ReceiptInput`: shipmentId/lines/expectedRevision; `StockReceipt`: id/movementIds/receivedAt; `EligiblePaidOrder`: orderId/paidAmountSen/paymentConfirmedAt?/refundAmountSen; `CommissionPolicy`: id/version/eligibleProductIds/rateBasisPoints/approvedAt; `EarnedBenefit`: orderId/policyVersion/amountSen/reasonCode |
| Task 12 | `CampaignRecord`: id/title/objective/status/ownerId/revision; `PublishIntent`: id/campaignId/assetVersion/channel/accountId?/scheduledAt?/approvalId/approvalExpiresAt/grantVersion/idempotencyKey; `PublishOutcome`: intentId/status/providerRef?/evidenceIds/reasonCode; `CancelOutcome`: providerRef/status/evidenceIds dengan status cancelled/cancel_pending/unknown; `ChannelCapability`: provider/channel/accountScope/allowedOperations/verifiedAt; `ExportArtifact`: id/campaignRevision/format/fileRefs/status dengan status literal `exported` |
| Task 13 | `ResearchRequest`: question/allowedSources/sessionGrantId?/maxItems; `ResearchBrief`: id/summary/sourceRefs/unknownReasons/retrievedAt; `SourceRef`: url/title/retrievedAt/contentHash?/accessMethod/termsCheck. Claimed publication date mesti berasingan daripada retrievedAt |
| Task 14 | `DocumentRecord`: id/title/body/version/visibility/entityIds/ownerId/approvedVersion?; `KnowledgeEntry`: id/documentId/version/status/sourceRefs/expiresAt?/approvedBy?; `WorkTaskInput`: entityId/title/assigneeId/dueAt?/documentIds |
| Task 15 | `QcRecord`: id/batchId/sopVersion/readings/operatorId/status/revision; `ShiftRecord`: id/outletId/staffIds/status/openedAt/closedAt?/revision; `DayCloseRecord`: id/outletId/date/expectedCashSen/countCashSen/paymentRefs/discrepancySen/status/revision |
| Task 16 | `TypedAssessment`, `AllowedContext`, `EvaluationRun` didefinisikan dalam Interfaces dan schema step Task 16, diexport daripada `shared/jev-contracts.ts`; existing `JevAssessment` Task 8 dipetakan oleh explicit versioned adapter |
| Task 17 | `CalendarEventRecord`: id/title/entityIds/ownerId/startAt/endAt/timezone/revision; `ReportDefinition`: id/metricIds/filterScope/sourceVersion; `ReportArtifact`: id/sourceVersions/generatedAt/fileRefs; `ExpenseRecord`: id/outletId/amountSen/category/evidenceIds/status/revision; `ReconciliationRecord`: id/period/paymentRefs/expenseRefs/discrepancies/status/revision; `MembershipChange`: userId/workspaceId/role/scopes/expectedVersion; `SettingChange`: key/value/expectedVersion; `BusinessSettings`: id/version/approvedPolicies/locale/timezone; schema disahkan oleh server, tiada arbitrary executable settings |

### Dependencies dan Build Order

Task numbering ialah ownership, bukan izin bypass dependency. Urutan praktikal: **1 → 2 → 3 → 4 → 8 → 5 → 7 → 14 → 11 → 15 → 6 → 9 → 10 → 16 → 17 → 12 → 13**. Task 6 boleh menyediakan shell awal selepas Task 2, tetapi full role journey memerlukan Task 8/14/15. Task 10 gate diaplikasikan semula apabila adapter baharu ditambah.

| Task | Dependency keras / release condition |
|---|---|
| 1–2 | Identity sebelum workspace data; public landing shell boleh diuji tanpa login |
| 3–5 | Task 3 published catalogue dan order API sebelum purchase flows/landing commerce; Task 5 complaint journey memerlukan Task 8 case/evidence repository |
| 7–8 | Task 1/3/4; private cache dan evidence policy sebelum customer rollout |
| 14 | Task 1/3/8; satu shared task/document repository sebelum workspace automation |
| 11/15 | Task 1/3/4/8; Task 11 inventory ledger dan Task 14 approved SOP sebelum QC release/stock movement |
| 6 | Task 2/3/8/14/15; pending features tidak memaparkan status palsu |
| 9–10 | Task 1/3/8/14, real persistence dan quota admission sebelum automation |
| 12 | Task 1/3/8/9/10/14/16; manual marketing dahulu, optional Postiz hanya selepas deployment/provider gate |
| 13 | Task 8/9/10/14/16; explicit source/session permission sebelum external research |
| 16 | Task 1/3/8/9/10/14; complaint pack dahulu, optional real TypeSafe adapter selepas capability/cost verification |
| 17 | Task 1/3/6/10/14/15; operational calendar, reports/export, expenses/reconciliation dan People/settings wajib sebelum founder-complete gate |

## Task 1: Canonical Identity dan Membership

**Files:** Create `server/platform/authorization.ts`, `membershipRepository.ts`, `shared/platform-contracts.ts`; modify `src/services/supabaseAuth.ts`; test `tests/platform/authorization.test.ts`.

**Interfaces:** `resolveActor(accessToken: string): Promise<Result<Actor>>`; `authorize(actor: Actor, operation: string, entityId?: string): Promise<Decision>`.

- [ ] Tulis failing tests bagi expired token, revoked membership, customer A meminta order B, staff outlet A meminta outlet B, dan developer meminta pembayaran production. Assertion utama:

```typescript
expect(await authorize(customerA, 'order.read', orderB)).toMatchObject({ allowed: false });
expect(await authorize(developer, 'payment.confirm', orderA)).toMatchObject({ allowed: false });
```

- [ ] Jalankan `bun test tests/platform/authorization.test.ts`; expected FAIL sebelum implementasi.
- [ ] Implement real session validation dan membership lookup setiap sensitive action. Public registration hanya customer; founder bootstrap melalui proses owner, staff/developer melalui invitation. Pisahkan development simulation daripada production dan keluarkan password tetap.
- [ ] Reka grants customer ownership, staff assigned outlet/task, founder business scope, developer runtime/config scope. Audit elevation; database policy mesti enforce scope walaupun Data API dipanggil terus.
- [ ] Load Supabase/Postgres skills dan docs semasa sebelum schema/RLS; uji policy pada database disposable sahaja. PASS semua deny/allow tests; review security; commit `feat: add canonical workspace membership`.

**Go/no-go:** Tiada public authenticated workspace sehingga token dan row-scope tests lulus.

## Task 2: URL Routing dan Shell Empat Workspace

**Files:** Create `src/features/platform/AppRouter.tsx`, `routes.ts`, `WorkspaceResolver.tsx`; create `src/features/founder/FounderWorkspace.tsx`; modify `src/App.tsx`, `src/components/WorkspaceSidebar.tsx`; test `tests/platform/routes.test.ts`.

**Interfaces:** `resolveRoute(pathname: string): RouteMatch`; `getNavigation(role: WorkspaceRole, capabilities: string[]): NavigationItem[]`.

- [ ] Test `/`, `/customer/orders/:id`, `/staff/inbox`, `/founder/overview`, `/developer/runtime`; customer URL ke founder mesti redirect kepada denied state, bukan mount dashboard.
- [ ] Run `bun test tests/platform/routes.test.ts`; FAIL, kemudian implement history/popstate routing tanpa dependency tambahan. Pilihan workspace hanya untuk role yang server sahkan.
- [ ] Extract workspace sedia ada sebagai FounderWorkspace, preserve 18 modul. Lazy-load setiap experience; unknown URL menghasilkan 404 yang berguna.
- [ ] PASS tests dan browser refresh/back/deep-link checks. Hosting mesti menyediakan SPA fallback pada workspace URL; commit `feat: add role workspace routing`.

## Task 3: Rekod Operasi dan API Boundary

**Files:** Create `server/index.ts`, `server/platform/orderRepository.ts`, `orderCommands.ts`, `auditRepository.ts`, `catalogueRepository.ts`, `inventoryLedger.ts`, `inventoryReservations.ts`; modify `src/services/store.ts`, `supabaseOrders.ts`; test `tests/platform/order-commands.test.ts`, `tests/platform/catalogue.test.ts`, `tests/platform/inventory-reservations.test.ts`.

**Interfaces:** `getPublicCatalogue(): Promise<Result<PublicProduct[]>>`; `submitOrder(actor: Actor, input: OrderInput, idempotencyKey: string): Promise<Result<OrderRecord>>`; `transitionFulfilment(actor: Actor, id: string, expectedRevision: number, next: FulfilmentStatus): Promise<Result<OrderRecord>>`; `reserveInventory(actor: Actor, orderId: string, expectedRevision: number): Promise<Result<InventoryReservation[]>>`; `releaseReservation(actor: Actor, reservationId: string, operationKey: string): Promise<Result<InventoryReservation>>`.

- [ ] Tests: invalid amount, changed catalogue price, duplicate submit dan competing staff revision. `expect(second.data.id).toBe(first.data.id)`; stale write returns `REVISION_CONFLICT`.
- [ ] Catalogue test menolak unpublished SKU, menyembunyikan internal margin dan memaksa re-quote apabila publishedVersion berubah. Implement versioned catalogue repository sebelum menerima `OrderInput`; jangan percaya harga daripada landing/client.
- [ ] Inventory tests: dua concurrent purchase untuk unit terakhir menghasilkan tepat satu reservation/order success; duplicate submit tidak double-reserve; expired/cancelled reservation release sekali; stock daripada owner/location lain tidak boleh dipinjam senyap. Run `bun test tests/platform/inventory-reservations.test.ts`; FAIL sebelum implementasi.
- [ ] State-guard tests: client tidak boleh skip requested/review kepada dispatched/received; rejected/unverified receipt tidak menghasilkan verified payment; packed tanpa fulfilment evidence tidak dispatch; ETA tidak menjadi receipt; refund tidak memadam fulfilment history. Implement transition matrix: requested→review→accepted→packing→packed→dispatched→received, dengan cancellation hanya melalui policy pada state sah. Acceptance memerlukan verified payment atau approved COD/credit policy; pack/dispatch/receipt memerlukan grant serta evidence masing-masing. Payment transitions dan partial-refund ledger berasingan daripada fulfilment; source lama menggunakan explicit compatibility mapping.
- [ ] FAIL suite; implement base inventory movement/reservation ledger dalam Task 3, dengan transaction/locking yang menyatukan order, availability dan audit. Availability excludes active reservations; fulfilment consumes reservation sekali dan cancellation releases sekali. Persist payment separately: uploaded receipt bukan confirmed payment. Server generates totals; inventory movement mempunyai unique business operation key. Refund tidak automatik memasukkan barang kembali sebelum receipt/QC return sah.
- [ ] Hapus auto-seed daripada live reads; demo repository di namespace berasingan. API body/attachment limits, schema validation, rate limits dan redacted errors wajib. Session/cookie strategy determines CSRF controls; jangan gunakan permissive CORS.
- [ ] PASS disposable persistence/API tests; `bun run lint`; commit `feat: add authoritative order commands`.

## Task 4: Shared Flow Engine

**Files:** Create `src/features/flows/FlowRenderer.tsx`, `FlowFormView.tsx`, `definitions.ts`; create `server/platform/flowSessions.ts`; test `tests/flows/flow-engine.test.ts`.

**Interfaces:** `advanceFlow(actor: Actor, sessionId: string, expectedRevision: number, answer: unknown): Promise<Result<FlowSession>>`; `submitFlow(actor: Actor, sessionId: string, idempotencyKey: string): Promise<Result<ExecutionReceipt>>`.

- [ ] Test purchase, complaint, agent application dan reorder branches. Malicious `next` daripada client ditolak; same submission menghasilkan receipt sama; old definition version resumes atau meminta migration yang jelas.
- [ ] FAIL suite; implement immutable versioned definitions, answer validation, server-side graph transition, expiry, review-before-submit dan resume selepas re-authentication.
- [ ] Renderer menyediakan chat-like cards, normal form fallback, accessible back button dan preserved validation messages. Data tidak dijana semata-mata oleh LLM.
- [ ] PASS flow tests; browser keyboard/touch checks; commit `feat: add versioned conversational flows`.

## Task 5: Landing dan Customer Portal

**Files:** Create `src/features/landing/LandingPage.tsx`, `ProductCatalogue.tsx`, `ApprovedContent.ts`, `scripts/prerender-public.ts`; create `src/features/customer/CustomerWorkspace.tsx`, `OrderTimeline.tsx`, `SupportCaseView.tsx`, `playwright.config.ts`; modify `package.json`/lockfile ketika execution jika browser runner diperlukan; test `tests/platform/public-html.test.ts`, `tests/e2e/customer-journey.spec.ts`.

**Interfaces:** Consume `getPublicCatalogue` dan order commands daripada Task 3; consume Task 4 flow contracts. Task 5 tidak mencipta authoritative catalogue kedua.

- [ ] Failing journey: landing → product → flow → order receipt → own timeline → complaint. Session expiry returns login/resume; customer lain tidak boleh membuka timeline itu.
- [ ] Implement approved brand/story/product data sahaja; placeholder tidak boleh dilabel certification atau testimonial sebenar. Public CTA: beli, semak pesanan, bantuan, mohon ejen dan masuk workspace.
- [ ] Render published fields daripada Task 3; add page titles, descriptions, semantic headings, share metadata dan structured product data. Order tracking memerlukan ownership atau scoped expiring token; jangan gunakan order ID sahaja.
- [ ] Implement build-time prerender/SSG untuk public landing/product URLs menggunakan approved catalogue snapshot/version; private workspace kekal client app. `bun test tests/platform/public-html.test.ts` mesti prove HTML tanpa JavaScript mempunyai title/description/canonical/product copy/JSON-LD daripada publishedVersion sama, tiada draft/private fields. `bun run build` runs public generation; missing approved snapshot fails public release, bukan fabricate content. Cache invalidation/version refresh diuji selepas product update.
- [ ] Browser runner belum disenaraikan dalam package.json yang diperiksa. Semasa execution, verify dokumentasi dan pin `@playwright/test` jika diperlukan; `bunx playwright test tests/e2e/customer-journey.spec.ts` mesti PASS termasuk mobile320px. Commit `feat: add customer platform experience`.

## Task 6: Staff, Founder dan Developer Workspaces

**Files:** Create `src/features/staff/StaffWorkspace.tsx`, `TaskDrawer.tsx`; create `src/features/founder/DecisionInbox.tsx`; create `src/features/developer/DeveloperWorkspace.tsx`, `RuntimeHealth.tsx`, `server/platform/runtimeHealth.ts`; test `tests/e2e/workspace-roles.spec.ts`.

**Interfaces:** `getAssignedTasks(actor: Actor): Promise<Result<TaskRecord[]>>`; `getDecisionInbox(actor: Actor): Promise<Result<ActionPreview[]>>`; `getRuntimeHealth(actor: Actor): Promise<Result<RedactedHealth>>`.

- [ ] Failing tests untuk assigned pick/pack, founder resolution dan developer diagnostics. Developer diagnostics tidak mengandungi token/customer payload.
- [ ] Staff: shift checklist, assigned orders, fulfilment proof, stock count dan handoff. Founder: decision inbox, receivables, stock exceptions, business outcomes. Developer: provider/quota status, feature flags, sanitized jobs dan rollback control.
- [ ] Implement `getRuntimeHealth` dalam server health module, consume `getAssignedTasks` Task 14 dan `getDecisionInbox` Task 8. Component yang belum configured melaporkan unavailable, bukan green/connected.
- [ ] Gunakan shared drawer bagi evidence, recipient, preview dan outcome. Customer complaint bergerak ke staff triage, founder approval jika diperlukan, kemudian resolution customer daripada entity sama.
- [ ] Run `bunx playwright test tests/e2e/workspace-roles.spec.ts`; PASS role journeys dan API denial. Reuse existing Orders/Bus/Dashboard/Workspace views melalui scoped adapters; commit `feat: add operational role experiences`.

## Task 7: PWA dan Offline Drafts

**Files:** Create `public/manifest.webmanifest`, `src/features/platform/offlineDrafts.ts`, `service-worker.ts`; modify `src/main.tsx`; test `tests/platform/offline-cache.test.ts`.

**Interfaces:** `saveOfflineDraft(userId: string, draft: SafeDraft): Promise<void>`; `purgeUserCache(userId: string): Promise<void>`.

- [ ] Test logout/user-switch wipes drafts; offline submit remains `pending`, reconnect double retry creates one order.
- [ ] Cache static shell/public catalogue sahaja. Jangan cache OAuth tokens, private attachments, founder KPI atau payment records. Private draft storage opt-in dengan shared-device mode; offline indicator sentiasa jelas.
- [ ] PASS cache tests dan install/reconnect browser journey. PWA ialah enhancement; web kekal berfungsi tanpa install; commit `feat: add safe offline flow drafts`.

## Task 8: JEV, Evidence dan Messaging

**Files:** Create `server/platform/jevAssessment.ts`, `caseRepository.ts`, `evidenceRepository.ts`, `actionPreviews.ts`, `messagingAdapter.ts`; create `src/features/quality/EvidenceDesk.tsx`; modify `src/services/jevEngine.ts`; test `tests/platform/evidence-actions.test.ts`.

**Interfaces:** `assessComplaint(actor: Actor, caseId: string): Promise<Result<JevAssessment>>`; `prepareMessage(actor: Actor, caseId: string, channel: 'in_app' | 'manual_whatsapp'): Promise<Result<ActionPreview>>`; `getDecisionInbox(actor: Actor): Promise<Result<ActionPreview[]>>`; `confirmAction(actor: Actor, previewId: string, expectedRevision: number): Promise<Result<ExecutionReceipt>>`.

- [ ] Tests: empty model returns `UNKNOWN`; leakage root cause stays `UNDETERMINED`; changed recipient invalidates preview; `prepareMessage` calls zero external-send functions.
- [ ] Implement persisted case/evidence repositories, schema/probability validation, evidence provenance, human determination dan signed short-lived attachment access. `getDecisionInbox` queries actor-authorized current previews sahaja; scan/limit uploads dan treat attachment text sebagai untrusted input.
- [ ] Default in-app reply + copy/manual WhatsApp handoff. Label manual handoff sebagai belum disahkan dihantar. Native WhatsApp adapter feature-flagged sehingga eligibility, pricing, consent dan webhook tests sah; jangan scrape inbox/automate WhatsApp Web.
- [ ] PASS tests/role evidence checks; commit `fix: separate evidence assessment from message execution`.

## Task 9: Durable Jobs dan Hermes Pilot

**Files:** Create `server/automation/jobRepository.ts`, `worker.ts`, `runtimeAdapter.ts`, `hermesAdapter.ts`; create `src/features/developer/JobConsole.tsx`; test `tests/platform/job-recovery.test.ts`.

**Interfaces:** `enqueueJob(actor: Actor, input: JobInput, key: string): Promise<Result<JobRecord>>`; `claimJob(workerId: string): Promise<JobRecord | null>`; `AgentRuntime.run(task: ReadOnlyAgentTask, signal: AbortSignal): Promise<AgentResult>`.

- [ ] Test worker death, expired lease, cancellation, uncertain provider outcome dan duplicate callback. Retry tidak membuat side effect dua kali.
- [ ] Implement durable lease/checkpoint, bounded retries dan reconciliation state. Hermes adapter read-only dahulu; skill version, scoped tool grants, timeout dan quota recorded. Existing host/provider compatibility ialah gate; tiada assumption installed/available.
- [ ] Grok ownership/handoff, Muse activity dan dots continuity digunakan sebagai UX principles. Adapter DSH alternatif hanya selepas contract tests; model failure tidak mengubah transaksi secara langsung.
- [ ] PASS injected crash tests dan kill/restart smoke proof; commit `feat: add recoverable read-only agent jobs`.

## Task 10: Zero New Spend dan Quality Gates

**Files:** Create `server/automation/quotaPolicy.ts`, `src/features/developer/QuotaConsole.tsx`; create `docs/runbooks/platform-recovery.md`; test `tests/platform/quota-policy.test.ts`.

**Interfaces:** `admitWork(input: WorkEstimate, usage: UsageSnapshot): Decision`.

- [ ] Test near quota rejects optional AI/publisher sambil core DB/auth/storage healthy: orders/manual resolution masih usable. Test authoritative DB/storage unavailable secara berasingan: submit/action fail closed atau safe draft pending, tiada success/received/confirmed claim dan tiada fallback menulis demo data. Unavailable provider reports unavailable rather than zero usage; recovery replay menghasilkan satu receipt selepas persistence sah.
- [ ] Establish deterministic-first tools, cached read results, per-role throttling dan local fallback where validated. Free tier bukan SLA; electricity, connectivity, existing equipment, merchant charges dan operator time tidak dianggap sifar.
- [ ] Measure landing LCP target ≤2.5s, INP ≤200ms, CLS ≤0.1 on declared test profile; verify keyboard, contrast, reduced motion dan responsive overflow. Critical business/security branches target ≥80% meaningful coverage; jangan claim existing coverage.
- [ ] Run focused suites, `bun run lint`, `bun run build`, role E2E dan disposable backup/restore drill; commit `feat: add capacity guardrails and release evidence`.

## Task 11: Dealer/Ejen/Stokis B2B Portal

**Spec tambahan:** [10_AGENT_STOKIS_BUSINESS_SYSTEM.md](../../../reports/research/2026-10-02/10_AGENT_STOKIS_BUSINESS_SYSTEM.md). Customer experience mempunyai B2B subspace; dealer bukan automatik staff. Business membership mengikat dealer organization dan authorized users kepada order/stock milik mereka sahaja.

**Files:** Create `src/features/dealers/DealerWorkspace.tsx`, `RestockFlow.tsx`, `StockOwnershipView.tsx`; create `server/platform/dealerPolicy.ts`, `commissionLedger.ts`; modify `server/platform/inventoryLedger.ts`, `inventoryReservations.ts` daripada Task 3; test `tests/platform/dealer-policy.test.ts`.

**Interfaces:** `quoteRestock(actor: Actor, input: RestockInput): Promise<Result<VersionedQuote>>`; `recordStockReceipt(actor: Actor, input: ReceiptInput, idempotencyKey: string): Promise<Result<StockReceipt>>`; `calculateEarnedBenefit(input: EligiblePaidOrder, policy: CommissionPolicy): EarnedBenefit`.

- [ ] Tulis failing tests: dealer A tidak melihat dealer B; invalid pack quantity ditolak; stale price version meminta re-quote; consigned stock tidak menjadi owned stock hanya melalui receipt; duplicate receipt tidak menambah stok dua kali; unpaid order dan enrollment sahaja menghasilkan zero earned commission.
- [ ] Jalankan `bun test tests/platform/dealer-policy.test.ts`; expected FAIL, kemudian extend Task 3 ledger untuk dealer owner/custody/consignment, approval restock dan immutable receipt. Jangan bina ledger kedua atau double-write event yang sama.
- [ ] Tier, MOQ, pack size, price version, return rules dan eligible commission policy mesti konfigurasi yang founder sahkan. Jangan jadikan nombor/pakej dalam sample sebagai polisi rasmi. Forecast/benefit labels membawa provenance; real privileges diaktifkan hanya selepas gate kontrak, pembayaran atau achievement yang ditetapkan.
- [ ] Reuse FlowDefinition untuk permohonan dealer, restock, penerimaan dan aduan. Founder melihat approval/receivables; staff melihat fulfilment yang assigned; developer melihat diagnostics disanitasi.
- [ ] PASS policy tests, ledger reconciliation dan cross-role B2B journey; review sebelum commit `feat: add scoped dealer restock and stock ledger`.

**Go/no-go:** Portal read-only boleh dibuka selepas membership isolation; ordering/commission kekal disabled sehingga polisi dan ledger diterima founder. Tiada ganjaran berdasarkan perekrutan sahaja.

## Task 12: First-party Marketing Workspace dan Optional Postiz

**Spec tambahan:** Research marketing/social dalam master spec dan laporan susulan research. Fasa wajib ialah editor, assets, calendar, approval serta manual export. Publishing automatik ialah optional subtask selepas deployment dan channel gates; ia bukan syarat penggunaan platform asas.

**Files:** Create `src/features/marketing/MarketingWorkspace.tsx`, `ContentCalendar.tsx`, `CampaignEditor.tsx`, `AssetLibrary.tsx`, `PublishPreview.tsx`; create `server/marketing/campaignRepository.ts`, `publicationCommands.ts`, `publisherAdapter.ts`, `postizAdapter.ts`; test `tests/platform/marketing-publish.test.ts`, `tests/e2e/marketing-workspace.spec.ts`.

**Interfaces:** `saveCampaign(actor: Actor, input: CampaignRecord, expectedRevision: number): Promise<Result<CampaignRecord>>`; `preparePublish(actor: Actor, input: PublishIntent): Promise<Result<ActionPreview>>`; `exportCampaign(actor: Actor, id: string, format: 'text' | 'asset_bundle'): Promise<Result<ExportArtifact>>`; `PublisherAdapter.getCapabilities(actor: Actor): Promise<ChannelCapability[]>`; `PublisherAdapter.publish(intent: PublishIntent): Promise<PublishOutcome>`; `PublisherAdapter.cancel(providerRef: string): Promise<CancelOutcome>`.

- [ ] Failing tests: staff prepares tetapi cannot approve tanpa grant; unapproved asset tiada publish; edit copy/media selepas approval invalidates approval; manual export returns `exported`, tidak `published`; retry selepas unknown provider response tidak double-post.
- [ ] Queue tests: revoke grant atau edit approved asset selepas remote schedule invokes cancellation; cancellation timeout menghasilkan `cancel_pending`/`unknown`, bukan cancelled; expired approval/grant sebelum scheduled time blocks dispatch; old callback tidak menghidupkan semula cancelled revision. Remote schedule tanpa verified cancellation/readback capability mesti ditolak, dengan local scheduling/manual export sebagai fallback.
- [ ] Run `bun test tests/platform/marketing-publish.test.ts`; FAIL, kemudian implement campaign revision, account/channel identity, approved copy, linked products, asset-rights/consent metadata dan calendar MYT. Harga/stock claims mengambil catalogue/version sah, bukan research result. Template/model output sentiasa draft.
- [ ] Implement text/asset export dahulu; copy caption, download approved files dan rekod manual handoff. Kalender boleh merancang walaupun channel disconnected; status mesti membezakan draft/approved/planned/exported daripada provider-confirmed published.
- [ ] Optional Postiz gate: verify upstream version, actual API capability dan AGPL-3.0 license obligations termasuk notices/source availability yang relevan sebelum deployment. Audit keperluan PostgreSQL, Redis, Temporal, storage, RAM, disk, backup dan persistent uptime pada hardware sedia ada; jangan assume stack telah installed atau ringan. Tiada paid hosting/provider dependency ditambah.
- [ ] Simpan Postiz/provider credentials server-side. Sambungan setiap account memerlukan scoped grants, app review jika platform memerlukannya dan actual channel test. Senarai integrations upstream bukan bukti akaun projek boleh publish; unsupported channel kekal manual. Webhooks authenticated, deduplicated dan reconciled sebelum claim published; disable capability apabila permission revoked.
- [ ] Prefer local durable schedule dan re-check current role/account grant, approval expiry, revision serta quota tepat sebelum dispatch. Jika remote scheduling enabled, simpan providerRef; grant revocation/asset edit mesti cancel queued remote job dan reconcile readback. Cancel timeout/revoked credential kekal visible `cancel_pending`/`unknown` dengan operator exception; disable reschedule/replacement sehingga known outcome. Jangan claim remote side effect telah dihentikan hanya kerana local flag dimatikan.
- [ ] PASS unit suite dan `bunx playwright test tests/e2e/marketing-workspace.spec.ts`. Adapter contract tests menggunakan fake provider; public publish pilot memerlukan explicit business authorization ketika execution. Commit first-party module secara berasingan daripada optional adapter.

**Go/no-go:** Manual workflow boleh release tanpa Postiz. Auto-publish disabled sehingga license/runtime/capability/receipt gates sah; failed gate tidak memaksa founder berpindah apps untuk planning/approval.

## Task 13: Optional Read-only Agent-Reach Research melalui Hermes

**Files:** Create `server/automation/researchAdapter.ts`, `agentReachAdapter.ts`, `sessionGrantRepository.ts`; create `src/features/marketing/ResearchDesk.tsx`; test `tests/platform/research-provenance.test.ts`.

**Interfaces:** `requestResearch(actor: Actor, input: ResearchRequest): Promise<Result<ResearchBrief>>`; `ResearchAdapter.collect(request: ResearchRequest, signal: AbortSignal): Promise<ResearchBrief>`; `revokeSessionGrant(actor: Actor, grantId: string): Promise<Result<{ revoked: true }>>`.

- [ ] Failing tests: denied/disallowed source skipped with reason; timeout preserves partial source refs; session absent tidak melog masuk automatik; revoked grant stops subsequent calls; retrieved content instruction tidak memanggil publisher atau menukar produk.
- [ ] Run `bun test tests/platform/research-provenance.test.ts`; FAIL, kemudian implement read-only allowlist, item/timeout/quota limit dan SourceRef provenance. Laporan membezakan source fact, synthesis, inference dan unknown. Research brief dilink kepada draft/knowledge, tidak terus mengubah approved copy/catalogue.
- [ ] Agent-Reach ialah calon collection tooling, bukan publisher atau capability yang assumed installed. Inspect repository/dependencies/source terms ketika execution; gunakan official/public interfaces yang dibenarkan. Jangan bypass login, paywall, challenge atau source restriction.
- [ ] Authenticated session hanya selepas explicit opt-in bagi source/account/purpose tertentu, dengan expiry/revocation dan isolated secret storage. Jangan copy cookie daripada browser secara senyap atau memaparkan token dalam logs. Tolak local/private-network URLs dan hostile attachment/source instructions.
- [ ] PASS tests, revoke-session demonstration dan source-link audit. Hermes calls scoped research adapter sahaja; publisher tools tiada dalam grant. Commit `feat: add scoped read-only research adapter` hanya jika compatibility serta zero-new-spend gates lulus.

**Go/no-go:** Manual URLs/source entry kekal tersedia apabila Agent-Reach, session atau provider tiada. Tiada claim scrape coverage, authenticated access atau publication tanpa bukti.

## Task 14: Shared Documents, Tasks dan Approved Knowledge

**Files:** Create `src/features/work/WorkInbox.tsx`, `DocumentEditor.tsx`, `KnowledgeLibrary.tsx`; create `server/platform/workRepository.ts`, `documentRepository.ts`, `knowledgeRepository.ts`; modify existing `src/components/TasksView.tsx`, `DocsView.tsx`, `ChatWorkspaceView.tsx` melalui adapter; test `tests/platform/shared-work.test.ts`, `tests/e2e/shared-work.spec.ts`.

**Interfaces:** `createWorkTask(actor: Actor, input: WorkTaskInput): Promise<Result<TaskRecord>>`; `getAssignedTasks(actor: Actor): Promise<Result<TaskRecord[]>>`; `saveDocument(actor: Actor, input: DocumentRecord, expectedVersion: number): Promise<Result<DocumentRecord>>`; `publishKnowledge(actor: Actor, documentId: string, expectedVersion: number): Promise<Result<KnowledgeEntry>>`; `searchKnowledge(actor: Actor, query: string): Promise<Result<KnowledgeEntry[]>>`.

- [ ] Failing tests: document A private kepada staff A tidak muncul dalam search/customer query; stale edit returns conflict; approved knowledge menunjuk exact document version; expired/revoked knowledge tidak digunakan sebagai current SOP; edit draft tidak overwrite approved revision.
- [ ] Run `bun test tests/platform/shared-work.test.ts`; FAIL, kemudian implement relational task/entity/document links, revision history dan scoped query. Knowledge status ialah draft/review/approved/retired; kelulusan serta expiry disahkan actor yang mempunyai grant.
- [ ] Sediakan first-party note/document/checklist, assignment, due date, comments, attachment refs dan task completion receipt. Render safe Markdown tanpa raw HTML execution; evidence permission turut digunakan pada document attachments. Tugas yang lengkap mesti menyimpan outcome, bukan checkbox semata-mata.
- [ ] Gunakan DB text search dan existing content dahulu; tiada vector subscription wajib. Existing Google Tasks/Docs/Chat adapters menjadi optional import/export dengan permission serta sync status yang jelas. Jangan duplicate-write atau label provider synchronization berjaya tanpa receipt.
- [ ] PASS suites dan `bunx playwright test tests/e2e/shared-work.spec.ts`; prove task/document dibuat staff muncul kepada founder yang authorized dan remain selepas restart. Commit `feat: add shared work and versioned knowledge`.

**Go/no-go:** Ini membekalkan task repository sebenar untuk Task 6/9. Sidebar/form/chat merujuk entity sama; LocalStorage bukan source of truth untuk kerja pasukan.

## Task 15: Operational QC, Shift dan Day-close

**Files:** Create `src/features/operations/QcWorkspace.tsx`, `ShiftWorkspace.tsx`, `DayCloseWorkspace.tsx`; create `server/operations/qcCommands.ts`, `shiftCommands.ts`, `dayCloseCommands.ts`; test `tests/platform/operations-close.test.ts`, `tests/e2e/operations-day.spec.ts`.

**Interfaces:** `recordQc(actor: Actor, input: QcRecord, expectedRevision: number): Promise<Result<QcRecord>>`; `releaseBatch(actor: Actor, batchId: string, qcRevision: number): Promise<Result<ExecutionReceipt>>`; `handoffShift(actor: Actor, shiftId: string, expectedRevision: number): Promise<Result<ShiftRecord>>`; `closeBusinessDay(actor: Actor, input: DayCloseRecord, expectedRevision: number): Promise<Result<DayCloseRecord>>`.

- [ ] Failing tests: missing required SOP readings blocks batch release; changed SOP/QC revision blocks stale approval; unauthorized outlet handoff denied; count discrepancy cannot become reconciled silently; unconfirmed QR receipt excluded daripada confirmed settlement; concurrent close tidak double-post.
- [ ] Run `bun test tests/platform/operations-close.test.ts`; FAIL, kemudian implement batch/QC links, typed reading units, checklist evidence, operator and approver. SOP thresholds dan packing tests mesti founder-approved/versioned; jangan reka suhu, shelf life atau food-safety guarantee. Release mengubah inventory movement hanya melalui Task 11 ledger, bukan edit stock number.
- [ ] Shift: roster/assigned station, opening count, pick/pack checklist, cash/stock custody dan unresolved handoff. Staff next shift explicitly acknowledge; task yang belum selesai kekal assigned/visible.
- [ ] Day-close: expected cash daripada authoritative transactions, counted cash, confirmed payment references dan discrepancy. Draft close → review → approved close; adjustment/reopen ialah revision/audit baharu. DuitNow receipt image bukan bukti bank settlement; automatic bank reconciliation optional apabila adapter sah.
- [ ] PASS unit tests dan `bunx playwright test tests/e2e/operations-day.spec.ts`; demo shift → sale → packing → handoff → discrepancy review → day-close. Commit QC, shift dan day-close sebagai change sets bebas selepas shared contracts stabil.

**Go/no-go:** Modul beroperasi read-only/draft sehingga approved SOP dan opening balances tersedia. Unknown evidence dipaparkan; tiada falsified QC pass atau automatic disputed cash close.

## Task 16: JEV Cross-platform Capability, Evaluation dan Safe Context

**Spec tambahan:** [12_JEV_PLATFORM_CAPABILITY_PLAN.md](../../../reports/research/2026-10-02/12_JEV_PLATFORM_CAPABILITY_PLAN.md). Task 8 complaint ialah question pack pertama; peluasan mesti mempertahankan canonical contracts, unknown handling dan business authorization.

**Files:** Create `shared/jev-contracts.ts`, `server/jev/questionPacks.ts`, `assessmentAdapter.ts`, `policyFacts.ts`, `contextSelector.ts`, `evaluationRepository.ts`; create `src/features/developer/JevEvaluationView.tsx`; test `tests/platform/jev-question-packs.test.ts`, `tests/platform/jev-evaluation.test.ts`.

**Interfaces:** `evaluatePack(actor: Actor, packId: string, entityId: string, input: unknown): Promise<Result<TypedAssessment>>`; `selectContext(actor: Actor, entityId: string, packId: string): Promise<AllowedContext>`; `checkPolicyFacts(actor: Actor, assessmentId: string, operation: string): Promise<Decision>`; `recordEvaluation(input: EvaluationRun): Promise<Result<{ id: string }>>`.

- [ ] Failing tests: dimension absent/invalid enum/invalid probability → abstain; missing evidence → unknown; contradictory fields cannot approve action; stale revoked knowledge excluded from context; model/source change invalidates unsupported calibration claim; policy facts unavailable denies sensitive action.
- [ ] Run both JEV suites; FAIL, kemudian implement pack/schema/version provenance, categorical dimensions, bounded score semantics, evidence routing dan separate deterministic policy facts. `TypedAssessment` contains packVersion/schemaVersion/method/dimensions/scores/abstentionReasons/evidenceIds/contextVersion/providerRef?/assessedAt; `AllowedContext` includes authorized source refs/versions; `EvaluationRun` includes datasetVersion/packVersion/providerVersion/metrics/errors/observedLatency/createdAt. No raw provider payload leaks to customer/developer logs.
- [ ] Adapt current Gemini JSON engine secara explicit; itu bukan verified native TypeSafe runtime. Official Noul contract field `noul` berbeza daripada existing engine `probability`; adapter mesti mengesahkan schema/type sebelum conversion, bukan alias senyap. Real TypeSafe adapter kekal optional selepas actual API/SDK schema, credential, pricing dan access gates; tiada invented SDK syntax atau assumed free access.
- [ ] Version question packs untuk complaint, order exception, dealer/restock, QC evidence dan marketing-claim review. Deterministic rule validation dahulu; typed assessment hanya membantu classification/routing/review. Founder/legal/finance authority kekal policy/human gate; confidence tidak menjadi permission atau transaction truth.
- [ ] Eval dataset BM/English termasuk negation, sarcasm, contradictory evidence, missing price/payment, prompt injection dan stale knowledge. Simpan per-pack error classes, abstention/coverage, calibration diagnostics pada held-out data serta latency/cost usage sebenar. Threshold diaktifkan selepas empirical evaluation; jangan claim probability calibrated daripada default constant.
- [ ] Test durable evaluation history, permission-filtered context, bounded compaction dengan source refs serta re-evaluation selepas evidence update. PASS suites dan review sebelum `feat: add versioned cross-platform JEV assessment`.

**Go/no-go:** Enable satu pack selepas dataset/gates lulus; pack lain disabled/review-only. Tidak menggandakan confidence atau menyembunyikan abstention untuk demo; downstream Task 12/13 masih memerlukan approved content dan scoped tool authority.

## Task 17: Founder Calendar, Reports, Finance, People dan Settings

**Files:** Create `src/features/founder/OperationalCalendar.tsx`, `ReportBuilder.tsx`, `FinanceWorkspace.tsx`, `PeopleSettings.tsx`; create `server/platform/calendarRepository.ts`, `reportBuilder.ts`, `financeCommands.ts`, `settingsCommands.ts`; modify `server/platform/membershipRepository.ts`; test `tests/platform/founder-tools.test.ts`, `tests/e2e/founder-complete.spec.ts`.

**Interfaces:** `saveCalendarEvent(actor: Actor, input: CalendarEventRecord, expectedRevision: number): Promise<Result<CalendarEventRecord>>`; `buildReport(actor: Actor, definition: ReportDefinition, format: 'csv' | 'html'): Promise<Result<ReportArtifact>>`; `recordExpense(actor: Actor, input: ExpenseRecord, idempotencyKey: string): Promise<Result<ExpenseRecord>>`; `reconcilePeriod(actor: Actor, periodId: string, expectedRevision: number): Promise<Result<ReconciliationRecord>>`; `changeMembership(actor: Actor, input: MembershipChange): Promise<Result<{ version: number }>>`; `updateBusinessSettings(actor: Actor, input: SettingChange): Promise<Result<BusinessSettings>>`.

- [ ] Failing tests: MYT boundary/date filters coherent; report total reconciles to authoritative eligible source rows; refunded revenue separated daripada cash receipts; duplicate expense tidak double-post; unexplained settlement tidak automatic balanced; customer/developer cannot grant founder role; stale settings update conflicts; exported formula-like customer text neutralized.
- [ ] Run `bun test tests/platform/founder-tools.test.ts`; FAIL, kemudian implement scoped operational calendar dengan events daripada shift/delivery/tasks/marketing berasaskan linked IDs. Own events boleh diedit; derived events membuka source command dan bukan duplicate record. Reminder menggunakan Task 9 jobs jika available; scheduling tidak memerlukan Google subscription.
- [ ] Report builder menyediakan saved definitions, period/outlet/dealer filters, metric lineage, generation timestamp, source versions dan CSV/printable HTML export. Tentukan order value, confirmed receipts, refunds, expenses, stock movement dan completion secara berasingan; tiada invented profit apabila COGS/input tiada. Filter scope enforced server; export artifact access expiry dan evidence permission sama dengan source. Static printable HTML cukup untuk PDF melalui browser print; tiada paid PDF service wajib.
- [ ] Finance: expense draft/evidence/approval, receivables, verified-payment allocation, partial refunds dan period/day-close reconciliation. Wrong/missing bank evidence menghasilkan discrepancy/pending, bukan verified settlement. Posting/adjustment ialah immutable transaction dengan reversal/audit; ledger balance selalu integer sen. Bank/payment API optional; first-party manual reconciliation mesti lengkap.
- [ ] People/settings: invitation/revoke/role/outlet assignment, availability dan approved operating policies. Task 1 membership version/refreshed grants dipakai terus; reject self-escalation/last-founder removal tanpa approved ownership-transfer process. Locale MYT, notification preferences, SOP versions, catalogue publication dan dealer policy controls mempunyai audit/revision, schema validation serta explicit preview untuk sensitive change.
- [ ] PASS suite dan `bunx playwright test tests/e2e/founder-complete.spec.ts`; founder mengurus event, report/export, expense discrepancy, member invitation dan policy edit dalam app. Native OAuth/app-review handoff dilabel; optional integration tidak diperlukan untuk first-party completion. Commit setiap domain sebagai change set bebas selepas contracts/reconciliation tests stabil.

**Go/no-go:** Founder-complete hanya selepas kalender, report/export, finance reconciliation dan People/settings journeys lulus. Ia bukan backlog optional; source integrations yang memerlukan akses luaran sahaja kekal gated.

## Scope → Task Coverage Matrix

| Required scope | Task dan bukti siap |
|---|---|
| Landing/public SEO | 3/5: approved published catalogue + prerendered HTML/metadata tests |
| Customer + own order/complaint | 1–5/7/8: ownership, durable receipt, resume dan evidence journey |
| Staff + fulfilment/QC/shift | 1/3/6/14/15: assigned tasks, guarded transition, QC dan handoff |
| Founder daily operations | 6/11/14/15/17: inbox, ledger, task/docs, day-close dan core tools |
| Developer diagnostics/control | 1/6/9/10/16: redacted health, jobs, quota, eval dan rollback |
| Ejen/stokis B2B | 3/4/11: scoped membership, owner/custody ledger, quote/restock/receipt/earned benefits |
| WhatsApp-like flows | 4/7/8: shared renderer/form, resume/manual messaging, optional native adapter |
| Shared tasks/documents/knowledge | 14: revision/scope/search and cross-role workflow |
| Calendar/report/export/finance/People/settings | 17 with source 1/3/14/15: founder-complete E2E |
| Marketing/social workflow | 12: calendar/assets/approval/manual export; optional Postiz actual capability gates |
| Read-only research | 13: manual sources remain available, optional Agent-Reach scoped opt-in/provenance |
| Hermes/agent continuity | 9/10: read-only adapter, leases/checkpoint/recovery/quotas |
| JEV maximized safely | 8/16: typed packs, abstention, scores/evidence/context/evaluation and policy gates |
| Zero-new-spend resilience | 3/9/10: atomic persistence, optional-tool degradation vs fail-closed core outage |

Semua first-party required scope di atas mesti dibina dan diuji; tidak ditangguhkan sebagai future vision. Optional external services diimplementasikan melalui disabled/verified adapters apabila credential, scope, license atau hardware belum tersedia; jangan claim mereka aktif.

## Acceptance dan Rollback

- [ ] Landing dan empat workspaces boleh diakses/deep-linked dengan permission betul.
- [ ] Satu order/complaint journey lengkap berkongsi ID, evidence dan outcome merentas role tanpa copy semula.
- [ ] Task/document/knowledge berkongsi permissions dan revision; QC/shift/day-close menunjukkan unknown/discrepancy dengan jelas.
- [ ] Founder calendar/report/export/finance reconciliation/People/settings lulus journey dalam satu app; tidak hanya menu placeholder.
- [ ] Marketing calendar/approval/manual export boleh digunakan tanpa publisher; optional auto-publish mempunyai provider receipt dan reconciliation.
- [ ] External research membawa provenance serta session opt-in; typed JEV pack membawa abstention/eval evidence dan tidak bypass policy.
- [ ] Founder boleh memproses rutin utama dalam app; OAuth, manual WhatsApp dan provider-native dialogs ialah handoff yang dilabel jelas.
- [ ] Replay/restart/offline/session expiry tidak menghasilkan data berganda atau unauthorized leak.
- [ ] Tiada billed integration/model baharu; quota degradation boleh diperiksa.
- [ ] Founder sign-off berdasarkan demo sebenar, bukan screenshot sahaja.

Rollout mengikut feature flag (`platform_roles`, `customer_flows`, `agent_jobs`, `native_whatsapp`, `postiz_publish`, `agent_reach_research`, `jev_packs`), dengan default `native_whatsapp=false`, `postiz_publish=false`, `agent_reach_research=false`. Simpan release manifest dan backup sebelum data cutover. Rollback UI flags/API version secara berasingan; hentikan worker admission, drain atau reconcile jobs, kekalkan records/evidence/audit dan gunakan forward-compatible schema. Jangan reset database atau replay send/publish secara membuta tuli. Public customer portal hanya dibuka selepas Task 1–5 serta applicable evidence/cache gates; automation kekal disabled sehingga Task 9–10 lulus. Revocation/rollback tidak membatalkan side effect yang sudah berlaku; reconcile provider outcome dahulu sebelum repeat.

## Handoff

Dokumen ini ialah satu pelan berperingkat dengan deliverable bebas dan go/no-go setiap task. Pengguna telah mengarahkan **selepas docs lengkap, terus implement hingga siap**. Semasa execution, pecahkan task besar kepada change set kecil dan lakukan failing-test → implementation → verification → review; commit hanya jika authorization/session workflow meliputinya. Tiada pengesahan semula diperlukan untuk kerja lokal yang telah diarahkan. Provider account, credential, native WhatsApp, external publication, paid usage dan capacity/license gates kekal nyata; siapkan first-party workflow serta disabled adapters apabila keperluan luaran belum tersedia, dan laporkan batasnya tanpa mendakwa integration sudah berjalan.
