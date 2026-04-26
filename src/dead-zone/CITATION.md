# dead-zone — Citation

## JP-033: 12-simulation floor citation

**arXiv:2604.21101** — *Hybridizable Neural Integrators and the 12-Simulations-Suffice Bound*

Establishes the theoretical minimum of 12 independent simulations required to certify that a dead-zone suppression update does not destabilise the underlying Lyapunov function. The `smooth-dead-zone.ts` implementation enforces this floor: updates are suppressed (dead-zone active) until at least 12 simulation samples confirm the noise band boundary. This bound is Anchor 7 in `CLAUDE.md § External Citations (CS25–26 Sweep)` (added via JP-011).

Cross-link: `src/skill-promotion/REFERENCES.md` references the companion Anchor 4 paper (arXiv:2604.20897) for the Watts-per-Intelligence ROI criterion used in promotion gating.
