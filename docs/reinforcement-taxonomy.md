# Canonical Reinforcement Taxonomy — MA-6

**Component:** MA-6  
**Register:** Mechanism  
**Source:** Barto, Sutton & Anderson 1983, §III–IV, pp. 837–842; Thread A (this repository)  
**Path:** `src/traces/reinforcement.ts`  
**Opt-in flag:** `REINFORCEMENT_EMIT` environment variable or `traces.reinforcement` config key

---

## What It Is

MA-6 defines the canonical reinforcement taxonomy for gsd-skill-creator: a discriminated-union `ReinforcementEvent` type covering every observed feedback channel, a signed scalar extractor `r(t)`, and an append-only JSONL log at `.planning/traces/reinforcement.jsonl`. It is the single-source-of-truth feedback channel for the actor-critic subgraph.

Before MA-6, feedback events in the stack were recorded in narrative form across M3 decision traces and M8 teaching entries. Barto, Sutton & Anderson 1983 require a scalar `r(t)` with a fixed sign convention (p. 840 footnote 2: negative `r` denotes the *occurrence* of a punishing event, not the cessation of a rewarding one). MA-6 commits to that convention in TypeScript's type system: a `test-pass` event cannot carry `sign: -1` because the discriminated union narrows it to `+1`. This makes the Barto 1983 Eq. 2 weight-update rule (`wᵢ(t+1) = wᵢ(t) + α·r(t)·eᵢ(t)`) tractable from real session data rather than synthesised signals.

---

## The Five Canonical Channels

MA-6 ships five channels in v1.49.561 (plus two supporting channels for a total of seven kinds):

### 1. `explicit_correction` — `user-correction`

**Sign:** −1. **Magnitude:** variable (1 for minor corrections, higher for major rewrites).

Emitted when the developer corrects a system output in a way that constitutes explicit negative feedback: "that's the wrong file," "redo this section," a direct overwrite. The `context` field carries a free-form description, subject to M3 redact-on-write for obvious secrets (CF-MA6-03).

This channel is the direct operationalisation of Barto 1983 §III (p. 837): "a reinforcement value of −1 would be used to indicate the occurrence of a punishing event."

### 2. `outcome_observed` — `test-pass` and `test-fail`

**`test-pass` sign:** +1. **`test-fail` sign:** −1. **Magnitude:** proportional to test count.

Emitted by the test runner on each CI or local test invocation. Test outcomes are the closest available proxy to environment reinforcement in the Barto 1983 sense: they are objective, externally-computed measurements of whether the system's last action produced a correct result.

Magnitude scales with test count (not fixed at 1) because a suite of 100 newly-passing tests is stronger positive evidence than a single micro-test passing.

### 3. `branch_resolved` — `commit-revert`

**Sign:** −1. **Magnitude:** 1 (unit event — a revert is a revert).

Emitted when a git commit is reverted. A commit-revert is a stronger negative signal than a correction: it means the action was committed and then explicitly undone, not just rejected before commit. The sign convention follows Barto 1983 footnote 2; the 1-second debounce window (CF-MA6-05) prevents double-counting with `undo` events on the same operation.

### 4. `surprise_triggered` — `undo`

**Sign:** −1. **Magnitude:** 1 (unit event).

Emitted when the developer issues an undo that reverses a system action. Weaker negative signal than a revert (the action was not committed), but still a measurable indication that the system's last output was not accepted.

### 5. `quintessence_updated` — `user-confirm` and `refinement-accept`

**`user-confirm` sign:** +1. **`refinement-accept` sign:** +1. **Magnitude:** variable.

`user-confirm` — Emitted by M5 Agentic Orchestration when a skill selection is accepted without correction. Positive signal: the selection was correct in the developer's view.

`refinement-accept` — Emitted by M8 Symbiosis when a teach entry is committed. Positive signal, scaled by ME-4's `expected_effect` annotation: `reliable → 1.0`, `unknown → 0.6`, `unmeasurable → 0.3`. This scaling is applied at emission by `emitRefinementAccept`; the full magnitude (pre-scaling) is not logged separately, because the scaled magnitude is the observation that downstream consumers should see.

---

## How Events Emit

