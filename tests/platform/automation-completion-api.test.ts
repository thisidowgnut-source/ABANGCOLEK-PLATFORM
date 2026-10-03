import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPlatformApp } from '../../server/platform/app';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(close => close()));
type Session = { cookie: string; csrf: string; userId: string };
async function apiFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'automation-api-'));
  const app = createPlatformApp({ databasePath: join(directory, 'test.sqlite'), origin: 'http://localhost:3000', bootstrapToken: 'automation-test-bootstrap' });
  cleanup.push(() => { app.close(); rmSync(directory, { recursive: true, force: true }); });
  async function call(path: string, body?: unknown, session?: Session, key = 'automation-request-001') {
    const response = await app.fetch(new Request(`http://localhost:3010/api/platform${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'http://localhost:3000', 'Idempotency-Key': key }), ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function user(name: string, founder = false): Promise<Session> {
    const result = await call(founder ? '/auth/bootstrap' : '/auth/signup', { email: `${name}@example.test`, name, password: 'durable local secure password', ...(founder ? { token: 'automation-test-bootstrap' } : {}) });
    expect(result.status).toBe(200);
    return { cookie: result.cookie!.split(';')[0], csrf: result.data.data.csrfToken, userId: result.data.data.user.id };
  }
  return { app, call, user };
}

test('automation API retains manual source history and async blocked receipts with CSRF protection', async () => {
  const { call, user } = await apiFixture();
  const founder = await user('research-owner', true);
  const source = { url: 'https://example.org/paper', title: 'Public paper', snippet: 'Human captured observation', retrievedAt: new Date().toISOString(), termsCheck: 'allowed', permittedUse: 'Internal source attribution' };
  expect((await call('/research/sources', source, { ...founder, csrf: 'wrong' })).status).toBe(403);
  const captured = await call('/research/sources', source, founder);
  expect(captured.status).toBe(200);
  expect((await call('/research/sources', source, founder)).data.data.id).toBe(captured.data.data.id);
  const brief = await call('/research/briefs', { question: 'What was observed?', summary: 'Human interpretation', sourceIds: [captured.data.data.id], unknownReasons: [] }, founder, 'manual-brief-api');
  expect(brief.status).toBe(200);
  expect((await call('/research/briefs', undefined, founder)).data.data[0].sourceRefs[0].url).toBe(source.url);
  const remote = await call('/research/run', { question: 'Optional research', allowedSources: [source.url], maxItems: 1 }, founder, 'remote-blocked-api');
  expect(remote.status).toBe(200);
  expect(remote.data.data.status).toBe('blocked');
  expect((await call('/research/run', { question: 'Optional research', allowedSources: [source.url], maxItems: 1 }, founder, 'remote-blocked-api')).data.data.id).toBe(remote.data.data.id);
});

test('developer API cancels job with sanitized receipt but cannot read founder research or export', async () => {
  const { call, user } = await apiFixture();
  const founder = await user('cancel-founder', true), developer = await user('cancel-developer');
  await call('/people/grants', { userId: developer.userId, role: 'developer', outletIds: [], expectedVersion: 0 }, founder);
  const job = await call('/jobs', { kind: 'morning_brief', entityId: 'business', skillVersion: 'local-v1', scope: 'business' }, founder, 'cancel-runtime-api');
  const cancelled = await call(`/jobs/${job.data.data.id}/cancel`, {}, developer);
  expect(cancelled.status).toBe(200);
  expect(cancelled.data.data.status).toBe('cancelled');
  expect(cancelled.data.data).not.toHaveProperty('ownerId');
  expect(cancelled.data.data).not.toHaveProperty('entityId');
  expect((await call('/automation/capabilities', undefined, developer)).status).toBe(200);
  expect((await call('/research/sources', undefined, developer)).status).toBe(403);
  expect((await call('/research/briefs', undefined, developer)).status).toBe(403);
  expect((await call('/automation/exports', undefined, developer)).status).toBe(403);
});
