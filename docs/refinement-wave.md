# Refinement Wave — Living Sensoria (v1.49.561)

**Wave:** R (phases 651–660)  
**Parent:** Living Sensoria (phases 636–650)  
**Branch:** dev  
**Date:** 2026-04-18  
**Status:** shipped — all six components + integration committed and tested

---

## The Problem This Solves

v1.49.561's Living Sensoria base wave (phases 636–650) shipped eight composable modules. Two of those modules — M5 Agentic Orchestration (selector) and M7 Umwelt (free-energy minimiser) — are structurally equivalent to the Associative Search Element (actor) and Adaptive Critic Element (critic) from Barto, Sutton & Anderson 1983. They existed as two independently-working components with no feedback connection between them.

The refinement wave adds that connection. The central insight comes from Zhang et al. 2026 (arXiv:2604.14585), which finds that prompt-level optimisation is statistically indistinguishable from a coin flip for ~49% of runs on prose-commentary tasks — but reliably improves outcomes on tasks with exploitable output structure ("can but doesn't" pattern, §4.3). Applied to the Living Sensoria stack, this finding produces a single diagnostic question: for which of our skills is adaptation even justified?

The answer requires a tractability gate. Without it, actor-critic wiring and reinforcement channel machinery operate on indiscriminate signal — coin-flip regime noise amplified through a feedback loop. With ME-1's tractability classifier as the keystone, the system knows *before running adaptation* whether the target skill's regime justifies it.

---

## The Through-Line: ME-5 → ME-1 → MA-6 → MA-1 → MA-2 → ME-4

The six refinement components compose along a single data-flow chain:

```
ME-5 declares output structure in frontmatter
   → ME-1 classifies tractability (tractable | coin-flip | unknown)
      → MA-6 canonicalises reinforcement channels (five event kinds, signed scalar r(t))
         → MA-1 records eligibility-decayed reinforcement events (eᵢ(t) tensor)
            → MA-2 drives actor-critic loop (TD error = r(t) + γ·ΔF, weighted by ME-1)
               → ME-4 surfaces tractability warnings via M8 teach entries
```

Each step in the chain produces a typed artefact consumed by the next:

| Component | Produces | Consumed by |
|-----------|----------|-------------|
| ME-5 output-structure frontmatter | `output_structure` + `output_schema` fields | ME-1 classifier |
| ME-1 tractability classifier | `TractabilityClass` ∈ {tractable, coin-flip, unknown} | MA-2 (weight), ME-4 (annotation) |
| MA-6 canonical reinforcement taxonomy | `ReinforcementEvent` + `r(t)` scalar | MA-1 (trace update), MA-2 (TD input) |
| MA-1 eligibility-trace layer | `eᵢ(t)` Map per feature | MA-2 (actor update) |
| MA-2 ACE TD-error wire | `δ(t)` + tractability-weighted weight delta | M5 selector weights (live update) |
| ME-4 coin-flip teach warning | `coinflip_warning` + `expected_effect` annotation on teach entries | MA-6 `refinement-accept` magnitude scaling |

---

## What Each Component Adds

**ME-5** adds two optional fields to the cartridge frontmatter schema (`output_structure: structured | prose | hybrid`, `output_schema: string`), ships a one-time migration pass over existing skills with dry-run-first behaviour, and updates `cartridge-forge` templates to require the fields for new skills. It is the enabler; it writes the inputs ME-1 reads.

**ME-1** is the keystone: a ~40-line pure function that classifies every skill by optimisation tractability from its frontmatter alone. It conditions or weights nine downstream methods across the refinement wave and later waves. `skill-creator tractability <skill>` and `skill-creator audit --tractability` are the developer-facing surfaces.

**MA-6** defines the canonical `ReinforcementEvent` discriminated union with a frozen sign convention per Barto 1983 p. 840 footnote 2, an append-only JSONL log, and the `r(t)` scalar extractor. Five kinds: `user-correction` (−1), `test-fail` (−1), `commit-revert` (−1), `undo` (−1), `test-pass` (+1), `user-confirm` (+1), `refinement-accept` (+1, scaled by ME-4). Concurrent emissions are serialised via POSIX `O_APPEND`.

**MA-1** attaches an exponentially-decayed eligibility trace to each active M5 decision feature per Barto 1983 Eq. 3 (p. 841), with `δ = 0.9` default. The trace lives as a derived index alongside the M3 ledger, keeping the ledger itself human-readable. Memory is bounded by O(|active features|) through 1e-12 pruning.

**MA-2** closes the actor-critic loop: reads M7 free energy as `p(t) = −F(t)`, reads MA-6's `r(t)`, computes `δ(t) = r(t) + γ·[−F(t)] − [−F(t−1)]`, scales `δ` by ME-1's tractability weight, and applies the Barto 1983 Eq. 2 weight update to M5's selector weights via MA-1's eligibility trace. Flag-off is byte-identical to pre-refinement v1.49.561 (SC-MA2-01, SC-REF-FLAG-OFF).

**ME-4** reads ME-1's classification at teach-entry commit time and annotates the teaching ledger entry with `coinflip_warning: true` and `expected_effect: 'unmeasurable'` for coin-flip skills. The entry still commits. MA-6's `refinement-accept` emission then scales magnitude by the annotation: `reliable → 1.0`, `unknown → 0.6`, `unmeasurable → 0.3`. The CLI surfaces a neutral one-line message.

---

## Grove-Posture Summary

All six components are **NEW-LAYER or EXTEND**. Zero REWRITEs were executed in the refinement wave, matching the base mission's posture. Specific decisions:

