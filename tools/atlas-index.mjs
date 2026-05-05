#!/usr/bin/env node
/**
 * atlas-index.mjs — CLI entry point for the Atlas indexer (v1.49.607 G1).
 *
 * Opens the per-project DB via KBStore, applies migrations idempotently,
 * runs runAtlasIndexer, and prints a summary.
 *
 * Usage:
 *   node tools/atlas-index.mjs --project=<projectId> \
 *     [--snapshot=<snapshotId>] [--path=<projectPath>] \
 *     [--languages=ts,rust,py] [--replace] [--provenance] \
 *     [--registry=<path>] [--db=<path>] [--json]
 *
 * Exit codes:
 *   0  success
 *   1  indexer runtime error
 *   2  bad arguments (missing required flag, invalid value)
 */

import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

// ── argument parsing ──────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

/**
 * Read a `--key=value` or `--key value` argument from argv.
 * Returns the string value or `null` if not found.
 */
function getFlag(name) {
  for (const arg of argv) {
    if (arg.startsWith(`--${name}=`)) return arg.slice(name.length + 3);
  }
  const idx = argv.indexOf(`--${name}`);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) {
    return argv[idx + 1];
  }
  return null;
}

function hasFlag(name) {
  return argv.includes(`--${name}`);
}

// Required
const projectId = getFlag('project');

// Optional
const snapshotFlag   = getFlag('snapshot');
const pathFlag       = getFlag('path');
const languagesFlag  = getFlag('languages');
const registryFlag   = getFlag('registry');
const dbFlag         = getFlag('db');
const modeJson       = hasFlag('json');
const flagReplace    = hasFlag('replace');
const flagProv       = hasFlag('provenance');
// --stream-events (H1): emit one JSONL envelope per event line on stdout.
// When set, --json output is suppressed in favour of per-event JSONL lines.
// Backward-compat: callers that do NOT pass --stream-events see exactly the
// same behaviour as before (single JSON summary line on success, or human
// text).
const flagStreamEvents = hasFlag('stream-events');

// Validate
if (!projectId) {
  if (modeJson) {
    process.stdout.write(JSON.stringify({ ok: false, error: 'missing required --project flag' }) + '\n');
  } else {
    process.stderr.write(
      'atlas-index: error: --project=<projectId> is required\n' +
      '\n' +
      'Usage:\n' +
      '  node tools/atlas-index.mjs --project=<projectId> \\\n' +
      '    [--snapshot=<snapshotId>] [--path=<projectPath>] \\\n' +
      '    [--languages=ts,rust,py] [--replace] [--provenance] \\\n' +
      '    [--registry=<path>] [--db=<path>] [--json]\n',
    );
  }
  process.exit(2);
}

// Default snapshotId to ISO timestamp if not supplied
const snapshotId = snapshotFlag ?? `manual-${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`;

// Language mapping from CLI shorthand → AtlasLanguage enum values
const LANG_SHORTHANDS = {
  ts:   'typescript',
  tsx:  'typescript',
  js:   'javascript',
  jsx:  'javascript',
  rs:   'rust',
  py:   'python',
  go:   'go',
  rb:   'ruby',
  java: 'java',
  cpp:  'cpp',
  c:    'c',
  // also accept the full names
  typescript: 'typescript',
  javascript: 'javascript',
  rust:       'rust',
  python:     'python',
};

let languages;
if (languagesFlag) {
  const parsed = languagesFlag.split(',').map((s) => s.trim().toLowerCase());
  const mapped = parsed.map((s) => {
    const canonical = LANG_SHORTHANDS[s];
    if (!canonical) {
      const errMsg = `atlas-index: error: unknown language "${s}". Known shorthands: ${Object.keys(LANG_SHORTHANDS).join(', ')}\n`;
      if (modeJson) {
        process.stdout.write(JSON.stringify({ ok: false, error: errMsg.trim() }) + '\n');
      } else {
        process.stderr.write(errMsg);
      }
      process.exit(2);
    }
    return canonical;
  });
  languages = [...new Set(mapped)]; // deduplicate (e.g. ts+tsx both → typescript)
}

// ── dynamic imports (dist/ first; fall back to ts source via pathToFileURL) ──

async function importTs(relFromSrc) {
  const distPath = join(REPO_ROOT, 'dist', relFromSrc.replace(/\.ts$/, '.js'));
  if (existsSync(distPath)) {
    return import(pathToFileURL(distPath).href);
  }
  // Fall back to TS source (vitest / tsx environment)
  const srcPath = join(REPO_ROOT, 'src', relFromSrc);
  return import(pathToFileURL(srcPath).href);
}

// ── stream-events helpers (H1) ────────────────────────────────────────────────

/**
 * Emit a JSONL event envelope on stdout.
 *
 * Format: `{"event":"atlas:indexing.<kind>","payload":{...}}\n`
 *
 * Only called when `--stream-events` is active. Callers that pass only `--json`
 * (or neither flag) never see this output.
 */
