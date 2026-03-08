# The Unison Language — Technical Reference

---
module: ALL
title: Master Document Template
status: STUB
wave: 0
track: —
task: W0
sources: ALL
last_updated: 2026-03-07
---

> This document defines the complete structure for the Unison Language Technical Reference.
> Each section stub describes its content scope, source dependencies, and producing task.
> Wave 1 agents fill sections in parallel; Wave 2 synthesizes cross-cutting themes.

---

## Module 1: Language Core — Content-Addressed Code

> **Track:** A (Wave 1) — Language & Type System track
> **Agent scope:** Sections 1.1–1.6

### 1.1 The Big Idea: Content-Addressing

Explain the fundamental innovation of Unison: code is identified by the hash of its content rather than by name and file location. Cover the motivation (eliminating builds, enabling code mobility), the intellectual lineage (content-addressable storage in git, IPFS, Nix), and what changes when names are metadata rather than identity.

- **Sources:** [UNI-BIGIDEA], [UNI-DOCS], [LWN-UNISON], [SOFTWAREMILL-P1]
- **Produced by:** W1A.1
- **Safety gates:** ANNOTATE any performance claims from official sources

### 1.2 Hash Scheme and Canonicalization

Detail the hashing mechanism: what exactly is hashed (the Abstract Binding Tree after type inference), how names are stripped, how structural and unique types differ, and what hash algorithm is used. Explain canonicalization — how Unison ensures that semantically identical code produces the same hash regardless of variable naming or formatting.

- **Sources:** [UNI-LANGREF], [UNI-GITHUB], [UNI-BIGIDEA]
- **Produced by:** W1A.1
- **Safety gates:** Verify hash algorithm details against source code if docs are ambiguous

### 1.3 The Codebase Database

Describe the codebase as a database of definitions indexed by hash. Cover the storage format, how names map to hashes (the namespace), how type declarations are stored, and how the codebase differs from a traditional filesystem-based project. Explain how multiple names can point to the same hash and how refactoring becomes a namespace operation.

- **Sources:** [UNI-BIGIDEA], [UNI-DOCS], [ATHAYDES-UNISON], [SOFTWAREMILL-P1]
- **Produced by:** W1A.1
- **Safety gates:** GATE — codebase format is [OSS], distinguish from Share [PROPRIETARY]

### 1.4 Consequences of Content-Addressing

Analyze the downstream effects: build elimination, dependency hell resolution, fearless refactoring, code mobility (→ Module 4), caching properties, and immutable definitions. Also cover the trade-offs: learning curve, tooling dependency (UCM is mandatory), and loss of file-system-level code browsing.

- **Sources:** [UNI-BIGIDEA], [LWN-UNISON], [SOFTWAREMILL-P1], [SOFTWAREMILL-P4], [ATHAYDES-UNISON]
- **Produced by:** W1A.1
- **Safety gates:** ANNOTATE vendor claims about build speed; include independent critique

### 1.5 Language Basics

Survey Unison's core syntax and semantics: function definitions, pattern matching, type annotations, structural and unique types, documentation literals, test blocks, and the watch expression workflow. This is not a tutorial but a reference summary with representative examples.

- **Sources:** [UNI-LANGREF], [UNI-DOCS], [LWN-UNISON]
- **Produced by:** W1A.2
- **Safety gates:** All code examples must be syntactically valid or annotated [ILLUSTRATIVE]

### 1.6 Build Elimination Analysis

Provide a focused analysis of what "no build step" means in practice. Compare with traditional compiled languages (Haskell, Rust, Go) and interpreted languages (Python, JavaScript). Quantify where time savings actually occur (compilation, linking, dependency resolution) and where they don't (type checking still happens, UCM add/update still takes time).

- **Sources:** [UNI-BIGIDEA], [LWN-UNISON], [SOFTWAREMILL-P1], [ATHAYDES-UNISON]
- **Produced by:** W1A.2
- **Safety gates:** ANNOTATE any "faster than" comparisons; seek independent corroboration

