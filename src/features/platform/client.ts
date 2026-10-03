import { useCallback, useEffect, useRef, useState } from 'react';
import type { Result, SessionData } from '../../../shared/platform-contracts';

let csrfToken = '';
let authEpoch = 0;
let tokenGeneration = 0;
const uncertainOperations = new Map<string, { key: string; expiresAt: number }>();
export class PlatformError extends Error {
  constructor(public readonly code: string, message: string, public readonly requestId?: string) { super(message); this.name = 'PlatformError'; }
}

export function resetPendingOperations() { uncertainOperations.clear(); }
export function resetClientSession() { authEpoch++; csrfToken = ''; resetPendingOperations(); }
/** Used only by the same-origin SDK adapter; this is a CSRF token, never a provider key. */
export function currentCsrfToken() { return csrfToken; }

export interface ResourcePage<T> { data:T; total:number|null; nextOffset:number|null }
export async function apiPage<T>(path: string, options: RequestInit = {}): Promise<ResourcePage<T>> {
  const requestEpoch = authEpoch;
  const identityRequest = path === '/session' || path.startsWith('/auth/');
  const tokenRequest = identityRequest ? ++tokenGeneration : tokenGeneration;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new PlatformError('INVALID_PATH', 'Laluan request tidak sah.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort, { once: true });
  if (options.signal?.aborted) controller.abort();
  let fingerprint: string | null = null;
  try {
    const method = options.method?.toUpperCase() ?? 'GET';
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    if (!['GET', 'HEAD'].includes(method)) {
      if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
      if (!headers.has('Idempotency-Key')) {
        if (typeof options.body === 'string') {
          const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${method}:${path}:${options.body}`));
          fingerprint = [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
          const pending = uncertainOperations.get(fingerprint);
          if (pending && pending.expiresAt <= Date.now()) throw new PlatformError('PENDING_RECONCILIATION', 'Receipt operasi terdahulu belum diketahui. Semak rekod sebelum memulakan request baharu.');
          // A full bounded queue is a visible reconciliation gate, never a silently fresh retry.
          if (!pending && uncertainOperations.size >= 100) throw new PlatformError('PENDING_RECONCILIATION', 'Semak request tertunda sebelum memulakan operasi baharu.');
          const key = pending?.key ?? crypto.randomUUID();
          uncertainOperations.set(fingerprint, { key, expiresAt: Date.now() + 15 * 60_000 });
          headers.set('Idempotency-Key', key);
        } else headers.set('Idempotency-Key', crypto.randomUUID());
      }
    }
    const response = await fetch(`/api/platform${path}`, { ...options, method, headers, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
    const body = await response.json().catch(() => null) as Result<T> | null;
    if (!body || typeof body !== 'object' || typeof body.ok !== 'boolean') throw new PlatformError('INVALID_RESPONSE', 'Server tidak memberikan receipt yang sah. Cuba semula selepas semak status.');
    if (body.ok === false) { if (fingerprint && response.status < 500) uncertainOperations.delete(fingerprint); throw new PlatformError(body.code, body.message ?? 'Operasi tidak dapat disahkan.', body.requestId); }
    if (!response.ok) throw new PlatformError('HTTP_ERROR', 'Server menolak request.');
    if (fingerprint) uncertainOperations.delete(fingerprint);
    if (requestEpoch === authEpoch && tokenRequest === tokenGeneration && identityRequest && body.data && typeof body.data === 'object' && 'csrfToken' in body.data && typeof body.data.csrfToken === 'string') csrfToken = body.data.csrfToken;
    const total=response.headers.get('X-Total-Count'),next=response.headers.get('X-Next-Offset');
    const parse=(value:string|null)=>value&&/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):null;
    return {data:body.data,total:parse(total),nextOffset:parse(next)};
  } catch (error) {
    if (error instanceof PlatformError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new PlatformError('TIMEOUT', 'Request terganggu. Semak senarai rekod sebelum mencuba submit semula.');
    throw new PlatformError('UNAVAILABLE', 'Server tidak dapat dicapai. Draft belum diterima.');
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', onAbort); }
}

export async function api<T>(path:string,options:RequestInit={}) {return (await apiPage<T>(path,options)).data;}
export function pagePath(path:string,offset:number){
  const [pathname,query='']=path.split('?');const params=new URLSearchParams(query);params.set('offset',String(offset));
  return `${pathname}?${params}`;
}

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [nextOffset,setNextOffset]=useState<number|null>(null);
  const [total,setTotal]=useState<number|null>(null);
  const [loadingMore,setLoadingMore]=useState(false);
  const generation=useRef(0),moreController=useRef<AbortController|null>(null),moreBusy=useRef(false);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController(); let active = true;generation.current++;
    moreController.current?.abort();moreBusy.current=false;
    setData(null);setNextOffset(null);setTotal(null);setLoadingMore(false);setError('');setLoading(true);
    apiPage<T>(path, { signal: controller.signal }).then(page => { if (active){setData(page.data);setNextOffset(page.nextOffset);setTotal(page.total);} }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Rekod tidak tersedia.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort();moreController.current?.abort();generation.current++; };
  }, [path, revision]);
  const loadMore=useCallback(async()=>{
    if(nextOffset===null||moreBusy.current)return;
    moreBusy.current=true;setLoadingMore(true);setError('');
    const current=generation.current,controller=new AbortController();moreController.current=controller;
    try {
      const page=await apiPage<T>(pagePath(path,nextOffset),{signal:controller.signal});
      if(current!==generation.current)return;
      if(!Array.isArray(page.data)||page.nextOffset!==null&&page.nextOffset<=nextOffset)throw new PlatformError('INVALID_PAGE','Pagination server tidak sah. Muat semula senarai.');
      setData(previous=>([...(Array.isArray(previous)?previous:[]),...page.data as unknown[]] as T));setNextOffset(page.nextOffset);setTotal(page.total);
    }catch(reason){if(current===generation.current)setError(reason instanceof Error?reason.message:'Halaman seterusnya tidak tersedia.');}
    finally{if(current===generation.current){moreBusy.current=false;setLoadingMore(false);}}
  },[path,nextOffset]);
  return { data, error, loading, reload,loadMore,hasMore:nextOffset!==null,total,loadingMore };
}

export function jsonMutation(body: unknown, method = 'POST'): RequestInit { return { method, body: JSON.stringify(body) }; }
