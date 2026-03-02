import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const finishing: RosettaConcept = {
  id: 'trade-finishing',
  name: 'Finishing',
  domain: 'trades',
  description:
    'Wood finishing protects the substrate and enhances its appearance through surface preparation ' +
    'and coating application. Surface preparation is the most critical phase: sand progressively ' +
    'through grits (80 → 120 → 180 → 220) removing scratches from each previous grit; always ' +
    'sand with the grain; remove all dust before finishing. Staining: gel stains on difficult ' +
    'species (pine, cherry) prevent blotching; water-based stains raise grain (wet-sand after ' +
    'first application); test color on scrap of same species. Finish types: oil finishes (tung, ' +
    'Danish, hardening oils) penetrate the wood and are easy to apply/repair but offer limited ' +
    'protection; varnish and polyurethane build a surface film with high durability; lacquer dries ' +
    'fast, can be sprayed, and is easy to sand between coats; shellac is natural, food-safe, and ' +
    'an excellent sealer under other finishes. Application: thin coats cure faster and are ' +
    'less prone to runs; sand lightly (320-400 grit or scotch-brite) between coats for adhesion ' +
    'and smoothness; final coat is not sanded.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-woodworking-basics',
      description: 'Finishing is the final stage of woodworking, applied to surfaces prepared through foundational woodworking skills',
    },
    {
      type: 'analogy',
      targetId: 'trade-joinery',
      description: 'Both joinery and finishing require understanding wood grain and species characteristics for optimal results',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
