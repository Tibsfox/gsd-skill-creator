/**
 * Distiller — mint a validated content cartridge from raw research sources.
 *
 * `distillSources` turns raw artifacts (notes, papers, transcripts, chat logs,
 * URLs) into a content cartridge. The v1 pipeline shipped here:
 *
 *   1. Extract candidate findings from each source (sentence-level split).
 *   2. Cluster findings across sources with a bounded token-overlap heuristic.
 *   3. Turn each cluster into a concept — deriving a complex-plane position
 *      (angle from cluster order, magnitude from cross-source support) and
 *      attaching citations back to the contributing sources.
 *   4. Emit a schema-valid content cartridge.
 *
 * `distillAndValidate` wraps that core in the existing quality pipeline: the
 * security gate (`gateSkillContent`), the iterative critique loop, and both
 * cartridge validators. It is the function the CLI drives.
 *
 * v2 enrichment seam (`DistillEnricher` / `AsyncDistillEnricher`): the
 * "intelligent fill" pass that synthesizes concept names and adds semantic
 * cross-references. The real async implementation lives in
 * `distill-enricher-semantic.ts` (embedder-backed, opt-in via `--enrich`);
 * ledger-resolved citations remain a follow-up. The default is an identity
 * enricher, so v1 behavior is unchanged unless a backend is injected.
 *
 * Pure module: no fs / no child_process. Sources are supplied in-memory; the
 * CLI is responsible for reading files.
 */

import type { Cartridge, ContentChipset, ResearchOutputCartridge } from './types.js';
import { validateCartridge, validateResearchOutputCartridge } from './validator.js';
import { gateSkillContent } from '../validation/skill-content-gate.js';
import { runCritiqueLoop } from '../critique/loop.js';
import {
  advisoryRoiVerdict,
  type RoiAdvisory,
  type RoiAdvisoryConfig,
  type TelemetryUsageSignal,
} from '../skill-promotion/telemetry-roi.js';
import type {
  CritiqueFinding,
  CritiqueStage,
  CritiqueStatus,
  SkillDraft,
} from '../critique/types.js';

// ============================================================================
// Public inputs / outputs
// ============================================================================

export interface DistillSource {
  id: string;
  kind: 'note' | 'paper' | 'transcript' | 'chat' | 'url';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface DistillOptions {
  cartridgeId: string;
  name: string;
  trust?: 'system' | 'user' | 'community';
  /**
   * Output template. v1 fully supports `'content'`; `'department'` is routed
   * through the deferred v2 enrichment seam and falls back to a content
   * cartridge with a note (see DistillEnricher).
   */
  template?: 'content' | 'department';
  /** Hard cap on the number of concept clusters (default 8). */
  maxClusters?: number;
}

/** A single unit of evidence extracted from one source. */
export interface DistillFinding {
  sourceId: string;
  kind: DistillSource['kind'];
  text: string;
  tokens: string[];
}

/** A cluster of findings that became one concept. */
export interface DistillCluster {
  id: string;
  label: string;
  findings: DistillFinding[];
  /** Distinct source ids contributing to the cluster (the citations). */
  sourceIds: string[];
  /** Salient tokens ranked by frequency across the cluster. */
  topTokens: string[];
  /**
   * Semantic neighbours discovered by an async enricher (embedding cosine).
   * `buildConnections` turns these into `relates-semantically` connections. v1
   * (heuristic) distillation leaves this unset; only the semantic enricher fills
   * it. Deduped against source co-occurrence edges.
   */
  semanticEdges?: Array<{ to: string; similarity: number }>;
}

export interface DistillResult {
  cartridge: Cartridge;
  clusters: DistillCluster[];
  notes: string[];
}

// ============================================================================
// v2 intelligent-fill seam (DEFERRED)
// ============================================================================

/**
 * The v2 "intelligent fill" seam. The real implementation (DEFERRED) will call
 * the research coprocessor and reuse vtm / knowledge-graph context to enrich
 * clusters with synthesized names, ledger-resolved citations, and
 * cross-references. v1 ships the identity pass below.
 */
export interface DistillEnricher {
  enrich(clusters: DistillCluster[], sources: DistillSource[]): DistillCluster[];
}

/**
 * Async variant of {@link DistillEnricher}. Enrichment that reaches a live
 * backend (embedder, LLM namer, source ledger) is inherently async, so the
 * already-async {@link distillAndValidate} path accepts this shape. The
 * concrete implementation is {@link ../cartridge/distill-enricher-semantic.js
 * createSemanticEnricher}, which stays INERT without an injected backend.
 */
export interface AsyncDistillEnricher {
  enrich(clusters: DistillCluster[], sources: DistillSource[]): Promise<DistillCluster[]>;
}

export const identityEnricher: DistillEnricher = {
  enrich: (clusters) => clusters,
};

/** Async no-op — the default for {@link distillSourcesAsync}. */
export const asyncIdentityEnricher: AsyncDistillEnricher = {
  enrich: async (clusters) => clusters,
};

// ============================================================================
// Core distiller (pure, synchronous)
// ============================================================================

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were',
  'has', 'have', 'had', 'but', 'not', 'you', 'your', 'they', 'their', 'them',
  'its', 'our', 'can', 'will', 'would', 'about', 'into', 'than', 'then',
  'when', 'what', 'which', 'who', 'how', 'why', 'all', 'any', 'more', 'most',
  'some', 'such', 'only', 'also', 'over', 'under', 'both', 'each', 'other',
]);