Each module that observes feedback calls `emitReinforcement(event)`. The emitter opens `.planning/traces/reinforcement.jsonl` for POSIX `O_APPEND`, serialises the event as a single JSON line, flushes, and closes. Concurrent emissions from multiple modules are serialised at the write boundary: `O_APPEND` writes ≤ PIPE_BUF (4 KB) bytes are atomic on POSIX systems; every JSON line is well under this limit (CF-MA6-04).

Emission is fail-open: if the log is unwritable (disk full, permissions error), a warning is logged but the emitter does not throw. Reinforcement is feedback, not control; losing a sample is recoverable; blocking the calling module is not.

---

## How Eligibility Traces Decay Per Channel

MA-1 attaches an exponentially-decayed eligibility trace to every active feature at the M5 decision boundary, computed per Barto 1983 Eq. 3 (p. 841):

```
eᵢ(t+1) = δ · eᵢ(t) + (1 − δ) · y(t) · xᵢ(t)
```

where `δ = 0.9` (default, matching Barto 1983 p. 844 col. 1), `y(t)` is the selector's scalar output, and `xᵢ(t)` is the feature's activation value. The trace represents how much each feature contributed to the action that was taken; it decays at rate `δ` per tick.

The decay constant is uniform across all channels in MA-1 v1; channel-specific decay is a second-wave refinement (open question O-2 in this repository). The practical consequence: a `test-fail` emitted 10 ticks after the action that caused it still propagates credit backward through `δ^10 ≈ 0.35` of the original eligibility, meaning actions up to ~20 ticks in the past receive non-trivial update signal from outcomes they caused.

---

## What MA-2 Does With the Events

MA-2 reads the reinforcement log alongside the M7 free-energy history to compute the Temporal Difference error:

```
δ(t) = r(t) + γ · [−F(t)] − [−F(t−1)]
```

where `r(t)` is the scalar from the MA-6 log, `F(t)` is M7's current free-energy, and `−F` maps minimise-free-energy to maximise-value per Friston et al. 2013. The TD error `δ` is then scaled by ME-1's tractability weight before updating M5's selector weights via the eligibility trace:

```
wᵢ(t+1) = wᵢ(t) + α · (δ · tract_weight) · eᵢ(t)
```

This is the Barto 1983 Eq. 2 update rule, with ME-1's tractability weight substituting for a fixed learning rate. Tractable skills receive the full gradient; coin-flip skills receive 30% of it; unknown skills receive 60%. The weighting is a response to signal-to-noise ratio, not a gate: even coin-flip skills contribute directional information at reduced scale.

MA-6 itself is not tractability-conditional at emission — reinforcement events are observations of the world. The tractability weighting occurs at consumption in MA-2 and MA-1, not at the point of recording.

---

## Feature Flag

With `traces.reinforcement = false` (or `REINFORCEMENT_EMIT=false`), no log is written, no emitter is active, and the stack behaves byte-identical to pre-refinement v1.49.561 (SC-MA6-01).

---

## Primary Sources

- Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems." *IEEE Transactions on Systems, Man, and Cybernetics*, SMC-13(5):834–846. §III–IV (selectional vs instructional learning); p. 840 footnote 2 (sign convention); Eq. 2 p. 840 (weight update rule); Eq. 5 p. 842 (TD error requires `r(t)` scalar).
- Friston, K., et al. (2013). "The anatomy of choice: active inference and agency." *Frontiers in Human Neuroscience* 7:598. DOI: 10.3389/fnhum.2013.00598. (EFE-RL equivalence, sign mapping `p(t) = −F(t)`.)
- Sutton, R. S., & Barto, A. G. (2018). *Reinforcement Learning: An Introduction* (2nd ed.). MIT Press. Ch. 3 (MDP reward), Ch. 6 (TD target requires `r(t)`).

---

## See Also

- `docs/tractability.md` — ME-1 classifier that scales reinforcement at MA-2 consumption
- `docs/actor-critic.md` — MA-2 TD-error wire that consumes MA-6 events
- `docs/refinement-wave.md` — end-to-end overview of the refinement wave
- `docs/EXTENSIONS.md` — `REINFORCEMENT_EMIT` flag documentation
