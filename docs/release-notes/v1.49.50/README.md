# v1.49.50 — "Double Entry"

**Released:** 2026-03-26
**Scope:** PNW Research Series — BLA (Business Law & Accounting), the 48th Research project and the capstone of the Business cluster; an eight-module legal-and-financial atlas tracing 530 years of commercial infrastructure from Luca Pacioli's 1494 codification of double-entry bookkeeping through modern entity formation, cooperative accounting, tribal sovereign commerce, federal regulatory compliance, equity cap-table architecture, and international expansion
**Branch:** dev → main
**Tag:** v1.49.50 (2026-03-26T04:17:55-07:00) — merge commit `4a0cc792`
**Commits:** v1.49.49..v1.49.50 (3 commits: content `ce0e65fbd` + docs `025e636ed` + merge `4a0cc792c`)
**Files changed:** 21 (+4,309 / −2, net +4,307) — 18 new BLA tree files, 1 new research sidecar (`docs/research/business-law-accounting.md`), 1 new release-notes README, 2 modified hub/nav files (`Research/index.html`, `series.js`, top-hub `www/tibsfox/com/index.html`)
**Predecessor:** v1.49.49 — "Shields Up" (SAN, SANS Institute — the cybersecurity training capstone)
**Successor:** v1.49.51 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** Luca Pacioli (1447-1517) — Franciscan friar, mathematician, and the man who wrote down what Venetian merchants already knew, so the rest of the world could learn it
**Engine Position:** Research project 48 of the PNW line · Business cluster capstone · 446 cumulative research modules · ~201,000 cumulative research lines
**Epigraph:** *"Every transaction has two sides. Every debit has a credit. The books balance or they don't — there is no ambiguity in arithmetic."*

---

## Summary

**The Business cluster needed a foundation layer, and BLA is it.** ACC (Washington accounting law), WSB (Washington small-business startup), and BCM (building/contractor compliance) were all Washington-State-specific and narrow by design — each specialized a slice of the commercial stack for a specific jurisdiction or trade. The cluster read sideways rather than downward: three peers with no shared base, three sibling projects with no parent. BLA resolves the shape by providing the universal principles the sibling projects specialize. The cluster now reads correctly as a dependency DAG: BLA establishes entity law, accounting fundamentals, and regulatory frameworks; ACC applies Washington accounting regulation; WSB applies Washington startup practice; BCM applies contractor/building compliance atop the BLA regulatory stack. Foundation first, specialization second. The 48th Research project is also the first in the series that was written specifically to change the shape of an existing cluster rather than to add a new neighborhood.

**Double-entry bookkeeping is a five-hundred-thirty-year-old infrastructure that still compiles.** Luca Pacioli did not invent double-entry. Venetian merchants had been running it for centuries before he published *Summa de Arithmetica* in 1494. Pacioli's contribution was documentation — he wrote down what practitioners already knew, so the next generation of merchants in Antwerp, Amsterdam, London, and eventually every commercial center on Earth could learn the system without an apprenticeship. The Research series is doing the same work at a different scale, and Module 02 "Pacioli's Gift" makes the parallel explicit: documentation as gift, knowledge transfer as the oldest problem in commerce. The fact that every accounting system on the planet — from personal Quicken files to Fortune-500 ERPs to Bitcoin ledgers to tribal enterprise books — still uses debit-credit-balance as the primitive tells you the system is not a convention. It is a discovery. There are exactly two sides to every transaction, and the books balance or they don't.

**Tribal sovereign commerce is a parallel legal system, not a footnote.** Module 04 "Sovereign Commerce" is 247 lines documenting a legal framework that is fundamentally different from state or federal law — not "special rules for Native businesses" but a parallel sovereign jurisdiction with its own authority, its own courts, its own regulatory bodies, and its own commercial law. Treating tribal enterprise as a subset of state law, the way most business-law references do, misrepresents the architecture. The Research series is stronger for documenting parallel systems as parallel rather than flattening them into a hierarchy with federal law at the apex. The module cross-references TIBS (Animal Speak & Sacred Landscapes) and SAL (Salish cosmology) to ground the legal framework in the cultural and cosmological context that gives sovereignty its meaning, and it lays groundwork for future Research projects on tribal infrastructure, tribal energy, and tribal data governance.

