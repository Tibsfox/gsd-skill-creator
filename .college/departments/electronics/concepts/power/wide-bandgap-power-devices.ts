/**
 * Wide-Bandgap Power Devices concept — electronics power wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.25281v1 (2026).
 *
 * @module departments/electronics/concepts/power/wide-bandgap-power-devices
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const wideBandgapPowerDevices: RosettaConcept = {
  id: 'elec-wide-bandgap-power-devices',
  name: 'Wide-Bandgap Power Devices',
  domain: 'electronics',
  description: 'Wide-bandgap (WBG) power devices -- silicon-carbide (SiC) MOSFETs and gallium-nitride (GaN) HEMTs -- are switching transistors built from semiconductors whose bandgap (SiC ~3.3 eV, GaN ~3.4 eV) is roughly three times silicon\'s ~1.1 eV. The wider gap raises the critical avalanche field E_crit by nearly an order of magnitude, so a device blocking voltage V_B needs a much thinner, more heavily doped drift region. Its specific on-resistance scales as R_on_sp = 4*V_B^2 / (eps*mu*E_crit^3), meaning a tenfold larger E_crit can cut conduction resistance for a given rating by 100x-1000x; the material quality metric is the Baliga figure of merit BFOM = eps*mu*E_crit^3. WBG transistors also carry far lower gate and output charge, so they switch faster with less loss: switching dissipation is P_sw = 0.5*V*I*(t_on+t_off)*f_sw + C_oss*V^2*f_sw, and GaN HEMTs have no body-diode reverse-recovery charge. Lower loss lets a converter run at higher f_sw (hundreds of kHz to MHz), which shrinks inductors and capacitors and raises power density. Designers apply them stage by stage across the grid-to-load chain -- PFC front-ends, isolated DC/DC, 48 V bus converters, point-of-load -- because the payoff is voltage- and frequency-dependent: GaN itself splits into lateral devices for high-frequency low/mid-voltage stages, emerging vertical devices for higher-voltage rails, and specialized or hybrid parts (bidirectional, normally-off) for niche roles, while SiC serves the higher-voltage rails. The systems argument for WBG in AI data centers is a quantitative efficiency-to-carbon chain: reducing electrical loss in each cascaded conversion stage lowers cooling demand, which lowers annual facility energy, which lowers operational carbon emissions. But the source stresses the payoff is a system lever, not a drop-in device swap -- it requires coordinated device + topology + package + thermal co-design (low-parasitic packaging, gate-drive/EMI discipline, mission-profile reliability), since fast dv/dt and di/dt amplify parasitic ringing. WBG devices now anchor EV traction inverters, solar inverters, and AI data-center power delivery.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'The WBG advantage is rooted in material physics: the wide bandgap sets the critical breakdown field E_crit, which through the Baliga figure of merit BFOM = eps*mu*E_crit^3 determines the achievable specific on-resistance for a given blocking voltage.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-power-supply-design',
      description: 'WBG transistors are the switching elements inside buck/boost/PFC converters; their low gate and output charge let the same switching topologies run at much higher f_sw, raising efficiency and shrinking the magnetics.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-diode-rectification',
      description: 'SiC Schottky diodes and GaN reverse conduction replace silicon PN rectifiers in the converter, eliminating the reverse-recovery charge Qrr that dominates hard-switching turn-on loss.',
    },
    {
      type: 'analogy',
      targetId: 'elec-clock-gating-dynamic-power',
      description: 'A converter\'s frequency-dependent switching loss (C_oss*V^2*f_sw) is the power-electronics analogue of CMOS dynamic power P = C*V^2*f: in both, energy per event times switching rate sets a frequency-limited loss floor that motivates minimizing switched charge.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
