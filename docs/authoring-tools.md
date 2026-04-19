# Authoring Tools — Living Sensoria (v1.49.561)

**Wave:** Continuation — Bundle 6 (phases 670–671)
**Parent:** Living Sensoria continuation wave — Bundles 3–5 (phases 661–669)
**Branch:** dev
**Date:** 2026-04-19
**Status:** shipped — ME-2, ME-3 committed and tested

---

## The Problem This Solves

The five preceding bundles (original wave M1–M8, refinement wave ME-5/MA-6/ME-1/MA-1/MA-2/ME-4, continuation bundles 3–5) equip the runtime with a rich adaptation stack — stable K_H learning, structured exploration, learned embeddings. These capabilities are only useful if skill authors can (a) declare which model tier a skill requires and have the runtime enforce it automatically, and (b) run controlled experiments to verify that an adaptation change actually improves outcomes before committing it to the production skill.

Without ME-2, the only model-tier enforcement available is a coarse manual check. Without ME-3, the only way to validate a skill adaptation is to deploy it and observe the effect in production — with no significance gate, no rollback path, and no baseline to compare against.

ME-2 and ME-3 are developer-facing authoring tools. They do not add new learning mechanisms; they give authors the controls needed to operate the adaptation stack safely.

---

## Through-Line

```
ME-2 Model affinity reads skill frontmatter:
  resolveModelAffinity(skill) → ResolvedModelAffinity
  evaluateMatch(affinity, activeModel) → AffinityDecision
  if tractability mismatch → EscalationRateLimiter gates the recommendation
  skill-creator model-affinity CLI + batchAffinityDecisions() for audit sweeps

ME-3 A/B harness uses M4 branch-context as its fork primitive:
  runAB(control, candidate, options) opens M4 fork for each branch
  assigns sessions to control/candidate arms per requiredSampleSize()
  collects ABRunOutcome per session from M5 selector log
  runSignificanceTest() runs two-sided binomial test at α threshold
  if significant → coordinator emits ABVerdict {winner, p-value, effect-size}
  M4 commit() or abort() closes the fork depending on verdict
```

ME-2 and ME-3 are parallel paths, not chained. A skill can have model-affinity declared without running an A/B experiment, and vice versa.

---

## What Each Component Adds

**ME-2 Per-skill model affinity** (`src/model-affinity/`) adds a `model_affinity:` frontmatter block that declares which model tier (Haiku / Sonnet / Opus) a skill is calibrated for and what the escalation policy is on tractability mismatch. `schema.ts` defines `ModelAffinity` with `preferred_tier`, `escalation_policy ∈ {none, suggest, enforce}`, and `tractability_threshold`. `frontmatter.ts` (`resolveModelAffinity`) reads the block from the skill's cartridge frontmatter and applies defaults for skills that omit the block. `policy.ts` (`evaluateMatch`) takes the resolved affinity and the currently-active model tier and returns an `AffinityDecision ∈ {match, suggest-escalate, enforce-escalate, degraded}`. `EscalationRateLimiter` prevents repeated escalation suggestions within a configurable window — one suggestion per 24 hours by default — so the CLI does not become noisy. `api.ts` (`getAffinityDecision`, `batchAffinityDecisions`) are the M5-facing read APIs; `summariseEscalations` produces a session summary suitable for M8 Quintessence input. The CLI (`skill-creator model-affinity <skill>` + `--scan`) supports point queries and batch audit sweeps. When the flag is off, `getAffinityDecision` returns `null` and M5's selector ignores model-tier information entirely (SC-ME2-01). Flag: `gsd-skill-creator.model_affinity.enabled`.

