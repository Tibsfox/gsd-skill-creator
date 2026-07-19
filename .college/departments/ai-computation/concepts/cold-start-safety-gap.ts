/**
 * Cold Start Safety Gap concept -- tool-calling agents are least safe at session start.
 *
 * SODA (2026) shows tool-calling agents occupy an unsafe hidden-state region at
 * the very start of a session and only migrate toward a safety-aligned region after
 * completing several regular agentic tasks -- a measurable cold-start gap of 9-52%
 * (arXiv 2606.07867).
 *
 * @module departments/ai-computation/concepts/cold-start-safety-gap
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/23, radius ~0.78 (alignment phenomenon, concrete-ish)
const theta = 3 * 2 * Math.PI / 23;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const coldStartSafetyGap: RosettaConcept = {
  id: 'ai-computation-cold-start-safety-gap',
  name: 'Cold Start Safety Gap',
  domain: 'ai-computation',
  description: 'Agent safety is not constant across a session: tool-calling agents are least safe at ' +
    'the very start and grow safer as the session deepens. SODA (Safety Over Depth for Agents, ' +
    'arXiv 2606.07867, 2026) controls how many regular agentic tasks an agent completes — up to 20 — ' +
    'before it meets a safety threat, and gives representation-level evidence: the model\'s hidden ' +
    'state begins in an unsafe region and only migrates toward a safety-aligned region after several ' +
    'such tasks, a measurable cold-start gap of 9-52% across 7 models from 4 families. A causal ' +
    'decomposition isolates the driver — the regular agentic tasks themselves are the primary source ' +
    'of the safety gain, while the agent\'s own prior responses matter less for safety but are ' +
    'essential for preserving later utility. This inverts the usual drift picture: rather than safety ' +
    'eroding over time, it is warm-up-dependent, accruing with task depth from a cold start, which ' +
    'argues for priming an agent with real tasks before exposing it to sensitive actions.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'The inverse of alignment drift: drift erodes instruction fidelity as a session runs, the cold-start gap shows safety alignment instead improving with task depth from an unsafe start',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-goal-drift',
      description: 'Both track a safety/goal-relevant hidden state across a session; the cold-start gap is a session-position effect on that trajectory rather than a slow substitution',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-four-tier-trust',
      description: 'Session-depth-dependent safety maps onto trust tiers: a cold-started agent should sit at a lower trust tier until its hidden state reaches the safety-aligned region',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
