# v1.49.589 — Engine State Tables

## NASA degree advancement

| Field | Value |
|---|---|
| NASA degree | 70 / 360 (19.4% complete) |
| Mission | Apollo 6 (AS-502) |
| NSSDC ID | 1968-025A |
| Launch date / time | 1968-04-04 12:00:01 UTC |
| Launch vehicle | Saturn V SA-502 (second Saturn V flight) |
| Launch pad | KSC LC-39A |
| Spacecraft | CSM-020 (CM-020 + SM-014); LTA-2R |
| Mission duration | ~9h57m20s |
| Mission outcome | Partial success / not declared man-rated |
| Recovery | USS Okinawa (LPH-3), Pacific Ocean |

## §6.6 register state

| Thread | Status | Exemplars | Latest |
|---|---|---|---|
| UNMANNED-PRECURSOR-VALIDATION (UPV) | reproducibly-stable | **2** (Apollo 5 v1.69 + Apollo 6 v1.70) | v1.70 (this milestone) |
| ALL-UP COMMITMENT | single-exemplar; 2-ex candidate at v1.72 | 1 (v1.62 Surveyor 5; or Apollo 4 v1.NN) | — |
| LIFT-AND-RESET | single-exemplar | 1 | — |
| SCIENCE-MAXIMIZED FINAL-OF-SERIES | single-exemplar | 1 (v1.68 Surveyor 7) | — |
| CATALOG-WINDOW-OPENING | single-exemplar | 1 (v1.67 OAO-2) | — |
| GRACEFUL-ATTRITION | single-exemplar | 1 (v1.66) | — |
| FORM-AS-MULTIPLICITY-COORDINATION | single-exemplar | 1 | — |
| PERSISTENT-CONSTELLATION-LISTENER | 2-exemplar | 2 | — |
| ALPHA-SCATTERING | CLOSED at 3-ex | 3 (closed v1.68) | — |
| SUCCESS-AFTER-FAILURE | CLOSED at 3-ex | 3 (closed v1.64) | — |

Total active threads: 9 (was 8 at v1.49.588 register; UPV promotes from candidate to reproducibly-stable).
Total closed threads: 2 (unchanged).
Total exemplar count: 13 (1 promotion: UPV 1-ex → 2-ex; PSP absorbed as sub-pattern, not standalone).

## PSP sub-pattern observation under UPV

Documented in UPV thread description:
> *Sub-pattern observation:* precursor missions may proceed to full operational use without complete validation when schedule + risk-tolerance permits. Apollo 6 → Apollo 8 illustrates this: Apollo 6 was partial-success / not man-rated, but Apollo 8 (the next Saturn V flight, 8.5 months later) was first-crewed-Saturn-V flying directly to lunar orbit. The risk-acceptance decision was made by NASA leadership August-November 1968 driven by Kennedy "before this decade is out" schedule pressure. Modern man-rating discipline would not allow this; PSP is therefore an Apollo-era cultural artifact that may not generalize forward.

## MUS Pass-2 register

| Domain | Slot | Status | Latest |
|---|---|---|---|
| Domain 1 (Genre) | 5/6 | unchanged | — |
| Domain 2 (Instrumentation) | 4/6 | unchanged | — |
| Domain 3 (Vocal-arrangement) | 6/5 over-target | unchanged | v1.68 |
| Domain 4 (Rhythmic structure) | 5/6 | unchanged | — |
| Domain 5 (Harmony) | 6/5 over-target | unchanged | v1.69 |
| Domain 6 (Timbre) | 4/6 | unchanged | — |
| Domain 7 (Lyric-thematic) | 6/5 over-target | unchanged | v1.67 |
| Domain 8 (Cultural-context) | 5/6 | unchanged | — |
| Domain 9 (Production-arrangement) | **N/M → N+1/M advance** | **advanced this milestone** | **v1.70 (Bookends Halee varispeed + cassette-recording integration)** |

Three Pass-2 over-target axes (Domain 3 v1.68, Domain 7 v1.67, Domain 5 v1.69) — Pass-2 is roughly half-complete with all but Domain 9 + 1 other below over-target.

## ELC Pass-2 register

