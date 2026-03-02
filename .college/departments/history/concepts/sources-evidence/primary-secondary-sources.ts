import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const primarySecondarySources: RosettaConcept = {
  id: 'hist-primary-secondary-sources',
  name: 'Primary vs. Secondary Sources',
  domain: 'history',
  description:
    'Primary sources are first-hand accounts or direct evidence from the period under study: diaries, ' +
    'letters, photographs, artifacts, speeches, laws, and contemporary newspapers. ' +
    'Secondary sources interpret or analyze primary sources: textbooks, biographies, and historical analyses. ' +
    'The distinction matters because every intermediary introduces interpretation; historians always prefer ' +
    'going back to primary evidence while recognizing that "primary" is a relational, not absolute, category.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
