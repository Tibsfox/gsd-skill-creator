# PLM & ERP Systems: Enterprise Data Backbone Patterns in Agent Orchestration

**Catalog:** OAA-PES | **Cluster:** Operations & Admin Automation
**Date:** 2026-04-05 | **Sources:** YouTube transcript analysis (TheFutureOfPLM, Manufacturing Hub Podcast)
**College:** Business Administration, Information Systems, Supply Chain Management

## Abstract

Product Lifecycle Management (PLM) and Enterprise Resource Planning (ERP) systems are the twin pillars of enterprise operations software. PLM manages what a product IS (design data, bills of materials, engineering change orders), while ERP manages what a business DOES (finance, procurement, logistics, HR). Together they form the backbone of manufacturing operations -- a role that maps directly to GSD's Gastown chipset managing what agents work on and how resources flow. This page synthesizes insights from four YouTube transcripts covering cloud-native PLM (Duro, First Resonance), agentic PLM (Propel), ERP fundamentals (Manufacturing Hub), and data strategy for digital transformation, then maps every major concept to GSD's orchestration layer.

## Source Material

### Transcript 1: Next-Gen PLM and MES (Duro & First Resonance)
- **Video:** "AI Across the Product Life Cycle" podcast, ~51 minutes
- **Speakers:** Michael Core (CEO, Duro -- cloud/AI native PLM), Karan Talati (CEO, First Resonance -- factory operating system, ex-SpaceX)
- **Core thesis:** Hardware development is adopting software development practices. API-first, cloud-native PLM replaces monolithic on-premise systems. The "digital thread" connects design through manufacturing.

