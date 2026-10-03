# Indeks Kajian Agen AI — ABANGCOLEK-OS

Tarikh akses/review: **2 Oktober 2026**. Laporan sumber, sintesis dan pelan expansion disediakan dalam Bahasa Melayu dengan technical English apabila diperlukan.

## Mula di sini: pelan platform lengkap

[09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md](09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md) ialah pelan induk landing page + Customer/Staff/Founder/Developer, dealer B2B, shared flows, rekod bisnes, automation dan zero-new-spend gates. Selepas pelan selesai, pengguna mengarahkan pelaksanaan. First-party platform sudah mempunyai implementasi dan bukti unit/API/browser yang dipetakan kepada semua 17 task; status release **FINAL VERIFICATION IN PROGRESS**. Dokumen research asal bukan bukti runtime atau vendor connected.

[Recap dan sintesis chat](../../RECAP_SINTESIS_DAN_PELAKSANAAN_ABANGCOLEK_2026-10-02.md) · [Implementation ledger dan 17-task evidence matrix](../../PLATFORM_EXPANSION_IMPLEMENTATION_2026-10-02.md) · [Recovery runbook](../../../docs/runbooks/platform-recovery.md).

| Dokumen | Liputan |
|---|---|
| [07_PELAN_UPGRADE_ABANGCOLEK_OS.md](07_PELAN_UPGRADE_ABANGCOLEK_OS.md) | Sintesis upgrade daripada lima sumber AI dan keutamaan projek |
| [08_WHATSAPP_FLOW_ZERO_COST.md](08_WHATSAPP_FLOW_ZERO_COST.md) | Web/PWA conversational flows, manual WhatsApp dan syarat native adapter |
| [09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md](09_PLATFORM_EXPANSION_ZERO_COST_MASTERPLAN.md) | Architecture, role boundaries, modules, delivery phases dan acceptance |
| [10_AGENT_STOKIS_BUSINESS_SYSTEM.md](10_AGENT_STOKIS_BUSINESS_SYSTEM.md) | Business models, owner/custodian inventory, restock, dealer terms dan ledger |
| [11_MARKETING_SOCIAL_AUTOMATION_POSTIZ_AGENT_REACH.md](11_MARKETING_SOCIAL_AUTOMATION_POSTIZ_AGENT_REACH.md) | Postiz/Agent-Reach research, marketing workspace, approvals, dealer kits dan outcomes |
| [12_JEV_PLATFORM_CAPABILITY_PLAN.md](12_JEV_PLATFORM_CAPABILITY_PLAN.md) | Choice/Score/Noul, question packs, evidence, abstention, calibration dan eval gates |
| [Technical implementation plan](../../../docs/superpowers/plans/2026-10-02-platform-expansion.md) | Proposed paths, contracts, TDD steps, dependencies, rollout dan rollback |

## Laporan untuk setiap URL

| # | Sumber diminta | Laporan | Liputan |
|---|---|---|---|
| 1 | [Grok Bot overview](https://docs.x.ai/grok-bot/overview) | [01_GROK_BOT_OVERVIEW.md](01_GROK_BOT_OVERVIEW.md) | Identity, setup, ownership, computer, handoff, skills, routines, permission |
| 2 | [Meta Muse](https://ai.meta.com/muse/) | [02_META_MUSE.md](02_META_MUSE.md) | Goal/activity/artifact UX, Sentinel, credential boundary, small business, rollout |
| 3 | [Introducing dots](https://openai.com/index/introducing-dots/) | [03_OPENAI_INTRODUCING_DOTS.md](03_OPENAI_INTRODUCING_DOTS.md) | Continuous tasks, memory, cloud/local, controls, preview, decision UX |
| 4 | [DeepSeek Harness quickstart](https://deepseek-harness.github.io/deepseek-harness/en/guide/quickstart) | [04_DEEPSEEK_HARNESS_QUICKSTART.md](04_DEEPSEEK_HARNESS_QUICKSTART.md) | Web setup, providers, plugins, SDK profiles, webhook, schedule, security |
| 5 | [Hermes Agent docs](https://hermes-agent.nousresearch.com/docs) | [05_HERMES_AGENT_DOCS.md](05_HERMES_AGENT_DOCS.md) | Windows, architecture, memory, skills, MCP, Bot Mode, security |

## Baca sintesis dahulu untuk keputusan projek

[06_JEV_SYNTHESIS_ABANGCOLEK_OS.md](06_JEV_SYNTHESIS_ABANGCOLEK_OS.md) merangkumi arah dashboard/sidebar, penemuan source JEV, organisasi komponen, kontrak task/evidence/action, pilot, keutamaan dan acceptance criteria.

Cadangan P0 ialah memisahkan draft daripada send, memastikan missing output tidak menjadi high-confidence classification, serta memisahkan classifier daripada authorization bisnes. Cadangan UI ialah decision queue, task drawer, activity dan integration readiness yang berkongsi state sebenar.

## Kaedah dan batas

JEV di sini ialah **ledger semakan bukti manual**. Label VERIFIED_DOC menunjukkan claim berada dalam sumber rasmi; VERIFIED_SOURCE menunjukkan source projek yang diperiksa; INFERENCE ialah cadangan; UNKNOWN/NOT_TESTED menandakan batas. Tiada panggilan model TypeSafe Jev atau engine Gemini JEV, tiada benchmark, pemasangan runtime, login vendor atau penghantaran mesej dilakukan untuk kajian ini.

Muse URL asal mempunyai body kosong dalam extractor; review memakai indeks rasmi dan sumber rasmi berkaitan. Setiap laporan mempunyai ledger sumber dan batas sendiri. Sumber online boleh berubah selepas tarikh akses. Kajian ini bukan pensijilan security atau audit menyeluruh semua fail.

Kerja tema/sidebar mempunyai laporan berasingan: [Pelaksanaan tema global](../../GLOBAL_THEME_SIDEBAR_IMPLEMENTATION_2026-10-02.md). Backend lokal, auth/membership, shared flows, canonical transactions, dealer ledger, marketing manual exports, research provenance, operational workflows, JEV packs/evaluations dan durable jobs kini diimplementasikan; status dan evidence semasa berada dalam implementation ledger. Research ini menggunakan semakan bukti manual; pelaksanaan selepas kajian menggunakan **LOCAL_RULES JEV**. Kedua-duanya tidak bermaksud native TypeSafe inference atau vendor runtimes sudah connected.

**Gates yang masih berasingan:** actual owner account/policies/data, public HTTPS/deployment, Supabase migration/identity bridge, native WhatsApp, native TypeSafe JEV, Postiz remote publication dan actual Hermes/Agent-Reach transport. Tiada langganan/model berbayar baharu, cloud migration atau penghantaran mesej/publication luaran dilakukan. Sumber research kekal historical kepada tarikh akses; jangan menafsirnya sebagai capability test hari deployment.
