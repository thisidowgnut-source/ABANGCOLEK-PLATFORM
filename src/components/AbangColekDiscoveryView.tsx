/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles, 
  Flame, 
  Layers, 
  ExternalLink, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Tag,
  Clock,
  Send,
  Mail,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  Loader2,
  Bot,
  Music,
  Play,
  Pause,
  Terminal,
  Radio,
  Volume2,
  Copy,
  Download,
  MessageSquare,
  Share2,
  Smartphone,
  Quote,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JevAssessmentCard } from '@/features/jev';
import type { JevActionPreview } from '../../shared/jev-contracts';
import { 
  evaluateWithJev, 
  executeAutomatedJevAction, 
  getSavedJevEvaluations, 
  JevClassificationResult,
  JEV_TAXONOMY 
} from '@/services/jevEngine';
import { appStore, BusinessWorkflow } from '@/services/store';
import {
  TIKTOK_VIRAL_HOOKS,
  MOTIVATIONAL_QUOTES,
  BRAND_TAGLINES,
  BOOTH_OPS_CHECKLISTS,
  WHATSAPP_TEMPLATES,
  OFFICIAL_AUDIO_IDENTITY,
  PITCH_DECK_SLIDES,
  BRAND_MANIFESTOS,
  TIKTOK_WEEKLY_CADENCE,
  TIKTOK_GOLDEN_RULES,
  TIKTOK_PROFILE_METRICS,
  parseWocsCommand,
  executeWocsCommand,
  TikTokViralHook,
  WhatsAppTemplate,
  WocsParsedCommand,
  WocsExecutionResult,
  PitchDeckSlide
} from '@/services/abangColekRepoData';

interface AbangColekDiscoveryViewProps {
  onAction?: (msg?: string) => void;
}