### Transcript 2: Propel's Agentic PLM
- **Video:** "AI Across the Product Life Cycle" podcast, ~57 minutes
- **Speakers:** Ross Meerord (CEO, Propel -- ex-Accenture PLM implementer, ex-Salesforce CIO), Kishor Subramanian (CTO, Propel -- ex-Google, built Agile Software's web client pre-Oracle acquisition)
- **Core thesis:** PLM is entering its "agentic" phase. Just as web clients replaced desktop clients in the 2000s, AI agents are now replacing manual PLM workflows. Propel is Salesforce-native, treating product records as first-class CRM objects.

### Transcript 3: ERP Systems Explained
- **Video:** Manufacturing Hub Podcast, ~5 minutes
- **Core thesis:** ERP is a 4-decade-old software category (IBM 1960s, SAP 1970s) covering HR, finance, and supply chain. Three triggers drive ERP replacement: cloud migration pressure, rapid growth, and accumulated technical debt.

### Transcript 4: Data Strategy & Governance in ERP
- **Video:** Manufacturing Hub Podcast, ~4 minutes
- **Core thesis:** Successful ERP/digital transformation requires a "what problems are worth solving" exercise BEFORE technology selection. Design thinking, benefit-difficulty ranking, and data prioritization drive ROI.

## PLM Core Concepts

### What PLM Manages

PLM systems are the authoritative record for everything about a product:

- **Product structure** -- hierarchical bill of materials (BOM) defining assemblies, sub-assemblies, and components
- **Design data** -- CAD files, specifications, test results, simulation outputs
- **Change management** -- engineering change orders (ECOs) with approval workflows
- **Configuration** -- which variant of which part goes in which product revision
- **Release process** -- gate-based transitions from draft to prototype to production
- **Digital thread** -- end-to-end traceability from requirement through design, manufacturing, test, and service

### GSD Concept Mapping

| PLM Concept | GSD Implementation | How It Works |
|---|---|---|
| Bill of Materials (BOM) | Convoy manifest | Hierarchical list of work items with dependencies and requirements |
| Product Record | Beads-state | Canonical, versioned state object for a work artifact |
| Engineering Change Order | State mutation + event-log entry | Auditable change to the authoritative record, tracked in JSONL |
| Approval Gate | Mayor-coordinator checkpoints | Work items must pass validation before downstream items can start |
| Configuration Management | Convoy variants | Different convoy configurations for different execution contexts |
| Release Process | Publish-pipeline skill | Gated transition from draft to review to published |
| Digital Thread | Convoy execution trace | End-to-end log of every decision, mutation, and output |
| Revision History | Git-friendly sorted JSON + event-log | Full version history accessible via git blame/log |

### The "Digital Thread" Pattern

Duro's Michael Core describes their vision as establishing "that digital thread across all the different data resources, the inputs and the outputs that are needed to manufacture a product." First Resonance's Karan Talati (ex-SpaceX) describes building a "factory operating system" connecting traditionally disconnected operations.

This is precisely what the GSD event-log provides for agent orchestration. Every action by every agent in a convoy is append-only logged with timestamp, agent ID, action type, and state reference. You can trace any output back through the full chain of decisions that produced it -- the same traceability that aerospace PLM demands.

## ERP Core Concepts

### What ERP Manages

As the Manufacturing Hub transcript explains, ERP is "a class of software been around for a really long time -- four decades maybe." Its core modules:

- **Finance** -- general ledger, accounts payable/receivable, budgeting
- **Human Resources** -- workforce management, payroll, scheduling
- **Supply Chain** -- procurement, inventory, logistics, warehouse management
- **Production** -- manufacturing execution, quality management, capacity planning
- **Sales** -- order management, CRM integration, demand forecasting

### GSD Concept Mapping

| ERP Module | GSD Equivalent | Function |
|---|---|---|
| Financial Controls | Token-budget enforcement | Per-agent and per-convoy spending caps, 80% warning thresholds |
| Procurement | Sling-dispatch routing | Route work items to capable, available agents |
| Inventory | Beads-state snapshots | Track available resources, consumed tokens, pending work |
| Production Planning | Convoy dependency graph | Sequence work items based on prerequisites and resource availability |
| Quality Management | Harness integrity checks | Validate outputs against expected schemas and invariants |
| Workforce Management | GUPP propulsion | Assign agents (workers) to tasks based on capability matching |
| Audit & Compliance | Event-log (JSONL, append-only) | Immutable record of every operation for compliance review |

### ERP Replacement Triggers

The Manufacturing Hub transcript identifies three catalysts that drive organizations to replace their ERP:

1. **Cloud migration** -- external pressure to move from on-premise to cloud (the "external catalyst")
2. **Rapid growth** -- small company scaling rapidly needs systems that scale with them
3. **Technical debt** -- "been on this thing for a decade, built up a bunch of customization, I'm losing staff"

These same triggers apply to agent orchestration systems:
1. **Architecture migration** -- moving from ad-hoc scripts to structured chipset
2. **Scale requirements** -- growing from 3 agents to 50+ projects demands formal coordination
3. **Maintenance burden** -- accumulated workarounds in manual processes become unsustainable

## The Agentic PLM Revolution

### From Desktop to Web to Agents

Propel's CTO Kishor Subramanian provides a first-hand account of PLM's platform shifts. He built Agile Software's web client (1999-2006) which was "supposed to be a lightweight client" but "became eventually the main and the only way to actually access agile." The same pattern is now playing out with AI:

**Platform shift 1 (2000s):** Desktop (Java/Windows) client -> Web client
**Platform shift 2 (2020s):** Web client -> AI agent interface

Propel's CEO Ross Meerord draws the explicit parallel: "pretty much like what we are going through now with the AI era."

### GSD as Agentic PLM

The GSD Gastown chipset IS an agentic PLM system -- it just manages agent artifacts instead of physical products:

- **Product = Research page or code artifact** -- the thing being "manufactured"
- **BOM = Convoy manifest** -- the list of components (work items) needed to produce it
- **Factory floor = Agent execution environment** -- where work actually happens
- **MES (Manufacturing Execution System) = Mayor-coordinator** -- real-time orchestration of work on the floor
- **Quality station = Harness integrity + verification skills** -- validate outputs before release
- **Warehouse = Git repository** -- where finished goods (committed artifacts) are stored

## Data Strategy: The Foundation

### "What Problems Are Worth Solving"

The ERP data strategy transcript advocates design thinking as the first step:

1. Run executive workshops to identify pain points
2. Frame as "what problems are worth solving" exercise
3. Rank by benefit vs. difficulty to implement
4. Prioritize data -- identify what is "super useful and absolutely mission critical"
5. Build data strategy BEFORE selecting technology

### GSD Equivalent

The GSD project structure embodies this exact methodology:
1. `.planning/REQUIREMENTS.md` -- identifies problems worth solving
2. `.planning/ROADMAP.md` -- ranks by priority and dependency
3. `.planning/STATE.md` -- tracks what's mission critical NOW
4. `KNOWLEDGE.md` -- the data strategy (what context agents need)
5. Skills and chipset -- technology selected AFTER requirements are clear

## Study Guide Topics

### PLM Fundamentals
1. What is a Bill of Materials (BOM) and why is hierarchical decomposition important?
2. How does an Engineering Change Order (ECO) differ from a simple file edit?
3. What is the "digital thread" and why does aerospace mandate it?
4. How does configuration management handle product variants?
5. What gates exist in a typical PLM release process?

### ERP Fundamentals
6. What are the core modules of an ERP system and how do they interconnect?
7. Why has ERP persisted for 4+ decades while other enterprise software categories rise and fall?
8. What triggers an organization to replace their ERP?
9. How does data strategy relate to ERP ROI?
10. What is the relationship between ERP and MES (Manufacturing Execution System)?

### Architecture Patterns
11. How does cloud-native PLM differ architecturally from on-premise PLM?
12. What does "API-first" mean in the context of PLM and why does it matter?
13. How does the Salesforce platform shape Propel's PLM architecture?
14. What are the trade-offs between PLM-centric and ERP-centric product data management?
15. How do GSD's git-friendly JSON files compare to relational PLM databases?

## DIY Try Sessions

### Session 1: Map Your Own BOM
Take any complex artifact you've built (a research page, a software feature, a hardware project). Decompose it into a hierarchical BOM:
- Level 0: The finished artifact
- Level 1: Major assemblies (sections, modules, subsystems)
- Level 2: Sub-assemblies (paragraphs, functions, components)
- Level 3: Raw materials (sources, APIs, parts)

Now trace how a change at Level 3 propagates up through the hierarchy. This is exactly what PLM change management automates.

### Session 2: Design Your ERP Modules
For any organization you're part of (company, team, club), identify which ERP modules would apply:
- Who handles "finance" (resource allocation)?
- Who handles "procurement" (getting what you need)?
- Who handles "production" (making the thing)?
- Who handles "quality" (ensuring it's right)?
- Where does the audit trail live?

### Session 3: Agentic Workflow Design
Design an agent workflow that replaces a manual PLM process:
- Pick a change management scenario (e.g., updating a specification)
- Define the approval gates (who reviews, what criteria)
- Define the notification flow (who gets told when)
- Define the rollback procedure (what happens if rejected)
- Compare your design to GSD's mayor-coordinator + event-log pattern

## Cross-Reference Map

| This Page Concept | Also Appears In | Connection |
|---|---|---|
| BOM as dependency graph | OAA-CWO (Convoy Orchestration) | Convoy manifests ARE bills of materials for agent work |
| Change management | OAA-DPA (Document Pipelines) | Sweep daemon handles "engineering changes" to published content |
| Audit trail | OAA-MTC (Task Coordination) | Event-log is the shared audit mechanism across all OAA pages |
| Resource planning | OAA-MTC (Task Coordination) | Token-budget IS financial control / resource planning |
| Release gates | OAA-DPA (Document Pipelines) | Publish-pipeline implements release gating |
| Digital thread | OAA-CWO (Convoy Orchestration) | Convoy execution trace IS the digital thread |

## Industry Tools Referenced

- **Duro** -- Cloud/AI native PLM, API-first, hardware development focus
- **First Resonance** -- Factory operating system, ex-SpaceX pedigree, MES focus
- **Propel** -- Salesforce-native PLM, agentic AI features, ex-Agile Software lineage
- **SAP** -- Dominant ERP vendor (since 1972), S/4HANA cloud migration wave
- **Oracle** -- Acquired Agile Software (PLM), JD Edwards, PeopleSoft (ERP)
- **PTC Windchill** -- Enterprise PLM, Metaphase lineage, aerospace/defense
- **Accenture** -- Systems integrator for PLM/ERP implementations

## Key Takeaways

1. **PLM and ERP are workflow engines** with domain-specific vocabulary. The underlying patterns (state management, change tracking, approval routing, audit logging) are universal.

2. **Cloud-native is table stakes.** Every new PLM/ERP entrant is cloud-native and API-first. On-premise systems are being migrated or replaced.

3. **The agentic shift is real.** PLM vendors are adding AI agent interfaces the same way they added web interfaces in the 2000s. The pattern repeats.

4. **Data strategy precedes technology.** The most successful transformations start with "what problems are worth solving," not "which vendor should we pick."

5. **GSD's chipset IS a lightweight PLM/ERP** for agent work. Every major concept maps. This is not a metaphor -- it's a structural isomorphism.