/**
 * Distill sources into a content cartridge. Pure and deterministic given the
 * same inputs (modulo the `createdAt` timestamp, which callers can override
 * via provenance if needed).
 */
export function distillSources(
  sources: DistillSource[],
  options: DistillOptions,
  enricher: DistillEnricher = identityEnricher,
): DistillResult {
  const { findings, rawClusters } = prepareClusters(sources, options);
  const clusters = enricher.enrich(rawClusters, sources);
  return assembleResult(clusters, findings, sources, options);
}

/**
 * Async counterpart of {@link distillSources}. Accepts a sync OR async enricher
 * (both are awaited), so a live-backend enricher can run. With the default
 * {@link asyncIdentityEnricher} it is byte-identical to {@link distillSources}.
 */
export async function distillSourcesAsync(
  sources: DistillSource[],
  options: DistillOptions,
  enricher: DistillEnricher | AsyncDistillEnricher = asyncIdentityEnricher,
): Promise<DistillResult> {
  const { findings, rawClusters } = prepareClusters(sources, options);
  const clusters = await enricher.enrich(rawClusters, sources);
  return assembleResult(clusters, findings, sources, options);
}

/** Shared pre-enrichment stage: validate, extract findings, cluster. */
function prepareClusters(
  sources: DistillSource[],
  options: DistillOptions,
): { findings: DistillFinding[]; rawClusters: DistillCluster[] } {
  if (sources.length === 0) {
    throw new Error('distillSources: at least one source is required');
  }
  const maxClusters = Math.max(1, options.maxClusters ?? 8);
  const findings = extractFindings(sources);
  const rawClusters = clusterFindings(findings, maxClusters);
  return { findings, rawClusters };
}

