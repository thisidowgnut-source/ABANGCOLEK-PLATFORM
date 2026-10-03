/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  Trash2, 
  RefreshCw, 
  HelpCircle, 
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  Star,
  Layers,
  Activity,
  Plane,
  Building,
  Palette,
  GitPullRequest,
  Cpu,
  Database,
  BarChart3,
  Heart,
  Mail,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  pluginManager, 
  PluginItem, 
  PluginCategory, 
  PLUGIN_CATEGORIES 
} from '@/services/pluginService';

interface PluginsViewProps {
  onAction?: (msg?: string) => void;
}

export const PluginsView: React.FC<PluginsViewProps> = ({ onAction }) => {
  const [plugins, setPlugins] = useState<PluginItem[]>(pluginManager.getAll());
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [authModalPlugin, setAuthModalPlugin] = useState<PluginItem | null>(null);
  const [customEmail, setCustomEmail] = useState('thisisabangcolek@gmail.com');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    return pluginManager.subscribe(() => {
      setPlugins(pluginManager.getAll());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const filteredPlugins = useMemo(() => {
    return plugins.filter(plugin => {
      const matchCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
      const matchSearch = 
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.capabilities.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [plugins, selectedCategory, searchQuery]);

  const installedCount = useMemo(() => plugins.filter(p => p.installed).length, [plugins]);
  const activeCount = useMemo(() => plugins.filter(p => p.installed && p.enabled).length, [plugins]);

  const handleInstallClick = (plugin: PluginItem) => {
    if (plugin.requiresAuth && !plugin.connectedAccount) {
      setAuthModalPlugin(plugin);
    } else {
      pluginManager.installPlugin(plugin.id);
      showToast(`Plugin ${plugin.name} berjaya dipasang dan diaktifkan.`);
    }
  };

  const handleConfirmAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authModalPlugin) return;
    pluginManager.connectAccount(authModalPlugin.id, customEmail.trim() || 'thisisabangcolek@gmail.com');
    showToast(`Akaun ${customEmail} berjaya disahkan dan disambungkan ke ${authModalPlugin.name}!`);
    setAuthModalPlugin(null);
  };

  const handleToggle = (id: string, name: string) => {
    pluginManager.togglePluginEnabled(id);
    const updated = pluginManager.getById(id);
    showToast(`Plugin ${name} ${updated?.enabled ? 'diaktifkan' : 'dinyahaktifkan'}.`);
  };

  const handleUninstall = (id: string, name: string) => {
    pluginManager.uninstallPlugin(id);
    showToast(`Plugin ${name} telah dinyahpasang.`);
  };

  const handleTestPrompt = (prompt: string) => {
    if (onAction) {
      onAction(prompt);
    }
  };

  const renderIcon = (type: string, color: string) => {
    const props = { size: 22, style: { color } };
    switch (type) {
      case 'Mail': return <Mail {...props} />;
      case 'HardDrive': return <HardDrive {...props} />;
      case 'Palette': return <Palette {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'GitPullRequest': return <GitPullRequest {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'Database': return <Database {...props} />;
      case 'BarChart3': return <BarChart3 {...props} />;
      case 'Plane': return <Plane {...props} />;
      case 'Building': return <Building {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Heart': return <Heart {...props} />;
      default: return <Zap {...props} />;
    }
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 bg-[var(--ui-surface)] text-[var(--ui-text)] px-5 py-3 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-2 border border-[var(--ui-border)]"
            >
              <CheckCircle2 size={16} className="text-[var(--ui-success-text)]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Header */}
        <div className="bg-[var(--ui-surface)] text-[var(--ui-text)] p-6 md:p-8 rounded-[32px] border border-[var(--ui-border)] shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[var(--ui-soft)] text-[var(--ui-text)] border border-[var(--ui-border)] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={12} className="text-[var(--ui-warning-text)] fill-amber-400" />
                ChatGPT & AI Studio Plugins Hub
              </span>
              <span className="text-[var(--ui-muted)] text-xs">
                {installedCount} Dipasang · {activeCount} Aktif
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Gedung Plugin & Sambungan Pihak Ketiga
            </h1>
            <p className="text-[var(--ui-muted)] text-xs md:text-sm leading-relaxed">
              Tingkatkan keupayaan pembantu AI daripada sekadar menjawab soalan kepada pembantu pintar yang berinteraksi secara terus dengan akaun luaran anda — daripada Gmail, Canva, GitHub, Skyscanner, Supabase, hingga ke peranti COROS.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari plugin mengikut fungsi (cth: penerbangan, Canva, SQL, PR)..."
                className="w-full bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-full pl-10 pr-4 py-2 text-xs text-[var(--ui-text)] placeholder:text-[var(--ui-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onAction && onAction("Tolong semak status semua plugin yang aktif dan cadangkan tindakan operasi.")}
                className="px-4 py-2 rounded-full bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Bot size={14} />
                <span>Tanya Ejen di Sembang</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 border-b border-[var(--ui-border)] pb-2 overflow-x-auto">
          {PLUGIN_CATEGORIES.map((cat) => {
            const count = cat.id === 'all' 
              ? plugins.length 
              : plugins.filter(p => p.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0",
                  isSelected
                    ? "bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] shadow-xs"
                    : "text-[var(--ui-muted)] hover:text-[var(--ui-text)] hover:bg-black/5"
                )}
              >
                <span>{cat.label}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isSelected ? "bg-[var(--ui-soft)] text-[var(--ui-text)]" : "bg-[var(--ui-soft)] text-[var(--ui-text)]"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Plugins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlugins.length === 0 ? (
            <div className="col-span-2 text-center py-16 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)]">
              <Search size={32} className="mx-auto text-[var(--ui-muted)] mb-3" />
              <p className="text-[var(--ui-text)] font-semibold text-sm">Tiada plugin dijumpai bagi carian "{searchQuery}"</p>
              <p className="text-[var(--ui-muted)] text-xs mt-1">Cuba pilih kategori lain atau padamkan kata kunci carian.</p>
            </div>
          ) : (
            filteredPlugins.map((plugin) => (
              <div 
                key={plugin.id}
                className={cn(
                  "bg-[var(--ui-surface)] p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]",
                  plugin.installed 
                    ? plugin.enabled 
                      ? "border-[var(--ui-border)] shadow-sm ring-1 ring-black/5" 
                      : "border-[var(--ui-border)] opacity-80" 
                    : "border-[var(--ui-border)] hover:border-[var(--ui-border)]"
                )}
              >
                <div className="space-y-4">
                  {/* Top Row: Icon, Title & Primary Action */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--ui-border)]"
                        style={{ backgroundColor: `${plugin.accentColor}15` }}
                      >
                        {renderIcon(plugin.iconType, plugin.accentColor)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[var(--ui-text)] tracking-tight">{plugin.name}</h3>
                          {plugin.installed && plugin.enabled && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--ui-muted)] font-medium">
                          {plugin.developer} · v{plugin.version}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--ui-muted)] font-medium">
                          <span className="flex items-center text-[var(--ui-warning-text)] font-bold">
                            <Star size={11} className="fill-amber-400 mr-0.5" />
                            {plugin.rating}
                          </span>
                          <span>·</span>
                          <span>{plugin.reviewCount.toLocaleString()} pengguna</span>
                        </div>
                      </div>
                    </div>

                    {/* Install / Toggle Action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {!plugin.installed ? (
                        <button
                          onClick={() => handleInstallClick(plugin)}
                          className="px-4 py-2 bg-[var(--ui-primary)] hover:bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Pasang</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(plugin.id, plugin.name)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                              plugin.enabled 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : "bg-[var(--ui-soft)] text-[var(--ui-muted)] border-[var(--ui-border)]"
                            )}
                          >
                            {plugin.enabled ? 'Aktif' : 'Nyahaktif'}
                          </button>

                          <button
                            onClick={() => handleUninstall(plugin.id, plugin.name)}
                            title="Nyahpasang Plugin"
                            className="p-1.5 rounded-full text-[var(--ui-muted)] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
                    {plugin.description}
                  </p>

                  {/* Connected Account Badge */}
                  {plugin.installed && (
                    <div className="p-2.5 rounded-xl bg-[var(--ui-soft)] border border-[var(--ui-border)] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-[var(--ui-text)] truncate">
                        <Lock size={12} className="text-[var(--ui-muted)] shrink-0" />
                        <span className="font-medium truncate">
                          {plugin.connectedAccount ? `Akaun: ${plugin.connectedAccount}` : 'Tiada akaun peribadi diperlukan'}
                        </span>
                      </div>
                      {plugin.requiresAuth && (
                        <button
                          onClick={() => setAuthModalPlugin(plugin)}
                          className="text-xs font-semibold text-[var(--ui-accent-text)] hover:underline shrink-0 ml-2"
                        >
                          Tukar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Capabilities List */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block">
                      Kebolehan Utama:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {plugin.capabilities.map((cap, i) => (
                        <span key={i} className="text-[11px] text-[var(--ui-muted)] bg-[var(--ui-soft)] px-2 py-0.5 rounded-md font-medium">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Example Prompts to Try */}
                <div className="mt-5 pt-4 border-t border-[var(--ui-border)] space-y-2">
                  <span className="text-[10px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block">
                    Cuba Arahan di Sembang:
                  </span>
                  <div className="space-y-1.5">
                    {plugin.examplePrompts.slice(0, 2).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleTestPrompt(prompt)}
                        className="w-full text-left p-2 rounded-xl bg-[var(--ui-soft)] [@media(hover:hover)_and_(pointer:fine)]:hover:brightness-95 text-[11px] text-[var(--ui-text)] font-medium transition-colors flex items-center justify-between group cursor-pointer border border-[var(--ui-border)]"
                      >
                        <span className="truncate pr-2">"{prompt}"</span>
                        <ArrowRight size={12} className="text-[var(--ui-muted)] group-hover:text-[var(--ui-text)] shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* How It Works Guide Banner */}
        <div className="p-6 md:p-8 bg-[var(--ui-surface)] rounded-3xl border border-[var(--ui-border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-[var(--ui-accent-text)]" />
            <h2 className="text-base font-bold text-[var(--ui-text)] tracking-tight">
              Cara Ia Berfungsi (Plugins Architecture)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[var(--ui-muted)] leading-relaxed font-medium">
            <div className="space-y-2 p-4 bg-[var(--ui-soft)] rounded-2xl border border-[var(--ui-border)]">
              <span className="w-6 h-6 rounded-full bg-[var(--ui-surface)] text-[var(--ui-text)] font-bold text-xs flex items-center justify-center">1</span>
              <h4 className="font-bold text-[var(--ui-text)] text-sm">Pilih & Pasang Plugin</h4>
              <p>
                Cari fungsi yang anda mahukan di halaman Plugins ini dan klik ikon tambah (<strong>+ Pasang</strong>) pada plugin kegemaran anda.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-[var(--ui-soft)] rounded-2xl border border-[var(--ui-border)]">
              <span className="w-6 h-6 rounded-full bg-[var(--ui-surface)] text-[var(--ui-text)] font-bold text-xs flex items-center justify-center">2</span>
              <h4 className="font-bold text-[var(--ui-text)] text-sm">Sahkan Log Masuk / Akaun</h4>
              <p>
                Sahkan sambungan log masuk akaun anda (jika plugin memerlukan akses akaun peribadi seperti Gmail, Canva, GitHub, atau COROS).
              </p>
            </div>

            <div className="space-y-2 p-4 bg-[var(--ui-soft)] rounded-2xl border border-[var(--ui-border)]">
              <span className="w-6 h-6 rounded-full bg-[var(--ui-surface)] text-[var(--ui-text)] font-bold text-xs flex items-center justify-center">3</span>
              <h4 className="font-bold text-[var(--ui-text)] text-sm">Taip Arahan di Sembang</h4>
              <p>
                Taip arahan semula jadi dalam sembang (cth: <em>"Cari tiket penerbangan ke Tokyo di Skyscanner"</em>), dan model AI akan mengaktifkan plugin berkaitan secara automatik!
              </p>
            </div>
          </div>
        </div>

        {/* Auth Verification Modal */}
        {authModalPlugin && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[var(--ui-surface)] rounded-3xl max-w-md w-full p-6 md:p-8 space-y-5 border border-[var(--ui-border)] shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${authModalPlugin.accentColor}15` }}
                >
                  {renderIcon(authModalPlugin.iconType, authModalPlugin.accentColor)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--ui-text)]">{authModalPlugin.name}</h3>
                  <p className="text-xs text-[var(--ui-muted)] font-medium">Sahkan Sambungan Akaun Pihak Ketiga</p>
                </div>
              </div>

              <div className="p-4 bg-[var(--ui-soft)] rounded-2xl border border-[var(--ui-border)] space-y-2 text-xs">
                <span className="font-bold text-[var(--ui-text)] block">Kebenaran yang Diminta:</span>
                <ul className="space-y-1 text-[var(--ui-muted)] list-disc list-inside">
                  <li>Membaca data berkaitan mengikut arahan sembang anda</li>
                  <li>Melaksanakan tindakan yang disahkan (cth: menjana reka bentuk / membuka carian)</li>
                  <li>Tiada perkongsian data sulit kepada pihak lain</li>
                </ul>
              </div>

              <form onSubmit={handleConfirmAuth} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[var(--ui-muted)] uppercase tracking-wider block mb-1">
                    E-mel Akaun Luaran
                  </label>
                  <input 
                    type="email" 
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                    placeholder="nama@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-[var(--ui-soft)] border border-[var(--ui-border)] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ui-accent)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthModalPlugin(null)}
                    className="px-4 py-2 text-xs font-semibold text-[var(--ui-muted)] hover:text-[var(--ui-text)] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[var(--ui-primary)] hover:bg-[var(--ui-primary)] text-[var(--ui-primary-ink)] text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>Sahkan Sambungan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
