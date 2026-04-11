# FORTRAN: The History and Evolution of the First High-Level Language

*PNW Research Series — Programming Language Histories*
*Compiled 2026-04-09*

---

## Abstract

FORTRAN — FORmula TRANslation — is the oldest high-level programming
language still in active production use. Conceived by John W. Backus at
IBM in late 1953, first released on the IBM 704 in April 1957, and
continuously evolved through eight major ISO standards across seven
decades, Fortran has defined and re-defined what it means for humans to
express numerical computation on machines. It is the language of the
Apollo guidance ground systems, of the LAPACK and BLAS linear algebra
libraries that underlie nearly all modern scientific software, of the
weather and climate codes that forecast tomorrow morning and the next
century, and of the supercomputer benchmarks (LINPACK, HPL, HPCG) by
which the TOP500 list ranks the fastest machines humans have built.

This document traces Fortran's origins, its standards lineage from
FORTRAN I (1957) through Fortran 2023, the people who built it, the
languages that tried and failed to displace it, the cultural moment in
which "Modern Fortran" is experiencing a renaissance, and the technical
reasons it remains uniquely suited to numerical computing.

---

## 1. Origins: John Backus and IBM, 1953–1957

### 1.1 The man

John Warner Backus was born in Philadelphia on 3 December 1924. His
biography is one of the more improbable in computing history. A
mediocre student at the Hill School, expelled from the University of
Virginia for poor grades, drafted into the Army in 1943, trained briefly
as a medic, then as a cryptographer, then finally discharged in 1946.
He enrolled at Columbia University in New York intending to study
medicine, switched to mathematics, and graduated with a bachelor's in
1949 and a master's in 1950.

The decisive moment came on a 1950 visit to the IBM showroom at 590
Madison Avenue, where Backus saw the Selective Sequence Electronic
Calculator (SSEC) — a room-filling electromechanical hybrid that IBM had
installed in the shop window as a publicity piece. On impulse he asked
for a job, was given an aptitude test on the spot, and was hired. His
first assignment was programming the SSEC; his second was working on
the IBM 701, the company's first commercial scientific computer,
released in 1952.

### 1.2 The problem

By 1953, programming a large scientific computer was a brutal
undertaking. The standard tool was assembly language — or, on the 701,
something even lower called *Speedcoding*, an interpretive floating-point
system Backus himself had written in 1953 to ease the burden of hand-
coding floating-point routines on a machine that lacked floating-point
hardware. Speedcoding was perhaps fifty times slower than hand-optimized
machine code but perhaps ten times faster to write. That ratio
encapsulated the central economic problem of early computing.

Backus and his colleagues observed, repeatedly and to their dismay, that
the cost of a programmer's time on a scientific project was rapidly
overtaking the cost of the machine itself. Computer time in 1954 rented
for roughly US$200 per hour on the 701 (equivalent to roughly US$2,300
in 2025 dollars); a skilled programmer earned perhaps US$10,000 per
year. By the time you factored in debugging, the economic case was
clear: programmers spent more time writing and debugging code than the
computer spent running it. Any tool that could reduce programmer time —
even at the cost of some machine time — would pay for itself.

### 1.3 The proposal

In a memorandum dated 8 December 1953 and addressed to his boss Cuthbert
Hurd, Backus proposed the creation of "a programming language for the
704" — a language in which "mathematical formulas" could be written
"almost as they appear on paper," translated automatically into machine
code, and executed. Hurd approved the project in January 1954. The team
began with Backus, Irving Ziller, and Harlan Herrick; it grew to
include Robert A. Nelson, Roy Nutt, David Sayre, Peter Sheridan, Lois
Haibt, Sheldon Best (on loan from MIT), Richard Goldberg, and Dick Hughes.
Nine to ten people, depending on the month.

### 1.4 The machine: IBM 704

The IBM 704 was announced in May 1954 and first shipped in December
1954. It was the first mass-produced computer with hardware floating-
point arithmetic (36-bit single precision), core memory (initially 4,096
words), and index registers. These three features — floating-point,
core, and indexing — made it the first machine on which a high-level
language for numerical work could plausibly compile to efficient code.
Without hardware floating point, every arithmetic operation would have
required a subroutine call; without index registers, array indexing
would have required self-modifying code. Without core memory, the
program would have been too slow to matter.

Fortran was, in a deep sense, designed *for* the 704. Its DO loop maps
onto the 704's index registers. Its FORMAT statement reflects the 704's
card punch and line printer. Its arithmetic IF (`IF (expr) n1, n2, n3`)
is a transliteration of the 704's compare-and-branch instructions.
Later generations of Fortran programmers inherited these features as
historical fossils, long after the machine that birthed them had been
scrapped.

### 1.5 Eighteen person-years

