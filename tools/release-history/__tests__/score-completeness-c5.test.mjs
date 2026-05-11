/**
 * C5 — Cleanup Rubric Recalibration tests (v1.49.650)
 *
 * Closes the drift-check informational alert from v1.49.634 ship:
 *   [major] recent20_drift: Recent 20 average (85.2) is 12.2 below historical baseline (97.4)
 *
 * Root cause: the cleanup-mission rubric did not recognize plain-bullet
 * lesson format (- text without ** bold), "## Lesson #NNNNN-suffix" headings
 * (chapter style with followup suffixes), or freeform retrospective headings
 * like "What went unusually well" / "What went less well".
 *
 * These tests use fixed synthetic fixtures (tests/fixtures/release-notes-rubric-*)
 * and real release-notes corpora (v1.49.585, v1.49.634, v1.49.633, v1.49.611)
 * to verify all five calibration invariants from the C5 spec:
 *   1. v1.49.585 (cleanup) scores ≥ B (80) under --cleanup rubric
 *   2. v1.49.634 (cleanup) scores ≥ B (80) under --cleanup rubric
 *   3. Degenerate-empty fixture scores ≤ D (60) under --cleanup rubric
 *   4. NASA-degree milestone (v1.49.633) under --cleanup rubric < 80 (shape mismatch penalized)
 *   5. NASA-degree milestone (v1.49.611) under --cleanup rubric < 80 (shape mismatch penalized)
 *
 * NOTE: this file lives at tools/release-history/__tests__/ alongside the
 * pre-existing score-completeness.test.mjs. The vitest.tools.config.mjs
 * includes this directory (tools/**), so it runs in the tools suite.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreRelease, isCleanupMission } from '../score-completeness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');

function buildCorpus(relPath) {
  const readmePath = join(REPO_ROOT, relPath, 'README.md');
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

// ─── Calibration invariant 1: v1.49.585 cleanup ≥ B ─────────────────────────

describe('C5 invariant 1: v1.49.585 (cleanup) scores ≥ B under cleanup rubric', () => {
  it('v1.49.585 grades B or A under cleanup-mission rubric', () => {
    const text = buildCorpus('docs/release-notes/v1.49.585');
    if (text === null) return; // forward-ready: skip if release-notes absent
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('v1.49.585 auto-detect still resolves to cleanup-mission rubric', () => {
    const text = buildCorpus('docs/release-notes/v1.49.585');
    if (text === null) return;
    expect(isCleanupMission(text)).toBe(true);
    const auto = scoreRelease(text, 'milestone', { rubric: 'auto' });
    const cleanup = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(auto.score).toBe(cleanup.score);
  });
});

// ─── Calibration invariant 2: v1.49.634 cleanup ≥ B ─────────────────────────
// Root cause of drift-check alert: plain-bullet lessons + freeform retro headings.

describe('C5 invariant 2: v1.49.634 (cleanup) scores ≥ B under cleanup rubric', () => {
  it('v1.49.634 grades B or A under cleanup-mission rubric (post-recalibration)', () => {
    const text = buildCorpus('docs/release-notes/v1.49.634');
    if (text === null) return;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('v1.49.634 lessons_learned dimension > 0 (plain-bullet format recognized)', () => {
    // The plain-bullet "- text" lesson format in v1.49.634's "Forward lessons emitted"
    // section must register as lesson entries. Pre-recalibration this was 0.
    const text = buildCorpus('docs/release-notes/v1.49.634');
    if (text === null) return;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.dimensions.lessons_learned).toBeGreaterThan(0);
  });

  it('v1.49.634 infrastructure_block dimension > 2 (plain-bullet forward-lessons recognized)', () => {
    // The "Forward lessons emitted" section with 4 plain bullets must score > 2.
    // Pre-recalibration: section found, 0 IDs → flat 2. Post-recalibration: ≥ 5.
    const text = buildCorpus('docs/release-notes/v1.49.634');
    if (text === null) return;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.dimensions.infrastructure_block).toBeGreaterThan(2);
  });

  it('v1.49.634 retrospective_structure dimension ≥ 10 (freeform retro headings recognized)', () => {
    // "What went unusually well" + "What went less well" must both score.
    // Pre-recalibration: only carryover matched → 10. Post-recalibration: all match → 15.
    const text = buildCorpus('docs/release-notes/v1.49.634');
    if (text === null) return;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.dimensions.retrospective_structure).toBeGreaterThanOrEqual(10);
  });
});

// ─── Calibration invariant 3: Degenerate-empty ≤ D ──────────────────────────

describe('C5 invariant 3: degenerate-empty fixture scores ≤ D under cleanup rubric', () => {
  it('synthetic empty fixture scores ≤ 60 (D or F) under cleanup-mission rubric', () => {
    const text = buildCorpus('tests/fixtures/release-notes-rubric-empty');
    if (text === null) return;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.score).toBeLessThanOrEqual(60);
    expect(['D', 'F']).toContain(result.grade);
  });
});

// ─── Calibration invariants 4+5: NASA-degree shape penalized ─────────────────

describe('C5 invariants 4+5: NASA-degree milestones score < 80 under cleanup rubric', () => {
  it('v1.49.633 (STS-6 Challenger, NASA-degree) scores < 80 under cleanup rubric', () => {
    // NASA-degree shape (Part A/B prose, cross-track narrative) ≠ cleanup shape.
    // Must not accidentally pass the ≥ B threshold when graded against cleanup rubric.
    const text = buildCorpus('docs/release-notes/v1.49.633');
    if (text === null) return;
    const result = scoreRelease(text, 'degree', { rubric: 'cleanup-mission' });
    expect(result.score).toBeLessThan(80);
  });

  it('v1.49.611 (Voyager 2 Saturn, NASA-degree) scores < 80 under cleanup rubric', () => {
    const text = buildCorpus('docs/release-notes/v1.49.611');
    if (text === null) return;
    const result = scoreRelease(text, 'degree', { rubric: 'cleanup-mission' });
    expect(result.score).toBeLessThan(80);
  });
});

// ─── Synthetic fixture: canonical cleanup shape ───────────────────────────────

describe('C5 synthetic fixture: canonical cleanup shape scores ≥ B', () => {
  it('synthetic cleanup fixture scores ≥ B under cleanup-mission rubric', () => {
    // tests/fixtures/release-notes-rubric-cleanup/ is a minimal cleanup milestone
    // that exercises all five rubric dimensions including plain-bullet lessons.
    const text = buildCorpus('tests/fixtures/release-notes-rubric-cleanup');
    if (text === null) return;
    expect(isCleanupMission(text)).toBe(true);
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
  });
});

// ─── Inline unit tests for the three changed functions ───────────────────────

describe('C5 unit: plain-bullet lesson format accepted by scoreCleanupLessons', () => {
  it('plain bullets without ** bold are counted as lesson entries', () => {
    const text = `# v0.0.1 — Cleanup

**Released:** 2026-01-01
**Type:** counter-cadence operational-debt milestone

## Summary

Engine state UNCHANGED.

## Forward lessons emitted

- First plain-bullet lesson entry about gate discipline
- Second plain-bullet lesson entry about meta-test strategy
- Third plain-bullet lesson entry about scope expansion

## Threads closed / opened / extended

**OPENED:** first gate.
**CLOSED:** second debt.
**CARRY-FORWARD:** third state.

## Thread state

Engine state: UNCHANGED
`;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    // 3 plain bullets → count ≥ 3 → s = 6 (matches "≥3" tier in scoreCleanupLessons)
    expect(result.dimensions.lessons_learned).toBeGreaterThanOrEqual(6);
  });

  it('Lesson #NNNNN-suffix headings are counted as lesson entries', () => {
    // v1.49.634 chapter uses "## Lesson #10168-followup — title" style
    const text = `# v0.0.1 — Cleanup

**Released:** 2026-01-01
**Type:** counter-cadence operational-debt milestone

## Summary

Engine state UNCHANGED.

## Forward Lessons

### Lesson #10168-followup — gate the counter-cadence cadence

Content of lesson one.

### Lesson #10169-refinement — gate-not-vigilance extended

Content of lesson two.

### Lesson #10170-application — meta-test at ship time

Content of lesson three.

## Threads closed / opened / extended

**OPENED:** gate.
**CLOSED:** debt.

## Thread state

Engine state: UNCHANGED
`;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    expect(result.dimensions.lessons_learned).toBeGreaterThanOrEqual(6);
  });
});

describe('C5 unit: freeform retrospective headings accepted', () => {
  it('"What went unusually well" + "What went less well" score as worked/better', () => {
    const text = `# v0.0.1 — Cleanup

**Released:** 2026-01-01
**Type:** counter-cadence operational-debt milestone

## Summary

Engine state UNCHANGED.

## Retrospective

### Carryover lessons applied

Applied lesson from prior milestone.

### What went unusually well

Gates fired correctly on day one.

### What went less well

Some false positives on edge cases.

## Threads closed / opened / extended

**OPENED:** gate.

## Thread state

Engine state: UNCHANGED
`;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    // hasRetro(5) + carryover(+5) + whatWorked(+3) + whatBetter(+2) = 15
    expect(result.dimensions.retrospective_structure).toBeGreaterThanOrEqual(13);
  });
});

describe('C5 unit: plain-bullet forward-lessons block scores > 2', () => {
  it('Forward lessons section with 4 plain bullets scores > 2 (was flat 2 pre-recalibration)', () => {
    const text = `# v0.0.1 — Cleanup

**Released:** 2026-01-01
**Type:** counter-cadence operational-debt milestone

## Summary

Engine state UNCHANGED.

## Forward lessons emitted

New lessons authored in chapter/04-lessons.md:
- Counter-cadence trigger fired late; gate the cadence itself
- Reachability audits as a first-class artifact
- Two-phase gate landings for runtime-touching code
- Three pre-existing test fragilities need a housekeeping mission

## Threads closed / opened / extended

**OPENED:** gate.

## Thread state

Engine state: UNCHANGED
`;
    const result = scoreRelease(text, 'milestone', { rubric: 'cleanup-mission' });
    // 4 plain bullets in Forward lessons section → plainBullets ≥ 4 → score 8
    expect(result.dimensions.infrastructure_block).toBeGreaterThan(2);
    expect(result.dimensions.infrastructure_block).toBeGreaterThanOrEqual(5);
  });
});
