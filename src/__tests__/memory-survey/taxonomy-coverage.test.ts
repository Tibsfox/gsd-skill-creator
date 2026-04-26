// CF-MED-025 — 9-type taxonomy migration coverage.
//
// Verifies:
//   - The taxonomy export is exactly the 9 expected types.
//   - Filename-prefix classification routes the right type.
//   - Body heuristics catch the pinned-rule signal.
//   - Existing `type:` frontmatter is preserved (manual override wins).
//   - migrateDirectory: every file in a synthetic corpus ends up with a
//     type from the 9-set; counts add up.
//
// Closes: OGA-025 (MEDIUM).

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  TAXONOMY,
  classify,
  classifyByBody,
  looksLikePinnedRule,
  migrateDocument,
  migrateDirectory,
// @ts-expect-error — .mjs migration script has no .d.ts; runtime-tested via this suite
} from '../../../scripts/memory-migrate-taxonomy.mjs';
// @ts-expect-error — .mjs migration script has no .d.ts; runtime-tested via this suite
import { parseFrontmatter } from '../../../scripts/memory-migrate-half-life.mjs';

describe('CF-MED-025: TAXONOMY constant', () => {
  it('exports exactly the 9 types from OOPS-05-P04', () => {
    expect([...TAXONOMY].sort()).toEqual(
      [
        'decision',
        'feedback',
        'observation',
        'pinned-rule',
        'project',
        'question',
        'reference',
        'tactic',
        'user',
      ].sort(),
    );
  });
});

describe('CF-MED-025: classify by filename prefix', () => {
  it.each([
    ['feedback_branch.md', 'feedback'],
    ['user_purpose.md', 'user'],
    ['project_state.md', 'project'],
    ['decision_pick-tool.md', 'decision'],
    ['reference_endpoint.md', 'reference'],
    ['observation_perf.md', 'observation'],
    ['tactic_recipe.md', 'tactic'],
    ['question_open.md', 'question'],
    ['pinned_dev-rule.md', 'pinned-rule'],
  ])('%s -> %s', (basename, expected) => {
    const out = classify({ basename, frontmatter: {}, body: '# x\n' });
    expect(out.type).toBe(expected);
    expect(out.source).toBe('prefix');
  });
});

describe('CF-MED-025: classify preserves existing type:', () => {
  it('keeps a valid existing type even if filename prefix differs', () => {
    const out = classify({
      basename: 'project_a.md',
      frontmatter: { type: 'reference' },
      body: '',
    });
    expect(out.type).toBe('reference');
    expect(out.source).toBe('preserved');
  });

  it('ignores invalid existing type (falls through to prefix)', () => {
    const out = classify({
      basename: 'project_a.md',
      frontmatter: { type: 'not-a-real-type' },
      body: '',
    });
    expect(out.type).toBe('project');
    expect(out.source).toBe('prefix');
  });
});

describe('CF-MED-025: looksLikePinnedRule body heuristic', () => {
  it('detects STANDING RULE marker', () => {
    expect(looksLikePinnedRule('This is a STANDING RULE.')).toBe(true);
  });

  it('detects HARD RULE marker', () => {
    expect(looksLikePinnedRule('HARD RULE: never delete logs')).toBe(true);
  });

  it('detects ABSOLUTE + NEVER combination', () => {
    expect(looksLikePinnedRule('ABSOLUTE: NEVER push .planning files')).toBe(true);
  });

  it('detects the HTML marker comment', () => {
    expect(looksLikePinnedRule('rule\n<!-- STANDING-RULE -->\nbody')).toBe(true);
  });

  it('does NOT trigger on plain prose', () => {
    expect(looksLikePinnedRule('Just a regular project note.')).toBe(false);
  });
});

describe('CF-MED-025: classifyByBody fallback', () => {
  it('routes pinned content to pinned-rule', () => {
    expect(classifyByBody('STANDING RULE: never push .planning')).toBe('pinned-rule');
  });

  it('routes a question to question', () => {
    expect(classifyByBody('# Question: should we use X?\n')).toBe('question');
  });

  it('routes benchmark prose to observation', () => {
    expect(classifyByBody('We measured a 16x speedup with this benchmark.')).toBe(
      'observation',
    );
  });

  it('falls back to project for generic notes', () => {
    expect(classifyByBody('Some plain notes about the work in progress.')).toBe(
      'project',
    );
  });
});

describe('CF-MED-025: migrateDocument adds type field', () => {
  it('adds type when missing; preserves remaining frontmatter', () => {
    const result = migrateDocument({
      text: '---\nname: x\n---\n# body\n',
      basename: 'feedback_branch.md',
    });
    expect(result.changed).toBe(true);
    expect(result.type).toBe('feedback');
    const { frontmatter } = parseFrontmatter(result.text);
    expect(frontmatter.name).toBe('x');
    expect(frontmatter.type).toBe('feedback');
  });

  it('is idempotent on the second run', () => {
    const first = migrateDocument({
      text: '# body\n',
      basename: 'project_a.md',
    });
    const second = migrateDocument({
      text: first.text,
      basename: 'project_a.md',
    });
    expect(second.changed).toBe(false);
    expect(second.text).toBe(first.text);
  });
});

describe('CF-MED-025: migrateDirectory coverage on synthetic corpus', () => {
  it('every classified file has a type from the 9-set', () => {
    const dir = mkdtempSync(join(tmpdir(), 'memscorer-taxonomy-'));
    try {
      writeFileSync(join(dir, 'feedback_a.md'), '# a\n');
      writeFileSync(join(dir, 'user_b.md'), '# b\n');
      writeFileSync(join(dir, 'project_c.md'), '# c\n');
      writeFileSync(
        join(dir, 'random_d.md'),
        'STANDING RULE: never delete logs\n',
      );
      writeFileSync(join(dir, 'random_e.md'), '# Question: when?\n');
      writeFileSync(
        join(dir, 'random_f.md'),
        'We measured 12ms p50 latency in the benchmark.\n',
      );

      const report = migrateDirectory({ dir, write: true });
      expect(report.scanned).toBe(6);
      expect(report.changed).toBe(6);

      const validSet = new Set(TAXONOMY);
      for (const f of report.files) {
        expect(validSet.has(/** @type {any} */ (f.type))).toBe(true);
      }

      // Spot-check classification distribution
      expect(report.byType.feedback).toBe(1);
      expect(report.byType.user).toBe(1);
      expect(report.byType.project).toBe(1);
      expect(report.byType['pinned-rule']).toBe(1);
      expect(report.byType.question).toBe(1);
      expect(report.byType.observation).toBe(1);

      // Sum of byType counts equals scanned
      const sum = (Object.values(report.byType) as number[]).reduce((a, b) => a + b, 0);
      expect(sum).toBe(report.scanned);

      // Re-running is a no-op
      const second = migrateDirectory({ dir, write: true });
      expect(second.changed).toBe(0);

      // Verify the on-disk content has the type field
      const after = readFileSync(join(dir, 'feedback_a.md'), 'utf-8');
      expect(after).toMatch(/type: feedback/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
