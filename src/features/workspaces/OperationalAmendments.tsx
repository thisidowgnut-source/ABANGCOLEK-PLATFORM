import { useState } from 'react';
import type { DayCloseRecord, ExpenseRecord, SessionData, WorkspaceRole } from '../../../shared/platform-contracts';
import type { CreatedInvitation, DayCloseAmendment, ExpensePosting, InAppActivityFeed, NotificationPreferences, PeopleInvitation, StaffAvailability } from '../../../shared/operation-amendment-contracts';
import { api, jsonMutation, useResource } from '../platform/client';
import { amountToSen, dateLabel, malaysiaDateTime, money } from './experience-model';
import { Empty, FormPanel, MutationButton, Panel, RecordMeta, ResourceState, Status, field, splitRefs } from './ui';

const countedSen = (value: string) => /^0(?:\.0{1,2})?$/.test(value) ? 0 : amountToSen(value);
const malaysiaInput = (stamp: number) => new Date(stamp + 8 * 3600000).toISOString().slice(0, 16);

export function DayCloseAmendments({ onChanged }: { onChanged?: () => void }) {
  const closes = useResource<DayCloseRecord[]>('/dayclose'), history = useResource<DayCloseAmendment[]>('/dayclose/amendments');
  const reload = () => { closes.reload(); history.reload(); onChanged?.(); };
  return <Panel title="Pembetulan closing yang berjejak" eyebrow="Founder approval amendment">
    <ResourceState {...closes}/><ResourceState {...history}/>
    <p className="xp-muted">Pembetulan menyimpan snapshot approval asal dan mengira semula sumber tunai. Rekod kembali kepada review untuk approval baharu.</p>
    {closes.data?.filter(record => record.status === 'approved').map(record => <FormPanel key={`${record.id}:${record.revision}`} title={`${record.outletId} · ${record.date}`} fields={[
      field('countCash', 'Kiraan tunai baharu (RM)', { type: 'number', min: 0, step: '.01', defaultValue: (record.countCashSen / 100).toFixed(2) }),
      field('reason', 'Sebab pembetulan', { type: 'textarea', max: 4000 }),
    ]} submitLabel="Buka semula untuk review" onSubmit={async values => { const result = await api(`/dayclose/${encodeURIComponent(record.id)}/reopen`, jsonMutation({ expectedRevision: record.revision, countCashSen: countedSen(values.countCash), reason: values.reason })); reload(); return result; }}/>) }
    {closes.data?.filter(record => record.status === 'approved').length === 0 && <p>Tiada closing approved yang memerlukan pembetulan.</p>}
    {history.data?.map(record => <article className="xp-list-row" key={record.id}><div><strong>{record.approvedSnapshot.outletId} · {record.approvedSnapshot.date}</strong><p>Snapshot approval v{record.approvedSnapshot.revision} → correction v{record.correctedRevision}</p><p>{record.reason}</p><p className="xp-muted">Tunai asal {money(record.approvedSnapshot.countCashSen)} · variance asal {money(record.approvedSnapshot.discrepancySen)} · {dateLabel(record.createdAt)}</p><RecordMeta id={record.id}/></div></article>)}
    {history.data?.length === 0 && <Empty description="Snapshot approval akan muncul apabila founder membuka semula closing."/>}
  </Panel>;
}

export function ExpensePostings({ onChanged }: { onChanged?: () => void }) {
  const expenses = useResource<ExpenseRecord[]>('/expenses'), postings = useResource<ExpensePosting[]>('/expense-postings');
  const summary=useResource<{recordCount:number;netAmountSen:number;postedExpenseIds:string[];reversedPostingIds:string[];scope:'complete_ledger'}>('/expense-postings/summary');
  const reload = () => { expenses.reload(); postings.reload(); summary.reload(); onChanged?.(); };
  return <Panel title="Expense posting dan reversal" eyebrow="Immutable ledger · integer sen">
    <ResourceState {...expenses}/><ResourceState {...postings}/><ResourceState {...summary}/>
    <p>Net expense yang dipost: <strong>{summary.data ? money(summary.data.netAmountSen) : '—'}</strong></p>
    {summary.data&&<p className="xp-muted">Jumlah daripada seluruh ledger · {summary.data.recordCount} entries termasuk reversals.</p>}
    <p className="xp-muted">Posting merekod pengiktirafan expense approved. Status pembayaran atau settlement bank memerlukan bukti lain dan tidak disahkan oleh ledger ini.</p>
    {expenses.data?.filter(expense => expense.status === 'approved' && summary.data && !summary.data.postedExpenseIds.includes(expense.id)).map(expense => <div className="xp-list-row" key={expense.id}><div><strong>{expense.category} · {money(expense.amountSen)}</strong><p>{expense.outletId} · approval v{expense.revision}</p><RecordMeta id={expense.id}/></div><MutationButton path={`/expenses/${encodeURIComponent(expense.id)}/post`} input={{ expectedRevision: expense.revision }} confirmLabel="Sahkan posting sumber approved" onChanged={reload}>Post expense</MutationButton></div>)}
    {postings.data?.map(record => <article className="xp-expense" key={record.id}><div><Status value={record.kind}/><strong>{money(record.amountSen)}</strong><p>{record.outletId} · {record.reason}</p><RecordMeta id={record.id}/><p className="xp-muted">Source: {record.expenseId}{record.reversesId ? ` · reversal of ${record.reversesId}` : ''}</p></div>{record.kind === 'EXPENSE' && summary.data && !summary.data.reversedPostingIds.includes(record.id) && <FormPanel title="Reverse posting" description="Entry asal dikekalkan. Amaun negatif ditambah sekali untuk mengimbangi posting." fields={[field('reason', 'Sebab reversal', { type: 'textarea', max: 4000 })]} submitLabel="Sahkan reversal" onSubmit={async values => { const result = await api(`/expense-postings/${encodeURIComponent(record.id)}/reverse`, jsonMutation({ reason: values.reason })); reload(); return result; }}/>}</article>)}
    {postings.data?.length === 0 && <Empty description="Belum ada expense approved yang dipost kepada ledger."/>}
  </Panel>;
}

