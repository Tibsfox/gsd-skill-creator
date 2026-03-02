import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const joinery: RosettaConcept = {
  id: 'trade-joinery',
  name: 'Joinery',
  domain: 'trades',
  description:
    'Joinery is the art of connecting wood pieces with joints that provide mechanical strength, ' +
    'aesthetic quality, or both. Mortise-and-tenon: the oldest and strongest structural joint — ' +
    'a rectangular projection (tenon) fits into a matching cavity (mortise); used in furniture ' +
    'frames, door construction, and timber framing. Dovetail joint: wedge-shaped tails cut into ' +
    'one board interlock with matching pins on the other — the mechanical lock resists pull-apart ' +
    'forces; handcut dovetails are a traditional cabinetmaking benchmark. Biscuit joint: oval ' +
    'compressed wood biscuits in matching slots align and reinforce glued panels; fast and ' +
    'accurate for case goods. Pocket-hole joinery (Kreg system): angled pilot holes driven at ' +
    'a shallow angle allow screws to pull boards together quickly — not for visible surfaces but ' +
    'widely used in cabinet construction. Box joint (finger joint): interlocking rectangular ' +
    'fingers; strong glue surface for small boxes. Choosing a joint: consider visible surface ' +
    '(dovetail), production speed (pocket screw), or maximum strength (mortise-and-tenon).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-woodworking-basics',
      description: 'Joinery techniques build on foundational woodworking skills including accurate measuring, marking, and cutting',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
