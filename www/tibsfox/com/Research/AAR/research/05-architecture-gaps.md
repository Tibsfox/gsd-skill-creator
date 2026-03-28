# Architecture Gap Analysis

> **Domain:** Architecture Alignment and Refinement
> **Module:** 5 -- Architecture Gap Analysis
> **Through-line:** *Every architecture has a design surface and an implementation surface. The gap between the two is not failure -- it is information. This module catalogs the seven identified gaps between what the Research series intends and what it has actually built, providing evidence from 40 release notes, impact assessment, and concrete resolution paths. Some gaps are actionable now. Some are intentional. All deserve honest documentation.*

---

## Table of Contents

1. [GAP-1: Cross-Reference Automation](#gap-1-cross-reference-automation)
2. [GAP-2: College of Knowledge Not Wired](#gap-2-college-of-knowledge-not-wired)
3. [GAP-3: PNW vs. Global Scope](#gap-3-pnw-vs-global-scope)
4. [GAP-4: GPU Pipeline Not Built End-to-End](#gap-4-gpu-pipeline-not-built-end-to-end)
5. [GAP-5: Minecraft Simulation Not Running](#gap-5-minecraft-simulation-not-running)
6. [GAP-6: DACP Not Publicly Documented](#gap-6-dacp-not-publicly-documented)
7. [GAP-7: Content Filter Vulnerability at Scale](#gap-7-content-filter-vulnerability-at-scale)
8. [Gap Priority Matrix](#gap-priority-matrix)
9. [Resolution Timeline](#resolution-timeline)

---

## GAP-1: Cross-Reference Automation

**ID:** GAP-1
**Priority:** Critical
**Status:** Partially addressed in AAR Wave 1 (cross-reference index)

### Misalignment Description

**Intended:** The Research series' core thesis is that "the meaning lives between the nodes" (v1.49.103). The Rosetta Stone framework exists specifically to be a translation layer between domains. The architecture values interconnection as the primary product -- the relationships between projects are more valuable than the projects themselves.

**What Exists:** Cross-references between 167+ research projects are manually maintained. Each project's through-line mentions related projects by ID, and the ROSETTA.md translation table maps concepts across clusters, but there is no automated bidirectional linking system. When a new project is added, all existing projects that should reference it must be manually identified and updated. This does not happen.

### Evidence

- **v1.49.101:** "Module cross-referencing between projects could be automated"
- **v1.49.103:** Title itself is "The Meaning Lives Between the Nodes" -- acknowledging the gap implicitly
- **v1.49.111:** "The index IS the product" -- recognizing that the navigation layer is the value layer
- **v1.49.82:** "Place-based research naturally cross-references. Every project in this wave connects to 7+ existing projects because places ARE intersections." The cross-references are identified during writing but not persisted as structured data.

### Impact Assessment

As the series grows from 137 to 167+ projects, manual cross-referencing becomes O(n^2) work. Each new project potentially connects to dozens of existing projects. The Rosetta Stone framework operates at the cluster level (10 clusters, well-maintained) but not at the module level (1,000+ modules, unlinked). The translation layer works for broad navigation but fails for deep exploration. A reader who finds an insight in ECO's mycorrhizal network module has no structured way to discover that the same pattern appears in CMH's mesh topology module, SYS's TCP/IP module, and BRC's federation module -- unless they read ROSETTA.md cover to cover.

### Resolution Path

1. **Extend series.js with an edges array.** Each project already has an `id` and `name`. Add a `connections` array of project IDs that represent direct cross-references. This is the minimum viable graph.
2. **Build a cross-reference index generator.** Scan all research markdown files for `../[A-Z]{2,4}/` relative link patterns and `[A-Z]{2,4}` project ID references. Output a `cross-references.json` adjacency list.
3. **Add a visual graph view.** D3.js force-directed layout on the series landing page showing cluster topology and inter-project edges. The graph IS the Rosetta Stone made visual.
4. **Automate bidirectional linking.** When a new project references existing projects, generate a "Referenced by" section in the target projects. This closes the O(n^2) loop.

### What v1.49.132 Addresses

The AAR Wave 1 cross-reference index (01-cross-reference-index.md) catalogs the existing cross-reference patterns and provides a framework for measuring connection density. The structural work (extending series.js, building the graph view) remains as future implementation work.

---

## GAP-2: College of Knowledge Not Wired

**ID:** GAP-2
**Priority:** High
**Status:** Open -- documented but not addressed in v1.49.132

### Misalignment Description

**Intended:** The College of Knowledge (COK) defines 42 departments organized under the Rosetta Core framework. It represents the curriculum structure that maps every research project to formal academic domains. The Complex Plane of Experience -- unit circle, set theory, category theory, Fourier analysis, topology, L-systems -- provides the mathematical backbone. The College should be the navigable structure that lets a reader say "show me everything related to signal processing" and get results across all 167 projects.

**What Exists:** The College of Knowledge is referenced in multiple releases as the curriculum framework, but the 42 departments lack code-level cross-reference links to research project modules. The `.college/` directory exists in the repository with Rosetta Core, panels, and departments (culinary-arts, mathematics, mind-body), but the wiring from research modules back to College departments is absent. The CDL (College Deep Linking) project documents the vision but does not implement the links.

### Evidence

- **v1.49.105:** "The College of Knowledge's 42 departments are architecturally present but code-level cross-reference links are not yet installed"
- **v1.49.123:** References College framework integration as ongoing work
- **v1.49.131:** M6 (College of Knowledge Integration) described as providing the template for wiring

### Impact Assessment

The College of Knowledge is a university with no hallways between buildings. A student can enter the Mathematics department or the Culinary Arts department, but cannot walk from one to the other through a shared concept like "ratio" (which appears in both recipe scaling and mathematical proportion). The FEG (FoxEdu Gap-Fill) project identifies educational gaps, but without the wiring, the gap analysis cannot be validated against actual module coverage. The curriculum is aspirational rather than navigable.

### Resolution Path

1. **Create `college-mapping.json` per project.** For each of the 167 research projects, a JSON file maps which College departments the project's modules touch. Example: `{"project": "PRS", "mappings": [{"module": "05-rhythm-frequency-hz", "departments": ["mathematics", "music-theory", "signal-processing"]}]}`.
2. **Build a College index page.** A browsable page at `.college/` or `www/COK/` that aggregates all mappings and presents a department-centric view of the Research series.
3. **Validate coverage.** Cross-reference the 42 departments against the 167 projects to identify departments with zero or minimal coverage. Feed results to FEG gap analysis.
4. **Generate bidirectional links.** From each department page, link to all research modules that touch it. From each research module, show which departments it belongs to.

### What v1.49.132 Addresses

This gap is documented and analyzed but not resolved. The CDL project provides the architectural vision; the AAR audit identifies it as the second-highest priority gap. Implementation requires a dedicated milestone.

---

## GAP-3: PNW vs. Global Scope

**ID:** GAP-3
**Priority:** Low (intentional design decision)
**Status:** Resolved by documentation -- this is not a gap, it is a feature

### Misalignment Description

**Intended:** The Rosetta Stone framework claims to translate between domains universally. The ten clusters and the cross-domain translation table suggest a framework that works regardless of geography.

**What Exists:** The project's soul is PNW bioregion mapping -- "the forest IS Foxy." Seven releases across v1.49.82-131 identify international or non-Western coverage gaps: NWZ required OCAP/CARE/UNDRIP compliance for Mesoamerican, Native American, and African knowledge systems; IBC documented Indigenous broadcasting sovereignty; BMR connects to African roots. The tension is between fidelity to place (the project's strength) and comprehensive coverage (the framework's theoretical promise).

### Evidence

- **v1.49.86:** "IBC required OCAP/CARE/UNDRIP compliance throughout. Every nation named specifically."
- **v1.49.88:** NWZ "required the most cultural care" -- documenting non-Western zodiac systems with proper attribution
- **v1.49.82-90:** Seven releases note international coverage gaps as "What Could Be Better"
- **Memory/Center Camp:** "The PNW research IS the forest. Foxy is from the PNW, Salish heritage, decades living in these forests."

### Impact Assessment

This is not actually a misalignment. It is a design decision that deserves explicit documentation rather than implicit apology. The Rosetta Stone framework translates between domains *as seen from the PNW*. It does not claim to be the only possible translation -- it claims to be this one, from this place, by this person. A reader in Australia could build their own bioregion mapping using the same framework patterns, producing a different but structurally compatible translation table. The framework is portable; the content is place-specific.

If the PNW lens is presented as universal without acknowledgment of its scope, it risks the same extractive pattern the project explicitly opposes: claiming universal authority from a particular viewpoint. Honest scoping prevents this.

### Resolution Path

1. **Add a scope declaration to ROSETTA.md.** A paragraph at the top stating: "This is the view from the Pacific Northwest. The framework is designed to be forked for other bioregions. Other forests would map their own translation tables."
2. **Frame international extensions as expansion packs.** Not "gaps to fill" but "other perspectives to add." Each would be its own ROSETTA variant, not a correction to this one.
3. **Maintain OCAP/CARE/UNDRIP compliance.** Any non-Western content continues to follow the cultural sovereignty protocols already established in IBC and NWZ.

### What v1.49.132 Addresses

This gap is reclassified from "misalignment" to "intentional scope boundary." The AAR documents the reasoning so future contributors understand the design choice rather than treating it as an oversight.

---

## GAP-4: GPU Pipeline Not Built End-to-End

**ID:** GAP-4
**Priority:** Medium
**Status:** Open -- research complete, implementation not started

### Misalignment Description

**Intended:** The project envisions a GPU-accelerated pipeline from research taxonomy data through mathematical computation to rendered visualization. Multiple projects document pieces of this pipeline: GPO (GPU Orchestration), GPG (GPU Ecosystem), VKS (Vulkan Screensaver), CHS (Chaos Sense shader fitness), GRD (Gradient Engine), and MPC (Math Co-Processor with 125 tests and CUDA stream isolation).

**What Exists:** Each piece exists as research documentation or isolated code. MPC has working tests and CUDA stream isolation. VKS documents screensaver architecture. CHS explores shader fitness landscapes. GRD maps gradient computation. But the end-to-end pipeline -- take a research project's data, compute a layout via MPC, render it via Vulkan/CUDA, display it interactively -- does not exist as running code. The pipeline is documented as architecture, not demonstrated as working software.

### Evidence

- **v1.49.85:** GPO + GPG identified as a "natural compute pair" for the GPU domain
- **v1.49.112:** VKS (Vulkan Screensaver) documented as research, not code
- **v1.49.113:** CHS shader fitness explored but not connected to data pipeline
- **MPC Math Co-Processor:** 125 tests, 5 chips, CUDA stream isolation -- the most complete piece
- **Local hardware:** RTX 4060 Ti (8GB), i7-6700K, 60GB RAM -- capable of running the pipeline

### Impact Assessment

The GPU pipeline thesis is the project's most ambitious technical claim. Without a working demonstration, it remains a collection of well-researched components that have not been composed. The Amiga Principle -- "simple primitives faithfully composed" -- is the stated design philosophy, yet the GPU primitives have not been composed into a running system. This is not a documentation gap; it is an engineering gap. The research is sufficient to build the pipeline; the build has not happened.

### Resolution Path

1. **Define one end-to-end demonstration.** Take the cross-reference graph (167 projects, ~500+ edges) as input data.
2. **Compute layout via MPC.** Use the math coprocessor's existing matrix operations to compute a force-directed graph layout on the GPU.
3. **Render via Vulkan/CUDA.** Display the graph as an interactive visualization or screensaver using the VKS architecture.
4. **Validate the pipeline.** The demonstration proves that research data -> GPU compute -> visual output works as a pipeline, not just as separate components.

### What v1.49.132 Addresses

This gap is documented and prioritized. The AAR does not attempt to build the pipeline -- it confirms the gap exists and provides the resolution path for a future GPU-focused milestone.

---

## GAP-5: Minecraft Simulation Not Running

**ID:** GAP-5
**Priority:** Medium
**Status:** Open -- research complete, simulation not built

### Misalignment Description

**Intended:** Minecraft as simulation engine is a stated project value. Notch's dedication appears in v1.49.101 as proof of the Amiga Principle. The project envisions voxel world-building as a medium for instantiating research data -- ecological zones, weather patterns, species distribution -- as playable content. MRW (Minecraft Weather) was identified as "the most literal Rosetta Stone translation in the series."

**What Exists:** MRW is a research project with documentation mapping NOAA weather to Minecraft biomes. MCR (Minecraft RAG) documents retrieval-augmented generation for Minecraft content. VAV (Voxel as Vessel) explores voxel serialization architecture. But none of these produce a running Minecraft mod, data pack, or command-block system. The Minecraft integration is research *about* Minecraft, not research *in* Minecraft.

### Evidence

- **v1.49.85:** "MRW bridges physical and virtual. Mapping real NOAA weather to Minecraft biomes is the most literal Rosetta Stone translation in the series."
- **v1.49.101:** Notch dedication -- "one developer, clear architecture, simple primitives faithfully composed = Minecraft"
- **MRW, MCR, VAV:** Three projects documenting Minecraft architecture without producing a running artifact

### Impact Assessment

The gap between "research about X" and "research in X" is the same gap the project identified in the DACP documentation (GAP-6): the most important ideas exist only in one medium when they should exist in the medium they describe. A Minecraft data pack that translates NOAA weather into biome modifications would be a more powerful demonstration of the Rosetta Stone framework than any markdown document, because it would prove the translation actually works at runtime.

### Resolution Path

1. **Build a Minecraft data pack.** Start with MRW's NOAA-to-biome mapping. A data pack that reads real weather data and adjusts in-game weather, time, or biome characteristics.
2. **Add ecological zones.** Use ECO, AVI, and MAM species data to populate biomes with appropriate mobs and vegetation patterns.
3. **Connect to the mesh.** Use the BRC federation model to allow multiple Minecraft servers to share state -- each server is a "regional burn" with shared schemas.
4. **Document as proof of concept.** The data pack itself is the Rosetta Stone translation: real-world data -> game-world instantiation.

### What v1.49.132 Addresses

This gap is documented. The AAR identifies the Minecraft simulation as a medium-priority item that would provide a uniquely powerful demonstration of the cross-domain translation thesis. Implementation requires a dedicated milestone with Minecraft modding expertise.

---

## GAP-6: DACP Not Publicly Documented

**ID:** GAP-6
**Priority:** High
**Status:** Open -- critical architectural concept without public specification

### Misalignment Description

**Intended:** DACP (Declarative Agent Coordination Protocol) is described in v1.49.105 as "the central architectural thesis of v1.49+." FidelityLevel 0-4 defines how agents coordinate, what information they share, and how trust boundaries are enforced. The bus opcodes, observation patterns, and blitter work all derive from DACP principles. It is the protocol that makes multi-agent orchestration deterministic rather than chaotic.

**What Exists:** DACP exists primarily in private conversation context. The SCR (Source Code Review) project is the closest existing public reference, but it is a research module, not a specification. Anyone cloning the repository encounters DACP references in skills, agents, chipsets, and hooks, but has no single canonical document explaining what DACP is, why FidelityLevel 0-4 matters, how bus opcodes work, or how it connects to the observation and blitter patterns. The architecture is legible only to participants in the private conversations where it was designed.

### Evidence

- **v1.49.105:** "The DACP fidelity model is the central architectural thesis of v1.49+, and understanding why FidelityLevel 0-4 exists requires knowledge that currently lives only in conversation context."
- **v1.49.105:** "The documentation delta is 25+ milestones wide (public docs frozen at v1.33, codebase at v1.49.21)"
- **SCR project:** Documents source code review patterns but does not serve as a DACP specification
- **Wasteland branch:** Contains DACP, observation, and blitter work but on a long-running integration branch, not in public documentation

### Impact Assessment

This is the project's most critical documentation gap. DACP is referenced everywhere but explained nowhere in public. The Gifting Principle -- "once cloned, it's theirs to reshape" -- requires that the thing being gifted is legible. A cloned repository with undocumented protocols is a gift with no instructions. The trust system, federation model, and agent orchestration all depend on DACP concepts that a new contributor cannot learn from the repository alone.

The 25+ milestone documentation delta compounds this: not only is DACP undocumented, but the documentation that does exist describes a system from v1.33 that has evolved significantly. The delta between the documented system and the actual system grows with every release.

### Resolution Path

1. **Write a canonical DACP specification.** At the level of an RFC: formal, complete, self-contained. Sections: Purpose, FidelityLevel 0-4 definitions, bus opcode catalog, observation protocol, blitter pattern, trust boundary enforcement, connection to Gastown chipset.
2. **Publish in docs/ or as a research project.** The spec should be committed to the public repository, not kept in .planning/ or conversation context.
3. **Close the documentation delta.** A dedicated documentation milestone to bring public docs from v1.33 to current state, with DACP spec as the centerpiece.
4. **Add a "Start Here" guide.** For new contributors who clone the repo, a document that explains the architectural concepts needed to understand the codebase.

### What v1.49.132 Addresses

The AAR identifies this as the highest-impact open gap. The resolution requires a dedicated documentation milestone, not a research project. The AAR provides the gap analysis; the DACP spec itself is future work.

---

## GAP-7: Content Filter Vulnerability at Scale

**ID:** GAP-7
**Priority:** High
**Status:** Partially addressed through operational learning; systematic fix not implemented

### Misalignment Description

**Intended:** The project's operating model is autonomous parallel execution at scale. The Gastown convoy model dispatches work to 4+ parallel agents who build research projects simultaneously. The v1.49.89 session delivered 49 projects in a single session. The architecture is optimized for throughput -- wave planning, parallel dispatch, sequential commit.

**What Exists:** Content filters disrupted 3+ builds in v1.49.86 and v1.49.89. DPM (Depeche Mode) and CAR (The Cars) were blocked mid-build in v1.49.86. Multiple projects in the 49-project v1.49.89 mega-batch hit content policy interrupts. The current recovery model is manual completion -- when an agent is blocked, the operator finishes the module directly. This works at the 4-agent scale but does not scale with throughput ambitions.

### Evidence

- **v1.49.86:** "Content filtering hit DPM and CAR. Two agents were blocked mid-build. Fallback: build modules directly. DPM's modules are shorter than average as a result -- could be enriched in a future pass."
- **v1.49.89:** "Content filter recovery: when agents hit filters, manual module completion was fast"
- **Operational pattern:** 3+ disruptions across two mega-batch sessions

### Impact Assessment

Content filter disruptions are a scaling concern, not a correctness concern. The manual recovery model works because the operator (Foxy) has deep domain knowledge and can complete any module. But the Gastown convoy model's value proposition is parallel autonomous execution -- manual intervention breaks the autonomy. As the series grows toward 200+ projects and the convoy model is applied to other domains, the frequency of content filter disruptions will increase proportionally.

The vulnerability is asymmetric: music projects (artist biographies, drug references, political content) and cultural projects (Indigenous knowledge, religious traditions) are more likely to trigger filters than technical projects (protocols, infrastructure). This means the most culturally significant research is the most likely to be disrupted.

### Resolution Path

1. **Pre-build topic sensitivity classification.** Before dispatching packs to agents, classify each pack's likely sensitivity on a 1-5 scale based on topic domain, known trigger patterns, and historical filter events.
2. **Route sensitive packs to a dedicated queue.** A "careful build" queue with explicit fallback instructions pre-written. The agent receives the pack with notes: "This topic may trigger content filters. If blocked on module N, skip to module N+1 and mark for manual completion."
3. **Pre-write fallback module stubs.** For high-sensitivity packs, write module headers and section structures before dispatching. If the agent is blocked, the operator fills in content from a structured template rather than starting from scratch.
4. **Track filter events as data.** Log which projects, modules, and topic keywords trigger filters. Build a sensitivity model over time that improves classification accuracy.
5. **Enrichment passes for short modules.** Schedule periodic enrichment waves that revisit modules shortened by content filter interruptions (DPM, CAR, others) and bring them to full depth.

### What v1.49.132 Addresses

The AAR documents the pattern and provides the classification framework. The operational learning -- "manual completion was fast" -- is proven but does not scale. The systematic fix (pre-build classification, dedicated queue, fallback stubs) is documented as a resolution path for implementation in a future convoy-focused milestone.

---

## Gap Priority Matrix

| ID | Gap | Priority | Status | Effort | Impact |
|----|-----|----------|--------|--------|--------|
| GAP-1 | Cross-Reference Automation | Critical | Partial | High | Highest -- core thesis depends on it |
| GAP-2 | College of Knowledge Wiring | High | Open | Medium | High -- curriculum navigation blocked |
| GAP-3 | PNW vs. Global Scope | Low | Resolved | Low | None -- intentional design decision |
| GAP-4 | GPU Pipeline End-to-End | Medium | Open | High | Medium -- technical demonstration |
| GAP-5 | Minecraft Simulation | Medium | Open | Medium | Medium -- proof of concept |
| GAP-6 | DACP Public Documentation | High | Open | Medium | High -- legibility for contributors |
| GAP-7 | Content Filter at Scale | High | Partial | Medium | High -- operational scaling |

---

## Resolution Timeline

### Addressed by v1.49.132 (This Release)
- **GAP-1:** Cross-reference index framework established in Wave 1
- **GAP-3:** Reclassified as intentional scope boundary, documented
- **GAP-7:** Pattern documented, classification framework provided

### Requires Dedicated Milestone
- **GAP-2:** College wiring milestone -- estimated 2-3 phases
- **GAP-6:** DACP specification milestone -- estimated 1-2 phases plus documentation delta closure

### Requires Technical Implementation
- **GAP-4:** GPU pipeline demonstration -- estimated 3-5 phases, depends on MPC integration
- **GAP-5:** Minecraft data pack -- estimated 2-3 phases, depends on modding environment setup

### Recommended Execution Order
1. **GAP-6** (DACP spec) -- unblocks contributor onboarding
2. **GAP-1** (cross-reference automation) -- unblocks Rosetta Stone framework at module level
3. **GAP-2** (College wiring) -- depends on cross-reference infrastructure from GAP-1
4. **GAP-7** (content filter system) -- improves operational throughput for all future work
5. **GAP-4** (GPU pipeline) -- technical demonstration, depends on MPC readiness
6. **GAP-5** (Minecraft simulation) -- proof of concept, independent of other gaps

---

*Part of the Architecture Alignment and Refinement (AAR) project, v1.49.132. Generated from analysis of 40 release notes spanning v1.49.82-131. Gap identification methodology: systematic comparison of stated architectural intent (from release "What Worked" and "Lessons Learned" sections) against observed implementation state (from repository structure and code analysis).*
