import { expect,test } from 'bun:test';
import * as client from '../../src/features/platform/client';

test('list requests preserve server pagination metadata and advance the existing query safely',async()=>{
  expect('apiPage' in client).toBe(true);
  if(!('apiPage' in client))return;
  const original=globalThis.fetch;
  globalThis.fetch=(async()=>Response.json({ok:true,data:[{id:'a'}]},{headers:{'X-Total-Count':'103','X-Next-Offset':'100'}})) as unknown as typeof fetch;
  try {
    const page=await (client.apiPage as (path:string)=>Promise<{data:unknown[];total:number;nextOffset:number}>)('/tasks?q=approved');
    expect(page.total).toBe(103);expect(page.nextOffset).toBe(100);expect(page.data).toHaveLength(1);
    expect((client as unknown as {pagePath:(path:string,offset:number)=>string}).pagePath('/tasks?q=approved&offset=0',100)).toBe('/tasks?q=approved&offset=100');
  }finally{globalThis.fetch=original;}
});
