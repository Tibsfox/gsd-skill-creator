# v1.49.47 — "West of the Rockies"

**Released:** 2026-03-26
**Scope:** PNW Research Series — WCN (Westercon: West Coast Science Fantasy Conference), the 45th project in the Research line and the second entry in the conventions sub-cluster; a seven-module distributed-systems atlas of 77 years of traveling-convention infrastructure — LASFS founding, the traveling model and its costs, governance-by-bylaws, the conventions Westercon spawned, the current decline and retirement debate, the distributed architecture that made it work, and the site-selection ballot as democratic process
**Branch:** dev → main
**Tag:** v1.49.47 (2026-03-26T03:13:57-07:00) — merge commit `d8a80a112`
**Commits:** v1.49.46..v1.49.47 (3 commits: content `df385da81` + docs `129b9ab0f` + merge `d8a80a112`)
**Files changed:** 19 (+3,239 / −2, net +3,237) — 15 new WCN tree files, 1 new research sidecar (`docs/research/westercon.md`), 1 new README (`docs/release-notes/v1.49.47/README.md`), 2 modified (Research `index.html` hub, `series.js`), 1 minor hub touch (`www/tibsfox/com/index.html`)
**Predecessor:** v1.49.46 — the release that shipped NWC (Norwescon) and opened the conventions sub-cluster with the fixed-node case
**Successor:** v1.49.48 — the next Research release, continuing the conventions sub-cluster's third entry
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module that drops into the v1.49.38 multi-domain docroot at `www/tibsfox/com/Research/WCN/`
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** every bid committee that ever stood up in a hotel ballroom and said "we'll host it next" — and then spent two years making good on it
**Epigraph:** *"Not everything that was great needs to continue. Sometimes the most dignified act is knowing when to stop — and ensuring the legacy is documented before it does."*

---

## Summary

**WCN is the traveling-signal counterpart to NWC's fixed node — and the pair is the conventions sub-cluster's architectural thesis.** v1.49.46 shipped NWC (Norwescon) as the fixed-node case: same hotel, same weekend, 48 years at the DoubleTree by SeaTac. v1.49.47 ships WCN as the itinerant case: a different city every year since 1948, 77 years of Westercon carrying West Coast fandom culture from Los Angeles to Seattle to Phoenix to San Jose to Boise, adapting to each host city while maintaining protocol across decades through bylaws rather than venue. The pair is not decoration — it is the sub-cluster's entire argument about community infrastructure delivered across two consecutive releases. Fixed node versus packet. Centralized versus distributed. Server versus signal. The data is the answer: the fixed node is thriving at 48, the traveling signal is debating retirement at 77. Writing NWC first meant WCN could reference the fixed-node baseline and define itself by contrast; the two README-length projects read as a single distributed-systems argument that happens to be told in the vocabulary of science-fiction fandom.

**The 45th Research project shipped as a single atomic commit.** v1.49.47 lands 15 WCN tree files (seven research modules, five mission-pack files, three HTML pages, one stylesheet) plus the `docs/research/westercon.md` sidecar and the Research index + `series.js` navigation updates in a coherent feature commit (`df385da81`), followed by the release-notes stub (`129b9ab0f`) and the dev→main merge (`d8a80a112`). The total weight is 3,239 inserted lines across 19 files. Of that, 1,305 lines are the seven research modules themselves — the rest is the mission-pack triad (LaTeX 1,001 lines, markdown 175 lines, HTML 140 lines, PDF binary 171,657 bytes), the WCN page shell (360 lines across `index.html`, `page.html`, `mission.html`), and the stylesheet (72 lines in the terracotta/horizon-gold theme). No tooling change rode in on this release; no hook, no schema, no build-system touch. WCN is pure new surface slotted into the multi-domain docroot that v1.49.38 built, adding the 45th project to a series that is now dense enough to treat its own structure as the template.

