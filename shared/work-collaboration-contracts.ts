import type { DocumentRecord, KnowledgeEntry, SourceRef, TaskRecord } from './platform-contracts';

export interface TaskChecklistItem { id: string; title: string; required: boolean; checked: boolean; checkedBy?: string; checkedAt?: string }
export interface CollaborationTask extends TaskRecord { checklist?: TaskChecklistItem[]; completionReceiptId?: string }
export interface TaskComment { id: string; taskId: string; authorId: string; body: string; taskRevision: number; createdAt: string }
export interface TaskCompletionReceipt { id: string; taskId: string; taskRevision: number; completedBy: string; outcome: string; checklist: TaskChecklistItem[]; status: 'completed'; createdAt: string }
export interface TaskCollaboration { task: CollaborationTask; comments: TaskComment[]; receipts: TaskCompletionReceipt[] }
export interface ResearchLineage { briefId: string; capturedAt: string; summaryHash: string; sourceHashes: string[]; synthesis: 'human_authored' | 'external_untrusted' }
export interface SourcedDocumentRecord extends DocumentRecord { sourceRefs: SourceRef[]; researchLineage: ResearchLineage[]; contentHash: string }
export interface SourcedKnowledgeEntry extends KnowledgeEntry { researchLineage: ResearchLineage[]; documentContentHash: string }
