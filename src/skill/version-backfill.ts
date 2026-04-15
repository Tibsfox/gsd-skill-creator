/**
 * Version backfill — one-shot migration for .claude/skills/* / SKILL.md.
 *
 * Walks every SKILL.md, inserts missing frontmatter fields
 * (format, version, status, updated) without overwriting existing values.
 * `updated` is sourced from git last-modified date; falls back to today
 * for untracked/new files.
 *
 * Usage:
 *   tsx src/skill/version-backfill.ts           # dry-run (default)
 *   tsx src/skill/version-backfill.ts --write   # apply changes
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SKILL_FORMAT_DATE, type SkillStatus } from './frontmatter-types.js';

const DEFAULT_VERSION = '1.0.0';
const DEFAULT_STATUS: SkillStatus = 'active';

export interface BackfillDiff {
  skill: string;
  changed: boolean;
  added: string[];
}

export interface RawFrontmatter {
  format?: string;
  version?: string;
  status?: SkillStatus;
  updated?: string;
  [key: string]: unknown;
}

interface ParsedFile {
  frontmatter: RawFrontmatter;
  frontmatterText: string;
  body: string;
  hasFrontmatter: boolean;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Hand-rolled top-level key scanner — tolerant of unquoted colons inside values
 * (which are common in our skill descriptions, e.g. "/gsd: commands").
 *
 * Only extracts top-level scalar keys matching `^<key>:` at column 0. Nested
 * maps and multi-line scalars are not parsed — they simply remain unread,
 * which is fine because the backfill only cares about four specific top-level
 * keys (format, version, status, updated).
 */
const TOP_LEVEL_KEY_RE = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/;

function extractTopLevelKeys(raw: string): RawFrontmatter {
  const out: RawFrontmatter = {};
  for (const line of raw.split(/\r?\n/)) {
    // Only top-level keys (column 0, no leading whitespace)
    if (/^\s/.test(line)) continue;
    const m = line.match(TOP_LEVEL_KEY_RE);
    if (!m) continue;
    const key = m[1];
    let value: string = m[2] ?? '';
    // Strip matched surrounding quotes
    value = value.replace(/^"(.*)"\s*$/, '$1').replace(/^'(.*)'\s*$/, '$1');
    out[key] = value;
  }
  return out;
}

export function parseFrontmatter(content: string): ParsedFile {
  const m = content.match(FRONTMATTER_RE);
  if (!m) {
    return { frontmatter: {}, frontmatterText: '', body: content, hasFrontmatter: false };
  }
  const raw = m[1];
  const body = m[2];
  const parsed = extractTopLevelKeys(raw);
  return { frontmatter: parsed, frontmatterText: raw, body, hasFrontmatter: true };
}

export function gitLastModifiedDate(path: string): string | null {
  try {
    const out = execSync(`git log -1 --format=%ai -- ${JSON.stringify(path)}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return null;
    const datePart = out.split(' ')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    return datePart;
  } catch {
    return null;
  }
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Serialize frontmatter preserving existing field ORDER for fields already
 * present, and appending newly-inserted fields after the last existing field.
 * This keeps diffs minimal and review-friendly.
 */
export function mergeFrontmatter(
  existingText: string,
  additions: Record<string, string>
): string {
  const existingLines = existingText.split(/\r?\n/);
  const appended: string[] = [];
  for (const [key, value] of Object.entries(additions)) {
    appended.push(`${key}: ${value}`);
  }
  if (appended.length === 0) return existingText;
  return [...existingLines, ...appended].join('\n');
}

export interface BackfillResult extends BackfillDiff {
  before: string;
  after: string;
}

export function backfillSkillContent(
  content: string,
  skillPath: string,
  now: () => string = todayUTC
): BackfillResult {
  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter) {
    return {
      skill: skillPath,
      changed: false,
      added: [],
      before: content,
      after: content,
    };
  }

  const fm = parsed.frontmatter;
  const additions: Record<string, string> = {};

  if (fm.format === undefined) additions.format = SKILL_FORMAT_DATE;
  if (fm.version === undefined) additions.version = DEFAULT_VERSION;
  if (fm.status === undefined) additions.status = DEFAULT_STATUS;
  if (fm.updated === undefined) {
    const gitDate = gitLastModifiedDate(skillPath);
    additions.updated = gitDate ?? now();
  }

  if (Object.keys(additions).length === 0) {
    return {
      skill: skillPath,
      changed: false,
      added: [],
      before: content,
      after: content,
    };
  }

  const newFrontmatterText = mergeFrontmatter(parsed.frontmatterText, additions);
  const after = `---\n${newFrontmatterText}\n---\n${parsed.body}`;

  return {
    skill: skillPath,
    changed: after !== content,
    added: Object.keys(additions),
    before: content,
    after,
  };
}

export function findSkillFiles(skillsRoot: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(skillsRoot);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const dir = join(skillsRoot, entry);
    let s;
    try {
      s = statSync(dir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;
    const skillFile = join(dir, 'SKILL.md');
    try {
      const fs = statSync(skillFile);
      if (fs.isFile()) out.push(skillFile);
    } catch {
      /* no SKILL.md in this subdir, skip */
    }
  }
  return out.sort();
}

export interface RunOptions {
  write: boolean;
  skillsRoot: string;
  now?: () => string;
}

export function runBackfill(opts: RunOptions): BackfillResult[] {
  const files = findSkillFiles(opts.skillsRoot);
  const results: BackfillResult[] = [];
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const result = backfillSkillContent(content, file, opts.now);
    if (opts.write && result.changed) {
      writeFileSync(file, result.after);
    }
    results.push(result);
  }
  return results;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const skillsRoot = join(process.cwd(), '.claude', 'skills');

  const results = runBackfill({ write, skillsRoot });
  const changed = results.filter((r) => r.changed);
  const unchanged = results.filter((r) => !r.changed);

  console.log(`skill-version-backfill (${write ? 'WRITE' : 'DRY-RUN'})`);
  console.log(`  total:     ${results.length}`);
  console.log(`  changed:   ${changed.length}`);
  console.log(`  unchanged: ${unchanged.length}`);
  if (changed.length > 0) {
    console.log('');
    console.log('Changed files:');
    for (const r of changed) {
      console.log(`  + ${r.skill}  [${r.added.join(', ')}]`);
    }
  }
  if (!write && changed.length > 0) {
    console.log('');
    console.log('Run with --write to apply.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
