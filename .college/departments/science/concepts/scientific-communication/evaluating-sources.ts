import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const evaluatingSources: RosettaConcept = {
  id: 'sci-evaluating-sources',
  name: 'Evaluating Scientific Sources',
  domain: 'science',
  description:
    'Not all sources of scientific information are equally reliable. Peer-reviewed journal articles, ' +
    'scientific consensus statements, and government health agencies represent high-quality sources. ' +
    'Single studies, non-peer-reviewed websites, and press releases require more skepticism. ' +
    'Evaluating who funded a study, the sample size, and whether findings have been replicated helps ' +
    'distinguish reliable science from misinformation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-peer-review',
      description: 'Peer review is the primary quality-control mechanism that makes sources more trustworthy',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-media-literacy',
      description: 'Evaluating scientific sources is a specialized application of media literacy skills',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