**The cap table is the constitution of a company, and Module 06 earns its 302 lines.** Equity is the most consequential and least understood aspect of business formation. Dilution, vesting cliffs, liquidation preferences, convertible notes, SAFEs, anti-dilution ratchets, preemptive rights, drag-along clauses, tag-along clauses — every startup founder learns these the hard way, usually in the middle of a funding round when there is no time to learn properly. Module 06 "The Cap Table" is the longest module in BLA because the subject is the densest. The length matches the complexity rather than padding to a target. A founder who reads Module 06 before their first term sheet arrives will make better decisions than a founder who waits to learn on the job. The module stays at the principles layer — it does not give legal advice, it explains the mechanisms so the reader can recognize what their lawyer is saying — which is exactly what a Research-series project should do.

**Six domains in eight modules is a scoping discipline, not a limitation.** Entity formation, accounting, cooperatives, tribal sovereignty, compliance, equity, and international expansion — any one of these could be its own Research project. BLA covers all six by staying rigorously at the principles level and letting the cluster's specialized projects handle the jurisdictional specifics. The cluster architecture makes this possible: depth through specialization (ACC, WSB, BCM), breadth through the foundation layer (BLA). The discipline is deliberate. Future Research clusters that want to operate at the same depth — AVI+MAM for wildlife, SYS+SAN for infrastructure, NWC+WCN+SMF for conventions — can borrow the pattern: pick a foundation-layer project first, pick specialization projects that sit atop it, and resist the temptation to let any single project cover everything. Scope discipline at authoring time is what keeps a 48-project series readable after its 48th entry.

BLA ships inside the multi-domain docroot that v1.49.38 built (`www/tibsfox/com/Research/BLA/`) with the now-standard per-project structure: `index.html` (107 lines — card landing page), `page.html` (205 lines — full-site read page), `mission.html` (58 lines — mission-pack bridge), `style.css` (73 lines — slate `#37474F` paired with currency green `#2E7D32`), a `research/` subtree of eight module markdown files totaling 1,946 lines, and a `mission-pack/` triad of HTML (175 lines), markdown (354 lines), LaTeX (991 lines), and a pre-rendered PDF (181,738 bytes). The research sidecar `docs/research/business-law-accounting.md` (354 lines) gives the project a portable companion readable outside the www tree. The Research hub index gained ten lines to add the BLA card; `series.js` gained one entry to extend the Prev/Next flow; the top-level hub gained a two-line count bump to 48 projects. The structural affordances of the domain-rooted docroot continue to pay dividends — adding the 48th project is a mechanical operation because the shape of a Research project is stable at this point in the series.

The commit pattern is equally stable. Content commit `ce0e65fbd` lands BLA in a single atomic diff (20 files on the content side, +4,274 / −2). Documentation commit `025e636ed` lands the release-notes stub (1 file). Merge commit `4a0cc792c` pulls dev into main and ships the tag. Three commits, 21 files, no intermediate broken state. A bisect through the v1.49.49..v1.49.50 window finds exactly one meaningful commit where the BLA project existed or did not exist. The release-notes README and the four chapter files (`00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md`) were originally auto-generated by the release-history parser at confidence 0.95; this uplift rewrites the README to A-grade depth while the chapter files remain as parser output for DB-driven navigation and retrospective tracking.

Module 01 "Choose Your Structure" maps entity formation across sole proprietorship, LLC, S-Corp, C-Corp, professional corporation, cooperative, and tribal enterprise, treating the entity choice as the first legal decision a business makes and the one that constrains every decision after. Module 02 "Pacioli's Gift" traces double-entry bookkeeping from 1494 Venice to modern GAAP and IFRS, framing the 530-year persistence as evidence that the system is a discovery rather than a convention. Module 03 "Member-Owned" documents cooperative accounting at 228 lines, covering REI, credit unions, rural electric co-ops, and member-owned agricultural cooperatives as a distinct financial and governance model whose success metrics are not shareholder returns. Module 04 "Sovereign Commerce" treats tribal law as a parallel legal system with its own jurisdiction. Module 05 "The Compliance Stack" at 252 lines maps the regulatory infrastructure from local permits through federal securities law and treats compliance as infrastructure rather than burden — the rules that make markets trustworthy enough to function. Module 06 "The Cap Table" at 302 lines is the longest module and covers equity architecture in depth. Module 07 "Beyond Borders" at 278 lines traces international expansion through transfer pricing, treaty networks, permanent establishment rules, FCPA compliance, VAT, and currency risk. Module 08 "The Audit Trail" closes with the verification matrix documenting 46 sources and 16 cross-links.

