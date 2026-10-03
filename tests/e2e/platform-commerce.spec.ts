import { test, expect } from '@playwright/test';
import { fixture, login } from './fixtures';

test('customer guided order creates one persisted receipt and remains private', async ({ page, browser }) => {
  await login(page, 'customer');
  await page.goto('/flows/order');
  await page.getByRole('button', { name: 'Mulakan flow' }).click();
  await page.getByRole('combobox', { name: 'Produk', exact: true }).selectOption(fixture().productId);
  await page.getByLabel('Kuantiti', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Teruskan', exact: true }).click();
  await page.getByLabel('Pickup', { exact: true }).check();
  await page.getByRole('button', { name: 'Teruskan', exact: true }).click();
  await page.getByLabel('Maklumat penerimaan', { exact: true }).fill('QA customer pickup contact');
  await page.getByRole('button', { name: 'Teruskan', exact: true }).click();
  await page.getByRole('button', { name: 'Sahkan semakan server', exact: true }).click();
  await page.getByRole('button', { name: 'Hantar permintaan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Permintaan telah diterima.' })).toBeVisible();
  const orderId = await page.locator('.flow-receipt strong').innerText();
  const own = await page.request.get(`/api/platform/orders/${orderId}`);
  expect(own.ok()).toBe(true);
  expect((await own.json()).data).toMatchObject({ amountSen: 2800, paymentState: 'pending', fulfilmentStatus: 'requested' });
  await page.reload();
  await page.goto('/customer/orders');
  await expect(page.getByRole('button', { name: new RegExp(orderId) })).toBeVisible();
  const outsider = await browser.newContext();
  const denied = await outsider.request.get(`${fixture().origin}/api/platform/orders/${orderId}`);
  expect(denied.status()).toBe(401);
  await outsider.close();
});
