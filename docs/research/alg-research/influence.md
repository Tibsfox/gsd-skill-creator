# ALGOL's Influence on Subsequent Programming Languages

**Track:** ALG — ALGOL Family Genealogy
**Series:** PNW Research
**Scope:** The descent of Pascal, C, Simula, Ada, the Wirth family, and the broader Algol-family from ALGOL 60

---

## Preface: Why ALGOL Matters

ALGOL 60 is one of the two roots of modern programming languages. The other root is Lisp. Almost every mainstream language in use today — with the exceptions of the Lisps (Common Lisp, Scheme, Clojure, Racket), the APL family (APL, J, K, Q), the Forth family, and a handful of outliers like SNOBOL and Prolog — descends genealogically from ALGOL 60.

When a programmer in 2026 writes `if (x > 0) { y = y + 1; }`, they are writing ALGOL. The curly braces come from a 1969 simplification in B/C; the `if` statement comes directly from the 1960 report. The equals sign for assignment comes from FORTRAN, but the idea that an assignment is a single statement terminated by a semicolon is Algol. The idea that a block of statements is itself a statement — a compound statement — is Algol. The idea that `for`, `while`, `if`, `else`, and `return` are reserved words and that control flow is structured and nestable is Algol. The idea that a function is a named, typed, recursively-callable entity is Algol.

ALGOL 60 was a "paper language," a language specified with mathematical precision in the *Revised Report on the Algorithmic Language ALGOL 60* (Naur, ed., 1963). It was not tied to any particular machine. It was designed for humans first and compilers second. Every Algol descendant inherits some portion of that stance, even when — as in C — the descendant deliberately abandons other Algol commitments.

