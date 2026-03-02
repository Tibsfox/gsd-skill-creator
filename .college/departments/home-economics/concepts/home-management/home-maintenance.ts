import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const homeMaintenance: RosettaConcept = {
  id: 'domestic-home-maintenance',
  name: 'Home Maintenance',
  domain: 'home-economics',
  description:
    'Preventive home maintenance protects property value and prevents small problems from becoming ' +
    'expensive repairs. Seasonal checklist: spring (inspect roof and gutters post-winter, service ' +
    'AC, check window seals), summer (exterior painting window, clean dryer vents), fall (flush ' +
    'water heater, inspect furnace and chimney, shut off exterior hose bibs), winter (check pipe ' +
    'insulation, test smoke and CO detectors). Basic repairs homeowners should know: unclogging ' +
    'drains (plunger, drain snake — not chemical drain openers regularly), patching drywall, ' +
    'resetting tripped circuit breakers, replacing light switches and outlets (power off at ' +
    'breaker), and caulking windows and tubs. Know your shutoff locations: main water shutoff, ' +
    'individual toilet and sink shutoffs, gas main, and electrical panel. When to call professionals: ' +
    'any work requiring permits (structural, electrical rewiring, gas lines, major plumbing).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-home-management',
      description: 'Home maintenance tasks are a key component of overall home management planning and scheduling',
    },
    {
      type: 'analogy',
      targetId: 'domestic-cleaning-organization',
      description: 'Both cleaning routines and maintenance schedules use systematic approaches to keep the home functional',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
