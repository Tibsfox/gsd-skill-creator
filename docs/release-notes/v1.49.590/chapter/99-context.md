# v1.49.590 — Engine State Context

## NASA degree state

| Surface | Value |
|---|---|
| Current degree | **71 / 360** (19.7% complete) |
| Mission code | APOLLO-7 |
| NSSDC ID | AS-205 |
| Launch date | 1968-10-11 |
| Crew | Walter M. Schirra (CDR), Donn F. Eisele (CMP), Walter Cunningham (LMP) |
| Spacecraft | CSM-101 (Block II first-flight) |
| Booster | Saturn IB SA-205 |
| Launch site | Cape Kennedy AFS LC-34 |
| Mission duration | 10 days, 20 hours, 9 minutes |
| Splashdown | 1968-10-22, Atlantic Ocean |
| Recovery | USS Essex |
| Outcome | 101% success on all primary mission objectives |
| NASA CSV row | 1.71 (stable; 450-row count unchanged) |
| §6.6 register | 14 exemplars (+1 POST-FIRE-PROGRAM-RECOVERY origination) |
| CHAIN-CONVENTIONS version | v1.4 (no bump; twelfth full use) |

## §6.6 register at v1.71 close

| Thread | Status | Exemplars |
|---|---|---|
| **POST-FIRE-PROGRAM-RECOVERY** | **NEW: 1-ex origination** | Apollo 7 (this) → STS-26 (watchlist 2nd-ex 1988) → STS-114 (watchlist 3rd 2005) |
| UPV (UNMANNED-PRECURSOR-VALIDATION) | 2-ex reproducibly-stable; **outcome-validated at v1.71** | Apollo 5 (v1.69) + Apollo 6 (v1.70); 3rd-ex candidates: Skylab 1 (1973), Buran 1K1 (1988), DM-1 (2019) |
| ALL-UP COMMITMENT | 1-ex; 2nd-ex candidate at v1.72 | Apollo 4 (v1.64); 2nd-ex candidate Apollo 8 |
| SCIENCE-MAXIMIZED FINAL-OF-SERIES | 1-ex | Mariner 6/7 (v1.49.587) |
| CATALOG-WINDOW-OPENING | 1-ex | (carryover from v1.67) |
| GRACEFUL-ATTRITION | 1-ex | (carryover from v1.66) |
| PERSISTENT-CONSTELLATION-LISTENER | 2-ex | (carryover) |
| FORM-AS-MULTIPLICITY-COORDINATION | 1-ex | (carryover) |
| LIFT-AND-RESET | 1-ex | (carryover) |
| ALPHA-SCATTERING | CLOSED 3-ex (v1.68) | (closed) |
| SUCCESS-AFTER-FAILURE | CLOSED 3-ex (v1.64) | (closed) |

## Pass-2 Domain state

| Track | Domain | Status at v1.71 |
|---|---|---|
| MUS | **Domain 9 (Extended Form / Double Album)** | **NEW: 1-ex origination** (Electric Ladyland) |
| MUS | Domain 5 (Harmony) | 6/5 (Pass-2 over-target; carryover from v1.69 Child Is Father to the Man) |
| MUS | Domain 7 (Production / Studio Composition / Multi-track Layering) | Pass-2 closure 5/5 (carryover from v1.70 Bookends) |
| ELC | **Domain 12 (IC Qualification)** | **1-ex → 2-ex reproducibly-stable** (Block I LM-1 v1.69 + Block II Apollo 7 v1.71) |
| ELC | Domain 4 (Noise / Signal-Conditioning) | 5/6 (carryover from v1.70 S-IC pogo accel chain) |

## Era state at v1.71

| Era | Status |
|---|---|
| Crewed-Apollo era | **OPENS at v1.71** (was reserved at v1.70) |
| Block II CSM era | **OPENS at v1.71** (every subsequent crewed Apollo through ASTP 1975) |
| Live-TV-from-space era | **OPENS at v1.71** (RCA SSTV; Apollo 10 color → Apollo 11 lunar surface peak) |
| Saturn IB crewed era | **OPENS and SINGLETON at v1.71** (only crewed Saturn IB in Apollo-program proper; returns at Skylab 2-4 + ASTP) |
| Post-fire-recovery era | **OPENS at v1.71** (first-crewed-after-fatal-fire-halt) |
| Pogo-oscillation-discovery era | continues from v1.70 (helium-precharge fix validated retrospectively at v1.72 Apollo 8) |
| Helium-precharge pogo-fix era | continues from v1.70 |
| All-Up Commitment risk-tolerance era | continues from v1.62; 2nd-exemplar candidate at v1.72 Apollo 8 |

