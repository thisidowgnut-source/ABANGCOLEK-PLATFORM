import type { SafeDraft } from '../../../shared/platform-contracts';
export interface DraftStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; key(index: number): string | null; readonly length: number }
const prefix = 'abangcolek-private-draft:';
const answerFields = new Set(['productId', 'quantity', 'fulfilment', 'contactRef', 'orderId', 'subject', 'description', 'organization', 'dealerOrgId', 'lines', 'batchId', 'locationId', 'catalogueVersion', 'quoteId', 'shipmentId', 'expectedRevision']);
function key(userId: string, flowId: string) { return `${prefix}${encodeURIComponent(userId)}:${encodeURIComponent(flowId)}`; }
function validDraft(value: unknown): value is SafeDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<SafeDraft>;
  return typeof draft.flowId === 'string' && draft.flowId.length <= 120 && Number.isSafeInteger(draft.version) && draft.version! > 0 && typeof draft.expiresAt === 'string' && Number.isFinite(Date.parse(draft.expiresAt)) && Date.parse(draft.expiresAt) > Date.now() && typeof draft.updatedAt === 'string' && Number.isFinite(Date.parse(draft.updatedAt)) && !!draft.answers && typeof draft.answers === 'object' && !Array.isArray(draft.answers) && Object.keys(draft.answers).every(field => answerFields.has(field));
}
export function saveOfflineDraft(storage: DraftStorage, userId: string, draft: SafeDraft, optIn: boolean): boolean {
  if (!optIn || !userId || !validDraft(draft)) return false;
  try {
    const payload = JSON.stringify({ flowId: draft.flowId, version: draft.version, answers: draft.answers, updatedAt: draft.updatedAt, expiresAt: draft.expiresAt });
    if (payload.length > 12_000) return false;
    storage.setItem(key(userId, draft.flowId), payload); return true;
  } catch { return false; }
}
export function readOfflineDraft(storage: DraftStorage, userId: string, flowId: string): SafeDraft | null {
  try {
    const raw = storage.getItem(key(userId, flowId)); if (!raw) return null;
    const draft: unknown = JSON.parse(raw);
    if (!validDraft(draft) || draft.flowId !== flowId) { storage.removeItem(key(userId, flowId)); return null; }
    return draft;
  } catch { return null; }
}
export function purgeUserCache(storage: DraftStorage, userId: string): void {
  const userPrefix = `${prefix}${encodeURIComponent(userId)}:`;
  const flowPrefix = `abangcolek-flow-session:${userId}:`;
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) { const entry = storage.key(index); if (entry?.startsWith(userPrefix) || entry?.startsWith(flowPrefix)) keys.push(entry); }
  for (const entry of keys) storage.removeItem(entry);
}
