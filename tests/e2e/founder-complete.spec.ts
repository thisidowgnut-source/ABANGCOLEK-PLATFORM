import { expect, test, type Page } from '@playwright/test';
import { fixture, login } from './fixtures';

async function command(page: Page, path: string, input: unknown) {
  const session = await (await page.request.get('/api/platform/session')).json();
  const response = await page.request.post(`/api/platform${path}`, { headers: { Origin: fixture().origin, 'X-CSRF-Token': session.data.csrfToken, 'Idempotency-Key': crypto.randomUUID() }, data: input });
  const result = await response.json();
  expect(response.ok(), `${path}: ${result.code ?? 'request failed'}`).toBe(true);
  return result.data;
}

test('founder corrects approved closing and preserves immutable prior approval', async ({ page }) => {
  await login(page, 'founder');
  const outlet = `qa-closing-${Date.now()}`;
  const close = await command(page, '/dayclose', { outletId: outlet, date: '2026-10-04', countCashSen: 0 });
  const approved = await command(page, `/dayclose/${close.id}/approve`, { expectedRevision: close.revision });
  await page.goto('/founder/qc');
  const panel = page.locator('.xp-panel').filter({ has: page.getByRole('heading', { name: 'Pembetulan closing yang berjejak', exact: true }) });
  const form = panel.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: `${outlet} · 2026-10-04`, exact: true }) });
  await form.getByLabel('Kiraan tunai baharu (RM)').fill('0');
  await form.getByLabel('Sebab pembetulan').fill('QA recount verified; original approval retained.');
  await form.getByRole('button', { name: 'Buka semula untuk review', exact: true }).click();
  await expect(panel.locator('.xp-list-row').filter({ hasText: outlet }).getByText(`Snapshot approval v${approved.revision} → correction v${approved.revision + 1}`, { exact: true })).toBeVisible();
  const history = await (await page.request.get('/api/platform/dayclose/amendments')).json();
  expect(history.data.find((record: { dayCloseId: string }) => record.dayCloseId === close.id).approvedSnapshot).toEqual(approved);
  const closes = await (await page.request.get('/api/platform/dayclose')).json();
  expect(closes.data.find((record: { id: string }) => record.id === close.id).status).toBe('review');
});

test('founder posts approved real file evidence and appends one reversal through UI', async ({ page }) => {
  await login(page, 'founder');
  const category = `QA invoice ${Date.now()}`;
  const reversalReason = `QA cancellation ${category}; reverse recognition.`;
  const expense = await command(page, '/expenses', { outletId: 'hq', amountSen: 1250, category, evidenceIds: [] });
  const session = await (await page.request.get('/api/platform/session')).json();
  const upload = await page.request.post('/api/platform/evidence/upload', { headers: { Origin: fixture().origin, 'X-CSRF-Token': session.data.csrfToken }, multipart: { entityId: expense.id, file: { name: 'invoice.txt', mimeType: 'text/plain', buffer: Buffer.from(`Isolated QA invoice evidence ${category}`) } } });
  expect(upload.ok()).toBe(true);
  const expenses = await (await page.request.get('/api/platform/expenses')).json();
  const ready = expenses.data.find((record: { id: string }) => record.id === expense.id);
  await command(page, `/expenses/${expense.id}/approve`, { expectedRevision: ready.revision });
  await page.goto('/founder/finance');
  const panel = page.locator('.xp-panel').filter({ has: page.getByRole('heading', { name: 'Expense posting dan reversal', exact: true }) });
  const row = panel.locator('.xp-list-row').filter({ hasText: category });
  await row.getByRole('button', { name: 'Post expense', exact: true }).click();
  await row.getByRole('button', { name: 'Sahkan posting sumber approved', exact: true }).click();
  await expect.poll(async () => { const result = await (await page.request.get('/api/platform/expense-postings')).json(); return result.data.filter((record: { expenseId: string }) => record.expenseId === expense.id).length; }).toBe(1);
  const posted = (await (await page.request.get('/api/platform/expense-postings')).json()).data.find((record: { expenseId: string }) => record.expenseId === expense.id);
  const entry = panel.locator('.xp-expense').filter({ hasText: posted.id });
  await entry.getByLabel('Sebab reversal').fill(reversalReason);
  await entry.getByRole('button', { name: 'Sahkan reversal', exact: true }).click();
  await expect.poll(async () => { const result = await (await page.request.get('/api/platform/expense-postings')).json(); return result.data.filter((record: { expenseId: string }) => record.expenseId === expense.id).length; }).toBe(2);
  const all = (await (await page.request.get('/api/platform/expense-postings')).json()).data.filter((record: { expenseId: string }) => record.expenseId === expense.id);
  expect(all.reduce((sum: number, record: { amountSen: number }) => sum + record.amountSen, 0)).toBe(0);
  expect(all.every((record: { bankSettlement: string }) => record.bankSettlement === 'NOT_ASSERTED')).toBe(true);
  await page.reload();
  await expect(panel.getByText(reversalReason, { exact: false })).toBeVisible();
});

