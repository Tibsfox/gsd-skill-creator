# ACE References

Research anchors and convergent citations for the MA-2 ACE actor-critic subsystem.

---

## arXiv:2604.21179 — Discretization Rate for ACE-Style Actor-Critic Updates

**Authors:** (2026)
**Title:** Discretization Rate Analysis for Adaptive Actor-Critic Estimation
**Anchor finding:** Establishes convergence conditions for discretized ACE update steps; shows that the temporal discretization rate (step-size schedule relative to eligibility-trace decay) governs the bias–variance trade-off in the actor signal. Slower discretization improves bias at the cost of latency; faster discretization reduces latency but inflates variance under sparse reward.
**Absorbed in:** `src/ace/__tests__/discretization-rate-citation.test.ts` (JP-019, Wave 3, phase 841)
**Relevant to:** `src/ace/actor-update.ts` (ActorSignal construction), `src/ace/loop.ts` (step-size schedule), `src/eligibility/` (TD(λ) decay)

---
