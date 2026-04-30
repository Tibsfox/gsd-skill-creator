#!/usr/bin/env node
// rh init — bootstrap the release-history feature in any repo.
//
// Detects release-notes directory, creates config files if missing, applies
// schema to the chosen DB driver, runs a baseline scan, optionally installs
// the post-commit hook.
//
// Safe to re-run; every step is idempotent.
//
// Flags:
//   --driver=sqlite|postgres  (default: sqlite)
//   --source-dir <path>       (default: detected; see DETECT_PATHS below)
//   --yes                     skip confirmation, assume detected defaults
//   --no-hook                 skip post-commit hook install
//   --dry-run                 print what would happen, no changes
//   --force                   overwrite existing config files

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, symlinkSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const CONFIG_PATH = join(REPO_ROOT, 'release-history.config.json');
const LOCAL_CONFIG_PATH = join(REPO_ROOT, 'release-history.local.json');
const LOCAL_EXAMPLE = join(REPO_ROOT, 'release-history.local.json.example');
const GITIGNORE = join(REPO_ROOT, '.gitignore');
const HOOK_SRC = join(HERE, 'hooks', 'post-commit.sh');
const HOOK_DST = join(REPO_ROOT, '.git', 'hooks', 'post-commit');

// Candidate release-notes locations — first match wins.
const DETECT_PATHS = [
  'docs/release-notes',
  'docs/releases',
  'CHANGELOG.d',
  'changelog',
  'release-notes',
];

