/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';

export interface AgentTaskLog {
  id: string;
  task_id: string;
  tool_name: string;
  tool_category: 'Logistik & Bas' | 'Google Workspace' | 'Gedung Plugins' | 'Analisis & Laporan';
  latency_ms: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  tokens_used: number;
  timestamp: string;
  user_query: string;
  model: string;
  error_message?: string;
}

export interface ToolPerformanceMetric {
  toolName: string;
  displayName: string;
  category: 'Logistik & Bas' | 'Google Workspace' | 'Gedung Plugins' | 'Analisis & Laporan';
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  successRate: number; // 0 - 100%
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p95LatencyMs: number;
  avgTokens: number;
  efficiencyScore: number; // 0 - 100 composite score
  efficiencyRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_OPTIMIZATION';
}

export interface TimeSeriesPerformancePoint {
  timeLabel: string;
  avgLatencyMs: number;
  successRate: number;
  callCount: number;
  errorCount: number;
}

// Baseline mock/seed dataset of 40+ realistic tool invocations logged in Supabase
const INITIAL_PERFORMANCE_SEED: AgentTaskLog[] = [
  // 1. Logistics & Bus Tools (High frequency, optimized latency)
  {
    id: 'TLOG-001',
    task_id: 'TSK-1092',
    tool_name: 'bus_freight_dispatch_create',
    tool_category: 'Logistik & Bas',
    latency_ms: 145,
    status: 'SUCCESS',
    tokens_used: 320,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    user_query: 'Daftar serahan kargo bas Sani Express VDF 8821 di TBS untuk Kak Mas',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-002',
    task_id: 'TSK-1091',
    tool_name: 'redbus_bus_freight_schedule',
    tool_category: 'Logistik & Bas',
    latency_ms: 210,
    status: 'SUCCESS',
    tokens_used: 410,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    user_query: 'Semak jadual bas ekspres TBS ke Kuala Terengganu petang ini',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-003',
    task_id: 'TSK-1089',
    tool_name: 'bus_freight_update_arrival_notice',
    tool_category: 'Logistik & Bas',
    latency_ms: 128,
    status: 'SUCCESS',
    tokens_used: 195,
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    user_query: 'Aktifkan SOP 1 jam untuk pemandu Sani Express hubungi ejen',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-004',
    task_id: 'TSK-1085',
    tool_name: 'redbus_bus_freight_schedule',
    tool_category: 'Logistik & Bas',
    latency_ms: 225,
    status: 'SUCCESS',
    tokens_used: 430,
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    user_query: 'Jadual bas ekspres Kota Bharu Lembah Sireh',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-005',
    task_id: 'TSK-1082',
    tool_name: 'bus_freight_dispatch_create',
    tool_category: 'Logistik & Bas',
    latency_ms: 152,
    status: 'SUCCESS',
    tokens_used: 310,
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    user_query: 'Daftar serahan Perdana Express DDA 5439',
    model: 'gemini-2.5-flash'
  },

  // 2. Google Workspace Integrations
  {
    id: 'TLOG-006',
    task_id: 'TSK-1078',
    tool_name: 'create_google_sheet',
    tool_category: 'Google Workspace',
    latency_ms: 480,
    status: 'SUCCESS',
    tokens_used: 680,
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    user_query: 'Bina hamparan Google Sheet inventori botol kuah colek terkini',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-007',
    task_id: 'TSK-1074',
    tool_name: 'send_gmail_email',
    tool_category: 'Google Workspace',
    latency_ms: 360,
    status: 'SUCCESS',
    tokens_used: 450,
    timestamp: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    user_query: 'Hantar emel notis penghantaran stok kepada ejen Terengganu',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-008',
    task_id: 'TSK-1070',
    tool_name: 'schedule_calendar_event',
    tool_category: 'Google Workspace',
    latency_ms: 290,
    status: 'SUCCESS',
    tokens_used: 380,
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    user_query: 'Jadualkan temujanji penerimaan stok di TBS esok 9:00 AM',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-009',
    task_id: 'TSK-1065',
    tool_name: 'create_google_doc',
    tool_category: 'Google Workspace',
    latency_ms: 540,
    status: 'SUCCESS',
    tokens_used: 820,
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    user_query: 'Jana dokumen SOP rasmi kargo bas ekspres 2026',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-010',
    task_id: 'TSK-1060',
    tool_name: 'create_google_task',
    tool_category: 'Google Workspace',
    latency_ms: 210,
    status: 'SUCCESS',
    tokens_used: 240,
    timestamp: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    user_query: 'Tambah tugasan: Semak resit DuitNow pemandu bas petang ini',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-011',
    task_id: 'TSK-1055',
    tool_name: 'google_drive_search_files',
    tool_category: 'Google Workspace',
    latency_ms: 620,
    status: 'SUCCESS',
    tokens_used: 510,
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    user_query: 'Cari fail PO invois pembekal cili dan kicap dalam Drive',
    model: 'gemini-2.5-flash'
  },

  // 3. Gedung Plugins (Ecosystem & 3rd party APIs)
  {
    id: 'TLOG-012',
    task_id: 'TSK-1050',
    tool_name: 'supabase_query_db',
    tool_category: 'Gedung Plugins',
    latency_ms: 185,
    status: 'SUCCESS',
    tokens_used: 340,
    timestamp: new Date(Date.now() - 270 * 60 * 1000).toISOString(),
    user_query: 'Query jadual orders Supabase untuk pesanan pantai timur',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-013',
    task_id: 'TSK-1045',
    tool_name: 'canva_generate_design',
    tool_category: 'Gedung Plugins',
    latency_ms: 780,
    status: 'SUCCESS',
    tokens_used: 890,
    timestamp: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    user_query: 'Jana poster promosi kuah colek pedas untuk ejen TikTok',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-014',
    task_id: 'TSK-1040',
    tool_name: 'github_manage_repo',
    tool_category: 'Gedung Plugins',
    latency_ms: 410,
    status: 'SUCCESS',
    tokens_used: 520,
    timestamp: new Date(Date.now() - 330 * 60 * 1000).toISOString(),
    user_query: 'Semak PR dan isu terkini di repositori GitHub',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-015',
    task_id: 'TSK-1035',
    tool_name: 'vercel_deploy_status',
    tool_category: 'Gedung Plugins',
    latency_ms: 320,
    status: 'SUCCESS',
    tokens_used: 400,
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    user_query: 'Semak status binaan deploy di Vercel Production',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-016',
    task_id: 'TSK-1030',
    tool_name: 'skyscanner_search_flights',
    tool_category: 'Gedung Plugins',
    latency_ms: 890,
    status: 'SUCCESS',
    tokens_used: 720,
    timestamp: new Date(Date.now() - 400 * 60 * 1000).toISOString(),
    user_query: 'Cari tiket penerbangan kargo KLIA ke Kota Kinabalu',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-017',
    task_id: 'TSK-1025',
    tool_name: 'mixpanel_track_analytics',
    tool_category: 'Gedung Plugins',
    latency_ms: 160,
    status: 'SUCCESS',
    tokens_used: 280,
    timestamp: new Date(Date.now() - 430 * 60 * 1000).toISOString(),
    user_query: 'Jejak analitik klik ejen dan kadar penukaran jualan',
    model: 'gemini-2.5-flash'
  },

  // 4. Analytics & Reports
  {
    id: 'TLOG-018',
    task_id: 'TSK-1020',
    tool_name: 'generate_yearly_report',
    tool_category: 'Analisis & Laporan',
    latency_ms: 1250,
    status: 'SUCCESS',
    tokens_used: 1640,
    timestamp: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    user_query: 'Jana laporan komprehensif operasi dan jualan tahunan 2026',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-019',
    task_id: 'TSK-1015',
    tool_name: 'create_operations_dashboard',
    tool_category: 'Analisis & Laporan',
    latency_ms: 980,
    status: 'SUCCESS',
    tokens_used: 1120,
    timestamp: new Date(Date.now() - 520 * 60 * 1000).toISOString(),
    user_query: 'Bina papan pemuka operasi harian penghantaran ejen',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-020',
    task_id: 'TSK-1010',
    tool_name: 'jev_classify_issue',
    tool_category: 'Analisis & Laporan',
    latency_ms: 310,
    status: 'SUCCESS',
    tokens_used: 420,
    timestamp: new Date(Date.now() - 560 * 60 * 1000).toISOString(),
    user_query: 'Klasifikasi maklum balas pelanggan botol bocor atau pecah',
    model: 'gemini-2.5-flash'
  },

  // 5. Additional Historical Logs for rich distribution & error rate
  {
    id: 'TLOG-021',
    task_id: 'TSK-1008',
    tool_name: 'skyscanner_search_flights',
    tool_category: 'Gedung Plugins',
    latency_ms: 1420,
    status: 'ERROR',
    tokens_used: 510,
    timestamp: new Date(Date.now() - 600 * 60 * 1000).toISOString(),
    user_query: 'Cari penerbangan antarabangsa ke London',
    model: 'gemini-2.5-flash',
    error_message: 'API rate limit exceeded on public mock sandbox'
  },
  {
    id: 'TLOG-022',
    task_id: 'TSK-1005',
    tool_name: 'adobe_process_asset',
    tool_category: 'Gedung Plugins',
    latency_ms: 1180,
    status: 'SUCCESS',
    tokens_used: 940,
    timestamp: new Date(Date.now() - 650 * 60 * 1000).toISOString(),
    user_query: 'Buang latar belakang gambar botol kuah colek resolusi tinggi',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-023',
    task_id: 'TSK-1002',
    tool_name: 'google_drive_search_files',
    tool_category: 'Google Workspace',
    latency_ms: 710,
    status: 'SUCCESS',
    tokens_used: 480,
    timestamp: new Date(Date.now() - 700 * 60 * 1000).toISOString(),
    user_query: 'Cari resit DuitNow kargo bas semalam',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-024',
    task_id: 'TSK-0998',
    tool_name: 'bus_freight_dispatch_create',
    tool_category: 'Logistik & Bas',
    latency_ms: 139,
    status: 'SUCCESS',
    tokens_used: 295,
    timestamp: new Date(Date.now() - 750 * 60 * 1000).toISOString(),
    user_query: 'Daftar serahan KKKL Express JRY 4210 ke Larkin',
    model: 'gemini-2.5-flash'
  },
  {
    id: 'TLOG-025',
    task_id: 'TSK-0995',
    tool_name: 'redbus_bus_freight_schedule',
    tool_category: 'Logistik & Bas',
    latency_ms: 198,
    status: 'SUCCESS',
    tokens_used: 390,
    timestamp: new Date(Date.now() - 800 * 60 * 1000).toISOString(),
    user_query: 'Semak jadual bas Penang Sentral Butterworth',
    model: 'gemini-2.5-flash'
  }
];

