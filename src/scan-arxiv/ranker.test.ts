// === Unit tests for the four-domain relevance ranker ===
//
// 12 tests covering:
//   1.  Subscore shape: exactly 4 keys, matching RELEVANCE_DOMAINS.
//   2.  All subscores in [0, 1].
//   3.  Aggregate is the documented weighted mean.
//   4.  Rationale non-empty + single sentence (no paragraph breaks).
//   5.  Rationale cites >= 3 substantive (>4-char) words from the abstract.
//   6.  Boundary: `lora` paper → agent-orch <= 0.3 AND code-gen >= 0.5.
//   7.  Boundary: `multiAgentCoord` → agent-orch >= 0.7.
//   8.  Boundary: `objectDetection` → max(subscores) <= 0.4 AND aggregate < 0.4.
//   9.  Boundary: `longContext` → memory-retrieval >= 0.7.
//   10. Cache: same paper scored twice returns identical RelevanceScore.
//   11. noCache: true triggers a second LLM call.
//   12. Pre-rank filter: low-similarity paper is dropped before fine-rank.
//
// The LLM and embedder are both mocked deterministically — these tests never
// hit the network and run with no API keys.

import { describe, it, expect } from 'vitest';
import {
  createRanker,
  DEFAULT_DOMAIN_WEIGHTS,
  PRE_RANK_THRESHOLD,
  type JudgeFn,
  type JudgeResult,
  type TextEmbedder,
} from './ranker.js';
import {
  CANNED_PAPERS,
  getCannedPaper,
  type CannedPaper,
} from './__fixtures__/canned-papers.js';
import { RELEVANCE_DOMAINS, type ArxivPaper, type RelevanceDomain } from './types.js';

// === Mock helpers ===

/**
 * A deterministic, keyword-driven mock judge. Returns subscores derived from
 * presence of domain-specific keywords in the title+abstract. This lets the
 * tests assert real boundary semantics without invoking an LLM.
 */
function makeMockJudge(): { fn: JudgeFn; callCount: () => number } {
  let calls = 0;
  const fn: JudgeFn = async (paper: ArxivPaper) => {
    calls++;
    return mockScore(paper);
  };
  return { fn, callCount: () => calls };
}

function countKeywords(text: string, words: readonly string[]): number {
  const lower = text.toLowerCase();
  let n = 0;
  for (const w of words) {
    if (lower.includes(w.toLowerCase())) n++;
  }
  return n;
}

function scoreFromKeywords(text: string, words: readonly string[]): number {
  // Saturating count → score in [0,1]. ~3+ hits is high, 0 hits is zero.
  const hits = countKeywords(text, words);
  if (hits === 0) return 0;
  if (hits === 1) return 0.35;
  if (hits === 2) return 0.6;
  if (hits >= 3) return Math.min(1, 0.75 + 0.05 * (hits - 3));
  return 0;
}

