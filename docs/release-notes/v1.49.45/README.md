# v1.49.45 — "Ten"

**Released:** 2026-03-26
**Scope:** PNW Research Series — PJM (Pearl Jam & The Mainstream Path), the 43rd project in the Research line and the direct continuation of v1.49.44's GRV (Green River). Nine-module music-and-ethics atlas covering the 1987 Green River split, Andrew Wood's death, the formation of Mookie Blaylock → Pearl Jam, the Ten debut that went 13× Platinum, the 1994 Ticketmaster fight vindicated by the 2024 DOJ case, the 2000 Roskilde disaster where nine fans died, and a 35-year discography in which the band deliberately never made Ten again
**Branch:** dev → main
**Tag:** v1.49.45 (2026-03-26T01:45:26-07:00) — merge commit `128b7754c`
**Commits:** v1.49.44..v1.49.45 (3 commits: content `fd115be4c` + docs `e300e9f16` + merge `128b7754c`)
**Files changed:** 22 (+4,231 / −2, net +4,229) — 19 new PJM tree files, 1 new research sidecar (`docs/research/pearl-jam.md`), 1 new README (`docs/release-notes/v1.49.45/README.md`), 2 modified (Research hub index + series.js), 1 minor top-level hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.44 — "Skill Check" (PR #28 + TSL project)
**Successor:** v1.49.46 — the next Research module in the line
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module that drops into the v1.49.38 multi-domain docroot at `www/tibsfox/com/Research/PJM/`
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** Eddie Vedder, Stone Gossard, Jeff Ament, Mike McCready, and Matt Cameron — and to the nine who died at Roskilde (Carsten Nielsen, Frederik Wandrup Nielsen, Jakob Svejstrup Hansen, Anthony Hurtado, Henrik Bondebjerg, Allan Tønnesen, Thomas Dahlgren, Niels Klokkerholm, Wojciech Krzysztof Kazibut)
**Epigraph:** *"They could have made Ten twelve times and sold 150 million copies. Instead they made twelve different albums and sold 85 million. The difference is artistic integrity."*

---

## Summary

**PJM is the direct continuation of v1.49.44's GRV (Green River) and closes the mainstream branch of the Green River family tree.** Pearl Jam does not exist without the 1987 Green River split. v1.49.44 documented that split as the end of GRV; v1.49.45 documents it as the beginning of PJM. Module 01 of PJM begins exactly where Module 05 of GRV ended — with Stone Gossard and Jeff Ament leaving for Mother Love Bone, Mark Arm and Steve Turner leaving for Mudhoney, and a question about whether commercial ambition and punk integrity could both be right. Module 08 of PJM answers that question: both paths were right. This is the first time in the Research series that two consecutive releases have shipped as the two sides of a single story, and the cross-module continuity — Green River's last module resolving into Pearl Jam's first — is the most direct lineage the series has ever produced.

**Nine research modules, not eight, because the story needed a verification matrix as its own module.** Prior Research projects converged on eight-module structures (seven narrative modules plus a verification matrix as Module 08). PJM breaks that pattern by running eight narrative modules (01 Two Bands From One, 02 Alive, 03 Twelve Albums No Compromises, 04 The Fight They Lost And Were Right About, 05 Every Show Different, 06 Fight The System From Within, 07 Never Ten Again, 08 The Path That Was Right) plus a ninth module — 09 Alive Verification — that carries the source audit for all 36 citations. The shift to a nine-module layout is deliberate: Pearl Jam's legacy is a 35-year arc, not a compressed founding story, and forcing it into seven narrative beats would have flattened the Ticketmaster/Roskilde/activism modules that make the project more than a band profile. The verification module retains the Module 08 audit pattern WYR (v1.49.43) established, but the number on the file is 09 because the narrative needed eight narrative rooms, not seven.

**The Ten name does three jobs at once.** Ten is Pearl Jam's 1991 debut album, the record that went Diamond (13× Platinum), defined an era alongside Nevermind, and was named after Mookie Blaylock's jersey number before NBA trademark concerns forced the band to rename itself. Ten is also the tenth month of the project's own calendar if you count Research-project cadence, but more importantly Ten is the claim the release title makes: the debut album is what the entire subsequent discography is measured against, and Pearl Jam's deliberate refusal to make Ten again is the thesis Module 07 defends. The epigraph — "They could have made Ten twelve times and sold 150 million copies. Instead they made twelve different albums and sold 85 million. The difference is artistic integrity." — is the project's compression of itself into one sentence. Every module is a different argument for why that tradeoff was the right one.

**Roskilde is handled with gravity, not spectacle.** On 30 June 2000 at the Roskilde Festival in Denmark, nine young men died in a crowd crush during Pearl Jam's set. Module 05 "Every Show Different" names all nine victims with their ages and nationalities, documents the band's decision to suspend touring, and treats the aftermath as institutional change: every crowd-safety protocol adopted across the festival circuit after 2000 is, directly or indirectly, a memorial to those nine. The through-line — "Nine people died at Roskilde. Every safety protocol since is a memorial." — carries the weight without exploitation. The dedication line on this release names all nine victims alongside the five band members, making explicit that the release is as much about the fans lost as about the musicians. Research that names the dead treats them as people, not statistics.

**The Ticketmaster module (04) is the most systems-relevant piece of music research in the entire Research series.** In 1994 Pearl Jam filed a Department of Justice complaint against Ticketmaster alleging monopolistic practices — no pre-show notifications, hidden service fees, exclusive venue contracts that left the band unable to play large markets without routing through a single vendor. They lost. The DOJ declined to prosecute. Pearl Jam tried for two tours to route around Ticketmaster (using alternative venues and alternative ticket brokers), took a commercial hit, and eventually had to return to Ticketmaster-exclusive venues to keep touring viable. Thirty years later in 2024 the DOJ filed a new antitrust case against Live Nation / Ticketmaster alleging the exact practices Pearl Jam named in 1994. Module 04 documents the two cases side by side: what the band said, what the DOJ said, what changed, what didn't. This is music research that produces transferable systems insights — the module maps cleanly onto infrastructure (SYS), trust systems (BRC), corporate-ethics lineage (WYR), and the general thesis that the correct answer can be obvious decades before the institutional response arrives.

The 43rd Research project shipped as a single atomic unit. The content commit `fd115be4c` "feat(www): add PJM research project — pearl jam, the mainstream path" lands 20 PJM tree files (nine research modules totaling 1,702 lines, four mission-pack files, three HTML page-shell files, one stylesheet, two navigation-touch updates, the research sidecar, and a minor hub count update) in a coherent diff. The documentation commit `e300e9f16` "docs(release-notes): add v1.49.45 ten — pearl jam" lands the README stub. The merge commit `128b7754c` "Merge branch 'dev'" pulls dev into main for the tag. Total weight: 22 files changed, +4,231 insertions, −2 deletions across 3 commits. A bisect through the v1.49.44..v1.49.45 window finds exactly one meaningful commit (`fd115be4c`) where the PJM project existed or did not exist; the other two commits are the documentation stub and the merge bridge. No tooling rides in on this release; no hook, no schema, no build-system touch. PJM is pure new surface slotted into the multi-domain docroot that v1.49.38 built.

The sub-cluster arithmetic is now coherent. The Music Research sub-cluster of the PNW Research Series now has four entries and a through-line: WAL (parody, the Weird Al entry) → DDA (wordplay) → GRV (geographic sound, the Green River split) → PJM (the mainstream path from that split). Two of the four — GRV and PJM — are documented on both sides of the same historical moment. The sub-cluster is the first in the Research series where the projects form a deliberate narrative arc rather than a loose thematic grouping. A reader who opens WAL, DDA, GRV, and PJM in sequence can trace a coherent argument about how music gets to the listener, how parody and wordplay function as genre positions of their own, and how the Pacific Northwest produced two bands out of one creative tension that neither Mother Love Bone's tragedy nor Ticketmaster's monopoly could kill.

Module 08 "The Path That Was Right" is the resolution that makes the release more than a band history. Nirvana ended with Cobain's death in 1994. Soundgarden ended with Cornell's death in 2017. Alice in Chains ended with Staley's death in 2002. Pearl Jam is still playing. Module 08 argues that survival is its own argument — not because the band is musically superior to its lost peers, but because survival lets the body of work accumulate. Twelve albums, 35 years of touring, a still-active fan community (the Ten Club), a son of the founding bassist (Eddie Vedder's daughter Olivia is now contributing vocals on recent tours) — this is the cumulative legacy the module treats as meaningful. Research that pretends equal-tragic endings are somehow more artistically pure than longevity is itself a form of romanticism; Module 08 refuses that romanticism explicitly.

