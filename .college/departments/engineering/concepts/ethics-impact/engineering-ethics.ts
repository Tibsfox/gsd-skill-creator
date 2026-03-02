import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const engineeringEthics: RosettaConcept = {
  id: 'engr-engineering-ethics',
  name: 'Engineering Ethics',
  domain: 'engineering',
  description:
    'Engineers have professional obligations to prioritize public safety, honesty, and competence. ' +
    'The National Society of Professional Engineers (NSPE) Code holds: "Engineers shall hold paramount ' +
    'the safety, health, and welfare of the public." ' +
    'Landmark failures illustrate ethical failures: the Challenger launch decision overrode engineer safety objections; ' +
    'the Therac-25 radiation overdoses resulted from software shortcuts. ' +
    'Engineering ethics is not optional — failure to adhere to it costs lives.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
