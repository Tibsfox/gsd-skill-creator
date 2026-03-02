import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const empiricismRationalism: RosettaConcept = {
  id: 'philo-empiricism-rationalism',
  name: 'Empiricism & Rationalism',
  domain: 'philosophy',
  description:
    'The empiricism-rationalism debate concerns the primary source of human knowledge. Empiricists ' +
    '(Locke, Berkeley, Hume) hold that the mind begins as a blank slate (tabula rasa) and all ' +
    'knowledge derives ultimately from sense experience. Hume pushed this to skeptical limits: ' +
    'causal necessity, the self, and external objects cannot be proven from experience. Rationalists ' +
    '(Descartes, Spinoza, Leibniz) claim that reason alone yields certain knowledge independent of ' +
    'experience: mathematical truths, the cogito ("I think therefore I am"), and innate ideas are ' +
    'paradigm cases. Kant\'s "Copernican revolution" synthesizes both: the mind actively structures ' +
    'experience using a priori categories (space, time, causality); raw sensory data without ' +
    'concepts is blind, concepts without sensory data are empty. Contemporary cognitive science ' +
    'revisits the debate through nativism (Chomsky\'s universal grammar) and empiricist neural nets.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-epistemology-basics',
      description: 'The empiricism-rationalism debate is foundational to epistemology and theories of knowledge',
    },
    {
      type: 'analogy',
      targetId: 'philo-knowledge-justification',
      description: 'Both concepts address the sources and structure of justified belief',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.0625 + 0.5625),
    angle: Math.atan2(0.75, 0.25),
  },
};
