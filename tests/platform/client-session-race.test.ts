import {expect,test} from 'bun:test';
import {api,currentCsrfToken,resetClientSession} from '../../src/features/platform/client';
test('out-of-order identity responses cannot replace the current CSRF epoch',async()=>{
 const original=globalThis.fetch;const responses:((r:Response)=>void)[]=[];
 globalThis.fetch=(()=>new Promise<Response>(resolve=>responses.push(resolve))) as unknown as typeof fetch;
 try{
  resetClientSession();const older=api('/session'),newer=api('/session');
  responses[1](Response.json({ok:true,data:{csrfToken:'current'}}));await newer;
  responses[0](Response.json({ok:true,data:{csrfToken:'old'}}));await older;
  expect(currentCsrfToken()).toBe('current');
  const pending=api('/session');resetClientSession();responses[2](Response.json({ok:true,data:{csrfToken:'logged-out'}}));await pending;
  expect(currentCsrfToken()).toBe('');
 }finally{globalThis.fetch=original;resetClientSession();}
});
