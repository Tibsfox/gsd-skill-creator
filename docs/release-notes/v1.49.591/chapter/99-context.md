# v1.49.591 — Engine State Tables (Context)

## Branch state at ship

| Surface | Value |
|---|---|
| Branch | `dev` (HARD RULE) |
| Predecessor close commit (dev) | `52250bae1` (v1.49.590 RH refresh initial) |
| Predecessor final tip (dev) | `e9fb0f1f0` (FTP verify probe = v1.49.591 W0 prep) |
| Predecessor main merge | `0e3fa0396` (v1.49.590 final main tip) |
| v1.49.591 opening commit (dev) | `e9fb0f1f0` (= main + 1) |
| v1.49.591 ship commit (dev) | (filled at ship time) |

## §6.6 register at v1.49.591 close

15 exemplars total (Δ +1 vs v1.49.590).

| Thread | State at v1.71 close | State at v1.72 close | Δ |
|---|---|---|---|
| ALL-UP COMMITMENT | 1-exemplar (Apollo 4 v1.64) | **2-exemplar reproducibly-stable** (Apollo 4 + Apollo 8) | +1 advance |
| POST-FIRE-PROGRAM-RECOVERY | 1-exemplar origination (Apollo 7 v1.71) | 1-exemplar (carries forward; Apollo 8 not a recovery flight) | 0 |
| UNMANNED-PRECURSOR-VALIDATION | 2-exemplar reproducibly-stable | 2-exemplar (outcome-validated: Apollo 8 benefited from Apollo 6 fixes; no exemplar advance) | 0 |
| PERSISTENT-CONSTELLATION-LISTENER | 2-exemplar reproducibly-stable | 2-exemplar (carries forward) | 0 |
| FORM-AS-MULTIPLICITY-COORDINATION | 1-exemplar | 1-exemplar (carries forward) | 0 |
| SCIENCE-MAXIMIZED FINAL-OF-SERIES | 1-exemplar (v1.68) | 1-exemplar (carries forward) | 0 |
| CATALOG-WINDOW-OPENING | 1-exemplar (v1.67) | 1-exemplar (carries forward) | 0 |
| GRACEFUL-ATTRITION | 1-exemplar (v1.66) | 1-exemplar (carries forward) | 0 |
| LIFT-AND-RESET | 1-exemplar (v1.63) | 1-exemplar (carries forward) | 0 |

Watchlist 3rd-exemplar candidates:
- **ALL-UP COMMITMENT 3rd-ex:** STS-1 Columbia (1981 first Space Shuttle); Crew Dragon Demo-2 (2020 commercial); failure-case anchor: Soyuz 1 (1967)
- **POST-FIRE-PROGRAM-RECOVERY 2nd-ex:** STS-26 Discovery (1988 post-Challenger) ETA ~v1.49.620+; STS-114 (2005 post-Columbia); Soyuz 12 (1973 post-Soyuz-11)

## MUS Pass-2 domain register

| Domain | State at v1.71 close | State at v1.72 close | Δ |
|---|---|---|---|
| 9 (Extended Form / Double Album) | **origination 1-exemplar** (Electric Ladyland depth-axis) | **reproducibly-stable 2-exemplar** (depth-axis + breadth-axis White Album) | +1 advance |
| 5 (Harmony) | over-target 6/5 | (carries forward) | 0 |
| 3 (Genre & lineage) | over-target | (carries forward) | 0 |
| 7 (Lyrical narrative) | (n/a at v1.71) | over-target via v1.70 | 0 |

## ELC Pass-2 domain register

| Domain | State at v1.71 close | State at v1.72 close | Δ |
|---|---|---|---|
| 12 (IC Qualification) | reproducibly-stable 2-ex (Block I + Block II AGC) | (carries forward; no new exemplar at v1.72) | 0 |
| 15 (Propulsion Control Sequencing / Engine Restart Systems) | (not yet originated) | **origination 1-exemplar** (S-IVB J-2 restart sequencer) | +1 origination |
| 5 (Stability & feedback) | n/a | n/a | 0 |
| 4 (pogo accelerometer thread; v1.70) | open sub-thread | **closed by v1.72 ELC vindication narrative** | 0 (sub-thread closes; not exemplar count change) |

