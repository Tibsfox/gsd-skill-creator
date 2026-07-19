/**
 * Wasserstein Gradient Flow Langevin -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/wasserstein-gradient-flow-langevin
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 32 * 2 * Math.PI / 33;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const wassersteinGradientFlowLangevin: RosettaConcept = {
  id: "math-wasserstein-gradient-flow-langevin",
  name: "Wasserstein Gradient Flow Langevin",
  domain: 'mathematics',
  description:
    "Mean-field Langevin dynamics studies how an ensemble of interacting particles minimizes an entropy-regularized empirical risk F(μ)=R(μ)+τH(μ) over probability measures μ, where R is the data-dependent risk, H(μ)=∫μ log μ is entropy, and τ is temperature. The construction recasts this as a Wasserstein gradient flow: on measures under the 2-Wasserstein metric (Otto calculus), F is minimized by steepest descent ∂_tμ=∇·(μ∇δF/δμ), a nonlinear Fokker–Planck PDE whose particle form is the McKean–Vlasov SDE dX=−∇(δR/δμ_t)dt+√(2τ)dB. Its stationary law is the self-consistent Gibbs measure μ_*∝exp(−δR/δμ_*/τ). As τ→0 this concentrates by Laplace's method onto hidden signal directions, with a sharp phase transition at τ of order one separating a diffuse phase from a signal-recovering one. It matters because it ties optimal-transport geometry, log-Sobolev convergence, and the diffusion-versus-aggregation competition behind blow-up into one variational object (arXiv:2606.31429v1, 2026).",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Represent μ as an (N,d) array; the empirical law is just the rows. Each Euler–Maruyama step is vectorized: `drift = -grad_R(X, X)` (mean-field: the drift reads the whole cloud), then `X += drift*dt + np.sqrt(2*tau*dt)*rng.standard_normal((N,d))`. Track the free energy `F = R(X) + tau*np.mean([x_log_x(k) for k in kde(X)])` and watch it fall monotonically; as `tau` shrinks the cloud collapses onto the signal axis. See Jordan 1998.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "`std::vector<Eigen::VectorXd> cloud(N)` owns the particle buffer by RAII; `template<int D>` fixes the ambient dimension at compile time so every `VectorXd` is a contiguous D-block. A `step(cloud, tau, dt)` mutates in place: `x.noalias() += -dR(x, cloud)*dt + std::sqrt(2*tau*dt)*gaussian<D>();`. The free energy F = R + tau*H is a running scalar the flow never lets increase, and shrinking tau drives concentration. See Jordan 1998.",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: "A measure is a list of particle positions — code is data, so the cloud is just `'((x1 ...) (x2 ...))`. `(defmacro wasserstein-step (mu tau dt) ...)` expands into the drift-plus-diffusion map; `(mapcar (lambda (x) (langevin-update x mu tau dt)) mu)` walks the list recursively. The stationary Gibbs law `(exp (/ (- (delta-R x mu)) tau))` is a symbolic fixed point you can differentiate directly as an s-expression. See Jordan 1998.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "math-blow-up-dynamics",
      description: "The low-temperature concentration onto signal directions is a blow-up-like collapse governed by the same diffusion-versus-aggregation nonlinear Fokker–Planck competition; this concept specializes that mechanism with an entropy-regularized, data-dependent risk driving the drift.",
    },
    {
      type: "dependency",
      targetId: "math-optimal-transport",
      description: "The whole flow lives in the 2-Wasserstein geometry of optimal transport; the W_2 metric and Otto's formal Riemannian calculus are exactly what make the free-energy steepest descent a well-defined gradient flow rather than a mere heuristic.",
    },
    {
      type: "cross-reference",
      targetId: "math-bakry-emery-curvature-dimension",
      description: "Exponential convergence of F(μ_t) to the stationary Gibbs measure follows from a log-Sobolev inequality whose constant is controlled by Bakry–Émery curvature-dimension bounds on the proximal potential, and the temperature τ enters that convergence rate directly.",
    },
    {
      type: "analogy",
      targetId: "math-scale-critical-equations",
      description: "The sharp phase transition at temperature of order one behaves like a scale-critical threshold: above τ_c the entropic diffusion dominates and the law stays diffuse, below τ_c the risk curvature wins and the measure concentrates, a balance-of-exponents bifurcation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
