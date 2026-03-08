# Module 6: Cross-Module Synthesis & Implications

> One architectural decision — storing code as content-addressed syntax trees — creates a cascade of consequences that touches every aspect of the Unison system. This document traces that cascade, examines what Unison proves about the future of programming, and honestly assesses what remains unknown.

---
module: 6
title: Cross-Module Synthesis & Implications
status: DRAFT
wave: 2
track: SYNTHESIS
task: W2.INTEG
sources: UNI-BIGIDEA, UNI-1-0, UNI-CLOUD-APPROACH, LWN-UNISON, SOFTWAREMILL-P1, SOFTWAREMILL-P4, FRANK-PAPER, KOKA-LANG
last_updated: 2026-03-07
---

## S.1 Cross-Module Integration: The Content-Addressing Cascade

Most programming languages are collections of independent features — a type system here, a package manager there, a build tool bolted on after the fact. Unison is different. Nearly every distinctive property of the system traces back to a single architectural choice made before the first line of code was written: **definitions are identified by the cryptographic hash of their content-addressed abstract syntax tree, not by their name or location in a filesystem**.

This section traces how that one decision propagates through every module of this reference, creating properties that appear to be independent features but are actually emergent consequences of the same root cause.

### The Root: Code Is Data, Identified by Hash

When you write a Unison function, the compiler parses it into an AST, replaces variable names with positional de Bruijn indices, resolves all references to other definitions by their hashes, and computes a SHA3-512 hash of the result (Module 1, Section 1.2). That hash becomes the definition's permanent, immutable identity. The name you gave the function — `increment`, `add1`, `plusOne` — is metadata stored separately, a pointer to the hash. Two functions with different names but identical structure after canonicalization share the same hash and are, as far as the system is concerned, the same function [UNI-BIGIDEA][SOFTWAREMILL-P1].

This is not a caching optimization or a clever implementation detail. It is a foundational redefinition of what "code identity" means. Every consequence below flows from this redefinition.

### Cascade 1: Build Elimination

If a definition's hash never changes (because changing it would produce a different definition with a different hash), then the compiled form of that definition never needs to be recomputed. The codebase database stores typed, fully compiled ASTs keyed by hash. There is no build step because there is nothing to build — the "compiled output" was created the moment the definition entered the database (Module 1, Section 1.6).

This is not incremental compilation. Incremental systems (Cargo, Bazel, Gradle) ask "what changed since last time?" and rebuild the affected targets. Unison asks "has this exact hash been compiled before?" — and the answer is always yes [LWN-UNISON]. The comparison matrix in Module 1 demonstrates that even Bazel's content-addressed build actions, the closest traditional analog, still require running a build tool, resolving an action graph, and checking a cache. Unison eliminates the entire category.

The consequence cascades further: pulling a library from Unison Share means pulling pre-compiled ASTs, not source code that needs compilation. The shared compilation cache spans the entire ecosystem, not just a single CI system [UNI-BIGIDEA].

### Cascade 2: Non-Breaking Renames and a Different VCS Model

Because names are metadata pointers to hashes, renaming a function changes only the pointer. No downstream code is affected — all references resolve through the hash, not the name (Module 1, Section 1.4). UCM's `move` command is a metadata operation that completes instantly with zero risk of breaking anything (Module 3, Section 3.1).

This transforms version control. In Git, two developers renaming the same function on different branches create a merge conflict. In Unison, both renames succeed independently — they're just metadata updates pointing to the same unchanged hash (Module 3, Section 3.2). Merge conflicts can only occur when two branches modify the *definition itself* (producing different hashes), not when they change names, formatting, or imports. An entire class of merge conflicts — the most tedious, least semantically meaningful kind — ceases to exist.

The SoftwareMill evaluation confirms this in practice: refactoring in Unison surfaces dependents by hash rather than by name, and the UCM manages the propagation of changes through the dependency graph automatically [SOFTWAREMILL-P1].

### Cascade 3: Abilities Gain Deterministic Handler Swapping

