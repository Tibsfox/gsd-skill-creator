# Prolog Implementations and Ecosystem

*A deep field survey of the runtimes, virtual machines, compilers, development
tools, libraries, and standardization efforts that make up the world of Prolog
as an engineering platform.*

This document is one of four parallel research threads for the PNW Research
Series project on Prolog (PLG). It covers **implementations and tooling**
only — the abstract machines, the runtimes that sit on top of them, the
development environments, the foreign-function interfaces, and the practical
experience of writing real Prolog code in 2026. Other threads cover history,
language semantics, and modern applications (expert systems, CLP, Datalog,
ASP); where those subjects are touched here, it is only as background.

---

## Table of Contents

1. The Warren Abstract Machine (WAM)
2. Alternative abstract machines
3. SWI-Prolog
4. SICStus Prolog
5. GNU Prolog
6. YAP Prolog
7. XSB Prolog
8. Ciao Prolog
9. ECLiPSe
10. B-Prolog and Picat
11. Scryer Prolog
12. Trealla Prolog
13. Tau Prolog
14. Logtalk
15. Historical and legacy implementations
16. Performance and compilation
17. Development tools
18. Foreign interfaces
19. Libraries and packs
20. Benchmarks
21. Standardization
22. Getting started
23. Tooling gaps and pain points
24. References

---

## 1. The Warren Abstract Machine (WAM)

The Warren Abstract Machine is the single most influential piece of
infrastructure in the Prolog world. It is the reason that, four decades after
its introduction, a random Prolog program moves from one implementation to
another with astonishing frequency. Writing "most Prologs share a core
execution model" sounds like faint praise until you compare it to Lisp, where
there is no equivalent standard machine, or to the ML family, where the
underlying runtime for OCaml and SML and F# are entirely different beasts.

### 1.1 Origin and context

David H. D. Warren published the WAM design in 1983 as SRI Technical Note 309,
*An Abstract Prolog Instruction Set*. By that point Warren had already built
the DEC-10 Prolog compiler (the famous "Warren's compiler" from 1977) which
itself compiled to a set of specialized instructions on the PDP-10. The 1983
WAM was not that instruction set. It was a ground-up redesign with the
explicit goal of mapping Prolog's execution model efficiently to any
general-purpose CPU, with a particular focus on the then-new RISC machines.

The history thread covers Warren's biography and the broader 1970s-80s
Edinburgh Prolog lineage. What matters here is that the WAM was published as
a *reference architecture*, not a fixed instruction set, which meant every
serious Prolog implementation from 1985 onward could treat it as a starting
point and specialize from there.

### 1.2 What the WAM actually does

At the heart of the WAM is the observation that Prolog execution involves
three orthogonal concerns, each of which benefits from a dedicated data
structure:

1. **Unification** — constructing and deconstructing terms. Handled by
   argument registers and a term heap.
2. **Backtracking** — undoing variable bindings on failure. Handled by a
   trail and choice point stack.
3. **Procedure call** — entering and leaving clauses like a traditional
   stack-based language. Handled by an environment stack (sometimes the same
   stack as choice points, sometimes separate).

To support these three concerns the WAM maintains roughly the following
state:

- **Argument registers (A1, A2, ...)**. Pass arguments to predicates.
  Conceptually similar to function-call argument registers in a normal ISA.
  The compiler chooses how many to allocate based on the maximum arity of
  any predicate in the program.
- **Temporary variables (X registers)**. These overlap with the argument
  registers. A "temporary" in the Warren sense is a variable that lives
  entirely within the code of a single clause and does not need to survive
  a recursive call.
- **Permanent variables (Y registers)**. Live in an environment frame on the
  local stack. A variable is permanent if it spans a call — that is, it
  appears in more than one body goal.
- **Heap (H)**. Holds structured terms that cannot fit in registers:
  compound terms (functors + args), lists, and unbound variables that
  escape their original registers.
- **Trail (TR)**. A stack of variable bindings that must be undone on
  backtracking. Every time the unifier binds a variable that was created
  before the most recent choice point, it pushes the address of that
  variable onto the trail. On backtracking, the WAM pops the trail back to
  its value at the choice point and resets each bound variable to "unbound."
- **Choice point stack / local stack (B)**. Holds *choice points*, the data
  structures that remember alternative clauses for a predicate and the
  values of registers at the moment the predicate was called. When a goal
  fails, the WAM restores state from the most recent choice point, advances
  the "next clause" pointer inside that choice point, and tries again.
- **Program counter (P) and continuation (CP)**. Like any stack-based VM,
  the WAM maintains an instruction pointer and a continuation so that when
  a called predicate succeeds, execution resumes at the right spot in the
  caller.
- **Mode flag**. During unification of structured terms, the WAM runs in
  either "read mode" (unifying against an existing term) or "write mode"
  (constructing a new term). The mode is set by `get_structure` or
  `get_list` and consulted by subsequent `unify_*` instructions.

### 1.3 The instruction set at a glance

The WAM instructions are usually grouped into five families. Exact names and
spellings differ slightly between sources — Warren 1983, Aït-Kaci's 1991
tutorial, and the SWI internal documentation all use slightly different
conventions — but the families are identical:

**Put instructions** construct arguments to a call. For each argument of a
goal the compiler emits one put instruction to place the appropriate value
into an Ai register:

- `put_variable Xn, Ai` — create a new unbound variable in Xn and copy it
  into Ai.
- `put_value Xn, Ai` — copy an already-bound Xn into Ai.
- `put_constant c, Ai` — put an atom or small integer into Ai.
- `put_structure f/n, Ai` — allocate a new structure `f/n` on the heap and
  put a pointer to it in Ai (followed by unify_* instructions for the
  subterms).
- `put_list Ai` — allocate a list cell on the heap and put a pointer in Ai.

**Get instructions** are the matching moves on the callee side. They take
arguments out of Ai registers and unify them with the head of a clause:

- `get_variable Xn, Ai`
- `get_value Xn, Ai`
- `get_constant c, Ai`
- `get_structure f/n, Ai`
- `get_list Ai`

**Unify instructions** (`unify_variable`, `unify_value`, `unify_constant`,
`unify_void`) handle subterms. They behave differently in read mode and
write mode, which is why the mode flag exists.

**Procedural instructions** handle control flow:

- `allocate` / `deallocate` — push and pop environment frames.
- `call P/n, N` — call predicate P/n, preserving N permanent variables.
- `execute P/n` — last call optimization: tail-call P/n without pushing a
  new environment.
- `proceed` — return from a deterministic clause.

**Choice instructions** handle nondeterminism:

- `try_me_else L` — create a choice point pointing to L as the alternative
  clause, then fall through to this clause.
- `retry_me_else L` — update the existing choice point's next-clause
  pointer.
- `trust_me` — no more alternatives after this clause; pop the choice
  point.

The symmetric variant (`try L`, `retry L`, `trust L`) is used with indexing:
the indexing tree jumps to the right `try` instruction based on the first
argument of the call, skipping clauses that cannot match.

**Indexing instructions** (`switch_on_term`, `switch_on_constant`,
`switch_on_structure`) dispatch based on the shape of the first argument.

### 1.4 A small worked example

Consider the archetypal `append/3`:

```prolog
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
```

A textbook WAM compiler turns this into something like:

```
append/3:
    switch_on_term     C1a, C1, C2, fail, fail
C1: try_me_else        C2
    get_constant       [], A1
    get_value          A2, A3
    proceed
C2: trust_me
    get_list           A1
    unify_variable     X4
    unify_variable     A1
    get_list           A3
    unify_value        X4
    unify_variable     A3
    execute            append/3
```

The important things to notice:

- The recursive case ends with `execute`, not `call`. This is last-call
  optimization and it is the reason idiomatic Prolog can iterate over huge
  lists without overflowing the stack. When executed on an ideal WAM,
  appending two lists of length *n* consumes *O(1)* environment stack.
- The non-recursive case does not `allocate` or `deallocate` anything,
  because there are no permanent variables — every variable dies before
  the clause ends.
- `switch_on_term` inspects the tag of A1 (variable, constant, list,
  structure) and jumps to the right clause. For a non-empty list call the
  first clause is skipped outright.

### 1.5 Why nearly every modern Prolog is still a WAM descendant

The WAM's combination of features turned out to be extraordinarily hard to
beat:

- **Unification inlined with argument passing.** The `get_*` / `put_*`
  instructions avoid building intermediate terms for simple cases.
- **First-argument indexing by default.** Sacrificing the first argument to
  indexing is the single biggest determinism-recovery mechanism in practice.
- **Environment trimming.** A `call P/n, N` instruction knows exactly how
  many variables from the current frame are still live after the call, and
  can deallocate the rest — shrinking the frame on the way down.
- **Cheap choice points.** A choice point is just a fixed-size struct on a
  stack. Creation and destruction are O(1) and allocation-free beyond the
  stack bump.
- **Zero-copy backtracking.** On failure, restoring state is just moving
  `H`, `TR`, `B`, `E` pointers back and running through the trail. No
  garbage is ever collected on backtracking.

Successor designs have attacked the WAM from both ends. Some made it more
specialized (BinProlog binarizes and removes environment frames). Some made
it more general (tabling Prologs add a suspension mechanism, Mercury adds
mode and determinism information to give up nondeterminism where possible).
But the vocabulary — heap, trail, choice points, environments, first-argument
indexing, LCO — is shared.

### 1.6 Hassan Aït-Kaci's *Tutorial Reconstruction*

The canonical teaching text for the WAM is Hassan Aït-Kaci's 1991 book
*Warren's Abstract Machine: A Tutorial Reconstruction*, which for many years
was the only readable exposition of the machine. Aït-Kaci reconstructs the
WAM incrementally across ten chapters, starting from a trivial unification
machine called L0 and adding, in sequence, procedural calls (L1), flat
resolution (L2), pure Prolog (L3), and finally the full WAM with optimizations
(L4 and beyond). Each step is accompanied by concrete examples, explicit
state transitions, and exercises.

The book has been out of print for decades but is available as a PDF from
both Aït-Kaci himself and from the publisher's archive; it is cited by
basically every Prolog implementation paper published since.

Key teaching points from the tutorial:

- The M0 -> M1 -> M2 -> M3 decomposition is pedagogically wonderful because
  it lets you understand each feature of the WAM as a response to a concrete
  limitation of the previous level.
- The tutorial emphasizes *compilation* of unification rather than
  interpretation. This is the conceptual leap that separates the WAM from
  earlier Prolog implementations (which interpreted term structures at
  runtime).
- Exercises include implementing the WAM in a high-level language — this
  is still the exercise that graduate courses assign when teaching Prolog
  internals.

The ten chapters of the tutorial are, in order: (1) an introduction to
Prolog as a programming language from the compiler's point of view; (2)
M0, a machine that does term construction and unification but no control;
(3) M1, adding flat resolution for ground clauses; (4) M2, adding argument
passing via registers and the put/get split; (5) M3, adding permanent
variables and environments; (6) the full WAM with choice points and
backtracking; (7) indexing; (8) optimizations and special cases; (9) a
worked compilation example from source to WAM; (10) extensions beyond the
textbook WAM (cut, arithmetic, assert/retract, I/O). The chapter
structure is deliberately pedagogical — each step adds one feature and
motivates it by a problem that the previous step could not handle.

### 1.7 Reference implementations

For a modern reader who wants to see a WAM in action, the best reference
implementations are:

- **wambook.sourceforge.net** — Aït-Kaci's own accompanying code.
- The **Andrew Berdnikov** annotated WAM implementation in C, which follows
  the tutorial closely.
- **Lee Naish**'s simple WAM for teaching at Melbourne.
- The **SWI-Prolog** source code — not a teaching implementation, but the
  most widely used production descendant.

### 1.8 Post-WAM optimizations worth knowing

Since 1983 implementers have added a handful of optimizations on top of the
core WAM design that are now standard in any production Prolog. A short
catalog:

- **Last Call Optimization (LCO)**. Warren's original paper described it,
  but it's worth emphasizing: when the final goal of a clause is a call,
  the compiler emits `execute` rather than `call` + `proceed`. This turns
  tail recursion into iteration, collapsing the environment stack. Without
  LCO, every `append/3` call would push an environment frame and most
  real Prolog code would stack-overflow.
- **Environment trimming**. At each call site the compiler knows exactly
  which permanent variables are still live after the call returns, and
  emits an annotation on the `call` instruction so that unused slots can
  be reclaimed before pushing the callee's frame. This keeps environment
  frames small across deep call chains.
- **Last-clause optimization**. When `trust_me` is reached we know there
  are no more alternatives, so the choice point is popped instead of just
  updated. Combined with indexing this means purely deterministic
  predicates never leave a choice point behind.
- **Read-mode / write-mode fusion**. Some compilers (VAM, Aquarius) merge
  the two modes of unification into a single stream to avoid the mode
  flag check on every `unify_*` instruction.
- **Argument register overlap (Xi = Ai)**. The argument registers and the
  temporary registers physically share storage, so putting an argument
  into Ai is the same as putting it into Xi. This avoids an extra move on
  calls where the compiler was going to use the value both as an argument
  and as a temporary.
