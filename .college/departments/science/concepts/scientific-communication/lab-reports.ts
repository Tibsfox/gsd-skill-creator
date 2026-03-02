import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const labReports: RosettaConcept = {
  id: 'sci-lab-reports',
  name: 'Lab Reports',
  domain: 'science',
  description:
    'A lab report documents an experiment so completely that another scientist could replicate it. ' +
    'Standard sections include purpose, hypothesis, materials, procedure, results (data and graphs), ' +
    'analysis, and conclusion. Each section serves a distinct function in communicating the investigation. ' +
    'Writing a clear procedure is especially valuable for developing precise, unambiguous scientific communication.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-claims-evidence-reasoning',
      description: 'The conclusion section of a lab report applies the CER framework',
    },
    {
      type: 'dependency',
      targetId: 'sci-peer-review',
      description: 'Lab reports are the document type most often subject to peer review in educational settings',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