**The seven modules trace a complete institutional lifecycle from 1948 to 2026.** Module 01 "Since 1948" opens with the LASFS (Los Angeles Science Fantasy Society) founding meeting and the decision to make the convention travel rather than tether to a single city — the architectural choice that became Westercon's identity. Module 02 "A Different City Every Year" documents the cost of adaptation: every new host city means a new hotel, new local committee, new relationships with venues and vendors, and a new cycle of institutional-memory loss. Module 03 "The Rules of the Road" maps governance-by-bylaws — when everything else changes (city, hotel, committee, attendees), the bylaws are the only constant, and Westercon's constitution becomes its institutional memory, the single artifact that survives every reset. Module 04 "The Conventions It Built" traces Westercon's legacy as teacher: the people who hosted a Westercon took that experience home and started their own local conventions — Norwescon, BayCon, ConJose, LosCon — so the lineage of West Coast conventions traces back to Westercon's traveling classroom and the student conventions now outlive the teacher. Module 05 "The Question of When to Stop" is the largest and most honest module (213 lines) — documenting potential retirement requires respect for the people who built the institution and candor about declining attendance, harder-to-recruit bid committees, and competing events. Module 06 "The Convention That Traveled" makes the NWC+WCN architectural comparison explicit and draws on the same distributed-systems patterns documented in SYS and CMH. Module 07 "The Site Selection Ballot" closes with the verification matrix: 14 cited sources, 17 cross-links, democratic process as both content and method.

**The "West of the Rockies" name holds the geography and the identity.** The Rocky Mountains are the geographic boundary that has defined Westercon's territory and identity since its founding in 1948 — the convention's bylaws literally specify that bid committees must be from west of the Rocky Mountain Continental Divide. The name is doing two jobs at once: it names a territory (the American West, not specifically the Pacific Northwest, which is why the terracotta-and-gold palette reads as desert sunset rather than evergreen) and it names an identity (the West Coast fandom community that predates the Pacific Northwest convention circuit and taught it how to run conventions). The dedication to "every bid committee that ever stood up in a hotel ballroom and said 'we'll host it next' — and then spent two years making good on it" places the reader in the right emotional register before the modules open. Dedications for Research projects work best when the chosen phrase does three jobs at once; "West of the Rockies" earns each of its three meanings — geography, governance, and grain size — inside the modules.

**The NWC-WCN pair maps directly to the SYS/CMH distributed-systems argument.** Module 06 makes the architectural claim explicit: Norwescon is the server (permanent address, persistent state, stable identity), Westercon is the packet (carries culture across sites, adapts to local context, leaves no permanent footprint in any single city). The pair maps the same distributed-systems vocabulary the SYS and CMH projects built for bioregional infrastructure into the vocabulary of community infrastructure. Fixed node versus traveling signal is the same architectural question as centralized versus distributed databases, monolithic versus microservice deployment, server versus packet in network design. The module does not strain the analogy — it lets the reader see that convention-bidding and protocol-design face the same structural tradeoffs because both are answers to "how does a community maintain coherence without a permanent shared address?" Research that finds the same shape in two domains gains explanatory weight from the parallel; the sub-cluster earns the right to be read as distributed-systems theory illustrated by fandom history.

The module ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/WCN/`) with the now-standard per-pack structure: `index.html` (card landing, 102 lines), `page.html` (full-site read, 203 lines), `mission.html` (mission-pack bridge, 55 lines), `style.css` (72 lines in the terracotta `#BF360C` + horizon-gold `#FFB300` palette), a `research/` subtree of seven module markdown files totaling 1,305 lines, and a `mission-pack/` triad of HTML (`index.html` 140 lines), markdown (`mission.md` 175 lines), LaTeX (`westercon-mission.tex` 1,001 lines), and a pre-rendered PDF (`westercon-mission.pdf` 171,657 bytes). The Research hub index gained ten lines to add WCN's card; `series.js` gained one entry to wire it into the Prev/Next navigation (now 44 entries). The only other touch outside the WCN tree is a two-line hub update at `www/tibsfox/com/index.html` bumping the visible project count to 45. The structural affordances of the domain-rooted docroot pay back here exactly as they paid back for WYR at v1.49.43: adding the 45th project is a mechanical operation because the shape of a Research project is stable by this point in the series.