class SupabaseAgentPerformanceService {
  private logs: AgentTaskLog[] = [];
  private listeners: ((logs: AgentTaskLog[]) => void)[] = [];
  private isConnectedToSupabase: boolean = false;
  private lastPingMs: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('abangcolek_agent_task_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      } else {
        this.logs = [...INITIAL_PERFORMANCE_SEED];
        this.saveToStorage();
      }
    } catch {
      this.logs = [...INITIAL_PERFORMANCE_SEED];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('abangcolek_agent_task_logs', JSON.stringify(this.logs));
    } catch {
      // ignore
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.logs]));
  }

  public subscribe(cb: (logs: AgentTaskLog[]) => void): () => void {
    this.listeners.push(cb);
    cb([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public getLogs(): AgentTaskLog[] {
    return [...this.logs];
  }

  /**
   * Normalizes raw payload from Supabase `tasks` table into standard AgentTaskLog
   */
  public normalizeTaskPayload(d: any): AgentTaskLog {
    const rawTool = d.tool_name || d.tool || d.action || (d.title ? d.title.toLowerCase().replace(/\s+/g, '_') : 'redbus_bus_freight_schedule');
    const category: AgentTaskLog['tool_category'] = 
      d.tool_category || 
      (rawTool.includes('bus') ? 'Logistik & Bas' :
       rawTool.startsWith('create_google') || rawTool.startsWith('send_') || rawTool.startsWith('schedule_') || rawTool.includes('drive') || rawTool.includes('sheet') || rawTool.includes('mail') ? 'Google Workspace' :
       rawTool.includes('yearly') || rawTool.includes('dashboard') || rawTool.includes('report') || rawTool.includes('jev') ? 'Analisis & Laporan' : 'Gedung Plugins');

    const latencyMs = Number(d.latency_ms || d.duration_ms || d.latency || Math.floor(140 + Math.random() * 220));
    const statusVal = d.status === 'ERROR' || d.status === 'failed' ? 'ERROR' : 
                      d.status === 'TIMEOUT' ? 'TIMEOUT' : 'SUCCESS';

    return {
      id: d.id ? String(d.id) : `TLOG-${Date.now().toString().slice(-6)}`,
      task_id: d.task_id || d.taskId || `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
      tool_name: rawTool,
      tool_category: category,
      latency_ms: latencyMs,
      status: statusVal,
      tokens_used: Number(d.tokens_used || d.tokens || 350),
      timestamp: d.created_at || d.timestamp || new Date().toISOString(),
      user_query: d.user_query || d.description || d.title || `Tugasan agen: ${rawTool}`,
      model: d.model || 'gemini-3.8-flash',
      error_message: d.error_message || d.error
    };
  }

  /**
   * Subscribe to real-time `INSERT` events on Supabase `tasks` table
   */
  public subscribeToRealtimeTasks(
    onInsert: (newLog: AgentTaskLog) => void,
    onStatusChange?: (status: string) => void
  ): () => void {
    const channel = supabase
      .channel('tasks-realtime-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.new) {
            const newLog = this.normalizeTaskPayload(payload.new);
            this.logs.unshift(newLog);
            this.saveToStorage();
            onInsert(newLog);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_task_logs' },
        (payload) => {
          if (payload.new) {
            const newLog = this.normalizeTaskPayload(payload.new);
            // Avoid duplicate if both fired
            if (!this.logs.some(l => l.id === newLog.id)) {
              this.logs.unshift(newLog);
              this.saveToStorage();
              onInsert(newLog);
            }
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Fetch task logs from Supabase `agent_task_logs` table
   */
  public async fetchTaskLogs(): Promise<{
    data: AgentTaskLog[];
    source: 'supabase_live' | 'supabase_seed_cache';
    latencyMs: number;
    error?: string;
  }> {
    const startTime = Date.now();
    try {
      // First attempt querying `tasks` table
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData && tasksData.length > 0) {
        this.isConnectedToSupabase = true;
        const normalized = tasksData.map(d => this.normalizeTaskPayload(d));
        this.logs = normalized;
        this.saveToStorage();
        return {
          data: this.logs,
          source: 'supabase_live',
          latencyMs: Date.now() - startTime
        };
      }

      // Fallback query `agent_task_logs` table
      const { data, error } = await supabase
        .from('agent_task_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      const latencyMs = Date.now() - startTime;
      this.lastPingMs = latencyMs;

      if (!error && data && data.length > 0) {
        this.isConnectedToSupabase = true;
        this.logs = data.map(d => this.normalizeTaskPayload(d));
        this.saveToStorage();
        return {
          data: this.logs,
          source: 'supabase_live',
          latencyMs
        };
      }

      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        this.isConnectedToSupabase = true;
      }

      return {
        data: [...this.logs],
        source: 'supabase_seed_cache',
        latencyMs,
        error: error?.message
      };
    } catch (err: any) {
      this.lastPingMs = Date.now() - startTime;
      return {
        data: [...this.logs],
        source: 'supabase_seed_cache',
        latencyMs: this.lastPingMs,
        error: err.message
      };
    }
  }

  /**
   * Record a new agent task execution log into Supabase `tasks` and `agent_task_logs`
   */
  public async recordTaskExecution(log: Omit<AgentTaskLog, 'id' | 'timestamp'>): Promise<AgentTaskLog> {
    const timestamp = new Date().toISOString();
    const newRecord: AgentTaskLog = {
      ...log,
      id: `TLOG-${Date.now().toString().slice(-6)}`,
      timestamp
    };

    // Insert into Supabase `tasks` table and `agent_task_logs` table
    try {
      const taskRecord = {
        id: newRecord.id,
        task_id: newRecord.task_id,
        tool_name: newRecord.tool_name,
        tool_category: newRecord.tool_category,
        latency_ms: newRecord.latency_ms,
        status: newRecord.status,
        tokens_used: newRecord.tokens_used,
        user_query: newRecord.user_query,
        model: newRecord.model,
        created_at: timestamp
      };

      await Promise.allSettled([
        supabase.from('tasks').insert([taskRecord]),
        supabase.from('agent_task_logs').upsert([newRecord])
      ]);
    } catch {
      // Local fallback handled smoothly
    }

    this.logs.unshift(newRecord);
    this.saveToStorage();
    return newRecord;
  }

  /**
   * Calculate aggregated performance metrics per tool
   */
  public calculateMetrics(filterCategory?: string, timeRangeDays?: number): {
    toolMetrics: ToolPerformanceMetric[];
    overallMetrics: {
      totalTasks: number;
      avgLatencyMs: number;
      overallSuccessRate: number;
      mostEfficientTool: string;
      fastestTool: string;
      slowestTool: string;
      totalTokens: number;
    };
    timeSeries: TimeSeriesPerformancePoint[];
  } {
    let filtered = [...this.logs];

    // Filter by time range
    if (timeRangeDays && timeRangeDays > 0) {
      const cutoff = Date.now() - timeRangeDays * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(l => new Date(l.timestamp).getTime() >= cutoff);
    }

    // Filter by category
    if (filterCategory && filterCategory !== 'all') {
      filtered = filtered.filter(l => l.tool_category === filterCategory);
    }

    // Group logs by tool name
    const toolGroups: Record<string, AgentTaskLog[]> = {};
    filtered.forEach(log => {
      if (!toolGroups[log.tool_name]) {
        toolGroups[log.tool_name] = [];
      }
      toolGroups[log.tool_name].push(log);
    });

    const toolMetrics: ToolPerformanceMetric[] = Object.entries(toolGroups).map(([name, logs]) => {
      const totalCalls = logs.length;
      const successCalls = logs.filter(l => l.status === 'SUCCESS').length;
      const errorCalls = totalCalls - successCalls;
      const successRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0;

      const latencies = logs.map(l => l.latency_ms).sort((a, b) => a - b);
      const totalLatency = latencies.reduce((acc, curr) => acc + curr, 0);
      const avgLatencyMs = Math.round(totalLatency / totalCalls);
      const minLatencyMs = latencies[0] || 0;
      const maxLatencyMs = latencies[latencies.length - 1] || 0;

      const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
      const p95LatencyMs = latencies[p95Index] || avgLatencyMs;

      const avgTokens = Math.round(logs.reduce((acc, l) => acc + l.tokens_used, 0) / totalCalls);
      const category = logs[0].tool_category;

      // Composite efficiency score: (SuccessRate * 0.6) + ((1 - min(Latency, 1500)/1500) * 40)
      const latencyFactor = Math.max(0, 1 - avgLatencyMs / 1500);
      const efficiencyScore = Math.round(successRate * 0.6 + latencyFactor * 40);

      const efficiencyRating = efficiencyScore >= 85 ? 'EXCELLENT' : efficiencyScore >= 70 ? 'GOOD' : 'NEEDS_OPTIMIZATION';

      const displayName = name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      return {
        toolName: name,
        displayName,
        category,
        totalCalls,
        successCalls,
        errorCalls,
        successRate: Number(successRate.toFixed(1)),
        avgLatencyMs,
        minLatencyMs,
        maxLatencyMs,
        p95LatencyMs,
        avgTokens,
        efficiencyScore,
        efficiencyRating
      };
    });

    // Sort by efficiency score descending
    toolMetrics.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    // Calculate overall totals
    const totalTasks = filtered.length;
    const overallSuccessCount = filtered.filter(l => l.status === 'SUCCESS').length;
    const overallSuccessRate = totalTasks > 0 ? Number(((overallSuccessCount / totalTasks) * 100).toFixed(1)) : 100;
    const avgLatencyMs = totalTasks > 0 ? Math.round(filtered.reduce((acc, l) => acc + l.latency_ms, 0) / totalTasks) : 0;
    const totalTokens = filtered.reduce((acc, l) => acc + l.tokens_used, 0);

    const sortedByLatency = [...toolMetrics].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs);
    const fastestTool = sortedByLatency[0]?.displayName || 'Tiada';
    const slowestTool = sortedByLatency[sortedByLatency.length - 1]?.displayName || 'Tiada';
    const mostEfficientTool = toolMetrics[0]?.displayName || 'Tiada';

    // Build time series buckets (e.g. 6 time buckets)
    const timeSeries = this.generateTimeSeriesBuckets(filtered);

    return {
      toolMetrics,
      overallMetrics: {
        totalTasks,
        avgLatencyMs,
        overallSuccessRate,
        mostEfficientTool,
        fastestTool,
        slowestTool,
        totalTokens
      },
      timeSeries
    };
  }

  private generateTimeSeriesBuckets(logs: AgentTaskLog[]): TimeSeriesPerformancePoint[] {
    const buckets: Record<string, { latencies: number[]; successes: number; totals: number }> = {
      '00:00': { latencies: [], successes: 0, totals: 0 },
      '04:00': { latencies: [], successes: 0, totals: 0 },
      '08:00': { latencies: [], successes: 0, totals: 0 },
      '12:00': { latencies: [], successes: 0, totals: 0 },
      '16:00': { latencies: [], successes: 0, totals: 0 },
      '20:00': { latencies: [], successes: 0, totals: 0 },
    };

    logs.forEach(l => {
      const d = new Date(l.timestamp);
      const hour = d.getHours();
      let bucketKey = '00:00';
      if (hour >= 20) bucketKey = '20:00';
      else if (hour >= 16) bucketKey = '16:00';
      else if (hour >= 12) bucketKey = '12:00';
      else if (hour >= 8) bucketKey = '08:00';
      else if (hour >= 4) bucketKey = '04:00';

      buckets[bucketKey].latencies.push(l.latency_ms);
      buckets[bucketKey].totals++;
      if (l.status === 'SUCCESS') buckets[bucketKey].successes++;
    });

    return Object.entries(buckets).map(([timeLabel, data]) => {
      const count = data.totals;
      const avgLatencyMs = count > 0 ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / count) : 320;
      const successRate = count > 0 ? Math.round((data.successes / count) * 100) : 100;
      const errorCount = count - data.successes;

      return {
        timeLabel,
        avgLatencyMs,
        successRate,
        callCount: count,
        errorCount
      };
    });
  }

  /**
   * Simulate a live agent tool benchmark invocation (stress-test)
   */
  public async simulateToolBenchmark(toolName: string, category: AgentTaskLog['tool_category']): Promise<AgentTaskLog> {
    const randomLatency = toolName.includes('bus') ? Math.floor(120 + Math.random() * 80) :
                          toolName.includes('sheet') || toolName.includes('doc') ? Math.floor(400 + Math.random() * 250) :
                          toolName.includes('skyscanner') || toolName.includes('yearly') ? Math.floor(900 + Math.random() * 450) :
                          Math.floor(220 + Math.random() * 180);

    const isSuccess = Math.random() > 0.04; // 96% success

    return this.recordTaskExecution({
      task_id: `TSK-${Math.floor(1100 + Math.random() * 900)}`,
      tool_name: toolName,
      tool_category: category,
      latency_ms: randomLatency,
      status: isSuccess ? 'SUCCESS' : 'ERROR',
      tokens_used: Math.floor(250 + Math.random() * 500),
      user_query: `Simulasi penanda aras prestasi agen untuk alat ${toolName}`,
      model: 'gemini-2.5-flash',
      error_message: isSuccess ? undefined : 'Transient gateway timeout in benchmark simulation'
    });
  }
}

export const supabaseAgentPerformance = new SupabaseAgentPerformanceService();
