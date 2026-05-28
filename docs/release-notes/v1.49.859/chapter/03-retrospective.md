# v1.49.859 — Retrospective

**Wall-clock:** ~15 min from v858 close to v859 close. Within the chip-cluster ~10-15 min envelope.

## What went as expected

- **Hoist-outside-Promise variant ships cleanly.** The pattern: hoist BEFORE the Promise constructor; on denial, clean up any pre-allocated resources (the temp script dir here) BEFORE re-throwing. Mechanical extension of v853 git-collector's hoist-before-try variant.
- **OffloadExecutor wrapper class threads ctx via positional pass-through.** No new wrapper logic — just forwarding `(operation, ctx)` to the delegated `executeOffloadOp` call. Two-line change.
- **The existing executor.test.ts file accepts a new describe block** for the wire tests. ProcessContext + Capturing sink imports add 5 LOC; 3 new test cases at 60 LOC total.

## What I noticed

- **Spawn-based (async streaming) wire is identical in shape to exec-based wire.** The chokepoint operates at the spawn-attempt boundary, not at the I/O streaming boundary. So sync/async/streaming chokepoint placement converges to the same hoist-before-spawn pattern.
- **Cross-audit tool's 2nd consecutive application: still clean.** v858 + v859 both produce 0 stale; v857 codification + tool deployment continues to be silent in steady state.
- **3-file modify pattern matches v853/v858** — source + audit-test + existing-test-file. Faster than v851/v858 new-test-file variant (~5 min faster). Confirms the ~10 min floor for existing-test-file chips vs ~15 min floor for new-test-file chips.

## What surprised me

- **The temp-dir cleanup on denial was the only twist.** The naive hoist-at-top variant would have leaked the mkdtemp'd scriptDir if the security check fires after setup. Catching the denial + cleaning up + re-throwing keeps the resource hygiene. Worth noting in any future wire that pre-allocates resources before the spawn.

## Risk that didn't materialize

- **No flake in the bash spawn test.** The "executes when ctx allows the interpreter" test invokes real bash + echoes "ok"; could in principle race against the timeout. 5s timeout + sub-second test wall-clock kept it stable.
- **No audit-test regression.** 2051 PASS; file removed from KNOWN_UNWIRED + audit-test inline shape-A check still passes (because the file now calls ensureProcessAllowed).
- **No backward-compat break.** OffloadExecutor.execute(operation) continues to work; (operation, ctx?) is the new optional shape.

## Carried forward (post-v859)

NEW this ship: 1 below-threshold observation.

- **Pre-allocated-resource cleanup on security denial** — 1 instance from this ship. When a wire's setup phase allocates resources (temp dirs, file handles, network sockets) BEFORE the spawn, the hoisted check must catch the denial + clean up + re-throw. Naive hoist-at-top leaks the resource. Wait for 2nd instance to confirm pattern; likely classification: sub-pattern of #10427 (failure-mode contracts).

UNCHANGED:
- Cross-audit tool continuous-verification (v858, 1 instance).
- v857-v847 1-instance observations carry forward.

## Campaign progress

**3 of ~11 ships shipped.** Track 1 (codify) closed at v857; Track 2 (Process chips) at 2 of ~5 (v858-v859); Track 3 pending (v863-v867 planned).
