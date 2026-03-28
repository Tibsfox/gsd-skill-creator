# Module Versioning Foundations

> **Domain:** Software Governance & Configuration Management
> **Module:** 1 -- Semantic Versioning, Module Identity, and Version Currency
> **Through-line:** *A version number is a promise. Breaking a promise silently is worse than breaking it loudly, because the damage compounds before anyone notices.* Every module in a modular system carries implicit contracts with its consumers. Semantic versioning makes those contracts explicit. The question is never whether versions drift -- they always drift. The question is whether you know about it before it matters.

---

## Table of Contents

1. [The Version Contract Problem](#1-the-version-contract-problem)
2. [Semantic Versioning as a Communication Protocol](#2-semantic-versioning-as-a-communication-protocol)
3. [Module Identity and Namespacing](#3-module-identity-and-namespacing)
4. [Version Pinning Strategies](#4-version-pinning-strategies)
5. [Drift Detection and Currency Monitoring](#5-drift-detection-and-currency-monitoring)
6. [The Frozen Snapshot Problem](#6-the-frozen-snapshot-problem)
7. [Version Resolution in Dependency Trees](#7-version-resolution-in-dependency-trees)
8. [Research Module Versioning in Practice](#8-research-module-versioning-in-practice)
9. [Automated Version Sentinels](#9-automated-version-sentinels)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Version Contract Problem

Every software module exists in a web of dependencies. When module A imports module B at version 1.28.0, that version number encodes a specific set of assumptions: the API surface is stable, the behavior is predictable, the integration contracts hold. The moment B releases 1.29.0, those assumptions may still hold -- or they may not. The version number alone tells you the category of change, not the consequence [1].

The problem is compounded in research ecosystems where modules are not just code libraries but knowledge artifacts. A research module at version v1.49.22 references specific data sources, cites specific studies, and builds arguments on specific foundations. When those foundations shift -- a dataset is updated, a study is retracted, a standard is revised -- the research module's version number remains frozen at compilation time.

```
THE VERSION CONTRACT -- INFORMATION FLOW
================================================================

  Producer (module author)
       |
       | publishes version X.Y.Z
       |
       v
  Registry (npm, crates.io, research catalog)
       |
       | consumer pins ^X.Y.Z or =X.Y.Z
       |
       v
  Consumer (dependent module)
       |
       | assumes contract holds at X.Y.Z
       |
       v
  Integration Point
       |
       | contract either holds or breaks
       |
       v
  Runtime Behavior
       |
       +-- [holds] --> silent success
       +-- [breaks] --> failure at integration time
```

The fundamental tension: producers need freedom to evolve, consumers need stability to build upon. Semantic versioning is the protocol that mediates this tension by classifying changes into categories that carry different expectations [2].

> **Related:** [PMG](../PMG/), [GSD2](../GSD2/), [K8S](../K8S/)

---

## 2. Semantic Versioning as a Communication Protocol

Semantic Versioning 2.0.0 (semver) defines a version number as `MAJOR.MINOR.PATCH` where each segment carries contractual meaning [1]:

- **MAJOR** -- Incompatible API changes. Consumers must adapt or break.
- **MINOR** -- Backward-compatible additions. Consumers can safely upgrade.
- **PATCH** -- Backward-compatible bug fixes. Consumers should upgrade.

This three-tier classification is a communication protocol, not merely a numbering scheme. When a producer bumps the major version, they are signaling: "the contract has changed." When they bump the minor version: "the contract has expanded." When they bump the patch version: "the contract is unchanged, but the implementation is more correct."

### Pre-release and Build Metadata

Semver supports pre-release identifiers (`1.0.0-alpha.1`) and build metadata (`1.0.0+20260327`). Pre-release versions have lower precedence than the associated normal version, establishing a clear ordering for release candidates. Build metadata is ignored in version precedence -- two versions differing only in build metadata are considered equal [1].

### The Precedence Algorithm

Version precedence is determined by comparing major, minor, and patch numerically, left to right. When those are equal, pre-release versions have lower precedence than normal versions, and pre-release identifiers are compared as a dot-separated sequence of fields [1]:

```
Precedence: 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0
             |              |                |             |
             pre-release    pre-release      pre-release   release
             (alpha)        (alpha.1)        (beta)        (normal)
```

### Semver in Non-Code Domains

The semver model extends naturally to research modules and documentation artifacts. A research module update that changes the conclusions (different data interpretation, retracted source) is a major version change. An update that adds new evidence without altering existing conclusions is minor. A correction to a citation format or typo is a patch [3].

This mapping is not universally accepted -- the Research Data Alliance and FORCE11 working groups have proposed alternative versioning schemes for research artifacts -- but the principle of classifying changes by their impact on consumers remains consistent across domains [4, 5].

> **Related:** [CDL](../CDL/), [ACE](../ACE/), [SYS](../SYS/)

---

## 3. Module Identity and Namespacing

Before a module can be versioned, it must be uniquely identifiable. Module identity in modern package ecosystems relies on a combination of namespace, name, and version -- the triple that uniquely locates any artifact in any registry [6].

### Namespace Patterns Across Ecosystems

| Ecosystem | Identity Pattern | Example | Registry |
|-----------|-----------------|---------|----------|
| npm | `@scope/name@version` | `@tauri-apps/api@2.10.0` | npmjs.com |
| Cargo | `name:version` | `serde:1.0.210` | crates.io |
| PyPI | `name==version` | `numpy==1.26.4` | pypi.org |
| Maven | `group:artifact:version` | `org.apache:commons-lang3:3.14.0` | central.sonatype.com |
| Go | `module@version` | `golang.org/x/net@v0.24.0` | proxy.golang.org |
| GSD Research | `CODE/version` | `MGU/v1.49.x` | www/tibsfox/com/Research/ |

### Module Boundaries and the Identity Problem

A module's identity is tied to its boundary -- what it contains, what it excludes, and where its responsibility ends. When Module 05 in the Deep Audio Analyzer mission pack grew to 706 lines with TypeScript interfaces, ASCII diagrams, and token budget analysis, the identity problem surfaced: was it still a research module (survey orientation) or had it become a specification (construction document)? The version number couldn't answer this question because the module's identity had shifted while its container remained unchanged [7].

This is the module identity problem in its purest form: a version number tracks changes to content, but it cannot track changes to category. When a module crosses the boundary from survey to specification, the correct response is not a version bump but a promotion -- changing the container, not the content.

```
MODULE IDENTITY AND PROMOTION
================================================================

  Research Module (survey)          Standalone Spec (construction)
  +--------------------------+     +--------------------------+
  | 150-400 lines            |     | 200+ lines (no upper)   |
  | Evidence + orientation   | --> | Interfaces + contracts   |
  | Consumer: any agent      |     | Consumer: implementing   |
  | Contract: "here is what  |     | Contract: "here is what  |
  |   exists"                |     |   to build"              |
  +--------------------------+     +--------------------------+
         |                                |
         | version X.Y.Z                  | version X.Y.Z
         | (tracks content)               | (tracks content)
         |                                |
  PROMOTION = container change, NOT version change
```

> **Related:** [GSD2](../GSD2/), [MCF](../MCF/), [COK](../COK/)

---

## 4. Version Pinning Strategies

Version pinning is the practice of locking a dependency to a specific version or version range. The strategy chosen determines the balance between stability (no surprises) and currency (latest fixes and features) [8].

### Pinning Modes

| Mode | Syntax (npm) | Allows | Risk |
|------|-------------|--------|------|
| Exact | `1.28.0` | Nothing | Maximum staleness |
| Patch | `~1.28.0` | `1.28.x` | Low -- bug fixes only |
| Minor | `^1.28.0` | `1.x.x` | Medium -- new features |
| Any | `*` | Everything | Maximum breakage |

### The Lockfile Pattern

Modern package managers generate lockfiles (`package-lock.json`, `Cargo.lock`, `poetry.lock`) that record the exact resolved versions of every dependency in the tree. The lockfile is the ground truth -- it captures the full transitive closure of dependencies at a specific point in time [9].

In research ecosystems, the equivalent of a lockfile is the mission pack manifest: a document that records the exact versions of all referenced packages, data sources, and standards at compilation time. The three pinned versions in the MGU mission context (v0.62.0, v1.28.0, v2.43.0) are manifest entries frozen at the moment the mission pack was compiled [7].

### Pinning vs. Floating in CI/CD

The debate between pinning and floating dependencies is a governance decision with real consequences:

- **Pin everything:** Reproducible builds, but manual effort to stay current. Dependencies drift silently until someone audits.
- **Float within ranges:** Automatic currency for patches and minor versions, but builds may break without code changes.
- **Pin in lockfile, float in manifest:** The modern consensus. The manifest declares intent (compatible versions), the lockfile records reality (exact versions). CI rebuilds the lockfile periodically and tests the result [10].

> **Related:** [K8S](../K8S/), [SYS](../SYS/), [CDL](../CDL/)

---

## 5. Drift Detection and Currency Monitoring

Version drift is the gap between the pinned version and the latest available version. In fast-moving ecosystems, drift accumulates daily. A dependency pinned at v1.28.0 may be 12 minor versions behind within a year -- each carrying bug fixes, security patches, and performance improvements that the consumer never receives [11].

### Drift Severity Classification

The semver-based drift classification used in upstream monitoring:

```
// Drift classification by semver delta
function classifyDrift(pinned: string, live: string): Severity {
  const [pMaj, pMin, pPat] = pinned.split('.').map(Number);
  const [lMaj, lMin, lPat] = live.split('.').map(Number);

  if (lMaj > pMaj) return 'BLOCK';     // Breaking changes -- halt
  if (lMin > pMin) return 'ADVISORY';   // New features -- review
  if (lPat > pPat) return 'LOG';        // Bug fixes -- log
  return 'CURRENT';                      // No drift
}
```

This classification directly maps semver semantics to operational responses: major drift blocks execution (the contract may be broken), minor drift triggers an advisory (the contract has expanded), patch drift is logged silently (the contract is unchanged) [1, 7].

### Currency Monitoring Architectures

Three common architectures for automated currency monitoring:

1. **Pull-based polling:** A scheduled job checks release feeds at intervals. Simple, stateless, tolerant of downstream failures. Used by Dependabot, Renovate, and the GSD upstream monitor design [12, 13].

2. **Push-based webhooks:** The registry notifies subscribers on new releases. Lower latency, but requires registry support and webhook infrastructure. GitHub, npm, and crates.io all support release webhooks [14].

3. **Hybrid:** Poll for initial discovery, then subscribe to webhooks for real-time updates. Combines reliability of polling with responsiveness of push. Used by large-scale dependency management services [12].

### The Cost of Not Monitoring

The 2021 Log4j vulnerability (CVE-2021-44228) demonstrated the cost of dependency drift at scale. Organizations that maintained current dependency inventories could assess exposure within hours. Those that did not spent weeks tracing transitive dependencies through build systems that hadn't been audited in years [15].

> **Related:** [SYS](../SYS/), [K8S](../K8S/), [ACE](../ACE/)

---

## 6. The Frozen Snapshot Problem

A mission pack is a snapshot. It captures the state of a research domain at a specific moment: the available tools, the known techniques, the current best practices. The moment the snapshot is taken, it begins to age. This is not a flaw -- it is an inherent property of any compiled document in a living ecosystem [7].

### Snapshot Aging in Research Contexts

| Time Since Compilation | Typical Drift | Risk Level |
|----------------------|---------------|------------|
| 0-30 days | Patch-level | Low |
| 1-3 months | Minor-level | Medium |
| 3-6 months | Minor to major | High |
| 6+ months | Likely major | Critical |

These timelines are approximate and domain-dependent. A machine learning library that releases weekly will drift faster than a cryptographic standard that releases annually. The key insight is that drift is not a function of calendar time but of release cadence in the dependency [16].

### The Pointer Solution

When a frozen snapshot contains a pointer to a living document (the upstream monitor's version manifest), the snapshot gains a mechanism for self-awareness. It cannot update itself, but it can report: "I was compiled against v1.28.0; the current version is v1.30.0; this is a minor drift event" [7].

This is the architectural insight behind the pointer reference module: a lightweight document that does not carry content but points to content, with a digest that proves the content hasn't changed since the pointer was authored. If the content has changed, the digest mismatch is itself a signal.

```
SNAPSHOT AGING AND POINTER ARCHITECTURE
================================================================

  Compilation Time ─────── t=0
       |
       | Mission pack compiled with pinned versions
       | v0.62.0, v1.28.0, v2.43.0
       |
  Execution Time ────────── t=n
       |
       | Version sentinel checks live tags:
       | v0.62.0 → v0.63.2 (ADVISORY -- minor drift)
       | v1.28.0 → v1.28.3 (LOG -- patch drift)
       | v2.43.0 → v3.0.0  (BLOCK -- major drift!)
       |
  Decision Point
       |
       +-- BLOCK:    Halt execution, require CAPCOM approval
       +-- ADVISORY: Continue with logged warning
       +-- LOG:      Continue silently
       +-- CURRENT:  No action needed
```

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [MCF](../MCF/)

---

## 7. Version Resolution in Dependency Trees

When a module declares dependencies, each dependency may itself have dependencies, forming a tree (or more precisely, a directed acyclic graph). Version resolution is the process of finding a set of concrete versions that satisfies all constraints simultaneously [17].

### The SAT Problem in Dependency Resolution

Dependency resolution is reducible to Boolean satisfiability (SAT), which is NP-complete in the general case. Modern package managers use specialized solvers that exploit the structure of version constraints to find solutions efficiently:

- **npm:** Uses a tree-hoisting algorithm that deduplicates dependencies by placing the most commonly required version at the shallowest node [9].
- **Cargo:** Uses a resolution algorithm that prioritizes the newest compatible version for each dependency [18].
- **pip:** Historically used a first-match algorithm prone to conflicts; pip 20.3+ introduced a backtracking resolver [19].

### Diamond Dependencies

The classic version conflict pattern: module A depends on B and C, both of which depend on D but at incompatible versions. This "diamond dependency" is the most common cause of version resolution failures [17].

```
DIAMOND DEPENDENCY PATTERN
================================================================

           A (root)
          / \
         v   v
        B     C
         \   /
          v v
           D   <-- B wants D@1.x, C wants D@2.x
               <-- CONFLICT: no version satisfies both
```

### Resolution Strategies

| Strategy | Approach | Trade-off |
|----------|----------|-----------|
| Newest compatible | Pick the newest version satisfying all constraints | May introduce untested combinations |
| Oldest compatible | Pick the oldest version satisfying all constraints | Maximum stability, minimum features |
| Lockfile-first | Use lockfile version if it satisfies constraints | Reproducibility over currency |
| User override | Allow explicit version pinning to break conflicts | Requires human judgment |

> **Related:** [K8S](../K8S/), [SYS](../SYS/), [CDL](../CDL/)

---

## 8. Research Module Versioning in Practice

The GSD Research Series applies versioning principles to knowledge artifacts. Each research project carries a version that tracks with the gsd-skill-creator release cycle (v1.49.x), and each module within a project is individually versioned by its content state [7].

### Size Contracts as Governance Instruments

Research module versioning is governed by size contracts that define the acceptable range for each document class:

| Document Class | Min Lines | Max Lines | Promotion Trigger |
|---------------|-----------|-----------|-------------------|
| Research module | 150 | 400 | Exceeds 400 lines or contains spec markers |
| Standalone spec | 200 | unbounded | N/A |
| Vision document | 100 | 300 | N/A |
| Pointer module | 40 | 120 | N/A |

These contracts are not arbitrary -- they reflect the cognitive load appropriate to each document class. A research module is consumed by agents seeking orientation; 400 lines is roughly the upper bound of what can be absorbed as context without losing the through-line. A standalone spec has no upper bound because it serves as a construction reference, not a survey [7].

### Spec-Level Content Markers

Six qualitative markers indicate that a research module has crossed the boundary into specification territory:

1. TypeScript or Rust interface/type definitions
2. Token budget tables with per-operation cost modeling
3. ASCII diagrams spanning more than 15 lines
4. Integration contracts specifying exact API signatures
5. Versioning headers or changelog sections
6. More than 3 named subsections with independent technical scope

Any module exhibiting these markers is a promotion candidate, regardless of line count. The markers detect category shift that line counting alone would miss [7].

> **Related:** [GSD2](../GSD2/), [COK](../COK/), [ACE](../ACE/)

---

## 9. Automated Version Sentinels

A version sentinel is a lightweight automated agent that monitors upstream releases and reports drift events. The design principles for effective sentinels emerge from decades of configuration management practice [20, 21]:

### Design Principles

1. **Stateless operation.** The sentinel reads a version manifest and queries upstream. It carries no state between invocations. This makes it idempotent and safe to run at any frequency.

2. **Read-only access.** The sentinel never writes to repositories, never creates PRs, never modifies lockfiles. It reports. Humans decide.

3. **Severity classification.** Not all drift is equal. Major drift is a potential contract break; patch drift is routine. The sentinel classifies and routes accordingly.

4. **Deterministic logic.** The classification algorithm is pure: same inputs always produce same outputs. No heuristics, no ML, no probabilistic assessment. The version comparison is arithmetic.

5. **Minimal resource consumption.** A sentinel that costs more than the drift it detects is a net negative. Haiku-tier token cost, simple HTTP fetches, no authentication tokens.

### Implementation Pattern

```
VERSION SENTINEL ARCHITECTURE
================================================================

  ┌─────────────────────┐
  │  Version Manifest   │ <-- YAML, committed to repo
  │  (pinned versions)  │     source of truth for what was compiled
  └─────────┬───────────┘
            │ read
            v
  ┌─────────────────────┐
  │  Sentinel Agent     │ <-- Haiku-tier, deterministic
  │  (comparison logic) │     pure function: manifest + live → report
  └─────────┬───────────┘
            │ fetch (HTTP GET, no auth)
            v
  ┌─────────────────────┐
  │  Upstream Registry  │ <-- GitHub releases, npm registry, etc.
  │  (live versions)    │     public API, read-only
  └─────────┬───────────┘
            │ compare
            v
  ┌─────────────────────┐
  │  Drift Report       │ <-- JSON or structured log
  │  (severity events)  │     routed to orchestrator event stream
  └─────────────────────┘
```

### Sentinel Anti-Patterns

| Anti-Pattern | Problem | Correct Approach |
|-------------|---------|-----------------|
| Auto-update on drift | Breaks reproducibility | Report only; human decides |
| Auth token in manifest | Security exposure | Public API only; no tokens |
| Alert on every patch | Alarm fatigue | LOG severity for patches |
| Skip pre-releases | Miss breaking changes | Include pre-release in checks |
| Check only direct deps | Miss transitive drift | Check full manifest tree |

> **Related:** [SYS](../SYS/), [K8S](../K8S/), [PMG](../PMG/)

---

## 10. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Semantic versioning | M1, M4, M5 | PMG, GSD2, CDL |
| Module identity | M1, M3, M4 | GSD2, MCF, COK |
| Version pinning | M1, M2, M4 | K8S, SYS, CDL |
| Drift detection | M1, M2, M5 | SYS, K8S, ACE |
| Dependency resolution | M1, M3 | K8S, SYS, CDL |
| Size governance | M1, M4 | GSD2, COK, ACE |
| Version sentinels | M1, M2, M5 | SYS, PMG, K8S |
| Frozen snapshots | M1, M2, M4 | GSD2, MCF, PMG |

---

## 11. Sources

1. Preston-Werner, T. (2013). *Semantic Versioning 2.0.0*. semver.org. The canonical specification for version numbering in software ecosystems.
2. Mens, T., Claes, M., & Grosjean, P. (2014). "ECOS: Ecological studies of open-source software ecosystems." *IEEE Software Engineering Workshop*. Framework for understanding dependency health.
3. Kunze, J., et al. (2018). "Versioning of Research Data: Principles and Practice." *Research Data Alliance Working Group*. Application of versioning to non-code artifacts.
4. FORCE11 (2020). *Software Citation Principles*. force11.org. Community standards for citing versioned software.
5. Stall, S., et al. (2019). "Make Scientific Data FAIR." *Nature*, 570, 27-29. FAIR principles applied to version-tracked data artifacts.
6. npm Documentation (2024). "About scopes." docs.npmjs.com. Namespace and identity patterns in the npm ecosystem.
7. GSD Ecosystem (2026). *Module Governance & Upstream Intelligence Mission Pack*. Internal mission documentation.
8. Decan, A., Mens, T., & Claes, M. (2017). "An empirical comparison of dependency issues in OSS packaging ecosystems." *IEEE SANER*. Empirical study of pinning strategies and their consequences.
9. npm Documentation (2024). "package-lock.json." docs.npmjs.com. Lockfile specification and resolution algorithm.
10. Renovate Documentation (2024). "Dependency Dashboard." docs.renovatebot.com. Automated dependency currency management.
11. Cox, R. (2019). "Surviving Software Dependencies." *Communications of the ACM*, 62(9), 36-43. Comprehensive treatment of dependency management challenges.
12. GitHub Documentation (2024). "About Dependabot version updates." docs.github.com. Automated version monitoring architecture.
13. Renovate Bot (2024). "How Renovate Works." docs.renovatebot.com. Pull-based dependency monitoring design.
14. GitHub Documentation (2024). "Webhooks - Release events." docs.github.com. Push-based notification for release monitoring.
15. Christey, S., & Martin, R. (2021). "Log4Shell: Lessons for Software Supply Chain Security." *MITRE Technical Report*. Case study in dependency drift consequences.
16. Kula, R. G., et al. (2018). "Do Developers Update Their Library Dependencies?" *Empirical Software Engineering*, 23(1), 384-417. Empirical study of dependency update practices.
17. Abate, P., et al. (2020). "Dependency Solving Is Still Hard, but We Are Getting Better at It." *International Workshop on Software Clones*. Computational complexity of version resolution.
18. Rust Documentation (2024). "How Cargo resolves versions." doc.rust-lang.org. Cargo's version resolution algorithm.
19. Python Packaging Authority (2024). "pip dependency resolution." pip.pypa.io. pip's backtracking resolver documentation.
20. Spinellis, D. (2012). "Package Management Systems." *IEEE Software*, 29(2), 84-86. Overview of automated dependency management.
21. Williams, L., & Smith, C. (2004). "On the Effectiveness of Configuration Management." *IEEE Transactions on Software Engineering*, 30(11). Long-term study of configuration management practices.
