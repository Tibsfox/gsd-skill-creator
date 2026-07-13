/**
 * Semantic DistillEnricher — the real "intelligent fill" pass for cartridge
 * distillation ({@link ./distill.js}). Replaces the identity no-op with an
 * injected, async enricher that (a) discovers semantic cross-references between
 * concept clusters via embedding cosine and (b) optionally synthesizes concept
 * names through an injected LLM namer.
 *
 * OPT-IN · INERT WITHOUT A BACKEND. With no embedder, semantic edges are
 * skipped; with no namer, cluster labels are left untouched; with neither it is
 * exactly {@link ./distill.js asyncIdentityEnricher}. Both backends are injected
 * — the real embedder is {@link ../embeddings/embedding-service.js
 * EmbeddingService} (BGE-small, heuristic fallback); the namer is a plug-in
 * (e.g. a Claude-backed synthesizer) with no default.
 *
 * Ledger-backed citation resolution (attaching resolved source provenance to
 * each concept's citations) is a separable follow-up — it needs the SourceLedger
 * and a change to concept-citation assembly; this enricher owns cross-references
 * and names.
 *
 * Pure of fs/child_process — all IO lives inside the injected backends.
 *
 * @module cartridge/distill-enricher-semantic
 */

import type {
  AsyncDistillEnricher,
  DistillCluster,
  DistillFinding,
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

export interface SemanticEnricherOptions {
  embedder?: DistillEmbedder;
  namer?: DistillNamer;
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
    async enrich(clusters: DistillCluster[]): Promise<DistillCluster[]> {
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
