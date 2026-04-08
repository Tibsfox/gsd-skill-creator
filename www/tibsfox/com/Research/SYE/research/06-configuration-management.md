# Configuration Management

**SYE Research Module 06**
**Systems Engineering Series**

## Abstract

Configuration Management (CM) is the technical and administrative discipline that establishes and maintains consistency between a product's requirements, its design, its as-built physical realization, and the documentation that describes all three. On a program the size of Apollo, which produced several hundred thousand engineering drawings and managed a bill of materials that reached roughly two million parts for the Saturn V and Command-Service-Lunar Module stack, CM is not clerical housekeeping. It is the nervous system that keeps a distributed engineering organization coherent across decades, contractors, and revisions. When CM fails, the consequences are not abstract: flight hardware ships that does not match the drawings, spares cannot be built because the tooling has been scrapped and the supplier has exited the business, and a change intended for one subsystem silently invalidates the qualification of another. This module surveys the fundamentals of configuration management as codified in EIA-649 (the SAE consensus standard) and ISO 10007, walks through the five CM functions, explains baselines and their relationship to the formal review chain, describes how Configuration Control Boards and Engineering Change Proposals make change visible and deliberate, discusses version control for hardware and its differences from software source control, and connects all of this to the digital thread and digital twin concepts that dominate current practice on programs like SLS and Orion. Real examples from Apollo, Shuttle, and Artemis anchor the theory.

## 1. Why Configuration Management Exists

Engineering begins as a conversation. Requirements are written, drawings are released, analyses are performed, parts are procured, assemblies are integrated, tests are run. At each step the product diverges slightly from the previous description of itself. A bracket is redesigned to clear a harness that moved. A resistor is substituted because the original part went on allocation. A software patch is loaded to fix a timing bug discovered during thermal-vacuum testing. Each of these changes is individually reasonable. Taken together, and left uncontrolled, they produce a vehicle that no single person fully understands and that no document accurately describes.

Configuration management is the discipline that prevents that drift. Its job is to ensure, at any moment, that an authoritative answer exists to three questions: what did we say we were going to build, what did we actually build, and how do the two differ. The answers must be traceable to a decision, that decision must be traceable to an authority, and that authority must be traceable to a signed record. This is not bureaucracy for its own sake. It is what allows a failure investigation to determine whether the anomaly was a build deviation or a design flaw, it is what allows a part to be replaced ten years after delivery without inadvertently introducing a new failure mode, and it is what allows a successor program to understand why the original design chose the value it chose.

The modern formal statement of these responsibilities is EIA-649, _National Consensus Standard for Configuration Management_, first issued in 1998 and now maintained by SAE International as EIA-649D. Its international counterpart is ISO 10007, _Quality management — Guidelines for configuration management_. Both documents describe the same underlying discipline in slightly different vocabularies, and both are invoked by reference in program-level CM requirements such as NASA NPR 7120.5 and DoD MIL-HDBK-61. The five CM functions in the sections that follow are drawn directly from EIA-649 and have become the universal organizing framework.

## 2. The Five CM Functions

EIA-649 decomposes configuration management into five interlocking functions. Each has a distinct purpose, each produces distinct artifacts, and each must be performed on every program regardless of size, though the formality scales with risk.

### 2.1 CM Planning and Management

The first function is to decide how the other four will be done on this particular program. CM planning produces the Configuration Management Plan (CMP), which specifies the tools, the CI selection criteria, the baseline timing, the change authority thresholds, the audit schedule, the metrics, the training requirements, and the interfaces to supplier CM. On NASA programs the CMP is required by NPR 7120.5 and is reviewed at the System Requirements Review. On a typical large aerospace program it runs to somewhere between fifty and two hundred pages, and it is a living document: it is updated as the program moves between life-cycle phases and as lessons are learned.

Planning also assigns roles. A program will name a Configuration Manager, who owns the process, and Configuration Management Officers within each organization involved. The Configuration Manager is not the person who approves changes — that is the Change Control Board — but is the person who ensures that changes are properly submitted, dispositioned, recorded, and communicated.

### 2.2 Configuration Identification

Configuration identification is the act of deciding what is under CM and what is not. The unit of control is the Configuration Item (CI). A CI is an aggregation of hardware, software, firmware, documentation, or any combination, that is treated as a single entity for the purpose of configuration control. Selecting CIs is a design decision in its own right, because it determines the granularity at which change is tracked. Choose CIs too coarsely and a small change forces a large CI revision; choose them too finely and the CM system drowns in paperwork.

