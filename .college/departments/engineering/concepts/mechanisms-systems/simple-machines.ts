import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const simpleMachines: RosettaConcept = {
  id: 'engr-simple-machines',
  name: 'Simple Machines & Mechanical Advantage',
  domain: 'engineering',
  description:
    'Simple machines — lever, wheel and axle, pulley, inclined plane, wedge, screw — are the basic elements ' +
    'from which all complex machines are built. They trade force for distance: mechanical advantage allows ' +
    'a small force over a large distance to produce a large force over a small distance. ' +
    'Efficiency (actual vs. ideal mechanical advantage) accounts for friction losses. ' +
    'Understanding simple machines builds intuition for all mechanical systems.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
