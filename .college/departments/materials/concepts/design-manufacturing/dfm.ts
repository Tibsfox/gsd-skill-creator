import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dfm: RosettaConcept = {
  id: 'mfab-dfm',
  name: 'Design for Manufacturability (DFM)',
  domain: 'materials',
  description:
    'Design for Manufacturability ensures a design can be produced efficiently, reliably, and at acceptable cost. ' +
    'Principles: minimize part count, design for assembly (snap fits, self-locating features), ' +
    'avoid tight tolerances where unnecessary, specify processes that match production volume, ' +
    'and design features achievable by chosen processes. ' +
    'DFM review catches problems before tooling is ordered — fixing a DFM error in design costs 1x; fixing it in production costs 100x.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-machining',
      description: 'DFM rules for machined parts differ from injection molded parts — process knowledge is prerequisite',
    },
    {
      type: 'dependency',
      targetId: 'engr-requirements-specifications',
      description: 'DFM balances functional specifications against manufacturing feasibility and cost constraints',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.36 + 0.3025),
    angle: Math.atan2(0.55, 0.6),
  },
};
