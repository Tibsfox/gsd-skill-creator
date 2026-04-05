# M2: Process Maturity Frameworks

**Mission:** Engineering the Process — Standard Operating Procedures  
**Module:** M2 of 5  
**Track:** 1A (Research)  
**Role:** CRAFT_PROC  
**Date:** 2026-04-05  
**Status:** COMPLETE

---

## Abstract

Process maturity frameworks provide engineering organizations with a structured vocabulary for diagnosing where they are and a map for where to go. This module covers the four primary frameworks relevant to software and systems engineering: CMMI (Capability Maturity Model Integration), NASA's NPR 7150.2D software engineering requirements, ISO/IEC/IEEE 12207:2017 software lifecycle processes, and the empirical relationship between process discipline and outcome predictability. The module concludes with an assessment methodology, common self-assessment biases, and a novel application of maturity concepts to agentic systems.

The central argument: process maturity is not a bureaucratic taxonomy. It is a predictability instrument. Organizations that cannot predict their own outputs cannot improve them. Measurement precedes optimization, and definition precedes measurement.

---

## 1. CMMI: The Maturity Ladder

### 1.1 Background and Lineage

The Capability Maturity Model was born from a 1986 DoD initiative to understand why software contractors consistently missed cost, schedule, and quality targets. The SEI at Carnegie Mellon University received a contract to build an evaluation framework. Watts Humphrey, drawing on Philip Crosby's quality maturity grid and his own experience managing software at IBM, published the first version in 1989.

Over the following decade the model split into separate domains: CMM for Software, for Systems Engineering, for Integrated Product Development, and for Supplier Sourcing. In 2002, SEI consolidated these into CMMI Version 1.1. Version 1.3 followed in 2010 (Chrissis, Konrad, Shrum). In 2016, CMMI Institute transitioned ownership to ISACA. CMMI Version 2.0 reorganized the model around performance outcomes in 2018. CMMI Version 3.0 was published in 2023, restructuring around Practice Areas and Performance Areas, adding explicit AI/ML guidance, and tightening the connection between maturity level and measurable business outcomes.

The maturity model applies at the organizational level, not the project level. A single high-performing project does not make an organization Level 3. Conversely, an organization at Level 4 can have projects that underperform. The levels describe what the organization systematically does, not what it occasionally achieves.

### 1.2 The Five Maturity Levels

#### Level 1 — Initial

**Organizational signature:** Processes are ad hoc, reactive, and individual-dependent. When a key person leaves, critical knowledge leaves with them. Projects succeed when the team is talented and motivated; they fail when the team is ordinary or when circumstances change. Planning is optimistic. Estimates are made to win work, not to reflect reality. The organization cannot explain why successful projects succeeded or why failed projects failed.

**Observable team behavioral indicators:**

1. Bug fixes introduce new bugs at a rate that surprises the team; there is no process to prevent this pattern.
2. Meeting a deadline requires a sprint of extraordinary individual effort ("heroics") in the final days.
3. Code review, when it happens, is negotiated informally by individuals rather than enforced by a process.
4. When a senior developer is unavailable, work stops or proceeds incorrectly because no documentation captures the decision context.
5. Retrospectives happen after crises, not after every sprint; the same failure modes recur across projects.
6. Estimates for new features are made by intuition; there is no reference to the history of how long similar features actually took.
7. Onboarding a new developer takes weeks because tribal knowledge is undocumented.

**What this looks like concretely:** A three-person startup building their first product. The lead developer holds the deployment procedure in their head. There is no written test plan — tests are written when someone thinks of them. Version control exists but nobody uses branch protection rules. The product ships when the CEO decides it needs to ship, not when defined criteria are met.

**Improvement target:** Establish basic project tracking. Identify which projects are being managed and what "managed" means. Even one project with documented requirements, a schedule tracked weekly, and a defined change process is progress toward Level 2.

**Transition actions:**
- Define what constitutes "scope" for each active project and write it down.
- Establish a change request process (even informal) so scope changes require explicit decision rather than silent accumulation.
- Begin tracking estimates against actuals. The goal is not accuracy — it is data. Any data.
- Create a single place where build and deployment instructions live.
- Hold a 30-minute retrospective at the end of each milestone and keep notes.

---

#### Level 2 — Managed

**Organizational signature:** Projects have planning, monitoring, and control applied at the individual project level. Requirements are managed; project status is tracked. But each project manager and team lead has their own way of doing these things. What looks like good process in Team A is absent in Team B. Success depends heavily on which team is assigned to the work.

**Observable team behavioral indicators:**

1. A new team member can find the project requirements document — but it is in a different location and format than the requirements document for the adjacent project.
2. The team tracks work items in a ticket system, but the categories and workflows differ by project.
3. When asked "what is the status of this project?" a project manager can answer accurately within hours; at Level 1 the answer would require a team meeting.
4. Defects are tracked from discovery to resolution; there is a record.
5. When a project is delayed, the team can explain why (scope change, resource unavailability, technical complexity underestimated) rather than shrugging.
6. Basic configuration management exists: source code is version controlled, releases are tagged, but CM may not extend to documentation, test cases, or build configurations.
7. Customer commitments are made based on schedule estimates, even if those estimates are still optimistic.

**What this looks like concretely:** A 15-person engineering team at a series-A startup. Each squad has its own Jira workflow with custom statuses invented by whoever set it up. Engineering uses GitHub; the ops team uses a spreadsheet. Sprint reviews happen but their format changes each time depending on who runs them. A project hand-off between squads involves a lengthy verbal knowledge transfer rather than reading documentation.

**Improvement target:** Standardize across projects. The processes that work well in the best-run project should become the baseline for all projects.

**Transition actions:**
- Audit the process variance between projects: list the five most important activities (requirements, testing, deployment, code review, change control) and document how each team does each activity.
- Select the best current practice for each activity and elevate it to an organizational standard.
- Define the minimum process that every project must follow; allow teams to add to it but not subtract from it.
- Establish a formal process asset library — even a shared wiki — where standard templates live.
- Create onboarding documentation that works for any project, not just the one you are on.

---

#### Level 3 — Defined

**Organizational signature:** The organization has a documented, tailored standard process for all major activities. When a new project starts, it begins from the organizational standard process and tailors it explicitly (documenting which elements were omitted and why), rather than inventing a new process from scratch. Process consistency across the organization enables comparison: a senior engineer can join any project and recognize the workflow.

