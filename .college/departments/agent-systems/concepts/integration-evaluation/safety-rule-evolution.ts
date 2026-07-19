/**
 * Safety Rule Evolution -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/integration-evaluation/safety-rule-evolution
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 75 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const safetyRuleEvolution: RosettaConcept = {
  id: "agent-safety-rule-evolution",
  name: "Safety Rule Evolution",
  domain: 'agent-systems',
  description:
    "Hand-written agent safety rules are brittle and go stale; opaque learned classifiers can block bad actions but cannot be audited or certified for safety-critical deployment. AutoSpec (arXiv 2606.24245) escapes this tradeoff with counterexample-guided inductive synthesis (CEGIS/ILP): from user safe/unsafe annotations it induces compact, human-readable safety rules, treating each misclassified case as a counterexample that refines the candidate ruleset until it converges — and re-synthesizes as deployment surfaces new cases. It matters because the guardrail stays simultaneously adaptive and inspectable: operators can read, edit, and certify the exact rules an agent is bound by, rather than trusting a black box.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-privilege-boundary",
      description: "Specializes the parent's static, hand-declared privilege boundary into rules that are learned and continually re-synthesized from user annotations, replacing a fixed capability fence with an evolving, interpretable safety ruleset that still preserves the parent's goal of an enforceable behavioral limit.",
    },
    {
      type: "cross-reference",
      targetId: "agent-formal-agent-verification",
      description: "Reuses the counterexample-guided synthesis machinery of formal verification: CEGIS treats each misclassified annotation as a counterexample driving the next refinement, so the induced safety rules inherit the same checkable-artifact character rather than being opaque weights.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "The evolved rules become the predicate a compliance-trace check enforces at runtime, while annotated safe/unsafe traces are exactly the signal that drives further rule evolution, closing the loop between runtime checking and offline learning.",
    },
    {
      type: "analogy",
      targetId: "agent-structured-spec-gate",
      description: "Functions like a structured spec gate — the learned rules act as an admission predicate on agent behavior — but the spec here is inductively synthesized from labeled examples rather than authored up front, so the gate's criteria shift as annotations accumulate.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