---

## Module 2: Type System & Abilities

> **Track:** A (Wave 1) — Language & Type System track
> **Agent scope:** Sections 2.1–2.6

### 2.1 Type System Overview

Survey Unison's type system: Hindley-Milner foundation with bidirectional type inference, higher-rank polymorphism, structural and unique types, type-directed name resolution, and the role of type annotations. Explain how the type system interacts with content-addressing (types are part of the hash).

- **Sources:** [UNI-LANGREF], [UNI-DOCS], [DUNFIELD-BIDIR], [LWN-UNISON]
- **Produced by:** W1A.3
- **Safety gates:** Verify type system claims against academic sources

### 2.2 Abilities (Algebraic Effects)

Deep-dive into Unison's ability system: what abilities are, how they differ from traditional monads and type classes, the syntax for declaring abilities, providing operations, and writing handlers. Explain the "direct style" programming model — code that looks imperative but is actually effect-tracked.

- **Sources:** [UNI-ABILITIES], [UNI-ABILITIES-MONADIC], [FRANK-PAPER], [PRAGDAVE-ABILITIES], [LWN-UNISON]
- **Produced by:** W1A.3
- **Safety gates:** Ground claims in academic sources; distinguish Unison's implementation from theoretical ideal

### 2.3 Built-in Abilities

Catalog the standard abilities: IO, Exception, STM, Scope, Stream, and others. For each, describe its purpose, key operations, and common handler patterns. Note which abilities are "terminal" (can only be handled by the runtime) vs. user-handleable.

- **Sources:** [UNI-ABILITIES], [UNI-LANGREF], [UNI-DOCS]
- **Produced by:** W1A.3
- **Safety gates:** Verify catalog completeness against latest docs/source

### 2.4 Custom Ability Walkthrough

Provide a complete worked example of defining a custom ability, implementing handlers, and composing abilities. Use a realistic scenario (e.g., a logging ability, a database access ability) rather than a trivial example. Show how abilities compose without the "monad transformer stack" problem.

- **Sources:** [UNI-ABILITIES], [PRAGDAVE-ABILITIES], [SOFTWAREMILL-P2], [UNI-DOCS]
- **Produced by:** W1A.4
- **Safety gates:** Code examples must be complete and runnable (or annotated [ILLUSTRATIVE])

### 2.5 Direct Style vs. Monadic Style

Compare Unison's direct-style ability programming with Haskell's monadic style. Explain why Unison chose direct style (influenced by Frank), what programmers gain (no do-notation, no monad transformers, no lift), and what the trade-offs are (handler placement, debugging complexity).

- **Sources:** [UNI-ABILITIES-MONADIC], [FRANK-PAPER], [ATHAYDES-UNISON], [LWN-UNISON]
- **Produced by:** W1A.4
- **Safety gates:** Present both sides fairly; include Haskell community perspective

### 2.6 Effect System Comparison Table

Comprehensive comparison table covering Unison abilities, Haskell effect libraries (polysemy, effectful, mtl), Scala 3 capabilities, Koka effects, and OCaml 5 effects. Compare on: syntax, type safety, composition, performance, ecosystem maturity, and learning curve.

- **Sources:** [UNI-ABILITIES], [KOKA-LANG], [SCALA3-EFFECTS], [HASKELL-EFFECTS], [FRANK-PAPER], [SOFTWAREMILL-P2]
- **Produced by:** W1A.4
- **Safety gates:** Use comparison table format from 00-shared-schemas.md; be fair to all languages

---

## Module 3: Tooling & Developer Workflow

> **Track:** B (Wave 1) — Tooling & Ecosystem track
> **Agent scope:** Sections 3.1–3.6

### 3.1 Unison Codebase Manager (UCM)

