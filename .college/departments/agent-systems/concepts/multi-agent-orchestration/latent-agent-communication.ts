/**
 * Latent Agent Communication -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/latent-agent-communication
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 17 * 2 * Math.PI / 47;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const latentAgentCommunication: RosettaConcept = {
  id: "agent-latent-agent-communication",
  name: "Latent Agent Communication",
  domain: 'agent-systems',
  description:
    "Agents can coordinate over two media: discrete natural-language tokens, or the continuous representations under them — embeddings, hidden states, or shared KV-caches passed directly between models. Trading latent vectors instead of re-verbalizing skips the discretization bottleneck (sampling discards the full posterior) and avoids redundant re-encoding, lowering inference cost (arXiv 2606.05711v2, 2026). The price is interpretability: a hidden-state channel is not human-readable, so logging, guardrails, and heterogeneous-model transfer weaken or break. This names an axis the coordination surface leaves implicit — the communication medium — orthogonal to topology and dispatch policy. The 2026 lesson: choose the medium per edge — latent between trusted homogeneous models trading high-bandwidth state, natural-language wherever a message must be audited or read by a different agent.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-coordination-surface",
      description: "Adds the communication-medium axis (continuous latent vs natural-language) that the coordination surface's topology and dispatch-policy dimensions leave unspecified, refining it with a new orthogonal design lever.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-isotropic-embedding",
      description: "The fidelity of a latent channel is governed by the geometry of the shared embedding space — isotropy determines how much information survives when representations are passed directly rather than re-verbalized into tokens.",
    },
    {
      type: "cross-reference",
      targetId: "agent-episode-package",
      description: "The natural-language medium is what makes traces loggable as auditable episode packages; a latent channel buys inference cost by forfeiting that human-readable record.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
