---
title: "Lessons"
chapter: 04-lessons
version: v1.49.928
date: 2026-05-31
summary: "Durable lessons from v1.49.928."
tags: [lessons]
---

# v1.49.928 — Lessons

## Lessons

- **A staged→load-bearing CI flip is a paired edit, not a one-line delete.** Deleting
  `continue-on-error` is half of it; inverting the drift-guard that pins the staged
  property is the other half, and #10461 makes the pairing mandatory (the guard fails
  if you forget). The honest ship also updates every surface that *described* the
  staged state in the present tense — the lesson summary, the canonical doc, and the
  gate tool's own output — or those surfaces become false the instant the flip lands.
- **A flip-gate tool must be lifecycle-aware, or it becomes the stale-guidance failure
  it exists to prevent (self-referential #10427).** A readiness checker that keeps
  printing "safe to flip: delete the line" after the line is gone is exactly the kind
  of drift it was built to catch. The fix is cheap: read the artifact's current state
  and switch the guidance (pre-flip "how to flip" → post-flip "how to revert"); keep
  the verdict math unchanged and informational.
- **Let the deterministic gate make the call.** The flip waited for
  `macos-flip-readiness` to report READY 3/3 across *organic* churn (release/docs
  greens excluded), not operator intuition that "macOS seems fine." This is the
  gate-not-vigilance pattern (#10428) reaching its terminal rung.

## Pattern status

- #10463 staged-CI-lane promotion: **three-rung sequence COMPLETE** (v920 decoupled
  nightly → v923 non-blocking matrix leg → v928 load-bearing flip). Lesson updated in
  place; no new manifest lesson (manifest stays 150).
- `macos-flip-readiness.mjs`: now lifecycle-aware (reports post-flip state). The
  drift-guard `ci-matrix-parity.test.ts` is the load-bearing enforcement; the tool is
  advisory.
