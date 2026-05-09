/**
 * Minimal type shim for the `pg` package.
 *
 * `pg` is an optional runtime dependency used only when PG_TEST=1 integration
 * tests run, or when the dashboard service runs in live mode. `@types/pg` is
 * not installed as a root dev-dependency to avoid bloating CI for consumers
 * that never use live PG.
 *
 * This declaration satisfies TypeScript's `noImplicitAny` / TS7016 rule for
 * the dynamic `import('pg')` call sites in `db.ts` and the PG_TEST gated
 * integration tests without adding `skipLibCheck` exceptions.
 *
 * The `pg` module is imported with `as any` at call sites; this declaration
 * prevents TS7016 from blocking the build.
 */

declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    [key: string]: unknown;
  }

  export interface QueryResult<R = Record<string, unknown>> {
    rows: R[];
    rowCount: number | null;
    command: string;
    oid: number;
    fields: Array<{ name: string; tableID: number; columnID: number; dataTypeID: number; dataTypeSize: number; dataTypeModifier: number; format: string }>;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<R = Record<string, unknown>>(queryText: string, values?: unknown[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export class Client {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    query<R = Record<string, unknown>>(queryText: string, values?: unknown[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }

  export default { Pool, Client };
}
