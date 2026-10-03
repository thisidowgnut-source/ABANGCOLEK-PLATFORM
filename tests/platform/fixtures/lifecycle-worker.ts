/** Disposable process fixture: never opens the business database or sends external actions. */
import { writeFileSync } from 'node:fs';
import { createPlatformApp } from '../../../server/platform/app';
const [mode, databasePath, receiptPath] = process.argv.slice(2);
if (!databasePath || !receiptPath || !['claim', 'recover'].includes(mode)) throw new Error('Invalid lifecycle fixture arguments');
const app = createPlatformApp({ databasePath });
const workerId = mode === 'claim' ? 'terminated-test-worker' : 'restarted-test-worker';
const job = app.jobs.claimJob(workerId, 1);
if (!job) throw new Error('Expected queued or expired job');
if (mode === 'recover') {
  const result = app.jobs.executeLocal(job.id, workerId);
  writeFileSync(receiptPath, JSON.stringify(result));
  app.close();
} else {
  writeFileSync(receiptPath, JSON.stringify(job));
  // Keep the process alive until the parent terminates it without graceful database cleanup.
  setInterval(() => {}, 1000);
}
