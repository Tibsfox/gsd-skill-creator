/**
 * Multimodal Skill Distillation -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/multimodal-skill-distillation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 66 * 2 * Math.PI / 85;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const multimodalSkillDistillation: RosettaConcept = {
  id: "agent-multimodal-skill-distillation",
  name: "Multimodal Skill Distillation",
  domain: 'agent-systems',
  description:
    "Agent skills usually come from an agent's own execution traces, leaving the vast corpus of human-authored tutorial videos, repositories, and articles untapped. RESOURCE2SKILL (arXiv 2606.29538, 2026) distills executable skills directly from these multimodal resources into a hierarchical Skill Wiki, where each entry fuses the complementary signal of every modality — a diagram's structure, a video's timing, prose's rationale — and retains provenance back to its source. Distillation is not one-shot offline: when wiki coverage is insufficient at inference time, the same construction operator acquires new skills online, so the wiki is a continuous supply mechanism rather than a fixed import. Across seven authoring domains this lifts average overall score by +11.9 points over no-skill agents and beats strong harness baselines in 26 of 28 model-domain cells. This opens an acquisition axis orthogonal to self-play: skills can be bootstrapped from what humans already documented, and their origin stays auditable for trust and later refinement.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Specializes the skill-as-artifact stance by fixing the acquisition source: rather than authoring or self-inducing skills, entries are distilled from human multimodal media, yet remain first-class, provenance-bearing artifacts subject to the same lifecycle.",
    },
    {
      type: "analogy",
      targetId: "agent-trace-to-skill-induction",
      description: "Both induce reusable skills, but from opposite sources — trace-to-skill mines an agent's own execution logs while this mines human tutorial media, making the two complementary halves of a single skill-supply pipeline.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-ir-compilation",
      description: "A distilled multimodal wiki entry is largely descriptive; IR compilation is the downstream step that lowers such an entry into an executable, typed intermediate representation the agent can actually run.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hierarchical-memory-navigation",
      description: "The hierarchical Skill Wiki is organized and traversed much like hierarchical memory — coarse categories narrowing to concrete entries — so retrieval over it can reuse hierarchical-navigation techniques.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