Typical selection criteria include whether the item has an independent development schedule, whether it interfaces with another organization or contractor, whether it has its own qualification or acceptance test, whether it is subject to safety, security, or regulatory controls, and whether it will be procured as a spare. On Apollo, each stage of the Saturn V was a CI, as were each guidance computer, each major instrument, and each of the environmental control subsystems. On the Space Shuttle Orbiter, the CI list included the Orbiter itself, each of the Main Engines, each of the Solid Rocket Boosters, the External Tank, and hundreds of lower-level items down to individual flight software loads.

Each CI receives a part number, a nomenclature, and a naming structure that is unique within the program namespace. Naming conventions matter. A good convention encodes the organization (which contractor or center), the system (which subsystem tree), the type (drawing, specification, analysis, software), and a sequential identifier, typically with a revision suffix. For example, an Apollo-era North American Rockwell drawing number of the form V16-310000 identifies vehicle (V), subsystem (16 = structures), and serial number within that subsystem. Modern programs use longer and more structured identifiers because the CI count is higher and because the identifier must survive being passed through multiple PLM systems.

Naming conventions also have to be forward-compatible. A part number that encodes "contractor A" becomes embarrassing when contractor A is acquired, renamed, or terminated. The usual practice is to treat the identifier as opaque once assigned, and to maintain the semantic mapping in a separate catalog.

### 2.3 Configuration Control

Configuration control is the function that decides which proposed changes to the current configuration are accepted and which are rejected. It is the most visible of the five functions, because it is where disagreements about direction get resolved, and it is where the Change Control Board and the Engineering Change Proposal live. These are covered in detail in Sections 4 and 5 below.

Configuration control operates against a baseline. Before a baseline exists, a document is in development and can be changed by the authoring engineer at will. Once a baseline is established, the document is under CM, and changes require formal action. The point of baselining is to freeze the reference against which change is measured, so that two people talking about "the design" have a common understanding of what that means.

### 2.4 Configuration Status Accounting

Configuration status accounting (CSA) is the record-keeping function. It answers questions like: what is the current revision of this drawing, which ECP introduced this change, what is the disposition of this deviation request, which CCB meeting decided this issue, what version of the flight software was loaded on this vehicle at this test, and what is the as-built serial number list for this assembly. CSA is the function that gets asked the most questions and receives the least glory.

On a well-run program CSA is automated, queryable, and backed up. On Apollo it was done on paper and card files maintained by dedicated CM clerks, and the fact that it worked at all is a remarkable organizational achievement. On a modern program it is done in a PLM system such as Siemens Teamcenter, PTC Windchill, or Dassault ENOVIA. Either way, the quality of CSA determines whether an accident investigation can actually reconstruct what flew.

### 2.5 Configuration Verification and Audits

The fifth function is the one that closes the loop: periodic verification that the product actually matches the documentation. This is done primarily through two formal audits.

The Functional Configuration Audit (FCA) verifies that the item as built meets its performance requirements. It is performed before the Physical Configuration Audit and before the item is declared ready for production. The FCA reviews test results against the specification, confirms that all requirements have been verified, and identifies any verification gaps.

The Physical Configuration Audit (PCA) verifies that the item as built matches its drawings and its bill of materials. The PCA walks through the actual hardware, compares part numbers and revisions against the released drawing tree, and confirms that any deviations or waivers are properly documented. The PCA establishes the product baseline, which then governs all follow-on production units.

A program that skips or rushes the PCA is a program that will later discover it cannot build spares. Parts will be found on the aircraft or spacecraft that do not appear on any drawing, parts will appear on drawings that do not exist on the hardware, and the supply chain will have to reverse-engineer the delivered configuration before it can reproduce it. This is not a theoretical problem. It is the main reason the Space Shuttle heritage program had so much difficulty sourcing replacement components after the suppliers' original tooling had been scrapped.

## 3. Baselines

A baseline is a formally approved description of a product at a specific point in its life cycle. Baselines are established at the major reviews, each one representing a progressively more detailed and more binding definition of what the product is. Three baselines are universally recognized.