- **Static mode inference** (Mercury, Ciao). When the compiler knows that
  an argument is always ground at a given call site, it can skip the
  variable-check in `get_value` and emit a simple `cmp` + `jne` branch.
  This is how Mercury gets close to C performance on deterministic code.
- **Tail-recursion modulo cons**. A subtle optimization in YAP and SICStus
  that handles the "reverse accumulating a list in the head" pattern
  without allocating an intermediate environment.

None of these change the vocabulary of the WAM. They just tighten the inner
loop by a constant factor that, aggregated across forty years of work, has
made modern Prolog runtimes competitive with much newer language runtimes.

---

## 2. Alternative abstract machines

The WAM is dominant but not exclusive. Several alternative abstract machines
exist, motivated either by different performance trade-offs or by different
semantics (CLP, tabling, coroutining).

### 2.1 BinProlog and binarization

**BinProlog**, developed by Paul Tarau in the early 1990s, is built on the
observation that if every clause is transformed into "binary form" — a form
in which every clause body contains exactly one goal, with continuations
threaded as explicit extra arguments — then the WAM's environment stack
becomes unnecessary. The only runtime data structure you need is the heap
(for terms) and the trail (for backtracking). Choice points can live on
the heap too.

This is known as *continuation passing style for Prolog*. In binarized form,
`append([], L, L)` becomes `append([], L, L, Cont) :- call(Cont)` and
`append([H|T], L, [H|R]) :- append(T, L, R)` becomes
`append([H|T], L, [H|R], Cont) :- append(T, L, R, Cont)`. Every clause now
has exactly one body goal (not counting `call(Cont)`), so no environment
frame needs to be saved.

BinProlog was reputed to run some benchmarks faster than DEC-10 Prolog on
1990s hardware, largely because of drastically reduced stack traffic.
BinProlog also made **Linda**-style tuple spaces a core feature and was one
of the first Prologs with native support for multithreading and distributed
computing.

Later, Tarau distilled the ideas from BinProlog into **LogicBlox**-adjacent
systems and eventually into the **Styla** and **HiLog** descendants.

### 2.2 ZIP

**ZIP** was an older abstract machine by **Peter Kacsuk** and colleagues,
targeting a reduced WAM tuned for custom silicon. Historically interesting
but not widely used outside the Hungarian Prolog research community.

### 2.3 Vienna Abstract Machine (VAM)

**VAM**, developed at the Technical University of Vienna under Andreas Krall
in the late 1980s and early 1990s, is the most interesting serious
competitor to the WAM. The VAM's central innovation was *two-stream
unification*: instead of compiling separate code for the caller (put
instructions) and the callee (get instructions), the compiler emits a single
stream of paired instructions that operate on two argument streams
simultaneously. This allows the compiler to detect cases where both sides
are known constants at compile time and generate a direct jump, eliminating
the unification step entirely for many calls.

On benchmarks from the early 1990s VAM outperformed the WAM by around 2x on
mostly-deterministic code. The major downside was that VAM required
significantly more sophisticated compile-time analysis and was harder to
implement incrementally. VAM techniques influenced later high-performance
Prologs, notably **Aquarius Prolog** (Van Roy, Berkeley) and indirectly
**Mercury** (Melbourne).

### 2.4 Other research machines

- **CIAO's WAM-like machine** adds support for modes and assertions.
- **XSB's SLG-WAM** adds tabling suspensions and a trail of suspended
  derivations.
- **YAP's pure-WAM descendant** targets aggressive inlining.
- **Mercury's HLDS and LLDS** are not strictly WAM-derived; Mercury is a
  compiled, mode-typed descendant of Prolog that abandons backtracking as
  the default, which frees its backend from most of the WAM's complexity.

The history thread covers the lineage. For our purposes the takeaway is:
when you download a mainstream Prolog today, you are running some variant
of the 1983 Warren design, usually with tabling extensions if the system
supports them.

---

## 3. SWI-Prolog

**SWI-Prolog** is the most widely used Prolog implementation in the world as
of 2026. It is free, actively developed, well-documented, and has the largest
library ecosystem of any Prolog. If you are starting a new project today and
have no specific commercial or research reason to pick another system, SWI is
the default answer.

### 3.1 Origin and maintainer

SWI-Prolog was started by **Jan Wielemaker** at SWI (Sociaal-Wetenschappelijke
Informatica, the Social Science Informatics group) at the University of
Amsterdam in **1987**. Wielemaker originally built it as a tool to support
the department's research on knowledge representation and natural-language
interfaces, but it quickly outgrew that role.

Wielemaker has been the principal maintainer for **nearly forty years**. This
is an astonishing feat of stewardship; very few production language
implementations have had this kind of single-hand continuity. He is based at
the VU University Amsterdam and more recently at CWI. The core team has
gradually expanded, with significant contributions from Matt Lilley, Markus
Triska (though Triska maintains his own implementation now — see Scryer
Prolog below), Keri Harris, Torbjörn Lager, and many others.

### 3.2 License

**BSD-2-Clause** (since the relicensing around 2015; earlier versions were
LGPL). The permissive license is part of why SWI has become the standard
teaching and research Prolog — no concerns about embedding it in student
projects or commercial research platforms.

### 3.3 Features

SWI-Prolog's feature set goes far beyond ISO Prolog. Highlights:

- **Unicode throughout.** Source files, atoms, and I/O streams are all
  UTF-8 native. Atoms can contain any Unicode codepoint.
- **Constraint libraries**: `library(clpfd)`, `library(clpq)`,
  `library(clpr)`, `library(clpb)`, `library(chr)` (Constraint Handling
  Rules). The CLP(FD) library is by Markus Triska and is considered one of
  the best finite-domain solvers in any language.
- **HTTP server and client**. SWI-Prolog has a production-grade embedded
  HTTP server with support for HTTPS, WebSocket, authentication, and
  session management. It is used to run the SWI website itself as well as
  several significant research portals.
- **Pengines** (Prolog Engines). An HTTP-based remote-procedure mechanism
  for running Prolog queries on a server from a client. Pengines
  underpin SWISH and have been used for collaborative logic programming.
- **Semantic web**: `library(semweb)` provides full RDF, RDFS, and OWL
  support with in-memory triple stores capable of handling hundreds of
  millions of triples on a single machine.
- **Tabling**. As of 8.x, SWI includes well-founded-semantics tabling
  comparable to XSB. Predicates can be declared `:- table p/2.` and the
  engine memoizes results across calls with automatic dependency tracking.
- **Multi-threading**. Full OS-thread support with per-thread Prolog stacks,
  message queues, and mutexes. Shared dynamic predicates use
  reader/writer locks.
- **Foreign interface**. A clean C API with automatic conversion between
  C types and Prolog terms.
- **Incremental compilation**. `make/0` reloads changed files without
  restarting the REPL.
- **Persistent databases**: `library(persistency)` for journaled
  append-only databases.
- **Constraint Handling Rules (CHR)**. Thom Frühwirth's CHR is a first-class
  feature in SWI.

### 3.4 Tools shipped with SWI

- **swipl** — the command-line REPL.
- **PceEmacs** — a built-in structured editor written in XPCE (SWI's native
  GUI toolkit). Less common these days; most users edit in VS Code or
  Emacs with ediprolog.
- **ProDT** — an older Eclipse-based IDE, essentially abandoned now but
  historically important.
- **SWISH** — **SWI-Prolog for SHaring**, a web notebook. Users point a
  browser at a SWISH server, write Prolog in the browser, and queries run
  on the server through Pengines. SWISH was developed by Jan Wielemaker
  and Torbjörn Lager and is the single most important contribution to
  Prolog teaching of the last decade. https://swish.swi-prolog.org hosts a
  public instance.
- **pldoc** — integrated documentation system. Comments with the `%!`
  prefix become API documentation rendered in the browser-based doc
  server.
- **Graphical debugger** — based on XPCE, with a step-through Byrd-box
  interface.

### 3.5 Pack manager

SWI's **pack manager** is a simple, centralized system for publishing and
installing community libraries. Packs are hosted on https://www.swi-prolog.org/pack/list
and installed from the REPL:

```prolog
?- pack_install(clpBNR).
```

A pack is a directory with a `pack.pl` metadata file declaring dependencies,
versions, and author information. The pack manager handles recursive
installation and can build foreign libraries on install.

Pack quality varies enormously — some packs are production-grade
(`clpBNR`, `real` for R integration, `tabling_improvements`) and some are
abandoned student projects. There is no automated quality signal beyond
download counts, which is a genuine pain point (see §23).

### 3.6 Target audience

Wielemaker himself describes SWI's target as **"research and teaching with
a focus on practical use."** In practice the user base splits roughly into:

- Academic researchers in knowledge representation, NLP, program analysis,
  and logic programming theory.
- Teachers of Prolog courses (undergraduate AI, declarative programming).
- Commercial users building rule engines, business rules, configuration
  engines, and semantic web applications.
- Hobbyists and puzzle-solvers (Advent of Code, Project Euler).

### 3.7 Version and homepage

- Homepage: **https://www.swi-prolog.org/**
- Current stable branch as of early 2026: **SWI-Prolog 9.2.x**. Development
  branch 9.3.x.
- Source: https://github.com/SWI-Prolog/swipl-devel
- Docs: https://www.swi-prolog.org/pldoc/doc_for?object=manual

---

## 4. SICStus Prolog

**SICStus Prolog** is the commercial gold standard and the implementation
most often deployed in serious industrial settings where the customer is
willing to pay for support.

### 4.1 Origin and maintainer

SICStus was started at the **Swedish Institute of Computer Science (SICS)**
in **1985** by **Mats Carlsson** and team. The name stands for
*SICS Stockholm Prolog*. SICS was reorganized in the late 2010s into what is
now **RISE Research Institutes of Sweden**, and SICStus continues to be
developed by a small commercial team at RISE.

Mats Carlsson is personally responsible for a remarkable amount of the
implementation, particularly the constraint solvers. Other historically
significant contributors include Seif Haridi, Jesper Wilhelmsson, and Per
Mildner.

### 4.2 License

**Commercial.** SICStus is not free, and the license fees are significant
(roughly in the thousands-of-euros-per-seat range for commercial use with
discounts for academic use). A free evaluation license is available. This
pricing has not changed meaningfully in twenty years and reflects the
economics of a niche high-reliability language implementation with a
relatively small paying customer base.

### 4.3 Features

SICStus is famous for the *quality* of its implementation rather than a
flashy feature list. Specific strengths:

- **CLP(FD)**. SICStus's finite-domain solver is the one against which all
  others are measured. It implements arc consistency, bounds consistency,
  global constraints (`all_different`, `cumulative`, `circuit`,
  `disjoint2`, `element`, `serialized`, etc.), and supports labelings with
  various heuristics. The underlying propagation engine is deterministic
  and highly tuned.
- **CLP(Q,R)**. Rational and real constraint solvers based on simplex,
  originally from Christian Holzbaur.
- **CLP(B)**. Boolean constraint solver using binary decision diagrams.
- **CHR** (Constraint Handling Rules). A core library.
- **Muse**. Historically, SICS developed **Muse**, an or-parallel version
  of the SICStus engine targeting shared-memory multiprocessors. Muse
  became part of the research prototype branches and influenced later
  parallel Prolog work (Aurora, the other or-parallel system, came from
  Argonne National Lab in partnership with SICS).
- **Compact WAM**. SICStus's WAM implementation is notoriously tight; the
  runtime is small and fast and has been ported to an unusual variety of
  platforms including mainframes and embedded systems.
- **Jasper** — the Java interface.
- **Mutable arrays** (`library(assoc)`, `library(atts)`) and attributed
  variables — the attribute mechanism underneath CLP is a first-class
  library that user code can use.

### 4.4 Industrial users

SICStus has a reputation for being used in places where being wrong costs
money or lives:

- **Aviation**. Airline scheduling, crew rostering, gate assignment. SICS
  and later vendors built SICStus-based optimization systems for several
  European and Asian airlines.
- **Logistics and supply chain**. Delivery routing, warehouse planning.
- **Factory scheduling**. Job-shop and flow-shop problems using CLP(FD).
- **Telecommunications**. Network configuration, fault diagnosis.
- **Finance**. A handful of quantitative shops use SICStus for rule
  engines and compliance checking.
- **Defense and aerospace** (reportedly). Hard to pin down exact names
  because the contracts are under NDA, but SICStus appears in procurement
  documents.

The commercial-support angle matters here. When SICStus tells a customer
"this CLP(FD) constraint is correct," there is a commercial entity standing
behind that claim, which is exactly what you want when you are scheduling
an airline.

### 4.5 Version and homepage

- Homepage: **https://sicstus.sics.se/**
- Current version as of 2026: **SICStus 4.9.x**.
- Documentation is extensive and well-maintained; the manual is regarded
  as one of the best Prolog manuals ever written.

---

## 5. GNU Prolog

**GNU Prolog** is the quirky, beloved native compiler in the family.

### 5.1 Origin and maintainer

GNU Prolog was created by **Daniel Diaz** (then at INRIA, later at
Université Paris 1 Panthéon-Sorbonne), with significant contributions from
**Philippe Codognet**. Development started in the early 1990s as `wamcc`,
a Prolog-to-C compiler, and evolved into the full GNU Prolog system first
released around 1999.

### 5.2 License

