import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const campingSkills: RosettaConcept = {
  id: 'pe-camping-skills',
  name: 'Camping Skills',
  domain: 'physical-education',
  description:
    'Camping skills encompass shelter construction, fire management, and environmental stewardship. ' +
    'Shelter selection and setup: choose sites away from hazard trees, on raised ground to avoid ' +
    'drainage, and out of wind funnels. Tent pitch techniques vary by design; practice in the yard ' +
    'before relying on them in the field. Fire safety: select a cleared, non-flammable site; build ' +
    'fires within existing rings where available; never leave fires unattended; extinguish completely ' +
    '(cold-to-touch). The Leave No Trace (LNT) seven principles provide an ethical framework: plan ' +
    'ahead and prepare; travel and camp on durable surfaces; dispose of waste properly (pack it in, ' +
    'pack it out); leave what you find; minimize campfire impacts; respect wildlife; be considerate ' +
    'of other visitors. Water treatment (boiling, filter, chemical treatment) is essential in ' +
    'backcountry settings. Basic camp cooking skills include meal planning for caloric needs, ' +
    'food storage to prevent wildlife encounters, and hygiene in food preparation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-outdoor-safety',
      description: 'Camping skills extend outdoor safety principles from day trips to multi-day wilderness situations',
    },
    {
      type: 'analogy',
      targetId: 'pe-hiking-navigation',
      description: 'Both camping and hiking skills form the paired competency set for extended outdoor adventure',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