**The Grunge Black-and-Amber palette is theme-aligned with the subject matter.** PJM's stylesheet pairs charcoal `#212121` (the black of a grunge album cover) with alive-amber `#F9A825` (the warm stage-light amber that reads from the fifth row at any arena the band has played for three decades). Two theme colors, chosen specifically — dark and alive — stay at 74 lines of CSS. The palette carries the project without decoration. The WYR (v1.49.43) lesson that two colors can carry a whole project is directly applied here; the stylesheet's minimalism is a deliberate continuation of the WYR bark/evergreen pattern, not a default.

The commit pattern matches the WYR/GRV cadence and the reader can recover the work from the README alone. Content commit (atomic), docs commit (stub), merge commit (dev → main). Three commits, twenty-two files, no intermediate broken state. What shipped: nine research modules totaling 1,702 lines plus the mission-pack triad (HTML + markdown + LaTeX + pre-rendered PDF) and the page shell (index + page + mission HTML). Why it shipped: to close the mainstream branch of the Green River family tree and to add the Ticketmaster/Roskilde/activism ethics layer to the PNW music atlas. How it was verified: Module 09 "Alive — Verification" enumerates 36 sources and documents confidence per claim; the 15 cross-referenced projects (referenced in Module 08's legacy-connections section) were checked against the Research series index; the page renders cleanly under the multi-domain docroot; the `series.js` and `Research/index.html` updates were link-walked. What to read next: Module 04 "The Fight They Lost and Were Right About" is the systems module, Module 05 "Every Show Different" is the hardest module to read, Module 07 "Never Ten Again" is the aesthetics module that justifies the release title, and Module 08 "The Path That Was Right" is where the arc resolves.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| PJM project tree | New directory `www/tibsfox/com/Research/PJM/` with `index.html` (119 lines), `page.html` (207 lines), `mission.html` (60 lines), and `style.css` (74 lines) wired into the multi-domain docroot |
| Research module 01 — Two Bands From One | `research/01-green-river-to-pearl-jam.md` (203 lines) — the 1987 Green River split, Andrew Wood's overdose, the San Diego demo tape, Mookie Blaylock → Pearl Jam rename |
| Research module 02 — Alive | `research/02-ten.md` (182 lines) — the 1991 debut album, Rick Parashar sessions, "Alive"/"Jeremy"/"Even Flow", 13× Platinum (Diamond) certification, decade-defining commercial arc |
| Research module 03 — Twelve Albums, No Compromises | `research/03-discography.md` (191 lines) — full discography from Ten through Dark Matter, with a per-album thesis showing deliberate stylistic difference from Ten |
| Research module 04 — The Fight They Lost And Were Right About | `research/04-ticketmaster.md` (176 lines) — 1994 DOJ complaint, two tours routing around Ticketmaster, commercial impact, 30-year vindication in the 2024 Live Nation antitrust case |
| Research module 05 — Every Show Different | `research/05-live-community.md` (189 lines) — Roskilde 2000 crowd crush, the nine fans named, crowd-safety institutional change, the Ten Club and live-tape culture |
| Research module 06 — Fight the System From Within | `research/06-activism-ethics.md` (188 lines) — Vitalogy's anti-consumerism, Rock the Vote, pro-choice and reproductive-rights benefit shows, 30 years of politically explicit music without sanctimony |
| Research module 07 — Never Ten Again | `research/07-musical-evolution.md` (200 lines) — the aesthetic thesis: Pearl Jam deliberately made each album different from Ten, with a per-album evidence table |
| Research module 08 — The Path That Was Right | `research/08-legacy-connections.md` (189 lines) — Nirvana / Soundgarden / Alice in Chains endings, survival as its own argument, 15 cross-referenced Research projects |
| Research module 09 — Alive Verification | `research/09-verification-matrix.md` (184 lines) — 36-source audit, confidence per claim, inheritable verification-matrix pattern adapted from WYR Module 08 |
| Mission-pack triad | `mission-pack/index.html` (114 lines) + `mission-pack/mission.md` (445 lines) + `mission-pack/pearl-jam-mission.tex` (988 lines) + pre-rendered `mission-pack/pearl-jam-mission.pdf` (178,066 bytes) |
| Research sidecar | `docs/research/pearl-jam.md` (445 lines) — standalone markdown companion readable outside the www tree; byte-parallel with `mission-pack/mission.md` |
| Grunge black-and-amber theme | `style.css` pairs charcoal `#212121` with alive-amber `#F9A825` — theme colors chosen to read as "grunge album cover + stage-light amber", 74 lines of CSS total |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 / −2 lines) to add the PJM card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to wire PJM into Prev/Next flow; `www/tibsfox/com/index.html` updated (±1 line) for hub count |
| Atomic content commit | `fd115be4c` lands all 20 PJM tree files plus navigation in a single diff; bisect through v1.49.44..v1.49.45 finds exactly one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` generated at parse confidence 0.95, kept for DB-driven navigation even after this README uplift rewrites the narrative surface |
| Dedication expansion | Dedication names all nine Roskilde victims alongside the five band members — research that names the dead treats them as people, not statistics |

---

## Part A: Pearl Jam — The Mainstream Path

- **Seattle Origins:** Stone Gossard and Jeff Ament leave Green River in 1987, form Mother Love Bone with Andrew Wood; Wood overdoses in March 1990, days before MLB's debut was to ship. The demo tape Gossard and Ament cut as a grief project travels from Seattle to San Diego via a friend-of-a-friend (Jack Irons) and reaches a surfer named Eddie Vedder, who writes three songs in one week on a surf trip and mails the tape back.
- **Formation and Naming:** The new band first plays as Mookie Blaylock (named for the NBA point guard whose jersey number was 10); NBA trademark concerns force a rename; the debut album retains the jersey-number tribute as its title, Ten. First show 22 October 1990 at the Off Ramp Café in Seattle.
- **Ten (1991):** Produced by Rick Parashar at London Bridge Studios, released 27 August 1991 — four weeks before Nevermind. "Alive", "Even Flow", and "Jeremy" as singles; the album goes 13× Platinum (Diamond certification) in the United States, making it one of only a handful of rock debuts to reach that level. The Jeremy music video — based on the 1991 suicide of 16-year-old Jeremy Delle in Richardson, Texas — wins four MTV Video Music Awards in 1993.
- **Discography Discipline:** Twelve studio albums spanning Ten (1991) through Dark Matter (2024), each deliberately stylistically different from the one before. Vs. (1993) stripped to rawer production; Vitalogy (1994) experimental and anti-commercial; No Code (1996) explicitly designed to shed fans who wanted Ten again; Yield (1998) recovery; Binaural (2000) claustrophobic; Riot Act (2002) political; Pearl Jam (2006) garage-rock reset; Backspacer (2009) poppy; Lightning Bolt (2013) anthem-rock; Gigaton (2020) climate-anxious; Dark Matter (2024) Andrew Watt production, renewed energy.
- **The Ticketmaster Fight (1994–1995):** DOJ complaint alleging monopolistic ticketing practices; two summer tours routed around Ticketmaster venues (using alternative ticket vendors like ETM and alternative venues like drive-in theaters); commercial hit of roughly $30 million in lost gate; DOJ declines prosecution; band eventually returns to Ticketmaster-exclusive venues to keep touring viable; vindicated in 2024 when the DOJ files antitrust case against Live Nation / Ticketmaster alleging the same practices Pearl Jam named in 1994.
- **Roskilde (30 June 2000):** Crowd crush at Roskilde Festival in Denmark during "Daughter"; nine young men die (Carsten Nielsen 19, Frederik Wandrup Nielsen 17, Jakob Svejstrup Hansen 22, Anthony Hurtado 24 Argentina/Sweden, Henrik Bondebjerg 24, Allan Tønnesen 19, Thomas Dahlgren 26, Niels Klokkerholm 25, Wojciech Krzysztof Kazibut 25 Poland); band stops the set mid-song when they realize what is happening; suspends touring for the remainder of the year; Binaural tour resumes in 2001 with new barrier configurations and revised crowd-safety protocols that propagate through the global festival circuit.
- **Activism and Ethics:** Rock the Vote from 1992 forward; pro-choice benefit shows including the 2004 Vote for Change tour; Vitalogy (1994) as explicitly anti-consumerist album; benefit concerts for Kosovo refugees (1999), Iraq War protest (2003), Hurricane Katrina relief (2005), Moore Oklahoma tornado (2013), Obama and Clinton campaigns, climate activism around Gigaton. Benefit work treated as sustained practice, not rebranded PR.
- **Legacy in 2026:** Twelve studio albums, 85+ million records sold, still actively touring, still doing benefit shows, Eddie Vedder's daughter Olivia contributing vocals on recent tours, the Ten Club (the oldest continuously operating rock fan club) still running, Pearl Jam Radio on Sirius still broadcasting live recordings. Survival as accumulated body of work, not just biological continuation.

---

## Part B: The Sub-Cluster — Music Research as a Series

- **Sub-Cluster Composition:** The Music Research sub-cluster inside the PNW Research Series has four entries: WAL (Weird Al / parody), DDA (wordplay), GRV (Green River / geographic sound and the split), PJM (the mainstream path). Four projects, each with its own three-letter code, each with its own palette, each with its own verification matrix.
- **Continuity with GRV:** v1.49.44's GRV module shipped in the prior release; PJM Module 01 "Two Bands From One" begins exactly where GRV Module 05 ended — the 1987 split. The two projects form a single two-sided narrative: GRV tells the indie/punk branch (Mudhoney, Mark Arm, Steve Turner), PJM tells the mainstream branch (Pearl Jam, Stone Gossard, Jeff Ament). Both paths were right.
- **Grain Size Experiment:** PJM is the first Research project to ship nine modules instead of eight. Eight narrative modules plus a verification matrix as Module 09 rather than Module 08. The shift is experimental; future music-sub-cluster projects may stay at nine if the biographical arc warrants the extra module, or retreat to eight if seven narrative beats prove sufficient. The grain size is no longer assumed to be a fixed constant — it is a per-project decision informed by the subject.
- **Theme Color Discipline:** Charcoal `#212121` + alive-amber `#F9A825`. Two colors. Same discipline as WYR's bark brown + evergreen. The sub-cluster's theme palette convention — one dark grounding color plus one alive highlight — is now stable across both WYR (environmental history) and PJM (music history). Future Music sub-cluster modules can reuse the structural pattern (charcoal + highlight) while varying the highlight to match the subject.
- **Cross-Referenced Projects:** PJM Module 08 explicitly references 15 prior Research projects, including GRV (v1.49.44) for the direct continuity, WYR (v1.49.43) for corporate-ethics lineage, TIBS for Coast Salish cultural layer, and the ECO/CAS/COL ecology cluster for the Pacific Northwest ground. The count is lower than WYR's 24 because the subject is tighter (one band, one arc) but the density per referenced project is higher (each citation is loaded with specific content).
- **Verification Matrix as Inherited Pattern:** WYR (v1.49.43) introduced the Module 08 verification matrix as a single-file source audit. PJM inherits the pattern directly: Module 09 "Alive — Verification" is the same format — claim + source + confidence — extended to 36 citations covering band history, Roskilde forensics, Ticketmaster DOJ filings, and discography metadata. The pattern is now standard for every Research module in the series.
- **Mission-Pack Triad:** Mission-pack layout (HTML + markdown + LaTeX + pre-rendered PDF) continues from WYR. PJM's mission-pack uses the filename prefix `pearl-jam-mission` rather than the bare `mission` that WYR used; minor filename divergence, zero structural change. Future sub-cluster modules may standardize on the `<project>-mission.<ext>` convention across all new projects.
- **Atomic Commit Discipline:** Content commit `fd115be4c` lands all 20 PJM tree files plus navigation in one diff. Docs commit `e300e9f16` lands the stub. Merge commit `128b7754c` bridges dev into main. Three commits, no intermediate broken state, bisect-friendly. This is the same three-commit pattern WYR used and every Research project since v1.49.38 has used.

