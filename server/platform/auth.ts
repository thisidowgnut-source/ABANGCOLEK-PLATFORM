import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Membership, SessionData, WorkspaceRole } from '../../shared/platform-contracts';
import { fields, fail, id, now, object, PlatformStore, strings, text, oneOf } from './store';

const scryptAsync = promisify(scrypt);
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const opaque = () => randomBytes(32).toString('base64url');
interface UserRow { id: string; email: string; name: string; password_hash: string }
interface MemberRow { id: string; user_id: string; role: WorkspaceRole; outlets: string; dealer_org_id: string | null; status: 'active' | 'revoked'; version: number }
export interface Principal { user: {id:string;email:string;name:string}; memberships: Membership[]; sessionHash: string; csrfHash: string; csrfToken?: string }
export class Auth {
  constructor(readonly store: PlatformStore, readonly bootstrapToken?: string) {}
  memberships(userId: string): Membership[] {
    return this.store.db.query<MemberRow,[string]>('SELECT * FROM memberships WHERE user_id=? AND status=\'active\'').all(userId).map(row => ({ id: row.id, userId: row.user_id, workspaceId: 'business', role: row.role, outletIds: JSON.parse(row.outlets) as string[], ...(row.dealer_org_id ? {dealerOrgId: row.dealer_org_id} : {}), status: row.status, version: row.version }));
  }
  has(actor: Principal, role: WorkspaceRole) { return actor.memberships.some(m => m.role === role && m.status === 'active'); }
  founder(actor: Principal) { if (!this.has(actor,'founder')) fail('FORBIDDEN',403,'Akses tidak dibenarkan.'); }
  operational(actor: Principal, outletId?: string, ownerId?: string) {
    if (this.has(actor, 'founder')) return;
    if (!actor.memberships.some(m => m.role === 'staff' && (!outletId || m.outletIds.includes(outletId)))) fail('FORBIDDEN',403,'Akses operasi tidak dibenarkan.');
    if (ownerId && actor.user.id !== ownerId) fail('FORBIDDEN',403);
  }
  own(actor: Principal, customerId: string, outletId?: string, assignedStaffId?: string) {
    if (actor.user.id === customerId || this.has(actor, 'founder')) return;
    if (actor.memberships.some(m => m.role === 'staff' && !!outletId && m.outletIds.includes(outletId) && (!assignedStaffId || assignedStaffId === actor.user.id))) return;
    fail('FORBIDDEN',403,'Rekod ini di luar akses anda.');
  }
  resolve(request: Request): Principal {
    const token = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('platform_session='))?.slice(17);
    if (!token) return fail('UNAUTHENTICATED',401,'Sila log masuk.');
    const session = this.store.db.query<{user_id:string;csrf_hash:string;csrf_token:string;expires_at:string;revoked:number},[string]>('SELECT * FROM sessions WHERE token_hash=?').get(hash(token));
    if (!session || session.revoked || session.expires_at <= now()) return fail('SESSION_EXPIRED',401,'Sesi telah tamat. Sila log masuk semula.');
    const row = this.store.db.query<UserRow,[string]>('SELECT id,email,name FROM users WHERE id=?').get(session.user_id);
    if (!row) return fail('UNAUTHENTICATED',401);
    const memberships = this.memberships(row.id);
    if (!memberships.length) return fail('MEMBERSHIP_REVOKED',403);
    return {user:{id:row.id,email:row.email,name:row.name}, memberships, sessionHash:hash(token),csrfHash:session.csrf_hash,csrfToken:session.csrf_token};
  }
  csrf(actor: Principal, input: string | null) { if (!input || hash(input) !== actor.csrfHash) fail('CSRF_INVALID',403,'Sesi keselamatan tidak sah. Muat semula halaman.'); }
  revalidate(actor:Principal):Principal {
    const session=this.store.db.query<{user_id:string;csrf_hash:string;csrf_token:string;expires_at:string;revoked:number},[string]>('SELECT * FROM sessions WHERE token_hash=?').get(actor.sessionHash);
    if(!session||session.revoked||session.expires_at<=now()||session.user_id!==actor.user.id)fail('SESSION_EXPIRED',401,'Sesi telah tamat.');
    const memberships=this.memberships(actor.user.id);if(!memberships.length)fail('MEMBERSHIP_REVOKED',403);
    return {...actor,memberships,csrfHash:session.csrf_hash,csrfToken:session.csrf_token};
  }
  sessionData(actor: Principal, csrfToken: string): SessionData {
    const roles = actor.memberships.map(m => m.role);
    return {user:actor.user,memberships:actor.memberships,csrfToken,capabilities:[...new Set(roles.flatMap(role => role === 'founder' ? ['business.read','business.write','people.grant','payment.confirm','catalogue.publish','knowledge.publish'] : role === 'staff' ? ['assigned.read','assigned.write'] : role === 'developer' ? ['runtime.read'] : ['own.read','own.write']))]};
  }
  async authenticate(kind: 'signup' | 'login' | 'bootstrap', raw: unknown): Promise<{data:SessionData;cookie:string}> {
    const input = object(raw);
    fields(input,kind === 'login' ? ['email','password'] : kind === 'bootstrap' ? ['email','password','name','token'] : ['email','password','name']);
    const email = text(input.email,'Email',254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('INVALID_EMAIL');
    const password = text(input.password,'Kata laluan',256,12);
    let user = this.store.db.query<UserRow,[string]>('SELECT * FROM users WHERE email=?').get(email);
    if (kind === 'login') {
      // Perform the same expensive derivation for unknown users to avoid a timing oracle.
      const encoded = user?.password_hash ?? `scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
      const [,salt,digest] = encoded.split(':');
      const computed = await scryptAsync(password,salt,64) as Buffer;
      if (!user || !timingSafeEqual(computed,Buffer.from(digest,'hex'))) fail('INVALID_CREDENTIALS',401,'Email atau kata laluan tidak sah.');
    } else {
      const name = text(input.name,'Nama',100);
      const salt = randomBytes(16).toString('hex');
      const digest = await scryptAsync(password,salt,64) as Buffer;
      const created: UserRow = {id:id(),email,name,password_hash:`scrypt:${salt}:${digest.toString('hex')}`};
      this.store.atomic(() => {
        if (kind === 'bootstrap') {
          if (this.store.metadata('owner_bootstrapped')) fail('ALREADY_BOOTSTRAPPED',409);
          if (!this.bootstrapToken || hash(text(input.token,'Token',200)) !== hash(this.bootstrapToken)) fail('BOOTSTRAP_DENIED',403);
        }
        if (this.store.db.query('SELECT id FROM users WHERE email=?').get(email)) fail('ACCOUNT_EXISTS',409,'Akaun sudah wujud.');
        this.store.db.query('INSERT INTO users VALUES(?,?,?,?,?)').run(created.id,email,name,created.password_hash,now());
        this.store.db.query('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)').run(id(),created.id,'customer','[]',null,'active',1);
        if (kind === 'bootstrap') {
          this.store.db.query('INSERT INTO memberships VALUES(?,?,?,?,?,?,?)').run(id(),created.id,'founder','["hq"]',null,'active',1);
          this.store.setMetadata('owner_bootstrapped',now());
          this.store.audit(created.id,'identity.bootstrap',created.id);
        }
      });
      user = created;
    }
    if (!user) return fail('INVALID_CREDENTIALS',401);
    const token = opaque(), csrf = opaque();
    this.store.db.query('INSERT INTO sessions(token_hash,user_id,csrf_hash,expires_at,revoked,csrf_token) VALUES(?,?,?,?,0,?)').run(hash(token),user.id,hash(csrf),new Date(Date.now()+12*3600_000).toISOString(),csrf);
    const actor: Principal = {user:{id:user.id,email:user.email,name:user.name},memberships:this.memberships(user.id),sessionHash:hash(token),csrfHash:hash(csrf)};
    return {data:this.sessionData(actor,csrf),cookie:`platform_session=${token}; HttpOnly; SameSite=Strict; Path=/api/platform; Max-Age=43200`};
  }
  refreshCsrf(actor: Principal): SessionData { if(actor.csrfToken)return this.sessionData(actor,actor.csrfToken);const token=opaque();this.store.db.query('UPDATE sessions SET csrf_hash=?,csrf_token=? WHERE token_hash=?').run(hash(token),token,actor.sessionHash);return this.sessionData(actor,token); }
  logout(actor: Principal) { this.store.db.query('UPDATE sessions SET revoked=1 WHERE token_hash=?').run(actor.sessionHash); }
  grant(actor: Principal, raw: unknown) {
    this.founder(actor);
    const input=object(raw);fields(input,['userId','role','outletIds','dealerOrgId','expectedVersion']);
    const userId=text(input.userId,'Pengguna',120), role=oneOf(input.role,['customer','staff','founder','developer'] as const), outlets=strings(input.outletIds??[]);
    if (!this.store.db.query('SELECT id FROM users WHERE id=?').get(userId)) fail('NOT_FOUND',404);
    const existing=this.store.db.query<MemberRow,[string,string]>('SELECT * FROM memberships WHERE user_id=? AND role=?').get(userId,role);
    this.store.revision(existing?.version??0,input.expectedVersion);
    if (role==='staff' && !outlets.length) fail('OUTLET_REQUIRED');
    const dealerOrgId=input.dealerOrgId===undefined?null:text(input.dealerOrgId,'Organisasi',120);
    if (dealerOrgId && !this.store.all<{dealerOrgId?:string;status:string}>('dealer_applications').some(a=>a.dealerOrgId===dealerOrgId&&a.status==='approved')) fail('DEALER_NOT_APPROVED',409);
    const membershipId=existing?.id??id(), version=(existing?.version??0)+1;
    this.store.db.query('INSERT INTO memberships VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,role) DO UPDATE SET outlets=excluded.outlets,dealer_org_id=excluded.dealer_org_id,status=excluded.status,version=excluded.version').run(membershipId,userId,role,JSON.stringify(outlets),dealerOrgId,'active',version);
    this.store.audit(actor.user.id,'membership.grant',membershipId,version);
    return this.memberships(userId).find(m=>m.id===membershipId)!;
  }
  revoke(actor: Principal, raw: unknown) {
    this.founder(actor);const input=object(raw);fields(input,['membershipId','expectedVersion']);
    const membershipId=text(input.membershipId,'Membership',120);
    const existing=this.store.db.query<MemberRow,[string]>('SELECT * FROM memberships WHERE id=?').get(membershipId)??fail('NOT_FOUND',404);
    this.store.revision(existing.version,input.expectedVersion);
    if (existing.role==='founder' && this.store.db.query<{count:number},[]>('SELECT count(*) as count FROM memberships WHERE role=\'founder\' AND status=\'active\'').get()!.count<=1) fail('LAST_FOUNDER',409);
    this.store.db.query('UPDATE memberships SET status=\'revoked\',version=version+1 WHERE id=?').run(membershipId);
    this.store.audit(actor.user.id,'membership.revoke',membershipId,existing.version+1);return {id:membershipId,status:'revoked'};
  }
}
