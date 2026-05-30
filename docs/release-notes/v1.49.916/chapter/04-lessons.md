# Lessons Codified — v1.49.916

This is a **codify ship**: it promotes the candidate #10461 (3-instance bar met across v913/v914/v915) into the disciplines manifest + canonical doc. Manifest lessons **147 → 148**; UNCODIFIED 0 / PARTIAL 0 unchanged; ceilings 5/5.

## #10461 — Gate-enforce every runnable surface, paired with a drift-guard (CODIFIED)

**A test/observability/policy surface that runs nowhere enforced silently rots. Gate-enforce every such surface, AND pair the gate with a drift-guard so the enforced SET — or its REFERENCE DATA — cannot silently drift.**

The 3-instance bar was reached at v915. This ship codifies it:

- **Canonical doc:** new section in `docs/known-unwired-ledger-discipline.md` (the #10443 KNOWN_UNWIRED home — an allowlist is itself a reference-data surface, so the inverse-audit IS its Layer-2 drift-guard). It carries the two-layer shape (Layer 1 enforce / Layer 2 drift-guard) and the three-form drift catalog.
- **Manifest:** `#10461` appended to the "KNOWN_UNWIRED allowlists as migration-debt ledger" domain in `tools/render-claude-md/disciplines.json` (`key_lessons`, summary, trigger, `codified_at_milestone: v1.49.916`); `npm run render:claude-md` regenerated the gitignored CLAUDE.md.

**The three-form drift catalog (the generalization a 3rd instance makes):**

| Instance | Ship | Surface | Layer 1 (enforce) | Layer 2 (drift-guard) | Drift form |
|---|---|---|---|---|---|
| 1 | v913 | `vitest.tools.config.mjs` (~40 vitest tests) | pre-tag-gate step 2.5 `tools-suite` + CI | `tools-config-coverage.test.mjs` include-list vs disk | **omission-drift** |
| 2 | v914 | 2 `tools/` node:test files | pre-tag-gate step 2.7 + CI | `--print-node-test` exact-set `toEqual` | **silent-addition-drift** |
| 3 | v915 | `atlas-deps-audit` policy tool | live-tree Case 6 in gate+CI suite | Case 6 IS the drift-guard (allowlist vs disk) | **reference-data-staleness** |

Instances 1/2 rot as *"the tests don't run"*; instance 3 rots as *"the reference data went stale."* Same disease (unenforced ⇒ silent rot), same cure (wire the surface's own check into the gated suite so it enforces itself).

**Self-applied this ship.** The codify ship demonstrated #10461 live: three new test files were registered in `vitest.tools.config.mjs` and immediately validated by the Layer-2 drift-guard (`tools-config-coverage.test.mjs`) — instance 1's drift-guard catching the include-list change. Gate-enforce-every-runnable-surface in practice.

## Disciplines applied (existing)

| Lesson | How it was applied this ship |
|---|---|
| #10461 (now codified) | The codify itself; self-applied via the 3 new test registrations + drift-guard |
| #10427 (failure-mode contracts) | `db.mjs` loud actionable credential error replaces the opaque pg SASL (load-bearing surface fails loudly with a message that names the fix); the v916 review added a paired pin-test for the passwordless edge |
| #10443 / #10432 (KNOWN_UNWIRED ledger) | the codification's home; an allowlist is a reference-data surface |
| #10415 (deferred-maintenance) | the un-masked AC7 audit FAIL was closed in-ship rather than deferred — an open red audit shouldn't be carried |
| #10416 / #10422 (lightest wire) | AC7 fix = a narrow exact-match per-file `leak_scan_allowlist`, never a global gate relaxation; `leakScan` made DI-testable |
| entrypoint-guard discipline | `refresh.mjs` `main()` wrapped behind a CLI entrypoint guard (3rd instance of the shape after `src/cli.ts` + v915 `chapter.mjs`) so import-time side effects don't run the pipeline |
| #10430 (counter-cadence) | counter-cadence #17 (finer-grained ~5-ship maintenance cadence) |

## Cross-references

- #10461 (codified here; opened v913, advanced v914, bar met v915)
- #10443 / #10432 / #10434 (KNOWN_UNWIRED ledger — #10461's manifest home)
- #10427 (failure-mode contracts — the db.mjs loud error + the leak-scan gate posture)
- #10415 (deferred-maintenance — AC7 closed in-ship)
- v1.49.913 / v1.49.914 / v1.49.915 (the three #10461 instances)
