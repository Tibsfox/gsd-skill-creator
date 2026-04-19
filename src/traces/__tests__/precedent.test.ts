/**
 * CF-M3-03: Precedent preservation lossless on 50 benchmark handoffs.
 *
 * Validates:
 *   - queryPrecedent returns intent/reasoning/constraints/alternatives in full
 *   - Top-k ranking by Jaccard similarity is correct
 *   - Lossless round-trip on all 50 benchmark traces
 *   - PrecedentEngine class API
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { writeTraces } from '../writer.js';
import { queryPrecedent, tokenise, jaccardSimilarity, PrecedentEngine } from '../precedent.js';
import type { DecisionTrace } from '../../types/memory.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempPath(): string {
  return join(tmpdir(), `traces-precedent-test-${randomUUID()}.jsonl`);
}

// ─── 50-handoff benchmark fixture ─────────────────────────────────────────────

/**
 * Synthesised benchmark: 50 distinct handoff scenarios drawn from the
 * skill-creator domain (sorting, search, code review, data pipeline, etc.).
 * Each trace has a unique intent, reasoning, constraints, and alternatives.
 */
function build50BenchmarkTraces(): DecisionTrace[] {
  const scenarios = [
    { intent: 'Sort a list of skill definitions by priority score',
      reasoning: 'Merge-sort chosen for stable ordering of equal scores',
      constraints: ['O(n log n) required', 'stable sort'],
      alternatives: ['quicksort: unstable', 'insertion: too slow'] },
    { intent: 'Search the skill codebase for duplicate patterns',
      reasoning: 'Fingerprint hashing selected over full AST parse',
      constraints: ['no external deps', 'sub-second latency'],
      alternatives: ['AST parse: too slow', 'regex: too brittle'] },
    { intent: 'Review code changes for security vulnerabilities',
      reasoning: 'Pattern-based scan chosen; embedding model not available',
      constraints: ['local only', 'no network calls'],
      alternatives: ['embedding scan: requires model', 'manual: not scalable'] },
    { intent: 'Build a data pipeline for ingesting research documents',
      reasoning: 'Streaming pipeline chosen to bound memory',
      constraints: ['max 512MB RAM', 'supports JSONL'],
      alternatives: ['batch: too much RAM', 'DB-first: too slow'] },
    { intent: 'Generate release notes from git commit log',
      reasoning: 'Conventional commit parser selected for structured output',
      constraints: ['conventional commits only', 'max 5000 words'],
      alternatives: ['free-text parse: unreliable', 'manual: not scalable'] },
    { intent: 'Validate skill manifests against the cartridge schema',
      reasoning: 'Zod schema validation chosen for type-safe error messages',
      constraints: ['Zod v3+', 'strict mode'],
      alternatives: ['JSON Schema: less type safety', 'manual: error-prone'] },
    { intent: 'Index Grove records for fast entity lookup',
      reasoning: 'Hash-based index selected for O(1) lookup',
      constraints: ['in-memory only', 'rebuild on start'],
      alternatives: ['B-tree: persistent but slow to build', 'linear scan: O(n)'] },
    { intent: 'Plan wave execution for multi-skill tasks',
      reasoning: 'Topological sort chosen to respect skill dependencies',
      constraints: ['no circular deps', 'max wave depth 10'],
      alternatives: ['random order: breaks deps', 'sequential: misses parallelism'] },
    { intent: 'Compress DACP bundles for remote mesh transport',
      reasoning: 'gzip level 6 chosen as latency/size balance',
      constraints: ['max 10ms compression time', 'remote condition'],
      alternatives: ['gzip 9: too slow', 'no compression: too large'] },
    { intent: 'Evict stale mesh nodes after missed heartbeats',
      reasoning: 'Three-miss threshold chosen as standard practice',
      constraints: ['heartbeat interval 30s', 'max 3 misses'],
      alternatives: ['one miss: too aggressive', 'five miss: too lenient'] },
    { intent: 'Load skill variants from the arena-backed store',
      reasoning: 'Resident tier selected for frequently accessed skills',
      constraints: ['LOD 300', 'warm-start required'],
      alternatives: ['blob tier: too slow', 'RAM only: not persistent'] },
    { intent: 'Detect intent similarity between two task descriptions',
      reasoning: 'Jaccard on word overlap chosen; no embedding model',
      constraints: ['no runtime deps', 'threshold 0.05'],
      alternatives: ['cosine embedding: needs model', 'edit distance: too strict'] },
    { intent: 'Write activation events to the Grove audit trail',
      reasoning: 'Grove append-only records chosen for immutable audit',
      constraints: ['immutable records', 'SHA-256 hash'],
      alternatives: ['SQLite: mutable', 'flat file: no hash chain'] },
    { intent: 'Promote memory entries from hot to warm tier',
      reasoning: 'Alpha score threshold chosen as promotion gate',
      constraints: ['alpha > 0.7', 'Chroma available'],
      alternatives: ['time-based: ignores relevance', 'manual: not scalable'] },
    { intent: 'Extract decision records from execution transcripts',
      reasoning: 'Regex DECISION pattern chosen for deterministic extraction',
      constraints: ['DECISION: format required', 'max 10 per transcript'],
      alternatives: ['NLP parse: non-deterministic', 'manual: not scalable'] },
    { intent: 'Route tasks to optimal mesh nodes using cost policy',
      reasoning: 'Local node preferred when pass-rate exceeds threshold',
      constraints: ['pass-rate > 0.8', 'failover required'],
      alternatives: ['random: ignores performance', 'round-robin: ignores cost'] },
    { intent: 'Fork a skill variant for branch experimentation',
      reasoning: 'Filesystem copy-on-write chosen for isolation',
      constraints: ['max 20% size delta', 'parent hash tracked'],
      alternatives: ['git branch: too heavy', 'in-memory: not persistent'] },
    { intent: 'Commit a branch skill variant back to trunk',
      reasoning: 'SkillCodebase.define() chosen as canonical write path',
      constraints: ['passing tests required', 'delta within 20%'],
      alternatives: ['direct file write: bypasses Grove', 'merge: ambiguous'] },
    { intent: 'Score nodes for routing decisions',
      reasoning: 'Weighted sum of capability, load, and performance chosen',
      constraints: ['weights sum to 1.0', 'deterministic'],
      alternatives: ['neural ranker: non-deterministic', 'random: ignores metrics'] },
    { intent: 'Summarise execution transcripts for context handoff',
      reasoning: 'Bounded digest chosen; max 2000 chars',
      constraints: ['max 2000 chars', 'decisions preserved'],
      alternatives: ['full transcript: too large', 'empty: loses context'] },
    { intent: 'Register a new mesh node with the discovery service',
      reasoning: 'UUID-based node ID chosen for global uniqueness',
      constraints: ['UUID v4', 'heartbeat required'],
      alternatives: ['hostname: not unique', 'sequential: collision risk'] },
    { intent: 'Build skill package for distribution',
      reasoning: 'JSON manifest + compressed variants chosen',
      constraints: ['gzip compression', 'sha256 manifest'],
      alternatives: ['tar: less structured', 'zip: platform-dependent'] },
    { intent: 'Grade skill quality using benchmark results',
      reasoning: 'Pass-rate weighted by model tier chosen',
      constraints: ['min 0.8 pass-rate', 'all chips tested'],
      alternatives: ['single model: not representative', 'manual: subjective'] },
    { intent: 'Analyse skill dependencies for upgrade impact',
      reasoning: 'Reverse dependency walk chosen for impact radius',
      constraints: ['transitive deps included', 'Grove-backed'],
      alternatives: ['direct only: misses transitive', 'manual: error-prone'] },
    { intent: 'Optimise skill prompt for budget efficiency',
      reasoning: 'Length reduction heuristics chosen; no model call',
      constraints: ['no model call', 'preserve semantics'],
      alternatives: ['model rewrite: needs tokens', 'manual: slow'] },
    { intent: 'Benchmark skill performance across chip tiers',
      reasoning: 'Sequential chip testing chosen for reproducibility',
      constraints: ['all tiers tested', '3 runs per chip'],
      alternatives: ['parallel: resource contention', 'single run: noisy'] },
    { intent: 'Hydrate skill embeddings for semantic search',
      reasoning: 'Pre-indexed embeddings chosen; NDCG@10 = 0.899',
      constraints: ['all-MiniLM-L6-v2 model', 'local pgvector'],
      alternatives: ['runtime embedding: too slow', 'BM25: no semantic'] },
    { intent: 'Validate cartridge chipset format on import',
      reasoning: 'Zod schema strict validation chosen',
      constraints: ['Zod strict mode', 'reject unknown fields'],
      alternatives: ['loose parse: hides bugs', 'manual: error-prone'] },
    { intent: 'Sync skill definitions to the remote Grove export',
      reasoning: 'Directory export chosen for filesystem portability',
      constraints: ['hash-equals-filename', 'no overwrite'],
      alternatives: ['DB sync: not portable', 'zip: less inspectable'] },
    { intent: 'Monitor mesh node health via heartbeat tracking',
      reasoning: 'Interval-based check chosen for simplicity',
      constraints: ['check interval 10s', 'evict after 3 misses'],
      alternatives: ['event-driven: complex', 'manual: not scalable'] },
    { intent: 'Parse YAML frontmatter from skill markdown files',
      reasoning: 'Regex-based YAML header extraction chosen',
      constraints: ['--- delimiters', 'no external YAML parser'],
      alternatives: ['full YAML parse: adds dep', 'JSON only: loses format'] },
    { intent: 'Resolve skill name to Grove record hash',
      reasoning: 'GroveNamespace head pointer chosen for latest binding',
      constraints: ['append-only namespace', 'history preserved'],
      alternatives: ['file lookup: no versioning', 'DB: external dep'] },
    { intent: 'Detect and block sensitive data leakage in trace payloads',
      reasoning: 'Keyword regex redaction chosen for zero-dep solution',
      constraints: ['no false negatives on known patterns', 'on-write only'],
      alternatives: ['DLP service: external dep', 'manual review: not scalable'] },
    { intent: 'Preload prefix cache for fast skill retrieval',
      reasoning: 'Radix-tree prefix index chosen for O(prefix) lookup',
      constraints: ['in-memory', 'rebuild on new skills'],
      alternatives: ['hash map: no prefix support', 'trie: slower than radix'] },
    { intent: 'Generate step graph predictions for next-skill selection',
      reasoning: 'Historical co-occurrence statistics chosen',
      constraints: ['min 5 samples per edge', 'confidence threshold 0.6'],
      alternatives: ['neural predictor: no training data', 'random: ignores history'] },
    { intent: 'Merge retrieval results from multiple memory tiers',
      reasoning: 'Alpha-beta-gamma weighted fusion chosen',
      constraints: ['weights configurable', 'recency + relevance + importance'],
      alternatives: ['rank fusion: loses score components', 'first-tier-only: incomplete'] },
    { intent: 'Calculate Leiden community structure for skill graph',
      reasoning: 'Leiden algorithm chosen for quality over Louvain',
      constraints: ['resolution parameter 1.0', 'max 5 levels'],
      alternatives: ['Louvain: lower quality', 'spectral: too slow'] },
    { intent: 'Write session log to Grove for audit trail',
      reasoning: 'Grove append-only record chosen; immutable by construction',
      constraints: ['session UUID required', 'tool version captured'],
      alternatives: ['SQLite: mutable', 'flat JSON: no hash'] },
    { intent: 'Apply sensoria net-shift to skill activation thresholds',
      reasoning: 'Sigmoid-shaped sensitivity curve chosen for smooth transitions',
      constraints: ['net-shift range [-1, 1]', 'no hard cutoffs'],
      alternatives: ['step function: discontinuous', 'linear: no saturation'] },
    { intent: 'Compute Quintessence co-evolution score for skill pairs',
      reasoning: 'Mutual information on activation co-occurrence chosen',
      constraints: ['min 10 joint activations', 'window 30 days'],
      alternatives: ['Pearson: assumes linearity', 'cosine: ignores frequency'] },
    { intent: 'Schedule reflection pass over short-term memory',
      reasoning: 'Count-based trigger chosen; every 50 writes',
      constraints: ['50-write threshold', 'merge similar entries'],
      alternatives: ['time-based: misses bursts', 'manual: not automatic'] },
    { intent: 'Export skill codebase snapshot to disk for backup',
      reasoning: 'Grove JSON snapshot chosen for portability',
      constraints: ['full export', 'hash-verified on import'],
      alternatives: ['git archive: depends on git', 'DB dump: not portable'] },
    { intent: 'Run multi-hop retrieval over memory and skill graph',
      reasoning: 'BFS hop expansion chosen with embedding re-rank',
      constraints: ['max 3 hops', 'NDCG@10 gate'],
      alternatives: ['single-hop: misses connections', 'DFS: slow convergence'] },
    { intent: 'Ingest research documents into long-term memory store',
      reasoning: 'JSONL append to pg-store cold tier chosen',
      constraints: ['pgvector required', 'local-only'],
      alternatives: ['in-memory: not persistent', 'Chroma-only: no relational'] },
    { intent: 'Validate skill output against expected test cases',
      reasoning: 'Exact-match + diff report chosen for deterministic grading',
      constraints: ['Vitest harness', 'all cases must pass'],
      alternatives: ['fuzzy match: hides regressions', 'manual review: slow'] },
    { intent: 'Parse and validate AMTP decision trace envelope',
      reasoning: 'Zod schema validation with canonical form chosen',
      constraints: ['UUID id required', 'ts non-negative'],
      alternatives: ['JSON Schema: less type safety', 'manual: error-prone'] },
    { intent: 'Build provenance header for DACP bundle transport',
      reasoning: 'Immutable hop chain chosen for audit traceability',
      constraints: ['per-hop timestamp', 'no mutation after creation'],
      alternatives: ['mutable log: tamperable', 'no provenance: no audit'] },
    { intent: 'Derive skill lifecycle state from store and result data',
      reasoning: 'Computed-on-demand state chosen to avoid stale cache',
      constraints: ['no separate persistence', 'deterministic from inputs'],
      alternatives: ['persisted state: can go stale', 'event sourcing: complex'] },
    { intent: 'Select optimal model for skill execution on a chip tier',
      reasoning: 'Pass-rate weighted marginal threshold chosen',
      constraints: ['marginal threshold 0.7', 'tier-aware'],
      alternatives: ['always-latest: ignores pass rate', 'random: not reproducible'] },
    { intent: 'Rollover trace log to annual file when entry count exceeded',
      reasoning: 'Filename-suffix rotation chosen for filesystem simplicity',
      constraints: ['max 10000 entries', 'annual suffix YYYY'],
      alternatives: ['DB rotation: adds dep', 'FIFO truncation: loses history'] },
  ];

  return scenarios.map((s, i) => ({
    id: randomUUID(),
    ts: 1_700_000_000_000 + i * 1000,
    actor: `skill:benchmark-${i}`,
    intent: s.intent,
    reasoning: s.reasoning,
    constraints: s.constraints,
    alternatives: s.alternatives,
    outcome: `Completed benchmark step ${i}`,
    refs: {
      teachId: `teach-${i}`,
      entityIds: [`entity-${i}a`, `entity-${i}b`],
    },
  }));
}

