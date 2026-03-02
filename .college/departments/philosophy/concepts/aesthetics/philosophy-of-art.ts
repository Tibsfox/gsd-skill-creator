import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const philosophyOfArt: RosettaConcept = {
  id: 'philo-aesthetics',
  name: 'Philosophy of Art',
  domain: 'philosophy',
  description:
    'Aesthetics asks: What is art? What makes something beautiful? Are aesthetic judgments ' +
    'objective or merely subjective? Plato excluded artists from his ideal Republic -- mimesis ' +
    '(imitation) was twice removed from truth. Aristotle rehabilitated art through catharsis -- ' +
    'tragedy purges fear and pity. Kant\'s Critique of Judgment distinguishes the beautiful ' +
    '(disinterested pleasure, subjectively universal) from the merely pleasant (purely personal). ' +
    'The institutional theory (Dickie, Danto): art is what art world institutions declare art -- ' +
    'Andy Warhol\'s Brillo boxes are art, the factory originals are not, due to context. ' +
    'Expression theories: art expresses emotion (Tolstoy\'s test: does it transmit feeling?). ' +
    'Aesthetic experience may be heightened attention to the formal properties of an object ' +
    '(Clive Bell\'s significant form). The sublime -- vast or powerful nature -- produces ' +
    'pleasure mixed with awe that elevates consciousness above mere sensation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-zen-philosophy',
      description: 'Zen aesthetics (wabi-sabi, impermanence) offers a non-Western philosophy of beauty',
    },
    {
      type: 'analogy',
      targetId: 'art-art-movements',
      description: 'Art movements are the historical manifestations that aesthetics attempts to theorize',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};