This is the inflection point. Level 3 organizations begin to accumulate institutional knowledge that persists across personnel changes. The organization can learn because it has captured what it does.

**Observable team behavioral indicators:**

1. A new engineer joining any team in the organization receives the same onboarding process; it is documented, versioned, and improved annually.
2. Code review criteria are written down and applied consistently across all teams; deviations require documented justification.
3. Process tailoring is explicit: when a team decides not to conduct formal design reviews for a small internal tool, they document the tailoring decision.
4. Lessons learned from one project are captured in a shared repository and explicitly considered at the start of the next project.
5. The organization can estimate project effort and schedule from a library of historical data rather than purely from intuition.
6. Post-mortems produce written action items that feed back into process updates, not just into team memory.
7. Testing plans are written before coding begins; they reference acceptance criteria in the requirements.

**What this looks like concretely:** A 60-person engineering organization at a series-C company. Every project starts with a kickoff document from a standard template. Code review gates are enforced in CI. Deployments follow a documented runbook. The engineering handbook is maintained by a dedicated platform team. When an engineer moves from the payments team to the search team, they recognize the sprint ceremonies, the PR process, and the incident escalation procedure — the vocabulary and structure are familiar even if the domain is new.

**Improvement target:** Add measurement and quantitative control. Define which process attributes will be measured and begin collecting data systematically.

**Transition actions:**
- Identify three to five process attributes that, if measured, would help predict project outcomes (e.g., defect density at code review, lead time from commit to deployment, test coverage at merge).
- Instrument the workflow to collect these measurements automatically where possible.
- Review measurement data in retrospectives and ask whether the numbers explain the project outcomes.
- Establish baselines: what is the average defect density, lead time, and test coverage across the organization? Define acceptable ranges.

---

#### Level 4 — Quantitatively Managed

**Organizational signature:** The organization uses quantitative data to manage process and product quality. Statistical process control methods are applied to key processes. Variation is understood and distinguished from common cause (random, expected) versus special cause (unusual, signals a problem). The organization can predict outcomes within quantifiable confidence intervals.

**Observable team behavioral indicators:**

1. The team can state, with a numerical confidence bound, how long a feature of a given size will take to ship.
2. When a metric falls outside its control limits, an automatic alert triggers investigation; the team does not wait for a project review meeting to discover problems.
3. Process capability is measured: the team knows what percentage of code reviews find defects and what the average defect discovery rate is.
4. Build and test pipeline metrics (duration, flakiness rate, coverage trend) are tracked over time and reviewed for drift.
5. Customer-facing quality metrics (defect escape rate, mean time to resolution) are baselined and monitored against targets, not just reported after the fact.
6. Root cause analysis for escaped defects uses statistical evidence to classify whether the defect reflects a systemic process failure or an isolated event.
7. The organization can distinguish between a team that is genuinely improving and one that is experiencing random variation.

**What this looks like concretely:** A 200-person engineering organization at a publicly traded software company. The DORA metrics (deployment frequency, lead time for changes, change failure rate, time to restore service) are tracked per team and rolled up weekly. Each team's velocity trend is charted with control limits; a statistically significant drop in velocity triggers a structured check-in. Release quality gates include automated measurement of test coverage, cyclomatic complexity, and security scan findings against defined thresholds. Sprint commitments are made from velocity ranges, not single-point estimates.

**Improvement target:** Focus on continuous improvement. The measurement infrastructure is now in place; use it to drive targeted process experiments.

**Transition actions:**
- Establish a formal process for submitting and evaluating process improvement proposals.
- Define how improvement experiments will be measured: what is the hypothesis, what data will confirm or refute it, and what is the time horizon.
- Connect quantitative data to the process asset library: when a measurement improvement traces back to a process change, document the causal link.

---

#### Level 5 — Optimizing

**Organizational signature:** Continuous process improvement is the organization's primary operating mode. Quantitative feedback from Level 4 measurement drives deliberate process experimentation. The organization proactively identifies emerging risks and opportunities rather than reacting to failures. Innovation in process is treated with the same rigor as innovation in product.

**Observable team behavioral indicators:**

1. Process improvement proposals originate from individual contributors, not just from management; there is a formal intake and review mechanism.
2. When a new technology or methodology is evaluated (e.g., a new testing framework, a different deployment strategy), the evaluation is conducted as a structured experiment with defined metrics, not as an informal pilot.
3. The root cause of every significant defect that escapes to production is traced to a process gap and the process is updated; the same defect type does not recur across projects.
4. The organization participates in external benchmarking (industry surveys, conference case studies, standards body participation) and uses external data to calibrate its own performance.
5. Process documentation has a version history and a defined review cadence; documentation drift (where the written process diverges from actual practice) is detected and corrected.
6. Defect prevention programs — activities that identify and eliminate potential defects before they enter the codebase — are in place and their effectiveness is measured.
7. Innovation proposals are evaluated quantitatively: before adopting a new practice organization-wide, a controlled experiment is run on a subset of teams.

**What this looks like concretely:** An aerospace software team at Level 5 maintains a formal causal analysis program. When a test escape occurs, a root cause analysis using structured techniques (fishbone, five-whys, fault tree) identifies not just the proximate cause but the process that allowed it. The resulting process improvement is captured in the organization's standard process, measured for effectiveness over the next six months, and shared across all teams. The team's defect rate trends continuously downward — not because of heroic individual effort but because the process systematically eliminates defect introduction patterns.

**Improvement target:** Maintain and sustain. The challenge at Level 5 is preventing regression — ensuring that rapid growth, technology changes, or organizational restructuring do not erode the process discipline that was expensive to build.

---

### 1.3 Transition Timelines: What SEI Research Shows

The SEI accumulated transition data from thousands of organizational assessments. The findings are sobering:

- **Median L1 to L2 transition:** approximately 5 months of sustained effort with organizational commitment.
- **Median L2 to L3 transition:** approximately 21 additional months.
- **Total L1 to L3:** roughly 26 months under favorable conditions.
- L3 to L4 and L4 to L5 transitions are less well-documented in the historical data but typically require 18-36 months each for organizations starting from scratch.

