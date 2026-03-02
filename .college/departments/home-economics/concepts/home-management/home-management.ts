import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const homeManagement: RosettaConcept = {
  id: 'domestic-home-management',
  name: 'Home Management',
  domain: 'home-economics',
  description:
    'Home management is the systematic approach to maintaining a functional, healthy living space. ' +
    'Cleaning systems: daily (dishes, counters, sweep high-traffic areas), weekly (bathrooms, floors, ' +
    'vacuum), monthly (deep clean appliances, declutter), seasonal (windows, baseboards, HVAC filter). ' +
    'The Marie Kondo method: handle each item and ask if it sparks joy; organize by category not location. ' +
    'Basic home maintenance prevents costly repairs: ' +
    'HVAC filter change every 1-3 months (check manufacturer recommendation); ' +
    'caulk inspection around tubs and windows annually; ' +
    'smoke and CO detector battery check twice yearly (daylight saving change). ' +
    'Energy efficiency: LED bulbs use 75% less energy; drafts under doors add 15% to heating bills; ' +
    'unplugging electronics eliminates phantom loads (5-10% of household electricity). ' +
    'Decluttering principle: one in, one out -- for every item acquired, one leaves the home.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-budgeting',
      description: 'Home management requires budgeting for maintenance and operational costs',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};
