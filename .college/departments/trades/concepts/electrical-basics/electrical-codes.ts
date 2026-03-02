import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electricalCodes: RosettaConcept = {
  id: 'trade-electrical-codes',
  name: 'Electrical Codes',
  domain: 'trades',
  description:
    'Electrical codes establish minimum safety standards for residential and commercial wiring. ' +
    'The National Electrical Code (NEC, NFPA 70) is adopted by most US jurisdictions — updated ' +
    'every three years; local amendments may add requirements. Key NEC requirements: wire sizing ' +
    '(conductors must carry rated current without overheating — #14 AWG for 15A, #12 AWG for ' +
    '20A, #10 AWG for 30A circuits); box fill calculations (too many wires in too small a box ' +
    'creates heat); working clearances (36" in front of electrical panels); grounding and ' +
    'bonding. Permit and inspection process: permit required before work begins on most ' +
    'electrical projects; rough-in inspection (wiring before drywall); final inspection ' +
    '(completed installation with covers). Working without permits creates insurance liability, ' +
    'resale complications, and safety risks. Electricians must know when work requires a licensed ' +
    'electrician vs. what homeowners can do in their jurisdiction (varies by state/municipality).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-circuit-types',
      description: 'Electrical code requirements reference circuit types and configurations — you must understand both',
    },
    {
      type: 'dependency',
      targetId: 'trade-electrical-basics',
      description: 'Code compliance requires understanding the electrical fundamentals that codes are designed to protect',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
