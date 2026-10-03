import type { ExportArtifact, ResearchBrief, SourceRef } from './platform-contracts';

export interface AutomationCapability {
  providerId: 'manual' | 'hermes' | 'agent_reach' | 'postiz';
  status: 'ready' | 'unavailable' | 'needs_verification' | 'disabled';
  configured: boolean;
  allowedOperations: string[];
  reasonCode: string;
  verifiedAt: string | null;
  usage: { observedUnits: number | null; limitUnits: number | null };
}
export interface ResearchSourceRecord extends SourceRef {
  id: string;
  ownerId: string;
  snippet: string;
  author?: string;
  permittedUse: string;
  termsCheck: 'allowed' | 'unknown' | 'restricted';
  accessMethod: 'manual' | 'public_web' | 'rss' | 'authorized_session';
  createdAt: string;
}
export interface SavedResearchBrief extends ResearchBrief {
  ownerId: string;
  question: string;
  sourceIds: string[];
  method: 'manual' | 'agent_reach';
  status: 'running' | 'completed' | 'partial' | 'unknown' | 'blocked';
  synthesis: 'human_authored' | 'external_untrusted';
  createdAt: string;
  leaseUntil?: string;
}
export interface ResearchSessionGrant {
  id: string;
  ownerId: string;
  allowedOrigins: string[];
  purpose: string;
  expiresAt: string;
  status: 'active' | 'revoked';
  version: number;
  createdAt: string;
}
export interface PreparedPostizExport extends ExportArtifact {
  campaignId: string;
  ownerId: string;
  channel: string;
  accountId?: string;
  deliveryMode: 'manual_required';
  reasonCode: 'REMOTE_PUBLISH_DISABLED';
  createdAt: string;
}
