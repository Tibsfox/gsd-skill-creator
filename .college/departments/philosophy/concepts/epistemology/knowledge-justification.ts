import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const knowledgeJustification: RosettaConcept = {
  id: 'philo-knowledge-justification',
  name: 'Knowledge & Justification',
  domain: 'philosophy',
  description:
    'The traditional analysis of knowledge defines it as justified true belief (JTB): to know ' +
    'that P, you must believe P, P must be true, and your belief must be justified. Edmund Gettier ' +
    '(1963) showed JTB is insufficient with counterexamples: a stopped clock that happens to show ' +
    'the correct time is read by someone who believes (truly and with apparent justification) that ' +
    'it is that time — yet this seems not to be knowledge. Post-Gettier epistemology has proposed ' +
    'additional conditions: no false lemmas, causal connection between fact and belief (Goldman), ' +
    'or reliability of the belief-forming process (reliabilism). Foundationalism (some beliefs are ' +
    'basic and self-justifying) and coherentism (beliefs justify each other in a web) offer ' +
    'competing accounts of justification structure. Contextualism holds that knowledge attributions ' +
    'depend on the standards operative in conversational contexts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-epistemology-basics',
      description: 'Justified true belief and Gettier problems are core topics within the study of epistemology',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
