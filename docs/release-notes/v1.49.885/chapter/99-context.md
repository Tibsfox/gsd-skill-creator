# v1.49.885 — Context

## Provenance

Second of the v884-v886 "alternatives" sub-campaign. Operator selected `Bounded → LoaderCtx → Counter` at session start; v884 shipped (bounded-learning observation-retention read-side wire). v885 picks the LoaderContext opener.

At v885 entry, scope was confirmed via 4-option AskUserQuestion ("Minimal pattern-extend" / "Surface-based replacement" / "Skip to v886" / "Stop here"). Operator selected minimal pattern-extend: extend name-glob from `*loader*` to `loader|reader|scanner|walker|store`, open KNOWN_UNWIRED with the resulting set, add stale-entry detectors, defer the first chip to v887+.

Mid-ship surprise: the cross-audit tool's Shape B detector reported `src/eval/calibration-adjustment-store.ts` as stale, which read-through showed was a tool bug (alias-stripping). Bug fix bundled into v885 since it was load-bearing for the ratchet-ledger opening. Confirms v883 carry-forward #4 ("Tools-detecting-silent-failures must fail loudly") at 2 instances — promotion-eligible.

## Predecessor

- **v1.49.884** — Bounded-Learning Verify-Axis Chip: `observation.retention_days` read-side wire. New `observation-retention-events.ts` module + dispatcher + CLI manual recorder. Substrate auto-emit deferred. Engine state UNCHANGED. NASA degree 1.178 (102 consecutive ships at margin record).
- **v1.49.883** — Codify ship: Promote 5 refinements from v868-v882 campaign. Doc-only. 5 new ESTABLISHED lessons (#10445, #10446, #10447, #10448, #10449).
- **v1.49.882 and earlier** — see prior release-notes.

## Disciplines this ship updates

- **None codified this ship.** The work applies existing established lessons (#10443, #10444-10448, #10427).
- **`tools/security/check-stale-known-unwired.mjs`** — bug-fix to Shape B alias-handling. Behavior-only change; no API surface. Tool now correctly handles `import { X as Y } from '...'` by searching the body for `Y` (the local binding) instead of `X` (the original name).

## Cross-references to related disciplines

- **KNOWN_UNWIRED ledger discipline** (#10432, #10434, #10443) — applied. Third chokepoint surface gains a ratchet-ledger; #10434 generalization (ledger-shape works for any cross-cutting observability+enforcement) holds.
- **Architecture-retrofit patterns** (#10444, #10445, #10447, #10448) — staged for use. v887+ chip ships will exercise this catalog on LoaderContext, providing additional cross-cluster validation.
- **Security chokepoints** (#10414, #10426, #10427, #10433, #10441, #10449) — extends the catalog. LoaderContext now treated as a sibling chokepoint to Process/Egress with its own ratchet-ledger (instead of name-glob-only enforcement).
- **Failure-mode contracts** (#10427) — applied. Stale-entry detectors fail loudly when invariants break.

## Forward path

- **v886: Counter-cadence cleanup-mission (NEXT)** — third of the v884-v886 sub-campaign. Will:
  - Codify "Tools-detecting-silent-failures must themselves fail loudly" (2 instances v867+v885) into a discipline-level lesson.
  - Possibly bundle other accumulated below-threshold observations.
  - Last counter-cadence at v838; overdue per #10168 / #10169 (~30 forward milestones rhythm = should have been ~v868).
- **v887+: First LoaderContext chip** — smallest-LOC file from KNOWN_UNWIRED (likely `src/console/reader.ts` at 109 LOC, N≈5 — moderate-complexity wire per #10445). Following chips per ascending LOC.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record now at **103 consecutive ships** at 1.178. The degree-advance opportunity cost continues to grow.
- LoaderContext KNOWN_UNWIRED opens at 15. Combined Process+Egress+Loader ledger total: 15. Compare to v806 opener (Process 38 + Egress 16 = 54). LoaderContext's opening scope is smaller — easier campaign to close.
- Promotion-eligible "tools fail silently" candidate sits at 2 instances; v886 is the natural codification window.
