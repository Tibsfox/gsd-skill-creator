import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const landmarkDiscoveries: RosettaConcept = {
  id: 'sci-landmark-discoveries',
  name: 'Landmark Scientific Discoveries',
  domain: 'science',
  description:
    'Case studies of transformative discoveries reveal how science actually works: through creative ' +
    'leaps, serendipity, collaborative effort, and incremental refinement. Examples include Mendel\'s ' +
    'genetics, Watson and Crick\'s DNA structure, Einstein\'s relativity, and the discovery of ' +
    'penicillin. These stories humanize science and demonstrate that scientists are creative problem-solvers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-paradigm-shifts',
      description: 'Landmark discoveries often precipitate paradigm shifts in scientific thinking',
    },
    {
      type: 'cross-reference',
      targetId: 'hist-turning-points',
      description: 'Scientific discoveries are a category of historical turning points that reshaped society',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
