import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const experimentalControls: RosettaConcept = {
  id: 'sci-experimental-controls',
  name: 'Experimental Controls & Control Groups',
  domain: 'science',
  description:
    'A control group receives no treatment (or a placebo) and serves as the baseline for comparison. ' +
    'Without a control group, it is impossible to determine whether observed changes are due to the ' +
    'treatment or to other factors. Positive controls confirm the experiment can detect an effect; ' +
    'negative controls confirm no effect is occurring without the treatment.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-controlled-experiments',
      description: 'Control groups are the mechanism by which controlled experiments isolate causal factors',
    },
    {
      type: 'dependency',
      targetId: 'sci-replication-reliability',
      description: 'Control groups must be replicated across trials to establish reliability',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
