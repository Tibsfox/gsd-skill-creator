/**
 * Feedback Linearization concept — electronics stability wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.07961v1 (2026).
 *
 * @module departments/electronics/concepts/stability/feedback-linearization
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const feedbackLinearization: RosettaConcept = {
  id: 'elec-feedback-linearization',
  name: 'Feedback Linearization',
  domain: 'electronics',
  description: 'Feedback linearization is a nonlinear-control technique that algebraically cancels a plant\'s nonlinear terms so the closed loop behaves like a simple linear system -- usually a chain of integrators -- after which classical linear tools finish the design. For a single-input plant written as x_dot = f(x) + g(x)*u with output y = h(x), one differentiates the output until the input first appears; the count is the relative degree r, giving y^(r) = Lf^r h(x) + Lg Lf^(r-1) h(x)*u, where Lf and Lg are Lie derivatives along f and g. Choosing the control law u = [ v - Lf^r h(x) ] / [ Lg Lf^(r-1) h(x) ] cancels the nonlinearity exactly and leaves y^(r) = v: r cascaded integrators driven by a synthetic input v. A linear design -- typically pole placement, v = -(k0*e + k1*e_dot + ...) -- then shapes the transient and sets damping and settling time. When the relative degree equals the system order n the linearization is exact and complete (full-state linearization) with no leftover internal or zero dynamics; when r < n the hidden internal dynamics must be separately verified stable. The method demands an accurate model, since cancellation is only as good as the known f and g, and an invertible input gain (Lg Lf^(r-1) h != 0). It underlies computed-torque control in robotics, dq-frame control of electric drives, aircraft flight-control laws, and process control. Modern grid-forming-inverter tutorials use it to decouple rotational coupling, resistive drops, and load conductance in one step, versus cascaded PI loops that only linearize near their tuning point.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'Feedback linearization reduces the nonlinear plant to a chain of integrators, but the closed loop\'s actual damping, phase margin, and stability still come from the linear pole-placement design layered on top of the cancellation -- so it depends on the same closed-loop stability analysis as any feedback loop.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-lqr-kalman-duality',
      description: 'Once the plant is reduced to integrators, the synthetic input v is chosen by linear state-feedback methods -- pole placement or LQR -- and because the control law needs every state, unmeasured states are reconstructed by an observer or Kalman filter, exactly the estimation-plus-feedback pairing of the LQR/Kalman duality.',
    },
    {
      type: 'analogy',
      targetId: 'elec-pid-anti-windup',
      description: 'The classic cascaded PI controller with dq feedforward decoupling is a partial, approximate feedback linearization that is exact only at its tuning point; full-state feedback linearization is the global generalization that cancels the same coupling terms across the whole operating range.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
