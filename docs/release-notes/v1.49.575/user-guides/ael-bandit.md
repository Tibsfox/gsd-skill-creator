# HB-07 AEL Fast/Slow Bandit Auto-Load — User Guide

**Path:** `src/skill-creator/auto-load/`
**Source paper:** arXiv:2604.21725 (AEL — beats five published
self-improving baselines on 208-episode portfolio)
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.ael-bandit.enabled`
**CAPCOM HARD GATE.**

## What it does

A two-timescale auto-load policy:

- **Fast loop** — Thompson Sampling over a Beta posterior selects a
  retrieval policy per episode. Reward = 1 iff the W/E/E Worker output
  passed the adversarial Evaluator with zero diagnostics; else 0.
- **Slow loop** — when the failure threshold is crossed, runs LLM
  reflection over the cross-skill failure-pattern history and produces
  zero or more `ReflectionInsight` records. Each insight, if
  high-confidence, is shaped into a `PolicyUpdateProposal`.

The bandit composes inside HB-04's Evolution role via the
`EvolutionExtensionPoint` interface. It is **not** a sibling system.

## How to enable + the double-gate semantic

HB-07 is a CAPCOM HARD GATE. Two independent gate authorizations are
required for the bandit to mutate state:

1. **HB-04 role-split CAPCOM** — `.planning/skill-creator/weler-roles.capcom`
   (non-empty). Without this, HB-04 short-circuits before the bandit is
   invoked.
2. **HB-07 bandit-engagement CAPCOM** —
   `.planning/skill-creator/ael-bandit.capcom` (non-empty). Without
   this, the bandit's `proposePolicyUpdate` returns null without
   touching its private posterior.

```bash
echo "human-foxy@2026-04-25" > .planning/skill-creator/weler-roles.capcom
echo "human-foxy@2026-04-25" > .planning/skill-creator/ael-bandit.capcom
```

```jsonc
{
  "gsd-skill-creator": {
    "cs25-26-sweep": {
      "weler-roles": { "enabled": true },
      "ael-bandit": { "enabled": true }
    }
  }
}
```

The double-gate is the load-bearing safety property: a bandit-source
policy update reaches the Evolution proposal set only when both
authorizations are present and the per-proposal `protocol-update` gate
also authorizes.

## Benchmark behavior

The HB-07 test suite includes a 3-policy convergence benchmark
(`bandit.test.ts`). The bandit converges to the best-arm proportion
within the published convergence bound on a synthetic 100-episode
portfolio (3 arms, two reward distributions per arm).

The Phase 813 `compose-hb04-hb07.test.ts` integration test exercises
the full lifecycle across the four (rolesAuth × banditAuth) quadrants;
only (T, T) accepts a bandit-source proposal.

## Default-off invariant

When the flag is off, `AelBandit.proposePolicyUpdate()` returns null;
the bandit posterior never advances. `evolutionPropose()` returns
`EVOLUTION_DISABLED_STATE` so the bandit is never invoked at all. The
existing skill-creator auto-load runs unchanged.
