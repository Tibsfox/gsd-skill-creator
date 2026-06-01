---
title: "v1.49.943 — defer-biased-gate Set-boundary lesson promotion (#10464) + named-transparency pins (counter-cadence)"
version: v1.49.943
date: 2026-06-01
summary: >
  Counter-cadence codify ship (#22) that closes both carried-forward items the
  v1.49.942 retrospective named. (1) It PROMOTES the defer-biased-gate Set-boundary
  pattern to a manifest lesson — #10464, manifest 150 -> 151 — now that it has two
  instances (cargo v1.49.938 + macOS v1.49.942): pin the GREEN/BREAKING conclusion
  Sets of a flip-readiness gate with a mutation-proven discriminating [green, X,
  green] @ n=3 fixture so a one-token Set edit cannot silently invert defer-bias.
  (2) It TEST-PINS the named transparent states (stale / startup_failure /
  in_progress) in BOTH flip-readiness suites — the v942 retrospective's "future
  audit could pin them in both gates together (preserving symmetry)" — using the
  discriminating two-green shape, mutation-proven in both directions across both
  suites. Test-only + manifest/doc; the gate sources are unchanged. The macOS and
  cargo gates are now fully Set-boundary-symmetric.
tags: [test, ci, counter-cadence, codify, flip-readiness, defer-bias, set-boundary, lesson-10464]
---

# v1.49.943 — defer-biased-gate Set-boundary lesson promotion (#10464) + named-transparency pins (counter-cadence)

**Shipped:** 2026-06-01

One-line: the "pin the GREEN/BREAKING Set boundaries of a defer-biased gate" pattern reaches its second instance and is promoted to manifest lesson **#10464** (manifest 150 -> 151), and the same ship test-pins the `stale`/`startup_failure`/`in_progress` transparent states in **both** flip-readiness suites — closing both carried-forward items the v1.49.942 retrospective named, while keeping the macOS and cargo gates boundary-test-symmetric.

## Why this ship

v1.49.942 hardened the macOS flip-readiness gate's GREEN/BREAKING Set boundaries (mirroring the v1.49.938 cargo sibling) and, in doing so, left two explicit forward notes:

1. **A promotion candidate.** "Pin the advance/break Set boundaries of a defer-biased gate" now had two instances (cargo v938 + macOS v942), satisfying the promote-on-second-instance rule. v942 deferred the promotion to keep its sweep surgical: "promotion (disciplines.json + manifest 150 -> 151) is a clean follow-on codify ship."
2. **An unguarded transparency.** `stale`/`startup_failure`/`in_progress` are documented as transparent in both gate comments but were not asserted by any test in either suite. v942: "A future audit could pin them in *both* gates together (preserving symmetry)."

This counter-cadence codify ship (#22) is that follow-on. It does both, together, because they are the same surface: the promotion records the discipline, and the new tests are a fresh application of it that also completes the macOS<->cargo symmetry.

## What shipped

### (1) Lesson #10464 promoted — manifest 150 -> 151

A defer-biased flip-readiness gate classifies each CI-leg conclusion through a **GREEN** Set (`{success}` — advances the streak), a **BREAKING** Set (`{failure, timed_out, cancelled, action_required}` — breaks it), and a transparent remainder (everything else). The safety property is defer-bias: a misclassification may only DEFER the flip, never advance it. Each Set boundary has a silent failure direction — a conclusion drifting INTO GREEN advances the flip on a non-green run; a flaky-infra conclusion missing FROM BREAKING lets a flaky lane advance the flip. Neither is caught by happy-path tests. The lesson: **pin both boundaries with a mutation-proven discriminating fixture** — `[green, X, green]` @ `n=3` asserting `streak === 2`, `ready === false`, `broke === null`, which reds if `X` drifts into GREEN (streak would reach 3) *or* into BREAKING (`broke` set) — and pin each named transparent state, not just one.

- `tools/render-claude-md/disciplines.json` — `#10464` added to the "Static-analysis tool authoring" `key_lessons`; the summary's carried-forward sentence replaced with the formal lesson statement; `codified_at_milestone` extended with the v1.49.943 entry. **Manifest lessons 150 -> 151.**
- `docs/static-analysis-tool-discipline.md` — a new `### Pin the GREEN/BREAKING Set boundaries of a defer-biased gate (Lesson #10464)` section, a `## When this discipline kicks in` bullet, an anti-pattern-summary bullet, a `## Lesson references` entry, and the `Codified at:` header line.
- `CLAUDE.md` re-rendered (`npm run render:claude-md`); drift-check clean.

### (2) Named-transparency pins — both suites, mutation-proven

- `tools/ci/__tests__/macos-flip-readiness.test.mjs` (**+18**) and `tools/ci/__tests__/cargo-flip-readiness.test.mjs` (**+17**) — one test each: *"the named transparent conclusions (stale / startup_failure / in_progress) do NOT advance"*. Each loops the three states through the discriminating `[green, X, green]` @ `n=3` shape (`streak 2`, `ready false`, `broke null`) — the *two-green* shape, because a `[green, X, green, green]` shape pushes `streak` to `n` in the transparent case too, so `ready === true` either way and the `ready === false` defer-bias lever is lost.

That is the entire diff: **+35 lines test-only** plus the manifest/doc promotion. The gate sources (`*-flip-readiness.mjs`) are **unchanged** — these states were already transparent; this ship guards that.

## Verification

- Both flip-readiness suites pass under `vitest.tools.config.mjs`: macos 36/36 (+1), cargo 37/37 (+1).
- **Mutation-proven in all four directions:** GREEN += `stale` reds the macOS named-transparent test (and only it); BREAKING += `in_progress` reds it; GREEN += `startup_failure` reds the cargo test; BREAKING += `stale` reds it. Each gate source restored from git after each mutation; both suites green post-revert (working tree test-only).
- `node tools/check-discipline-coverage.mjs` — manifest 151; `#10464` is COVERED (in manifest AND in the cited canonical doc AND referenced in this ship's `04-lessons.md`).
- A 3-lens adversarial review (test-correctness / lesson-accuracy / scope-and-integrity) returned clean; findings folded.
- Full pre-tag-gate: all 18 steps PASS (no integration bypass).

## Why combine promotion + application in one ship

The promotion (#10464) and the named-transparency pins are not independent: the new tests are a fresh, concrete application of exactly the lesson being promoted, and they complete the macOS<->cargo Set-boundary symmetry the v942 sweep deliberately preserved by *not* pinning these on one gate alone. Landing both together keeps the discipline doc's reference implementation and the actual test suites in lockstep, and closes the v942 retrospective's two open items in a single surgical, degree-non-advancing ship.

## What this ship deliberately does NOT do

- It does **not** promote the npm-audit-fix-hygiene candidate (raise the manifest floor + align peers after `npm audit fix`). That candidate has **one** instance (v1.49.941), and v941's own lessons chapter says to "promote on a second instance." It remains a carried-forward note, correctly unpromoted.
- It does **not** touch any gate source or production `src/`. The Sets were already correct; the value is in guarding them.

## Engine state

NASA degree **1.178** (unchanged — degree-non-advancing maintenance). **Counter-cadence #22** (prior #21 = v1.49.942, which produced the second instance this ship promotes). Manifest **151** (**+1**: new lesson #10464).
