/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { assessState, isLocalAssessment, prepareAction } from '../../server/platform/jev/assessment';
import type { JevActionPreview, JevAssessment } from '../../shared/jev-contracts';

export const JEV_MODEL = 'local-rules-v1';

// 7-Dimension JEV Taxonomy strictly adhering to Abang Colek Discovery
export const JEV_TAXONOMY = {
  Brand: ['ABANGCOLEK', 'LIURLELEH', 'JERUX', 'MULTI_BRAND', 'UNKNOWN'] as const,
  BusinessFunction: [
    'PRODUCTION', 'PROCUREMENT', 'PACKAGING', 'WAREHOUSING', 'INVENTORY',
    'DISTRIBUTION', 'TRANSPORT', 'AGENT_MANAGEMENT', 'DIRECT_SALES', 'RETAIL',
    'POPUP', 'EVENT', 'CUSTOMER_SERVICE', 'MARKETING', 'CONTENT', 'RECRUITMENT',
    'FINANCE', 'COMPLIANCE', 'OTHER', 'UNKNOWN'
  ] as const,
  SalesChannel: [
    'DIRECT', 'SOCIAL_COMMERCE', 'AGENT', 'HOME_SELLER', 'POPUP', 'EVENT',
    'RETAIL', 'DELIVERY', 'COD', 'ONLINE', 'UNKNOWN'
  ] as const,
  CustomerIntent: [
    'PURCHASE', 'PRICE_QUERY', 'STOCK_QUERY', 'LOCATION_QUERY', 'DELIVERY_QUERY',
    'PRODUCT_QUERY', 'CUSTOMIZATION', 'AGENT_APPLICATION', 'JOB_APPLICATION',
    'COMPLAINT', 'REFUND', 'RETURN', 'PRAISE', 'GENERAL_CHAT', 'UNKNOWN'
  ] as const,
  IssueClass: [
    'PRODUCT_QUALITY', 'PACKAGING', 'LEAKAGE', 'SEAL_FAILURE', 'FRESHNESS',
    'TASTE', 'APPEARANCE', 'QUANTITY', 'WRONG_ITEM', 'STOCKOUT', 'DELIVERY_DELAY',
    'DELIVERY_DAMAGE', 'TRANSPORT', 'STORAGE', 'AGENT_HANDLING', 'CUSTOMER_SERVICE',
    'PAYMENT', 'PRICE', 'LOCATION', 'UNKNOWN'
  ] as const,
  ProcessStage: [
    'SUPPLIER', 'RAW_MATERIAL_RECEIVING', 'PRODUCTION', 'FILLING', 'PACKAGING',
    'QC', 'COLD_STORAGE', 'WAREHOUSE', 'DISPATCH', 'TRANSPORT', 'AGENT_RECEIVING',
    'AGENT_STORAGE', 'POS', 'POINT_OF_SALE', 'LAST_MILE', 'LAST_MILE_DELIVERY',
    'CUSTOMER_STORAGE', 'UNKNOWN'
  ] as const,
  RootCauseStatus: [
    'UNDETERMINED', 'HYPOTHESIS', 'UNDER_INVESTIGATION', 'VERIFIED', 'REJECTED'
  ] as const,
};

export type JevBrand = typeof JEV_TAXONOMY.Brand[number];
export type JevBusinessFunction = typeof JEV_TAXONOMY.BusinessFunction[number];
export type JevSalesChannel = typeof JEV_TAXONOMY.SalesChannel[number];
export type JevCustomerIntent = typeof JEV_TAXONOMY.CustomerIntent[number];
export type JevIssueClass = typeof JEV_TAXONOMY.IssueClass[number];
export type JevProcessStage = typeof JEV_TAXONOMY.ProcessStage[number];
export type JevRootCauseStatus = typeof JEV_TAXONOMY.RootCauseStatus[number];

export interface JevDimensionResult<T extends string = string> {
  value: T;
  confidence: number; // 0.0 to 1.0
  probabilities: Record<string, number>;
}

export interface JevNoulResult {
  probability: number; // 0.0 to 1.0
  isAffirmative: boolean; // probability >= 0.5
}

export interface JevScoreResult {
  score: number; // 1.0 to 5.0
  label: string;
  confidence: number;
}

