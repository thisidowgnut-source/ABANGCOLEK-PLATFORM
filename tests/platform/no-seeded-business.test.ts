import { expect, test } from 'bun:test';
import { appStore } from '../../src/services/store';
test('legacy business cache does not seed sales or reviews from the bundled dataset', () => {
  expect(appStore.getOrders()).toEqual([]);
  expect(appStore.getReviews()).toEqual([]);
});
