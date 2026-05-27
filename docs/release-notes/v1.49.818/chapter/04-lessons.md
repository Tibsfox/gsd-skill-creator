# v1.49.818 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + ~10-12 tentative observations (UNCHANGED from v817).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Grep'd `src/cli/` for `FlagLookup\|getFlagValue` in 30 seconds; got 4 files with 48 references. Inspected one file in full; side-by-side comparison of the 4 inline blocks confirmed byte-identicality. Recon time < 5 min before any code change. |
| #10416 | Tolerant-generator / lightest wire | Resisted: generic CLI-arg parser library, schema-derived FlagLookup, flag-shape-variant parsers. Chose: extract exactly the existing 9-LOC inline pattern, byte-identical. The extracted module is minimal (14 LOC). |
| #10422 | Verdict-pattern surface separation | The shared module is the decision surface ("how to parse a flag"). Each command's argument-handling code is observability surface that dispatches on the discriminated-union return. Clean. |
| #10426 | Cross-class registry extraction at 2nd-3rd instance | THE central application. 4 byte-identical instances; #10426 threshold passed. Closure: extract to `src/cli/lib/flag-lookup.ts` + migrate. The wedge had been at 4 instances since v796 (~30+ ships); deferred-maintenance accumulated until the recon-surfaced ship. Pattern: deferred wedges typically close at 4th instance because they get NAMED at 4th, not 2nd. |
| #10427 | Failure-mode contracts | Function behavior unchanged; discriminated-union return encodes failure modes (absent / present-with-null / present-with-value) in the type. Documented in the doc comment on `flag-lookup.ts`. |

## Tentative observations carried forward (~10-12 — UNCHANGED from v817)

| Source | Observation | Status |
|---|---|---|
| (v810-814) | watch-loop tear-down race | carry forward |
| (v810-814) | chained-session architectural-tax break-even | carry forward |
| (v810-814) | registry-abstraction cross-chain payoff | carry forward (+ instance: v818 IS the registry extraction case study) |
| (v804) | 6th-mode-flag refactor trigger | carry forward |
| (v805) | codification-ship pattern at 5 instances | **eligible for promotion in next codify ship** |
| (v806) | Chokepoint pattern at 4 instances | **eligible for promotion in next codify ship** |
| (v810) | Recon doc name-drift across ~1 day | carry forward (2 instances) |
| (v810) | Two-layer default-off contract | carry forward |
| (v811) | Post-infrastructure chip cadence ~2× faster | carry forward |
| (v811) | Block-comment consolidation when N-of-N siblings wired | carry forward (+ instance: v818 IS a 4-of-4 consolidation case) |
| (v813) | `node_modules` symlink pattern for tmpdir-isolated CLI tests | carry forward |
| (v815) | Audit findings have a half-life | carry forward |
| (v815) | Original-author forward-flagging | carry forward |
| (v815) | Refcount at operation boundary | carry forward |
| (v815) | Lazy-singleton + test-hook | carry forward |
| (v816) | Side-bug discovery via test design | carry forward |
| (v816) | `--check` semantics: canonical vs would-regenerate-now | carry forward |
| (v817) | Fork-budget math as static-analysis metric | carry forward |
| (v817) | Lightest-wire wins when blast radius is bounded | carry forward (2 instances if v818 byte-identical-extract counted) |
| (v817) | Comment-block expansion as non-code half of #10415 | carry forward (2 instances if v818 module-attribution-comment counted) |

## New observations flagged this ship (not promoted; not in count)

**Deferred wedges close at 4th instance, not at the discipline's named 2nd-3rd threshold.** #10426 says "extract at 2nd-3rd instance." Empirically, the FlagLookup wedge waited until 4th instance before getting named in a handoff. Pattern: deferred wedges have a "tolerated" phase where N instances accumulate before someone notices in recon; the closing ship typically lands at N+1 or N+2 above the discipline threshold. Tentative; this is a meta-observation about discipline application latency, not the discipline itself. 1 instance; potential 2-instance pattern if a future cross-class extract shows the same pattern.

**Mechanical migrations should have a small unit test added with the extract.** Before extraction, `getFlagValue` was tested implicitly through CLI integration tests. After extraction, `flag-lookup.test.ts` covers each return-shape branch directly. The mechanical migration is byte-equivalent at runtime, but the new test surface is genuinely new coverage. Pattern: registry-extract ships should typically include `<extracted-name>.test.ts` for the extracted module, even when the integration coverage already exists. Tentative; 1 instance.

**The 25-line attribution comment on the extracted module is the closure documentation.** Future readers find v796 deferral + v818 closure inline in `flag-lookup.ts`, no release-notes spelunking needed. Mirrors v817's structural-cause comment expansion. Pattern: when extracting a registry/abstraction, include inline attribution naming the deferral source + closing ship + applied discipline. Tentative; observation overlaps with v816/v817 observations about inline-documentation; potential 3-instance pattern.

## Cross-references

- #10412 + #10426 → recon-first surfaces the N-instance count; registry extraction triggers based on the count.
- #10416 + #10426 → lightest-wire pairs with cross-class extraction: extract exactly what's there, byte-identical.
- #10422 + #10427 → verdict-pattern separation + failure-mode contracts: the extracted module's discriminated-union return IS the failure-mode contract.

## What this ship illustrates about T2.3 closure cadence

After v815 (HIGH-01), v817 (c12 flake), and v818 (FlagLookup), the T2.3 audit-surfaced backlog has fully closed in 3 ships across the v816-822 chain — even though the v784 audit sized it at "2-4 ships." Recon at v815 found 4-5 wedges had self-closed; the remaining 3 (originally just 1, plus 2 recon-surfaced) closed at v815 + v817 + v818.

The audit's "2-4 ships" sizing was a snapshot; the recon-driven view gives a more accurate "3 ships across the v815-818 window." Lesson #10412 (recon-first) + audit-list-staleness (v815 tentative observation) compound: the recon view of an audit list is more accurate than the audit itself by the time work begins.

After v818, the chain pivots to non-T2.3 work: aminet batch chip (v819), git/core chip (v820), discipline-coverage gate flip × 2 (v821-822), ObservationBridge wire (v823).
