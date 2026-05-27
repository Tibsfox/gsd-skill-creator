# v1.49.808 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v807).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `adoption-scan.mjs` + `adoption-refresh.mjs` + sample baseline JSON BEFORE writing the trends tool. Recon surfaced the 14-baseline corpus already on disk; informed the lightest-wire shape. |
| #10416 | Tolerant-generator / lightest wire | Resisted runtime call-graph, database backend, and pre-tag-gate `--check`. Chose: consume existing JSON snapshots, emit markdown, expose via npm scripts. |
| #10417 | Static-analysis tools use spawnSync | Tests use spawnSync (per the discipline) so stderr survives non-zero exits; `--check` drift test asserts on stderr content. |
| #10422 | Verdict-pattern surface separation | Observability (the trend report) cleanly separated from decision (per-module wire/allowlist/retire). |
| #10427 | Failure-mode contracts | Tool fails LOUDLY on missing baselines (exit 1 with diagnostic). Silent no-op would mask bootstrap-state-empty case. |

## Tentative observations carried forward (8 — UNCHANGED from v807)

No changes this ship. The S2 closure ship does not add new observation classes; the trend report itself is a tool to surface future observations.

## Cross-references

- #10416 + #10422 → "consume existing data, emit derived artifact, keep decision elsewhere" pattern used this ship
- #10427 → load-bearing-vs-accessory framing — the trends report is observability (accessory); the persistent-shelfware findings are operator inputs (decision lives in operator memory + future ships)

## What this ship illustrates about the audit-retrospective sweep

After v808, the 2026-05-26 audit retrospective is **fully closed**:

| Lever | Type | Shipped at | Wedge |
|---|---|---|---|
| S1 | Codify | v790 (#10417) | Calibration ledger |
| **S2** | **Tooling** | **v808** | **Adoption telemetry trend report** |
| S3 | Codify | v805 (#10428) | Meta-cadence |
| S4 | Codify | v805 (#10429) | Substrate opt-in paths |
| S5 | Tooling | v807 | PROJECT.md + STATE.md gates |
| S6 | Tooling | v806 | Chokepoint extension |
| S7 | Codify | v805 (#10430) | Finer-grained counter-cadence |

19 milestones from audit (v786 audit retrospective drafted; v790 first lever shipped; v808 last lever shipped). Pattern: codify levers shipped first in batches (v805); tooling levers shipped individually as judgment was made on each (v806 → v807 → v808). The next codify-cadence audit is overdue per #10428's ~7-10-ship spacing — the natural slot is after the NASA 1.179 forward-cadence sweep or after the chain's remaining 2 ships (KNOWN_UNWIRED chip + T1.3 recon).
