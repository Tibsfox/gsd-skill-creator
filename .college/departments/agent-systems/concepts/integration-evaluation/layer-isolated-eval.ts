/**
 * Layer-Isolated Agent Eval -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/integration-evaluation/layer-isolated-eval
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 128 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const layerIsolatedEval: RosettaConcept = {
  id: "agent-layer-isolated-eval",
  name: "Layer-Isolated Agent Eval",
  domain: 'agent-systems',
  description:
    "Layer-isolated evaluation decomposes a deployed LLM agent into a fixed taxonomy of layers—ontology, intent, routing, decomposition, escalation, safety, memory, and a cross-cutting envelope/defense layer—and exercises each with its own deterministic, no-LLM assertion slice run in CI against a locked per-slice baseline (arXiv 2606.11686, 2026). Its distinct contribution is exposing masking: under controlled single-layer regression injection, the aggregate task-success pass-rate barely moves while the matching slice craters and the damage stays off other slices, so per-slice baseline-locked gates localize regressions that one aggregate number hides. A coverage-honesty criterion further refuses to score any layer left unexercised. For agent builders, the implication is to gate CI on fast, reproducible component-level slices rather than a single end-to-end score, turning \"the agent regressed\" into \"this layer regressed.\"",
  panels: new Map(),
  relationships: [
    {
      type: "analogy",
      targetId: "agent-counterfactual-audit",
      description: "Both isolate a component's causal contribution by controlled ablation: layer-isolated eval degrades one layer at a time to see its slice crater, just as counterfactual auditing runs a task with a component held out to attribute effect.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "Per-slice baseline-locked gates surface exactly the layer-local faults an aggregate pass-rate masks, catching the kind of degradations the silent-failure taxonomy catalogs before they reach production.",
    },
    {
      type: "analogy",
      targetId: "agent-skill-coverage-metric",
      description: "The coverage-honesty criterion that refuses to score an unexercised layer mirrors the skill-coverage metric's test-adequacy stance, which reports which instructions a trajectory actually exercised rather than assuming untested behavior passes.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
