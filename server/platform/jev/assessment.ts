import type { JevActionPreview, JevAssessment, JevNativeAnswer, JevPackId, JevQuestion, JevRuleAnswer, JevState } from '../../../shared/jev-contracts';
import { QUESTION_PACKS } from './questionRegistry';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const probability = (value: unknown): value is number => finite(value) && value >= 0 && value <= 1;

/** Validate native response shapes without coercion or manufactured confidence. */
export function validateAnswer(question: JevQuestion, input: unknown): { ok: true; answer: JevNativeAnswer } | { ok: false; reason: string } {
  if (!isRecord(input) || input.type !== question.type) return { ok: false, reason: 'ANSWER_TYPE_INVALID' };
  if (question.type === 'noul') return probability(input.noul)
    ? { ok: true, answer: { type: 'noul', noul: input.noul } }
    : { ok: false, reason: 'NOUL_INVALID' };
  const keys = question.type === 'choice' ? Object.keys(question.criteria) : question.criteria.map((_, index) => String(index));
  const distribution = input.probabilities;
  if (!keys.length || !isRecord(distribution) || Object.keys(distribution).length !== keys.length || keys.some(key => !probability(distribution[key]))) return { ok: false, reason: 'DISTRIBUTION_INVALID' };
  const sum = keys.reduce((total, key) => total + Number(distribution[key]), 0);
  if (Math.abs(sum - 1) > 0.001 || !probability(input.confidence)) return { ok: false, reason: 'DISTRIBUTION_OR_CONFIDENCE_INVALID' };
  const probabilities = Object.fromEntries(keys.map(key => [key, Number(distribution[key])]));
  if (question.type === 'choice') {
    if (typeof input.choice !== 'string' || !keys.includes(input.choice)) return { ok: false, reason: 'CHOICE_INVALID' };
    // Choice selects a distribution maximum; equally likely options may tie.
    if (probabilities[input.choice] < Math.max(...Object.values(probabilities))) return { ok: false, reason: 'CHOICE_DISTRIBUTION_MISMATCH' };
    return { ok: true, answer: { type: 'choice', choice: input.choice, confidence: input.confidence, probabilities } };
  }
  if (!finite(input.score) || input.score < 0 || input.score > keys.length - 1) return { ok: false, reason: 'SCORE_INVALID' };
  const expected = keys.reduce((total, key) => total + Number(key) * probabilities[key], 0);
  if (Math.abs(input.score - expected) > 0.01) return { ok: false, reason: 'SCORE_DISTRIBUTION_MISMATCH' };
  return { ok: true, answer: { type: 'score', score: input.score, confidence: input.confidence, probabilities } };
}

/** Schema validation only; this does not enable or claim a native provider connection. */
export function validatePackAnswers(packId: JevPackId, input: unknown): { status: 'VALID' | 'ABSTAIN'; answers: Record<string, JevNativeAnswer>; validationErrors: string[] } {
  if (!Object.hasOwn(QUESTION_PACKS, packId)) throw new Error('JEV_PACK_INVALID');
  const validationErrors: string[] = [], answers: Record<string, JevNativeAnswer> = {};
  if (!isRecord(input)) return { status: 'ABSTAIN', answers: {}, validationErrors: ['PACK_ANSWERS_INVALID'] };
  const questions = QUESTION_PACKS[packId].questions;
  if (Object.keys(input).some(key => !questions.some(question => question.id === key))) validationErrors.push('UNEXPECTED_DIMENSION');
  for (const question of questions) {
    const result = validateAnswer(question, input[question.id]);
    if (result.ok === true) answers[question.id] = result.answer;
    else validationErrors.push(`${question.id}:${result.reason}`);
  }
  return { status: validationErrors.length ? 'ABSTAIN' : 'VALID', answers: validationErrors.length ? {} : answers, validationErrors };
}

