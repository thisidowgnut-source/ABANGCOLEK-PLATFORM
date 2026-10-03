import type { AutomationCapability, PreparedPostizExport, ResearchSessionGrant, ResearchSourceRecord, SavedResearchBrief } from '../../shared/automation-contracts';
import type { ResearchRequest } from '../../shared/platform-contracts';
import { Auth, hash, type Principal } from '../platform/auth';
import { Commerce } from '../platform/commerce';
import { Marketing } from '../platform/marketing';
import { Work } from '../platform/work';
import { date, fail, fields, id, integer, list, now, object, oneOf, PlatformStore, strings, text } from '../platform/store';
import { boundedTimeout, type AutomationOptions, type ResearchCollection } from './adapters';
import { admitWork } from './jobs';
import { publicSourceUrl } from './sourcePolicy';

export class Automation {
  constructor(readonly store: PlatformStore, readonly auth: Auth, readonly commerce: Commerce, readonly work: Work, readonly marketing: Marketing, readonly options: AutomationOptions = {}) {}

  capabilities(actor: Principal): AutomationCapability[] {
    if (!this.auth.has(actor, 'founder') && !this.auth.has(actor, 'developer')) fail('FORBIDDEN', 403);
    const capability = (providerId: AutomationCapability['providerId'], configured: boolean, operations: string[], reasonCode: string): AutomationCapability => ({ providerId, status: providerId === 'manual' ? 'ready' : configured ? 'needs_verification' : 'unavailable', configured, allowedOperations: operations, reasonCode, verifiedAt: null, usage: { observedUnits: null, limitUnits: null } });
    return [
      capability('manual', true, ['source_capture', 'research_brief', 'approved_export'], 'LOCAL_AUTHORITATIVE'),
      capability('hermes', this.options.hermes?.zeroNewSpend === true, [], this.options.hermes ? 'HERMES_HOST_VERIFICATION_REQUIRED' : 'HERMES_UNAVAILABLE'),
      capability('agent_reach', this.options.agentReach?.zeroNewSpend === true, [], this.options.agentReach ? 'SCOPED_GRANT_AND_USAGE_REQUIRED' : 'AGENT_REACH_UNAVAILABLE'),
      { ...capability('postiz', false, [], 'REMOTE_PUBLISH_DISABLED'), status: 'disabled' },
    ];
  }

  sources(actor: Principal): ResearchSourceRecord[] { this.auth.founder(actor); return this.store.all<ResearchSourceRecord>('research_sources').filter(source => source.ownerId === actor.user.id); }
  briefs(actor: Principal): SavedResearchBrief[] {
    this.auth.founder(actor);
    return this.store.all<SavedResearchBrief>('research_briefs').filter(brief => brief.ownerId === actor.user.id).map(brief => this.reconcileInterrupted(brief));
  }
  grants(actor: Principal): ResearchSessionGrant[] { this.auth.founder(actor); return this.store.all<ResearchSessionGrant>('research_grants').filter(grant => grant.ownerId === actor.user.id); }
  exports(actor: Principal): PreparedPostizExport[] { this.auth.founder(actor); return this.store.all<PreparedPostizExport>('postiz_prepared_exports').filter(artifact => artifact.ownerId === actor.user.id); }

  private makeSource(actor: Principal, raw: unknown, external = false): ResearchSourceRecord {
    const input = object(raw);
    fields(input, ['url', 'title', 'snippet', 'retrievedAt', 'publishedAt', 'author', 'termsCheck', 'permittedUse', ...(external ? ['accessMethod'] : [])]);
    const retrievedAt = date(input.retrievedAt);
    if (Date.parse(retrievedAt) > Date.now() + 60_000) fail('INVALID_CAPTURE_TIME');
    const snippet = text(input.snippet, 'Source excerpt', 8000);
    const accessMethod = external ? oneOf(input.accessMethod, ['public_web', 'rss'] as const) : 'manual';
    return { id: id(), ownerId: actor.user.id, url: publicSourceUrl(input.url), title: text(input.title, 'Source title', 300), snippet, retrievedAt, ...(input.publishedAt ? { publishedAt: date(input.publishedAt) } : {}), ...(input.author ? { author: text(input.author, 'Author', 200) } : {}), contentHash: hash(snippet), termsCheck: oneOf(input.termsCheck, ['allowed', 'unknown', 'restricted'] as const), permittedUse: text(input.permittedUse, 'Permitted use', 2000), accessMethod, createdAt: now() };
  }

