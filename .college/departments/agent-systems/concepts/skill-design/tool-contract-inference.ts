/**
 * Tool-Contract Inference -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/tool-contract-inference
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 122 * 2 * Math.PI / 47;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const toolContractInference: RosettaConcept = {
  id: "agent-tool-contract-inference",
  name: "Tool-Contract Inference",
  domain: 'agent-systems',
  description:
    "Most tool interfaces tell an agent HOW to invoke something — a JSON schema, argument types, a syntactic signature — while staying silent on WHEN invoking it is causally appropriate. Contract2Tool closes that gap by inferring per-tool contracts (preconditions, effects, risk level, cost) from metadata, schemas, documentation, and execution traces, normalizing observable evidence into symbolic contracts (arXiv 2606.07904v1, 2026). This splits tool governance into two layers: a syntactic call-interface and an inferred appropriateness-contract that predicts what a call will change and what it will cost. The 2026 finding is that this evidence-derived contract can be recovered from traces even when documentation is thin or absent, letting the agent reason about causal fit rather than pattern-matching invocation shapes. For agent systems, it means tool selection can be gated on inferred effects and risk, not just schema-validity — a call that type-checks can still be contract-inappropriate.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-privilege-boundary",
      description: "Extends the declared skill-manifest permission boundary from statically-declared allow-lists to an inferred, evidence-derived per-tool contract that also carries preconditions, effects, risk, and cost.",
    },
    {
      type: "cross-reference",
      targetId: "agent-causal-tool-frontier",
      description: "Supplies the per-tool causal appropriateness signal (when a tool is right, not just callable) that the causal-tool-frontier uses to bound which tools an agent should reach for.",
    },
    {
      type: "dependency",
      targetId: "agent-execution-grounded-selection",
      description: "Relies on the same execution-trace evidence, mining observed effects and outcomes from real runs to distill contracts rather than trusting declared metadata alone.",
    },
    {
      type: "cross-reference",
      targetId: "agent-knowing-doing-gap",
      description: "Directly attacks the knowing-doing gap by separating knowing HOW to call a tool (schema fluency) from knowing WHEN a call is causally warranted (the inferred contract).",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
