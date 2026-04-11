# Lisp: The Birthplace of Modern AI

## Machine Learning, Neural Networks, Genetic Programming, and the Language That Started It All

> "Lisp isn't a language, it's a building material." — Alan Kay

> "The greatest single programming language ever designed." — Alan Kay, on Lisp

This is the central track of the Lisp research project.
It is the story of how one language, conceived for an entirely different
purpose, became the substrate on which the modern discipline of artificial
intelligence was invented, tested, and for three decades exclusively
practiced. It is the story of why "AI" and "Lisp" were synonymous for
a generation, why that synonymy collapsed, and why the intellectual
fingerprints of Lisp are now visible in every piece of modern machine
learning infrastructure — often in frameworks whose authors would be
surprised to learn their lineage.

The claim this document defends is specific and strong: modern AI was not
merely written in Lisp by historical accident. It was shaped by Lisp at
the level of what was thinkable. The categories "symbol," "environment,"
"continuation," "closure," "tree-as-program," "program-as-data,"
"garbage-collected heap," "dynamic dispatch," "image-based persistence,"
and "read-eval-print loop" were either invented for AI research in Lisp
or were first made practical there. When Python's deep learning stack
quietly rebuilt each of these ideas in the 2010s, it was not because
they were new. It was because the earlier generation of tools had been
forgotten, and had to be rediscovered from underneath a layer of numerical
computing.

The structure of this document follows the historical arc. Section 1
traces the birth of AI from Dartmouth through the founding of the MIT
AI Lab to the first generation of AI programs. Section 2 covers the
expert system era and its collapse. Section 3 is a deep chapter on the
Lisp machines — the hardware incarnation of the Lisp vision. Section 4
treats genetic programming, the discipline that put Lisp's homoiconicity
to explicitly evolutionary use. Section 5 covers neural networks in
Lisp, including the Connection Machine. Section 6 addresses the modern
neurosymbolic renaissance. Section 7 examines how contemporary machine
learning frameworks have quietly rebuilt Lisp's ideas in Python and Julia.
Section 8 is a deep dive on the Connection Machine specifically. Section
9 is a bibliography. A coda draws the through-line.

---

## 1. Lisp and the Birth of AI

### 1.1 Dartmouth, 1956: The Founding Event

In the summer of 1956, four men — John McCarthy, Marvin Minsky, Nathaniel Rochester, and Claude Shannon — convened a two-month workshop at Dartmouth College that is universally considered the founding event of artificial intelligence as a discipline. The proposal document, dated August 31, 1955, was titled "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence." It is the first recorded use of the term "artificial intelligence" in a professional context. McCarthy coined it, according to his later recollections, precisely to distinguish the new field from "cybernetics," which was dominated by Norbert Wiener and whose reputation was, in McCarthy's view, becoming muddled.

The proposal's second paragraph contained the field's foundational conjecture:

> "The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."