// Candidate index file locations.
const DETECT_INDEXES = [
  'docs/RELEASE-HISTORY.md',
  'docs/CHANGELOG.md',
  'CHANGELOG.md',
  'docs/releases/index.md',
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const arg = (name, fallback = null) => {
  const i = args.indexOf(name);
  if (i >= 0) return args[i + 1];
  const eq = args.find(a => a.startsWith(name + '='));
  return eq ? eq.slice(name.length + 1) : fallback;
};

const DRY = flag('--dry-run');
const YES = flag('--yes');
const FORCE = flag('--force');
const NO_HOOK = flag('--no-hook');
const DRIVER = arg('--driver', null);
const SOURCE_DIR_ARG = arg('--source-dir', null);

function say(msg) { console.error(msg); }
function done(k, v) { say(`  ✓ ${k.padEnd(22)} ${v}`); }
function skip(k, v) { say(`  — ${k.padEnd(22)} ${v}`); }
function warn(k, v) { say(`  ⚠ ${k.padEnd(22)} ${v}`); }

function detectSourceDir() {
  if (SOURCE_DIR_ARG) return SOURCE_DIR_ARG;
  for (const p of DETECT_PATHS) {
    if (existsSync(join(REPO_ROOT, p))) return p;
  }
  return DETECT_PATHS[0]; // default even if not present
}

function detectIndexFile() {
  for (const p of DETECT_INDEXES) {
    if (existsSync(join(REPO_ROOT, p))) return p;
  }
  return DETECT_INDEXES[0];
}

function detectDriver() {
  if (DRIVER) return DRIVER;
  // Sniff env for a Postgres URL — if present, default to postgres
  if (process.env.RH_POSTGRES_URL || process.env.DATABASE_URL) return 'postgres';
  return 'sqlite';
}

function ensureConfig({ sourceDir, indexFile, driver }) {
  if (existsSync(CONFIG_PATH) && !FORCE) {
    skip('config', `${relative(REPO_ROOT, CONFIG_PATH)} already exists (use --force to overwrite)`);
    return;
  }
  const config = {
    $schema: './tools/release-history/config.schema.json',
    _comment: 'Release History — generic defaults. Overrides in release-history.local.json (gitignored).',
    source_dir: sourceDir,
    index_file: indexFile,
    roadmap_dir: '.planning/roadmap',
    cache_dir: '.planning/release-cache',
    mission_dir: '.planning/missions/release-history-tracking',
    db: {
      driver,
      sqlite_path: '.planning/release-history.db',
      postgres_url_env: 'RH_POSTGRES_URL',
      postgres_schema: 'release_history',
    },
    version_regex: '^v(\\d+)\\.(\\d+)(?:\\.(\\d+))?(?:\\.\\d+)?(?:-(.+))?$',
    publish: {
      enabled: true,
      allowlist: [
        '00-summary.md', '01-features.md', '02-metrics.md',
        '03-retrospective.md', '04-lessons.md', '99-context.md',
      ],
      allowlist_prefix_regex: '^(00|01|02|03|04|99)[a-z]?-',
      toplevel_allowlist: ['STORY.md', 'INDEX.md'],
      targets: [
        {
          name: 'github',
          kind: 'local_copy',
          dest: `${sourceDir}/{version}/chapter/{file}`,
          description: 'Mirror chapters into the repo\'s own release-notes tree.',
        },
      ],
    },
    leak_scan_patterns: [
      // Truly-private path prefixes that must never appear in published release notes.
      // Fox Companies IP per HARD RULE; agent-memory is teammate-scoped private retros.
      // HANDOFF / memory / missions / intel are CONVENTION refs in retros (storytelling
      // about project methodology); the actual file content is gitignored, so mentioning
      // these paths in published chapters is explanatory, not leakage. v1.49.588 T2.2.
      '\\.planning/(?:fox-companies|agent-memory)/',
    ],
    ghosts: [],
    classifier: {
      distinctive_keyword_min_length: 6,
      max_lookahead_releases: 100,
      rule_threshold: {
        min_distinctive_hits: 2,
        min_total_hits_with_one_distinctive: 3,
      },
    },
    llm_tiebreaker: {
      enabled: true,
      cli_command: 'claude',
      cli_args: ['-p', '{prompt}', '--output-format', 'text'],
      batch_size: 5,
      timeout_ms: 180000,
    },
  };
  if (DRY) { skip('config', 'would write'); return; }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  done('config', `wrote ${relative(REPO_ROOT, CONFIG_PATH)}`);
}

function ensureLocalExample() {
  if (existsSync(LOCAL_EXAMPLE) && !FORCE) {
    skip('local.example', 'exists');
    return;
  }
  const example = {
    $schema: './tools/release-history/config.schema.json',
    _comment: 'Copy to release-history.local.json (gitignored) and customize.',
    db: { driver: 'postgres', postgres_url_env: 'RH_POSTGRES_URL' },
    publish: {
      targets: [
        { name: 'github',  kind: 'local_copy', dest: 'docs/release-notes/{version}/chapter/{file}' },
        { name: 'website', kind: 'local_copy', dest: 'www/example.com/release-story/{version}/{file}' },
      ],
    },
    leak_scan_patterns: ['your-company-name'],
    ghosts: [],
  };
  if (DRY) { skip('local.example', 'would write'); return; }
  writeFileSync(LOCAL_EXAMPLE, JSON.stringify(example, null, 2) + '\n');
  done('local.example', `wrote ${relative(REPO_ROOT, LOCAL_EXAMPLE)}`);
}

function ensureGitignore() {
  const lines = existsSync(GITIGNORE) ? readFileSync(GITIGNORE, 'utf8').split(/\r?\n/) : [];
  const needed = ['release-history.local.json', '.planning/release-history.db'];
  const missing = needed.filter(n => !lines.includes(n));
  if (missing.length === 0) { skip('.gitignore', 'already has entries'); return; }
  if (DRY) { skip('.gitignore', `would add: ${missing.join(', ')}`); return; }
  const updated = [...lines, '', '# release-history feature', ...missing].join('\n');
  writeFileSync(GITIGNORE, updated);
  done('.gitignore', `added: ${missing.join(', ')}`);
}

async function ensureSchema(driver) {
  if (DRY) { skip('schema', `would apply 001-init.${driver}.sql`); return; }
  const migration = join(REPO_ROOT, 'migrations', 'release-history', `001-init.${driver}.sql`);
  if (!existsSync(migration)) {
    warn('schema', `migration missing: ${migration}`);
    return;
  }

  if (driver === 'sqlite') {
    // Adapter auto-applies on first open; just poke it
    const { loadConfig } = await import('./config.mjs');
    const { openDb } = await import('./db.mjs');
    const cfg = loadConfig(true);
    const dir = dirname(cfg.db.sqlite_path_abs);
    mkdirSync(dir, { recursive: true });
    const db = await openDb(cfg);
    await db.close();
    done('schema', `sqlite schema ready at ${relative(REPO_ROOT, cfg.db.sqlite_path_abs)}`);
    return;
  }

  if (driver === 'postgres') {
    const envUrl = process.env.RH_POSTGRES_URL || process.env.DATABASE_URL;
    if (!envUrl && !process.env.PGHOST && !process.env.PG_HOST) {
      warn('schema', 'Postgres credentials not set. Run: psql $RH_POSTGRES_URL -f ' + relative(REPO_ROOT, migration));
      return;
    }
    const r = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '-f', migration], {
      encoding: 'utf8', env: process.env,
    });
    if (r.status === 0) {
      done('schema', `postgres schema applied`);
    } else {
      warn('schema', `psql exit ${r.status}: ${r.stderr?.slice(0, 300)}`);
    }
  }
}