These numbers reflect organizations with executive sponsorship and dedicated process improvement staff. Organizations attempting maturity improvement as a side project alongside normal delivery work typically take two to three times longer.

A critical finding from SEI assessment data: organizations systematically overestimate their own maturity. The modal self-assessment is Level 3. The modal assessed maturity (by external assessors) is Level 1 to 2. The gap is not dishonesty — it is the Dunning-Kruger effect applied to organizational process. Teams that have not experienced a Level 3 organization cannot accurately recognize that they are not one.

### 1.4 CMMI v3.0 Reorganization

CMMI Version 3.0 (2023) introduced several structural changes relevant to how organizations work with the model today:

**Practice Areas (replacing Process Areas):** CMMI v3.0 groups practices into Practice Areas that describe capabilities, and Performance Areas that describe outcomes. This makes the model more explicitly outcome-oriented and less prescriptive about how to achieve maturity.

**Explicit AI/ML guidance:** For the first time, the model includes guidance for organizations developing AI and machine learning systems, acknowledging that traditional verification and validation approaches require adaptation.

**View-based appraisal:** Organizations can now conduct appraisals scoped to specific Practice Areas relevant to their business context, rather than always evaluating the complete model.

**Business performance linkage:** The 2023 revision strengthens the connection between maturity level and business outcomes (cost, quality, delivery time, customer satisfaction), making the ROI case for process investment more explicit.

---

## 2. NASA Software Engineering Requirements (NPR 7150.2D)

### 2.1 Overview and Authority

NASA Procedural Requirements 7150.2D ("Software Engineering Requirements") is the apex document for software engineering practice across the NASA agency. It establishes mandatory minimum requirements for how NASA organizations develop, manage, and maintain software. Unlike a voluntary standard, NPR 7150.2D carries regulatory force: NASA missions cannot proceed through their milestone reviews without demonstrating compliance.

NPR 7150.2D does not invent its requirements from first principles. It synthesizes lessons from decades of NASA software failures — Mars Observer (1993), Mars Climate Orbiter (1999), Mars Polar Lander (1999), DART navigation software anomalies — and encodes the organizational behaviors that prevent their recurrence. It represents, in effect, an institutionalized lessons-learned corpus.

The document operates alongside two supporting standards:

- **NASA-HDBK-2203** (NASA Software Engineering Handbook): implementation guidance explaining how to meet the NPR 7150.2D requirements.
- **NASA-STD-8739.8A** (Software Assurance and Software Safety Standard): requirements specific to safety and quality assurance, particularly for safety-critical software.

### 2.2 Software Classification: Class A Through G

NPR 7150.2D classifies software by safety criticality, which then determines the rigor of required processes. This classification system is the most concrete instantiation of the principle that process overhead should be proportional to consequence.

| Class | Description | Typical Applications | Process Rigor |
|-------|-------------|---------------------|---------------|
| **A** | Safety-critical, human-rated | Life support systems, crewed vehicle guidance, abort systems | Maximum — IV&V required, every process step mandatory |
| **B** | Mission-critical, not human-rated | Spacecraft command and telemetry, science instruments | High — most NPR requirements mandatory |
| **C** | Mission support, significant impact if fails | Ground systems supporting Class A/B missions | Moderate — selective requirements based on risk |
| **D** | Institutional, embedded, important | Internal tools with significant mission dependency | Reduced — key CM and testing requirements |
| **E** | Institutional, non-embedded, limited impact | Administrative software, desktop tools | Minimal — basic CM requirements |
| **F** | Research prototype | Algorithm demonstrations, proof-of-concept | Lowest — primarily documentation |
| **G** | Safety-critical non-software | Firmware in programmable hardware (applies when functioning as software) | Equivalent to Class A |

The classification decision itself is a documented, reviewed activity. Misclassification — assigning Class E requirements to software that functionally operates at Class B — is a known failure mode. The Mars Climate Orbiter trajectory software is often cited in this context: its unit mismatch would have been caught by Class B testing requirements.

**Observable indicator for self-assessment:** Does your organization have a documented, reviewed process for classifying software by criticality at project start? Is that classification reflected in the testing and review requirements applied to the project?

### 2.3 Software Development or Management Plan

Every NASA software project requires a Software Development Plan (SDP) or Software Management Plan (SMP). This document is the SOP master — it specifies how all required processes will be applied to this particular project.

The plan must address:
- **Software classification** (Class A-G determination with rationale)
- **Development methodology** (waterfall, agile, model-based; with tailoring rationale)
- **Applicable processes** (which NPR 7150.2D requirements apply; which are tailored; why)
- **Resource estimates** (staffing, tools, infrastructure)
- **Schedule** (with milestone definitions)
- **Configuration management approach** (tool, branching strategy, baseline definitions)
- **Independent V&V approach** (whether IV&V is required and who performs it)
- **Metrics plan** (what will be measured and when)

The SDP/SMP is a living document: it is updated when project circumstances change, and the changes are tracked and reviewed. The document must be approved by the project's technical authority before software development begins.

In GSD terms, the SDP/SMP maps closely to the combination of `.planning/REQUIREMENTS.md` + `.planning/ROADMAP.md` + a wave plan — it defines what will be built, how, by whom, and how success will be measured.

### 2.4 Independent Verification and Validation (IV&V)

IV&V is the process of verifying and validating software using a team that is organizationally and technically independent of the development team. For Class A software, IV&V is mandatory. For Class B, it is strongly recommended. The independence requirement is specific: the IV&V team cannot report to the same manager as the development team and cannot include personnel who wrote the software being evaluated.

The purpose of IV&V is not to find that the development team did poor work. It is to catch the classes of errors that only appear when someone unfamiliar with the implementation examines it fresh. A development team accumulates blind spots — assumptions baked into code that were never challenged because everyone on the team shares them.

**IV&V activities include:**
- Requirements verification (are the requirements complete, consistent, testable?)
- Design verification (does the design satisfy the requirements?)
- Code review (independent analysis of source code, not just test results)
- Test witnessing (IV&V team observes and certifies critical test execution)
- Anomaly analysis (investigation of test failures and anomalies)
- Certification (IV&V team provides a formal recommendation on software readiness)

For organizations below NASA's scale, the IV&V principle translates to: the person who reviews an SOP before it goes into use should not be the person who wrote it. The reviewer who didn't write the procedure is more likely to find the step that assumes knowledge the procedure doesn't convey.

