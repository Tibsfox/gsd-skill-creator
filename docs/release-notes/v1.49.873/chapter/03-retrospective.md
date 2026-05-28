# v1.49.873 — Retrospective

**Wall-clock:** ~20-25 min from v872 ship close. Above the chip mean because of the 11-catch #10427 application — each catch is a 1-line addition + comment, but 11 of them adds up. Test reuse from existing pre-flight.test.ts mock framework saved 5+ minutes vs writing new test infrastructure.

## What went as expected

- **Module-internal-helper variant emerged naturally.** Two exported functions sharing one exec() helper at module scope wanted the helper to take ctx? as a parameter rather than being refactored to a closure. The closure-capture variant from v871 would have required duplication; module-internal-helper preserves DRY.
- **Existing test infrastructure reused.** The pre-flight test file already mocks execSync extensively. Adding 4 wire test cases at the end of the file took ~5 min vs starting from scratch.
- **#10427 re-throw discipline applied at 11 catches.** Each catch follows the same pattern: bind err, add `if (err instanceof ProcessContextDenied) throw err`, comment with #10427 reference. Mechanical but error-prone — every catch needs the discipline applied consistently.
- **Cross-audit gate ran clean.** Step 18/18 verified the wire automatically.

## What surprised me (mildly)

- **The 11-catch count is the new high-water mark.** v870 had 5, v871 had 4, v873 has 11. The pattern is now clearly promotion-eligible — 3 chips, growing count of mechanical re-throws. Codify candidate at next codify ship: either (a) a helper function `rethrowSecurityIf(err, ProcessContextDenied)` or (b) a `wrapResult(asyncFn, denialClass)` higher-order pattern that handles the re-throw automatically.

## What went wrong

- One Edit call almost mis-matched on a multi-line old_string but succeeded on retry. Minor process friction; the underlying file remained correct.

## Future-improvement candidates surfaced this ship

### #10427 multi-catch helper (PROMOTION-ELIGIBLE — 3rd instance)

**Surface ships:** v1.49.870 (5 catches) + v1.49.871 (4 catches) + v1.49.873 (11 catches).

Three consecutive chips applied the `if (err instanceof ProcessContextDenied) throw err` pattern N times each. Total: 20 mechanical re-throw insertions across 3 chips. At this density, a helper function or higher-order pattern is worth the codification investment.

**Proposed shapes:**
1. **Inline helper:** `function rethrowIfDenied(err: unknown): void { if (err instanceof ProcessContextDenied) throw err; }`. Call sites become `} catch (err) { rethrowIfDenied(err); /* recovery */ }`. 1-line per catch.
2. **Higher-order wrapper:** `await callOrRethrowDenial(asyncFn)`. Wraps the call+catch. ~50% fewer LOC per wired function.

**PROMOTION-ELIGIBLE at next codify ship** (probably v882 or post-Track-5 codify). The pattern is the most-frequent #10427 application observed across this campaign.

### Module-internal-helper variant catalog distinction

**Surface ship:** v1.49.873.

#10444 catalog has three "shared-helper hoist" variants: internal-helper-method (v870), closure-capture (v871), and the new module-internal-helper (v873). All three share the same fundamental shape (one hoist protects N callers via shared helper); they differ only in *where the helper lives lexically*.

**Below threshold (1 explicit instance).** The pattern was named in v871 retrospective at 1 instance; v873 strengthens with a 2nd instance variant. Promotion-eligible at next codify — refines #10444 by collapsing the three variants to "shared-helper hoist with sub-classifications" or noting them as siblings.

## Verdict on scope

Chip ship at ~20-25 min — above the mean due to the 11-catch re-throw discipline. Track 4 progress: 4/6 chips closed (67% through). KNOWN_UNWIRED Process down to 2 entries.

The #10427 multi-catch pattern is now decisively promotion-eligible. The next codify ship should consider authoring a helper or higher-order wrapper to reduce per-catch overhead.
