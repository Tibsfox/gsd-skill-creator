# Governance Frameworks for Modular Systems

> **Domain:** Systems Governance & Organizational Architecture
> **Module:** 3 -- Change Management, Approval Workflows, and Quality Gates
> **Through-line:** *Governance is not bureaucracy. Bureaucracy is governance that forgot why it exists.* A well-governed modular system has clear rules about who can change what, how changes are reviewed, and what happens when a change breaks a contract. These rules exist to protect the system's integrity -- not to slow it down. The best governance is invisible when things go well and decisive when things go wrong. Like the Amiga's custom chipset: each chip knows its job, and the boundaries between them are what makes the whole system work.

---

## Table of Contents

1. [What Governance Actually Means](#1-what-governance-actually-means)
2. [The Three Pillars: Visibility, Accountability, Reversibility](#2-the-three-pillars-visibility-accountability-reversibility)
3. [Change Management Frameworks](#3-change-management-frameworks)
4. [Approval Workflows and Human Gates](#4-approval-workflows-and-human-gates)
5. [Quality Gates in CI/CD Pipelines](#5-quality-gates-in-cicd-pipelines)
6. [The Governance Problem in Open Ecosystems](#6-the-governance-problem-in-open-ecosystems)
7. [CNCF Graduation Model](#7-cncf-graduation-model)
8. [RFC Processes and Design Documents](#8-rfc-processes-and-design-documents)
9. [Governance Applied to Research Modules](#9-governance-applied-to-research-modules)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. What Governance Actually Means

Software governance is the set of policies, processes, and practices that determine how decisions are made about a system's evolution. It answers four questions [1]:

1. **Who** can make changes? (Authority)
2. **What** changes require approval? (Scope)
3. **How** are changes reviewed? (Process)
4. **When** can changes be reversed? (Reversibility)

These questions apply at every scale: from a single function in a codebase to an entire ecosystem of independent packages. The answers may differ by scale, but the questions are universal.

### Governance vs. Management

Governance and management are often conflated. The distinction matters:

| Aspect | Governance | Management |
|--------|-----------|------------|
| Focus | Rules and boundaries | Execution and delivery |
| Question | "Should we?" | "How do we?" |
| Timeframe | Long-term principles | Short-term decisions |
| Authority | Policy-setting body | Operational team |
| Output | Frameworks and constraints | Deliverables and artifacts |
| Example | "Research modules must stay under 400 lines" | "Module 05 needs to be promoted to a standalone spec" |

In the GSD ecosystem, the GOVERNANCE.md document is a governance artifact: it defines size contracts, promotion triggers, and document class boundaries. The mission pack is a management artifact: it specifies how to execute the work within those boundaries [2].

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [ACE](../ACE/)

---

## 2. The Three Pillars: Visibility, Accountability, Reversibility

Effective governance rests on three pillars that must all be present for the system to function. Remove any one, and governance degrades into either anarchy (no rules) or bureaucracy (rules without purpose) [3].

### Visibility

Every participant in the system must be able to see what is happening: what changed, when it changed, and why. In version-controlled systems, the commit log provides visibility. In governance systems, the audit trail provides visibility [3].

```
VISIBILITY MECHANISMS BY DOMAIN
================================================================

  Code:           git log, PR history, blame
  Packages:       Registry changelog, release notes
  Research:       Citation history, retraction notices
  Infrastructure: Audit logs, change records
  Governance:     Decision records, RFC archives

  The common thread: nothing happens in the dark.
  Every decision has a record. Every change has a trail.
```

### Accountability

Every change must have an identifiable author who accepted responsibility for the consequences. In code, this is the commit author. In governance, this is the approver who signed off on the change [1].

The GSD ecosystem's CAPCOM role embodies accountability: the human at the gate who says "go" or "no-go" at wave boundaries. This is not a rubber stamp -- it is a human accepting responsibility for the consequences of proceeding [2].

### Reversibility

Every change must be reversible, or the cost of reversal must be explicitly documented. In code, `git revert` provides reversibility. In governance, rollback procedures and version archival provide reversibility [4].

```
REVERSIBILITY BY CHANGE TYPE
================================================================

  Change Type       | Reversibility     | Cost
  ------------------|-------------------|--------------------
  Code commit       | git revert        | Low (seconds)
  Package publish   | Yank/deprecate    | Medium (consumers affected)
  Research update   | Version archive   | Medium (citations affected)
  Governance change | Policy rollback   | High (process disruption)
  Schema migration  | Backward migration| Very high (data loss risk)
```

> **Related:** [ACE](../ACE/), [SYS](../SYS/), [COK](../COK/)

---

## 3. Change Management Frameworks

Change management is the structured approach to transitioning a system from one state to another. Several frameworks have been developed across different domains [5, 6].

### ITIL Change Management

The Information Technology Infrastructure Library (ITIL) defines three change types [5]:

- **Standard change:** Pre-authorized, low-risk, follows a documented procedure. Example: updating a patch-level dependency.
- **Normal change:** Requires assessment and authorization through the change advisory board (CAB). Example: updating a major version of a framework dependency.
- **Emergency change:** Bypasses normal process due to urgency. Example: patching a critical security vulnerability.

### The Change Advisory Board (CAB)

A CAB is a group of stakeholders who review and authorize changes. In software, this often manifests as a code review requirement: changes to critical paths require approval from designated reviewers before merging [5].

| CAB Model | Participants | Decision Speed | Risk Tolerance |
|-----------|-------------|----------------|----------------|
| Full CAB | All stakeholders | Slow (days) | Very low |
| Delegated CAB | Domain experts only | Medium (hours) | Low-medium |
| Peer review | Any qualified reviewer | Fast (minutes to hours) | Medium |
| Automated gate | CI/CD pipeline | Instant | Rules-based |

### Kotter's 8-Step Model (Applied to Module Governance)

John Kotter's change management framework, originally developed for organizational change, maps to module governance adoption [6]:

1. **Create urgency:** Module 05 at 706 lines demonstrates the cost of absent governance.
2. **Form a coalition:** CRAFT-SPEC and CRAFT-GOV specialists design the governance framework.
3. **Create a vision:** Size contracts and promotion triggers define the target state.
4. **Communicate the vision:** GOVERNANCE.md is the communication artifact.
5. **Remove barriers:** The promotion pathway removes the barrier of "too big for its container."
6. **Generate wins:** The first successful promotion (Module 05) validates the framework.
7. **Build on gains:** Audit all existing modules against the new governance contracts.
8. **Anchor changes:** Governance document committed to the repository; enforced in future missions.

> **Related:** [PMG](../PMG/), [GSD2](../GSD2/), [SYS](../SYS/)

---

## 4. Approval Workflows and Human Gates

Approval workflows are the mechanisms that ensure changes are reviewed before they take effect. In software development, the pull request is the dominant approval workflow pattern [7].

### Pull Request as Governance Mechanism

A pull request (PR) is a governance instrument, not just a collaboration tool. It provides:

- **Visibility:** The diff shows exactly what changed.
- **Discussion:** Comments capture the reasoning behind decisions.
- **Approval:** Required reviewers must explicitly approve before merge.
- **Automation:** CI checks run automatically, providing machine assessment.
- **Audit trail:** The PR record persists after merge.

### Branch Protection Rules

GitHub's branch protection rules enforce governance at the repository level [8]:

```
BRANCH PROTECTION -- GOVERNANCE ENFORCEMENT
================================================================

  main branch:
    ├── Require pull request reviews: YES (minimum 1)
    ├── Require status checks to pass: YES
    │     ├── CI build
    │     ├── Test suite
    │     ├── Lint check
    │     └── Security scan
    ├── Require branches to be up to date: YES
    ├── Require signed commits: OPTIONAL
    ├── Restrict push access: YES (maintainers only)
    └── Require linear history: OPTIONAL

  dev branch:
    ├── Require pull request reviews: OPTIONAL
    ├── Require status checks to pass: YES
    └── Allow force push: NO
```

### Human-in-the-Loop (HITL) Gates

In automated pipelines, HITL gates are deliberate insertion points where a human must approve before execution continues. The GSD ecosystem's CAPCOM role at wave boundaries is a HITL gate: the orchestrator pauses, presents the current state, and waits for human approval [2].

HITL gates are expensive -- they introduce latency and require human attention. They should be placed at high-consequence decision points, not at routine checkpoints:

| Gate Placement | Consequence of Error | HITL Appropriate? |
|---------------|---------------------|-------------------|
| Patch dependency update | Low -- bug fix only | No (automated) |
| Minor dependency update | Medium -- new features | Maybe (advisory) |
| Major dependency update | High -- breaking changes | Yes (HITL required) |
| Production deployment | Very high -- user impact | Yes (HITL required) |
| Research module promotion | Medium -- container change | Yes (quality gate) |

> **Related:** [ACE](../ACE/), [GSD2](../GSD2/), [SYS](../SYS/)

---

## 5. Quality Gates in CI/CD Pipelines

Quality gates are automated checkpoints in a CI/CD pipeline that enforce governance rules without human intervention. They are the machine complement to HITL gates: fast, consistent, tireless [9].

### Gate Categories

| Category | What It Checks | Failure Action |
|----------|---------------|----------------|
| Build gate | Code compiles without errors | BLOCK |
| Test gate | Tests pass at required coverage | BLOCK |
| Lint gate | Code style and formatting | BLOCK or WARN |
| Security gate | No known vulnerabilities | BLOCK (critical) or WARN (medium) |
| License gate | No incompatible licenses | BLOCK |
| Size gate | Artifact size within bounds | WARN |
| Performance gate | Benchmarks within thresholds | WARN |
| Governance gate | Module within size contract | BLOCK or PROMOTE |

### The Governance Gate Pattern

A governance gate specific to the module governance domain checks structural properties rather than behavioral properties:

```
GOVERNANCE GATE -- RESEARCH MODULE VALIDATION
================================================================

  Input: research module candidate

  CHECK 1: Line count
    ├── < 150 lines → FAIL (too thin for survey)
    ├── 150-400 lines → PASS
    └── > 400 lines → PROMOTE (exceeds survey bounds)

  CHECK 2: Content marker scan
    ├── TypeScript/Rust interfaces found? → PROMOTE
    ├── Token budget tables found? → PROMOTE
    ├── ASCII diagrams > 15 lines? → PROMOTE
    ├── API integration contracts? → PROMOTE
    ├── Versioning headers? → PROMOTE
    └── > 3 independent subsections? → PROMOTE

  CHECK 3: Source density
    ├── < 3 sources per 100 lines → WARN (thin evidence)
    ├── 3-8 sources per 100 lines → PASS
    └── > 8 sources per 100 lines → PASS (rich evidence)

  CHECK 4: Cross-reference integrity
    ├── All referenced projects exist? → PASS
    └── Broken reference found? → FAIL
```

### SonarQube Quality Gates

SonarQube, the most widely used continuous inspection platform, defines quality gates as conditions on code metrics that must be met before code can be promoted to the next stage. Common gate conditions [10]:

- Coverage on new code > 80%
- No new blocker or critical issues
- Duplicated lines on new code < 3%
- Maintainability rating on new code = A

The principle transfers directly to document governance: define measurable conditions, automate the checks, and enforce the results.

> **Related:** [K8S](../K8S/), [SYS](../SYS/), [CDL](../CDL/)

---

## 6. The Governance Problem in Open Ecosystems

Open ecosystems -- npm, crates.io, PyPI, Maven Central -- face a governance paradox: the ecosystem's value comes from openness (anyone can publish), but its integrity requires governance (not everything published is safe or useful). Balancing these forces is the central challenge of open-ecosystem governance [11].

### The Tragedy of the Commons in Package Registries

Public package registries are shared resources subject to commons dynamics:

- **Over-publication:** Low barrier to publish leads to namespace pollution. npm has 2.5M+ packages; many are abandoned, trivial, or duplicative [12].
- **Under-maintenance:** Maintainers are not compensated for the public good their packages provide. Burnout leads to abandonment, which leads to supply chain risk [13].
- **Name squatting:** Valuable package names are claimed but not used, preventing legitimate projects from using them [12].

### Ecosystem-Level Governance Models

| Ecosystem | Governance Model | Quality Control | Trust Model |
|-----------|-----------------|-----------------|-------------|
| npm | Open -- anyone publishes | Minimal (malware scanning) | Reputation + downloads |
| crates.io | Open -- anyone publishes | Community-driven | Reputation + audits |
| PyPI | Open -- anyone publishes | Minimal | Reputation + downloads |
| Maven Central | Gated -- namespace verified | Moderate (metadata required) | Namespace ownership |
| Debian/Fedora | Curated -- packages reviewed | High (maintainer review) | Web of trust (GPG) |
| Homebrew | Curated -- PRs reviewed | High (formula review) | Core team + community |

### The Curation vs. Openness Spectrum

```
GOVERNANCE SPECTRUM
================================================================

  OPEN                                            CURATED
  |                                                   |
  npm          crates.io      Maven       Debian      |
  PyPI                        Central     Fedora      |
  |                                       Homebrew    |
  |                                                   |
  Low barrier                       High quality gate
  High volume                       Lower volume
  Higher risk                       Lower risk
  Innovation-friendly              Stability-friendly
```

The GSD research series sits toward the curated end: every project is designed, reviewed, and committed by a known team. The governance problem is internal (how to maintain quality across 130+ projects) rather than external (how to prevent malicious submissions) [2].

> **Related:** [PMG](../PMG/), [ACE](../ACE/), [COK](../COK/)

---

## 7. CNCF Graduation Model

The Cloud Native Computing Foundation (CNCF) provides one of the most sophisticated governance models for open-source project maturity. Projects progress through three stages: Sandbox, Incubating, and Graduated [14].

### Graduation Criteria

| Criterion | Sandbox | Incubating | Graduated |
|-----------|---------|------------|-----------|
| Adopters | Early interest | Production users | Broad production adoption |
| Committers | 1+ | 3+ from 2+ orgs | Healthy contributor base |
| Governance | Informal | Documented | Formal, documented, enforced |
| Security | Audit planned | Audit completed | Ongoing security practices |
| Documentation | Minimal | User-facing docs | Comprehensive docs |
| Release process | Informal | Defined | Mature with LTS |

### CNCF Applied to Research Modules

The graduation model maps to research module maturity:

| Stage | Research Module Equivalent | Size | Sources | Review |
|-------|--------------------------|------|---------|--------|
| Sandbox | Draft outline (< 150 lines) | Below minimum | < 5 | Self-review |
| Incubating | Working module (150-400 lines) | Within contract | 10-20 | Peer review |
| Graduated | Published module (150-400 lines, all checks pass) | Within contract | 15+ | Governance gate + HITL |
| Promoted | Standalone spec (200+ lines) | Exceeded survey bounds | 20+ | Full review |

> **Related:** [K8S](../K8S/), [GSD2](../GSD2/), [ACE](../ACE/)

---

## 8. RFC Processes and Design Documents

An RFC (Request for Comments) process is a governance mechanism for proposing, discussing, and deciding on significant changes to a system. The pattern originates with the Internet Engineering Task Force (IETF) but has been widely adopted in software projects [15].

### RFC Lifecycle

```
RFC LIFECYCLE
================================================================

  DRAFT → REVIEW → ACCEPTED → IMPLEMENTED → CLOSED
    |         |        |           |            |
    |         |        |           |            └── Archived
    |         |        |           └── Code merged
    |         |        └── Decision recorded
    |         └── Community discussion
    └── Author drafts proposal

  Alternative outcomes:
    DRAFT → REVIEW → REJECTED → ARCHIVED
    DRAFT → REVIEW → DEFERRED → (revisited later)
```

### RFC in Practice

| Project | RFC Location | Decision Maker | Notable RFCs |
|---------|-------------|----------------|--------------|
| Rust | rust-lang/rfcs | Lang/Libs team | RFC 2094 (NLL), RFC 3498 (edition 2024) |
| React | reactjs/rfcs | React team | RFC 0188 (Server Components) |
| Ember | emberjs/rfcs | Core team | RFC 0176 (Octane) |
| Python | PEPs | Steering Council | PEP 8, PEP 484 (type hints) |
| Kubernetes | KEPs | SIG leads | KEP-1287 (in-place pod updates) |

### Design Documents as Governance Artifacts

Design documents (design docs, ADRs, technical memos) are governance artifacts that capture the reasoning behind significant decisions. They serve as both approval mechanism (the document must be approved before implementation) and historical record (future maintainers can understand why decisions were made) [16].

The Architecture Decision Record (ADR) format, proposed by Michael Nygard, provides a lightweight template:

- **Title:** Short description of the decision
- **Status:** Proposed / Accepted / Deprecated / Superseded
- **Context:** What forces led to this decision?
- **Decision:** What was decided?
- **Consequences:** What are the positive and negative outcomes?

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [COK](../COK/)

---

## 9. Governance Applied to Research Modules

The GSD research series requires governance that respects the nature of knowledge artifacts: they are not code (they cannot be tested automatically), they are not static (the knowledge they contain evolves), and they are not independent (they form a citation network with other modules) [2].

### The Governance Ledger

The verification matrix for research module governance -- "The Governance Ledger" -- tracks compliance across all modules:

| Check | What | Automated? | Failure Response |
|-------|------|-----------|-----------------|
| Line count | Within size contract | Yes | PROMOTE or FAIL |
| Content markers | Spec-level content detected | Yes | PROMOTE |
| Source density | Adequate citation density | Yes | WARN |
| Cross-ref integrity | All references resolve | Yes | FAIL |
| Source currency | Cited sources still current | Semi | ADVISORY |
| Through-line present | Module has narrative coherence | No (HITL) | REVISE |
| Table of contents | Section structure follows pattern | Yes | FAIL |
| Deduplication | No significant overlap with other modules | Semi | ADVISORY |

### Governance as Living Document

GOVERNANCE.md is committed to the repository and versioned alongside the code it governs. When the governance rules change, the change is tracked in the same commit history as any other change. This makes governance itself subject to governance: changes to the rules require the same review process as changes to the artifacts the rules govern [2].

This is the recursive elegance of well-designed governance: the system governs itself by the same principles it applies to its contents. The Amiga's chipset designed its own timing: Paula's audio DMA slots were allocated by Agnus, and Agnus's slot allocation was constrained by the timing that Paula needed. The constraints were circular, but the system was stable because each constraint was explicit and each chip respected the others' boundaries [17].

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [COK](../COK/), [MCF](../MCF/)

---

## 10. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Change management | M3, M4, M5 | PMG, GSD2, SYS |
| Approval workflows | M3, M4 | ACE, GSD2, SYS |
| Quality gates | M3, M5 | K8S, SYS, CDL |
| Open ecosystem governance | M3, M2 | PMG, ACE, COK |
| CNCF graduation | M3, M4 | K8S, GSD2, ACE |
| RFC processes | M3, M4 | GSD2, PMG, COK |
| HITL gates | M3, M1, M5 | ACE, GSD2, SYS |
| Governance ledger | M3, M4, M5 | GSD2, COK, MCF |
| Research module governance | M3, M1, M4 | GSD2, PMG, MCF |

---

## 11. Sources

1. Weill, P., & Ross, J. W. (2004). *IT Governance: How Top Performers Manage IT Decision Rights for Superior Results*. Harvard Business School Press. Foundational framework for IT governance.
2. GSD Ecosystem (2026). *Module Governance & Upstream Intelligence Mission Pack*. Internal mission documentation.
3. ISO/IEC 38500:2015. *Information Technology -- Governance of IT for the Organization*. International standard for IT governance.
4. Humble, J., & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*. Addison-Wesley. Foundational text on deployment governance.
5. Axelos (2019). *ITIL Foundation: ITIL 4 Edition*. TSO (The Stationery Office). Change management framework in the ITIL context.
6. Kotter, J. P. (1996). *Leading Change*. Harvard Business Review Press. Eight-step change management model.
7. Gousios, G., et al. (2014). "An Exploratory Study of the Pull-Based Software Development Model." *ICSE*. Empirical study of pull requests as governance mechanisms.
8. GitHub Documentation (2024). "About protected branches." docs.github.com. Branch protection as governance enforcement.
9. Kim, G., et al. (2016). *The DevOps Handbook: How to Create World-Class Agility, Reliability, and Security in Technology Organizations*. IT Revolution Press. Quality gates in continuous delivery.
10. SonarSource (2024). "Quality Gates." docs.sonarqube.org. Automated code quality governance.
11. Eghbal, N. (2020). *Working in Public: The Making and Maintenance of Open Source Software*. Stripe Press. Governance challenges in open-source ecosystems.
12. npm (2024). "npm Registry Statistics." npmjs.com. Scale and governance challenges of the npm ecosystem.
13. Eghbal, N. (2016). *Roads and Bridges: The Unseen Labor Behind Our Digital Infrastructure*. Ford Foundation. Maintenance burden and governance in open source.
14. CNCF (2024). "Project Lifecycle." cncf.io. Cloud Native Computing Foundation graduation model.
15. IETF (2004). RFC 3935: "A Mission Statement for the IETF." Internet Engineering Task Force. Original RFC process governance.
16. Nygard, M. (2011). "Documenting Architecture Decisions." cognitect.com/blog. Architecture Decision Record (ADR) format.
17. Miner, J., et al. (1985). *Amiga Hardware Reference Manual*. Commodore-Amiga. Custom chipset architecture and DMA timing.
