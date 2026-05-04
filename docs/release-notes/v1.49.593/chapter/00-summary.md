# v1.49.593 — Structural Firsts + Engine State

## Structural firsts at v1.49.593 close

1. **First crewed full lunar-orbit dress rehearsal — F-mission per Apollo A-G classification.** Complete stack in operational regime; LM-4 "Snoopy" + CSM-106 "Charlie Brown" exercised every operational subsystem (DPS / APS / RR / AGS / PGNCS / separation / redocking). DRC §6.6 thread 1-exemplar origination admitted at G2 lock.
2. **First crewed LM lunar-orbit independent flight.** LM-4 Snoopy separated from CSM-106 Charlie Brown for approximately 8 hours; max separation reached ~628 km from CSM (BE-5 HIGH correction from initial brief's 14-100 km figure).
3. **First crewed CSM-LM rendezvous in lunar orbit.** Closes the Apollo 9 v1.73 Earth-orbit RR sub-thread; Apollo 9 RR (185 km) → Apollo 10 lunar-orbit RR (~628 km) two-instance arc closes.
4. **LM Snoopy descent to 14.4 km perilune** (~47,400 ft AGL). Closest crewed approach to lunar surface before Apollo 11 v1.75 landing; LM-4 propellant deliberately sized to prevent landing-then-return capability — the hardware-enforced stop-short anchoring the DRC doctrinal frame.
5. **First sustained color TV from lunar-orbit LM-CSM stack.** BE-2 MED corrected from initial brief's "first color TV from lunar orbit"; Apollo 9 v1.73 had RCA color but CSM-only. Apollo 10's Westinghouse color camera produced the first sustained color transmission from inside the LM-CSM stacked configuration in lunar orbit.
6. **Highest crewed spacecraft re-entry speed in history.** ~39,897 km/h (Mach 32.5); record still stands as of 2026.
7. **First five-day temporal-coincidence anchor on a MUS pick.** *Tommy* UK release 1969-05-23 (5 days post-launch) + US release 1969-05-19 (1 day post-launch). Strongest temporal-coincidence anchor among any v1.49.59X milestone within the ±7-day narrow window per Lesson #10198. SOLE candidate within the window.
8. **First W2-prompt artifact-suite enumeration discipline.** Closes Lesson #10213 candidate by mirroring the v1.49.592 T2.1 canonical-regex propagation pattern — W2-prompt template grew 111→154 lines; depth-audit gained artifact-count + 5-category check; v1.74 ships at 13 / 5/5 categories without remediation.
9. **First DRC §6.6 thread origination on a stop-short success outcome.** Three-criterion test PASS: (1) complete stack in operational regime; (2) all subsystems exercised; (3) deliberate hardware-enforced stop-short. Watchlist 2-ex: STS-1 Columbia OFT (1981-04-12).

## Three new structural openings at v1.74

- **DRESS-REHEARSAL-BEFORE-COMMITMENT (DRC) era opens** — every subsequent crewed first-flight of a complex stack inherits the F-mission doctrine. Watchlist 2-ex: STS-1 Columbia OFT (April 12, 1981).
- **First-sustained-color-TV-from-lunar-orbit-LM-CSM-stack era opens** — closes at Apollo 17 v1.81 final lunar TV
- **First-crewed-Ku/X-band-RR-in-lunar-regime era opens** — RR validated for Apollo 11+ landings; LM Rendezvous Radar architecture inherited by Skylab + Shuttle docking systems

## Engine state register

| Surface | Value at v1.74 close |
|---|---|
| NASA degree | 74/360 (20.6% complete) |
| §6.6 exemplar count | 16 (advance from 15 at v1.72; DRC 1-ex origination) |
| CHAIN-CONVENTIONS | v1.4 (fifteenth full use; no bump) |
| Three-track-plus-TRS | 7 instances (established cadence carries) |
| Domains opened | Domain 11 Rock Opera (MUS) + DRC (NASA §6.6 thread) |
| TRS M0 master.json | 305 records (unchanged from v1.49.592; Wave 2 = synthesis, not fetch) |
| TRS M0 Wave progress | Wave 2a COMPLETE (packs 01-08 synthesized; ~44,100 words / 91 claims / 192 records cited / 26 gaps); next Wave 2b synthesis at v1.49.594 |
| Pre-tag-gate gates | 6/6 (build + vitest + completeness + CI-on-dev + www-bundles + depth-audit BLOCKER) |
| Depth-audit verdict | NASA PASS / MUS PASS / ELC WARN-bytes-only (composite-pass clears all 3 to PASS) |
| Artifacts at v1.74 NASA | 13 files / 5/5 categories (matches v1.69 + v1.70 gold standard) |

## Cross-track resonance axes

Three substrates, one structural primitive (DRESS-REHEARSAL-BEFORE-COMMITMENT):

1. **Apollo 10** — first complete crewed Apollo stack flown in lunar-orbit operational regime; LM Snoopy descended to 14.4 km perilune; ALL operational subsystems exercised (DPS, APS, RR, AGS, PGNCS, separation/redocking); deliberate hardware-enforced stop-short (LM-4 propellant SIZED to prevent landing-then-return capability)
2. **Tommy** — first complete rock-opera narrative arc; ALL operatic subsystems exercised (overture, recitative, aria, ensemble, instrumental interlude, finale); deliberate stop-short of triumphant resolution (final track is rejection, not ascendance)
3. **Steller's Jay** — site-fidelity behavior (returns to home territory across seasons); structural pair to Snoopy-Charlie Brown rendezvous (separated and rejoined at the same location)

The structural primitive is **dress-rehearsal-before-commitment**: a complete configuration flown in its operational regime, every subsystem exercised, deliberately stopping short of irreversible commitment so that next-instance commitment can be made on validated architecture.

This is parallel to but distinct from ALL-UP COMMITMENT (Apollo 4/8 — first-flight commitment to full stack) and UPV (Apollo 5/6 — uncrewed precursor validation). DRC is **crewed full-stack stop-short** — neither uncrewed nor commitment.
