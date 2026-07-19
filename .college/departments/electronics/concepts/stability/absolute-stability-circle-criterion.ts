/**
 * Absolute Stability And The Circle Criterion concept — electronics stability wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.19311v1 (2026).
 *
 * @module departments/electronics/concepts/stability/absolute-stability-circle-criterion
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 4 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const absoluteStabilityCircleCriterion: RosettaConcept = {
  id: 'elec-absolute-stability-circle-criterion',
  name: 'Absolute Stability And The Circle Criterion',
  domain: 'electronics',
  description: 'Absolute stability addresses a classical control problem posed by Lur\'e: guarantee global asymptotic stability of a feedback loop built from a linear time-invariant plant G(s) and a static, memoryless nonlinearity phi(.) -- a saturation, deadzone, relay, or unknown gain -- when only bounds on that nonlinearity are known. The nonlinearity is assumed sector-bounded, meaning its graph lies between two lines through the origin: k1*y^2 <= y*phi(y) <= k2*y^2, equivalently (phi(y) - k1*y)*(phi(y) - k2*y) <= 0. A loop is "absolutely stable" if it is stable for EVERY phi in that sector. The Circle Criterion is a graphical test that generalizes the Nyquist criterion: construct the disk D whose real-axis diameter runs from -1/k1 to -1/k2; the loop is absolutely stable if the Nyquist plot of G(jw) stays outside D and encircles it the correct number of times for the plant\'s open-loop poles. The small-gain and passivity theorems are its limiting cases (k1 -> 0, or symmetric sectors). The unifying result is the Kalman-Yakubovich-Popov (KYP) lemma, which shows that a frequency-domain inequality (positive-realness of a related transfer function) is equivalent to the existence of a quadratic Lyapunov function V(x) = x^T*P*x with P = P^T > 0, obtainable from a linear matrix inequality or an algebraic Riccati equation. One graphical curve, one LMI, and one energy argument express the same guarantee. The source paper\'s specific contribution is a relaxed, Lyapunov-like defining inequality that avoids the usual strict-definiteness (P > 0) requirement, obtained by strengthening the sector constraint into a nonscalar form; this unifies the scalar and nonscalar circle criteria and is derived three equivalent ways -- as an LMI, an algebraic Riccati equation, and a matrix equation. Concretely, for a saturation nonlinearity in sector [k1, k2] the test reduces to checking that the Nyquist plot of G(jw) stays outside the disk whose real-axis diameter runs from -1/k1 to -1/k2. Engineers use these tools to certify robustness of controllers with saturating actuators, power converters, and PLLs; modern LMI solvers make the passivity-index formulation routine.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'The circle criterion is the direct generalization of the Nyquist stability criterion to loops containing a sector-bounded nonlinearity; the same encirclement counting of open-loop poles carries over, so linear feedback stability is the prerequisite that absolute stability extends.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-lqr-kalman-duality',
      description: 'The KYP (positive-real) lemma that certifies absolute stability shares the algebraic-Riccati-equation and LMI machinery of optimal-control/estimator duality; both reduce a frequency-domain condition to a quadratic P = P^T > 0 found by solving a Riccati equation.',
    },
    {
      type: 'analogy',
      targetId: 'elec-pid-anti-windup',
      description: 'Actuator saturation is the canonical sector-bounded nonlinearity, so absolute-stability tools formally certify the loops that anti-windup schemes patch empirically; both worry about the same nonlinear element in an otherwise linear controller.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-feedback-linearization',
      description: 'Feedback linearization cancels a nonlinearity to recover linear design, whereas absolute stability tolerates any nonlinearity within a known sector; contrasting the two teaches when exact cancellation versus robust sector bounds is the right strategy.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