### 2.5 Configuration Management

NPR 7150.2D requires documented CM processes covering:

- **Identification:** Every item under CM has a unique identifier. Software components, documents, build configurations, test plans, and interface specifications all require identification.
- **Change control:** No change to a controlled item without a documented change request, impact assessment, and approval. The change control board (CCB) is the governance body for changes.
- **Status accounting:** At any point in time, the configuration of every deployed artifact must be knowable. What version? What changes were incorporated? What deviations were approved?
- **Audit:** Periodic physical and functional configuration audits verify that what is documented matches what is actually deployed.

The CM baseline is the foundation of traceability. When a defect is found in flight software, CM records allow engineers to identify exactly which software version was flying, what changes had been made since the last verified version, and whether the defect could have been introduced by a recent change.

For software engineering SOPs, CM applies to the SOPs themselves. An SOP with no version number, no change history, and no approval record is not under configuration management — and therefore cannot be audited, cannot be rolled back, and cannot serve as evidence of process compliance.

### 2.6 Lessons Learned Information System (LLIS)

The NASA Lessons Learned Information System is the agency's formalized mechanism for capturing and disseminating knowledge from operational experience. LLIS entries are mandatory for:
- Software anomalies that caused mission impact
- Process failures that contributed to schedule or cost deviation
- Technical approaches that succeeded significantly better than expected

LLIS represents the institutional implementation of the "living document" principle. An SOP that is never updated is not a living document — it is a historical artifact that has decoupled from current practice. The LLIS mechanism ensures that when practice diverges from procedure, the divergence is examined and one of two outcomes results: the SOP is updated to match improved practice, or the practice is corrected to match the SOP.

The LLIS loop has a defined structure:
1. **Initiating event:** An anomaly, failure, or unexpected success.
2. **Causal analysis:** Root cause investigation identifying what process element failed or succeeded.
3. **Lesson formulation:** A structured description of what happened, why, what it means, and what should change.
4. **Routing:** The lesson is routed to affected programs and process owners.
5. **Action:** SOPs, training, or tools are updated.
6. **Closure:** The lesson is marked resolved with documentation of what changed.

This is CMMI Level 3 to Level 5 process improvement in operational form. The LLIS is not unique to NASA — it is a pattern that any mature organization can implement with lower ceremony but the same structure.

### 2.7 Software Processes Across NASA (SPAN)

SPAN is NASA's agency-wide process asset library. Where individual projects maintain their own SDPs and process documentation, SPAN provides the organizational standard processes from which projects tailor.

SPAN contains:
- Standard process templates for major software lifecycle activities
- Recommended practices and implementation guidance
- Training materials for NASA software processes
- Metrics and measurement guidance
- Tool and method recommendations

SPAN is the embodiment of CMMI Level 3's organizational process focus: a central repository of what the organization has learned about doing software engineering well, maintained and updated by a process group, used by all projects as the starting point.

For SOP development in any organization, SPAN's architecture suggests a critical lesson: standard processes should live in a central, accessible, versioned repository. Projects reference the organizational standard, tailor explicitly, and feed improvements back. Without this centralization, every project reinvents its processes independently, and organizational learning does not accumulate.

---

## 3. ISO/IEC/IEEE 12207:2017 Software Lifecycle Processes

### 3.1 Framework Overview

ISO/IEC/IEEE 12207:2017 (Systems and Software Engineering — Software Life Cycle Processes) is the international standard for defining, implementing, managing, and improving software lifecycle processes. The current edition represents a joint publication between ISO/IEC and IEEE, aligning international and US professional society standards.

12207 does not prescribe how to do software engineering. It prescribes what processes must exist and what outcomes those processes must produce. Organizations are free to implement these processes using any methodology — agile, waterfall, spiral, or hybrid. The standard provides a normative reference for process completeness.

### 3.2 Three Process Classes

12207 organizes processes into three classes:

**Agreement Processes** govern the contractual and organizational relationships between parties:
- Acquisition Process (how the organization acquires products and services)
- Supply Process (how the organization provides products and services)

These processes define how organizations manage supplier relationships, subcontracts, and service agreements. For engineering SOPs, the supply process is particularly relevant: it specifies that the supplier must plan and document their development process and make that documentation available to the acquirer.

**Organizational Project-Enabling Processes** establish the infrastructure within which projects operate:
- Life Cycle Model Management Process
- Infrastructure Management Process
- Portfolio Management Process
- Human Resource Management Process
- Quality Management Process
- Knowledge Management Process

The Knowledge Management Process is directly relevant to SOP development: it requires the organization to capture, maintain, and disseminate knowledge systematically. This is the 12207 equivalent of NASA's SPAN and LLIS structures.

**Technical Processes** are the core engineering activities:
- Business or Mission Analysis
- Stakeholder Needs and Requirements Definition
- System Requirements Definition
- Architecture Definition
- Design Definition
- System Analysis
- Implementation
- Integration
- Verification
- Validation
- Transition
- Operation
- Maintenance
- Disposal

Each technical process in 12207 has:
- **Purpose statement:** Why the process exists
- **Outcomes:** Observable results that indicate the process has been performed successfully
- **Activities and tasks:** Specific work performed
- **Information items:** Documents and records produced

### 3.3 SOP-Relevant Requirements

ISO/IEC 12207 has several direct implications for SOP development:

**Process documentation:** Every lifecycle process must be defined. A process that exists only in the heads of practitioners is not a 12207-compliant process. Documentation is not optional.

**Process control:** Implemented processes must be managed: plans created, work products produced, resources allocated, and progress monitored. This maps directly to CMMI Level 2 characteristics.

**Process improvement:** The standard requires that processes be assessed and improved. The organization must periodically evaluate whether its processes are achieving their intended outcomes and update them accordingly. This is the 12207 equivalent of CMMI Level 5's optimizing focus.

**Configuration management:** 12207's configuration management process requires that all work products under CM be identified, controlled, stored, and capable of being reproduced. Change requests must be documented and evaluated for impact before approval.

**Relationship to CMMI levels:**

| 12207 Process Class | CMMI Equivalent Level |
|--------------------|----------------------|
| Processes documented and executed | Level 2 |
| Processes standardized across the organization | Level 3 |
| Process outcomes quantitatively measured | Level 4 |
| Processes systematically improved from data | Level 5 |