export interface JevClassificationResult {
  providerMode?: 'LOCAL_RULES';
  assessment?: JevAssessment;
  id: string;
  inputText: string;
  timestamp: string;
  latencyMs: number;
  dimensions: {
    brand: JevDimensionResult<JevBrand>;
    businessFunction: JevDimensionResult<JevBusinessFunction>;
    salesChannel: JevDimensionResult<JevSalesChannel>;
    customerIntent: JevDimensionResult<JevCustomerIntent>;
    issueClass: JevDimensionResult<JevIssueClass>;
    processStage: JevDimensionResult<JevProcessStage>;
    rootCauseStatus: JevDimensionResult<JevRootCauseStatus>;
  };
  primitives: {
    urgencyScore: JevScoreResult;
    customerSatisfactionScore: JevScoreResult;
    requiresImmediateIntervention: JevNoulResult;
    isRefundEligible: JevNoulResult;
    isHighValueAgentOpportunity: JevNoulResult;
  };
  recommendedAction: string;
  suggestedSop: string;
  automatedActionsTaken?: {
    taskCreated?: boolean;
    emailDrafted?: boolean;
    calendarScheduled?: boolean;
    sheetLogged?: boolean;
    details?: string;
  };
}

/**
 * Evaluate the support message locally. This baseline makes no model API call.
 * Legacy numeric fields are compatibility placeholders; use assessment for honest
 * uncertainty and never interpret a local hint as a probability or approval.
 */
export async function evaluateWithJev(inputText: string): Promise<JevClassificationResult> {
  const assessment = assessState('support', { text: inputText });
  const intent = String(assessment.answers.intent?.value ?? 'UNKNOWN') as JevCustomerIntent;
  const issue = String(assessment.answers.issue?.value ?? 'UNKNOWN') as JevIssueClass;
  const dimension = <T extends string>(value: T): JevDimensionResult<T> => ({ value, confidence: 0, probabilities: {} });
  const result: JevClassificationResult = {
    id: assessment.id, inputText, timestamp: assessment.createdAt, latencyMs: assessment.latencyMs,
    providerMode: 'LOCAL_RULES', assessment,
    dimensions: {
      brand: dimension('UNKNOWN'),
      businessFunction: dimension(intent === 'AGENT_APPLICATION' ? 'AGENT_MANAGEMENT' : intent === 'UNKNOWN' ? 'UNKNOWN' : 'CUSTOMER_SERVICE'),
      salesChannel: dimension(intent === 'AGENT_APPLICATION' ? 'AGENT' : 'UNKNOWN'),
      customerIntent: dimension(intent), issueClass: dimension(issue),
      processStage: dimension('UNKNOWN'), rootCauseStatus: dimension('UNDETERMINED'),
    },
    primitives: {
      urgencyScore: { score: 0, label: 'Belum dinilai', confidence: 0 },
      customerSatisfactionScore: { score: 0, label: 'Belum dinilai', confidence: 0 },
      requiresImmediateIntervention: { probability: 0, isAffirmative: false },
      isRefundEligible: { probability: 0, isAffirmative: false },
      isHighValueAgentOpportunity: { probability: 0, isAffirmative: false },
    },
    recommendedAction: assessment.status === 'ABSTAIN'
      ? 'Tambah mesej dan bukti sebelum penilaian.'
      : 'Semak mesej, bukti dan polisi semasa bersama staf yang diberi kuasa. Cadangan tempatan belum diluluskan.',
    suggestedSop: 'Sahkan nombor order, batch jika relevan, dan pihak yang bertanggungjawab. Punca fizikal serta eligibility refund memerlukan semakan berautoriti.',
  };
  saveJevEvaluation(result);
  return result;
}

/** Prepare a reviewable action. External execution belongs to an approved domain command. */
export async function executeAutomatedJevAction(
  result: JevClassificationResult,
  actionType: 'task' | 'email' | 'calendar' | 'sheet'
): Promise<{ success: boolean; message: string; preview?: JevActionPreview }> {
  try {
    const preview = prepareAction(result, actionType);
    return { success: true, message: preview.notice, preview };
  } catch {
    return { success: false, message: 'Pratonton tidak dapat disediakan. Semak keputusan dan jenis tindakan.' };
  }
}

let historyScope: string | null = null;
let activeHistoryIdentity: string | null = null;
let volatileHistory: JevClassificationResult[] = [];
let historyLoaded = false;
export type JevHistoryStatus = { mode: 'MEMORY_ONLY' | 'LOCAL_DEVICE'; stored: boolean; error: string | null };
let historyStatus: JevHistoryStatus = { mode: 'MEMORY_ONLY', stored: false, error: null };