Unison's ability system (Module 2) is built on algebraic effects from the Frank language [FRANK-PAPER], which could exist independently of content-addressing. But the two designs reinforce each other in important ways.

Because ability handlers are definitions stored by hash, swapping a handler is a precise operation — you know exactly which implementation you're substituting, down to the hash of every transitive dependency. In the `Log` ability example (Module 2, Section 2.4), switching between `consoleLogHandler` and `silentLogHandler` swaps one hash reference for another. The type checker verifies compatibility; the content-addressing guarantees that the handler you tested is byte-identical to the handler you deploy.

The interaction goes deeper: test mocking becomes trivial because handlers are interchangeable implementations of the same ability interface, and the content-addressed model ensures that "the handler I tested with" and "the handler running in CI" are provably the same definition (same hash). There is no possibility of a subtle environmental difference changing behavior — if the hashes match, the implementations are identical.

Furthermore, because ability requirements are tracked in type signatures as sets like `{IO, Exception, Store Text}` (Module 2, Section 2.2), the type system provides a complete map of every effect a program can perform. Combined with content-addressing, this means a program's behavior is characterized by two things: its hash (what it computes) and its ability set (what effects it can perform). This is a stronger behavioral specification than any traditional language provides statically.

### Cascade 4: Code Mobility and Typed Distribution

Content-addressing makes code location-independent. A function identified by hash `#abc123` is the same function whether it lives on your laptop, a CI server, or a cloud node in another continent. Shipping code to a remote node means shipping the hash; the receiving node checks its local cache, requests any missing dependencies by their hashes, and executes (Module 4, Section 4.1).

This eliminates the entire container-based deployment pipeline. No Dockerfile. No image registry. No Kubernetes manifests. No CI/CD pipeline to build and push images. The function IS the deployment artifact — its hash pins the exact implementation and every transitive dependency [UNI-CLOUD-APPROACH].

The typed serialization consequence follows directly: because every type is content-addressed, the hash of a type serves as its schema identifier. Serialization is automatic — the runtime knows the structure from the hash. Deserialization is type-safe — the receiving node verifies the hash matches (Module 4, Section 4.4). Traditional distributed systems require defining schemas (protobuf, Avro), generating serializers, maintaining compatibility, and handling version mismatches. Unison eliminates all four steps. If a remote call typechecks, it cannot fail due to serialization errors at runtime.

The deployment example in Module 4, Section 4.6, makes this concrete: a two-service application with typed RPC, transactional storage, and HTTP handling requires approximately 35 lines of Unison and zero configuration files. The equivalent Docker/Kubernetes implementation requires an estimated 500-1000+ lines across 15-25 files [VENDOR-CLAIM][UNI-CLOUD-APPROACH].

### Cascade 5: The Dependency Problem Dissolves

Traditional package managers must solve version resolution — a constraint satisfaction problem that grows combinatorially with dependency graph size. npm's `node_modules`, Cargo's `Cargo.lock`, pip's virtual environments all exist because two libraries might depend on incompatible versions of a shared dependency (the "diamond dependency problem").

In Unison, "different versions of a library" are simply different definitions with different hashes. They coexist in the same codebase without conflict because there is no global namespace to fight over (Module 1, Section 1.4). Library A can depend on hash `#old-json-parser` while Library B depends on hash `#new-json-parser`, and both work simultaneously without resolution, deduplication, or conflict.

This makes Unison Share structurally simpler than npm or crates.io (Module 5, Section 5.1). There is no `package.json` to maintain, no lock file to commit, no `npm audit` vulnerability cascade where updating one transitive dependency breaks three others. The content-addressed model provides what traditional registries approximate with semver: a guarantee that the code you tested is the code that runs.

### Cascade 6: Perfect Test Caching

Deterministic tests are cached by the hash of the test definition and all its transitive dependencies. A test re-runs only when any dependency's hash changes — and because hashes capture exact content, this cache is *perfect*: no false invalidations, no stale results, no "rebuild just in case" (Module 1, Section 1.4).