Describe UCM's role as the central development tool: what it does (manages the codebase database, handles namespaces, runs code), how it differs from traditional build tools + package managers, and its command structure. Cover the key workflow commands: add, update, find, view, run, test.

- **Sources:** [UNI-DOCS], [UNI-GITHUB], [LWN-UNISON], [SOFTWAREMILL-P1]
- **Produced by:** W1B.1
- **Safety gates:** UCM is [OSS]; note version-specific features

### 3.2 Projects and Branches

Explain UCM's project and branch model: how projects organize code, how branches enable parallel development, how merging works with content-addressed code (structural merge), and how this differs from git's text-based merge. Cover dependency management via lib/ namespace.

- **Sources:** [UNI-DOCS], [UNI-BIGIDEA], [SOFTWAREMILL-P1]
- **Produced by:** W1B.1
- **Safety gates:** Clarify what conflict resolution looks like in practice

### 3.3 UCM Desktop App

Cover the new UCM Desktop application: what it provides over the CLI (GUI codebase browser, integrated editor, visual namespace navigation), its architecture (Electron/Tauri-based), and current maturity level.

- **Sources:** [UNI-UCM-0545], [UNI-BLOG]
- **Produced by:** W1B.2
- **Safety gates:** [MATURITY-CAVEAT] — Desktop app is recent; note stability status

### 3.4 MCP Server and AI Integration

Detail the UCM MCP (Model Context Protocol) server: what it exposes to AI assistants, how it enables AI-assisted Unison development, supported operations, and integration with Claude Code and other AI tools. This is a distinctive feature worth analyzing carefully.

- **Sources:** [UNI-UCM-0545], [UNI-BLOG]
- **Produced by:** W1B.2
- **Safety gates:** ANNOTATE AI capability claims; distinguish demonstrated vs. aspirational features

### 3.5 Editor Support (LSP)

Survey the current editor integration story: LSP support status, supported editors (VS Code, Neovim, Emacs), feature coverage (diagnostics, completion, hover, go-to-definition), and gaps compared to mainstream language LSP implementations.

- **Sources:** [UNI-DOCS], [UNI-GITHUB], [SOFTWAREMILL-P4]
- **Produced by:** W1B.2
- **Safety gates:** Report actual feature status, not aspirational

### 3.6 End-to-End Workflow

Walk through a complete development workflow: creating a project, writing code, running tests, publishing to Share, and deploying to Cloud. This section connects Modules 3, 4, and 5 by showing how the tools work together in practice.

- **Sources:** [UNI-DOCS], [UNI-SHARE], [SOFTWAREMILL-P1], [SOFTWAREMILL-P4]
- **Produced by:** W1B.3
- **Safety gates:** GATE — distinguish [OSS] workflow steps from [PROPRIETARY] (Share, Cloud)

---

## Module 4: Distributed Computing

> **Track:** B (Wave 1) — Tooling & Ecosystem track
> **Agent scope:** Sections 4.1–4.6

### 4.1 Code Mobility

Explain the key insight: because code is content-addressed, it can be sent to any node that has the Unison runtime and executed there. Cover how this works mechanically (serializing hash references, resolving definitions from the codebase), why traditional languages can't easily do this, and the implications for distributed systems.

- **Sources:** [UNI-BIGIDEA], [UNI-CLOUD-APPROACH], [LWN-UNISON], [SOFTWAREMILL-P3]
- **Produced by:** W1B.3
- **Safety gates:** ANNOTATE "impossible in other languages" claims; some languages (Erlang, Elixir) have partial code mobility
→ See Module 1, Section 1.1 for content-addressing foundation

### 4.2 Unison Cloud Architecture

Describe the Unison Cloud platform: its architecture (managed runtime nodes, storage, networking), the programming model (typed services, durable workflows), pricing model, and current status. This is a commercial product — maintain clear `[PROPRIETARY]` annotation throughout.