// ─── tokenise ────────────────────────────────────────────────────────────────

describe('tokenise', () => {
  it('returns a set of lowercase tokens', () => {
    const tokens = tokenise('Sort a list by Priority Score');
    expect(tokens.has('sort')).toBe(true);
    expect(tokens.has('list')).toBe(true);
    expect(tokens.has('priority')).toBe(true);
    expect(tokens.has('score')).toBe(true);
  });

  it('filters stop-words', () => {
    const tokens = tokenise('Find the best option for the task');
    expect(tokens.has('the')).toBe(false);
    expect(tokens.has('for')).toBe(false);
    expect(tokens.has('best')).toBe(true);
    expect(tokens.has('option')).toBe(true);
  });

  it('filters tokens shorter than 3 characters', () => {
    const tokens = tokenise('Run it as a job');
    expect(tokens.has('it')).toBe(false);
    expect(tokens.has('as')).toBe(false);
    expect(tokens.has('run')).toBe(true);
    expect(tokens.has('job')).toBe(true);
  });
});

// ─── jaccardSimilarity ───────────────────────────────────────────────────────

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical sets', () => {
    const a = new Set(['sort', 'list', 'priority']);
    expect(jaccardSimilarity(a, a)).toBe(1.0);
  });

  it('returns 0 for disjoint sets', () => {
    const a = new Set(['apple', 'banana']);
    const b = new Set(['carrot', 'daikon']);
    expect(jaccardSimilarity(a, b)).toBe(0);
  });

  it('returns 0 for both empty sets', () => {
    expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
  });

  it('computes correct overlap for partial match', () => {
    const a = new Set(['sort', 'list', 'priority']);
    const b = new Set(['sort', 'list', 'score']);
    // intersection = 2, union = 4
    expect(jaccardSimilarity(a, b)).toBeCloseTo(2 / 4);
  });
});