/** Assemble the cartridge + result from (already enriched) clusters. */
function assembleResult(
  clusters: DistillCluster[],
  findings: DistillFinding[],
  sources: DistillSource[],
  options: DistillOptions,
): DistillResult {
  const totalSources = new Set(sources.map((s) => s.id)).size;
  const maxCoverage = Math.max(...clusters.map((c) => c.sourceIds.length), 1);

  const concepts = clusters.map((cluster, i) =>
    conceptFromCluster(cluster, i, clusters.length, totalSources, maxCoverage),
  );

  const chipset: ContentChipset = {
    kind: 'content',
    deepMap: {
      concepts,
      connections: buildConnections(clusters),
      entryPoints: [entryPointId(concepts)],
      progressionPaths: [
        {
          id: 'overview',
          name: 'Overview',
          description: 'Concepts ordered by cross-source support.',
          steps: [...concepts]
            .sort(
              (a, b) =>
                (b.complexPlanePosition?.magnitude ?? 0) -
                (a.complexPlanePosition?.magnitude ?? 0),
            )
            .map((c) => c.id),
        },
      ],
    },
    story: {
      title: options.name,
      narrative: `Distilled ${sources.length} source(s) into ${clusters.length} concept cluster(s).`,
      chapters: [
        {
          id: 'ch1',
          title: 'Concepts',
          summary: 'Clustered findings drawn from the source material.',
          conceptRefs: concepts.map((c) => c.id),
        },
      ],
      throughLine: 'From raw research sources to a validated knowledge cartridge.',
    },
  };

  const cartridge: Cartridge = {
    id: options.cartridgeId,
    name: options.name,
    version: '0.1.0',
    author: 'cartridge-distiller',
    description: `Distilled from ${sources.length} source(s) into ${clusters.length} concept(s).`,
    trust: options.trust ?? 'user',
    provenance: {
      origin: 'cartridge-distill',
      createdAt: new Date().toISOString(),
      researchGrounding: sources.map((s) => s.id),
    },
    chipsets: [chipset],
    metadata: {
      template: options.template ?? 'content',
      clusterCount: clusters.length,
      findingCount: findings.length,
    },
  };

  const notes = [
    `Clustered ${findings.length} finding(s) from ${sources.length} source(s) into ${clusters.length} concept(s).`,
    'v1 bounded-heuristic distiller; the v2 intelligent-fill enricher (research coprocessor + vtm/knowledge reuse) is a deferred seam.',
  ];
  if ((options.template ?? 'content') === 'department') {
    notes.push(
      'department template requested: v1 emits a content cartridge; department synthesis is part of the deferred v2 enrichment seam.',
    );
  }

  return { cartridge, clusters, notes };
}

// ============================================================================
// Finding extraction + clustering
// ============================================================================

function extractFindings(sources: DistillSource[]): DistillFinding[] {
  const out: DistillFinding[] = [];
  for (const source of sources) {
    const segments = splitIntoSegments(source.content);
    if (segments.length === 0) {
      const fallback = source.content.trim() || `${source.kind} ${source.id}`;
      out.push({
        sourceId: source.id,
        kind: source.kind,
        text: fallback,
        tokens: tokenize(fallback),
      });
      continue;
    }
    for (const text of segments) {
      out.push({
        sourceId: source.id,
        kind: source.kind,
        text,
        tokens: tokenize(text),
      });
    }
  }
  return out;
}

function splitIntoSegments(content: string): string[] {
  return content
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
}

function tokenize(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.toLowerCase().matchAll(/[a-z][a-z0-9]{2,}/g)) {
    const tok = m[0];
    if (STOPWORDS.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    out.push(tok);
  }
  return out;
}

/**
 * Greedy token-overlap clustering. Each finding joins the existing cluster with
 * the highest Jaccard token overlap above `THRESHOLD`; otherwise it seeds a new
 * cluster. Once `maxClusters` is reached, remaining findings join the
 * best-matching existing cluster regardless of threshold — the pass is bounded.
 */
function clusterFindings(
  findings: DistillFinding[],
  maxClusters: number,
): DistillCluster[] {
  const THRESHOLD = 0.15;
  interface WorkingCluster {
    findings: DistillFinding[];
    tokenCounts: Map<string, number>;
  }
  const working: WorkingCluster[] = [];

  for (const finding of findings) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < working.length; i++) {
      const score = jaccard(finding.tokens, working[i]!.tokenCounts);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0 && (bestScore >= THRESHOLD || working.length >= maxClusters)) {
      addToCluster(working[bestIdx]!, finding);
    } else if (working.length < maxClusters) {
      const wc: WorkingCluster = { findings: [], tokenCounts: new Map() };
      addToCluster(wc, finding);
      working.push(wc);
    } else {
      // Cap reached and no positive-overlap match: fall into cluster 0.
      addToCluster(working[0]!, finding);
    }
  }

  return working.map((wc, i) => finalizeCluster(wc.findings, wc.tokenCounts, i));

  function addToCluster(wc: WorkingCluster, finding: DistillFinding): void {
    wc.findings.push(finding);
    for (const tok of finding.tokens) {
      wc.tokenCounts.set(tok, (wc.tokenCounts.get(tok) ?? 0) + 1);
    }
  }
}

