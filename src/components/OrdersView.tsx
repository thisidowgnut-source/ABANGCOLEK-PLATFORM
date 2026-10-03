/**
 * Real-Time Supabase Orders View Component
 * Directly interacts with live Supabase `orders` table on bktksvhcgszaoqkdyhil.supabase.co
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Filter, 
  ArrowUpRight,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { 
  fetchSupabaseOrders, 
  insertSupabaseOrder, 
  updateSupabaseOrderStatus, 
  subscribeSupabaseOrders, 
  seedInitialOrdersToSupabase,
  SupabaseOrder 
} from '@/services/supabaseOrders';
import { SUPABASE_CONFIG } from '@/services/supabaseClient';
import { cn } from '@/lib/utils';

export interface OrdersViewProps {
  onAction?: (msg?: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onAction }) => {
  const [orders, setOrders] = useState<SupabaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  // Form State
  const [newCust, setNewCust] = useState('');
  const [newCity, setNewCity] = useState('johor bahru');
  const [newItems, setNewItems] = useState('3x Kuah Colek Buah Original (500g)');
  const [newAmount, setNewAmount] = useState('84');

  const loadOrders = async () => {
    setLoading(true);
    const result = await fetchSupabaseOrders();
    setOrders(result.orders);
    setIsLive(result.isLive);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    // Subscribe to live Postgres changes via Supabase WebSocket
    const unsubscribe = subscribeSupabaseOrders(() => {
      loadOrders();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.trim()) return;

    setSyncing(true);
    await insertSupabaseOrder({
      customer_name: newCust.trim(),
      city: newCity,
      items: newItems,
      amount: parseFloat(newAmount) || 0
    });
    setNewCust('');
    setShowAddModal(false);
    setSyncing(false);
    loadOrders();
  };

  const handleRefund = async (orderId: string, amount: number) => {
    if (!confirm(`Sahkan bayar balik (refund) RM ${amount} bagi pesanan ${orderId}?`)) return;
    setSyncing(true);
    await updateSupabaseOrderStatus(orderId, 'Refunded', 'LEAKAGE / Penutup Botol Kurier Longgar');
    setSyncing(false);
    loadOrders();
  };

  const handleSyncAllToSupabase = async () => {
    setSyncing(true);
    await seedInitialOrdersToSupabase();
    await loadOrders();
    setSyncing(false);
  };

  // Calculations
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || o.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesCity;
  });

  const totalGMV = orders.reduce((sum, o) => sum + (o.status !== 'Refunded' ? o.amount : 0), 0);
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const refundedCount = orders.filter(o => o.status === 'Refunded').length;

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header with Live Supabase Status */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pl-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Live ({SUPABASE_CONFIG.projectRef})</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--ui-muted)]">PostgreSQL RLS Active</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--ui-text)] tracking-tight">Pangkalan Data Pesanan Langsung</h2>
            <p className="text-[var(--ui-muted)] mt-1 text-[15px] font-medium">
              Data pesanan dibaca dan disegerak secara langsung daripada jadual <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-xs">public.orders</code> di Supabase.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSyncAllToSupabase}
              disabled={syncing}
              className="px-4 py-2.5 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] rounded-full text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Segerakkan semua pesanan ke pangkalan data awan Supabase"
            >
              <RefreshCw size={14} className={cn(syncing && "animate-spin text-[var(--ui-success-text)]")} />
              <span>Segerak Cloud</span>
            </button>

            <button 
              onClick={() => setShowAddModal(true)} 
              className="px-5 py-2.5 bg-[var(--ui-primary)] hover:bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] rounded-full text-[13px] font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Tambah Pesanan</span>
            </button>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[var(--ui-surface)] p-4.5 rounded-2xl border border-[var(--ui-border)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Jumlah Pesanan</span>
            <div className="text-2xl font-bold text-[var(--ui-text)]">{orders.length}</div>
            <span className="text-[11px] text-[var(--ui-success-text)] font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Disegerak Realtime</span>
            </span>
          </div>

          <div className="bg-[var(--ui-surface)] p-4.5 rounded-2xl border border-[var(--ui-border)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Nilai Jualan (GMV)</span>
            <div className="text-2xl font-bold text-[var(--ui-text)] text-[var(--ui-success-text)]">RM {totalGMV.toLocaleString()}</div>
            <span className="text-[11px] text-[var(--ui-muted)] font-medium mt-1 block">Hasil pesanan sah</span>
          </div>

          <div className="bg-[var(--ui-surface)] p-4.5 rounded-2xl border border-[var(--ui-border)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Berjaya Dihantar</span>
            <div className="text-2xl font-bold text-[var(--ui-text)]">{deliveredCount}</div>
            <span className="text-[11px] text-[var(--ui-muted)] font-medium mt-1 block">Kadar siap {orders.length ? Math.round((deliveredCount/orders.length)*100) : 0}%</span>
          </div>

          <div className="bg-[var(--ui-surface)] p-4.5 rounded-2xl border border-[var(--ui-border)] shadow-xs">
            <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Aduan / Bayar Balik</span>
            <div className="text-2xl font-bold text-[var(--ui-danger-text)]">{refundedCount}</div>
            <span className="text-[11px] text-[var(--ui-warning-text)] font-medium mt-1 block">Invarian JEV Terpelihara</span>
          </div>
        </div>

        {/* Add Order Modal */}
        {showAddModal && (
          <div className="p-6 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)] shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-[var(--ui-text)]">Daftar Pesanan Baharu ke Supabase</h3>
                <p className="text-xs text-[var(--ui-muted)]">Rekod akan disimpan terus ke pangkalan data PostgreSQL awan.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-semibold text-[var(--ui-muted)] hover:text-[var(--ui-text)]">Tutup</button>
            </div>
            <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Nama / ID Pelanggan</label>
                <input 
                  type="text" 
                  value={newCust} 
                  onChange={(e) => setNewCust(e.target.value)} 
                  placeholder="cth: Kak Mas (Stokis KT)"
                  required
                  className="w-full px-3 py-2 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--ui-border)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Bandar / Hab</label>
                <select 
                  value={newCity} 
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs font-medium capitalize focus:outline-none focus:border-[var(--ui-border)]"
                >
                  <option value="johor bahru">Johor Bahru (HQ / Toppen)</option>
                  <option value="shah alam">Shah Alam (Central Hub)</option>
                  <option value="kuala terengganu">Kuala Terengganu (Stokis)</option>
                  <option value="bangi">Bangi</option>
                  <option value="kota bharu">Kota Bharu</option>
                  <option value="penang">Penang</option>
                  <option value="melaka">Melaka</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Item Produk</label>
                <input 
                  type="text" 
                  value={newItems} 
                  onChange={(e) => setNewItems(e.target.value)} 
                  placeholder="cth: 3x Kuah Colek Buah Original (500g)"
                  required
                  className="w-full px-3 py-2 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--ui-border)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">Jumlah (RM)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={newAmount} 
                    onChange={(e) => setNewAmount(e.target.value)} 
                    required
                    className="w-full px-3 py-2 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs font-medium focus:outline-none focus:border-[var(--ui-border)]"
                  />
                  <button 
                    type="submit" 
                    disabled={syncing}
                    className="px-5 py-2 bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] rounded-xl text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {syncing ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-[var(--ui-surface)] p-3.5 rounded-2xl border border-[var(--ui-border)] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
            <input 
              type="text"
              placeholder="Cari ID pesanan, pelanggan atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--ui-soft)] rounded-xl text-xs font-medium border border-[var(--ui-border)] focus:outline-none focus:border-[var(--ui-border)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter size={13} className="text-[var(--ui-muted)] shrink-0" />
            {['all', 'johor bahru', 'kuala terengganu', 'shah alam', 'bangi', 'penang'].map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors shrink-0 capitalize",
                  selectedCity === city 
                    ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]" 
                    : "bg-[var(--ui-soft)] text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
                )}
              >
                {city === 'all' ? 'Semua Hab' : city}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table Cards */}
        <div className="grid gap-3.5">
          {loading ? (
            <div className="text-center py-20 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)]">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[var(--ui-muted)] font-medium text-xs">Memuat turun pesanan daripada Supabase PostgreSQL...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)]">
              <p className="text-[var(--ui-muted)] font-medium">Tiada pesanan ditemui sepadan dengan carian.</p>
            </div>
          ) : (
            filteredOrders.map((order, i) => (
              <div 
                key={order.id || order.order_id || i} 
                className="bg-[var(--ui-surface)] p-5 md:p-6 rounded-3xl border border-[var(--ui-border)] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[var(--ui-border)]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-base md:text-lg text-[var(--ui-text)] font-mono">{order.order_id}</h3>
                    <span className="px-3 py-0.5 bg-[var(--ui-soft)] rounded-full text-xs font-semibold text-[var(--ui-text)] border border-[var(--ui-border)] capitalize">
                      {order.city}
                    </span>
                    <span className={cn(
                      "px-2.5 py-0.5 text-xs font-bold rounded-full border",
                      order.status === 'Delivered' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
                      order.status === 'Delayed' ? "bg-red-50 border-red-200 text-red-700" :
                      order.status === 'Refunded' ? "bg-[var(--ui-soft)] border-[var(--ui-border)] text-[var(--ui-muted)]" :
                      "bg-[var(--ui-soft)] border-[var(--ui-border)] text-[var(--ui-accent-text)]"
                    )}>
                      {order.status}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-[var(--ui-text)]">
                    <strong className="text-[var(--ui-text)]">Produk:</strong> {order.items}
                  </p>

                  {order.refund_reason && (
                    <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-100">
                      {order.refund_reason}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-5 text-xs text-[var(--ui-muted)] pt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--ui-muted)] font-bold uppercase tracking-wider">Pelanggan</span>
                      <strong className="text-[var(--ui-text)] text-xs font-semibold">{order.customer_name}</strong>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--ui-muted)] font-bold uppercase tracking-wider">Jumlah</span>
                      <strong className="text-[var(--ui-success-text)] text-xs font-bold">RM {order.amount.toLocaleString()}</strong>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--ui-muted)] font-bold uppercase tracking-wider">Tarikh Rekod</span>
                      <strong className="text-[var(--ui-muted)] text-xs font-medium">{new Date(order.created_at).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {order.status !== 'Refunded' && (
                    <button 
                      onClick={() => handleRefund(order.order_id, order.amount)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Bayar Balik (RM {order.amount})</span>
                    </button>
                  )}
                  <button 
                    onClick={() => onAction && onAction(`Siasat pesanan Supabase ${order.order_id} bagi pelanggan ${order.customer_name} di hab ${order.city} dengan JEV System-1.`)}
                    className="px-3.5 py-1.5 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>Semak di Chat</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