The "slate + currency green" theme pair (`#37474F` for slate, `#2E7D32` for green) reads as a ledger's cover and a banknote's ink. It is deliberately not the warm palettes of the cultural-history projects (NWC, WCN, SMF) because BLA is not that kind of project. The color choice signals the subject: this is the room where the books are balanced, not the room where the show happens. Research-project palettes at this depth of the series carry editorial weight — two colors are enough when the colors are specific enough to read at thumbnail size without caption.

The reader can recover the work from this README alone. What shipped: eight research modules totaling 1,946 lines plus the mission-pack triad (HTML + markdown + LaTeX + PDF), the page shell, and the research sidecar. Why it shipped: to complete the Business cluster by providing a foundation layer that ACC, WSB, and BCM specialize. How it was verified: the verification matrix in Module 08 documents every factual claim against 46 sources with 16 cross-links to prior Research projects. What to read next: Module 02 for the documentation-as-gift parallel with the Research series itself, Module 04 for the parallel-sovereignty framing that unlocks future tribal-law Research work, and Module 06 for the cap-table architecture every founder needs before their first term sheet.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| BLA project tree | New directory `www/tibsfox/com/Research/BLA/` with `index.html` (107 lines), `page.html` (205 lines), `mission.html` (58 lines), and `style.css` (73 lines) wired into the multi-domain docroot |
| Research module 01 — Choose Your Structure | `www/tibsfox/com/Research/BLA/research/01-entity-formation.md` (239 lines) — sole proprietorship, LLC, S-Corp, C-Corp, cooperative, tribal enterprise; the first legal decision a business makes |
| Research module 02 — Pacioli's Gift | `research/02-double-entry.md` (257 lines) — 1494 Venice through modern GAAP; documentation as gift; the 530-year persistence argument |
| Research module 03 — Member-Owned | `research/03-cooperative-accounting.md` (228 lines) — REI, credit unions, rural electric co-ops; member-owned financial architecture |
| Research module 04 — Sovereign Commerce | `research/04-tribal-sovereignty.md` (247 lines) — tribal law as parallel legal system, not a subset; sovereign jurisdiction, sovereign courts, sovereign commerce |
| Research module 05 — The Compliance Stack | `research/05-federal-compliance.md` (252 lines) — local permits through federal securities law; compliance as infrastructure that makes markets possible |
| Research module 06 — The Cap Table | `research/06-equity-securities.md` (302 lines) — equity architecture, dilution, vesting, convertible instruments; the longest module because the subject is the densest |
| Research module 07 — Beyond Borders | `research/07-international-expansion.md` (278 lines) — transfer pricing, treaties, permanent establishment, FCPA, VAT, currency risk |
| Research module 08 — The Audit Trail | `research/08-verification-matrix.md` (143 lines) — 46-source audit with 16 cross-links to other Research projects |
| Mission-pack triad | `mission-pack/index.html` (175 lines) + `mission-pack/mission.md` (354 lines) + `mission-pack/business-law-accounting-mission.tex` (991 lines) + pre-rendered `mission-pack/business-law-accounting-mission.pdf` (181,738 bytes) |
| Research sidecar | `docs/research/business-law-accounting.md` (354 lines) — standalone markdown companion readable outside the www tree |
| Slate + currency green theme | `style.css` pairs `#37474F` (slate, ledger cover) with `#2E7D32` (currency green, banknote ink) — 73 lines total, editorial two-color pairing |
| Research hub integration | `www/tibsfox/com/Research/index.html` updated (+10 lines) to add the BLA card to the grove-level index |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to extend the Prev/Next flow to 48 entries; `www/tibsfox/com/index.html` updated (2 lines) for the 48-project hub count |
| Atomic content commit | `ce0e65fbd` lands all BLA tree files, the sidecar, and the navigation updates in a single diff; bisect through v1.49.49..v1.49.50 finds one meaningful state transition |
| Release-notes chapter artifacts | `00-summary.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The Business cluster finally has a foundation layer.** ACC, WSB, and BCM were all Washington-specific and all narrow by design. They read sideways — three peers with no shared base. BLA provides the universal principles the specialized projects specialize atop, turning the cluster into a dependency DAG with a clear foundation. BLA establishes entity law, accounting fundamentals, and regulatory frameworks at the principles layer; ACC applies Washington accounting regulation; WSB applies Washington startup practice; BCM applies contractor/building compliance atop the BLA regulatory stack. The refactored cluster reads correctly from the reader's first entry-point in a way it did not before.
- **Tribal sovereignty as a parallel legal system, not a footnote.** Module 04 at 247 lines documents a legal framework that is fundamentally different from state or federal law — not a "special rules" subsection tucked at the back of a compliance module, but a first-class parallel jurisdiction treated as coequal with state and federal systems. The Research series is stronger for documenting parallel systems rather than flattening them into a single hierarchy. The module cross-references TIBS and SAL so the legal framework lands in the cultural and cosmological context that gives sovereignty its meaning, and it lays foundation for future tribal-infrastructure, tribal-energy, and tribal-data-governance Research projects.
- **Module 06 at 302 lines earned its length.** The cap-table module is the longest because equity is the most consequential and least understood aspect of business formation. Dilution, vesting cliffs, liquidation preferences, convertible notes, SAFEs, anti-dilution ratchets — every founder learns these the hard way. The length matches the subject's complexity rather than padding to a target; a reader who finishes Module 06 before their first term sheet arrives will make better decisions than a reader who waits to learn on the job.

### What Could Be Better

- **Module 08 at 143 lines is the shortest verification matrix in recent Research history.** The 46-source audit is comprehensive in content but tight in presentation — 143 lines is below WYR Module 08 (193 lines) and SMF Module 07 (153 lines). Future Business-cluster follow-ons should standardize verification-matrix line counts at the 180–220 range so readers can compare source depth at a glance across the series.
- **Cross-link density (16) is on the low side for a capstone project.** SMF shipped 17 cross-links, WYR shipped 24. BLA's 16 cross-links to the TIBS/SAL (tribal sovereignty), WYR (corporate timberland), SAN (compliance frameworks), ACC/WSB/BCM (cluster specialization), and Research-series-origin projects are all genuine, but the capstone role invites higher density. A follow-on pass or a Phase-2 supplementary module could push cross-references into the 20+ range.
- **International expansion in one 278-line module compresses a subject that deserves a project.** Module 07 covers transfer pricing, treaty networks, permanent establishment, FCPA, VAT, and currency risk — any one of which could be its own Research project. The module lands the principles correctly but signals a future project in international-tax-law-and-commerce that could sit atop BLA as the second generation of specialization.

---

## Lessons Learned

- **530-year-old innovations are still load-bearing infrastructure.** Pacioli published *Summa de Arithmetica* in 1494. Every accounting system on Earth still uses double-entry — from personal Quicken files to Fortune-500 ERPs to Bitcoin ledgers to tribal enterprise books. The longevity proves the system is not a convention that could have been chosen differently; it is a discovery. There are exactly two sides to every transaction, and the books balance or they don't. Infrastructure that lasts five centuries has earned the right to be called fundamental, and Research-series projects that document fundamental infrastructure should say so directly rather than hedging with "perhaps" or "arguably".
- **Foundation-layer projects change cluster shape retroactively.** BLA is the 48th Research project but it changes how the first three Business-cluster entries (ACC, WSB, BCM) read. Before BLA, the cluster read as three peers with no shared base. After BLA, the cluster reads as a dependency DAG with BLA at the foundation and the three specialization projects atop. Future Research clusters should consider whether they need a foundation-layer project and, if so, should ship it explicitly rather than letting the cluster operate as a flat peer group. Foundation-first is not the only cluster-building order, but it is a legible one.
- **Documentation as gift is the Research-series principle in a 530-year-old frame.** Pacioli did not invent double-entry. Venetian merchants ran it for centuries before he wrote it down. His contribution was writing it down — making the apprentice-level knowledge of Venetian counting-houses legible to anyone with access to a printed book. The Research series is doing the same work at a different scale: externalize what practitioners know so the next generation does not have to serve an apprenticeship to learn it. Module 02 makes the parallel explicit, and future Research projects covering oral-tradition or apprenticeship-transmitted fields should borrow the framing.
- **Parallel legal systems require parallel documentation.** Tribal sovereignty is not a subset of federal law, and documenting it as a subset misrepresents the architecture. Module 04 treats tribal law as coequal with state and federal systems. Any Research project covering a domain with genuinely parallel jurisdictional structures — international law, maritime law, ecclesiastical law, ethnic-minority legal systems in federated states — should use the same structural approach: parallel treatment, cross-references to cultural context, and explicit rejection of the flatten-to-hierarchy shortcut.
- **The cap table is the constitution of a company.** Equity architecture determines voting, governance, liquidity, and control. Dilution is not a footnote; it is the primary mechanism by which founders lose companies they built. Module 06 treats the cap table as constitutional because it is — it determines who decides, in what proportion, under what conditions, with what rights. Any Research project touching organizational governance (open-source foundations, cooperatives, tribal enterprises, DAOs) can borrow the Module 06 framing even when the shares-and-preferences vocabulary does not apply, because the constitutional question — who decides what, in what proportion, under what conditions — is always the question.
- **Cluster architecture makes six-domain scope tractable.** BLA covers entity law, accounting, cooperatives, tribal sovereignty, compliance, equity, and international expansion — seven domains in eight modules. The breadth is possible only because BLA stays rigorously at the principles layer and lets ACC, WSB, and BCM handle the jurisdictional specifics. A single-project attempt at the same breadth without the cluster architecture would either bloat into a textbook or flatten into a summary. The cluster layering is the architectural discipline that lets a Research project be simultaneously broad and deep.
- **Compliance is infrastructure, not burden.** Module 05 reframes regulatory compliance from "paperwork that slows business down" to "the rules that make markets trustworthy enough to function". Both framings are technically consistent with the same facts, but the infrastructure framing is more honest about why compliance systems exist and why they persist through waves of deregulatory politics. A market with no compliance has no trust; a market with no trust has no scale. Research projects touching regulation (environmental, financial, labor, data) can borrow the reframing.
- **Two-color theme pairs earn their editorial weight when chosen deliberately.** Slate `#37474F` and currency green `#2E7D32` read as a ledger cover and banknote ink without needing caption text. The pairing signals the subject at thumbnail size and will not be confused with the NWC teal, the WCN gold, or the SMF amber. Research-project palettes at 48 projects in carry editorial weight — two colors are enough when the colors are specific enough. Adding a third color in the hope of "richness" dilutes signal and weakens the thumbnail-recognition property that makes the series browsable.
- **Atomic content commits preserve bisect integrity.** Landing all BLA tree files, the sidecar, and the navigation updates in one diff (`ce0e65fbd`) keeps the intermediate state valid. A reviewer or bisect walker sees the project either present or absent, never half-built. The pattern is cheap to maintain (one `git add` of the whole tree, one commit message) and expensive to restore if broken (unpicking mixed-state commits costs hours). Every Research release so far has honored the discipline; the discipline should continue for the full series lifetime.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.49](../v1.49.49/) | Predecessor — "Shields Up"; SAN (SANS Institute), the cybersecurity training capstone that shares BLA's capstone-role rhythm in its own cluster (SYS + SAN) |
| [v1.49.48](../v1.49.48/) | "Secret Masters of Fandom"; SMF (SMOFcon), the conventions-cluster capstone — another trilogy-closer that BLA's cluster-capstone pattern rhymes with |
| [v1.49.47](../v1.49.47/) | "West of the Rockies"; WCN (Westercon) — the packet layer of the conventions stack; BLA borrows the cluster-as-distributed-system framing first articulated for the NWC/WCN/SMF trilogy |
| [v1.49.46](../v1.49.46/) | NWC (Norwescon) — the server layer of the conventions stack; shares the cluster-architecture discipline BLA extends into the Business neighborhood |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — the 41st Research project, demonstrates the verification-matrix pattern BLA Module 08 adapts for commercial-law sources; WYR also cross-referenced by BLA for corporate timberland structure |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — the release that built the `www/tibsfox/com/Research/` slot BLA drops into; v1.49.50 is the 10th consecutive Research project to demonstrate the refactor's velocity payoff |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — cultural-and-sovereignty context for BLA Module 04's parallel-legal-system framing |
| [v1.49.33](../v1.49.33/) | SYS (Systems Administration) — paired with SAN as the infrastructure-cluster foundation; echoes BLA's foundation-layer role in the Business cluster |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the release that began the series whose 48th member ships here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; BLA is an Observe→Compose cycle applied to the commercial-law layer of the PNW bioregion and its broader jurisdictional neighbors |
| `www/tibsfox/com/Research/BLA/` | New project tree — 18 new files totaling the BLA surface |
| `www/tibsfox/com/Research/BLA/research/` | Eight research modules totaling 1,946 lines — the core narrative of the project |
| `www/tibsfox/com/Research/BLA/mission-pack/` | Mission-pack triad — HTML + markdown + LaTeX + pre-rendered PDF |
| `www/tibsfox/com/Research/BLA/research/08-verification-matrix.md` | Source-audit matrix documenting 46 citations and 16 cross-links |
| `docs/research/business-law-accounting.md` | 354-line markdown sidecar readable outside the www tree — the project's portable companion |
| `www/tibsfox/com/Research/index.html` | Research hub updated (+10 lines) to add the BLA card |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) to 48 entries |
| `www/tibsfox/com/index.html` | Top-level hub updated (2 lines) for the 48-project count |
| `ce0e65fbd` | Content commit — BLA tree + sidecar + nav files landed atomically |
| `025e636ed` | Docs commit — release-notes stub for v1.49.50 |
| `4a0cc792c` | Merge commit — dev → main for the v1.49.50 tag |

