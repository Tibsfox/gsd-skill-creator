---
title: "v1.49.981 — Skill-mining default-on + bootstrap co-activation thresholds"
version: v1.49.981
date: 2026-06-05
summary: >
  Ship 5.1c: flips observation.mine_active_skills ON by default and lowers the
  co-activation → agent-suggestion thresholds so the learning loop wired in 5.1
  can actually start collecting and, eventually, surface a suggestion. A recon
  pass first established the honest truth — at current data volume no suggestion
  surfaces yet; 5.1c "starts the clock" rather than shipping a working suggester.
tags: [release, observation, learning-loop, phase-5]
---

# v1.49.981 — Skill-mining default-on + bootstrap co-activation thresholds

**Shipped:** 2026-06-05

One-line: turn on transcript skill-mining by default and lower the co-activation bar so a recurring skill pair *can* surface — the loop now starts accumulating real signal.

## Why this ship

v1.49.980 (Ship 5.1) restored the `agents suggest` plumbing (envelope-unwrap fix) and added transcript skill-mining behind a default-OFF flag. 5.1c was scoped as "flip the flag on + tune the cluster-detector thresholds." A read-only recon pass established the load-bearing truth before any value was chosen: **at current data volume no co-activation suggestion can surface regardless of thresholds.** Across 221 transcripts only 6 sessions have ≥2 distinct skills and no skill pair has ever co-occurred in more than one session; the live `sessions.jsonl` source has zero records with a non-empty `activeSkills` (the flag was off when they were written); and the flag only mines future session-ends (no backfill). The recon also corrected the handoff's plan: `stabilityDays` is a no-op (never read as a gate), the thresholds were not config-wired at all, and there are two same-named `minCoActivations` knobs whose net gate is the max. With that understood, the operator chose to ship 5.1c as a "start-the-clock" data-collection enabler with a reachable bar.

## What shipped

- **Flag flip — `observation.mine_active_skills` default `false` → `true`.** Synced across all four default sites: the schema field default, the composite-object fallback literal, and both install templates (`gsd-init.ts`, `install.cjs`). The OFF path is unchanged and byte-identical; operators can still opt out with an explicit `false`. Configs that predate the field (key absent) auto-inherit `true` on read; installs created by 5.1b carry an explicit `false` and need a manual flip.
- **Bootstrap co-activation thresholds — at the `AgentSuggestionManager` layer only.** New `BOOTSTRAP_COACTIVATION_CONFIG` (`minCoActivations: 2`, `recencyDays: 30`) and `BOOTSTRAP_CLUSTER_CONFIG` (`minCoActivations: 2`), applied via spread-merge through two new optional `Partial<Config>` constructor args. Both `minCoActivations` knobs are lowered together (net edge gate = `max` = 2). The shared `DEFAULT_*_CONFIG` constants — also read by `graph.ts`, `event-suggester`, `bundle-suggester` — are deliberately left untouched, so the lower bar applies only to this consumer. `stabilityDays` is intentionally not set (not a filter gate).
- **Comment stragglers fixed.** Adversarial review caught two runtime-reader comments (`session-observer.ts`, `session-end.ts`) still describing the config default as "false"; corrected, and the intentional fail-closed ctor/config divergence is now documented.

## Verification

- `npm run build` clean; full `npx vitest run` **35,742 passed / 0 real failures** (a single `src/graph` latency test load-flaked under the concurrent review fleet on the first gate run; passes in isolation and on the clean re-run).
- **pre-tag-gate 20/20** on a clean (no-competing-load) re-run.
- **Adversarial ship review** (5 lenses → adversarial refute): 15 findings, **14 refuted / 1 confirmed**. The confirmed MINOR (stale comments) was fixed in code. Refuted set confirmed: globals untouched, off-path byte-identical, no egress/privacy/traversal surface, bootstrap-const mutability a non-bug (ctor spread-copies).
- New tests live in existing `src/` suites → **pre-tag-gate stays at 20 steps.** 4 bootstrap differential tests pin the gate-lowering (5→2), recency-widening (14→30), and per-call override path; the schema default assertion was flipped and an opt-out test added.

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 feat; no new lesson promoted).
