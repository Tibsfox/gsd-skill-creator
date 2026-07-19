/**
 * Loop Specification -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/loop-specification
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 62 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const loopSpecification: RosettaConcept = {
  id: "agent-loop-specification",
  name: "Loop Specification",
  domain: 'agent-systems',
  description:
    "Step-by-step prompting makes a human the agent's runtime scheduler, re-issuing instructions every turn. Loop Engineering (arXiv 2607.00038, 2026) replaces this with a loop specification: a bounded, reusable artifact bundling five fields — trigger, goal, a verification step, a stopping rule, and memory — handed once to an agent harness, which then pursues the goal on its own. The insight is externalizing the control loop as a declarative object separate from the harness that runs it, so autonomy becomes something you author, version, and reuse rather than improvise per turn. It matters because it turns \"how autonomous should this agent be\" into an inspectable, testable input instead of emergent runtime behavior.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-dynamic-autonomy",
      description: "Specializes dynamic autonomy into a concrete authored artifact: where the parent describes an agent modulating its own level of independence at runtime, a loop specification is the externalized, versionable object that grants and bounds that autonomy up front via explicit goal, verification, and stopping fields.",
    },
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "Draws the paper's core separation: the loop specification is the control-loop artifact a human hands in, while the harness is the substrate that executes it — distinguishing what is run from what runs it, so the same harness can enact many different loop specs.",
    },
    {
      type: "analogy",
      targetId: "agent-declarative-agent-control",
      description: "Both replace imperative, step-by-step prompting with a declarative artifact that states goal and constraints once and lets the runtime enact them, rather than the human sequencing each action.",
    },
    {
      type: "analogy",
      targetId: "agent-skill-as-artifact",
      description: "Shares the move of packaging a bounded, reusable capability as a named, portable, inspectable artifact instead of transient in-context instructions that vanish after the turn.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
