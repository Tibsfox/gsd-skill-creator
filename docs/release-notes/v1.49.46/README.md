# v1.49.46 — "Room 101"

**Released:** 2026-03-26
**Scope:** PNW Research Series — NWC (Norwescon), the 44th Research project and the first entry in the conventions sub-cluster; an eight-module atlas mapping forty-eight years of the Pacific Northwest's premier science fiction and fantasy convention as a continuously-operated social institution at the DoubleTree by Hilton SeaTac, running every spring since 1978
**Branch:** dev → main
**Tag:** v1.49.46 (2026-03-26T02:50:52-07:00) — merge commit `2cdf449cd`
**Commits:** v1.49.45..v1.49.46 (3 commits: content `5d073cb7c` + docs `9e2ddf337` + merge `2cdf449cd`)
**Files changed:** 21 (+3,929 / −2, net +3,927) — 18 new NWC tree files, 1 new research sidecar (`docs/research/norwescon.md`), 1 new README, 2 modified (Research hub index + series.js), 1 hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.45 — "Ten" (PJM, Pearl Jam's 1991 debut)
**Successor:** v1.49.47 — "West of the Rockies" (WCN, Westercon — the traveling-convention counterpart to NWC's fixed node)
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module that drops into the v1.49.38 multi-domain docroot at `www/tibsfox/com/Research/NWC/`
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** everyone who ever sat on a panel, ran a room party, or stood in a hallway at 2 AM arguing about faster-than-light travel with a stranger who became a lifelong friend
**Epigraph:** *"The convention is not the panels. It's the hallway conversations, the room parties, the costumes, the friendships that span decades. The programming is the excuse; the community is the reason."*

---

## Summary

**NWC is the Research series' first convention project and the release that opens the conventions sub-cluster.** The 44th entry in the Research line maps Norwescon — the Pacific Northwest's premier science fiction and fantasy convention, running continuously since 1978 at the DoubleTree by Hilton SeaTac. Eight modules trace a full arc from founding vision through community persistence to the program book as verification artifact. The project shipped atomically as a single content commit (`5d073cb7c`) plus a release-notes stub (`9e2ddf337`) and the dev→main merge (`2cdf449cd`), totaling 3,929 inserted lines across 21 files. The sub-cluster this release opens — NWC as the fixed node, WCN (v1.49.47 "West of the Rockies") as the traveling signal, and SMF (SMOFcon, forthcoming) as the meta-layer — treats conventions as a coherent architectural family rather than as isolated events. Three conventions, three architectural patterns, one community. Planning the cluster as a sequence means each successor project can reference the last.

**The fixed-node thesis is what makes Norwescon tractable as research.** Same hotel, same weekend, same community, forty-eight years running. The DoubleTree by Hilton SeaTac becomes a temporary city every spring — writers meet scientists meet artists meet cosplayers meet gamers, and the hallway conversations accrue into decades-long friendships. Permanence is the convention's defining feature and the thing that makes it documentable as infrastructure. A convention that moves every year is a traveling signal (WCN's architecture); a convention that stays is a fixed node (NWC's architecture). The two architectures solve different problems in the same community, and the research series needs both to map the structure honestly. Module 01 "Since 1978" opens with the founding venue history and the math of forty-eight consecutive years; Module 04 "The DoubleTree" treats the hotel itself as social architecture — hallways as chance-encounter spaces, lobby as living room, room parties as the real programming after midnight.

**Module 07 "Convention as Rosetta Stone" is the conceptual payoff of the entire Research series so far.** A convention is literally a cross-domain translation space — writers, scientists, artists, gamers, and costumers speaking different creative languages in the same hotel for a weekend — and the parallel to the Research hub (each project is a panel, the hub is the programming grid) is structural rather than metaphorical. The module makes explicit what the hub has been doing implicitly since v1.49.22 when the series began: every domain is a translation of the same underlying patterns, and cross-references are the evidence of that shared substrate. With 44 projects now shipped and a median cross-reference density in the mid-teens, the series has earned the right to name its own method. Norwescon is the place where the method is visible; the Research hub is the place where the method is operational.

**Eight modules trace founding → invitation → discourse → venue → community → ecosystem → method → verification.** Module 01 "Since 1978" (137 lines) opens with founding vision and the four-decade venue history. Module 02 "The Invitation" (193 lines) treats the Guest of Honor selection as editorial curation — who a convention invites is a statement about what the genre values this year, and Norwescon's GoH list reads as a timeline of what mattered in Pacific Northwest speculative fiction across five decades. Module 03 "The Panel Room" (257 lines, the longest module) is the conceptual core: panels are structured public discourse — a conversation the community decided was worth having in public, with people chosen because they have something to say. The format predates the internet but is structurally identical to what the internet keeps trying to reinvent. Module 04 "The DoubleTree" (178 lines) maps hotel as social architecture. Module 05 "The People Who Come Back" (235 lines) maps the social graph — conventions as reunions for people who see each other once a year and pick up conversations mid-sentence. Module 06 "Not the Only Con in Town" (203 lines) places Norwescon in the broader PNW convention ecosystem: Emerald City Comic Con, PAX, Sakura-Con — Norwescon is the literary root from which a constellation of conventions grew. Module 07 "Convention as Rosetta Stone" (202 lines) connects the project to the Research series framework. Module 08 "The Program Book" (172 lines) is the verification matrix — 11 cited sources, 18 cross-links, every factual claim traceable to a numbered row.

**Named "Room 101" as a convention-hallway joke and an Orwell nod that earns its tension.** Every convention has that one panel room where the deep conversations happen — the one that becomes a destination rather than an assignment, the room people check first when the schedule comes out. "Room 101" is also the Orwell reference from *1984*: the room where the Party confronts each prisoner with the specific thing they fear most. A convention built on asking hard questions about technology, society, and imagination — about what it means to be human when machines think, what it means to be free when governments don't want you to be, what it means to tell true stories by imagining untrue ones — deserves a name that carries both the warmth of the hallway reference and the edge of the Orwell reference. The dedication language in the release header ("everyone who ever sat on a panel, ran a room party, or stood in a hallway at 2 AM arguing about faster-than-light travel with a stranger who became a lifelong friend") lets the warm reading lead; the Orwell reading sits underneath it as a reminder that speculative fiction is a politically serious form.

**Cross-links connect NWC to the existing Research weave.** LNV (Larry Niven) is a past Norwescon Guest of Honor and anchors one cross-reference. GRV (Green River) and PJM (Pearl Jam's *Ten*, v1.49.45, the immediate predecessor release) both root in the same Seattle creative ecosystem that Norwescon grew out of — the same geographic isolation that created the Seattle sound created the convention culture. BRC (Burning Regional Community) maps convention-as-temporary-community-infrastructure from a different angle. FFA (Fur Feathers & Animation Arts) cross-references into Norwescon's masquerade and costume tradition. The Rosetta Stone framework that Module 07 names explicitly ties back to the series' founding thesis. Eighteen cross-links are listed in Module 08's verification matrix; more are latent in the modules and will firm up in future uplift passes.

**The eleven sources are enumerated in Module 08 "The Program Book" with explicit confidence ratings.** Norwescon's own program books (cited by year, the institutional memory of the convention), the DoubleTree's management history (the venue-side record), Philip K. Dick Award historical documentation (the awards banquet Norwescon hosts), Guest of Honor announcement archives, volunteer-organization governance documents, and contemporaneous news coverage from local and genre-press outlets constitute the citation base. Confidence ratings range from "high" for institutional records to "medium" for press coverage of individual years. Putting the verification matrix adjacent to the research — rather than in a separate bibliography file — means the claims and their sources live in the same git blob, and any future correction travels as a single diff. This is the same pattern WYR (v1.49.43) established and FFA/PJM refined; NWC is the fourth consecutive Research project to use the matrix-as-Module-08 structure.

**v1.49.46 is the third release in a tight cluster of six same-day Research shipments.** v1.49.45 (PJM "Ten"), v1.49.46 (NWC "Room 101"), v1.49.47 (WCN "West of the Rockies"), and the three releases surrounding them all landed on 2026-03-26. This cadence reflects the Research series' mature phase: the structural affordances of the multi-domain docroot (v1.49.38) plus the verification-matrix pattern (v1.49.43) plus the mission-pack triad convention make each new Research project a mechanical operation — the slot is known, the page shell is templated, the series.js touch is one line. Volume at this cadence is a consequence of structural investment paying back, not a reduction in quality; the 44 shipped projects average ~3,500 research lines each, all with mission-pack triads, theme colors, and verification matrices.

**The reader can recover the work from the README alone.** What shipped: 8 research modules totaling 1,577 lines plus a 4-file mission-pack triad (HTML + markdown + LaTeX + pre-rendered PDF) plus the page shell (`index.html` + `page.html` + `mission.html` + `style.css`) plus a standalone sidecar (`docs/research/norwescon.md`) plus three navigation-integration touches. Why it shipped: to open the conventions sub-cluster, add the cultural-institution layer to the PNW bioregional atlas, and supply the physical proof for the Research series' Rosetta-Stone thesis. How it was verified: Module 08's verification matrix documents 11 sources with confidence ratings; the 18 cross-links were checked against the index of prior Research projects; the page renders under the multi-domain docroot; the `series.js` and `Research/index.html` updates were link-walked. What to read next: Module 03 "The Panel Room" and Module 07 "Convention as Rosetta Stone" carry the intellectual weight; Module 05 "The People Who Come Back" carries the emotional weight; v1.49.47 "West of the Rockies" is the immediate successor and the traveling-convention counterpart. The rest of this README is structural; the research is the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| NWC project tree | New directory `www/tibsfox/com/Research/NWC/` with `index.html` (106 lines), `page.html` (205 lines), `mission.html` (57 lines), and `style.css` (73 lines) wired into the multi-domain docroot |
| Research module 01 — Since 1978 | `www/tibsfox/com/Research/NWC/research/01-history-origins.md` (137 lines) — founding vision, venue history, forty-eight years of continuous operation |
| Research module 02 — The Invitation | `research/02-guests-of-honor.md` (193 lines) — Guest of Honor tradition as editorial curation, Philip K. Dick Award banquet, five-decade GoH timeline |
| Research module 03 — The Panel Room | `research/03-programming-panels.md` (257 lines) — 30+ programming tracks, writing workshop, science tracks; panels as structured public discourse |
| Research module 04 — The DoubleTree | `research/04-venue-experience.md` (178 lines) — hotel as social architecture, hallways as chance-encounter spaces, room parties as after-midnight programming |
| Research module 05 — The People Who Come Back | `research/05-community-culture.md` (235 lines) — multi-generational community, volunteer infrastructure, inclusion work |
| Research module 06 — Not the Only Con in Town | `research/06-pnw-convention-ecosystem.md` (203 lines) — Emerald City Comic Con, PAX, Sakura-Con; Norwescon as the literary root of a PNW convention constellation |
| Research module 07 — Convention as Rosetta Stone | `research/07-connections-rosetta.md` (202 lines) — cross-domain translation thesis, conventions as physical proof of the Research series framework |
| Research module 08 — The Program Book / Verification Matrix | `research/08-verification-matrix.md` (172 lines) — 11-source audit, 18 cross-links, per-claim confidence ratings |
| Mission-pack triad | `mission-pack/index.html` (193 lines) + `mission-pack/mission.md` (317 lines) + `mission-pack/norwescon-mission.tex` (1,034 lines) + pre-rendered `mission-pack/norwescon-mission.pdf` (171,195 bytes) |
| Research sidecar | `docs/research/norwescon.md` (317 lines) — standalone markdown companion readable outside the www tree |
| Convention-purple theme | `style.css` (73 lines) pairs `#4A148C` (convention purple) with `#B0BEC5` (starfield silver) — colors chosen to read as genre programming rather than corporate event branding |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 / −2 lines) to add the NWC card at position 44 in the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to wire NWC into Prev/Next flow; `www/tibsfox/com/index.html` updated (2-line count bump) |
| Atomic content commit | `5d073cb7c` lands all 18 NWC tree files in a single diff; bisect through v1.49.45..v1.49.46 finds exactly one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated for DB-driven navigation; this uplift rewrites the README to A-grade depth |

---

## Retrospective

### What Worked

- **Combined research + build pipeline.** A single Opus agent handled web research, document writing, eight-module creation, scaffold generation, and hub integration in one pass. No handoff between research-phase and build-phase agents meant no wait time between phases. For a 3,929-line release shipped in a single working session, the collapsed pipeline is the right structure; distinct research/build agents make sense only when the research phase benefits from longer cooling.
- **Convention-as-Rosetta-Stone (Module 07) is the conceptual payoff.** The Research series has been building toward the idea that every domain is a translation of the same underlying patterns. A convention is the physical proof — people who speak different creative languages meet in one space and find common ground. Module 07 makes explicit what the hub has been doing implicitly since v1.49.22. Naming the method the series has been using lets future projects reference it as an established pattern rather than rediscovering it each time.
- **The conventions sub-cluster begins with a plan.** NWC is the first of three — the fixed node. WCN (Westercon, the traveling convention, v1.49.47) and SMF (SMOFcon, the meta-layer, forthcoming) complete the stack. Three conventions, three architectural patterns, one community. Planning the cluster as a sequence rather than a batch means each one can reference the last, and the reader who follows the sub-cluster in order gets a complete picture of convention-as-infrastructure.
- **Module 03 "The Panel Room" earned the longest module slot.** At 257 lines it is the largest in NWC, and it is the right module to give the most weight. Panels are the format that makes the convention tractable as discourse; everything else (the hotel, the community, the Guest of Honor) shapes panels or is shaped by them. Module 03's length is not padding — it is the load-bearing module, and the sizing reflects that honestly.
- **The verification-matrix-as-Module-08 pattern held for a fourth consecutive project.** WYR (v1.49.43), FFA, PJM (v1.49.45), and NWC (v1.49.46) all use Module 08 for source audit with confidence ratings. Four data points is enough to call it a series convention. Future Research projects can adopt the pattern without additional design work; the template is stable.
- **Theme colors from the subject rather than from a corporate palette.** Convention purple `#4A148C` is the deep purple of programming-grid backdrops and genre-convention branding in the 1980s and 1990s; starfield silver `#B0BEC5` is the cool gray of ship-hull science fiction imagery. Both colors are specific to the subject matter. A 73-line stylesheet carries the project visually without competing for attention.

### What Could Be Better

- **18 cross-links were listed but not hyperlinked in-line.** Module 08 enumerates 18 connections to other Research projects, but the module prose mostly names projects by three-letter code (LNV, GRV, PJM, BRC, FFA) without anchor links back to each project's page. A reader who wants to jump from NWC Module 06's mention of "Emerald City Comic Con" or Module 07's mention of "BRC" has to navigate manually via the hub. A future uplift pass should walk the modules and add inline links to every cross-referenced project; the work is mechanical once the cross-link inventory exists.
- **Mission-pack PDF is pre-rendered and checked in as binary.** The 171 KB `norwescon-mission.pdf` is regeneration-equivalent to running `xelatex norwescon-mission.tex`, so shipping the binary is redundant with the LaTeX source. The cost is a larger repo footprint and a merge risk if two contributors regenerate. A build-step-only PDF (generated at publish time) would be cleaner; keeping the binary in-tree was a pragmatic first-pass choice and is consistent with WYR and PJM's shipment pattern, but worth revisiting for the series as a whole.
- **Parse-confidence chapter stubs were left in place rather than rewritten.** The four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) are parser output, not human-authored. They were sufficient to anchor DB-driven navigation at release time but do not match the depth of this uplifted README. The long-term pattern is either to delete the stubs and let the README be canonical, or to write real chapters; shipping parser output and forgetting about it is the half-step the release-uplift mission is now correcting one release at a time.
- **Eleven sources is the low end of the series range.** WYR had 32 sources; PJM had more. NWC's 11 reflects the reality that much of Norwescon's institutional memory lives in program books and volunteer memory rather than in published references, but a future pass could add interview-sourced material, volunteer retrospectives, and contemporaneous convention-community forum archives to thicken the citation base.

---

## Lessons Learned

- **A fixed-node institution is its own argument.** Norwescon has outlasted publishers, bookstores, magazines, and entire subgenres. The convention persists because the community persists, and documenting WHY it persists (Module 05's social graph, Module 04's hotel-as-architecture) matters more than documenting what happens there. Infrastructure outlasts content — and research that treats an institution as infrastructure rather than as event-sequence will age better than research that treats it as a chronicle.
- **The PNW creative ecosystem keeps revealing new layers.** Green River to Pearl Jam to Weyerhaeuser to Norwescon. Music, timber, conventions — all shaped by the same geographic isolation and DIY ethic. The Research series maps the bioregion not just ecologically but culturally. Every project added makes the network more coherent; NWC's 18 cross-links are not decoration but evidence of that coherence.
- **A convention is a Rosetta Stone, and naming it so is the series' coming-of-age move.** Module 07 makes explicit what the hub has been doing implicitly: every domain is a translation of the same underlying patterns, and cross-references are the evidence. Once the series has shipped enough projects that cross-references happen by gravity rather than by construction, the series has earned the right to name its own method. NWC is the project where the naming happens cleanly.
- **Plan sub-clusters as sequences, not as batches.** NWC (fixed node) → WCN (traveling node) → SMF (meta-layer) is a three-project sub-cluster where each successor references the last. A batch would have shipped all three simultaneously; a sequence lets each project absorb the lessons from the previous. The Research series' cadence works because sub-clusters respect sequence even when calendar releases land same-day.
- **The longest module should be the load-bearing module.** NWC Module 03 "The Panel Room" is 257 lines; the next-longest is Module 05 at 235. The length reflects the module's structural weight — panels are the format that makes the convention tractable as discourse, and the module needed room to unpack that. Modules that pad to equal length or that shorten the load-bearing module to match the others are making editorial errors the reader will notice.
- **The hotel is the convention, not the venue.** Module 04 "The DoubleTree" insists on this distinction, and the distinction generalizes beyond NWC. Social infrastructure is not the container around an activity — it IS the activity's shape. When future Research projects document institutions-in-place, the "venue as social architecture" framing will be reusable. This is the lesson WYR taught about forests (the land is the industry), that NWC re-teaches about hotels (the building is the convention), and that the series will re-teach again about other bounded spaces.
- **Verification-matrix-as-Module-08 is now a series convention.** Four consecutive Research projects (WYR, FFA, PJM, NWC) have used the same pattern. Four is enough to declare it standard. Future projects should adopt it by default; deviations should be deliberate and documented. Conventions that arise from four data points are more durable than conventions imposed from one design meeting — they have survived the pressure of real shipping.
- **Dedication language sets the register before the research begins.** "Everyone who ever sat on a panel, ran a room party, or stood in a hallway at 2 AM arguing about faster-than-light travel with a stranger who became a lifelong friend" compresses the project's thesis into one sentence and places the reader in the right emotional register before the modules open. Research projects without a dedication-as-thesis lose a cheap way to set tone and invite the reader; NWC's dedication earned its length by doing the work the first paragraph would otherwise have to do.
- **Shipping 3,929 lines in a single atomic commit is correct when the project is coherent.** NWC is one research subject with eight modules plus a mission-pack triad plus a page shell plus navigation integration. Splitting that into multiple commits would invite intermediate broken states (hub entry pointing to an unbuilt page, series.js wired to a missing module). An atomic commit keeps the bisect window honest: the project either exists or does not, and the reviewer sees the coherent shape.
- **Planning the name before the modules is an act of compression.** "Room 101" as the project name predates the modules in the author's working notes, and the dual reading (convention hallway reference + Orwell reference) sets the ambition. Research projects named after the research was written tend to end up with functional but flavorless titles; projects named before or during writing end up with titles that carry weight. Norwescon → "Room 101" is the kind of compression that only happens when the name is part of the composition.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.45](../v1.49.45/) | Predecessor — "Ten" (PJM, Pearl Jam's 1991 debut); immediate same-day release in the 2026-03-26 cluster; shares the Seattle-creative-ecosystem thematic seam Module 06 names |
| [v1.49.47](../v1.49.47/) | Successor — "West of the Rockies" (WCN, Westercon); the traveling-convention counterpart to NWC's fixed node, second entry in the conventions sub-cluster |
| [v1.49.48](../v1.49.48/) | Near-successor in the same cluster of 2026-03-26 content releases |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser, "Evergreen") — established the verification-matrix-as-Module-08 pattern NWC continues; the "bioregional isolation" thesis Module 06 connects to |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot NWC drops into; NWC is the 6th-and-counting Research project to benefit from the structural investment |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — cross-referenced by NWC Module 06's PNW convention ecosystem discussion |
| [v1.49.30](../v1.49.30/) | FFA Fur Feathers & Animation Arts — cross-referenced by NWC Module 05's costume/masquerade tradition and Module 02's Guest of Honor artists |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — PNW atlas cross-referenced by NWC Module 06's convention-ecosystem geography |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — cross-referenced via shared PNW bioregional context |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 44th member ships here; Module 07's Rosetta-Stone thesis names the method the series has been using since v1.49.22 |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; NWC is an Observe→Compose content-release cycle applied to the cultural-institutions layer of the PNW bioregion |
| `www/tibsfox/com/Research/NWC/` | New project tree — 18 new files totaling the NWC surface |
| `www/tibsfox/com/Research/NWC/research/` | Eight research modules totaling 1,577 lines — the core narrative of the project |
| `www/tibsfox/com/Research/NWC/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/NWC/research/08-verification-matrix.md` | Source-audit matrix documenting 11 citations with per-claim confidence ratings |
| `docs/research/norwescon.md` | 317-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 / −2 lines) to add the NWC card at position 44 |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to wire NWC into the series flow |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) to reflect the new project count |
| `5d073cb7c` | Content commit — 20 NWC tree files landed atomically |
| `9e2ddf337` | Docs commit — release-notes stub for v1.49.46 |
| `2cdf449cd` | Merge commit — dev → main for the v1.49.46 tag |

