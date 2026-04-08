---
id: M2-system-architecture-design
title: "Module 2: System Architecture and Design"
type: reference
owner: Systems Engineering Mission (SYE)
lifecycle_state: Published
review_cadence: Annual
audience: [systems_engineer, architect, program_manager, mbse_practitioner, senior_engineer]
framework_refs: [dodaf-2.02, togaf-10, modaf, uaf-1.2, naf-4, sysml-2.0, iso-15288, iso-42010]
scope: "Functional and physical decomposition, architecture frameworks, and model-based systems engineering practice across aerospace and defense programs"
purpose: "Establish the concepts, frameworks, methodologies, and tooling that underpin modern system architecture work, with particular emphasis on the transition from document-based to model-based systems engineering"
version: "1.0"
last_reviewed: "2026-04-08"
next_review: "2027-04-08"
---

# Module 2: System Architecture and Design

## Table of Contents

1. [Introduction](#1-introduction)
2. [Functional Decomposition](#2-functional-decomposition)
3. [Logical Versus Physical Architecture](#3-logical-versus-physical-architecture)
4. [Architecture Frameworks](#4-architecture-frameworks)
5. [Model-Based Systems Engineering](#5-model-based-systems-engineering)
6. [SysML v1.6 and v2](#6-sysml-v16-and-v2)
7. [Arcadia and Capella](#7-arcadia-and-capella)
8. [Commercial MBSE Tooling](#8-commercial-mbse-tooling)
9. [Architecture Views, Viewpoints, and the 4+1 Model](#9-architecture-views-viewpoints-and-the-41-model)
10. [Reference Architectures and ADLs](#10-reference-architectures-and-adls)
11. [Architecture Trade-Off Analysis](#11-architecture-trade-off-analysis)
12. [Real-World Case Studies](#12-real-world-case-studies)
13. [Source Index and Citations](#13-source-index-and-citations)

---

## 1. Introduction

System architecture is the discipline of deciding what a system is made of, how those parts behave, how they relate to one another, and how the whole assembly satisfies the needs it was commissioned to meet. It sits between requirements engineering — where stakeholder needs are captured and formalized — and detailed design, where components are specified for fabrication, procurement, or coding. An architecture that is clear, internally consistent, and traceable to requirements gives the program a backbone. An architecture that is muddled, informal, or undocumented costs years of rework, and in the extreme it costs missions, payloads, and lives.

This module covers the intellectual toolkit that architects use to produce defensible architectures at scale. It begins with the oldest and most enduring tool, functional decomposition, and works forward through the formal frameworks that governments and standards bodies have produced over the last thirty years. It explains the difference between logical and physical architecture — a distinction that is easy to articulate and notoriously hard to maintain under program pressure — and it surveys the model-based systems engineering (MBSE) movement that has reshaped large-program practice since the mid-2000s. Particular attention is paid to SysML, the Arcadia methodology and its Capella tool, and the commercial MBSE platforms that dominate aerospace and defense programs today.

The goal is not to advocate for any single framework or tool. The goal is to give the practitioner a vocabulary and a decision framework rich enough to understand what is being proposed, why, and what the alternatives are. Architecture work is irreducibly judgmental: two competent architects given the same requirements will produce different but defensible architectures, and the frameworks discussed here do not eliminate that judgment — they discipline it.

**Who should read this module:**

- Systems engineers transitioning from detailed design into architecture roles
- Program managers evaluating whether an MBSE transition is worth its cost
- Architects choosing between DoDAF, TOGAF, UAF, NAF, and MODAF for a new program
- Practitioners evaluating Capella, Cameo, or SysML v2 tooling
- Senior engineers onboarding into defense or aerospace programs with model-based deliverables

**What this module does not cover:**

- Software architecture patterns for pure-software systems (covered separately in software engineering literature)
- Detailed requirements engineering methods (Module 1 of the SYE series)
- Verification and validation planning (subsequent SYE modules)
- Program management and lifecycle governance (separate mission scope)

---

## 2. Functional Decomposition

Functional decomposition is the practice of breaking a system's top-level function into progressively smaller sub-functions until each sub-function is small enough to allocate to a single component or process. It is the oldest and most widely taught technique in systems engineering, and every formal architecture framework ultimately rests on it. The output of a decomposition exercise is a hierarchical tree in which each node names an action — not a thing. "Maintain cabin pressure" is a function; "pressure regulator" is a thing. The distinction matters because the same function can be satisfied by many different physical implementations, and early commitment to an implementation closes off design space the architect may later wish they had kept open.

### 2.1 Top-Down Decomposition

The top-down approach begins with a single root node representing the entire system mission and asks repeatedly: what must be done to achieve this? Each answer becomes a child node. Decomposition stops when each leaf function can be characterized by a clear input, a clear output, and a set of behavioral constraints — typically when the function is small enough that one team can own it end to end. NASA's *Systems Engineering Handbook* (NASA/SP-2016-6105 Rev 2) recommends between three and seven levels of decomposition for most aerospace systems, with deeper trees triggering a review of whether the architect is decomposing the problem or inadvertently decomposing a pre-imagined solution.

The discipline is harder than it looks. A common failure mode is the "solution trap," in which the architect names a physical component at an intermediate level and then decomposes *its* functions rather than the mission's functions. Once that happens, the downstream allocation is locked in by accident, and genuinely different architectural alternatives — which might have shared no components with the trap solution — are never considered. Senior systems engineers guard against this by keeping the functional tree purely verb-phrased for as many levels as possible and separately maintaining a candidate physical architecture that is allocated to the functional tree only after it has stabilized.

### 2.2 Functional Flow Block Diagrams

A Functional Flow Block Diagram (FFBD) complements the hierarchy by showing the *sequence* in which functions execute. Each function is drawn as a box; boxes are connected by directed arrows representing the normal flow of control; AND-gates and OR-gates represent concurrency and alternation. Reference numbers on each box tie the FFBD back to the decomposition tree. FFBDs originated in the U.S. missile and aerospace programs of the 1950s and 1960s — TRW, Lockheed, and the Air Force BMD programs formalized them — and they remain a staple of systems engineering because they are the cheapest way to expose timing and sequencing issues before they are baked into hardware or software.

An FFBD does not show data flow, resource allocation, or physical interconnection. It shows only the order in which things happen. That narrow focus is a feature: by deliberately omitting other concerns, the FFBD forces the architect to think about sequencing in isolation. A separate N² chart, interface diagram, or data flow diagram addresses the other concerns.

### 2.3 IDEF0

IDEF0 (Integration DEFinition for Function Modeling) is a formal functional modeling language standardized as U.S. Federal Information Processing Standard 183 in 1993 and later published by the IEEE as IEEE 1320.1. Each function in an IDEF0 model is drawn as a box with four sides carrying strictly defined semantics: inputs enter from the left, outputs exit to the right, controls (constraints or triggers) enter from the top, and mechanisms (resources or actors that perform the function) enter from the bottom. The acronym ICOM — Inputs, Controls, Outputs, Mechanisms — captures the convention. Functions can be hierarchically decomposed, with a parent-child relationship maintained by careful labeling.

IDEF0 is stricter than FFBD and richer than a plain decomposition tree because the ICOM arrows make the constraints and resources visible alongside the function itself. Its rigor is also its drawback: IDEF0 models can become dense and hard to read at scale, and the notation has lost ground to UML-derived and SysML-derived activity diagrams in modern practice. It remains in use in NASA programs, in defense acquisition where legacy FIPS 183 deliverables are still specified, and in manufacturing process engineering where its straightforward semantics match factory-floor thinking.

---

## 3. Logical Versus Physical Architecture

The distinction between logical and physical architecture is one of the few concepts in systems engineering that every framework agrees on, even when they use different names for it. The logical architecture describes *what the system does* in terms of abstract components and their relationships, without committing to specific hardware, software platforms, vendors, or deployment topology. The physical architecture describes *how the system is built* — which box runs which function, what bus carries which signal, which chassis houses which board, which subcontractor supplies which assembly.

### 3.1 Why Separate Them

The separation exists because the rate of change differs. Logical architectures are stable across decades: the logical architecture of an air-traffic-control system today is recognizably similar to the one designed in the 1970s, even though the physical implementation has moved from vacuum tubes to transistors to microprocessors to virtualized cloud clusters. If the program had tied its specifications to 1970s-era physical components, it would have had to rewrite every requirement at each technology refresh. By capturing intent at the logical level and treating physical allocation as a separate artifact, the program preserves its intellectual investment across technology generations.

A second reason is that tradespace exploration happens mostly at the logical-to-physical boundary. Given a stable logical architecture, the architect can enumerate alternative physical allocations — centralized versus distributed compute, redundant versus non-redundant power, wired versus wireless buses — and evaluate each one against cost, mass, power, reliability, and schedule. This kind of comparison is only meaningful if the logical architecture is held fixed while the physical alternatives are varied.

### 3.2 The Allocation Problem

Allocation is the process of mapping logical components onto physical components. A logical function may be implemented by one physical component, by many physical components collaborating, or by several physical components each implementing a portion of the function. The mapping is rarely one-to-one, and the bookkeeping — which logical function is implemented by which physical component, and with what performance margin — is one of the most labor-intensive parts of systems engineering.

In document-based practice, allocation is tracked in spreadsheets and traceability matrices. In MBSE practice, allocation is represented by explicit model relationships (SysML has an `allocate` stereotype for exactly this purpose), which can be automatically traversed to produce reports, impact analyses, and coverage matrices. The MBSE approach scales much better than the spreadsheet approach once the system exceeds a few hundred logical functions, which is roughly the point at which a program running on spreadsheets starts losing coverage information to merge conflicts and copy-paste drift.

### 3.3 Arcadia's Answer

The Arcadia methodology, discussed in detail in section 7, makes logical-to-physical separation central to its process. Arcadia prescribes four distinct perspectives — Operational Analysis, System Analysis, Logical Architecture, and Physical Architecture — and requires that each be fully characterized before the next is derived. The allocation from Logical Architecture to Physical Architecture is treated as a first-class modeling activity with its own artifacts and review gates. This structural enforcement is Arcadia's main contribution over more permissive frameworks that merely acknowledge the distinction without enforcing it.

---

## 4. Architecture Frameworks

An architecture framework is a prescriptive structure for organizing the many diagrams, matrices, and documents that describe a system. Frameworks specify the viewpoints an architecture should cover, the models that belong in each viewpoint, and the relationships between models. The frameworks discussed below cover roughly 90 percent of government and large-defense architecture practice worldwide.

### 4.1 DoDAF 2.02

The Department of Defense Architecture Framework, currently at version 2.02 (with Change 1 issued in January 2015), is the U.S. Department of Defense's standard for enterprise and system-of-systems architecture. DoDAF 2.02 organizes its content into **eight viewpoints** containing **52 models**, a structure mandated for all DoD capability development and acquisition programs of meaningful size. The eight viewpoints are:

1. **All Viewpoint (AV)** — overview and summary information, including AV-1 (overview and summary) and AV-2 (integrated dictionary)
2. **Capability Viewpoint (CV)** — capability taxonomy, dependencies, phasing, and roadmaps
3. **Data and Information Viewpoint (DIV)** — conceptual, logical, and physical data models
4. **Operational Viewpoint (OV)** — operational nodes, activities, and information exchanges
5. **Project Viewpoint (PV)** — project portfolio, timelines, and dependencies
6. **Services Viewpoint (SvcV)** — services, their interactions, and performance
7. **Standards Viewpoint (StdV)** — applicable technical and operational standards
8. **Systems Viewpoint (SV)** — systems, their functions, and their connectivity

The DoD CIO's published DoDAF 2.02 specification names 52 distinct models distributed across these viewpoints — for example, OV-1 "High-Level Operational Concept Graphic," SV-1 "Systems Interface Description," and StdV-1 "Standards Profile." Programs are not required to produce all 52 models; the fit-for-purpose principle built into DoDAF 2.02 directs architects to produce only the models their program actually needs and to justify their selection in the AV-1 overview. The shift to "fit-for-purpose" was the defining change from DoDAF 1.5 to 2.0, along with the renaming of "views" to "viewpoints" to align with IEEE 1471 (now ISO/IEC/IEEE 42010) terminology.

### 4.2 TOGAF 10

The Open Group Architecture Framework (TOGAF) is the civilian-enterprise counterpart to DoDAF. Where DoDAF is descriptive — it tells you what artifacts to produce — TOGAF is procedural: it tells you how to work through an architecture engagement from kickoff to governance. The core of TOGAF is the **Architecture Development Method (ADM)**, an iterative cycle with nine phases:

- **Preliminary Phase** — establishing the architecture capability
- **Phase A** — Architecture Vision
- **Phase B** — Business Architecture
- **Phase C** — Information Systems Architectures (Data and Application)
- **Phase D** — Technology Architecture
- **Phase E** — Opportunities and Solutions
- **Phase F** — Migration Planning
- **Phase G** — Implementation Governance
- **Phase H** — Architecture Change Management

A tenth element, Requirements Management, sits at the center of the cycle and feeds every phase. The Open Group released TOGAF 10 on 25 April 2022 and has continued updating its companion documents — including the *Architecture Development Method* practitioner's guide — with 2025 updates published by Van Haren on behalf of The Open Group. TOGAF is widely used in financial services, telecommunications, and large civilian-government IT, and its certification program has produced more practitioners than any other single architecture credential.

### 4.3 MODAF

The Ministry of Defence Architecture Framework (MODAF) was the United Kingdom's equivalent of DoDAF, developed jointly with U.S. DoDAF authors so the two frameworks would share most concepts. MODAF v1.2.004, published in 2010, was the final standalone release. The U.K. MoD and NATO subsequently migrated their architecture work to UAF and NAF respectively, and MODAF is no longer actively maintained as an independent standard — though legacy MODAF deliverables remain in production at long-running U.K. defense programs and the vocabulary is still in use.

### 4.4 UAF 1.2

The Unified Architecture Framework (UAF) is an OMG-published standard that consolidates DoDAF, MODAF, and NAF into a single modeling-friendly framework. UAF is explicitly built on UML and SysML, via the Unified Profile for DoDAF and MODAF (UPDM), which preceded it. UAF 1.2 was published by OMG in 2022 and UAF 1.3 is the current released version as of 2025. UAF's central insight is that 90 percent of the concepts in the military frameworks — actors, capabilities, activities, resources, services — apply equally to commercial enterprises, so the framework is deliberately written to serve both audiences.

UAF organizes its content along two axes: a set of **Domains** (Strategic, Operational, Services, Personnel, Resources, Security, Projects, Standards, and Actual Resources) crossed with a set of **Model Kinds** (Taxonomy, Structure, Connectivity, Processes, States, Interaction Scenarios, Information, Parameters, Constraints, Roadmap, Traceability, Summary & Overview, Dictionary). The grid produces a matrix of views that can be filtered for a specific program's needs. Tool support for UAF is widely available — Cameo Systems Modeler and Sparx Enterprise Architect both ship UAF profiles — and the framework is the de facto successor to DoDAF for new programs that want model-based deliverables.

### 4.5 NAF 4

The NATO Architecture Framework (NAF) is NATO's equivalent of DoDAF for coalition and alliance work. NAF version 4 was released in January 2020 and aligned with UAF; in practice, NAF 4 and UAF are interoperable, and many NATO programs can produce either set of deliverables from a single underlying model. NAF's contribution is the coalition-oriented viewpoints that address cross-national interoperability, multinational capability development, and shared mission command systems — concerns that DoDAF and MODAF address only implicitly.

### 4.6 Framework Comparison

| Framework | Owner | Current Version | Primary Audience | Structure | Tool Neutrality |
|-----------|-------|------------------|-------------------|-----------|-----------------|
| DoDAF 2.02 | U.S. DoD CIO | 2.02 Change 1 (2015) | U.S. defense programs | 8 viewpoints, 52 models | Tool neutral (text specification) |
| TOGAF 10 | The Open Group | 10th Edition (2022, updated 2025) | Enterprise IT, civilian government | ADM 9-phase cycle + content framework | Tool neutral |
| MODAF | U.K. MoD | 1.2.004 (2010, legacy) | U.K. defense (legacy only) | 7 viewpoints | Legacy, superseded by UAF |
| UAF | OMG | 1.3 (2025) | Defense + commercial enterprise | Domains × Model Kinds matrix | UML/SysML profile (requires tool) |
| NAF | NATO | 4 (2020) | NATO and coalition programs | Aligned with UAF | UML/SysML profile |

---

## 5. Model-Based Systems Engineering

Model-Based Systems Engineering (MBSE) is the practice of treating a central, machine-readable model of the system as the authoritative source of engineering truth, with documents generated from the model rather than written independently. INCOSE's *Systems Engineering Vision 2020* formally introduced the term and defined it as "the formalized application of modeling to support system requirements, design, analysis, verification, and validation activities beginning in the conceptual design phase and continuing throughout development and later life cycle phases."

The shift matters because document-based practice has well-known failure modes. Documents drift out of sync with each other; a single requirement change triggers editorial sweeps through dozens of related documents; traceability is maintained by hand in brittle spreadsheets; and the semantic content of the design lives in the minds of the senior engineers rather than in any artifact a new hire can read. MBSE addresses each of these by moving the authoritative representation into a single model that can be queried, validated, and used to generate whatever documents a stakeholder needs in whatever format they need them.

### 5.1 The Shift from Document-Based to Model-Based

The shift is not free. An MBSE transition typically requires two to three years of investment before a program sees net productivity gains, and roughly half of all attempted transitions stall before that payoff horizon. The reasons are well documented: tooling is expensive and has steep learning curves; existing engineers resist retraining on modeling languages they view as academic exercises; legacy documents cannot be automatically imported into a model without a translation effort of their own; and program managers tend to judge the transition by the first-year deliverables, which are always inferior to what document-based practice would have produced in the same period.

The programs that succeed in MBSE share a common profile: they have executive sponsorship that protects the transition budget through the first unprofitable year; they pick a single authoritative tool and stop arguing about tool choice; they retrain their most senior engineers first, because junior engineers will not adopt what the seniors dismiss; and they accept that the model, once populated, will become a load-bearing part of the engineering infrastructure that cannot be abandoned without catastrophic rework.

### 5.2 The Benefits When It Works

When the transition completes, the benefits are substantial and well-measured. A widely cited NASA Jet Propulsion Laboratory study of the Europa Clipper MBSE transition reported significant reductions in interface-definition defects caught in integration testing, because the model made inconsistencies visible at edit time rather than during integration. Similar reductions have been reported by Lockheed Martin on the F-35, by Northrop Grumman on the James Webb Space Telescope ground system, and by Airbus Defence and Space on the Orion European Service Module work. The common thread is that the model eliminates whole classes of defect — interface mismatches, missing requirement coverage, unallocated functions — that document-based practice can only catch by manual review.

---

## 6. SysML v1.6 and v2

The Systems Modeling Language (SysML) is the dominant modeling language for MBSE. It is maintained by the Object Management Group (OMG) and originated as a profile of the Unified Modeling Language (UML) tailored to the concerns of systems rather than software engineers. The current released versions as of 2026 are SysML v1.6 (the final v1 release, published in 2019) and SysML v2.0 (adopted by OMG on 21 July 2025 and formally published on 3 September 2025).

### 6.1 SysML v1 Diagram Taxonomy

SysML v1 defines nine diagram kinds, which together cover structure, behavior, requirements, and parametric constraints:

- **Block Definition Diagram (BDD)** — the structural hierarchy of blocks, analogous to a UML class diagram but with the terminology adapted for systems
- **Internal Block Diagram (IBD)** — the internal composition of a single block, showing its parts, ports, and connectors
- **Package Diagram** — organizational containers for model elements, used for namespace management
- **Parametric Diagram** — constraint expressions that bind values across blocks, enabling simulation and trade studies
- **Requirement Diagram** — requirements, their containment, and their traceability relationships (derive, satisfy, verify, refine)
- **Activity Diagram** — control and data flow, analogous to an FFBD with richer semantics
- **Sequence Diagram** — time-ordered message exchanges between lifelines
- **State Machine Diagram** — state transitions, entry and exit actions, and event handling
- **Use Case Diagram** — external actors and the use cases they trigger

The BDD and IBD together handle structure; the activity, sequence, and state machine diagrams together handle behavior; the requirement diagram handles traceability; and the parametric diagram handles analytic constraints. A well-constructed SysML v1 model uses all nine diagram kinds, because each exposes information the others cannot show clearly.

### 6.2 SysML v2

SysML v2 is a clean-sheet redesign rather than an incremental update. It is not a UML profile; it rests on a new foundational language called KerML (Kernel Modeling Language) specifically designed as a substrate for system and software modeling. The OMG adopted the SysML v2 specification on 21 July 2025 and published it as a formal standard on 3 September 2025, alongside KerML v1.0 and the Systems Modeling API and Services specification v1.0. The release includes four complementary documents: the SysML v2.0 Language Specification, a SysML v1-to-v2 Transformation Specification to help programs migrate existing models, the API and Services Specification that defines programmatic access to models, and the KerML v1.0 Specification.

Key improvements of SysML v2 over v1 include:

- **A textual notation alongside the graphical one**, so models can be edited in text editors and managed with standard version-control tools such as Git. This was the single most-requested feature from the community during the SysML v2 request-for-proposal period.
- **A formal semantic foundation** via KerML, which eliminates several ambiguities in SysML v1 that had forced tool vendors to adopt incompatible interpretations
- **A first-class API** that lets external tools read and write models programmatically without depending on any one vendor's proprietary format
- **Stronger support for variant modeling**, which matters for product-line engineering and for configuration management across mission variants
- **Improved interoperability with modern digital-engineering toolchains**, including cleaner integration paths to analysis tools, simulation environments, and requirements management systems

The adoption is significant enough that OMG described it as the largest revision of the language since its original 2006 release, and tool vendors have committed to implementing v2 support on roughly an eighteen-month horizon from the September 2025 publication.

---

## 7. Arcadia and Capella

Arcadia (ARChitecture Analysis and Design Integrated Approach) is a methodology developed by Thales between 2005 and 2010 through iteration with operational architects across Thales's defense, avionics, ground transportation, and space divisions. Since 2018 Arcadia has been registered as the AFNOR standard Z67-140, making it a recognized French national standard. It is the only widely used MBSE methodology that was developed inside a working engineering organization rather than in a standards body or academic setting, and that provenance shows in its process-level prescriptiveness.

### 7.1 The Arcadia Method

Arcadia prescribes four perspectives that must be worked in sequence, each producing a model that feeds the next:

1. **Operational Analysis** — what the users of the system need to accomplish, captured in terms of operational entities, capabilities, and activities. This perspective is system-agnostic and answers the question "what is the user trying to do?"
2. **System Analysis** — what the system must do to help the users accomplish their operational needs, captured as system functions, exchanges, and modes. This perspective treats the system as a black box and answers "what must the system do?"
3. **Logical Architecture** — how the system is logically organized into components that implement the system functions, without committing to physical realization. This perspective answers "how is the system structured internally, in principle?"
4. **Physical Architecture** — how the logical components are realized in hardware, software, deployment topology, and physical interfaces. This perspective answers "how is the system actually built?"

Each perspective is fully characterized and reviewed before the next is started. The methodology treats the transitions between perspectives as the high-value engineering activities — operational-to-system transition captures the mission the system is buying, system-to-logical transition captures the architect's key decisions, and logical-to-physical transition captures the allocation choices — and it demands explicit justification at each boundary.

### 7.2 Capella

Capella is the open-source MBSE workbench that implements Arcadia. It is an Eclipse Foundation project, distributed under the Eclipse Public License 2.0, and hosted at `eclipse.dev/capella`. Capella began as an internal Thales tool and was progressively open-sourced starting in 2013 under the PolarSys working group; it is now one of the most widely used open-source MBSE tools in Europe and has significant adoption in aerospace and defense programs worldwide.

Capella's design follows the Arcadia method directly — its perspectives, diagrams, and navigation mirror the methodology — so teams using Capella are essentially being prescribed the method by the tool. This tight coupling is controversial. Critics point out that it makes Capella unsuitable for teams that want to use a different methodology, and that it produces a lock-in to Arcadia specifically. Supporters respond that methodology-tool coupling is exactly what an MBSE workbench should provide, because the primary failure mode of general-purpose tools (SysML editors included) is that teams invent inconsistent methodologies on the fly. The debate continues in the INCOSE literature, and the practical answer is that Capella is the right choice for teams that can commit to Arcadia and a poor choice for teams that cannot.

Capella has native SysML interoperability via a bridge layer that can export selected model elements as SysML, and it has a growing set of add-ons for simulation, requirements exchange (ReqIF), and specialized domains such as functional safety analysis per ISO 26262.

---

## 8. Commercial MBSE Tooling

### 8.1 Cameo Systems Modeler (CATIA Magic Cyber Systems Engineer)

Cameo Systems Modeler, originally developed by No Magic, Inc. and now part of the Dassault Systèmes CATIA Magic product family following Dassault's 2018 acquisition of No Magic, is the dominant commercial MBSE tool in large defense and aerospace programs. It is built on the MagicDraw modeling platform and adds systems-engineering-specific plugins for SysML, UAF, and simulation. As of the 2024x release line, the No Magic product family has achieved ISO 26262-8 Tool Confidence Level 2 (TCL2) certification, which qualifies it for safety-critical automotive design — a certification that matters because TCL2 is the level required for most functional-safety work.

Cameo is the reference implementation tool for OMG's SysML and UAF specifications in many contexts, meaning that the language committees test SysML and UAF changes against Cameo's behavior before publishing them. That position gives Cameo unusually close alignment with the formal language standards and makes it the default choice for programs with heavy SysML or UAF deliverable requirements. Cameo's weakness is price — it is one of the most expensive MBSE tools on the market — and its learning curve, which is steep even for engineers experienced in UML or SysML.

### 8.2 MagicDraw

MagicDraw is the underlying modeling platform on which Cameo Systems Modeler, Cameo Enterprise Architecture, Cameo Business Modeler, and Cameo Concept Modeler are all built. It is a general-purpose UML, BPMN, and SysML editor that has been in continuous development since 1998. Dassault Systèmes has rebranded much of the No Magic product line under the CATIA Magic umbrella, but MagicDraw remains the foundation, and programs that already own MagicDraw licenses can add systems-engineering plugins to reach the full Cameo feature set.

### 8.3 Other Tools of Note

- **Sparx Systems Enterprise Architect** — a broad UML/SysML/BPMN/UAF tool that is significantly cheaper than Cameo and widely used in programs where cost is a stronger constraint than strict language conformance
- **IBM Rhapsody** — a systems and embedded-software modeling tool with strong simulation and code-generation capabilities, historically strong in automotive and aerospace embedded-software programs
- **Modelio** — an open-source UML/SysML/BPMN tool distributed by the Modelio Open Source project
- **Papyrus** — an Eclipse Foundation open-source UML and SysML tool that competes with Capella in the open-source segment

### 8.4 MBSE Tool Comparison

| Tool | Vendor | License | Primary Language | SysML v2 Plan | Strength | Weakness |
|------|--------|---------|-------------------|----------------|----------|----------|
| Cameo Systems Modeler | Dassault Systèmes (CATIA Magic) | Commercial | SysML v1.6, UAF | Committed, roadmap published | Reference implementation; UAF support | Price; learning curve |
| Capella | Eclipse Foundation (Thales origin) | EPL 2.0 (open source) | Arcadia (with SysML bridge) | Via bridge | Free; methodology-driven | Arcadia lock-in |
| Sparx Enterprise Architect | Sparx Systems | Commercial (low cost) | UML, SysML, UAF, BPMN | Committed | Affordable; broad language support | Less polished than Cameo |
| IBM Rhapsody | IBM | Commercial | SysML, UML | Committed | Simulation and code generation | Aging interface; complex licensing |
| Modelio | Modeliosoft / Softeam | Open core + commercial | UML, SysML, BPMN | Under evaluation | Open-source core | Smaller community |
| Papyrus | Eclipse Foundation | EPL (open source) | UML, SysML | Under development | Free and extensible | Less mature than Capella |

---

## 9. Architecture Views, Viewpoints, and the 4+1 Model

### 9.1 The View-Viewpoint Distinction

IEEE 1471, subsequently revised as ISO/IEC/IEEE 42010:2011 and again as ISO/IEC/IEEE 42010:2022, formalizes a distinction that every architecture framework now uses: a **viewpoint** is a specification for constructing a view, and a **view** is an actual artifact constructed according to a viewpoint. The viewpoint specifies what stakeholders the view serves, what concerns it addresses, what modeling conventions it uses, and what information it contains. The view is the concrete diagram or document that results when the viewpoint is applied to a specific system.

The distinction matters because it lets an architecture program decide up front — once — what viewpoints its stakeholders need, and then produce many views that all conform to those agreed viewpoints. Without the distinction, each diagram is an ad hoc artifact that may or may not address the concerns of any particular stakeholder, and the resulting documentation has gaps and overlaps that only become visible when stakeholders complain. DoDAF, TOGAF, UAF, and NAF all use ISO 42010-conformant view/viewpoint terminology.

### 9.2 The 4+1 View Model

Philippe Kruchten, then at Rational Software, published "The 4+1 View Model of Architecture" in IEEE Software in November 1995. It is the single most-cited architecture viewpoint scheme in the software engineering literature, and although it was written for software architecture it has influenced every systems-architecture framework since. The model proposes five views:

1. **Logical View** — the functional requirements, expressed as classes, objects, and their relationships. This is the view the functional users care about.
2. **Process View** — concurrency, distribution, and synchronization of executing processes. This is the view the performance and reliability engineers care about.
3. **Development View** — the static organization of the software in its development environment, including modules, packages, and build dependencies. This is the view the developers care about.
4. **Physical View** — the mapping of software onto hardware, including deployment nodes and their interconnections. This is the view the operations engineers care about.
5. **Scenarios (the "+1")** — use cases that animate the other four views and demonstrate how they work together. Scenarios are the cross-cutting validation that the four structural views are consistent.

Kruchten's contribution was not the individual views — each had been proposed elsewhere — but the explicit recognition that different stakeholders legitimately want different views of the same architecture, and that the architect's job is to produce all of them from a consistent underlying design. This principle is foundational to every MBSE tool, which stores a single model and generates multiple views from it on demand.

### 9.3 Operational, System, Technical, Physical, and Functional Views

Defense architecture frameworks use a different set of viewpoint names than Kruchten's, reflecting their different stakeholder concerns. DoDAF's and UAF's most commonly produced viewpoints are:

- **Operational View (OV)** — who the users are, what they do, and what information they exchange. Equivalent in purpose to Kruchten's logical view but oriented toward human operators rather than software objects.
- **Systems View (SV)** — what systems exist, what functions they perform, and how they interconnect. This is where the architecture becomes concrete in terms of named systems and their interfaces.
- **Technical (Standards) View (StdV / TV)** — what technical standards the systems conform to. This view is often overlooked but is critical for interoperability in multi-vendor or multi-national programs.
- **Physical View** — where systems are physically located, how they are powered, how they are cooled, and how their mass and volume budgets are allocated.
- **Functional View** — what functions the system performs, independent of which physical component performs them. This view is the logical architecture in the sense of section 3.

---

## 10. Reference Architectures and ADLs

### 10.1 Reference Architectures

A reference architecture is a pre-designed, reusable architecture for a class of systems. It captures the accumulated wisdom of the community about how systems of that class should be structured, including the components, interfaces, and patterns that have worked in past programs and the ones that have not. Examples include the Open Group's Reference Architecture for Cloud Computing, the Industrial Internet Reference Architecture from the Industrial Internet Consortium, and the NASA Space Communications and Navigation (SCaN) reference architecture for spacecraft communications.

Reference architectures save programs significant design effort by giving them a starting point that is already known to be defensible. They also standardize terminology across programs, which matters for cross-program interoperability and for re-use of components. Their downside is that reference architectures can be mistaken for mandatory architectures, and programs can end up constrained by reference architecture decisions that were appropriate for the general case but wrong for their specific situation. Good practice is to start from a reference architecture and deliberately document every deviation along with the justification.

### 10.2 Architecture Description Languages

An Architecture Description Language (ADL) is a formal notation for describing architectures. SysML is an ADL in this sense, as are the older academic ADLs Wright, Rapide, Acme, xADL, and AADL (Architecture Analysis and Design Language, standardized as SAE AS5506). AADL in particular is used in avionics, automotive, and other safety-critical embedded-systems domains because its formal semantics support analyses that less formal notations cannot — schedulability analysis, fault-tree computation, and resource consumption forecasting. AADL and SysML are often used together, with SysML handling the overall system structure and AADL handling the real-time embedded components that require formal analysis.

---

## 11. Architecture Trade-Off Analysis

Every architecture involves trade-offs: centralized versus distributed compute, redundant versus non-redundant subsystems, tight versus loose coupling, custom versus commercial components. The formal discipline of evaluating architecture trade-offs is called architecture trade-off analysis, and the best-known method is the Software Engineering Institute's **Architecture Tradeoff Analysis Method (ATAM)**, developed at Carnegie Mellon in the late 1990s. ATAM structures the trade-off conversation into a sequence of workshops in which stakeholders articulate quality-attribute requirements (performance, reliability, security, modifiability, and others), architects present the candidate architecture, and the group identifies the architectural decisions that most strongly affect each quality attribute. The output is a set of **sensitivity points** (decisions that affect a single quality attribute) and **trade-off points** (decisions that affect multiple quality attributes in opposing directions). Trade-off points are where architectural judgment is required, and ATAM surfaces them explicitly so they can be discussed and decided rather than left to implicit defaults.

A complementary technique, the **Cost Benefit Analysis Method (CBAM)**, extends ATAM by adding cost estimates for each architectural alternative and computing a benefit-to-cost ratio that program managers can use to choose among alternatives. CBAM is lighter weight than a full ATAM and is often used later in the program, when the alternative architectures have been narrowed down and the question is which of two or three finalists is the best investment.

---

## 12. Real-World Case Studies

### 12.1 International Space Station

The ISS is the largest and most heavily documented space-systems architecture in history. Its architecture evolved through three decades of international negotiation, and the final architecture decomposes the station into pressurized modules (U.S., Russian, European, Japanese), truss segments, solar array wings, robotic arms, docking ports, and the supporting command, data handling, thermal control, environmental control, and life support subsystems. The logical architecture separates the functions — pressurization, thermal regulation, power generation, attitude control, communications, and crew accommodation — from the physical architecture, which allocates each function to specific modules built by specific partners under specific interface control documents. The interface control document set alone runs to hundreds of separately controlled documents, and maintaining consistency across them has been one of the longest-running systems-engineering challenges in the program. ISS is often cited as the strongest argument for MBSE in legacy programs: had the architecture been captured in a model rather than in documents, many of the interface mismatches caught during ground integration and orbital assembly could have been prevented at edit time.

### 12.2 James Webb Space Telescope

JWST's architecture decomposition separated the observatory into the Optical Telescope Element (primary mirror, secondary mirror, supporting structure), the Integrated Science Instrument Module (four science instruments: NIRCam, NIRSpec, MIRI, and FGS/NIRISS), the spacecraft bus (attitude control, propulsion, command and data handling, communications), and the sunshield (five tensioned membrane layers). The logical architecture expressed the observational functions — image acquisition, spectroscopy, target tracking, data storage, data downlink — while the physical architecture allocated them to the four primary segments. The program used model-based approaches for portions of the ground system and for integration planning, though much of the flight-segment engineering was document-based due to the program's early-1990s origin. JWST's successful deployment in January 2022, with hundreds of single-point failure mechanisms all operating correctly, is a testament to the quality of the underlying systems-engineering work regardless of whether it was model-based or document-based.

### 12.3 Orion Capsule

Orion's architecture illustrates the international-partner allocation pattern that has become common in modern space programs. The Crew Module, built by Lockheed Martin under NASA contract, handles crew accommodation, life support, command and control, entry, descent, and landing. The European Service Module, built by Airbus Defence and Space under ESA contract, handles propulsion, power generation, thermal control, and consumables storage. The two modules join at a well-defined mechanical and electrical interface that is controlled by a joint NASA-ESA interface control document, and the architectural work of dividing the vehicle along that interface line — deciding which functions went to which module, and at what performance margin — was one of the longest-running architecture activities of the Artemis program. Airbus has reported significant use of MBSE, including Cameo Systems Modeler, in its Service Module work; Lockheed has used a mix of MBSE and document-based approaches on the Crew Module. The Orion program is often cited as a modern example of how heterogeneous architecture tooling can still produce a coherent vehicle, provided the interface control between the toolsets is managed rigorously.

---

## 13. Source Index and Citations

### Primary Specifications

- U.S. Department of Defense CIO, *DoD Architecture Framework Version 2.02*, August 2010 (Change 1 issued January 2015). Available at https://dodcio.defense.gov/Library/DoD-Architecture-Framework/
- The Open Group, *The TOGAF Standard, 10th Edition*, 25 April 2022, with 2025 updates to the Architecture Development Method guide. Available at https://www.opengroup.org/togaf
- Object Management Group, *Unified Architecture Framework (UAF) Specification* version 1.2 and version 1.3. Available at https://www.omg.org/spec/UAF/
- Object Management Group, *OMG Systems Modeling Language (SysML) Specification* version 1.6, 2019; version 2.0 adopted 21 July 2025, published 3 September 2025. Available at https://www.omg.org/sysml/
- Object Management Group, *Kernel Modeling Language (KerML) Specification* version 1.0, published September 2025
- NATO, *NATO Architecture Framework (NAF) Version 4*, January 2020
- ISO/IEC/IEEE 42010:2022, *Software, systems and enterprise — Architecture description*
- IEEE Standard 1320.1-1998, *IEEE Standard for Functional Modeling Language — Syntax and Semantics for IDEF0*
- SAE AS5506, *Architecture Analysis and Design Language (AADL)*

### Handbooks and Methodology

- NASA, *NASA Systems Engineering Handbook*, NASA/SP-2016-6105 Rev 2
- INCOSE, *Systems Engineering Vision 2020* (the document that formalized the term MBSE)
- Thales / Eclipse Foundation, *Arcadia Method Reference Manual*, available at https://mbse-capella.org/arcadia.html
- AFNOR Z67-140, *Arcadia method — Process description* (French national standard since 2018)

### Foundational Papers

- Philippe Kruchten, "The 4+1 View Model of Architecture," *IEEE Software* 12(6), November 1995, pp. 42–50
- Rick Kazman, Mark Klein, and Paul Clements, *ATAM: Method for Architecture Evaluation*, Software Engineering Institute Technical Report CMU/SEI-2000-TR-004
- Rick Kazman, Jai Asundi, and Mark Klein, *Quantifying the Costs and Benefits of Architectural Decisions*, Software Engineering Institute

### Tool Documentation

- Eclipse Capella project, https://eclipse.dev/capella/
- Dassault Systèmes CATIA Magic / No Magic product family, https://www.3ds.com/products/catia/no-magic
- No Magic Cameo Systems Modeler documentation, https://docs.nomagic.com/
- Sparx Systems Enterprise Architect, https://sparxsystems.com/
- IBM Engineering Systems Design Rhapsody

### News and Adoption

- OMG press release, "Object Management Group Approves Final Adoption of the SysML V2 Specification," 21 July 2025
- Aerospace Corporation, "Unified Architecture Framework (UAF)," https://aerospace.org/story/unified-architecture-framework-uaf
- INCOSE, *Methodology-Driven MBSE: Arcadia, Capella and Systems Modeling Workbench* (INCOSE Huntsville paper)
- No Magic ISO 26262-8 TCL2 certification announcement, 2024
