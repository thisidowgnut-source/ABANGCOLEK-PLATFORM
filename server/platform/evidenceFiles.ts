import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { EvidenceRecord } from '../../shared/platform-contracts';
import type { CampaignRecord, ExportArtifact } from '../../shared/platform-contracts';
import { hash, opaque, type Principal } from './auth';
import { fail, id, integer, now, oneOf, PlatformStore, text } from './store';
import { Work } from './work';
import { buildAssetBundle } from './assetBundle';

export async function boundedBody(request:Pick<Request,'headers'|'body'>,maximum:number,timeoutMs=10000):Promise<Uint8Array>{
  const claimed=Number(request.headers.get('content-length')??'0');if(!Number.isFinite(claimed)||claimed<0||claimed>maximum)fail('BODY_TOO_LARGE',413);
  const reader=request.body?.getReader();if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[],deadline=Date.now()+timeoutMs;let length=0;
  try{while(true){let timer:ReturnType<typeof setTimeout>|undefined;try{const part=await Promise.race([reader.read(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('REQUEST_TIMEOUT')),Math.max(1,deadline-Date.now()));})]);if(part.done)break;length+=part.value.length;if(length>maximum)fail('BODY_TOO_LARGE',413);chunks.push(part.value);}finally{if(timer)clearTimeout(timer);}}}catch(error){void reader.cancel();if(error instanceof Error&&error.message==='REQUEST_TIMEOUT')fail('REQUEST_TIMEOUT',408);throw error;}
  const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
