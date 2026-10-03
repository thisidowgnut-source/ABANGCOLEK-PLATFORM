import { expect, test } from 'bun:test';
import { purgeUserCache, readOfflineDraft, saveOfflineDraft, type DraftStorage } from '../../src/features/platform/offlineDrafts';
function storage(): DraftStorage { const map = new Map<string,string>(); return { get length() { return map.size; }, key: index => [...map.keys()][index] ?? null, getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key,value); }, removeItem: key => { map.delete(key); } }; }
const draft = { flowId: 'complaint', version: 1, answers: { description: 'Penutup rosak' }, updatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600_000).toISOString() };
test('private offline persistence requires explicit opt-in and partitions accounts', () => {
  const state = storage();
  expect(saveOfflineDraft(state, 'customer-a', draft, false)).toBe(false);
  expect(state.length).toBe(0);
  expect(saveOfflineDraft(state, 'customer-a', draft, true)).toBe(true);
  expect(readOfflineDraft(state, 'customer-b', 'complaint')).toBeNull();
  expect(readOfflineDraft(state, 'customer-a', 'complaint')?.answers).toEqual({ description: 'Penutup rosak' });
});
test('logout purge removes own private drafts without deleting public theme', () => {
  const state = storage(); state.setItem('abangcolek-workspace-theme', 'dark');
  saveOfflineDraft(state, 'customer-a', draft, true);
  purgeUserCache(state, 'customer-a');
  expect(readOfflineDraft(state, 'customer-a', 'complaint')).toBeNull();
  expect(state.getItem('abangcolek-workspace-theme')).toBe('dark');
});
test('expired offline draft is not resumed as current state', () => {
  const state = storage(); saveOfflineDraft(state, 'customer-a', { ...draft, expiresAt: '2020-01-01T00:00:00Z' }, true);
  expect(readOfflineDraft(state, 'customer-a', 'complaint')).toBeNull();
});
test('order draft can retain its quote version but cannot persist credentials', () => {
  const state = storage();
  expect(saveOfflineDraft(state, 'customer-a', { ...draft, answers: { catalogueVersion: 2, lines: [{ productId: 'sku-a', quantity: 1 }] } }, true)).toBe(true);
  expect(saveOfflineDraft(state, 'customer-a', { ...draft, answers: { password: 'private' } }, true)).toBe(false);
});
test('identity change removes flow resume mappings without touching another account', () => {
  const state = storage(); state.setItem('abangcolek-flow-session:customer-a:order', 'private-session');
  state.setItem('abangcolek-flow-session:customer-b:order', 'other-session');
  purgeUserCache(state, 'customer-a');
  expect(state.getItem('abangcolek-flow-session:customer-a:order')).toBeNull();
  expect(state.getItem('abangcolek-flow-session:customer-b:order')).toBe('other-session');
});
