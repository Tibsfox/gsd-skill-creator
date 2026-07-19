/**
 * PID Anti-Windup concept — electronics stability wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.01959v1 (2026).
 *
 * @module departments/electronics/concepts/stability/pid-anti-windup
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 2 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const pidAntiWindup: RosettaConcept = {
  id: 'elec-pid-anti-windup',
  name: 'PID Anti-Windup',
  domain: 'electronics',
  description: 'The integral term of a PID controller accumulates the running error to erase steady-state offset: u = Kp*e + Ki*(integral of e dt) + Kd*(de/dt). But every physical actuator has finite limits -- a valve fully open, a motor at peak torque, a DAC at full scale. When the commanded u exceeds the saturation limits, the loop is effectively opened: the plant stops responding to further increases in u, yet the integrator keeps integrating a still-nonzero error. This "windup" charges the integrator to a large value; when the error finally reverses sign, the controller must unwind that stored charge before the actuator can leave its limit, producing large overshoot, sluggish recovery, and sometimes outright instability. Anti-windup schemes keep the integrator consistent with the output the actuator can actually deliver. Two standard families dominate. Conditional integration (clamping) freezes the integrator whenever the output is saturated and the error would drive it deeper. Back-calculation feeds the difference between the commanded and the delivered (saturated) signal back into the integrator through a tracking gain: dI/dt = Ki*e + (1/Tt)*(u_sat - u), where Tt is the tracking time constant, a common rule of thumb being Tt = sqrt(Ti*Td) or roughly Ti. Anti-windup is mandatory in nearly every industrial motion, temperature, and process-control loop; modern work refines the tuning of Tt for load-disturbance rejection.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'Windup is a closed-loop stability and performance failure; anti-windup preserves phase-margin-limited stability behavior when the actuator saturates and the loop momentarily opens.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-sensor-actuator-systems',
      description: 'Actuator saturation -- the finite physical range of the driven element -- is the root nonlinearity that windup arises from and anti-windup compensates.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-opamp-configurations',
      description: 'Analog PID controllers built from op-amp integrators need explicit anti-windup clamping (e.g. a Zener or diode network across the integrating capacitor) to bound integrator charge.',
    },
    {
      type: 'analogy',
      targetId: 'elc-1.22-limit-cycle-cold-gas-attitude',
      description: 'Both concern a saturating/relay actuator nonlinearity degrading a feedback loop; the limit-cycle attitude loop and the wound-up integrator are the same class of actuator-nonlinearity stability problem.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