---

## Engine Position

v1.49.50 is the 48th project in the PNW Research Series and the capstone of the Business cluster. The predecessor v1.49.49 "Shields Up" shipped SAN (SANS Institute) as the cybersecurity capstone of the infrastructure cluster; the predecessor-predecessor v1.49.48 "Secret Masters of Fandom" closed the three-convention sub-cluster (NWC + WCN + SMF). The v1.49.x line at this depth continues its cadence of one Research project per calendar release, each with its own dedication, epigraph, seven-to-eight-module structure, and two-color theme pair. Looking backward, v1.49.50 is the 10th consecutive Research project to demonstrably benefit from the structural investment made in v1.49.38 (the multi-domain docroot refactor) and the first to explicitly change the shape of an existing cluster rather than add a new neighborhood. Looking forward, every subsequent Research project inherits three new affordances BLA established: the foundation-layer cluster pattern for neighborhoods that benefit from a universal-principles entry, the parallel-legal-system framing that opens tribal-law and international-law follow-ons, and the cap-table-as-constitution framing that lets any governance-touching project borrow constitutional-document vocabulary. The Research series is now dense enough and structurally mature enough that each addition compounds: BLA ships as one project, closes a cluster, and raises the floor that project 49 starts from. Cumulative series state after BLA: 48 projects, 446 research modules, ~201,000 research lines, 7 clusters, 1 newly-foundationed cluster (Business).

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.49..v1.49.50) | 3 (content `ce0e65fbd` + docs `025e636ed` + merge `4a0cc792c`) |
| Files changed | 21 |
| Lines inserted / deleted | 4,309 / 2 |
| New files in BLA tree | 18 |
| Research modules (markdown) | 8 (1,946 lines total) |
| Mission-pack files | 4 (`index.html` 175 + `mission.md` 354 + `business-law-accounting-mission.tex` 991 + `business-law-accounting-mission.pdf` 181,738 bytes) |
| Page-shell files | 3 (`index.html` 107 + `page.html` 205 + `mission.html` 58) |
| Stylesheet | 1 (`style.css` 73 lines) |
| Research sidecar (outside www) | 1 (`docs/research/business-law-accounting.md`, 354 lines) |
| Release-notes README | 1 (rewritten by this uplift) |
| Navigation files touched | 3 (`Research/index.html`, `series.js`, hub `index.html`) |
| Cross-references to other Research projects | 16 |
| Sources audited in verification matrix | 46 |
| Theme colors | 2 (`#37474F` slate, `#2E7D32` currency green) |
| Research project number in series | 48 |
| Business cluster position | 4 of 4 (ACC + WSB + BCM + BLA, BLA as foundation) |
| Cumulative Research series weight | 48 projects, 446 modules, ~201,000 lines |

