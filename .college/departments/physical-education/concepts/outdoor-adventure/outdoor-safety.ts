import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const outdoorSafety: RosettaConcept = {
  id: 'pe-outdoor-safety',
  name: 'Outdoor Safety',
  domain: 'physical-education',
  description:
    'Outdoor safety combines risk assessment, environmental awareness, and response protocols. ' +
    'The Risk Management Matrix evaluates likelihood x consequence to prioritize hazards. ' +
    'The 10 Essentials (Mountaineers\' framework): navigation, sun protection, insulation, ' +
    'illumination, first aid, fire, repair tools, nutrition, hydration, emergency shelter. ' +
    'Leave No Trace (LNT) principles minimize human impact: plan ahead, travel on durable ' +
    'surfaces, dispose of waste properly, leave what you find, minimize fire impact, respect wildlife, ' +
    'be considerate of others. Hypothermia prevention: cotton kills (loses insulation when wet), ' +
    'wool and synthetics maintain warmth. Hydration: thirst lags behind need by 2% body weight loss; ' +
    'urine color is a better indicator. Weather awareness: lightning kills more outdoor recreationists ' +
    'than any other environmental hazard -- clear ridges and water 30 minutes before storm arrival.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-injury-prevention',
      description: 'Outdoor safety extends injury prevention principles to wild environments',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
