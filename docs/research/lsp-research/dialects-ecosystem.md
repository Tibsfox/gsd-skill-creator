# Lisp Dialects and Ecosystem: A Living Map of the Family Tree

*Part of the PNW Research Series — LSP Research Project*
*Target: Living, usable Lisps today and the historical dialects that shaped them*

---

## 1. The Lisp Family Tree

### 1.1 Origins: LISP 1 through LISP 1.5 (1958-1962)

The story begins with John McCarthy at MIT in 1958. Working in the AI Project with Marvin Minsky, McCarthy needed a language that could handle symbolic expressions for theorem proving and differentiation. His paper "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I" (CACM, April 1960) is the foundational document.

The name LISP comes from "LISt Processor." McCarthy intended `M-expressions` (meta-expressions) as the surface syntax, with `S-expressions` as the underlying data representation. A quirk of history: Steve Russell, one of McCarthy's graduate students, hand-coded the `eval` function from McCarthy's paper and made it run on an IBM 704. Programmers simply used S-expressions directly because they worked, and the M-expression surface syntax was never fully implemented. Lisp's signature parentheses are an accident of that shortcut.

- **LISP 1** (1958-1960): the original implementation on the IBM 704, with `CAR` and `CDR` names coming from the 704's "Contents of Address/Decrement Register" instructions
- **LISP 1.5** (1962): the first widely distributed version, documented in the *LISP 1.5 Programmer's Manual* (McCarthy, Abrahams, Edwards, Hart, Levin, MIT Press 1962)
- LISP 1.5 established: `cond`, `lambda`, `quote`, `cons`, `atom`, `eq`, `car`, `cdr`, property lists, and `eval` as a first-class function

### 1.2 The Great MIT Schism (1960s-1970s)

By the mid-1960s, Lisp had spread across research institutions and forked aggressively. The major branches of this era:

- **BBN LISP** (1966, Bolt Beranek and Newman) → becomes **Interlisp**
- **MACLISP** (~1966, MIT AI Lab, named after MAC — Project MAC, not Apple) — optimized for the PDP-10
- **Stanford LISP 1.6** (late 1960s, Stanford AI Lab)
- **Standard LISP** (1969, University of Utah, for the REDUCE computer algebra system)
- **LISP 2** (1966, attempt at standardization that failed — a cautionary tale in Lisp history)

MACLISP became the workhorse Lisp at MIT and the ancestor of ZetaLisp, NIL, and eventually Common Lisp. Interlisp was the BBN/Xerox PARC tradition, which ran on the PDP-10 and then on custom hardware.

### 1.3 The Lisp Machine Era (1973-1986)

Lisp machines were specialized hardware designed to run Lisp efficiently. Three families dominated:

- **MIT Lisp Machine** (CONS, 1974; CADR, 1978, by Richard Greenblatt and Tom Knight) — the research prototypes
- **Symbolics** (founded 1980 by Russ Noftsker) — commercial CADR successors, then LM-2, 3600, Ivory chip
- **LMI (Lisp Machines Inc.)** (founded 1979 by Richard Greenblatt) — the Greenblatt purist fork
- **Xerox 1100 Dolphin / 1108 Dandelion / 1186 Daybreak** (D-machines) — ran Interlisp-D
- **TI Explorer** (1984-1989) — Texas Instruments' licensed Lisp Machine hardware

Symbolics dominated. It gave us **ZetaLisp** (aka Lisp Machine Lisp), **Genera** (the operating system), and a culture where the entire OS was written in Lisp with no distinction between system and user code. Genera sources, GUI tools, and development environment were all open for inspection and modification.

Symbolics also holds a remarkable piece of internet trivia: **symbolics.com was the first registered .com domain**, on March 15, 1985.

### 1.4 The Divergence: Common Lisp vs Scheme (1975-1994)

By the late 1970s, the fragmentation of Lisp into MacLisp, Interlisp, Franz Lisp, ZetaLisp, Standard Lisp, NIL, Spice Lisp, and a dozen others was a crisis. Two responses emerged:

**The Scheme response** (1975, Guy Steele and Gerald Sussman, MIT): start from scratch. Throw away the historical baggage, go back to the lambda calculus, embrace lexical scoping, and build the smallest possible language.

**The Common Lisp response** (1981-1984, Scott Fahlman, Guy Steele, Dan Weinreb, and others): unify the MacLisp-descended dialects into a single standardized industrial language with all the features people actually used.

Both responses came partly from the same people: Guy Steele worked on both. The divergence was stylistic, not personal.

### 1.5 The Family Tree — Major Branches

```
LISP 1 (1958, McCarthy, MIT)
 |
 +-- LISP 1.5 (1962, MIT)
       |
       +-- MACLISP (1966, MIT) --------------------------+
       |    |                                            |
       |    +-- NIL (1980, MIT, "New Implementation")    |
       |    +-- Franz Lisp (1981, Berkeley) -> Allegro   |
       |    +-- Spice Lisp (1980, CMU) -> CMUCL          |
       |    +-- ZetaLisp (1978, MIT/Symbolics)           |
       |    +-- Portable Standard Lisp (1982, Utah)      |
       |                                                 |
       +-- BBN LISP (1966) -> Interlisp -> Interlisp-D   |
       |                                                 |
       +-- Standard LISP (1969, Utah, for REDUCE)        |
       |                                                 |
       +-- Scheme (1975, Steele+Sussman, MIT) [new root] |
       |                                                 |
       +-- Emacs Lisp (1985, Stallman, influenced by MACLISP)
                                                         |
                                                         v
                 Common Lisp (1984 CLtL, 1994 ANSI X3.226)
                        |
                        +-- SBCL, CCL, ECL, ABCL, CLISP, Allegro, LispWorks, CMUCL
```

The Scheme branch:

```
Scheme (1975, Steele+Sussman)
 |
 +-- MIT Scheme
 +-- T (1982, Yale, Jonathan Rees) [extinct, influential]
 +-- MacScheme (1984)
 +-- Elk (1987)
 +-- SCM (1990, Aubrey Jaffer)
 +-- Scheme48 (1986, Kelsey+Rees)
 +-- Bigloo (1990, Manuel Serrano)
 +-- Chez Scheme (1984, Dybvig; open sourced 2016)
 +-- Guile (1993, GNU extension language)
 +-- Chicken (2000, Felix Winkelmann, compiles to C)
 +-- Gambit (1994, Marc Feeley, compiles to C)
 +-- Kawa (1996, Per Bothner, JVM)
 +-- Gauche (2002, Shiro Kawai)
 +-- Ikarus (2006, Abdulaziz Ghuloum)
 +-- Larceny (2008, Clinger+Hansen)
 +-- PLT Scheme (1995) -> Racket (rebranded 2010)
 +-- Gerbil (2015, Drew Crampsie, Gambit successor)
 +-- CHICKEN 5 (2018)

 Dialects that are Lisps but not Common Lisp or Scheme:
 +-- Clojure (2007, Rich Hickey, JVM) -> ClojureScript, ClojureCLR, ClojureDart, ClojErl
 +-- Arc (2008, Paul Graham+Robert Morris)
 +-- newLISP (1991, Lutz Mueller)
 +-- PicoLisp (1988, Alexander Burger)
 +-- Hy (2013, Paul Tagliamonte, runs on Python)
 +-- Fennel (2016, Calvin Rose, compiles to Lua)
 +-- Carp (2016, Erik Svedang, statically typed)
 +-- Janet (2017, Calvin Rose)
 +-- Shen (2011, Mark Tarver, optional types)
 +-- LFE (2008, Robert Virding, Lisp Flavored Erlang)
 +-- Joxa (2011, Eric Merritt, another BEAM Lisp)
 +-- Wisp (2005-2013, Alex Shinn, indentation Scheme)
 +-- Dylan (1992, Apple/Digitool) — Lisp that pretended to be Algol
 +-- EuLisp (1990, European "united" Lisp, extinct)
 +-- ISLISP (1997, ISO 13816) — compromise standard nobody adopted
```

### 1.6 Functional Relatives (Not Lisps, But Family)

The ML family descends culturally from Lisp via the typed lambda calculus research program. These are functional cousins, not Lisps:

- **ML** (1973, Robin Milner, Edinburgh) — originally the "metalanguage" for LCF
- **Standard ML** (1990, formal definition)
- **OCaml** (1996, INRIA, Xavier Leroy)
- **Haskell** (1990, Peyton Jones et al.)
- **F#** (2005, Don Syme, Microsoft)
- **Elm** (2012, Evan Czaplicki) — influenced by Haskell via Erlang
- **PureScript** (2013, Phil Freeman) — Haskell for the browser
- **Unison** (2014, Paul Chiusano, Rúnar Bjarnason) — content-addressed

These share Lisp's commitment to expressions over statements, first-class functions, recursion as the basic control construct, and immutability as a default. They do not share parentheses, macros, or homoiconicity.

### 1.7 Lisp-Flavored Nearest Neighbors

Languages that are "Lisp-ish" without being Lisps:

- **Rebol** (1997, Carl Sassenrath) — expressions, blocks, but not S-expression based
- **Red** (2011, Nenad Rakocevic) — Rebol successor
- **Io** (2002, Steve Dekorte) — prototype-based, very small, message-passing
- **TXR Lisp** (2015, Kaz Kylheku) — pattern-matching text processor with an embedded Lisp
- **Pixie** (2014-2017, Timothy Baldridge) — Clojure-inspired, RPython-compiled, extinct but interesting

---

## 2. Common Lisp — The Industrial Standard

### 2.1 The Road to Standardization

By 1981, MACLISP, Franz Lisp, NIL, Spice Lisp, ZetaLisp, S-1 Lisp, and Interlisp were mutually incompatible. ARPA, which funded much of the work, began pressuring the community to unify. The meeting that launched Common Lisp happened in April 1981 at Symbolics in Cambridge, Massachusetts.

The first definition appeared in 1984 as **Common Lisp: The Language** (CLtL1) by Guy L. Steele Jr., Digital Press. It was not a formal standard — it was the agreed-upon intersection and union of the major MACLISP-descended dialects.

**CLtL2** (1990) expanded the book to incorporate work done during the ANSI standardization process, including the Common Lisp Object System (CLOS), conditions (exceptions), LOOP, and the pretty printer. CLtL2 is a snapshot of a moving target.

**ANSI X3.226-1994** (the X3J13 committee, chaired by Guy Steele then Kathy Chapman) became the formal standard in December 1994. The document is approximately 1,300 pages. It remains, as of 2026, the most recent and still-authoritative specification of any major Lisp dialect. There is no ANSI Common Lisp 2.

### 2.2 Why Standardization Mattered — The Contrast With Scheme

Common Lisp bet on a single massive standard that froze the language. Scheme bet on a series of small standards (RnRS) that evolved continuously. Common Lisp is a working industrial language today, 32 years after its standard, because the spec is so complete that no implementation needs to extend it to be useful. Scheme is a research language today because each implementation extends the tiny spec in incompatible directions.

The lesson: **for an industrial language, a big conservative standard beats a small progressive one**.

### 2.3 The Implementations

**SBCL (Steel Bank Common Lisp)** — the de facto standard free implementation. Forked from CMUCL in 1999 by William Newman. Native compiler, generational GC, portable across x86/x86-64/ARM64/PowerPC, runs on Linux/macOS/Windows/BSD. Extremely strong type inference. SBCL is what most new Common Lisp projects target by default. Current version as of late 2025: 2.5.x series. Released monthly. "Steel Bank" = Carnegie Mellon (Andrew Carnegie steel + Mellon banking), honoring its CMUCL roots.

**CCL (Clozure Common Lisp)** — fast compile times, strong on macOS (was the only reasonable CL on PPC Macs for years), developed by Clozure Associates. Derived from Macintosh Common Lisp (MCL). Good support for multithreading. Formerly known as OpenMCL. Notable for very fast startup and good foreign function interface. Not "Closure" — that's Clojure. CCL is named for Clozure Associates.

**ECL (Embeddable Common Lisp)** — compiles Common Lisp to C, which is then compiled by GCC or Clang. This makes ECL ideal for embedding CL into C/C++ applications. Juan Jose Garcia-Ripoll is the primary maintainer. Used by Maxima (the computer algebra system) as one of its supported hosts.

**ABCL (Armed Bear Common Lisp)** — runs on the JVM. Translates Common Lisp to JVM bytecode. Enables full Java interop from Common Lisp. Useful for teams that need JVM access but want Common Lisp. Performance is slower than SBCL/CCL but acceptable. Maintained by Mark Evenson.

**CLISP** — portable bytecode interpreter, very old (Bruno Haible and Michael Stoll started it in 1992). Written in C. Runs everywhere, including tiny embedded platforms. Not fast, but compatibility is legendary. Supported internationalization before anyone else in CL.

**Allegro CL** — commercial, Franz Inc (Oakland, California). The direct descendant of Franz Lisp. Used by ITA Software, NASA JPL, Naval Research Lab, Boeing. Has a proprietary AllegroCache object database. Expensive license; academic discounts available.

**LispWorks** — commercial, LispWorks Ltd (Cambridge, UK). Originally Harlequin. Known for a good cross-platform IDE and CAPI GUI toolkit. Used by Mirai (see below) and Opusmodus.