- **Sources:** [UNI-CLOUD-APPROACH], [UNI-BYOC], [SOFTWAREMILL-P3]
- **Produced by:** W1B.4
- **Safety gates:** GATE — entire section covers [PROPRIETARY] product; ANNOTATE all performance/scale claims

### 4.3 BYOC (Bring Your Own Cloud)

Detail the BYOC offering: how it differs from managed Cloud, self-hosting requirements, supported cloud providers, what components run where, and the trust model. Analyze the value proposition vs. DIY distributed systems frameworks.

- **Sources:** [UNI-BYOC], [UNI-CLOUD-APPROACH], [UNI-BLOG]
- **Produced by:** W1B.4
- **Safety gates:** GATE — [PROPRIETARY]; ANNOTATE cost and performance claims; note limited independent validation

### 4.4 Typed RPC and Serialization

Explain how Unison enables typed remote procedure calls: automatic serialization of values and functions (including closures), type-safe communication between nodes, and how abilities enable transparent local/remote abstraction. Compare with gRPC, Thrift, and other RPC frameworks.

- **Sources:** [UNI-CLOUD-APPROACH], [UNI-DOCS], [SOFTWAREMILL-P3]
- **Produced by:** W1B.4
- **Safety gates:** ANNOTATE "zero-boilerplate" claims; compare fairly with established RPC systems

### 4.5 Distributed Data Structures

Cover Unison's approach to distributed state: durable storage primitives, distributed queues, and how the ability system abstracts over local vs. distributed data access. Note what's available today vs. planned.

- **Sources:** [UNI-CLOUD-APPROACH], [UNI-DOCS], [UNI-BLOG]
- **Produced by:** W1B.5
- **Safety gates:** Distinguish [VENDOR-CLAIM] about planned features from currently available ones

### 4.6 Deployment Example

Provide a concrete deployment walkthrough: a simple distributed application (e.g., a service with a worker and a queue) deployed to Unison Cloud or BYOC. Show the code, the deployment steps, and the observable behavior. Compare the developer experience with equivalent deployments in Docker/Kubernetes.

- **Sources:** [UNI-CLOUD-APPROACH], [UNI-BYOC], [SOFTWAREMILL-P3], [UNI-DOCS]
- **Produced by:** W1B.5
- **Safety gates:** GATE — [PROPRIETARY]; if no reproducible example available, annotate [ILLUSTRATIVE]

---

## Module 5: Ecosystem & Adoption

> **Track:** Synthesis (Wave 2)
> **Agent scope:** Sections 5.1–5.6
> Depends on: Modules 1–4 completion

### 5.1 Unison Share

Describe the Unison Share package registry: how libraries are published and consumed, discovery mechanisms, versioning (or lack thereof — content-addressing changes this), and comparison with crates.io, Hackage, npm, etc.

- **Sources:** [UNI-SHARE], [UNI-DOCS], [SOFTWAREMILL-P4]
- **Produced by:** W2.1
- **Safety gates:** GATE — [PROPRIETARY] service; note ecosystem size honestly

### 5.2 Community Metrics

Quantify the Unison community: GitHub stars, contributors, commit frequency, Discourse/Slack activity, Share library count, conference talks, job postings. Present numbers without inflation. Use GitHub API data where possible.

- **Sources:** [UNI-GITHUB], [UNISON-DISCOURSE], [UNI-SHARE], [UNISON-YOUTUBE]
- **Produced by:** W2.1
- **Safety gates:** Use verifiable metrics only; ANNOTATE any self-reported numbers from Unison Computing

### 5.3 Related Languages Comparison

Position Unison in the programming language landscape. Compare with: Haskell (type system, effects), Erlang/Elixir (distribution, code mobility), Nix (content-addressing), Koka (effect system), Scala (functional + practical). Matrix format from 00-shared-schemas.md.

