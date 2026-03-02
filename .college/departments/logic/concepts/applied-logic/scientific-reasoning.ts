import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scientificReasoning: RosettaConcept = {
  id: 'log-scientific-reasoning',
  name: 'Scientific Reasoning and the Hypothetico-Deductive Method',
  domain: 'logic',
  description: 'Scientific reasoning is a disciplined combination of induction, deduction, and empirical testing. ' +
    'Hypothetico-deductive (H-D) method: (1) observe, (2) form hypothesis, (3) deduce predictions, (4) test, (5) revise. ' +
    'Falsifiability (Popper): a scientific claim must specify what evidence would prove it wrong. Unfalsifiable claims are not scientific. ' +
    'Confirming an instance does not prove a hypothesis -- but one disconfirming instance can falsify (modus tollens). ' +
    'Theory vs. hypothesis vs. law: a theory is a well-substantiated explanatory framework (not a guess). A law is a regularity description. ' +
    'Auxiliary hypotheses: when a test fails, the core theory might be correct and an auxiliary assumption wrong (Duhem-Quine problem). ' +
    'Paradigm shifts (Kuhn): science advances through periods of normal science punctuated by revolutionary paradigm shifts. ' +
    'Peer review and replication: institutional practices implementing logical standards -- independent replication is the gold standard.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-inductive-reasoning',
      description: 'Scientific reasoning is the disciplined application of inductive and deductive reasoning to empirical questions',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Statistical hypothesis testing implements the H-D method quantitatively -- p-values measure the evidence for or against a hypothesis',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