**CMUCL** — Carnegie Mellon University Common Lisp. SBCL's direct ancestor. Still maintained as a separate project because it supports platforms SBCL doesn't. The Python compiler (no relation to the language Python — the compiler predates it by years) was CMUCL's innovation: a sophisticated optimizing compiler with excellent type inference. SBCL inherited Python.

**GCL (GNU Common Lisp)** — older, uses GCC as a backend. Used by Maxima historically, by ACL2 (the theorem prover) today. Slower development pace. Not usually chosen for new projects.

**MKCL (ManKai Common Lisp)** — ECL fork focused on threading and Windows support. Jean-Claude Beaudoin maintains it. Small user base but technically interesting.

**Mezzano** — an operating system written in Common Lisp, by Henry Harrington. Boots to a Lisp machine-like environment. Not production, but a working proof that you can still build a Lisp OS in 2025. x86-64 only. Dominates the small world of "modern Lisp OS" experiments.

### 2.4 Quicklisp — The Turning Point (2010)

Before 2010, installing Common Lisp libraries meant downloading tarballs from random FTP sites, figuring out ASDF paths by hand, and debugging compatibility issues with no index. The ecosystem was tangled and demoralizing.

**Quicklisp**, released October 2010 by Zach Beane (pseudonym "Xach"), changed everything. A single `(ql:quickload :alexandria)` would fetch, resolve dependencies, compile, and load any library. Quicklisp distributes a curated set of libraries that are tested monthly against SBCL on Linux — if a library breaks, it gets dropped from the next dist until the maintainer fixes it.

As of 2025, Quicklisp tracks approximately 2,200 libraries in the monthly dist. The dist system is versioned; you can pin to specific dates for reproducibility.

Quicklisp is hosted at quicklisp.org, mirrored across several sites. Beane still maintains it personally. There has been ongoing work toward a successor (Ultralisp for faster update cadence, CLPM for more formal dependency management, ocicl for OCI-based distribution) but Quicklisp remains the default.

### 2.5 ASDF — The Build System

**ASDF (Another System Definition Facility)** is the de facto build and module system for Common Lisp. Originated by Dan Barlow in 2001-2002 as a replacement for the older MK:DEFSYSTEM. Now maintained by Robert Goldman. ASDF 3 (2013) is a significant rewrite by François-René Rideau that added bundling, self-upgrade, and the UIOP portability layer.

An ASDF system definition looks like:

```lisp
(defsystem "my-project"
  :version "0.1.0"
  :author "Your Name"
  :license "BSD-3-Clause"
  :depends-on ("alexandria" "cl-ppcre" "bordeaux-threads")
  :components ((:module "src"
                :components ((:file "package")
                             (:file "util" :depends-on ("package"))
                             (:file "main" :depends-on ("util"))))))
```

Every major implementation ships ASDF. Quicklisp extends ASDF with network-aware resolution.

### 2.6 Major Libraries

- **alexandria** — the "standard utilities that should have been in ANSI" library. `with-gensyms`, `compose`, `curry`, `hash-table-keys`, `plist-alist`, `flatten`, `shuffle`, etc. Maintained by a rotating cast including Nikodemus Siivola. Every CL project depends on it.
- **bordeaux-threads** — portable threading abstraction. Hides implementation differences in `make-thread`, mutexes, condition variables. Greg Pfeil, Dan Knapp maintain it.
- **cl-ppcre** — Portable Perl-Compatible Regular Expressions. Written by Edi Weitz. Pure Common Lisp, often faster than compiled C regex libraries because of type specialization at compile time.
- **hunchentoot** — HTTP server, also Edi Weitz. Production-capable, simpler than Clack.
- **Clack** — Rack/WSGI-inspired HTTP abstraction, by Eitaro Fukamachi. The backbone of modern CL web work.
- **Caveman2** — web framework on Clack, also Fukamachi. Model-View-Controller-ish.
- **Radiance** — alternative web framework by Shinmera (Nicolas Hafner). Emphasis on multi-site hosting.
- **Lucerne** — microframework by Fernando Borretti.
- **postmodern** — PostgreSQL client. Direct wire protocol implementation, no libpq dependency. Marijn Haverbeke wrote it originally.
- **cl-dbi** — database-independent interface, Fukamachi.
- **mito** — ORM on cl-dbi, Fukamachi.
- **sxql** — SQL expression DSL, Fukamachi (the Fukamachi stack is real and it is the modern way).
- **cl-json** — JSON encoder/decoder. Yason and jzon are also used.
- **jzon** — newer, faster, spec-compliant JSON library. Vincent Toulouse.
- **cl-who** — HTML generation. Weitz.
- **Spinneret** — HTML generation with indentation. Paul M. Rodriguez.
- **parenscript** — compiles a Common Lisp subset to JavaScript. Older than ClojureScript. Still used for server-side Lisp projects that need a bit of JS.
- **cffi** — C Foreign Function Interface. Portable across implementations. James Bielman started it, Luís Oliveira took over.
- **trivia** — pattern matching library. Masataro Asai.
- **optima** — older pattern matching library, largely superseded by trivia.
- **lparallel** — parallel computation library, James Anderson (not the jazz musician).
- **fiveam** — test framework. "Fiveam is 4+1am (for AM), meaning 'another machine'" — Ed Marco. Modern CL testing.
- **parachute** — another test framework, Shinmera.
- **prove** — Fukamachi test framework.
- **rove** — Fukamachi's newer test framework meant to replace prove.
- **log4cl** — logging, by Max Mikhanosha. Port of log4j concepts.
- **series** — lazy sequences. Not in the ANSI standard but close to it.
- **iterate** — `loop` alternative with a more Lispy syntax.
- **cl-async** — async I/O on libuv, Andrew Danger Lyon.
- **Woo** — very fast HTTP server, Fukamachi. Built on libev.
- **Clingon** — command-line argument parser. Marin Atanasov Nikolov.
- **unix-opts** — older CLI parser.
- **bknr.datastore** — in-memory object store with transaction logging. Used by bknr.web.
- **cl-store** — serialization.
- **conspack** — binary serialization, faster than cl-store.
- **ironclad** — cryptographic library. Nathan Froyd. The CL equivalent of OpenSSL's crypto layer.
- **closer-mop** — portable Metaobject Protocol. The MOP is the killer feature of CLOS for metaprogrammers.
- **trivial-garbage** — portable finalizer/weak-pointer interface.
- **trivial-features** — portable `*features*` normalization.
- **cl-plot** — plotting, there's also vgplot and eazy-gnuplot.
- **lisp-stat** — statistics, Steven Nunez. A revival of XLisp-Stat ideas.
- **Nyxt** — a Common Lisp web browser (not exactly a library, but built in CL). Formerly known as Next. Atlas Engineer.
- **maxima** — computer algebra system descended from MIT's Macsyma. Runs on several CL implementations.
- **CLIM** and **McCLIM** — Common Lisp Interface Manager. CLIM was the Symbolics GUI framework. McCLIM is the free software reimplementation, used by Nyxt for some components and by a small but dedicated community.

### 2.7 The Awesome-CL List

`github.com/CodyReichert/awesome-cl` is the community's curated index. Approximately 1,500 entries organized by category. It has become the de facto "what libraries exist" reference for Common Lisp.

### 2.8 Common Lisp In Production

Common Lisp in production is quiet but real. The companies that use it usually don't talk about it, because their advantage is internal and they don't want to train competitors.

**ITA Software / Google** — the most famous story. ITA Software built **QPX**, a flight search and pricing engine, in Common Lisp running on Allegro CL. Orbitz, United, American, Kayak, and others paid ITA to query QPX. ITA handled the terrifying combinatorial complexity of airline fare rules in Common Lisp because Common Lisp's speed plus flexibility made the impossible computations tractable. Google acquired ITA for **$700 million in 2010**, principally for QPX. The system ran for years inside Google, and parts of it still do, though Google is reportedly migrating off. QPX was the single strongest case study for "Lisp can do what other languages cannot."

**Grammarly** — the initial backend of Grammarly was Common Lisp. Co-founder Dmytro Lider has spoken about this in interviews. As Grammarly grew, the team eventually rewrote parts in other languages, but CL got them to product-market fit. Grammarly was founded in 2009 in Kyiv by Max Lytvyn, Alex Shevchenko, and Dmytro Lider.

**Mirai / Nichimen Graphics / Izware** — professional 3D animation software in Common Lisp. Used for **Gollum in Peter Jackson's Lord of the Rings films** (Weta Digital). Mirai's ancestor was N-World from Nichimen Graphics. The CL-based modeling tools were prized for their flexibility. Izware, the successor company, continued to sell Mirai into the 2000s.

**Opusmodus** — algorithmic music composition environment, written in Common Lisp, based on LispWorks. Commercial product for composers. Janusz Podrazik is the lead developer. Used by contemporary composers to generate scores based on mathematical and musical rules.

**Yandex** — the Russian search engine. Parts of the infrastructure have historically used Common Lisp. Yandex employed notable Lisp developers; some of the big Lisp conferences had Yandex sponsorship.

**Ravenpack** — financial analytics firm based in Marbella, Spain. Their big data analytics platform includes Common Lisp. Wrote a 2014 article about their use: "Why We Chose Common Lisp."

**Franz Inc** — sells Allegro CL, Allegrograph (a graph database), Gruff (graph visualization), and builds custom Lisp-based systems for clients. Franz has been in continuous operation since 1984 and has survived purely on Lisp revenue — a small but existence-proof that a Lisp-only business is viable.

**Viaweb** — Paul Graham's 1995-1998 e-commerce startup. Written in Common Lisp. Acquired by Yahoo in 1998 for $49 million, became Yahoo Store. Yahoo later rewrote it in C++ and lost much of its flexibility. Graham's famous essay "Beating the Averages" (2003) is the locus classicus of "Lisp as secret weapon" rhetoric. The Viaweb codebase was in CLISP, then Allegro.

**Siscog** — Portuguese company, rail transportation scheduling software. Common Lisp since 1986. Clients include Deutsche Bahn, SNCF, Jernbaneverket. Still running on Common Lisp in 2025.

**Naughty Dog** (the game studio behind Crash Bandicoot, Jak and Daxter, Uncharted) — used **GOAL (Game Oriented Assembly Lisp)** and its successor **GOOL** during the PlayStation 2 era. GOAL was a custom Lisp-2 dialect with inline assembly for the PS2's Vector Units. The decompilation project, Jak Project (github.com/open-goal/jak-project), has reconstructed the toolchain for preservation.

**Rigetti Computing** — quantum computing startup. Uses Common Lisp for the Quil quantum instruction language toolchain: `quilc` (compiler) and `qvm` (quantum virtual machine). Released as open source (github.com/quil-lang). Rigetti uses SBCL in production. Robert Smith at Rigetti has been an active CL community figure.

**SISCOG, BioBike, ACL2** — research and scheduling applications in Common Lisp. ACL2 is the industrial theorem prover that AMD used to formally verify parts of its floating-point unit; it runs on GCL historically, supports more hosts now.

### 2.9 The Community

**r/lisp** and **r/common_lisp** on Reddit.
**Planet Lisp** (planet.lisp.org) — the blog aggregator, still alive.
**European Lisp Symposium (ELS)** — annual conference, has run since 2008. 2024 was in Vienna. 2025 was in Hamburg. Proceedings archived.
**Libre Lisp Wednesday** — streaming show run by community members.
**Lisp Discord** — the main real-time venue.
**#commonlisp on Libera.Chat** — IRC channel, still active.
**Common Lisp Foundation** — a 501(c)(3) organized to fund CL development work. Organizes grants for SBCL, Quicklisp, and other infrastructure.

---

## 3. Scheme — The Elegant Minimalist

### 3.1 The Birth at MIT (1975)

In 1975, Guy Steele and Gerald Sussman at the MIT AI Lab wrote a tiny Lisp dialect to explore Carl Hewitt's Actor model. They discovered something unexpected: with proper tail call optimization and first-class functions, the Actor model and the lambda calculus were essentially the same thing.

They called the language **Schemer** at first, but the ITS filesystem limited filenames to six characters. **SCHEME** it was.

### 3.2 The Lambda Papers (1975-1980)

Steele and Sussman wrote a series of MIT AI Memos that revolutionized programming language theory:

- "Scheme: An Interpreter for Extended Lambda Calculus" (1975, AI Memo 349)
- "Lambda: The Ultimate Imperative" (1976, AI Memo 353)
- "Lambda: The Ultimate Declarative" (1976, AI Memo 379)
- "Debunking the 'Expensive Procedure Call' Myth" (1977, AI Memo 443)
- "The Art of the Interpreter, or the Modularity Complex" (1978, AI Memo 453)
- "Rabbit: A Compiler for Scheme" (1978, Steele's master's thesis)
- "Design of LISP-based Processors" (1979, AI Memo 514)
- "The Dream of a Lifetime: A Lazy Variable Extent Mechanism" (1980)

These papers established that proper tail recursion, lexical scoping, and first-class continuations were sufficient to express any control structure. They launched an entire research program in language design.

### 3.3 The Design Principles of Scheme

