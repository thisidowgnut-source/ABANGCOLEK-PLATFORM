import type { Principal } from './auth';
import { Auth } from './auth';
import { fields, fail, now, object, oneOf, PlatformStore } from './store';

export interface RuntimeControls {id:'runtime';version:number;workerAdmission:'running'|'paused';activeRelease:'platform-local-v1'|'platform-local-readonly-v1';availableReleases:readonly string[];externalFlags:{nativeWhatsapp:false;postizPublish:false;agentReachResearch:false;hermes:false};updatedAt:string}
export class RuntimeControlCommands {
  constructor(readonly store:PlatformStore,readonly auth:Auth){}
  authorized(actor:Principal){if(!this.auth.has(actor,'founder')&&!this.auth.has(actor,'developer'))fail('FORBIDDEN',403);}
  current():RuntimeControls{return this.store.get<RuntimeControls>('runtime_controls','runtime')??{id:'runtime',version:0,workerAdmission:'running',activeRelease:'platform-local-v1',availableReleases:['platform-local-v1','platform-local-readonly-v1'],externalFlags:{nativeWhatsapp:false,postizPublish:false,agentReachResearch:false,hermes:false},updatedAt:now()};}
  get(actor:Principal){this.authorized(actor);return this.current();}
  change(actor:Principal,raw:unknown){this.authorized(actor);const input=object(raw);fields(input,['expectedVersion','workerAdmission','activeRelease']);const current=this.current();this.store.revision(current.version,input.expectedVersion);const workerAdmission=input.workerAdmission===undefined?current.workerAdmission:oneOf(input.workerAdmission,['running','paused'] as const),activeRelease=input.activeRelease===undefined?current.activeRelease:oneOf(input.activeRelease,['platform-local-v1','platform-local-readonly-v1'] as const);const updated:RuntimeControls={...current,version:current.version+1,workerAdmission,activeRelease,updatedAt:now()};this.store.save('runtime_controls',updated);this.store.audit(actor.user.id,'runtime.control','runtime',updated.version);return updated;}
}