The project ran from January 1954 through April 1957. The original
schedule was six months; it took three years. The Preliminary Report
("Specifications for the IBM Mathematical FORmula TRANslating System,
FORTRAN") appeared in November 1954. The first compiler — Fortran I,
sometimes called FORTRAN 0 — was released on 15 April 1957 as part of
the 704 software tape.

Backus later said the team expended roughly 18 person-years on the
compiler itself. The compiler was about 25,000 lines of 704 machine
code. It was structured in six sections (called "sections"), each one
performing a different phase of the translation. Section 1 parsed the
arithmetic expressions; Section 2 compiled DO loops and subscripts;
Section 3 merged the pieces into a single program; Sections 4 and 5
performed the legendary register-allocation and instruction-scheduling
optimizations that justified the project's existence; Section 6 handled
the assembly output.

### 1.6 The skepticism

The programming community of 1956–57 was deeply skeptical that any
automatically-generated code could compete with hand-written assembly.
At the ACM meeting in Los Angeles in 1956, Backus presented a paper on
Fortran's optimization strategy and was met with open disbelief. The
dominant opinion was that programmers who respected their craft would
continue to write in assembly, and that high-level languages would at
best serve non-specialists willing to pay a large performance penalty.

Backus and his team understood this, and they designed the Fortran I
compiler explicitly to win the performance argument. Sections 4 and 5
implemented what modern compiler writers recognize as the first serious
attempts at: frequency-based basic block ordering (using Markov-chain
analysis of the control-flow graph), register allocation by a primitive
form of graph coloring, and instruction-level scheduling. These
techniques would not be rediscovered for academic compilers until the
1970s and 1980s.

When the compiler was released in April 1957, the skeptics were
silenced. Fortran code was typically within 10–20 percent of hand-written
assembly on the 704, and in some cases — particularly where the human
programmer had been sloppy about register reuse — faster. The economic
case closed itself. By 1958, roughly half of all code running on IBM
704s worldwide was written in Fortran.

### 1.7 The name

FORTRAN is a contraction of "FORmula TRANslation," chosen early in 1954.
The Preliminary Report of November 1954 is the first document to use
the name in print. Backus preferred a name that emphasized the
mathematical formula — the visible, human-readable representation of
what the machine would compute — rather than the machine mechanics.
The stylistic choice matters. Fortran was presented to its users as a
way to write mathematics, not a way to program a computer.

The name was written in all capitals — FORTRAN — from 1954 through the
1980s, reflecting the uppercase-only character set of punched cards,
line printers, and the EBCDIC convention. The transition to mixed case
"Fortran" was made formal with the publication of the Fortran 90
standard in 1991 and represents a deliberate break with the card-deck
tradition.

### 1.8 The ALGOL connection

The international computing community of the late 1950s was
simultaneously pursuing another thread: ALGOL (ALGOrithmic Language).
Backus himself co-authored the ALGOL 58 specification and was the
principal author of the ALGOL 60 report, in which he introduced the
metalanguage now known as Backus–Naur Form (BNF) for describing the
syntax of programming languages. The ALGOL project influenced Fortran
indirectly and vice versa: where ALGOL emphasized mathematical rigor
and language design as a formal discipline, Fortran emphasized
engineering pragmatism and delivered working compilers on real machines
years before any comparable ALGOL implementation existed. Backus would
later describe his ALGOL work as the beginning of a long dissatisfaction
with imperative programming that culminated in his 1977 Turing Award
lecture.

---

## 2. The Standards Lineage

### 2.1 FORTRAN II (1958)

FORTRAN II was released in the spring of 1958, barely a year after
FORTRAN I. It was IBM's response to the community's immediate demand for
modularity. Where FORTRAN I programs were monolithic — every DO loop,
every array, every variable lived in a single compilation unit —
FORTRAN II introduced:

- **SUBROUTINE and FUNCTION** statements. For the first time, a Fortran
  programmer could write a named subprogram with its own local
  variables, called by name from a main program. This was the birth of
  procedural decomposition in Fortran.
- **COMMON blocks.** A named block of memory shared between subprograms.
  COMMON is the ancestor of the global variable, the struct, and the
  named data section all rolled into one. Its abuse would become one of
  the great sources of Fortran bugs for the next forty years, but its
  availability is what made large Fortran codes possible.
- **The arithmetic IF** statement in its polished form:
  `IF (expr) label_lt, label_eq, label_gt`.
- **The assigned GOTO**, as a kind of crude computed branch.

FORTRAN II shipped on the 704 and then on the 709 and 7090 series as IBM
transitioned from vacuum tubes to transistors. It was the first Fortran
widely ported to non-IBM machines — by 1960, versions existed for the
UNIVAC, the Philco 2000, the Bendix G-20, and the CDC 1604.

### 2.2 FORTRAN III (1958, internal)

FORTRAN III was an internal IBM experiment that added machine-dependent
inline assembly and boolean expressions. It was never released outside
IBM and is mostly remembered as the version that briefly existed in the
gap between FORTRAN II and FORTRAN IV.

### 2.3 FORTRAN IV (1962)

FORTRAN IV was released in 1962 on the IBM 7030 Stretch and then on the
7090 and 7094. It was the version that broke from FORTRAN II's machine-
specific features and attempted to create a genuinely portable
high-level language. Its innovations:

- **Logical IF:** `IF (expr) statement`. The arithmetic IF remained but
  was now joined by its cleaner sibling.
- **The LOGICAL data type** and Boolean operators `.AND.`, `.OR.`,
  `.NOT.`, `.EQV.`, `.NEQV.`.
- **DATA statement** for compile-time initialization.
- **Mixed-mode arithmetic** (with restrictions).
- **Removal of the machine-dependent SENSE LIGHT and IF (SENSE SWITCH)
  constructs** — the last remnants of 704-specific programming.

FORTRAN IV was the most widely taught version of Fortran in the 1960s
and early 1970s, and it is the version most engineers over the age of
sixty today remember learning as undergraduates.

### 2.4 FORTRAN 66 (1966)

On 7 March 1966 the American Standards Association (ASA, later ANSI)
published the first formal standard for the language: *USA Standard
FORTRAN*, ANSI X3.9-1966. This document — twenty-six pages long, and
based largely on FORTRAN IV — was the first ANSI standard for any
programming language. COBOL would not be standardized until 1968.

ANSI X3.9-1966 had two levels: full FORTRAN and *Basic FORTRAN*, a
subset equivalent roughly to FORTRAN II and intended for smaller
machines. The standardization of Fortran 66 was culturally decisive.
For the first time, a program written on one vendor's machine could be
expected — with some reservations — to compile and run on another's.
The portability promise was not perfect, and every vendor added its own
extensions, but the baseline existed.

Fortran 66 is the version in which a tremendous amount of legacy
scientific code was written and which, through the remainder of the
twentieth century, remained in production at national laboratories and
engineering firms around the world. NASA's trajectory codes, the early
nuclear weapons codes at Los Alamos and Livermore, the first Community
Climate Model at NCAR, and the early versions of the ECMWF weather
model were all written in FORTRAN 66 or a close dialect of it.

### 2.5 FORTRAN 77 (1978)

ANSI X3.9-1978 — known universally as FORTRAN 77, even though it was
actually ratified on 3 April 1978 — was the version that introduced
structured programming to Fortran. Its headline features:

- **Block IF** (`IF ... THEN ... ELSE IF ... ELSE ... END IF`). For the
  first time, Fortran programmers could write structured conditionals
  without arithmetic IFs and GOTOs scattered across the source.
- **The CHARACTER data type.** Before 1978, Fortran handled strings by
  packing characters into integer variables (the notorious "Hollerith
  constants" named after IBM's founder), which was unportable and
  error-prone. FORTRAN 77's CHARACTER type made string handling
  first-class, with concatenation (`//`) and substring operations
  (`name(1:4)`).
- **PARAMETER statement** for named constants.
- **OPEN, CLOSE, INQUIRE** for explicit file handling, replacing the
  earlier READ-from-unit conventions.
- **SAVE statement** to guarantee persistence of local variables across
  calls.
- **IMPLICIT NONE** as a common extension (officially standardized
  later) to disable the infamous "I-N rule" that made all variables
  starting with I, J, K, L, M, or N integers by default.
- **DO loop restructuring**: well-defined semantics for zero-trip
  loops and the END DO extension (standardized in later revisions).

FORTRAN 77 is what most people think of when they think "classical
Fortran." It was the lingua franca of scientific computing from roughly
1980 through the mid-1990s. The LAPACK 1.0 release (February 1992) was
written in FORTRAN 77. The original MPI bindings (1994) targeted
FORTRAN 77. An entire generation of computational physicists,
aerospace engineers, and numerical analysts learned Fortran as
FORTRAN 77 and wrote the code that underlies much of modern scientific
computing in it.

### 2.6 Fortran 90 (1991)

On 11 April 1991, ISO/IEC 1539:1991 — Fortran 90 — was published.
Ratification by ANSI (X3.198-1992) followed the next year. This was
the revolution. After thirteen years of stagnation (1978–1991), the
Fortran standards committee — chaired by Jeanne Adams of NCAR, with
heavy involvement from Brian Smith of Los Alamos and a steering role
from Lawrence Rudolph of Convex — modernized the language almost
beyond recognition.

The Fortran 90 standard ran to 369 pages, more than ten times the
length of Fortran 66. Its major additions:

- **Free-form source format.** Columns 1–5 for labels, 6 for
  continuation, 7–72 for code — the card-deck layout that had defined
  Fortran since 1957 — was retired. Free form allowed up to 132
  characters per line and dropped the fixed column rules. The old
  fixed-form source was retained as a legacy option.
- **Modules.** A unit of encapsulation combining data declarations,
  types, and subprograms, with explicit `USE` statements for import.
  Modules replaced COMMON blocks for new code and enabled genuine
  information hiding for the first time.
- **Derived types** (structures/records): `TYPE :: point; REAL :: x, y;
  END TYPE`.
- **Array operations.** The single most important feature for
  scientific programmers. `A = B + C` where A, B, C are arrays now
  meant element-wise addition. Array sections (`A(1:10, :)`), reduction
  intrinsics (`SUM`, `MAXVAL`), and the `WHERE` construct made
  vectorized expression natural.
- **Dynamic memory allocation:** `ALLOCATABLE` arrays, `ALLOCATE`, and
  `DEALLOCATE`. No more guessing the maximum size of every array at
  compile time.
- **POINTER** and `TARGET` attributes, with pointer assignment (`=>`).
  Fortran pointers are typed aliases, not raw addresses — closer to
  C++ references than to C pointers.
- **Recursion.** Subroutines and functions could now call themselves,
  with the `RECURSIVE` keyword.
- **Operator overloading and generic interfaces.** A function could
  be defined to work for multiple argument types, and operators
  (including custom user-defined operators like `.dot.`) could be
  overloaded on derived types.
- **CASE construct** (`SELECT CASE ... CASE (...) ... END SELECT`).
- **KIND parameters** for machine-portable numerical precision
  (`REAL(KIND=8)` or, better, `REAL(KIND=SELECTED_REAL_KIND(15,300))`).
- **Mixed-case source** was formally encouraged; the language began
  to be called "Fortran" rather than "FORTRAN."

Fortran 90 was controversial. Old-school FORTRAN 77 programmers
regarded it as bloated and complicated; computer scientists regarded
it as a polished rework of ideas that C++ and Ada had already explored.
But for its intended audience — working computational scientists —
it was transformative. The combination of array operations, dynamic
memory, and modules made Fortran, for the first time, a language in
which large simulation codes could be organized cleanly.

### 2.7 Fortran 95 (1997)

ISO/IEC 1539-1:1997 — Fortran 95 — was a minor revision that absorbed
changes from the High Performance Fortran (HPF) community and cleaned
up some of Fortran 90's rough edges. Its additions:

- **FORALL** construct for parallel-friendly assignment.
- **PURE** and **ELEMENTAL** procedure attributes. A PURE function has
  no side effects and can be safely used in parallel contexts.
  ELEMENTAL functions automatically extend to arrays.
- **Nested WHERE** constructs.
- **Pointer initialization** to NULL.
- **Default initialization** of derived-type components.
- A handful of deleted features — some obsolescent FORTRAN 66
  constructs (PAUSE, ASSIGN, the real-valued DO variable) were
  formally removed.

Fortran 95 was the stable target for compiler writers throughout the
late 1990s and into the 2000s. It was the version that the LAPACK 3.0
release (1999) and most "classic" NAG library routines targeted.

### 2.8 Fortran 2003 (2004)

ISO/IEC 1539-1:2004 — known as Fortran 2003, published 18 November 2004
after several years of drafting work chaired by Dick Hendrickson — was
the standard that added full object-oriented programming, C
interoperability, and a dozen other features. Its major innovations:

- **Object-oriented programming.** Type extension (inheritance),
  type-bound procedures (methods), polymorphism with `CLASS(...)`,
  abstract types and deferred bindings, and finalization. A fully-
  fledged OO system built on top of derived types.
- **ISO_C_BINDING module.** Standardized interoperability with C.
  For the first time, Fortran code could call C libraries (and vice
  versa) using standard-conforming interfaces without platform-specific
  hacks. `BIND(C)` attributes made structure layout and name mangling
  deterministic.
- **IEEE floating-point arithmetic.** Three standard modules
  (`IEEE_ARITHMETIC`, `IEEE_EXCEPTIONS`, `IEEE_FEATURES`) gave
  programmers control over rounding, exception handling, and denormals.
- **Stream I/O**, more like C's `fread`/`fwrite` than the classical
  formatted Fortran I/O.
- **Parameterized derived types.** Types templated on kind and length
  parameters — a limited form of generic programming.
- **Allocatable components** of derived types and allocatable
  dummy arguments.
- **Asynchronous I/O.**
- **Command line access:** `GET_COMMAND`, `GET_COMMAND_ARGUMENT`,
  `GET_ENVIRONMENT_VARIABLE` — conveniences that had been
  implementation-specific extensions for twenty years.

Fortran 2003 was enormous — the standard grew to over 600 pages — and
compiler vendors took years to implement all of it. NAG Fortran and
IBM XL Fortran led the way in 2007–2008; Intel reached substantial
Fortran 2003 completeness around 2010; GFortran caught up around
2012–2014. The full Fortran 2003 OO model was not reliably available
across all major compilers until roughly 2015.

### 2.9 Fortran 2008 (2010)

ISO/IEC 1539-1:2010 — Fortran 2008, published 6 October 2010 — was the
parallel-programming revision. Its signature feature was *coarrays*:

- **Coarrays.** A data-parallel extension originally developed by
  Robert Numrich and John Reid (the "Co-Array Fortran" proposal of
  1998). A coarray is an array with an extra "codimension" indexed
  over SPMD processes (called "images" in Fortran). The syntax
  `A(1,2)[3]` accesses element (1,2) of the coarray A on image 3,
  with one-sided semantics: the runtime handles the inter-image
  communication. Coarrays brought the PGAS (Partitioned Global Address
  Space) model into standard Fortran.
- **DO CONCURRENT.** A loop form that asserts no dependence between
  iterations, enabling automatic parallelization and vectorization.
- **Submodules.** A mechanism for separating module interface from
  implementation, allowing large module bodies to be recompiled
  without forcing recompilation of everything that uses them.
- **BLOCK construct** for local scoping inside a subprogram.
- **Contiguous attribute** for arrays guaranteed to be contiguous in
  memory — an optimization hint that enables aggressive vectorization.
- **Enhanced allocatable components**, deferred type parameters, and
  various cleanups.

The Fortran 2008 coarray model was the committee's answer to two
decades of parallel-programming experiments: HPF (which failed),
OpenMP (which succeeded but was bolt-on pragmas rather than language
semantics), and MPI (which was a library, not a language feature).
Coarrays put parallel semantics directly into the language.

### 2.10 Fortran 2018 (2018)

ISO/IEC 1539-1:2018 — Fortran 2018, published 28 November 2018 — was
originally planned as a "minor revision" called Fortran 2015 but
slipped three years. It absorbed two technical specifications (TS
29113 on further C interoperability and TS 18508 on additional parallel
features). Major additions:

- **Enhanced coarrays.** Collective intrinsics (`CO_SUM`, `CO_MAX`,
  `CO_REDUCE`, `CO_BROADCAST`), events (`EVENT POST`, `EVENT WAIT`)
  for fine-grained synchronization, and **teams** — the ability to
  partition the set of images into subgroups for nested parallelism.
- **Atomic operations** on coarrays (`ATOMIC_ADD`, `ATOMIC_CAS`, etc.)
  for lock-free programming.
- **Further C interoperability:** support for assumed-type and
  assumed-rank dummy arguments (`TYPE(*), DIMENSION(..)`), for passing
  arbitrary Fortran arrays to C descriptors.
- **IMPLICIT NONE (EXTERNAL)** to force explicit declaration of
  external procedures as well as variables.
- Various cleanups, deletions (the old nonstandard "H edit descriptor"
  finally went), and clarifications.

Fortran 2018 reaffirmed the committee's commitment to parallelism as a
first-class language concern and, importantly, to C interoperability
as a permanent bridge.

### 2.11 Fortran 2023 (2023)

ISO/IEC 1539-1:2023 — Fortran 2023, published 17 November 2023 — is
the most recent ratified standard. Its major features:

- **Generics** (finally). After more than two decades of requests,
  Fortran has a standard generic-programming facility. A template
  subprogram or module can be parameterized over types, kinds,
  and constants, and instantiated multiple times. This closes one of
  the largest remaining feature gaps between Fortran and C++.
- **Conditional expressions** (`A = (X > 0 ? X : -X)`-style, though the
  Fortran spelling is different: an `IF` expression construct).
- **Tokenization and preprocessor improvements.** Longer source lines
  (up to 10,000 characters), standardized treatment of line
  continuation across tokens, and better rules for the Fortran
  preprocessor.
- **Enumeration types** (`ENUM, BIND(C)` with more flexibility).
- **Typed ENUM** as a step toward stronger type safety.
- **USE ALL INTRINSIC** to import all intrinsic modules.
- Extended support for half-precision and arbitrary-precision integer
  kinds (via the intrinsic kind query functions).

Compiler support for Fortran 2023 is still rolling out as of 2026:
NAG Fortran leads, Intel's ifx compiler (the LLVM-based successor to
classic ifort) is implementing features progressively, and GFortran
and LFortran are adding support through 2025–2026.

The next standard, informally called Fortran 202y, is already in
planning, with an expected publication in 2028 or 2029.

---

## 3. Key People

### 3.1 John Backus (1924–2007)

Besides his foundational role on FORTRAN I, Backus went on to co-author
the ALGOL 58 and ALGOL 60 reports, inventing Backus–Naur Form to
describe ALGOL's syntax. He received the ACM Turing Award in 1977 for
"profound, influential, and lasting contributions to the design of
practical high-level programming systems, notably through his work on
FORTRAN, and for publication of formal procedures for the specification
of programming languages."

His Turing Award lecture, *"Can Programming Be Liberated from the
von Neumann Style? A Functional Style and Its Algebra of Programs,"*
published in *Communications of the ACM* in August 1978, is one of the
most-cited papers in programming language research. In it Backus
criticized imperative programming — including, explicitly, Fortran —
as being fundamentally limited by its "word-at-a-time" model, and
proposed a functional-programming alternative he called FP. The
lecture kick-started serious academic interest in functional languages
and set the intellectual stage for Haskell and ML a decade later.

Backus's later career at IBM's Almaden research lab focused on FL, a
follow-on to FP. He retired from IBM in 1991 and died of natural causes
on 17 March 2007 at his home in Ashland, Oregon. He was 82. He had
spent more than fifty years at IBM.

### 3.2 Irving Ziller

Backus's original co-lead on the Fortran project. Ziller designed the
DO loop and the arithmetic IF statement, and was responsible for much
of the original language syntax. He remained at IBM Research for
decades afterward.

### 3.3 Sheldon Best

On loan from MIT, Best designed the optimization phases of the Fortran
I compiler — Sections 4 and 5, the legendary register-allocation and
instruction-scheduling passes. His index-register optimization
algorithm was the first sophisticated compiler optimization in any
high-level language.

### 3.4 Lois Haibt

Haibt, born 1934, is the only woman on the FORTRAN I team. She joined
IBM straight out of Vassar College in 1955 and was assigned to write
Section 5 — the flow-analysis section that handled the DO-loop
optimization. Her work produced one of the earliest examples of
control-flow graph analysis, predating Frances Allen's foundational
work in compiler flow analysis by nearly a decade. Haibt remained at
IBM for her entire career; a 2001 IEEE Computer Society oral history
interview captures her recollections of the project.

### 3.5 Roy Nutt

Nutt wrote the FORTRAN I I/O system and the FORMAT statement — the
directive that governed how numbers were converted between internal
binary representations and decimal characters on punch cards and line
printers. He left IBM in 1960 to co-found Computer Sciences
Corporation (CSC).

### 3.6 Kenneth E. Iverson and Adin D. Falkoff

Iverson (1920–2004) and Falkoff (1921–2010), both at IBM Research,
developed what became APL (A Programming Language) through the 1960s.
Iverson's 1962 book, *A Programming Language*, introduced an
array-oriented mathematical notation that profoundly influenced the
eventual design of Fortran 90's array operations. The direct line from
APL's array expression syntax — `A + B` meaning element-wise addition
of entire arrays — to Fortran 90's whole-array arithmetic is easy to
trace through the technical literature of the 1970s and 1980s. Iverson
received the Turing Award in 1979.

### 3.7 Jeanne Adams

Adams (1921–2007) chaired the X3J3 Fortran standards committee during
the long effort that produced Fortran 90. An atmospheric scientist at
the National Center for Atmospheric Research (NCAR), Adams brought to
the committee both a deep understanding of what working computational
scientists needed and the political skills to hold together a group
whose members had spent much of the 1980s feuding over the direction
of the language. Her insistence on modules, array operations, and
dynamic memory — features that made Fortran 90 a modern language — was
decisive.

### 3.8 Brian Smith

Smith, of Los Alamos National Laboratory, was a key technical force on
the Fortran 90 committee alongside Adams. His work on the IMSL
mathematical library and on vectorization at Los Alamos gave him a
practical perspective on what language features would actually pay off
in production scientific codes. He continued to serve on the Fortran
standards committee well into the Fortran 2003 era.

### 3.9 Michael Metcalf

A physicist at CERN, Metcalf is the author (with John Reid and later
Malcolm Cohen) of the canonical Metcalf-Reid-Cohen reference series:
*Fortran 90 Explained* (1990), *Fortran 95/90 Explained* (1996),
*Fortran 95/2003 Explained* (2004), *Modern Fortran Explained* (2011),
and subsequent editions covering 2008, 2018, and 2023. Since 1990 these
have been the standard reference texts for working Fortran programmers.
Metcalf was also a longtime active member of the Fortran standards
committee.

### 3.10 John Reid

Reid, of Rutherford Appleton Laboratory in the UK, co-authored the
Co-Array Fortran proposal with Robert Numrich in 1998 and shepherded
coarrays into the Fortran 2008 standard. He co-authored the Metcalf
reference series from the Fortran 90 edition onward. He has been a
near-continuous presence on the ISO Fortran committee since the mid-
1980s, serving as convener of WG5 during key standardization efforts.

### 3.11 Robert Numrich

Numrich, at the University of Minnesota Supercomputing Institute,
originated the Co-Array Fortran idea during his work on the Cray T3D
in the early 1990s. Coarrays grew out of Cray's shmem library and
Numrich's insight that the one-sided communication model could be
expressed directly in Fortran syntax rather than through subroutine
calls.

### 3.12 Ondřej Čertík

Founder and principal developer of LFortran, the LLVM-based modern
Fortran compiler. Čertík is also the original author of SymPy, the
Python symbolic mathematics library. LFortran, begun around 2017 and
gaining significant momentum in the early 2020s, represents the first
serious new Fortran compiler written from scratch in decades. It aims
at interactive (REPL) use, fast compile times, and full compatibility
with modern Fortran standards through 2018 (with 2023 features in
progress).

---

## 4. Cultural Impact

### 4.1 Why Fortran won in scientific computing

Four intertwined reasons, in rough order of importance:

1. **Performance.** Fortran compilers have consistently produced the
   fastest numerical code of any widely-used language, and the gap
   has never fully closed. The reasons are technical (see Section 5.1)
   but boil down to: Fortran's semantics tell the compiler more about
   what the code can't do — particularly about aliasing and side
   effects — than C's semantics do.
2. **Portability.** From Fortran 66 onward, the same source code could
   run on machines from every major vendor. For a scientist at a
   national laboratory whose code might need to survive three
   generations of supercomputers, this mattered enormously.
3. **The ecosystem.** By 1980 the Fortran library ecosystem — IMSL
   (founded 1970), NAG (founded 1971), LINPACK (released 1979), EISPACK
   (released 1976), and later LAPACK (1992), ScaLAPACK (1997), PETSc
   (1995), and the MPI bindings (1994) — was unmatched. An engineer
   who needed to solve a system of linear equations or compute an
   eigenvalue had decades of battle-tested Fortran code to draw on,
   and it was all written in Fortran, available from Fortran, and
   optimized for Fortran's calling conventions.
4. **Continuity.** Programs written in FORTRAN IV in 1970 still compile
   and run, with minor modifications, under modern Fortran compilers in
   2026. The standards committee has been unusually disciplined about
   backward compatibility; the rare deletions (arithmetic IF, real-
   valued DO variables, a handful of obsolescent I/O forms) have been
   preceded by multi-standard deprecation warnings.

### 4.2 The fight against Fortran

Every generation of computer scientists since 1965 has produced a
language intended, in part, to replace Fortran. None has succeeded in
displacing it from high-performance scientific computing, though
several have made inroads in adjacent domains.

- **Pascal (Niklaus Wirth, 1970).** Designed as a teaching language
  with an emphasis on structured programming and strong typing.
  Wirth explicitly regarded Fortran as an intellectual embarrassment.
  Pascal was widely taught in the 1970s and 1980s but never succeeded
  in numerical computing — its I/O and array handling were inadequate
  for serious scientific work, and its compilers rarely matched the
  performance of contemporary Fortran.
- **C (Kernighan and Ritchie, 1972; standardized 1989).** C's rise in
  the 1980s and 1990s did displace Fortran in systems programming and
  in most general-purpose applications, but it never fully conquered
  scientific computing. The reasons are subtle. C's pointer semantics
  force the compiler to assume that any two pointers may alias — a
  worst-case assumption that kills many loop optimizations. The
  `restrict` keyword added in C99 helps, but its adoption has been
  inconsistent, and many production codes don't use it.
- **C++ (Bjarne Stroustrup, 1985; standardized 1998).** The great hope
  of object-oriented numerical programming in the 1990s. Libraries like
  Blitz++, POOMA, and later Eigen have made C++ a genuine contender
  in some scientific domains. But C++'s complexity, its long compile
  times, its fragile template error messages, and its underlying C
  aliasing problem have all limited its penetration into the Fortran
  heartland.
- **Python (Guido van Rossum, 1991).** The great success story of
  scientific computing in the twenty-first century. But Python's
  numerical ecosystem — NumPy (2006, descended from Numeric 1995),
  SciPy (2001), Pandas (2008) — is essentially a convenient interface
  to compiled code underneath. That compiled code is overwhelmingly
  Fortran (via LAPACK and BLAS) or C (via SIMD intrinsics and
  kernels). Python did not replace Fortran; it became the friendly
  front-end that made Fortran's power available to a vastly larger
  audience.
- **Julia (2012, Bezanson–Karpinski–Shah–Edelman).** An explicit
  attempt to combine Python's ergonomics with Fortran's speed.
  Julia has genuinely reached production in some scientific domains
  and is the first serious challenger to Fortran in its own territory
  in decades. Whether it displaces Fortran in the 2030s remains an
  open question.
- **Chapel, X10, UPC, Fortress.** The 2000s HPCS (High Productivity
  Computing Systems) languages. Chapel (Cray, first release 2009)
  survives; X10 (IBM) and Fortress (Sun/Oracle) are effectively
  dormant. None displaced Fortran.
- **Rust (2010).** Has made some inroads into HPC tooling but remains
  marginal in numerical cores.

### 4.3 The renaissance

Beginning around 2015, a combination of factors produced what is
sometimes called the "Modern Fortran renaissance." The ingredients:

1. **The standards had caught up.** Fortran 2008 and 2018, together,
   had modernized the language enough that new projects could be
   started without embarrassment.
2. **Compilers had caught up.** By 2015, Intel Fortran, GFortran, and
   NAG Fortran all supported substantial portions of Fortran 2008 in
   production quality.
3. **The Fortran-lang community organized.** The `fortran-lang.org`
   project, launched in 2020, created a package manager (`fpm`, the
   Fortran Package Manager), a standard library proposal (`stdlib`),
   a discourse forum, and coherent documentation of modern Fortran
   practice for the first time since the FORTRAN 77 era. For many
   younger programmers, Fortran-lang is the Fortran they know.
4. **LFortran arrived.** Ondřej Čertík's LLVM-based Fortran compiler
   (first public release 2019) brought with it the promise of
   interactive REPL use, Jupyter integration, and a fresh codebase
   free of decades of legacy assumptions.
5. **The performance gap widened.** As heterogeneous computing (GPUs,
   vector units, tensor cores) spread into scientific computing, the
   advantages of Fortran's explicit array semantics and its lack of
   aliasing pessimism became more pronounced.

### 4.4 Fortran in the supercomputer era

The TOP500 list — the ranking of the world's fastest supercomputers,
updated twice yearly since June 1993 — uses the HPL (High-Performance
Linpack) benchmark as its ranking metric. HPL solves a dense linear
system Ax=b using LU decomposition with partial pivoting, and it is
written in C — but it calls through to BLAS, which on every major
platform includes Fortran implementations either directly or as part
of the reference. The dominant Fortran lineage in supercomputer
benchmarks is:

- **LINPACK (1979).** The original dense-linear-algebra benchmark,
  written by Jack Dongarra, Jim Bunch, Cleve Moler, and G. W. Stewart.
  Fortran 66/77.
- **LAPACK (1992, 3.0 in 1999).** The Linear Algebra PACKage.
  Written in Fortran 77. Still the reference implementation of dense
  linear algebra for most scientific software on earth.
- **ScaLAPACK (1995).** Distributed-memory LAPACK. Fortran 77 with
  BLACS (Basic Linear Algebra Communication Subprograms).
- **HPL (High Performance Linpack, 2000).** Written in C by Antoine
  Petitet, but performance-critical paths call into vendor-optimized
  Fortran BLAS kernels.
- **HPCG (High Performance Conjugate Gradients, 2013).** A newer
  benchmark emphasizing sparse operations and memory bandwidth.
  C++ in its reference form but frequently ported or called through
  Fortran infrastructure.

Major supercomputing projects that ran (and often still run) Fortran
codes:

- **ASCI / ASC** (Accelerated Strategic Computing Initiative, launched
  1995 at LLNL, LANL, and Sandia). The US nuclear weapons stockpile
  stewardship program. Primary simulation codes in Fortran (and later
  C++ wrappers).
- **Earth Simulator** (NEC, 2002; #1 on TOP500 for nearly three years).
  Designed specifically for vectorized Fortran climate and earth-system
  codes.
- **Blue Gene / L, P, Q** (IBM, 2004–2012). LLNL and Argonne.
  Substantial Fortran workloads.
- **Titan, Summit, Frontier** (ORNL, 2012/2018/2022). Climate models,
  combustion codes, astrophysics codes — all substantial Fortran.
- **Fugaku** (RIKEN, 2020–2022 TOP500 #1). Japanese climate and
  weather codes written in Fortran (and C++).
- **Aurora, El Capitan** (ANL/LLNL, 2024/2025). Continued Fortran
  workloads alongside growing Kokkos/HIP/SYCL C++ codes.

---

## 5. Notable Implementations

### 5.1 IBM FORTRAN (1957–)

The original. Over the decades IBM has released dozens of Fortran
compilers, of which the best-known were:

- **FORTRAN I** (1957) on the 704.
- **FORTRAN II / IV** (1958, 1962) on the 709, 7090, 7094, Stretch.
- **FORTRAN G and H** on the System/360 (announced 1964, available
  1966). The G compiler was a fast-compiling debug-oriented version;
  the H compiler was an aggressively optimizing production version.
  The H compiler was the first widely-used Fortran compiler to perform
  modern optimizations like common-subexpression elimination and
  strength reduction.
- **VS FORTRAN** (1981) for MVS and VM.
- **XL Fortran** (1990s–present) for AIX, Linux, and Blue Gene.
  One of the most reliably Fortran-standard-conformant compilers.

### 5.2 WATFOR and WATFIV (1965, 1968)

Developed at the University of Waterloo, WATFOR (WATerloo FORtran) and
its successor WATFIV were education-oriented fast-compilation Fortrans
designed for large undergraduate classes. They were single-pass,
compiled into memory in one step, and featured excellent diagnostic
messages at a time when most Fortran compilers offered almost none.
Generations of Canadian and American computer science undergraduates
learned Fortran on WATFOR or WATFIV. The lineage continues through
Watcom Fortran, which survived into the 1990s.

### 5.3 DEC Fortran (VAX Fortran, 1978–2001)

Digital Equipment Corporation's Fortran for VAX/VMS was the dominant
scientific Fortran implementation of the 1980s. VAX Fortran's extensions
became a de facto standard for minicomputer scientific computing, and
DEC's implementation of Fortran 77 was influential in shaping what
"practical FORTRAN 77" meant on any platform. After Digital was
acquired by Compaq in 1998 and then by HP in 2002, the VAX Fortran
lineage was largely absorbed into Intel Fortran — many of the former
Compaq/Digital Fortran engineers joined Intel around that time.

### 5.4 NAG Fortran Compiler (1991–)

The Numerical Algorithms Group's NAGWare f90 compiler, first released
1991, was the first commercially available Fortran 90 compiler. NAG
has maintained a reputation as the strictest standards-checker in the
Fortran ecosystem — if your code compiles under NAG with all warnings
enabled, it is almost certainly standard-conformant. NAG Fortran has
often been the first compiler to implement new standard features.

### 5.5 Lahey Fortran (1970s–2010s)

Lahey Computer Systems, founded by Tom Lahey in 1967, produced Fortran
compilers for personal computers throughout the 1980s and 1990s and
became one of the most popular PC Fortran vendors of that era. Lahey's
partnership with Fujitsu in the 1990s produced Lahey/Fujitsu Fortran
90 and 95, widely used in engineering offices. The company eventually
wound down Fortran development in the 2010s as free compilers
(GFortran) overtook it.

### 5.6 Intel Fortran (ifort → ifx, 1998–)

Intel acquired the Kuck and Associates Preprocessor (KAP) vectorization
technology and then, in 2003, the Compaq/Digital Fortran team, merging
them into what became Intel Fortran Compiler (ifort). For roughly two
decades — from about 2003 through the early 2020s — ifort was widely
regarded as the fastest Fortran compiler on x86 hardware and the de
facto standard for high-performance Fortran in industry. Around 2021
Intel began the transition from the legacy ifort codebase to a new
LLVM-based compiler called ifx (Intel Fortran Compiler Classic vs.
Intel Fortran Compiler). As of 2026, ifx is the officially supported
Intel Fortran compiler and ifort is in deprecation.

### 5.7 GFortran (2003–)

The GNU Fortran compiler, part of GCC. Its predecessor, g77, was a
FORTRAN 77-only compiler that shipped with GCC throughout the late
1990s. GFortran was started in 2003 as a rewrite targeting Fortran 95
and beyond; it replaced g77 as the default GCC Fortran compiler in
2005. Over the next twenty years GFortran gradually implemented Fortran
2003, 2008, and much of 2018. For many working scientists, GFortran is
*the* Fortran compiler — free, cross-platform, and available everywhere
GCC runs.

### 5.8 NVIDIA HPC SDK / PGI (1989–)

Portland Group International (PGI), founded 1989, built its reputation
on aggressive optimization for scientific Fortran on x86. In the 2000s
PGI became the leading vendor for directive-based GPU programming with
OpenACC, and its CUDA Fortran product (introduced 2009) was the first
implementation of CUDA kernels written directly in Fortran syntax.
NVIDIA acquired PGI in 2013, and in 2020 renamed the successor toolkit
the "NVIDIA HPC SDK," which bundles the NVIDIA HPC Fortran compiler
(nvfortran), C and C++ compilers, math libraries, and GPU tools. For
Fortran programmers targeting NVIDIA GPUs, the HPC SDK is the
mainstream path.

### 5.9 Cray Fortran (CCE, 1976–)

Cray's compilers, from the original CFT (Cray Fortran Translator) for
the Cray-1 in 1976 through CFT77, CF90, and the current Cray Compiling
Environment (CCE) for HPE systems, have always been tightly coupled to
Cray's vector and massively-parallel hardware. CCE today is an LLVM-
based compiler and is one of the principal production Fortran compilers
for US Department of Energy exascale systems.

### 5.10 LFortran (2017–)

Ondřej Čertík's LLVM-based Fortran compiler, designed from scratch with
three goals: interactive use (a Jupyter kernel and REPL, unusual for a
compiled language), fast compile-to-run time, and modern compiler
infrastructure. LFortran is still in active development; as of 2026 it
is approaching production quality for Fortran 2008 features and is
widely regarded as the most promising new Fortran implementation in
decades. Its sibling project LPython shares the same frontend
architecture.

### 5.11 Flang / f18 (2018–)

The LLVM project's own Fortran frontend. Originally called "Flang" and
based on an earlier PGI contribution, it was rewritten as "f18" (for
Fortran 2018) starting in 2018 by an NVIDIA/PGI-led team, then renamed
back to Flang as it merged into the LLVM monorepo. Flang is the
long-term Fortran frontend for the LLVM ecosystem and is what ifx and
NVIDIA's nvfortran increasingly share code with.

### 5.12 Other historical implementations

- **Absoft Fortran** (1980s–2000s), popular on Macintosh and Windows.
- **Salford Fortran / Silverfrost FTN95** (1990s–), known for its
  unusually aggressive runtime checking.
- **Microsoft Fortran PowerStation** (1993–1995), a brief Microsoft
  entry into the Fortran market that was discontinued when Microsoft
  decided the PC scientific community was not worth pursuing.
- **HP Fortran / Tru64 Fortran** — the remnants of DEC Fortran under
  HP after the Compaq acquisition.

---

## 6. Why Fortran Matters

### 6.1 The performance argument

The single most durable reason for Fortran's survival is performance.
The technical reasons are:

1. **Non-aliasing by default.** In Fortran, two dummy (parameter) arrays
   are assumed not to alias each other unless explicitly declared to
   share memory. The compiler can therefore vectorize, reorder, and
   parallelize loops over them aggressively. In C, two pointer
   parameters are assumed to potentially alias, so the compiler must
   conservatively reload memory on every iteration. C99's `restrict`
   keyword partially addresses this, but its adoption in real codebases
   is inconsistent.
2. **Array semantics.** Fortran arrays carry shape and stride
   information. A whole-array expression `A = B + C` tells the
   compiler the iteration space directly, without the programmer
   having to write an explicit loop whose bounds and dependencies the
   compiler must recover. Fortran's array intrinsics (`MATMUL`,
   `DOT_PRODUCT`, `SUM`) similarly encode high-level operations that
   the compiler can map to optimized library routines.
3. **Column-major storage.** Fortran stores multidimensional arrays in
   column-major order, matching the mathematical convention and,
   incidentally, matching the access pattern of many linear algebra
   algorithms written in the standard formulations.
4. **`PURE` and `ELEMENTAL` annotations.** Since Fortran 95, programmers
   can tell the compiler that a function has no side effects and can
   be called in parallel or reordered freely. C++ has no exact
   equivalent.
5. **`DO CONCURRENT`.** Since Fortran 2008, a programmer can explicitly
   mark a loop as having no loop-carried dependencies, opening it up
   for automatic parallelization and vectorization without directives.
6. **Contiguous attribute.** Since Fortran 2008, a programmer can
   assert that an array or array section is contiguous in memory,
   eliminating stride checks in inner loops.

In well-optimized code on modern hardware, Fortran and C typically
deliver comparable performance — within a few percent — for simple
kernels. For complex kernels with multiple arrays, aliasing assumptions
and array semantics often give Fortran a measurable edge, sometimes as
much as 30–50 percent. On vector and GPU architectures, the gap can
widen further.

### 6.2 The longevity argument

Fortran code written in 1970 still runs. A great deal of it is still
running. Specific examples:

- **NASA's General Mission Analysis Tool (GMAT)** uses Fortran
  trajectory-propagation cores derived from code written in the 1970s.
- **NOAA's Global Forecast System (GFS)** and its successor FV3
  dynamical core include Fortran code whose earliest ancestors date
  to the 1970s and 1980s.
- **The Community Earth System Model (CESM)** at NCAR — one of the
  world's leading climate models — is roughly 1.5 million lines of
  modern Fortran, with a direct lineage back to the first Community
  Climate Model (CCM) of the early 1980s.
- **ECMWF's Integrated Forecast System (IFS)**, the code that produces
  the most accurate medium-range weather forecasts on earth, is
  written in Fortran. Its oldest subroutines date to the 1970s.
- **The LLNL ALE3D and KULL codes**, US nuclear weapons simulation
  codes, are Fortran with C++ driver layers.
- **Quantum chemistry packages** — Gaussian, GAMESS, NWChem, CFOUR,
  Molpro, Dalton — are all primarily Fortran.
- **Oil and gas seismic processing** — most of the proprietary seismic
  imaging codes at the major oil companies are Fortran, some going
  back to the 1960s.
- **Financial risk modeling** — some large insurance companies'
  actuarial codes are still Fortran, dating from the 1970s.

The economic value of this code base is in the tens of billions of
dollars. The cost of rewriting it in a modern language would be
astronomical; the risk of introducing subtle numerical bugs in the
rewrite is catastrophic. Fortran's standards committee has understood
this and, more than any other language committee, has preserved
backward compatibility as a first-class concern.

### 6.3 The ecosystem argument

The Fortran numerical library ecosystem is the deepest in computing.
Partial enumeration:

- **BLAS** (Basic Linear Algebra Subprograms, 1979 and extended 1988,
  1990). Level 1 (vector), Level 2 (matrix-vector), Level 3 (matrix-
  matrix). Fortran 77. The reference implementation exists, but on
  real hardware it is universally replaced by vendor-optimized
  implementations: MKL (Intel), OpenBLAS, ATLAS, ESSL (IBM), NVBLAS
  (NVIDIA), Cray LibSci, BLIS (a newer community project). All of
  these expose the Fortran 77 BLAS interface.
- **LAPACK** (1992, ongoing). Higher-level linear algebra on top of
  BLAS. Dense matrix factorizations, eigenvalue problems, least-
  squares. Fortran 77.
- **ScaLAPACK** (1995). Distributed-memory LAPACK on top of BLACS
  (a message-passing layer).
- **ARPACK** (1996). Large sparse eigenvalue problems via implicitly-
  restarted Arnoldi. Fortran 77.
- **FFTPACK** (1982), the original reference FFT library, Fortran.
  Later effectively superseded by FFTW (C, 1998) and vendor libraries.
- **NetCDF and HDF5** — scientific data formats with canonical Fortran
  bindings used throughout atmospheric and oceanographic science.
- **MPI** — the Message Passing Interface has had Fortran bindings
  since its 1994 first release, and much parallel scientific code is
  written against those bindings.
- **PETSc** (Portable Extensible Toolkit for Scientific Computation,
  Argonne, 1995). Partial differential equation solvers. Substantial
  Fortran interfaces.
- **Trilinos**, **SUNDIALS**, **hypre** — C/C++ libraries with Fortran
  bindings, used everywhere in computational science.
- **IMSL** (1970) and **NAG** (1971) commercial numerical libraries,
  each with thousands of Fortran routines covering statistics,
  optimization, quadrature, special functions, and differential
  equations.

NumPy, the foundation of the modern Python scientific ecosystem,
depends on LAPACK and BLAS — that is, depends transitively on Fortran.
SciPy adds dozens more Fortran-dependent modules. The entire
PyData/SciPy ecosystem that powers data science, machine learning
preprocessing, and scientific computing in Python is built on a Fortran
foundation that was laid down between 1979 and 1999.

---

## 7. Closing: The Space Between Then and Now

Fortran is older than most programming languages by an order of
magnitude. It is older than the ACM Turing Award. It is older than the
field of software engineering. It is older than nearly every person
who writes code professionally today. When John Backus submitted his
December 1953 memorandum, the transistor was six years old, the field
of computer science did not exist as an academic discipline, and the
word "software" had not yet been coined (it appears to have entered
common use only around 1958).

And yet, seventy-three years later, Fortran is not a fossil. The most
recent standard was published in 2023. The LFortran and Flang compiler
projects are actively attracting new contributors. The Fortran-lang
community is growing. The largest supercomputers on earth run Fortran
codes that dominate their workloads. Weather models, climate models,
quantum chemistry packages, fluid dynamics simulations, and
astrophysical codes — the things that scientific computing *is* —
continue to be written, rewritten, and extended in Fortran.

The reason, in the end, is that John Backus and his team in 1953–1957
solved a specific problem — how to let scientists express numerical
computation in notation close to mathematics, and have the machine
execute it efficiently — and they solved it *well enough* that no
successor has been able to improve on the combination of performance,
portability, and continuity they delivered. Other languages have
improved on individual axes. None has beaten Fortran on all three.

The lesson, if there is one, is about the durability of good
engineering aimed at real problems. Fortran was not the most elegant
language ever designed; Backus himself came to regret its imperative
semantics. But it was built to run on real hardware, to solve the real
problems of real scientists, and to survive changes in both hardware
and scientific practice over decades. That kind of engineering is
rare, and when it succeeds, it endures.

Seventy years is a long time in a field where most artifacts are
obsolete within five. Fortran's longevity is not an accident, and it
is not a debt owed to inertia. It is a product of a language that
keeps doing what it was built to do — translate formulas into
efficient, portable, numerical code — better than its alternatives.

---

## Sources and Further Reading

- Backus, J. W. "The History of FORTRAN I, II, and III." *ACM SIGPLAN
  Notices*, Vol. 13, No. 8 (August 1978), pp. 165–180. Reprinted in
  *History of Programming Languages*, ed. Richard L. Wexelblat, 1981.
  The canonical source for the origin story, written by Backus
  himself.
- Metcalf, Michael; Reid, John; Cohen, Malcolm. *Modern Fortran
  Explained: Incorporating Fortran 2018.* Oxford University Press,
  2018. The standard reference for the modern language.
- Adams, Jeanne C.; Brainerd, Walter S.; Hendrickson, Richard A.;
  Maine, Richard E.; Martin, Jeanne T.; Smith, Brian T. *The Fortran
  2003 Handbook: The Complete Syntax, Features, and Procedures.*
  Springer, 2009.
- ISO/IEC 1539-1:1991, :1997, :2004, :2010, :2018, :2023. The Fortran
  standards, available from ISO and national standards bodies.
- Backus, John. "Can Programming Be Liberated from the von Neumann
  Style? A Functional Style and Its Algebra of Programs."
  *Communications of the ACM*, Vol. 21, No. 8 (August 1978),
  pp. 613–641. The Turing Award lecture.
- Dongarra, Jack; Luszczek, Piotr. "LINPACK Benchmark." In
  *Encyclopedia of Parallel Computing*, Springer, 2011.
- Numrich, Robert W.; Reid, John. "Co-Array Fortran for Parallel
  Programming." *ACM SIGPLAN Fortran Forum*, Vol. 17, No. 2 (August
  1998), pp. 1–31.
- The Fortran-lang community at `fortran-lang.org`.
- The IEEE Computer Society Oral History interviews with Lois Haibt,
  Irving Ziller, and other members of the original Fortran team.
- Dongarra, J.; Gustavson, F.; Karp, A. "Implementing Linear Algebra
  Algorithms for Dense Matrices on a Vector Pipeline Machine."
  *SIAM Review*, Vol. 26, No. 1 (January 1984).

---

*End of document. Written for the PNW Research Series, tibsfox.com.*
