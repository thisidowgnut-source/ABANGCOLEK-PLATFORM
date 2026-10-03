import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPlatformApp } from '../../server/platform/app';
import { HELD_OUT_CASES } from './fixtures/held-out';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(close => close()));
type Session = { cookie: string; csrf: string; userId: string };
function harness() {
  const directory = mkdtempSync(join(tmpdir(), 'jev-api-'));
  const app = createPlatformApp({ databasePath: join(directory, 'test.sqlite'), bootstrapToken: 'jev-test-bootstrap', origin: 'http://localhost:3000' });
  cleanup.push(() => { app.close(); rmSync(directory, { recursive: true, force: true }); });
  async function call(path: string, body?: unknown, session?: Session) {
    const response = await app.fetch(new Request(`http://localhost:3010/api/platform${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }), ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrf } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));
    return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  async function user(name: string, founder = false): Promise<Session> {
    const result = await call(founder ? '/auth/bootstrap' : '/auth/signup', { email: `${name}@example.test`, password: 'strong test-only password 123', name, ...(founder ? { token: 'jev-test-bootstrap' } : {}) });
    expect(result.status).toBe(200);
    return { userId: result.body.data.user.id, cookie: result.cookie!.split(';')[0], csrf: result.body.data.csrfToken };
  }
  return { app, call, user };
}

test('JEV API keeps zero-spend typed packs, evaluation history and developer scope behind session/CSRF', async () => {
  const { call, user } = harness();
  expect((await call('/jev/packs')).status).toBe(401);
  const founder = await user('jev-founder', true), developer = await user('jev-developer');
  const grant = await call('/people/grants', { userId: developer.userId, role: 'developer', outletIds: [], expectedVersion: 0 }, founder);
  expect(grant.status).toBe(200);
  const packs = await call('/jev/packs', undefined, developer);
  expect(packs.status).toBe(200);
  expect(packs.body.data.map((pack: { id: string }) => pack.id)).toContain('qc');
  const context = await call('/jev/context?packId=developer&entityId=runtime', undefined, developer);
  expect(context.status).toBe(200);
  expect((await call('/jev/assessments', { packId: 'developer', entityId: 'runtime', expectedRevision: 1 }, { ...developer, csrf: 'wrong' })).status).toBe(403);
  const assessment = await call('/jev/assessments', { packId: 'developer', entityId: 'runtime', expectedRevision: context.body.data.entityRevision }, developer);
  expect(assessment.status).toBe(200);
  expect(assessment.body.data.policy.outcome).toBe('REVIEW_REQUIRED');
  expect((await call('/jev/assessments', undefined, developer)).body.data[0].id).toBe(assessment.body.data.id);
  const run = await call('/jev/evaluations', { datasetId: 'api-regression-only', datasetVersion: '1', split: 'held_out', cases: HELD_OUT_CASES }, developer);
  expect(run.status).toBe(200);
  expect(run.body.data.metrics.matchRate).toBe(1);
  expect(run.body.data.usage.providerCalls).toBe(0);
  expect((await call('/jev/evaluations', undefined, developer)).body.data[0].id).toBe(run.body.data.id);
  expect((await call('/jev/context?packId=order_exception&entityId=business', undefined, developer)).status).toBe(403);
  await call('/people/revoke', { membershipId: grant.body.data.id, expectedVersion: 1 }, founder);
  expect((await call('/jev/evaluations', undefined, developer)).status).toBe(403);
  expect((await call('/jev/assessments', undefined, developer)).body.data).toEqual([]);
});
