/**
 * Compositional Kv Cache -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/compositional-kv-cache
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 83 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const compositionalKvCache: RosettaConcept = {
  id: "agent-compositional-kv-cache",
  name: "Compositional Kv Cache",
  domain: 'agent-systems',
  description:
    "Agents that repeatedly reason over the same document collection re-prefill the whole context on every query. Caching key-value activations per document seems obvious, but naively concatenating independently-computed caches collapses quality: each was formed without attending to the others, so they are non-compositional. Cartridges at Scale distills each document into a compact, composable KV cache trained with dynamic distractor mixing so caches stay coherent when combined, then a budget manager rotates hundreds of per-document cartridges between GPU and persistent storage. This turns a corpus into pluggable, reusable memory that scales without re-prefilling.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-content-addressed-storage",
      description: "Specializes content addressing from raw bytes to precomputed activation state: each document is keyed and fetched as a composable KV cache rather than re-read and re-prefilled, and the budget manager pages these caches like content-addressed blocks between GPU and disk.",
    },
    {
      type: "analogy",
      targetId: "agent-hierarchical-memory-navigation",
      description: "The budget manager rotating hundreds of cartridges between fast GPU memory and persistent storage mirrors hierarchical memory tiering — the hot working set stays resident while cold caches are paged out and recalled on demand.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "Distilling a document into a compact reusable cache is a consolidation step: raw context is compressed into durable memory that later queries reuse without reprocessing the source material.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-depth",
      description: "Sits as an infrastructure-heavy sibling under memory-depth, supplying the low-level KV-cache substrate that makes deep, persistent, per-document memory affordable at hundreds-of-documents scale.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
