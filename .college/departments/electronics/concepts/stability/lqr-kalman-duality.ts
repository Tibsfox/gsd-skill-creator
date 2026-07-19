/**
 * LQR-Kalman Duality concept — electronics stability wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.12327v2 (2026).
 *
 * @module departments/electronics/concepts/stability/lqr-kalman-duality
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lqrKalmanDuality: RosettaConcept = {
  id: 'elec-lqr-kalman-duality',
  name: 'LQR-Kalman Duality',
  domain: 'electronics',
  description: 'In linear optimal control, two problems that look unrelated — designing the best controller and designing the best state estimator — turn out to be mathematically identical up to a transpose. The Linear Quadratic Regulator (LQR) chooses the input u = -K*x that minimizes the quadratic cost J = integral(x\'Q x + u\'R u) dt for a linear plant xdot = A x + B u; the optimal gain is K = R^-1 B\' P, where P solves the continuous algebraic Riccati equation A\'P + P A - P B R^-1 B\' P + Q = 0. The (deterministic) Kalman filter instead finds the state trajectory that best fits noisy measurements y = C x by minimizing the L2 size of the process and measurement disturbances; its optimal observer gain is L = P C\' V^-1, where P solves the DUAL Riccati equation A P + P A\' - P C\' V^-1 C P + W = 0. Comparing the two shows the estimator is the regulator under the substitution A->A\', B->C\', Q->W, R->V, so that controller<->estimator, controllability<->observability, and input<->output all swap. The cited source reaches this correspondence not by asserting the transpose table but in two steps: it embeds the deterministic (L2) estimation problem in a larger system using homogeneous coordinates to make the objective purely quadratic — an LQR with nonstandard boundary conditions — then partitions that enlarged problem to recover the Kalman observer, which it solves with the matrix differential Riccati equation (DRE) over a finite horizon rather than the steady-state algebraic Riccati equation shown above. Practically, one Riccati solver serves both jobs, and combining them (an estimator feeding a regulator) gives the LQG design used in flight control, disk-drive and hard-disk servos, switching-converter regulation, and inertial navigation. Modern robust-control and MPC formulations still rest on this estimator/controller symmetry.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'The LQR half produces a stabilizing state-feedback law u = -K*x; the closed-loop stability of that law is exactly what feedback-stability analysis studies, and the positive-definite Riccati solution P guarantees it, so the duality builds directly on feedback-stability fundamentals.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-sensor-actuator-systems',
      description: 'The dual object, the Kalman filter, reconstructs unmeasured state from noisy sensor readings so it can be fed to actuators through the controller — it is the estimation half of an estimator-plus-regulator (LQG) sensor/actuator loop.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-absolute-stability-circle-criterion',
      description: 'Both rest on the same matrix machinery of optimal/robust control: the LQR-Kalman duality is governed by the matrix Riccati equation, while the circle criterion and KYP lemma tie a frequency-domain stability test to a matrix (Lyapunov/Riccati-type) inequality — a shared linear-algebra backbone for control-loop design.',
    },
    {
      type: "cross-reference",
      targetId: "elec-feedback-linearization",
      description: "The Kalman observer reconstructs the state estimate that feedback linearization's synthetic-input control law requires, since exact cancellation presumes access to the full state. Reciprocating the link closes the loop between state estimation (duality) and the nonlinear-cancellation controller that consumes those states.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
