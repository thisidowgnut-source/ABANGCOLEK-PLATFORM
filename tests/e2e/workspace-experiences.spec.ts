import { expect, test } from '@playwright/test';
import { login } from './fixtures';

test('public catalogue and mobile landing preserve navigation, language and theme', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Colek.');
  await expect(page.getByRole('heading', { name: 'QA Colek' })).toBeVisible();
  const theme = page.locator('.platform-app');
  const before = await theme.getAttribute('data-theme');
  await page.getByRole('button', { name: 'Tukar tema', exact: true }).click();
  await expect(theme).toHaveAttribute('data-theme', before === 'dark' ? 'light' : 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('body').innerText()).not.toMatch(/[\u3400-\u9fff]/);
  await page.getByRole('link', { name: 'Bantuan', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Need a hand?' })).toBeVisible();
});

test('founder creates assigned work and completion stores actual outcome', async ({ page }) => {
  await login(page, 'founder');
  await page.goto('/founder/tasks');
  await page.getByRole('button', { name: 'Tugasan baharu', exact: true }).click();
  const form = page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: 'Cipta tugasan' }) });
  const title = `QA task ${Date.now()}`;
  await form.getByLabel('Tajuk tugasan').fill(title);
  await form.getByRole('button', { name: 'Simpan rekod', exact: true }).click();
  const task = page.locator('.xp-task').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  await expect(task).toBeVisible();
  await task.getByRole('button', { name: 'Update outcome' }).click();
  const outcome = page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: `Outcome: ${title}` }) });
  await outcome.getByLabel('Status').selectOption('done');
  await outcome.getByLabel('Kerja dilaksanakan').fill('QA handoff reviewed; no unresolved work.');
  await outcome.getByRole('button', { name: 'Simpan outcome' }).click();
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(page.locator('.xp-task').filter({ has: page.getByRole('heading', { name: title, exact: true }) })).toContainText('QA handoff reviewed');
  await page.reload();
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(page.locator('.xp-task').filter({ has: page.getByRole('heading', { name: title, exact: true }) })).toContainText('QA handoff reviewed');
});

test('founder calendar event persists with MYT boundaries', async ({ page }) => {
  await login(page, 'founder'); await page.goto('/founder/calendar');
  await page.getByRole('button', { name: 'Tambah event', exact: true }).click();
  const form = page.locator('.xp-form-panel'); const title = `QA MYT event ${Date.now()}`;
  await form.getByLabel('Tajuk').fill(title);
  await form.getByLabel('Mula (MYT)').fill('2026-10-03T09:00');
  await form.getByLabel('Tamat (MYT)').fill('2026-10-03T10:00');
  await form.getByRole('button', { name: 'Simpan rekod', exact: true }).click();
  await expect(page.locator('.xp-event').filter({ hasText: title })).toBeVisible();
  await page.reload(); await expect(page.locator('.xp-event').filter({ hasText: title })).toContainText(/9:00\s*PG/);
  const response = await page.request.get('/api/platform/calendar');
  const result = await response.json();
  const event = result.data.find((row: { title: string }) => row.title === title);
  expect(event.startAt).toBe('2026-10-03T01:00:00.000Z');
  expect(event.timezone).toBe('Asia/Kuala_Lumpur');
});

test('founder document drafts and approved knowledge share exact source version', async ({ page }) => {
  await login(page, 'founder'); await page.goto('/founder/documents');
  await page.getByRole('button', { name: 'Dokumen baharu', exact: true }).click();
  const title = `QA source ${Date.now()}`; const form = page.locator('.xp-form-panel');
  await form.getByLabel('Tajuk').fill(title);
  await form.getByLabel('Kandungan Markdown').fill('# Actual team instructions\n\nReview evidence before release.');
  await form.getByLabel('Visibility').selectOption('business');
  await form.getByRole('button', { name: 'Simpan rekod', exact: true }).click();
  await expect(page.locator('.xp-document').filter({ hasText: title })).toContainText('v1');
  await page.goto('/founder/knowledge');
  await page.getByRole('button', { name: 'Publish knowledge', exact: true }).click();
  const publish = page.locator('.xp-form-panel');
  await publish.getByLabel('Source document').selectOption({ label: `${title} · v1` });
  await publish.getByRole('button', { name: 'Approve & publish exact version' }).click();
  await expect(page.locator('.xp-knowledge').filter({ hasText: title })).toContainText('v1');
});

test('staff and developer workspace render scoped actual state', async ({ page }) => {
  await login(page, 'staff'); await page.goto('/staff/tasks');
  await expect(page.getByRole('heading', { name: 'Tugasan saya', exact: true })).toBeVisible();
  await page.goto('/staff/shifts'); await expect(page.getByRole('heading', { name: 'Shift & custody handoff' })).toBeVisible();
  await login(page, 'developer'); await page.goto('/developer/health');
  await expect(page.getByRole('heading', { name: 'Runtime & adapter readiness' })).toBeVisible();
  await expect(page.getByText('ADAPTER_NOT_VERIFIED').first()).toBeVisible();
  await expect(page.locator('.xp-content')).not.toContainText('platform_session');
  await expect(page.getByRole('heading', { name: 'Quota & release controls' })).toBeVisible();
});
