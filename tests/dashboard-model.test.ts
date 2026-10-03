import { describe, expect, test } from 'bun:test';
import { buildDashboard, filterOrders } from '../src/features/dashboard/model';
import type { OrderItem } from '@/services/store';

const orders: OrderItem[] = [
  { order_id: 'one', customer_id: 'a', status: 'Delivered', amount: 100, date: '2026-09-30T10:00:00Z', city: 'Johor Bahru', items: 'Colek' },
  { order_id: 'two', customer_id: 'b', status: 'Delayed', amount: 50, date: '2026-09-29T10:00:00Z', city: 'johor bahru', items: 'Colek' },
  { order_id: 'three', customer_id: 'c', status: 'Refunded', amount: 25, date: '2026-09-10T10:00:00Z', city: 'Bangi', items: 'Colek' },
];

describe('dashboard metrics', () => {
  test('regional chart reconciles to eligible order value and excludes refunded orders', () => {
    const model = buildDashboard(orders);
    expect(model.orderValue).toBe(150);
    expect(model.regions.reduce((sum, region) => sum + region.value, 0)).toBe(150);
    expect(model.regions).toHaveLength(1);
    expect(model.attention.map(order => order.order_id)).toEqual(['two']);
  });
  test('date and region filters operate together and exclude future records', () => {
    const future = { ...orders[0], order_id: 'future', date: '2026-10-03T10:00:00Z' };
    expect(filterOrders([...orders, future], '7', 'johor bahru', new Date('2026-10-01T12:00:00Z'))).toHaveLength(2);
    expect(filterOrders(orders, '7', 'bangi', new Date('2026-10-01T12:00:00Z'))).toHaveLength(0);
  });
  test('empty data has finite metrics and no fabricated values', () => {
    const model = buildDashboard([]);
    expect(model.orderValue).toBe(0);
    expect(model.averageOrder).toBe(0);
    expect(model.deliveryRate).toBe(0);
    expect(model.regions).toEqual([]);
  });
});
