#!/usr/bin/env node
// scripts/memory-migrate-taxonomy.mjs
//
// Adds a `type:` frontmatter field to memory files using the 9-type taxonomy
// (per OOPS-05-P04). Classification is heuristic: filename prefix wins,
// then body markers, then a sane default. Existing `type:` values are
// preserved (manual override always wins).
//
// Usage:
//   node scripts/memory-migrate-taxonomy.mjs --dir <path> [--write]
//
// Closes: OGA-025 (MEDIUM).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  parseFrontmatter,
  serializeFrontmatter,
} from './memory-migrate-half-life.mjs';

export const TAXONOMY = /** @type {const} */ ([
  'project',
  'feedback',
  'decision',
  'reference',
  'user',
  'pinned-rule',
  'observation',
  'tactic',
  'question',
]);

const PREFIX_MAP = /** @type {Array<[string, string]>} */ ([
  ['project_', 'project'],
  ['feedback_', 'feedback'],
  ['decision_', 'decision'],
  ['reference_', 'reference'],
  ['user_', 'user'],
  ['pinned_', 'pinned-rule'],
  ['observation_', 'observation'],
  ['tactic_', 'tactic'],
  ['question_', 'question'],
]);

/**
 * Detect a pinned-rule signal in body text.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function looksLikePinnedRule(text) {
  const upper = text.toUpperCase();
  if (upper.includes('STANDING RULE')) return true;
  if (upper.includes('STANDING-RULE')) return true;
  if (upper.includes('HARD RULE')) return true;
  if (/\bABSOLUTE\b/.test(upper) && /\bNEVER\b|\bALWAYS\b/.test(upper)) return true;
  if (text.includes('<!-- STANDING-RULE -->')) return true;
  return false;
}

/**
 * Heuristic body classifier. Used only when prefix + frontmatter give no
 * signal.
 *
 * @param {string} text
 * @returns {string}
 */
export function classifyByBody(text) {
  if (looksLikePinnedRule(text)) return 'pinned-rule';
  const lower = text.toLowerCase();
  if (/^\s*(?:#+\s*)?question[:\s]/m.test(lower)) return 'question';
  if (/\bbenchmark\b|\bobserved\b|\bmeasured\b/.test(lower)) return 'observation';
  if (/\bdecided\b|\bwe\s+chose\b|\brationale\b/.test(lower)) return 'decision';
  if (/\brecipe\b|\bcommand\b|\busage\b|```/.test(lower)) return 'tactic';
  return 'project';
}

/**
 * Pick a type for a single file based on (in order):
 *   1. Existing `type:` frontmatter — preserved verbatim if it's a valid
 *      taxonomy member.
 *   2. Filename prefix — `feedback_*` → feedback, etc.
 *   3. Body heuristic.
 *
 * @param {object} args
 * @param {string} args.basename
 * @param {Record<string, string>} args.frontmatter
 * @param {string} args.body
 * @returns {{ type: string, source: 'preserved' | 'prefix' | 'body' }}
 */
export function classify({ basename, frontmatter, body }) {
  const existing = frontmatter.type;
  if (existing && /** @type {readonly string[]} */ (TAXONOMY).includes(existing)) {
    return { type: existing, source: 'preserved' };
  }
  for (const [prefix, type] of PREFIX_MAP) {
    if (basename.startsWith(prefix)) return { type, source: 'prefix' };
  }
  return { type: classifyByBody(body), source: 'body' };
}

/**
 * Apply the taxonomy migration to a single in-memory document. Pure.
 *
 * @param {object} args
 * @param {string} args.text
 * @param {string} args.basename
 * @returns {{ text: string, changed: boolean, type: string, source: string }}
 */
export function migrateDocument({ text, basename }) {
  const { frontmatter, body } = parseFrontmatter(text);
  const { type, source } = classify({ basename, frontmatter, body });
  if (frontmatter.type === type) {
    return { text, changed: false, type, source };
  }
  const next = { ...frontmatter, type };
  return {
    text: serializeFrontmatter(next, body),
    changed: true,
    type,
    source,
  };
}

/**
 * Walk a directory and return absolute paths of `.md` files (recursive).
 *
 * @param {string} dir
 * @returns {string[]}
 */
function listMarkdown(dir) {
  /** @type {string[]} */
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
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
 * @returns {{ scanned: number, changed: number, byType: Record<string, number>, files: Array<{ path: string, type: string, source: string }> }}
 */
export function migrateDirectory({ dir, write = false }) {
  const files = listMarkdown(dir);
  /** @type {Array<{ path: string, type: string, source: string }>} */
  const report = [];
  /** @type {Record<string, number>} */
  const byType = {};
  let changed = 0;
  for (const path of files) {
    const text = readFileSync(path, 'utf-8');
    const basename = path.split('/').pop() ?? path;
    const result = migrateDocument({ text, basename });
    byType[result.type] = (byType[result.type] ?? 0) + 1;
    if (result.changed) {
      changed++;
      if (write) writeFileSync(path, result.text, 'utf-8');
    }
    report.push({ path, type: result.type, source: result.source });
  }
  return { scanned: files.length, changed, byType, files: report };
}

const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${resolve(process.argv[1])}`;

if (invokedDirectly) {
  const args = process.argv.slice(2);
  let dir = '';
  let write = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir') dir = args[++i];
    else if (a === '--write') write = true;
    else if (a === '--help' || a === '-h') {
      // eslint-disable-next-line no-console
      console.log('Usage: memory-migrate-taxonomy.mjs --dir <path> [--write]');
      process.exit(0);
    }
  }
  if (!dir) {
    // eslint-disable-next-line no-console
    console.error('error: --dir <path> is required');
    process.exit(2);
  }
  const report = migrateDirectory({ dir, write });
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      { scanned: report.scanned, changed: report.changed, write, byType: report.byType },
      null,
      2,
    ),
  );
}
