import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const bigBang: RosettaConcept = {
  id: 'astro-big-bang',
  name: 'The Big Bang',
  domain: 'astronomy',
  description:
    'The Big Bang theory describes the universe\'s origin from an extremely hot, dense state ' +
    'approximately 13.8 billion years ago and its subsequent expansion and cooling. Three ' +
    'independent lines of evidence converge: cosmic microwave background (CMB) radiation — the ' +
    'afterglow of the hot early universe, predicted by Gamow and measured by Penzias & Wilson ' +
    '(1965); Hubble\'s law — galaxies recede at velocities proportional to their distance, ' +
    'consistent with universal expansion from a common origin; and Big Bang nucleosynthesis — ' +
    'the calculated abundances of hydrogen (75%), helium-4 (25%), and trace deuterium match ' +
    'observed cosmic elemental ratios. The first 380,000 years: quark-gluon plasma → hadrons → ' +
    'nucleosynthesis → recombination (electrons bond to nuclei, universe becomes transparent). ' +
    'Cosmic inflation (Guth, 1980) proposes a brief exponential expansion phase resolving the ' +
    'horizon and flatness problems. The Big Bang is not an explosion in space but an expansion ' +
    'of space itself — there is no "center" or "edge."',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'astro-cosmology',
      description: 'The Big Bang is the foundational event of modern cosmology, providing the framework for understanding the universe\'s history',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
