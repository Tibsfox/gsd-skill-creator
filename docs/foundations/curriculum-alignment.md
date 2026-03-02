---
title: "Curriculum Alignment — The Space Between"
layer: foundations
path: "foundations/curriculum-alignment.md"
summary: "Maps all 33 chapters of The Space Between to specific src/ implementations using identity-level connections. Chapters without confirmed identity connections are documented in Gaps Found."
last_verified: "2026-03-02"
chapter_count: 33
hd_modules_covered: 10
note_on_requirement: "CURR-01 referenced 27 chapters; every codebase artifact (mfe-domains skills, v1.40 release notes, v1.35 release notes) consistently indicates 33 chapters. This document maps all 33."
---

# Curriculum Alignment — The Space Between

This document maps each of the 33 chapters of *The Space Between* to specific `src/` implementations using identity-level connections. A connection appears here only when the implementation IS the chapter's concept made computational — not when it merely uses concepts from the chapter, nor when the relationship is analogy. Chapters without confirmed identity connections are documented in [Gaps Found](#gaps-found).

## Connection Standard

**Identity language ("IS"):** Every connection listed in this document means the code directly realizes the mathematical content of the chapter. The function named IS the concept — not a tool that uses it, not a metaphor for it, not something inspired by it.

**Excluded language:** The phrases "corresponds to", "relates to", and "inspired by" are NOT used in this document. If the relationship between code and chapter is only analogy or dependency, the chapter appears in Gaps Found instead.

**Dependency is not identity:** If the code depends on math from a chapter (e.g., iteration uses continuity from Chapter 9) but does not implement that chapter's core concept as a callable function, the relationship is a dependency, not an identity connection.

## Part I: Perception (Seeing) — Chapters 1–3

### Chapter 1
- `src/holomorphic/types.ts` — `ComplexNumber` IS the algebraic structure C = {a + bi : a, b in R, i^2 = -1} — the number system the entire holomorphic pack operates on

### Chapter 2
- `src/holomorphic/complex/arithmetic.ts` — `magnitude()` IS the Pythagorean distance |z| = sqrt(re^2 + im^2) used as the escape criterion in every orbit computation

### Chapter 3
- `src/holomorphic/complex/arithmetic.ts` — `cexp()` IS Euler's formula e^(i*theta) = cos(theta) + i*sin(theta) as a computable function
- `src/holomorphic/complex/arithmetic.ts` — `argument()` IS the phase angle arg(z) — the angular position on the unit circle

## Part II: Waves (Hearing) — Chapters 4–7

