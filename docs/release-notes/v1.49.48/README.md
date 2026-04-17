# v1.49.48 — "Secret Masters of Fandom"

**Released:** 2026-03-26
**Scope:** PNW Research Series — SMF (SMOFcon / Secret Masters of Fandom), the 46th project in the Research line and the capstone entry that closes the three-convention sub-cluster; a seven-module cultural atlas covering 42 years of convention-runner craft from the 1984 founding of SMOFcon through the volunteer burnout problem, the oral-tradition knowledge-transfer challenge, the informal politics of Worldcon and Westercon site-selection bids, and the control-plane role SMOFcon plays in a federated volunteer network that reaches across North America
**Branch:** dev → main
**Tag:** v1.49.48 (2026-03-26T03:34:12-07:00) — merge commit `b3b077828`
**Commits:** v1.49.47..v1.49.48 (3 commits: content `2aab1ec7` + docs `ce044f583` + merge `b3b077828`)
**Files changed:** 19 (+3,447 / −2, net +3,445) — 15 new SMF tree files, 1 new research sidecar (`docs/research/smofcon.md`), 1 new release-notes README, 2 modified hub/nav files (`Research/index.html`, `series.js`), 1 minor top-hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.47 — "West of the Rockies" (WCN, Westercon — the network layer of the conventions stack)
**Successor:** v1.49.49 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** every convention volunteer who learned the job by doing it, taught the next person by showing them, and never got thanked enough
**Epigraph:** *"The people who run conventions don't do it for money, recognition, or power. They do it because someone has to, and they know how."*

---

## Summary

**Meta-layer closes the stack.** SMF completes the conventions sub-cluster as the third project in a three-release arc. NWC (Norwescon, v1.49.46, 1,577 lines) is the server — fixed, persistent, anchored to one hotel in SeaTac for 48 years. WCN (Westercon, v1.49.47, 1,305 lines) is the packet — traveling, distributed, adapting to each host city over 77 years of the western-state rotation. SMF (SMOFcon, v1.49.48, 1,219 lines) is the control plane — the annual gathering where the people who build and operate the whole network teach each other how to do it. Three conventions, three architectural patterns, one community documented at each layer. The same pattern recurs throughout the Research series and the wider Fox Companies infrastructure vision: individual nodes, a federation network, and a meta-layer that keeps the federation coherent. Writing the three projects as a deliberate sequence meant each one could build on the previous, and by the third entry the stack revealed itself naturally — the reader sees three conventions and recognizes a distributed system.

**Knowledge transfer is the core problem.** SMOFcon and the Research series fight the same entropy. Convention-running knowledge lives in people's heads. Hotel contract negotiation, safety-team incident response, volunteer scheduling under pressure, registration-line triage, art-show hanging logistics — these skills transfer through apprenticeship, not manuals. When the experienced volunteers burn out or age out, the knowledge goes with them. SMOFcon has been running since 1984 as an annual attempt to externalize that oral tradition: get the people who know how budgets survive, how hotel blocks get negotiated, how safety teams operate, to teach the people who will need to know next year. It is documentation performed as conversation, and it is fighting the same entropy that every knowledge system faces. The meta-connection with the Research series is not an analogy — it IS the same problem operating at a different scale, and Module 04 names it directly.

**The name is a self-deprecating joke.** "Secret Masters of Fandom" inverted from sarcasm to badge. The "SMOF" acronym started in the 1970s when fans noticed that the same small group of volunteers kept showing up behind the scenes at every convention. Someone called them "Secret Masters of Fandom" as sarcasm; the label stuck and inverted into a badge. The "secret" is that there is nothing secret about it — just unglamorous work done by people who care. The joke-become-identity pattern is common in technical subcultures (the term "geek", "hacker", and "nerd" all followed the same arc), and documenting the cultural history of the label is part of Module 01. A community that names itself ironically tells you something about its relationship to status: the real work is happening in the conference room, not in the title.

**Small size is load-bearing.** 50–150 attendees is the constraint that makes SMOFcon researchable. Larger conventions (Worldcon, Comic-Con, DragonCon) hit tens of thousands and require sampling and approximation to document. SMOFcon fits in one conference room, one hotel floor, and one weekend. The entire social graph of the SF convention-running community can be present simultaneously. No sampling needed, no representativeness trade-off — you can interview everyone who attends, and the authoritative sources for convention-runner knowledge are the same hundred people the module is describing. A research subject that fits in one room is a research subject that can be documented completely, and Module 02 demonstrates why the size constraint was load-bearing on the community's effectiveness for four decades.