export function validateState(state: unknown): asserts state is JevState {
  if (!isRecord(state) || typeof state.text !== 'string' || state.text.length > 32000) throw new Error('JEV_STATE_INVALID: text must be a string of at most 32000 characters.');
  for (const name of ['constraints', 'pendingOperations'] as const) {
    const value = state[name];
    if (value !== undefined && (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== 'string' || item.length > 2000))) throw new Error(`JEV_STATE_INVALID: ${name} must contain bounded strings.`);
  }
  if (state.entityId !== undefined && (typeof state.entityId !== 'string' || state.entityId.length > 200)) throw new Error('JEV_STATE_INVALID: entity ID invalid.');
  if (state.entityRevision !== undefined && (!Number.isSafeInteger(state.entityRevision) || Number(state.entityRevision) < 0)) throw new Error('JEV_STATE_INVALID: entity revision invalid.');
  if (state.facts !== undefined && (!isRecord(state.facts) || Object.entries(state.facts).some(([key, value]) => !['paymentVerified', 'canonicalPriceKnown', 'evidenceComplete', 'sopCurrent'].includes(key) || (value !== null && typeof value !== 'boolean')))) throw new Error('JEV_STATE_INVALID: facts invalid.');
  if (state.evidence !== undefined && (!Array.isArray(state.evidence) || state.evidence.length > 50 || state.evidence.some(item => !isRecord(item) || typeof item.id !== 'string' || !item.id || item.id.length > 200 || typeof item.text !== 'string' || item.text.length > 8000 || typeof item.kind !== 'string' || !['BUSINESS_FACT', 'CUSTOMER_CLAIM', 'SOURCE', 'RECEIPT'].includes(item.kind) || (item.observedAt !== undefined && (typeof item.observedAt !== 'string' || !Number.isFinite(Date.parse(item.observedAt))))))) throw new Error('JEV_STATE_INVALID: evidence invalid.');
}

/** Validate the complete local assessment before restoring untrusted device data. */
export function isLocalAssessment(value: unknown): value is JevAssessment {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || value.id.length > 200 ||
    typeof value.packId !== 'string' || !Object.hasOwn(QUESTION_PACKS, value.packId) ||
    value.providerMode !== 'LOCAL_RULES' || value.questionSetVersion !== '1.0' ||
    typeof value.status !== 'string' || !['RULE_HINT', 'ABSTAIN', 'INVALID'].includes(value.status) || !isRecord(value.answers) ||
    !isRecord(value.policy) || value.policy.version !== '1.0' || value.policy.outcome !== 'REVIEW_REQUIRED' ||
    !Array.isArray(value.policy.reasonCodes) || !value.policy.reasonCodes.length || value.policy.reasonCodes.length > 100 ||
    value.policy.reasonCodes.some(reason => typeof reason !== 'string' || !reason || reason.length > 200) ||
    !value.policy.reasonCodes.includes('LOCAL_RULES_UNCALIBRATED') || !value.policy.reasonCodes.includes('AUTHORITATIVE_POLICY_AND_APPROVAL_REQUIRED') ||
    !Array.isArray(value.evidence) || typeof value.createdAt !== 'string' || value.createdAt.length > 80 ||
    !Number.isFinite(Date.parse(value.createdAt)) || !finite(value.latencyMs) || value.latencyMs < 0) return false;
  try {
    validateState({ text: '', evidence: value.evidence, entityId: value.entityId, entityRevision: value.entityRevision });
  } catch {
    return false;
  }
  const pack = QUESTION_PACKS[value.packId as JevPackId];
  const answers = value.answers;
  const expectedCount = value.status === 'RULE_HINT' ? pack.questions.length : 0;
  if (Object.keys(answers).length !== expectedCount) return false;
  return pack.questions.every(question => {
    if (expectedCount === 0) return true;
    const answer = answers[question.id];
    if (!isRecord(answer) || answer.type !== question.type || answer.confidence !== null || answer.probabilities !== null ||
      typeof answer.reason !== 'string' || !answer.reason || answer.reason.length > 2000) return false;
    if (question.id === 'rootCause') return answer.value === 'UNDETERMINED';
    if (question.type === 'choice') return typeof answer.value === 'string' && Object.hasOwn(question.criteria, answer.value);
    if (question.type === 'score') return answer.value === null;
    return answer.value === null || typeof answer.value === 'boolean';
  });
}

const hint = (type: JevQuestion['type'], value: JevRuleAnswer['value'], reason: string): JevRuleAnswer => ({ type, value, confidence: null, probabilities: null, reason });

// Conservative negation handling is a local routing aid, not a calibrated language model.
function clauses(text: string): string[] {
  return text.split(/[.!?;,\n]|\b(?:tetapi|tapi|but|however)\b/i);
}
const negation = /\b(tak|tidak|bukan|jangan|belum|no|not|never|without)\b/i;
function positiveMention(text: string, phrase: RegExp): boolean {
  return clauses(text).some(clause => phrase.test(clause) && !negation.test(clause));
}