// ─── queryPrecedent ──────────────────────────────────────────────────────────

describe('queryPrecedent', () => {
  it('returns empty array when log is empty', async () => {
    const logPath = join(tmpdir(), `precedent-empty-${randomUUID()}.jsonl`);
    const results = await queryPrecedent('sort a list', logPath);
    expect(results).toHaveLength(0);
  });

  it('returns top-k results sorted by score descending', async () => {
    const logPath = join(tmpdir(), `precedent-topk-${randomUUID()}.jsonl`);
    const traces: DecisionTrace[] = [
      {
        id: randomUUID(), ts: 1000, actor: 'a', intent: 'sort list priority score',
        reasoning: 'r1', constraints: [], alternatives: [], refs: {},
      },
      {
        id: randomUUID(), ts: 2000, actor: 'b', intent: 'sort items by name',
        reasoning: 'r2', constraints: [], alternatives: [], refs: {},
      },
      {
        id: randomUUID(), ts: 3000, actor: 'c', intent: 'build data pipeline',
        reasoning: 'r3', constraints: [], alternatives: [], refs: {},
      },
    ];
    await writeTraces(traces, logPath);

    const results = await queryPrecedent('sort list by priority', logPath, 2, 0);
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
    // Top result should be the sorting-related trace
    expect(results[0].trace.actor).toMatch(/^[ab]$/);
  });

  it('filters results below minSimilarity threshold', async () => {
    const logPath = join(tmpdir(), `precedent-threshold-${randomUUID()}.jsonl`);
    const trace: DecisionTrace = {
      id: randomUUID(), ts: 1000, actor: 'x',
      intent: 'completely unrelated topic about cooking recipes',
      reasoning: 'r', constraints: [], alternatives: [], refs: {},
    };
    await writeTraces([trace], logPath);

    const results = await queryPrecedent('sort skill definitions', logPath, 5, 0.3);
    expect(results).toHaveLength(0);
  });
});

