import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const qualityControl: RosettaConcept = {
  id: 'mfab-quality-control',
  name: 'Quality Control',
  domain: 'materials',
  description:
    'Quality control ensures manufactured parts and assemblies meet specifications. ' +
    'Inspection methods: coordinate measuring machines (CMM), go/no-go gauges, optical inspection, NDT (non-destructive testing). ' +
    'Statistical process control (SPC) uses control charts to detect process drift before defects occur. ' +
    'Six Sigma targets fewer than 3.4 defects per million opportunities through DMAIC (Define-Measure-Analyze-Improve-Control). ' +
    'Quality systems (ISO 9001) document processes to ensure consistent output.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-tolerances-fits',
      description: 'Quality control inspects parts against the tolerance specifications defined at design stage',
    },
    {
      type: 'cross-reference',
      targetId: 'stat-hypothesis-testing',
      description: 'SPC and Six Sigma rely on statistical hypothesis testing to distinguish process noise from real shifts',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
