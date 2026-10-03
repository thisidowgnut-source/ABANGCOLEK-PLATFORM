import { afterEach, expect, test } from 'bun:test';
import { PlatformStore } from '../../server/platform/store';
import { Auth, type Principal } from '../../server/platform/auth';
import { Commerce } from '../../server/platform/commerce';
import { Work } from '../../server/platform/work';
import { Marketing } from '../../server/platform/marketing';
import { Automation } from '../../server/automation/automation';
const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach(close => close()));
async function fixture() {
  const store = new PlatformStore(':memory:'), auth = new Auth(store, 'collaboration-bootstrap');
  cleanups.push(() => store.close());
  const commerce = new Commerce(store, auth), work = new Work(store, auth, commerce);
  async function user(name: string, owner = false) {
    const login = await auth.authenticate(owner ? 'bootstrap' : 'signup', { email: `${name}@example.test`, name, password: 'a durable secure password', ...(owner ? { token: 'collaboration-bootstrap' } : {}) });
    const request = new Request('http://localhost', { headers: { Cookie: login.cookie } });
    return { request, principal: auth.resolve(request) };
  }
  const owner = (await user('owner', true)).principal, staffSession = await user('staff'), otherSession = await user('other');
  for (const session of [staffSession, otherSession]) auth.grant(owner, { userId: session.principal.user.id, role: 'staff', outletIds: ['hq'], expectedVersion: 0 });
  const staff = auth.resolve(staffSession.request), other = auth.resolve(otherSession.request);
  const automation = new Automation(store, auth, commerce, work, new Marketing(store, auth, commerce, work));
  return { store, auth, commerce, work, automation, owner, staff, other };
}
async function research(automation: Automation, owner: Principal) {
  const source = automation.captureSource(owner, { url: 'https://example.org/paper', title: 'Public source', snippet: 'Observed source fact', retrievedAt: new Date().toISOString(), termsCheck: 'allowed', permittedUse: 'Internal attribution' }, 'work-source-001');
  return automation.saveBrief(owner, { question: 'What can improve?', summary: 'Founder hypothesis', sourceIds: [source.id], unknownReasons: [] }, 'work-brief-001');
}

test('task checklist and comments require scoped revision, dedupe; completion retains actual immutable receipt', async () => {
  const { work, owner, staff, other } = await fixture();
  const task = work.createTask(owner, { entityId: 'business', title: 'Actual packing handoff', assigneeId: staff.user.id, documentIds: [] });
  const added = work.addChecklist(staff, task.id, { expectedRevision: 1, title: 'Verify sealed containers', required: true }, 'task-item-001');
  expect(work.addChecklist(staff, task.id, { expectedRevision: 1, title: 'Verify sealed containers', required: true }, 'task-item-001').revision).toBe(2);
  expect(() => work.commentTask(other, task.id, { expectedRevision: 2, body: 'Cross-scope attempt' }, 'other-comment')).toThrow();
  expect(() => work.completeTask(staff, task.id, { expectedRevision: 2, outcome: 'Verified handoff' }, 'complete-task-001')).toThrow();
  const checked = work.checkChecklist(staff, task.id, added.checklist![0].id, { expectedRevision: 2, checked: true }, 'task-check-001');
  expect(() => work.commentTask(staff, task.id, { expectedRevision: 2, body: 'Stale' }, 'stale-comment')).toThrow();
  const comment = work.commentTask(staff, task.id, { expectedRevision: checked.revision, body: 'Seal physically checked at counter' }, 'task-comment-001');
  expect(work.commentTask(staff, task.id, { expectedRevision: checked.revision, body: 'Seal physically checked at counter' }, 'task-comment-001').id).toBe(comment.id);
  const current = work.task(staff, task.id);
  const receipt = work.completeTask(staff, task.id, { expectedRevision: current.revision, outcome: 'Actual handoff recorded' }, 'complete-task-001');
  expect(receipt.status).toBe('completed');
  expect(receipt.completedBy).toBe(staff.user.id);
  expect(receipt.checklist[0].checked).toBe(true);
  expect(work.completeTask(staff, task.id, { expectedRevision: current.revision, outcome: 'Actual handoff recorded' }, 'complete-task-001').id).toBe(receipt.id);
  expect(work.collaboration(staff, task.id).comments).toHaveLength(1);
  expect(work.collaboration(staff, task.id).receipts).toHaveLength(1);
  expect(() => work.collaboration(other, task.id)).toThrow();
  work.updateTask(staff, task.id, { expectedRevision: current.revision + 1, status: 'open' });
  work.checkChecklist(staff, task.id, added.checklist![0].id, { expectedRevision: current.revision + 2, checked: false }, 'task-uncheck-001');
  expect(work.collaboration(staff, task.id).receipts[0].checklist[0].checked).toBe(true);
});

test('existing tasks without checklist still complete with a persisted receipt', async () => {
  const { work, owner } = await fixture();
  const task = work.createTask(owner, { entityId: 'business', title: 'No checklist required', assigneeId: owner.user.id, documentIds: [] });
  const done = work.updateTask(owner, task.id, { expectedRevision: 1, status: 'done', outcome: 'Actual outcome' });
  expect(done.status).toBe('done');
  expect(work.collaboration(owner, task.id).receipts[0].taskRevision).toBe(done.revision);
});

