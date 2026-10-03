export type JevPackId = 'support' | 'marketing' | 'dealer' | 'developer' | 'order_exception' | 'qc';
export type JevProviderMode = 'LOCAL_RULES' | 'GENERATIVE_EMULATION' | 'TYPESAFE_NATIVE';
export type JevEvidenceKind = 'BUSINESS_FACT' | 'CUSTOMER_CLAIM' | 'SOURCE' | 'RECEIPT';
export interface JevEvidence { id: string; kind: JevEvidenceKind; text: string; observedAt?: string }
export interface JevState {
  text: string;
  evidence?: JevEvidence[];
  entityId?: string;
  entityRevision?: number;
  constraints?: string[];
  pendingOperations?: string[];
  /** Supplied by the authorized server context builder, never inferred from prose. */
  facts?: Partial<Record<'paymentVerified' | 'canonicalPriceKnown' | 'evidenceComplete' | 'sopCurrent', boolean | null>>;
}
export type JevQuestion =
  | { id: string; type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { id: string; type: 'score'; instructions: string; criteria: string[] }
  | { id: string; type: 'noul'; instructions: string };
export type JevNativeAnswer =
  | { type: 'choice'; choice: string; probabilities: Record<string, number>; confidence: number }
  | { type: 'score'; score: number; probabilities: Record<string, number>; confidence: number }
  | { type: 'noul'; noul: number };
export interface JevRuleAnswer {
  type: JevQuestion['type'];
  value: string | number | boolean | null;
  confidence: null;
  probabilities: null;
  reason: string;
}
export interface JevPolicy {
  outcome: 'READ_ONLY' | 'REVIEW_REQUIRED' | 'BLOCKED';
  reasonCodes: string[];
  version: '1.0';
}
export interface JevAssessment {
  id: string;
  packId: JevPackId;
  questionSetVersion: '1.0';
  providerMode: 'LOCAL_RULES';
  status: 'RULE_HINT' | 'ABSTAIN' | 'INVALID';
  answers: Record<string, JevRuleAnswer>;
  policy: JevPolicy;
  evidence: JevEvidence[];
  entityId?: string;
  entityRevision?: number;
  createdAt: string;
  latencyMs: number;
  schemaVersion?: '1.0';
  evaluatorVersion?: string;
  contextVersion?: string;
  sourceRefs?: JevContextSource[];
  abstentionReasons?: string[];
}

export interface JevContextSource {
  id: string;
  kind: 'ENTITY' | 'KNOWLEDGE' | 'EVIDENCE' | 'POLICY' | 'LEDGER';
  version: number;
  contentHash: string;
}
export interface JevAllowedContext {
  version: string;
  actorId: string;
  entityId: string;
  entityRevision: number;
  packId: JevPackId;
  sources: JevContextSource[];
  state: JevState;
  selectedAt: string;
}
export type JevEvaluationErrorClass = 'negation' | 'sarcasm' | 'contradictory_evidence' | 'missing_evidence' | 'missing_price' | 'missing_payment' | 'prompt_injection' | 'stale_knowledge' | 'routing';
export interface JevEvaluationCase {
  id: string;
  locale: 'ms' | 'en';
  errorClass: JevEvaluationErrorClass;
  packId: JevPackId;
  text: string;
  expected: Record<string, JevRuleAnswer['value']>;
  expectedStatus?: JevAssessment['status'];
}
export interface JevEvaluationMetric {
  cases: number;
  matchedCases: number;
  abstentions: number;
  unknownAnswers: number;
  totalAnswers: number;
  matchRate: number;
  abstentionRate: number;
  coverage: number;
}
export interface JevEvaluationRun {
  id: string;
  datasetId: string;
  datasetVersion: string;
  datasetHash: string;
  split: 'held_out';
  schemaVersion: '1.0';
  packVersions: Partial<Record<JevPackId, string>>;
  providerMode: 'LOCAL_RULES';
  providerVersion: string;
  caseCount: number;
  metrics: JevEvaluationMetric;
  byPack: Partial<Record<JevPackId, JevEvaluationMetric>>;
  byErrorClass: Partial<Record<JevEvaluationErrorClass, JevEvaluationMetric>>;
  errors: { caseId: string; packId: JevPackId; errorClass: JevEvaluationErrorClass; questionIds: string[] }[];
  observedLatency: { totalMs: number; meanMs: number; p95Ms: number };
  usage: { providerCalls: 0; newSpendSen: 0; inputTokens: null; outputTokens: null };
  calibration: { status: 'NOT_APPLICABLE_LOCAL_RULES'; reason: string };
  activation: 'REVIEW_ONLY';
  createdAt: string;
}
export interface JevActionPreview {
  id: string;
  assessmentId: string;
  status: 'PREPARED';
  operation: 'CREATE_DRAFT' | 'CREATE_TASK' | 'CREATE_EVENT' | 'CREATE_SHEET';
  recipient: null;
  title: string;
  body: string;
  requiresApproval: true;
  notice: string;
}
