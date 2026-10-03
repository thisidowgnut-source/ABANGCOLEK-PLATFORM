import {dirname,join,resolve} from 'node:path';
import {existsSync,lstatSync} from 'node:fs';
import {backupPlatform,restorePlatform} from '../server/platform/backup';
import {PlatformStore} from '../server/platform/store';
const [operation,source,destination]=process.argv.slice(2);
if(!['backup','restore'].includes(operation)||!source||!destination)throw new Error('Usage: bun scripts/platform-backup.ts backup DATABASE NEW_SNAPSHOT_DIRECTORY | restore SNAPSHOT_DIRECTORY NEW_RESTORE_DIRECTORY');
if(operation==='restore'){const result=restorePlatform(source,destination);console.info(`Verified restore: ${result.recordCount} records, ${result.files.length} files. Active runtime has not been changed.`);}
else{const database=resolve(source);if(!existsSync(database)||!lstatSync(database).isFile())throw new Error('Existing source database is required.');const store=new PlatformStore(database);try{const result=backupPlatform(store,join(dirname(database),'evidence'),destination);console.info(`Verified snapshot: ${result.recordCount} records, ${result.files.length} files.`);}finally{store.close();}}
