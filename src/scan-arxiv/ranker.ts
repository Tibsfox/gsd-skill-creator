// === Four-domain relevance ranker ===
//
// Two-stage ranking:
//
//   Stage 1 (Embedding pre-rank, no LLM cost):
//     - Embed the four domain anchor strings once.
//     - Embed `title + " " + abstract` for each input paper.
//     - Compute cosine similarity from each paper to each domain anchor.
//     - A paper "passes pre-rank" if max(domain_sims) >= PRE_RANK_THRESHOLD.
//     - Cap surviving set at `preRankTop` (top by max similarity).
//
//   Stage 2 (LLM fine-rank, cost-controlled):
//     - For each survivor, send title + abstract + domain blocks to the judge.
//     - Parse JSON response { subscores, rationale }.
//     - Aggregate as a documented weighted mean (DEFAULT_DOMAIN_WEIGHTS).
//     - Cache by arxivId (in-memory; optionally filesystem).
//
// Re-use existing infrastructure:
//   - `EmbeddingService` from src/embeddings/ (Xenova/bge-small-en-v1.5,
//     same model `src/learn/`-style analyzers rely on for any embedding work).
//   - `@anthropic-ai/sdk` via dynamic import, matching the pattern in
//     `src/conflicts/rewrite-suggester.ts`. No new top-level dep is added.
//
// Test-friendly: callers may inject a deterministic `embedder` and `judge`
// via RankerOptions to bypass the network entirely (unit tests do this).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawn } from 'node:child_process';
import type {
  ArxivPaper,
  Ranker,
  RelevanceDomain,
  RelevanceScore,
} from './types.js';
import { RELEVANCE_DOMAINS, SCORER_VERSION } from './types.js';
import { cosineSimilarity } from '../embeddings/cosine-similarity.js';
import { getEmbeddingService } from '../embeddings/embedding-service.js';
import { buildJudgePrompt } from './prompts/judge.js';
import { AGENT_ORCHESTRATION_ANCHOR } from './prompts/agent-orchestration.js';
import { SKILL_DESIGN_ANCHOR } from './prompts/skill-design.js';
import { CODE_GEN_ANCHOR } from './prompts/code-gen.js';
import { MEMORY_RETRIEVAL_ANCHOR } from './prompts/memory-retrieval.js';

// === Public constants ===

/**
 * Domain-aggregate weights. Documented so callers can audit how subscores
 * collapse into a single aggregate. Weights sum to 1.0.
 *
 * Rationale:
 *   - agent-orchestration is the primary mission target (0.35).
 *   - skill-design is the second-most-aligned signal (0.25).
 *   - code-gen and memory-retrieval are tied secondary signals (0.20 each).
 */
export const DEFAULT_DOMAIN_WEIGHTS: Readonly<
  Record<RelevanceDomain, number>
> = {
  'agent-orchestration': 0.35,
  'skill-design': 0.25,
  'code-gen': 0.2,
  'memory-retrieval': 0.2,
} as const;

/**
 * Pre-rank threshold. A paper is dropped before the LLM stage when its
 * maximum cosine similarity across the four domain anchors falls below this.
 * Tuned conservatively low (0.35) because BGE-small embeddings produce
 * naturally low cosine values across cs.* abstracts. Heuristic-fallback
 * embeddings (used when the transformer model is unavailable) are even
 * lower-magnitude, so the threshold needs to admit them too.
 */
export const PRE_RANK_THRESHOLD = 0.35;

/** Default cap on the number of papers that survive Stage 1. */
export const DEFAULT_PRE_RANK_TOP = 100;

/** Default LLM judge model — cheap fine-rank. */
export const DEFAULT_JUDGE_MODEL = 'claude-haiku-4-5-20251001';

/** Default embedding model — what src/embeddings/ ships with. */
export const DEFAULT_EMBEDDING_MODEL = 'Xenova/bge-small-en-v1.5';

/** Default on-disk cache directory. */
export const DEFAULT_CACHE_DIR = '.planning/arxiv-cache/scores';

// === Types ===

/**
 * A function that returns an embedding vector for a single string.
 * Tests inject deterministic embedders; production uses EmbeddingService.
 */
export type TextEmbedder = (text: string) => Promise<number[]>;

/**
 * A judge function returning subscores + rationale for one paper.
 * Tests inject deterministic mocks; production uses the Anthropic SDK.
 */