function jaccard(tokens: string[], counts: Map<string, number>): number {
  if (tokens.length === 0 || counts.size === 0) return 0;
  let shared = 0;
  for (const tok of tokens) if (counts.has(tok)) shared++;
  const union = counts.size + tokens.length - shared;
  return union === 0 ? 0 : shared / union;
}

function finalizeCluster(
  findings: DistillFinding[],
  tokenCounts: Map<string, number>,
  index: number,
): DistillCluster {
  const sourceIds = [...new Set(findings.map((f) => f.sourceId))];
  const topTokens = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([tok]) => tok);
  return {
    id: `cluster-${index}`,
    label: labelFromTokens(topTokens, findings),
    findings,
    sourceIds,
    topTokens,
  };
}

function labelFromTokens(topTokens: string[], findings: DistillFinding[]): string {
  if (topTokens.length > 0) {
    return topTokens
      .slice(0, 3)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(' ');
  }
  const rep = representativeText(findings);
  return truncate(rep, 60);
}

function representativeText(findings: DistillFinding[]): string {
  return findings.reduce(
    (longest, f) => (f.text.length > longest.length ? f.text : longest),
    findings[0]?.text ?? 'concept',
  );
}

// ============================================================================
// Concept + connection derivation
// ============================================================================

function conceptFromCluster(
  cluster: DistillCluster,
  index: number,
  clusterCount: number,
  totalSources: number,
  maxCoverage: number,
): ContentChipset['deepMap']['concepts'][number] {
  const size = cluster.findings.length;
  const coverage = cluster.sourceIds.length;
  // Angle distributes clusters around the circle; magnitude scales with how
  // broadly the concept is supported across distinct sources.
  const angle = clusterCount <= 1 ? 0 : (index / clusterCount) * 2 * Math.PI;
  const magnitude = clampUnit(
    (coverage / Math.max(totalSources, 1)) * 0.6 + (coverage / maxCoverage) * 0.4,
  );
  return {
    id: cluster.id,
    name: cluster.label,
    description: truncate(representativeText(cluster.findings), 200),
    complexPlanePosition: { angle: clampAngle(angle), magnitude },
    depth: size >= 3 ? 'read' : size === 2 ? 'scan' : 'glance',
    tags: dedupe([
      ...new Set(cluster.findings.map((f) => f.kind)),
      ...cluster.topTokens,
    ]).slice(0, 8),
    citations: cluster.sourceIds.map((sourceId) => ({ sourceId })),
  };
}

function buildConnections(
  clusters: DistillCluster[],
): ContentChipset['deepMap']['connections'] {
  const connections: ContentChipset['deepMap']['connections'] = [];
  const seen = new Set<string>();
  const pairKey = (a: string, b: string): string => (a < b ? `${a}\x00${b}` : `${b}\x00${a}`);

  // Source co-occurrence edges (v1 signal).
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i]!;
      const b = clusters[j]!;
      const shared = a.sourceIds.filter((s) => b.sourceIds.includes(s)).length;
      if (shared === 0) continue;
      const strength = clampUnit(
        shared / Math.min(a.sourceIds.length, b.sourceIds.length),
      );
      connections.push({
        from: a.id,
        to: b.id,
        relationship: 'co-occurs',
        strength: strength === 0 ? 0.1 : strength,
      });
      seen.add(pairKey(a.id, b.id));
    }
  }

  // Semantic edges contributed by an async enricher (deduped against co-occurs).
  const ids = new Set(clusters.map((c) => c.id));
  for (const c of clusters) {
    for (const edge of c.semanticEdges ?? []) {
      if (edge.to === c.id || !ids.has(edge.to)) continue;
      const key = pairKey(c.id, edge.to);
      if (seen.has(key)) continue;
      seen.add(key);
      const strength = clampUnit(edge.similarity);
      connections.push({
        from: c.id,
        to: edge.to,
        relationship: 'relates-semantically',
        strength: strength === 0 ? 0.1 : strength,
      });
    }
  }
  return connections;
}

