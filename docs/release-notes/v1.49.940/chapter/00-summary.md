# v1.49.940 — Summary

## The ship

The MCP gateway integration tests no longer hard-code their listen ports. Five `startGateway` call sites — across `gateway.integration.test.ts`, `gateway-298.integration.test.ts`, `tools/project-tools.integration.test.ts`, `tools/skill-tools.integration.test.ts`, and `src/mcp/integration.test.ts` — now bind an **OS-assigned ephemeral port** (`port: 0`) and read the actual bound port back from `gateway.httpServer.address()`. This is collision-free under any degree of parallelism.

## The bug

Each file carried a module-level `let portCounter = <base>` and incremented per test. Two files shared base **14100** (`gateway-298` and `project-tools`). Under vitest file-parallelism those files run concurrently, request the same ports, and the second binder throws `EADDRINUSE`. The symptom was a flaky `--project integration` pre-tag-gate step that the last two ships bypassed with `SC_PRE_TAG_GATE_BYPASS=integration` after a single-threaded confirm. The v1.49.939 retrospective named "ephemeral ports" as the clean fix; this ship delivers it.

## The enabling production change

`startGateway` parses its config through `GatewayConfigSchema`, whose port bound was `.min(1)` — so `port: 0` was rejected. The bound is relaxed to `.min(0)`; the default (3100) and the upper/negative/non-integer rejections are unchanged. `startGateway`'s startup log now reports the real bound port instead of the requested `0`. A new `types.test.ts` pins the boundary; the port-0 acceptance is **mutation-proven** (reverting to `min(1)` reds exactly that case).

## Not just a local annoyance

CI runs `npx vitest run` with no `--project` flag (`ci.yml:87`), which collects **all** projects including `integration` (1211 integration cases by default; the config's "Opt-in only" comment is stale). So the race was a latent CI flake — which the v1.49.939 handoff's "CI is the source of truth" note had acknowledged. This ship removes it.

## Why ephemeral binding, not a free-port probe

A test-side "find a free port then pass it" probe would re-introduce a TOCTOU window between discovery and bind — the very class of race the ship exists to kill. True `port: 0` binding lets the kernel hand each server a unique port for the lifetime of the socket. Safe because `startGateway` has zero production callers and no untrusted path feeds it a port. NASA 1.178, counter-cadence 20, manifest 150.
