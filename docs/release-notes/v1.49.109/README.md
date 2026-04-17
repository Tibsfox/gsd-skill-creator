# v1.49.109 — "The Hardware is Fixed; The Software is Leverage"

**Released:** 2026-03-28
**Code:** OCT
**Scope:** Single-project research release — Amiga music architecture, Paula DMA channels, OctaMED software mixing breakthrough, MOD/S3M/XM/IT tracker genealogy, demoscene distribution culture, modern tracker ecosystem
**Branch:** dev
**Tag:** v1.49.109 (2026-03-28T02:24:21-07:00)
**Commit:** `ce91eb070` (1 commit)
**Files changed:** 14 · **Lines:** +2,718 / -0
**Series:** PNW Research Series (#109 of 167)
**Classification:** research release — music-technology foundations for the PNW creative-infrastructure cluster
**Dedication:** Karsten Obarski (Ultimate Soundtracker, 1987) and Teijo Kinnunen (MED / OctaMED) — and every bedroom musician who turned a four-channel 8-bit PCM co-processor into a format the rest of computing had to catch up to.
**Engine Position:** 9th release of the v1.49.101-131 research batch, 97th research release of the v1.49 publication arc, inaugurating the Amiga Music sub-cluster within the PNW Creative Infrastructure cluster

> "The Amiga shipped with four sound channels and a hardware low-pass filter. From that constraint, an entire musical culture emerged — one that predicted software mixing, portable modules, demoscene distribution, and the bedroom-producer economy by a full decade. The hardware was fixed. The software was leverage."

## Summary

**The Commodore Amiga made musical culture from architectural constraint.** v1.49.109 ships the OCT research project — six research modules totaling roughly 708 lines of prose plus a 1,172-line LaTeX mission-pack, a compiled 201 KB PDF, the full HTML viewer stack, and a bespoke Amiga-workbench palette applied across the project. The release reads Amiga music not as retro curiosity but as the first genuinely software-defined audio platform: four DMA-driven 8-bit PCM channels, Paula hardware doing the heavy lifting, the CPU free to compose rather than mix. From that substrate Karsten Obarski's Ultimate Soundtracker (1987) extracted a vocabulary — samples, patterns, effects columns, an order list — that became the MOD file. The MOD file became S3M became XM became IT. The paradigm left the Amiga and colonized the PC. Thirty-nine years later, Renoise, OpenMPT, and the Polyend Tracker still ship with the same vertical grid Obarski sketched on a 7 MHz 68000.

**Paula is the architectural fulcrum.** The MOS 8364 co-processor ships four DMA-driven 8-bit PCM channels with 6-bit volume, two panned hard-left and two panned hard-right, a hardware low-pass filter at roughly 4.4 kHz, and — critically — zero CPU cost once the DMA pointers are set. The Agnus custom chip handles the memory access. The 68000 is free to run the tracker UI, the effect engine, and the composer's fingers. Module 1 of OCT grounds the entire narrative in this register-level reality: Paula's data registers, period values, the volume table, the interaction with blitter priority, and the 14-bit hack where two channels are combined at different volumes to extract higher dynamic range than the silicon formally supports. The hardware is not a backdrop; it is the generative constraint that every later innovation answers to.

**OctaMED's software mixing breakthrough doubles polyphony on the same silicon.** Teijo Kinnunen's 1989 MED (Music EDitor) started as a ProTracker-style four-channel tool. By OctaMED (1991) Kinnunen had done something genuinely architectural: route two virtual voices through each Paula channel, software-mix them in real time on the 68000, and give the musician eight voices on hardware that formally supports four. The cost is roughly 40% CPU — which on a 7 MHz machine in 1991 is an enormous amount, but it is CPU that musicians were glad to spend because polyphony is the scarce resource, not cycles. Module 3 walks the technique in detail: sample-rate interpolation in software, voice-allocation heuristics, the tradeoff against sample playback fidelity, the path to OctaMED SoundStudio with native MIDI support and arbitrary-length patterns. The lesson is that architectural cleverness beats specification on the sheet; the Amiga got *more* polyphony than the Atari ST because OctaMED existed, not because the silicon was better.

**The MOD file is the original self-contained bundle.** Module 2 treats the module file concept with the care it deserves: samples + patterns + order list + effect annotations in a single portable object, binary-laid-out, trivially shareable over BBS lines. The effect vocabulary — arpeggio, portamento, volume slide, vibrato, sample offset, pattern break — is deliberately compact: every effect fits in a two-byte column, every pattern is a fixed-size matrix, every module is self-describing. The VSync timing model ties playback to the raster beam so the tempo is exact on every PAL Amiga. Zero-CPU playback means a MOD can play while the composer is still editing. This design is not incidental. It is the DACP bundle principle, fifteen years before DACP: ship the code, the data, and the playback intent as one object, portable across every machine that can parse the header.

**The tracker family tree runs from SoundMonitor to Renoise without a break.** Module 4 walks the genealogy: Chris Hülsbeck's SoundMonitor on the Commodore 64 in 1986 as the structural ancestor, Obarski's Ultimate Soundtracker (1987) as the first Amiga-native tracker, NoiseTracker (Mahoney & Kaktus, 1989) as the community-driven refinement, ProTracker (Amiga, 1990) as the de facto standard for the remainder of the Amiga era. The paradigm then crosses to PC: ScreamTracker 3 (Future Crew, 1994) and the S3M format adds sample interpolation and more channels, FastTracker 2 (Triton, 1994) and the XM format adds instruments and envelopes, Impulse Tracker (Jeffrey Lim, 1995) and the IT format adds the best-in-class mixing engine of the DOS era. The MED / OctaMED branch evolves in parallel. Every modern tracker — Renoise, OpenMPT, MilkyTracker, Furnace, FamiTracker, SunVox — inherits the vertical grid and the effect-column vocabulary from this single lineage. There are thirty-nine years between the SoundMonitor and the Polyend Tracker and no discontinuity in the model.

**The demoscene was the distribution network and the incubator.** Module 5 treats the BBS era as the cultural infrastructure that carried the tracker paradigm. FidoNet propagation moved modules across national boundaries. modarchive.org, which went live in 1996 and is still online in 2026, became the single largest searchable archive of tracker music in existence. Demoparty competitions (Assembly in Helsinki, Breakpoint in Bingen, Revision as its successor, The Gathering in Norway) established the compo format that turned tracker composition into a judged art form with live audiences. Keygen music — the pirate crack-intro soundtracks that shipped alongside warez — gave a generation of Eastern European producers their first DAW. UK rave and hardcore scenes adopted the MOD as a production tool. Crossover artists carry the lineage forward: Calvin Harris produced his early tracks in Impulse Tracker, Venetian Snares runs Renoise to this day, DJ Zinc worked in FastTracker 2. The UNESCO recognition of the demoscene as intangible cultural heritage (Germany, 2020; Finland, 2020; Poland, 2021; the Netherlands, 2023) formalizes what was obvious to anyone who was on the BBS in 1992: this was a movement, not a hobby.

**The modern ecosystem keeps the paradigm load-bearing.** Module 6 catalogs the state of the tracker ecosystem in 2026. Renoise (Taktik, first release 2002, active commercial development) is the professional-grade descendant with VST / VST3 / LADSPA plugin hosting, sample-accurate automation, and a workflow that experienced tracker composers reach for over any conventional DAW. OpenMPT (open source, Windows-native, cross-compatible with every major module format) is the archival workhorse. MilkyTracker (cross-platform, ProTracker / FastTracker 2 focused) keeps the classic formats alive on modern hardware. Furnace (chiptune-focused, emulates every hardware chip from the SID to the YM2612) extends the tracker paradigm to exact hardware emulation. FamiTracker is the NES / Famicom native. SunVox (Alexander Zolotov) is the idiosyncratic multi-platform experiment. Hardware trackers exist again: the Polyend Tracker (2020) is a standalone hardware unit, the Teenage Engineering PO series wraps the paradigm in a calculator-sized package, the Dirtywave M8 is the pocket-size professional instrument. Demoparties run in 2026. Tracker music is being composed this afternoon.

**The palette is load-bearing wayfinding, not decoration.** OCT's color scheme (Amiga workbench blue `#1A237E`, OCS copper amber-red `#BF360C`, copper-register amber `#F9A825`) is directly meaningful. The workbench blue is the default Amiga desktop color. The OCS copper amber-red is the hardware horizontal-blanking-interrupt signal color register, historically used for raster-bar effects in every Amiga demo that predates OCT's retrospective subject matter. The choice signals Amiga Music sub-cluster on the Research index at a glance and ties OCT visually to its neighbors in the Creative Infrastructure cluster (ABL music production, WAL wall-of-sound DAW landscape, FLS FL Studio, DAA digital audio architecture). Wayfinding compounds across the arc; any reader who learned the palette at v1.49.101 can navigate OCT without reading the index text.

## Key Features

| Area | What Shipped |
|------|--------------|
| Research module M1 | `research/01-paula-architecture.md` — MOS 8364 Paula register-level architecture, DMA + 6-bit volume, hardware low-pass ~4.4 kHz, 14-bit combined-channel hack, Agnus DMA timing, zero-CPU playback (87 lines) |
| Research module M2 | `research/02-mod-format.md` — MOD file binary layout, effect vocabulary (arpeggio, portamento, volume slide, vibrato, sample offset, pattern break), VSync timing tied to raster beam, zero-CPU playback design (99 lines) |
| Research module M3 | `research/03-octamed-deep-dive.md` — Teijo Kinnunen's software mixing: two virtual voices per Paula channel at ~40% CPU, native MIDI, arbitrary-length patterns, MED 1989 → OctaMED SoundStudio arc (103 lines) |
| Research module M4 | `research/04-tracker-family-tree.md` — SoundMonitor (C64) → Ultimate Soundtracker (1987) → NoiseTracker (1989) → ProTracker (1990) → ScreamTracker 3 / S3M → FastTracker 2 / XM → Impulse Tracker / IT genealogy (114 lines) |
| Research module M5 | `research/05-demoscene-culture.md` — BBS + FidoNet distribution, modarchive.org, demoparty compo structure, keygen music genre, UK rave / hardcore adoption, UNESCO intangible cultural heritage recognition (93 lines) |
| Research module M6 | `research/06-modern-trackers.md` — Renoise, OpenMPT, MilkyTracker, Furnace, FamiTracker, SunVox; Polyend Tracker, Teenage Engineering PO series, Dirtywave M8; 2026 demoparty state (112 lines) |
| Mission-pack LaTeX | `mission-pack/octamed_mission.tex` — 1,172-line LaTeX source, full citation chain, compiled to 201 KB PDF teaching artifact |
| HTML viewer stack | `index.html` (172 lines), `page.html` sticky-TOC Markdown viewer (124 lines), `mission.html` PDF embed wrapper (117 lines), `mission-pack/index.html` navigation (329 lines) |
| Project palette | `style.css` — 195 lines, Amiga workbench blue `#1A237E` + OCS copper amber-red `#BF360C` + copper-register amber `#F9A825`, signals Amiga Music sub-cluster on the Research index |
| Series registration | `www/tibsfox/com/Research/series.js` — one new entry (OCT), joins the v1.49.101-131 batch register |
| Publication pipeline | research-mission-generator → tex-to-project → HTML viewer + compiled PDF, single `feat(www)` commit |
| Parallel tracks | 2 (Alpha: hardware + cultural substrate M1/M2/M5 · Beta: software paradigm + ecosystem M3/M4/M6) |
| Release footprint | 14 files across one project directory, +2,718 insertions in a single commit (`ce91eb070`), zero deletions |

## Retrospective

### What Worked

- **Hardware-first structure grounds the entire narrative.** Starting from Paula's register-level reality (Module 1) before reaching any software innovation (Modules 2-6) makes the software story feel earned rather than assumed. A reader who understands that Paula is four DMA channels with 6-bit volume and a fixed low-pass filter can reason about *why* MOD effects look the way they do and *why* OctaMED's software-mixing choice was architecturally heroic rather than merely clever. The physics-first principle that worked in v1.49.106 AMR (Module 1 grounding amplitude modulation and NARBA before the station catalog) applied here with the same payoff.
- **Treating OctaMED as the Opus-level focal module was the right allocation.** Modules are roughly equal in length, but Module 3's depth on Kinnunen's software-mixing technique is the project's unique contribution — every other module has decent coverage elsewhere on the open internet, but a rigorous treatment of OctaMED's two-virtual-voices-per-Paula-channel architecture at the ~40% CPU cost is genuinely rare. The decision to give Module 3 the architectural weight rather than spreading attention evenly across six modules paid off in the mission-pack PDF, which leads with the OctaMED argument and treats the rest as supporting genealogy.
- **The Amiga workbench blue / OCS copper amber palette is meaningful.** `#1A237E` is literally the Amiga desktop default; `#BF360C` is the horizontal-blanking-interrupt copper register used for raster-bar effects in demos that OCT's Module 5 explicitly treats. The palette is simultaneously a brand identity and a subject-matter reference, and it places OCT alongside its Creative Infrastructure neighbors (ABL, WAL, FLS) on the Research index at a glance. Palette-as-wayfinding continues to compound across the v1.49 arc.
- **The MOD file as self-contained bundle has load-bearing lineage.** Framing the MOD as the ancestor of every later portable-bundle design (the DACP bundle, the Docker container, the self-contained cartridge) gives Module 2 conceptual weight that a pure format-spec treatment would miss. The lesson generalizes: portable objects that carry their own interpretation context outlive the platforms that birthed them.
- **Parallel tracks held at subject-matter transition.** Alpha (hardware + cultural substrate) and Beta (software paradigm + ecosystem) work as a read pair — a reader interested in the engineering reads M1/M3 back-to-back, a reader interested in culture reads M2/M5 back-to-back, a reader interested in the future reads M4/M6 back-to-back. The structure that worked for broadcast heritage (v1.49.106 AMR) works for music-technology heritage (v1.49.109 OCT); the pattern is a research-mission-generator primitive rather than a subject-specific coincidence.
- **Single commit, single project, clean history.** OCT shipped in one `feat(www)` commit (`ce91eb070`) with 14 files and no scaffolding noise. The one-commit-per-project invariant that held at 49-project batch scale (v1.49.89) and at 1-project depth (v1.49.101) continues to hold here. A convention that holds across two orders of magnitude is an invariant.

### What Could Be Better

- **The S3M / XM / IT PC tracker era deserves its own project.** Module 4's treatment of ScreamTracker 3, FastTracker 2, and Impulse Tracker is competent but compressed — each of those three DOS-era trackers represents a distinct architectural inflection (sample interpolation, envelopes, mixing engine) that could carry a full six-module study on its own. The transition from hardware-constrained Amiga tracking to software-mixed PC tracking is the richest unvisited subject in the Creative Infrastructure cluster and should be scheduled as a follow-up.
- **The chiptune revival is mentioned but not explored.** LSDJ (Little Sound DJ) on the original Game Boy, nanoloop on the Game Boy Advance, and the broader Game Boy production scene (chipmusic.org community, 8static festivals, Nullsleep, Bit Shifter, Anamanaguchi) is a parallel cultural moment that OCT touches in Module 5 but does not unpack. The chiptune scene is the first tracker culture to treat deliberately-obsolete hardware as a first-class creative constraint; it deserves dedicated treatment.
- **Hardware tracker coverage could go deeper.** The Polyend Tracker, Teenage Engineering PO series, and Dirtywave M8 each get a paragraph in Module 6, but the hardware-tracker renaissance is substantial enough to warrant its own study — the return of physical tactile tracker UIs is not incidental to the 2020s electronic-music production scene.
- **Mission-pack citation density is uneven against the arc standard.** OCT's `octamed_mission.tex` at 1,172 lines carries the historical references but is lighter on primary-source citations (Amiga hardware manuals, ProTracker source, modarchive.org catalog data) than the arc's gold standard. A citation-audit pass before the OCT PDF gets used in the College of Knowledge curriculum would tighten the bibliography.
- **No hands-on playback artifacts are included.** OCT is a literature study; it does not ship any actual `.mod` files, no recorded demo videos, no Polyend Tracker session recordings. A future companion release could add empirical artifacts — a curated set of foundational MOD files with commentary, for example — to turn OCT from secondary-source research into primary-source documentation.

## Lessons Learned

1. **The module file is the original self-contained bundle.** Samples and score in a single distributable object, small, portable, trivially shareable over BBS networks — the MOD file anticipated the DACP bundle, the Docker container, the self-describing cartridge, by a full decade and a half. Portable objects that carry their own interpretation context outlive the platforms that birthed them. Design for the bundle, not the application.
2. **OctaMED succeeded by being architecturally smarter, not by having more silicon.** Teijo Kinnunen did not demand new Paula registers; he routed two virtual voices through each existing channel and accepted the 40% CPU cost. The result was eight-voice polyphony on hardware that formally supports four. The lesson generalizes: architectural cleverness beats spec-sheet upgrades, and the scarce resource is usually not what the vendor tells you it is.
3. **The tracker vertical grid is architecturally distinct from the DAW horizontal timeline.** Time scrolling downward with explicit pattern boundaries produces different compositional habits than a horizontal track arrangement with continuous time. Neither is better; they are different tools that reward different cognitive styles. Any claim that one paradigm "replaced" the other ignores that tracker composers are still composing in 2026 using the Obarski grid.
4. **Zero-CPU playback is a design pillar, not an implementation detail.** Paula + DMA gives you audio playback that costs nothing on the main CPU; OctaMED gives that up to get more voices. The explicit tradeoff — cycles for polyphony — is a negotiation every audio architecture has to make. Making the negotiation explicit in the tool's design is what separates a serious music workstation from a toy.
5. **The BBS was infrastructure; the demoscene was culture; UNESCO made it canonical.** FidoNet and modarchive.org are infrastructure layers; the demoparty compo is the cultural institution; the UNESCO intangible-heritage recognitions (DE 2020, FI 2020, PL 2021, NL 2023) are the formal legitimation. Any treatment of tracker music that stops at the software misses that the software was the handle on a movement.
6. **Constraint is creative.** Four channels, 8-bit samples, 6-bit volume, a fixed low-pass filter at 4.4 kHz — Paula's limits are the generative force behind the entire Amiga music aesthetic. Musicians who moved to unconstrained PC tracking in the late 1990s often came back to Amiga-style constraints (ProTracker emulation, chiptune, hardware trackers) because the constraint produced the sound. Remove the constraint and you remove the signature.
7. **Software mixing is a universal pattern.** Kinnunen's OctaMED trick — multiple virtual voices routed through one hardware channel — shows up in every audio architecture thereafter: DAW buses, voice stealing in hardware synths, software sample interpolation in HD audio chains, mobile audio mixing in modern OSes. The problem is always the same: you have N hardware voices and you need M > N logical voices. The solution is always the same: software mix into the hardware bus. OctaMED is a landmark instance of a pattern that repeats everywhere.
8. **Cross-cluster linking strengthens the library.** OCT cross-references ABL (music production ecosystem), WAL (DAW landscape), FLS (FL Studio), NEH (OpenGL / demoscene overlap), and DAA (digital audio architecture). Each link is load-bearing: production tools feed tracker output, DAW paradigms inherit from tracker paradigms, FL Studio's step sequencer is genealogically a tracker, the demoscene runs on both graphics and music, digital audio architecture unifies all of it. Research projects that densely cross-reference their neighbors build a library that is navigable rather than a heap that is searchable.
9. **Palette is identity, and identity is wayfinding.** The Amiga workbench blue + OCS copper amber palette is not a brand exercise; it places OCT on the Research index where a scanning reader can recognize it by color alone. Wayfinding infrastructure compounds: each cluster-aligned palette makes every future entry easier to locate. The cost is trivial (one `style.css` file); the payoff accumulates across the entire arc.
10. **One commit per research project continues to hold at v1.49.109.** Fourteen files, 2,718 insertions, one `feat(www)` commit (`ce91eb070`), zero deletions, zero scaffolding churn. The convention held at 49-project batch scale (v1.49.89), at 1-project depth (v1.49.101), at broadcast-heritage subject matter (v1.49.106 AMR), and now at music-technology subject matter (v1.49.109 OCT). The invariant is load-bearing: it makes `git log` a research-history index.
11. **Research that produces action is harder than research that produces prose.** OCT's Module 6 catalog of modern trackers — Renoise, OpenMPT, Furnace, Polyend Tracker — is not a history lesson; it is a 2026 buyer's guide for someone looking to start composing in the tracker paradigm today. Research that ends in a working recommendation is more useful than research that ends in a bibliography, and it is proportionally harder to produce. The payoff is measured in new tracker composers, not citation counts.

## Cross-References

| Related | Why |
|---------|-----|
| `www/tibsfox/com/Research/OCT/` | The OCT research project — release artifact, 6 modules + mission-pack + HTML viewer, 2,718 lines total |
| `www/tibsfox/com/Research/OCT/index.html` | Project landing page, Amiga workbench palette, TOC to all six modules (172 lines) |
| `www/tibsfox/com/Research/OCT/page.html` | Sticky-TOC Markdown viewer for the six research modules (124 lines) |
| `www/tibsfox/com/Research/OCT/mission.html` | Mission-pack wrapper with PDF embed and LaTeX source link (117 lines) |
| `www/tibsfox/com/Research/OCT/research/01-paula-architecture.md` | MOS 8364 Paula register-level architecture, DMA timing, 14-bit hack, zero-CPU playback |
| `www/tibsfox/com/Research/OCT/research/02-mod-format.md` | MOD binary layout, effect vocabulary, VSync timing, portable-bundle design principle |
| `www/tibsfox/com/Research/OCT/research/03-octamed-deep-dive.md` | Kinnunen software mixing, two virtual voices per Paula channel, MED → OctaMED SoundStudio arc |
| `www/tibsfox/com/Research/OCT/research/04-tracker-family-tree.md` | SoundMonitor C64 → Ultimate Soundtracker → NoiseTracker → ProTracker → ST3 / FT2 / IT genealogy |
| `www/tibsfox/com/Research/OCT/research/05-demoscene-culture.md` | BBS + FidoNet, modarchive.org, demoparty compos, keygen music, UNESCO heritage recognition |
| `www/tibsfox/com/Research/OCT/research/06-modern-trackers.md` | Renoise, OpenMPT, MilkyTracker, Furnace, FamiTracker, SunVox, Polyend Tracker, M8 Dirtywave |
| `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.tex` | 1,172-line LaTeX source, full citation chain, compiled to 201 KB PDF |
| `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.pdf` | Compiled 201 KB PDF, teaching artifact for the College of Knowledge |
| `www/tibsfox/com/Research/OCT/mission-pack/index.html` | Mission-pack HTML wrapper with navigation (329 lines) |
| `www/tibsfox/com/Research/OCT/style.css` | Amiga workbench blue + OCS copper amber + copper-register amber palette (195 lines) |
| `www/tibsfox/com/Research/series.js` | Series registration — one new OCT entry joins the v1.49.101-131 batch register |
| ABL (research series) | Ableton Live — software mixing, polyphony allocation, MIDI integration, tracker-paradigm lineage in modern DAWs |
| FLS (research series) | FL Studio — step-sequencer / pattern paradigm, piano roll design, synthesis architectures genealogically descended from tracker effect columns |
| WAL (research series) | Wall-of-Sound — module file format, format genealogy, demoscene culture, chiptune, Renoise |
| NEH (research series) | NeHe OpenGL tutorials — demoscene / demoparty cultural overlap, graphics-and-music compo pairings |
| DAA (research series) | Digital Audio Architecture — software mixing, polyphony techniques, sample-rate interpolation |
| [v1.49.101](../v1.49.101/) | States, Symbols, and Tape — first post-drain release, established the depth-test pattern OCT inherits |
| [v1.49.106](../v1.49.106/) | The AM Radio Dial — immediate sibling in the v1.49.101-131 batch, same physics-first module structure |
| [v1.49.108](../v1.49.108/) | Immediate predecessor in the research batch |
| [v1.49.110](../v1.49.110/) | Immediate successor in the research batch |
| [v1.49.90](../v1.49.90/) | Drain-to-zero batch that emptied the intake queue; every post-drain release including OCT is a chosen topic |
| [v1.49.89](../v1.49.89/) | Mega-batch that validated the research-mission pipeline at 49-project breadth |
| [v1.0](../v1.0/) | The 6-step adaptive learning loop — OCT's module structure is one Observe / Detect pass over the Amiga-music domain |
| [v1.25](../v1.25/) | Ecosystem Integration — dependency DAG substrate for OCT's cross-links to ABL / FLS / WAL / NEH / DAA |
| [v1.33](../v1.33/) | GSD OpenStack — infrastructure companion to OCT's creative-infrastructure treatment |

## Engine Position

v1.49.109 is the **9th release of the v1.49.101-131 research batch** and the **97th research release of the v1.49 publication arc**. The v1.49.101-131 batch is the 31-project cohort shipped across a single session in the post-drain arc that began with v1.49.101 (SST). Series state at tag: approximately **156 `series.js` entries** after OCT registers, **147 real research directories**, **Amiga Music** inaugurated as a new sub-cluster within PNW Creative Infrastructure (joined to ABL / WAL / FLS / NEH / DAA by cross-reference), approximately **263,100 cumulative lines shipped** across the v1.49 arc. OCT is the first Amiga-music entry in the library and sets the grain size — six modules, parallel tracks, hardware-first grounding plus software-paradigm depth plus cultural ecology plus modern ecosystem catalog, LaTeX mission-pack plus HTML viewer plus compiled PDF — that future Creative Infrastructure entries (PC tracker era, chiptune revival, hardware-tracker renaissance, DAW archaeology) will inherit.

## Cumulative Statistics

- **Project count at tag:** 147 completed research directories (OCT joins as #109 of 167 in the PNW Research Series numbering).
- **Lines shipped in v1.49 arc:** ~263,100 cumulative prose + LaTeX + HTML + CSS + JS.
- **v1.49.101-131 batch progress:** 9 of 31 projects shipped (v1.49.101 SST, 102, 103, 104, 105, 106 AMR, 107, 108, 109 OCT).
- **Sub-clusters inaugurated in v1.49.101-131 to date:** Computability (SST), Broadcast Heritage (AMR), Amiga Music (OCT), plus continuations of PNW Infrastructure, Creative Infrastructure, Political Science Complex Plane.
- **Single-commit rate:** 9 of 9 batch projects shipped in one commit each. Invariant holds.
- **Format compliance rate:** 9 of 9 conform to the research-mission-generator template (index.html, page.html, mission.html, mission-pack/, research/*.md, style.css).

## Infrastructure

- `www/tibsfox/com/Research/OCT/index.html` — project landing page with Amiga workbench palette and six-module TOC (172 lines)
- `www/tibsfox/com/Research/OCT/page.html` — sticky-TOC Markdown viewer for the research modules (124 lines)
- `www/tibsfox/com/Research/OCT/mission.html` — mission-pack wrapper with PDF embed and LaTeX source link (117 lines)
- `www/tibsfox/com/Research/OCT/mission-pack/index.html` — mission-pack HTML navigation wrapper (329 lines)
- `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.tex` — 1,172-line LaTeX source with full citation chain
- `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.pdf` — compiled 201 KB PDF teaching artifact
- `www/tibsfox/com/Research/OCT/research/01-paula-architecture.md` — Paula register-level architecture (87 lines)
- `www/tibsfox/com/Research/OCT/research/02-mod-format.md` — MOD format and tracker paradigm (99 lines)
- `www/tibsfox/com/Research/OCT/research/03-octamed-deep-dive.md` — Kinnunen software mixing (103 lines)
- `www/tibsfox/com/Research/OCT/research/04-tracker-family-tree.md` — tracker genealogy (114 lines)
- `www/tibsfox/com/Research/OCT/research/05-demoscene-culture.md` — demoscene ecology (93 lines)
- `www/tibsfox/com/Research/OCT/research/06-modern-trackers.md` — modern tracker ecosystem (112 lines)
- `www/tibsfox/com/Research/OCT/style.css` — Amiga workbench palette stylesheet (195 lines)
- `www/tibsfox/com/Research/series.js` — OCT registration into the Research series index (+1 entry)

## Files

**14 files changed across one project directory. +2,718 insertions, -0 deletions in a single commit (`ce91eb070`).**

- `www/tibsfox/com/Research/OCT/index.html` — 172 lines, Amiga workbench blue / OCS copper amber palette, TOC to all six modules
- `www/tibsfox/com/Research/OCT/page.html` — 124 lines, sticky-TOC Markdown viewer
- `www/tibsfox/com/Research/OCT/mission.html` — 117 lines, mission-pack PDF embed wrapper
- `www/tibsfox/com/Research/OCT/mission-pack/index.html` — 329 lines, mission-pack HTML navigation
- `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.tex` — 1,172 lines, LaTeX source
- `www/tibsfox/com/Research/OCT/mission-pack/octamed_mission.pdf` — 201 KB binary, compiled teaching artifact
- `www/tibsfox/com/Research/OCT/research/01-paula-architecture.md` — 87 lines, Paula + DMA + 14-bit hack
- `www/tibsfox/com/Research/OCT/research/02-mod-format.md` — 99 lines, MOD binary layout + effect vocabulary
- `www/tibsfox/com/Research/OCT/research/03-octamed-deep-dive.md` — 103 lines, software mixing at ~40% CPU
- `www/tibsfox/com/Research/OCT/research/04-tracker-family-tree.md` — 114 lines, SoundMonitor → IT genealogy
- `www/tibsfox/com/Research/OCT/research/05-demoscene-culture.md` — 93 lines, BBS / demoparty / UNESCO
- `www/tibsfox/com/Research/OCT/research/06-modern-trackers.md` — 112 lines, Renoise / OpenMPT / Polyend Tracker / M8
- `www/tibsfox/com/Research/OCT/style.css` — 195 lines, cluster palette stylesheet
- `www/tibsfox/com/Research/series.js` — +1 entry, OCT registration

Cumulative series state at tag: **~156 `series.js` entries, ~147 real research directories, Amiga Music sub-cluster inaugurated within PNW Creative Infrastructure, ~263,100 lines shipped across the v1.49 arc, 9th release of the 31-project v1.49.101-131 batch, 1 project chosen rather than processed.**

---

> *Fourteen files. Six modules. Two thousand seven hundred lines of prose and LaTeX. Paula was four channels and a hardware low-pass filter; OctaMED turned it into eight. The MOD file outlived the machine that birthed it by three decades and is still the portable-bundle principle every containerized system reinvents. The tracker grid Karsten Obarski sketched on a 7 MHz 68000 in 1987 is being used to compose music this afternoon on a hardware unit that fits in a coat pocket. The hardware was fixed. The software was leverage. OCT is the attempt to write that architecture down while the generation that built it is still available to interview.*
