import { describe, expect, test } from 'bun:test';
import { call, harness, user } from './backend-security.test';

describe('first party workflows without fabricated outcomes',()=>{
  test('documents preserve approved revisions; campaign edits revoke approval and exports never publish',async()=>{
    const {app}=harness(),founder=await user(app,'doc-founder',true),staffUser=await user(app,'doc-staff');
    await call(app,'/people/grants',{userId:staffUser.userId,role:'staff',outletIds:['hq'],expectedVersion:0},founder);
    const doc=(await call(app,'/documents',{title:'SOP',body:'Approved operating procedure',visibility:'business',entityIds:[]},staffUser)).json.data;
    const knowledge=(await call(app,`/documents/${doc.id}/publish`,{expectedVersion:1},founder)).json.data;
    await call(app,`/documents/${doc.id}/update`,{expectedVersion:1,title:'SOP draft',body:'Changed draft',visibility:'business',entityIds:[]},staffUser);
    expect((await call(app,'/knowledge',undefined,staffUser)).json.data[0].body).toBe(knowledge.body);
    expect((await call(app,`/documents/${doc.id}/update`,{expectedVersion:1,title:'Conflict',body:'stale',visibility:'business',entityIds:[]},staffUser)).response.status).toBe(409);
    const campaignInput={title:'Kempen',objective:'Awareness',copy:'Maklumat umum',assets:[],productIds:[],catalogueVersion:0};
    const campaign=(await call(app,'/campaigns',campaignInput,staffUser)).json.data;
    expect((await call(app,`/campaigns/${campaign.id}/approve`,{expectedRevision:1,approvalExpiresAt:new Date(Date.now()+3600000).toISOString()},staffUser)).response.status).toBe(403);
    const approved=(await call(app,`/campaigns/${campaign.id}/approve`,{expectedRevision:1,approvalExpiresAt:new Date(Date.now()+3600000).toISOString()},founder)).json.data;
    const exported=await call(app,`/campaigns/${campaign.id}/export`,{expectedRevision:approved.revision,format:'text'},staffUser,{'Idempotency-Key':'campaign-export-01'});
    expect(exported.json.data.status).toBe('exported');
    const edited=(await call(app,`/campaigns/${campaign.id}/update`,{...campaignInput,expectedRevision:approved.revision,copy:'Edited copy'},staffUser)).json.data;
    expect(edited.status).toBe('draft');
    expect((await call(app,`/campaigns/${campaign.id}/export`,{expectedRevision:edited.revision,format:'text'},staffUser,{'Idempotency-Key':'campaign-export-02'})).response.status).toBe(409);
  });
  test('unknown dealer policies fail closed; confirmed payments and day close remain independent from screenshots',async()=>{
    const {app}=harness(),founder=await user(app,'ops-founder',true),customer=await user(app,'ops-customer');
    const application=(await call(app,'/dealer/applications',{organization:'My Shop',description:'Local retail outlet'},customer)).json.data;
    const approved=await call(app,`/dealer/applications/${application.id}/approve`,{expectedRevision:1},founder);
    expect(approved.response.status).toBe(200);
    expect((await call(app,'/dealer/quotes',{dealerOrgId:approved.json.data.dealerOrgId,lines:[{productId:'missing',quantity:1}],priceVersion:1},customer)).json.code).toBe('DEALER_POLICY_UNAVAILABLE');
    const close=(await call(app,'/dayclose',{outletId:'hq',date:'2026-10-02',countCashSen:100},founder)).json.data;
    expect(close.expectedCashSen).toBe(0);
    expect(close.discrepancySen).toBe(100);
    expect((await call(app,`/dayclose/${close.id}/approve`,{expectedRevision:1,reason:''},founder)).response.status).toBe(409);
    const closed=await call(app,`/dayclose/${close.id}/approve`,{expectedRevision:1,reason:'Variance investigated; retained as discrepancy'},founder);
    expect(closed.json.data.discrepancySen).toBe(100);
    expect((await call(app,`/dayclose/${close.id}/approve`,{expectedRevision:1,reason:'again'},founder)).response.status).toBe(409);
  });
});
