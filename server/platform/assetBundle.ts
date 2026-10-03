import { fail } from './store';

/** Bundles use the built-in tar writer; no caller-controlled paths or extra packages. */
export async function buildAssetBundle(files:{name:string;bytes:Uint8Array}[]):Promise<Uint8Array> {
  if(files.reduce((sum,file)=>sum+file.bytes.length,0)>32*1024*1024)fail('EXPORT_TOO_LARGE',413);
  const entries:Record<string,Uint8Array>={};
  for(const file of files){if(!/^[a-zA-Z0-9._-]{1,100}$/.test(file.name)||file.name==='.'||file.name==='..'||entries[file.name])fail('INVALID_EXPORT_NAME');entries[file.name]=file.bytes;}
  return new Bun.Archive(entries).bytes();
}