12207 compliance is achievable at CMMI Level 2 for basic compliance and Level 3 for full, consistent compliance. Organizations at Level 1 will typically fail multiple 12207 process requirements simply because the processes are not defined.

### 3.4 ISO/IEC 15289 and Information Item Requirements

ISO/IEC/IEEE 15289:2017 (Systems and Software Engineering — Content of Life-Cycle Information Items) is the companion standard that specifies what goes in the documents that 12207 requires. Where 12207 says "produce a test plan," 15289 specifies what sections a test plan must contain.

This standard is directly applicable to SOP construction: it provides a defensible baseline for what must be in a procedure document, what must be in a configuration management plan, and what must be in a software development plan. For organizations building their SOP library from scratch, 15289 provides a normative checklist.

---

## 4. The Relationship Between Process Discipline and Outcome Predictability

### 4.1 Why Level 1 Organizations Produce Unpredictable Results

Unpredictability at Level 1 is not primarily a symptom of bad engineers. It is a consequence of a systems property: the output of a system with no defined internal state is determined by the particular initial conditions of each run. In software terms: when there is no process, the outcome depends entirely on which individuals happen to be assigned, what their particular habits are, what external events intervene, and whether their tacit knowledge covers the edge cases that emerge.

This is why the same organization can produce brilliant work on one project and catastrophically fail on the next — not because the quality of people changed, but because the critical knowledge that made the first project work was never externalized. The second project ran on different people with different tacit knowledge, and the system produced a different outcome.

SEI research (Herbsleb and Goldenson, 1996) documented the project-level consequences: Level 1 organizations had approximately 40% of projects experience serious schedule overruns (greater than 25% over estimate). This dropped to approximately 18% at Level 2 and 8% at Level 3. The improvement was not linear — it was largest at the L1→L2 transition.

### 4.2 The Inflection Point at Level 3

Level 3 is where organizational learning begins to accumulate in a durable form. The mechanism is specific: because processes are documented, measured, and used as the starting point for tailoring, each project's process experience is captured in a form that feeds back into the organizational standard.

At Level 1 and Level 2, a project team might develop a highly effective testing procedure. When that team disperses, the procedure disperses with them. At Level 3, that procedure is submitted to the process asset library, reviewed by a process group, incorporated into the organizational standard, and propagated to subsequent projects.

This is the difference between individual learning and organizational learning. An organization at Level 3 can improve without the same people being present. The process is the carrier of institutional memory, not the individual.

**Quantitative signature of the Level 3 inflection:**

Jones and Soule (2002) in CMU/SEI-2002-TN-012 documented the relationship between process maturity and product quality across large portfolios. Key findings:
- Defect removal efficiency (the percentage of defects found before delivery) averaged approximately 80-85% at Level 1, approximately 90% at Level 3, and approximately 97% at Level 5.
- The functional size of delivered software (function points) had significantly less variance at Level 3 than Level 1 for the same nominal scope.
- Cost-per-defect-found decreased at higher maturity levels because defects found late in development (or in production) are orders of magnitude more expensive to fix than defects found at code review or in unit test.

The economic argument for reaching Level 3 is straightforward: the investment in process definition and standardization returns itself through reduced rework costs, lower defect escape rates, and improved schedule predictability.

### 4.3 Statistical Evidence on Defect Rates and Maturity

The causal mechanism connecting process discipline to defect rates operates through several pathways:

**Requirements clarity:** Defined processes for requirements management (Level 2+) reduce ambiguity. Ambiguous requirements produce defects not because developers are careless but because they correctly implement an underspecified requirement differently than the stakeholder intended.

**Defect injection timing:** Most defects are injected during requirements and design, not during coding. Processes that apply rigor at these early phases (design reviews, requirements reviews, formal inspections) remove defects when they are cheap to fix.

**Defect removal efficiency by activity (Jones, 2007, from multiple SEI studies):**

| Activity | Average Defect Removal Efficiency |
|----------|----------------------------------|
| Requirements reviews | 55-75% of requirements defects |
| Design reviews | 55-65% of design defects |
| Code inspections | 60-70% of code defects |
| Unit testing | 30-35% of remaining defects |
| Integration testing | 25-40% of remaining defects |
| System testing | 25-40% of remaining defects |

The implication is significant: organizations that skip upstream review activities (common at Level 1) are not merely delaying defect discovery — they are allowing defects to compound and propagate into later phases where removal is more expensive.

**Capers Jones's productivity and quality data** (Software Engineering Best Practices, 2010) documented that organizations at CMMI Level 5 achieved defect potentials (expected defects per function point before any removal) approximately equivalent to Level 1, but removed approximately 97% of them versus approximately 80% at Level 1. The result: escaped defects (defects delivered to users) were approximately 80-85% lower at Level 5 than Level 1 for equivalent software size.

### 4.4 The Measurement Trap

One failure mode in maturity transitions deserves explicit attention: measuring activity rather than outcome.

An organization that documents its processes thoroughly may believe it has reached Level 3. But if the documented processes are not actually followed, the documentation creates an illusion of maturity without the substance. This is the "paper compliance" failure mode — well-documented processes that exist only to pass audits, not to guide engineering practice.

The antidote is the focus on observable behavioral indicators: not "do we have a code review policy?" but "can you show me three recent code reviews where the policy was applied?" Not "is there a lessons learned process?" but "can you show me a process change that resulted from a lessons learned entry in the past six months?"

Level 4's quantitative measurement provides structural resistance to the paper compliance failure mode. When processes are measured, the measurement data will eventually reveal whether the process is actually operating or merely documented.

---

## 5. Assessing Current Maturity

### 5.1 Self-Assessment Methodology

A productive self-assessment takes approximately 60-90 minutes for a small team (5-15 people) and should involve three to five people with different roles: at least one developer, one technical lead, and one person responsible for project management or planning.

**Phase 1 — Gather artifacts (20-30 minutes)**

Before the assessment meeting, collect:
- The last project retrospective notes
- The most recent project plan or roadmap
- The code review policy (if any) and evidence of recent reviews
- The deployment procedure (if any)
- The onboarding documentation used for the last new hire
- The bug tracker or issue tracker, showing how defects are categorized and tracked
- Any post-mortem or incident report from the past six months

