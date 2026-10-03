import type { JevAllowedContext, JevAssessment, JevContextSource, JevEvaluationCase, JevEvaluationErrorClass, JevEvaluationMetric, JevEvaluationRun, JevPackId, JevState } from '../../../shared/jev-contracts';
import type { CampaignRecord, DocumentRecord, EvidenceRecord, KnowledgeEntry, QcRecord, RestockRecord } from '../../../shared/platform-contracts';
import { Auth, hash, type Principal } from '../auth';
import { Commerce } from '../commerce';
import { DomainError, fail, fields, id, list, now, object, oneOf, PlatformStore, text } from '../store';
import { Work } from '../work';
import { assessState, LOCAL_EVALUATOR_VERSION } from './assessment';
import { QUESTION_PACKS } from './questionRegistry';

const packIds = Object.keys(QUESTION_PACKS) as JevPackId[];
const errorClasses: JevEvaluationErrorClass[] = ['negation', 'sarcasm', 'contradictory_evidence', 'missing_evidence', 'missing_price', 'missing_payment', 'prompt_injection', 'stale_knowledge', 'routing'];
const source = (recordId: string, kind: JevContextSource['kind'], version: number, content: unknown): JevContextSource => ({ id: recordId, kind, version, contentHash: hash(JSON.stringify(content)) });
interface StoredAssessment extends JevAssessment { ownerId: string }
interface QcSop { id: string; version: number; knowledgeId: string; knowledgeVersion: number; readings: { name: string; unit: string }[] }
interface Outcome { item: JevEvaluationCase; result: JevAssessment; questions: string[]; unknown: number; count: number }

function metric(outcomes: Outcome[]): JevEvaluationMetric {
  const cases = outcomes.length, matchedCases = outcomes.filter(outcome => !outcome.questions.length).length;
  const abstentions = outcomes.filter(outcome => outcome.result.status === 'ABSTAIN').length;
  const unknownAnswers = outcomes.reduce((sum, outcome) => sum + outcome.unknown, 0), totalAnswers = outcomes.reduce((sum, outcome) => sum + outcome.count, 0);
  return { cases, matchedCases, abstentions, unknownAnswers, totalAnswers, matchRate: cases ? matchedCases / cases : 0, abstentionRate: cases ? abstentions / cases : 0, coverage: totalAnswers ? (totalAnswers - unknownAnswers) / totalAnswers : 0 };
}

/** Local evaluation is advisory. This service exposes no transaction executor. */
export class JevEvaluations {
  constructor(readonly store: PlatformStore, readonly auth: Auth, readonly commerce: Commerce, readonly work: Work) {}

  evaluator(actor: Principal) {
    if (!this.auth.has(actor, 'founder') && !this.auth.has(actor, 'developer')) fail('FORBIDDEN', 403);
  }

  packs(actor: Principal) {
    if (!actor.memberships.some(member => member.status === 'active')) fail('FORBIDDEN', 403);
    return packIds.map(packId => ({ id: packId, version: QUESTION_PACKS[packId].version, schemaVersion: '1.0', providerMode: 'LOCAL_RULES', providerVersion: LOCAL_EVALUATOR_VERSION, activation: 'REVIEW_ONLY', nativeAvailable: false, questions: QUESTION_PACKS[packId].questions }));
  }

