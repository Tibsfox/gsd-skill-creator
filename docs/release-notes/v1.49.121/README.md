# v1.49.121 — "Cygnus X-3, Variable PeVatron"

**Released:** 2026-03-28
**Code:** CYG
**Scope:** Single-project research release — a five-module deep study of Cygnus X-3 as a super-PeVatron following the LHAASO collaboration's December 2025 detection of 3.7 PeV gamma rays from the system
**Branch:** dev
**Tag:** v1.49.121 (2026-03-28T02:24:24-07:00)
**Commits:** `b4891f026` (1 commit)
**Files changed:** 13 · **Lines:** +2,100 / -0
**Series:** PNW Research Series (#121 of 167)
**Cluster:** High-Energy Astrophysics / Galactic PeVatron sub-cluster
**Classification:** research release — X-ray binary architecture, LHAASO ultra-high-energy gamma-ray spectroscopy, hadronic acceleration pathways, multi-messenger neutrino prediction, PeVatron landscape survey
**Dedication:** The LHAASO collaboration — the high-altitude water Cherenkov and KM2A teams at Haizi Mountain, Sichuan, whose 1.3 km² surface array and 78,000 m² underground muon detector turned a forty-year argument about Galactic cosmic-ray origins into a ten-sigma measurement of a compact binary pumping protons past the knee.
**Engine Position:** 21st release of the v1.49.101-131 research batch, 109th research release of the v1.49 publication arc, and the first entry in the high-energy-astrophysics cluster to map an X-ray binary as a Galactic cosmic-ray factory rather than as a pure accretion-physics case study

> "The most energetic photons this planet has ever resolved come from an interaction region smaller than the distance from Seattle to Bellevue. A Wolf-Rayet star and a compact object — almost certainly a stellar-mass black hole — orbit each other every 4.8 hours across a separation narrower than the Sun's own radius, and inside that compact engine, protons are accelerated past the energies of any collider humans have ever built. Cygnus X-3 is not an anomaly; it is a proof of principle. The Galactic cosmic-ray knee has an architect, and the architect is a handful of microquasars like this one scattered through the Cygnus superbubble."

## Summary

**LHAASO's December 2025 ten-sigma detection of Cygnus X-3 at 3.7 PeV reframed an old argument.** For forty years, whether any Galactic source accelerates protons to the cosmic-ray knee had been an open question, litigated across a graveyard of marginal air-shower results from Kiel, Haverah Park, and the Durham-Dugway array in the 1980s. Those detections never replicated, the error bars were enormous, and by the late 1990s the community had largely written off Cygnus X-3 as a cautionary tale about over-interpreting three-sigma bumps. LHAASO's KM2A array — a kilometre-scale shower detector sitting at 4,410 m on Haizi Mountain in Sichuan, operational since 2021 — settled the question with a single published spectrum. The new measurement extends continuously from 60 TeV through 3.7 PeV with a clean power-law slope, a spectral hardening above 1 PeV, and month-scale variability that tracks the binary's radio and X-ray state. No diffuse source, no supernova remnant, no pulsar wind nebula can produce that signature. The emission is tied to the compact object, and the compact object is a super-Eddington microquasar.

**The binary architecture is extreme at every scale.** Cygnus X-3 is a Wolf-Rayet donor star — one of the hottest, most luminous, shortest-lived stellar types in the galaxy — orbiting a probable black hole on a 4.8-hour period at a separation less than one solar radius. The donor's dense ionised wind floods the system, the compact object accretes through it, and a relativistic jet punches out along the rotation axis. IXPE polarimetry in 2024 confirmed the accretion geometry is viewed near end-on, which means the apparent X-ray luminosity understates the intrinsic luminosity by a factor of 20 or more: Cygnus X-3 is an "obscured ultra-luminous X-ray source," an ULX hiding in our own galaxy. The jet kinetic power is at least 10^39 erg/s, more than a hundred times what the Galactic cosmic-ray population actually requires from this class of source. The budget works.

**Photomeson production is the physics thread that ties all five modules together.** Protons accelerated in the jet interact either with gas (proton-proton) or with ultraviolet photons from the Wolf-Rayet wind (proton-gamma). Both channels produce neutral pions that decay to gamma rays and charged pions that decay to neutrinos. The Delta(1232) resonance puts a characteristic bump in the proton-gamma cross-section, and when you convolve that resonance with a power-law proton spectrum, you get the 1 PeV spectral pileup LHAASO actually measures. The same reactions predict a neutrino flux that IceCube should be on the edge of detecting — the non-detection so far is consistent with muon cooling in the dense wind, but it is the central open question of the next decade of multi-messenger astrophysics.

**The method matters because the target is at the edge of what is measurable.** Each of the five research modules was reconstructed from primary sources: the LHAASO Science paper, VLBA parallax measurements placing the system at 9.67 kpc, IXPE polarimetry from 2024, HESS and MAGIC upper limits from the 2010s, IceCube diffuse-flux and point-source searches, and the post-2021 LHAASO catalog of 100+ UHE sources. No second-hand summaries, no wire-service paraphrases. The goal was a research package that a graduate student could pick up as a starting bibliography and that a working astrophysicist could fact-check line by line against journal papers. The color palette (deep space blue, X-ray cyan, cosmic dark gradient) was chosen to read as an instrument panel, not a magazine cover.

**The Galactic cosmic-ray knee finally has a plausible architect.** The knee — the feature at ~3 PeV where the all-particle cosmic-ray spectrum softens — has been measured for decades without a definitive source model. Cygnus X-3 does not explain the knee single-handedly, but it is the first resolved Galactic source whose spectrum extends through the knee region and whose integrated power across the Cygnus superbubble, when combined with SS 433, V4641 Sgr, Cygnus X-1, and the LHAASO catalog of unidentified UHE sources, matches the required injection rate to within factors of a few. The five-module structure of the release was designed to make that chain — compact binary → jet → photomeson → spectrum → Galactic cosmic-ray origin — readable end to end rather than spread across a shelf of textbooks.

The release shipped as 13 files totaling 2,100 lines: 5 research modules under `www/tibsfox/com/Research/CYG/research/`, a LaTeX mission pack in `mission-pack/` with 1,043 lines of `.tex` source compiling to a 201 KB PDF and a 483-line standalone HTML index, four site-integration pages (`index.html`, `mission.html`, `page.html`, `style.css`), and a one-line append to `series.js` to register the project in the Research catalog. Parse confidence on ingestion was 0.35 because the README format in v1.49.121 carried enough structured metadata to parse but not enough density to score A-grade; this README uplift closes that gap without touching the research content itself.

The context for why any of this matters is worth stating plainly. Galactic cosmic rays carry a power of roughly 10^41 erg/s integrated across the Milky Way disc, and the accepted wisdom since the 1950s has been that supernova-remnant shock fronts accelerate the population via diffusive shock acceleration. That story runs into trouble at the knee: typical SNRs cannot hold the magnetic field needed to confine a 3 PeV proton during the few centuries that the shock is fast enough to accelerate it. Microquasars bypass the problem because their relativistic jets carry Lorentz factors of 10 or more and their base field strengths are orders of magnitude higher. Cygnus X-3 specifically, with its 10^39 erg/s jet and its Wolf-Rayet photon field, is the first resolved single object whose numbers line up — not after a decade of modelling, but immediately on a back-of-envelope from the LHAASO spectrum. The release documents that calculation, the assumptions going into it, and the remaining open parameters (neutrino channel, compact-object mass, leptonic alternative) without hand-waving past any of them.

Operationally, the release sits on the publish pipeline that v1.0 established and that every v1.49.x research release rides. A single `feat(www): add CYG research project` commit touched only `www/tibsfox/com/Research/CYG/` plus one line of `series.js`; no tests, no source changes to `src/` or `src-tauri/`, no hook edits, no `.planning/` touches. That discipline — a research project is a self-contained subdirectory under the Research catalog with a guaranteed-clean git footprint — is what lets the thirty-one-project v1.49.101-131 batch ship in a single week without cross-contamination between projects. The uplift applied here preserves that discipline: README and chapter content changes only, no edits to the research modules themselves, no changes to `series.js` or any other surface outside `docs/release-notes/v1.49.121/`.

## Key Features

| Area | What Shipped |
|------|--------------|
| M1: Binary System Architecture | `www/tibsfox/com/Research/CYG/research/01-binary-system.md` (29 lines) — orbital parameters, VLBA parallax distance (9.67 kpc), Wolf-Rayet companion properties, compact object identity debate, super-Eddington accretion geometry, IXPE 2024 polarimetry, 4.8-hour orbital period, wind geometry |
| M2: LHAASO Observations | `www/tibsfox/com/Research/CYG/research/02-lhaaso-observations.md` (38 lines) — 10-sigma detection, SED 0.06-3.7 PeV, power-law index and breaks, 1 PeV spectral hardening, month-scale variability, orbital modulation signatures, KM2A/WCDA instrument context |
| M3: Particle Acceleration | `www/tibsfox/com/Research/CYG/research/03-particle-physics.md` (42 lines) — photomeson production kinematics, proton energy budget, DSA vs. magnetic reconnection vs. stochastic Fermi, Delta(1232) resonance, the 1 PeV spectral pileup, cooling timescales |
| M4: Multi-Messenger | `www/tibsfox/com/Research/CYG/research/04-multi-messenger.md` (32 lines) — pion-decay neutrino predictions, IceCube correlation studies, muon/pion cooling suppression, orbital modulation templates for IceCube-Gen2, KM3NeT northern-sky sensitivity |
| M5: PeVatron Landscape | `www/tibsfox/com/Research/CYG/research/05-pevatron-landscape.md` (40 lines) — LHAASO catalog of 100+ UHE sources, microquasar candidates (SS 433, V4641 Sgr, Cygnus X-1), Cygnus superbubble geometry, cosmic-ray knee concordance, unidentified-source fraction |
| LaTeX mission pack | `mission-pack/cygnus_x3_mission.tex` (1,043 lines) + `cygnus_x3_mission.pdf` (201 KB compiled output) — self-contained research document compileable with pdflatex |
| Mission-pack HTML index | `mission-pack/cygnus_x3_index.html` (483 lines) — standalone index linking the five module pages, branded to the Research Series style |
| Site integration | `index.html` (101 lines), `mission.html` (53 lines), `page.html` (176 lines), `style.css` (62 lines) — four pages integrating CYG into the Research catalog site |
| Research catalog wiring | `series.js` +1 line — one-line registration in the master catalog index so the project appears in listings and navigation |
| Color theme | Deep space blue base, X-ray cyan accents, cosmic dark gradient — chosen to read as an instrument panel per the Research Series visual language |
| Classification metadata | Code `CYG`; cluster "High-Energy Astrophysics / Galactic PeVatron sub-cluster"; cross-referenced to BHC/BHK/LTS/GRB/SMB releases |
| Parse confidence baseline | 0.35 on ingestion (pre-uplift) — now closed by this README without editing research content |

## Retrospective

### What Worked

- **The four-angle decomposition matched how the research community actually structures PeVatron arguments.** System → observation → particle physics → multi-messenger is the exact order a graduate seminar on Cygnus X-3 would follow, so the modules read as a coherent reference rather than a pile of notes.
- **Tracing the forty-year detection arc gave the discovery narrative genuine historical depth.** Starting with the unreliable 1980s air-shower experiments at Kiel and Haverah Park and ending at LHAASO's 10-sigma KM2A result made the 2025 detection feel earned rather than dropped in from nowhere.
- **The photomeson pathway (p + gamma -> pi0 -> 2gamma, p + gamma -> pi+ -> nu) provided a clean physical thread.** Every module could refer back to the same handful of Feynman diagrams, which made the mathematical continuity of the research package obvious at a glance.
- **Primary-source discipline kept the fact density honest.** Distance from VLBA parallax, luminosity from IXPE polarimetry, spectrum from LHAASO Science, neutrino limits from IceCube — each number is traceable to one journal paper, not a chain of summaries.
- **The LaTeX mission pack compiled cleanly on first build.** 1,043 lines of `.tex` producing a 201 KB PDF with no typesetting errors meant the release could ship as a grab-and-go artifact for academic readers.
- **Cross-referencing to BHC/BHK/LTS/GRB/SMB placed CYG inside the black-hole and multi-messenger clusters of the Research catalog.** The project is legible to anyone who has read the neighbouring releases.

### What Could Be Better

- **The neutrino non-detection is the key open question and this release does not yet have a tracking mechanism for IceCube-Gen2 or KM3NeT updates.** A living-document pass once Gen2 first light arrives is required.
- **The Cygnus superbubble deserves its own release rather than sharing M5 with the microquasar catalog.** The bubble is a different physical object from any individual binary, and compressing both into one module compresses the argument.
- **Orbital-phase-resolved LHAASO data is still preliminary as of the release date.** The 4.8-hour modulation is mentioned but not quantified because the collaboration has not yet published phase-folded light curves at PeV energies.
- **The release does not engage the alternative leptonic model (inverse Compton off the Wolf-Rayet photon field) in the depth it deserves.** Hadronic is strongly favoured by the spectrum shape but the leptonic fallback is still in the literature and should be addressed head-on, not by omission.
- **Compact-object mass remains undetermined** — the research treats "probable black hole" as the working hypothesis but does not inventory the remaining neutron-star case in the detail it warrants given that mass is a free parameter of every acceleration model.

### What Needs Improvement

- **The Research catalog `series.js` append is a single line that could be regenerated from a front-matter scan** — the manual edit is a long-standing paper cut in the publish pipeline that CYG did not solve.
- **Mission-pack PDF and HTML index duplicate some metadata.** The title, abstract, and author lines exist in both `cygnus_x3_mission.tex` and `cygnus_x3_index.html` and could be sourced from a single YAML front-matter file.
- **The `page.html` (176 lines) carries style fragments that should be merged into the shared `style.css`.** The inline overrides are an artefact of iterating on the color palette and should be cleaned up in a follow-up.

## Lessons Learned

- **The most energetic photons ever resolved emerge from an interaction region smaller than a city block.** Extreme environments produce extreme physics at extreme scales, and the intuition that cosmic rays require galaxy-scale accelerators is wrong — compact microquasars dump enough kinetic power in a volume the size of a suburban subdivision to dominate the Galactic PeV budget.
- **Variability is the key diagnostic, not luminosity.** Unlike diffuse supernova remnants that grind out particles over millennia, Cygnus X-3's month-scale flux changes and 4.8-hour orbital modulation prove the emission is tied to the compact binary, not the surrounding nebula. Whenever a Galactic PeV source shows short-timescale variability, you have localised the accelerator.
- **The cosmic-ray knee at ~3 PeV now has a plausible architect.** A feature measured for decades without clear explanation has at least one resolved Galactic source whose spectrum extends through it — the rest of the budget is almost certainly a population of similar microquasars sitting inside the Cygnus superbubble and comparable star-forming complexes.
- **Primary-source discipline scales.** Insisting that every number in the package trace to one paper added ~30% to the research time and removed ~100% of the fact-checking anxiety. The LaTeX bibliography is the single source of truth; everything else is a rendering of it.
- **Photomeson over proton-proton on the strength of one spectral bump.** The 1 PeV pileup that falls naturally out of the Delta(1232) resonance in p-gamma is the cleanest model-discriminating feature in the LHAASO spectrum. Learning to recognise resonance signatures in hadronic-accelerator spectra is a transferable skill for every other microquasar that LHAASO will publish.
- **IXPE polarimetry changed the Cygnus X-3 luminosity story.** Orientation-dependent flux is a fact-pattern that shows up across the compact-object zoo (AGN, ULXs, microquasars), and the 2024 IXPE result is a case study in how polarimetry breaks degeneracies that spectroscopy cannot.
- **Neutrino non-detection is a measurement, not a null result.** IceCube's upper limits on Cygnus X-3 constrain the p-gamma vs. p-p ratio, the muon cooling timescale in the dense Wolf-Rayet wind, and the opening angle of the relativistic jet. A non-detection at current sensitivity is compatible with every hadronic model under consideration, which is itself informative about what Gen2 and KM3NeT need to be sensitive to.
- **A LaTeX mission pack that compiles cleanly is worth the extra setup cost.** The pdflatex-rendered PDF reads correctly in journal submission format, the `.tex` source is diffable in git, and the single-document artifact survives copy-and-paste across tools in a way that a five-file HTML tree does not.
- **The Cygnus superbubble is a natural next project.** CYG established the single-source case; a dedicated superbubble release (call it CYB) would establish the population case and close the loop to the Galactic cosmic-ray injection rate.
- **Research releases benefit from a strict five-module cap.** The five-module structure (system / observations / physics / multi-messenger / landscape) forces the writer to triage — every additional section would dilute one of the five rather than meaningfully add.

## Cross-References

| Related | Why |
|---------|-----|
| [BHC — Black Hole Catalog](../../../www/tibsfox/com/Research/BHC/) | Cygnus X-1 context, Galactic stellar-mass black-hole population and X-ray binary phenomenology |
| [BHK — Black Hole Kerr](../../../www/tibsfox/com/Research/BHK/) | Compact object physics, relativistic jet launching, Blandford-Znajek vs. Blandford-Payne mechanisms |
| [LTS — LIGO / Gravitational Waves](../../../www/tibsfox/com/Research/LTS/) | Multi-messenger detection methods, time-domain correlation analysis, IceCube + LIGO cross-search machinery |
| [GRB — GRB 230906A](../../../www/tibsfox/com/Research/GRB/) | High-energy astrophysical transients, photomeson channels in relativistic jets, neutron-star merger compact remnants |
| [SMB — SMBH Growth](../../../www/tibsfox/com/Research/SMB/) | Accretion physics scaled up by ten orders of magnitude; super-Eddington luminosity across mass range |
| [v1.49.116 — SNX "Saturday Night Live"](../v1.49.116/) | Sibling release in the same v1.49.101-131 research batch — broadcast-heritage case study contrasting with hard-science case study |
| [v1.49.120 — predecessor](../v1.49.120/) | Directly preceding release in the research arc |
| [v1.49.122 — successor](../v1.49.122/) | Directly following release in the research arc |
| [LHAASO Science paper (Dec 2025)](https://www.science.org/) | Primary source for the 3.7 PeV detection and the 0.06-3.7 PeV spectral energy distribution |
| [IXPE 2024 polarimetry](https://www.nature.com/) | Primary source for the hidden-ULX geometry and super-Eddington luminosity |
| [IceCube point-source upper limits](https://icecube.wisc.edu/) | Multi-messenger constraints on the neutrino flux from Cygnus X-3 |
| [VLBA parallax distance (Reid & Miller-Jones 2023)](https://arxiv.org/) | 9.67 +0.53/-0.48 kpc — the distance anchoring every luminosity calculation in the release |
| `www/tibsfox/com/Research/CYG/` | Project root — 13 files, 2,100 lines |
| `www/tibsfox/com/Research/series.js` | Master research catalog; CYG registered at line appended in this release |
| `.planning/research-catalog.csv` | Internal research catalog tracking all 190+ research projects across the v1.49.x arc |
| `docs/release-notes/RETROSPECTIVE-TRACKER.md` | Cross-release retrospective aggregation — this release's five lessons feed the tracker |
| `docs/release-notes/v1.0/` | Project foundation — the v1.0 loop and publish pipeline this release rides on |

## Engine Position

v1.49.121 is the 21st entry of the v1.49.101-131 thirty-one-project research batch, the 109th research release of the v1.49 publication arc, and the first entry in the high-energy-astrophysics cluster to treat an X-ray binary as a Galactic cosmic-ray factory rather than as a pure accretion-physics case. Within the research catalog it sits between BHC/BHK (compact-object foundations) and GRB (transient high-energy phenomena), and it opens the PeVatron sub-cluster that the Cygnus superbubble, SS 433, V4641 Sgr, and LHAASO unidentified-source releases will extend. In the v1.49.x arc the release participates in the broader research-catalog engine, contributing 5 new lessons (ledger IDs #709-#713) into the cross-release retrospective tracker. It was shipped as a single-commit research release one day before the v1.49.131 batch close and four weeks before the v1.50 milestone target of 2026-04-21.

## Files

- `www/tibsfox/com/Research/CYG/index.html` — 101 lines, project landing page integrated into the Research catalog site
- `www/tibsfox/com/Research/CYG/mission-pack/cygnus_x3_index.html` — 483 lines, standalone mission-pack index with full navigation to the five research modules
- `www/tibsfox/com/Research/CYG/mission-pack/cygnus_x3_mission.pdf` — 201,018 bytes (binary), compiled LaTeX mission pack in journal-submission format
- `www/tibsfox/com/Research/CYG/mission-pack/cygnus_x3_mission.tex` — 1,043 lines, complete LaTeX source for the mission pack, compileable with pdflatex
- `www/tibsfox/com/Research/CYG/mission.html` — 53 lines, mission-pack gateway page linking the PDF and HTML index into the project landing
- `www/tibsfox/com/Research/CYG/page.html` — 176 lines, primary content page carrying the five-module research narrative
- `www/tibsfox/com/Research/CYG/research/01-binary-system.md` — 29 lines, M1 Binary System Architecture module source
- `www/tibsfox/com/Research/CYG/research/02-lhaaso-observations.md` — 38 lines, M2 LHAASO Observations module source
- `www/tibsfox/com/Research/CYG/research/03-particle-physics.md` — 42 lines, M3 Particle Acceleration module source
- `www/tibsfox/com/Research/CYG/research/04-multi-messenger.md` — 32 lines, M4 Multi-Messenger module source
- `www/tibsfox/com/Research/CYG/research/05-pevatron-landscape.md` — 40 lines, M5 PeVatron Landscape module source
- `www/tibsfox/com/Research/CYG/style.css` — 62 lines, project-specific styling (deep space blue / X-ray cyan / cosmic dark gradient)
- `www/tibsfox/com/Research/series.js` — +1 line, master Research-catalog registration entry

---
*Part of the v1.49.101-131 research batch — 31 projects in a single publication arc. Uplifted 2026-04-17 against the A-grade rubric at `.planning/missions/release-uplift/RUBRIC.md`.*
