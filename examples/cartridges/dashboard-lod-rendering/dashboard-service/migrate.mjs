#!/usr/bin/env node
// =============================================================================
// dashboard-service / migrate.mjs
// =============================================================================
// Migration runner for the SCRIBE provenance schema.
//
// Reads from the T5 cartridge migrations directory:
//   examples/cartridges/retrieval-provenance/migrations/
//
// Applies *.postgres.sql files in lexical order (001-init, then 002-pgvector, etc.).
// Skips *.sqlite.sql files (those are for SQLite, not Postgres).
// Applies 002-pgvector.postgres.sql ONLY when the pgvector extension is reachable;
// logs a warning and continues if pgvector is not installed.
//
// Idempotent: all DDL uses CREATE IF NOT EXISTS / OR REPLACE patterns.
//
// Usage:
//   node migrate.mjs
//   RH_POSTGRES_URL=... node migrate.mjs
//   node migrate.mjs --dry-run    (log what would run, do not execute)
// =============================================================================

import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPgConfig, createPool, query } from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Migrations live in the sibling T5 retrieval-provenance cartridge.
const MIGRATIONS_DIR = resolve(
  __dirname,
  '..',  // dashboard-lod-rendering/
  '..',  // cartridges/
  'retrieval-provenance',
  'migrations',
);

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('[migrate] SCRIBE schema migration runner');
  if (DRY_RUN) {
    console.log('[migrate] DRY RUN — no SQL will be executed');
  }

  // 1. Load PG config.
  const pgConfig = loadPgConfig();
  if (!pgConfig.ok) {
    console.error(`[migrate] ERROR: Cannot connect to PG — ${pgConfig.reason}`);
    console.error(`[migrate] Hint: ${pgConfig.hint}`);
    process.exit(1);
  }

  console.log(`[migrate] PG source: ${pgConfig.source}`);
  console.log(`[migrate] Migrations dir: ${MIGRATIONS_DIR}`);

  // 2. Discover .postgres.sql files in lexical order.
  let files;
  try {
    files = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.postgres.sql'))
      .sort(); // lexical = numeric order for 001-, 002-, etc.
  } catch (err) {
    console.error(`[migrate] ERROR: Cannot read migrations directory: ${err.message}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.warn('[migrate] WARNING: No *.postgres.sql files found in migrations dir.');
    return;
  }

  console.log(`[migrate] Found ${files.length} migration file(s): ${files.join(', ')}`);

  if (DRY_RUN) {
    for (const f of files) {
      const isVector = f.includes('pgvector');
      console.log(`[migrate] [DRY RUN] Would apply: ${f}${isVector ? ' (pgvector-gated)' : ''}`);
    }
    return;
  }

  // 3. Create pool.
  let pool;
  try {
    pool = await createPool(pgConfig.url);
  } catch (err) {
    console.error(`[migrate] ERROR: Failed to create PG pool: ${err.message}`);
    process.exit(1);
  }

  // 4. Apply each migration in order.
  let applied = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, 'utf8');

    const isPgVector = file.includes('pgvector') || file.includes('002-pgvector');

    if (isPgVector) {
      // Probe: try to check pgvector availability before applying.
      try {
        await query(pool, "SELECT 1 FROM pg_available_extensions WHERE name = 'vector'");
        // If vector extension is available, check if it's in pg_extension (installed).
        const { rows } = await query(
          pool,
          "SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1",
        );
        if (rows.length === 0) {
          // pgvector is available as an extension but not installed — try to install it.
          // The migration itself will do CREATE EXTENSION IF NOT EXISTS vector.
          console.log(`[migrate] pgvector: extension available but not yet installed — migration will install it.`);
        }
      } catch {
        // Can't probe — proceed and let the migration fail gracefully.
      }

      try {
        await query(pool, sql);
        console.log(`[migrate] ✓ Applied: ${file}`);
        applied++;
      } catch (err) {
        // pgvector not installed → skip with warning rather than hard-failing.
        if (
          err.message?.includes('extension "vector" is not available') ||
          err.message?.includes('could not open extension control file') ||
          err.code === '58P01' // undefined_file
        ) {
          console.warn(
            `[migrate] WARNING: Skipped ${file} — pgvector extension not installed on this server. ` +
            `Upstream/downstream traversal works without pgvector; hybrid_search requires it.`
          );
          skipped++;
        } else {
          console.error(`[migrate] ERROR applying ${file}: ${err.message}`);
          await pool.end();
          process.exit(1);
        }
      }
    } else {
      // Non-vector migration — apply unconditionally.
      try {
        await query(pool, sql);
        console.log(`[migrate] ✓ Applied: ${file}`);
        applied++;
      } catch (err) {
        console.error(`[migrate] ERROR applying ${file}: ${err.message}`);
        await pool.end();
        process.exit(1);
      }
    }
  }

  await pool.end();

  console.log(
    `[migrate] Done. Applied: ${applied}, Skipped (pgvector unavailable): ${skipped}`
  );
}

main().catch(err => {
  console.error(`[migrate] Unexpected error: ${err.message}`);
  process.exit(1);
});