| Domain | Slot | Status | Latest |
|---|---|---|---|
| Domain 1 (Power conversion) | CLOSED 5/5 | closed v1.67 | — |
| Domain 2 (Communications) | CLOSED 5/5 | closed v1.68 | — |
| Domain 3 (Digital memory) | TBD | — | — |
| Domain 4 (Noise / Signal-conditioning) | **4/6 → 5/6 advance** | **advanced this milestone** | **v1.70 (S-IC pogo accelerometer chain)** |
| Domain 5 (Power semiconductors) | TBD | — | — |
| Domain 6 (Redundancy / voting) | TBD | — | — |
| Domain 12 (Radiation hardening) | CLOSED 5/5 | closed v1.69 | — |

Three Pass-1 closed domains (D1 v1.67, D2 v1.68, D12 v1.69). Pass-2 Domain 4 advancing to 5/6 leaves one slot for closure at a future milestone.

## CHAIN-CONVENTIONS

| Field | Value |
|---|---|
| Schema version | v1.4 (no bump at v1.70) |
| Total full-uses | 11 (eleventh full-use at this milestone) |
| Schema fields stable | yes (v1.4 since v1.49.585) |

## simulation.js block

| Block | Subject | Location | Aggregator merge |
|---|---|---|---|
| #69 | Apollo 5 fire-in-the-hole | `forest-module/apollo-5-fire-in-the-hole.js` | deferred |
| **#70** | **Apollo 6 pogo** | **`forest-module/apollo-6-pogo.js`** | deferred |

Aggregator merge of v1.64-v1.70 canonical blocks remains deferred per pattern; counter-cadence cleanup at ~v1.49.615.

## Three-track-plus-TRS pattern progression

| # | Milestone | Pattern instance |
|---|---|---|
| 1 | v1.49.587 | Mariner 6/7 + TRS M0 Wave 0 |
| 2 | v1.49.588 | Apollo 5 + TRS M0 Wave 1a |
| **3** | **v1.49.589** | **Apollo 6 + TRS M0 Wave 1b (partial)** |

Pattern stability is now its own structural marker. Forward continuation expected at v1.49.590+ (Apollo 7 + TRS Wave 1b retry + Wave 1c).

## NASA CSV state

| Field | Value |
|---|---|
| Row count | 450 (stable since v1.49.587 Path Y reconciliation) |
| Apollo 6 row | 1.70 |
| Strict version=chronology | maintained 1.69-1.71 |
| Next milestone row | 1.71 = Apollo 7 (1968-10-11) |
| Forward-cadence count | 9 (was 8 at v1.49.588) |

## Pre-tag-gate state

| Step | Check | Status at v1.49.589 |
|---|---|---|
| 1 | npm run build | PASS |
| 2 | npx vitest run | PASS (28,810 tests) |
| 3 | release-notes completeness gate | PASS |
| 4 | CI-on-dev verification | PASS |
| 5 | www-bundles freshness | PASS |
| **6** | **depth-audit (WARNING-only)** | **NEW — added this milestone; soaks 2 milestones then hardens to BLOCKER** |

## Test count delta

| Wave | Tests added | Cumulative |
|---|---|---|
| v1.49.588 baseline | — | 28,767 |
| T2.1 scorer (12 assertions) | +12 | 28,779 |
| T2.2 bump-version (7 assertions) | +7 | 28,786 |
| T2.3 depth-audit (8 assertions) | +8 | 28,794 |
| T2.4 incremental-Edit (no test, doc-only) | +0 | 28,794 |
| Implicit (W2 build correctness) | +16 | **28,810** |

(Note: T2.x tests are forward-ready under `vitest.tools.config.mjs`; not yet in the root-project `npm test` glob. Will fold into root-project at a future milestone via vitest workspace expansion.)

## Build artifact totals

| Track | Files | Total bytes |
|---|---|---|
| NASA 1.70 | 25 | ~440 KB |
| MUS 1.70 | 14 | ~70-87 KB |
| ELC 1.70 | 10 | ~70-82 KB |
| **Total v1.70 build** | **49** | **~600 KB** |

(All build artifacts under `www/tibsfox/com/Research/{NASA,MUS,ELC}/1.70/` — gitignored; live on tibsfox.com via FTP post-ship.)
