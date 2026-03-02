import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const circularEconomy: RosettaConcept = {
  id: 'mfab-circular-economy',
  name: 'Circular Economy',
  domain: 'materials',
  description:
    'The circular economy aims to eliminate waste by keeping materials in use as long as possible. ' +
    'Strategies: reduce (use less material), reuse (extend product life), remanufacture (restore used products), ' +
    'recycle (reprocess materials), and recover (capture energy from waste). ' +
    'Design for disassembly, material passports, and take-back programs enable circularity. ' +
    'The linear "take-make-dispose" model cannot continue as global resource consumption exceeds planetary boundaries.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-lca-lifecycle',
      description: 'Circular economy strategies are evaluated using LCA to verify they actually reduce environmental impact',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.2025 + 0.5625),
    angle: Math.atan2(0.75, 0.45),
  },
};
