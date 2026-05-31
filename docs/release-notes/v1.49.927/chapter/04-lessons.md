---
title: "Lessons"
chapter: 04-lessons
version: v1.49.927
date: 2026-05-31
summary: "Durable lessons from v1.49.927."
tags: [lessons]
---

# v1.49.927 — Lessons

## Lessons

- **Consume-axis wires belong at the substrate's designed integration point,
  default-off.** The bridge documented M5 `select()` as its target; wiring it
  there (behind an opt-in flag, byte-identical when off) is the lowest-risk way
  to flip a module from "0 callers" to "wired", without committing to a live
  policy yet.
- **Order the wire so the no-op is reachable in the real shape.** Bridging
  BEFORE the topK slice is what lets the single-selection (topK=1) path explore;
  the post-slice position would have been a structurally silent no-op that tests
  could still pass.
- **When the Read tool is unreliable, `grep -n ''` is the ground-truth channel
  and `Edit`/`Write` confirmations are trustworthy.** Verify file state by
  server-computed invariants (exit codes, `grep -c`, `Edit` success), never by
  eyeballing rendered file content. Failed exact-match Edits are a safety net,
  not just an error.

## Pattern status

- MA-3/MD-2 stochastic bridge: WIRED (first production caller) — consume-axis
  closure.
- No new manifest lesson this ship (manifest stays 150). The
  Read-tool-recovery note is a session-process lesson, recorded here and in
  memory rather than promoted to the discipline manifest.
