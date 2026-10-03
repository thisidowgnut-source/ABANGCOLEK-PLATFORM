import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Automation } from '../../server/automation/automation';
import { Jobs } from '../../server/automation/jobs';
import { Auth, type Principal } from '../../server/platform/auth';
import { Commerce } from '../../server/platform/commerce';
import { Marketing } from '../../server/platform/marketing';
import { PlatformStore } from '../../server/platform/store';
import { Work } from '../../server/platform/work';
import type { AutomationOptions } from '../../server/automation/adapters';
import { HermesAdapter, PostizPublisherAdapter } from '../../server/automation/adapters';

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach(cleanup => cleanup()); });
async function fixture(options: AutomationOptions = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'automation-'));
  const path = join(directory, 'test.sqlite');
  const store = new PlatformStore(path), auth = new Auth(store, 'test-founder-bootstrap');
  const commerce = new Commerce(store, auth), work = new Work(store, auth, commerce);
  const marketing = new Marketing(store, auth, commerce, work);
  const automation = new Automation(store, auth, commerce, work, marketing, options);
  const session = await auth.authenticate('bootstrap', { email: 'owner@example.test', name: 'Owner', password: 'a durable secure password', token: 'test-founder-bootstrap' });
  const owner = auth.resolve(new Request('http://localhost', { headers: { Cookie: session.cookie } }));
  cleanups.push(() => { try { store.close(); } catch {} rmSync(directory, { recursive: true, force: true }); });
  return { store, auth, commerce, work, marketing, automation, owner, path };
}
const sourceInput = { url: 'https://example.org/research', title: 'Founder source', snippet: 'Observed packing method', retrievedAt: '2026-10-01T12:00:00Z', publishedAt: '2025-03-02T12:00:00Z', termsCheck: 'allowed', permittedUse: 'Internal research with attribution' };
const externalUsage = () => ({ providerId: 'agent_reach', observedUnits: 0, limitUnits: 5, available: true, observedAt: new Date().toISOString() });

test('manual research stores immutable provenance, deduplicates and survives restart', async () => {
  const { automation, owner, path } = await fixture();
  const source = automation.captureSource(owner, sourceInput, 'manual-source-001');
  expect(automation.captureSource(owner, sourceInput, 'manual-source-001').id).toBe(source.id);
  expect(source.retrievedAt).not.toBe(source.publishedAt);
  expect(source.contentHash).toMatch(/^[a-f0-9]{64}$/);
  const brief = automation.saveBrief(owner, { question: 'What can be learned?', summary: 'Founder interpretation only', sourceIds: [source.id], unknownReasons: ['Not a sales forecast'] }, 'manual-brief-001');
  const reopened = new PlatformStore(path), auth = new Auth(reopened), commerce = new Commerce(reopened, auth), work = new Work(reopened, auth, commerce);
  const second = new Automation(reopened, auth, commerce, work, new Marketing(reopened, auth, commerce, work));
  expect(second.briefs(owner)[0].id).toBe(brief.id);
  expect(second.briefs(owner)[0].sourceRefs[0].url).toBe(source.url);
  expect(second.sources(owner)).toHaveLength(1);
  reopened.close();
});

test('private URLs, credentials, future capture dates and restricted reuse fail closed', async () => {
  const { automation, owner } = await fixture();
  for (const url of ['http://localhost:3000/private', 'https://127.0.0.1', 'https://10.1.1.1', 'https://[::1]', 'https://0177.0.0.1', 'https://user:password@example.org', 'file:///etc/passwd', 'https://x.local', 'https://x.internal', 'https://example.org/?token=secret']) {
    expect(() => automation.captureSource(owner, { ...sourceInput, url }, `deny-${url}`)).toThrow();
  }
  expect(() => automation.captureSource(owner, { ...sourceInput, retrievedAt: '2099-01-01T00:00:00Z' }, 'future-source')).toThrow();
  const restricted = automation.captureSource(owner, { ...sourceInput, termsCheck: 'restricted' }, 'restricted-source');
  expect(() => automation.saveBrief(owner, { question: 'Reuse?', summary: 'Copy', sourceIds: [restricted.id], unknownReasons: [] }, 'restricted-brief')).toThrow('Permintaan');
});

test('unconfigured adapters report unavailable and manual research remains usable', async () => {
  const { automation, owner } = await fixture();
  const capabilities = automation.capabilities(owner);
  expect(capabilities.find(item => item.providerId === 'manual')?.status).toBe('ready');
  for (const providerId of ['hermes', 'agent_reach', 'postiz']) expect(capabilities.find(item => item.providerId === providerId)?.allowedOperations).not.toContain('publish');
  const brief = await automation.research(owner, { question: 'Any sources?', allowedSources: ['https://example.org/research'], maxItems: 1 }, 'unavailable-research');
  expect(brief.status).toBe('blocked');
  expect(brief.unknownReasons).toContain('AGENT_REACH_UNAVAILABLE');
});