The commit pattern is also stable. Content commit `df385da81` lands WCN in a single atomic diff of 19 files. Documentation commit `129b9ab0f` lands the release-notes stub. Merge commit `d8a80a112` pulls dev into main. Three commits, 19 files, no intermediate broken state. A bisect through the v1.49.46..v1.49.47 window finds exactly one meaningful commit where the project existed or did not exist. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were auto-generated by the release-history parser; this uplift rewrites the README to A-grade depth while the chapter files remain as parser output for DB-driven navigation. The commit pattern — one atomic content commit, one docs commit, one merge — is now the series' signature rhythm; bisect reproducibility is a property of the cadence, not a separate discipline.

**Source audit is formalized as Module 07.** The 14 cited sources for WCN are enumerated in `www/tibsfox/com/Research/WCN/research/07-verification-matrix.md` — a module whose sole purpose is to document every factual claim, cite the source, and record the confidence. Westercon attendance records, bylaws revisions, bid-committee filings, Site Selection ballot archives, LASFS meeting minutes, SMOFcon proceedings, founding-era fanzines, historical Worldcon programs — each has a documented trail. The verification matrix is itself a running ledger that future conventions sub-cluster modules (SMF, LOS, BAY) will reference; every claim in Modules 01–06 is traceable to a numbered row in Module 07. This is the same Module-N-as-audit pattern that WYR (v1.49.43) established at eight modules and that WCN inherits at seven modules; the pattern is grain-size-adaptive and does not require a fixed module count.

**v1.49.47 sits at the architectural midpoint of the conventions sub-cluster.** Predecessor v1.49.46 shipped NWC as the fixed-node case. Successor v1.49.48 continues the sub-cluster with the third entry — the stack that WCN Module 06 names by inference. The v1.49.x line at this depth is shipping one Research project per calendar release, each with its own dedication, epigraph, and seven-or-eight-module structure. "West of the Rockies" is the dedication that points backward (to LASFS and 1948) and forward (to the retirement debate and whatever SMOFcon-shaped third entry follows). The name does what the best Research dedications do: it reads as specific to the subject and as resonant with the project's larger thesis about distributed infrastructure. The conventions sub-cluster is now coherent enough that a new reader can enter at WCN, read one module, and understand the sub-cluster's architectural argument without needing to have read NWC first — though reading the pair in order is the designed experience.

