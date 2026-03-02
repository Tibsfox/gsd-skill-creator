import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artCreativeBlock: RosettaConcept = {
  id: 'art-creative-block',
  name: 'Creative Block',
  domain: 'art',
  description:
    'Creative block is the experience of being unable to produce new work despite the desire ' +
    'to do so. It arises from perfectionism (fear that output won\'t match internal standards), ' +
    'external pressure (deadlines, audience expectations), creative exhaustion, or unclear intent. ' +
    'Strategies for working through block include: timed sketching without self-editing (process ' +
    'over product), changing medium or scale, working from direct observation rather than imagination, ' +
    'copying masters to study structure, and setting arbitrary constraints (draw with non-dominant ' +
    'hand, use only two colors). Julia Cameron\'s "morning pages" practice externalizes internal ' +
    'critics through daily free-writing. Understanding block as a natural creative rhythm — not ' +
    'failure — allows artists to sustain long-term practice through fallow periods.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-portfolio-building',
      description: 'Sustained portfolio development requires strategies for navigating and recovering from creative blocks',
    },
    {
      type: 'analogy',
      targetId: 'learn-growth-mindset',
      description: 'Both creative block recovery and growth mindset require reframing failure as part of the learning process',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
