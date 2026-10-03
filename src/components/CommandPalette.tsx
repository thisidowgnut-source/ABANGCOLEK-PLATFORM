/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Flame,
  Bot,
  Truck,
  Zap,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Video,
  MessageSquare,
  MapPin,
  Gauge,
  Activity,
  Database,
  Briefcase,
  Play,
  Share2,
  PhoneCall,
  UserCheck,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Workspaces' | 'Google Workspace' | 'Operasi & Data' | 'Tindakan Pantas' | 'Staf & Sesi';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string) => void;
  onTriggerAction?: (actionPrompt: string) => void;
  onSwitchStaff?: (role: 'hq_admin' | 'stockist_kt') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerAction,
  onSwitchStaff,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input whenever palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Construct command list
  const commandItems: CommandItem[] = useMemo(() => {
    return [
      // Workspaces & AI
      {
        id: 'nav-discovery',
        title: 'Abang Colek Hub',
        subtitle: 'Hab penemuan jenama, Pitch Deck 15-slaid, TikTok hooks, jingle player',
        category: 'Workspaces',
        icon: Flame,
        badge: 'v4.2',
        keywords: ['hub', 'discovery', 'brand', 'pitch', 'deck', 'tiktok', 'jingle', 'booth', 'wocs'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'nav-chat',
        title: 'Agent Chat (AI Operations)',
        subtitle: 'Sembang terus dengan ejen operasi Gemini 2.5 dengan alat Workspace & Plugins',
        category: 'Workspaces',
        icon: Bot,
        badge: 'Gemini',
        keywords: ['chat', 'agent', 'ai', 'tanya', 'gemini', 'bantuan'],
        action: () => {
          onNavigateTab('chat');
          onClose();
        },
      },
      {
        id: 'nav-bus-freight',
        title: 'Ekspres Bas & Ejen',
        subtitle: 'Penjejakan kargo bas ekspres TBS-MBKT, amaran 1 jam WhatsApp, DuitNow QR',
        category: 'Workspaces',
        icon: Truck,
        badge: 'SOP 1 Jam',
        keywords: ['bas', 'bus', 'freight', 'kargo', 'tbs', 'mbkt', 'larkin', 'ejen', 'stokis', 'duitnow'],
        action: () => {
          onNavigateTab('bus_freight');
          onClose();
        },
      },
      {
        id: 'nav-plugins',
        title: 'Gedung Plugins 3P',
        subtitle: '12 Plugin aktif: Skyscanner, Booking, Canva, Adobe, GitHub, Vercel, Mixpanel',
        category: 'Workspaces',
        icon: Zap,
        badge: '12 Aktif',
        keywords: ['plugins', 'skyscanner', 'canva', 'booking', 'adobe', 'github', 'vercel', 'mixpanel'],
        action: () => {
          onNavigateTab('plugins');
          onClose();
        },
      },
      {
        id: 'nav-agent-perf',
        title: 'Prestasi Agen AI',
        subtitle: 'Telemetri kependaman masa nyata (<50ms), carta Recharts, ralat dan panggilan tool',
        category: 'Workspaces',
        icon: Gauge,
        badge: 'Recharts',
        keywords: ['prestasi', 'agent', 'performance', 'latency', 'telemetri', 'recharts', 'chart'],
        action: () => {
          onNavigateTab('agent_performance');
          onClose();
        },
      },

      // Google Workspace 8-APIs
      {
        id: 'nav-gmail',
        title: 'Gmail',
        subtitle: 'Kotak masuk rasmi, draf emel permohonan maaf dan baucar ganti rugi botol',
        category: 'Google Workspace',
        icon: Mail,
        keywords: ['gmail', 'email', 'emel', 'inbox', 'surat'],
        action: () => {
          onNavigateTab('gmail');
          onClose();
        },
      },
      {
        id: 'nav-calendar',
        title: 'Google Calendar',
        subtitle: 'Jadual acara gerai, festival makanan jelajah, dan taklimat stokis',
        category: 'Google Workspace',
        icon: Calendar,
        keywords: ['calendar', 'kalendar', 'jadual', 'event', 'mesyuarat'],
        action: () => {
          onNavigateTab('calendar');
          onClose();
        },
      },
      {
        id: 'nav-tasks',
        title: 'Google Tasks',
        subtitle: 'Senarai tugasan siasatan kualiti QC, nombor lot botol dan SOP krew',
        category: 'Google Workspace',
        icon: CheckSquare,
        keywords: ['tasks', 'tugasan', 'todo', 'checklist', 'senarai'],
        action: () => {
          onNavigateTab('tasks');
          onClose();
        },
      },
      {
        id: 'nav-docs',
        title: 'Google Docs',
        subtitle: 'Penyuntingan dokumen SOP, minit mesyuarat pengasas, dan manifesto jenama',
        category: 'Google Workspace',
        icon: FileText,
        keywords: ['docs', 'dokumen', 'sop', 'surat', 'manifesto'],
        action: () => {
          onNavigateTab('docs');
          onClose();
        },
      },
      {
        id: 'nav-sheets',
        title: 'Google Sheets',
        subtitle: 'Lejar kiraan stok botol colek, kutipan jualan gerai, dan formula kewangan',
        category: 'Google Workspace',
        icon: FileSpreadsheet,
        keywords: ['sheets', 'spreadsheet', 'excel', 'lejar', 'stok', 'kiraan'],
        action: () => {
          onNavigateTab('sheets');
          onClose();
        },
      },
      {
        id: 'nav-forms',
        title: 'Google Forms',
        subtitle: 'Borang pendaftaran cabutan bertuah (Lucky Draw) dan maklum balas pelanggan',
        category: 'Google Workspace',
        icon: FolderOpen,
        keywords: ['forms', 'borang', 'survey', 'luckydraw', 'maklumbalas'],
        action: () => {
          onNavigateTab('forms');
          onClose();
        },
      },
      {
        id: 'nav-meet',
        title: 'Google Meet',
        subtitle: 'Cipta bilik telesidang Google Meet untuk taklimat staf dan stokis',
        category: 'Google Workspace',
        icon: Video,
        keywords: ['meet', 'video', 'call', 'meeting', 'sidang'],
        action: () => {
          onNavigateTab('meet');
          onClose();
        },
      },
      {
        id: 'nav-chat-ws',
        title: 'Google Chat Workspace',
        subtitle: 'Saluran perbualan pantas pasukan operasi dalaman Abang Colek',
        category: 'Google Workspace',
        icon: MessageSquare,
        keywords: ['chat', 'workspace', 'mesej', 'saluran'],
        action: () => {
          onNavigateTab('chat_workspace');
          onClose();
        },
      },
      {
        id: 'nav-maps',
        title: 'Logistics Map (Google Maps)',
        subtitle: 'Peta armada Google Maps Platform dengan Advanced Marker dan tapisan bandar',
        category: 'Google Workspace',
        icon: MapPin,
        badge: 'GMP',
        keywords: ['maps', 'peta', 'logistics', 'fleet', 'lokasi', 'marker', 'johor', 'terengganu'],
        action: () => {
          onNavigateTab('maps');
          onClose();
        },
      },

      // Operations & Data
      {
        id: 'nav-orders',
        title: 'Pengurusan Pesanan (Orders)',
        subtitle: 'Rekod 80+ transaksi pelanggan, status penghantaran, dan kelulusan refund',
        category: 'Operasi & Data',
        icon: Database,
        keywords: ['orders', 'pesanan', 'jualan', 'refund', 'transaksi'],
        action: () => {
          onNavigateTab('orders');
          onClose();
        },
      },
      {
        id: 'nav-dashboards',
        title: 'Dashboards Analitik',
        subtitle: 'Ringkasan visual KPI hasil jualan, bandar tertinggi, dan aliran tunai gerai',
        category: 'Operasi & Data',
        icon: Activity,
        keywords: ['dashboards', 'kpi', 'metrik', 'analitik', 'hasil'],
        action: () => {
          onNavigateTab('dashboards');
          onClose();
        },
      },
      {
        id: 'nav-reviews',
        title: 'Ulasan & Maklum Balas',
        subtitle: 'Penilaian rasa colek, tahap pedas pelanggan, dan sentimen pasaran',
        category: 'Operasi & Data',
        icon: Briefcase,
        keywords: ['reviews', 'ulasan', 'rating', 'feedback', 'pelanggan'],
        action: () => {
          onNavigateTab('reviews');
          onClose();
        },
      },

      // Quick Actions
      {
        id: 'act-jingle',
        title: 'Mainkan Lagu Tema "Kasi Lagi-Lagi"',
        subtitle: 'Lagu jingle rasmi 1:00 minit (85-95 BPM) dengan lirik karaoke beranimasi',
        category: 'Tindakan Pantas',
        icon: Play,
        badge: 'Audio 🎵',
        keywords: ['jingle', 'lagu', 'kasi', 'lagi', 'muzik', 'audio', 'mp3'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'act-pitch-deck',
        title: 'Buka Pitch Deck 15-Slaid Pelabur',
        subtitle: 'DNA jenama, latar belakang pengasas Megat Shaifulreza, dan unjuran 2026',
        category: 'Tindakan Pantas',
        icon: Sparkles,
        badge: '15 Slaid',
        keywords: ['pitch', 'deck', 'slaid', 'investor', 'pelabur', 'epull', 'visi'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'act-whatsapp-wocs',
        title: '12 Templat Mesej Rasmi WhatsApp WOCS',
        subtitle: 'Templat senarai harga (RM15/RM28/RM50), promosi Beli 3 Percuma 1, dan pendaftaran',
        category: 'Tindakan Pantas',
        icon: Share2,
        badge: 'WhatsApp',
        keywords: ['whatsapp', 'wocs', 'templat', 'mesej', 'harga', 'promosi'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'act-tiktok-hooks',
        title: '10 Cangkuk Viral TikTok @styloairpool',
        subtitle: 'Cangkuk viral capai hingga 210k tontonan dan jadual siaran mingguan 4 hari',
        category: 'Tindakan Pantas',
        icon: Flame,
        badge: 'Viral',
        keywords: ['tiktok', 'cangkuk', 'hooks', 'viral', 'video', 'jadual', 'styloairpool'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'act-jev-test',
        title: 'Uji Aduan Pelanggan (Simulator JEV)',
        subtitle: 'Analisis aduan botol bocor merentasi 7 dimensi dengan kunci Invarian UNDETERMINED',
        category: 'Tindakan Pantas',
        icon: Zap,
        badge: '<50ms',
        keywords: ['jev', 'aduan', 'bocor', 'leakage', 'pecah', 'qc', 'simulator'],
        action: () => {
          onNavigateTab('discovery');
          onClose();
        },
      },
      {
        id: 'act-ask-report',
        title: 'Tanya AI: "Buat ringkasan jualan mingguan"',
        subtitle: 'Arahkan ejen pintar Gemini menganalisis lejar jualan dan menyusun laporan',
        category: 'Tindakan Pantas',
        icon: Bot,
        badge: 'AI Prompt',
        keywords: ['laporan', 'report', 'mingguan', 'jualan', 'kira', 'hasil'],
        action: () => {
          onNavigateTab('chat');
          if (onTriggerAction) {
            onTriggerAction('Tolong buatkan ringkasan prestasi jualan mingguan Abang Colek merentas hab utama.');
          }
          onClose();
        },
      },

      // Staff Switcher
      {
        id: 'staff-hq',
        title: 'Tukar Sesi: HQ Admin (Pusat)',
        subtitle: 'Akses penuh sebagai Pentadbir Utama Operasi Abang Colek di Johor Bahru',
        category: 'Staf & Sesi',
        icon: UserCheck,
        badge: 'HQ JB',
        keywords: ['hq', 'admin', 'staf', 'sesi', 'tukar', 'jb'],
        action: () => {
          if (onSwitchStaff) onSwitchStaff('hq_admin');
          onClose();
        },
      },
      {
        id: 'staff-kt',
        title: 'Tukar Sesi: Stokis KT (Terengganu)',
        subtitle: 'Akses peranan sebagai Pengurus Stokis Wilayah Pantai Timur (MBKT)',
        category: 'Staf & Sesi',
        icon: UserCheck,
        badge: 'Stokis KT',
        keywords: ['stokis', 'kt', 'terengganu', 'mbkt', 'pantai', 'timur'],
        action: () => {
          if (onSwitchStaff) onSwitchStaff('stockist_kt');
          onClose();
        },
      },
    ];
  }, [onNavigateTab, onClose, onTriggerAction, onSwitchStaff]);

  // Filter items based on user query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return commandItems;
    const q = query.toLowerCase().trim();
    return commandItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [commandItems, query]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-24 px-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Dialog Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-[var(--ui-surface)] rounded-3xl shadow-2xl border-2 border-[var(--ui-border)] overflow-hidden flex flex-col max-h-[80vh] z-10 font-sans"
            onKeyDown={handleKeyDown}
          >
            {/* Top Brand Banner Header */}
            <div className="bg-[var(--ui-soft)] px-5 py-3 border-b border-[var(--ui-border)] flex items-center justify-between text-[var(--ui-text)]">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/brand/ABANG-COLEX-LOGO-2.png"
                  alt="Abang Colek"
                  className="h-7 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-sm font-black tracking-tight text-[var(--ui-text)]">
                  ABANG COLEK COMMAND PALETTE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]">
                  Ctrl+K
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--ui-muted)] hover:text-[var(--ui-text)] p-1 rounded-lg hover:bg-[var(--ui-surface)] transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="px-5 py-3.5 bg-[var(--ui-surface)] border-b border-[var(--ui-border)] flex items-center gap-3">
              <Search size={19} className="text-[var(--ui-accent-text)] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Cari workspace, tool, templat WhatsApp, kargo bas, atau arahan AI..."
                className="w-full bg-transparent text-sm md:text-base text-[var(--ui-text)] placeholder:text-[var(--ui-muted)] focus:outline-hidden font-medium"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-[var(--ui-soft)] hover:bg-[var(--ui-soft)] text-[var(--ui-muted)] font-bold transition-colors cursor-pointer"
                >
                  Padam
                </button>
              )}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0 text-[13px]"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Flame size={36} className="text-[var(--ui-muted)] mx-auto mb-2 animate-bounce" />
                  <p className="font-bold text-[var(--ui-text)]">Tiada arahan sepadan dengan carian anda.</p>
                  <p className="text-xs text-[var(--ui-muted)] mt-1">
                    Cuba kata kunci seperti &quot;hub&quot;, &quot;bas&quot;, &quot;jingle&quot;, &quot;pitch&quot;, &quot;gmail&quot;, atau &quot;jev&quot;.
                  </p>
                </div>
              ) : (
                Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <p className="px-3 text-[11px] font-black uppercase tracking-wider text-[var(--ui-accent-text)] flex items-center gap-1.5">
                      <span>•</span>
                      <span>{category}</span>
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const globalIndex = filteredItems.findIndex((fi) => fi.id === item.id);
                        const isSelected = globalIndex === selectedIndex;
                        const ItemIcon = item.icon;

                        return (
                          <button
                            key={item.id}
                            data-index={globalIndex}
                            onClick={() => item.action()}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              "w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all group cursor-pointer border",
                              isSelected
                                ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)] border-[var(--ui-accent)] shadow-md"
                                : "bg-[var(--ui-surface)] text-[var(--ui-text)] border-[var(--ui-border)] hover:border-[var(--ui-border)] hover:bg-[var(--ui-soft)]"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                                  isSelected
                                    ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] border-[var(--ui-border)]"
                                    : "bg-[var(--ui-soft)] text-[var(--ui-accent-text)] border-[var(--ui-border)] group-hover:bg-[var(--ui-soft)]"
                                )}
                              >
                                <ItemIcon size={18} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2 truncate">
                                  <span
                                    className={cn(
                                      "font-black text-sm truncate",
                                      isSelected ? "text-[var(--ui-accent-ink)]" : "text-[var(--ui-text)]"
                                    )}
                                  >
                                    {item.title}
                                  </span>
                                  {item.badge && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                                        isSelected
                                          ? "bg-[var(--ui-accent)] text-[var(--ui-accent-ink)]"
                                          : "bg-[var(--ui-soft)] text-[var(--ui-text)] border border-[var(--ui-border)]"
                                      )}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <p
                                    className={cn(
                                      "text-xs truncate font-medium mt-0.5",
                                      isSelected ? "text-[var(--ui-accent-ink)]" : "text-[var(--ui-muted)]"
                                    )}
                                  >
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[11px] font-black text-[var(--ui-text)] bg-[var(--ui-surface)] px-2 py-1 rounded-lg">
                                  <span>Buka</span>
                                  <CornerDownLeft size={12} />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Keyboard Hint Bar */}
            <div className="bg-[var(--ui-soft)] px-4 py-2.5 border-t border-[var(--ui-border)] flex items-center justify-between text-[11px] text-[var(--ui-muted)] font-medium">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--ui-soft)] text-[var(--ui-text)] font-bold border border-[var(--ui-border)]">
                    ↑↓
                  </kbd>
                  <span>Pilih</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--ui-soft)] text-[var(--ui-text)] font-bold border border-[var(--ui-border)]">
                    ↵ Enter
                  </kbd>
                  <span>Navigasi</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--ui-soft)] text-[var(--ui-text)] font-bold border border-[var(--ui-border)]">
                    Esc
                  </kbd>
                  <span>Tutup</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[var(--ui-muted)] font-bold">
                <span>ABANGCOLEK-OS Navigation Engine</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
