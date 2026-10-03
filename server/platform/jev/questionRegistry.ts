import type { JevPackId, JevQuestion } from '../../../shared/jev-contracts';

const choice = (id: string, instructions: string, options: string[]): JevQuestion => ({ id, type: 'choice', instructions, criteria: Object.fromEntries(options.map(option => [option, option])) });
const noul = (id: string, instructions: string): JevQuestion => ({ id, type: 'noul', instructions });
export const QUESTION_PACKS: Record<JevPackId, { version: '1.0'; questions: JevQuestion[] }> = {
  support: { version: '1.0', questions: [
    choice('intent', 'Which intent is explicitly stated?', ['COMPLAINT', 'REFUND', 'LOCATION_QUERY', 'AGENT_APPLICATION', 'PURCHASE', 'UNKNOWN']),
    choice('issue', 'Which issue is explicitly alleged?', ['LEAKAGE', 'SEAL_FAILURE', 'DELIVERY_DELAY', 'PAYMENT', 'UNKNOWN']),
    choice('rootCause', 'What is the verified investigation status?', ['UNDETERMINED', 'UNDER_INVESTIGATION', 'VERIFIED', 'REJECTED']),
    { id: 'urgency', type: 'score', instructions: 'What urgency does the available evidence support?', criteria: ['Routine', 'Needs attention', 'Urgent review', 'Potential safety incident'] },
    noul('refundRequested', 'Does the customer explicitly request a refund?'),
    noul('humanRequested', 'Does the customer explicitly request a human?'),
  ] },
  marketing: { version: '1.0', questions: [
    choice('pillar', 'Which approved content pillar fits?', ['PRODUCT', 'RECIPE', 'FOUNDER', 'DEALER', 'UNKNOWN']),
    noul('healthClaim', 'Does the content make a health claim?'), noul('priceMention', 'Does the content mention a monetary price?'),
    { id: 'readiness', type: 'score', instructions: 'How complete is the review evidence?', criteria: ['Evidence missing', 'Draft complete', 'Ready for human review'] },
  ] },
  dealer: { version: '1.0', questions: [choice('intent', 'What business support is requested?', ['APPLICATION', 'RESTOCK', 'RECEIVING', 'COMPLAINT', 'UNKNOWN']), noul('trainingRequested', 'Is training explicitly requested?')] },
  developer: { version: '1.0', questions: [choice('risk', 'Which development boundary is mentioned?', ['AUTH', 'SCHEMA', 'SIDE_EFFECT', 'UI', 'UNKNOWN']), noul('reviewRequired', 'Does the change touch a protected boundary?')] },
  order_exception: { version: '1.0', questions: [
    choice('exception', 'Which order exception is explicitly alleged?', ['PAYMENT', 'PRICE', 'DELIVERY', 'CANCELLATION', 'UNKNOWN']),
    noul('paymentVerified', 'Do authorized payment ledger facts confirm payment?'),
    noul('canonicalPriceKnown', 'Is the order linked to a known canonical price revision?'),
    { id: 'readiness', type: 'score', instructions: 'How complete is the exception resolution evidence?', criteria: ['Evidence missing', 'Needs review', 'Ready for authorized review'] },
  ] },
  qc: { version: '1.0', questions: [
    choice('issue', 'What QC issue is explicitly alleged?', ['LEAKAGE', 'SEAL_FAILURE', 'CONTAMINATION', 'TEMPERATURE', 'UNKNOWN']),
    noul('evidenceComplete', 'Does the server have every required SOP evidence item?'),
    noul('sopCurrent', 'Does this batch refer to the current approved SOP?'),
    { id: 'releaseReadiness', type: 'score', instructions: 'How complete is the release review evidence?', criteria: ['Evidence missing', 'Measurement review needed', 'Ready for authorized review'] },
  ] },
};
