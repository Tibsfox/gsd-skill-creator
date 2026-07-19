/**
 * Single-Token Memory Compression -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/single-token-memory-compression
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 122 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const singleTokenMemoryCompression: RosettaConcept = {
  id: "agent-single-token-memory-compression",
  name: "Single-Token Memory Compression",
  domain: 'agent-systems',
  description:
    "Latent Memory (arXiv 2606.10572, 2026) is a latent-space memory paradigm that replaces each raw text or image evidence item with a single high-dimensional latent token produced by a small compressor LLM/VLM. Instead of retrieving raw evidence for generation, it operates in one unified latent space: the query is embedded to retrieve relevant latent tokens, which are then prompted directly to a pretrained LLM or VLM for answer generation. Its distinct contribution is training the compressor end-to-end under reconstruction, contrastive, and distillation objectives so each token is simultaneously good for reconstruction, retrieval, and generation. On text-only and multimodal QA it matches strong RAG baselines while consuming three-to-ten-times fewer generator tokens. For agent systems this means external memory can be stored, retrieved, and consumed as compact latent tokens, cutting both token cost and storage pressure for retrieval-augmented reasoning.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-non-readable-inter-model-encoding",
      description: "Both feed non-human-readable latent representations directly into a downstream model; Latent Memory's compressor tokens are exactly such an inter-model encoding consumed by the generator without ever being decoded to text.",
    },
    {
      type: "analogy",
      targetId: "agent-memory-consolidation",
      description: "Compressing each raw evidence item into a single informative latent token is a distillation-driven analogue of consolidating verbose memory into a compact durable form for later recall.",
    },
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Latent Memory still relies on a retrieval step, embedding the query into the shared latent space to select relevant tokens, so it depends on the retrieval substrate rather than replacing it.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
