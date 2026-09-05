// Helper pour les requêtes SQL avec typage souple
import { getServerDb } from './db';

export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getServerDb();
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const db = getServerDb();
  return db.prepare(sql).get(...params) as T;
}

export function execute(sql: string, params: any[] = []): void {
  const db = getServerDb();
  db.prepare(sql).run(...params);
}

export function insert(sql: string, params: any[] = []): string {
  const id = crypto.randomUUID();
  const db = getServerDb();
  db.prepare(sql).run(id, ...params);
  return id;
}
