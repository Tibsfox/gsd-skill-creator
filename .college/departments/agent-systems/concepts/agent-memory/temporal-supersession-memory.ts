/**
 * Temporal Supersession Memory -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/temporal-supersession-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 87 * 2 * Math.PI / 47;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const temporalSupersessionMemory: RosettaConcept = {
  id: "agent-temporal-supersession-memory",
  name: "Temporal Supersession Memory",
  domain: 'agent-systems',
  description:
    "A retrieval memory conflates two very different relations under one geometry: cosine similarity cannot separate a contradiction from a duplicate — on a calibrated dataset it tells the two apart at AUROC 0.59, near chance — so a vector store co-retrieves a stale fact alongside the very replacement that should have retired it (arXiv 2606.26511v1, 2026). The remedy, MemStrata, is not a sharper embedding but a deterministic layer above it: timestamp every fact and key it by a structured (subject, relation, object) triple in a bi-temporal ledger, so a newer fact sharing subject and relation supersedes and retires the prior object — with no similarity threshold and no LLM call — rather than sitting beside it in the top-k. Hash-based deduplication catches only byte-identical repeats; contradiction-retirement is exactly the semantic case it misses. Across six benchmarks with a local 7B model MemStrata ties RAG on static recall yet reaches 0.95–1.00 accuracy on evolving knowledge where RAG manages only 0.20–0.47; its central result is the stale-fact-error rate — forced to answer, RAG serves superseded values 15–40% of the time while MemStrata drives this to ~0% — achieved at ~2.1s retrieval latency versus ~16–18s for LLM-reranking baselines. The transferable lesson for agent systems: recency and non-contradiction are invariants a retriever must enforce structurally, not properties to hope the vector space happens to encode.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-content-addressed-storage",
      description: "Content-addressed hash-dedup retires only byte-identical duplicates on the substrate; temporal supersession extends that guarantee to retire semantic contradictions, which hash to different records and so survive dedup.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "A supersession-pruned store is what hybrid retrieval should index — otherwise the dense channel co-retrieves a fact its (subject, relation, object) replacement has already retired.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "Consolidation promotes and merges engrams by activation; supersession is the orthogonal retire-on-contradiction rule, keyed by timestamp and triple identity rather than by usage.",
    },
    {
      type: "analogy",
      targetId: "data-science-bitemporal-versioning",
      description: "Like a valid-time database that closes a row's validity interval when a newer version of the same key arrives, rather than keeping both tuples live.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
