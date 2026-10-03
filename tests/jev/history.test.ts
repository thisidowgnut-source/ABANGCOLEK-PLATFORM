import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { evaluateWithJev, getJevHistoryStatus, getSavedJevEvaluations, setJevHistoryScope } from '../../src/services/jevEngine';

class TestStorage implements Storage {
  private readonly values = new Map<string, string>();
  failWrites = false;
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('Storage quota exceeded');
    this.values.set(key, value);
  }
}

describe('scoped JEV device history', () => {
  let storage: TestStorage;
  let previousStorage: PropertyDescriptor | undefined;
  const key = 'abangcolek_jev_v2:workspace:actor';
  beforeEach(() => {
    previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    storage = new TestStorage();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    setJevHistoryScope(null);
    setJevHistoryScope('actor', 'workspace', true);
  });
  afterEach(() => {
    setJevHistoryScope(null);
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  test('failed writes retain new evaluations and recover without losing history', async () => {
    const first = await evaluateWithJev('Botol bocor');
    storage.failWrites = true;
    const second = await evaluateWithJev('Nak jadi stokis');
    expect(getJevHistoryStatus().stored).toBe(false);
    expect(getSavedJevEvaluations().map(item => item.id)).toEqual([second.id, first.id]);
    storage.failWrites = false;
    const third = await evaluateWithJev('Saya nak refund');
    expect(getJevHistoryStatus().stored).toBe(true);
    setJevHistoryScope(null);
    setJevHistoryScope('actor', 'workspace', true);
    expect(getSavedJevEvaluations().map(item => item.id)).toEqual([third.id, second.id, first.id]);
    expect(getJevHistoryStatus().stored).toBe(true);
  });
  test('malformed nested assessment and compatibility data fail closed', async () => {
    const valid = await evaluateWithJev('Botol bocor');
    for (const malformed of [
      { ...valid, assessment: { providerMode: 'LOCAL_RULES' } },
      { ...valid, dimensions: { issueClass: {} } },
      { ...valid, primitives: { urgencyScore: {} } },
      { ...valid, assessment: { ...valid.assessment, answers: { ...valid.assessment?.answers, intent: { type: 'choice', value: 'MADE_UP', confidence: null, probabilities: null, reason: 'bad' } } } },
      { ...valid, assessment: { ...valid.assessment, answers: { ...valid.assessment?.answers, rootCause: { type: 'choice', value: 'VERIFIED', confidence: null, probabilities: null, reason: 'customer says proof' } } } },
      { ...valid, assessment: { ...valid.assessment, policy: { version: '1.0', outcome: 'REVIEW_REQUIRED', reasonCodes: ['APPROVED'] } } },
    ]) {
      storage.setItem(key, JSON.stringify([malformed]));
      setJevHistoryScope(null);
      setJevHistoryScope('actor', 'workspace', true);
      expect(getSavedJevEvaluations()).toEqual([]);
      expect(getJevHistoryStatus().error).not.toBeNull();
    }
  });
  test('loading another actor never exposes persisted or unsaved history', async () => {
    const first = await evaluateWithJev('Private actor message');
    storage.failWrites = true;
    await evaluateWithJev('Private unsaved message');
    setJevHistoryScope('other-actor', 'workspace', true);
    expect(getSavedJevEvaluations()).toEqual([]);
    setJevHistoryScope('actor', 'workspace', true);
    expect(getSavedJevEvaluations().map(item => item.id)).toEqual([first.id]);
  });
});