The **functional baseline** is established after the System Requirements Review (SRR). It consists of the system-level requirements specification. Once it is baselined, the program commits to building a system that meets those requirements; any change to them is a Class I change (see Section 5) and requires customer approval. The functional baseline answers the question "what will this system do?"

The **allocated baseline** is established after the Preliminary Design Review (PDR). It consists of the item-level specifications, one per CI, which together allocate the system-level requirements down to the CI level. Once it is baselined, each contractor or development team has a contract, in effect, with the rest of the program: build an item that meets this spec, and the system will meet its parent requirements. The allocated baseline answers the question "what will each piece do?"

The **product baseline** is established after the Critical Design Review (CDR), formalized at the FCA and PCA, and finalized when the first production unit is accepted. It consists of the as-built documentation tree: drawings, part lists, software versions, interface control documents, and the complete set of records that describe how the item is actually manufactured, tested, and accepted. The product baseline answers the question "what does this piece look like and how do we build another one?"

There are further baselines that some programs use — an _allocated_ baseline refinement called the "design-to" baseline, a "build-to" baseline at manufacturing release, and a "flight" baseline at vehicle delivery — but the functional, allocated, and product trio is the universal core. Every program recognizable as a program has these three.

The relationship between the baselines and the review chain is deliberate. Each review exists to verify that the work supporting the next baseline is ready, and each baseline is the work product that the review authorizes. SRR authorizes the functional baseline, PDR authorizes the allocated baseline, CDR authorizes the movement toward the product baseline, and FCA and PCA close out the product baseline. Skipping a baseline is skipping the review that would have caught the problems.

## 4. Change Control Boards

A Change Control Board (CCB) is a standing committee with the authority to approve or reject proposed changes to a baseline. Its composition is specified in the CMP and is chosen to ensure that every perspective likely to be affected by a change is represented at the table when the change is decided.

A typical program-level CCB includes the Program Manager (or delegate), the Chief Engineer or System Engineering Manager, the CM Manager, representatives from each major subsystem, a representative from Manufacturing, a representative from Quality Assurance, a representative from Safety and Mission Assurance, a representative from Integrated Logistics Support, a representative from the customer or customer liaison, and a representative from Contracts when the change has commercial implications. Depending on the change, additional experts may be invited as advisors, but the voting membership is fixed.

The CCB's decision criteria are not arbitrary. Each change proposal is reviewed against a defined set of questions: Is the change necessary? Is the technical approach sound? Has the impact been correctly assessed across all affected items, documents, tests, and interfaces? Is the cost estimate credible? Is the schedule impact acceptable? Has Safety concurred? Has the customer concurred where required? Are the implementation, verification, and retrofit plans complete? Only when these questions are satisfactorily answered does the CCB approve.

CCBs operate under minutes. Every item presented, every decision made, every dissent recorded, and every action item assigned is captured in the meeting minutes, which are themselves a configuration-controlled document. The minutes serve two purposes. They provide the authoritative record of what was approved, and they provide the evidence trail that a regulator or an accident investigator will later want to follow. On a regulated program like a commercial aircraft seeking certification under DO-178C, the auditor will ask to see the CCB minutes; they had better exist, and they had better be consistent with the change log.

Large programs tier their CCBs. A vehicle-level CCB handles changes that affect multiple subsystems or the system-level specification. Subsystem CCBs handle changes that are contained within a single subsystem. Below that, engineering change boards or equivalent bodies handle drawing-level changes that do not cross interfaces. The tiering is important because it pushes decisions to the level where the expertise lives, while escalating anything with cross-subsystem or programmatic impact.

## 5. Engineering Change Proposals

An Engineering Change Proposal (ECP) is the formal document by which a change to a baseline is requested. It is the primary input to the CCB. An ECP is not a work order and it is not a drawing; it is a request for permission, accompanied by enough analysis to let the CCB make an informed decision.

A complete ECP includes: a description of the problem or opportunity that motivates the change, a description of the proposed change itself, a list of all configuration items affected, a list of all documents that will have to be revised, an impact assessment covering cost, schedule, weight, performance, reliability, safety, producibility, supportability, and any relevant interfaces, a verification plan describing how the change will be proven to work, a retrofit plan if existing units are affected, and a priority assignment.

ECPs are classified, and the classification determines the approval authority.