## Forest contribution

- **simulation.js block #71 added** as canonical `forest-module/apollo-7-first-crewed.js`
- **Aggregator merge into `www/tibsfox/com/Research/forest/simulation.js` DEFERRED** per pattern (recurring counter-cadence cleanup item; ETA ~v1.49.615)
- **Forest blocks at v1.71:** 1.65 alpha-scattering closure, 1.66 graceful attrition, 1.67 catalog window opening, 1.68 science-maximized final-of-series, 1.69 unmanned-precursor-validation origin, 1.70 unmanned-precursor-validation 2-exemplar, **1.71 post-fire-program-recovery origin** (this)

## SPS catalog state

| Surface | Value |
|---|---|
| SPS species | **#68 Downy Woodpecker** (*Dryobates pubescens*) |
| Cross-track structural anchor | Hutchinsonian congener pair with #67 Hairy Woodpecker (sympatric niche partition) |
| SPS catalog gap | 056-066 still backfilled-pending (inherited from v1.49.586+; not addressed at v1.49.590) |
| Catalog count at v1.71 close | 68 documented species (with 056-066 gap) |

## Repository state at v1.71 close

| Surface | Value |
|---|---|
| Branch | dev = main (perfect alignment after RH refresh sync) |
| Tag | v1.49.590 |
| GitHub release | https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.590 |
| Tools added | `tools/ftp-sync.mjs` + `tools/__tests__/ftp-sync.test.mjs` (18 assertions) |
| npm scripts added | `npm run ftp-sync` + `npm run ftp-sync:dry-run` |
| CLAUDE.md updates | FTP sync tool section + inline-recovery procedure section + gh CLI path-resolution workaround section (all in ship-pipeline area) |
| Pre-tag-gate steps | 6 (depth-audit step 6 still WARNING-mode; hardens to BLOCKER at v1.49.591) |
| Total vitest tests | 28,828 (+18 ftp-sync assertions) |
| FTP sync status | (TBD post-W4 ship — 47-49 files / ~700KB to tibsfox.com via new `tools/ftp-sync.mjs`) |

## Forward planning

| Milestone | NASA | TRS | Track 2 carryover |
|---|---|---|---|
| **v1.49.590 (this)** | Apollo 7 1.71 | M0 Wave 1b retry COMPLETE (05/06/07; +59 records); **Wave 1c packs 09-12 DEFERRED to v1.49.591** (Anthropic Sonnet quota exhaustion at Batch C) | (none — clean Track 2 close) |
| v1.49.591 | Apollo 8 1.72 (first-crewed Saturn V; first-crewed translunar; ALL-UP COMMITMENT 2nd-ex candidate) | M0 Wave 1c retry (packs 09-12) + Wave 1d (packs 13-16) = 8 packs total per #10200 dispatch discipline (≤2 concurrent + ≥10-min spacing) | depth-audit hardening to BLOCKER (T2.3 follow-on); W2-prompt MANDATORY upgrade |
| v1.49.592 | Apollo 9 1.73 (first-crewed LM; UPV outcome-validation of Apollo 5) | M0 Wave 1e packs 17-22 | TBD |
| v1.49.593-595 | Apollo 10/11/12 | M0 Wave 2a/2b/2c synthesis | first-lunar-landing at v1.75 Apollo 11 |

## Cross-references

- Mission package: `.planning/missions/v1-49-590-apollo-7-first-crewed/`
- W1 research dossier: `.planning/missions/v1-49-590-apollo-7-first-crewed/work/research/W1-RESEARCH-DOSSIER.md` (12,033 words, 11 brief errors caught)
- Predecessor handoff: `.planning/HANDOFF-v1.49.589-COMPLETE.md`
- TRS execution map: `.planning/missions/v1-49-587-mariner-6-7-twin-mars-flyby/work/research/TRS-EXECUTION-MAP.md`
- NASA degree canonical spec: `.planning/NASA-DEGREE-CANONICAL.md`
