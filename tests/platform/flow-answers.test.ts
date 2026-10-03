import { expect, test } from 'bun:test';
import { lineAnswers } from '../../src/features/flows/flow-answers';
const product = { id: 'sku', name: 'QA', description: '', priceSen: 2800, currency: 'MYR' as const, packSize: 2, publishedVersion: 7, availableQuantity: 4 };
test('purchase lines preserve exact catalogue version and approved pack multiple', () => {
  expect(lineAnswers('order', product, 2)).toEqual({ lines: [{ productId: 'sku', quantity: 2 }], catalogueVersion: 7 });
  expect(() => lineAnswers('order', product, 1)).toThrow();
});
test('receiving does not use current HQ availability or inject order-only fields', () => {
  expect(lineAnswers('stock_receipt', { ...product, availableQuantity: 0 }, 1)).toEqual({ lines: [{ productId: 'sku', quantity: 1 }] });
});