  captureSource(actor: Principal, raw: unknown, key: unknown): ResearchSourceRecord {
    this.auth.founder(actor);
    return this.commerce.idem(actor, 'research.source.capture', key, raw, () => {
      const source = this.makeSource(actor, raw);
      this.store.save('research_sources', source); this.store.audit(actor.user.id, 'research.source.capture', source.id);
      return source;
    });
  }

  saveBrief(actor: Principal, raw: unknown, key: unknown): SavedResearchBrief {
    this.auth.founder(actor);
    return this.commerce.idem(actor, 'research.brief.save', key, raw, () => {
      const input = object(raw); fields(input, ['question', 'summary', 'sourceIds', 'unknownReasons']);
      const sourceIds = [...new Set(strings(input.sourceIds, 20))];
      if (!sourceIds.length) fail('SOURCE_REQUIRED', 409);
      const sources = sourceIds.map(sourceId => {
        const source = this.store.require<ResearchSourceRecord>('research_sources', sourceId);
        if (source.ownerId !== actor.user.id) fail('FORBIDDEN', 403);
        if (source.termsCheck === 'restricted') fail('SOURCE_REUSE_RESTRICTED', 409);
        return source;
      });
      const unknownReasons = [...new Set([...strings(input.unknownReasons ?? [], 20), ...sources.filter(source => source.termsCheck === 'unknown').map(() => 'SOURCE_TERMS_UNKNOWN')])];
      const brief: SavedResearchBrief = { id: id(), ownerId: actor.user.id, question: text(input.question, 'Research question', 2000), summary: text(input.summary, 'Human interpretation', 12000), sourceIds, sourceRefs: sources.map(({ url, title, retrievedAt, publishedAt, contentHash, termsCheck, accessMethod }) => ({ url, title, retrievedAt, ...(publishedAt ? { publishedAt } : {}), contentHash, termsCheck, accessMethod })), unknownReasons, retrievedAt: now(), method: 'manual', synthesis: 'human_authored', status: unknownReasons.length ? 'partial' : 'completed', createdAt: now() };
      this.store.save('research_briefs', brief); this.store.audit(actor.user.id, 'research.brief.save', brief.id);
      return brief;
    });
  }

  grant(actor: Principal, raw: unknown): ResearchSessionGrant {
    this.auth.founder(actor);
    return this.store.atomic(() => {
      const input = object(raw); fields(input, ['allowedOrigins', 'purpose', 'expiresAt']);
      const allowedOrigins = [...new Set(list(input.allowedOrigins, 10).map(value => {
        const url = new URL(publicSourceUrl(value));
        if (url.pathname !== '/' || url.search) fail('ORIGIN_REQUIRED');
        return url.origin;
      }))];
      if (!allowedOrigins.length) fail('SOURCE_SCOPE_REQUIRED');
      const expiresAt = date(input.expiresAt);
      if (expiresAt <= now() || Date.parse(expiresAt) > Date.now() + 7 * 24 * 3600_000) fail('INVALID_EXPIRY');
      const grant: ResearchSessionGrant = { id: id(), ownerId: actor.user.id, allowedOrigins, purpose: text(input.purpose, 'Research purpose', 1000), expiresAt, status: 'active', version: 1, createdAt: now() };
      this.store.save('research_grants', grant); this.store.audit(actor.user.id, 'research.grant', grant.id);
      return grant;
    });
  }

  revoke(actor: Principal, grantId: string, raw: unknown): ResearchSessionGrant {
    this.auth.founder(actor);
    return this.store.atomic(() => {
      const input = object(raw); fields(input, ['expectedVersion']);
      const grant = this.store.require<ResearchSessionGrant>('research_grants', grantId);
      if (grant.ownerId !== actor.user.id) fail('FORBIDDEN', 403);
      this.store.revision(grant.version, input.expectedVersion);
      const revoked: ResearchSessionGrant = { ...grant, version: grant.version + 1, status: 'revoked' };
      this.store.save('research_grants', revoked); this.store.audit(actor.user.id, 'research.grant.revoke', grantId, revoked.version);
      return revoked;
    });
  }

