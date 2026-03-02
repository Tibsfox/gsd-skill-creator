import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artMovements: RosettaConcept = {
  id: 'art-art-movements',
  name: 'Art Movements',
  domain: 'art',
  description:
    'Art movements are periods of shared stylistic and conceptual approach emerging from ' +
    'historical, social, and cultural conditions. Renaissance (14th-17th c.) revived ' +
    'classical humanism and developed linear perspective. Impressionism (1860s-1880s) ' +
    'captured fleeting light and color sensation over precise form -- revolutionary against ' +
    'academic painting. Modernism encompasses multiple 20th-century movements: Cubism ' +
    '(Picasso/Braque) showed multiple perspectives simultaneously; Abstract Expressionism ' +
    '(Pollock) made process and emotion central; Pop Art (Warhol) brought commercial imagery ' +
    'into fine art. Contemporary art resists single-movement definition and includes ' +
    'conceptual, digital, performance, and installation work. Understanding movements ' +
    'requires asking: What historical conditions produced this? What was it reacting against?',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'hist-modern-history',
      description: 'Art movements respond to and reflect their historical moment',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.09 + 0.16),
    angle: Math.atan2(0.4, 0.3),
  },
};
