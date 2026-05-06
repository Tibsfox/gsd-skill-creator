/**
 * W4e.A — atlas-pg mirror.
 *
 * Streams the SQLite atlas tables (migration 003) into Postgres `atlas.*`
 * for cross-project / server-side queries. Called from the dashboard's
 * /api/atlas/index handler after `runAtlasIndexer` succeeds.
 *
 * Failure mode: PG-down or schema-mismatch is logged and skipped. SQLite
 * remains the canonical write target; the mirror is a derivative cache.
 *
 * Dual-store invariant: this module is server-only (Node fs + pg client).
 * Browser bundles MUST NOT import it. Imported only from
 * scripts/serve-dashboard.mjs and tools/atlas-index.mjs.
 */

import type Database from 'better-sqlite3';

// ESM-imported pg types are loose; `pg` exposes Pool + PoolClient via default
// export. We dynamic-import to keep `pg` out of the test bundle (vitest under
// happy-dom would otherwise try to resolve it).
type PgClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }>;
  release: () => void;
};
type PgPool = {
  connect: () => Promise<PgClient>;
  end: () => Promise<void>;
};

let _pool: PgPool | null = null;

/**
 * Lazy-construct a single shared pool. Reads PG creds from env (PGHOST etc.)
 * which the dashboard already loads via `<repo-root>/.env`. Returns null if
 * pg is not installed (test environments) or env is missing — callers must
 * tolerate.
 */
async function getPool(): Promise<PgPool | null> {
  if (_pool) return _pool;
  if (!process.env.PGHOST && !process.env.RH_POSTGRES_URL) return null;
  let pg: { Pool: new (cfg: Record<string, unknown>) => PgPool };
  try {
    // @ts-expect-error — pg has no shipped .d.ts; treat as opaque module.
    pg = (await import('pg')) as unknown as { Pool: new (cfg: Record<string, unknown>) => PgPool };
  } catch {
    return null;
  }
  // Use connection string when present; otherwise compose from PG* env vars.
  const cfg: Record<string, unknown> = process.env.RH_POSTGRES_URL
    ? { connectionString: process.env.RH_POSTGRES_URL }
    : {
        host: process.env.PGHOST,
        port: parseInt(process.env.PGPORT ?? '5432', 10),
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
      };
  cfg.max = 4;
  cfg.idleTimeoutMillis = 30_000;
  _pool = new pg.Pool(cfg);
  return _pool;
}

interface MirrorResult {
  ok: boolean;
  tables: Record<string, number>;
  error?: string;
  durationMs: number;
}

/**
 * Mirror every row from the SQLite per-project DB for `(projectId, snapshotId)`
 * into the Postgres `atlas.*` tables. Idempotent — uses ON CONFLICT DO NOTHING
 * so re-runs are safe.
 *
 * Performance: pages SQLite reads (LIMIT/OFFSET 1k) and bulk-inserts via a
 * single VALUES tuple per page. For larger snapshots a real COPY would be
 * faster, but the JSON-of-rows path keeps the dependency surface small.
 */
