import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scienceAndSociety: RosettaConcept = {
  id: 'sci-science-and-society',
  name: 'Science & Society',
  domain: 'science',
  description:
    'Science and society are in constant dialogue: social values shape what questions get funded; ' +
    'scientific findings reshape social practices. Topics include scientific funding, research ethics, ' +
    'science communication, policy-making under uncertainty, and the history of science\'s relationship ' +
    'with power, colonialism, and diversity. Understanding this context helps learners evaluate how and ' +
    'why scientific knowledge is produced and applied.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-landmark-discoveries',
      description: 'Scientific discoveries have social consequences that illustrate the science-society relationship',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-scientific-literacy',
      description: 'Science-society topics are central to the critical thinking skill of scientific literacy',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