  context(actor: Principal, requestedPack: string, requestedEntity: string): JevAllowedContext {
    const packId = oneOf(requestedPack, packIds), entityId = text(requestedEntity, 'Entity ID', 120);
    // Developer access covers technical evaluation only, never customer or financial records.
    if (packId === 'developer') {
      this.evaluator(actor);
      if (entityId !== 'runtime') fail('JEV_ENTITY_SCOPE', 403);
      const state: JevState = { text: 'Runtime configuration review', entityId, entityRevision: 1, constraints: ['Review only; no deployment or transaction authority'] };
      return this.snapshot(actor, packId, entityId, 1, state, []);
    }
    this.work.entity(actor, entityId);
    let primary: unknown, primaryText = '', revision = 1;
    const facts: JevState['facts'] = {};
    const factSources: JevContextSource[] = [];
    if (packId === 'support') {
      const record = this.work.case(actor, entityId);
      primary = record; primaryText = record.description; revision = record.revision;
    } else if (packId === 'order_exception') {
      const record = this.commerce.order(actor, entityId);
      primary = record; revision = record.revision;
      primaryText = `Order exception review. Payment state: ${record.paymentState}. Fulfilment: ${record.fulfilmentStatus}.`;
      const receipts = this.store.all<{ id: string; orderId: string; state: string; amountSen: number }>('payments').filter(payment => payment.orderId === entityId && payment.state === 'confirmed');
      for (const receipt of receipts) factSources.push(source(receipt.id, 'LEDGER', 1, receipt));
      facts.paymentVerified = record.paymentState === 'verified' && receipts.reduce((sum, receipt) => sum + receipt.amountSen, 0) === record.paidAmountSen && record.paidAmountSen >= record.amountSen ? true : record.paymentState === 'rejected' ? false : null;
      // Legacy order records do not retain a published catalogue revision: do not invent one.
      facts.canonicalPriceKnown = null;
    } else if (packId === 'marketing') {
      const record = this.store.require<CampaignRecord>('campaigns', entityId);
      primary = record; primaryText = record.copy; revision = record.revision;
    } else if (packId === 'dealer') {
      const record = this.store.require<RestockRecord>('restocks', entityId);
      primary = record; primaryText = `Restock request, status ${record.status}`; revision = record.revision;
    } else {
      const record = this.store.require<QcRecord>('qc', entityId);
      primary = record; primaryText = `QC batch review ${record.batchId}, status ${record.status}`; revision = record.revision;
      const sop = this.store.get<QcSop>('qc_sops', record.sopId);
      const knowledge = sop ? this.store.get<KnowledgeEntry>('knowledge', sop.knowledgeId) : null;
      const document = knowledge ? this.store.get<DocumentRecord>('documents', knowledge.documentId) : null;
      facts.sopCurrent = sop && knowledge && document ? sop.version === record.sopVersion && sop.knowledgeVersion === knowledge.version && knowledge.status === 'approved' && (!knowledge.expiresAt || knowledge.expiresAt > now()) && document.version === knowledge.version && document.approvedVersion === knowledge.version : null;
      facts.evidenceComplete = null;
      // Completeness is a document check, not a physical safety verdict or release approval.
      if (sop) facts.evidenceComplete = record.readings.length === sop.readings.length && sop.readings.every(required => record.readings.some(reading => reading.name === required.name && reading.unit === required.unit)) && record.evidenceIds.length > 0;
      if (sop) factSources.push(source(sop.id, 'POLICY', sop.version, sop));
    }
    const sources: JevContextSource[] = [source(entityId, 'ENTITY', revision, primary), ...factSources];
    const evidence = this.work.evidence(actor, entityId);
    if (packId === 'qc') {
      const record = primary as QcRecord;
      for (const evidenceId of record.evidenceIds) {
        const item = this.store.get<EvidenceRecord>('evidence', evidenceId);
        if (!item) { facts.evidenceComplete = false; continue; }
        this.work.entity(actor, item.entityId);
        if (!evidence.some(existing => existing.id === item.id)) evidence.push(item);
      }
    }
    const visibleEvidence = evidence.filter(item => item.visibility !== 'private' || item.ownerId === actor.user.id || this.auth.has(actor, 'founder'));
    const allowedEvidence = visibleEvidence.slice(0, 50);
    if (packId === 'qc' && allowedEvidence.some(item => item.kind !== 'file' || !item.sha256)) facts.evidenceComplete = null;
    if (packId === 'qc' && (primary as QcRecord).evidenceIds.some(evidenceId => !allowedEvidence.some(item => item.id === evidenceId))) facts.evidenceComplete = null;
    for (const item of allowedEvidence) sources.push(source(item.id, 'EVIDENCE', 1, { id: item.id, sha256: item.sha256, kind: item.kind, createdAt: item.createdAt }));
    const state: JevState = { text: primaryText, entityId, entityRevision: revision, facts, constraints: ['Review only; business authority is enforced by domain commands'], evidence: allowedEvidence.map(item => ({ id: item.id, kind: 'CUSTOMER_CLAIM', text: `${item.name}; ${item.kind === 'file' ? 'file contents require authorized human examination' : 'metadata only, file not verified'}`, observedAt: item.createdAt })) };
    if (this.auth.has(actor, 'founder') || this.auth.has(actor, 'staff')) {
      for (const knowledge of this.store.all<KnowledgeEntry>('knowledge')) {
        if (knowledge.status !== 'approved' || (knowledge.expiresAt && knowledge.expiresAt <= now())) continue;
        const document = this.store.get<DocumentRecord>('documents', knowledge.documentId);
        if (!document || document.visibility !== 'business' || document.version !== knowledge.version || document.approvedVersion !== knowledge.version || !document.entityIds.some(link => link === entityId || link === 'business')) continue;
        this.work.document(actor, document.id);
        if ((state.evidence?.length ?? 0) >= 50) break;
        sources.push(source(knowledge.id, 'KNOWLEDGE', knowledge.version, { document, knowledge }));
        state.evidence!.push({ id: knowledge.id, kind: 'SOURCE', text: `${knowledge.title}\n${knowledge.body}`.slice(0, 8000) });
      }
    }
    return this.snapshot(actor, packId, entityId, revision, state, sources);
  }

