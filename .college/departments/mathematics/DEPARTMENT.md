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
| Blow-up dynamics | Calculus | Python, C++, Lisp | math-solitons, math-exponential-decay |
| Scale-critical equations | Calculus | Python, C++, Lisp | math-blow-up-dynamics, math-complex-numbers |
| Erdős problem index | Algebra | Python, C++, Lisp | math-euler-formula, math-logarithmic-scales |
| Millennium problem catalogue | Algebra | Python, C++, Lisp | math-erdos-problem-index, math-complex-numbers |
| Coherent Functor | Complex Analysis | Python, TypeScript, Lean 4 | math-complex-numbers, ai-computation-harness-as-object, math-euler-formula · Phase 744 v1.49.572 |
| Ollivier-Ricci Curvature | Geometry | Python, TypeScript, Rust | math-fractal-geometry, ai-computation-harness-as-object, math-exponential-decay · Phase 744 v1.49.572 |
| Hourglass Persistence | Geometry | Python, TypeScript | math-ollivier-ricci-curvature, math-fractal-geometry · Phase 744 v1.49.572 |
| Tonnetz Lattice | Complex Analysis | Python, TypeScript | math-euler-formula, math-complex-numbers, math-trig-functions · Phase 744 v1.49.572 |
| Optimal Transport | Calculus | Python, C++, Lisp | mathematics-ollivier-ricci-curvature, math-scale-critical-equations, math-exponential-decay · June-2026 arXiv 2606.30053 |
| Perron-Frobenius Centrality | Algebra | Python, C++, Lisp | mathematics-ollivier-ricci-curvature, math-euler-formula, math-ratios · June-2026 arXiv 2606.12026 |
| Aperiodic Wang Tiles | Geometry | Python, C++, Lisp | math-fractal-geometry, mathematics-tonnetz-lattice, math-ratios · June-2026 arXiv 2606.24693 |
| Bakry-Émery Curvature-Dimension | Geometry | Python, C++, Lisp | mathematics-ollivier-ricci-curvature, math-optimal-transport, math-exponential-decay · June-2026 arXiv 2606.11094 |
| Information Geometry | Geometry | Python, C++, Lisp | mathematics-ollivier-ricci-curvature, math-optimal-transport, math-exponential-decay · June-2026 arXiv 2606.06395 |
| Dual-Space Interpolation | Algebra | Python, C++, Lisp | math-trig-functions, math-euler-formula, math-transform-uncertainty-principle · June-2026 arXiv 2606.22671 |
| Transform Uncertainty Principle | Complex Analysis | Python, C++, Lisp | math-euler-formula, math-complex-numbers, math-dual-space-interpolation · June-2026 arXiv 2606.08662 |
| Bregman Projection | Geometry | Python, C++, Lisp | mathematics-cramer-wold-slicing, math-information-geometry |
| Cayley Graph Fourier Embedding | Algebra | Python, C++, Lisp | mathematics-tonnetz-lattice, math-dual-space-interpolation |
| Chip Firing Graph Riemann Roch | Algebra | Python, C++, Lisp | mathematics-coherent-functor, math-perron-frobenius-centrality |
| Discrete Nodal Domains | Geometry | Python, C++, Lisp | mathematics-hourglass-persistence, math-perron-frobenius-centrality |
| Equilateral Dimension | Geometry | Python, C++, Lisp | math-erdos-problem-index, math-millennium-problem-catalogue |
| Functorial Dynamics Semantics | Complex Analysis | Python, C++, Lisp | mathematics-coherent-functor, math-discrete-nodal-domains |
| Geometric Graph Manifold Recovery | Geometry | Python, C++, Lisp | mathematics-ollivier-ricci-curvature, math-optimal-transport |
| Measure Quantization | Calculus | Python, C++, Lisp | mathematics-cramer-wold-slicing, math-optimal-transport |
| Tail Integral Moment Representation | Calculus | Python, C++, Lisp | math-exponential-decay, math-logarithmic-scales |
| Wasserstein Gradient Flow Langevin | Calculus | Python, C++, Lisp | math-blow-up-dynamics, math-optimal-transport |

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
