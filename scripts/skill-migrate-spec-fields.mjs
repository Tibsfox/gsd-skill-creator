#!/usr/bin/env node
// scripts/skill-migrate-spec-fields.mjs
//
// Bring SKILL.md frontmatter onto the agentskills.io 2025-10-02 spec:
//   - version: 1.0.0
//   - format: 2025-10-02
//   - triggers: [...] (derived from description text if absent)
//   - status: ACTIVE (DRAFT | ACTIVE | DEPRECATED | RETIRED | ARCHIVED)
//   - updated: <ISO date>  (set when missing only; preserves existing values)
//
// Idempotent. Preserves existing frontmatter formatting (block scalars,
// folded scalars) by appending missing keys before the closing `---` rather
// than reserialising the whole block.
//
// Usage:
//   node scripts/skill-migrate-spec-fields.mjs --dir <path> [--write]
//                                              [--default-status ACTIVE]
//                                              [--add-status-only]
//
// Closes: OGA-032 (MEDIUM) + OGA-033 (MEDIUM).

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, basename as pbasename } from 'node:path';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export const VALID_STATUSES = /** @type {const} */ ([
  'DRAFT',
  'ACTIVE',
  'DEPRECATED',
  'RETIRED',
  'ARCHIVED',
]);

export const SPEC_FORMAT = '2025-10-02';
export const SPEC_VERSION = '1.0.0';

/**
 * Split a SKILL.md document into frontmatter raw text + body.
 *
 * @param {string} text
 * @returns {{ raw: string, body: string, hadFrontmatter: boolean }}
 */
export function splitFrontmatter(text) {
  const match = FRONTMATTER_RE.exec(text);
  if (!match) {
    return { raw: '', body: text, hadFrontmatter: false };
  }
  return {
    raw: match[1],
    body: text.slice(match[0].length),
    hadFrontmatter: true,
  };
}

/**
 * Heuristic check: does the raw frontmatter declare the given top-level key?
 * Matches lines that start with `<key>:` (no leading whitespace).
 *
 * @param {string} raw
 * @param {string} key
 * @returns {boolean}
 */
export function hasKey(raw, key) {
  const re = new RegExp(`^${key}\\s*:`, 'm');
  return re.test(raw);
}

/**
 * Pull the description value (single line, folded `>`, or block `|`) out of the
 * raw frontmatter. Returns the joined description text or empty string.
 *
 * @param {string} raw
 * @returns {string}
 */
export function extractDescription(raw) {
  const lines = raw.split('\n');
  let i = 0;
  for (; i < lines.length; i++) {
    if (/^description\s*:/.test(lines[i])) break;
  }
  if (i >= lines.length) return '';
  const head = lines[i].replace(/^description\s*:\s*/, '');
  // Single-line value (possibly quoted).
  if (head && head !== '>' && head !== '|') {
    return head.replace(/^["']|["']$/g, '').trim();
  }
  // Block scalar — collect indented continuation lines.
  const collected = [];
  for (let j = i + 1; j < lines.length; j++) {
    const ln = lines[j];
    if (/^\S/.test(ln)) break; // hit next top-level key
    collected.push(ln.trim());
  }
  return collected.filter(Boolean).join(' ').trim();
}

/**
 * Derive trigger phrases from a description string. Looks for "Use when X",
 * "Use this skill when/whenever X", "Triggers include X", "Activates when X",
 * "trigger: X", and verb-leading clauses after "or".
 *
 * Returns at most 5 trigger phrases. Always returns a non-empty list — falls
 * back to the first sentence of the description if no explicit trigger phrase
 * is found.
 *
 * @param {string} description
 * @returns {string[]}
 */
export function deriveTriggers(description) {
  if (!description) return ['skill-specific activation context'];
  /** @type {string[]} */
  const triggers = [];
  const text = description.replace(/\s+/g, ' ').trim();

  // "Use [this skill] when[ever] X"
  const useWhen = /Use(?: this skill)?\s+when(?:ever)?\s+([^.]+?)(?:[.;]|$)/gi;
  let m;
  while ((m = useWhen.exec(text)) !== null && triggers.length < 5) {
    triggers.push(m[1].trim().replace(/^[,]+|[,]+$/g, ''));
  }

  // "Activates when X" / "Trigger[s]: X"
  const activates = /(?:Activates?|Triggers?)(?:\s+include[s]?)?(?:\s+when)?\s*[:]?\s*([^.]+?)(?:[.;]|$)/gi;
  while ((m = activates.exec(text)) !== null && triggers.length < 5) {
    const candidate = m[1].trim();
    if (candidate.length > 4) triggers.push(candidate);
  }

  if (triggers.length === 0) {
    // Fallback: first sentence of description.
    const firstSentence = text.split(/[.;]/)[0]?.trim();
    if (firstSentence) triggers.push(firstSentence);
    else triggers.push('skill-specific activation context');
  }

  // Normalize: collapse whitespace, cap length, dedupe.
  const seen = new Set();
  /** @type {string[]} */
  const out = [];
  for (const t of triggers) {
    const norm = t.replace(/\s+/g, ' ').slice(0, 160).trim();
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(norm);
    if (out.length >= 5) break;
  }
  return out;
}

/**
 * Normalize a legacy lowercase status (`active`, `draft`) to the canonical
 * uppercase form. Unknown values pass through unchanged so the validator can
 * flag them.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeStatus(value) {
  if (!value) return value;
  const upper = value.trim().toUpperCase();
  return VALID_STATUSES.includes(/** @type {any} */ (upper)) ? upper : value.trim();
}

