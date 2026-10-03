export interface JevExecutionPolicyInput {
  operation: 'READ' | 'DRAFT' | 'PUBLISH' | 'SEND_EMAIL' | 'REFUND' | 'UPDATE_STOCK';
  capabilityGranted: boolean;
  canonicalFactsValid: boolean;
  entityRevision: number;
  payloadHash: string;
  approval?: { payloadHash: string; entityRevision: number; expiresAt: string };
}

/** Supply server-verified facts, never approval or capability flags from a model. */
export function evaluateExecutionPolicy(input: JevExecutionPolicyInput, now = Date.now()): { allowed: boolean; reasonCodes: string[] } {
  const reasons: string[] = [];
  if (!input || !['READ', 'DRAFT', 'PUBLISH', 'SEND_EMAIL', 'REFUND', 'UPDATE_STOCK'].includes(input.operation)) return { allowed: false, reasonCodes: ['OPERATION_INVALID'] };
  if (input.capabilityGranted !== true) reasons.push('CAPABILITY_REQUIRED');
  if (input.canonicalFactsValid !== true) reasons.push('CANONICAL_FACTS_REQUIRED');
  if (!Number.isSafeInteger(input.entityRevision) || input.entityRevision < 0 || typeof input.payloadHash !== 'string' || !input.payloadHash.trim() || !Number.isFinite(now)) reasons.push('REVISION_OR_PAYLOAD_INVALID');
  if (!['READ', 'DRAFT'].includes(input.operation)) {
    const approval = input.approval;
    if (!approval) reasons.push('APPROVAL_REQUIRED');
    else {
      if (approval.payloadHash !== input.payloadHash || approval.entityRevision !== input.entityRevision) reasons.push('APPROVAL_PAYLOAD_CHANGED');
      const expiry = typeof approval.expiresAt === 'string' ? Date.parse(approval.expiresAt) : NaN;
      if (!Number.isFinite(expiry) || expiry <= now) reasons.push('APPROVAL_EXPIRED_OR_INVALID');
    }
  }
  return { allowed: reasons.length === 0, reasonCodes: reasons.length ? reasons : ['POLICY_VALIDATED_EXECUTOR_RECEIPT_STILL_REQUIRED'] };
}
