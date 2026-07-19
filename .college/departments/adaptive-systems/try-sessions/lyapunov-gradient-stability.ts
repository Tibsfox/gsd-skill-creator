/**
 * Lyapunov Gradient Stability try-session -- exploding / vanishing gradients.
 *
 * Walk a learner from the product-of-Jacobians view of backpropagation,
 * through empirical measurement of the top Lyapunov exponent and its sign,
 * to why residual / skip connections pin the spectral radius near one
 * (marginal stability) and let networks train at hundreds of layers.
 *
 * @module departments/adaptive-systems/try-sessions/lyapunov-gradient-stability
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const lyapunovGradientStabilitySession: TrySessionDefinition = {
  id: 'adaptive-systems-lyapunov-gradient-stability-first-steps',
  title: 'Lyapunov Gradient Stability: Why Deep Networks Explode, Vanish, or Just Train',
  description:
    'A guided first pass through Pascanu, Mikolov, and Bengio 2013 -- from ' +
    'the product-of-Jacobians view of the backward pass, through empirical ' +
    'measurement of the top Lyapunov exponent and its sign, to why residual ' +
    'connections pin the spectral radius near one (marginal stability) and ' +
    'let ResNets and Transformers train stably at hundreds of layers.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open Pascanu, Mikolov, and Bengio\'s 2013 paper *On the Difficulty of Training Recurrent Neural Networks* (ICML) to the gradient-norm analysis. Write out the chain rule for the loss gradient with respect to an early hidden state h_0 in an L-layer network. What single algebraic object does the sensitivity ∂h_L/∂h_0 reduce to?',
      expectedOutcome:
        'You articulate that ∂h_L/∂h_0 is the ordered matrix product of the per-layer Jacobians ∂h_t/∂h_{t-1} for t = 1..L, and that the backpropagated gradient norm is bounded by the norm of that product. The training-stability question is therefore a question about how the norm of a long matrix product behaves -- a dynamical-systems question, not a bookkeeping one.',
      hint: 'This is the same J_L · J_{L-1} · ... · J_1 product whose asymptotic growth rate defines a Lyapunov exponent for a discrete-time linear cocycle.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability'],
    },
    {
      instruction:
        'Compute the product empirically. In any numpy/PyTorch notebook, build L=50 random Jacobians (say 32x32) scaled so the largest singular value is a fixed sigma, form functools.reduce(np.matmul, jacobians[::-1]), and plot np.linalg.norm of the running product against depth on a log axis for sigma = 0.9, 1.0, and 1.1. What are the three slopes?',
      expectedOutcome:
        'The log-norm curve is approximately linear in depth with slope log(sigma): sigma=1.1 rises (the gradient explodes), sigma=0.9 falls toward zero (the gradient vanishes), and sigma=1.0 is roughly flat. You have empirically produced the exploding / vanishing / marginal trichotomy just by tuning the singular-value scale of the factors.',
      hint: 'The slope on the log axis IS the mean log largest-singular-value -- an estimate of the top Lyapunov exponent of the Jacobian sequence.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability', 'math-exponential-decay'],
    },
    {
      instruction:
        'Now derive the top Lyapunov exponent as a number rather than reading it off a slope. Compute lam = np.mean([np.log(np.linalg.svd(J, compute_uv=False)[0]) for J in jacobians]) over your stack, and confirm it matches the fitted slope from the previous step. What does the sign of lam predict?',
      expectedOutcome:
        'You obtain lam ≈ log(sigma), matching the fitted slope within sampling noise. You state the rule: lam > 0 means the gradient norm grows exponentially with depth (exploding), lam < 0 means it decays exponentially (vanishing), and lam ≈ 0 is the marginal-stability boundary where error signals survive across many layers. The exponent is the single scalar that classifies the network\'s trainability.',
      hint: 'The top Lyapunov exponent of a matrix product is the depth-normalized log of its largest singular value in the L → ∞ limit; the finite-L mean-log estimate is a consistent estimator.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability'],
    },
    {
      instruction:
        'Tie the sign of lam explicitly to exponential growth and decay. Write the closed-form envelope grad_norm(L) ≈ grad_norm(0) · exp(lam · L) and use it to answer: for lam = -0.1, how many layers until the gradient norm drops below 1% of its initial value? For lam = +0.1, how many until it grows 100x?',
      expectedOutcome:
        'You solve exp(lam·L) = 0.01 → L = ln(0.01)/(-0.1) ≈ 46 layers to vanish, and exp(lam·L) = 100 → L = ln(100)/0.1 ≈ 46 layers to explode 100x. You recognize this as the canonical exponential growth / decay law: a small per-layer multiplicative bias compounds into a dominant effect over depth, which is precisely why plain deep stacks were nearly untrainable before the fix.',
      hint: 'This is the same exponential-envelope algebra as error-doubling time in a chaotic flow -- only the independent variable is depth instead of time.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability', 'math-exponential-decay'],
    },
    {
      instruction:
        'Apply the residual fix. Replace each Jacobian J with (Identity + J) -- the linearized effect of a skip connection h_t = h_{t-1} + f(h_{t-1}) -- rebuild the product for the same small-scale J, and recompute lam. What happens to the spectral radius and to lam?',
      expectedOutcome:
        'Adding the identity shifts every eigenvalue by +1, so the largest singular value clusters near one regardless of the small f Jacobian, and lam collapses toward zero. The residual product neither explodes nor vanishes -- it holds marginal stability by construction. You have reproduced, in miniature, the mechanism that lets ResNets and Transformers train at hundreds of layers.',
      hint: 'The identity term guarantees a direct gradient highway: ∂h_t/∂h_{t-1} = I + ∂f/∂h_{t-1}, so at minimum the gradient passes through undamped. Gradient clipping handles the residual exploding tail.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability'],
    },
    {
      instruction:
        'Connect this to the Lorenz predictability limit. Both concepts are governed by a top Lyapunov exponent, but they bound different quantities. State what each exponent bounds and why the forward-time chaos story and the backward-depth training story are the same mathematics.',
      expectedOutcome:
        'You articulate that the Lorenz exponent bounds a forecast horizon by measuring how fast nearby state-space trajectories diverge forward in time, while the gradient exponent bounds trainable depth by measuring how fast the backpropagated gradient norm diverges through layers. Both are the asymptotic growth rate of a product of Jacobians; only the axis differs (physical time versus network depth). Sensitivity is the shared invariant.',
      hint: 'In both cases a positive top Lyapunov exponent is the enemy of control: it caps how far you can usefully forecast, or how deep you can usefully train, before the signal is lost in exponential divergence.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability', 'adaptive-systems-lorenz-predictability-limit'],
    },
    {
      instruction:
        'Close by placing Lyapunov gradient stability on the complex plane of experience: a medium-abstractness, high-complexity concept at the crossroads of dynamical systems, linear algebra, and deep-learning architecture. State one line that captures why the top Lyapunov exponent of the layer-Jacobian product is the quantity that decides whether a deep network can be trained.',
      expectedOutcome:
        'You state something like: "The backpropagated gradient is the product of the per-layer Jacobians, and its norm grows or shrinks at a rate set by the top Lyapunov exponent -- positive explodes, negative vanishes, near-zero survives. Residual connections add an identity to each Jacobian, pinning the spectral radius near one and pushing the exponent toward marginal stability, which is why very deep networks train at all."',
      hint: 'One scalar -- the top Lyapunov exponent -- turns "training is unstable" into a measurable spectral property you can engineer around with skip connections and clipping.',
      conceptsExplored: ['adaptive-systems-lyapunov-gradient-stability', 'adaptive-systems-lorenz-predictability-limit'],
    },
  ],
};
