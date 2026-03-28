# Upstream Dependency Tracking

> **Domain:** Software Supply Chain & Ecosystem Intelligence
> **Module:** 2 -- Dependency Graphs, Transitive Risk, and Supply Chain Visibility
> **Through-line:** *You don't own your dependencies. You rent them. And the landlord can change the locks at any time.* Every module in a modular system stands on a foundation it didn't build. Upstream dependency tracking is the practice of understanding that foundation -- not just what you directly depend on, but what those dependencies depend on, all the way down to the bedrock. The chain is only as strong as the link you forgot to inspect.

---

## Table of Contents

1. [The Dependency Graph as Infrastructure](#1-the-dependency-graph-as-infrastructure)
2. [Direct vs. Transitive Dependencies](#2-direct-vs-transitive-dependencies)
3. [Supply Chain Attacks and Trust Boundaries](#3-supply-chain-attacks-and-trust-boundaries)
4. [Software Bill of Materials (SBOM)](#4-software-bill-of-materials-sbom)
5. [Dependency Health Metrics](#5-dependency-health-metrics)
6. [Upstream Monitoring in Practice](#6-upstream-monitoring-in-practice)
7. [The npm Ecosystem: A Case Study](#7-the-npm-ecosystem-a-case-study)
8. [Cargo and Rust: Fearless Dependencies](#8-cargo-and-rust-fearless-dependencies)
9. [Research Dependencies and Citation Graphs](#9-research-dependencies-and-citation-graphs)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Dependency Graph as Infrastructure

A dependency graph is a directed acyclic graph (DAG) where nodes are modules and edges are "depends on" relationships. In any non-trivial project, the transitive closure of this graph -- the set of all modules reachable by following dependency edges -- is far larger than the set of direct dependencies [1].

The typical JavaScript project with 10 direct dependencies has 100-300 transitive dependencies. A Rust project with 20 direct crate dependencies may pull in 200+ transitive crates. The gsd-skill-creator project with its Tauri v2 + Vite v6 + Vitest stack carries a dependency tree measured in hundreds of packages [2, 3].

```
DEPENDENCY GRAPH -- DIRECT vs. TRANSITIVE
================================================================

  Your Project
       |
       +-- Direct: @tauri-apps/api@2.10.0
       |        |
       |        +-- Transitive: @tauri-apps/core@2.10.0
       |                 |
       |                 +-- Deep: ...
       |
       +-- Direct: vite@6.x
       |        |
       |        +-- Transitive: esbuild@0.24.x
       |        +-- Transitive: rollup@4.x
       |        |        |
       |        |        +-- Deep: @rollup/pluginutils
       |        |        +-- Deep: ...
       |        +-- Transitive: postcss@8.x
       |
       +-- Direct: vitest@x.x
                |
                +-- Transitive: tinybench, tinypool, ...
                +-- Transitive: vite (shared with above)

  You declared 3 dependencies.
  You actually depend on 150+.
```

This graph is infrastructure in the same sense that electrical wiring is infrastructure: invisible when it works, catastrophic when it fails. Understanding the graph is the first step toward governing it [1].

> **Related:** [K8S](../K8S/), [SYS](../SYS/), [GSD2](../GSD2/)

---

## 2. Direct vs. Transitive Dependencies

The distinction between direct and transitive dependencies is foundational to dependency governance:

**Direct dependencies** are explicitly declared in the project manifest (`package.json`, `Cargo.toml`, `pyproject.toml`). The project author chose these, evaluated them, and is responsible for keeping them current.

**Transitive dependencies** are pulled in automatically by the package manager to satisfy the requirements of direct dependencies. The project author may not even know they exist. They are not chosen -- they are inherited [4].

### The Transitive Risk Multiplier

Every transitive dependency is a trust decision that someone else made on your behalf. When you add `vite@6.x` to your project, you are implicitly trusting every maintainer of every transitive dependency in Vite's tree. A vulnerability in any transitive dependency is a vulnerability in your project [5].

| Depth | Visibility | Control | Risk Awareness |
|-------|-----------|---------|----------------|
| Direct (depth 0) | High -- you declared it | Full -- you pin it | High -- you chose it |
| Transitive (depth 1) | Medium -- in lockfile | Indirect -- via direct dep | Medium -- review lockfile |
| Deep transitive (depth 2+) | Low -- buried in tree | Minimal -- cascade only | Low -- rarely inspected |

### Dependency Pruning

The most effective way to reduce transitive risk is to reduce direct dependencies. Every direct dependency removed eliminates an entire subtree of transitive risk. This is why the Unix philosophy of small, composable tools remains relevant: smaller dependency surfaces mean smaller blast radii [6].

```
DEPENDENCY PRUNING EFFECT
================================================================

  Before: 15 direct deps --> ~450 transitive deps
  After:   8 direct deps --> ~180 transitive deps
  Removed: 7 direct deps --> ~270 transitive deps eliminated

  Each direct dependency carries an average of
  ~35-40 transitive dependencies in the npm ecosystem.
  Removing one direct dep removes its entire subtree.
```

> **Related:** [PMG](../PMG/), [ACE](../ACE/), [MCF](../MCF/)

---

## 3. Supply Chain Attacks and Trust Boundaries

Software supply chain attacks exploit the trust relationships embedded in dependency graphs. When a project depends on module X, it trusts X's maintainer. When X depends on Y, the project transitively trusts Y's maintainer -- often without knowing it [7].

### Attack Vectors

| Vector | Mechanism | Notable Example | Mitigation |
|--------|-----------|-----------------|------------|
| Account compromise | Attacker gains publish access to a legitimate package | ua-parser-js (2021) | 2FA, publish provenance |
| Typosquatting | Package named similarly to popular package | crossenv vs cross-env | Registry policies, audit |
| Dependency confusion | Private package name collision with public registry | Alex Birsan (2021) | Scoped packages, registry config |
| Maintainer burnout | Abandoned package transferred to malicious actor | event-stream (2018) | Community health monitoring |
| Build system injection | Malicious code in build scripts, not source | SolarWinds (2020) | Reproducible builds, SBOM |

### The event-stream Incident

In November 2018, the `event-stream` npm package (used by millions of projects) was compromised after its original maintainer, burned out on unpaid maintenance, transferred ownership to a new contributor who injected malicious code targeting cryptocurrency wallets. The attack was discovered only because another developer noticed unusual behavior during a code audit [8].

This incident crystallized a fundamental truth about open-source dependency management: the trust model is based on human relationships, not technical guarantees. The maintainer didn't make a technical mistake -- they made a human decision under pressure. Supply chain security starts with understanding that every dependency is a relationship with a person, not just a reference to code [8].

### Trust Boundaries in the GSD Ecosystem

The GSD ecosystem's approach to trust boundaries mirrors its treatment of human trust relationships: earned, not assumed. The version sentinel operates with zero authentication tokens precisely because it needs only read access to public information. No write access means no attack surface for credential theft. No authentication means no stored credentials to compromise [9].

> **SAFETY WARNING:** Supply chain attacks can propagate through transitive dependencies without any visible change to direct dependencies. Regular auditing of the full dependency tree -- not just direct dependencies -- is essential for security hygiene.

> **Related:** [SYS](../SYS/), [ACE](../ACE/), [K8S](../K8S/)

---

## 4. Software Bill of Materials (SBOM)

A Software Bill of Materials is a formal, machine-readable inventory of all components in a software artifact: direct dependencies, transitive dependencies, their versions, licenses, and provenance. SBOMs emerged from the same principles as hardware BOMs in manufacturing -- you cannot audit what you cannot enumerate [10].

### SBOM Standards

Two competing standards dominate the SBOM landscape:

**SPDX (Software Package Data Exchange):** Developed by the Linux Foundation, adopted as ISO/IEC 5962:2021. Focuses on license compliance and copyright attribution. Uses a tag-value or RDF serialization [11].

**CycloneDX:** Developed by OWASP, focused on security and vulnerability tracking. Uses XML or JSON serialization. Includes vulnerability disclosure (VEX) and dependency graph representation [12].

### SBOM Generation

| Tool | Ecosystem | Format | Approach |
|------|-----------|--------|----------|
| syft (Anchore) | Multi | SPDX, CycloneDX | Binary/filesystem analysis |
| cdxgen | Multi | CycloneDX | Manifest parsing + build analysis |
| cargo-sbom | Rust | SPDX | Cargo.lock analysis |
| npm sbom | Node.js | SPDX, CycloneDX | package-lock.json analysis |
| trivy | Multi | SPDX, CycloneDX | Container + filesystem scanning |

### SBOM in Governance Context

An SBOM transforms dependency governance from a manual audit task into an automated compliance check. With a machine-readable inventory, policies can be enforced programmatically: no dependencies with known vulnerabilities above CVSS 7.0, no dependencies with incompatible licenses, no dependencies abandoned for more than 2 years [10].

The U.S. Executive Order 14028 (2021) mandated SBOM provision for software sold to federal agencies, elevating SBOMs from best practice to regulatory requirement in certain contexts [13].

```
SBOM IN THE GOVERNANCE PIPELINE
================================================================

  Build System
       |
       | generates SBOM during build
       v
  SBOM Document (CycloneDX/SPDX)
       |
       +-- Vulnerability Scanner (CVE database)
       |        |
       |        +-- Known vulnerabilities flagged
       |
       +-- License Auditor (SPDX license list)
       |        |
       |        +-- Incompatible licenses flagged
       |
       +-- Currency Monitor (version sentinel)
       |        |
       |        +-- Drift events reported
       |
       +-- Policy Engine (governance rules)
                |
                +-- PASS / FAIL / ADVISORY
```

> **Related:** [SYS](../SYS/), [K8S](../K8S/), [CDL](../CDL/)

---

## 5. Dependency Health Metrics

Beyond version numbers, dependency health is a multi-dimensional assessment of whether a dependency remains a safe, productive choice. Several frameworks propose metrics for this assessment [14, 15].

### OpenSSF Scorecard

The Open Source Security Foundation (OpenSSF) Scorecard project evaluates open-source projects across multiple dimensions [14]:

| Check | What It Measures | Weight |
|-------|-----------------|--------|
| Maintained | Recent commits, issue response time | High |
| Vulnerabilities | Known unpatched CVEs | Critical |
| Code-Review | PR review requirements | High |
| Branch-Protection | Protected main branch | Medium |
| Signed-Releases | Cryptographic signatures on releases | Medium |
| CI-Tests | Automated testing in CI | Medium |
| Fuzzing | Fuzz testing integration | Low-Medium |
| SAST | Static analysis tool usage | Medium |
| Token-Permissions | Minimal CI token permissions | Medium |
| Pinned-Dependencies | Build dependencies pinned | Medium |

### Libraries.io SourceRank

Libraries.io computes a SourceRank score (0-30) based on community engagement, maintenance activity, and ecosystem integration [15]:

- Dependent projects count (how many projects use this?)
- Contributor count (bus factor assessment)
- Release frequency (active maintenance signal)
- Latest release age (staleness indicator)
- Documentation presence
- License presence and compatibility

### Custom Health Metrics for GSD

The GSD ecosystem extends these frameworks with metrics specific to research module governance:

| Metric | Description | Threshold |
|--------|-------------|-----------|
| Source currency | Are cited sources still current? | >80% within 5 years |
| Cross-ref integrity | Do all cross-references resolve? | 100% |
| Line count compliance | Within size contract bounds? | Must pass |
| Content marker scan | Spec-level markers present in survey? | Zero markers = pass |
| Citation density | Sources per 100 lines | Minimum 3 |

> **Related:** [PMG](../PMG/), [ACE](../ACE/), [GSD2](../GSD2/)

---

## 6. Upstream Monitoring in Practice

Upstream monitoring is the operational practice of watching the release feeds of dependencies and responding to changes. This section examines real-world monitoring architectures and their trade-offs [16].

### GitHub Dependabot

GitHub's built-in dependency monitoring tool creates pull requests when new versions of dependencies are available. Configuration via `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "maintainer-team"
```

Dependabot's architecture: daily polling of registry APIs, comparison against lockfile versions, automated PR creation with changelog excerpts. The tool handles the detection; the human handles the decision [16].

### Renovate Bot

Renovate provides more granular control over update strategy through a JSON configuration that supports grouping, scheduling, auto-merge rules, and custom versioning schemes. Unlike Dependabot, Renovate can manage monorepo dependencies and cross-project updates [17].

### The GSD Sentinel Model

The GSD version sentinel differs from Dependabot and Renovate in one key respect: it does not act. It reports. This is a deliberate architectural choice rooted in the principle that automated systems should surface information, not make decisions. In a research ecosystem where version drift may require re-evaluation of conclusions (not just code changes), the decision to update belongs to a human [9].

```
MONITORING ARCHITECTURES COMPARED
================================================================

  Dependabot / Renovate              GSD Version Sentinel
  +-----------------------+         +-----------------------+
  | Detect drift          |         | Detect drift          |
  | Classify severity     |         | Classify severity     |
  | Create PR             |  vs.    | Report to orchestrator|
  | Suggest merge         |         | (human decides)       |
  +-----------------------+         +-----------------------+
       |                                  |
       v                                  v
  Automated action                  Human judgment
  (may auto-merge patches)         (always human-gated)
```

> **Related:** [SYS](../SYS/), [K8S](../K8S/), [GSD2](../GSD2/)

---

## 7. The npm Ecosystem: A Case Study

The npm registry is the largest software package ecosystem in the world, with over 2.5 million packages and 15+ billion downloads per week as of 2024. Its scale makes it a natural laboratory for studying dependency governance challenges [18].

### Dependency Depth

A 2019 study by Zimmermann et al. found that the average npm package has a transitive dependency tree of 79 packages, with some popular packages pulling in over 1,000 transitive dependencies. The median depth of the dependency tree is 4 levels, meaning that most projects depend on packages that depend on packages that depend on packages that depend on packages [19].

### Maintenance Patterns

Research by Kula et al. (2018) found that 81.5% of studied projects had at least one outdated dependency, and the median time to update a dependency after a new version is released was 3.5 months. This is not negligence -- it is a rational response to the cost of testing and validating updates against the perceived risk of remaining on the current version [20].

### Left-pad and the Single Point of Failure

In March 2016, the unpublishing of the `left-pad` package (11 lines of code) broke thousands of builds across the npm ecosystem. The incident revealed a structural vulnerability: widely-used micro-packages create single points of failure that cascade through transitive dependencies [21].

| Event | Date | Impact | Root Cause |
|-------|------|--------|------------|
| left-pad unpublish | 2016-03 | Thousands of broken builds | Micro-dependency, no mirror |
| event-stream compromise | 2018-11 | Cryptocurrency theft | Maintainer transfer to attacker |
| ua-parser-js compromise | 2021-10 | Cryptominer injection | Account credential theft |
| colors/faker sabotage | 2022-01 | Infinite loop in dependents | Maintainer protest |
| node-ipc sabotage | 2022-03 | File deletion on Russian IPs | Political sabotage |

> **Related:** [SYS](../SYS/), [ACE](../ACE/), [PMG](../PMG/)

---

## 8. Cargo and Rust: Fearless Dependencies

Rust's Cargo package manager and crates.io registry were designed with dependency governance lessons learned from npm and other ecosystems. Key differentiators [22]:

### Yanking vs. Unpublishing

Unlike npm (which allows unpublishing within 72 hours), crates.io uses "yanking": a yanked version is hidden from new resolution but remains available to projects that already depend on it. This prevents left-pad-style cascading failures while still allowing maintainers to mark versions as unsuitable [22].

### Minimal Version Selection (Proposed)

The Go ecosystem's Minimal Version Selection (MVS) algorithm, proposed by Russ Cox, selects the oldest version of each dependency that satisfies all constraints. This is the opposite of most resolvers (which pick the newest) and provides maximum reproducibility at the cost of currency [23].

### cargo-audit

The `cargo-audit` tool checks a project's `Cargo.lock` against the RustSec Advisory Database, a curated database of security vulnerabilities in Rust crates. This provides supply chain visibility without requiring an SBOM generation step [24].

```
CARGO DEPENDENCY GOVERNANCE TOOLS
================================================================

  Cargo.toml (manifest)
       |
       | cargo resolve
       v
  Cargo.lock (lockfile)
       |
       +-- cargo audit     --> RustSec advisory check
       |
       +-- cargo outdated  --> Version currency report
       |
       +-- cargo tree      --> Dependency graph visualization
       |
       +-- cargo deny      --> License + advisory + duplicate check
```

> **Related:** [CDL](../CDL/), [K8S](../K8S/), [SYS](../SYS/)

---

## 9. Research Dependencies and Citation Graphs

Research modules depend not only on code packages but on cited sources: papers, standards, datasets, and prior research modules. These dependencies form a citation graph that is subject to the same drift, staleness, and trust concerns as code dependency graphs [25].

### Citation Graph Properties

| Property | Code Dependencies | Research Citations |
|----------|------------------|--------------------|
| Directed | Yes (A depends on B) | Yes (A cites B) |
| Acyclic | Required (DAG) | Usually (but cycles exist in co-citation) |
| Versioned | Always (semver) | Sometimes (DOI versions) |
| Machine-readable | Always (manifest) | Sometimes (BibTeX, CrossRef) |
| Drift-monitored | Increasingly (Dependabot) | Rarely |
| Retraction-monitored | N/A | Rarely (Retraction Watch) |

### The Retraction Problem

When a cited paper is retracted, the research module that depends on it faces a major version drift event in the citation graph. Unlike code dependencies, there is no automated tool equivalent to Dependabot for monitoring paper retractions. The Retraction Watch database is the closest equivalent, but integration into automated research governance pipelines is still nascent [26].

### DOI Versioning

The Digital Object Identifier (DOI) system provides persistent, version-trackable identifiers for research artifacts. A DOI resolves to a specific version of a document, enabling citation integrity checks: does the DOI still resolve? Does the resolved content match expectations? [27]

> **Related:** [PMG](../PMG/), [GSD2](../GSD2/), [MCF](../MCF/)

---

## 10. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Dependency graphs | M2, M3, M4 | K8S, SYS, GSD2 |
| Transitive dependencies | M2, M1, M3 | K8S, SYS, CDL |
| Supply chain attacks | M2, M3 | SYS, ACE, K8S |
| SBOM standards | M2, M4 | SYS, CDL, K8S |
| npm ecosystem | M2, M1 | SYS, PMG, ACE |
| Cargo/Rust governance | M2, M1 | CDL, K8S, SYS |
| Dependency health metrics | M2, M5 | PMG, ACE, GSD2 |
| Citation graphs | M2, M5 | PMG, GSD2, MCF |
| Upstream monitoring | M2, M1, M5 | SYS, K8S, GSD2 |

---

## 11. Sources

1. Decan, A., Mens, T., & Grosjean, P. (2019). "An Empirical Comparison of Dependency Network Evolution in Seven Software Packaging Ecosystems." *Empirical Software Engineering*, 24(1), 381-416. Cross-ecosystem dependency graph analysis.
2. npm Documentation (2024). "package-lock.json." docs.npmjs.com. Lockfile structure and transitive dependency resolution.
3. Rust Documentation (2024). "The Cargo Book -- Dependency Resolution." doc.rust-lang.org/cargo. Cargo's dependency resolution algorithm.
4. Cox, R. (2019). "Surviving Software Dependencies." *Communications of the ACM*, 62(9), 36-43. Foundational treatment of dependency management.
5. Ohm, M., et al. (2020). "Backstabber's Knife Collection: A Review of Open Source Software Supply Chain Attacks." *Detection of Intrusions and Malware, and Vulnerability Assessment (DIMVA)*. Taxonomy of supply chain attack vectors.
6. McIlroy, M. D., et al. (1978). "Unix Time-Sharing System: Foreword." *The Bell System Technical Journal*, 57(6), 1899-1904. Original articulation of the Unix philosophy.
7. Ladisa, P., et al. (2023). "SoK: Taxonomy of Attacks on Open-Source Software Supply Chains." *IEEE S&P*. Comprehensive taxonomy of supply chain attacks.
8. Garrett, C. (2018). "I don't know what to say." GitHub issue, event-stream repository. Primary source for the event-stream incident.
9. GSD Ecosystem (2026). *Module Governance & Upstream Intelligence Mission Pack*. Internal mission documentation.
10. NTIA (2021). "The Minimum Elements For a Software Bill of Materials." National Telecommunications and Information Administration. U.S. government SBOM requirements.
11. Linux Foundation (2021). "SPDX Specification v2.3." spdx.dev. ISO/IEC 5962:2021 standard for software package data exchange.
12. OWASP (2024). "CycloneDX Specification v1.6." cyclonedx.org. Security-focused SBOM standard.
13. Executive Order 14028 (2021). "Improving the Nation's Cybersecurity." Federal Register. U.S. executive order mandating SBOM for federal software.
14. OpenSSF (2024). "Scorecard." securityscorecards.dev. Automated security assessment for open-source projects.
15. Libraries.io (2024). "SourceRank." libraries.io. Open-source project health scoring methodology.
16. GitHub Documentation (2024). "About Dependabot version updates." docs.github.com. Dependabot architecture and configuration.
17. Renovate Documentation (2024). "Key Concepts." docs.renovatebot.com. Renovate bot architecture and update strategy.
18. npm (2024). "npm Registry Statistics." npmjs.com. Registry scale and download statistics.
19. Zimmermann, M., et al. (2019). "Small World with High Risks: A Study of Security Threats in the npm Ecosystem." *USENIX Security Symposium*. Empirical study of npm dependency depth and risk.
20. Kula, R. G., et al. (2018). "Do Developers Update Their Library Dependencies?" *Empirical Software Engineering*, 23(1), 384-417. Study of dependency update practices.
21. Williams, C. (2016). "How one developer just broke Node, Babel and thousands of projects in 11 lines of JavaScript." *The Register*. Reporting on the left-pad incident.
22. The Rust Team (2024). "Cargo Reference -- Publishing on crates.io." doc.rust-lang.org/cargo. Yanking mechanics and registry policies.
23. Cox, R. (2018). "Minimal Version Selection." research.swtch.com. Proposal for deterministic dependency resolution.
24. RustSec (2024). "cargo-audit." rustsec.org. Vulnerability auditing for Rust dependencies.
25. Sugimoto, C. R., & Lariviere, V. (2018). *Measuring Research: What Everyone Needs to Know*. Oxford University Press. Citation metrics and their applications.
26. Retraction Watch (2024). "Retraction Watch Database." retractionwatch.com. Database of retracted scientific publications.
27. International DOI Foundation (2024). "DOI Handbook." doi.org. Persistent identifier system for research artifacts.
