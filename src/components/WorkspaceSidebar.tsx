import { useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Moon, Sun, Activity, Bot, Briefcase, Calendar, ChevronRight, Database, FileSpreadsheet, FileText, Flame, FolderOpen, Gauge, Mail, MapPin, MessageSquare, Search, Truck, Video, Zap, CheckSquare } from 'lucide-react';
import type { User } from 'firebase/auth';
import { subscribeAuth } from '@/services/googleAuth';
import { useSupabaseAuth } from '@/services/supabaseAuth';

const groups = [
  { title: 'Bisnes & operasi', items: [
    { id: 'dashboards', label: 'Ringkasan bisnes', icon: Activity },
    { id: 'orders', label: 'Pesanan', icon: Database },
    { id: 'bus_freight', label: 'Logistik & kargo', icon: Truck },
    { id: 'maps', label: 'Peta penghantaran', icon: MapPin },
    { id: 'reviews', label: 'Ulasan pelanggan', icon: Briefcase },
    { id: 'reports', label: 'Laporan', icon: FileText },
  ] },
  { title: 'Intelligence', items: [
    { id: 'discovery', label: 'Brand & semakan JEV', icon: Flame },
    { id: 'chat', label: 'Pembantu AI', icon: Bot },
    { id: 'agent_performance', label: 'Prestasi ejen', icon: Gauge },
    { id: 'plugins', label: 'Integrasi & plugins', icon: Zap },
  ] },
  { title: 'Google Workspace', items: [
    { id: 'gmail', label: 'Gmail', icon: Mail }, { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare }, { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet }, { id: 'forms', label: 'Forms', icon: FolderOpen },
    { id: 'meet', label: 'Meet', icon: Video }, { id: 'chat_workspace', label: 'Workspace Chat', icon: MessageSquare },
  ] },
];

type Props = { activeTab: string; setActiveTab: (tab: string) => void; isToolOrPluginInProgress?: boolean; onOpenCommandPalette?: () => void; theme: 'dark' | 'light'; onToggleTheme: () => void };