  private snapshot(actor: Principal, packId: JevPackId, entityId: string, entityRevision: number, state: JevState, sources: JevContextSource[]): JevAllowedContext {
    const version = hash(JSON.stringify({ schema: '1.0', redaction: '1.0', evaluatorVersion: LOCAL_EVALUATOR_VERSION, packId, packVersion: QUESTION_PACKS[packId].version, actorId: actor.user.id, memberships: actor.memberships.map(member => ({ id: member.id, version: member.version, status: member.status })), sources, state }));
    return { version, actorId: actor.user.id, entityId, entityRevision, packId, sources, state, selectedAt: now() };
  }

  assess(actor: Principal, raw: unknown): JevAssessment {
    const input = object(raw); fields(input, ['packId', 'entityId', 'expectedRevision', 'text']);
    const context = this.context(actor, text(input.packId), text(input.entityId));
    this.store.revision(context.entityRevision, input.expectedRevision);
    const annotation = input.text === undefined ? '' : text(input.text, 'Review note', 8000);
    const assessment = assessState(context.packId, { ...context.state, text: `${context.state.text}${annotation ? `\nUnverified review note: ${annotation}` : ''}` });
    const saved: StoredAssessment = { ...assessment, contextVersion: context.version, sourceRefs: context.sources, ownerId: actor.user.id };
    this.store.atomic(() => { this.store.save('jev_assessments', saved); this.store.audit(actor.user.id, 'jev.assess', saved.id); });
    const { ownerId: _, ...result } = saved;
    return result;
  }

  assessments(actor: Principal): (JevAssessment & { contextStatus: 'CURRENT' | 'STALE' })[] {
    const records: (JevAssessment & { contextStatus: 'CURRENT' | 'STALE' })[] = [];
    for (const stored of this.store.all<StoredAssessment>('jev_assessments')) {
      if (stored.packId === 'developer' && stored.ownerId !== actor.user.id && !this.auth.has(actor, 'founder')) continue;
      try {
        const context = this.context(actor, stored.packId, stored.entityId ?? '');
        const { ownerId: _, ...record } = stored;
        // Historical text must still meet current visibility and revision constraints.
        const allowedSources = context.sources;
        const currentSources = (record.sourceRefs ?? []).filter(previous => allowedSources.some(current => current.id === previous.id && current.version === previous.version && current.contentHash === previous.contentHash));
        const sourceIds = new Set(currentSources.map(current => current.id));
        records.push({ ...record, sourceRefs: currentSources, evidence: record.evidence.filter(item => sourceIds.has(item.id)), contextStatus: context.version === stored.contextVersion ? 'CURRENT' : 'STALE' });
      } catch (error) {
        if (error instanceof DomainError && [403, 404].includes(error.status)) continue;
        throw error;
      }
    }
    return records;
  }

  evaluations(actor: Principal): JevEvaluationRun[] { this.evaluator(actor); return this.store.all<JevEvaluationRun>('jev_evaluations'); }

