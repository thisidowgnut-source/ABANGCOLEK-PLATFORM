import { expect, test } from '@playwright/test';

test('public product metadata is removed when navigating into login', async ({ page }) => {
  const response = await page.request.get('/api/platform/catalogue?limit=1');
  const catalogue = await response.json() as { data: { id: string; name: string }[] };
  const product = catalogue.data[0];
  expect(product).toBeDefined();
  await page.goto(`/products/${product.id}`);
  await expect(page).toHaveTitle(`${product.name} | ABANGCOLEK`);
  await expect(page.locator('#platform-product-metadata')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/products/${product.id}$`));
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Masuk ke ABANGCOLEK', exact: true })).toBeVisible();
  await expect(page.locator('#platform-product-metadata')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page).toHaveTitle('ABANGCOLEK — Workspace');
});
