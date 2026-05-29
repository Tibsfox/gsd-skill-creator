# v1.49.884 — Context

## Provenance

First of the v884-v886 "alternatives" sub-campaign. Operator selected at session start (via 4-option AskUserQuestion): `Bounded → LoaderCtx → Counter`, with rationale "smallest-first builds momentum, counter-cadence last captures accumulated debt." Each alternative is its own milestone; v884 picks the smallest (bounded-learning verify-axis chip).

The v883 handoff named 4 forward-path options. The operator skipped the default NASA forward-cadence (option 1) in favor of the three engineering alternatives (options 2-4), in the order Bounded → LoaderCtx → Counter.

Within v884's bounded-learning scope: the v883 handoff implied a single ship closing both UNWIRED thresholds. Reading the existing wire patterns (`predictive-low-confidence-events.ts` at v837/v845/v846; `token-budget-events.ts` at v798/v803) revealed that each threshold's "full triple" per #10439 spans observation-source registration → CLI manual recorder → substrate auto-recorder, and each step can be its own ship. v884 lands the first two steps for ONE threshold (`observation.retention_days`); `token_budget.max_percent` and the substrate auto-emit half remain forward-cadence work.

## Predecessor

- **v1.49.883** — Codify ship: Promote 5 refinements from v868-v882 campaign. Doc-only. 5 new ESTABLISHED lessons (#10445, #10446, #10447, #10448, #10449). Track 5 wire-shape table appended to #10448. Engine state UNCHANGED. NASA degree 1.178 (101 consecutive ships at margin record).
- **v1.49.882** — Verify-overdue forecast scan tool (campaign CLOSE; v868-v882 campaign delivered). The v882 scan output was the v884 mission's starting input ("UNWIRED: 2 thresholds").
- **v1.49.881 and earlier** — see prior release-notes.

## Disciplines this ship updates

- **None codified this ship.** The work applies existing established lessons (#10425, #10426, #10427, #10439) without producing new candidates.
- **`tools/calibratable/verify-overdue-scan.mjs` notes field** — `observation.retention_days` notes updated to record the v884 read-side wire ship (text-only; status field unchanged because substrate auto-emit hasn't shipped). The integration_test_ship null state is honest: no integration test exists yet.

## Cross-references to related disciplines

- **Bounded-learning calibration discipline** (#10425) — applied. The two-sided-vs-one-sided e-process resolution stands; new module reuses the existing construction.
- **Meta-cadence** (#10428, #10438, #10439) — applied. Calibrate-axis investment. Mirrors v837's read-side-only staging.
- **Failure-mode contracts** (#10427) — applied. Best-effort silent appends, catch-at-CLI-boundary pattern.
- **Architecture-retrofit patterns** (#10426) — applied. Per-class registry pattern, second-instance abstraction extraction. observation.* class slots in alongside existing classes.

## Forward path

Per the v883 handoff's option ordering (operator-selected):

1. **v885: LoaderContext chip-down opening (NEXT)** — the third Tier-E chokepoint surface. The v868-v882 wire-shape catalog (#10444 / #10445 / #10447 / #10448) is the playbook. Opens KNOWN_UNWIRED ledger. Multi-ship campaign opener.
2. **v886: Counter-cadence cleanup-mission** — last counter-cadence at v838; overdue per #10168 / #10169. Will absorb anything that surfaces during v885 + carry-forwards from v883's enumeration.

**Deferred from v884 (substrate-side):**

- Substrate auto-emit for `observation.retention_days` — requires a retention-sweep substrate consumer to exist first. Currently no production code reads `observation.retention_days` and acts on it.
- Substrate auto-emit + observation-source wire for `token_budget.max_percent` — similar gap (no production check exists). The design also raises a "shared JSONL vs separate JSONL" question with `warn_at_percent` events.
- Integration test for the `observation.retention_days` end-to-end wire — within 10 ships of substrate auto-emit ship per #10428 / #10438 verify-axis trigger.

**Engine-state observations for next handoff:**

- NASA degree pressure-margin record extended to **102 consecutive ships** at 1.178. Six more ships at this degree puts the record at 108 — every additional ship makes the eventual degree advance more strategically expensive.
- Lessons in manifest still 90. The next codify ship will land when 5+ ESTABLISHED candidates have accumulated; v884 added zero candidates so the codify pressure is unchanged from v883.
