import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const tolerancesFits: RosettaConcept = {
  id: 'mfab-tolerances-fits',
  name: 'Tolerances & Fits',
  domain: 'materials',
  description:
    'Tolerances define the allowable variation in dimensions — no manufacturing process produces exactly the nominal dimension. ' +
    'GD&T (Geometric Dimensioning and Tolerancing) specifies not just size tolerances but form, orientation, and position. ' +
    'Fits define the relationship between mating parts: clearance fit (gap), interference fit (press fit), or transition fit. ' +
    'Tolerances drive cost: tighter tolerances require more precise (and expensive) processes. ' +
    'The engineering art is specifying tolerances tight enough to function, loose enough to manufacture economically.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-dfm',
      description: 'Tolerance analysis is a core component of DFM — poorly specified tolerances cause assembly problems',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
