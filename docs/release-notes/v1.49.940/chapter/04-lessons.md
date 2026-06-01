# v1.49.940 — Lessons

No new manifest lesson (manifest stays **150**). This is the first instance of the ephemeral-port test-flake fix; it is recorded below as a carried-forward observation candidate and promoted on recurrence.

- **#10427 (failure-mode contracts: silent-vs-loud)** — applied to the startup log. With `port: 0`, logging `resolvedConfig.port` would emit a misleading `listening on 127.0.0.1:0`. The log now reads the actual bound port from `httpServer.address()`, so the diagnostic is honest under ephemeral binding. (A log line is forensic, not load-bearing — so this is a hygiene application, not a guarded contract.)

## Carried-forward observation candidates

- **A fixed-port test harness is a latent file-parallelism flake; bind ephemeral (`port: 0`) and read the bound port back from `httpServer.address()`.** Fixed module-level port counters collide across files under vitest's default file-parallelism (here, two files sharing base 14100). A free-port *probe* (`listen(0)` → read → close → reuse) is NOT equivalent: it re-introduces a TOCTOU window between close and re-bind. Prefer true `port: 0` binding when the server supports it. First instance: this ship (`src/mcp/gateway/*.integration.test.ts` + `src/mcp/integration.test.ts`). Promote to a manifest lesson on a second instance (e.g. a future socket/HTTP test harness). Sibling of the Test-authoring flake catalog (`docs/test-discipline/flake-audit-2026-05-11.md`).

- **When a config schema's lower bound blocks the ephemeral sentinel, relax the bound — it is usually incidental, not a security invariant.** `GatewayConfigSchema.port` was `min(1)`; allowing `port: 0` (OS-assigned ephemeral) required `min(0)`. Verify first that the bound is incidental: no production caller, no untrusted input path, no test guarding the rejection, and the sentinel value is benign (port 0 ≠ bind-all ≠ privileged). Pin the new boundary with a mutation-proven test (revert `min(0)`→`min(1)` reds exactly the port-0 case). Pairs with the first candidate.

- **A vitest project listed in `projects` runs on every bare `vitest run`, regardless of an "opt-in only" comment.** There is no built-in opt-out for a configured project; only an empty/env-gated `include` or omission from the array makes it opt-in. The `integration` project's "Opt-in only" comment is unenforced — `npx vitest run` (the CI command) collects it. Verify project-collection claims with `vitest list`, not config comments.
