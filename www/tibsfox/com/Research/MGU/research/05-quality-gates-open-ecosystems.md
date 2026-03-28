# Quality Gates & the Governance Problem in Open Ecosystems

> **Domain:** Ecosystem Governance & Software Supply Chain
> **Module:** 5 -- Quality Enforcement, Ecosystem Health, and the Boundary Between Freedom and Safety
> **Through-line:** *An open ecosystem that governs nothing will be consumed by entropy. An open ecosystem that governs everything will be consumed by bureaucracy. The art is in the boundary: enough governance to maintain integrity, enough freedom to maintain innovation.* The npm registry has 2.5 million packages because publishing is easy. It also has thousands of malicious, abandoned, and broken packages for the same reason. Quality gates are the mechanism that transforms an open registry from a dump into a library -- and the design of those gates determines whether the library is useful or oppressive.

---

## Table of Contents

1. [The Quality Gate Concept](#1-the-quality-gate-concept)
2. [Gate Design Principles](#2-gate-design-principles)
3. [Automated vs. Human Gates](#3-automated-vs-human-gates)
4. [The Governance Ledger](#4-the-governance-ledger)
5. [Ecosystem Health Monitoring](#5-ecosystem-health-monitoring)
6. [The Open Ecosystem Paradox](#6-the-open-ecosystem-paradox)
7. [License Governance](#7-license-governance)
8. [Security Governance in Dependency Chains](#8-security-governance-in-dependency-chains)
9. [Governance Patterns from Real Ecosystems](#9-governance-patterns-from-real-ecosystems)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Quality Gate Concept

A quality gate is a checkpoint in a pipeline where an artifact must meet defined criteria before it can proceed to the next stage. Quality gates are the enforcement mechanism that turns governance policies into operational reality [1].

The concept originates in manufacturing, where quality inspection points are placed at critical junctions in the production line. In software, quality gates appear at build time (does it compile?), test time (do tests pass?), review time (is it approved?), and deployment time (is it safe for production?) [2].

### Gate Taxonomy

| Gate Type | What It Checks | Who/What Decides | Speed |
|-----------|---------------|------------------|-------|
| Build gate | Compilation success | Compiler | Seconds |
| Test gate | Behavioral correctness | Test framework | Minutes |
| Lint gate | Style and formatting | Linter | Seconds |
| Security gate | Known vulnerabilities | Scanner (Trivy, Snyk) | Minutes |
| License gate | License compatibility | Scanner (FOSSA, Licensee) | Seconds |
| Coverage gate | Test coverage threshold | Coverage tool | Minutes |
| Performance gate | Benchmark regression | Benchmark framework | Minutes |
| Size gate | Artifact size limits | Custom check | Seconds |
| Governance gate | Document class compliance | Custom check + HITL | Varies |
| Approval gate | Human review | Reviewer | Hours to days |

### Gate Outcomes

Every gate produces one of four outcomes:

```
GATE OUTCOME MODEL
================================================================

  PASS:     Criteria met. Proceed to next stage.
  FAIL:     Criteria not met. Block. Require remediation.
  WARN:     Criteria marginal. Proceed with logged advisory.
  PROMOTE:  Criteria indicate class change. Trigger promotion assessment.
```

The PROMOTE outcome is specific to governance gates: the artifact passes quality checks but is flagged as having exceeded the boundaries of its current document class. This is not a failure -- it is a signal that the content has matured beyond its container [3].

> **Related:** [K8S](../K8S/), [SYS](../SYS/), [CDL](../CDL/)

---

## 2. Gate Design Principles

Effective quality gates follow design principles that balance enforcement with developer experience [2, 4]:

### Principle 1: Fast Feedback

Gates should run as quickly as possible. A gate that takes 30 minutes discourages frequent commits. A gate that takes 30 seconds enables tight feedback loops. When speed is not achievable, structure gates in tiers: fast gates first, slow gates later [4].

```
TIERED GATE EXECUTION
================================================================

  Tier 1 (seconds):  Lint, format, size check
       |
       | only if Tier 1 passes
       v
  Tier 2 (minutes):  Build, unit tests, security scan
       |
       | only if Tier 2 passes
       v
  Tier 3 (minutes):  Integration tests, coverage
       |
       | only if Tier 3 passes
       v
  Tier 4 (hours):    Human review, governance assessment
```

### Principle 2: Deterministic Results

Gates must produce the same result for the same input. Non-deterministic gates (flaky tests, race conditions in CI, network-dependent checks) erode trust in the gate system. When developers learn to ignore gate failures because "it's probably a flake," the gate has lost its enforcement power [5].

### Principle 3: Actionable Failures

When a gate fails, the failure message must tell the developer what to fix. "Build failed" is not actionable. "Build failed: missing import in src/core/trust.ts line 47" is actionable. "Size contract violated: module is 450 lines, maximum is 400. Consider promotion to standalone spec." is actionable with guidance [4].

### Principle 4: Proportionate Response

Gate severity should match the consequence of the violation. A typo in a comment should not block deployment. A SQL injection vulnerability should. The gate response (PASS/WARN/FAIL/BLOCK) must be proportionate to the risk [2].

| Violation | Consequence | Appropriate Response |
|-----------|------------|---------------------|
| Formatting issue | Cosmetic | WARN or auto-fix |
| Missing test | Reduced coverage | WARN (below threshold: FAIL) |
| Dependency vulnerability (low) | Minimal risk | WARN |
| Dependency vulnerability (critical) | Exploitation risk | BLOCK |
| Size contract violation | Cognitive overload | PROMOTE assessment |
| Content marker detected | Class boundary crossed | PROMOTE assessment |

### Principle 5: Escape Hatches

Every gate system needs a documented mechanism for overriding a gate in exceptional circumstances. The override must itself be governed: who can approve an override, what documentation is required, and how the override is tracked [6].

> **Related:** [ACE](../ACE/), [GSD2](../GSD2/), [SYS](../SYS/)

---

## 3. Automated vs. Human Gates

The decision of which gates to automate and which to reserve for human judgment is itself a governance decision [1, 7].

### Automation Candidates

Checks that are deterministic, objective, and fast should be automated:

- Does the artifact compile?
- Do tests pass?
- Is the line count within bounds?
- Are all cross-references valid?
- Does the dependency tree contain known vulnerabilities?
- Is the license compatible?

### Human-Required Checks

Checks that require judgment, context, or subjective assessment must remain human:

- Is the through-line coherent?
- Is the architectural decision sound?
- Does the content match the stated purpose?
- Should this module be promoted or split?
- Is the risk of proceeding acceptable?

### The HITL Gate Pattern in GSD

The GSD ecosystem places human-in-the-loop (HITL) gates at wave boundaries -- the points where one phase of execution completes and the next begins. The CAPCOM role embodies this gate: a human who reviews the output of automated execution and decides whether to proceed [3].

```
HITL GATE PLACEMENT IN WAVE EXECUTION
================================================================

  Wave 0: Foundation
       |
       | automated verification
       v
  HITL GATE: Wave 0 → Wave 1 boundary
       |     CAPCOM reviews: "Is the foundation solid?"
       |
       v
  Wave 1A + 1B: Parallel execution
       |
       | automated verification
       v
  HITL GATE: Wave 1 → Wave 2 boundary
       |     CAPCOM reviews: "Are all tracks complete?"
       |
       v
  Wave 2: Integration
       |
       | automated verification
       v
  HITL GATE: Wave 2 → Wave 3 boundary
       |     CAPCOM reviews: "Is everything consistent?"
       |
       v
  Wave 3: Publication
```

The key insight: HITL gates are expensive (human time) but necessary at high-consequence decision points. Placing them at wave boundaries balances safety with efficiency -- the automated work within each wave proceeds without human intervention, but the transitions between waves require human judgment [3].

> **Related:** [ACE](../ACE/), [GSD2](../GSD2/), [PMG](../PMG/)

---

## 4. The Governance Ledger

The Governance Ledger is the verification matrix for module governance -- a structured document that tracks the compliance status of every module against every governance rule. It is the operational counterpart to GOVERNANCE.md: where GOVERNANCE.md defines the rules, the Governance Ledger records compliance [3].

### Ledger Structure

| Module | Lines | Contract | Markers | Sources | Cross-Refs | Status | Action |
|--------|-------|----------|---------|---------|------------|--------|--------|
| M01 | 485 | 150-400 | TS iface | 21 | All valid | PROMOTE | Assess for promotion |
| M02 | 340 | 150-400 | None | 27 | All valid | PASS | None |
| M03 | 380 | 150-400 | None | 17 | All valid | PASS | None |
| M04 | 420 | 150-400 | ASCII 20L | 15 | All valid | PROMOTE | Assess for promotion |
| M05 | 706 | 150-400 | TS, ASCII, budget | 19 | All valid | PROMOTE | Promote to standalone |

### Ledger Maintenance

The Governance Ledger is regenerated at each audit cycle. It is not manually maintained -- it is computed from the modules and the governance rules. This ensures the ledger is always consistent with the actual state of the modules [3].

```
LEDGER COMPUTATION
================================================================

  Input: All modules + GOVERNANCE.md rules
       |
       | For each module:
       v
  1. Count lines (automated)
  2. Scan for content markers (automated)
  3. Count sources (automated)
  4. Validate cross-references (automated)
  5. Assess through-line (HITL, optional)
       |
       v
  Output: Governance Ledger (compliance matrix)
       |
       | Compare with previous ledger
       v
  Delta Report: What changed since last audit?
```

### Ledger as Decision Support

The Governance Ledger is not a pass/fail report -- it is a decision support artifact. It presents the facts; the governance team decides the response. A module flagged for promotion may receive an exception if the governance team determines that the content marker is a false positive or that the module's unique requirements justify its size [3].

> **Related:** [GSD2](../GSD2/), [COK](../COK/), [PMG](../PMG/)

---

## 5. Ecosystem Health Monitoring

Beyond individual module compliance, governance includes monitoring the health of the ecosystem as a whole. Ecosystem health metrics aggregate module-level data into system-level indicators [8].

### Health Indicators

| Indicator | Measurement | Healthy Range | Warning |
|-----------|------------|---------------|---------|
| Module compliance rate | % modules within contracts | >90% | <80% |
| Average module age | Days since last update | <180 days | >365 days |
| Source currency | % sources within 5 years | >80% | <60% |
| Cross-reference integrity | % valid cross-refs | 100% | <95% |
| Dependency currency | % dependencies within 1 minor version | >70% | <50% |
| Promotion backlog | Modules flagged but not promoted | <3 | >5 |
| Governance document age | Days since last GOVERNANCE.md update | <90 days | >180 days |

### Ecosystem Dashboard

```
ECOSYSTEM HEALTH DASHBOARD (snapshot)
================================================================

  Modules: 138 total | 131 compliant (95%) | 5 flagged | 2 pending
  Sources: 1,847 total | 1,512 current (82%) | 335 aging
  Cross-refs: 892 total | 892 valid (100%) | 0 broken
  Dependencies: 47 direct | 41 current (87%) | 6 drifted
  Governance: Last updated 2026-03-26 | 0 days old

  Overall Health: GOOD
  Action Items: 5 modules flagged for promotion assessment
```

> **Related:** [PMG](../PMG/), [GSD2](../GSD2/), [SYS](../SYS/)

---

## 6. The Open Ecosystem Paradox

Open ecosystems face a fundamental paradox: the openness that makes them valuable is also the openness that makes them vulnerable. Any governance mechanism that restricts openness reduces the ecosystem's value; any absence of governance exposes the ecosystem to quality and security degradation [9].

### The Spectrum of Solutions

Different ecosystems resolve this paradox at different points on the spectrum:

| Approach | Openness | Quality | Examples |
|----------|----------|---------|----------|
| Fully open | Maximum | Lowest | Early npm, PyPI |
| Open with scanning | High | Low-medium | Current npm (malware scan) |
| Open with curation | Medium | Medium | Maven Central, Homebrew |
| Curated with exceptions | Low-medium | High | Debian, Fedora |
| Fully curated | Minimum | Highest | iOS App Store |

### Commons Governance Models

Elinor Ostrom's research on common-pool resource governance identified eight design principles for sustainable commons management [10]:

1. **Clear boundaries:** Who is part of the community? (Registry membership)
2. **Proportional costs and benefits:** Those who benefit contribute. (Maintenance burden)
3. **Collective-choice arrangements:** Users participate in rule-making. (RFC processes)
4. **Monitoring:** Compliance is observable. (Automated scanning)
5. **Graduated sanctions:** Violations escalate proportionally. (WARN → FAIL → BLOCK)
6. **Conflict resolution:** Disputes have resolution mechanisms. (Maintainer appeals)
7. **Recognized rights:** The community's right to self-govern is respected. (Registry independence)
8. **Nested enterprises:** Governance at multiple scales. (Package → org → ecosystem)

These principles, developed for physical commons (fisheries, irrigation systems, forests), map directly to digital commons (package registries, open-source ecosystems, research repositories). The PNW forest metaphor is not coincidental: the same governance principles that keep a forest healthy keep a software ecosystem healthy [10].

> **Related:** [PMG](../PMG/), [ACE](../ACE/), [COK](../COK/)

---

## 7. License Governance

License governance ensures that all dependencies in a project are compatible with the project's own license. In open-source ecosystems, license conflicts can create legal exposure that automated scanning can prevent [11].

### License Compatibility Matrix

| Project License | Compatible With | Incompatible With |
|----------------|-----------------|-------------------|
| MIT | MIT, BSD, Apache 2.0, ISC | GPL (if linking) |
| Apache 2.0 | MIT, BSD, ISC, Apache 2.0 | GPLv2 (patent clause) |
| GPLv3 | GPLv3, LGPLv3, MIT, BSD, Apache 2.0 | Proprietary |
| LGPL | MIT, BSD, Apache 2.0, LGPL | Proprietary (static link) |
| Proprietary | MIT, BSD, ISC, Apache 2.0 | GPL, LGPL (static link) |

### Automated License Scanning

Tools like FOSSA, Licensee, and license-checker scan the dependency tree and flag incompatible licenses before they reach production [12]:

```
LICENSE GOVERNANCE PIPELINE
================================================================

  package-lock.json / Cargo.lock
       |
       | scan all dependencies
       v
  License Scanner (FOSSA / Licensee / license-checker)
       |
       +-- Compatible license → PASS
       |
       +-- Unknown license → WARN (manual review)
       |
       +-- Incompatible license → BLOCK
       |
       +-- No license → BLOCK (legal risk)
```

### License in Research Contexts

Research modules cite sources that may have their own licensing terms. Data sources, images, and code samples embedded in research documents carry copyright that must be respected. The GSD Research Series publishes under the gsd-skill-creator repository license, but cited sources retain their original licenses and are referenced, not reproduced [3].

> **Related:** [CDL](../CDL/), [SYS](../SYS/), [ACE](../ACE/)

---

## 8. Security Governance in Dependency Chains

Security governance in dependency chains addresses the risk that a vulnerability in any dependency -- direct or transitive -- can be exploited through the dependent project [13, 14].

### Vulnerability Lifecycle

```
VULNERABILITY LIFECYCLE
================================================================

  Discovery → Disclosure → Patch → Adoption → Full Mitigation
      |           |          |         |            |
      | 0 days    | 1-90 days| days    | weeks-months| months
      |           |          |         |            |
      v           v          v         v            v
  CVE assigned  Advisory   Fix       Consumers    All consumers
                published  released  start        updated
                                    updating
```

The gap between "Fix released" and "All consumers updated" is where dependency drift becomes a security liability. The version sentinel's role is to compress this gap by detecting when a fix is available and reporting the drift [3].

### CVSS and Severity-Based Response

The Common Vulnerability Scoring System (CVSS) provides a standardized severity rating (0-10) that maps to governance responses [15]:

| CVSS Score | Severity | Governance Response | Timeline |
|------------|----------|--------------------|-----------|
| 0.0 | None | No action | N/A |
| 0.1-3.9 | Low | LOG | Next scheduled update |
| 4.0-6.9 | Medium | ADVISORY | Within 30 days |
| 7.0-8.9 | High | BLOCK | Within 7 days |
| 9.0-10.0 | Critical | BLOCK + EMERGENCY | Immediate |

### Supply Chain Levels for Software Artifacts (SLSA)

SLSA (pronounced "salsa") is a framework for ensuring the integrity of software artifacts throughout the supply chain. It defines four levels of increasing assurance [16]:

| Level | Requirements | Assurance |
|-------|-------------|-----------|
| SLSA 1 | Build process documented | Basic provenance |
| SLSA 2 | Build service used, signed provenance | Tamper resistance |
| SLSA 3 | Hardened build service, full provenance | Tampering detection |
| SLSA 4 | Two-person review, hermetic build | Maximum assurance |

> **Related:** [SYS](../SYS/), [K8S](../K8S/), [ACE](../ACE/)

---

## 9. Governance Patterns from Real Ecosystems

### Kubernetes SIG Governance

Kubernetes organizes governance through Special Interest Groups (SIGs), each responsible for a specific domain. Changes to Kubernetes require a Kubernetes Enhancement Proposal (KEP) reviewed by the relevant SIG. This distributes governance across domain experts while maintaining a consistent process [17].

### Rust Edition Governance

Rust's edition system (Rust 2015, 2018, 2021, 2024) provides a governance mechanism for language-level breaking changes: new editions introduce new syntax and semantics, but old editions continue to compile. This is version governance at the language level: consumers choose when to adopt new contracts [18].

### The Apache Way

The Apache Software Foundation's governance model emphasizes "community over code": decisions are made by consensus among active contributors, with a formal voting process for contentious decisions. Committers earn their role through consistent contribution, and project management committees (PMCs) provide oversight [19].

### Debian Social Contract

Debian's governance begins with a social contract: the Debian Free Software Guidelines (DFSG) define what software can enter the ecosystem. Every package must comply with the DFSG, and a volunteer maintainer is responsible for each package's quality and currency. This human-in-the-loop curation model produces one of the most stable and secure package ecosystems in existence [20].

> **Related:** [K8S](../K8S/), [PMG](../PMG/), [ACE](../ACE/)

---

## 10. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Quality gate design | M5, M3, M4 | K8S, SYS, CDL |
| Automated vs. HITL gates | M5, M3 | ACE, GSD2, SYS |
| Governance ledger | M5, M3, M4 | GSD2, COK, PMG |
| Ecosystem health | M5, M2, M3 | PMG, GSD2, SYS |
| Open ecosystem paradox | M5, M3 | PMG, ACE, COK |
| License governance | M5, M2 | CDL, SYS, ACE |
| Security governance | M5, M2, M3 | SYS, K8S, ACE |
| SLSA framework | M5, M2 | SYS, K8S, CDL |
| Kubernetes governance | M5, M3 | K8S, GSD2, PMG |
| Commons governance | M5, M3 | PMG, ACE, COK |

---

## 11. Sources

1. Kim, G., et al. (2016). *The DevOps Handbook: How to Create World-Class Agility, Reliability, and Security in Technology Organizations*. IT Revolution Press. Quality gate design principles.
2. Humble, J., & Farley, D. (2010). *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*. Addison-Wesley. Gate placement and pipeline design.
3. GSD Ecosystem (2026). *Module Governance & Upstream Intelligence Mission Pack*. Internal mission documentation.
4. Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps*. IT Revolution Press. Empirical evidence for fast feedback in CI/CD.
5. Luo, Q., et al. (2014). "An Empirical Analysis of Flaky Tests." *FSE*. Study of non-deterministic test failures.
6. Fowler, M. (2006). "Continuous Integration." martinfowler.com. CI principles including gate bypass mechanisms.
7. Gousios, G., et al. (2014). "An Exploratory Study of the Pull-Based Software Development Model." *ICSE*. Human review gates in pull-request workflows.
8. Mens, T., et al. (2014). "ECOS: Ecological Studies of Open-Source Software Ecosystems." *IEEE SEW*. Ecosystem health metrics framework.
9. Eghbal, N. (2020). *Working in Public: The Making and Maintenance of Open Source Software*. Stripe Press. The paradox of openness in software ecosystems.
10. Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge University Press. Eight design principles for commons governance.
11. Vendome, C., et al. (2017). "License Usage and Changes: A Large-Scale Study of Java Projects on GitHub." *IEEE SANER*. Empirical study of license governance.
12. FOSSA (2024). "Open Source License Compliance." fossa.com. Automated license scanning.
13. Ohm, M., et al. (2020). "Backstabber's Knife Collection: A Review of Open Source Software Supply Chain Attacks." *DIMVA*. Supply chain security taxonomy.
14. Ladisa, P., et al. (2023). "SoK: Taxonomy of Attacks on Open-Source Software Supply Chains." *IEEE S&P*. Comprehensive attack taxonomy.
15. FIRST (2019). *Common Vulnerability Scoring System v3.1 Specification*. first.org. Vulnerability severity scoring standard.
16. SLSA (2024). "Supply-chain Levels for Software Artifacts." slsa.dev. Build integrity framework.
17. Kubernetes (2024). "Kubernetes Enhancement Proposals (KEPs)." github.com/kubernetes/enhancements. KEP governance process.
18. The Rust Team (2024). "What are Editions?" doc.rust-lang.org/edition-guide. Rust edition governance model.
19. Apache Software Foundation (2024). "How the ASF Works." apache.org. The Apache Way governance model.
20. Debian Project (2024). "Debian Social Contract." debian.org. DFSG and package governance.
