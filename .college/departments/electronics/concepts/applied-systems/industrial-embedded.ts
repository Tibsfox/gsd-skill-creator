import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const industrialEmbedded: RosettaConcept = {
  id: 'elec-industrial-embedded',
  name: 'Industrial & Embedded Systems',
  domain: 'electronics',
  description:
    'PLCs (Programmable Logic Controllers) run ladder logic: contacts (normally open, normally closed) ' +
    'and coils on rungs that execute in a scan cycle (1-10ms). IEC 61131-3 defines 5 PLC languages: ' +
    'Ladder Diagram (LD), Function Block Diagram (FBD), Structured Text (ST), Instruction List (IL), ' +
    'Sequential Function Chart (SFC). Off-grid solar: MPPT (Maximum Power Point Tracking) controllers ' +
    'dynamically adjust load impedance to extract maximum power from PV panels regardless of temperature ' +
    'and irradiance; P = V*I is maximized at the knee of the I-V curve. PCB design: schematic capture ' +
    'leads to netlist, then component placement, then routing. Design rules check (DRC) verifies ' +
    'clearances. Gerber files (.gbr) define each copper layer, silkscreen, and solder mask for ' +
    'manufacturing. Ground planes reduce EMI and provide low-impedance return paths. Decoupling ' +
    'capacitors (100nF ceramic near each IC power pin) suppress high-frequency noise.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-sequential-logic-design',
      description: 'PLC scan cycle and state machine programming share sequential logic principles',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-power-supply-design',
      description: 'Off-grid solar MPPT is a specialized power conversion application of switching regulator principles',
    },
  ],
  complexPlanePosition: {
    real: 0.48,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.48 ** 2 + 0.65 ** 2),
    angle: Math.atan2(0.65, 0.48),
  },
};