/**
 * Produce an updated frontmatter raw block with missing spec fields appended
 * just before the closing `---`. Existing fields are not touched, except that
 * a lowercase `status: active` is upgraded to canonical `ACTIVE`.
 *
 * @param {object} args
 * @param {string} args.raw
 * @param {string} [args.defaultStatus]
 * @param {string} [args.lastUpdatedIso]
 * @param {boolean} [args.addStatusOnly]   skip version/format/triggers (for OGA-033 dry-pass)
 * @param {boolean} [args.skipStatus]      skip status (for OGA-032 dry-pass)
 * @returns {{ raw: string, added: string[], normalized: string[] }}
 */
export function migrateFrontmatter({
  raw,
  defaultStatus = 'ACTIVE',
  lastUpdatedIso,
  addStatusOnly = false,
  skipStatus = false,
}) {
  /** @type {string[]} */
  const added = [];
  /** @type {string[]} */
  const normalized = [];
  let next = raw;

  const description = extractDescription(raw);

  // Normalize legacy status: active -> ACTIVE. Part of OGA-033 (status field
  // canonicalisation), gated by --skipStatus so the OGA-032 dry-pass leaves
  // legacy lowercase values untouched.
  if (!skipStatus) {
    next = next.replace(/^(status\s*:\s*)([^\n]+)$/m, (whole, prefix, value) => {
      const norm = normalizeStatus(value);
      if (norm !== value.trim()) {
        normalized.push(`status: ${value.trim()} -> ${norm}`);
        return `${prefix}${norm}`;
      }
      return whole;
    });
  }

  /** @type {Array<[string, string]>} */
  const additions = [];

  if (!addStatusOnly) {
    if (!hasKey(next, 'version')) additions.push(['version', SPEC_VERSION]);
    if (!hasKey(next, 'format')) additions.push(['format', SPEC_FORMAT]);
    if (!hasKey(next, 'triggers')) {
      const triggers = deriveTriggers(description);
      const yamlList = triggers.map((t) => `  - ${escapeYamlScalar(t)}`).join('\n');
      additions.push(['triggers', `\n${yamlList}`]);
    }
  }

  if (!skipStatus && !hasKey(next, 'status')) {
    additions.push(['status', defaultStatus]);
  }

  if (!hasKey(next, 'updated') && !hasKey(next, 'last_updated') && lastUpdatedIso) {
    // Use existing convention: bare `updated:` field.
    additions.push(['updated', lastUpdatedIso]);
  }

  if (additions.length === 0 && normalized.length === 0) {
    return { raw, added: [], normalized: [] };
  }

  for (const [k, v] of additions) {
    if (v.startsWith('\n')) {
      // Block (list) value.
      next = `${next}\n${k}:${v}`;
    } else {
      next = `${next}\n${k}: ${v}`;
    }
    added.push(k);
  }

  return { raw: next, added, normalized };
}

