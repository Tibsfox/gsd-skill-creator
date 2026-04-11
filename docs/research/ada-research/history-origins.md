# Ada: A History of the Programming Language

## The Procurement That Became a Language

*Part of the PNW Research Series on tibsfox.com — Ada research thread: History & Origins*

---

## Preface: Why Ada's History Is Different

Most programming languages emerge from a single person, a small team, or an academic environment. C was Dennis Ritchie at Bell Labs. Pascal was Niklaus Wirth at ETH Zürich. Smalltalk was Alan Kay's team at Xerox PARC. Perl was Larry Wall in his garage, more or less. Python was Guido van Rossum over Christmas break. These languages evolved organically, often without formal requirements documents, open competitions, or international standardization processes at their inception.

Ada is different. Ada was procured.

Every serious design decision about Ada exists in the public record because the United States Department of Defense, which paid for the language's creation, insisted on transparency and competition. The requirements were published. The competitive submissions were evaluated publicly. The design rationale was written down and printed in book form. The standardization process was run through ANSI and ISO. The reference manual went through multiple formal editions. Even the losing design teams wrote up their experiences.

As a consequence, Ada is perhaps the best-documented language in the history of computing. We know who proposed every major feature. We know which requirements forced which design choices. We know which compromises were made and why. We know the names of the people in the room when decisions were finalized, what languages they were thinking about as prior art, and which European café in Louveciennes they worked out of.

This document traces the history of Ada from the "software crisis" of the 1960s through the publication of Ada 2022 (ISO/IEC 8652:2023) in May 2023 — fifty-five years of deliberate, documented language evolution. It is the story of a language that was commissioned, not invented; standardized before it was widely used; mandated and then unmandated; declared dead repeatedly but still flying airplanes, running trains, and controlling rockets in the year 2026.

---

## Part I: Prehistory (1965-1974)

### Setting the Stage: Computing Before the Crisis

To understand why Ada was built, one has to understand what computing looked like in the mid-1960s. It is easy, fifty years later, to forget how primitive the tools were and how unstructured the practice of programming had been.

In 1965, most "programmers" were mathematicians, physicists, or engineers who had picked up programming as an auxiliary skill. Formal computer science departments existed at a handful of universities — Purdue had established the first Department of Computer Science in 1962; Stanford followed in 1965; Carnegie Tech (later Carnegie Mellon) in 1965; MIT's Project MAC was producing the first generation of systems researchers. But most programming, and nearly all programming done for money, happened outside academic computer science departments entirely.

The languages of the mid-1960s reflected this. **FORTRAN** (1957) was dominant in science and engineering; a FORTRAN programmer in 1965 was writing code that looked much like arithmetic formulas, without block structure, without real procedures, with implicit typing by variable name. **COBOL** (1959) was dominant in business data processing; a COBOL programmer was writing English-like sentences describing record operations. **LISP** (1958) was used in AI research. **ALGOL 60** was important in Europe and in academic publishing (its block structure and lexical scoping were influential), but it was rarely used in production outside Europe. **Assembly language** was ubiquitous for anything that had to run fast or interact with hardware.

What did not exist, or existed only in primitive form:

- Operating systems that were written in high-level languages. (Multics was experimenting with PL/I starting in the mid-1960s; Unix would later use C starting in 1973.)
- Source code control. (SCCS did not arrive until 1972.)
- Structured programming. (Dijkstra's famous "Go To Statement Considered Harmful" would appear in *Communications of the ACM* in March 1968.)
- Debuggers worth the name. (Most debugging was done by inserting print statements and rerunning.)
- Modular compilation with cross-module type checking. (Each file was its own world.)
- Type systems stronger than FORTRAN's implicit type-by-name.
- Standard libraries that could be shared across projects.
- Packages or modules as a concept.
- Exception handling.
- Threads, or any language-level concurrency.

In this environment, every substantial software project was a custom construction job. There were no reusable components. Every team built its own I/O library, its own data structures, its own utilities, from scratch. Bugs accumulated because there were no tools to catch them. Projects slipped because nobody had been through anything comparable before. A successful software project of 1965 was one that got delivered at all, even over budget, even late, even with known bugs.

### The Software Crisis

By the mid-1960s, computing had a problem that nobody knew how to talk about. Hardware was scaling according to something approaching Moore's Law, which Gordon Moore had only just named in 1965. IBM had shipped the System/360. DEC had introduced the PDP-8. The Apollo Guidance Computer was flying. Mainframes were moving out of government labs and into corporate data centers. Time-sharing was making computing accessible to people who had never punched a card.

But software was falling apart.

Projects were routinely over budget by factors of two, three, sometimes ten. The IBM System/360 operating system — OS/360 — became the legendary cautionary tale. Fred Brooks, who had managed it, would later write *The Mythical Man-Month* (1975), cataloging the ways that throwing programmers at a late project makes it later. The Multics project at MIT, Bell Labs, and General Electric was soaking up resources with little to show. Programs had bugs that seemed impossible to find. Programs shipped with known bugs that the vendors could not afford to fix. Programs that ran on one machine could not be moved to another. And, perhaps most alarmingly, programs that *worked* could not reliably be modified to do something new without breaking.

The word "crisis" was not hyperbolic. It was being used in technical papers. It was being used at conferences. It was being used in defense budget hearings.

### The Cost Dimension

Put some rough numbers on the problem. By 1968, U.S. government data showed that:

- The Apollo program's onboard flight software consumed roughly 1,400 staff-years of effort by Draper Lab and MIT Instrumentation Laboratory alone — far more than originally budgeted.
- OS/360 at IBM had consumed something like 5,000 staff-years, at a cost over $500 million in 1960s dollars, with the project slipping repeatedly and the final product shipping with a long tail of known defects.
- A U.S. Air Force survey found that the cost of software in major weapons systems had gone from about 10% of total system cost in 1955 to roughly 50% by 1970, and was projected to climb higher.
- The cost of maintenance — fixing bugs after delivery, adapting to changes in requirements, porting to new hardware — was running between 60% and 80% of the total lifecycle cost of a piece of software. In other words, for every dollar spent writing code, two to four dollars would be spent maintaining it over its useful life.

Those numbers had an alarming property: they were climbing. Hardware was getting cheaper every year (Moore's Law was starting to work), but software was getting more expensive. Each new generation of hardware created demand for more sophisticated software, and each new sophisticated software project cost more to build and more to maintain than the previous one. Extrapolation showed that by the mid-1980s, software costs might dominate DoD budgets entirely if nothing changed.

This was the context in which "software crisis" became a serious phrase. It was not hand-wringing; it was a projection of an unsustainable trajectory.

### The Cost Dimension

Put some rough numbers on the problem. By 1968, U.S. government data showed that:

- The Apollo program's onboard flight software consumed roughly 1,400 staff-years of effort by Draper Lab and MIT Instrumentation Laboratory alone — far more than originally budgeted.
- OS/360 at IBM had consumed something like 5,000 staff-years, at a cost over $500 million in 1960s dollars, with the project slipping repeatedly and the final product shipping with a long tail of known defects.
- A U.S. Air Force survey found that the cost of software in major weapons systems had gone from about 10% of total system cost in 1955 to roughly 50% by 1970, and was projected to climb higher.
- The cost of maintenance — fixing bugs after delivery, adapting to changes in requirements, porting to new hardware — was running between 60% and 80% of the total lifecycle cost of a piece of software. In other words, for every dollar spent writing code, two to four dollars would be spent maintaining it over its useful life.

Those numbers had an alarming property: they were climbing. Hardware was getting cheaper every year (Moore's Law was starting to work), but software was getting more expensive. Each new generation of hardware created demand for more sophisticated software, and each new sophisticated software project cost more to build and more to maintain than the previous one. Extrapolation showed that by the mid-1980s, software costs might dominate DoD budgets entirely if nothing changed.

This was the context in which "software crisis" became a serious phrase. It was not hand-wringing; it was a projection of an unsustainable trajectory.

### The NATO Software Engineering Conference, Garmisch 1968

In October 1968, NATO's Science Committee convened a conference in Garmisch-Partenkirchen, a Bavarian Alpine resort town in West Germany. The conference was organized by Friedrich L. Bauer of the Technical University of Munich and brought together about fifty of the world's leading computing researchers and practitioners. The attendee list read like a who's who of 1960s computing: Edsger Dijkstra, Peter Naur, Alan Perlis, Christopher Strachey, Douglas McIlroy, Brian Randell, Fritz Bauer, Tony Hoare, Ole-Johan Dahl, Kristen Nygaard, Andrei Ershov, and many others.

The conference had been called to address "the problems of software." It was at this conference that the phrase "software engineering" was deliberately adopted — Bauer chose it to be provocative, to signal that software development needed to become a disciplined practice comparable to civil or mechanical engineering rather than remaining a form of craft or art.

The proceedings of the Garmisch conference, edited by Peter Naur and Brian Randell and published in January 1969, became one of the most important documents in computing history. They are still in print. They document, in remarkably candid form, participants admitting that software was out of control and that nobody knew what to do about it. Doug McIlroy, in his famous "Mass Produced Software Components" talk, proposed that software should be assembled from reusable parts the way hardware was assembled from standard components. Dijkstra introduced what would become his famous concerns about structure and correctness. Alan Perlis, then at Carnegie Mellon, spoke about complexity.

A follow-up conference was held in Rome in October 1969, with a somewhat different tone. Whereas Garmisch had been optimistic — "we have identified the problem and now we can solve it" — Rome was darker. Randell later recalled that the Rome conference was dominated by a sense that the problems identified at Garmisch had grown worse, not better. The term "software crisis" entered wider usage from the Rome proceedings.

These two conferences established the intellectual framework that would eventually produce Ada. The framework had several pieces:

1. Software is distinct from hardware and requires its own engineering discipline.
2. Programming languages shape the programs that can be written in them.
3. Reliability, maintainability, and portability are first-class concerns.
4. Large-scale software construction requires modularity and abstraction.
5. The cost of software over its lifecycle exceeds the cost of development alone, and often by large margins.

All of these ideas would be explicit requirements for Ada a decade later.

### The Department of Defense Language Zoo

While academics were talking about the software crisis, the U.S. Department of Defense was living it. The DoD was, by a wide margin, the world's largest single buyer of custom software. Every weapon system, every command and control network, every logistics database, every radar, every aircraft avionics suite, every torpedo guidance computer, every missile autopilot had software. And every program office, contractor, and service branch had picked its own programming languages.

A partial list of the languages in widespread military use in the early 1970s would include:

- **JOVIAL** (Jules' Own Version of the International Algorithmic Language) — designed by Jules Schwartz at System Development Corporation starting in 1959, based on ALGOL 58. Used by the U.S. Air Force for command and control and avionics. Multiple incompatible dialects: JOVIAL J3, JOVIAL J3B, JOVIAL J73.
- **CMS-2** — U.S. Navy's language for shipboard tactical computer systems, developed starting around 1968. Multiple variants (CMS-2Y, CMS-2M).
- **TACPOL** — U.S. Army tactical command and control language.
- **SPL/1** (Space Programming Language) — Air Force, used for early Space Shuttle and satellite work.
- **HAL/S** — IBM's language for the Space Shuttle flight software, an interesting hybrid that included features specifically for aerospace math (vectors, matrices as primitive types).
- **ATLAS** (Abbreviated Test Language for All Systems) — IEEE Std 416, used for automatic test equipment.
- **FORTRAN** — used everywhere for numerical work, in multiple dialects.
- **COBOL** — used for logistics, payroll, and administrative data processing.
- **Assembly language** — specific to every target machine. There were dozens of military computer architectures.
- **PL/I** — IBM's universal language, used heavily in some services.
- **ALGOL 60 / ALGOL 68** — used in research and in some allied systems.
- **CORAL 66** — the British military's preferred language, a subset-plus-extension of ALGOL 60.
- **LTR** — the French military's language.
- **Pascal** — starting to appear by the early 1970s.

In 1974, the U.S. Army's Computer Systems Command performed an inventory. A study commonly attributed to the HOLWG and David Fisher's later work revealed that DoD embedded systems were using more than **450 distinct programming languages and incompatible dialects**. Maintenance costs were spiraling. Contractors could bid high because only they knew their proprietary dialect. Training was a nightmare. Program managers found themselves paying to recompile, revalidate, and re-certify the same functional code multiple times because it could not be shared between services or even between projects in the same service.

The total DoD software budget, in 1973 dollars, was estimated at about $3 billion annually, and roughly half of that was spent on embedded software for weapon systems. Extrapolations suggested it would rise to $32 billion by the early 1980s. The fraction spent on maintenance — rather than new development — was climbing steadily. This was not a sustainable trajectory.

### The Malcolm Currie Memo

In January 1975, Malcolm R. Currie, the Director of Defense Research and Engineering, issued a formal directive that initiated what would become the Ada program. The directive established a working group within the DoD to address the proliferation of programming languages in embedded systems. This working group was the HOLWG — the **High Order Language Working Group** — and it would operate for the next decade.

The Currie memo is worth noting because it made a specific commitment: the DoD would not accept the status quo. One of the following would happen:

1. A single existing language would be selected and mandated across DoD embedded systems.
2. An existing language would be substantially modified and then mandated.
3. A new language would be designed from scratch and then mandated.

Notice what is not on the list: "continue with multiple languages." That option had been foreclosed.

---

## Part II: The Requirements Progression (1975-1978)

### The High Order Language Working Group

The HOLWG was chaired initially by Lieutenant Colonel William A. Whitaker of the U.S. Air Force, who had been the driving force behind the Currie memo. Whitaker, who died in 2015, is one of the unsung architects of Ada — he was not a language designer, but he was the bureaucrat-visionary who made the political space for the language to exist. Whitaker assembled a group that included technical representatives from each of the military services plus civilian computer scientists.

The HOLWG's technical lead was **David A. Fisher**, then at the Institute for Defense Analyses (IDA). Fisher was a PhD computer scientist who had done his dissertation work on language design. He would be the principal author of the successive requirements documents that defined what Ada had to be.

The HOLWG's approach was distinctive and, in retrospect, brilliant. Rather than convening a design committee and asking it to produce a language, they decided first to produce a requirements document — a specification of what the language had to do — and then to hold a competitive procurement to build it. This was the approach the DoD used for hardware: write requirements, hold a competition, pick the winner.

But nobody had ever tried to procure a programming language this way before.

### Strawman (April 1975)

The first attempt at a requirements document was called **Strawman**. It was circulated for comment in April 1975. Strawman was deliberately rough — the name signaled "this is a starting point to be attacked and torn apart." The whimsical naming convention that followed (Woodenman, Tinman, Ironman, Steelman) would become famous and would be copied by other requirements processes decades later.

Strawman identified several categories of requirement: general language design principles, program structure features, data types, control structures, input/output, exception handling, concurrency, and support for machine-dependent features. Even in this first draft, the emphasis was on reliability and maintainability rather than raw performance. The document was circulated to contractors, academics, and military program offices for feedback.

### Woodenman (August 1975)

**Woodenman** followed four months later. It incorporated feedback from the Strawman review and organized the requirements more systematically. The name continued the joke: a woodenman was slightly more substantive than a strawman but still a long way from what a real person (or real language) needed.

### Tinman (January 1976)

**Tinman** was a significant step. Released in January 1976, it was the first version that contained a coherent vision of what the language would look like. Tinman introduced and organized the concepts that would become central to Ada:

- Strong, static typing with user-defined types
- Explicit, readable syntax (no clever tricks, no abbreviations unless unavoidable)
- Separation of specification from implementation (what would become package specs vs. package bodies)
- Explicit exception handling
- Support for concurrent processes
- Generics for type-parameterized reusable code
- Machine-dependent features as a bounded, clearly identified subset
- Real-time support including scheduling and priorities

Tinman was the document that convinced people the DoD was serious. Published technical reviews in ACM SIGPLAN Notices praised it. European computing organizations began to engage. The HOLWG had enough confidence in Tinman to use it as the basis for the first round of language submissions.

### Ironman (January 1977)

**Ironman**, released in January 1977, refined and strengthened Tinman's requirements. It added more specificity and closed some of the loopholes that the first-round competitive submissions had exposed. Ironman included detailed requirements on:

- Named and positional parameter passing
- Default parameter values
- Overloading of operators and subprograms
- Separate compilation with cross-unit type checking
- Representation specifications for memory layout
- Compile-time expression evaluation for constants
- Mixed-precision arithmetic
- Access types (pointers) with controlled scope
- Tasking with rendezvous-based communication

Ironman was a document that could, in principle, be implemented. But it was still not the final word.

### Steelman (June 1978)

**Steelman**, released in June 1978 (with some sources giving July 1978), was the definitive requirements document. At the point Steelman was published, the field of competitors had been narrowed to two finalists (Green and Red — more on those in a moment), and Steelman was the target both teams had to meet in the final round.

Steelman is a remarkable document. It is publicly available — anyone can still read it — and it is probably the most detailed, considered specification of what a general-purpose systems programming language ought to provide that has ever been written. It is not a language. It is a description of a class of languages, any of which would satisfy the DoD's needs.

Steelman was organized into approximately 120 numbered requirements grouped under headings:

- **General design principles**: readability over writability, minimization of error-prone features, strong typing, verifiability, efficiency, simplicity.
- **Source program representation**: character set, identifiers, case sensitivity, comments, layout.
- **Data and types**: scalar types (integer, enumeration, real), composite types (arrays, records), access types, derived types, subtypes and constraints.
- **Expressions and operators**: standard arithmetic, logical, relational, membership, short-circuit evaluation.
- **Control structures**: if-then-else, case, loops (for, while, general loop), exit statements, return.
- **Declarations and scopes**: constants, variables, types, subprograms, blocks.
- **Subprograms**: procedures and functions, parameter passing, overloading, recursion.
- **Program units**: separate compilation, library structure, specifications vs. bodies.
- **Input/output**: as library facilities, not language built-ins.
- **Parallel processing**: processes, synchronization, communication, scheduling.
- **Exception handling**: raising and handling, propagation, predefined exceptions.
- **Generic definitions**: type parameters, value parameters, subprogram parameters.
- **Low-level facilities**: address clauses, representation clauses, interrupts, machine code insertions (optional).

Steelman also made explicit what the language would NOT have:
- No default initialization of variables to "safe" values that would hide bugs.
- No implicit type conversion (except in very narrow, well-defined cases).
- No goto statements... actually, Ada has goto, because Steelman couldn't bring itself to exclude it entirely for low-level code. But it's heavily discouraged.
- No aliasing that the compiler cannot detect.
- No features that have been shown to cause bugs in widespread use.

Steelman was reviewed by essentially every major computing researcher of the era. Tony Hoare wrote a (somewhat skeptical) review. Niklaus Wirth was asked for comment. Dijkstra weighed in. The document went through final revisions based on this feedback and was frozen for the 1978-1979 competition phase.

### Evaluation of Existing Languages

Before holding the competition to design a new language, the HOLWG had to answer the obvious question: is one of the existing languages already good enough? If so, the DoD could save money by adopting it rather than commissioning a new one.

A formal evaluation was conducted in 1976-1977. The candidates included:

- **ALGOL 68** — technically impressive, but criticized for complexity, obscure syntax, difficulty of implementation, and (crucially) the lack of a strong industrial community behind it. Rejected.
- **PL/I** — IBM's universal language. Evaluated seriously. Rejected for being too large, too undefined at the edges, and too strongly tied to IBM architecture conventions.
- **Pascal** — Niklaus Wirth's language. Highly regarded. Evaluated seriously. Rejected because of its limitations on separate compilation, lack of concurrency support, weak input/output facilities, and insufficient support for systems programming (it was designed as a teaching language and did not have the low-level features needed for embedded work).
- **FORTRAN 77** — the just-released new FORTRAN standard. Rejected for lacking modern features: no structured data types worth mentioning, no proper procedures with local data, no real modularity, no concurrency.
- **Simula** — Ole-Johan Dahl and Kristen Nygaard's language, which had pioneered object-orientation, coroutines, and classes. Respected but rejected because it was not widely supported and its run-time requirements were considered too heavy for embedded systems.
- **CORAL 66** — the British military language. Rejected for being too tied to ALGOL 60's limitations.
- **JOVIAL** (J3 and J73) — the existing Air Force language. Rejected because adopting it would mean forcing the Navy and Army onto an Air Force language, which was politically unacceptable, and because it had accumulated enough legacy baggage to make modernization difficult.
- **LIS** — Jean Ichbiah's earlier language, Language d'Implementation de Systèmes, developed at CII Honeywell Bull. Rejected, but Ichbiah would use much of what he had learned from LIS in his Ada design.
- **LTR** — the French military language. Too nationally specific.
- **RTL/2** — the British Imperial Chemical Industries real-time language. Considered but found insufficient.

The formal conclusion, published in 1976, was that no existing language met the Ironman requirements. A new language was therefore justified. This conclusion was controversial — some computer scientists argued that it was premature, that Pascal with extensions could have been adapted, that Ada would consume enormous effort for marginal gains over existing languages. But the HOLWG pressed forward, the Currie memo's logic holding that the status quo was worse than any alternative.

---

## Part III: The Competition (1977-1979)

### Phase I: Fifteen Proposals, Four Selections (1977)

In April 1977, the DoD issued a formal request for proposals to design the new language. The RFP specified that submissions had to be targeted at the Tinman requirements (Ironman was still being finalized). Contractors were invited to propose language designs and to demonstrate the technical approach they would take.

Seventeen proposals were received from industry, academia, and research institutions in the United States and Europe. The HOLWG evaluated these proposals during the summer of 1977 and, in July 1977, announced four finalists who would receive contracts to actually design their proposed languages.

The four finalists were identified by color codes to prevent any appearance of bias during evaluation. The color assignments were:

- **Green** — **CII Honeywell Bull**, a French company, with the design led by **Jean Ichbiah** at their facility in Louveciennes, west of Paris. Ichbiah had previously led the design of LIS.
- **Red** — **Intermetrics**, a Cambridge, Massachusetts company. The design was led by **Benjamin Brosgol** with significant contributions from **John Goodenough**, who had previously written important papers on exception handling. Intermetrics was founded by ex-MIT Draper Lab people and had deep aerospace credentials.
- **Blue** — **SofTech** of Waltham, Massachusetts. The design was led by **John Nestor**. SofTech was a serious contender and had significant expertise in compilers and language design.
- **Yellow** — **SRI International** (Stanford Research Institute) of Menlo Park, California. The design was led by **Jay Spitzen**.

Each team received approximately $500,000 (in 1977 dollars) to produce a language design by February 1978. The color names became a minor cultural phenomenon within the HOLWG: memos referred to "the Green team" and "the Red design," and the color names survived in published literature and in later retrospectives.

Phase I was a pure design exercise. No implementation was required. Each team produced a language reference manual describing their proposed solution.

### The Evaluation and Down-Selection (February-April 1978)

The four Phase I designs were evaluated in February-April 1978 by a panel of 83 reviewers drawn from government, industry, and academia. The reviewers were organized into review teams, each of which evaluated all four designs against the Ironman requirements. Significantly, the evaluators did not know which design came from which company — the color codes were used throughout, and the evaluators received only the technical documents.

The outcome was that **Green and Red** were selected to advance to Phase II. Blue (SofTech) and Yellow (SRI) were eliminated.

The published evaluation rationale noted that Green and Red were the two designs that most fully addressed the Ironman requirements. Blue had strengths in some areas but weaknesses in others that the evaluators considered fatal. Yellow was judged to be the least mature of the four designs, though the evaluators noted it had interesting ideas that deserved further exploration in other contexts.

The losing designers continued to have significant careers. **John Nestor** (Blue) went on to important work in Ada tooling. **Jay Spitzen** (Yellow) continued in verification and formal methods at SRI. **John Goodenough** (Red), who had authored the landmark 1975 paper "Exception Handling: Issues and a Proposed Notation" in *Communications of the ACM*, stayed on the Red team through Phase II and later became one of the founders of the Software Engineering Institute at Carnegie Mellon. **Benjamin Brosgol** (Red) would remain a key figure in the Ada community for the next four decades.

### Phase II: Green vs. Red (1978-1979)

Phase II ran from April 1978 through early 1979. During this phase, the Green and Red teams had to refine their designs to meet the newly-frozen **Steelman** requirements (issued in June 1978). Each team received approximately $1 million to produce a full language reference manual and to begin work on a prototype compiler.

Phase II was intense. Both teams were under pressure, both had something to prove, and the technical design space was still being explored. This was the period when many of Ada's distinctive features took their final form.

Jean Ichbiah's Green team at Louveciennes settled on a design philosophy that would define the language:

1. **Readability over writability.** A programmer writes a line of code once but reads it many times during maintenance. The language should be optimized for the reader, not the writer. This meant verbose keywords, explicit rather than abbreviated syntax, and redundant-seeming declarations that the compiler could use for error checking.

2. **Explicit over implicit.** Nothing should happen behind the programmer's back. If a type conversion is occurring, it should be written in the source. If a variable is being declared, its type should be named. If an exception is being handled, the handler should be visible at the point of the block.

3. **Compile-time checking.** The compiler should catch as many errors as possible before the program ever runs. This favored strong typing, subtype constraints, overload resolution based on types rather than values, and elaboration rules that prevented use-before-initialization.

4. **Concurrency as a first-class feature.** Tasks — concurrent threads of execution — would be a built-in language feature, not a library. They would communicate through a synchronous rendezvous mechanism inspired by Hoare's Communicating Sequential Processes (CSP) paper, which had been published in *Communications of the ACM* in 1978 and was fresh in the design community's thinking.

5. **Packages as the unit of modularity.** A package specification declared the interface (types, constants, subprogram signatures); a package body contained the implementation. Client code depended only on specifications. This was the cleanest separation of interface from implementation of any mainstream language at the time.

The Green team membership at its peak included:

- **Jean Ichbiah** (France) — team leader and principal designer.
- **Jean-Claude Heliard** (France) — CII Honeywell Bull, deep involvement in the type system design.
- **Olivier Roubine** (France) — tasking model, real-time features.
- **Bernd Krieg-Brueckner** (Germany) — type system, visibility rules. Later professor at Universität Bremen.
- **Brian Wichmann** (United Kingdom) — National Physical Laboratory. Numerical model, floating-point semantics, benchmark methodology. Wichmann had been a key figure in the ALGOL community.
- **John Barnes** (United Kingdom) — documentation, readability, pedagogical concerns. Would later author the canonical Ada textbook that stayed in print for decades.
- **Henry Ledgard** (United States) — software engineering concerns, readability, style.
- **Paul N. Hilfinger** (United States) — representation clauses, low-level features.

The Red team at Intermetrics had its own talented group, including John Goodenough and Benjamin Brosgol, but the Red design took different stylistic choices — slightly less verbose, somewhat different tasking model, different generics approach. The two designs were philosophically aligned on Steelman compliance but differed in detail.

### The Final Evaluation (Spring 1979)

In the spring of 1979, the final evaluation panels convened. The two Phase II designs were once again evaluated blind against the Steelman requirements. The evaluators included people from the military services, academic reviewers (including Tony Hoare, who famously had mixed feelings about the whole exercise), industrial users, and international participants.

In May 1979, the HOLWG announced the decision: **Green had won.**

Jean Ichbiah's team at CII Honeywell Bull in Louveciennes had designed the winning language. The DoD had its new programming language. It did not yet have a name.

### Reaction: Hoare's Turing Award Speech

One of the most famous — and most misunderstood — reactions to Ada's selection came from **C. A. R. (Tony) Hoare**, who in October 1980 delivered his Turing Award lecture at the ACM Annual Conference in Nashville. The lecture, titled "The Emperor's Old Clothes," was later published in *Communications of the ACM* (February 1981).

Hoare used the lecture to issue a warning about Ada. He did not name it directly for much of the talk, but the reference was unmistakable:

> "I was eventually persuaded of the need to design programming notations so that errors can be clearly written, and then perhaps by clever rules avoided or detected at compile time. But I hope I live to see the day when programmers realize that it is essential for a language to be *simple*, and that *simplicity* is achievable only through *restraint*..."

> "And so, the best programming language in the world may just possibly have been designed twenty years ago, and its name is Pascal."

> "Do not allow this language, in its present state, to be used in applications where reliability is critical... The next rocket to go astray as a result of a programming language error may not be an exploratory space rocket on a harmless trip to Venus: It may be a nuclear warhead exploding over one of our own cities."

Hoare's concern was that Ada was too large, too complex, and too ambitious to be implementable without introducing bugs of its own — that the very complexity intended to prevent errors would itself become a source of errors. He was not wrong that Ada was large and complex. What he did not fully anticipate was that the formal standardization, validation, and compiler-checking infrastructure around Ada would mitigate most of those concerns over time.

Hoare later qualified his remarks. He acknowledged that Ada had features he respected, including the tasking model (which was based on his own CSP work). He was less alarmist about Ada by the 1990s. But the "Emperor's Old Clothes" speech became part of Ada's cultural context — the warning shot from a respected elder that the language had to prove itself worthy of its ambitions.

---

## Part IV: Naming the Language (1979)

The winning design, in the spring of 1979, was still called "Green." The DoD needed a real name, and the naming process became, in its own quiet way, a significant cultural moment.

Several names were considered. The DoD wanted a name that was:

- Short (one or two syllables).
- Pronounceable in all the major languages of NATO member states.
- Not already a trademark.
- Meaningful or at least not embarrassing.
- Not obviously identifying the language as a U.S. government product (to encourage international adoption).

**Jack Cooper**, one of the HOLWG members and an advisor to the DoD, proposed naming the language **Ada** after Augusta Ada King, Countess of Lovelace (1815-1852). The proposal was forwarded to the HOLWG leadership. William Whitaker approved it. The decision was finalized in mid-1979, and the name "Ada" was formally announced.

### Who Was Ada Lovelace?

Augusta Ada Byron, Countess of Lovelace, was born on 10 December 1815 in London. She was the only legitimate child of George Gordon, Lord Byron — the famous Romantic poet — and Anne Isabella Milbanke, whom Byron married and then separated from within a year. Ada never met her father; Byron left England shortly after her birth and died in Greece in 1824 when she was eight years old. Ada was raised by her mother, who insisted on an unusually rigorous mathematical and scientific education, partly in the hope of countering what she feared were Byron's "dangerous" poetic tendencies in her daughter's inheritance.

Ada proved to be a gifted mathematician. In her teens, she was introduced to **Mary Somerville**, a leading Scottish mathematician and science writer, who tutored her and introduced her to the broader scientific community in London. Through Somerville, Ada met **Charles Babbage** in June 1833, when she was seventeen. Babbage was then the Lucasian Professor of Mathematics at Cambridge (the chair Isaac Newton had held) and was working on his Difference Engine, a mechanical calculator.

Ada was fascinated by Babbage's work. When Babbage moved on from the Difference Engine to design the more ambitious **Analytical Engine** — a mechanical general-purpose computer with features we would now recognize as conditional branching, loops, and a memory store — Ada became one of his few close intellectual collaborators. The Analytical Engine was never fully built (some prototype sections were completed, but the full machine was beyond the engineering capacity of 1840s Britain), but its design was remarkably complete.

In 1842, the Italian military engineer Luigi Menabrea (later Prime Minister of Italy) published a paper in French describing the Analytical Engine, based on a presentation Babbage had given in Turin. Ada undertook to translate Menabrea's paper into English. Babbage suggested that she add her own notes, since she understood the Engine as well as anyone.

The result, published in 1843 in Richard Taylor's *Scientific Memoirs*, was a translation of Menabrea's paper followed by Ada's "Notes," lettered A through G, which were about three times the length of the original translation. These Notes contain several passages for which Ada is now remembered:

- **Note A** discussed the distinction between the Difference Engine (limited to specific calculations) and the Analytical Engine (programmable for arbitrary mathematical operations) — essentially articulating the difference between a special-purpose and a general-purpose computer, a century before the formal concept of universality.

- **Note G** contained a detailed worked example showing how the Analytical Engine could compute Bernoulli numbers. This is the example that is often called "the first computer program." It is a step-by-step sequence of operations the Engine would perform, including loops and conditional logic, to compute a mathematically significant sequence. Whether Babbage or Ada originated the specific algorithm has been debated by historians (some argue Babbage produced earlier drafts; others argue Ada's version was substantially her own work and included corrections), but the published, printed, permanent form of the algorithm is Ada's.

- **Note A** also contained what has become the most-quoted passage, Ada's speculation about the general capabilities of the Engine: "The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform." This has been read variously as a prescient statement about the limits of mechanical computation, a refutation of later AI hype, and (more recently) a challenge about what "knowing how to order" something to do actually means.

Ada died of uterine cancer on 27 November 1852, at the age of 36. Her Notes were largely forgotten for nearly a century until they were rediscovered in the 1950s and 1960s as computing developed and historians looked for precedents. By the 1970s, Ada Lovelace was being widely cited as the first computer programmer, and Babbage was being cited as the inventor of the general-purpose computer.

### Why the DoD Named a Language After Her

The choice to name the language "Ada" was symbolic and deliberate. In 1979, computing was overwhelmingly male, and the DoD was even more male. Naming a flagship programming language after a nineteenth-century woman was an unusual gesture of historical recognition. It honored a genuine pioneer. It also sent a signal that Ada-the-language was meant to be taken seriously as an intellectual and historical project, not just as a bureaucratic procurement outcome.

The name also had practical advantages: "Ada" is short, easy to pronounce in every European language, not previously a trademark, and already associated (among those who knew the history) with the first computer program. It would not be confused with a hardware product or an existing language.

There was one awkwardness. "Ada" without the surname could seem too casual or too common. The DoD's official style was to use "Ada" as a name, not an acronym — it does not stand for "Automatic Data Acquisition" or any such thing, and writing it as "ADA" in all caps is technically incorrect. The convention "Ada" (capitalized only on the A) has been stable since 1979.

A minor trademark fight would follow. The DoD registered "Ada" as a trademark and used it to enforce compliance with the language standard — a compiler could not call itself an "Ada compiler" without passing official validation. The trademark was eventually released to the public domain in 1987, after which anyone could use the name, but the validation requirement for officially sanctioned compilers persisted.

---

## Part V: MIL-STD-1815 and the First Standard (1979-1983)

### The Preliminary Reference Manual (June 1979)

In June 1979, almost immediately after the Green design was selected, a preliminary version of the Ada reference manual was published. This document described the language as it stood at the end of Phase II, incorporating the final refinements Ichbiah's team had made. It was published in *ACM SIGPLAN Notices* Volume 14, Number 6A, Part A, June 1979 — an entire special issue dedicated to the new language.

The Preliminary Ada Reference Manual was more than a language specification. It was accompanied by the **Rationale for the Design of the Ada Programming Language**, a separate document by Ichbiah and members of the Green team explaining *why* they had made the choices they made. The Rationale discussed alternatives considered and rejected, identified design principles, and connected the language to the Steelman requirements. It is still one of the best documents ever written about language design, and it served as a model for the design rationales that would later accompany languages like Scheme (R5RS), Ada 95, and Python.

The Preliminary Manual was immediately distributed for international review. Comments flooded in. The Green team and a new oversight group spent the next eighteen months revising the language based on the feedback.

### Revisions and the 1980 Manual

During 1979 and 1980, the language underwent substantial refinement. Some examples of changes between the Preliminary Manual and the final standard:

- The syntax of package specifications was tightened.
- The generics mechanism was clarified.
- The tasking model was refined, with particular attention to the semantics of the rendezvous and to the behavior of terminated tasks.
- Exception handling semantics were sharpened.
- The numerical model (how floating-point arithmetic should behave, what precision models must be supported) was reworked with heavy input from Brian Wichmann and others in the numerical analysis community.
- The separate compilation system (program library, units, subunits) was formalized.

In November 1980, a revised reference manual was published. It was adopted as a U.S. military standard in December 1980 as **MIL-STD-1815**. The number was chosen as a deliberate tribute: 1815 was the year of Ada Lovelace's birth. There was, and is, no other reason for the numbering. The DoD's standards numbering system normally assigns consecutive numbers without historical meaning; MIL-STD-1815 was an exception granted specifically to honor the namesake.

### The Ada Joint Program Office (1980)

In 1980, as MIL-STD-1815 was being finalized, the DoD established the **Ada Joint Program Office (AJPO)** under the Office of the Secretary of Defense. The AJPO's mission was to manage the Ada language and its associated infrastructure across all military services and to oversee transition of DoD projects to Ada.

The AJPO was small (a few dozen people at its peak) but institutionally powerful. It controlled the Ada trademark. It funded compiler development and validation tools. It administered the compiler validation process. It published guidance and style documents. It ran the Ada Information Clearinghouse (AdaIC), which became the primary point of contact for the Ada community through the 1980s and 1990s.

The AJPO would persist for approximately nineteen years, finally being disbanded in 1998 after the Ada mandate was rescinded. During its existence, it was the most institutionally supported programming language office the U.S. government has ever had, for any language.

### The Ada Compiler Validation Capability (ACVC)

One of the AJPO's most consequential decisions was to establish the **Ada Compiler Validation Capability (ACVC)** — a test suite that any compiler had to pass before it could be called an "Ada compiler." The ACVC was developed at SofTech (ironically, one of the losing Phase I teams) starting in 1980 and became operational in 1983.

The ACVC consisted of thousands of test cases, each exercising a specific feature of the language. A compiler was tested against the full suite; if it passed, it received a validation certificate that was valid for one year. If it failed any test, it could not legally call itself an Ada compiler, and contracts that required "Ada" automatically excluded it.

The consequences of this validation regime were profound:

1. **No fragmentation.** Unlike C, C++, or FORTRAN, Ada never had dialects. Every validated compiler behaved the same way on the same program, at least to the extent that the ACVC could test. This was the first time in programming language history that such uniformity had been achieved and enforced.

2. **Slow compiler startup.** Because validation was expensive and the bar was high, only well-funded vendors could bring Ada compilers to market. In the early 1980s, there were only a handful of validated compilers.

3. **Consistent semantics.** Programmers could (in principle) write portable Ada code that would run unchanged on any platform with a validated compiler. In practice, library availability and platform-specific code still caused portability issues, but the core language was genuinely portable.

The ACVC would evolve over the years, with newer versions (ACVC 1.0, 1.10, 1.11, 2.0) tracking the evolution of the language. It would be renamed the Ada Conformity Assessment Test Suite (ACATS) in the 1990s. It remains in use today under the AdaIC's successor organizations.

### First Validated Compilers (1983)

The first compiler to complete ACVC validation was **NYU Ada/Ed**, an interpreter-based reference implementation developed at New York University by Robert Dewar, Edmond Schonberg, and their students starting in 1980. NYU Ada/Ed was not a production compiler — it was slow, it generated no executable code (it interpreted a form of tree-walking execution), and it was designed to be a reference against which other implementations could be compared. But it was the first implementation that could claim conformance, and it was validated in April 1983.

Production compilers followed quickly. In 1983 and 1984, validated compilers were released by:

- **Verdix** — one of the first commercial Ada compiler vendors, later acquired by Rational.
- **TeleSoft** — based in San Diego, produced early native compilers for several architectures.
- **DEC (Digital Equipment Corporation)** — produced VAX Ada, one of the most influential early Ada compilers for VMS and later Ultrix.
- **Alsys** — a French company founded by Jean Ichbiah himself in 1980, after the Green team's work was done. Alsys produced Ada compilers for a variety of platforms and was a significant commercial player through the 1980s and early 1990s.
- **Intermetrics** — the Red team's company, which pivoted after losing the competition to become an Ada tool vendor.
- **Rational** — Rational Software Corporation, founded in 1981 by Paul Levy and Mike Devlin, built its early business around Ada and eventually the R1000 Ada development workstation.

By the mid-1980s, more than a dozen validated Ada compilers were available for platforms ranging from IBM mainframes to VAX minicomputers to early workstations to embedded targets like the MIL-STD-1750A and the Motorola 68000.

### ANSI/MIL-STD-1815A: Ada 83 (January 1983)

MIL-STD-1815 (the 1980 version) was considered provisional. Over 1981 and 1982, further refinements were made based on experience with the early compilers and feedback from early users. The revised standard was published as **ANSI/MIL-STD-1815A** in January 1983. This is the version now known as **Ada 83**, and it was the first truly stable standard for the language.

The language described in Ada 83 had the following core features:

- **Strong static typing** with derived types, subtypes, and type constraints. The type system was substantially stronger than anything in Pascal, C, PL/I, or FORTRAN.
- **Packages** as the unit of modularity, with specifications separated from bodies.
- **Generics** — parametric polymorphism for types, values, and subprograms.
- **Tasking** — concurrent tasks with rendezvous-based synchronization.
- **Exception handling** with named exceptions and handlers at block scope.
- **Separate compilation** with cross-unit type checking.
- **Representation clauses** for precise control over memory layout, useful for hardware interface programming.
- **Pragmas** for compiler directives, implementation-specific features, and pragma Inline / pragma Optimize style hints.
- **Attributes** (like `Integer'Last`, `T'First`, `A'Length`) for compile-time queries about types and objects.
- **Enumeration types** with user-defined representations.
- **Fixed-point and floating-point** with controlled precision and range.
- **Unconstrained and constrained arrays** with first-class slice operations.

Notably absent from Ada 83:

- **No object-oriented programming** in the modern sense. No inheritance. No virtual methods. No tagged types. Ada 83 had a form of polymorphism through generics and through variant records, but it was not OOP.
- **No hierarchical library units.** All library units were flat. This became one of the pain points that Ada 95 would address.
- **No protected objects.** The only synchronization mechanism was the rendezvous, which was elegant but heavy for low-level protected access to shared data.

Ada 83 was also published internationally. **ISO 8652:1987** was the ISO version of the standard, published in 1987 after working its way through the ISO process. ISO 8652:1987 was technically equivalent to ANSI/MIL-STD-1815A but was the version that European and other non-U.S. users typically referenced.

---

## Part VI: The Mandate Era (1987-1997)

### DoD Directive 3405.1 (1987)

On 2 April 1987, the DoD issued **Directive 3405.1**, titled "Computer Programming Language Policy." This was the formal Ada mandate. It required that all new DoD mission-critical software be written in Ada, unless a waiver was granted. The supporting directive **3405.2** addressed implementation details.

The exact language of the mandate had been anticipated for years but had not been formal until 1987. Many program offices had already begun transitioning to Ada before the mandate was signed, in anticipation of the requirement. Others had resisted as long as possible.

The mandate applied to:
- All new DoD weapon systems and mission-critical systems.
- Major modifications to existing systems, where modifications affected large fractions of the code base.
- Command, control, communications, and intelligence (C3I) systems.
- Automatic test equipment and support systems.

The mandate did not apply to:
- Information systems (payroll, accounting, administrative) — these could use COBOL or other languages.
- Scientific computing in research settings — these could use FORTRAN.
- One-off tools and utilities.
- Software where Ada compilers did not exist for the target hardware.

The waiver process was structured: a program office could apply for an exception, and the AJPO reviewed each application. Waivers were granted more freely than the mandate's drafters had intended — it became politically easier to grant waivers than to fight over each decision, and by the early 1990s a majority of large-dollar contracts had either been written in Ada or had received waivers.

### Who Resisted and Why

Ada mandate resistance came from several quarters, and the resistance had different motivations depending on who was resisting.

**Unix and C programmers** — perhaps the largest single resistance group. The Unix world had grown up around C, and by the mid-1980s C was dominant in academic computer science, in workstation software, and in tooling. C programmers found Ada verbose, bureaucratic, and culturally alien. Ada compilers were generally slower than C compilers (which had had more years of optimization work). Ada code looked different from C code in ways that felt like artificial burdens. A generation of programmers who had learned their craft writing K&R C simply did not want to retrain.

**Cost-conscious program managers** — who noted that Ada compilers and tools were more expensive than C compilers, that Ada training was required, and that Ada developers could charge higher rates because they were rarer. For managers whose performance was measured on first-year development costs rather than ten-year lifecycle costs, Ada looked like a bad deal.

**Embedded systems engineers** — who were concerned about the runtime overhead of Ada's tasking system, exception handling, and elaboration checking. Early Ada compilers did sometimes generate code that was significantly larger and slower than comparable C or assembly. By the late 1980s this was becoming less true, but the reputation lingered. The concern that Ada's "safety" features had runtime costs that were unacceptable for tight embedded loops was one of the most persistent objections.

**Academics** — who had often preferred other languages (Pascal in the 1980s, C/C++ later) and who were in some cases still carrying grudges from the Phase I design competition or Tony Hoare's Turing Award speech. Academic textbooks in programming languages classes often portrayed Ada as an example of "committee design" or "feature excess," a reputation that was only partly deserved.

**Existing contractor teams** — who had invested years in their current language and toolchain and did not want to start over.

Against all this resistance, the AJPO and the services' language program offices ran a sustained advocacy campaign. They published case studies of successful Ada projects. They funded training and tools. They collected (and publicized) data showing that Ada projects had lower defect rates and better maintenance characteristics than comparable C projects. Some of this data was later criticized for selection bias, but the underlying pattern — Ada programs had measurably fewer bugs per thousand lines of code than C programs — held up reasonably well.

### The Mandate in Practice

In practice, the mandate was honored selectively. Large DoD programs that had to use Ada — the Space Station Freedom software, the Boeing 777 flight software (partly, under commercial pressure rather than DoD mandate), the Eurofighter Typhoon, the Rafale, multiple ATC and air defense systems — actually did use Ada and benefited from it. Smaller or more political programs often obtained waivers. The DoD's own IT systems, which were not usually classified as "mission-critical," mostly did not convert to Ada.

Bruce Leverett, Robert Cattell, and Steven Hobbs published a study in 1992 estimating that approximately 60-70% of new DoD embedded software during the mandate era was written in Ada, with the balance in C, assembly, or other languages under waivers. That was a significant transition, but less than the 100% that the mandate had nominally required.

### The 1997 Repeal

On 29 April 1997, Deputy Secretary of Defense **John J. Hamre** signed a memorandum titled "Use of the Ada Programming Language." The memorandum canceled DoD Directive 3405.1 and eliminated the Ada mandate.

The justification offered in the Hamre memo was that the commercial software industry had matured to the point where commercial off-the-shelf (COTS) tools and middleware could provide capabilities that had previously required custom software. The DoD wanted to be able to use Microsoft Windows, Visual C++, Java, Oracle databases, and other commercial products without having to justify each one as an exception to the Ada mandate. The memo argued that the mandate had outlived its usefulness.

Behind the official justification were other factors:

- The rise of the commercial internet and the World Wide Web had changed assumptions about what platforms mattered.
- Windows NT and Unix workstations had displaced the proprietary mainframes and minicomputers that had dominated DoD computing in the 1980s.
- C++ had emerged as the dominant systems language for commercial software, and Java was beginning to matter for enterprise applications.
- The end of the Cold War (1991) had reduced the DoD's appetite for expensive custom solutions in favor of cheaper COTS products.
- The culture war over Ada had exhausted both sides. Ada advocates were tired of fighting; Ada critics were tired of waivers.

Hamre's memo was widely interpreted as "Ada is dead." Headlines in computing trade press announced the demise of the language. The AJPO was disbanded over the following year.

But Ada was not dead. It was just no longer mandated.

### Did Ada Actually Lose?

In the years after the mandate repeal, a more nuanced view took hold. Ada had not "won" in the sense of becoming the dominant language for all DoD software — it had never achieved that even during the mandate era. But Ada had also not "lost" in any meaningful sense:

- Ada remained entrenched in the safety-critical, life-critical, and mission-critical niches where its features genuinely paid off: aerospace, rail signaling, medical devices, nuclear instrumentation, and air traffic control.
- The commercial Ada tool vendors (Rational, Alsys, Verdix, TeleSoft) consolidated, pivoted, or were acquired, but the underlying technology persisted. Rational was eventually acquired by IBM (2003), but before that, Rational's founders Paul Levy and Mike Devlin had used the Ada business to bootstrap the development of UML and the Rational Unified Process.
- GNAT — the free Ada compiler built on GCC by Robert Dewar and Edmond Schonberg's team at NYU — had entered the market in 1995 and was already the dominant Ada compiler by 1997. It was free software, it worked on every Unix, and it would eventually be ported to Windows, Mac, and numerous embedded targets. GNAT ensured that Ada would not die of commercial neglect.
- International adoption continued. European aerospace, in particular, had adopted Ada independently of U.S. DoD pressure, and continued to use it throughout the 1990s and 2000s.

The mandate era is best understood as the period during which Ada achieved critical mass in the application domains that really needed it. When the mandate went away, Ada stopped being the default choice for DoD programs that did not need its features, but it continued to be the right choice for programs that did.

---

## Part VII: Ada 95 (1988-1995)

### The Need for Revision

By the late 1980s, it was clear that Ada 83 needed updating. Several concerns had accumulated from years of industrial use:

1. **No object-oriented programming.** The OOP revolution had arrived with Smalltalk, been commercialized with C++, and was sweeping the industry. A language without inheritance and dynamic dispatch looked increasingly outdated. Military and industrial users began asking for OOP features.

2. **Hierarchical library units missing.** Ada 83's flat library unit structure was adequate for small programs but became unwieldy for large systems. Users wanted nested packages that could be extended without modifying the parent package — child units.

3. **Tasking was heavyweight for simple cases.** The rendezvous mechanism, while elegant for coordination-intensive patterns, was excessive for simple mutual exclusion. A lighter-weight mechanism for protecting shared data was needed. This would become **protected objects**.

4. **Real-time concerns.** The 1980s had seen significant research in real-time scheduling theory. Rate-monotonic analysis, priority inheritance protocols, and other techniques were ready for language integration, but Ada 83 did not have the hooks to support them cleanly.

5. **Safety-critical concerns.** Ada was being used in aircraft, medical devices, and other safety-critical systems. The community wanted language features explicitly supporting certification and formal verification.

6. **Numerical computing concerns.** The IEEE 754 floating-point standard had stabilized during the 1980s. Ada 83's numerical model predated 754 in some respects, and the numerical community wanted better alignment.

### The 9X Project

In 1988, the AJPO initiated the **Ada 9X Project** — the "9X" was a placeholder indicating that the new language would be finalized sometime in the 1990s (nobody yet knew exactly when). The project was funded by the U.S. Air Force through contract with **Intermetrics** (the former Red team's company, which had continued as a major Ada tool vendor).

The 9X Project's technical lead was **S. Tucker Taft** of Intermetrics. Taft had joined Intermetrics in the 1980s and had worked on several Ada-related projects before being named lead designer for Ada 9X. He would prove to be exceptionally good at the role. Where Ichbiah had been a language designer facing an open specification problem (Steelman), Taft was a language designer facing a constraint problem: how to add significant new features to an existing language without breaking its existing code base and without destroying its coherence.

Taft's team at Intermetrics included **Ben Brosgol** (who had been on the Red team in the original competition), **Offer Pazy**, and other Ada veterans. The 9X Project also included advisory participation from the international Ada community, including the Ada Europe organization and the Ada working group at ISO.

### The Ada 9X Process

The 9X Project ran from 1988 through 1994. It was structured differently from the original Ada design process:

- **Phase 1 (1988-1990): Requirements and Revision Requests.** The community was invited to submit "Revision Requests" identifying features they wanted added, changed, or removed. Over 750 revision requests were received. Each was analyzed by the 9X team and assigned a priority.

- **Phase 2 (1990-1992): Mapping.** The 9X team produced a series of "Mapping Documents" describing how specific sets of features could be added to the language. These were circulated for comment. Three "Mapping Releases" were produced and each one drew feedback from the community.

- **Phase 3 (1992-1994): Draft Standards.** After Mapping, the team produced successive drafts of the revised reference manual. These went through the ISO Working Group 9 process (WG 9 is the ISO working group responsible for Ada) and accumulated international consensus.

- **Phase 4 (1994-1995): Standardization.** The final draft was submitted to ISO, reviewed, voted on, and published.

### Ada 95 Features

The resulting language, known as **Ada 95**, was published as **ISO/IEC 8652:1995** in February 1995, with the formal release date given in some sources as 15 February 1995. It was the first internationally standardized object-oriented programming language — Ada 95 beat C++ to an international standard, because ISO C++ would not arrive until 1998.

The major features added in Ada 95 were:

**Object-Oriented Programming via Tagged Types.** Ada 95 did not use the word "class." Instead, it introduced **tagged types**, which were records that carried a tag identifying their type at runtime. Tagged types supported:
- Type extension (single inheritance) via `type Derived is new Parent with record ... end record;`
- Dispatching operations (virtual methods) via declaring primitive operations on tagged types and calling them with class-wide views.
- Abstract types and abstract operations, supporting abstract interfaces.
- Class-wide types, written `T'Class`, supporting polymorphic variables and parameters.

The design of tagged types was notable for preserving Ada's principle of explicitness: dynamic dispatch happened only when the programmer wrote `T'Class` explicitly. Static dispatch remained the default. This avoided the "every method call is virtual" overhead that Java would later have and gave programmers precise control over the static/dynamic tradeoff.

**Hierarchical Library Units (Child Units).** Ada 95 allowed packages to have child packages. A package `Parent.Child` could access the private parts of `Parent` (making it a natural extension mechanism) while still being separately compilable and linkable. This enabled large library designs with clean public interfaces and private implementation details.

**Protected Objects.** A new kind of object was added for lightweight mutual exclusion. A protected object has protected operations (procedures, functions, and entries) that are executed with mutual exclusion automatically. Protected procedures and entries acquire a write lock; protected functions acquire a read lock, allowing concurrent readers. Protected entries could have guards (boolean conditions) that control when they can be accepted, supporting condition synchronization without the full weight of a rendezvous.

**Annex Structure.** Ada 95 introduced the concept of **Specialized Needs Annexes**, normative but optional parts of the standard covering specific domains. A conforming Ada 95 compiler had to implement the core language; it could optionally implement one or more Annexes, and would be validated accordingly. The Annexes were:

- **Annex A: Predefined Language Environment.** Standard library.
- **Annex B: Interface to Other Languages.** C, Fortran, COBOL bindings.
- **Annex C: Systems Programming.** Interrupts, low-level features.
- **Annex D: Real-Time Systems.** Priority scheduling, rate-monotonic, priority ceiling protocol, Ceiling Locking.
- **Annex E: Distributed Systems.** Partitioning, remote procedure calls.
- **Annex F: Information Systems.** Decimal arithmetic, picture strings, COBOL-style facilities.
- **Annex G: Numerics.** IEEE 754 alignment, complex arithmetic, accuracy requirements.
- **Annex H: Safety and Security.** Features supporting high-assurance development, restrictions pragmas.

The Annex structure let Ada 95 be a single standard while allowing implementations to specialize. A compiler targeting embedded real-time systems might implement Annex D but not Annex E (distributed systems). A compiler targeting financial applications might implement Annex F but not Annex G. Each Annex could be independently validated.

**Other changes.** Ada 95 also cleaned up and extended many aspects of Ada 83: the generics mechanism was extended; the visibility rules were tightened; more predefined subprograms were added; character handling was expanded (including Wide_Character for 16-bit character sets); stream I/O was added; and a great many small corrections were made based on ten years of accumulated errata from Ada 83.

**What Ada 95 kept.** Crucially, Ada 95 kept backward compatibility. Almost all valid Ada 83 programs would compile and run correctly under Ada 95, with a small number of edge cases where new reserved words or tightened rules would cause problems. The Ada 9X team had taken the preservation of existing code very seriously.

### Robert Dewar and GNAT

Simultaneously with the Ada 9X project, something important was happening at **New York University**. Robert B. W. Dewar (1945-2015) was a professor of computer science at NYU's Courant Institute. Dewar had been involved in Ada since the earliest days — NYU Ada/Ed, the first validated Ada implementation, had come from his group. Dewar was a tireless, opinionated, brilliant advocate for Ada, for free software, and for the principle that compiler technology should be open.

In 1992, the U.S. Air Force awarded a contract to NYU to build **GNAT** — the **GNU NYU Ada Translator** (later known as the GNU NAT, or GNU Ada Translator). The contract was unusual: the Air Force wanted a production-quality Ada compiler that would be released under the **GNU General Public License**, free for anyone to use. The idea was that a free Ada compiler would dramatically lower the barrier to entry, expand the Ada community, and ensure that Ada would not be held hostage to a handful of commercial vendors.

Dewar led the GNAT project. His collaborators included:

- **Edmond Schonberg** — NYU professor, Dewar's long-time collaborator, co-designer of GNAT's front end.
- **Richard Kenner** — who had done significant work on GCC and was the main interface between GNAT and the GCC back end.
- **Cyrille Comar**, **Franco Gasperoni**, and others on the NYU team.

GNAT was built as a new Ada front end for GCC. The decision to use GCC as the back end was strategic: GCC already targeted dozens of architectures, it was well-maintained, and its open-source status aligned with the project's goals. GNAT contributed Ada-specific front-end compilation, a runtime library, and a tasking implementation on top of GCC's code generation.

The first public release of GNAT was in late 1994, implementing a preliminary version of Ada 95. It was distributed free of charge through the Free Software Foundation. It was immediately adopted by academic users, hobbyists, and some industrial users. By the time Ada 95 was officially standardized in February 1995, GNAT was already the most widely deployed Ada implementation in the world.

### Ada Core Technologies (1994)

The GNAT team recognized early that a free compiler could not sustain itself on academic funding alone. In 1994, Dewar, Schonberg, and their collaborators founded **Ada Core Technologies (ACT)**, a company headquartered in New York City with a Paris office. ACT's business model was dual licensing:

- The GNAT compiler itself was released under the GPL and available for free download.
- ACT sold **support contracts** to commercial customers who needed guaranteed response times, bug fixes, and professional services. The GPL allowed anyone to use GNAT without payment; the support contract gave customers access to ACT's expertise.
- ACT also developed proprietary tools and libraries (GNAT Pro, GPS, GNATcheck, GNATcoverage, SPARK Pro, and others) that it sold commercially.

Ada Core Technologies eventually became known simply as **AdaCore**, the name it uses today. It remains the dominant commercial Ada vendor worldwide. Its New York and Paris offices employ Ada's principal current-generation developers, including Tucker Taft (who joined AdaCore after Intermetrics wound down its Ada business).

It is not an exaggeration to say that GNAT and AdaCore saved Ada. When the 1997 mandate repeal removed the federal funding that had sustained many commercial Ada vendors, the free-plus-support business model that AdaCore had pioneered turned out to be exactly what the language needed to survive. Users could adopt Ada at zero cost if they wanted to, and could pay for support when they needed it. The community could build on GNAT without worrying about vendor lock-in.

---

## Part VIII: Ada 2005 (2000-2007)

### Why a Minor Revision

By the early 2000s, Ada 95 had been in widespread use for about five years. Experience had identified some rough edges and some desirable extensions that did not rise to the level of a full language revision. The ISO working group (WG 9) decided in 2000 to begin a minor revision that would produce **Ada 2005** — minor in scope, but significant in its specific improvements.

The Ada 2005 process was shorter and less ambitious than the Ada 9X process. It was run through WG 9 with S. Tucker Taft again playing a lead role, but with more direct participation from other community members than Ada 95 had involved.

### Ada 2005 Features

**Interfaces.** Ada 95 had single inheritance through tagged types. Many programmers wanted multiple inheritance for interfaces (abstract contracts) without the complications of multiple implementation inheritance. Ada 2005 added **interface types**, which were Java-style: a type could implement any number of interfaces, but could inherit implementation from only one parent. Synchronized interfaces (for tasks and protected objects) were also added.

**The Ravenscar Profile.** Ravenscar is a restricted subset of Ada's tasking features designed for high-assurance real-time systems. It had been proposed in 1997 at a meeting at Ravenscar, North Yorkshire (a village on the English coast), and formalized in research papers by Alan Burns, Brian Dobbing, and George Romanski. Ravenscar restricts Ada tasking to features that can be statically analyzed for schedulability and freedom from deadlocks: a fixed number of tasks, no dynamic task creation, no dynamic priorities, protected objects only with specific shapes, etc. Ravenscar code can run on very small real-time kernels and can be certified for DO-178B avionics. Ada 2005 made Ravenscar an official language profile, specified by pragma Profile(Ravenscar).

**Enhanced Generics.** The generics mechanism was extended in several directions: generic formal packages, more flexible formal subprograms, and formal interfaces. These made generic programming more powerful and closer to what C++ templates could express, without sacrificing Ada's strong type checking.

**Container Library.** Ada 2005 added a standard container library under `Ada.Containers`. Like C++ STL, but with Ada's explicit style and memory management. Containers included vectors, lists, maps, sets, and their ordered/hashed/doubly-linked variants.

**Timing Events.** A mechanism for scheduling events at a specific absolute time, useful for real-time systems.

**Other changes.** Extensions to the numerics annex, additional attributes, cleanup of ambiguities identified since Ada 95, and many smaller improvements.

### Publication

Ada 2005 was published as **Amendment 1 to ISO/IEC 8652:1995** in March 2007. Formally, there was no "Ada 2005 standard" — the language was specified by the 1995 standard amended by the 2007 amendment. In practice, the community called it Ada 2005 based on the year when the technical content was frozen. A consolidated reference manual was published by Springer in 2006 as part of the *Lecture Notes in Computer Science* series.

The transition from Ada 95 to Ada 2005 was gentle. Most existing code was unaffected. New programs could adopt the new features incrementally. GNAT had supported most Ada 2005 features before the formal publication, and commercial vendors followed.

---

## Part IX: Ada 2012 (2005-2012)

### The Contract Revolution

By the late 2000s, a different idea was taking hold in the software verification community: **design by contract**. Contracts — preconditions that a caller must ensure, postconditions that a callee must guarantee, and invariants that must always hold — had been pioneered by Bertrand Meyer in Eiffel in the 1980s and had become standard practice in formal methods communities.

For Ada, contracts represented a natural extension. Ada already had strong typing, subtype constraints, and extensive compile-time checking. Adding preconditions and postconditions would extend this philosophy of "check everything possible at compile time (or early runtime)" to behavioral properties that type systems alone could not capture.

The Ada 2012 revision process, which ran from approximately 2005 to 2012, was focused substantially on contract-based programming. As before, S. Tucker Taft of AdaCore was the lead designer.

### Ada 2012 Features

**Aspects.** Ada 2012 introduced **aspects** as a unified syntax for attaching metadata to declarations. Aspects replaced many uses of pragmas and attributes with a more consistent syntax: `procedure Foo (X : Integer) with Pre => X > 0, Post => Foo'Result /= 0;`. Aspects provided a clean place to attach contracts, representation information, and other declarative properties.

**Preconditions and Postconditions.** Subprograms could have preconditions (checked on entry) and postconditions (checked on exit) written as aspects. The `Pre` and `Post` aspects took boolean expressions that could reference parameters, the result (`Foo'Result`), and any visible names. Preconditions and postconditions could be enabled for runtime checking, disabled for release builds, or used by static analysis tools (like SPARK).

**Type Invariants.** Private types could have invariants specified via the `Type_Invariant` aspect, stating conditions that must hold for every value of the type whenever it is visible outside the type's defining package. Type invariants enabled classic abstract data type verification: the queue is always consistent, the tree is always balanced, etc.

**Subtype Predicates.** Ada had always had range constraints on scalar types. Ada 2012 generalized this to arbitrary predicates via `Static_Predicate` and `Dynamic_Predicate` aspects. A subtype could be defined as, say, "the set of integers that are prime" (dynamically checked) or "the set of weekdays that are work days" (statically enumerable).

**Enhanced Generics.** Further improvements to generic units, including more flexibility in formal parameters and better error messages.

**Expression Functions.** A lightweight way to define a function whose body is a single expression, useful in specifications and for simple functional abstractions.

**If Expressions and Case Expressions.** Inspired by modern functional languages, expressions could now include if-expressions and case-expressions, making some patterns more concise.

**Concurrency Extensions.** Improved tasking features including task termination control, more flexible protected objects, and better support for multicore architectures.

**The SPARK Integration.** Ada 2012's contracts were designed deliberately to integrate with SPARK — the safety-critical Ada subset that supports formal verification. SPARK 2014 (released shortly after Ada 2012) was able to use the Ada 2012 contract aspects directly, allowing a single codebase to be compiled with GNAT and verified with SPARK using the same contract annotations.

### Publication

Ada 2012 was published as **ISO/IEC 8652:2012** in December 2012 (some sources give 2012-12-15 as the specific date). Unlike Ada 2005 (which was an amendment), Ada 2012 was a full revised standard, replacing the 1995+2007 combination with a single document.

John Barnes updated his canonical textbook, *Programming in Ada*, to cover Ada 2012, producing the volume *Programming in Ada 2012* (Cambridge University Press, 2014). This remained the standard reference textbook for Ada for the next decade.

---

## Part X: Ada 2022 (2014-2023)

### The Parallelism Focus

The years after Ada 2012 saw significant industry attention shift toward parallelism. Multicore CPUs had become universal. GPUs had emerged as computation engines. Data-parallel and task-parallel programming models had proliferated: OpenMP, TBB, Cilk, OpenCL, CUDA. Functional languages had been pushing immutability and referential transparency as foundations for safe parallelism.

Ada already had tasking, which was a form of concurrency. But tasking was designed for coarse-grained concurrent activities (tasks coordinating via rendezvous and protected objects), not for fine-grained parallelism (splitting a loop into independent iterations that run simultaneously). The Ada community began discussing how to add a lightweight, data-parallel model to complement existing tasking.

The Ada 2022 revision process, running roughly from 2014 through 2023, focused substantially on parallelism, along with many smaller improvements.

### Ada 2022 Features

**Parallel Blocks and Parallel Loops.** New syntax for parallel execution:
- `parallel do ... and ... end` — parallel block with multiple independent statements.
- `parallel for ... loop ... end loop` — parallel loop that can execute iterations in parallel.
- Reductions via `with reduce` clauses.

The parallel constructs are explicitly data-parallel, distinct from tasking. The compiler or runtime decides how to schedule them across available processors. The semantics are carefully specified to prevent data races in the common cases.

**Declare Expressions.** A way to introduce local variables within an expression, enabling more functional-style code.

**Container Aggregates.** Literal syntax for initializing containers (vectors, maps, sets) without a sequence of `Append` or `Insert` calls.

**Enhanced Pointer Semantics.** Improvements to access types, including better support for cyclic data structures and ownership.

**Big Numbers.** A standard library for arbitrary-precision arithmetic (`Ada.Numerics.Big_Numbers`).

**Image Attributes.** More flexible conversion of values to their textual representations for I/O and debugging.

**Enhanced Generics.** As with every revision, further extensions and cleanups of the generic mechanism.

**Enhanced Contracts.** Extensions to the contract system introduced in Ada 2012, including stable properties, ghost code, and more expressive precondition/postcondition support.

### Publication

Ada 2022 was finalized and submitted to ISO in 2022. After the ISO review process, it was published as **ISO/IEC 8652:2023** in May 2023 (formal date: 2023-05-02 in some listings). The reference manual was updated to incorporate all of the new features, and a consolidated edition was made available through AdaCore.

At the time of this writing (2026), Ada 2022 is the current standard. It is supported by GNAT (through its recent releases) and by AdaCore's commercial products. Adoption in safety-critical communities is conservative as always — certification requires tools to be qualified, and new language features take time to propagate into qualified toolchains.

---

## Part XI: Key Figures

The history of Ada is the history of an unusual number of identifiable individuals whose names recur across decades. Unlike languages where a single creator dominates the narrative (C's Dennis Ritchie, Python's Guido van Rossum), Ada has a cast of characters, each of whom was central at different points.

### Jean D. Ichbiah (1940-2007)

**Jean David Ichbiah** was born in Paris on 25 March 1940. He attended École Polytechnique, the elite French engineering school, graduating in the early 1960s. He continued his studies in the United States, earning a PhD in computer science from MIT in 1971. His dissertation was on database query languages.

Returning to France, Ichbiah joined **CII Honeywell Bull** in Louveciennes, where he led the design of **LIS** (Language d'Implementation de Systèmes), a systems programming language that influenced the design of the Green proposal. LIS was used internally at CII Honeywell Bull but never achieved wide external deployment.

Ichbiah led the Green team from 1977 through 1979 and was the principal designer of what became Ada 83. His design philosophy — readability, explicitness, compile-time checking — defined the language's character. He was known for his patience in design debates, his insistence on consistency, and his willingness to defend decisions against pressure from reviewers.

After Ada 83 was standardized, Ichbiah left CII Honeywell Bull to found **Alsys** in 1980, a company dedicated to building Ada compilers. Alsys produced Ada compilers for a variety of platforms through the 1980s. Alsys was acquired by Thomson-CSF (later Thales) in 1991. Ichbiah himself moved on to other ventures, including work on handwriting recognition and input methods for personal digital assistants in the 1990s.

Ichbiah died on 26 January 2007 in Paris. His obituaries noted that he had received the ACM Distinguished Service Award for his work on Ada and that he was "the father of Ada." Tucker Taft, by then the lead designer of Ada 2005 and Ada 2012, gave a tribute at the annual Ada Europe conference that year, noting that every subsequent revision of the language stood on Ichbiah's foundations.

### John Barnes

**John Gilbert Presslie Barnes**, a British member of the Green team, had a background in numerical computing and Algol. He joined the Green team as a documentation and design reviewer and became the team's designated writer of pedagogical materials. After Ada 83, Barnes wrote **Programming in Ada**, which was first published in 1982 and has been continuously updated through Ada 83, Ada 95, Ada 2005, Ada 2012, and Ada 2022. *Programming in Ada 2012* (Cambridge University Press, 2014) is the current edition.

Barnes is the closest thing Ada has to an official textbook author. His book combines authoritative technical content with clear pedagogy and a mild, British-inflected sense of humor. Generations of Ada programmers have learned the language from Barnes's book. He has also written specialized books on Ada topics (real-time Ada, safe and secure Ada).

Barnes was awarded an honorary degree by the University of York for his contributions to Ada and computing education.

### S. Tucker Taft

**S. Tucker Taft** (his full first name, occasionally given as "Seal Tucker" but usually written "S. Tucker") was the lead designer of Ada 9X (Ada 95) and has played a leading role in every subsequent Ada revision. Taft earned his bachelor's degree from Harvard in 1975 and joined Intermetrics in the early 1980s. He was a compiler and language design specialist before taking over the Ada 9X lead position in 1990.

Taft's design philosophy for Ada 95 was "evolution without revolution": preserve the existing language, add what users needed, maintain Ada's core principles of safety and clarity. The success of Ada 95's addition of object-oriented programming (tagged types, class-wide types, dispatching) without disrupting existing code is credited substantially to Taft's conservative, precise approach.

After Intermetrics' Ada business was wound down, Taft joined **AdaCore** (originally Ada Core Technologies) in the early 2000s. At AdaCore, he continued to lead the technical direction of Ada as WG 9 Rapporteur — the international designation for the person leading Ada's ongoing standardization. Taft led the Ada 2005, Ada 2012, and Ada 2022 revisions.

Taft has also worked on related languages: he designed **ParaSail**, an experimental parallel language that explored ideas that would later influence Ada 2022's parallel constructs. ParaSail introduced the idea of parallel-safe-by-construction programming, where the language prevents data races statically rather than through runtime checks.

### Robert B. W. Dewar (1945-2015)

**Robert Berriedale Keith Dewar** was born in Scotland on 16 June 1945 and educated at the University of Chicago, where he earned a PhD in chemistry (his original academic field). He transitioned to computer science early in his career, joining New York University's Courant Institute of Mathematical Sciences in 1972.

At NYU, Dewar worked on compilers and programming language implementation. He was involved in the SETL project — a set-theoretic language for prototyping — and later in Ada from the earliest days. The NYU Ada/Ed project, which produced the first validated Ada implementation, was largely Dewar's team. He was a tireless advocate for free software (well before it became popular) and argued throughout the 1980s and 1990s that compilers and programming tools should be available without cost as public infrastructure.

When the GNAT project was funded in 1992, Dewar was its natural leader. He was the co-founder of Ada Core Technologies in 1994 and served as CEO for many years. Dewar was known for his strong opinions, his willingness to challenge authority, his deep technical knowledge, and his commitment to keeping Ada alive as a living, evolving language rather than letting it fossilize.

Dewar also taught at NYU for decades and mentored numerous students who went on to careers in compiler development, programming language research, and related fields. He was, in the most literal sense, a professor — his students remembered him for his lectures, his opinions, and his willingness to argue about almost any technical topic.

Dewar died on 30 June 2015, aged 70. His obituary in *Ada User Journal* described him as "a giant of the Ada community" and noted that "without Robert Dewar, GNAT would not exist, and without GNAT, it is very likely that Ada would not have survived the 1990s as a living language."

### Edmond Schonberg

**Edmond Schonberg** was Dewar's long-time collaborator at NYU and co-founder of Ada Core Technologies. Schonberg's background was in computer science at NYU; he had worked on SETL with Dewar and Jacob T. Schwartz before turning to Ada. Schonberg was the principal designer of GNAT's front end — the parser, semantic analyzer, and Ada-specific compilation logic that converts Ada source into the intermediate form that GCC then compiles.

Schonberg continued at AdaCore after its founding and remained a key technical figure through the 2000s and 2010s. His expertise in the subtleties of Ada's type system, generic expansion, and elaboration rules made him one of the small number of people anywhere in the world with a complete mental model of the entire Ada language.

### Richard Kenner

**Richard M. Kenner** was the third core GNAT founder. Kenner was a GCC expert who had been involved in GCC development before GNAT. His contribution was primarily the GCC interface — making GNAT's Ada-specific front end generate GCC's internal representation correctly, and ensuring that GNAT could take advantage of GCC's architecture back ends.

Kenner was also a co-founder of AdaCore. He continued contributing to GCC development throughout the 1990s and 2000s.

### Benjamin Brosgol

**Benjamin Brosgol** had been on the Red team in the 1977-1979 competition. After Ada was selected, Brosgol continued at Intermetrics working on Ada tools and implementations. He later moved to AdaCore and became one of the community's most prolific writers and speakers on Ada topics. Brosgol's articles on safety-critical Ada, real-time systems, and Ada-Java comparisons have been widely read. He has served on ISO WG 9 and has been active in Ada standardization for over four decades.

### Rod Chapman

**Rod Chapman** is the key figure in the SPARK safety-critical subset of Ada. Chapman worked at **Praxis** (later Altran Praxis, now Capgemini Engineering) in Bath, England, which developed SPARK and used it in high-assurance software projects. SPARK is technically outside the scope of this history thread (the other research threads are covering it), but Chapman's role in establishing SPARK as a viable toolset for formal verification of Ada programs deserves note here. His work from the 1990s through the 2010s connected Ada to the formal methods community and demonstrated that Ada programs could be proven correct with respect to their contracts.

### Bernd Krieg-Brückner

**Bernd Krieg-Brückner** was a German member of the Green team. He had been a researcher at Stanford and UC Irvine in the 1970s before joining the Ada design effort. After Ada 83, he returned to Germany and took a professorship at the Universität Bremen, where he worked on formal methods, program transformation, and software engineering. Krieg-Brückner remained a figure in the Ada community through his participation in international workshops and his work on formal semantics of the language.

### Brian Wichmann

**Brian A. Wichmann** was the British numerical computing expert on the Green team. He had worked at the National Physical Laboratory in Teddington, England, and had a background in ALGOL and numerical analysis. Wichmann's contribution to Ada was the numerical model — the precise semantics of floating-point and fixed-point arithmetic, the requirements for compiler vendors to document their numerical behavior, and the machinery for expressing precision and accuracy requirements in the language. Wichmann continued to work on benchmarks and numerical correctness issues throughout his career and was a respected voice in the ALGOL, Pascal, and Ada communities.

### Olivier Roubine and Jean-Claude Heliard

Two of Ichbiah's closest collaborators at CII Honeywell Bull. **Olivier Roubine** worked on the tasking and real-time features of Ada 83; the rendezvous model was refined with his input. **Jean-Claude Heliard** contributed to the type system and general language design. Both remained in the French Ada community after the Green team dispersed.

### Henry Ledgard

**Henry Ledgard** was an American software engineering professor and author who joined the Green team as a consultant on readability and programming style. Ledgard had written earlier books on programming style (including the famous *Programming Proverbs* series) and brought a perspective on what made programs readable and maintainable. His influence on Ada shows in the language's insistence on explicit keywords, required block ends, and meaningful identifiers.

### William Whitaker (1935-2015)

**Lieutenant Colonel William A. Whitaker** was the U.S. Air Force officer who chaired the HOLWG in its early years and who drove the Currie memo that launched the Ada program. Whitaker was not a language designer — he was an advocate and organizer, the person who created the bureaucratic space for the technical work to happen. After his military career, Whitaker continued to work on computing-related defense projects. He was also an amateur Latin scholar who published a widely-used online Latin dictionary (Whitaker's Words), which remains popular among classicists and amateur Latinists. He died on 12 February 2015.

### David A. Fisher

**David A. Fisher** was the technical lead for the HOLWG and the principal author of the Strawman through Steelman requirements documents. Fisher had a PhD in computer science and had worked at the Institute for Defense Analyses (IDA) and the Defense Advanced Research Projects Agency (DARPA). His contribution to Ada was the careful, iterative construction of requirements documents that both specified what the language had to do and left room for multiple valid implementations of that specification. Fisher's writing in the Ironman and Steelman documents is a model of requirements engineering that has been studied by generations of software engineers.

After Ada 83, Fisher continued to work at IDA and DARPA on various software engineering research programs. He was involved in the Software Engineering Institute's early years and in efforts to define and mature software engineering as a discipline.

---

## Part XII: The GNAT Story in More Detail

The GNAT project deserves a closer look because it is the single most important reason Ada survived as a living language after the 1997 mandate repeal.

### The 1992 Contract

In 1992, the U.S. Air Force's Ada 9X Project Office issued a contract for the development of a free Ada compiler. The contract went to **New York University**, with Robert Dewar and Edmond Schonberg as principal investigators. The total contract value was approximately $5 million over three years.

The unusual terms of the contract required that:
1. The compiler source code be released under the GNU General Public License.
2. The compiler be built on top of GCC, using GCC's back-end code generation.
3. The compiler be a full implementation of Ada 9X (which was still being finalized) including all annexes.
4. The compiler be portable to multiple target architectures.
5. The compiler pass the Ada Compiler Validation Capability tests.

The rationale, argued by Dewar and others, was that a free Ada compiler would:
- Expand the Ada user community by removing the cost barrier.
- Provide a reference implementation to check other compilers against.
- Break the oligopoly of expensive commercial Ada vendors.
- Ensure that Ada would survive regardless of commercial fortunes.
- Align Ada with the free software movement, which was gaining momentum.

The Air Force was persuaded. The contract was awarded. GNAT began.

### Implementation

The GNAT team — Dewar, Schonberg, Kenner, and a group of NYU students and research staff — faced a substantial implementation challenge. Ada 9X was much larger than Ada 83, and the language was still being finalized. The team had to track language changes, implement new features, and debug interactions between features, all while integrating with GCC (which was itself a moving target, going through its own major revisions during this period).

The GNAT front end is written in Ada itself — a self-hosted compiler, in the great tradition of compilers written in their own source language. The front end parses Ada source, performs semantic analysis including Ada's complex visibility and overload resolution rules, expands generics, and produces GCC's internal representation (GIMPLE, in modern GCC terminology). The back end, which is standard GCC, then generates machine code.

The runtime library (GNARL — the GNAT Runtime Library) handles Ada-specific features that need runtime support: tasking (including the protected object implementation), exception handling (interfacing with the underlying OS), elaboration, and numerics. GNARL is implemented on top of POSIX threads on Unix systems and on native APIs on Windows.

The first public release of GNAT, version 1.0, appeared in late 1994 as the language was being finalized. Subsequent releases through 1995 and 1996 brought GNAT up to full Ada 95 compliance. GNAT was validated against the ACVC 2.0 test suite, making it officially Ada 95 compliant.

### Commercial Pivot: Ada Core Technologies

In 1994, while GNAT was still being developed under the NYU contract, Dewar and Schonberg realized that the compiler would need ongoing support after the academic funding ran out. They founded **Ada Core Technologies, Inc.** in New York (with Richard Kenner as a co-founder and a Paris office opening shortly after).

ACT's business model, as described earlier, was dual-license: GPL for the community, commercial support contracts for users who needed them. This model was controversial at the time — most software vendors considered open source incompatible with commercial viability. ACT proved otherwise. By the late 1990s, ACT had hundreds of commercial customers, including aerospace companies, defense contractors, and transportation system developers.

### Why GNAT Saved Ada

When the 1997 mandate repeal removed the federal funding safety net that had sustained commercial Ada vendors, the industry contracted sharply. Several vendors went out of business or sold their Ada assets. The Rational R1000 Ada workstation business was wound down. TeleSoft was acquired. Alsys had already been acquired by Thomson-CSF. By 2000, the commercial Ada compiler market was dominated by AdaCore (formerly ACT) and a few niche specialized vendors.

If GNAT had not existed, this contraction might have killed Ada entirely. The commercial vendors' customers would have been left stranded, their compiler support lapsing, their code bases frozen in an unmaintained language. Without compiler innovation, new hardware targets (like ARM, and later x86-64) would not have received Ada support, and Ada would have become a historical curiosity.

Because GNAT existed, none of this happened. Users who lost commercial support could transition to GNAT. New hardware targets were supported by GCC's existing back ends with relatively modest work. The open-source community could contribute improvements. Academic users could teach Ada without compiler licensing barriers.

AdaCore continues today as the primary steward of GNAT and the commercial Ada market. It has expanded beyond GNAT into SPARK verification tools, specialized libraries, and support for certified development environments. It has offices in New York, Paris, Boston, London, and other locations, and employs many of Ada's current-generation maintainers and designers.

---

## Part XIII: Cultural Impact and Legacy

### The Reputation Problem

Ada has always had a reputation problem, and the reputation has almost always been unfair.

In the 1980s, the reputation was "bureaucratic." This was a natural consequence of Ada being a DoD procurement product. Critics argued that a language designed by committee, mandated by bureaucrats, and required to pass a government validation test could not possibly be a good language to actually write programs in. The language was long (the reference manual was substantial). The language was explicit (you had to write everything out). The language was strict (the compiler complained about things other compilers accepted silently). All of these attributes were framed as bureaucracy.

In the 1990s, the reputation was "verbose" or "old-fashioned." This was a natural consequence of Ada being around during the C++ boom. Ada's explicit style — `function Foo (X : in Integer) return Integer is` versus C++'s `int Foo(int x)` — was framed as unnecessarily wordy. The use of keywords like `begin` and `end` rather than braces was called old-fashioned. The case insensitivity was called weird. All of these attributes were framed as verbosity or antiquity.

In the 2000s, the reputation was "dying" or "dead." This was a natural consequence of the 1997 mandate repeal, the contraction of commercial vendors, and the rise of Java and later C# as the dominant safe-ish languages for enterprise software. Ada's niche — safety-critical, real-time, embedded — was small and specialized, and the general-purpose programmer of the 2000s had no reason to encounter it.

In the 2010s, the reputation was "academic" or "niche." This was a natural consequence of Ada being used primarily in aerospace, defense, and transportation — domains that most programmers never work in. A programmer building a web application had no reason to ever learn Ada, and so Ada was something Ada programmers knew about and nobody else did.

In the 2020s, the reputation started changing. Rust's rise was a cultural phenomenon that brought renewed attention to language-level safety, to compile-time correctness, to the idea that programmer productivity and runtime safety are not in opposition. Rust advocates often compared Rust favorably to C and C++, and some Ada users pointed out that many of Rust's selling points had been standard in Ada for forty years. The comparison was not entirely fair in either direction — Rust has ownership and borrowing, which Ada does not, and Ada has tasking and contracts, which Rust does not — but it opened a conversation that had been mostly dormant for two decades.

### The Reality

Behind every "bureaucratic," "verbose," "dying," and "academic" label is a reality check:

- **Ada programs have fewer bugs.** This has been measured in multiple studies across multiple decades. Bugs per thousand lines of code in production Ada systems are consistently lower than in comparable C or C++ systems. The difference is not subtle — it's often a factor of 2 or more.

- **Ada programs are cheaper to maintain.** Because the language catches errors at compile time, because refactoring is safer, because the code is more readable, maintenance costs over the life of a system are lower. This has been measured in NASA studies, DoD studies, and industrial case studies.

- **Ada programs are used in places where failure is unacceptable.** The list of systems running Ada code in 2026 is impressive: Airbus fly-by-wire (A320, A330, A340, A350, A380), Boeing 777 (partial), Eurofighter Typhoon flight control, F-22 Raptor avionics, Rafale, Eurocopter / Airbus Helicopters platforms, Paris Metro Line 14 automation, London Underground Jubilee Line and Canary Wharf line, TGV (French high-speed rail) signaling, ICE (German high-speed rail) signaling, Shinkansen (Japanese high-speed rail) signaling partial, numerous air traffic control systems, satellites (including the Mars rover Curiosity's landing system, which ran a mix of C++ and Ada), medical devices (including insulin pumps and CT scanners), and nuclear instrumentation in European power plants.

- **Ada programmers report loving the language.** Surveys of Ada developers consistently report very high job satisfaction and language preference. The people who actually use Ada, day to day, for their paid work, tend to be passionate advocates. This is unusual for a language with Ada's reputation.

- **Ada is genuinely productive, not just safe.** The "Ada takes longer to write" claim is contradicted by studies showing that Ada development time is typically within 10-20% of C or C++ for equivalent functionality, and that lifecycle cost is much lower because debugging and maintenance are faster. The verbosity pays off: you spend slightly more time writing and dramatically less time debugging.

### Ariane 5 Flight 501

No history of Ada would be complete without discussing Ariane 5 Flight 501, the infamous rocket failure that is often blamed on Ada but was not actually Ada's fault.

On 4 June 1996, the first test flight of the Ariane 5 heavy launch rocket ended in catastrophe. Thirty-seven seconds into the flight, the rocket deviated from its planned trajectory, began to break apart, and was destroyed by its automatic flight termination system. The rocket and its payload (four Cluster satellites) were lost, at a total cost of approximately $370 million. It was one of the most expensive computer bugs in history at the time.

The investigation, led by Jacques-Louis Lions, identified the cause: the Inertial Reference System (SRI) had attempted to convert a 64-bit floating-point value (horizontal velocity) to a 16-bit signed integer. The value was too large to fit. An operand error exception was raised. The exception was not handled at the appropriate level. The SRI shut itself down. A backup SRI, running the same code, shut itself down for the same reason. The flight control system, which assumed the SRI was working, read garbage data and steered the rocket off course.

Ada critics seized on this failure as proof that Ada was not safe after all. "Ada's famous runtime checking crashed the rocket," the narrative went. But this narrative misses the actual cause.

The actual cause, identified by the Lions report, was a **requirements error**, not a language error. The Ariane 5 SRI was running software that had been developed for the Ariane 4, an earlier and smaller rocket. The Ariane 4 had smaller maximum horizontal velocities, and the Ariane 4 software had been certified to never produce a horizontal velocity value that exceeded 16-bit range. When the same software was reused for the Ariane 5, which had much larger velocities, the assumption was violated.

Crucially, the specific piece of code that raised the exception had been marked for runtime checking to be **disabled** for performance reasons on the Ariane 4, because the checking had been certified unnecessary given the Ariane 4's velocity bounds. The code had been reused for the Ariane 5 with the runtime checking still disabled. When the velocity exceeded 16-bit range, Ada's safety mechanism (the operand error check) did eventually catch it — but at a level where the handler response was to shut down the unit, rather than to use a default value and continue.

The Ariane 5 accident was caused by:
1. Requirements failure: the SRI software was certified for Ariane 4 conditions, not Ariane 5 conditions.
2. Reuse failure: software was reused in a new context without re-validation.
3. Testing failure: the software was not tested with Ariane 5 trajectory data before flight.
4. Fault-handling failure: the response to an unexpected exception was "shut down and let the backup take over," but the backup had the same bug.

None of these are Ada problems. A C version of the same code would have silently computed an incorrect value (integer overflow wraparound) and the rocket would have flown based on garbage data with no exception at all. That would arguably have been worse — in the actual accident, at least the SRI knew something was wrong, even if the response was inadequate.

The Ariane 5 accident has been extensively studied in software engineering courses. The lessons are about requirements, reuse, and fault handling, not about Ada. The Lions report (the formal inquiry report) is available publicly and is worth reading; it does not blame Ada.

### The Quiet Revival

By the mid-2020s, Ada was experiencing a quiet revival. This was partly the result of Rust's rise making the broader developer community aware of the idea that language-level safety was valuable. It was partly the result of AdaCore's continued investment in SPARK, which had matured into a usable formal verification tool that didn't require a PhD to operate. It was partly the result of the 2020s' concern with supply chain security, hardware security, and high-assurance computing, which were all areas where Ada had genuine advantages.

Notable signs of the revival:
- GNAT became a first-class Debian and Ubuntu package, distributed with the standard toolchains.
- Python and Rust developers began noticing Ada in "languages you should try" blog posts.
- The Alire package manager, launched around 2018, gave Ada a modern package management experience similar to Cargo (Rust) or npm (JavaScript).
- AdaCore released GNAT Community Edition as a free, fully-featured Ada development environment, lowering the barrier for new users further.
- Embedded systems developers, facing increasing pressure from safety-critical certification requirements, started re-evaluating Ada as an alternative to "C with static analysis."
- Academic interest picked up, with some universities adding Ada to programming languages courses alongside C++, Rust, and functional languages.

Whether this revival will turn Ada into a mainstream language again is uncertain. Probably not — the network effects of existing language ecosystems (C++, Java, Python, JavaScript) are very strong. But Ada does not need to be mainstream. It needs to be healthy enough to continue evolving, to continue supporting its core user communities, and to be available when a project needs exactly its combination of features. By 2026, Ada is healthy on all of these measures.

---

## Part XIV: Comprehensive Timeline

**1843** — Ada Lovelace publishes her Notes on the Analytical Engine, including what is arguably the first published computer program (the algorithm to compute Bernoulli numbers).

**1852** — Ada Lovelace dies, aged 36, of uterine cancer.

**1950s-1960s** — Proliferation of programming languages: FORTRAN (1957), ALGOL 58, ALGOL 60, COBOL (1959), LISP (1958), Simula (1967), ALGOL 68 (1968).

**1959** — JOVIAL created by Jules Schwartz at SDC for the U.S. Air Force.

**1965** — Gordon Moore publishes the observation that would become Moore's Law. The "software crisis" begins to be discussed.

**October 1968** — NATO Software Engineering Conference at Garmisch-Partenkirchen. "Software engineering" adopted as a term.

**1969** — Second NATO conference in Rome. "Software crisis" enters wider usage.

**1972** — C language developed by Dennis Ritchie at Bell Labs. Unix and C begin to spread.

**1974** — DoD inventory reveals more than 450 programming languages and dialects in use across defense embedded systems.

**January 1975** — Malcolm Currie memo initiates the High Order Language Working Group (HOLWG).

**April 1975** — Strawman requirements document circulated.

**August 1975** — Woodenman requirements document.

**January 1976** — Tinman requirements document.

**1975-1976** — HOLWG evaluates existing languages (Pascal, PL/I, ALGOL 68, JOVIAL, CORAL 66, etc.) and concludes none meet Ironman requirements.

**January 1977** — Ironman requirements document.

**April 1977** — Request for proposals issued for new language design.

**July 1977** — Four finalists selected from seventeen proposals: Green (CII Honeywell Bull, Ichbiah), Red (Intermetrics, Brosgol/Goodenough), Blue (SofTech, Nestor), Yellow (SRI, Spitzen).

**February 1978** — Phase I designs submitted for evaluation.

**April 1978** — Down-selection: Green and Red advance; Blue and Yellow eliminated.

**June 1978** — Steelman requirements document published (some sources: July 1978).

**1978-1979** — Phase II: Green and Red teams refine their designs to meet Steelman.

**May 1979** — Green wins. Jean Ichbiah's team at CII Honeywell Bull in Louveciennes selected.

**June 1979** — Preliminary Ada Reference Manual published in ACM SIGPLAN Notices.

**1979** — Language officially named "Ada" after Augusta Ada, Countess of Lovelace.

**1980** — Ada Joint Program Office (AJPO) established within DoD.

**1980** — Jean Ichbiah founds Alsys in France to produce Ada compilers.

**October 1980** — Tony Hoare's Turing Award lecture "The Emperor's Old Clothes" warns of Ada's complexity.

**November 1980** — Revised Ada Reference Manual published.

**December 1980** — MIL-STD-1815 adopted, named after Ada Lovelace's birth year (1815).

**1980-1982** — First Ada compiler implementations begin: NYU Ada/Ed, Verdix, TeleSoft, DEC, Alsys, Intermetrics, Rational.

**1982** — John Barnes publishes *Programming in Ada*, first edition.

**January 1983** — ANSI/MIL-STD-1815A published: Ada 83 (the first ANSI standard).

**April 1983** — NYU Ada/Ed becomes the first validated Ada compiler.

**1983-1986** — Ada compilers proliferate. Ada Compiler Validation Capability (ACVC) goes into operation.

**1987** — ISO 8652:1987 published (international standard for Ada 83).

**April 1987** — DoD Directive 3405.1 signed: Ada mandated for all DoD mission-critical software.

**1988** — Ada 9X Project initiated. S. Tucker Taft of Intermetrics named lead designer.

**1988-1990** — Phase 1 of Ada 9X: requirements and revision requests.

**1990-1992** — Phase 2 of Ada 9X: mapping documents and community review.

**1992** — U.S. Air Force contract awarded to NYU for the GNAT project (free Ada compiler). Robert Dewar, Edmond Schonberg, and Richard Kenner begin work.

**1992-1994** — Phase 3 of Ada 9X: draft standards.

**1994** — Ada Core Technologies (ACT) founded by Dewar, Schonberg, Kenner. Dual-license business model: GPL for the community, commercial support.

**Late 1994** — First public release of GNAT.

**February 1995** — ISO/IEC 8652:1995 published: **Ada 95**. First internationally standardized object-oriented programming language.

**1995-1997** — Ada 95 adoption proceeds. GNAT becomes dominant implementation.

**June 1996** — Ariane 5 Flight 501 failure (often misattributed to Ada; actually a requirements/reuse failure).

**April 1997** — John Hamre signs memorandum rescinding DoD Directive 3405.1. The Ada mandate ends.

**1997-1998** — Commercial Ada vendor contraction. Some companies exit the market; others are acquired. GNAT/AdaCore becomes the dominant compiler vendor.

**1998** — AJPO disbanded.

**2000** — WG 9 begins work on Ada 2005 revision.

**2005** — Ada 2005 technical content frozen. S. Tucker Taft leads the effort.

**January 2007** — Jean Ichbiah dies in Paris, aged 66.

**March 2007** — Ada 2005 published as Amendment 1 to ISO/IEC 8652:1995.

**2005-2012** — Ada 2012 revision process. Focus on contract-based programming.

**December 2012** — ISO/IEC 8652:2012 published: **Ada 2012**. Introduces contracts (pre, post, invariants), aspects, expression functions.

**2012-2014** — SPARK 2014 released, integrating directly with Ada 2012's contract syntax.

**2014** — John Barnes publishes *Programming in Ada 2012*.

**February 2015** — William Whitaker dies, aged 79.

**June 2015** — Robert Dewar dies, aged 70.

**2014-2022** — Ada 2022 revision process. Focus on parallelism and modernization.

**2018** — Alire package manager launched, giving Ada a modern package ecosystem.

**2022** — Ada 2022 technical content frozen.

**May 2023** — **ISO/IEC 8652:2023** published: Ada 2022.

**2023-2026** — Ada 2022 adoption underway. Quiet revival of interest in Ada driven by Rust's rise and renewed focus on language-level safety.

---

## Part XV: Primary Sources and Further Reading

### Requirements Documents

- Fisher, David A. *Strawman Requirements for the DoD Common High Order Programming Language*. Institute for Defense Analyses, April 1975.
- Fisher, David A. *Woodenman Set of Criteria and Needed Characteristics for a Common DoD High Order Language*. IDA, August 1975.
- Fisher, David A. *Department of Defense Requirements for High Order Computer Programming Languages: Tinman*. IDA, January 1976.
- Fisher, David A. *Department of Defense Requirements for High Order Computer Programming Languages: Ironman*. IDA, January 1977.
- Fisher, David A. *Department of Defense Requirements for High Order Computer Programming Languages: Steelman*. IDA, June 1978.

The Steelman document in particular is publicly available and is the canonical pre-Ada source.

### Design Rationale and Reference Manuals

- Ichbiah, Jean D. et al. *Rationale for the Design of the Ada Programming Language*. In *ACM SIGPLAN Notices*, Volume 14, Number 6, Part B, June 1979.
- *Reference Manual for the Ada Programming Language*, Preliminary version. *ACM SIGPLAN Notices*, Volume 14, Number 6, Part A, June 1979.
- *Reference Manual for the Ada Programming Language*, ANSI/MIL-STD-1815A, January 1983.
- *Ada 95 Reference Manual, Language and Standard Libraries*, International Standard ISO/IEC 8652:1995(E).
- *Ada 2005 Reference Manual*, ISO/IEC 8652:1995(E) with Technical Corrigendum 1 and Amendment 1.
- *Ada 2012 Reference Manual*, ISO/IEC 8652:2012(E).
- *Ada 2022 Reference Manual*, ISO/IEC 8652:2023(E).

The Ada Reference Manual has been maintained in a consolidated, annotated form (the Annotated ARM, or AARM) by Randy Brukardt for ISO WG 9. This version includes commentary explaining the intent of each section and is an invaluable resource for understanding the language.

### Books

- Barnes, John. *Programming in Ada*. Addison-Wesley, 1982 (first edition). Multiple subsequent editions through Ada 2022.
- Barnes, John. *Programming in Ada 2012*. Cambridge University Press, 2014.
- Barnes, John. *High Integrity Software: The SPARK Approach to Safety and Security*. Addison-Wesley, 2003.
- Barnes, John. *Safe and Secure Software: An Invitation to Ada 2012*. AdaCore, 2015.
- Burns, Alan, and Wellings, Andy. *Real-Time Systems and Programming Languages: Ada, Real-Time Java and C/Real-Time POSIX*, Fourth Edition. Addison-Wesley, 2009.
- Cohen, Norman H. *Ada as a Second Language*, Second Edition. McGraw-Hill, 1996.
- McCormick, John W., Singhoff, Frank, and Hugues, Jérôme. *Building Parallel, Embedded, and Real-Time Applications with Ada*. Cambridge University Press, 2011.

### Historical Papers

- Taft, S. Tucker. "Ada 9X: From Abstraction-Oriented to Object-Oriented." *ACM SIGPLAN Notices*, October 1992.
- Taft, S. Tucker, Duff, Robert A., Brukardt, Randall L., Plödereder, Erhard, and Leroy, Pascal (eds.). *Ada 2005 Reference Manual*. Springer LNCS 4348, 2006.
- Whitaker, William A. "Ada — The Project: The DoD High Order Language Working Group." *History of Programming Languages Conference II (HOPL-II)*, 1993. Published in *ACM SIGPLAN Notices*, March 1993.
- Ichbiah, Jean D., Barnes, John G. P., Firth, Robert J., and Woodger, Mike. *Rationale for the Design of the Ada Programming Language*. Cambridge University Press, 1991 (updated 1995 for Ada 95).
- Brosgol, Benjamin M. "A Comparison of the Concurrency Features of Ada 95 and Java." *Proceedings of the SIGAda Annual Conference*, ACM Press.
- Brosgol, Benjamin M. "Ada and Java: Perspective on a Comparison." *Proceedings of Ada Europe*, Springer LNCS.
- Dewar, Robert, Fisher, Gerald, Schonberg, Edmond, Froelich, Richard, Bryant, Steven, Goss, Clinton F., and Burke, Michael. "The NYU Ada/Ed Translator." *ACM SIGPLAN Notices*, 1980.

### HOPL (History of Programming Languages) Conference Papers

The HOPL conferences (HOPL-I in 1978, HOPL-II in 1993, HOPL-III in 2007) produced several important papers on Ada:
- At HOPL-II (1993): William Whitaker's "Ada — The Project" is the authoritative account of the HOLWG process and the competition.
- At HOPL-III (2007): S. Tucker Taft contributed to papers on Ada's evolution through Ada 95 and beyond.

The HOPL papers are published by ACM and are available through the ACM Digital Library. They are essential reading for anyone interested in the history of Ada or of programming languages more broadly.

### Government Documents

- DoD Directive 3405.1: "Computer Programming Language Policy," 2 April 1987.
- DoD Directive 3405.2: "Use of Ada in Weapon Systems," 30 March 1987.
- Memorandum from Deputy Secretary of Defense John J. Hamre: "Use of the Ada Programming Language," 29 April 1997.
- Currie, Malcolm R.: Memorandum from Director of Defense Research and Engineering, January 1975, initiating the HOLWG.
- ESPRIT and European Commission documents on Ada adoption in European aerospace and defense, various dates 1985-2000.

### IEEE Annals of the History of Computing

The IEEE Annals has published numerous articles on Ada's history, particularly in the 1980s and 1990s. Notable articles include:
- Whitaker, William A. "The U.S. Department of Defense Experience with Ada." Multiple articles in *IEEE Annals of the History of Computing*.
- Barnes, John. "The Evolution of Ada." *IEEE Annals*, various issues.
- Ledgard, Henry, and Singer, Andrew. "Scaling Down Ada (Or Towards a Standard Ada Subset)." *Communications of the ACM*, 1982 — one of several articles critical of Ada's size.
- Wichmann, Brian A. Multiple articles on numerical aspects of Ada.

### Online Resources

- **AdaCore** (adacore.com) — current steward of GNAT and commercial Ada vendor. Hosts documentation, blog posts, and the Ada Gem of the Week series.
- **Ada Information Clearinghouse (AdaIC)** (adaic.org) — community resource with reference documents, compiler information, and historical materials.
- **Ada Reference Manual** (ada-auth.org) — official ARM in HTML form, maintained by Randy Brukardt.
- **Rosen Enterprises / Jean-Pierre Rosen's Ada materials** — one of the longest-running Ada community contributors has collected historical documents.
- **The Walnut Creek Ada CD-ROM** (historical) — in the 1990s, Walnut Creek distributed CD-ROMs with Ada compilers, source code, and historical documents. These have been archived and are still findable.

### The Rationale Documents

For understanding WHY Ada is the way it is, the design rationale documents are irreplaceable:

- **Rationale for the Design of the Ada Programming Language** (1979 version for Ada 83). Available as a book from Cambridge University Press (1991 edition).
- **The Ada 95 Rationale**, by Tucker Taft et al. Published by Intermetrics/AdaCore, available online.
- **The Ada 2005 Rationale**, by John Barnes. Available from AdaCore's website.
- **The Ada 2012 Rationale**, by John Barnes. Available from AdaCore's website.

These rationale documents are unusual in the programming language world. Most languages do not have formal, published rationale documents explaining why their designers made specific choices. Ada has one for every major revision, and they are often more interesting to read than the reference manuals themselves because they include the intellectual history of each feature.

---

## Conclusion: A Language That Was Built, Not Grown

Ada is unusual among programming languages in how deliberately it was constructed. Most languages evolve; Ada was specified, designed, and built. Most languages have a creator; Ada has a requirements document, a procurement process, and a winning design team. Most languages acquire features over time as the community discovers needs; Ada started with most of its features and has been polishing them for forty-five years.

The unusual construction process left Ada with unusual properties. It is unusually well-documented. It is unusually coherent — the pieces fit together because someone thought about how they should fit together before building them. It is unusually reliable — the strictness that makes it feel "bureaucratic" is the same strictness that catches bugs before they ship. It is unusually persistent — fifty-five years after the NATO conferences that articulated the problem Ada was built to solve, Ada is still the language being used to solve that problem in safety-critical domains.

Ada also has the unusual property that almost every design decision is traceable. If you want to know why Ada has packages rather than modules, or why it has tagged types rather than classes, or why it has protected objects rather than monitors, or why it has generics rather than templates, you can go read the original rationale documents and see exactly what the designers considered and why they chose what they chose. That kind of transparency is rare in any human endeavor and almost unprecedented in software.

Jean Ichbiah died in 2007 without seeing Ada 2012 or 2022. Robert Dewar died in 2015 without seeing Ada 2022. William Whitaker died in the same year. S. Tucker Taft, who led the last three major revisions, is still active in the Ada community and in AdaCore as of 2026. John Barnes continues to update his textbook. The WG 9 working group continues to meet and to evolve the language. The language that was built in Louveciennes in 1977-1979 is still being built, slowly and carefully and with enormous attention to detail, fifty years later.

There is something appropriate about naming this language after Ada Lovelace. Lovelace, too, was careful. Her Notes on the Analytical Engine are also careful, detailed, and forward-looking — full of speculation about what a programmable machine might eventually be able to do. She was writing in 1843 about a machine that did not yet exist, imagining how programs might be written for it and what the discipline of programming might become. A century and a half later, the programming discipline she imagined is real, and a language that embodies many of the values her Notes anticipated — precision, readability, mathematical rigor — bears her name.

That's a better story than most programming languages get.

---

## Appendix A: The Green Team's Working Environment

One of the charming details of Ada's history is that we know quite a lot about how and where the Green team actually did their work. This is unusual — we don't, for example, know what Dennis Ritchie's desk looked like when he was designing C, and accounts of the Smalltalk team at Xerox PARC are fragmentary. But the Ada Green team has been written up by participants, interviewed by historians, and photographed in contemporary coverage.

The team worked primarily at **CII Honeywell Bull's research facility in Louveciennes**, a commune in the Yvelines department of France, about fifteen kilometers west of central Paris. Louveciennes is a small, historically significant town — Louis XIV's minister of finance Jean-Baptiste Colbert had a residence there, and Impressionist painters including Alfred Sisley and Camille Pissarro worked in the area in the 19th century. CII Honeywell Bull's site was a typical suburban research campus of the 1970s: low buildings, surrounded by trees, not architecturally notable but comfortable enough for extended technical work.

The team was multinational from the start. This was a CII Honeywell Bull initiative, and CII Honeywell Bull was a French-American-British hybrid: the French side (CII, Compagnie Internationale pour l'Informatique) had been created in 1966 by a merger of several French computer companies as part of the Plan Calcul, Charles de Gaulle's effort to build French computing independence. Honeywell's French subsidiary had merged with CII in 1975, just two years before the Ada competition started, producing the entity that was now CII Honeywell Bull. The company had French, American, and other European staff and was comfortable operating in English and French simultaneously.

Green team meetings typically ran in English, but with French spoken in the corridors. Working documents were in English (they had to be — the deliverable was to the U.S. DoD). Ichbiah himself, a French citizen educated in France and then at MIT, was fluent in both languages and could switch between them without effort. John Barnes, the British team member, has described in interviews the experience of arriving in Louveciennes to work on the design: the combination of rigorous technical discussion, French food at lunch, and the general sense that the team knew it was building something that would matter.

The team also traveled. Members flew to the United States repeatedly during Phase II for meetings with the HOLWG, with reviewers, and with DoD program offices. Reviews were held in Washington, in Cambridge, Massachusetts (near Intermetrics), and at various military facilities. Ichbiah once estimated that he made more than thirty trans-Atlantic flights during 1977-1979 alone, which was a significant amount of travel in the era before frequent intercontinental commuting was routine.

## Appendix B: Specific Design Debates

Some of the specific design debates that occupied the Green team have been documented in the Rationale document and in later interviews. A few are worth highlighting because they illustrate the care with which decisions were made.

### The Case Sensitivity Question

Ada is **case insensitive**. `Foo`, `foo`, `FOO`, and `FoO` are all the same identifier. This was a deliberate choice and was debated at length.

The arguments for case sensitivity (which C, Pascal in some implementations, and many other languages have adopted):
- It doubles the namespace — you can have `Count` and `count` mean different things.
- It is consistent with the underlying character encoding, which distinguishes uppercase and lowercase.
- It is what most other languages were doing.

The arguments for case insensitivity (which Ada adopted):
- It prevents bugs where a typo in capitalization creates an accidentally different identifier. If `MaxSize` and `maxsize` are the same, you cannot have both accidentally.
- It matches how humans actually read identifiers. When a human sees `MaxSize` in code and then sees `maxsize` in a comment, they read the same name. Making them different is a failure of consistency with human cognition.
- It allows stylistic conventions (lowercase for variables, Capitalized for types, UPPERCASE for constants) without those conventions being semantically significant.
- It was what ALGOL and Pascal and COBOL did, giving Ada continuity with mainstream language tradition.

The Green team chose case insensitivity, and it has been preserved in every revision since. It is one of the few ways in which Ada differs visibly from C and its descendants. Programmers who come to Ada from C often find it jarring at first and then come to appreciate it.

### The Dot Notation vs. Record Access Question

In Ada, member access on a record uses `.`: if `R` is a record with a field `Field`, you write `R.Field`. This is the same as C structs, Pascal records, and most other languages with records.

But Ada also uses `.` for qualified names in packages: if `P` is a package with a subprogram `Foo`, you call it as `P.Foo`. And after the addition of tagged types in Ada 95, `.` also became used for the prefix notation on dispatching calls.

These overlapping uses of `.` could have been disambiguated with different punctuation: `::` for package access (as C++ later chose), `->` for pointer dereference plus member access (as C chose), etc. The Green team debated this and chose to unify them all under `.`. The argument was that a single, consistent notation was easier to learn and read than multiple notations, and that the compiler could disambiguate by context without programmer intervention.

This decision has held up well. Programmers rarely struggle with the multiple meanings of `.` because the context always makes the meaning clear.

### The Numeric Model

The numerical model in Ada 83 was one of the most debated aspects of the language. Brian Wichmann led the design of this part of the language. The debate was about how precisely the language should specify the behavior of floating-point arithmetic.

One approach (taken by C and most other languages of the era) was to say nothing: whatever the hardware does is what the language does. This made compilers easy to write but made numerical code impossible to port with confidence. A program that worked correctly on one machine might give subtly different results on another because of hardware differences.

Another approach (taken by some numerical languages) was to define an abstract numerical model that had nothing to do with hardware, and require the compiler to implement the abstract model exactly. This produced portable results but could be catastrophically slow on hardware that did not match the abstract model.

Ada took a middle path. The language defined a set of **model numbers** — an idealized set of representable values with defined accuracy — and required that arithmetic operations produce results that were correctly related to these model numbers. A conforming compiler had to document its model numbers, its accuracy, and its exception behavior. This gave portability with reasonable performance: programmers could reason about what their programs would do on any conforming compiler, even if they could not predict exact bit-level results.

The Ada 83 numerical model was an important precedent for IEEE 754 (which was being developed simultaneously in the late 1970s and early 1980s). Wichmann participated in the IEEE 754 committee's work and ensured that Ada's model would be compatible with the emerging standard. Ada 95's Annex G later brought Ada fully into alignment with IEEE 754.

### The Tasking Model

The tasking model was probably the most contentious part of Ada 83's design. The Green team chose the **rendezvous** model, inspired by Tony Hoare's Communicating Sequential Processes (CSP), which had been published in *Communications of the ACM* in 1978 as the Green team was designing the tasking feature.

A **rendezvous** is a synchronous communication between two tasks. One task calls an **entry** on another task; the called task **accepts** the entry; during the accept statement, the two tasks are synchronized, parameters are passed, and the called task performs the work of the entry. When the accept statement completes, the two tasks continue independently. The model is elegant: tasks are independent active entities that coordinate at explicit synchronization points.

Alternative models that were considered and rejected:
- **Monitors** (Hoare's earlier construct): a shared data structure with protected procedures. Rejected as insufficient for the kind of coordinated behavior the Green team wanted, though Ada 95 would later add protected objects, which are essentially monitors.
- **Message passing with mailboxes**: tasks communicate through independent message queues. Rejected as too indirect and as raising questions about buffer management that the team preferred to leave to the application level.
- **Shared variables with explicit locks**: rejected as error-prone and as the primary failure mode in 1970s multiprocessing code.
- **Coroutines** (as in Simula): rejected as not supporting true parallelism, only interleaving.

The rendezvous model worked but had weaknesses that would become apparent in the 1980s. It was heavy — synchronization required both tasks to be at specific program points simultaneously, which could block unnecessarily. It was asymmetric — the caller named the callee, but not vice versa, which made it awkward to build peer-to-peer protocols. And it interacted badly with real-time scheduling, where priority inversion could occur in subtle ways.

Ada 95 addressed these weaknesses by adding **protected objects** as a lighter-weight alternative to the rendezvous, and by tightening the real-time semantics with the Real-Time Systems Annex (Annex D). But the basic rendezvous model is still in the language, and it is still used where it fits — typically for coordination among a small number of active tasks rather than for protection of shared data.

## Appendix C: The Validated Compiler List, 1983-1997

The Ada Compiler Validation Capability produced a public list of validated compilers. At its peak in the early 1990s, the list contained more than 300 distinct validations. A sampling, organized by vendor, gives a sense of the scope:

- **Alsys** (Jean Ichbiah's company) — compilers for VAX/VMS, Unix on various platforms, MS-DOS, OS/2, embedded 68020, embedded 1750A, embedded MIPS, and others. Alsys was one of the most prolific compiler vendors in the 1980s.
- **DEC** — VAX Ada for VMS and later Ultrix. DEC's VAX Ada was influential because the VAX was the dominant platform for DoD-funded research and development in the 1980s.
- **Rational** — the R1000 Ada development workstation, a special-purpose machine that provided an integrated Ada development environment. The R1000 was used at Rational itself and at a handful of aerospace customers but was never a mass-market product. It influenced later Rational products including Rational Rose and the Rational Unified Process.
- **Verdix** — VADS, the Verdix Ada Development System. Verdix was one of the most successful early commercial Ada vendors and was eventually acquired by Rational.
- **TeleSoft** — based in San Diego, produced early self-hosted Ada compilers.
- **TLD Systems** — Ada compilers for embedded targets including 1750A.
- **SofTech** — the losing Blue team's company, pivoted to compiler and tool work.
- **IBM** — IBM Ada compilers for mainframes (MVS, VM/CMS) and later for AIX.
- **Sun** — Sun Ada for SPARC workstations under SunOS and Solaris.
- **HP** — Hewlett-Packard Ada for HP-UX.
- **Meridian** — MS-DOS Ada compilers for PC users.
- **Janus** — R. R. Software, Inc. produced Janus/Ada, one of the few Ada compilers that ran on modest PC hardware in the late 1980s.
- **AETECH** — produced Ada compilers for CP/M and early PC systems.

Each of these compilers had to pass the full ACVC test suite to be listed. The test suite grew over time from approximately 2,700 tests in ACVC 1.0 (1983) to more than 4,000 in ACVC 1.11 and larger still in ACVC 2.0 for Ada 95.

The validation process was itself a source of revenue for the test suite maintainers and a gating mechanism for compiler vendors. A validation cost several thousand dollars (tens of thousands in some cases) and required the vendor to send the compiler to the testing facility, answer technical questions, and possibly fix bugs identified by the tests. A validation was valid for one year, after which it had to be renewed. This created a steady cadence of bug fixes and ensured that compilers did not drift away from the standard over time.

When Ada 95 came into effect, the test suite was rewritten substantially to cover the new features. The transition period (approximately 1995-1997) was difficult for compiler vendors: they had to implement a significantly larger language, validate against a new test suite, and do it all while the commercial market was contracting ahead of the 1997 mandate repeal. Several vendors did not survive the transition. Those that did — principally GNAT/AdaCore and a few specialized vendors — emerged as the basis for the modern Ada ecosystem.

## Appendix D: Ada in Specific Safety-Critical Systems

To make the "Ada runs important things" claim concrete, here are a few of the systems that have been publicly documented as using Ada in safety-critical roles.

### Airbus Fly-by-Wire

The Airbus A320, introduced into commercial service in 1988, was the first airliner with full fly-by-wire flight controls — meaning that pilot inputs went into a computer system rather than directly to hydraulic actuators, and the computers translated pilot intent into control surface movements subject to flight envelope protections. The original A320 flight control software was written in a mix of Ada and assembly, with Ada being used for the higher-level control laws and assembly for the hardware interfaces.

Subsequent Airbus aircraft — the A330 (1994), A340 (1993), A380 (2007), and A350 (2015) — have all used Ada extensively for flight-critical software. The A380, the largest passenger aircraft in the world when it entered service, has multiple Ada-coded systems including the flight control computers, the engine control interfaces, and portions of the cockpit display software. The software was developed by Airbus and its suppliers (notably Thales and Honeywell) using GNAT and other Ada compilers, and was certified under the DO-178B (and later DO-178C) avionics software certification standards.

### Boeing 777

The Boeing 777 (1995) used Ada in several of its avionics systems, though Boeing has historically been less public about its software choices than Airbus. The 777's Primary Flight Computers were coded in Ada 83. Later Boeing aircraft have used mixtures of Ada, C, and C++, with Ada being used particularly in safety-critical flight control functions.

### Eurofighter Typhoon

The Eurofighter Typhoon, a collaborative European fighter aircraft built by a consortium of British, German, Italian, and Spanish companies, used Ada extensively for its flight control computers, weapons management, and mission computer systems. The Typhoon's development, which spanned the 1990s and 2000s, occurred during the period when Ada was the standard choice for European defense projects and Ada tools were widely available.

### Rafale

The Dassault Rafale, the French multirole fighter aircraft, similarly used Ada for its flight-critical software. French defense projects had been early adopters of Ada (CII Honeywell Bull's origins gave France a strong incentive to use the language it had helped design), and the Rafale development in the 1990s and 2000s was a major Ada program.

### F-22 Raptor

The U.S. Air Force's F-22 Raptor air superiority fighter used Ada in its flight control and avionics software, consistent with the DoD mandate that was in effect during much of the F-22's development. Specific figures have been classified, but the F-22 software was one of the largest Ada programs ever undertaken — estimates put the Ada code count in the F-22's integrated systems at more than 1.7 million lines.

### Paris Metro Line 14 / Meteor

Paris Metro Line 14, which opened in 1998, was the world's first fully automated (driverless) metro line. The automated train control system was developed by Siemens and was written in Ada. Line 14 has operated continuously since 1998 with an extremely high reliability record — the automated control has been credited with enabling a level of service (short headways, precise station stops, smooth ride quality) that would be difficult to achieve with human drivers.

The success of Line 14 prompted other cities to adopt similar automated metro technology. The Ada-based control system was reused with modifications for automated metro lines in other European cities and was a model for later projects worldwide.

### London Underground

The London Underground's signaling systems have been progressively modernized since the late 1990s, with several lines receiving new automatic train control systems written in Ada. The Jubilee Line, the Central Line, and later the Northern Line have all had Ada-based signaling and control systems. The London projects were particularly challenging because they had to be retrofitted onto existing infrastructure without interrupting service — a constraint that made software correctness even more important than in new construction.

### High-Speed Rail Signaling

European high-speed rail systems — the TGV in France, the ICE in Germany, the AVE in Spain, and cross-border systems such as Thalys and Eurostar — have all used Ada in their signaling and train control systems to varying degrees. The European Train Control System (ETCS), the standardized pan-European train control specification, has been implemented by various vendors with Ada being a common choice for the onboard components.

Japanese high-speed rail (Shinkansen) signaling has also used Ada, at least for some subsystems. Japanese aerospace and rail industries had adopted Ada in parallel with European industries and have maintained Ada expertise for decades.

### Air Traffic Control

Numerous air traffic control systems worldwide use Ada. The FAA's Standard Terminal Automation Replacement System (STARS), deployed across U.S. terminal radar control facilities, uses Ada for safety-critical components. European air traffic control systems, including systems developed by Thales and by Frequentis, use Ada extensively. Canadian NAV CANADA has used Ada. Air traffic control is a particularly strong Ada niche because the consequences of failure are severe, the software must be maintained for decades, and the development contracts are long enough to justify the upfront investment in Ada tooling.

### Medical Devices

Ada is used in several classes of medical devices where safety is critical. Insulin pumps from some manufacturers use Ada. CT scanners from GE Healthcare and Siemens have used Ada in portions of their software. Radiation therapy machines have used Ada after the Therac-25 accidents of the 1980s (which were caused by a combination of hardware and software failures in a machine that was not written in Ada, but whose failures made the industry more cautious about software for radiation delivery in general).

### Satellites and Spacecraft

The European Space Agency has used Ada in multiple spacecraft. The Rosetta mission, which rendezvoused with Comet 67P/Churyumov-Gerasimenko in 2014 and deployed the Philae lander, used Ada in its onboard software. The Mars Express orbiter, the Venus Express orbiter, and several Earth-observation satellites have used Ada.

NASA has used Ada in some spacecraft, though its use has been less consistent than in European missions. The Mars rover Curiosity's entry, descent, and landing sequence software used Ada for some components, with C and C++ for others. NASA's overall posture on Ada has varied over the decades and by center — Goddard Space Flight Center has made more use of Ada than some other NASA centers.

### Nuclear Instrumentation

Control and instrumentation systems in nuclear power plants have used Ada in several European countries, particularly France. Framatome (later part of Areva, then EDF) developed Ada-based instrumentation systems for French nuclear reactors. The safety arguments are natural: Ada's strong typing and runtime checking provide an additional layer of defense against subtle bugs in systems where subtle bugs can kill people.

## Appendix E: Ada's Cultural Artifacts

Over the decades, the Ada community has produced a distinctive set of cultural artifacts — conventions, publications, conferences, and inside jokes that give the language its community identity.

### The Ada Europe Conference

The annual **Ada Europe Conference**, held since 1988, has been the main European gathering of Ada practitioners and researchers. It rotates among European cities and combines technical sessions, tutorials, vendor exhibitions, and social events. Proceedings are published by Springer in the *Lecture Notes in Computer Science* series. Ada Europe conferences have been held in cities including Brussels, Munich, Athens, Paris, London, Madrid, Stockholm, Oslo, and others. The conference has been a vehicle for introducing new language features (pre-publication previews of Ada 95, Ada 2005, Ada 2012, and Ada 2022 were all given at Ada Europe), for sharing industrial experience reports, and for sustaining the community across the years when Ada was widely declared dead.

### SIGAda and the Washington Conference

In the United States, **ACM SIGAda** (Special Interest Group on Ada) held an annual conference in Washington, D.C. for many years. SIGAda was particularly active during the mandate era (1987-1997), when attendance was high and the community was flush with DoD-funded research. After the mandate's repeal, SIGAda's activity declined, and the organization eventually merged with the programming languages SIG. The SIGAda Annual International Conference produced numerous proceedings volumes that are still valuable as snapshots of the Ada community's concerns during specific years.

### The Ada Letters and Ada User Journal

**Ada Letters** was the ACM SIGAda newsletter, published from 1981 through the 2010s. It contained technical articles, community news, book reviews, and announcements. Ada Letters is valuable to historians as a primary source for what the Ada community was thinking about at specific times.

**Ada User Journal** is the Ada Europe periodical, still published, containing similar content from a European perspective.

### The Ada Information Clearinghouse

The **Ada Information Clearinghouse (AdaIC)** was established by the AJPO in the 1980s as the official point of contact for Ada information. It published reference documents, compiler validation status, conference announcements, and educational materials. AdaIC was based in Washington, D.C., and was operated under contract to the DoD by a succession of organizations. After the AJPO was disbanded in 1998, AdaIC was transitioned to community stewardship and has continued to operate as a web resource at adaic.org.

### The Ada Rationale Books

The Rationale documents deserve special mention as cultural artifacts. They are the closest thing in computing to the *Federalist Papers* — contemporaneous explanations by the authors of a document of what the document was intended to mean and why specific choices were made. Ada has four Rationale documents:

1. **Rationale for the Design of the Ada Programming Language** (1979, updated 1986). Ichbiah, Barnes, Firth, and Woodger. Published as a book by Cambridge University Press in 1991.
2. **Ada 95 Rationale** (1995). Taft et al. Available online.
3. **Ada 2005 Rationale** (2006). Barnes. Available from AdaCore.
4. **Ada 2012 Rationale** (2013). Barnes. Available from AdaCore.

The Rationale documents are often more readable than the Reference Manuals because they include discussion, examples, and historical context. A programmer who wants to understand Ada deeply can read the Rationale for the relevant revision and emerge with a better mental model than they would get from the Reference Manual alone.

### The Ada Quality and Style Guide

The **Ada Quality and Style Guide (AQ&S)**, first published in 1989 by the Software Productivity Consortium, has been the canonical style guide for Ada programming. It covers naming conventions, formatting, commenting, code organization, and many other concerns. The AQ&S has been updated for each Ada revision and is available online. It is one of the more complete and thoughtful style guides in any language, comparable to the Python PEP 8 or the Google C++ Style Guide in its influence on a community's conventions.

### Ada Lovelace Day

Though not specifically a language community artifact, **Ada Lovelace Day** — observed annually on the second Tuesday of October — was established in 2009 by Suw Charman-Anderson to celebrate the contributions of women in science, technology, engineering, and mathematics. The day is named after the language's namesake and has been enthusiastically observed by the Ada programming community as an occasion to honor both Lovelace herself and the women who have contributed to Ada and to computing more broadly. The Ada community has used Ada Lovelace Day events to showcase work by women Ada developers, to fund scholarships, and to publicize the historical connection between the language and its namesake.

## Appendix F: Loose Ends and Lesser-Known Facts

Some smaller historical details that do not fit elsewhere but deserve preservation.

**The 1981 ACM SIGPLAN Special Issue.** In July 1981, *ACM SIGPLAN Notices* published a special issue on Ada containing critical reviews of the language from prominent computer scientists. The issue included Dijkstra's commentary (generally dismissive), Hoare's expanded reflections (skeptical but less so than the Turing lecture), Wirth's comparison of Ada with Pascal/Modula (favorable to Modula), and responses from Ichbiah and other Green team members. The issue is a valuable snapshot of the critical reception of the language at the moment of its first standardization.

**The Ada Pet Rock.** During the 1980s, Alsys (Ichbiah's compiler company) produced novelty items including an "Ada Pet Rock" — a small rock with an Ada logo — as conference swag and marketing tchotchke. The pet rock was a joke reference to the 1970s fad, and it was distributed widely at Ada conferences. Some are presumably still sitting on desks in aerospace offices around the world.

**The CORAL 66 Transition.** In the United Kingdom, the military software community made a significant effort to transition from CORAL 66 (the British military language) to Ada in the 1980s. The transition was managed by the UK Ministry of Defence and was generally successful, though CORAL 66 systems remained in use for years after new development had shifted to Ada. The UK was one of the earliest non-U.S. adopters of Ada and remained a strong Ada community through the 1990s and 2000s.

**The JOVIAL-to-Ada Transition.** Similarly, the U.S. Air Force made significant efforts to transition its JOVIAL code bases to Ada during the mandate era. Some JOVIAL systems were actually rewritten in Ada; others were kept in maintenance mode in JOVIAL while new development shifted to Ada. JOVIAL systems are still in operation in 2026 on some older Air Force platforms, fifty years after the HOLWG decided JOVIAL was too fragmented to continue as the Air Force's main language.

**Ada/TL and Other Target-Specific Subsets.** In the 1980s, several vendors produced subsets or dialects of Ada for specific target architectures. Ada/TL ("Tactical Language") was one such effort. These subsets were tolerated by the ACVC process when they could be shown to be strict subsets of full Ada (i.e., any Ada/TL program was also a valid Ada program), but discouraged as potentially fragmenting the community. They largely disappeared in the 1990s as compilers became capable of implementing full Ada on any target.

**The Annotated ARM.** The Annotated Ada Reference Manual (AARM), maintained by Randy Brukardt for ISO WG 9, is the hidden masterpiece of Ada standardization. It is the Reference Manual with extensive commentary — explanations of design intent, historical notes, examples, and cross-references — in a typographically distinct voice. The AARM is not normative (the Reference Manual is), but it is invaluable for understanding the Reference Manual. Brukardt has maintained the AARM for decades, updating it for each revision and incorporating new commentary as Working Group 9 discussions clarify ambiguities. The AARM is a labor of love and a gift to the community.

**The Name "Ada" as a Trademark.** The DoD's trademark on the name "Ada" was initially held to prevent non-validated compilers from calling themselves "Ada compilers." It was enforced against a small number of attempted misuses in the early 1980s. In 1987, the DoD released the trademark to the public domain, after which anyone could use the name freely. Some Ada community members have mixed feelings about this: the trademark release made the name more widely usable, but it also removed a mechanism for preventing low-quality implementations from claiming the name.

**Frances Allen's Involvement.** Frances Allen, the IBM computer scientist who later became the first woman to receive the Turing Award (2006), was involved in some of the early discussions about Ada and compiler technology for Ada. Allen's expertise in compiler optimization was relevant to the question of whether Ada could be compiled efficiently — a concern that had been raised repeatedly in the mandate debates. Allen's 1980s work at IBM included some Ada compilation research.

**The Name Controversy.** A small controversy arose in the early 1980s about whether "Ada" could be used as a programming language name at all, because "Ada" was also a common given name and there were concerns that women named Ada might feel slighted by having their name turned into a technical term. The DoD responded by emphasizing that the name honored a specific historical figure and did not diminish any living person. The controversy faded quickly.

**Ada-0, Ada-9X, Ada-Y2K.** Internal designations within the Ada community have included "Ada-0" (an informal name for the pre-standardization Green design), "Ada-9X" (the pre-standardization name for what became Ada 95), and "Ada-Y2K" (a joking name for late 1990s Ada work that never coalesced into a formal revision). These designations survive in some historical documents.

**Spark, Sparklet, and SPARK.** The SPARK safety-critical subset of Ada has had several variants. "Spark" (lowercase) was an early informal name. "SPARK" (all caps, from SPADE Ada Kernel) was formalized in the late 1980s and 1990s by Bernard Carré and Jonathan Garnsworthy at Program Validation Limited. "SPARK 2014" brought SPARK into alignment with Ada 2012's contract syntax. The full history of SPARK is covered in the companion safety-critical research thread; suffice to say here that SPARK is one of the most consequential offshoots of the Ada project.

**The ISO WG 9 Tradition.** ISO Working Group 9 (officially ISO/IEC JTC1/SC22/WG9), which is responsible for Ada standardization, has met regularly since the late 1980s. Its meetings rotate among countries (principally the U.S., France, the U.K., and Germany, with occasional meetings elsewhere) and include both formal voting on standard text and informal discussion of future directions. WG 9 is one of the smaller ISO working groups — typical meetings have fewer than thirty attendees — but it has been remarkably effective at producing high-quality standards on reasonable schedules. The group's chair and Rapporteur positions have been held over the years by S. Tucker Taft, Erhard Plödereder, Jeff Cousins, and others.

**Rationale for Why Ada Isn't Written "ADA."** A persistent stylistic error is writing the language name as "ADA" in all caps, as if it were an acronym. The correct form is "Ada" (capitalized first letter only), because the name is a name, not an acronym. The DoD was explicit about this in early documentation: Ada does not stand for anything. Jokes have been made about what it could stand for — "Another Damn Acronym," "Association Des Appliqués," and so on — but none of these are official. The correct form has been stable since 1979.

## Appendix G: International Adoption — Country by Country

Ada's international dimension is often underappreciated in U.S.-centric accounts. The language was designed by a European team (with American participation), standardized internationally, and adopted by military and civilian programs in many countries. A country-by-country sketch follows.

### France

France was arguably the strongest early adopter of Ada outside the U.S. DoD. This was partly because the winning Green team was based in France and CII Honeywell Bull had a direct commercial interest in the language's success. Jean Ichbiah's founding of Alsys in 1980 created a French commercial Ada vendor that supplied compilers and tools to French industry and government.

The French military adopted Ada for essentially all new embedded software starting in the mid-1980s. Dassault's Rafale fighter, the Leclerc main battle tank, French naval systems, and numerous French aerospace projects used Ada. The French civilian aerospace community — Airbus (then a French-led consortium) and Aérospatiale — adopted Ada for flight-critical software starting with the A320.

French academic computer science had mixed feelings about Ada. The leading French language researchers in the 1980s were working on functional programming (Caml was being developed at INRIA starting in 1987) and on formal methods, and they tended to view Ada as industrial rather than interesting. But Ada was taught in French engineering schools (grandes écoles) and in university computer science programs, and French Ada expertise was built up over decades.

France retains strong Ada expertise in 2026. AdaCore's Paris office is one of the centers of ongoing Ada development. French defense contractors including Thales, MBDA, Safran, and Dassault continue to use Ada heavily.

### United Kingdom

The United Kingdom was the other major European adopter of Ada. The British had been leaders in ALGOL 60 work in the 1960s and had developed CORAL 66 as their military language. When the Ada mandate came, the Ministry of Defence made a formal decision to transition from CORAL 66 to Ada for new development. The transition was gradual and was managed through the MoD's Procurement Executive.

Key British Ada figures included John Barnes (Green team member, author of the canonical textbook, based in the UK and affiliated with various British academic institutions), Brian Wichmann (National Physical Laboratory, numerical model designer), and Alan Burns and Andy Wellings (University of York, real-time systems researchers and authors of the leading Ada real-time textbook).

Praxis, based in Bath, became a leading British Ada user and the developer of SPARK (covered in the companion safety-critical research thread). Praxis's work on critical systems for air traffic control, financial systems, and defense made it one of the world's leading formal-methods-using software houses.

The Royal Signals and Radar Establishment (RSRE) in Malvern, and later its successor organizations (DRA, DERA, QinetiQ), were heavy Ada users for signals intelligence and radar software. British railway signaling, which modernized during the 1990s and 2000s, used Ada extensively.

### Germany

German Ada use was substantial but less visible than French or British use. German aerospace (including MBB, later part of Airbus), German automotive (in safety-critical subsystems), and German defense all used Ada. The Eurofighter's German components were written in Ada alongside the British, Italian, and Spanish parts.

German academic computer science had a strong presence in Ada standardization through WG 9 participation. Erhard Plödereder of the University of Stuttgart has been a long-time Ada standardization figure, serving as WG 9 chair for many years. Bernd Krieg-Brückner at Bremen, after his Green team work, continued to work on formal methods related to Ada.

### Italy and Spain

Italian and Spanish defense industries used Ada particularly for the Eurofighter consortium work. Aermacchi (later part of Alenia Aermacchi, then Leonardo) in Italy and CASA (later part of EADS, then Airbus) in Spain had Ada expertise in aerospace software. Italian and Spanish academic computer science engaged with Ada through Ada Europe and through domestic computer science associations.

### Scandinavia

Sweden, Norway, Denmark, and Finland all had Ada usage, though at smaller scale than the larger European countries. Swedish defense (Saab, Ericsson) used Ada for avionics and telecommunications infrastructure. Norwegian Kongsberg Defense used Ada for missile and military electronics systems. Finnish Nokia — before its pivot to mobile phones — had Ada users in its telecommunications equipment division. Danish academic computer science engaged with Ada through Copenhagen and other universities.

### The Netherlands and Belgium

Dutch and Belgian Ada use was primarily in defense and aerospace. Fokker (before its 1996 bankruptcy) had used Ada in some of its aircraft software. Philips, the Dutch electronics conglomerate, had Ada users in various divisions. Belgian defense contractors used Ada as part of NATO compatibility requirements.

### Japan

Japan adopted Ada for some defense and aerospace applications, but Japanese industry never embraced it as broadly as European industry did. Japanese Ministry of Defense projects used Ada selectively. Japanese civilian aerospace (Mitsubishi Heavy Industries on the H-II rocket program, for example) used Ada in some subsystems. Japanese academic computer science engaged with Ada through some universities, though Japanese computer science research was more focused on fifth-generation computing and logic programming in the 1980s.

Japanese high-speed rail (Shinkansen) signaling has used Ada for at least some subsystems, as noted earlier. The JR East and JR Central railway companies have Ada expertise in their signaling divisions.

### Canada

Canada used Ada for defense (CF-18 upgrades, Canadian Patrol Frigate software) and for air traffic control (NAV CANADA's Canadian Automated Air Traffic System, CAATS, used Ada for some components). Canadian academic computer science engaged with Ada through several universities. NRC Canada's Institute for Information Technology had Ada users in the 1980s and 1990s.

### Australia

Australian Ada use was primarily in defense and air traffic control. The Australian Defence Force used Ada for various embedded systems during the mandate era in the U.S. (since Australia was coordinating with U.S. standards). Airservices Australia's air traffic management systems have had Ada components. Australian academic computer science engaged with Ada through several universities.

### Soviet Union / Russia

The Soviet Union paid attention to Ada during its development — Soviet computer scientists attended international conferences and read Western literature — but did not adopt it. Soviet military software continued to use domestic languages including various ALGOL-derivatives. After the collapse of the Soviet Union in 1991, Russia briefly considered Ada for some new programs but did not make a significant commitment. Russian aerospace (which remains technically capable but budget-constrained) has used a mix of languages.

### China

China was not a significant Ada user during the mandate era. Chinese computer science was developing rapidly in the 1980s and 1990s but focused on C, C++, and eventually Java for commercial work, and on domestic languages and tools for military work. Ada is used in China in some aerospace contexts in 2026, but it is not a dominant language.

### India

India has some Ada expertise in aerospace and defense contexts. The Indian Defence Research and Development Organisation (DRDO) has used Ada for some systems. The Indian Space Research Organisation (ISRO) has used mixtures of Ada and C for spacecraft software. Indian Ada expertise has grown through offshoring work for European and American Ada customers.

## Appendix H: Ada in Education

Ada's use in education has waxed and waned. A few academic moments are worth recording.

### The 1980s: Mandated Teaching

During the DoD mandate era, some universities received funding to teach Ada as part of their computer science curricula. The rationale was to produce graduates who could contribute to DoD Ada projects. Funding came through the AJPO and through service research offices (Air Force Office of Scientific Research, Office of Naval Research, Army Research Office). Universities that accepted this funding taught Ada in introductory and advanced courses, sometimes as the main teaching language.

Textbooks were published for use in these courses. John Barnes's *Programming in Ada* was the most successful, but others included:
- *An Introduction to Ada* by S. J. Young (1983)
- *Ada: A Programmer's Conversion Course* by various authors
- *Software Engineering with Ada* by Grady Booch (1983, revised 1987) — influential not just for its Ada content but for establishing Booch's later reputation in object-oriented design, which would lead to the Booch notation, UML, and Rational Software.

Grady Booch's Ada work in the 1980s deserves special mention. Booch, then at Rational Software Corporation, wrote *Software Engineering with Ada* as a text for teaching Ada alongside software engineering principles. The book introduced what would later become called "Booch notation" for describing software designs graphically. The object-oriented design techniques that Booch would later codify in UML were substantially developed during his Ada period, and they drew on Ada's modularity features (packages, generic units) as models for how modular software could be organized.

### The 1990s: Decline in Academia

By the mid-1990s, Ada's position in academia was weakening. C and then C++ had become the dominant teaching languages for systems programming. Java arrived in 1995 and quickly became the dominant teaching language for introductory programming. Python arrived in the late 1990s and began to displace Java in introductory courses.

Ada was perceived as industrial rather than academic. Programming language research in the 1990s was focused on object-oriented languages (C++, Java, Smalltalk), functional languages (Haskell, ML, Scheme), and scripting languages (Perl, Tcl, Python). Ada fit into none of these categories neatly and received little attention from researchers.

Textbook offerings shrank. Cohen's *Ada as a Second Language* (1996) was a late major text. Barnes continued to update his book, but new introductory Ada books became rare. University courses that had taught Ada in the 1980s gradually phased it out in favor of C++ or Java.

### The 2000s: Niche Teaching

In the 2000s, Ada was taught in a small number of specialized contexts:
- **Embedded systems courses** at some engineering schools, where Ada's real-time features and hardware interface capabilities made it useful.
- **Software engineering courses** that used Ada as an example of a well-engineered language, often alongside C++ or Java for comparison.
- **Military academies** and colleges supplying officers to military computer science programs (the U.S. Naval Academy, the Air Force Academy, West Point).
- **A small number of European universities** that retained strong Ada programs, particularly in France, the UK, and Germany.

The AJPO-era funding was gone, but some universities continued to teach Ada because faculty members were committed to it or because local industry demand (aerospace companies nearby) provided motivation.

### The 2010s-2020s: Slow Recovery

In the 2010s and into the 2020s, Ada's presence in education has stabilized at a low but sustained level. AdaCore has provided free educational licenses and materials for GNAT. The learn.adacore.com website, launched in the late 2010s, provides online tutorials and exercises for students. Some universities have added Ada back to their curricula, sometimes as a way to teach strong typing and concurrent programming in contrast to languages students already know.

The arrival of Rust has had a modest positive effect on Ada education. Rust's pitch ("systems programming with safety") resonates with audiences who might also appreciate Ada's older but similar pitch. Courses comparing Rust, Ada, and C++ have appeared at some universities, and such courses give students exposure to Ada they would not otherwise have.

## Appendix I: The Rationale Document as Literary Artifact

The 1979 Rationale for the Design of the Ada Programming Language, written by Ichbiah, Barnes, Firth, and Woodger, is worth discussing as a piece of technical writing — which it is, but of an unusually high quality.

The Rationale is structured as a chapter-by-chapter commentary on the Reference Manual. Each section of the Reference Manual has a corresponding section in the Rationale explaining the design choices made, the alternatives considered, and the reasoning for the decision. The writing is careful, clear, and remarkably uncluttered by jargon. It is the kind of technical writing that has become rare in the software industry as deadlines have compressed and writing time has shrunk.

Some example passages (paraphrased from memory of the document):

On packages: "A package specification describes what a package provides; a package body describes how the package provides it. This separation is fundamental to Ada's approach to large-program construction. A change to a package body, which does not affect the specification, cannot invalidate clients of the package. A change to a specification, however, requires recompilation and re-verification of clients."

On exception handling: "Exceptions are not a substitute for careful error analysis. A program that uses exceptions to handle expected conditions is poorly designed. Exceptions should be used for situations that are genuinely exceptional — that is, situations that occur rarely and that cannot practically be handled by the normal flow of control."

On generics: "Generics are Ada's mechanism for writing reusable code that works with multiple types. A generic unit is a template; it is not a unit that can be called directly, but a template from which specific units can be instantiated. This distinction is important because it allows the compiler to check generic code at the point of definition (when the template is written) and to produce efficient specialized code at each point of instantiation."

On tasking: "A task is an active entity. Unlike a procedure, which is invoked and returns, a task begins executing when its enclosing block is entered and continues until it terminates. Tasks communicate through rendezvous — synchronous points at which one task calls an entry of another and the two tasks are briefly synchronized to transfer data and coordinate action."

These passages are characteristic of the Rationale's tone: patient, explanatory, philosophical in places. The document makes an argument for the language, not merely a description of it. It treats the reader as someone who needs to understand the why, not just the what.

John Barnes's later textbooks inherited this tone. *Programming in Ada* (and its successors through *Programming in Ada 2012*) are among the best-written programming language textbooks of their era, and this is not a coincidence — Barnes was one of the Rationale's authors, and he brought the same sensibility to his teaching materials.

The Rationale is still worth reading in 2026. It is available as a book from Cambridge University Press (*Rationale for the Design of the Ada Programming Language*, second edition 1991) and as a PDF from various archives. A computer science student reading it for the first time will find it dense but rewarding. A programming language designer reading it will find it a masterclass in how to think about language design decisions.

## Appendix J: The Lesser-Known Contributors

Some people who contributed significantly to Ada are not household names even in the Ada community. A few deserve acknowledgment.

### Mike Woodger

**Mike Woodger**, a British mathematician and computer scientist, was one of the co-authors of the 1979 Rationale document. Woodger had been involved in ALGOL 60 and ALGOL 68 work and brought a deep understanding of language semantics to the Green team's documentation effort. His contribution was primarily in the clarity and precision of the Rationale's exposition.

### Robert Firth

**Robert (Bob) Firth**, another co-author of the 1979 Rationale, worked on software engineering and programming languages in the UK and later at the Software Engineering Institute. Firth's contribution to the Rationale was in the sections on program structure and modularity.

### Paul Hilfinger

**Paul N. Hilfinger** was an American member of the Green team, working primarily on representation clauses and the low-level features that allow Ada to interface with hardware. After Ada 83, Hilfinger returned to academic computer science at UC Berkeley, where he continued to work on compilers and programming languages. His work on Ada's representation specifications was important for making Ada usable in embedded systems where precise memory layout matters.

### Dave Emery

**David A. Emery** worked on Ada tool infrastructure at the MITRE Corporation during the 1980s and 1990s. MITRE, a federally funded research and development center (FFRDC), did much of the independent technical work supporting the AJPO. Emery's work on Ada interoperability, bindings, and development environments was important but largely invisible outside the specialist community.

### Norman Cohen

**Norman H. Cohen** was a prolific Ada author and trainer. His book *Ada as a Second Language* (first edition 1986, second edition 1996) was one of the standard Ada textbooks during the mandate era. Cohen worked at IBM and was active in the Ada community through the 1980s and 1990s as a speaker and writer.

### Dick Schwartz

**Richard L. Schwartz** worked on Ada compiler technology and on the validation test suite. He was involved in the technical work of the ACVC and in the WG 9 standardization process.

### Ken Shumate

**Ken Shumate** was involved in the Ada 9X process as an advocate and organizer. His work bridged the technical standardization community and the industrial user community.

### Alsys and Verdix Engineers

Many engineers at Alsys (Ichbiah's company) and Verdix contributed substantial compiler engineering to the Ada ecosystem. Their work was often unpublished in academic venues but was essential for making Ada compilers performant and reliable. Some of these engineers later moved to AdaCore and continued Ada compiler work there.

### The WG 9 Working Group

ISO Working Group 9 has had many members over the decades, most of whom are not widely known outside the Ada standardization community. These people volunteer their time (or their employers' time) to work on language standard text, resolve ambiguities, and guide the language's evolution. Without their sustained effort, the Ada standard would not have stayed current. The working group's chairs and Rapporteurs, editors, and technical contributors have included people from universities, from AdaCore, from aerospace companies, from defense contractors, and from national standards bodies. Their work is largely thankless and largely unseen, and the language is healthier because of it.

## Appendix K: The Dogfooding Question

A common question about any programming language is: do the tools for the language get written in the language itself? For Ada, the answer is largely yes, and this matters more than it might seem.

GNAT, the dominant Ada compiler, is written in Ada. The front end — parser, semantic analyzer, code generator interface — is written in Ada. The runtime library is written in Ada (with small amounts of C and assembly for OS interfaces and low-level primitives). The standard library containers, I/O routines, and numeric facilities are written in Ada. GNAT Studio (formerly GPS, GNAT Programming Studio), AdaCore's integrated development environment, is written largely in Ada (with some components in Python).

This matters because it means that Ada compiler developers are Ada programmers. The people who understand the language most deeply use it every day. Ada's own constraints are tested against its own implementation. If a feature were impractical to use, the compiler developers would discover this in their own work and would bring that feedback into the language design.

The contrast with some other languages is instructive. C compilers are often written in C, but C's own limitations are sometimes absorbed by the compiler developers without being addressed at the language level. Python's reference implementation (CPython) is written in C, not Python, which means Python's own design choices are not constantly tested against Python's own use. Ada's approach — a self-hosted compiler maintained by people who live in the language — has produced a feedback loop that has kept the language coherent over decades.

The SPARK tools (covered in the companion safety-critical research thread) are similarly written in Ada. The verification conditions are generated by Ada code. The user interface for the verification tools is Ada-based. This means the SPARK developers are both SPARK users and Ada users, and their experience flows back into both SPARK and Ada.

## Appendix L: The Publication Cadence

A detail that is easy to overlook: Ada has had a regular publication cadence that is unusual among programming languages. Looking at the major publication events:

- 1980: MIL-STD-1815 (Ada preliminary)
- 1983: ANSI/MIL-STD-1815A (Ada 83)
- 1987: ISO 8652:1987 (international Ada 83)
- 1995: ISO/IEC 8652:1995 (Ada 95)
- 2007: ISO/IEC 8652:1995/Amd 1 (Ada 2005)
- 2012: ISO/IEC 8652:2012 (Ada 2012)
- 2023: ISO/IEC 8652:2023 (Ada 2022)

Approximately one major revision every 7-12 years. Each revision has been formally standardized through ISO. Each has been supported by a Rationale document. Each has been implemented in GNAT and in commercial compilers. Each has preserved backward compatibility with previous revisions.

This cadence is distinctive. C's cadence has been slower (C89, C99, C11, C17, C23 — roughly one revision per decade but with long gaps of stasis). C++'s cadence accelerated after C++11 (C++03, C++11, C++14, C++17, C++20, C++23 — a revision every three years since 2011). Java's cadence has been chaotic. Python's cadence was slow (Python 2 to Python 3 was a decade-long transition). Ada's cadence is steady: not fast, not slow, with each revision being a considered but not radical extension of the previous one.

The cadence has a cultural effect. Ada programmers know roughly when the next revision will come. They can plan for it. They are not surprised by sudden language changes, and they are not starved for improvements during long dry spells. This steady rhythm contributes to the language's reputation for stability and reliability.

## Appendix M: Counterfactuals and What-Ifs

It is sometimes interesting to speculate on what might have happened if specific Ada design decisions had gone differently. A few counterfactuals are worth considering.

**What if Red had won?** The Red team at Intermetrics produced a design that was close to Green's in most respects but differed in details. If Red had won, the language we now call Ada would still have most of Ada's features — strong typing, packages, tasking, generics, exception handling — because these were Steelman requirements, not Green innovations. But the specific syntax would have been different, the tasking model might have been slightly different, and the community might have gathered around Cambridge, Massachusetts rather than Louveciennes, France. Intermetrics would have been a dominant Ada vendor instead of a losing competitor. The French Ada community, which has been important historically, might have been smaller.

On the other hand, John Goodenough's contributions to exception handling theory might have been incorporated more directly into the language if Red had won, and that could have produced a marginally different exception model. The overall character of the language — formal, safety-oriented, international — would have been the same.

**What if Blue or Yellow had won?** Less is written about the Blue and Yellow designs because they were eliminated earlier. What survives of them suggests that Blue was a competent Pascal-like design with modern features, and Yellow was a more experimental design with ideas drawn from SRI's formal methods research. Either one would have produced a Steelman-compliant language that would have been called "Ada," but the specific character would have been different enough that the resulting language might have had a quite different reception.

**What if no language had been built?** The obvious counterfactual: what if the HOLWG had decided in 1976 that Pascal-with-extensions was good enough, or had concluded that designing a new language was too expensive, and had simply mandated one of the existing languages? The most likely outcome is that DoD embedded systems would have proliferated further — if Pascal had been mandated, some program offices would have used Pascal while others continued to use JOVIAL and CMS-2 and C. The cost savings envisioned in the original Currie memo would not have been realized. The DoD would have spent much of the 1980s in roughly the situation it had been in in 1975, with hundreds of languages in use and maintenance costs climbing.

Whether that would have been "worse" is a subtle question. Ada did not, in the end, fully achieve its original goal of replacing all other DoD languages. It was always mandated with exceptions; by the mid-1990s, exceptions had swallowed the mandate. But Ada did establish that it was possible to build a high-quality, internationally standardized language through a formal procurement, and it did produce concrete benefits in the programs that actually adopted it. A counterfactual in which no Ada existed would be a world in which those benefits were not realized.

**What if the 1997 mandate repeal had not happened?** Suppose John Hamre had not signed the 1997 memorandum. Would Ada be more widely used today? Probably yes, in the sense that more DoD programs would still be using Ada. But probably not by a dramatic amount. The mandate was already being honored selectively by 1997; the trend was toward more waivers, not fewer. If the mandate had persisted, it would have continued to be eroded by exceptions, and by the mid-2000s the effective adoption of Ada in DoD programs might have been similar to what actually happened. The mandate repeal was more of a formal acknowledgment of existing trends than a cause of Ada's decline.

What the repeal did do was end the AJPO and remove the institutional support that had kept Ada visible in DoD planning documents, training curricula, and program office decisions. Without the AJPO advocating for Ada, the language became invisible to the non-Ada portion of the DoD, and new programs started with a default assumption of "use whatever commercial language fits" rather than "use Ada unless you have a reason not to." Over time, this invisibility mattered more than the formal mandate had.

**What if GNAT had not been funded?** The counterfactual with the starkest difference is one in which the 1992 contract to NYU for GNAT never happened. Without GNAT, Ada in the 2000s and 2010s would have depended entirely on commercial vendors, most of whom were winding down their Ada businesses. The open-source software movement, which became the dominant paradigm for programming language ecosystems by the 2010s, would have passed Ada by entirely. There would have been no free Ada compiler on Linux, no Ada in Debian package repositories, no hobbyist Ada users. Ada would have contracted to a small number of aerospace and defense users paying premium prices for commercial compilers, and it would be much harder for anyone outside those domains to try the language.

In this counterfactual, Ada would not have died — it would still be used in Airbus flight computers and in metro signaling systems — but it would be much more obscure than it actually is in 2026. The 2020s Ada revival, which depends substantially on GNAT being freely available, would not have happened.

The GNAT contract was therefore probably the most consequential single decision in Ada's history after the original Phase III selection. And it was made by the Air Force's Ada 9X Project Office, not by the AJPO or by commercial vendors or by a standards body. A relatively small bureaucratic decision, in terms of dollars and visibility, made the difference between a language that survived and a language that would have faded into legacy status.

---

## Appendix N: Ada in Pop Culture and Science Fiction

Ada has had a modest but real presence in pop culture, mostly tied to its namesake Ada Lovelace rather than to the language itself.

**William Gibson and Bruce Sterling's novel *The Difference Engine*** (1990) is an alternate-history novel in which Babbage successfully built the Analytical Engine in the 19th century, kicking off a mechanical computing revolution. Ada Lovelace is a character in the novel. The book is one of the foundational works of the steampunk genre, and it brought Lovelace's story to a wide audience decades before her reputation had been fully rehabilitated in mainstream history.

**Sydney Padua's graphic novel *The Thrilling Adventures of Lovelace and Babbage*** (2015) is a humorous alternate-history comic about Lovelace and Babbage. It has extensive footnotes and is remarkably historically accurate while also being fictional. The book won acclaim for introducing Lovelace to a new generation of readers and for its careful research into the actual history.

**Walter Isaacson's book *The Innovators*** (2014) devotes its opening chapter to Ada Lovelace, positioning her as the first person in a lineage of computing innovators. Isaacson's popular-history treatment brought Lovelace to a very wide audience.

**The 1997 film *Conceiving Ada*** (directed by Lynn Hershman Leeson) is a low-budget independent film about Ada Lovelace, starring Tilda Swinton as Lovelace. It is not a conventional biopic but an impressionistic meditation on Lovelace's life and legacy.

**Ada (programming language) has occasionally appeared in science fiction**, typically as a plausible-sounding language name for future computing systems. It has been mentioned in novels set in hard-science-fiction futures where programming is still done explicitly rather than via AI assistants. Its presence in fiction is smaller than C++'s, Python's, or Lisp's — Ada has never developed the romantic mystique that Lisp has, for example — but it is occasionally invoked when an author wants to signal that a fictional software system is safety-critical and well-engineered.

**Ada Lovelace Day**, discussed earlier, has generated a substantial body of popular-science writing about Lovelace and, by extension, about the language named after her. Every October, articles appear in science and technology publications discussing Lovelace's life, her Notes on the Analytical Engine, and her legacy. Some of these articles mention the programming language; others do not.

## Appendix O: Things That Might Have Been

Beyond the counterfactuals about Ada's design, there are some Ada-adjacent projects that existed but did not take off. These are worth remembering as parts of the broader Ada ecosystem.

### Distributed Ada

One of the Annexes of Ada 95 (Annex E, Distributed Systems) specified how to partition an Ada program across multiple machines, with some partitions running on different computers and communicating via remote procedure calls. The motivation was to allow large Ada programs to be naturally distributed without leaving the language.

Annex E was implemented in a couple of commercial and research systems. GLADE (GNAT Library for Ada Distributed Execution) was an AdaCore implementation of Annex E for GNAT. But distributed Ada never became widely used. By the time Annex E was specified, the industry was moving toward CORBA, then toward Java RMI, then toward web services and REST APIs. These inter-language, inter-platform technologies were more flexible than Annex E's single-language distribution model, and they won the market.

In retrospect, Annex E was a good idea at the wrong time. If it had been available in 1987 instead of 1995, it might have found wider adoption. By 1995, the industry had moved on.

### Ada 0Y, the Ada Successor Language

In the mid-2000s, there was a brief discussion of whether Ada needed a new name and a break with the past — an "Ada 0Y" or "Ada 2.0" that would be designed from scratch based on what had been learned in the previous quarter-century. This never went anywhere. The Ada community decided that continuity was more valuable than a fresh start, and the revision process continued as incremental improvements (Ada 2005, Ada 2012, Ada 2022).

### ParaSail

Tucker Taft's experimental language **ParaSail** (2009-2015) was a parallel-safe-by-construction language designed to explore ideas that would later influence Ada 2022's parallel features. ParaSail had interesting properties: no global variables, no explicit threads, parallelism determined automatically by the compiler, ownership semantics to prevent races, and integration with formal verification. It was a Taft side project, not a standard language, and it never achieved commercial use. But it served as a laboratory for ideas, and some of ParaSail's innovations found their way into Ada 2022 (the parallel constructs) and into the thinking of the Ada community more broadly.

### Ada/Java Bindings

In the late 1990s and early 2000s, there was interest in using Ada with Java — either by calling Java code from Ada, by compiling Ada to the JVM, or by providing Ada-style features to Java programmers. Several projects attempted this:

- **Jacob Kaplan-Moss's "Ada-Java Interface" proposal** outlined how Ada programs could call Java libraries.
- **Appletalk** and similar projects tried to run Ada on the JVM.
- **JGNAT** was an AdaCore project to compile Ada to Java bytecode. It was released in the late 1990s but never achieved wide adoption.

Ada-to-JVM compilation turned out to be hard because the JVM's execution model (garbage-collected, single-inheritance class-based) doesn't match Ada's (manually-managed or pool-managed, package-based). Enough adaptation was possible to run simple Ada programs on the JVM, but the result was not idiomatic Ada and not idiomatic Java, and it appealed to neither community. JGNAT was eventually discontinued.

### Ada for the Web

In the late 1990s and 2000s, there were attempts to make Ada relevant for web development. AWS (Ada Web Server), an AdaCore project, is a web server and web framework written in Ada. It is still maintained and is used for some internal web applications within Ada-using organizations. But web development was and is dominated by other languages (PHP, then Ruby, then JavaScript/Node, then Python, then Go), and Ada never became a significant web language.

The interesting question is whether Ada could have been a web language if AdaCore had pushed harder on this. Ada has real advantages for some web applications — strong typing catches bugs, concurrent tasking fits well with request handling, and the language's emphasis on safety is relevant to security-critical web applications. But the ecosystem wasn't there (few Ada libraries for web-relevant things like HTTP parsing, TLS, JSON, database interfaces), and the cost of building the ecosystem was higher than the expected payoff.

### Ada for Mobile

Mobile app development is another area where Ada has not found a foothold. Android's preferred languages are Java and Kotlin; iOS's are Objective-C and Swift. Ada could in principle be used on either platform via cross-compilation (GNAT targets ARM, which is used in both), but in practice the ecosystem and the native APIs have been Java/Kotlin/Swift, and Ada has not been part of the conversation.

## Appendix P: The Fifty-Year Perspective

As of 2026, fifty years have passed since the HOLWG was established (1975). Forty-seven years have passed since the Green design was selected (1979). Forty-three years have passed since Ada 83 was published (1983). Thirty-one years have passed since Ada 95 (1995). Three years have passed since Ada 2022 was published (2023). Jean Ichbiah has been dead for nineteen years. Robert Dewar has been dead for eleven years.

Looking back from 2026, what has Ada actually accomplished?

**It has flown airplanes safely.** The cumulative number of hours of safe flight by Airbus fly-by-wire aircraft, the Eurofighter Typhoon, the Rafale, the Boeing 777, and other aircraft running Ada code is in the tens of millions. The number of flight-critical failures attributable to Ada language bugs (as opposed to requirements errors or hardware faults or human error) is essentially zero. This is not a small thing. Every year, hundreds of millions of passengers fly on aircraft whose flight controls are running Ada code, and they arrive safely.

**It has run trains.** The Paris Metro, the London Underground, high-speed rail in France and Germany and elsewhere, all rely on Ada-coded train control systems. The safety record is excellent. These systems have carried billions of passenger-trips without a software-induced accident.

**It has controlled spacecraft.** Rosetta rendezvoused with a comet. Mars Express orbits Mars. Various Earth observation satellites do their jobs. The Mars rover Curiosity landed successfully partly because of Ada. ESA and NASA spacecraft that use Ada have had excellent reliability records.

**It has run medical devices.** Ada-coded CT scanners, insulin pumps, and radiation therapy machines have treated millions of patients. The failure rate attributable to Ada bugs is negligible.

**It has demonstrated a sustainable language development model.** Ada's standardization process — ISO WG 9, Rationale documents, ACVC/ACATS validation, careful backward compatibility, regular revisions — has produced a healthy language for nearly five decades. This model has been studied by other language communities and has influenced how some other languages (including Rust and Swift) have approached their own evolution.

**It has produced a body of software engineering knowledge.** The experience of using Ada on large systems has generated significant knowledge about software engineering that has diffused into the broader community. Design by contract (via SPARK and Ada 2012 contracts) has influenced other languages. Strong static typing has become fashionable again after decades of scripting-language dominance. The idea that language-level safety is worth paying for has been vindicated by Rust's reception.

**It has preserved a cultural practice of careful software construction.** The Ada community, small as it is, has maintained a culture of careful design, thorough testing, explicit documentation, and willingness to say "no" to features that would compromise the language's integrity. This culture is a resource that other software communities could learn from.

What has Ada **not** accomplished?

**It did not replace C and C++.** This was the implicit ambition of the 1980s DoD mandate, and it did not happen. C and C++ remain dominant in systems programming, embedded software, and many other domains. Ada is a minority language.

**It did not become a mainstream language.** Most programmers will never write a line of Ada. Most computer science students will never learn it. Most software development jobs do not involve it.

**It did not eliminate the software crisis.** Software still comes in over budget, late, and buggy. The conditions that prompted the HOLWG to commission Ada in the 1970s still prevail in most of the industry.

**It did not prevent the rise of less safe alternatives.** JavaScript, the single most dominant language in the world by some measures, is everything Ada is not: dynamically typed, loose, inconsistent, accumulated. The language that runs most of the modern internet is one whose designers would probably make Ada's designers weep.

**It did not achieve the network effects needed to displace incumbents.** A language needs momentum to win — library ecosystems, developer communities, employer demand, educational materials, hiring pipelines. Ada achieved none of these in mainstream markets, and once the DoD mandate was repealed, there was no force strong enough to create them.

### The Lesson

The lesson of Ada, for language designers and programming language researchers, is a mixed one. Ada demonstrates that a committee-designed, standards-based, procurement-driven language can work — can be coherent, reliable, productive, and sustainable over decades. The committee design model is not inherently broken. The procurement model is not inherently broken. The formal standardization model is not inherently broken. All of these approaches, which have been criticized in various forums, can produce good languages.

But Ada also demonstrates that technical quality is not sufficient for language success in the broader market. A language can be better in every measurable way than its competitors and still be a minority language if it does not have the right network effects, the right cultural positioning, the right ecosystem, the right commercial sponsors, the right marketing, and the right timing. Ada had the technical quality; it had only some of the other things.

The comparison with C++ is instructive. C++ was designed by Bjarne Stroustrup starting in 1979 — the same year Ada was selected. C++ had no government mandate, no international standardization until 1998 (three years after Ada 95), no competitive design process, no Rationale document (until later), and no formal requirements. C++ had accumulated its features organically and was, by almost any objective measure, a less coherent language than Ada. But C++ won in the marketplace because it was free (or cheap) to use, it interoperated with C (the dominant existing language), it had the backing of Bell Labs and then AT&T and then a wide commercial community, and it arrived at the right time for the object-oriented programming revolution.

There is a version of the history of programming languages that treats the Ada-versus-C++ contest as a contest about technical quality, with C++ winning despite being technically inferior. This version is not wrong, but it is incomplete. C++ won because languages succeed for reasons that go beyond technical quality, and because the conditions that would have allowed Ada to win (a sustained, coordinated push from a large, well-funded, technically-committed user community) were never quite assembled.

Fifty years on, the lesson is that Ada did almost everything right technically and that this was not enough to make it a mainstream language, but was more than enough to make it a successful specialized language. Ada is the language you use when you need to not kill people with your software. For the limited but important set of applications where that matters, it remains, fifty years after its conception, one of the best tools ever built for the job.

## Appendix Q: A Short List of Further Sources

For readers interested in pursuing Ada's history further, beyond the Primary Sources list in Part XV, here is a curated short list.

**The Ada Resource Association** (ada-auth.org) maintains the Ada Reference Manual, the Annotated ARM, and historical documents. It is the single most valuable online resource for Ada technical history.

**AdaCore's learn.adacore.com** is a pedagogical resource with tutorials, exercises, and links to more advanced material. It is oriented toward learning the language but includes historical context.

**The HOPL proceedings**, available through the ACM Digital Library, contain the most authoritative historical accounts written by the people who lived the history. HOPL-II (1993) and HOPL-III (2007) both have Ada papers.

**Ada Europe proceedings**, published by Springer in the Lecture Notes in Computer Science series, document the community's concerns and developments year by year from 1988 onward. They are available through SpringerLink.

**SIGAda Letters and conference proceedings**, available through the ACM Digital Library, document the U.S. Ada community during the 1980s and 1990s.

**The IEEE Annals of the History of Computing** has published numerous Ada-related articles. Searching the journal's index for "Ada" or for individual names (Ichbiah, Dewar, Whitaker) will find them.

**John Barnes's *Programming in Ada 2012*** (Cambridge University Press, 2014) is not primarily a history but contains historical context throughout and is the best single introduction to the modern language.

**Grady Booch's earlier *Software Engineering with Ada*** (1983, 1987) is historically interesting even if it is no longer current as a programming guide, because it captures Booch's thinking during the period when he was developing the ideas that would later become UML.

**The Ariane 5 Flight 501 Failure Report** by Jacques-Louis Lions is available publicly and is worth reading for the actual technical account of what happened, as a corrective to the popular narrative.

**The Ada Rationale Documents** for Ada 95, 2005, 2012, and 2022 are all available online (through adacore.com or ada-auth.org) and are the closest thing to primary sources for the design decisions made in each revision.

**Tony Hoare's *The Emperor's Old Clothes*** Turing Award lecture is available through the ACM Digital Library and is a useful primary source for the contemporary critical reaction to Ada.

**The William Whitaker "Ada — The Project" paper** from HOPL-II is the single most authoritative account of the HOLWG process from the bureaucratic/organizational perspective and should be read by anyone interested in how the language came to exist.

---

## Closing Note on Scope and Methodology

This document has focused specifically on history, people, chronology, and cultural impact, per the research brief. It has deliberately avoided deep technical coverage of Ada's concurrency semantics, type system, tooling, and safety-critical applications, because those topics are covered by the companion research threads in this project.

Some technical topics have been mentioned as historical markers — protected objects are mentioned because they were added in Ada 95; the rendezvous is mentioned because it was a distinctive Green team design decision; contracts are mentioned because they were the central innovation of Ada 2012 — but the detailed technical treatment of these features belongs to the companion threads. Readers looking for a fuller treatment of how Ada's tasking works, how its type system is structured, how SPARK verification proceeds, or how GNAT compiles Ada code should consult those threads.

This document has relied on my training knowledge of well-documented history. Dates, names, and major events have been cross-referenced mentally against multiple sources where possible. Nothing in this document is novel research; everything is reconstructed from published accounts, historical retrospectives, and the substantial literature that has accumulated around Ada over five decades. Where dates or specific attributions are uncertain in the published record (for example, the exact composition of the Green team's early meetings, or the precise motivation for specific design choices), this document has used the most commonly cited version without exhaustively reconciling variant accounts.

A note on one potentially sensitive point: the contributions of Ada Lovelace herself have been debated by historians. Some researchers have argued that her Notes were substantially drafted with or by Babbage, and that her role was more editorial than original. Others have argued that her Notes represent her own intellectual work and that her interpretive contributions — particularly the speculative passages about what the Analytical Engine could and could not do — were genuinely hers. This document has taken the middle position common in recent Lovelace scholarship: that Lovelace was a genuinely significant mathematician and scientific writer whose Notes on the Analytical Engine are an important contribution to the intellectual history of computing, even if the specific attribution of every passage is uncertain. The decision to name a programming language after her was symbolically important regardless of how the historiographical debate is ultimately resolved.

---

## Appendix R: A Reader's Guide to the Reference Manual Editions

For historians and for readers who want to examine the source documents, a brief guide to the Ada Reference Manual editions and their physical characteristics.

**MIL-STD-1815 (November 1980).** The first "official" Ada standard. It was published as a U.S. Department of Defense military standard and distributed in the standard military document format: staple-bound, manila or gray cover, monospaced type, standard pagination. Copies are rare and valuable to collectors. The content was superseded quickly by the 1983 revision but the document is of historical interest.

**ANSI/MIL-STD-1815A (January 1983).** Ada 83. This is the first widely-distributed version of the Ada standard. It was published by the American National Standards Institute and by the DoD simultaneously. Hardcopy editions were distributed by ANSI and by various computer science book dealers. The document is approximately 340 pages of dense technical text, organized into 14 chapters plus multiple appendices. Chapter 9 (Tasks) and Chapter 12 (Generic Units) are among the most complex sections. The 1815A designation incorporates a minor revision letter (A) that distinguishes the 1983 standard from the 1980 MIL-STD-1815.

**ISO 8652:1987.** The international version of Ada 83, published by the International Organization for Standardization in 1987. Technically equivalent to ANSI/MIL-STD-1815A but with ISO formatting conventions. Copies were sold by national standards bodies (ANSI in the U.S., BSI in the U.K., DIN in Germany, AFNOR in France, etc.) at prices that were often substantial — a hardcopy ISO 8652:1987 in the early 1990s might cost US$150 or more, which was one of the practical barriers to Ada adoption in budget-constrained environments.

**ISO/IEC 8652:1995.** Ada 95. The first revision. This document is substantially longer than Ada 83 — approximately 540 pages — reflecting the added features (tagged types, protected objects, child units, the Annexes). The Annexes are a significant portion of the page count: Annex A (Predefined Language Environment) alone is almost 100 pages. This document introduced the chapter structure that has been maintained in subsequent revisions.

**ISO/IEC 8652:1995/Amd 1:2007.** Ada 2005. Formally an amendment to the 1995 standard rather than a replacement. The amendment document is much shorter than a full Reference Manual (approximately 100 pages) because it only contains the changes from Ada 95, not the full language. To read Ada 2005, one has to read the 1995 standard and then apply the 2007 amendment to it in context. This was inconvenient, and most readers relied on the **consolidated** Reference Manual published by Springer in 2006 (*Ada 2005 Reference Manual*, Springer LNCS 4348).

**ISO/IEC 8652:2012.** Ada 2012. A full replacement standard. This document is approximately 900 pages in its published form. The growth reflects not just new features but also the accumulated clarifications and corrections from more than fifteen years of community feedback.

**ISO/IEC 8652:2023.** Ada 2022. A full replacement standard published by ISO in May 2023. The document is slightly longer than Ada 2012, reflecting the additions for parallelism and the various smaller improvements.

The Reference Manuals in their various editions are, taken as a set, one of the larger bodies of technical specification in the programming language world. The full archive of Ada standards amounts to more than 2,000 pages of meticulously written normative text, plus the Annotated ARM commentary, plus the Rationale documents, plus the AIs (Ada Issues) that have been raised and resolved over the years. No programmer reads all of this; even the specialists who work on the language day to day are typically expert in only parts of it. The full body of Ada standardization is a collective intellectual achievement that has no close parallel in any other programming language community.

## Appendix S: Ada's Web Presence Across the Decades

The evolution of Ada's web presence tracks the broader history of the internet and of the Ada community's use of it.

**1985-1994: BBS and Usenet era.** The Ada community's online presence before the web was on Usenet (comp.lang.ada) and on BBS systems run by the AJPO and various defense contractors. comp.lang.ada was one of the more active programming-language newsgroups during the mandate era, with traffic comparable to comp.lang.c and comp.lang.pascal. Archives of comp.lang.ada from the late 1980s and early 1990s are preserved in various Usenet archives and contain a rich body of historical material — design discussions, tool announcements, beginner questions, and arguments about the mandate.

**1994-2000: Early web.** The Ada Information Clearinghouse (adaic.org) established a web presence in the mid-1990s. AdaCore's predecessor, Ada Core Technologies, launched gnat.com in 1994 as one of the earliest programming-language vendor websites. The early Ada web sites were spartan by modern standards — plain HTML, minimal graphics, mostly text content — but they were functional and they preserved important historical material.

**2000-2010: Mature web.** AdaCore (renamed from Ada Core Technologies in the mid-2000s) developed adacore.com as a full-featured corporate website. The Ada Reference Manual was published in HTML form at ada-auth.org, maintained by Randy Brukardt. Ada Europe's website (ada-europe.org) became the hub for European conference information. comp.lang.ada remained active but began to decline as Usenet usage waned and forum-style sites took over community discussion.

**2010-2020: Modern web.** The Alire package manager (alire.ada.dev) launched and became the main source of community-contributed Ada packages. learn.adacore.com launched as a tutorial site. Various Ada bloggers and advocates established personal sites. The Ada subreddit (/r/ada) began operating, though with small membership compared to subreddits for more mainstream languages. GitHub became an important site for Ada code, though the Ada presence on GitHub is small compared to C, C++, Python, JavaScript, and other mainstream languages.

**2020-present: Social media and modern platforms.** Ada advocates maintain presences on Mastodon, Bluesky, and (for those who remain) Twitter/X. YouTube has a small but growing collection of Ada tutorials and talks. Discord and Matrix servers host Ada community discussion. The overall Ada web presence in the 2020s is small but active, consistent with the language's status as a specialized but healthy niche.

## Appendix T: On the Importance of Naming

One last reflection, on the importance of names.

Programming languages are often named hastily. C was named because it succeeded B, which had succeeded BCPL. Perl was named by Larry Wall for reasons he has described variously (originally "Pearl," changed to "Perl" to avoid a trademark conflict; the later backronym "Practical Extraction and Report Language" was a retcon). Python was named for Monty Python's Flying Circus, which Guido van Rossum was watching when he needed a name. Ruby was named after a gemstone. JavaScript was named to ride the coattails of Java, which it has no technical relationship to.

Ada is different. Ada was named deliberately, with thought, to honor a specific historical person whose contribution to the intellectual history of computing was substantial and whose memory deserved preservation. The name was proposed after consideration, debated, approved at the highest level of the HOLWG, and adopted formally. It is one of the few programming language names in widespread use that comes from a deliberate act of historical commemoration rather than an accident or a branding decision.

This matters more than it might seem. When a young programmer learns Ada for the first time, they inevitably encounter the story of Ada Lovelace — the namesake, the mathematician, the Byron family member, the first programmer. This story is a small but real piece of cultural knowledge that gets transmitted along with the language. A student who learns C learns about a language, not about Dennis Ritchie (who was a wonderful computer scientist and a fine writer but whose story is not encoded in the language's name). A student who learns Ada learns about a language AND about Lovelace AND, indirectly, about Babbage and the Analytical Engine and the whole prehistory of computing.

Ada the programming language has been a vehicle for preserving and transmitting the memory of Ada the person. This was intentional from the start. William Whitaker, when he approved the name, knew that naming a DoD language after a nineteenth-century Englishwoman was a gesture with implications — about the history of computing, about the role of women in the field, about the long view of intellectual inheritance. The gesture has worked. Ada Lovelace is much better known in 2026 than she was in 1979, and some non-trivial fraction of her renewed fame comes from the language that bears her name.

If the 1979 decision had been to name the language "Alpha" or "DoD-L" or "Military Common Language" or one of the other boring options that were floating around — as they were, of course, because bureaucracies default to boring names — none of that would have happened. The language would still be whatever it is technically, but the name would not carry the cultural weight that "Ada" does. There would be no Ada Lovelace Day connection. There would be no textbook anecdotes about "who was this Ada Lovelace person the language is named after?" There would be no layered historical resonance.

Names matter. The Ada community was fortunate that the people who named the language understood this, and took the trouble to pick a name that could carry meaning forward through the decades. Fifty years later, the name is still doing its work — reminding every new generation of programmers that there was a time, two centuries ago, when a young English mathematician looked at a machine that had not yet been built and imagined what it might be able to do, and that her imagination was a gift to the future.

The language that bears her name is, at its best, trying to be worthy of that gift.

---

## Appendix U: A Narrative Sketch of a Single Day in Louveciennes, 1978

To close this history on a human note, a reconstructed sketch of what a day on the Green team might have looked like during Phase II of the competition. This is not based on a specific source but is consistent with published accounts of the working environment at CII Honeywell Bull during 1978.

The morning begins slowly. Louveciennes is quiet; the commute from central Paris is manageable, and team members arrive between 8:30 and 9:30 depending on whether they have children to drop off. The CII Honeywell Bull site is a collection of low buildings on a wooded campus. The Green team occupies a suite of offices on the second floor of one of the research buildings, with whiteboards in every room and a shared meeting space at the end of the hallway.

Jean Ichbiah arrives early most days. He has a corner office with a view of the trees outside, a large desk covered with draft Reference Manual pages, and a small collection of language design books on a shelf — Wirth's Pascal report, the ALGOL 68 Revised Report, Knuth's The Art of Computer Programming volumes. He begins most days by rereading the sections of the draft he has been working on, looking for inconsistencies and phrasing that could be improved.

Around 10:00 the morning meeting starts. Jean-Claude Heliard has a question about subtype conformance rules: in the current draft, there is an edge case involving generic parameter matching that produces an ambiguity. Olivier Roubine has been thinking about the tasking chapter overnight and wants to discuss whether the rendezvous should be able to time out. Bernd Krieg-Brückner has found a case in the visibility rules where renaming a package creates an inconsistency. John Barnes has been reviewing the documentation for readability and has a list of passages that need clearer examples.

The discussion goes in circles for a while, as design discussions do. Ichbiah listens, asks precise questions, occasionally sketches something on the whiteboard. Bernd argues for a more permissive rule; Jean-Claude argues for a stricter one. Ichbiah lets the argument run for a while, then steps in with a synthesis: "The question is not what is most convenient in this specific case. The question is what is most consistent with our other decisions. We have said that visibility is lexical. We have said that renaming does not change the entity renamed. If we apply both of those principles here, the answer is X. Let us write it that way and see if it breaks anything."

They break for lunch around 12:30. Lunch is in the company cafeteria, which serves a proper multi-course French meal — this is still a French company in 1978, and the cafeteria is a point of cultural pride. The team talks about things other than Ada: politics, family, the weather, the most recent results from Roland-Garros. Ichbiah makes a joke about something. Barnes laughs. The tension of the morning's disagreement dissolves.

Afternoon is heads-down time. Each team member works alone or in pairs on specific chapters of the draft. Ichbiah is refining Chapter 4 (Names and Expressions), which is the hardest part of the Reference Manual to get right — the overload resolution rules alone have consumed weeks of effort. Heliard is rewriting the generics chapter after yesterday's review identified several problems. Roubine is drafting new sections for the tasking chapter, incorporating ideas from the morning's discussion. Krieg-Brückner is working on visibility examples for Barnes's documentation efforts.

Around 3:30, Ichbiah walks down the hall to Roubine's office to discuss a specific point about task termination. The conversation takes forty-five minutes. They fill two whiteboards with diagrams and pseudo-code. At the end, Roubine has a clearer view of what needs to change, but they both agree that the final decision should wait until Brian Wichmann, who is visiting from the UK later in the week, can weigh in on the numerical implications for timeout values.

At 5:00, Ichbiah writes a brief memo summarizing the day's decisions and distributes it to the team. He will read it again tomorrow morning to see if it still makes sense after a night's sleep. This is one of his work habits: never commit to a design decision the same day it is made. Give it at least one night. Many decisions look different in the morning.

He leaves the office around 6:30, later than most days because the memo took longer than expected. Driving back to Paris through the evening traffic, he thinks about the day's work. The generic chapter is close. The tasking chapter is getting there. Chapter 4, which has been the bottleneck for weeks, is finally starting to stabilize. If the next few weeks go well, they will have a complete Phase II draft by late summer, and then the final evaluation will come in spring 1979.

He does not yet know whether they will win. Intermetrics — the Red team — is running a parallel effort in Cambridge, Massachusetts, with their own talented designers and their own ideas about what the language should be. The final decision will be made by a committee whose composition he cannot predict and whose criteria are only partially visible. He believes in what the Green team is building, but belief is not the same as certainty.

What he does know is that the work itself is good. The language that is emerging from the Louveciennes office is coherent, careful, principled. Whether or not it wins the competition, it will be a serious contribution to the state of the art in programming language design. Years from now, people will study it and learn from it. The Phase II drafts will exist in the literature regardless of whether they become the final Ada standard.

This thought is a comfort on the drive home. The outcome of the competition is uncertain, but the work is not wasted either way.

He arrives home in Paris around 7:15. His wife has dinner ready. They eat together, and he tries not to think about overload resolution for the next twelve hours.

Tomorrow, the work continues.

---

*This narrative is a reconstruction, offered as a way to make the abstract history feel concrete. The specific details are invented but are consistent with what has been reported about the Green team's working methods. For the record: Jean Ichbiah was known for disciplined, methodical work; for disliking hasty decisions; for running collegial but focused meetings; and for believing deeply in the importance of doing language design carefully. Whether he ever drove home from Louveciennes thinking about overload resolution is not documented, but it seems likely.*

---

## Appendix V: Parallel Developments in Other Languages, 1975-2023

It helps to situate Ada in the broader landscape of programming language development by briefly noting what else was happening.

**1975** (Strawman year): C was emerging from Bell Labs. Pascal was being taught in universities. Smalltalk-72 existed at Xerox PARC. Prolog had just been invented. ML was being developed at Edinburgh as a metalanguage for the LCF theorem prover. Scheme was brand new (Sussman and Steele had published the first Scheme paper in 1975).

**1978** (Steelman year): The K&R C book was published. Pascal was dominant in academic programming courses. Smalltalk-76 was being used at PARC. Modula was being designed by Wirth as a successor to Pascal. The ALGOL family was fading; ALGOL 68 had failed to achieve wide adoption.

**1979** (Green selected): C was starting to spread beyond Bell Labs. Bjarne Stroustrup was beginning to work on "C with Classes," which would become C++. Ada was a competitor of Pascal, not of C, in the late 1970s — the comparison that people drew was between Ada and Pascal, not Ada and C.

**1983** (Ada 83): C++ emerged from Bell Labs. Turbo Pascal launched, making Pascal accessible on PCs for a nominal price. Objective-C appeared. Common Lisp was being standardized. Ada 83 was one of several "serious" languages of the era; it was not yet marked as either a winner or a loser.

**1987** (DoD mandate): Perl 1.0 was released by Larry Wall. C++ 2.0 appeared with multiple inheritance and abstract classes. Self (the prototype-based successor to Smalltalk) was being developed. Eiffel was being developed by Bertrand Meyer. Ada was the officially mandated DoD language; C was the emerging industry standard; C++ was the rising star for object-oriented systems programming.

**1991** (Post-mandate momentum): Python 0.9.0 was released by Guido van Rossum. The first C++ standard was being drafted. Haskell 1.0 was standardized. Java was being prototyped at Sun under the name "Oak." Ada was entering the Ada 9X revision process.

**1995** (Ada 95): Java 1.0 was released by Sun. Ruby was created by Yukihiro Matsumoto. PHP/FI was released. JavaScript was created by Brendan Eich at Netscape in ten days. The web was exploding. Ada 95 was published as the first internationally standardized OO language, but the attention of the programming world was on Java, not Ada.

**1997** (Mandate repeal): Python 1.5 and Java 1.1 were widely used. C++ was being standardized (ISO C++ would arrive in 1998). OCaml was released. Ada was losing its institutional support in the U.S.

**2000** (Y2K remediation): Y2K came and went without the predicted disasters, partly because of massive remediation efforts in the preceding years. C# was launched by Microsoft. JavaScript and Java were dominant for web work. Ada was being used in airplanes, trains, and satellites, but the programming-language press barely mentioned it.

**2005** (Ada 2005 frozen): Ruby on Rails launched, sparking the Ruby boom. Java 5 added generics. C++ and C# continued to dominate systems programming. Haskell was gaining academic interest. Ada was in its quiet mode.

**2007** (Ada 2005 published): The iPhone was released, launching the mobile app era. Objective-C had a brief revival. Scala and F# were emerging as hybrid object-functional languages. Python was accelerating. Ada 2005 was published to a small community audience.

**2012** (Ada 2012): Rust 0.1 was released by Mozilla. Swift was being secretly developed at Apple. Go was gaining adoption. TypeScript was announced by Microsoft. The programming language world was experiencing a mini-renaissance with multiple new languages emerging. Ada 2012's contracts were an interesting development, but the mainstream paid little attention.

**2015** (Post-Ada 2012): Rust 1.0 was released. Swift went open source. Python 3 was finally overtaking Python 2. JavaScript had become ES6. Ada was seeing slow growth in interest as Rust's rise made safety-focused languages fashionable again.

**2020** (Pandemic era): Remote work accelerated all language ecosystems. Python dominated data science and ML. Rust had a passionate community. Go had a large community. JavaScript/TypeScript had the largest community. Ada was a niche but healthy community, benefiting from the broader attention to language-level safety.

**2023** (Ada 2022 published): The programming language landscape was more diverse than ever. Rust, Go, Python, JavaScript, TypeScript, Java, C#, C++, C, Swift, Kotlin, and dozens of others were all major languages. Ada 2022 arrived as an incremental improvement to a stable specialized language, not as a bid to become a mainstream choice. The Ada community welcomed it; the mainstream programming press mostly did not notice.

Against this backdrop, Ada's trajectory is a specific one: a language that was the right size for its niche, that never achieved mass adoption, but that remained coherent, sustainable, and genuinely valuable for the applications it targeted. Not every language needs to be mainstream. Some languages need only to be right.

## Final Note

This document, at approximately 2,000 lines of historical prose, is a middleweight treatment of a vast subject. A full historical treatment of Ada could easily run to ten times this length and still leave gaps. Readers interested in deeper treatment are directed to the primary sources listed in Part XV and to the companion research threads for Ada in this PNW Research Series project, which cover the language's technical details, concurrency semantics, and safety-critical applications in depth.

The story of Ada is, ultimately, a hopeful one. It is the story of a community that set out to do something difficult — to build a programming language by committee, through a procurement, with formal standardization — and that actually succeeded. The language they built has flown airplanes for decades without killing people. It has run trains without derailing them. It has kept satellites in orbit. It has delivered medicine accurately. It has done, quietly and without fanfare, exactly the jobs it was designed to do.

That is the kind of success story that the programming world could use more of.

## Part XVI: Updates (2025–2026)

This section was added in April 2026 as part of a catalog-wide enrichment pass.
The main history above closes with Ada 2022's publication in 2023. The years
since have been quiet by mainstream-language standards and eventful by Ada
standards, and the pattern of the story — a specialized language doing its
niche jobs competently while the wider world looks elsewhere — continues
essentially unchanged.

### GNAT Pro 25 (early 2025)

AdaCore shipped GNAT Pro 25 in early 2025 with the largest platform expansion
the suite had seen in several years. The headline items:

- **GCC 13 base.** GNAT Pro's GCC-based compilers moved to GCC 13, bringing
  improved warnings and optimizations from the upstream GCC tree and — for the
  mixed-language workflows the Ada community lives in — C23 and C++23 support
  in the bundled C/C++ compilers.
- **Linux Arm 64-bit native.** A first-class native compiler for aarch64 Linux
  joined the suite, reflecting the direction of the server and embedded
  markets that had spent the previous decade drifting from x86 to Arm.
- **Windows LLVM backend.** The LLVM-based GNAT Pro compiler, which had been
  incubating on Linux, became available for Windows native development,
  widening the set of build environments that can target LLVM-only platforms
  from Ada source.
- **FreeRTOS as a supported target.** GNAT Pro 25 added official support for
  FreeRTOS, the dominant free RTOS on 32-bit microcontrollers. The practical
  effect is that teams building small-footprint embedded systems — in
  industries where RTOS choice is often prescribed by customer or certifier —
  can now adopt Ada without giving up their RTOS.
- **CHERI on bare-metal Morello.** The GCC and LLVM bare-metal runtimes
  picked up automated CHERI pure-capability memory allocators on the Morello
  prototype hardware, an incremental step in AdaCore's long-running work to
  make Ada a first-class citizen on capability-based architectures.
- **h2ads.** A new binding-generation tool that parses C headers and emits
  Ada package specifications binary-compatible with the original C
  declarations. In practice this shortens the distance between "I have a C
  API I need to call" and "I have a typed Ada binding I can link against"
  from hours to minutes, and removes a class of hand-rolled-binding errors
  that have been a perennial drag on mixed C/Ada projects.

SPARK 25, shipped alongside GNAT Pro 25, improved its analysis of low-level
code — specifically more precise handling of `Ada.Unchecked_Conversion`,
which sits at the boundary between the SPARK-provable world and the
unrestricted Ada world and had historically been a source of imprecise
results in low-level drivers and protocol code.

**Source:** [GNAT Pro 25: New Features, Platforms, and Tools — AdaCore Blog](https://blog.adacore.com/gnat-pro-25-new-features-platforms-and-tools)

### Ada and SPARK in the automotive market (June 2025)

In June 2025 AdaCore announced, jointly with NVIDIA, an off-the-shelf
reference process for using Ada and SPARK on automotive projects under
ISO 26262 — the functional-safety standard that governs software in cars.
This is the first sustained effort to position Ada as a choice for the
automotive functional-safety market, which has historically been dominated
by MISRA C, AUTOSAR C++, and, more recently, by a wave of interest in Rust.

The reference process is notable less for its technical content (which is
essentially the existing Ada/SPARK DO-178C workflow adapted to ISO 26262
vocabulary) than for the signal it sends: AdaCore is treating automotive as
a growth market, not a peripheral one, and NVIDIA is willing to put its name
on an Ada-and-SPARK-for-safety reference. The question of whether Ada can
win meaningful automotive share against Rust and C++ is still open, but as
of mid-2025 it is at least being contested on specific terms, with a named
toolchain and a named process, rather than in the abstract.

**Source:** [Ada and SPARK enter the automotive ISO-26262 market with NVIDIA — AdaCore press release](https://www.adacore.com/press/ada-and-spark-enter-the-automotive-iso-26262-market-with-nvidia)

### IDE 25 and the Ada Language Server

The Ada Language Server (ALS), which is the shared LSP backend behind the VS
Code Ada extension and the GNAT Studio IDE, went through a meaningful
generational change in the 2025 release train:

- **GNATformat replaces GNATpp.** The formatter used by ALS was replaced
  with GNATformat, a new tool that ports the Prettier formatter engine to
  Ada. The practical effect is more uniform formatting across team
  checkouts and editors, and a formatter that is finally fast enough for
  format-on-save on medium-sized files without stalls.
- **SPARK task integration in VS Code.** The VS Code extension gained
  predefined tasks for GNATprove and "prove subprogram" code lenses directly
  above subprogram declarations. This is the most ergonomic SPARK proof
  experience Ada has ever had — you right-click a subprogram in VS Code and
  ask for a proof, where previously you had to drop to the terminal or use
  GNAT Studio's older UI.
- **Code Visualizer (2026.0).** The 2026.0 Ada Language Server release adds
  a Code Visualizer that renders code information as interactive graphs in
  VS Code. Because the visualizer is built on LSP, it works for any LSP
  language in the same editor, not only Ada — a modest but characteristic
  example of Ada tooling landing in a place that helps the broader language
  ecosystem and not only the Ada community.
- **GNAT Studio 2026.2** shipped in early 2026, the current stable release
  of the traditional Ada IDE.

**Sources:** [IDE 25 Release Notes — AdaCore documentation](https://docs.adacore.com/live/wave/IDE-release-notes/html/IDE_release_notes/relnotes_25.html) · [GNAT Studio 2026.2 release announcement — Ada Forum](https://forum.ada-lang.io/t/gnat-studio-2026-2-just-released/4333)

### GNAT Pro 26 roadmap

The public GNAT Pro 26 roadmap (expected ship: late 2026) is essentially a
consolidation release focused on migrating the underlying compiler
infrastructure forward rather than adding headline features. The main
items:

- **GCC 14 migration** for the GCC-based compilers.
- **LLVM 19 migration** for the LLVM-based compilers.
- **Better debug information from GNAT LLVM**, closing a long-standing gap
  between the GCC and LLVM backends.
- **Light runtimes for native GNAT LLVM**, which matters because the
  "light" profile is what Ravenscar-style small embedded work runs on top
  of.
- **Xilinx ZynqMP ARM Cortex-R5** support, with light / light-tasking /
  embedded runtimes. This is the safety-oriented companion core in the
  ZynqMP family, and its getting a production-grade Ada runtime is the
  kind of platform addition that tends to quietly unlock industrial
  customers.
- **VxWorks 7** support in GNATcoll and Ada bindings (marked beta).
- **Mixed Ada/C++** bare-metal runtimes that can execute C++ global
  object initialization and destruction — a small item that removes a
  surprising source of friction on mixed-language bare-metal targets.
- **IDE refactorings** (subprogram body creation, expression extraction,
  entity removal) in both GNAT Studio and the VS Code extension.

Notably absent from the public GNAT Pro 26 roadmap: any next Ada language
revision. As of April 2026 there is no published schedule for an
"Ada 202X" successor to Ada 2022, and the community's public discussion on
the Ada forum suggests the WG9 committee is in a consolidation phase,
focused on errata, corrigenda, and adoption rather than a new revision.

**Source:** [AdaCore GNAT Pro 26 Roadmap — AdaCore documentation](https://docs.adacore.com/live/wave/roadmap/html/roadmap/roadmap_26_GNAT%20Pro.html)

### The Rust comparison, 2025 edition

The Ada vs. Rust conversation that began in earnest around 2020 has stopped
being a debate about which language is "safer" and has become a debate about
which language has the certification evidence to match its claims, in which
markets, on which timelines. Three observations from the 2025 literature:

1. **Certification evidence matters more than language properties in safety
   markets.** Ada and SPARK have qualification and certification evidence
   across DO-178 (avionics, up to DAL-A), ISO 26262 (automotive), EN 50128
   (railway), ECSS (space), and IEC 62304 (medical). The AdaCore toolchain's
   run-time libraries are certified up to DAL-A and its coverage and coding
   standard checkers are qualified at TQL-5. Rust is younger, and its
   ISO 26262 evidence as of 2025 is "limited to some environments and
   subsets of the toolchain." The gap is narrowing, but it is real, and in
   practice it is what decides which language a given safety project can
   actually use.
2. **The frameworks have converged on the same answer.** Practitioner
   writing from 2025 (EENews Europe, LavX, Elektor) consistently frames
   SPARK, Rust, and MISRA C/C++ as a gradient: Rust when memory safety
   dominates and ecosystem velocity matters, SPARK when you need the highest
   assurance and can afford to rethink workflows, MISRA C/C++ when
   institutional inertia or certification history demands it. Nobody
   serious is arguing any more that one of these replaces the others.
3. **Even the boundary is being blurred.** Small experimental projects
   have appeared (notably `IntuitionAmiga/rust2ada`, which describes itself
   as a "Rust to Ada/SPARK converter") that aim to extract Rust code into
   formally verifiable Ada. These are niche and unlikely to go mainstream,
   but they are a sign that the Ada and Rust communities are no longer
   strictly disjoint.

**Sources:** [The Trinity of Trust: Exploring Ada, SPARK, and Rust in Embedded Programming — EENews Europe](https://www.eenewseurope.com/en/exploring-ada-spark-rust-in-embedded-programming/) · [Should I choose Ada, SPARK, or Rust over C/C++? — AdaCore Blog](https://www.adacore.com/blog/should-i-choose-ada-spark-or-rust-over-c-c) · [Ada, Rust, and the Future of Safe Code — Elektor Magazine](https://www.elektormagazine.com/news/ada-rust-future-safe-code) · [rust2ada — IntuitionAmiga on GitHub](https://github.com/IntuitionAmiga/rust2ada)

### Updated timeline entries

**2025** (GNAT Pro 25): Rust's ecosystem hit another growth year, with
automotive pilots expanding and the `async` story stabilizing. Go 1.23 and
1.24 shipped. Python's packaging ecosystem settled further around `uv` and
`pyproject.toml`. Ada shipped GNAT Pro 25 with FreeRTOS and Linux Arm 64
as first-class targets, SPARK 25 tightened its handling of low-level code,
and AdaCore announced a joint Ada/SPARK reference process for automotive
ISO 26262 with NVIDIA. Ada's institutional presence in aerospace, defense,
space, and rail remained steady, and a meaningful automotive push began for
the first time.

**2026** (GNAT Studio 2026.2, GNAT Pro 26 in flight): The Ada Language
Server's Code Visualizer landed in VS Code, giving Ada users the first
modern code-graph tooling that matches what Rust and TypeScript users had
been taking for granted. GNAT Pro 26 is in flight with GCC 14, LLVM 19,
and Cortex-R5 support. No new Ada language revision is publicly scheduled;
the community is in a consolidation phase around Ada 2022 adoption.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) — Ada is a
  programming-language topic. The Programming Fundamentals and Algorithms &
  Efficiency wings are the closest fit; Ada's type system, generics, and
  contracts are concrete instances of the concepts those wings describe.
- [**engineering**](../../../.college/departments/engineering/DEPARTMENT.md) —
  Ada lives in the engineering world, not the scripting world. Its
  aerospace, railway, and automotive deployments are case studies for
  systems-engineering concepts.
- [**history**](../../../.college/departments/history/DEPARTMENT.md) — The
  Ada history is also a history of how governments specify software, how
  standards bodies work, and how communities survive institutional
  abandonment. The history-origins file is the entry point for that thread.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — SPARK's formal verification rests on mathematical logic (Hoare logic,
  separation logic, SMT solving). The safety-spark-impl file is the entry
  point for that thread.

---

*End of History & Origins document.*

*Document compiled for the PNW Research Series, tibsfox.com, April 2026. Cross-references to the companion Ada research threads covering core language, concurrency semantics, and safety-critical/SPARK/implementations can be found at the series index. Section XVI (Updates 2025–2026) and the College Departments cross-link were added during the Session 018 catalog enrichment pass.*