export async function mirrorSnapshotToPg(
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<MirrorResult> {
  const start = Date.now();
  const pool = await getPool();
  const out: MirrorResult = { ok: false, tables: {}, durationMs: 0 };
  if (!pool) {
    out.error = 'pg pool unavailable (no env or pg module)';
    out.durationMs = Date.now() - start;
    return out;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    out.tables.symbols           = await mirrorSymbols(client, sqlite, projectId, snapshotId);
    out.tables.calls             = await mirrorCalls(client, sqlite, projectId, snapshotId);
    out.tables.symbol_references = await mirrorReferences(client, sqlite, projectId, snapshotId);
    out.tables.type_relations    = await mirrorTypeRelations(client, sqlite, projectId, snapshotId);
    out.tables.files_changed     = await mirrorFilesChanged(client, sqlite, projectId);
    out.tables.mission_provenance = await mirrorProvenance(client, sqlite, projectId, snapshotId);
    await client.query('COMMIT');
    out.ok = true;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch { /* ignore */ }
    out.error = e instanceof Error ? e.message : String(e);
  } finally {
    client.release();
  }
  out.durationMs = Date.now() - start;
  return out;
}

const PAGE = 1000;

async function mirrorTable(
  client: PgClient,
  sqlite: Database.Database,
  selectSql: string,
  selectArgs: unknown[],
  insertSql: (rows: Record<string, unknown>[]) => { sql: string; params: unknown[] },
): Promise<number> {
  let inserted = 0;
  let offset = 0;
  while (true) {
    const rows = sqlite
      .prepare(`${selectSql} LIMIT ? OFFSET ?`)
      .all(...selectArgs, PAGE, offset) as Record<string, unknown>[];
    if (rows.length === 0) break;
    const { sql, params } = insertSql(rows);
    await client.query(sql, params);
    inserted += rows.length;
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return inserted;
}

function bulkInsertParams(
  rows: Record<string, unknown>[],
  columns: string[],
): { values: string; params: unknown[] } {
  const params: unknown[] = [];
  const tuples: string[] = [];
  let p = 1;
  for (const r of rows) {
    const placeholders = columns.map(() => `$${p++}`);
    tuples.push(`(${placeholders.join(',')})`);
    for (const col of columns) params.push(r[col] ?? null);
  }
  return { values: tuples.join(','), params };
}

async function mirrorSymbols(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, snapshot_id, file_path, kind, name, qualified_name,
            start_byte, end_byte, start_line, end_line, signature_hash,
            modifiers_json, language, parent_symbol_id
       FROM symbols WHERE snapshot_id = ?
       ORDER BY id`,
    [snapshotId],
    (rows) => {
      const cols = [
        'id', 'snapshot_id', 'file_path', 'kind', 'name', 'qualified_name',
        'start_byte', 'end_byte', 'start_line', 'end_line', 'signature_hash',
        'modifiers_json', 'language', 'parent_symbol_id',
      ];
      // Prepend project_id to every row.
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.symbols (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

async function mirrorCalls(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, snapshot_id, caller_symbol_id, callee_symbol_id,
            call_site_byte, call_site_line, confidence
       FROM calls WHERE snapshot_id = ?
       ORDER BY id`,
    [snapshotId],
    (rows) => {
      const cols = ['id', 'snapshot_id', 'caller_symbol_id', 'callee_symbol_id',
                    'call_site_byte', 'call_site_line', 'confidence'];
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.calls (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

async function mirrorReferences(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, snapshot_id, file_path, start_byte, end_byte, start_line, end_line,
            name, resolved_symbol_id, resolution_confidence, resolution_kind
       FROM symbol_references WHERE snapshot_id = ?
       ORDER BY id`,
    [snapshotId],
    (rows) => {
      const cols = ['id', 'snapshot_id', 'file_path', 'start_byte', 'end_byte',
                    'start_line', 'end_line', 'name', 'resolved_symbol_id',
                    'resolution_confidence', 'resolution_kind'];
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.symbol_references (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

async function mirrorTypeRelations(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, snapshot_id, from_symbol_id, to_symbol_id, kind, confidence
       FROM type_relations WHERE snapshot_id = ?
       ORDER BY id`,
    [snapshotId],
    (rows) => {
      const cols = ['id', 'snapshot_id', 'from_symbol_id', 'to_symbol_id', 'kind', 'confidence'];
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.type_relations (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

async function mirrorFilesChanged(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, mission_id, commit_sha, file_path, change_kind,
            rename_from, added_lines, removed_lines
       FROM files_changed
       ORDER BY id`,
    [],
    (rows) => {
      const cols = ['id', 'mission_id', 'commit_sha', 'file_path', 'change_kind',
                    'rename_from', 'added_lines', 'removed_lines'];
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.files_changed (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

async function mirrorProvenance(
  client: PgClient,
  sqlite: Database.Database,
  projectId: string,
  snapshotId: string,
): Promise<number> {
  return mirrorTable(
    client,
    sqlite,
    `SELECT id, snapshot_id, file_path, line_no, mission_id, commit_sha, weight
       FROM mission_provenance WHERE snapshot_id = ?
       ORDER BY id`,
    [snapshotId],
    (rows) => {
      const cols = ['id', 'snapshot_id', 'file_path', 'line_no', 'mission_id',
                    'commit_sha', 'weight'];
      const augmented = rows.map((r) => ({ project_id: projectId, ...r }));
      const allCols = ['project_id', ...cols];
      const { values, params } = bulkInsertParams(augmented, allCols);
      const sql = `INSERT INTO atlas.mission_provenance (${allCols.join(',')}) VALUES ${values}
                   ON CONFLICT (project_id, id) DO NOTHING`;
      return { sql, params };
    },
  );
}

/**
 * Server-side text search across all mirrored projects.
 * Uses the `search_text` tsvector + GIN index. Returns the top `limit` hits
 * ranked by ts_rank_cd.
 */
export async function searchSymbols(
  query: string,
  limit = 50,
): Promise<Array<{
  project_id: string;
  id: string;
  snapshot_id: string;
  file_path: string;
  qualified_name: string;
  kind: string;
  rank: number;
}>> {
  const pool = await getPool();
  if (!pool) return [];
  const client = await pool.connect();
  try {
    // plainto_tsquery is the safest input — handles user-supplied text.
    const result = await client.query(
      `SELECT project_id, id, snapshot_id, file_path, qualified_name, kind,
              ts_rank_cd(search_text, plainto_tsquery('simple', $1)) AS rank
         FROM atlas.symbols
        WHERE search_text @@ plainto_tsquery('simple', $1)
        ORDER BY rank DESC
        LIMIT $2`,
      [query, limit],
    );
    return result.rows as Array<{
      project_id: string;
      id: string;
      snapshot_id: string;
      file_path: string;
      qualified_name: string;
      kind: string;
      rank: number;
    }>;
  } finally {
    client.release();
  }
}

/**
 * Vector cosine search (W4e.B). Returns `limit` symbols closest to the
 * query embedding. Embedding is supplied by the caller — the Node-side
 * embed pipeline lives in `embed.ts`.
 */
export async function searchSemantic(
  embedding: number[],
  limit = 50,
): Promise<Array<{
  project_id: string;
  id: string;
  snapshot_id: string;
  file_path: string;
  qualified_name: string;
  kind: string;
  distance: number;
}>> {
  const pool = await getPool();
  if (!pool) return [];
  if (embedding.length !== 384) {
    throw new Error(`searchSemantic: expected 384-dim embedding, got ${embedding.length}`);
  }
  const client = await pool.connect();
  try {
    // pgvector cosine distance via `<=>`. Rows with NULL embedding are
    // excluded by the WHERE clause.
    const vec = '[' + embedding.join(',') + ']';
    const result = await client.query(
      `SELECT project_id, id, snapshot_id, file_path, qualified_name, kind,
              embedding <=> $1::vector AS distance
         FROM atlas.symbols
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT $2`,
      [vec, limit],
    );
    return result.rows as Array<{
      project_id: string;
      id: string;
      snapshot_id: string;
      file_path: string;
      qualified_name: string;
      kind: string;
      distance: number;
    }>;
  } finally {
    client.release();
  }
}

/** Test helper: bypass the lazy pool for explicit injection. */
export function _setPoolForTest(pool: PgPool | null): void {
  _pool = pool;
}