// ─── CF-M3-03: 50-handoff lossless benchmark ─────────────────────────────────

describe('CF-M3-03: precedent lossless on 50 benchmark handoffs', () => {
  it('writes 50 benchmark traces and queries each one with lossless result', async () => {
    const logPath = join(tmpdir(), `precedent-bench-${randomUUID()}.jsonl`);
    const benchTraces = build50BenchmarkTraces();
    expect(benchTraces).toHaveLength(50);

    // Write all 50
    await writeTraces(benchTraces, logPath);

    // Query each trace's intent and verify lossless preservation
    let losslessCount = 0;
    for (const original of benchTraces) {
      const results = await queryPrecedent(original.intent, logPath, 1, 0);
      if (results.length === 0) continue;

      const top = results[0];
      // The top result for an exact intent query must be the original trace
      // (same intent = score 1.0 for non-trivial intents)
      const match = results.find((r) => r.trace.id === original.id);
      if (!match) continue;

      // Lossless check: all AMTP fields preserved
      expect(match.trace.intent).toBe(original.intent);
      expect(match.trace.reasoning).toBe(original.reasoning);
      expect(match.trace.constraints).toEqual(original.constraints);
      expect(match.trace.alternatives).toEqual(original.alternatives);
      expect(match.trace.outcome).toBe(original.outcome);
      losslessCount++;
    }

    // All 50 benchmark traces must be losslessly preserved
    expect(losslessCount).toBe(50);
  });
});

// ─── PrecedentEngine class ────────────────────────────────────────────────────

describe('PrecedentEngine', () => {
  it('query() returns results using configured topK and threshold', async () => {
    const logPath = join(tmpdir(), `precedent-engine-${randomUUID()}.jsonl`);
    const traces: DecisionTrace[] = [
      {
        id: randomUUID(), ts: 1000, actor: 'engine-a',
        intent: 'sort list of items by score',
        reasoning: 'merge sort', constraints: [], alternatives: [], refs: {},
      },
    ];
    await writeTraces(traces, logPath);

    const engine = new PrecedentEngine(logPath, 5, 0.0);
    const results = await engine.query('sort items by score');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].trace.actor).toBe('engine-a');
  });

  it('tokenise static method works', () => {
    const tokens = PrecedentEngine.tokenise('sort list');
    expect(tokens.has('sort')).toBe(true);
    expect(tokens.has('list')).toBe(true);
  });

  it('jaccardSimilarity static method works', () => {
    const a = new Set(['sort', 'list']);
    const b = new Set(['sort', 'list']);
    expect(PrecedentEngine.jaccardSimilarity(a, b)).toBe(1.0);
  });
});