**Sub-cluster trilogies ship architectural arguments.** The Research series is mature enough to coordinate across releases. NWC + WCN + SMF at 4,101 lines across 46 research files is the first time the series has shipped three projects as a deliberate trilogy with a shared thesis. The dedication, the epigraph, the module sequence, and the cross-references all coordinate across the three releases. A reader who comes to v1.49.48 without reading v1.49.46 or v1.49.47 can still follow SMF on its own terms — the module is complete in itself — but the reader who reads all three in order sees a distributed-systems argument about volunteer organizations. This is the Research series working as a cumulative argument rather than as a sequence of independent essays, and it sets the pattern for future sub-clusters that want to operate at the same depth.

SMF ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/SMF/`) with the now-standard per-project structure: `index.html` (card landing, 101 lines), `page.html` (full-site read, 203 lines), `mission.html` (mission-pack bridge, 56 lines), `style.css` (teal `#004D40` paired with smoky amber `#795548`, 72 lines), a `research/` subtree of seven module markdown files totaling 1,219 lines, and a `mission-pack/` triad of HTML (237 lines), markdown (270 lines), LaTeX (1,008 lines), and a pre-rendered PDF (183 KB). The Research hub index gained one line to add the SMF card; `series.js` gained one entry to wire SMF into the Prev/Next flow. The only touch outside the SMF tree is a two-line hub update at `www/tibsfox/com/index.html` that bumps the project count to 46. The structural affordances of the domain-rooted docroot continue to pay dividends — adding the 46th project is a mechanical operation because the shape of a Research project is stable by this point in the series.

The commit pattern is also stable. Content commit `2aab1ec7` lands SMF in a single atomic diff (19 files, +3,447 / −2). Documentation commit `ce044f583` lands the release-notes stub. Merge commit `b3b077828` pulls dev into main. Three commits, 19 files, no intermediate broken state. A bisect through the v1.49.47..v1.49.48 window finds exactly one meaningful commit where the project existed or did not exist. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were originally auto-generated by the release-history parser at parse confidence 0.95; this uplift rewrites the README to A-grade depth while the chapter files remain as parser output for DB-driven navigation.

Module 01 "The Secret Masters" introduces the people behind the acronym — volunteers who noticed that the same small group kept showing up behind the scenes at every convention, the joke-turned-badge history, and the ethos of service without recognition. Module 02 "Since 1984" traces the convention's founding, its deliberate small size, and the decision to stay in one conference room rather than scale. Module 03 "How to Run a Convention" maps convention operations as systems engineering — budgets, hotel blocks, programming grids, safety teams, accessibility, registration, art shows, and dealer rooms, all coordinated by volunteers with no formal training, no salary, and no guarantee they will be back next year. Module 04 "The Oral Tradition" surfaces the knowledge-transfer problem at the heart of SMOFcon and explicitly connects it to the Research series' own purpose. Module 05 "Where Bids Are Made" documents the informal politics of Worldcon and Westercon site-selection bids — the pre-game lobbying, coalition-building, and deal-making that happens at SMOFcon before the official votes. Module 06 "The Convention About Conventions" makes the three-layer NWC+WCN+SMF stack explicit. Module 07 "The Con Chair's Checklist" closes with the verification matrix documenting 16 sources and 17 cross-links across the prior modules.

