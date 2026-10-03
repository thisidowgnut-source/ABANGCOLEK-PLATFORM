import {Database} from 'bun:sqlite';
import {existsSync,mkdirSync,readFileSync,writeFileSync,renameSync,rmSync,lstatSync} from 'node:fs';
import {dirname,join,relative,resolve,isAbsolute} from 'node:path';
import type {EvidenceRecord} from '../../shared/platform-contracts';
import {PlatformStore} from './store';

interface BackupManifest {version:1;createdAt:string;recordCount:number;files:{name:string;sha256:string;size:number}[]}
const digest=(bytes:Uint8Array)=>new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
function safeNewDirectory(input:string){
 const target=resolve(input);if(existsSync(target))throw new Error('Destination already exists; an active database is never overwritten.');
 let parent=dirname(target);while(true){if(existsSync(parent)&&lstatSync(parent).isSymbolicLink())throw new Error('Symbolic destination parent is not allowed.');const next=dirname(parent);if(next===parent)break;parent=next;}
 return target;
}
function stageDirectory(target:string,write:(stage:string)=>void){
 const stage=target+'.staging-'+crypto.randomUUID();mkdirSync(stage,{recursive:true,mode:0o700});
 try{write(stage);if(existsSync(target))throw new Error('Destination became occupied.');renameSync(stage,target);}
 catch(error){rmSync(stage,{recursive:true,force:true});throw error;}
}
/** Synchronous transaction pins the database and referenced files before the snapshot is published. */
export function backupPlatform(store:PlatformStore,evidenceDirectory:string,destination:string):BackupManifest {
 const target=safeNewDirectory(destination);
 const manifest:BackupManifest={version:1,createdAt:new Date().toISOString(),recordCount:0,files:[]};
 stageDirectory(target,stage=>store.atomic(()=>{
  const database=store.db.serialize();
  const files=[{name:'platform.sqlite',bytes:database}];
  manifest.recordCount=store.db.query<{count:number},[]>('SELECT COUNT(*) AS count FROM records').get()!.count;
  for(const evidence of store.all<EvidenceRecord>('evidence').filter(value=>value.kind==='file')){
   if(evidence.storageRef!==evidence.id||!/^[a-zA-Z0-9_-]{1,120}$/.test(evidence.id))throw new Error('Invalid evidence storage reference.');
   const path=join(evidenceDirectory,evidence.id);if(lstatSync(path).isSymbolicLink())throw new Error('Symbolic evidence is not allowed.');
   const bytes=readFileSync(path);if(!evidence.sha256||digest(bytes)!==evidence.sha256||bytes.length!==evidence.size)throw new Error('Evidence integrity verification failed.');
   files.push({name:'evidence/'+evidence.id,bytes});
  }
  for(const file of files){const path=join(stage,file.name);mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,file.bytes,{flag:'wx',mode:0o600});manifest.files.push({name:file.name,sha256:digest(file.bytes),size:file.bytes.length});}
  writeFileSync(join(stage,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
 }));
 return manifest;
}
/** Restore verifies every byte and only creates a new destination; host cutover remains an offline operation. */
export function restorePlatform(snapshotDirectory:string,destination:string):BackupManifest {
 const snapshot=resolve(snapshotDirectory),target=safeNewDirectory(destination),inside=relative(snapshot,target);
 if(!inside||!inside.startsWith('..')&&!isAbsolute(inside))throw new Error('Restore destination must be outside its snapshot.');
 const manifest=JSON.parse(readFileSync(join(snapshot,'manifest.json'),'utf8')) as BackupManifest;
 if(manifest.version!==1||!Array.isArray(manifest.files)||!Number.isSafeInteger(manifest.recordCount)||manifest.files.length>100000||manifest.files.filter(file=>file.name==='platform.sqlite').length!==1)throw new Error('Invalid backup manifest.');
 const names=new Set<string>();const files=manifest.files.map(file=>{
  if(names.has(file.name)||!(/^(platform\.sqlite|evidence\/[a-zA-Z0-9_-]{1,120})$/).test(file.name)||!(/^[a-f0-9]{64}$/).test(file.sha256)||!Number.isSafeInteger(file.size)||file.size<0)throw new Error('Invalid backup file reference.');names.add(file.name);
  const path=join(snapshot,file.name);if(lstatSync(path).isSymbolicLink())throw new Error('Symbolic backup file is not allowed.');
  const bytes=readFileSync(path);if(bytes.length!==file.size||digest(bytes)!==file.sha256)throw new Error('Backup integrity verification failed.');return {...file,bytes};
 });
 stageDirectory(target,stage=>{
  for(const file of files){const path=join(stage,file.name);mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,file.bytes,{flag:'wx',mode:0o600});}
  const database=new Database(join(stage,'platform.sqlite'),{readonly:true,strict:true});
  try{const check=database.query<{integrity_check:string},[]>('PRAGMA integrity_check').all();if(check.length!==1||check[0].integrity_check!=='ok')throw new Error('Database integrity verification failed.');
   const count=database.query<{count:number},[]>('SELECT COUNT(*) AS count FROM records').get()!.count;if(count!==manifest.recordCount)throw new Error('Database record count mismatch.');
   const evidence=database.query<{data:string},[string]>('SELECT data FROM records WHERE kind=?').all('evidence');
   for(const row of evidence){const record=JSON.parse(row.data) as EvidenceRecord;if(record.kind==='file'&&!files.some(file=>file.name==='evidence/'+record.id&&file.sha256===record.sha256&&file.size===record.size))throw new Error('Referenced evidence is missing.');}
  }finally{database.close();}
 });return manifest;
}
