import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const epistemologyBasics: RosettaConcept = {
  id: 'philo-epistemology',
  name: 'Epistemology',
  domain: 'philosophy',
  description:
    'Epistemology is the branch of philosophy concerned with the nature, sources, ' +
    'and limits of knowledge. The classical definition: knowledge is justified true belief (JTB). ' +
    'Gettier cases (1963) showed JTB is insufficient -- you can have justified true belief ' +
    'that counts as accidental rather than knowledge. Sources of knowledge: perception (empiricism), ' +
    'reason (rationalism), testimony (social epistemology), introspection. ' +
    'The problem of induction (Hume): we cannot logically justify inferring future regularities ' +
    'from past observations -- yet science depends on this. Skeptical challenges: ' +
    'the evil demon (Descartes), the brain-in-a-vat thought experiment question whether ' +
    'we can know anything about the external world. Reliabilism answers skepticism by grounding ' +
    'knowledge in reliable belief-forming processes rather than certainty. ' +
    'Epistemology matters practically: distinguishing knowledge from opinion, ' +
    'evaluating evidence, and understanding how social structures affect what we know.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'philo-philosophical-questioning',
      description: 'Both epistemology and philosophical questioning begin with asking how we know',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
