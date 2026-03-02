import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const linguisticRelativity: RosettaConcept = {
  id: 'lang-linguistic-relativity',
  name: 'Linguistic Relativity and Language Diversity',
  domain: 'languages',
  description: 'The Sapir-Whorf hypothesis: language shapes thought, not just expresses it. ' +
    'Strong version (linguistic determinism): you can only think what your language allows -- discredited. ' +
    'Weak version (linguistic relativity): language influences habitual thought patterns -- well-supported. ' +
    'Color terms: languages partition the color spectrum differently (Russian has separate terms for light blue and dark blue; Pirahã has only light/dark). ' +
    'Russian speakers are faster at discriminating shades that cross the siniy/goluboy boundary -- language affects perception. ' +
    'Spatial reference: absolute direction systems (north/south -- Guugu Yimithirr) vs. relative (left/right -- English) shape spatial cognition. ' +
    'Grammatical gender: does it affect how speakers conceptualize objects? Some evidence suggests subtle effects. ' +
    'Practical implication: learning another language can genuinely shift cognitive habits and expand conceptual resources.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Linguistic relativity is a form of cognitive bias -- the language you speak can bias perception and memory in measurable ways',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-phoneme-inventory',
      description: 'The phoneme inventory determines what sound distinctions speakers habitually attend to -- a form of perceptual relativity',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.1225 + 0.5625),
    angle: Math.atan2(0.75, 0.35),
  },
};
