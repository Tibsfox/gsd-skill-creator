// CF-B-023-1 — survey scorer integration with the MEMORY load path.
//
// 5 synthetic mission-type fixtures (NASA degree work, hooks integration,
// memory schema work, NASA chronological reorder, research publication).
// Each fixture has the same 24-entry corpus (8 pinned-rule + 16 mixed-type)
// but a different task context. We assert:
//
//   - Pinned-rule entries are always present in `kept`.
//   - The mean token-reduction ratio across the 5 fixtures is ≤ 0.6
//     (i.e. ≥40% reduction from the always-load baseline).
//
// All fixture content is SYNTHETIC. The user's actual MEMORY.md may carry
// Fox Companies IP and personal context — we never grep it into committed
// tests. The fixtures here mimic the SHAPE of the real corpus (size, mix
// of types, mix of half-lives) without quoting it.
//
// Closes: CF-B-023-1 (BLOCK validation).

import { describe, it, expect } from 'vitest';
import { survey, totalTokens, type MemoryEntry } from '../survey-scorer.js';

const NOW = new Date('2026-04-25T12:00:00Z');

function age(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

// 24-entry synthetic corpus — token counts approximate the per-file sizes
// observed in real memory corpora (50-400 tokens per file).
const CORPUS: MemoryEntry[] = [
  // 8 pinned rules (always-loaded) — content is generic invariants
  {
    name: 'pinned-dev-branch',
    description: 'always work on the dev branch',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'first action in any session is git switch dev',
    tokenCount: 80,
  },
  {
    name: 'pinned-no-trailers',
    description: 'never add Claude co-author trailers',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'commit messages must not contain Co-Authored-By Claude footers',
    tokenCount: 70,
  },
  {
    name: 'pinned-planning-gitignore',
    description: 'never commit .planning paths',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'planning directory is gitignored by design',
    tokenCount: 60,
  },
  {
    name: 'pinned-wasteland',
    description: 'never import wasteland content',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'wasteland branch holds excluded muse content',
    tokenCount: 60,
  },
  {
    name: 'pinned-fox-ip',
    description: 'Fox Companies IP stays in planning only',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'tibsfox inc and related strategy docs are private',
    tokenCount: 70,
  },
  {
    name: 'pinned-v150-deferred',
    description: 'v1.50 branch is paused',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'do not route work to v1.50 branch unless explicitly reactivated',
    tokenCount: 80,
  },
  {
    name: 'pinned-log-retention',
    description: 'never delete logs only archive',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'session logs are critical archive them do not delete',
    tokenCount: 60,
  },
  {
    name: 'pinned-passthrough-invariant',
    description: 'scorer never sheds pinned-rule entries',
    type: 'pinned-rule',
    half_life: 'infinite',
    last_accessed: age(120),
    confidence: 1.0,
    body: 'pinned rule passthrough is a hard invariant per CF-B-023-2',
    tokenCount: 70,
  },

  // NASA-cluster entries
  {
    name: 'project_nasa-canonical',
    description: 'NASA degree canonical spec updates',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(7),
    confidence: 0.95,
    body: 'all 57 missions compliant with 1.35 index layout WebGL2 shader viewer per mission artifact standard',
    tokenCount: 220,
  },
  {
    name: 'project_seattle-360',
    description: 'Seattle 360 engine state',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(20),
    confidence: 0.9,
    body: 'paused at degree 57 handoff at HANDOFF-360-ENGINE.md NASA degree fleet release',
    tokenCount: 180,
  },
  {
    name: 'reference_nasa-data-architecture',
    description: 'NASA data architecture local-first MCP',
    type: 'reference',
    half_life: 'infinite',
    last_accessed: age(60),
    confidence: 0.95,
    body: 'NASA mission data local-first MCP servers 2TB budget mission catalog',
    tokenCount: 200,
  },

  // Hooks-cluster entries
  {
    name: 'project_hooks-integration',
    description: 'hooks integration tests landed in C1',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(2),
    confidence: 0.95,
    body: 'session-start latency notification hook pre-compact recovery vendoring policy',
    tokenCount: 240,
  },
  {
    name: 'decision_hook-vendoring',
    description: 'ADR 0001 vendoring policy local-modified marker',
    type: 'decision',
    half_life: '6mo',
    last_accessed: age(2),
    confidence: 0.95,
    body: 'vendoring policy uses local-modified true boolean marker for hook files',
    tokenCount: 180,
  },

  // Memory-cluster entries (this work)
  {
    name: 'project_memory-schema',
    description: 'memory schema and survey scorer C3',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(0),
    confidence: 0.95,
    body: 'survey scorer half-life decay 9-type taxonomy pinned-rule passthrough threshold',
    tokenCount: 260,
  },
  {
    name: 'decision_taxonomy-9-type',
    description: '9-type taxonomy decision',
    type: 'decision',
    half_life: '6mo',
    last_accessed: age(1),
    confidence: 0.95,
    body: 'project feedback decision reference user pinned-rule observation tactic question',
    tokenCount: 180,
  },

  // Research / publication-cluster entries
  {
    name: 'project_research-catalog',
    description: 'research catalog 1.88M words 28 series',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(14),
    confidence: 0.9,
    body: 'research catalog 145 files 1.76M words across 28 series tibsfox.com publication',
    tokenCount: 200,
  },
  {
    name: 'tactic_publish-pipeline',
    description: 'markdown to HTML PDF FTP sync',
    type: 'tactic',
    half_life: '6mo',
    last_accessed: age(10),
    confidence: 0.9,
    body: 'pandoc xelatex templates ftp sync to tibsfox.com publish pipeline',
    tokenCount: 220,
  },

  // Older / less-relevant entries (high age + short half-life ⇒ heavy decay)
  {
    name: 'observation_arena-bench',
    description: 'memory arena M2 benchmark',
    type: 'observation',
    half_life: '1mo',
    last_accessed: age(45),
    confidence: 0.85,
    body: 'warm start 100k arena benchmark 16x speedup p value zero confidence interval floor',
    tokenCount: 240,
  },
  {
    name: 'observation_arena-m6-vram',
    description: 'memory arena M6 VRAM crossfade',
    type: 'observation',
    half_life: '1mo',
    last_accessed: age(50),
    confidence: 0.85,
    body: 'VRAM tier cudarc RAM VRAM crossfade arena set RTX 4060 Ti benchmark',
    tokenCount: 220,
  },
  {
    name: 'project_artemis-ii-launch',
    description: 'Artemis II launch day',
    type: 'project',
    half_life: '1mo',
    last_accessed: age(25),
    confidence: 0.9,
    body: 'launch day session full state Artemis II in orbit pgvector embedding prep',
    tokenCount: 220,
  },
  {
    name: 'tactic_chrome-local',
    description: 'local Chroma endpoint',
    type: 'tactic',
    half_life: '6mo',
    last_accessed: age(40),
    confidence: 0.9,
    body: 'ChromaDB runs at localhost 8100 not default 8000',
    tokenCount: 90,
  },
  {
    name: 'reference_pg-credentials',
    description: 'PG credentials path',
    type: 'reference',
    half_life: 'infinite',
    last_accessed: age(60),
    confidence: 0.95,
    body: 'maple PG credentials live in artemis-ii env file PG variables anonymous password list',
    tokenCount: 130,
  },
  {
    name: 'feedback_release-pipeline',
    description: 'release pipeline quality over quantity',
    type: 'feedback',
    half_life: '6mo',
    last_accessed: age(30),
    confidence: 0.95,
    body: 'one release at a time sequential carry-forward retrospectives no batching',
    tokenCount: 180,
  },
  {
    name: 'question_open-routing',
    description: 'open question on intent routing',
    type: 'question',
    half_life: '1wk',
    last_accessed: age(35),
    confidence: 0.7,
    body: 'how should intent classification route dataset retrieval queries question pending',
    tokenCount: 140,
  },
];

const FIXTURES: Array<{ name: string; context: string }> = [
  {
    name: 'nasa-degree-publish',
    context:
      'render NASA degree 56 line art shader viewer artifact catalog mission canonical',
  },
  {
    name: 'hooks-integration',
    context:
      'session-start hook latency notification vendoring policy ADR pre-compact recovery',
  },
  {
    name: 'memory-schema-c3',
    context:
      'survey scorer half-life decay taxonomy pinned-rule passthrough threshold memory schema',
  },
  {
    name: 'research-publication',
    context:
      'research catalog publish pipeline pandoc HTML PDF FTP sync tibsfox.com',
  },
  {
    name: 'erdos-research',
    context: 'erdos prize problems gpu computation arbitrary precision',
  },
];

describe('CF-B-023-1: scorer integration — 5 mission-type fixtures', () => {
  const baseline = totalTokens(CORPUS);

  it('baseline corpus is non-empty and consistent', () => {
    expect(baseline).toBeGreaterThan(0);
    expect(CORPUS.length).toBe(24);
    const pinnedCount = CORPUS.filter((e) => e.type === 'pinned-rule').length;
    expect(pinnedCount).toBe(8);
  });

  const ratios: number[] = [];
  for (const fixture of FIXTURES) {
    it(`fixture "${fixture.name}" preserves all pinned rules`, () => {
      const out = survey(fixture.context, CORPUS, { now: NOW });
      const pinnedKept = out.kept.filter((e) => e.type === 'pinned-rule');
      const pinnedTotal = CORPUS.filter((e) => e.type === 'pinned-rule');
      expect(pinnedKept.length).toBe(pinnedTotal.length);
    });

    it(`fixture "${fixture.name}" achieves token reduction`, () => {
      const out = survey(fixture.context, CORPUS, { now: NOW });
      const kept = totalTokens(out.kept);
      const ratio = kept / baseline;
      ratios.push(ratio);
      // Per-fixture sanity: cannot be > 1 (we only shed)
      expect(ratio).toBeLessThanOrEqual(1);
      // Per-fixture floor: at least the pinned tokens are kept
      const pinnedTokens = totalTokens(
        CORPUS.filter((e) => e.type === 'pinned-rule'),
      );
      expect(kept).toBeGreaterThanOrEqual(pinnedTokens);
    });
  }

  it('mean reduction ratio across 5 fixtures is ≤ 0.6 (≥40% reduction)', () => {
    // Re-run all fixtures so this test is independent of test ordering
    const localRatios: number[] = [];
    for (const fixture of FIXTURES) {
      const out = survey(fixture.context, CORPUS, { now: NOW });
      const ratio = totalTokens(out.kept) / baseline;
      localRatios.push(ratio);
    }
    const mean = localRatios.reduce((a, b) => a + b, 0) / localRatios.length;
    // eslint-disable-next-line no-console
    console.log(
      `[CF-B-023-1] per-fixture ratios: ${localRatios.map((r) => r.toFixed(3)).join(', ')}; mean=${mean.toFixed(3)}`,
    );
    expect(mean).toBeLessThanOrEqual(0.6);
  });
});
