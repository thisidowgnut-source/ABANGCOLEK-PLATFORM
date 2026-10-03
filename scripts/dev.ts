import { mkdirSync,openSync,closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { runtimeConfig } from '../server/runtime-config';

// This command owns only the child processes it starts; existing listeners are never killed.
const root=resolve(import.meta.dir,'..'),config=runtimeConfig(process.env);
if(config.hostname==='0.0.0.0')throw new Error('Development launcher menggunakan local binding sahaja.');
const target=`http://127.0.0.1:${config.port}`;
mkdirSync(resolve(root,'var/log'),{recursive:true});
const log=openSync(resolve(root,'var/log/dev-api.log'),'a');
let apiProcess:ReturnType<typeof Bun.spawn>|null=null,uiProcess:ReturnType<typeof Bun.spawn>|null=null,stopping=false;
function shutdown(code=0){if(stopping)return;stopping=true;uiProcess?.kill();apiProcess?.kill();closeSync(log);process.exit(code);}
process.once('SIGINT',()=>shutdown());process.once('SIGTERM',()=>shutdown());
async function ready(){
  try{const response=await fetch(`${target}/api/platform/bootstrap-status`,{signal:AbortSignal.timeout(1200)});const data=await response.json();return response.ok&&data.ok===true&&data.data?.localOnly===true;}
  catch{return false;}
}
if(!await ready()){
  apiProcess=Bun.spawn([process.execPath,'server/index.ts'],{cwd:root,env:process.env,stdout:log,stderr:log});
  for(let attempt=0;attempt<40&&!await ready();attempt++){if(apiProcess.exitCode!==null)throw new Error('API gagal bermula. Semak var/log/dev-api.log; listener sedia ada tidak dihentikan.');await Bun.sleep(250);}
  if(!await ready()){apiProcess.kill();throw new Error('API belum ready. Semak port dan var/log/dev-api.log.');}
}else console.info(`Menggunakan API lokal yang tersedia di ${target}.`);
uiProcess=Bun.spawn([process.execPath,'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3000','--strictPort'],{cwd:root,env:{...process.env,PLATFORM_API_TARGET:target},stdout:'inherit',stderr:'inherit'});
console.info('ABANGCOLEK workspace: http://127.0.0.1:3000');
if(apiProcess)void apiProcess.exited.then(code=>{if(!stopping){console.error(`API berhenti (${code}); UI akan dihentikan.`);shutdown(1);}});
const code=await uiProcess.exited;shutdown(code);
