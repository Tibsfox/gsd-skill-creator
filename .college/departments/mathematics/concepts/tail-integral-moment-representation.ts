/**
 * Tail Integral Moment Representation -- mathematics concept (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/concepts/tail-integral-moment-representation
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 31 * 2 * Math.PI / 33;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const tailIntegralMomentRepresentation: RosettaConcept = {
  id: "math-tail-integral-moment-representation",
  name: "Tail Integral Moment Representation",
  domain: 'mathematics',
  description:
    "How large must a moment's order grow before it stops existing? For a random variable X with cumulative distribution F and survival function S(t)=P(X>t), the tail-integral (layer-cake) moment representation writes every real-order moment as a weighted integral of these tail functions: for p>0, E[X^p]=∫₀^∞ p·t^(p-1)·S(t) dt, while negative moments E[X^(-q)]=q·∫₀^∞ t^(-q-1)·F(t) dt are governed instead by the CDF near the origin. Writing X^p=∫₀^X p·t^(p-1) dt and applying Tonelli turns an abstract expectation into a statement about how fast S decays: exponentially light tails make every positive moment finite, whereas a power-law tail S(t)∼t^(-α) admits E[X^p] only for p<α. Letting p→0 recovers the logarithmic moment E[log X]=∫₀^∞ (e^(-t)−L_X(t))/t dt, a Frullani integral tying log-moments to the Laplace transform L_X. The construction unifies positive, fractional, and negative real-order moments and the classical Darth-Vader identity under one transform (arXiv:2606.14019v1, 2026).",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "import numpy as np\n# layer-cake: E[X^p] = ∫₀^∞ p·t^(p-1)·S(t) dt, S(t)=P(X>t) empirical survival\nx = np.random.exponential(1.0, 200_000)\nt = np.linspace(1e-6, 40, 4000)\nS = np.array([(x > tt).mean() for tt in t])\nmoment = lambda p: np.trapz(p * t**(p-1) * S, t)   # p<α tail ⇒ converges\n# moment(p) ≈ Γ(p+1); p→0 gives E[log X] via Frullani. See Lieb & Loss 2001.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "// layer-cake moment E[X^p]=∫₀^∞ p·t^(p-1)·S(t) dt over a contiguous grid\ntemplate <class T>\nT tail_moment(const std::vector<T>& t, const std::vector<T>& S, T p) {\n  T acc{};                                 // RAII buffers; trapezoid rule\n  for (std::size_t i = 1; i < t.size(); ++i)\n    acc += T(0.5)*(t[i]-t[i-1])*\n           (p*std::pow(t[i],p-1)*S[i] + p*std::pow(t[i-1],p-1)*S[i-1]);\n  return acc;  // survival decay governs convergence. See Lieb & Loss 2001.\n}",
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: ";; layer-cake moment: recursive fold over a survival list ((t . S) ...)\n(defun tail-moment (p g)\n  (if (null (cdr g)) 0.0\n    (destructuring-bind ((t0 . s0) (t1 . s1) &rest _) g\n      (+ (* 0.5 (- t1 t0)\n            (+ (* p (expt t0 (1- p)) s0) (* p (expt t1 (1- p)) s1)))\n         (tail-moment p (cdr g))))))  ; recurse down the tail\n;; homoiconic Frullani: (log x) as data =\n;; '(int (/ (- (exp (- t)) (exp (* (- x) t))) t)). See Lieb & Loss 2001.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "math-exponential-decay",
      description: "The layer-cake integral's convergence is dictated by the decay rate of the survival function S(t); exponentially light tails make every positive moment finite, so exponential decay is the control parameter that determines which moments the representation produces.",
    },
    {
      type: "cross-reference",
      targetId: "math-logarithmic-scales",
      description: "Taking p→0 sends the moment family to the logarithmic moment E[log X], which admits a Frullani integral representation coupling it to the Laplace transform and to multiplicative log-scale structure.",
    },
    {
      type: "cross-reference",
      targetId: "math-ratios",
      description: "The Frullani identity underlying the log-moment evaluates ∫(f(at)-f(bt))/t dt to (f(0)-f(∞))·log(b/a), so the log-moment constant is literally a log of the scale ratio b/a, tying tail integrals to ratio structure.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
