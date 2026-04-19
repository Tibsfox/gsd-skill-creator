# Umwelt — M7 Markov-Blanket Boundary Layer

**Module:** M7  
**Register:** Boundary  
**Source:** Kirchhoff et al. 2018 (*J. R. Soc. Interface* 15:20170792); Friston 2010 (*Nature Reviews Neuroscience* 11(2):127–138)  
**Path:** `src/umwelt/`  
**Opt-in flag:** `gsd-skill-creator.umwelt.enabled`

---

## What It Is

Umwelt is the Markov-blanket boundary layer for gsd-skill-creator. It formalises a structural partition between the system's internal adaptive state and the developer's external workflow, then runs a variational free-energy minimiser to keep the internal model aligned with observed sensory inputs.

The term "umwelt" (Jakob von Uexküll, 1909) denotes the subset of an environment that is meaningfully accessible to a particular system — the effective world as bounded by that system's sensory and active interface. M7 does not claim the skill-creator has experience or perception; the term supplies a precise architectural referent: the system operates within a bounded sensory-active surface, and M7 makes that surface explicit, typed, and enforceable at both compile time and runtime.

This module is grounded in two primary sources:
- **Kirchhoff et al. 2018** (§2–3) — the Markov-blanket partition and the proof that any persistent system necessarily exhibits this structure.
- **Friston 2010** (Fig. 1 and surrounding text) — variational free energy as an upper bound on surprise, and its decomposition into epistemic and pragmatic terms.

See `docs/foundations/theoretical-audit.md` §4–§9 for the mathematical derivations and the explicit disclaimer that no biological or experiential claims are made.

---

## The Four State Categories

M7 enforces a strict partition of all system state into four categories, defined at the TypeScript type level in `src/umwelt/types.ts`:

| Category | Symbol | What it contains in skill-creator | Runtime role |
|----------|--------|------------------------------------|--------------|
| **Internal** | I | `.claude/` and `.planning/` — adaptive state updated by the system | Updated only through S and A; shielded from direct external mutation |
| **Sensory** | S | Read operations from the developer workflow — file reads, test results, CI status | Carries information inward; influenced by E, not directly by I |
| **Active** | A | Write operations reaching outward — skill files written, hooks configured, commits staged | Carries action outward; influences E, not directly readable as S |
| **External** | E | Developer workflow, filesystem, remote CI, human decisions | Accessed only through S; influenced only through A |

The defining conditional-independence property enforced at runtime is:

```
p(I, E | S, A) = p(I | S, A) · p(E | S, A)
```

Given the blanket states {S, A}, internal and external states are independent. M7's type system makes illegal cross-references (I reading E directly, A writing I directly) a compile-time error. See `src/umwelt/__tests__/blanket.test.ts` for the runtime enforcement tests (SC-M7-IND).

---

## Variational Free-Energy Minimiser

The minimiser in `src/umwelt/minimiser.ts` implements the Friston 2010 free-energy formula:

```
F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)]
```

where `q(I)` is the system's approximate posterior over hidden causes (the internal model's current belief state) and `p(S|I)` is the generative model's prediction of what sensory inputs should look like given internal state.

Minimising F has two effects:
1. **Epistemic:** reduces divergence between the internal model and the true posterior — the system updates its model to match observations.
2. **Pragmatic:** increases the expected log-likelihood of sensory inputs — the system's active outputs tend toward states that confirm model predictions.

The minimiser converges in ≤50ms on a 100-node model (LS-18 acceptance criterion). Prediction top-5 accuracy is ≥70% on the held-out 200-session fixture (LS-19).

---

## Surprise-Triggered Reflection

M7 monitors the incoming sensory stream for statistical surprise. Surprise at time t is:

```
s_t = −log p(S_t | I_t)
```

computed from the generative model's current prediction against the observed sensory state. The reflection policy uses a two-tier threshold:

| Signal level | z-score | Reflection triggered |
|--------------|---------|----------------------|
| Low surprise | < 1σ | No reflection |
| Moderate surprise | 1σ – 3σ | No reflection (gradual model update only) |
| High surprise | ≥ 3σ | 100% reflection rate — M7 writes to the surprise log (`src/umwelt/surprise-log.ts`) and triggers a reflection pass against M3 decision traces |

The 3σ trigger is tested by CF-M7-05 and the 1σ boundary by SC-EXT-DARK (LS-20). Both are acceptance criteria in the Living Sensoria milestone spec.

---

## The Dark-Room Guard

A known failure mode of free-energy minimisation is dark-room collapse: if the system is free to choose its active outputs (A states) with the sole goal of reducing surprise, it may converge on a minimal-activity state — writing nothing, triggering no skills, making no observations — because a silent system encounters no surprising inputs.

M7 guards against this with a configurable minimum-activity floor. If the active output rate (skill activations + file writes + hook triggers per session) falls below the floor for more than one session, M7 overrides the FEP minimiser for that session and forces a minimum baseline of active outputs. The floor is set in `.claude/settings.json`:

```json
{
  "gsd-skill-creator": {
    "umwelt": {
      "enabled": true,
      "dark_room_floor": 3
    }
  }
}
```

The default floor is `3` active outputs per session. SC-EXT-DARK verifies the guard passes at the zero-activity boundary.

---

## Enabling Umwelt

Umwelt is **opt-in** and defaults to off:

```json
{
  "gsd-skill-creator": {
    "umwelt": {
      "enabled": true
    }
  }
}
```

When disabled, no Markov-blanket partitioning or free-energy minimisation runs. The existing v1.49.560 skill-activation path is byte-identical. When enabled, M7 initialises its generative model from M1 community structure on session start and updates it continuously from the sensory stream.

---

## Primary Sources

- Kirchhoff, M., Parr, T., Palacios, E., Friston, K., Kiverstein, J. (2018). "The Markov blankets of life: autonomy, active inference and the free energy principle." *J. R. Soc. Interface* 15:20170792. §2–3 for the partition definition and persistence-implies-blanket proof. DOI: 10.1098/rsif.2017.0792.
- Friston, K. (2010). "The free-energy principle: a unified brain theory?" *Nature Reviews Neuroscience* 11(2):127–138. Fig. 1 and surrounding text for the F = D_KL − E_q formulation. DOI: 10.1038/nrn2787.
- Friston, K., Schwartenbeck, P., FitzGerald, T., Moutoussis, M., Behrens, T., Dolan, R. J. (2013). "The anatomy of choice: active inference and agency." *Frontiers in Human Neuroscience* 7:598. §Active inference and agency. DOI: 10.3389/fnhum.2013.00598.

---

## See Also

- `docs/sensoria.md` — M6 net-shift receptor substrate
- `docs/symbiosis.md` — M8 teaching and co-evolution layer
- `docs/memory-stack.md` — M1–M5 memory and orchestration substrate (M7 reads M1 communities and M3 traces)
- `docs/foundations/theoretical-audit.md` — Full theoretical audit with primary-source citations
