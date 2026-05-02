# v1.49.593 — Structural Firsts + Engine State

## Six load-bearing firsts at v1.74 (per Apollo 10 narrative)

1. **First crewed full lunar-orbit dress rehearsal** — F-mission per Apollo A-G classification; complete stack in operational regime
2. **First crewed LM lunar-orbit independent flight** — LM-4 Snoopy separated from CSM-106 Charlie Brown for ~8 hours
3. **First crewed CSM-LM rendezvous in lunar orbit** — closes the Apollo 9 v1.73 Earth-orbit RR sub-thread
4. **LM Snoopy descent to 14.4 km perilune** (~47,400 ft AGL) — closest crewed approach to lunar surface before Apollo 11 v1.75 landing
5. **First sustained color TV from lunar-orbit LM-CSM stack** [BE-2 corrected from "first color TV from lunar orbit"; Apollo 9 had RCA color on CSM]
6. **Highest crewed spacecraft re-entry speed in history** — ~39,897 km/h (Mach 32.5); record stands

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
