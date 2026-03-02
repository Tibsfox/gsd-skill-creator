import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electricalBasics: RosettaConcept = {
  id: 'trade-electrical-basics',
  name: 'Electrical Basics',
  domain: 'trades',
  description:
    'Electricity is the flow of electrons through a conductor, governed by Ohm\'s law: ' +
    'V = IR (Voltage = Current x Resistance). Understanding units: Volts (pressure/potential), ' +
    'Amps (flow rate of electrons), Watts (power = V x I), Ohms (resistance). ' +
    'Household circuits: US standard 120V (15A or 20A breakers) for general outlets and lighting; ' +
    '240V for high-draw appliances (dryer, range, water heater). ' +
    'Wire gauge: smaller number = thicker wire = higher current capacity. 14 AWG for 15A, 12 AWG for 20A. ' +
    'Wire colors: black = hot (live), white = neutral, green/bare = ground. ' +
    'GFCI (Ground Fault Circuit Interrupter) outlets detect leakage current and trip in 1/40 second -- ' +
    'required by code near water. AFCI protects against arc faults that cause electrical fires. ' +
    'Safety rule: ALWAYS verify the circuit is de-energized with a non-contact voltage tester ' +
    'before touching any wire -- do not rely on the breaker alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'trade-tool-safety',
      description: 'Electrical safety extends tool safety principles to the hazards of live electrical systems',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
