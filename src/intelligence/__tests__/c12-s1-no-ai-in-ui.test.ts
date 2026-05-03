/**
 * C12 / T14 — S1 invariant cross-check.
 *
 * S1: web tool has zero direct AI calls; all AI output flows via KB.
 *
 * Asserts that nothing under desktop/intelligence/ imports `anthropic` or
 * `@anthropic-ai/...`. The formal CI lint lands at Phase 826; this is the
 * Phase-825-scope placeholder + early-warning.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const DESKTOP_INTELLIGENCE = resolve(
  __dirname,
  '../../../desktop/intelligence',
);

const FORBIDDEN_PATTERNS = [
  /from\s+['"]@anthropic-ai\//,
  /from\s+['"]anthropic['"]/,
  /import\(\s*['"]@anthropic-ai\//,
  /import\(\s*['"]anthropic['"]\)/,
  /require\(\s*['"]@anthropic-ai\//,
  /require\(\s*['"]anthropic['"]\)/,
];

function walk(dir: string, files: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      walk(path, files);
    } else if (
      entry.endsWith('.ts') ||
      entry.endsWith('.tsx') ||
      entry.endsWith('.js') ||
      entry.endsWith('.jsx')
    ) {
      files.push(path);
    }
  }
  return files;
}

describe('C12 / T14 — S1 invariant', () => {
  it('no anthropic SDK imports in desktop/intelligence/', () => {
    const files = walk(DESKTOP_INTELLIGENCE);
    const offenders: Array<{ file: string; pattern: string }> = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      for (const pat of FORBIDDEN_PATTERNS) {
        if (pat.test(content)) {
          offenders.push({ file: f, pattern: pat.source });
        }
      }
    }
    expect(
      offenders,
      `Found ${offenders.length} forbidden Anthropic imports:\n${offenders.map((o) => `  ${o.file}: ${o.pattern}`).join('\n')}`,
    ).toEqual([]);
  });

  it('intelligence dashboard UI has zero direct AI SDK references at all', () => {
    const files = walk(DESKTOP_INTELLIGENCE);
    const offenders: string[] = [];
    for (const f of files) {
      const content = readFileSync(f, 'utf8');
      // Catch even comment-style references — the invariant is "zero",
      // and code review fails if AI SDK names appear in this dir at all.
      if (/anthropic|@anthropic-ai/i.test(content)) {
        offenders.push(f);
      }
    }
    expect(offenders.length).toBe(0);
  });
});
