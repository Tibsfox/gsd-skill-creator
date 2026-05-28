# v1.49.874 — Retrospective

**Wall-clock:** ~25-30 min from v873 ship close. Above the chip mean because of: (1) 9 spawn-site refactors, (2) safeExecFile helper authoring, (3) threading ctx? through 7 functions (1 exported + 6 internal helpers). Test setup reuse from v870-v873 patterns helped.

## What went as expected

- **safeExecFile wrapper pattern emerged naturally.** 9 spawn sites with heterogeneous binaries (unzip/tar/git/curl/pdftotext) wanted a uniform wrapper rather than 9 separate hoists. The safeExecFile helper pairs ensureProcessAllowed with execFileSync, returning the execFileSync result. All 9 sites become 1-line calls.
- **Audit target accuracy improved over v870-v873.** Shell-exec chips (v870-v873) record `target='sh'` because that's what's actually spawned. The execFile-based pattern at v874 records the actual binary (`unzip`, `tar`, etc.) — much better for security audit and allow-list construction.
- **#10444 catalog's upper-mid LOC band gave the right hint.** v874 at 509 LOC is in the "internal-helper / DI-executor" band per #10444. Internal-helper with a wrapper function matched the spawn-site multiplicity (N=9 doesn't fit hoist-at-top or closure-capture).

## What surprised me (mildly)

- **TypeScript's overload typing on execFileSync needed an `as string` cast.** `execFileSync` returns `Buffer | string` depending on whether encoding is supplied at compile time. The safeExecFile wrapper takes `ExecFileSyncOptions` which allows either, so it returns `string | Buffer`. Each call site that previously relied on the string return needs an `as string` cast (4 of the 9 sites). Acceptable trade-off; the wrapper is more useful than the slight inconvenience.
- **Only 3 of 9 spawn sites had swallow-everything catches.** v870-v871-v873 each had 4-11 catches needing re-throw. v874 has only 3 because most spawn sites in acquirer propagate errors directly to caller (via `errors.push({...})` collection pattern). The N catches metric is per-file-structure, not per-spawn-count.

## What went wrong

- Nothing significant this ship. The mechanical 9-site refactor + 7-function ctx threading took longer than smaller chips but was straightforward.

## Future-improvement candidates surfaced this ship

### Audit target accuracy: execFile beats shell-exec for forensic visibility (PROMOTION-ELIGIBLE — 2 instances now)

**Surface ships:** v1.49.874 (first instance of intentional target-accuracy reasoning during wire authoring) + retroactive observation from existing chips that already use execFile-based patterns (e.g., v853 git-collector uses execFileAsync with target='git').

When choosing between `execSync(command)` (shell-exec) and `execFileSync(binary, args)` (direct-exec), prefer direct-exec because:
1. **Audit target is the actual binary** (`git`, `unzip`) not `sh`.
2. **No shell metacharacter risks** — args are passed as literal strings.
3. **Better allow-list semantics** — operator can allow `git` but not `curl` cleanly.

Shell-exec is necessary when the command involves shell features (pipes, redirects, env interpolation). For simple binary+args calls, direct-exec is strictly better.

**Below threshold for codify** (this is a 1-instance explicit recognition during a chip ship; v853's git-collector predates this discipline). But the pattern is decisively right and should be codified as part of the next #10444 refinement.

### safeExecFile-wrapper pattern as a new module-internal-helper subtype

**Surface ship:** v1.49.874.

The safeExecFile helper introduced this ship is a distinct sub-pattern of module-internal-helper:
- v873's `exec(command, cwd, ctx)` — returns string, calls execSync
- v874's `safeExecFile(ctx, command, args, opts)` — returns string|Buffer, calls execFileSync

Both share the same fundamental shape (one helper protects N spawn sites). The distinction is: shell-exec vs direct-exec target. Below-threshold (1 instance of safeExecFile pattern). A 2nd chip using safeExecFile (or its equivalent for spawn/spawnSync) would promote this to a sub-pattern of #10444.

## Verdict on scope

Chip ship at ~25-30 min — above the mean due to scale (9 spawn sites, 7 functions threaded). Track 4 progress: 5/6 chips closed (83% through Process cluster). One chip away from Track 4 close — v875 (harness-integrity.ts at 1440 LOC) is the largest of the campaign.

The safeExecFile wrapper pattern is a reusable contribution. Any future file with N≥3 heterogeneous spawn sites should consider this pattern over per-site hoisting.