function ensureHook() {
  if (NO_HOOK) { skip('hook', '--no-hook'); return; }
  if (!existsSync(join(REPO_ROOT, '.git'))) { skip('hook', 'not a git repo'); return; }
  if (existsSync(HOOK_DST)) { skip('hook', 'post-commit hook already exists'); return; }
  if (DRY) { skip('hook', `would symlink ${HOOK_DST} → ${HOOK_SRC}`); return; }
  try {
    mkdirSync(dirname(HOOK_DST), { recursive: true });
    const rel = relative(dirname(HOOK_DST), HOOK_SRC);
    symlinkSync(rel, HOOK_DST);
    done('hook', 'installed .git/hooks/post-commit');
  } catch (e) {
    warn('hook', e.message);
  }
}

async function runBaselineScan() {
  if (DRY) { skip('baseline', 'would run scan.mjs'); return; }
  const r = spawnSync('node', [join(HERE, 'scan.mjs')], { encoding: 'utf8', env: process.env });
  const out = r.stdout?.trim() || '';
  if (r.status === 0 || r.status === 2) {
    try {
      const parsed = JSON.parse(out);
      done('baseline', `fs=${parsed.fs_count} table=${parsed.table_count} drift=${parsed.drift_count}`);
    } catch {
      done('baseline', 'scan completed');
    }
  } else {
    warn('baseline', `scan exit ${r.status}`);
  }
}

async function main() {
  say('');
  say('=== Release History — init ===');
  say('');

  const sourceDir = detectSourceDir();
  const indexFile = detectIndexFile();
  const driver = detectDriver();

  say('Detected:');
  say(`  source_dir : ${sourceDir}${existsSync(join(REPO_ROOT, sourceDir)) ? ' (exists)' : ' (will be created)'}`);
  say(`  index_file : ${indexFile}${existsSync(join(REPO_ROOT, indexFile)) ? ' (exists)' : ' (will be created later)'}`);
  say(`  db driver  : ${driver}`);
  say('');

  if (!YES && !DRY) {
    say('Pass --yes to accept these defaults, or override with --source-dir / --driver. Continuing with defaults…');
    say('');
  }

  say('Steps:');
  ensureConfig({ sourceDir, indexFile, driver });
  ensureLocalExample();
  ensureGitignore();
  await ensureSchema(driver);
  ensureHook();
  await runBaselineScan();

  say('');
  say('Next:');
  say('  1. Edit release-history.local.json to customize publish targets and leak patterns.');
  say('  2. Run: node tools/release-history/refresh.mjs --fast');
  say('  3. Read: tools/release-history/README.md for the full command reference.');
  say('');

  if (DRY) say('(dry-run — no changes made)');
}

main().catch(e => { console.error('[init] fatal:', e.message); process.exit(2); });
