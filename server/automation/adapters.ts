import type { AgentResult, CancelOutcome, PublishIntent, PublishOutcome, ReadOnlyAgentTask, ResearchRequest, UsageSnapshot } from '../../shared/platform-contracts';
import { fail, integer, list, object, strings, text } from '../platform/store';
import { admitWork } from './jobs';

/** Transports belong to reviewed host integrations. No undocumented shell/HTTP protocol is invented here. */
export interface ReadOnlyHermesTransport {
  zeroNewSpend: true;
  run(task: ReadOnlyAgentTask, signal: AbortSignal): Promise<AgentResult>;
}
export interface ResearchCollection { summary: string; sources: unknown[]; unknownReasons: string[] }
export interface ReadOnlyResearchTransport {
  zeroNewSpend: true;
  collect(request: ResearchRequest, signal: AbortSignal, onSource?: (source: unknown) => void): Promise<ResearchCollection>;
}
export interface AutomationOptions {
  hermes?: ReadOnlyHermesTransport;
  agentReach?: ReadOnlyResearchTransport;
  externalUsage?: () => UsageSnapshot;
  timeoutMs?: number;
}
export class HermesAdapter {
  constructor(readonly transport?: ReadOnlyHermesTransport, readonly timeoutMs = 10_000) {}
  async run(task: ReadOnlyAgentTask, usage: UsageSnapshot, signal: AbortSignal): Promise<AgentResult> {
    const denied = (reason: string): AgentResult => ({ status: 'blocked', artifactIds: [], evidenceIds: [], unknownReasons: [reason] });
    if (!this.transport || this.transport.zeroNewSpend !== true) return denied('HERMES_UNAVAILABLE');
    // These are first-party read capabilities, never upstream tool names inferred from documentation.
    if (task.allowedToolIds.some(tool => !['research.sources.read', 'knowledge.approved.read'].includes(tool))) return denied('TOOL_SCOPE_DENIED');
    if (!admitWork({ operation: 'read_only_agent', providerId: usage.providerId, estimatedUnits: 1 }, usage).allowed) return denied('USAGE_NOT_ADMITTED');
    text(task.jobId, 'Job ID', 120); text(task.objective, 'Objective', 2000);
    list(task.sourceRefs, 20);
    if (signal.aborted) return denied('REQUEST_ABORTED');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const operatorAbort = () => controller.abort();
    signal.addEventListener('abort', operatorAbort, { once: true });
    try {
      const output = object(await Promise.race([
        this.transport.run(task, controller.signal),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('HERMES_TIMEOUT')); }, boundedTimeout(this.timeoutMs)); }),
      ]));
      if (signal.aborted || controller.signal.aborted) return { status: 'unknown', artifactIds: [], evidenceIds: [], unknownReasons: ['HERMES_ABORTED_RESULT_UNVERIFIED'] };
      if (!['completed', 'partial', 'unknown', 'blocked'].includes(String(output.status))) fail('INVALID_AGENT_OUTPUT');
      return { status: output.status as AgentResult['status'], artifactIds: strings(output.artifactIds), evidenceIds: strings(output.evidenceIds), unknownReasons: strings(output.unknownReasons) };
    } catch { return { status: 'unknown', artifactIds: [], evidenceIds: [], unknownReasons: [controller.signal.aborted && !signal.aborted ? 'HERMES_TIMEOUT' : 'HERMES_RESULT_UNVERIFIED'] }; }
    finally { if (timer) clearTimeout(timer); controller.abort(); signal.removeEventListener('abort', operatorAbort); }
  }
}

/** Remote mutations are deliberately unimplemented until a separately approved channel pilot. */
export class PostizPublisherAdapter {
  async publish(intent: PublishIntent): Promise<PublishOutcome> {
    return { intentId: text(intent.id, 'Intent ID', 120), status: 'blocked', evidenceIds: [], reasonCode: 'REMOTE_PUBLISH_DISABLED' };
  }
  async cancel(providerRef: string): Promise<CancelOutcome> {
    return { providerRef: text(providerRef, 'Provider reference', 200), status: 'unknown', evidenceIds: [] };
  }
}

export const boundedTimeout = (value: number | undefined) => integer(value ?? 10_000, 'Research timeout', 10, 10_000);
