# v1.49.940 — Retrospective

## What went right

- **The investigation found two more sites than the handoff scoped.** The v1.49.939 handoff named two files (`gateway-298`, `project-tools`) at base 14100. Reading the surface surfaced **five** `startGateway` call sites with the same fixed-port idiom (a third file at 13100, a fourth at 15100, and `src/mcp/integration.test.ts` at 14100 in the *default* project), plus a sixth gateway-*restart* site inside one test. Fixing only the named two would have left the same latent flake in the more-frequently-run default CI suite. Recon-before-edit paid for itself.

- **A blocked assumption was caught by running the tests, not by reasoning.** The handoff (and the obvious first move) said "switch to port 0." The first run failed loudly: `GatewayConfigSchema` rejected `port: 0` with "expected number to be >=1". The schema bound `min(1)` was the real obstacle — invisible until executed. That turned a "test-only" edit into a (minimal, justified) production schema change.

- **The fix was chosen to not re-introduce the race it kills.** A test-side free-port probe (`listen(0)` → read → close → pass the number) was the zero-production-change alternative, but it leaves a TOCTOU window between close and re-bind. True `port: 0` binding has no such window — the kernel owns the port for the socket's life. Choosing the schema relaxation over the probe was the difference between "smaller race" and "no race."

- **The production change was bounded and proven safe.** A repo-wide grep confirmed `startGateway` has no production callers and no untrusted port path (the only `--port` flags belong to the unrelated Wetty terminal). The schema relaxation widens the accepted set by exactly one value (0); the default and all other rejections are pinned by a new mutation-proven boundary test. The startup log was made honest (real bound port, not `0`).

## What went well in process

- **Adversarial review before ship caught the one inconsistency.** A 4-lens review (correctness / schema-safety / test-quality / completeness) plus per-finding skeptics returned 3/4 lenses CLEAN and zero confirmed bugs — but flagged that a *gateway-restart* site inside the read-scope test still re-bound the captured ephemeral port (a residual, if tiny, fixed-port re-bind, and the one site that hadn't adopted the pattern). It was converted in-ship, making the "no fixed-port site remains" claim literally true.

- **CI-coverage was verified empirically, not assumed.** Rather than trust the config's "Opt-in only" comment, `vitest list` was run: 1211 integration cases collect by default, and `ci.yml` runs bare `npx vitest run`. That confirmed CI runs these tests — so the fix is load-bearing for CI reliability, and the handoff's "CI excludes integration" line is stale.

## What to watch

- **The "Opt-in only" comment on the integration vitest project is misleading.** It claims env-gating that does not exist in the config or the test files. A future reader may believe `*.integration.test.ts` only run under `--project integration`; in fact they run on every `npx vitest run` (and thus in CI). Worth correcting the comment in a later sweep — it was left untouched here to keep this ship surgical.

- **Other suites that start servers should be audited for the same idiom.** This ship swept `src/mcp` (the only hits). If new HTTP/socket test harnesses appear, prefer `port: 0` + `address()` read-back from the start rather than a fixed counter.
