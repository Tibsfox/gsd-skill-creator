# v1.49.875 — Retrospective (Track 4 CLOSE)

**Wall-clock:** ~10-12 min from v874 ship close. The largest file of the campaign turned into one of the fastest chips because spawn-site count = 1. Test setup pattern reuse from v870-v874 made the wire test ~3 min.

## What went as expected

- **The LOC counter-example played out cleanly.** I expected 1440 LOC to require multiple-site handling. Reality: one execSync at line 255, no other spawn sites in the file. Single hoist-at-top + single re-throw catch.
- **Track 4 closes cleanly.** 6 chips, 6 wire shapes, no rework, no regressions. The #10444 catalog held across the full Process cluster.
- **Cross-audit ran clean automatically.** KNOWN_UNWIRED Process now empty — first time since v806 introduction (8 months of chip work to drain the ratchet).

## What surprised me (mildly)

- **Test file already had its own execSync import for setup.** I added an import block for the security types but didn't conflict with the existing test's execSync usage (that's at the test-fixture level for git setup, separate from the function-under-test's execSync). Clean separation.

## Track 4 retrospective (6-chip cluster)

| Chip | File | LOC | N(spawn) | Wire Shape | Catches |
|---|---|---|---|---|---|
| v870 | version-manager | 177 | 7 | class-private-method | 5 |
| v871 | contribute | 183 | 9 | closure-capture | 4 |
| v872 | pic2html | 311 | 1 | hoist-at-top | 0 |
| v873 | pre-flight | 363 | 12 | module-internal-helper | 11 |
| v874 | acquirer | 509 | 9 | safeExecFile wrapper | 3 |
| v875 | harness-integrity | 1440 | 1 | hoist-at-top | 1 |

**Total catches re-thrown for #10427: 24 across Track 4.** Promotion of a #10427 multi-catch helper is decisively ready at next codify.

**Wire-shape diversity: 5 distinct shapes** across 6 chips (v872 + v875 both used hoist-at-top because both had N=1 spawn site). Refines #10444: the "size-ascending reveals shape diversity" rule holds, but with the spawn-site-count refinement.

## What went wrong

- ESM/CJS confusion in the test file — initial test used `require()` to inline-import (CJS pattern); had to refactor to top-level static import (ESM-correct). Caught immediately by vitest. ~2 min recovery.
- Post-ship retrospective truncation by RH publish pipeline (same as v871). Restored from in-context content.

## Future-improvement candidates surfaced this ship (now PROMOTION-ELIGIBLE)

### Spawn-site count as primary predictor (refinement of #10444)

**Surface ships:** v1.49.872 (1st instance — 311 LOC, N=1, hoist-at-top) + v1.49.875 (2nd instance — 1440 LOC, N=1, hoist-at-top).

Two instances of "large or mid-LOC file with N=1 spawn site → hoist-at-top". The #10444 catalog's LOC-band prediction is approximate; spawn-site count is the more precise axis. PROMOTION-ELIGIBLE at next codify.

### #10427 multi-catch helper (PROMOTION-ELIGIBLE — 5 instances now)

**Surface ships:** v870 (5) + v871 (4) + v873 (11) + v874 (3) + v875 (1). Total: 24 re-throws across 5 chips.

Decisively codification-ready. The next codify ship should implement either:
1. `function rethrowIfDenied(err: unknown): void` — inline helper, 1-line call per catch.
2. `await callOrRethrowDenial(asyncFn)` — higher-order wrapper, ~50% fewer LOC per wired function.

## Verdict on scope

Track 4 CLOSED at 6/6 chips. The Process chokepoint is now structurally complete across src/ — every file that imports child_process either calls ensureProcessAllowed or is explicitly NOT-a-process-caller per docstring exemption. The migration-debt ledger that started at v806 with 16 grandfathered entries is empty for Process after 8 months and ~30 chip ships.

Egress is the next ratchet to drain (currently 6 entries). v876-881 will close Track 5.
