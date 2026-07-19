/**
 * Declarative Agent Control -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agentic-code-generation/declarative-agent-control
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 31 * 2 * Math.PI / 47;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const declarativeAgentControl: RosettaConcept = {
  id: "agent-declarative-agent-control",
  name: "Declarative Agent Control",
  domain: 'agent-systems',
  description:
    "An agent handed natural-language skill files in its system prompt directs its own control flow, rather than being stepped through an externally coded state machine. The 2026 formalization (arXiv 2606.06923v1, 2026) names this the declarative orchestration paradigm and sets it against imperative scaffolding along a single control-flow-locus axis: declarative policies vest orchestration in the agent reading NL specs, imperative policies vest it in code the agent merely obeys. This is exactly the paradigm the skill-library approach embodies — the skill file is the policy, not a subroutine. The implication for building agent systems is that the two loci are distinct policy classes with different failure modes: declarative control drifts and misreads intent, imperative control breaks on brittle branch coverage. Choosing the locus is an architectural decision, not an implementation detail.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-dynamic-autonomy",
      description: "Refines dynamic autonomy by adding an orthogonal control-flow-locus axis: autonomy sets how much authority the agent holds, declarative control sets whether the agent directs its own flow from NL specs or is driven by external code.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-as-artifact",
      description: "The NL skill files that carry the declarative policy are skill artifacts; declarative agent control is the orchestration paradigm the skill-as-artifact library embodies.",
    },
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "The control-flow locus is a harness property — the harness injects skill files into the system prompt and decides whether orchestration lives with the agent or with scaffolding code.",
    },
    {
      type: "cross-reference",
      targetId: "agent-llm-as-code",
      description: "LLM-as-code marks the imperative pole of the same axis, where control flow is expressed as executable code the agent runs, contrasted here with declarative NL policy the agent reads.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