A **Class I change** is one that affects the contract — typically because it changes a specification, a deliverable, a cost, a schedule milestone, a safety-relevant property, an interface to another contractor or customer, a qualification basis, or a contractual form, fit, or function characteristic. Class I changes require customer (government) approval, not just program approval. On a NASA program, Class I ECPs go to the customer's Configuration Control Board at the Center or Headquarters level.

A **Class II change** is one that is contained within the contractor's authority — typically a drawing correction, a supplier substitution that does not affect form, fit, or function, an internal process change, or a documentation cleanup. Class II changes are approved by the contractor's CCB and reported to the customer, but do not require customer approval.

The distinction matters enormously for schedule. A Class I change might take weeks or months to process because it requires customer review; a Class II change can be dispositioned in a day. Contractors have a natural incentive to classify changes as Class II, and customers have a natural incentive to classify them as Class I. The classification is therefore itself a negotiated item, and the classification rules are typically laid out in the contract CDRL and CMP.

Impact analysis is where a good ECP process earns its keep. A proposed change to a bracket might look trivial, but if the bracket carries a fluid line that penetrates a thermal blanket that sits on a structural panel that is co-cured with an antenna ground plane, the change has to be assessed against thermal, structural, RF, and manufacturing impacts — any one of which could make the change unacceptable. The quality of the ECP is largely the quality of its impact analysis. A rushed or incomplete impact analysis is the single most common cause of a change that is approved, implemented, and then has to be rolled back at higher cost.

### 5.1 Deviations and Waivers

Two closely related instruments handle cases where a change is not wanted but a departure from the baseline is required.

A **deviation** is a pre-production authorization to depart from the requirements on a specific set of units. It is used when, for example, a test article will be built without a feature that would be present on flight hardware, or when a lot of parts will be accepted without meeting a specific tolerance because the tolerance was over-specified. A deviation is granted before the work is done.

A **waiver** is a post-production authorization to accept a departure that has already occurred. It is used when manufactured hardware is found to be out of tolerance or nonconforming, and engineering determines that the nonconformance is acceptable for the intended use. A waiver is granted after the work is done.

Both deviations and waivers are change-controlled, and both are disposition by the CCB (or a designated Material Review Board for lower-level hardware issues). Both are recorded in the CI's as-built record so that the specific units that were accepted under the deviation or waiver can be tracked for the life of the program. A deviation or waiver that is lost is a time bomb, because it means that ten years later no one will remember why unit 027 is different from every other unit.

## 6. Version Control for Hardware

Hardware configuration management superficially resembles software source control — there are versions, there are branches, there are merges — but the resemblance is misleading and has caused trouble on programs that hired software engineers to run hardware CM.

In software, a version is an abstraction over bytes. A change to version 1.2.3 produces version 1.2.4, and both versions exist simultaneously and indefinitely because copying bytes is free. In hardware, a version is an abstraction over physical realizations. A change to drawing Rev A produces drawing Rev B, and from that point forward the Rev A parts that have already been built are still Rev A parts, forever. They cannot be automatically "upgraded" to Rev B, and the program has to decide what to do with them: retrofit, scrap, use-as-is, or segregate for non-flight use.

Hardware CM therefore has to track three intertwined things: the drawing revision, the serial numbers of the units built to each drawing revision, and the disposition of each serial number as changes propagate. This is where serial number effectivity comes in. A change is introduced "effective at serial number 0042," meaning that unit 0041 and earlier remain at the old configuration and unit 0042 and later are at the new configuration. The effectivity is itself recorded, and the CM system has to be able to answer the question "what is the configuration of serial number 0037?" accurately forever.

Larger assemblies add aircraft tail numbers, vehicle numbers, or hull numbers as an additional identifier layer. A Boeing 747 has a line number (sequential off the assembly line) and one or more tail numbers (assigned by operators and transferable). A Space Shuttle Orbiter has a vehicle number (OV-102, OV-103, and so on). The Orion crew module has a vehicle identifier that ties the structural article to its avionics load and its flight software version. The CM system has to maintain the mapping from these high-level identifiers down to the full bill of materials for that specific vehicle.

Lot traceability adds a further wrinkle. Many components — fasteners, seals, adhesives, chemicals — are consumed in lots, and the lot number of the material used in a specific assembly has to be recorded so that, if a bad lot is later identified, every assembly that consumed material from that lot can be located. Apollo programs and all subsequent human spaceflight programs treat lot traceability as non-negotiable. The Shuttle program had several instances where a suspect lot of an adhesive or a crimp connector required the fleet to be searched for affected units; when the records were good, the search took days, and when the records were poor, it took months.