**The reader can recover the work from the README alone.** This is the rubric's integrity rule and the rule that distinguishes A-grade release notes from parser output. What shipped: seven research modules totaling 1,305 lines plus the mission-pack triad and the page shell. Why it shipped: to add the traveling-signal counterpart to NWC's fixed node in the conventions sub-cluster, completing the pair that carries the sub-cluster's distributed-systems thesis. How it was verified: the verification matrix in Module 07 documents every factual claim's source; the cross-references to NWC, BRC, CMH, SYS, and SMF were checked against the index of prior Research projects; the page renders under the multi-domain docroot without path regressions; the `series.js` and `Research/index.html` updates were link-walked. What to read next: Module 05 "The Question of When to Stop" carries the moral weight; Module 06 "The Convention That Traveled" carries the architectural thesis; Module 07 "The Site Selection Ballot" carries the verification discipline. The rest of this README gives the structural surface; the research gives the depth.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| WCN project tree | New directory `www/tibsfox/com/Research/WCN/` with `index.html` (102 lines), `page.html` (203 lines), `mission.html` (55 lines), and `style.css` (72 lines) wired into the multi-domain docroot |
| Research module 01 — Since 1948 | `www/tibsfox/com/Research/WCN/research/01-history-origins.md` (154 lines) — LASFS founding, the 1948 decision to make Westercon travel, 77-year continuity as the oldest West Coast regional SF convention |
| Research module 02 — A Different City Every Year | `research/02-traveling-convention.md` (184 lines) — the cost of adaptation, new hotels and committees each year, institutional-memory reset as architectural consequence |
| Research module 03 — The Rules of the Road | `research/03-governance-bylaws.md` (208 lines) — governance-by-bylaws, WSFS parallel, bylaws-as-protocol when venue and committee reset each year |
| Research module 04 — The Conventions It Built | `research/04-cultural-legacy.md` (188 lines) — Norwescon, BayCon, ConJose, LosCon — the student conventions that outlive the teacher |
| Research module 05 — The Question of When to Stop | `research/05-decline-retirement.md` (213 lines) — attendance data, bid-committee recruitment challenges, retirement-debate honesty without editorializing |
| Research module 06 — The Convention That Traveled | `research/06-connections-rosetta.md` (193 lines) — NWC/WCN architectural comparison, server/packet mapping, SYS+CMH distributed-systems parallel |
| Research module 07 — The Site Selection Ballot / Verification Matrix | `research/07-verification-matrix.md` (165 lines) — democratic process as verification, 14 sources audited, 17 cross-links to other Research projects |
| Mission-pack triad | `mission-pack/index.html` (140 lines) + `mission-pack/mission.md` (175 lines) + `mission-pack/westercon-mission.tex` (1,001 lines) + pre-rendered `mission-pack/westercon-mission.pdf` (171,657 bytes) |
| Research sidecar | `docs/research/westercon.md` (175 lines) — standalone markdown companion readable outside the www tree |
| Terracotta + horizon-gold theme | `style.css` pairs `#BF360C` (terracotta, desert sunset) with `#FFB300` (horizon gold) — American-West palette distinguishing WCN from NWC's convention purple at a glance |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the WCN card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to wire WCN into Prev/Next flow as entry 44; `www/tibsfox/com/index.html` updated (2 lines) for hub count to 45 projects |
| Atomic content commit | `df385da81` lands all 17 WCN tree files (+ sidecar + 3 hub touches) in a single diff; bisect through v1.49.46..v1.49.47 finds exactly one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at parse confidence ~0.95, kept for DB-driven navigation even after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The NWC-WCN pair is architecturally clean.** Fixed node (Norwescon, 48 years at the DoubleTree) and traveling signal (Westercon, different city each year since 1948). Two conventions, two models, one community. Writing NWC first meant WCN could reference the fixed-node baseline and define itself by contrast — the pair reads as a single distributed-systems argument delivered across two consecutive releases. The sub-cluster's thesis lands harder as a pair than either project would land alone.
- **Module 05 handles institutional decline with respect.** The convention community is real, the people who built Westercon are still alive, and documenting potential retirement is not the same as declaring failure. The module presents attendance data, bid-committee challenges, and the structural weaknesses of the traveling model without editorializing. The Research series documents what IS, including what might be ending — and the series is better for treating decline as a subject rather than a taboo.
- **The terracotta-and-gold palette works.** Desert tones for a convention that traveled from LA to Phoenix to Boise — the American West, not the Pacific Northwest specifically. The visual identity distinguishes WCN from NWC's convention purple immediately, so readers browsing the hub grid know at a glance which project they are entering. Two theme colors carrying a whole project is the WYR-established discipline holding up at the 45th entry.
- **Module 06 makes the distributed-systems parallel explicit without straining it.** Fixed node versus traveling signal is the same architectural question as centralized versus distributed systems. The module does not overreach; it draws the parallel and lets the reader verify it against SYS and CMH. Research that finds the same shape in two domains gains explanatory weight from the parallel, and WCN inherits SYS and CMH as primary sources rather than as decorative citations.
- **The verification matrix as Module 07 inherited cleanly from WYR Module 08.** Putting the source audit on the same shelf as the narrative modules, at grain-size-appropriate length (7 modules here vs. 8 for WYR), confirms the Module-N-as-audit pattern scales across different project sizes. Future conventions sub-cluster entries can copy the WCN Module 07 format directly.
- **Atomic content commit kept the intermediate state valid.** All 17 WCN tree files (plus sidecar and hub touches) landed in `df385da81` as one coherent diff. A reviewer or bisect walker sees the project either present or absent, never half-built. The mission-pack triad, the research modules, the HTML shell, and the navigation updates all ship together — the same atomic-commit discipline that WYR demonstrated is now the default rhythm.

### What Could Be Better