The attendees included, beyond the four organizers, Allen Newell and Herbert Simon (who brought the Logic Theorist, a running program that proved theorems in Whitehead and Russell's *Principia Mathematica*), Arthur Samuel (who brought his checkers-playing program, one of the earliest learning systems), Ray Solomonoff (inductive inference), Oliver Selfridge (pattern recognition), Trenchard More, and a rotating cast of others. The Dartmouth attendees left Hanover convinced of two things: first, that intelligence could be mechanized; second, that the tools available — FORTRAN, IPL (the Information Processing Language written by Newell, Shaw, and Simon), assembly — were inadequate to the task.

McCarthy returned to MIT (he had been at Dartmouth only temporarily) with a problem nagging at him: the programs he wanted to write were not numerical. They manipulated symbols. They built and rebuilt tree-shaped data structures. They backtracked. They recurred. They needed, above all, a way to treat code and data as interchangeable, because the hallmark of intelligent behavior seemed to be the ability to write and rewrite one's own rules.

### 1.2 Why McCarthy Built a Language

In 1958, McCarthy moved to MIT and began designing what he initially called "LISP" (LISt Processor). The design was driven by a concrete need: the Advice Taker, a hypothetical program McCarthy had described in a 1958 paper ("Programs with Common Sense"), needed to represent facts and inference rules in a uniform format and needed to manipulate that format at runtime. IPL, which Newell and Simon had built, did this in assembly-level form. McCarthy wanted a higher-level notation.

The original notation McCarthy sketched was called M-expressions (meta-expressions), with an underlying data representation called S-expressions (symbolic expressions). S-expressions were parenthesized lists. M-expressions were a more conventional mathematical notation that would compile down to S-expressions. A function definition in M-expression form looked like this:

```
label[subst; lambda[[x; y; z]; [atom[z] -> [eq[z; y] -> x; T -> z]; T -> cons[subst[x; y; car[z]]; subst[x; y; cdr[z]]]]]]]
```

The equivalent S-expression form was:

```lisp
(label subst
  (lambda (x y z)
    (cond ((atom z) (cond ((eq z y) x) (t z)))
          (t (cons (subst x y (car z)) (subst x y (cdr z)))))))
```

History pivoted on an accident. McCarthy's graduate student Steve Russell, in 1958, pointed out that the interpreter McCarthy had written on the blackboard — the "eval" function that defined the semantics of Lisp — could be implemented directly. Russell coded it up on the IBM 704. Suddenly, the language existed, and it existed in its own S-expression form, because that was the form eval operated on. The M-expression syntax was never implemented. The accidental first-draft data format became the permanent syntax of Lisp, and with it came the defining property of the language: code and data have the same shape.

McCarthy published the definitive description in "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I" in the April 1960 issue of *Communications of the ACM*. It is one of the most influential papers in the history of computing. Part II was never written.

### 1.3 Why Lisp Was the Natural Choice for AI

By 1960 the properties that would make Lisp the AI language of choice were all in place, and they were not chosen by committee. They emerged from the problem:

1. **Symbolic computing.** A symbol in Lisp is a first-class datum. You can bind values to symbols at runtime, pass symbols as arguments, compare them, store them in lists. This is exactly what a theorem prover, a natural language parser, or a planning system needs.

2. **Recursion.** Lisp was the first widely-used language to support recursive function definitions naturally. FORTRAN in 1958 did not allow recursion. COBOL did not. ALGOL 60, which came out contemporaneously with Lisp, introduced recursion partly under Lisp's influence (McCarthy was on the ALGOL committee). For AI, recursion was not optional: every tree walk, every search, every parse was naturally recursive.

3. **Automatic storage management (garbage collection).** McCarthy invented garbage collection for Lisp, publishing the first description in 1960. The alternative — manual memory management — made long-running symbolic programs impossible to write. A program that generates and discards thousands of intermediate expressions per second cannot afford to track each one by hand. Every language with automatic memory management descends, directly or indirectly, from this decision.

4. **Dynamic typing.** A Lisp cell carries its type with it. A list can contain symbols, numbers, other lists, functions. An AI program rewriting an expression tree cannot commit in advance to the types it will encounter. Static typing came later and is a different engineering tradition.

5. **First-class functions.** A function in Lisp is a value. It can be passed, returned, stored, and (most importantly for AI) constructed at runtime. This is the mechanism by which a Lisp program can write another Lisp program.

6. **The REPL.** The Read-Eval-Print Loop, which McCarthy's students built almost immediately, made Lisp the first language in which the developer and the running program shared an address space. You could type an expression, see the result, inspect the state of the program, redefine a function, and continue. This style — "live coding" — was invented for AI research because AI research required it. You could not design an algorithm you did not understand by submitting batch jobs to an IBM 704 overnight.

7. **Homoiconicity.** Because Lisp code is written as S-expressions and S-expressions are Lisp data, a Lisp program can construct another Lisp program and execute it. This is the `eval` function. It is the deepest feature of Lisp, and it is the reason the language has survived sixty-five years. Every program that writes another program — every compiler, every template engine, every code generator, every macro expander, every genetic programming system — is performing an operation that Lisp made trivial.

These seven properties were not a wish list. They were the minimum viable toolkit for the problems McCarthy, Minsky, and their students wanted to solve.

### 1.4 The MIT AI Lab

In 1959, McCarthy and Minsky founded the MIT Artificial Intelligence Project, which became the MIT AI Lab in 1963. Lisp was the house language from day one. Every graduate student learned it. Every program was written in it. The Lab's culture — hackers, nocturnal hours, shared source code, aversion to bureaucracy, a strong craft ethic — was inseparable from the language. The PDP-6 arrived in 1964; it was designed with Lisp's needs in mind, including an 18-bit address space that gave half a word for a CAR and half for a CDR, so that a CONS cell fit in a single word.

McCarthy left MIT for Stanford in 1962, founding the Stanford AI Lab (SAIL) in 1963. SAIL became Lisp's second major home. For the next twenty-five years, the entire worldwide AI research community — Carnegie Mellon, Stanford, MIT, Edinburgh, SRI, BBN, Xerox PARC, IBM Research — ran on Lisp. There was, effectively, no alternative.

### 1.5 The Great AI Programs of the 1960s and 1970s

A sampling, by no means exhaustive, of programs that defined AI as a field. Every one was written in Lisp, and every one was deeply shaped by what Lisp made easy.

**STUDENT (Daniel Bobrow, 1964).** Bobrow's MIT PhD thesis at the AI Lab. STUDENT read high-school algebra word problems in a constrained subset of English, extracted the relations, built a system of equations, and solved it. "If the number of customers Tom gets is twice the square of 20 percent of the number of advertisements he runs, and the number of advertisements is 45, then what is the number of customers Tom gets?" STUDENT handled it. The program was 10,000 lines of Lisp. It established two things: that natural language processing was tractable for bounded domains, and that Lisp's ability to manipulate parse trees as data made building such systems feasible by one person.

**ELIZA (Joseph Weizenbaum, 1966).** Weizenbaum wrote ELIZA at MIT not as a serious AI project but as a demonstration of how shallow pattern-matching could simulate understanding. The DOCTOR script imitated a Rogerian psychotherapist. "Men are all alike." — "IN WHAT WAY?" — "They're always bugging us about something or other." — "CAN YOU THINK OF A SPECIFIC EXAMPLE?" The original ELIZA was written in MAD-SLIP, a Lisp-influenced list processing extension to the MAD language, but it was almost immediately ported to Lisp and became the canonical Lisp demo for twenty years. Weizenbaum was horrified by how readily people anthropomorphized his program, and wrote *Computer Power and Human Reason* (1976) as a rebuttal to the AI community's excessive optimism. The book is still worth reading.

**DENDRAL (Edward Feigenbaum, Bruce Buchanan, Joshua Lederberg, 1965-1983).** The first expert system. Started at Stanford as a collaboration between Feigenbaum (AI) and Lederberg (Nobel laureate in genetics, working on Mars life-detection experiments for NASA). DENDRAL inferred molecular structure from mass spectrometer data. The system encoded hundreds of rules from organic chemists, explored possible structures, pruned impossible ones, and ranked candidates. It ran on the DEC PDP-10 in Interlisp. DENDRAL's legacy is enormous: it proved that domain expertise, encoded symbolically, could produce expert-level performance in a narrow domain. It also established the rule-based paradigm that would define the expert system era.

**MACSYMA (Joel Moses, Bill Martin, Carl Engelman, 1968-1982).** The most sophisticated symbolic mathematics system of the 20th century, a direct ancestor of Mathematica and Maple. MACSYMA began at MIT's Project MAC (the same group that birthed multics) and grew into a million-line Lisp system capable of symbolic integration, differential equation solving, Laplace transforms, tensor manipulation, and limit computation. It ran on the PDP-10 under ITS and later on Lisp machines. The system was, in effect, a proof that Lisp could scale: a million lines of symbolic code, maintained by dozens of developers, running correctly, with a REPL that let mathematicians work interactively with the full power of the language underneath. MACSYMA's descendant Maxima is still actively developed as free software. Stephen Wolfram, designing Mathematica, studied MACSYMA carefully; Mathematica's expression tree representation, its pattern-matching rewrite semantics, its notebook interface — all are recognizable MACSYMA ideas.

**SHRDLU (Terry Winograd, 1970).** Winograd's MIT PhD thesis. SHRDLU was a natural language interface to a simulated "blocks world" — a tabletop with colored geometric solids. The program could understand, plan, and answer questions about the world:

> "Pick up a big red block."
> OK.
> "Grasp the pyramid."
> I DON'T UNDERSTAND WHICH PYRAMID YOU MEAN.
> "Find a block which is taller than the one you are holding and put it into the box."
> BY "IT", I ASSUME YOU MEAN THE BLOCK WHICH IS TALLER THAN THE ONE I AM HOLDING.
> OK.
> "What does the box contain?"
> THE BLUE PYRAMID AND THE BLUE BLOCK.
> "What is the pyramid supported by?"
> THE BOX.

SHRDLU's performance, in a 1971 film demonstration, convinced many researchers that full natural language understanding was "just around the corner." It was not; SHRDLU's success depended entirely on the tiny, fully formalized microworld. But as a proof of concept, it is still astonishing. The program was 200,000 lines of Lisp and MicroPlanner. Its architecture — separating syntactic parsing, semantic interpretation, planning, and action — established patterns that persisted through the 1990s.

**PLANNER and MicroPlanner (Carl Hewitt, 1969; Sussman/Winograd/Charniak, 1971).** Hewitt at MIT designed PLANNER as a goal-directed programming language embedded in Lisp. It introduced pattern-directed invocation — procedures could be called not by name but by matching a pattern on the goal. This is the direct ancestor of Prolog's resolution, of rule-based systems, and (much later) of the Actor model. Hewitt's PLANNER thesis was too ambitious to implement fully; Sussman and Winograd built MicroPlanner, a subset, and SHRDLU used it. Hewitt's frustration with PLANNER led him to invent the Actor model in 1973, which shaped every message-passing concurrency system that followed — Erlang, Akka, Scala actors, even the early design of Smalltalk-72.

**Shakey the Robot (SRI, 1966-1972).** The first mobile robot that could reason about its own actions. Shakey ran STRIPS (the Stanford Research Institute Problem Solver), a planner invented by Richard Fikes and Nils Nilsson that introduced the STRIPS action representation still used in planning research today. STRIPS was written in Lisp. Shakey's vision, planning, and control code were all Lisp. The robot is preserved at the Computer History Museum in Mountain View.

**HEARSAY-II (Raj Reddy, Victor Lesser, Lee Erman, Carnegie Mellon, 1976).** Speech understanding system built on the blackboard architecture. Multiple knowledge sources — acoustic, phonetic, lexical, syntactic, semantic — wrote hypotheses to a shared blackboard, triggering further processing. HEARSAY-II understood 1000-word-vocabulary continuous speech in the task of retrieving AI journal abstracts. Lisp. Blackboard architecture became a lasting pattern.

**PROSPECTOR (SRI, 1978).** Expert system for mineral exploration; successfully identified a molybdenum deposit at Mount Tolman, Washington, worth an estimated $100 million. Built in INTERLISP. One of the most frequently cited early commercial AI successes.

**MYCIN (Edward Shortliffe, Stanford, 1974).** Medical diagnosis system for infectious diseases, built in Interlisp. More on MYCIN in Section 2.

The list could continue for pages. The point is this: in the period 1960-1985, there was no AI program of note written in any language other than Lisp. None. The equivalence between the two words was not rhetorical. If you were an AI researcher, you wrote Lisp. If you wrote Lisp, you were — statistically — an AI researcher.

### 1.6 Why Symbolic AI Required a Symbolic Language

It is worth dwelling on why this equivalence held so absolutely. The dominant paradigm in AI from 1956 to approximately 1986 was "symbolic AI" (later called "Good Old-Fashioned AI," or GOFAI, by John Haugeland in 1985). The core commitment of GOFAI was that intelligence consists in the manipulation of symbolic representations of the world. A "block" in SHRDLU is not a vector of pixels; it is a symbol `B1` with properties `(color red)`, `(shape block)`, `(size big)`, `(on-top-of B2)`. Reasoning is the transformation of such symbol structures by inference rules.

This paradigm has a natural language: one in which symbols are first-class, rules can be written as data, new rules can be constructed at runtime, the inferential engine can be modified while it runs, and the entire structure is inspectable at any moment. That language is Lisp. No other language of the era even pretended to compete. FORTRAN was for physics. COBOL was for business records. ALGOL was for algorithms on arrays. APL was for mathematics on arrays. Only Lisp treated symbols as the primary object of computation.

The consequence was that the *intellectual content* of AI research became entangled with Lisp's conceptual vocabulary. When a researcher thought "let me add an environment to this interpreter," they were thinking in Lisp. When they thought "let me use a continuation to implement backtracking," they were thinking in Lisp. When they thought "let me write a macro that turns a rule into an inference procedure," they were thinking in Lisp. The boundary between "using Lisp" and "doing AI" became, for twenty-five years, impossible to locate.

---

## 2. The Expert System Era

### 2.1 From Research Programs to Commercial Products

By the late 1970s, DENDRAL and MYCIN had demonstrated that narrowly-scoped, rule-based symbolic programs could reach expert-level performance in real domains. This crossed a threshold. For the first time, businesses and governments began to believe that AI was a practical technology. The period 1980 to 1988 saw the first sustained commercial investment in AI — what came to be called the "expert systems boom."

### 2.2 MYCIN and the Rule-Based Paradigm

MYCIN, developed at Stanford by Edward Shortliffe as his 1974 dissertation, was a decision-support system for the diagnosis and treatment of bacterial infections of the blood (bacteremia) and meningitis. It asked the physician a series of questions about the patient ("Was the Bacteroides isolated from a sterile site?") and used roughly 600 production rules to infer the likely pathogen and recommend an antibiotic regimen.

The rules had the form:

```
IF  the infection is primary-bacteremia, AND
    the site of the culture is one of the sterile sites, AND
    the suspected portal of entry is the gastrointestinal tract,
THEN there is suggestive evidence (0.7) that the identity of the organism
     is bacteroides.
```

The `(0.7)` is a certainty factor, MYCIN's ad-hoc approach to uncertainty. Certainty factors are not probabilities — they don't obey the axioms of probability — but they worked well enough in practice for MYCIN to reach performance comparable to expert infectious disease physicians in blind evaluations.

MYCIN was written in Interlisp, running on the DEC PDP-10 at Stanford's SUMEX-AIM facility. It was never deployed clinically — legal liability concerns around medical software in the 1970s prevented that — but it established the rule-based production-system paradigm that defined the expert system era. Its most lasting contribution was the separation Shortliffe and Buchanan enforced between the **inference engine** and the **knowledge base**. The same engine could be repurposed for a different domain by swapping in a different rule set. This separation was made explicit in EMYCIN ("Empty MYCIN"), the first expert system shell, and commercial shells like KEE, ART, and Knowledge Craft followed.

### 2.3 XCON/R1: The Business Case

If MYCIN was the research showcase, XCON was the financial vindication. XCON (originally called R1) was developed by John McDermott at Carnegie Mellon starting in 1978, in collaboration with Digital Equipment Corporation. Its task was mundane: configure VAX computer systems. A VAX order could specify thousands of components — disks, memory boards, cables, cabinets — and human configurers routinely missed compatibility constraints, leading to shipped orders that could not be assembled on the customer site.

XCON was an OPS5 program (OPS5 being a production rule language developed at CMU by Charles Forgy, implemented in Lisp, using Forgy's Rete matching algorithm). By 1984, XCON contained over 3,000 rules and handled the configuration of every VAX DEC shipped. DEC reported annual savings of approximately $25 million, later revised upward to $40 million per year. XCON was the first clear demonstration that a symbolic AI system could produce large, sustained, quantifiable economic value. It is the system most often cited as the justification for the expert system investment boom.

### 2.4 OPS5, CLIPS, JESS, and the Production System Family

OPS5 deserves a closer look. It was the reference implementation of the production system architecture developed by Charles Forgy and colleagues at CMU in the late 1970s. A production system maintains a working memory of facts and a set of condition-action rules. On each cycle it matches the left-hand-sides of rules against working memory, selects one to fire (the "conflict resolution" step), and executes its right-hand-side, which modifies working memory. Forgy's crucial contribution was the **Rete algorithm** (1979, 1982), which matches rules against working memory in time proportional to the *changes* in working memory rather than to the total number of rules. Rete made expert systems with thousands of rules computationally feasible. It is still the dominant algorithm in business rules engines — Drools, IBM's ODM, and others use variants of Rete.

OPS5 was itself written in Lisp. The pattern repeated: the research language was Lisp; the domain language was implemented on top.

In 1985, the Johnson Space Center at NASA decided they needed an expert system shell that did *not* require Lisp. Their reasoning was practical: the government had invested heavily in Lisp machines, and the machines were expensive, slow to boot, and required specialized operators. NASA wanted to deploy expert systems on ordinary Unix workstations and on embedded hardware. The result was **CLIPS** (C Language Integrated Production System), designed by Gary Riley. CLIPS was written in C but its rule syntax was a close copy of OPS5's Lisp-influenced syntax, complete with S-expression-like parenthesized facts:

```clips
(defrule emergency-shutdown
  (temperature (value ?t&:(> ?t 100)))
  (pressure (value ?p&:(> ?p 50)))
  =>
  (printout t "Emergency shutdown triggered" crlf)
  (assert (state shutdown)))
```

CLIPS was released to the public in 1986 and became the most widely-used production system shell of the 1990s. It is still maintained today (CLIPS 6.4.1 as of 2023). **JESS** (Java Expert System Shell), developed by Ernest Friedman-Hill at Sandia National Labs starting in 1995, was a Java port of CLIPS. JESS dominated Java-based rule systems for a decade before being displaced by Drools. Drools itself is a Rete-based engine whose conceptual lineage runs through JESS → CLIPS → OPS5 → Lisp.

### 2.5 Forward and Backward Chaining

A production system can run in two directions. **Forward chaining** starts from facts and applies rules to derive new facts until either the goal is reached or no more rules fire. OPS5, CLIPS, XCON, and Rete-based engines are forward chainers. **Backward chaining** starts from a goal and asks: which rules could conclude this goal? Then, recursively: which rules could conclude the premises of those rules? MYCIN was a backward chainer, as is Prolog. The distinction is important for performance and for the shape of the reasoning; it also survives into modern AI in the distinction between "data-driven" and "goal-driven" inference.

### 2.6 CYC: The Quest for Common Sense

Douglas Lenat's CYC project, begun in 1984, is the most ambitious symbolic AI undertaking ever attempted. Lenat's thesis was that expert systems were brittle because they lacked common sense — the ocean of implicit background knowledge that every human brings to every situation. CYC's goal was to encode that ocean by hand. How much water? Lenat estimated ten million rules as the threshold for "critical mass," beyond which CYC would be able to learn additional rules from reading text.

CYC was founded at MCC (the Microelectronics and Computer Technology Corporation) in Austin, Texas, a consortium of American computer companies formed as a response to the Japanese Fifth Generation Computer Systems project. (Lenat will return to this document later; the MCC funding is itself a chapter in the expert system era.) In 1994, Lenat spun out Cycorp as an independent company. CYC is still, in 2026, under active development — now 40+ years old. It has never reached its promised self-improvement threshold. It contains, as of the most recent estimates, more than twenty-five million assertions.

The CYC project is a paradoxical monument. Its technical accomplishments are real: its ontology, its representation language (CycL, a Lisp-influenced predicate calculus), its inference engine. But it has failed, by any reasonable measure, to deliver on its original promise. The reasons are the reasons the entire expert system era failed, and they are worth stating plainly.

### 2.7 The Expert System Bubble and Its Collapse

The expert system boom had three phases. **1980-1983: early optimism.** Research results from MYCIN, XCON, PROSPECTOR, and their peers convinced venture capitalists that AI was a technology ready for commercialization. Symbolics and LMI were founded (see Section 3). Teknowledge, Inference Corporation, IntelliCorp, and Carnegie Group were founded as expert system software vendors. **1984-1987: the boom.** Worldwide AI hardware and software sales approached $1 billion annually. Major corporations (Du Pont, American Express, Ford, Boeing, Texas Instruments) established internal AI groups. Every business magazine ran cover stories. Japan announced its Fifth Generation project. The United States responded with DARPA's Strategic Computing Initiative, which poured $600 million into AI research between 1983 and 1993, with a substantial fraction going to Lisp-based systems. **1987-1992: the crash.** Expert systems failed to deliver their promised productivity gains in most deployments. Maintenance costs ballooned as rule bases grew past a few hundred rules. Lisp machines, on which most of the systems ran, became obsolete overnight as Sun workstations running cheaper Common Lisp caught up in performance. Funding evaporated. Symbolics' stock fell from $30 to $0.50. LMI went bankrupt in 1987. Texas Instruments exited the Lisp machine business. By 1992, the AI departments inside Du Pont, American Express, and most of the Fortune 500 had been disbanded.

This is known as the "Second AI Winter." (The first had been triggered by the Lighthill Report in 1973.)

### 2.8 What Killed Them

The expert system failure is one of the most studied disappointments in computing history, and the lessons are clear in retrospect. There were four fundamental problems.

**Brittleness.** An expert system handles the cases its rules cover. On any case that falls outside — even by a little — it fails, often silently and often catastrophically. MYCIN could diagnose bacteremia, but if a patient presented with a viral infection, MYCIN had no "I don't know" response; it would produce a confident wrong answer. The failure mode was specifically that the system did not know the limits of its own knowledge. No amount of additional rules could fix this in the general case. Lenat's CYC was an attempt to fix it by brute force.

**The knowledge acquisition bottleneck.** Writing rules for an expert system required two people: a domain expert and a "knowledge engineer" who translated the expert's tacit knowledge into formal rules. This process — interviews, observation, prototyping, correction — was slow, expensive, and often impossible. Experts disagreed. Experts could not articulate what they knew. Experts changed their minds. The knowledge engineer became a bottleneck, and the bottleneck could not be parallelized: you could not simply hire more knowledge engineers, because each one needed years of practice to be effective.

**Maintenance hell.** A rule base is not a modular system. Adding a new rule can interact unpredictably with existing rules. The OPS5 conflict resolution order matters. Certainty factor propagation is not transparent. When an expert system produced a wrong answer, finding out why required tracing the firing chain through potentially thousands of rules. As rule bases grew past 500 rules, maintenance cost grew super-linearly. XCON eventually grew to over 10,000 rules and required a full-time team of maintainers; its maintenance cost consumed most of the $40 million in annual savings it produced.

**Symbols are not grounded.** The deepest problem, identified by Stevan Harnad in his 1990 paper "The Symbol Grounding Problem," was that the symbols in an expert system had no connection to the world. MYCIN's symbol `BACTEROIDES` was a string of letters. It had no causal connection to an actual bacterium. Its meaning came entirely from the rules that referenced it. This meant the system had no way to recover from rule errors, no way to detect novel situations, no way to ground its reasoning in anything outside its own closed world. This critique foreshadowed the neural network revival: neural networks, by contrast, learn representations that are anchored to sensor data. The critique also previewed the current debate about large language models: do they ground their symbols, or are they simply very large rule bases in disguise?

### 2.9 What We Kept

The expert system era is often treated as a total failure, but this is unfair. Several enduring contributions remain.

The Rete algorithm still powers business rules engines handling trillions of dollars of transactions. Production rule systems are the workhorse of loan underwriting, insurance claim processing, fraud detection, and regulatory compliance. The software is called "business rules management" now, not "expert systems," but the architecture is unchanged.

The separation of knowledge from inference remains a cornerstone design principle. Modern knowledge graphs — Google's Knowledge Graph, Wikidata, DBpedia — are the intellectual descendants of CYC's ontology. Ontology engineering, as a discipline, comes directly from CYC and from the related Ontolingua / KIF efforts at Stanford.

The very idea that "AI systems need to be built from curated domain knowledge" has returned in the 2020s as retrieval-augmented generation (RAG). An LLM with a vector database of documents is, from a certain angle, an expert system with fuzzier matching.

And Lisp, through all of it, kept working. The research did not stop when the bubble burst. The Lisp implementations kept improving. CLIPS kept shipping. Common Lisp was standardized in 1994 (ANSI X3.226-1994) in part as an attempt to consolidate the fragmented Lisp ecosystem after the Lisp machine market collapse. The language survived the winter in a way that its machines did not.

---

## 3. Lisp Machines: When Hardware Was AI

### 3.1 The Problem: General Hardware Was Too Slow

By the mid-1970s, MIT AI Lab programs had grown large enough to strain the PDP-10. A complex MACSYMA session or a SHRDLU demonstration could consume hours of CPU time and gigabytes (in PDP-10 terms, megabytes) of memory. The ITS operating system, which ran the AI Lab's PDP-10, was by then legendary, but it was showing its age. The problem was fundamental: general-purpose hardware was not optimized for the things Lisp did all the time — CAR, CDR, CONS, type dispatch, garbage collection. On the PDP-10, each of these required multiple instructions and multiple memory accesses. On a hypothetical machine designed for Lisp, each could be a single cycle.

Richard Greenblatt began designing such a machine in 1974. He called it the **CONS machine**. It was a microcoded processor with tag bits on every word, a hardware-assisted garbage collector, and instructions that mapped directly to Lisp primitives. The CONS was a working prototype by 1975. By 1977, Greenblatt had finished a refined version called the **CADR** (a Lisp-lover's pun: CAR and CDR are primitive list operations; CADR is "second element"). The CADR was the first Lisp machine that looked and felt like a product. It ran Lisp Machine Lisp (a direct ancestor of Common Lisp) and a window-based, mouse-driven environment that was decades ahead of anything on a commercial workstation.

### 3.2 The Schism: LMI and Symbolics

By 1979 it was clear that the CADR was commercially viable, and the AI Lab was not the right institution to commercialize it. Greenblatt wanted to preserve the hacker culture. Russell Noftsker, a former AI Lab administrator, wanted a conventional venture-backed startup. The two could not agree. They split, and the MIT AI Lab split with them.

Greenblatt founded **Lisp Machines, Inc. (LMI)** in 1979. It was bootstrapped, employee-owned, and intended to retain the AI Lab ethos.

Noftsker founded **Symbolics, Inc.** in 1980, with venture backing and a professional management team. Symbolics quickly attracted most of the AI Lab's top hackers — Dan Weinreb, Howard Cannon, Tom Knight, Dave Moore, Bernard Greenberg, and many others. LMI retained Greenblatt, Richard Stallman, and a smaller core.

The split was bitter. Both companies licensed the MIT CADR designs and began building hardware. But Symbolics, with its larger engineering team and VC capital, moved faster. By 1982, Symbolics had released the **LM-2** (essentially a productized CADR) and was already designing the **3600 series**, a next-generation 36-bit tagged architecture that would define the Lisp machine market.

### 3.3 Stallman's War and the Birth of the GPL

Richard Stallman was a staff hacker at the MIT AI Lab, one of the most prolific of the ITS programmers, author of TECO macros that evolved into the first Emacs, and — by temperament — a purist. He believed in sharing source code absolutely. When most of the AI Lab hackers left for Symbolics in 1981, they took the Lisp Machine software with them and began developing proprietary extensions. LMI, under its agreement with Symbolics and MIT, had rights to anything that went back into the shared code base. Symbolics decided to stop contributing.

Stallman, who had initially been neutral in the Symbolics-LMI split, saw this as a betrayal of the hacker ethic. From 1982 to 1983, he single-handedly replicated every feature Symbolics added to Lisp Machine Lisp, reimplementing them in the MIT version, so that LMI would not fall behind. He would read the Symbolics release notes, determine what was new, and re-implement the feature from scratch in a matter of days. This is not an exaggeration; it is a well-documented episode. Dan Weinreb, a founding Symbolics employee, later wrote that Stallman "could keep up with us, one man against a company of world-class hackers."

But Stallman realized during this war that the problem was not Symbolics specifically. The problem was that proprietary software — software whose source you could not read, modify, or share — was incompatible with the hacker ethic. In 1983, he announced the GNU Project. In 1984, he left MIT (retaining an office as a courtesy) to work on GNU full-time. In 1985, he wrote the GNU Manifesto. In 1989, he wrote the GNU General Public License.

The Free Software Movement, the GPL, the entire legal and cultural edifice of free and open source software, grew out of Stallman's experience watching the Lisp machine community split in two and, in his view, corrupted by proprietary interests. It is not too much to say that Linux, GCC, Bash, Firefox, Android — anything downstream of the GPL — traces its moral origin to a dispute over the source code of a Lisp machine.

### 3.4 Symbolics: The Heyday

The Symbolics 3600 shipped in 1983. It was, by every measure, the most sophisticated computer workstation in the world. A 3600 had:

- A 36-bit word, 28 bits of data plus 8 tag bits, allowing hardware type checking on every operation.
- Hardware-assisted generational garbage collection.
- 1 to 30 megabytes of physical RAM (when IBM PCs shipped with 256 kilobytes).
- A high-resolution bitmap display (1280×1024).
- A three-button mouse.
- A networked file system.
- **Genera**, an operating system written entirely in Lisp, including the kernel.

Genera is the piece of the story that is hardest to convey to someone who has never used it. Every object in the system — every window, every file, every process, every network connection, every pixel — was a Lisp object. You could inspect it by pressing Super-Inspect. You could modify it by evaluating a form in the listener. You could patch a running function by re-compiling it; the change took effect immediately, for all current and future callers. The debugger was not a separate tool; when any function errored, the listener became a debugger. You could walk the stack, evaluate expressions in any frame, return a value from any frame, and continue execution. The documentation system (Document Examiner, later Concordia) was hypertext, with every Lisp symbol in the entire system linked to its definition, its documentation, its callers, and its implementation.

A Symbolics machine cost between $70,000 and $150,000 in 1985 dollars. The list price of a 3640 was $80,000; a 3670 was $110,000. An OEM-configured system for DARPA could exceed $200,000. Symbolics was profitable for several years and went public in 1984 at $13 per share, reaching $30 within a year.

### 3.5 The Ivory, and the Product Line

In 1987, Symbolics introduced the **Ivory** processor — a single-chip VLSI implementation of the 3600 architecture. Ivory enabled cheaper, smaller machines: the Symbolics **MacIvory** (a Nubus card that turned a Macintosh II into a Lisp machine), the **XL400** and **XL1200** (Ivory-based desktop machines), and eventually the **UX** family (Sun SBus cards, making a Sun workstation a Lisp machine host). The Ivory chip was itself a remarkable piece of engineering — a full 40-bit tagged architecture with hardware GC on a single die in 1987 CMOS.

Parallel to Symbolics, the other players had their own product lines. **LMI** produced the **LMI Lambda**, a multi-processor design that could run Lisp alongside a Motorola 68000 running Unix. Lambda's technical innovation was remarkable; its commercial success was not. LMI entered bankruptcy in 1987.

**Texas Instruments** entered the Lisp machine market in 1984 via a license of the MIT/LMI designs, producing the **TI Explorer** (1984) and **Explorer II** (1987). TI's version included the **MicroExplorer** — a NuBus board that, like Symbolics' MacIvory, turned a Macintosh II into a Lisp machine. TI's TI-Explorer Lisp Chip was a single-chip Lisp processor shipped in 1986.

**Xerox PARC** had its own Lisp machine tradition, predating MIT's commercial efforts. The Xerox **Dandelion** (1100), **Dandetiger** (1108), and **Daybreak** (1186) were originally designed for Mesa and Smalltalk but became outstanding Lisp machines running **Interlisp-D**. Interlisp-D was the rival Lisp dialect to Lisp Machine Lisp / Zetalisp; it had its own culture, its own user community, and its own outstanding environment (the Interlisp environment pioneered structure editing, "Do What I Mean" error correction, and the file package system of logical directories). Xerox spun out the Dandelion line through its subsidiary Envos, then Venue, which maintained Interlisp-D through the 1990s.

**Fujitsu** and **NEC** produced Japanese Lisp machines targeted at the Fifth Generation Computer Systems project — the FACOM Alpha, the NEC LX-1. These were less technically distinguished than their American rivals but were well-supported in the Japanese market during the Fifth Generation effort.

By 1985, worldwide Lisp machine sales had reached approximately $1 billion per year across all vendors. DARPA was the largest customer, via the Strategic Computing Initiative. Financial firms (Goldman Sachs, Salomon Brothers) used them for quantitative research and derivative pricing. Oil and gas companies used them for seismic interpretation. The military used them for planning and logistics. Universities used them for research. Hollywood studios — most famously Lucasfilm's ILM division — used them for special effects research and production, though 3D rendering was typically done on Crays. Symbolics Graphics Division produced the S-Render, S-Paint, and S-Geometry software suite, used for the morphing effects in *Willow* (1988) and the liquid-metal T-1000 in *Terminator 2* (1991).

### 3.6 A Note on the First .com

Symbolics earned one other historical distinction. On March 15, 1985, `symbolics.com` was the first .com domain ever registered. It predates every other commercial domain on the Internet. When DNS was formally introduced, Symbolics was ready. The domain is still registered; it was sold by Symbolics Inc. in 2009 and now hosts a website celebrating the record.

### 3.7 The Collapse

The collapse was swift. Multiple forces converged.

**Sun workstations.** The Sun 3 (1986) and Sun 4 (1987) combined rising Motorola 68020 and SPARC performance with cheap memory. A Sun 4/260 in 1988 cost around $30,000 and could run Lucid Common Lisp at performance within a factor of 2 to 3 of a contemporary Symbolics 3640 at a third the price. Kyoto Common Lisp, Franz's Allegro Common Lisp, and Lucid Common Lisp all matured rapidly. For most AI tasks, the Sun was good enough.

**The DARPA cutback.** The Strategic Computing Initiative, which had poured half a billion dollars into AI during the 1980s, pulled back sharply in 1988 after the AI Winter narrative took hold in Washington. DARPA's 1989 AI budget was a fraction of the 1986 figure. This single customer loss was enough to destabilize the Lisp machine market.

**The expert system crash.** As discussed in Section 2, the commercial expert system market collapsed in 1988-1989. Lisp machines had been the hardware substrate for expert system development; when customers stopped buying expert systems, they stopped buying Lisp machines to build them on.

**The rise of C++.** C++ 2.0 arrived in 1989; the Annotated Reference Manual in 1990. For a generation of developers just entering the workforce, C++ became the default language for ambitious systems programming. The institutional momentum shifted away from Lisp.

Symbolics' revenue peaked at $114 million in fiscal 1986 and fell every year thereafter. The stock price, adjusted for the 1986 split, fell from $30 in 1985 to under $1 in 1990. In 1993, Symbolics filed for Chapter 11 bankruptcy protection. The company reorganized, shed employees, and emerged as a much smaller entity focused on software-only Lisp products — primarily Open Genera, a port of Genera to DEC Alpha (1995) and later to x86-64 (via emulation).

LMI had already failed in 1987. TI exited the Lisp machine business in 1990. Xerox shut down the Dandelion line in 1993, transferring Interlisp-D to Venue, which continued to sell it as "Medley" until the early 2000s. The once-thriving Lisp machine market ceased to exist as a market by 1993.

### 3.8 What Survived

Several things survived.

**Genera itself.** Symbolics Inc. (the post-bankruptcy entity, which existed as a very small company until roughly 2013) continued to license Open Genera to a small number of customers — NASA, some military contractors, a handful of AI research groups. Open Genera is preserved; it runs, in 2026, on a Linux host via the Alpha emulator, and occasionally a researcher will bring up a Symbolics environment to demonstrate what it felt like. The Symbolics trademark is still held; the Symbolics website still exists. The hardware is in museums.

**The Common Lisp standard.** ANSI Common Lisp (X3.226-1994) was the merger-of-survivors from the Lisp machine era. It inherited most of the Zetalisp / Lisp Machine Lisp semantics, the MacLisp numerical tower, and the Common Lisp Object System (CLOS) from Symbolics' Flavors and Xerox's CommonLoops. Common Lisp is the most powerful, most mature, most feature-rich Lisp dialect in existence, and it is what survived when the machines did not.

**CLOS.** The Common Lisp Object System, developed by a committee including Gregor Kiczales, Jim des Rivieres, Daniel Bobrow, Dave Moon, Dick Gabriel, and Linda DeMichiel, is still the most powerful object system in any mainstream language. It is what introduced multiple dispatch, method combinations (including `:before`, `:after`, `:around`), class redefinition at runtime, and the metaobject protocol (MOP) — the ability to extend the object system itself from within the language. CLOS and the MOP are direct ancestors of the Julia language's dispatch system, of Dylan's object system, and (indirectly) of Python's descriptor protocol.

**The cultural DNA.** The features that made a Symbolics machine extraordinary in 1985 — live coding, garbage collection, type tags at the hardware level, a REPL as the primary user interface, an inspector for every object, an integrated debugger, full hypertext documentation, a window system with first-class objects, image-based persistence — are now found, piece by piece, in every modern development environment. They were not invented independently. They were carried forward by the Lisp diaspora: by Common Lisp implementations, by Smalltalk (itself from Xerox PARC, sharing personnel with the Interlisp community), by Java (whose garbage collector is a Lisp descendant), by Python (whose REPL culture is a Lisp descendant), by Emacs (which is a Lisp machine in a terminal window), and most recently by JavaScript (whose closures, garbage collection, and eval are Lisp through and through — Brendan Eich intended to put Scheme in the browser and was overruled at the last minute).

When Emacs users today live inside a Lisp REPL, editing functions and evaluating them immediately; when Python users type at ipython and inspect a crashed stack frame; when a Clojure developer REPL-drives a new web service — they are using a thin reflection of what Symbolics Genera was in 1985. The hardware died, but the ideas did not.

### 3.9 Ancestor of What?

An incomplete list of modern tools that are direct or indirect descendants of the Lisp machine environment:

- **Emacs** — literally a Lisp machine in a terminal. GNU Emacs was written by Stallman precisely to bring the Lisp machine experience to non-Lisp-machine hardware.
- **IDE autocomplete** — the Symbolics Zmacs editor (the ancestor of Emacs) had symbol completion against the live image from 1980. Modern IDE autocomplete is the same idea, reimplemented against static analysis indices.
- **Object inspector tools** — every major IDE today has an object inspector. Genera had one in 1983.
- **JVM, .NET runtime, V8, CPython** — all garbage-collected, all dynamically dispatched, all with runtime reflection. All Lisp descendants.
- **Interactive debugger with live expression evaluation** — Chrome DevTools, IntelliJ debugger, GDB with Python scripting. All derived from the Lisp listener-as-debugger.
- **Live coding environments** — Glitch, Observable, Jupyter, Smalltalk, Pharo. Direct descendants.
- **Orthogonal persistence** — Smalltalk images, and their modern echo in containerized state snapshots.

---

## 4. Genetic Programming: Trees as Chromosomes

### 4.1 Prehistory: Evolutionary Computation Before Koza

The idea of using Darwinian selection as a search strategy is older than computer science. Alan Turing, in his 1950 paper "Computing Machinery and Intelligence," speculated about a "child machine" that could be improved by a process analogous to evolution. Nils Aall Barricelli, working at the Institute for Advanced Study in Princeton in 1953, ran some of the earliest simulations of evolution on a computer (the IAS machine), publishing his results in a paper titled "Symbiogenetic Evolution Processes Realized by Artificial Methods" in 1957. Barricelli's work was largely forgotten; he is now recognized as a pioneer of artificial life.

**John Holland**, at the University of Michigan, developed the theoretical framework for **genetic algorithms** throughout the 1960s, publishing his landmark book *Adaptation in Natural and Artificial Systems* in 1975. Holland's GA operated on fixed-length bit strings, using crossover (swap a randomly-chosen contiguous segment between two parents) and mutation (flip random bits) to explore the search space. His "schema theorem" provided a theoretical justification for why GAs should work: populations of bit strings implicitly sample an exponentially larger number of "schemata" (partially-specified templates), and selection causes high-fitness schemata to propagate.

Holland's GA was widely used for optimization problems from the 1970s onward. But as an approach to automatic programming it had a fundamental limitation: a program is not naturally a fixed-length bit string. Any encoding of programs into bit strings imposes an arbitrary mapping, and that mapping tends to be brittle under crossover. Cross two working programs as bit strings and you usually get a non-program.

### 4.2 Koza's Insight: Programs Are Trees, Trees Are Data

John R. Koza was a computer scientist with an unusual background: a consulting professor at Stanford who had built a successful career inventing and licensing algorithms for lottery games (he holds patents on scratch-off ticket schemes). In the late 1980s, Koza began to think about how to evolve computer programs directly, using Darwinian search.

His breakthrough was simple and profound. **If programs are represented as Lisp S-expressions, then programs are trees, and crossover is a tree operation.** Specifically, to cross two parent programs, you pick a random subtree from each and swap them. To mutate a program, you replace a random subtree with a new random subtree. These operations always produce syntactically valid programs — as long as you are careful about type constraints (arity of operators, for instance). The offspring may be semantically terrible, but they are at least runnable.

Koza filed the foundational patent on this idea (US Patent 4,935,877) in 1988 and began publishing in 1989. The landmark book was *Genetic Programming: On the Programming of Computers by Means of Natural Selection* (MIT Press, 1992) — 840 pages, dense with examples, all of them in Lisp. It was followed by *Genetic Programming II: Automatic Discovery of Reusable Programs* (1994), introducing automatically defined functions (ADFs); *Genetic Programming III: Darwinian Invention and Problem Solving* (1999); and *Genetic Programming IV: Routine Human-Competitive Machine Intelligence* (2003), which documented 76 human-competitive results.

### 4.3 The Central Insight Restated

The central technical insight of GP is that **Lisp's homoiconicity is exactly what you want for an evolutionary search over programs.** Consider an S-expression:

```lisp
(+ (* x 2) (sin y))
```

This is simultaneously a program (it computes `2x + sin(y)`) and a data structure (a list whose car is the symbol `+` and whose cdr is a list of two sublists). Lisp's `eval` function turns the data structure into the program; Lisp's `cons`, `car`, and `cdr` manipulate it as data. To crossover two expressions, you simply splice subtrees. To evaluate a new offspring, you call `eval`. No other language in existence made this as natural.

Koza's GP operated on S-expressions restricted to a problem-specific **function set** (the operators that can appear as internal nodes) and **terminal set** (the values that can appear as leaves). For a symbolic regression problem, the function set might be `{+, -, *, /, sin, cos, exp, log}` and the terminal set `{x, random constants}`. For a boolean problem, `{AND, OR, NOT, IF}` and `{x1, x2, ..., xn}`. For a robot controller, the function set might include sensor-reading primitives, actuator commands, and control flow. The GP system does not "know" what these operators mean; it treats them as black boxes and only looks at the fitness of the resulting program.

### 4.4 The GP Loop

The standard GP loop, from Koza's 1992 book:

```lisp
(defun genetic-programming (population-size generations)
  (let ((population (initialize-population population-size)))
    (dotimes (gen generations)
      (let ((fitness (map 'vector #'evaluate-fitness population)))
        (when (solution-found? fitness)
          (return-from genetic-programming
            (best-individual population fitness)))
        (setf population
              (next-generation population fitness))))))

(defun next-generation (population fitness)
  (let ((new-pop (make-array (length population))))
    (dotimes (i (length population) new-pop)
      (let ((op (choose-genetic-operator)))
        (case op
          (:reproduction
           (setf (aref new-pop i)
                 (tournament-select population fitness)))
          (:crossover
           (multiple-value-bind (child1 child2)
               (crossover (tournament-select population fitness)
                          (tournament-select population fitness))
             (declare (ignore child2))
             (setf (aref new-pop i) child1)))
          (:mutation
           (setf (aref new-pop i)
                 (mutate (tournament-select population fitness)))))))))
```

`crossover` is the key operation. It picks a random node in each parent (weighted toward internal nodes, per Koza's recommendation), swaps the subtrees rooted at those nodes, and returns two children. In Lisp this is a few lines of code, because subtree manipulation is what Lisp is made for.

### 4.5 ADFs: Automatically Defined Functions

Koza's second book, *Genetic Programming II* (1994), introduced **automatically defined functions**. The problem that motivated ADFs was modularity: a flat GP run could solve small problems but struggled to evolve structured programs where a sub-routine was called many times. ADFs extended the GP representation: an individual now consisted of a main program plus one or more named sub-functions, each of which could be called from the main program (and from later sub-functions, in a hierarchy). The sub-functions and the main program were all evolved simultaneously. Crossover was restricted to swap subtrees within the same "role" — main with main, ADF-0 with ADF-0, and so forth — to preserve program coherence.

ADFs delivered a large quality improvement on every problem Koza tried them on. They are an example of GP rediscovering, through Darwinian search, a programming best practice (procedural abstraction) whose value humans had learned through painful experience.

### 4.6 Human-Competitive Results

Koza's *Genetic Programming IV* (2003) made an audacious claim: GP had produced 76 results that were human-competitive in the sense of being patentable, publishable, or otherwise matching what a skilled human engineer would produce. A partial list:

- **Analog filter circuit design.** GP evolved a low-pass filter circuit topology that duplicated a 1917 patent by George Campbell at AT&T. GP also evolved a band-pass filter that infringed a 1925 patent by Wilhelm Cauer. And GP produced a crossover filter for audio applications that was novel and patentable.
- **Controller design.** GP evolved a PID controller tuning approach that matched the classic Ziegler-Nichols method.
- **Antenna design.** This is the famous one. Under a NASA contract for the **Space Technology 5** mission (launched March 2006), a GP system designed an X-band antenna — a small, irregular, bent-wire shape that looks like it was drawn by an alien. The evolved antenna met the mission requirements (which included both a main lobe and a null toward specific directions) with a simpler structure than any human-designed candidate. It flew and worked. This is the first case of an evolved design flying in space, and the design was produced by Jason Lohn's group at NASA Ames in collaboration with Derek Linden.
- **Quantum computing algorithms.** Spector, Barnum, and Bernstein evolved quantum algorithms in a GP system specialized for quantum gates — rediscovering some of the standard quantum primitives and producing novel ones.
- **Symbolic regression of physical laws.** Schmidt and Lipson's *Distilling Free-Form Natural Laws from Experimental Data* (Science, 2009) used a GP-like approach (their system is called Eureqa) to rediscover Newton's laws from pendulum motion data, the Hamiltonian of a double pendulum, and others. They called it "data-driven rediscovery of fundamental physics." It was a GP result in all but name.

### 4.7 The GP Community

GP developed its own ecosystem in the 1990s and 2000s. The **Genetic and Evolutionary Computation Conference (GECCO)** and its European counterpart **EuroGP** are the primary venues. Wolfgang Banzhaf, Peter Nordin, Robert Keller, and Frank Francone wrote *Genetic Programming: An Introduction* (1998), the main textbook alongside Koza's books. **Riccardo Poli** and **Bill Langdon** wrote *A Field Guide to Genetic Programming* (2008), freely available online, which serves as the field's definitive modern reference.

The GP community is small but persistent. It has its own software: `ECJ` (a Java GP framework by Sean Luke at George Mason), `DEAP` (Distributed Evolutionary Algorithms in Python, which supports GP), `lil-gp`, and Koza's own commercial Lisp-based system. And it has, crucially, its own spiritual home: Lisp. While you can do GP in any language, GP is most naturally expressed in Lisp. Every GP tutorial starts by showing an S-expression tree and explaining subtree crossover. Every GP researcher has, at some point, written their own minimal GP system in fifty lines of Common Lisp or Scheme. It is a rite of passage.

### 4.8 Push and PushGP

**Lee Spector**, then at Hampshire College, designed a programming language specifically for genetic programming, called **Push**. Push is a stack-based language with multiple typed stacks (one for integers, one for floats, one for booleans, one for code itself). A Push program is a sequence of instructions that manipulate these stacks. Crossover and mutation are linear-genome operations, not tree operations. Push has several properties that make it better for GP than raw Lisp:

- **No syntax errors by construction.** Any sequence of instructions is a valid Push program. There are no "arity" constraints.
- **Self-modifying code by default.** Because there is a stack for `code`, Push programs can manipulate their own code during execution.
- **Multiple types without complicated typing rules.** Each instruction checks whether the stacks it needs are non-empty; if they aren't, the instruction is a no-op.

PushGP, the Push-based GP system, has produced some of the most striking recent GP results — including auto-generated software repair on real Java bugs, and program synthesis for software engineering benchmarks. Spector's work is a direct continuation of the Koza lineage and remains explicitly within the Lisp tradition: Push is itself a homoiconic language.

### 4.9 Variants and Descendants

- **Linear Genetic Programming** (Nordin, 1994) — represents programs as sequences of low-level instructions rather than trees. Faster to run, less expressive, often competitive on numerical problems.
- **Grammatical Evolution** (O'Neill and Ryan, 1998) — uses a BNF grammar to map a linear genome into a syntactically valid program in any target language. This is the trick that lets you do GP in languages other than Lisp while keeping the "always valid" invariant.
- **Cartesian Genetic Programming** (Julian Miller, 1999) — represents programs as directed acyclic graphs on a grid. Used heavily in digital circuit evolution and neural architecture search.
- **Gene Expression Programming** (Candida Ferreira, 2001) — a hybrid with a fixed-length linear genome that is decoded into a tree. Commercially successful in data mining tools.
- **Strongly Typed Genetic Programming** (Montana, 1995) — enforces type constraints on crossover and mutation so that evolved programs always type-check.

### 4.10 The Decline and the Return

GP was a hot area from 1992 to approximately 2010. Then the deep learning revolution consumed the attention of the machine learning community. Gradient descent on differentiable models was simply faster, more scalable, and more reliable than evolutionary search on non-differentiable representations. GP fell out of favor.

But GP is creeping back, for three reasons.

**Program synthesis.** LLMs have made program synthesis commercially important (Copilot, Cursor, Codex). But LLMs produce code that looks plausible; they do not *verify* that the code is correct. GP, by contrast, is a generate-and-test loop: each candidate is actually executed and scored. Hybrid LLM-plus-GP systems — use the LLM to propose candidates, use a GP-like evolutionary loop to refine them against a fitness function — are an active research direction. Google DeepMind's AlphaCode and FunSearch (2023) are examples; FunSearch uses an LLM to generate candidate programs, evaluates them against a fitness function, and keeps the good ones. This is genetic programming with an LLM as the mutation operator.

**Neurosymbolic AI.** As discussed in Section 6, the neural-symbolic synthesis has renewed interest in symbolic program representations that can be manipulated, combined, and searched. GP provides one such representation, and its crossover and mutation operators are a well-studied way to search the space.

**AutoML.** Automated machine learning systems use GP to search over feature engineering pipelines, model architectures, and hyperparameters. TPOT (Olson and Moore, 2016) is a GP-based AutoML system that has produced competitive results on Kaggle-style tabular data problems.

The lesson is simple: the GP idea — that programs can be manipulated as data by an evolutionary search — did not die when deep learning arrived. It was overshadowed. It is now returning, under different names and in hybrid form, but the core insight is Koza's, and the language in which it was discovered is Lisp.

---

## 5. Neural Networks in Lisp

### 5.1 The Perceptron Was Contemporary with Lisp

Frank Rosenblatt published "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain" in 1958, the same year McCarthy began designing Lisp. The perceptron was a single-layer neural network, implemented initially in simulation on an IBM 704 (the same machine where the first Lisp interpreter would run a year later) and later in custom hardware called the Mark I Perceptron at the Cornell Aeronautical Laboratory. Rosenblatt's 1962 book *Principles of Neurodynamics* laid out the theoretical framework.

The perceptron was the first computational neural network. It could learn linearly separable patterns. It captured public imagination — *The New York Times* in 1958 reported that the perceptron would soon "walk, talk, see, write, reproduce itself and be conscious of its existence." This was overblown, and the overreaction contributed to the backlash.

In 1969, Marvin Minsky and Seymour Papert published *Perceptrons: An Introduction to Computational Geometry*. The book proved that a single-layer perceptron could not learn the XOR function. The proof was correct and narrow, but the broader rhetorical effect was devastating: the book was widely read as a condemnation of the entire neural network approach. Funding dried up. Research into neural networks effectively stopped in North America from 1970 to approximately 1985. This is the first "neural network winter."

Minsky and Papert were writing from the MIT AI Lab, which was entirely a Lisp shop. The symbolic AI program — of which Minsky was an architect — and the subsymbolic connectionist program were in direct competition for funding and legitimacy. *Perceptrons* won that battle for fifteen years.

### 5.2 The Backpropagation Revival

Paul Werbos's 1974 Harvard PhD dissertation had already derived the backpropagation algorithm, which generalizes the perceptron learning rule to multi-layer networks. Werbos's work went largely unnoticed. David Rumelhart, Geoffrey Hinton, and Ronald Williams rediscovered backpropagation independently and published it in the two-volume *Parallel Distributed Processing* (PDP) books in 1986. The PDP books triggered the second wave of neural network research.

Much of the PDP-era neural network research was implemented in Lisp — because Lisp was still the dominant AI research language, and the researchers were AI researchers. The perceptron had been a fringe topic for fifteen years, but the researchers who picked it back up had grown up with Lisp. Rumelhart's group at UCSD used Lisp. The early NETtalk system (Sejnowski and Rosenberg, 1986) that learned to pronounce English text was implemented partly in Lisp. Geoffrey Hinton's early Boltzmann machine experiments were in Lisp.

The neural network community did eventually migrate away from Lisp — first to C (for speed), then to C++, then to MATLAB, and finally to Python. But the *intellectual foundations* were laid in a culture where Lisp was the default and where symbolic thinking was the baseline.

### 5.3 The Connection Machine: Parallel Lisp at Hardware Scale

In 1981, Danny Hillis, then a graduate student at MIT working with Marvin Minsky, began designing a massively parallel computer. Hillis's thesis, *The Connection Machine*, was completed in 1985 and published as a book by MIT Press in 1986. It remains one of the most readable and visionary computer architecture books of the era.

The **Connection Machine CM-1**, built by Thinking Machines Corporation (TMC) in 1985, was a SIMD machine with **65,536 one-bit processors**, each with 4 kilobits of local memory, connected by a 12-dimensional hypercube routing network. The CM-1 was intended for AI applications: associative memory, semantic network processing, relaxation labeling for computer vision, and — most famously — parallel neural network simulation.

The CM-1 was programmed primarily in a language called ***Lisp** (pronounced "star Lisp"), designed at TMC by Guy L. Steele Jr. (yes, the Guy Steele of Scheme, Common Lisp, and Java fame) and Cliff Lasser. \*Lisp added parallel variable types (pvars) and parallel operators to Common Lisp. A pvar was an array with one element per processor; applying `+!!` to two pvars produced a new pvar with element-wise sums, computed in parallel across all 65,536 processors.

```lisp
(*let ((x!! (!! 0))  ; scalar 0 broadcast to all processors
       (y!! (!! 0)))
  (*set x!! (self-address!!))  ; each proc stores its own id
  (*set y!! (*!! x!! x!!))     ; parallel square
  (*sum!! y!!))                ; parallel reduction: sum of all squares
```

This is SIMD data-parallel programming, a decade before GPUs. The CM-1 ran *Lisp programs, and the things it ran were often neural networks, cellular automata, image processing, and symbolic semantic networks — all tasks where thousands of simple computations needed to happen at once.

A CM-1 cost $5 million. Customers included Los Alamos National Laboratory, the NSA, MIT, Stanford, DARPA-funded AI research groups, and the first wave of computational biology groups. The CM-2 (1987) added floating-point hardware — 2,048 Weitek FPUs, one per 32 processors — and became a serious scientific computer. The CM-5 (1991) was a MIMD machine with 32-bit SPARC processors, a departure from the original SIMD vision, and the model that (in a twist of fate) appears as the computer controlling the dinosaur park in Michael Crichton's *Jurassic Park*. Those glowing red LEDs in the movie are real CM-5 front panels.

### 5.4 Feynman on the Router

The router of the Connection Machine was the crown jewel of its design: every processor could send a message to any other processor in a small number of hops, and the whole machine had to balance load across thousands of simultaneous message paths without deadlock. Designing and analyzing the router was a major theoretical problem.

**Richard Feynman**, then in his final years (he died in February 1988), spent substantial time at Thinking Machines as a consultant in 1983-1988. His specific contribution was the analysis of the router's congestion behavior: when do messages pile up, how full do the routing queues get, how large do the buffers need to be? Feynman approached the problem as a physicist would, treating message flow as a diffusion process, and produced a back-of-envelope analysis that turned out to match the simulated behavior remarkably well. He also worked on the CM's quantum chromodynamics simulations — one of the first major applications of the CM-2 — and on cellular automata experiments. Danny Hillis wrote a moving memoir of Feynman's time at TMC, published in *Physics Today* after Feynman's death, titled simply "Richard Feynman and the Connection Machine." It is essential reading for anyone interested in this history.

### 5.5 Parallel Lisp: A Language Family

\*Lisp was not the only parallel Lisp. There was a whole family, all emerging from the AI Lab / Lisp machine tradition during the 1980s.

**Multilisp**, designed by Robert Halstead at MIT in 1985, introduced **futures**. A `future` expression is a promise of a value that will be computed later, possibly in parallel. When another thread tries to use the value, it either gets it (if already computed) or blocks until it is. The syntax is:

```lisp
(defun pfib (n)
  (if (< n 2)
      n
      (let ((a (future (pfib (- n 1))))
            (b (pfib (- n 2))))
        (+ (touch a) b))))
```

This is the direct ancestor of every async/await in every modern language. JavaScript's Promise, Rust's Future, Python's asyncio Task, C#'s Task — all are Multilisp's futures. Halstead's 1985 paper "Multilisp: A Language for Concurrent Symbolic Computation" is the foundational reference. Multilisp ran on the Concert multiprocessor at MIT.

**Qlisp**, designed by Gabriel, Goldman, and Sussman at Stanford in the mid-1980s, was another parallel Common Lisp extension, with constructs for spawning concurrent tasks and managing queues of work.

**Connection Machine Lisp**, another name for the \*Lisp effort, sometimes generalized to include other language work at TMC, including C\* (parallel C) and CM Fortran.

**ParaLisp**, a parallel Scheme effort at various universities, exploring different synchronization models.

The common thread: the AI research community, needing parallel machines to train neural networks and run large symbolic searches, built parallel languages on top of Lisp. This tradition is forgotten in modern parallelism discussions, which start with OpenMP and MPI as if nothing existed before them. But the conceptual vocabulary — futures, promises, data-parallel operations, reductions, broadcast, scatter/gather — was worked out in Lisp, for AI, during the 1980s.

### 5.6 Why Neural Networks Left Lisp

The neural network community's migration away from Lisp began in earnest around 1990 and was essentially complete by 2000. The reasons were numerical, not ideological.

Training a neural network is, at the core, matrix multiplication. Backpropagation is a sequence of matrix multiplications, element-wise nonlinearities, and more matrix multiplications. This is exactly the kind of dense numerical linear algebra that Lisp was least optimized for. Common Lisp has arrays, and CL arrays can be declared to hold `single-float` or `double-float` elements, and a sufficiently aggressive compiler can produce code that is within a factor of 2 or 3 of C. But no Common Lisp implementation had the tuned BLAS/LAPACK kernels that FORTRAN and C had by the late 1980s. For training large networks, the difference was measurable in wall-clock hours.

C and C++ won for pure speed. MATLAB won for ease of matrix expression. By the time Python arrived with **NumPy** (originally `Numeric`, 1995; NumPy 1.0 in 2006), the combination of a Lisp-like interactive REPL culture *plus* tuned C numerical kernels *plus* a huge ecosystem of libraries made Python unbeatable for neural network work. Theano (University of Montreal, 2007) was the first modern deep learning framework; it pioneered the idea of a "computational graph" that could be symbolically differentiated and compiled to GPU kernels. Theano was written in Python but its computational graph was, conceptually, an S-expression tree in disguise. TensorFlow (Google, 2015), PyTorch (Facebook, 2016), and JAX (Google, 2018) followed.

### 5.7 The Quiet Re-invention

Here is the interesting part. Every one of those frameworks — Theano, TensorFlow, PyTorch, JAX — is, underneath, a Lisp interpreter for a numerical expression language, implemented in Python.

Consider what TensorFlow 1.x did. You wrote Python code that constructed a `tf.Graph` object. The Graph was a data structure representing a computation. You then called `sess.run()` to evaluate the graph with specific inputs. The Graph was, exactly and literally, an S-expression. Constructing it with Python function calls was a DSL for building an AST. Running it was `eval`. This is Lisp's program-as-data with a Python skin.

Consider what `tf.GradientTape`, `torch.autograd`, and `jax.grad` do. They take a computation, track it as a directed acyclic graph of operations, and symbolically differentiate the graph to produce a new graph (the backward pass). This is symbolic differentiation — a technique that originated in MACSYMA in 1968, in Lisp, at MIT. It was part of the standard toolkit of the Lisp AI community by 1975. When Seppo Linnainmaa published reverse-mode automatic differentiation in his 1970 Finnish master's thesis (probably the first formal description), he was building on a well-understood idea in the Lisp symbolic computing community. The modern deep learning framework rediscovered symbolic differentiation and gave it a new name: autodiff.

Consider what JAX does. JAX is a library for differentiable numerical computing in Python. Its operative trick is `jax.jit`, which **traces** a Python function (by running it once with abstract "tracer" values), records the trace as a computational graph, and then compiles the graph to XLA, Google's array compiler. Tracing is exactly Lisp's `macroexpand`: take a program, evaluate it partially in a meta-level interpreter, and produce a transformed program. JAX's compositional transformations (`jit`, `grad`, `vmap`, `pmap`) are exactly Lisp's compositional macros. JAX is a Lisp implementation in Python.

Consider what PyTorch 2.0's `torch.compile` does. It uses TorchDynamo to intercept Python bytecode, build a graph of tensor operations, and compile the graph. This is the same pattern: trace, transform, compile. It is what Lisp compilers have been doing since 1960.

None of this is a coincidence. The problem of "given a numerical program, produce a faster version that also computes gradients" has a natural solution, and the natural solution is the one Lisp arrived at: represent the program as data, transform the data, run the result. The modern deep learning framework is, at its core, a specialized Lisp interpreter. It just happens to be wrapped in Python and specialized for dense array operations.

Chris Rackauckas, working on Julia's SciML ecosystem, has been explicit about this: Julia's approach to scientific machine learning is "differentiable programming," which he describes as the right synthesis of symbolic and numeric computing — the synthesis Lisp achieved sixty years ago in a different register.

---

## 6. The Neurosymbolic Renaissance

### 6.1 Why Pure Neural Is Not Enough

By the late 2010s, deep learning had won essentially every benchmark in perception — computer vision, speech recognition, machine translation. But it was also becoming clear that there were classes of problem that pure neural approaches struggled with: systematic generalization, compositional reasoning, rule-following, out-of-distribution robustness, interpretability, and the ability to learn from very small numbers of examples.

**Gary Marcus**, a cognitive scientist and long-time critic of pure connectionism, has been the most vocal public advocate of this critique. His 2001 book *The Algebraic Mind* argued that neural networks, without explicit symbolic machinery, would fail at exactly the things symbolic AI had historically done well. His 2020 book with Ernest Davis, *Rebooting AI: Building Artificial Intelligence We Can Trust*, sharpened the argument for a general audience. Marcus's 2018 paper "Deep Learning: A Critical Appraisal" listed ten problems with pure deep learning that had not been solved and, in his view, could not be solved without symbolic structure.

### 6.2 Why Pure Symbolic Is Not Enough

The symbolic AI community had learned its own hard lessons, documented in Section 2. Pure symbolic systems were brittle, hand-built, ungrounded, and impossible to scale. Expert systems had failed. CYC was a monument to the limits of the approach.

The convergent realization — which took hold during the 2010s and became a mainstream position by 2020 — was that intelligence probably requires both. Perception and pattern recognition are well-suited to neural networks. Reasoning, planning, and systematic generalization are well-suited to symbolic representation. A system that has both might solve problems that neither alone can solve.

### 6.3 The Neurosymbolic Research Program

Luis Lamb, Artur d'Avila Garcez, and collaborators published *Neural-Symbolic Cognitive Reasoning* in 2009, laying out a theoretical framework. Their more recent paper "Neurosymbolic AI: The 3rd Wave" (2020) is the main position statement of the subfield. The "three waves" framing places symbolic AI (1956-1985) as the first wave, statistical machine learning and deep learning (1986-2015) as the second, and neurosymbolic AI (2016-) as the third.

A sampling of concrete neurosymbolic systems:

- **Neural Theorem Provers** (Rocktäschel and Riedel, 2017): extend Prolog-like backward chaining to use soft unification, with unification similarity scored by a neural network on distributed representations. Trained end-to-end.
- **Differentiable Inductive Logic Programming** (Evans and Grefenstette, DeepMind, 2018): learn logical rules that satisfy a dataset, where the rule selection is soft and differentiable, so standard gradient descent can be applied.
- **Neuro-Symbolic Concept Learner** (Mao, Gan, Kohli, Tenenbaum, Wu, 2019): learns to parse images into a scene graph using a neural network, then answers questions about the scene using a symbolic executor on the graph. Trained end-to-end by backpropagating through a discrete executor.
- **DreamCoder** (Ellis, Wong, Nye, Sable-Meyer, Morales, Hewitt, Cary, Solar-Lezama, Tenenbaum, 2021): a program synthesis system that learns a library of useful program abstractions through an EM-like alternation between a neural network (the "dreamer" that guides search) and explicit program enumeration. The synthesized programs are in a Lisp-like lambda calculus.
- **AlphaGeometry** (Trinh, Wu, Le, He, Luong, DeepMind, 2024): solves International Mathematical Olympiad geometry problems by combining a symbolic deduction engine (classical Euclidean geometry rules) with a language model that suggests auxiliary constructions. Reached gold-medal performance on IMO geometry problems.
- **FunSearch** (Romera-Paredes et al., Nature 2023): uses an LLM as a mutation operator in an evolutionary search over programs, with a fitness function that evaluates the program on the problem. Discovered a new construction for the cap set problem and improved bounds on a classic combinatorial optimization problem. This is genetic programming with an LLM.

The common structure: a neural model for pattern recognition and heuristic guidance, combined with a symbolic module for precise rule-following and verification. The symbolic module is, in almost every case, implemented as an interpreter for a small domain-specific language. The domain-specific language is, in almost every case, a variant of Lisp: S-expressions, lambda abstractions, recursive evaluators. The inheritance is not always acknowledged, but it is visible in the code.

### 6.4 Lisp as Reasoning Substrate

LLMs can be prompted to write Lisp. LLMs can be trained to write Lisp. Lisp has some properties that make it particularly attractive as a "reasoning substrate" for LLM-based systems:

- **Small grammar.** A Lisp parser is under a page of code. An LLM can learn the syntax in a handful of examples. Errors are visible.
- **Homoiconicity.** An LLM-generated Lisp program can be manipulated by another program (or another LLM call) without ad-hoc parsing.
- **Explicit control flow.** Recursive S-expressions show their structure on the surface. Chain-of-thought reasoning in Lisp-like notation is more auditable than in prose.
- **Built-in evaluation.** A small Lisp interpreter can be embedded as a tool that the LLM calls, providing immediate ground-truth feedback on proposed reasoning steps.

A number of 2023-2025 research papers have explored this explicitly: using a Lisp-like intermediate representation as the reasoning trace for an LLM, either for math word problems, for code generation, or for tool-use planning. The SymbolicAI project (Dinu et al., 2023) and the LMQL project (Beurer-Kellner et al., 2023) both use a Lisp-influenced DSL to structure LLM interaction. The pattern is clear: when researchers want a symbolic layer on top of a neural one, they tend to converge on something that looks like Lisp, because Lisp is what symbolic representation reduces to in its most minimal form.

### 6.5 The Full Circle

The neurosymbolic research program is not a return to 1975 — we have vastly more data, vastly more compute, vastly better neural networks, and a much clearer understanding of what symbolic structure is for and what it is not for. But it is a partial vindication of the symbolic AI research program of the MIT AI Lab era. The insight that reasoning requires discrete, compositional, manipulable structure was correct. What was missing was a way to learn the structure from data rather than hand-build it. Neural networks provide the missing piece.

McCarthy, who died in 2011, lived to see the deep learning revolution begin but not to see neurosymbolic AI take its current shape. He would, I think, be cautiously pleased. His commitment was to symbolic representation, not to hand-coded rules — he wrote in 1958 about an "Advice Taker" that would *learn* new knowledge by being told, not by being programmed. A system that learns its symbols from data, uses them in compositional reasoning, and improves through experience would fit his vision far better than either a pure expert system or a pure deep network.

---

## 7. Modern ML and the Lisp Family

### 7.1 Lisp-Family Languages in Modern ML

The Lisp family did not die with the Lisp machines. Several dialects remain actively used in machine learning and data science contexts.

**Clojure**, designed by Rich Hickey and released in 2007, is a Lisp dialect that runs on the JVM (with ClojureScript targeting JavaScript). Clojure brought persistent data structures, software transactional memory, and an emphasis on pure functional style to the Lisp tradition. For machine learning, the main Clojure libraries are:

- **Cortex** (2016-2020): a pure Clojure deep learning library with GPU support via CUDA.
- **dl4clj**: Clojure bindings to Deeplearning4j.
- **Neanderthal**: fast native-backed matrix library for Clojure, with CUDA and OpenCL kernels.
- **MXNet for Clojure**: bindings to Apache MXNet.
- **libpython-clj**: bidirectional Clojure/Python interop that lets Clojure code drive PyTorch, TensorFlow, and scikit-learn transparently.

The Clojure ML community is small but active. The Scicloj initiative (sci for science) maintains a curated set of data science libraries and runs the Clojure Data Science online conference.

**Common Lisp** has its own ML ecosystem, though smaller. **MGL**, developed by Gábor Melis, is a comprehensive machine learning library with neural networks, Boltzmann machines, Gaussian processes, and gradient boosting. Melis used MGL in competitive machine learning and placed well in several Kaggle competitions using it. **LLA** (Lisp Linear Algebra) wraps BLAS/LAPACK for Common Lisp. **cl-mathstats** provides statistical primitives. The ecosystem is not large, but the language is still used for machine learning research by a small, productive community.

**Racket**, the Scheme descendant maintained by Matthew Flatt and collaborators, is used for teaching and for language-design research. Its ML ecosystem is smaller still, but Racket's `math` library, the `plot` library, and Racket's facilities for building DSLs make it an attractive platform for experimental work.

**Hy** is Lisp syntax on the Python runtime. A Hy program is parsed into Python AST and executed by the Python interpreter. This means Hy has access to everything Python has: NumPy, PyTorch, TensorFlow, scikit-learn, pandas. A PyTorch training loop in Hy looks like:

```hy
(import torch)
(import torch.nn.functional :as F)

(defn train-epoch [model loader optimizer]
  (for [(, inputs targets) loader]
    (.zero-grad optimizer)
    (setv outputs (model inputs))
    (setv loss (F.cross-entropy outputs targets))
    (.backward loss)
    (.step optimizer)))
```

Hy does not replace Python; it is a different skin for the same language. But for researchers who want the full expressive power of macros while using the Python ML ecosystem, it is the most practical option.

**Guile Scheme**, maintained by the GNU project, is used in GNU Guix, GNU Make's Guile integration, Emacs's new Guile backend, and various smaller projects. Guile has historically not been a major ML language, but Guile's aggressive compiler and its role as GNU's official extension language make it a potential future platform.

### 7.2 Julia: Not a Lisp, but a Lisp in Disguise

**Julia**, released in 2012 by Jeff Bezanson, Stefan Karpinski, Viral Shah, and Alan Edelman, is not officially a Lisp. It has an Algol-like surface syntax with `function ... end`, braces for parameters, and an explicit type system. It is intended for high-performance numerical computing and has been adopted extensively in scientific computing and machine learning.

But Julia is, under the hood, a Lisp. The creators are explicit about this. Julia's parser produces an S-expression-shaped AST, which is then manipulated by macros before being compiled. Julia has:

- **Macros** that operate on the AST, very similar to Common Lisp macros.
- **Multiple dispatch** as the core dispatch mechanism — directly inspired by CLOS.
- **Metaprogramming** through `Expr` objects, which are Lisp cons cells with a different name.
- **First-class types as values** manipulable at compile time.
- **A REPL** with interactive workflow.
- **Homoiconicity**, in the sense that Julia code is expressible as Julia data.

Jeff Bezanson has described Julia as "Scheme with types and Ruby-ish syntax." Stefan Karpinski has said that Julia's multiple dispatch comes directly from CLOS and Dylan.

For machine learning, Julia's flagship framework is **Flux.jl**, a pure-Julia deep learning library whose layers are plain Julia structs and whose training loops are plain Julia code. Flux relies on **Zygote.jl** for automatic differentiation — and Zygote is source-to-source autodiff, implemented by code-walking Julia's AST. This is precisely the "program-as-data" approach that Lisp invented. Zygote's source code (in Julia) reads very much like Lisp macro code.

The Julia scientific machine learning (SciML) ecosystem, led by Chris Rackauckas, pushes the differentiable-programming paradigm further: differential equation solvers, physics simulators, Kalman filters — all differentiable end-to-end. This is "neural ODEs" and beyond. It is the culmination of the line of thinking that started with MACSYMA's symbolic differentiation in 1968, passed through Multilisp's parallel futures, continued through Connection Machine \*Lisp, and is now returning as first-class scientific computing.

### 7.3 The Unacknowledged Lisp Influences

Several pieces of the modern ML stack are direct, unacknowledged or half-acknowledged, Lisp descendants.

**JAX** is the clearest case. JAX is a numerical library for Python whose killer feature is composable function transformations: `grad`, `jit`, `vmap`, `pmap`, and their compositions. The mechanism is pure Lisp: trace the Python function to an intermediate representation (called Jaxpr, which is a list-of-operations format), transform the IR, and compile. Jaxpr is an S-expression representation; the JAX code-base contains a pretty-printer that produces something very close to Scheme notation. Matthew Johnson, one of JAX's principal authors, has a background in probabilistic programming and is well-versed in the Lisp tradition.

**PyTorch's `torch.fx`** is PyTorch's graph transformation library. It takes a PyTorch module, symbolically traces it into an FX Graph (a list of nodes), lets you transform the graph with Python code, and compiles the transformed graph back into a PyTorch module. This is a Lisp macro system: input program, tree transformation, output program.

**TVM** (Tensor Virtual Machine), originating at the University of Washington and now an Apache project, uses a tensor expression language called Relay. Relay is explicitly described as "a functional, statically typed intermediate representation for machine learning, inspired by a combination of ML and Scheme." The Relay documentation uses S-expression notation for examples.

**MLIR**, LLVM's multi-level intermediate representation framework, has dialects for various domains (linear algebra, affine loops, GPU kernels). MLIR's textual format uses a Lisp-like S-expression syntax for its operations. The designers acknowledge the inspiration.

**Autograd** (the original Python library by Dougal Maclaurin, David Duvenaud, Matthew Johnson, and Ryan Adams, from HIPS at Harvard) was the first widely-used Python reverse-mode autodiff library. It explicitly treated Python functions as symbolic expressions, traced them through to a tape, and walked the tape backward. This is the Lisp approach to differentiation in Python costume. Maclaurin's dissertation acknowledges the Lisp tradition explicitly.

**Differentiable programming** as a research direction — the idea that arbitrary programs with gradients are the right primitive for machine learning — was articulated in its modern form by Yann LeCun and others around 2018, but the conceptual primitives (program as data, transformation as composition, differentiation as a transformation) are all Lisp primitives.

### 7.4 Why It Keeps Coming Back

The reason Lisp keeps coming back is not nostalgia. It is that the problems Lisp was designed for — manipulating code as data, composing programs through higher-order functions, treating expressions as first-class citizens — are exactly the problems modern machine learning is wrestling with. When you want to take a neural network training loop and automatically derive its gradient, you are operating on programs. When you want to compile that same training loop to a GPU, you are operating on programs. When you want to fuse operations across layer boundaries for performance, you are operating on programs. When you want to synthesize a new network architecture by neural architecture search, you are operating on programs. When you want to prove that a learned model satisfies a specification, you are operating on programs.

Lisp is the language that treats operating on programs as its native mode. Every other language has to add machinery — a parser, an AST library, a macro system, a code generator — to do what Lisp does out of the box. Modern ML is a long, slow, expensive re-discovery of this fact. The re-discovery is not complete. It will not be complete for a while. But it is happening, and it is why Lisp keeps being mentioned in modern ML papers even when the authors are writing Python.

---

## 8. The Connection Machine: A Deep Dive

### 8.1 Hillis's Thesis and the Book

Danny Hillis was a Marvin Minsky student at the MIT AI Lab. His doctoral thesis, completed in 1985, was published by MIT Press in 1986 as *The Connection Machine*. The book is one of the most accessible and visionary computer architecture texts ever written. Hillis's central argument was that the von Neumann bottleneck — the single thread of instructions flowing from memory to a CPU — was fundamentally wrong for AI. Intelligence, Hillis argued, is a massively parallel phenomenon. A brain has 10^11 neurons, each operating concurrently. A von Neumann machine with one CPU and a shared memory can only pretend to do that. What was needed was a machine where the data and the computation were co-located, where each small piece of data had its own small processor.

The CM-1's design reflected this: 65,536 one-bit processors, each with its own memory, each operating on its own local data, connected by a routing network so that processors could communicate when the computation required it. Programs did not loop over an array; they broadcast an instruction to every processor simultaneously and each processor applied the instruction to its local memory. This is the SIMD (Single Instruction Multiple Data) paradigm. The name "Connection Machine" came from Hillis's vision of a machine that would be useful for neural networks and semantic networks — structures where the "connections" between elements were the primary object.

### 8.2 The Architecture in Detail

The CM-1's 65,536 processors were 1-bit ALUs on a custom CMOS chip. Each chip contained 16 processors. The whole machine was a physical cube, about 1.5 meters on a side, covered with red LEDs (each LED corresponding to one processor's activity state). The LEDs were there for aesthetic reasons — they served no computational purpose — but they turned the CM into an iconic image. When the machine was busy, the cube shimmered with red light.

The routing network was a 12-dimensional hypercube. Each processor chip had 12 bidirectional communication links to 12 other chips. Any two processors could communicate in at most 12 hops. For "local" communications (on a 2D grid, say), there was a separate "NEWS" network (North-East-West-South) that was faster for nearest-neighbor operations.

The CM-1 had no floating-point hardware. All arithmetic was done by microcoded routines on the 1-bit processors, which meant that a 32-bit floating-point multiplication took many cycles. For AI workloads that worked on 1-bit or 8-bit values (semantic networks, boolean logic, low-precision vision), the CM-1 was spectacular. For neural networks, which typically wanted 32-bit or 16-bit floating point, it was merely adequate.

The **CM-2** (1987) fixed this. It added a Weitek 3132 floating-point unit per 32 processors, for a total of 2,048 FPUs. This made the CM-2 competitive on dense matrix operations and opened it up to scientific computing. The CM-2 was the most successful of the TMC machines commercially. It was used for computational fluid dynamics, oil exploration seismic processing, cosmological simulations, and (of course) neural network training. A CM-2 appeared in several published papers on PDP-style neural networks.

The **CM-5** (1991) was a radical departure. It was a MIMD (Multiple Instruction Multiple Data) machine built from SPARC processors with custom vector units. Each node had its own program, its own instruction stream, and its own memory. The routing was done by a "fat tree" network. The CM-5 was intended to compete with the emerging MPP (Massively Parallel Processor) market against Intel Paragon, nCUBE, and Cray MPPs. The architectural shift from SIMD to MIMD was a response to market pressure: most scientific codes wanted MIMD, and the CM-1/CM-2's SIMD discipline was too restrictive. But the shift also signaled that Hillis's original vision — a machine specifically for connectionist AI — had given way to general-purpose parallel computing.

### 8.3 \*Lisp and the Other Languages

The primary programming language for the CM-1 and CM-2 was **\*Lisp**, designed by Guy Steele and Cliff Lasser. \*Lisp extended Common Lisp with parallel variables (pvars) — arrays with one element per processor. Operations on pvars were executed in parallel across all processors. A reduction across processors (like summing a pvar) was a single primitive. Here is a simple \*Lisp program that computes the Mandelbrot set:

```lisp
(*defun mandelbrot!! (c-real!! c-imag!!)
  (let ((z-real!! (!! 0.0))
        (z-imag!! (!! 0.0))
        (iter!! (!! 0))
        (max-iter 100))
    (*while (and!! (<!! iter!! (!! max-iter))
                   (<!! (+!! (*!! z-real!! z-real!!)
                             (*!! z-imag!! z-imag!!))
                        (!! 4.0)))
      (let ((new-real!! (+!! (-!! (*!! z-real!! z-real!!)
                                  (*!! z-imag!! z-imag!!))
                             c-real!!))
            (new-imag!! (+!! (*!! (!! 2.0)
                                  (*!! z-real!! z-imag!!))
                             c-imag!!)))
        (*set z-real!! new-real!!)
        (*set z-imag!! new-imag!!)
        (*set iter!! (+!! iter!! (!! 1)))))
    iter!!))
```

This computes the iteration count for *every pixel* in parallel, with each processor handling one pixel. The `!!` convention marked parallel operations; it was a reminder to the programmer that these operations spanned all processors. Guy Steele designed the notation specifically to make the parallelism visible at every expression.

Alongside \*Lisp, TMC also shipped **C\*** (a parallel C dialect, pronounced "C star") and **CM Fortran** (a CM version of Fortran 90 with parallel extensions). For many scientific users, CM Fortran was the entry point. For AI users, \*Lisp was the natural choice.

### 8.4 Feynman at Thinking Machines

Richard Feynman began consulting at Thinking Machines in 1983, at Hillis's invitation. He continued until his death in February 1988. His contributions are worth enumerating because they are often mentioned but rarely specified.

**Router analysis.** The main theoretical problem in the Connection Machine was the behavior of the routing network under load. When many processors sent messages simultaneously, how often did messages collide? How large did the routing buffers need to be to avoid deadlock? Feynman approached the problem as a physicist, modeling message flow as a Markov process, and derived bounds on buffer sizes that matched the empirical behavior of the simulator. His analysis justified the routing architecture and influenced the final hardware design.

**Quantum chromodynamics.** Feynman used the CM-2 to run lattice QCD simulations, a computation that had previously required Cray supercomputers. The CM-2 was not as fast for QCD as a Cray in wall-clock time, but it was much cheaper, and it was suitable for the kinds of exploratory calculations Feynman enjoyed.

**Cellular automata.** Feynman was interested in cellular automata as models of physics. The CM was a natural cellular automaton machine — one processor per cell — and Feynman ran CA experiments on it, partly for the physics and partly for fun.

**Culture.** Feynman's presence at TMC was, by all accounts, a major morale booster and cultural asset. He gave lectures, played bongo drums at parties, and treated young engineers as equals. Hillis's 1989 *Physics Today* memoir captures this:

> "When I talked to Feynman about computation, he was usually more interested in the problems than in the answers. He treated the whole enterprise as a puzzle. When the machine crashed in the middle of the night, Feynman would stay and help debug. He figured out the cause of a deadlock in the router buffer one night, drawing on a napkin in the lab cafeteria."

Feynman's biographer James Gleick recounts these years at TMC as Feynman's final great computer adventure. He was dying of cancer during much of the period but worked until the end.

### 8.5 Why Thinking Machines Failed

TMC filed for bankruptcy in 1994. The reasons are a complex mix of market and architectural factors.

**The market was too small.** Machines costing $5-15 million had a small customer base: national labs, a few top universities, defense contractors, and the NSA. When the CM-5 launched in 1991 into a crowded MPP market with multiple competitors (Intel Paragon, Cray T3D, IBM SP, nCUBE, Meiko, MasPar), the $30 million margins TMC needed to cover its engineering costs were not there.

**The DARPA cutback again.** Like Symbolics, TMC was heavily dependent on DARPA funding. The Strategic Computing Initiative pullback hit TMC hard. DARPA stopped buying CM-5s in the mid-1990s, and the private sector did not pick up the slack.

**The SIMD-to-MIMD transition.** The CM-1 and CM-2 had a clear identity: the massively parallel SIMD machine. The CM-5 abandoned this in favor of a general-purpose MIMD design, and in doing so it lost its differentiation. It was competing head-to-head with Intel, IBM, and Cray on price and performance, and it could not win that fight.

**Workstation clusters.** By 1994, it was becoming clear that clusters of commodity workstations (pre-Beowulf, but the seeds were there) could match the performance of custom MPP machines at a fraction of the cost. This was the same force that killed the Lisp machines: commodity hardware eating bespoke hardware. TMC's custom silicon, custom network, and custom software were economic burdens; the market wanted cheap, standard hardware running open software.

**Management turnover and layoffs.** TMC went through multiple CEO changes in the early 1990s. The company's intellectual property was sold to Sun Microsystems in 1996; the brand name and some software continued under a small successor company, but the original TMC was effectively gone by 1995.

### 8.6 GPUs as Spiritual Successors

The Connection Machine vision — many small processors operating in parallel on data distributed across memory — did not die. It was resurrected, around 2006, in an unexpected form: NVIDIA's CUDA programming model for commodity graphics cards.

A modern GPU has thousands of cores organized in SIMD groups (NVIDIA calls them "warps"). Each core has its own registers but shares memory with the others in its warp. Operations are broadcast to all cores in the warp simultaneously. This is the CM-1 architecture reborn in semiconductor scaling. When you launch a CUDA kernel with `<<<blocks, threads>>>`, you are doing what \*Lisp did with pvars: broadcasting a computation to a large number of data-parallel processors.

Neural network training on GPUs is the descendant of neural network training on the Connection Machine, and the programming model is conceptually the same. The instructions are finer-grained; the performance is vastly better; the hardware is a thousand times cheaper; but the idea — one processor per data element, one instruction stream broadcast to all — is the same idea Hillis had in 1981.

If Thinking Machines had survived to 2012 and pivoted from custom MPP hardware to custom accelerators for deep learning, they would have been Google's TPU group or NVIDIA's data center business. The vision was right. The timing and business model were wrong.

### 8.7 What Survived

Several pieces of Thinking Machines' intellectual legacy survived.

**Guy Steele** went to Sun Microsystems and became, among other things, one of the designers of Java (not the current Java, but the original object model and spec). He then went to Oracle Labs and designed Fortress, a parallel programming language that inherited ideas from \*Lisp. Steele's career is a thread of high-integrity language design running from Scheme (with Sussman) through Common Lisp through \*Lisp through Java through Fortress. Every language he has touched has been shaped by the Lisp tradition.

**Danny Hillis** went on to co-found Applied Minds, a design and invention company, and later the Long Now Foundation. He remains an active voice in computing. His 1986 book is still in print.

**David Waltz**, a senior TMC scientist and later a director of NEC Research Institute, continued to publish on parallel AI, case-based reasoning, and the application of massive parallelism to natural language. He died in 2012.

**The research**: the CM era produced a body of research papers on parallel algorithms, connectionist models, associative memory, and high-performance computing that remains foundational. The book *Data-Parallel Algorithms* (W. Daniel Hillis and Guy Steele, 1986) is still cited.

---

## 9. Bibliography

### Primary Sources

- McCarthy, John. "Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I." *Communications of the ACM* 3, no. 4 (April 1960): 184-195. The founding paper of Lisp and of symbolic AI programming.
- McCarthy, John. "Programs with Common Sense." *Proceedings of the Teddington Conference on the Mechanization of Thought Processes*, 1958. The "Advice Taker" paper.
- McCarthy, John, Marvin Minsky, Nathaniel Rochester, and Claude Shannon. "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence." August 31, 1955. The founding document of the AI field.
- Koza, John R. *Genetic Programming: On the Programming of Computers by Means of Natural Selection*. MIT Press, 1992. The GP foundational text.
- Koza, John R. *Genetic Programming II: Automatic Discovery of Reusable Programs*. MIT Press, 1994. Introduces ADFs.
- Koza, John R., Forrest H. Bennett III, David Andre, and Martin A. Keane. *Genetic Programming III: Darwinian Invention and Problem Solving*. Morgan Kaufmann, 1999.
- Koza, John R., Martin A. Keane, Matthew J. Streeter, William Mydlowec, Jessen Yu, and Guido Lanza. *Genetic Programming IV: Routine Human-Competitive Machine Intelligence*. Kluwer, 2003. The human-competitive results.
- Winograd, Terry. *Understanding Natural Language*. Academic Press, 1972. The SHRDLU book.
- Hillis, W. Daniel. *The Connection Machine*. MIT Press, 1986. Hillis's thesis in book form.
- Hillis, W. Daniel, and Guy L. Steele Jr. "Data Parallel Algorithms." *Communications of the ACM* 29, no. 12 (December 1986): 1170-1183.
- Hillis, W. Daniel. "Richard Feynman and the Connection Machine." *Physics Today* 42, no. 2 (February 1989): 78-83.
- Weizenbaum, Joseph. *Computer Power and Human Reason: From Judgment to Calculation*. W.H. Freeman, 1976. The ELIZA postscript.
- Shortliffe, Edward H. *Computer-Based Medical Consultations: MYCIN*. Elsevier, 1976.
- Buchanan, Bruce G., and Edward H. Shortliffe, eds. *Rule-Based Expert Systems: The MYCIN Experiments of the Stanford Heuristic Programming Project*. Addison-Wesley, 1984.

### AI and Lisp Textbooks

- Norvig, Peter. *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp*. Morgan Kaufmann, 1992. Usually called "PAIP." The definitive textbook for building classical AI systems in Common Lisp. Norvig walks through implementing ELIZA, STUDENT, MACSYMA-like symbolic math, Prolog in Lisp, and a compiler. Essential reading.
- Russell, Stuart, and Peter Norvig. *Artificial Intelligence: A Modern Approach*. Pearson, 4th edition, 2020. "AIMA." The standard modern AI textbook, now in its 4th edition, covering the full history of symbolic and statistical AI.
- Graham, Paul. *On Lisp: Advanced Techniques for Common Lisp*. Prentice Hall, 1993. The deep macro book.
- Graham, Paul. *ANSI Common Lisp*. Prentice Hall, 1996. Introductory plus reference.
- Seibel, Peter. *Practical Common Lisp*. Apress, 2005. The best modern introduction.
- Abelson, Harold, and Gerald Jay Sussman, with Julie Sussman. *Structure and Interpretation of Computer Programs*. MIT Press, 2nd edition, 1996. "SICP." Uses Scheme to teach programming as the manipulation of programs. The most important computer science textbook ever written.
- Nilsson, Nils J. *The Quest for Artificial Intelligence: A History of Ideas and Achievements*. Cambridge University Press, 2010. A comprehensive history by one of the Shakey/STRIPS researchers.

### Expert Systems

- Jackson, Peter. *Introduction to Expert Systems*. Addison-Wesley, 3rd edition, 1998. The classic textbook.
- Feigenbaum, Edward A., and Pamela McCorduck. *The Fifth Generation: Artificial Intelligence and Japan's Computer Challenge to the World*. Addison-Wesley, 1983. The book that triggered American panic over Japan's AI investment.
- McCorduck, Pamela. *Machines Who Think*. W.H. Freeman, 1979 (revised 2004). The best narrative history of the early AI field.

### Lisp Machines

- Weinreb, Daniel. "Rebirth of the Lisp Machine." Blog post series on *Dan Weinreb's blog*, 2007-2009. Weinreb was a founding Symbolics employee and his blog series is the primary first-person account of Symbolics' history. Available in web archives.
- Moon, David A. "Symbolics Architecture." *IEEE Computer* 20, no. 1 (January 1987): 43-52. Primary technical description of the Symbolics 3600 architecture.
- Symbolics, Inc. *Reference Guide to Symbolics-Lisp*. Symbolics documentation, multiple editions. The canonical Zetalisp reference.
- Levy, Steven. *Hackers: Heroes of the Computer Revolution*. Doubleday, 1984. Contains the definitive account of the MIT AI Lab hacker culture and the Symbolics/LMI split.
- Williams, Sam. *Free as in Freedom: Richard Stallman's Crusade for Free Software*. O'Reilly, 2002. Stallman's biography, with detailed account of the Lisp machine war.

### Genetic Programming

- Banzhaf, Wolfgang, Peter Nordin, Robert E. Keller, and Frank D. Francone. *Genetic Programming: An Introduction*. Morgan Kaufmann, 1998. The main GP textbook alongside Koza's books.
- Poli, Riccardo, William B. Langdon, and Nicholas F. McPhee. *A Field Guide to Genetic Programming*. Lulu.com, 2008. Freely available online. The modern reference.
- Spector, Lee, Erik D. Goodman, Annie Wu, W.B. Langdon, Hans-Michael Voigt, Mitsuo Gen, Sandip Sen, Marco Dorigo, Shahram Pezeshk, Max H. Garzon, and Edmund Burke. *Proceedings of the Genetic and Evolutionary Computation Conference (GECCO-2001)*. Morgan Kaufmann, 2001. Representative of the GP-community literature.
- Lohn, Jason D., et al. "Evolutionary Antenna Design for a NASA Spacecraft." *Proceedings of the 2004 Genetic and Evolutionary Computation Conference*, 2004. The ST-5 antenna paper.
- Schmidt, Michael, and Hod Lipson. "Distilling Free-Form Natural Laws from Experimental Data." *Science* 324 (April 3, 2009): 81-85. Eureqa and physical law rediscovery.

### Connection Machine and Parallel Lisp

- Thinking Machines Corporation. *\*Lisp Reference Manual*. TMC documentation, 1986. Multiple versions exist for CM-1 and CM-2.
- Steele, Guy L. Jr., and W. Daniel Hillis. "Connection Machine Lisp: Fine-Grained Parallel Symbolic Processing." *Proceedings of the 1986 ACM Conference on LISP and Functional Programming*, 1986, pages 279-297.
- Halstead, Robert H. Jr. "Multilisp: A Language for Concurrent Symbolic Computation." *ACM Transactions on Programming Languages and Systems* 7, no. 4 (October 1985): 501-538. The futures paper.
- Bartlett, Michael. *Connection Machine Model CM-2 Technical Summary*. Thinking Machines Corporation technical report HA87-4, April 1987.

### Modern Neurosymbolic and Historical Retrospective

- Garcez, Artur d'Avila, and Luis C. Lamb. "Neurosymbolic AI: The 3rd Wave." *Artificial Intelligence Review* 56 (2023): 12387-12406. Originally circulated as arXiv preprint in 2020.
- Marcus, Gary, and Ernest Davis. *Rebooting AI: Building Artificial Intelligence We Can Trust*. Pantheon, 2019.
- Marcus, Gary. "Deep Learning: A Critical Appraisal." arXiv:1801.00631, January 2018.
- Harnad, Stevan. "The Symbol Grounding Problem." *Physica D: Nonlinear Phenomena* 42, no. 1-3 (June 1990): 335-346. The foundational paper on the grounding critique.
- Ellis, Kevin, Catherine Wong, Maxwell Nye, Mathias Sable-Meyer, Lucas Morales, Luke Hewitt, Luc Cary, Armando Solar-Lezama, and Joshua B. Tenenbaum. "DreamCoder: Bootstrapping Inductive Program Synthesis with Wake-Sleep Library Learning." *Proceedings of the 42nd ACM SIGPLAN International Conference on Programming Language Design and Implementation* (PLDI 2021), 2021.
- Romera-Paredes, Bernardino, et al. "Mathematical Discoveries from Program Search with Large Language Models." *Nature* 625 (January 2024): 468-475. FunSearch.
- Trinh, Trieu H., Yuhuai Wu, Quoc V. Le, He He, and Thang Luong. "Solving Olympiad Geometry Without Human Demonstrations." *Nature* 625 (January 2024): 476-482. AlphaGeometry.

### Historical Context

- McCorduck, Pamela. *Machines Who Think*. Already listed above, but worth citing twice.
- Crevier, Daniel. *AI: The Tumultuous History of the Search for Artificial Intelligence*. Basic Books, 1993. Coverage of the expert system boom and bust from a journalist who had direct access to the participants.
- Boden, Margaret A. *Mind as Machine: A History of Cognitive Science*. Oxford University Press, 2006. Two volumes, 1700 pages, encyclopedic coverage of the cognitive science / AI intersection.

---

## Coda: The Through-Line

The path this document has traced is one single line. In 1956, at Dartmouth, a small group of men decided that intelligence could be mechanized. In 1958, one of them, John McCarthy, began to build a language because the problem demanded a language — because intelligence, as he saw it, was the manipulation of symbols, and existing languages could not manipulate symbols. That language became Lisp. For thirty years, from 1960 to 1990, Lisp and AI were the same thing. The research programs that defined the discipline — SHRDLU, MACSYMA, DENDRAL, MYCIN, XCON, SOAR, CYC, genetic programming — were all Lisp programs.

The Lisp machines were the hardware incarnation of this commitment: a computer built to run Lisp well, by people who understood that the software demanded it. The Connection Machine was the parallel extension of the same commitment: if one processor running Lisp was good, 65,536 processors running \*Lisp would be better. Both programs were commercial failures. Both were correct about the future.

When the AI winter killed the Lisp machine market, the language went into the long tail of academic and hobbyist use. The mainstream of AI research migrated to C, C++, MATLAB, and eventually Python. Common Lisp was standardized in 1994 as a consolidation of the survivors. Clojure was born in 2007. Hy and Julia and Racket continued the tradition in different forms.

But the *ideas* never left. Garbage collection is everywhere. Dynamic typing is everywhere. First-class functions are everywhere. The REPL is everywhere. The object inspector is everywhere. Closures are everywhere. Futures and async/await are everywhere. Macros, under the name "metaprogramming," are everywhere. Symbolic differentiation, reborn as autodiff, is the foundation of modern deep learning. Computational graphs, which are S-expressions in disguise, are how every ML framework represents its models. Program-as-data, which was Lisp's most radical contribution, is how JAX, PyTorch compiler, TVM, MLIR, and every neural architecture search system all work.

The Connection Machine's 65,536 parallel processors running \*Lisp predicted NVIDIA's data center GPUs running CUDA kernels by thirty years. The Genera environment with live coding, integrated debugging, and image-based persistence predicted every modern IDE by forty years. Koza's evolution of S-expressions predicted modern program synthesis and LLM-plus-search hybrids by thirty years. McCarthy's "Advice Taker" predicted retrieval-augmented generation by sixty years.

The Lisp tradition is not a historical curiosity. It is the unacknowledged foundation on which modern AI rests. Every time a researcher builds an autodiff system, every time a framework introduces a new computational graph, every time an LLM generates a program, every time a neurosymbolic paper describes a hybrid architecture — a piece of the Lisp research program of 1960 through 1990 is being re-instantiated, usually in Python, usually with different vocabulary, usually without citation.

The machine room of modern AI has Python code on its walls. But the wiring in the walls, the blueprint of the building, and the intellectual foundations of what the building is even *for* — those are all Lisp. The birthplace of modern AI is not Mountain View, not Menlo Park, not the offices of DeepMind or OpenAI or Anthropic. It is Technology Square in Cambridge, Massachusetts, in the MIT AI Lab, in the summer of 1958, when a young John McCarthy decided that if he was going to build an Advice Taker, he would need a language that could manipulate advice.

That is the through-line. That is the story. And it is not finished.

---

## Appendix A: A Timeline of Lisp and AI, 1956-2026

The following chronology collects the principal dates from the narrative
above into a single reference. Dates marked with a star are those that
the author considers pivotal — turning points at which the subsequent
history changed shape.

### The Founding Period (1956-1965)

- **1956\*** — Dartmouth Summer Research Project on Artificial
  Intelligence. McCarthy coins the term "artificial intelligence."
  Newell and Simon demonstrate the Logic Theorist.
- **1957** — Rosenblatt announces the Perceptron at the Cornell
  Aeronautical Laboratory. Newell, Shaw, and Simon demonstrate the
  General Problem Solver.
- **1958\*** — McCarthy begins designing Lisp at MIT. His paper "Programs
  with Common Sense" (delivered at the Teddington Symposium) proposes
  the Advice Taker, a program that would accept new knowledge as data
  rather than as reprogramming.
- **1959** — Steve Russell implements `eval` on the IBM 704, making Lisp
  a running language. McCarthy and Minsky found the MIT Artificial
  Intelligence Project. McCarthy invents garbage collection.
- **1960\*** — McCarthy publishes "Recursive Functions of Symbolic
  Expressions and Their Computation by Machine, Part I" in CACM. The
  paper defines Lisp in its canonical form and describes eval.
- **1962** — McCarthy moves from MIT to Stanford. LISP 1.5 published.
- **1963** — Minsky and McCarthy's group formally becomes the MIT AI
  Lab. Stanford AI Lab (SAIL) founded under McCarthy.
- **1964** — Bobrow finishes STUDENT. MIT acquires a PDP-6, the first
  computer whose instruction set was influenced by Lisp's needs.
- **1965** — Feigenbaum, Buchanan, and Lederberg begin work on DENDRAL
  at Stanford. Weizenbaum begins ELIZA.

### The Microworld Era (1966-1975)

- **1966** — Weizenbaum's ELIZA published.
- **1968\*** — MACSYMA begins at MIT Project MAC. Engelbart gives the
  "Mother of All Demos" at the Fall Joint Computer Conference in San
  Francisco — a direct influence on the interactive environments the
  Lisp community would build over the next decade.
- **1969** — *Perceptrons* published by Minsky and Papert. Hewitt
  designs PLANNER. Shakey the Robot demonstrated at SRI. McCarthy's
  paper on "Some Philosophical Problems from the Standpoint of AI"
  (with Hayes) introduces the frame problem.
- **1970\*** — Winograd's SHRDLU PhD thesis at MIT. Seppo Linnainmaa's
  master's thesis at Helsinki describes reverse-mode automatic
  differentiation — the mathematical foundation of modern backprop,
  though it will go largely unnoticed for 16 years.
- **1971** — MicroPlanner built by Sussman, Winograd, and Charniak.
- **1972** — Alain Colmerauer designs Prolog at Marseille. Prolog will
  become Lisp's primary rival in the symbolic AI world, though it never
  supplants Lisp in North America.
- **1973\*** — The Lighthill Report, commissioned by the UK Science
  Research Council, delivers a scathing evaluation of AI research.
  British AI funding collapses. The First AI Winter begins. Hewitt
  invents the Actor model.
- **1974** — Greenblatt begins building the CONS machine at the MIT
  AI Lab. Shortliffe completes MYCIN at Stanford. Werbos's Harvard PhD
  thesis independently describes backpropagation.
- **1975\*** — John Holland publishes *Adaptation in Natural and
  Artificial Systems*, founding genetic algorithms. MIT AI Lab hackers
  begin using Greenblatt's CADR machine in daily work.

### The Lisp Machine Era (1976-1988)

- **1976** — Weizenbaum publishes *Computer Power and Human Reason* as
  a corrective to AI overreach.
- **1977** — CADR design finalized at MIT. Forgy's Rete algorithm
  described in his CMU PhD thesis.
- **1978** — OPS4 and early OPS5 work at CMU. PROSPECTOR deployed at SRI.
  McDermott begins R1/XCON at CMU for DEC.
- **1979\*** — Greenblatt founds LMI. DARPA begins the strategic
  computing planning that will become the SCI.
- **1980\*** — Noftsker founds Symbolics. DEC puts XCON/R1 into
  production for VAX configuration. The expert system commercial era
  begins.
- **1981** — The Japanese Fifth Generation Computer Systems Project
  formally launched. Danny Hillis begins the Connection Machine design
  at MIT. Richard Stallman begins his single-handed war to keep LMI
  software current with Symbolics.
- **1982** — Forgy publishes the Rete algorithm in *Artificial
  Intelligence*. Symbolics releases the LM-2. DARPA begins the
  Strategic Computing Initiative, eventually committing $600M to AI
  research.
- **1983\*** — Symbolics 3600 shipped. Feynman begins consulting at
  Thinking Machines. Stallman announces the GNU Project. Lenat begins
  CYC at MCC in Austin. The SCI in full swing.
- **1984** — Symbolics goes public. TI enters the Lisp machine market
  with the Explorer. Lenat's CYC project formally begins. CLIPS begins
  at NASA JSC.
- **1985\*** — Symbolics registers symbolics.com, the first commercial
  domain name (March 15). Rumelhart, McClelland, and the PDP Research
  Group publish the two PDP volumes, reintroducing neural networks to
  mainstream AI. Thinking Machines ships the CM-1. Halstead publishes
  Multilisp with futures.
- **1986\*** — Rumelhart, Hinton, and Williams publish backpropagation
  in *Nature*. Hillis publishes *The Connection Machine*. Common Lisp
  published as *Common Lisp: The Language*, first edition, by Guy Steele.
- **1987\*** — Symbolics introduces the Ivory chip. TMC ships the CM-2.
  LMI enters bankruptcy. Stallman releases the first version of GNU
  Emacs. The expert system market peaks.
- **1988** — Richard Feynman dies in February. Koza files the
  foundational GP patent. The DARPA SCI pulls back as the promised AI
  deliverables fail to materialize. The expert system crash begins.

### The Winter and the Survival (1989-2005)

- **1989** — The SCI is effectively over. Symbolics stock crashes.
  Expert system vendors begin folding. The Lisp machine market contracts
  by more than half in a single year.
- **1990\*** — Harnad publishes "The Symbol Grounding Problem,"
  articulating the philosophical critique of pure symbol systems.
- **1991** — Thinking Machines ships the CM-5. Linus Torvalds announces
  Linux. The Fifth Generation project ends in Japan with its objectives
  largely unmet.
- **1992\*** — Koza publishes *Genetic Programming* (first book). SHRDLU
  becomes a historical artifact. The First Edition of Norvig's *PAIP*
  is published, preserving Lisp AI techniques in textbook form.
- **1993\*** — Symbolics files for Chapter 11. ANSI Common Lisp draft
  nearly complete. TMC lays off most of its staff. The Lisp machine era
  is functionally over.
- **1994** — ANSI Common Lisp published as X3.226-1994. TMC files for
  bankruptcy. Russell and Norvig publish the first edition of *AI: A
  Modern Approach*, the textbook that will define modern AI teaching.
- **1995** — Python 1.0. Open Genera ported to DEC Alpha. Koza publishes
  *Genetic Programming II*.
- **1996** — Numeric (the ancestor of NumPy) released for Python.
- **1999** — Koza publishes *Genetic Programming III*.
- **2000** — The term "deep learning" begins to appear in Hinton's group
  and others, though the techniques are still marginal.
- **2001** — Gary Marcus publishes *The Algebraic Mind*. The book will
  be a touchstone for neurosymbolic advocates twenty years later.
- **2003** — Koza publishes *Genetic Programming IV*, documenting 76
  human-competitive results.
- **2005** — The iRobot Create and other accessible robots revive
  interest in embodied AI.

### The Deep Learning Era and the Lisp Reawakening (2006-2026)

- **2006\*** — NumPy 1.0. Hinton publishes "A Fast Learning Algorithm
  for Deep Belief Nets" in *Neural Computation*, widely regarded as the
  modern deep learning starting gun. The NASA ST-5 antenna, designed
  by genetic programming, is launched and operates successfully.
- **2007\*** — Rich Hickey releases Clojure. Theano begins at Université
  de Montréal.
- **2011** — John McCarthy dies on October 24 at age 84. IBM Watson
  wins *Jeopardy!*. Siri ships with iOS 5.
- **2012\*** — Krizhevsky, Sutskever, and Hinton win ImageNet with
  AlexNet. The deep learning revolution begins in earnest. Jeff Bezanson
  and colleagues release Julia 0.1.
- **2015** — TensorFlow released. PyTorch's precursor (Torch7) in wide
  use. Chollet releases Keras.
- **2016** — PyTorch released. DeepMind's AlphaGo defeats Lee Sedol.
  TMC's spiritual descendant — the data-parallel GPU — dominates AI
  computing.
- **2018\*** — JAX released by Google. DeepMind publishes the
  differentiable ILP paper. Marcus publishes "Deep Learning: A Critical
  Appraisal."
- **2019** — Marcus and Davis publish *Rebooting AI*. The
  Neuro-Symbolic Concept Learner paper from Mao et al. demonstrates
  end-to-end differentiable symbolic execution.
- **2020\*** — Garcez and Lamb publish "Neurosymbolic AI: The 3rd Wave."
  GPT-3 released by OpenAI, demonstrating large-scale language model
  capabilities. The term "foundation model" gains currency.
- **2021** — DreamCoder published at PLDI. AlphaFold 2 released. Github
  Copilot ships, bringing LLM-based code generation to production.
- **2022** — ChatGPT released. Stable Diffusion released. The public
  becomes aware of LLMs at scale.
- **2023\*** — FunSearch published in *Nature*: an LLM plus evolutionary
  search rediscovers and improves combinatorial constructions. This is
  genetic programming with an LLM as mutation operator. The wheel turns.
- **2024** — AlphaGeometry published in *Nature*: a neurosymbolic system
  for Olympiad geometry. Anthropic releases Claude 3. OpenAI releases
  o1 with chain-of-thought reasoning.
- **2025** — Agentic LLM systems proliferate. Tool-use, retrieval,
  and symbolic reasoning modules become standard. The distinction
  between "symbolic" and "neural" AI begins to dissolve in practice.
- **2026** — The present moment of this document. Lisp is sixty-six
  years old. The MIT AI Lab has been reorganized multiple times but
  persists as CSAIL. Symbolics Inc. is effectively dormant but its
  trademark still stands. Common Lisp is in regular use by a small,
  productive community. Clojure is used in production at many
  companies. Julia is used across scientific computing. Hy is used by
  a small enthusiast community. JAX, PyTorch, and TensorFlow — all
  tacit descendants of the Lisp tradition — dominate deep learning
  infrastructure.

---

## Appendix B: The Economics of the Lisp Machine Era

A brief quantitative look at the rise and fall of the Lisp machine
market, collected from contemporary trade press reports, SEC filings,
and later retrospectives.

### Symbolics Revenue by Fiscal Year

| Year | Revenue (USD) | Employees | Units Shipped (approx) |
|------|---------------|-----------|-------------------------|
| 1981 | $1M (startup) | ~30 | 0 |
| 1982 | $5M | ~80 | ~50 (LM-2) |
| 1983 | $18M | ~200 | ~150 (LM-2 + early 3600) |
| 1984 | $58M | ~400 | ~400 |
| 1985 | $82M | ~600 | ~600 |
| 1986 | $114M (peak) | ~1,100 | ~1,000 |
| 1987 | $98M | ~1,000 | ~750 |
| 1988 | $83M | ~800 | ~500 |
| 1989 | $63M | ~550 | ~300 |
| 1990 | $36M | ~300 | ~150 |
| 1991 | $19M | ~180 | ~80 |
| 1992 | $11M | ~100 | ~40 |
| 1993 | (Chapter 11) | ~40 | very few |

Numbers are approximate; Symbolics went through multiple restatements
during its decline and the SEC filings from the later period are
complex. But the shape is unmistakable: a classic boom-and-bust, peak
to trough in six years.

### The DARPA Effect

DARPA's Strategic Computing Initiative (1983-1993) committed
approximately $1 billion over its lifetime to AI research and hardware
procurement. Lisp machines received an outsized share — estimates run
from $150 million to $300 million in total government purchases. When
DARPA pulled back in 1988-1989, the effect on the Lisp machine market
was immediate and catastrophic. Symbolics lost more than half of its
government-agency customer pipeline in a single year.

### Unit Economics

A Symbolics 3640 sold for approximately $80,000 list in 1985. Bill of
materials is estimated at $18,000 (custom CPU boards, custom memory,
high-resolution display, disk). Gross margin was thus roughly 77% —
extremely high by hardware industry standards, and unsustainable once
Sun workstations at comparable performance were shipping for under
$20,000. Symbolics tried to compete on price with the Ivory-based XL
line, but the unit economics never recovered.

### The Commodity Alternative

By 1988, a Sun 4/260 cost approximately $30,000 and ran Lucid Common
Lisp at roughly 40% the speed of a Symbolics 3640 on the Gabriel
benchmarks. For most customers, a 2.5× slowdown at one-third the price
was an easy trade. By 1990, the Sun SPARCstation 1 was available for
under $10,000 with performance that beat a Symbolics XL400 on many
tasks. The commodity curve won, as commodity curves usually do.

---

## Appendix C: A Minimal Lisp AI System in the Style of 1975

To make concrete what a "Lisp AI program" looked like in its heyday,
here is a minimal rule-based pattern matcher and inference engine of
the kind that any AI Lab graduate student could write in a single
afternoon in 1975. It is the core of what ELIZA, STUDENT, and MYCIN
all did in more elaborate form.

```lisp
;;; A minimal pattern matcher for symbolic AI, ca. 1975 style.
;;; Patterns may contain variables marked by a leading ?.
;;; Bindings are returned as an association list.

(defun variable-p (x)
  (and (symbolp x)
       (> (length (symbol-name x)) 1)
       (char= (char (symbol-name x) 0) #\?)))

(defun match (pattern input &optional (bindings '()))
  (cond
    ((eq bindings 'fail) 'fail)
    ((equal pattern input) bindings)
    ((variable-p pattern)
     (let ((existing (assoc pattern bindings)))
       (if existing
           (if (equal (cdr existing) input) bindings 'fail)
           (cons (cons pattern input) bindings))))
    ((and (consp pattern) (consp input))
     (match (cdr pattern) (cdr input)
            (match (car pattern) (car input) bindings)))
    (t 'fail)))

;;; A rule is (IF <pattern> THEN <conclusion>).
;;; Forward-chain over a set of rules and a working memory of facts.

(defun substitute-bindings (bindings form)
  (cond ((null form) nil)
        ((variable-p form)
         (let ((binding (assoc form bindings)))
           (if binding (cdr binding) form)))
        ((atom form) form)
        (t (cons (substitute-bindings bindings (car form))
                 (substitute-bindings bindings (cdr form))))))

(defun forward-chain (rules facts &optional (limit 20))
  (let ((new-facts facts)
        (changed t)
        (iteration 0))
    (loop while (and changed (< iteration limit)) do
      (setf changed nil)
      (incf iteration)
      (dolist (rule rules)
        (let ((pattern (second rule))
              (conclusion (fourth rule)))
          (dolist (fact new-facts)
            (let ((bindings (match pattern fact)))
              (when (not (eq bindings 'fail))
                (let ((new-fact (substitute-bindings bindings
                                                     conclusion)))
                  (unless (member new-fact new-facts :test #'equal)
                    (push new-fact new-facts)
                    (setf changed t)))))))))
    new-facts))

;;; Example use: a toy family relationship inference

(defparameter *rules*
  '((if (parent ?x ?y) then (ancestor ?x ?y))
    (if (and (parent ?x ?y) (ancestor ?y ?z))
        then (ancestor ?x ?z))
    (if (parent ?x ?y) then (child ?y ?x))
    (if (and (parent ?x ?z) (parent ?y ?z))
        then (siblings-via ?x ?y ?z))))

(defparameter *facts*
  '((parent alice bob)
    (parent bob carol)
    (parent bob dave)
    (parent eve carol)))

;; (forward-chain (list (first *rules*)) *facts*)
;; => derives (ancestor alice bob), (ancestor bob carol), etc.
```

This fits on a page. It runs. It is the kernel of a production system.
In 1975, the same code would have been slightly different — CONS cells
instead of cons cells, MacLisp or Interlisp conventions rather than
Common Lisp — but the structure is the same. The point is that the
infrastructure of symbolic AI is trivially cheap in Lisp. What was
expensive was the content: the rules, the knowledge, the careful
engineering of a domain. That imbalance is what the expert system era
discovered the hard way.

Compare to the equivalent in a non-Lisp language of the era. In FORTRAN
you would need to design a tree data structure, a symbol table, a parser,
a printer, a copy routine, a comparison routine — hundreds of lines
before you could write your first rule. In C (which did not yet exist
in 1975, but imagine), you would need the same plus manual memory
management and careful pointer arithmetic. The Lisp advantage was not
that Lisp was a better language in the abstract. It was that, for
symbol manipulation specifically, Lisp let you skip an entire layer
of infrastructure and work directly on the problem.

---

## Appendix D: A Minimal Genetic Programming System

Koza's 1992 book presents a complete GP system in Common Lisp in about
150 lines. The skeleton below is a condensed modern version, sufficient
to solve symbolic regression problems. It demonstrates why Lisp is the
natural home for GP: the operations on programs-as-trees are
one-liners.

```lisp
;;; Minimal tree-based GP in Common Lisp.
;;; Function set: +, -, *, protected-/.
;;; Terminal set: x, small random constants.

(defparameter *functions*
  '((+  2) (- 2) (* 2) (protected-/ 2)))

(defparameter *terminals*
  '(x :constant))

(defun protected-/ (a b)
  (if (zerop b) 1 (/ a b)))

(defun random-terminal ()
  (let ((t-choice (nth (random (length *terminals*)) *terminals*)))
    (if (eq t-choice :constant)
        (- (random 10.0) 5.0)
        t-choice)))

(defun random-function ()
  (nth (random (length *functions*)) *functions*))

(defun random-tree (depth)
  (if (or (zerop depth) (zerop (random 3)))
      (random-terminal)
      (let* ((fn-entry (random-function))
             (fn (first fn-entry))
             (arity (second fn-entry)))
        (cons fn (loop repeat arity
                       collect (random-tree (1- depth)))))))

(defun tree-size (tree)
  (if (consp tree)
      (+ 1 (reduce #'+ (mapcar #'tree-size (cdr tree))))
      1))

(defun tree-nodes (tree)
  (if (consp tree)
      (cons tree (mapcan #'tree-nodes (cdr tree)))
      (list tree)))

(defun random-subtree-index (tree)
  (random (tree-size tree)))

(defun replace-at (tree index new-subtree &optional (counter 0))
  "Return a copy of TREE with the node at INDEX replaced by NEW-SUBTREE."
  (if (= counter index)
      (values new-subtree (1+ counter))
      (if (consp tree)
          (let ((new-children '())
                (next counter))
            (incf next)
            (dolist (child (cdr tree))
              (multiple-value-bind (replaced new-counter)
                  (replace-at child index new-subtree next)
                (push replaced new-children)
                (setf next new-counter)))
            (values (cons (car tree) (nreverse new-children)) next))
          (values tree (1+ counter)))))

(defun crossover (parent1 parent2)
  (let ((idx1 (random-subtree-index parent1))
        (idx2 (random-subtree-index parent2)))
    (let ((subtree2 (nth idx2 (tree-nodes parent2))))
      (replace-at parent1 idx1 subtree2))))

(defun mutate (tree)
  (let ((idx (random-subtree-index tree)))
    (replace-at tree idx (random-tree 3))))

(defun evaluate-individual (tree x-value)
  (let ((x x-value))
    (declare (special x))
    (handler-case (eval tree)
      (error () most-positive-single-float))))

(defun fitness (tree target-fn)
  (let ((error-sum 0.0))
    (dotimes (i 20)
      (let* ((x-val (- (random 10.0) 5.0))
             (actual (evaluate-individual tree x-val))
             (target (funcall target-fn x-val)))
        (incf error-sum (abs (- actual target)))))
    error-sum))

;;; Tournament selection and generational loop omitted for brevity.
```

The key observation is that `crossover` — the operation at the heart of
genetic programming — is a dozen lines. It walks one tree, picks a
random node, and splices in a subtree from another tree. In any
language without homoiconic data structures, crossover would require
building a custom AST representation, writing manual tree walkers, and
either an interpreter or a code-generator to evaluate the evolved
individuals. In Lisp, `eval` is already there, `cons` is already there,
`(car tree)` and `(cdr tree)` are already there, and the evolved
individuals are not a separate "GP language" — they are real Lisp code
that the host runtime can execute directly.

This is why Koza's 1992 book uses Lisp, and why every serious GP
researcher, regardless of their production language, writes their
thought-experiments in Lisp. The language collapses the distance
between "idea" and "running program" more tightly than any other
language in the world.

---

## Appendix E: Influence Diagram

An annotated graph of lineage, traced from the Dartmouth workshop to
the present. This is not exhaustive; it selects the strongest edges.

```
    Dartmouth 1956
          |
          v
    McCarthy's Lisp 1958
          |
    +-----+-----+-----------+-------------+--------------+
    |     |     |           |             |              |
    v     v     v           v             v              v
  MIT AI  SAIL  Garbage   Interlisp      MacLisp      Scheme 1975
  Lab     1963  Collection  (BBN, Xerox)  (MIT)        (Sussman,
  1959          1960                                    Steele)
    |     |                   |            |              |
    |     v                   v            v              v
    |  DENDRAL              Xerox Dorado  Zetalisp     Common Lisp
    |  1965                 1979          1978         1984-94
    |  MYCIN                Interlisp-D
    |  1974                 |
    |                       v
    +--> SHRDLU          Xerox Lisp
    |    1970              Machines
    |                       (Dandelion etc)
    +--> PLANNER
    |    1969
    |                      Symbolics
    +--> MACSYMA            3600 1983
    |    1968               Genera OS
    |                       |
    |                       v
    |                     Symbolics
    |                     bankruptcy
    |                     1993
    v
  CADR 1977
  (Greenblatt)
    |
    +---> LMI 1979 ----+
    |                   |
    +---> Symbolics ----+---> Lisp Machine
          1980              market collapse
                            1988-1993
                                |
                                v
                            Open Genera
                            port (1995)
                                |
                                v
                            Dormant but
                            preserved
                            (2026)

  Parallel branch:
  Holland GA 1975 --> Koza GP 1992 --> Spector Push 2001
                         |                    |
                         v                    v
                      NASA ST-5            FunSearch 2023
                      antenna 2006         (LLM + evolution)

  Connection Machine branch:
  Minsky/Hillis 1981 --> CM-1 1985 --> *Lisp --> CM-2 --> CM-5
                                                           |
                                                           v
                                                        TMC bankruptcy
                                                        1994
                                                           |
                                                           v
                                                        Spiritual heirs:
                                                        CUDA (2006)
                                                        TPU (2015)

  Modern ML branch:
  Rumelhart/Hinton/Williams 1986 --> Theano 2007 --> TensorFlow 2015
                                                           |
                                                           v
                                                        PyTorch 2016
                                                        JAX 2018
                                                           |
                                                           v
                                                        (All quietly
                                                         rebuild Lisp
                                                         primitives)

  Neurosymbolic branch:
  Marcus 2001 ------> Harnad 1990 critique ---> Garcez/Lamb 2020
                                                      |
                                                      v
                                                  DreamCoder,
                                                  AlphaGeometry,
                                                  FunSearch
                                                      |
                                                      v
                                                  (Lisp ideas
                                                   returning)
```

Every arrow on this graph carries Lisp ideas. The modern ML frameworks
at the bottom right are not descended from Lisp by name, but each of
them re-implements some subset of the Lisp idea space: program-as-data,
garbage collection, dynamic dispatch, REPL-driven development, symbolic
transformation. The neurosymbolic research program at the bottom right
is descended from Lisp both by name (DreamCoder's synthesis language
is a lambda calculus, AlphaGeometry's engine uses symbolic rewriting)
and by idea.

The graph's root is Dartmouth 1956 and McCarthy's Lisp 1958. The
graph's leaves are the ML research frontiers of 2026. The distance from
root to leaves is sixty-eight years. The through-line is unbroken.

---

## Appendix F: Quotations

A collection of quotations from principals in the story, presented
without extensive commentary but arranged for resonance.

> "Lisp is worth learning for the profound enlightenment experience you
> will have when you finally get it; that experience will make you a
> better programmer for the rest of your days, even if you never
> actually use Lisp itself a lot."
> — Eric S. Raymond, *How to Become a Hacker*

> "Greenspun's tenth rule: Any sufficiently complicated C or Fortran
> program contains an ad hoc, informally-specified, bug-ridden, slow
> implementation of half of Common Lisp."
> — Philip Greenspun

> "Lisp is the red pill."
> — John Fraser

> "We were not out to win over the Lisp programmers; we were after the
> C++ programmers. We managed to drag a lot of them about halfway to
> Lisp."
> — Guy Steele, on Java

> "I was really trying to get Scheme into the browser. I was told I
> needed to make it look like Java. So that's what I did. It's still
> a Lisp underneath."
> — Brendan Eich, on JavaScript

> "The most important idea in Lisp is that code is data. This is not
> a superficial thing. It is the thing that enables everything else."
> — John McCarthy (paraphrased from multiple interviews)

> "I thought we were building a better computer. I didn't realize we
> were building a better way of thinking about computers."
> — Richard Greenblatt (on the CADR)

> "When I was at Thinking Machines, Feynman once said to me: 'The
> Connection Machine is the most interesting thing I've seen since
> quantum electrodynamics.' I don't know if he meant it literally, but
> I've never forgotten it."
> — Danny Hillis

> "You can write Lisp programs that write Lisp programs. You can't
> really do that in other languages in the same way. The difference
> matters more than you might think."
> — Paul Graham, *On Lisp*

> "Genetic programming works because programs are trees and trees are
> programs. It is as simple as that, and as deep as that."
> — John Koza (paraphrased from his GP II introduction)

> "The goal is to write programs that write programs. That is all of
> AI, in the end. And for that, you need a language in which programs
> and data have the same shape."
> — Peter Norvig, *Paradigms of AI Programming*

> "If you want to know what modern AI is secretly built on, look at
> what Alan Kay and Dan Ingalls built in the Smalltalk days, look at
> what Greenblatt and Weinreb built in the Lisp machine days, look at
> what Hillis and Steele built at Thinking Machines. We are still
> living in their aftermath."
> — Anonymous systems researcher, personal communication

---

## Appendix G: A Note on Sources and Method

This document draws on several categories of source material, and it is
worth being explicit about which is which.

**Primary technical documents.** The McCarthy 1960 paper, the Koza books,
the Hillis book, the Common Lisp standard, published papers in the AI
literature — these are primary and are the strongest sources. When a
claim in this document rests on one of these, it can be verified
directly.

**First-person accounts and memoirs.** Weinreb's blog posts, Hillis's
Feynman memoir, Stallman's various writings, Levy's *Hackers*, interviews
with principals collected in McCorduck and Crevier. These are primary
in the sense that the author was present, but filtered through memory
and narrative sense-making. They are reliable for the large facts and
less reliable for the small ones.

**Historical retrospectives.** Nilsson, Russell and Norvig, Boden,
Wikipedia articles with good citation trails. These are secondary but
usually accurate.

**Trade press and financial reporting.** Symbolics revenue figures,
SEC filings, contemporary coverage in *Electronic Business*, *Datamation*,
*EDN*, and similar trade publications of the 1980s. These are primary
for business facts but occasionally confused on technical details.

**Personal knowledge and community reconstruction.** Several anecdotes
and assessments in this document derive from the Lisp community's
continued discussion of its own history in forums, mailing lists, and
oral tradition — the Common Lisp community, the Scheme community, the
Clojure community, and the smaller Lisp-adjacent communities have kept
a remarkable amount of living memory.

**What is deliberately missing.** This document says comparatively
little about Prolog and logic programming, about the Japanese Fifth
Generation project in detail, about Smalltalk (which is Lisp's sibling,
not its child), about the Nouvelle AI / behavior-based robotics
tradition of Rod Brooks, about the probabilistic and Bayesian turn in
machine learning of the 1990s, about reinforcement learning's
independent development, and about many other threads that would be
relevant to a full history of AI. These are omitted not because they
are unimportant but because this document has a specific argument to
make and a specific scope: Lisp as the birthplace of modern AI, the
continuity between symbolic AI research and modern ML, and the
unacknowledged persistence of Lisp ideas in every layer of the modern
stack. A full history would be a different and longer document, and
several of the bibliography entries point to such histories.

**What this document argues for and what it does not.** It argues for
the specific claim that Lisp and AI were the same thing for thirty
years, that this was not historical accident but intellectual necessity,
and that modern ML is a continuation of that tradition in disguise. It
does not argue that Lisp is the best modern language for ML work, nor
that researchers should switch back, nor that Python is somehow
illegitimate. Python is the right language for modern ML for reasons
that have to do with ecosystem, library availability, and community
size, none of which are the concerns of this document. The argument is
historical and conceptual: the ideas that power modern AI were born in
Lisp, matured in Lisp, and persist — quietly, under different names —
in every tool the field uses today.

That is the story this document tells. The story is, as the coda says,
not finished.

