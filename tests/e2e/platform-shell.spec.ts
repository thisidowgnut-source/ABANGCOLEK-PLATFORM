import { expect, test } from '@playwright/test';

test('login and portal links are responsive and do not grant roles', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Masuk ke ABANGCOLEK', exact: true })).toBeVisible();
  await page.goto('/founder/overview');
  await expect(page.getByRole('heading', { name: 'Masuk ke ABANGCOLEK', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 740 });
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('unknown route provides recovery and public landing survives refresh', async ({ page }) => {
  await page.goto('/not-a-real-route');
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemui' })).toBeVisible();
  await page.getByRole('button', { name: 'Kembali ke halaman utama' }).click();
  await expect(page.getByRole('main')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
});