The artifacts reveal more than self-report. If you cannot find the code review policy, there is no code review policy regardless of what team members believe about their practices.

**Phase 2 — Apply the observable indicators (30-45 minutes)**

For each level, evaluate the behavioral indicators using a three-point scale:
- **Consistent (2 points):** This behavior is observed in all or nearly all situations; there is evidence.
- **Partial (1 point):** This behavior is observed sometimes; practice is inconsistent.
- **Absent (0 points):** This behavior is not observed; there is no evidence.

Score each level by summing the indicator scores. A level is "achieved" if all its core indicators score at least Partial and the majority score Consistent.

**Phase 3 — Calibrate for overestimation bias (10-15 minutes)**

Apply the following calibration questions:
1. For any behavior scored "Consistent": can you produce evidence from the past 30 days?
2. Is there any team member who would score this behavior differently? If so, the honest score is the lower estimate.
3. Does the behavior hold for ALL projects currently active, or only for some?

**Phase 4 — Identify the gap (10-15 minutes)**

Identify the highest level where at least half the indicators score Consistent. That is the current maturity estimate. The improvement target is the next level. Identify the two or three most impactful behavioral indicators from the next level that are currently absent and formulate specific, measurable actions to establish them.

### 5.2 Observable Indicators by Level (Self-Assessment Reference)

The following indicators are designed to be evaluated without CMMI expertise. Each can be answered yes or no based on observable evidence.

**Level 1 indicators (presence of these indicates you are NOT yet at Level 2):**

1. The deployment procedure for the main product exists only in one person's head or memory.
2. The team has no written definition of what constitutes "done" for a feature.
3. Bug reports do not have a consistent format; some have no reproduction steps.
4. There is no record of how long similar features took to build historically.
5. The onboarding process for a new developer is informal and varies by who happens to be available.
6. The team has no written process for handling customer-reported defects.
7. Code review happens only when someone requests it, not as a standard gate.

**Level 2 indicators (present at a managed organization):**

1. There is a written plan for the current project that includes scope, schedule, and key milestones.
2. The status of work items is tracked in a tool that any team member can access without asking.
3. Defects are tracked from discovery to resolution with a unique identifier.
4. Source code is version controlled; releases are tagged.
5. When the plan changes, the change is documented rather than silently absorbed.
6. The team can identify which version of the software is currently in production.
7. Code review is a standard step before merging; there is a written description of what reviewers check.

**Level 3 indicators (present at a defined organization):**

1. A new project starts from an organizational template or standard process rather than being invented from scratch.
2. A developer moving from one team to another recognizes the process vocabulary and ceremony structure.
3. Lessons from completed projects are documented and referenced at the start of subsequent projects.
4. Process exceptions (deliberate deviations from standard process) are documented with rationale.
5. Testing plans are written before coding begins and reference specific acceptance criteria.
6. The organization has a process improvement backlog — a list of known process problems being actively addressed.
7. Process documentation has a version history and a named owner responsible for keeping it current.

**Level 4 indicators (present at a quantitatively managed organization):**

1. The team can state its average lead time from commit to production deployment, with variance.
2. Test coverage is measured over time and reported; there are defined thresholds that gate releases.
3. Defect escape rates (defects reaching production per unit of software released) are trended month-over-month.
4. When a metric falls significantly outside its normal range, the team investigates automatically; they do not wait to be told there is a problem.
5. Process capability is estimated for key activities: the team knows its average code review duration, defect discovery rate per review, and what these numbers imply for project timelines.
6. Estimates for feature scope are made from empirical velocity data with stated confidence intervals.
7. Build pipeline metrics (duration, failure rate, flakiness) are monitored and there are targets for improvement.

**Level 5 indicators (present at an optimizing organization):**

1. Process improvements are proposed by individual contributors and evaluated using data; there is a formal intake mechanism.
2. Every significant production incident produces a process change, not just a technical fix.
3. The same class of defect does not recur across projects; root cause elimination is systematic.
4. Process documentation reviews happen on a defined schedule; documentation drift is detected and corrected.
5. New technologies and practices are evaluated through controlled experiments, not ad hoc adoption.
6. The organization benchmarks its processes against external references and uses the comparison to set improvement targets.
7. Defect prevention programs are in place and their effectiveness is measured.

### 5.3 Common Self-Assessment Biases and Corrections

**Aspirational scoring bias:** Teams score what they intend to do, or what they believe they should do, rather than what the evidence shows they actually do. Correction: require evidence for every Consistent score. If you cannot produce an artifact from the past 30 days, downgrade to Partial.

**Reference class selection bias:** Teams compare themselves to other organizations they believe are worse, not to the standard definition. "We're better than our previous employer" is not an assessment against the maturity model. Correction: anchor to the specific behavioral indicators, not to relative comparison.

**Heroism conflation:** Teams where individual contributors are exceptional often believe the team has good process, because individuals compensate for process gaps. Correction: ask whether the behavior holds when the exceptional individual is unavailable, and whether the behavior is consistent across all team members.

**Tooling conflation:** Teams that use sophisticated tools (Jira, GitHub Actions, SonarQube) often assume the tool's existence equals process maturity. Correction: tools are necessary but not sufficient. The question is whether the tool is used consistently, and whether the information it produces is acted upon.

**Single-project sampling:** Teams assess based on their most recent, most successful, or most visible project. Correction: the assessment must reflect the organization's typical performance across all active projects.

### 5.4 Gap Analysis Framework

Given a current maturity estimate and a target maturity level, a structured gap analysis identifies the specific actions required.

**Gap analysis template:**

```
Current Level: [N]
Target Level:  [N+1]
Assessment Date: [date]
Assessors: [roles, not names]

Behavioral Indicators — Current Level [N]:
  [indicator 1]: Consistent / Partial / Absent
  [indicator 2]: Consistent / Partial / Absent
  ...

Behavioral Indicators — Target Level [N+1]:
  [indicator 1]: Consistent / Partial / Absent → Action required if Partial or Absent
  [indicator 2]: Consistent / Partial / Absent → Action required if Partial or Absent
  ...

Priority Actions (top 3):
  1. [Specific action] → [Owner] → [Target date] → [Measurement of completion]
  2. [Specific action] → [Owner] → [Target date] → [Measurement of completion]
  3. [Specific action] → [Owner] → [Target date] → [Measurement of completion]

Review Date: [3 months from assessment]
```

