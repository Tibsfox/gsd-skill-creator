import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const birdIdentification: RosettaConcept = {
  id: 'nature-bird-identification',
  name: 'Bird Identification',
  domain: 'nature-studies',
  description:
    'Bird identification (birding) combines visual field marks with song and behavioral cues. ' +
    'The GISS approach (General Impression, Size, and Shape) establishes the broad category ' +
    'before field marks: is it sparrow-sized or crow-sized? Long-tailed or short? Dabbling or diving? ' +
    'Visual field marks: bill shape (seed-cracker vs. insect-probe vs. fish-spear), ' +
    'wing bars, eye rings, breast patterns, tail shape in flight. Birding by ear: ' +
    'most birds reveal themselves through song before you see them; mnemonics help ' +
    '(white-throated sparrow: "Old Sam Peabody Peabody Peabody"). ' +
    'Habitat association narrows identification: a warbler in a wetland is likely different ' +
    'from a warbler in a conifer forest. The Sibley Guide and iBird apps are standard references. ' +
    'Big year birding (listing all species seen in one year) is a gateway to obsessive naturalism. ' +
    'Citizen science contribution: eBird records observations that track migration patterns, ' +
    'range shifts, and population trends.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nature-outdoor-observation',
      description: 'Bird identification requires the patient outdoor observation skills of the naturalist',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
