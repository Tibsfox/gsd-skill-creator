/**
 * Compositional Skill Evolution -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/compositional-skill-evolution
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 108 * 2 * Math.PI / 47;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const compositionalSkillEvolution: RosettaConcept = {
  id: "agent-compositional-skill-evolution",
  name: "Compositional Skill Evolution",
  domain: 'agent-systems',
  description:
    "Treat skill construction as three learnable operations — create, improve, and merge — so an agent self-evolves its own library at inference time instead of shipping a frozen skill set (SkillComposer, arXiv 2606.06079v1, 2026). The clean axis it names is specification versus generalization: a skill written tightly to one task specifies well but transfers poorly, while an over-general skill transfers but under-serves the task that needs it. The 2026 finding is that these operators, applied online, let an agent slide along that axis on demand — specializing when a task is idiosyncratic, generalizing when a pattern recurs. Merge is the non-obvious operator: without it a growing library accrues near-duplicate skills (duplication drift) that dilute selection. For builders, a skill library becomes a maintained population under create/improve/merge pressure, not an append-only log.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "The create/improve/merge operators presuppose the typed-artifact framing — you can only construct, mutate, and combine a skill that is a first-class object, not free prose.",
    },
    {
      type: "cross-reference",
      targetId: "agent-trace-to-skill-induction",
      description: "Trace-to-skill induction is one concrete mechanism for the create operator: it manufactures a new skill artifact from execution traces that the evolution loop can then improve or merge.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-coverage-metric",
      description: "The merge operator exists to fight duplication drift, and a coverage metric is what detects the near-duplicate redundancy that signals two skills should be merged.",
    },
    {
      type: "cross-reference",
      targetId: "agent-capability-controlled-self-evolution",
      description: "Inference-time self-evolution via these operators must be bounded — capability control constrains what create/improve/merge are permitted to change so the library does not drift out of its privilege envelope.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
