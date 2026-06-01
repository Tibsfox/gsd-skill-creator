---
title: "Context"
chapter: 99-context
version: v1.49.940
date: 2026-06-01
summary: "Where v1.49.940 sits in the larger arc."
tags: [context]
---

# v1.49.940 — Context

## Where this sits

- A **forward cleanup** picked from the post-cargo-flip handoff. With the cargo lane's
  flip-to-load-bearing track complete (v1.49.938 gate + v1.49.939 flip), the operator
  selected the v1.49.939 retrospective's named future-cleanup item: the gateway integration
  tests' fixed-port `EADDRINUSE` race.
- It directly closes a line from the **v1.49.939 retrospective**: "the `--project integration`
  pre-tag-gate step flakes on a fixed-port (`EADDRINUSE 14100+`) race in the gateway tests
  under parallelism … a reasonable future cleanup (ephemeral ports)."
- It is the **first ship to run its own pre-tag-gate without** `SC_PRE_TAG_GATE_BYPASS=integration`
  since the flake appeared — the fix removes the need, and the ship touches `*.integration.test.ts`,
  which the handoff's own rule says must not be bypassed.

## Engine state

- NASA degree 1.178 (unchanged).
- counter-cadence 20 (unchanged — forward cleanup, not a counter-cadence ship).
- manifest 150 lessons (no new lesson; one #10427 application + three carried-forward
  observation candidates — promote on recurrence).
- Architecture gaps unchanged: 6/7 closed-or-intentional.

## References

- The fix: `src/mcp/gateway/{gateway,gateway-298}.integration.test.ts`,
  `src/mcp/gateway/tools/{project,skill}-tools.integration.test.ts`, and
  `src/mcp/integration.test.ts` (all `startGateway` sites → `port: 0` + `httpServer.address()`
  read-back).
- The enabling schema change: `src/mcp/gateway/types.ts` (`GatewayConfigSchema.port` `min(1)`→`min(0)`).
- The honest log + documented contract: `src/mcp/gateway/server.ts`.
- The boundary guard: `src/mcp/gateway/types.test.ts` (port-0 acceptance mutation-proven).
- The code commit: `e3f713d8b` (`fix(mcp): bind gateway integration tests to ephemeral ports`).
- Prior milestone: v1.49.939 (cargo lane flipped to load-bearing — whose retrospective named
  this cleanup).
