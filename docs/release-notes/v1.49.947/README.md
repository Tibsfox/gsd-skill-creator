---
title: "v1.49.947 — skill-creator cadence CLI: deterministic meta-cadence overdue-check (counter-cadence #24, gate-not-vigilance)"
version: v1.49.947
date: 2026-06-01
summary: >
  Counter-cadence #24 (gate-not-vigilance / discipline-as-code): realize the
  forward-shadow in docs/meta-cadence-discipline.md as a built tool. The prose
  cadence-overdue check was MISAPPLIED twice in the v1.49.944 session — calibrate's
  ">=20 observations AND >=10 ships" conjunct was read as met when the most-populated
  threshold had only 12 observations, and consume was false-positived by
  string-matching wired:false against the DEFENSIVE catch-all branches in
  observation-sources.ts (which fire only for non-existent threshold classes). Both
  were trigger-READING errors. The new `skill-creator cadence [--axis X] [--check]
  [--json]` command surfaces the machine-readable first-conjunct signal per axis so
  those reading errors cannot recur: calibrate reads ACTUAL observation counts;
  consume enumerates the REAL CalibratableThreshold union members (catch-all-proof).
  codify is reported `manual` (no structured candidate backlog); verify is a labelled
  heuristic. The "N ships since last X" second conjunct stays operator-tracked, so a
  met first conjunct yields `candidate` (confirm manually), never a silent "overdue".
tags: [feat, cli, counter-cadence, gate-not-vigilance, meta-cadence, discipline-as-code, lesson-10428, lesson-10461]
---

# v1.49.947 — `skill-creator cadence` CLI: deterministic meta-cadence overdue-check (counter-cadence #24)

**Shipped:** 2026-06-01

One-line: the meta-cadence overdue-check, which two careful agents mis-read in a single session, is now a deterministic CLI that surfaces the actual per-axis numbers — so the conjunct-drop and catch-all-false-positive reading errors cannot recur.

## Why this ship

`docs/meta-cadence-discipline.md` carried a "Forward-shadow: programmatic cadence-overdue check" section describing a future `skill-creator cadence` CLI, marked "tentative, not a candidate; the prose check is sufficient." The v1.49.944 session supplied the evidence to promote it: the prose check was **misapplied twice in one session**, both times as trigger-READING errors —

1. **calibrate** — the trigger is conjunctive (`>=20 observations AND >=10 ships since last run`). It was read as met when the most-populated wired threshold had only **12** committed observations (the `>=20` first conjunct was simply false).
2. **consume** — the trigger ("any substrate module with `wired: false` in its observation-source registry") was string-matched against the **defensive catch-all branches** in `observation-sources.ts` (`if (threshold.startsWith('observation.'))` etc.), which return `wired: false` only for *non-existent* threshold classes. The real `CalibratableThreshold` union members are all wired, so the genuine count is zero.

Per the counter-cadence gate-not-vigilance discipline — convert an offending rule into a gate, not a re-emphasized prose rule — this ship builds the deterministic surface.

## What shipped

- **`src/cli/commands/cadence.ts`** (new) — `skill-creator cadence [--axis codify|consume|calibrate|verify] [--check] [--json]`. Per-axis verdict: `not-overdue` / `candidate` / `manual`.
  - **calibrate** (machine-readable) — enumerates `ALL_CALIBRATABLE_THRESHOLDS`, reads the ACTUAL observation count per wired threshold via `loadObservationsForThreshold`, and flags `candidate` only if a wired threshold has reached the `>=20` first conjunct. On the live repo it reports `max observations = 12 (< 20) -> not overdue` — the correct verdict the session mis-read.
  - **consume** (machine-readable) — enumerates the REAL union members and counts the genuinely `wired:false` ones. The catch-alls never appear because the tool iterates real members, not the registry source. On the live repo: `all 7 wired; 0 genuinely-unwired -> not overdue`.
  - **codify** (`manual`) — no structured ESTABLISHED-candidate backlog exists; reports the manifest lesson count for context and defers to the prose check.
  - **verify** (heuristic) — reports whether any `tests/integration/` file references each wired threshold's string. Best-effort, labelled as such.
- **`src/bounded-learning/types.ts`** — a runtime `ALL_CALIBRATABLE_THRESHOLDS` array (the union is compile-time only) plus a **compile-time completeness guard**: `as const satisfies readonly CalibratableThreshold[]` (rejects a non-member typo) + a `_AllThresholdsCovered` conditional-type assertion (fails to compile if a union member is added without being appended to the array). Pins both directions of type/runtime-array drift per #10461.
- **`src/cli/dispatch.ts`** — registers the `cadence` / `cad` aliases.
- **`docs/meta-cadence-discipline.md`** — the forward-shadow section is rewritten as "Programmatic cadence-overdue check (realized at v1.49.947)" with the honest scope (calibrate + consume machine-readable; codify manual; verify heuristic; the ships-since conjunct operator-tracked).
- **`src/cli/commands/cadence.test.ts`** (new) — 14 tests; two **mutation-proven**: the calibrate `>=20` boundary (mutating `>=` to `>` reds the "exactly 20 -> candidate" test) and the compile-time drift guard (removing a member from the array fails tsc with TS2322).

## The honest limit (why `candidate`, not `overdue`)

Every axis's trigger has a second conjunct — "`>=N` ships since the last X" — that is **not machine-tracked** (there is no per-axis last-ship marker, and "the loop was run" / "the substrate shipped K ships ago" are operator memory). So when a first conjunct is met, the tool reports `candidate` (the operator confirms the ships-since conjunct before declaring the axis overdue), never a silent definitive "overdue". The tool is a deterministic FIRST-CONJUNCT surface, not a replacement for operator judgement. This is deliberately stated in the output and the doc.

## Validation against the session's own errors

Run on the live repo, the tool reproduces the v1.49.944 session's TRUE state — `calibrate: max 12 < 20 -> not overdue` and `consume: 0 genuinely-unwired -> not overdue` — i.e. it gets right exactly what was mis-read by hand. The `verify` heuristic additionally surfaced a real asymmetry on first run: the 4 later thresholds have dedicated `*-end-to-end` integration tests; the 3 original `suggestions.*` thresholds do not.

## Verification

- `npx tsc --noEmit` clean.
- `cadence.test.ts` 14/14; affected scope (`src/cli`, `src/bounded-learning`) **809/809**.
- Two mutation-proofs (calibrate `>=20` boundary; compile-time drift guard).
- End-to-end run on the real repo across all four invocation shapes (human / `--json` / `--check` exit code / `--axis bogus` -> exit 2).
- The full vitest suite passes **standalone** (35684 passed, rc 0).
- Pre-tag-gate: 17 of 18 steps PASS; the `vitest` step was bypassed via `SC_PRE_TAG_GATE_BYPASS=vitest` (operator-authorized for this batch) for the same pre-existing, unrelated **M4 branches first-commit-wins concurrency flake** that surfaced during v1.49.946's gate — it only manifests under the gate's local high-parallelism build->full-suite contention, passes standalone (0/20) and on CI, and is filed as a dedicated follow-up fix ship. CI is the authoritative backstop.

## Engine state

NASA degree **1.178** (unchanged — degree-non-advancing). **Counter-cadence #24** (gate-not-vigilance; prior #23 = v1.49.944; v945/v946 were a fix and a feat, not counter-cadence). Manifest **151** (unchanged — realizes the meta-cadence forward-shadow + applies #10428 / #10461; promotes no new lesson).
