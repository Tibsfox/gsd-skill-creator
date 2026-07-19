/**
 * Algorithm Steering -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/algorithm-steering
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 48 * 2 * Math.PI / 85;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const algorithmSteering: RosettaConcept = {
  id: "agent-algorithm-steering",
  name: "Algorithm Steering",
  domain: 'agent-systems',
  description:
    "LLM code generators produce many behaviourally-correct programs for one spec, but which algorithm family they emit — recursive vs iterative, hashing vs sorting — is swayed by incidental prompt cues: wording, metadata, even typography. The Invisible Lottery (arXiv 2606.04057) names this cue-induced shift in output policy under fixed correctness: every candidate passes the same tests, so correctness-based selection is blind to it. For agent systems, non-functional properties like complexity, style, and security posture then drift with irrelevant surface features unless output policy is measured and controlled explicitly.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-execution-grounded-selection",
      description: "Specializes execution-grounded selection to the residual case it cannot resolve: when every candidate is behaviourally correct, execution grounding clusters them as equivalent, yet algorithm family still varies with prompt cues. Output policy is the orthogonal axis that correctness-based selection leaves undetermined.",
    },
    {
      type: "analogy",
      targetId: "agent-silent-failure-taxonomy",
      description: "Like a silent failure, a cue-steered algorithm choice passes every test and raises no error, so the shift stays invisible to standard pass/fail gates; both name a class of variance that evades correctness signals entirely.",
    },
    {
      type: "cross-reference",
      targetId: "agent-evaluator-validity-audit",
      description: "When a test suite accepts all algorithm families equally, it under-determines the output; steering exposes an evaluator-validity blind spot, motivating audits of what a correctness gate actually discriminates versus what it silently permits.",
    },
    {
      type: "cross-reference",
      targetId: "agent-harness-as-substrate",
      description: "The steering cues — wording, metadata, typography — live in the prompt and harness, so the harness acts as a latent substrate that shapes which algorithm family gets generated, not merely how the agent executes.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