The opening of the RnRS reports captures the aesthetic:

> "Programming languages should be designed not by piling feature on top of feature, but by removing the weaknesses and restrictions that make additional features appear necessary."

This is the Scheme credo. Four commitments followed:

1. **Lexical scoping by default** — not dynamic scoping as in older Lisps. Variables refer to their lexically enclosing binding. This is the single most important semantic break from MACLISP.
2. **Tail call optimization mandated** — a conforming Scheme must eliminate tail calls, so that `(loop)` with a tail-recursive call runs in constant stack space. This makes iteration via recursion viable.
3. **First-class continuations** via `call-with-current-continuation` (`call/cc`). You can capture the current control state, store it, invoke it later. This lets Scheme express coroutines, exceptions, generators, and concurrency abstractions directly.
4. **One namespace for functions and values** — Scheme is a "Lisp-1" (one namespace), where Common Lisp is a "Lisp-2" (separate namespaces for functions and variables). The Lisp-1 vs Lisp-2 debate rages to this day.

### 3.4 The RnRS History

The **Revised Report on the Algorithmic Language Scheme** series is the ongoing community specification. Each version nicknamed "RnRS" where n is the revision number.

- **R1RS (1978)** — "Revised Report on Scheme: A Dialect of Lisp". Sussman and Steele. Roughly equivalent to the internal MIT lab report.
- **R2RS (1985)** — the first externally-published report, in *The MIT Press*. 25 pages.
- **R3RS (1986)** — roughly the same size, cleaned up. Published in SIGPLAN Notices.
- **R4RS (1991)** — added delayed evaluation primitives (`delay`, `force`). Hygienic macros introduced but optional.
- **R5RS (1998)** — **the classic Scheme report**. 50 pages including index. Hygienic macros via `syntax-rules` become mandatory. Tail calls formally specified. This is the version most textbooks teach.
- **R6RS (2007)** — the controversial expansion. Suddenly Scheme had a module system, records, exception system, bytevectors, Unicode strings, a mandatory standard library of ~90 pages. 162 pages total. The community **fractured**. Some implementations (PLT Scheme/Racket, Ikarus, Larceny, Ypsilon, Mosh) embraced it. Others (Chicken, Gambit, Guile, Chez at first) refused. A steering committee vote to ratify was split.
- **R7RS-small (2013)** — a deliberate reset. Returned to the R5RS spirit: a small core (~80 pages) that every implementation could realistically support. Alex Shinn chaired the working group.
- **R7RS-large** — an ongoing effort to define optional extensions (data structures, numeric tower, etc.) as modular additions. Has been underway for over a decade; progress is slow but real. John Cowan took leadership, John Cowan's progress reports are the canonical status.

### 3.5 The R6RS Schism

The R6RS split is the single most important social event in Scheme history. The fight was about whether Scheme should grow into a full industrial language with batteries included (the R6RS view) or remain a tiny elegant core that implementations extend in their own way (the R5RS/traditional view). Neither side conceded, and the community fragmented. Racket went its own way. Chicken stayed conservative. Guile gradually absorbed R6RS features but kept its own identity. Chez supported R6RS and then some.

The lasting consequence: Scheme today is less a single language than a family of related languages that share a common core. If you learn Scheme in one implementation, most of your knowledge transfers, but real programs rarely port unchanged.

### 3.6 Implementations — Living Schemes

**MIT/GNU Scheme** — the MIT reference implementation, now under GNU. Not the fastest, not the newest, but canonical. Comes with `edwin` (an Emacs-like editor written in Scheme). Jacob Matthews and others maintain.

**Guile** — GNU's official extension language since 1995. Embedded in many GNU programs: GnuCash, GNU Shepherd (the GuixSD init system), Lilypond (music typesetting), GDB (as one of its scripting languages), TeXmacs. Guile 3 (2020) added JIT compilation via its "BDW" GC and a bytecode VM. Andy Wingo is the lead developer and writes one of the best programming-language-implementation blogs (wingolog.org). Guile is the backbone of **GNU Guix**.

**Racket** — see section 4. Originally PLT Scheme, rebranded 2010.

**Chez Scheme** — R. Kent Dybvig at Indiana University, starting in 1984. Commercial for many years, then acquired by Cisco in 2011, then **open-sourced in 2016** under Apache 2. Widely considered the fastest Scheme implementation. Racket rebuilt itself on Chez (the "Racket CS" project, 2019) to inherit Chez's speed. Chez is now maintained by a small team at Cisco and the community.

**Chicken Scheme** — Felix Winkelmann, 2000. Compiles Scheme to C via a trampolined CPS transformation (based on a 1994 paper by Henry Baker, "Cons Should Not CONS Its Arguments, Part II: Cheney on the M.T.A."). The Chicken approach treats the C stack as a nursery: tail calls just recurse until the stack hits a limit, then a GC copies live data to the heap and the stack unwinds. It sounds insane; it works. Chicken is used for shipping deployable scripts and binaries. Version 5 is current.

**Gambit Scheme** — Marc Feeley at Université de Montréal. Compiles to C. Good numerics, strong real-time GC. Has a JavaScript backend too (Gambit/JS). Feeley also created **Termite**, a message-passing concurrent Scheme on Gambit inspired by Erlang.

**Gerbil Scheme** — Drew Crampsie (aka Dr. Tlön), built on Gambit. A modern, more Racket-flavored Scheme with improved module system, pattern matching, and actor support. Ships with a standard library. Aimed at being a practical systems Scheme. gerbil.scheme.org.

**Bigloo** — Manuel Serrano at INRIA. Scheme-to-C compiler, also targets JVM and .NET. Focus on high-performance compiled Scheme with foreign language interop. Static type inference. Has an object system (Bigloo modules).

**Kawa** — Per Bothner, starting 1996. Scheme on the JVM. Compiles Scheme to JVM bytecode with tight Java integration. Used inside the Kawa-based BRL templating system. Active.

**Sagittarius Scheme** — R6RS and R7RS implementation. Takashi Kato. Modern and active; has strong library support.

**Gauche** — Shiro Kawai. Scheme with an emphasis on Unix scripting. Excellent documentation in both English and Japanese. R7RS-small compliant. `gosh` is the interpreter. Kawai also wrote *Practical Scheme Programming* (in Japanese).

**Ypsilon** — Yoshikatsu Fujita. R6RS, discontinued but historically important.

**Ikarus** — Abdulaziz Ghuloum, PhD work at Indiana. Extremely fast R6RS compiler. Abandoned around 2010. Its successor:

**Vicare** — continuation of Ikarus. Small community.

**Larceny** — William Clinger, Felix Klock, and Lars Hansen at Northeastern. R6RS + R5RS modes. "Larceny" because "Clinger's dishonest". The CMUCL of the Scheme world.

**BiwaScheme** — Scheme implemented in JavaScript, by Yutaka Hara. Runs in browsers.

**Scheme.js / JSScheme / schism** — various others.

**PICOBIT, BIT, Schemix** — tiny Schemes for embedded systems.

**LispKit** — Matthias Zenger, Scheme in Swift/iOS.

**CHIBI Scheme** — Alex Shinn. Tiny R7RS-small implementation in C. Used as a reference implementation for R7RS. Embeddable, readable.

**Sagittarius, Loko, Cyclone** — other modern Schemes, all active.

**Loko Scheme** — Göran Weinholt. R6RS + R7RS-small. Runs bare-metal on x86-64 and on Linux. Notable for running without an operating system. Can be used as a hobbyist OS kernel language.

**Cyclone Scheme** — Justin Ethier. Compiles to C. R7RS. Concurrent GC based on the Baker paper.

### 3.7 Scheme in Education: SICP

*Structure and Interpretation of Computer Programs* (SICP, 1985, MIT Press) by Abelson, Sussman, and Sussman was the MIT introductory CS course from 1980 to 2008. It taught programming using Scheme as the vehicle but the subject was abstraction, not Scheme. SICP worked its way through data abstraction, higher-order procedures, assignment and state, modularity, metalinguistic abstraction, and register machines.

In 2008 MIT replaced SICP with a Python-based course. The stated reason: modern engineering students build by gluing libraries together rather than by building things from first principles, so a language with many libraries (Python) suits the curriculum better. SICP purists regarded this as civilizational decline. The book is still in print; the course is still taught at many universities; a JavaScript adaptation, "SICP JS," was published in 2022 by Sourav Sen Gupta and others.

### 3.8 *How to Design Programs* (HtDP)

Matthias Felleisen, Robert Bruce Findler, Matthew Flatt, and Shriram Krishnamurthi wrote *How to Design Programs* (MIT Press, first edition 2001, second edition 2018) as a more structured, explicitly pedagogical alternative to SICP. HtDP introduces "the design recipe": a stepwise method for going from problem statement to working code through data definition, examples, template, implementation, and tests. It uses a student-friendly Scheme subset ("Beginning Student Language") that grows progressively.

HtDP is the teaching language for **Bootstrap**, a widely deployed middle-school and high-school programming curriculum that uses Racket for algebra instruction.

### 3.9 DrRacket (formerly DrScheme)

**DrRacket** is the IDE that PLT built for teaching Scheme/Racket. It handles multiple language levels (from "Beginning Student" through full Racket), checks student code against the appropriate level, and gives precise error messages pointing to the exact source location. Its pedagogical design is cited as the gold standard for teaching environments. Matthew Flatt, Robby Findler, and others have refined it over 25 years.

### 3.10 Scheme in the Wild

- **Emacs-like editors**: **Edwin** (MIT/GNU Scheme), **Zile** (historically), various research editors.
- **GNU Shepherd**: the init system of GuixSD, written in Guile.
- **GNU Guix**: a functional package manager (Nix-like) written in Guile. Package definitions are Guile code.
- **Lilypond**: music typesetting, uses Guile internally for extensions.
- **GnuCash**: uses Guile for scripting and reports.
- **TeXmacs**: scientific document editor, uses Guile.
- **AutoCAD**: (actually AutoLISP, which is a Scheme-like but not Scheme — see section 7).
- **Chicken Egg repo**: the Chicken package system for deployable CLIs and web backends.

---

## 4. Racket — Languages as Libraries

### 4.1 From PLT Scheme to Racket

The PLT research group at Rice, Northwestern, Utah, and Northeastern built **PLT Scheme** starting in 1995. PLT stood for "Programming Language Team." Matthias Felleisen founded the group; Matthew Flatt, Robby Findler, Shriram Krishnamurthi, and many others drove it.

In **2010**, PLT Scheme rebranded as **Racket**. The rename signaled that PLT had grown beyond being "just a Scheme implementation" into a language platform with its own identity.

### 4.2 The Central Idea: Language-Oriented Programming

Racket's slogan is "Racket is a language for making languages." Where other Lisps give you macros for syntactic abstraction within a single language, Racket gives you the tools to define entirely new languages with their own syntax, semantics, documentation, and tooling — and to use them from a single source file via the `#lang` directive.

```racket
#lang racket
(displayln "This file is written in Racket.")
```

```racket
#lang typed/racket
(: factorial (-> Integer Integer))
(define (factorial n)
  (if (zero? n) 1 (* n (factorial (- n 1)))))
```

```racket
#lang scribble/manual
@title{My Document}
This is a document written in Scribble.
```

Each `#lang` declaration selects a reader, an expander, and a runtime. Files in different languages can interoperate as long as they communicate through the Racket module system.

### 4.3 The `#lang` Ecosystem

- `#lang racket` — full Racket, the default.
- `#lang racket/base` — a minimal Racket subset (useful for fast startup).
- `#lang typed/racket` — Racket with sound gradual types.
- `#lang plai` — the teaching language for "Programming Languages: Application and Interpretation" by Shriram Krishnamurthi.
- `#lang lazy` — lazy Racket.
- `#lang scribble/base`, `#lang scribble/manual` — documentation languages.
- `#lang datalog` — Datalog implementation by Jay McCarthy.
- `#lang algol60` — a literal Algol 60 implementation (by John Clements) to show that you can.
- `#lang s-exp` — the S-expression reader for bootstrapping other languages.
- `#lang pollen` — Matthew Butterick's language for book publishing.
- `#lang brag` — Matthew Butterick's parser generator language.
- `#lang parser-tools` — LALR parser tools.
- `#lang slideshow` — presentation language.
- `#lang frog` — static site generator.
- `#lang rosette` — see below, symbolic execution.
- `#lang web-server` — the Racket web server's continuation-based framework.

The Racket distribution ships with dozens of languages; the package repository includes hundreds more.

### 4.4 DrRacket — The Teaching Environment

DrRacket (formerly DrScheme) is widely regarded as one of the best programming environments ever built for teaching. Features:

- **Student language levels** — a drop-down to select "Beginning Student", "Beginning Student with List Abbreviations", "Intermediate Student", "Intermediate Student with Lambda", "Advanced Student", "Pretty Big", "Racket". Error messages and features are filtered per level.
- **Check Syntax** — draws arrows from bindings to uses, colors identifiers by binding, shows free variables.
- **Stepper** — step through evaluation with substitution semantics, showing the program rewriting itself.
- **Integrated debugger**.
- **Error messages with source locations** highlighting the exact character range.
- **Macro stepper** for inspecting how macros expand.
- **Unit testing integration** via RackUnit.
- **Scribble preview** for writing documentation.

