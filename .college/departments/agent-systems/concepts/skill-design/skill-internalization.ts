/**
 * Skill Internalization -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/skill-internalization
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 79 * 2 * Math.PI / 85;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillInternalization: RosettaConcept = {
  id: "agent-skill-internalization",
  name: "Skill Internalization",
  domain: 'agent-systems',
  description:
    "Externalized skill libraries force an agent to run a skill generator and query an inference-time skill bank on every task, adding retrieval latency and a maintenance surface. SIRI (arXiv 2606.02355) instead internalizes skills in three phases: a GiGPO warmup that acquires basic interaction ability and collects skill-free successful trajectories; self-skill mining, where the current policy summarizes compact skills from its own plain rollouts and validates each by paired execution — running the task with and without the skill and keeping only those that measurably help; and a selective distillation that folds ONLY the beneficial skill-guided action tokens back into the plain policy, weighted by trajectory-level utility and action-level advantage rather than absorbing whole trajectories. Skills become parametric rather than artifacts, so at inference the agent runs on the original prompt with no external generator or runtime skill bank; the cost is that internalized skills are no longer independently inspectable or hot-swappable. On ALFWorld and WebShop with Qwen2.5-7B-Instruct, SIRI lifts GiGPO from 0.908 to 0.930 and from 0.728 to 0.813 respectively, with self-mining rivaling distillation from a closed-source large model.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Inverts the parent's core commitment: where skill-as-artifact keeps a skill as an external, inspectable file loaded at inference time, internalization absorbs the validated skill into policy weights, trading inspectability and hot-swapping for zero runtime retrieval.",
    },
    {
      type: "cross-reference",
      targetId: "agent-in-weight-skill",
      description: "Both realize skills as parameters rather than text; in-weight-skill names the resulting representation, while internalization names the mine-validate-absorb pipeline that produces it and removes the runtime skill bank.",
    },
    {
      type: "dependency",
      targetId: "agent-paired-trace-audit",
      description: "Depends on paired skill-augmented versus skill-free execution to decide which mined candidates are worth absorbing — the same with/without comparison that paired-trace-audit formalizes as a validity gate before any weight update.",
    },
    {
      type: "cross-reference",
      targetId: "agent-experience-internalization-collapse",
      description: "Names the characteristic failure mode of this loop: repeatedly folding self-generated experience back into weights can collapse behavioral diversity or amplify errors, bounding how aggressively skills can be internalized.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
