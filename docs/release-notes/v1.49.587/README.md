# v1.49.587 — Surveyor 7 / Lady Soul / Northern Spotted Owl / SCIENCE-MAXIMIZED FINAL-OF-SERIES

**Released:** 2026-04-29
**Type:** combined three-track ship — (Track 1) NASA forward-cadence quartet at degree 68 + (Track 2) ship-pipeline hardening + NASA CSV reconciliation + (Track 3) The Rendered Space M0 Wave 0 (NEW track parallel to NASA forward-cadence)
**Predecessor:** v1.49.586 (OAO-2 Stargazer / Mudhoney / Trumpeter Swan / CATALOG-WINDOW-OPENING)
**Mission package:** `.planning/missions/v1-49-587-mariner-6-7-twin-mars-flyby/`
**Source:** chronological-backfill resolution (Path Y) of 4-mission gap accumulated at v1.66/v1.67 thematic-prioritization decisions; W1a research dossier (6,900 words; caught 5 substantive brief errors); user-direction 2026-04-29 to add TRS Track 3 alongside NASA cadence
**Engine state:** ADVANCED — degree 67 → 68 (18.9% complete; 292 remaining)

## Summary

v1.49.587 ships the **first three-track-plus-TRS forward-cadence milestone**, opening the **SCIENCE-MAXIMIZED FINAL-OF-SERIES §6.6 thread origin candidate at single-exemplar status**, **closing the ALPHA-SCATTERING §6.6 thread at 3-exemplar** (Surveyor 5 v1.62 + Surveyor 6 v1.63 + Surveyor 7 v1.68), **closing the lunar-soft-lander era** (Surveyors 1-7 series end), and **advancing the op-amp era to 2-exemplar** via the Surveyor alpha-scattering charge-sensitive preamplifier (ELC 1.68 closes Domain 2 small-signal models at 4/4). Three founding-instance artifacts at three substrates instantiate one structural primitive: **science-maximized final-of-series** — an engineering-qualified series produces a terminal mission/album/monograph whose payload is dominated by science/artistic output rather than engineering-test objectives, exploiting accumulated qualification credit on the maximally-demanding target. NASA CSV reconciled (Path Y backfill: rewrites 1.66=Pioneer 9, 1.67=OAO-2 Stargazer to match shipped reality; inserts Surveyor 7 at 1.68; renumbers subsequent rows). The Rendered Space (TRS) program's M0 Wave 0 lands in parallel: 164 load-bearing claims extracted from the 923-page first-draft *The Space Between* PDF across 21/22 packs covering 33/33 chapters, establishing the search backlog for M0 Wave 1 across the next ~10 milestones per `TRS-EXECUTION-MAP.md`.

