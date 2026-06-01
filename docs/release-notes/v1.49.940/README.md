---
title: "v1.49.940 — gateway integration tests on ephemeral ports (EADDRINUSE flake closed)"
version: v1.49.940
date: 2026-06-01
summary: >
  Eliminates the EADDRINUSE race in the MCP gateway integration tests. Five
  startGateway test sites bound a fixed module-level port (two shared base
  14100), so under vitest file-parallelism they requested the same ports and
  raced — forcing the pre-tag-gate `--project integration` step to be bypassed
  and posing a latent flake in CI (which runs `npx vitest run`, collecting the
  integration project). All sites now bind an OS-assigned ephemeral port
  (`port: 0`) and read the actual bound port back from `httpServer.address()`,
  which is collision-free under any parallelism. To allow port 0 the
  GatewayConfigSchema bound is relaxed from min(1) to min(0); a new
  types.test.ts pins the boundary (port-0 acceptance mutation-proven). Closes
  the future-cleanup item the v1.49.939 retrospective named.
tags: [test, mcp, gateway, ephemeral-port, flake, EADDRINUSE, vitest, parallelism]
---

# v1.49.940 — gateway integration tests on ephemeral ports (EADDRINUSE flake closed)

**Shipped:** 2026-06-01

One-line: the gateway integration tests stopped hard-coding listen ports and now bind `port: 0`, reading the real port back from the socket — killing the cross-file EADDRINUSE race under vitest file-parallelism.

## Why this ship

The MCP gateway integration tests start a real HTTP server via `startGateway`. Each test file carried a module-level `let portCounter = <base>` (bases 13100 / 14100 / **14100** / 15100) and incremented it per test. Two files — `gateway-298.integration.test.ts` and `tools/project-tools.integration.test.ts` — shared base **14100**. Under vitest's default file-parallelism those files run concurrently, request the same ports, and the second binder fails with `EADDRINUSE`.

The visible symptom was the pre-tag-gate `--project integration` step (2.8) flaking, which both prior ships papered over with `SC_PRE_TAG_GATE_BYPASS=integration` after confirming a single-threaded pass. The v1.49.939 retrospective named the clean fix — "ephemeral ports" — as a future cleanup. This ship is that fix.

It is also more than a local-gate annoyance: CI runs `npx vitest run` with **no** `--project` flag (`.github/workflows/ci.yml:87`), which collects **all** vitest projects including `integration` (the config's "Opt-in only" comment is stale — there is no actual env gate). So the race was a latent CI flake too. Eliminating it removes that risk.

## What shipped

- **Five `startGateway` test sites** → ephemeral binding. `gateway.integration.test.ts`, `gateway-298.integration.test.ts`, `tools/project-tools.integration.test.ts`, `tools/skill-tools.integration.test.ts`, and `src/mcp/integration.test.ts` now pass `{ port: 0 }` and read the OS-assigned port back via `port = (gateway.httpServer.address() as AddressInfo).port`. The fixed `portCounter`/`getPort()` helpers are gone. A second `startGateway` (a gateway *restart* inside the read-scope test in `integration.test.ts`) was converted too, so no fixed-port bind remains in the changed files.
- **`src/mcp/gateway/types.ts`** — `GatewayConfigSchema.port` bound relaxed `.min(1)` → `.min(0)` so `port: 0` (OS-assigned ephemeral) is accepted. The default (`DEFAULT_GATEWAY_PORT = 3100`) is unchanged; negative / non-integer / `>65535` are still rejected.
- **`src/mcp/gateway/server.ts`** — the `startGateway` docstring documents the port-0 contract; the startup log now reports the **actual** bound port (read from `httpServer.address()`) instead of the requested `0`.
- **`src/mcp/gateway/types.test.ts`** (new) — six boundary tests pin the schema: port 0 accepted (the load-bearing case), negative / non-int / `>65535` rejected, `65535` accepted, default applied. The port-0 acceptance is **mutation-proven** (reverting `min(0)`→`min(1)` reds exactly that case and no other).

## Why relaxing the schema is safe (not test-only)

The chosen fix is true ephemeral binding rather than a test-side "find a free port, then pass it" probe — the probe would re-introduce a TOCTOU window between discovery and bind, contradicting the ship's purpose. Relaxing the production schema to admit `port: 0` is safe and verified: `startGateway` has **zero production (non-test) callers**; no test, CLI flag, env var, or `tauri.conf.json` key feeds an untrusted port into the schema; `port: 0` is the canonical Node OS-assigned-ephemeral idiom (not bind-all / not privileged), and the host default stays `127.0.0.1` (loopback). The prior `min(1)` was an incidental bound, not a security control.

## Verification

- `tsc --noEmit` exit 0.
- Full `--project integration` passes **205/205** under default file-parallelism — **without** the bypass (4 clean runs; was flaky/EADDRINUSE before).
- Entire `src/mcp` surface: **867/867** across all projects under parallelism.
- Schema boundary test mutation-proven.
- 4-lens adversarial review (correctness / schema-safety / test-quality / completeness) + skeptic verification: 3/4 lenses CLEAN, schema-safety verified safe, **zero confirmed bugs**; the one NIT (a residual fixed-port re-bind on the gateway-restart test) was fixed in-ship.

## Engine state

NASA degree **1.178** (unchanged). Counter-cadence **20** (unchanged — forward cleanup, not a counter-cadence ship). Manifest **150** (no new lesson — first instance of the ephemeral-port test-flake fix; recorded as a carried-forward candidate under the Test-authoring discipline, promote on recurrence).
