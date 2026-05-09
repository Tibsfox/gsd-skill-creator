/**
 * SCRIBE PG Runtime — db.ts
 *
 * TypeScript wrapper over `pg` (Node postgres client) that mirrors the
 * canonical env-loading discipline from `tools/release-history/run-with-pg.mjs`.
 *
 * This module is the TypeScript-layer equivalent of the dashboard-service's
 * `db.mjs`. It is used by:
 *   - `src/scribe/pg-runtime/__tests__/endpoint-shapes.test.ts` (PG_TEST=1 gated)
 *   - Component 05 round-trip event persistence (future consumer)
 *
 * `pg` is an optional peer dependency. Import this module only when PG_TEST=1
 * or in live contexts where `pg` is installed.
 *
 * @module scribe/pg-runtime/db
 */

import { loadPgEnv } from './env-loader.js';
import { PgRuntimeError } from '../types/errors.js';

// ---------------------------------------------------------------------------
// Re-export env-loading for downstream consumers
// ---------------------------------------------------------------------------

export { loadPgEnv } from './env-loader.js';

// ---------------------------------------------------------------------------
// Pool factory
// ---------------------------------------------------------------------------

// Dynamic import type — avoids hard dep on @types/pg at compile time.
type PgPool = {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
};

/**
 * Create a `pg.Pool` from the resolved PG URL.
 *
 * Lazily imports `pg` so callers that don't use live PG don't pay the import cost.
 * Throws `PgRuntimeError` with reason `connection-failed` if `pg` is not installed.
 *
 * @param url - postgresql:// connection string (from loadPgEnv())
 * @param opts - optional pool options
 */
export async function createPool(
  url?: string,
  opts: { max?: number; idleTimeoutMillis?: number } = {},
): Promise<PgPool> {
  // Resolve URL if not provided.
  let connectionString = url;
  if (!connectionString) {
    const cfg = loadPgEnv();
    if (!cfg.ok) {
      throw new PgRuntimeError(
        `Cannot create pool: ${cfg.reason} — ${cfg.hint}`,
        'pg-not-configured',
      );
    }
    connectionString = cfg.url;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pgModule: { Pool: new (opts: Record<string, unknown>) => PgPool };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('pg');
    // Handle both ESM default export and CommonJS-style.
    pgModule = mod.default ?? mod;
  } catch (err: unknown) {
    throw new PgRuntimeError(
      '`pg` package is not installed. Run: npm install pg (in the dashboard-service dir)',
      'connection-failed',
      { originalError: (err as Error).message },
    );
  }

  const pool = new pgModule.Pool({
    connectionString,
    max: opts.max ?? 5,
    idleTimeoutMillis: opts.idleTimeoutMillis ?? 10_000,
  });

  return pool;
}

// ---------------------------------------------------------------------------
// Query helper
// ---------------------------------------------------------------------------

/**
 * Run a parameterized SQL query on the pool.
 *
 * @param pool - pg.Pool instance from createPool()
 * @param sql  - parameterized SQL string
 * @param params - query parameters ($1, $2, ...)
 * @returns rows from the result set
 * @throws PgRuntimeError with reason 'query-failed' on SQL error
 */
export async function query<T = Record<string, unknown>>(
  pool: PgPool,
  sql: string,
  params: unknown[] = [],
): Promise<{ rows: T[] }> {
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows as T[] };
  } catch (err: unknown) {
    throw new PgRuntimeError(
      `Query failed: ${(err as Error).message}`,
      'query-failed',
      { sql, params: params as Record<string, unknown>[], originalError: (err as Error).message },
    );
  }
}
