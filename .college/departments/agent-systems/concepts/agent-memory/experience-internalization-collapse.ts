/**
 * Experience Internalization Collapse -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/experience-internalization-collapse
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 56 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const experienceInternalizationCollapse: RosettaConcept = {
  id: "agent-experience-internalization-collapse",
  name: "Experience Internalization Collapse",
  domain: 'agent-systems',
  description:
    "Baking an agent's accumulated experience back into its weights through repeated fine-tuning is expected to compound skill, but Continual Experience Internalization (arXiv 2606.04703) shows the opposite under multi-iteration learning: each round degrades capability rather than accumulating it — a progressive collapse, not compounding improvement. The paper turns this diagnosis into a three-dimension recipe for stable internalization. (1) Experience Granularity: instance-level detail — verbatim episodes and trajectory-specific specifics — overfits and erodes prior competence, while principle-level experience (abstracted, transferable strategy) is durable and survives internalization. (2) Injection Pattern: step-wise injection, which aligns each piece of experience with the intermediate decision state it applies to, significantly outperforms global injection — a distinction that is critical for long-horizon tool use. (3) Internalization Regime: off-policy context-distillation on high-quality teacher trajectories provides a substantially more stable training signal than on-policy distillation, which is limited to local corrections on student-induced flawed states. The lesson for agent design: keep raw experience in external memory and internalize only distilled principles, inject them step-wise at the decision states they inform, and distill off-policy from teacher trajectories rather than looping episodic traces through the weights.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-engram-maturation",
      description: "Specializes engram maturation by naming its failure mode: when maturation is implemented as iterative weight internalization, instance-level traces collapse capability instead of consolidating it, so only principle-level engrams should be allowed to mature into parameters.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-internalization",
      description: "Both concern moving learned behavior from context into parameters; this concept warns that skill internalization, when iterated over raw experience, degrades rather than compounds the very skills it tries to bake in.",
    },
    {
      type: "cross-reference",
      targetId: "agent-in-weight-skill",
      description: "The in-weight representation is exactly what collapses here — storing episodic, instance-level detail in weights corrupts the parametric skill, arguing that only abstracted principles belong in-weight.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "Motivates external consolidation over parametric internalization: retaining raw episodes in an external memory store and distilling before write-back avoids the instance-level collapse that repeated weight-baking induces.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-depth",
      description: "Supplies the admission rule for write-side depth: this concept's finding that only principle-level experience survives internalization is exactly what Memory Depth's surprise/valence write-gate should enforce — consolidate abstracted, goal-relevant strategy into the parametric store, not instance-level episodic detail.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
