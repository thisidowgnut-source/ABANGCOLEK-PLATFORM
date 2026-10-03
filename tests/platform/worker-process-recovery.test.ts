import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPlatformApp } from '../../server/platform/app';
import type { JobRecord } from '../../shared/platform-contracts';
import { call, harness, user } from './backend-security.test';

test('terminated worker recovers from durable lease with one result and rejects stale completion', async () => {
  const { app, directory } = harness();
  const founder = await user(app, 'process-recovery-founder', true);
  const queued = (await call(app, '/jobs', { kind: 'morning_brief', entityId: 'business', skillVersion: 'local-v1', scope: 'business' }, founder, { 'Idempotency-Key': 'process-recovery-once' })).json.data as JobRecord;
  app.close();
  const databasePath = join(directory, 'test.sqlite');
  const firstReceipt = join(directory, 'claimed.json');
  const recoveredReceipt = join(directory, 'recovered.json');
  const fixture = join(import.meta.dir, 'fixtures/lifecycle-worker.ts');
  const first = Bun.spawn([process.execPath, fixture, 'claim', databasePath, firstReceipt], { stdout: 'pipe', stderr: 'pipe' });
  try {
    const deadline = Date.now() + 8000;
    while (!existsSync(firstReceipt) && Date.now() < deadline) await Bun.sleep(25);
    expect(existsSync(firstReceipt)).toBe(true);
    const claimed = JSON.parse(readFileSync(firstReceipt, 'utf8')) as JobRecord;
    expect(claimed.id).toBe(queued.id);
    expect(claimed.attempt).toBe(1);
    first.kill(9);
    await first.exited;
    await Bun.sleep(Math.max(0, Date.parse(claimed.leaseUntil!) - Date.now()) + 50);
    const second = Bun.spawn([process.execPath, fixture, 'recover', databasePath, recoveredReceipt], { stdout: 'pipe', stderr: 'pipe' });
    expect(await second.exited).toBe(0);
    const recovered = JSON.parse(readFileSync(recoveredReceipt, 'utf8')) as JobRecord;
    expect(recovered.id).toBe(queued.id);
    expect(recovered.status).toBe('completed');
    expect(recovered.attempt).toBe(2);
    const reopened = createPlatformApp({ databasePath });
    try {
      expect(reopened.store.all('job_artifacts')).toHaveLength(1);
      expect(reopened.jobs.claimJob('third-test-worker')).toBeNull();
      expect(() => reopened.jobs.completeJob(queued.id, 'terminated-test-worker', { status: 'completed', artifactIds: [], evidenceIds: [], unknownReasons: [] })).toThrow();
      expect(reopened.store.all('job_artifacts')).toHaveLength(1);
    } finally { reopened.close(); }
  } finally { first.kill(); await first.exited; }
}, 15_000);