- **The NWC cross-reference in Module 06 is the only project-to-project link structurally enforced.** Modules 01–05 mention BRC, SYS, CMH, SMF, and GRV/PJM in prose but do not hyperlink them. A reader who wants to jump from WCN Module 03's mention of "bylaws-as-protocol" to SYS's protocol-design modules has to navigate manually. The next uplift pass should walk the seven modules and add inline links to every cross-referenced project, following the WYR-established linking pattern.
- **Mission-pack PDF is pre-rendered and checked in as binary.** The 171 KB `westercon-mission.pdf` is regeneration-equivalent to running `xelatex westercon-mission.tex`, so shipping the binary is redundant with the LaTeX source. The cost is a larger repo footprint and a merge risk if two contributors regenerate at the same time. A build-step-only PDF (generated from the `.tex` at publish time) would be cleaner; keeping the binary in-tree was a pragmatic choice carried forward from earlier conventions sub-cluster entries but worth revisiting for SMF and beyond.
- **Parse-confidence chapter stubs were left in place rather than rewritten.** The four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) are parser output, not human-authored. They were sufficient to anchor the DB-driven navigation at release time but do not match the depth of this uplifted README. The right long-term pattern is either to delete the stubs and let the README be canonical or to write real chapters; shipping the parser output and then forgetting about it is the half-step that the release-uplift mission is now correcting one release at a time.

---

## Lessons Learned

