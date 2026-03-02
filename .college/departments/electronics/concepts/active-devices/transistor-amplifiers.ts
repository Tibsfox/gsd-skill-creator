import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const transistorAmplifiers: RosettaConcept = {
  id: 'elec-transistor-amplifiers',
  name: 'Transistor Amplifiers',
  domain: 'electronics',
  description:
    'BJT (bipolar junction transistor) operates as a current-controlled current source: I_C = beta * I_B ' +
    'where beta (current gain) ranges from 50-500. Common-emitter configuration provides voltage gain ' +
    'A_v = -g_m * R_C where g_m = I_C/V_T is transconductance. Emitter-follower (common-collector) ' +
    'has unity gain but high input impedance and low output impedance -- ideal as a buffer. ' +
    'Current mirrors use matched transistors to copy a reference current: M:1 mirrors scale current. ' +
    'MOSFET operates as voltage-controlled current source: I_D = (k_n/2)*(V_GS - V_th)^2 in saturation. ' +
    'MOSFETs have near-infinite input impedance (gate), making them preferred in CMOS logic. ' +
    'Small-signal models (hybrid-pi) linearize transistor behavior around a DC bias point.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'BJT and MOSFET operation follows from minority carrier transport in semiconductor junctions',
    },
    {
      type: 'dependency',
      targetId: 'elec-opamp-configurations',
      description: 'Op-amps are built from differential pairs and cascaded transistor stages',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.30,
    magnitude: Math.sqrt(0.75 ** 2 + 0.30 ** 2),
    angle: Math.atan2(0.30, 0.75),
  },
};