function mockScore(paper: ArxivPaper): JudgeResult {
  const text = `${paper.title} ${paper.abstract}`;

  const agentScore = scoreFromKeywords(text, [
    'multi-agent',
    'multi agent',
    'orchestration',
    'mcp',
    'a2a',
    'langgraph',
    'crewai',
    'autogen',
    'dispatch',
    'swarm',
    'role-assignment',
    'role assignment',
    'agents',
    'agent bus',
    'message-passing',
    'message passing',
  ]);
  const skillScore = scoreFromKeywords(text, [
    'skill',
    'tool-use',
    'tool use',
    'function-calling',
    'function calling',
    'slash-command',
    'slash command',
    'sub-agent',
    'subagent',
    'tool selection',
    'prompt-as-program',
    'skill manifest',
    'skill discovery',
  ]);
  const codeScore = scoreFromKeywords(text, [
    'code',
    'coding',
    'swe-bench',
    'pull request',
    'pull-request',
    'humaneval',
    'repository',
    'repo-scale',
    'codelora',
    'code review',
    'code-review',
    'fine-tune',
    'fine-tuning',
    'lora',
    'adapter',
    'python',
    'rust',
  ]);
  const memScore = scoreFromKeywords(text, [
    'long-context',
    'long context',
    'million-token',
    'million token',
    '1m context',
    'rag',
    'retrieval-augmented',
    'retrieval augmented',
    'knowledge graph',
    'embedding',
    'attention',
    'context compression',
    'sliding-window',
    'sparse hierarchical attention',
    'retrieval',
    'memory-augmented',
  ]);

  // Object-detection / vision papers should score near zero across all four.
  // Detect a vision-only paper and dampen everything.
  const visionOnly =
    /\b(detection|aerial|imagery|detr|object-detection|object detection)\b/i.test(text) &&
    !/\b(agent|skill|code|retrieval|long-context|tool|swe-bench|repo)\b/i.test(text);
  const damp = visionOnly ? 0.15 : 1.0;

  const subscores: Record<RelevanceDomain, number> = {
    'agent-orchestration': Math.min(1, agentScore * damp),
    'skill-design': Math.min(1, skillScore * damp),
    'code-gen': Math.min(1, codeScore * damp),
    'memory-retrieval': Math.min(1, memScore * damp),
  };

  // Build a one-sentence rationale that cites >= 3 substantive abstract words.
  // We pick the first three substantive (>4 char) tokens from the abstract.
  const tokens = paper.abstract
    .split(/\s+/)
    .map((t) => t.replace(/[^A-Za-z0-9-]/g, ''))
    .filter((t) => t.length > 4);
  const citedWords = tokens.slice(0, 3);
  const rationale = `The abstract foregrounds ${citedWords.join(', ')} so we assign domain subscores accordingly.`;

  return { subscores, rationale };
}

/**
 * Deterministic embedder driven by lightweight keyword projection. Returns
 * a 16-D vector. Papers that share keywords with anchors will produce high
 * cosine similarity; unrelated text yields near-zero.
 *
 * For pre-rank filter testing we expose a "junk text" embedder that returns
 * an orthogonal vector.
 */
function makeMockEmbedder(): TextEmbedder {
  // Project each text onto a fixed keyword basis. Each basis index counts a
  // group of synonyms. Cosine sim then reflects keyword overlap.
  const basis: readonly (readonly string[])[] = [
    ['multi-agent', 'orchestration', 'mcp', 'a2a', 'swarm', 'dispatch', 'crewai', 'langgraph', 'autogen'],
    ['skill', 'tool', 'function-calling', 'slash-command', 'sub-agent', 'manifest'],
    ['code', 'swe-bench', 'pull request', 'humaneval', 'lora', 'repo', 'fine-tune', 'adapter'],
    ['long-context', 'million-token', 'rag', 'retrieval', 'attention', 'knowledge graph', 'embedding'],
    ['agent', 'communication', 'coordination', 'message-passing'],
    ['router', 'discovery', 'activation', 'tool-use'],
    ['repository', 'autonomous', 'review', 'generation', 'pull-request'],
    ['memory', 'compression', 'context', 'sparse', 'hierarchical'],
    // Filler dims so the vector has at least 16 components.
    ['language'],
    ['model'],
    ['benchmark'],
    ['baseline'],
    ['training'],
    ['evaluation'],
    ['analysis'],
    ['system'],
  ];

  return async (text: string) => {
    const lower = text.toLowerCase();
    return basis.map((group) => {
      let n = 0;
      for (const k of group) {
        if (lower.includes(k.toLowerCase())) n++;
      }
      return n;
    });
  };
}

// === Helpers for assertions ===

function isSingleSentence(s: string): boolean {
  // No paragraph break.
  if (/\n\s*\n/.test(s)) return false;
  // Strip trailing terminator and disallow internal sentence terminators
  // that are followed by whitespace + a capital letter.
  const trimmed = s.trim().replace(/[.!?]+\s*$/, '');
  return !/[.!?]\s+[A-Z]/.test(trimmed);
}

function substantiveWordsInAbstract(rationale: string, abstract: string): number {
  const abstractTokens = new Set(
    abstract
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9-]/g, ''))
      .filter((t) => t.length > 4),
  );
  const rationaleTokens = rationale
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9-]/g, ''))
    .filter((t) => t.length > 4);
  let hits = 0;
  const seen = new Set<string>();
  for (const t of rationaleTokens) {
    if (abstractTokens.has(t) && !seen.has(t)) {
      hits++;
      seen.add(t);
    }
  }
  return hits;
}

