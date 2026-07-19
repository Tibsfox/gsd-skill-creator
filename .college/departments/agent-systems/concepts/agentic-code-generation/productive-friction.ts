/**
 * Productive Friction -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/productive-friction
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 136 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const productiveFriction: RosettaConcept = {
  id: "agent-productive-friction",
  name: "Productive Friction",
  domain: 'agent-systems',
  description:
    "Productive Friction is the deliberate introduction of interactional resistance into AI-assisted creative work so that users iterate and reflect rather than accept the first solution-oriented output (arXiv 2606.26626, 2026). Where conventional AI creativity-support tools optimize text prompting for frictionless generation, the SketchifAI prototype compares text, sketch, and sketch-plus-tags input modalities and finds that sketching tends to enhance idea fluency while demanding more effortful expression of intent. Its distinct claim is that friction is not a defect to engineer away: reflection-through-sketching can sustain rather than erode the essential design skills that fully automated assistance risks atrophying. Paradoxically, participants still preferred low-friction text. For agent systems this argues for interfaces that sometimes withhold a frictionless answer, forcing the human collaborator to externalize and revise intent instead of silently outsourcing judgment.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-dynamic-autonomy",
      description: "Both treat the AI's level of initiative as a tunable design variable; productive friction deliberately lowers assistance so the human iterates, which dynamic autonomy would frame as dialing the agent's autonomy down to protect the collaborator's skill.",
    },
    {
      type: "cross-reference",
      targetId: "agent-experience-internalization-collapse",
      description: "Frictionless assistance eroding essential design skills is the human-side counterpart of experience-internalization-collapse, where an agent's own competence degrades as it offloads and internalizes experience without effortful engagement.",
    },
    {
      type: "analogy",
      targetId: "agent-goal-state-inference",
      description: "Reflection-through-sketching externalizes and refines the designer's intent, complementing goal-state inference: instead of the system inferring a latent goal, friction makes the human make that goal explicit and revisable.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
