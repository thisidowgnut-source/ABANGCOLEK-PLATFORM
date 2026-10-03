import { test, expect, type APIRequestContext } from '@playwright/test';
import type { AssignedTaskSummary, FinanceSummary } from '../../shared/report-contracts';
import type { CatalogueProduct, Membership, PublicProduct, Result, SessionData } from '../../shared/platform-contracts';
import { money } from '../../src/features/workspaces/experience-model';
import { fixture, login } from './fixtures';

async function get<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`/api/platform${path}`), result = await response.json() as Result<T>;
  expect(response.ok(), JSON.stringify(result)).toBe(true);
  if (!result.ok) throw new Error(result.code);
  return result.data;
}
async function post<T = unknown>(request: APIRequestContext, path: string, csrf: string, body: unknown): Promise<T> {
  const response = await request.post(`/api/platform${path}`, { headers: { Origin: fixture().origin, 'X-CSRF-Token': csrf, 'Idempotency-Key': crypto.randomUUID() }, data: body });
  const result = await response.json() as Result<T>;
  expect(response.ok(), JSON.stringify(result)).toBe(true);
  if (!result.ok) throw new Error(result.code);
  return result.data;
}

test('Finance cards use server totals, staff counts all assigned work, and public detail resolves beyond page one', async ({ page, browser }) => {
  test.setTimeout(90_000);
  // The shared harness writes these commands only to the isolated QA database.
  await login(page, 'founder');
  const founder = await get<SessionData>(page.request, '/session');
  const summary = await get<FinanceSummary>(page.request, '/finance/summary');
  await page.goto('/founder/finance');
  await expect(page.locator('.xp-metric').filter({ hasText: 'Verified receipts minus refunds' }).locator('strong')).toHaveText(money(summary.netConfirmedReceiptsSen));
  await expect(page.locator('.xp-metric').filter({ hasText: 'Receivables' }).locator('strong')).toHaveText(money(summary.receivablesSen));
  await expect(page.locator('.xp-metric').filter({ hasText: 'Approved expenses' }).locator('strong')).toHaveText(money(summary.approvedExpensesSen));
  await expect(page.getByText(/All authorized records/)).toBeVisible();
  await expect(page.getByText(/Angka ini belum profit/)).toBeVisible();

  const staffContext = await browser.newContext({ baseURL: fixture().origin });
  try {
    const staffPage = await staffContext.newPage();
    await login(staffPage, 'staff');
    const staff = await get<SessionData>(staffPage.request, '/session');
    const before = await get<AssignedTaskSummary>(staffPage.request, '/tasks/summary');
    for (let index = 0; index < 105; index++) await post(staffPage.request, '/tasks', staff.csrfToken, { entityId: 'business', title: `Isolated QA assigned task ${index}`, assigneeId: staff.user.id, documentIds: [], outletId: 'hq' });
    const paged = await get<{ id: string }[]>(staffPage.request, '/tasks');
    expect(paged).toHaveLength(100);
    await staffPage.goto('/staff/overview');
    await expect(staffPage.locator('.xp-count-pair > div').filter({ hasText: 'Open assigned tasks' }).locator('strong')).toHaveText(String(before.openAssignedTasks + 105));
  } finally { await staffContext.close(); }

  const products: CatalogueProduct[] = [], cleanupContext = await browser.newContext({ baseURL: fixture().origin });
  const cleaner = await post<SessionData>(cleanupContext.request, '/auth/signup', '', { email: `qa-catalogue-cleanup-${crypto.randomUUID()}@example.test`, name: 'QA catalogue cleanup', password: `QA-test-${crypto.randomUUID()}` });
  const cleanupGrant = await post<Membership>(page.request, '/people/grants', founder.csrfToken, { userId: cleaner.user.id, role: 'founder', outletIds: [], expectedVersion: 0 });
  try {
    for (let index = 0; index < 102; index++) products.push(await post<CatalogueProduct>(page.request, '/catalogue', founder.csrfToken, { name: `Isolated QA published ${crypto.randomUUID()}`, description: 'QA pagination detail fixture', priceSen: 1234, packSize: 1, publish: true }));
    const firstPage = await get<PublicProduct[]>(page.request, '/catalogue');
    expect(firstPage).toHaveLength(100);
    expect(firstPage.some(product => product.id === fixture().productId)).toBe(false);
    const original = await get<PublicProduct>(page.request, `/catalogue/${fixture().productId}`);
    await page.goto(`/products/${original.id}`);
    await expect(page.getByRole('heading', { name: original.name, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${original.name} | ABANGCOLEK`);
    await expect(page.getByText('Produk tidak ditemui', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Muat lagi produk' })).toHaveCount(0);
  } finally {
    // Keep the shared isolated catalogue usable by subsequent journeys without a reset.
    for (const product of products) await post(cleanupContext.request, '/catalogue', cleaner.csrfToken, { id: product.id, expectedRevision: product.revision, name: product.name, description: product.description, priceSen: product.priceSen, packSize: product.packSize, publish: false });
    await post(page.request, '/people/revoke', founder.csrfToken, { membershipId: cleanupGrant.id, expectedVersion: cleanupGrant.version });
    await cleanupContext.close();
  }
});