## 7. The Three Configurations

Every deliverable hardware item has three configurations that coexist throughout its life, and a mature CM system tracks all three.

The **as-designed** configuration is the one specified by the released engineering documentation. It is what the design authority says the item should be.

The **as-built** configuration is the one that was actually manufactured and delivered. It reflects every deviation, every waiver, every substitution, and every build-to-print deviation that occurred during manufacturing, and it is captured in the manufacturing record package. The as-built configuration usually differs from the as-designed configuration in small ways, and the point of the PCA is to reconcile the two and to ensure that every difference is documented.

The **as-maintained** configuration is the one that exists on the operating item at any given moment. It reflects every repair, every part replacement, every modification, every field change that has been performed since delivery. For an aircraft, the as-maintained configuration changes constantly — every C-check replaces parts, every airworthiness directive modifies the fleet, every repair after a bird strike or a hail storm alters the structure. For a spacecraft, the as-maintained configuration changes less often in absolute terms but the changes are harder to reverse.

The three configurations are related but distinct, and the gap between them matters. On Apollo, ensuring that the as-built and as-designed configurations matched was a major activity of the Apollo Reliability and Quality Assurance organization at North American Rockwell and Grumman. On the Shuttle, the three configurations were maintained through the life of the fleet, and the Return-to-Flight after Challenger and after Columbia required a full reconciliation of the as-maintained configurations of the surviving Orbiters against the updated as-designed configuration that resulted from the accident investigations.

## 8. Digital Thread and Digital Twin

The modern term for the integrated, end-to-end linkage of the three configurations is the **digital thread**. A digital thread is a data architecture that connects requirements, design, analysis, manufacturing, test, and operational data such that any change in any one of them is visible and traceable to the others. When the requirement changes, the affected drawings are automatically identified; when the drawing changes, the affected test procedures are automatically identified; when the build record is updated, the as-built model of that specific serial number is automatically updated.

A **digital twin** is a related but distinct concept. A digital twin is a virtual model of a specific physical instance — serial number 0042, say — that is kept continuously in sync with that instance throughout its operational life. The twin reflects the as-built starting configuration, every modification applied since, and where the instrumentation supports it, the current operational state. A digital twin is what allows a program to predict the remaining life of a specific unit, not the population average.

SLS and Orion are the first NASA human spaceflight programs to have been designed from the start with digital thread as an explicit architectural goal. The Orion program maintains a Master Model that links requirements, CAD models, analysis models, manufacturing data, and test records in a single PLM environment, with the intent that any serial-number-specific query can be answered from the authoritative source. The ambition is real and the execution is partial; the Orion program has acknowledged that the digital thread is more complete in some domains than in others, and that filling the gaps is ongoing work. But the direction is clear, and the long-term value proposition is that a vehicle built this way can be maintained and modified for decades without the heritage-knowledge evaporation that afflicted Shuttle.

## 9. CM Tools

CM tools have evolved from filing cabinets to card files to mainframe databases to client-server PDM to modern web-based PLM platforms integrated with ERP.

**Siemens Teamcenter** is the dominant PLM platform in large aerospace and defense programs in North America. It provides CI management, change management, document management, bill-of-materials management, CAD integration with NX and Creo and Catia, and workflow automation for ECPs and release processes. Lockheed Martin, Boeing, and several NASA programs run on Teamcenter.

**PTC Windchill** is the second major platform, strong in discrete manufacturing and used by a number of aerospace primes. It integrates with PTC's Creo CAD system and with ThingWorx for connected operations.

**Dassault Systemes ENOVIA**, part of the 3DEXPERIENCE platform, is the third major platform and is strongly associated with Catia-based programs, including many European aerospace programs and Boeing Commercial Airplanes.

ERP integration matters because CM is not just about engineering documentation; it is ultimately about what parts get ordered, what parts get built, and what parts get installed on what serial numbers. A PLM system that is not integrated with SAP, Oracle, or the program's ERP of choice ends up with two sources of truth for the bill of materials, and the two will eventually disagree. The industry consensus is that the PLM system owns the engineering bill of materials and the ERP system owns the manufacturing bill of materials, with a defined synchronization protocol between them. Keeping that synchronization healthy is a continuous operational burden.