---

## Retrospective

### What Worked

- **The GRV→PJM continuity is the strongest lineage in the entire Research series.** Module 01 of PJM begins exactly where Module 05 of GRV ended. Module 08 of PJM resolves the question Module 05 of GRV asked. Two consecutive Research projects shipped as the two sides of a single story. This is the Research series working as an interconnected network, not as a catalog of isolated studies. Future sub-clusters can use the GRV/PJM template: pick a subject with a natural two-sided arc, ship the halves in consecutive releases, let the cross-module seams do the narrative work.
- **Module 04 "The Fight They Lost And Were Right About" is the most systems-relevant piece of music research the series has ever produced.** A band fighting a monopoly in 1994, losing commercially, being vindicated by the DOJ 30 years later — this maps directly to infrastructure (SYS), trust systems (BRC), and corporate-ethics lineage (WYR). The module documents both the 1994 DOJ complaint and the 2024 Live Nation case side by side; the side-by-side layout is the reason the module reads as systems analysis rather than music journalism. Music research that produces transferable systems insights is the highest-value mode the Research series can operate in.
- **Roskilde handled correctly.** All nine victims named with ages and nationalities in Module 05 and in the release dedication. Aftermath documented as institutional change (crowd-safety protocols across the festival circuit), not as dramatic narrative. The through-line "Nine people died at Roskilde. Every safety protocol since is a memorial." carries the weight without exploitation. Research that names the dead treats them as people, not statistics — this should be the standard for every Research module that touches a disaster going forward.
- **Nine-module structure earned its extra module.** Breaking from the eight-module WYR/GRV template was the right call for a 35-year arc. The Ticketmaster module could not have been compressed into the discography module; the activism module could not have been folded into the legacy module; the Roskilde module required its own space. Grain size should be a per-project decision, not a fixed constant.
- **Atomic content commit kept the intermediate state valid.** All 20 PJM tree files landed in `fd115be4c` as one coherent diff. A reviewer or bisect walker sees the project either present or absent, never half-built. The mission-pack triad, the research modules, the HTML shell, and the navigation updates all ship together in a bisect-friendly atomic unit.
- **The "Ten" release name holds the thesis.** Ten is the album, Ten is the jersey number, Ten is the claim the release title makes about the weight of a debut. Dedications for Research projects work best when the chosen word does three jobs at once — "Ten" earned each of its three meanings inside the modules. The WYR "Evergreen" lesson about triple-duty dedications is directly applied here and demonstrably scales.

