# Retrospective — v1.49.897

## What Worked

**v896 lesson #5 closed the loop on its first application.** v896 added a 1-instance candidate: "handoff candidate-naming is informational, not authoritative — verify with the live file." v897 was the first chip-pick after that lesson, and the live `wc -l` on all 10 KNOWN_UNWIRED entries took ~5s and confirmed the size-tied pair (176 LOC `scan-state-store.ts` and `artifact-scanner.ts`). Without the discipline, defaulting to the v896 handoff's named candidates would have worked but missed the inspection-driven shape match. The lesson promoted itself from informational to procedural in one chip cycle.

**Byte-shape match drove tie-breaking.** Two files were tied at 176 LOC. The pick was `scan-state-store.ts` not because of LOC but because its structural shape (class + single `readFile` site in `load()` + ENOENT-tolerant try/catch + write-side `save()`) is byte-shape-identical to v890 and v896. The tie-breaker was "which file completes a 2-instance carry-forward into 3-instance ESTABLISHED?" — a forward-looking criterion that ties #10444 size-ascending to the codify-axis backlog. Generalizable: when LOC-tied candidates exist, prefer the one that closes an existing 2-instance pattern.

**Class-stored hoist-at-top is now 3 instances.** v890 (calibration-adjustment-store) + v896 (workflow-run-store) + v897 (scan-state-store). The 3-instance threshold promotes the sub-variant from carry-forward to ESTABLISHED. v899 (codify ship) will document this as a named #10448 sub-variant alongside the module-function form (v887/v889). The codify-axis backlog had 16 candidates going into v897; this ship closes one promotion-eligible item.

**Derived-method audit-record-count test strengthened to 2 instances.** v896's test exercised 3 derived methods (`getRunEntries`/`getLatestRun`/`getCompletedSteps` → 3 audit records). v897's test exercises 2 derived methods (`addExclude`/`removeExclude` → 2 audit records, with `save()` between them emitting zero — also a load-bearing assertion). Both instances assert "exactly N records under N invocations" as a regression detector against silent caching refactors. Sibling of the v892 outer-loop audit-record-count test.

**Single production caller verification took ~5s.** `grep -rn "new ScanStateStore" src/` surfaced `corpus-scanner.ts:97` as the only production caller, using single-arg form. Non-breaking change confirmed before the source edit. The grep-before-edit step is so cheap that it should be standard pre-flight for any constructor signature change.

## What Could Be Better

**The v896 carry-forward's "promotion-eligible at 3rd instance" was a near-miss.** v896 said "most likely target: another single-method store-class chip at v897+ (`scan-state-store.ts`, `state-reader.ts`, or `artifact-scanner.ts`)." All three are class-based; the v897 pick was `scan-state-store.ts` which was on the list. But the v895 handoff also named `scan-state-store.ts` as #1 candidate based purely on size-ascending. The two paths converged but for different reasons (v895: size; v896: shape match). For future chip-picks: when carry-forward and size-ascending both point at the same file, the convergence is informative; when they diverge, document why one was chosen over the other.

**No new lesson emitted; this is a v896-lesson-applied ship.** v897 reinforces existing patterns without introducing new ones. The codify ship (v899) will absorb the promotion. Maintaining the discipline of "don't promote 1-instance to ESTABLISHED prematurely" — even when the patterns feel obvious — preserves the 3-instance bar that makes the codify ships rigorous.

**Test infrastructure for the LoaderContext block duplicated existing fixture setup.** The new `describe` block in `scan-state-store.test.ts` re-declares `tmpDir` and `createTmpDir`/`afterEach` from the parent describe. This is intentional (each describe is independent), but adds ~12 LOC of boilerplate. A possible future cleanup: extract a shared fixture helper, but defer to a codify ship rather than add scope here.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)