function lookup<T extends CannedPaper['key']>(key: T): CannedPaper {
  return getCannedPaper(key);
}

// === Tests ===

describe('createRanker — shape and basic invariants', () => {
  it('1. RelevanceScore.subscores always has exactly 4 keys matching RELEVANCE_DOMAINS', async () => {
    const { fn } = makeMockJudge();
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch(CANNED_PAPERS.map((c) => c.paper));
    expect(all.size).toBeGreaterThan(0);
    for (const score of all.values()) {
      const keys = Object.keys(score.subscores).sort();
      expect(keys).toEqual([...RELEVANCE_DOMAINS].sort());
      expect(keys.length).toBe(4);
    }
  });

  it('2. All subscores are in [0, 1]', async () => {
    const { fn } = makeMockJudge();
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch(CANNED_PAPERS.map((c) => c.paper));
    for (const score of all.values()) {
      for (const d of RELEVANCE_DOMAINS) {
        const v = score.subscores[d];
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      expect(score.aggregate).toBeGreaterThanOrEqual(0);
      expect(score.aggregate).toBeLessThanOrEqual(1);
    }
  });

  it('3. Aggregate is the documented weighted mean of subscores', async () => {
    const { fn } = makeMockJudge();
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch(CANNED_PAPERS.map((c) => c.paper));
    for (const score of all.values()) {
      let expected = 0;
      let wsum = 0;
      for (const d of RELEVANCE_DOMAINS) {
        expected += score.subscores[d] * DEFAULT_DOMAIN_WEIGHTS[d];
        wsum += DEFAULT_DOMAIN_WEIGHTS[d];
      }
      expected = expected / wsum;
      expect(score.aggregate).toBeCloseTo(expected, 5);
    }
  });

  it('4. Rationale is non-empty (>20 chars) and is a single sentence', async () => {
    const { fn } = makeMockJudge();
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch(CANNED_PAPERS.map((c) => c.paper));
    for (const score of all.values()) {
      expect(score.rationale.length).toBeGreaterThan(20);
      expect(isSingleSentence(score.rationale)).toBe(true);
    }
  });

  it('5. Rationale cites >= 3 substantive (>4-char) words from the abstract', async () => {
    const { fn } = makeMockJudge();
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch(CANNED_PAPERS.map((c) => c.paper));
    for (const canned of CANNED_PAPERS) {
      const score = all.get(canned.paper.arxivId);
      if (!score) continue; // (objectDetection may be dropped by pre-rank)
      const hits = substantiveWordsInAbstract(score.rationale, canned.paper.abstract);
      expect(hits).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('createRanker — domain boundary conditions', () => {
  it('6. Boundary: lora → agent-orchestration <= 0.3 AND code-gen >= 0.5', async () => {
    const { fn } = makeMockJudge();
    const lora = lookup('lora');
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch([lora.paper]);
    const score = all.get(lora.paper.arxivId);
    expect(score, 'lora paper survived pre-rank').toBeDefined();
    expect(score!.subscores['agent-orchestration']).toBeLessThanOrEqual(0.3);
    expect(score!.subscores['code-gen']).toBeGreaterThanOrEqual(0.5);
  });

  it('7. Boundary: multiAgentCoord → agent-orchestration >= 0.7', async () => {
    const { fn } = makeMockJudge();
    const mac = lookup('multiAgentCoord');
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch([mac.paper]);
    const score = all.get(mac.paper.arxivId);
    expect(score, 'multiAgentCoord paper survived pre-rank').toBeDefined();
    expect(score!.subscores['agent-orchestration']).toBeGreaterThanOrEqual(0.7);
  });

  it('8. Boundary: objectDetection → max(subscores) <= 0.4 AND aggregate < 0.4 (or dropped pre-rank)', async () => {
    const { fn } = makeMockJudge();
    const od = lookup('objectDetection');
    // Force objectDetection through the LLM stage by lowering the pre-rank
    // threshold to 0 so we can verify the boundary at the judge layer.
    const ranker = createRanker({
      embedder: makeMockEmbedder(),
      judge: fn,
      noCache: true,
      preRankThreshold: 0,
    });
    const all = await ranker.rankBatch([od.paper]);
    const score = all.get(od.paper.arxivId);
    expect(score).toBeDefined();
    const maxSub = Math.max(
      ...RELEVANCE_DOMAINS.map((d) => score!.subscores[d]),
    );
    expect(maxSub).toBeLessThanOrEqual(0.4);
    expect(score!.aggregate).toBeLessThan(0.4);
  });

  it('9. Boundary: longContext → memory-retrieval >= 0.7', async () => {
    const { fn } = makeMockJudge();
    const lc = lookup('longContext');
    const ranker = createRanker({ embedder: makeMockEmbedder(), judge: fn, noCache: true });
    const all = await ranker.rankBatch([lc.paper]);
    const score = all.get(lc.paper.arxivId);
    expect(score, 'longContext paper survived pre-rank').toBeDefined();
    expect(score!.subscores['memory-retrieval']).toBeGreaterThanOrEqual(0.7);
  });
});

describe('createRanker — cache and pre-rank behaviour', () => {
  it('10. Cache: same paper scored twice returns identical RelevanceScore', async () => {
    const { fn, callCount } = makeMockJudge();
    const mac = lookup('multiAgentCoord');
    // Use a unique cache dir per test to avoid cross-run interference.
    const cacheDir = `.planning/arxiv-cache/scores/test-cache-hit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ranker = createRanker({
      embedder: makeMockEmbedder(),
      judge: fn,
      cacheDir,
    });
    const first = await ranker.rankBatch([mac.paper]);
    const callsAfterFirst = callCount();
    const second = await ranker.rankBatch([mac.paper]);
    const callsAfterSecond = callCount();
    expect(callsAfterFirst).toBe(1);
    expect(callsAfterSecond).toBe(1); // cached
    const a = first.get(mac.paper.arxivId)!;
    const b = second.get(mac.paper.arxivId)!;
    expect(b).toEqual(a);
    // Cleanup: best-effort
    try {
      const { rm } = await import('node:fs/promises');
      await rm(cacheDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('11. noCache: true triggers a second LLM call', async () => {
    const { fn, callCount } = makeMockJudge();
    const mac = lookup('multiAgentCoord');
    const ranker = createRanker({
      embedder: makeMockEmbedder(),
      judge: fn,
      noCache: true,
    });
    await ranker.rankBatch([mac.paper]);
    expect(callCount()).toBe(1);
    await ranker.rankBatch([mac.paper]);
    expect(callCount()).toBe(2);
  });

  it('12. Pre-rank filter: a paper with similarity < threshold is dropped before fine-rank', async () => {
    // Construct an embedder that returns a zero vector for the "junk" paper
    // and a normal projection for the anchors / known papers. Cosine of a
    // zero vector is defined as 0 by cosineSimilarity, which is below
    // PRE_RANK_THRESHOLD (0.35) → the paper must be dropped.
    const realEmbed = makeMockEmbedder();
    const junkId = 'junk.0001';
    const junkPaper: ArxivPaper = {
      arxivId: junkId,
      title: 'A photometric calibration model for 19th-century glass-plate astronomy',
      authors: ['X. Anon'],
      abstract:
        'We calibrate Harvard glass-plate magnitudes using a Bayesian hierarchical model. No language models, agents, code, or retrieval involved.',
      categories: ['astro-ph.IM'],
      publishedAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      pdfUrl: 'https://arxiv.org/pdf/junk.0001',
      absUrl: 'https://arxiv.org/abs/junk.0001',
    };
    const embedder: TextEmbedder = async (text) => {
      if (text.startsWith(junkPaper.title)) {
        // Zero vector — cosine sim to any anchor is 0 < threshold.
        return new Array(16).fill(0);
      }
      return realEmbed(text);
    };

    const { fn, callCount } = makeMockJudge();
    const ranker = createRanker({
      embedder,
      judge: fn,
      noCache: true,
      // Default threshold of 0.35 is enforced.
      preRankThreshold: PRE_RANK_THRESHOLD,
    });
    const out = await ranker.rankBatch([junkPaper]);
    expect(out.has(junkId)).toBe(false);
    expect(callCount()).toBe(0); // judge never invoked
  });
});
