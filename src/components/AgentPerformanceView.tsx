/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { 
  Gauge, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  BarChart3, 
  Filter, 
  Play, 
  Layers, 
  Database, 
  ShieldCheck, 
  ArrowUpRight, 
  Cpu, 
  Search, 
  Flame,
  Check,
  ChevronRight,
  Sparkles,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/services/supabaseClient';
import { 
  supabaseAgentPerformance, 
  AgentTaskLog, 
  ToolPerformanceMetric, 
  TimeSeriesPerformancePoint 
} from '@/services/supabaseAgentPerformance';

interface AgentPerformanceViewProps {
  onAction?: (msg?: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Logistik & Bas': '#EF4444',     // Red
  'Google Workspace': '#3B82F6',   // Blue
  'Gedung Plugins': '#10B981',     // Emerald
  'Analisis & Laporan': 'var(--ui-accent)'  // Purple
};

export const AgentPerformanceView: React.FC<AgentPerformanceViewProps> = ({ onAction }) => {
  const [logs, setLogs] = useState<AgentTaskLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);
  const [sortBy, setSortBy] = useState<'efficiency' | 'latency' | 'successRate' | 'volume'>('efficiency');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkFeedback, setBenchmarkFeedback] = useState<string | null>(null);
  const [selectedToolDetail, setSelectedToolDetail] = useState<ToolPerformanceMetric | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('SUBSCRIBED');
  const [isSimulatingRealtimeInsert, setIsSimulatingRealtimeInsert] = useState(false);

  // Load data & subscribe to Supabase logs + Realtime changes on `tasks` table
  useEffect(() => {
    loadPerformanceData();

    // 1. Local reactive store subscription
    const unsubStore = supabaseAgentPerformance.subscribe((data) => {
      setLogs(data);
    });

    // 2. Live Supabase Realtime subscription on `tasks` table
    const unsubRealtime = supabaseAgentPerformance.subscribeToRealtimeTasks(
      (newLog) => {
        setLogs((prev) => [newLog, ...prev.filter(l => l.id !== newLog.id)]);
        setBenchmarkFeedback(`⚡ Supabase Realtime: Rekod baharu dikesan dalam jadual 'tasks'! Alat: ${newLog.tool_name} (${newLog.latency_ms} ms) · Carta dikemas kini secara automatik.`);
        setTimeout(() => setBenchmarkFeedback(null), 5500);
      },
      (status) => {
        setRealtimeStatus(status);
      }
    );

    return () => {
      unsubStore();
      unsubRealtime();
    };
  }, []);

  const loadPerformanceData = async () => {
    setIsRefreshing(true);
    await supabaseAgentPerformance.fetchTaskLogs();
    setIsRefreshing(false);
  };

  // Simulate inserting a new task directly into Supabase `tasks` table
  const handleSimulateSupabaseTaskInsert = async () => {
    setIsSimulatingRealtimeInsert(true);
    const candidateTools: { name: string; cat: AgentTaskLog['tool_category'] }[] = [
      { name: 'bus_freight_dispatch_create', cat: 'Logistik & Bas' },
      { name: 'redbus_bus_freight_schedule', cat: 'Logistik & Bas' },
      { name: 'create_google_sheet', cat: 'Google Workspace' },
      { name: 'send_gmail_email', cat: 'Google Workspace' },
      { name: 'supabase_query_db', cat: 'Gedung Plugins' },
      { name: 'generate_yearly_report', cat: 'Analisis & Laporan' }
    ];
    const picked = candidateTools[Math.floor(Math.random() * candidateTools.length)];
    const randomLatency = Math.floor(130 + Math.random() * 260);

    const taskRecord = {
      task_id: `TSK-RT-${Math.floor(1000 + Math.random() * 9000)}`,
      tool_name: picked.name,
      tool_category: picked.cat,
      latency_ms: randomLatency,
      status: Math.random() > 0.05 ? ('SUCCESS' as const) : ('ERROR' as const),
      tokens_used: Math.floor(250 + Math.random() * 400),
      user_query: `Simulasi sisipan Supabase Realtime jadual tasks (${picked.name})`,
      model: 'gemini-3.8-flash'
    };

    await supabaseAgentPerformance.recordTaskExecution(taskRecord);
    setIsSimulatingRealtimeInsert(false);
  };

  // Run live tool benchmark simulation
  const handleRunBenchmark = async (toolName?: string, category?: any) => {
    setIsBenchmarking(true);
    const targetTool = toolName || 'bus_freight_dispatch_create';
    const targetCategory = category || 'Logistik & Bas';

    const recorded = await supabaseAgentPerformance.simulateToolBenchmark(targetTool, targetCategory);
    setIsBenchmarking(false);
    setBenchmarkFeedback(`Ujian penanda aras alat '${recorded.tool_name}' selesai dalam ${recorded.latency_ms}ms (Status: ${recorded.status}).`);
    setTimeout(() => setBenchmarkFeedback(null), 4500);
  };

  // Calculate metrics
  const { toolMetrics, overallMetrics, timeSeries } = useMemo(() => {
    return supabaseAgentPerformance.calculateMetrics(selectedCategory, timeRangeDays);
  }, [logs, selectedCategory, timeRangeDays]);

  // Sorted tool metrics based on user preference
  const sortedToolMetrics = useMemo(() => {
    const list = [...toolMetrics];
    if (sortBy === 'efficiency') {
      list.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    } else if (sortBy === 'latency') {
      list.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
    } else if (sortBy === 'successRate') {
      list.sort((a, b) => b.successRate - a.successRate);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.totalCalls - a.totalCalls);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(t => 
        t.displayName.toLowerCase().includes(q) || 
        t.toolName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [toolMetrics, sortBy, searchQuery]);

  // Category Distribution for Donut Chart
  const categoryPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => {
      counts[l.tool_category] = (counts[l.tool_category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#64748B'
    }));
  }, [logs]);

  // Formatted chart data for Dual-Axis Chart (Top 8 tools to prevent crowding)
  const chartData = useMemo(() => {
    return sortedToolMetrics.slice(0, 10).map(t => ({
      name: t.displayName.length > 16 ? t.displayName.slice(0, 14) + '...' : t.displayName,
      fullName: t.displayName,
      latency: t.avgLatencyMs,
      successRate: t.successRate,
      calls: t.totalCalls,
      efficiency: t.efficiencyScore,
      category: t.category
    }));
  }, [sortedToolMetrics]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--ui-bg)] overflow-y-auto">
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-[var(--ui-border)] bg-[var(--ui-surface)] sticky top-0 z-20 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] shadow-xs">
                <BarChart3 size={18} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-[var(--ui-text)]">
                Prestasi & Kecekapan Agen AI (Agent Performance)
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Radio size={12} className="animate-pulse text-emerald-600" />
                <span>Supabase Realtime: Aktif (Jadual: tasks)</span>
              </span>
            </div>
            <p className="text-xs text-[var(--ui-muted)] mt-1">
              Visualisasi masa nyata purata kependaman (*average latency ms*), kadar kejayaan (*success rate %*), dan penilaian kecekapan setiap alat agen AI untuk membantu pasukan mengenal pasti alatan paling optimum.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateSupabaseTaskInsert}
              disabled={isSimulatingRealtimeInsert}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:brightness-95 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Sisip rekod baru terus ke jadual tasks Supabase untuk menguji kemas kini carta secara langsung"
            >
              <Zap size={13} className={cn(isSimulatingRealtimeInsert && "animate-spin text-[var(--ui-warning-text)]")} />
              <span>{isSimulatingRealtimeInsert ? 'Menyisip...' : 'Sisip Tugas Baru (tasks)'}</span>
            </button>

            <button
              onClick={() => handleRunBenchmark()}
              disabled={isBenchmarking}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] hover:bg-[var(--ui-primary)] text-xs font-semibold transition-all shadow-xs cursor-pointer"
              title="Jalankan ujian penanda aras kependaman langsung"
            >
              <Play size={13} className={cn(isBenchmarking && "animate-spin text-[var(--ui-warning-text)]")} />
              <span>{isBenchmarking ? 'Menguji...' : 'Ujian Penanda Aras (Live)'}</span>
            </button>

            <button
              onClick={loadPerformanceData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-xs font-semibold border border-[var(--ui-border)] transition-all"
              title="Segerak log tugasan terkini daripada Supabase"
            >
              <RefreshCw size={13} className={cn(isRefreshing && "animate-spin")} />
              <span>Segerak Supabase</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {benchmarkFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl bg-[var(--ui-accent)] border border-[var(--ui-border)] text-[var(--ui-accent-ink)] text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-[var(--ui-text)] shrink-0" />
              <span className="font-medium">{benchmarkFeedback}</span>
            </div>
            <button onClick={() => setBenchmarkFeedback(null)} className="text-[var(--ui-text)] font-bold hover:underline">Tutup</button>
          </motion.div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Avg Latency */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
            <p className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} className="text-[var(--ui-accent-text)]" />
              Purata Kependaman (Latency)
            </p>
            <p className="text-xl font-black text-[var(--ui-text)] mt-1">
              {overallMetrics.avgLatencyMs} <span className="text-xs font-semibold text-[var(--ui-muted)]">ms</span>
            </p>
            <p className="text-[10px] text-[var(--ui-success-text)] font-semibold mt-0.5">
              Sub-saat respons pantas ✓
            </p>
          </div>

          {/* Card 2: Success Rate */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              Kadar Kejayaan Global
            </p>
            <p className="text-xl font-black text-emerald-950 mt-1">
              {overallMetrics.overallSuccessRate}%
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">
              Sasaran &gt;95% tercapai
            </p>
          </div>

          {/* Card 3: Most Efficient Tool */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] [&_p]:text-[var(--ui-accent-ink)] [&_svg]:text-[var(--ui-accent-ink)] border border-[var(--ui-border)]">
            <p className="text-[10px] font-bold text-[var(--ui-text)] uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-[var(--ui-text)]" />
              Alat Paling Cekap (Juara)
            </p>
            <p className="text-sm font-black text-[var(--ui-text)] mt-1 truncate" title={overallMetrics.mostEfficientTool}>
              {overallMetrics.mostEfficientTool}
            </p>
            <p className="text-[10px] text-[var(--ui-text)] mt-0.5">
              Skor kecekapan tertinggi
            </p>
          </div>

          {/* Card 4: Total Task Volume */}
          <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
            <p className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider flex items-center gap-1">
              <Database size={12} className="text-[var(--ui-warning-text)]" />
              Jumlah Panggilan Alat
            </p>
            <p className="text-xl font-black text-[var(--ui-text)] mt-1">
              {overallMetrics.totalTasks} <span className="text-xs font-semibold text-[var(--ui-muted)]">panggilan</span>
            </p>
            <p className="text-[10px] text-[var(--ui-muted)] mt-0.5">
              Disimpan di Supabase
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--ui-border)] text-xs">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--ui-muted)] mr-1 flex items-center gap-1">
              <Filter size={12} />
              Kategori:
            </span>
            {['all', 'Logistik & Bas', 'Google Workspace', 'Gedung Plugins', 'Analisis & Laporan'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium transition-all",
                  selectedCategory === cat 
                    ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] shadow-xs" 
                    : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-muted)]"
                )}
              >
                {cat === 'all' ? 'Semua Alat' : cat}
              </button>
            ))}
          </div>

          {/* Timeframe & Sort */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--ui-soft)] p-0.5 rounded-lg text-xs font-medium">
              {[
                { label: '24 Jam', val: 1 },
                { label: '7 Hari', val: 7 },
                { label: '30 Hari', val: 30 }
              ].map(t => (
                <button
                  key={t.val}
                  onClick={() => setTimeRangeDays(t.val)}
                  className={cn(
                    "px-2 py-1 rounded-md transition-all text-[11px]",
                    timeRangeDays === t.val ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-bold shadow-xs" : "text-[var(--ui-muted)] hover:text-[var(--ui-text)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-1.5 rounded-lg bg-[var(--ui-soft)] text-[var(--ui-text)] text-xs font-semibold border-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="efficiency">Susun: Kecekapan Tertinggi</option>
              <option value="latency">Susun: Kependaman Terpantas</option>
              <option value="successRate">Susun: Kadar Kejayaan</option>
              <option value="volume">Susun: Kekerapan Panggilan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts & Visualizations Area */}
      <div className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* CHART SECTION 1: Dual-Axis Recharts Composed Chart (Latency vs Success Rate) */}
        <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--ui-border)] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={18} className="text-[var(--ui-text)]" />
                <h3 className="font-bold text-sm text-[var(--ui-text)]">
                  Perbandingan Kependaman (ms) & Kadar Kejayaan (%) Mengikut Alat Agen
                </h3>
              </div>
              <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                Bar biru/ungu menunjukkan purata masa respons (ms); garisan hijau menunjukkan kadar kejayaan tugasan (%).
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-[var(--ui-muted)]">
                <span className="w-3 h-3 rounded-xs bg-[var(--ui-accent)] inline-block" />
                Purata Latency (ms)
              </span>
              <span className="flex items-center gap-1.5 text-[var(--ui-muted)]">
                <span className="w-3 h-1 bg-emerald-500 inline-block" />
                Kadar Kejayaan (%)
              </span>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ui-border)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: 'var(--ui-muted)' }} 
                  angle={-15} 
                  textAnchor="end"
                  interval={0}
                />
                {/* Left Axis: Latency ms */}
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fontSize: 11, fill: 'var(--ui-muted)' }} 
                  unit="ms" 
                />
                {/* Right Axis: Success % */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[80, 100]} 
                  tick={{ fontSize: 11, fill: '#10B981' }} 
                  unit="%" 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-[var(--ui-surface)] text-[var(--ui-text)] rounded-xl shadow-xl border border-[var(--ui-border)] text-xs space-y-1">
                          <p className="font-bold text-sm text-[var(--ui-text)]">{data.fullName}</p>
                          <p className="text-[var(--ui-muted)]">Kategori: <span className="text-[var(--ui-text)]">{data.category}</span></p>
                          <div className="pt-1 space-y-0.5 text-[11px]">
                            <p className="flex justify-between gap-4">
                              <span className="text-[var(--ui-muted)]">Purata Kependaman:</span>
                              <strong className="text-[var(--ui-text)]">{data.latency} ms</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-[var(--ui-muted)]">Kadar Kejayaan:</span>
                              <strong className="text-[var(--ui-success-text)]">{data.successRate}%</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-[var(--ui-muted)]">Skor Kecekapan:</span>
                              <strong className="text-[var(--ui-warning-text)]">{data.efficiency} / 100</strong>
                            </p>
                            <p className="flex justify-between gap-4">
                              <span className="text-[var(--ui-muted)]">Jumlah Panggilan:</span>
                              <span className="text-[var(--ui-muted)]">{data.calls} kali</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine yAxisId="right" y={95} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Target 95%', fill: '#EF4444', fontSize: 10 }} />
                
                {/* Latency Bars with conditional coloring */}
                <Bar 
                  yAxisId="left" 
                  dataKey="latency" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={38}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.latency < 250 ? '#10B981' : entry.latency < 600 ? 'var(--ui-accent)' : '#F59E0B'} 
                    />
                  ))}
                </Bar>

                {/* Success Rate Line */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: 'var(--ui-surface)' }} 
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART SECTION 2: Grid Split (Area Trend & Category Distribution) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trend Sepanjang Hari (AreaChart - 2 Cols) */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--ui-success-text)]" />
                <h4 className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">
                  Trend Kependaman Respons Sepanjang Hari (Waktu Operasi)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-[var(--ui-muted)]">Data Supabase 24j</span>
            </div>

            <div className="w-full h-56 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ui-accent)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--ui-accent)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ui-border)" />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 11, fill: 'var(--ui-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--ui-muted)' }} unit="ms" />
                  <Tooltip 
                    formatter={(val: any) => [`${val} ms`, 'Purata Latency']}
                    labelFormatter={(label) => `Waktu: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgLatencyMs" 
                    stroke="var(--ui-accent)" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#latencyGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[var(--ui-muted)]">
              Kependaman paling rendah dicatat sekitar waktu luar puncak (00:00 - 04:00), meningkat sedikit semasa waktu puncak kemas kini kargo TBS (09:00 - 14:00).
            </p>
          </div>

          {/* Kategori Tugasan Agen (PieChart - 1 Col) */}
          <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--ui-border)]">
                <Layers size={16} className="text-[var(--ui-accent-text)]" />
                <h4 className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">
                  Pengagihan Panggilan Alat
                </h4>
              </div>

              <div className="w-full h-44 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} tugasan`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Legend list */}
            <div className="space-y-1.5 pt-2 border-t border-[var(--ui-border)] text-xs">
              {categoryPieData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-[var(--ui-muted)] text-[11px]">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <strong className="text-[var(--ui-text)]">{cat.value} ({Math.round((cat.value / logs.length) * 100)}%)</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Efficiency Leaderboard & Performance Table */}
        <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
            <div>
              <h3 className="font-bold text-sm text-[var(--ui-text)]">
                Papan Penarafan Kecekapan Alat Agen AI (Efficiency Matrix)
              </h3>
              <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                Analisis terperinci kependaman minimum, maksimum, P95, kadar kegagalan, dan cadangan pengoptimuman bagi setiap fungsi alat.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
              <input
                type="text"
                placeholder="Cari alat atau fungsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ui-accent)]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--ui-border)] text-[var(--ui-muted)] uppercase text-[10px] font-bold">
                  <th className="pb-3 pr-2">Kedudukan & Alat</th>
                  <th className="pb-3 px-3">Kategori</th>
                  <th className="pb-3 px-3">Jumlah Panggilan</th>
                  <th className="pb-3 px-3">Purata Latency</th>
                  <th className="pb-3 px-3">Kependaman P95</th>
                  <th className="pb-3 px-3">Kadar Kejayaan</th>
                  <th className="pb-3 px-3">Skor Kecekapan</th>
                  <th className="pb-3 pl-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ui-border)]">
                {sortedToolMetrics.map((t, idx) => {
                  const isTop = idx === 0;

                  return (
                    <tr 
                      key={t.toolName}
                      className={cn(
                        "[@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 transition-colors",
                        isTop && "bg-[var(--ui-soft)] border-l-2 border-[var(--ui-accent)]"
                      )}
                    >
                      {/* Name & Rank */}
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px]",
                            idx === 0 ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] shadow-xs" :
                            idx === 1 ? "bg-[var(--ui-soft)] text-[var(--ui-text)]" :
                            idx === 2 ? "bg-amber-700/20 text-[var(--ui-warning-text)]" :
                            "bg-[var(--ui-soft)] text-[var(--ui-muted)]"
                          )}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-[var(--ui-text)] flex items-center gap-1.5">
                              <span>{t.displayName}</span>
                              {isTop && (
                                <span className="px-1.5 py-0.2 rounded bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] text-[9px] font-bold">
                                  Paling Cekap
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-[var(--ui-muted)]">{t.toolName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--ui-soft)] text-[var(--ui-text)]">
                          {t.category}
                        </span>
                      </td>

                      {/* Total Calls */}
                      <td className="py-3.5 px-3 font-semibold text-[var(--ui-text)]">
                        {t.totalCalls} kali
                      </td>

                      {/* Latency Avg */}
                      <td className="py-3.5 px-3">
                        <span className={cn(
                          "font-mono font-bold text-xs",
                          t.avgLatencyMs < 250 ? "text-[var(--ui-success-text)]" :
                          t.avgLatencyMs < 600 ? "text-[var(--ui-text)]" : "text-[var(--ui-warning-text)]"
                        )}>
                          {t.avgLatencyMs} ms
                        </span>
                        <div className="text-[10px] text-[var(--ui-muted)]">Min: {t.minLatencyMs}ms · Max: {t.maxLatencyMs}ms</div>
                      </td>

                      {/* P95 Latency */}
                      <td className="py-3.5 px-3 font-mono text-[var(--ui-muted)]">
                        {t.p95LatencyMs} ms
                      </td>

                      {/* Success Rate */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-bold text-xs",
                            t.successRate >= 98 ? "text-[var(--ui-success-text)]" :
                            t.successRate >= 92 ? "text-[var(--ui-warning-text)]" : "text-[var(--ui-danger-text)]"
                          )}>
                            {t.successRate}%
                          </span>
                        </div>
                        <div className="w-16 h-1.5 bg-[var(--ui-soft)] rounded-full overflow-hidden mt-1">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              t.successRate >= 95 ? "bg-emerald-500" : "bg-amber-500"
                            )} 
                            style={{ width: `${t.successRate}%` }} 
                          />
                        </div>
                      </td>

                      {/* Efficiency Rating Score */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          <span className="font-black text-sm text-[var(--ui-text)]">{t.efficiencyScore}</span>
                          <span className="text-[10px] text-[var(--ui-muted)]">/ 100</span>
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider block",
                          t.efficiencyRating === 'EXCELLENT' ? "text-[var(--ui-success-text)]" :
                          t.efficiencyRating === 'GOOD' ? "text-[var(--ui-accent-text)]" : "text-[var(--ui-warning-text)]"
                        )}>
                          {t.efficiencyRating === 'EXCELLENT' ? 'Cemerlang' : t.efficiencyRating === 'GOOD' ? 'Baik' : 'Optimasi'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pl-3 text-right">
                        <button
                          onClick={() => handleRunBenchmark(t.toolName, t.category)}
                          className="px-2.5 py-1 rounded-lg bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-semibold text-[11px] transition-all"
                        >
                          Uji Alat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4: Live Telemetry Activity Feed from Supabase */}
        <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[var(--ui-text)]" />
              <h3 className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">
                Suapan Aktiviti Tugasan Terkini (Supabase Real-Time Logs)
              </h3>
            </div>
            <span className="text-[11px] text-[var(--ui-muted)] font-mono">Status: Langsung Terkini</span>
          </div>

          <div className="divide-y divide-[var(--ui-border)]">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5",
                    log.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {log.status === 'SUCCESS' ? <Check size={14} /> : <AlertTriangle size={14} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--ui-text)]">{log.tool_name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--ui-soft)] text-[var(--ui-muted)] font-mono text-[10px]">
                        {log.task_id}
                      </span>
                      <span className="text-[10px] text-[var(--ui-muted)]">({log.tool_category})</span>
                    </div>
                    <p className="text-[11px] text-[var(--ui-muted)] mt-0.5 line-clamp-1 italic">
                      &quot;{log.user_query}&quot;
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-[11px]">
                  <span className={cn(
                    "px-2 py-0.5 rounded font-bold",
                    log.latency_ms < 300 ? "bg-emerald-50 text-emerald-800" :
                    log.latency_ms < 700 ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]" : "bg-amber-50 text-amber-800"
                  )}>
                    {log.latency_ms} ms
                  </span>
                  <span className="text-[var(--ui-muted)]">
                    {new Date(log.timestamp).toLocaleTimeString('ms-MY', { hour12: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