  private grantReason(actor: Principal, request: ResearchRequest): string | null {
    if (!this.auth.memberships(actor.user.id).some(membership => membership.role === 'founder')) return 'OWNER_GRANT_REVOKED';
    if (!request.sessionGrantId) return 'EXPLICIT_SOURCE_GRANT_REQUIRED';
    const grant = this.store.get<ResearchSessionGrant>('research_grants', request.sessionGrantId);
    if (!grant || grant.ownerId !== actor.user.id || grant.status !== 'active') return 'SESSION_GRANT_REVOKED';
    if (grant.expiresAt <= now()) return 'SESSION_GRANT_EXPIRED';
    if (request.allowedSources.some(url => !grant.allowedOrigins.includes(new URL(url).origin))) return 'SOURCE_OUTSIDE_GRANT';
    return null;
  }

  private reconcileInterrupted(brief: SavedResearchBrief, persist = false): SavedResearchBrief {
    if (brief.status !== 'running' || !brief.leaseUntil || brief.leaseUntil > now()) return brief;
    // Read-only transport may have run before the process died. Its receipt is never silently replayed.
    const interrupted: SavedResearchBrief = { ...brief, status: 'unknown', unknownReasons: ['RESEARCH_INTERRUPTED_NO_REPLAY'] };
    delete interrupted.leaseUntil;
    return persist ? this.store.save('research_briefs', interrupted) : interrupted;
  }

