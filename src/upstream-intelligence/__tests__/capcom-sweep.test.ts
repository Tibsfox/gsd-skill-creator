/**
 * Upstream Intelligence — CAPCOM source-regex sweep.
 *
 * Covers Gate G14 category 5: every production source file in the 10 new
 * v1.49.573 modules MUST NOT reference `src/(orchestration|dacp|capcom)` as
 * an import line. Test-context references (regex literals inside __tests__/
 * directories) are allowed and intentionally excluded from the sweep.
 *
 * Note: there is no `src/capcom/` in the repository, so the regex still
 * forbids any future file named or pathed under that prefix from sneaking
 * in via the new modules.
 *
 * Phase 775. v1.49.573 W9.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_SRC = path.resolve(__dirname, '..', '..');

const NEW_MODULE_DIRS = [
  'skilldex-auditor',
  'bounded-learning-empirical',
  'activation-steering',
  'fl-threat-model',
  'experience-compression',
  'predictive-skill-loader',
  'promptcluster-batcheffect',
  'artifactnet-provenance',
  'stackelberg-pricing',
  'rumor-delay-model',
] as const;

/**
 * Walk a directory tree, returning all `.ts` files that are NOT inside a
 * `__tests__/` subdirectory.
 */
function listProductionTsFiles(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const fp = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '__tests__' || ent.name === 'node_modules') continue;
        stack.push(fp);
      } else if (ent.isFile() && fp.endsWith('.ts')) {
        out.push(fp);
      }
    }
  }
  return out;
}

/**
 * Conservative production-import detector.
 *
 * Matches lines that look like ES module `import` or `export ... from`
 * statements referencing `src/orchestration`, `src/dacp`, or `src/capcom`.
 * Plain string mentions in JSDoc (e.g., "// no src/orchestration imports
 * here") are NOT flagged because we anchor on `from ['"]` or
 * `import ... from` shapes.
 */
function findOffendingLines(text: string): string[] {
  const offenders: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('//') || line.startsWith('*')) {
      continue;
    }
    // import-style production lines
    if (
      /^(import|export)\b[\s\S]*from\s+['"][^'"]*src\/(orchestration|dacp|capcom)[^'"]*['"]/.test(
        line,
      )
    ) {
      offenders.push(line);
    }
    // dynamic require()
    if (
      /require\(\s*['"][^'"]*src\/(orchestration|dacp|capcom)[^'"]*['"]\s*\)/.test(
        line,
      )
    ) {
      offenders.push(line);
    }
  }
  return offenders;
}

describe('CAPCOM source-regex sweep', () => {
  it('no production .ts file in any of the 10 new modules imports src/(orchestration|dacp|capcom)', () => {
    const violations: Array<{ file: string; offenders: string[] }> = [];
    for (const m of NEW_MODULE_DIRS) {
      const moduleRoot = path.join(REPO_SRC, m);
      if (!fs.existsSync(moduleRoot)) continue;
      const files = listProductionTsFiles(moduleRoot);
      for (const f of files) {
        const text = fs.readFileSync(f, 'utf8');
        const offenders = findOffendingLines(text);
        if (offenders.length > 0) {
          violations.push({ file: f, offenders });
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('every new module dir has at least one production .ts file (existence sanity)', () => {
    for (const m of NEW_MODULE_DIRS) {
      const moduleRoot = path.join(REPO_SRC, m);
      expect(fs.existsSync(moduleRoot)).toBe(true);
      const files = listProductionTsFiles(moduleRoot);
      expect(files.length).toBeGreaterThan(0);
    }
  });
});
