import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const claimsEvidenceReasoning: RosettaConcept = {
  id: 'sci-claims-evidence-reasoning',
  name: 'Claims-Evidence-Reasoning (CER)',
  domain: 'science',
  description:
    'The CER framework structures scientific argument: a Claim states the answer to the question; ' +
    'Evidence is specific data that supports the claim; Reasoning connects evidence to claim using ' +
    'scientific principles. CER is the backbone of scientific writing, lab reports, and oral presentations. ' +
    'It prevents the common error of stating opinion without grounding it in data.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-evidence-conclusions',
      description: 'The evidence component of CER comes from the data analysis and conclusion phase',
    },
    {
      type: 'analogy',
      targetId: 'crit-argument-structure',
      description: 'CER is science\'s version of the claim-evidence-reasoning structure of logical argument',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
