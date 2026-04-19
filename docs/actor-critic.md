# Actor-Critic Wire — MA-2 (ACE)

**Component:** MA-2  
**Register:** Mechanism  
**Source:** Barto, Sutton & Anderson 1983, §VIII, pp. 841–844; Friston et al. 2013  
**Path:** `src/umwelt/tdError.ts`, `src/orchestration/actorUpdate.ts`  
**Opt-in flag:** `gsd-skill-creator.orchestration.ace.enabled`

---

## What It Is

MA-2 is the Adaptive Critic Element (ACE) wire for gsd-skill-creator's Living Sensoria stack. It closes the actor-critic loop that Barto, Sutton & Anderson 1983 identify as the load-bearing engineering move for learning from sparse reinforcement: rather than updating the actor (M5 selector) directly from the raw environmental signal `r(t)` — which arrives rarely and with high delay — MA-2 computes a dense per-step TD error from M7's free-energy trajectory and routes it back to M5.

Barto 1983 p. 843 Fig. 4 and p. 844 col. 1 demonstrate the empirical consequence: the Associative Search Element (ASE) alone fails to learn the pole-balancing task because reinforcement is too sparse; the ACE-provided internal reinforcement is what allows convergence. The same gap exists in the v1.49.561 base stack: M5 (selector) is a dormant ASE and M7 (free-energy minimiser) is a dormant ACE. MA-2 is the missing wire.

---

## Barto's ASE/ACE as the Architectural Root

Barto 1983 introduces two neuronlike adaptive elements:

- **ASE (Associative Search Element):** The actor. Selects actions stochastically based on a weighted feature vector; updates its weights from a reinforcement signal. Corresponds to M5 in the Living Sensoria stack.
- **ACE (Adaptive Critic Element):** The critic. Maintains an internal prediction of future reinforcement; emits a dense per-step "evaluation signal" that replaces the sparse terminal reinforcement. Corresponds to M7 in the Living Sensoria stack.

The ACE's evaluation signal is computed as a temporal-difference error (Barto 1983 Eq. 5, p. 842):

```
δ(t) = r(t) + γ · p(t) − p(t−1)
```

where `p(t)` is the ACE's internal prediction (its estimate of future reinforcement), `r(t)` is the environmental reinforcement signal, and `γ` is the discount factor. This signal (`r̂(t) = δ(t)`, Eq. 7) then replaces raw `r(t)` in the ASE's weight update (Eq. 2), turning the sparse terminal signal into a dense per-step training target.

In the Living Sensoria stack:
- M5 Agentic Orchestration selector is the **actor** (ASE)
- M7 Umwelt free-energy minimiser is the **critic** (ACE)
- MA-6 reinforcement log provides `r(t)`
- MA-1 eligibility traces provide `eᵢ(t)`
- MA-2 computes the TD error and routes it back to M5

---

## The TD-Error Wire with Tractability Weighting

MA-2 maps M7 free energy to the ACE's `p(t)` via negation: `p(t) = −F(t)`. A lower free energy corresponds to a higher predicted future value — the system minimises free energy (surprise), so a low `F` means the current state is well-predicted and desirable. The TD error:

```typescript
// Barto 1983 Eq. 5: δ = r(t) + γ · p(t) − p(t−1)
const p_t      = -F_t;
const p_tMinus = -F_tMinus1;
const δ = r_t + γ * p_t - p_tMinus;
```

The default discount factor `γ = 0.95` matches Barto 1983 p. 844 col. 1. A biology-grounded alternative — `γ = exp(−Δt / τ_recovery)` where `τ_recovery` is derived from M6's `K_H` receptor-recovery timescale — is an open derivation (Thread A Q1; open question T-3) and will pin the default in a future wave once the mapping is formally established.

The actor update applies ME-1's tractability weight before modifying M5's selector weights:

```typescript
// Barto 1983 Eq. 2: wᵢ(t+1) = wᵢ(t) + α · r̂(t) · eᵢ(t)
// With tractability weighting: r̂(t) → r̂(t) · tract_weight
for (const [id, e] of eᵢ) {
  next.set(id, w + α * (δ * tract_weight) * e);
}
```

The three tractability weights are `{tractable: 1.0, unknown: 0.6, 'coin-flip': 0.3}`. Coin-flip skills still contribute to the TD signal at 30% magnitude — weighting, not gating. The distinction matters: Zhang 2026's coin-flip finding shows the *expected value* of optimisation on prose skills is near zero, but individual events are not always zero. Scaling the learning rate preserves directional information while preventing noise amplification. Gating to zero would discard the 30% of coin-flip events that carry genuine signal (SUMMARY.md §4 T-E-A resolution, this repository; Sutton & Barto 2018 §11).

