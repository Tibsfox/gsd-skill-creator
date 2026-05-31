---
title: "Retrospective"
chapter: 03-retrospective
version: v1.49.928
date: 2026-05-31
summary: "How the v1.49.928 milestone went — what worked, what surprised us."
tags: [retrospective]
---

# v1.49.928 — Retrospective

## What went well

- **Gate-not-vigilance paid off end-to-end.** The flip was not an operator judgment
  call — `macos-flip-readiness.mjs` reported a deterministic READY 3/3 across organic
  churn, and that verdict drove the flip. The whole #10428/#10463 thesis (convert a
  forgettable prose rule into a checkable gate) closed its own loop here.
- **The drift-guard pairing worked exactly as designed.** Because the guard pinned
  "`continue-on-error` EXISTS", the flip could not be silent — inverting the guard was
  forced. The inverted guard was then mutation-proven (re-staging the line fails
  exactly two assertions), so the new invariant has teeth.
- **The blast-radius sweep caught the honesty debt the handoff did not name.** The
  handoff scoped the flip as two files (ci.yml + the test). A repo-wide grep surfaced
  the `disciplines.json` #10463 summary and the canonical doc still asserting "flip
  pending / NOT READY 1/3" — false the instant the flip lands. Updating them kept the
  ship internally consistent.

## What surprised us

- **The adversarial review caught a self-referential stale-guidance bug — in the very
  tool that gates the flip.** Lens 3 flagged that `macos-flip-readiness.mjs` would keep
  printing "Safe to flip: delete `continue-on-error`" *after* the line was already
  deleted — a flip-gate tool emitting an already-done instruction. That is a fresh
  instance of #10427 (a tool surfacing drift must not itself drift) pointed at itself.
  Fix: the tool now reads ci.yml and switches to post-flip "already flipped / how to
  revert" guidance. The reviewer labelled it a BLOCKER; on inspection it was a genuine
  internal inconsistency in an honesty-themed ship, so it was fixed before commit.

## Metrics

- `ci-matrix-parity` 9/9; `macos-flip-readiness` 33/33 (26 + 7 new); tsc clean.
- Pushed feat-first (the v923 streak pattern), now for a new reason: to confirm the
  newly-load-bearing macOS leg is green on the feat commit before tagging.
- counter-cadence 20 (unchanged); manifest 150 (#10463 updated in place).

## Forward

- The macOS leg is ship-blocking from this commit onward — monitor the next 2-3 ships
  for any latent macOS-only flake (lens-1 NIT). The reversion path (re-add the gated
  `continue-on-error` + invert the guard) is documented in the drift-guard and the
  readiness tool's post-flip output.
- Consume-axis carry-forwards remain: College concept-fallback into live dispatch; an
  in-loop caller of the stochastic selector path.
