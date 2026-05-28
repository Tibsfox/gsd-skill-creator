
# v1.49.842 — Lessons

## Promoted to ESTABLISHED in this ship

None. v1.49.842 is a batch chip following the established #10433 + #10427 + #10432 patterns. No new lessons emerge from pattern-application ships.

## New lesson candidates (1; below threshold)

### Re-throw ProcessContextDenied from CLI swallow-catch refinement of #10427

**Observation:** When a CLI surface has a try/catch that absorbs ALL errors into structured output (JSON for the user), the load-bearing-vs-accessory contract from #10427 requires that security denials (`ProcessContextDenied`) propagate while operational errors are absorbed. Implementation: `if (err instanceof ProcessContextDenied) throw err;` as the first line of the catch block.

**Why it matters:** The #10427 rule says "load-bearing fails loudly". A CLI catch that turns ALL errors into JSON output (including authorization failures) defeats the rule — the user gets `{"error": "ProcessContextDenied: ..."}` and the CLI exits with code 1 (operational failure), not a thrown exception that the caller can distinguish from a normal failure. Re-throwing the specific class restores propagation while preserving CLI UX for non-security errors.

**Instances:** 2 — v1.49.820 `src/git/branch-manager.ts` (first CLI surface to apply the pattern) + v1.49.842 `src/cli/commands/terminal.ts` (this ship).

**Forward-test trigger:** any future CLI command with a swallowing try/catch around a spawn that needs to propagate authorization-class failures.

**Promotion path:** Wait for 3rd instance, then codify as a refinement under #10427 (would join "Subscriber-gated observability-only context-hook pattern" #10437 as a similar specific-shape refinement of the parent #10427 contract).

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** REINFORCED. The 3-file wire follows #10427 across 3 distinct catch-shapes:
- session.ts (swallow-everything forensic catch) → hoist outside.
- launcher.ts (no swallowing wrapper) → inline natural placement.
- terminal.ts (CLI catch absorbing for UX) → re-throw ProcessContextDenied.

All three shapes converge on "load-bearing security denial propagates" while preserving each surface's natural failure-mode contract.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** REINFORCED. Process KNOWN_UNWIRED: 21 → 18 (-3 this ship). The ledger continues to asymptote toward zero. Per-ship discipline tracks the count in the engine-state block.

### #10433 — Internal-helper / threaded-options pattern

**Status:** 5th instance. v825 + v827 + v828 + v839 + v842. Sustained ESTABLISHED — no further codification action. The LOC-band-by-callsite-count claim (~14-18 LOC for internal-helper, ~LOC×N for non-helper) continues to hold: this ship's 3 files added 6, 7, and 7 LOC respectively (small files with single spawn calls — the "low end of the band" case).

### #10428 — Meta-cadence

**Status:** NOT EXERCISED. v842 is the 2nd ship of the new operational-debt cluster (v841 + v842). Codify-axis tick was at v840; next codify expected ~v847-850.

### #10434 — Ratchet-ledger pattern

**Status:** REINFORCED. The KNOWN_UNWIRED ledger pattern applied here for the 5th time post-codification (v824).

### #10435 — Cross-rootdir wire pattern

**Status:** NOT EXERCISED. Single-rootdir (src/).

### #10436 — Two-layer closure (file-overwrite drift sub-class)

**Status:** REINFORCED at T14 publish step. The v836 preservation gate fired correctly on this ship's chapter writes (expected 3 PRESERVED log lines per T14 step). Continues to be sticky infrastructure.

### #10437 — Subscriber-gated observability-only context-hook pattern

**Status:** NOT EXERCISED. No subscriber-gated hooks added or modified.

## Tentative observations carried forward (consolidated)

### Eligible for next codify ship (2 deferred from v840)

| Observation | Instances | Notes |
|---|---|---|
| Verification/integration-only ships axis | 2 (v829 + v832) | DEFERRED v840 — no canonical-doc home. |
| Bidirectional enforcement completeness | 1-2 (v838 + v836) | DEFERRED v840 — classification ambiguous. |

### Below threshold (deferred)

| Observation | Source | Notes |
|---|---|---|
| Re-throw ProcessContextDenied from CLI swallow-catch | v820 + v842 (THIS SHIP) | 2 instances; wait for 3rd to disambiguate from "specific case of #10427" vs "new pattern". |
| Recent-vs-baseline-recent comparison pattern | v841 | 1 instance. |
| Drift-check noise as scoring-system feedback loop | v841 | 1 instance. |
| Codify-ship-as-recon-consolidator pattern | v840 | 1 instance. |
| Deferral-by-classification-ambiguity | v840 | 1 instance. |
| Auto-run-on-import as bootstrap-time tax | v836 | 1 instance. |
| Polarity convention for inverted-mechanic thresholds | v837 | 1 instance. |
| DI-executor + hoisted-check refinement of #10433 | v827 | 1 instance. |
| `'spawn'` op-tag at family scale | v828 | 1 instance. |
| Threading config-derived constants through result objects | v830 | 1 instance. |
| Stale-entry cleanup chip pattern | v834 | 1 instance. |
| Scaffold ship pattern | v835 | 1 instance. |
| Paired arc | v834+v835 | 1 instance. |
| Type-registered vs observation-source-wired vs runtime-wired | v835 forward-flag | Operationally clearer at v837. |

## Cadence observation

v842 is the 2nd ship of the new operational-debt cluster:

| Ship | Wall-clock | Scope | KNOWN_UNWIRED Δ |
|---|---|---|---|
| v1.49.841 | ~40 min | Quality-drift recalibration (tooling) | 0 |
| v1.49.842 | ~20 min | Terminal family batch chip (3 wires) | -3 (Process: 21 → 18) |

Expected continuation: ProcessContext mesh family batch chip (v843; 2 entries) → verification/integration-only canonical-doc decision (v844; operator-bounded) → production caller of predict path (v845; substantive feature).
