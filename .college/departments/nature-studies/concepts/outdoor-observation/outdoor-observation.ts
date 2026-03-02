import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const outdoorObservation: RosettaConcept = {
  id: 'nature-outdoor-observation',
  name: 'Outdoor Observation',
  domain: 'nature-studies',
  description:
    'Systematic outdoor observation uses all five senses to gather information about ' +
    'the natural environment. The sit spot practice: return to the same outdoor location ' +
    'daily or weekly, sit quietly for 10-15 minutes, and simply observe. Over time, ' +
    'the wildlife that was hiding reveals itself -- birds resume activity, mammals emerge, ' +
    'the ecosystem\'s rhythms become apparent. The senses to cultivate: hearing (most birds ' +
    'are heard before seen), smell (rain approaching, decay, flowers), touch (bark texture, ' +
    'soil moisture), sight (motion, color, pattern). Phenology -- the study of seasonal timing -- ' +
    'asks: when do the first spring ephemerals bloom? When do the swallows arrive? ' +
    'Keeping phenological records over years reveals patterns and changes.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'envr-ecosystems',
      description: 'Outdoor observation is the direct experience of ecosystem processes described in ecology',
    },
    {
      type: 'dependency',
      targetId: 'nature-nature-journaling',
      description: 'The nature journal is the documentation tool for outdoor observation',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.16 + 0.09),
    angle: Math.atan2(0.3, 0.4),
  },
};