### What Could Be Better

- **The 15 cross-references in Module 08 were listed by three-letter code but not hyperlinked inline through the prose.** A reader in PJM Module 08 who wants to jump from the mention of "WYR's corporate-ethics layer" to the WYR project's page has to navigate manually. The next uplift pass should walk the modules and add inline anchor links to every cross-referenced project. Same gap WYR had, same fix needed, not yet applied at release time.
- **Mission-pack PDF is pre-rendered and checked in as binary (178,066 bytes).** Same critique as WYR: shipping the binary is redundant with the LaTeX source `pearl-jam-mission.tex`, which can regenerate the PDF via `xelatex`. Larger repo footprint, possible merge risk if two contributors regenerate at the same time. A build-step-only PDF would be cleaner. Kept the binary in-tree for first-pass ship; worth revisiting for future modules along with the WYR PDFs.
- **Chapter stubs (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) are parser output at confidence 0.95, not human-authored.** Same state WYR shipped in. They anchor the DB-driven navigation at release time but do not match the depth of this uplifted README. The release-uplift mission is now correcting these one release at a time; PJM's chapters will either be deleted (README canonical) or rewritten (chapters as depth, README as navigation) in a later pass.
- **Filename divergence: mission-pack files are `pearl-jam-mission.tex` / `.pdf` rather than the bare `mission.tex` / `mission.pdf` WYR used.** Minor. Signals a drift from the WYR template that no one caught at review time. Either standardize future modules on `<project>-mission.<ext>` and rename WYR's files, or standardize on bare `mission.<ext>` and rename PJM's files. Pick one, apply consistently.