### 4.5 *How to Design Programs* (HtDP, revisited)

HtDP is the canonical Racket textbook. Its "design recipe" teaches structured thinking about data and programs that has become influential in CS pedagogy far beyond Racket.

### 4.6 Typed Racket — Sound Gradual Typing

Typed Racket, begun by Sam Tobin-Hochstadt in 2008, adds a static type system on top of Racket. It is not just optional — it is **sound**: the type system guarantees at compile time that typed code will not encounter type errors at runtime, even when it interacts with untyped code, via automatic contract generation at the boundaries.

Typed Racket supports occurrence typing (the type refines based on control flow), union and intersection types, subtyping, polymorphism, and pattern matching. It is the poster child for gradually-typed language research. The 2008 paper "The Design and Implementation of Typed Scheme" is a foundational gradual-typing paper.

### 4.7 Scribble — Documentation as a Language

Scribble is Racket's documentation system. Documentation is a Racket program; the `@`-syntax provides a TeX-like surface for prose with embedded code:

```racket
#lang scribble/manual
@title{The Racket Guide}
@author{Matthew Flatt, Robby Findler}

@section{Introduction}

Racket is a @emph{general-purpose} programming language.
See @secref{tutorial} for a tutorial.
```

Scribble produces HTML, PDF, LaTeX, and plain text. The entire Racket documentation (1,000+ pages) is written in Scribble. Scribble's separation of content and rendering has made it a surprisingly capable document production system in its own right, which leads to:

### 4.8 Pollen — Publishing with Racket

**Pollen**, by Matthew Butterick (the typographer behind *Practical Typography*), is a Racket-based publishing system for books and essays. Butterick's own books (*Practical Typography*, *Beautiful Racket*) are built with Pollen. Pollen is closer to a static site generator with a powerful macro-based DSL for content.

### 4.9 *Beautiful Racket*

Butterick's *Beautiful Racket* (beautifulracket.com) is the canonical tutorial on language-oriented programming in Racket. It walks the reader through building small DSLs: a BASIC-like language, a CSS-like language, a stack-based language, and more. Free to read online.

### 4.10 The Bootstrap Curriculum

**Bootstrap:Algebra** uses Racket to teach algebra to middle-school students. Students write game code to reinforce variables, functions, and data definitions that mirror standard algebra 1 concepts. Bootstrap is deployed in hundreds of schools worldwide and has produced peer-reviewed evidence of learning gains. Emmanuel Schanzer founded Bootstrap; Kathi Fisler and Shriram Krishnamurthi have been closely involved.

### 4.11 Macros: syntax-rules, syntax-case, syntax-parse

Racket is the home of the most sophisticated macro system in any language.

- **`syntax-rules`** — the original hygienic macro system from R5RS. Pattern-based, no side effects.
- **`syntax-case`** — from R6RS. Lets you run arbitrary code during expansion while preserving hygiene. Ryan Culpepper and others refined it.
- **`syntax-parse`** — Racket's modern macro tool. Declarative syntax classes, good error messages, composable specifications. Ryan Culpepper's 2012 dissertation covers its design.

### 4.12 Rosette — Solver-Aided Programming

**Rosette**, by Emina Torlak at the University of Washington, is a Racket-based language for writing programs that automatically verify, synthesize, or debug themselves via SMT solvers. A Rosette program looks like a normal functional program, but you can ask "does there exist an input that makes the assertion fail?" and Rosette calls Z3 to answer. Used for verifying memory models, synthesizing code transformations, and teaching program analysis.

Rosette is the flagship example of what language-oriented Racket programming enables: an entire research area (solver-aided programming) implemented as a `#lang`.

### 4.13 Racket's Runtime History

- **Racket BC** (Before Chez) — the original C-based runtime used from 1995 to 2019.
- **Racket CS** (Chez Scheme) — 2019 onwards. Racket rebuilt its runtime on top of Chez Scheme, inheriting Chez's mature compiler and GC. Most users benefited from a 2x-3x performance improvement transparently.

### 4.14 Shipping Racket Programs

- `raco exe` bundles a Racket program into a standalone executable.
- `raco distribute` creates distributable directories.
- `raco pkg install` manages packages from the Racket package catalog.
- The Racket package repository has ~2,000 user packages.

---

## 5. Clojure — The Modern Pragmatist

### 5.1 Rich Hickey and the Origins (2005-2007)

