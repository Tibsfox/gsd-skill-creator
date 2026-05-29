# Context — v1.49.897

## Predecessor

- **v1.49.896** — Fifth LoaderContext chip (`skill-workflows/workflow-run-store.ts`), class-stored hoist-at-top 2nd instance.
- Shipped at: `822c18fa6` (with post-ship rh refresh `bded5ebcb`).
- Counter-cadence: false.

## This ship

- **v1.49.897** — Sixth LoaderContext chip (`discovery/scan-state-store.ts`), class-stored hoist-at-top **3rd instance — PROMOTES sub-variant**.
- Counter-cadence: false.
- NASA degree: 1.178 (UNCHANGED — 115 consecutive ships at this degree; pressure-margin record extended by 1).
- KNOWN_UNWIRED Loader 10 → 9.

## Provenance

- Branch: `dev`.
- Pre-ship tip: `bded5ebcb` (post-v896 rh refresh).
- Single-ship session — opened directly from the v896 handoff's option 2 (continue LoaderContext chip-down).
- Live `wc -l` at chip-pick confirmed 176 LOC tie between `scan-state-store.ts` and `artifact-scanner.ts`. Byte-shape inspection favored `scan-state-store.ts` (class with `load()` + `save()` mirroring v890 + v896 exactly).
- Lesson from v896 #5 applied: handoff candidate-naming is informational; verify with live `wc -l` and inspection.

## Forward path (multi-ship plan)

This is **ship 1 of 3** in a planned multi-ship session:

- **v897 (this ship)** — LoaderContext chip #6, closes class-stored hoist-at-top to 3-instance promotion-ready.
- **v898 (next)** — Integration test for `token_budget.max_percent` (verify-axis trigger within #10428 budget; PENDING-TEST status @ v893; 7 ships remaining → ship now consumes 1).
- **v899 (after)** — Counter-cadence codify ship. Promote: class-stored hoist-at-top sub-variant (3 instances), audit-record-count test template (3 instances), read-side-only at write-bearing classes (3 instances). Set `counter_cadence: true`.

## Engine state at close

- NASA degree: **1.178** (115 consecutive ships at 1.178; pressure-margin record extended by 1).
- Counter-cadence count: **8** (UNCHANGED; v899 will increment to 9).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **95** (UNCHANGED — promotion deferred to v899).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 10 → 9** (-1 via this chip).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED); verify-axis 6 COVERED + 1 PENDING-TEST (`token_budget.max_percent` @ v893; v898 will close this).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).

## Cross-references

- v1.49.890 (`calibration-adjustment-store.ts` — first class-stored hoist-at-top instance)
- v1.49.896 (`workflow-run-store.ts` — second class-stored hoist-at-top instance)
- #10448 (Shared-helper hoist sub-variant catalog — this ship promotes class-stored hoist-at-top to ESTABLISHED via 3rd instance)
- #10444 (Size-ascending chip-pick discipline)
- #10445 (N-driven wire shape — N=1 forces single hoist-at-top)
- #10442 (Hoist gates ABOVE swallow-catches)
- #10432 (KNOWN_UNWIRED ratchet-ledger discipline)