Smaller programs and research projects use lighter-weight tools: Aras Innovator (open-source-licensed PLM), Autodesk Vault, SolidWorks PDM, or custom in-house systems. The tool matters less than the discipline; a program that runs its CM on spreadsheets can succeed if the spreadsheets are authoritative, and a program that runs on Teamcenter can fail if the data is stale or uncontrolled.

## 10. Software CM vs. Hardware CM

Software configuration management and hardware configuration management share principles but diverge significantly in practice.

Software CM is built on **source control** (Git, Mercurial, Perforce, Subversion), which treats the versioned unit as a collection of text files, provides cheap branching and merging, and assumes that a version can be recreated from the repository at any time. Software CM also encompasses build management (Make, CMake, Bazel, Maven), dependency management (package managers, lockfiles), and release management (tagged releases, artifact repositories). The whole chain from source to executable is reproducible in principle and increasingly in practice.

Hardware CM is built on **drawing control**, which treats the versioned unit as a released drawing package with an approved revision history, provides expensive branching (physical prototypes) and essentially no merging, and assumes that a version corresponds to a specific set of physical articles that cannot be recreated — only remanufactured, and only if the supply chain for the parts and tools still exists. Hardware CM also encompasses bill of materials management, serial number effectivity, supplier management, and obsolescence management.

Flight software sits at the intersection and has to obey both regimes. The source code is managed in a source control system; the released software load is treated as a configuration item with a part number and a drawing, is approved through the CCB like any other CI, and is tracked as part of the bill of materials on every vehicle it flies on. On Shuttle, each General Purpose Computer flight software load had a release number, was independently verified to a drawing-level specification, and was controlled through the same CCB machinery as the Main Engines. On Orion, the same pattern holds, with the flight software loads managed under the overall vehicle CM.

**DO-178C**, _Software Considerations in Airborne Systems and Equipment Certification_, is the civil aviation standard for software CM and is invoked by the FAA and EASA for certified avionics. It requires a Software Configuration Management Plan, defines baseline and change control requirements, and mandates traceability from requirements through code to test results. **ISO 26262**, _Road vehicles — Functional safety_, is the automotive counterpart and imposes analogous requirements on automotive software. Both standards are far more prescriptive than the general EIA-649 framework because they are invoked in regulatory contexts where independent auditing is required.

NASA's **NPR 7150.2**, _Software Engineering Requirements_, and the broader **NPR 7120.5**, _NASA Space Flight Program and Project Management Requirements_, impose CM requirements on NASA programs. NPR 7120.5 requires a CMP, baseline management, CCB operation, and FCA/PCA as part of the standard program life cycle, with formality scaled to the program classification (Category 1 through 3, with Category 1 being the most rigorous).

## 11. Case Studies

### 11.1 Apollo

Apollo was the configuration management challenge from which many modern practices descend. The Saturn V stack alone contained on the order of two million parts, and the full mission hardware (Saturn V, Command Module, Service Module, Lunar Module) was produced by a sprawling contractor network: Boeing for the S-IC first stage, North American Rockwell for the S-II second stage and the CSM, Douglas Aircraft for the S-IVB third stage, IBM for the Instrument Unit, Grumman for the LM, and thousands of subcontractors and suppliers. The drawing count across the program ran to several hundred thousand.

The CM system that held this together was paper-based, staffed with an army of CM clerks, and governed by a strict CCB hierarchy that ran from the program level at the Manned Spacecraft Center (now Johnson) down through the contractors to the subassembly level. Every change was an ECP, every ECP went to the right CCB, and every decision was recorded. The system worked well enough to fly nine lunar missions and return twelve astronauts safely from the surface, and its lessons directly informed MIL-STD-973 (the predecessor of EIA-649) and the DoD configuration management practice that followed.

The Apollo practice also revealed the limits of paper CM. Reconstructing the as-built configuration of a specific vehicle was a multi-week activity requiring physical searches through filing cabinets at multiple contractors. When an anomaly occurred on the pad or in flight, the time to determine whether it was a generic design issue or a serial-number-specific build issue was sometimes longer than the time available to make a go/no-go decision. The post-Apollo period saw sustained investment in computerized CM, first at the contractor level and then at the program level, specifically to shorten this response time.

