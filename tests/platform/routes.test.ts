import { describe, expect, test } from 'bun:test';
import { canOpenWorkspace, getNavigation, resolveRoute } from '../../src/features/platform/routes';

describe('workspace URL boundaries', () => {
  test('public content and authenticated flow URLs resolve independently', () => {
    expect(resolveRoute('/products').kind).toBe('public');
    expect(resolveRoute('/flows/buy').kind).toBe('flow');
  });
  test('deep order URL carries customer role and entity without mounting founder', () => {
    expect(resolveRoute('/customer/orders/ORD-123')).toMatchObject({ kind: 'workspace', role: 'customer', entityId: 'ORD-123' });
    expect(canOpenWorkspace('founder', ['customer'])).toBe(false);
  });
  test('unknown workspace sections and malformed encoded paths stay not-found', () => {
    expect(resolveRoute('/founder/arbitrary-secret').kind).toBe('not_found');
    expect(resolveRoute('/customer/orders/%zz').kind).toBe('not_found');
    expect(resolveRoute('//founder/overview').kind).toBe('not_found');
  });
  test('dealer space remains a scoped customer experience', () => {
    expect(resolveRoute('/customer/business').role).toBe('customer');
    expect(getNavigation('customer').some(item => item.path.startsWith('/founder'))).toBe(false);
    expect(getNavigation('staff').some(item => item.id === 'tasks')).toBe(true);
  });
  test('canonical membership permits only explicitly granted role', () => {
    expect(canOpenWorkspace('staff', ['customer', 'staff'])).toBe(true);
    expect(canOpenWorkspace('developer', ['founder'])).toBe(false);
  });
  test('prototype property names cannot become workspace roles', () => {
    expect(resolveRoute('/__proto__/overview').kind).toBe('not_found');
    expect(resolveRoute('/constructor/overview').kind).toBe('not_found');
  });
  test('published product URLs use a bounded public identifier', () => {
    expect(resolveRoute('/products/sku-a')).toMatchObject({ kind: 'public', entityId: 'sku-a' });
    expect(resolveRoute('/products/sku-a/extra').kind).toBe('not_found');
    expect(resolveRoute('/products/%2Ffounder').kind).toBe('not_found');
  });
});
