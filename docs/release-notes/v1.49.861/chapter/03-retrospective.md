# v1.49.861 — Retrospective

**Wall-clock:** ~12 min from v860 close to v861 close. Below the chip-cluster floor for new-test-file variants because the existing keystore.test.ts already had async-import patterns, makeIO helpers, etc.

## What went as expected

- **Hoist-outside-Promise variant transferred from v859.** Same shape (ensureProcessAllowed BEFORE `return new Promise(...)`), without the temp-dir cleanup since shellOut doesn't pre-allocate resources.
- **#10442 re-throw was NOT needed.** The child.on('error') handler INSIDE the Promise constructor handles post-spawn errors (ENOENT) only; security denials fire pre-spawn from the hoisted check. The scoping is the asymmetry that makes #10442 unnecessary here.
- **Cross-audit tool's 4th consecutive clean application.** v858-v861 all silent.

## What I noticed

- **The chip-cluster floor's variability.** v860 took ~25 min (internal-helper + test setup hiccups); v861 took ~12 min (hoist-outside-Promise + existing test infrastructure). The variance is the test-setup hiccups + the LOC of the wire itself, not the wire pattern.
- **Async-import in tests is normalized.** `await import('../../security/process-context.js')` continues to work cleanly for v860 + v861. Pattern now used in 3 test files (changelog-watch, linker, keystore).

## What surprised me

- **keystore.ts's existing structure already accommodated the wire.** No restructuring needed; the shellOut helper was already a single chokepoint for the spawn. The ctx? passes through naturally. This is what "lightest wire" looks like in practice — existing structure does the work.

## Risk that didn't materialize

- **No audit-test regression.** 2051 PASS.
- **No backward-compat break.** keystoreCommand(args, io) and keystoreCommand(args, io, ctx) both work.
- **No test flake.** The 3 new cases run in ~10ms; the existing 13 take ~30ms total.

## Carried forward (post-v861)

NEW this ship: 0 below-threshold observations (chip ship of established variant; pattern transfer was mechanical).

REINFORCED:
- Cross-audit tool continuous-verification (v858-v861, 4 instances). At 5 instances (v862) crosses the standard promotion threshold.

UNCHANGED:
- Pre-test FK-pragma pattern (v860, 1 instance).
- Pre-allocated-resource cleanup on security denial (v859, 1 instance).
- v857-v847 1-instance observations carry forward.

## Campaign progress

**5 of ~11 ships shipped.** Track 1 closed; Track 2 at 4 of ~5; Track 3 pending.
