import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const paradigmShifts: RosettaConcept = {
  id: 'sci-paradigm-shifts',
  name: 'Paradigm Shifts',
  domain: 'science',
  description:
    'Thomas Kuhn\'s concept of paradigm shifts describes how scientific revolutions occur: anomalies ' +
    'accumulate until they can no longer be explained within the existing paradigm, leading to a ' +
    'fundamental reconceptualization of a field. Examples include the Copernican revolution, germ ' +
    'theory, and quantum mechanics. Understanding paradigm shifts shows that science is self-correcting ' +
    'and progressive rather than a fixed body of facts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-scientific-theories',
      description: 'Paradigm shifts replace one theoretical framework with a better one',
    },
    {
      type: 'dependency',
      targetId: 'sci-landmark-discoveries',
      description: 'Paradigm shifts are illustrated by landmark discoveries that changed everything',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.0625 + 0.7225),
    angle: Math.atan2(0.85, 0.25),
  },
};