export function PeopleInvitations({ onChanged }: { onChanged?: () => void }) {
  const invitations = useResource<PeopleInvitation[]>('/people/invitations');
  const [created, setCreated] = useState<CreatedInvitation | null>(null), [copyState, setCopyState] = useState('');
  const reload = () => { invitations.reload(); onChanged?.(); };
  return <>
    <FormPanel title="Jemput ahli pasukan" description="Akaun penerima mesti menggunakan email yang sama. Token sekali guna tamat maksimum tujuh hari; role founder penerbit disemak semula semasa acceptance." fields={[
      field('email', 'Email penerima', { type: 'email', max: 254 }),
      field('role', 'Role', { options: [{ value: 'staff', label: 'Staff' }, { value: 'developer', label: 'Developer' }] }),
      field('outletIds', 'Outlet IDs', { required: false, help: 'Staff memerlukan outlet IDs dipisahkan koma; developer tiada outlet.' }),
      field('expiresAt', 'Tamat pada (MYT)', { type: 'datetime-local', defaultValue: malaysiaInput(Date.now() + 48 * 3600000) }),
    ]} submitLabel="Cipta invitation" onSubmit={async values => { const result = await api<CreatedInvitation>('/people/invitations', jsonMutation({ email: values.email, role: values.role, outletIds: splitRefs(values.outletIds), expiresAt: malaysiaDateTime(values.expiresAt) })); setCreated(result); setCopyState(''); reload(); return result; }}/>
    {created && <Panel title="Token invitation sekali guna" eyebrow="Manual handoff · not sent">
      <p>Berikan token kepada {created.email} melalui saluran anda. Penerima login, kemudian gunakan borang Terima invitation dalam personal settings.</p>
      <p><code>{created.token}</code></p><p>Tamat {dateLabel(created.expiresAt)}</p>
      <div className="xp-actions"><button className="xp-button" onClick={() => { void navigator.clipboard.writeText(created.token).then(() => setCopyState('Token disalin.')).catch(() => setCopyState('Copy tidak tersedia. Salin token yang dipaparkan.')); }}>Copy token</button><button className="xp-button xp-secondary" onClick={() => setCreated(null)}>Sembunyikan token</button></div><p role="status">{copyState}</p>
    </Panel>}
    <Panel title="Invitation history" eyebrow="Email-bound · revocable">
      <ResourceState {...invitations}/>
      {invitations.data?.map(record => <div className="xp-list-row" key={record.id}><div><strong>{record.email} · {record.role}</strong><p>{record.outletIds.join(', ') || 'Technical runtime scope'} · tamat {dateLabel(record.expiresAt)}</p><Status value={record.status === 'pending' && record.expiresAt <= new Date().toISOString() ? 'expired' : record.status}/><RecordMeta id={record.id} revision={record.revision}/></div>{record.status === 'pending' && <MutationButton path={`/people/invitations/${encodeURIComponent(record.id)}/revoke`} input={{ expectedRevision: record.revision }} onChanged={reload} confirmLabel="Sahkan revoke invitation">Revoke</MutationButton>}</div>)}
      {invitations.data?.length === 0 && <Empty description="Tiada invitation pasukan yang telah dicipta."/>}
    </Panel>
  </>;
}

