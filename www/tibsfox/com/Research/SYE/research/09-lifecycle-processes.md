---
id: SYE-09-lifecycle-processes
title: "Module 9: Lifecycle Processes"
type: reference
owner: Systems Engineering Research Mission
lifecycle_state: Published
review_cadence: Annual
audience: [systems_engineer, program_manager, project_manager, review_chair, engineering_director, acquisition_officer]
framework_refs: [iso-iec-ieee-15288-2023, nasa-sp-2016-6105-rev2, nasa-npr-7120-5f, nasa-npr-7123-1d, incose-se-handbook-v5, dod-5000-series]
scope: "Systems engineering lifecycle models, process standards, stage-gate reviews, phase entrance and exit criteria, and real-world program lifecycles from Apollo through Artemis"
purpose: "Establish the lifecycle framework that governs how large systems — especially NASA space flight programs and projects — move from concept through disposal, including the models (waterfall, Vee, spiral, agile), the standards (ISO/IEC/IEEE 15288, NPR 7120.5, NPR 7123.1), the reviews (MCR through DR), and the cadence of Key Decision Points"
version: "1.0"
last_reviewed: "2026-04-08"
next_review: "2027-04-08"
---

# Module 9: Lifecycle Processes

## Table of Contents

1. [Introduction: Why Lifecycle Matters](#1-introduction-why-lifecycle-matters)
2. [Historical Lifecycle Models](#2-historical-lifecycle-models)
3. [The Royce Waterfall: A Celebrated Misunderstanding](#3-the-royce-waterfall-a-celebrated-misunderstanding)
4. [The Vee Model: Forsberg and Mooz, 1991](#4-the-vee-model-forsberg-and-mooz-1991)
5. [The Spiral Model: Boehm, 1986](#5-the-spiral-model-boehm-1986)
6. [Agile Systems Engineering: Can SE Be Agile?](#6-agile-systems-engineering-can-se-be-agile)
7. [ISO/IEC/IEEE 15288:2023 — The International Standard](#7-isoiecieee-152882023--the-international-standard)
8. [NASA NPR 7120.5: Space Flight Program and Project Management](#8-nasa-npr-71205-space-flight-program-and-project-management)
9. [NASA Program/Project Lifecycle Phases: Pre-A through F](#9-nasa-programproject-lifecycle-phases-pre-a-through-f)
10. [Stage-Gate Reviews and Key Decision Points](#10-stage-gate-reviews-and-key-decision-points)
11. [Real Program Lifecycles: Apollo, Shuttle, JWST, Artemis](#11-real-program-lifecycles-apollo-shuttle-jwst-artemis)
12. [Source Index and Citations](#12-source-index-and-citations)

---

## 1. Introduction: Why Lifecycle Matters

A system does not exist in a single state. It exists as a trajectory — an evolving sequence of representations and realizations that begin when someone first sketches the idea on a napkin and end when the last hardware is decommissioned, the last software instance shut down, and the last operations contract closed out. Between those two points lie years or decades of activity: studies, requirements, architectures, designs, builds, tests, integrations, launches, missions, anomalies, upgrades, and eventual retirement. Lifecycle processes are the framework that gives shape to that trajectory.

The stakes of getting the lifecycle right are visible in the numbers. The James Webb Space Telescope took thirty-two years from conception in 1989 to launch in December 2021, with formal Phase A formulation beginning in 1999 and final cost approaching ten billion dollars against an initial estimate of one to three billion. Apollo burned eleven years and roughly twenty-five billion nineteen-sixties dollars between President Kennedy's announcement in 1961 and the last lunar landing in 1972. The Space Shuttle flew for thirty years after a development phase of nearly a decade. Every one of these programs had to answer the same fundamental questions at the same relative points in time: what will it do, how will it be built, when can we commit to a cost and schedule, is the design ready to cut metal, is the hardware ready to fly, and when do we stop. The discipline that answers those questions in a structured, auditable way is lifecycle process management.

Lifecycle matters because the cost of changing a system grows exponentially as the system matures. Correcting a requirements error during Phase A costs a few hours of analyst time. Correcting the same error during Phase D — after the hardware is assembled, the software is integrated, and the launch vehicle is stacking on the pad — can cost months of schedule slip and tens of millions of dollars. The entire purpose of lifecycle gates is to catch problems as early in the cost-growth curve as possible. A review that stops a flawed design at Preliminary Design Review has saved its own cost a thousand times over compared to catching the same flaw during Test Readiness Review two years later.

Lifecycle matters because space systems operate under constraints that leave no room for post-deployment repair. When JWST launched on December 25, 2021, every one of its 344 single-point failures had to work on the first try. There was no service mission planned. There was no "patch it in orbit" option for the primary mirror or the sunshield. The lifecycle process that carried JWST from concept through launch — every review, every test, every requirements baseline, every engineering change proposal — existed to make sure that the spacecraft that arrived at L2 was the spacecraft that had been analyzed, verified, and accepted on the ground. The same discipline governs Artemis, Europa Clipper, Mars Sample Return, and every crewed and uncrewed NASA mission of consequence.

This module surveys the full discipline. Section 2 covers the historical lineage of lifecycle models. Sections 3 through 6 examine the four canonical models — Royce's waterfall, the Vee, Boehm's spiral, and agile — along with the stories of how each has been understood, misunderstood, and applied. Section 7 covers ISO/IEC/IEEE 15288:2023, the international process standard. Sections 8 and 9 cover NASA's own NPR 7120.5 and the seven lifecycle phases from Pre-A through F. Section 10 details the stage-gate reviews and the criteria for passing them. Section 11 closes with real program lifecycles from Apollo to Artemis.

**Who should read this module:**

- Systems engineers responsible for lifecycle planning and review preparation
- Program and project managers navigating KDP approval cycles
- Review chairs preparing entrance criteria and success criteria tables
- Engineering directors establishing internal lifecycle governance
- Acquisition officers structuring contracts around phase boundaries
- Anyone writing proposals that must map to NASA lifecycle expectations

**What this module does not cover:**

- Requirements engineering specifics (covered in Module 01)
- Verification and validation methods (covered in Module 03)
- Configuration management baselines (covered in Module 06)
- Agile software engineering practices outside the SE context
- Contract and earned value management in depth

---

## 2. Historical Lifecycle Models

The modern concept of a software or system lifecycle emerged during the 1960s in response to a growing crisis. Large defense and aerospace projects of the late fifties and early sixties routinely overran schedules by factors of two or three and cost budgets by similar margins. The 1968 NATO Software Engineering Conference in Garmisch, Germany, coined the term "software crisis" to describe the gap between what programming projects promised and what they delivered. Engineering management responded by looking for process discipline: a repeatable sequence of activities that could be planned, staffed, budgeted, and reviewed.

The earliest formalization was sequential. Studies first, then requirements, then design, then code, then test, then deployment. This sequential model had an intuitive appeal — it mapped cleanly onto the existing hardware engineering practices that aerospace companies already used for missile and aircraft development. It had an equally obvious weakness: the real world rarely cooperates with a one-pass sequence. Requirements change. Designs prove infeasible. Testing reveals integration failures that invalidate earlier assumptions. The history of lifecycle models after 1970 is largely the history of engineers struggling to reconcile the clean sequential picture with the messy iterative reality.

Four models dominate the canonical literature: the Royce waterfall (1970), the Boehm spiral (1986), the Forsberg and Mooz Vee (1991), and the agile family that emerged from the software world in the late 1990s and began seriously influencing systems engineering in the 2010s. Each is associated with a particular problem it was trying to solve, each became famous for a particular visual metaphor, and each carries a particular set of misunderstandings that practitioners still argue about today. The remainder of this section sets the stage; sections 3 through 6 cover each model in detail.

The important observation to keep in mind is that none of the canonical models are mutually exclusive. NASA's own lifecycle, codified in NPR 7120.5 and NPR 7123.1, incorporates elements from all four. Phase progression is broadly sequential (Pre-A through F). Verification and validation follow a Vee pattern (requirements decomposition on the left, integration and test on the right). Risk management follows a spiral logic (identify risks, resolve through prototyping and analysis, commit to baseline only when risks are retired). And within each phase, the engineering work itself can be — and increasingly is — executed in iterative, agile-inspired cycles. The canonical models are vocabulary, not commandments.

---

## 3. The Royce Waterfall: A Celebrated Misunderstanding

In 1970, Dr. Winston W. Royce, then a director at TRW, published a paper titled "Managing the Development of Large Software Systems" in the Proceedings of IEEE WESCON. That paper is the single most misread document in the history of software engineering. It contains the figure that the industry came to call the waterfall model, and on the strength of that figure Royce has been named — inaccurately and unfairly — the father of rigid sequential development.

The actual paper tells a different story. Royce opens with a simple sequential diagram showing requirements flowing to analysis, analysis to program design, design to coding, coding to testing, and testing to operations. He then writes, in language that every student of the paper should memorize: "I believe in this concept, but the implementation described above is risky and invites failure." He goes on to explain that the simple method "has never worked on large software development efforts" in his experience, and proceeds over the next several pages to describe a progressively more sophisticated process that includes preliminary program design before requirements analysis, extensive documentation throughout, a planned pilot implementation, and — critically — iteration between every pair of adjacent phases. His final recommended figure shows backward-flowing arrows linking every downstream phase to its upstream neighbor, and he explicitly recommends that the entire development "be done twice if possible."

The paper's tragedy is that most people stopped reading at figure two. Figure two shows the clean, purely sequential picture. Royce used it as a straw man to knock down. Readers — particularly government acquisition officials looking for a disciplined process to impose on contractors — mistook the straw man for the recommendation. By 1976, the term "waterfall" was in common use (its earliest documented appearance is in a paper by Bell and Thayer that year, though Royce himself never used the word). By the early 1980s, the waterfall model was codified in U.S. Department of Defense standards as the preferred development lifecycle. An entire generation of engineers learned a process that Royce had specifically warned against, taught in his name.

The lesson of the Royce story is not merely historical. It is a warning about how engineering ideas propagate. A compelling diagram, seen out of context, can override thousands of words of careful argument. The same pattern has repeated with the Vee model (often presented as rigidly sequential when Forsberg and Mooz explicitly described it as iterative), with agile (often presented as anti-documentation when the Agile Manifesto explicitly says "while there is value in the items on the right" — including documentation), and with every lifecycle framework that has been reduced to a single memorable picture. When reading any lifecycle model, read the words that accompany the diagram. The picture is the advertising; the text is the contract.

For the NASA systems engineer, the practical implication is that pure waterfall — the strictly sequential, no-backflow, one-pass interpretation that Royce rejected — is not an acceptable process for any meaningful space flight program. NASA's own lifecycle permits and encourages iteration within phases, between phases, and across the full program. The phases exist to structure decisions, not to prohibit returning to earlier work when new information demands it. A Preliminary Design Review that exposes a flaw in the requirements baseline should trigger a requirements review update, not a stubborn insistence that "we are past that phase."

---

## 4. The Vee Model: Forsberg and Mooz, 1991

The Vee model, or V-model, was developed by Dr. Kevin Forsberg and Harold Mooz, co-principals of the Center for Systems Management, and first presented publicly at a joint conference of the National Council on Systems Engineering (NCOSE, renamed INCOSE in 1995) and the American Society for Engineering Management held in Chattanooga, Tennessee, on October 21 through 23, 1991. The paper was titled "The Relationship of System Engineering to the Project Cycle." It was developed in the context of satellite systems involving hardware, software, and human interaction, and it became, almost immediately, the single most influential visual metaphor in systems engineering.

The Vee derives its shape from a simple observation. Requirements decomposition flows downward and to the right: mission needs become system requirements, system requirements become subsystem requirements, subsystem requirements become component requirements, and eventually component requirements become build-to specifications. Implementation happens at the bottom of the Vee, where components are actually fabricated, coded, or procured. Then integration and test flow upward and to the right: components are tested against component requirements, subsystems are integrated and tested against subsystem requirements, systems are integrated and tested against system requirements, and finally the complete system is validated against the original mission needs. Drawing this as a descending-then-ascending path produces the characteristic V shape.

The Vee model makes two important claims that are easy to miss if one focuses only on the picture. The first claim is that each level of decomposition on the left side has a corresponding verification activity on the right side. This is the Vee's most durable contribution: the explicit pairing of requirements with their verification. Every requirement written during decomposition commits the program to a specific test or analysis during integration. A requirement without a verification method is a requirement that cannot be closed out, and a Vee-disciplined program knows this at the moment the requirement is written, not three years later when someone tries to write the verification matrix.

The second claim, often overlooked in introductory treatments, is that the Vee is iterative and supports parallel activities. Forsberg and Mooz explicitly described the Vee as a framework in which decomposition on the left and integration planning on the right happen concurrently, with information flowing horizontally across the Vee at every level. A team working on subsystem design at the middle-left of the Vee is simultaneously writing the subsystem test plan that will be executed on the middle-right. They are also feeding information back up to the system-level design and forward down to the component-level design. The Vee is not a one-way traversal; it is a simultaneous, bidirectional, multi-level activity space.

The Vee model has been adopted, with variations, by NASA (where it appears in the SE Handbook SP-2016-6105 Rev 2), the U.S. Department of Defense, the European Space Agency, the German V-Modell XT (a separate but related framework used in German government projects), and essentially every major aerospace organization. Its success is partly pedagogical — the diagram is easy to draw on a whiteboard and easy to remember — and partly structural. The Vee maps cleanly onto the stage-gate review process. Mission Concept Review sits at the top-left, Preliminary Design and Critical Design Reviews at the middle-left, Test Readiness Review at the bottom, and System Acceptance, Flight Readiness, and Operational Readiness Reviews at the upper-right. The reviews and the Vee levels reinforce each other; each gate corresponds to a level of the Vee having been completed with documented evidence.

The practical criticism of the Vee is that organizations sometimes interpret it as strictly sequential, with all requirements fully baselined before any design begins and all design fully complete before any fabrication begins. This interpretation is not what Forsberg and Mooz described, and it is not what NASA practices, but it is what many programs revert to when schedule pressure and contractual structures push toward clean handoffs between phases. The cure is to remember the second claim: the Vee supports concurrent activity at multiple levels, and the information flow is bidirectional. A program that is doing the Vee correctly does not wait for CDR to begin writing test procedures; the test procedures begin at SRR and mature alongside the design.

---

## 5. The Spiral Model: Boehm, 1986

Dr. Barry W. Boehm published "A Spiral Model of Software Development and Enhancement" in ACM SIGSOFT Software Engineering Notes in August 1986, and in a slightly revised form in IEEE Computer in May 1988. The paper was written in response to a specific frustration: the waterfall model and its early variants assumed that requirements could be stabilized before design began and that design could be stabilized before implementation began. Boehm had worked on too many large projects where those assumptions failed, and where the failure was driven by one particular cause — unresolved risk. The spiral model is, at its core, a risk-driven process framework.

The spiral is drawn as a series of outward-growing loops, each loop representing one iteration of the process. Every loop is divided into four quadrants. The first quadrant, at the upper-left, is objective setting: determine the objectives of this iteration, identify alternative means of meeting those objectives, and identify constraints on the alternatives. The second quadrant, at the upper-right, is risk analysis: evaluate the alternatives against the objectives and constraints, identify and resolve risks through prototyping, simulation, analysis, benchmarking, or whatever else is appropriate, and commit to an approach for this iteration. The third quadrant, at the lower-right, is development and verification of the next-level product — design, build, test whatever is the planned deliverable for this iteration. The fourth quadrant, at the lower-left, is planning the next iteration: review the results, plan the next pass, commit to moving forward or to returning to an earlier point.

The insight that made the spiral influential is the placement of risk at the center of the process. Boehm argued that the appropriate amount of process discipline for any given project is not a constant — it depends on the risks present. A small project with well-understood requirements and low-risk technology needs relatively little ceremony; a large project with novel technology and high stakes needs substantially more. The spiral model provides a framework for making that decision iteratively. Each loop asks the same four questions, but the answers scale with the risks. An early loop might resolve a major technology risk through a hardware prototype; a later loop might resolve an integration risk through a staged test campaign; a final loop might resolve an acceptance risk through a formal qualification test.

The spiral model never achieved the pedagogical dominance of the Vee, partly because the diagram is harder to draw and remember, and partly because it is less prescriptive about what happens when. The Vee tells you where you are in the lifecycle; the spiral tells you what questions you should be asking at whatever point you happen to be. Both answers are valuable, and the two models are complementary rather than competing. NASA programs routinely use Vee-style lifecycle phases and gates while using spiral-style risk management within each phase. The risk registers maintained throughout Phases A, B, and C are spiral-model artifacts even when the overall phase structure is drawn as a Vee.

The spiral's most important long-term contribution is the concept of incremental commitment. Rather than committing the full program to a single baseline at a single point in time, the spiral commits incrementally as risks are retired. This concept echoes forward into every modern iterative framework — Boehm himself later developed the Incremental Commitment Spiral Model (ICSM) in the 2000s to explicitly codify it — and backward into the Royce paper, which also explicitly recommended iteration. The spiral was not the first iterative lifecycle model, but it was the first to frame iteration in terms of risk reduction rather than merely in terms of refinement.

---

## 6. Agile Systems Engineering: Can SE Be Agile?

The Agile Manifesto was signed in Snowbird, Utah, in February 2001 by seventeen software developers frustrated with the heavyweight processes they had inherited from the DoD and aerospace world. The manifesto is brief — four value statements and twelve principles — and it has been interpreted, reinterpreted, and misinterpreted more times than perhaps any other document in software engineering. Its core claim is that working software, customer collaboration, responding to change, and individuals and interactions are more valuable than comprehensive documentation, contract negotiation, following a plan, and processes and tools. The manifesto explicitly notes that the items on the right are still valuable; the claim is about relative priority, not absolute rejection.

The question of whether systems engineering can be agile has no simple answer, and the answer depends heavily on what part of SE one is talking about. For pure software subsystems — flight software, ground system software, operations tools — agile practices have been successfully adopted by NASA centers, JPL, and commercial space companies for more than a decade. Scrum, Kanban, and continuous integration are standard practice in these domains. For hardware — the physical spacecraft, the launch vehicle, the payload — the answer is more complicated. Hardware has long lead times, long fabrication cycles, and high per-unit costs. A sprint cannot produce a new mirror segment in two weeks. The material and manufacturing constraints impose a rhythm on hardware development that no agile ceremony can override.

SpaceX is the organization most commonly cited as an example of successful agile systems engineering applied to hardware. The SpaceX approach centers on a simple observation: rapid iteration with acceptance of failure is faster, over the long run, than slow iteration with a demand for first-time success. The company's early Falcon 1 program failed three times in a row before the fourth flight succeeded. The Starship development program has publicly exploded vehicles on the pad, during ascent, and during reentry attempts, and has treated each explosion as a data point rather than a crisis. The underlying philosophy is that an organization that iterates ten times in the time a traditional aerospace program takes to iterate once will win on capability, cost, and schedule even if half of those iterations fail. This philosophy is not agile in the strict Snowbird sense, but it shares the agile preference for working artifacts over comprehensive up-front analysis.

NASA's traditional approach, embodied in NPR 7120.5 and the SE Handbook, reflects a different operating environment. NASA missions are typically one-of-a-kind, use taxpayer funds under Congressional oversight, and often carry crew or irreplaceable science payloads. The cost of failure is high enough that rapid iteration with acceptance of failure is not a viable strategy. A failed James Webb Space Telescope launch would not be followed by a second copy three months later; it would be followed by a decade-long inquiry and probably the permanent cancellation of the program. This cost-of-failure asymmetry is the fundamental reason NASA SE remains document-heavy, review-heavy, and baseline-heavy. The process is not slow because NASA engineers enjoy paperwork; it is slow because the consequence of getting it wrong is unrecoverable.

INCOSE itself has been studying agile systems engineering since a working group formed in 2014. The position that has emerged is neither uncritical adoption nor wholesale rejection. INCOSE's guidance recognizes that iterative, incremental practices are appropriate at many points in the SE process, that agile ceremonies can accelerate the handling of stakeholder feedback, and that the traditional waterfall caricature of SE is not what the standards actually require. At the same time, INCOSE holds that critical safety systems, systems with long design lifetimes, and systems with high integration complexity still benefit from the discipline of formal baselines and documented verification. The Scaled Agile Framework (SAFe) and its "Agile for Hardware" variant have been adopted by some DoD and NASA programs as a compromise: agile practices at the team level, traditional program-level governance at the enterprise level.

The practical recommendation for a NASA systems engineer is that agile is a tool to be applied where the risk and integration profile supports it, not an ideology to be adopted wholesale. Flight software development can and should be agile. Hardware qualification testing cannot be agile in any meaningful sense. Subsystem integration sits in between and benefits from some agile practices (short feedback cycles, frequent informal reviews) while still requiring traditional practices (formal test readiness reviews, documented verification). The skill is knowing which practice to apply where.

---

## 7. ISO/IEC/IEEE 15288:2023 — The International Standard

ISO/IEC/IEEE 15288 is the international standard that defines a common framework of process descriptions for the life cycle of human-made systems. The current edition, published in May 2023, supersedes the 2015 edition and represents the third major revision since the standard was originally issued in 2002. The standard is jointly developed and published by three bodies — the International Organization for Standardization (ISO), the International Electrotechnical Commission (IEC), and the Institute of Electrical and Electronics Engineers (IEEE) — and is the nearest thing the systems engineering discipline has to a universally recognized process authority.

The standard organizes system life cycle processes into four groups. (Note: the exact names and counts given here reflect the 2015 edition, which remains the most widely cited structure; the 2023 edition retained the same four groups while refining the content of individual processes.)

The **Agreement Processes** group contains two processes that govern the relationship between acquirer and supplier. These are the Acquisition Process (the activities of obtaining a product or service from a supplier) and the Supply Process (the activities of providing a product or service to an acquirer). Agreement processes are where contracts, statements of work, and acceptance criteria live.

The **Organizational Project-Enabling Processes** group contains six processes that ensure the organization can execute projects at all. These are the Life Cycle Model Management Process, the Infrastructure Management Process, the Portfolio Management Process, the Human Resource Management Process, the Quality Management Process, and the Knowledge Management Process. These are the enterprise-level processes that exist independently of any specific project — they are how the organization maintains the capability to do projects in the first place.

The **Technical Management Processes** group contains eight processes that govern the management of a specific project's technical work. These are the Project Planning Process, the Project Assessment and Control Process, the Decision Management Process, the Risk Management Process, the Configuration Management Process, the Information Management Process, the Measurement Process, and the Quality Assurance Process. These processes are where earned value, risk registers, configuration baselines, and measurement programs live.

The **Technical Processes** group contains fourteen processes that do the actual engineering work. These are the Business or Mission Analysis Process, the Stakeholder Needs and Requirements Definition Process, the System Requirements Definition Process, the Architecture Definition Process, the Design Definition Process, the System Analysis Process, the Implementation Process, the Integration Process, the Verification Process, the Transition Process, the Validation Process, the Operation Process, the Maintenance Process, and the Disposal Process. These fourteen processes are the spine of the SE discipline — they are what systems engineers actually do, or plan and coordinate, every day of a program.

The 2023 revision made targeted updates in several areas. Business or mission analysis received expanded content. System architecture definition was clarified. Implementation, integration, operations, and maintenance processes were refined based on lessons learned from fifteen years of standard use. Risk management and configuration management in the technical management group were strengthened. Clause 5, which describes the application of the processes, was expanded to address iteration, recursion, system-of-systems considerations, and quality characteristics. A new annex on Model-Based Systems Engineering (MBSE) was added. The structural count of processes remained the same, but the content matured substantially.

ISO/IEC/IEEE 15288 is important to the NASA systems engineer for two reasons. First, it is the process vocabulary that international partners speak. ESA, JAXA, and other national space agencies that partner with NASA on programs like JWST, Artemis, and Europa Clipper work from 15288-based process descriptions, and interface documents between agencies often map to 15288 process names. Second, 15288 is the standard that NASA's own NPR 7123.1 explicitly aligns with. The NASA SE Handbook cross-references 15288 processes throughout, and the alignment means that a program compliant with NPR 7123.1 is substantially compliant with 15288 as well.

---

## 8. NASA NPR 7120.5: Space Flight Program and Project Management

NASA Procedural Requirement 7120.5 is the document that establishes the requirements by which NASA formulates and implements space flight programs and projects. The current version, 7120.5F, was issued in 2021 and supersedes earlier revisions going back to the original 7120.5 in the 1990s. It is a companion document to NPR 7123.1, Systems Engineering Processes and Requirements, which establishes the SE side of the same program and project framework. Together, NPR 7120.5 and NPR 7123.1 codify how NASA runs space flight missions from concept through closeout.

NPR 7120.5F identifies four basic types of programs: single-project programs, uncoupled programs, loosely coupled programs, and tightly coupled programs. A single-project program is what it sounds like: one project that constitutes its own program. JWST is an example. An uncoupled program is a collection of largely independent projects sharing a common theme — NASA's Explorer program of small astrophysics missions fits this description. A loosely coupled program is a set of projects with shared scientific goals but independent implementation — the Mars Exploration Program has had this character at various times. A tightly coupled program has multiple projects that depend on each other technically — Artemis, with its SLS rocket, Orion spacecraft, Human Landing System, Gateway lunar station, and surface systems all required to work together, is the archetypal tightly coupled program.

Revision F introduced several significant policy changes. It updated the requirements for establishing Agency Baseline Commitments (ABCs), the formal cost-and-schedule commitments that NASA makes to Congress when a program is confirmed at KDP-C. It strengthened the requirements for Joint Cost and Schedule Confidence Level (JCL) analyses on tightly coupled programs, and added JCL analysis requirements for single-project programs and projects with life-cycle costs over one billion dollars. It allowed the use of initial capability cost estimates instead of full life-cycle cost estimates in specific identified circumstances for programs and projects that plan continuing operations and production. These changes reflect a decade of lessons learned from cost overruns on major programs, including JWST, SLS, and various science missions.

The NPR 7120.5 framework is built around **Key Decision Points (KDPs)** and **Life Cycle Reviews (LCRs)**. A KDP is a formal decision event at which the decision authority — the Associate Administrator for the relevant mission directorate, or for the largest programs, the NASA Administrator — decides whether a program or project may proceed to the next lifecycle phase. The LCR is the technical review held before the KDP that provides the evidence on which the KDP decision is based. The LCR identifies what was done in the current phase, what is planned for the next phase, and whether the program is ready to advance. The KDP is the management decision; the LCR is the technical justification.

KDPs associated with programs are designated with Roman numerals (KDP 0, KDP I, KDP II, and so on). KDPs for projects are designated with capital letters (KDP A, KDP B, KDP C, KDP D, KDP E, KDP F). Each KDP marks the boundary between two phases, except for the transition from Phase D to Phase E, which occurs not at a KDP but following on-orbit checkout and initial operations — a recognition that the transition from "being built" to "operating in space" is a technical event rather than a management decision.

---

## 9. NASA Program/Project Lifecycle Phases: Pre-A through F

NASA divides the project lifecycle into seven phases. Phases Pre-A and A together constitute Pre-Formulation. Phase B is Formulation. Phases C and D together constitute Implementation (development). Phase E is Operations. Phase F is Closeout. The phases and their associated KDPs, reviews, and purposes are summarized in the following table.

| Phase | Name | Purpose | Start KDP | End KDP | Major Reviews |
|-------|------|---------|-----------|---------|---------------|
| Pre-A | Concept Studies | Produce a broad spectrum of mission ideas and alternatives; identify candidates for formal formulation | (none — entry is Mission Concept Review invocation) | KDP A | MCR (Mission Concept Review) |
| A | Concept and Technology Development | Develop a proposed mission/system architecture credible and responsive to program expectations, requirements, and constraints | KDP A | KDP B | SRR (System Requirements Review), MDR/SDR (Mission/System Definition Review) |
| B | Preliminary Design and Technology Completion | Define the project in enough detail to establish an initial baseline capable of meeting mission needs | KDP B | KDP C | PDR (Preliminary Design Review) |
| C | Final Design and Fabrication | Complete the detailed design; fabricate, code, assemble, and test subsystems and components | KDP C | KDP D | CDR (Critical Design Review), PRR (Production Readiness Review), SIR (System Integration Review) |
| D | System Assembly, Integration and Test, Launch | Integrate the full system; conduct qualification and acceptance testing; prepare for and execute launch | KDP D | (transition at on-orbit checkout) | TRR (Test Readiness Review), SAR (System Acceptance Review), ORR (Operational Readiness Review), FRR (Flight Readiness Review), PLAR (Post-Launch Assessment Review) |
| E | Operations and Sustainment | Execute the primary and extended missions; maintain and upgrade as needed | (on-orbit checkout) | KDP F | PFAR (Post-Flight Assessment Review), periodic Mission Reviews |
| F | Closeout | Decommission systems; archive data; conduct final program review and closeout | KDP F | (program end) | DR (Decommissioning Review) |

**Pre-Phase A: Concept Studies** is where a study team explores a broad space of mission ideas. The output is not yet a project. It is a set of analyzed alternatives, with enough technical, cost, and schedule rigor to enable a decision about whether to invest in formal Phase A work. Pre-A activities are typically funded out of a center's discretionary funds or a mission directorate's study budget rather than an approved project budget. The Mission Concept Review (MCR) is held at the end of Pre-A and provides the evidence for KDP A.

**Phase A: Concept and Technology Development** is where one or more of the Pre-A alternatives is selected for further development. The team produces a credible system architecture, identifies the key technology risks, begins technology development activities if needed, and establishes enough requirements and interface definitions to support a preliminary design. Phase A ends with the System Requirements Review (SRR) and often a Mission Definition Review (MDR) or System Definition Review (SDR), which together provide the evidence for KDP B.

**Phase B: Preliminary Design and Technology Completion** is where the preliminary design is completed and the remaining technology risks are retired. This phase ends with the Preliminary Design Review (PDR), which is the most important gate in the early lifecycle because PDR is where the system baseline is formally established. After PDR, significant changes to the requirements or architecture are expensive and require formal change control. The KDP C decision — the decision to commit the program to implementation — is based on PDR evidence, and it is at KDP C that NASA establishes its Agency Baseline Commitment to Congress.

**Phase C: Final Design and Fabrication** is where the design is completed in detail and hardware and software are fabricated. This phase ends with the Critical Design Review (CDR), which certifies that the detailed design is ready to support full production. For programs with significant manufacturing scope, a separate Production Readiness Review (PRR) may follow CDR. The System Integration Review (SIR) marks the readiness to begin integration of subsystems into the full system.

**Phase D: System Assembly, Integration and Test, Launch** is where the full system is assembled, tested, and launched. This is the phase where the pace of activity accelerates sharply and where problems become most expensive to fix. Phase D hosts multiple reviews: the Test Readiness Review (TRR) before each major test campaign, the System Acceptance Review (SAR) when the system is accepted from the development contractor or integration team, the Operational Readiness Review (ORR) when the ground systems and operations team are ready to take over, and the Flight Readiness Review (FRR) immediately before launch. FRR is the final gate. A Post-Launch Assessment Review (PLAR) is held after initial on-orbit operations to assess whether the spacecraft is performing as expected.

**Phase E: Operations and Sustainment** is where the mission actually accomplishes its scientific or operational objectives. For robotic missions, Phase E can last years or decades — Voyager 1 and 2 have been in Phase E since the mid-1980s. For crewed missions like the International Space Station, Phase E includes continuous operations with periodic major reviews. For the Shuttle, Phase E encompassed thirty years of flight operations. Phase E includes continuing engineering support, anomaly resolution, software updates, consumables management, and for extended missions, science planning for periods beyond the original baseline.

**Phase F: Closeout** is where the system is decommissioned and the program is formally closed out. For spacecraft, this may involve a controlled deorbit (Cassini's final plunge into Saturn in September 2017), a graveyard orbit (GEO satellites), or simply letting the spacecraft drift (Voyager). The Decommissioning Review (DR) is the formal gate that marks the end of operations and the beginning of archival activities. Phase F also includes data archiving, lessons-learned documentation, and final financial closeout.

---

## 10. Stage-Gate Reviews and Key Decision Points

Stage-gate reviews are the mechanism by which NASA ensures that a program is ready to proceed before committing additional resources. Each review has a defined set of entrance criteria (what must be in place for the review to be held) and success criteria (what must be demonstrated for the review to be passed). The criteria are published in Appendix G of NPR 7123.1 and in the NASA Systems Engineering Handbook. The following table summarizes the major reviews in the NASA lifecycle.

| Review | Phase | What It Decides | Representative Key Artifacts |
|--------|-------|-----------------|------------------------------|
| MCR — Mission Concept Review | End of Pre-A | Is the mission concept feasible and worth further development? | Mission needs statement, alternative architectures, preliminary cost and schedule estimates, technology readiness assessment |
| SRR — System Requirements Review | Phase A | Are the system requirements adequate, complete, and verifiable? | System requirements document, requirements verification matrix, initial interface requirements, preliminary risk register |
| MDR/SDR — Mission/System Definition Review | End of Phase A | Is the system architecture mature enough to proceed to preliminary design? | System architecture description, functional and physical allocations, trade study reports, technology development plan |
| PDR — Preliminary Design Review | End of Phase B | Is the preliminary design ready to proceed to final design? Is the program ready for ABC commitment? | Preliminary design documentation for all subsystems, verified requirements baseline, preliminary ICDs, integrated schedule, life-cycle cost estimate, risk register with retirement plans |
| CDR — Critical Design Review | Phase C | Is the detailed design ready to support fabrication, assembly, integration, and test? | Final design drawings and models, complete ICDs, verification plan, test plans, as-designed configuration baseline |
| PRR — Production Readiness Review | Phase C (if applicable) | Is the design and supply chain ready for production? | Manufacturing plan, quality plan, supplier qualifications, tooling readiness |
| SIR — System Integration Review | Phase C/D boundary | Are the subsystems ready for integration into the full system? | Subsystem acceptance test results, integration procedures, facility readiness, test readiness plans |
| TRR — Test Readiness Review | Phase D | Is the test article and test facility ready for a specific test? | Test procedures, test article configuration, safety analysis, data collection plan, go/no-go criteria |
| SAR — System Acceptance Review | Phase D | Is the system ready to be accepted by the customer or operator? | Completed verification matrix, acceptance test results, waivers and deviations, as-built configuration |
| ORR — Operational Readiness Review | Phase D | Are the ground systems, operations team, and procedures ready to support the mission? | Operations procedures, crew and operator training records, ground system readiness, contingency plans |
| FRR — Flight Readiness Review | Phase D | Is the integrated system ready to fly? | Integrated test results, open items and waivers list, launch vehicle readiness, range safety clearance, weather and operational constraints |
| PLAR — Post-Launch Assessment Review | Early Phase E | Did the system perform as expected during launch and initial operations? | Telemetry analysis, deployment results, anomaly logs, initial performance data |
| DR — Decommissioning Review | End of Phase E / Start of Phase F | Is the system ready to be decommissioned? Is the decommissioning plan safe and complete? | Decommissioning plan, data archival plan, hazard analysis, legal and regulatory clearances |

Each review has a review chair, a review board, and a set of presentation materials. The review chair is typically a senior technical authority from outside the program — this is a deliberate structural choice to ensure independent review. The review board is a panel of subject matter experts drawn from elsewhere in NASA, other government agencies, industry, or academia. The presentation materials are a package of documents and briefings prepared by the program team to demonstrate readiness against the entrance and success criteria.

The rigor of a review is proportional to the stakes. MCR for a small Explorer mission might be a one-day event with a dozen participants. PDR for SLS or Orion is a multi-day event with hundreds of participants, thousands of pages of documentation, and formal action items that can take months to close out. In all cases, the gate does not open until the success criteria are either met or formally waived by the decision authority, and waivers are themselves tracked as program risk.

An important feature of the NASA review process is that reviews can — and regularly do — fail. A failed review does not end the program, but it does mean the program cannot proceed to the next phase until the identified issues are resolved and a successful re-review is held. A program that fails its PDR might spend another six months maturing the design before re-attempting; a program that fails its FRR might scrub the launch and re-review after fixing the issue. This is the mechanism by which the cost-of-failure asymmetry of space flight is made manageable — the review process expects failures and is designed to absorb them without becoming theater.

---

## 11. Real Program Lifecycles: Apollo, Shuttle, JWST, Artemis

The lifecycle models and processes described in the previous sections are abstractions. The value of the abstractions is that they can be traced through real programs and used to understand how those programs actually unfolded.

**Apollo (1961–1972).** The Apollo program is the foundational case study for NASA systems engineering, but it predates the formal lifecycle structure codified in NPR 7120.5 by decades. Apollo's lifecycle can be mapped onto modern phases retroactively: Pre-A and A are the Mercury and Gemini programs and the early Apollo conceptual studies (roughly 1960–1963); Phase B is the Apollo preliminary design work through the mid-1960s; Phase C is the Saturn V and spacecraft development and fabrication campaigns; Phase D is the flight test program including Apollo 1 (the ground fire that killed Grissom, White, and Chaffee in January 1967) through the uncrewed Apollo 4, 5, and 6 flights, the crewed Apollo 7, 8, 9, and 10 precursor missions, and finally Apollo 11. Phase E is the landing missions Apollo 11 through 17. Phase F came when the last lunar hardware was decommissioned and the remaining Saturn Vs were placed in museums. What Apollo pioneered was not the phase structure — that came later — but the discipline of decomposing a massive system into reviewable subsystems, managing configurations across hundreds of contractors, and using formal readiness reviews as gates. Much of what became NPR 7120.5 was extracted from Apollo lessons learned.

**Space Shuttle (1972–2011).** The Shuttle program had a development Phase B/C/D of roughly 1972 through 1981 (first launch of Columbia on April 12, 1981), followed by a thirty-year Phase E from 1981 to the last Atlantis landing on July 21, 2011, and a Phase F decommissioning and orbiter disposal campaign that extended into the mid-2010s. The Shuttle's lifecycle illustrates the long tail of Phase E on a successful program — thirty years of flight operations, 135 missions, two catastrophic losses (Challenger in 1986 and Columbia in 2003), and continuous engineering sustainment throughout. The Shuttle also illustrates how the lifecycle review process handles off-nominal events: both Challenger and Columbia triggered formal return-to-flight campaigns that included full reviews of the failure modes, implementation of corrective actions, and re-reviews before flight resumed. These return-to-flight activities were, in effect, re-runs of the late-phase reviews (TRR, SAR, ORR, FRR) applied to the modified system.

**James Webb Space Telescope (1989–present).** JWST has the longest formulation and development lifecycle of any science mission in NASA history. The concept originated at a 1989 Next Generation Space Telescope workshop at STScI. An 18-member committee led by Alan Dressler formally recommended the mission in 1996. Formal Phase A formulation began in 1999. Phase B led to the 2006 Preliminary Design Review. Phase C and D stretched from 2006 to launch on December 25, 2021 — fifteen years of final design, fabrication, assembly, integration, and test. The long Phase C/D reflected the extreme technical challenges: a 6.5-meter primary mirror that had to fold for launch and deploy in orbit, a tennis-court-sized sunshield with five ultra-thin kapton layers, infrared instruments requiring cryogenic temperatures, and 344 single-point failures all of which had to work on the first try. The FRR was held in December 2021 and the launch succeeded. Phase E began in January 2022 with the L2 cruise, continued through six months of commissioning, and remains ongoing in 2026 with the telescope delivering science results. JWST illustrates both the strength and the cost of NASA's lifecycle discipline: the launch succeeded with every deployment operating as designed, but the total development cost grew from an initial estimate of one to three billion dollars to a final cost near ten billion, and the schedule slipped from a planned 2011 launch to December 2021.

**Artemis (2017–present).** The Artemis program is the current tightly coupled program in the NASA portfolio and the one that most directly exercises the modern NPR 7120.5F framework. Artemis comprises multiple projects: the Space Launch System (SLS) heavy-lift rocket, the Orion crew vehicle, the Human Landing System (initially SpaceX Starship HLS), the Gateway lunar orbiting station, Extravehicular Activity and Human Surface Mobility systems, and lunar surface hardware. Each project has its own phase, its own reviews, and its own KDPs, while the overall Artemis program has its own program-level KDPs. Artemis I flew uncrewed around the Moon in November and December 2022. Artemis II, the first crewed Artemis mission, is on the artemis-ii branch of development as of the research date of this module (April 2026) — the crew is trained, the vehicle is integrated, and the mission is in final pre-flight review cycles. Artemis III, the first crewed lunar landing since Apollo 17, is planned for later in the decade. The program illustrates every feature discussed in this module: multiple lifecycle phases running in parallel across projects, tightly coupled program-level KDPs, JCL analyses required for multi-billion-dollar elements, agile practices inside some subsystems and traditional practices inside others, and the inevitable schedule adjustments as risks emerge and are retired.

These four programs span sixty-five years of NASA history and every possible outcome — triumphant success, successful long-term operations with two catastrophic losses, successful launch after massive cost and schedule growth, and active development. What unites them is the discipline of the lifecycle: concepts become architectures become designs become hardware become flight operations become decommissioning, with gates at every transition and with the readiness to pass each gate being demonstrated rather than assumed. The models change. The vocabulary evolves. The visual metaphors come and go. The underlying commitment — that large systems must be built in structured, reviewable stages with explicit commitment decisions at defined points — has remained constant since Apollo. It is the single most durable contribution of systems engineering to the aerospace discipline.

---

## 12. Source Index and Citations

### Primary Authoritative Sources (Gold Tier)

| # | Source | Type | URL |
|---|--------|------|-----|
| 1 | NASA Systems Engineering Handbook, SP-2016-6105 Rev 2 | Primary NASA standard | https://ntrs.nasa.gov/citations/20170007238 |
| 2 | NASA NPR 7120.5F, Space Flight Program and Project Management Requirements | Primary NASA procedural requirement | https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPR&c=7120&s=5E |
| 3 | NASA NPR 7123.1, Systems Engineering Processes and Requirements | Primary NASA procedural requirement | https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPR&c=7123&s=1B |
| 4 | NASA SE Handbook Chapter 3: NASA Program/Project Life Cycle | Primary reference | https://www.nasa.gov/reference/3-0-nasa-program-project-life-cycle/ |
| 5 | NASA NPR 7123.1 Appendix G: Technical Review Entrance and Success Criteria | Primary reference | https://nodis3.gsfc.nasa.gov/displayCA.cfm?Internal_ID=N_PR_7123_0001_&page_name=AppendixG |
| 6 | ISO/IEC/IEEE 15288:2023, Systems and Software Engineering — System Life Cycle Processes | International standard | https://www.iso.org/standard/81702.html |
| 7 | Royce, W.W. (1970), "Managing the Development of Large Software Systems" | Original paper | Proceedings of IEEE WESCON, August 1970 |
| 8 | Boehm, B. (1986), "A Spiral Model of Software Development and Enhancement" | Original paper | ACM SIGSOFT Software Engineering Notes, Vol 11 No 4, August 1986 |
| 9 | Forsberg, K. and Mooz, H. (1991), "The Relationship of System Engineering to the Project Cycle" | Original paper | NCOSE / ASEM Joint Conference, Chattanooga TN, October 1991 |

### Secondary Sources (Silver Tier)

| # | Source | Type | URL |
|---|--------|------|-----|
| 10 | SEBoK (Systems Engineering Body of Knowledge) | Community reference | https://sebokwiki.org/wiki/ISO/IEC/IEEE_15288 |
| 11 | INCOSE Systems Engineering Handbook v5 | Professional society handbook | https://www.incose.org |
| 12 | ANSI Blog: ISO/IEC/IEEE 15288:2023 System Life Cycle Processes | Standards summary | https://blog.ansi.org/ansi/iso-iec-ieee-15288-2023-system-life-cycle-processes/ |
| 13 | Wikipedia: ISO/IEC 15288 | Encyclopedia | https://en.wikipedia.org/wiki/ISO/IEC_15288 |
| 14 | Wikipedia: V-model | Encyclopedia | https://en.wikipedia.org/wiki/V-model |
| 15 | Wikipedia: Spiral model | Encyclopedia | https://en.wikipedia.org/wiki/Spiral_model |
| 16 | Wikipedia: Winston W. Royce | Encyclopedia | https://en.wikipedia.org/wiki/Winston_W._Royce |
| 17 | Wikipedia: Timeline of the James Webb Space Telescope | Encyclopedia | https://en.wikipedia.org/wiki/Timeline_of_the_James_Webb_Space_Telescope |
| 18 | STScI JWST Mission Timeline | Primary mission archive | https://www.stsci.edu/jwst/about-jwst/history/mission-timeline |
| 19 | NASA Science: JWST Mission Timeline | Primary NASA reference | https://science.nasa.gov/mission/webb/webb-mission-timeline/ |
| 20 | Flow Engineering: SpaceX's Agile Systems Engineering | Industry analysis | https://flowengineering.com/blog/spacex-systems-engineering-five-tips |
| 21 | Flow Engineering: NASA's Waterfall vs Agile Systems Engineering | Industry analysis | https://flowengineering.com/blog/nasa-waterfall-vs-agile-systems-engineering |
| 22 | "Why Waterfall was a big misunderstanding from the beginning" | Analysis | https://pragtob.wordpress.com/2012/03/02/why-waterfall-was-a-big-misunderstanding-from-the-beginning-reading-the-original-paper/ |
| 23 | David A. Wheeler: The Waterfall Model | Analysis | https://dwheeler.com/essays/waterfall.html |
| 24 | "A Brief History of the Waterfall Model" (arXiv) | Academic history | https://arxiv.org/html/2510.03894v3 |

### Tertiary Sources (Bronze Tier)

| # | Source | Type | URL |
|---|--------|------|-----|
| 25 | Humphreys & Associates: NPR 7120.5F Summary | Industry commentary | https://www.humphreys-assoc.com/npr-7120-5f-nasa-space-flight-program-and-project-management-requirements/ |
| 26 | The Ultimate Guide to the SDLC: Vee Model | Reference site | https://ultimatesdlc.com/vee-model/ |
| 27 | CESAMES: Agile Systems Engineering | Industry paper | https://www.cesames.net/wp-content/uploads/2023/12/Agile_SE_-_Final_Version.pdf |

### Source Quality Distribution

| Tier | Count | Percent |
|------|-------|---------|
| Gold (primary, original, official) | 9 | 33% |
| Silver (established references, professional bodies) | 15 | 56% |
| Bronze (commentary, secondary analysis) | 3 | 11% |

**Confidence assessment:** HIGH for NASA lifecycle structure, phase names, review names, and program history (all sourced directly from NASA primary documents). HIGH for the origin stories of the Vee, spiral, and waterfall models (sourced from original papers or well-documented historical accounts). MEDIUM for the precise 2023 edition changes in ISO/IEC/IEEE 15288 (the full standard text was not retrieved; process counts and structure reflect the 2015 edition which the 2023 edition retained with content refinements). MEDIUM for the agile-vs-traditional narrative (sourced from industry analyses that are credible but not authoritative in the way NASA NPRs are authoritative for NASA practice).

---

*Module 9 of 10 in the Systems Engineering research series. See Module 03 (Verification & Validation) for detailed coverage of the test methods applied at each lifecycle review, Module 05 (Risk Management) for the risk-driven decision processes that underlie NASA KDPs, and Module 06 (Configuration Management) for the baseline management that each review formalizes.*
