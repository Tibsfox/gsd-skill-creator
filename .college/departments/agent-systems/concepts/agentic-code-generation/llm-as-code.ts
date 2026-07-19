/**
 * LLM-as-Code -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agentic-code-generation/llm-as-code
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 45 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const llmAsCode: RosettaConcept = {
  id: "agent-llm-as-code",
  name: "LLM-as-Code",
  domain: 'agent-systems',
  description:
    "Treats the language model as a callable subroutine rather than the control loop's driver: a deterministic program owns the looping, branching, and sequencing, while the model keeps full adaptive flexibility inside a call but can never alter the execution path (arXiv 2606.15874v2, 2026). This names an architectural axis — control-flow-ownership inversion — running from the agentic-loop stance (the model decides the next step) to the LLM-as-callable stance (the program decides, the model fills the gap). The paper argues token explosion, control-flow hallucination, and unreliable completion are architectural consequences of assigning deterministic looping to a probabilistic system, not bugs a better prompt or stronger model can fix. Its mechanism: with control in the program, each LLM call's context is assembled from the execution-history call tree — a directed acyclic graph (DAG) — so a call's context length is set by its call depth rather than by accumulation over steps, which is what bounds token growth and makes behaviour auditable and replayable. A computer-use case study grounds the design as practical rather than a theoretical stance, substantially improving the stability of long visual operation sequences. Build implication: place a system on the who-owns-the-loop spectrum deliberately, so reachable states become a property of the program, not an emergent artifact of model choice.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "Refines harness-as-substrate by fixing control-flow ownership in the deterministic harness and demoting the model to a callable leaf, so the execution path is a property the harness guarantees rather than a model choice.",
    },
    {
      type: "cross-reference",
      targetId: "agent-declarative-agent-control",
      description: "Both move the control loop off the model; declarative-agent-control externalizes the path as a declarative spec, whereas LLM-as-code externalizes it as an imperative deterministic program.",
    },
    {
      type: "cross-reference",
      targetId: "agent-intent-routing",
      description: "Intent routing is LLM-as-code in miniature: the program calls the model to classify, then a deterministic dispatcher owns the branch taken on the result.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
