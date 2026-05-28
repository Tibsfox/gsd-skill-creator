# v1.49.870 — Retrospective

**Wall-clock:** ~15-20 min from v869 ship close to release-notes draft complete. Standard chip ship envelope; ~5 min over the v858-v867 chip mean because the test setup needed two correction passes (wrong `createProcessContext` import, then wrong `e.command`/`e.target` field name).

## What went as expected

- **The cross-audit gate ran automatically.** Pre-tag-gate step 18/18 fired without operator invocation — first chip ship under the v869 deterministic-gate regime. Tool reported "ProcessContext (KNOWN_UNWIRED: 5) clean / EgressContext (KNOWN_UNWIRED: 6) clean" after the wire.
- **The internal-helper pattern matched the file's structure.** The `git()` private method already wrapped 7 git commands; threading `ctx?` through the constructor + one `ensureProcessAllowed` at the helper site is the canonical #10433 application. ~6 LOC changes total in `src/learning/version-manager.ts`.
- **Size-ascending heuristic surfaced internal-helper at the right LOC band.** v870 file is 177 LOC — small enough to need a single helper but large enough that 7 call sites already shared one. Per #10444's evidence pattern, internal-helper emerges in the mid-LOC band; v870 confirms it in the smaller end too when there's pre-existing helper infrastructure.

## What went wrong

- **Test import error #1.** First pass imported `createProcessContext` which doesn't exist; the canonical pattern is direct object literal `{ allowList, audit }` per the `defaultProcessContext` example. ~2 min recovery (grep for exports + fix import).
- **Test import error #2.** Field name drift: audit records have `target` (the executable name) and `argv` (the args), not `command`. My test asserted `e.command === 'sh'` but should have been `e.target === 'sh'`. ~3 min recovery.
- **Re-throw discipline correction.** Initial wire didn't add `if (err instanceof ProcessContextDenied) throw err` to the 4 swallow-everything catches. The first test run showed the denial returning `[]` instead of throwing — #10427 violation. Fix took ~5 min across 4 service methods.

## What surprised me (mildly)

- **The `exec(command)` shell pattern needs `op='exec'` + `target='sh'` + `argv=['-c', command]`.** Most existing Process chips use `spawn`/`spawnSync` with `target='git'` directly. Shell-string exec is a different pattern; the audit record represents what's actually being spawned (the shell), not the logical command. This matches what the v868 codify's "DI-executor + tokenized-argv" wire-shape catalog implies for shell-exec but doesn't enumerate.

## Future-improvement candidates surfaced this ship

### Shell-exec audit record shape

The `exec(command)` shell pattern records `op='exec' / target='sh' / argv=['-c', command]`. The `spawn(file, args)` pattern records `op='spawn' / target=file / argv=args`. Both are correct from the audit perspective (the audit records what was spawned, not the logical intent). But operators reading the audit log see `sh` for shell-exec callers and `git` for spawn callers — same logical operation, different surface. Below-threshold observation (1 instance); a 2nd shell-exec chip wire that surfaces the same pattern would promote this to a forward-observation.

### Re-throw-ProcessContextDenied pattern at the swallow-everything catch boundary

The version-manager has 4 service methods with swallow-everything catches that needed re-throw. Each re-throw is a 1-line addition (`if (err instanceof ProcessContextDenied) throw err`). The pattern is canonical per #10427 but the editorial overhead (4 re-throws + 4 comments) is non-trivial at the chip level.

Below-threshold observation. A 2nd chip with N≥4 service methods needing re-throw would promote this to a refinement of #10427 (multi-method re-throw discipline).

## Verdict on scope

This ship invests in the **codify-axis consumption (#10428)** by chipping down the KNOWN_UNWIRED Process ratchet ledger by one. The v868-codified #10444 size-ascending discipline drove the chip pick; the v869-wired cross-audit gate caught the wire's correctness automatically. Two-ship codify-then-gate pair from v868+v869 paying off in operational discipline this ship.

Chip cost ~15-20 min including release notes; matches v858-v862 Track 2 cluster mean (+3 min for test setup corrections). Acceptable variance — the file was straightforward; the test setup friction is a one-time cost (reusable in subsequent chips).
