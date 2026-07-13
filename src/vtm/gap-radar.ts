/**
 * Corpus-aware research gap radar.
 *
 * Replaces the keyword-heuristic necessity detector's blind spot: instead of
 * only asking "is this domain well-understood in the abstract?", the radar
 * scores a topic's vocabulary against what the corpus *already covers* and
 * emits ranked under-covered subtopics.
 *
 * Coverage is assembled from three corpus signals:
 *   1. Citation WorkIndex — the vocabulary signal. Every stored work's title
 *      and tags contribute term frequencies (one increment per work covering
 *      a term), giving a `term -> #works` coverage map.
 *   2. Arxiv seen-ids — the corpus-maturity signal. The count of already
 *      ingested arxiv papers tempers confidence: a zero-coverage subtopic in
 *      a large, well-scanned corpus is a stronger gap than the same subtopic
 *      in a bare corpus.
 *   3. Knowledge Spine — the mined-experience signal. Flagship
 *      MemoryService 'lesson'/'finding' memories fold into the same coverage
 *      map: a lesson or finding about a topic counts as corpus coverage of it
 *      (one increment per memory covering a term), and their count adds to the
 *      corpus-maturity mass. When no MemorySource is injected the radar
 *      degrades cleanly to the citation + arxiv signals.
 *
 * The emitted report re-weights DEFAULT_DOMAIN_WEIGHTS (boosting the mission
 * domains whose subtopics are under-covered) so it can directly seed the vtm
 * research stage and the scan-arxiv ranker.
 *
 * Deferred extension: the complex-plane density layer
 * (ConceptRegistry.getByPosition) would let the radar score against the
 * .college/ concept lattice as a third signal. That cross-subsystem join is a
 * documented follow-up; this module scores against citations + arxiv only.
 *
 * @module vtm/gap-radar
 */

import type { RelevanceDomain } from '../scan-arxiv/types.js';
import type { MemoryType } from '../memory/types.js';
import { RELEVANCE_DOMAINS } from '../scan-arxiv/types.js';
import { DEFAULT_DOMAIN_WEIGHTS } from '../scan-arxiv/ranker.js';
import { loadSeenIds } from '../scan-arxiv/dedup.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Corpus coverage snapshot: term frequencies plus corpus-maturity counts. */
export interface CorpusCoverage {
  /** Lowercased term -> number of corpus works whose title/tags cover it. */
  termCounts: Map<string, number>;
  /** Number of citation works contributing to the coverage map. */
  workCount: number;
  /** Number of arxiv papers already ingested (seen-ids ledger size). */
  arxivSeenCount: number;
  /**
   * Number of Knowledge Spine memories ('lesson'/'finding') folded into the
   * coverage map. Absent/zero when no MemorySource was injected.
   */
  spineCount?: number;
}

/** One ranked subtopic gap. */
export interface SubtopicGap {
  subtopic: string;
  /** Tokens the subtopic decomposed into. */
  terms: string[];
  /** Raw corpus coverage: sum of term counts across the subtopic's terms. */
  coverage: number;
  /** Coverage normalized against the best-covered subtopic, in [0, 1]. */
  coverageRatio: number;
  /** Gap score in [0, 1]; 1 = completely uncovered relative to peers. */
  gapScore: number;
  /** The RelevanceDomain this subtopic most associates with. */
  domain: RelevanceDomain;
}

/** Full gap-radar report for a topic. */
export interface GapReport {
  topic: string;
  /** Subtopics ranked most-under-covered first. */
  subtopics: SubtopicGap[];
  /** DEFAULT_DOMAIN_WEIGHTS re-weighted by per-domain gap pressure. */
  reweightedDomainWeights: Record<RelevanceDomain, number>;
  /** Citation works that fed the coverage map. */
  workCount: number;
  /** Arxiv papers already ingested. */
  arxivSeenCount: number;
  /** Knowledge Spine memories folded into the coverage map. */
  spineCount: number;
  /** Confidence the gaps are real, derived from corpus maturity, in [0, 1]. */
  confidence: number;
}

/** The mission's own four domains, used as default subtopics. */
export const DEFAULT_GAP_SUBTOPICS: readonly string[] = [
  'agent orchestration',
  'skill design',
  'code generation',
  'memory retrieval',
] as const;

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

const STOPWORDS = new Set<string>([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'via', 'over',
  'using', 'based', 'toward', 'towards', 'approach', 'approaches', 'method',
  'methods', 'system', 'systems', 'model', 'models', 'novel', 'learning',
]);

