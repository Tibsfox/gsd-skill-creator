# 99 — Context: v1.49.587 Engine State

## Milestone identity

| Field | Value |
|---|---|
| Version | v1.49.587 |
| Released | 2026-04-29 |
| Type | combined three-track ship (NASA forward quartet + ship-pipeline hardening + TRS Track 3 NEW) |
| NASA degree | 68 |
| NASA mission code | SURVEYOR-7 |
| NASA mission name | Surveyor 7 |
| S36/MUS release | 065 (Aretha Franklin *Lady Soul*) |
| SPS release | 065 (Northern Spotted Owl) — captured in NASA + MUS organism + sidebar pages; standalone SPS dir deferred to backlog (v1.49.586 carry-forward open item) |
| ELC release | 068 (Domain 2 closure) |
| §6.6 thread origin (NEW) | SCIENCE-MAXIMIZED FINAL-OF-SERIES (single-exemplar status) |
| §6.6 thread CLOSED | ALPHA-SCATTERING (3-exemplar; Surveyor 5/6/7) |
| Era CLOSED | lunar-soft-lander (Surveyors 1-7, 1966-1968) |
| Predecessor | v1.49.586 (OAO-2 Stargazer / Mudhoney / Trumpeter Swan / CATALOG-WINDOW-OPENING) |

## Engine state (NASA series)

| Track | At v1.49.586 close | At v1.49.587 close | Change |
|---|---|---|---|
| **Degree** | 67 of 360 | **68 of 360** | +1 forward |
| **Percent complete** | 18.6% | **18.9%** | +0.3% |
| **Pass** | 2 | 2 | UNCHANGED |
| **Hard-gated forward count** | 8 | **9** | +1 |
| **§6.6 register exemplars** | 11 | **12** | +1 (SMFS origin); ALPHA-SCATTERING moves to closed list (3-ex) |
| **§6.6 candidate variants** | 5 | **6** | +1 (SMFS); -0 (ALPHA-SCATTERING moves to closed) |
| **CHAIN-CONVENTIONS version** | v1.4 (eighth full use) | v1.4 (**ninth full use**) | UNCHANGED (no bump) |
| **MUS Pass-1 state** | COMPLETE (closed at v1.66) | COMPLETE | UNCHANGED |
| **MUS Pass-2 state** | first over-target (Domain 7 v1.67) | **second over-target advance** (Domain 3 v1.68 Lady Soul) | +1 |
| **ELC Pass-1 Domain 2** | 3/4 | **4/4 CLOSED** | +1 closure |
| **ELC era (current open)** | op-amp 1-exemplar (v1.67 OAO-2 WEP) | **op-amp 2-exemplar** (v1.68 Surveyor alpha-scattering CSP) | +1 |
| **simulation.js block count** | 69 | **#68 added** (canonical block; aggregator merge deferred) | +1 |
| **Three-track forward-cadence count** | 6 | **7** | +1 |
| **Three-track-plus-TRS forward-cadence count** | 0 | **1** | NEW pattern |
| **NASA CSV row count** | 449 (with 1.66/1.67 divergence) | **450** (Path Y reconciled) | +1 (OAO-2 inserted) |

## §6.6 thread state at v1.49.587 close