### 11.2 Space Shuttle

Space Shuttle inherited the Apollo CM tradition and ran it for thirty years across 135 missions and five flight Orbiters. The program's CM challenge was different from Apollo's: instead of building a fleet once and flying it within a few years, it had to maintain a fleet that flew for three decades across evolving requirements, evolving technology, and evolving safety understanding.

The structural problem Shuttle encountered was that many of its original parts became obsolete over the life of the program. Suppliers exited the business, scrapped their tooling, or refused to requalify their processes for a handful of units per year. The program responded with a mix of strategies: last-time buys that stockpiled decades of spares at delivery, requalification of alternative suppliers, redesign to use available parts, and in extreme cases, resurrection of specialized manufacturing at a NASA center. The CM system was critical to each of these responses because each required a precise understanding of what was originally specified and what could and could not be changed without invalidating qualification.

The Shuttle also developed and refined several CM practices that are now considered standard. Serial number effectivity was used with precision across thousands of changes. The Orbiter Problem Reports and the Solid Rocket Booster In-Flight Anomalies were tracked through a formal anomaly-reporting system tied to the CM database. The Return-to-Flight after Challenger and after Columbia required full reconciliation of the as-maintained configurations of the surviving Orbiters against the updated as-designed configuration, an exercise that took months in each case and whose completion was gated by CM audit.

Shuttle also suffered from the opposite problem: the combinatorial explosion of configuration variants across vehicles. Each Orbiter differed from the others in hundreds of respects — block upgrades applied to some and not others, repairs following specific incidents, instrumentation differences for specific missions — and keeping those differences straight was a continuous CM activity.

### 11.3 SLS, Orion, and Artemis

The current NASA human exploration programs were designed with digital thread as an explicit goal. The Space Launch System (SLS) and the Orion Multi-Purpose Crew Vehicle are managed under NPR 7120.5 with modern PLM infrastructure at Marshall, Johnson, and the prime contractors (Boeing for SLS Core Stage, Northrop Grumman for SLS Boosters, Aerojet Rocketdyne for RS-25 engines, Lockheed Martin for Orion). The Artemis program as a whole adds the Human Landing System (SpaceX Starship HLS) and the Lunar Gateway, each with its own CM under a program-wide integration.

The stated digital-thread ambition is to have a single authoritative source of configuration data that spans requirements, design, manufacturing, test, and operations for every vehicle serial number. The reality in 2026 is partial: some subsystems are fully integrated, others are connected only at the document level, and the seams between the primes and NASA are still a source of friction. The Artemis I mission in 2022 exposed configuration issues between ground systems and flight hardware that required real-time workarounds; post-flight reviews identified CM improvements that are being incorporated into Artemis II and beyond.

The long-term bet is that a program built on a digital thread will be maintainable for the decades that a lunar or Mars transportation system will need to operate, in a way that Shuttle, built on paper-then-retrofitted-to-databases, could not be. Whether the bet pays off is one of the open questions that the next decade of Artemis operations will answer.

## 12. Process and Workflow

A canonical CM process looks like this, from the perspective of a single change:

```
┌─────────────────────────────────────────────────────────────┐
│                   CM PROCESS OVERVIEW                        │
│                                                              │
│   [CM Planning] ──► [Identification] ──► [Control]          │
│         │                │                  │               │
│         │                ▼                  ▼               │
│         │          [CI Registry]       [CCB / ECP]          │
│         │                │                  │               │
│         ▼                ▼                  ▼               │
│   [Status Accounting] ◄──┴──────────────────┘               │
│         │                                                    │
│         ▼                                                    │
│   [Verification & Audits: FCA / PCA]                         │
└─────────────────────────────────────────────────────────────┘
```

And the ECP workflow, from request to closure, looks like this:

```
   Problem or opportunity identified
              │
              ▼
   ECP drafted (description, affected items,
              impact analysis, verification plan)
              │
              ▼
   Classification (Class I or Class II)
              │
              ▼
     ┌────────┴────────┐
     │                 │
     ▼                 ▼
 Contractor CCB    Customer CCB
     │                 │
     │            (Class I only)
     │                 │
     └────────┬────────┘
              │
              ▼
      Approved? ──No──► Rejected / Return for rework
              │
             Yes
              │
              ▼
   Implementation (drawings revised,
              parts built, software rebuilt)
              │
              ▼
   Verification (test, analysis, inspection)
              │
              ▼
   Incorporation into baseline
              │
              ▼
   Status accounting updated
              │
              ▼
   ECP closed
```