The priority actions should be scoped to be completable within 90 days. Larger changes (e.g., implementing organization-wide process standardization for Level 3) should be decomposed into 90-day increments. Progress reviews at 90-day intervals prevent the common failure mode where process improvement intentions never translate into changed behavior because the timescales are too long.

---

## 6. Maturity in Agentic Systems

### 6.1 The New Team Composition

Traditional process maturity models were designed for teams of human engineers. The maturity indicators — documentation, communication, review, measurement — assumed human agents performing these activities. As software engineering increasingly involves AI agents performing analysis, code generation, testing, and deployment, the question arises: how does process maturity apply when the team includes non-human actors?

The answer is not that it doesn't apply. It is that it applies with additional complexity. AI agents introduce characteristics that are simultaneously a maturity asset and a maturity liability:

**Asset:** AI agents can execute defined processes with perfect consistency. An agent that follows a defined procedure does not deviate from it due to distraction, fatigue, or personal preference. This is Level 3's consistency requirement operationalized in hardware.

**Liability:** AI agents can execute defined processes with perfect consistency — including consistently executing a flawed process. The failure mode of an AI agent following a bad SOP is systematic, not random. Bad SOPs at human-scale produce inconsistent outcomes; bad SOPs at AI-agent scale produce consistently bad outcomes at high velocity.

This asymmetry argues for higher process maturity requirements when AI agents are in the execution loop, not lower ones. An organization deploying AI agents without well-defined SOPs for those agents is operating at a structural maturity deficit regardless of its CMMI level on the human side.

### 6.2 GSD as a Maturity Framework Implementation

The GSD (Get Shit Done) ecosystem can be analyzed directly through the CMMI maturity lens. This is not merely metaphorical — GSD's architectural components map to specific maturity level requirements.

**Level 2 — Managed:**
- Wave plans document scope and sequence for each milestone.
- Task tracking (via GSD phases and milestones) provides status visibility.
- The `.planning/STATE.md` document provides persistent project state.
- Commit conventions enforce basic configuration management discipline.

**Level 3 — Defined:**
- Skills (`.claude/skills/`) are the organizational standard process library. Each skill defines a repeatable process for a category of work.
- Chipset configurations define the standard agent composition for different work types — the equivalent of staffing standards.
- The session-awareness skill provides cross-session context persistence, implementing the "lessons learned" mechanism.
- SKILL.md format is the SOP template for agentic processes. It defines the standard sections that all agent-executable procedures must contain.

**Level 4 — Quantitatively Managed:**
- CAPCOM gates in mission plans are measurement checkpoints. They are the Level 4 measurement points at which process and product quality data are reviewed before proceeding.
- Token budget tracking provides resource consumption measurement.
- Chain scores (the 4.xx quality assessments at milestone completion) provide quantitative outcome measurement that can be trended across releases.
- The defect tracking that feeds into retrospectives provides the measurement data.

**Level 5 — Optimizing:**
- The bounded learning rule governs how the system updates its process based on experience. Each retrospective that produces a skills update is a CMMI Level 5 continuous improvement cycle.
- The ecosystem-alignment skill monitors external process environment changes (new Claude Code features, GSD updates) and signals when organizational processes need updating.
- The mission pack pipeline (vision → wave plan → parallel executors → atomic commits) represents a formally defined, measured, and continuously improved development process.

### 6.3 Wave Plans as Defined Processes

A wave plan is the agentic equivalent of a defined process. It specifies:
- The work to be performed (tasks)
- The sequence and parallelism (waves)
- The agent configuration (model, role)
- The success criteria (gates)
- The measurement points (verification steps)

A wave plan that is executed once and discarded is an ad hoc process (Level 1). A wave plan that is parameterized and reused across missions is an organizational standard process (Level 3). A wave plan that includes measurement points, collects execution data, and is updated based on that data is a Level 4-5 process.

The mission pack pattern in GSD represents Level 3: a standard process (vision-to-mission skill → mission generator → wave execution) that is consistently applied across all missions. The individual wave plans are tailored instances of this standard, with explicit departures documented (the tailoring record).

### 6.4 CAPCOM Gates as Level 4 Measurement Points

The CAPCOM role in GSD mission execution is the human operator who reviews wave outputs at defined checkpoints and provides go/no-go decisions. This maps directly to:
- **Level 4 measurement:** CAPCOM reviews quantitative outcome data (test counts, coverage percentages, deliverable completeness against schema) before authorizing continuation.
- **Statistical process control:** When CAPCOM consistently approves work that later requires rework, this signals a process calibration issue — the measurement criteria are not predicting quality accurately.

The CAPCOM gate is also the human-in-the-loop for the accountability gradient: decisions with higher consequence (production deployments, public releases, irreversible actions) receive CAPCOM review; lower-consequence decisions are delegated to automated verification.

This maps directly to the NASA IV&V principle: independent review proportional to consequence. The CAPCOM gate for a major release is functionally equivalent to NASA's flight readiness review — a structured checkpoint where independent review confirms that all criteria are met before proceeding.

### 6.5 Bounded Learning as Continuous Improvement

Level 5 organizations improve their processes based on measurement data. In an agentic system, the equivalent mechanism is bounded learning: the system updates its operational parameters (skills, prompts, agent configurations) based on observed performance data, within defined constraints.

The "bounded" qualifier is critical. Unbounded learning in an agentic system is a safety concern: an agent that continuously modifies its own operating procedures without human review and approval is analogous to a Level 1 organization where heroic individuals rewrite the rules based on their current understanding. The result is a system that cannot be audited, cannot be reproduced, and cannot be trusted.

Bounded learning in GSD operates through:
- **Skill updates:** Improvements to skill files require human review and commit approval.
- **Retrospective-driven changes:** Process changes proposed by agents are documented in retrospective artifacts and require human acceptance before implementation.
- **Hook system:** The pre-commit hook enforces process discipline (commit message format) at the tooling level, creating structural resistance to process drift.

This is CMMI Level 5's continuous improvement mechanism with the addition of a human boundary condition — the equivalent of a change control board that reviews and approves process updates before they go into the organizational standard.

### 6.6 Implications for SOP Design in Agentic Systems