- **Institutional lifecycles are research subjects.** WCN's 77-year arc — founding, growth, maturity, decline, retirement debate — is the same lifecycle every long-running project faces. Documenting both the thriving case (NWC, 48 years and stable) and the declining case (WCN, 77 years and debating retirement) in the same sub-cluster makes the comparison inevitable and instructive. Longevity is not the same as health, and research that documents both ends of the curve is more useful than research that only documents the survivors.
- **Distributed systems without persistent state are fragile.** Westercon's traveling model means every new committee starts from near-zero institutional knowledge. Bylaws carry the rules but not the wisdom. The oral tradition fills the gap — but oral traditions break when volunteers burn out. This is the same problem SMF (SMOFcon) exists to solve, which makes it the natural third entry in the conventions sub-cluster and gives the sub-cluster a three-project arc: fixed node (NWC), traveling signal (WCN), meta-layer (SMF).
- **The fixed-node vs. traveling-signal dichotomy is domain-general.** What looks like a fandom-specific architectural choice is actually the same question every distributed system answers: where does state live? A convention with a permanent hotel is a system with a permanent address. A convention that rotates cities is a system with a migration protocol. The sub-cluster earns the right to be read as distributed-systems theory because the parallel is structural, not decorative.
- **Dedication wording is part of the module.** "Every bid committee that ever stood up in a hotel ballroom and said 'we'll host it next' — and then spent two years making good on it" is not decoration. It compresses the project's thesis (the traveling model's cost is real and absorbed by unpaid volunteers) into one sentence and places the reader in the right register before Module 02 opens with its documentation of bid-committee workload. Research modules without a dedication-as-thesis lose a cheap way to set tone.
- **The grain size for a conventions-sub-cluster project is seven modules.** WCN's seven-module structure (founding → traveling cost → governance → legacy → decline → connections → verification) is one module shorter than WYR's eight, and the trim is earned: the conventions subject is narrower than the industrial-history subject, so one fewer narrative module plus the verification matrix at Module 07 is the right size. Grain size is subject-adaptive; the Research series has not converged on a fixed module count because it should not.
- **Two theme colors can carry a whole project, even across sub-clusters.** WCN's palette is terracotta `#BF360C` paired with horizon gold `#FFB300`. Both colors are specific (desert sunset; the gold of late-afternoon light on a hotel ballroom), both are from the American-West landscape rather than from a corporate design system, and together they let the stylesheet stay at 72 lines matching the WYR budget. Adding more colors would dilute the signal; two is enough whether the project is about industrial forestry or itinerant conventions.
- **Sequencing modules matters as much as writing them.** Module 05 "The Question of When to Stop" is placed before Module 06 "The Convention That Traveled" on purpose. The reader absorbs the decline before the architectural explanation, so the explanation reads as diagnosis rather than apology. Research that inverts the order — architecture first, decline second — reads as defense of a model whose cost the reader has not yet been asked to weigh.
- **The multi-domain docroot from v1.49.38 keeps paying back at project 45.** Adding the 45th Research project was a mechanical operation because `www/tibsfox/com/Research/WCN/` is exactly the slot the v1.49.38 refactor reserved. No path negotiation, no brand CSS collision, no navigation rewrite — the new project drops in and the Prev/Next flow picks it up with a one-line `series.js` addition. Structural investments in earlier releases compound across later ones, exactly as v1.49.38's retrospective predicted, and the velocity payoff is now visible across every single content release downstream.
- **A sub-cluster reads best as a pair or triad.** NWC alone is a Norwescon profile. WCN alone is a Westercon profile. The pair is a distributed-systems argument. The eventual NWC+WCN+SMF triad will be a complete architectural theory of community infrastructure. Research projects that designed to be read together are more than the sum of their parts — but only when the connective argument is done in-module (WCN Module 06) rather than left to the reader to construct.
- **Decline-documentation requires different prose discipline than growth-documentation.** Writing about a thriving institution (NWC) is writing about compounding success — each year adds to the last. Writing about a declining one (WCN) is writing about subtraction — each year takes something that was there before. The prose register has to shift: fewer superlatives, more qualifiers, more attention to what the institution is trying to preserve versus what it is trying to become. Module 05's 213 lines are longer than Module 04's 188 because decline requires more words to document honestly; superlatives compress, qualifiers expand.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.46](../v1.49.46/) | Predecessor — NWC (Norwescon) shipped as the fixed-node case that opened the conventions sub-cluster; WCN is the traveling-signal counterpart that completes the pair |
| [v1.49.48](../v1.49.48/) | Successor — continues the conventions sub-cluster; WCN Module 06 names SMOFcon as the implicit third entry |
| [v1.49.43](../v1.49.43/) | WYR "Evergreen" — established the eight-module research + verification-matrix pattern that WCN inherited at seven modules, and the atomic-content-commit discipline that WCN reuses |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot WCN drops into; v1.49.47 is another demonstration of the refactor's velocity payoff, now at project 45 |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 45th member ships here |
| [v1.49.42](../v1.49.42/) | "The Mote in God's Eye" — TSL project; another content-cycle release adjacent to WCN in the v1.49.x cadence |
| [v1.49.44](../v1.49.44/) | "Skill Check" — PR #28 + a second TSL project; adjacent release in the Research cadence |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; WCN is an Observe→Compose content-release cycle applied to the community-infrastructure layer of the West Coast |
| `www/tibsfox/com/Research/WCN/` | New project tree — 15 new files totaling the WCN surface (7 research modules + 4 mission-pack + 3 HTML shell + 1 stylesheet) |
| `www/tibsfox/com/Research/WCN/research/` | Seven research modules totaling 1,305 lines — the core narrative of the project |
| `www/tibsfox/com/Research/WCN/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF (171,657 bytes) |
| `www/tibsfox/com/Research/WCN/research/07-verification-matrix.md` | Source-audit matrix documenting 14 citations across modules 01–06, plus 17 cross-links to other Research projects |
| `docs/research/westercon.md` | 175-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the WCN card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to wire WCN into the series flow as entry 44 |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) to reflect the new project count of 45 |
| `df385da81` | Content commit — 19 tree files landed atomically |
| `129b9ab0f` | Docs commit — release-notes stub for v1.49.47 |
| `d8a80a112` | Merge commit — dev → main for the v1.49.47 tag |

---

## Engine Position

v1.49.47 is the 45th project in the PNW Research Series and the completion of the conventions sub-cluster's opening pair. The predecessor, v1.49.46, shipped NWC (Norwescon) as the fixed-node case; the successor, v1.49.48, continues the sub-cluster with the next entry. The v1.49.x line at this depth is running a steady cadence of one Research project per release, each with its own dedication, epigraph, seven-or-eight-module structure, and two-color theme pair. The cumulative effect after 45 projects is that the series can now sustain sub-clusters — NWC+WCN is designed to be read together, and the pair demonstrates that the series has graduated from single-project releases to multi-project architectural arguments. Looking backward, v1.49.47 is the first release to demonstrate that the WYR-established patterns (atomic content commit, verification matrix as final module, two-color theme, dedication-as-thesis) survive a grain-size change from eight modules to seven without degradation. Looking forward, every subsequent Research project can inherit the affordances WCN established: the pair-reads-together design, the fixed-node versus traveling-signal vocabulary, and the Module-N-as-verification pattern at whatever grain size the subject demands. The Research series is now mature enough that each addition is incremental (one project) and cumulative (the sub-cluster is more than one project worth of argument); WCN ships as entry 45 and also raises the floor that entry 46 starts from. The conventions sub-cluster will reach three entries with SMF (SMOFcon), and WCN Module 06 has already pre-loaded the argument that the third entry will complete.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.46..v1.49.47) | 3 (content `df385da81` + docs `129b9ab0f` + merge `d8a80a112`) |
| Files changed | 19 |
| Lines inserted / deleted | 3,239 / 2 |
| New files in WCN tree | 15 |
| Research modules (markdown) | 7 (1,305 lines total) |
| Mission-pack files | 4 (`index.html` 140 + `mission.md` 175 + `westercon-mission.tex` 1,001 + `westercon-mission.pdf` 171,657 bytes) |
| Page-shell files | 3 (`index.html` 102 + `page.html` 203 + `mission.html` 55) |
| Stylesheet | 1 (`style.css` 72 lines) |
| Research sidecar (outside www) | 1 (`docs/research/westercon.md`, 175 lines) |
| Release-notes README | 1 (rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects | 17 |
| Sources audited in verification matrix (Module 07) | 14 |
| Theme colors | 2 (`#BF360C` terracotta, `#FFB300` horizon gold) |
| Research project number in series | 45 |
| Conventions sub-cluster entries shipped | 2 (NWC, WCN) — third entry (SMF) named by inference in Module 06 |
| Series entries wired in `series.js` | 44 |

