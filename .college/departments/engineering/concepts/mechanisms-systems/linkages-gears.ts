import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const linkagesGears: RosettaConcept = {
  id: 'engr-linkages-gears',
  name: 'Linkages & Gears',
  domain: 'engineering',
  description:
    'Linkages are rigid members connected by joints to convert motion — the four-bar linkage produces ' +
    'complex non-circular paths from simple rotational input. ' +
    'Gears transmit rotational motion and torque between shafts, changing speed and torque proportionally ' +
    '(gear ratio). Gear trains can produce large speed reductions with corresponding torque multiplication. ' +
    'Cams convert rotational motion to linear motion for precise timing in mechanisms.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-simple-machines',
      description: 'Gears and linkages are mechanical advantage devices — complex applications of simple machine principles',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
