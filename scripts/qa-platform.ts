/** Isolated fixtures for browser acceptance. Never writes into the business database. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createPlatformApp } from '../server/platform/app';
import { opaque } from '../server/platform/auth';

const origin = 'http://127.0.0.1:3001';
const runtime = resolve('var/lib/qa', crypto.randomUUID());
mkdirSync(runtime, { recursive: true }); mkdirSync('var/run', { recursive: true });
const bootstrapToken = opaque();
const app = createPlatformApp({ databasePath: join(runtime, 'platform.sqlite'), bootstrapToken, allowedOrigins: [origin],rateLimits:{identityGlobal:300,identityAccount:60,actor:1000} });
type Account = { email: string; password: string; userId: string };
const accounts = {} as Record<'founder' | 'customer' | 'staff' | 'developer', Account>;
let founderCookie = '', founderCsrf = '';
async function command(path: string, body: unknown, cookie = founderCookie, csrf = founderCsrf) {
  const response = await app.fetch(new Request(`http://127.0.0.1:3011/api/platform${path}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) }));
  const result = await response.json() as { ok: boolean; code?: string; data: any };
  if (!response.ok || !result.ok) throw new Error(`QA fixture command failed: ${path} (${result.code})`);
  return { data: result.data, cookie: response.headers.get('set-cookie')?.split(';')[0] ?? '' };
}
for (const role of ['founder', 'customer', 'staff', 'developer'] as const) {
  const email = `${role}-${crypto.randomUUID()}@qa.invalid`, password = opaque();
  const result = await command(`/auth/${role === 'founder' ? 'bootstrap' : 'signup'}`, { email, password, name: `QA ${role}`, ...(role === 'founder' ? { token: bootstrapToken } : {}) }, '', '');
  accounts[role] = { email, password, userId: result.data.user.id };
  if (role === 'founder') { founderCookie = result.cookie; founderCsrf = result.data.csrfToken; }
  if (role === 'staff' || role === 'developer') await command('/people/grants', { userId: accounts[role].userId, role, outletIds: role === 'staff' ? ['hq'] : [], expectedVersion: 0 });
}
const product = (await command('/catalogue', { name: 'QA Colek', description: 'Browser acceptance fixture — isolated test database.', priceSen: 2800, packSize: 1, publish: true })).data;
await command('/inventory/receive', { productId: product.id, ownerId: 'business', locationId: 'hq', quantity: 20, reason: 'QA opening stock', status: 'available' });
writeFileSync('var/run/e2e-fixture.json', JSON.stringify({ ...accounts, productId: product.id, runtime, origin }), { mode: 0o600 });
const server = Bun.serve({ hostname: '127.0.0.1', port: 3011, fetch: app.fetch, maxRequestBodySize: 11 * 1024 * 1024 });
const timer = setInterval(() => { const job = app.jobs.claimJob('qa-worker'); if (job) app.jobs.executeLocal(job.id, 'qa-worker'); }, 1000);
function shutdown() { clearInterval(timer); server.stop(); app.close(); process.exit(0); }
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
console.info('Isolated acceptance API available on 127.0.0.1:3011. Test fixture credentials saved under ignored var/run.');