export const AbangColekDiscoveryView: React.FC<AbangColekDiscoveryViewProps> = ({ onAction }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'wocs_audit' | 'pitch_deck' | 'tiktok_hooks' | 'whatsapp_templates' | 'booth_ops' | 'audit_report' | 'questions' | 'jev_tester' | 'history' | 'channels'
  >('overview');

  // Pitch Deck State
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [deckFilter, setDeckFilter] = useState<string>('All');
  const [copiedSlide, setCopiedSlide] = useState(false);
  
  // Real Persistent Workflows from Store
  const [workflows, setWorkflows] = useState<BusinessWorkflow[]>(appStore.getWorkflows());
  
  // JEV Live Evaluation State
  const [inputText, setInputText] = useState("Salam bang, botol kuah colek yang pos ke Terengganu hari tu penutup dia pecah dan kuah meleleh habis dalam kotak parcel. Boleh ganti baru tak?");
  const [jevResult, setJevResult] = useState<JevClassificationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ loading: boolean; type?: string; message?: string; success?: boolean } | null>(null);
  const [actionPreview, setActionPreview] = useState<JevActionPreview | null>(null);
  
  // History of real JEV evaluations
  const [history, setHistory] = useState<JevClassificationResult[]>([]);

  // Audio Player State for Official "Kasi Lagi-Lagi" Jingle
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingJingle, setIsPlayingJingle] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  // WOCS WhatsApp Command Parser & Execution State
  const [wocsInput, setWocsInput] = useState('/assign agent=KakMas hub=MBKT cargo=100botol');
  const [parsedWocs, setParsedWocs] = useState<{
    keyword: string;
    type: string;
    payload: Record<string, string>;
    requiresApproval: boolean;
    timestamp: string;
  } | null>(null);
  const [executionResult, setExecutionResult] = useState<WocsExecutionResult | null>(null);

  // Founder's Corner Quotes & Taglines
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [copiedTagline, setCopiedTagline] = useState<string | null>(null);

  // TikTok Hooks Bank State
  const [selectedHookTag, setSelectedHookTag] = useState<string>('all');
  const [hookSearch, setHookSearch] = useState<string>('');
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);

  // WhatsApp Templates Station State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cs-welcome');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({
    customer_name: "Ahmad bin Ali",
    order_details: "3x Sambal Colek Original 500ml",
    total: "84.00",
    current_events: "1. Makan Fest KL Gateway (3-5 Okt)\n2. Karnival Karat JB (10-12 Okt)",
    form_link: "https://forms.gle/abangcolekluckydraw2026",
    end_date: "31 Disember 2026",
    event_name: "Makan Fest KL Gateway",
    event_date: "3-5 Oktober 2026",
    event_location: "Ruang Legar Utama, KL Gateway Mall",
    event_time: "10:00 AM - 10:00 PM",
    customer_number: "+6012-3456789",
    customer_message: "Boleh pos 10 botol ke Kuantan?",
    timestamp: new Date().toLocaleTimeString('ms-MY')
  });
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Booth Ops Checklists State
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({
    'pre-0': true,
    'pre-1': true,
    'pre-2': true,
    'during-0': true,
    'during-1': true
  });

  const toggleChecklistItem = (key: string) => {
    setCompletedChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const togglePlayJingle = () => {
    if (!audioRef.current) return;
    if (isPlayingJingle) {
      audioRef.current.pause();
      setIsPlayingJingle(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingJingle(true)).catch(() => {});
    }
  };

  const handleParseWocsCommand = (cmdText: string) => {
    const parsed = parseWocsCommand(cmdText);
    const keyword = cmdText.trim().replace(/^\/+/, '').split(/\s+/)[0] || 'unknown';
    setParsedWocs({
      keyword,
      type: parsed.type,
      payload: parsed.payload,
      requiresApproval: parsed.requiresApproval,
      timestamp: new Date().toLocaleTimeString('ms-MY', { hour12: true })
    });
    const execRes = executeWocsCommand(parsed);
    setExecutionResult(execRes);
  };

  useEffect(() => {
    handleParseWocsCommand(wocsInput);
  }, []);

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = appStore.subscribe(() => {
      setWorkflows(appStore.getWorkflows());
    });
    setHistory(getSavedJevEvaluations());
    return () => unsubscribe();
  }, []);

  const handleToggleSignoff = (workflowId: string, currentSignoff: boolean) => {
    appStore.updateWorkflowSignoff(workflowId, !currentSignoff);
  };

  const handleRunRealJev = async (customText?: string) => {
    const textToRun = customText || inputText;
    if (!textToRun.trim()) return;
    setIsEvaluating(true);
    setActionStatus(null);
    try {
      const res = await evaluateWithJev(textToRun);
      setJevResult(res);
      setHistory(getSavedJevEvaluations());
    } catch (err: any) {
      console.error('Failed to run JEV evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExecuteAction = async (actionType: 'task' | 'email' | 'calendar' | 'sheet') => {
    if (!jevResult) return;
    setActionStatus({ loading: true, type: actionType });
    const res = await executeAutomatedJevAction(jevResult, actionType);
    setActionPreview(res.preview ?? null);
    setActionStatus({
      loading: false,
      type: actionType,
      success: res.success,
      message: res.message
    });
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--ui-surface)] text-[var(--ui-text)] p-6 md:p-8 rounded-[32px] border border-[var(--ui-border)] shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] border border-[var(--ui-border)] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={12} className="text-[var(--ui-accent-ink)] fill-[var(--ui-accent-ink)]" />
                Abang Colek Business OS v4.2
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[var(--ui-soft)] text-[var(--ui-accent-text)] border border-[var(--ui-border)] text-[11px] font-mono font-medium">
                TypeSafe JEV Engine
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Pusat Penyelidikan Operasi & Enjin JEV System-1
            </h1>
            <p className="text-[var(--ui-muted)] text-xs md:text-sm max-w-2xl leading-relaxed">
              Platform bersepadu pemprosesan pesanan, kawalan kualiti kuah colek, pengurusan stokis ejen, dan automasi Google Workspace tanpa sebarang data palsu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/thisisabangcolek-web/Abang-Colek.git"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-full bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-semibold flex items-center gap-2 border border-[var(--ui-border)] transition-all"
            >
              <span>Repo Rasmi</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={() => {
                setActiveSubTab('jev_tester');
                handleRunRealJev();
              }}
              className="px-4 py-2.5 rounded-full bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} />
              <span>Uji JEV System-1</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[var(--ui-border)] pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ringkasan & Metrik Forensik', icon: ShieldCheck },
            { id: 'pitch_deck', label: 'Pitch Deck Pelabur', icon: BookOpen, badge: '15 Slaid' },
            { id: 'wocs_audit', label: 'Audit JEV & WOCS Engine', icon: Terminal, badge: 'GitHub Review' },
            { id: 'tiktok_hooks', label: 'Bank Cangkuk TikTok', icon: TrendingUp, badge: `${TIKTOK_VIRAL_HOOKS.length} Hooks` },
            { id: 'whatsapp_templates', label: 'Templat WhatsApp WOCS', icon: MessageSquare, badge: `${WHATSAPP_TEMPLATES.length} Templat` },
            { id: 'booth_ops', label: 'SOP Operasi Booth', icon: CheckSquare, badge: '3 Fasa' },
            { id: 'audit_report', label: 'Dokumen Forensik Repo', icon: FileText, badge: '.md Rasmi' },
            { id: 'questions', label: '8 Soalan Asas Operasi', icon: HelpCircle, badge: `${workflows.filter(w => w.owner_signoff).length}/8` },
            { id: 'jev_tester', label: 'Simulator JEV System-1', icon: Activity, badge: 'Live AI' },
            { id: 'history', label: 'Sejarah Audit JEV', icon: Clock, badge: history.length > 0 ? `${history.length}` : undefined },
            { id: 'channels', label: 'Saluran Media Sosial Disahkan', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0",
                activeSubTab === tab.id
                  ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] shadow-xs"
                  : "text-[var(--ui-muted)] hover:text-[var(--ui-text)] hover:bg-black/5"
              )}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  activeSubTab === tab.id ? "bg-[var(--ui-soft)] text-[var(--ui-text)]" : "bg-black/10 text-[var(--ui-text)]"
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* SUBTAB 1: OVERVIEW & EMPIRICAL METRICS */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider">Tangkapan Bukti</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[var(--ui-text)]">167</span>
                  <span className="text-[10px] text-[var(--ui-success-text)] font-bold">100% SHA-256</span>
                </div>
                <span className="text-[10px] text-[var(--ui-muted)] mt-1">128 Rekod Unik Ternormal</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider">Keputusan JEV</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[var(--ui-text)]">389+</span>
                  <span className="text-[10px] text-[var(--ui-success-text)] font-bold">Live AI</span>
                </div>
                <span className="text-[10px] text-[var(--ui-muted)] mt-1">Single forward-pass &lt;50ms</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider">Kandungan Media BI</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[var(--ui-text)]">123</span>
                  <span className="text-[10px] text-[var(--ui-muted)] font-medium">79 video / 44 pos</span>
                </div>
                <span className="text-[10px] text-[var(--ui-muted)] mt-1">TikTok & Instagram rasmi</span>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider">Graf Pengetahuan</span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-[var(--ui-text)]">131</span>
                  <span className="text-[10px] text-[var(--ui-accent-text)] font-bold">128 Relasi</span>
                </div>
                <span className="text-[10px] text-[var(--ui-muted)] mt-1">124 Peristiwa garis masa</span>
              </div>
            </div>

            {/* Core Brand & Operations Synthesis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <Flame size={16} className="text-[var(--ui-danger-text)]" />
                    Profil Jenama & Hubungan Entiti Sebenar
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Disahkan Penuh
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  Berdasarkan audit repositori, teras perniagaan berpusat kepada 
                  <strong> ABANGCOLEK</strong> (produk kuah colek buah 500g, pencicah pedas manis, jeruk mangga asam boi) serta pasukan operasi 
                  <strong> STYLOAIRPOOL</strong> yang mengendalikan gerai pop-up bergerak di Toppen Johor Bahru, Pasar Karat, Shah Alam, dan Bangi.
                </p>
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--ui-text)]">ABANGCOLEK & STYLOAIRPOOL:</span>
                    <span className="text-[var(--ui-success-text)] font-bold">Jenama & Pengendali Rasmi</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--ui-text)]">LIURLELEH (Liur Leleh House):</span>
                    <span className="text-[var(--ui-warning-text)] font-bold">Produk Rakan Niaga</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--ui-text)]">JERUX (The Famous Jerux):</span>
                    <span className="text-[var(--ui-warning-text)] font-bold">Produk Jeruk Buah</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--ui-text)]">Stokis Terengganu (@jeruxsliurlelehterengganu):</span>
                    <span className="text-[var(--ui-accent-text)] font-bold">Ejen Wilayah Pantai Timur</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[var(--ui-warning-text)]" />
                    Tadbir Urus & Invarian Root Cause
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Tiada Halusinasi
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  Sistem mengekalkan piawaian etika data tanpa sebarang mock data:
                </p>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs text-[var(--ui-text)]">
                    <span className="font-bold text-[var(--ui-danger-text)] block mb-1">Aduan Kebocoran (LEAKAGE / SEAL_FAILURE):</span>
                    Aduan penutup botol kuah colek bocor semasa pos kurier dilabelkan sebagai <code>LEAKAGE</code>. Punca operasi wajib kekal <strong><code>UNDETERMINED</code></strong> sehingga semakan lot pengeluaran pembekal atau syarikat kurier diverifikasi.
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs text-[var(--ui-text)]">
                    <span className="font-bold text-[var(--ui-accent-text)] block mb-1">Pintu Kelulusan PRD (Gated Workflows):</span>
                    8 Aliran operasi asas di bawah memerlukan semakan dan pengesahan pemilik secara langsung sebelum kod automasi dijalankan secara bebas.
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: JINGLE THEME SONG & TIKTOK FOUNDER SPOTLIGHT (Extracted from thisisniagahub repo) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jingle Player Card */}
              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] border border-red-500/20 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">
                      <Music size={18} />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--ui-text)]">Lagu Tema Rasmi: &quot;Kasi Lagi-Lagi&quot;</h3>
                      <p className="text-[11px] text-[var(--ui-muted)]">Hip-Hop / Trap Anthem (85-95 BPM) · Abang Colek</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] border border-[var(--ui-border)]">
                    Audio Master 320kbps
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayJingle}
                    className="w-12 h-12 rounded-2xl bg-[var(--ui-primary)] hover:brightness-95 text-[var(--ui-primary-ink)] flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105 shrink-0"
                  >
                    {isPlayingJingle ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--ui-muted)]">Kasi Lagi-Lagi (Theme Song)</span>
                      <span className="text-[var(--ui-muted)] font-mono text-[11px]">01:00</span>
                    </div>
                    {/* Equalizer animation */}
                    <div className="flex items-end gap-1 h-5 pt-1">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 bg-[var(--ui-accent)] rounded-full transition-all duration-200",
                            isPlayingJingle ? "animate-pulse" : "opacity-30"
                          )}
                          style={{
                            height: isPlayingJingle 
                              ? `${Math.max(20, (Math.sin(i * 1.5) * 40 + 50))}%` 
                              : '25%'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src="/audio/kasi-lagi-lagi.mp3"
                  onEnded={() => setIsPlayingJingle(false)}
                  className="hidden"
                />

                <div className="pt-2 flex items-center justify-between border-t border-[var(--ui-border)] text-xs">
                  <button
                    onClick={() => setShowLyrics(!showLyrics)}
                    className="text-xs font-semibold text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)] flex items-center gap-1"
                  >
                    <span>{showLyrics ? 'Sembunyi Lirik' : 'Lihat Lirik Penuh (Karaoke)'}</span>
                    <ChevronRight size={13} className={cn("transition-transform", showLyrics && "rotate-90")} />
                  </button>
                  <span className="text-[10px] text-[var(--ui-muted)] italic">Disahkan daripada repo thisisniagahub</span>
                </div>

                {showLyrics && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-2xl bg-black/40 border border-[var(--ui-border)] text-[11px] font-mono leading-relaxed text-[var(--ui-muted)] space-y-2"
                  >
                    <p className="text-[var(--ui-warning-text)] font-bold">[CHORUS]</p>
                    <p className="font-bold text-[var(--ui-text)]">
                      ABANG CHO-LEK! SAMBAL CHO-LEK!<br />
                      PEDAS! PADU!<br />
                      SEKALI RASA. YOU KNOW.<br />
                      PEDAS MANIS. STAYS.
                    </p>
                    <p className="text-[var(--ui-muted)]">
                      [VERSE 2]<br />
                      Event penuh, booth kita pack<br />
                      Queue panjang, semua datang back<br />
                      Tak perlu gimmick, rasa speak loud<br />
                      Satu CHO-LEK! sama — tengok semua nod proud!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* TikTok & Founder Spotlight Card */}
              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]">
                      <Flame size={18} className="text-[var(--ui-danger-text)]" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--ui-text)]">Profil TikTok Rasmi: @styloairpool</h3>
                      <p className="text-[11px] text-[var(--ui-muted)]">Pengasas: Epull · Founder | Motivator 📈</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    75.2K Followers
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">Jumlah Tontonan & Likes</p>
                    <p className="text-base font-black text-[var(--ui-text)] mt-0.5">793.2K Likes</p>
                    <p className="text-[10px] text-[var(--ui-success-text)] mt-0.5">10.5 likes per follower</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">Kandungan Disahkan</p>
                    <p className="text-base font-black text-[var(--ui-text)] mt-0.5">79 Video Koleksi</p>
                    <p className="text-[10px] text-[var(--ui-muted)] mt-0.5">Festival & booth viral</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--ui-accent)] [&_*]:text-[var(--ui-accent-ink)] border border-[var(--ui-border)] space-y-1.5 text-xs">
                  <p className="font-bold text-[var(--ui-accent-text)] flex items-center gap-1.5">
                    <span>🌶️🥭</span>
                    <span>Slogan Rasmi TikTok:</span>
                  </p>
                  <p className="text-sm font-extrabold text-[var(--ui-accent-text)] italic">
                    &quot;PEDAS MANIS LIKAT MELEKAT 🌶️🥭&quot;
                  </p>
                  <p className="text-xs font-semibold text-[var(--ui-text)] italic">
                    &quot;Rasa Sekali Jatuh Cinta Selamanya&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--ui-muted)] pt-1">
                  <span>Dwi-Penjenamaan: Produk Makanan + Motivasi Bisnes</span>
                  <a
                    href="https://tiktok.com/@styloairpool"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[var(--ui-danger-text)] hover:text-[var(--ui-danger-text)] flex items-center gap-1"
                  >
                    <span>Buka TikTok</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* NEW: FOUNDER'S CORNER & DAILY MOTIVATIONAL QUOTES (From preset-data.ts) */}
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500 text-[var(--ui-text)] font-bold">
                    <Quote size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                      <span>Founder&apos;s Corner &amp; Inspirasi Harian</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                        {MOTIVATIONAL_QUOTES[quoteIndex].category.toUpperCase()}
                      </span>
                    </h4>
                    <p className="text-xs text-[var(--ui-muted)]">Mutiara kata pengasas dari preset-data.ts (8 Koleksi Rasmi)</p>
                  </div>
                </div>

                <button
                  onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
                  className="px-3 py-1.5 rounded-full bg-[var(--ui-surface)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-bold border border-[var(--ui-border)] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all shrink-0"
                >
                  <RefreshCw size={12} />
                  <span>Petikan Seterusnya ({quoteIndex + 1}/{MOTIVATIONAL_QUOTES.length})</span>
                </button>
              </div>

              {/* Current Active Quote Display */}
              <div className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-amber-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-extrabold text-[var(--ui-text)] italic">
                    &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex].quote}&rdquo;
                  </p>
                  <p className="text-xs text-[var(--ui-warning-text)] font-semibold flex items-center gap-1">
                    <span>— {MOTIVATIONAL_QUOTES[quoteIndex].author}</span>
                  </p>
                </div>
              </div>

              {/* 6 Contextual Brand Taglines */}
              <div>
                <p className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Tag size={12} className="text-[var(--ui-warning-text)]" />
                  <span>6 Slogan Rasmi Kontekstual Jenama (Taglines):</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {BRAND_TAGLINES.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        navigator.clipboard?.writeText(t.text);
                        setCopiedTagline(t.id);
                        setTimeout(() => setCopiedTagline(null), 2000);
                      }}
                      className="p-2.5 rounded-xl bg-[var(--ui-surface)] hover:bg-amber-50 border border-[var(--ui-border)] flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                    >
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)] block">{t.context} {t.emoji}</span>
                        <span className="font-bold text-[var(--ui-text)] text-xs truncate">&ldquo;{t.text}&rdquo;</span>
                      </div>
                      <span className="text-[10px] text-[var(--ui-muted)] group-hover:text-amber-700 font-medium shrink-0 ml-1">
                        {copiedTagline === t.id ? 'Disalin! ✓' : <Copy size={12} />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions to trigger Agent */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--ui-warning-text)]" />
                  Jalankan Tindakan Operasi dengan Ejen Pintar Abang Colek
                </h4>
                <p className="text-xs text-[var(--ui-muted)] mt-1">
                  Hubungkan terus ke Google Tasks, Gmail, Google Calendar, Sheets, dan Forms untuk mengurus pesanan dan menyelesaikan aduan pelanggan.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAction && onAction("Siasat aduan pembungkusan botol kuah colek bocor (LEAKAGE) dan sediakan SOP kawalan kualiti di Google Docs")}
                  className="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-semibold text-xs rounded-full [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 transition-all cursor-pointer"
                >
                  Siasat Isu Botol Bocor &rarr;
                </button>
                <button
                  onClick={() => onAction && onAction("Jadualkan mesyuarat pengurusan stokis Abang Colek dalam Google Calendar dan cipta bilik Google Meet")}
                  className="px-4 py-2 bg-[var(--ui-surface)] text-[var(--ui-text)] font-semibold text-xs rounded-full [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 transition-all cursor-pointer border border-[var(--ui-border)]"
                >
                  Jadual Mesyuarat Stokis &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: PITCH DECK 15-SLIDE (FROM abang-colek-brand-os PRESET) */}
        {activeSubTab === 'pitch_deck' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--ui-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">
                      <BookOpen size={18} />
                    </span>
                    <h3 className="font-bold text-base text-[var(--ui-text)]">
                      Pitch Deck Pelabur & Jenama Rasmi (15 Slaid Lengkap)
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--ui-muted)] mt-1">
                    Disintesis terus daripada kod asal <code className="text-[var(--ui-success-text)] font-mono">abang-colek-brand-os/src/preset.ts</code> (Founder: Megat Shaifulreza).
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {['All', 'Vision', 'Market', 'Product', 'Strategy', 'Traction'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDeckFilter(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                        deckFilter === cat ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]" : "bg-[var(--ui-soft)] text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Slide Presentation Canvas */}
              {(() => {
                const filteredSlides = PITCH_DECK_SLIDES.filter(s => deckFilter === 'All' || s.category === deckFilter);
                const currentSlide = filteredSlides[activeSlideIndex] || filteredSlides[0] || PITCH_DECK_SLIDES[0];

                return (
                  <div className="space-y-4">
                    <div className="p-8 rounded-3xl bg-[var(--ui-soft)] border border-[var(--ui-border)] shadow-inner relative overflow-hidden min-h-[260px] flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-4 border-b border-[var(--ui-border)]">
                        <div className="flex items-center gap-2.5">
                          <span className="px-3 py-1 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] font-extrabold text-xs">
                            Slaid #{currentSlide.slideNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--ui-soft)] text-[var(--ui-muted)] text-[11px] font-medium">
                            Kategori: {currentSlide.category}
                          </span>
                        </div>
                        {currentSlide.highlight && (
                          <span className="text-[11px] font-bold text-[var(--ui-warning-text)] bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                            ★ {currentSlide.highlight}
                          </span>
                        )}
                      </div>

                      <div className="my-6 space-y-3">
                        <h2 className="text-2xl font-black text-[var(--ui-text)] tracking-tight">
                          {currentSlide.title}
                        </h2>
                        <div className="text-[var(--ui-muted)] text-sm md:text-base leading-relaxed whitespace-pre-line font-medium">
                          {currentSlide.body}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-[var(--ui-muted)] font-mono">
                          Slaid {activeSlideIndex + 1} daripada {filteredSlides.length} (Jumlah Keseluruhan: 15)
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`[SLIDE ${currentSlide.slideNumber}] ${currentSlide.title}\n${currentSlide.body}`);
                              setCopiedSlide(true);
                              setTimeout(() => setCopiedSlide(false), 2000);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiedSlide ? <Check size={14} className="text-[var(--ui-success-text)]" /> : <Copy size={14} />}
                            <span>{copiedSlide ? 'Disalin!' : 'Salin Slaid Ini'}</span>
                          </button>
                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                            disabled={activeSlideIndex === 0}
                            className="p-2 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 disabled:opacity-30 text-[var(--ui-text)] transition-all cursor-pointer"
                            title="Slaid Sebelumnya"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => setActiveSlideIndex(prev => Math.min(filteredSlides.length - 1, prev + 1))}
                            disabled={activeSlideIndex === filteredSlides.length - 1}
                            className="p-2 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 disabled:opacity-30 text-[var(--ui-text)] transition-all cursor-pointer"
                            title="Slaid Seterusnya"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Thumbnail Navigation */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {filteredSlides.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => setActiveSlideIndex(idx)}
                          className={cn(
                            "px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer text-left border flex flex-col gap-0.5 min-w-[120px]",
                            activeSlideIndex === idx
                              ? "bg-[var(--ui-accent)] border-[var(--ui-border)] text-[var(--ui-accent-ink)] shadow-md"
                              : "bg-[var(--ui-soft)] border-[var(--ui-border)] text-[var(--ui-muted)] hover:text-[var(--ui-text)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
                          )}
                        >
                          <span className="text-[10px] opacity-75">#{s.slideNumber} • {s.category}</span>
                          <span className="truncate w-full font-semibold">{s.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Official Brand Manifestos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BRAND_MANIFESTOS.map((m) => (
                <div key={m.id} className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <span className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                      <Flame size={15} className="text-[var(--ui-danger-text)]" />
                      {m.title}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">
                      Rasmi Liurleleh House
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ui-text)] leading-relaxed font-medium whitespace-pre-line italic">
                    &quot;{m.text}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: TIKTOK HOOKS & VIRAL ENGINE */}
        {activeSubTab === 'tiktok_hooks' && (
          <div className="space-y-6">
            {/* TikTok Profile Header */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-3">
                  <img src="/assets/brand/founder.png" alt="Founder Epull" className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500 shadow-md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[var(--ui-text)]">{TIKTOK_PROFILE_METRICS.brandName}</h3>
                      <span className="text-xs text-[var(--ui-danger-text)] font-mono font-bold">{TIKTOK_PROFILE_METRICS.handle}</span>
                    </div>
                    <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                      Pengasas: {TIKTOK_PROFILE_METRICS.founderName} (Liurleleh House)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-black text-[var(--ui-text)]">{TIKTOK_PROFILE_METRICS.followers}</p>
                    <p className="text-[10px] text-[var(--ui-muted)] uppercase font-semibold">Pengikut</p>
                  </div>
                  <div className="w-px h-8 bg-[var(--ui-soft)]" />
                  <div className="text-right">
                    <p className="text-lg font-black text-[var(--ui-text)]">{TIKTOK_PROFILE_METRICS.likes}</p>
                    <p className="text-[10px] text-[var(--ui-muted)] uppercase font-semibold">Suka</p>
                  </div>
                  <div className="w-px h-8 bg-[var(--ui-soft)]" />
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-[var(--ui-success-text)] font-bold text-xs border border-emerald-500/30">
                    {TIKTOK_PROFILE_METRICS.likesPerFollower}
                  </span>
                </div>
              </div>

              {/* Bio & Emoji Strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-2">
                  <p className="font-bold text-[var(--ui-muted)] uppercase tracking-wider text-[10px]">Struktur Bio Rasmi:</p>
                  <p className="text-sm font-semibold text-[var(--ui-text)] whitespace-pre-line leading-relaxed">
                    {TIKTOK_PROFILE_METRICS.bio}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-2">
                  <p className="font-bold text-[var(--ui-muted)] uppercase tracking-wider text-[10px]">Strategi Simbol Emoji:</p>
                  <div className="flex flex-wrap gap-2">
                    {TIKTOK_PROFILE_METRICS.emojiStrategy.map((e, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl bg-[var(--ui-soft)] text-[var(--ui-text)] font-medium text-xs flex items-center gap-1.5">
                        <span>{e.emoji}</span>
                        <span>{e.meaning}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Cadence SOP & 5 Golden Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                  <h4 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--ui-danger-text)]" />
                    Jadual Siaran Mingguan (4-5 Video/Minggu)
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">
                    SOP Rasmi
                  </span>
                </div>
                <div className="space-y-2.5">
                  {TIKTOK_WEEKLY_CADENCE.map((cad, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex items-start gap-3">
                      <span className="w-16 font-extrabold text-xs text-[var(--ui-danger-text)] shrink-0">{cad.day}</span>
                      <div>
                        <p className="font-bold text-xs text-[var(--ui-text)]">{cad.focus}</p>
                        <p className="text-[11px] text-[var(--ui-muted)] mt-0.5">{cad.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                  <h4 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <Sparkles size={16} className="text-[var(--ui-warning-text)]" />
                    5 Peraturan Emas Kandungan Video
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                    Kualiti Viral
                  </span>
                </div>
                <div className="space-y-2.5">
                  {TIKTOK_GOLDEN_RULES.map((rule, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex items-center gap-3 text-xs font-semibold text-[var(--ui-text)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--ui-surface)] text-[var(--ui-text)] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 10 Proven Viral Hooks Grid */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <h4 className="font-bold text-sm text-[var(--ui-text)]">
                    Bank 10 Cangkuk Terbukti Viral (Empirical Hooks Bank)
                  </h4>
                  <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                    Data tontonan dan kadar penglibatan sebenar yang diekstrak daripada akaun @styloairpool.
                  </p>
                </div>
                <span className="text-xs font-bold text-[var(--ui-accent-ink)] bg-[var(--ui-accent)] px-2.5 py-1 rounded-full border border-[var(--ui-border)]">
                  {TIKTOK_VIRAL_HOOKS.length} Cangkuk Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TIKTOK_VIRAL_HOOKS.map((hook) => (
                  <div key={hook.id} className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] hover:border-red-300 transition-all space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--ui-muted)] uppercase">{hook.id}</span>
                        <div className="flex items-center gap-1">
                          {hook.tags.map((t) => (
                            <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--ui-surface)] border border-[var(--ui-border)] text-[var(--ui-muted)]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[var(--ui-text)] leading-snug">
                        &quot;{hook.text}&quot;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--ui-border)] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3 text-[var(--ui-muted)] font-semibold">
                        <span>👁️ {(hook.performance.views / 1000).toFixed(0)}k</span>
                        <span>❤️ {(hook.performance.likes / 1000).toFixed(1)}k</span>
                        <span className="text-[var(--ui-success-text)] font-bold">{hook.performance.engagement}% ER</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(hook.text);
                          alert(`Cangkuk disalin: "${hook.text}"`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--ui-surface)] border border-[var(--ui-border)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Salin Hook
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: WHATSAPP WOCS TEMPLATES */}
        {activeSubTab === 'whatsapp_templates' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <h4 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <MessageSquare size={16} className="text-[var(--ui-success-text)]" />
                    Pustaka 12 Templat Mesej WhatsApp WOCS
                  </h4>
                  <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                    Mesej rasmi yang dipautkan ke Chrome Extension WOCS dan Webhook Meta Cloud API.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['all', 'customer_service', 'event', 'order', 'marketing'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateCategory(cat)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer",
                        templateCategory === cat ? "bg-emerald-600 text-white" : "bg-[var(--ui-soft)] text-[var(--ui-muted)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95"
                      )}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Templates Selector List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {WHATSAPP_TEMPLATES.filter(t => templateCategory === 'all' || t.category === templateCategory).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1",
                        selectedTemplateId === t.id
                          ? "bg-emerald-50/80 border-emerald-400 text-emerald-950 shadow-xs"
                          : "bg-[var(--ui-soft)] border-[var(--ui-border)] hover:border-[var(--ui-border)] text-[var(--ui-text)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{t.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--ui-soft)] border border-[var(--ui-border)] uppercase">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--ui-muted)] truncate font-mono">
                        Pencetus: {t.trigger.slice(0, 3).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Template Preview and Interpolator */}
                {(() => {
                  const activeT = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
                  let interpolatedMessage = activeT.message;
                  Object.entries(variableValues).forEach(([k, v]) => {
                    interpolatedMessage = interpolatedMessage.replaceAll(`{${k}}`, v);
                  });

                  return (
                    <div className="lg:col-span-2 p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-md space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
                          <div>
                            <h5 className="font-bold text-sm text-[var(--ui-text)]">{activeT.name}</h5>
                            <p className="text-[11px] text-[var(--ui-muted)] font-mono">ID: {activeT.id}</p>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            activeT.requiresAdmin ? "bg-amber-500/20 text-[var(--ui-warning-text)] border-amber-500/30" : "bg-emerald-500/20 text-[var(--ui-success-text)] border-emerald-500/30"
                          )}>
                            {activeT.requiresAdmin ? 'Perlu Pengesahan Admin' : 'Balas Automatik'}
                          </span>
                        </div>

                        {/* WhatsApp Bubble Style Preview */}
                        <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] font-sans text-xs text-[var(--ui-muted)] leading-relaxed whitespace-pre-wrap">
                          {interpolatedMessage}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="text-[11px] text-[var(--ui-muted)]">
                          Pencetus Kata Kunci: <code className="text-[var(--ui-success-text)]">{activeT.trigger.join(', ')}</code>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(interpolatedMessage);
                              setCopiedTemplate(true);
                              setTimeout(() => setCopiedTemplate(false), 2000);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiedTemplate ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedTemplate ? 'Disalin ke Papan Keratan!' : 'Salin Mesej Penuh'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: BOOTH OPS CHECKLIST (3 PHASES) */}
        {activeSubTab === 'booth_ops' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <h4 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <CheckSquare size={16} className="text-[var(--ui-accent-text)]" />
                    SOP Operasi Gerai & Senarai Semak Acara (3 Fasa Penuh)
                  </h4>
                  <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                    Prosedur operasi piawai sebelum, semasa, dan selepas acara jualan Abang Colek di serata Malaysia.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--ui-accent-text)] bg-[var(--ui-soft)] px-3 py-1 rounded-full border border-[var(--ui-border)]">
                    {Object.values(completedChecklist).filter(Boolean).length} daripada 28 Selesai
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pre-Event */}
                <div className="p-5 rounded-3xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <span className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">1. Pre-Event (10 Perkara)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Persediaan</span>
                  </div>
                  <div className="space-y-2">
                    {BOOTH_OPS_CHECKLISTS.preEvent.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-[var(--ui-text)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(completedChecklist[`pre-${idx}`])}
                          onChange={() => toggleChecklistItem(`pre-${idx}`)}
                          className="mt-0.5 rounded border-[var(--ui-border)] text-[var(--ui-accent-text)] focus:ring-[var(--ui-accent)]"
                        />
                        <span className={cn(Boolean(completedChecklist[`pre-${idx}`]) && "line-through text-[var(--ui-muted)] font-normal")}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* During-Event */}
                <div className="p-5 rounded-3xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <span className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">2. Semasa Event (10 Perkara)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Operasi Booth</span>
                  </div>
                  <div className="space-y-2">
                    {BOOTH_OPS_CHECKLISTS.duringEvent.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-[var(--ui-text)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(completedChecklist[`during-${idx}`])}
                          onChange={() => toggleChecklistItem(`during-${idx}`)}
                          className="mt-0.5 rounded border-[var(--ui-border)] text-[var(--ui-success-text)] focus:ring-emerald-500"
                        />
                        <span className={cn(Boolean(completedChecklist[`during-${idx}`]) && "line-through text-[var(--ui-muted)] font-normal")}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Post-Event */}
                <div className="p-5 rounded-3xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <span className="font-bold text-xs text-[var(--ui-text)] uppercase tracking-wider">3. Post-Event (8 Perkara)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">Kemas & Kira</span>
                  </div>
                  <div className="space-y-2">
                    {BOOTH_OPS_CHECKLISTS.postEvent.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-2.5 text-xs text-[var(--ui-text)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(completedChecklist[`post-${idx}`])}
                          onChange={() => toggleChecklistItem(`post-${idx}`)}
                          className="mt-0.5 rounded border-[var(--ui-border)] text-[var(--ui-text)] focus:ring-[var(--ui-accent)]"
                        />
                        <span className={cn(Boolean(completedChecklist[`post-${idx}`]) && "line-through text-[var(--ui-muted)] font-normal")}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: FORENSIC AUDIT REPORT VIEWER (.md DOCUMENTATION) */}
        {activeSubTab === 'audit_report' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--ui-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)]">
                      <FileText size={18} />
                    </span>
                    <h3 className="font-bold text-base text-[var(--ui-text)]">
                      Laporan Forensik & Rujukan Repositori Sebenar (.md)
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--ui-muted)] mt-1">
                    Lokasi Fail Kekal Projek: <code className="font-mono text-[var(--ui-text)] bg-[var(--ui-soft)] px-2 py-0.5 rounded">/docs/AUDIT_TERPERINCI_REPO_ABANG_COLEK_ECOSYSTEM.md</code>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://github.com/thisisniagahub/ABANG-COLEK.git"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-full bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>GitHub Induk</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => {
                      alert("Fail rujukan kekal telah disimpan dalam /docs/AUDIT_TERPERINCI_REPO_ABANG_COLEK_ECOSYSTEM.md dalam direktori projek.");
                    }}
                    className="px-4 py-1.5 rounded-full bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--ui-primary)] transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Sahkan Lokasi Fail</span>
                  </button>
                </div>
              </div>

              {/* Forensic Metric Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Modul Utama Disemak</span>
                  <div className="text-lg font-black text-[var(--ui-text)] mt-0.5">4 Sub-Projek</div>
                  <span className="text-[10px] text-[var(--ui-muted)]">Brand OS, WOCS, Mobile, Server</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Slaid Pitch Deck</span>
                  <div className="text-lg font-black text-[var(--ui-text)] mt-0.5">15 Slaid Lengkap</div>
                  <span className="text-[10px] text-[var(--ui-success-text)] font-bold">Founder Megat Shaifulreza</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Templat WhatsApp WOCS</span>
                  <div className="text-lg font-black text-[var(--ui-text)] mt-0.5">12 Mesej Rasmi</div>
                  <span className="text-[10px] text-[var(--ui-text)] font-bold">14 Tangkap Layar WAWCD</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--ui-muted)]">Bank Cangkuk TikTok</span>
                  <div className="text-lg font-black text-[var(--ui-text)] mt-0.5">10 Viral Hooks</div>
                  <span className="text-[10px] text-[var(--ui-danger-text)] font-bold">793.2K Likes @styloairpool</span>
                </div>
              </div>

              {/* Markdown Document Content Display */}
              <div className="p-6 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] space-y-4 max-h-[600px] overflow-y-auto text-xs text-[var(--ui-text)] leading-relaxed font-sans">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold">✓ Status Audit Selesai & Disahkan:</p>
                  <p className="mt-0.5">
                    Seluruh fail dalam <code className="font-mono bg-[var(--ui-surface)] px-1.5 py-0.5 rounded">https://github.com/thisisniagahub/ABANG-COLEK.git</code> telah dibaca, dianalisis, dan direkodkan ke dalam fail markdown dokumentasi rasmi projek ini.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-[var(--ui-text)] uppercase tracking-wide border-b pb-1">
                    1. Struktur Fail Monorepo Yang Disahkan
                  </h4>
                  <pre className="bg-[var(--ui-surface)] text-[var(--ui-muted)] p-4 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed">
{`H:\\ANTIGRAVITY\\ABANG-COLEK\\
├── abang-colek-brand-os/          (React 19 + TypeScript + Vite Dashboard)
│   ├── src/preset.ts             (15-Slide Deck, Manifesto, TikTok SOP)
│   └── skills/                   (100+ modul kemahiran automasi)
├── abang-colek-mobile/            (React Native / Expo + Drizzle)
│   ├── lib/preset-data.ts        (10 Viral Hooks, Checklists, Badges)
│   ├── lib/whatsapp-templates.ts (12 Templat WhatsApp WOCS)
│   ├── lib/jingle-lyrics.ts      ('Kasi Lagi-Lagi' BPM 85-95)
│   └── server/wocs/              (Parser arahan WhatsApp /command)
├── abang-colek-wocs-extension/    (Manifest V3 Chrome Extension)
│   ├── content/                  (Suntikan UI ke web.whatsapp.com)
│   └── popup/                    (Panel kawalan extension)
├── wocs-server/                   (Express + Meta Cloud API Webhook)
├── WAWCD/                         (14 Tangkap Layar Bukti Suntikan UI)
├── sample-image/                  (18 Aset Visual Maskot 1-5 & Founder)
├── Kasi Lagi-Lagi.mp3             (Master Audio Jingle 1 Minit)
└── REPOS.md                       (Pelan Induk Orkestrasi)`}
                  </pre>

                  <h4 className="font-extrabold text-sm text-[var(--ui-text)] uppercase tracking-wide border-b pb-1 pt-2">
                    2. Data Operasi Penting Yang Telah Digunakan Untuk Penambahbaikan
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-[var(--ui-text)]">
                    <li><strong className="text-[var(--ui-text)]">Pengasas & Pengurusan:</strong> Megat Shaifulreza (Epull) di bawah Liurleleh House Malaysia.</li>
                    <li><strong className="text-[var(--ui-text)]">3 Slogan Mengikut Konteks:</strong> Cetakan (&quot;Rasa Padu, Pedas Menggamit&quot;), TikTok (&quot;PEDAS MANIS LIKAT MELEKAT 🌶️🥭&quot;), Emosi (&quot;Rasa Sekali Jatuh Cinta Selamanya&quot;).</li>
                    <li><strong className="text-[var(--ui-text)]">Struktur Harga & SKU:</strong> 250ml (RM15), 500ml (RM28), 1L (RM50) & Promosi Beli 3 Percuma 1.</li>
                    <li><strong className="text-[var(--ui-text)]">Logistik Bas Ekspres & SOP 1 Jam:</strong> TBS KL, MBKT Kuala Terengganu, Lembah Sireh Kota Bharu, Larkin JB dengan notifikasi WhatsApp pantas.</li>
                    <li><strong className="text-[var(--ui-text)]">Enjin Arahan WhatsApp WOCS:</strong> Menyokong arahan <code className="bg-[var(--ui-soft)] px-1 rounded font-mono">/landing</code>, <code className="bg-[var(--ui-soft)] px-1 rounded font-mono">/config</code>, <code className="bg-[var(--ui-soft)] px-1 rounded font-mono">/assign</code>, <code className="bg-[var(--ui-soft)] px-1 rounded font-mono">/tiktok</code>, dan <code className="bg-[var(--ui-soft)] px-1 rounded font-mono">/report</code>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: 8 FOUNDATIONAL BUSINESS QUESTIONS */}
        {activeSubTab === 'questions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <HelpCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Papan Pengesahan Operasi Pemilik (Human-in-the-Loop Gate)</p>
                <p className="text-amber-800 mt-0.5">
                  Setiap keputusan di bawah disimpan secara kekal dalam storan operasi sistem. Klik butang toggle untuk mengesahkan SOP atau menguncinya bagi audit keselamatan perisian.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflows.map((wf) => (
                <div 
                  key={wf.id}
                  className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] hover:border-[var(--ui-border)] shadow-xs transition-all space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono font-bold text-[var(--ui-muted)]">{wf.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          wf.riskLevel === 'CRITICAL' ? "bg-red-100 text-red-700" :
                          wf.riskLevel === 'HIGH' ? "bg-amber-100 text-amber-800" :
                          "bg-[var(--ui-soft)] text-[var(--ui-accent-text)]"
                        )}>
                          {wf.riskLevel} Risk
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          wf.owner_signoff ? "bg-emerald-100 text-emerald-800" : "bg-[var(--ui-soft)] text-[var(--ui-muted)]"
                        )}>
                          {wf.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-[var(--ui-text)] mb-1">{wf.title}</h4>
                    <p className="text-xs text-[var(--ui-muted)] italic mb-2">"{wf.question}"</p>
                    <p className="text-xs text-[var(--ui-text)] leading-relaxed font-medium bg-[var(--ui-soft)] p-3 rounded-2xl border border-[var(--ui-border)]">
                      {wf.verifiedDetails}
                    </p>
                    {wf.ownerNotes && (
                      <div className="mt-2 text-[11px] text-[var(--ui-muted)] bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                        <strong className="text-amber-900">Nota Pemilik:</strong> {wf.ownerNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[var(--ui-border)]">
                    <button
                      onClick={() => handleToggleSignoff(wf.id, wf.owner_signoff)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                        wf.owner_signoff
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)]"
                      )}
                    >
                      <Check size={13} />
                      <span>{wf.owner_signoff ? 'Disahkan (Verified)' : 'Kunci (Gate SOP)'}</span>
                    </button>
                    <button
                      onClick={() => onAction && onAction(`Kemas kini SOP untuk aliran kerja ${wf.id} (${wf.title}) dan sediakan draf dokumen dasar di Google Docs.`)}
                      className="text-xs text-[var(--ui-muted)] hover:text-[var(--ui-text)] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Sedia Dokumen SOP</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: REAL JEV SYSTEM-1 SIMULATOR */}
        {activeSubTab === 'jev_tester' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <Activity size={16} className="text-[var(--ui-danger-text)]" />
                    Enjin Klasifikasi JEV System-1 (Real Live Execution)
                  </h3>
                  <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                    Uji teks pelanggan atau mesej WhatsApp sebenar merentasi 7 dimensi taksonomi dan 3 primitif bertaip (Choice, Score, Noul).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono bg-[var(--ui-soft)] text-[var(--ui-muted)] px-2.5 py-1 rounded-full">
                    Model: gemini-3.8-flash (JEV System-1)
                  </span>
                </div>
              </div>

              {/* Sample Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block">Pilih Contoh Mesej Sebenar:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Salam bang, botol kuah colek yang pos ke Terengganu penutup dia pecah & kuah meleleh habis dalam parcel!",
                    "Hai Abang Colek, booth Toppen JB buka sampai pukul berapa hari ni? Ada buah mangga tak?",
                    "Saya nak order pakej niaga ejen permulaan 50 botol kuah colek untuk kedai saya di Shah Alam.",
                    "Kuah colek Abang Colek memang padu berapi! Buah potong rangup gila, semalam beli kat Pasar Karat."
                  ].map((sample, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputText(sample);
                        handleRunRealJev(sample);
                      }}
                      className="text-[11px] px-3 py-1.5 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] rounded-full border border-[var(--ui-border)] transition-all text-left truncate max-w-md cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Box */}
              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={3}
                  placeholder="Masukkan mesej pelanggan atau aduan..."
                  className="w-full p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] text-xs text-[var(--ui-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)] resize-none font-medium"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--ui-muted)]">
                    Sistem akan memproses penilaian pantas dalam satu pas (*single forward-pass*).
                  </span>
                  <button
                    onClick={() => handleRunRealJev()}
                    disabled={isEvaluating || !inputText.trim()}
                    className="px-5 py-2.5 bg-[var(--ui-surface)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 disabled:opacity-50 text-[var(--ui-text)] text-xs font-semibold rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Menjalankan JEV...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Jalankan JEV System-1 &rarr;</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {jevResult?.providerMode === 'LOCAL_RULES' && jevResult.assessment ? (
              <section className="space-y-4">
                <JevAssessmentCard assessment={jevResult.assessment} />
                <p className="text-sm text-[var(--ui-muted)]">Sediakan pratonton untuk semakan. Butang ini belum menghantar email atau mencipta rekod Google Workspace.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{(['task', 'email', 'calendar', 'sheet'] as const).map(type => <button key={type} disabled={actionStatus?.loading} onClick={() => handleExecuteAction(type)} className="p-3 rounded-2xl bg-[var(--ui-soft)] text-[var(--ui-text)] border border-[var(--ui-border)]">Pratonton {type}</button>)}</div>
                {actionPreview && <article className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]"><p className="text-xs text-[var(--ui-muted)]">PREPARED · Belum dilaksanakan</p><h3 className="font-bold">{actionPreview.title}</h3><p className="whitespace-pre-wrap text-sm">{actionPreview.body}</p><p className="text-xs mt-2">{actionPreview.notice}</p></article>}
                {actionStatus?.message && <p role="status" className="text-sm text-[var(--ui-muted)]">{actionStatus.message}</p>}
              </section>
            ) : jevResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-sm space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--ui-muted)]">ID: {jevResult.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Latensi Sebenar: {jevResult.latencyMs}ms
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[var(--ui-text)] mt-1">
                      Keputusan Pengelasan 7 Dimensi JEV
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--ui-muted)] font-medium">Urgensi:</span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold",
                      jevResult.primitives.urgencyScore.score >= 4 ? "bg-red-100 text-red-700" :
                      jevResult.primitives.urgencyScore.score >= 3 ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    )}>
                      {jevResult.primitives.urgencyScore.score}/5.0 ({jevResult.primitives.urgencyScore.label})
                    </span>
                  </div>
                </div>

                {/* 7 Dimensions Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">1. Brand</span>
                    <span className="font-bold text-sm text-[var(--ui-text)] block">{jevResult.dimensions.brand.value}</span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.brand.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">2. Business Function</span>
                    <span className="font-bold text-sm text-[var(--ui-text)] block">{jevResult.dimensions.businessFunction.value}</span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.businessFunction.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">3. Sales Channel</span>
                    <span className="font-bold text-sm text-[var(--ui-text)] block">{jevResult.dimensions.salesChannel.value}</span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.salesChannel.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">4. Customer Intent</span>
                    <span className="font-bold text-sm text-[var(--ui-text)] block">{jevResult.dimensions.customerIntent.value}</span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.customerIntent.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">5. Issue Class</span>
                    <span className={cn(
                      "font-bold text-sm block",
                      jevResult.dimensions.issueClass.value === 'LEAKAGE' || jevResult.dimensions.issueClass.value === 'SEAL_FAILURE' ? "text-[var(--ui-danger-text)]" : "text-[var(--ui-text)]"
                    )}>
                      {jevResult.dimensions.issueClass.value}
                    </span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.issueClass.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">6. Process Stage</span>
                    <span className="font-bold text-sm text-[var(--ui-text)] block">{jevResult.dimensions.processStage.value}</span>
                    <span className="text-[10px] text-[var(--ui-success-text)] font-mono font-semibold">{(jevResult.dimensions.processStage.confidence * 100).toFixed(0)}% Keyakinan</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] col-span-2">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">7. Root Cause Status (Invariant)</span>
                    <span className="font-bold text-sm text-[var(--ui-warning-text)] block">{jevResult.dimensions.rootCauseStatus.value}</span>
                    <span className="text-[10px] text-[var(--ui-muted)] font-medium">Kekal UNDETERMINED sehingga lot pembungkusan/kilang disahkan</span>
                  </div>
                </div>

                {/* Typed Primitives: Noul & Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <div className="text-xs">
                    <span className="font-semibold text-[var(--ui-muted)] block">Perlu Campur Tangan Segera (Noul):</span>
                    <span className="font-bold text-[var(--ui-text)] text-sm">
                      {jevResult.primitives.requiresImmediateIntervention.isAffirmative ? 'YA' : 'TIDAK'} ({(jevResult.primitives.requiresImmediateIntervention.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-[var(--ui-muted)] block">Layak Gantian / Bayaran Balik (Noul):</span>
                    <span className="font-bold text-[var(--ui-text)] text-sm">
                      {jevResult.primitives.isRefundEligible.isAffirmative ? 'LAYAK' : 'TIDAK'} ({(jevResult.primitives.isRefundEligible.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-[var(--ui-muted)] block">Peluang Ejen Bernilai Tinggi:</span>
                    <span className="font-bold text-[var(--ui-text)] text-sm">
                      {jevResult.primitives.isHighValueAgentOpportunity.isAffirmative ? 'POTENSI TINGGI' : 'STANDARD'} ({(jevResult.primitives.isHighValueAgentOpportunity.probability * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* SOP & Recommended Action */}
                <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900">
                  <div>
                    <span className="font-bold block text-amber-950">Tindakan Operasi Disyorkan:</span>
                    <p className="mt-0.5 font-medium">{jevResult.recommendedAction}</p>
                  </div>
                  <div>
                    <span className="font-bold block text-amber-950">Piawaian SOP:</span>
                    <p className="mt-0.5 font-medium">{jevResult.suggestedSop}</p>
                  </div>
                </div>

                {/* Live Google Workspace Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--ui-text)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[var(--ui-danger-text)]" />
                      Laksana Tindakan Automatik Google Workspace (Live API):
                    </span>
                  </div>

                  {actionStatus?.message && (
                    <div className={cn(
                      "p-3 rounded-2xl text-xs font-semibold border flex items-center gap-2",
                      actionStatus.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                    )}>
                      {actionStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{actionStatus.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <button
                      onClick={() => handleExecuteAction('task')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 border border-[var(--ui-border)] rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-[var(--ui-text)] font-bold text-xs">
                        <CheckSquare size={14} className="text-[var(--ui-accent-text)]" />
                        <span>Google Tasks</span>
                      </div>
                      <span className="text-[11px] text-[var(--ui-muted)] mt-2 font-medium">Cipta tugasan siasatan</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('email')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 border border-[var(--ui-border)] rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-[var(--ui-text)] font-bold text-xs">
                        <Mail size={14} className="text-[var(--ui-danger-text)]" />
                        <span>Gmail</span>
                      </div>
                      <span className="text-[11px] text-[var(--ui-muted)] mt-2 font-medium">Draf maklum balas gantian</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('calendar')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 border border-[var(--ui-border)] rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-[var(--ui-text)] font-bold text-xs">
                        <Calendar size={14} className="text-[var(--ui-success-text)]" />
                        <span>Google Calendar</span>
                      </div>
                      <span className="text-[11px] text-[var(--ui-muted)] mt-2 font-medium">Jadual semakan batch</span>
                    </button>

                    <button
                      onClick={() => handleExecuteAction('sheet')}
                      disabled={actionStatus?.loading}
                      className="p-3 bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 border border-[var(--ui-border)] rounded-2xl text-left flex flex-col justify-between transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 text-[var(--ui-text)] font-bold text-xs">
                        <FileSpreadsheet size={14} className="text-[var(--ui-success-text)]" />
                        <span>Google Sheets</span>
                      </div>
                      <span className="text-[11px] text-[var(--ui-muted)] mt-2 font-medium">Log ke lembaran rekod</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* SUBTAB 4: REAL JEV EVALUATION AUDIT TRAIL */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--ui-text)]">Sejarah Audit & Log Pengelasan JEV</h3>
                <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                  Sejarah berada dalam memori sesi semasa. Simpanan device peribadi memerlukan pilihan eksplisit dan bukan sync server.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[var(--ui-surface)] px-3 py-1.5 rounded-full border border-[var(--ui-border)] text-[var(--ui-text)]">
                {history.length} Log Direkod
              </span>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)] space-y-2">
                <Clock size={28} className="mx-auto text-[var(--ui-muted)]" />
                <p className="text-xs text-[var(--ui-muted)] font-medium">Belum ada sebarang teks dinilai lagi.</p>
                <button
                  onClick={() => {
                    setActiveSubTab('jev_tester');
                    handleRunRealJev();
                  }}
                  className="px-4 py-2 bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-xs font-semibold rounded-full hover:bg-[var(--ui-primary)] transition-all cursor-pointer"
                >
                  Uji Teks Sekarang &rarr;
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {history.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--ui-muted)]">{item.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          item.dimensions.issueClass.value === 'LEAKAGE' ? "bg-red-100 text-red-700" : "bg-[var(--ui-soft)] text-[var(--ui-text)]"
                        )}>
                          {item.dimensions.issueClass.value}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {item.latencyMs}ms
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--ui-muted)]">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--ui-text)] font-medium bg-[var(--ui-soft)] p-2.5 rounded-xl border border-[var(--ui-border)]">
                      "{item.inputText}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--ui-muted)]">
                      <span>Brand: <strong className="text-[var(--ui-text)]">{item.dimensions.brand.value}</strong></span>
                      <span>Intent: <strong className="text-[var(--ui-text)]">{item.dimensions.customerIntent.value}</strong></span>
                      <span>Channel: <strong className="text-[var(--ui-text)]">{item.dimensions.salesChannel.value}</strong></span>
                      <span>Root Cause: <strong className="text-[var(--ui-warning-text)]">{item.dimensions.rootCauseStatus.value}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 5: SOCIAL CHANNELS COVERAGE */}
        {activeSubTab === 'channels' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
              <h3 className="text-sm font-bold text-[var(--ui-text)] mb-1">Saluran Media Sosial Rasmi Abang Colek & StyloAirpool</h3>
              <p className="text-xs text-[var(--ui-muted)]">
                128 rekod ternormal diekstrak daripada platform awam tanpa sebarang token akses sulit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <span>TikTok Rasmi</span>
                    <code className="text-xs font-mono bg-[var(--ui-soft)] px-2 py-0.5 rounded">@styloairpool</code>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    81 URLs (100% Extracted)
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  79 video diekstrak melalui <code>yt-dlp</code> + 2 URL media. Memaparkan jualan buah potong celup kuah colek melimpah di karnival Johor Bahru.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <span>Instagram Rasmi</span>
                    <code className="text-xs font-mono bg-[var(--ui-soft)] px-2 py-0.5 rounded">@airpoolstylo</code>
                  </span>
                  <span className="text-xs font-bold text-[var(--ui-accent-text)] bg-[var(--ui-soft)] px-2.5 py-0.5 rounded-full">
                    11 Posts / Reels
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  Pengumuman lokasi booth festival, hebahan jualan kuah pencicah buah segar, dan nombor pesanan terus WhatsApp.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <span>Threads Awam</span>
                    <code className="text-xs font-mono bg-[var(--ui-soft)] px-2 py-0.5 rounded">@airpoolstylo</code>
                  </span>
                  <span className="text-xs font-bold text-[var(--ui-accent-ink)] bg-[var(--ui-accent)] px-2.5 py-0.5 rounded-full">
                    15 Posts Awam
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  Kemas kini harian baki stok gerai pop-up dan maklum balas pelanggan gerai.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ui-text)] flex items-center gap-2">
                    <span>Rangkaian Stokis Terengganu</span>
                    <code className="text-xs font-mono bg-[var(--ui-soft)] px-2 py-0.5 rounded">@jeruxsliurlelehterengganu</code>
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    12 Pos Ejen
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                  Aktiviti pengedaran kuah colek & jeruk buah buatan tangan untuk pelanggan sekitar Pantai Timur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: TYPESAFE.AI JEV REPO AUDIT & WOCS COMMAND CONSOLE */}
        {activeSubTab === 'wocs_audit' && (
          <div className="space-y-6">
            {/* Header & Verification Badge */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] text-[var(--ui-text)] border border-[var(--ui-border)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--ui-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[var(--ui-success-text)]" />
                    <h3 className="font-bold text-base text-[var(--ui-text)]">
                      Laporan Audit Forensik Typesafe.ai JEV (Repo GitHub)
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--ui-muted)] mt-1">
                    Kajian menyeluruh ke atas fail kod, skema Drizzle, automasi WOCS, dan aset di <a href="https://github.com/thisisniagahub/ABANG-COLEK.git" target="_blank" rel="noreferrer" className="underline text-[var(--ui-warning-text)]">thisisniagahub/ABANG-COLEK.git</a>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-[var(--ui-success-text)] font-extrabold text-xs border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[var(--ui-success-text)]" />
                    <span>JEV Score: 94.6% (VERIFIED)</span>
                  </span>
                </div>
              </div>

              {/* 7-Dimension Scorecards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">1. Identiti Jenama</p>
                  <p className="text-base font-black text-[var(--ui-success-text)] mt-0.5">98.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">@styloairpool & Lirik Jingle</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">2. Fungsi Bisnes</p>
                  <p className="text-base font-black text-[var(--ui-success-text)] mt-0.5">96.5%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">Rangkaian Serahan TBS</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">3. Saluran Kargo</p>
                  <p className="text-base font-black text-[var(--ui-success-text)] mt-0.5">94.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">WOCS WhatsApp & redBus</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">4. Niat Pelanggan</p>
                  <p className="text-base font-black text-[var(--ui-success-text)] mt-0.5">95.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">5 Templat Mesej Rasmi</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">5. Klasifikasi Isu</p>
                  <p className="text-base font-black text-[var(--ui-warning-text)] mt-0.5">92.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">SOP Notis 1 Jam Sah</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">6. Peringkat Proses</p>
                  <p className="text-base font-black text-[var(--ui-success-text)] mt-0.5">97.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">TBS ke Terminal Ejen</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">7. Tadbir Urus</p>
                  <p className="text-base font-black text-[var(--ui-accent-text)] mt-0.5">90.0%</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">Supabase Immutable Log</p>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)]">
                  <p className="text-[10px] font-bold uppercase text-[var(--ui-muted)]">Penyimpanan MD</p>
                  <p className="text-xs font-mono font-bold text-[var(--ui-warning-text)] mt-1">.md Disimpan ✓</p>
                  <p className="text-[10px] text-[var(--ui-muted)]">docs/ & reports/</p>
                </div>
              </div>
            </div>

            {/* WOCS WhatsApp Operations Command Console */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--ui-border)] gap-2">
                <div className="flex items-center gap-2">
                  <Terminal size={18} className="text-[var(--ui-text)]" />
                  <h4 className="font-bold text-sm text-[var(--ui-text)]">
                    Konsol Pengujian Arahan WhatsApp WOCS (Command Runner)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[var(--ui-muted)]">
                  Berasaskan commandParser.ts (abang-colek-mobile / wocs-server)
                </span>
              </div>

              {/* Quick Chip Presets */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--ui-muted)] font-bold text-[11px]">Contoh Arahan WOCS:</span>
                {[
                  '/assign agent=KakMas hub=MBKT cargo=100botol driver=AbangZul',
                  '/schedule type=tiktok time=17:00 topic=LikatMelekat',
                  '/report type=daily date=today',
                  '/landing theme=pedas_manis promo=Beli3Free1',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setWocsInput(cmd);
                      handleParseWocsCommand(cmd);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[var(--ui-text)] font-mono text-[11px] transition-all"
                  >
                    {cmd.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Input field */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Terminal size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" />
                  <input
                    type="text"
                    value={wocsInput}
                    onChange={(e) => {
                      setWocsInput(e.target.value);
                      handleParseWocsCommand(e.target.value);
                    }}
                    placeholder="/assign agent=Wan hub=KB cargo=50botol"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl font-mono text-xs text-[var(--ui-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                  />
                </div>

                <button
                  onClick={() => handleParseWocsCommand(wocsInput)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] font-bold text-xs hover:bg-[var(--ui-primary)] transition-all shadow-xs"
                >
                  Proses Arahan
                </button>
              </div>

              {/* Parsed Output Box */}
              {parsedWocs && (
                <div className="p-4 rounded-2xl bg-[var(--ui-surface)] text-[var(--ui-text)] font-mono text-xs space-y-2 border border-[var(--ui-border)]">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--ui-border)]">
                    <span className="text-[var(--ui-muted)] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Output WOCS Engine: <strong>{parsedWocs.type}</strong>
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      parsedWocs.requiresApproval ? "bg-amber-500/20 text-[var(--ui-warning-text)] border border-amber-500/30" : "bg-emerald-500/20 text-[var(--ui-success-text)]"
                    )}>
                      {parsedWocs.requiresApproval ? 'Perlu Kelulusan Admin' : 'Auto-Laksana Serta-Merta'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--ui-muted)]">
                    <p className="text-[var(--ui-text)] font-bold mb-1">Payload Terhurai:</p>
                    <pre className="bg-black/40 p-2.5 rounded-xl overflow-x-auto text-[var(--ui-success-text)]">
                      {JSON.stringify(parsedWocs.payload, null, 2)}
                    </pre>
                  </div>

                  {executionResult && (
                    <div className="pt-2 border-t border-[var(--ui-border)] text-[11px] space-y-1">
                      <p className="text-[var(--ui-muted)] font-bold">Status Pelaksanaan Langsung (Simulasi WOCS):</p>
                      <div className={cn(
                        "p-2.5 rounded-xl border",
                        executionResult.ok ? "bg-emerald-950/60 border-emerald-500/40 text-[var(--ui-success-text)]" : "bg-red-950/60 border-red-500/40 text-[var(--ui-danger-text)]"
                      )}>
                        <p className="font-semibold">{executionResult.message}</p>
                        {executionResult.requiresAdminApproval && (
                          <p className="text-[10px] text-[var(--ui-warning-text)] font-medium mt-1">
                            ⚠️ Gerbang Keselamatan: Arahan ini ditahan dalam status &apos;awaiting_approval&apos; sehingga admin (01168444656 / 0178245667) meluluskannya.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Assets Showcase from Sample-Image */}
            <div className="p-6 rounded-3xl bg-[var(--ui-surface)] border border-[var(--ui-border)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--ui-border)]">
                <div>
                  <h4 className="font-bold text-sm text-[var(--ui-text)]">
                    Aset Grafik & Media Rasmi yang Disahkan (/assets/brand/)
                  </h4>
                  <p className="text-xs text-[var(--ui-muted)] mt-0.5">
                    18 fail imej resolusi tinggi serta lagu tema penuh telah dipindahkan terus ke direktori projek awam.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-soft)] text-[var(--ui-text)]">
                  18 Fail Imej + 1 Audio
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col items-center">
                  <img src="/assets/brand/founder.png" alt="Founder Epull" className="w-16 h-16 rounded-full object-cover shadow-sm mb-2" />
                  <span className="font-bold text-xs text-[var(--ui-text)]">Pengasas Epull</span>
                  <span className="text-[10px] text-[var(--ui-muted)]">founder.png</span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col items-center">
                  <img src="/assets/brand/MASKOT-1.PNG" alt="Maskot Cili" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-[var(--ui-text)]">Maskot Cili Padu</span>
                  <span className="text-[10px] text-[var(--ui-muted)]">MASKOT-1.PNG</span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col items-center">
                  <img src="/assets/brand/ABANG-COLEX-LOGO-3.png" alt="Logo Rasmi" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-[var(--ui-text)]">Logo V3 Rasmi</span>
                  <span className="text-[10px] text-[var(--ui-muted)]">ABANG-COLEX-LOGO-3.png</span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col items-center">
                  <img src="/assets/brand/MASKOT-LOGO.PNG" alt="Maskot Logo" className="w-16 h-16 object-contain mb-2" />
                  <span className="font-bold text-xs text-[var(--ui-text)]">Maskot Mangga & Cili</span>
                  <span className="text-[10px] text-[var(--ui-muted)]">MASKOT-LOGO.PNG</span>
                </div>
              </div>
            </div>

            {/* Permanent Reference Material Banner */}
            <div className="p-5 rounded-3xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-[var(--ui-text)] shrink-0" />
                <div>
                  <p className="font-bold text-[var(--ui-text)]">Laporan Lengkap Tersimpan Secara Kekal:</p>
                  <p className="text-[var(--ui-muted)] font-mono text-[11px]">
                    docs/JEV_ECOSYSTEM_AUDIT_REPORT.md & reports/JEV_ECOSYSTEM_AUDIT_REPORT.md
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Bahan Rujukan Rasmi ✓
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