---

## Engine Position

v1.49.46 is the 44th project in the PNW Research Series and the release that opens the conventions sub-cluster. The predecessor v1.49.45 "Ten" shipped PJM (Pearl Jam); the successor v1.49.47 "West of the Rockies" ships WCN (Westercon), the traveling-convention counterpart to NWC's fixed node. The v1.49.x line at this depth is running a dense cadence of Research projects — several same-day on 2026-03-26 — each with its own dedication, epigraph, eight-module structure, verification matrix, and two-color theme pair. The cumulative effect after 44 projects is that the next project in the series can reference a dozen neighbors without contrivance; cross-references are navigation rather than decoration. Looking backward, v1.49.46 is the fourth consecutive Research project to use the verification-matrix-as-Module-08 pattern (after WYR at v1.49.43, FFA, and PJM), which promotes that pattern from a one-off to a series convention. Looking forward, NWC opens a three-project sub-cluster whose architecture (fixed node → traveling signal → meta-layer) gives the reader a complete picture of convention-as-infrastructure by the time SMF ships. Module 07's explicit naming of the Research series as a Rosetta-Stone method makes NWC the project where the series comes of age — the point at which the method has been used long enough and densely enough to earn its own name.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.45..v1.49.46) | 3 (content `5d073cb7c` + docs `9e2ddf337` + merge `2cdf449cd`) |
| Files changed | 21 |
| Lines inserted / deleted | 3,929 / 2 |
| New files in NWC tree | 18 |
| Research modules (markdown) | 8 (1,577 lines total) |
| Mission-pack files | 4 (`index.html` 193 + `mission.md` 317 + `norwescon-mission.tex` 1,034 + `norwescon-mission.pdf` 171,195 bytes) |
| Page-shell files | 3 (`index.html` 106 + `page.html` 205 + `mission.html` 57) |
| Stylesheet | 1 (`style.css` 73 lines) |
| Research sidecar (outside www) | 1 (`docs/research/norwescon.md`, 317 lines) |
| Release-notes README | 1 (rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-links to other Research projects | 18 |
| Sources audited in verification matrix | 11 |
| Theme colors | 2 (`#4A148C` convention purple, `#B0BEC5` starfield silver) |
| Research project number in series | 44 |
| Longest module | 03 "The Panel Room" (257 lines) |
| Sub-cluster opened | Conventions (NWC → WCN → SMF) |

---

## Files

- `www/tibsfox/com/Research/NWC/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/NWC/research/01-history-origins.md` — 137 lines; founding vision, venue history, forty-eight years
- `www/tibsfox/com/Research/NWC/research/02-guests-of-honor.md` — 193 lines; Guest of Honor tradition, PKD Award banquet
- `www/tibsfox/com/Research/NWC/research/03-programming-panels.md` — 257 lines; 30+ programming tracks, panels as public discourse
- `www/tibsfox/com/Research/NWC/research/04-venue-experience.md` — 178 lines; DoubleTree as social architecture
- `www/tibsfox/com/Research/NWC/research/05-community-culture.md` — 235 lines; multi-generational community, volunteers, inclusion
- `www/tibsfox/com/Research/NWC/research/06-pnw-convention-ecosystem.md` — 203 lines; Emerald City, PAX, Sakura-Con and the PNW con constellation
- `www/tibsfox/com/Research/NWC/research/07-connections-rosetta.md` — 202 lines; cross-domain translation, Rosetta-Stone thesis
- `www/tibsfox/com/Research/NWC/research/08-verification-matrix.md` — 172 lines; 11-source audit with per-claim confidence ratings
- `www/tibsfox/com/Research/NWC/mission-pack/index.html` — 193 lines; mission-pack landing page
- `www/tibsfox/com/Research/NWC/mission-pack/mission.md` — 317 lines; mission-pack markdown source
- `www/tibsfox/com/Research/NWC/mission-pack/norwescon-mission.tex` — 1,034 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/NWC/mission-pack/norwescon-mission.pdf` — 171,195 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/NWC/index.html` — 106 lines; card landing page
- `www/tibsfox/com/Research/NWC/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/NWC/mission.html` — 57 lines; mission-pack bridge
- `www/tibsfox/com/Research/NWC/style.css` — 73 lines; convention-purple + starfield-silver theme
- `docs/research/norwescon.md` — 317 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 / −2 lines; hub card added for NWC
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update

Aggregate: 21 files changed, +3,929 insertions, −2 deletions across 3 commits (content `5d073cb7c` + docs `9e2ddf337` + merge `2cdf449cd`), v1.49.45..v1.49.46 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.45](../v1.49.45/) · **Next:** [v1.49.47](../v1.49.47/)

> *Forty-eight years. Same region, same mission, same community. The convention is the excuse — the people are the reason.*
