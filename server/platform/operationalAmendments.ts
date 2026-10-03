import type { AcceptedInvitation, AvailabilitySlot, CreatedInvitation, DayCloseAmendment, ExpensePosting, InAppActivity, InAppActivityFeed, NotificationPreferences, NotificationTopic, PeopleInvitation, StaffAvailability } from '../../shared/operation-amendment-contracts';
import type { DayCloseRecord, EvidenceRecord, ExpenseRecord, JobRecord, ShiftRecord } from '../../shared/platform-contracts';
import { Auth, hash, opaque, type Principal } from './auth';
import { Operations } from './operations';
import { date, fail, fields, id, integer, list, now, object, oneOf, PlatformStore, strings, text } from './store';
import { Work } from './work';

interface StoredInvitation extends PeopleInvitation { tokenHash: string; expectedGrantVersion: number }
type StoredPreferences = Omit<NotificationPreferences, 'allowedTopics'>;
const MAX_SEN = 1_000_000_000;
const publicInvitation = ({ tokenHash: _, expectedGrantVersion: __, ...record }: StoredInvitation): PeopleInvitation => record;

/** Append-only accounting and approval corrections, plus scoped first-party people settings. */
export class OperationalAmendments {
  constructor(readonly store: PlatformStore, readonly auth: Auth, readonly operations: Operations, readonly work: Work) {}

  private fresh(actor: Principal): Principal {
    const user = this.store.db.query<{ id: string; email: string; name: string }, [string]>('SELECT id,email,name FROM users WHERE id=?').get(actor.user.id);
    const memberships = this.auth.memberships(actor.user.id);
    if (!user || !memberships.length) fail('MEMBERSHIP_REVOKED', 403);
    return { ...actor, user, memberships };
  }
  private founder(actor: Principal) { const current = this.fresh(actor); this.auth.founder(current); return current; }

  dayCloseHistory(actor: Principal): DayCloseAmendment[] {
    const current = this.fresh(actor); this.work.staff(current);
    return this.store.all<DayCloseAmendment>('dayclose_amendments').filter(record => this.auth.has(current, 'founder') || current.memberships.some(member => member.role === 'staff' && member.outletIds.includes(record.approvedSnapshot.outletId)));
  }

  reopenDayClose(actor: Principal, recordId: string, raw: unknown): DayCloseRecord {
    const current = this.founder(actor), input = object(raw); fields(input, ['expectedRevision', 'countCashSen', 'reason']);
    const reason = text(input.reason, 'Sebab pembetulan', 4000), countCashSen = integer(input.countCashSen, 'Kiraan tunai', 0, MAX_SEN);
    return this.store.atomic(() => {
      const approved = this.store.require<DayCloseRecord>('dayclose', text(recordId, 'Day close ID', 120));
      this.store.revision(approved.revision, input.expectedRevision);
      if (approved.status !== 'approved') fail('DAY_CLOSE_NOT_APPROVED', 409);
      const snapshotId = `${approved.id}:${approved.revision}`;
      if (this.store.get('dayclose_amendments', snapshotId)) fail('DAY_CLOSE_ALREADY_AMENDED', 409);
      const payments = this.operations.cashPayments(approved.outletId, approved.date);
      const expectedCashSen = payments.reduce((sum, payment) => sum + (payment.state === 'confirmed' ? 1 : -1) * integer(payment.amountSen, 'Source amount', 0, MAX_SEN), 0);
      if (!Number.isSafeInteger(expectedCashSen)) fail('CASH_TOTAL_OVERFLOW', 409);
      const corrected: DayCloseRecord = { ...approved, status: 'review', countCashSen, expectedCashSen, discrepancySen: countCashSen - expectedCashSen, paymentRefs: payments.map(payment => payment.id), revision: approved.revision + 1, reason };
      const amendment: DayCloseAmendment = { id: snapshotId, dayCloseId: approved.id, approvedSnapshot: approved, snapshotHash: hash(JSON.stringify(approved)), correctedRevision: corrected.revision, reason, amendedBy: current.user.id, createdAt: now() };
      this.store.save('dayclose_amendments', amendment); this.store.save('dayclose', corrected);
      this.store.audit(current.user.id, 'dayclose.reopen', approved.id, corrected.revision);
      return corrected;
    });
  }