| Thread | Status | Exemplars | Archive threshold |
|---|---|---|---|
| **SCIENCE-MAXIMIZED FINAL-OF-SERIES (NEW)** | single-exemplar origin candidate (v1.68 OPENS) | 1 (Surveyor 7 + Lady Soul + Forsman 1984 triad) | ~v1.88 |
| **ALPHA-SCATTERING (CLOSED)** | 3-exemplar CLOSED at v1.68 | 3 (Surveyor 5 v1.62 + Surveyor 6 v1.63 + Surveyor 7 v1.68) | promoted to v1.5 §6.4 sub-form at next v1.5 cut |
| CATALOG-WINDOW-OPENING | single-exemplar carry-forward (v1.67 OAO-2; not advanced at v1.68 — Surveyor 7 is qualification-spend, not band-opening) | 1 | ~v1.87 |
| GRACEFUL-ATTRITION | single-exemplar carry-forward (v1.66 Pioneer 9; not advanced) | 1 | ~v1.86 |
| PERSISTENT-CONSTELLATION-LISTENER | 2-exemplar carry-forward (v1.65 Pioneer 8 + v1.66 Pioneer 9; not advanced) | 2 | ~v1.86 |
| FORM-AS-MULTIPLICITY-COORDINATION | single-exemplar carry-forward (v1.66 Pioneer constellation + Adams + Olympic Marmot triad; not advanced) | 1 | ~v1.86 |
| ALL-UP COMMITMENT | single-exemplar carry-forward (v1.64); 2nd-ex candidate at v1.72 Apollo 8 (per Path Y CSV) | 1 | ~v1.80 |
| LIFT-AND-RESET | single-exemplar carry-forward (v1.63) | 1 | ~v1.79 |
| SUCCESS-AFTER-FAILURE | CLOSED at 3-exemplar (v1.62/63/64) | 3 (CLOSED) | promoted to v1.5 §6.4 sub-form |
| PRINCIPLE-TRINITY | reproducibly-stable | 3 | (stable) |
| CHANNEL-PARALLELISM | reproducibly-stable | 3 | (stable) |

**Total: 12 exemplars across 2 reproducibly-stable + 6 candidate variants + 2 closed-at-3-exemplar.**

## Build artifacts at v1.49.587 close

| Track | Files | Total Size | Largest file |
|---|---|---|---|
| NASA 1.68 | 25 | ~368KB | index.html (~55KB) |
| MUS 1.68 | 14 | ~155KB | research.md (~40KB) + index.html (~32KB) |
| ELC 1.68 | 10 | ~175KB | index.html (~42KB) + research.md (~35KB) |
| **Track 1 + 2 build total** | **49** | **~698KB** | |
| Track 3 TRS topic-map.json | 1 | 92KB | (164 claims; gitignored at .planning/) |

## Track 2 — ship-pipeline hardening (DONE)

| Component | Surface | Commit |
|---|---|---|
| `tools/build-www-bundles.sh` | esbuild SPICE renderer (TS → ESM bundle) | 28cd2007a |
| `npm run build:www-bundles` | npm wiring | 28cd2007a |
| `tools/pre-tag-gate.sh` step 5 | invokes build-www-bundles | 28cd2007a |
| `tools/pre-tag-gate.sh` step 4 | CI-on-dev verification (HARD RULE) | 28cd2007a |
| Override env `SC_SKIP_CI_GATE=1` | emergency only | 28cd2007a |
| `tools/pre-tag-gate.test.sh` | 10/10 self-tests PASS | 28cd2007a |
| CLAUDE.md operational gates table | step 4+5 documentation | 28cd2007a |
| CLAUDE.md env-vars table | SC_SKIP_CI_GATE + BUILD_WWW_BUNDLES_QUIET | 28cd2007a |
| `tools/nasa-csv-path-y-reconciliation.py` | idempotent atomic CSV renumber | 40520d97f |
| Pre-tag-gate exit codes | 0 (PASS) / 1 (build) / 2 (vitest) / 3 (completeness) / 4 (CI-on-dev) / 5 (www-bundles) | 28cd2007a |

## Track 3 — TRS M0 Wave 0 (DONE)

| Component | Status |
|---|---|
| TRS-EXECUTION-MAP.md | authored at G0; aligns 6-mission program to v1.49.587-v1.49.620+ |
| topic-map.json claim count | 164 (target ~200-500; below middle but acceptable) |
| Pack coverage | 21/22 (pack-19 formal-languages/L-systems empty; genuine-coverage gap) |
| Chapter coverage | 33/33 |
| Category coverage | 6/8 (numerical, attribution, historical, music-theory, physics-constants, definitions; citation + code-listing absent) |
| File path | `.planning/missions/the-rendered-space/m0-research/work/extract/topic-map.json` |
| File size | 91.9 KB |
| Schema deviations | added `subsection`, `page_in_v1_pdf`, `claim_normalized`, `evidence_source_ids`, `search_status`, `notes` + metadata header (accepted as feature) |

