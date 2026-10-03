import {expect,test} from 'bun:test';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {PlatformStore} from '../../server/platform/store';
import {backupPlatform,restorePlatform} from '../../server/platform/backup';
test('durable snapshot restores records and hashed evidence into a fresh directory only',()=>{
 const root=mkdtempSync(join(tmpdir(),'platform-backup-')),store=new PlatformStore(join(root,'source/platform.sqlite'));
 try{
  store.save('orders',{id:'QA-order',amountSen:100});
  mkdirSync(join(root,'source/evidence'));const bytes=new TextEncoder().encode('Isolated QA receipt');
  writeFileSync(join(root,'source/evidence/qa-evidence'),bytes);
  store.save('evidence',{id:'qa-evidence',entityId:'QA-order',kind:'file',storageRef:'qa-evidence',size:bytes.length,sha256:new Bun.CryptoHasher('sha256').update(bytes).digest('hex')});
  const snapshot=backupPlatform(store,join(root,'source/evidence'),join(root,'snapshot'));
  expect(snapshot.recordCount).toBe(2);
  restorePlatform(join(root,'snapshot'),join(root,'restored'));
  const restored=new PlatformStore(join(root,'restored/platform.sqlite'));
  expect(restored.get<{amountSen:number}>('orders','QA-order')?.amountSen).toBe(100);restored.close();
  expect(readFileSync(join(root,'restored/evidence/qa-evidence'),'utf8')).toBe('Isolated QA receipt');
  expect(()=>restorePlatform(join(root,'snapshot'),join(root,'restored'))).toThrow();
  writeFileSync(join(root,'snapshot/platform.sqlite'),new Uint8Array([1,2,3]));
  expect(()=>restorePlatform(join(root,'snapshot'),join(root,'corrupted'))).toThrow();
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