Rich Hickey, an independent consultant in New York, had been writing Common Lisp and Java professionally for years. He wanted a Lisp for the JVM because that's where the enterprise work was, and the JVM's libraries were overwhelming compared to anything Common Lisp had. Existing JVM Lisps (Clojure's predecessors include Kawa, Armed Bear CL, JScheme) were either Schemes without good Java interop or just-portable-enough CL without the Java ecosystem.

Hickey took a sabbatical from 2005 to 2007 to design and build Clojure. He chose immutability as the default, persistent data structures based on Phil Bagwell's HAMT, lexical scoping, and a single namespace (Lisp-1). He released Clojure in October 2007 as open source.

### 5.2 Design Motivations

The core theses of Clojure:

1. **Immutability as default** — data structures are persistent (see below). Mutation is opt-in via reference types.
2. **Functions over methods** — dispatch on protocols, not on a single receiver's class hierarchy.
3. **Hosted language** — Clojure is explicitly a guest on the JVM (and later JS, CLR, BEAM, Dart). It embraces host interop rather than reimplementing libraries.
4. **Data over code** — prefer data structures (maps, vectors) for configuration and messaging over classes and interfaces. "Data is the API."
5. **Concurrency-safe primitives** — STM, agents, atoms, refs.
6. **Values over places** — "The Value of Values" (Hickey's 2012 JaxConf talk) argues that programming should manipulate immutable values rather than mutable locations.

### 5.3 Persistent Data Structures

Clojure's maps, vectors, and sets are **persistent** in the functional-programming sense: every "update" returns a new data structure that shares structure with the old. Under the hood these are implemented as **Hash Array Mapped Tries (HAMTs)** — a trie with a 32-way branching factor — based on Phil Bagwell's 2000 paper "Ideal Hash Trees." Clojure improved on Bagwell's design for persistent use.

The result: `(assoc m :k v)` runs in effective O(1) time and returns a new map that shares 99%+ of its structure with `m`. This is what makes immutability practical: you don't pay for copying because there is almost no copying.

Scala, Elm, Immutable.js, and other languages adopted HAMT-based persistent data structures after Clojure popularized them.

### 5.4 Reference Types

Clojure separates immutable values from mutable references. Four reference types:

- **Atom** — synchronous, uncoordinated, single-value reference. `(swap! a f)` applies `f` atomically. Used for most mutable state.
- **Ref** — synchronous, coordinated, transactional reference. Refs are updated inside a `dosync` block that provides STM semantics.
- **Agent** — asynchronous, uncoordinated. Actions sent to agents run on a thread pool; the agent's value updates when the action completes.
- **Var** — thread-local dynamic binding, also the default for top-level definitions.

This typology of references by (synchronous/async × coordinated/uncoordinated) is original to Clojure and frequently cited in concurrency literature.

### 5.5 core.async — CSP for Clojure

**core.async** (2013), by Rich Hickey and Timothy Baldridge, adds CSP-style channels to Clojure. Inspired by Go's goroutines and channels, implemented via a continuation-passing-style macro transformation so that `(<! channel)` can suspend without requiring threads. Supports timeouts, alt!, pub/sub, and pipelines.

### 5.6 Transducers

**Transducers** (2014) are Hickey's composable transformation protocol. A transducer is a function from reducing function to reducing function. `map`, `filter`, `take`, etc., each return a transducer when called with only a transformation function. You can compose transducers with `comp` and then apply them to a sequence, a channel, or any reducible collection:

```clojure
(def xform (comp (map inc) (filter even?) (take 10)))
(into [] xform (range 100))  ;; => [2 4 6 8 10 12 14 16 18 20]
```

Transducers decouple the transformation from the input/output representation. This is a sophisticated functional-programming abstraction.

### 5.7 spec

**clojure.spec** (alpha in 2016, alpha2 in 2019) is Clojure's runtime data specification and validation library. It lets you describe the shape of data (including function arguments and return values) and automatically generates test data via test.check.

```clojure
(s/def ::email (s/and string? #(re-matches #".+@.+\..+" %)))
(s/def ::user (s/keys :req-un [::name ::email ::age]))
```

spec is controversial: it's runtime, not static; its nilable/optional story is contested; Hickey's 2018 "Maybe Not" talk critiques Option types and advocates for spec's approach.

### 5.8 Build Tooling

**Leiningen** — the original Clojure build tool, 2009, by Phil Hagelberg ("technomancy"). Named after a lumberjack in a Monty Python sketch. Configured via a `project.clj` file that is itself a Clojure data structure. Pulls dependencies from Clojars and Maven Central.

```clojure
(defproject my-project "0.1.0"
  :dependencies [[org.clojure/clojure "1.11.1"]
                 [ring/ring-core "1.11.0"]
                 [compojure "1.7.0"]]
  :main my-project.core)
```

**Boot** — alternative build tool from 2014, used dataflow pipelines. Less popular now.

**deps.edn / tools.deps** — the official build tool from Cognitect (2018). Simpler than Leiningen: a `deps.edn` file specifies dependencies, and `clj` or `clojure` invokes them. Paired with `tools.build` for creating artifacts. This is the modern recommendation.

```clojure
{:deps {org.clojure/clojure {:mvn/version "1.11.1"}
        ring/ring-core {:mvn/version "1.11.0"}}}
```

**shadow-cljs** — the modern ClojureScript build tool, by Thomas Heller. Handles JS interop, npm integration, hot reloading, code splitting.

### 5.9 REPL Culture

Clojure elevated REPL-driven development back to first-class status after decades of its fading in mainstream practice. Modern Clojure workflow:

- Start a REPL connected to your running program.
- Edit code in your editor.
- Evaluate forms (`C-x C-e` in CIDER, `Alt+Enter` in Cursive/Calva).
- Inspect results inline.
- Redefine functions on the fly.
- The running program updates without restart.

**nREPL** (network REPL, by Chas Emerick, 2010) is the protocol that allows editors to connect to remote Clojure REPLs. CIDER, Cursive, Calva, Conjure, fireplace.vim all speak nREPL.

### 5.10 Clojars

**Clojars** (clojars.org) is the community Maven-compatible repository for Clojure libraries. Founded 2009 by Alex Osborne. It's where almost all Clojure open source lives. Integrates with Leiningen and deps.edn.

### 5.11 Clojure in Production

Clojure is the Lisp most visible in the industry today.

**Nubank** — the largest Clojure shop in the world. Brazilian digital bank, founded 2013 in São Paulo by David Vélez, Cristina Junqueira, and Edward Wible. Chose Clojure as primary language for backend services. As of 2025 Nubank employs **over 1,000 Clojure developers**, making it by far the largest concentration of Clojure engineers at any single company. Nubank acquired Cognitect (the company Rich Hickey cofounded, which was the commercial home of Clojure) in 2020, effectively bringing Clojure's core stewardship in-house.

**Walmart Labs** — Walmart's e-commerce infrastructure has used Clojure extensively since the early 2010s. Processing of holiday traffic for Walmart.com ran on Clojure-based services.

**Apple** — employs Clojure developers; uses Clojure for internal analytics and financial tooling. Apple job postings for Clojure roles have been visible for years.

**Puppet (Puppet Labs)** — the infrastructure automation company. Puppet Server and PuppetDB are written in Clojure. Puppet chose Clojure around 2013 when they rewrote their Ruby infrastructure for performance.

**Cisco** — uses Clojure for network configuration and management tools. Also hosts Chez Scheme's open source repo.

**Citi, Capital One, Goldman Sachs** — financial firms use Clojure in trading, analytics, and risk systems.

**NASA JPL** — has used Clojure for Mars rover mission planning. The paper "An Introduction to the JPL Clojure Community" circulated in 2015. Chris Mattmann at JPL has spoken about Clojure use.

**Netflix** — uses Clojure for several internal services, including parts of its playback and API infrastructure.

**Metabase** — open source business intelligence platform. Entirely written in Clojure (with a ClojureScript frontend). One of the most popular open-source BI tools on GitHub, with 40k+ stars. Metabase, Inc. is the company.

**Circle CI** — the CI/CD company. Core pipeline runner written in Clojure. Uses Clojure heavily for backend orchestration.

**Roam Research** — networked thought notebook. Backend in Clojure, frontend in ClojureScript. Roam Research popularized bidirectional linking in note-taking.

**Logseq** — open source alternative to Roam. Written in ClojureScript. Tiensonqin (Tien Son Nguyen) is the founder.

**Athens Research** — another open source Roam-like tool, ClojureScript.

**Juxt** — UK consultancy specializing in Clojure and data systems. Creators of XTDB (formerly Crux), a bitemporal database.

**Adgoji, Klarna, Funding Circle, Zalando, SoundCloud** — European firms that use or used Clojure at scale.

**Boeing** — there is anecdotal evidence of Clojure use in Boeing's internal tooling. Not widely publicized.

**Signify Health, CircleCI, Pitch, Stuart, Oxbotica** — more recent Clojure adopters.

### 5.12 Rich Hickey's Talks

Rich Hickey's conference talks are foundational reading for any modern Lisp programmer. The most cited:

- **"Simple Made Easy"** (Strange Loop 2011) — on the distinction between "simple" (un-braided, single-concern) and "easy" (familiar, proximate). One of the most-watched programming talks ever. Argues that we should chase simplicity even when it's unfamiliar.
- **"The Value of Values"** (JaxConf 2012) — argues that values are better than places. Immutability is a strength, not a limitation.
- **"Hammock Driven Development"** (Clojure/conj 2010) — the importance of thinking before coding. "Wakefulness overrated."
- **"Are We There Yet?"** (JVM Languages Summit 2009) — first major exposition of Clojure's concurrency model and why mutable state is the root of concurrency bugs.
- **"The Language of the System"** (Clojure/conj 2015) — on data as the API between systems.
- **"Effective Programs: 10 Years of Clojure"** (Clojure/conj 2017) — retrospective and manifesto on why Clojure chose what it chose.
- **"Maybe Not"** (Clojure/conj 2018) — critique of nilable types and option types. Controversial; beloved by Clojurians.
- **"Clojure Made Simple"** (JavaOne 2014) — pitched to Java developers.
- **"Transducers"** (Strange Loop 2014) — introduces transducers.
- **"Design, Composition, Performance"** (RailsConf 2013) — Hickey's views on design process.

Hickey stopped giving public talks around 2019-2020 but remains active on the Clojure mailing lists and internally at Nubank/Cognitect.

### 5.13 ClojureScript

**ClojureScript** (2011) brought Clojure to JavaScript. It targets browsers and Node.js. Originally relied on Google Closure Compiler for optimization; shadow-cljs is now the dominant build tool.

**Reagent** — a ClojureScript wrapper around React. Components are Clojure functions that return Hiccup-style vectors describing the DOM. State lives in atoms; React re-renders when the atom changes.

**re-frame** — an application framework built on Reagent. Unidirectional data flow (events, subscriptions, effects, handlers) inspired by Elm and Redux but with Clojure's emphasis on data. `day8/re-frame` has been the standard ClojureScript SPA framework for years.

**Fulcro** — another ClojureScript app framework, by David Nolen, Tony Kay. Uses the Pathom graph query library and EQL (Datomic's query language).

**Helix** — newer React wrapper using hooks, by Will Acton.

**UIx2** — another modern React wrapper.

### 5.14 Datomic

**Datomic** is Hickey's immutable database. Not open source (proprietary from Cognitect, now Nubank). Datomic stores "facts" (entity-attribute-value-transaction tuples) and never forgets them — you can query the database as of any point in time. The datalog query language is a pleasant fit for Clojure. Datomic is used by Nubank, Walmart, NASA JPL, and many Clojure shops.

### 5.15 XTDB (formerly Crux)

**XTDB**, formerly **Crux**, by Juxt (UK), is an open source bitemporal database inspired by Datomic. "Bitemporal" means it tracks both *valid time* (when a fact was true in the world) and *transaction time* (when the database learned it). Critical for regulatory and audit use cases. Version 2 rewrote the engine for better scalability.

### 5.16 Babashka

**Babashka** (2019), by Michiel Borkent (borkdude), is Clojure via a GraalVM native image. It starts instantly — no JVM warmup — and runs Clojure scripts as fast as bash scripts. This solved one of Clojure's longest-standing complaints (slow startup) and made Clojure viable for CLI tooling and scripting.

Babashka ships with `clojure.core`, a subset of `clojure.java.io`, `clojure.string`, HTTP clients, shell utilities, and more. It has a pod system for plugins written in other languages.

Borkdude is a one-person ecosystem: Babashka, clj-kondo (the standard Clojure linter), nbb (Node.js Babashka), scittle (ClojureScript interpreter for scripting), neil (Clojure CLI tool), and more. He is funded by GitHub sponsors and is one of Clojure's most visible contributors.

### 5.17 clj-kondo

**clj-kondo**, also by Borkdude, is the standard Clojure linter. It checks for unused vars, invalid arity calls, shadowing, type mismatches via spec, and more. Integrates with editors. It replaced `eastwood` as the default linter.

### 5.18 The Clojure REPL Stack in 2025

- **Leiningen** or **tools.deps** (CLI build tools)
- **CIDER** (Emacs) or **Cursive** (IntelliJ) or **Calva** (VS Code) or **Conjure** (Neovim) (editor integration)
- **nREPL** (wire protocol)
- **Reveal** or **Portal** (data visualization)
- **Babashka** (scripting)
- **clj-kondo** (linting)
- **cljfmt** (formatting)

### 5.19 ClojureCLR, ClojureDart, ClojErl

- **ClojureCLR** — Clojure on .NET. David Miller maintains it. Useful for Windows shops. Smaller community than JVM Clojure but real.
- **ClojureDart** — Clojure compiled to Dart, which can then target Flutter for cross-platform mobile apps. By Christophe Grand. Ambitious, still maturing.
- **ClojErl** — Clojure on the BEAM (Erlang VM). By Juan Facorro. Bridges Clojure and Erlang/Elixir ecosystems.
- **Jank** — Clojure compiled to LLVM (native). By Jeaye Wilkerson. Ambitious performance-focused implementation, still in development.

---

## 6. Emacs Lisp — The Mother of All Extension Languages

### 6.1 Origins: TECO Macros to GNU Emacs

**Emacs** began as a set of TECO (Text Editor and Corrector) macros that Richard Stallman and Guy Steele wrote at the MIT AI Lab in 1976. The name "Emacs" stood for "Editor MACroS." The TECO version was built on top of the ITS operating system.

In 1984-1985, Stallman began GNU and decided to reimplement Emacs in a new language for portability. Rather than reuse MACLISP or Scheme, Stallman designed **Emacs Lisp** (elisp) as a deliberately pragmatic Lisp optimized for extensibility, interactivity, and readability.

**GNU Emacs 13.0** was released in March 1985 as the first official GNU Emacs. Version 1 wasn't a thing; numbering started around 13 for historical reasons relating to Stallman's personal emacs.

### 6.2 Why elisp Was What It Was

Stallman chose dynamic scoping (the default in older Lisps) over lexical scoping because:
- dynamic scoping makes it easier to write simple extension code that tweaks the behavior of deeply nested functions
- it was familiar to MACLISP programmers
- the interpreter was simpler

This decision haunted elisp for decades. Dynamic scoping makes code harder to reason about, interacts badly with closures, and is generally considered a mistake in modern language design.

In **Emacs 24 (2012)** lexical scoping became available as a per-file opt-in via `;; -*- lexical-binding: t -*-` at the top of the file. Most modern elisp enables it.

### 6.3 Emacs as Lisp Operating System

The joke: "Emacs is a great operating system, lacking only a decent text editor." It's a joke with a point: because every piece of Emacs is written in elisp, you can customize and replace anything at runtime. Users build entire workflows on top of Emacs: mail clients, IRC clients, web browsers, shells, calendars, RSS readers, spreadsheets, music players, and more.

### 6.4 Key Emacs Subsystems in elisp

- **org-mode** — outlining, notes, task management, literate programming, agenda, publishing. Carsten Dominik started it in 2003; Bastien Guerry maintains it. **org-mode is the single most-loved piece of elisp software** and a major reason people install Emacs. Its features include:
  - Hierarchical notes and todos
  - Agenda views across multiple files
  - Clocking/time tracking
  - Source code blocks (org-babel) that execute and insert results
  - Literate programming (tangle/detangle)
  - Export to HTML, LaTeX, PDF, Markdown, Beamer
  - Spreadsheets in tables
  - Calendar/agenda
- **Magit** — the Emacs Git interface. Written by Marius Vollmer, then Jonas Bernoulli took over. Widely considered the best Git UI in any editor, period. A nearly-complete implementation of Git semantics as a transient-based UI in elisp.
- **Gnus** — newsreader and mail client. By Lars Magne Ingebrigtsen. Ancient, venerated, complex.
- **mu4e** — email client on top of mu (a mail indexer). Popular.
- **notmuch** — mail indexer with an Emacs frontend.
- **lsp-mode** and **eglot** — Language Server Protocol clients. lsp-mode is feature-rich; eglot is minimalist and now shipped with Emacs 29.
- **treesit** (Emacs 29+) — Tree-sitter integration for incremental parsing and better syntax highlighting.
- **company-mode, corfu** — completion frameworks.
- **ivy, helm, vertico** — narrowing/selection frameworks.
- **projectile** — project-aware commands.
- **dired** — directory editor, built into Emacs from the start. You edit the filesystem like a text buffer.
- **tramp** — transparent remote file access via SSH, sudo, docker, etc.

### 6.5 Package Ecosystem

- **ELPA** (Emacs Lisp Package Archive) — the official GNU ELPA, maintained by the Emacs developers. Must assign copyright to the FSF.
- **MELPA** (Milkypond Emacs Lisp Package Archive) — the community repository. As of 2025, MELPA hosts approximately **5,500 packages**. Most third-party elisp lives here. Updated continuously. Donald Curtis maintains the infrastructure.
- **MELPA Stable** — versioned releases of MELPA packages.
- **NonGNU ELPA** — added in 2022 for non-copyright-assigned packages from the official source.
- **use-package** — a macro for declarative package configuration, by John Wiegley. Now shipped with Emacs 29.
- **straight.el** — a functional package manager for Emacs (Raxod502 aka Radian Software). Installs packages by cloning git repos with reproducible commit pinning.
- **elpaca** — a newer parallel package manager by Progfolio.

### 6.6 Elisp Scale

There is a lot of elisp. Estimates put the total at tens of millions of lines across all published packages. The core Emacs distribution itself is approximately 1.8 million lines, most of it elisp.

### 6.7 Native Compilation (gccemacs, Emacs 28+)

In 2020, Andrea Corallo developed **gccemacs**, a branch that compiled elisp to native code via libgccjit. The result was a 3x-5x speedup on many workloads. The work was merged into mainline Emacs in Emacs 28 (April 2022) as an optional feature, and became default in many builds for Emacs 29.

Native compilation makes previously sluggish packages (lsp-mode, magit on large repos, company completion) genuinely fast. It was one of the most significant engineering improvements to Emacs in 30 years.

### 6.8 The Editor War and Why Both Have Lisps

The editor war between vi and Emacs is older than many programmers. vi has **Vim Script** (VimL), which is not a Lisp but is inspired by sed/ed command languages. Neovim added **Lua** as a first-class extension language (and also speaks remote-plugin protocols to Python, Ruby, JavaScript, etc.).

Notably, both traditions eventually adopted a Lisp or Lisp-like language for serious extension work. Emacs had elisp from the start; Neovim's Lua is not a Lisp but the extensibility philosophy is convergent.

### 6.9 Distributions

- **Doom Emacs** — Henrik Lissner's opinionated distribution. Fast, modular, Vim-friendly (Evil mode).
- **Spacemacs** — another Vim-friendly distribution. Older, originally by Sylvain Benner. Layer-based.
- **Prelude** — Bozhidar Batsov's minimal distribution.
- **Emacs Starter Kit** — the grandfather of Emacs distributions.

### 6.10 RMS's Continuing Stewardship

Richard Stallman remained the primary maintainer of GNU Emacs until 2008, when he handed off to Stefan Monnier and Chong Yidong. Current maintainers include Lars Ingebrigtsen and Eli Zaretskii. Stallman still contributes occasionally and remains the spiritual leader. GNU Emacs is one of the oldest continuously-developed programs in common use, going on 40 years as of 2025.

---

## 7. Specialized Dialects

### 7.1 AutoLISP — The Hidden Giant

**AutoLISP** is a dialect that embeds Lisp into **AutoCAD** (Autodesk's flagship CAD program). Introduced in 1986 with AutoCAD 2.18. It let CAD users automate drawing, define parametric shapes, and build custom commands.

The remarkable thing about AutoLISP: it has probably been **used by more programmers than any other Lisp dialect by raw headcount**, because every AutoCAD user is a potential AutoLISP user and AutoCAD has tens of millions of users. Most AutoLISP code was written by mechanical engineers, architects, drafters, and surveyors who never thought of themselves as programmers.

AutoLISP is based loosely on XLISP (David Betz's tiny Lisp). It's dynamically scoped, has a small standard library, and tight integration with AutoCAD entities. Extended to **Visual LISP** in 2000, adding ActiveX support, a better debugger, and compilation to FAS files. Visual LISP is the current form.

There is a long and vibrant subculture of AutoLISP forums (theswamp.org, cadtutor.net) where users exchange utility routines for everything from block management to symbol library generation. Most CAD shops have a "lisp file" their senior drafter wrote that speeds up common operations.

### 7.2 newLISP

**newLISP** (1991), by Lutz Mueller, is a small, self-contained Lisp designed for scripting and embedded use. It is deliberately non-standard:
- Dynamic scoping
- Context-based modules
- No persistent closures (uses "contexts" instead)
- Integrates a small standard library
- Ships as a single binary
- 350 kB executable

newLISP is loved by its users for its immediacy — install and go — but mostly rejected by traditional Lispers for its quirky semantics. Still actively maintained at newlisp.org.

### 7.3 PicoLisp

**PicoLisp** (1988), by Alexander Burger, is a tiny Lisp with a focus on 64-bit implementations and embedded databases. Key features:
- Single data type (cells)
- First-class database entities
- Entity-relationship database built into the runtime
- Hugely compact codebase (~20 kLOC)
- Interpreted but fast enough for production

PicoLisp powers several German business applications. picolisp.com.

### 7.4 Fennel

**Fennel** (2016), by Calvin Rose (and maintained by Phil Hagelberg/technomancy among others), is a Lisp that compiles to **Lua**. This makes it ideal for:
- **Game development** (Lua is the standard extension language for many game engines: Love2D, Roblox, World of Warcraft, Factorio)
- **Nginx scripting** (OpenResty runs Lua)
- **Neovim plugins** (Neovim embeds Lua)
- **Embedded systems** (Lua's small footprint)

Fennel adds pattern matching, a saner macro system, destructuring, and Lisp syntax to Lua without imposing any runtime overhead — the output is idiomatic Lua. technomancy uses Fennel for personal projects; fennel-lang.org has the documentation.

### 7.5 Carp

**Carp** (2016), by Erik Svedang (a Swedish game developer), is a statically typed Lisp with Rust-inspired ownership and borrowing semantics. Compiles to C. No garbage collector — instead, memory is managed by compile-time ownership tracking, similar to Rust. Aimed at real-time systems like games.

Carp is still experimental as of 2025, but it represents an interesting confluence of Lisp and modern systems programming ideas.

### 7.6 Shen

**Shen** (2011), by Mark Tarver, is a functional Lisp with optional type theory. Shen's distinguishing feature is that its type system is **sequent-calculus-based and user-definable**: you can define your own type system in Shen and have the compiler check it. Runs on multiple backends (Common Lisp, Python, JavaScript, Scheme, Clojure, Ruby).

Shen is documented in Tarver's book *The Book of Shen*. Small but devoted user base.

### 7.7 Hy

**Hy** (2013), by Paul Tagliamonte, is a Lisp that compiles to Python AST. It runs on the Python runtime with full access to Python's libraries — NumPy, PyTorch, TensorFlow, scikit-learn, Django, Flask, pandas, all of it. Hy has become significant in the **AI/ML and data science** communities because it offers Lisp syntax without giving up the Python ecosystem.

```hy
(import numpy :as np)
(setv x (np.array [1 2 3 4 5]))
(print (np.mean x))
```

Hy is actively maintained at hylang.org.

### 7.8 Arc

**Arc** (2008), by Paul Graham and Robert Morris, is an experimental Lisp dialect that Graham began while at Y Combinator. It emphasizes brevity (short function names, automatic currying, compact syntax). Graham published essays about Arc's design (paulgraham.com/arc.html).

Arc's most important deployment: **Hacker News is written in Arc**. The single-file `news.arc` implements the entire HN voting, posting, and ranking system. As of 2025 the HN codebase remains Arc (running on Racket, since Arc is implemented as a Racket library).

Graham's engagement with Arc has been sporadic. The community fork **Anarki** continues development at github.com/arclanguage/anarki.

### 7.9 Janet

**Janet** (2017), by Calvin Rose (also the Fennel creator), is a modern embedded Lisp. Key features:
- Small implementation (~300 kB)
- Parallel threads with shared memory
- PEG (Parsing Expression Grammar) built in
- Static linking via "jpm" build tool
- Good for command-line tools and embedded scripting

Janet is positioned as a competitor to Lua and Tcl for embedded scripting use. janet-lang.org.

### 7.10 LFE — Lisp Flavored Erlang

**LFE** (2008), by Robert Virding (one of Erlang's original implementors at Ericsson), is a Lisp syntax for Erlang. Runs on the BEAM virtual machine with full access to Erlang's OTP libraries, supervision trees, and actor model. Useful for teams that prefer Lisp syntax while wanting Erlang's concurrency and fault tolerance.

```lisp
(defmodule hello
  (export (world 0)))

(defun world ()
  (io:format "Hello, world!~n"))
```

Virding continues to maintain LFE. lfe.io.

### 7.11 Joxa

**Joxa** (2011), by Eric Merritt, is another Lisp on the BEAM. Similar motivation to LFE but different design choices. Less active now but still referenced.

### 7.12 Wisp

**Wisp** (2005-2013), by Alex Shinn, is an **indentation-based Scheme syntax**. Instead of parentheses, whitespace defines structure, similar to Python:

```wisp
define (factorial n)
  if (zero? n)
    1
    * n
      factorial
        - n 1
```

Wisp is specified in SRFI 119. It has never caught on widely — Lispers who want the parens don't need it, non-Lispers want an entire different language — but it is a genuinely clever experiment.

### 7.13 JavaScript-hosted Lisps

- **ClojureScript** — see section 5.
- **BiwaScheme** — Scheme in JS.
- **Sibilant** — JS-like Lisp.
- **LispyScript** — another JS Lisp.
- **Parenscript** — Common Lisp to JS compiler, mentioned earlier.
- **Wisp (different from Alex Shinn's)** — Mozilla's Wisp, abandoned.

### 7.14 Dylan

**Dylan** (1992), originally by Apple and Digitool, was designed to be "a Lisp that looked like Algol." The idea was to preserve Lisp's semantic power while using a more conventional syntax that would be easier for C programmers to read. Dylan had class-based OOP, multiple dispatch, macros, and a sophisticated module system.

Apple killed Dylan as a product in 1995 after spending a reported $55 million. Open source development continued (OpenDylan) and the language still exists, used by a small but passionate community. opendylan.org.

Dylan is a cautionary tale: removing parentheses from Lisp did not make it popular.

### 7.15 Lean (Lisp Heritage in Elaborator)

**Lean** (2013-present, Leonardo de Moura at Microsoft Research, then Amazon) is a theorem prover and dependently-typed functional language. Lean's elaborator and macro system have substantial Lisp heritage: the team draws explicitly on Common Lisp and Racket's macro design. Lean 4's metaprogramming is Lisp-like in feel even though the surface syntax is Haskell-like.

### 7.16 Pixie (Extinct, Interesting)

**Pixie** (2014-2017), by Timothy Baldridge, was a Clojure-flavored Lisp with an RPython-compiled JIT. It aimed to be Clojure without the JVM. Project abandoned in 2017 but the design was widely discussed.

### 7.17 GOAL (Naughty Dog)

**GOAL (Game Oriented Assembly Lisp)** and its successor **GOOL** are custom Lisp-2 dialects Naughty Dog developed internally for PlayStation game development (starting Crash Bandicoot in 1994, through the Jak and Daxter era 2001-2004, and into Uncharted). GOAL supported inline PlayStation Vector Unit assembly and was used to write essentially the entire game engine including rendering, animation, AI, and physics.

GOAL died when Naughty Dog was acquired by Sony and standardized on C++. But the preservation project **jak-project** (github.com/open-goal/jak-project) has reverse-engineered GOAL's toolchain to allow Jak and Daxter to be decompiled and modded. GOAL is a living reminder that Lisp was competitive with C++ for AAA game dev in its prime.

---

## 8. Package Managers and Build Systems

### 8.1 Common Lisp

- **Quicklisp** (2010, Zach Beane) — default.
- **Ultralisp** — faster-updating dist for bleeding-edge libraries.
- **CLPM** — alternative with more formal dependency resolution.
- **ocicl** — OCI-based distribution, experimental.
- **ASDF** — the build system, always.

### 8.2 Clojure

- **Leiningen** — project.clj, old workhorse.
- **deps.edn + tools.deps** — official, modern.
- **tools.build** — artifact building on top of deps.
- **shadow-cljs** — the ClojureScript build tool.
- **Clojars** — library hosting, Maven-compatible.
- **Maven Central** — also used for Clojure.

### 8.3 Racket

- **Scribble** for documentation.
- **raco** — command-line tool (`raco pkg install`, `raco exe`, `raco docs`).
- **Package catalog** at pkgs.racket-lang.org — approximately 2,000 community packages.

### 8.4 Emacs

- **ELPA** (GNU official, copyright-assigned).
- **NonGNU ELPA** (GNU, non-assigned).
- **MELPA** (community, ~5,500 packages).
- **MELPA Stable**.
- **straight.el** (reproducible functional approach).
- **elpaca** (parallel modern).
- **use-package** (declarative configuration).

### 8.5 Scheme

- **Chicken Eggs** — Chicken's package repository.
- **Racket packages** — via raco.
- **Akku** — R6RS/R7RS package manager for multiple Schemes.
- **Snow** — R7RS package system.

### 8.6 Guix and Nix — Lisps Meet Functional Packaging

**GNU Guix** is a functional package manager written in **Guile Scheme**. Guix packages are Guile code:

```scheme
(define-public hello
  (package
    (name "hello")
    (version "2.12")
    (source (origin (method url-fetch)
                    (uri (string-append "mirror://gnu/hello/hello-"
                                        version ".tar.gz"))
                    (sha256 (base32 "...."))))
    (build-system gnu-build-system)
    (synopsis "Hello, GNU world")
    (description "GNU Hello is a FSF demonstration program...")
    (home-page "https://www.gnu.org/software/hello/")
    (license license:gpl3+)))
```

Guix descends from Nix conceptually — both are functional package managers with immutable package stores — but where Nix uses its own domain-specific language, Guix uses Scheme, so you get the full power of a general-purpose Lisp. You can use arbitrary Scheme to compute package definitions. Guix also provides GuixSD, a full Linux distribution where the entire system configuration (including services) is Scheme.

**Nix**, by Eelco Dolstra (2003), uses its own Nix expression language, which is not a Lisp but is heavily influenced by functional programming and Haskell. The relationship between Nix and Lisp is philosophical, not genealogical. NixOS, like GuixSD, is a declarative Linux distribution.

---

## 9. Editors and IDEs

### 9.1 Emacs + SLIME

**SLIME (Superior Lisp Interaction Mode for Emacs)** is the classic Common Lisp development environment. Implemented in 2003 by Luke Gorrie and Eric Marsden, later maintained by Helmut Eller and many others. SLIME connects Emacs to a running Common Lisp image via the SWANK protocol and provides:

- REPL in a buffer
- `M-.` to jump to function definition
- `M-,` to return from jump
- `C-c C-c` to compile a top-level form
- `C-c C-l` to load a file
- Inspector on any value
- Debugger with restarts
- Macro expansion UI
- Cross-references
- Completion
- Apropos

SLIME plus SBCL plus Emacs is still the most productive Common Lisp development environment for most users.

### 9.2 Emacs + SLY

**SLY** (Sylvester the Cat's Common Lisp IDE) is a fork of SLIME by João Távora. Started 2013. Adds multiple-REPL support, better mREPL, stickers (live inline annotations), and various modernizations. SLY and SLIME are in friendly competition; many users pick one based on stability vs features.

### 9.3 DrRacket

See section 4. The teaching gold standard.

### 9.4 Cursive

**Cursive** is the commercial IntelliJ plugin for Clojure, by Colin Fleming (Cursive Labs, New Zealand). The first production-quality IDE for Clojure. Features:

- Static analysis with inline error markers
- Refactoring (rename, extract function, inline)
- REPL integration
- Git integration via IntelliJ
- Debugger
- Integration with Leiningen and deps.edn

Cursive is licensed per-user, with free licenses for non-commercial and student use. Maintained in active development.

### 9.5 Calva

**Calva** is the VS Code extension for Clojure, by Peter Strömberg and others. Free and open source. Offers REPL integration, inline evaluation, debugger, test runner, paredit, and clj-kondo integration. Has become the default for new Clojure developers coming from VS Code.

### 9.6 Conjure and vim-fireplace

- **Conjure** (Neovim, by Oliver Caldwell, Lua) — interactive evaluation for Clojure, ClojureScript, Fennel, Scheme, Janet, and more.
- **vim-fireplace** (classic Vim, by Tim Pope) — older, still used.

### 9.7 Portacle

**Portacle** is a portable, self-contained Common Lisp development environment. It bundles Emacs + SLIME + SBCL + Quicklisp into a single zip for Windows, macOS, and Linux. Extract and run. Removes the "how do I even set this up" barrier for beginners. By Shinmera (Nicolas Hafner).

### 9.8 Commercial CL IDEs

- **LispWorks IDE** — cross-platform commercial IDE with a CAPI GUI framework. Strong debugger, inspector, profiler. Expensive.
- **Allegro CL IDE** — Franz Inc's commercial environment. Windows-centric GUI but cross-platform. Built-in CLOS browser, editor, stepper. Expensive.
- **Corman Lisp** — Windows-only commercial CL IDE (dormant but existed).

### 9.9 REPL-Driven Development as a Cultural Norm

Lispers are evangelical about REPL-driven development: the practice of keeping a live running program connected to your editor and evaluating small changes incrementally. The pitch:

- No restart between changes
- Test functions in the REPL before committing to them
- Inspect data interactively
- Build the program incrementally as you understand the problem

This is possible in other dynamic languages (Python, Ruby, Smalltalk) but Lispers do it more thoroughly because macro expansion happens live, functions can be redefined anywhere, and the REPL is a first-class reading-evaluating loop rather than an afterthought.

---

## 10. The Lisp Community Today

### 10.1 Conferences

- **European Lisp Symposium (ELS)** — annual since 2008. Rotates through European cities. Academic+industry mix. Small but real.
- **Clojure/conj** — North American Clojure conference, annually since 2010. Durham, North Carolina has hosted several.
- **Clojure/north** — Toronto.
- **ClojuTRE** — Clojure conference in Tampere, Finland.
- **Heart of Clojure** — Leuven, Belgium.
- **re:Clojure** — London, with a focus on newer members.
- **RacketCon** — annual Racket gathering. Small.
- **Scheme Workshop** — co-located with ICFP (International Conference on Functional Programming), annual.
- **Scheme and Functional Programming Workshop** — academic venue for Scheme papers.
- **SPLASH/Lisp Workshop** — occasional.

### 10.2 Online Community

- **r/lisp** — 40,000+ members.
- **r/Clojure** — 30,000+ members.
- **r/Common_Lisp** — 15,000+ members.
- **r/Racket**.
- **r/emacs** — 100,000+ members.
- **Lisp Discord** — main real-time venue.
- **Clojurians Slack** — tens of thousands of users. The primary Clojure community chat.
- **Clojurians Zulip** — alternative to Slack, better archives.
- **#commonlisp on Libera.Chat IRC**.
- **#scheme on Libera.Chat IRC**.
- **#emacs** and **#gnu** on Libera.Chat.
- **Planet Lisp** — blog aggregator.
- **Planet Clojure** — blog aggregator.
- **Planet Racket** — less active.

### 10.3 Hacker News

Hacker News, the Y Combinator news site, is **itself a Lisp artifact**: the backend is Paul Graham's Arc dialect (running on Racket since 2010), a single-file Arc program. HN's continued existence as a premier tech news site means Arc has had an outsized influence on how many people encounter the idea of "a Lisp in production." The HN source is not open but has been the subject of Graham's essays.

### 10.4 Notable Writers and Bloggers

- **Zach Beane ("Xach")** — Quicklisp maintainer; xach.com/naggum Lisp quotes archive; lispblog posts.
- **Eitaro Fukamachi** — Japanese CL developer behind the modern CL web stack. blog.8arrow.org.
- **Rainer Joswig** — veteran German Lisper, posts photos and commentary on obscure Lisp machines. Active on HN.
- **Robert Strandh** — academic behind Climacs and the SICL project.
- **Christophe Rhodes** — SBCL hacker; academic.
- **Paul Graham** — essayist, not very active in Lisp content now but writings remain influential (paulgraham.com).
- **Rich Hickey** — talk transcripts are the most-cited texts.
- **Matthias Felleisen, Matthew Flatt, Robby Findler, Shriram Krishnamurthi** — Racket academic core.
- **Sacha Chua** — weekly Emacs News newsletter (sachachua.com) is a must-read for Emacs users.
- **Irreal** — Jcs's Emacs blog, irreal.org.
- **Mastering Emacs** — Mickey Petersen's blog and book, masteringemacs.org.
- **Bozhidar Batsov** — CIDER maintainer, runs metaredux.com.
- **borkdude (Michiel Borkent)** — Babashka, clj-kondo; one of the most prolific Clojure open source developers.

### 10.5 Books Still in Print

**Common Lisp:**
- *Practical Common Lisp* (Peter Seibel, Apress 2005) — the best free Common Lisp book. Full text online at gigamonkeys.com/book/.
- *Common Lisp Recipes* (Edi Weitz, Apress 2015) — cookbook format.
- *ANSI Common Lisp* (Paul Graham, Prentice Hall 1995) — Graham's book. Condensed, opinionated.
- *On Lisp* (Paul Graham, Prentice Hall 1993) — macros and metaprogramming. Out of print but free PDF.
- *Let Over Lambda* (Doug Hoyte, 2008) — advanced macros.
- *Common Lisp: A Gentle Introduction to Symbolic Computation* (David Touretzky, Benjamin/Cummings 1990) — intro textbook, freely available.
- *Paradigms of Artificial Intelligence Programming* (Peter Norvig, Morgan Kaufmann 1991) — the PAIP book. AI in Common Lisp. Still a masterpiece.
- *The Art of the Metaobject Protocol* (Kiczales, des Rivières, Bobrow, MIT Press 1991) — the AMOP, the canonical CLOS/MOP text.
- *Lisp in Small Pieces* (Christian Queinnec, Cambridge 1996) — implementation techniques for Lisp and Scheme.
- *Structure and Interpretation of Computer Programs* (Abelson, Sussman, Sussman, MIT Press 1985) — SICP. Scheme but essential for any Lisper.
- *Land of Lisp* (Conrad Barski, No Starch 2010) — cartoons, fun, Common Lisp.

**Scheme:**
- *The Little Schemer* (Friedman, Felleisen, MIT Press; 4th edition 1995) — the classic Q&A format pedagogical book.
- *The Seasoned Schemer* (Friedman, Felleisen, 1995) — sequel focusing on continuations and let/cc.
- *The Reasoned Schemer* (Friedman, Byrd, Kiselyov, MIT Press 2005) — logic programming with miniKanren in Scheme.
- *The Scheme Programming Language* (R. Kent Dybvig, MIT Press, 4th edition 2009) — Chez Scheme author's comprehensive reference. Free online.
- *How to Design Programs* (Felleisen et al., MIT Press, 2nd ed 2018) — teaches the design recipe.
- *Simply Scheme* (Harvey & Wright) — SICP's gentler alternative.
- *Teach Yourself Scheme in Fixnum Days* (Dorai Sitaram) — free online.

**Racket:**
- *Realm of Racket* (Felleisen et al., No Starch 2013) — game programming in Racket.
- *Beautiful Racket* (Matthew Butterick) — language-oriented programming.
- *The Racket Guide* (official, online) — Scribble-built official documentation.

**Clojure:**
- *Clojure for the Brave and True* (Daniel Higginbotham, No Starch 2015) — free online at braveclojure.com.
- *The Joy of Clojure* (Fogus & Houser, Manning; 2nd ed 2014) — idiomatic.
- *Clojure Programming* (Emerick, Carper, Grand, O'Reilly 2012) — comprehensive reference.
- *Programming Clojure* (Halloway, 3rd ed by Bedra & Miller, Pragmatic 2018).
- *Clojure Applied* (Vandgrift & Miller, Pragmatic 2015) — patterns.
- *Web Development with Clojure* (Sotnikov, Pragmatic).
- *Mastering Clojure Macros* (Jobczyk, PragProg 2014).

**Emacs:**
- *Mastering Emacs* (Mickey Petersen, self-published, 2015-) — the leading modern Emacs book.
- *Writing GNU Emacs Extensions* (Bob Glickstein, O'Reilly 1997) — older but still useful for elisp.
- *GNU Emacs Manual* and *GNU Emacs Lisp Reference Manual* — free, shipped with Emacs, comprehensive.

**History:**
- *The Evolution of Lisp* (Steele & Gabriel, 1993, HOPL-II) — the canonical history paper.
- *LISP 1.5 Programmer's Manual* (McCarthy et al., MIT Press 1962) — historical source.

### 10.6 Why New Developers Discover Lisp

In 2025, developers typically discover Lisp through one of these entry points:

1. **Clojure** via a job posting, Nubank, or a conference talk.
2. **Emacs** via someone raving about org-mode or Magit.
3. **Racket or Scheme** via a college course (SICP, HtDP, PLI).
4. **Common Lisp** via Paul Graham's essays or the Land of Lisp book.
5. **Hy** via wanting Lisp syntax for their Python ML work.
6. **Fennel** via Neovim config or Love2D game dev.

The entry points have shifted over decades: 1990s (Scheme via SICP), 2000s (Common Lisp via Graham), 2010s (Clojure, Emacs), 2020s (Babashka scripting, Fennel game dev, renewed interest in CL via SBCL's performance).

### 10.7 Community Size

Rough estimates of monthly active developers (2025):
- **Clojure**: 50,000-100,000 active developers worldwide. Driven heavily by Nubank's ~1,000 employees plus other shops.
- **Common Lisp**: 10,000-20,000 active. Includes commercial users, academic users, hobbyists.
- **Racket**: 10,000-20,000, bolstered by education.
- **Scheme (all variants)**: 10,000-30,000, very fragmented.
- **Emacs Lisp**: 500,000+ (Emacs has ~2 million users worldwide, of whom a fraction write any elisp).

These numbers are small compared to Python or JavaScript (tens of millions each). But they are not zero, and they are durable.

---

## 11. Notable Lisp Artifacts

### 11.1 symbolics.com (March 15, 1985)

The **first registered .com domain on the internet**. Registered by Symbolics Inc. of Cambridge, Massachusetts, a Lisp Machine manufacturer. Symbolics used the domain for its corporate presence and ftp service. The company went bankrupt in 1996 but the domain lived on, passing through several hands. As of recent years, it has been owned by a domain-history company that maintains it as a landmark.

Symbolics is also remembered for:
- Being the first commercial Lisp Machine vendor
- Symbolics Genera operating system
- The 3600-series Lisp machines
- The Ivory chip (a Lisp Machine on a single chip, 1988)
- Open Genera, an emulation of Genera running on DEC Alpha, later ported to x86

### 11.2 Hacker News (Arc)

As noted, HN is written in Arc on Racket. The domain: `news.ycombinator.com`. Traffic: millions of monthly visitors. Paul Graham's choice to build it in Arc was both practical (he was the best Arc programmer) and philosophical (prove Lisp's productivity in a real product). The code has evolved privately since 2007.

### 11.3 The GNU Emacs Codebase

GNU Emacs is the largest freely-available Lisp codebase. As of 2025:
- ~1.8 million lines of code total
- ~250 MB of source
- ~3,000 elisp packages on MELPA
- 40+ years of continuous development
- 1,000+ contributors over its lifetime

### 11.4 CLIM (Common Lisp Interface Manager)

CLIM was a sophisticated presentation-based GUI framework originally developed for Symbolics. It introduced the idea of "presentations": GUI objects carry both a visible representation and the Lisp object they represent, so you can click a displayed file name and the system knows you mean the file object. Right-click a value and you get operations that make sense for its type. This "object identity" model of GUIs has never been fully replicated outside the Lisp world.

**McCLIM** is the free software reimplementation. Used by Nyxt (the Lisp web browser), Climacs (a Lisp text editor), and various scientific applications.

### 11.5 Macsyma → Maxima

**Macsyma** was MIT's pioneering computer algebra system, developed at Project MAC starting 1968 by Joel Moses, William Martin, and Carl Engelman. Written in MACLISP. Capable of symbolic integration, differentiation, solving equations, simplification. Macsyma was commercialized by Symbolics in the 1980s.

**Maxima** is the free-software descendant, based on the DOE Macsyma that was released to the public. Written in Common Lisp, runs on SBCL, ECL, CCL, GCL, and Clozure. Maxima is still actively developed and used for symbolic math. It is the canonical example of how a 1970s Lisp program can become a 2020s free software package with the language unchanged.

### 11.6 ITA's QPX

Covered in section 2. QPX was and remains one of the most sophisticated Lisp programs ever written in industry. It implemented a recursive search over airline fare rules with an estimated combinatorial explosion of billions of possible itineraries per query. The algorithm was specific to airline pricing's particular structure and was considered competitively sensitive.

### 11.7 Cyc Knowledge Base

**Cyc** (1984, Douglas Lenat, initially at MCC, then Cycorp) is the longest-running AI project. Cyc aims to encode human commonsense knowledge as logical assertions and provide reasoning over them. Written substantially in Common Lisp ("SubL," a subset of CL). As of 2025, Cyc contains millions of rules and has been licensed to Cleveland Clinic, the NSA, and various defense contractors.

Cyc is controversial in the AI community — "the good old-fashioned AI project that wouldn't die" — but its existence as a still-running Lisp system (built over 40+ years) is remarkable.

### 11.8 Genera Operating System

Symbolics Genera is the most sophisticated Lisp operating system ever built. Features:

- Everything is a Lisp object, inspectable and modifiable
- Single shared address space for all processes
- Presentation-based GUI (CLIM's precursor)
- Integrated editor (ZWEI, based on EINE, the ancestor of SLIME)
- Live debugging of the running kernel
- Built-in networking (Chaosnet originally, then TCP/IP)
- Object-oriented filesystem
- Network-transparent operation

Genera ran only on Symbolics hardware until **Open Genera** was released for DEC Alpha in 1998. A port to x86 exists as a hobby project.

### 11.9 ACL2 (A Computational Logic for Applicative Common Lisp)

**ACL2** is a theorem prover and its underlying logic, built on Common Lisp. Developed by Robert Boyer, J Strother Moore, and Matt Kaufmann over decades. ACL2 was awarded the **ACM Software System Award in 2005**. It is the successor to the Boyer-Moore theorem prover (NQTHM).

ACL2's most famous use: **AMD used ACL2 to verify the floating-point division unit of the K5 processor** after the Intel Pentium FDIV bug made correct floating point a commercial imperative. AMD's verification effort took several years and established ACL2 as a practical tool for industrial formal verification of hardware.

ACL2 continues to be used by AMD, Intel, IBM, and others for hardware verification. ACL2 code is valid Common Lisp, so it runs on standard CL implementations.

### 11.10 SICP Source

The Structure and Interpretation of Computer Programs has had an outsized influence on computer science education. The book's source and exercises, the MIT videos by Abelson and Sussman (from 1986 for Hewlett-Packard engineers, freely online), and the countless blog posts working through SICP exercises constitute a cultural artifact in their own right.

### 11.11 PAIP — Paradigms of Artificial Intelligence Programming

Peter Norvig's *Paradigms of Artificial Intelligence Programming* (1991) is a masterclass in Common Lisp. It works through historical AI programs — ELIZA, STUDENT, SHRDLU, MACSYMA-like systems, rule-based expert systems, a Prolog interpreter, a Scheme interpreter, a compiler — all implemented in idiomatic Common Lisp. The source code is available free online. Many programmers regard PAIP as the book that taught them how to write Lisp for real.

Norvig was later Director of Research at Google. He continues to use and advocate for Lisp.

### 11.12 Lisp Machine Manual (Chinual)

Daniel Weinreb and David Moon's **Lisp Machine Manual** (commonly called "Chinual" after the fat chine-shape of the printed book) documented the early MIT Lisp Machine and Symbolics environments. Multiple editions from 1979 through 1984. Archived online and still read by people curious about ZetaLisp and Flavors (the precursor object system to CLOS).

### 11.13 Flavors → New Flavors → CLOS

**Flavors** was the original Lisp Machine object system (Howard Cannon, 1979). It introduced multiple inheritance with method combination. **New Flavors** was a refinement. The lessons learned in Flavors directly informed the design of **CLOS (Common Lisp Object System)**, which was incorporated into ANSI Common Lisp in 1994.

CLOS features:
- Multi-method dispatch
- Multiple inheritance with linearization (CLOS uses C3)
- Method combination (before, after, around methods)
- Generic functions as first-class objects
- Metaobject Protocol (MOP) for customizing the object system itself

CLOS with the MOP remains arguably the most powerful object system in any mainstream language. It influenced Python's `__metaclass__`, Dylan, Perl 5's Moose, and modern multiple-dispatch systems like Julia.

---

## 12. Bibliography and Primary Sources

### 12.1 Primary Language Specifications

- **ANSI X3.226-1994** — Common Lisp. INCITS 226-1994 (R2004). ~1,300 pages. No public online copy, but the Hyperspec (by Kent Pitman at Harlequin, now on lispworks.com) is the practical reference derived from it.
- **Common Lisp HyperSpec** — lispworks.com/documentation/HyperSpec/Front/index.htm. Navigable HTML version of the ANSI standard.
- **R5RS (1998)** — *Revised^5 Report on the Algorithmic Language Scheme*. schemers.org/Documents/Standards/R5RS/.
- **R6RS (2007)** — r6rs.org.
- **R7RS-small (2013)** — small.r7rs.org.
- **R7RS-large** — ongoing, progress at r7rs.org.
- **Clojure Reference** — clojure.org/reference — official living documentation.
- **Racket Reference** — docs.racket-lang.org/reference/ — Scribble-built reference.
- **Guile Reference** — gnu.org/software/guile/manual/.
- **GNU Emacs Lisp Reference Manual** — gnu.org/software/emacs/manual/elisp.html.

### 12.2 Core Books (Condensed)

**Common Lisp:**
- Seibel, *Practical Common Lisp* (2005)
- Graham, *ANSI Common Lisp* (1995)
- Graham, *On Lisp* (1993)
- Norvig, *Paradigms of Artificial Intelligence Programming* (1991)
- Weitz, *Common Lisp Recipes* (2015)
- Touretzky, *Common Lisp: A Gentle Introduction to Symbolic Computation* (1990)
- Kiczales, des Rivières, Bobrow, *The Art of the Metaobject Protocol* (1991)
- Hoyte, *Let Over Lambda* (2008)
- Barski, *Land of Lisp* (2010)
- Keene, *Object-Oriented Programming in Common Lisp* (1989) — CLOS introduction

**Scheme:**
- Abelson & Sussman, *Structure and Interpretation of Computer Programs* (SICP, 1985, 2nd ed 1996)
- Friedman & Felleisen, *The Little Schemer* (1995)
- Friedman & Felleisen, *The Seasoned Schemer* (1995)
- Friedman, Byrd, Kiselyov, *The Reasoned Schemer* (2005)
- Felleisen et al., *How to Design Programs* (2001, 2nd ed 2018)
- Dybvig, *The Scheme Programming Language* (4th ed, 2009)
- Queinnec, *Lisp in Small Pieces* (1996)
- Harvey & Wright, *Simply Scheme* (1999)
- Sperber et al., *Scheme: An Introduction to Programming and Computer Science* (2010)

**Racket:**
- Felleisen et al., *Realm of Racket* (2013)
- Butterick, *Beautiful Racket* (online, ongoing)
- Krishnamurthi, *Programming Languages: Application and Interpretation* (PLAI, online)

**Clojure:**
- Higginbotham, *Clojure for the Brave and True* (2015)
- Fogus & Houser, *The Joy of Clojure* (2014)
- Emerick, Carper, Grand, *Clojure Programming* (2012)
- Halloway et al., *Programming Clojure* (3rd ed 2018)
- Vandgrift & Miller, *Clojure Applied* (2015)
- Sotnikov, *Web Development with Clojure* (2016, 3rd ed)
- Sierra & VanderHart, *ClojureScript Up and Running* (2012)
- Pestov, *Clojure Polymorphism* (online)

**Emacs:**
- Petersen, *Mastering Emacs* (self-published, continually updated)
- Glickstein, *Writing GNU Emacs Extensions* (1997)
- Chassell, *An Introduction to Programming in Emacs Lisp* (free, shipped with Emacs)

**History and Theory:**
- Steele & Gabriel, "The Evolution of Lisp" (HOPL-II, 1993)
- Gabriel, *Patterns of Software* (1996) — includes the "Worse is Better" essay
- McCarthy, "History of Lisp" (HOPL-I, 1978)
- McCarthy et al., *LISP 1.5 Programmer's Manual* (1962)
- Stoyan, *LISP: Programmierhandbuch* (1978, in German; historical)

### 12.3 Key Papers

- McCarthy, "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I" (CACM 3(4), 1960)
- Sussman & Steele, "Scheme: An Interpreter for Extended Lambda Calculus" (MIT AI Memo 349, 1975)
- Steele, "Rabbit: A Compiler for Scheme" (MIT AI Lab Technical Report 474, 1978)
- Clinger & Rees, "Macros That Work" (POPL 1991) — hygienic macros
- Kohlbecker et al., "Hygienic Macro Expansion" (LISP and Functional Programming, 1986)
- Baker, "Cons Should Not CONS Its Arguments, Part II: Cheney on the M.T.A." (1994)
- Bagwell, "Ideal Hash Trees" (2000)
- Flatt & Felleisen, "Units: Cool Modules for HOT Languages" (PLDI 1998)
- Tobin-Hochstadt et al., "Languages as Libraries" (PLDI 2011)
- Tobin-Hochstadt & Felleisen, "The Design and Implementation of Typed Scheme" (POPL 2008)
- Hickey, "A History of Clojure" (HOPL-IV, 2020) — 48-page paper, canonical Clojure history

### 12.4 Online Archives and Communities

- **Planet Lisp** — planet.lisp.org
- **Planet Clojure** — planet.clojure.in
- **Clojure TV** — youtube.com/clojuretv — talks archive
- **Strange Loop YouTube** — archive of talks where Clojure was heavily featured
- **InfoQ** — has many Hickey talks
- **Common Lisp Wiki** — cliki.net — community wiki
- **Cliki.net** — old CL wiki
- **ALU (Association of Lisp Users)** — alu.org, largely historical now
- **Lisp Working Group history** — the X3J13 minutes and CLHS development
- **ELS proceedings** — european-lisp-symposium.org
- **Racket Summer School** — summer teaching materials
- **Cognitect Blog archives** — cognitect.com/blog
- **InsideClojure** — Alex Miller's blog on Clojure internals

### 12.5 Rich Hickey's Talks — URLs of Record

All on YouTube with multiple mirrors:
- "Simple Made Easy" (Strange Loop 2011)
- "The Value of Values" (JaxConf 2012)
- "Hammock Driven Development" (Clojure/conj 2010)
- "Are We There Yet?" (JVM Languages Summit 2009)
- "The Language of the System" (Clojure/conj 2015)
- "Effective Programs: 10 Years of Clojure" (Clojure/conj 2017)
- "Maybe Not" (Clojure/conj 2018)
- "Spec-ulation" (Clojure/conj 2016)
- "Design, Composition, Performance" (RailsConf 2013)
- "Transducers" (Strange Loop 2014)
- "Clojure Made Simple" (JavaOne 2014)

### 12.6 Source Code as Reference

- **SBCL source**: sbcl.org — the most-read Common Lisp implementation source.
- **Clojure source**: github.com/clojure/clojure — surprisingly readable for a compiler.
- **Racket source**: github.com/racket/racket — massive, multi-layered.
- **GNU Emacs source**: git.savannah.gnu.org/cgit/emacs.git — the ur-example of a long-lived dynamic system.
- **MIT/GNU Scheme source**: git.savannah.gnu.org/cgit/mit-scheme.git.
- **Guile source**: git.savannah.gnu.org/cgit/guile.git.
- **Chez Scheme source**: github.com/cisco/ChezScheme — open sourced by Cisco in 2016.
- **Chicken source**: code.call-cc.org/git/chicken-core.git.
- **PicoLisp source**: software-lab.de/down.html.
- **Arc source**: arclanguage.github.io — and the HN codebase was derived but remains closed.

---

## 13. Epilogue: Why Lisp Still Matters

Lisp in 2025 is smaller than Python or JavaScript but larger than it was in 2005. Clojure alone has injected tens of thousands of new developers into the Lisp tradition over 15 years. Babashka has made Lisp viable for shell scripting. Racket continues to be the best language for teaching language design. SBCL has made Common Lisp fast enough for almost any workload. Emacs has gained native compilation. Quicklisp has solved the library distribution problem that held Common Lisp back for decades.

None of this was obvious in 2005. The conventional wisdom then was that Lisp was dead, that its ideas had been absorbed into other languages (garbage collection, lambdas, macros-as-templates), and that there was no reason to use the originals. The conventional wisdom was wrong. The ideas continue to find new hosts — Clojure for the JVM age, Racket for the DSL age, Guile for the functional-package-management age — and the old hosts (Common Lisp, Scheme, Emacs Lisp) continue to do work that is quietly essential.

The Lisp family tree is not a monument. It is a living thing with roots in 1958 and branches still growing in 2025. This document is a snapshot; next year it will be out of date in small ways, and the year after that in larger ways. What will not change is the deep cultural continuity from McCarthy's recursive functions through Sussman's lambda calculus through Hickey's persistent data structures: a commitment to building programs out of small pieces that compose cleanly, to treating code as data, and to respecting the programmer's ability to extend the language from within.

S-expressions, persistent data structures, hygienic macros, REPL-driven development, interactive debugging, live-updating running systems, language-oriented programming: these are not retro curiosities. They are the cutting edge, rediscovered every decade by practitioners who reach the limits of whatever mainstream language they were using and look around for something better. When they do, they find Lisp waiting.

The parentheses are not the point. The parentheses are just what happened because Steve Russell didn't want to implement an M-expression reader in 1959. The point is the tree-structured program representation that makes metaprogramming a first-class activity. Every serious programmer, at some point in their career, should spend time in a Lisp — not to use it forever, but to understand what programming feels like when the language is not in the way.

---

## Study Guide — Lisp Dialects & Ecosystem

### Dialect map

- **Common Lisp** (1984) — SBCL, CCL, ABCL, ECL.
- **Scheme** (1975) — Racket, Chicken, Gambit, Guile, Chez.
- **Clojure** (2007) — JVM + ClojureScript + ClojureCLR.
- **Emacs Lisp** — everywhere Emacs is.
- **Janet, Fennel, Hy** — modern experiments.

### Key questions

- Why Scheme split from Common Lisp.
- Why Clojure took over the modern Lisp mindshare.
- Why Emacs Lisp survives despite its warts.

## DIY — Install SBCL and Quicklisp

`apt install sbcl` then `curl -O https://beta.quicklisp.org/quicklisp.lisp`,
load it, install a library. You are now in the Common Lisp
ecosystem.

## DIY — Learn Racket

`DrRacket` is the friendliest Lisp IDE. Install it, work
through *How to Design Programs*.

## TRY — Build a tiny DSL

Write a Scheme or Clojure macro that defines a small
domain-specific language for a problem you understand.
Observe that you just extended the language.

## Related College Departments

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md)

---

*End of Lisp Dialects and Ecosystem research document.*
*Written April 2026 for the PNW Research Series LSP project.*
