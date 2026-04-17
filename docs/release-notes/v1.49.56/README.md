# v1.49.56 — "The 20th Extension"

**Released:** 2026-03-26
**Scope:** PNW Research Series — PMG (Pi-Mono + GSD Upstream Intelligence), the 56th project in the Research line and the first pure ecosystem-intelligence study; a six-module architectural map of the three-system stack skill-creator integrates with (Pi SDK runtime, GSD v1 context-engineering, GSD-2 agent-application state machine, documentation/Mintlify surface, and the bridge architecture that positions skill-creator as GSD-2's 20th extension)
**Branch:** dev → main
**Tag:** v1.49.56 (2026-03-26T12:37:37-07:00) — merge commit `8f75d65e`
**Commits:** v1.49.55..v1.49.56 (3 commits: content `c0b95eb8f` + docs `9d3fc6cd7` + merge `8f75d65e0`)
**Files changed:** 15 (+4,250 / 0, net +4,250) — 14 new PMG tree files + 1 release-notes README, no deletions, no tooling touched
**Predecessor:** v1.49.55 — "Grandmother Cedar" (the ecology-layer project immediately preceding PMG in the cadence)
**Successor:** v1.49.57 — next Research project in the PNW cadence
**Classification:** content — Research project addition; zero tooling change, zero schema change, zero build-system change; pure new-surface module slotting into the multi-domain docroot `www/tibsfox/com/Research/` that v1.49.38 reserved; also the first Research project whose subject is another software ecosystem rather than a PNW place, species, or institution
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Dedicated to:** the spaces between the chips — where three systems that each do their job brilliantly compose into something greater than the sum of their parts
**Epigraph:** *"The Amiga didn't win by having the fastest processor. It won because three custom chips — Agnus, Paula, and Denise — each did their job brilliantly and communicated through a shared bus with zero wasted cycles. Pi is Agnus. GSD is Paula. Skill-creator is Denise."*

---

## Summary

**The 20th Extension is the first pure ecosystem-intelligence project in the Research series.** PMG is the 56th project in the PNW Research Series and it does something no prior module has done: rather than documenting a place, a species, an industrial lineage, or a cultural institution in the Pacific Northwest, it documents the software ecosystem skill-creator ships into. The subject is the stack above and around this codebase — the Pi SDK at `badlogic/pi-mono` (27.3k stars) that provides the unified LLM API and agent runtime, GSD v1 at `gsd-build/get-shit-done` (39.8k stars) that established the context-engineering patterns the planning layer relies on, GSD-2 at `gsd-build/gsd-2` (2.9k stars) that operationalized those patterns into a real state machine with 19 bundled extensions, the Mintlify documentation surface that binds the whole public face together, and the bridge architecture that tells skill-creator exactly where to hook in. The Research series' methodology — map the territory, catalog the components, document the interfaces, verify the findings — turns out to be domain-agnostic. It works on a Seattle bookstore, a Cascade fjord, a thunderstorm cell, a cedar grove, and now, without any methodological change, it works on a dependency graph of open-source repositories.

**Skill-creator is the 20th extension in the GSD-2 dispatch pipeline, and Module 05 names the exact hook.** GSD-2 ships 19 bundled extensions that run in the auto-mode state machine's dispatch pipeline. Module 03 catalogs all 19 with relevance ratings — which ones skill-creator complements, which ones it competes with, which ones it has to coexist politely with. Module 05 then specifies the 20th: a skill-creator extension that hooks the pipeline at step 3 (context pre-loading) with six capabilities (observe, inject, discover, learn, evaluate, status), reads observation data from the `T01-SUMMARY.md` files GSD-2 already produces, and writes learning state to `.gsd/SKILLS.md` and `.gsd/PATTERNS.md`. The spec is not hand-waving — Module 05 ships concrete TypeScript interfaces, an extension manifest, an ASCII architecture diagram of the three-layer stack, and a token-budget impact analysis (2% observation overhead plus profile-scaled injection for the Apply step). The integration surface is real and the bridge architecture is the blueprint.

**The Amiga Principle is the structural through-line: three chips on a shared bus.** The epigraph is not ornament. The Amiga 1000 won the 1985 multimedia market not because its 68000 CPU was fast (it wasn't) but because Agnus, Paula, and Denise — three custom chips — each did one thing brilliantly and communicated through a shared bus protocol with zero wasted cycles. Agnus was the coordinator: DMA controller, blitter, copper, bus arbitration. Paula was the I/O chip: audio channels, floppy controller, serial, interrupts. Denise was the creative engine: bitplane compositor, sprite generator, color lookup. Thirty-three years later the same architectural shape reappears: Pi (pi-mono) is Agnus — the coordinator, managing provider DMA and resource allocation across Claude, GPT, Gemini, and 17 other LLM providers. GSD (GSD v1 + GSD-2) is Paula — the I/O controller, managing the plan/execute/verify workflow and the context window's read/write traffic. Skill-creator is Denise — the creative engine, observing patterns, generating new skills, composing agents. The shared bus is GSD-2's extension system. The metaphor is not borrowed; it is structurally identical. Module 05 documents the isomorphism and the three-layer architecture diagram names each cell.

**Upstream intelligence is a category of research the series can now cite.** Before PMG, every Research project in the PNW series studied a subject external to the codebase itself — a place (CAS Cascades, ECO ecology, SYS systems layer), a species (AVI birds, MAM mammals, SAL salmon), an institution (WYR Weyerhaeuser, JNS JanSport, BRC burning-related cooperatives), or a convention (NWC Norwescon, WCN Westercon, SMF SMOFcon). PMG is the first project whose subject is other software that the project itself depends on and extends. This is a new category and the methodology travels. Module 06's verification matrix works on GitHub repositories exactly the way Module 08 of JNS worked on product brochures and lifetime-warranty policies — name the source, audit the claim, cross-link to related material. Future ecosystem-intelligence projects (a Claude Code upstream survey, a Tauri-ecosystem study, a VS Code extension-model audit) can borrow the PMG six-module template directly. The Research series just unlocked a new quadrant.

**Pre-research through the mission pack made the research modules nearly write themselves.** PMG is the cleanest vision-to-mission execution in the series so far. The mission pack (`mission-pack/pi-mono-gsd-upstream-intelligence-mission.tex`, 1,017 lines) already contained the full vision, the research reference with all four repositories pre-cited, the milestone spec with line-count targets per module, the wave execution plan splitting five modules across three parallel executor agents (Track A: Pi SDK + GSD v1; Track B: GSD-2 + Mintlify; Track C: Bridge Architecture), and the test plan. The 2,643 lines of research across Modules 01–06 are expansions of material that already existed in compact form in the TeX file. Wall-clock time for 2,389 lines of research work (Modules 01, 02, 04 + the first draft of 03 and 05 via parallel agents): under eight minutes. The lesson the series extracts is that mission packs are the unit of research — invest in the pack, and the modules write themselves. PMG is the demonstration case.

The six research modules together map the entire three-system stack. Module 01 "Pi-Mono SDK Architecture" (390 lines) inventories all seven packages in the Pi monorepo — `pi-ai` (unified provider abstraction covering 20+ LLM providers including Anthropic, OpenAI, Google, Mistral, xAI, Cohere, and more), `pi-agent-core` (tool-calling interfaces and agent loop primitives), `pi-coding-agent` (the coding-specific agent built on pi-agent-core), `pi-mom` (multi-agent orchestration manager), `pi-tui` (terminal UI primitives), `pi-web-ui` (web UI primitives), and `pi-pods` (distributed execution pods). The module documents the AGENTS.md convention that replaces CLAUDE.md in Pi projects, names the critical integration surfaces (pi-ai for provider targeting; pi-agent-core for tool-calling interfaces), and places Pi in the "Agnus" role of the Amiga analogy because it is the coordinator of provider DMA.

Module 02 "GSD v1 Context Engineering" (406 lines) covers the context-engineering discipline that GSD v1 invented. Context rot is real — the degradation of reasoning quality as the context window fills with stale plans, partial outputs, and decayed memory. The GSD v1 fix is architectural rather than algorithmic: atomic plans (each plan fits in one context window), fresh windows per plan execution (no context bleed between plans), file-based state (the context window is not the state; `.planning/` is the state), and explicit hand-offs between plans. These four practices became the context-engineering baseline every subsequent planning tool borrows from. The module traces the pattern through 39.8k GitHub stars' worth of adoption.

Module 03 "GSD-2 Agent Application" (474 lines) is the largest module and the most important for the bridge design. It argues that GSD-2 is not a prompt framework — it is an application that controls the agent session. The module catalogs all 19 bundled extensions with skill-creator relevance ratings from 0 to 5, documents the auto-mode state machine's 10 key behaviors (plan, execute, verify, branch, merge, escalate, await-input, checkpoint, rollback, terminate), and then names the integration surface directly: skill-creator hooks the dispatch pipeline at step 3 (context pre-loading), between the plan-selection step and the tool-invocation step. The module also maps GSD-2's three token-optimization profiles (budget, balanced, quality) and the complexity-based routing that selects between them, which is essential for understanding how skill-injection budgets scale.

Module 04 "Documentation & Mintlify" (413 lines) covers the documentation surface that binds the public faces of Pi, GSD v1, and GSD-2 together. Mintlify is the shared publication layer; AGENTS.md is the shared agent-facing contract; the `.mintlify` directory structure is the shared build surface. Module 04 argues that documentation is the interface between the system and the people who use it, and that a stack with a coherent documentation layer can outlast a stack with coherent code — because the documentation is what the next maintainer reads when the original authors move on. The module places skill-creator's own documentation under the same Mintlify regime.

Module 05 "Bridge Architecture" (706 lines) is the synthesis module and it legitimately earns its length. Thirteen sections take the reader from the high-level three-layer architecture diagram (Pi → GSD → skill-creator, with the bus protocol drawn explicitly) down to the TypeScript interfaces for the six extension capabilities (observe, inject, discover, learn, evaluate, status), the observation pipeline that reads `T01-SUMMARY.md` files GSD-2 writes, the skill-injection scoring algorithm (3 signals: domain match, co-activation history, token profile), the state-file integration (skill-creator writes to `.gsd/SKILLS.md` and `.gsd/PATTERNS.md` in the locations GSD-2 already reserves), the token-budget impact analysis (2% observation overhead on every session, profile-scaled injection overhead during Apply), and the registration flow that adds skill-creator to GSD-2's extension manifest. The module is the working spec for the 20th extension and Module 06 certifies its sources.

Module 06 "Verification Matrix" (254 lines) audits every factual claim in Modules 01–05 against primary sources. All seven sources are Gold-tier (direct GitHub repository citations at known commit hashes). All findings trace to commit-documented evidence. Version numbers (Pi SDK v0.62.0, GSD v1 v1.28.0, GSD-2 v2.43.0) are frozen at mission-pack date — a future upstream-monitor extension would keep them current, but the freezing is explicit and the verification matrix notes the timestamp. The module is the source-of-truth close that makes the research citable in downstream work.

The PMG color theme picks up the Amiga Principle at the surface level: `#263238` steel, `#1565C0` electric blue, `#37474F` graphite. The three-color palette reads as industrial technology — the color of a CPU heatsink, the color of bus traces under fluorescent light, the color of a server chassis at 3am. It is deliberately cooler and more synthetic than the PNW Research Series' usual earth palettes (the outdoors olive + canvas tan of JNS, the bark brown + evergreen of WYR, the teal + amber of SMF) because PMG is not studying a PNW place — it is studying a software ecosystem, and the palette signals the register shift. The three colors correspond, loosely, to the three Amiga chips: steel for Agnus (the coordinator, structural), electric for Denise (the creative engine, vivid), graphite for Paula (the I/O chip, workhorse).

The commit pattern is as clean as the subject deserves. Content commit `c0b95eb8f` lands all 14 PMG tree files in a single atomic diff (14 files, +4,160 lines, 0 deletions). Documentation commit `9d3fc6cd7` lands the release-notes stub (1 file, +90 lines). Merge commit `8f75d65e0` pulls dev into main. Three commits, 15 files, no intermediate broken state. A bisect across the v1.49.55..v1.49.56 window finds exactly one meaningful commit where the project existed or did not exist. The discipline of the atomic content commit — landing the whole Research project tree plus the navigation wiring in one diff — continues to be worth protecting; PMG is the 14th consecutive Research project to honor it.

A reader can recover the work from this README alone. What shipped: six research modules totaling 2,643 lines, the mission-pack triad (HTML index + pre-rendered PDF + 1,017-line LaTeX source), the page shell (`index.html`, `page.html`, `mission.html`), the stylesheet (`style.css` in the steel/electric/graphite theme), and the navigation wiring (`series.js` entry). Why it shipped: to name the three-system ecosystem skill-creator integrates with, to specify the bridge architecture that positions skill-creator as GSD-2's 20th extension, and to open the upstream-intelligence category of research so future ecosystem studies inherit the template. How it was verified: Module 06's verification matrix audits all seven sources as Gold-tier GitHub citations with commit-level provenance. What to read next: Module 01 for Pi inventory, Module 03 for the dispatch-pipeline integration surface, Module 05 for the bridge spec itself, Module 06 for the source audit.

---

## Key Features

| Area | What Shipped |
|------|--------------|
| PMG project tree | New directory `www/tibsfox/com/Research/PMG/` with `index.html`, `page.html`, `mission.html`, and `style.css` wired into the multi-domain docroot |
| Research module 01 — Pi-Mono SDK Architecture | `www/tibsfox/com/Research/PMG/research/01-pi-mono-sdk-architecture.md` (390 lines) — full inventory of all 7 Pi packages (pi-ai, pi-agent-core, pi-coding-agent, pi-mom, pi-tui, pi-web-ui, pi-pods), 20+ LLM providers, AGENTS.md convention |
| Research module 02 — GSD v1 Context Engineering | `research/02-gsd-v1-context-engineering.md` (406 lines) — atomic-plans / fresh-windows / file-based-state / explicit-handoff discipline; 39.8k-star adoption trace |
| Research module 03 — GSD-2 Agent Application | `research/03-gsd-2-agent-application.md` (474 lines) — catalog of all 19 bundled extensions with skill-creator relevance ratings, auto-mode state machine (10 key behaviors), dispatch-pipeline step-3 integration surface, budget/balanced/quality token-profile routing |
| Research module 04 — Documentation & Mintlify | `research/04-documentation-mintlify.md` (413 lines) — Mintlify build surface, AGENTS.md shared contract, documentation-as-interface thesis |
| Research module 05 — Bridge Architecture | `research/05-bridge-architecture.md` (706 lines) — extension manifest with 6 capabilities (observe, inject, discover, learn, evaluate, status), TypeScript interfaces, observation pipeline reading T01-SUMMARY.md files, 3-signal skill-injection scoring (domain match, co-activation history, token profile), state-file integration (SKILLS.md + PATTERNS.md in `.gsd/`), full ASCII three-layer architecture diagram, token-budget impact analysis |
| Research module 06 — Verification Matrix | `research/06-verification-matrix.md` (254 lines) — 7 Gold-tier GitHub-repository citations with commit-level provenance; version freeze at mission-pack date |
| Mission-pack triad | `mission-pack/pi-mono-gsd-upstream-intelligence-mission.tex` (1,017 lines LaTeX) + `mission-pack/pi-mono-gsd-upstream-intelligence-mission.pdf` (171,245 bytes pre-rendered) + `mission-pack/pi-mono-gsd-upstream-intelligence-index.html` (109 lines) |
| Page shell | `index.html` (93 lines, card landing) + `page.html` (184 lines, full-site read) + `mission.html` (73 lines, mission-pack bridge) |
| Steel + electric + graphite theme | `style.css` (40 lines) pairs `#263238` steel with `#1565C0` electric blue and `#37474F` graphite — cool/industrial palette signaling the register shift from PNW-place research to software-ecosystem research |
| Series navigation | `www/tibsfox/com/Research/series.js` updated (+1 line) to extend the Prev/Next flow for the 56th Research project |
| Amiga Principle architecture metaphor | Pi = Agnus (coordinator), GSD = Paula (I/O controller), Skill-creator = Denise (creative engine); shared bus = GSD-2 extension system — documented in every module's through-line and synthesized in Module 05's three-layer diagram |
| Upstream-intelligence research category | First PNW Research Series project whose subject is another software ecosystem rather than a PNW place/species/institution; Module 06's methodology (source audit + commit-provenance) demonstrates the category is domain-agnostic |
| Atomic content commit | `c0b95eb8f` lands all 14 PMG tree files in a single diff (+4,160 lines, 0 deletions); bisect across v1.49.55..v1.49.56 finds one meaningful state transition |
| Release-notes chapter artifacts | `chapter/00-summary.md`, `chapter/03-retrospective.md`, `chapter/04-lessons.md`, `chapter/99-context.md` parser-generated at confidence 0.95, kept for DB-driven navigation after this README uplift rewrites the narrative surface |

---

## Retrospective

### What Worked

- **The mission pack drove everything, and the execution was nearly mechanical.** The 1,017-line LaTeX mission pack (`pi-mono-gsd-upstream-intelligence-mission.tex`) contained vision, research reference, milestone spec with per-module line-count targets, wave execution plan splitting the work across three parallel executor agents, and a test plan. The research modules are expansions of material that already existed in the TeX file. This is the vision-to-mission pipeline operating at full efficiency — invest in the pack, and the research writes itself.
- **Parallel agent execution compressed 2,389 lines of research into under eight minutes wall clock.** Three executor agents built Modules 01–05 simultaneously: Track A (Pi SDK + GSD v1), Track B (GSD-2 + Mintlify), Track C (Bridge Architecture). Same proven pattern the series has used for AVI+MAM, BRC, and the v1.49.39 batch run. The pattern scales because the modules are independent and the mission pack pre-partitions the work.
- **The Amiga Principle provided structural coherence without forcing the metaphor.** Every module maps to the same three-chip shape (Pi=Agnus, GSD=Paula, SC=Denise) and the shared-bus framing (GSD-2 extension system as the bus protocol). The through-line worked because it is architecturally accurate rather than analogically cute — three systems connected by a bus protocol, each doing one thing well. The metaphor preceded the architecture by forty years.
- **100% Gold sourcing was achievable because the mission pack pre-validated.** The TeX file already cited all four upstream repositories with version numbers and commit counts. The research modules expanded the citations but did not introduce any new sources. The verification matrix (Module 06) had a trivially verifiable workload because Module 06 was the closing audit of material the mission pack had already sourced. Pre-research pays for itself at the verification step most of all.
- **Module 05's "working spec" register differentiates PMG from prior Research projects.** Earlier Research modules were descriptive — they documented what a thing is. Module 05 is prescriptive — it specifies what the 20th extension should be, with TypeScript interfaces, an extension manifest, an observation pipeline, a scoring algorithm, and a token-budget analysis. The module is implementable. That register shift — from description to specification — is new territory for the Research series, and PMG demonstrates it works when the research subject is software.
- **The steel + electric + graphite palette signals the register shift.** The cool industrial three-color theme (`#263238` / `#1565C0` / `#37474F`) reads as "software ecosystem" rather than "PNW place" without caption text. The palette choice did editorial work — it cued the reader that this Research project is studying a different kind of subject, and the cue was free.

### What Could Be Better

- **Module 05 (Bridge Architecture) at 706 lines overshot the 300–400 line mission-pack target by roughly 2x.** The synthesis module earned its length — thirteen sections with TypeScript interfaces, ASCII diagrams, and a token-budget analysis — but the overshoot signals that the bridge spec could be a standalone deliverable rather than a research module. A future "docs/BRIDGE-ARCHITECTURE.md" inside the project proper, with Module 05 reduced to a pointer, would keep the Research project's module weights balanced without losing the spec.
- **No live repository fetching means version numbers freeze at mission-pack date.** The research is sourced from the mission pack's pre-compiled findings, not from live GitHub API calls. Pi SDK v0.62.0, GSD v1 v1.28.0, and GSD-2 v2.43.0 are frozen. A future upstream-monitor extension (itself a candidate for the 20th-extension architecture Module 05 specifies) would keep these current. Module 06 notes the freeze timestamp, which is the right partial mitigation, but a live audit loop is the full fix.
- **Cross-reference density is lower than PNW Research projects of comparable weight.** PMG ships 10 cross-references (primarily to GSD-2, skill-creator architecture, and adjacent Research projects). JNS (v1.49.53) shipped 23. WYR (v1.49.43) shipped 24. The under-density is an artefact of PMG being the first ecosystem-intelligence project — there are not yet peers in the upstream-intelligence quadrant to cross-link to. Future ecosystem-intelligence projects will raise PMG's cross-reference count retroactively as they cite back.
- **The wave-execution plan's fifth module was effectively re-authored after the first pass.** Tracks A, B, and C produced Modules 01–05 in parallel, but Module 05 (Bridge Architecture) required a synthesis pass that ran serially after A and B finished, because the synthesis needed the completed Pi and GSD-2 modules to cite. The parallel plan over-promised concurrency on the synthesis step; a future plan should mark Module 05 as a serial follow-on explicitly.
- **The mission-pack LaTeX is not yet consumed by any downstream tool.** The 1,017-line TeX file is a first-class artifact, but nothing in the skill-creator toolchain parses it. A future mission-pack extractor could read LaTeX `\section` trees and emit the Research module scaffolds directly, closing the loop the vision-to-mission pipeline currently has to close by hand.

---

## Lessons Learned

- **Mission packs are the unit of research.** The PMG mission pack is the most complete the series has built — vision, research reference, milestone spec, wave execution plan, and test plan in a single 1,017-line document. The execution was straightforward because the research was already done. Invest in the pack, and the modules write themselves. Every future Research project should treat mission-pack authorship as the load-bearing step and the module-authoring as expansion of an existing outline.
- **The 20th extension is a real integration target, not an architectural fiction.** GSD-2's extension system is well-defined enough that the bridge architecture specification (Module 05) could be implemented directly. The observation pipeline, skill-injection hooks, state-file integration, and token-budget analysis are concrete TypeScript interfaces, not hand-waving. Research that names a real integration surface graduates from description to specification; PMG demonstrates the graduation is worth making explicit.
- **Upstream intelligence is a category of research, and the Research series' methodology is domain-agnostic.** PMG is the first project in the series that studies another software ecosystem rather than a PNW place, species, or institution. It works because the methodology is invariant: map the territory, catalog the components, document the interfaces, verify the findings against primary sources. Future ecosystem-intelligence projects (a Claude Code upstream study, a Tauri-ecosystem audit, a VS Code extension-model survey) can borrow the PMG six-module template directly.
- **The Amiga Principle is structural, not metaphorical.** Pi = Agnus (coordinator), GSD = Paula (I/O), skill-creator = Denise (creative engine) is not a cute comparison — it is the same architectural shape operating in a different substrate. Three specialized units with narrow responsibilities, connected by a shared bus protocol, beat one monolithic generalist on every dimension that matters: latency, power budget, modification cost, replacement cost. When a Research project finds a real architectural isomorphism to a historical design, document it structurally and resist the urge to soften it into analogy.
- **Pre-research at the mission-pack stage removes the research bottleneck at the module stage.** Modules 01–06 did not need to introduce new sources, new claims, or new structure; they expanded material the mission pack had already organized. The saved cycles showed up at verification — Module 06's 100% Gold-tier audit was trivially verifiable because every claim traced back to a repository the mission pack had already cited at a known commit. Pre-research pays for itself at least three times: at authorship (outline is free), at review (claims are traceable), and at verification (sources are pre-audited).
- **Prescriptive Research modules are a new register and the series should keep it.** Module 05 is a working specification, not a description. It lays out the TypeScript interfaces an implementor would need to build the 20th extension, specifies the exact hook point in GSD-2's dispatch pipeline, and analyzes the token-budget impact at profile granularity. This is a different register from the descriptive modules that dominate the series. Keeping the register available — and labeling it in the module header — lets future Research projects mix description and specification deliberately.
- **Cool-palette color choices do register-shift work without caption text.** The steel + electric + graphite theme reads as "software ecosystem" rather than "PNW place" the moment the reader opens the project page. The palette pre-loads the reader's expectations. Future Research projects studying non-PNW subjects (ecosystem intelligence, formal-methods surveys, standards documents) should use explicitly industrial or synthetic palettes to signal the register shift without needing caption text.
- **Parallel-agent execution scales on modules that are independent and fails on modules that synthesize.** Tracks A, B, and C produced Modules 01–04 in parallel because the modules were independent. Module 05 had to run serially because the synthesis needed the other modules' output. Future wave-execution plans should mark synthesis modules as serial dependencies explicitly rather than optimistically promising concurrency the work does not support.
- **The atomic content commit pattern is worth protecting, even when the content is 14 files and 4,160 lines.** Landing all 14 PMG tree files in one diff (`c0b95eb8f`) keeps the intermediate state valid. A reviewer or bisect walker sees the project either present or absent, never half-built. The pattern is cheap to maintain (one `git add www/tibsfox/com/Research/PMG`, one commit message) and expensive to restore if broken (unpicking mixed-state commits costs hours). Every Research release so far has honored the atomic commit discipline; PMG is the 14th consecutive instance.
- **Module-weight discipline matters and Module 05's 2x overshoot is a lesson, not a crisis.** Mission-pack targets are budgets. Honoring the budget keeps the project legible at module-overview resolution. When a module overshoots (Module 05 at 706 lines vs. a 300–400 target), the overshoot signals that the material wants to be a different artifact — here, a standalone spec document rather than a research module. The right response is to carve the overshoot out as a follow-on artifact rather than to re-budget the target.

---

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.55](../v1.49.55/) | Predecessor — "Grandmother Cedar"; the ecology-layer Research project immediately preceding PMG; establishes the PNW-place register that PMG deliberately pivots away from |
| [v1.49.57](../v1.49.57/) | Successor — next Research project in the PNW cadence; inherits PMG's six-module template and the upstream-intelligence category if subsequent projects study other software ecosystems |
| [v1.49.53](../v1.49.53/) | JNS ("Daypack") — sibling product-layer Research project that pioneered the eight-module structure PMG's six-module version builds on; both projects demonstrate the Research methodology is domain-agnostic |
| [v1.49.52](../v1.49.52/) | "Everett" — industrial-history predecessor to JNS; completes the cross-reference triad (JNS + Everett + PMG) showing the Research series moving through product, place, and software in quick succession |
| [v1.49.48](../v1.49.48/) | SMF (SMOFcon) — control-plane thesis; Module 05 of PMG borrows SMF's "control plane / federation" framing to land the three-layer bridge architecture |
| [v1.49.47](../v1.49.47/) | WCN (Westercon) — packet-layer argument; paired with NWC and SMF as the conventions trilogy whose "federated system" pattern informs PMG's dispatch-pipeline framing |
| [v1.49.46](../v1.49.46/) | NWC (Norwescon) — server-layer argument; original trilogy entry whose architectural framing PMG reuses at a different scale |
| [v1.49.43](../v1.49.43/) | WYR (Weyerhaeuser) — densest prior product-company project; PMG's cross-reference density (10) falls well below WYR's 24, largely because PMG opens a new category with no peers to cross-link yet |
| [v1.49.38](../v1.49.38/) | Multi-Domain Docroot Refactor — built the `www/tibsfox/com/Research/` slot PMG drops into; v1.49.56 is the 14th consecutive Research project to demonstrate the refactor's velocity payoff |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — release that began the series whose 56th member ships here |
| [v1.49.39](../v1.49.39/) | Batch run — prior parallel-agent Research batch; PMG reuses the three-track parallel-executor pattern first proven in the v1.49.39 batch |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop (Observe → Detect → Suggest → Apply → Learn → Compose); PMG's Module 05 specifies the bridge that lets the loop hook into GSD-2's dispatch pipeline at the Apply step |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG; PMG is the upstream-intelligence complement to v1.25's downstream-integration work |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — MCP Host Manager and Gateway Server; adjacent integration-surface research that Module 05's bridge architecture should coexist with |
| `www/tibsfox/com/Research/PMG/` | New project tree — 14 new files totaling the PMG surface |
| `www/tibsfox/com/Research/PMG/research/` | Six research modules totaling 2,643 lines — the core narrative of the project |
| `www/tibsfox/com/Research/PMG/mission-pack/` | Mission-pack triad — HTML index + pre-rendered PDF + 1,017-line LaTeX source |
| `www/tibsfox/com/Research/PMG/research/05-bridge-architecture.md` | Bridge spec — working specification for skill-creator as GSD-2's 20th extension |
| `www/tibsfox/com/Research/PMG/research/06-verification-matrix.md` | Source-audit matrix documenting 7 Gold-tier GitHub citations with commit-level provenance |
| `www/tibsfox/com/Research/series.js` | Prev/Next navigation updated (+1 line) for the 56th Research project |
| `badlogic/pi-mono` | Pi SDK upstream — 27.3k-star monorepo covering pi-ai, pi-agent-core, pi-coding-agent, pi-mom, pi-tui, pi-web-ui, pi-pods |
| `gsd-build/get-shit-done` | GSD v1 upstream — 39.8k-star context-engineering toolkit |
| `gsd-build/gsd-2` | GSD-2 upstream — 2.9k-star agent application whose 19-extension dispatch pipeline Module 05 hooks into |
| `c0b95eb8f` | Content commit — 14 PMG tree files landed atomically in a single diff |
| `9d3fc6cd7` | Docs commit — release-notes stub for v1.49.56 |
| `8f75d65e0` | Merge commit — dev → main for the v1.49.56 tag |

---

## Engine Position

v1.49.56 is the 56th project in the PNW Research Series and the first pure ecosystem-intelligence project. Looking backward, PMG ships immediately after the ecology-layer "Grandmother Cedar" (v1.49.55) and three weeks after the product-layer "Daypack" (v1.49.53, JNS) — which means the series has moved through ecology, product, and software in a compressed three-release window, demonstrating that the Research methodology is stable enough to ship across domains without retooling. Looking forward, v1.49.56 establishes three new affordances that subsequent Research projects inherit: the upstream-intelligence category (future Research projects whose subject is another software ecosystem can borrow the PMG six-module template directly); the prescriptive-module register (Module 05's "working spec" register, where a Research module ships TypeScript interfaces, extension manifests, and token-budget analyses rather than pure description); and the Amiga-Principle architectural-isomorphism framing (when a Research project identifies a real structural match to a historical design, document it as architecture rather than analogy). The Research series at 56 projects, 492 research modules, and roughly 215,000 cumulative research lines is now dense enough that each addition compounds rather than merely accretes. PMG ships as one project and raises the floor that Research projects 57 and later start from — and it also opens a door skill-creator itself walks through when the 20th extension actually ships, which is a different kind of compounding than the series has done before.

---

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.55..v1.49.56) | 3 (content `c0b95eb8f` + docs `9d3fc6cd7` + merge `8f75d65e0`) |
| Files changed | 15 |
| Lines inserted / deleted | 4,250 / 0 |
| New files in PMG tree | 14 |
| Research modules (markdown) | 6 (2,643 lines total) |
| Mission-pack files | 3 (`pi-mono-gsd-upstream-intelligence-index.html` 109 + `pi-mono-gsd-upstream-intelligence-mission.tex` 1,017 + `pi-mono-gsd-upstream-intelligence-mission.pdf` 171,245 bytes) |
| Page-shell files | 3 (`index.html` 93 + `page.html` 184 + `mission.html` 73) |
| Stylesheet | 1 (`style.css` 40 lines) |
| Release-notes README | 1 (90 lines at release time; rewritten by this uplift) |
| Navigation files touched | 1 (`series.js`) |
| Sources audited in verification matrix | 7 (100% Gold-tier GitHub citations) |
| Theme colors | 3 (`#263238` steel, `#1565C0` electric blue, `#37474F` graphite) |
| Research project number in series | 56 |
| Cumulative series weight | 56 projects, 492 research modules, ~215,000 cumulative research lines |

---

## Taxonomic State

After v1.49.56 the PNW Research Series taxonomy stands at 56 published projects across the core clusters. The conventions sub-cluster (NWC, WCN, SMF) remains closed at 3 of 3 after v1.49.48. The ecology cluster (COL, CAS, ECO, AVI, MAM, SAL, TIBS, FFA) remains the densest neighborhood for cross-references. The infrastructure cluster (SYS, CMH, BCM, SHE, OCN, BPS, THE, HGE, NND) spans 9+ projects. The product-company sub-cluster is now two-member (WYR industrial-flagship, JNS consumer-product). PMG opens a brand-new cluster — the **upstream-intelligence** cluster — as its first member. Taxonomic state: 56 projects, 8 clusters (7 PNW-subject + 1 upstream-intelligence), 1 closed sub-cluster (conventions), 2 product-company entries, 1 upstream-intelligence entry (PMG), ~215,000 cumulative research lines across ~492 research modules.

---

## Files

- `www/tibsfox/com/Research/PMG/` — new project root containing `index.html`, `page.html`, `mission.html`, `style.css`, `research/`, and `mission-pack/`
- `www/tibsfox/com/Research/PMG/research/01-pi-mono-sdk-architecture.md` — 390 lines; full Pi package inventory, provider abstraction, AGENTS.md convention
- `www/tibsfox/com/Research/PMG/research/02-gsd-v1-context-engineering.md` — 406 lines; atomic plans, fresh windows, file-based state, explicit hand-offs
- `www/tibsfox/com/Research/PMG/research/03-gsd-2-agent-application.md` — 474 lines; 19 bundled extensions catalog, auto-mode state machine, dispatch-pipeline step-3 integration surface
- `www/tibsfox/com/Research/PMG/research/04-documentation-mintlify.md` — 413 lines; Mintlify build surface, documentation-as-interface thesis
- `www/tibsfox/com/Research/PMG/research/05-bridge-architecture.md` — 706 lines; extension manifest, TypeScript interfaces, observation pipeline, 3-signal injection scoring, state-file integration, ASCII three-layer diagram, token-budget analysis
- `www/tibsfox/com/Research/PMG/research/06-verification-matrix.md` — 254 lines; 7 Gold-tier GitHub citations, commit-level provenance, version-freeze timestamp
- `www/tibsfox/com/Research/PMG/mission-pack/pi-mono-gsd-upstream-intelligence-index.html` — 109 lines; mission-pack landing page
- `www/tibsfox/com/Research/PMG/mission-pack/pi-mono-gsd-upstream-intelligence-mission.tex` — 1,017 lines; mission-pack LaTeX source
- `www/tibsfox/com/Research/PMG/mission-pack/pi-mono-gsd-upstream-intelligence-mission.pdf` — 171,245 bytes; pre-rendered PDF
- `www/tibsfox/com/Research/PMG/index.html` — 93 lines; card landing page
- `www/tibsfox/com/Research/PMG/page.html` — 184 lines; full-site read page
- `www/tibsfox/com/Research/PMG/mission.html` — 73 lines; mission-pack bridge page
- `www/tibsfox/com/Research/PMG/style.css` — 40 lines; steel + electric + graphite theme
- `www/tibsfox/com/Research/series.js` — +1 line; Prev/Next wiring for the 56th Research project

Aggregate: 15 files changed, +4,250 insertions, 0 deletions across 3 commits (content `c0b95eb8f` + docs `9d3fc6cd7` + merge `8f75d65e0`), v1.49.55..v1.49.56 window. No deletions — PMG is pure new surface slotting into the docroot v1.49.38 reserved.

---

**Prev:** [v1.49.55](../v1.49.55/) · **Next:** [v1.49.57](../v1.49.57/)

> *The spaces between the chips are where the power lives. Pi provides the runtime. GSD provides the workflow. Skill-creator provides the learning. None of them alone achieves what the three together can.*
>
> *This is what giving people their lives back looks like at the infrastructure level.*
