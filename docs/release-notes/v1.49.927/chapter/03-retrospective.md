---
title: "Retrospective"
chapter: 03-retrospective
version: v1.49.927
date: 2026-05-31
summary: "How the v1.49.927 milestone went — what worked, what surprised us."
tags: [retrospective]
---

# v1.49.927 — Retrospective

## What went well

- **The public surface was already shaped for this wire.** `SelectContext` and
  the bridge's `BridgeOptions` lined up almost exactly; the integration was a
  thin, additive change rather than a refactor.
- **The bridge's same-reference no-op contract made byte-identical trivial.**
  Because `applyStochasticBridge` returns the input array unchanged on every
  guard, and because the wire does not even call it when `stochastic.enabled` is
  false, the flag-off path is provably unchanged — the existing
  flag-off-byte-identical suite stayed green untouched.
- **Bridge-before-slice was the right call.** Sampling over the full ranked set
  and then slicing topK means the single-selection (topK=1) path explores;
  bridging a post-slice singleton would have been a silent no-op.
- **Adversarial review via parallel subagents** (correctness / build / test)
  returned clean and additionally proved the test suite kills the
  bridge-deletion mutation (3 tests fail if the call is removed). Their nits
  drove three hardening tests (payload preservation, coin-flip, default-temp).

## What surprised us

- **The harness Read tool fabricated a fictional `selector.ts`.** Early in the
  session the Read tool returned a plausible-but-wrong version of the file
  (invented `ActivationCandidate`/`rank`/`SelectorWeights` types). The first
  implementation was written against that phantom API; the Edits all failed
  "string not found" — which turned out to be the safety net (the real file was
  never corrupted). Ground-truthing every read via `grep -n ''` and trusting
  exit codes / `Edit` confirmations recovered cleanly. Lesson carried forward.

## Metrics

- 14 new tests; 247 reg pass; tsc clean; manifest 150; counter-cadence 20.
- Pushed feat-first (the v923 streak pattern) to bank macOS organic green #3
  (streak 2/3 → 3/3), making the macOS load-bearing flip READY.

## Forward

- An in-loop caller that supplies the stochastic context is the natural next
  consume step.
- With macOS green #3 banked, the next ship can perform the load-bearing flip
  (delete `continue-on-error` from ci.yml + update the ci-matrix-parity guard).
