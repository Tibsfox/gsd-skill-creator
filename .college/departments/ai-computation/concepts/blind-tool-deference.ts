/**
 * Blind Tool Deference -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/blind-tool-deference
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 20 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const blindToolDeference: RosettaConcept = {
  id: "ai-computation-blind-tool-deference",
  name: "Blind Tool Deference",
  domain: 'ai-computation',
  description:
    "Blind Tool Deference names the empirical failure of ReAct-style LLM agents to exercise judgment over a callable expert tool. When a frozen graph neural network is exposed as an explicit tool for node classification on text-attributed graphs (ogbn-arxiv, WikiCS), the agent's predictions match the raw GNN 97.6-99.2% of the time across seeds, collapsing into a \"GNN parrot\" that adopts the tool's output wholesale and bypasses its own reasoning (arXiv 2606.14476, 2026). Its distinct contribution is showing this is not a weak-model artifact: sweeping Qwen2.5 from 1.5B to 7B, agreement with the tool rises with capability (0.60 to 0.98) rather than shrinking. The cost of deferring does not shrink either — a per-node oracle over the available actions beats the parrot by 0.09-0.18 at 3B and 0.12-0.22 at 7B, roughly doubling at high homophily, and at 7B a simple neighbour-label tool actually overtakes the GNN at high homophily (0.81 vs 0.71) yet the agent still defers. A selective-invocation gate recovers about half that high-homophily gap (0.71 to 0.83) but yields no net global gain, and held-out estimates bound the best achievable gate to at most a third of the oracle headroom: reliable selective invocation is limited by available test-time information, not router design. For agent systems, tool-augmented pipelines cannot assume the agent adds judgment atop a tool; selective invocation must be engineered, not expected to emerge from scale.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "ai-computation-utilization-accuracy-gap",
      description: "Both measure a mismatch between how strongly an external signal is adopted and the accuracy that adoption actually delivers: blind deference is over-utilization of a tool whose output no longer maximizes accuracy.",
    },
    {
      type: "dependency",
      targetId: "ai-computation-cost-aware-evidence-selection",
      description: "The paper's proposed remedy — a selective-invocation gate — is an instance of cost-aware selection, deciding per node whether a tool call is worth invoking instead of deferring to it by default.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-contextual-entrainment",
      description: "The GNN parrot is entrained by its tool's output much as a model is entrained by injected context, pinned to an external signal and bypassing its own internal reasoning.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