/**
 * Lowercase, split on non-alphanumeric runs, drop stopwords and tokens
 * shorter than three characters. Deterministic and dependency-free.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

// ---------------------------------------------------------------------------
// Domain classification
// ---------------------------------------------------------------------------

const DOMAIN_KEYWORDS: Record<RelevanceDomain, ReadonlySet<string>> = {
  'agent-orchestration': new Set([
    'agent', 'agents', 'orchestration', 'orchestrate', 'multi', 'coordination',
    'swarm', 'workflow', 'planner', 'planning', 'delegation', 'team', 'teams',
    'mcp', 'a2a', 'autonomous',
  ]),
  'skill-design': new Set([
    'skill', 'skills', 'prompt', 'prompting', 'instruction', 'instructions',
    'persona', 'capability', 'capabilities', 'tool', 'tools', 'affordance',
    'design',
  ]),
  'code-gen': new Set([
    'code', 'codegen', 'generation', 'synthesis', 'program', 'programming',
    'compiler', 'repair', 'refactor', 'completion', 'coding', 'software',
  ]),
  'memory-retrieval': new Set([
    'memory', 'retrieval', 'rag', 'embedding', 'embeddings', 'vector',
    'recall', 'index', 'semantic', 'knowledge', 'context', 'search',
  ]),
};

/**
 * Classify a subtopic to the domain whose keyword set its terms match most.
 * Ties break by RELEVANCE_DOMAINS declaration order. A subtopic with no
 * keyword hits falls back to the primary mission domain.
 */