function emitStreamEvent(eventName, payload) {
  process.stdout.write(
    JSON.stringify({ event: eventName, payload }) + '\n',
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  let KBStore, applyMigrations, runAtlasIndexer, Database;

  try {
    ({ KBStore } = await importTs('intelligence/kb/store.ts'));
    ({ applyMigrations } = await importTs('intelligence/kb/migrations.ts'));
    ({ runAtlasIndexer } = await importTs('intelligence/atlas-indexer/runner.ts'));
    ({ default: Database } = await import('better-sqlite3'));
  } catch (err) {
    const msg = `atlas-index: failed to load modules: ${err.message}`;
    if (modeJson) {
      process.stdout.write(JSON.stringify({ ok: false, error: msg }) + '\n');
    } else {
      process.stderr.write(msg + '\n');
    }
    process.exit(1);
  }

  // ── resolve projectPath ────────────────────────────────────────────────────

  let projectPath = pathFlag ? resolve(pathFlag) : null;

  if (!projectPath) {
    // Try to resolve via KBStore registry
    const registryPath =
      registryFlag
        ? resolve(registryFlag)
        : join(homedir(), '.gsd', 'intelligence', 'registry.db');

    const store = new KBStore({ registryPath });
    try {
      await store.ensureRegistry();
      const project = await store.getProject(projectId);
      if (project?.path) {
        projectPath = project.path;
      }
    } catch {
      // Registry may not exist — that's fine if --path is provided or we fail below
    } finally {
      store.close();
    }
  }

  if (!projectPath) {
    const msg = `atlas-index: cannot resolve project path for "${projectId}". ` +
      'Either pass --path=<dir> or register the project in the KBStore registry first.';
    if (modeJson) {
      process.stdout.write(JSON.stringify({ ok: false, error: msg }) + '\n');
    } else {
      process.stderr.write(msg + '\n');
    }
    process.exit(1);
  }

  // ── open / migrate per-project DB ─────────────────────────────────────────

  let db;
  try {
    const migrationsDir = join(REPO_ROOT, 'src', 'intelligence', 'db', 'migrations');

    if (dbFlag) {
      // Explicit DB path override (useful for testing)
      const dbPath = resolve(dbFlag);
      mkdirSync(dirname(dbPath), { recursive: true });
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('busy_timeout = 5000');
      applyMigrations(db, migrationsDir);

      // Ensure projects row exists so FK constraints pass
      db.prepare(`
        INSERT OR IGNORE INTO projects (id, name, path, branch, kind, priority, last_activity_at, last_snapshot_id)
        VALUES (?, ?, ?, NULL, 'code', 'med', ?, NULL)
      `).run(projectId, projectId, projectPath, new Date().toISOString());
    } else {
      // Standard KBStore-managed path
      const store = new KBStore({
        registryPath: registryFlag ? resolve(registryFlag) : undefined,
      });
      await store.ensureRegistry();
      // Register project in case it doesn't exist yet (idempotent upsert)
      await store.registerProject({
        id: projectId,
        name: projectId,
        path: projectPath,
        kind: 'code',
        priority: 'med',
        last_activity_at: new Date().toISOString(),
      });
      await store.ensureProjectDB(projectId);
      db = await store.getProjectRawDB(projectId);
    }
  } catch (err) {
    const msg = `atlas-index: failed to open project DB: ${err.message}`;
    if (modeJson) {
      process.stdout.write(JSON.stringify({ ok: false, error: msg }) + '\n');
    } else {
      process.stderr.write(msg + '\n');
    }
    process.exit(1);
  }

  // ── run indexer ───────────────────────────────────────────────────────────

  // Emit started event before touching the DB so the UI can show a spinner.
  if (flagStreamEvents) {
    emitStreamEvent('atlas:indexing.started', { snapshot_id: snapshotId });
  } else if (!modeJson) {
    process.stdout.write(
      `atlas-index: indexing project "${projectId}"\n` +
      `  snapshot: ${snapshotId}\n` +
      `  path:     ${projectPath}\n` +
      (languages ? `  langs:    ${languages.join(', ')}\n` : '') +
      (flagReplace ? '  replace:  true\n' : '') +
      (flagProv ? '  provenance: true\n' : '') +
      '\n',
    );
  }

  let result;
  try {
    result = await runAtlasIndexer(db, {
      snapshotId,
      projectId,
      projectPath,
      languages: languages ?? undefined,
      replace: flagReplace,
      runProvenance: flagProv,
      onProgress: flagStreamEvents
        ? ({ filesDone, filesTotal }) => {
            emitStreamEvent('atlas:indexing.progress', {
              snapshot_id: snapshotId,
              files_done:  filesDone,
              files_total: filesTotal,
            });
          }
        : modeJson
          ? undefined
          : ({ filesDone, filesTotal }) => {
              process.stdout.write(`\r  progress: ${filesDone}/${filesTotal} files`);
            },
    });
  } catch (err) {
    const msg = `atlas-index: indexer failed: ${err.message}`;
    if (flagStreamEvents) {
      emitStreamEvent('atlas:indexing.failed', { snapshot_id: snapshotId, error: msg });
    } else if (modeJson) {
      process.stdout.write(JSON.stringify({ ok: false, error: msg }) + '\n');
    } else {
      process.stdout.write('\n');
      process.stderr.write(msg + '\n');
    }
    process.exit(1);
  }

  const totals = {
    files:           result.files,
    symbols:         result.symbols,
    calls:           result.calls,
    references:      result.references,
    provenanceLines: result.provenanceLines,
    durationMs:      result.durationMs,
  };

  if (flagStreamEvents) {
    emitStreamEvent('atlas:indexing.completed', {
      snapshot_id:   result.snapshotId ?? snapshotId,
      project_id:    projectId,
      symbols_count: totals.symbols,
      calls_count:   totals.calls,
      files_count:   totals.files,
    });
  } else if (modeJson) {
    process.stdout.write(JSON.stringify({ ok: true, snapshotId: result.snapshotId, totals }) + '\n');
  } else {
    process.stdout.write(
      '\natlas-index: done\n' +
      `  files:      ${totals.files}\n` +
      `  symbols:    ${totals.symbols}\n` +
      `  calls:      ${totals.calls}\n` +
      `  refs:       ${totals.references}\n` +
      `  provenance: ${totals.provenanceLines}\n` +
      `  duration:   ${totals.durationMs}ms\n`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  process.stderr.write(`atlas-index: unhandled error: ${err.message}\n`);
  process.exit(1);
});
