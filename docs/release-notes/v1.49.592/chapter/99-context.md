# v1.49.592 Engine-State Context

## Repository state at close

| Surface | Value |
|---|---|
| Tag | `v1.49.592` |
| Predecessor tag | `v1.49.591` |
| dev tip (ship commit) | (set at W4 push) |
| main tip (post-merge) | (set at W4 merge) |
| Working tree at close | clean (3 tracked files modified: CLAUDE.md + tools/ftp-sync.mjs + tools/__tests__/ftp-sync.test.mjs) |
| Build artifacts (gitignored, FTP at W4) | 37 files / 598,408 bytes across NASA + MUS + ELC v1.73 |
| GitHub release | https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.592 |

## Tracks summary

### Track 1 — NASA 1.73 + MUS 1.73 + ELC 1.73 + SPS #70

| Sub-track | Subject | Files | Lines | Bytes | Depth verdict |
|---|---|---|---|---|---|
| NASA 1.73 | Apollo 9 (AS-504; CSM-104 "Gumdrop" + LM-3 "Spider"; McDivitt + Scott + Schweickart; first crewed LM Earth-orbit shakedown) | 17 | 3,296 (total) / 632 (index.html) | 290,891 (total) / 84,737 (index.html) | PASS 96% lines / 98% bytes / 7/7 sections |
| MUS 1.73 | Crosby, Stills & Nash debut (Atlantic SD-8229; 1969-05-29; 12 tracks; producer Bill Halverson + group at Wally Heider Studios) | 10 | 1,597 (total) / 588 (index.html) | 172,643 (total) / 62,760 (index.html) | WARN 97% lines / 84% bytes (legitimate brevity) / 13/10 sections |
| ELC 1.73 | LM Abort Guidance System (TRW MARCO 4418; 18-bit digital + 4096-word magnetic-core + first strapdown IMU in crewed spaceflight) | 10 | 1,419 (total) / 547 (index.html) | 134,874 (total) / 64,730 (index.html) | WARN 86% lines / 101% bytes (legitimate density) / 16/10 sections |
| SPS #70 | Clark's Nutcracker (*Nucifraga columbiana*, Wilson 1811 from Lewis & Clark Expedition specimens; spatial-memory cache-recovery parallel to Spider 115-mile rendezvous) | (in NASA + MUS) | — | — | — |

### Track 2 — Operational-debt fold-in (4 items)

| Item | Outcome |
|---|---|
| **T2.1** #10203 W2-prompt canonical-section regex propagation | **DONE** — 7 NASA canonical regexes enumerated verbatim in `template-files/W2-build-agent-prompt.md`. **Result: NASA 1.73 W2-NASA hit 7/7 sections without inline-recovery cycles.** Forward-action fix worked as designed. |
| **T2.2** #10204 NASA bytes WARN moving-baseline analysis | **DONE (analysis only; implementation deferred)** — historical analysis v1.62-v1.72 shows moving-3-baseline does NOT cleanly improve over single-predecessor. Better fix is composite-signal evaluation (option (a) from #10204; see Lesson #10207). Recommended deferred to v1.49.593 W0 with `--composite-pass` flag. Analysis at `.planning/missions/v1-49-592-apollo-9-first-crewed-LM/work/T2.2-bytes-moving-baseline-analysis.md` (151 lines). |
| **T2.3** #10206 ftp-sync `--include-catalog-index` flag | **DONE** — flag implemented in `tools/ftp-sync.mjs`; 6 new tests in `tools/__tests__/ftp-sync.test.mjs` (31/31 pass); CLAUDE.md ship-pipeline subsection updated. Smoke-tested with v1.71 dry-run (53 files manifest with 3 catalog indexes). |
| **T2.4 (carry-forward already-staged)** NASA 1.71/1.72 card-split restore | **DONE pre-W0 + documented at W0.5** — Forest Contribution + Runnable Simulations + Governance & Chain Declarations restored as separate cards (matches v1.65-v1.70 canonical 3-card structure). User-requested 2026-05-01. Documentation at `.planning/missions/v1-49-592-apollo-9-first-crewed-LM/work/T2.4-carry-forward-1-71-1-72-card-split.md` (133 lines). |