Linear function approximation is used for the value function, matching Barto 1983 Eq. 4 and ensuring on-policy convergence per Tsitsiklis & Van Roy 1997.

---

## When to Turn It On

MA-2 defaults off. The `gsd-skill-creator.orchestration.ace.enabled` flag gates the entire wire:

```json
{
  "gsd-skill-creator": {
    "orchestration": {
      "enabled": true,
      "ace": {
        "enabled": true,
        "gamma": 0.95
      }
    }
  }
}
```

**Prerequisites before enabling:**
1. M5 Agentic Orchestration must be enabled (`gsd-skill-creator.orchestration.enabled = true`)
2. M7 Umwelt must be enabled (`gsd-skill-creator.umwelt.enabled = true`) — MA-2 reads `F(t)` from M7's VMP output
3. MA-6 reinforcement taxonomy must be active (`REINFORCEMENT_EMIT=true`) — MA-2 reads `r(t)` from the reinforcement log
4. MA-1 eligibility traces must be active (`traces.eligibility=true`) — MA-2 reads `eᵢ(t)` from the eligibility index
5. ME-1 tractability classifier must be active (`SKILL_CREATOR_TRACTABILITY=true`) — MA-2 reads tractability weights

The recommended activation sequence is:
1. Run `skill-creator audit --tractability` to confirm ≥80% of skills are classified
2. Enable MA-6, MA-1, ME-1 flags and run for ≥10 sessions to seed the reinforcement log
3. Enable MA-2 (`ace.enabled = true`)

---

## Flag-Off Byte-Identical Guarantee

With `ace.enabled = false` (the default), MA-2 inserts no code into M5's selection path. SC-MA2-01 verifies this: M5's selector weights are frozen and its output is byte-identical to pre-refinement v1.49.561. SC-REF-FLAG-OFF extends this guarantee over the entire refinement wave: under three independent captures with all refinement flags off, the selector output is JSON-identical across 50 sessions.

---

## Markov-Blanket Compatibility

A cross-blanket concern was raised during design (SUMMARY.md §4 Tension 5, citing Kirchhoff et al. 2018 §2–3): does routing the TD error from M7 (internal) into M5 (active) constitute an illegal internal→external state update? The resolution: `r(t)` arrives at sensory states (test outcomes, user corrections are surface-level observations); the free-energy trajectory is internal; `δ` is an internal scalar; the parameter-update is an Active-state action (the selector choosing the next policy). The update is a legal Active-state → Internal-state channel under Kirchhoff 2018's partition. No cross-blanket leak occurs.

---

## Primary Sources

- Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems." *IEEE Transactions on Systems, Man, and Cybernetics*, SMC-13(5):834–846. Eq. (2) p. 840 (ASE weight update); Eq. (4) p. 842 (linear ACE); Eq. (5) p. 842 (TD regression); Eq. (7) p. 842 (internal reinforcement `r̂` replaces `r`); p. 843 Fig. 4 + p. 844 col. 1 (ASE-alone fails; ACE is load-bearing).
- Friston, K., et al. (2013). "The anatomy of choice: active inference and agency." *Frontiers in Human Neuroscience* 7:598. DOI: 10.3389/fnhum.2013.00598. (EFE-RL equivalence; pragmatic term as log-reward.)
- Kirchhoff, M., Parr, T., Palacios, E., Friston, K., Kiverstein, J. (2018). "The Markov blankets of life." *J. R. Soc. Interface* 15:20170792. §2–3 (internal/active partition; TD update as Active-state channel). DOI: 10.1098/rsif.2017.0792.
- Tsitsiklis, J. N., & Van Roy, B. (1997). "An Analysis of Temporal-Difference Learning with Function Approximation." *IEEE Transactions on Automatic Control* 42(5):674–690. (On-policy linear-TD convergence guarantee.)
- Zhang, X., et al. (2026). arXiv:2604.14585v1. §5 (model specificity dominates); T-E-A resolution (tractability weighting as response to coin-flip noise).

---

## See Also

- `docs/tractability.md` — ME-1 classifier that provides the tractability weight
- `docs/reinforcement-taxonomy.md` — MA-6 canonical reinforcement channels that provide `r(t)`
- `docs/refinement-wave.md` — end-to-end overview of the refinement wave
- `docs/umwelt.md` — M7 free-energy minimiser that provides `F(t)`
- `docs/memory-stack.md` — M5 selector that is the actor in the actor-critic pair
