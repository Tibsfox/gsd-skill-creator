/**
 * T2.3 — score-completeness cleanup-mission rubric test
 *
 * Asserts that the new `cleanup-mission` rubric correctly scores cleanup
 * releases (v1.49.585 first exemplar) AND that auto-detect routes
 * NASA-degree-shaped milestones to the structured rubric (regression).
 *
 * Authored 2026-04-29 in v1.49.586 component T2.3 (closes Lesson #10175).
 *
 * NOTE: this test file lives at tools/release-history/__tests__/ which is
 * OUTSIDE the current vitest include glob (vitest.config.ts scopes to
 * src/**, .college/**, tests/**, www/...). It is forward-ready: a future
 * milestone widening vitest scope to tools/** activates it automatically.
 * For v1.49.586, the same assertions are run by the inline node-script
 * verification in T2.3's pre-commit gate.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreRelease, isCleanupMission } from '../score-completeness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');

function buildCorpus(version) {
  const readmePath = join(REPO_ROOT, 'docs', 'release-notes', version, 'README.md');
  if (!existsSync(readmePath)) return null;
  let text = readFileSync(readmePath, 'utf8');
  const chapterDir = join(dirname(readmePath), 'chapter');
  if (existsSync(chapterDir)) {
    for (const name of readdirSync(chapterDir).filter(n => n.endsWith('.md')).sort()) {
      let chap = readFileSync(join(chapterDir, name), 'utf8');
      chap = chap.replace(/^(#{1,5})(\s+)/gm, '#$1$2');
      text += '\n\n<!-- chapter: ' + name + ' -->\n\n' + chap;
    }
  }
  return text;
}

describe('T2.3: cleanup-mission rubric', () => {
  it('isCleanupMission detects v1.49.585 as cleanup', () => {
    const text = buildCorpus('v1.49.585');
    if (text === null) return; // forward-ready: skip if release-notes absent
    expect(isCleanupMission(text)).toBe(true);
  });

  it('isCleanupMission rejects v1.49.584 (NASA degree shape)', () => {
    const text = buildCorpus('v1.49.584');
    if (text === null) return;
    expect(isCleanupMission(text)).toBe(false);
  });

  it('cleanup rubric scores v1.49.585 ≥ 80 (was F/28 under structured)', () => {
    const text = buildCorpus('v1.49.585');
    if (text === null) return;
    const result = scoreRelease(text, 'feature', { rubric: 'cleanup-mission' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
    // Sanity: non-zero on cleanup-shape dimensions
    expect(result.dimensions.cross_references).toBeGreaterThanOrEqual(5);
    expect(result.dimensions.running_ledgers).toBeGreaterThanOrEqual(5);
    expect(result.dimensions.infrastructure_block).toBeGreaterThanOrEqual(5);
    // part_a/b unused → 0
    expect(result.dimensions.part_a_depth).toBe(0);
    expect(result.dimensions.part_b_depth).toBe(0);
  });

  it('auto-detect routes v1.49.585 → cleanup rubric, lifts F to A/B', () => {
    const text = buildCorpus('v1.49.585');
    if (text === null) return;
    const auto = scoreRelease(text, 'feature', { rubric: 'auto' });
    const structured = scoreRelease(text, 'feature', { rubric: 'structured' });
    // Under structured, v1.49.585 fails the NASA-degree-shape rubric
    expect(structured.grade).toBe('F');
    // Under auto-detect, the cleanup branch fires
    expect(auto.score).toBeGreaterThan(structured.score);
    expect(['A', 'B', 'C']).toContain(auto.grade);
  });

  it('auto-detect leaves v1.49.584 unchanged (non-cleanup, regression-protected)', () => {
    const text = buildCorpus('v1.49.584');
    if (text === null) return;
    const auto = scoreRelease(text, 'feature', { rubric: 'auto' });
    const structured = scoreRelease(text, 'feature', { rubric: 'structured' });
    expect(auto.score).toBe(structured.score);
    expect(auto.grade).toBe(structured.grade);
  });

  it('auto-detect leaves v1.49.581 + v1.49.582 at A/100 (regression-protected)', () => {
    for (const v of ['v1.49.581', 'v1.49.582']) {
      const text = buildCorpus(v);
      if (text === null) continue;
      const auto = scoreRelease(text, 'feature', { rubric: 'auto' });
      expect(auto.grade).toBe('A');
      expect(auto.score).toBeGreaterThanOrEqual(95);
    }
  });

  it('explicit --rubric=cleanup-mission applies even on non-cleanup release', () => {
    // This proves the explicit flag bypasses auto-detect.
    const text = buildCorpus('v1.49.581');
    if (text === null) return;
    const cleanup = scoreRelease(text, 'feature', { rubric: 'cleanup-mission' });
    // v1.49.581 doesn't carry cleanup markers, so cleanup rubric scores
    // it lower than its native structured rubric (F vs A)
    expect(cleanup.score).toBeLessThan(80);
  });

  it('explicit --rubric=structured applies even on cleanup release', () => {
    const text = buildCorpus('v1.49.585');
    if (text === null) return;
    const structured = scoreRelease(text, 'feature', { rubric: 'structured' });
    expect(structured.grade).toBe('F'); // demonstrates the original drift
  });
});
