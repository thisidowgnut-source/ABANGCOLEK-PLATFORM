import { expect, test } from 'bun:test';
import { buildPublicHtml } from '../../scripts/public-html';
const template = '<html><head><title>Old title</title></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
const snapshot = { version: 7, generatedAt: '2026-10-02T00:00:00.000Z', products: [{ id: 'sku-a', name: 'Colek <script>alert(1)</script>', description: 'Buah & kuah', priceSen: 2800, currency: 'MYR' as const, packSize: 1, availableQuantity: 2, publishedVersion: 7 }] };
test('public catalogue is readable in served HTML with approved price and source version', () => {
  const html = buildPublicHtml(template, snapshot, 'products');
  expect(html).toContain('data-catalogue-version="7"');
  expect(html).toContain('RM28.00');
  expect(html).toContain('Colek &lt;script&gt;alert(1)&lt;/script&gt;');
  expect(html).not.toContain('<script>alert(1)</script>');
});
test('product metadata uses same published snapshot and safe structured data', () => {
  const html = buildPublicHtml(template, snapshot, snapshot.products[0]);
  expect(html).toContain('application/ld+json');
  expect(html).toContain('"price":"28.00"');
  expect(html).toContain('name="description"');
  expect(html).toContain('property="og:title"');
  expect(html).toContain('rel="canonical" href="/products/sku-a"');
});
test('empty catalogue does not fabricate product or sales claims', () => {
  const html = buildPublicHtml(template, { ...snapshot, products: [], version: 0 }, 'home');
  expect(html).toContain('Katalog belum diterbitkan');
  expect(html).not.toContain('"@type":"Product"');
});
test('regenerating a snapshot replaces canonical and structured product metadata', () => {
  const first = buildPublicHtml(template, snapshot, snapshot.products[0]);
  const second = buildPublicHtml(first, { ...snapshot, products: [], version: 8 }, 'home');
  expect((second.match(/rel="canonical"/g) ?? []).length).toBe(1);
  expect(second).toContain('rel="canonical" href="/"');
  expect(second).not.toContain('"@type":"Product"');
  expect(second).not.toContain('platform-product-metadata');
});
