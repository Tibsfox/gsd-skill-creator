# Adaptive Systems Department

**Domain:** adaptive-systems  
**Status:** Proposed (pending implementation review)  
**Source:** Living Sensoria Refinement — Thread C College Bootstrap (TC-college-bootstrap proposal, v1.49.561)  
**Purpose:** Theoretical foundations of systems that update their own parameters in response to feedback from an environment. Four panels cover the behavioural, control-theoretic, physical-systems, and biological roots of adaptive-systems theory, giving the Living Sensoria stack (M1–M8) and the broader gsd-skill-creator adaptive learning layer a stable, citable home within the College.

The unifying engineering commitment across all four panels: **feedback drives parameter update drives improved performance.**

## Wings

- Panel A — Behavioural Roots: Classical and instrumental conditioning (Pavlov 1927; Skinner 1938) → reinforcement learning (Klopf 1972; Sutton 1988) → actor-critic architecture (Barto, Sutton & Anderson 1983)
- Panel B — Control-Theoretic Roots: Lyapunov stability theory (1892) → Kalman filtering → model-reference adaptive systems (Sastry & Bodson 1989) → self-tuning regulators
- Panel C — Physical-Systems Roots: Mean-field approximation → Neural Tangent Kernel (Jacot et al. 2018) → noise-as-temperature / simulated annealing (Kirkpatrick et al. 1983; CompuFlair 2026)
- Panel D — Biological Roots: Lanzara net-shift receptor activation (2023) → Weber-Fechner law (1834) → Friston free-energy principle (2010) → Kirchhoff Markov-blanket formalism (2018)

## Entry Point

`adapt-feedback-parameter-update` — the shared concept that unifies all four panels: a system measures an error signal (behavioural: reward mismatch; control: tracking error; physical: loss gradient; biological: prediction error) and adjusts its internal parameters in proportion to that signal.

## Calibration Model

**Benchmark question:** "Does the system improve through feedback?"

A system passes this benchmark if: (a) it maintains an internal representation of desired vs. actual performance; (b) it updates that representation based on observed error; (c) iterating the update reduces the error over time. All four panels instantiate this benchmark in their respective registers.

## Panels

| Panel | File | Primary Citations | Cluster Connections |
|-------|------|-------------------|---------------------|
| A — Behavioural Roots | `panels/A-behavioural-roots.md` | Barto et al. 1983; Pavlov 1927; Skinner 1938 | AI/SST, Music/WAL |
| B — Control-Theoretic Roots | `panels/B-control-theoretic-roots.md` | Sastry & Bodson 1989; Lyapunov 1892 | Infrastructure/SYS, Electronics/LED |
| C — Physical-Systems Roots | `panels/C-physical-systems-roots.md` | Jacot et al. 2018; Kirkpatrick et al. 1983; CompuFlair 2026 | Energy/THE, Vision/ROF |
| D — Biological Roots | `panels/D-biological-roots.md` | Friston 2010; Kirchhoff et al. 2018; Lanzara 2023 | Science/BHK, Ecology/ECO |

## Concepts

| Concept | Wing | Panels | Cross-References |
|---------|------|--------|-----------------|
| Lorenz Predictability Limit | Control-Theoretic (Panel B adjacent) | Python, C++, Lisp | math-fractal-geometry, math-exponential-decay |

## Cross-References

Full cross-departmental bridge specifications are in `CROSS_LINKS.md`.

| Department | Bridge Type | Entry Point |
|-----------|------------|-------------|
| mathematics | Formal | Lyapunov functions, variational calculus, stochastic processes |
| psychology | Empirical foundation | `psych-learning-theory`, `psych-behavior-reinforcement` |
| engineering | Advanced treatment | `engr-control-systems` → MRAS and self-tuning |
| culinary-arts | Physical analogy | `cook-specific-heat-capacity`, Weber-Fechner calibration model |
| mind-body | Biological anchor | Homeostasis, interoception, active inference |

## Rosetta Cluster Connections

The Adaptive Systems department is the primary College home for 7 Rosetta translation axes proposed in Thread C:

- **Learning** (AI/SST) — value function, policy, temporal difference, credit assignment
- **Stability** (Infrastructure/SYS) — Lyapunov function, convergence guarantee, robustness margin
- **Boundary** (Science/BHK) — Markov blanket, sensory/active/internal partition, conditional independence
- **Representation** (Vision/ROF) — NTK vs. finite-width, fixed library vs. adaptive feature space
- **Adaptation** (Ecology/ECO) — niche, carrying capacity, selection pressure, homeostatic setpoint
- **Temperature** (Energy/THE) — Boltzmann distribution, simulated annealing, cooling schedule
- **Feedback** (Music/WAL) — exploration/exploitation, temporal prediction, ensemble as multi-agent system

Translation tables for all 7 axes are in companion file `.college/rosetta/adaptive-systems-translations.md` (companion proposal TC-rosetta-translations.md).

## Mapping Registration

This department is registered in `.college/mappings/default.json` under the `computing` virtual group. Adaptive-systems theory is fundamentally computational in its modern instantiation (reinforcement learning, adaptive control algorithms, neural tangent kernel analysis) even though its roots span psychology, control engineering, physics, and biology.

## GAP-2 Status

This department directly closes GAP-2 (College of Knowledge Not Wired) from the v1.49.132 AAR audit. The audit identified that no College department covered the theory of systems that improve through interaction with their environment. The four panels here fill that gap, and the `.college/rosetta/` directory (bootstrapped in the same TC proposal) provides the cross-reference infrastructure.