  async research(actor: Principal, raw: unknown, key: unknown): Promise<SavedResearchBrief> {
    this.auth.founder(actor);
    const input = object(raw); fields(input, ['question', 'allowedSources', 'sessionGrantId', 'maxItems']);
    const request: ResearchRequest = { question: text(input.question, 'Research question', 2000), allowedSources: [...new Set(list(input.allowedSources, 20).map(publicSourceUrl))], maxItems: integer(input.maxItems, 'Maximum sources', 1, 20), ...(input.sessionGrantId ? { sessionGrantId: text(input.sessionGrantId, 'Grant ID', 120) } : {}) };
    if (!request.allowedSources.length) fail('SOURCE_SCOPE_REQUIRED');
    const safeKey = text(key, 'Idempotency key', 120, 8), inputHash = hash(JSON.stringify(raw)), attemptId = hash(`${actor.user.id}:${safeKey}`);
    const timeoutMs = boundedTimeout(this.options.timeoutMs);
    const reservation = this.store.atomic(() => {
      const existing = this.store.get<{ id: string; inputHash: string; briefId: string }>('research_attempts', attemptId);
      if (existing) {
        if (existing.inputHash !== inputHash) fail('IDEMPOTENCY_CONFLICT', 409);
        return { existing: true, brief: this.reconcileInterrupted(this.store.require<SavedResearchBrief>('research_briefs', existing.briefId), true) };
      }
      const brief: SavedResearchBrief = { id: id(), ownerId: actor.user.id, question: request.question, summary: '', sourceRefs: [], sourceIds: [], unknownReasons: [], retrievedAt: now(), method: 'agent_reach', synthesis: 'external_untrusted', status: 'running', createdAt: now(), leaseUntil: new Date(Date.now() + timeoutMs + 5000).toISOString() };
      this.store.save('research_attempts', { id: attemptId, inputHash, briefId: brief.id });
      this.store.save('research_briefs', brief); this.store.audit(actor.user.id, 'research.request', brief.id);
      return { existing: false, brief };
    });
    if (reservation.existing) return reservation.brief;
    const finish = (collection: ResearchCollection | null, reasons: string[]): SavedResearchBrief => this.store.atomic(() => {
      const lateDenial = this.grantReason(actor, request);
      const release = this.store.get<{ activeRelease: string }>('runtime_controls', 'runtime');
      if (release?.activeRelease === 'platform-local-readonly-v1') reasons.push('RELEASE_READ_ONLY');
      if (lateDenial && !reasons.includes(lateDenial)) reasons.push(lateDenial);
      const accepted: ResearchSourceRecord[] = [];
      if (collection && !lateDenial && release?.activeRelease !== 'platform-local-readonly-v1') {
        for (const rawSource of collection.sources.slice(0, request.maxItems)) {
          try {
            const source = this.makeSource(actor, rawSource, true);
            if (!request.allowedSources.includes(source.url)) { reasons.push('SOURCE_OUTSIDE_ALLOWLIST'); continue; }
            if (source.termsCheck === 'restricted') { reasons.push('SOURCE_REUSE_RESTRICTED'); continue; }
            if (source.termsCheck === 'unknown') reasons.push('SOURCE_TERMS_UNKNOWN');
            this.store.save('research_sources', source); accepted.push(source);
          } catch { reasons.push('SOURCE_PROVENANCE_INVALID'); }
        }
      }
      const completed: SavedResearchBrief = { ...reservation.brief, summary: accepted.length && collection ? collection.summary : '', sourceIds: accepted.map(source => source.id), sourceRefs: accepted.map(({ url, title, retrievedAt, publishedAt, contentHash, accessMethod, termsCheck }) => ({ url, title, retrievedAt, ...(publishedAt ? { publishedAt } : {}), contentHash, accessMethod, termsCheck })), unknownReasons: [...new Set(reasons)], retrievedAt: now(), status: accepted.length ? reasons.length ? 'partial' : 'completed' : collection ? 'unknown' : 'blocked' };
      if (!accepted.length && !completed.unknownReasons.length) completed.unknownReasons = ['NO_PERMITTED_SOURCES'];
      delete completed.leaseUntil;
      this.store.save('research_briefs', completed); this.store.audit(actor.user.id, 'research.result.persist', completed.id);
      return completed;
    });
    if (!this.options.agentReach || this.options.agentReach.zeroNewSpend !== true) return finish(null, ['AGENT_REACH_UNAVAILABLE']);
    const denied = this.grantReason(actor, request);
    if (denied) return finish(null, [denied]);
    const usage = this.options.externalUsage?.();
    if (!usage || usage.providerId !== 'agent_reach' || !admitWork({ operation: 'research', providerId: 'agent_reach', estimatedUnits: 1 }, usage).allowed) return finish(null, ['USAGE_NOT_ADMITTED']);
    const controller = new AbortController(), partialSources: unknown[] = [];
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        this.options.agentReach.collect(request, controller.signal, source => { if (!controller.signal.aborted && partialSources.length < request.maxItems) partialSources.push(source); }),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => { controller.abort(); reject(new Error('RESEARCH_TIMEOUT')); }, timeoutMs); }),
      ]);
      const output = object(result);
      const collection: ResearchCollection = { summary: text(output.summary, 'Research summary', 12000, 0), sources: list(output.sources, 20), unknownReasons: strings(output.unknownReasons, 20) };
      return finish(collection, collection.unknownReasons);
    } catch {
      return finish({ summary: '', sources: partialSources, unknownReasons: [] }, [controller.signal.aborted ? 'RESEARCH_TIMEOUT' : 'RESEARCH_RESULT_UNVERIFIED']);
    } finally { controller.abort(); if (timeout) clearTimeout(timeout); }
  }

  preparePostiz(actor: Principal, campaignId: string, raw: unknown, key: unknown): PreparedPostizExport {
    this.auth.founder(actor);
    return this.commerce.idem(actor, `postiz.prepare:${campaignId}`, key, raw, () => {
      const input = object(raw); fields(input, ['expectedRevision', 'channel', 'accountId']);
      const campaign = this.marketing.get(actor, campaignId);
      const channel = text(input.channel, 'Intended channel', 120);
      if (campaign.scheduledAt && (!campaign.approvalExpiresAt || campaign.scheduledAt > campaign.approvalExpiresAt)) fail('APPROVAL_EXPIRES_BEFORE_SCHEDULE', 409);
      const exported = this.marketing.export(actor, campaignId, { expectedRevision: input.expectedRevision, format: 'text' }, `prepare-${hash(text(key)).slice(0, 50)}`);
      const artifact: PreparedPostizExport = { ...exported, campaignId, ownerId: actor.user.id, channel, ...(input.accountId ? { accountId: text(input.accountId, 'Intended account', 120) } : {}), deliveryMode: 'manual_required', reasonCode: 'REMOTE_PUBLISH_DISABLED', createdAt: now() };
      this.store.save('postiz_prepared_exports', artifact); this.store.audit(actor.user.id, 'postiz.prepare.export', artifact.id, campaign.revision);
      return artifact;
    });
  }
}