**ME-3 Skill A/B harness** (`src/ab-harness/`) provides a significance-gated experimentation framework built directly on M4's fork/explore/commit lifecycle. `requiredSampleSize(α, power, baseRate)` uses a pre-computed power table (derived from two-sided binomial distribution) to determine the minimum number of sessions needed before a verdict is meaningful; `ABSOLUTE_MIN_SAMPLES = 10` is a hard floor regardless of power parameters. `coordinator.ts` (`runAB`) opens a `M4.fork()` for the control and candidate skill variants, routes sessions to arms based on a round-robin assignment, collects `ABRunOutcome` (which arm ran, what the M5 selector recorded as the outcome quality), and — once `requiredSampleSize` sessions have accumulated — calls `runSignificanceTest`. `stats.ts` (`runSignificanceTest`) implements a two-sided binomial test: `twoSidedBinomialP(successes, n, baseRate)` returns a p-value; `mean` and the `SignificanceResult` type capture the directional effect. `writeExperimentState` persists experiment progress to `AB_STATE_FILENAME` so experiments survive session restarts. When the significance threshold is met, `runAB` returns an `ABVerdict` with the winning arm identified; `coordinator.ts` then calls `M4.commit()` on the winner and `M4.abort()` on the loser. The CLI (`skill-creator ab <skill>`) provides status queries and manual verdict overrides. When the flag is off, `runAB` returns a `DISABLED` sentinel without opening any M4 fork (SC-ME3-01). Flag: `gsd-skill-creator.ab_harness.enabled`.

---

## Grove-Posture Summary

Both authoring-tool components are NEW-LAYER. Zero REWRITEs were executed.

| Component | Grove decision | Parent modules unchanged |
|-----------|---------------|--------------------------|
| ME-2 Model affinity | NEW-LAYER (`src/model-affinity/`) | M5 orchestration untouched |
| ME-3 A/B harness | NEW-LAYER (`src/ab-harness/`) | M4 branches untouched |

---

## Activation Sequence

Both authoring-tool flags default off and are independent of each other and of the exploration/representation bundles.

1. **`gsd-skill-creator.model_affinity.enabled: true`** — enables ME-2. Run `skill-creator model-affinity --scan` to audit the current skill library for missing `model_affinity:` blocks. Populate frontmatter for skills where tier mismatch is a known issue before setting `escalation_policy: enforce` on any skill.
2. **`gsd-skill-creator.ab_harness.enabled: true`** — enables ME-3. Before starting an experiment, confirm ME-1 tractability classification for the skill (`skill-creator tractability <skill>`). Tractable skills are suitable for A/B experimentation; coin-flip skills should be treated with caution — low tractability means the significance test may require a large sample before a real signal is detectable.

```json
{
  "gsd-skill-creator": {
    "model_affinity": {
      "enabled": false,
      "escalation_window_hours": 24
    },
    "ab_harness": {
      "enabled": false,
      "default_alpha": 0.05,
      "default_power": 0.8
    }
  }
}
```

### Running an A/B experiment end-to-end

```bash
# 1. Fork the candidate skill variant
skill-creator branches fork gsd-workflow --variant gsd-workflow-candidate

# 2. Edit the candidate variant's cartridge
skill-creator cartridge edit gsd-workflow-candidate

# 3. Start the A/B experiment (runs until requiredSampleSize sessions accumulate)
skill-creator ab gsd-workflow --candidate gsd-workflow-candidate --alpha 0.05

# 4. Check experiment status at any time
skill-creator ab gsd-workflow --status

# 5. Verdict fires automatically; or override manually
skill-creator ab gsd-workflow --commit candidate   # or --commit control to revert
```

---

## See Also

- `docs/stability-rails.md` — Bundle 3: MB-1/MB-2/MB-5 stability rails that protect parameters during adaptation
- `docs/exploration-harness.md` — Bundle 4: MA-3+MD-2/MD-3/MD-4 structured exploration
- `docs/representation-frontier.md` — Bundle 5: MD-1/MD-5/MD-6 learned embedding substrate that ME-3 experiments can validate
- `docs/refinement-wave.md` — ME-1 tractability classifier is a prerequisite gate for ME-3 experiment design; MA-2 ACE loop is what ME-3 validates when the flag is on
- `CHANGELOG.md` — `[v1.49.561]` → Continuation wave subsection
- `docs/release-notes/v1.49.561/README.md` — per-phase commit table (phases 670–671)
- `docs/release-notes/v1.49.561/regression-report-continuation.md` — test counts and acceptance-criterion coverage for LS-40..LS-41