The boxes are simple; the content inside each box is where the engineering happens. A single ECP on a complex program can involve dozens of engineers, weeks of analysis, and multiple iterations through the CCB before it is approved.

## 13. Metrics and Health Indicators

A healthy CM process produces measurable indicators. Programs typically track:

- **ECP cycle time**: median days from ECP submission to CCB disposition. Rising cycle time is a warning sign.
- **ECP backlog**: number of open ECPs. A persistent backlog indicates insufficient CCB capacity or an overwhelmed change management process.
- **Class I to Class II ratio**: Too many Class I changes suggest immature requirements; too few suggest misclassification.
- **Deviation and waiver count**: Rising deviation and waiver counts on flight hardware are a red flag for manufacturing maturity.
- **PCA findings**: Number of discrepancies found between as-built and as-designed during the Physical Configuration Audit. Above-trend findings indicate poor shop floor discipline.
- **Document currency**: Fraction of released documents at the current revision. Low currency indicates that revisions are not propagating through the organization.

These metrics are reported to program management and are reviewed at major reviews. They are also reviewed by the customer, which means that a program's CM metrics are directly visible to the funding authority — an incentive alignment that sharpens the program's attention on CM quality.

## 14. Takeaways

Configuration management is the discipline that lets large, long-lived engineering programs stay coherent. It is codified in EIA-649 and ISO 10007, decomposed into five functions (planning, identification, control, status accounting, verification), and organized around baselines established at SRR, PDR, and CDR. It uses Change Control Boards to approve changes and Engineering Change Proposals as the vehicle for those changes, with Class I changes requiring customer approval and Class II changes staying within contractor authority. It tracks three configurations — as-designed, as-built, as-maintained — and the modern digital thread aims to keep all three in sync across the life cycle, supported by PLM tools like Teamcenter, Windchill, and ENOVIA. Software and hardware CM share principles but diverge in execution, with software controlled through source control and hardware through drawing control and serial number effectivity.

The lessons of Apollo, Shuttle, and the ongoing Artemis program converge on the same point: CM is not overhead, it is infrastructure, and programs that treat it as overhead pay for that treatment in the currencies of schedule, cost, safety, and sometimes lives. The Apollo program built a paper CM system rigorous enough to fly lunar missions. The Shuttle program maintained a fleet for thirty years by enforcing strict CM through obsolescence, redesign, and post-accident reconciliation. The Artemis program is betting that a digital thread built from the start will let the next era of human spaceflight be maintainable in a way its predecessors could not be. Each era learned from the one before, and each era added a layer to the practice that the next inherited.

For a systems engineer, the operational question is never "should we do CM" but "how much formality does this program need, how do we set it up, and how do we keep it healthy." The answer depends on program scale, life-cycle length, safety class, regulatory environment, and customer expectations. But the functions are the same on every program: plan, identify, control, account, and audit. Get those five right and the program has a chance. Get them wrong and no amount of engineering talent downstream will compensate.

## References

- SAE International / Electronic Industries Alliance, _EIA-649D: Configuration Management Standard_, current revision.
- International Organization for Standardization, _ISO 10007: Quality management — Guidelines for configuration management_.
- NASA, _NPR 7120.5: NASA Space Flight Program and Project Management Requirements_.
- NASA, _NPR 7150.2: NASA Software Engineering Requirements_.
- U.S. Department of Defense, _MIL-HDBK-61: Configuration Management Guidance_.
- RTCA / EUROCAE, _DO-178C: Software Considerations in Airborne Systems and Equipment Certification_.
- International Organization for Standardization, _ISO 26262: Road vehicles — Functional safety_.
- INCOSE Systems Engineering Handbook, current edition, chapter on Configuration Management.
- NASA Systems Engineering Handbook (SP-2016-6105 Rev 2), section on Technical Data Management and Configuration Management.
- Apollo Program historical documentation, NASA History Office, on Apollo configuration and quality assurance practices.
- Space Shuttle Program Final Report on configuration management and heritage parts management.

---

**SYE Module 06** — Configuration Management
Part of the Systems Engineering research series.