## TRS M0 register

| Wave | State at v1.71 close | State at v1.72 close | Δ |
|---|---|---|---|
| Wave 0 (extract) | COMPLETE | COMPLETE | 0 |
| Wave 1a (packs 01-04) | COMPLETE | COMPLETE | 0 |
| Wave 1b (packs 05-08) | partial (pack-08 only at v1.49.589 ship) | COMPLETE post-v1.49.590 retry | 0 (carryover) |
| Wave 1c (packs 09-12) | n/a | COMPLETE post-v1.49.590 retry | 0 (carryover) |
| Wave 1d (packs 13-16) | n/a | **COMPLETE this milestone** (info-theory + signal-processing + probability-statistics + standard-model) | +20 records |
| Wave 1e (packs 17-22) | n/a | NOT YET DISPATCHED (v1.49.592+) | 0 |
| Wave 2 (synthesis) | n/a | NOT YET STARTED (v1.49.593+) | 0 |
| master.json record count | 240 (post-Wave-1c retry) | **260** (+10 Batch A pack-13/14 + +10 Batch B pack-15/16) | +20 |

## Catalog-index drift backfill (T2.4)

| Catalog | State at v1.71 close | State at v1.72 close | Δ |
|---|---|---|---|
| `www/tibsfox/com/Research/NASA/index.html` `completedMissions` Set | last entry 1.69 (drift 2 milestones) | **1.70/1.71/1.72 added** | -2 milestones drift |
| `www/tibsfox/com/Research/MUS/index.html` degree cards | last card 1.69 (drift 2 milestones) | **1.70/1.71/1.72 cards added** | -2 milestones drift |
| `www/tibsfox/com/Research/ELC/index.html` degree cards | last card 1.69 (drift 2 milestones) | **1.70/1.71/1.72 cards added** | -2 milestones drift |

## Pre-tag-gate v6 step state

| Step | Type | v1.49.591 status | Lesson |
|---|---|---|---|
| 1: npm run build | BLOCKER | PASS expected | — |
| 2: npx vitest run | BLOCKER | PASS expected | — |
| 3: check-completeness --strict | BLOCKER | PASS expected (5 files authored at W4) | — |
| 4: CI-on-dev verification | BLOCKER (HARD RULE) | PASS expected | #10176 |
| 5: www-bundles freshness | BLOCKER | PASS expected | v1.49.587 unwired-build closure |
| 6: depth-audit | **BLOCKER (hardened at v1.49.591)** | NASA WARN (88% bytes) PASS-overall + MUS PASS + ELC PASS = 0 FAIL | T2.2 / #10188 |

## NASA CSV state

Stable post-Path-Y reconciliation (v1.49.587). 450 rows. Apollo 8 at row 1.72. Strict version=chronology continues 1.69-1.72.

## Build-artifact summary

| Track | File count | Total bytes | Depth-audit verdict |
|---|---|---|---|
| NASA 1.72 | 17 files | ~108 KB | WARN (NASA bytes 88%; lines 99%; 7/7 canonical sections) |
| MUS 1.72 | 10 files | ~75 KB | PASS (110% lines / 122% bytes / 15/10 sections) |
| ELC 1.72 | 10 files | ~64 KB | PASS (116% lines / 100% bytes / 16/10 sections) |
| **Total** | **37 files** | **~247 KB** | **PASS=2 / WARN=1 / FAIL=0** |

## Forward to v1.49.592 (Apollo 9 — first-crewed LM Earth-orbit shakedown)

- NASA 1.73 = Apollo 9 (1969-03-03 launch); first-crewed LM ("Spider"); 10 days; first separation/rejoin; first crewed lunar-spacesuit EVA
- §6.6 thread classification candidate: UPV outcome-validation (Apollo 5 LM-1 v1.69 + Apollo 9 first-crewed-LM = full UPV thread closure)
- TRS M0 Wave 1e dispatch (packs 17-22; ~225K Sonnet aggregate; 6 packs in 3 batches with #10200 ≥10-min spacing)
- Operational-debt fold-in candidates: #10203 source-of-truth canonical-section regex propagation (W2-NASA prompt template update); #10204 NASA bytes WARN moving-baseline analysis
