# v1.49.590 — Apollo 7 (NASA degree 1.71 first-crewed Apollo) + Electric Ladyland + AGC Block II Fairchild μL 9915 + Downy Woodpecker + 3 operational-debt fold-ins + TRS Wave 1b retry + Wave 1c

**Type:** Combined three-track-plus-TRS ship (fourth instance of the pattern; first was v1.49.587, second was v1.49.588, third was v1.49.589).

**Shipped:** 2026-04-30
**Tag:** v1.49.590
**GitHub release:** https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.590

---

## Cross-track summary

v1.49.590 advances NASA from 1.70 (Apollo 6 / UPV 2-ex reproducibly-stable) to **1.71 = Apollo 7** (AS-205, **first-crewed Apollo**, 1968-10-11), originating the **POST-FIRE-PROGRAM-RECOVERY §6.6 thread (1-exemplar)**. The structural pair triad lands across four canonical tracks plus 3-item Track 2 fold-in plus TRS continuation.

**Track 1** — NASA 1.71 = **Apollo 7 (AS-205 / CSM-101)**: first-crewed Apollo; Saturn IB; Schirra/Eisele/Cunningham; 10d 20h 9m duration; 8 SPS engine firings; first live US TV broadcast to the American public from a crewed US spacecraft; Block II CSM first-flight; AGC Block II first-flight; 623 days after Apollo 1 fire from same LC-34 pad. Mission outcome: **101% success on all primary objectives**; clears Apollo 8 for first-crewed Saturn V + first-crewed translunar (December 21, 1968). The "Schirra mutiny" (head colds + helmet refusal during reentry) generates first major crew-vs-MCC authority dispute. Schirra's third and final flight; Eisele and Cunningham never flew in space again.

**Track 2** — MUS 1.71 = **Jimi Hendrix Experience *Electric Ladyland*** (Reprise Records US 1968-10-16; UK Track 1968-10-25). Released **5 days INTO the Apollo 7 mission** — strongest temporal-coincidence anchor in MUS catalog through v1.71. Double-LP, 16 tracks, 75:39 runtime; first Hendrix solo production credit (previously co-produced with Chas Chandler) = "first command" structural anchor mirroring first-crewed Apollo. Personnel: Hendrix (g/v/p), Redding (b), Mitchell (d) + guests Winwood, Casady, Buddy Miles, Al Kooper, Brian Jones. Sonic-territory exploration via varispeed, panning, multi-tracking, found-sound. **MUS Pass-2 Domain 9 (Extended Form / Double Album) origination**.

**Track 3** — ELC 1.71 = **AGC Block II Fairchild μL 9915 dual-NOR-gate RTL ICs** (first-flight Apollo 7). Same Fairchild RTL family as Block I (μL 914 single-NOR at v1.69 LM-1) but denser packaging — IC count REDUCED ~4,100 → ~2,800 while gate count INCREASED. **ELC Pass-2 Domain 12 (IC Qualification) advance 1-ex → 2-ex reproducibly-stable** — same manufacturer, same RTL family, density evolution; the qualification approach itself (not just the specific part) is now reproducibly validated.

**Track 4** — SPS #68 = **Downy Woodpecker** (*Dryobates pubescens*). Hutchinsonian congener pair with SPS #67 Hairy Woodpecker — same genus, sympatric niche partition via body size + bill mass + drumming frequency differentiation. Smaller body / smaller substrate / higher-pitched drumming illustrates "smaller vehicle, same ambition" parallel to Apollo 7's Saturn IB (smaller booster) reaching the same crewed-Apollo milestone Saturn V was being qualified for.

