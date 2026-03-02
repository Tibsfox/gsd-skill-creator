import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fluidSystems: RosettaConcept = {
  id: 'engr-fluid-systems',
  name: 'Fluid Systems',
  domain: 'engineering',
  description:
    'Fluid systems use liquids or gases to transmit power and control motion. ' +
    'Pascal\'s principle: pressure applied to an enclosed fluid transmits equally in all directions — ' +
    'the basis of hydraulic systems (e.g., brakes, presses). ' +
    'Pneumatic systems use compressed air for lighter-duty applications. ' +
    'Bernoulli\'s principle explains lift (wings), carburetion, and fluid flow through pipes. ' +
    'Fluid power systems offer high power density and easy remote control.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-simple-machines',
      description: 'Hydraulic cylinders are fluid-power equivalents of mechanical advantage devices',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-wave-properties',
      description: 'Acoustic (sound) waves in fluids are governed by fluid mechanics principles',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
