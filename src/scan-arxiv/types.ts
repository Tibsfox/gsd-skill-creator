// === Domain enums ===

export type RelevanceDomain =
  | 'agent-orchestration'
  | 'skill-design'
  | 'code-gen'
  | 'memory-retrieval';

export const RELEVANCE_DOMAINS: readonly RelevanceDomain[] = [
  'agent-orchestration',
  'skill-design',
  'code-gen',
  'memory-retrieval',
] as const;

// === Paper representation (post-fetch, pre-rank) ===

export interface ArxivPaper {
  arxivId: string;          // e.g. "2605.12345" or "2605.12345v2"
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];     // e.g. ["cs.AI", "cs.LG"]
  publishedAt: string;      // ISO 8601 UTC
  updatedAt: string;        // ISO 8601 UTC
  pdfUrl: string;           // canonical PDF URL on arxiv.org
  absUrl: string;           // abs page URL
}

// === Relevance scoring (post-rank) ===

export interface RelevanceScore {
  subscores: Record<RelevanceDomain, number>;  // each ∈ [0, 1]
  aggregate: number;                            // ∈ [0, 1]
  rationale: string;                            // one sentence, cites abstract terms
  scoredAt: string;                             // ISO 8601 UTC
  scorerVersion: string;                        // e.g. "v1.0.0"
}

// === Queue entry (one paper post-rank) ===

export interface QueueEntry {
  paper: ArxivPaper;
  relevance: RelevanceScore;
  rank: number;             // 1-indexed position in the queue
}

// === Per-run output bundle ===

export interface RunOutput {
  runId: string;            // e.g. "2026-05-16T18-22-31Z"
  invokedAt: string;        // ISO 8601 UTC
  options: ResolvedScanArxivOptions;
  totalsByCategory: Record<string, number>;
  totalsByDomain: Record<RelevanceDomain, number>;
  fetchedCount: number;
  rankedCount: number;
  dedupSkipCount: number;
  queue: QueueEntry[];
  runtimeMs: number;
}

// === CLI options ===

export interface ScanArxivOptions {
  month?: string;                  // "YYYY-MM"; default = previous completed month
  top?: number;                    // default 30
  dryRun?: boolean;
  categories?: string[];           // default ["cs.AI","cs.CL","cs.LG","cs.MA","cs.SE"]
  minScore?: number;               // default 0.5
  noCache?: boolean;
  outputDir?: string;              // default ".planning/arxiv-may-funnel/runs"
}

export interface ResolvedScanArxivOptions {
  month: string;
  top: number;
  dryRun: boolean;
  categories: string[];
  minScore: number;
  noCache: boolean;
  outputDir: string;
}

// === Ranker contract ===

export interface Ranker {
  rankBatch(papers: ArxivPaper[]): Promise<Map<string, RelevanceScore>>;
  // returns a map from arxivId -> RelevanceScore
}

// === Fetcher contract ===

export interface Fetcher {
  fetchMonth(month: string, categories: string[]): Promise<ArxivPaper[]>;
}

// === Bridge contract ===

export interface BridgeOptions {
  outputDir: string;
  hitlAutoConfirm?: boolean;       // affects only the generated shell script; never the bridge itself
}

export interface BridgeResult {
  queueJsonPath: string;
  shellScriptPath: string;
  reportMdPath: string;
  seenIdsPath: string;
}

// === Constants ===

export const DEFAULT_CATEGORIES: readonly string[] = [
  'cs.AI',
  'cs.CL',
  'cs.LG',
  'cs.MA',
  'cs.SE',
];

export const DEFAULT_TOP = 30;
export const DEFAULT_MIN_SCORE = 0.5;
export const DEFAULT_OUTPUT_DIR = '.planning/arxiv-may-funnel/runs';
export const SCORER_VERSION = 'v1.0.0';

// === Validators (lightweight, no external deps) ===

export function isValidMonth(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function isValidArxivId(s: string): boolean {
  return /^\d{4}\.\d{4,6}(v\d+)?$/.test(s);
}

export function isValidScore(n: number): boolean {
  return Number.isFinite(n) && n >= 0 && n <= 1;
}
