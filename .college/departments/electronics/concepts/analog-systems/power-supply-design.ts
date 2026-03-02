import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const powerSupplyDesign: RosettaConcept = {
  id: 'elec-power-supply-design',
  name: 'Power Supply Design',
  domain: 'electronics',
  description:
    'Linear regulators (e.g., 7805, LM317) drop excess voltage as heat: P_dissipated = (V_in - V_out)*I. ' +
    'Efficiency is limited to V_out/V_in. LDO (low-dropout) regulators work with V_in - V_out as small ' +
    'as 0.3V. Switching regulators achieve 85-95% efficiency by switching at high frequency (100kHz-2MHz). ' +
    'Buck converter steps voltage down: V_out = D*V_in where D is duty cycle (0-1). Boost converter ' +
    'steps up: V_out = V_in/(1-D). Buck-boost inverts and scales. Ripple voltage on output capacitor ' +
    'is Delta_V = I_load*T/(8*C) for a buck converter. Thermal management: theta_JA (junction-to-ambient ' +
    'thermal resistance) determines junction temperature T_J = T_A + P_D*theta_JA. Heatsinks reduce ' +
    'theta_JA. Battery charging requires constant-current/constant-voltage (CC/CV) profiles.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-diode-rectification',
      description: 'Power supply rectification converts AC mains to unregulated DC before regulation',
    },
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'Switching regulator control loops require stability analysis to prevent oscillation',
    },
  ],
  complexPlanePosition: {
    real: 0.62,
    imaginary: 0.42,
    magnitude: Math.sqrt(0.62 ** 2 + 0.42 ** 2),
    angle: Math.atan2(0.42, 0.62),
  },
};