---

## Lessons Learned

- **Two consecutive releases can ship as the two sides of one story.** GRV (v1.49.44) and PJM (v1.49.45) are documented on both sides of the same historical moment — the 1987 Green River split. The sub-cluster template of "pick a subject with a natural two-sided arc, ship the halves in consecutive releases" is now proven and reusable. Future sub-clusters with obvious bifurcations (punk vs. pop, mainstream vs. indie, one-band-becomes-two) should use this release cadence by default.
- **The most connected music research is the research that produces systems insights.** PJM Module 04 (Ticketmaster) is the highest-leverage module in the entire Research series music sub-cluster because it maps directly onto infrastructure, trust systems, and corporate-ethics questions the rest of the series examines. Music research that stays inside music journalism is worth shipping; music research that generalizes to systems thinking is worth shipping louder.
- **Grain size is a per-project decision, not a fixed constant.** WYR converged on eight modules. PJM runs nine. Future projects may run seven or ten. The right number of modules is whatever the subject's natural arc demands — not whatever the previous project shipped. Pattern discipline should apply to the structure (verification matrix exists, mission-pack triad exists, theme-color discipline applies) but not to the module count.
- **Research that names the dead treats them as people.** All nine Roskilde victims named in Module 05 and in the release dedication with full names, ages, and nationalities. This is the standard. Any future Research module that touches a disaster, a violent event, or a public tragedy should follow the same practice: name every victim that can be named, provide ages and nationalities where known, treat aftermath as institutional change rather than dramatic narrative. The research is more honest when the humans stay visible.
- **Triple-duty dedications are a reliable signal of a well-chosen release name.** "Evergreen" (v1.49.43) did three jobs — Washington's state identity, Weyerhaeuser's branding, the literal forests. "Ten" (v1.49.45) does three jobs — the album, the jersey number, the claim. Release names that carry a single meaning feel arbitrary; release names that carry three feel inevitable. Future release-naming should actively look for the triple-duty reading before committing to a name.
- **Survival is its own argument.** Module 08 "The Path That Was Right" argues that Pearl Jam's continued existence — 35 years, 12 albums, active touring, living fan community — is a legitimate artistic claim, not just biological luck. Romanticizing the deaths of Cobain, Cornell, and Staley as somehow more artistically pure than Pearl Jam's longevity is a form of aesthetic dishonesty the module refuses. Research that resists the romance of tragic endings is research that respects the work that actually got made.
- **Verification matrices inherit.** The Module 08 verification matrix that WYR introduced was directly inherited by PJM (as Module 09, because of the nine-module structure). Pattern inheritance across Research projects is now the default assumption — when a project discovers a structural affordance, subsequent projects copy it until the affordance stabilizes. Over time the structural-affordance set will be large enough that new projects are mostly structural composition, with the editorial work concentrated on the specific subject.
- **Atomic content commits keep bisect honest.** Content commit `fd115be4c` landed all 20 PJM tree files plus navigation updates as one coherent diff. A bisect through v1.49.44..v1.49.45 finds exactly one meaningful state transition. The commit discipline is no longer optional for Research projects — it is the default, and it pays back every time someone needs to bisect across the series to find when a specific cross-reference or theme color convention was introduced.
- **Corporate history and ethics critique can coexist at the artist level.** WYR (v1.49.43) established that corporate history and environmental critique can coexist in one project. PJM (v1.49.45) extends the principle to artist-level research: commercial success (13× Platinum), ethical commitments (Ticketmaster fight, activism), tragic failure (Roskilde), and continued work (twelve albums, 35 years) all live in the same project without suppression. Research that holds complexity is more useful than research that picks a side.
- **The Research series is now dense enough that each new project inherits its context.** PJM could not have shipped first. It needs GRV (for the split), WYR (for the corporate-ethics pattern), TIBS (for the Coast Salish cultural layer), and the ecology cluster (for the Pacific Northwest ground) to already exist as reference points. Research-series maturity is an emergent property of the accumulation — the 43rd project is easier to write than the first because 42 prior projects have already mapped the bioregion.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.44](../v1.49.44/) | Predecessor — "Skill Check"; PR #28 plus TSL project, and the release that shipped GRV Module 05 which PJM Module 01 directly continues |
| [v1.49.46](../v1.49.46/) | Successor — the next Research module in the line |
| [v1.49.43](../v1.49.43/) | WYR "Evergreen" — source of the verification-matrix pattern (inherited by PJM Module 09), the two-color theme discipline, and the atomic-content-commit cadence |
| [v1.49.42](../v1.49.42/) | "The Mote in God's Eye" — TSL project predecessor in the Research arc; second-degree neighbor |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot PJM drops into; v1.49.45 is another data point for the refactor's velocity payoff at project 43 |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 43rd member ships here |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — cross-referenced indirectly by PJM Module 08's legacy-ecosystem context |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — cross-referenced by PJM Module 08 for the Coast Salish cultural-layer context in the PNW music sub-cluster |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas cross-referenced by PJM Module 01's Seattle-venue geography |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; PJM is an Observe→Compose content-release cycle applied to the Music Research sub-cluster |
| `www/tibsfox/com/Research/PJM/` | New project tree — 19 new files totaling the PJM surface plus one pre-rendered PDF |
| `www/tibsfox/com/Research/PJM/research/` | Nine research modules totaling 1,702 lines — the core narrative |
| `www/tibsfox/com/Research/PJM/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/PJM/research/09-verification-matrix.md` | Source-audit matrix documenting 36 citations across modules 01–08 |
| `docs/research/pearl-jam.md` | 445-line markdown sidecar readable outside the www tree — PJM's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 / −2 lines) to add the PJM card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to wire PJM into the series flow |
| `www/tibsfox/com/index.html` | Top-level hub updated (±1 line) for Research project count |
| `fd115be4c` | Content commit — 20 PJM tree files plus navigation landed atomically |
| `e300e9f16` | Docs commit — release-notes stub for v1.49.45 |
| `128b7754c` | Merge commit — dev → main for the v1.49.45 tag |

