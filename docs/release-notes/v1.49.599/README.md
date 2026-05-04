# v1.49.599 — Mariner 8 Centaur Stage Failure (NASA degree 1.79)

**Shipped:** 2026-05-04 (pending operator G3 authorization at Phase 838).
**Tagged:** v1.49.599 (pending).
**GitHub release:** pending.
**Predecessor:** v1.49.598 (Apollo 14 Fra Mauro; shipped 2026-05-03).

## Through-line

> *Test the cadence with a failure. The engine that ships a brief failed mission as cleanly as a crewed landing is the engine that's actually working.*

## Engine state delta (v1.78 → v1.79)

| Track | v1.78 close | v1.79 close |
|-------|-------------|-------------|
| NASA degree | 1.78 (Apollo 14 Fra Mauro) | **1.79 (Mariner 8 / FAILED launch)** |
| MUS degree | 1.78 (Carole King *Tapestry*) | **1.79 (Jethro Tull *Aqualung*)** |
| ELC degree | 1.78 (Moon Trees lineage) | **1.79 (Greenpeace founding voyage)** |
| SPS species | #75 (Marbled Murrelet) | **#76 (Sea Otter; substrate-convergent with ELC)** |
| §6.6 register | 23 | 23 (no admit; LAUNCH-VEHICLE-FAILURE watchlist only per #10237) |
| TRS substrate | M1 Wave 0–1 (v598) | **M1 Wave 2 generation begins** (pack-13 first end-to-end coverage report) |
| M0 substrate coverage | 22/22 | **23/22** (pack-13 information-theory fetched; closes v596 schedule) |

## Cross-track substrate-emergent finding

v599 produced the **first cross-track substrate-convergence finding at the SPS+ELC interface** — Greenpeace founding voyage (ELC) opposing Cannikin nuclear test on Amchitka + Sea Otter (SPS #76) as the species at material stake on Amchitka. Per #10236 active discipline, the convergence emerged from substrate evidence rather than the original parallel-track candidate list. Recorded as second-instance #10236 evidence; promotion-to-ESTABLISHED watch for v600 third instance.

## Soak observation outcomes

- **#10231 iconic-mission depth-recovery soak — PROMOTED to ESTABLISHED.** 3-instance corroboration (Apollo 13 + Apollo 14 + Mariner 8). Brief-mission graceful-thinness disposition codified.
- **#10232 INSIDE-window MUS pick — PROMOTED to ESTABLISHED.** 3-instance reproducibly-stable (McCartney splashdown / Tapestry splashdown+1 / Aqualung launch-6). 8-day envelope around mission boundaries.
- **#10233 Tier-2 inline-Opus W2 build path — SOAK CONTINUES.** 2nd-instance only; ESTABLISHED watch v601.
- **#10236 substrate-emergent cross-track epistemology — SOAK CONTINUES.** 2nd-instance evidence with first SPS+ELC convergence; ESTABLISHED watch v600.
- **#10237 §6.6 watchlist-not-pre-decision — SOAK CONTINUES.** Default no-admit confirmed (LAUNCH-VEHICLE-FAILURE remains watchlist).

## Cross-track structural pair

Per #10236 substrate-emergent epistemology: **ambition-meets-failure with larger-system-preserves-the-ambition resolution.** Mariner 8 = engineering ambition meeting upper-stage failure (Mariner 9 inherits mission). Aqualung title-track = narrator ambition meeting locked-stairwell-collapse (song preserves narrator as canonical artifact). Looser than v598's tight Apollo 14 + Tapestry canopy-substrate pair; looseness correlates with brief-mission scope; documented as substrate-emergent finding.

## Hard rules + gates

- dev-branch only (HARD RULE).
- pre-tag-gate (7 steps): build PASS / vitest PASS (29,479 tests) / completeness PASS / CI-on-dev verification at ship / www-bundles / depth-audit (override per #10231 ESTABLISHED policy) / CLAUDE.md drift PASS.
- ship-sync after main-merge (Lesson #10221 ESTABLISHED).
- No Claude co-author trailers.

## Carry-forward to v600

- Pack-13 information-theory M0 substrate closed; M1 Wave 2 generation continues per-pack at one pack per milestone.
- Depth-audit gate-refinement to honor #10231 ESTABLISHED dispositions (forward-lesson #10240 candidate).
- MISSION-PROGRAM-REDUNDANCY-RESILIENCE §6.6 primitive lookback admit candidate at first paired-mission ship (forward-lesson #10241).
- Cross-track substrate-convergence pattern soak continues (forward-lesson #10242).

See `chapter/` for detailed retrospective + lessons + engine-state context.