| Component | Grove decision |
|-----------|----------------|
| ME-5 output-structure | NEW-LAYER (`src/output-structure/`) |
| MA-6 reinforcement | NEW-LAYER (`src/traces/reinforcement.ts`) + EXTEND mesh/event-log (new `reinforcement_event` MeshEventType) |
| ME-1 tractability | NEW-LAYER (`src/tractability/`) |
| MA-1 eligibility | NEW-LAYER (`src/eligibility/`) |
| MA-2 ACE | NEW-LAYER (`src/ace/`) + MINIMAL-EXTEND `selector.ts` (optional `aceSignal` param, flag-gated) |
| ME-4 teach warning | NEW-LAYER (`src/symbiosis/expected-effect.ts`, `teach-warning.ts`) + EXTEND `teaching.ts`, `cli.ts` |

---

## Activation Sequence

All refinement flags default off. The recommended activation sequence:

1. **`SKILL_CREATOR_OUTPUT_STRUCTURE=true`** — enables ME-5 schema parsing. Run `node tools/migrations/output-structure-migrate.ts --dry-run`, review, then `--apply`.
2. **`SKILL_CREATOR_TRACTABILITY=true`** — enables ME-1. Run `skill-creator audit --tractability` and confirm ≥80% classification.
3. **`REINFORCEMENT_EMIT=true`** + **`traces.eligibility=true`** — enables MA-6 + MA-1. Seed the reinforcement log over ≥10 sessions before enabling the TD wire.
4. **`gsd-skill-creator.orchestration.ace.enabled=true`** — enables MA-2. Requires M5 and M7 to be enabled.
5. **`symbiosis.coinflip_warning=true`** — enables ME-4 teach annotations.

---

## Primary Sources

- Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems." *IEEE Transactions on Systems, Man, and Cybernetics*, SMC-13(5):834–846.
- Zhang, X., Wang, G., Cui, Y., Qiu, W., Li, Z., Zhu, B., He, P. (2026). "Prompt Optimization Is a Coin Flip: Diagnosing When It Helps in Compound AI Systems." arXiv:2604.14585v1.
- Friston, K., et al. (2013). "The anatomy of choice: active inference and agency." *Frontiers in Human Neuroscience* 7:598. DOI: 10.3389/fnhum.2013.00598.
- Kirchhoff, M., et al. (2018). "The Markov blankets of life." *J. R. Soc. Interface* 15:20170792. DOI: 10.1098/rsif.2017.0792.

---

## See Also

- `docs/tractability.md` — ME-1 full user guide
- `docs/reinforcement-taxonomy.md` — MA-6 full user guide
- `docs/actor-critic.md` — MA-2 full user guide
- `docs/EXTENSIONS.md` — all refinement flag documentation
- `docs/release-notes/v1.49.561/README.md` — per-phase commit table including the refinement wave
- `docs/release-notes/v1.49.561/regression-report-refinement.md` — test delta, acceptance gates, safety-critical results

---

## Continuation Wave Additions (phases 661–678)

Thirteen second-wave components ship across five bundles following the refinement wave close. All thirteen are NEW-LAYER; the zero-REWRITE posture holds across all three waves combined.

**Bundle 3 — Stability Rails (phases 661–663, LS-31..LS-33):** MB-1 Lyapunov-stable K_H adaptation, MB-2 smooth projection operators, and MB-5 dead-zone bounded learning apply classical adaptive-control stability theory (Sastry & Bodson 1989, Narendra & Annaswamy 1989) to the K_H learning loop introduced by MA-2. Together they certify V̇ ≤ 0 before each update, constrain parameter landing points to an admissible manifold, and suppress updates whose gradient magnitude falls inside the noise floor. Full guide: [docs/stability-rails.md](stability-rails.md).

**Bundle 4 — Exploration Harness (phases 664–666, LS-34..LS-36):** MA-3+MD-2 stochastic selection, MD-3 Langevin noise injection, and MD-4 temperature schedule implement structured exploration grounded in the SGLD framework of Welling & Teh 2011. The temperature schedule (MD-4) drives both the softmax sampler (MA-3+MD-2) and the noise injector (MD-3) from a single annealing signal derived from M8 Quintessence, so exploration naturally concentrates as signal accumulates. Full guide: [docs/exploration-harness.md](exploration-harness.md).

**Bundle 5 — Representation Frontier (phases 667–669, LS-37..LS-39):** MD-1 shallow learned embeddings (skip-gram / negative sampling, Mikolov et al. 2013 lineage), MD-5 per-(skill, task-type) learnable K_H heads, and MD-6 representation-audit (effective-rank + community separability) form the embedding substrate for compositional K_H specialisation. MD-6 monitors the embedding space for rank collapse and flags degradation before it affects MD-5's predictions. Full guide: [docs/representation-frontier.md](representation-frontier.md).

**Bundle 6 — Authoring Tools (phases 670–671, LS-40..LS-41):** ME-2 per-skill model affinity (Haiku→Sonnet→Opus escalation policy, tractability-gated) and ME-3 significance-gated A/B harness (built on M4 fork/explore/commit) give skill authors the operational controls needed to declare tier requirements and validate adaptation changes before committing them to production. Full guide: [docs/authoring-tools.md](authoring-tools.md).

**Bundle 7 — College + Rosetta (phases 672–673, LS-42..LS-43):** TC college bootstrap adds the adaptive-systems department under `.college/` and TC Rosetta translations add cross-domain translation tables under `.college/rosetta/`, closing GAP-2 from the v1.49.132 AAR audit. These are markdown-only additions; no code modules were introduced. See `.college/departments/adaptive-systems/` and `.college/rosetta/`.
