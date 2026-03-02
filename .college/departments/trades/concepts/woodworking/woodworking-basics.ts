import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const woodworkingBasics: RosettaConcept = {
  id: 'trade-woodworking-basics',
  name: 'Woodworking Basics',
  domain: 'trades',
  description:
    'Wood is an anisotropic material -- its properties vary with direction relative to the grain. ' +
    'Grain direction: cutting with the grain (in the direction of growth rings) produces ' +
    'smooth results; cutting against the grain tears the surface. ' +
    'Wood species matter: hardwoods (oak, maple, cherry, walnut) come from deciduous trees -- ' +
    'denser, harder, more expensive, better for furniture. Softwoods (pine, fir, cedar) come ' +
    'from conifers -- lighter, easier to work, used for construction. ' +
    'Engineered wood (plywood, MDF, OSB) is dimensionally stable (no expansion with moisture) ' +
    'but requires edge treatment for appearance. ' +
    'Joinery options from weakest to strongest: butt joint (glue only), nail/screw joint, ' +
    'dado joint (routed channel receives a board end), mortise and tenon (traditional strongest), ' +
    'dovetail (mechanically interlocked, used in drawers). ' +
    'Wood movement: solid wood expands across the grain with moisture and contracts when dry -- ' +
    'must be accounted for in design to prevent cracking.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-tool-safety',
      description: 'Woodworking requires mastery of tools and safety before working with material',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
