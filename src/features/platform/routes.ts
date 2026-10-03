import type { NavigationItem, RouteMatch, WorkspaceRole } from '../../../shared/platform-contracts';

const publicPaths = new Set(['/', '/products', '/locations', '/become-dealer', '/help', '/login', '/setup']);
const menus: Record<WorkspaceRole, [string, string][]> = {
  customer: [['overview', 'Ruang saya'], ['shop', 'Beli produk'], ['orders', 'Pesanan saya'], ['cases', 'Bantuan & aduan'], ['business', 'Ejen & stokis']],
  staff: [['overview', 'Hari ini'], ['tasks', 'Tugasan saya'], ['orders', 'Pesanan assigned'], ['cases', 'Khidmat pelanggan'], ['qc', 'Kawalan kualiti'], ['shifts', 'Shift & handoff'], ['documents', 'Dokumen'], ['knowledge', 'Panduan kerja']],
  founder: [['overview', 'Ringkasan bisnes'], ['orders', 'Pesanan & pembayaran'], ['inventory', 'Stok & batch'], ['cases', 'Quality & JEV'], ['jev', 'JEV review & evaluation'], ['dealers', 'Ejen & stokis'], ['marketing', 'Marketing studio'], ['tasks', 'Tugasan'], ['documents', 'Dokumen'], ['knowledge', 'SOP & pengetahuan'], ['calendar', 'Kalendar operasi'], ['finance', 'Kewangan'], ['qc', 'Kawalan kualiti'], ['shifts', 'Shift & day-close'], ['reports', 'Laporan'], ['people', 'Pasukan & akses'], ['settings', 'Tetapan'], ['legacy', 'Workspace integrasi']],
  developer: [['overview', 'System overview'], ['health', 'Runtime & integrasi'], ['jobs', 'Automation jobs'], ['jev','JEV evaluation'], ['reports', 'Diagnostics'], ['settings', 'Readiness settings']],
};
const entitySections = new Set(['orders', 'cases', 'tasks', 'documents', 'business', 'marketing','dealers','inventory','qc','shifts','finance']);

export function resolveRoute(pathname: string): RouteMatch {
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.length > 500) return { kind: 'not_found', path: pathname };
  let path: string;
  try { path = decodeURIComponent(pathname).replace(/\/$/, '') || '/'; }
  catch { return { kind: 'not_found', path: pathname }; }
  if (publicPaths.has(path)) return { kind: 'public', path };
  const parts = path.slice(1).split('/');
  if (parts.some(part => !/^[a-zA-Z0-9_-]+$/.test(part))) return { kind: 'not_found', path };
  if (parts[0] === 'products' && parts.length === 2) return { kind: 'public', path, entityId: parts[1] };
  if (parts[0] === 'flows' && parts.length === 2) return { kind: 'flow', path, entityId: parts[1] };
  const role = parts[0] as WorkspaceRole;
  if (!Object.hasOwn(menus, role) || parts.length > 3) return { kind: 'not_found', path };
  const section = parts[1] ?? 'overview';
  if (!menus[role].some(([id]) => id === section) || (parts.length === 3 && !entitySections.has(section))) return { kind: 'not_found', path };
  return { kind: 'workspace', path: parts.length === 1 ? `/${role}/overview` : path, role, entityId: parts[2] };
}

export function getNavigation(role: WorkspaceRole): NavigationItem[] {
  return menus[role].map(([id, label]) => ({ id, label, path: `/${role}/${id}`, requiredCapability: `workspace.${role}` }));
}

export function canOpenWorkspace(role: WorkspaceRole, roles: WorkspaceRole[]): boolean { return roles.includes(role); }