export type JudgeFn = (paper: ArxivPaper) => Promise<JudgeResult>;

export interface JudgeResult {
  subscores: Record<RelevanceDomain, number>;
  rationale: string;
}

/**
 * Backend for the default LLM judge.
 *   - 'sdk'  : @anthropic-ai/sdk (requires ANTHROPIC_API_KEY)
 *   - 'cli'  : `claude -p` subprocess (uses the local Claude Code OAuth session)
 *   - 'auto' : pick 'sdk' if ANTHROPIC_API_KEY is set, else 'cli'
 */
export type JudgeBackend = 'sdk' | 'cli' | 'auto';

export interface RankerOptions {
  /** Embedding model identifier (informational; pipeline is selected by service). */
  embeddingModel?: string;
  /** LLM judge model identifier. */
  llmJudgeModel?: string;
  /** Which backend the default judge uses; default 'auto'. */
  judgeBackend?: JudgeBackend;
  /** Per-call budget cap for CLI backend, USD; default 0.20. */
  cliMaxBudgetUsd?: number;
  /** Embedding pre-rank cap. */
  preRankTop?: number;
  /** Filesystem cache directory (per-arxivId JSON files). */
  cacheDir?: string;
  /** When true, every paper is judged fresh (no read or write of cache). */
  noCache?: boolean;
  /** LLM judge temperature; default 0 (deterministic). */
  temperature?: number;
  /** Pre-rank cosine-similarity threshold; defaults to PRE_RANK_THRESHOLD. */
  preRankThreshold?: number;
  /** Aggregate weights override; defaults to DEFAULT_DOMAIN_WEIGHTS. */
  weights?: Record<RelevanceDomain, number>;
  /** Injected text embedder (testing). */
  embedder?: TextEmbedder;
  /** Injected LLM judge (testing). */
  judge?: JudgeFn;
}

// === Utilities ===

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function isScoreShape(x: unknown): x is JudgeResult {
  if (!x || typeof x !== 'object') return false;
  const obj = x as { subscores?: unknown; rationale?: unknown };
  if (typeof obj.rationale !== 'string') return false;
  if (!obj.subscores || typeof obj.subscores !== 'object') return false;
  const ss = obj.subscores as Record<string, unknown>;
  for (const d of RELEVANCE_DOMAINS) {
    if (typeof ss[d] !== 'number') return false;
  }
  return true;
}

function aggregateOf(
  subscores: Record<RelevanceDomain, number>,
  weights: Record<RelevanceDomain, number>,
): number {
  let total = 0;
  let wsum = 0;
  for (const d of RELEVANCE_DOMAINS) {
    total += clamp01(subscores[d]) * weights[d];
    wsum += weights[d];
  }
  if (wsum === 0) return 0;
  return clamp01(total / wsum);
}

function buildDefaultEmbedder(): TextEmbedder {
  // Lazy: do not init the heavy transformer pipeline until first call.
  // `getEmbeddingService` initialises and returns the singleton.
  let servicePromise: ReturnType<typeof getEmbeddingService> | null = null;
  return async (text: string) => {
    if (!servicePromise) servicePromise = getEmbeddingService();
    const service = await servicePromise;
    const r = await service.embed(text);
    return r.embedding as number[];
  };
}

function buildSdkJudge(model: string, temperature: number): JudgeFn {
  return async (paper: ArxivPaper) => {
    // Dynamic import keeps the SDK optional at module-load time, matching
    // the pattern in src/conflicts/rewrite-suggester.ts.
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic();
    const prompt = buildJudgePrompt(paper);
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    return parseJudgeJson(raw);
  };
}

/**
 * Subprocess-based judge that shells out to the `claude` CLI. Used when no
 * ANTHROPIC_API_KEY is available — leverages the local Claude Code OAuth
 * session instead. Runs from os.tmpdir() so the CLI does not auto-discover
 * the host repo's CLAUDE.md/hooks (which would inflate per-call token cost).
 */