### Chapter 4
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 5
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 6
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 7
No confirmed identity connection — see [Gaps Found](#gaps-found)

## Part III: Change (Moving) — Chapters 8–10

### Chapter 8
- `src/holomorphic/complex/iterate.ts` — `computeOrbit()` IS the discrete iteration z_{n+1} = f(z_n) — the computational realization of how a point moves under repeated map application

### Chapter 9
- `src/holomorphic/complex/iterate.ts` — `detectPeriod()` IS the detection of periodic orbits using Floyd's cycle detection — the computational identification of return behavior under iteration

### Chapter 10
- `src/holomorphic/complex/iterate.ts` — `classifyFixedPoint()` IS the stability classification by multiplier magnitude |f'(z*)| — the complete taxonomy of convergent, periodic, and divergent behavior

## Part IV: Structure (Expanding) — Chapters 11–14

### Chapter 11
- `src/holomorphic/dmd/dmd-core.ts` — `svd()` IS an educational SVD implementation operating on snapshot matrices — the core linear algebra algorithm built from the vector space axioms

### Chapter 12
- `src/holomorphic/dmd/dmd-core.ts` — `dmd()` IS the construction of a linear operator A approximating x_{k+1} = A*x_k from snapshot data — the linear transformation concept made computational

### Chapter 13
- `src/holomorphic/dmd/dmd-core.ts` — `classifyDMDEigenvalue()` IS eigenvalue classification on the complex plane: inside unit circle (stable), outside (unstable), on circle (neutral/oscillatory)

### Chapter 14
The entire `src/holomorphic/` module IS the computational realization of holomorphic function theory. All 10 HD modules implement holomorphic dynamics — the iteration, stability, and rendering are all operations on holomorphic maps f: C -> C. The master barrel `src/holomorphic/index.ts` IS the public API of holomorphic function operations.

## Part V: Reality (Grounding) — Chapters 15–17

### Chapter 15
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 16
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 17
No confirmed identity connection — see [Gaps Found](#gaps-found)

## Part VI: Foundations (Defining) — Chapters 18–21

### Chapter 18
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 19
No confirmed identity connection — see [Gaps Found](#gaps-found)

HD-06 module (`src/holomorphic/modules/HD-06/content.md`) teaches topological properties (connectedness, Riemann sphere, conformal maps) but `src/holomorphic/` does not export topological predicates like `isConnected()` or `isCompact()`. The relationship is educational, not identity.

### Chapter 20
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 21
No confirmed identity connection — see [Gaps Found](#gaps-found)

## Part VII: Mapping (Mapping) — Chapters 22–25

### Chapter 22
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 23
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 24
No confirmed identity connection — see [Gaps Found](#gaps-found)

### Chapter 25
No confirmed identity connection — see [Gaps Found](#gaps-found)

## Part VIII: Unification (Converging) — Chapters 26–27

### Chapter 26
- `src/holomorphic/dmd/dmd-core.ts` — `dmd()` IS a spectral decomposition of the linear evolution operator — unifying linear algebra with dynamical analysis
- `src/holomorphic/dmd/dmd-core.ts` — `svd()` IS the singular value decomposition underlying the spectral analysis

### Chapter 27
- `src/holomorphic/dmd/koopman.ts` — `edmd()` IS the Extended DMD approximation of the Koopman operator, lifting nonlinear dynamics into linear observable space
- `src/holomorphic/dmd/koopman.ts` — `liftDictionary()` IS the observable lifting step — the function that maps nonlinear state vectors into a higher-dimensional linear space

## Part IX: Emergence (Growing) — Chapters 28–31

### Chapter 28
- `src/holomorphic/renderer/core.ts` — `renderMandelbrot()` IS the parameter-space visualization of the Mandelbrot set — the emergent structure arising from iteration of f(z) = z^2 + c

### Chapter 29
- `src/holomorphic/renderer/core.ts` — `renderJulia()` IS the Julia set — the emergent partition of the complex plane into chaotic and stable regions for fixed c

### Chapter 30
- `src/holomorphic/renderer/helpers.ts` — `renderBifurcation()` IS the bifurcation diagram — the visual realization of the period-doubling cascade from stable to chaotic behavior

### Chapter 31
- `src/holomorphic/dynamics/skill-dynamics.ts` — `computeSkillOrbit()` IS the orbit of a learning system under a contractive map — the neural/learning connection made explicit in the skill-creator model

## Part X: Synthesis (Being) — Chapters 32–33

### Chapter 32
- `src/holomorphic/dynamics/skill-dynamics.ts` — `classifySkillDynamics()` IS the synthesis of all prior dynamics applied to skill classification on the complex plane
- `src/holomorphic/dynamics/skill-dynamics.ts` — `classifyFatouJulia()` IS the Fatou-Julia dichotomy applied to skill stability — the emergent classification from Chapter 29 reapplied in the skill-creator context

### Chapter 33
- `src/holomorphic/dmd/skill-dmd-bridge.ts` — `bridgeDMDToSkillDynamics()` IS the final synthesis: data-driven DMD eigenvalue analysis mapped to skill dynamics classifications, closing the loop from Ch 1 (complex numbers) through Ch 32 (skill model) to Ch 33 (unified data-driven analysis)

## Gaps Found

| Chapter | Part | Reason |
|---------|------|--------|
| 4 | II — Waves | `src/holomorphic/` implements dynamical iteration on the complex plane, not wave propagation or harmonic oscillation. Simple harmonic motion IS a prerequisite mathematical tool used in the textbook but not implemented in this module. |
| 5 | II — Waves | Frequency and wave analysis are outside the scope of holomorphic dynamics. No `src/holomorphic/` function implements Fourier series or frequency decomposition. |
| 6 | II — Waves | The wave equation and superposition principle are mathematical physics constructs not implemented in `src/holomorphic/`. DMD eigenvalue oscillation frequency IS related but the relationship is dependency, not identity. |
| 7 | II — Waves | Harmonic series and wave synthesis are outside the scope of holomorphic dynamics implementations. |
| 15 | V — Reality | Quantum mechanics and quantum operators are outside the scope of holomorphic dynamics. No `src/holomorphic/` function implements Schrodinger equations or quantum measurement. |
| 16 | V — Reality | Physical constants and atomic structure are mathematical physics outside the scope of `src/holomorphic/`. |
| 17 | V — Reality | No `src/holomorphic/` function implements physical measurement, Planck's constant computations, or atomic models. |
| 18 | VI — Foundations | `src/holomorphic/` does not implement set-theoretic primitives. ZFC axioms are foundational prerequisites, not implemented constructs. |
| 19 | VI — Foundations | HD-06 educates on topological properties (connectedness, Riemann sphere) but `src/holomorphic/` does not export topological predicates like `isConnected()` or `isCompact()`. The relationship is educational dependency, not identity. |
| 20 | VI — Foundations | Complex number operations form a group under addition and multiplication (minus 0), but no group-theoretic functions are exported from `src/holomorphic/`. Group axioms are implicit structure, not implemented API. |
| 21 | VI — Foundations | Formal logic and predicates are a prerequisite layer. No `src/holomorphic/` function implements logical inference or predicate calculus. |
| 22 | VII — Mapping | Category theory is an abstract mathematical framework outside `src/holomorphic/` scope. No functors, natural transformations, or categorical constructs are exported. |
| 23 | VII — Mapping | Fourier transforms are implemented nowhere in `src/holomorphic/`. The closest analog (DMD spectral decomposition) IS a spectral method but IS NOT the Fourier transform. |
| 24 | VII — Mapping | Probability and measure theory are outside the scope of holomorphic dynamics. No probabilistic functions are exported from `src/holomorphic/`. |
| 25 | VII — Mapping | Shannon entropy and information theory are outside the scope of holomorphic dynamics implementations. |

The Gaps Found entries are honest findings, not omissions to be remedied. The `src/holomorphic/` module is a holomorphic dynamics educational pack — it correctly implements Parts I, III, IV, VIII, IX, and X identities while depending on but not implementing Parts II, V, VI, and VII.
