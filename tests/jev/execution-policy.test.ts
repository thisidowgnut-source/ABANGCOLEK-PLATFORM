import { describe, expect, test } from 'bun:test';
import { evaluateExecutionPolicy } from '../../server/platform/jev/policyEngine';
import { evaluateWithJev, executeAutomatedJevAction, getJevHistoryStatus, getSavedJevEvaluations, setJevHistoryScope } from '../../src/services/jevEngine';

describe('JEV action and scope boundary', () => {
  test('high confidence never substitutes for permission or approval', () => {
    expect(evaluateExecutionPolicy({ operation: 'REFUND', capabilityGranted: false, canonicalFactsValid: true, entityRevision: 1, payloadHash: 'a' }).allowed).toBe(false);
    expect(evaluateExecutionPolicy({ operation: 'REFUND', capabilityGranted: true, canonicalFactsValid: true, entityRevision: 1, payloadHash: 'a' }).allowed).toBe(false);
  });
  test('expired or changed payload approvals fail closed', () => {
    const base = { operation: 'PUBLISH' as const, capabilityGranted: true, canonicalFactsValid: true, entityRevision: 1, payloadHash: 'a', approval: { payloadHash: 'a', entityRevision: 1, expiresAt: '2026-10-02T01:00:00Z' } };
    expect(evaluateExecutionPolicy(base, Date.parse('2026-10-02T02:00:00Z')).allowed).toBe(false);
    expect(evaluateExecutionPolicy({ ...base, payloadHash: 'changed' }, Date.parse('2026-10-02T00:00:00Z')).allowed).toBe(false);
    expect(evaluateExecutionPolicy(base, Date.parse('2026-10-02T00:00:00Z')).allowed).toBe(true);
  });
  test('legacy empty evaluator stays unknown and external actions prepare only', async () => {
    setJevHistoryScope(null);
    const result = await evaluateWithJev('');
    expect(result.dimensions.issueClass.value).toBe('UNKNOWN');
    expect(result.assessment?.status).toBe('ABSTAIN');
    expect(result.dimensions.issueClass.probabilities).toEqual({});
    const action = await executeAutomatedJevAction(result, 'email');
    expect(action.preview?.recipient).toBeNull();
    expect(action.preview?.status).toBe('PREPARED');
    expect(action.message).toContain('Tiada emel dihantar');
  });
  test('unverified history is volatile and clears with identity changes', async () => {
    setJevHistoryScope(null);
    await evaluateWithJev('Botol bocor');
    expect(getJevHistoryStatus().mode).toBe('MEMORY_ONLY');
    expect(getJevHistoryStatus().stored).toBe(false);
    setJevHistoryScope('different-user', 'workspace');
    expect(getJevHistoryStatus().mode).toBe('MEMORY_ONLY');
    expect(getSavedJevEvaluations()).toEqual([]);
    await evaluateWithJev('Nak jadi stokis');
    setJevHistoryScope('third-user', 'workspace');
    expect(getSavedJevEvaluations()).toEqual([]);
    setJevHistoryScope(null);
    expect(getSavedJevEvaluations()).toEqual([]);
  });
});