### Track 3 — TRS M0 Wave 1e

| Pack | Topic | Records added | master.json | Outcome |
|---|---|---|---|---|
| 17 | string-theory | 7 | 260 → 273 | All 5 claims; Tier-1 coverage on Witten 1995 + Maldacena 1997 + Green-Schwarz 1984 + Schwarz 1972 + Lovelace 1971 + Goddard-Thorn 1972 |
| 18 | chaos-dynamical-systems | 6 | (parallel with 17) | All 5 claims; Lorenz 1963 + Feigenbaum 1978 + dual coverage on Lorenz attractor dimension |
| 19 | l-systems-formal-grammars | 5 | 273 → 278 | All 3 claims; Lindenmayer 1968 Parts I+II + Gardner SciAm dragon + Conway Life |
| 20 | complexity-theory | 8 | 278 → 286 | All 6 claims; Turing 1937 dual-coverage on s1+s4 + Cook 1971 + Levin 1973 + Euler 1741 + Appel-Haken 1976+1977 |
| 21 | machine-learning | 6 | 286 → 292 | All 5 claims; Rosenblatt 1958 + Rumelhart-Hinton-Williams 1986 + Cybenko 1989 + Hornik 1991 + Vaswani 2017 |
| 22 | graphics-rendering | 13 | 292 → 305 | All 10 claims; Phong 1975 + Cook-Torrance 1982 + Whitted 1980 + Kajiya 1986 (all Tier-1 with DOIs) |

**Wave 1e total: +45 records / 34 claims / 1.32 records-per-claim ratio.**

## Pre-tag-gate verdict

6/6 PASS at ship commit:
1. `npm run build` — TypeScript clean
2. `npx vitest run` — full suite pass (28,773 tests = 28,767 baseline + 6 new ftp-sync tests)
3. `node tools/release-history/check-completeness.mjs --current --strict` — all 5 release-notes files ≥200 bytes
4. CI-on-dev verification — green at ship commit
5. `bash tools/build-www-bundles.sh` — SPICE renderer rebuild idempotent
6. `node tools/depth-audit.mjs --current` — depth-audit BLOCKER mode (1 PASS / 2 WARN / 0 FAIL/MISSING)

## FTP sync at W4

`node tools/ftp-sync.mjs 1.73 --include-catalog-index` (uses new T2.3 flag) uploads:
- 17 NASA 1.73 build artifacts
- 10 MUS 1.73 build artifacts
- 10 ELC 1.73 build artifacts
- 3 catalog index.html (NASA + MUS + ELC; updated with v1.73 entries at W3)

Plus carry-forward 1.71/1.72 NASA index.html updates (T2.4) via plain `node tools/ftp-sync.mjs 1.71` and `node tools/ftp-sync.mjs 1.72` for the per-version files alone (no catalog re-upload — already pushed with --include-catalog-index above).

## Open items at v1.49.592 close

- **G1 verification flag (ELC 1.73):** AGS LEMAP instruction count cited as 27 (Wikipedia / TN D-7990) vs MISSION-BRIEF's "approximately 70" — likely conflation with AGC. Verify against NASA TN D-7990 primary source at v1.49.593+.
- **#10207 composite-pass implementation deferred to v1.49.593** — `--composite-pass` flag for `tools/depth-audit.mjs`.
- **#10211 candidate — sibling depth-audit triple-reporting** — held.
- **#10212 candidate — visual card-separation enforcement** — held.
- **Forest-sim simulation.js aggregator merge deferred** (recurring counter-cadence; ETA ~v1.49.615).
- **SPS catalog 056-066 backfill deferred** (inherited).
- **Counter-cadence cleanup-mission #2 deferred** (per Lesson #10168 ~30-milestone cadence; ETA ~v1.49.615).