test('opt-in research validates source allowlist, preserves partial results and revoked grant blocks transport', async () => {
  let calls = 0;
  const { automation, owner } = await fixture({ externalUsage, agentReach: { zeroNewSpend: true, collect: async () => { calls++; return { summary: 'External text is untrusted', sources: [{ ...sourceInput, accessMethod: 'public_web' }, { ...sourceInput, url: 'https://other.example/item', accessMethod: 'public_web' }], unknownReasons: ['SOURCE_TIMEOUT'] }; } } });
  const grant = automation.grant(owner, { allowedOrigins: ['https://example.org'], purpose: 'Packing research', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const brief = await automation.research(owner, { question: 'Research packing', allowedSources: [sourceInput.url], maxItems: 2, sessionGrantId: grant.id }, 'optin-research-001');
  expect(brief.sourceRefs).toHaveLength(1);
  expect(brief.status).toBe('partial');
  expect(brief.unknownReasons).toContain('SOURCE_OUTSIDE_ALLOWLIST');
  automation.revoke(owner, grant.id, { expectedVersion: grant.version });
  const blocked = await automation.research(owner, { question: 'Research packing', allowedSources: [sourceInput.url], maxItems: 2, sessionGrantId: grant.id }, 'optin-research-002');
  expect(blocked.status).toBe('blocked');
  expect(calls).toBe(1);
});

test('research revocation while collection is running prevents retaining late external results', async () => {
  let release!: (value: { summary: string; sources: unknown[]; unknownReasons: string[] }) => void;
  const { automation, owner } = await fixture({ externalUsage, agentReach: { zeroNewSpend: true, collect: () => new Promise(resolve => { release = resolve; }) } });
  const grant = automation.grant(owner, { allowedOrigins: ['https://example.org'], purpose: 'Explicit source capture', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const pending = automation.research(owner, { question: 'Research packing', allowedSources: [sourceInput.url], maxItems: 2, sessionGrantId: grant.id }, 'inflight-research');
  automation.revoke(owner, grant.id, { expectedVersion: grant.version });
  release({ summary: 'Late result', sources: [sourceInput], unknownReasons: [] });
  expect((await pending).unknownReasons).toContain('SESSION_GRANT_REVOKED');
  expect(automation.sources(owner)).toHaveLength(0);
});

test('developer can cancel runtime job without acquiring research or business payload access', async () => {
  const { store, auth, commerce, work, automation, owner } = await fixture();
  const developer = { ...owner, user: { id: 'developer', name: 'Developer', email: 'dev@example.test' }, memberships: [{ ...owner.memberships[0], id: 'developer-membership', userId: 'developer', role: 'developer' as const }] } satisfies Principal;
  const customer = { ...developer, memberships: [{ ...developer.memberships[0], role: 'customer' as const }] } satisfies Principal;
  const jobs = new Jobs(store, auth, commerce, work);
  const job = jobs.enqueue(owner, { kind: 'morning_brief', entityId: 'business', skillVersion: 'local-v1', scope: 'business' }, 'cancel-runtime-job');
  const result = jobs.cancel(developer, job.id);
  expect(result.status).toBe('cancelled');
  expect(result).not.toHaveProperty('entityId');
  expect(result).not.toHaveProperty('ownerId');
  expect(() => automation.sources(developer)).toThrow();
  expect(() => jobs.cancel(customer, job.id)).toThrow();
  expect(() => jobs.cancel(developer, job.id)).toThrow();
});

test('Postiz preparation requires exact valid approval and produces export, never a publication', async () => {
  const { automation, marketing, owner } = await fixture();
  let campaign = marketing.save(owner, { title: 'Founder draft', objective: 'Document packing', copy: 'A founder caption', assets: [], productIds: [], catalogueVersion: 0 });
  expect(() => automation.preparePostiz(owner, campaign.id, { expectedRevision: campaign.revision, channel: 'manual' }, 'postiz-export-001')).toThrow();
  campaign = marketing.approve(owner, campaign.id, { expectedRevision: campaign.revision, approvalExpiresAt: new Date(Date.now() + 60_000).toISOString() });
  const output = automation.preparePostiz(owner, campaign.id, { expectedRevision: campaign.revision, channel: 'manual' }, 'postiz-export-001');
  expect(output.status).toBe('exported');
  expect(output.deliveryMode).toBe('manual_required');
  expect(output).not.toHaveProperty('providerRef');
  expect(automation.preparePostiz(owner, campaign.id, { expectedRevision: campaign.revision, channel: 'manual' }, 'postiz-export-001').id).toBe(output.id);
  expect(automation.exports(owner)).toHaveLength(1);
});

test('timeout keeps permitted incremental provenance and concurrent retries never collect twice', async () => {
  let calls = 0;
  const { automation, owner } = await fixture({ externalUsage, timeoutMs: 20, agentReach: { zeroNewSpend: true, collect: (_request, _signal, onSource) => { calls++; onSource?.({ ...sourceInput, accessMethod: 'public_web' }); return new Promise(() => {}); } } });
  const grant = automation.grant(owner, { allowedOrigins: ['https://example.org'], purpose: 'Public sources only', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const input = { question: 'Packing', allowedSources: [sourceInput.url], maxItems: 2, sessionGrantId: grant.id };
  const pending = automation.research(owner, input, 'timeout-research');
  const retry = await automation.research(owner, input, 'timeout-research');
  expect(retry.status).toBe('running');
  const completed = await pending;
  expect(completed.status).toBe('partial');
  expect(completed.sourceRefs).toHaveLength(1);
  expect(completed.unknownReasons).toContain('RESEARCH_TIMEOUT');
  expect((await automation.research(owner, input, 'timeout-research')).id).toBe(completed.id);
  expect(calls).toBe(1);
});

test('unknown quota never calls optional external transport', async () => {
  let calls = 0;
  const { automation, owner } = await fixture({ agentReach: { zeroNewSpend: true, collect: async () => { calls++; return { summary: '', sources: [], unknownReasons: [] }; } } });
  const grant = automation.grant(owner, { allowedOrigins: ['https://example.org'], purpose: 'Research', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  const output = await automation.research(owner, { question: 'Packing', allowedSources: [sourceInput.url], maxItems: 1, sessionGrantId: grant.id }, 'unknown-quota');
  expect(output.status).toBe('blocked');
  expect(output.unknownReasons).toContain('USAGE_NOT_ADMITTED');
  expect(calls).toBe(0);
});

test('Hermes scope cannot inherit publishing capability and Postiz cancel stays unknown', async () => {
  let calls = 0;
  const adapter = new HermesAdapter({ zeroNewSpend: true, run: async () => { calls++; return { status: 'completed', artifactIds: [], evidenceIds: [], unknownReasons: [] }; } });
  const task = { jobId: 'local-job', objective: 'Research only', allowedToolIds: ['postiz.publish'], sourceRefs: [] };
  expect((await adapter.run(task, externalUsage(), new AbortController().signal)).unknownReasons).toContain('TOOL_SCOPE_DENIED');
  expect(calls).toBe(0);
  expect((await adapter.run({ ...task, allowedToolIds: ['research.sources.read'] }, externalUsage(), new AbortController().signal)).status).toBe('completed');
  expect((await new PostizPublisherAdapter().cancel('existing-provider-reference')).status).toBe('unknown');
});

test('Hermes transport cannot wait indefinitely or return completed after operator abort', async () => {
  const controller = new AbortController();
  const adapter = new HermesAdapter({ zeroNewSpend: true, run: async () => { controller.abort(); return { status: 'completed', artifactIds: [], evidenceIds: [], unknownReasons: [] }; } }, 20);
  const task = { jobId: 'local-job', objective: 'Read only', allowedToolIds: ['research.sources.read'], sourceRefs: [] };
  expect((await adapter.run(task, externalUsage(), controller.signal)).status).toBe('unknown');
  const hanging = new HermesAdapter({ zeroNewSpend: true, run: () => new Promise(() => {}) }, 20);
  const output = await hanging.run(task, externalUsage(), new AbortController().signal);
  expect(output.unknownReasons).toContain('HERMES_TIMEOUT');
});

test('interrupted durable research receipt survives restart and does not rerun external collector', async () => {
  const { automation, owner, store, path } = await fixture();
  const raw = { question: 'Research', allowedSources: [sourceInput.url], maxItems: 1 };
  const brief = await automation.research(owner, raw, 'restart-research');
  store.save('research_briefs', { ...brief, status: 'running', leaseUntil: '2026-01-01T00:00:00Z' });
  const savedBeforeRead = JSON.stringify(store.get('research_briefs', brief.id));
  expect(automation.briefs(owner)[0].status).toBe('unknown');
  expect(JSON.stringify(store.get('research_briefs', brief.id))).toBe(savedBeforeRead);
  const reopened = new PlatformStore(path), auth = new Auth(reopened), commerce = new Commerce(reopened, auth), work = new Work(reopened, auth, commerce);
  let calls = 0;
  const second = new Automation(reopened, auth, commerce, work, new Marketing(reopened, auth, commerce, work), { externalUsage, agentReach: { zeroNewSpend: true, collect: async () => { calls++; return { summary: '', sources: [], unknownReasons: [] }; } } });
  const receipt = await second.research(owner, raw, 'restart-research');
  expect(receipt.id).toBe(brief.id);
  expect(receipt.status).toBe('unknown');
  expect(receipt.unknownReasons).toContain('RESEARCH_INTERRUPTED_NO_REPLAY');
  expect(calls).toBe(0);
  reopened.close();
});
