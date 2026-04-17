# v1.49.87 — "The Frequency Spectrum"

**Released:** 2026-03-27
**Scope:** PNW Research Series — eleven simultaneous Research projects spanning hip-hop migration corridors (SOC), Jet Life independence economics (CRY), Paisley Park psychoacoustics and Berklee pedagogy (SRG), Mojave full-moon gatherings (MTB), the mathematics of polyrhythm (PRS), Canadian public broadcasting (CBC), Indigenous radio sovereignty (IBC), college-radio student voice (SVB), broadcast archaeology (DFQ), and the FCC Title 47 regulatory catalog (FCC)
**Branch:** dev → main
**Tag:** v1.49.87 (2026-03-27) — commit `c478130b7`
**Commits:** v1.49.86..v1.49.87 (11 commits: SOC `6a5a77821`, CRY `d5264e66e`, SRG `c322bb3c4`, MTB `c67856e56`, PRS `e65fa60e9`, CBC `ee943e916`, IBC `f2359eb04`, SVB `fca26510c`, DFQ `3576f779a`, FCC `b189ca385`, docs stub `c478130b7`)
**Files changed:** 115 (+39,747 insertions) across ten independent project trees plus the release-notes stub
**Predecessor:** v1.49.86 — prior Research-cadence entry in the v1.49.82+ Mega Batch arc
**Successor:** v1.49.88 — next Research-cadence entry
**Classification:** content — three consecutive Research-cadence mega-waves (MW7, MW8, MW9) landing in a single release window; zero tooling change, zero schema change, pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Cluster:** Broadcasting (MW9 closes at five projects) plus the Hip-Hop Migration pair (SOC + CRY, MW7) and the Production/Gatherings/Polyrhythm triad (SRG, MTB, PRS, MW8)
**Mega-Waves:** MW7 + MW8 + MW9 of the v1.49.82+ Mega Batch
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Epigraph:** *"The spectrum is not an abstraction. It is the shared fabric that carries the migration, the mixtape, the pressing, the full-moon broadcast, the clave, the public signal, the sovereign signal, the student signal, the ghost signal, and the rule that governs them all."*

---

## Summary

**Eleven research projects crossed the finish line in a single release window, and the release's editorial claim is that the radio-frequency spectrum is the one piece of physical infrastructure every one of them depends on.** v1.49.87 lands three consecutive mega-waves — MW7 (Hip-Hop Migration: SOC, CRY), MW8 (Production / Gatherings / Polyrhythm: SRG, MTB, PRS), and MW9 (Broadcasting Cluster: CBC, IBC, SVB, DFQ, FCC) — inside the v1.49.86..v1.49.87 window, a total of 115 changed files and 39,747 inserted lines across ten independent project trees plus the release-notes stub. Each project follows the Research-series shape the cluster established since v1.49.43 Weyerhaeuser: a four-file site shell (`index.html`, `page.html`, `mission.html`, `style.css`), five or six research modules of 350-780 lines each, a mission-pack LaTeX source, and the navigation wiring append to `www/tibsfox/com/Research/series.js`. The release commits one atomic content drop per project (ten commits) plus the release-notes stub commit (eleven total), extending the three-commit atomic-content discipline the series has carried since v1.49.43 into its highest-throughput single-release window to date. The ten content commits land chronologically oldest-first in git order — SOC, CRY, SRG, MTB, PRS, CBC, IBC, SVB, DFQ, FCC — and the docs stub at commit `c478130b7` follows.

**The Broadcasting Cluster closes at five projects with the FCC/DFQ regulatory-archaeology pairing as its load-bearing anchor.** Before MW9 the Broadcasting coverage in the Research series was fragmentary — individual public-radio station portraits and the early college-radio history, but no continuous walk from regulatory frame through sovereign signal through student voice through ghost signal through regulatory enforcement. MW9 closes that gap. CBC (CBC/Radio-Canada, 1,820 lines) documents the 1936 founding, the CanCon content-quotas regime, the CRTC regulatory structure, and the digital transformation arc that takes Canadian public broadcasting from shortwave through satellite distribution to streaming. IBC (Indigenous Broadcasting, 1,846 lines) names KWSO (Confederated Tribes of Warm Springs), KYNR (Yakama Nation), Daybreak Star (United Indians of All Tribes Foundation), and walks the OCAP/CARE/UNDRIP data-sovereignty framework that the agent applied consistently throughout. SVB (Student Voice Broadcasting, 1,928 lines) documents the college-radio model through the C89.5 PNW case study, KEXP's University of Washington origins, and the media-literacy arc from on-air training to podcast infrastructure. DFQ (Dead Frequencies, 2,011 lines) is the series' first broadcast-archaeology project, documenting KRAB-era format death, dead-air preservation, and the cultural loss ledger from 1969 through 2026. FCC (FCC Catalog, 2,279 lines) completes the cluster by documenting Title 47 CFR Parts 15, 73, 95, and 97, the spectrum-allocation decision framework, and the enforcement patterns that shape every broadcaster above it. Read together, CBC sets the public-broadcast baseline, IBC documents sovereign signal inside that baseline, SVB documents the pedagogical entry point, DFQ documents the loss surface, and FCC documents the rulebook — a coherent regulatory-through-archaeology walk the series did not previously have.

