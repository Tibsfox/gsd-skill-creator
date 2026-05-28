
# v1.49.842 — Context

## Provenance

Batch chip per v840 next-session candidates list. The terminal family was named explicitly in the candidates list:

> **Terminal family batch** (3 entries: `cli/commands/terminal.ts` + `terminal/launcher.ts` + `terminal/session.ts`; ~45-60 min as batched chip).

Actual wall-clock came in below the lower bound at ~20 min — the wires followed established patterns exactly.

## What this ship adds

```
src/terminal/session.ts                            [MODIFIED: +6 LOC for ctx? + ensureProcessAllowed hoisted-outside-catch]
src/terminal/launcher.ts                           [MODIFIED: +7 LOC for ctx via LaunchOptions + ensureProcessAllowed inline]
src/terminal/types.ts                              [MODIFIED: +6 LOC for optional ctx? field in LaunchOptions]
src/cli/commands/terminal.ts                       [MODIFIED: +7 LOC for ctx? + ensureProcessAllowed + ProcessContextDenied re-throw]
src/security/process-context-audit.test.ts         [MODIFIED: -3 KNOWN_UNWIRED entries + inline comments]
docs/release-notes/v1.49.842/                      [NEW: README + 4 chapters]
.planning/PROJECT.md                               [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`). Terminal family batch listed as 3 entries with explicit file paths.
2. **Verify the 3 files are still in KNOWN_UNWIRED.** Confirmed at `src/security/process-context-audit.test.ts` (lines 48 / 85 / 86).
3. **Inspect each file** for spawn callsite + surrounding try/catch shape:
   - session.ts: 1 execSync inside swallow-everything try/catch (forensic surface; tmux-unavailable expected).
   - launcher.ts: 1 spawn with no swallowing wrapper (async resolve-promise pattern).
   - terminal.ts: 1 spawn inside try/catch that absorbs ALL errors into CLI JSON output.
4. **Pick wire pattern per file**:
   - session.ts → hoist-outside-catch (#10427).
   - launcher.ts → inline natural placement.
   - terminal.ts → inline placement + re-throw `ProcessContextDenied` from catch (#10427 + sibling-of-#10437 refinement).
5. **Thread options vs second positional**:
   - session.ts (no options object) → 2nd positional ctx?.
   - launcher.ts (existing LaunchOptions) → field in options.
   - terminal.ts handleStart → 2nd positional ctx? (config is already 1st positional).
6. **Reference v839 stalled.ts** as the canonical hoist-outside-catch example for the comment pattern.
7. **Write 4 source-file edits + 1 audit-test edit.**
8. **Verify build + tests** — `npm run build` clean; targeted tests `process-context-audit.test.ts` + `process-context.test.ts` + `process-manager.test.ts` all PASS.
9. **Author release notes** — 5 files (README + 4 chapters).

## Wire decisions in detail

### Why hoist outside the try/catch in session.ts

`listTmuxSessions` catches `tmux: command not found` and returns `[]`. This is intentional — the function is a forensic listing where "no sessions" and "tmux not installed" produce the same observable. Per #10427's contract, accessory surfaces (forensic listings) fail silently. But security denials are load-bearing: a deny-listed tmux MUST throw to the caller, not silently return `[]` (which would suggest "no sessions" while actually meaning "tmux refused by policy"). Hoisting `ensureProcessAllowed` outside the try/catch preserves both behaviors.

### Why no hoisting in launcher.ts

`launchWetty` doesn't wrap the spawn call in a try/catch. Errors are signaled via process events (`'spawn'` and `'error'`). The function returns a Promise that resolves with success/failure state. The security check at function-top runs naturally before any error path, so no special hoisting is needed.

### Why catch-rethrow in cli/commands/terminal.ts

The spawn is INSIDE a try/catch because `resolveWetty()` (which determines the cmd value) can throw. We can't hoist the security check outside the try because the cmd value isn't known until inside. The catch was originally a swallow-everything that turned all errors into `{action: 'start', error: msg}` JSON output. To preserve security-denial propagation (#10427), the catch now distinguishes: `ProcessContextDenied` re-throws; other errors absorb as before.

### Why the LaunchOptions field for launcher.ts

`launchWetty(options)` already takes an options object. Adding `ctx?: ProcessContext` to LaunchOptions keeps the call signature single-argument and matches the existing destructuring pattern. Callers can pass `{ config, command, ctx }` cleanly. Without options, the alternative would be `launchWetty(options, ctx?)` — a two-positional signature that's harder to extend further.

## Verification trail

| Step | Result |
|---|---|
| `npm run build` | PASS |
| `npx vitest run src/security/process-context-audit.test.ts` | PASS (2,050 tests; 3 KNOWN_UNWIRED entries removed without breaking other audits) |
| `npx vitest run src/security/process-context.test.ts` | PASS (21 tests) |
| `npx vitest run src/terminal/process-manager.test.ts` | PASS (25 tests; existing tests still pass with optional ctx) |
| `bash tools/pre-tag-gate.sh` | (pending T14 step 1) |

## What was deferred

- **Threading ctx through to terminalCommand.** The CLI dispatch level (`src/cli/dispatch.ts`) doesn't currently have a context concept. handleStart accepts ctx as an optional parameter for future internal callers; the public CLI path is grandfathered (ctx undefined → permissive legacy). Future ship could add a CLI-level context if any subcommand needs strict enforcement.
- **listTmuxSessions caller updates.** This function is exported from `src/terminal/index.ts` but not called within `src/` (it's available for external callers). No internal call sites to update.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- 5-file batch chip ship — 4 source files + 1 audit-test allowlist update.
- No new lessons promoted; no manifest changes.
- v836 preservation gate continues to fire (6th time at v842's T14 publish step expected).

## Forward path post-v842

1. **ProcessContext mesh family batch chip** — next per the v840 candidates list. 2 entries (`mesh-worktree.ts` + `proxy-committer.ts`). v843.
2. **Verification/integration-only canonical-doc decision** — operator-bounded; v840 deferred.
3. **Production caller of predict path** — activates v837's auto-emit wire. Substantive feature work.
4. **NASA 1.179 forward-cadence** — still STRONG-DEFAULT (60 consecutive ships at 1.178 — record-widest pressure margin).

## References

- Predecessor: v1.49.841 (`docs/release-notes/v1.49.841/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md` (next-session candidates list)
- ProcessContext chokepoint: `src/security/process-context.ts`
- Audit-test: `src/security/process-context-audit.test.ts`
- v839 reference wire (hoist-outside-catch): `src/intelligence/analyzer/findings/stalled.ts`
- v820 reference wire (CLI catch-rethrow): `src/git/branch-manager.ts`
- KNOWN_UNWIRED ledger discipline: `docs/known-unwired-ledger-discipline.md`
- Internal-helper pattern (#10433): `docs/architecture-retrofit-patterns.md`
- Failure-mode contracts (#10427): `docs/failure-mode-contracts.md`
- Security chokepoints catalog: `docs/security-chokepoints.md`