export function PersonalOperationalSettings({ role, onChanged }: { role: WorkspaceRole; onChanged?: () => void }) {
  const preferences = useResource<NotificationPreferences>('/notification-preferences');
  const activity = useResource<InAppActivityFeed>('/notifications');
  return <>
    <FormPanel title="Terima invitation" description="Login menggunakan email yang dijemput. Acceptance memberi role yang ditetapkan penerbit; sesi anda perlu dimuat semula untuk navigation baharu." fields={[field('token', 'Invitation token', { type: 'password', max: 200 })]} submitLabel="Terima invitation" onSubmit={async values => { const result = await api('/people/invitations/accept', jsonMutation({ token: values.token })); preferences.reload(); activity.reload(); onChanged?.(); return result; }}/>
    <Panel title="Notification preferences" eyebrow="Your account · in-app scope">
      <ResourceState {...preferences}/>
      {preferences.data && <FormPanel key={preferences.data.revision} title="Tetapan notifikasi sendiri" description="Tetapan ini mengawal pilihan dalam aplikasi. Ia tidak mengaktifkan penghantaran email, SMS atau WhatsApp." fields={[
        field('inAppEnabled', 'Notifikasi dalam aplikasi', { defaultValue: String(preferences.data.inAppEnabled), options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }] }),
        field('topics', 'Topics dipilih', { required: false, defaultValue: preferences.data.topics.join(', '), help: `Scope tersedia: ${preferences.data.allowedTopics.join(', ')}. Pisahkan pilihan dengan koma.` }),
      ]} submitLabel="Simpan preferences" onSubmit={async values => { const result = await api('/notification-preferences', jsonMutation({ expectedRevision: preferences.data!.revision, inAppEnabled: values.inAppEnabled === 'true', topics: splitRefs(values.topics) })); preferences.reload(); activity.reload(); onChanged?.(); return result; }}/>} 
    </Panel>
    <Panel title="Aktiviti dalam aplikasi" eyebrow="Current authorized records" action={<button className="xp-button xp-secondary" onClick={activity.reload}>Muat semula aktiviti</button>}>
      <ResourceState {...activity}/>
      {activity.data && (!activity.data.inAppEnabled ? <p>Notifikasi dalam aplikasi dimatikan dalam preferences anda.</p> : <><p className="xp-muted">Status semasa rekod dalam akses anda. Maksimum 10 rekod terkini bagi setiap topic pilihan.</p>{activity.data.items.map(item => <div className="xp-list-row" key={`${item.topic}:${item.id}`}><div><strong>{item.title}</strong><p>{item.topic} · {item.sourceAt ? dateLabel(item.sourceAt) : 'Tarikh belum diketahui'}</p><RecordMeta id={item.id} revision={item.sourceRevision ?? undefined}/></div><Status value={item.status}/></div>)}{activity.data.items.length === 0 && <Empty description="Tiada aktiviti untuk topic yang dipilih. Semak preferences atau muat semula rekod."/>}</>)}
    </Panel>
    {(role === 'staff' || role === 'founder') && <OwnAvailability onChanged={onChanged}/>}
  </>;
}

function OwnAvailability({ onChanged }: { onChanged?: () => void }) {
  const availability = useResource<StaffAvailability[]>('/availability'), session = useResource<SessionData>('/session');
  const own = availability.data?.find(record => record.userId === session.data?.user.id);
  const reload = () => { availability.reload(); onChanged?.(); };
  return <Panel title="Availability pasukan" eyebrow="Own schedule · revision checked">
    <ResourceState {...availability}/><ResourceState {...session}/>
    <p className="xp-muted">Availability bukan assignment shift. Founder boleh melihat jadual pasukan; setiap orang mengubah jadual sendiri.</p>
    {availability.data && session.data && <FormPanel title="Tambah availability sendiri" fields={[
      field('outletId', 'Outlet ID', { defaultValue: session.data.memberships.find(member => member.role === 'staff' || member.role === 'founder')?.outletIds[0] }),
      field('startAt', 'Mula (MYT)', { type: 'datetime-local' }), field('endAt', 'Tamat (MYT)', { type: 'datetime-local' }),
      field('status', 'Status', { options: [{ value: 'available', label: 'Available' }, { value: 'unavailable', label: 'Unavailable' }] }),
    ]} submitLabel="Tambah availability" onSubmit={async values => { const result = await api('/availability', jsonMutation({ expectedRevision: own?.revision ?? 0, slots: [...(own?.slots ?? []), { outletId: values.outletId, startAt: malaysiaDateTime(values.startAt), endAt: malaysiaDateTime(values.endAt), status: values.status }] })); reload(); return result; }}/>} 
    {availability.data?.map(record => <div key={record.id}><RecordMeta id={record.userId} revision={record.revision}/>{record.slots.map((slot, index) => <div className="xp-list-row" key={`${record.id}:${index}`}><div><strong>{slot.outletId} · {slot.status}</strong><p>{dateLabel(slot.startAt)} → {dateLabel(slot.endAt)}</p></div>{record.userId === session.data?.user.id && <MutationButton path="/availability" input={{ expectedRevision: record.revision, slots: record.slots.filter((_, candidate) => candidate !== index) }} onChanged={reload} confirmLabel="Sahkan remove availability">Remove</MutationButton>}</div>)}</div>)}
    {availability.data?.length === 0 && <Empty description="Tiada availability yang disimpan untuk scope anda."/>}
  </Panel>;
}
