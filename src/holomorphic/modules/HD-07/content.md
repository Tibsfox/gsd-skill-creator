# HD-07: From Dynamics to Deep Learning

## Overview

The mathematics of holomorphic dynamics has a surprising and deep connection
to modern deep learning. Gradient descent — the workhorse of neural network
training — is an iterative dynamical system, and its behavior (convergence,
oscillation, chaos) can be understood through the same lens we use to study
Julia sets and period-doubling cascades.

## The Loss Landscape as a Dynamical System

A neural network's **loss landscape** (or **loss surface**) is the function
L(theta) mapping parameters theta to the loss value. Training is the process
of navigating this landscape to find low-loss regions.

**Gradient descent** defines a discrete dynamical system on parameter space:

    theta_{n+1} = theta_n - lr * grad(L(theta_n))

where lr is the learning rate. This is precisely an iteration map, just like
f_c(z) = z^2 + c — and the learning rate plays a role analogous to the
parameter c in the quadratic family.

## Fixed Points and Critical Points

The **fixed points** of the gradient descent map correspond to **critical
points** of the loss function (where grad(L) = 0):

| Dynamical classification | Loss landscape meaning       | Stability       |
|--------------------------|------------------------------|-----------------|
| Attracting fixed point   | Local minimum                | Stable          |
| Repelling fixed point    | Local maximum                | Unstable        |
| Saddle (indifferent)     | Saddle point                 | Unstable        |
| Superattracting          | Sharp minimum (zero Hessian) | Very stable     |

The **multiplier** of the fixed point is (I - lr * H) where H is the Hessian
matrix of L. When all eigenvalues of this matrix have magnitude < 1, the
fixed point is attracting — the optimizer converges.

## Gradient Flow: The Continuous Limit

Taking the learning rate to zero gives the **gradient flow** ODE:

    d(theta)/dt = -grad(L(theta))

This continuous dynamical system always decreases the loss (L is a Lyapunov
function). But discrete gradient descent with finite lr does not have this
guarantee — it can oscillate, diverge, or exhibit chaotic behavior.

## SGD and Stochastic Dynamics

**Stochastic gradient descent (SGD)** adds noise to the dynamics by computing
gradients on random mini-batches rather than the full dataset:

    theta_{n+1} = theta_n - lr * grad(L_{batch}(theta_n))

This stochastic perturbation acts like a noisy iteration map. The noise helps
the optimizer escape sharp minima (which generalize poorly) and settle in flat
minima (which generalize well). This is analogous to how random perturbations
near a Julia set can push orbits between different Fatou components.

## Period Doubling in Learning Rates

When the learning rate is too large, gradient descent can exhibit the same
**period-doubling bifurcation** we see in the logistic map:

1. **Small lr**: Convergence to a fixed point (minimum)
2. **Medium lr**: The optimizer oscillates between two points (period-2 cycle)
3. **Larger lr**: Period-4, period-8, ...
4. **Very large lr**: Chaotic behavior — the loss bounces unpredictably

The critical learning rate where instability begins is lr_crit = 2 / lambda_max,
where lambda_max is the largest eigenvalue of the Hessian. Learning rate
schedules that decay lr over time are precisely designed to avoid this cascade.

## Deep Learning as Holomorphic Dynamics

The connection runs deeper than analogy:

- **Loss surface topology** mirrors Fatou/Julia decomposition: regions of
  smooth convergence (Fatou-like) separated by fractal boundaries (Julia-like)
  where tiny parameter changes lead to different basins of attraction
- **Mode connectivity** in deep learning (paths between minima that stay
  low-loss) parallels the structure of Fatou components
- **Edge of chaos** training (where models learn most efficiently) corresponds
  to parameters near the Julia set — maximum sensitivity to perturbation
- **Neural network expressivity** benefits from complex-valued weights, where
  holomorphic activation functions preserve conformal structure

## Practical Implications

Understanding these dynamics helps practitioners:

- **Choose learning rates**: Stay below lr_crit to avoid oscillation
- **Understand warmup**: Gradually increasing lr avoids early chaotic transients
- **Interpret loss curves**: Oscillating loss = period-doubling; spiking loss =
  chaotic regime
- **Design schedules**: Cosine annealing mimics smooth traversal of the loss
  landscape, avoiding bifurcation boundaries

## Try It

Use the interactive session to model gradient descent as a complex iteration
and observe how the learning rate parameter controls convergence, oscillation,
and chaos — the same phenomena we see in the Mandelbrot set.
