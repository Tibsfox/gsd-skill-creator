/**
 * Semantic DistillEnricher — the real "intelligent fill" pass for cartridge
 * distillation ({@link ./distill.js}). Replaces the identity no-op with an
 * injected, async enricher that (a) discovers semantic cross-references between
 * concept clusters via embedding cosine and (b) optionally synthesizes concept
 * names through an injected LLM namer.
 *
 * OPT-IN · INERT WITHOUT A BACKEND. With no embedder, semantic edges are
 * skipped; with no namer, cluster labels are left untouched; with no
 * citationResolver, citations carry only their source id; with none it is
 * exactly {@link ./distill.js asyncIdentityEnricher}. Every backend is injected
 * — the real embedder is {@link ../embeddings/embedding-service.js
 * EmbeddingService} (BGE-small, heuristic fallback); the namer is a plug-in
 * (e.g. a Claude-backed synthesizer, {@link ./distill-namer-llm.js}); the
 * citation resolver is {@link ./distill-citation-resolver.js
 * LedgerCitationResolver} over a SourceLedger.
 *
 * Pure of fs/child_process — all IO lives inside the injected backends.
 *
 * @module cartridge/distill-enricher-semantic
 */

import type {
  AsyncDistillEnricher,
  DistillCluster,
  DistillFinding,
  DistillSource,
  ResolvedCitationProvenance,
} from './distill.js';

/** The embedding backend — injected. EmbeddingService satisfies this shape. */
export interface DistillEmbedder {
  embed(text: string): Promise<{ embedding: ReadonlyArray<number> }>;
}

/** Concept-name synthesizer — injected, no default (a live LLM plug-in). */
export interface DistillNamer {
  name(input: {
    label: string;
    topTokens: string[];
    representativeText: string;
  }): Promise<string | null>;
}

/**
 * Ledger citation resolver — injected, no default. Given a distill source's id
 * and content, returns the cross-origin provenance a SourceLedger holds for it
 * (empty when the ledger has never seen the source). Best-effort at the call
 * site: a throw is caught and the source simply carries no resolved provenance.
 */
export interface CitationResolver {
  resolve(sourceId: string, content: string): Promise<ResolvedCitationProvenance[]>;
}

export interface SemanticEnricherOptions {
  embedder?: DistillEmbedder;
  namer?: DistillNamer;
  citationResolver?: CitationResolver;
  /** Minimum cosine to emit a semantic cross-reference. Default 0.6. */
  similarityThreshold?: number;
  /** Cap semantic edges per cluster (highest-similarity kept). Default 3. */
  maxEdgesPerCluster?: number;
}

/**
 * Build a semantic enricher. Returns an {@link AsyncDistillEnricher}; passing no
 * backend yields an effective no-op (clusters returned unchanged).
 */
export function createSemanticEnricher(
  options: SemanticEnricherOptions = {},
): AsyncDistillEnricher {
  const threshold = options.similarityThreshold ?? 0.6;
  const maxEdges = options.maxEdgesPerCluster ?? 3;

  return {
    async enrich(
      clusters: DistillCluster[],
      sources: DistillSource[] = [],
    ): Promise<DistillCluster[]> {
      let out = clusters;

      // 1) Optional concept-name synthesis (best-effort per cluster).
      if (options.namer) {
        const namer = options.namer;
        out = await Promise.all(
          out.map(async (c) => {
            try {
              const name = await namer.name({
                label: c.label,
                topTokens: c.topTokens,
                representativeText: representativeText(c.findings),
              });
              return name && name.trim() ? { ...c, label: name.trim() } : c;
            } catch {
              return c;
            }
          }),
        );
      }

      // 2) Optional semantic cross-references via embedding cosine.
      if (options.embedder && out.length > 1) {
        const embedder = options.embedder;
        const vectors = await Promise.all(
          out.map(async (c) => {
            try {
              return (await embedder.embed(clusterText(c))).embedding;
            } catch {
              return null;
            }
          }),
        );

        out = out.map((c, i) => {
          const vi = vectors[i];
          if (!vi) return c;
          const edges: Array<{ to: string; similarity: number }> = [];
          for (let j = 0; j < out.length; j++) {
            if (j === i) continue;
            const vj = vectors[j];
            if (!vj) continue;
            const similarity = cosine(vi, vj);
            if (similarity >= threshold) edges.push({ to: out[j]!.id, similarity });
          }
          if (edges.length === 0) return c;
          edges.sort((a, b) => b.similarity - a.similarity || a.to.localeCompare(b.to));
          return { ...c, semanticEdges: edges.slice(0, maxEdges) };
        });
      }

      // 3) Optional ledger-resolved citation provenance. Resolve each DISTINCT
      // contributing source once (deduped), then attach per-sourceId provenance
      // to the clusters that cite it. Best-effort: an unresolvable source is
      // simply omitted.
      if (options.citationResolver && sources.length > 0) {
        const resolver = options.citationResolver;
        const contentById = new Map(sources.map((s) => [s.id, s.content]));
        const neededIds = new Set<string>();
        for (const c of out) for (const sid of c.sourceIds) neededIds.add(sid);

        const provById = new Map<string, ResolvedCitationProvenance[]>();
        await Promise.all(
          [...neededIds].map(async (sid) => {
            const content = contentById.get(sid);
            if (content === undefined) return;
            try {
              const prov = await resolver.resolve(sid, content);
              if (prov.length > 0) provById.set(sid, prov);
            } catch {
              // best-effort: leave this source without resolved provenance
            }
          }),
        );

        if (provById.size > 0) {
          out = out.map((c) => {
            const resolved: Record<string, ResolvedCitationProvenance[]> = {};
            for (const sid of c.sourceIds) {
              const prov = provById.get(sid);
              if (prov) resolved[sid] = prov;
            }
            return Object.keys(resolved).length > 0
              ? { ...c, resolvedCitations: resolved }
              : c;
          });
        }
      }

      return out;
    },
  };
}

/** The text embedded for a cluster: label + salient tokens + representative finding. */
function clusterText(cluster: DistillCluster): string {
  return [cluster.label, cluster.topTokens.join(' '), representativeText(cluster.findings)]
    .filter((s) => s && s.length > 0)
    .join('. ')
    .trim();
}

function representativeText(findings: DistillFinding[]): string {
  return findings.reduce(
    (longest, f) => (f.text.length > longest.length ? f.text : longest),
    findings[0]?.text ?? '',
  );
}

function cosine(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