export function classifySubtopicDomain(terms: string[]): RelevanceDomain {
  let best: RelevanceDomain = 'agent-orchestration';
  let bestHits = 0;
  for (const domain of RELEVANCE_DOMAINS) {
    const kw = DOMAIN_KEYWORDS[domain];
    let hits = 0;
    for (const t of terms) if (kw.has(t)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = domain;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * Corpus-maturity confidence: more works + seen papers + mined spine memories
 * -> higher confidence.
 */
function confidenceOf(workCount: number, arxivSeenCount: number, spineCount: number): number {
  const mass = workCount + arxivSeenCount + spineCount;
  return clamp01(mass / (mass + 20));
}

/**
 * Re-weight DEFAULT_DOMAIN_WEIGHTS by per-domain gap pressure. Each domain's
 * weight is scaled by (1 + summed gapScore of its subtopics), then the vector
 * is renormalized to sum to 1. With zero pressure the defaults pass through
 * unchanged.
 */
function reweightDomains(
  gaps: SubtopicGap[],
): Record<RelevanceDomain, number> {
  const pressure: Record<RelevanceDomain, number> = {
    'agent-orchestration': 0,
    'skill-design': 0,
    'code-gen': 0,
    'memory-retrieval': 0,
  };
  for (const g of gaps) pressure[g.domain] += g.gapScore;

  const raw: Record<RelevanceDomain, number> = {
    'agent-orchestration': 0,
    'skill-design': 0,
    'code-gen': 0,
    'memory-retrieval': 0,
  };
  let sum = 0;
  for (const d of RELEVANCE_DOMAINS) {
    raw[d] = DEFAULT_DOMAIN_WEIGHTS[d] * (1 + pressure[d]);
    sum += raw[d];
  }
  const out: Record<RelevanceDomain, number> = { ...raw };
  if (sum === 0) return { ...DEFAULT_DOMAIN_WEIGHTS };
  for (const d of RELEVANCE_DOMAINS) out[d] = raw[d] / sum;
  return out;
}

/**
 * Score a topic's subtopics against corpus coverage and emit a ranked gap
 * report. Pure: all I/O happens in {@link buildCorpusCoverage}.
 *
 * @param topic - the umbrella topic (label only)
 * @param subtopics - candidate subtopics to score; empty falls back to the
 *   four mission domains (DEFAULT_GAP_SUBTOPICS)
 * @param coverage - corpus coverage snapshot
 */
export function analyzeGaps(
  topic: string,
  subtopics: string[],
  coverage: CorpusCoverage,
): GapReport {
  const candidates = subtopics.length > 0 ? subtopics : [...DEFAULT_GAP_SUBTOPICS];

  const scored = candidates.map((subtopic) => {
    const terms = tokenize(subtopic);
    const cov = terms.reduce((acc, t) => acc + (coverage.termCounts.get(t) ?? 0), 0);
    return { subtopic, terms, coverage: cov };
  });

  const maxCoverage = scored.reduce((m, s) => Math.max(m, s.coverage), 0);

  const gaps: SubtopicGap[] = scored.map((s) => {
    const coverageRatio = maxCoverage > 0 ? s.coverage / maxCoverage : 0;
    return {
      subtopic: s.subtopic,
      terms: s.terms,
      coverage: s.coverage,
      coverageRatio,
      gapScore: clamp01(1 - coverageRatio),
      domain: classifySubtopicDomain(s.terms),
    };
  });

  // Rank most-under-covered first; deterministic tie-breaks.
  gaps.sort(
    (a, b) =>
      b.gapScore - a.gapScore ||
      a.coverage - b.coverage ||
      a.subtopic.localeCompare(b.subtopic),
  );

  const spineCount = coverage.spineCount ?? 0;
  return {
    topic,
    subtopics: gaps,
    reweightedDomainWeights: reweightDomains(gaps),
    workCount: coverage.workCount,
    arxivSeenCount: coverage.arxivSeenCount,
    spineCount,
    confidence: confidenceOf(coverage.workCount, coverage.arxivSeenCount, spineCount),
  };
}

// ---------------------------------------------------------------------------
// Coverage assembly (I/O boundary)
// ---------------------------------------------------------------------------

/** Minimal structural view of a citation store the radar consumes. */
export interface CitationSource {
  init(): Promise<void>;
  all(): Promise<Array<{ title: string; tags: string[] }>>;
}

/** One Knowledge Spine memory as the radar consumes it. */
export interface SpineMemory {
  name: string;
  description: string;
  tags: string[];
}

/**
 * Minimal structural view of the flagship MemoryService the radar consumes.
 * Satisfied by `MemoryService.query` for `type` in {lesson, finding}: the
 * radar only reads each result record's name/description/tags.
 */
export interface MemorySource {
  query(
    text: string,
    options?: { type?: MemoryType; limit?: number },
  ): Promise<{ results: Array<{ record: SpineMemory }> }>;
}

/** The two Knowledge Spine memory types folded into corpus coverage. */
const SPINE_TYPES: readonly MemoryType[] = ['lesson', 'finding'] as const;

export interface BuildCoverageOptions {
  /** Injected citation source (tests). Defaults to a real CitationStore. */
  citationSource?: CitationSource;
  /** Base path for the default CitationStore. */
  citationBasePath?: string;
  /** Override for the arxiv seen-ids ledger path. */
  seenIdsPath?: string;
  /**
   * Injected Knowledge Spine source (flagship MemoryService). When present,
   * 'lesson'/'finding' memories fold into the coverage map as a third signal;
   * when absent, coverage uses citations + arxiv only.
   */
  memorySource?: MemorySource;
}

/**
 * Assemble a {@link CorpusCoverage} snapshot from the citation WorkIndex
 * (vocabulary) and the arxiv seen-ids ledger (maturity). A work contributes
 * each distinct title/tag term exactly once, so `termCounts` reads as
 * "number of works covering this term".
 */
export async function buildCorpusCoverage(
  opts: BuildCoverageOptions = {},
): Promise<CorpusCoverage> {
  const source = opts.citationSource ?? (await defaultCitationSource(opts.citationBasePath));
  await source.init();
  const works = await source.all();

  const termCounts = new Map<string, number>();
  for (const work of works) {
    const terms = new Set<string>(tokenize(work.title));
    for (const tag of work.tags) for (const t of tokenize(tag)) terms.add(t);
    for (const t of terms) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
  }

  const spineCount = opts.memorySource
    ? await foldSpineCoverage(opts.memorySource, termCounts)
    : 0;

  const seen = loadSeenIds(opts.seenIdsPath);
  const arxivSeenCount = Object.keys(seen.ids).length;

  return { termCounts, workCount: works.length, arxivSeenCount, spineCount };
}

/**
 * Fold Knowledge Spine memories into an existing coverage map. Each
 * 'lesson'/'finding' memory contributes its distinct name/description/tag
 * terms exactly once, mirroring how a citation work contributes its title/tag
 * terms — so a mined lesson about a topic reads as one more work covering it.
 * Returns the number of distinct memories folded (deduplicated across types).
 */
async function foldSpineCoverage(
  source: MemorySource,
  termCounts: Map<string, number>,
): Promise<number> {
  const seenIds = new Set<string>();
  const memories: SpineMemory[] = [];
  for (const type of SPINE_TYPES) {
    const response = await source.query('', { type, limit: 10_000 });
    for (const { record } of response.results) {
      // A record satisfying two type queries must only be counted once.
      const identity = `${record.name} ${record.description}`;
      if (seenIds.has(identity)) continue;
      seenIds.add(identity);
      memories.push(record);
    }
  }

  for (const memory of memories) {
    const terms = new Set<string>(tokenize(memory.name));
    for (const t of tokenize(memory.description)) terms.add(t);
    for (const tag of memory.tags) for (const t of tokenize(tag)) terms.add(t);
    for (const t of terms) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);
  }

  return memories.length;
}

async function defaultCitationSource(basePath?: string): Promise<CitationSource> {
  const { CitationStore } = await import('../citations/store/index.js');
  return new CitationStore(basePath);
}
