# Mathematics Department

**Domain:** mathematics
**Source:** "The Space Between" mathematical foundations
**Status:** Active -- 7 concepts seeded across 4 wings

## Wings

- Algebra - Ratios, proportions, logarithmic scales -- the language of quantity and relationship
- Geometry - Trigonometric functions, transformations -- periodic patterns and spatial reasoning
- Calculus - Exponential growth and decay -- rates of change and accumulation
- Complex Analysis - Complex numbers, Euler's formula, fractal geometry -- the imaginary dimension

## Concepts

| Concept | Wing | Panels | Cross-References |
|---------|------|--------|-----------------|
| Exponential growth/decay | Calculus | Python, C++, Java, Fortran, Lisp | Culinary: cooling curves, fermentation |
| Trigonometric functions | Geometry | All 9 panels | Culinary: periodic flavor development |
| Complex numbers | Complex Analysis | Python, C++, Lisp | Unit circle architecture |
| Euler's formula | Complex Analysis | All 9 panels | Skill composition, concept rotation |
| Ratios and proportions | Algebra | Python, Pascal | Culinary: baker's percentages |
| Logarithmic scales | Algebra | Python, C++, Fortran | Culinary: pH, taste perception |
| Fractal geometry | Complex Analysis | Python, Lisp | Calibration: fractal expansion |
| Solitons | Complex Analysis | Python, C++, Lisp | math-complex-numbers, math-exponential-decay |

## Panels

All active panels (Python, C++, Java, Lisp, Pascal, Fortran, Perl, ALGOL, Unison)

## Calibration

Mathematics calibration model (future -- Phase 10)

## Cross-references — Adaptive Systems

**Department:** `.college/departments/adaptive-systems/`  
**Connection type:** Formal dependency — Adaptive Systems presupposes Mathematics vocabulary; three wings are entry points.

The Adaptive Systems department (v1.49.561 TC-college-bootstrap) draws on Mathematics in three areas:

**Calculus wing — Lyapunov stability (Panel B).**  
Lyapunov stability theory (Lyapunov 1892; Sastry & Bodson 1989 Ch. 2) requires computing dV/dt along system trajectories via the chain rule: dV/dt = (∂V/∂x)·f(x). The exponential growth/decay concept already in this wing (`Exponential growth/decay`) maps directly to exponential stability of adaptive control systems: |e(t)| ≤ c·exp(−α·t)·|e(0)|. See Adaptive Systems Panel B (`B-control-theoretic-roots.md`).

**Calculus wing — Temporal difference learning (Panel A).**  
TD(λ) (Sutton 1988) is a discrete-time approximation to continuous-time gradient descent on the value function. The update δ(t) = r(t) + γ·V(s') − V(s) is a finite-difference operator on V — a calculus concept the Calculus wing provides. See Adaptive Systems Panel A (`A-behavioural-roots.md`).

**Complex Analysis wing — NTK spectral structure (Panel C).**  
The Neural Tangent Kernel (Jacot et al. 2018) decomposes into eigenfunctions via Fourier/Euler machinery — the spectral decomposition uses the complex exponential e^(iωt) that the Complex Analysis wing covers via Euler's formula. See Adaptive Systems Panel C (`C-physical-systems-roots.md`).

**Future additions (separate proposal — not in this TC scope):**  
Stochastic processes (Markov chains, transition matrices, stationary distributions) and variational calculus (Euler-Lagrange equation as the basis for free-energy minimisation — Friston 2010) are not yet present in this department. When added, they will be co-requisites for Adaptive Systems Panels B and D respectively.