function validateContent(bytes:Uint8Array,mimeType:string){
  const ascii=(start:number,end:number)=>new TextDecoder().decode(bytes.slice(start,end));
  const valid=mimeType==='image/png'?bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):mimeType==='image/jpeg'?bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255:mimeType==='image/webp'?ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP':mimeType==='application/pdf'?ascii(0,5)==='%PDF-':mimeType==='text/plain';
  if(!valid)fail('FILE_SIGNATURE_INVALID',400,'Jenis fail tidak sepadan dengan kandungan.');
  if(mimeType==='text/plain'){try{const value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(value.includes('\0')||value.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'))fail('FILE_CONTENT_REJECTED',400);}catch{fail('FILE_CONTENT_REJECTED',400);}}
}
export class EvidenceFiles {
  readonly directory:string;
  readonly signingKey:string;
  constructor(readonly store:PlatformStore,readonly work:Work,databasePath:string){this.directory=join(dirname(databasePath===':memory:'?'var/lib/platform/platform.sqlite':databasePath),'evidence');mkdirSync(this.directory,{recursive:true});this.signingKey=store.metadata('evidence_signing_key')??opaque();store.setMetadata('evidence_signing_key',this.signingKey);}
  signature(evidenceId:string,actor:Principal,expires:number){return createHmac('sha256',this.signingKey).update(`${evidenceId}:${actor.user.id}:${actor.sessionHash}:${expires}`).digest('base64url');}
  export(actor:Principal,artifact:ExportArtifact,campaign:CampaignRecord){const expires=Date.now()+5*60_000;return {...artifact,filename:`campaign-${campaign.id}-r${artifact.campaignRevision}.${artifact.format==='asset_bundle'?'tar':'txt'}`,downloadUrl:`/api/platform/exports/${artifact.id}/file?expires=${expires}&signature=${this.signature(artifact.id,actor,expires)}`};}
  async downloadExport(actor:Principal,artifactId:string,url:URL){const artifact=this.store.require<ExportArtifact&{campaignId:string}>('exports',artifactId);this.work.entity(actor,artifact.campaignId);const expires=Number(url.searchParams.get('expires')),signature=url.searchParams.get('signature');if(!Number.isSafeInteger(expires)||expires<=Date.now()||expires>Date.now()+5*60_000||!signature||hash(signature)!==hash(this.signature(artifactId,actor,expires)))fail('DOWNLOAD_GRANT_INVALID',403);let body:Uint8Array|string=artifact.content??'';if(artifact.format==='asset_bundle'){const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf','text/plain':'txt'};const files=[{name:'caption.txt',bytes:new TextEncoder().encode(artifact.content??'')}];for(const evidenceId of artifact.fileRefs){const e=this.store.require<EvidenceRecord>('evidence',evidenceId);this.work.entity(actor,e.entityId);if(e.kind!=='file'||e.storageRef!==e.id)fail('ASSET_FILE_UNAVAILABLE',409);let bytes:Buffer;try{bytes=readFileSync(join(this.directory,e.id));}catch{fail('ASSET_FILE_UNAVAILABLE',409);}files.push({name:`${e.id}.${extensions[e.mimeType]??'bin'}`,bytes});}body=await buildAssetBundle(files);}actor=this.work.auth.revalidate(actor);this.work.entity(actor,artifact.campaignId);for(const evidenceId of artifact.fileRefs){const evidence=this.store.require<EvidenceRecord>('evidence',evidenceId);this.work.entity(actor,evidence.entityId);}return new Response(body as BodyInit,{headers:{'Content-Type':artifact.format==='asset_bundle'?'application/x-tar':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="campaign-${artifactId}.${artifact.format==='asset_bundle'?'tar':'txt'}"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
  list(actor:Principal,entityId:string){return this.work.evidence(actor,entityId).map(e=>{if(e.kind!=='file')return e;const expires=Date.now()+5*60_000;return {...e,downloadUrl:`/api/platform/evidence/${e.id}/file?expires=${expires}&signature=${this.signature(e.id,actor,expires)}`};});}
  async upload(actor:Principal,request:Request){
    const body=await boundedBody(request,11*1024*1024);
    const data=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')??''},body:body as BodyInit}).formData();
    if([...data.keys()].some(key=>!['entityId','file'].includes(key)))fail('UNKNOWN_FIELD');
    const entityId=text(data.get('entityId'),'Rekod',120),file=data.get('file');if(!(file instanceof File))fail('FILE_REQUIRED');
    const mimeType=oneOf(file.type.split(';')[0],['image/jpeg','image/png','image/webp','application/pdf','text/plain'] as const);
    const size=integer(file.size,'Saiz fail',1,10*1024*1024),bytes=new Uint8Array(await file.arrayBuffer());validateContent(bytes,mimeType);
    // Body consumption is asynchronous; authority is resolved again immediately before the synchronous commit.
    actor=this.work.auth.revalidate(actor);this.work.auth.csrf(actor,request.headers.get('x-csrf-token'));this.work.entity(actor,entityId);
    if(this.store.get<{activeRelease:string}>('runtime_controls','runtime')?.activeRelease==='platform-local-readonly-v1')fail('RELEASE_READ_ONLY',409);
    const evidenceId=id(),name=text(file.name.replaceAll('\\','/').split('/').pop(),'Nama fail',180);
    const record:EvidenceRecord={id:evidenceId,entityId,ownerId:actor.user.id,mimeType,size,name,storageRef:evidenceId,visibility:'case',kind:'file',createdAt:now(),sha256:hashBytes(bytes)};
    const path=join(this.directory,evidenceId);writeFileSync(path,bytes,{flag:'wx',mode:0o600});
    try{this.store.atomic(()=>{this.work.linkEvidence(record);this.store.audit(actor.user.id,'evidence.upload',record.id);});}catch(error){unlinkSync(path);throw error;}return record;
  }
  download(actor:Principal,evidenceId:string,url:URL){const record=this.store.require<EvidenceRecord>('evidence',evidenceId);this.work.entity(actor,record.entityId);const expires=Number(url.searchParams.get('expires')),signature=url.searchParams.get('signature');if(!Number.isSafeInteger(expires)||expires<=Date.now()||expires>Date.now()+5*60_000||!signature||hash(signature)!==hash(this.signature(evidenceId,actor,expires)))fail('DOWNLOAD_GRANT_INVALID',403);if(record.kind!=='file'||record.storageRef!==record.id)fail('FILE_UNAVAILABLE',404);let bytes:Buffer;try{bytes=readFileSync(join(this.directory,evidenceId));}catch{fail('FILE_UNAVAILABLE',404);}return new Response(bytes as BodyInit,{headers:{'Content-Type':record.mimeType,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(record.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Referrer-Policy':'no-referrer'}});}
}
function hashBytes(bytes:Uint8Array){return new Bun.CryptoHasher('sha256').update(bytes).digest('hex');}
