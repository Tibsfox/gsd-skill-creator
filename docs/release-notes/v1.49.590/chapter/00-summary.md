# v1.49.590 — Summary

**Milestone:** Apollo 7 (NASA degree 1.71 first-crewed Apollo) + Jimi Hendrix Experience *Electric Ladyland* (MUS 1.71) + AGC Block II Fairchild μL 9915 dual-NOR-gate RTL ICs (ELC 1.71 — Domain 12 advance 1-ex → 2-ex reproducibly-stable) + Downy Woodpecker (SPS #68) + 3 operational-debt fold-ins (#10194 inline-recovery doc + #10195 FTP sync tool repo-promotion + #10196 gh CLI path-resolution workaround) + TRS M0 Wave 1b retry (packs 05/06/07) + Wave 1c (packs 09-12) = 7 TRS packs total.

**Type:** Combined three-track-plus-TRS ship (fourth instance of pattern; first was v1.49.587, second was v1.49.588, third was v1.49.589).

## Structural firsts

- **POST-FIRE-PROGRAM-RECOVERY §6.6 thread origination at 1-exemplar** — Apollo 7 = unambiguous 1st-exemplar of catastrophic-loss → halt → redesign → first-crewed-recovery thread. 3-criterion rubric passes cleanly: catastrophic crew loss triggered halt (Apollo 1 fire 1967-01-27 from same LC-34 pad); redesign incorporated fire-derived improvements (outward-opening hatch, reduced flammable materials, lower oxygen partial pressure on pad, improved wiring inspection); Apollo 7 is the first-crewed-after-halt recovery exemplar (623 days after fire).
- **UPV thread *outcome-validated*** — Apollo 7's clean Block II CSM operation retroactively confirms the v1.69 + v1.70 UNMANNED-PRECURSOR-VALIDATION thread's predictive value. Thread does not advance to 3-exemplar at v1.71 (Apollo 7 is not itself a UPV mission) but its *load-bearing utility* is demonstrated by Apollo 7 success → Apollo 8 clearance for first-crewed Saturn V translunar.
- **Block II CSM era OPENS** — every subsequent crewed Apollo mission through ASTP (1975) flies a Block II variant (Apollo 7-17 + Skylab 2-4 + ASTP).
- **Live-TV-from-space era OPENS** — 7 RCA SSTV B/W broadcasts during Apollo 7 mission ("The Wally, Walt, and Donn Show"); NASA received Television Academy Special Trustees Award (1969); crew received certificates at the ceremony but Distinguished Service Medals were withheld until 2008.
- **Saturn IB crewed era OPENS and is SINGLETON** — Apollo 7 is the only crewed Saturn IB in Apollo-program proper; the booster returns at Skylab 2/3/4 (1973) + ASTP (1975).
- **AGC Block II first-flight** — Fairchild μL 9915 dual 3-input NOR gate RTL ICs upgrading from Block I's μL 914 single-NOR-gate same-family ICs; IC count REDUCED ~4,100 → ~2,800 (denser packaging) while gate count INCREASED. ELC Pass-2 Domain 12 (IC Qualification) advance 1-ex → 2-ex reproducibly-stable.
- **Three-track-plus-TRS pattern: 4** (was 3 at v1.49.589) — pattern now soaked across four consecutive milestones.
- **Pre-tag-gate v6 stable** — depth-audit step 6 in WARNING mode soaking second milestone; hardens to BLOCKER at v1.49.591+ per T2.3 design intent.
- **Mid-mission cultural anchor** — Electric Ladyland released 1968-10-16 = 5 days into Apollo 7's 11-day flight. Joins the v1.49.589 Bookends/Apollo 6 launch/MLK assassination 24-hour anchor as the second exemplar of temporal-coincidence as cross-track structural primitive.

## Engine state delta

| Surface | Before (v1.49.589) | After (v1.49.590) | Δ |
|---|---|---|---|
| NASA degree | 70 / 360 | **71 / 360** | +1 forward |
| §6.6 register | 13 exemplars | **14** (+ POST-FIRE-PROGRAM-RECOVERY 1-ex new origination; UPV outcome-validated, no exemplar advance) | +1 NEW thread |
| MUS Pass-2 | Domain 9 N/M (advance) | **Domain 9 origination** (Extended Form / Double Album) | +1 origination |
| ELC Pass-2 | Domain 4 5/6 | Domain 4 5/6 + **Domain 12 1-ex → 2-ex reproducibly-stable** | +1 thread closure |
| simulation.js block | #70 | **#71** (apollo-7-first-crewed.js, canonical) | +1 |
| Three-track-plus-TRS | 3 | **4** | +1 (pattern soak) |
| Pre-tag-gate steps | 6 (depth-audit WARNING) | 6 (WARNING continues; soaks to BLOCKER at v1.49.591) | 0 |
| Total vitest tests | 28,810 | **28,828** (+18 ftp-sync.test.mjs assertions) | +18 |
| NASA CSV rows | 450 | 450 (stable) | 0 |
| TRS M0 cache | pack-08 partial (5 PDFs only) | (after Wave 1b retry + Wave 1c) | TBD batch results |

## Brief errors caught at G0 gate (W1a §7)

11 substantive errors caught (target 8-12; v1.49.587 = 5; v1.49.588 = 6; v1.49.589 = 10; v1.49.590 = 11):

- **BE-1 LOW**: Mission designation "AS-205" vs vehicle serial "SA-205" — both correct in their domains, brief should distinguish.
- **BE-2 HIGH**: AGC Block II ICs were **Fairchild μL 9915** dual-NOR (RTL), NOT "Sylvania DTL replacing Philco RTL" as mission brief incorrectly stated. Both Block I + Block II used Fairchild RTL family. Mission brief corrected at W1 G0.
- **BE-3 LOW**: Days from Apollo 1 fire to Apollo 7 launch: **623 days** (calendar arithmetic Jan 27 1967 → Oct 11 1968), not "621 days" as brief stated.
- **BE-4 LOW**: Block II hatch opening time — "7 seconds from inside / ~10 seconds from outside" (per AS-205 crew procedures); brief's "<10 seconds" is correct but imprecise.
- **BE-5 LOW**: Block II IC count went DOWN (~4,100 → ~2,800), not up — brief framing implied upgrade = more ICs.
- **BE-6 MED**: Block II erasable memory = **2 KiW (2,048 × 15-bit words; ~3.75 KiB user storage)**; "4 KiB" only correct if parity bits counted as storage. Standard AGC documentation uses KiW.
- **BE-7 LOW**: Schirra was **first person to fly in three different US spacecraft classes** (Mercury / Gemini / Apollo); only Mercury Seven astronaut to fly all three programs. Worth surfacing.
- **BE-8 MED**: SPS species number for v1.71 = **#68** (Hairy Woodpecker was #67 at v1.70), not #67 as mission brief alternately stated.
- **BE-9 LOW**: NASA received Television Academy Special Trustees Award; crew received certificates only — **Distinguished Service Medals were withheld** until 2008 (40 years post-mission). Award asymmetry is historically significant.
- **BE-10 LOW**: Apollo 7 SSTV camera manufacturer = **RCA** (Camden NJ), not Westinghouse.
- **BE-11 LOW**: "First live US TV broadcast from space" qualifier — Cooper (Mercury MA-9, 1963) transmitted SSTV viewed at NASA but not broadcast publicly; correct framing is **"first live television broadcast to the American public from a crewed US spacecraft"**.

## Cross-track triad summary

| Domain | Subject | Quantitative anchor | Cross-track parallel |
|---|---|---|---|
| Track 1 NASA | Apollo 7 AS-205 | 10d 20h 9m duration / 8 SPS firings / 7 TV broadcasts / 623 days post-fire | POST-FIRE-PROGRAM-RECOVERY 1-ex origination |
| Track 2 MUS | *Electric Ladyland* | 16 tracks / 75:39 / 4 sides / 1968-10-16 release (mid-mission day 5) | First-as-sole-producer; Domain 9 origination; mid-mission cultural anchor |
| Track 3 ELC | AGC Block II Fairchild μL 9915 | ~2,800 ICs / ~5,600 NOR gates / 2 KiW erasable / 1.024 MHz | Same RTL family as Block I; Domain 12 reproducibly-stable; "smaller, denser, same approach" |
| Track 4 SPS | Downy Woodpecker | Smaller body / higher-pitched drumming / sympatric with Hairy | Hutchinsonian congener pair niche partition; "smaller vehicle, same ambition" Saturn IB parallel |
