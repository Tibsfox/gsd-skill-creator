/**
 * Functional Identifiability -- adaptive-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/adaptive-systems/concepts/functional-identifiability
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 6 * 2 * Math.PI / 7;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const functionalIdentifiability: RosettaConcept = {
  id: "adaptive-systems-functional-identifiability",
  name: "Functional Identifiability",
  domain: 'adaptive-systems',
  description:
    "A differential-equation model dx/dt = f(x, u) with output y = h(x) is only as learnable as it is identifiable: before any estimator can recover its dynamics from data, distinct dynamics must produce distinct observations. Classical structural identifiability asks this of a finite parameter vector θ; functional identifiability raises the stakes -- the unknowns are entire functions (a reaction rate, an unknown nonlinearity), and the question is whether those functions can be uniquely recovered from ideal, noise-free input-output records. The test is differential-algebraic: differential elimination (Ritt characteristic sets) removes unobserved states to yield an input-output equation in measured quantities alone, and the model is functionally identifiable iff the map from unknown functions to that equation is injective -- two functions giving the same input-output relation for all admissible inputs are indistinguishable. The paper characterises this criterion across several common ODE model classes and surfaces phenomena in the parametric-to-functional transition that have no classical analogue -- recovering an entire function can fail in ways that recovering a finite parameter vector never does. One caveat the certificate does not cover: injectivity is proven on ideal, noise-free records, so it is a necessary precondition rather than a guarantee -- estimating the function from noisy traces is a separate, harder problem layered on top. It is a recoverability-of-dynamics prerequisite sitting upstream of every adaptive update rule: no feedback law can tune what the data cannot distinguish. (arXiv:2606.30289v1, 2026)",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Python samples the candidate functions as arrays and tests injectivity: for each trial pair, simulate y via scipy.integrate.odeint over a bank of inputs and compare with np.allclose. Non-identifiability is [p for p in pairs if same_io(p)] returning >1 element -- distinct dynamics, one output trace. sympy does the differential elimination, reducing dx/dt=f(x,u), y=h(x) to an input-output ODE whose coefficients are the only recoverable functionals. See Ljung & Glad 1994.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "C++ holds the state trajectory in a contiguous std::vector<Eigen::VectorXd> and integrates dx/dt=f(x,u) with an RAII stepper owning its workspace. A templated io_map<F,H>() runs differential elimination to the input-output equation once, then folds two candidate functions through it: identifiable iff their coefficient buffers differ under (a-b).norm() > tol. Distinct f with one output span means elimination collapsed them -- non-identifiable. See Ljung & Glad 1994.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "In Lisp the model IS a list: (deriv x (f x u)) and (output y (h x)) are data, so differential elimination is symbolic rewrite. (eliminate-states model) recurses the expression tree, substituting until only measured symbols remain -- the input-output s-expression. A (defmacro identifiable? (m1 m2) ...) expands into equal? on the two eliminated forms; two distinct (f . h) reducing to the same list are indistinguishable. See Ljung & Glad 1994.",
    }],
  ]),
  relationships: [
    {
      type: "cross-reference",
      targetId: "adaptive-systems-lyapunov-gradient-stability",
      description: "Both are structural analyses of a differential model performed before fitting: Lyapunov gradient stability reads a spectral quantity off the product of layer Jacobians to bound trainable depth, while functional identifiability runs differential elimination to bound what the observations can recover. Each certifies a precondition for successful adaptation from the model's structure alone, not from fitted values.",
    },
    {
      type: "dependency",
      targetId: "math-systems-polynomials",
      description: "Differential elimination reduces the identifiability test to a system of polynomial (differential-algebraic) equations in the unknown functionals; checking whether that system pins the unknowns to a unique solution is the same algebraic reasoning used for systems of polynomials, applied here to differential indeterminates.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
