# v1.49.860 — Retrospective

**Wall-clock:** ~25 min from v859 close to v860 close. Above the chip-cluster ~10-15 min floor because of:
- First Track 2 internal-helper variant (#10433) — required threading ctx through 2 exported entry points + 4 call sites + 1 hoisted check.
- Two test setup hiccups (NOT NULL on `recorded_at`; FOREIGN KEY constraint on `decision_id`) — resolved by adding the recorded_at value + disabling FKs for the wire-only test.

## What went as expected

- **Internal-helper pattern transferred cleanly.** v847-codified #10433 says "thread `ctx?` through the internal helper for 1 LOC × N callsites; files without a helper take N LOC × N callsites." linker.ts has the helper; cost was ~15 LOC total for ~4 protected spawn sites.
- **Cross-audit tool's 3rd consecutive application: still clean.** v858+v859+v860 all produce 0 stale; the silent steady state continues.

## What I noticed

- **Test setup for the wire was harder than the wire itself.** mission_links has both NOT NULL (recorded_at) and FOREIGN KEY (decision_id → decisions(id)) constraints. The wire test only exercises git invocation, so the FK chain wasn't worth seeding — disabling FKs via `db.pragma('foreign_keys = OFF')` was the lightest test-setup. Worth noting: pre-test FK-pragma pattern for "only test the wire, not the full lineage" cases.
- **Async-import inside test body.** Used `const { resolveMissionCommits } = await import('../linker.js')` + `await import('../../../security/process-context.js')` to avoid hoisted-import circular dependency between the test file and the modified source. Pattern noted at v853 (git-collector); applied again here.

## What surprised me

- **5 LOC cleaner than expected for internal-helper.** The `, ctx` pass-through is 1 token per call site. 4 call sites + 2 entry points = ~7 tokens. The actual surface delta was 15 LOC because imports + comments + the 2-line entry-point signature changes added the bulk.

## Risk that didn't materialize

- **No flake in the FK-disabled mission_links insert.** SQLite's `PRAGMA foreign_keys = OFF` is per-connection; clean for the in-memory test DB.
- **No audit-test regression.** 2051 PASS; file removed from KNOWN_UNWIRED.
- **No backward-compat break.** All 3 entry-point signatures gained an optional trailing `ctx?` parameter; existing callers don't break.

## Carried forward (post-v860)

NEW this ship: 1 below-threshold observation.

- **Pre-test FK-pragma pattern for wire-only tests** — 1 instance (v860). When a wire test only exercises a downstream side-effect (git invocation here), disabling FK constraints via `db.pragma('foreign_keys = OFF')` lets the test seed minimal upstream rows without the full FK chain. Faster than seeding meetings + decisions + ... for a security-only test. Wait for 2nd instance.

UNCHANGED:
- Cross-audit tool continuous-verification (v858-v860, 3 instances; still below promotion threshold of 4).
- Pre-allocated-resource cleanup on security denial (v859, 1 instance).
- v857-v847 1-instance observations carry forward.

## Campaign progress

**4 of ~11 ships shipped.** Track 1 (codify) closed; Track 2 (Process chips) at 3 of ~5; Track 3 pending.
