/**
 * HB-06 ambiguity linter — baseline zero-false-positives invariant.
 *
 * CS25-18 acceptance gate: scan every existing in-tree SKILL.md / authoring
 * doc and assert that the linter produces ZERO flags. Any flag at this
 * stage is treated as a heuristic defect (refine the check), not a
 * baseline regression.
 *
 * Corpus scanned:
 *   - .claude/skills/&#42;&#42;/&#42;.md  (project skill library)
 *   - docs/skill-authoring/&#42;.md       (author-side guidance docs)
 *   - docs/skills/&#42;.md                (when present)
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkAmbiguity } from '../ambiguity.js';

const REPO_ROOT = process.cwd();

function walkMd(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const name of entries) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      out.push(...walkMd(p));
    } else if (st.isFile() && name.endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

function collectCorpus(): string[] {
  const roots = [
    join(REPO_ROOT, '.claude', 'skills'),
    join(REPO_ROOT, 'docs', 'skill-authoring'),
    join(REPO_ROOT, 'docs', 'skills'),
  ];
  const files: string[] = [];
  for (const root of roots) files.push(...walkMd(root));
  return files;
}

describe('HB-06 ambiguity — baseline zero-false-positives on in-tree corpus', () => {
  const files = collectCorpus();

  it('corpus is non-empty (sanity)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no in-tree SKILL.md / authoring doc trips the linter', () => {
    const offenders: Array<{ file: string; flags: number; samples: string[] }> = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      const r = checkAmbiguity(content, relative(REPO_ROOT, file));
      if (r.flags.length > 0) {
        offenders.push({
          file: relative(REPO_ROOT, file),
          flags: r.flags.length,
          samples: r.flags.slice(0, 3).map((f) => `L${f.span.line} ${f.type}: "${f.text}"`),
        });
      }
    }
    if (offenders.length > 0) {
      // Surface enough detail to refine the heuristic.
      const report = offenders
        .map((o) => `${o.file} (${o.flags}) — ${o.samples.join('; ')}`)
        .join('\n');
      throw new Error(`Baseline zero-FP gate failed for ${offenders.length} file(s):\n${report}`);
    }
    expect(offenders).toEqual([]);
  });
});
