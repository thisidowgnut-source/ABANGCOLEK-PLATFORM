import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page } from '@playwright/test';
import type { WorkspaceRole } from '../../shared/platform-contracts';

export function fixture() { return JSON.parse(readFileSync(resolve('var/run/e2e-fixture.json'), 'utf8')) as Record<WorkspaceRole, { email: string; password: string; userId: string }> & { productId: string; origin: string }; }
export async function login(page: Page, role: WorkspaceRole) {
  const account = fixture()[role];
  const response = await page.request.post('/api/platform/auth/login', { headers: { Origin: fixture().origin }, data: { email: account.email, password: account.password } });
  expect(response.ok()).toBe(true);
  await page.goto(`/${role}/overview`);
  await expect(page.getByLabel('Navigasi ruang kerja')).toBeVisible();
}