/**
 * Quote a YAML scalar if it contains characters that would otherwise need
 * escaping. Conservative — quote when in doubt.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeYamlScalar(value) {
  if (/^[A-Za-z0-9_\-./ ()'?]+$/.test(value) && !/^[?:&*!|>%@`]/.test(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Apply migration to a single in-memory document.
 *
 * @param {object} args
 * @param {string} args.text
 * @param {string} [args.defaultStatus]
 * @param {string} [args.lastUpdatedIso]
 * @param {boolean} [args.addStatusOnly]
 * @param {boolean} [args.skipStatus]
 * @returns {{ text: string, changed: boolean, added: string[], normalized: string[] }}
 */
export function migrateDocument({
  text,
  defaultStatus = 'ACTIVE',
  lastUpdatedIso,
  addStatusOnly = false,
  skipStatus = false,
}) {
  const { raw, body, hadFrontmatter } = splitFrontmatter(text);
  if (!hadFrontmatter) {
    return { text, changed: false, added: [], normalized: [] };
  }
  const result = migrateFrontmatter({
    raw,
    defaultStatus,
    lastUpdatedIso,
    addStatusOnly,
    skipStatus,
  });
  if (result.added.length === 0 && result.normalized.length === 0) {
    return { text, changed: false, added: [], normalized: [] };
  }
  const next = `---\n${result.raw}\n---\n${body}`;
  return { text: next, changed: true, added: result.added, normalized: result.normalized };
}

/**
 * Walk a directory and return absolute paths of SKILL.md files.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function listSkillFiles(dir) {
  /** @type {string[]} */
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...listSkillFiles(p));
    } else if (e.isFile() && pbasename(p) === 'SKILL.md') {
      out.push(p);
    }
  }
  return out;
}

/**
 * Run the migration over a directory of skill bundles.
 *
 * @param {object} args
 * @param {string} args.dir
 * @param {boolean} [args.write]
 * @param {string} [args.defaultStatus]
 * @param {string} [args.lastUpdatedIso]
 * @param {boolean} [args.addStatusOnly]
 * @param {boolean} [args.skipStatus]
 * @returns {{ scanned: number, changed: number, files: Array<{ path: string, added: string[], normalized: string[] }> }}
 */
export function migrateDirectory({
  dir,
  write = false,
  defaultStatus = 'ACTIVE',
  lastUpdatedIso,
  addStatusOnly = false,
  skipStatus = false,
}) {
  const stamp = lastUpdatedIso ?? new Date().toISOString().slice(0, 10);
  const files = listSkillFiles(dir);
  /** @type {Array<{ path: string, added: string[], normalized: string[] }>} */
  const report = [];
  let changed = 0;
  for (const path of files) {
    const text = readFileSync(path, 'utf-8');
    const result = migrateDocument({
      text,
      defaultStatus,
      lastUpdatedIso: stamp,
      addStatusOnly,
      skipStatus,
    });
    if (result.changed) {
      changed++;
      report.push({ path, added: result.added, normalized: result.normalized });
      if (write) writeFileSync(path, result.text, 'utf-8');
    }
  }
  return { scanned: files.length, changed, files: report };
}

// CLI entrypoint guard.
const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  import.meta.url === `file://${resolve(process.argv[1])}`;

if (invokedDirectly) {
  const args = process.argv.slice(2);
  let dir = '';
  let write = false;
  let defaultStatus = 'ACTIVE';
  let addStatusOnly = false;
  let skipStatus = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dir') dir = args[++i];
    else if (a === '--write') write = true;
    else if (a === '--default-status') defaultStatus = args[++i];
    else if (a === '--add-status-only') addStatusOnly = true;
    else if (a === '--skip-status') skipStatus = true;
    else if (a === '--help' || a === '-h') {
      // eslint-disable-next-line no-console
      console.log(
        'Usage: skill-migrate-spec-fields.mjs --dir <path> [--write] [--default-status ACTIVE] [--add-status-only] [--skip-status]',
      );
      process.exit(0);
    }
  }
  if (!dir) {
    // eslint-disable-next-line no-console
    console.error('error: --dir <path> is required');
    process.exit(2);
  }
  const report = migrateDirectory({ dir, write, defaultStatus, addStatusOnly, skipStatus });
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
