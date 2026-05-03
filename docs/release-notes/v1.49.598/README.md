# v1.49.598 — Apollo 14 Fra Mauro Highlands (NASA degree 1.78)

**Released:** 2026-05-03
**Type:** forward-cadence engine advance (NASA degree 1.78 + MUS 1.78 + ELC 1.78 + SPS #75)
**Predecessor:** v1.49.597 (GSD Intelligence Dashboard; counter-cadence; engine state held flat at NASA 1.77 / MUS 1.77 / ELC 1.77 / SPS #74)
**Mission package:** `.planning/missions/v1-49-598-apollo-14-fra-mauro/` (gitignored)
**Engine state:** ADVANCED — NASA 1.77 → 1.78 / MUS 1.77 → 1.78 / ELC 1.77 → 1.78 / SPS #74 → #75 / §6.6 register 21 → 23

## Summary

v1.49.598 ships the **Apollo 14 Fra Mauro Highlands** milestone — the recovery mission after Apollo 13's LOI abort, attempted again with the Cortright Report hardware redesign + the first wheeled vehicle on the Moon (the Modular Equipment Transporter / MET) + the first Apollo Guidance Computer in-flight software patch (Don Eyles' uplinked DSKY abort-bit-mask, ~60 keystrokes, ~2 hours from anomaly to patch) + the first successful sample-return from the lunar highlands (42.80 kg of anorthositic material ~4.0–4.5 Gyr old, predating mare basalts by ~500 Myr).

The cross-track structural pair anchors on **second-attempt-after-modest-precedent canonical re-establishment**: Apollo 14 = Apollo 13's mission attempted again; Carole King's *Tapestry* = King's solo voice attempted again after the modest *Writer* (1970) reception. Both released within the same Jan 31 – Feb 10 1971 window. *Tapestry* released 1971-02-10, INSIDE Apollo 14's mission window — the second observation point (after v596 *McCartney*) confirming the **#10232 INSIDE-window MUS pick soak**.

The three-track canopy-substrate pair (NASA Roosa PPK Douglas fir + redwood seeds → ELC Moon Trees Douglas fir + redwood survivors → SPS #75 Marbled Murrelet canopy nesting in same species) emerged from substrate-coherence properties of the v1.78 picks, not from thematic frame imposition. Forward-lesson #10236 emitted at v598 close: "cross-track structural pairs are discovered, not constructed — substrate-vs-frame epistemology established at v598."

**§6.6 register advances 21 → 23 at v1.49.598 close** — three dispositions G2-locked:
1. **GEOM (GEOLOGICAL-MOBILITY) 1-exemplar origination via MET** — ADMIT. All three canonical-criteria checks PASS + airtight three-part novelty resolution against Lunokhod 1 (crewed-pulled vs unmanned-remote-controlled / human-mobility-amplifier vs robotic-traverse / predates LRV as crewed wheeled mobility primitive).
2. **PERSISTENT-PROGRAM-CYCLE (PPC) 1-exemplar origination via Moon Trees lineage** — ADMIT. 55-year span 1971-2026 with Artemis I 2022 second-generation flight + 2023+ National Forest Foundation distribution lineage-renewal mechanism.
3. **PROCEDURAL-RECOVERY (PREC) — PROMOTE TO ESTABLISHED at 3-ex** reproducibly-stable. Apollo 12 SCE-to-AUX (founding) + Apollo 13 multi-recovery + Apollo 14 Eyles abort-bit patch.

Net register count: +2 (GEOM admit + PPC admit; PREC promote no count change).

**Build path: Tier 2 inline-Opus fallback** per W2-build-agent template (closes Lessons #10223 + #10228; soaked at v1.49.589 + v1.49.595 ship pipelines). Sonnet sub-agent dispatch was unavailable in flight-ops' tool surface for v1.49.598; main-context Opus inline-Edit recovery procedure applied. Per template documented quality verdict, Tier 2 ships at 78–89% predecessor-depth ratio (WARN-tier, ship-acceptable). NASA 1.78 actually achieved 99% lines / 115% bytes vs immediate predecessor NASA 1.77 — the strongest depth-audit result of any Tier-2-as-primary build to date.

## Cross-track / Engine state

- **NASA 1.78 — Apollo 14 (AS-509; CSM-110 Kitty Hawk + LM-8 Antares; Shepard / Roosa / Mitchell):** launched 1971-01-31 21:03:02 UTC after 40-minute weather hold (first Apollo weather-delayed launch); landed Fra Mauro highlands 1971-02-05 09:18:11 UTC at 87 m landing accuracy from target despite landing-radar lock-loss + breaker recycle; 33-hour surface stay with 2 EVAs totaling 9h 23m; 42.80 kg sample return including Big Bertha (sample 14321; 8.998 kg; potential ~4.0 Gyr terrestrial-zircon clast per Bellucci et al. 2019 actively-debated hypothesis); ALSEP-3 deployed (LRRR still operational 2026); MET 3.4 km EVA-2 traverse toward Cone Crater rim turning back ~30 m short per orbital photography (canonical NASA navigation-lessons training material that drove Apollo 15+ LRV inertial-navigation requirement); splashdown 1971-02-09 21:05:00 UTC recovered by USS *New Orleans* LPH-11.
- **MUS 1.78 — *Tapestry* (Carole King; Ode 77009; A&M Studios B; Lou Adler producer; released 1971-02-10):** 15 weeks #1 Billboard 200 (June 19 – October 1 1971); 4 Grammy Awards at 14th Annual Grammys (Album of the Year + Record of the Year + Song of the Year + Best Pop Vocal Performance Female); first solo female to win Album of the Year + first woman to win Song of the Year as solo songwriter. INSIDE Apollo 14 window — #10232 INSIDE-window soak observation #2 PASS.
- **ELC 1.78 — Moon Trees lineage (1971-2026):** Roosa PPK ~500 seeds 5 species → 84% post-flight germination at MSFC + Mississippi State (Dr. Stanley Krugman) → 1975-76 Bicentennial planting ~30 US states + 3 international gifts (Brazil + Switzerland + Vatican) → 80 surviving originals catalogued by NASA Goddard NSSDC 2026 → 2022 Artemis I second-generation seed flight → 2023+ NFF distribution to ~1,500 institutions → planned Artemis II/III continuations.
- **SPS #75 — Marbled Murrelet (*Brachyramphus marmoratus*):** Family Alcidae first-entry to SPS engine; structural pair with SPS #74 Northern Spotted Owl via shared old-growth-conifer-canopy substrate; only Pacific Coast alcid that nests in conifer canopy 30-50m above ground; first confirmed nest discovered 1974 at Big Basin Redwoods CA — last North American breeding bird to have its nest description published (185 years after Gmelin 1789 species description).
- **§6.6 register: 21 → 23.** GEOM admit + PPC admit + PREC promote-to-ESTABLISHED.
- **TRS substrate: M1 Foundation Wave 0–1 begun** at this milestone (M0 closed at v1.49.596).
- **Lesson #10221 (dev/main sync) ESTABLISHED:** `npm run ship-sync` canonical post-merge step continues to be HARD RULE; v598 maintains zero-commit drift through ship pipeline.
- **Build path: Tier 2 inline-Opus** (Sonnet sub-agent dispatch unavailable for v598; main-context Opus inline-Edit per W2 template).

## What shipped

| Track | Files | Notes |
|---|---|---|
| NASA 1.78 (Apollo 14) | 25 | full canonical 25-file build matching NASA 1.69 gold standard count; 251,483 bytes total; 13 artifacts across 5/5 categories; depth-audit PASS clean across all 6 submetrics (99% lines / 115% bytes / 7/7 canonical sections / 13/13 cross-link coverage) |
| MUS 1.78 (*Tapestry*) | 1 | index.html 71,112 bytes / 27 card-title h2 sections; depth-audit WARN ship-acceptable (91% lines / 87% bytes vs MUS 1.77 predecessor) |
| ELC 1.78 (Moon Trees) | 1 | index.html 57,838 bytes / 27 card-title h2 sections; depth-audit WARN ship-acceptable (100% lines / 80% bytes vs ELC 1.77 predecessor) |
| SPS #75 (Marbled Murrelet) | 1 | pass2-refinement.md 11,428 bytes / 76 lines; under 055-bewicks-wren predecessor parity but appropriate scope for Family Alcidae first-entry context |
| W3 verification gates | 3 new test files | Playwright smoke (#10222) for intelligence.html + dashboard-generator non-empty test (#10223) + vitest testTimeout bump (15000 → 20000 with execFileSync subprocess rationale comment block) |
| §6.6 register eval doc | 1 | mission-package work/synthesis/section-6-6-register-eval.md documenting all 3 G2-locked dispositions + watchlist for v1.49.599+ outcome-validation candidates |

## Forward-lessons emitted at v598 close (formal IDs)

1. **#10233 — Tier 2 inline-Opus as primary build path (soak observation #1).** v598 was the first invocation of Tier 2 as primary build path (not as Sonnet-dispatch fallback). Soak observation #1; v599-v601 may sustain or revert. Decision deferred.
2. **#10236 — Cross-track structural pairs are discovered, not constructed (substrate-vs-frame epistemology).** "The frame recognizes itself in the substrate, after the fact." v599 + downstream milestones inherit the framing.
3. **#10237 — §6.6 register dispositions deferred to W2 build evidence, not pre-decided in mission brief.** v1.78 brief defaulted to no Path-D admit; W2 surfaced two well-justified admits (GEOM + PPC) plus one promote (PREC). Future briefs should describe candidate-watchlists rather than pre-decide register movements.
4. **#10238 — Depth-audit Tier-2-vs-Tier-2 inflation; consider gold-standard-comparison extension.** Depth-audit's compare-against-immediate-predecessor heuristic may inflate Tier 2 results when the immediate predecessor is also a Tier 2 build (e.g. v1.78 vs v1.77 at 99% lines / 115% bytes). Consider extending depth-audit to also compare against the most recent gold-standard predecessor (e.g. v1.78 vs v1.69 at ~80% lines / ~85% bytes expected). Decision deferred to v599+ until the dispatch tool gap is closed and Tier-1 vs Tier-2 baseline can be re-established.

See `chapter/04-lessons.md` for full lesson body framings.

## Cadence

**11th instance** of established three-track-plus-TRS cadence per Lesson #10197 (v1.49.587-v1.49.595 as 9 instances; v1.49.596 as 10th; v1.49.597 was counter-cadence intelligence-dashboard milestone with engine held flat; v1.49.598 is 11th forward-cadence instance). Cadence pattern remains ESTABLISHED.

## See also

- `chapter/00-summary.md` — structural firsts at v1.49.598 close + engine state full enumeration
- `chapter/03-retrospective.md` — carryover lessons applied (#10185 + #10199 + #10203 + #10213 + #10221 + #10222 + #10223 + #10228 + #10231 + #10232) + new lessons emitted
- `chapter/04-lessons.md` — full body framings of #10233 + #10236 + #10237 + #10238 forward-lesson emits
- `chapter/99-context.md` — engine-state tables + §6.6 register full enumeration + Tier 2 build-path provenance
- `.planning/missions/v1-49-598-apollo-14-fra-mauro/` — full mission package (gitignored)
- `.planning/missions/v1-49-598-apollo-14-fra-mauro/work/synthesis/section-6-6-register-eval.md` — full §6.6 lock document (gitignored)
- `www/tibsfox/com/Research/NASA/1.78/` — NASA 1.78 25-file build (gitignored; FTP-staged via `node tools/ftp-sync.mjs 1.78`)
- `www/tibsfox/com/Research/MUS/1.78/index.html` — MUS 1.78 *Tapestry* index.html (gitignored; FTP-staged)
- `www/tibsfox/com/Research/ELC/1.78/index.html` — ELC 1.78 Moon Trees lineage index.html (gitignored; FTP-staged)
- `www/tibsfox/com/Research/SPS/research/releases/075-marbled-murrelet/pass2-refinement.md` — SPS #75 (gitignored)
