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
    "ASPIRE (Agentic Skill Programming through Iterative Robot Exploration) is a continual-learning system that autonomously writes and refines robot control programs under a code-as-policy paradigm, compounding execution experience into a reusable skill library (arXiv 2607.00272, 2026). It runs an open-ended loop of three parts: a closed-loop execution engine that exposes fine-grained multimodal traces for autonomous failure diagnosis, repair synthesis, and validation; a continually expanding library that distills validated fixes into transferable skills; and evolutionary search that generates diverse task sequences and programs, exploring beyond single-trajectory refinement. Its distinct contribution is that discovered skills persist across tasks, simulation and reality, and embodiments, enabling zero-shot generalization to unseen long-horizon work. For agent builders, it shows that repair-and-validate traces, once distilled, become a transferable library rather than a per-task patch.",
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
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
