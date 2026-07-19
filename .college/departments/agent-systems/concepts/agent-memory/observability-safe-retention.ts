/**
 * Observability-Safe Memory Retention concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.10616 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/observability-safe-retention
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 26 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const observabilitySafeRetention: RosettaConcept = {
  id: 'agent-observability-safe-retention',
  name: 'Observability-Safe Memory Retention',
  domain: 'agent-systems',
  description: 'Observability-Safe Memory Retention reframes what a long-horizon language agent keeps in memory as a budget-constrained stochastic optimization problem, not a local per-item scoring rule. As observations, reasoning traces, and retrieved facts exceed the context window, the agent must repeatedly decide which items to retain under a hard budget while accounting for delayed consequences: a miss penalty when a dropped item is later needed, a reacquisition cost to re-fetch it, and a stale penalty when kept evidence goes out of date. arXiv:2606.10616 (2026) formulates this as constrained stochastic optimization with budget feasibility and evidence utility, proves the multi-step problem NP-hard, and introduces OSL-MR (Observability-Safe Learning for Memory Retention), which enforces a strict separation between online-observable features (available at retention time) and offline-available supervision (the realized evidence used to train), so the learned policy stays deployable under the same partial observability it will face in production. An evidence learner trained on realized outcomes is paired with a Mixed-Score heuristic that acts as an online-safe deployable baseline and inductive prior. On LoCoMo and LongMemEval it beats recency-based, Generative-Agents-style, and other heuristic baselines especially under tight budgets, the Mixed-Score prior lifts precision and recall, and on small solvable instances it stays significantly closer to the dynamic-programming optimum than single-step selection, confirming the sequential formulation anticipates future demand shifts. Distinct from Multi-Factor Memory Valuation, which combines static value signals into a per-item score at decision time: this mechanism optimizes a sequential, delayed-cost objective and adds the deployability constraint that supervision leaking future information cannot enter the online policy. For agent systems the implication is that memory managers should be trained and evaluated under the exact observability they run with, or offline metrics will systematically overstate what a live agent can achieve.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-multi-factor-memory-valuation',
      description: 'Both assign value to memory items to guide retention, but Multi-Factor Memory Valuation combines static factors into a decision-time score whereas Observability-Safe Memory Retention solves a sequential budget-constrained optimization over delayed miss, reacquisition, and stale costs.',
    },
    {
      type: 'analogy',
      targetId: 'agent-anticipatory-memory',
      description: 'Both look ahead to future demand rather than retaining by recency; OSL-MR gives the anticipatory stance a formal grounding, showing single-step selection is provably insufficient to anticipate demand shifts and that the sequential formulation stays near the dynamic-programming optimum.',
    },
    {
      type: 'dependency',
      targetId: 'agent-load-bearing-eviction',
      description: 'Eviction under a hard budget is the operative action of this retention policy; the constrained optimization is precisely a principled criterion for which load-bearing items to drop versus keep given delayed reacquisition and miss penalties.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
