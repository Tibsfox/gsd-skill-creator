---
title: "v1.49.950 — machine-track the cadence ships-since second conjunct (candidate -> overdue gate)"
version: v1.49.950
date: 2026-06-02
summary: >
  Item 3 (final) of the post-v1.49.947 "1 2 3" batch: make `skill-creator cadence`
  a true gate. The v1.49.947 tool computed each axis's FIRST conjunct from live
  state but left the SECOND conjunct (">=10 ships since the axis last advanced")
  operator-tracked, so a met first conjunct could only ever report `candidate`.
  This ship machine-tracks the second conjunct via a `cadence_advances: [axis, ...]`
  frontmatter marker on release-notes READMEs: the most recent ship tagging an axis
  anchors its ships-since count (readAxisAdvances). A `candidate` whose axis has
  >=CADENCE_SHIPS_SINCE_CONJUNCT (10) ships since its anchor is upgraded to a new
  `overdue` status, and `--check` now fires (exit 1) only on `overdue` — a true
  gate. Honest by construction: an axis with no marker, or fewer than 10 ships
  since, stays `candidate` (never a false `overdue`). Seeded with the two genuine
  recent consume ships (v1.49.944, v1.49.946) as the first producers. 12 new tests;
  the >=10 boundary is mutation-proven.
tags: [feat, cli, cadence, meta-cadence, ships-since, lesson-10428, lesson-10461]
---

# v1.49.950 — machine-track the cadence ships-since second conjunct (candidate -> overdue gate)

**Shipped:** 2026-06-02

One-line: the meta-cadence overdue-check's second conjunct ("`>=10` ships since the axis last advanced") is now machine-tracked via release-notes `cadence_advances` frontmatter, so a met first conjunct upgrades `candidate` -> definitive `overdue` and `cadence --check` becomes a true gate.

## Why this ship

Item 3 (final) of the operator-directed "1 2 3" batch from the post-v1.49.947 handoff: "Add per-axis ships-since tracking to cadence ... so a met first conjunct can upgrade candidate -> definitive overdue. Then `cadence --check` becomes a true gate." The v1.49.947 tool deliberately left the second conjunct operator-tracked (faking it would have been worse than the prose check); this ship supplies the machine-readable source the handoff suggested — release-notes frontmatter axis tags.

## What shipped

- **The `cadence_advances` frontmatter convention.** A release-notes README declares which meta-cadence axes its ship advanced, e.g. `cadence_advances: [consume]`. The most recent ship tagging an axis anchors that axis's ships-since count.
- **`readAxisAdvances(releaseNotesDir)`** — scans release-notes READMEs, semver-sorts the `vX.Y.Z` dirs, and returns per-axis `{ lastVersion, shipsSince }` (ships shipped after the most recent advancing ship; 0 = it is the latest). Axes never tagged are absent (ships-since unknown).
- **The `overdue` status + `shipsSinceUpgrade`.** A first-conjunct `candidate` whose axis has `>=CADENCE_SHIPS_SINCE_CONJUNCT` (10) ships since its anchor is upgraded to `overdue`. A `candidate` with an unknown anchor, or fewer than 10 ships, stays `candidate` — never a false `overdue`. Non-candidate statuses (`not-overdue` / `manual`) are never upgraded.
- **`--check` is now a true gate.** It fires (exit 1) only on a definitive `overdue` (both conjuncts machine-met). `candidate` is advisory (printed, exit 0). This is a deliberate semantics shift from v1.49.947, where `--check` fired on any `candidate`.
- **Per-report `shipsSince` / `lastAdvanceVersion` data + an `[OVERDUE]` tag + `overdueCount` in JSON.**
- **Seeded with real producers.** The two genuine recent consume ships — v1.49.944 (retention_days) and v1.49.946 (max_entries) — are tagged `cadence_advances: [consume]`, so the reader runs on real data (honoring #10461: don't ship a surface with no producer). This ship is NOT self-tagged: it is meta-tooling for the cadence command and does not itself advance any of the four measured axes (it promotes no manifest lesson, so it is not a codify advance).
- **`docs/meta-cadence-discipline.md`** — the "Honest limit" section is rewritten as "Second conjunct (machine-tracked at v1.49.950)".

## Behavior on the live repo (honest, nothing forced)

- **consume**: anchored at v1.49.946, ships-since reported — but its FIRST conjunct is not met (0 genuinely-unwired), so it stays `not-overdue`. The anchor is real and displayed.
- **verify**: `candidate` (the 3 `suggestions.*` thresholds lack a dedicated end-to-end test) with ships-since **unknown** — no verify advance is tagged, so it honestly stays `candidate` rather than guessing an ancient anchor. The detail names exactly how to enable detection.
- **calibrate / codify**: not-overdue / manual (first conjunct unmet / no machine signal).
- **Nothing is `overdue`** and `--check` exits 0 — the honest current state. The gate is wired and ready; it fires the moment a tagged axis's first conjunct is met with `>=10` ships since.

## Verification

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 35/35 (23 prior + 12 new): `shipsSinceUpgrade` pure cases, `readAxisAdvances` (semver sort, multi-axis, unknown, unreadable), `cadenceCheckExitCode`, and end-to-end upgrade (a live `candidate` verify axis flips to `overdue` against a synthetic release-notes dir tagging it `>=10` ships back).
- **Mutation-proven:** tightening the `>=10` conjunct to `>10` keeps the boundary case (`shipsSince=10`) at `candidate`, failing the overdue test.
- Affected scope (`src/cli`, `src/bounded-learning`) **916/916**.
- Focused adversarial review (see chapters for verdict).

## Engine state

NASA degree **1.178** (unchanged). **Counter-cadence #24** (unchanged — this is a `feat`). Manifest **151** (unchanged — completes the meta-cadence tool; applies #10428 / #10461 / #10427; records a carried-forward candidate).