Traditional CI systems use heuristics — changed files, estimated dependency graphs, test file timestamps — to decide which tests to skip. These heuristics are necessarily approximate. Bazel's test caching comes closest, but it still operates at the build-action level, not the individual-definition level. Unison's test cache is both finer-grained (per definition) and more reliable (content-addressed, never stale) than any traditional alternative.

This cache spans the ecosystem. Because definitions on Unison Share are already compiled and tested, pulling a library includes its cached test results. The trust model is different — you're trusting that the hash corresponds to the test you'd run locally — but the mechanism is sound: same hash, same definition, same test result.

### Cascade 7: AI-Assisted Development on Stable Ground

The MCP server integration (Module 3, Section 3.4) represents the newest cascade. When an AI agent works with Unison code, it works with semantically stable references — hashes — rather than fragile file paths that change with renames, moves, or repository restructuring. The complete dependency graph is machine-readable. There is no build state to manage, no environment variables to configure, no compilation flags to set correctly.

This creates a tighter feedback loop than traditional AI coding assistants: the AI writes Unison code, UCM typechecks it immediately, the AI receives structured error feedback, and iteration proceeds with full type system validation rather than heuristic linting (Module 3, Section 3.4). The content-addressed model means the AI's changes are precise — updating a definition creates a new hash, and the system tracks exactly which dependents need attention.

### The Single Narrative

These seven cascades are not independent features. They are a single design decision — content-addressed ASTs — expressing itself across different domains:

- **Build elimination** is content-addressing applied to compilation
- **Non-breaking renames** is content-addressing applied to refactoring
- **Handler swapping safety** is content-addressing applied to effect management
- **Code mobility** is content-addressing applied to distribution
- **No dependency conflicts** is content-addressing applied to package management
- **Perfect test caching** is content-addressing applied to CI
- **Stable AI references** is content-addressing applied to tooling integration

A developer encountering Unison for the first time might see seven impressive features. What they're actually seeing is one idea with seven projections. This architectural coherence — where a single root decision creates a consistent set of emergent properties — is Unison's most distinctive contribution to programming language design.

---

## S.2 Implications for Programming Language Evolution

Unison is a case study in what happens when a language questions assumptions so fundamental that most language designers never think to question them. This section examines what Unison proves, what it suggests, and what remains unproven.

### S.2.1 The File-Based Assumption Is Optional

Every mainstream programming language assumes "code is text in files." This assumption is so deeply embedded that it's invisible — version control, build systems, editors, linters, formatters, CI/CD pipelines, and deployment tools all take it as given. Unison demonstrates a working alternative: code as typed ASTs in a content-addressed database [UNI-BIGIDEA][LWN-UNISON].

The LWN analysis places this in historical context: the approach "resembles Smalltalk and LabVIEW" in storing programs in machine-readable format rather than text files, but differs in using cryptographic content-addressing rather than a mutable image [LWN-UNISON]. What Unison adds to the Smalltalk lineage is *immutability* — the codebase is append-only, and identity is derived from content rather than assigned by the image.

The implications extend beyond Unison. If content-addressing eliminates builds, dependency conflicts, and merge conflicts for Unison, the same approach could in principle be applied to existing languages. A content-addressed storage layer for TypeScript or Rust ASTs could provide some of the same benefits — though retrofitting it onto a language designed for text files would be vastly harder than building it in from the start.

The deeper question: is the file-based model's dominance a reasoned choice, or historical inertia from the 1970s Unix philosophy of "everything is a file"? Unison's existence forces the programming language community to consider that the answer might be the latter.

### S.2.2 Effects Can Be Practical

Algebraic effects have been an active area of programming language research since Plotkin and Power's 2003 formalism [PLOTKIN-POWER], with handler semantics formalized by Plotkin and Pretnar [PLOTKIN-PRETNAR] and direct-style effects explored in the Frank language [FRANK-PAPER]. But for most of this history, algebraic effects have been a topic of academic papers, not production software.

Unison, alongside Koka [KOKA-LANG], demonstrates that algebraic effects can work in a real language with a simpler mental model than monads. The comparison is illuminating (Module 2, Section 2.5): where Haskell requires monad transformer stacks, `lift` operations, and function coloring (the syntactic infection of effectful code into callers), Unison's abilities compose by simple union — `{IO, Exception, Store Text}` — with no ordering dependency and no syntactic overhead.