The "teal and smoky amber" theme pair (#004D40 for teal, #795548 for amber) reads as a convention conference room — the muted, slightly dim palette of a hotel ballroom in the off-hour between programming tracks. It is deliberately not the vibrant palettes of the entertainment-convention world (Comic-Con, DragonCon) because SMOFcon is not that kind of convention. The color choice signals the subject: this is the room where the work happens, not the room where the show happens. Research-project palettes at this depth of the series are carrying editorial weight — two colors are enough when the colors are specific enough.

The reader can recover the work from this README alone. What shipped: seven research modules totaling 1,219 lines plus the mission-pack triad (HTML, markdown, LaTeX, PDF) and the page shell. Why it shipped: to complete the three-project conventions sub-cluster (NWC + WCN + SMF) and to close the architectural argument that the community of SF convention-runners is a federated distributed system with a server layer, a packet layer, and a control plane. How it was verified: the verification matrix in Module 07 documents every factual claim against 16 sources with 17 cross-links to prior Research projects. What to read next: Module 01 for the cultural history, Module 04 for the meta-connection to the Research series' own purpose, and Module 06 for the architectural argument. The rest of this README gives the structural surface; the research gives the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| SMF project tree | New directory `www/tibsfox/com/Research/SMF/` with `index.html` (101 lines), `page.html` (203 lines), `mission.html` (56 lines), and `style.css` (72 lines) wired into the multi-domain docroot |
| Research module 01 — The Secret Masters | `www/tibsfox/com/Research/SMF/research/01-secret-masters.md` (130 lines) — SMOF acronym history, volunteer ethos, community-of-practice formation |
| Research module 02 — Since 1984 | `research/02-history-evolution.md` (155 lines) — convention founding, deliberate small scale, the one-conference-room design decision |
| Research module 03 — How to Run a Convention | `research/03-convention-operations.md` (203 lines) — budgets, hotel blocks, programming, safety, accessibility, registration; systems engineering by volunteers |
| Research module 04 — The Oral Tradition | `research/04-knowledge-transfer.md` (210 lines) — tacit-knowledge externalization, apprenticeship vs. documentation, meta-connection to the Research series' own mission |
| Research module 05 — Where Bids Are Made | `research/05-power-structure.md` (178 lines) — Worldcon and Westercon site-selection bid politics, the pre-vote lobbying layer, informal coalition-building |
| Research module 06 — The Convention About Conventions | `research/06-connections-meta.md` (190 lines) — the three-layer NWC+WCN+SMF architectural stack, control-plane framing of SMOFcon's federation role |
| Research module 07 — The Con Chair's Checklist | `research/07-verification-matrix.md` (153 lines) — 16-source audit with 17 cross-links to other Research projects |
| Mission-pack triad | `mission-pack/index.html` (237 lines) + `mission-pack/mission.md` (270 lines) + `mission-pack/mission.tex` (1,008 lines) + pre-rendered `mission-pack/mission.pdf` (183,176 bytes) |
| Research sidecar | `docs/research/smofcon.md` (270 lines) — standalone markdown companion readable outside the www tree |
| Teal + smoky amber theme | `style.css` pairs `#004D40` (deep teal, conference-room muted) with `#795548` (smoky amber, the between-programming palette) — 72 lines total |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the SMF card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to extend the Prev/Next flow to 45 entries; `www/tibsfox/com/index.html` updated (2 lines) to bump hub count to 46 projects |
| Atomic content commit | `2aab1ec7` lands all 15 SMF tree files, the sidecar, and the navigation updates in a single diff; bisect through v1.49.47..v1.49.48 finds one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The three-layer conventions stack is architecturally elegant.** NWC (server) + WCN (packet) + SMF (control plane). The mapping to infrastructure patterns is genuine, not forced — these conventions literally perform the roles their architectural labels describe. SMOFcon IS a control plane: it coordinates state transitions across the federation, transfers institutional knowledge between nodes, and maintains the health of the network. Writing the three releases as a deliberate sequence meant each one could build on the previous, and the stack reveals itself naturally by the third entry. Any future Research sub-cluster that wants to operate at the same depth now has a template to borrow.
- **Module 04 "The Oral Tradition" connects to the project's reason for existing.** The entire Research series is an attempt to externalize tacit knowledge — to document what people know but have not written down. SMOFcon faces the same challenge at human scale: get the knowledge out of people's heads before they leave. The parallel is the strongest meta-connection in the series because it is not an analogy. It IS the same problem. Naming it explicitly inside the module (rather than leaving it as a reader's exercise) lets future modules cite Module 04 as the canonical statement of the knowledge-transfer problem the whole series is fighting.
- **50–150 attendees is the right size for a research subject.** SMOFcon is small enough to document completely — the entire social graph fits in one room. No sampling needed, no approximation, no representativeness trade-off. The constraint that makes SMOFcon intimate also makes it researchable, and Module 02 demonstrates why that size was load-bearing on the community's effectiveness for four decades.
- **Teal + smoky amber paid off as an editorial choice.** The muted conference-room palette reads as the subject without needing explanatory text. Research-project palettes at this depth of the series carry editorial weight, and two colors are enough when the colors are specific enough. The SMF theme will not be confused with the NWC or WCN themes even at thumbnail size.
- **The sub-cluster trilogy pattern is reproducible.** Writing NWC → WCN → SMF as a three-release arc with a shared dedication ethos, a shared architectural metaphor, and cumulative cross-references proved that the Research series can ship coordinated multi-release arguments. The pattern can be applied to other domains where a single concept has three or more natural layers (infrastructure/network/meta, for example, or primary/secondary/tertiary sources).

### What Could Be Better

- **The cross-reference density is lower than WYR's 24.** SMF documents 17 cross-links, which is a strong count for a cultural/community project but well below the 24-project density that v1.49.43 demonstrated for the industrial layer. Future Research projects covering the cultural and volunteer-organization layer should push harder on cross-references to the ecology, infrastructure, and industrial clusters, since volunteer communities interact with all of them.
- **Module 07 "Verification Matrix" is 153 lines — smaller than WYR's 193 and SMF module 01 at 130 lines.** The 16-source audit is adequate for a cultural-history project where primary sources are conversational rather than archival, but the format could be tightened to match the WYR Module 08 pattern for direct visual comparability across the series. The next sub-cluster should standardize verification-matrix line counts to help readers see source depth at a glance.
- **The "secret masters" label carries cultural baggage that was not fully unpacked.** Module 01 names the self-deprecating irony of the SMOF acronym but does not sit with the longer conversation about how insider jargon functions in volunteer organizations — as shibboleth, as in-group marker, as barrier to new participation. A later module or a follow-on project on volunteer-community onboarding could pick up that thread. The current module chose to document the history rather than critique the present, which is the right editorial call for the first-pass project but leaves a genuine follow-on available.

---

## Lessons Learned

- **The meta-layer completes the stack.** You need three things: the thing (NWC), the network of things (WCN), and the system that maintains the network (SMF). This pattern recurs everywhere — infrastructure, conventions, the Research series itself, Fox Companies' FoxFiber + FoxCompute + FoxCapComm triad. Recognizing the pattern across domains is what the Rosetta Stone framework is for. The conventions sub-cluster is the clearest example yet because all three layers are the same kind of thing (conventions) operating at different scales, which makes the architectural point without requiring the reader to translate between domains.
- **Knowledge transfer is the hardest problem in volunteer organizations.** SMOFcon has been working on this since 1984 — 42 years of attempting to solve institutional knowledge loss through annual gatherings. The fact that the problem persists after four decades of dedicated effort tells you how hard it is. Documentation helps. Apprenticeship helps. Neither is sufficient. The combination, performed consistently over time, is the best anyone has found. That is also the Research series strategy, and naming the parallel inside Module 04 lets future modules build on it rather than rediscover it.
- **Sub-cluster trilogies ship architectural arguments, not just content.** The NWC + WCN + SMF arc demonstrates that three coordinated releases can make a point that no single release could make alone. The shared dedication register (volunteers, builders, people-who-do-the-work), the shared architectural metaphor (server/packet/control-plane), and the shared cumulative cross-references compound across the trilogy. Future Research sub-clusters should deliberately plan for this: pick the architectural argument first, pick the three projects that map to the layers, and write them in order.
- **Self-deprecating community names are information.** "Secret Masters of Fandom" tells you how the community relates to status — ironically, as insiders who reject the insider label. "Hacker", "geek", and "nerd" followed the same joke-to-badge arc. A research module that names the naming convention is doing editorial work the reader would otherwise have to do themselves, and it opens the door for cross-project comparison with other technical-subculture name-studies.
- **Size constraint can be a feature, not a bug.** SMOFcon's 50–150-attendee cap is the reason it is effective. A larger convention would lose the whole-social-graph-in-one-room property that makes knowledge transfer possible. Module 02 argues the constraint is load-bearing; other Research projects covering bounded communities (academic departments, open-source maintainer cohorts, small company teams) can borrow the same argument for why they stay deliberately small.
- **Two colors is enough when the colors are specific.** Teal `#004D40` paired with smoky amber `#795548` reads as a hotel conference room in the off-hour without needing caption text. The WYR bark-brown + evergreen pairing and the NWC/WCN theme pairings all follow the same rule: pick two colors that do the editorial work the modules need, and stop there. Adding a third color in the hope of "richness" dilutes signal.
- **Informal politics deserve their own module.** Module 05 "Where Bids Are Made" treats Worldcon and Westercon site-selection politics as a first-class subject rather than an appendix. Every democratic process has a pre-game; documenting the pre-game is where the real power analysis happens. Future Research projects covering any kind of federated governance (open-source foundations, standards bodies, academic societies) can borrow the Module 05 frame.
- **The atomic content commit pattern is worth protecting.** Landing all 15 SMF tree files, the sidecar, and the navigation updates in one diff (`2aab1ec7`) keeps the intermediate state valid. A reviewer or bisect walker sees the project either present or absent, never half-built. The pattern is cheap to maintain (one `git add` of the whole tree, one commit message) and expensive to restore if broken (unpicking mixed-state commits costs hours). Every Research release so far has honored it; the discipline should continue.
- **Dedication-as-thesis earns its register word by word.** "Every convention volunteer who learned the job by doing it, taught the next person by showing them, and never got thanked enough" is three clauses that each do editorial work. "Learned by doing it" is the apprenticeship argument. "Taught by showing them" is the oral-tradition argument. "Never got thanked enough" is the volunteer-burnout argument. The whole module arc compresses into one sentence. Research dedications that pick a generic subject miss the compression; SMF's dedication is specific enough to stand as an abstract of the project.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.47](../v1.49.47/) | Predecessor — "West of the Rockies"; WCN (Westercon), the packet layer of the three-convention stack; SMF references WCN throughout Module 05 and Module 06 |
| [v1.49.46](../v1.49.46/) | NWC (Norwescon), the server layer of the conventions stack; SMF references NWC throughout Module 03 and Module 06 |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — the 41st Research project, prior demonstration of the verification-matrix pattern that SMF Module 07 adapts for cultural-history sources |
| [v1.49.44](../v1.49.44/) | "Skill Check" — intermediate Research project between WYR and the conventions sub-cluster |
| [v1.49.45](../v1.49.45/) | Prior Research project immediately before the NWC+WCN+SMF trilogy; the release that set the stage for the sub-cluster arc |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot SMF drops into; v1.49.48 is the 8th consecutive Research project to demonstrate the refactor's velocity payoff |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 46th member ships here |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — volunteer-ecology parallel; both documents communities whose knowledge is tacit and distributed |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — oral-tradition precedent; Module 04 of SMF explicitly builds on TIBS's framing of unwritten knowledge |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas that the conventions sub-cluster places geographically; NWC at SeaTac, WCN rotating across western states, SMF at a rotating host city |
| [v1.49.26](../v1.49.26/) | BPS Bio-Physics Sensing Systems — the other infrastructure-layer project the conventions-cluster architecture rhymes with |
| [v1.49.37](../v1.49.37/) | Thermal & Hydrogen Energy Systems — another Research project documenting a volunteer + institutional community of practice |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; SMF is an Observe→Compose cycle applied to the cultural/volunteer-organization layer of the PNW bioregion |
| `www/tibsfox/com/Research/SMF/` | New project tree — 15 new files totaling the SMF surface |
| `www/tibsfox/com/Research/SMF/research/` | Seven research modules totaling 1,219 lines — the core narrative of the project |
| `www/tibsfox/com/Research/SMF/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/SMF/research/07-verification-matrix.md` | Source-audit matrix documenting 16 citations and 17 cross-links |
| `docs/research/smofcon.md` | 270-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the SMF card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to 45 entries |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) for the project-46 count |
| `2aab1ec7` | Content commit — 19 SMF tree + sidecar + nav files landed atomically |
| `ce044f583` | Docs commit — release-notes stub for v1.49.48 |
| `b3b077828` | Merge commit — dev → main for the v1.49.48 tag |

---

## Engine Position

v1.49.48 is the 46th project in the PNW Research Series and the capstone of the three-convention sub-cluster. The predecessor v1.49.47 "West of the Rockies" shipped WCN (the packet layer); the predecessor-predecessor v1.49.46 shipped NWC (the server layer). Together the three releases constitute the first multi-release architectural argument in the Research line — NWC + WCN + SMF at 4,101 lines across 46 research files. The v1.49.x line at this depth continues its cadence of one Research project per calendar release, each with its own dedication, epigraph, seven-to-eight-module structure, and two-color theme pair. Looking backward, v1.49.48 is the 8th consecutive Research project to demonstrably benefit from the structural investment made in v1.49.38 (the multi-domain docroot refactor) and the 3rd project in a deliberately coordinated sub-cluster. Looking forward, every subsequent Research project inherits three new affordances SMF established: the trilogy-arc pattern for architectural arguments that need more than one release, the meta-connection pattern that lets a module cite the Research series' own mission as its subject, and the control-plane framing for any community that operates as the coordinator of a federation. The Research series is now dense enough and structurally mature enough that each addition compounds: SMF ships as one project, closes a trilogy, and raises the floor that project 47 starts from.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.47..v1.49.48) | 3 (content `2aab1ec7` + docs `ce044f583` + merge `b3b077828`) |
| Files changed | 19 |
| Lines inserted / deleted | 3,447 / 2 |
| New files in SMF tree | 15 |
| Research modules (markdown) | 7 (1,219 lines total) |
| Mission-pack files | 4 (`index.html` 237 + `mission.md` 270 + `mission.tex` 1,008 + `mission.pdf` 183,176 bytes) |
| Page-shell files | 3 (`index.html` 101 + `page.html` 203 + `mission.html` 56) |
| Stylesheet | 1 (`style.css` 72 lines) |
| Research sidecar (outside www) | 1 (`docs/research/smofcon.md`, 270 lines) |
| Release-notes README | 1 (82 lines at release time; rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects | 17 |
| Sources audited in verification matrix | 16 |
| Theme colors | 2 (`#004D40` teal, `#795548` smoky amber) |
| Research project number in series | 46 |
| Sub-cluster project number | 3 of 3 (NWC → WCN → SMF) |
| Cumulative conventions sub-cluster weight | 4,101 research lines, 46 research files across 3 releases |

---

## Taxonomic State

After v1.49.48 the PNW Research Series taxonomy stands at 46 published projects across the core clusters. The conventions sub-cluster (NWC, WCN, SMF) is closed at 3 of 3. The ecology cluster (COL, CAS, ECO, AVI, MAM, SAL, TIBS, FFA) remains the densest neighborhood for cross-references at 8+ projects. The infrastructure cluster (SYS, CMH, BCM, SHE, OCN, BPS, THE, HGE, NND) spans 9+ projects. The industrial layer (WYR) is anchored by a single flagship project. SMF formally marks the first cultural/volunteer-organization project and opens that layer for follow-ons. Taxonomic state: 46 projects, 7 clusters, 1 closed sub-cluster (conventions), ~197,000 cumulative research lines across ~430 research modules.

---

## Files

- `www/tibsfox/com/Research/SMF/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/SMF/research/01-secret-masters.md` — 130 lines; SMOF acronym history, volunteer ethos
- `www/tibsfox/com/Research/SMF/research/02-history-evolution.md` — 155 lines; founding, small-scale design
- `www/tibsfox/com/Research/SMF/research/03-convention-operations.md` — 203 lines; operations as systems engineering
- `www/tibsfox/com/Research/SMF/research/04-knowledge-transfer.md` — 210 lines; oral tradition, meta-connection
- `www/tibsfox/com/Research/SMF/research/05-power-structure.md` — 178 lines; Worldcon/Westercon bid politics
- `www/tibsfox/com/Research/SMF/research/06-connections-meta.md` — 190 lines; three-layer architectural stack
- `www/tibsfox/com/Research/SMF/research/07-verification-matrix.md` — 153 lines; 16-source audit, 17 cross-links
- `www/tibsfox/com/Research/SMF/mission-pack/index.html` — 237 lines; mission-pack landing page
- `www/tibsfox/com/Research/SMF/mission-pack/mission.md` — 270 lines; mission-pack markdown source
- `www/tibsfox/com/Research/SMF/mission-pack/mission.tex` — 1,008 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/SMF/mission-pack/mission.pdf` — 183,176 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/SMF/index.html` — 101 lines; card landing page
- `www/tibsfox/com/Research/SMF/page.html` — 203 lines; full-site read page
- `www/tibsfox/com/Research/SMF/mission.html` — 56 lines; mission-pack bridge
- `www/tibsfox/com/Research/SMF/style.css` — 72 lines; teal + smoky amber theme
- `docs/research/smofcon.md` — 270 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for SMF
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring to 45 entries
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update to 46 projects

Aggregate: 19 files changed, +3,447 insertions, −2 deletions across 3 commits (content `2aab1ec7` + docs `ce044f583` + merge `b3b077828`), v1.49.47..v1.49.48 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.47](../v1.49.47/) · **Next:** [v1.49.49](../v1.49.49/)

> *The "secret" is that there's nothing secret about it — just unglamorous work done by people who care, documented here so the next generation doesn't have to learn it all from scratch.*