- **Sources:** [LWN-UNISON], [SOFTWAREMILL-P4], [KOKA-LANG], [HASKELL-EFFECTS], [ATHAYDES-UNISON]
- **Produced by:** W2.2
- **Safety gates:** Be fair to all languages; no "Unison is better" without qualification

### 5.4 Adoption Barriers

Honestly assess what prevents broader adoption: learning curve, ecosystem size, tooling maturity, commercial dependency (Cloud/Share), small team risk, lack of production case studies, and the fundamental bet on content-addressing.

- **Sources:** [SOFTWAREMILL-P4], [LWN-UNISON], [ATHAYDES-UNISON], [UNISON-DISCOURSE]
- **Produced by:** W2.2
- **Safety gates:** Include positive and critical perspectives; avoid either cheerleading or dismissal

### 5.5 2026 Roadmap

Summarize Unison's publicly stated roadmap and direction: planned features, runtime improvements, Cloud evolution, community growth targets. Distinguish between committed plans and aspirational goals.

- **Sources:** [UNI-1-0], [UNI-BLOG], [UNI-GITHUB]
- **Produced by:** W2.2
- **Safety gates:** ANNOTATE all forward-looking statements as [VENDOR-CLAIM]; note that roadmaps are aspirational

### 5.6 Growth Trajectory

Analyze Unison's growth trajectory: where it was (research project), where it is (1.0 release), and plausible paths forward. Consider analogies with other language adoption curves (Rust, Kotlin, Elixir). Neither bullish nor bearish — analytical.

- **Sources:** [UNI-1-0], [SOFTWAREMILL-P4], [LWN-UNISON], [INFOWORLD-UNISON], [UNI-GITHUB]
- **Produced by:** W2.2
- **Safety gates:** No predictions — present data and let readers draw conclusions

---

## Synthesis

> **Track:** Synthesis (Wave 2)
> **Agent scope:** Sections S.1–S.3
> Depends on: All modules complete

### S.1 Cross-Module Integration

Draw connections across all five modules: how content-addressing (M1) enables code mobility (M4), how abilities (M2) underpin Cloud's programming model (M4), how UCM (M3) ties the development loop together, and how all of this shapes adoption (M5). Identify the coherence of the overall vision.

- **Sources:** All sources; synthesis of prior modules
- **Produced by:** W2.3
- **Safety gates:** Ensure cross-references resolve; maintain claim annotations from source modules

### S.2 Implications for Programming Language Evolution

Assess what Unison's approach means for the broader programming language field: is content-addressing a generalizable idea? Will other languages adopt algebraic effects? Does UCM's MCP integration preview a new era of AI-native language tooling? Analytical, not speculative.

- **Sources:** [FRANK-PAPER], [LWN-UNISON], [KOKA-LANG], [EFFECTS-BIBLIO], [SOFTWAREMILL-P4]
- **Produced by:** W2.3
- **Safety gates:** Distinguish trends from speculation; ground in evidence

### S.3 Gap Analysis

Identify what we couldn't verify, what remains unknown, and where the documentation or public evidence is insufficient. This is the intellectual honesty section — every research project has gaps, and acknowledging them strengthens the work.

- **Sources:** All sources (by absence)
- **Produced by:** W2.3
- **Safety gates:** Be specific about what's missing and why

---

## Bibliography

> Generated from `00-source-index.md` at publication time.
> Each citation includes: Author/Organization, Title, URL, Date accessed, Quality rating.
> Format follows the citation conventions in `00-shared-schemas.md`, Section 2.

- **Produced by:** W3 (Publication wave)
- **Sources:** `00-source-index.md` (full catalog)

---

## Appendices (Optional)

### A. Glossary of Unison-Specific Terms
> Expanded version of the terminology table in `00-shared-schemas.md`, Section 9.
> Produced by: W3

### B. Unison Code Examples Collection
> Consolidated code examples from all modules, verified for correctness.
> Produced by: W3

### C. Version History
> Document revision tracking.
> Produced by: W3