  evaluate(actor: Principal, raw: unknown): JevEvaluationRun {
    this.evaluator(actor);
    const input = object(raw); fields(input, ['datasetId', 'datasetVersion', 'split', 'cases']);
    const datasetId = text(input.datasetId, 'Dataset ID', 120), datasetVersion = text(input.datasetVersion, 'Dataset version', 80), split = oneOf(input.split, ['held_out'] as const);
    const items = list(input.cases, 100).map(value => this.evaluationCase(value));
    if (!items.length || new Set(items.map(item => item.id)).size !== items.length) fail('JEV_DATASET_INVALID');
    const datasetHash = hash(JSON.stringify(items));
    if (this.store.all<JevEvaluationRun>('jev_evaluations').some(record => record.datasetId === datasetId && record.datasetVersion === datasetVersion && record.datasetHash !== datasetHash)) fail('JEV_DATASET_VERSION_CONFLICT', 409, 'Dataset berubah. Gunakan version baharu.');
    const start = performance.now(), latencies: number[] = [];
    const outcomes: Outcome[] = items.map(item => {
      const result = assessState(item.packId, { text: item.text }); latencies.push(result.latencyMs);
      const mismatches = Object.entries(item.expected).filter(([question, expected]) => (result.answers[question]?.value ?? null) !== expected).map(([question]) => question);
      if (item.expectedStatus && result.status !== item.expectedStatus) mismatches.push('$status');
      const packQuestions = QUESTION_PACKS[item.packId].questions;
      return { item, result, questions: mismatches, count: packQuestions.length, unknown: packQuestions.filter(question => result.answers[question.id]?.value == null || result.answers[question.id]?.value === 'UNKNOWN' || result.answers[question.id]?.value === 'UNDETERMINED').length };
    });
    const byPack: JevEvaluationRun['byPack'] = {}, byErrorClass: JevEvaluationRun['byErrorClass'] = {}, packVersions: JevEvaluationRun['packVersions'] = {};
    for (const packId of new Set(items.map(item => item.packId))) { byPack[packId] = metric(outcomes.filter(outcome => outcome.item.packId === packId)); packVersions[packId] = QUESTION_PACKS[packId].version; }
    for (const errorClass of new Set(items.map(item => item.errorClass))) byErrorClass[errorClass] = metric(outcomes.filter(outcome => outcome.item.errorClass === errorClass));
    latencies.sort((a, b) => a - b);
    const run: JevEvaluationRun = { id: id(), datasetId, datasetVersion, datasetHash, split, schemaVersion: '1.0', packVersions, providerMode: 'LOCAL_RULES', providerVersion: LOCAL_EVALUATOR_VERSION, caseCount: items.length, metrics: metric(outcomes), byPack, byErrorClass, errors: outcomes.filter(outcome => outcome.questions.length).map(outcome => ({ caseId: outcome.item.id, packId: outcome.item.packId, errorClass: outcome.item.errorClass, questionIds: outcome.questions })), observedLatency: { totalMs: Math.round((performance.now() - start) * 100) / 100, meanMs: latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length, p95Ms: latencies[Math.max(0, Math.ceil(latencies.length * 0.95) - 1)] }, usage: { providerCalls: 0, newSpendSen: 0, inputTokens: null, outputTokens: null }, calibration: { status: 'NOT_APPLICABLE_LOCAL_RULES', reason: 'No model probabilities exist. Match rate measures the supplied labels only, not calibrated confidence or production quality.' }, activation: 'REVIEW_ONLY', createdAt: now() };
    this.store.atomic(() => { this.store.save('jev_evaluations', run); this.store.audit(actor.user.id, 'jev.evaluate', run.id); });
    return run;
  }

  private evaluationCase(raw: unknown): JevEvaluationCase {
    const input = object(raw); fields(input, ['id', 'locale', 'errorClass', 'packId', 'text', 'expected', 'expectedStatus']);
    const packId = oneOf(input.packId, packIds), expected = object(input.expected);
    if (!Object.keys(expected).length) fail('JEV_EXPECTATION_REQUIRED');
    for (const [questionId, value] of Object.entries(expected)) {
      const question = QUESTION_PACKS[packId].questions.find(item => item.id === questionId);
      if (!question || (value !== null && (question.type === 'choice' ? typeof value !== 'string' || !Object.hasOwn(question.criteria, value) : question.type === 'noul' ? typeof value !== 'boolean' : true))) fail('JEV_EXPECTATION_INVALID');
    }
    return { id: text(input.id, 'Case ID', 120), locale: oneOf(input.locale, ['ms', 'en'] as const), errorClass: oneOf(input.errorClass, errorClasses), packId, text: text(input.text, 'Sanitized evaluation text', 8000), expected: expected as JevEvaluationCase['expected'], ...(input.expectedStatus === undefined ? {} : { expectedStatus: oneOf(input.expectedStatus, ['RULE_HINT', 'ABSTAIN', 'INVALID'] as const) }) };
  }
}
