import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const primarySources: RosettaConcept = {
  id: 'read-primary-sources',
  name: 'Reading Primary Sources',
  domain: 'reading',
  description: 'Primary sources are original documents from the period or person being studied: letters, speeches, laws, photographs, diaries, and firsthand accounts. Reading primary sources requires contextualizing the document (who wrote it, for whom, why), analyzing its language and perspective, and corroborating it with other sources. Primary source literacy is essential for historical thinking.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-author-purpose-perspective', description: 'Primary sources require close attention to author, audience, and purpose for accurate interpretation' },
    { type: 'cross-reference', targetId: 'hist-primary-secondary-sources', description: 'History uses primary source reading as a core disciplinary skill' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
