# Interface Management and Interface Control Documents

Module: **INTERFACES** | Series: Systems Engineering (SYE) | Status: Reference Document

> If you want to know where a large system will fail, look at the interfaces. The inside of a subsystem is usually fine — it has one team, one schedule, one set of conventions, and the people who build it understand it. The moment two subsystems meet, all of that stops being true. Two teams, two schedules, two cultures, two sets of units, two interpretations of the word "baseline," and a document between them that no one has read in nine months. Systems engineering as a discipline exists in large part because interfaces do not manage themselves. This module is about how the profession has learned to keep interfaces honest.

**Cross-references:** [SYE/01] Foundations of Systems Engineering, [SYE/02] Requirements Engineering, [SYE/03] Architecture and Design, [SYE/04] Verification and Validation, [SYE/05] Risk and Margin Management, [SYE/06] Configuration Management

---

## Table of Contents

1. [Why Interfaces Are Where Systems Fail](#1-why-interfaces-are-where-systems-fail)
2. [Identifying Interfaces: The N-Squared Diagram](#2-identifying-interfaces-the-n-squared-diagram)
3. [IRDs and ICDs: What Each Document Does](#3-irds-and-icds-what-each-document-does)
4. [The Anatomy of an Interface Control Document](#4-the-anatomy-of-an-interface-control-document)
5. [Types of Interfaces](#5-types-of-interfaces)
6. [The ICD Lifecycle and Change Control](#6-the-icd-lifecycle-and-change-control)
7. [Interface Verification](#7-interface-verification)
8. [The Political Dimension: ICDs Between Organizations](#8-the-political-dimension-icds-between-organizations)
9. [Case Studies: Interfaces That Worked, Interfaces That Failed](#9-case-studies-interfaces-that-worked-interfaces-that-failed)
10. [Practical Templates and Examples](#10-practical-templates-and-examples)
11. [Sources](#11-sources)

---

## 1. Why Interfaces Are Where Systems Fail

### 1.1 The Structural Argument

A system of any interesting size is built by more than one team. The Apollo Command and Service Module was built by North American Aviation in Downey, California. The Lunar Module was built by Grumman on Long Island. The Saturn V first stage was built by Boeing in Michoud, Louisiana. The second stage was built by North American at Seal Beach. The third stage was built by Douglas at Huntington Beach. The instrument unit was built by IBM in Huntsville. Each of those teams was competent. Each of those stages worked. And yet the reason the Apollo program survived its first decade is not that any one of those contractors did their job well — it is that the interfaces between them were specified, controlled, verified, and enforced through a document regime that, at the time, was unprecedented in American industry.

The structural argument for interface management goes like this. If you have N subsystems, the number of possible pairwise interfaces is N times N minus one, divided by two — which grows as the square of N. A five-subsystem project has ten possible interfaces. A fifty-subsystem project has 1,225 possible interfaces. A five-hundred-subsystem project (Apollo, ISS, SLS-class) has over 124,000 possible pairwise interfaces, of which perhaps a few thousand are actually used. The inside of each subsystem scales linearly with project size. The interface problem scales quadratically. At some threshold — empirically around twenty to fifty subsystems — interface management consumes more engineering effort than any single subsystem, and failure to manage interfaces becomes the dominant project risk.

### 1.2 The Organizational Argument

Interfaces are also where organizations clash, and this is separate from the technical problem. Two teams building two subsystems will, if left alone, make locally optimal decisions. The team building the power subsystem will pick the voltage that makes their batteries and inverters simple. The team building the avionics subsystem will pick the voltage that makes their FPGAs and processors simple. If those two voltages are different and nobody notices until integration, one team is going to lose an argument, redesign their hardware, and miss a schedule. In a small company this is resolved by the two teams walking over to each other's desks. In a large aerospace program it is resolved — or more accurately, prevented — by writing the interface down before either team starts detailed design.

The organizational argument is that ICDs are not primarily technical documents. They are peace treaties. They exist because the cost of renegotiating an interface after hardware exists is an order of magnitude higher than the cost of negotiating it on paper. A well-run program treats the signed ICD as an inviolable contract between the two sides of the interface, with changes allowed only through a formal change control process that both sides participate in. A poorly run program treats the ICD as a document that gets updated whenever somebody notices a discrepancy — which means the document no longer reflects reality, which means subsystem teams stop reading it, which means the next integration is going to be painful.

### 1.3 The Requirements Argument

Requirements slip through cracks at interfaces. This is the third reason interfaces fail: a requirement that belongs to the interface between subsystem A and subsystem B often ends up in neither subsystem's requirements document. The team building subsystem A assumes the team building subsystem B will handle it. The team building subsystem B assumes the team building subsystem A will handle it. Nobody owns the requirement. At integration, the requirement is discovered missing, and a finger-pointing exercise begins.

A canonical example: grounding. A spacecraft avionics bay has dozens of boxes, each built by a different vendor, each with its own power and signal grounding conventions. If the program does not specify a single-point ground, a distributed ground, or some hybrid scheme in the ICDs — and does not specify which box is responsible for bonding to the structure and which boxes are floating — the result at integration is ground loops, common-mode noise on sensor lines, and subtle bit errors on digital buses that take months to debug. Grounding belongs to no single box. It belongs to the interface. If the ICD does not capture it, nobody owns it.

The classic failure mode is the interface requirement that is "obvious" to both teams but different in the heads of each team. The Mars Climate Orbiter loss in 1999 is the textbook example: Lockheed Martin delivered thrust data in pound-force-seconds, and JPL's navigation software expected newton-seconds. Both teams believed the interface was obvious. Neither team was entirely wrong about what it was supposed to be. The ICD did not unambiguously specify the units, and the review process did not catch the discrepancy. A 125-million-dollar spacecraft entered the Martian atmosphere instead of orbit and was destroyed.

---

## 2. Identifying Interfaces: The N-Squared Diagram

### 2.1 The Basic N² Diagram

Before you can control interfaces, you have to enumerate them, and the enumeration problem is harder than it sounds. A large system has thousands of potential interfaces and only a subset of them are actually exercised. Finding that subset reliably, without missing any, is the purpose of the N-squared diagram — called N² (N-squared) because for N subsystems it is an N-by-N matrix.

The construction rules are simple and have been used essentially unchanged since the Apollo era:

1. List the N subsystems or functions down the diagonal of an N×N matrix. The diagonal cells contain the subsystem names; they have no outputs to themselves and no inputs from themselves.

2. Off-diagonal cells represent interfaces between subsystems. By convention, outputs flow horizontally out of the diagonal to the right, and inputs arrive vertically from below. So the cell at row i, column j, where i is not equal to j, represents an interface in which subsystem i on the diagonal sends something to subsystem j on the diagonal.

3. Fill each populated off-diagonal cell with a short description of what crosses the interface — "28V bus power," "MIL-STD-1553B command bus," "thermal conduction path," "crew verbal handoff," or a single-letter code with a legend. Empty cells represent interfaces that do not exist.

4. The result is a visual enumeration of every interface in the system. You can see at a glance which subsystems are highly coupled (rows and columns with many populated cells) and which are loosely coupled. You can also see asymmetries: a subsystem that produces a lot but consumes little, or vice versa.

### 2.2 Why the N² Diagram Catches What Other Methods Miss

The power of the N² diagram is not the diagram itself — it is the discipline of having to look at every off-diagonal cell and decide whether it is populated or not. You cannot leave a cell ambiguous. Either something crosses the interface or it does not. When a team sits in a room and walks every cell, they catch interfaces that the design documentation does not mention, because somebody says "wait, does the GNC computer actually talk to the reaction control system directly, or only through the flight computer?" and a discrepancy surfaces that nobody had noticed because each team had been drawing their own block diagrams in isolation.

A standard practice on large programs is to hold an N² walk in the first month of a phase, with representatives from every subsystem in the room. The facilitator goes cell by cell and asks: "Does [subsystem i] send anything to [subsystem j]? If so, what, and through what medium?" Disagreements are logged. Decisions are made in real time or deferred to action items. At the end of the meeting, the program has an enumerated list of every interface, which becomes the seed list for the ICD tree.

### 2.3 Hierarchical N² Diagrams

On large programs, a single N² diagram does not scale. A program like the Space Shuttle or ISS has hundreds of subsystems, and a 100×100 matrix is not readable. The solution is hierarchical decomposition: a top-level N² diagram at the system level shows half a dozen major elements (Orbiter, External Tank, Solid Rocket Boosters, Ground Systems, Payload for Shuttle; or Orion, SLS, EGS, ML for Artemis). Each cell that is populated at the top level is then expanded into its own N² diagram at the next level down.

This mirrors the product breakdown structure (PBS) and the work breakdown structure (WBS). The top-level N² captures the half-dozen program-level interfaces that require program-level ICDs and program-level change control. The element-level N² captures subsystem interfaces that require element-level ICDs. The subsystem-level N² captures component interfaces that can often be managed within a single contractor's internal engineering process. The hierarchy of ICDs follows the hierarchy of N² diagrams.

### 2.4 What an N² Diagram Does Not Capture

The N² diagram is good for enumeration but not for temporal behavior. It tells you that subsystem A sends a 28V power signal to subsystem B, but it does not tell you the timing — whether the power is always on, on for specific phases, on only during initialization. A timing diagram or sequence diagram supplements the N² view. Similarly, the N² diagram does not capture the loading on an interface: how much bandwidth on that 1553 bus is actually used, what happens if both ends try to transmit simultaneously, what the worst-case latency is. These are interface requirements that belong in the IRD and ICD but do not fit on the N² grid.

---

## 3. IRDs and ICDs: What Each Document Does

The terminology here is one of the most confused in systems engineering, because different organizations use the terms differently. The canonical distinction, as articulated in NASA JSC 26557 and reinforced by INCOSE guidance, is that an **Interface Requirements Document (IRD)** specifies *what* the interface must do, and an **Interface Control Document (ICD)** specifies *how* the interface does it.

The IRD captures requirements in the form "the interface between A and B shall provide no less than 100 watts of continuous power at 28 VDC ± 2 V." It is verifiable. It is traceable to higher-level system requirements. It is owned jointly by the two subsystem teams and is under change control. The IRD does not specify connector type, pin assignments, or cable length. It specifies performance.

The ICD takes the IRD as an input and captures the design of the interface. It specifies the connector (e.g., MIL-DTL-38999 Series III shell size 13, 24 contacts), the pin assignments, the cable shielding and length, the inrush current behavior, the protection circuits, the drawings, and the verification methods. It is the "build-to" document — the thing a technician on the floor and an engineer writing a test procedure can both read and produce consistent hardware and consistent tests from.

On small programs or simple interfaces, the IRD and ICD are combined into a single document. On large programs, they are separated because they are owned by different groups and change at different rates. The IRD tends to be owned by systems engineering and baseline-controlled with the rest of the requirements set; the ICD tends to be owned by design engineering and baseline-controlled at a later milestone (often PDR or CDR).

A useful analogy: the IRD is to the ICD as the Software Requirements Specification is to the Interface Design Document in software engineering. The requirement is "provide a REST endpoint that returns user profile data within 100 ms at 95th percentile." The design is "endpoint is GET /api/v2/users/{id}, content-type application/json, schema is as follows, timeouts are as follows." You can verify the requirement independently of the design; you can change the design (add caching, rewrite in Rust, move to a new hostname) without changing the requirement.

---

## 4. The Anatomy of an Interface Control Document

NASA JSC 26557, the Johnson Space Center standard for ICD preparation, and similar guidance from INCOSE and DoD, converge on a structure that most programs adopt with minor variations. A full ICD has the following sections:

### 4.1 Scope

A paragraph or two stating what the ICD covers and what it does not cover. "This document defines the mechanical, electrical, and data interfaces between the Orion Crew Module and the Orion European Service Module, as established by the joint NASA-ESA program." It explicitly names the two sides of the interface. It states what level in the architecture the ICD sits at (program level, element level, subsystem level). It states which phase of the program the baseline applies to.

### 4.2 Applicable Documents

A list of every document referenced in the ICD with its revision number and date. This typically includes the higher-level system requirements document, the IRD, relevant standards (MIL-STD, ASTM, IEEE, etc.), and any related ICDs. The rule is that if a document is referenced, it is listed; if it is listed, it is under configuration control; if the referenced document changes, the impact on this ICD must be assessed.

### 4.3 Interface Description

A narrative description of the interface, typically with a diagram showing the physical and functional relationship between the two sides. This section is for orientation — it helps a reader who is new to the interface understand what is going on before they dive into the requirements. It is not normative. The binding content is in the requirements section.

### 4.4 Interface Requirements

The normative heart of the document. Each requirement is numbered, stated as a "shall" statement, and tagged with a verification method (inspection, analysis, demonstration, test — the four canonical verification methods in aerospace SE). Requirements are grouped by type: mechanical, electrical, thermal, data, fluid, etc. Each group contains everything about that aspect of the interface:

- Mechanical: envelope dimensions, mounting provisions, alignment tolerances, structural load paths, load transmission, fastener types and torques, keep-out zones, dynamic envelope during deployment or motion, thermal expansion allowances.

- Electrical: power (voltage, current, ripple, inrush, fault behavior), signals (bus type, protocol, voltage levels, impedance, signal integrity), grounding, bonding, shielding, connector types and pin assignments, cable specifications.

- Data: protocols used (1553B, TTEthernet, CAN, SpaceWire, RS-422, Ethernet), message formats, timing (update rates, latency, jitter), bandwidth allocation, error handling, startup and initialization sequences, failure modes.

- Fluid: pressures, flow rates, temperature ranges, contamination limits, leak rates, fill and drain procedures, compatibility with materials, quick disconnect specifications.

- Thermal: conductive paths, radiative coupling, required contact resistances, thermal interface materials, radiator view factors.

- EMI/EMC: conducted emissions and susceptibility limits, radiated emissions and susceptibility limits, reference standards (MIL-STD-461 is the canonical one in US aerospace).

- Software APIs: function signatures, data structures, error codes, threading model, memory ownership, startup and shutdown sequences.

- Operational: who does what, when, in what order; crew procedures that cross the interface; ground command sequences; telemetry formats; anomaly responses.

Each requirement must be verifiable. A requirement that cannot be verified is not a requirement — it is a hope. "The interface shall be reliable" is not acceptable. "The interface shall exhibit a bit error rate no greater than 1 × 10⁻⁹ measured over a 24-hour continuous operation at specified environmental conditions" is acceptable.

### 4.5 Verification

This section states how each requirement will be verified and who is responsible. It often takes the form of a verification matrix: each requirement on a row, and columns for verification method, verification phase (development, qualification, acceptance, integration, flight), responsible party (NASA, contractor A, contractor B, joint), and reference to the verification procedure or test plan.

### 4.6 TBD / TBR List

Every ICD in the real world has unresolved items. "To Be Determined" (TBD) means nobody knows the value yet. "To Be Resolved" (TBR) means there is a proposed value but it has not been agreed. The TBD/TBR list is a table of every such item with a closure date, an owner, and a status. Managing the burndown of TBDs and TBRs is one of the primary activities of interface management during the design phase. An ICD with dozens of TBDs at CDR is a program in trouble.

### 4.7 Signatures

An ICD is a contract. It is signed by both sides of the interface and by the program authority that will enforce it. On a NASA contractor interface, that typically means the NASA subsystem manager, the contractor subsystem manager, the NASA program interface manager, and sometimes the project manager. The signature page is the legal artifact that makes the document binding.

### 4.8 Revision History

Every ICD maintains a revision history recording who changed what, when, why, and under what change request. This is boring and tedious and absolutely essential. Without it, six months after a change, nobody can reconstruct why the change was made, and engineers start undoing changes because they look wrong.

---

## 5. Types of Interfaces

### 5.1 Mechanical Interfaces

Mechanical interfaces deal with physical coupling between structures. The controlled parameters include the envelope (the volume one side is allowed to occupy relative to the other, including dynamic envelope during motion), mounting provisions (bolt patterns, shear pins, alignment features, fastener specifications, torque values, preload requirements), load transmission (how forces and moments pass through the interface and what the load capacity is), and thermal expansion (how differential expansion is accommodated without inducing stress or misalignment).

A classic mechanical ICD is the one between a spacecraft and its launch vehicle payload adapter. It specifies the bolt circle diameter, the fastener size and material, the preload, the envelope the spacecraft is allowed to occupy inside the fairing (including dynamic envelope during fairing flex and vibration), the maximum allowable mass and center of mass location, the coupled loads analysis inputs, and the separation mechanism characteristics. Every launch vehicle publishes a Payload User's Guide that is essentially a pre-negotiated ICD template for mechanical interface.

### 5.2 Electrical Interfaces

Electrical interfaces split into power interfaces and signal interfaces, and the two have very different characteristics.

Power interfaces specify the voltage (nominal and tolerance), current (continuous and peak), ripple and transient behavior (including response to load steps), inrush current (what happens when the load is first connected), fault current (what happens when the load shorts), and protection (fuses, current limiters, foldback behavior). Grounding is part of the power interface and is often the most contentious item: single-point ground, multi-point ground, chassis ground versus signal ground, bonding to structure, isolation. A power interface that does not specify grounding clearly will produce ground loops, common-mode noise, and, in extreme cases, burned-out electronics during integration.

Signal interfaces specify the physical layer (voltage levels, impedance, drive strength, receiver thresholds, connector, cable) and the protocol layer (bit rate, encoding, framing, timing, error detection, addressing). Standard aerospace buses like MIL-STD-1553B, SpaceWire, TTEthernet, CAN, and RS-422 bring large pre-defined chunks of this specification for free — the ICD only needs to specify the bus usage and allocation, not the physical details. Custom interfaces require the full specification.

### 5.3 Data Interfaces

Data interfaces can overlap with signal interfaces but are specified at a higher level of abstraction. A data interface specifies the message formats (what data fields, in what units, in what byte order, at what update rate), the timing (when messages are sent, latency requirements, jitter tolerances), the bandwidth allocation (how much of the bus belongs to this data), the error handling (what happens if a message is missed or corrupted), and the startup behavior (how the interface initializes, how each side discovers the other, how state is re-established after a fault).

A common data interface failure is the silent unit mismatch. The Mars Climate Orbiter loss was a data interface failure: the interface specified "impulse," one side computed it in pound-force-seconds, the other side consumed it in newton-seconds. The protocol transport was fine. The data format was fine. The units were wrong. The fix in modern aerospace practice is to specify units explicitly in the ICD for every scalar field, and to include unit tests that catch unit mismatches during verification.

### 5.4 Fluid Interfaces

Fluid interfaces deal with hydraulic, pneumatic, propellant, coolant, and gas transfer between subsystems. Controlled parameters include pressure (operating and proof and burst), flow rate, temperature range, fluid composition and contamination limits, leak rate, fill and drain procedures, material compatibility, seal specifications, and quick disconnect characteristics. Fluid interfaces are among the most dangerous because they can produce energetic releases if they fail. Hypergolic propellant transfer interfaces are a canonical example — the ICD has to specify the coupling mechanism, the purge gas, the leak detection, the emergency separation, and the procedures for handling a leak.

### 5.5 Thermal Interfaces

Thermal interfaces describe how heat flows between subsystems. Conductive thermal interfaces specify the contact area, contact pressure, thermal interface material, and the required thermal resistance across the joint. Radiative thermal interfaces specify view factors, emissivities, and temperature boundaries. A subsystem may require that its neighbors hold their external surface temperature within a range so that radiative coupling keeps the subsystem in its operating envelope — this is a thermal interface requirement and belongs in the ICD.

### 5.6 EMI / EMC Interfaces

Electromagnetic compatibility interfaces are specified largely by reference to standards. MIL-STD-461 (requirements for the control of electromagnetic interference characteristics of subsystems and equipment) defines the test methods and limits. MIL-STD-464 defines the system-level requirements. The ICD typically says "the box shall meet MIL-STD-461 CE102, CS101, RE102, and RS103 at the limits specified in Table X." Custom limits beyond the standard are sometimes required for sensitive instruments or for interfaces with known emitters nearby.

### 5.7 Software API Interfaces

Software interfaces between processes or between a process and a library specify function signatures, data structures, error codes, threading and reentrancy, memory ownership, startup and shutdown sequences, and versioning. Modern software practice uses explicit interface description languages (IDL, Protocol Buffers, gRPC, OpenAPI) which function as machine-readable ICDs. In aerospace software, the software ICD is often in a formal document because it spans the boundary between two flight software packages built by different teams, and because it is verified separately from unit testing.

### 5.8 Operational Interfaces

Operational interfaces are the ones that happen between human operators and the system, or between ground and space. A crew procedure interface specifies what the crew does, in what order, what responses are expected from the vehicle, and how the vehicle handles off-nominal inputs. A ground command interface specifies what commands the ground can send, what authentication is required, what acknowledgments come back, and what the latency and reliability guarantees are. These interfaces are often under-specified because they seem "soft" — but in flight they are enforced by the same mechanisms as any other interface, through procedures, training, and change control.

---

## 6. The ICD Lifecycle and Change Control

### 6.1 Draft → Preliminary → Baseline → Revised

The ICD moves through distinct states during a program's lifecycle, and each state corresponds to a different authority for change.

A **draft ICD** is a working document during early design. It captures the current best thinking of both sides of the interface. Changes are made by either side without formal change control. Drafts are typically produced before Preliminary Design Review (PDR). The purpose of the draft is to force the two sides to write down what they think the interface is, so that disagreements surface early.

A **preliminary ICD** is formalized at PDR. It has been reviewed by both sides, any obvious errors have been corrected, and TBDs have been enumerated. From PDR forward, changes to the ICD require at least informal coordination between both sides, and changes are tracked in the revision history. Hardware design can proceed against a preliminary ICD with the understanding that later changes may drive rework.

A **baselined ICD** is formalized at Critical Design Review (CDR). It has been signed by both sides and by program authority. From CDR forward, changes require a formal Engineering Change Request (ECR) or Interface Revision Notice (IRN) that goes through a Change Control Board. The board evaluates the change for technical correctness, impact on schedule and cost, and impact on other interfaces, and either approves or rejects the change. An approved change produces a new revision of the ICD (the document is versioned) and both sides implement the change.

A **revised ICD** happens throughout the production and operational phase of a program. Subsystems evolve, anomalies surface that require interface changes, new capabilities are added. Each revision goes through the same CCB process. On a long-lived program like ISS, ICDs may be revised dozens of times over the life of the program, with each revision tracked back to an originating change request.

### 6.2 TBD and TBR Burndown

A practical aspect of ICD management is the burndown of TBDs and TBRs. At the start of a program, an ICD may have hundreds of TBDs — parameters that nobody has yet determined. Each TBD has an owner and a closure date. The program tracks the TBD count as a metric, and progress toward CDR requires the TBD count to fall to zero for all critical ICDs. TBDs that cannot be closed by their date are escalated, either by deferring their closure (with program risk acceptance) or by making a decision with incomplete information.

TBRs are similar but represent proposed values that have not been formally agreed. A TBR is "I think the bit rate is 10 Mbps but I need confirmation from the receiver team." The TBR list drives a closure cycle of proposal, review, acceptance, and baselining.

### 6.3 Frozen Interfaces That Should Change

A failure mode of ICD management is the opposite of interface drift: the frozen interface that should change but doesn't because the change control process makes changes expensive. Teams work around an ICD that has become incorrect rather than going through the change control board. Workarounds accumulate. Eventually the system works in practice but no document reflects how it actually works, and the next team to integrate is going to be misled by the obsolete ICD.

The fix is not to loosen change control — it is to make change control efficient enough that teams will use it. A CCB that takes six months to approve a two-line change will lose the trust of the engineering organization and will be bypassed. A CCB that turns around changes in a week, with good triage and clear criteria, will be used as intended. On well-run programs, ICD change control is optimized for throughput and has dedicated staff.

---

## 7. Interface Verification

### 7.1 Interface Tests Versus Subsystem Tests

Verifying an interface is different from verifying a subsystem. A subsystem test exercises the subsystem as a unit and verifies its own requirements. An interface test exercises the interface between two subsystems and verifies that each side behaves as specified when connected to the other. The two are complementary but not substitutable.

A common error is to assume that if subsystem A passes its acceptance test and subsystem B passes its acceptance test, the A-B interface will work. In practice this is often not true. Subsystem A's test uses a simulator or stub for subsystem B, and the simulator is a model of what A's team believed B would do. Subsystem B's test uses a simulator for A, built with similarly imperfect understanding. When the real A and real B meet for the first time, both are surprised. Interface testing in an integration lab, with both real subsystems in the loop, is what catches these discrepancies before flight.

### 7.2 The Integration Lab

Programs of any size maintain an integration and test lab where flight-representative (or flight-actual) hardware is mated up and exercised. NASA's SAIL (Shuttle Avionics Integration Laboratory) and SIL (Systems Integration Laboratory) are the canonical examples. The lab runs tests that exercise every interface in every nominal and off-nominal mode, with every piece of software in the loop. Anomalies found in the lab drive ICD changes, subsystem changes, or procedure changes — and are vastly cheaper to fix there than in flight.

### 7.3 Verification Methods

The four canonical verification methods apply to interfaces as to any requirement:

- **Inspection:** visual or documentary confirmation. "The connector is a MIL-DTL-38999 Series III shell size 13." Confirmed by looking at the hardware or the drawing.

- **Analysis:** calculation or simulation. "The coupled loads analysis shows margins above 1.5 across all load cases." Confirmed by reviewing the analysis report.

- **Demonstration:** functional operation showing the interface works. "Power the box from the real spacecraft bus and confirm it boots." Confirmed by observing.

- **Test:** measurement against specified limits. "Measure the conducted emissions per MIL-STD-461 CE102. Record the result. Compare to the limit line." Confirmed by measured data.

Each interface requirement in the ICD is tagged with one or more verification methods. The verification plan schedules when each verification is performed and who performs it.

---

## 8. The Political Dimension: ICDs Between Organizations

### 8.1 Contract Structure

An ICD between a government agency and a contractor has legal force. It is typically incorporated into the contract by reference, and the contractor is obligated to deliver hardware that complies with the ICD. A change to the ICD is a contract change, with cost and schedule impact that has to be negotiated. This is why ICD change control on government programs is slow: each change is a potential contract modification.

ICDs between two contractors working on the same program are mediated by the government. Neither contractor has authority over the other, so the government holds the pen on the interface. In practice this means a NASA program office has interface managers whose full-time job is to herd two contractors toward a common specification, resolve disputes, and baseline the document.

### 8.2 Peer ICDs Between Programs

Interfaces between programs — SLS and Orion, ISS and visiting vehicles, Orion and Gateway — are peer ICDs between organizations at roughly equal authority. These ICDs are negotiated in joint interface working groups with representation from both programs and from any higher-level authority (the Human Exploration and Operations Mission Directorate, for instance). The ICD is owned jointly and can only be changed by joint agreement.

The SLS-Orion Interface Control Document is a canonical example. It specifies the mechanical interface at the stage adapter, the electrical interfaces for power and data during ascent, the environmental conditions Orion must survive, the separation dynamics, and the timing of events during staging. It is owned jointly by the SLS program and the Orion program and is maintained through a joint working group.

The ISS Visiting Vehicle ICD family is another. Each new visiting vehicle — Dragon, Cygnus, HTV, ATV (retired), Starliner, Dream Chaser — has an ICD with ISS. The ICD specifies the approach corridor, the capture mechanism (common berthing mechanism or direct docking), the power and data interfaces across the hatch, the command and monitoring interfaces, the abort procedures, and the contingency responses. These ICDs took years to negotiate and are still being updated as new vehicles join the fleet.

### 8.3 International Partner ICDs

When the interface crosses national boundaries, ICDs become instruments of international cooperation. The Orion European Service Module ICD between NASA and ESA is the current exemplar. It specifies every interface between the crew module (Lockheed Martin, under NASA contract) and the service module (Airbus, under ESA contract). The ICD was negotiated over years, involving engineers and program managers on both sides of the Atlantic, and is jointly owned by NASA and ESA under the Memorandum of Understanding governing the partnership.

The political dimension is not a bug — it is the whole point of the document. The ICD is the artifact that turns a political agreement ("NASA and ESA will jointly build Orion") into an engineering specification ("the service module will provide 11.2 kW of power continuous at 120 VDC ± 3 V at the crew module power interface connector"). Without the ICD, the political agreement has no enforceable technical content.

---

## 9. Case Studies: Interfaces That Worked, Interfaces That Failed

### 9.1 Apollo LM/CSM Interface — The Template

The interface between the Apollo Lunar Module and the Command and Service Module is the interface against which every subsequent crewed spacecraft interface has been benchmarked. It was defined in an ICD jointly maintained by NAA/Rockwell and Grumman, with NASA JSC interface management. It covered mechanical docking (the probe-and-drogue mechanism), crew transfer through the tunnel, electrical power transfer, data and voice communications, and environmental interfaces.

What made the Apollo LM/CSM ICD work was a combination of early baselining (the interface was defined before detailed design of either vehicle was complete), a disciplined change control process (changes went through a joint board with NASA authority), and extensive verification (the interface was exercised in the Apollo 9 mission before being used operationally at the Moon). The result was an interface that performed nominally across eleven Apollo missions and saved the crew of Apollo 13 when the LM was used as a lifeboat — a use case the ICD had contemplated but that had never been exercised in flight until it had to be.

### 9.2 Shuttle / Spacelab Interface

Spacelab was an ESA-built pressurized laboratory module that flew in the Shuttle payload bay. The Shuttle/Spacelab ICD was another early international interface, and it tested the framework of interface management across a partnership. It covered mechanical mounting in the bay, pressurized tunnel to the crew cabin, power and data interfaces, thermal control, and crew procedures.

The Spacelab experience taught NASA lessons about interfaces to international partners that fed directly into ISS and, later, Orion. The lessons included: negotiate the ICD before either side commits to hardware; establish a joint working group with dedicated staff; baseline early and enforce change control strictly; exercise the interface in an integration lab before flight.

### 9.3 ISS Common Berthing Mechanism

The Common Berthing Mechanism (CBM) is the standardized passive/active berthing port used throughout the US Orbital Segment of ISS. It was designed so that pressurized modules from different builders, and visiting vehicles from different providers, could all mate up using the same interface. The CBM ICD specifies the hatch opening, the bolt pattern, the guide pin locations, the seal geometry, the electrical pass-through connectors, and the capture envelope for the robotic arm that performs the berthing.

The CBM is a success story because standardization enabled participation. A new visiting vehicle builder does not have to negotiate a custom interface from scratch; they design to the CBM ICD and inherit decades of verification. SpaceX Dragon, Orbital Cygnus, and JAXA HTV all use CBM berthing. The CBM is the spiritual ancestor of the International Docking System Standard (IDSS), which is the standardized docking port for future crewed vehicles.

### 9.4 Mars Climate Orbiter — The Canonical ICD Failure

In September 1999, the Mars Climate Orbiter entered the Martian atmosphere at too low an altitude and was destroyed. The root cause was a unit mismatch between Lockheed Martin ground software, which produced thrust impulse data in pound-force-seconds, and JPL navigation software, which consumed the data as newton-seconds. The result was a trajectory computation that placed the spacecraft on a path 170 km lower than intended.

The failure investigation identified multiple contributors. The ICD (the Small Forces file format specification) did not explicitly state the units. The software interface did not enforce unit checking. The review process did not catch the discrepancy. And the navigation team noticed anomalies during cruise but did not investigate them aggressively enough to find the root cause before Mars arrival. The lesson drove changes in NASA interface documentation practice, including explicit unit declarations for every numeric field and the addition of automated unit checking in flight software interfaces.

Mars Climate Orbiter is in every systems engineering textbook for a reason: it is the clearest possible illustration that an interface which is "obvious" to two competent teams can still be wrong, and that the ICD has to be explicit about things nobody thinks need to be stated.

### 9.5 Orion / SLS Stage Adapter

The current-generation example of interface management is the Orion / SLS interface, documented in the Multi-Program Interface Control Document (MPICD) between the SLS program and the Orion program. The interface is at the Orion Stage Adapter, which sits between the SLS Interim Cryogenic Propulsion Stage and the Orion service module. The MPICD covers mechanical attachment, loads transmission during ascent, electrical umbilicals for power and data from SLS to Orion during ascent, separation dynamics at Trans-Lunar Injection, and the environmental conditions Orion must survive.

The MPICD has been through many revisions as both SLS and Orion have evolved. Each revision went through the joint change control board and was signed by both program authorities. The interface was exercised in the Artemis I flight in November 2022 and performed as specified — the culmination of a decade and a half of interface management work.

### 9.6 Interface Drift: A Generic Failure Mode

Beyond individual named failures, the most common interface failure mode on large programs is interface drift: the ICD baseline is established, then each subsystem evolves independently, and over months or years the subsystems diverge from what the ICD says. Neither side notices because each is testing against its own internal stubs. At integration, the mismatch surfaces, and a scramble begins to figure out whose version is "correct."

The fix is periodic interface reviews — a standing meeting, perhaps quarterly, where both sides of each interface walk the ICD and confirm that their current design matches it. Discrepancies are logged and either drive design corrections or drive ICD change requests. The review is tedious and usually nobody wants to do it, which is precisely why it has to be scheduled and tracked.

---

## 10. Practical Templates and Examples

### 10.1 ICD Template Outline

The following is a skeleton that can be adapted for most programs:

```
INTERFACE CONTROL DOCUMENT
[Subsystem A] to [Subsystem B]
Document Number: ICD-[PROGRAM]-[NN]
Revision: [letter]
Date: [date]

1. SCOPE
   1.1 Identification
   1.2 Purpose
   1.3 Interface Overview

2. APPLICABLE DOCUMENTS
   2.1 Government Documents
   2.2 Non-Government Documents
   2.3 Related ICDs

3. INTERFACE DESCRIPTION
   3.1 Interface Block Diagram
   3.2 Functional Description
   3.3 Physical Layout

4. INTERFACE REQUIREMENTS
   4.1 Mechanical
       4.1.1 Envelope
       4.1.2 Mounting
       4.1.3 Loads
       4.1.4 Dynamic Envelope
   4.2 Electrical
       4.2.1 Power
       4.2.2 Grounding and Bonding
       4.2.3 Signals
       4.2.4 Connectors and Pin Assignments
   4.3 Data
       4.3.1 Bus / Protocol
       4.3.2 Message Formats
       4.3.3 Timing
       4.3.4 Error Handling
   4.4 Thermal
       4.4.1 Conductive Paths
       4.4.2 Radiative Coupling
       4.4.3 Temperature Limits
   4.5 Fluid (if applicable)
       4.5.1 Fluids Transferred
       4.5.2 Pressures and Flow Rates
       4.5.3 Contamination Limits
       4.5.4 Couplings
   4.6 EMI / EMC
       4.6.1 Conducted Emissions
       4.6.2 Conducted Susceptibility
       4.6.3 Radiated Emissions
       4.6.4 Radiated Susceptibility
   4.7 Software APIs (if applicable)
   4.8 Operational
       4.8.1 Crew Procedures
       4.8.2 Ground Commands
       4.8.3 Telemetry

5. VERIFICATION
   5.1 Verification Matrix
   5.2 Verification Responsibility
   5.3 Verification Procedures

6. TBD / TBR LIST
   6.1 Open TBDs (with owner and closure date)
   6.2 Open TBRs (with owner and closure date)

7. REVISION HISTORY

8. SIGNATURES
   [Contractor A Interface Manager]
   [Contractor B Interface Manager]
   [Program Interface Manager]
   [Program Authority]
```

### 10.2 Sample N² Diagram (Six-Subsystem Spacecraft)

Using a simplified spacecraft with six subsystems — Structure (STR), Power (PWR), Thermal (THR), Avionics (AVI), Propulsion (PRP), Communications (COM) — the N² matrix looks like this (read rows as outputs, columns as inputs):

```
            STR      PWR      THR      AVI      PRP      COM
         +--------+--------+--------+--------+--------+--------+
STR      |   STR  | mount  | mount  | mount  | mount  | mount  |
         |        | loads  | cond   | vib    | loads  | vib    |
         +--------+--------+--------+--------+--------+--------+
PWR      |        |  PWR   |        | 28V    | 28V    | 28V    |
         |        |        |        | pwr    | pwr    | pwr    |
         +--------+--------+--------+--------+--------+--------+
THR      |        |        |  THR   | temp   |        |        |
         |        |        |        | ctrl   |        |        |
         +--------+--------+--------+--------+--------+--------+
AVI      |        | telem  | cmds   |  AVI   | cmds   | data   |
         |        |        |        |        | telem  | cmds   |
         +--------+--------+--------+--------+--------+--------+
PRP      |  loads |        |        | telem  |  PRP   |        |
         |  thrust|        |        |        |        |        |
         +--------+--------+--------+--------+--------+--------+
COM      |        | telem  |        | RF     |        |  COM   |
         |        |        |        | uplink |        |        |
         +--------+--------+--------+--------+--------+--------+
```

Reading the matrix: STR sends mounting provisions to every other subsystem (first row). PWR sends 28V power to AVI, PRP, and COM (second row). AVI sends commands to PWR, THR, PRP, and COM (fourth row). Each populated cell is an interface that requires an ICD or at minimum a written specification. Empty cells are "no interface exists" — and that claim itself is a statement the N² walk confirms.

This six-subsystem example has fifteen possible interfaces. Examining the matrix shows seventeen populated cells (some cells have multiple items). On a real program with fifty or more subsystems, the matrix would be much larger, and the N² walk would take days.

### 10.3 Sample ICD Requirement Statements

Good requirement statements are specific, verifiable, and traceable. Examples:

- **ICD-PWR-001**: "The [Subsystem A] power interface shall accept 28 VDC ± 2 V from the spacecraft main bus, with nominal current draw no greater than 5.0 A continuous and peak current no greater than 8.0 A for durations up to 100 ms. Verification: Test per procedure TP-PWR-001."

- **ICD-DATA-017**: "The [Subsystem A] to [Subsystem B] data interface shall transmit telemetry frames containing [defined fields] at a rate of 10 Hz ± 0.1 Hz, with end-to-end latency no greater than 50 ms measured from sensor sampling to receipt at [Subsystem B]. Verification: Test per procedure TP-DATA-017."

- **ICD-MECH-042**: "The [Subsystem A] mounting interface shall provide four M6 × 1.0 threaded holes on a 100 mm × 100 mm square pattern, capable of accepting a fastener preload of 3000 N ± 10%. The interface shall transmit static loads up to 2000 N in any direction and dynamic loads per the coupled loads analysis specified in [reference]. Verification: Inspection of drawings and analysis of CLA results."

Bad requirement statements are vague, unverifiable, or unitless:

- **BAD**: "The subsystem shall have sufficient power." (Sufficient for what? What is sufficient?)
- **BAD**: "The data interface shall be reliable." (What does reliable mean? Bit error rate? Availability?)
- **BAD**: "The mounting shall be robust." (Robust against what loads, with what margin?)

The test of an interface requirement is: can a verification engineer write a test procedure from it without asking any questions? If yes, the requirement is good. If no, the requirement needs work before it is baselined.

---

## 11. Sources

- NASA JSC 26557, *Interface Control Document Preparation*, Johnson Space Center standard for ICD preparation and management.
- NASA/SP-2016-6105 Rev 2, *NASA Systems Engineering Handbook*, chapters on technical management processes, interface management, and configuration management.
- NASA/SP-2007-6105 Rev 1, *NASA Systems Engineering Handbook*, earlier edition with detailed interface management guidance.
- INCOSE Systems Engineering Handbook, Fifth Edition, sections on interface management, N-squared diagrams, and ICD practice.
- NASA Mars Climate Orbiter Mishap Investigation Board, *Phase I Report*, November 10, 1999. The definitive account of the MCO unit mismatch failure.
- NASA Apollo Program Documentation, *Apollo Lunar Module / Command and Service Module Interface Control Document* (historical reference), available through NASA Technical Reports Server.
- Space Shuttle / Spacelab Interface Control Document family (historical reference), documenting the first major NASA-ESA crewed interface.
- ISS Visiting Vehicle Integration, *International Space Station Visiting Vehicle Interface Requirements*, NASA Johnson Space Center.
- SLS / Orion Multi-Program Interface Control Document (MPICD), NASA Exploration Systems Development, summarized in public SLS and Orion program documentation.
- MIL-STD-461G, *Requirements for the Control of Electromagnetic Interference Characteristics of Subsystems and Equipment*, Department of Defense.
- MIL-STD-464C, *Electromagnetic Environmental Effects Requirements for Systems*, Department of Defense.
- MIL-STD-1553B, *Aircraft Internal Time Division Command / Response Multiplex Data Bus*, Department of Defense.
- MIL-DTL-38999, *Connectors, Electrical, Circular, Miniature, High Density, Quick Disconnect*, Department of Defense.
- International Docking System Standard (IDSS) Interface Definition Document, available through NASA public documents.
- Common Berthing Mechanism (CBM) documentation, Boeing / NASA ISS Program.
- Larson and Wertz, *Space Mission Analysis and Design* (SMAD), Third Edition, chapters on systems engineering and interface management.
- Lano, R. J., *The N² Chart*, TRW Systems Engineering Report (1977), the original published description of the N-squared diagram technique.
- Defense Acquisition University, *Systems Engineering Fundamentals*, chapters on interface management and configuration control.
- IEEE Std 1220, *Standard for Application and Management of the Systems Engineering Process*, interface management sections.
