/**
 * Exploration Skill Discovery -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/exploration-skill-discovery
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 135 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const explorationSkillDiscovery: RosettaConcept = {
  id: "agent-exploration-skill-discovery",
  name: "Exploration Skill Discovery",
  domain: 'agent-systems',
  description:
    "ASPIRE (Agentic Skill Programming through Iterative Robot Exploration) is a continual-learning system that autonomously writes and refines robot control programs under a code-as-policy paradigm, compounding execution experience into a reusable skill library (arXiv 2607.00272, 2026). It runs an open-ended loop of three parts: a closed-loop execution engine that exposes fine-grained multimodal traces for autonomous failure diagnosis, repair synthesis, and validation; a continually expanding library that distills validated fixes into transferable skills; and evolutionary search that generates diverse task sequences and programs, exploring beyond single-trajectory refinement. Discovered skills persist across tasks and embodiments, surpassing prior methods by up to 77% on LIBERO-Pro manipulation under perturbation, 72% on Robosuite bimanual handover, and 32% on BEHAVIOR-1K long-horizon household tasks; the accumulated library then enables zero-shot generalization to unseen long-horizon work, reaching 31% success on LIBERO-Pro Long versus 4% for prior methods that rely on test-time reasoning and retries. The paper reports only initial evidence of sim-to-real transfer, substantially reducing real-robot programming effort across embodiments and robot APIs rather than claiming full reality transfer. The code-as-policy substrate — skills are executable control programs the model authors and repairs, not opaque parameters — is what makes this an agent-systems concept and not solely a robotics result: for agent builders, repair-and-validate traces, once distilled, become a transferable library rather than a per-task patch.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-llm-as-code",
      description: "Exploration Skill Discovery depends on the code-as-policy substrate, since ASPIRE's skills are executable control programs the model authors and repairs rather than opaque parameters.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-skill-evolution",
      description: "Both replace single-trajectory refinement with evolutionary search over diverse programs, but ASPIRE grounds each variant in closed-loop robot execution traces rather than text-level composition.",
    },
    {
      type: "cross-reference",
      targetId: "agent-trace-to-skill-induction",
      description: "ASPIRE's library step is trace-to-skill induction specialized to robotics: validated repairs mined from multimodal execution traces are distilled into transferable, reusable skills.",
    },
    {
      type: "cross-reference",
      targetId: "agent-active-experimentalist",
      description: "Both are training-free-ish exploration methods that accrete a reusable, composable skill library, so they must state their distinguishing axis: active-experimentalist (HExA) does query-relevant experiment design — deliberately probing the environment to resolve the current task's uncertainty — whereas exploration-skill-discovery does evolutionary program search, mutating and selecting whole programs to grow the library. Naming the sibling keeps the pair from collapsing into a perceived duplicate.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
