// DB adapter — presents a uniform async interface over Postgres (`pg`) and
// SQLite (`better-sqlite3`). Driver is picked from release-history config.
//
// Both drivers are lazy-imported; install only the one you use.
//
// API surface:
//   const db = await openDb(cfg);
//   await db.query(sql, params)  → { rows: [...] }
//   await db.query_one(sql, params) → first row or undefined
//   await db.begin() / db.commit() / db.rollback()
//   await db.close()
//   db.driver → 'postgres' | 'sqlite'
//   db.rewriteSql(sql) → sql with driver-appropriate placeholders + function names
//
// Placeholder convention: scripts write `$1, $2, ...` (Postgres-native).
// The adapter rewrites to `?` for SQLite on the fly.

import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA_PREFIX_RE = /\brelease_history\./g;

function rewriteForSqlite(sql) {
  // 1. Replace $1, $2, ... with ? (SQLite uses positional `?`)
  let out = sql.replace(/\$(\d+)/g, '?');
  // 2. Strip `release_history.` schema prefix (SQLite is namespace-flat)
  out = out.replace(SCHEMA_PREFIX_RE, '');
  // 3. now() → CURRENT_TIMESTAMP
  out = out.replace(/\bnow\(\)/gi, "strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  // 4. ::int / ::text casts — drop them for SQLite
  out = out.replace(/::\w+/g, '');
  // 4a. to_char(col, 'YYYY-MM-DD') → col  (SQLite stores dates as ISO text already)
  out = out.replace(/to_char\s*\(\s*([\w.]+)\s*,\s*'YYYY-MM-DD'\s*\)/gi, '$1');
  // 4b. string_agg(col, sep) → group_concat(col, sep)
  out = out.replace(/\bstring_agg\s*\(/gi, 'group_concat(');
  // 4c. encode(...) and sha1(...) are Postgres-specific; if used, script should branch.
  // 5. BOOLEAN true/false → 1/0 (usually fine either way, but `= true` fails silently
  //    in SQLite because it compares TEXT 'true' rather than INTEGER 1)
  out = out.replace(/= true\b/g, '= 1').replace(/= false\b/g, '= 0');
  // 6. ON CONFLICT (cols) DO UPDATE SET ... — SQLite supports this since 3.24
  //    (Just pass through.)
  // 7. ORDER BY ... NULLS LAST — SQLite supports as of 3.30
  // 8. RETURNING — supported since 3.35
  return out;
}

export async function openDb(cfg) {
  const driver = cfg.db?.driver || 'sqlite';

  if (driver === 'postgres') {
    return openPostgres(cfg);
  }
  if (driver === 'sqlite') {
    return openSqlite(cfg);
  }
  throw new Error(`Unknown db.driver '${driver}'. Expected 'postgres' or 'sqlite'.`);
}

async function openPostgres(cfg) {
  const { default: pg } = await import('pg');
  const connString = process.env[cfg.db?.postgres_url_env || 'RH_POSTGRES_URL'];
  const client = new pg.Client(connString || {
    host:     process.env.PG_HOST || 'localhost',
    port:     parseInt(process.env.PG_PORT || '5432', 10),
    user:     process.env.PG_USER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PG_DB || 'postgres',
  });
  await client.connect();

  const schema = cfg.db?.postgres_schema || 'release_history';
  // Set search_path so plain table names resolve to our schema
  await client.query(`SET search_path TO ${schema}, public`);

  return {
    driver: 'postgres',
    async query(sql, params = []) {
      return await client.query(sql, params);
    },
    async query_one(sql, params = []) {
      const r = await client.query(sql, params);
      return r.rows[0];
    },
    async begin() { await client.query('BEGIN'); },
    async commit() { await client.query('COMMIT'); },
    async rollback() { await client.query('ROLLBACK'); },
    async close() { await client.end(); },
    async truncate(table) {
      // Use schema-qualified name for Postgres; table may or may not already be qualified
      const qual = table.includes('.') ? table : `release_history.${table}`;
      await client.query(`TRUNCATE TABLE ${qual} RESTART IDENTITY CASCADE`);
    },
    rewriteSql(sql) { return sql; }, // native
  };
}

async function openSqlite(cfg) {
  let Database;
  try {
    Database = (await import('better-sqlite3')).default;
  } catch (e) {
    throw new Error(
      `SQLite driver requires better-sqlite3. Install it with:\n` +
      `  npm install better-sqlite3\n` +
      `Or switch to Postgres in release-history.local.json (db.driver = "postgres").\n` +
      `Original error: ${e.message}`
    );
  }
  const path = cfg.db?.sqlite_path_abs;
  if (!path) throw new Error('db.sqlite_path missing in config');

  // Auto-apply migration if the DB is new/empty
  const isNew = !existsSync(path);
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  if (isNew) {
    const { join, dirname: pathDirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const here = pathDirname(fileURLToPath(import.meta.url));
    const migrationPath = join(here, '..', '..', 'migrations', 'release-history', '001-init.sqlite.sql');
    if (existsSync(migrationPath)) {
      const sql = readFileSync(migrationPath, 'utf8');
      db.exec(sql);
      console.error(`[db] applied migration ${migrationPath}`);
    }
  }

  // SQLite's driver only accepts numbers/strings/bigints/buffers/null.
  // Coerce JS booleans (0/1), undefined (null), and Date (ISO string) for ergonomics.
  function coerceParam(v) {
    if (v === undefined) return null;
    if (v === true) return 1;
    if (v === false) return 0;
    if (v instanceof Date) return v.toISOString();
    return v;
  }

  return {
    driver: 'sqlite',
    async query(sql, params = []) {
      const rewritten = rewriteForSqlite(sql);
      const stmt = db.prepare(rewritten);
      const coerced = params.map(coerceParam);
      const upper = rewritten.trim().toUpperCase();
      if (upper.startsWith('SELECT') || upper.startsWith('WITH')) {
        const rows = stmt.all(...coerced);
        return { rows, rowCount: rows.length };
      } else if (upper.includes('RETURNING')) {
        const rows = stmt.all(...coerced);
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...coerced);
        return { rows: [], rowCount: info.changes };
      }
    },
    async query_one(sql, params = []) {
      const r = await this.query(sql, params);
      return r.rows[0];
    },
    async begin() { db.exec('BEGIN'); },
    async commit() { db.exec('COMMIT'); },
    async rollback() { db.exec('ROLLBACK'); },
    async close() { db.close(); },
    async truncate(table) {
      const bare = table.replace(/^release_history\./, '');
      db.exec(`DELETE FROM ${bare}`);
      try { db.exec(`DELETE FROM sqlite_sequence WHERE name = '${bare}'`); } catch {}
    },
    rewriteSql(sql) { return rewriteForSqlite(sql); },
  };
}

// CLI self-test: `node tools/release-history/db.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  const { loadConfig } = await import('./config.mjs');
  const cfg = loadConfig();
  const db = await openDb(cfg);
  console.log(`driver=${db.driver}`);
  const r = await db.query(
    db.driver === 'sqlite'
      ? `SELECT COUNT(*) AS n FROM release`
      : `SELECT COUNT(*)::int AS n FROM release_history.release`
  );
  console.log(`release rows: ${r.rows[0].n}`);
  await db.close();
}