The trade-off is real. Unison's direct-style effects sacrifice some referential transparency: extracting a common subexpression can change program behavior when the expression has effects (Module 2, Section 2.5). The Unison documentation honestly acknowledges this cost. But for the majority of application code, where effects are used for I/O, error handling, and state management, the ergonomic improvement over monadic style is substantial.

What this means for the effects landscape: the question is no longer "can algebraic effects work in practice?" but "which languages will adopt them and in what form?" OCaml 5 has added native effects. Scala 3 explores capability-based effects. Even languages without formal effect systems are converging on effect-like patterns (Rust's async/await, Swift's structured concurrency). Unison's contribution is demonstrating the full loop — declaration, usage, handler swapping, type inference — in a production-targeting language.

### S.2.3 Distribution Can Be Language-Native

Traditional distributed systems are built by bolting infrastructure onto languages that describe single-process programs. The gap between "write a function" and "deploy a service" is filled by what Module 4 calls "YAML engineering" — containers, orchestrators, service meshes, configuration files, and serialization frameworks that encode system architecture in untyped formats [UNI-CLOUD-APPROACH].

Unison collapses this gap. Deployment is a function call (`deployHttp myService`). Service-to-service communication is a typed function call (`Services.call albumService request`). Serialization is automatic. The type system checks network boundaries at compile time (Module 4, Sections 4.2, 4.4).

The comparison with Erlang/OTP is instructive (Module 5, Section 5.3). Erlang proved decades ago that distribution can be a language concern rather than an infrastructure concern — its actor model, message passing, and hot code reloading are built into the language and VM. What Unison adds is *static typing across distribution boundaries*. Erlang's messages are dynamically typed; Unison's remote calls are statically typed. Erlang's code mobility is at module granularity without type guarantees; Unison's is at definition granularity with full type safety.

The implication for cloud computing: if distribution is a language feature, then cloud platforms can be dramatically simpler. The entire container-orchestration ecosystem exists in part because languages don't express distribution. If they did, the infrastructure between "code" and "running service" could shrink by an order of magnitude. Whether this vision scales to the complexity of real-world distributed systems — with their partial failures, network partitions, and heterogeneous environments — remains to be proven (see Section S.3).

### S.2.4 AI-Assisted Development Meets Content-Addressing

The MCP server integration (Module 3, Section 3.4) points toward a future where AI development tools work with semantic code representations rather than text. In a content-addressed codebase, an AI agent can:

- Reference any definition unambiguously by hash, regardless of renames or file reorganization
- Traverse the complete dependency graph programmatically
- Submit code for full type system validation, not just heuristic linting
- Make changes that are precisely tracked — new hash, known dependents, clear scope of impact

This contrasts with current AI coding assistants, which work with text files, approximate dependency understanding through heuristics, and lack access to the full type system during code generation. The content-addressed model provides AI agents with what they currently lack: *ground truth about code identity and dependencies*.

The "agentic computing framework" on Unison's 2026 roadmap (Module 5, Section 5.5) suggests Unison Computing sees this as a strategic direction: a platform where AI agents don't just assist human developers but autonomously write, deploy, and manage distributed services. Whether this vision is achievable depends on factors well beyond the language design, but the content-addressed foundation provides a structurally stronger substrate for it than text-file-based alternatives.

### S.2.5 The Trade-offs Are Real

Unison's architectural purity comes with concrete costs that this analysis must not minimize:

**Small ecosystem.** ~140,000 published definitions and ~1,300 project authors (Module 5, Section 5.1) [VENDOR-CLAIM][UNI-1-0] is a rounding error compared to npm's millions of packages or even Haskell's ~17,000 Hackage entries. Many common tasks lack library support. This is the single largest barrier to adoption, and it is a direct consequence of the novelty that makes Unison interesting.

