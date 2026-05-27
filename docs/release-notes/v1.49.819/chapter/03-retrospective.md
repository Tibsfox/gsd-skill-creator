# v1.49.819 — Retrospective

**Wall-clock:** ~30 min from chain-continuation to tag-push. Fourth ship of the v816-822 chain.

## What worked

**The 5 aminet files share enough structure for a clean batch.** All 5 use `execFile` (sync via promisify, callback via Promise wrapper, or callback directly); all 5 follow the same error-handling shape (try/catch for execFile errors); all 5 are single-purpose modules around their respective spawn calls. The batch ship was structurally feasible because the 5 files are genuinely siblings.

**The wiring pattern is now mechanical.** v806 introduced the chokepoint; v809 wired the first caller; v811 batched; v812 first-chip refined the pattern. By v819, the wiring is a 5-step mechanical recipe: import + const + param + ensure-call + remove-from-allowlist. Each file took ~3-5 min.

**The `emulated-scanner` denial-conversion is the right shape for never-throws contracts.** When a function's contract is "returns result, never throws," ProcessContextDenied can't propagate normally. The right shape is to wrap the `ensureProcessAllowed` call in try/catch and convert the denial into the result's "pre-flight failure" shape (here: `ran: false` + denial message in `output`). Preserves the contract; still surfaces the denial. The discipline #10427 documents this as the "forensic" failure mode vs the "load-bearing propagation" mode; both can apply within a single ship.

**KNOWN_UNWIRED ledger shrink is visible in the diff.** Removing 5 entries from the allowlist is the closure artifact — future readers see the v819 batch closure in `process-context-audit.test.ts` directly. The inline 3-line comment names the family + ship. Pairs with #10432 ledger discipline.

**Type-check + tests run clean on first attempt.** No compile errors after the 5-file wiring; all 2710 aminet + audit tests pass unchanged. The `ctx?` optional-parameter pattern from #10414 means zero migration risk for existing callers.

## What surprised

**One of the 5 files needed a different wiring shape.** 4 of 5 (lzx-extractor, lha-extractor, tool-validator, emulator-launch) use the standard "hoist outside try/catch" pattern. 1 file (emulated-scanner) returns a Promise that never throws — needed the wrap-and-convert pattern. This wasn't predicted in advance; recon (reading each file's function signature) surfaced it on read 5.

**The aminet family hadn't been migrated yet despite being grouped at the top of the allowlist.** The 5 entries were grouped alphabetically (the audit allowlist is alphabetically sorted), so they appear as the FIRST 5 entries in the list. Visual prominence didn't drive migration cadence — the audit ship-by-ship discipline did. v819 closes the visually-prominent block in one batch.

**The largest ProcessContext file (emulator-launch, 203 lines) was simpler to wire than the smallest (lzx-extractor, 93 lines).** Emulator-launch has a clean single-spawn shape. lzx-extractor has the same shape but with cleanup logic in catch (rmSync). Recon-read cost was the same; wiring cost was the same.

## What to watch

- **The KNOWN_UNWIRED ledger is now at 32 entries (was 37 pre-v819).** Trajectory: shrink monotonically. At ~5 entries per family-batch ship and ~1 entry per single-chip ship, the ledger asymptotes to zero in N more ships. Future ships can be sized by family — the next obvious batch target is the git/core family (4 entries, v820 first-chip target).

- **The PROCESS_SOURCE naming convention (`'<dir>/<file-name>'`) is now applied across 5+ files.** No bikeshedding; convention is established. New wired callers should follow.

- **Some allowlist entries are intentionally "not-process-callers."** Not all entries on the audit's grep match are real spawn callers — some are docstring `Role:` markers. The audit's grep is the source of truth; the allowlist is the migration debt. Watch for false-positive entries in future allowlist reductions.

## Verdict on scope

Closed at the canonical batch-chip shape: 5 files × ~5 LOC each (one file ~18 LOC due to denial-conversion shape) + audit-test allowlist edit + 5 release-notes files. Resisted: default factory for the aminet-specific context, typed command union, pre-emptive call-site updates with explicit context passing. The wiring is exactly the minimum credible per #10432 — chip down the ledger, monotonically, with each ship.

After v819, KNOWN_UNWIRED Process = 32. The chain continues with v820 (first git/core chip).
