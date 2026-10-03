import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import type { CatalogueProduct, DealerApplication, EvidenceRecord, RestockRecord, SessionData, VersionedQuote, BusinessSettings, Result, OrderRecord, PublicProduct } from '../../shared/platform-contracts';
import type { DealerLedger } from '../../shared/dealer-contracts';
import { fixture, login } from './fixtures';

async function post<T>(request: APIRequestContext, path: string, csrf: string, body: unknown): Promise<T> {
  const response = await request.post(`/api/platform${path}`, { headers: { Origin: fixture().origin, 'X-CSRF-Token': csrf, 'Idempotency-Key': crypto.randomUUID() }, data: body });
  const result = await response.json() as Result<T>;
  expect(response.ok(), JSON.stringify(result)).toBe(true);
  if (!result.ok) throw new Error(result.code);
  return result.data;
}
async function get<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`/api/platform${path}`);
  expect(response.ok()).toBe(true);
  const result = await response.json() as Result<T>;
  if (!result.ok) throw new Error(result.code);
  return result.data;
}
const form = (page: Page, title: string) => page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test('dealer UI records scoped sell-through, evidenced return, due settlement and separate manual receipt', async ({ page, browser }) => {
  test.setTimeout(60_000);
  await login(page, 'founder');
  const founderSession = await get<SessionData>(page.request, '/session');
  const settings = await get<BusinessSettings>(page.request, '/settings');
  const approvedSettings = await post<BusinessSettings>(page.request, '/settings', founderSession.csrfToken, {
    expectedVersion: settings.version, dealerTerms: { minimumQuantity: 1, packMultiple: 1, priceBasisPoints: 7500, ownership: 'consigned', returnRules: 'Isolated QA terms: physical return receipt enters quarantine' },
  });
  const product = await post<CatalogueProduct>(page.request, '/catalogue', founderSession.csrfToken, { name: `QA dealer ${crypto.randomUUID()}`, description: 'Isolated test fixture only', priceSen: 1000, packSize: 1, publish: true });
  const batchId = `QA batch ${crypto.randomUUID()}`, expiryAt = new Date(Date.now() + 86400_000).toISOString();
  await post(page.request, '/inventory/receive', founderSession.csrfToken, { productId: product.id, ownerId: 'business', locationId: 'hq', quantity: 6, batchId, expiryAt, reason: 'Isolated QA inventory', status: 'available' });
  const dealerContext = await browser.newContext({ baseURL: fixture().origin });
  const outsiderContext = await browser.newContext({ baseURL: fixture().origin });
  try {
    const dealerPage = await dealerContext.newPage();
    const dealer = await post<SessionData>(dealerPage.request, '/auth/signup', '', { email: `qa-dealer-${crypto.randomUUID()}@example.test`, name: 'QA dealer only', password: `QA-test-${crypto.randomUUID()}` });
    const application = await post<DealerApplication>(dealerPage.request, '/dealer/applications', dealer.csrfToken, { organization: `QA outlet ${crypto.randomUUID()}`, description: 'Isolated test application' });
    const approved = await post<DealerApplication>(page.request, `/dealer/applications/${application.id}/approve`, founderSession.csrfToken, { expectedRevision: 1 });
    const quote = await post<VersionedQuote>(dealerPage.request, '/dealer/quotes', dealer.csrfToken, { dealerOrgId: approved.dealerOrgId, lines: [{ productId: product.id, quantity: 6 }], priceVersion: approvedSettings.approvedPolicies.dealer!.version });
    let restock = await post<RestockRecord>(dealerPage.request, '/dealer/restocks', dealer.csrfToken, { quoteId: quote.id });
    restock = await post<RestockRecord>(page.request, `/dealer/restocks/${restock.id}/transition`, founderSession.csrfToken, { expectedRevision: restock.revision, next: 'approved' });
    const evidence = await post<EvidenceRecord>(page.request, '/evidence', founderSession.csrfToken, { entityId: restock.id, name: 'QA physical tally, return and manual receipt evidence', mimeType: 'text/plain', size: 0 });
    restock = await post<RestockRecord>(page.request, `/dealer/restocks/${restock.id}/transition`, founderSession.csrfToken, { expectedRevision: restock.revision, next: 'dispatched', evidenceIds: [evidence.id] });
    await post(dealerPage.request, `/dealer/restocks/${restock.id}/receive`, dealer.csrfToken, { expectedRevision: restock.revision, lines: [{ productId: product.id, quantity: 6 }] });
    await dealerPage.goto('/customer/business');
    await expect(dealerPage.getByRole('heading', { name: 'Consignment & return ledger' })).toBeVisible();
    await dealerPage.getByRole('button', { name: 'Rekod sell-through', exact: true }).click();
    const saleForm = form(dealerPage, 'Record consignment sell-through');
    await saleForm.getByLabel('Stock product').selectOption(product.id);
    await saleForm.getByLabel('Unit quantity').fill('2');
    await saleForm.getByLabel('Stock evidence IDs').fill(evidence.id);
    await saleForm.getByLabel('Sell-through tally reference').fill('QA physical sale tally');
    await saleForm.getByRole('button', { name: 'Rekod actual sell-through' }).click();
    await expect(dealerPage.getByRole('heading', { name: 'sell through', exact: true })).toBeVisible();
    await dealerPage.getByRole('button', { name: 'Request stock return', exact: true }).click();
    const returnForm = form(dealerPage, 'Request return review');
    await returnForm.getByLabel('Stock product').selectOption(product.id);
    await returnForm.getByLabel('Unit quantity').fill('2');
    await returnForm.getByLabel('Stock evidence IDs').fill(evidence.id);
    await returnForm.getByLabel('Return reason').fill('QA damaged units physically set aside');
    await returnForm.getByRole('button', { name: 'Hantar return request' }).click();
    await expect(dealerPage.getByRole('heading', { name: 'return requested', exact: true })).toBeVisible();

    await page.goto('/founder/dealers');
    const policyForm = form(page, 'Approve commission policy');
    await policyForm.getByLabel('Eligible published product IDs').fill(product.id);
    await policyForm.getByLabel('Commission basis points (100 = 1%)').fill('1000');
    await policyForm.getByRole('button', { name: 'Approve versioned policy' }).click();
    await expect(page.getByText(/Policy v\d+ · 10% · Products/).last()).toBeVisible();
    const returnCard = page.locator('article').filter({ has: page.getByRole('heading', { name: `Return · ${product.name} × 2`, exact: true }) });
    const reviewForm = returnCard.locator('.xp-form-panel');
    await reviewForm.getByLabel('Return decision').selectOption('receive');
    await reviewForm.getByLabel('Return receipt evidence IDs').fill(evidence.id);
    await reviewForm.getByLabel('Receipt / rejection reason').fill('QA physical receipt and quarantine check');
    await reviewForm.getByRole('button', { name: 'Simpan rekod' }).click();
    await expect(page.getByRole('heading', { name: 'return received', exact: true }).last()).toBeVisible();
    const settlementForm = form(page, `Create settlement · ${restock.id}`);
    await settlementForm.getByLabel('Settlement evidence IDs').fill(evidence.id);
    await settlementForm.getByRole('button', { name: 'Rekod amount due' }).click();
    const ledgerBeforePayment = await get<DealerLedger>(dealerPage.request, '/dealer/ledger');
    await expect.poll(async () => (await get<DealerLedger>(dealerPage.request, '/dealer/ledger')).settlements.length).toBe(1);
    const settlement = (await get<DealerLedger>(dealerPage.request, '/dealer/ledger')).settlements[0];
    expect(settlement).toMatchObject({ amountSen: 1500, recordedPaidSen: 0, status: 'due' });
    expect(ledgerBeforePayment.payments).toHaveLength(0);
    const settlementCard = page.locator('article').filter({ has: page.getByRole('heading', { name: `Settlement ${settlement.id}`, exact: true }) });
    const paymentForm = settlementCard.locator('.xp-form-panel');
    await paymentForm.getByLabel('Manual receipt amount (RM)').fill('15.00');
    await paymentForm.getByLabel('Receipt method').selectOption('bank');
    await paymentForm.getByLabel('Actual payment reference').fill(`QA manually reviewed ref ${crypto.randomUUID()}`);
    await paymentForm.getByLabel('Manual payment evidence IDs').fill(evidence.id);
    await paymentForm.getByLabel('Founder attestation').selectOption('manual_confirmed_receipt');
    await paymentForm.getByRole('button', { name: 'Rekod manual receipt' }).click();
    await expect(settlementCard.getByText('recorded by user', { exact: true })).toBeVisible();
    await dealerPage.reload();
    const finalLedger = await get<DealerLedger>(dealerPage.request, '/dealer/ledger');
    expect(finalLedger.settlements[0]).toMatchObject({ amountSen: 1500, recordedPaidSen: 1500, status: 'recorded_by_user' });
    expect(finalLedger.payments).toHaveLength(1);
    expect(finalLedger.lots.filter(lot => lot.locationId === 'hq')).toEqual(expect.arrayContaining([expect.objectContaining({ quantity: 2, status: 'quarantine', ownerId: 'business', batchId, expiryAt, provenanceStatus: 'verified' })]));
    await expect(dealerPage.getByRole('heading', { name: 'Earned benefit statements' })).toBeVisible();
    await expect(dealerPage.getByText('Manual receipt', { exact: false }).last()).toBeVisible();

    // Commission uses an actual attributed commerce order; consignment receipts never mint it.
    await post(page.request, '/inventory/receive', founderSession.csrfToken, { productId: product.id, ownerId: 'business', locationId: 'hq', quantity: 1, reason: 'Isolated QA benefit order unit', status: 'available' });
    const published = (await get<PublicProduct[]>(page.request, '/catalogue')).find(row => row.id === product.id)!;
    let order = await post<OrderRecord>(dealerPage.request, '/orders', dealer.csrfToken, { lines: [{ productId: product.id, quantity: 1 }], catalogueVersion: published.publishedVersion, fulfilment: 'pickup', contactRef: 'QA physical counter pickup' });
    const orderEvidence = await post<EvidenceRecord>(page.request, '/evidence', founderSession.csrfToken, { entityId: order.id, name: 'QA physical cash and fulfilment note', mimeType: 'text/plain', size: 0 });
    order = await post<OrderRecord>(page.request, `/orders/${order.id}/payment`, founderSession.csrfToken, { expectedRevision: order.revision, action: 'verify', amountSen: 1000, method: 'cash', reference: `QA cash payment ${crypto.randomUUID()}`, evidenceIds: [orderEvidence.id] });
    for (const next of ['review', 'accepted', 'packing', 'packed', 'dispatched', 'received']) order = await post<OrderRecord>(page.request, `/orders/${order.id}/transition`, founderSession.csrfToken, { expectedRevision: order.revision, next, evidenceIds: [orderEvidence.id] });
    await dealerPage.reload();
    await expect(dealerPage.getByRole('heading', { name: /1\.00 · derived, not paid/ })).toBeVisible();
    await post<OrderRecord>(page.request, `/orders/${order.id}/payment`, founderSession.csrfToken, { expectedRevision: order.revision, action: 'refund', amountSen: 500, method: 'cash', reference: `QA cash refund ${crypto.randomUUID()}`, evidenceIds: [orderEvidence.id] });
    await dealerPage.reload();
    await expect(dealerPage.getByRole('heading', { name: /0\.50 · derived, not paid/ })).toBeVisible();
    await post<SessionData>(outsiderContext.request, '/auth/signup', '', { email: `qa-outsider-${crypto.randomUUID()}@example.test`, name: 'QA outsider only', password: `QA-test-${crypto.randomUUID()}` });
    expect((await outsiderContext.request.get('/api/platform/dealer/ledger')).status()).toBe(403);
  } finally { await dealerContext.close(); await outsiderContext.close(); }
});