---

## Engine Position

v1.49.45 is the 43rd project in the PNW Research Series and the release that closes the mainstream branch of the Green River family tree. The predecessor, v1.49.44 "Skill Check", shipped PR #28 plus a TSL project and — critically — shipped GRV, whose Module 05 ended with the 1987 Green River split. PJM's Module 01 picks up exactly at that split; the two releases are the two sides of a single two-sided narrative shipped in consecutive weeks. The successor, v1.49.46, will continue the Research-project-per-release cadence the v1.49.x line has maintained since v1.49.22. The Music Research sub-cluster now has four entries — WAL → DDA → GRV → PJM — and is the first sub-cluster in the series where the projects form a deliberate narrative arc rather than a loose thematic grouping. Looking backward, v1.49.45 is a direct application of the WYR (v1.49.43) pattern library: verification matrix as its own module, two-color theme discipline, atomic content commit, triple-duty dedication, and the multi-domain docroot slot the v1.49.38 refactor reserved. Looking forward, every subsequent Research project inherits the affordances PJM added: the nine-module grain size as a legitimate option when subject scale warrants it, the dedication-that-names-the-dead pattern for any project touching a disaster, the two-sides-of-one-story sub-cluster template for subjects with natural bifurcations, and the systems-relevance filter that asks whether a music-research module produces transferable insights beyond its own subject. The Research series is now mature enough at project 43 that each addition is both incremental (one more project on the shelf) and cumulative (one more structural or editorial pattern available to project 44).

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.44..v1.49.45) | 3 (content `fd115be4c` + docs `e300e9f16` + merge `128b7754c`) |
| Files changed | 22 |
| Lines inserted / deleted | 4,231 / 2 |
| New files in PJM tree | 19 (plus one pre-rendered PDF binary) |
| Research modules (markdown) | 9 (1,702 lines total) |
| Mission-pack files | 4 (`index.html` 114 + `mission.md` 445 + `pearl-jam-mission.tex` 988 + `pearl-jam-mission.pdf` 178,066 bytes) |
| Page-shell files | 3 (`index.html` 119 + `page.html` 207 + `mission.html` 60) |
| Stylesheet | 1 (`style.css` 74 lines) |
| Research sidecar (outside www) | 1 (`docs/research/pearl-jam.md`, 445 lines) |
| Release-notes README | 1 (66 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects (Module 08) | 15 |
| Sources audited in verification matrix (Module 09) | 36 |
| Theme colors | 2 (`#212121` charcoal, `#F9A825` alive-amber) |
| Research project number in series | 43 |
| Music Research sub-cluster size after this release | 4 (WAL, DDA, GRV, PJM) |
| Roskilde victims named in the release dedication | 9 |
| Pearl Jam studio albums surveyed | 12 (Ten 1991 → Dark Matter 2024) |

---

## Files

- `www/tibsfox/com/Research/PJM/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/PJM/research/01-green-river-to-pearl-jam.md` — 203 lines; the 1987 split, Andrew Wood, demo tape to San Diego
- `www/tibsfox/com/Research/PJM/research/02-ten.md` — 182 lines; the 1991 debut, 13× Platinum, Rick Parashar
- `www/tibsfox/com/Research/PJM/research/03-discography.md` — 191 lines; twelve studio albums, per-album thesis
- `www/tibsfox/com/Research/PJM/research/04-ticketmaster.md` — 176 lines; 1994 DOJ complaint, 2024 DOJ vindication
- `www/tibsfox/com/Research/PJM/research/05-live-community.md` — 189 lines; Roskilde 2000, nine named victims, Ten Club, crowd-safety protocols
- `www/tibsfox/com/Research/PJM/research/06-activism-ethics.md` — 188 lines; 30 years of explicit activism without sanctimony
- `www/tibsfox/com/Research/PJM/research/07-musical-evolution.md` — 200 lines; "Never Ten Again" aesthetic thesis
- `www/tibsfox/com/Research/PJM/research/08-legacy-connections.md` — 189 lines; survival as argument, 15 cross-referenced Research projects
- `www/tibsfox/com/Research/PJM/research/09-verification-matrix.md` — 184 lines; 36-source audit for modules 01–08
- `www/tibsfox/com/Research/PJM/mission-pack/index.html` — 114 lines
- `www/tibsfox/com/Research/PJM/mission-pack/mission.md` — 445 lines
- `www/tibsfox/com/Research/PJM/mission-pack/pearl-jam-mission.tex` — 988 lines
- `www/tibsfox/com/Research/PJM/mission-pack/pearl-jam-mission.pdf` — 178,066 bytes
- `www/tibsfox/com/Research/PJM/index.html` — 119 lines; card landing
- `www/tibsfox/com/Research/PJM/page.html` — 207 lines; full-site read
- `www/tibsfox/com/Research/PJM/mission.html` — 60 lines; mission-pack bridge
- `www/tibsfox/com/Research/PJM/style.css` — 74 lines; charcoal + alive-amber theme
- `docs/research/pearl-jam.md` — 445 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 / −2 lines; hub card added for PJM
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring
- `www/tibsfox/com/index.html` — ±1 line; top-level hub count update

Aggregate: 22 files changed, +4,231 insertions, −2 deletions across 3 commits (content `fd115be4c` + docs `e300e9f16` + merge `128b7754c`), v1.49.44..v1.49.45 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.44](../v1.49.44/) · **Next:** [v1.49.46](../v1.49.46/)

> *"Is something wrong?" she said. "Of course there is." "You're still alive," she said.*