function entryPointId(
  concepts: ContentChipset['deepMap']['concepts'],
): string {
  let best = concepts[0]!;
  for (const c of concepts) {
    if ((c.complexPlanePosition?.magnitude ?? 0) > (best.complexPlanePosition?.magnitude ?? 0)) {
      best = c;
    }
  }
  return best.id;
}

// ============================================================================
// Validation pipeline (gate + critique + validators)
// ============================================================================

export interface DistillPipelineDeps {
  /** Override the critique stages (default: a structural-integrity stage). */
  critiqueStages?: CritiqueStage[];
  /** Override the body hash (default: FNV-1a). */
  hashBody?: (body: string) => string;
  now?: () => number;
  /** Sync or async cluster enricher. Default: {@link asyncIdentityEnricher} (no-op). */
  enricher?: DistillEnricher | AsyncDistillEnricher;
  /**
   * Telemetry-derived usage signal for the ADVISORY ROI verdict. When supplied
   * (e.g. from a prior cartridge's usage), it drives value/cost; otherwise the
   * pipeline falls back to a signal projected from the artifact's own
   * cross-source support. The verdict is advisory — it never changes
   * `validation.valid`.
   */
  roiSignal?: TelemetryUsageSignal;
  /** Unit-scale overrides for the advisory ROI verdict. */
  roiConfig?: RoiAdvisoryConfig;
}

export interface DistilledArtifact {
  cartridge: Cartridge;
  /** A research-output manifest describing the minted cartridge as an artifact. */
  researchOutput: ResearchOutputCartridge;
  clusters: DistillCluster[];
  notes: string[];
  gate: { ok: boolean; blockers: string[]; warnings: string[] };
  critique: { status: CritiqueStatus; iterations: number };
  validation: { valid: boolean; errors: string[]; researchValid: boolean };
  /**
   * Advisory ROI verdict: does the minted artifact pay for its tokens? Derived
   * from telemetry (or projected from cross-source support). ADVISORY only —
   * never gates `validation.valid`.
   */
  roiAdvisory: RoiAdvisory;
}

/**
 * Full mint pipeline: distill → security gate → critique loop → validate. The
 * CLI drives this. Deterministic when `deps` fixes the clock/hash.
 */
export async function distillAndValidate(
  sources: DistillSource[],
  options: DistillOptions,
  deps: DistillPipelineDeps = {},
): Promise<DistilledArtifact> {
  const { cartridge, clusters, notes } = await distillSourcesAsync(
    sources,
    options,
    deps.enricher ?? asyncIdentityEnricher,
  );

  // --- Security gate over the rendered narrative body ---
  const gateName = toSafeSkillName(cartridge.id);
  const body = renderCartridgeBody(gateName, cartridge);
  const gateResult = gateSkillContent({ name: gateName, content: body });
  const gate = {
    ok: gateResult.ok,
    blockers: gateResult.blockers,
    warnings: gateResult.warnings,
  };

  // --- Critique loop over the (sanitized) draft ---
  const stages = deps.critiqueStages ?? [structureCritiqueStage()];
  const draft: SkillDraft = {
    skillName: gateName,
    skillDir: `.distill/${gateName}`,
    body: gateResult.sanitizedContent,
    metadata: { name: gateName },
    files: new Map(),
  };
  const critiqueResult = await runCritiqueLoop(
    draft,
    stages,
    { maxIterations: 3, convergenceWindow: 2, stallDetection: true },
    {
      revise: async (d) => d,
      hashBody: deps.hashBody ?? fnv1a,
      now: deps.now,
    },
  );

  // --- Validators ---
  const contentValidation = validateCartridge(cartridge);
  const researchOutput = buildResearchOutput(cartridge, sources);
  const researchValidation = validateResearchOutputCartridge(researchOutput);

  // --- Advisory ROI verdict (never gates validity) ---
  const roiSignal = deps.roiSignal ?? crossSourceSupportSignal(clusters, sources.length);
  const roiAdvisory = advisoryRoiVerdict(cartridge.id, roiSignal, deps.roiConfig);

  return {
    cartridge,
    researchOutput,
    clusters,
    notes,
    gate,
    critique: { status: critiqueResult.status, iterations: critiqueResult.iterations },
    validation: {
      valid: contentValidation.valid && gate.ok,
      errors: contentValidation.errors.map((e) => `${e.path}: ${e.message}`),
      researchValid: researchValidation.valid,
    },
    roiAdvisory,
  };
}