  postings(actor: Principal): ExpensePosting[] {
    const current = this.fresh(actor); this.work.staff(current);
    return this.store.all<ExpensePosting>('expense_postings').filter(record => this.auth.has(current, 'founder') || current.memberships.some(member => member.role === 'staff' && member.outletIds.includes(record.outletId)));
  }
  postingSummary(actor: Principal) {
    const rows=this.postings(actor);
    return {recordCount:rows.length,netAmountSen:rows.reduce((sum,row)=>sum+row.amountSen,0),postedExpenseIds:rows.filter(row=>row.kind==='EXPENSE').map(row=>row.expenseId),reversedPostingIds:rows.flatMap(row=>row.reversesId?[row.reversesId]:[]),generatedAt:now(),scope:'complete_ledger' as const};
  }

  postExpense(actor: Principal, expenseId: string, raw: unknown, key: unknown): ExpensePosting {
    const current = this.founder(actor), input = object(raw); fields(input, ['expectedRevision']);
    const expense = this.store.require<ExpenseRecord>('expenses', text(expenseId, 'Expense ID', 120));
    this.store.revision(expense.revision, input.expectedRevision);
    if (expense.status !== 'approved') fail('EXPENSE_NOT_APPROVED', 409);
    integer(expense.amountSen, 'Approved amount', 1, MAX_SEN);
    if (!expense.evidenceIds.length || new Set(expense.evidenceIds).size !== expense.evidenceIds.length) fail('EXPENSE_SOURCES_INVALID', 409);
    const evidence = expense.evidenceIds.map(evidenceId => this.store.require<EvidenceRecord>('evidence', evidenceId));
    for (const item of evidence) this.work.entity(current, item.entityId);
    const sourceKeys = [`expense:${expense.id}`, ...evidence.map(item => item.sha256 ? `evidence-sha256:${item.sha256}` : `evidence:${item.id}`)];
    if (new Set(sourceKeys).size !== sourceKeys.length) fail('EXPENSE_SOURCES_INVALID', 409);
    const sourceHash = hash(JSON.stringify({ expense, evidence: evidence.map(item => ({ id: item.id, sha256: item.sha256, kind: item.kind })) }));
    return this.operations.commerce.idem(current, `expense.post:${expense.id}`, key, raw, () => {
      const existing = this.store.all<ExpensePosting>('expense_postings').find(record => record.kind === 'EXPENSE' && record.expenseId === expense.id);
      if (existing) {
        if (existing.sourceHash !== sourceHash) fail('EXPENSE_POSTED_SOURCE_CHANGED', 409);
        return existing;
      }
      if (this.store.all<ExpensePosting>('expense_postings').some(record => record.kind === 'EXPENSE' && record.sourceKeys.some(sourceKey => sourceKeys.includes(sourceKey)))) fail('EXPENSE_SOURCE_ALREADY_POSTED', 409);
      const posting: ExpensePosting = { id: id(), kind: 'EXPENSE', expenseId: expense.id, outletId: expense.outletId, amountSen: expense.amountSen, sourceKeys, sourceHash, approvedSnapshot: expense, reason: 'Approved expense recognition; no bank settlement asserted', postedBy: current.user.id, createdAt: now(), bankSettlement: 'NOT_ASSERTED' };
      this.store.save('expense_postings', posting); this.store.audit(current.user.id, 'expense.post', posting.id, expense.revision); return posting;
    });
  }

