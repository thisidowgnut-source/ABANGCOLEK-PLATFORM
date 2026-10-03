import { afterEach, describe, expect, test } from 'bun:test';
import { createPlatformApp } from '../../server/platform/app';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cleanups: (() => void)[] = [];
afterEach(() => { for (const fn of cleanups.splice(0)) fn(); });
function harness() {
  const directory = mkdtempSync(join(tmpdir(), 'abangcolek-api-'));
  const app = createPlatformApp({ databasePath: join(directory, 'test.sqlite'), bootstrapToken: 'test-bootstrap-token-long-enough', origin: 'http://localhost:3000' });
  cleanups.push(() => { app.close(); rmSync(directory, { recursive: true, force: true }); });
  return { app, directory };
}
async function call(app: ReturnType<typeof createPlatformApp>, path: string, body?: unknown, session?: { cookie: string; csrf: string }, extra: Record<string,string> = {}) {
  const response = await app.fetch(new Request(`http://localhost:3010/api/platform${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: 'http://localhost:3000','Idempotency-Key':crypto.randomUUID() }), ...(session ? { Cookie: session.cookie, 'X-CSRF-Token': session.csrf } : {}), ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  return { response, json: await response.json() };
}
async function user(app: ReturnType<typeof createPlatformApp>, name: string, founder = false) {
  const result = await call(app, founder ? '/auth/bootstrap' : '/auth/signup', { email: `${name}@example.test`, name, password: 'a strong local password 123', ...(founder ? { token: 'test-bootstrap-token-long-enough' } : {}) });
  expect(result.response.status).toBe(200);
  return { cookie: result.response.headers.get('set-cookie')!.split(';')[0], csrf: result.json.data.csrfToken, userId: result.json.data.user.id };
}

describe('durable local identity and authoritative commerce', () => {
  test('public signup cannot promote roles; founder bootstrap is one-time; csrf and revocation fail closed', async () => {
    const { app } = harness();
    const founder = await user(app, 'founder', true);
    const customer = await user(app, 'customer');
    const session = await call(app, '/session', undefined, customer);
    expect(session.json.data.memberships.map((m: { role: string }) => m.role)).toEqual(['customer']);
    expect((await call(app, '/people', undefined, customer)).response.status).toBe(403);
    expect((await call(app, '/auth/bootstrap', { email: 'other@example.test', name: 'Other', password: 'long enough password', token: 'test-bootstrap-token-long-enough' })).response.status).toBe(409);
    expect((await call(app, '/catalogue', { name: 'Sos', description: 'Sos', priceSen: 1200, packSize: 1, publish: true }, { ...founder, csrf: 'wrong' })).response.status).toBe(403);
    const grant = await call(app, '/people/grants', { userId: customer.userId, role: 'staff', outletIds: ['hq'], expectedVersion: 0 }, founder);
    expect(grant.response.status).toBe(200);
    await call(app, '/people/revoke', { membershipId: grant.json.data.id, expectedVersion: 1 }, founder);
    expect((await call(app, '/session', undefined, customer)).json.data.memberships.map((m: { role: string }) => m.role)).toEqual(['customer']);
  });
  test('empty catalogue is real; price version, last-unit racing, retry and customer ownership are enforced', async () => {
    const { app } = harness();
    expect((await call(app, '/catalogue')).json.data).toEqual([]);
    const owner = await user(app, 'owner', true);
    const first = await user(app, 'first');
    const second = await user(app, 'second');
    const product = (await call(app, '/catalogue', { name: 'Sos', description: 'Sos pedas', priceSen: 1200, packSize: 1, publish: true }, owner)).json.data;
    await call(app, '/inventory/receive', { productId: product.id, ownerId: 'business', locationId: 'hq', quantity: 1, reason: 'Opening count', status: 'available' }, owner, { 'Idempotency-Key': 'opening-stock-001' });
    const body = { lines: [{ productId: product.id, quantity: 1 }], catalogueVersion: product.publishedVersion, fulfilment: 'pickup', contactRef: 'HQ pickup' };
    const results = await Promise.all([call(app, '/orders', body, first, { 'Idempotency-Key': 'first-order-001' }), call(app, '/orders', body, second, { 'Idempotency-Key': 'second-order-001' })]);
    expect(results.map(r => r.response.status).sort()).toEqual([200, 409]);
    const winner = results[0].response.status === 200 ? first : second;
    const loser = winner === first ? second : first;
    const success = results.find(r => r.response.status === 200)!;
    const retry = await call(app, '/orders', body, winner, { 'Idempotency-Key': winner === first ? 'first-order-001' : 'second-order-001' });
    expect(retry.json.data.id).toBe(success.json.data.id);
    expect(retry.json.data.amountSen).toBe(1200);
    expect((await call(app, `/orders/${success.json.data.id}`, undefined, loser)).response.status).toBe(403);
    expect((await call(app, `/orders/${success.json.data.id}/transition`, { expectedRevision: 1, next: 'dispatched' }, owner)).response.status).toBe(409);
  });
});

export { harness, call, user };