export function WorkspaceMobileMenu({ activeTab, setActiveTab }: Pick<Props, 'activeTab' | 'setActiveTab'>) {
  return <select className="ws-mobile-menu" aria-label="Buka modul workspace" value={activeTab} onChange={event => setActiveTab(event.target.value)}>{groups.map(group => <optgroup key={group.title} label={group.title}>{group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}</select>;
}

export function WorkspaceSidebar({ activeTab, setActiveTab, isToolOrPluginInProgress, onOpenCommandPalette, theme, onToggleTheme }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('abangcolek-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [openGroups, setOpenGroups] = useState<string[]>(['Bisnes & operasi', 'Intelligence']);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const activeGroup = groups.find(group => group.items.some(item => item.id === activeTab));
    if (activeGroup) setOpenGroups(current => current.includes(activeGroup.title) ? current : [...current, activeGroup.title]);
  }, [activeTab]);
  useEffect(() => {
    // Keep the selected module visible after navigation from search or the mobile menu.
    navigationRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [activeTab, collapsed, openGroups]);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('abangcolek-sidebar-collapsed', String(next)); } catch { /* Navigation remains usable when browser storage is unavailable. */ }
  };
  const toggleGroup = (title: string) => setOpenGroups(current => current.includes(title) ? current.filter(item => item !== title) : [...current, title]);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState('');
  const [pending, setPending] = useState(false);
  const { user, quickStaffSignIn, signOut } = useSupabaseAuth();
  useEffect(() => subscribeAuth(setGoogleUser), []);
  const staffSignIn = async (role: 'hq_admin' | 'stockist_kt') => {
    if (pending) return;
    setPending(true);
    setAuthError('');
    try { await quickStaffSignIn(role); } catch { setAuthError('Sesi staff tidak dapat dibuka. Cuba semula.'); }
    finally { setPending(false); }
  };
  const staffSignOut = async () => {
    if (pending) return;
    setPending(true);
    setAuthError('');
    try { const result = await signOut(); if (result.error) setAuthError('Log keluar tidak berjaya. Cuba semula.'); }
    catch { setAuthError('Log keluar tidak berjaya. Cuba semula.'); }
    finally { setPending(false); }
  };
  return <aside className={`ws-sidebar ${collapsed ? 'ws-sidebar-collapsed' : ''}`} aria-label="Navigasi workspace">
    <div className="ws-brand-row">
      <button className="ws-brand" aria-label="ABANGCOLEK OS — ringkasan bisnes" title="Ringkasan bisnes" onClick={() => setActiveTab('dashboards')}>
        <img src="/assets/brand/ABANG-COLEX-LOGO-2.png" alt="" />
        <span className="ws-label"><strong>ABANGCOLEK<span>OS</span></strong><small>Business workspace</small></span>
      </button>
      <button className="ws-collapse" onClick={toggleCollapsed} aria-label={collapsed ? 'Luaskan sidebar' : 'Kecilkan sidebar'} title={collapsed ? 'Luaskan sidebar' : 'Kecilkan sidebar'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
    </div>
    <div className="ws-workspace-card"><span className="ws-workspace-mark">AC</span><span className="ws-label"><strong>ABANGCOLEK workspace</strong><small>Operasi · AI · Workspace</small></span><span className="ws-workspace-count ws-label">18</span></div>
    <button className="ws-search" onClick={onOpenCommandPalette} aria-label="Cari modul dan arahan workspace" title="Cari modul dan arahan (Ctrl K)"><Search size={18} /><span className="ws-label">Cari modul & arahan</span><kbd className="ws-label">Ctrl K</kbd></button>
    <nav ref={navigationRef} className="ws-navigation">{groups.map((group, index) => {
      const open = collapsed || openGroups.includes(group.title);
      return <section key={group.title} className="ws-nav-group" aria-label={group.title}>
        {!collapsed && <button className="ws-group-toggle" aria-expanded={open} aria-controls={`ws-group-${index}`} onClick={() => toggleGroup(group.title)}><span>{group.title}</span><span className="ws-group-count">{group.items.length}</span><ChevronRight size={14} /></button>}
        <div id={`ws-group-${index}`} hidden={!open}>{group.items.map(item => <button className="ws-route" key={item.id} aria-label={item.label} title={collapsed ? item.label : undefined} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => setActiveTab(item.id)}><item.icon size={18} /><span className="ws-label">{item.label}</span>{item.id === 'chat' && isToolOrPluginInProgress && <span className="ws-running" aria-label="Pembantu AI aktif">{collapsed ? '•' : 'Aktif'}</span>}</button>)}</div>
      </section>;
    })}</nav>
    <div className="ws-account">
      <button className="ws-theme-toggle" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Tukar kepada tema cerah' : 'Tukar kepada tema gelap'} title={theme === 'dark' ? 'Tema cerah' : 'Tema gelap'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span className="ws-label">{theme === 'dark' ? 'Tema gelap' : 'Tema cerah'}</span><span className="ws-theme-switch ws-label" aria-hidden="true"><i /></span></button>
      <button className="ws-google" aria-label={googleUser ? 'Buka Google Workspace disambung' : 'Sambungkan Google Workspace'} title="Google Workspace" onClick={() => setActiveTab('gmail')}><span className={`ws-account-dot ${googleUser ? 'ws-connected' : ''}`} /><span className="ws-label"><strong>Google Workspace</strong><small>{googleUser?.displayName || (googleUser ? 'Sesi disambung' : 'Sambungkan akaun')}</small></span>{!collapsed && <ChevronRight size={14} />}</button>
      <button className="ws-account-toggle" aria-label="Urus sesi dan peranan pasukan" title="Urus sesi pasukan" aria-expanded={accountOpen} aria-controls="ws-staff-actions" onClick={() => setAccountOpen(current => !current)}><span className="ws-avatar">AC</span><span className="ws-label"><strong>{user ? 'Workspace staff' : 'Akses pasukan'}</strong><small>{user?.email || 'Urus sesi & peranan'}</small></span>{!collapsed && <ChevronRight size={14} />}</button>
      <div id="ws-staff-actions" className="ws-staff-actions" hidden={!accountOpen} aria-busy={pending}><button disabled={pending} title="HQ Admin" onClick={() => staffSignIn('hq_admin')}>HQ Admin</button><button disabled={pending} title="Stokis KT" onClick={() => staffSignIn('stockist_kt')}>Stokis KT</button>{user && <button disabled={pending} title="Log keluar" onClick={staffSignOut}>Log keluar</button>}</div>
      {authError && <p role="alert" className="ws-error">{authError}</p>}
    </div>
  </aside>;
}