**Track 1 (NASA forward quartet — Surveyor 7):** Launched 1968-01-07 at 06:30:00 UTC on Atlas-Centaur AC-15 from CCAFS LC-36A; landed 1968-01-10 at Tycho crater rim (40.97°S, 11.44°W) — the **only Surveyor in lunar HIGHLANDS terrain** (all prior 1-6 in maria). Operated 45 days through 21 lunar nights (1968-01-10 to 1968-02-21) against 1-night design lifetime. 21,038 photos returned (V-flagged variants 21,274 / 21,091). Full instrument complement deployed simultaneously for the first time: TV camera + alpha-scattering instrument (3rd deployment, **Cm-242 source** 163d t½ 6.11 MeV) + surface sampler (2nd deployment after Surveyor 3 ONLY) + magnet array + dust detector. Alpha-scattering returned first lunar HIGHLAND elemental composition: anorthositic Al+Ca-rich, Fe+Mg-depleted vs maria-basaltic S5+S6 (Patterson, Turkevich et al. 1970 *Science* 168:825-828). Paired with **Aretha Franklin** *Lady Soul* (Atlantic SD 8176, released 1968-01-22 — 12 days after Surveyor 7 landing; Jerry Wexler + Tom Dowd + Arif Mardin produced; Columbia→Atlantic platform-qualification arc = SMFS at the album scale) and the **Northern Spotted Owl** (*Strix occidentalis caurina*, Merriam 1898; SPS #65; Forsman, Meslow & Wight 1984 *Wildlife Monographs* 87 founding monograph after 12-year observational campaign 1972-1984 = SMFS at the conservation-ecology scale).

**Track 2 (ship-pipeline hardening + CSV reconciliation):** Three deterministic gates landed end-to-end. **T2.1** SPICE renderer build automation (`tools/build-www-bundles.sh` + `npm run build:www-bundles` + `pre-tag-gate.sh` step 5; closes the v1.49.581 unwired-build gap that left 126 SPICE viewer pages 404 on tibsfox.com). **T2.2** CI-on-dev pre-merge gate (`pre-tag-gate.sh` step 4; HARD RULE per user direction 2026-04-29 — verify CI passes on dev before pushing to main; resolves origin/dev SHA, queries gh CLI, blocks unless `conclusion=success`; override `SC_SKIP_CI_GATE=1` emergency only). **T2.3** NASA CSV Path-Y reconciliation (`tools/nasa-csv-path-y-reconciliation.py`; idempotent atomic renumber; rewrites 1.66=PIONEER-9 + 1.67=OAO-2; inserts Surveyor 7 at 1.68; shifts old 1.71+ rows +1; 449 rows in → 450 rows out). All landed at commit `28cd2007a` + `40520d97f`.

**Track 3 (The Rendered Space M0 Wave 0 — NEW):** Per the 6-mission TRS program scoped 2026-04-29, v1.49.587 ships the smallest atomic unit (M0 Wave 0): PDF claim-extraction from the 923-page first-draft *The Space Between* textbook. **164 load-bearing claims extracted** across 21/22 packs (pack-19 formal-languages/L-systems empty per genuine-coverage gap), 33/33 chapters covered, 6 of 8 categories used (numerical / attribution / historical / music-theory / physics-constants / definitions). Output: `.planning/missions/the-rendered-space/m0-research/work/extract/topic-map.json` (91.9 KB). The TRS-EXECUTION-MAP.md aligns the full 6-mission program to NASA-cadence atomic units across v1.49.587-v1.49.620+, with NASA cadence dominating (failed TRS unit doesn't block NASA ship).

**Build artifacts:** 49 files across `www/tibsfox/com/Research/{NASA,MUS,ELC}/1.68/` (~698KB total) + 1 file at `.planning/missions/the-rendered-space/m0-research/work/extract/` (TRS Wave 0). Cross-track sidebar consistency on 6 HTML pages; bidirectional cross-track links live across all three index pages. Forward-link enabled NASA 1.67 → 1.68 + ELC 1.67 → 1.68 + MUS 1.67 → 1.68 nav-cards; catalog-index entries added on NASA / MUS / ELC; NASA `completedMissions` Set extended through 1.68.

## Cross-track / Engine state

- **NASA degree 68/360** (18.9% complete; 292 remaining). Ninth hard-gated forward degree. CHAIN-CONVENTIONS v1.4 (ninth full use; no bump).
- **§6.6 register at v1.68 close: 12 exemplars across 2 reproducibly-stable + 6 candidate variants.** NEW SCIENCE-MAXIMIZED FINAL-OF-SERIES thread at single-exemplar; ALPHA-SCATTERING thread closes at 3-exemplar.
- **ELC Pass-1 Domain 2 closure 4/4** with discrete-BJT charge-sensitive preamplifier primitive. Op-amp era advances 1-ex → 2-ex.
- **MUS Pass-2 over-target Domain 3 advance** — second MUS Pass-2 over-target after v1.67 Domain 7. Aretha *Lady Soul* SMFS-at-album-scale primitive.
- **simulation.js block #68** registered as `forest-module/surveyor-7-highland-ejecta.js` per v1.59+ standard (per-mission canonical block; aggregator merge deferred per pattern).
- **5 substantive brief-error corrections** caught at G0 gate (W1a research dossier) and applied through G0-LOCKED-DECISIONS: alpha source Cm-244 → **Cm-242** (163d t½, 6.11 MeV); surface sampler "S3+S6+S7" → **S3 + S7 ONLY** (S6 carried alpha-scattering + TV only); fictional citation "Turkevich 1969 *Science* 165:277" → **Turkevich et al. 1968 *Science* 162:117 + Patterson, Turkevich et al. 1970 *Science* 168:825-828**; photo count → **21,038 with V-flag** (variants 21,274 / 21,091); landing coords 40.86°S 11.47°W → **40.97°S 11.44°W** (~7 km correction).

## Threads closed / opened / extended

- **OPENED:** SCIENCE-MAXIMIZED FINAL-OF-SERIES §6.6 thread origin candidate at single-exemplar (NEW thread; Surveyor 7 + Lady Soul + Forsman 1984 triad). 3-criterion rubric: (a) explicit qualification arc through prior series instances, (b) maximally demanding target, (c) terminal output exceeds predecessors per kg/per-track.
- **CLOSED:** ALPHA-SCATTERING §6.6 thread at 3-exemplar (Surveyor 5 v1.62 → Surveyor 6 v1.63 → Surveyor 7 v1.68). Same instrument architecture deployed across compositionally-distinct lunar terrains; closure criterion = architecture stability + terrain diversity + data discrimination capability validated.
- **CLOSED:** lunar-soft-lander era (Surveyors 1-7, 1966-1968 series end). Apollo era opens for crewed surface science.
- **CLOSED:** ELC Pass-1 Domain 2 (small-signal models) at 4/4 with discrete-BJT charge-sensitive preamplifier primitive.
- **EXTENDED:** Op-amp era 1-exemplar (v1.67 OAO-2) → 2-exemplar (v1.68 Surveyor alpha-scattering CSP).
- **EXTENDED:** Cross-substrate triad-as-structural-primitive declaration discipline (per v1.67 lesson #10177): SMFS thread declared at NASA + MUS + ELC + SPS subject-spec.json + cross-references/links.json.
- **CARRY-FORWARD:** CATALOG-WINDOW-OPENING single-exemplar (v1.67 OAO-2; not extended at v1.68 — Surveyor 7 is engineering-qualified terminal-mission, not catalog-window-opening); GRACEFUL-ATTRITION single-exemplar (v1.66 Pioneer 9; not extended); PERSISTENT-CONSTELLATION-LISTENER 2-exemplar (v1.65/66; not advanced); FORM-AS-MULTIPLICITY-COORDINATION single-exemplar (v1.66; not advanced).

## NASA CSV reconciliation note (Path Y)

v1.49.587 reconciles the divergence between shipped reality (1.66 = Pioneer 9 Nov-1968, 1.67 = OAO-2 Dec-1968) and the canonical CSV ordering (which had 1.66 = Surveyor 7 Jan-1968). Per user direction 2026-04-29 ("missions in chronological order, one per release; expand CSV for gaps; every mission gets a release"), the resolution is CSV expansion (rewrite 1.66/1.67 to match reality; insert Surveyor 7 at 1.68 as backfill of the chronologically-skipped Jan-Oct 1968 block — Surveyor 7, Apollo 5, Apollo 6, Apollo 7) rather than rebuilding ship reality. Strict version=chronology resumes from 1.72 forward; one-time inversion at 1.66/1.67 is documented and contained. Forward planning: v1.49.588 = Apollo 5; v1.49.589 = Apollo 6; v1.49.590 = Apollo 7; v1.49.591 = Apollo 8; etc.

## Forward lessons emitted

4 new lessons #10179-#10182 (see `chapter/04-lessons.md`):
- #10179 — SCIENCE-MAXIMIZED FINAL-OF-SERIES as a structural primitive distinct from CWO/SAF/PCL/FAMC (3-criterion rubric)
- #10180 — ALPHA-SCATTERING thread closure criterion (architecture stability + terrain diversity + data discrimination capability)
- #10181 — NASA CSV reconciliation pattern (Path Y backfill): when forward-cadence ship reality diverges from canonical CSV, expand CSV not rebuild ship reality
- #10182 — Three-track-plus-TRS milestone pattern: NASA cadence dominates; failed TRS unit doesn't block NASA ship; soft cycles bounded per Part of book

## Thread state

CHAIN-CONVENTIONS stays at v1.4 (ninth full use; no bump). SCIENCE-MAXIMIZED FINAL-OF-SERIES joins §6.6 candidate amendments at single-exemplar. ALPHA-SCATTERING removed from active candidate list (closed at 3-exemplar).

---
**Prev:** [v1.49.586](../v1.49.586/README.md) · **Next:** v1.49.588+
