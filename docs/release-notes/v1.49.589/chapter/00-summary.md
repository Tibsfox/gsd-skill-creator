# v1.49.589 — Summary

**Milestone:** Apollo 6 (NASA degree 1.70) + Simon & Garfunkel *Bookends* (MUS 1.70) + S-IC pogo accelerometer chain (ELC 1.70 — Domain 4 advance 4/6 → 5/6) + Hairy Woodpecker (SPS #67) + 4 operational-debt fold-ins (#10187 version-bump + #10188 depth-audit + #10189 incremental-Edit + #10190 README scorer-format) + TRS M0 Wave 1b (partial — packs 05-07 deferred).

**Type:** Combined three-track-plus-TRS ship (third instance of pattern; first was v1.49.587, second was v1.49.588).

## Structural firsts

- **UNMANNED-PRECURSOR-VALIDATION 2-exemplar advancement** — Apollo 6 confirms the §6.6 thread originated at v1.69 Apollo 5 reaches reproducibly-stable status. The 3-criterion rubric (sole-purpose subsystem certification + cleanly distinct from prior threads + generalizable) holds across both exemplars.
- **PARTIAL-SUCCESS-PROCEED** sub-pattern documented under UPV — Apollo 6 was a UPV mission that did not fully validate but program proceeded anyway based on schedule + risk-tolerance. Not elevated to standalone §6.6 thread per generalizability test fail.
- **Pogo-oscillation-discovery era OPENS** — first observation at flight-vehicle scale of a long-theoretically-predicted instability (~5.25 Hz / ±0.6g axial peak in S-IC for ~30 sec / ~150 cycles).
- **Helium-precharge pogo-fix era OPENS** — gas-accumulator detuning solution; first deployed Apollo 8 December 1968; eliminated pogo for all subsequent crewed Saturn V flights through Skylab 1.
- **J-2 cross-coupling-failure era OPENS** — production-line wiring-error discovery (engines #2 + #3 mis-wired cutoff command path); procedural-fix tightened independent-verification on all engine-shutdown paths.
- **Three-track-plus-TRS pattern: 3** (was 2 at v1.49.588) — pattern stability is now its own structural marker.
- **Pre-tag-gate v6** — added optional step 6 (depth-audit, WARNING mode) closing Lesson #10188 candidate; hardens to BLOCKER at v1.49.591+.
- **Same-day cultural anchor** — Bookends released 1968-04-03; Apollo 6 launched 1968-04-04; MLK assassination 1968-04-04 (~6h after launch). Three independent events on a 24-hour timeline create the strongest temporal-coincidence anchor in the catalog through v1.70.

## Engine state delta

| Surface | Before (v1.49.588) | After (v1.49.589) | Δ |
|---|---|---|---|
| NASA degree | 69 / 360 | **70 / 360** | +1 forward |
| §6.6 register | 13 exemplars | 13 (UPV 1-ex → 2-ex; PSP absorbed) | 0 (no NEW threads; 1 promoted) |
| MUS Pass-2 | Domain 5 6/5 | Domain 5 6/5 + **Domain 9 N/M** | +1 axis advance |
| ELC Pass-1 | D12 5/5 closed | (Pass-2) Domain 4 4/6 → **5/6** | +1 advance toward closure |
| simulation.js block | #69 | **#70** (apollo-6-pogo.js, canonical) | +1 |
| Three-track-plus-TRS | 2 | **3** | +1 (pattern stability) |
| Pre-tag-gate steps | 5 | **6** (depth-audit WARNING mode) | +1 |
| Total vitest tests | 28,767 | **28,810** (+43 new T2.x assertions) | +43 |
| NASA CSV rows | 450 | 450 (stable) | 0 |
| TRS M0 cache | 137 / 51 / 53 | (pack-08 partial; full append at v1.49.590) | +5 PDFs only |

## Brief errors caught at G0 gate (W1a §"Brief errors caught at G0 gate")

10 substantive errors caught (best for any milestone through v1.70):
- BE-1: Pogo frequency centerband 5.25 Hz (some references give 5.2-5.5 Hz; AS-502 Mission Report central value)
- BE-2: J-2 shutdown precision T+412.92s (engine #2) and T+414.18s (engine #3) — two-decimal precision verified
- BE-3: ~150 pogo cycles (30 sec × 5 Hz arithmetic verified)
- BE-4: S-II engines #2 + #3 = outboard peripheral; #1 is center engine
- BE-5: AS-502 (vehicle) vs SA-502 (Saturn V serial) — DISTINCT designations, both used in literature
- BE-6: SPS substitute burn = 442 seconds per Apollo 6 Mission Report
- BE-7: "Longest SPS burn until Apollo 13" — REQUIRES CARE; Apollo 13 used DPS for PC+2 burn; SPS was disabled post-O₂ rupture; framing kept but qualified as "longest single SPS burn through Apollo 11"
- BE-8: Apollo 8 launched 1968-12-21 (verified)
- BE-9: von Braun verdict paraphrased not direct quote (framing flagged)
- BE-10: CM Avcoat 5026-39 ablative material specification (verified; same material used through Apollo 17)

## Cross-track triad summary

| Domain | Subject | Quantitative anchor | Cross-track parallel |
|---|---|---|---|
| Track 1 NASA | Apollo 6 AS-502 | ~5.25 Hz pogo / ±0.6g / 442s SPS | UPV 2-exemplar; PSP sub-pattern |
| Track 2 MUS | Bookends | 7-track Side-1 suite; 5× Platinum | Same-day-as-launch release; suite-construction parallel to Saturn V |
| Track 3 ELC | S-IC pogo accel chain | Endevco 2273A → charge amp → 4-pole LP → IRIG PCM | Detection enabled diagnosis; Domain 4 advance 4/6→5/6 |
| Track 4 SPS | Hairy Woodpecker | ~26 bps drumming / ~1000g instantaneous bill-tip | Bill-skull-substrate resonance coupling = biological pogo analog |