  reverseExpense(actor: Principal, postingId: string, raw: unknown, key: unknown): ExpensePosting {
    const current = this.founder(actor), input = object(raw); fields(input, ['reason']);
    const original = this.store.require<ExpensePosting>('expense_postings', text(postingId, 'Posting ID', 120));
    if (original.kind !== 'EXPENSE') fail('REVERSAL_TARGET_INVALID', 409);
    const reason = text(input.reason, 'Sebab reversal', 4000);
    return this.operations.commerce.idem(current, `expense.reverse:${original.id}`, key, raw, () => {
      const existing = this.store.all<ExpensePosting>('expense_postings').find(record => record.reversesId === original.id);
      if (existing) {
        if (existing.reason !== reason) fail('EXPENSE_ALREADY_REVERSED', 409);
        return existing;
      }
      const reversal: ExpensePosting = { id: id(), kind: 'REVERSAL', expenseId: original.expenseId, outletId: original.outletId, amountSen: -integer(original.amountSen, 'Original posting amount', 1, MAX_SEN), sourceKeys: [`reversal:${original.id}`], sourceHash: original.sourceHash, reversesId: original.id, reason, postedBy: current.user.id, createdAt: now(), bankSettlement: 'NOT_ASSERTED' };
      this.store.save('expense_postings', reversal); this.store.audit(current.user.id, 'expense.reverse', reversal.id); return reversal;
    });
  }

  invitations(actor: Principal): PeopleInvitation[] { this.founder(actor); return this.store.all<StoredInvitation>('people_invitations').map(publicInvitation); }

