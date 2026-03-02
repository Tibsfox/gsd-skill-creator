import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artPatronageEconomics: RosettaConcept = {
  id: 'art-patronage-economics',
  name: 'Art Patronage & Economics',
  domain: 'art',
  description:
    'The economic systems surrounding art production have shaped what gets made, by whom, and ' +
    'for what audience. Medieval guilds regulated craft quality and training; Renaissance patrons ' +
    '(Medici family, Church) commissioned specific subjects and iconographies. The Royal Academy ' +
    'system (18th-19th c.) controlled exhibition access and therefore careers. Modern markets ' +
    'shifted power toward dealers (Vollard for Cézanne, Kahnweiler for Cubists), auction houses, ' +
    'and collectors. Today, public funding (NEA, arts councils), foundation grants, residencies, ' +
    'and the gallery-collector-museum circuit form an ecosystem where prices are set by provenance, ' +
    'critical reputation, and scarcity. Digital platforms (NFTs, print-on-demand) create new ' +
    'revenue streams but also raise questions about authenticity and cultural value.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'art-art-movements',
      description: 'Economic patronage systems directly funded and constrained the art movements of each era',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-market-structures',
      description: 'Art markets exhibit classic economic features: information asymmetry, scarcity, and signaling',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