export function buildCliJudge(model: string, maxBudgetUsd: number): JudgeFn {
  return async (paper: ArxivPaper) => {
    const prompt = buildJudgePrompt(paper);
    const args = [
      '-p',
      '--output-format', 'json',
      '--model', model,
      '--no-session-persistence',
      '--exclude-dynamic-system-prompt-sections',
      '--max-budget-usd', String(maxBudgetUsd),
    ];
    const { stdout, stderr, code } = await new Promise<{
      stdout: string;
      stderr: string;
      code: number | null;
    }>((resolve, reject) => {
      const child = spawn('claude', args, {
        cwd: os.tmpdir(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 180_000,
      });
      let out = '';
      let err = '';
      child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      child.stderr.on('data', (d: Buffer) => { err += d.toString(); });
      child.on('error', reject);
      child.on('close', (c) => resolve({ stdout: out, stderr: err, code: c }));
      child.stdin.write(prompt);
      child.stdin.end();
    });
    if (code !== 0) {
      throw new Error(
        `claude CLI exited ${code}: ${stderr.slice(0, 300) || stdout.slice(0, 300)}`,
      );
    }
    let envelope: { result?: unknown; is_error?: unknown };
    try {
      envelope = JSON.parse(stdout) as typeof envelope;
    } catch {
      throw new Error(`claude CLI returned non-JSON stdout: ${stdout.slice(0, 300)}`);
    }
    if (envelope.is_error === true) {
      const msg = typeof envelope.result === 'string' ? envelope.result : 'unknown error';
      throw new Error(`claude CLI error: ${msg.slice(0, 300)}`);
    }
    if (typeof envelope.result !== 'string') {
      throw new Error('claude CLI envelope missing result string');
    }
    return parseJudgeJson(envelope.result);
  };
}

function buildDefaultJudge(
  model: string,
  temperature: number,
  backend: JudgeBackend,
  cliMaxBudgetUsd: number,
): JudgeFn {
  const resolved: 'sdk' | 'cli' =
    backend === 'auto'
      ? (process.env.ANTHROPIC_API_KEY ? 'sdk' : 'cli')
      : backend;
  return resolved === 'sdk'
    ? buildSdkJudge(model, temperature)
    : buildCliJudge(model, cliMaxBudgetUsd);
}

/**
 * Parse the judge's raw text response. Tolerant of leading/trailing
 * whitespace, code fences, and minor whitespace inside the JSON object.
 * Throws on unrecoverable shape errors.
 */
export function parseJudgeJson(raw: string): JudgeResult {
  let body = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present.
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  // Sometimes the model emits extra prose before/after the JSON.
  const firstBrace = body.indexOf('{');
  const lastBrace = body.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    body = body.slice(firstBrace, lastBrace + 1);
  }
  const parsed: unknown = JSON.parse(body);
  if (!isScoreShape(parsed)) {
    throw new Error('Judge response did not match expected shape');
  }
  return {
    subscores: {
      'agent-orchestration': clamp01(parsed.subscores['agent-orchestration']),
      'skill-design': clamp01(parsed.subscores['skill-design']),
      'code-gen': clamp01(parsed.subscores['code-gen']),
      'memory-retrieval': clamp01(parsed.subscores['memory-retrieval']),
    },
    rationale: parsed.rationale.trim(),
  };
}

// === Cache helpers ===

interface CacheStore {
  read(arxivId: string): Promise<RelevanceScore | null>;
  write(arxivId: string, score: RelevanceScore): Promise<void>;
}

