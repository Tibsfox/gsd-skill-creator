import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const distributions: RosettaConcept = {
  id: 'data-distributions',
  name: 'Distributions & Their Shapes',
  domain: 'data-science',
  description: 'The shape of a distribution reveals the underlying process that generated the data. ' +
    'Normal (bell curve): symmetric, mean=median=mode, described by mean and SD. ' +
    'Height, measurement error, IQ scores. ' +
    'Right-skewed: long tail to the right, mean > median. Income, reaction times, city sizes. ' +
    'Left-skewed: long tail to the left, mean < median. Test scores with ceiling effect. ' +
    'Bimodal: two peaks -- suggests two distinct populations mixed. ' +
    'Uniform: all values equally likely. Random number generators. ' +
    'Histograms reveal shape: choose bin width carefully -- too few bins hides structure, too many creates noise.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-measures-of-center',
      description: 'Distribution shape determines which measure of center is appropriate',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-failures',
      description: 'Wealth distribution is highly right-skewed -- the shape itself is an economic phenomenon',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
