import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export class DomainError extends Error {
  constructor(readonly code: string, readonly status = 400, message = 'Permintaan tidak dapat diproses.') { super(message); }
}
export function fail(code: string, status = 400, message?: string): never { throw new DomainError(code, status, message); }
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const object = (input: unknown): Record<string,unknown> => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('INVALID_INPUT');
  return input as Record<string,unknown>;
};
export function text(input: unknown, label = 'medan', max = 4000, min = 1): string {
  if (typeof input !== 'string' || input.trim().length < min || input.length > max || input.includes('\0')) return fail('INVALID_INPUT', 400, `${label} tidak sah.`);
  return input.trim();
}
export function integer(input: unknown, label = 'nilai', min = 0, max = 100_000_000): number {
  if (typeof input !== 'number' || !Number.isSafeInteger(input) || input < min || input > max) return fail('INVALID_INPUT', 400, `${label} mesti integer yang sah.`);
  return input;
}
export function list(input: unknown, max = 100): unknown[] {
  if (!Array.isArray(input) || input.length > max) return fail('INVALID_INPUT');
  return input;
}
export const strings = (input: unknown, max = 100): string[] => list(input, max).map(v => text(v, 'ID', 120));
export function oneOf<T extends string>(input: unknown, values: readonly T[]): T {
  if (typeof input !== 'string' || !values.includes(input as T)) return fail('INVALID_INPUT');
  return input as T;
}
export function date(input: unknown): string {
  const value = text(input, 'Tarikh', 40);
  if (!Number.isFinite(Date.parse(value))) return fail('INVALID_DATE');
  return new Date(value).toISOString();
}
export function fields(input: Record<string,unknown>, allowed: string[]) {
  if (Object.keys(input).some(key => !allowed.includes(key))) fail('UNKNOWN_FIELD', 400, 'Medan yang tidak dibenarkan dihantar.');
}

interface RecordRow { data: string }
/** JSON payloads remain private to the repository; all writes are typed domain commands. */
export class PlatformStore {
  readonly db: Database;
  constructor(databasePath: string) {
    if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath, { create: true, strict: true });
    this.db.run('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS memberships (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),role TEXT NOT NULL,outlets TEXT NOT NULL,dealer_org_id TEXT,status TEXT NOT NULL,version INTEGER NOT NULL,UNIQUE(user_id,role));
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),csrf_hash TEXT NOT NULL,expires_at TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(kind,id));
      CREATE INDEX IF NOT EXISTS records_kind_updated ON records(kind,updated_at,id);
      CREATE TABLE IF NOT EXISTS dedupe (actor_id TEXT NOT NULL,operation TEXT NOT NULL,key TEXT NOT NULL,input_hash TEXT NOT NULL,data TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(actor_id,operation,key));
      CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,operation TEXT NOT NULL,entity_id TEXT NOT NULL,revision INTEGER NOT NULL,created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS throttle (bucket TEXT PRIMARY KEY,count INTEGER NOT NULL,reset_at INTEGER NOT NULL);
      PRAGMA user_version=1;
    `);
    if(!this.db.query<{name:string},[]>('PRAGMA table_info(sessions)').all().some(column=>column.name==='csrf_token'))this.db.run('ALTER TABLE sessions ADD COLUMN csrf_token TEXT NOT NULL DEFAULT \'\'');
  }
  get<T>(kind: string, recordId: string): T | null {
    const row = this.db.query<RecordRow, [string,string]>('SELECT data FROM records WHERE kind=? AND id=?').get(kind, recordId);
    return row ? JSON.parse(row.data) as T : null;
  }
  require<T>(kind: string, recordId: string): T { return this.get<T>(kind, recordId) ?? fail('NOT_FOUND', 404, 'Rekod tidak ditemui.'); }
  all<T>(kind: string): T[] {
    return this.db.query<RecordRow, [string]>('SELECT data FROM records WHERE kind=? ORDER BY updated_at DESC,id').all(kind).map(row => JSON.parse(row.data) as T);
  }
  save<T extends { id: string }>(kind: string, record: T): T {
    this.db.query('INSERT INTO records(kind,id,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(kind, record.id, JSON.stringify(record), now());
    return record;
  }
  metadata(key: string): string | null { return this.db.query<{value:string}, [string]>('SELECT value FROM metadata WHERE key=?').get(key)?.value ?? null; }
  setMetadata(key: string, value: string) { this.db.query('INSERT INTO metadata(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value); }
  atomic<T>(callback: () => T): T { return this.db.transaction(callback).immediate(); }
  audit(actorId: string, operation: string, entityId: string, revision = 1) { this.db.query('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(id(), actorId, operation, entityId, revision, now()); }
  revision(actual: number, expected: unknown) { if (integer(expected, 'Revision') !== actual) fail('REVISION_CONFLICT', 409, 'Rekod telah berubah. Muat semula sebelum meneruskan.'); }
  rate(bucket: string, maximum = 120) {
    const stamp = Date.now();
    this.atomic(() => {
      const row = this.db.query<{count:number;reset_at:number}, [string]>('SELECT count,reset_at FROM throttle WHERE bucket=?').get(bucket);
      if (row && row.reset_at > stamp && row.count >= maximum) fail('RATE_LIMITED', 429, 'Terlalu banyak permintaan. Cuba semula sebentar lagi.');
      this.db.query('INSERT INTO throttle VALUES(?,?,?) ON CONFLICT(bucket) DO UPDATE SET count=excluded.count,reset_at=excluded.reset_at').run(bucket, row && row.reset_at > stamp ? row.count + 1 : 1, row && row.reset_at > stamp ? row.reset_at : stamp + 60_000);
      this.db.query('DELETE FROM throttle WHERE reset_at<?').run(stamp - 60_000);
    });
  }
  close() { this.db.close(); }
}
