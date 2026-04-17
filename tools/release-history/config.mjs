// Config loader — reads release-history.config.json (committed defaults) and
// deep-merges release-history.local.json (gitignored overrides) if present.
//
// Usage:
//   import { loadConfig } from './config.mjs';
//   const cfg = loadConfig();
//   cfg.source_dir, cfg.db.driver, cfg.publish.targets, etc.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '..', '..');

const DEFAULT_CONFIG_PATH = join(REPO_ROOT, 'release-history.config.json');
const LOCAL_CONFIG_PATH = join(REPO_ROOT, 'release-history.local.json');

function deepMerge(base, override) {
  if (!override) return base;
  if (!base) return override;
  if (Array.isArray(override)) return override; // arrays replace, don't append
  if (typeof base !== 'object' || typeof override !== 'object') return override;
  const out = { ...base };
  for (const k of Object.keys(override)) {
    out[k] = deepMerge(base[k], override[k]);
  }
  return out;
}

let cached = null;

export function loadConfig(force = false) {
  if (cached && !force) return cached;

  if (!existsSync(DEFAULT_CONFIG_PATH)) {
    throw new Error(`Missing ${DEFAULT_CONFIG_PATH}. Run 'node tools/release-history/init.mjs' to scaffold one.`);
  }
  const base = JSON.parse(readFileSync(DEFAULT_CONFIG_PATH, 'utf8'));
  const local = existsSync(LOCAL_CONFIG_PATH)
    ? JSON.parse(readFileSync(LOCAL_CONFIG_PATH, 'utf8'))
    : null;
  const merged = deepMerge(base, local);

  // Absolute-ize paths relative to repo root
  const abs = (p) => p ? resolve(REPO_ROOT, p) : p;
  merged.source_dir_abs = abs(merged.source_dir);
  merged.index_file_abs = abs(merged.index_file);
  merged.roadmap_dir_abs = abs(merged.roadmap_dir);
  merged.cache_dir_abs = abs(merged.cache_dir);
  merged.mission_dir_abs = abs(merged.mission_dir);
  if (merged.db?.sqlite_path) merged.db.sqlite_path_abs = abs(merged.db.sqlite_path);

  merged.version_regex_compiled = new RegExp(merged.version_regex);

  cached = merged;
  return merged;
}

export function configPaths() {
  return {
    default: DEFAULT_CONFIG_PATH,
    local: LOCAL_CONFIG_PATH,
    repo_root: REPO_ROOT,
  };
}

// CLI preview: `node tools/release-history/config.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  const cfg = loadConfig();
  const preview = { ...cfg };
  delete preview.version_regex_compiled;
  console.log(JSON.stringify(preview, null, 2));
}
