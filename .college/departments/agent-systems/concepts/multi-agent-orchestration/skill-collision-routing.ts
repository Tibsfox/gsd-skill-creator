/**
 * Skill Collision Routing -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/skill-collision-routing
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 124 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillCollisionRouting: RosettaConcept = {
  id: "agent-skill-collision-routing",
  name: "Skill Collision Routing",
  domain: 'agent-systems',
  description:
    "Skill collision names a routing failure in enterprise agents that dispatch queries to specialized skills by matching them against natural-language skill descriptions: when two descriptions overlap, the routing LLM misroutes, and manually retuning descriptions becomes a bottleneck as skills scale to dozens (arXiv 2606.30775, 2026). Its distinct contribution is an automated description-optimization pipeline whose ablation isolates the active ingredient — a single LLM rewrite conditioned on observed false-positive and false-negative cases captures nearly all the gain. On a production 9-skill group-chat agent (372 regression cases) the pipeline reaches 79.2% F1 versus 79.4% for hand-tuned descriptions — a -0.20% difference inside the 0.78% multi-seed noise floor — while cutting per-skill effort from 120 minutes to 3.8 minutes, a 32x speedup; the same ablation replicated on ToolBench (16k tools) is what lifts 'a single rewrite suffices' from one system to a general lesson. It also separates text-fixable collisions from genuinely overlapping scopes, treating a large train-validation F1 gap as a diagnostic that a collision needs architectural, not textual, intervention. For agent systems, it argues skill routing should be tuned from misrouting evidence, and that persistent overlap signals a boundary redesign rather than more prompt-editing.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-intent-routing",
      description: "Skill collision is the characteristic failure mode of description-based intent routing; it presumes the intent-routing mechanism that dispatches a query to a skill by description match and repairs that mechanism's accuracy from misrouting cases.",
    },
    {
      type: "cross-reference",
      targetId: "agent-selector-priority-arbitration",
      description: "When descriptions overlap because scopes genuinely coincide, text optimization cannot fix the misroute; selector priority arbitration supplies the architectural tie-break this concept flags as needed once the train-validation F1 gap signals irreducible overlap.",
    },
    {
      type: "analogy",
      targetId: "agent-label-free-skill-refinement",
      description: "Both improve a skill's metadata automatically from execution feedback instead of hand-labeling — collision routing rewrites descriptions from false-positive and false-negative routing cases, mirroring label-free refinement of skill behavior from unlabeled outcomes.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
