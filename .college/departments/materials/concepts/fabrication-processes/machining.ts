import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const machining: RosettaConcept = {
  id: 'mfab-machining',
  name: 'Machining & Subtractive Manufacturing',
  domain: 'materials',
  description:
    'Machining removes material from a workpiece to create precise shapes. ' +
    'Operations include turning (rotating workpiece against cutting tool), milling (rotating tool against stationary workpiece), ' +
    'drilling, grinding, and EDM (spark erosion for hard materials). ' +
    'CNC (Computer Numerical Control) machining executes programmed toolpaths with high precision and repeatability. ' +
    'Machining produces tight tolerances and good surface finish but generates waste (chips) and is slower than casting.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-mechanical-properties',
      description: 'Machinability depends on material hardness, ductility, and thermal properties',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
