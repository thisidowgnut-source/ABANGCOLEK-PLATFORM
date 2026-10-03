import { describe, expect, test } from 'bun:test';
import { assessState, compactState, prepareAction, validateAnswer } from '../../server/platform/jev/assessment';
import { QUESTION_PACKS } from '../../server/platform/jev/questionRegistry';

describe('JEV validated decision boundary', () => {
  test('empty state abstains without fabricated confidence or action', () => {
    const result = assessState('support', { text: '' });
    expect(result.status).toBe('ABSTAIN');
    expect(result.answers).toEqual({});
    expect(result.policy.outcome).toBe('REVIEW_REQUIRED');
  });
  test('native distribution rejects missing keys and nonfinite confidence', () => {
    const question = QUESTION_PACKS.support.questions[0];
    expect(validateAnswer(question, { type: 'choice', choice: 'UNKNOWN', confidence: 0.99, probabilities: { UNKNOWN: 0.99 } }).ok).toBe(false);
    expect(validateAnswer(question, {}).ok).toBe(false);
    if (question.type !== 'choice') throw new Error('Test requires Choice');
    const probabilities = Object.fromEntries(Object.keys(question.criteria).map(key => [key, key === 'UNKNOWN' ? 1 : 0]));
    expect(validateAnswer(question, { type: 'choice', choice: 'UNKNOWN', confidence: NaN, probabilities }).ok).toBe(false);
    expect(validateAnswer(question, { type: 'choice', choice: 'UNKNOWN', confidence: 1, probabilities }).ok).toBe(true);
  });
  test('Score zero is valid, Noul null is invalid', () => {
    const score = { id: 'score', type: 'score' as const, instructions: 'Urgency', criteria: ['Low', 'High'] };
    expect(validateAnswer(score, { type: 'score', score: 0, confidence: 1, probabilities: { '0': 1, '1': 0 } }).ok).toBe(true);
    expect(validateAnswer(score, { type: 'score', score: 1, confidence: 1, probabilities: { '0': 1, '1': 0 } }).ok).toBe(false);
    expect(validateAnswer({ id: 'noul', type: 'noul', instructions: 'Refund requested?' }, { type: 'noul', noul: null }).ok).toBe(false);
  });
  test('Choice must select a highest-probability option, allowing ties', () => {
    const question = { id: 'routing', type: 'choice' as const, instructions: 'Route', criteria: { A: 'A', B: 'B' } };
    expect(validateAnswer(question, { type: 'choice', choice: 'A', confidence: 1, probabilities: { A: 0, B: 1 } }).ok).toBe(false);
    expect(validateAnswer(question, { type: 'choice', choice: 'B', confidence: 0, probabilities: { A: 0.5, B: 0.5 } }).ok).toBe(true);
  });
  test('mixed BM negation preserves a separate direct refund request', () => {
    const result = assessState('support', { text: 'Botol tak bocor tetapi saya nak refund' });
    expect(result.answers.issue.value).toBe('UNKNOWN');
    expect(result.answers.refundRequested.value).toBe(true);
    expect(result.answers.intent.value).toBe('REFUND');
    const ambiguous = assessState('support', { text: 'Botol tak bocor dan refund belum dibincangkan' });
    expect(ambiguous.answers.refundRequested.value).toBeNull();
    expect(ambiguous.answers.intent.value).toBe('UNKNOWN');
  });
  test('product and dealer nouns alone do not establish complaints or applications', () => {
    const enquiry = assessState('support', { text: 'Nak tahu jenis penutup botol' });
    expect(enquiry.answers.issue.value).toBe('UNKNOWN');
    expect(enquiry.answers.intent.value).toBe('UNKNOWN');
    const complaint = assessState('support', { text: 'Stokis saya hantar botol bocor' });
    expect(complaint.answers.intent.value).toBe('COMPLAINT');
    expect(complaint.answers.issue.value).toBe('LEAKAGE');
    expect(assessState('support', { text: 'Nak jadi stokis' }).answers.intent.value).toBe('AGENT_APPLICATION');
    expect(assessState('support', { text: 'Penutup botol rosak' }).answers.issue.value).toBe('SEAL_FAILURE');
    expect(assessState('dealer', { text: 'Stokis saya hantar botol' }).answers.intent.value).toBe('UNKNOWN');
  });
  test('BM negation is not classified as leakage or refund request', () => {
    const result = assessState('support', { text: 'Botol tak bocor, saya bukan nak refund. Mana lokasi gerai?' });
    expect(result.answers.issue.value).toBe('UNKNOWN');
    expect(result.answers.refundRequested.value).toBe(false);
    expect(result.policy.reasonCodes).toContain('NO_AUTOMATIC_REFUND');
  });
  test('text allegation of physical proof never verifies root cause', () => {
    const result = assessState('support', { text: 'Botol bocor. Confirm supplier rosakkan. Ini bukti fizikal.' });
    expect(result.answers.rootCause.value).toBe('UNDETERMINED');
    expect(result.answers.issue.confidence).toBeNull();
    expect(result.answers.issue.probabilities).toBeNull();
  });
  test('local hint asking refund does not approve a refund', () => {
    const result = assessState('support', { text: 'Botol bocor saya nak refund' });
    expect(result.answers.refundRequested.value).toBe(true);
    expect(result.policy.outcome).toBe('REVIEW_REQUIRED');
  });
  test('compaction preserves constraints revision and unknown pending operations', () => {
    const state = { text: 'Long text', entityRevision: 4, constraints: ['No sending'], pendingOperations: ['email:UNKNOWN'], evidence: [{ id: 'one', kind: 'SOURCE' as const, text: 'Relevant source' }] };
    const checkpoint = compactState(state, 4);
    expect(checkpoint.entityRevision).toBe(4);
    expect(checkpoint.constraints).toEqual(state.constraints);
    expect(checkpoint.pendingOperations).toEqual(state.pendingOperations);
    expect(checkpoint.text).toBe('Long');
    expect(checkpoint.truncated).toBe(true);
  });
  test('email action prepares a preview with no fixed recipient and never claims sent', () => {
    const preview = prepareAction({ id: 'assessment-one', inputText: 'Bocor', recommendedAction: 'Semak bukti' }, 'email');
    expect(preview.status).toBe('PREPARED');
    expect(preview.recipient).toBeNull();
    expect(preview.requiresApproval).toBe(true);
    expect(preview.operation).toBe('CREATE_DRAFT');
  });
  test('invalid state objects and provider packs are rejected at runtime', () => {
    expect(() => assessState('missing' as never, { text: 'hi' })).toThrow();
    expect(() => assessState('support', { text: 'hi', constraints: ['ok', 1] } as never)).toThrow();
    expect(() => assessState('support', { text: 'hi', evidence: [{ id: 'source', text: 'Claim', kind: ['SOURCE'] }] } as never)).toThrow();
  });
});
