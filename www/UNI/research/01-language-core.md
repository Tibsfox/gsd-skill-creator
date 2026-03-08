# Module 1: Language Core

> Unison is a statically typed, purely functional programming language where code is identified by content hashes rather than names. This module covers the foundational innovation — content-addressing — and its consequences for builds, dependencies, refactoring, and distribution.

---

## 1.1 The Big Idea: Content-Addressing

Traditional programming languages store code as text files on a filesystem. Unison takes a fundamentally different approach: **code is stored as typed abstract syntax trees (ASTs) in a database, keyed by cryptographic hashes of their content**.

Every definition in Unison — a function, a type, a test — receives a unique identity derived from *what it does*, not *what it's called*. Names are metadata, stored separately from the code they refer to. This single architectural decision eliminates entire categories of problems that plague traditional software development.

### How It Works

When you write a Unison definition, the following pipeline executes:

1. **Parse** the text into an AST
2. **Typecheck** the AST (bidirectional type inference)
3. **Canonicalize** the AST (see [Section 1.2](#12-hash-scheme-and-canonicalization))
4. **Hash** the canonical AST using SHA3-512
5. **Store** the typed, compiled AST in the codebase database, keyed by its hash

Once stored, the definition is **immutable** — it never changes, because changing it would produce a different hash, which is a different definition.

### The Identity Example

Consider these two functions:

```unison
funnyAdd : Nat -> Nat -> Nat
funnyAdd x y = x + y + 1

amusingAdd : Nat -> Nat -> Nat
amusingAdd a b = a + b + 1
```

These hash to the **same value** (`#g9l97dio`) because after canonicalization, they have identical ASTs. The parameter names `x`/`y` vs `a`/`b` are stripped during canonicalization (replaced with positional de Bruijn indices), and the names `funnyAdd`/`amusingAdd` are metadata, not part of the hash.

However:

```unison
comicalAdd : Nat -> Nat -> Nat
comicalAdd x y = y + x + 1
```

This produces a **different hash**, even though `Nat.+` is commutative and the function is semantically equivalent. Canonicalization captures **structural** equivalence (identical AST shape), not **semantic** equivalence (identical mathematical meaning). The argument order `y + x` vs `x + y` produces a different AST.

*Source: [SoftwareMill, "Trying Out Unison Part 1: Code as Hashes"](https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/), 2023*

### Names Are Metadata

This deserves emphasis: in Unison, **a name is a pointer to a hash, not the identity of the code**. Multiple names can point to the same hash. Renaming a function only changes the name-to-hash mapping — it never changes the definition, its hash, or any code that depends on it.

This is the inverse of every other language, where a function's name IS its identity and renaming requires updating every call site.

---

## 1.2 Hash Scheme and Canonicalization

### SHA3-512 Hashing

Unison uses **512-bit SHA3 (Keccak) hashes** to identify definitions. The hash is computed over the canonicalized AST, not the source text.

**Collision resistance**: At a rate of one million unique definitions per second, the expected time to first collision is roughly **100 quadrillion years** `[VENDOR-CLAIM]`. For practical purposes, hash collisions do not occur. The 512-bit address space (2^512 possible hashes) provides a margin far beyond any conceivable codebase size.

*Source: [Unison documentation, "The Big Idea"](https://www.unison-lang.org/docs/the-big-idea/)*

### Canonicalization Steps

Before hashing, the AST undergoes two transformations:

**1. De Bruijn index substitution**: All named parameters are replaced with positional indices. A function like:

```unison
increment : Nat -> Nat
increment n = n + 1
```

becomes (conceptually):

```
increment = (#arg1 -> #a8s6df921a8 #arg1 1)
```

where `#arg1` is the positional reference to the first argument.

**2. Reference resolution**: All references to other definitions are replaced with their hashes. In the example above, `Nat.+` is replaced by its hash `#a8s6df921a8`. This means the hash of `increment` depends on the exact implementation of `Nat.+`, not just its name.

These two steps ensure that:
- Different parameter names produce the same hash (structural equivalence)
- The hash captures the full transitive dependency tree (a change to `Nat.+` would produce a different hash for `increment`)

### The Append-Only Model

The codebase database is **append-only**. New definitions are added; old definitions are never modified or deleted. This is conceptually similar to an immutable log or a content-addressed storage system like Git's object store — but at the level of individual definitions rather than file snapshots.

---

## 1.3 The Codebase Database

### SQLite Backend

Unison codebases are stored in a **SQLite database**, typically at `~/.unison`. The project adopted SQLite in 2021, replacing a filesystem-based storage approach and achieving approximately **100x codebase size reduction** `[VENDOR-CLAIM]`.

*Source: [Unison 1.0 announcement](https://www.unison-lang.org/unison-1-0/), timeline entry 2021*

### What's Stored

The database contains:

| Entity | Description |
|--------|-------------|
| **Typed ASTs** | Fully type-checked syntax trees, linked by hash |
| **Name mappings** | Bidirectional name-to-hash associations |
| **Type signatures** | Inferred or declared types for each definition |
| **Test results** | Cached results of deterministic tests, keyed by hash |
| **Watch expressions** | REPL-style expressions for interactive development |

### Immutability Guarantee

Once a definition enters the database, it is immutable. "Editing" a definition actually creates a new definition with a new hash, then updates the name mapping to point to the new hash. The old definition remains in the database — it's just no longer referenced by that name.

### Shared Compilation Cache

Because definitions are stored as **already-compiled, type-checked ASTs**, pulling a library from Unison Share (the package registry) does not require recompilation. The ASTs are portable across machines. This is a shared compilation cache that spans the entire ecosystem.

### Relation to Traditional Version Control

Unison's codebase model is complementary to Git, not a replacement for it. Git tracks text file changes; Unison's database tracks semantic definition changes. The database itself can be committed to a Git repository as a binary artifact, but the meaningful history is in the codebase's internal log of definition additions.

The LWN analysis notes the approach "resembles Smalltalk and LabVIEW" in storing programs in machine-readable format rather than text files, but differs in using cryptographic content-addressing rather than a mutable image.

*Source: [LWN.net, "Unison: a content-addressed programming language"](https://lwn.net/Articles/978955/)*

---

## 1.4 Consequences of Content-Addressing

The hash-based identity model produces a cascade of practical benefits. Each follows directly from the architecture:

| Property | Mechanism | Traditional Equivalent |
|----------|-----------|----------------------|
| **Zero build times** | Definitions are parsed and type-checked once at creation, then stored compiled. There is no build step — the codebase IS the compiled output. | Incremental compilation (recompile changed files). Even the best traditional systems (Bazel, Buck) rebuild changed targets. |
| **Non-breaking renames** | Names are metadata mappings to hashes. Renaming updates the mapping only. No downstream code references the name — all references are to the hash. | Find-and-replace across files, update imports, fix broken references, resolve merge conflicts from concurrent renames. |
| **Perfect test caching** | Deterministic test results are cached by the hash of the test and all its transitive dependencies. Tests re-run only when any dependency's hash changes. | CI systems use heuristics (changed files, dependency graphs) to skip tests. Cache invalidation is approximate. |
| **Semantic version control** | Formatting differences, import reordering, and comment changes do not alter hashes. Only semantic changes (different ASTs) create new versions. | Git diffs include whitespace, formatting, and import order changes. Merge conflicts arise from non-semantic changes. |
| **No dependency conflicts** | Two versions of a library are simply two sets of definitions with different hashes. They coexist without conflict — there is no global namespace to fight over. | "Dependency hell" — version resolution, diamond dependencies, `node_modules` deduplication, virtual environments. |
| **Code mobility** | A hash pins a definition AND all its transitive dependencies. Shipping code to a remote node means shipping the hash; missing dependencies are fetched on demand. | Docker images, fat JARs, vendored dependencies, container registries — packaging the runtime environment with the code. |
| **Typed serialization** | A value's type is known by its hash. Serialization and deserialization are automatic — the type system guarantees the structure. "Definitions never change," so deserialization always recovers identical semantics. | Manual serialization (JSON, Protobuf, MessagePack), schema versioning, migration scripts, backwards-compatibility layers. |

*Sources: [Unison "The Big Idea"](https://www.unison-lang.org/docs/the-big-idea/); [LWN analysis](https://lwn.net/Articles/978955/); [SoftwareMill](https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/)*

### Practical Refactoring Example

The SoftwareMill article demonstrates a concrete refactoring scenario. When a function `kiwi` is modified from one parameter to two, the codebase manager:

1. Creates a new definition with a new hash for the updated `kiwi`
2. Identifies all dependent functions (e.g., `orange`)
3. Presents those dependents in a scratch file with **hash references** rather than the now-ambiguous name: `#hmt4gnn927 (#hmt4gnn927 x)`
4. The developer updates each dependent, which creates new hashes for them too

The system propagates changes precisely — only actual dependents are affected, and the old versions remain available.

*Source: [SoftwareMill](https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/), 2023*

---

## 1.5 Language Basics

### Core Properties

Unison is:

- **Statically typed** — all types checked at definition time, before storage
- **Purely functional** — no mutable state by default; side effects tracked by the type system via abilities (→ See Module 2)
- **Strictly evaluated** — arguments are evaluated before function application (unlike Haskell's lazy evaluation)
- **Expression-oriented** — everything is an expression that returns a value

### Syntax Fundamentals

**Function application** uses spaces, not parentheses:

```unison
-- Unison: spaces for application
result = List.map increment myList

-- Compare to: result = List.map(increment, myList)
```

**Pattern matching** uses the `match ... with` construct:

```unison
describe : Nat -> Text
describe n = match n with
  0 -> "zero"
  1 -> "one"
  _ -> "many"
```

**Type signatures** are optional (inferred) but supported:

```unison
factorial : Nat -> Nat
factorial n = match n with
  0 -> 1
  n -> n * factorial (n - 1)
```

### Structural vs. Unique Types

Unison has two kinds of type declarations:

**Structural types** are identified by their structure. Two structural types with the same fields are the same type:

```unison
structural type Pair a b = Pair a b
```

**Unique types** are identified by declaration identity. Two unique types with identical structure are still distinct:

```unison
unique type Email = Email Text
unique type Username = Username Text
-- Email and Username are different types even though both wrap Text
```

### Recursion

Unison has **no loops**. Iteration is expressed via recursion:

```unison
sum : [Nat] -> Nat
sum = cases
  [] -> 0
  h +: t -> h + sum t
```

### Delayed Computations

The thunk syntax `'` (apostrophe) delays a computation; `!` (bang) forces it:

```unison
delayed = '(expensive computation)  -- not yet evaluated
result = !delayed                    -- evaluated now
```

This is essential for working with abilities (→ See Module 2, Section 2.5).

### Implementation

The Unison compiler and codebase manager (UCM) are implemented in **Haskell**, which constitutes approximately **99.0%** of the repository code. The remainder is shell scripts (0.8%), Vim Script (0.1%), Nix (0.1%), and trace amounts of C.

*Source: [GitHub repository language statistics](https://github.com/unisonweb/unison)*

### Development Workflow

Development in Unison does not use traditional text editors directly (though LSP support exists since August 2022). The primary workflow:

1. Write definitions in a **scratch file** (`*.u`)
2. The **UCM** (Unison Codebase Manager) watches the file, parses and typechecks on save
3. UCM presents the results and offers to **add** definitions to the codebase
4. Accepted definitions are hashed and stored in the database

The UCM is described as "a collaboration with the compiler" rather than the traditional edit-compile-fix cycle.

*Source: [LWN.net](https://lwn.net/Articles/978955/)*

### Ecosystem Scale

As of March 2026:

| Metric | Value |
|--------|-------|
| Published definitions | 139,811+ `[VENDOR-CLAIM]` |
| Project authors | 1,300+ `[VENDOR-CLAIM]` |
| Library downloads | 152,459 `[VENDOR-CLAIM]` |
| Repository commits | 26,558+ (per 1.0 announcement; GitHub shows ~20K on main repo) |
| PRs merged | 3,490+ |
| GitHub stars | ~6,500 |
| Latest release | v1.1.1 (February 2026) |
| Total releases | 97 |

*Sources: [Unison 1.0](https://www.unison-lang.org/unison-1-0/); [GitHub](https://github.com/unisonweb/unison)*

### Licensing

The **Unison language, compiler, and runtime are MIT-licensed** open source software. **Unison Cloud** — the managed deployment platform — is a **proprietary commercial product** from Unison Computing, a public benefit corporation. A free tier exists, along with a "Bring Your Own Cloud (BYOC)" self-hosted option.

---

## 1.6 Build Elimination Analysis

Unison does not have a faster build system — it has **no build system**. The "build step" is eliminated entirely because definitions are compiled (parsed, type-checked, stored as typed ASTs) at creation time, and the result is cached permanently (keyed by content hash, which never changes).

This is a qualitatively different approach from incremental compilation. To understand why, compare with five representative build systems:

### Comparison Matrix

| Dimension | Make | Cargo (Rust) | Stack/Cabal (Haskell) | Gradle | Bazel | Unison |
|-----------|------|-------------|----------------------|--------|-------|--------|
| **Granularity** | File-level | Crate-level | Package-level | Task-level | Action-level | Definition-level |
| **Cache key** | File timestamp | Source hash + config | Package hash | Task inputs hash | Action content hash | Definition AST hash |
| **Invalidation** | Any file touch (even whitespace) | Any source change in crate | Any source change in package | Changed task inputs | Changed action inputs | Changed definition or transitive dep |
| **False rebuilds** | Frequent (timestamp-based) | Moderate (whole crate) | Moderate (whole package) | Low (task-scoped) | Low (action-scoped) | **None** (definition-scoped, content-addressed) |
| **Shared cache** | None (local only) | sccache (optional) | None standard | Build cache (optional) | Remote cache (optional) | **Built-in** (codebase database IS the cache) |
| **Cold build cost** | Full recompile | Full crate compilation | Full package compilation | Full task graph execution | Full action graph execution | **Zero** (pre-compiled ASTs fetched from Share) |
| **Approach** | Rebuild stale targets | Rebuild changed crates | Rebuild changed packages | Rebuild changed tasks | Rebuild changed actions | **No rebuild** — already compiled at creation |

### Why This Matters

**Make** (1976) uses file timestamps. Touch a file without changing it, and Make rebuilds everything downstream. This is the crudest form of incremental compilation.

**Cargo** (Rust) works at crate granularity. Change one function in a crate, and the entire crate recompiles. The `incremental` flag helps within a crate but doesn't eliminate the recompilation step.

**Stack/Cabal** (Haskell) works at package granularity. Ironically, Unison's own compiler (written in Haskell) is subject to these rebuild costs during its own development. Packages are the unit of compilation; changing one module triggers package-level recompilation.

**Gradle** introduces task-level granularity with input/output fingerprinting. A task re-runs only when its declared inputs change. The build cache can share results across machines. This is significantly better than file-level approaches but still requires executing the build tool, resolving the task graph, and checking every task.

**Bazel** (Google) is the closest traditional analog to Unison's approach. Bazel uses content-addressed build actions: the inputs to a compilation step are hashed, and results are cached by that hash. A remote cache enables sharing across developers and CI. However, Bazel still has a build step — it must resolve the action graph, check cache entries, and execute uncached actions. The cache exists alongside the source code, not as the source code.

**Unison** eliminates the entire category. There is no build tool to run, no action graph to resolve, no cache to check. The codebase database **is** the compiled output. Pulling a library means pulling pre-compiled ASTs. The granularity is individual definitions — the smallest possible unit — and the cache is perfect (content-addressed, never stale).

### The Key Insight

Traditional build systems ask: *"What changed since last time, and what do I need to recompile?"*

Unison asks: *"Has this exact definition (by content hash) been compiled before?"* — and the answer is always yes, because it was compiled when it was created.

This is not an incremental improvement on builds. It is the elimination of builds as a concept.

### Limitations

The build elimination comes with trade-offs:

- **No traditional FFI**: Unison cannot directly call C/Rust/etc. libraries. The LWN analysis notes there is no "stable foreign-function interface (FFI)" for wrapping libraries in other languages. This means functionality must be reimplemented in Unison.
- **Tooling ecosystem**: Standard development tools (linters, formatters, profilers) must be rewritten to work with the codebase database rather than text files.
- **Compilation of the compiler itself**: The Haskell-based UCM must be compiled traditionally. The "no build" guarantee applies to Unison code, not to the toolchain.

*Sources: [LWN.net](https://lwn.net/Articles/978955/); [Unison "The Big Idea"](https://www.unison-lang.org/docs/the-big-idea/)*

---

## Cross-References

- → **Module 2: Type System & Abilities** — How the type system tracks effects and enables safe distribution
- → **Module 3: Distribution & Cloud** — How content-addressing enables code mobility and typed serialization across nodes
- → **Module 4: Developer Experience** — The UCM workflow, scratch files, and tooling ecosystem
- → **Module 5: Ecosystem & Assessment** — Maturity analysis, FFI limitations, and adoption context

---

## Sources

| ID | Source | Date | Used For |
|----|--------|------|----------|
| S1 | [Unison Docs: The Big Idea](https://www.unison-lang.org/docs/the-big-idea/) | Current | Hashing, canonicalization, consequences |
| S2 | [Unison 1.0 Announcement](https://www.unison-lang.org/unison-1-0/) | 2025 | Ecosystem stats, SQLite adoption, timeline |
| S3 | [GitHub: unisonweb/unison](https://github.com/unisonweb/unison) | Current | Language stats, release info, repo structure |
| S4 | [LWN: "Unison: a content-addressed programming language"](https://lwn.net/Articles/978955/) | 2024 | Independent analysis, limitations, comparisons |
| S5 | [SoftwareMill: "Trying Out Unison Part 1"](https://softwaremill.com/trying-out-unison-part-1-code-as-hashes/) | 2023 | Practical examples, hash identity, refactoring workflow |
