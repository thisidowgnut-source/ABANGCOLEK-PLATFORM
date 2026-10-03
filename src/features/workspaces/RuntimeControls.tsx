import { useState } from 'react';
import { api, jsonMutation, useResource } from '../platform/client';
import { Panel, ResourceState, Status } from './ui';
interface Controls { version: number; workerAdmission: 'running' | 'paused'; activeRelease: 'platform-local-v1' | 'platform-local-readonly-v1'; updatedAt: string }
interface Quotas { providerId: string; observedUnits: number | null; limitUnits: number | null; available: boolean; reasonCode?: string }
export function RuntimeControls() {
  const controls = useResource<Controls>('/runtime-controls'); const quotas = useResource<Quotas[]>('/quotas');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function change(patch: Partial<Pick<Controls, 'workerAdmission' | 'activeRelease'>>) {
    if (!controls.data || busy) return;
    setBusy(true); setError('');
    try { await api('/runtime-controls', jsonMutation({ expectedVersion: controls.data.version, ...patch })); controls.reload(); quotas.reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Kawalan belum disahkan.'); }
    finally { setBusy(false); }
  }
  return <Panel title="Kawalan runtime" eyebrow="Versioned operational controls">
    <ResourceState {...controls}/><ResourceState {...quotas}/>
    {controls.data && <><p>Worker <Status value={controls.data.workerAdmission}/> · version {controls.data.version}</p><p>Mod: {controls.data.activeRelease === 'platform-local-readonly-v1' ? 'Read-only: rekod bisnes dikekalkan, perubahan dihentikan' : 'Operasi setempat aktif'}</p><div className="xp-actions"><button disabled={busy} className="xp-button xp-secondary" onClick={() => void change({ workerAdmission: controls.data!.workerAdmission === 'running' ? 'paused' : 'running' })}>{controls.data.workerAdmission === 'running' ? 'Pause worker' : 'Resume worker'}</button><button disabled={busy} className="xp-button xp-secondary" onClick={() => void change({ activeRelease: controls.data!.activeRelease === 'platform-local-v1' ? 'platform-local-readonly-v1' : 'platform-local-v1' })}>{controls.data.activeRelease === 'platform-local-v1' ? 'Aktifkan read-only' : 'Pulihkan operasi'}</button></div><p className="xp-muted">Kawalan ini tidak memadam database atau membatalkan side effect luar yang sudah berlaku.</p></>}
    {Array.isArray(quotas.data) && <dl className="xp-detail-grid">{quotas.data.map(quota => <div key={quota.providerId}><dt>{quota.providerId}</dt><dd>{quota.observedUnits === null ? 'Usage belum diketahui' : `${quota.observedUnits} / ${quota.limitUnits ?? 'limit belum diketahui'}`}</dd><Status value={quota.available ? 'available' : 'unavailable'}/></div>)}</dl>}
    {error && <p className="xp-inline-error" role="alert">{error}</p>}
  </Panel>;
}
