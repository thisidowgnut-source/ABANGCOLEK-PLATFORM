import type { DayCloseRecord, ExpenseRecord, Membership } from './platform-contracts';

export interface DayCloseAmendment {
  id: string;
  dayCloseId: string;
  approvedSnapshot: DayCloseRecord;
  snapshotHash: string;
  correctedRevision: number;
  reason: string;
  amendedBy: string;
  createdAt: string;
}
export interface ExpensePosting {
  id: string;
  kind: 'EXPENSE' | 'REVERSAL';
  expenseId: string;
  outletId: string;
  amountSen: number;
  sourceKeys: string[];
  approvedSnapshot?: ExpenseRecord;
  sourceHash: string;
  reversesId?: string;
  reason: string;
  postedBy: string;
  createdAt: string;
  bankSettlement: 'NOT_ASSERTED';
}
export interface PeopleInvitation {
  id: string;
  email: string;
  role: 'staff' | 'developer';
  outletIds: string[];
  issuerId: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  revision: number;
  createdAt: string;
  acceptedBy?: string;
  acceptedAt?: string;
}
export interface CreatedInvitation extends PeopleInvitation { token: string; delivery: 'MANUAL_NOT_SENT' }
export interface AcceptedInvitation { id: string; status: 'accepted'; membership: Membership }
export interface AvailabilitySlot { outletId: string; startAt: string; endAt: string; status: 'available' | 'unavailable' }
export interface StaffAvailability { id: string; userId: string; revision: number; slots: AvailabilitySlot[]; updatedAt: string }
export type NotificationTopic = 'orders' | 'cases' | 'tasks' | 'calendar' | 'shifts' | 'finance' | 'runtime' | 'jobs';
export interface NotificationPreferences { id: string; userId: string; revision: number; channel: 'in_app'; inAppEnabled: boolean; topics: NotificationTopic[]; updatedAt: string | null; allowedTopics: NotificationTopic[] }
export interface InAppActivity {
  id: string;
  topic: NotificationTopic;
  title: string;
  status: string;
  sourceRevision: number | null;
  sourceAt: string | null;
}
export interface InAppActivityFeed {
  channel: 'in_app';
  inAppEnabled: boolean;
  topics: NotificationTopic[];
  items: InAppActivity[];
  counts: Partial<Record<NotificationTopic, number>>;
  limitPerTopic: 10;
  generatedAt: string;
}
