# v1.49.592 — Structural Firsts + Engine State

## Structural firsts at v1.49.592 close

1. **First crewed LM flight** — LM-3 "Spider"; Block II Apollo Lunar Module's first crewed mission
2. **First crewed CSM-LM separation + rendezvous** — CSM "Gumdrop" + LM "Spider" tested CSM-LM transposition + extraction + Day 5 active rendezvous
3. **First crewed LM independent flight** — LM-3 separated from CSM for ~6.5 hours; flew up to 115 miles from CSM
4. **First crewed lunar-spacesuit EVA** — Schweickart in Apollo Block II A7L EMU pressure suit + PLSS life-support backpack; 46-minute hatch-cycle EVA Day 4 [BE-2 corrected; original brief said ~37 min]
5. **First strapdown IMU in crewed spaceflight history** — TRW MARCO 4418 / LM AGS (entirely digital; 18-bit; 4096-word magnetic core) [BE-1 corrected; original brief said "analog logic"]
6. **First crewed test of LM Abort Guidance System** — backup to PGNCS gimbaled-IMU primary; closes Apollo 5 v1.69 LM-1 abort-scenario sub-thread

## Three new structural openings at v1.73

- **Crewed-LM era opens** — every subsequent crewed Apollo (10/11/12/13/14/15/16/17 + Skylab dockings + ASTP) flies LM derivatives or CSM-LM rendezvous architecture
- **First-PLSS-vacuum era opens** — Schweickart's 46-minute EVA validates the Portable Life Support System in vacuum, prerequisite for lunar-surface EVA at Apollo 11 v1.75
- **First-CSM-LM-rendezvous era opens** — Day 5 active rendezvous + redocking architecture validated, prerequisite for Apollo 10 v1.74 lunar-orbit rehearsal and Apollo 11 v1.75 surface-to-orbit ascent rendezvous

## Engine state register

| Surface | Value at v1.73 close |
|---|---|
| NASA degree | 73/360 (20.3% complete) |
| §6.6 exemplar count | 15 (unchanged; AGS Domain 16 + CSN Domain 10 are domain originations, not §6.6 thread originations) |
| CHAIN-CONVENTIONS | v1.4 (fourteenth full use; no bump) |
| Three-track-plus-TRS | 6 instances (established cadence carries) |
| TRS M0 master.json | 305 records (was 260; +45 from Wave 1e) |
| TRS M0 Wave progress | Wave 1d COMPLETE → Wave 1e COMPLETE; next Wave 2a synthesis at v1.49.593 |
| Pre-tag-gate gates | 6/6 (build + vitest + completeness + CI-on-dev + www-bundles + depth-audit BLOCKER) |
| W2-prompt discipline | MANDATORY (per v1.49.591 T2.3); now includes 7 canonical regexes (per v1.49.592 T2.1) |

## Cross-track resonance axes

Three substrates, one structural primitive (crewed-stack-validation 1st-instance):

1. **Apollo 9** — first complete crewed Apollo stack (CSM + LM + crew) flown together; tests separation/rejoin without orbital margin to spare
2. **CSN debut** — first complete supergroup configuration (three solo veterans + new collective) recorded together; tests cross-pollination of three prior styles into new ensemble identity
3. **LM AGS** — first strapdown-IMU + backup-digital-guidance complete architecture flown crewed; tests independent navigation pathway separate from PGNCS primary

The structural primitive is **independent-architecture-debut**: a complete configuration that can stand alone (CSN doesn't need any prior band; Apollo 9 LM doesn't need PGNCS for AGS abort path; CSN+Apollo+AGS each demonstrate their own complete configuration). This is parallel to but distinct from ALL-UP COMMITMENT (Apollo 4/8, full-stack first-flight commitment) — here the configuration is novel-as-an-integrated-whole, not first-flight-of-an-integrated-whole.