function createCacheStore(cacheDir: string, disabled: boolean): CacheStore {
  const memory = new Map<string, RelevanceScore>();
  if (disabled) {
    return {
      async read() {
        return null;
      },
      async write() {
        /* no-op */
      },
    };
  }
  return {
    async read(arxivId: string) {
      const hit = memory.get(arxivId);
      if (hit) return hit;
      try {
        const fp = path.join(cacheDir, `${sanitizeId(arxivId)}.json`);
        const raw = await fs.readFile(fp, 'utf8');
        const parsed = JSON.parse(raw) as RelevanceScore;
        memory.set(arxivId, parsed);
        return parsed;
      } catch {
        return null;
      }
    },
    async write(arxivId: string, score: RelevanceScore) {
      memory.set(arxivId, score);
      try {
        await fs.mkdir(cacheDir, { recursive: true });
        const fp = path.join(cacheDir, `${sanitizeId(arxivId)}.json`);
        await fs.writeFile(fp, JSON.stringify(score, null, 2), 'utf8');
      } catch {
        // Disk-cache write failure is non-fatal; in-memory copy still
        // services the request.
      }
    },
  };
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

// === Anchors ===

const ANCHOR_BY_DOMAIN: Record<RelevanceDomain, string> = {
  'agent-orchestration': AGENT_ORCHESTRATION_ANCHOR,
  'skill-design': SKILL_DESIGN_ANCHOR,
  'code-gen': CODE_GEN_ANCHOR,
  'memory-retrieval': MEMORY_RETRIEVAL_ANCHOR,
};

interface PreRankRow {
  paper: ArxivPaper;
  maxSim: number;
}

async function preRank(
  papers: ArxivPaper[],
  embedder: TextEmbedder,
  threshold: number,
  topCap: number,
): Promise<PreRankRow[]> {
  if (papers.length === 0) return [];
  // Embed the four anchors once per batch.
  const anchorEmbeddings: Record<RelevanceDomain, number[]> = {
    'agent-orchestration': await embedder(ANCHOR_BY_DOMAIN['agent-orchestration']),
    'skill-design': await embedder(ANCHOR_BY_DOMAIN['skill-design']),
    'code-gen': await embedder(ANCHOR_BY_DOMAIN['code-gen']),
    'memory-retrieval': await embedder(ANCHOR_BY_DOMAIN['memory-retrieval']),
  };

  const rows: PreRankRow[] = [];
  for (const paper of papers) {
    const vec = await embedder(`${paper.title} ${paper.abstract}`);
    let maxSim = -Infinity;
    for (const d of RELEVANCE_DOMAINS) {
      const sim = cosineSimilarity(vec, anchorEmbeddings[d]);
      if (sim > maxSim) maxSim = sim;
    }
    if (maxSim >= threshold) {
      rows.push({ paper, maxSim });
    }
  }
  rows.sort((a, b) => b.maxSim - a.maxSim);
  return rows.slice(0, topCap);
}

// === Public entry point ===

export function createRanker(opts: RankerOptions = {}): Ranker {
  const {
    llmJudgeModel = DEFAULT_JUDGE_MODEL,
    judgeBackend = 'auto',
    cliMaxBudgetUsd = 0.20,
    preRankTop = DEFAULT_PRE_RANK_TOP,
    cacheDir = DEFAULT_CACHE_DIR,
    noCache = false,
    temperature = 0,
    preRankThreshold = PRE_RANK_THRESHOLD,
    weights = DEFAULT_DOMAIN_WEIGHTS,
    embedder = buildDefaultEmbedder(),
    judge,
  } = opts;

  const judgeFn: JudgeFn =
    judge ?? buildDefaultJudge(llmJudgeModel, temperature, judgeBackend, cliMaxBudgetUsd);
  const cache = createCacheStore(cacheDir, noCache);

  async function rankBatch(
    papers: ArxivPaper[],
  ): Promise<Map<string, RelevanceScore>> {
    const out = new Map<string, RelevanceScore>();
    if (papers.length === 0) return out;

    const survivors = await preRank(papers, embedder, preRankThreshold, preRankTop);

    let judgeErrors = 0;
    for (const { paper } of survivors) {
      // Cache lookup first (skipped when noCache).
      const hit = await cache.read(paper.arxivId);
      if (hit) {
        out.set(paper.arxivId, hit);
        continue;
      }
      let judgeResult: JudgeResult;
      try {
        judgeResult = await judgeFn(paper);
      } catch (err) {
        // One bad call shouldn't kill a 50-paper batch. Log loudly with the
        // arxiv ID so the operator can re-run with --no-cache later if needed.
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[ranker] judge failed for ${paper.arxivId} — skipping. (${msg.slice(0, 200)})`,
        );
        judgeErrors++;
        continue;
      }
      const subscores: Record<RelevanceDomain, number> = {
        'agent-orchestration': clamp01(judgeResult.subscores['agent-orchestration']),
        'skill-design': clamp01(judgeResult.subscores['skill-design']),
        'code-gen': clamp01(judgeResult.subscores['code-gen']),
        'memory-retrieval': clamp01(judgeResult.subscores['memory-retrieval']),
      };
      const aggregate = aggregateOf(subscores, weights);
      const score: RelevanceScore = {
        subscores,
        aggregate,
        rationale: judgeResult.rationale,
        scoredAt: new Date().toISOString(),
        scorerVersion: SCORER_VERSION,
      };
      await cache.write(paper.arxivId, score);
      out.set(paper.arxivId, score);
    }
    if (judgeErrors > 0) {
      console.warn(`[ranker] ${judgeErrors} paper(s) skipped due to judge failures`);
    }
    return out;
  }

  return { rankBatch };
}