  createInvitation(actor: Principal, raw: unknown): CreatedInvitation {
    const current = this.founder(actor), input = object(raw); fields(input, ['email', 'role', 'outletIds', 'expiresAt']);
    const email = text(input.email, 'Email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('INVALID_EMAIL');
    const role = oneOf(input.role, ['staff', 'developer'] as const), outletIds = strings(input.outletIds ?? [], 32), expiresAt = date(input.expiresAt);
    if (new Set(outletIds).size !== outletIds.length || (role === 'staff' && !outletIds.length) || (role === 'developer' && outletIds.length)) fail('INVITE_SCOPE_INVALID');
    if (expiresAt <= now() || Date.parse(expiresAt) > Date.now() + 7 * 24 * 3600000) fail('INVITE_EXPIRY_INVALID');
    const token = opaque();
    return this.store.atomic(() => {
      if (this.store.all<StoredInvitation>('people_invitations').some(record => record.email === email && record.role === role && record.status === 'pending' && record.expiresAt > now())) fail('INVITATION_PENDING', 409);
      const target = this.store.db.query<{ id: string }, [string]>('SELECT id FROM users WHERE email=?').get(email);
      const expectedGrantVersion = target ? this.store.db.query<{ version: number }, [string, string]>('SELECT version FROM memberships WHERE user_id=? AND role=?').get(target.id, role)?.version ?? 0 : 0;
      const record: StoredInvitation = { id: id(), email, role, outletIds, issuerId: current.user.id, expiresAt, status: 'pending', revision: 1, createdAt: now(), tokenHash: hash(token), expectedGrantVersion };
      this.store.save('people_invitations', record); this.store.audit(current.user.id, 'people.invite', record.id);
      return { ...publicInvitation(record), token, delivery: 'MANUAL_NOT_SENT' };
    });
  }

  acceptInvitation(actor: Principal, raw: unknown): AcceptedInvitation {
    const current = this.fresh(actor), input = object(raw); fields(input, ['token']);
    const tokenHash = hash(text(input.token, 'Invitation token', 200));
    return this.store.atomic(() => {
      const invite = this.store.all<StoredInvitation>('people_invitations').find(record => record.tokenHash === tokenHash);
      if (!invite || invite.status !== 'pending' || invite.expiresAt <= now() || invite.email !== current.user.email.toLowerCase()) fail('INVITATION_INVALID', 403, 'Invitation tidak sah untuk akaun ini atau telah tamat.');
      const issuerMemberships = this.auth.memberships(invite.issuerId);
      if (!issuerMemberships.some(member => member.role === 'founder')) fail('INVITATION_ISSUER_REVOKED', 403);
      const issuer = this.store.db.query<{ id: string; email: string; name: string }, [string]>('SELECT id,email,name FROM users WHERE id=?').get(invite.issuerId);
      if (!issuer) fail('INVITATION_ISSUER_REVOKED', 403);
      const issuerActor: Principal = { ...current, user: issuer, memberships: issuerMemberships };
      const membership = this.auth.grant(issuerActor, { userId: current.user.id, role: invite.role, outletIds: invite.outletIds, expectedVersion: invite.expectedGrantVersion });
      this.store.save('people_invitations', { ...invite, status: 'accepted', revision: invite.revision + 1, acceptedBy: current.user.id, acceptedAt: now() });
      this.store.audit(current.user.id, 'people.invite_accept', invite.id, invite.revision + 1);
      return { id: invite.id, status: 'accepted', membership };
    });
  }

  revokeInvitation(actor: Principal, invitationId: string, raw: unknown): PeopleInvitation {
    const current = this.founder(actor), input = object(raw); fields(input, ['expectedRevision']);
    return this.store.atomic(() => {
      const invite = this.store.require<StoredInvitation>('people_invitations', text(invitationId)); this.store.revision(invite.revision, input.expectedRevision);
      if (invite.status !== 'pending') fail('INVITATION_NOT_PENDING', 409);
      const record: StoredInvitation = { ...invite, status: 'revoked', revision: invite.revision + 1 };
      this.store.save('people_invitations', record); this.store.audit(current.user.id, 'people.invite_revoke', invite.id, record.revision); return publicInvitation(record);
    });
  }

  availability(actor: Principal): StaffAvailability[] {
    const current = this.fresh(actor); this.work.staff(current);
    return this.store.all<StaffAvailability>('staff_availability').filter(record => this.auth.has(current, 'founder') || record.userId === current.user.id);
  }

  saveAvailability(actor: Principal, raw: unknown): StaffAvailability {
    const current = this.fresh(actor); this.work.staff(current);
    const input = object(raw); fields(input, ['expectedRevision', 'slots']);
    const slots: AvailabilitySlot[] = list(input.slots, 32).map(value => {
      const slot = object(value); fields(slot, ['outletId', 'startAt', 'endAt', 'status']);
      const outletId = text(slot.outletId, 'Outlet', 120), startAt = date(slot.startAt), endAt = date(slot.endAt);
      this.auth.operational(current, outletId);
      if (endAt <= startAt || Date.parse(endAt) - Date.parse(startAt) > 31 * 24 * 3600000) fail('AVAILABILITY_RANGE_INVALID');
      return { outletId, startAt, endAt, status: oneOf(slot.status, ['available', 'unavailable'] as const) };
    }).sort((a, b) => a.startAt.localeCompare(b.startAt));
    if (slots.some((slot, index) => index > 0 && slot.startAt < slots[index - 1].endAt)) fail('AVAILABILITY_OVERLAP', 409);
    return this.store.atomic(() => {
      const existing = this.store.get<StaffAvailability>('staff_availability', current.user.id); this.store.revision(existing?.revision ?? 0, input.expectedRevision);
      const record: StaffAvailability = { id: current.user.id, userId: current.user.id, revision: (existing?.revision ?? 0) + 1, slots, updatedAt: now() };
      this.store.save('staff_availability', record); this.store.audit(current.user.id, 'availability.save', record.id, record.revision); return record;
    });
  }

  private topics(actor: Principal): NotificationTopic[] {
    const topics: NotificationTopic[] = [];
    for (const membership of actor.memberships) {
      const allowed: NotificationTopic[] = membership.role === 'founder' ? ['orders', 'cases', 'tasks', 'calendar', 'shifts', 'finance', 'runtime', 'jobs'] : membership.role === 'staff' ? ['orders', 'cases', 'tasks', 'calendar', 'shifts'] : membership.role === 'developer' ? ['runtime', 'jobs'] : ['orders', 'cases'];
      topics.push(...allowed);
    }
    return [...new Set(topics)];
  }

  preferences(actor: Principal): NotificationPreferences {
    const current = this.fresh(actor), allowedTopics = this.topics(current);
    const stored = this.store.get<StoredPreferences>('notification_preferences', current.user.id);
    return { ...(stored ?? { id: current.user.id, userId: current.user.id, revision: 0, channel: 'in_app', inAppEnabled: true, topics: [], updatedAt: null }), topics: (stored?.topics ?? []).filter(topic => allowedTopics.includes(topic)), allowedTopics };
  }

  notifications(actor: Principal): InAppActivityFeed {
    const current = this.fresh(actor), preferences = this.preferences(current), items: InAppActivity[] = [], counts: InAppActivityFeed['counts'] = {};
    if (preferences.inAppEnabled) {
      for (const topic of preferences.topics) {
        let records: InAppActivity[] = [];
        if (topic === 'orders') records = this.operations.commerce.orders(current).map(record => ({ id: record.id, topic, title: `Order ${record.id}`, status: `${record.fulfilmentStatus} / ${record.paymentState}`, sourceRevision: record.revision, sourceAt: record.updatedAt }));
        if (topic === 'cases') records = this.work.cases(current).map(record => ({ id: record.id, topic, title: record.subject, status: record.status, sourceRevision: record.revision, sourceAt: record.createdAt }));
        if (topic === 'tasks') records = this.work.tasks(current).map(record => ({ id: record.id, topic, title: record.title, status: record.status, sourceRevision: record.revision, sourceAt: record.createdAt }));
        if (topic === 'calendar') records = this.work.calendar(current).map(record => ({ id: record.id, topic, title: record.title, status: 'scheduled', sourceRevision: record.revision, sourceAt: record.startAt }));
        if (topic === 'shifts') records = this.operations.scoped<ShiftRecord>(current, 'shifts').map(record => ({ id: record.id, topic, title: `Shift ${record.outletId}`, status: record.status, sourceRevision: record.revision, sourceAt: record.closedAt ?? record.openedAt }));
        if (topic === 'finance' && this.auth.has(current, 'founder')) records = this.operations.expenses(current).map(record => ({ id: record.id, topic, title: record.category, status: record.status, sourceRevision: record.revision, sourceAt: record.createdAt }));
        if (topic === 'jobs' && (this.auth.has(current, 'founder') || this.auth.has(current, 'developer'))) records = this.store.all<JobRecord>('jobs').map(record => ({ id: record.id, topic, title: `Automation job: ${record.kind}`, status: record.status, sourceRevision: null, sourceAt: record.createdAt }));
        if (topic === 'runtime' && (this.auth.has(current, 'founder') || this.auth.has(current, 'developer'))) {
          const record = this.store.get<{ id: string; version: number; workerAdmission: string; updatedAt: string }>('runtime_controls', 'runtime');
          if (record) records = [{ id: record.id, topic, title: 'Runtime control', status: record.workerAdmission, sourceRevision: record.version, sourceAt: record.updatedAt }];
        }
        const selected = records.sort((a, b) => (b.sourceAt ?? '').localeCompare(a.sourceAt ?? '') || a.id.localeCompare(b.id)).slice(0, 10);
        counts[topic] = selected.length; items.push(...selected);
      }
    }
    return { channel: 'in_app', inAppEnabled: preferences.inAppEnabled, topics: preferences.topics, items: items.sort((a, b) => (b.sourceAt ?? '').localeCompare(a.sourceAt ?? '')), counts, limitPerTopic: 10, generatedAt: now() };
  }

  savePreferences(actor: Principal, raw: unknown): NotificationPreferences {
    const current = this.fresh(actor), input = object(raw); fields(input, ['expectedRevision', 'inAppEnabled', 'topics']);
    if (typeof input.inAppEnabled !== 'boolean') fail('INVALID_INPUT');
    const allowedTopics = this.topics(current), topics = strings(input.topics, 8).map(value => oneOf(value, allowedTopics));
    if (new Set(topics).size !== topics.length) fail('NOTIFICATION_TOPICS_INVALID');
    return this.store.atomic(() => {
      const existing = this.preferences(current); this.store.revision(existing.revision, input.expectedRevision);
      const stored: StoredPreferences = { id: current.user.id, userId: current.user.id, revision: existing.revision + 1, channel: 'in_app', inAppEnabled: input.inAppEnabled as boolean, topics, updatedAt: now() };
      this.store.save('notification_preferences', stored); this.store.audit(current.user.id, 'notifications.preferences', stored.id, stored.revision); return { ...stored, allowedTopics };
    });
  }
}
