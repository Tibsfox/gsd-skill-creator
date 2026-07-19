/**
 * Operational Anchor Preservation -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/operational-anchor-preservation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 115 * 2 * Math.PI / 47;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const operationalAnchorPreservation: RosettaConcept = {
  id: "agent-operational-anchor-preservation",
  name: "Operational Anchor Preservation",
  domain: 'agent-systems',
  description:
    "Skill rewriting is not prompt compression: a skill's sparse operational anchors — API and code anchoring, workflow guards, and rule or formula anchoring — are load-bearing cues, not filler to trim (arXiv 2606.09421v2, 2026). Cutting them shortens the prompt but strips the guidance that keeps an agent from costly exploration, blind debugging, and error recovery, so a leaner skill can raise runtime cost per task even as token count falls. The governing axis is quality-cost, not length: fewer tokens up front can buy more tokens, tool calls, and wall-clock downstream. The paper reports no single universally best rewrite strategy — which anchors are load-bearing differs by task, so compression that helps one workflow degrades another. A learned rewrite policy that preserves the right anchors cuts total cost by about 7.0% and downstream agent-token cost by about 6.0% on held-out tasks, and — the key practical signal — those savings roughly double to 14.7% and 13.7% under frozen cross-model transfer, all while verifier quality is preserved: anchor preservation pays off most when a skill is authored on one model and run on another. For agent builders, this reframes skill authoring as anchor preservation under a total-cost budget, not minimization of the artifact's surface.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Extends the skill-as-artifact view: the durable artifact is not freely compressible, because its sparse operational anchors are load-bearing cues whose removal raises task cost.",
    },
    {
      type: "cross-reference",
      targetId: "agent-counterfactual-utility",
      description: "Counterfactual utility measures whether a skill helps at all; anchor preservation warns that a length-cutting rewrite can flip a net-positive skill negative by inflating exploration and recovery cost.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "Deleting a workflow guard is a canonical silent failure: the agent still succeeds but pays more in tokens, tool calls, and debugging, with no crash to signal the regression.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-ir-compilation",
      description: "Compiling a skill into a compact intermediate representation is itself a rewrite; anchor preservation bounds what that compilation may strip without degrading runtime cost.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
