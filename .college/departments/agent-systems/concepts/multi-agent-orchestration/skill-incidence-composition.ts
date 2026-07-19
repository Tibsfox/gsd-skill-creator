/**
 * Skill Incidence Composition -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/skill-incidence-composition
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 78 * 2 * Math.PI / 85;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillIncidenceComposition: RosettaConcept = {
  id: "agent-skill-incidence-composition",
  name: "Skill Incidence Composition",
  domain: 'agent-systems',
  description:
    "Multi-agent teams usually fix two things by hand and separately: which agent holds which capabilities, and who talks to whom. SIGMA (arXiv 2606.19758v1, 2026) instead predicts one task-conditioned skill-agent incidence matrix that simultaneously builds each agent's node embedding — its bundle of reusable skills — and decodes the team's communication topology. Messages travel through skill-specific mailboxes, so routing is capability-addressed: a message reaches whichever agents were assigned the relevant skill, not a fixed address. Agents become derived compositions and topology a byproduct of the same matrix, so both adapt together per task instead of being tuned as independent design choices.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-coordination-surface",
      description: "Specializes the coordination surface by deriving its topology dimension jointly with agent composition from a single predicted skill-agent incidence matrix, rather than treating topology as a shape chosen independently of what each agent can do.",
    },
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Treats the reusable skill artifact as the atomic unit an agent is assembled from; the incidence matrix is precisely a mapping from skill artifacts to the agents that bundle them, so composition presupposes skills being first-class objects.",
    },
    {
      type: "cross-reference",
      targetId: "agent-spectral-topology",
      description: "Complementary views of team topology: SIGMA generates the communication graph from a task-conditioned skill layout, whereas spectral topology scores an already-specified graph pre-dispatch — a generator paired with a diagnostic over the same object.",
    },
    {
      type: "cross-reference",
      targetId: "agent-latent-agent-communication",
      description: "Both replace hand-specified wiring with learned structure over embeddings: SIGMA decodes node embeddings and topology from the incidence matrix, while latent communication governs the medium over which those decoded edges carry state between agents.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