**GNU LGPL** (library) and **GPL** (compiler). As an official GNU project,
GNU Prolog is one of the few Prolog implementations with FSF endorsement.

### 5.3 The native-compilation trick

GNU Prolog's defining feature is that it compiles Prolog programs to
**native executables** via C. The pipeline is:

1. Prolog source → WAM-like intermediate code (Diaz's variant).
2. WAM code → C (using a carefully-tuned code generator).
3. C → object file → statically linked executable with the GNU Prolog
   runtime library.

This produces single-file executables that can be deployed without a Prolog
installation on the target machine — an unusual property for a Prolog.
Startup time is essentially zero and binaries are small enough to live in
embedded contexts.

The native compilation approach has downsides too. Meta-predicates,
`assert/retract` on static predicates, and some ISO features interact
awkwardly with whole-program compilation. GNU Prolog's runtime performance
on purely deterministic code is competitive with the fastest interpreted
Prologs, but for code that heavily uses dynamic predicates or runtime
meta-programming, SWI and YAP often win.

### 5.4 Built-in CLP(FD)

Like its commercial cousins, GNU Prolog ships with an integrated CLP(FD)
library. Diaz's CLP(FD) is compact and fast, with propagators written
directly in C for performance. It does not have quite the breadth of
global constraints that SICStus provides, but for the problems it covers
it is very competitive.

### 5.5 ISO compliance

GNU Prolog is a strict ISO Prolog (Core, Part 1) implementation. It is one
of the systems that Markus Triska's ISO-purist community recommends for
teaching because it does not drift as far from the standard as SWI does.

### 5.6 Version and homepage

- Homepage: **http://www.gprolog.org/**
- Current version: **GNU Prolog 1.5.0** (the release cadence is slow —
  multi-year gaps between versions are normal).
- Source: http://www.gprolog.org/#download

---

## 6. YAP Prolog

**YAP** (Yet Another Prolog) is the performance-focused academic Prolog.

### 6.1 Origin and maintainer

YAP was started at the **Universidade do Porto** (Portugal) in the late
1980s, with **Vítor Santos Costa** as the long-time principal architect
and maintainer. Other significant contributors include Ricardo Rocha (who
did much of the tabling work) and Fernando Silva.

### 6.2 License

**LGPL** / **Perl Artistic License** dual.

### 6.3 Performance focus

YAP's design goal has always been raw speed, particularly on inductive
logic programming (ILP) workloads where the same predicates are called
millions of times. YAP achieves this through aggressive WAM specialization,
good indexing, and a long history of benchmarking-driven optimization.

On classic Prolog benchmarks (nrev, zebra, chat_parser) YAP is often
fastest or tied for fastest among open-source Prologs. The community has
good benchmark comparisons published periodically at the International
Conference on Logic Programming (ICLP).

### 6.4 Tabling

YAP has a sophisticated tabling implementation based on **SLG resolution**,
developed primarily by Ricardo Rocha's group. Tabling in YAP is a research
vehicle as well as a production feature — many papers on tabling
implementation techniques (e.g., batched scheduling vs local scheduling,
answer subsumption) were developed on YAP.

### 6.5 ProbLog and ILP

YAP is the preferred backend for several higher-level systems:

- **ProbLog** (probabilistic logic programming), developed at KU Leuven by
  the Luc De Raedt group, is built on top of YAP and uses YAP's tabling
  plus forward-chaining extensions.
- **Aleph** (the ILP system) and its descendants run well on YAP.
- **CPLint** (probabilistic logic programming with CLP) uses YAP's
  tabling.

### 6.6 Version and homepage

- Homepage: **https://github.com/vscosta/yap**
- Current version: YAP 7.x (development has slowed since Santos Costa
  moved on to other projects, but the code is still used and maintained).

---

## 7. XSB Prolog

**XSB** is the tabling pioneer and one of the most academically important
Prolog systems ever built.

### 7.1 Origin and maintainer

XSB comes from the research group of **David S. Warren** at **Stony Brook
University** (SUNY Stony Brook). *Important:* David S. Warren is a
different person from **David H. D. Warren**, the creator of the WAM. The
two Warrens are jokingly known in the logic programming community as "the
other Warren" depending on whom you're talking to. David S. Warren's
collaborators include Konstantinos Sagonas, Terrance Swift, and Theresa
Swift (the Swifts are two different people, both pivotal to XSB).

### 7.2 License

**LGPL**.

### 7.3 The tabling pioneer

XSB was the first Prolog implementation to build **SLG resolution
(tabling)** as a first-class feature, starting in the early 1990s. Tabling
is covered more fully in the applications thread (Datalog, deductive
databases), but briefly: tabling memoizes the answers to calls, so the
same call made twice only computes once, and left-recursive rules that
would loop under SLD resolution terminate correctly under SLG.

XSB supports:

- **Well-founded semantics** with `undefined` truth value, not just
  two-valued logic.
- **Call-variance tabling** (default) and **call-subsumption tabling**.
- **Answer subsumption** for lattice-domain computations (e.g., shortest
  path).
- **Incremental tabling**. When a fact changes, only affected tables are
  recomputed.

### 7.4 HiLog

XSB implements **HiLog**, a higher-order extension of Prolog designed by
Weidong Chen and David S. Warren. HiLog lets predicate names be variables,
enabling meta-programming over predicates without giving up first-order
semantics. The canonical example:

```prolog
?- call(X, a, b), X = likes.
```

In HiLog this is a legitimate query where `X` can be unified with a
predicate symbol. Under the hood HiLog is implemented by encoding
higher-order atoms as first-order terms with a special `apply` predicate,
but the surface syntax is seamless.

### 7.5 Deductive database heritage

XSB has been used extensively for:

- **Deductive databases**. The **XSB DB** system and XSB's integration
  with ODBC make it a practical way to run Datalog queries against
  relational databases.
- **Model checking**. Several verification tools are built on XSB's
  tabling, exploiting the fact that well-founded tabled Prolog is
  effectively a fixpoint engine.
- **Natural language processing**. Tabled parsers avoid exponential
  blowup on ambiguous grammars.

### 7.6 Version and homepage

- Homepage: **https://xsb.sourceforge.net/**
- Current version: XSB 5.0.x.
- Source: https://sourceforge.net/projects/xsb/

---

## 8. Ciao Prolog

**Ciao** is the multi-paradigm, assertion-based Prolog from Madrid.

### 8.1 Origin and maintainer

Ciao was developed by **Manuel Hermenegildo**'s group at the Technical
University of Madrid (UPM), now continuing at **IMDEA Software Institute**.
Hermenegildo is a prolific logic programming researcher whose work on
parallel Prolog (the &-Prolog system) led directly to Ciao.

### 8.2 License

**LGPL** (core) with some BSD-licensed libraries.

### 8.3 Multi-paradigm philosophy

Ciao's philosophy is that Prolog can be a host language for many styles
of programming, and the user should be able to mix them freely within a
module system. Ciao supports, with different modules or compilation
flags:

- Pure Prolog
- ISO Prolog
- Constraint programming (CLP(FD), CLP(Q), CLP(R))
- Functional programming (via `library(fsyntax)`)
- Higher-order programming
- Object-oriented programming (via `library(objects)`)
- Assertion-based contract programming
- Partial evaluation

### 8.4 Assertions and CiaoPP

Ciao's defining feature is its **assertion language**, which lets
programmers annotate predicates with types, modes, cost, determinism, and
more. A typical assertion:

```prolog
:- pred append(A, B, C) : (list(A), list(B), var(C))
                       => list(C)
                       + (not_fails, is_det).
```

This says: `append` called with A and B as lists and C unbound produces C
as a list, does not fail, and is deterministic. **CiaoPP**, the Ciao
preprocessor, can **verify or assume** these assertions using a suite of
abstract interpretation analyses. If CiaoPP cannot prove an assertion it
can insert runtime checks, fall back to dynamic verification, or produce
a warning.

CiaoPP is remarkable because it brings production-quality static analysis
to a dynamic language. The same framework does type inference,
mode inference, cost analysis, termination analysis, and non-failure
analysis. Hermenegildo's group has published extensively on CiaoPP's
theoretical foundations (abstract interpretation for logic programs) and
its practical applications.

### 8.5 Version and homepage

- Homepage: **https://ciao-lang.org/**
- Current version: Ciao 1.22.x.
- Source: https://github.com/ciao-lang/ciao

---

## 9. ECLiPSe

**ECLiPSe** (with the capitalization and everything) is the constraint
logic programming platform. Not to be confused with the Eclipse IDE.

### 9.1 Origin and maintainer

ECLiPSe was developed at **ECRC** (European Computer-Industry Research
Centre) in Munich from the late 1980s, and later at **IC-Parc** (Imperial
College Parallel Computing Centre) in London. It was open-sourced in 2006
under the **Cisco-owned Mozilla-MPL variant** license and is now maintained
by a community centered on Joachim Schimpf and Kish Shen.

### 9.2 License

**Cisco-Style Mozilla Public License** (MPL variant).

### 9.3 Constraint programming platform

ECLiPSe's tag line is "a software system for the cost-effective development
and deployment of constraint programming applications." Its distinctive
features:

- **Multiple constraint solvers** that can be combined: CLP(FD), CLP(Q),
  CLP(R), interval arithmetic (IC), symbolic constraint programming (SD),
  generalized propagation, and hybrid finite-domain/LP solvers.
- **Column generation** and **branch-and-price** for large-scale
  optimization. ECLiPSe has been used for problems that don't fit in
  pure CP or pure LP, specifically the hybrid ones where you need both.
- **External solver interfaces** to CPLEX, Gurobi, XPRESS-MP, OSI, and
  GLPK.
- **Repair** library for local search integrated with backtracking search.
- **TkECLiPSe** — the graphical development environment.

### 9.4 Industrial heritage

ECLiPSe came out of European industrial research (British Telecom, Cisco,
Parc Technologies) and its core use case has always been large-scale
combinatorial optimization. It has been used in:

- Telecommunications network design.
- Railway scheduling.
- Port logistics.
- Supply-chain optimization.

### 9.5 Version and homepage

- Homepage: **https://eclipseclp.org/**
- Current version: ECLiPSe 7.x.

---

## 10. B-Prolog and Picat

**B-Prolog** and its descendant **Picat** are the work of **Neng-Fa Zhou**
at Brooklyn College (CUNY).

### 10.1 B-Prolog

B-Prolog started in 1993 as an implementation with a strong tabling story
and a distinctive feature called **action rules** — a declarative way to
express event-driven computation (propagators, delayed goals, agents). The
implementation was built around the **TOAM** (Tree-Oriented Abstract
Machine), Zhou's WAM variant optimized for tabling and matching.

For about fifteen years B-Prolog was one of the fastest Prologs on
constraint-programming benchmarks, consistently placing well in the
**MiniZinc Challenge** (an annual constraint-solver competition) when
used as a MiniZinc backend.

License: the core was free for non-commercial use with a commercial
license available. B-Prolog is no longer actively developed.

### 10.2 Picat

Around 2014 Zhou redesigned the surface language while keeping much of
the B-Prolog runtime and released **Picat**. Picat is technically not a
Prolog — the surface syntax and evaluation model are different — but it
is a close enough relative, and most of the implementation technology
carries over, that the Prolog community considers it a member of the
family.

Picat's distinctive features:

- **Pattern-matching functions**, not just predicates. You can write
  functions that look like ML or Haskell pattern matching, alongside
  predicates that look like Prolog.
- **List comprehensions** and array comprehensions.
- **Loops** (`foreach`, `while`) as first-class control structures, in
  addition to recursion.
- **Tabling** is deeply integrated.
- **Constraint solving** across CP, SAT, MIP, and SMT backends. A Picat
  program can ship to any of these solvers with a single directive
  change.
- **Planning**. Picat has a built-in planning library that uses tabling
  to implement best-first search. This makes Picat genuinely good at
  the IPC planning benchmarks.

Picat has been successful in the **Google Code Jam**, **Advent of Code**,
and similar puzzle competitions where the combination of pattern matching
and constraint solving is a force multiplier.

### 10.3 Version and homepage

- B-Prolog: **http://www.picat-lang.org/bprolog/**
- Picat: **http://www.picat-lang.org/**
- Current version: Picat 3.x.

---

## 11. Scryer Prolog

**Scryer Prolog** is the youngest major implementation and the standard-
bearer for the "strict ISO + purity + correctness" school.

### 11.1 Origin and maintainer

Scryer was started around 2018 by **Mark Thom** as a hobby project and
has grown into a serious implementation. Thom is joined by **Markus
Triska**, **Adrián Arroyo Calle**, and others. Triska's involvement is
notable because he is the author of *The Power of Prolog* (the best
free online Prolog textbook) and a long-time advocate for strict ISO
Prolog and "pure" coding style.

### 11.2 License

**BSD-3-Clause**.

### 11.3 Rust implementation

Scryer is written in **Rust**. It is the first notable Prolog
implementation in a memory-safe systems language. The use of Rust
provides a few practical advantages:

- Stack safety and memory safety by default.
- Good concurrency primitives, though Scryer is still a single-threaded
  engine today.
- Excellent cross-platform story: Scryer builds on Linux, macOS, Windows,
  and (crucially) can target WebAssembly.
- Modern build tooling (cargo) rather than the traditional Prolog
  autotools dance.

The WAM implementation inside Scryer is a conventional descendant of the
1983 Warren design, with some Triska-flavored modifications around
indexing and clean semantics for built-ins.

### 11.4 Strict ISO and "correctness school"

Scryer is designed to be as close to ISO/IEC 13211-1 as possible. Where
SWI-Prolog provides a large set of "convenient" extensions that diverge
from the standard, Scryer aims to implement only what is in the standard
plus a careful selection of widely-agreed-upon extensions. This is a
deliberate choice aligned with Triska's public writing about Prolog
purity, and the benefit is that Scryer programs are uniformly portable
among strictly-conforming implementations.

Examples of Scryer's purity bias:

- **`clpz` (CLP over integers)** is the default finite-domain solver,
  not `clpfd`. `clpz` is Triska's pure-ISO-compliant reimplementation
  that does not silently truncate to machine integers the way some
  `clpfd` implementations do.
- **`library(tabling)`** follows well-founded semantics carefully.
- **Pure, side-effect-free predicates** are encouraged by the
  documentation and community style guides.
- **No `write/1` by default** — even basic I/O goes through the ISO
  `portray_clause/1` or explicit `format/2` with quoted output.

### 11.5 Unique appeal

Scryer has a small but intensely loyal user base, especially among:

- Prolog teachers who want to teach "proper" Prolog without the
  distractions of SWI's extra features.
- Puzzle solvers who appreciate `clpz` correctness.
- Rust programmers curious about logic programming.
- Embedded systems developers who want a Prolog that can cross-compile
  cleanly.

### 11.6 Version and homepage

- Homepage: **https://www.scryer.pl/**
- Source: https://github.com/mthom/scryer-prolog
- Current version: Scryer 0.9.x as of early 2026.

---

## 12. Trealla Prolog

**Trealla Prolog** is the other modern, minimalist, portable Prolog.

### 12.1 Origin and maintainer

Trealla Prolog is developed by **Andrew Davison** (sometimes using the
handle infradig). Development started around 2019 and has been steady
since, with a growing community of contributors.

### 12.2 License

**MIT**.

### 12.3 C implementation with a modern twist

Trealla is written in **C** (not Rust), with a small, readable codebase
(tens of thousands of lines — small by language-implementation standards).
The compact codebase is deliberate: Trealla aims to be a "readable
reference Prolog" that someone can fully understand in a weekend of
reading.

Performance is surprisingly good. On several classic benchmarks Trealla
is within 2x of SWI-Prolog, occasionally faster, and starts up in
milliseconds.

### 12.4 WASM story

Because it's plain C with no unusual build requirements, Trealla builds
cleanly to **WebAssembly** via Emscripten. This has made it popular for
browser-embedded Prolog use cases where Tau Prolog (§13) would otherwise
be the only option.

### 12.5 ISO compliance and extensions

Trealla targets ISO compliance first and then adds a careful set of
extensions. It includes `library(clpfd)`, attributed variables, DCGs,
tabling (partial), HTTP client, JSON, and a small standard library
modeled on SWI's for familiarity.

### 12.6 Version and homepage

- Homepage: **https://trealla-prolog.github.io/trealla/**
- Source: https://github.com/trealla-prolog/trealla
- Current version: 2.x.

---

## 13. Tau Prolog

**Tau Prolog** is Prolog in JavaScript, for the browser.

### 13.1 Origin and maintainer

Tau Prolog was created by **José Antonio Riaza Valverde** around 2017.

### 13.2 License

**BSD-3-Clause**.

### 13.3 Browser-native Prolog

Tau is a pure JavaScript implementation of Prolog. That means you can
drop it into any web page with a `<script>` tag and run Prolog queries
from JavaScript code. No WebAssembly, no server, no Node.js required.

```html
<script src="https://unpkg.com/tau-prolog/modules/core.js"></script>
<script>
  var session = pl.create();
  session.consult("likes(foxy, code). likes(foxy, moon).", {
    success: function() {
      session.query("likes(foxy, X).", {
        success: function() {
          session.answer(function(answer) {
            console.log(pl.format_answer(answer));
          });
        }
      });
    }
  });
</script>
```

The implementation is interpreter-based (no WAM compilation), which is
slow compared to WAM-based systems but perfectly adequate for
educational use, in-browser demos, and rule engines embedded in web
apps.

### 13.4 Use cases

- Teaching Prolog online (particularly for students without any local
  install).
- Interactive Prolog tutorials embedded in web pages.
- Rule engines in static websites or single-page applications.
- JavaScript games that want declarative AI behavior.

### 13.5 Version and homepage

- Homepage: **http://tau-prolog.org/**
- Source: https://github.com/tau-prolog/tau-prolog

---

## 14. Logtalk

**Logtalk** is not a Prolog, but a **language that runs on top of Prolog**.
It is the most important piece of meta-infrastructure in the Prolog
ecosystem.

### 14.1 Origin and maintainer

Logtalk was created by **Paulo Moura** in **1998** and has been
continuously developed since. Moura, based in Portugal, remains the sole
principal developer and has put an extraordinary amount of work into
making Logtalk portable, well-documented, and stable.

### 14.2 License

**Apache 2.0** (since 2013; earlier versions were Artistic License).

### 14.3 Object-oriented layer

Logtalk adds **objects, protocols, categories, and parametric entities**
to Prolog. A Logtalk program looks like:

```logtalk
:- object(list).

    :- public(member/2).
    member(Element, [Element| _]).
    member(Element, [_| Tail]) :-
        member(Element, Tail).

:- end_object.
```

Objects are closed first-class entities. Protocols are like interfaces
in Java. Categories are like mixins or traits. Parametric objects take
parameters at object-creation time and behave like generics. Events
allow Logtalk to implement aspect-oriented programming.

### 14.4 Multi-backend portability

Logtalk is not tied to one Prolog. It runs on **SWI-Prolog, SICStus,
YAP, GNU Prolog, ECLiPSe, B-Prolog, XSB, Ciao, Trealla, Scryer,
LVM, JIProlog, Lean Prolog, Qu-Prolog, Quintus, CxProlog, Tau Prolog**
and more. This is achieved through an elaborate portability layer that
isolates backend-specific code in adapter files. The payoff is that a
Logtalk program can be deployed on any of the supported Prologs — a kind
of "write once, run on your employer's chosen Prolog" guarantee that pure
Prolog does not provide.

### 14.5 Tooling

Logtalk ships with its own tooling: a reflection API, documentation
generator (`lgtdoc`), code coverage tool, unit testing framework
(`lgtunit`), debugger integration, and dead-code detector. These tools
often fill gaps that the underlying Prolog does not.

### 14.6 Version and homepage

- Homepage: **https://logtalk.org/**
- Source: https://github.com/LogtalkDotOrg/logtalk3
- Current version: Logtalk 3.x.

---

## 15. Historical and legacy implementations

Several Prolog systems have faded from active use but are worth knowing
about, both as historical milestones and because their descendants power
the modern landscape.

### 15.1 DEC-10 Prolog

The original Warren compiler, Edinburgh, 1977. Compiled Prolog programs
for the DEC PDP-10. This is where "Edinburgh syntax" — the clause-based,
comma-and-semicolon Prolog syntax we still use — was codified. Features
that originated in DEC-10 Prolog and survived:

- Clause-based syntax with `:-`.
- The `assert/retract` pair.
- The `consult/1` built-in for loading files.
- First-argument indexing as a compiler strategy.

DEC-10 Prolog influenced the first commercial Prologs directly: Quintus
(see below) was founded by several DEC-10 Prolog veterans.

### 15.2 C-Prolog

**C-Prolog**, developed by Fernando Pereira at Edinburgh in the early
1980s, was the portable successor to DEC-10 Prolog. As the name suggests,
it was written in C, which made it trivially portable to the new wave of
Unix workstations. C-Prolog was the first Prolog most Unix users met, and
its manual — the famous "C-Prolog User's Manual" — was the de facto Prolog
reference for much of the 1980s.

### 15.3 Quintus Prolog

**Quintus Prolog** (1984) was the first serious commercial Prolog. The
founders included **William Kornfeld**, **David H. D. Warren**, **Lawrence
Byrd**, **Fernando Pereira**, **David Bowen** — an all-star cast of
Edinburgh and SRI veterans. Quintus was built around a high-performance
WAM compiler and targeted industrial customers who wanted support and
stability.

Quintus was eventually acquired by **Intellicorp**, then by **Computing
Research Labs**, and finally by **Swedish Institute of Computer Science
(SICS)** in the late 1990s. The Quintus codebase merged into the
SICStus line, which is why SICStus inherited both Quintus's performance
reputation and many of its APIs (the famous Quintus `library/2` system,
for example, shows through in SICStus).

### 15.4 BIM Prolog

**BIM Prolog** (Belgian Institute of Management, later just "BIM") was a
commercial European Prolog from the late 1980s, developed primarily by
Alain Callebaut and colleagues in Belgium. BIM was unusual for having a
native-code compiler years before other commercial Prologs did, and for
its focus on real-time and embedded applications. The company eventually
shut down and the code was not released.

### 15.5 IF/Prolog

**IF/Prolog** was a German commercial Prolog, developed by **IF
Computer** (later Siemens). ISO-compliant, with a focus on business
applications. Still exists as a commercial product, though its market
share is minuscule compared to SICStus.

### 15.6 LPA Prolog

**Logic Programming Associates (LPA)** is a London-based company that has
sold commercial Prolog products since the mid-1980s, most famously
**LPA MacProlog** (Macintosh), **LPA Prolog Professional** (DOS and later
Windows), and **WIN-PROLOG**. LPA Prologs were especially popular in
expert system development — the company bundled expert-system shells
like Flint and Flex on top of their Prolog core. LPA's Prolog is still
sold, targeting Windows customers in banking and compliance.

### 15.7 ALS Prolog

**Applied Logic Systems (ALS) Prolog** was an American commercial Prolog
that ran on many Unix workstations and on IBM mainframes (yes,
mainframes). ALS Prolog had a reputation for reliability and was used in
government and financial-services contexts. The company eventually
transitioned out of Prolog development.

### 15.8 Borland Turbo Prolog

**Turbo Prolog**, released by **Borland** in 1986, deserves its own
paragraph because it is the reason many mid-1980s hobbyists even know
what Prolog is. Turbo Prolog was an affordable (~$100) Prolog for DOS,
with a smooth IDE in the Turbo Pascal style, native compilation, and
a surprisingly capable WAM-like backend. It was developed by
**Prolog Development Center (PDC)** in Denmark and licensed to Borland.

The catch: Turbo Prolog used a **typed, strict subset** of Prolog that
was significantly different from DEC-10/Edinburgh Prolog. Variables were
typed, the module system was unusual, and some standard Prolog idioms
simply did not work. This made Turbo Prolog inaccessible to students
coming from Clocksin & Mellish and arguably held back Prolog adoption
in the US because "the Prolog most people tried" wasn't really standard
Prolog.

After Borland stopped selling Turbo Prolog, PDC rebranded and continued
to sell it as **Visual Prolog**, which is still developed today
(http://www.visual-prolog.com/) as a strongly-typed object-oriented
Prolog descendant. Visual Prolog has a small but loyal following in
Eastern Europe.

### 15.9 Arity Prolog

**Arity Prolog** was a DOS-era commercial Prolog from Arity Corporation
(Concord, Massachusetts). It was used in some early expert systems and
is notable for having been the Prolog of choice for several pharmaceutical
and financial expert system projects in the late 1980s. Arity no longer
exists as a company.

### 15.10 Other honorable mentions

- **MU-Prolog / NU-Prolog** (Melbourne University, Lee Naish and Harald
  Søndergaard) — experimental Prologs with delay and mode systems that
  influenced Mercury.
- **ProLog by BIM** — see above.
- **Open Prolog** (Trinity College Dublin) — Macintosh Prolog.
- **JIProlog** (Java-only Prolog, commercial).
- **PrologCafe** (Prolog-to-Java compiler, Kyoto).
- **Prolog++** (a C++ variant).
- **Amzi! Prolog** (commercial embedded Prolog, US).
- **Strawberry Prolog** (Bulgarian, Turing-test focused).

---

## 16. Performance and compilation

### 16.1 Interpretation vs WAM compilation vs native compilation

Prolog implementations span the full spectrum from pure interpreter to
full native compilation:

- **Pure interpreter** (Tau Prolog, many teaching Prologs): walks the
  parse tree directly. Slow but simple; useful for correctness-focused
  or embeddable implementations.
- **Byte-code WAM** (SWI, YAP, Scryer, Trealla, XSB, SICStus): compiles
  clauses to WAM byte code, interpreted by a tight C/C++/Rust inner
  loop. This is by far the most common approach. Throughput is usually
  a few times slower than native C for the inner loop.
- **Native compilation** (GNU Prolog, Aquarius, Mercury if you squint):
  compiles WAM code (or higher-level Prolog) all the way to machine code.
  GNU Prolog compiles through C; Aquarius compiled directly. Mercury
  compiles from a typed/moded intermediate to C or LLVM.

The performance gap between "good byte-code WAM" and "native compilation"
has shrunk over time as byte-code interpreters have gotten better at
dispatching (threaded code, direct threading, indirect threading) and
CPUs have gotten better at branch prediction. On typical Prolog
workloads SWI is within 2x of GNU Prolog, and both are within 2-5x of
Mercury — a gap that would have been unthinkable in 1995.

### 16.2 Indexing

**First-argument indexing** is the single most important optimization in
any Prolog implementation. The compiler inspects the first argument of
each clause for a predicate and builds a dispatch structure (hash table,
tree, switch) so that a call to `p(SomeTerm, ...)` can jump directly to
the subset of clauses whose first-argument shape matches `SomeTerm`'s
top-level constructor (atom, integer, list, structure).

Without indexing, Prolog iterates through every clause of a predicate on
every call, which turns most predicates into linear-time searches.

Modern Prologs have pushed beyond first-argument indexing:

- **Multi-argument indexing**. SWI-Prolog, YAP, and SICStus all index on
  multiple arguments when the compiler can tell it's worthwhile. For
  example, if the first two arguments are always ground in calls to a
  given predicate, indexing on both produces tighter dispatch.
- **Just-In-Time Indexing (JITI)**. SWI-Prolog pioneered JITI: the first
  time a predicate is called with a particular argument pattern, the
  runtime builds an index on the fly based on the actual call pattern.
  Subsequent calls with similar patterns reuse the index. This adapts
  to runtime call patterns without requiring mode declarations from the
  programmer.
- **Deep indexing**. Some implementations index on subterms of structured
  arguments (e.g., the functor of a second-level term), not just the
  top-level constructor.

Good indexing can make the difference between a naive Prolog solution
running in milliseconds versus minutes for database-like workloads.

### 16.3 Tabling

**Tabling** (memoization of predicate calls) radically changes the
performance characteristics of certain classes of Prolog programs:

- **Left-recursive grammars** become tractable (because each nonterminal
  is computed once per input position).
- **Transitive closures** are computed in polynomial time instead of
  exponential.
- **Dynamic programming** can be written as a declarative recursion
  with memoization for free.

Tabling is implemented via **SLG resolution**, which generalizes SLD
(Prolog's standard resolution) with two new operations: *new subgoal*
(start computing) and *answer resolution* (reuse cached answers). The
textbook formulation is by David S. Warren, Weidong Chen, and Terrance
Swift in a series of papers from the mid-1990s.

Modern tabled Prologs (XSB, YAP, SWI) all support tabling with some
variant of well-founded semantics and incremental tabling. Tabling is
covered in much more depth in the applications thread where deductive
databases, ASP, and Datalog are discussed.

### 16.4 Mode declarations and determinism analysis

In the Mercury and Ciao traditions, programmers (or automatic analyses)
annotate predicates with **modes** — declarations that specify which
arguments are input and which are output at each call — and
**determinism** — whether the predicate is `det` (always exactly one
solution), `semidet` (at most one), `nondet` (any number), or `multi`
(one or more). With this information the compiler can:

- Eliminate choice points for `det` and `semidet` predicates.
- Generate tight specialized code paths for each mode.
- Detect programmer errors where a supposedly deterministic predicate
  actually has multiple solutions.

Mercury takes this to the extreme and requires mode and determinism for
every predicate, making it closer to a typed functional language than
traditional Prolog. Ciao's CiaoPP infers most mode/determinism
information automatically.

For traditional Prologs, directives like `:- set_prolog_flag(unknown,
error).` and `:- use_module(library(mode_check)).` provide some of the
same benefits without requiring wholesale rewriting.

### 16.5 Performance relative to other languages

Rough relative performance on compute-heavy benchmarks (single-threaded,
2026 hardware), ordered fastest to slowest. These are approximate and
workload-dependent:

- C, Rust, C++ (baseline, 1x)
- Mercury (1-2x slower than C on deterministic code)
- Common Lisp (SBCL) (1.5-3x)
- Java, C# (2-4x)
- **GNU Prolog** (3-6x)
- **YAP, SICStus** (3-7x)
- **SWI-Prolog** (4-10x)
- **Scryer, Trealla** (5-15x)
- **XSB** (5-15x, but wins by orders of magnitude on tabled workloads)
- Lua, Racket, ... (varies widely)
- Python (10-50x)
- Ruby (10-50x)
- **Tau Prolog** (20-100x, interpreted JS)

So a good Prolog is substantially faster than Python on pure computation
and within striking distance of Java or Go for inner loops. The caveat,
as always, is that Prolog's real speed is not raw compute but search:
problems that are awkward to express in Python often have a Prolog
solution that is actually faster because the search algorithm is more
appropriate.

---

## 17. Development tools

### 17.1 The Byrd box debugger model

The classic Prolog debugger is the **Byrd Box model**, introduced by
Lawrence Byrd in 1980 (*"Understanding the control flow of Prolog
programs"*). It models each goal invocation as a box with four ports:

- **Call** — entering the goal for the first time.
- **Exit** — goal succeeded.
- **Redo** — backtracking into the goal to find another solution.
- **Fail** — goal has no (more) solutions.

A Byrd box debugger shows the programmer each port event as execution
proceeds, optionally pausing at chosen ports. This model maps cleanly
onto Prolog's backtracking search and has been the standard interaction
metaphor for Prolog debuggers for forty-five years.

Nearly every Prolog implementation ships a Byrd box tracer. Commands
are standardized: `trace` turns on tracing, `debug` turns on spy-point
mode, `leash` controls which ports pause the user, `spy` / `nospy`
manage spy points.

### 17.2 Spy points and leashing

A **spy point** is a user-declared predicate-level breakpoint. When the
debugger is in `debug` mode (less verbose than `trace`), it only pauses
at ports for spied predicates. This is essential for programs with many
predicates — you want to stop at `compute_tax/3` but not at every list
cons along the way.

**Leashing** controls which ports actually prompt the user. The default
is usually `leash([call, redo, exit, fail])` (all four ports), but
reducing to `leash([call, fail])` cuts noise dramatically.

```prolog
?- trace.
?- spy(compute_tax/3).
?- leash([call, redo, exit]).
```

### 17.3 Profilers

Most production Prologs ship a profiler:

- **SWI-Prolog**: `profile/1` runs a goal with call-count profiling and
  produces a hot-spot report. Output includes `%CPU` and `%CALLS` per
  predicate. There is also coverage tooling via `library(test_cover)`.
- **SICStus**: `sicstus -O` produces runtime profiles; the GUI tools
  provide graphical call graphs.
- **YAP**: call counts and time-based profiling.
- **XSB**: `prof_on/0`, `prof_off/0`.

Profiling Prolog programs is a different experience from profiling
imperative code. The hot spots are often unification and backtracking,
not arithmetic, and the fix usually involves adding cuts, green-cut
indexing hints, or mode declarations.

### 17.4 Editors

**Emacs** has historically been the Prolog editor of choice. The
`prolog.el` mode provides syntax highlighting, indentation, and
clause-level navigation. **ediprolog**, by Markus Triska, is an Emacs
package that evaluates Prolog queries inside a buffer — you write a
`?- goal.` line, hit a keybinding, and the answers are inserted as a
comment right below. This is the most productive Prolog workflow in
existence once you are used to it, and it explains the continuing
popularity of Emacs in the Prolog community.

**VS Code** has several Prolog extensions of varying quality:

- **vscode-prolog** by Arthur Wang — provides syntax highlighting,
  linting (via SWI-Prolog), snippets, and basic debugging via the
  Debug Adapter Protocol. This is the most widely used Prolog VS
  Code extension.
- **SWI-Prolog VS Code extension** — more recent, tighter integration
  with SWI-specific features.
- **new-vsc-prolog** — community fork with additional features.

VS Code support for Prolog is still not as good as it is for mainstream
languages — there is no language server with full semantic analysis, and
refactoring support is minimal (see §23).

**PceEmacs** is SWI-Prolog's built-in XPCE-based editor. Historically
important but rarely used by new developers today.

**Vim** has `prolog.vim` syntax and a few community plugins; basic but
functional.

### 17.5 SWISH

**SWISH** (SWI-Prolog for SHaring) deserves a full description because
it has significantly changed how Prolog is taught and demonstrated.

SWISH is a browser-based Prolog notebook. Users visit a SWISH server
(there is a public instance at https://swish.swi-prolog.org/ and many
private ones at universities), write Prolog programs in a CodeMirror
editor, and run queries against those programs in a REPL pane. Results
are rendered with syntactic highlighting, and diagrams, charts, or
custom rendering hooks can be added per-program.

Key SWISH features:

- **Persistent programs** (URL-addressable). A program saved in SWISH
  gets a URL that you can share in a tweet, a forum post, a paper, or
  a lecture slide.
- **Collaborative editing**. Multiple users can edit the same program
  simultaneously (Google-Docs-style).
- **Pengines backend**. Queries run as Prolog Engines on the SWISH
  server, with sandboxing to prevent malicious code.
- **Notebooks**. Like Jupyter but for Prolog, with markdown cells and
  query cells mixed.
- **Rendering extensions**. Custom term renderers for chess boards,
  graphs, lists, and so on.

SWISH is the reason it is trivial to share a Prolog example in 2026.
The adoption of SWISH by textbook authors (Bratko's *Prolog Programming
for AI*, Triska's *Power of Prolog*, O'Keefe's *Craft of Prolog*) has
made Prolog much more accessible to new learners.

### 17.6 Documentation tools

- **pldoc / plDoc** (SWI). Structured comments with `%!` become HTML
  documentation, navigable through an embedded HTTP server. Supports
  mode declarations in the documentation syntax (`+`, `-`, `?`,
  `:`, `@`, `!`), cross-references, and code examples.

```prolog
%! append(?List1, ?List2, ?List3) is nondet.
%
%  Concatenate List1 and List2, yielding List3.
%  Example:
%    ?- append([a,b], [c,d], L).
%    L = [a,b,c,d].
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
```

- **lgtdoc** (Logtalk). Similar idea, extended to objects and protocols.
- **SICStus doc tools**. Part of the SICStus manual system.

---

## 18. Foreign interfaces

Every serious Prolog implementation has some way to call C. This is
usually the only way to integrate with system libraries, GPUs, or
performance-critical inner loops.

### 18.1 C/C++ interfaces

- **SWI-Prolog C interface**. A mature, documented C API with type-safe
  term conversion functions (`PL_get_atom`, `PL_put_integer`,
  `PL_unify_compound`, etc.). Foreign predicates are declared with
  `PL_register_foreign` and can be loaded from shared libraries
  (`.so`/`.dylib`/`.dll`). The C++ version is a thin header wrapper.
- **SICStus foreign interface**. Works at two levels: a high-level
  "interface file" approach (`foreign_resource/2` directives,
  auto-generated glue) and a low-level C API similar to SWI's.
- **GNU Prolog foreign interface**. Somewhat more limited because of
  native compilation — foreign functions must be known at link time.
- **YAP foreign interface**. Traditionally very similar to SWI's.
- **XSB foreign interface**. Uses the `cinterf` library.

### 18.2 Python

Python-Prolog integration is one of the most important practical topics
in the ecosystem.

- **PySwip**. The oldest and most widely-used Python library for
  calling SWI-Prolog. It wraps SWI's C API with ctypes and exposes a
  Python-level API for consulting files, running queries, and
  iterating over answers. Usage:

```python
from pyswip import Prolog
p = Prolog()
p.consult("family.pl")
for result in p.query("parent(X, Y)"):
    print(result["X"], result["Y"])
```

PySwip has traditionally had a few rough edges (thread safety,
installation on some platforms), but it remains the go-to for
quick Python + Prolog integration.

- **Janus**. A newer bidirectional Python-Prolog bridge developed by
  Theresa Swift (the XSB Swift), Jan Wielemaker, and Carl Andersen.
  Janus lets Python call Prolog *and* Prolog call Python, with
  automatic type conversion between Python objects and Prolog terms.
  Both XSB and SWI-Prolog support Janus natively as of their recent
  releases. Janus is the intended long-term successor to PySwip and
  is significantly more capable, supporting:

  - Calling NumPy, pandas, scikit-learn, PyTorch from Prolog.
  - Embedding Prolog in Python-based ML pipelines.
  - Bidirectional term-to-object conversion.

```python
import janus_swi as janus
janus.consult("family.pl")
for r in janus.query("parent(X, Y)"):
    print(r)
```

And from Prolog:

```prolog
?- py_call(numpy:sin(3.14), R).
R = 0.0015926529164868282.
```

Janus has shifted the center of gravity for Python-Prolog integration
and is especially relevant for neuro-symbolic AI work.

### 18.3 Java

- **JPL** (Java-to-Prolog and Prolog-to-Java). Developed by Fred Dushin,
  Paul Singleton, and others, JPL is the standard bridge between Java
  and SWI-Prolog. It uses JNI internally and provides a Java API for
  running Prolog queries and a Prolog API for calling Java methods.

```java
import org.jpl7.*;
Query q = new Query("member(X, [1,2,3])");
while (q.hasNext()) {
    Term x = q.next().get("X");
    System.out.println(x);
}
```

- **Jasper** (SICStus). The SICStus equivalent of JPL.
- **InterProlog**. A cross-implementation Java-Prolog bridge that works
  with SWI, SICStus, XSB, and YAP. Less common today but historically
  important.

### 18.4 R, Julia, LLVM

- **R integration**. SWI-Prolog's `library(real)` embeds R inside Prolog
  for statistical computation. Developed by Nicos Angelopoulos.
- **Julia integration**. Less mature; small community packages exist
  for calling Julia from SWI and vice versa.
- **LLVM backends**. Mercury targets LLVM. There are research Prologs
  (ALIS, smallProlog) that compile to LLVM, but none are widely used.

---

## 19. Libraries and packs

The per-system library ecosystems diverge significantly. Highlights:

### 19.1 SWI-Prolog libraries

SWI ships with dozens of libraries in the core distribution, plus
hundreds of community packs.

- **`library(clpfd)`** — constraint logic programming over finite
  domain integers, by Markus Triska.
- **`library(clpb)`** — Boolean CLP with BDD backend, by Markus Triska.
- **`library(chr)`** — Constraint Handling Rules, by Thom Frühwirth's
  group (Tom Schrijvers, Jan Wielemaker).
- **`library(semweb/...)`** — RDF, RDFS, OWL, Turtle, SPARQL endpoint,
  in-memory triple store.
- **`library(http/...)`** — HTTP server and client, authentication,
  WebSocket, session management, HTML generation, JSON handling.
- **`library(persistency)`** — journaled append-only persistent dynamic
  predicates.
- **`library(pengines)`** — Prolog Engines for remote query execution.
- **`library(redis)`** — Redis client.
- **`library(pcre)`** — PCRE regular expressions.
- **`library(yall)`** — lambda expressions.
- **`library(apply)`** — higher-order predicates (`maplist`, `foldl`,
  `partition`).
- **`library(lists)`** — list utilities.
- **`library(assoc)`** — association lists (balanced trees).
- **`library(tabling)`** — SLG tabling.
- **`library(crypto)`** — cryptographic primitives.
- **`library(ssl)`** — TLS/SSL via OpenSSL.
- **`library(zlib)`** — compression.

Third-party packs of note:

- **clpBNR** — CLP over real intervals.
- **real** — R interface for statistics.
- **tabling_improvements** — advanced tabling features.
- **list_util** — additional list predicates.
- **func** — functional programming constructs.
- **simple_server** — trivial HTTP server starter.

### 19.2 SICStus libraries

- **`library(clpfd)`** — the reference CLP(FD).
- **`library(clpq)`** and **`library(clpr)`** — rational and real.
- **`library(chr)`** — CHR.
- **`library(clpb)`** — Boolean.
- **`library(jasper)`** — Java interface.
- **`library(atts)`** — attributed variables.
- **`library(fdbg)`** — CLP(FD) debugger.
- **`library(lists)`, `library(sets)`, `library(ordsets)`, `library(assoc)`** — standard data structures.
- **`library(zdd)`** — zero-suppressed decision diagrams.

### 19.3 Ciao libraries

- **`library(assertions)`** — the Ciao assertion language.
- **`library(ciaopp)`** — analysis and transformation framework.
- **`library(regtypes)`** — regular types for precondition checking.
- **`library(clpfd)`, `library(clpq)`, `library(clpr)`** — constraint
  solvers.
- **`library(fsyntax)`** — functional syntax.
- **`library(hiord)`** — higher-order syntax.
- **`library(lpdoc)`** — documentation generator.

---

## 20. Benchmarks

The Prolog community has maintained a small collection of standard
benchmarks for about forty years, and they are still used for quick
sanity-check comparisons between implementations.

### 20.1 The canonical benchmark set

- **nrev** — naive reverse. The original Prolog speed test. `nreverse`
  is quadratic in the length of the list and stresses unification and
  list cons. Historically reported in LIPS (Logical Inferences Per
  Second). A modern SWI-Prolog on a 2026 laptop does tens of
  millions of LIPS on nrev.
- **queens** — N-queens via plain backtracking. Stresses choice
  points and indexing.
- **zebra** — the classic logic puzzle (who owns the zebra?). Fast in
  Prolog; the famous constraint version shows an enormous speedup with
  CLP(FD).
- **chat_parser** — a DCG parser from the CHAT-80 natural language
  question answering system. Stresses grammar rules and cuts.
- **boyer** — theorem prover (a simplified version of the Boyer-Moore
  prover). Stresses unification and meta-interpretation.
- **browse** — database query workload.
- **crypt** — crypt-arithmetic puzzles. Stresses CLP(FD) or arithmetic
  backtracking.
- **sendmore** — SEND + MORE = MONEY. Tiny CLP benchmark.
- **meta_qsort** — quicksort under a meta-interpreter. Stresses nested
  calls and environment handling.
- **prover** — resolution theorem prover.
- **cal** — calendar calculation.
- **nand** — hardware synthesis from behavioral description.

These benchmarks were codified in Dave Bowen and Mike Reilly's 1986
*Prolog: The Standard Reference Manual*, and in the "Aquarius benchmark
suite" from Van Roy's thesis work at Berkeley.

### 20.2 MiniZinc Challenge

The **MiniZinc Challenge** is a more modern benchmark that runs CP-solver
backends (including Prolog-based ones) against each other on a suite of
realistic combinatorial problems. B-Prolog, SICStus, ECLiPSe, Picat, and
several non-Prolog solvers (Gecode, Chuffed, OR-Tools) have competed.
The challenge demonstrates that Prolog-based CP systems are competitive
with special-purpose CP solvers on many real-world problems.

### 20.3 Rough performance relative to one another

On the classic benchmarks (2026 hardware, Linux x86_64):

- **YAP, SICStus**: usually the fastest.
- **GNU Prolog**: close behind on deterministic code.
- **SWI-Prolog**: within 1.5-3x of the top.
- **Scryer Prolog**: 2-5x slower than SWI on most benchmarks but
  catching up steadily.
- **Trealla Prolog**: similar to Scryer, sometimes slightly faster.
- **XSB**: medium on non-tabled code, unbeatable on tabled.
- **Tau Prolog**: 10-100x slower (JavaScript interpreter).

### 20.4 Rough performance relative to Python / JS

On benchmarks that are expressible in both languages reasonably (sorting,
graph search, puzzle solving):

- A good Prolog (YAP, SICStus) beats CPython by **5-20x** on pure
  compute.
- A good Prolog is comparable to PyPy on many workloads.
- For search problems where the Prolog solution uses backtracking and
  the Python solution uses explicit loops, the Prolog solution can be
  **100x faster** for free, because backtracking plus first-argument
  indexing plus LCO gets you a tight inner loop without work.
- JavaScript (V8) is usually **2-5x faster** than Python and comparable
  to Prolog on raw arithmetic. On symbolic manipulation tasks, Prolog
  wins again.

---

## 21. Standardization

### 21.1 ISO/IEC 13211-1:1995 — Prolog Core

The **ISO Prolog standard** was published in 1995 after nearly a decade
of work by **ISO/IEC JTC1/SC22/WG17**. The editor was **Roger Scowen**
and contributors included many names from the Edinburgh/DEC-10 lineage.

ISO/IEC 13211-1 (Part 1, "General Core") specifies:

- The abstract syntax of Prolog terms.
- The concrete syntax (operator table, reader, writer).
- Unification.
- The control constructs (`,`, `;`, `->`, `\+`, `!`, `catch/throw`).
- The standard built-in predicates, grouped by function (type
  checking, term manipulation, arithmetic, I/O, flags, database
  manipulation).
- Error conditions and the standard exception hierarchy
  (`instantiation_error`, `type_error`, `domain_error`,
  `existence_error`, `permission_error`, `representation_error`,
  `evaluation_error`, `resource_error`, `syntax_error`, `system_error`).
- Flags (`double_quotes`, `unknown`, `bounded`, `max_integer`,
  `min_integer`, etc.).

Every modern Prolog claims ISO compliance but strict compliance is rare.
The biggest areas of divergence are:

- **Double-quoted strings**. The ISO default is `double_quotes = codes`
  (strings are lists of character codes). SWI and others default to
  `double_quotes = string` (strings are a distinct type) because it's
  more practical. This single flag produces subtle portability bugs.
- **Integer bounds**. ISO permits bounded integers (flag
  `bounded = true`) but most modern implementations provide unbounded
  bignum integers.
- **Arithmetic evaluation**. Some functions in `is/2` are not in the
  standard but are universally supported (e.g., `gcd`, `**`).
- **String vs atom handling**. A pre-ISO irritation that the standard
  tried to resolve but didn't, quite.

### 21.2 ISO/IEC 13211-2:2000 — Modules

Part 2 of the standard specifies a Prolog module system. It was
published in 2000 and is almost universally ignored. Reasons:

- By 2000 every major Prolog already had its own module system
  (Quintus-style `use_module/1`, SICStus variants, SWI variants). These
  were all mutually incompatible *and* incompatible with the ISO
  proposal.
- The ISO proposal was a **functor-based module system** with
  intricate rules about import/export that mapped poorly onto
  existing practice.
- No major vendor was willing to break backward compatibility to
  conform.

The result: ISO modules are a dead letter. In practice, Prolog code that
needs to be portable between implementations uses Logtalk objects (which
side-step the problem entirely) or restricts itself to code that does
not use modules at all.

### 21.3 Community standards

Several community initiatives have tried to fill the gaps left by ISO:

- **Prolog Commons**. A community effort to standardize libraries that
  were not in ISO — lists, sets, assoc lists, DCGs, higher-order
  predicates. Active around 2010. Produced a set of "Prolog Commons"
  library specifications that most implementations partially support.
- **DCG standardization**. Definite Clause Grammars are universal in
  practice but were not in the 1995 ISO core. There is a **"DCG
  standardization" draft** that has been circulating since about
  2010. SWI, SICStus, Scryer, and Ciao all support the draft semantics.
- **SWI portability library**. SWI ships with `library(dialect)` that
  provides compatibility shims for SICStus, YAP, and IF/Prolog.

### 21.4 Markus Triska and *The Power of Prolog*

Any discussion of Prolog standardization in 2026 must include **Markus
Triska** and his online book *The Power of Prolog*
(https://www.metalevel.at/prolog). Triska is:

- A strict ISO advocate who has done more than anyone else since the
  1995 standard to promote portable, pure Prolog programming.
- The author of several widely-used libraries including `clpz`, `clpb`,
  `format_spec`, `dcg_basics`, and the CLP(FD) library in SWI-Prolog.
- A prolific teacher. His YouTube channel has hundreds of thousands of
  views across hundreds of videos explaining Prolog concepts, from
  beginner basics to advanced meta-programming and CLP.
- Co-maintainer (with Mark Thom) of **Scryer Prolog**.

*The Power of Prolog* is free, actively maintained, and is the textbook
most likely to be cited by someone who learned Prolog in the last ten
years. Its positions on code style are opinionated:

- **No cut** except as a carefully-documented green cut.
- **No side effects** in logical code; I/O and assert/retract should be
  segregated from pure predicates.
- **Use CLP(FD)** instead of `is/2` for arithmetic whenever possible, so
  that predicates work in all directions.
- **No `functor/3`, `arg/3` tricks** for manipulating unknown terms when
  pattern matching will do.
- **Steadfast predicates** — predicates whose behavior does not change
  based on whether arguments are instantiated.

Triska's style has become the modern norm for new Prolog code, and
Scryer is the implementation designed to support that style natively.

---

## 22. Getting started

### 22.1 Installing SWI-Prolog

**Linux (Debian/Ubuntu)**:

```bash
sudo apt install swi-prolog
```

**Linux (other)**: use the distribution's package manager, or the
PPA from the SWI-Prolog website for the latest version:

```bash
sudo add-apt-repository ppa:swi-prolog/stable
sudo apt update
sudo apt install swi-prolog
```

**macOS** (Homebrew):

```bash
brew install swi-prolog
```

**Windows**: download the installer from
https://www.swi-prolog.org/download/stable and run it. The installer
registers `swipl.exe` in your PATH.

**From source**: SWI builds on any POSIX system with CMake. Clone
`https://github.com/SWI-Prolog/swipl-devel`, run `cmake -B build
-S .` and `cmake --build build`, then `sudo cmake --install build`.

### 22.2 Hello, world

Create `hello.pl`:

```prolog
:- initialization(main, main).

main :-
    format("Hello, world!~n").
```

Run it:

```bash
swipl hello.pl
```

This uses the `initialization/2` directive to call `main/0` when the
file is loaded, and the `main` entry-point form which exits after
`main/0` succeeds.

### 22.3 The REPL and `consult/1`

Start the REPL by running `swipl` with no arguments:

```
?- consult('family.pl').
true.

?- parent(X, Y).
X = tom, Y = bob ;
X = tom, Y = liz ;
false.
```

Key interactions:

- `?-` is the REPL prompt.
- Queries end with a period.
- After a solution, press `;` (semicolon) to see the next one, or `.`
  (period) to stop.
- `consult(File).` loads a source file.
- `[file].` is a shorthand for `consult(file).`. Example: `[family].`
  loads `family.pl`.
- `make.` reloads all files that have changed since the last load.
- `halt.` exits.

### 22.4 A simple VS Code + SWI workflow

1. Install VS Code.
2. Install the `vscode-prolog` extension by Arthur Wang.
3. Set the SWI-Prolog path in settings (`prolog.executablePath`):
   usually `/usr/bin/swipl` on Linux, `/usr/local/bin/swipl` on
   macOS, `C:\\Program Files\\swipl\\bin\\swipl.exe` on Windows.
4. Open a `.pl` file. Syntax highlighting and linting activate
   automatically.
5. Right-click → "Prolog: Load Current File" to consult the file in a
   background SWI process, or hit `F5` to start a REPL in the
   integrated terminal.

### 22.5 Minimal project structure

```
myproject/
├── src/
│   ├── main.pl
│   └── lib/
│       ├── parser.pl
│       └── db.pl
├── test/
│   └── test_parser.pl
├── pack.pl          # if this is a pack
└── README.md
```

SWI-Prolog does not require any specific layout, but this one plays
well with `pack_install/1`, `make/0`, and `plunit` unit testing.

---

## 23. Tooling gaps and pain points

The Prolog ecosystem is productive but it has real rough edges. Being
honest about them is part of this document's job.

### 23.1 Package management is a patchwork

Every major Prolog has its own package system:

- SWI-Prolog: `pack_install/1` and https://www.swi-prolog.org/pack/list.
- SICStus: no centralized system; libraries are distributed manually.
- Ciao: `ciao get` fetches from a Ciao-specific repository.
- Logtalk: a per-Prolog installation scheme.
- Scryer: Cargo + a small set of Git-hosted libraries.
- Trealla: Git clones.

None of these cross-talk. A library published as a SWI pack is usually
unusable in Scryer without porting. The Prolog Commons effort tried to
create a portable library set and partially succeeded, but a true
cross-implementation package manager does not exist.

Compare to Rust's `cargo`, Python's `pip`, JavaScript's `npm`: we don't
have anything close.

### 23.2 Build systems

Most Prolog projects use plain Makefiles, or just a shell script that
calls `swipl`. There is no widely-adopted build system the way there is
for C++, Rust, Haskell, or Python. Logtalk's `logtalk_make` is the
closest thing to a standard, but it only applies to Logtalk projects.

### 23.3 Debugger UX

The Byrd box tracer is perfectly good for small programs and terrible
for large ones. It scrolls past hundreds of port events before you
can read them, and the graphical debuggers (SWI's PceEmacs-based
debugger, the SICStus GUI) are dated. There is no Prolog equivalent
of `gdb` with watchpoints and conditional breakpoints, much less the
record-and-replay debugging that rr provides for C++.

Some progress:

- SWI-Prolog has a DAP (Debug Adapter Protocol) implementation used by
  VS Code.
- CiaoPP provides static analysis that catches many errors before
  runtime, reducing the need for debugger time.

But the truth is the Prolog debugger experience has not kept up with
modern language tooling.

### 23.4 Language Server Protocol (LSP)

There is no production-quality Prolog language server in 2026.
Several community attempts exist:

- **vscode-prolog** uses ad-hoc SWI integration instead of LSP.
- **lsp-prolog** by Jantanka Kaltsa and others is a proof of concept.
- SWI-Prolog's **pengines** could in principle back an LSP, and some
  experimental work has started down that path.

Without LSP, features that mainstream IDEs take for granted — go-to-definition,
find-references, rename-symbol, semantic highlighting, on-hover type
information — are either missing or implemented poorly per-editor.
This is probably the single biggest pain point for new Prolog
developers coming from mainstream languages in 2026.

### 23.5 Error messages

Prolog error messages are traditionally terse. A type error in a deep
call shows a stack trace only if debugging is on, and the stack trace
uses WAM-level identifiers rather than source locations for older
implementations. Modern SWI has improved this significantly with
source-preserving reads and better tracebacks, but the experience is
still worse than, say, Rust's famously helpful error messages.

### 23.6 Versioning and backward compatibility

Because there is no single authoritative Prolog (ISO notwithstanding),
libraries have to target specific implementations. A SWI-Prolog 9 pack
might not work on SWI-Prolog 8, let alone on SICStus. Logtalk papers
over this with adapter files, but for plain Prolog code the situation
is messy.

### 23.7 Deployment story

Deploying a Prolog program is usually "install SWI-Prolog and tell the
user to `swipl my_program.pl`." Better options:

- **SWI-Prolog saved states** (`qsave_program/2`) bundle a program and
  its dependencies into a single executable.
- **GNU Prolog** compiles to standalone binaries natively.
- **Trealla and Scryer** have small enough runtimes that they can be
  distributed alongside a program.

But there is no cargo-equivalent deployment story. Docker images are
the most common industrial deployment model, which works but is heavy
for what should be a simple tool.

### 23.8 Community and learning materials

Ironically, the learning materials situation is actually *good* in
2026, because of Triska's *Power of Prolog*, the Bratko textbook, the
O'Keefe *Craft of Prolog*, countless YouTube tutorials, and SWISH's
shareable-URL examples. The community is also small enough that
individual experts are reachable on the SWI-Prolog Discourse forum
(https://swi-prolog.discourse.group/), the Prolog subreddit, and the
Mercury/Ciao mailing lists. A newcomer asking a well-formulated
question will usually get an answer from someone like Jan Wielemaker,
Markus Triska, or Paulo Moura within 24 hours. Not many languages have
this.

---

## 24. References and further reading

### 24.1 Canonical texts

- **Warren, David H. D.** (1983). *An Abstract Prolog Instruction Set*.
  Technical Note 309, SRI International, Menlo Park, CA.
- **Aït-Kaci, Hassan** (1991). *Warren's Abstract Machine: A Tutorial
  Reconstruction*. MIT Press.
  http://wambook.sourceforge.net/wambook.pdf
- **Clocksin, William F. and Mellish, Christopher S.** (2003).
  *Programming in Prolog: Using the ISO Standard* (5th ed.). Springer.
- **O'Keefe, Richard A.** (1990). *The Craft of Prolog*. MIT Press.
- **Bratko, Ivan** (2012). *Prolog Programming for Artificial
  Intelligence* (4th ed.). Addison-Wesley.
- **Sterling, Leon and Shapiro, Ehud** (1994). *The Art of Prolog*
  (2nd ed.). MIT Press.
- **Triska, Markus**. *The Power of Prolog*. Online book, continuously
  updated. https://www.metalevel.at/prolog

### 24.2 Standard

- **ISO/IEC 13211-1:1995** — Information technology — Programming
  languages — Prolog — Part 1: General core.
- **ISO/IEC 13211-2:2000** — Programming languages — Prolog — Part 2:
  Modules.

### 24.3 Implementation manuals

- **SWI-Prolog Manual**: https://www.swi-prolog.org/pldoc/refman/
- **SICStus Prolog Manual**: https://sicstus.sics.se/documentation.html
- **GNU Prolog Manual**: http://www.gprolog.org/manual/gprolog.html
- **YAP Manual**: https://www.dcc.fc.up.pt/~vsc/yap/
- **XSB Manual**: https://xsb.sourceforge.net/manual1/manual1.pdf
- **Ciao Manual**: https://ciao-lang.org/documentation.html
- **ECLiPSe Documentation**: https://eclipseclp.org/doc/
- **Picat User's Guide**: http://www.picat-lang.org/download/picat_guide.pdf
- **Scryer Prolog Book**: https://www.metalevel.at/prolog (via Power of
  Prolog)
- **Trealla Prolog Manual**:
  https://trealla-prolog.github.io/trealla/

### 24.4 Newsletters and community venues

- **Association for Logic Programming** (ALP) Newsletter:
  https://www.cs.nmsu.edu/ALP/
- **ICLP** — International Conference on Logic Programming, published
  in LIPIcs annually.
- **TPLP** — *Theory and Practice of Logic Programming*, the main
  logic programming journal (Cambridge University Press).
- **SWI-Prolog Discourse**:
  https://swi-prolog.discourse.group/
- **r/prolog** on Reddit.
- **prolog** tag on Stack Overflow.

### 24.5 Historical papers

- **Warren, D.H.D., Pereira, L.M., and Pereira, F.** (1977).
  *Prolog — the language and its implementation compared with Lisp*.
  SIGART Newsletter.
- **Colmerauer, A. and Roussel, P.** (1993). *The birth of Prolog*.
  ACM SIGPLAN Notices.
- **Warren, David H.D.** (1977). *Implementing Prolog — Compiling
  Predicate Logic Programs*. Research Report 39/40, Department of
  Artificial Intelligence, University of Edinburgh.

### 24.6 On specific implementations

- **Wielemaker, J., Schrijvers, T., Triska, M., and Lager, T.** (2012).
  *SWI-Prolog*. Theory and Practice of Logic Programming, 12(1-2),
  67-96.
- **Carlsson, M., Widen, J., Andersson, J., Andersson, S., Boortz, K.,
  Nilsson, H., and Sjöland, T.** (1988). *SICStus Prolog User's
  Manual*. SICS Technical Report.
- **Diaz, D. and Codognet, P.** (2001). *Design and implementation of
  the GNU Prolog system*. Journal of Functional and Logic Programming,
  vol. 2001, no. 6.
- **Costa, V.S., Rocha, R., and Damas, L.** (2012). *The YAP Prolog
  system*. Theory and Practice of Logic Programming, 12(1-2), 5-34.
- **Sagonas, K., Swift, T., and Warren, D.S.** (1994). *XSB as an
  efficient deductive database engine*. ACM SIGMOD Record.
- **Hermenegildo, M.V., Bueno, F., Carro, M., López-García, P., Mera,
  E., Morales, J.F., and Puebla, G.** (2012). *An overview of Ciao
  and its design philosophy*. TPLP 12(1-2), 219-252.
- **Zhou, N.-F.** (2012). *The language features and architecture of
  B-Prolog*. TPLP 12(1-2), 189-218.
- **Thom, M.** (2020+). Scryer Prolog design notes in the scryer-prolog
  GitHub repository discussions.
- **Moura, P.** (2003+). *Logtalk: Design of an Object-Oriented Logic
  Programming Language*. PhD dissertation, Universidade da Beira
  Interior, Portugal.

### 24.7 Performance and benchmarking

- **Van Roy, P.** (1994). *1983-1993: The wonder years of sequential
  Prolog implementation*. Journal of Logic Programming, 19/20, 385-441.
- **Demoen, B. and Nguyen, P.-L.** (2000). *So many WAM variations, so
  little time*. Proceedings of CL 2000.
- **Haygood, R.C.** (1994). A Prolog benchmark suite for Aquarius.
  Technical report, UC Berkeley.

### 24.8 Constraints

- **Frühwirth, T.** (1998). *Theory and practice of constraint handling
  rules*. Journal of Logic Programming 37(1-3), 95-138.
- **Triska, M.** (2012). *The finite domain constraint solver of
  SWI-Prolog*. FLOPS 2012.
- **Schrijvers, T. and Frühwirth, T.** (2005). *CHR Grammars*. TPLP
  5(4-5), 467-491.

### 24.9 Tabling

- **Chen, W. and Warren, D.S.** (1996). *Tabled evaluation with
  delaying for general logic programs*. JACM 43(1), 20-74.
- **Swift, T. and Warren, D.S.** (2012). *XSB: Extending Prolog with
  Tabled Logic Programming*. TPLP 12(1-2), 157-187.

---

## Appendix A: Extended WAM worked example

To make the WAM story concrete, here is a more detailed compilation trace
than the brief `append/3` example given in section 1. Consider the
predicate `concat/3`, which is the same as `append/3` but with an extra
permanent variable that forces environment frame allocation:

```prolog
concat(A, B, Result) :-
    length(A, N),
    length(B, M),
    Total is N + M,
    append(A, B, Result),
    length(Result, Total).
```

The important feature of this clause is that `A`, `B`, `Result`, `N`, `M`,
and `Total` all span at least one call, so they all become *permanent*
variables stored in the environment frame, not in X registers. The
compiler emits approximately:

```
concat/3:
    allocate        6              ; 6 permanent variables
    get_variable    Y1, A1         ; A
    get_variable    Y2, A2         ; B
    get_variable    Y3, A3         ; Result
    put_value       Y1, A1
    put_variable    Y4, A2         ; N
    call            length/2, 5    ; preserve Y1..Y5 after call
    put_value       Y2, A1
    put_variable    Y5, A2         ; M
    call            length/2, 4    ; preserve Y1..Y4 after call, drop Y5
    put_value       Y4, A1
    put_value       Y5, A2
    put_variable    Y6, A3         ; Total
    call            is/2, 3
    put_value       Y1, A1
    put_value       Y2, A2
    put_value       Y3, A3
    call            append/3, 2
    put_value       Y3, A1
    put_value       Y6, A2
    deallocate
    execute         length/2
```

What this shows:

- **`allocate 6`** pushes an environment frame with six slots on the
  local stack. These become Y1..Y6.
- Each **`call`** has a second argument that tells the garbage-collection
  pass how many permanent variables are still live *after* the call.
  This is environment trimming: by the third `call`, only four slots
  (Y1..Y4) are still needed; Y5 is dead after its last use as an
  argument. The environment frame shrinks from the top down as the
  clause executes.
- The final goal `length(Result, Total)` is compiled to `execute` rather
  than `call`. The `deallocate` before it pops the environment frame
  and the `execute` performs a tail call. If `length/2` is itself
  deterministic, the entire `concat/3` call consumes no choice points
  and only one transient environment frame.
- `get_variable` on entry pulls the three argument positions out of
  A1..A3 and into the environment. This is where incoming arguments
  become permanent variables.
- `put_value` and `put_variable` on the call-side load outgoing
  arguments from the environment into A registers.

This is the heart of the WAM's calling convention. A compiler that
cannot do environment trimming will still be correct, but it will pay
for it at the margins: every permanent variable stays alive across
every call, including the ones that no longer need it.

## Appendix B: Comparing build and install workflows

A common source of frustration for new Prolog users is that every
implementation has a slightly different story for installing libraries
and building projects. Here is a side-by-side cheat sheet for the
systems most likely to be encountered.

**SWI-Prolog**

```bash
# Install the runtime
sudo apt install swi-prolog

# Install a pack from the REPL
?- pack_install(clpBNR).

# Or from the shell
swipl -g "pack_install(clpBNR), halt"

# Load a pack in your code
:- use_module(library(clpBNR)).

# Build a project with a Makefile (conventional)
make test
make install
```

**SICStus Prolog**

```bash
# Install the runtime (commercial license required)
# Download installer from sicstus.sics.se, run it

# Load a library from the REPL
| ?- use_module(library(clpfd)).

# No centralized pack system; libraries are distributed manually
# or bundled by integrators. Cross-platform installation is usually
# accompanied by a company-internal deployment script.
```

**GNU Prolog**

```bash
sudo apt install gprolog

# From the REPL:
| ?- [my_program].

# Compile to a standalone binary (GNU Prolog's claim to fame)
gplc --min-size my_program.pl
./my_program   # runs natively, no runtime install needed
```

**Scryer Prolog**

```bash
# Scryer is a Rust project
cargo install scryer-prolog

# Or from source
git clone https://github.com/mthom/scryer-prolog
cd scryer-prolog
cargo build --release

# Libraries are imported via use_module
?- use_module(library(clpz)).
?- use_module(library(dcgs)).
```

**Trealla Prolog**

```bash
git clone https://github.com/trealla-prolog/trealla
cd trealla
make
./tpl my_program.pl

# WASM build for the browser
make wasm
```

**Logtalk**

```bash
# Install on top of an existing Prolog
./swilgt.sh      # for SWI
./sicstuslgt.sh  # for SICStus
./yaplgt.sh      # for YAP

# Run a Logtalk program
?- logtalk_load([my_object]).
?- my_object::do_something.
```

The lack of a common interface across these is one of the reasons
Logtalk has survived: it abstracts all of this away and lets you
write "Logtalk code" regardless of which Prolog you run on.

## Appendix C: A reference list of common built-in predicates

Because there is no single reference that newcomers can consult, here
is a short reference of the built-ins that are universally present in
ISO-compliant implementations and used in virtually every Prolog
program:

**Term inspection**:
- `var/1`, `nonvar/1`, `atom/1`, `number/1`, `integer/1`, `float/1`,
  `atomic/1`, `compound/1`, `is_list/1`, `ground/1`.
- `functor(?Term, ?Name, ?Arity)` — decompose or build a term by its
  functor name and arity.
- `arg(+N, +Term, -Arg)` — extract the Nth argument of a compound term.
- `Term =.. List` — "univ", convert between a compound term and a list
  (`foo(a,b) =.. [foo, a, b]`).
- `copy_term(+Term, -Copy)` — create a fresh copy with renamed
  variables.

**Unification and comparison**:
- `?X = ?Y` — unification.
- `?X \= ?Y` — negation of unification (not sound for partial terms).
- `X == Y`, `X \== Y` — term identity.
- `X @< Y`, `X @=< Y`, `X @> Y`, `X @>= Y` — standard order of terms.
- `compare(-Order, +X, +Y)` — three-way compare returning `<`, `=`,
  or `>`.

**Arithmetic**:
- `X is +Expr` — evaluate an arithmetic expression.
- `+X =:= +Y`, `=\=`, `<`, `=<`, `>`, `>=` — arithmetic comparison.
- Supported functions: `+`, `-`, `*`, `/`, `//` (integer div), `mod`,
  `rem`, `abs`, `sign`, `min`, `max`, `sqrt`, `sin`, `cos`, `tan`,
  `exp`, `log`, `^`, `**`, `gcd`, `truncate`, `round`, `ceiling`,
  `floor`. Not all implementations support every function; `gcd` and
  `**` are almost universal but technically outside the ISO core.

**Control**:
- `true/0`, `fail/0`, `false/0`.
- `,/2` (conjunction), `;/2` (disjunction), `->/2` (if-then),
  `\+/1` (negation as failure).
- `!/0` — cut.
- `catch(+Goal, ?Catcher, +Recovery)` and `throw(+Exception)`.
- `call/1..N` — meta-call with optional extra arguments.
- `once(+Goal)` — commit to first solution.
- `forall(+Cond, +Action)` — prove Action for every Cond.
- `findall/3`, `bagof/3`, `setof/3` — collect all solutions.

**Database manipulation**:
- `assert/1`, `asserta/1`, `assertz/1` — add clauses at runtime.
- `retract/1`, `retractall/1` — remove clauses.
- `abolish/1` — remove an entire predicate.
- `clause(+Head, ?Body)` — inspect the database.

**I/O**:
- `read/1`, `read_term/2` — read a term from input.
- `write/1`, `writeln/1`, `print/1`, `write_canonical/1`,
  `write_term/2` — output.
- `format/1, format/2` — printf-style formatted output.
- `nl/0` — newline.
- `open/3`, `close/1`, `get_char/1`, `put_char/1`.

**Atoms and strings**:
- `atom_codes/2`, `atom_chars/2`, `atom_length/2`,
  `atom_concat/3`, `atom_to_term/3`.
- `number_codes/2`, `number_chars/2`.
- `sub_atom/5`.

**Lists** (usually in `library(lists)`):
- `length/2`, `append/3`, `member/2`, `reverse/2`, `nth0/3`, `nth1/3`,
  `last/2`, `msort/2`, `sort/2`, `sort/4`, `permutation/2`,
  `select/3`, `delete/3`, `sum_list/2`, `max_list/2`, `min_list/2`.

**Higher-order** (usually in `library(apply)`):
- `maplist/2..5`, `foldl/4..6`, `include/3`, `exclude/3`,
  `partition/4`, `foldl/4`.

This is by no means complete — SWI-Prolog alone has several thousand
built-ins — but it covers the 95% that appears in day-to-day Prolog
programming.

## Appendix D: A tour of the SWI-Prolog directory layout

For readers who have just installed SWI-Prolog and want to know where
everything lives, here is a map of a typical Unix installation:

```
/usr/lib/swi-prolog/
├── boot/               # bootstrap files for the engine
├── library/            # the standard library
│   ├── apply.pl
│   ├── assoc.pl
│   ├── clpfd.pl
│   ├── dcg/
│   ├── http/
│   ├── lists.pl
│   ├── semweb/
│   └── ...
├── pack/               # installed packs
│   └── <packname>/
│       ├── pack.pl
│       └── prolog/
├── xpce/               # XPCE GUI library
├── bin/
│   └── swipl
└── include/            # C headers for foreign interface
    ├── SWI-Prolog.h
    └── SWI-Stream.h
```

Knowing this layout is important for a few practical reasons:

- When you `use_module(library(foo))`, SWI searches `library/foo.pl`
  in this tree (and also in user-declared library paths).
- When you install a pack, it lands in `pack/<packname>` in the
  per-user directory (`~/.local/share/swi-prolog/pack/` by default on
  Linux), not in the system-wide tree.
- Foreign extensions include `SWI-Prolog.h` from the `include/`
  directory and link against `libswipl.so`.
- Boot files in `boot/` are what SWI reads when it first starts; they
  contain the implementations of the lowest-level built-ins.

## Appendix E: A short glossary

- **Atom**. A symbolic constant. Written as a lowercase identifier
  (`foo`), a quoted string (`'hello world'`), or a symbolic operator
  (`+`, `-`). Atoms in Prolog are not strings; they are interned
  unique symbols with cheap equality.
- **Compound term**. A term of the form `f(t1, ..., tn)` where `f` is
  a functor name and `t1..tn` are subterms. `f/n` is the standard way
  to refer to a compound term's signature (name/arity).
- **Functor**. The combination of a name and an arity, e.g., `foo/3`.
  The most important fact about functors in Prolog is that `foo(a,b)`
  and `foo(a,b,c)` are entirely unrelated predicates — the arity is
  part of the identity.
- **Unification**. The process of making two terms identical by
  binding variables. Robinson's 1965 algorithm is the formal
  definition; Prolog implementations use a linear-time variant with
  occurs-check usually disabled by default for speed.
- **Resolution**. The inference rule Prolog uses to prove goals.
  Specifically SLD resolution (Selective Linear Definite-clause), as
  described by Kowalski in 1974.
- **Clause**. A fact (`head.`) or rule (`head :- body.`).
- **Horn clause**. A clause with at most one positive literal. Prolog
  programs are collections of Horn clauses, which is why SLD
  resolution is sound and complete for them.
- **Choice point**. A saved state created when a goal has multiple
  applicable clauses, recording where to resume on backtracking.
- **Cut** (`!`). A control construct that commits to the choices made
  so far in the current clause, preventing backtracking past the cut.
  Controversial because it is not declarative, but essential for
  performance and for certain control idioms.
- **Green cut vs red cut**. A *green cut* is a cut that does not
  change the meaning of a program, only its efficiency. A *red cut*
  changes the meaning — removing it would give different answers.
  O'Keefe's *Craft of Prolog* recommends green cuts only.
- **Negation as failure** (`\+`). Proving `\+ Goal` by trying to prove
  `Goal` and succeeding if and only if that fails. Not the same as
  logical negation — it only works correctly for ground goals.
- **DCG** (Definite Clause Grammar). A notation for writing grammars
  directly as Prolog clauses, automatically threading the input token
  list through the rules. `a --> b, c.` expands to
  `a(S0,S) :- b(S0,S1), c(S1,S).`.
- **Attributed variable**. A variable with attached metadata used by
  constraint solvers and coroutining mechanisms. When the variable is
  unified, the attached "goals" are woken up to enforce constraints.
- **Meta-predicate**. A predicate that takes other predicates as
  arguments (e.g., `maplist/3`, `findall/3`, `call/2`). The colon
  operator is used in module declarations to indicate meta-arguments:
  `:- meta_predicate maplist(2, ?).`
- **Determinism**. Whether a call has exactly one solution (`det`),
  at most one (`semidet`), any number (`nondet`), or at least one
  (`multi`). Making determinism explicit is central to Mercury and
  Ciao; it is informal in most traditional Prologs but still
  important for reasoning about efficiency.

## Appendix F: A brief note on neuro-symbolic integration (2024-2026)

One of the reasons Prolog has seen renewed interest in 2024-2026 is the
growing demand for **neuro-symbolic AI**: hybrid systems that combine
neural networks with symbolic reasoning. In such systems, Prolog plays
the role of the symbolic reasoner — a rule engine that can execute
logical queries against a knowledge base, perform abductive inference,
or check constraints on the output of a neural network.

Concrete examples from the current research landscape:

- **DeepProbLog** — an extension of ProbLog (built on YAP) that allows
  neural network predicates to appear inside Prolog rules. Developed
  at KU Leuven.
- **Scallop** — a Rust-based probabilistic logic language inspired by
  Datalog and Prolog. Not strictly a Prolog but close enough that
  most of its user base comes from the Prolog community.
- **PyReason** — a Python library for rule-based reasoning in the
  context of machine learning, with a Prolog-like surface syntax.
- **NS-CL / NMN** — neuro-symbolic concept learners that emit
  Prolog-style queries as their symbolic output.

The SWI-Prolog Janus bridge (covered in §18.2) is particularly
important for this use case because it makes it trivial to call
PyTorch or scikit-learn from Prolog and vice versa. The typical
architecture is: Python trains and evaluates neural networks, Prolog
holds the knowledge base and runs queries, and the two communicate
through Janus with automatic type conversion.

The broader point for our purposes is that the tooling story for
Prolog as a neuro-symbolic backend is now genuinely good: SWI +
Janus + Python + a few CLP libraries is a productive stack that did
not exist five years ago. This has contributed significantly to the
uptick in Prolog interest in recent years, even among developers
who would never consider Prolog as a "general-purpose" language.

---

*End of Prolog implementations and ecosystem thread.*

## Study Guide — Prolog Implementations & Ecosystem

### Implementations

- **SWI-Prolog** — most complete, great web story.
- **SICStus** — commercial, widely used in industry.
- **YAP, GNU Prolog, B-Prolog, XSB** — alternatives.
- **Scryer Prolog** — modern, Rust-based.
- **clingo** — ASP solver.
- **Soufflé** — Datalog for static analysis.

## DIY — Write a Prolog web service

SWI-Prolog has a built-in HTTP server. Write a 20-line web
API that answers queries.

## TRY — Use Scryer Prolog

Scryer is written in Rust and aims for full ISO
compliance. Try it and compare to SWI.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)

*This document is one of four parallel research threads for the PNW
Research Series project at tibsfox.com/Research/PLG/. It covers
runtimes, virtual machines, development tools, foreign interfaces,
libraries, standardization, getting started, and the known tooling
gaps of the Prolog ecosystem as of early 2026. History, language
semantics, and modern applications are covered in sibling threads.*
