import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const portfolioBuilding: RosettaConcept = {
  id: 'art-portfolio-building',
  name: 'Portfolio Building',
  domain: 'art',
  description:
    'An artist\'s portfolio is a curated collection of work that represents capability, ' +
    'range, and artistic identity. Curation is a skill distinct from creation: not all ' +
    'work should be included, only work that best represents growth and intention. ' +
    'A strong portfolio shows range (different media, subjects, or approaches) and depth ' +
    '(mastery in chosen areas). The artist statement accompanies the portfolio: a first-person ' +
    'text articulating intent, influences, and artistic questions. Portfolio formats vary: ' +
    'physical (bound prints), digital (PDF, website), or online platforms (Behance, ArtStation). ' +
    'College art portfolios typically require 12-20 works including a sustained investigation ' +
    '(a series exploring one idea), breadth pieces (range of media), and an artist statement. ' +
    'The portfolio is not just a collection -- it tells a story of development.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-artistic-iteration',
      description: 'Portfolio work emerges from iterative creative practice',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.81 + 0.01),
    angle: Math.atan2(0.1, 0.9),
  },
};