**No FFI.** As of early 2026, Unison cannot call C libraries (Module 5, Section 5.4). This means no OpenSSL, no SQLite bindings, no access to the vast ecosystem of C/C++ code that underpins most production software. The C FFI is on the 2026 roadmap, but until it ships, Unison programs exist in a hermetically sealed world.

**Learning curve.** Developers must simultaneously learn functional programming, algebraic effects, content-addressed code, and the UCM workflow (Module 5, Section 5.4). Each concept is individually learnable; together they represent a substantial investment that most developers will not make without a compelling reason.

**Proprietary cloud.** The distributed computing capabilities — the most distinctive part of Unison's story — are a proprietary commercial product `[PROPRIETARY]` (Module 4, Section 4.7). The language is MIT-licensed, but the production-grade runtime for distributed computing is controlled by a single company with $9.75M in seed funding and an unproven business model [UNI-1-0].

**Performance uncertainty.** Unison currently uses an interpreter. While improvements have been made and JIT compilation is in development [VENDOR-CLAIM][UNI-1-0], interpreted execution is inherently slower than compiled code for compute-intensive workloads. Independent benchmarks do not exist (Module 5, Section 5.4).

**Referential transparency edge cases.** Direct-style effects mean that extracting a common subexpression can change behavior when the expression has effects (Module 2, Section 2.5). This is a fundamental trade-off, not a bug — Unison chose direct-style ergonomics over full referential transparency. For application code, this is usually the right trade-off. For library code, it requires more care than monadic style.

These are not problems that will "solve themselves with time." Some (small ecosystem, no FFI) are actively being addressed. Others (proprietary cloud, referential transparency trade-off) are inherent in the design and represent genuine limitations that prospective adopters must weigh.

---

## S.3 Gap Analysis

This section identifies what the available evidence does NOT tell us. Every gap represents a question where honest assessment must replace confidence.

### Gap 1: Performance Data

**What we don't know:** There are no independent benchmarks comparing Unison's runtime performance against equivalent implementations in other languages. The Unison team reports "vast improvements to our interpreter's speed and efficiency" [VENDOR-CLAIM][UNI-1-0], but no numbers accompany this claim. JIT compilation is described as in development, but no timeline, approach, or preliminary results are public.

