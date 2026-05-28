
# v1.49.841 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.841 is a single-file tooling fix without lesson promotion. The 2 forward-observations from this ship sit at 1 instance each — below the 2-instance threshold per #10426.

## New lesson candidates (2; below threshold)

### Recent-vs-baseline-recent comparison pattern

**Observation:** The drift-check convention is to capture baseline state once and compare current state against it indefinitely. v841 changes this for the `recent_drift_<type>` alert: the baseline snapshots the recent-N average AT calibration time, and current recent-N is compared against THAT snapshot rather than against historical-all-time. The semantic shifts from "is current different from baseline" to "did things get worse since calibration".

**Why it matters:** When the underlying state distribution shifts (e.g. operational cadence changes from NASA-degree-heavy to chip-heavy), the conventional comparison fires alerts on the shift itself — not on actual regression. The recent-vs-baseline-recent comparison reframes drift detection as regression detection.

**Instances:** 1 (v1.49.841 `quality-drift-check.mjs`).

**Forward-test trigger:** any other tooling surface where "compare current to baseline" produces alerts on cadence-shift rather than regression. Examples: error-rate dashboards, latency percentile tracking, test-flake-count tracking — all of these could exhibit the same false-positive shape.

**Promotion path:** if a second tool adopts the recent-vs-baseline-recent pattern (or if a future v841-style retrospective recognizes the false-positive shape in another check), promote to ESTABLISHED in a future codify ship.

### Drift-check noise as scoring-system feedback loop

**Observation:** A false-positive alert that fires on every refresh trains the operator to ignore alerts. v841 closed one specific source (drift-check firing on cadence-shift) but the meta-pattern is broader: any informational signal that fires more than ~50% of refreshes without operator action is structurally noise, and operators will tune it out.

**Why it matters:** The drift-watcher's purpose is to surface anomalies. A noisy watcher defeats its own purpose — even genuine signals are missed because the operator has learned that alerts mean nothing. v841 is a closure of one specific instance; the broader pattern would prescribe "audit any tool whose alerts fire on every refresh".

**Instances:** 1 (v1.49.841 quality-drift-check.mjs).

**Forward-test trigger:** any other tool whose alerts fire on >50% of refreshes; a future operator complaint about "checking N alerts but they're all the same as last time".

**Promotion path:** if a second high-noise-watcher case surfaces, promote to ESTABLISHED. Consider unifying under "observability surface signal-to-noise contract" (#10427 sibling).

## Forward-test of existing lessons

### #10427 — Failure-mode contracts (accessory surfaces fail silently; load-bearing surfaces fail loudly)

**Status:** REINFORCED. The drift-check itself is an accessory surface (forensic observability — operator decisions don't depend on its output). The v841 fix maintains the failure-mode contract: drift-check still emits warnings + exits 0 with `--warn-only`; never throws into the caller. The recent-vs-baseline-recent change is internal to its observability discipline, not a contract change.

### #10428 — Meta-cadence

**Status:** NOT EXERCISED. v841 is the first ship of a new operational-debt cluster; no codify-cadence tick. Forward-cadence axis remains at 58 ships past last NASA degree (1.178 sustained). Codify axis fired at v840; next codify expected ~v847-850.

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED. v841 doesn't touch any chokepoint (ProcessContext / EgressContext / LoaderContext call sites untouched).

### #10434 — Ratchet-ledger pattern

**Status:** NOT EXERCISED. v841 doesn't move any KNOWN_UNWIRED count.

### #10435 — Cross-rootdir wire pattern

**Status:** NOT EXERCISED. v841 is single-rootdir (tools/).

### #10436 — Two-layer closure (file-overwrite drift sub-class)

**Status:** NOT EXERCISED. v841 closes a calibration-drift class, not a file-overwrite drift class. Different shape.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED. v841 doesn't add or modify subscriber-gated hooks.

## Tentative observations carried forward (unchanged from v840)

### Eligible for next codify ship (2 deferred)

| Observation | Instances | Notes |
|---|---|---|
| Verification/integration-only ships axis | 2 (v829 + v832) | DEFERRED v840 — no canonical-doc home. Eligible for next codify when 3rd instance arrives OR operator decides canonical-doc location. |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. Wait for 3rd instance to disambiguate. |

### Below threshold (deferred; 1 instance each)

| Observation | Source | Notes |
|---|---|---|
| Recent-vs-baseline-recent comparison pattern | v841 (THIS SHIP) | Wait for 2nd. |
| Drift-check noise as scoring-system feedback loop | v841 (THIS SHIP) | Wait for 2nd. |
| Codify-ship-as-recon-consolidator pattern | v840 | Wait for 2nd. |
| Deferral-by-classification-ambiguity | v840 | Wait for 2nd. |
| Auto-run-on-import as bootstrap-time tax | v836 | Wait for 2nd. |
| Polarity convention for inverted-mechanic thresholds | v837 | Wait for 2nd. |
| DI-executor + hoisted-check refinement of #10433 | v827 | Wait for 2nd. |
| `'spawn'` op-tag at family scale | v828 | Wait for 2nd. |
| Threading config-derived constants through result objects | v830 | Wait for 2nd. |
| Stale-entry cleanup chip pattern | v834 | Wait for 2nd. |
| Scaffold ship pattern | v835 | Wait for 2nd. |
| Paired arc | v834+v835 | Wait for 2nd. |
| Type-registered vs observation-source-wired vs runtime-wired | v835 forward-flag | Operationally clearer at v837 close. |

## Cadence observation

v841 is the first ship of a new operational-debt cluster:

| Ship | Wall-clock | Lessons promoted | Forward-flags closed |
|---|---|---|---|
| v1.49.840 | ~55 min | #10436 + #10437 | (cluster close — emitted 1 forward-flag for drift-check) |
| **v1.49.841** | ~40 min | 0 | drift-check calibration (closes v840 forward-flag) |

The cluster shape so far: 1 codify ship (v840) → 1 follow-up forward-flag closure (v841). The v840 forward-flag-to-fix latency of 1 ship is the fastest in recent operational-debt history.

Expected continuation per next-session candidates list: ProcessContext terminal family batch chip (v842) → ProcessContext mesh family batch chip (v843) → verification/integration-only canonical-doc decision → production caller of predict path.
