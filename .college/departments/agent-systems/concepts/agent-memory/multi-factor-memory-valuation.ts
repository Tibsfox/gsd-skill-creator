/**
 * Multi-Factor Memory Valuation -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agent-memory/multi-factor-memory-valuation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 120 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const multiFactorMemoryValuation: RosettaConcept = {
  id: "agent-multi-factor-memory-valuation",
  name: "Multi-Factor Memory Valuation",
  domain: 'agent-systems',
  description:
    "Multi-Factor Memory Valuation scores each candidate memory m with a value function V(m)=Σ wᵢ fᵢ(m) over seven interpretable factors drawn from cognitive psychology—emotional intensity, goal relevance, value alignment, self/user relevance, task utility, reliability, and usage history—whose weights are learned from a downstream objective via a gradient-free optimiser (arXiv 2606.12945, 2026). Its distinct contribution is that one scalar uniformly governs encoding depth, forget risk, and retrieval rank, and that the forgetting decision is made at consolidation time, before the future query is known—so query-time semantic similarity, which production systems rely on, is correctly down-weighted. On LongMemEval's blind regime a learned weighting retains 0.770 of gold evidence across 479 usable cases, versus 0.657 uniform, 0.518 for the best single factor, and 0.368 recency. The learned weights are interpretable—reliability, emotional intensity, and self/user relevance dominate while query-time goal similarity is correctly down-weighted for the forgetting decision—and a controlled synthetic task with planted confounds confirms the learner recovers a separating weighting (1.00 retention) where uniform weighting fails (0.62). For agent builders, it shows memory retention should be optimized against downstream task utility, not similarity or recency heuristics.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Consolidation is where V(m) is applied: the multi-factor scalar sets each memory's encoding depth and forget risk during the consolidation pass, making valuation the concrete scoring rule that the consolidation step executes.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-depth",
      description: "The single scalar V(m) directly parameterizes memory depth—higher-value memories are encoded more deeply—so this valuation supplies the graded criterion that depth-tiered storage needs to decide how much to keep.",
    },
    {
      type: "analogy",
      targetId: "agent-anticipatory-memory",
      description: "Both commit to a keep-or-forget decision before the triggering future query exists; anticipatory memory pre-stages likely-needed content, while multi-factor valuation deliberately down-weights query-time similarity for that same before-the-query forgetting call.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