**Why it matters:** For I/O-bound cloud services (Unison's target), interpreter overhead may be negligible. For compute-intensive workloads — the kind that push developers toward Rust, C++, or Go — the performance characteristics are unknown. Without data, adopters cannot make informed performance trade-off decisions.

**What would close this gap:** Independent benchmarks using standard suites (e.g., the Computer Language Benchmarks Game), or published performance profiles of real Unison Cloud workloads with comparison baselines. Koka's published performance research [KOKA-LANG] demonstrates that effect system overhead can be made competitive with direct code — similar data for Unison would substantially strengthen the case.

### Gap 2: Scale Evidence

**What we don't know:** The largest production deployments on Unison Cloud are not publicly documented. We do not know: how many concurrent services the platform supports, what the latency characteristics are under load, what the failure modes look like at scale, or how Adaptive Service Graph Compression (Module 4, Section 4.2) behaves with complex service topologies.

The 10-100x LOC reduction claim [VENDOR-CLAIM][UNI-CLOUD-APPROACH] is self-reported with no public case study providing before-and-after measurements on a real application.

**Why it matters:** The distributed computing story is Unison's most distinctive value proposition. Without scale evidence, it remains a compelling demonstration rather than a proven platform.

**What would close this gap:** A published case study from a BYOC deployment of meaningful scale (dozens of services, meaningful traffic), with performance metrics and comparison to a prior architecture. Even a single well-documented production deployment would substantially increase confidence.

### Gap 3: Migration Path

**What we don't know:** There is no documented approach for incrementally adopting Unison in an existing system. The lack of FFI (Module 5, Section 5.4) means Unison programs cannot call into existing codebases. There is no interoperability story — no way to have a Unison service call a Python library, wrap a Rust crate, or embed a C extension.

**Why it matters:** Most real-world adoption is incremental. Organizations don't rewrite entire systems in a new language; they adopt it for new components alongside existing infrastructure. Without a migration path, Unison is limited to greenfield projects with no legacy dependencies — a small and specific niche.

**What would close this gap:** The C FFI on the 2026 roadmap is the critical item. Once FFI exists, Unison programs can call C-compatible libraries, which effectively provides access to the entire native ecosystem through wrapper definitions. The gap narrows dramatically with FFI; it is nearly impassable without it.

### Gap 4: Long-Term Codebase Health

**What we don't know:** The append-only codebase model (Module 1, Section 1.2) means definitions are never deleted from the database. Over years of development, the database accumulates every definition ever created — including abandoned experiments, superseded implementations, and dead code. The theoretical properties are sound (hashes don't collide, old definitions don't interfere with new ones), but the practical behavior at scale is empirically unproven.

Specific unknowns: database size growth rate over years, query performance with millions of definitions, garbage collection strategies (if any), codebase merge behavior when combining large independent codebases.

**Why it matters:** A model that works well at thousands of definitions may have unexpected properties at millions. The SQLite backend (Module 1, Section 1.3) achieved ~100x size reduction when adopted [VENDOR-CLAIM][UNI-1-0], suggesting the team is aware of storage concerns, but long-term growth characteristics are undocumented.

**What would close this gap:** Published data on codebase size growth over multi-year projects, documentation of any garbage collection or compaction mechanisms, and performance benchmarks at scale (e.g., typecheck time and `find` performance with 1M+ definitions).

### Gap 5: Community Sustainability

**What we don't know:** Unison Computing has $9.75M in seed funding (Module 5, Section 5.2) and is structured as a public benefit corporation. The business model depends on Unison Cloud revenue from a language with ~1,300 project authors and ~6,500 GitHub stars. There is no public evidence of additional funding rounds, revenue numbers, or a path to profitability.

**Why it matters:** A programming language requires decades of sustained investment. If Unison Computing's funding runs out before cloud revenue is self-sustaining, the language's development trajectory could slow dramatically. The MIT license protects the existing language, but active development — the C FFI, JIT compiler, improved tooling — would depend on community volunteers taking over a complex Haskell codebase.

**What would close this gap:** Public reporting on revenue trajectory, additional funding, or a credible path to sustainability. Alternatively, a community large enough to sustain development independently of the company (the way Rust transitioned from Mozilla to the Rust Foundation).

### Gap 6: Academic Validation

**What we don't know:** The content-addressing approach has not been formally analyzed for its properties beyond the hash collision analysis (SHA3-512 provides ~100 quadrillion years at 1M definitions/second [VENDOR-CLAIM][UNI-BIGIDEA]). Specifically:

- **No formal proof** that the canonicalization process (de Bruijn indices + reference resolution) preserves semantic equivalence in all cases
- **No formal analysis** of the ability system's interaction with content-addressing (e.g., whether handler swapping preserves behavioral equivalence)
- **No published comparison** with alternative content-addressing schemes (e.g., Merkle trees over different AST representations, or hashing at different granularities)

The ability system's theoretical foundation in Frank [FRANK-PAPER] and algebraic effects [PLOTKIN-POWER][PLOTKIN-PRETNAR] is well-established academically. The *content-addressing* component is not — it's an engineering innovation, not a formally studied property.

**Why it matters:** Formal analysis would either confirm the approach's soundness or identify edge cases. The practical system appears to work well, but "appears to work" is weaker than "proven correct." The Dunfield-Krishnaswami bidirectional typechecking algorithm [DUNFIELD-BIDIR] underlying the type inference is formally analyzed; the content-addressing layer built on top of it is not.

**What would close this gap:** A peer-reviewed paper analyzing the properties of content-addressed ASTs — specifically the canonicalization invariants, the hash stability guarantees, and the interaction between content-addressing and the effect system. This would also benefit other systems that might adopt similar approaches.

---

## S.4 Synthesis: What Unison Is and Isn't

Unison is the most thorough exploration of content-addressed code as a programming model that has been attempted at production scale. Its contribution is not any single feature — algebraic effects exist in Koka, distributed computing exists in Erlang, content-addressing exists in Git — but the *integration* of these ideas into a coherent system where each reinforces the others.

The honest assessment: **Unison's ideas are ahead of its ecosystem** [SOFTWAREMILL-P4][LWN-UNISON]. The language proves that content-addressed code eliminates real problems (builds, dependency conflicts, merge conflicts from renames). It proves that algebraic effects are practical for application development. It demonstrates that distribution can be a language feature rather than an infrastructure layer. These are genuine contributions to programming language design.

But Unison has not yet proven that its approach can sustain a viable ecosystem, survive the transition from startup funding to self-sustaining community, or scale to the demands of production distributed systems. The gap between "interesting and well-designed" and "ready to bet your company on" remains wide. The C FFI, performance data, and scale evidence are the critical missing pieces that will determine whether Unison moves from "promising" to "proven."

For programming language researchers, Unison is essential reading — a working demonstration of ideas that have been theoretical for decades. For working developers, it is worth watching and experimenting with, particularly for greenfield distributed systems where the content-addressing benefits are most pronounced. For organizations choosing production infrastructure, the maturity gaps identified in Section S.3 counsel patience and careful evaluation.

The cascade is real. The question is whether the ecosystem can grow to match the architecture.

---

## Cross-References

- **Module 1: Language Core** — Content-addressing foundation (Sections 1.1, 1.2, 1.4, 1.6)
- **Module 2: Type System & Abilities** — Effect system, handler mechanics, direct-style trade-offs (Sections 2.2, 2.4, 2.5, 2.6)
- **Module 3: Tooling & Developer Workflow** — UCM, projects, MCP server, editor support (Sections 3.1, 3.2, 3.4, 3.5)
- **Module 4: Distributed Computing & Unison Cloud** — Code mobility, typed RPC, BYOC, deployment model (Sections 4.1, 4.2, 4.3, 4.4, 4.6)
- **Module 5: Ecosystem, Community & Adoption** — Ecosystem scale, adoption barriers, roadmap, growth trajectory (Sections 5.1, 5.3, 5.4, 5.5, 5.6)

---

## Sources

| ID | Source | Used For |
|----|--------|----------|
| UNI-BIGIDEA | [Unison: The Big Idea](https://www.unison-lang.org/docs/the-big-idea/) | Content-addressing foundation, hash collision analysis |
| UNI-1-0 | [Unison 1.0 Announcement](https://www.unison-lang.org/unison-1-0/) | Ecosystem metrics, roadmap, performance claims |
| UNI-CLOUD-APPROACH | [Unison Cloud: Our Approach](https://www.unison.cloud/our-approach/) | Distribution philosophy, LOC reduction claims |
| LWN-UNISON | [Programming in Unison — LWN.net](https://lwn.net/Articles/978955/) | Independent analysis, Smalltalk comparison, limitations |
| SOFTWAREMILL-P1 | [Trying Out Unison Part 1 — SoftwareMill](https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/) | Practical refactoring, hash identity demonstration |
| SOFTWAREMILL-P4 | [Trying Out Unison Part 4 — SoftwareMill](https://softwaremill.com/trying-out-unison-part-4-summary/) | Overall assessment, ecosystem maturity |
| FRANK-PAPER | Lindley, McBride, McLaughlin — "Do Be Do Be Do" (2017) | Theoretical foundation for abilities |
| PLOTKIN-POWER | Plotkin, Power — "Algebraic Operations and Generic Effects" (2003) | Original algebraic effects formalism |
| PLOTKIN-PRETNAR | Plotkin, Pretnar — "Handlers of Algebraic Effects" | Handler abstraction foundation |
| DUNFIELD-BIDIR | Dunfield, Krishnaswami — Bidirectional type inference | Type inference algorithm |
| KOKA-LANG | [Koka Language](https://koka-lang.github.io/) | Effect system comparison, performance research |
| UNI-ABILITIES | [Abilities and Ability Handlers](https://www.unison-lang.org/docs/language-reference/abilities-and-ability-handlers/) | Ability syntax and handler mechanics |
