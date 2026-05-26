# Retrospective — v1.49.777

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Third instance; the cadence concept extends to include review-surfaced BLOCKERs as a trigger class alongside accumulated-rule-debt (v585) and bug-cascade-with-public-impact (v776).
- **SHARED-HELPER-EXTRACTION-FROM-COPYPASTA (sustained).** The write-queue sweep follows the same pattern as the earlier-session `isCliEntrypoint` extraction at `src/cli/entrypoint-guard.ts` — identify N near-identical sites, extract a single canonical helper, sweep callers. obs#2 cumulative.
- **Atomic-commit-per-logical-fix.** Four separate commits for the four BLOCKER fixes plus a fifth release commit, instead of one omnibus commit. Per-fix commit messages cite their specific tier finding for traceability.

## What Worked

- **Risk-tier sweep dispatch in parallel produced complete coverage in ~10 minutes wall-clock.** 5 sub-agents on non-overlapping scopes (security / correctness / performance / tests / architecture) returned structured findings in under 12 minutes total wall-clock, well under the 60-tool-use ceiling per sub-agent. The non-overlap brief (each tier explicitly told to stay out of others' lanes) kept findings clean and prevented duplicate-flag noise in the synthesis.
- **Cross-tier hot-spot prioritization in the synthesis.** `src/chipset/blitter/executor.ts` appeared in both the security tier (BLOCKER — RCE-by-design) and correctness tier (HIGH — temp-dir leak). That co-occurrence moved the file to the top of the fix queue: one diff satisfied two tier findings, and the independent corroboration raised confidence in the disposition.
- **Defense-in-depth over removal on blitter executor.** Option A (rip out the dynamic-exec capability) would have broken the chipset/copper offload path that legitimately uses bash/node/python interpreters. Option C (drop 'custom' + chmod + env allowlist + temp leak) preserves the legit surface while closing the attacker-controlled-shebang vector. Verified zero existing callers use 'custom' before dropping it.
- **Shared helper for write-queue beats per-file inline fix.** 14 sites across 10 files would have been 14 separate `.then(work, work)` inline edits; the `serializeWrite(holder, work)` helper collapses each site to one call and provides a single point of test coverage for the regression (first-call-rejects-then-second-call-succeeds). The helper also documents the failure mode and the fix in its docstring, which future authors of new JSONL stores can read.
- **Per-file test verification before commit.** Each fix was verified against its subsystem test suite (24 acquirer tests + 57 blitter tests + 273 store tests + 30 VRAM Rust tests + 1445 consumer tests) before the atomic commit, so any test regression would have surfaced immediately rather than at pre-tag-gate time.
- **Counter-cadence framing kept engine state clean.** Reframing the ship as v1.49.777 counter-cadence (not a degree advance) avoided false NASA-cadence claims, no SCAFFOLD-PENDING obs increment, no thread promotion that the work doesn't earn.

## What Could Be Better

- **Wave 1 closes only 4 of 20+ surfaced findings.** The full-codebase review produced 4 BLOCKERs, 16+ HIGHs, and a strategic architecture backlog. This ship closes only the 4 BLOCKERs by design — Wave 2 needs scheduling to close the security HIGHs (dashboard 0.0.0.0 binding, Tauri command validation, hook fail-open) before another forward-cadence ship.
- **The review itself was triggered ad-hoc.** A periodic risk-tier-sweep cadence (e.g. every N forward milestones, or every M weeks) would catch BLOCKERs earlier rather than depending on operator-triggered review requests. Worth scheduling.
- **Tier B reviewer counted 11 write-queue sites; actual count was 14 across 10 files including one site (testing/result-store.ts) missed in the original review.** Future grep-based pattern-find sweeps should run the grep again at fix time to catch drift between review and remediation.

## Decisions

- **Wave 1 BLOCKERs only — full plan deferred (operator-authorized via 4-option prompt).** Alternative considered: pack Wave 1 + Wave 2 (security HIGHs) into one larger ship. Operator chose Wave 1 only to bound ship-time scope.
- **Defense-in-depth Option C for blitter executor — not strip the surface (Option A).** Per `executeOffloadOp` call sites in `src/chipset/copper/activation.ts` and `src/observation/script-generator.ts`, the bash/node/python interpreters are in active use by the chipset offload pipeline. Stripping the executor would break that pipeline; hardening the executor preserves it while closing the attack surface.
- **Shared helper at `src/safety/write-queue.ts` — not new top-level `src/concurrency/` subsystem.** Tier E flagged 95+ existing subsystems as sprawl; adding a new one for a single helper would compound the structural-debt finding. Co-locating with audit-logger.ts (the canonical JSONL store) keeps related primitives together.
- **`enum Backing { None, Mmap, Alloc }` — not separate `Option<...>` field for each strategy.** The variant enum is type-safe (`match` is exhaustive) and adds 1 byte to PinnedBuffer's footprint. A pair of Options would allow inconsistent states (both Some, both None) that the enum rules out.

## Surprises

- **The Tier B reviewer found an additional write-queue site that the tier's original count missed.** `src/testing/result-store.ts:52` carried the same self-poisoning pattern but wasn't in the reviewer's enumerated list. A grep-for-pattern at fix time caught it; including it brought the total from 13 (10 stores listed) to 14 sites (10 stores + the test-result store).
- **`'custom'` scriptType in `OffloadOperationSchema` had zero production callers despite being in the enum.** Test fixtures and the executor itself referenced it, but no consumer of the offload pipeline ever set scriptType='custom'. Safe to reject at execution time without breaking anything.
- **The cargo test filter `vram` returned 0 tests under default features but 30 tests under `--features cuda`.** All VRAM infrastructure is feature-gated; default `cargo check` doesn't compile it. Worth surfacing in CI config to ensure the cuda feature is tested somewhere.
- **`munmap` on alloc'd memory is the same UB class as `dealloc` on mmap'd memory.** The original code only worried about the second direction (the comment says "munmap will fail silently"); the first direction (munmap on alloc'd memory) is just as undefined and the original code would silently invoke it under any munmap failure mode. The Backing enum closes both directions symmetrically.

## Lessons Learned

See `04-lessons.md`.
