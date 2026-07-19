/**
 * Lyapunov Gradient Stability concept -- exploding / vanishing gradients.
 *
 * Control-theoretic roots of deep learning: the backpropagated gradient
 * norm is governed by the Lyapunov spectrum of the product of layer
 * Jacobians. The top Lyapunov exponent sets the exponential growth rate
 * of that norm with depth; residual connections push it toward zero,
 * the marginal-stability regime that lets very deep networks train.
 *
 * @module departments/adaptive-systems/concepts/lyapunov-gradient-stability
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~12*2pi/23, radius ~0.86
const theta = 12 * 2 * Math.PI / 23;
const radius = 0.86;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lyapunovGradientStability: RosettaConcept = {
  id: 'adaptive-systems-lyapunov-gradient-stability',
  name: 'Lyapunov Gradient Stability',
  domain: 'adaptive-systems',
  description: 'Pascanu, Mikolov, and Bengio\'s 2013 paper *On the Difficulty ' +
    'of Training Recurrent Neural Networks* (ICML) recast the exploding- and ' +
    'vanishing-gradient problem as a question of dynamical stability: the ' +
    'gradient backpropagated through L layers is the product of the per-layer ' +
    'Jacobians ∂h_t/∂h_{t-1}, and the norm of that product grows or shrinks ' +
    'at a rate set by the top Lyapunov exponent of the Jacobian sequence -- ' +
    'the same spectral quantity that bounds trajectory divergence in a chaotic ' +
    'flow. A positive top exponent makes the gradient norm blow up exponentially ' +
    'with depth (exploding); a negative one makes it decay to zero (vanishing); ' +
    'only an exponent near zero -- marginal stability -- lets error signals ' +
    'survive across many layers. The response that reshaped deep learning: ' +
    'residual / skip connections add an identity term to each Jacobian, pinning ' +
    'the spectral radius near one and pushing the top exponent toward zero, ' +
    'which is why ResNets and Transformers train stably at hundreds of layers, ' +
    'alongside gradient clipping for the exploding tail.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python folds the backward pass into per-layer Jacobians and reduces their matrix product via functools.reduce(np.matmul, jacobians[::-1]). ' +
        'The top Lyapunov exponent lam = np.mean([np.log(np.linalg.svd(J, compute_uv=False)[0]) for J in jacobians]): lam>0 explodes, lam<0 vanishes. ' +
        'A residual identity per J clamps the top singular value near 1.0 -- marginal stability. ' +
        'See Pascanu et al. 2013.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps the layer Jacobians in a std::vector<Eigen::MatrixXd> and accumulates the backward product in a contiguous RAII buffer. ' +
        'A templated top_exponent<Matrix>() folds Eigen::JacobiSVD into the mean log top-singular-value: above one it overflows (exploding), below one it decays to zero (vanishing). ' +
        'A residual Identity per block pins the spectral radius near one. ' +
        'See Pascanu et al. 2013.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(jacobian-product layers) folds the per-layer Jacobians into one operator, and (with-residual (layer J) ...) macro-expands each block into (+ identity J) -- a homoiconic skip connection, not a flag. ' +
        'The top exponent (/ (reduce #\'+ (map #\'log-spectral-radius jacobians)) depth): positive expands the gradient s-expression, negative collapses it, near-zero holds it stable. ' +
        'See Pascanu et al. 2013.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'adaptive-systems-lorenz-predictability-limit',
      description: 'Both are Lyapunov-exponent phenomena: the Lorenz limit bounds the forecast horizon by state-space sensitivity, while gradient stability bounds trainable depth by the same exponential divergence running through the backward pass',
    },
    {
      type: 'dependency',
      targetId: 'math-exponential-decay',
      description: 'A negative top Lyapunov exponent makes the gradient norm decay exponentially with depth (vanishing), while a positive one makes it grow exponentially (exploding) -- the canonical exponential growth / decay pattern',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
