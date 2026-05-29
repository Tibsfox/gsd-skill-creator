# Lessons Emitted — v1.49.897

No new manifest-promoted lessons this ship. Two 2-instance carry-forwards strengthened to 3-instance (PROMOTION-READY, deferred to v899 codify ship):

## PROMOTION-READY: Class-stored hoist-at-top sub-variant of #10448 (now 3 instances)

**Status:** READY-FOR-CODIFICATION at v899 (or next counter-cadence ship).

**Evidence (3 instances):**

1. **v1.49.890** — `src/eval/calibration-adjustment-store.ts`: class `CalibrationAdjustmentStore` with single `readFile` in `load()`; `private readonly ctx?: LoaderContext` field; constructor `(filePath: string, ctx?: LoaderContext)`; hoist at top of `load()` BEFORE ENOENT try/catch; `save()` out-of-scope.
2. **v1.49.896** — `src/skill-workflows/workflow-run-store.ts`: class `WorkflowRunStore` with single `readFile` in `readAll()`; same wire shape; `append()` out-of-scope; 3 derived methods ripple.
3. **v1.49.897** — `src/discovery/scan-state-store.ts`: class `ScanStateStore` with single `readFile` in `load()`; same wire shape; `save()` out-of-scope; 2 derived methods ripple (`addExclude`/`removeExclude`).

**Why this is a distinct sub-variant of #10448:** The module-function hoist-at-top (v887 `console/reader` + v889 `file-walker`) threads `ctx` per-call through function signatures. The class-stored form threads it once through the constructor, stores it as `private readonly ctx?`, and consumes via `this.ctx`. Both forms hoist at the top of the fs-op site OUTSIDE the ENOENT-tolerating try/catch per #10442. Both work for N=1 spawn sites. The class-stored form is preferred when the wired class has a single fs-op method (a single chokepoint surface) — it preserves the public method signature unchanged.

**Codification placement:** Add to `docs/architecture-retrofit-patterns.md` under "Shared-helper hoist sub-variant catalog (#10448)" alongside the existing entries.

## PROMOTION-READY: Audit-record-count test for fidelity-reducing refactors (now 3 instances)

**Status:** READY-FOR-CODIFICATION at v899 (or next counter-cadence ship).

**Evidence (3 instances):**

1. **v1.49.892** — `dacp/bus/scanner.ts` two-site outer-loop test: assert 9 records (1 + 8 inner-loop calls).
2. **v1.49.896** — `workflow-run-store.ts` derived-method ripple test: assert 3 records under 3 derived-method invocations (`getRunEntries`/`getLatestRun`/`getCompletedSteps`).
3. **v1.49.897** — `scan-state-store.ts` derived-method ripple test: assert 2 records under 2 derived-method invocations (`addExclude`/`removeExclude`), and ALSO assert 0 records from the explicit `save()` between them (write-side not gated by design).

**Common shape:** "Assert exactly N audit records under N invocations" where N is determined by the code path's structural fan-out, not arbitrary. Test breaks if a future refactor caches results (e.g. memoizes `readAll()` / `load()`) or coalesces audit emissions. Load-bearing regression detector against silent fidelity reductions.

**Codification placement:** Add to `docs/test-discipline/cf-closure-verification-templates.md` as a new template: "Audit-record-count assertion for chokepoint-gated read paths."

## PROMOTION-READY: Read-side-only chokepoint at write-bearing classes (now 3 instances)

**Status:** READY-FOR-CODIFICATION at v899 (or next counter-cadence ship).

**Evidence (3 instances):**

1. **v1.49.890** — `calibration-adjustment-store.ts`: `load()` gated; `save()` intentionally NOT gated.
2. **v1.49.896** — `workflow-run-store.ts`: `readAll()` gated; `append()` intentionally NOT gated.
3. **v1.49.897** — `scan-state-store.ts`: `load()` gated; `save()` intentionally NOT gated.

**Why this matters:** LoaderContext is a READ-side chokepoint per its docstring (`src/security/loader-context.ts`). When a class has both read and write methods, only read methods are gated. The write-side is intentionally out-of-scope — gating writes would require a separate WriterContext chokepoint (no such surface exists today). Tests should explicitly assert "0 audit records on write" to prevent accidental future gating drift.

**Codification placement:** Add to `docs/security-chokepoints.md` under "LoaderContext" as a documented design constraint.

## 1-instance candidate: Live-inspection-driven byte-shape tie-breaking (v897)

When LOC-tied chip candidates exist (e.g., 176 LOC ties at v897 between `scan-state-store.ts` and `artifact-scanner.ts`), inspect both files' structural shapes and prefer the one that completes an existing 2-instance carry-forward into a 3-instance promotion. This ties #10444 size-ascending to the codify-axis backlog and gives the chip cycle a forward-looking criterion beyond raw LOC. First instance v897; not yet promotion-eligible.

## 1-instance candidate: Convergence between size-ascending and shape-matching (v897)

When the v(N-1) handoff names a chip target by size AND the v(N-2) carry-forward names the same file by shape, the convergence is informative — it confirms both heuristics point at the same target. When they diverge, the chip-author should document which heuristic was preferred and why. First instance v897; not yet promotion-eligible.

## Cross-references

- #10442 (Failure-mode contracts — Re-throw ProcessContextDenied / LoaderContextDenied above swallow-catches)
- #10444 (Size-ascending chip-pick reveals wire-shape diversity)
- #10445 (Spawn-site count N as primary wire-shape predictor)
- #10448 (Shared-helper hoist sub-variant catalog) — this ship strengthens the class-stored sub-variant
- #10432 (KNOWN_UNWIRED allowlists as migration-debt ledger)
- v1.49.890 retrospective — first class-stored hoist-at-top instance
- v1.49.896 retrospective — second class-stored hoist-at-top instance + derived-method ripple test debut