## Brief errors caught at G0 gate (5 corrections via W1a research subagent)

Per Lesson #10178 discipline (carryover from v1.49.586). All 5 corrections sourced canonically through G0-LOCKED-DECISIONS into all 35+ build artifacts:

| ID | Severity | Original | Corrected |
|---|---|---|---|
| BE-1 | HIGH | Cm-244 alpha source | **Cm-242** (163d t½, 6.11 MeV) |
| BE-2 | HIGH | "surface sampler 2nd deployment after S3 + S6" | **2nd deployment after S3 ONLY** (S6 carried alpha-scattering + TV camera, no sampler) |
| BE-3 | HIGH | "Turkevich 1969 *Science* 165:277" (does not exist) | **Turkevich et al. 1968 *Science* 162:117** (preliminary) + **Patterson, Turkevich et al. 1970 *Science* 168:825-828** (final) |
| BE-4 | MED | "21,038 photos" (cited as fact) | **21,038 with V-flag** (variants 21,274 NASA Science page, 21,091 Wikipedia) |
| BE-5 | LOW | landing coords 40.86°S 11.47°W | **40.97°S 11.44°W** (NASA Science page; ~7 km correction) |

## NASA CSV reconciliation (Path Y) — applied 2026-04-29

| Old | New | Mission |
|---|---|---|
| 1.66 = SURVEYOR-7 | **1.66 = PIONEER-9** (matches shipped v1.49.583) | Pioneer 9 |
| 1.67 = APOLLO-5 | **1.67 = OAO-2 STARGAZER** (matches shipped v1.49.586; new row inserted) | OAO-2 Stargazer |
| 1.68 = APOLLO-6 | **1.68 = SURVEYOR-7** (this milestone — chronological-backfill) | Surveyor 7 |
| 1.69 = APOLLO-7 | **1.69 = APOLLO-5** (next milestone candidate) | Apollo 5 |
| 1.70 = PIONEER-9 | **1.70 = APOLLO-6** | Apollo 6 |
| 1.71 = APOLLO-8 | **1.71 = APOLLO-7** | Apollo 7 |
| (old 1.71+ shifts +1) | **1.72 = APOLLO-8** | Apollo 8 (chronologically Dec-1968, sits AFTER OAO-2 Dec-1968 by 14 days) |
| (old 1.72+ shifts +1) | 1.73 = APOLLO-9, 1.74 = APOLLO-10, ... | (continues) |

Strict version=chronology resumes from 1.72 forward; one-time inversion at 1.66/1.67 documented.

## Verification at v1.49.587 close

- **pre-tag-gate**: 5/5 PASS — build + vitest + completeness --strict + CI-on-dev verified at origin/dev tip + www-bundles esbuild
- **release-notes 5-file structure**: README + chapter/{00-summary, 03-retrospective, 04-lessons, 99-context}.md all present
- **NASA `completedMissions` Set**: extended through 1.68
- **ELC + MUS catalog grids**: 1.68 cards added
- **Cross-track URL verification**: bidirectional NASA ↔ MUS ↔ ELC ↔ SPS links live across all 6 build artifacts
- **W1a brief-error correction discipline**: 5/5 corrections applied across 35+ artifacts; zero propagation detected
- **NASA CSV row count**: 449 → 450 (+1 OAO-2 insertion); idempotent script verified post-state

---
*v1.49.587 closes the lunar-soft-lander era; advances op-amp era to 2-exemplar; closes ELC Pass-1 Domain 2; closes ALPHA-SCATTERING §6.6 thread at 3-exemplar; opens SCIENCE-MAXIMIZED FINAL-OF-SERIES §6.6 thread at single-exemplar; opens The Rendered Space TRS Track 3 (M0 Wave 0). v1.49.588+ continues with Path Y CSV: Apollo 5 at 1.69.*
