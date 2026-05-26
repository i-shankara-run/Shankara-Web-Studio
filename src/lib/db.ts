import { Pool } from "pg";

const globalForPool = globalThis as unknown as { __pg_pool?: Pool };

function buildPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const wantsSsl = /sslmode=require/i.test(url) || process.env.NODE_ENV === "production";
  return new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 10_000,
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export function db(): Pool {
  if (!globalForPool.__pg_pool) globalForPool.__pg_pool = buildPool();
  return globalForPool.__pg_pool;
}

export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await db().query({ text, values: params as never[] });
  return res.rows as T[];
}

export async function queryOne<T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