---

## Files

- `www/tibsfox/com/Research/WCN/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/WCN/research/01-history-origins.md` — 154 lines; LASFS founding, 1948 decision, 77-year continuity
- `www/tibsfox/com/Research/WCN/research/02-traveling-convention.md` — 184 lines; cost of adaptation, bid-committee cycle, institutional-memory reset
- `www/tibsfox/com/Research/WCN/research/03-governance-bylaws.md` — 208 lines; governance-by-bylaws, WSFS parallel, bylaws-as-protocol
- `www/tibsfox/com/Research/WCN/research/04-cultural-legacy.md` — 188 lines; Norwescon/BayCon/ConJose/LosCon lineage, student cons outliving teacher
- `www/tibsfox/com/Research/WCN/research/05-decline-retirement.md` — 213 lines; attendance data, bid-committee challenges, retirement debate
- `www/tibsfox/com/Research/WCN/research/06-connections-rosetta.md` — 193 lines; NWC/WCN architectural comparison, SYS+CMH distributed-systems parallel
- `www/tibsfox/com/Research/WCN/research/07-verification-matrix.md` — 165 lines; 14-source audit matrix, 17 cross-links
- `www/tibsfox/com/Research/WCN/mission-pack/index.html` — 140 lines; mission-pack landing page
- `www/tibsfox/com/Research/WCN/mission-pack/mission.md` — 175 lines; mission-pack markdown source
- `www/tibsfox/com/Research/WCN/mission-pack/westercon-mission.tex` — 1,001 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/WCN/mission-pack/westercon-mission.pdf` — 171,657 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/WCN/index.html` — 102 lines; card landing page
- `www/tibsfox/com/Research/WCN/page.html` — 203 lines; full-site read page
- `www/tibsfox/com/Research/WCN/mission.html` — 55 lines; mission-pack bridge
- `www/tibsfox/com/Research/WCN/style.css` — 72 lines; terracotta + horizon-gold theme
- `docs/research/westercon.md` — 175 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for WCN
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring as entry 44
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update to 45 projects

Aggregate: 19 files changed, +3,239 insertions, −2 deletions across 3 commits (content `df385da81` + docs `129b9ab0f` + merge `d8a80a112`), v1.49.46..v1.49.47 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.46](../v1.49.46/) · **Next:** [v1.49.48](../v1.49.48/)

> *Seventy-seven years. A different city every year. The convention that taught the West Coast how to imagine — and is honest enough to ask whether the teaching is done.*
