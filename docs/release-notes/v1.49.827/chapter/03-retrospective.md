# v1.49.827 — Retrospective

**Wall-clock:** ~30 min from chain-start to tag-push. First ship of the v827-833 chain.

## What went as expected

- **Audit-recon confirmed all 3 files have an internal helper.** extractor.ts has `runPdftotext` (1 callsite). health-check.ts has `defaultExec` (1 callsite) but with DI shape. venv-manager.ts has `defaultExec` (6 callsites) with DI shape. The audit-time prediction held.
- **#10433 LOC band partially held.** For extractor.ts (~12 LOC), the pure internal-helper case matches the lower end of the band (#10433 predicts 14-20 LOC for moderate-callsite-count files; 1-callsite shape lands at ~10-14).
- **The audit-test confirmed the wire.** After removing 3 entries from `KNOWN_UNWIRED`, the audit re-ran in <1s and accepted all 3 wired files.
- **The dogfood family closes at 3 of 3.** The KNOWN_UNWIRED allowlist comment now reads as a completion record (per #10432 block-comment consolidation observation, third reaffirmation).
- **Dogfood test suite passed.** 646 tests across 47 files. No regressions from threading `ctx?` (legacy-permissive when undefined).

## What I noticed

- **The DI-executor shape is genuinely new.** Both health-check.ts and venv-manager.ts use a `CommandExecutor` type for dependency injection — tests inject a mock, runtime uses `defaultExec`. The `defaultExec` helper doesn't know the file's `PROCESS_SOURCE`, so putting `ensureProcessAllowed` inside `defaultExec` would require either threading PROCESS_SOURCE through (invasive) or factoring `makeDefaultExec(ctx, source)` (refactor). The cleanest fit was hoist-the-check pattern from #10427.

- **The #10427 hoist applies to ALL 6 venv-manager call sites.** Each of the 6 exec calls in createVenv has its OWN try/catch that swallows into `makeFailResult(...)` or a non-fatal `errors.push(...)`. Per #10427, EACH security check must hoist out of EACH swallowing try/catch. This drove the LOC up from a naive "1 check per file" estimate to 6 checks per file.

- **The `args-as-local-const` idiom kept the hoists readable.** Pattern: extract args into a `const xxxArgs = [...]`, call `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', cmd, xxxArgs)`, then pass `xxxArgs` to the executor. Same locals work twice (once for check, once for exec), no duplication of literal arrays.

- **Tests still pass even though `defaultExec` itself isn't wired.** Because the check fires in the public function BEFORE invoking the executor. When tests inject a mock executor, the mock bypasses defaultExec entirely — but the check has already run on the call args. Good shape.

## What surprised me

- **The DI-executor pattern doesn't fit #10433's "internal helper" framing cleanly.** #10433 prescribes "thread `ctx?` through the helper for 1 LOC × N callsites; files without a helper take N LOC × N callsites." For DI-executor shape with swallowing catches, neither holds — the right framing is: "hoist the check before each DI exec invocation, 3 LOC per hoisted site." That's a new costing model.

- **No new test files needed.** Audit-test catches the wire; existing test mocks bypass the security layer (no ctx passed → legacy-permissive). Zero test surface delta.

## Risk that didn't materialize

- The DI-executor shape might have broken the existing CommandExecutor type contract. It didn't — adding `ctx?` to `createVenv` and `cleanupVenv` is purely additive; all existing callers (`tests/dogfood/...`) continue to work without changes.

## Carried forward

- The dogfood family is fully closed; no follow-on chip work in this family.
- **NEW: DI-executor + hoisted-check pattern** — observed as 2 instances in this ship (health-check + venv-manager). Below the #10426 threshold for codification (2 instances in 1 ship don't count as 2 independent applications per #10426's "instance counts the application"). Carry forward to next codify ship for explicit consideration.
- Next batch candidate per the v826 handoff: scribe/netlist-renderer family (3 entries: available + netlistsvg-driver + yosys-driver). Audit each for an internal helper before sizing.

## Forward-test of #10433 (recap)

| Prediction (per #10433 v824) | Reality (v827 measurement) |
|---|---|
| ~14-20 LOC per file with internal helper | extractor.ts: ~12 LOC (low-end; 1 callsite explains it) |
| Helper-present shape: thread once | extractor.ts: matches; health-check + venv-manager need #10427 hoist instead |
| Discovery cost ↓ after codification | ~30 min total (v825 was ~30 min for git/core batch — comparable) |

#10433 is confirmed for pure internal-helper shape; a refinement may emerge for DI-executor shape on next instance.
