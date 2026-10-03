import type { OrderItem } from '@/services/store';

export type Period = 'all' | '30' | '7';
export const money = (value: number) => new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(value);
export const cityLabel = (city: string) => city.trim().replace(/\b\w/g, letter => letter.toUpperCase());
export const statusLabels: Record<OrderItem['status'], string> = {
  Delivered: 'Selesai', Processing: 'Diproses', Delayed: 'Tertunda', Refunded: 'Bayaran balik', Cancelled: 'Dibatalkan',
};
export const statusColors: Record<OrderItem['status'], string> = {
  Delivered: '#23836f', Processing: '#e4ac28', Delayed: '#d65a49', Refunded: '#8b83b4', Cancelled: '#89909b',
};

export function filterOrders(orders: OrderItem[], period: Period, region: string, now = new Date()) {
  // Rolling windows end now; future-dated records must not enter a current-period metric.
  const start = now.getTime() - Number(period === 'all' ? 0 : period) * 86_400_000;
  return orders.filter(order => {
    const date = Date.parse(order.date);
    return (region === 'all' || order.city.trim().toLowerCase() === region)
      && (period === 'all' || (Number.isFinite(date) && date >= start && date <= now.getTime()));
  });
}

export function buildDashboard(orders: OrderItem[]) {
  const eligible = orders.filter(order => order.status !== 'Refunded' && order.status !== 'Cancelled');
  const orderValue = eligible.reduce((sum, order) => sum + (Number.isFinite(order.amount) ? order.amount : 0), 0);
  const grouped = new Map<string, number>();
  eligible.forEach(order => {
    const city = order.city.trim().toLowerCase();
    grouped.set(city, (grouped.get(city) ?? 0) + (Number.isFinite(order.amount) ? order.amount : 0));
  });
  const regions = [...grouped].map(([id, value]) => ({ id, name: cityLabel(id), value })).sort((a, b) => b.value - a.value);
  const statuses = Object.keys(statusLabels).map(status => ({
    status: status as OrderItem['status'], name: statusLabels[status as OrderItem['status']],
    value: orders.filter(order => order.status === status).length,
  })).filter(item => item.value > 0);
  return {
    orderValue, averageOrder: eligible.length ? orderValue / eligible.length : 0,
    delivered: orders.filter(order => order.status === 'Delivered').length,
    deliveryRate: orders.length ? orders.filter(order => order.status === 'Delivered').length / orders.length * 100 : 0,
    attention: orders.filter(order => order.status === 'Delayed' || order.status === 'Processing')
      .sort((a, b) => Number(b.status === 'Delayed') - Number(a.status === 'Delayed') || Date.parse(a.date) - Date.parse(b.date)),
    regions, statuses,
  };
}
