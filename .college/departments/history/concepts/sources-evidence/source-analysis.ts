import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sourceAnalysis: RosettaConcept = {
  id: 'hist-source-analysis',
  name: 'Source Analysis (HAPP/SOAPS)',
  domain: 'history',
  description:
    'Source analysis is the systematic examination of a historical document or artifact. ' +
    'Frameworks like HAPP (Historical context, Audience, Purpose, Provenance) or SOAPS ' +
    '(Speaker, Occasion, Audience, Purpose, Subject) guide this process. ' +
    'Key questions: Who created this? For what audience? With what purpose? What does it reveal or conceal? ' +
    'Source analysis prevents naive acceptance of historical documents at face value.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-primary-secondary-sources',
      description: 'Source analysis is applied primarily to primary sources to extract reliable evidence',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