**Track 5** — Operational-debt fold-in: **3 lesson-candidate items closed** (#10194 inline-recovery doc + #10195 FTP sync tool repo-promotion + #10196 gh CLI path-resolution workaround). New `tools/ftp-sync.mjs` (18 vitest assertions) + `npm run ftp-sync` + CLAUDE.md ship-pipeline expansions covering all 3 items.

**Track 6** — TRS M0 Wave 1b retry COMPLETE (3-of-3 packs landed; +59 master.json records: pack-05 +20 / pack-06 +8 / pack-07 +31; master.json 137 → 196). Wave 1c (packs 09/10/11/12) DEFERRED to v1.49.591 due to Anthropic Sonnet quota exhaustion at Batch C dispatch (resets ~18:50 PDT same-day). The deferred-item directive from v1.49.589 §6 #1 is satisfied by Wave 1b retry; Wave 1c was v1.49.590-native scope per TRS-EXECUTION-MAP.md but not part of the deferred-items mandate. Four forward lessons emit at v1.49.590 (#10197 cadence soak / #10198 mid-mission MUS anchor / #10199 brief-error load-bearing / #10200 arXiv-direct-API 429 fallback canonical).

## Structural firsts

- **POST-FIRE-PROGRAM-RECOVERY §6.6 thread origination** — Apollo 7 = unambiguous 1st-exemplar of catastrophic-loss → halt → redesign → first-crewed-recovery thread; 3-criterion rubric passes cleanly. Watchlist 2nd-exemplar candidates: STS-26 Discovery (1988 post-Challenger), STS-114 (2005 post-Columbia), Soyuz 12 (1973 post-Soyuz-11). 3-exemplar reproducibly-stable expected ~v1.49.620+.
- **UPV thread *outcome-validated*** — Apollo 7's clean Block II CSM operation retroactively confirms the v1.69 + v1.70 UPV thread's predictive value (uncrewed precursor data → safe crewed first-flight). Thread does not advance to 3-exemplar (Apollo 7 is not itself a UPV mission) but its *load-bearing utility* is demonstrated.
- **Block II CSM era OPENS** — every subsequent crewed Apollo mission through ASTP (1975) flies a Block II variant.
- **Live-TV-from-space era OPENS** — RCA SSTV slow-scan B/W; precursor to Apollo 10 color → Apollo 11 lunar surface; NASA receives Television Academy Special Trustees Award.
- **Saturn IB crewed era OPENS and is SINGLETON** — Apollo 7 is the only crewed Saturn IB in Apollo-program proper; Saturn IB returns at Skylab (1973) + ASTP (1975).
- **MUS Domain 9 (Extended Form / Double Album) origination** — Electric Ladyland's 75-minute runtime + 4-side architecture establishes the thread; future candidates: White Album (1968-11-22), Layla (1970), Tommy (1969).
- **ELC Domain 12 (IC Qualification) reproducibly-stable** — Block I + Block II AGC = same RTL family, same Fairchild manufacturer, density evolution validates the qualification approach generalizes.
- **Three-track-plus-TRS pattern: 4** (was 3 at v1.49.589).
- **Mid-mission cultural anchor** — Electric Ladyland released 1968-10-16 mid-Apollo-7 mission (5 days in of 11-day flight); joins the v1.49.589 Bookends/MLK 24-hour anchor as a temporal-coincidence anchor.

## Forward lessons emitted

#10197 #10198 #10199 #10200

(See `chapter/04-lessons.md` for full lesson definitions and 3-criterion rubrics.)


## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED.

## Thread state forward to v1.72

- **POST-FIRE-PROGRAM-RECOVERY**: 1-exemplar origination. 2nd-exemplar candidate STS-26 (1988); 3-exemplar reproducibly-stable expected ~v1.49.620+.
- **UPV**: 2-exemplar reproducibly-stable; outcome-validated at v1.71. 3rd-exemplar candidates carry forward (Skylab 1, Buran, DM-1).
- **ALL-UP COMMITMENT**: 2nd-exemplar candidate evaluation at v1.72 Apollo 8 (first-crewed Saturn V + first-crewed translunar; Apollo 4 was 1-exemplar origin).
- **Crewed-Apollo era**: now ACTIVE.
- **First-crewed-translunar**: v1.72 Apollo 8 (1968-12-21).
- **First-lunar-landing**: v1.75 Apollo 11 (per Path Y CSV).