function requestHint(text: string, mention: RegExp, request: RegExp, denial: RegExp): boolean | null {
  const matching = clauses(text).filter(clause => mention.test(clause));
  if (matching.some(clause => request.test(clause) && !negation.test(clause))) return true;
  if (!matching.length || matching.every(clause => denial.test(clause) || /\b(?:do not|don't|does not|tak|tidak)\s+(?:want|need|mahu|nak)\s+(?:a\s+)?refund\b/i.test(clause))) return false;
  // A topic mention or unresolved mixed negation does not establish a request.
  return null;
}

const agentApplication = /\b(?:nak|mahu|ingin|want|apply|mohon|memohon)(?:\s+(?:to|jadi|become|join|sebagai|a|an|seorang)){0,3}\s+(?:ejen|agent|stokis|dealer)\b/;
export const LOCAL_EVALUATOR_VERSION = 'local-rules-2.0.0';

/** Zero-network baseline. Caller must authorize scope before supplying any state. */
export function assessState(packId: JevPackId, state: JevState): JevAssessment {
  if (!Object.hasOwn(QUESTION_PACKS, packId)) throw new Error('JEV_PACK_INVALID');
  validateState(state);
  const started = performance.now();
  const text = state.text.trim().toLowerCase();
  const answers: Record<string, JevRuleAnswer> = {};
  const reasonCodes = ['LOCAL_RULES_UNCALIBRATED', 'AUTHORITATIVE_POLICY_AND_APPROVAL_REQUIRED'];
  // These bounded detectors conservatively abstain; they are not comprehensive language security.
  const untrustedText = [text, ...(state.evidence ?? []).map(item => item.text)].join('\n');
  const claimText = [text, ...(state.evidence ?? []).filter(item => item.kind === 'CUSTOMER_CLAIM').map(item => item.text)].join('\n');
  const instruction = /\b(?:ignore|disregard|override)\b.{0,60}\b(?:instructions?|rules?|policy|system)\b|\babaikan\b.{0,60}\b(?:arahan|polisi|peraturan)\b|\b(?:system|assistant)\s*:/i.test(untrustedText);
  const sarcasm = /(?:\/s\b|\b(?:sarcasm|sarcastic|sarkastik)\b)|\b(?:great|wonderful|excellent|terbaik|bagus)\b.{0,80}\b(?:bocor|leak|leaking)\b/i.test(claimText);
  const leakagePhrase = /\b(?:bocor|leak|leaking)\b/;
  const leakageClauses = clauses(claimText).filter(clause => leakagePhrase.test(clause));
  const contradictory = leakageClauses.some(clause => !negation.test(clause)) && leakageClauses.some(clause => negation.test(clause));
  if (instruction || sarcasm || contradictory) {
    reasonCodes.push(...(instruction ? ['UNTRUSTED_INSTRUCTION'] : []), ...(sarcasm ? ['SARCASTIC_OR_AMBIGUOUS'] : []), ...(contradictory ? ['CONTRADICTORY_CLAIMS'] : []));
  } else if (text && packId === 'support') {
    const leak = positiveMention(text, /\b(bocor|meleleh|tumpah|leak|leaking)\b/);
    const seal = positiveMention(text, /\b(?:seal|penutup)(?:\s+\w+){0,3}\s+(?:rosak|pecah|longgar|broken|damaged|loose|failure|failed)\b|\b(?:rosak|pecah|longgar|broken|damaged|loose)(?:\s+\w+){0,3}\s+(?:seal|penutup)\b/);
    const refund = requestHint(text, /\b(refund|pemulangan wang|pulangkan duit)\b/,
      /\b(?:nak|mahu|minta|want|request|need|please)(?:\s+(?:a|the|saya))?\s+(?:refund|pemulangan wang)\b|\bpulangkan duit\b|\brefund\s+(?:please|tolong)\b/,
      /\b(?:tak|tidak|bukan|jangan|no|not|never|without)(?:\s+(?:nak|mahu|minta|want|a|the))?\s+(?:refund|pemulangan wang|pulangkan duit)\b/);
    const agent = positiveMention(text, agentApplication);
    const location = /\b(lokasi|mana|booth|gerai|location)\b/.test(text);
    const intent = refund === true ? 'REFUND' : leak || seal ? 'COMPLAINT' : agent ? 'AGENT_APPLICATION' : location ? 'LOCATION_QUERY' : 'UNKNOWN';
    answers.intent = hint('choice', intent, 'Explicit keyword routing; verify interpretation with the customer.');
    answers.issue = hint('choice', leak ? 'LEAKAGE' : seal ? 'SEAL_FAILURE' : 'UNKNOWN', 'Customer allegation only.');
    answers.rootCause = hint('choice', 'UNDETERMINED', 'Physical investigation and authorized verification required.');
    answers.urgency = hint('score', null, 'Urgency needs contextual review; no inferred numeric score.');
    answers.refundRequested = hint('noul', refund, 'Request hint is not refund eligibility or approval.');
    answers.humanRequested = hint('noul', positiveMention(text, /\b(manusia|staff|human|pegawai)\b/), 'Explicit request hint; no probability calculated.');
    reasonCodes.push('NO_AUTOMATIC_REFUND', 'ROOT_CAUSE_UNDETERMINED');
  } else if (text && packId === 'marketing') {
    const pillar = /\b(resipi|recipe)\b/.test(text) ? 'RECIPE' : /\b(founder|pengasas)\b/.test(text) ? 'FOUNDER' : /\b(stokis|ejen|dealer)\b/.test(text) ? 'DEALER' : /\b(produk|product|colek)\b/.test(text) ? 'PRODUCT' : 'UNKNOWN';
    answers.pillar = hint('choice', pillar, 'Content keyword hint.');
    answers.healthClaim = hint('noul', /\b(sembuh|merawat|cure|diabetes|ubat|kurus|detox)\b/.test(text), 'Potential health claim requires qualified review.');
    answers.priceMention = hint('noul', /(?:\brm\s*\d|\bmyr\s*\d|\$\d)/.test(text), 'Match price against current published catalogue.');
    answers.readiness = hint('score', null, 'Rights, stock, current prices and account readiness require authoritative checks.');
    reasonCodes.push('NO_AUTOMATIC_PUBLISH', 'MEDIA_RIGHTS_AND_PRODUCT_FACTS_REQUIRED');
  } else if (text && packId === 'dealer') {
    const intent = positiveMention(text, /\b(restock|tambah stok|pesan stok)\b/) ? 'RESTOCK' : positiveMention(text, /\b(terima|receiving)\b/) ? 'RECEIVING' : positiveMention(text, agentApplication) ? 'APPLICATION' : 'UNKNOWN';
    answers.intent = hint('choice', intent, 'Dealer request keyword hint.');
    answers.trainingRequested = hint('noul', positiveMention(text, /\b(latihan|training|belajar)\b/), 'Explicit training request hint.');
    reasonCodes.push('LEDGER_AND_COMMERCIAL_POLICY_REQUIRED');
  } else if (text && packId === 'order_exception') {
    const exception = positiveMention(text, /\b(payment|bayar|bayaran|paid)\b/) ? 'PAYMENT' : positiveMention(text, /\b(price|harga)\b/) ? 'PRICE' : positiveMention(text, /\b(delivery|penghantaran|lambat|late)\b/) ? 'DELIVERY' : positiveMention(text, /\b(cancel|batal|cancellation)\b/) ? 'CANCELLATION' : 'UNKNOWN';
    answers.exception = hint('choice', exception, 'Order exception routing only; prose cannot establish ledger truth.');
    answers.paymentVerified = hint('noul', state.facts?.paymentVerified ?? null, 'Only server-verified payment ledger context may establish this fact.');
    answers.canonicalPriceKnown = hint('noul', state.facts?.canonicalPriceKnown ?? null, 'Requires canonical order/catalogue revision context.');
    answers.readiness = hint('score', null, 'No numeric readiness or transactional permission inferred.');
    reasonCodes.push('NO_AUTOMATIC_PAYMENT_OR_REFUND');
  } else if (text && packId === 'qc') {
    const issue = positiveMention(text, /\b(bocor|leak|leaking)\b/) ? 'LEAKAGE' : positiveMention(text, /\b(seal|penutup)\b.{0,30}\b(rosak|broken|damaged)\b/) ? 'SEAL_FAILURE' : positiveMention(text, /\b(contamination|tercemar|pencemaran)\b/) ? 'CONTAMINATION' : positiveMention(text, /\b(temperature|suhu)\b/) ? 'TEMPERATURE' : 'UNKNOWN';
    answers.issue = hint('choice', issue, 'QC allegation routing; measurements need authorized review.');
    answers.evidenceComplete = hint('noul', state.facts?.evidenceComplete ?? null, 'Completeness only; attachment contents are not machine-verified.');
    answers.sopCurrent = hint('noul', state.facts?.sopCurrent ?? null, 'SOP version check from authorized context.');
    answers.releaseReadiness = hint('score', null, 'QC release remains a separate domain authorization gate.');
    reasonCodes.push('NO_AUTOMATIC_QC_RELEASE');
  } else if (text) {
    const risk = /\b(auth|permission|token|rls)\b/.test(text) ? 'AUTH' : /\b(schema|migration)\b/.test(text) ? 'SCHEMA' : /\b(send|publish|refund|delete)\b/.test(text) ? 'SIDE_EFFECT' : /\b(ui|css|layout)\b/.test(text) ? 'UI' : 'UNKNOWN';
    answers.risk = hint('choice', risk, 'Review routing hint; does not replace code review.');
    answers.reviewRequired = hint('noul', true, 'Human review and passing gates required.');
    reasonCodes.push('TEST_AND_REVIEW_REQUIRED');
  }
  return {
    id: `jev-${crypto.randomUUID()}`, packId, questionSetVersion: '1.0', providerMode: 'LOCAL_RULES',
    status: text && Object.keys(answers).length ? 'RULE_HINT' : 'ABSTAIN', answers,
    policy: { version: '1.0', outcome: 'REVIEW_REQUIRED', reasonCodes: text ? reasonCodes : [...reasonCodes, 'EMPTY_STATE'] },
    evidence: (state.evidence ?? []).map(item => ({ ...item })), entityId: state.entityId, entityRevision: state.entityRevision,
    createdAt: new Date().toISOString(), latencyMs: Math.round((performance.now() - started) * 100) / 100,
    schemaVersion: '1.0', evaluatorVersion: LOCAL_EVALUATOR_VERSION, abstentionReasons: reasonCodes.filter(reason => ['UNTRUSTED_INSTRUCTION', 'SARCASTIC_OR_AMBIGUOUS', 'CONTRADICTORY_CLAIMS'].includes(reason)),
  };
}

/** Bound working text, retaining references and unresolved operations verbatim. */
export function compactState(state: JevState, maxCharacters = 8000): JevState & { truncated: boolean } {
  validateState(state);
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters < 1 || maxCharacters > 32000) throw new Error('JEV_COMPACTION_LIMIT_INVALID');
  return { ...state, text: state.text.slice(0, maxCharacters), facts: state.facts ? { ...state.facts } : undefined, evidence: state.evidence?.map(item => ({ ...item })), constraints: state.constraints ? [...state.constraints] : undefined, pendingOperations: state.pendingOperations ? [...state.pendingOperations] : undefined, truncated: state.text.length > maxCharacters };
}

export function prepareAction(result: { id: string; inputText: string; recommendedAction: string }, action: 'email' | 'task' | 'calendar' | 'sheet'): JevActionPreview {
  if (!result || typeof result.id !== 'string' || !result.id || result.id.length > 200 || typeof result.inputText !== 'string' || result.inputText.length > 32000 || typeof result.recommendedAction !== 'string' || result.recommendedAction.length > 8000) throw new Error('JEV_ACTION_INPUT_INVALID');
  const operations = { email: 'CREATE_DRAFT', task: 'CREATE_TASK', calendar: 'CREATE_EVENT', sheet: 'CREATE_SHEET' } as const;
  if (!Object.hasOwn(operations, action)) throw new Error('JEV_ACTION_TYPE_INVALID');
  return { id: `preview-${crypto.randomUUID()}`, assessmentId: result.id, operation: operations[action], status: 'PREPARED', recipient: null, title: `Semakan ABANGCOLEK: ${result.id}`, body: `Laporan: ${result.inputText}\n\nCadangan untuk semakan: ${result.recommendedAction}`, requiresApproval: true, notice: 'Pratonton sahaja. Tiada emel dihantar atau rekod Google dicipta. Pilih penerima dan sahkan melalui aliran tindakan berautoriti.' };
}