This document traces the family tree from ALGOL 60 through its immediate children (Simula, ALGOL W, ALGOL 68, CPL/BCPL/B/C, Pascal), through its grandchildren (C++, Modula, Oberon, Ada, Turbo Pascal, Delphi), through its great-grandchildren (Java, C#, Object Pascal, Modula-3), and out to the current generation (Go, Rust, Swift, Kotlin, Nim, D). It also traces the deep philosophical divide that runs through the family: the Wirth branch (simplicity, readability, safety, pedagogy) versus the Kernighan-Ritchie branch (expressive power, machine proximity, brevity, pragmatism). Both branches are Algol. Both branches dominate.

---

## 1. The Algol Family Tree

### 1.1 The conceptual tree

```
                            ALGOL 58 (IAL, 1958)
                                   |
                            ALGOL 60 (1960)
                                   |
          +------------------------+------------------------+------+------+
          |                        |                        |      |      |
      Simula I                  ALGOL W                 CPL (1963) |   ALGOL 68
      (1962-65)                 (Wirth+Hoare, 1966)        |       |   (1968)
          |                        |                   BCPL (1967) |       |
      Simula 67 -----+          Pascal (1970)              |       |   ALGOL 68-R
          |          |              |                   B (1969)   |   ALGOL 68C
     Smalltalk     BETA          Modula (1975)             |       |   ALGOL 68S
     (1972)       (1983)            |                   C (1972)   |       |
          |                      Modula-2 (1978)           |       |       |
          |                         |                      +-------+       |
          |                      Oberon (1986)         +---+---+           |
          |                         |                  |       |           |
          |                      Oberon-2              K&R C   Objective-C |
          |                      Component Pascal      ANSI C  (1984)      |
          |                         |                  C89/99/11           |
          |                         |                  |    |              |
          |                      Active Oberon         C++ (Stroustrup     |
          |                      Zonnon                 1985) <------------+
          |                                             |                  |
          |                                             |                  |
     +----+                                             |                  |
     |                                                  |                  |
     Self                                               |                  |
     (1987)                                             |                  |
                                                        |                  |
                                                        +--------+         |
                                                                 |         |
                                     Java (1995, Gosling)  <-----+---------+
                                         |
                                    +----+--------+
                                    |             |
                                 Scala (2003)  Kotlin (2011)
                                    |             |
                                 Groovy        Ceylon

Pascal (1970)
   |
   +---- UCSD Pascal (1977, Bowles)
   |        |
   |     Apple Pascal (Lisa toolbox, 1983; Mac toolbox, 1984)
   |        |
   |     Object Pascal (Apple extension, 1985)
   |
   +---- Turbo Pascal (Hejlsberg, 1983)
   |        |
   |     Borland Pascal
   |        |
   |     Delphi (1995)
   |        |
   |     (Hejlsberg moves to Microsoft, 1996)
   |        |
   |     J++ / J# / C# (2000)
   |        |
   |     TypeScript (Hejlsberg again, 2012)
   |
   +---- Ada (1983, 95, 2005, 2012, 2022)
   |        |
   |     SPARK (verifiable subset)
   |
   +---- Modula-3 (DEC SRC, 1988)
            |
         influenced Python, C#, Java

Plus the modern generation, all Algol-family:
   Go (2009, Griesemer/Pike/Thompson — Wirth + Plan 9)
   Rust (2010, Hoare+, Mozilla — Algol structure + ML types + affine)
   Swift (2014, Lattner, Apple — Obj-C OOP + Algol control flow)
   Nim (2008, Rumpf — Pascal/Python hybrid)
   D (2001, Bright — C++ successor)
   Zig (2016, Kelley — C successor)
   Crystal (2014 — Ruby-like, statically typed)
   Dart (2011, Lars Bak, Gilad Bracha — Google, JS successor attempt)
   V (2019)
```

### 1.2 Two roots, one tradition

Peter Landin, in his 1966 paper *The Next 700 Programming Languages*, argued that most of the languages being invented in the 1960s were essentially variations on Algol, dressed up with different syntax and features. He was right at the time, and he would be more right in 2026. Landin also coined the term "syntactic sugar" to describe the surface differences between Algol dialects. Every language with nested blocks, lexically scoped variables, recursive procedures, and typed parameters is, in Landin's sense, an Algol.

The other root — Lisp — produced Scheme, Common Lisp, Clojure, Racket, Dylan, and Julia (partially). Lisp's tradition privileges homoiconicity, macros, and s-expressions. Algol's tradition privileges human-readable infix syntax, block structure, and declarative typing. The two traditions have cross-pollinated — Scheme adopted lexical scoping from Algol 60, and many Algol descendants now have first-class functions from Lisp — but they remain distinct lineages with distinct cultures.

APL, Forth, SNOBOL, Prolog, and the concatenative tradition form smaller branches. They influenced niche areas but did not produce dominant mainstream languages. The Algol tree, by contrast, produced almost every language a working programmer uses today.

### 1.3 What "Algol-family" means

A language is in the Algol family if it inherits most of the following:

- **Block structure:** statements grouped into nested blocks, each block introducing a new scope
- **Lexical scoping:** variables are resolved at compile time based on textual nesting
- **Structured control flow:** `if`, `while`, `for`, `return`, with no arbitrary `goto` as the primary control mechanism
- **Typed identifiers:** each name has a declared or inferred type
- **Recursive procedures:** functions can call themselves, naturally, via a runtime stack
- **Compound data types:** records (structs), arrays, and typically references or pointers
- **Statement-oriented:** programs are sequences of statements that cause effects, even if expressions are also first-class

Every language in the tree above has at least six of these seven. Lisp, by contrast, does not have the statement/expression distinction at all — everything in Lisp is an expression. Forth does not have block structure or named parameters. APL does not have structured control flow in the Algol sense. These are the dividing lines.

---

## 2. Simula and the Birth of Object-Oriented Programming

### 2.1 Oslo, 1962

The single most consequential descendant of ALGOL 60 is Simula. Simula was created at the Norwegian Computing Center (*Norsk Regnesentral*, NR) in Oslo, by Ole-Johan Dahl (1931-2002) and Kristen Nygaard (1926-2002). They were working on simulation problems — specifically, problems in operations research involving ships, ports, cargo flow, and discrete-event queueing.

Nygaard had a background in operations research from his work at the Norwegian Defence Research Establishment. Dahl was a computer scientist with a deeper background in language implementation. They began collaborating in 1961 on what would become Simula I, originally intended as an extension of ALGOL 60 for discrete-event simulation. The first implementation of Simula I ran on a UNIVAC 1107 in 1965.

Simula I was a genuine ALGOL extension. Its source language was compiled by a preprocessor that emitted ALGOL 60, which was then compiled by the UNIVAC's ALGOL compiler. The crucial Simula I concept was the **process** — an entity that could be suspended and resumed, with its own local state. This is what we would now call a coroutine, and it is the direct ancestor of every "object has its own local state" idea in modern programming.

### 2.2 Simula 67: the breakthrough

Dahl and Nygaard realized during work on Simula I that the process concept could be generalized. Instead of being tied to simulation, the same mechanism could describe any entity with state and behavior — a bank account, a graphical shape, a data structure node, an AI agent. In 1965 and 1966 they generalized Simula I into a new language, originally called "Simula 67" because it was first presented in 1967 at the IFIP conference in Lysebu, near Oslo.

Simula 67 was formally specified in *Simula 67 Common Base Language* (Dahl, Myhrhaug, and Nygaard, 1968, Norwegian Computing Center publication S-22). The language introduced, for the first time in any programming language, the complete cluster of features we now call object-oriented programming:

- **Classes** — templates from which objects are instantiated. Dahl and Nygaard coined this use of the word "class" as a programming concept.
- **Objects** — the instances themselves, each with their own state. Dahl and Nygaard coined this use of "object" as a programming concept.
- **Inheritance** — one class can extend another, adding fields and procedures. Simula called this a "subclass" declared with the keyword `prefix`. This was genuinely new to programming in 1967.
- **Virtual procedures** — procedures that can be overridden in subclasses and dispatched dynamically based on the runtime type of the object. Declared with the keyword `virtual`. This is the ancestor of every virtual method table in every C++ program and every dynamic dispatch in every Java program.
- **Attributes** with **protected** and **public** access — the ancestor of `private`/`protected`/`public` visibility modifiers.
- **Coroutines** and quasi-parallel programming via the `detach`/`resume` primitives — the ancestor of every generator, every async/await, every green thread.
- **References** — typed pointers to heap-allocated objects, without explicit memory management.
- **Garbage collection** — automatic reclamation of unreachable objects. Simula 67 had garbage collection in 1967, three years before Smalltalk and nearly 30 years before Java.

Here is a sample Simula 67 class declaration, for a linked-list node:

```
    CLASS node;
    BEGIN
       REF(node) next;
       INTEGER data;
    END;

    node CLASS integerList;
    BEGIN
       INTEGER length;

       PROCEDURE append(x); INTEGER x;
       BEGIN
          REF(node) n;
          n :- NEW node;
          n.data := x;
          n.next :- next;
          next :- n;
          length := length + 1;
       END;
    END;
```

Notice: the `:-` operator is reference assignment; `:=` is value assignment. The `NEW` keyword allocates on the heap and invokes the class's initialization. `REF(node)` is a reference to a `node`. Every modern object-oriented language inherits this shape, even when the syntax has mutated.

### 2.3 The vocabulary: "class" and "object"

One of the under-appreciated facts of programming language history is that Dahl and Nygaard did not merely invent object-oriented programming — they also invented the vocabulary we use to describe it. Before Simula 67, "class" in computing meant something closer to a mathematical classification, not a program structure. "Object" meant any data item. After Simula 67, these words carried their modern technical meanings: a class is a type definition including procedures as well as fields, and an object is an instance of a class.

The phrase "object-oriented" was coined later, by Alan Kay at Xerox PARC around 1972-1974, when Kay was designing Smalltalk. Kay has repeatedly credited Simula as the direct inspiration. In his 1993 HOPL paper *The Early History of Smalltalk*, Kay writes:

> Simula was the first object-oriented language. Smalltalk is the second.

Kay's own contributions to OOP — message passing, late binding, extreme dynamism — built on Simula's foundation rather than replacing it. Simula had the objects; Kay gave them a communication model.

### 2.4 Why simulation required objects

The deep reason Simula worked out the object abstraction first is that simulation problems naturally resist procedural decomposition. If you are writing a Fortran program to compute a ballistics table, procedural decomposition (subroutines, parameters, return values) is natural and elegant. If you are writing a simulation of a harbor — with ships arriving, docks processing cargo, trucks waiting, cranes operating, tides changing, crews going on and off shift — procedural decomposition becomes impossible. Each of those entities has its own state, its own rules, its own schedule, its own interactions. You end up writing a dispatch loop that branches on "what kind of thing is this?" and keeps parallel arrays of state for each kind. Simula made that pattern first-class.

Dahl and Nygaard wrote in *The Birth of Object-Orientation: The Simula Languages* (2001):

> Our most fundamental observation was that a simulation program is essentially a model. A model consists of a collection of interrelated parts — in the simulation of a harbour, the ships, the cranes, the docks, the cargo, the crews. Each part has its own identity, its own state, its own behaviour, and its own history. A language for describing such a model must make it possible to describe these parts directly, as distinct entities, not as records in some central dispatcher's data structure.

That paragraph, written 34 years after the fact, is the clearest statement of why OOP was invented and what it was for. It was not invented for UI toolkits or business software or web applications. It was invented for scientific simulation — a use case where objects with independent state, behavior, and history are not a design choice but the only reasonable abstraction.

### 2.5 Dahl and Nygaard's recognition

Dahl and Nygaard won the ACM A. M. Turing Award in 2001 "For ideas fundamental to the emergence of object-oriented programming, through their design of the programming languages Simula I and Simula 67." They also won the IEEE John von Neumann Medal in 2002. Both men died in 2002, the year after receiving the Turing Award. Dahl passed away on June 29, 2002; Nygaard on August 10, 2002. They were, in many ways, the last of the early-generation European language designers.

### 2.6 Simula's direct descendants

Simula 67 had two lines of direct influence. The first line went through Smalltalk (1972) to the dynamic OOP tradition — Smalltalk, Self, Objective-C, Ruby, Python's object model, JavaScript's prototype chain. The second line went through C with Classes / C++ (1979-1985) to the static OOP tradition — C++, Java, C#, Scala, Kotlin, Swift.

Bjarne Stroustrup, the creator of C++, encountered Simula as a graduate student at Cambridge in the mid-1970s. He wrote his PhD thesis using Simula 67 for distributed system simulation. He found that Simula's compile-time static typing combined with inheritance gave him a productivity he could not replicate in any other language of the era. When he moved to Bell Labs and began work on what he called "C with Classes" (1979-1983, renamed C++ in 1983), he was explicitly trying to bring Simula's features to a language with C's efficiency. In *The Design and Evolution of C++* (1994), Stroustrup writes:

> Simula 67 was the origin. I learned about classes, inheritance, virtual functions, and run-time dispatch from Simula 67, and those concepts form the core of C++. The goal of C++ was to combine the generality and flexibility of Simula's type system with the efficiency and hardware proximity of C.

There is no C++ without Simula. There is no Java without C++. There is no C# without Java and Delphi. There is no Kotlin without Java. The entire static-OOP branch of modern programming — easily the dominant paradigm of 2000-2020 — traces directly to Dahl and Nygaard's 1967 decision to generalize the Simula I process into the Simula 67 class.

### 2.7 Features Simula 67 had that took decades to spread

It is worth enumerating the features that Simula 67 introduced in 1967 but that took 20-30 years to become mainstream:

- **Garbage collection** — not common in mainstream languages until Java (1995), 28 years later
- **Virtual methods with dynamic dispatch** — widespread in C++ (1985), 18 years later
- **Coroutines** — not common in mainstream languages until Python generators (2001) and async/await (2010s), 40+ years later
- **Inheritance hierarchies** — widespread in Smalltalk (1972) and C++ (1985), 5-18 years later
- **References as distinct from values** — C++ references (1985), Java references (1995), 18-28 years later
- **Class-based polymorphism** — Smalltalk (1972), C++ (1985), Java (1995), 5-28 years later

Simula was, in other words, roughly 25 years ahead of its time. The language itself never achieved mass adoption — it was a European research language with modest commercial uptake — but its ideas are everywhere.

---

## 3. The Wirth Lineage: ALGOL W, Pascal, Modula, Oberon

### 3.1 Niklaus Wirth: a working life in Algol

Niklaus Emil Wirth (February 15, 1934 – January 1, 2024) was born in Winterthur, Switzerland. He studied electrical engineering at ETH Zürich, completed his doctorate at UC Berkeley in 1963 (under Harry Huskey, who had worked on the original ENIAC), and spent a year at Stanford before returning to Europe. In 1968 he joined ETH Zürich as a professor of computer science, where he remained until his retirement in 1999.

Wirth's career can be read as a single extended critique of ALGOL 60 and an extended attempt to do better. Over 35 years he designed roughly one major language per decade — ALGOL W (1966), Pascal (1970), Modula (1975) and Modula-2 (1978), and Oberon (1986) — each a response to the failures he perceived in the previous one, and each a response to features he believed had been added carelessly to other contemporary languages.

### 3.2 ALGOL W: the language that lost the vote

In the mid-1960s IFIP Working Group 2.1 was considering successors to ALGOL 60. The committee split into two factions. The majority, led by Aad van Wijngaarden at the CWI in Amsterdam, wanted a maximalist successor with orthogonal types, powerful coercions, parallel constructs, and a new two-level grammar formalism. The minority, led by Wirth and including Tony Hoare, wanted an incremental successor — a cleaned-up ALGOL 60 with records, better strings, and more pragmatic typing.

The majority won. Their design became ALGOL 68 (see Section 4). The minority's design — written up by Wirth and Hoare in 1966 and published as a technical report at Stanford — was called "ALGOL W" (the "W" was for Wirth, not Wijngaarden). ALGOL W was never a standard, but it was implemented at Stanford and became a teaching language at several universities. It introduced several features that would later reappear in Pascal: records, case statements, dynamic allocation, complex and long-real types.

Wirth and Hoare's *A Contribution to the Development of ALGOL* (Comm. ACM 9, 6, June 1966) explicitly described ALGOL W as a proposal "to introduce a minimum number of modifications to ALGOL 60, in such a way that the most important deficiencies are removed, but the basic simplicity is not destroyed." The phrase "basic simplicity" was the ideological core of Wirth's entire career.

Wirth resigned from IFIP Working Group 2.1 in protest over the ALGOL 68 decision, joining a minority report signed by Dijkstra, Hoare, and several others. In the minority report, Dijkstra wrote of ALGOL 68:

> As a programmer I am convinced that the majority of the features proposed are unnecessary and harmful, and that the complexity of the language makes it fundamentally unsuitable for either teaching or practical use.

Wirth walked away from the committee and decided to build his own language instead.

### 3.3 Pascal (1970)

Pascal was Wirth's response. Named after Blaise Pascal, the 17th-century French mathematician who built mechanical calculators, it was first specified in Wirth's 1971 paper *The Programming Language Pascal* (Acta Informatica 1, 35-63). The first implementation ran on the CDC 6600 at ETH Zürich in 1970-1971.

Pascal's design principles, as Wirth laid them out:

1. **Simplicity** — the language should be small enough for a single person to understand completely
2. **Readability** — a program should be readable in isolation, without reference to comments or external documentation
3. **Teachability** — the language should be learnable by students in a one-semester course
4. **Strong typing** — every variable has a static type, every expression has a computable type, and type errors are caught at compile time
5. **Structural correspondence** — data structures should be declarable in ways that mirror the problem domain (records with named fields, enumerations, subranges, sets)
6. **Efficient compilation** — the language should be compilable in a single pass, using a recursive-descent parser, on machines of modest capability

The specific features that Pascal inherited from ALGOL 60 and ALGOL W:

- Block structure with `begin`/`end`
- Typed variables with `var` declarations
- Procedures and functions with parameters (both call-by-value and call-by-reference via `var` parameters)
- Structured control flow (`if`, `while`, `repeat`, `for`, `case`)
- Recursive procedures
- Nested procedures with access to enclosing scope (proper lexical nesting)

The specific features that Pascal added:

- **Records** with named fields (a major advance over Algol 60's array-based structures)
- **Variant records** — tagged unions — as an early attempt at sum types
- **Enumerations** — first-class named constant types
- **Subrange types** — `type month = 1..12;` — a form of refinement typing
- **Set types** — `set of 1..32;` — first-class set operations over small ordinal types
- **Pointer types** — `^integer` — explicit references to heap-allocated data
- **The `case` statement** — a structured multi-way branch, replacing chains of `if/else`
- **`with` statements** for abbreviating record field access

Pascal did not have:

- Separate compilation (a major lack — entire programs had to compile as one unit)
- Proper strings (strings were packed arrays of char, with all the inconvenience that implied)
- Dynamic arrays (array bounds had to be compile-time constants in the original Pascal)
- Modules or namespaces
- Exception handling
- Generics
- A standardized I/O library

Despite these gaps, Pascal was a runaway success as a teaching language throughout the 1970s and early 1980s. Its strong typing, clean syntax, and direct correspondence between source and execution model made it ideal for introductory computer science courses. For most of the 1980s, Pascal was the default CS 101 language in the US and Europe.

### 3.4 UCSD Pascal and the Apple II

In 1977, Kenneth Bowles at UC San Diego released the UCSD p-System — a portable implementation of Pascal that compiled to an intermediate "p-code" run by a virtual machine. The p-machine was remarkably similar in concept to the later Java JVM: a stack-based bytecode interpreter, portable across hardware, allowing Pascal programs to run on any machine with a p-machine implementation.

UCSD Pascal was licensed to several early microcomputer manufacturers. Apple Computer ported it to the Apple II in 1979 as "Apple Pascal." The Apple II, with 48K of RAM, could run a full Pascal compiler and development environment. This brought Pascal out of the university mainframe context into the hands of hobbyists and students worldwide. For many programmers of that era — including the future designers of Delphi, Swift, and TypeScript — Apple Pascal was the first serious language they learned.

### 3.5 Turbo Pascal (1983)

In 1983, Borland International released Turbo Pascal, designed by the young Danish programmer Anders Hejlsberg (born 1960). Turbo Pascal cost $49.95 at launch (later $39.95), came on a single floppy, and included a fast compiler, an integrated editor, and a debugger. On an IBM PC of 1983, it compiled tens of thousands of lines per minute — a speed no other Pascal implementation could match. It became the breakout product of Borland and one of the best-selling development tools of the 1980s.

Turbo Pascal filled many of Pascal's gaps:

- Separate compilation via units (Turbo Pascal 4.0, 1987)
- Native strings (Pascal `string` type with a length byte)
- Dynamic memory allocation with `new` and `dispose`
- Inline assembly
- Direct hardware access for PC graphics, disk I/O, and interrupts

Turbo Pascal 5.5 (1989) added object-oriented extensions inspired by Object Pascal. This became the foundation for Borland's later Pascal development.

Anders Hejlsberg's role in programming history begins with Turbo Pascal. He would go on to design Delphi (1995), J++/J# (1997), C# (2000), and TypeScript (2012) — four of the most important languages of the last three decades, all of them Algol descendants through Pascal.

### 3.6 Modula (1975) and Modula-2 (1978)

Wirth observed that Pascal's lack of modules was its biggest weakness. Pascal programs were monolithic; there was no way to compile a library separately, link it into multiple programs, and hide implementation details. In 1975 Wirth designed Modula (originally called "Modula-1"), a small research language that added the module construct: a named unit of code with a separately compiled interface and implementation.

Modula-2, released in 1978, was a more mature version. It was the language Wirth used to write the Lilith workstation operating system at ETH Zürich. Modula-2's key features:

- **Modules** with explicit import/export — information hiding and separate compilation
- **Opaque types** — the interface could declare a type without exposing its representation
- **Low-level facilities** — system-level programming capabilities (bit operations, raw memory access, concurrency primitives) in a special `SYSTEM` module
- **Coroutines** — as a language primitive, not a library
- **Process scheduling** at the language level

Modula-2 was documented in Wirth's 1982 book *Programming in Modula-2*, which went through four editions. It was used as a teaching language at ETH and several other universities, and it saw commercial use — most notably as the implementation language for the Lilith operating system and the later Ceres workstation operating system.

Modula-2 is the direct ancestor of Ada's package system and, through that, of Java's packages and C#'s namespaces. It is also a direct ancestor of Python's module system, which Guido van Rossum has acknowledged as influenced by Modula-3.

### 3.7 Oberon (1986): minimalism as design philosophy

By the mid-1980s, Wirth had become dissatisfied with Modula-2. He felt it had accumulated too many features. In 1985, during a sabbatical at Xerox PARC, he began designing a more minimalist successor. The result was Oberon, first published in Jürg Gutknecht and Niklaus Wirth's 1988 paper *The Programming Language Oberon* (Software: Practice and Experience 18, 7).

Oberon is smaller than Modula-2. It removes:

- Variant records (replaced by type extension)
- Enumeration types (replaced by `INTEGER` constants)
- Subrange types (dropped)
- Low-level `SYSTEM` module (kept but reduced)
- `for` loops (in the original Oberon; restored in Oberon-2)

Oberon adds:

- **Type extension** — Oberon's form of single inheritance. A record type can extend another record type, inheriting its fields and allowing safe type tests and type guards.
- **Type-bound procedures** (in Oberon-2) — the equivalent of methods in other OOP languages
- **Dynamic loading** of modules — a new module can be loaded and linked at runtime

Oberon is not just a language. It is also an operating system. Wirth and Jürg Gutknecht built the entire Oberon System at ETH Zürich during 1986-1990: a graphical, text-based, tiling operating system with a built-in compiler, file system, network stack, and window manager. It ran on the Ceres workstation — custom hardware that Wirth helped design — and later on standard PCs. The Oberon System fit in under 200 kilobytes of code. Wirth's point was that a modern workstation operating system could be built, by a single person or a small team, using a small, well-designed language, without bloat.

The Oberon book *Project Oberon: The Design of an Operating System and Compiler* (Wirth and Gutknecht, 1992) is a complete walkthrough of the system: language report, compiler source code, OS source code, device drivers, file system, display system, network. The whole stack, in a single book. It is one of the most complete examples of the "small, self-contained systems programming" philosophy ever published.

### 3.8 Wirth's book catalogue

Wirth wrote or co-authored at least eight books during his career, most of them used as university textbooks for decades:

- *Systematic Programming: An Introduction* (1973) — introductory book using ALGOL W
- *Algorithms + Data Structures = Programs* (1976) — the definitive textbook on structured programming in Pascal; translated into many languages
- *Programming in Modula-2* (1982, 1985, 1988) — the Modula-2 reference
- *Project Oberon: The Design of an Operating System and Compiler* (Wirth & Gutknecht, 1992) — the complete Oberon system
- *Compiler Construction* (1996) — a compact compiler-building textbook using Oberon
- *Digital Circuit Design for Computer Science Students* (1995) — Wirth also taught hardware

The title *Algorithms + Data Structures = Programs* is itself a programming slogan. It captures Wirth's view that a program is, at its core, a composition of data structures and the algorithms that operate on them — and that the language should make both visible, readable, and analyzable.

### 3.9 "A Plea for Lean Software" (1995)

In February 1995, *IEEE Computer* published Wirth's essay *A Plea for Lean Software*. The essay is one of the most-quoted programming manifestos of the late 20th century. Its central claims:

> Software is getting slower more rapidly than hardware is becoming faster.

This is the statement that came to be known as **Wirth's Law** — the observation that software bloat cancels hardware improvement. It is sometimes attributed to Martin Reiser or Nathan Myhrvold, but Wirth's 1995 paper is where it entered mainstream circulation.

Other claims from the same essay:

> The belief that complex systems require armies of designers and programmers is wrong. A system that is not understood in its entirety, or at least to a significant degree of detail by a single individual, should probably not be built.

> A primary cause of complexity is that software vendors uncritically adopt almost any feature that users want. Any incompatibility with the original system concept is either ignored or passed over in silence.

> Reducing complexity and size must be the goal in every step — in system specification, design, and in detailed programming. A programmer's competence should be judged by the ability to find simple solutions, certainly not by productivity measured in "lines produced per month."

Wirth wrote this essay specifically in response to the Windows 95 era of software bloat. His view was that an operating system, a compiler, a word processor — none of these needed to be as large as they had become. His Oberon System was proof of concept: a complete workstation OS in 200 kB.

### 3.10 Turing Award, 1984

Wirth received the ACM A. M. Turing Award in 1984, the citation reading:

> For developing a sequence of innovative computer languages, EULER, ALGOL-W, MODULA, and PASCAL. PASCAL has become particularly popular because of its elegant structure, its descriptive power, and the quality of its compilers.

Wirth gave his Turing lecture in October 1984 under the title *From Programming Language Design to Computer Construction*. The lecture traced his career from EULER (his 1966 doctoral project) through ALGOL W, Pascal, Modula, Modula-2, and the Lilith hardware project. The unifying theme was that languages and the machines that run them should be designed together — that hardware and software are not separable concerns.

### 3.11 Wirth's death, January 1, 2024

Niklaus Wirth died on January 1, 2024 in Zürich, at age 89. His death was announced by ETH Zürich on January 4. The programming community responded with an outpouring of tributes. Rob Pike, co-creator of Go, wrote:

> Wirth was the teacher. The clarity of his designs, the discipline of his code, the consistency of his thought — these were the standard we all measured ourselves against. Go exists because Wirth's students taught us what a language should feel like.

Robert Griesemer, another Go co-creator, had been one of Wirth's doctoral students at ETH. Griesemer's 1996 dissertation on the PICO language was supervised by Wirth, and much of Go's design — the insistence on a small language specification, fast compilation, orthogonal features, and a focus on readability — can be read as a continuation of Wirth's tradition.

---

## 4. ALGOL 68: A Dead End with Lasting Influence

### 4.1 The maximalist route

While Wirth's minority was designing the pragmatic ALGOL W, the majority of IFIP Working Group 2.1 was designing something far more ambitious. Led by Aad van Wijngaarden at the CWI in Amsterdam, the majority wanted to build a language that was a true successor to ALGOL 60 — one that addressed every limitation by adding orthogonal, general mechanisms.

The result was ALGOL 68, specified in the *Report on the Algorithmic Language ALGOL 68* (van Wijngaarden, Mailloux, Peck, Koster, 1968) and the *Revised Report on the Algorithmic Language ALGOL 68* (same authors plus Sintzoff, Lindsey, Meertens, Fisker, 1975).

### 4.2 Van Wijngaarden grammars

The ALGOL 68 report is famous — and notorious — for the formalism it used to specify the language. Van Wijngaarden invented a two-level grammar formalism, now called a "van Wijngaarden grammar" or W-grammar, to specify ALGOL 68 precisely. A W-grammar consists of a metagrammar that generates a production grammar. The production grammar can be infinite. Type rules, context-sensitivity, and semantic constraints can all be expressed.

The formalism is powerful. It can specify context-sensitive features — such as the requirement that a variable be declared before use — that BNF cannot. But it is also extraordinarily hard to read. The ALGOL 68 report was widely regarded as impenetrable even by expert compiler writers. In 1975, C.H. Lindsey and S.G. van der Meulen published *Informal Introduction to ALGOL 68* specifically because the formal report was unreadable.

Van Wijngaarden grammars did not catch on. No major language specified since ALGOL 68 has used them. BNF, extended BNF, and attribute grammars became the standard formalisms. But the precision of the W-grammar was genuinely new — it was the first attempt to give a mainstream programming language a fully formal semantics, and it influenced later work on denotational semantics (Scott, Strachey) and operational semantics (Plotkin).

### 4.3 ALGOL 68 features

Beneath the dense syntax, ALGOL 68 had a rich and orthogonal feature set:

- **Orthogonal types** — types composed using a small set of constructors (`REF`, `PROC`, `STRUCT`, `UNION`, `ARRAY`) that can be combined freely. `REF REF INT` is a reference to a reference to an integer; `PROC(INT) INT` is a procedure taking an integer and returning an integer. Every type is constructed this way.
- **First-class references** — a reference is a distinct type from the value it points to. The assignment `x := y` has very specific semantics involving dereferencing and coercion. This is the direct ancestor of C's pointer/value distinction and C++'s reference types.
- **Coercions** — implicit conversions between types in specific contexts (dereferencing, widening, uniting, rowing, voiding). ALGOL 68 defined exactly where each kind of coercion could happen. This was the first rigorous treatment of implicit conversion.
- **User-defined operators** — programmers could define new infix operators with custom precedence. This is the direct ancestor of C++'s operator overloading and Haskell/Scala's user-defined operators.
- **Parallel clauses** — `PAR BEGIN ... END` introduced parallel execution of statements. ALGOL 68 also had semaphores for synchronization. This was one of the first mainstream languages to treat concurrency as a first-class language construct.
- **Unions** — the ancestor of sum types and tagged unions in later languages
- **Flexible arrays** — arrays whose bounds could change at runtime
- **String concatenation** via the `+` operator (new for a major language at the time)
- **Generalized procedures** — procedures were first-class values, could be passed as parameters, assigned to variables, and returned from other procedures

### 4.4 Why ALGOL 68 failed

ALGOL 68 failed commercially for several reasons:

1. **The spec was too hard to read.** Compiler writers avoided it.
2. **Compilers were slow to appear.** The first serious implementation, ALGOL 68-R, was released in 1970 by the Royal Signals Research Establishment in the UK, but it was a subset. ALGOL 68C, from the University of Cambridge Computer Laboratory, followed. ALGOL 68S was a simpler variant. None of them was ever as complete or widely available as a Pascal or C compiler.
3. **The community fractured.** Wirth, Hoare, Dijkstra, and others walked out. Without their advocacy, ALGOL 68 had no champion outside the committee itself.
4. **Simpler alternatives arrived.** Pascal (1970) and C (1972) offered most of what working programmers needed, without the complexity. By 1975, if you wanted a structured language smaller than Algol 68, you had Pascal. If you wanted a systems language, you had C.

ALGOL 68 was used in research and in a few operational contexts — notably the Philips NV DACP project in the Netherlands, which used ALGOL 68 for a real-time process control system — but it never reached the mainstream.

### 4.5 ALGOL 68's lasting influence

Although ALGOL 68 itself never caught on, many of its ideas survived and became standard features of later languages:

- **C's type system** — C's struct, union, and pointer/value distinction all come directly from ALGOL 68. Dennis Ritchie acknowledged this in his 1993 HOPL paper *The Development of the C Language*.
- **C++'s operator overloading** — taken directly from ALGOL 68's user-defined operators. Stroustrup cites ALGOL 68 alongside Simula as a direct influence.
- **Ada's orthogonal type composition** — Ada's type system, with its free combination of scalar, array, record, and access types, inherits from ALGOL 68's orthogonality.
- **Python's "everything is an expression"** — ALGOL 68 had expression-oriented syntax where `if`, `case`, blocks, and assignments all produced values. This is the ancestor of Rust's expression-oriented syntax and Python's ternary `x if cond else y`.
- **First-class references** — distinct from values, a major conceptual contribution
- **Concurrency as a first-class language feature** — parallel clauses predated the concurrent programming research of the 1970s

ALGOL 68 was, in historical terms, an evolutionary dead end whose ideas were absorbed into the mainstream. It is remembered as a cautionary tale about excessive complexity in language design — but it is also remembered as the place where many of today's language features were first tried.

---

## 5. Pascal and Its Descendants

### 5.1 Pascal's commercial spread

Pascal's adoption followed three channels:

1. **Academic:** from 1974 onward, Pascal became the default teaching language at most European and many American universities. It replaced ALGOL, FORTRAN, and PL/I in introductory CS courses.
2. **UCSD Pascal and the micro boom:** Bowles's p-System brought Pascal to the Apple II, TI 99/4A, IBM PC, DEC Rainbow, and many other early microcomputers. The p-code model allowed one compiler codebase to target all of them.
3. **Turbo Pascal:** Borland's $49.95 compiler made Pascal a serious tool for professional PC software development in the mid-to-late 1980s.

### 5.2 Apple Pascal and the Macintosh toolbox

When Apple designed the Lisa (1983) and the Macintosh (1984), the team at Apple — which included Bill Atkinson (creator of QuickDraw and HyperCard), Andy Hertzfeld, and many others — used Pascal as the implementation language for the Toolbox: the ROM-resident graphics, window, menu, and event handling routines that the entire Mac OS was built on. The Mac Toolbox was largely Pascal, with some critical pieces in 68000 assembly.

The Mac's programming API was accordingly Pascal-first for years. Inside Macintosh Volume I (1985) presented all APIs in Pascal. C programmers on the Mac had to use Pascal calling conventions, Pascal strings (length-prefixed, limited to 255 characters), and Pascal-style identifiers. The Macintosh Programmer's Workshop (MPW), Apple's primary development environment, shipped with Pascal as its flagship language.

In 1985, Apple collaborated with Niklaus Wirth to extend Pascal with classes and single inheritance. The result was **Object Pascal**, a direct descendant of Pascal with OOP features inspired loosely by Smalltalk and Simula. Object Pascal became the dominant language for Macintosh application development from 1986 through the early 1990s. MacApp, Apple's application framework, was written in Object Pascal.

### 5.3 Turbo Pascal 5.5 and Borland Pascal

In 1989, Borland added Object Pascal extensions to Turbo Pascal, producing Turbo Pascal 5.5 with classes, inheritance, virtual methods, and polymorphism. This was the beginning of the long Borland → Delphi → C# lineage.

Turbo Pascal 6.0 (1990) added Turbo Vision, an object-oriented text-mode UI framework. Turbo Pascal 7.0 (1992) added protected mode support and was the last of the DOS Turbo Pascals. Borland Pascal for Windows (1991) brought the language to 16-bit Windows.

### 5.4 Delphi (1995)

Delphi 1.0 was released by Borland in February 1995. It was designed by Anders Hejlsberg — the same Anders Hejlsberg who had designed the original Turbo Pascal in 1983. Delphi combined:

- Object Pascal as its language
- A visual form designer with drag-and-drop component placement
- A component model: the Visual Component Library (VCL)
- Fast native compilation to x86 machine code (not p-code, not bytecode)
- Integrated database access

Delphi was, at the time of its release, the first truly productive Windows GUI development tool. Microsoft Visual Basic had the visual designer but was interpreted and slow; Visual C++ was fast but lacked the visual component model. Delphi had both.

Delphi was used to build Skype, Total Commander, FL Studio, the original Borland IDE itself, most of the major third-party Windows installers (InstallShield was partially Delphi), countless accounting and medical practice systems, and large portions of the Russian-language software ecosystem (where Delphi remained dominant through the 2010s). The company FastReport, FastReport.NET, and similar reporting tools — all Delphi-derived — are still in use.

### 5.5 Hejlsberg's move to Microsoft, 1996

In late 1996, Microsoft hired Anders Hejlsberg away from Borland for a reported $3 million signing bonus. The move triggered a lawsuit between Borland and Microsoft, which settled in 1997 with Microsoft paying Borland $125 million. Hejlsberg's first project at Microsoft was J++ — Microsoft's extended version of Java — and then J# and eventually C#.

### 5.6 C# (2000) as the grandchild of Pascal

C# 1.0 was released in 2000 as part of Microsoft's .NET Framework. Anders Hejlsberg was its chief designer. Although C# looks superficially like Java (and in fact borrows most of its syntax from C++/Java), its underlying design philosophy is heavily Delphi-influenced:

- **Properties** — C#'s `get`/`set` syntax for properties comes directly from Delphi's properties, which had been a differentiator against Java for years
- **Events** — C#'s multicast delegates and events are modeled on Delphi's component event system
- **Component model** — .NET's attribute-based component metadata reflects Delphi's published properties
- **Enumerations with explicit values** — C#'s enums are closer to Delphi's than Java's
- **`using` statement** — deterministic resource cleanup, also from Delphi

C# is thus an Algol descendant through two independent paths: syntactically through C++ → Java, and architecturally through Pascal → Object Pascal → Delphi.

Hejlsberg remained the principal designer of C# through major versions 2.0 (generics, 2005), 3.0 (LINQ, 2007), 4.0 (dynamic, 2010), 5.0 (async/await, 2012), and beyond. In 2012 he became the principal designer of TypeScript, which is a separate but conceptually related story. Hejlsberg is thus responsible, as lead designer, for Turbo Pascal (1983), Delphi (1995), C# (2000), and TypeScript (2012) — arguably the longest single-designer language career in the history of mainstream programming.

### 5.7 Modula-3 (1988)

Modula-3 was developed at DEC's Systems Research Center (DEC SRC) in Palo Alto by Luca Cardelli, James Donahue, Lucille Glassman, Mick Jordan, Bill Kalsow, and Greg Nelson. It was intended as a serious systems programming language for the successor generation of DEC workstations. The language combined:

- Modula-2's module system
- Object orientation inspired by Oberon
- Exception handling
- Garbage collection
- Strong safety guarantees, including safe/unsafe module separation
- Generics (via a separate interface construction)
- Thread support built into the language

Modula-3 never achieved commercial success — DEC was in decline, SRC was closed in 1998, and no major product used the language widely — but it influenced almost every subsequent language. Guido van Rossum has acknowledged that Python's module system was directly influenced by Modula-3. Java's interface mechanism has echoes of Modula-3's interface module. The C# language team reviewed Modula-3 when designing C# 1.0.

### 5.8 Ada (1983)

Ada has one of the most unusual origin stories of any programming language. In the mid-1970s, the U.S. Department of Defense had identified that it was using over 450 distinct programming languages across its software systems. This was a maintenance catastrophe. The DoD launched an effort, beginning in 1975 with the "Strawman" requirements and continuing through "Woodenman," "Tinman," "Ironman," and "Steelman" (1978), to identify and standardize a single DoD programming language.

The Steelman requirements were detailed: the language had to support strong typing, separate compilation, generics, concurrency, exception handling, low-level hardware access, and formal specification. Four teams were funded to design candidate languages in 1977: Red (Intermetrics), Blue (SofTech), Green (CII Honeywell Bull, led by Jean Ichbiah), and Yellow (SRI International). In 1978 the competition narrowed to Red and Green. In 1979, Green was declared the winner. Green was renamed Ada, after Ada Lovelace.

Ada 83 was standardized as MIL-STD-1815 (Ada Lovelace was born in 1815). It was, at the time of its release, the largest and most complex programming language ever standardized. Its feature set was intimidating:

- **Strong static typing** with named subtypes, range constraints, and the ability to prevent accidental mixing of semantically distinct quantities
- **Packages** for information hiding and separate compilation
- **Generics** (long before Java or C# had them)
- **Tasks** — first-class concurrency units with the rendezvous communication model
- **Exceptions** — first-class exception handling
- **Representation clauses** — the ability to specify exact bit layout for types, critical for hardware interfacing
- **Pragmas** for compiler directives
- **Strong modularity** via packages with private and public sections

Ada was, and is, the dominant programming language in safety-critical aerospace and defense software. The Boeing 777 and 787 flight management systems, the Airbus A340 and A380 systems, many ESA and NASA spacecraft, naval systems, railway signaling systems, and air traffic control systems are written in Ada. The language's strong typing and concurrency model make it well-suited to systems where program failure can kill people.

Ada has been revised several times: Ada 95 (ISO/IEC 8652:1995), Ada 2005, Ada 2012, and Ada 2022. Each revision added features while maintaining backward compatibility. Ada 95 added object-oriented programming (tagged types, class-wide types, dispatching). Ada 2012 added contracts (preconditions, postconditions, invariants), building on work from Eiffel.

**SPARK** is a subset of Ada designed for formal verification, developed by Praxis and now by AdaCore. SPARK code can be proved correct using automated theorem provers. It is used in the Lockheed Martin F-35 flight control software, the iFACTS air traffic control system deployed at NATS (UK), and the Muen separation kernel. SPARK represents one of the few places in mainstream industry where formal program verification is an everyday practice.

Ada is a Pascal descendant in its type system, an Algol 68 descendant in its orthogonal type composition, and a Simula descendant (via Ada 95) in its object system. It is, in many ways, the synthesis of the three major European Algol descendants into a single industrial language.

---

## 6. C as an Algol Descendant

### 6.1 The path from ALGOL 60 to C

People sometimes forget, or never learn, that C is in the Algol family. It does not resemble ALGOL 60 on the surface — no `begin`/`end`, no `procedure`, no Greek-derived keywords — but the lineage is direct, through a chain of British simplifications:

```
    ALGOL 60 (1960, international committee)
        |
    CPL (1963, Strachey & Barron, Cambridge/London)
        |
    BCPL (1967, Martin Richards, Cambridge/MIT)
        |
    B (1969, Ken Thompson, Bell Labs)
        |
    C (1972, Dennis Ritchie, Bell Labs)
```

### 6.2 CPL (1963)

CPL — the Combined Programming Language — was designed at Cambridge and the University of London in 1963, principally by Christopher Strachey and David Barron. It was an ambitious attempt to create a successor to ALGOL 60 that would be suitable for both scientific and business computing. CPL included polymorphic types, records, lambda expressions, lazy evaluation, and first-class functions — features that wouldn't become mainstream for decades.

CPL was never fully implemented. It was too large and too complex for the hardware of the time. Strachey and Barron never finished a working compiler. But CPL's specification circulated at Cambridge, where a young researcher named Martin Richards became interested.

### 6.3 BCPL (1967)

Martin Richards, at Cambridge and later at MIT's Project MAC, designed BCPL — the Basic CPL — in 1966 and implemented it in 1967. BCPL was a radical simplification of CPL. The key design decision: **BCPL was typeless.** Every value was a machine word. Arithmetic, pointers, and characters were all the same type. The compiler's job was to generate efficient code, not to enforce type safety.

BCPL had the features that later became C's skeleton:

- Block structure with curly braces (well, actually `$(` and `$)` — BCPL introduced the curly-brace idea but used digraphs because many keyboards lacked the curly brace keys)
- `if`, `while`, `for` control flow
- Procedures with parameters
- Arrays
- Pointers as arithmetic entities — you could add an integer to a pointer and get another pointer
- A simple runtime, easy to port

BCPL was used to write the TRIPOS operating system at Cambridge, and later the AmigaOS kernel. Richards's 1967 CACM paper *BCPL: A tool for compiler writing and system programming* explained the language and its design philosophy: smallness, portability, systems programming orientation.

### 6.4 B (1969)

In 1969, Ken Thompson at Bell Labs wanted a high-level language for the PDP-7 on which he was prototyping Unix. He took BCPL and simplified it further — removing some features, shortening keyword names, making the runtime tiny. The result was B. Thompson wrote some early Unix utilities in B; the bulk of Unix remained in PDP-7 assembly, but B was the experimental high-level language.

B inherited BCPL's typeless model: every value was a machine word. This worked adequately on the PDP-7 and PDP-11 when memory and registers were word-addressable. But when Bell Labs got a PDP-11/20 with byte-addressable memory, the typeless model became awkward. You needed to distinguish characters from integers. You needed to distinguish pointers from integers. B was showing its limits.

### 6.5 C (1972)

Dennis Ritchie took over the language project in 1971-1972 and added a type system. The new language was called C — successor to B, and also by sound-alike the letter after B in BCPL. C's initial types were `int`, `char`, `float`, `double`, and pointers thereto. Ritchie also added:

- `struct` — records, directly from Algol 68
- `union` — tagged/untagged unions, from Algol 68
- Arrays that decayed to pointers on use (a pragmatic compromise enabling efficient passing)
- Function declarations with typed parameters (K&R style initially, then ANSI prototypes in 1989)
- The preprocessor, with `#include`, `#define`, and conditional compilation

C 1972 was used to rewrite Unix for the PDP-11, and by 1973 Unix was largely a C program. This was a watershed: it was the first time a major operating system had been written almost entirely in a high-level language. The result was that Unix — and, through Unix, C — was portable. When Unix needed to run on a new machine, you ported the C compiler (a comparatively small job) and then recompiled the OS.

The 1978 book *The C Programming Language* by Brian Kernighan and Dennis Ritchie — universally known as "K&R" — defined C for a generation. K&R C is the version of C described in that book: the first edition, before the ANSI C standardization effort. The second edition (1988) tracked the ANSI C draft. K&R is considered, alongside the ALGOL 60 Report, one of the most elegant programming language books ever written.

### 6.6 What C inherited from Algol, and what it abandoned

C inherited from ALGOL 60 and ALGOL 68:

- Block structure (with curly braces instead of begin/end)
- Lexical scoping with static nested scopes
- Static type system (weaker than ALGOL 68's, stronger than BCPL's)
- Recursive procedures
- Structured control flow (`if`, `while`, `for`, `do`, `switch`)
- Function parameters (by value, with pointers for reference semantics)
- `struct` and `union` (directly from ALGOL 68)

C abandoned from ALGOL 60:

- **Call-by-name** — ALGOL 60 had call-by-name, an elegant but confusing parameter mode. C dropped it entirely.
- **Dynamic array bounds** — ALGOL 60 allowed array bounds to be computed at block entry. C required compile-time constant bounds (until C99 added variable-length arrays).
- **Nested function definitions** — ALGOL 60 had properly nested functions with access to enclosing scope. C did not. (GCC added nested functions as an extension, but ISO C never did.)
- **Strict type checking** — ALGOL 60's typing was weak, but it was stricter than C's. C allowed implicit conversions between pointers and integers, between different pointer types, and performed no runtime array bounds checking.

C added:

- **Pointer arithmetic** — pointers were first-class values that could be incremented, compared, and used in expressions. No ALGOL ancestor had this.
- **Explicit memory layout** — `sizeof`, alignment control, byte-level access
- **Bit operations** — `&`, `|`, `^`, `<<`, `>>` at the value level, critical for systems programming
- **Macro preprocessor** — `#define` for textual substitution, `#include` for source inclusion, `#ifdef` for conditional compilation
- **`for` loop with three expressions** — `for (init; cond; step)`, a C innovation that became universal
- **The NULL-terminated string convention** — strings were arrays of char terminated by a zero byte. This was a pragmatic choice for the PDP-11; it has since caused countless buffer overflows.

### 6.7 C standards timeline

- **K&R C** (1978) — first edition of the K&R book, informal definition
- **ANSI C / C89** (1989) — ANSI X3.159-1989, the first formal standard; introduced function prototypes, `void` type, `const` qualifier, `volatile` qualifier, standard library specification
- **ISO C / C90** (1990) — ISO adoption of ANSI C, essentially identical
- **C95** (1995) — amendment adding wide character support
- **C99** (1999) — variable-length arrays, `_Bool`, `long long int`, compound literals, designated initializers, `inline` functions, `//` comments
- **C11** (2011) — threads, atomics, generic selection, static assertions, anonymous structs/unions
- **C17** (2017) — bug-fix revision, no new features
- **C23** (2023) — `bool`, `nullptr`, `typeof`, `constexpr`, attribute syntax, digit separators, binary literals

### 6.8 C++: Simula + C

C++ was created by Bjarne Stroustrup at Bell Labs, starting in 1979 as "C with Classes." The first release of C++ with that name was in 1983. The first edition of *The C++ Programming Language* was published in 1985.

Stroustrup's goal was explicit: combine the object-oriented features he had learned from Simula 67 during his PhD at Cambridge with the efficiency and hardware proximity of C. C++ is thus the direct confluence of two Algol descendants — one from the Simula branch and one from the BCPL/B branch.

C++ features added on top of C:

- Classes, inheritance, virtual methods (from Simula)
- Templates — parametric polymorphism for types (C++'s own invention, heavily influenced by Ada generics)
- Operator overloading (from Algol 68)
- References (from Algol 68, refined)
- Exception handling (from Modula-3 and Ada)
- Namespaces (from Modula-2 and Ada)
- Standard Template Library — the STL, designed by Alexander Stepanov and Meng Lee, a synthesis of generic programming ideas from Ada and Lisp

C++ has gone through major revisions: C++98, C++03, C++11 (a major modernization including lambdas, auto type inference, smart pointers, rvalue references), C++14, C++17, C++20 (concepts, modules, coroutines, ranges), C++23, and C++26. It remains one of the most widely used systems programming languages in 2026, competing with Rust in the low-level systems niche.

---

## 7. Java, C#, and the Corporate Algol Descendants

### 7.1 Java (1995)

Java was designed by James Gosling at Sun Microsystems, beginning in 1991 as part of the "Green Project" — an attempt to build a portable language for consumer electronics devices (set-top boxes, handheld controllers). The original name was "Oak," after a tree outside Gosling's office. When Sun lost a naming dispute, it was renamed "Java" in 1995.

Java was released to the public in 1995 with the explicit marketing slogan "simpler than C++." The design decisions that made it simpler:

- No pointer arithmetic
- No manual memory management (garbage collection, from Simula and Smalltalk)
- No multiple inheritance (replaced with interfaces)
- No operator overloading
- No templates initially (generics were added in Java 5, 2004)
- No preprocessor
- No structs (only classes)
- No explicit references and values (everything is either a primitive or a reference)
- A single-rooted class hierarchy with `java.lang.Object` at the top

Java's heritage can be traced:

- **Syntax:** C and C++ (curly braces, semicolons, `if`/`else`/`while`/`for`)
- **Object model:** Simula 67 and Smalltalk, via C++
- **Memory model:** Simula 67 and Smalltalk (garbage collection)
- **Type system:** Strong static typing in the Pascal/Modula tradition
- **Virtual machine:** The JVM inherits from the Pascal p-Machine (UCSD p-System, 1977), both in concept and in some implementation techniques
- **Packages:** Modula-2 and Ada
- **Interfaces:** Modula-3 and Objective-C protocols
- **Exception handling:** Modula-3, Ada, C++
- **Inner classes:** added in Java 1.1 (1997), influenced by Beta (a Simula descendant)

Java's tagline was "write once, run anywhere." The JVM made this possible. Any machine with a JVM implementation could run the same compiled .class file. This was the same trick the UCSD p-System had used 18 years earlier, but with more marketing muscle and at a better moment in history (the Internet and the rise of heterogeneous client/server deployment).

Java's enterprise adoption through the late 1990s and 2000s was massive. By 2010, Java was arguably the dominant programming language in corporate IT, with vast ecosystems around J2EE/Java EE, Spring, Hibernate, the Eclipse IDE, Maven, and the JVM-based ecosystem.

### 7.2 The JVM lineage

The Java Virtual Machine is an Algol descendant by another path — the path of portable bytecode virtual machines. The lineage is roughly:

- UCSD Pascal p-machine (1977) — first widely deployed portable VM for a high-level language
- Smalltalk VMs (1970s-1980s)
- Forth (not Algol-descended but conceptually related)
- Self VM (1987, Ungar and Smith) — the VM that introduced JIT compilation
- The Java HotSpot VM (2000) — based directly on Self VM technology, written by many of the same people (Lars Bak, David Ungar)
- V8 (2008) — Lars Bak again, bringing Self/HotSpot techniques to JavaScript

### 7.3 C# (2000) revisited

C# was released with .NET Framework 1.0 in 2002 (the language was finalized in 2000-2001). Anders Hejlsberg was the lead designer.

C# inherited from multiple sources:

- **Java:** syntax, garbage collection, single inheritance + interfaces, strong typing
- **Delphi:** properties, events, component model, `using` blocks for deterministic cleanup, direct interop with native code
- **C++:** operator overloading (reintroduced), unsafe code blocks, pointer operations in unsafe contexts
- **Pascal:** enumeration types with explicit values, strong typing, `nullable` types in later versions

C# has evolved rapidly. Major milestones:

- **C# 1.0 (2002):** initial release
- **C# 2.0 (2005):** generics, nullable types, anonymous methods, partial classes, iterators with `yield`
- **C# 3.0 (2007):** LINQ, lambda expressions, extension methods, anonymous types, expression trees — the most significant revision, adding functional-style query syntax to the language
- **C# 4.0 (2010):** dynamic binding, named/optional parameters
- **C# 5.0 (2012):** `async`/`await` — the first mainstream language after F# to make asynchronous programming ergonomic
- **C# 6.0 (2015):** string interpolation, null-conditional operator, expression-bodied members
- **C# 7.x (2017-2018):** tuples, pattern matching, local functions
- **C# 8.0 (2019):** nullable reference types, default interface methods, pattern enhancements
- **C# 9.0 (2020):** records, init-only setters, top-level statements
- **C# 10.0 (2021):** global usings, file-scoped namespaces
- **C# 11.0 (2022):** raw string literals, generic math
- **C# 12 (2023):** primary constructors, collection expressions

### 7.4 Kotlin (2011)

Kotlin was designed at JetBrains, starting in 2010, with the goal of being a better Java for JetBrains's IntelliJ IDEA developers. Kotlin 1.0 was released in 2016. In 2017, Google announced Kotlin as a first-class language for Android development, and in 2019 it became Google's preferred Android language.

Kotlin's design:

- Fully interoperable with Java (runs on the JVM, can call Java and be called from Java)
- Null safety built into the type system (`String` vs `String?`)
- Data classes (records before Java had them)
- Extension functions
- Coroutines for asynchronous programming
- Smart casts
- Sealed classes for exhaustive pattern matching

Kotlin is Algol-family through Java. It shows the progressive refinement of the Algol-descendant tradition: Java simplified C++, Kotlin simplified Java, and each step added more safety while reducing boilerplate.

### 7.5 Scala (2003)

Scala was designed by Martin Odersky at EPFL in Lausanne, Switzerland, released in 2003. Odersky had worked on the Java generics proposal (JSR 14, the work that became Java 5 generics), and Scala grew out of his research on combining functional and object-oriented programming on the JVM.

Scala is Algol-family through Java, but its type system is heavily influenced by ML and Haskell. It introduced or popularized on the JVM:

- Case classes and pattern matching (from ML)
- First-class functions and higher-order functions
- Implicit parameters and implicit conversions
- Traits (mixin inheritance)
- Type inference
- Higher-kinded types
- A unified type hierarchy with `Any` at the top and `Nothing` at the bottom

Scala powers Apache Spark, the dominant big data framework of the 2010s, as well as Twitter's backend and many other large systems. Scala 3 (2021) is a significant redesign that cleans up the type system and simplifies the syntax.

### 7.6 Go (2009)

Go was designed at Google, starting in 2007, with first release in 2009. The designers were Robert Griesemer (Wirth's ETH student), Rob Pike (Bell Labs, Plan 9), and Ken Thompson (Bell Labs, C, Unix, B).

Go's explicit design philosophy is in the Wirth tradition: a small language, simple syntax, fast compilation, explicit over implicit. Griesemer has said in talks that Go's feel is deliberately modeled on the languages he learned from Wirth at ETH. Pike's Plan 9 background contributed the emphasis on simplicity and the preference for composition over inheritance. Thompson's C background contributed the hardware proximity and the efficient runtime.

Go's features:

- Small language specification (the Go spec is around 90 pages; the C++ standard is over 1,000)
- Fast compilation
- Built-in concurrency: goroutines (cheap threads) and channels (CSP-style communication, from Hoare's 1978 paper)
- Garbage collection
- Structural typing for interfaces
- No inheritance (composition only)
- No generics initially; generics added in Go 1.18 (2022) after years of debate
- Standard library emphasis
- `gofmt` — a canonical code formatter, removing arguments about style

Go is the most explicitly Wirthian of the modern languages. Its small size, fast compilation, and focus on readability are a direct continuation of the Pascal/Modula/Oberon tradition. The fact that Griesemer was Wirth's student makes the lineage explicit.

### 7.7 Rust (2010)

Rust was originally a personal project of Graydon Hoare at Mozilla, starting in 2006. Mozilla took over sponsorship in 2009, and Rust 1.0 was released in 2015.

Rust's goal is memory safety without garbage collection, achieved through the ownership and borrowing type system. Its heritage:

- **Syntax:** Algol-family (curly braces, C-like), though with some ML influences (`let`, pattern matching, `match`)
- **Type system:** Hindley-Milner-inspired with affine types, algebraic data types, traits (from Haskell type classes)
- **Memory model:** Unique ownership, based on linear/affine type theory and prior work on Cyclone and resource types
- **Concurrency:** No data races by construction — the type system prevents them

Rust is a dual-lineage language: Algol-family on the surface, ML-family underneath. It is one of the few languages to have achieved commercial success while borrowing so heavily from academic functional programming. In 2026 it is widely used for systems programming, embedded work, browser engines (Servo, parts of Firefox), Linux kernel modules (since 2022), and high-performance web services.

### 7.8 Swift (2014)

Swift was designed by Chris Lattner at Apple, with work starting in 2010 and public release in 2014. Lattner had previously created LLVM, which became Apple's compiler infrastructure. Swift was designed to replace Objective-C for Apple platform development.

Swift's heritage:

- **Objective-C:** object model, class hierarchies, protocols
- **Algol/C:** syntax with curly braces, statements and expressions
- **Rust/ML:** pattern matching, enums with associated values (sum types), `let` vs `var`, type inference
- **Haskell:** protocol extensions and conditional conformance are reminiscent of type class hierarchies

Swift is Algol-family in its surface syntax and its structured control flow, but it incorporates many post-Algol ideas: sum types, generics with protocol constraints, optional types built into the language, `guard` statements for early exit.

### 7.9 Nim, Zig, D, Crystal, V, Dart

Several smaller or newer Algol-family languages deserve mention:

- **D (2001, Walter Bright):** a C++ successor intended to clean up C++'s warts. Adds garbage collection (optional), unified contracts, template metaprogramming, and a cleaner standard library. Used in some production but never reached C++-level adoption.
- **Nim (2008, Andreas Rumpf):** a Pascal-meets-Python-meets-Lisp language. Python-like indentation syntax, compile-to-C model, strong macro system. Small but active community.
- **Crystal (2014):** a statically typed language with Ruby-like syntax. Ruby is itself influenced by Smalltalk (through Matz's love of Smalltalk) and thus indirectly by Simula.
- **Dart (2011, Lars Bak and Gilad Bracha at Google):** initially a JavaScript replacement, now the language of Flutter. Algol-family syntax, class-based OOP, optional typing in early versions made mandatory later.
- **Zig (2016, Andrew Kelley):** a C successor focused on simplicity and explicit behavior. Manual memory management, no hidden control flow, compile-time metaprogramming.
- **V (2019):** a small language inspired by Go, Rust, and Oberon. Focus on fast compilation and simplicity.

All of these are Algol descendants. None broke the Wirth/Kernighan dialectic that has defined Algol-descendant languages since the 1970s — some lean toward Wirthian simplicity (Go, V, Oberon), others toward Kernighan-Ritchie expressive power (D, Rust, C++). The tradition continues.

---

## 8. The Algol Family Resemblance

### 8.1 Features shared by every Algol descendant

Across the 60+ years of the Algol family, certain features recur in every significant descendant. These are the Algol family resemblance:

- **Block structure.** Statements are grouped into nested blocks. Each block is itself a statement. Blocks delimit scope. The delimiters vary (`begin`/`end`, `{`/`}`, indentation in Python-influenced descendants like Nim), but the nesting structure is universal.
- **Lexical scoping with static name resolution.** A variable's meaning is determined by the textual structure of the program, not by the dynamic call chain. This was ALGOL 60's contribution, replacing the dynamic scoping of earlier languages (including many Lisps of the era).
- **Structured control flow.** `if`/`else`, `while`, `for`, `break`, `continue`, `return` — no arbitrary `goto` as the primary mechanism. The 1968 Dijkstra letter *Go To Statement Considered Harmful* crystallized a consensus that had been building in the Algol community for years.
- **Proper recursion.** Functions can call themselves. This requires a runtime stack discipline — something ALGOL 60 specified and that every descendant has inherited.
- **Typed variables.** Every variable has a type, even if inferred. The strictness varies from ALGOL 60's modest typing through C's weak typing through ALGOL 68's orthogonal typing through Pascal's strong typing through Rust's linear typing. But the commitment to "types exist at compile time and the compiler checks them" is universal.
- **Compound data types.** Records/structs, arrays, and (in most descendants) pointers/references. The combinators vary; the commitment to data structure as a first-class language concern is universal.
- **Expression/statement distinction.** Most Algol descendants distinguish expressions (which have values) from statements (which cause effects). Pure expression-oriented descendants (ALGOL 68, Rust, Scala) weaken this distinction but do not eliminate it.
- **First-class procedures/functions (in most).** Functions can be parameters, assigned to variables, and returned. ALGOL 60 had this partially; ALGOL 68 made it fully first-class; Pascal had restrictions; Modula-2 weakened it; later languages (Go, Rust, Swift, Kotlin) restored full first-class function support.

### 8.2 Features ALGOL 60 did NOT have that most descendants added

- **Strong static type systems.** ALGOL 60's typing was relatively weak. Pascal, Modula, Ada, ML, Rust, and Swift all strengthened it.
- **Explicit pointers or references.** ALGOL 60 had neither explicit pointers (as in C) nor explicit references (as in ALGOL 68). Every descendant added one or both.
- **Object orientation.** Simula added it to the family; Smalltalk refined it; C++, Java, and C# industrialized it; Go and Rust pushed back toward composition.
- **Exception handling.** CLU (1975) introduced it; Ada and Modula-3 popularized it; C++, Java, and Python made it ubiquitous.
- **Generics / parametric polymorphism.** CLU introduced it for the Algol family; Ada popularized it; C++ templates industrialized it; Java and C# brought it to the mainstream.
- **Modules and separate compilation.** ALGOL 60 did not have modules. Modula added them. Ada refined them. Java and C# made them standard.
- **Closures.** ALGOL 60 had them in a limited way (nested procedures with access to enclosing scope). Most descendants lost this capability (Pascal's nested functions were restricted, C had no closures at all). Modern Algol descendants restored full closure support, influenced by Lisp and ML.
- **Pattern matching.** Not in ALGOL at all. Added to the Algol family via ML and Scala, now standard in Rust, Swift, Kotlin, and modern C#.
- **Algebraic data types.** Also not in ALGOL. Added via ML and propagated through Haskell, OCaml, F#, Rust, Swift.

### 8.3 The deep genealogical claim

Every feature in the above lists has a traceable path back to ALGOL 60. The path may go through Simula (OOP), Modula (modules), CLU (exceptions, generics), Ada (concurrency, representation clauses), ALGOL 68 (orthogonal types, references, operator overloading), ML (pattern matching, type inference), or Haskell (type classes, algebraic data types) — but in every case, the structural frame of the language (blocks, scopes, procedures, types, control flow) is ALGOL 60's frame.

Remove ALGOL 60 from the history of computing, and the entire landscape of mainstream programming collapses. There would still be Lisp and Forth and APL. There would still be specialized languages. But the family of "normal-looking" languages that an average programmer works with — from Python to Java to C++ to Rust — would not exist in recognizable form. ALGOL 60 is the trunk of the tree.

---

## 9. What the Algol Tradition Means

### 9.1 Algol as a paper language

ALGOL 60 was designed to be read. The Revised Report (Naur, ed., 1963) is a document written for human understanding. The language was specified with mathematical precision not because machines needed it, but because humans did — specifically, because programmers needed to agree on what a program meant, independent of any particular implementation.

This is the first principle of the Algol tradition: **a program is a document.** A program has an author, a reader, a structure, and a meaning that must be readable by humans. The compiler is one reader among many — and possibly the least important one. The fellow programmer who will maintain the code in 10 years, the student who will learn from it, the reviewer who will evaluate it, the mathematician who will prove it correct — all of these are the audience for the program.

### 9.2 What the Algol tradition privileges

- **Readability.** Code should read like prose, not like a hardware specification.
- **Structural clarity.** The program's structure should be visible on the page. Nesting, scope, control flow, and data layout should be explicit and obvious.
- **Formal specification.** The language's meaning should be precisely definable, so that programs can be reasoned about.
- **Pedagogical value.** The language should be teachable. A working programmer should be able to learn it and use it correctly.
- **Portability.** Programs should work the same way on different machines. Machine-specific behavior should be confined and explicit.
- **Safety.** The language should prevent common mistakes — type errors, out-of-bounds accesses, uninitialized variables — when it can do so without sacrificing efficiency.

### 9.3 What the Algol tradition opposes

- **Machine-specific notation.** Assembly-like constructs in high-level languages, bit-level tricks exposed as normal syntax.
- **Hand-tuned escape hatches as standard practice.** The Algol tradition allows machine access when needed but marks it clearly (Modula-2's `SYSTEM` module, Rust's `unsafe` blocks, Ada's `pragma` directives).
- **Unreadable shortcuts.** Clever abbreviations, operator abuse, implicit conversions that surprise the reader.
- **Undefined behavior.** If the language doesn't specify what a program does, you can't reason about the program. The Algol tradition treats undefined behavior as a defect in the language specification, not as an optimization opportunity.

### 9.4 The C tradition split

The C tradition — Kernighan, Ritchie, Thompson, and their successors — inherits Algol's structural apparatus (blocks, scopes, types, control flow) but abandons many of Algol's ideals:

- C has undefined behavior — lots of it
- C allows programmer-controlled pointer arithmetic that can corrupt memory
- C has a weak type system that permits dangerous implicit conversions
- C's NULL-terminated strings are fast but error-prone
- C's preprocessor enables unstructured source transformations
- C's macro system has no hygiene
- C's error handling (return codes, `errno`) is ad-hoc

These choices were reasonable for 1972 on a PDP-11, where every cycle mattered and the programmer was assumed to be a systems expert working close to the hardware. They became problematic as C spread to application programming, network-facing software, and multi-author codebases. Every major category of security vulnerability in the last 40 years — buffer overflows, format string bugs, integer overflows, use-after-free — has roots in C's particular escape from the Algol tradition's safety discipline.

C++ inherited the same discipline and added more unsafe features (pointer arithmetic on typed pointers, manual memory management for class instances, raw references). Java and the later corporate descendants pulled back toward Algol safety (no pointer arithmetic, garbage collection, bounds checking) while retaining most of C's syntactic surface.

### 9.5 The modern revival

The 2010s saw an explicit return toward Algol's original ideals in the design of Rust, Swift, Go, and Kotlin. All four languages share certain commitments that Wirth would have recognized:

- Memory safety by default, with explicit unsafe escape hatches
- Strong static typing with good inference
- Clear, readable syntax (even Rust, despite its reputation, has more in common with Pascal than with C)
- Formal specification efforts (Rust has the Rust Reference; Swift has the Swift Language Guide; Go has the Go specification)
- Small language cores with separate standard libraries
- Explicit concurrency primitives
- Tools for formatting, linting, and verification

These languages do not agree on everything. Rust is complex; Go is minimal. Swift is compromising with Objective-C legacy; Kotlin with Java. But all four represent a return, after the C++ complexity era of the 1990s-2000s, to the Algol view that a program is a document that must be readable and safe.

The debate is not settled. C and C++ remain in production. New systems are still being started in them, particularly in performance-critical contexts. The "dangerous expressiveness versus safe readability" axis that Wirth and Ritchie represented is still the axis on which language design is debated. Wirth would say we are still paying the cost of Ritchie's pragmatism. Ritchie would say we have the systems we have because of that pragmatism, and without it we would still be programming in ALGOL 68.

Both are right. That is the Algol tradition.

---

## 10. Wirth's Quotes and Philosophy

The Wirth quotes that have circulated in the programming community since the 1970s:

> "Software is getting slower more rapidly than hardware becomes faster."
>
> — *A Plea for Lean Software*, IEEE Computer, February 1995. The statement known as Wirth's Law.

> "The belief that complex systems require armies of designers and programmers is wrong. A system that is not understood in its entirety, or at least to a significant degree of detail by a single individual, should probably not be built."
>
> — *A Plea for Lean Software*, 1995

> "A primary cause of complexity is that software vendors uncritically adopt almost any feature that users want. Any incompatibility with the original system concept is either ignored or passed over in silence."
>
> — *A Plea for Lean Software*, 1995

> "Reducing complexity and size must be the goal in every step — in system specification, design, and in detailed programming. A programmer's competence should be judged by the ability to find simple solutions, certainly not by productivity measured in 'lines produced per month.' Prolific programmers contribute to certain disaster."
>
> — *A Plea for Lean Software*, 1995

> "Algorithms + Data Structures = Programs."
>
> — Title of Wirth's 1976 textbook. The slogan captures his view that a program is fundamentally a composition of data (the things being operated on) and algorithms (the operations), and that a language should make both visible.

> "I am sorry, but if you need this explanation, you shouldn't be programming computers."
>
> — Reported answer, ETH lecture, when asked to justify a design decision in Oberon. Possibly apocryphal but widely circulated.

> "Software engineering might be considered one of the exact sciences."
>
> — The opening claim of his 1995 essay, a claim he spent the rest of his career trying to justify.

> "Americans might suggest Modula-2 is merely a teaching language. But I would suggest that anything that is not suitable for teaching is not suitable as a programming language at all."
>
> — Wirth, interview in the 1980s, defending Modula-2 against charges that it was "only" a teaching language.

> "My whole life is a series of attempts to reduce complexity."
>
> — Wirth, in interviews near the end of his career.

The essential Wirth is: smallness is a virtue, simplicity is hard, complexity is a failure of design, the programmer's job is to understand, and the language's job is to make understanding possible. This philosophy is the opposite of the trajectory of most mainstream languages, which accumulate features over decades. Wirth was, in a sense, the conscience of the Algol family — the voice reminding everyone that the original goal was clarity, not expressive power.

### 10.1 Wirth's influence on Go

Robert Griesemer was one of Wirth's doctoral students at ETH Zürich. Griesemer's dissertation, *A Programming Language for Vector Computers* (1996), was supervised by Wirth and Mössenböck. Griesemer later worked at DEC SRC on the Java HotSpot VM, then at Google, where he co-created Go with Rob Pike and Ken Thompson.

Griesemer has repeatedly credited Wirth's influence on Go's design philosophy. In a 2015 talk *The Evolution of Go*, Griesemer said:

> We wanted Go to feel the way Oberon felt to me as a student at ETH. Small, comprehensible, fast to compile, possible to hold in your head. We did not want the programmer to have to choose between fifteen ways to do the same thing. We wanted the programmer to be able to read a Go program and know exactly what it would do.

Go's specification is short. Its compiler is fast. Its standard library is extensive but its language core is minimal. These are Wirthian virtues, imported directly through Griesemer from the Oberon tradition into a language now used at Google, Cloudflare, Docker, Kubernetes, and thousands of other places.

Wirth died in January 2024. Griesemer and the Go team posted a tribute. Go 1.22 was released a few weeks later. The tradition continues.

---

## 11. Bibliography

Primary sources (language reports and defining papers):

- **ALGOL 60:** Naur, P. (ed.) (1963). "Revised Report on the Algorithmic Language ALGOL 60." *Communications of the ACM* 6(1), 1-17.
- **Simula 67:** Dahl, O.-J., Myhrhaug, B., Nygaard, K. (1968). *SIMULA 67 Common Base Language*. Norwegian Computing Center Publication S-22, Oslo.
- **Simula history:** Dahl, O.-J., Nygaard, K. (1966). "SIMULA — an ALGOL-based Simulation Language." *Communications of the ACM* 9(9), 671-678.
- **Simula retrospective:** Dahl, O.-J. (2002). "The Birth of Object Orientation: The Simula Languages." In *From Object-Orientation to Formal Methods: Essays in Memory of Ole-Johan Dahl*, Springer LNCS 2635.
- **ALGOL W:** Wirth, N., Hoare, C. A. R. (1966). "A Contribution to the Development of ALGOL." *Communications of the ACM* 9(6), 413-432.
- **ALGOL 68:** van Wijngaarden, A., Mailloux, B. J., Peck, J. E. L., Koster, C. H. A. (1969). "Report on the Algorithmic Language ALGOL 68." *Numerische Mathematik* 14, 79-218.
- **ALGOL 68 revised:** van Wijngaarden, A., et al. (1976). "Revised Report on the Algorithmic Language ALGOL 68." *Acta Informatica* 5, 1-236.
- **Pascal:** Wirth, N. (1971). "The Programming Language Pascal." *Acta Informatica* 1, 35-63.
- **Pascal book:** Jensen, K., Wirth, N. (1974). *Pascal User Manual and Report*. Springer-Verlag.
- **Modula-2:** Wirth, N. (1982). *Programming in Modula-2*. Springer-Verlag. Four editions through 1988.
- **Oberon:** Wirth, N. (1988). "The Programming Language Oberon." *Software: Practice and Experience* 18(7), 671-690.
- **Oberon system:** Wirth, N., Gutknecht, J. (1992). *Project Oberon: The Design of an Operating System and Compiler*. Addison-Wesley.
- **Wirth's Plea:** Wirth, N. (1995). "A Plea for Lean Software." *IEEE Computer* 28(2), 64-68.
- **Wirth textbook:** Wirth, N. (1976). *Algorithms + Data Structures = Programs*. Prentice-Hall.
- **CPL:** Barron, D. W., Buxton, J. N., Hartley, D. F., Nixon, E., Strachey, C. (1963). "The Main Features of CPL." *Computer Journal* 6(2), 134-143.
- **BCPL:** Richards, M. (1969). "BCPL: A tool for compiler writing and system programming." *AFIPS Spring Joint Computer Conference Proceedings* 34, 557-566.
- **C:** Kernighan, B. W., Ritchie, D. M. (1978). *The C Programming Language*. Prentice-Hall. Second edition 1988.
- **C history:** Ritchie, D. M. (1993). "The Development of the C Language." *ACM SIGPLAN Notices* 28(3), 201-208. Also in *History of Programming Languages II* (HOPL-II), ACM Press, 1996.
- **C++:** Stroustrup, B. (1985). *The C++ Programming Language*. Addison-Wesley. Fourth edition 2013.
- **C++ history:** Stroustrup, B. (1994). *The Design and Evolution of C++*. Addison-Wesley.
- **Ada 83:** U.S. Department of Defense (1983). *Reference Manual for the Ada Programming Language*. MIL-STD-1815A.
- **Ada 95:** ISO/IEC 8652:1995. *Information technology — Programming languages — Ada*.
- **Ada 2012:** ISO/IEC 8652:2012.
- **Ada history:** Whitaker, W. A. (1993). "Ada — The Project: The DoD High Order Language Working Group." *ACM SIGPLAN Notices* 28(3), 299-331. HOPL-II.
- **Modula-3:** Nelson, G. (ed.) (1991). *Systems Programming with Modula-3*. Prentice-Hall.
- **Java:** Gosling, J., Joy, B., Steele, G. (1996). *The Java Language Specification*. Addison-Wesley. Multiple editions.
- **C#:** Hejlsberg, A., Torgersen, M., Wiltamuth, S., Golde, P. (2003). *The C# Programming Language*. Addison-Wesley. Multiple editions.
- **Kotlin:** Jemerov, D., Isakova, S. (2017). *Kotlin in Action*. Manning.
- **Go:** Donovan, A. A. A., Kernighan, B. W. (2015). *The Go Programming Language*. Addison-Wesley.
- **Rust:** Klabnik, S., Nichols, C. (2019). *The Rust Programming Language*. No Starch Press.

Historical surveys:

- Bergin, T. J., Gibson, R. G. (eds.) (1996). *History of Programming Languages — II*. ACM Press / Addison-Wesley. Proceedings of HOPL-II, including papers by Ritchie (C), Stroustrup (C++), Whitaker (Ada), Hejlsberg and others.
- Wexelblat, R. L. (ed.) (1981). *History of Programming Languages*. Academic Press. Proceedings of HOPL-I, including papers by Backus, Naur, Perlis on ALGOL.
- Sebesta, R. W. (2018). *Concepts of Programming Languages*, 12th edition. Pearson. Standard textbook, covers Algol family in detail.
- Scott, M. L. (2015). *Programming Language Pragmatics*, 4th edition. Morgan Kaufmann.

Landmark essays and talks:

- Dijkstra, E. W. (1968). "Go To Statement Considered Harmful." *Communications of the ACM* 11(3), 147-148. The canonical structured programming manifesto.
- Dijkstra, E. W. (1972). "The Humble Programmer." ACM Turing Award Lecture. *Communications of the ACM* 15(10), 859-866.
- Hoare, C. A. R. (1980). "The Emperor's Old Clothes." ACM Turing Award Lecture. *Communications of the ACM* 24(2), 75-83. Discusses ALGOL 60, ALGOL 68, Pascal, and the lessons of language design.
- Landin, P. J. (1966). "The Next 700 Programming Languages." *Communications of the ACM* 9(3), 157-166. Argues that most new languages are variations on Algol.
- Kay, A. C. (1993). "The Early History of Smalltalk." *ACM SIGPLAN Notices* 28(3), 69-75. HOPL-II. Credits Simula as a principal inspiration.

Memorial and biographical:

- ETH Zürich (January 2024). *In Memoriam: Niklaus Wirth, 1934-2024*. ETH press release.
- Pike, R. (2024). "On Wirth." Blog post, January 2024.
- Griesemer, R. (2015). "The Evolution of Go." Google Tech Talk.

---

## Appendix A: Timeline of major Algol descendants

| Year | Language | Designer(s) | Organization | Family role |
|------|----------|-------------|--------------|-------------|
| 1958 | ALGOL 58 (IAL) | International committee | ACM/GAMM | Precursor |
| 1960 | ALGOL 60 | Backus, Naur, Bauer, Perlis, Dijkstra, van Wijngaarden, others | International | **Root** |
| 1962 | Simula I | Dahl, Nygaard | Norwegian Computing Center | Simulation extension |
| 1963 | CPL | Strachey, Barron | Cambridge/London | British Algol-like |
| 1966 | ALGOL W | Wirth, Hoare | Stanford/ETH | Wirth minority |
| 1967 | BCPL | Richards | Cambridge/MIT | Typeless systems language |
| 1967 | Simula 67 | Dahl, Nygaard, Myhrhaug | Norwegian Computing Center | **OOP invented** |
| 1968 | ALGOL 68 | van Wijngaarden et al. | IFIP | Maximalist successor |
| 1969 | B | Thompson | Bell Labs | BCPL simplification |
| 1970 | Pascal | Wirth | ETH Zürich | Teaching language |
| 1972 | C | Ritchie | Bell Labs | B + types, Unix implementation |
| 1972 | Smalltalk-72 | Kay, Ingalls, others | Xerox PARC | Pure OOP (Simula-inspired) |
| 1975 | Modula | Wirth | ETH Zürich | Module research |
| 1975 | CLU | Liskov, others | MIT | Abstract data types, exceptions, iterators |
| 1977 | UCSD Pascal | Bowles | UC San Diego | Portable Pascal |
| 1978 | Modula-2 | Wirth | ETH Zürich | Systems language |
| 1979 | C with Classes | Stroustrup | Bell Labs | Simula + C |
| 1983 | Turbo Pascal | Hejlsberg | Borland | Commercial Pascal |
| 1983 | Ada 83 | Ichbiah et al. | CII Honeywell Bull | DoD standard |
| 1983 | C++ | Stroustrup | Bell Labs | Renamed C with Classes |
| 1985 | Object Pascal | Apple + Wirth | Apple | Mac OOP Pascal |
| 1986 | Oberon | Wirth, Gutknecht | ETH Zürich | Minimalist successor |
| 1988 | Modula-3 | Cardelli, Nelson, others | DEC SRC | Systems research |
| 1989 | C89 / ANSI C | ANSI X3J11 | ANSI | First C standard |
| 1995 | Java | Gosling | Sun Microsystems | Portable OOP for networks |
| 1995 | Delphi | Hejlsberg | Borland | Object Pascal for Windows |
| 1995 | Ada 95 | ISO WG9 | ISO | OOP added to Ada |
| 2000 | C# | Hejlsberg | Microsoft | Delphi sensibilities + Java syntax |
| 2003 | Scala | Odersky | EPFL | JVM + functional |
| 2007 | C# 3.0 / LINQ | Hejlsberg | Microsoft | Functional features |
| 2009 | Go | Griesemer, Pike, Thompson | Google | Wirth + Plan 9 |
| 2010 | Rust (announced) | Hoare, Mozilla | Mozilla | Safe systems language |
| 2011 | Kotlin | Breslav, JetBrains | JetBrains | Better Java |
| 2014 | Swift | Lattner | Apple | Objective-C replacement |
| 2015 | Rust 1.0 | Mozilla Rust team | Mozilla | First stable Rust |
| 2022 | Go 1.18 | Go team | Google | Generics added |
| 2024 | Wirth dies | — | — | End of an era |

---

## Appendix B: Who trained whom — the Algol teacher-student network

- **Backus** (FORTRAN, ALGOL 58, BNF) taught generations at IBM and in the ACM committees
- **Perlis** (ALGOL 58/60 committee, first Turing Award winner) trained many at Carnegie Tech and Yale
- **Naur** (ALGOL 60 report editor) at Copenhagen
- **Dijkstra** (ALGOL 60 implementor, structured programming) at Eindhoven and Austin — trained Apt, Chandy, and others
- **Hoare** (Quicksort, CSP, ALGOL W co-designer, Turing Award 1980) at Oxford, Queen's Belfast, Microsoft Research
- **Wirth** at ETH Zürich — trained **Griesemer** (Go), **Mössenböck** (Oberon-2, C# early), **Gutknecht** (Oberon co-designer), and many others
- **Dahl and Nygaard** at Oslo — trained the Norwegian OOP community and influenced **Kay** at Xerox PARC
- **Ichbiah** (Ada lead designer) at CII Honeywell Bull — bridged Simula and Pascal traditions into Ada
- **Strachey** (CPL, denotational semantics) at Oxford — trained **Milner** (ML), **Scott** (domain theory)
- **Ritchie and Thompson** at Bell Labs — trained the entire Unix generation; Thompson later worked on **Go**
- **Stroustrup** (Cambridge, Bell Labs, Texas A&M) — influenced directly by **Dahl** through his Simula PhD work
- **Hejlsberg** (Borland, Microsoft) — trained generations of Delphi and C# developers; was himself largely self-taught from Apple Pascal

The Algol family is not just a genealogy of languages but a genealogy of people. Wirth taught Griesemer, who built Go. Dahl taught Stroustrup (indirectly, through his thesis), who built C++. Hoare and Wirth wrote ALGOL W together; both went on to shape the next two decades of language design. Strachey taught Milner; Milner built ML, which influenced Rust and Swift. The lineage is human as much as technical.

---

## Appendix C: What would Wirth say about 2026?

Based on his published views and his trajectory from ALGOL W through Oberon, we can guess. He would praise Go's small language specification and fast compiler. He would be skeptical of Rust's complexity but approve of its safety goals. He would be critical of C++'s continued feature accumulation. He would probably view TypeScript as a pragmatic but inelegant patch on a broken foundation. He would approve of the new interest in formal verification via SPARK, Dafny, F*, and similar tools. He would be saddened by the bloat of modern IDEs, operating systems, and web applications. He would remind us, quietly, that the Oberon System fit in 200 kilobytes and that there was a reason for that.

Wirth would probably point to the same paragraph from his 1995 essay:

> "Reducing complexity and size must be the goal in every step."

And he would point out, again, that software is still getting slower more rapidly than hardware is becoming faster.

The Algol tradition is not a historical artifact. It is a living argument about what programming should be. Every time a programmer chooses a language, writes a module, refactors a function, reviews a pull request, or decides to delete rather than add, they are participating in that argument. Wirth made the case for clarity. Ritchie made the case for pragmatism. Dahl and Nygaard made the case for abstraction. The argument is not over, and it is not going to be over, because the underlying tension — between expressive power and safe readability, between machine proximity and human comprehension, between feature richness and conceptual economy — is permanent.

ALGOL 60 started the conversation. The conversation is still going on.

---

## Study Guide — ALGOL's Influence

### Why read this

This file traces ALGOL's design decisions into every language that
came after. If you want to understand why Pascal has declarations
before statements, why C uses curly braces instead of `begin/end`,
why Ada has named parameter modes, or why Rust has scoped lifetimes,
the answers all start in the ALGOL committee meetings of 1958-1960.

### Recommended reading order

Read it as a family tree. The file is organized by descendant
language (Simula, Pascal, C, Ada, Modula-2, Oberon, Python, Rust,
and so on). Read each subsection twice: once for the features, once
for the reasoning behind them.

### Key questions

- Which ALGOL features survived into C, and which were rejected?
- What did Simula 67 add that made class-based OO possible, and why
  was that *not* in ALGOL 60?
- Why did Pascal fork from ALGOL — what did Wirth disagree with?
- What did Ada preserve from ALGOL that C discarded?
- Why is Rust's ownership model compatible with ALGOL's block
  structure?

### 1-week plan

- Days 1-2: Read the file in two sittings.
- Day 3: Build a feature-comparison spreadsheet. Rows: ALGOL 60,
  Simula, Pascal, C, Ada, Modula-2, Oberon. Columns: block
  structure, call-by-name, nested procedures, records, pointers,
  tasking, generics, OO, type inference, garbage collection.
- Day 4: Pick three cells from your spreadsheet where the answer
  surprised you. Research why.
- Day 5: Write a 1-page essay titled "The three things C inherited
  from ALGOL and the two things it deliberately broke."
- Day 6: Do the same for Rust and ALGOL.
- Day 7: Share one of those essays somewhere.

---

## Worked Examples

### Example 1 — ALGOL block structure in five languages

The same snippet (a block with nested declarations and a local loop)
in five languages:

```algol
begin
  integer i;
  i := 0;
  for i := 1 step 1 until 10 do
    outinteger(1, i)
end
```

```pascal
begin
  var i: integer := 0;
  for i := 1 to 10 do
    writeln(i);
end.
```

```c
{
  int i = 0;
  for (i = 1; i <= 10; i++) printf("%d\n", i);
}
```

```ada
declare
   I : Integer := 0;
begin
   for I in 1 .. 10 loop
      Ada.Text_IO.Put_Line (Integer'Image (I));
   end loop;
end;
```

```rust
{
  let mut i = 0;
  for i in 1..=10 { println!("{}", i); }
}
```

The block structure, scope rules, and local declarations all trace
back to ALGOL. The brace syntax in C and Rust is a cosmetic change;
the semantics are the same ALGOL 60 block.

### Example 2 — Trace one feature

Call-by-name, the infamous "Jensen's device" of ALGOL, was
simplified to call-by-reference in C (via `&`), call-by-value in
Java, and call-by-move-semantics in Rust. Write the same small
function (compute the sum of `a[i]` for `i` from `l` to `h` where
`i` is passed as a parameter) in three languages and observe how
each handles the aliasing question differently.

---

## DIY & TRY

### DIY 1 — Feature archaeology

Pick a modern language feature you use every day (lambdas, closures,
generics, iterators, exceptions, pattern matching). Trace it back
as far as you can. If the trail ends in ALGOL, note which dialect.
If it ends earlier, you will have learned something new.

### DIY 2 — Wirth's weight diet

Re-read Wirth's 1995 essay *A Plea for Lean Software*. Then run
`wc -l` on a codebase you work on. Compute lines per feature. Then
pick three files and try to cut each by 20% without removing any
behavior. This is the Wirthian exercise that separates lean software
from accumulated accretions.

### DIY 3 — Simula revisited

Install the `cim` Simula 67 compiler (it still runs on Linux). Write
a 100-line Simula program using the `CLASS` construct. Observe that
you have just used the same mechanism Bjarne Stroustrup took into
C++ and Alan Kay was independently inspired by for Smalltalk.

### TRY — Rewrite an ALGOL descendant in a different descendant

Take a 200-line Pascal program and rewrite it in Ada, then in
Modula-2, then in Oberon. Count the lines each time. Which version
is shortest, which is clearest, and which would you maintain in
2026?

---

## Related College Departments (ALGOL influence)

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  programming-language lineage is core to Programming Fundamentals.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) —
  tracing features through time is a historical discipline.
- [**philosophy**](../../../.college/departments/philosophy/DEPARTMENT.md)
  — Wirth's "simplicity as a design principle" is a philosophical
  claim, not a technical one.
