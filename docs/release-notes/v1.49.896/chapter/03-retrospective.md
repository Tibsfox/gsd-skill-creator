# Retrospective — v1.49.896

## What Worked

**Handoff drift caught on the LOC catalog.** The v895 handoff named `scan-state-store.ts` (176 LOC) as the next chip target, but a direct `wc -l` on all 11 KNOWN_UNWIRED entries surfaced `workflow-run-store.ts` at 138 LOC — the actual smallest. The inline LOC catalog in `loader-context-audit.test.ts` correctly listed 138 LOC for workflow-run-store; the v895 handoff author appears to have sorted alphabetically and stopped at "discovery" rather than checking the smallest. The discipline of verifying actual LOCs before chipping caught this in ~5s. Generalizable: handoff candidate-naming is informational, not authoritative — confirm with the live file system at chip-pick time.

**Derived-method audit-record-count test surfaces a hidden invariant.** `getRunEntries` / `getLatestRun` / `getCompletedSteps` all call `readAll()` internally, so each derived-method call transitively emits one audit record. The test asserts exactly 3 records under 3 derived-method invocations. If a future refactor caches `readAll()` results (a plausible optimization), the test breaks. The audit-record-count assertion is therefore load-bearing — not just a counting exercise but a regression detector for "did we silently reduce audit fidelity?". Sibling of v892's two-site audit-record-count test (#10448 sub-variant 2).

**Class-stored hoist-at-top is now 2 instances.** v890 (calibration-adjustment-store) + v896 (workflow-run-store) both apply the same wire shape: `private readonly ctx?: LoaderContext` field, accepted in constructor, consumed via `this.ctx` at the single fs-op method. Sibling of the module-function hoist-at-top (v887 console/reader + v889 file-walker). The class-stored form has the ergonomic advantage of not threading `ctx` through every method signature, but only applies when the class has exactly one fs-op method (a single chokepoint surface). Promotion-eligible at 3rd instance — likely the next class-based KNOWN_UNWIRED entry (`scan-state-store.ts`, `state-reader.ts`, or `artifact-scanner.ts` — all ~176-190 LOC).

## What Could Be Better

**KNOWN_UNWIRED inline LOC catalog still needs maintenance.** The v885 catalog has accumulated drift since it was written: workflow-run-store at 138 LOC was correctly captured but its position in the alphabetical ordering was apparently missed by the v895 handoff author. The alphabetical ordering preserves git-blame discipline but obscures the size-ordering operators need for #10444. A possible future fix: regenerate the inline LOC values via a script (or add a comment block listing the LOC-ascending sort separately), but defer until the next codify ship rather than add scope here.

**Single-method-class subset of class-stored hoist-at-top is narrow.** v890 + v896 both had exactly ONE fs-op method (`load` / `readAll`). The remaining class-based KNOWN_UNWIRED entries may or may not share this shape: some classes have N=2 or N=3 fs-op methods, which would push them toward "class-instance two-site" (#10448 sub-variant) or a multi-site variant. The 2-instance evidence here covers N=1 class-method only; future chips will need a separate carry-forward for N≥2 class-method patterns.

**No new lesson emitted, but accumulating evidence is approaching synthesis-bar.** v892 added two 1-instance candidates; v896 adds the 2-instance class-stored hoist-at-top. The next codify ship will likely promote at least: (a) two-site hoisted-check at 2-instance if v897+ hits another N=2 file, (b) class-stored hoist-at-top at 3-instance if v897+ hits another single-method class. The codify-axis backlog is healthy — not pressuring; just ripening.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)
