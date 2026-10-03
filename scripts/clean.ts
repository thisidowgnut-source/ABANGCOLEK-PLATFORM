import { rmSync } from 'node:fs';
import { resolve,dirname } from 'node:path';
const root=resolve(import.meta.dir,'..'),target=resolve(root,'dist');
if(dirname(target)!==root)throw new Error('Clean target keluar daripada workspace.');
rmSync(target,{recursive:true,force:true});
