import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cleaningOrganization: RosettaConcept = {
  id: 'domestic-cleaning-organization',
  name: 'Cleaning & Organization',
  domain: 'home-economics',
  description:
    'Systematic home cleaning and organization reduce cognitive load, improve safety, and maintain ' +
    'property value. Zone cleaning divides the home into areas tackled on rotating schedules: ' +
    'daily tasks (dishes, counters, beds), weekly tasks (floors, bathrooms, laundry), monthly ' +
    'tasks (windows, appliances, baseboards), and seasonal deep cleans. Proper product selection ' +
    'matters: acidic cleaners (vinegar) dissolve mineral deposits; alkaline cleaners (baking soda) ' +
    'cut grease; disinfectants require adequate contact time (check labels). Clutter reduction ' +
    'precedes organization — the one-in-one-out rule prevents accumulation. Storage systems work ' +
    'when they match use frequency (daily items at arm reach, seasonal items stored away) and ' +
    'user habits (if you\'ll never fold socks, use bins not drawers). Minimal organization ' +
    'systems outperform elaborate ones: the simpler the system, the more consistently it\'s used.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-home-management',
      description: 'Cleaning and organization are the core recurring tasks within the broader framework of home management',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
