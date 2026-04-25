#!/usr/bin/env node
// scripts/memory-migrate-half-life.mjs
//
// Adds half-life frontmatter (half_life, last_accessed, confidence) to memory
// files. Idempotent: re-running leaves correctly-stamped files untouched.
//
// Usage:
//   node scripts/memory-migrate-half-life.mjs --dir <path> [--write] [--default-half-life 1mo]
//
// Closes: OGA-024 (MEDIUM).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

export const HALF_LIFE_VALUES = /** @type {const} */ ([
  'infinite',
  '6mo',
  '1mo',
  '1wk',
  'transient',
]);

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Parse YAML-ish frontmatter (one-line `key: value` pairs only — sufficient
 * for the memory file format defined in docs/memory-schema.md).
 *
 * @param {string} text
 * @returns {{ frontmatter: Record<string, string>, body: string, hadFrontmatter: boolean }}
 */
export function parseFrontmatter(text) {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) {
    return { frontmatter: {}, body: text, hadFrontmatter: false };
  }
  /** @type {Record<string, string>} */
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) frontmatter[key] = value;
  }
  return {
    frontmatter,
    body: text.slice(match[0].length),
    hadFrontmatter: true,
  };
}

/**
 * Serialize frontmatter back to a markdown document.
 *
 * @param {Record<string, string>} frontmatter
 * @param {string} body
 * @returns {string}
 */
export function serializeFrontmatter(frontmatter, body) {
  const lines = Object.entries(frontmatter).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n${body}`;
}

/**
 * Try to obtain the most recent git commit timestamp for a path; falls back
 * to filesystem mtime; falls back to "now".
 *
 * @param {string} path
 * @returns {string}
 */
export function gitMtimeIso(path) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${path}"`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (out) return out;
  } catch {
    // git not available or path not tracked — fall through
  }
  try {
    const stat = statSync(path);
    return new Date(stat.mtimeMs).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

const DEFAULT_HALF_LIFE_BY_PREFIX = /** @type {Record<string, string>} */ ({
  feedback_: '6mo',
  user_: 'infinite',
  project_: '1mo',
});

/**
 * Pick a default half-life for a file based on filename prefix.
 *
 * @param {string} basename
 * @param {string} fallback
 * @returns {string}
 */
export function pickDefaultHalfLife(basename, fallback = '1mo') {
  for (const [prefix, hl] of Object.entries(DEFAULT_HALF_LIFE_BY_PREFIX)) {
    if (basename.startsWith(prefix)) return hl;
  }
  return fallback;
}

/**
 * Apply the half-life migration to a single in-memory document. Pure — no
 * filesystem I/O. Returns the rewritten document and a per-file change report.
 *
 * @param {object} args
 * @param {string} args.text
 * @param {string} args.basename
 * @param {string} args.lastAccessedIso
 * @param {string} [args.defaultHalfLife]
 * @returns {{ text: string, changed: boolean, added: string[] }}
 */
export function migrateDocument({ text, basename, lastAccessedIso, defaultHalfLife = '1mo' }) {
  const { frontmatter, body, hadFrontmatter } = parseFrontmatter(text);
  /** @type {string[]} */
  const added = [];
  const next = { ...frontmatter };

  if (!('half_life' in next)) {
    next.half_life = pickDefaultHalfLife(basename, defaultHalfLife);
    added.push('half_life');
  }
  if (!('last_accessed' in next)) {
    next.last_accessed = lastAccessedIso;
    added.push('last_accessed');
  }
  if (!('confidence' in next)) {
    next.confidence = '0.95';
    added.push('confidence');
  }

  if (added.length === 0 && hadFrontmatter) {
    return { text, changed: false, added };
  }

  return {
    text: serializeFrontmatter(next, body),
    changed: added.length > 0,
    added,
  };
}

/**
 * Walk a directory and return absolute paths of `.md` files (one level deep
 * + recursive).
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function listMarkdown(dir) {
  /** @type {string[]} */
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listMarkdown(p));
    else if (e.isFile() && p.endsWith('.md')) out.push(p);
  }
  return out;
}

/**
 * Run the migration over a directory.
 *
 * @param {object} args
 * @param {string} args.dir
 * @param {boolean} [args.write]
 * @param {string} [args.defaultHalfLife]
 * @returns {{ scanned: number, changed: number, files: Array<{ path: string, added: string[] }> }}
 */
export function migrateDirectory({ dir, write = false, defaultHalfLife = '1mo' }) {
  const files = listMarkdown(dir);
  /** @type {Array<{ path: string, added: string[] }>} */
  const report = [];
  let changed = 0;
  for (const path of files) {
    const text = readFileSync(path, 'utf-8');
    const basename = path.split('/').pop() ?? path;
    const lastAccessedIso = gitMtimeIso(path);
    const result = migrateDocument({
      text,
      basename,
      lastAccessedIso,
      defaultHalfLife,
    });
    if (result.changed) {
      changed++;
      report.push({ path, added: result.added });
      if (write) writeFileSync(path, result.text, 'utf-8');
    }
  }
  return { scanned: files.length, changed, files: report };
}

// CLI entrypoint guard — only runs when invoked directly.
const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${resolve(process.argv[1])}`;

if (invokedDirectly) {
  const args = process.argv.slice(2);
  let dir = '';
  let write = false;
  let defaultHalfLife = '1mo';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir') dir = args[++i];
    else if (a === '--write') write = true;
    else if (a === '--default-half-life') defaultHalfLife = args[++i];
    else if (a === '--help' || a === '-h') {
      // eslint-disable-next-line no-console
      console.log(
        'Usage: memory-migrate-half-life.mjs --dir <path> [--write] [--default-half-life 1mo]',
      );
      process.exit(0);
    }
  }
  if (!dir) {
    // eslint-disable-next-line no-console
    console.error('error: --dir <path> is required');
    process.exit(2);
  }
  const report = migrateDirectory({ dir, write, defaultHalfLife });
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        scanned: report.scanned,
        changed: report.changed,
        write,
        files: report.files,
      },
      null,
      2,
    ),
  );
}