Organizations deploying AI agents in engineering workflows face a novel SOP design challenge: the procedure consumer is not a human who can apply judgment to ambiguous steps. Agent-executable SOPs must satisfy higher precision requirements than human-executable SOPs:

1. **No implicit steps:** Every prerequisite action must be explicitly stated. An agent cannot infer that "before running the deployment script, ensure the staging environment is clean" even if any experienced engineer would know this.

2. **Measurable completion criteria for every step:** "Review the code" is not a complete instruction for an agent. "Run the static analysis tool and confirm zero critical-severity findings" is.

3. **Explicit decision logic:** Branching decisions must have defined criteria. "If the build fails, investigate" is insufficient. "If the build fails, capture the failure log, classify the failure type using the attached decision tree, and follow the branch for that failure type" is agent-executable.

4. **Defined scope boundaries:** An agent without explicit scope limits will continue executing until it exhausts all possible actions, or until an error occurs. Every agent-executable SOP must define its terminal condition.

5. **Rollback procedures:** For any step that modifies state, the SOP must specify the rollback procedure. Agents cannot improvise recovery; they execute defined procedures.

These requirements are not unique to AI agents — they represent best practice for any high-reliability SOP. NASA Class A software procedures have always required this level of precision. What has changed is that the deployment of AI agents makes this level of precision economically feasible for a much wider range of organizational processes.

---

## 7. Synthesis and Practical Guidance

### 7.1 Choosing a Framework

CMMI, NPR 7150.2D, and ISO 12207 are not competing alternatives. They represent different scopes:
- **CMMI** is an organizational maturity assessment tool and improvement roadmap.
- **NPR 7150.2D** is a comprehensive process standard for safety-critical software development in a specific organizational context (NASA).
- **ISO/IEC 12207** is an international standard defining what processes must exist in any software organization.

A commercial software engineering organization might use:
- ISO 12207 as the process completeness checklist (what processes must we have?)
- CMMI as the maturity roadmap (in what order do we build those processes?)
- NPR 7150.2D as a source of specific implementation patterns for the highest-criticality components of their system

### 7.2 The SOP as Maturity Artifact

An SOP is not merely documentation. It is evidence of process maturity. The presence of a well-structured, versioned, approved, and actively-used SOP is observable evidence of Level 3 characteristics. The presence of SOPs with version history, measurement criteria, and documented improvement history is evidence of Level 4-5 characteristics.

Conversely, the absence of SOPs — or the presence of SOPs that are never consulted and frequently inaccurate — is observable evidence of Level 1-2 characteristics regardless of what the organization believes about itself.

This is why SOP development is not a documentation exercise. It is a process maturity exercise. The act of writing a procedure forces the team to articulate what they actually do, to decide what they should do, to identify the gaps between current and desired practice, and to establish an accountable record that can be measured and improved.

### 7.3 A Practical Entry Point for Most Organizations

For an organization at Level 1 or Level 2 attempting to move toward Level 3, the following sequence has the highest probability of success:

**Month 1-2:** Identify the five most critical operational procedures that currently exist only in people's heads. Write them down. Use the canonical 8-section SOP structure. Have someone who was not involved in writing each procedure attempt to execute it and report where it fails.

**Month 3-4:** Establish version control for the SOP library. Even a shared Git repository works. Every SOP needs a version number, an effective date, an owner, and a changelog.

**Month 5-6:** Establish a change control process for SOPs. No procedure changes without a documented request, review, and approval. Begin tracking which SOPs are actually used versus which are ignored.

**Month 7-9:** Introduce basic measurement. For each critical procedure, define what evidence of compliance looks like. Begin collecting that evidence.

**Month 10-12:** Conduct the first formal process improvement cycle. Review SOP usage data, identify the procedures most frequently bypassed or incorrect, update them based on evidence, and document the reasoning.

This 12-month sequence is the L1→L3 path compressed into a single year for a small organization with strong executive commitment. Larger organizations will take longer; organizations without executive commitment will stall between months 2 and 4.

---

## References

**Primary Standards and Requirements:**

- CMMI Institute / ISACA. *CMMI Version 3.0*. Pittsburgh: CMMI Institute, 2023.
- Chrissis, Mary Beth, Mike Konrad, and Sandy Shrum. *CMMI for Development, Version 1.3*. Boston: Addison-Wesley, 2011.
- NASA. *NASA Procedural Requirements 7150.2D: NASA Software Engineering Requirements*. Washington, D.C.: NASA, 2022.
- NASA. *NASA Software Engineering Handbook (NASA-HDBK-2203)*. Washington, D.C.: NASA, 2013.
- NASA. *Software Assurance and Software Safety Standard (NASA-STD-8739.8A)*. Washington, D.C.: NASA, 2019.
- ISO/IEC/IEEE. *ISO/IEC/IEEE 12207:2017 Systems and Software Engineering — Software Life Cycle Processes*. Geneva: ISO, 2017.
- ISO/IEC/IEEE. *ISO/IEC/IEEE 15289:2017 Systems and Software Engineering — Content of Life-Cycle Information Items*. Geneva: ISO, 2017.

**Research Literature:**

- Jones, Capers, and Barbara Soule. *Software Process Improvement and Product Line Practice*. CMU/SEI-2002-TN-012. Pittsburgh: Carnegie Mellon University Software Engineering Institute, 2002.
- Jones, Capers. *Software Engineering Best Practices*. New York: McGraw-Hill, 2010.
- Herbsleb, James, and David Goldenson. "A systematic survey of CMM experience and results." *Proceedings of ICSE 1996*. Los Alamitos: IEEE Computer Society, 1996. 323-330.
- Humphrey, Watts S. *Managing the Software Process*. Boston: Addison-Wesley, 1989.

**NASA Systems:**

- NASA Lessons Learned Information System (LLIS). llis.nasa.gov. (Agency-wide lessons learned repository, continuously updated.)
- NASA Software Processes Across NASA (SPAN). (Agency-wide process asset library, internal NASA system.)

---

*Module M2 complete. Observable behavioral indicators for all five CMMI levels, NASA NPR 7150.2D structural analysis, ISO/IEC 12207 process classification, empirical evidence connecting maturity to outcomes, self-assessment methodology, and agentic systems extension. Word count: approximately 9,400 words. Feeds M4 (AI-Augmented SOP Development) and M5 (GSD-Specific SOP Implementation).*
