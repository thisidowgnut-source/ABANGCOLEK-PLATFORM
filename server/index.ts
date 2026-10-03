import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createPlatformApp } from './platform/app';
import { opaque } from './platform/auth';
import { runtimeConfig } from './runtime-config';

const runtimeRoot=resolve(process.env.PLATFORM_RUNTIME_ROOT??'var');
for(const directory of ['run','log','lib/platform'])mkdirSync(join(runtimeRoot,directory),{recursive:true});
const tokenPath=join(runtimeRoot,'run','owner-bootstrap.token');
if(!existsSync(tokenPath))writeFileSync(tokenPath,opaque(),{flag:'wx',mode:0o600});
const bootstrapToken=readFileSync(tokenPath,'utf8').trim();
const config=runtimeConfig(process.env);
const app=createPlatformApp({databasePath:join(runtimeRoot,'lib','platform','platform.sqlite'),bootstrapToken,allowedOrigins:config.allowedOrigins,log:entry=>appendFileSync(join(runtimeRoot,'log','platform-api.jsonl'),JSON.stringify({...entry,createdAt:new Date().toISOString()})+'\n')});
if(app.store.metadata('owner_bootstrapped')&&existsSync(tokenPath))unlinkSync(tokenPath);
const server=Bun.serve({hostname:config.hostname,port:config.port,idleTimeout:15,maxRequestBodySize:11*1024*1024,fetch:app.fetch});
writeFileSync(join(runtimeRoot,'run','platform.pid'),String(process.pid));
const workerId=`local-${process.pid}`;
const interval=setInterval(()=>{try{const job=app.jobs.claimJob(workerId);if(job)app.jobs.executeLocal(job.id,workerId);}catch{appendFileSync(join(runtimeRoot,'log','platform-worker.jsonl'),JSON.stringify({code:'LOCAL_WORKER_FAILED',createdAt:new Date().toISOString()})+'\n');}if(app.store.metadata('owner_bootstrapped')&&existsSync(tokenPath))unlinkSync(tokenPath);},1000);
function shutdown(){clearInterval(interval);server.stop();app.close();const pidPath=join(runtimeRoot,'run','platform.pid');if(existsSync(pidPath)&&readFileSync(pidPath,'utf8')===String(process.pid))unlinkSync(pidPath);process.exit(0);}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
console.info(`ABANGCOLEK API listening on http://${config.hostname}:${config.port}`);
console.info('First founder setup uses the one-time token in var/run/owner-bootstrap.token. No account is created automatically.');