---

## Taxonomic State

After v1.49.50 the PNW Research Series taxonomy stands at 48 published projects across the core clusters. The Business cluster (ACC, WSB, BCM, BLA) is now closed as a 4-project foundation-plus-specialization structure with BLA at the base. The conventions sub-cluster (NWC, WCN, SMF) closed at v1.49.48 as a 3-project trilogy. The ecology cluster (COL, CAS, ECO, AVI, MAM, SAL, TIBS, FFA) remains the densest neighborhood for cross-references at 8+ projects. The infrastructure cluster (SYS, CMH, BCM, SHE, OCN, BPS, THE, HGE, NND, SAN) spans 10+ projects after SAN. The industrial layer (WYR) is anchored by a single flagship project. BLA formally closes the Business cluster as a 4-project foundation-plus-specialization structure and establishes the foundation-layer cluster pattern as a reusable structural affordance for future neighborhoods. Taxonomic state: 48 projects, 7 clusters, 2 closed sub-clusters (conventions, Business), ~201,000 cumulative research lines across 446 research modules.

---

## Files

- `www/tibsfox/com/Research/BLA/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/BLA/research/01-entity-formation.md` — 239 lines; sole proprietorship, LLC, S-Corp, C-Corp, cooperative, tribal enterprise
- `www/tibsfox/com/Research/BLA/research/02-double-entry.md` — 257 lines; Pacioli, 1494 Venice, modern GAAP, documentation-as-gift
- `www/tibsfox/com/Research/BLA/research/03-cooperative-accounting.md` — 228 lines; REI, credit unions, rural electric co-ops
- `www/tibsfox/com/Research/BLA/research/04-tribal-sovereignty.md` — 247 lines; tribal law as parallel legal system
- `www/tibsfox/com/Research/BLA/research/05-federal-compliance.md` — 252 lines; compliance as infrastructure
- `www/tibsfox/com/Research/BLA/research/06-equity-securities.md` — 302 lines; the cap table as constitution
- `www/tibsfox/com/Research/BLA/research/07-international-expansion.md` — 278 lines; transfer pricing, treaties, FCPA
- `www/tibsfox/com/Research/BLA/research/08-verification-matrix.md` — 143 lines; 46-source audit, 16 cross-links
- `www/tibsfox/com/Research/BLA/mission-pack/index.html` — 175 lines; mission-pack landing page
- `www/tibsfox/com/Research/BLA/mission-pack/mission.md` — 354 lines; mission-pack markdown source
- `www/tibsfox/com/Research/BLA/mission-pack/business-law-accounting-mission.tex` — 991 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/BLA/mission-pack/business-law-accounting-mission.pdf` — 181,738 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/BLA/index.html` — 107 lines; card landing page
- `www/tibsfox/com/Research/BLA/page.html` — 205 lines; full-site read page
- `www/tibsfox/com/Research/BLA/mission.html` — 58 lines; mission-pack bridge
- `www/tibsfox/com/Research/BLA/style.css` — 73 lines; slate + currency green theme
- `docs/research/business-law-accounting.md` — 354 lines; standalone research sidecar outside the www tree
- `www/tibsfox/com/Research/index.html` — +10 lines; hub card added for BLA
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring to 48 entries
- `www/tibsfox/com/index.html` — 2 lines; top-level hub count update to 48 projects

Aggregate: 21 files changed, +4,309 insertions, −2 deletions across 3 commits (content `ce0e65fbd` + docs `025e636ed` + merge `4a0cc792c`), v1.49.49..v1.49.50 window. The only deletions (2 lines) are from hub/index replacements that preserve byte-equivalent rendering.

---

**Prev:** [v1.49.49](../v1.49.49/) · **Next:** [v1.49.51](../v1.49.51/)

> *530 years. Every transaction recorded twice. The books balance or they don't.*
