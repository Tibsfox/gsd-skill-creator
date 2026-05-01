# v1.49.591 — Summary

**Milestone:** Apollo 8 (NASA degree 1.72 first-crewed Saturn V + first-crewed translunar) + The Beatles *White Album* (MUS 1.72 — Domain 9 advance 1-ex → 2-ex reproducibly-stable) + Saturn V S-IVB J-2 restart sequencer (ELC 1.72 — Domain 15 origination) + Common Raven (SPS #69) + 3 operational-debt fold-ins (T2.1 #10201 gh CLI snap-confinement workaround correction + T2.2 depth-audit BLOCKER hardening + T2.3 W2-build-agent-prompt MANDATORY upgrade) + T2.4 catalog-index drift backfill + TRS M0 Wave 1d (packs 13/14/15/16 = 4 packs).

**Type:** Combined three-track-plus-TRS ship (fifth instance of pattern; pattern soaked at 4 per Lesson #10197 → upgraded to "established cadence").

## Structural firsts

- **ALL-UP COMMITMENT §6.6 thread advance to 2-exemplar reproducibly-stable** — 1-ex was Apollo 4 v1.64 AS-501 uncrewed (Mueller 1963 doctrine; first uncrewed instance 1967-11-09); 2-ex Apollo 8 v1.72 AS-503 crewed (Low August 9 1968 initiative; collective approval Mueller/Webb/Gilruth/Phillips/Paine; first crewed instance 1968-12-21). 3-criterion test PASSES cleanly: technical risk-acceptance + schedule-driven + reproducible pattern. Watchlist 3-ex: STS-1 Columbia (1981 first Space Shuttle), Crew Dragon Demo-2 (2020 commercial), Soyuz 1 (1967 failure-case anchor).
- **Crewed-translunar era OPENS** — first humans depart Earth orbit (TLI burn GET 02:50:37); ~386,000 km from Earth at lunar distance. Era closes with ASTP (1975) Earth-orbit return.
- **Crewed-lunar-orbit era OPENS** — 10 orbits (LOI-1 GET 69:08:52 + LOI-2 circularization 73:35:05); ~20 hours in lunar SOI. Era closes with Apollo 17 TEI (December 1972); reopens with Artemis 2 (planned).
- **First-Earthrise era OPENS** — AS8-14-2383 (Anders, 1968-12-24 ~16:39 UTC); culturally formative photograph; precursor to Earth Day 1970 + Whole Earth Catalog adoption + Sierra Club imagery.
- **Saturn V crewed era OPENS** — every subsequent crewed Apollo through ASTP (1975) launches on Saturn V except Apollo 7 v1.71 Saturn IB singleton; Skylab 2/3/4 + ASTP also use Saturn IB for crew launch (BE-8 corrected).
- **AGC Block II second-flight (continuing v1.71 Domain 12 thread; no new exemplar advance at v1.72)** — same Fairchild μL 9915 dual-NOR-gate RTL ICs as Apollo 7; no incidents during 6-day mission including 66-hour translunar coast and lunar-orbit blackout periods. The Block II AGC qualification earned at v1.71 was fully validated at v1.72 in its most demanding operational context.
- **MUS Pass-2 Domain 9 (Extended Form / Double Album) advance to 2-exemplar reproducibly-stable** — depth-axis (Electric Ladyland v1.71; suite-length / 16 tracks / 75:39) + breadth-axis (White Album v1.72; stylistic span / 30 tracks across 4 sides). Two structurally distinct double-album instances; thread is reproducibly-stable.
- **ELC Pass-2 Domain 15 (Propulsion Control Sequencing / Engine Restart Systems) origination 1-exemplar** — TEA/TEAL pyrophoric igniter cartridge + electromechanical relay 12-step restart sequence + post-Apollo-6 defense-in-depth NPSH pressure-check. Closes recurring S-IVB sub-thread (v1.62/v1.65/v1.70/v1.72).
- **Three-track-plus-TRS pattern: 5** (was 4 at v1.49.590) — pattern now soaked-and-established per #10197.
- **Pre-tag-gate v6 hardened** — depth-audit step 6 elevated from WARNING-only (v1.49.589/590 soak) to BLOCKER mode at v1.49.591 per T2.2 (closes T2.3 design-intent follow-on).
- **W2-build-agent-prompt MANDATORY** — template at `.planning/missions/template-files/W2-build-agent-prompt.md` elevated from RECOMMENDED to MANDATORY per T2.3 (closes #10193 follow-on after 4 consecutive successful applications). Emergency override `SC_W2_DISPATCH_OVERRIDE=1`.
- **Catalog-index drift remediation** — NASA/MUS/ELC catalog `index.html` `completedMissions` Set + degree cards backfilled with 1.70/1.71/1.72 (2-milestone drift discovered + closed; user-requested 2026-04-30).

## Engine state delta

| Surface | Before (v1.49.590) | After (v1.49.591) | Δ |
|---|---|---|---|
| NASA degree | 71 / 360 | **72 / 360** | +1 forward |
| §6.6 register | 14 exemplars | **15** (ALL-UP COMMITMENT advances 1→2; Domain 15 ELC originates as 1-ex; net +1) | +1 |
| MUS Pass-2 | Domain 9 origination 1-ex | **Domain 9 reproducibly-stable 2-ex** | +1 advance |
| ELC Pass-2 | Domain 12 reproducibly-stable + Domain 15 N/M | Domain 12 carries + **Domain 15 origination 1-ex** | +1 origination |
| simulation.js block | #71 | **#72** (apollo-8-first-translunar.js, canonical) | +1 |
| Three-track-plus-TRS | 4 | **5** | +1 (pattern soak → established) |
| Pre-tag-gate steps | 6 (depth-audit WARNING) | 6 (depth-audit BLOCKER) | 0 (steps); discipline elevation |
| Total vitest tests | 28,828 | **28,830** (+2 pre-tag-gate.test.sh assertions) | +2 |
| NASA CSV rows | 450 | 450 (stable; Path Y reconciliation) | 0 |
| TRS M0 master.json | 240 records (Wave 1c retry post-ship) | **260** (+10 Batch A pack-13/14 + +10 Batch B pack-15/16) | +20 |
| Catalog index drift | 2 milestones (1.70 + 1.71 missing) | 0 (1.70/1.71/1.72 all present) | -2 (closed) |

## Brief errors caught at G0 gate (W1a §8)

10 substantive errors caught (target 8-12; v1.49.587 = 5; v1.49.588 = 6; v1.49.589 = 10; v1.49.590 = 11; v1.49.591 = 10):

- **BE-1 MED**: LOI GET in mission brief was 69:08:20; primary sources give **69:08:52** (32-second discrepancy). Mission brief corrected.
- **BE-5 HIGH**: Mission brief said "first crewed object to escape Earth's sphere of influence" — Apollo 8 stayed inside Earth's Hill sphere (~1.5M km radius) at lunar distance. Correct framing is "**first crewed object to depart Earth orbit**" — it never escaped Earth's gravitational dominance. Cross-chapter propagation risk if uncorrected. Mission brief corrected at W1 G0.
- **BE-6 MED**: Mission brief framed Sam Phillips as sole "commitment memo" author — the decision originated with **George Low on August 9, 1968** (MSC Apollo Spacecraft Program Manager); Phillips (Apollo Program Director) was a critical approver in a collective chain that included Mueller / Webb / Gilruth / von Braun / Paine. Low-initiated, collectively approved. Mission brief corrected.
- **BE-8 MED**: Mission brief omitted Skylab 2/3/4 + ASTP Saturn IB usage from "Saturn V crewed era" claim; corrected note added.
- **BE-10 MED**: Mission brief presented LOI as single event; LOI was actually **two SPS burns** (LOI-1 at 69:08:52 GET + LOI-2 circularization at 73:35:05 GET, four hours apart). Mission brief corrected.
- **BE-Christmas-broadcast LOW**: Brief said ~03:00 UTC; primary sources give ~02:30 UTC = 9:30 p.m. EST 1968-12-23. Mission brief corrected.
- **BE-2 LOW**: TEI burn GET in some sources is 89:19:16 (1-second variant from 89:19:17). Documented.
- **BE-4 LOW**: Earthrise photo NASA catalog notation: AS8-14-2383 (no leading zero in second segment) is the correct convention.
- **BE-7 LOW**: Apollo 8 was first to fly with no Lunar Module aboard (LM-3 not ready). Worth surfacing.
- **BE-9 LOW**: "Lunar surface visual reconnaissance" wording — reconnaissance was from orbit (no surface contact); brief language ambiguity addressed.

## Cross-track triad summary

| Domain | Subject | Quantitative anchor | Cross-track parallel |
|---|---|---|---|
| Track 1 NASA | Apollo 8 AS-503 | 6d 3h duration / 10 lunar orbits / 950,000 km traveled | ALL-UP COMMITMENT 2-ex reproducibly-stable advance |
| Track 2 MUS | The Beatles *White Album* | 30 tracks / 4 sides / ~93 min / 1968-11-22 release (29 days pre-launch) | Domain 9 advance to 2-ex; breadth-axis vs Electric Ladyland depth-axis |
| Track 3 ELC | S-IVB J-2 restart sequencer | TEA/TEAL pyrophoric + 12-step relay sequence + ~232,250 lb thrust J-2 | Domain 15 origination; closes Apollo 6 sub-thread; defense-in-depth |
| Track 4 SPS | Common Raven | 63 cm length / 1.2 kg / 9-month cache memory / 40+ km² territories | Spatial-memory parallel to Lovell CMP star-sightings |