test('owned research provenance becomes immutable document version and approved knowledge lineage', async () => {
  const { work, automation, owner, store } = await fixture();
  const brief = await research(automation, owner);
  const first = work.saveDocument(owner, { title: 'Research memo', body: 'Human reviewed draft', visibility: 'business', entityIds: [] });
  const linked = work.linkResearch(owner, first.id, { expectedVersion: 1, researchBriefIds: [brief.id] }, 'link-research-001');
  expect(linked.version).toBe(2);
  expect(linked.sourceRefs[0].url).toBe(brief.sourceRefs[0].url);
  expect(linked.researchLineage[0].summaryHash).toMatch(/^[a-f0-9]{64}$/);
  expect(work.linkResearch(owner, first.id, { expectedVersion: 1, researchBriefIds: [brief.id] }, 'link-research-001').version).toBe(2);
  const published = work.publishDocument(owner, first.id, { expectedVersion: 2 });
  expect(published.sourceRefs[0].contentHash).toBe(brief.sourceRefs[0].contentHash);
  expect(published.documentContentHash).toBe(linked.contentHash);
  const next = work.saveDocument(owner, { expectedVersion: 2, title: 'Research memo updated', body: 'Changed human text', visibility: 'business', entityIds: [] }, first.id);
  expect(next.contentHash).not.toBe(linked.contentHash);
  expect(next.researchLineage[0].summaryHash).toBe(linked.researchLineage[0].summaryHash);
  expect(work.documentVersions(owner, first.id).find(version => version.version === 2)?.body).toBe('Human reviewed draft');
  expect(store.get<{body:string}>('knowledge', published.id)?.body).toBe('Human reviewed draft');
});

test('staff cannot forge research provenance and founder cannot link another owner brief', async () => {
  const { work, automation, owner, staff, other, auth } = await fixture();
  const brief = await research(automation, owner);
  expect(() => work.saveDocument(staff, { title: 'Forged source', body: 'Text', visibility: 'business', entityIds: [], sourceRefs: brief.sourceRefs })).toThrow();
  expect(() => work.saveDocument(staff, { title: 'Forged source', body: 'Text', visibility: 'business', entityIds: [], researchBriefIds: [brief.id] })).toThrow();
  const doc = work.saveDocument(staff, { title: 'Staff draft', body: 'Text', visibility: 'business', entityIds: [] });
  expect(() => work.linkResearch(staff, doc.id, { expectedVersion: 1, researchBriefIds: [brief.id] }, 'staff-source-forge')).toThrow();
  auth.grant(owner, { userId: other.user.id, role: 'founder', outletIds: [], expectedVersion: 0 });
  const secondFounder = { ...other, memberships: auth.memberships(other.user.id) };
  const secondDoc = work.saveDocument(secondFounder, { title: 'Other memo', body: 'Text', visibility: 'business', entityIds: [] });
  expect(() => work.linkResearch(secondFounder, secondDoc.id, { expectedVersion: 1, researchBriefIds: [brief.id] }, 'other-source-forge')).toThrow();
  expect(work.documentVersions(owner, secondDoc.id)).toHaveLength(1);
});

test('business visibility on current version does not expose older private document version', async () => {
  const {work,staff,other}=await fixture();
  const first=work.saveDocument(staff,{title:'Private decision',body:'Private draft text',visibility:'private',entityIds:[]});
  work.saveDocument(staff,{title:'Shared decision',body:'Reviewed shared text',visibility:'business',entityIds:[],expectedVersion:1},first.id);
  expect(work.documentVersions(other,first.id).map(document=>document.version)).toEqual([2]);
  expect(work.documentVersions(staff,first.id).map(document=>document.version)).toEqual([2,1]);
});

test('calendar source links resolve actual record kind and revoke links when source visibility changes', async () => {
  const {work,owner,staff,other}=await fixture();
  const task=work.createTask(owner,{entityId:'business',title:'Linked actual task',assigneeId:staff.user.id,documentIds:[]});
  const schedule={title:'Work session',entityIds:[task.id],startAt:'2026-10-02T01:00:00Z',endAt:'2026-10-02T02:00:00Z'};
  work.saveCalendar(staff,schedule);
  const link=work.calendar(staff)[0].entityLinks?.[0];
  expect(link).toEqual({id:task.id,kind:'task',path:`/staff/tasks/${task.id}`});
  const document=work.saveDocument(staff,{title:'Initially shared',body:'Shared source',visibility:'business',entityIds:[]});
  work.saveCalendar(other,{...schedule,entityIds:[document.id]});
  expect(work.calendar(other)[0].entityLinks?.[0].kind).toBe('document');
  work.saveDocument(staff,{title:'Private source',body:'Restricted source',visibility:'private',entityIds:[],expectedVersion:1},document.id);
  expect(work.calendar(other)[0].entityLinks).toEqual([]);
});