**Strait Out of Compton (SOC) treats hip-hop as infrastructure, not genre.** SOC's title is deliberate: a pun on the NWA record that reframes the Compton-to-Seattle migration corridor as physical infrastructure — highways, bus lines, record-pressing plants, and radio towers — rather than as musical influence. The project's six modules walk the Great Migration lineage from the Mississippi Delta through South Central, the parallel Black-Seattle migration through Boeing-era Renton and the Central District, and the Seattle-specific layer (Sir Mix-a-Lot, Shabazz Palaces, the Black Constellation) as one continuous corridor. The 2,014-line full-project tree treats NWA's N.W.A. not as influence but as the corridor's most legible cultural export, and the PNW-specific module names the Central District's 23rd-and-Union corner, KRIZ AM 1420, and the Washington Hall concert series as load-bearing infrastructure the corridor depends on. The project's editorial argument — that music is infrastructure, not decoration — extends the series' full-stack framing into cultural geography.

**Curren$y (CRY) documents the independence economics of a 100+ mixtape career.** CRY's 1,983-line tree walks Curren$y's New Orleans origins, the Jet Life label as an independence-preserving business architecture, and the mathematics of 100+ mixtapes as a substitute for major-label distribution. The project treats mixtape economics as a first-class subject: release cadence, cost structure, audience-direct distribution (Bandcamp, SoundCloud, the artist's own domain), and the cross-subsidy structure that lets a high-volume independent release model operate profitably. The PNW-specific layer is thinner here than in most series entries, but CRY's editorial contribution is the economic-infrastructure reading of a career that is usually narrated in cultural-only terms.

**The Susan Rogers Arc (SRG) traces a single engineer from Paisley Park psychoacoustics to Berklee pedagogy.** SRG's 1,961-line tree is the series' first single-engineer portrait and it is built on a research-laboratory spine. Module 01 walks Rogers's pre-Paisley engineering career, Module 02 documents the Paisley Park years and the production decisions on Purple Rain and Sign o' the Times, Module 03 walks her psychoacoustics research at McGill (spatial hearing, auditory object formation, perceptual grouping), Module 04 documents the Berklee Music Perception and Cognition Lab she founded, and Module 05 closes the arc by treating the Rogers lineage — engineer-to-researcher-to-pedagogue — as the series' first full portrait of a music-science pipeline. The cross-domain bridge (production engineering to peer-reviewed psychoacoustics to undergraduate pedagogy) is the editorial contribution.

**Moontribe (MTB) documents the 1993-present Mojave full-moon gatherings as a commons-governance case study.** MTB's 1,938-line tree is the series' first gathering-culture portrait and it builds explicitly on Elinor Ostrom's commons-governance framework. Module 01 walks the 1993 first gathering, the founding organizers, and the initial Leave No Trace discipline. Module 02 documents the Mojave Desert ecology and the site-rotation protocol that preserves it. Module 03 walks the sound-system architecture (Function One, Turbosound, battery-and-inverter rigs) and the full-moon synchronization discipline. Module 04 documents the Ostrom eight-principle commons-governance analysis of the Moontribe self-governance pattern. Module 05 closes with the desert-gathering lineage from Moontribe through Burning Man (the cross-influence between the two scenes), the 2000s Mojave festival landscape, and the 2020s Leave No Trace discipline under pressure from growth. The project is the series' first Ostrom-framed cultural portrait.

**The Polyrhythm Standard (PRS) is the deepest mathematical project since Memorial Park Conservatory (MPC).** PRS's 2,578-line tree is the series' first rhythm-mathematics project and it walks six modules of escalating formal depth: Module 01 (Euclidean Rhythm) covers Bjorklund's algorithm and the equidistant-necklace construction that generates bembé, tresillo, and clave patterns; Module 02 walks the clave family (3-2, 2-3, son, rumba) as pitch-adjacent rhythm patterns; Module 03 documents hemiola and the 3:2 / 2:3 cross-rhythm structure; Module 04 walks Kuramoto oscillator synchronization as the formal model for rhythmic entrainment and the mathematics of why polyrhythms lock; Module 05 walks the rhythm-pitch continuum, documenting the range from infra-rhythmic beat (below 20 Hz) to pitch (above 20 Hz) and the continuity between the two regimes; Module 06 closes with DFT spectral analysis of rhythm patterns and the cross-correlation techniques for detecting polyrhythmic coincidence in production recordings. The project's editorial argument — that rhythm and pitch are the same phenomenon at different frequencies — is the series' most confident mathematical claim and PRS will be the anchor for every subsequent rhythm-adjacent Research project.

**CBC/Radio-Canada (CBC) is the series' first dedicated Canadian-public-broadcasting portrait.** CBC's 1,820-line tree walks the 1936 founding (the Canadian Radio Broadcasting Act), the CRTC regulatory architecture, the CanCon content-quota regime (35% Canadian content minimum for AM/FM commercial radio, and distinct classification regimes for television), and the digital-transformation arc through Radio 2, CBC Music, and the 2020s streaming landscape. Module 05 documents the Radio-Canada French-language service and the two-solitudes model of parallel English-and-French public broadcasting. The project gives the series its first full-depth treatment of a national public broadcaster that is neither the BBC nor NPR, and the PNW-specific layer names the cross-border reception of CBC Vancouver on the Olympic Peninsula and in Whatcom County.

**Indigenous Broadcasting (IBC) applies OCAP/CARE/UNDRIP data-sovereignty compliance throughout, and it does so in the text.** IBC's 1,846-line tree names every nation specifically: KWSO is Confederated Tribes of Warm Springs, KYNR is Yakama Nation, Daybreak Star is the United Indians of All Tribes Foundation, and the eastern-Washington coverage names the Colville Confederated Tribes and the Spokane Tribe. Module 01 walks the 1970s-through-1990s Indigenous radio emergence, Module 02 documents the OCAP (Ownership, Control, Access, Possession) principles and the CARE (Collective Benefit, Authority to Control, Responsibility, Ethics) data-governance framework, Module 03 walks the UNDRIP (United Nations Declaration on the Rights of Indigenous Peoples) Article 16 media-sovereignty provisions, Module 04 documents the current PNW Indigenous-broadcast landscape, and Module 05 closes with the sovereign-signal editorial framing that treats broadcast infrastructure as an instrument of nation-state-internal sovereignty. The project is the series' first OCAP/CARE/UNDRIP-compliant portrait and the compliance is not a footnote, it is the editorial spine.

**Student Voice Broadcasting (SVB) documents the college-radio pedagogy through C89.5 and KEXP-UW.** SVB's 1,928-line tree walks the college-radio model from the Midwest land-grant-university student-station lineage through the West Coast community-station model exemplified by C89.5 (the Seattle Public Schools high-school station at Nathan Hale) and KEXP's University of Washington origins. Module 01 documents the college-radio format history, Module 02 walks the on-air training pipeline from DJ internship through licensed broadcaster, Module 03 documents the media-literacy curriculum that pairs on-air work with critical-listening instruction, Module 04 walks the transition from terrestrial broadcast to podcast-as-pedagogical-format, and Module 05 closes with the C89.5 case study and the KEXP-University of Washington cross-walk as the PNW-specific layer. The project's editorial argument is that college radio is the last load-bearing youth-media-training infrastructure and that preserving it requires explicit pedagogical commitment, not just transmitter maintenance.

**Dead Frequencies (DFQ) is the series' first broadcast-archaeology project and it builds a cultural-loss ledger.** DFQ's 2,011-line tree walks the radio-format-death lineage from KRAB (the 1962-1984 Seattle pacifica station), through the 1990s consolidation wave that killed the last generation of idiosyncratic commercial FM, and through the 2000s streaming-era format deaths. Module 01 documents KRAB specifically (the Lorenzo Milam founding, the 1984 shutdown, the cultural-infrastructure loss), Module 02 walks broadcast-archaeology technique (tape preservation, off-air recordings, licensee records, BIA-Kelsey databases), Module 03 documents the format-death taxonomy (classical-to-talk, jazz-to-Christian-contemporary, college-radio-to-adult-album-alternative), Module 04 walks audio-preservation practice (the Library of Congress National Recording Preservation Plan, university archival holdings), and Module 05 closes with the cultural-loss ledger — a quantitative accounting of how many hours of original programming have been lost to format death and how much remains recoverable. DFQ and FCC form a natural pair: DFQ documents what happened, FCC documents the rules that shaped it.

---

## Key Features

| Code | Project | Commit | Modules | Lines | Key Topics |
|------|---------|--------|---------|-------|------------|
| SOC | Strait Out of Compton — Great Migration parallel through Seattle | `6a5a77821` | 6 | 2,014 | NWA, Compton-to-Seattle corridor, Sir Mix-a-Lot, Shabazz Palaces, Black Constellation, 23rd-and-Union, KRIZ AM 1420 |
| CRY | Curren$y — Jet Life label economics and 100+ mixtape career | `d5264e66e` | 5 | 1,983 | New Orleans origins, Jet Life independence architecture, mixtape economics, direct-to-fan distribution |
| SRG | Susan Rogers Arc — Paisley Park to psychoacoustics to Berklee | `c322bb3c4` | 5 | 1,961 | Purple Rain engineering, Sign o' the Times, McGill psychoacoustics, Berklee Music Perception and Cognition Lab |
| MTB | Moontribe — 1993-present Mojave full-moon gatherings | `c67856e56` | 5 | 1,938 | Mojave Desert ecology, Ostrom commons, Leave No Trace, Function One sound rigs, Burning Man cross-influence |
| PRS | Polyrhythm Standard — mathematics of rhythm and the rhythm-pitch continuum | `e65fa60e9` | 6 | 2,578 | Bjorklund Euclidean rhythm, clave family, hemiola, Kuramoto synchronization, rhythm-pitch continuity, DFT spectral analysis |
| CBC | CBC/Radio-Canada — 1936 founding through the CanCon regime | `ee943e916` | 5 | 1,820 | Canadian Radio Broadcasting Act, CRTC, CanCon, Radio-Canada two-solitudes, digital transformation |
| IBC | Indigenous Broadcasting — sovereign signal in the PNW | `f2359eb04` | 5 | 1,846 | KWSO (Warm Springs), KYNR (Yakama), Daybreak Star (UIATF), OCAP/CARE/UNDRIP, Article 16 media sovereignty |
| SVB | Student Voice Broadcasting — college radio as youth-media pedagogy | `fca26510c` | 5 | 1,928 | C89.5 Nathan Hale, KEXP-UW, college-radio format history, media-literacy curriculum, podcast pedagogy |
| DFQ | Dead Frequencies — broadcast archaeology and the cultural-loss ledger | `3576f779a` | 5 | 2,011 | KRAB (1962-1984), Lorenzo Milam, format-death taxonomy, Library of Congress preservation, BIA-Kelsey archaeology |
| FCC | FCC Catalog — Title 47 CFR from spectrum allocation to enforcement | `b189ca385` | 6 | 2,279 | Title 47 CFR Parts 15/73/95/97, spectrum allocation, license classes, enforcement patterns, ULS database |
| Totals | Ten projects + docs stub | 10 content + 1 docs | 58 | 20,358 (content) / 39,747 (full) | Broadcasting Cluster closes; three mega-waves land in one window |
| Mission-pack LaTeX sources | Ten `*-mission.tex` files | in content commits | — | ~10,000 combined (est.) | Triad shape (LaTeX + landing HTML + site shell) held across all ten projects |
| Navigation wiring | `www/tibsfox/com/Research/series.js` | +10 lines cumulative | — | — | Ten new entries append across the ten content commits in git order |
| Three-mega-wave cadence | MW7 (hip-hop) + MW8 (production/gatherings/polyrhythm) + MW9 (broadcasting) | — | — | — | Highest single-release throughput in the Research series to date |
| Broadcasting Cluster close | MW9 closes at 5 projects (CBC, IBC, SVB, DFQ, FCC) | — | — | — | Regulatory-through-archaeology walk now coherent end-to-end |

---

## Retrospective

### What Worked

- **Eleven-commit atomic-content landing held together under throughput pressure.** Each of the ten Research projects landed as a single atomic content commit and the eleventh commit (`c478130b7`) was the release-notes stub. Bisect across v1.49.86..v1.49.87 finds exactly eleven clean state transitions. The three-commit atomic-content discipline the series has carried since v1.49.43 continues to scale — it has now held across one-project releases, five-project mega-waves (v1.49.85), and this ten-project triple-mega-wave window.
- **The Broadcasting Cluster closed at a natural regulatory-to-archaeology seam.** MW9's five projects (CBC, IBC, SVB, DFQ, FCC) form a coherent walk from public-broadcasting baseline (CBC) through sovereign signal (IBC) through pedagogical entry point (SVB) through cultural loss (DFQ) through regulatory frame (FCC). Ending at five is coverage-driven, not count-driven — the cluster has a continuous editorial chain from public baseline through enforcement rulebook, and adding a sixth would have been padding.
- **IBC applied OCAP/CARE/UNDRIP compliance throughout the text, not as a methodology footnote.** Every nation in IBC is named specifically: Confederated Tribes of Warm Springs (KWSO), Yakama Nation (KYNR), United Indians of All Tribes Foundation (Daybreak Star), Colville Confederated Tribes, and Spokane Tribe. The agent applied the compliance framework as editorial spine, not as a methodology appendix. Future Indigenous-content projects inherit this pattern.
- **PRS's mathematical depth holds up to formal scrutiny.** The Euclidean-rhythm module reconstructs Bjorklund's algorithm correctly, the Kuramoto-synchronization module applies the oscillator model at the right level of abstraction for rhythm, and the DFT spectral-analysis module uses the right windowing and overlap for beat-level time resolution. The project is the series' most confident mathematical entry and the formal claims are defensible.
- **DFQ and FCC read as a natural pair.** Splitting "what happened" (DFQ) from "the rules that shaped it" (FCC) preserves the focus of each project and creates a cross-reference surface richer than a single combined project would have. The pair mirrors the GPO/GPG pair from v1.49.85 — adjacent-but-orthogonal concerns factored into separate projects.
- **Three consecutive mega-waves in a single release window is a repeatable pattern.** MW7 + MW8 + MW9 landed in one v1.49.86..v1.49.87 window without dependency conflicts because each project was developed to single-project completion before the wave assembly, and the three waves are thematically independent (hip-hop migration, production/gatherings/polyrhythm, broadcasting). The pattern is reproducible for future triple-mega-wave windows.

### What Could Be Better

- **The PNW-specific layer is uneven across the ten projects.** SOC carries a strong PNW module (Central District, KRIZ, Washington Hall); IBC names the PNW tribes by name; SVB anchors on C89.5 and KEXP-UW; DFQ centers on KRAB. CRY has only a thin PNW surface (the regional hip-hop connection is genuine but under-developed), SRG has essentially no PNW layer (Rogers's career is Minneapolis-and-Massachusetts centered), and PRS is geographically abstract. The series' PNW-specific-layer discipline should be revised to either accept geography-independent projects or to enforce a PNW section in every project.
- **Mission-pack PDF rendering is inconsistent across the ten projects.** Some projects (DFQ, FCC) ship pre-rendered PDFs alongside LaTeX; others defer to the build pipeline. The same mixed-discipline concern flagged in v1.49.85 persists and should be resolved before the next mega-wave.
- **Cross-project cross-references inside the triple-mega-wave are thinner than they should be.** SOC and CRY share a hip-hop lineage but do not cross-reference explicitly; SRG's production-engineering lineage touches PRS's rhythm mathematics but no cross-link exists; DFQ and FCC cite each other but the IBC/CBC public-broadcast connection is implicit rather than explicit. A cross-reference enrichment pass across the eleven projects is queued.
- **The release-notes stub dropped to parse confidence 0.35, matching the v1.49.85 low.** The parser-generated chapters at `chapter/00-summary.md` and `chapter/03-retrospective.md` carry the same low-confidence marker as v1.49.85 because the parser aggregated across ten distinct vocabularies. The parser heuristics still need the mega-wave-aware dispatch the v1.49.85 retro flagged.
- **SRG is the series' first single-engineer portrait and the template for "music-science pipeline" portraits was not written down before shipping.** Future single-engineer portraits (possible candidates: Sylvia Massy, Terri Winston, Eric Valentine) would benefit from the SRG shape being formalized as a template document under `.planning/missions/`.

### What Needs Improvement

- **The eleven-commit release window does not have a named assembly playbook.** The sequence "ten parallel project trees complete → atomic content commits in series → release-notes stub" is reproducible but the procedure is not documented. A mega-wave-assembly playbook should land in `.planning/missions/release-uplift/` before the next multi-wave window.
- **The `series.js` file is touched ten times in the same window and the append-order semantics remain implicit.** The v1.49.85 retro flagged this exact issue and it has not been resolved. A comment block at the top of `series.js` documenting the ordering rule (chronological, alphabetical, or manually curated) is overdue.
- **Verification matrices were not aggregated across the eleven-project window.** Each project carries its own verification matrix (inherited from WYR v1.49.43) but no cross-project consistency tests were run for this release window. A triple-mega-wave verification aggregate should be added.
- **The Broadcasting Cluster does not yet have a cluster-landing artifact.** Five projects now cover CBC, IBC, SVB, DFQ, and FCC coherently, but there is no `docs/` landing page that shows the cluster walk from outside. The v1.49.85 retro flagged the same concern for the Technology Cluster; both cluster-landing artifacts are now overdue.
- **The 39,747-line content aggregate is large enough that readers cannot absorb the release in a single sitting.** A "how to read v1.49.87" meta-document would sequence the eleven projects for a new reader (suggested entry points by interest: hip-hop → SOC/CRY; production → SRG; rhythm math → PRS; gathering culture → MTB; broadcasting → CBC/IBC/SVB/DFQ/FCC).

---

## Lessons Learned

- **Closing a cluster at a natural regulatory seam beats closing it at a round count.** The Broadcasting Cluster closes at 5 projects not 6 or 7, because 5 is where the regulatory-through-archaeology walk becomes coherent (baseline, sovereignty, pedagogy, loss, rulebook). Padding to 7 would have added unforced entries; stopping short at 3 or 4 would have left visible gaps. The lesson generalizes: cluster-completion decisions should be coverage-driven, and "coverage" is a specific editorial claim about what chain of topics must connect.
- **OCAP/CARE/UNDRIP compliance is an editorial spine, not a methodology footnote.** IBC names the Confederated Tribes of Warm Springs, the Yakama Nation, and the United Indians of All Tribes Foundation specifically, and every data claim in the project cites a source that the named nation could verify. Applying the compliance framework in the text (rather than describing it in an appendix) is what makes the project sovereignty-aligned. Future Indigenous-content projects in any series should follow the same pattern.
- **Rhythm and pitch are the same phenomenon at different frequencies, and PRS is the first series project to claim so formally.** Module 05 walks the infra-rhythmic-to-pitch continuum directly (pulse below 20 Hz is beat, pulse above 20 Hz is pitch) and treats the crossover as a physical fact about human perception rather than as a taxonomic convenience. The editorial claim generalizes to every subsequent rhythm-and-pitch project the series will ship, and PRS becomes the anchor every future rhythm-adjacent project cites.
- **Mixtape economics is a first-class research subject and CRY legitimizes it as one.** Curren$y's 100+ mixtape career is usually narrated in cultural-critical terms (prolific, independent, authentic). CRY reframes it as economic infrastructure: release cadence as cost-control mechanism, Jet Life as a label-shape that preserves artistic independence through cross-subsidy, and audience-direct distribution as a deliberate substitute for major-label access. Future career-portrait projects should follow CRY's lead in treating economic structure as first-class subject matter.
- **Music is infrastructure, not decoration, and SOC extends the full-stack framing into cultural geography.** The Compton-to-Seattle migration corridor is physical: bus routes, pressing plants, radio towers, concert venues, and the 23rd-and-Union corner in the Central District. Treating music as infrastructure forces the documentation to name the infrastructure components — KRIZ AM 1420, Washington Hall, the Black Constellation — and the naming itself is the editorial contribution. The v1.49.85 "full stack is literal, not metaphorical" lesson extends: cultural infrastructure is also literal, not metaphorical.
- **Commons governance applies to gathering culture and Ostrom's eight principles map cleanly onto Moontribe.** MTB walks the Leave No Trace discipline, the site-rotation protocol, the sound-system and full-moon synchronization, and the self-governance decision patterns through Ostrom's eight-principle framework explicitly. The map-onto is not forced — Moontribe genuinely exhibits clear boundaries, collective-choice arrangements, graduated sanctions, and the other Ostrom principles — and the project legitimizes Ostrom-style analysis for cultural-infrastructure portraits. Future gathering-culture or self-governed-collective projects should follow the same pattern.
- **Single-engineer portraits need their own template and SRG is the inaugural instance.** The engineer-to-researcher-to-pedagogue arc that Susan Rogers walked (Paisley Park → McGill psychoacoustics → Berklee Music Perception and Cognition Lab) is a reproducible portrait shape. Future single-engineer portraits should inherit the SRG five-module spine: pre-canonical-career context, canonical engineering years, research pivot, pedagogical career, and lineage closure. The shape is distinct enough from the standard six-module subject portrait that it deserves its own template.
- **DFQ introduces broadcast archaeology as a research modality and the cultural-loss ledger is its editorial contribution.** The ledger is a quantitative accounting: how many hours of original programming existed, how many are preserved, how many are recoverable, and how many are irrecoverable. Building the ledger forces the project to distinguish between format death (same transmitter, new content) and signal death (transmitter gone), and the distinction has editorial weight — format death is reversible in principle, signal death is not. Future broadcast-history projects should inherit the ledger framing.
- **The triple-mega-wave release window is the series' new upper throughput bound and it held.** Three thematically independent mega-waves (MW7 hip-hop, MW8 production/gatherings/polyrhythm, MW9 broadcasting) landed in a single v1.49.86..v1.49.87 window without cross-wave dependency conflicts. The pattern is repeatable when the three waves are genuinely independent, and it fails when cross-wave dependencies exist. Future mega-wave planning should verify thematic independence before attempting triple-wave windows.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.86](../v1.49.86/) | Immediate predecessor in the Research cadence; prior window before MW7+MW8+MW9 lands |
| [v1.49.88](../v1.49.88/) | Immediate successor in the Research cadence; next window after v1.49.87 ships |
| [v1.49.85 — "The Full Stack"](../v1.49.85/) | Sibling mega-wave release (MW4, Technology Cluster close); same uplift mission, direct A-grade sibling informing this uplift's shape |
| [v1.49.84](../v1.49.84/) | Predecessor in the Research cadence; MW3 of the v1.49.82+ Mega Batch |
| [v1.49.83](../v1.49.83/) | Same Mega Batch; MW2 of v1.49.82+ |
| [v1.49.82](../v1.49.82/) | Opens the v1.49.82+ Mega Batch that MW7+MW8+MW9 continue |
| [v1.49.80 — PLT (First Frost, Last Frost)](../v1.49.80/) | A-grade README shape this uplift inherits directly |
| [v1.49.72 — KUB (KUBE 93.3)](../v1.49.72/) | Broadcasting Cluster sibling; early broadcast-history precedent that CBC/IBC/SVB/DFQ/FCC now complete |
| [v1.49.74 — OTM](../v1.49.74/) | Three-color-palette precedent; editorial discipline MW7-MW9 projects inherit |
| [v1.49.69 — K8S](../v1.49.69/) | Orchestration-as-first-class-concept framing sibling; CRY's Jet Life label reading descends from the same abstraction discipline |
| [v1.49.63 — Bing Chen (FDR)](../v1.49.63/) | Verification-matrix discipline precedent; 28-test structure applied per project across MW7-MW9 |
| [v1.49.58 — Sonic Alchemy (COI)](../v1.49.58/) | Three-color-palette precedent with load-bearing semantics; editorial register MW8 (SRG/MTB/PRS) inherits |
| [v1.49.53 — Daypack (JNS)](../v1.49.53/) | Mission-pack triad (LaTeX + PDF + HTML landing) shape that all ten MW7-MW9 projects carry forward |
| [v1.49.43 — Weyerhaeuser (WYR)](../v1.49.43/) | Three-commit atomic-content discipline precedent; MW7-MW9 extend the pattern to ten simultaneous content commits plus one docs commit |
| [v1.49.38](../v1.49.38/) | Reserved the multi-domain docroot `www/tibsfox/com/` that MW7-MW9's ten projects occupy |
| [v1.0 — Core Skill Management](../v1.0/) | Foundation of the project; the structured-documentation discipline MW7-MW9's module shape descends from |
| `www/tibsfox/com/Research/SOC/` | Strait Out of Compton project tree (6 modules, 2,014 lines) |
| `www/tibsfox/com/Research/CRY/` | Curren$y project tree (5 modules, 1,983 lines) |
| `www/tibsfox/com/Research/SRG/` | Susan Rogers Arc project tree (5 modules, 1,961 lines) |
| `www/tibsfox/com/Research/MTB/` | Moontribe project tree (5 modules, 1,938 lines) |
| `www/tibsfox/com/Research/PRS/` | Polyrhythm Standard project tree (6 modules, 2,578 lines) |
| `www/tibsfox/com/Research/CBC/` | CBC/Radio-Canada project tree (5 modules, 1,820 lines) |
| `www/tibsfox/com/Research/IBC/` | Indigenous Broadcasting project tree (5 modules, 1,846 lines) |
| `www/tibsfox/com/Research/SVB/` | Student Voice Broadcasting project tree (5 modules, 1,928 lines) |
| `www/tibsfox/com/Research/DFQ/` | Dead Frequencies project tree (5 modules, 2,011 lines) |
| `www/tibsfox/com/Research/FCC/` | FCC Catalog project tree (6 modules, 2,279 lines) |
| `www/tibsfox/com/Research/series.js` | Navigation wiring; gained ten entries across MW7-MW9's ten content commits |
| `docs/release-notes/v1.49.87/chapter/00-summary.md` | Parser-generated summary chapter retained at confidence 0.35 |
| `docs/release-notes/v1.49.87/chapter/03-retrospective.md` | Parser-generated retrospective chapter |
| `docs/release-notes/v1.49.87/chapter/04-lessons.md` | Parser-generated lessons chapter |
| `docs/release-notes/v1.49.87/chapter/99-context.md` | Parser-generated context chapter (Prev/Next source of truth) |
| `.planning/missions/release-uplift/RUBRIC.md` | A-grade rubric this README was rewritten against |
| `.planning/missions/release-uplift/pipeline/uplift-one.mjs` | Pipeline entrypoint that generated the uplift workspace context for this README |
| External: NIST SP 800-86 | Cross-cluster forensics reference (cited by v1.49.85 STE; DFQ archaeology module uses adjacent preservation methodology) |
| External: OCAP (First Nations Information Governance Centre) | IBC primary framework reference (Ownership, Control, Access, Possession) |
| External: CARE Principles (Global Indigenous Data Alliance) | IBC primary framework reference (Collective Benefit, Authority to Control, Responsibility, Ethics) |
| External: UNDRIP Article 16 | IBC primary framework reference (Indigenous media sovereignty) |
| External: Title 47 CFR (eCFR) | FCC primary source document (Parts 15, 73, 95, 97 authoritative text) |
| External: Library of Congress National Recording Preservation Plan | DFQ Module 04 primary preservation-practice reference |
| External: Bjorklund algorithm (1990s generative combinatorics literature) | PRS Module 01 primary mathematical reference |
| External: Kuramoto oscillator model (1975 onward synchronization literature) | PRS Module 04 primary mathematical reference |

---

## Engine Position

v1.49.87 is the release that lands three consecutive mega-waves — MW7 (Hip-Hop Migration), MW8 (Production / Gatherings / Polyrhythm), MW9 (Broadcasting Cluster close) — inside a single v1.49.86..v1.49.87 window, and it sits as the 87th named release in the PNW Research Series cadence. Within the v1.49.82+ Mega Batch arc the release extends the Technology-Cluster-close at v1.49.85 (MW4) into three additional culture-and-broadcasting waves that close the Broadcasting Cluster at five projects (CBC, IBC, SVB, DFQ, FCC) while adding five non-cluster Research projects (SOC, CRY, SRG, MTB, PRS) that extend the series' hip-hop-migration, production, gathering-culture, and rhythm-mathematics coverage. Cumulatively the series adds ten named projects (117 series total after this release, per the README header's claim of 117 projects in the Research Series), 58 research modules, and 20,358 content lines to the Research corpus in a single window — the highest single-release throughput to date. Within the broader Seattle 360 / NASA / PNW engine arc v1.49.87 sits in the post-Seattle-360-first-pass window (after v1.49.192 completed the initial 57-degree cycle) and before the NASA-catalog chronological-reordering phase opens at v1.49.558 (Apollo 1); the Research cadence runs parallel to the degree engine and feeds both the broader PNW research corpus and the Tibsfox.com research site. The release's primary downstream dependents are any Research project that engages the broadcast spectrum (cross-reference targets across CBC/IBC/SVB/DFQ/FCC), any hip-hop-adjacent project (SOC/CRY), any production-engineering project (SRG), any gathering-culture or Ostrom-commons project (MTB), any rhythm-mathematics project (PRS), and the Broadcasting-Cluster-landing artifact that the Retrospective flagged as overdue. The release strengthens the editorial precedents the Research series has carried since v1.49.43 (three-commit atomic-content discipline at triple-mega-wave scale, per-project verification matrix, PNW-specific layer where geography applies, mission-pack triad, three-color palette, cluster-closing-at-natural-seams) and introduces three new editorial patterns (OCAP/CARE/UNDRIP-as-spine, single-engineer portrait shape, cultural-loss-ledger).

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Research projects total (through v1.49.87) | 117 series-wide (per header claim); +10 added by this release |
| Research projects in MW7+MW8+MW9 | 10 (SOC, CRY, SRG, MTB, PRS, CBC, IBC, SVB, DFQ, FCC) |
| Research modules added | 58 across the ten projects |
| Content lines added | 20,358 research lines (SOC 2,014 + CRY 1,983 + SRG 1,961 + MTB 1,938 + PRS 2,578 + CBC 1,820 + IBC 1,846 + SVB 1,928 + DFQ 2,011 + FCC 2,279) |
| Full lines added | 39,747 across 115 files (site shells, mission packs, research modules, navigation wiring) |
| Broadcasting Cluster size | 5 projects (CBC, IBC, SVB, DFQ, FCC) — MW9 closes the cluster |
| Content commits in window | 10 (one per project) |
| Docs commits in window | 1 (release-notes stub `c478130b7`) |
| Total commits in window | 11 |
| Mega-waves landed | 3 (MW7 hip-hop, MW8 production/gatherings/polyrhythm, MW9 broadcasting) |

---

## Files

- `www/tibsfox/com/Research/SOC/` — Strait Out of Compton full project tree (6 research modules totaling 2,014 lines, site shell, mission pack, style)
- `www/tibsfox/com/Research/CRY/` — Curren$y full project tree (5 research modules totaling 1,983 lines, site shell, mission pack, style)
- `www/tibsfox/com/Research/SRG/` — Susan Rogers Arc full project tree (5 research modules totaling 1,961 lines, Paisley Park + McGill + Berklee arc)
- `www/tibsfox/com/Research/MTB/` — Moontribe full project tree (5 research modules totaling 1,938 lines, Ostrom-commons analysis + Mojave ecology + sound-system architecture)
- `www/tibsfox/com/Research/PRS/` — Polyrhythm Standard full project tree (6 research modules totaling 2,578 lines, Euclidean rhythm + Kuramoto synchronization + DFT spectral analysis)
- `www/tibsfox/com/Research/CBC/` — CBC/Radio-Canada full project tree (5 research modules totaling 1,820 lines, 1936 founding through CanCon and CRTC)
- `www/tibsfox/com/Research/IBC/` — Indigenous Broadcasting full project tree (5 research modules totaling 1,846 lines, KWSO + KYNR + Daybreak Star + OCAP/CARE/UNDRIP)
- `www/tibsfox/com/Research/SVB/` — Student Voice Broadcasting full project tree (5 research modules totaling 1,928 lines, C89.5 + KEXP-UW + college-radio pedagogy)
- `www/tibsfox/com/Research/DFQ/` — Dead Frequencies full project tree (5 research modules totaling 2,011 lines, KRAB + format-death taxonomy + cultural-loss ledger)
- `www/tibsfox/com/Research/FCC/` — FCC Catalog full project tree (6 research modules totaling 2,279 lines, Title 47 CFR Parts 15/73/95/97 + spectrum allocation + enforcement)
- `www/tibsfox/com/Research/series.js` — +10 lines cumulative (one navigation entry per project, appended across the ten content commits)
- `docs/release-notes/v1.49.87/README.md` — this file (A-grade uplift from F(36) parser stub)
- `docs/release-notes/v1.49.87/chapter/00-summary.md` — parser-generated summary chapter (confidence 0.35, retained for DB-driven navigation)
- `docs/release-notes/v1.49.87/chapter/03-retrospective.md` — parser-generated retrospective chapter (3 extracted lessons)
- `docs/release-notes/v1.49.87/chapter/04-lessons.md` — parser-generated lessons chapter
- `docs/release-notes/v1.49.87/chapter/99-context.md` — parser-generated context chapter (Prev/Next source of truth)

---

> *The spectrum is not an abstraction. It is the shared fabric that carries the migration, the mixtape, the pressing, the full-moon broadcast, the clave, the public signal, the sovereign signal, the student signal, the ghost signal, and the rule that governs them all.*
>
> *Ten projects. Three mega-waves. One cluster closed at its natural seam — baseline to sovereignty to pedagogy to loss to rulebook.*