/**
 * Project a usage signal from the artifact's own cross-source support when no
 * telemetry is available (a freshly minted cartridge has no usage history):
 * concepts backed by more distinct sources read as higher-value, and the
 * concept count stands in for demonstrated demand.
 */
function crossSourceSupportSignal(
  clusters: DistillCluster[],
  totalSources: number,
): TelemetryUsageSignal {
  const avgCoverage =
    clusters.length > 0
      ? clusters.reduce((sum, c) => sum + c.sourceIds.length, 0) / clusters.length
      : 0;
  return {
    sessionCount: clusters.length,
    loadRate: 1,
    avgScore: totalSources > 0 ? avgCoverage / totalSources : 0,
    projectCount: totalSources,
  };
}

/**
 * A pure critique stage: flags a draft that lost its Concepts section or has no
 * concept headings. Real (if light) structural review with no IO — the loop
 * converges once the draft is well-formed.
 */
function structureCritiqueStage(): CritiqueStage {
  return {
    name: 'structure',
    run: async (draft: SkillDraft): Promise<CritiqueFinding[]> => {
      const findings: CritiqueFinding[] = [];
      if (!/^##\s+Concepts/m.test(draft.body)) {
        findings.push({
          stage: 'structure',
          severity: 'error',
          message: 'draft is missing a "## Concepts" section',
        });
      }
      if (!/^###\s+/m.test(draft.body)) {
        findings.push({
          stage: 'structure',
          severity: 'warning',
          message: 'draft has no concept headings',
        });
      }
      return findings;
    },
  };
}

function renderCartridgeBody(gateName: string, cartridge: Cartridge): string {
  const content = cartridge.chipsets.find((c) => c.kind === 'content') as
    | ContentChipset
    | undefined;
  const description = truncate(cartridge.description, 900);
  const lines: string[] = [
    '---',
    `name: ${gateName}`,
    `description: ${description}`,
    '---',
    '',
    `# ${cartridge.name}`,
    '',
    content?.story.narrative ?? cartridge.description,
    '',
    '## Concepts',
    '',
  ];
  for (const concept of content?.deepMap.concepts ?? []) {
    lines.push(`### ${concept.name}`);
    lines.push(concept.description);
    lines.push('');
  }
  return lines.join('\n');
}

function buildResearchOutput(
  cartridge: Cartridge,
  sources: DistillSource[],
): ResearchOutputCartridge {
  return {
    kind: 'research-output',
    id: `${cartridge.id}-manifest`,
    name: `${cartridge.name} — distillation manifest`,
    version: cartridge.version,
    author: cartridge.author,
    description: `Distillation manifest for ${cartridge.id}.`,
    trust: cartridge.trust,
    provenance: {
      origin: 'cartridge-distill',
      createdAt: cartridge.provenance.createdAt,
      mission: 'cartridge-distill',
      researchGrounding: sources.map((s) => s.id),
    },
    artifacts: [
      {
        path: `${cartridge.id}.cartridge.yaml`,
        kind: 'content-cartridge',
        purpose: `Distilled content cartridge from ${sources.length} source(s).`,
      },
    ],
  };
}

// ============================================================================
// Helpers
// ============================================================================

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + '…';
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function clampUnit(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function clampAngle(a: number): number {
  const max = 2 * Math.PI;
  if (!Number.isFinite(a)) return 0;
  return Math.min(max, Math.max(0, a));
}

/** FNV-1a hex hash — deterministic, dependency-free body hash. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Slugify an arbitrary id into a strict, filesystem-safe skill name. */
export function toSafeSkillName(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length === 0) s = 'distilled-cartridge';
  if (!/^[a-z0-9]/.test(s)) s = `d${s}`;
  s = s.slice(0, 64).replace(/-+$/, '');
  return s;
}