/** Scope by verified actor; shared-device persistence needs an explicit user opt-in. */
export function setJevHistoryScope(actorId: string | null, workspaceId: string | null = null, optInPersistence = false): void {
  const identity = actorId && workspaceId ? `abangcolek_jev_v2:${encodeURIComponent(workspaceId)}:${encodeURIComponent(actorId)}` : null;
  const storageKey = optInPersistence === true ? identity : null;
  if (identity === activeHistoryIdentity && storageKey === historyScope) return;
  volatileHistory = [];
  historyLoaded = false;
  activeHistoryIdentity = identity;
  historyScope = storageKey;
  historyStatus = { mode: storageKey ? 'LOCAL_DEVICE' : 'MEMORY_ONLY', stored: false, error: null };
}

export function getJevHistoryStatus(): JevHistoryStatus { return { ...historyStatus }; }

function isStoredEvaluation(value: unknown): value is JevClassificationResult {
  if (!isRecord(value) || !boundedString(value.id, 200) || !value.id || !boundedString(value.inputText, 32000) ||
    value.providerMode !== 'LOCAL_RULES' || !isLocalAssessment(value.assessment) ||
    value.assessment.id !== value.id || value.assessment.packId !== 'support' ||
    !boundedString(value.timestamp, 80) || !Number.isFinite(Date.parse(value.timestamp)) || value.timestamp !== value.assessment.createdAt ||
    typeof value.latencyMs !== 'number' || !Number.isFinite(value.latencyMs) || value.latencyMs < 0 ||
    !boundedString(value.recommendedAction, 8000) || !boundedString(value.suggestedSop, 8000) ||
    !isRecord(value.dimensions) || !isRecord(value.primitives)) return false;
  const dimensions = value.dimensions;
  const enums = {
    brand: JEV_TAXONOMY.Brand, businessFunction: JEV_TAXONOMY.BusinessFunction, salesChannel: JEV_TAXONOMY.SalesChannel,
    customerIntent: JEV_TAXONOMY.CustomerIntent, issueClass: JEV_TAXONOMY.IssueClass,
    processStage: JEV_TAXONOMY.ProcessStage, rootCauseStatus: JEV_TAXONOMY.RootCauseStatus,
  };
  if (!Object.entries(enums).every(([name, allowed]) => {
    const dimension = dimensions[name];
    return isRecord(dimension) && typeof dimension.value === 'string' && (allowed as readonly string[]).includes(dimension.value) &&
      dimension.confidence === 0 && isRecord(dimension.probabilities) && Object.keys(dimension.probabilities).length === 0;
  })) return false;
  const primitives = value.primitives;
  if (!['urgencyScore', 'customerSatisfactionScore'].every(name => {
    const score = primitives[name];
    return isRecord(score) && score.score === 0 && score.confidence === 0 && boundedString(score.label, 200);
  }) || !['requiresImmediateIntervention', 'isRefundEligible', 'isHighValueAgentOpportunity'].every(name => {
    const noul = primitives[name];
    return isRecord(noul) && noul.probability === 0 && noul.isAffirmative === false;
  })) return false;
  const actions = value.automatedActionsTaken;
  return actions === undefined || (isRecord(actions) &&
    ['taskCreated', 'emailDrafted', 'calendarScheduled', 'sheetLogged'].every(name => actions[name] === undefined || actions[name] === false) &&
    (actions.details === undefined || boundedString(actions.details, 8000)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function boundedString(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length <= maximum;
}

export function getSavedJevEvaluations(): JevClassificationResult[] {
  if (!historyScope || historyLoaded) return [...volatileHistory];
  // Hydrate once per identity. Session memory then retains writes that storage rejects.
  historyLoaded = true;
  try {
    if (typeof localStorage === 'undefined') {
      historyStatus = { mode: 'MEMORY_ONLY', stored: false, error: null };
      return [...volatileHistory];
    }
    const raw = localStorage.getItem(historyScope);
    if (raw && raw.length > 5_000_000) throw new Error('HISTORY_TOO_LARGE');
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed) || parsed.length > 50 || parsed.some(value => !isStoredEvaluation(value))) throw new Error('HISTORY_INVALID');
    volatileHistory = parsed;
    historyStatus = { mode: 'LOCAL_DEVICE', stored: parsed.length > 0, error: null };
    return [...volatileHistory];
  } catch {
    historyStatus = { mode: 'LOCAL_DEVICE', stored: false, error: 'Sejarah tempatan tidak dapat dibaca. Tiada sync pelayan telah disahkan.' };
    return [...volatileHistory];
  }
}

export function saveJevEvaluation(evaluation: JevClassificationResult): JevHistoryStatus {
  if (!isStoredEvaluation(evaluation)) {
    historyStatus = { mode: historyScope ? 'LOCAL_DEVICE' : 'MEMORY_ONLY', stored: false, error: 'Keputusan JEV tidak sah; sejarah sesi tidak diubah.' };
    return getJevHistoryStatus();
  }
  volatileHistory = [evaluation, ...getSavedJevEvaluations().filter(item => item.id !== evaluation.id)].slice(0, 50);
  if (!historyScope) {
    historyStatus = { mode: 'MEMORY_ONLY', stored: false, error: null };
    return getJevHistoryStatus();
  }
  try {
    if (typeof localStorage === 'undefined') {
      historyStatus = { mode: 'MEMORY_ONLY', stored: false, error: null };
      return getJevHistoryStatus();
    }
    localStorage.setItem(historyScope, JSON.stringify(volatileHistory));
    historyStatus = { mode: 'LOCAL_DEVICE', stored: true, error: null };
  } catch {
    historyStatus = { mode: 'LOCAL_DEVICE', stored: false, error: 'Simpanan peranti gagal. Keputusan kekal dalam memori sesi; belum disimpan pada pelayan.' };
  }
  return getJevHistoryStatus();
}
// --- DeepSeek R1 & Nous Hermes Integration Utilities ---

export interface DeepSeekReasoningExtraction {
  hasThinkingTrace: boolean;
  thinkingTrace: string;
  finalContent: string;
}

/**
 * DeepSeek-R1 Pattern: Extracts and isolates internal `<think> ... </think>`
 * cognitive reasoning traces from final customer-facing responses.
 */
export function extractReasoningTrace(rawText: string): DeepSeekReasoningExtraction {
  if (!rawText) {
    return { hasThinkingTrace: false, thinkingTrace: '', finalContent: '' };
  }

  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const match = rawText.match(thinkRegex);

  if (match) {
    const thinkingTrace = match[1].trim();
    const finalContent = rawText.replace(thinkRegex, '').trim();
    return {
      hasThinkingTrace: true,
      thinkingTrace,
      finalContent,
    };
  }

  return {
    hasThinkingTrace: false,
    thinkingTrace: '',
    finalContent: rawText.trim(),
  };
}

export interface HermesSkillRegistrationResult {
  isValid: boolean;
  skillName: string;
  category: string;
  reasons: string[];
}

/**
 * Nous Hermes Agent Pattern: Autonomous dynamic skill synthesizer & validator.
 * Enforces JEV invariants before allowing new skills to be registered in the runtime.
 */
export function validateAndRegisterHermesSkill(spec: {
  name: string;
  category: string;
  description: string;
  procedures?: string[];
}): HermesSkillRegistrationResult {
  const reasons: string[] = [];

  if (!spec.name || spec.name.length < 3) {
    reasons.push('Nama skill mesti sekurang-kurangnya 3 aksara.');
  }

  const normalizedCategory = spec.category?.toLowerCase() || 'general';
  const allowedCategories = [
    'architecture-design', 'codegen-scaffolding', 'data-analytics',
    'devops-infra', 'documentation-knowledge', 'maintenance-optimization',
    'meta', 'security-compliance', 'testing-quality', 'jev-core', 'superpowers'
  ];

  if (!allowedCategories.includes(normalizedCategory)) {
    reasons.push(`Kategori "${spec.category}" mesti dalam 11 domain kemahiran yang diiktiraf.`);
  }

  if (!spec.description || spec.description.length < 10) {
    reasons.push('Penerangan skill mesti mengandungi sekurang-kurangnya 10 aksara.');
  }

  const isValid = reasons.length === 0;

  if (isValid) {
    try {
      const storageKey = 'abangcolek_hermes_skills';
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updated = [
        {
          name: spec.name,
          category: normalizedCategory,
          description: spec.description,
          procedures: spec.procedures || [],
          registeredAt: new Date().toISOString(),
        },
        ...existing.filter((s: any) => s.name !== spec.name)
      ].slice(0, 30);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to store Hermes skill', e);
    }
  }

  return {
    isValid,
    skillName: spec.name,
    category: normalizedCategory,
    reasons,
  };
}

