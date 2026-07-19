/**
 * Causal Tool Frontier -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agentic-code-generation/causal-tool-frontier
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 24 * 2 * Math.PI / 47;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const causalToolFrontier: RosettaConcept = {
  id: "agent-causal-tool-frontier",
  name: "Causal Tool Frontier",
  domain: 'agent-systems',
  description:
    "Expose only the minimal set of next-step tools that are causally sufficient to move the current state toward the goal — selected through lightweight precondition-effect contracts — instead of every semantically relevant tool. This training-free method, Causal Minimal Tool Filtering (CMTF), is the proposal of the 2026 study (arXiv 2606.06284v1, 2026); its finding is that the alternative — flooding the menu with all contextually-matched tools (the all-tools / semantic-relevance baseline) — inflates both selection error and context cost, because each irrelevant-but-plausible tool is one more way for the agent to pick wrong. The design axis is causal sufficiency, not semantic relevance: a tool belongs on the frontier only if its effect can satisfy a precondition the goal actually needs. Across 102 tasks, 100 tools, four LLM backends, and 2448 task-method-model runs, CMTF cuts the visible menu from 100 tools to one per step and reduces token usage by about 90% versus all-tools exposure, while matching the strongest causal baseline in aggregate success. This refines the harness's tool-access responsibility — the substrate should present the frontier, not the whole catalog. Over-exposure is therefore a harness failure mode, not a model weakness.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "Refines the harness's tool-access responsibility: the substrate should expose the causally-sufficient next-step frontier rather than the full tool catalog, moving over-exposure from a model failing into a harness design defect.",
    },
    {
      type: "dependency",
      targetId: "agent-tool-contract-inference",
      description: "The precondition-effect contracts that decide frontier membership are exactly the tool contracts produced by contract inference; without them causal sufficiency cannot be computed.",
    },
    {
      type: "cross-reference",
      targetId: "agent-goal-state-inference",
      description: "Causal sufficiency is measured against an inferred goal-state — you cannot judge which tools advance toward the target without knowing what the target state is.",
    },
    {
      type: "analogy",
      targetId: "agent-counterfactual-audit",
      description: "The frontier acts as a counterfactual filter — a tool stays only if removing it would change the reachable next state — mirroring the counterfactual audit idea that an element is defined by the difference between its presence and its absence.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