test('founder invitation is email-bound and logged-in recipient accepts once in app', async ({ page, browser }) => {
  await login(page, 'founder');
  const email = `invite-${crypto.randomUUID()}@qa.invalid`, password = 'QA temporary invitation password 123';
  const recipient = await browser.newContext({ baseURL: fixture().origin });
  try {
    const signup = await recipient.request.post('/api/platform/auth/signup', { headers: { Origin: fixture().origin }, data: { email, password, name: 'QA invited staff' } });
    expect(signup.ok()).toBe(true);
    await page.goto('/founder/people');
    const form = page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: 'Jemput ahli pasukan', exact: true }) });
    await form.getByLabel('Email penerima').fill(email);
    await form.getByLabel('Role').selectOption('staff');
    await form.getByLabel('Outlet IDs', { exact: true }).fill('hq');
    await form.getByRole('button', { name: 'Cipta invitation', exact: true }).click();
    const tokenPanel = page.locator('.xp-panel').filter({ has: page.getByRole('heading', { name: 'Token invitation sekali guna', exact: true }) });
    await expect(tokenPanel).toBeVisible();
    const token = await tokenPanel.locator('code').innerText();
    const recipientPage = await recipient.newPage();
    await recipientPage.goto('/customer/overview');
    const acceptance = recipientPage.locator('.xp-form-panel').filter({ has: recipientPage.getByRole('heading', { name: 'Terima invitation', exact: true }) });
    await acceptance.getByLabel('Invitation token').fill(token);
    await acceptance.getByRole('button', { name: 'Terima invitation', exact: true }).click();
    await expect.poll(async () => { const result = await (await recipient.request.get('/api/platform/session')).json(); return result.data.memberships.some((member: { role: string }) => member.role === 'staff'); }).toBe(true);
    await recipientPage.goto('/staff/overview');
    await expect(recipientPage.locator('#platform-main').getByText('Staff workspace', { exact: true })).toBeVisible();
    const session = await (await recipient.request.get('/api/platform/session')).json();
    const replay = await recipient.request.post('/api/platform/people/invitations/accept', { headers: { Origin: fixture().origin, 'X-CSRF-Token': session.data.csrfToken }, data: { token } });
    expect(replay.status()).toBe(403);
  } finally { await recipient.close(); }
});

test('staff availability and own notification preferences persist after browser reload', async ({ page }) => {
  await login(page, 'founder');
  const title = `QA assigned notification ${Date.now()}`;
  await command(page, '/tasks', { entityId: 'business', title, assigneeId: fixture().staff.userId, documentIds: [] });
  await login(page, 'staff');
  const schedules = (await (await page.request.get('/api/platform/availability')).json()).data;
  const existing = schedules.find((record: { userId: string }) => record.userId === fixture().staff.userId);
  if (existing?.slots.length) { await command(page, '/availability', { expectedRevision: existing.revision, slots: [] }); await page.reload(); }
  const preferences = page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: 'Tetapan notifikasi sendiri', exact: true }) });
  await preferences.getByLabel('Notifikasi dalam aplikasi').selectOption('true');
  await preferences.getByLabel('Topics dipilih', { exact: true }).fill('tasks');
  await preferences.getByRole('button', { name: 'Simpan preferences', exact: true }).click();
  const activity = page.locator('.xp-panel').filter({ has: page.getByRole('heading', { name: 'Aktiviti dalam aplikasi', exact: true }) });
  await expect(activity.getByText(title, { exact: true })).toBeVisible();
  await preferences.getByLabel('Notifikasi dalam aplikasi').selectOption('false');
  await preferences.getByLabel('Topics dipilih', { exact: true }).fill('orders, tasks');
  await preferences.getByRole('button', { name: 'Simpan preferences', exact: true }).click();
  await expect.poll(async () => (await (await page.request.get('/api/platform/notification-preferences')).json()).data.inAppEnabled).toBe(false);
  await expect(activity).toContainText('Notifikasi dalam aplikasi dimatikan');
  await expect(activity.getByText(title, { exact: true })).toHaveCount(0);
  const form = page.locator('.xp-form-panel').filter({ has: page.getByRole('heading', { name: 'Tambah availability sendiri', exact: true }) });
  await form.getByLabel('Outlet ID').fill('hq');
  await form.getByLabel('Mula (MYT)').fill('2026-10-10T09:00');
  await form.getByLabel('Tamat (MYT)').fill('2026-10-10T10:00');
  await form.getByLabel('Status').selectOption('available');
  await form.getByRole('button', { name: 'Tambah availability', exact: true }).click();
  await expect.poll(async () => { const result = await (await page.request.get('/api/platform/availability')).json(); return result.data[0]?.slots.some((slot: { startAt: string }) => slot.startAt === '2026-10-10T01:00:00.000Z'); }).toBe(true);
  await page.reload();
  await expect(preferences.getByLabel('Notifikasi dalam aplikasi')).toHaveValue('false');
  await expect(page.getByText(/10 Okt 2026/).first()).toBeVisible();
});
