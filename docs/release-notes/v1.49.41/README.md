# v1.49.41 — Green River

**Released:** 2026-03-25
**Scope:** GRV — Green River & the Seattle Sound, the 39th Research project and the deepest PNW-specific music history in the series, spanning Coast Salish traditions through grunge to the present day in eight research modules, a 999-line TeX mission pack, a 451-line deep-research source document, branded HTML/CSS, and a rendered mission-pack PDF
**Branch:** dev → main
**Tag:** v1.49.41 (2026-03-25T23:21:20-07:00) — merge commit `ad25eb2ac`
**Commits:** v1.49.40..v1.49.41 (3 commits: content `9e537bb5f` + release notes `1104672b7` + merge `ad25eb2ac`)
**Files changed:** 21 (+4,356 / −3 — the 3 deletions are navigation/index trims; nearly every line in the range is new research)
**Predecessor:** v1.49.40 — Dizz Knee Land (the DDA / dada single-band deep dive)
**Successor:** v1.49.42 — Post-Green-River Research Cadence
**Classification:** content — research release; single-project archive with deep PNW bioregional content, joining the Creative cluster under a new Music Research sub-cluster (WAL + DDA + GRV)
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** Mark Arm, Steve Turner, Stone Gossard, Jeff Ament, Bruce Fairweather, and Alex Vincent — the six founding and rotating members of Green River, whose band split into Mudhoney and Pearl Jam and proved that both paths were right
**Verification:** 8/8 research modules PASS · 34-source registry complete · 7/7 cultural-sensitivity checklist (Coast Salish traditions respected, Andrew Wood's death handled with care, Gary Ridgway reference factual not sensational) · 18 cross-linked projects · cross-series navigation (`series.js`) updated 37 → 38 entries · Research hub card added · hub stats incremented to 39 projects / 392+ files

> "Six bands on one compilation. One word in a fanzine letter. A name borrowed from a serial killer. The Seattle sound didn't announce itself — it just showed up."

---

## Summary

**The Seattle sound gets its Rosetta Stone entry, and it is authentically rooted in place.** v1.49.41 ships GRV — the 39th completed Research project — as an 8-module, 1,712-line study of how Pacific Northwest geography, isolation, and creative tension produced a sound that the rest of the world eventually called grunge. Unlike WAL (Weird Al Yankovic) and DDA (dada), whose PNW connections run through the Rosetta Stone framework as analogical bridges, GRV is the PNW directly. The project's bioregion is literally the Duwamish watershed — the 65-mile Green River that runs through King County, the same geography where Mark Arm, Steve Turner, Stone Gossard, Jeff Ament, and Bruce Fairweather made three records that fit on one CD and then split into two bands that each sold millions. Getting GRV into the research series is the point at which the Music Research sub-cluster stops being a pair (WAL + DDA) and becomes a triangulation: three bands, three relationships to commercial success, one shared question about how geography and infrastructure shape what music is allowed to exist.

**The TeX + deep-research dual-source authoring pattern produces richer output than either source alone.** The release shipped by merging two independently produced source documents into the eight research modules. `mission-pack/mission.tex` (999 lines) provides the broad Seattle Sound timeline — Coast Salish traditions, Jackson Street jazz, Northwest garage rock, proto-grunge, the split, the explosion, the post-grunge renaissance, the verification matrix — in the linear narrative shape that TeX is good at. `docs/research/green-river-band.md` (451 lines, 6,586 words, 31 sources) provides the Green River band specifics — formation dates, the LA guest-list incident, the Halloween 1987 breakup, the family tree, Jack Endino's production credits, the "ultra-loose GRUNGE" Sub Pop marketing copy. The build agent consumed both sources and produced modules that are deeper than either input: 8 modules averaging 214 lines each, with 34 cited sources, and cross-references into 18 related projects in the research series. This is the Eat It principle in action — consuming two sources and transforming them into something richer, not concatenating them and calling it done.

**The Green River family tree is this release's single most load-bearing diagram.** Module 05 ("Two Bands From One") contains an ASCII family tree that traces how Green River (1984–1987) split along a punk-vs-rock fault line into Mudhoney (Arm + Turner, Sub Pop, underground) and Mother Love Bone (Gossard + Ament + Fairweather + Andrew Wood on vocals, Polygram, commercial) — and then how Wood's death on March 19, 1990 routed that commercial lineage through Temple of the Dog (the 1990 tribute recording with Chris Cornell) and into Pearl Jam (with Eddie Vedder and Mike McCready, Epic Records, arena rock, 1990–present). The diagram is not decoration. It is the exact shape the Rosetta Stone framework describes at the conceptual level — one source material, two valid translations, both carrying the full information of the original — now made visible for a specific band in a specific place at a specific moment. Every later project that invokes "same source, two outputs" can point at this tree as the canonical reference implementation.

**Green River is literally where grunge was named.** Module 03 documents the origin of the word: Mark Arm, fronting Mr. Epp and the Calculations, wrote a 1981 letter to the Seattle fanzine *Desperate Times* mock-describing his own band as "pure grunge, pure shit." The term stuck. Five years later, Deep Six (C/Z Records, 1986) became the first document of a Seattle scene — six bands on one compilation, verifying that something coherent was happening in the same city at the same time. A year after that, Green River released Dry as a Bone (Sub Pop SP11, 1987) — the label's very first release — with marketing copy that called it "ultra-loose GRUNGE that destroyed the morals of a generation." The word that a global music press later used to describe an entire era was, at its origin, one musician's self-deprecating joke about his own band. The research captures that provenance precisely so later readers do not have to rediscover it.

**The release completes the Music Research sub-cluster and reveals a systems pattern about commercial outcomes.** With WAL (v1.49.36 era — Weird Al as the transformation principle), DDA (v1.49.40 — dada as the critical-acclaim-without-commercial-breakthrough principle), and now GRV, the research series has three bands that share a technical ceiling (all competent, all distinctive) but differ enormously in commercial outcome. Weird Al achieved massive commercial success through the transformation lens. dada achieved critical respect without commercial breakthrough. Green River achieved neither in its own lifetime but spawned two bands (Mudhoney and Pearl Jam) that together reshaped 1990s rock. The variable that separates these outcomes is not quality. It is infrastructure (Sub Pop, Epic, Polygram), timing (pre-MTV vs. peak-MTV), and whether the ambient system supported what the artist was making. This is a systems question, not a talent question. GRV makes the pattern legible by supplying the third corner of the triangle.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| GRV Research Project (39th) | Eight research modules at `www/tibsfox/com/Research/GRV/research/` totaling 1,712 lines; from Coast Salish traditions through the post-grunge scene of the 2020s |
| Module 01 — Ancestral Sounds | `01-ancestral-sounds.md` (195 lines): Coast Salish musical traditions, Jackson Street as Seattle's original music district, Ray Charles arriving at 16, Quincy Jones at Garfield High School, Ernestine Anderson, the segregated musicians' union |
| Module 02 — Garage Rock Era | `02-garage-rock-era.md` (196 lines): The Wailers + Etiquette Records, The Sonics' distortion as proto-punk, The Ventures' global reach, Jimi Hendrix from Seattle, "Louie Louie" by The Kingsmen as the garage-rock Rosetta Stone, the teen-dance circuit |
| Module 03 — Proto-Grunge | `03-proto-grunge.md` (239 lines): U-Men / Fastbacks / Accused, Mr. Epp and the Calculations, Green River formation 1984, Deep Six compilation (C/Z Records, 1986), Mark Arm's 1981 *Desperate Times* letter coining "grunge", Sub Pop founding by Bruce Pavitt + Jonathan Poneman |
| Module 04 — Discography | `04-green-river-discography.md` (228 lines): Come On Down (Homestead 1985, 6 tracks), Dry as a Bone (Sub Pop SP11 1987, 5 tracks — Sub Pop's FIRST release), Rehab Doll (Sub Pop 1988, 8 tracks), Jack Endino production credits, complete track listings with durations |
| Module 05 — The Split | `05-the-split.md` (225 lines): The punk-vs-rock tension, October 1987 LA guest-list incident, the Halloween breakup, the ASCII family-tree diagram, Mudhoney formation, Mother Love Bone → Temple of the Dog → Pearl Jam |
| Module 06 — Grunge Explosion | `06-grunge-explosion.md` (207 lines): The 1991 three-album watershed (Nevermind + Ten + Badmotorfinger), Sub Pop marketing, the Big Four, MTV + Lollapalooza, grunge fashion, Kurt Cobain's death (April 5, 1994) |
| Module 07 — Legacy / Living Scene | `07-legacy-living-scene.md` (223 lines): Post-grunge indie (Death Cab, Modest Mouse, Fleet Foxes), Seattle hip-hop (Sir Mix-a-Lot, Macklemore, Shabazz Palaces), electronic (Odesza, The Postal Service), KEXP as cultural institution, Sub Pop still independent, Green River reunion (2008–2009, 6 shows), Mark Arm at Sub Pop's warehouse |
| Module 08 — Verification Matrix | `08-verification-matrix.md` (199 lines): 8/8 PASS, 34-source registry, 7/7 cultural-sensitivity checklist, 18 cross-linked projects |
| TeX mission pack | `www/tibsfox/com/Research/GRV/mission-pack/mission.tex` (999 lines): broad Seattle Sound timeline in LaTeX source form, compiled to `green-river-seattle-sound-mission.pdf` (190,684 bytes) |
| Deep-research source | `docs/research/green-river-band.md` (451 lines, 6,586 words, 31 sources): band-specifics source document produced by the research agent, consumed by the build agent alongside the TeX |
| Mission-pack triad | `mission-pack/index.html` (150 lines) + `mission-pack/mission.md` (450 lines) + rendered PDF (190,684 bytes) — the standard per-project triad |
| Branded HTML + CSS | `index.html` (105 lines) + `page.html` (205 lines) + `mission.html` (59 lines) + `style.css` (70 lines), themed PNW rain — deep forest green `#1B5E20` with slate gray `#37474F` |
| Cross-series navigation | `series.js` updated 37 → 38 entries (GRV inserted between GRD and GSD2), Research hub `index.html` card added, main `index.html` stats incremented to 39 projects |
| Mission context | 451-line mission brief + 999-line TeX + 450-line deep-research source are the three primary authoring surfaces; the research modules are the published output |

---

## Part A: Green River & the Seattle Sound — The Research Project

- **Seattle as bioregional origin, not just music-industry geography.** Module 01 grounds the Seattle sound in Coast Salish musical traditions, Jackson Street's jazz district, and the segregated musicians' union of mid-century Seattle. The research does not start with Nirvana; it starts thousands of years earlier with the people who were already here, and it honors that lineage before it names any band.
- **Garage rock as the first signal of regional divergence.** Module 02 captures how PNW distance from LA and NY music industries forced a local infrastructure — Etiquette Records, the teen-dance circuit, "Louie Louie" as the de facto regional anthem — and how The Sonics' deliberately distorted amplifier tone foreshadowed the fuzz-pedal aesthetic that grunge would inherit two decades later.
- **The proto-grunge underground names itself.** Module 03 documents Mr. Epp and the Calculations, Green River's 1984 formation, the 1986 Deep Six compilation as the first document of a Seattle scene, and the provenance of the word "grunge" — Mark Arm's 1981 letter to *Desperate Times* fanzine.
- **Three records on one CD with room to spare.** Module 04 provides the complete Green River discography (Come On Down, Dry as a Bone, Rehab Doll) with track listings, durations, recording studios, Jack Endino's engineering credits, and the specific marketing copy Sub Pop printed on the Dry as a Bone sleeve.
- **The Halloween 1987 breakup as the Rosetta Stone moment.** Module 05 treats the band's dissolution as a Rosetta Stone event — one source text, two valid translations. The ASCII family-tree diagram traces the split into Mudhoney (the underground path) and Mother Love Bone → Temple of the Dog → Pearl Jam (the mainstream path).
- **The 1991 three-album watershed.** Module 06 places Nevermind, Ten, and Badmotorfinger on a single timeline and tracks how Sub Pop's marketing, MTV's rotation, and the Lollapalooza touring circuit converted a regional scene into a global phenomenon, including the reflexive cost — Kurt Cobain's death in April 1994.
- **Post-grunge as continuation, not termination.** Module 07 argues that the scene did not die with grunge; it transformed. Death Cab and Fleet Foxes (indie), Sir Mix-a-Lot and Shabazz Palaces (Seattle hip-hop), Odesza and The Postal Service (electronic), and KEXP as a cultural institution are all direct descendants of the same regional infrastructure that produced Deep Six.
- **Verification as the final module.** Module 08 is not summary — it is an explicit PASS/FAIL audit of the preceding seven modules against a 34-source registry and a 7-point cultural-sensitivity checklist, cross-linking GRV to 18 other projects in the research series.

## Part B: The Music Research Sub-Cluster (WAL + DDA + GRV)

- **Weird Al Yankovic (WAL) — transformation achieving commercial success.** The first entry in the Music Research sub-cluster. WAL modeled parody as transformation — the Rosetta Stone framework applied to pop lyrics — and the research series uses it as the commercial-success corner of the triangle.
- **dada (DDA) — critical acclaim without commercial breakthrough.** The second entry, shipped in v1.49.40 as *Dizz Knee Land*. DDA modeled wordplay as subversion and the cult-band phenomenon; the research series uses it as the respected-but-under-heard corner.
- **Green River (GRV) — no lifetime success, posthumous influence through descendants.** The third entry, shipped in v1.49.41. GRV is the corner of the triangle where the original band never charted, but its split descendants (Mudhoney, Pearl Jam) rewrote the commercial landscape. Quality was not the variable; infrastructure and timing were.
- **The triangulation makes a systems claim.** With three bands on the matrix, the research series can assert a pattern that no two bands alone could support: commercial outcome in music is primarily a function of infrastructure and timing, secondarily of the artist's work. The music is necessary; it is not sufficient.
- **Shared research scaffolding.** All three sub-cluster projects share the same scaffolding — research modules, mission-pack triad, brand CSS, verification matrix — so the comparison across them is structurally fair rather than methodologically noisy.
- **Coast Salish primacy.** Where WAL and DDA treat geography as secondary context (California suburbs, Minnesota), GRV makes bioregion primary. Coast Salish traditions are the first section of Module 01, not a footnote.
- **The Duwamish watershed as through-line.** The actual Green River is 65 miles long, runs through King County, and is part of the Duwamish watershed. The band, the river, and the dark context (Gary Ridgway, the Green River Killer, whose crimes shadowed the same geography) are treated together in the research, with factual accuracy and explicit respect.
- **Shared conclusion: isolation produces divergence.** All three projects, read together, arrive at the same conclusion that the ecology cluster arrived at from a different direction — isolation produces divergence, divergence produces originality, and the PNW has had more of both than the music industry's geographic assumptions typically credit.

---

## The Green River Family Tree

```
                    GREEN RIVER (1984-1987)
                   /                       \
          Mark Arm                    Stone Gossard
          Steve Turner                Jeff Ament
                |                    Bruce Fairweather
                |                         |
           MUDHONEY                MOTHER LOVE BONE
          (1988-present)            (1988-1990)
          Sub Pop Records           + Andrew Wood (vocals)
          The underground                |
          path                       Andrew Wood dies
                                     March 19, 1990
                                          |
                                    TEMPLE OF THE DOG
                                     (1990, tribute)
                                     + Chris Cornell
                                          |
                                      PEARL JAM
                                     (1990-present)
                                     + Eddie Vedder
                                     + Mike McCready
                                     Epic Records
                                     The mainstream path
```

Both paths were valid. Both produced decades of music. The tension that broke the band created more than the band could have made whole.

---

## Retrospective

### What Worked

- **The TeX + deep-research dual-source pattern produces the richest output.** The TeX mission pack provided the broad Seattle Sound timeline (6 modules from ancestral sounds to living scene). The deep-research agent provided Green River band specifics (formation, members, discography, family tree). The build agent merged both into 8 modules that are deeper than either source alone. This is the Eat It principle in action — consuming two sources and transforming them into something richer.
- **The PNW connection is genuine.** Unlike WAL and DDA (which connect to the PNW research through the Rosetta Stone framework as analogical bridges), GRV IS the PNW. Coast Salish traditions, Jackson Street, the Duwamish watershed, the rain, the isolation — this project maps the same bioregion as the ecology cluster but through music instead of species taxonomy. The research series becomes more coherent with each project that's authentically rooted in place.
- **The family tree diagram is the project's Rosetta Stone.** One band → two bands → one became the underground, the other became arena rock. The split is the translation layer. Same source material, two different outputs, both valid. This is exactly what the Rosetta Stone framework describes at the conceptual level, made visible in one ASCII diagram.
- **Cultural sensitivity held across fraught subject matter.** Coast Salish traditions are treated with context rather than used as decoration. Andrew Wood's death (March 19, 1990) is handled as the tragedy it was, not as a narrative device. Gary Ridgway is referenced factually and briefly, because the geographic coincidence matters and erasing it would be dishonest, but the band's story is not made to orbit his crimes. The 7/7 cultural-sensitivity checklist in Module 08 is a deliverable, not an afterthought.

### What Could Be Better

- **Module depth is lighter than WAL or DDA.** At 1,712 lines across 8 modules (avg 214 lines/module), GRV is thinner than WAL (3,043 lines, avg 338) or DDA (2,059 lines, avg 257). The broader scope (full Seattle timeline vs. single band) means each era gets less depth. A future pass could expand modules 01 (ancestral sounds) and 07 (living scene) with additional research.
- **The post-grunge modules could be their own projects.** Seattle hip-hop, the indie wave (Death Cab, Fleet Foxes), and the electronic scene (Odesza) each deserve the depth that Green River gets in modules 03-05. GRV covers them in one module (07) — adequate for context but not for scholarship.
- **Coast Salish traditions deserve a dedicated project.** Module 01 treats them as the first chapter of the Seattle music story, which is correct but not sufficient. An entire research project rooted in Coast Salish oral and musical traditions — with primary sources, community review, and appropriate permissions — would pay off debt that Module 01 can only acknowledge.

### What Needs Improvement

- **Source density could be deeper.** 34 cited sources across 1,712 lines is ~48 lines per source — adequate but not exhaustive. WAL and DDA ran closer to 30 lines per source. A follow-up pass should target ~30 to bring GRV into parity.
- **The 1991 watershed is told through three albums but could be told through three production teams.** Nevermind, Ten, and Badmotorfinger all had distinct producers (Butch Vig, Rick Parashar, Terry Date). Treating the production side as its own lens would add a dimension the current narrative does not carry.
- **The reunion (2008–2009, 6 shows) deserves its own module.** It is currently a paragraph in Module 07. A fourth discography module (post-reunion) would give that chapter the same treatment as the three original records.

---

## Lessons Learned

- **Geographic isolation is a creative pattern, not just a music fact.** The PNW's distance from industry centers (LA, NY, Nashville) forced musicians to build their own infrastructure (Sub Pop, Etiquette Records, C/Z Records). This same pattern appears in the ecology cluster (endemic species evolving in isolation), the infrastructure cluster (building systems from scratch), and the business cluster (WA state as distinct regulatory environment). Isolation produces divergence. Divergence produces originality.
- **Creative tension is productive when it splits cleanly.** Green River's punk-vs-rock tension was unsustainable within one band but enormously productive when it split into Mudhoney and Pearl Jam. The same principle applies to project architecture — when two approaches are genuinely incompatible, separate them rather than forcing compromise. Both paths can be right.
- **Three data points beat two.** The Music Research sub-cluster did not become useful until GRV was added. WAL + DDA alone could not make the commercial-outcome-is-systems-not-talent argument, because two bands is a pair, not a pattern. Three bands with three distinct outcomes is the minimum shape for a systems claim. Adding a third corner converts anecdote into triangulation.
- **Dual-source authoring beats single-source authoring.** The TeX timeline and the deep-research band file disagreed on small details (exact Halloween date, LA-incident attribution). The build agent resolving those disagreements by citing both sources produced better output than either single source would have. Disagreement between sources is information, not noise.
- **Name the thing after the place, not after the period.** Calling the release "Green River" rather than "Grunge" or "Seattle 1984" roots it in a specific river and a specific band. Period labels age fast; place labels do not. The river still runs; grunge as a marketing category is over.
- **Sub Pop SP11 is a historical artifact and should be treated as one.** Dry as a Bone was Sub Pop's very first release — catalog number SP11 because Bruce Pavitt and Jonathan Poneman started the numbering at 11 to make the label look established. That specific detail does more work in Module 04 than paragraphs of biography.
- **The Eat It principle applies to research, not just parody.** Eat It, as a compositional principle, was first named for Weird Al's transformation of Michael Jackson's "Beat It." GRV shows that the same principle applies to research authoring: consuming two sources (TeX + deep research) and producing a third thing that is neither, but is richer than either.
- **Verification modules should ship with the project, not after it.** Module 08 is the verification matrix, not a follow-up audit. The checklist is a deliverable. Shipping verification as the 8th module instead of a post-facto audit means the next reader does not have to wonder whether the first seven modules were checked.
- **Cultural sensitivity is not neutrality.** The Coast Salish material is not presented as "objective" because there is no neutral observer. It is presented as this project's best-effort summary from the sources that are available, with explicit pointers toward primary community sources for anyone who wants to go deeper. Acknowledging the authorship position is more honest than pretending not to have one.
- **Family-tree diagrams earn their space.** Module 05's ASCII tree is worth more than the paragraphs around it because the shape of the split is the argument. Prose describes splits; diagrams show them. When the shape is load-bearing, render the shape.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.40](../v1.49.40/) | Predecessor — DDA / dada, the second entry in the Music Research sub-cluster |
| [v1.49.38](../v1.49.38/) | Structural predecessor — multi-domain docroot refactor that put `www/tibsfox/com/Research/` at the correct path for GRV to land at |
| [v1.49.37](../v1.49.37/) | Content predecessor — 16-project PNW Research hub that GRV joins as the 17th PNW-rooted entry |
| [v1.49.42](../v1.49.42/) | Successor — continues the post-GRV research cadence |
| [v1.49.36](../v1.49.36/) | WAL — Weird Al Yankovic, first entry in the Music Research sub-cluster |
| [Research hub](../../../www/tibsfox/com/Research/index.html) | Hub card for GRV with cluster affiliation and cross-references |
| [series.js](../../../www/tibsfox/com/Research/series.js) | Cross-series navigation updated 37 → 38 entries (GRV between GRD and GSD2) |
| [GRV research modules](../../../www/tibsfox/com/Research/GRV/research/) | The 8-module research corpus (1,712 lines, 34 sources) |
| [GRV mission pack](../../../www/tibsfox/com/Research/GRV/mission-pack/) | TeX source (999 lines) + rendered PDF (190,684 bytes) + mission.md (450 lines) |
| [Deep-research source](../../../docs/research/green-river-band.md) | Band-specifics source document, 451 lines, 31 sources |
| PNW Research Series — ecology cluster | AVI, MAM, BPS, ECO as the bioregional baseline that GRV's music-research cluster references |
| PNW Research Series — creative cluster | WAL + DDA + GRV as the three Music Research sub-cluster entries |
| Sub Pop SP11 (Dry as a Bone, 1987) | The first Sub Pop release, documented in Module 04 as a historical artifact |
| Deep Six (C/Z Records, 1986) | The first document of a Seattle scene, documented in Module 03 as the compilation that verified a scene existed |
| Mark Arm's 1981 letter to *Desperate Times* | The original written coining of the word "grunge," documented in Module 03 as provenance |
| RETROSPECTIVE-TRACKER.md | Lessons 479–483 contributed by this release |

---

## Engine Position

v1.49.41 is the 39th completed Research project in the PNW Research Series and the third entry in the newly-coherent Music Research sub-cluster (WAL + DDA + GRV). It lands on the dev→main merge timeline on 2026-03-25 as a content release between v1.49.40 (DDA / Dizz Knee Land) and v1.49.42. In the larger release arc leading toward v1.50 (2026-04-21, the 50-years-of-Foxy milestone), GRV is a pre-milestone content anchor — the release that lets the Music Research sub-cluster stop being a pair and become a triangulation. The Research Series totals at this release: 39 projects, ~720 files, ~28 MB on disk, 376 research modules, ~187,000 lines. The next expected release in the cadence is v1.49.42, which continues the post-GRV research flow into the next research project; the Music Research sub-cluster is considered minimally complete at three entries and will be revisited rather than extended in the immediate next releases.

---

## Files

- `docs/release-notes/v1.49.41/README.md` — this document (the uplifted A-grade release notes)
- `docs/research/green-river-band.md` — 451 lines, 6,586 words, 31 sources; the deep-research band-specifics source consumed by the build agent
- `www/tibsfox/com/Research/GRV/index.html` — 105 lines; the GRV project landing page, PNW-themed (`#1B5E20` forest green + `#37474F` slate gray)
- `www/tibsfox/com/Research/GRV/page.html` — 205 lines; the long-form project page with the family-tree diagram rendered inline
- `www/tibsfox/com/Research/GRV/mission.html` — 59 lines; the per-project mission-pack bridge page
- `www/tibsfox/com/Research/GRV/style.css` — 70 lines; the GRV-specific brand CSS extending the PNW palette
- `www/tibsfox/com/Research/GRV/research/01-ancestral-sounds.md` — 195 lines; Coast Salish traditions, Jackson Street jazz
- `www/tibsfox/com/Research/GRV/research/02-garage-rock-era.md` — 196 lines; Wailers, Sonics, Ventures, Hendrix, Louie Louie, teen-dance circuit
- `www/tibsfox/com/Research/GRV/research/03-proto-grunge.md` — 239 lines; Mr. Epp, Green River 1984, Deep Six 1986, the word "grunge" coined
- `www/tibsfox/com/Research/GRV/research/04-green-river-discography.md` — 228 lines; Come On Down, Dry as a Bone (SP11), Rehab Doll, Jack Endino
- `www/tibsfox/com/Research/GRV/research/05-the-split.md` — 225 lines; Halloween 1987, the family-tree ASCII diagram, Mudhoney + Mother Love Bone
- `www/tibsfox/com/Research/GRV/research/06-grunge-explosion.md` — 207 lines; Nevermind + Ten + Badmotorfinger (1991), MTV, Lollapalooza, April 1994
- `www/tibsfox/com/Research/GRV/research/07-legacy-living-scene.md` — 223 lines; Death Cab, Fleet Foxes, Sir Mix-a-Lot, Macklemore, Shabazz Palaces, Odesza, KEXP, Sub Pop
- `www/tibsfox/com/Research/GRV/research/08-verification-matrix.md` — 199 lines; 8/8 PASS, 34-source registry, 7/7 cultural sensitivity, 18 cross-links
- `www/tibsfox/com/Research/GRV/mission-pack/mission.tex` — 999 lines; the TeX mission-pack source
- `www/tibsfox/com/Research/GRV/mission-pack/mission.md` — 450 lines; the markdown companion to the TeX source
- `www/tibsfox/com/Research/GRV/mission-pack/index.html` — 150 lines; the mission-pack landing page
- `www/tibsfox/com/Research/GRV/mission-pack/green-river-seattle-sound-mission.pdf` — 190,684 bytes; rendered mission brief
- `www/tibsfox/com/Research/index.html` — +12 lines; Research hub card added for GRV
- `www/tibsfox/com/Research/series.js` — +1 line; navigation updated 37 → 38 entries (GRV between GRD and GSD2)
- `www/tibsfox/com/index.html` — +2 / −1 lines; main hub stats updated to 39 Research Projects

---

> *Dedicated to Mark Arm, Steve Turner, Stone Gossard, Jeff Ament, Bruce Fairweather, and Alex Vincent — who named themselves after the river that runs through the place where they lived, made three records that fit on one CD, split into two bands that changed the world, and proved that both paths were right.*
>
> *The sound didn't start with grunge. It started with the people who were already here.*
