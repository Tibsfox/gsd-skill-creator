# References — Orchestration

**Module:** `src/orchestration/`
**Phase:** 845 (JP-026, RL-MPC vocabulary anchor)

---

## JP-026 — RL-MPC Wave-Coordination Vocabulary (arXiv:2604.21030)

**Added:** Phase 845 (JP-026, MEDIUM).

### arXiv:2604.21030 — Reinforcement Learning with Model Predictive Control (RL-MPC)

This paper establishes a joint RL-MPC vocabulary for coordinating multi-step decision-making pipelines under constraints. The taxonomy distinguishes:

- **Planning horizon `H`** — the look-ahead window over which the MPC controller solves an optimal sub-problem before handing off to the RL policy.
- **Receding-horizon execution** — at each step the planner re-solves from the current state, rolling the window forward. Only the first action is applied; the rest are discarded and recomputed next step.
- **Constraint satisfaction layer** — hard constraints (capacity, deadline) are enforced by the MPC layer; soft preferences (quality, latency) are shaped by the RL reward.
- **Value bootstrap** — the terminal cost of the MPC horizon is approximated by the RL value function, closing the two-loop architecture.

### Mapping onto gsd-skill-creator wave-coordination patterns

| RL-MPC concept | gsd-skill-creator construct |
|---|---|
| Planning horizon `H` | Wave window in the phase sequencer (`src/orchestration/anytime-gate.ts`); each wave is a receding-horizon solve over the next N phases |
| Receding-horizon execution | Wave-commit-then-re-plan pattern: only the committed wave's phases are executed; subsequent waves are re-planned at each wave boundary |
| Constraint satisfaction layer | CAPCOM fidelity gate (`src/dacp/fidelity/`) — hard constraints on context budget and phase-boundary invariants that the orchestration layer must not violate |
| Soft preference shaping | `src/stochastic/` softmax selector + `src/temperature/` annealed schedule — RL-policy-analogue reward shaping over selector scores |
| Value bootstrap at horizon | `src/orchestration/selector.ts` value estimate passed as terminal cost into the next wave's anytime gate |
| Constraint-qualified optimality (KKT) | `src/projection/` smooth projection operators keeping parameter updates inside the admissible manifold |

The MIQP scheduler (`src/orchestration/miqp-cp-scheduler.ts`) corresponds to the MPC inner loop: it solves a mixed-integer program over the current wave's phase assignments, subject to the hard constraints exported by the CAPCOM fidelity layer.

### Why this vocabulary is load-bearing

The RL-MPC taxonomy resolves a naming ambiguity that existed before Phase 845: "wave" and "horizon" were used interchangeably in comments across `selector.ts`, `anytime-gate.ts`, and `miqp-cp-scheduler.ts`. Adopting the RL-MPC vocabulary:

1. Distinguishes the *planning* horizon (wave window, re-solved at each boundary) from the *execution* horizon (the committed phase sequence that actually runs).
2. Names the two-loop architecture explicitly: MPC inner loop = MIQP phase scheduler; RL outer loop = selector + stochastic sampler.
3. Makes the CAPCOM / fidelity gate legible as the constraint-satisfaction layer of an RL-MPC controller, not an ad-hoc safety check.

**Citation:** arXiv:2604.21030. (2026). RL-MPC taxonomy, §2 vocabulary, §4 two-loop architecture.

---

## Cross-references

- `src/orchestration/anytime-gate.ts` — wave window / receding-horizon execution
- `src/orchestration/miqp-cp-scheduler.ts` — MPC inner loop (MIQP phase scheduler)
- `src/orchestration/selector.ts` — RL outer loop (value bootstrap)
- `src/dacp/fidelity/` — constraint satisfaction layer (CAPCOM hard constraints)
- `src/stochastic/` — softmax selector (RL reward shaping)
- `src/temperature/` — annealed temperature schedule (RL policy temperature)
- `src/projection/` — smooth projection (constraint-qualified optimality)
