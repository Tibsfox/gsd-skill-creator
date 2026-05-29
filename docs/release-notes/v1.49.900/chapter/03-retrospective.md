# Retrospective — v1.49.900

## What Worked

**No tie-break needed — unique smallest entry.** v897 navigated a 176 LOC tie between `scan-state-store.ts` and `artifact-scanner.ts` by byte-shape match. v900 had no tie: `artifact-scanner.ts` at 176 LOC was the unique smallest after v897's chip. Size-ascending alone selected the file. The v897 "byte-shape tie-breaking" lesson did not apply (no ties), but the underlying size-ascending discipline #10444 carried unmodified. Confirms #10444 is robust to both tied and non-tied cases.

**Module-function form ships fast.** The wire took ~5 minutes from chip-pick to passing tests: import + LOADER_SOURCE constant + ctx? parameter + ensureAllowed hoist. No constructor changes, no instance field, no derived-method audit-count reasoning. Compare to v897 class-stored hoist-at-top which required reasoning about whether derived methods transitively call the gated path. The base hoist-at-top form (per #10448) is the cheapest sub-variant per LOC chipped.

**Caller verification took ~5 seconds.** `grep -rn "scanPhaseArtifacts" src/ --include="*.ts" | grep -v ".test.ts"` surfaced one production caller: `lifecycle-coordinator.ts:91`, two-arg form. Adding `ctx?` as the optional 3rd parameter is non-breaking. The grep-before-edit step is now standard pre-flight (carries from v897 retro).

**Audit-record-count test variant 4.** v900's audit-record-count test asserts "N=K records under K module-function direct invocations." This is the fourth distinct variant of #10456:

1. v892 two-site outer-loop: 9 records under 1 outer + 8 inner-loop.
2. v896 derived-method ripple: 3 records under 3 derived-method calls.
3. v897 mixed read/write derived methods: 2 records under 2 derived methods that each call load+save; save between them emits 0.
4. v900 module-function direct-call: K records under K direct invocations.

The fourth variant strengthens the #10456 template — module functions don't have derived methods or write-side methods, so the test reduces to the simplest form. The template (codified at v899) handles this naturally.

**Stale-known-unwired audit clean after chip.** Ran `tools/security/check-stale-known-unwired.mjs` post-wire — reported Loader: 8 / clean, no stale entries. The chip-down updates both the source file (adds ensureAllowed call) and the allowlist (removes the file's entry) in the same commit, so the inverse-check (#10443) never flags a stale entry.

## What Could Be Better

**No new lesson emitted; v900 is a v899-pattern-applied ship.** v900 reinforces existing patterns (#10444 size-ascending, #10448 base hoist-at-top, #10442 hoist-above-swallow, #10456 audit-record-count). No new 1-instance candidates emerge. The codify backlog after v900 is unchanged from v899's carry-forward (~14 candidates).

**The decision tree about state-reader.ts was deferred.** v900 picked artifact-scanner.ts on size-ascending alone, but state-reader.ts (190 LOC) presents an interesting case: a class with 3 fs-op methods (access in `directoryExists` + 4 readFile in `read` + readdir in `resolvePhaseDirectories`). This is NOT a clean #10455 class-stored hoist-at-top (which requires N=1 fs-op method). When v901+ chips state-reader.ts, the wire shape will surface a new sub-variant for #10448 — possibly "class-multi-method consolidated-gate" (one hoist at the public method entry that gates all transitive private fs-op methods). Carry-forward note for the next chip-author.

**No #10456 4th-variant promotion question.** v900's audit-record-count test is the 4th distinct variant of #10456 (codified at v899 with 3-variant evidence). The 4th variant doesn't change the template (it's the simplest reduction), so no codify-eligible signal. But if v901+ chips surface a 5th variant with new structural surface (e.g., recursive call sites), that could trigger a template revision.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail)
