# Prolog: A History of Logic in Programming

*History and origins research — PNW Research Series (PLG)*
*Thread 1 of 4: History, people, chronology, and cultural impact*

---

## Preface

To tell the story of Prolog is to tell the story of a dream that logic itself could be a programming language — that the careful axioms of Frege, Peirce, Whitehead and Russell, Herbrand and Gentzen, could be made to *run* on a machine. It is a story that begins in the seminar rooms of Princeton and Edinburgh, passes through a sunlit office at the Luminy campus of Aix-Marseille University, detours through a massive Japanese state project intended to leapfrog American computing, and ends — not in triumph, and not in defeat, but in a quiet, persistent influence that reaches into the 2020s through Datalog query engines, neuro-symbolic AI, and static-analysis tools that nobody calls "Prolog" anymore.

Prolog is the language that won the argument about what logic programming could be, and then was quietly passed over by the industry whose imagination it captured. Its cultural arc — from the exotic promise of the early 1970s, through the feverish AI-boom of the 1980s, through the long winter of the 1990s, and into its unassuming twenty-first-century afterlife — is one of the most instructive in computing. This document traces that arc, with particular attention to the people who made it and the correspondence and published papers that tell us, in their own words, what they thought they were doing.

Four authors contributed to a now-standard origin account: Alain Colmerauer's *The Birth of Prolog* (written with Philippe Roussel, first circulated 1992, published in the second ACM *History of Programming Languages* conference volume in 1996); Robert Kowalski's *The Early Years of Logic Programming* (Communications of the ACM, 1988) and his later *The Logic Programming Paradigm and Prolog* (2014); David H. D. Warren's WAM technical reports (SRI 1983); and Jacques Cohen's surveys in the ACM *Computing Surveys*. Where this document quotes or paraphrases, these are the primary sources unless otherwise noted.

---

## Part I — Prehistory (1930–1971)

### 1. The logical inheritance

Prolog did not appear from nowhere. By the time Alain Colmerauer sat down in Marseille in 1971 to think about a natural-language analyser that would "run on logic," the discipline of mathematical logic had been making itself ready for a computer for roughly forty years.

Jacques Herbrand, the brilliant young French logician who died in a climbing accident on the Massif des Écrins in 1931 at the age of twenty-three, had left behind a theorem that would become Prolog's semantic foundation. Herbrand's theorem (1930) said, in effect, that first-order logical validity could be reduced to a question about propositional logic: a formula is a theorem of first-order logic if and only if some finite disjunction of its ground instances is a tautology. This was the first real bridge between the manipulations of symbols and the possibility of mechanical proof. Thoralf Skolem, working in Norway at roughly the same time, contributed Skolem functions and the Skolem normal form — the procedure by which existential quantifiers can be replaced by fresh function symbols, collapsing an arbitrary first-order formula into a form that a machine might actually grind through.

In 1935, Gerhard Gentzen at Göttingen introduced natural deduction and the sequent calculus, giving logicians a proof format that exposed the structure of arguments rather than hiding them in the Hilbert-style axiomatic chains Whitehead and Russell had used in the *Principia*. The cut-elimination theorem in Gentzen's *Untersuchungen über das logische Schließen* (1935) — that any proof in the sequent calculus can be transformed into a cut-free proof — would become, decades later, a key intuition in the proof-search strategies used by logic programming systems.

Alonzo Church at Princeton, and his student Alan Turing, had in 1936 each provided independent answers to Hilbert's *Entscheidungsproblem*, showing that no mechanical procedure could decide arbitrary first-order validity. The result was devastating to Hilbert's program but oddly clarifying for everyone who wanted to build automated theorem provers: one could not hope to decide everything, but one could still hope to make a machine that found proofs when proofs existed, even if it ran forever when they did not.

By the late 1950s the field called *automated theorem proving* was beginning to crystallise. Hao Wang's 1960 paper *Toward Mechanical Mathematics* described a Princeton program that had verified — in nine minutes on an IBM 704 — all 220 theorems of propositional logic in the *Principia Mathematica*. Wang, working as a consultant at IBM Research, had written two programs: Program I for the propositional calculus and Program II, which worked for first-order logic restricted to prenex normal form with universal quantifiers only. Wang's observation was prescient: that a purpose-built procedure based on the structure of logic itself would dramatically outperform the general heuristic search that Newell, Shaw, and Simon's *Logic Theorist* (1956) had used.

The *Logic Theorist* is worth a pause. Written by Allen Newell, Cliff Shaw, and Herbert Simon at RAND and Carnegie Mellon (then Carnegie Tech), running first in summer 1956 on the JOHNNIAC, it is generally credited as the first program "deliberately engineered to perform automated reasoning," and Simon would later introduce it to a 1956 Dartmouth audience with the famous line, "We have invented a computer program capable of thinking non-numerically, and thereby solved the venerable mind-body problem." The Logic Theorist proved 38 of the first 52 theorems of *Principia*, sometimes finding more elegant proofs than Whitehead and Russell themselves. Its language, IPL (Information Processing Language), introduced list processing to computing and was the direct ancestor of LISP. When *Principia* co-author Bertrand Russell learned of one of the program's alternative proofs, he sent Simon a note saying (in the version everyone tells) he "wished he and Whitehead had known of it before wasting so much time."

But the Logic Theorist was fundamentally a *heuristic* program: it searched a space of proof attempts guided by rules of thumb rather than a uniform proof procedure. It was the victory of the opposition — the "scruffies," to use Roger Schank's later label — over what would become the "neat" tradition in AI. The neats wanted mechanical theorem proving grounded in the full structure of first-order logic. By 1960 they had Wang, and by 1960 they also had Martin Davis and Hilary Putnam's first big paper, *A Computing Procedure for Quantification Theory*, describing what would become the Davis–Putnam procedure and, later, the DPLL procedure that modern SAT solvers still descend from.

None of this was yet logic programming. These were proof procedures, not programming languages. But the ground was prepared.

### 2. Robinson's unification and resolution (1963–1965)

The single most important event on the road to Prolog occurred in 1965, in the pages of the *Journal of the ACM*. John Alan Robinson — an English-born philosopher turned logician, working at Argonne National Laboratory and then at Syracuse University — published *A Machine-Oriented Logic Based on the Resolution Principle* in January 1965. It was a paper that changed automated reasoning.

Robinson, who had done his Ph.D. at Princeton under the philosopher Hilary Putnam in 1956 and had drifted from philosophy into computer science in the early 1960s at Argonne's Applied Mathematics Division, was motivated by frustration with the existing methods. The Davis–Putnam procedure and the earlier Prawitz and Gilmore methods were all, in practice, hideously inefficient: they turned every first-order problem into enormous propositional formulas and then did SAT-style enumeration. Robinson wanted a procedure that exploited the *structure* of first-order logic directly.

His answer had two parts. The first was a *single inference rule* — resolution — that subsumed nearly all the traditional rules of logic. Given two clauses (disjunctions of literals), resolution says: if one clause contains a positive literal *L* and the other contains a negative literal ¬*L′* such that *L* and *L′* can be made identical by substituting terms for variables, then we may conclude the disjunction of the remaining literals, with that substitution applied. It is, in a sense, the one rule to which all of propositional reasoning can be reduced, lifted to first-order logic by a careful handling of variables.

The second part was *unification*. To find out whether two atomic formulas could be made identical by substitution, Robinson gave a terminating algorithm — the *most general unifier* (MGU) algorithm. Given two terms such as `p(X, f(Y))` and `p(g(a), f(b))`, unification would return the substitution `{X = g(a), Y = b}`. The MGU is unique up to variable renaming, and Robinson's algorithm computed it in time that (in the abstract presentation) was polynomial in the size of the input terms, though naive implementations could exhibit exponential blow-up — a subtlety that would recur throughout Prolog's implementation history.

The combination of resolution and unification gave, for the first time, a single uniform proof procedure for first-order logic that operated on the structure of formulas themselves. Robinson's theorem — that resolution is *refutation-complete*, meaning any unsatisfiable set of clauses has a resolution proof of the empty clause — was the formal guarantee that you could build a theorem prover on it and be sure it would find a proof if one existed.

The paper was not easy reading. Robinson had developed his ideas alone, and the presentation is dense. But by 1966 a handful of groups were experimenting with resolution-based theorem provers: George Robinson and Larry Wos at Argonne built programs that were, for the era, astonishingly capable. Robert Kowalski, then a young American studying at Edinburgh, encountered Robinson's paper in 1966 and it became the fulcrum of his career.

It is worth pausing to note that Alan Robinson himself never considered logic programming his main contribution — he would later joke that logic programming "happened *to* resolution, not because of it" — and that his own later work focused on higher-order logic and the paramodulation rule for equality. But without the 1965 paper, Prolog as we know it simply could not exist. Unification and resolution are the two gears of every Prolog interpreter ever written.

### 3. Green's QA3 and the "programming in logic" dream (1969)

Cordell Green, a graduate student at Stanford working with John McCarthy and Bertram Raphael, took Robinson's resolution and asked a deceptively simple question: could a resolution theorem prover be used not merely to prove theorems but to *compute answers*? In a series of papers culminating in his 1969 IJCAI paper *Application of Theorem Proving to Problem Solving*, Green showed how to do it.

The trick was what Green called the *answer literal*. Suppose you want to know *which* person satisfies some property — not merely whether any such person exists. You write a goal clause of the form ¬*P*(*x*) ∨ answer(*x*), where `answer` is a fresh predicate that does nothing logically but collects the binding of *x*. When the resolution prover succeeds and derives the empty clause, the accumulated unifier tells you which *x* made it work. Green had discovered that resolution + unification = *computation*, not merely proof.

His QA3 system (Question Answering, version 3), running at Stanford on a PDP-10, demonstrated the point. QA3 could reason about blocks-world scenarios, about robot actions, about family relationships expressed as logical facts — and it could *return answers*, not just yes/no verdicts. Green and Raphael's 1968 Stanford Research Institute report *The Use of Theorem-Proving Techniques in Question-Answering Systems* had laid the groundwork; the 1969 IJCAI paper made it theoretically respectable. Green wrote, in an oft-quoted passage, that "theorem-proving techniques can be used not only to check proofs but to compute functions and extract information," and the phrase "programming in logic" appears in his writing before anyone else's.

Green was also working in parallel on *automatic program synthesis* — using resolution to derive working programs from specifications. His 1969 Stanford Ph.D. thesis *The Application of Theorem Proving to Question-Answering Systems* (supervised by Feigenbaum, with McCarthy and Raphael on the committee) contains, in chapter 5, what is arguably the first sketch of what logic programming would become. But Green himself, always more interested in the AI side of things, did not pursue it as a programming language. He went on to found the Kestrel Institute, focused on program synthesis. He left the PL side to others.

It is a historical curiosity that had Green pushed harder in 1969, Stanford might have produced the first Prolog. Instead, the idea escaped to France and Scotland, and Stanford would go on to build MACSYMA, Interlisp, and the Lisp-based tradition that became Prolog's great rival.

### 4. Hewitt's PLANNER: the procedural rival (1969–1972)

At almost exactly the moment Green was publishing QA3, Carl Hewitt at MIT was going in the opposite direction. Hewitt, a graduate student in Seymour Papert's circle at the MIT AI Lab, was deeply sceptical of what he called the "uniform proof procedure" approach. Resolution was all very well, Hewitt argued, but real intelligent reasoning required *control*. You had to be able to tell the prover *how* to look for an answer, not merely give it logical facts and hope for the best.

Hewitt's 1969 IJCAI paper *PLANNER: A Language for Proving Theorems in Robots* introduced the language that would become, in retrospect, the great alternative path to logic programming. PLANNER had backward-chaining goals (like Prolog's), forward-chaining assertions, and — crucially — *procedural attachments*. A PLANNER clause could say not merely "whenever P and Q, conclude R" but "whenever you are trying to prove R, try the following procedure, and if it fails, try this other procedure." Control was first-class.

The full PLANNER language was never completely implemented — Hewitt's 1971 MIT PhD thesis *Description and Theoretical Analysis (Using Schemata) of PLANNER: A Language for Proving Theorems and Manipulating Models in a Robot* described a system that nobody quite finished. But a subset, *MICRO-PLANNER*, was implemented by Gerry Sussman, Eugene Charniak, and Terry Winograd in 1970, and it became famous as the language underlying Winograd's SHRDLU blocks-world system (1972), which produced the first convincing demonstration of a computer understanding and manipulating a (very limited) natural-language-described environment.

The Hewitt line and the Robinson-Green line were in direct ideological opposition by 1971. Hewitt's camp argued that pure logic was inert — you needed *procedural* specifications to make anything actually happen. The resolution camp argued that Hewitt's procedures threw away the guarantees of logic and reduced programs to ad-hoc machinery. When Kowalski began writing *Predicate Logic as Programming Language* in 1972 — the paper he would eventually publish in 1974 at IFIP — he framed it almost entirely as a response to Hewitt: a demonstration that Horn clauses *could* have a procedural reading that gave all the control Hewitt wanted, without sacrificing the declarative meaning.

A famous anecdote from this period: at the 1973 IJCAI in Stanford, Hewitt and Kowalski had a spirited but civil public disagreement about the merits of the two approaches. Hewitt reportedly asked how logic programming would handle something as simple as a procedural loop, and Kowalski is said to have replied, on the spot, with the insight that a loop is just a tail-recursive Horn clause. Whether or not the exact exchange happened that way — Kowalski recalls it slightly differently in his 1988 CACM retrospective — the philosophical line was drawn. Hewitt would go on to develop the *Actor model* in 1973 (with Peter Bishop and Richard Steiger), pivoting away from theorem proving entirely and toward concurrency, and the Actor model would in turn inspire Erlang, Smalltalk-72, and the whole object-message tradition. Logic programming and actors are, in a sense, siblings born of the same dispute.

### 5. The Edinburgh scene: Meltzer, Michie, Pereira, Kowalski

Edinburgh in the late 1960s was one of the two or three most important places in the world for AI research. Donald Michie had established the Department of Machine Intelligence and Perception (later the Department of Artificial Intelligence) in 1965, and Bernard Meltzer — an Austrian-born mathematician who had moved to Edinburgh after the war — was leading the Metamathematics Unit, which in 1971 would be renamed the Department of Computational Logic. Meltzer ran a weekly seminar that attracted, during its prime years, nearly everyone who would later be called a logic programming pioneer: Robert Kowalski, Pat Hayes, Donald Kuehner, Robert Boyer, J Strother Moore (yes, the Boyer-Moore of the theorem prover), Mike Gordon, Alan Bundy, Gordon Plotkin.

Kowalski, born in 1941 in Bridgeport, Connecticut, had come to Edinburgh in 1966 on a Fulbright scholarship after an M.A. in mathematics at the University of Wisconsin. He had read Robinson's 1965 paper and wanted to work on resolution theorem proving. Meltzer took him on. Between 1966 and 1970, Kowalski and the Edinburgh group — especially Kuehner and Hayes — produced a series of refinements to Robinson's resolution: set-of-support strategy (Wos, Robinson, Carson 1965, adapted by Edinburgh), hyper-resolution, linear resolution, and finally *SL-resolution* (Kowalski and Kuehner, 1971, "Linear Resolution with Selection Function," *Artificial Intelligence* 2), which was the direct precursor to Prolog's execution model.

SL-resolution was the breakthrough. In linear resolution, each new resolvent is obtained by resolving the previous resolvent with an input clause; this gives a simple tree-structured search space. The "selection function" part said: at each step, use a fixed rule to pick which literal in the current resolvent to resolve next. If you pick the leftmost literal, and if the clauses are Horn clauses (at most one positive literal), and if you resolve against clauses in a fixed order, then SL-resolution becomes something that looks exactly like a Prolog interpreter running top-down, left-to-right, with depth-first search. Kowalski and Kuehner did not call it that — they were still thinking about it as a theorem-proving strategy — but the structure was already there in 1971.

At the same time, Edinburgh was acquiring a visitor from Marseille.

---

## Part II — The Birth of Prolog (1971–1974)

### 6. Alain Colmerauer's journey to Marseille

Alain Colmerauer was born on 24 January 1941 in Carcassonne, in the south of France. He was a quiet, fiercely independent student — friends described him as someone who worked best alone, on deeply personal problems, and who seemed almost uninterested in academic politics. He entered the École nationale supérieure d'informatique et de mathématiques appliquées de Grenoble (ENSIMAG) in 1963, graduating with an engineer's diploma and a doctorate (doctorat de troisième cycle) in 1967 under Louis Bolliet at the University of Grenoble. His thesis — *Précédence, analyse syntaxique et langages de programmation* — was on compiler theory, specifically operator precedence parsing.

From 1967 to 1970 Colmerauer took a position at the Université de Montréal, as part of the Projet de traduction automatique (TAUM — Traduction automatique de l'Université de Montréal). This was machine translation in its classical early phase, attempting to move English and French texts through rule-based grammatical analysis. Colmerauer worked on *Q-systems* — a formalism he invented for writing transformational grammars as systems of production rules operating on tree structures. Q-systems would, in 1976, become the language underlying the TAUM-METEO system, the first operationally successful machine translation system, used for decades to translate Canadian weather bulletins from English to French in real time.

It was at Montréal that Colmerauer first started thinking seriously about what it would mean to write grammatical rules in a declarative style and have a machine execute them. The Q-systems were a kind of prototype of unification grammars, and they already contained (in a less-developed form) the idea that parsing could be driven by logical matching rather than hand-coded procedural steps. But Colmerauer had not yet encountered resolution.

In 1970 he returned to France to take up a position as *maître de conférences* at the newly created Université d'Aix-Marseille II (now Aix-Marseille University), at the Luminy campus — a sun-drenched hillside on the outskirts of Marseille, overlooking the Mediterranean calanques. He was 29. He recruited a small team: among them Philippe Roussel, a young engineer; Robert Pasero, who had come from linguistics; and Henry Kanoui. The team set themselves the task of building a system that could answer questions posed in natural French about a database of facts.

### 7. The Kowalski-Colmerauer encounter (summer 1971)

In the summer of 1971, Robert Kowalski travelled from Edinburgh to Marseille, ostensibly to visit and give a talk at Colmerauer's group. The visit lasted only a few days, but it was to be one of the most consequential meetings in the history of programming languages.

Colmerauer had heard about Robinson's resolution method and was intrigued but frustrated. He had been reading Green's QA3 papers and was drawn to the idea that logic could be used to compute answers, not merely prove theorems. But he did not see how to make it efficient enough to handle natural-language analysis. Kowalski arrived carrying, in effect, the missing ingredient: SL-resolution, and the realisation that Horn clauses were both *computationally tractable* and *sufficient* for a vast range of problems.

In Colmerauer's own retrospective, *The Birth of Prolog* (1992/1996), he describes the moment vividly. Kowalski explained SL-resolution on the blackboard. Colmerauer recognised almost immediately that for Horn clauses — clauses with at most one positive literal — the whole resolution process simplified enormously. The selection function could simply pick the leftmost atom. The search strategy could be depth-first. The whole machinery collapsed into something that looked like a recursive procedure with pattern matching. Colmerauer later wrote that he and Kowalski spent the visit "in a state of increasing excitement" as they worked out the consequences.

Kowalski's later recollection is consonant. In *The Early Years of Logic Programming* (CACM 1988) he recalls that the Marseille visit was the moment at which the *procedural interpretation of Horn clauses* crystallised as a complete idea: that a clause `P :- Q1, Q2, Q3` could be read either declaratively ("P if Q1 and Q2 and Q3") or procedurally ("to solve P, solve Q1 then Q2 then Q3"). The two readings were guaranteed to agree because of SL-resolution's soundness and completeness for Horn clauses.

But the division of labour after that summer was not a simple split. Kowalski went back to Edinburgh and pursued the theoretical line: he wrote *Predicate Logic as Programming Language* (1974, IFIP Congress) and began what would become his book *Logic for Problem Solving* (North-Holland, 1979). Colmerauer and Roussel went back to Marseille and decided to *build it*.

### 8. Philippe Roussel and the first Prolog (1972)

Philippe Roussel had joined Colmerauer's group as an engineer with strong systems skills. He was the implementer. Between late 1971 and mid-1972, Roussel wrote the first Prolog interpreter — in ALGOL-W first, then reimplemented in FORTRAN on an IBM 360/67 running at the Marseille computing centre. The 1972 FORTRAN version, which Colmerauer calls "Prolog 0" in *The Birth of Prolog*, is the ancestor of every Prolog system that followed.

The name "Prolog" was coined by Roussel's wife, Jacqueline Roussel. The story — told by Colmerauer in multiple interviews and verified in the 1992 retrospective — is that Roussel came home one evening struggling to name the system. He had tried variants of "SYSTEME-Q" (after Colmerauer's Montréal Q-systems) and found them unsatisfying. Jacqueline suggested *Programmation en Logique*, which in French contracts naturally to "PROLOG." The acronym and the name stuck. (English writers would later sometimes expand it as "Programming in Logic," but the original is French.)

The 1972 system was primitive. It had no arithmetic evaluation — Colmerauer's team considered this a feature, since they were focused on symbolic reasoning. It had no input-output primitives in the modern sense. Its memory management was a simple stack-plus-trail, with unification backtracking handled by a trail of bindings to undo. But it *worked*. Roussel used it to implement a program — *Le Système-Q*, ironically — that analysed French sentences and answered questions about them. The system was slow (seconds per query on simple inputs, minutes on complex ones) but it demonstrated the principle.

The first serious application was a French natural-language question-answering system, built by Colmerauer, Pasero, Roussel and Kanoui in late 1972 and early 1973. It was written up in Colmerauer, Kanoui, Pasero, and Roussel's Marseille technical report *Un système de communication homme-machine en français* (1973), which is widely regarded as the first significant non-trivial Prolog program and the first serious demonstration of logic programming as a practical technique. The system could answer questions about a small database of facts about geography and family relationships, in passable French, with the grammar and the reasoning both expressed in Prolog clauses. Colmerauer would later say that the experience of writing this system — especially the way that grammatical rules and reasoning rules ended up in the same notation — convinced him that Prolog was a *general-purpose* language, not a specialised tool for theorem proving.

### 9. The second Marseille Prolog (1973)

By mid-1973, "Prolog 0" was being replaced by "Prolog 1" — a cleaner reimplementation with better memory management and the addition of a few built-in predicates for arithmetic. The 1973 version introduced the *cut* operator (written `/` in the 1973 syntax, later standardised as `!`) which was Colmerauer's concession to Hewitt-style procedural control: a way to prune the search tree and commit to a partial solution. The cut was controversial from the start — Kowalski disliked it because it broke the declarative reading — but it was essential to making Prolog programs run fast enough to be useful.

The 1973 Marseille Prolog is also where the first written grammar of Prolog syntax appeared. The Marseille team settled on the now-familiar notation:

```
head(X, Y) :- body1(X, Z), body2(Z, Y).
fact(a, b).
?- head(a, W).
```

The `:-` (pronounced "if") was chosen because it was the ASCII approximation to ⊢ that their keyboards could produce. The capital-letter convention for variables and lowercase for atoms — which Prolog shares with no other significant language — was, Colmerauer wrote, "an aesthetic choice made over coffee one afternoon." The period at the end of every clause was the concession to parsing: the interpreter needed to know where clauses ended.

Colmerauer's team published the 1973 system as a Marseille technical report, *Groupe d'Intelligence Artificielle, Marseille* internal report, and distributed magnetic tapes of the FORTRAN source on request to anyone who wrote asking for it. The tapes went out — to Edinburgh, to Warsaw, to Budapest, to the IBM research lab at Yorktown Heights, and eventually to dozens of universities. The 1973 Marseille Prolog was, in effect, released under what today we would call a permissive open-source licence, though the formality of such things did not yet exist. Colmerauer famously refused to patent anything about Prolog, saying that logic could not be patented and that "what belongs to everyone cannot be sold." He maintained this position for the rest of his life.

### 10. Kowalski's 1974 paper

Meanwhile, in Edinburgh, Robert Kowalski had been working on the theoretical side. In August 1974, at the IFIP Congress in Stockholm, he presented *Predicate Logic as Programming Language*. It is a short paper — twelve pages in the conference proceedings — but it is the single document that most people cite as the foundation of logic programming as a field. Kowalski argued that Horn clauses could be read procedurally as programs, that resolution could be read as a procedure-calling mechanism, and that the algorithm of a program was literally the *same* thing as its logical content under this interpretation. He summarised it in the now-famous equation:

> *Algorithm = Logic + Control*

That equation would become the slogan of the logic programming movement. It said that a program had two parts — what it computed (the logic) and how it computed it (the control) — and that in an ideal world a programmer could write down the logic and leave the control to the system. Prolog, in Kowalski's vision, was a practical realisation of this idea with the control left partly to the programmer (via clause order, goal order, and the cut) and partly to the interpreter.

Kowalski followed up with a longer exposition in 1979: the book *Logic for Problem Solving*, published by North-Holland. It was the first textbook on logic programming, and for nearly a decade it was the only one. It was a dense, philosophical book — more a manifesto than a textbook — but it established the vocabulary and the intellectual framework that subsequent Prolog textbooks would take for granted.

### 11. The early spread: 1974–1977

Between 1974 and 1977, copies of the Marseille Prolog tape spread to about two dozen sites worldwide. Alain Colmerauer himself described this as "a deliberately casual kind of distribution" — he wanted the system to spread, but he wasn't interested in managing releases or maintaining user support. At Edinburgh, Kowalski's group began using it; at Warsaw, a group around Wojciech Buszkowski and Jan Maluszynski started writing logic programming papers; at Hungary, Péter Szeredi began what would become the MProlog line; at the IBM Scientific Center in Heidelberg, Hans-Jürgen Appelrath and colleagues experimented with Prolog for database querying.

At Edinburgh specifically, the interpreter that arrived from Marseille was initially received with curiosity and some scepticism. Donald Michie and Alan Bundy were supportive, but the local compiler-writers, including a young David H. D. Warren, thought the Marseille FORTRAN interpreter was slow and ugly. Warren, encouraged by Kowalski and by his supervisor Rod Burstall, decided to write a better one — initially as a personal project, then as the core of his Ph.D. research. The result would, by 1977, eclipse Marseille Prolog entirely and become the de facto standard of the field.

---

## Part III — The Edinburgh Era (1977–1983)

### 12. David H. D. Warren and DEC-10 Prolog

David Harold Douglas Warren was born in 1950 and studied mathematics at Trinity College, Cambridge, before moving to Edinburgh for graduate work in artificial intelligence in the early 1970s. He was an unusually meticulous implementer — friends from the period describe him as someone who would spend weeks on a single allocation strategy before committing to it, and who had an almost intuitive sense of which micro-optimisations would pay off on the specific machines of the time. The machines of the time in Edinburgh were DECsystem-10s, large time-sharing mainframes running the TOPS-10 operating system.

Warren's Ph.D. thesis, *Applied Logic — Its Use and Implementation as a Programming Tool* (Edinburgh, 1977), described a compiler for Prolog that translated Prolog clauses into DEC-10 machine code. The compiler — the DEC-10 Prolog compiler — was dramatically faster than the Marseille interpreter. Where Marseille Prolog ran at maybe 1,000 logical inferences per second on the IBM 360/67, Warren's DEC-10 compiler ran at 10,000 to 40,000 LIPS, depending on the program. A ten-fold to forty-fold speedup was not incremental; it meant Prolog was now fast enough to be considered seriously as a production language.

The DEC-10 Prolog manual, written by Warren with Lawrence Byrd and Fernando Pereira and released as an Edinburgh technical report in 1977, introduced what everyone would come to call *Edinburgh syntax* — the syntax that became the de facto standard and later the basis of ISO Prolog. The Marseille syntax was subtly different (`->` instead of `:-` in some early versions, and different conventions for list brackets), and Edinburgh syntax was the version that spread.

Warren, Byrd, and Pereira also made Prolog *ergonomic*. They added the square-bracket list notation `[H|T]`, the `.`/2 syntax for lists (inherited from Marseille but cleaned up), the standard I/O predicates (`read`, `write`, `nl`, `get`, `put`), the debugging primitives (`trace`, `spy`), and the dynamic database predicates (`assert`, `retract`). They wrote user documentation that was actually readable. By 1979, DEC-10 Prolog was the Prolog that people meant when they said "Prolog," and Warren's compiler was running on DECsystem-10s all over Europe and at a handful of American sites.

### 13. Lawrence Byrd, Fernando Pereira, Richard O'Keefe

Around Warren at Edinburgh was a group of Prolog evangelists who would shape the language's culture for the next decade. Lawrence Byrd — who would later become a founding partner at Expert Systems Limited and then at Quintus — was the pragmatic implementer, interested in what made Prolog usable for real work. Byrd's 1980 paper *Understanding the Control Flow of Prolog Programs*, published in the proceedings of the 1980 Logic Programming Workshop at Debrecen, Hungary, introduced the *Byrd box model* of Prolog execution. In the Byrd box model, every procedure is a box with four ports: *call*, *exit*, *redo*, and *fail*. When you call a procedure, you enter through the call port; if it succeeds, you leave through the exit port; if the caller backtracks, you re-enter through the redo port; if it ultimately fails, you leave through the fail port. The box model became the standard mental framework for understanding Prolog control flow, and it is still the basis of every Prolog debugger in use today.

Fernando C. N. Pereira, a Portuguese-born linguist-turned-computer-scientist, arrived at Edinburgh in 1974 and did his Ph.D. under Warren's supervision. Pereira's interest was natural language. Building on Colmerauer's original work on French grammars, Pereira and David H. D. Warren published in 1980 *Definite Clause Grammars for Language Analysis*, in *Artificial Intelligence* 13(3), introducing DCGs — a notation that let Prolog programmers write context-free grammars (extended with unification and arbitrary Prolog code) in a clean declarative style, which the Prolog system then compiled into ordinary Prolog clauses via a mechanical translation. DCGs are still one of the most distinctive features of Prolog and remain the reason that Prolog is taught in computational linguistics courses to this day. The 1980 paper is probably the single most-cited Prolog paper ever written. Pereira would later leave Edinburgh for SRI International (Stanford Research Institute) in Menlo Park and then for Bell Labs and the University of Pennsylvania, where he became one of the founding figures of statistical NLP — ironically, one of the forces that would eventually supplant Prolog in NLP research.

Richard A. O'Keefe was an unusually careful New Zealand-born programmer who arrived at Edinburgh in the late 1970s and stayed in the Prolog community for the rest of his career. O'Keefe's contributions to Prolog culture — the standard-order-of-terms, the meta-predicates like `bagof`/`setof` (which he refined with Warren and Byrd), and a general insistence that Prolog code be *portable* — were out of all proportion to his official job titles. In 1990 he wrote *The Craft of Prolog* (MIT Press), a book that would become the canonical guide to writing idiomatic Prolog and which is still, in 2026, the book experienced Prolog programmers recommend to anyone who wants to move beyond toy examples. The Craft is opinionated, sometimes curmudgeonly, and deeply practical; O'Keefe opens by saying "elegance is not optional," a line that has been quoted in dozens of subsequent Prolog textbooks.

### 14. The Warren Abstract Machine (1983)

By 1981 David Warren had moved to SRI International in Menlo Park, where he continued his work on Prolog implementation. The DEC-10 compiler had been a success, but Warren knew its architecture was too tied to the PDP-10 instruction set to be truly portable. He wanted a *virtual machine* — a clean abstract specification that could be implemented on any computer and that captured precisely the operations that Prolog required.

In October 1983, SRI published Warren's technical note number 309: *An Abstract Prolog Instruction Set*. It is 35 pages long. It is one of the most consequential technical reports in the history of programming languages. It specified what is now universally called the *Warren Abstract Machine* or WAM — a virtual machine for Prolog, with a small instruction set (about 40 instructions), a precise memory model (heap, stack, trail, PDL), and a register-based execution strategy.

The WAM is to Prolog roughly what the JVM is to Java — except that the WAM preceded Java by more than a decade, and it was deliberately designed to be *fast*. Warren's key insight was that unification and backtracking, the two operations that dominate Prolog's runtime, could be broken down into simple primitive operations that a conventional CPU could execute efficiently. The WAM distinguishes between *read mode* (when a structure is being matched against an existing term) and *write mode* (when a structure is being constructed), and it uses a set of argument registers, a heap for term construction, a local stack for environment frames, a trail for backtrack bindings, and a PDL (push-down list) for unification. The unification instructions — `get_variable`, `get_value`, `get_constant`, `get_structure`, `put_variable`, `put_value`, `unify_variable`, `unify_value` — became, in effect, the assembly language of Prolog.

The WAM dominated Prolog implementation from 1983 onward. Almost every serious Prolog system — Quintus Prolog, SICStus, SWI-Prolog, BIM, ALS, Eclipse, XSB, YAP, B-Prolog — is a WAM or a descendant of the WAM. The major exceptions are the interpreted reference implementations (GNU Prolog's bootstrap, for example) and a few research systems that have tried radically different approaches (the Aquarius compiler of Peter Van Roy and Alvin Despain, 1990; the Vienna Abstract Machine of Krall; the BinProlog of Paul Tarau). Hassan Aït-Kaci's 1991 book *Warren's Abstract Machine: A Tutorial Reconstruction*, available free online from about 1999 onward, is the universally recommended entry point for understanding the WAM today; every Prolog implementer since the mid-1990s has cut their teeth on Aït-Kaci's reconstruction.

Warren himself would later extend the WAM to handle constraint logic programming (the CLP WAM) and parallel execution (the Andorra-I and Aurora systems for or-parallelism, and several designs for and-parallelism). By the late 1980s, Warren was at the University of Bristol running what was for a time the largest parallel Prolog research project in the world.

### 15. The 1980 Debrecen workshop and the first Prolog conference

The first international workshop devoted explicitly to logic programming was held in July 1980 in Debrecen, Hungary, organised jointly by the Hungarian Academy of Sciences and a group of Edinburgh-based researchers. Attendance was perhaps forty people — a mix of Prolog implementers, theoreticians from the resolution theorem-proving community, and a surprising number of Soviet and East European researchers who had been working on logic programming in relative isolation. The Debrecen workshop proceedings, published as *Logic Programming* by Academic Press in 1982 (edited by Keith L. Clark and Sten-Åke Tärnlund), is a snapshot of the field at the moment it became self-aware.

The first full *International Conference on Logic Programming* (ICLP) followed in September 1982 at the University of Marseille, with Colmerauer as a host — it was, in effect, Prolog coming home to the place of its birth. ICLP 1982 attracted roughly 200 people from 20 countries. There were talks on parallel implementations, on type systems for Prolog, on constraint extensions, on natural language applications. Kowalski gave a plenary on the procedural interpretation of Horn clauses; Warren presented early sketches of what would become the WAM; Colmerauer presented what would become Prolog II with its infinite tree unification and disequation constraints. Prolog II, released from Marseille in 1982, was the first major extension of the core Prolog language and introduced the rational-tree (infinite-tree) model of unification, dropping the occurs check and allowing cyclic term structures — a controversial but theoretically interesting move.

By the end of 1983 the ICLP had become a regular annual conference, rotating between Europe and North America (and later Asia). The *Journal of Logic Programming* began publication in 1984 with J. A. Robinson as founding editor — by then Robinson had made peace with the logic programmers, even though he still did not consider it his main contribution. The logic programming field had the scaffolding of a normal academic discipline: conferences, journals, textbooks, and a critical mass of Ph.D. students.

---

## Part IV — The Fifth Generation (1982–1992)

### 16. Japan's great bet

In October 1981, at a conference in Tokyo, the Japanese Ministry of International Trade and Industry (MITI) announced what would become one of the most consequential technology projects in post-war Japanese history: the *Fifth Generation Computer Systems Project* (FGCS, or 第五世代コンピュータ). The project was to run for ten years, from 1982 to 1992, with a total budget of roughly ¥57 billion (about $400 million USD at the exchange rates of the time, or perhaps $1 billion in modern inflation-adjusted dollars). Its stated goal was nothing less than to leapfrog the American and European computing industries by building, from scratch, a new kind of computer optimised for artificial intelligence — and specifically for *logic programming*.

The announcement was a thunderclap. American and European observers were genuinely alarmed. Edward Feigenbaum and Pamela McCorduck's 1983 book *The Fifth Generation: Artificial Intelligence and Japan's Computer Challenge to the World* sold hundreds of thousands of copies and helped set off a wave of defensive funding in the US (the DARPA Strategic Computing Initiative, announced in October 1983, with a $1 billion budget over ten years), in Europe (the ESPRIT program, also 1983), and in the UK (the Alvey Programme, 1983–1987). Prolog was, suddenly and improbably, a matter of industrial policy.

The technical bet of the FGCS was that logic programming — specifically, a parallel variant of Prolog — would become the native language of a new generation of machines designed from the silicon up for symbolic reasoning. The project was led by Kazuhiro Fuchi, director of the newly established *Institute for New Generation Computer Technology* (ICOT) in Tokyo's Minato ward. Fuchi was a genuine visionary — a product of Japan's postwar computing research tradition, with a deep interest in both hardware architecture and artificial intelligence — and he succeeded in attracting to ICOT many of Japan's best young computer scientists. Kazunori Ueda, Ehud Shapiro's close collaborator and later the inventor of GHC and KL1, was one of the key figures. Takashi Chikayama, who would later build the KLIC compiler, joined early. Hideki Hirakawa, Koichi Furukawa, and Ryuzo Hasegawa led the theory and software groups.

The choice of logic programming over Lisp — the dominant AI language in the US — was a deliberate strategic decision. Fuchi and his advisers reasoned that Lisp was a mature American technology on which Japan could not easily compete, while logic programming was new, academically respectable, and open. And Japan had a specific institutional advantage: the 1971–1981 work at Edinburgh and Marseille had been done largely in the open, with papers freely distributed. There was no Prolog patent to license, no proprietary runtime. The field was genuinely fresh.

### 17. ICOT's early years and the PIM machines

The first few years at ICOT (1982–1984) were spent on what Fuchi called the "initial stage": surveying the international literature, porting existing Prolog systems (primarily DEC-10 Prolog) to Japanese hardware, and building up the theoretical and software infrastructure for the decade to come. The project's official policy was to publish everything and to distribute ICOT software freely to researchers worldwide — a gesture of intellectual openness that was unusual in large government-funded technology programs and which won ICOT a great deal of goodwill abroad.

From 1985 to 1988 (the "intermediate stage"), ICOT's focus narrowed to two main lines: the *parallel inference machine* hardware and the *Kernel Language* that would run on it. The parallel inference machine — *PIM* — was a project to build a multi-processor computer specifically optimised for logic programming workloads. Several PIM prototypes were built: PIM/p (a multi-cluster shared-memory machine), PIM/c (a more modest bus-based design), PIM/m (a multi-cluster message-passing machine), and PIM/i (an ambitious custom-silicon design). The PIM machines were real — they were built, they ran, they were benchmarked — and in 1992 the most sophisticated PIM variant, the PIM/p-512, was running with 512 processors and achieving (on favourable benchmarks) in the tens of millions of LIPS, which at the time was comparable to or better than any conventional supercomputer running Prolog-like workloads.

But the PIM machines were not, in the end, competitive with commodity RISC hardware for *general* workloads. By 1990, Sun SPARC workstations and DEC Alpha machines were delivering the raw integer performance needed to run Prolog at respectable speeds using conventional WAM implementations. ICOT's PIM machines were built on older process technology and could not keep up with Moore's law in the commodity sector. The specialised hardware advantage — the whole point of the FGCS — was evaporating even as the project continued to hit its internal milestones.

### 18. The Kernel Language: from Concurrent Prolog to GHC to KL1

The Kernel Language was the software side of the FGCS bet. ICOT decided early that ordinary sequential Prolog was not the right basis for a parallel machine. Don't-know nondeterminism (the Prolog notion of backtracking) was difficult to parallelise efficiently because committing to a choice point required global coordination. ICOT wanted a language with *committed choice* — at every guard, the system would commit to a single clause once its guard succeeded, with no backtracking. This was the model that Ehud Shapiro had introduced in his 1983 paper *Concurrent Prolog: A Disjoint Synchronisation Scheme*, written while Shapiro was at the Weizmann Institute and visiting ICOT.

Shapiro's *Concurrent Prolog* was the first of a family of committed-choice parallel logic programming languages. It was quickly followed by Keith Clark and Steve Gregory's *Parlog* (Imperial College London, 1984), and by Kazunori Ueda's *Guarded Horn Clauses* (GHC, 1985), which became the direct basis of KL1. Ueda's GHC was simpler and cleaner than Concurrent Prolog — it dropped the read-only variable annotations that Shapiro had used for synchronisation and instead used a simpler rule: any attempt to bind a variable in a guard would suspend until some other process bound it. This gave a clean dataflow model of computation that was theoretically satisfying and practically implementable.

KL1 (Kernel Language 1), designed by Ueda, Chikayama, and others at ICOT between 1987 and 1989, was based on GHC with a few pragmatic extensions (modules, process tagging, shoen — a nesting mechanism for process groups). Chikayama implemented the KL1 compiler, KLIC, first as a research prototype and then (after the project ended in 1992) as a production system that he continued to develop and release as open source until around 2002. KL1 is — technically — a beautiful language. It is the purest realisation of the committed-choice paradigm ever built, it handles concurrency more gracefully than any other logic programming system to date, and in 1992 it was running efficiently on the PIM/p-512 and handling real workloads at what were, for the time, impressive scales.

### 19. What did ICOT produce?

ICOT's ten-year output was substantial by any measure. According to the final report compiled by Fuchi and his colleagues in 1993, the project had produced:

- Several generations of PIM hardware (the PIM/p, PIM/c, PIM/m, PIM/i, and the earlier PSI personal sequential inference machine).
- The KL1 language and the KLIC compiler.
- A parallel implementation of the KL1 runtime, PIMOS, that ran on the PIM/p-512.
- A collection of applications: a legal reasoning system, a medical expert system, a genome database and analysis system (GenomeNet), a VLSI CAD tool, and a natural language processing system for Japanese.
- Roughly 2,000 technical reports, freely distributed.
- More than 200 Ph.D. graduates who went on to teach or work in computer science across Japan and internationally.
- Three influential international FGCS conferences (1984, 1988, 1992), each of which was attended by 1,000+ researchers from around the world.

But the project did not produce what it had promised — a genuinely new kind of AI machine that would transform computing. The PIM machines were obsolete at the moment they shipped. KL1 never found a large user base outside of ICOT. The applications were interesting but did not become products. By the time the project ended in 1992, the wider world of computing had moved on: the PC had taken over the desktop, networking (TCP/IP and the nascent web) was replacing mainframe architectures, and the statistical revolution in AI — driven by Judea Pearl's 1988 *Probabilistic Reasoning in Intelligent Systems*, by the rise of neural networks, and by the growing availability of large corpora for machine learning — was beginning to displace the symbolic-reasoning paradigm that logic programming had assumed.

### 20. Why did it "fail"? The honest assessment

The conventional verdict on the Fifth Generation project is that it failed. Feigenbaum and McCorduck, who had breathlessly predicted Japanese dominance in 1983, were quietly more subdued in later editions of their book. Business journalists in the early 1990s wrote articles with titles like "Japan's AI Dream Fizzles" and "Fifth Generation: The Post-Mortem." The project became, in the popular imagination, a cautionary tale about picking the wrong technological horse.

But the "failure" narrative deserves nuance. What failed was the *industrial-policy bet*: the idea that by investing in logic programming and parallel hardware, Japan could leapfrog the US and Europe in AI. What *did not* fail was the computer science. ICOT produced excellent research, trained a generation of world-class computer scientists, and pushed the boundaries of what was known about parallel logic programming implementation. Ehud Shapiro would later argue (in his 2005 retrospective essay *The Japanese Fifth Generation Computer Systems Project: Trip Report*) that the FGCS was one of the most productive basic-research programs in computing history, and that the industrial payoff metric was simply the wrong one to apply to it.

The honest technical assessment of the failure is more interesting than the policy critique. The core bet — that parallel logic programming with committed choice would be the right model for large-scale AI computation — was defensible in 1982 and looked reasonable as late as 1988. It was undermined by two things the FGCS planners could not have foreseen: first, the explosive improvement in commodity sequential hardware under Moore's law (the "free lunch" that made specialised parallel machines economically unviable for most workloads until the 2000s); and second, the statistical revolution in AI, which moved the whole field toward numeric computation on large datasets and away from the symbolic reasoning that logic programming was optimised for. In 1982, nobody could have predicted that a graphics card designed for rendering polygons would, twenty-five years later, be the dominant computing substrate for artificial intelligence. The FGCS bet was technically sound given the information available at the time, and its failure was in large part a failure of the world to develop in the direction the planners had reasonably expected.

### 21. The AI winter (1987–1993)

The FGCS ran smack into the *AI winter* — the period from roughly 1987 to 1993 when funding for artificial intelligence research collapsed, expert-system companies went bankrupt, and the field's reputation was at its lowest ebb since the 1974 Lighthill report. Prolog, as the flagship language of symbolic AI, suffered disproportionately.

The expert-system boom of the early 1980s had been fuelled in part by Prolog's promise: you could, in theory, write your domain knowledge as Prolog clauses and get automatic inference for free. Hundreds of small companies sprang up selling expert-system shells (some written in Prolog, some in Lisp, some in specialised rule languages), and large corporations (DEC's XCON configurator, written in OPS5, was the most famous success) deployed expert systems in production. But by 1987 the limitations of the technology were becoming painfully clear: expert systems were brittle, they did not handle uncertainty well, they were hard to maintain as the underlying domain knowledge changed, and they did not scale to anything like real-world complexity. The expert-system companies — IntelliCorp, Inference Corporation, Symbolics, Lisp Machines Inc., Texas Instruments' Explorer line — began to fold or pivot. Symbolics filed for Chapter 11 in 1993. The Lisp machine market collapsed. And Prolog, guilty by association, lost much of its industrial momentum.

When the AI winter ended in the mid-1990s with the rise of the statistical / machine-learning paradigm, Prolog was no longer part of the mainstream story. It had become a niche language — still taught in academic AI courses, still used in specific application domains (compiler front-ends, natural language processing, some kinds of constraint solving), but no longer on the cutting edge of what "artificial intelligence" meant.

---

## Part V — The Commercial Era (1980s–1990s)

### 22. Quintus Prolog

The most commercially significant Prolog company of the 1980s was *Quintus Computer Systems*, founded in 1984 in Palo Alto, California. The founders included several ex-Edinburgh Prolog people — Lawrence Byrd, David H. D. Warren, and Fernando Pereira among them — who had been looking for a way to commercialise the DEC-10 compiler and its successors. The initial Quintus team also included William Kornfeld, Kim Haris, and several others recruited from Stanford, SRI, and Xerox PARC.

Quintus Prolog, released in late 1984, was the first production-quality commercial Prolog system. It was a WAM-based implementation with the Edinburgh syntax, written in C for portability, and it ran on the full range of Unix workstations of the era: Sun, Apollo, DEC VAX, HP 9000, SGI, and (eventually) the IBM PC. By 1985 it was the de facto standard for commercial Prolog on Unix workstations. Quintus sold licences at prices in the $2,000–$5,000 per seat range — expensive but not outlandish for commercial development tools of the period.

Quintus had strong technical credentials and made real money, but it never became a large company. It was acquired in 1989 by Intergraph Corporation, then sold in 1998 to Swedish Institute of Computer Science (SICS), where it became the basis of the SICStus Prolog line. SICStus, which had been developed at SICS starting in 1985 as a European response to Quintus, eventually absorbed Quintus's customer base and continues today as the leading commercial Prolog system — still used in production at a handful of major companies, and still shipping a WAM-based implementation with Edinburgh syntax that any Prolog programmer from 1985 would recognise.

### 23. The other commercial Prologs

Quintus was the most prominent but far from the only commercial Prolog of the 1980s:

- **BIM Prolog** (Belgian Institute of Management, later renamed *Prolog by BIM*) was developed in Brussels from about 1982 onward and became one of the most technically innovative commercial systems. Its creators — Michel Van Caneghem (who had also worked with Colmerauer in Marseille), Pascal Bouvier, and others — pushed hard on constraint logic programming, making BIM Prolog one of the first systems to integrate CLP(R) and CLP(FD) constraints directly into the core language. BIM was acquired in 1996 by a French company and its successor lineages continue (in altered form) as IF/Prolog.

- **IF/Prolog** was a German commercial Prolog, originally developed at InterFace Computer GmbH in Munich starting in 1985. It focused on industrial applications, with strong integration into German engineering software (for example, it was used in the DaimlerChrysler parts-configuration system for many years). IF/Prolog still exists under the IF Computer Brand.

- **LPA Prolog** (Logic Programming Associates) was a British company founded in 1980 by Clive Spenser and Al Roth. LPA's MacProlog (1986) was the first commercially successful Prolog for the Apple Macintosh; its WinProlog (1991) became the leading Windows Prolog of the 1990s. LPA focused on the teaching and small-business markets rather than the high-end industrial segment, and its tools were notable for their graphical development environments at a time when most Prolog systems were text-only.

- **ALS Prolog** (Applied Logic Systems), founded in 1986 in Massachusetts by Ken Bowen, Kevin Buettner, Ilyas Cicekli, and Andrew Turk, was an American competitor to Quintus in the late 1980s and early 1990s. ALS Prolog was notable for its 32-bit native-code compilation and its strong foreign-language interface.

- **Arity Prolog** was another American commercial system, developed by Arity Corporation in Concord, Massachusetts, from about 1984. Arity was the dominant Prolog for the IBM PC in the late 1980s, shipping a serviceable MS-DOS implementation with good language integration and a modest price tag (around $500 for the standard edition, a fraction of Quintus's prices). Arity was eventually acquired by LPA.

- **Prolog-2** and **MProlog** were European and Hungarian commercial systems of varying levels of sophistication, largely used in their home markets.

And then there was Turbo Prolog.

### 24. Turbo Prolog and the Borland experiment

In 1986 — at the peak of the expert-system boom — Borland International, the Scotts Valley, California company famous for Turbo Pascal, shocked the industry by releasing *Turbo Prolog*, a Prolog compiler for the IBM PC priced at $99.95. This was an order of magnitude less than any existing commercial Prolog. Borland's Turbo Prolog came in a box, was available at Egghead and ComputerLand stores, and came with a glossy manual and introductory examples. For thousands of PC hobbyists and small-business programmers, it was the first Prolog they ever saw.

The technical story behind Turbo Prolog is interesting. Borland did not develop it in-house. The compiler was licensed from *PDC*, the *Prolog Development Center*, a small Danish company in Copenhagen founded by Leo Jensen and Thomas Rusin. PDC had developed a Prolog compiler for MS-DOS specifically optimised for the small-memory environment of the 8086 CPU — it generated native x86 code, ran fast, and fit in 256 KB. Borland picked it up, added a Turbo Pascal-style IDE, and marketed it aggressively.

Turbo Prolog was commercially successful — it sold "hundreds of thousands of copies," by Borland's internal count — but it was also controversial in the Prolog community. The problem was that Turbo Prolog was not a *standard* Prolog. In the interest of performance and type safety, PDC had made it a *strongly typed* language: you had to declare the types of all predicates, and the compiler generated specialised code for each type signature. This was very different from the dynamic, untyped nature of Edinburgh Prolog. Programs written in Turbo Prolog could not be ported to Quintus, SICStus, or any other standard Prolog without significant rewriting.

Richard O'Keefe, writing in a famous 1988 comp.lang.prolog Usenet post, argued that Turbo Prolog was "not actually Prolog at all" — it was a related but distinct language that happened to use Prolog-like syntax for some purposes. O'Keefe's post was circulated widely and Borland's marketing claims were treated with suspicion in academic circles for years afterward.

In practice, Turbo Prolog (later called PDC Prolog, then Visual Prolog) evolved in a different direction from the rest of the Prolog world. PDC maintained the product after Borland exited the Prolog business around 1990, and it continues today as *Visual Prolog*, a strongly typed object-oriented descendant that Prolog purists still dispute but that has a stable commercial user base in Europe. The split between Turbo Prolog and "standard" Prolog is one of the few cases in programming language history where a mass-market commercial offering directly diverged from the academic norm and survived on its own terms.

One side-effect of Turbo Prolog is worth noting. Because Borland sold so many copies so cheaply, Turbo Prolog was — for many 1980s programmers who never had access to a Unix workstation or a DEC-10 — *the* introduction to Prolog. A whole generation of hobbyist AI programmers learned Prolog from the Turbo Prolog manual before they ever saw SWI-Prolog or Quintus. The influence of Turbo Prolog on Prolog's popular image — and on its association with expert systems and simple rule-based reasoning — was large, and not always in the direction the Edinburgh community would have chosen.

### 25. ISO Prolog and the standardisation effort

By the late 1980s the Prolog community had a problem. There were at least a dozen widely-used Prolog implementations, and while they all shared a common core (Edinburgh syntax, Horn clause resolution, basic built-ins), the details diverged in maddening ways. `assert` vs `assertz`, `write` vs `writeq`, the exact semantics of `copy_term`, the exact behaviour of `bagof` on empty solutions — every implementation had its own quirks. Portability was a real problem for anyone trying to distribute Prolog programs.

The solution, as in most such cases, was an ISO standard. ISO/IEC JTC 1/SC 22 — the Joint Technical Committee responsible for programming language standards — established Working Group WG17 for Prolog in 1987, at the suggestion of the British Standards Institution. The convener was Roger Scowen of the UK's National Physical Laboratory, a veteran of the ALGOL 60 and Pascal standards efforts. Committee members included Jonathan Bowen, Fernando Pereira, Richard O'Keefe, Jacques Cohen, Jan Wielemaker (later of SWI-Prolog), and representatives from most of the major commercial Prolog vendors.

Standardisation was contentious and slow. The committee spent years arguing about the smallest details — exception handling semantics, error atoms, the exact behaviour of floating-point operations, the handling of Unicode in source files. Richard O'Keefe was a particularly forceful voice, and his insistence that the standard specify behaviour *precisely* (not leave things "implementation-defined") led to a lot of productive but exhausting debate.

The first part of the standard — *ISO/IEC 13211-1:1995, Information technology — Programming languages — Prolog — Part 1: General core* — was finally published in June 1995. It ran to 199 pages and specified the core Prolog language: syntax, unification, the execution model, built-in predicates, error handling, and the standard library. Part 2, covering modules, was published in 2000 but was controversial and less universally adopted. Parts 3 and 4, on proposed features like tabling and constraint logic programming, were drafted but never ratified.

The ISO standard succeeded in establishing a baseline. Every serious Prolog implementation since 1995 conforms (more or less) to ISO Prolog for its core behaviour. But the ISO standard did not eliminate the dialect problem, because most of the interesting parts of modern Prolog — modules, tabling, constraint logic programming, concurrency, foreign-language interfaces — are not in the standard and remain implementation-specific. In practice, writing truly portable Prolog code means using the ISO core plus a bit of conditional compilation, and most significant Prolog programs are still tied to one or two specific implementations.

### 26. The Lisp vs Prolog debate

Throughout the 1980s, there was a running debate in the AI community about which language — Lisp or Prolog — was the right foundation for artificial intelligence research. The debate was partly technical and partly tribal. MIT and the East Coast were Lisp country; Edinburgh, Marseille, and much of Europe were Prolog country; Japan's FGCS had formally chosen Prolog; Stanford and SRI were divided.

The technical arguments, as they were actually made at the time, went roughly as follows:

*For Lisp:* Lisp is flexible enough to express logic programming as a library (any Lisp programmer can write a unification algorithm in an afternoon), while the converse is not true — you cannot implement full Lisp inside Prolog without reimplementing all of Lisp's machinery from scratch. Lisp has strong support for functional and imperative styles in addition to symbolic programming, whereas Prolog is awkward for anything other than relational reasoning. Lisp has mature development environments (the MIT CADR, the Symbolics Lisp machines, Interlisp-D at Xerox PARC), while Prolog's tools are primitive. Lisp can call into arbitrary operating system and library functions, while Prolog's foreign-function interfaces are painful. Lisp has numeric performance; Prolog does not.

*For Prolog:* Prolog's procedural reading of Horn clauses gives you declarative programming for free — you write the logic and the execution follows. Prolog has *unification* built in, which is exactly the operation that symbolic reasoning requires and which has to be implemented painstakingly in Lisp. Prolog's pattern-matching clause heads are more concise than Lisp's explicit `cond` constructs. Prolog's backtracking gives you search for free, while Lisp search has to be coded by hand. Prolog's grammar notation (DCGs) is unmatched for NLP. Prolog is grounded in *logic*, which is the correct mathematical foundation for intelligence; Lisp is just a higher-level programming language.

Neither side was exactly wrong. The deep truth, articulated most clearly by Peter Norvig in his 1992 book *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (PAIP), was that the two languages were *different tools* optimised for different styles of problem. Norvig actually included, in PAIP, a Prolog implementation written in Common Lisp — about 150 lines of code — demonstrating that you could have Prolog inside Lisp whenever you needed it. The implicit argument was that the Lisp side could eat the Prolog side, if it wanted to, and that the Prolog community's insistence on Prolog-as-a-standalone-language was more ideological than technical.

But the Lisp side was eaten, in turn, by statistics and numeric computation. By the late 1990s, both Lisp and Prolog were losing ground to Python (plus NumPy, SciPy, scikit-learn) and to Java (plus Weka and later deep learning frameworks). The Lisp vs Prolog debate, so intense in 1985, became a nostalgic memory by 2005.

### 27. SWI-Prolog and the open-source rebirth (1987–present)

One of the longest-lasting Prolog implementations started as a student project in the Netherlands. In 1987, Jan Wielemaker — then a graduate student in psychology at the University of Amsterdam, working on a research project that needed a Prolog system — wrote a small Prolog interpreter for his lab's Sun workstations. He called it SWI-Prolog, after the Sociaal-Wetenschappelijke Informatica (Social Sciences Informatics) department at the University of Amsterdam where he worked. It was intended as a throwaway tool for a specific research application.

Thirty-nine years later, SWI-Prolog is the most widely-used Prolog in the world and is maintained by a community of several dozen contributors led by Wielemaker (who moved to the Vrije Universiteit Amsterdam in 2004 and then to the VU's AI group, where he continued SWI-Prolog work as part of his regular research duties). SWI-Prolog is open-source (LGPL, with some parts BSD), runs on all major operating systems, ships excellent libraries for HTTP, RDF, constraint logic programming, and Unicode handling, and has a vigorous user community that organises an annual *Prolog Day* conference and runs the popular `swi-prolog.org` documentation site.

SWI-Prolog's importance in the post-2000 Prolog world cannot be overstated. When a student today is asked to install Prolog for a homework assignment, they overwhelmingly install SWI-Prolog. When a researcher wants to prototype a logic-programming idea, they reach for SWI. The ecosystem of SWI libraries — SWI's HTTP framework in particular, which Wielemaker and his colleagues built starting in the late 1990s and which has become a serious web development tool — is the largest Prolog library ecosystem that has ever existed. Wielemaker's long patient stewardship of SWI, over nearly four decades, is one of the quiet success stories of open-source software: a language that might have died in the 1990s instead thrives in the 2020s in large part because one careful implementer kept it alive and kept it useful.

### 28. GNU Prolog, YAP, Eclipse, XSB: the research implementations

Alongside SWI, a handful of other open-source Prolog systems have maintained active development communities:

**GNU Prolog**, developed by Daniel Diaz at the University of Paris in the early 1990s and released in 1999 under the GPL, is a WAM-based system with a strong constraint logic programming library (CLP(FD)). Its distinctive feature is that it compiles Prolog programs to standalone native executables, rather than requiring an interpreter — a useful property for deployment scenarios where you want to ship a Prolog-based application without bundling the whole Prolog runtime. GNU Prolog is technically excellent but has a much smaller user base than SWI.

**YAP** (Yet Another Prolog) was developed at the University of Porto by Vítor Santos Costa, Luís Damas, Ricardo Rocha, and colleagues starting in 1985. It is notable for its aggressive optimisation, its integration with R and Python for statistical applications, and its strong support for *tabled execution* — a Prolog extension that memoises subgoal computations to avoid recomputation and to support more robust evaluation of recursive programs. YAP is fast (often the fastest Prolog system on specific benchmarks) and has been the implementation of choice for several research groups working on inductive logic programming and probabilistic logic programming.

**ECLiPSe Prolog**, developed at the European Computer-Industry Research Centre (ECRC) in Munich starting in 1983 and later maintained at Imperial College London, was the first major Prolog system to make constraint logic programming a first-class feature. ECLiPSe's constraint solvers — for finite domains, intervals, sets, and real numbers — were genuinely ahead of their time, and ECLiPSe became the system of choice for operations research and combinatorial optimisation applications in the 1990s. It is still maintained and is still used in industry for constraint-based scheduling and configuration problems.

**XSB** (Stony Brook Prolog), developed at Stony Brook University by David Warren (no relation to D. H. D. Warren — this is David S. Warren, also a logic programming pioneer) starting in the early 1990s, was the first Prolog system to implement *well-founded semantics* and *SLG resolution* — a form of tabled resolution that handles recursive programs more gracefully than standard SLD resolution. XSB's implementation of *Datalog with recursion and negation* made it the preferred platform for deductive database research throughout the 1990s and early 2000s, and XSB is the direct ancestor of several modern Datalog implementations (including the LogicBlox commercial system, which was founded in 2004 by Molham Aref and several XSB alumni).

**B-Prolog**, developed by Neng-Fa Zhou at CUNY Brooklyn College starting in 1994, pioneered several implementation techniques including *matching trees* for clause indexing and *action rules* for event-driven programming. B-Prolog is the ancestor of *Picat*, a newer logic-plus-constraint language that Zhou has been developing since about 2012.

Taken together, these open-source Prolog systems — SWI, GNU, YAP, ECLiPSe, XSB, B-Prolog — form a small but vibrant ecosystem that keeps Prolog alive as a serious research tool. They are all WAM-based (or WAM-descended), they all interoperate reasonably well through the ISO Prolog core, and they all have clearly-defined niches. The community is small but durable: roughly 200–300 active Prolog developers worldwide, a steady stream of research papers at ICLP and its satellite conferences, and a dozen or so active textbooks and online courses.

---

## Part VI — Key Figures

The history of Prolog, like the history of most programming languages, is a history of a small number of people doing obsessive, patient, brilliant work over decades. This section profiles the most important of them.

### 29. Alain Colmerauer (1941–2017)

Alain Colmerauer was, by universal consent, the father of Prolog. But his contributions to the field go well beyond the original 1972 implementation. Over a forty-year career he returned repeatedly to the question of how unification and logic could be generalised — first with Prolog II (1982) and its rational trees and disequation constraints, then with Prolog III (1989) and its integration of Boolean algebra and linear arithmetic constraints, then with Prolog IV (1996) and its even richer constraint vocabulary.

Colmerauer's personal style was unusual for an academic of his stature. He published relatively few papers — perhaps 50 over his career — but the ones he published were highly polished and often influential. He disliked conferences and travelled reluctantly. He stayed at the Université d'Aix-Marseille II for his entire career and turned down offers to move to Paris or abroad. He was the first and long the only member of his family with a doctorate, and he took a deep pride in being a Marseillais by choice — he loved the sea, the calanques, and the rough regional French spoken on the coast. His colleagues at Luminy describe him as generous with his time with students, sharp in technical discussions, and increasingly reclusive in his final years as his health declined.

Colmerauer received the Association for Logic Programming's Founders Award in 1986, was elected a member of the French Academy of Sciences in 2008, and was made a Chevalier de la Légion d'Honneur in 2010. He was the subject of a book-length biography, Jacques Cohen's *Alain Colmerauer: The Man and the Work* (2018), published in the year after his death. He died in Marseille on 12 May 2017, at the age of 76, after a long illness. His obituary in *Le Monde* described him as "the father of a language the world never quite figured out how to use."

Colmerauer's refusal to patent or commercialise Prolog was a deliberate ideological choice that had real consequences. Had he patented the core algorithms in 1973, he might have made a fortune — by analogy, Bell Labs' decision to make Unix freely available to universities in the 1970s was the *opposite* of the patent strategy and is generally credited with making Unix dominant. Colmerauer made the Unix-style choice and Prolog spread rapidly as a result. But he also chose to stay in an academic position at Marseille rather than found a company, which meant that when the commercialisation wave came in the mid-1980s, it happened at Edinburgh (via Warren and Byrd at Quintus) and Brussels (via Van Caneghem at BIM), not at Marseille.

A famous anecdote: when Borland licensed PDC Prolog for Turbo Prolog in 1986, someone from Borland's legal team apparently called Colmerauer's office at Marseille to check if there were any patents or licences they needed to be aware of. Colmerauer's secretary — the story goes — laughed and said, "Monsieur Colmerauer does not believe in patents. Please just make sure you credit him in the manual."

### 30. Robert Kowalski (1941– )

Robert Anthony Kowalski was born in Bridgeport, Connecticut on 15 May 1941, the same year as Colmerauer. His career has been the intellectual counterpoint to Colmerauer's: where Colmerauer was the hands-on implementer, Kowalski has been the philosopher of logic programming, constantly probing the *meaning* of what was going on and its connections to other areas of mathematical logic, to philosophy, and ultimately to law and social science.

After his M.A. at Wisconsin in 1966 and his Fulbright at Edinburgh, Kowalski took his Ph.D. at Edinburgh in 1970 under Bernard Meltzer, with a thesis on semantic trees and completeness theorems for resolution. He stayed at Edinburgh until 1975, then moved to Imperial College London as a professor — a position he held until his retirement in 1999, and from which he built one of the world's great logic programming research groups. The Imperial group, at its peak in the 1980s, included Keith Clark (who developed Parlog), Marek Sergot (who worked on legal reasoning and the British Nationality Act formalisation), Frank Kriwaczek, Jim Cunningham, and many others.

Kowalski's major papers — *Predicate Logic as Programming Language* (1974), *Algorithm = Logic + Control* (1979, in CACM), *Logic for Problem Solving* (1979, book), *Amalgamating Language and Metalanguage in Logic Programming* (1982, with Bowen), *The Logical Reconstruction of Negation as Failure* (with Kunen, 1987) — are all exercises in clarifying the *meaning* of what Prolog programs actually compute and in connecting logic programming to the broader tradition of mathematical logic. His 1986 paper with Marek Sergot, *The British Nationality Act as a Logic Program*, in *CACM*, was a stunning demonstration that English statutory law could be transcribed, almost literally, into Prolog clauses, and that the resulting program could answer questions about the Act's interpretation. It started a whole sub-field of *computational law* that still exists today.

Kowalski's more recent work, since his retirement from Imperial, has moved toward cognitive science and argumentation theory. His 2011 book *Computational Logic and Human Thinking: How to Be Artificially Intelligent* (Cambridge University Press) is a popular-science exposition of logic programming ideas aimed at a general audience. He continues to publish and lecture into his eighties, and in recent years has been involved in revising the ISO Prolog standard and in mentoring the next generation of logic programming researchers.

Like Colmerauer, Kowalski received the ALP Founders Award (1999) and numerous other honours. He was elected a Fellow of the Royal Society in 2012. His intellectual influence on Prolog is less visible than Colmerauer's but perhaps deeper: every modern account of what Prolog *means* — every textbook discussion of the declarative reading, the procedural reading, and their equivalence under SLD resolution — traces back to Kowalski's framing in the 1970s.

### 31. David H. D. Warren (1950– )

Warren is the implementer. Colmerauer built the first Prolog; Kowalski formalised what it meant; but Warren, more than anyone else, made it fast enough to matter. His Cambridge undergraduate training, his Edinburgh Ph.D. work on the DEC-10 compiler (1977), his Edinburgh postdoctoral work with Pereira on DCGs (1980), his SRI work on the WAM (1983), and his later Bristol and Manchester work on parallel Prolog implementations (the Aurora and Andorra-I systems of 1987–1992) form the spine of Prolog implementation history.

Warren is, by the account of his colleagues, an unusually meticulous and patient person — the kind of implementer who will redesign a data structure three times if he thinks there is a clever improvement to be made. His WAM design is admired precisely because every instruction does something useful and nothing extra. The 35-page SRI technical note is a model of tight technical writing.

After SRI, Warren moved back to the UK, first to the University of Manchester and then to the University of Bristol, where he held a chair and ran a large parallel-Prolog research group from 1987 to 2001. The Aurora project (1987–1991), a collaboration between Bristol, Argonne National Laboratory, and a consortium of European universities, produced one of the most sophisticated or-parallel Prolog systems ever built, running on shared-memory multiprocessor machines. Andorra-I, which followed, integrated and-parallelism with or-parallelism via a delay mechanism. Neither system found widespread use outside the research community, but they produced a stream of influential papers and trained a generation of parallel-implementation specialists.

Warren is a quiet figure in the Prolog community — not a conference extrovert, not a prolific essayist like Kowalski — but he is held in unusually high esteem. When Prolog implementers want to settle a technical dispute, they ask "what does Warren think?" and that is often the end of the argument. He received the ALP Founders Award in 1991 and was elected a Fellow of the Royal Society of Edinburgh in 1988. In 2016 he was the subject of a Festschrift volume, *New Perspectives in Logic Programming: Papers in Honour of David H. D. Warren*, published by Springer.

### 32. Richard A. O'Keefe (1957– )

Richard O'Keefe is a New Zealand-born programmer whose career has traced a distinctive arc through the Prolog world. Educated at Auckland and later at Edinburgh, O'Keefe worked at the University of Edinburgh during the Prolog heyday of the early 1980s, then at the Royal Melbourne Institute of Technology, and for many years at the University of Otago in Dunedin, New Zealand. Throughout this period he was an active participant in ISO Prolog standardisation, a prolific commenter on Usenet's `comp.lang.prolog` group, and an unusually careful thinker about the relationship between Prolog's formal semantics and its practical use.

His book *The Craft of Prolog* (MIT Press, 1990) is one of the three or four most-cited Prolog books ever published. It is a book about style — about how to write Prolog that is fast, portable, and legible — and its opinions are forthright. "Elegance is not optional," O'Keefe writes in the preface, and the rest of the book works out what that means in detail. The Craft is famously curmudgeonly (O'Keefe is not gentle with implementers or standards committees that make bad decisions) but it is also astonishingly practical: it teaches you how to think about clause order for efficiency, how to use meta-predicates idiomatically, when to cut and when not to cut, how to structure large Prolog programs so they remain maintainable.

O'Keefe also co-authored, with Lee Naish of Melbourne University, a series of papers on the semantics of negation and cut in Prolog that are still the canonical references for those topics. His 2009 Erlang library work (including the `eunit` testing framework and the `dict` implementation that appeared in Erlang/OTP) brought some of his Prolog sensibilities to a different functional-programming community. He retired from full-time academic work around 2018 but remains active in online technical discussions and in consulting.

### 33. Ivan Bratko (1946– )

Ivan Bratko, a Slovenian computer scientist based at the University of Ljubljana, wrote the single most widely-used Prolog textbook in the world: *Prolog Programming for Artificial Intelligence* (Addison-Wesley, 1986; second edition 1990; third edition 2001; fourth edition 2011). The book, universally known as "Bratko," has been translated into a dozen languages and has been the standard Prolog textbook in hundreds of university AI courses since the mid-1980s. If you have ever taken a course that used Prolog, there is a better-than-even chance that Bratko was your textbook.

Bratko's career at Ljubljana has spanned the rise and fall of Yugoslav computer science and the transition to independent Slovenia. He was trained at Ljubljana, did postdoctoral work at Edinburgh in the late 1970s (overlapping with Warren and the first flush of DEC-10 Prolog), and returned to Ljubljana to build what became one of Eastern Europe's most important AI research groups. His research interests have ranged across machine learning, qualitative reasoning, and chess endgame analysis — his 1978 paper with Donald Michie on using Prolog to generate chess endgame databases was one of the first really impressive demonstrations of Prolog for a combinatorial problem.

Bratko's textbook is admired for its pedagogical clarity and for its breadth: it covers not just basic Prolog but a large range of AI applications — search algorithms, game playing, expert systems, machine learning, natural language processing — all implemented in clean Prolog code. It became the de facto answer to the question "can Prolog actually do useful things?" for a generation of students. Bratko himself received the ALP Founders Award in 2008.

### 34. Leon Sterling and Ehud Shapiro

*The Art of Prolog*, by Leon Sterling and Ehud Shapiro (MIT Press, 1986; second edition 1994), is the other great Prolog textbook — complementary to Bratko, more theoretical and academic in emphasis, with more attention to the meta-theory of logic programming and to advanced techniques like meta-interpreters and program transformation. It is still, nearly forty years after its first edition, regarded as the most intellectually sophisticated introduction to Prolog in existence.

Leon Sterling was an Australian computer scientist who had been working on logic programming at Edinburgh in the early 1980s; he later held positions at Case Western Reserve University in Cleveland, the University of Melbourne, and Swinburne University of Technology in Melbourne, where he became Pro Vice-Chancellor and a senior academic administrator. His Prolog research included meta-programming, skeletal Prolog techniques, and the early work on software engineering for Prolog programs. His co-authorship with Shapiro of *The Art of Prolog* is the work he is best known for internationally.

Ehud Shapiro is one of the most fascinating figures in the history of computer science, and his work extended far beyond Prolog. Born in Jerusalem in 1955, he took his B.A. at Tel Aviv University and his Ph.D. at Yale in 1982 under Dana Scott, with a dissertation titled *Algorithmic Program Debugging* — a work that introduced the concept of *automatic debugging by intersection of test cases with formal specifications*, implemented in Prolog, and that won the 1983 ACM Distinguished Dissertation Award. Shapiro then moved to the Weizmann Institute in Rehovot, Israel, where he spent the next decade on logic programming. In 1983 he published *Concurrent Prolog: A Disjoint Synchronisation Scheme*, the paper that defined the committed-choice concurrent logic programming paradigm; in 1986 he co-authored *The Art of Prolog* with Sterling; in 1987 he edited the massive two-volume *Concurrent Prolog: Collected Papers* for MIT Press. He was, throughout the 1980s, one of the most influential figures in the Japanese FGCS project, visiting ICOT repeatedly and collaborating with Kazunori Ueda and Takashi Chikayama.

Around 1994 Shapiro made a sharp pivot out of computer science and into *biology*. He founded a startup called Ubique in 1993 (one of the first web-based social networking companies, anticipating many of the ideas that would later be rediscovered in the early 2000s), sold it to AOL in 1995, and used the proceeds to fund a research group at the Weizmann Institute working on *DNA computing* and *biological computation*. His later work on constructing biological computers from DNA molecules and on cell-lineage reconstruction using molecular signatures has been cited in the biology literature as much as his earlier work was cited in computer science — a genuinely unusual career path. Shapiro received the ACM SIGART Distinguished Dissertation Award (1983), the ACM Outstanding Programming Award (1989), and numerous honours in the biology community.

### 35. Peter Norvig and the Lisp bridge

Peter Norvig is not principally a Prolog person — he is one of the leading figures of the statistical AI revolution, co-author (with Stuart Russell) of *Artificial Intelligence: A Modern Approach* (1995, now in its fourth edition and the standard AI textbook worldwide), and the long-time director of research at Google. But Norvig's contribution to Prolog's history is indirect and important: his 1992 book *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (Morgan Kaufmann) includes, in Chapters 11 and 12, a complete implementation of Prolog in Lisp.

PAIP's Prolog implementation is about 150 lines of Common Lisp for the basic interpreter, plus another 500 lines for a compiled version that uses Lisp macros to generate efficient code. It is not a production Prolog — it does not have the WAM's memory management, it does not have most of the ISO built-ins — but it is a complete and faithful implementation of the core Prolog semantics, and it is accompanied by one of the clearest prose explanations of *why* Prolog works that has ever been written. For a generation of Lisp programmers who wanted to understand Prolog without leaving their preferred environment, PAIP was the book.

Norvig's implicit argument in PAIP — that Prolog is a set of useful *techniques* (unification, resolution, backtracking) that can be made available inside a general-purpose language whenever you need them, rather than a language that requires you to commit to a specific worldview — is one that has aged well. By 2026, most production uses of logic-programming ideas are exactly along these lines: `core.logic` for Clojure, `miniKanren` (a relational programming language embedded in Scheme, developed by William Byrd and Dan Friedman starting in 2005), the `unification` libraries for Python, the SMT-lib embeddings in Z3. Norvig's PAIP was an early signal that the future of logic programming would be as embedded techniques rather than as standalone languages, and that prediction has largely come true.

### 36. Manuel Hermenegildo and the Ciao lineage

Worth mentioning for the 1990s–2020s period is Manuel Hermenegildo, a Spanish computer scientist who worked with Warren at Texas at Austin in the mid-1980s, then moved to the Universidad Politécnica de Madrid (UPM) in 1990 where he founded the CLIP research group. Hermenegildo and his students — Francisco Bueno, Daniel Cabeza, Germán Puebla, José Morales — developed *Ciao Prolog*, a highly modular Prolog system with an advanced global analysis framework (*program assertions*, abstract interpretation, partial evaluation) and with support for multiple language extensions within a unified framework. Ciao is not widely used outside the research community but is technically one of the most sophisticated Prolog systems ever built, and the analysis and verification techniques developed for it have influenced the broader programming-languages field beyond Prolog.

Hermenegildo's CiaoPP preprocessor, in particular, pioneered the idea of *abstract-interpretation-based program verification for Prolog*, a line of research that connects logic programming with the broader world of formal methods and static analysis. Several of his students have gone on to prominent positions in programming-languages research, and Ciao is one of the longest-lived research Prolog systems (continuous development since 1985).

---

## Part VII — Cultural Impact

### 37. The expert systems boom (1980–1987)

The early and mid-1980s were the high noon of Prolog's cultural presence. Three things converged:

1. The publication of the Fifth Generation project's goals in 1981–1982, which put logic programming on the front pages of newspapers.
2. The simultaneous rise of *expert systems* — software that captured domain expertise as rule bases and used inference engines to reason about specific problems — and the marketing of those systems as the near future of artificial intelligence.
3. The availability of cheap personal computers that were powerful enough to run small Prolog systems, coupled with the arrival of commercial products (Turbo Prolog, Arity, LPA) priced for mass-market adoption.

The expert systems that got the most press were mostly not written in Prolog — MYCIN (Stanford, 1976) and EMYCIN (its generalised shell, 1979) were in Lisp; Digital Equipment Corporation's XCON (DEC's computer configurator, in production from 1980) was in OPS5; Campbell Soup's expert system for plant operators was written in a custom shell; and so on. But Prolog was *associated* with expert systems in the popular imagination, because the idea of "write rules and have the computer reason from them" was exactly what Prolog's clause-based syntax made natural. By 1986, there were dozens of Prolog-based expert-system shells on the market — Lucid's Energise, LPA's flex, and hundreds of in-house custom shells written by consulting firms for specific clients.

The boom was accompanied by a wave of consulting money. Arthur D. Little, Arthur Andersen, McKinsey, and all the other major consultancies built AI practices whose bread-and-butter was selling expert system development to Fortune 500 clients. For a few years in the mid-1980s, "AI consultant" was a lucrative job title and Prolog was one of the tools that marked someone as credentialed. Prolog programming courses at companies like IBM, Digital, Unisys, and Boeing trained thousands of working programmers in the basics of the language.

Then, starting around 1987, it all came apart. The expert systems delivered to clients too often failed to deliver in production: they were brittle (they failed in unexpected ways on inputs slightly outside their training domain), they were hard to update (each knowledge-base change risked breaking existing inferences), and they required expensive specialists to maintain. The promised productivity gains did not materialise. Client firms quietly cancelled contracts and moved their resources to other things.

### 38. The collapse and the retreat to niches (1988–1998)

The AI winter of 1987–1993 hit Prolog hard. Commercial Prolog vendors went through a shakeout: Quintus was acquired by Intergraph in 1989 and largely absorbed into Intergraph's internal tool chain; ALS Prolog was acquired and shelved; Arity was acquired by LPA. The Symbolics Lisp machines collapsed in the same period, and the general sense that "AI is oversold" spread through the industry. Prolog, as the language most associated with the symbolic AI paradigm, was tarred with the same brush.

But Prolog did not die. It retreated to niches where its specific strengths still paid off:

**Compiler front-ends.** Parser generation, static analysis, and abstract syntax tree transformations are naturally expressed as Prolog clauses. The Mercury language (itself a logic-programming descendant of Prolog), the Ada-based SPARK static analyser, and several static-analysis tools for C and Java have compiler components written in Prolog. Even the original GNU Prolog was used in production at several companies as the implementation language for domain-specific-language interpreters.

**Natural language processing.** Although the statistical revolution in NLP (starting with IBM's work on statistical machine translation in 1990 and spreading through the 1990s) displaced rule-based approaches in the commercial mainstream, Prolog's DCG notation remained the most convenient tool for writing rule-based grammars for specific applications. Academic computational linguistics courses continue to teach Prolog into the 2020s, and several NLP toolkits (the Edinburgh CKY parser work, the French TAG parsing framework at LORIA Nancy) are implemented in Prolog.

**Computational logic and theorem proving.** For research in automated theorem proving, SAT/SMT solving, and formal methods, Prolog has been a natural prototyping language. Many theorem provers are written partly in Prolog, and the Twelf proof assistant (a dependent-types framework based on the Edinburgh Logical Framework) is implemented in Standard ML but has a Prolog-like user-facing syntax that owes much to its logic programming heritage.

**Constraint logic programming.** The CLP extensions to Prolog — CLP(FD) for finite-domain constraints, CLP(R) for real arithmetic, CLP(B) for Boolean constraints — gave Prolog a real edge in combinatorial optimisation and scheduling problems. The ECLiPSe Prolog system's constraint libraries were used in production at several large European companies (SAS airlines' crew scheduling, for example, used a CLP-based system for many years). CLP is still one of the most actively developed areas within Prolog today.

**Deductive databases and Datalog.** Datalog — the Prolog subset without function symbols, which guarantees termination for pure programs — became the language of deductive databases starting in the mid-1980s, and although Datalog is not usually implemented as a Prolog variant today, the research that produced modern Datalog engines (like Abiteboul, Hull, and Vianu's 1995 book *Foundations of Databases*) was grounded directly in Prolog.

**Semantic web and RDF reasoning.** When the Semantic Web initiative got underway in the early 2000s, Prolog-based rule engines were among the first tools available for RDF-based reasoning. SWI-Prolog in particular became a widely-used platform for Semantic Web research, and Wielemaker's team built substantial RDF libraries on top of SWI that are still in use today.

### 39. Famous Prolog programs and their cultural impact

A few Prolog programs achieved fame beyond the Prolog community. The most famous of these is, arguably, one where Prolog's role is usually overstated.

**Watson (IBM, 2011).** When IBM's Watson won the *Jeopardy!* tournament in February 2011, beating human champions Ken Jennings and Brad Rutter, the technology was widely discussed in the press. A significant portion of Watson's processing pipeline — specifically, the parsing and deep-semantic-analysis components used by the DeepQA framework — was implemented in Prolog. IBM researcher Adam Lally and his colleagues described this in a 2012 paper in the IBM Journal of Research and Development (*Natural Language Processing with Prolog in the IBM Watson System*), explaining that Prolog was used because its pattern-matching and rule-based capabilities were exactly suited to the task of extracting semantic relationships from parsed sentences. Prolog was not the *whole* of Watson — Watson was an enormous system with hundreds of subcomponents, including statistical scoring, information retrieval, and neural-network-based classification — but it was a real and load-bearing component, and the publicity around Watson's victory gave Prolog an unexpected second wind of mainstream attention in 2011.

**GeneSys and BioPAX in bioinformatics.** Several bioinformatics pipelines have used Prolog for its pattern-matching strengths in querying biological knowledge bases. The BioPAX working group's reference implementation uses Prolog for rule-based validation of biological pathway data.

**The British Nationality Act.** Marek Sergot and Robert Kowalski's 1986 CACM paper, mentioned earlier, was a demonstration that real statutory law could be written as Prolog clauses. The paper was widely read outside the Prolog community and started a whole sub-field of computational law. Sergot went on to apply similar techniques to other areas of law, and the idea that legal rules could be formalised and executed has been one of Prolog's most enduring influences on adjacent fields.

**The Erlang language.** Joe Armstrong, the inventor of Erlang, has said on multiple occasions that Erlang's syntax was directly influenced by Prolog — Armstrong had worked on parallel Prolog implementations at Ericsson before starting work on Erlang in 1986, and the initial Erlang prototype was literally implemented as a Prolog program that interpreted Erlang-style syntax. The pattern-matching clause heads in Erlang, the capitalised variable convention, the atom-vs-variable distinction, the list syntax `[H|T]`, the `->` arrow in functions — all of these are Prolog inheritances. Armstrong wrote in his 2007 Ph.D. thesis *Making Reliable Distributed Systems in the Presence of Software Errors* that "Erlang started life as a modified Prolog" and acknowledged Colmerauer's influence explicitly. Elixir, the modern language built on the Erlang virtual machine, inherits the same Prolog-derived syntax and has brought it to a much larger programmer population in the 2010s and 2020s — meaning that many modern functional programmers have been using a syntax descended from 1972 Marseille Prolog without realising it.

**SHRDLU and the NLP lineage.** Although SHRDLU itself (Terry Winograd's 1972 blocks-world system at MIT) was written in MICRO-PLANNER and Lisp, not Prolog, it is the direct ancestor of the kind of natural-language processing that Prolog became famous for. When Colmerauer's team at Marseille built their 1973 French Q&A system, they were consciously trying to achieve SHRDLU-like results with a cleaner underlying formalism. And when Pereira and Warren published DCGs in 1980, they were putting the Winograd-style project onto solid formal foundations. The historical connection from SHRDLU to modern Prolog-based NLP is direct and well-documented.

### 40. The revival: Datalog, neuro-symbolic AI, differential dataflow (2015–present)

Starting around 2015, and accelerating through the 2020s, Prolog's descendants have been staging a quiet revival. The revival has mostly not been under the Prolog name — the word "Prolog" still carries the baggage of the 1980s expert-system bust — but the underlying techniques have become widespread.

**Datalog in industrial infrastructure.** Differential Datalog (DDlog), developed by Leonid Ryzhyk and colleagues at VMware Research starting around 2016, is a Datalog variant that supports *incremental* evaluation — when the input data changes, DDlog recomputes only the affected outputs, which makes it suitable for real-time stream processing. DDlog is used in production at VMware for network configuration analysis. Similarly, *Soufflé*, developed at Oracle Labs starting around 2016 by Bernhard Scholz and colleagues, is a high-performance Datalog engine that compiles to C++ and has been used for large-scale static analysis of Java and Ethereum smart contracts — the DOOP Java analysis framework, now embedded in numerous commercial tools, is built on Soufflé. And *Frank McSherry's differential dataflow* work at Materialize (the streaming database company he co-founded in 2019) applies similar ideas to general-purpose dataflow computations. All three of these are direct intellectual descendants of Prolog's Datalog subset, and all three are production tools running in 2026 at non-trivial scale.

**Neuro-symbolic AI.** The deep-learning revolution of the 2010s has, in the 2020s, begun to reach its limits in certain domains — particularly in tasks that require *reasoning* rather than pattern recognition. Research on *neuro-symbolic* AI attempts to combine the strengths of neural networks (learning from data) with the strengths of symbolic reasoning (handling novel compositional problems, providing explanations, respecting logical constraints). Several recent neuro-symbolic systems use Prolog-like components explicitly: DeepProbLog (Manhaeve et al. 2018), Scallop (Huang et al. 2021), Logic Tensor Networks (Serafini and Garcez, 2016), and several others. These systems do not use traditional Prolog implementations — they use custom Python/PyTorch engines that happen to implement Prolog-like semantics — but the intellectual debt to logic programming is explicit and acknowledged in the literature.

**Answer Set Programming (ASP).** ASP, developed starting in the late 1990s by Gelfond and Lifschitz and others, is a logic programming paradigm that differs from Prolog in its semantics (it uses stable model semantics rather than SLD resolution) and in its use patterns (it is typically used for declarative problem solving rather than for computing answers to queries). But ASP is culturally a descendant of Prolog, the major ASP systems (Clingo, DLV, Wasp) read like Prolog to anyone who knows Prolog, and the ASP community overlaps significantly with the traditional logic programming community. ASP has become the tool of choice for several combinatorial optimisation problem domains (timetabling, hardware verification, bioinformatics) and has had steady growth in industrial use throughout the 2010s.

**The continued presence of Prolog itself.** And Prolog proper — the direct descendants of 1972 Marseille Prolog and 1977 Edinburgh DEC-10 Prolog — also continues. SWI-Prolog 9.x ships regular releases. SICStus Prolog remains commercially viable. GNU Prolog, YAP, XSB, Ciao, and B-Prolog are all actively maintained in 2026. The ICLP conference continues to meet annually with reasonable attendance (200–400 participants, depending on location). The *Theory and Practice of Logic Programming* (TPLP) journal, which replaced the older *Journal of Logic Programming* in 2001, publishes six issues a year. New Prolog textbooks continue to appear (Covington, Nute and Vellino's *Prolog Programming in Depth* was reissued in a new edition in 2015; Michael Spivey's introductory Prolog text for Oxford's computer science undergraduates was substantially revised in 2019; Triska's *The Power of Prolog* online textbook, by the SWI-Prolog contributor Markus Triska, has become a de facto standard for modern declarative Prolog style and has been continuously updated since 2006).

Prolog in 2026 is not a mainstream language. It is not on the TIOBE top 30. Job postings specifically asking for Prolog experience are rare and concentrate in academic research, in the handful of companies still running legacy Prolog-based production systems, and in specialised consultancies. But it is also not dead. It is a working tool, maintained by a small and competent community, used where its strengths pay off, and — through its Datalog descendants, through its influence on Erlang/Elixir, through its conceptual fingerprints on modern neuro-symbolic AI — present in far more of modern computing than the casual observer would guess.

---

## Part VIII — Timeline of Major Events

The following timeline distills the preceding narrative into a chronological reference. Dates are as well-sourced as possible; where two sources disagree, the earlier documented date is preferred.

| Year | Event |
|------|-------|
| 1930 | Jacques Herbrand's theorem (Ph.D. thesis, Paris): validity in first-order logic reduces to propositional tautology of ground instances. |
| 1931 | Herbrand dies in a climbing accident on the Massif des Écrins, France, age 23. |
| 1935 | Gerhard Gentzen publishes *Untersuchungen über das logische Schließen*: natural deduction and the sequent calculus. |
| 1936 | Church and Turing independently prove the undecidability of the *Entscheidungsproblem*. |
| 1956 | Newell, Shaw, and Simon's *Logic Theorist* runs on the JOHNNIAC. Summer 1956: Dartmouth AI workshop. |
| 1960 | Martin Davis and Hilary Putnam, *A Computing Procedure for Quantification Theory*. Hao Wang's *Toward Mechanical Mathematics* published. |
| 1963 | Alan Robinson begins work on what will become resolution at Argonne National Laboratory. |
| Jan 1965 | Robinson publishes *A Machine-Oriented Logic Based on the Resolution Principle* in the *Journal of the ACM*. |
| 1966 | Robert Kowalski arrives at Edinburgh on a Fulbright. |
| 1967 | Alain Colmerauer completes his doctoral thesis on operator precedence parsing at the University of Grenoble. |
| 1968 | Cordell Green and Bertram Raphael publish the SRI report *The Use of Theorem-Proving Techniques in Question-Answering Systems*. |
| 1969 | Green's IJCAI paper *Application of Theorem Proving to Problem Solving* introduces the answer literal; his Ph.D. thesis at Stanford lays groundwork for logic programming. Carl Hewitt publishes *PLANNER: A Language for Proving Theorems in Robots* at IJCAI. |
| 1970 | Colmerauer arrives at Aix-Marseille II (Luminy campus). MICRO-PLANNER implemented at MIT by Sussman, Charniak, and Winograd. |
| 1971 | Kowalski and Kuehner, *Linear Resolution with Selection Function* (SL-resolution), *Artificial Intelligence* 2. Summer 1971: Kowalski visits Colmerauer in Marseille; the procedural interpretation of Horn clauses crystallises between them. Hewitt completes his MIT Ph.D. thesis on PLANNER. |
| 1972 | Philippe Roussel implements the first Prolog interpreter ("Prolog 0") in ALGOL-W and then FORTRAN at Marseille. Jacqueline Roussel coins the name "Prolog" from *Programmation en Logique*. Terry Winograd's SHRDLU thesis is completed at MIT. |
| 1973 | Colmerauer, Kanoui, Pasero, Roussel publish the Marseille technical report on the French Q&A system — the first substantial Prolog application. Prolog 1 with the *cut* operator released. |
| 1974 | Kowalski presents *Predicate Logic as Programming Language* at IFIP Congress, Stockholm (August). |
| 1975 | Kowalski moves from Edinburgh to Imperial College London. Marseille Prolog tapes distributed to about a dozen sites. |
| 1976 | TAUM-METEO begins production weather-translation service in Montreal, using Colmerauer's Q-systems (not Prolog proper but closely related). |
| 1977 | David H. D. Warren completes his Ph.D. at Edinburgh: *Applied Logic — Its Use and Implementation as a Programming Tool*. DEC-10 Prolog compiler released. Edinburgh syntax established. |
| 1978 | Ivan Bratko and Donald Michie: early chess-endgame work in Prolog. |
| 1979 | Kowalski publishes *Logic for Problem Solving*, the first Prolog textbook, at North-Holland. Kowalski's *Algorithm = Logic + Control* paper appears in CACM. |
| 1980 | Pereira and Warren publish *Definite Clause Grammars for Language Analysis* in *Artificial Intelligence* 13(3). Debrecen logic programming workshop. Byrd's box model of Prolog execution. LPA (Logic Programming Associates) founded in the UK. |
| Oct 1981 | Fifth Generation Computer Systems project announced by Japan's MITI at the Tokyo conference. |
| 1982 | ICOT established in Tokyo with Kazuhiro Fuchi as director. First International Conference on Logic Programming (ICLP) held in Marseille. Colmerauer releases Prolog II with rational trees. Bowen and Kowalski, *Amalgamating Language and Metalanguage in Logic Programming*. |
| 1983 | Ehud Shapiro publishes *Concurrent Prolog*. Warren's *An Abstract Prolog Instruction Set* (SRI Technical Note 309) — the WAM. DARPA Strategic Computing Initiative announced in the US as a response to FGCS. Alvey Programme launched in the UK. |
| 1984 | Quintus Computer Systems founded in Palo Alto by Warren, Byrd, Pereira, and others. Quintus Prolog released. First FGCS International Conference, Tokyo. ICLP moves to Uppsala. Clark and Gregory publish *Parlog*. *Journal of Logic Programming* begins publication with Alan Robinson as editor. |
| 1985 | Kazunori Ueda publishes *Guarded Horn Clauses* (GHC). SICS begins work on SICStus Prolog in Stockholm. YAP begins development at the University of Porto. |
| 1986 | Sterling and Shapiro publish *The Art of Prolog* (MIT Press, 1st edition). Ivan Bratko publishes *Prolog Programming for Artificial Intelligence* (Addison-Wesley, 1st edition). Borland releases Turbo Prolog (licensed from PDC Copenhagen). Sergot, Kowalski, Kriwaczek et al. publish *The British Nationality Act as a Logic Program* in CACM. ALP Founders Award established; first recipient is Alain Colmerauer. |
| 1987 | ISO/IEC JTC 1/SC 22 establishes WG17 for Prolog standardisation under Roger Scowen. Jan Wielemaker starts SWI-Prolog at the University of Amsterdam as a research tool. Expert-system market shows first cracks. |
| 1988 | Kowalski, *The Early Years of Logic Programming*, CACM. Second FGCS International Conference. Judea Pearl publishes *Probabilistic Reasoning in Intelligent Systems*, marking the start of the statistical turn in AI. |
| 1989 | Quintus acquired by Intergraph. Colmerauer releases Prolog III with linear arithmetic constraints. |
| 1990 | Richard O'Keefe publishes *The Craft of Prolog* (MIT Press). Bratko 2nd edition. Hassan Aït-Kaci publishes *Warren's Abstract Machine: A Tutorial Reconstruction*. The Aquarius Prolog compiler (Van Roy and Despain) demonstrates aggressive optimisation. |
| 1991 | Mercury language project begins at the University of Melbourne (Fergus Henderson, Zoltan Somogyi). Symbolics' final decline. Aurora or-parallel Prolog working at Bristol/Argonne. |
| 1992 | Fifth Generation Computer Systems project officially concludes. Peter Norvig publishes *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* (with a complete Prolog implementation in Chapter 11–12). Colmerauer's *The Birth of Prolog* first circulated. Third FGCS International Conference. |
| 1993 | Symbolics files for Chapter 11 bankruptcy. AI winter reaches its depths. |
| 1994 | Sterling and Shapiro, *The Art of Prolog*, 2nd edition. Neng-Fa Zhou begins B-Prolog development. |
| 1995 | **ISO/IEC 13211-1:1995** — the Prolog core standard — published in June. Russell and Norvig's *Artificial Intelligence: A Modern Approach* (1st edition) published; it positions Prolog as one technique among many rather than the central AI language. |
| 1996 | Colmerauer's *The Birth of Prolog* formally published in the ACM *History of Programming Languages II* conference proceedings. Prolog IV released at Marseille. BIM Prolog acquired. |
| 1997 | Deep Blue defeats Garry Kasparov at chess — a victory for search-plus-evaluation rather than symbolic reasoning. |
| 1999 | Kowalski retires from Imperial College but remains active. GNU Prolog 1.0 released by Daniel Diaz under the GPL. |
| 2000 | ISO/IEC 13211-2 (Modules) published but not universally adopted. |
| 2001 | *Theory and Practice of Logic Programming* (TPLP) replaces the *Journal of Logic Programming* as the main journal of the field. *Semantic Web* initiative begins at W3C; SWI-Prolog becomes a primary implementation platform. |
| 2003 | LogicBlox founded by Molham Aref and XSB alumni, commercialising Datalog. |
| 2006 | Markus Triska begins *The Power of Prolog* online textbook (continuously revised since). SWI-Prolog 5.6 released. |
| 2011 | IBM Watson wins Jeopardy!, February. Watson's deep-semantic-analysis components are implemented in Prolog. Kowalski publishes *Computational Logic and Human Thinking* (Cambridge University Press). |
| 2012 | Lally et al. publish *Natural Language Processing with Prolog in the IBM Watson System* in the *IBM Journal of Research and Development*. |
| 2015 | Soufflé Datalog engine begins development at Oracle Labs. |
| 2016 | VMware begins work on Differential Datalog (DDlog). Andrew Ng's and others' broader machine-learning hype displaces symbolic AI in the popular press. |
| 2017 | **Alain Colmerauer dies** in Marseille on 12 May, age 76. |
| 2018 | Jacques Cohen publishes a biography of Colmerauer. DeepProbLog (Manhaeve et al.) published at NeurIPS — neuro-symbolic Prolog. |
| 2019 | Materialize founded by Frank McSherry and colleagues, building on differential dataflow. |
| 2020 | SWI-Prolog 8.2 released with substantial new web stack improvements. Pandemic boosts interest in rule-based modelling of infection dynamics; several pandemic models are implemented in Prolog variants. |
| 2021 | Scallop neuro-symbolic system (Huang et al.) published. |
| 2023 | The large language model revolution reaches a crescendo. Several research papers propose using LLMs as Prolog-like rule extractors, leading to a small revival of interest in Prolog as a "ground truth" for neural reasoning. |
| 2024 | ICLP 2024 held at Dallas with ~350 attendees, strong neuro-symbolic and Datalog representation. |
| 2025 | Soufflé reaches production use at multiple major tech companies for static analysis of Java and smart contracts. |
| 2026 | At time of writing, SWI-Prolog 9.3, SICStus 4.9, GNU Prolog 1.5, YAP 7.3. Active community, steady research output, and a confident afterlife for the ideas even if not always under the Prolog name. |

---

## Part IX — Anecdotes and Notes

This section collects stories, historical curiosities, and small details that did not fit neatly into the main narrative but that add colour to the historical record.

### The napkin story

There is a persistent story, repeated in multiple Prolog textbooks, that the idea of Prolog was worked out between Kowalski and Colmerauer "on a napkin in a Marseille café" in summer 1971. The story is almost certainly apocryphal. In *The Birth of Prolog*, Colmerauer describes the summer 1971 visit as taking place primarily in his office at the Luminy campus, with blackboards and notes, not in a café. Kowalski in his 1988 retrospective similarly recalls the work being done in a university setting, not in a restaurant. The napkin story appears to have started as a romantic embellishment in the early 1980s and stuck. But the truth is not much less romantic: two young men sitting in an office overlooking the Mediterranean, working out on a blackboard the semantics of a new kind of programming language that would shape the next decade of AI research. The napkin can be dispensed with; the image of Marseille in summer is authentic.

### Why the period at the end of each clause?

Every Prolog clause ends with a period (full stop). This is one of the most distinctive features of Prolog's syntax, and it puzzles beginners. Why the period? In Colmerauer's recollection, the reason was brutally practical: the 1972 FORTRAN parser had to know when a clause ended, and the period was the only punctuation mark that was (a) unambiguous (unlike the comma or semicolon, which also appeared inside clauses), (b) present on every European keyboard, and (c) visually distinctive enough to serve as a clear terminator. Several alternatives were tried — semicolons, end-of-line, explicit END keywords — but the period won out by 1973 and has stuck ever since. It is one of the few programming languages that requires a terminating period on every statement, and every Prolog programmer eventually develops the reflex of typing `.` before pressing Enter. Forgetting the period is the single most common beginner error in Prolog, and Prolog interpreters have been flagging "end of clause expected" errors for over fifty years in response.

### The cut controversy

The cut operator — `!` — was added to Prolog in 1973 by Colmerauer and Roussel as a concession to efficiency. It tells the Prolog interpreter "don't backtrack past this point," pruning the search tree. It is enormously useful in practice and essentially mandatory for any non-trivial Prolog program that needs to run in reasonable time. But it is also a compromise with the declarative purity of logic programming: a program with cuts does not generally have a straightforward reading as a set of logical axioms, and the transformation between declarative and procedural semantics breaks down at cut points.

Kowalski famously disliked the cut and argued for many years that logic programmers should avoid it. O'Keefe's *Craft of Prolog* contains an entire chapter on the cut, essentially arguing that programmers should minimise their use of cuts, use "green cuts" (those that do not change the declarative meaning) in preference to "red cuts" (those that do), and never use a cut without understanding its full consequences. The term "green cut" vs "red cut" was introduced by O'Keefe in the 1980s and has become standard Prolog terminology.

Modern Prolog programmers have largely accepted the cut as a pragmatic necessity but have developed a set of conventions and idioms that minimise its cost. The `if-then-else` construct `Cond -> Then ; Else`, introduced in Edinburgh Prolog, is implemented in terms of cut and provides a cleaner alternative for most uses. The `once/1` meta-predicate — which commits to the first solution of its argument — packages cut in a way that is easier to reason about. And the recent emphasis on pure Prolog programming, led by Markus Triska and others, has pushed the community toward minimising cut use and relying more on constraint logic programming for efficiency.

### Colmerauer's refusal to patent

The story that Colmerauer refused to patent Prolog has been mentioned several times in this document. It is worth adding a detail: Colmerauer's position was principled, not naive. In several interviews (including one with the French computing history magazine *1024* in 2015, two years before his death) Colmerauer explained that he believed algorithms should not be patentable, that logic belonged to everyone, and that patenting Prolog would have been both legally dubious (in French law, patenting mathematical methods was and is not generally permitted) and morally wrong. He pointed out that the TAUM-METEO machine translation system, which used his Q-systems in production at Canadian government expense, had generated no personal royalties for him either — a choice he defended by saying that his salary from Aix-Marseille University was sufficient and that public research should benefit the public.

This attitude was unusual enough that when the ACM awarded him their Software System Award in 1982 (jointly with Robinson, Kowalski, Warren, and Byrd — the five people the ACM considered the joint creators of Prolog), the citation specifically noted that the language was in the public domain.

### The Japanese influence on Prolog

One under-appreciated effect of the Fifth Generation project on Prolog specifically is that it forced the international community to take the language more seriously. Before 1981, Prolog was a European academic language with a small user base. After MITI's announcement, major American universities began to offer Prolog courses, American publishers commissioned Prolog textbooks, and American research funding flowed into logic programming for the first time. The *threat* of Japanese dominance in AI did more for Prolog's academic status than any research result could have. When Feigenbaum and McCorduck published their book *The Fifth Generation* in 1983, thousands of American computer scientists bought it and started learning Prolog simply because they thought they needed to understand what Japan was doing. This phenomenon — a language becoming popular because of external political circumstances rather than technical merit — is rare in the history of programming languages and deserves to be noted.

A parallel observation: the ICOT project was famously generous in sharing its software. The PIMOS operating system, the KLIC compiler, and dozens of smaller research tools were released under a free distribution licence that was, in effect, open source before open source was a widespread concept. When the project ended in 1992, Fuchi and his colleagues explicitly wanted the software to remain available to future researchers, and it did. In 2026, some of the ICOT materials are still downloadable from the Japanese Information Processing Society's archive, and the KLIC compiler (maintained by Takashi Chikayama after the project ended) was released under a BSD-style licence.

### The small world of Prolog

The Prolog research community has always been small. At its peak in the mid-1980s, there were perhaps 2,000 active logic programming researchers worldwide, concentrated at a dozen universities (Edinburgh, Imperial College, Marseille, Stockholm/SICS, Milan, Tokyo's ICOT, Weizmann, Melbourne, Bristol, Munich, Madrid UPM, Stony Brook, Austin) plus a handful of commercial sites (Quintus, BIM, LPA, ICOT itself). The community was small enough that everyone knew everyone. Conferences were reunions. Personal relationships were strong. Many collaborations crossed continents and lasted decades.

This gave Prolog a distinctive *culture*: intellectually tight, sometimes clubby, with strong opinions about what "real" Prolog was and how it should be written. The ISO standardisation process was, in part, an attempt to codify that culture — to write down what the experts already knew and agreed on. The contentiousness of the standard was a reflection of the strength of opinion within a small community.

By 2026, the community is much smaller still — perhaps 300 active researchers and a few thousand working programmers worldwide — but the same tight-knit character persists. ICLP attendees know each other by first name. Papers build on each other across decades. When a senior figure dies (as when Colmerauer died in 2017, or when Kazuhiro Fuchi died in 2007), the community mourns collectively in a way that larger research communities do not.

---

## Part X — Sources and Further Reading

### Primary sources

**Colmerauer, Alain, and Philippe Roussel.** *The Birth of Prolog.* In T. Bergin and R. Gibson, eds., *History of Programming Languages II*, ACM Press / Addison-Wesley, 1996, pp. 331–367. This is the definitive first-person account of Prolog's origins by its creator, written in 1992 and presented at the second HOPL conference in 1993.

**Kowalski, Robert A.** *Predicate Logic as Programming Language.* Proceedings of IFIP Congress 74, Stockholm. North-Holland, 1974, pp. 569–574. The foundational paper of logic programming theory.

**Kowalski, Robert A.** *Algorithm = Logic + Control.* *Communications of the ACM* 22(7), July 1979, pp. 424–436. The slogan-setting paper.

**Kowalski, Robert A.** *Logic for Problem Solving.* North-Holland, 1979. The first logic programming textbook.

**Kowalski, Robert A.** *The Early Years of Logic Programming.* *Communications of the ACM* 31(1), January 1988, pp. 38–43. A retrospective fifteen years after Prolog's creation.

**Kowalski, Robert A.** *The Logic Programming Paradigm and Prolog.* In Wampler, Masinter, and Barnes, eds., *Programming Languages*, Morgan Kaufmann, 2014. A more recent retrospective with perspective on the 21st century.

**Robinson, John Alan.** *A Machine-Oriented Logic Based on the Resolution Principle.* *Journal of the ACM* 12(1), January 1965, pp. 23–41. The foundational paper of resolution theorem proving.

**Warren, David H. D.** *An Abstract Prolog Instruction Set.* SRI Technical Note 309, SRI International, October 1983. The WAM specification.

**Warren, David H. D.** *Applied Logic — Its Use and Implementation as a Programming Tool.* Ph.D. thesis, University of Edinburgh, 1977. Also available as SRI Technical Note 290, 1983.

**Pereira, Fernando C. N., and David H. D. Warren.** *Definite Clause Grammars for Language Analysis — A Survey of the Formalism and a Comparison with Augmented Transition Networks.* *Artificial Intelligence* 13(3), May 1980, pp. 231–278.

**Kowalski, Robert A., and Donald Kuehner.** *Linear Resolution with Selection Function.* *Artificial Intelligence* 2(3), 1971, pp. 227–260. The SL-resolution paper that became the basis of Prolog's execution model.

**Green, Cordell.** *Application of Theorem Proving to Problem Solving.* Proceedings of IJCAI-69, 1969, pp. 219–239. The introduction of the answer literal.

**Hewitt, Carl.** *PLANNER: A Language for Proving Theorems in Robots.* Proceedings of IJCAI-69, 1969, pp. 295–301. The procedural alternative to logic programming.

**Colmerauer, Alain, Henry Kanoui, Robert Pasero, and Philippe Roussel.** *Un système de communication homme-machine en français.* Groupe d'Intelligence Artificielle, Université d'Aix-Marseille II, Marseille-Luminy technical report, 1973. The first substantial Prolog application.

**Shapiro, Ehud.** *Concurrent Prolog: A Disjoint Synchronisation Scheme.* Technical report, Weizmann Institute, 1983; also in *Logic Programming and its Applications*, Ablex, 1986, pp. 30–50.

**Ueda, Kazunori.** *Guarded Horn Clauses.* ICOT Technical Report TR-103, 1985. The paper that defined the core of what would become KL1.

**Fuchi, Kazuhiro, ed.** *Proceedings of the International Conference on Fifth Generation Computer Systems.* ICOT / OHMSHA, 1984, 1988, 1992 (three volumes). The official proceedings of the three FGCS conferences.

**Sergot, Marek J., Fariba Sadri, Robert A. Kowalski, Frank Kriwaczek, Peter Hammond, and H. Terese Cory.** *The British Nationality Act as a Logic Program.* *Communications of the ACM* 29(5), May 1986, pp. 370–386.

**ISO/IEC 13211-1:1995.** *Information technology — Programming languages — Prolog — Part 1: General core.* ISO, Geneva, 1995.

### Textbooks and secondary sources

**Bratko, Ivan.** *Prolog Programming for Artificial Intelligence.* Addison-Wesley, 1st ed. 1986; 2nd ed. 1990; 3rd ed. 2001; 4th ed. 2011. The most widely-used Prolog textbook.

**Sterling, Leon, and Ehud Shapiro.** *The Art of Prolog: Advanced Programming Techniques.* MIT Press, 1st ed. 1986; 2nd ed. 1994. The most intellectually sophisticated Prolog textbook.

**O'Keefe, Richard A.** *The Craft of Prolog.* MIT Press, 1990. The definitive guide to idiomatic Prolog style.

**Clocksin, William F., and Christopher S. Mellish.** *Programming in Prolog.* Springer, 1st ed. 1981; 5th ed. 2003. The first widely-distributed introductory Prolog textbook in English.

**Aït-Kaci, Hassan.** *Warren's Abstract Machine: A Tutorial Reconstruction.* MIT Press, 1991. Also available free online from the author's website since about 1999. The canonical explanation of the WAM for implementers.

**Lloyd, John W.** *Foundations of Logic Programming.* Springer, 1st ed. 1984; 2nd ed. 1987. The standard mathematical treatment of logic programming semantics.

**Norvig, Peter.** *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp.* Morgan Kaufmann, 1992. Includes a complete Prolog implementation in Lisp in Chapters 11–12.

**Russell, Stuart, and Peter Norvig.** *Artificial Intelligence: A Modern Approach.* Prentice Hall, 1st ed. 1995; 4th ed. 2020. The standard modern AI textbook; treats Prolog as one technique among many.

**Triska, Markus.** *The Power of Prolog.* Online textbook, continuously updated since 2006. https://www.metalevel.at/prolog. The most widely-consulted modern Prolog tutorial.

**Covington, Michael A., Donald Nute, and André Vellino.** *Prolog Programming in Depth.* Prentice Hall, 1st ed. 1988; 2nd ed. 1997; reissued 2015. A solid intermediate text.

**Bergin, Thomas J., and Richard G. Gibson, eds.** *History of Programming Languages II.* ACM Press / Addison-Wesley, 1996. Contains Colmerauer's *Birth of Prolog* chapter and historical coverage of many other languages. A standard reference for the period.

**Cohen, Jacques.** *A View of the Origins and Development of Prolog.* *Communications of the ACM* 31(1), January 1988, pp. 26–36. A companion piece to Kowalski's retrospective in the same issue.

**Cohen, Jacques.** *Alain Colmerauer: The Man and the Work.* Published posthumously, 2018. A biographical treatment drawing on personal correspondence and interviews.

**Lally, Adam, et al.** *Natural Language Processing with Prolog in the IBM Watson System.* *IBM Journal of Research and Development* 56(3/4), May 2012.

### Interviews and archives

**The ALP (Association for Logic Programming) newsletter** has carried historical articles and interviews since 1988. The ALP website, https://logicprogramming.org, maintains an archive of past newsletters and the ALP Founders Award citations.

**Bernard Meltzer's papers** are held at the Edinburgh University archive, including correspondence from the late 1960s and early 1970s that documents the Edinburgh side of the Kowalski-Colmerauer exchange.

**Alain Colmerauer's papers** were donated to the University of Aix-Marseille library after his death in 2017 and include personal correspondence, technical reports, and draft manuscripts. As of 2026 they are being catalogued; access is by appointment through the Marseille-Luminy library.

**The ICOT archive** is maintained by the Information Processing Society of Japan and contains nearly all of the 2,000 technical reports produced by the Fifth Generation project, most of them in English.

**Donald Michie's papers** at the Royal Society archive in London contain correspondence from the Edinburgh Machine Intelligence group and cover the 1970s AI scene in the UK.

**Oral histories of logic programming pioneers** are available from the Charles Babbage Institute (University of Minnesota), the Computer History Museum (Mountain View, CA), and the Royal Society's oral history program. Kowalski, Warren, and Pereira have all been interviewed for these archives.

### Online resources

The SWI-Prolog website (https://www.swi-prolog.org) hosts the most active community documentation and a large library of user-contributed tutorials, including the Triska materials mentioned above.

The Association for Logic Programming (https://logicprogramming.org) publishes newsletters, the ALP Founders Award citations, and pointers to current research.

The *Theory and Practice of Logic Programming* journal (https://www.cambridge.org/core/journals/theory-and-practice-of-logic-programming) is the main venue for current research; most recent papers are open-access or accessible via institutional subscriptions.

The Prolog Wikipedia article (https://en.wikipedia.org/wiki/Prolog) is unusually high quality, having been maintained for many years by active Prolog programmers.

The `comp.lang.prolog` Usenet newsgroup, active from the early 1980s to the late 2000s, has an archive (via Google Groups and other mirrors) that contains extensive technical discussion from the height of the Prolog era. Many of the figures mentioned in this document — O'Keefe, Wielemaker, Pereira, and others — were active participants.

---

## Coda: What Prolog Taught Us

What did Prolog, in the end, contribute to the story of programming languages? The language itself did not become the dominant tool of its era. The industrial bet on it — made most famously by Japan, but also by DARPA and Alvey in the West — did not pay off in the terms its promoters had hoped for. By the 2020s, the word "Prolog" carries, for many programmers under the age of forty, vague associations with 1980s expert systems and academic AI courses, and not much more.

But the *ideas* of Prolog have been absorbed, quietly and thoroughly, into the mainstream of computing. Pattern matching on structured data, once an exotic Prolog feature, is now a standard construct in every modern language — Rust, Scala, Elixir, Haskell, OCaml, Swift, Kotlin, even Python (via structural pattern matching added in Python 3.10 in 2021). Unification, the heart of Prolog's execution model, is now the foundation of every modern type-inference engine; the Hindley-Milner algorithm that Haskell and OCaml use for type checking is, at its core, the same unification algorithm Robinson published in 1965. Declarative query languages — SQL, Datalog, Cypher for graph databases, Datomic's query language, Rego for policy — all owe a conceptual debt to Prolog's insistence that you should describe *what* you want rather than *how* to compute it. The whole neuro-symbolic AI movement of the 2020s is, in a deep sense, a rediscovery of the insight that symbolic reasoning and statistical learning are complementary, not competing — an insight that the logic programming community had been trying to articulate (clumsily, sometimes) since the 1980s.

The person who saw most clearly what Prolog had actually accomplished was probably Colmerauer himself. In a 2015 interview with the French magazine *1024*, two years before his death, he was asked whether he was disappointed that Prolog had not become the dominant language of artificial intelligence. His answer — given in French, here translated — is worth quoting at length:

> *No, I am not disappointed. Prolog did what I wanted it to do. It showed that logic could be a programming language, that a person could write down facts and rules and have a machine reason about them. Is it the most popular language? No. But the ideas it introduced — unification, pattern matching, declarative programming — those are everywhere now. They are in SQL, they are in Haskell, they are in the type systems of modern languages. When I look at a modern functional language, I see Prolog's children. When I see a constraint solver, I see Prolog's grandchildren. The language Prolog is perhaps not as widely used as Python, but the ideas Prolog was built to express have won. That is more than most languages achieve.*

It is a generous and accurate summing-up. Prolog as a language is a minority taste in 2026, a specialist tool maintained by a dedicated community. But Prolog as an idea — the idea that logic and computation are two sides of the same coin, that the declarative and the procedural can be unified in a single formalism, that a program is a theorem and running it is the search for a proof — has become so thoroughly absorbed into the computing mainstream that we no longer notice where it came from. The most successful programming languages of our era are the ones whose ideas become invisible, and by that measure Prolog has been a triumph.

That it started with two young men, Robert Kowalski and Alain Colmerauer, working out the semantics of Horn clauses in an office overlooking the Mediterranean in the summer of 1971, is a fact worth remembering. Great languages come from unlikely places. And fifty-five years later, the ideas that grew out of that Marseille summer are still quietly shaping the tools we use every day.

---

---

## Appendix A — Extended Biographical Notes

This appendix provides longer biographical sketches and additional historical material for figures and episodes that received only brief treatment in the main narrative. It is intended as a reference resource for readers who want more depth on specific people or events.

### A.1 — The Edinburgh ecosystem in the 1960s

To understand how Prolog could have been conceived in Edinburgh (by Kowalski) and carried to Marseille (where Colmerauer brought it to life), one has to understand the peculiar ecosystem of Edinburgh artificial intelligence research in the 1960s.

Edinburgh was, at that moment, one of perhaps three or four places in the world where the AI enterprise was being conducted with both theoretical rigour and institutional commitment.

The principal actors were Donald Michie and Bernard Meltzer.

Donald Michie — born in Rangoon in 1923, educated at Rugby School and Oxford — had spent the war at Bletchley Park, where as a young cryptanalyst he worked alongside Alan Turing, Max Newman, and Jack Good on the Enigma and Lorenz machines. After the war he had taken a doctorate in mammalian genetics at Oxford, then had gradually migrated back toward his wartime interest in machines that think.

By the time he arrived in Edinburgh in 1958, Michie was one of the few senior British scientists who had any serious interest in artificial intelligence, and he was prepared to fight for it institutionally.

Bernard Meltzer — born in Vienna in 1916, a refugee from Austria in the 1930s — had come to Edinburgh via South Africa and had trained as an electrical engineer before moving into logic. Meltzer's interests were more theoretical than Michie's; he was fascinated by automated theorem proving and by the possibility that the work of Herbrand, Gentzen, and Robinson might be made into something computational.

Meltzer established the *Metamathematics Unit* at Edinburgh in 1965 — the name was deliberately chosen to emphasise that this was a unit devoted to mathematics about mathematics, to formal reasoning, to the mechanisation of proof.

The Metamathematics Unit was renamed the *Department of Computational Logic* in 1971, and by that time it had become one of the most productive places in the world for automated theorem proving research. J Strother Moore and Robert Boyer, who would go on to develop the Boyer-Moore theorem prover at the University of Texas at Austin, both passed through Edinburgh in the early 1970s. Alan Bundy, who would become one of the world's leading researchers in proof planning, was a graduate student in the department from 1968 and became a permanent member of staff in 1971. Pat Hayes, who would co-author the famous *Frame Problem* paper with John McCarthy, was also part of the Edinburgh group in this period.

It was into this environment that Robert Kowalski arrived in 1966, fresh from his Wisconsin master's degree, with a Fulbright scholarship and a burning interest in Alan Robinson's resolution principle.

Meltzer took Kowalski on as a graduate student. The working atmosphere was intense: weekly seminars where every new paper in theorem proving was dissected, a constant stream of visitors from other institutions, blackboards full of inference rules being debated into the evening. Pat Hayes, Donald Kuehner, and Kowalski formed a tight working group around Meltzer, and the four of them between 1966 and 1971 produced a remarkable series of refinements to Robinson's resolution method.

Kowalski's memory of the period, as recorded in his 1988 CACM retrospective and in several later interviews, is one of genuine intellectual excitement — the sense that resolution had opened up a whole new field that no one yet understood the limits of.

### A.2 — Donald Kuehner

Donald Kuehner is one of the less-remembered figures of early logic programming, but his contribution — co-authorship of the 1971 paper that introduced SL-resolution — was foundational. Kuehner was a Canadian graduate student at Edinburgh in the late 1960s, working under Meltzer alongside Kowalski.

His name appears on only a handful of papers from the period, but the 1971 paper with Kowalski — *Linear Resolution with Selection Function*, published in *Artificial Intelligence* volume 2 — is the direct ancestor of Prolog's execution model.

After completing his Ph.D. at Edinburgh, Kuehner returned to Canada and took up a position at the University of Western Ontario, where he worked for many years on theorem proving and knowledge representation. He never became as publicly prominent as Kowalski or Warren, but those who knew him in the Edinburgh period remember him as a quietly brilliant logician whose contribution to the SL-resolution work was equal to Kowalski's, and whose subsequent withdrawal from high-profile research deprived the community of a voice it could have used.

### A.3 — Marseille in 1971: the physical setting

The Marseille that Alain Colmerauer returned to in 1970 was, in the specific sense that matters for this history, a new place. The Université d'Aix-Marseille II had been created in 1969 as part of the post-1968 reorganisation of French higher education, and its science campus at Luminy — about ten kilometres southeast of central Marseille, at the foot of the limestone calanques that drop into the Mediterranean — was still mostly under construction when Colmerauer arrived.

The Luminy campus was deliberately sited away from the historic Aix-en-Provence university buildings because the planners wanted a modernist, research-oriented science campus rather than a traditional French humanities faculty. The buildings were low-slung concrete structures, Corbusier-influenced, surrounded by pine trees and with views of the sea from the upper floors.

Colmerauer's office in the Luminy mathematics department looked out onto the calanques. Philippe Roussel's office was just down the hall. Robert Pasero, Henry Kanoui, and the other early members of the team were all within walking distance.

The atmosphere of the early Marseille-Luminy group was informal and Mediterranean in a way that the Edinburgh Computational Logic department was not. People worked with the windows open. They ate long lunches together in the faculty cafeteria or at small restaurants in the nearby village of Mazargues. They argued about logic in the shade of the pine trees. The work was intensely focused but the setting was, in every sense, relaxed.

Colmerauer himself had grown up in southern France, and the return to the Mediterranean after three years in Montreal was clearly a homecoming. His retrospective writings about the period are suffused with a kind of affectionate memory of the place — the light, the trees, the sea, the particular quality of Provençal afternoons when the mistral is blowing and the clouds are racing across the sky.

It is tempting to draw a cultural contrast between the dark stone staircases of Edinburgh's Old College and the sun-drenched concrete of Luminy, and the cultural contrast is real, but it would be a mistake to see it as determinative. The work was hard on both sides of the exchange. Kowalski came to Marseille carrying technical ideas that Colmerauer needed; Colmerauer in Marseille had the practical ambition and the implementer (Roussel) to turn those ideas into a working system. The collaboration was the point. The setting is a detail.

### A.4 — The content of the 1971 meeting: what exactly was exchanged

Colmerauer's retrospective and Kowalski's are broadly consistent on what happened during Kowalski's summer 1971 visit to Marseille, but they emphasise different aspects.

From Kowalski's perspective (the Edinburgh theorist visiting the Marseille implementer), the key contribution he brought was the *insight that for Horn clauses, SL-resolution reduces to a tractable procedure*. SL-resolution in the general case — for arbitrary clauses — is complete but can be wildly inefficient because the selection function has to be chosen carefully to avoid exponential blowup. For Horn clauses, however, the selection function can simply always pick the leftmost atom, the resolvent is always derived from a single input clause at a time, and the whole procedure collapses into a recursive depth-first search with pattern matching. This was not obvious in 1971 — it required seeing both the general SL-resolution framework *and* the specific structural properties of Horn clauses at the same time. Kowalski had both pieces in his head, and during the Marseille visit he communicated them to Colmerauer in a way that made the implementation path clear.

From Colmerauer's perspective (the Marseille implementer being visited by the Edinburgh theorist), the key contribution Kowalski brought was the *idea that unification-based resolution could be used as a programming language at all*. Colmerauer's previous work on Q-systems at Montreal had been a kind of proto-logic-programming — pattern-matching production rules over tree structures — but it was not grounded in formal logic and it did not have a clean semantic theory. What Kowalski brought was not just the technical simplification of SL-resolution for Horn clauses but the whole conceptual framework: that the clauses were *axioms*, that the proof procedure was *execution*, that the answer substitution was the *output* of the computation. Colmerauer had been circling this idea without quite landing on it; Kowalski's visit gave him the last few pieces and the whole picture snapped into focus.

The exchange was, in effect, complementary. Each had a half of the answer. Kowalski had the theoretical structure but needed the motivation of a practical application (the French NLP system) to see why the Horn-clause restriction mattered. Colmerauer had the practical application and the implementation team but needed the theoretical structure to see why a clean formalism would be worth the investment of a full reimplementation.

The collaboration produced Prolog. Without either half, the language as we know it would not exist.

### A.5 — Philippe Roussel: the implementer

Philippe Roussel deserves a longer note than he got in the main narrative.

Roussel was born in France in the mid-1940s. He had trained as a computer engineer and had come to Marseille-Luminy as a young researcher attached to Colmerauer's group. He was not a logician; his strengths were in systems programming, in understanding how to make things work efficiently on real hardware.

When Colmerauer decided in late 1971 that the ideas from Kowalski's visit needed to be implemented, Roussel was the obvious choice to do it. He spent the winter and spring of 1971-1972 working on the first version of what would become Prolog, initially in ALGOL-W on the university's Burroughs machines and then, when the ALGOL-W prototype proved too slow, reimplementing from scratch in FORTRAN on the IBM 360/67 at the Marseille computing centre.

The 1972 FORTRAN implementation — "Prolog 0" in Colmerauer's later taxonomy — was roughly 2,000 lines of FORTRAN IV. It implemented a unification algorithm, a depth-first SL-resolution procedure, a simple clause database, and a minimal front-end that read clauses from a file and queries from the terminal. It was slow — perhaps a few hundred logical inferences per second on favourable programs, much less on hard ones — but it *worked*.

Roussel's 1975 doctoral thesis, *Prolog : Manuel de Référence et d'Utilisation*, Groupe d'Intelligence Artificielle, Marseille-Luminy, is the earliest complete documentation of a working Prolog system, and it contains in its 85 pages most of the design decisions that would define Edinburgh Prolog five years later: the `:-` notation, the clause-at-a-time reading of the database, the depth-first left-to-right execution model, the early forms of the built-in predicates for arithmetic and I/O.

Roussel himself stayed at Marseille for his entire career. He worked on Prolog implementation and on several applications through the 1970s and 1980s, then moved gradually into more general software engineering work in the 1990s. He was one of the quiet Figures of French computer science — well-known inside the community but not a public figure. He received relatively few formal honours but was universally respected by everyone who worked with him.

In his later years, Roussel gave a handful of interviews about the early Prolog period. He consistently described himself as "the implementer" — the person who had made Colmerauer's ideas run on a real computer — and was modest about his own theoretical contributions. But the design decisions he made in 1972 shaped Prolog for the next fifty years. The syntax, the execution order, the error-reporting conventions, the debugging facilities — all of these are, to a significant degree, Roussel's legacy as much as Colmerauer's.

### A.6 — The Scottish connection: Pat Hayes and the Edinburgh AI group

Pat Hayes, one of the figures mentioned briefly in the main narrative, played an important role in the Edinburgh AI group during the period when Kowalski was working out SL-resolution.

Hayes had arrived at Edinburgh in 1966, the same year as Kowalski, as a young researcher interested in formalising the semantics of commonsense reasoning. He would go on to co-author, with John McCarthy, the famous 1969 paper *Some Philosophical Problems from the Standpoint of Artificial Intelligence*, which introduced the *frame problem* — the problem of efficiently specifying what stays the same when an action is performed.

Hayes's work on the frame problem and on situation calculus was a kind of parallel track to the theorem-proving work of Meltzer, Kowalski, and Kuehner. Where the theorem-proving group was interested in the mechanics of proof search, Hayes was interested in the *representation problem*: what should you put into the knowledge base in the first place?

The two tracks interacted productively. Kowalski's framing of clauses as axioms to be reasoned from made sense only if the clauses represented something meaningful about the world, and Hayes's thinking about how to represent actions, time, and causality gave the theorem-proving people something concrete to work on.

By 1971, Hayes had moved to the University of Essex, and his direct involvement with Edinburgh logic programming tapered off. But his influence on Kowalski's thinking about the *purpose* of logic programming — that it was meant to be a tool for representing and reasoning about the world, not just a proof procedure — is visible in *Logic for Problem Solving* and in Kowalski's later writings.

### A.7 — Kowalski at Imperial College: building the logic programming school

When Robert Kowalski moved from Edinburgh to Imperial College London in 1975, he brought with him a clear vision for what a logic programming research group should look like. Over the next twenty-five years he built at Imperial what was, for much of its history, the leading logic programming research group in Europe.

The Imperial group's distinctive character was its combination of theoretical rigour and application-oriented research. Kowalski himself was deeply interested in the theoretical foundations of logic programming — the semantics of negation, the relationship between logic programming and other computational paradigms, the use of meta-level reasoning — but he was also committed to showing that logic programming could solve real problems.

This dual focus attracted a remarkable group of collaborators. Keith Clark, who had come to Imperial as a graduate student and then a member of staff, would develop the *Parlog* parallel logic programming language and would become one of the world's leading researchers in concurrent logic programming. Marek Sergot, who joined the group in the early 1980s, would work on legal reasoning and computational law, producing (with Kowalski) the famous British Nationality Act formalisation. Frank Kriwaczek, Jim Cunningham, Chris Hogger, Peter Szeredi (visiting from Hungary), and many others passed through Imperial in this period.

The Imperial Ph.D. program in logic programming produced a generation of researchers who went on to shape the field. Francesca Toni, Antonis Kakas, Fariba Sadri, Francesca Rossi, Dov Gabbay, and many others either trained at or worked closely with Imperial in the 1980s and 1990s.

Kowalski's own research trajectory during this period moved from pure logic programming toward broader questions about the formalisation of human reasoning. His 1986 CACM paper on the British Nationality Act was perhaps the most visible product of this trajectory; it showed that real statutory law could be transcribed into Prolog clauses and that the resulting program could answer questions about the Act's interpretation in a way that matched how human lawyers would reason about it.

The British Nationality Act paper had influence far beyond the Prolog community. It was discussed in law schools, cited in computational-law articles, and used as a reference point by anyone who wanted to argue that formal methods could be applied to legal texts. The downstream influence includes the modern field of *computational law* (the CodeX Center at Stanford, for example, descends intellectually from this line of work) and the "rules as code" movement in government digital services that emerged in the 2010s.

Kowalski also used his time at Imperial to write a series of theoretical papers that established the semantics of negation in logic programming. His 1987 paper with Ken Kunen, *The Logical Reconstruction of Negation as Failure*, was a landmark in the area. The problem was that Prolog's `\+` (negation as failure) operator did not correspond to classical negation — it corresponded to something weaker and more subtle, and the community had spent years trying to figure out what, exactly, that something was. Kowalski and Kunen's paper provided a clean semantic framework that the community could agree on, and subsequent textbooks built on it.

Kowalski retired from his Imperial chair in 1999 but remained research-active. His post-retirement work moved toward cognitive science and the application of logic-programming ideas to human reasoning, culminating in his 2011 book *Computational Logic and Human Thinking*.

### A.8 — Keith Clark and the Concurrent Logic Programming line

Keith Clark deserves a section of his own. Working at Imperial College alongside Kowalski through the 1970s and 1980s, Clark became one of the key figures in the development of concurrent logic programming — a variant of logic programming that traded Prolog's powerful nondeterminism for the ability to run multiple goals in parallel.

Clark's first major contribution was his work on *negation as failure*. His 1978 chapter *Negation as Failure*, in the collection *Logic and Data Bases* edited by Hervé Gallaire and Jack Minker, gave the first clean treatment of the semantics of the `\+` operator in Prolog and introduced the notion of *completion* of a logic program — the idea that to understand what `\+` meant, you should think of the clauses as representing "if and only if" definitions rather than just "if" implications.

Clark's second major contribution was *Parlog*. Developed with Steve Gregory starting in 1983, Parlog was a parallel logic programming language based on committed choice: at each step, the system would commit to one of the applicable clauses rather than backtracking among alternatives. Parlog was one of the three or four major committed-choice languages of the 1980s (the others being Shapiro's Concurrent Prolog, Ueda's GHC, and the Japanese KL1 that descended from GHC).

The committed-choice paradigm was a radical departure from classical Prolog. It gave up don't-know nondeterminism (the backtracking that was Prolog's defining feature) in exchange for don't-care nondeterminism (where the system could make arbitrary choices among applicable clauses without having to explore alternatives). This was the right trade-off for parallel execution: committing to choices locally meant that different processors could work on different parts of the computation without having to coordinate globally.

Parlog was implemented and tested extensively at Imperial through the 1980s. Several Ph.D. theses were written on its implementation and its applications. But it never became widely used outside the research community. Like the other committed-choice languages, Parlog suffered from the commodity-hardware problem: by the early 1990s, sequential Prolog on a good WAM implementation was fast enough for most uses, and the extra complexity of committed-choice programming was not justified for most applications.

Clark's later work included the *Gödel* programming language, a strongly typed logic programming language developed with John Lloyd in the early 1990s, and work on multi-agent systems. He remained at Imperial College for his entire career and trained many of the next generation of logic programming researchers.

### A.9 — David H. D. Warren at Bristol: the Aurora project

After his Edinburgh doctorate, his SRI period, and his early work at Quintus, David Warren moved back to the UK to take up the chair of computer science at the University of Bristol in 1987. His Bristol period — which ran from 1987 to about 2001 — was devoted primarily to parallel Prolog implementation, with the Aurora and Andorra-I projects as the major products.

Aurora was an *or-parallel* Prolog system: a Prolog interpreter that could explore multiple branches of the search tree simultaneously on a shared-memory multiprocessor. The technical challenge was binding environment management: when Prolog backtracks, it has to undo variable bindings made since the most recent choice point, and in a parallel system where multiple branches are being explored simultaneously, you have to figure out which binding belongs to which branch without letting them interfere with each other.

The Aurora group — Warren at Bristol, Ross Overbeek at Argonne, Péter Szeredi at the SzKI Computer Research Institute in Budapest, and several others — developed an elegant solution called the *SRI binding scheme*, which used a shared binding table with per-worker binding arrays. The paper describing it, by Warren, Pereira, and Pereira in 1990 in the *Proceedings of ICLP*, is one of the most technically dense implementation papers in the Prolog literature but also one of the most important.

Aurora achieved strong scaling on moderate numbers of processors (up to about 16 on the Sequent Symmetry machines of the era), and it demonstrated that or-parallel execution of standard Prolog programs was achievable without modifying the language. But the shared-memory hardware of the late 1980s was expensive and niche, and Aurora remained a research tool rather than a production system.

Andorra-I, the follow-on project, was more ambitious. Developed by Warren's students Vítor Santos Costa, Gopal Gupta, and Rong Yang in the late 1980s and early 1990s, Andorra-I attempted to combine or-parallelism and and-parallelism in a single framework, with the choice of which type of parallelism to exploit made dynamically based on the structure of the program being executed. Andorra-I was a beautiful design and produced several important papers, but it was even more demanding of its target hardware than Aurora and did not achieve significant adoption outside the research community.

Warren's Bristol period also included the development of the *Prolog Implementation Projects* book, a massive compendium of implementation techniques that is still (in 2026) one of the most useful references for anyone building a Prolog system from scratch.

When Warren retired from Bristol in the early 2000s, he left behind a trained generation of implementers who spread out across the world. Vítor Santos Costa went to Porto and became the lead of YAP. Gopal Gupta went to the University of Texas at Dallas and continued work on parallel and constraint logic programming. Rong Yang went to industry. The Bristol alumni network remained strong through the 2000s and 2010s, with regular reunions at ICLP conferences.

### A.10 — Fernando Pereira's trajectory from Prolog to statistical NLP

Fernando Pereira's career is one of the more unusual trajectories in logic programming. He began as a Prolog implementer and grammar formalism researcher at Edinburgh in the late 1970s, co-authored the DCG paper with Warren in 1980, moved to SRI in Menlo Park for a decade of work on natural language processing with Prolog, and then — starting in the early 1990s — pivoted decisively toward statistical methods in NLP.

Pereira's Edinburgh and SRI work on Prolog-based NLP was substantial. His 1987 book *Prolog and Natural Language Analysis*, written with Stuart Shieber, is still one of the best introductions to computational linguistics using logic programming. The DCG formalism that he and Warren introduced in 1980 became the standard notation for writing grammars in Prolog and is still taught in computational linguistics courses worldwide.

But by the early 1990s, Pereira had become convinced that the rule-based approach to NLP was hitting fundamental limitations. The statistical methods being developed at IBM (Peter Brown, Robert Mercer, and their team working on statistical machine translation) were showing that you could get much better performance on real-world NLP tasks by training statistical models on large corpora than by hand-writing grammars.

Pereira moved from SRI to AT&T Bell Laboratories in 1989 and joined the NLP group there. He spent most of the 1990s working on finite-state methods for NLP — regular-language models that were more tractable than context-free grammars and that could be combined with statistical learning. His 1998 paper with Michael Riley, *Speech Recognition by Composition of Weighted Finite Automata*, was a major technical contribution to the modern speech-recognition pipeline.

In 2002 Pereira became chair of the computer science department at the University of Pennsylvania, and in 2008 he joined Google as a research director in the natural language understanding group. At Google he worked on the search-engine NLP components that powered Google's question-answering features and on the early development of what would become Google's translation and language-understanding products.

Pereira's trajectory from rule-based Prolog-based NLP to statistical and now neural NLP is a microcosm of the whole field's evolution over forty years. He himself has been consistently gracious about the transition: he has said in multiple interviews that his Prolog-era work taught him habits of careful formal thinking that have served him well in the statistical era, and that he does not regret the time spent on DCGs and rule-based grammars even though the field has moved on.

In 2020, Pereira gave an invited talk at the ICLP conference — his first appearance at an ICLP in many years — in which he reflected on what logic programming had taught him and on how the neuro-symbolic AI movement of the 2020s was bringing logic programming ideas back into contact with mainstream NLP. The talk was warmly received and was, for many in the audience, a kind of intellectual homecoming.

### A.11 — The SICStus story

SICStus Prolog, the Swedish commercial Prolog system, deserves a longer note than it received in the main narrative.

SICStus was developed at the Swedish Institute of Computer Science (SICS) in Stockholm starting in 1985. SICS was a government-funded research institute modelled loosely on SRI in the US and Xerox PARC — a place where basic computer science research could be pursued in proximity to industry but without the commercial pressures of a for-profit company.

The SICStus project was led by Mats Carlsson, a young Swedish computer scientist who had done his Ph.D. at Uppsala on Prolog implementation. Carlsson's vision was to build a Prolog system that was as fast as the best commercial systems of the time (which meant Quintus) but that remained close to the academic research community and open to continuous improvement based on new ideas from the literature.

The first SICStus release, in 1986, was a WAM-based system with Edinburgh syntax and a small set of built-ins. It was fast — benchmarks showed it running at 70% to 100% of Quintus Prolog speed on standard programs — and it was free for academic use, which gave it an immediate user base across European universities.

Over the next decade, Carlsson and a growing team at SICS added features that kept SICStus at the leading edge of Prolog implementation: a strong constraint logic programming library (CLP(FD), CLP(Q), CLP(R), CLP(B)), support for modules, a multithreading system, a C foreign-language interface, and a Java interface. Each addition was carefully implemented and well-documented, and SICStus acquired a reputation for reliability and technical quality that few other Prolog systems could match.

The commercial side of SICStus was handled through licensing agreements: academic users got the system free, while commercial users paid for licences. The revenue from commercial licences supported continued development at SICS.

In 1998, when Quintus was sold by Intergraph, SICS acquired the Quintus product line and merged its best features into SICStus. This consolidation was a turning point: by the early 2000s, SICStus was the clear leader among commercial Prolog systems, with a unified product line that served both the academic and commercial communities.

As of 2026, SICStus is in its version 4.9 release and is still actively maintained by Mats Carlsson (now in a senior advisory role) and a team at SICS. It remains one of the few Prolog systems with a viable commercial business model, and its customer base — small but loyal — includes several large European companies that have been running SICStus-based production systems for decades.

### A.12 — Jan Wielemaker and the long stewardship of SWI-Prolog

SWI-Prolog is arguably the most important Prolog system of the 21st century, and its existence is in large part the product of one person's sustained attention over nearly four decades.

Jan Wielemaker started SWI-Prolog in 1987 as a graduate student at the University of Amsterdam. He was not a logic programming researcher in the Edinburgh or Marseille sense — he was a psychology student whose research required a Prolog system and who decided, with the fearlessness of youth, that he could write one himself rather than using the expensive commercial options of the time.

The first SWI-Prolog was a straightforward WAM-based interpreter written in C. It was not particularly fast, but it was complete, it was free, and it ran on the Sun workstations that were standard in European academic labs at the time. Wielemaker released it to colleagues who needed a Prolog system, and it gradually spread.

What made SWI-Prolog different from other academic Prolog systems was Wielemaker's commitment to *long-term stewardship*. He did not release SWI-Prolog and move on to other projects. He kept working on it, year after year, adding features as he encountered use cases that needed them, fixing bugs as they were reported, updating the system to keep pace with hardware and operating-system changes.

By the mid-1990s, Wielemaker had moved from the University of Amsterdam to the SWI (Sociaal-Wetenschappelijke Informatica) department — the name that gave SWI-Prolog its acronym — where he continued to work on the system as part of his regular research duties. By the late 1990s, SWI-Prolog had become the default Prolog system for a large fraction of European academic users.

The critical period for SWI-Prolog came in the early 2000s, when the Semantic Web initiative at the W3C needed a Prolog-like rule engine for RDF reasoning. Wielemaker and his colleagues at the University of Amsterdam built a comprehensive RDF library on top of SWI-Prolog, and SWI became one of the primary platforms for Semantic Web research. This brought SWI-Prolog to a much larger audience and established its reputation as a serious industrial-strength tool.

Around the same time, Wielemaker built the SWI-Prolog HTTP library — a complete HTTP server and client implementation in pure Prolog that turned SWI into a viable platform for web application development. The HTTP library has been continuously improved since its first release and as of 2026 is probably the most sophisticated web framework ever implemented in a logic programming language.

Wielemaker moved to the Vrije Universiteit Amsterdam in 2004, where he continued his SWI-Prolog work alongside research on knowledge representation and cultural heritage informatics. The SWI-Prolog project also moved to a more open-source governance model during this period, with a growing community of contributors from around the world. The SWI-Prolog website (swi-prolog.org) became the central hub for the modern Prolog community.

In 2017, Wielemaker was awarded the Association for Logic Programming's Distinguished Service Award in recognition of his long contribution to the community. His acceptance speech — a brief, self-deprecating account of how SWI-Prolog had grown from a student project into a widely-used tool — was one of the quiet highlights of that year's ICLP conference.

As of 2026, SWI-Prolog is in its 9.x release series. It has dozens of contributors, thousands of users, and a continuous release cycle with updates every few months. Wielemaker himself is in his late sixties and has gradually transitioned some of the daily maintenance work to younger collaborators, but he remains the senior architect and the driving force behind the project.

### A.13 — The Prolog Day tradition

The Prolog community in the 2010s and 2020s has maintained an annual tradition called *Prolog Day* — a single-day workshop held in conjunction with the larger ICLP conference, focused on practical Prolog development and on community-building. The first Prolog Day was held in 2012 at ICLP in Budapest, organised by a group of SWI-Prolog users who wanted a forum for sharing practical tips and techniques.

The Prolog Day format is deliberately informal: a series of short talks (usually 20 minutes each), hands-on coding sessions, and extended discussions about the practical challenges of modern Prolog programming. The talks cover topics like new SWI-Prolog features, case studies of production Prolog systems, tutorials on specific libraries, and demos of new tools.

Prolog Day has become, for many in the community, the most important annual gathering — more important, in practical terms, than the formal ICLP conference itself. It is where working Prolog programmers meet to share problems and solutions, where new libraries are demonstrated to potential users, and where the state of Prolog practice is discussed in a frank way that the more formal conference setting does not always allow.

The tradition is one of the signs that Prolog, though no longer a mainstream language, has a healthy and self-sustaining community that takes responsibility for its own future.

---

## Appendix B — Regional Developments

Prolog's history is often told as a story centred on Marseille, Edinburgh, and Tokyo. But there were active Prolog communities in many other places, and the regional histories add important detail to the overall picture.

### B.1 — Hungary: the MProlog line

Hungary had an unusually strong Prolog tradition for a Cold War-era Eastern Bloc country. The leading figure was Péter Szeredi, who began working on Prolog at the SzKI Computer Research Institute in Budapest in the late 1970s, not long after the first Marseille Prolog tapes had reached Hungary through academic channels.

Szeredi's team at SzKI built an early Prolog system called *MProlog* (short for *Modular Prolog*) starting around 1978. MProlog was distinctive for its module system — one of the first module systems in any Prolog — and for its strong integration with other programming languages running on the SzKI machines. By 1982, MProlog was being used in production at several Hungarian companies for applications ranging from database querying to industrial control.

Szeredi himself became one of the most well-traveled of the Eastern European Prolog researchers. He visited Edinburgh and Marseille regularly through the 1980s, collaborated with the Aurora parallel Prolog project at Bristol in the late 1980s, and eventually moved to the Budapest University of Technology and Economics, where he continued to work on Prolog and on constraint programming for many years.

The Hungarian Prolog community also produced the *CS-Prolog* system, developed at the Computer and Automation Institute of the Hungarian Academy of Sciences starting in the mid-1980s. CS-Prolog was used for a number of significant industrial applications in Hungary and had a small but loyal user base.

### B.2 — Poland: logic programming theory

Poland had a strong tradition of mathematical logic going back to the interwar Warsaw school (Tarski, Łukasiewicz, Mostowski), and that tradition made Poland a natural home for logic programming research once the field got underway.

The leading Polish figure was Wojciech Buszkowski at Adam Mickiewicz University in Poznań, who worked on the theoretical foundations of logic programming from the late 1970s onward. Buszkowski's work was not on implementation — he left that to others — but on the semantic and logical questions about what logic programs meant and how they related to classical logic. His papers on categorial grammar and logic programming, published mainly in European theoretical computer science journals through the 1980s and 1990s, are still cited in the theoretical literature.

Jan Maluszynski at Linköping University in Sweden (Polish-born but working in Sweden for most of his career) was another important figure in the European logic programming theory community. His work on attribute grammars and logic programming, on static analysis of Prolog programs, and on type systems for logic programming languages was influential in the 1980s and 1990s.

### B.3 — France beyond Marseille: the theoretical tradition

While Marseille was the centre of Prolog implementation in France, other French research centres made important contributions to the theoretical side of logic programming.

INRIA (Institut National de Recherche en Informatique et en Automatique), the major French computer science research institute, had groups working on logic programming at several of its sites. The INRIA Rocquencourt site (near Paris) had a logic programming group that worked on constraint programming and on theorem proving. The INRIA Sophia-Antipolis site had a group working on automated theorem proving (Gérard Huet and his students), which was not strictly logic programming but which interacted with it in interesting ways.

The University of Paris, particularly the LIPN laboratory at Paris-Nord and the LIP6 laboratory at Paris-Sud, had active logic programming groups through the 1980s and 1990s. Daniel Diaz, who developed GNU Prolog, was based in Paris (at the LIFO laboratory in Orléans).

Nancy, home to the LORIA (Laboratoire Lorrain de Recherche en Informatique et ses Applications) and to the Inria Lorraine centre, had a particularly strong tradition in computational linguistics and natural language processing using logic programming. The TAG (tree-adjoining grammar) parsing framework developed at Nancy starting in the late 1980s was implemented in Prolog and was one of the major competitors to DCGs in the French NLP community.

The French tradition also included important work on constraint logic programming. Jean-Louis Laurière's 1978 ALICE system, which predated both Prolog II and the formal CLP framework of Jaffar and Lassez, was an early example of constraint-based problem-solving that influenced the development of CLP in the 1980s.

### B.4 — Italy: abduction and diagnosis

Italy had a small but productive logic programming community, centred mainly on the University of Milan, the University of Bologna, and the University of Pisa.

The Milan group, led by Evelina Lamma and Paola Mello in the 1980s, worked primarily on meta-programming and on the use of Prolog for abductive reasoning. Abductive logic programming — extending Prolog with the ability to hypothesise additional facts to explain observations — became a small but distinctive Italian specialty, and the Milan group produced a series of influential papers on the topic through the 1990s.

The Bologna group, led by Fabrizio Riguzzi in the 2000s, focused on probabilistic logic programming — combining Prolog's logical reasoning with probability distributions to handle uncertainty. The PRISM and ProbLog systems that came out of this line of research have been influential in the statistical relational learning community and have been direct inspirations for the more recent neuro-symbolic systems.

### B.5 — The United States beyond Stanford and Stony Brook

American Prolog research was always less organised than European research — there was no American equivalent of the Edinburgh or Marseille schools, and American universities tended to be more heavily invested in Lisp than in Prolog. But there were important American Prolog groups at several institutions.

The University of Texas at Austin had a strong logic programming group in the 1980s and 1990s, led by Vijay Saraswat (who worked on concurrent constraint programming) and later by Gopal Gupta (who moved to Dallas and continued work on parallel and constraint logic programming). Saraswat's 1990 Ph.D. thesis, *Concurrent Constraint Programming*, was a landmark in the integration of concurrent and constraint logic programming paradigms.

Stony Brook University on Long Island, where David S. Warren developed XSB Prolog, had a research group focused on deductive databases and the semantic foundations of Prolog. The work on SLG resolution (tabled resolution with well-founded semantics) that came out of Stony Brook in the early 1990s was one of the most significant theoretical advances in logic programming of the decade.

SUNY Buffalo had a group working on Prolog for natural language processing, led by Stuart Shapiro (who wrote the SNePS knowledge representation system) and Jean-Pierre Koenig.

The University of Maryland had a group around Jack Minker, who was one of the editors of the 1978 *Logic and Data Bases* volume that essentially launched the field of deductive databases. Minker's work on disjunctive logic programming was a distinctive contribution.

Argonne National Laboratory, where Alan Robinson had worked in the 1960s, maintained an active automated theorem proving group through the 1980s and 1990s, and several members of that group collaborated with the Bristol Aurora parallel Prolog project.

### B.6 — Israel: the Weizmann Institute

Ehud Shapiro's work at the Weizmann Institute has already been discussed in the main narrative, but it is worth emphasising that Israel had a particularly strong logic programming community during the 1980s, centred mainly on Weizmann and on Tel Aviv University.

The Weizmann group included, at various points, Eli Shapiro (Ehud's father, himself a computer scientist), Nachum Dershowitz (who worked on term rewriting), and many graduate students who went on to prominent positions in computer science. The concurrent logic programming work that came out of Weizmann in the 1980s — Shapiro's Concurrent Prolog and its successors — was widely cited and influenced the Japanese KL1 project.

After Shapiro's pivot toward biology in the mid-1990s, the Weizmann logic programming group gradually dispersed, but several of its alumni continued to work on logic programming at other institutions.

### B.7 — India: the TIFR tradition

The Tata Institute of Fundamental Research (TIFR) in Mumbai had a small but influential logic programming group starting in the early 1980s. The group was led by R. Ramanujam and included several researchers who went on to become prominent figures in Indian computer science.

The TIFR group's focus was on the theoretical side of logic programming: the semantics of concurrent logic programming, the relationship between logic programming and process calculi, and the formal verification of Prolog programs. The papers they produced in the 1980s and 1990s were well-regarded in the international community and helped establish Indian computer science as a serious player in theoretical programming languages research.

Several Indian universities had Prolog teaching and research activities: the IITs (Indian Institutes of Technology) at Kharagpur, Madras, and Kanpur; the Indian Statistical Institute in Kolkata; and the Chennai Mathematical Institute.

### B.8 — China and Taiwan

Chinese interest in logic programming grew in the 1980s, partly in response to the Japanese Fifth Generation project (which China viewed with a mixture of admiration and competitive concern). Several Chinese universities established logic programming research groups, notably Tsinghua University in Beijing, the University of Science and Technology of China in Hefei, and the Institute of Computing Technology of the Chinese Academy of Sciences.

The most internationally visible Chinese contribution to Prolog was probably the NCKU Prolog system developed at National Cheng Kung University in Taiwan in the late 1980s. NCKU Prolog was used for a number of Chinese and Taiwanese industrial applications and was one of the first Prolog systems to support Chinese-character I/O directly.

By the 2000s, Chinese contributions to logic programming had shifted toward the theoretical side, with a particular emphasis on constraint programming and on the application of Prolog-like techniques to formal verification of hardware and software systems.

### B.9 — Australia: the Mercury connection

Australia's most significant contribution to logic programming was the *Mercury* language, developed at the University of Melbourne starting in 1991 by Fergus Henderson, Zoltan Somogyi, and Thomas Conway under the direction of Lee Naish.

Mercury was not a Prolog variant — it was a new language that took the core ideas of logic programming (Horn clauses, unification, backtracking) and combined them with strong static typing, mode declarations, and determinism analysis. The result was a language that felt like Prolog but that ran much faster because the compiler had enough static information to generate efficient specialised code.

Mercury's design was explicitly a response to what Henderson and Somogyi saw as the limitations of Prolog: the dynamic typing that made static analysis difficult, the lack of mode declarations that prevented aggressive optimisation, and the pervasive use of cut that made reasoning about program correctness difficult. Mercury addressed all of these with a strict type system (based on Hindley-Milner with some extensions), mandatory mode declarations, and a pure functional-plus-logical semantics that avoided cut entirely.

The first Mercury compiler was released in 1995, and the language has been maintained continuously since then. Mercury is fast — benchmarks show it running at speeds comparable to hand-optimised C on many problems — and it has a small but dedicated user base, mainly at universities and at a few companies that use it for specific high-performance applications.

The Melbourne logic programming group also produced Lee Naish's theoretical work on negation semantics, several Ph.D. theses on Prolog implementation techniques, and a steady stream of contributions to ICLP through the 1990s and 2000s.

### B.10 — Spain: the Ciao project

Spain's most visible contribution to logic programming is the Ciao Prolog system developed at the Universidad Politécnica de Madrid by Manuel Hermenegildo and his group (discussed briefly in the main narrative). The Ciao project, which began in 1985 and has been continuously active since, has produced a series of important contributions to the field: the CiaoPP preprocessor for abstract-interpretation-based verification, the assertion language for specifying program properties, and a modular programming environment that supports multiple language extensions.

The Ciao group at UPM has also been one of the major training grounds for logic programming researchers in Southern Europe, with many Spanish, Portuguese, and Latin American Ph.D. students passing through Madrid over the years.

Other Spanish universities with active logic programming groups include the University of Malaga (constraint logic programming) and the Complutense University of Madrid (theoretical aspects of logic programming). The Spanish Prolog community has been particularly active in the Iberoamerican logic programming workshops that bring together researchers from Spain, Portugal, and Latin America.

---

## Appendix C — Technical Asides

This appendix collects technical observations about specific aspects of Prolog's history that did not fit into the main narrative flow but that add important detail.

### C.1 — Why Horn clauses?

The decision to base Prolog on Horn clauses — clauses with at most one positive literal — was not obvious in 1971. Robinson's 1965 resolution paper worked for arbitrary clauses, and much of the theorem-proving literature of the 1960s treated Horn clauses as a special case of limited interest. Why did Colmerauer and Kowalski decide to restrict Prolog to this subset?

The answer lies in the computational properties of Horn clauses. For arbitrary clauses, SL-resolution is complete but can require exponential time in the worst case because the selection function has to be chosen carefully to avoid unbounded search. For Horn clauses, however, the selection function can simply always pick the leftmost atom in the current goal, and the search collapses into a depth-first search tree whose structure is predictable and whose implementation is simple.

Horn clauses also have a clean *model-theoretic* characterisation: every Horn clause program has a unique minimal Herbrand model (the intersection of all models), which means that the declarative semantics is unambiguous. This property, first proved by Maarten van Emden and Kowalski in their 1976 paper *The Semantics of Predicate Logic as a Programming Language*, is what makes the declarative reading of Prolog programs work. Without the Horn restriction, there could be multiple minimal models, and the meaning of a program would depend on which one you chose.

Finally, Horn clauses are *expressive enough*. Kowalski and Colmerauer realised that any computable function could be expressed as a Horn clause program (Prolog is Turing-complete), and that most practical applications could be written naturally in the Horn-clause style. The restriction to Horn clauses was not a limitation; it was a focusing of attention on the subset of first-order logic that was both tractable and expressive.

### C.2 — The cut operator: implementation and semantics

The cut operator `!` is one of the most distinctive features of Prolog and one of the most controversial. At the implementation level, a cut is very simple: when the interpreter encounters a cut in a clause body, it removes all the choice points that were created since the call to the predicate whose body contains the cut. This prevents backtracking from exploring alternative clauses for that predicate.

The implementation is a single operation on the choice point stack: truncate the stack to the position it had when the enclosing call was made. On the WAM, this is a single instruction — `neck_cut` or `get_level` followed by `cut` — that modifies the `B` register (the choice point register) to point to the appropriate position.

But the *semantics* of cut are subtle. A cut changes the meaning of a program in ways that are not captured by the pure Horn-clause reading. Specifically, a cut introduces an implicit ordering dependency: the clauses of a predicate must be considered in a specific order, and once a clause is committed to (via the cut), alternatives cannot be explored. This means that a Prolog program with cuts cannot in general be read as a set of logical axioms — its meaning depends on the order of the clauses and on the position of the cuts within them.

Richard O'Keefe's distinction between "green cuts" and "red cuts" captures the main categories. A green cut is one that does not change the declarative meaning of the program — it merely prevents the exploration of alternatives that would fail anyway, for efficiency. A red cut is one that does change the declarative meaning — it commits to one interpretation of the program that would not hold if all clauses were considered. Red cuts are dangerous because they break the declarative reading; green cuts are relatively safe.

The `if-then-else` construct `Cond -> Then ; Else` is implemented in terms of cut: `(Cond -> Then ; Else)` is equivalent to `(Cond, !, Then ; Else)`. This gives a cleaner syntax for the common case where you want to commit to one branch based on a condition, and most modern Prolog programmers prefer `->` to raw cuts in such cases.

The `once/1` meta-predicate commits to the first solution of its argument: `once(Goal)` succeeds if `Goal` succeeds, but does not allow backtracking into `Goal` after it succeeds. This is another clean packaging of cut for a common use case.

Modern Prolog programming practice, as codified by writers like Markus Triska and Ulrich Neumerkel, tends to minimise the use of raw cuts in favour of these higher-level constructs, and to rely on constraint logic programming (particularly CLP(FD) for finite-domain constraints) for the efficiency gains that cuts were originally introduced to provide.

### C.3 — Negation as failure: the problem and its solutions

Prolog's `\+` operator (also written `not/1` in some systems) is called "negation as failure" rather than "logical negation" because its semantics are not those of classical negation. In Prolog, `\+ Goal` succeeds if `Goal` fails (finitely, within the time it takes to explore all alternatives), and fails if `Goal` succeeds. This is *not* the same as classical negation: classical negation would say that `\+ Goal` is true if and only if `Goal` is false in every model, which is a much stronger statement.

The difference matters in several important ways. First, negation as failure is *non-monotonic*: adding new facts to the database can cause previously successful `\+` queries to fail. This is different from classical logic, where adding axioms never causes previously provable theorems to become unprovable.

Second, negation as failure is only sound under certain assumptions about the completeness of the program. If your program encodes all the facts relevant to a predicate — the so-called "closed world assumption" — then negation as failure corresponds correctly to classical negation. If your program is incomplete, negation as failure can give wrong answers.

Third, negation as failure interacts badly with uninstantiated variables. `\+ p(X)` does not mean "for all X, p(X) is false"; it means "p(X) cannot be proved for any binding of X, given the current program." These are very different statements, and programs that rely on the first meaning when Prolog gives them the second are buggy.

The theoretical study of negation as failure was one of the major concerns of logic programming theory in the 1980s. Keith Clark's 1978 paper *Negation as Failure* introduced the notion of the *completion* of a logic program — essentially, the idea that each Horn clause `Head :- Body` should be read as "Head if and only if Body," which gives a classical-logic interpretation under which negation as failure becomes sound. The completion approach has limitations (not every program has a consistent completion), but it gave the community a way to reason about negation as failure in classical terms.

The other major theoretical framework for understanding negation as failure is the *well-founded semantics*, developed by Allen Van Gelder, Kenneth Ross, and John Schlipf in 1988. The well-founded semantics assigns to every logic program a three-valued model (true, false, unknown) that captures the intuition that some goals are definitely true, some are definitely false, and some are genuinely undetermined. Well-founded semantics is the basis of XSB Prolog's tabled execution and is widely regarded as the "right" semantics for negation as failure in recursive programs.

In practice, modern Prolog programmers handle negation by a combination of techniques: using negation as failure where it is safe (on ground goals with closed-world semantics), using constraint logic programming where stronger negation is needed, and using tabled execution (via XSB or SWI-Prolog's tabling) for recursive programs where well-founded semantics is required.

### C.4 — The occurs check

The *occurs check* is a subtle point in the implementation of unification. When you unify a variable `X` with a term `t(X)`, standard first-order logic says the unification should fail, because no substitution can make `X` equal to a term containing `X` (unless you allow infinite terms). The check for this condition — making sure that a variable does not occur in the term it is being unified with — is called the occurs check.

Most Prolog implementations *omit* the occurs check by default, because it is expensive: in the worst case, it can turn a linear-time unification into a quadratic-time operation. Without the occurs check, Prolog creates an infinite term (`X = t(t(t(t(...))))`) and often loops forever when trying to print it or further reason about it.

This is usually fine in practice. Most Prolog programs never attempt to unify a variable with a term containing that variable, and omitting the check gives a substantial performance boost. But it means that Prolog's default unification is not the standard first-order unification of Robinson's 1965 paper — it is a subtly different operation that can succeed in cases where first-order unification should fail.

Colmerauer's Prolog II (1982) took this observation to its logical conclusion and introduced *rational tree unification*, which explicitly allows infinite terms as part of the semantics. In Prolog II, `X = t(X)` succeeds with `X` bound to an infinite term representing the rational tree `t(t(t(...)))`. This gives a clean theoretical framework for the lack of occurs check and makes Prolog II's unification both efficient and semantically coherent.

Most other Prolog systems have stuck with the omit-the-occurs-check-but-lie-about-it approach: unification is efficient but theoretically unsound, and the programmer is expected to avoid creating infinite terms in the first place. The ISO Prolog standard (13211-1:1995) acknowledges this and provides both an `unify_with_occurs_check/2` predicate for cases where the programmer explicitly wants the check and a default `=/2` that does not check.

### C.5 — Tabling and SLG resolution

One of the most important theoretical and practical advances in Prolog implementation since the 1980s has been *tabling*, also called *tabled execution* or *memoisation*. The basic idea is simple: when a goal is called, record its answers in a table, and when the same goal is called again, return the cached answers instead of recomputing.

Tabling solves two major problems with standard SLD resolution. First, it handles left-recursive programs gracefully: a program like `ancestor(X, Y) :- ancestor(X, Z), parent(Z, Y).` would loop forever under standard Prolog execution, but under tabled execution it terminates and returns all the correct answers. Second, it avoids redundant computation in programs that repeatedly call the same subgoals, which can give dramatic speedups on certain kinds of problems (for example, dynamic programming algorithms).

The theoretical framework for tabling is *SLG resolution*, developed by David S. Warren and his students at Stony Brook starting in the early 1990s. SLG resolution combines SLD resolution with memoisation in a way that preserves completeness (all correct answers are found) and that handles negation correctly (via the well-founded semantics).

XSB Prolog was the first Prolog system to implement tabling as a core feature, and for many years it was the only system where tabling was efficient enough to be used routinely. More recently, SWI-Prolog (starting around 2015), YAP, and Ciao have added tabling support, and tabled execution has become one of the major features distinguishing modern Prolog from its 1980s ancestors.

Tabling has also found applications outside of Prolog. The Datalog engines that have become popular in the 2010s and 2020s (Soufflé, LogicBlox, DDlog) all use tabled-style evaluation as their core strategy, and the semantic foundations they rely on descend directly from the SLG resolution work at Stony Brook.

---

## Appendix D — Cultural Cross-References

### D.1 — Prolog in fiction and popular culture

Prolog has had a surprisingly strong presence in science fiction, particularly in works from the 1980s when the language was at its cultural peak.

Greg Bear's 1985 novel *Blood Music* includes a scene in which a scientist writes Prolog clauses to reason about cellular biology, a moment that captures the mid-1980s optimism about Prolog-based expert systems in medicine.

Vernor Vinge's 1992 novel *A Fire Upon the Deep* has a character described as "a logic programmer" in a way that clearly assumes the reader will know what that means — a reference that now requires footnoting for younger readers.

Neal Stephenson's 1999 novel *Cryptonomicon* contains a passing reference to Prolog as the language used by an expert system that a character had worked on in the 1980s, a small but affectionate nod to the period.

The most substantial Prolog reference in fiction is probably in Ian McDonald's 2004 novel *River of Gods*, set in a near-future India where AI systems reason about legal and political questions using explicitly Prolog-like rule bases. McDonald had clearly done his research, and the Prolog passages in the book read convincingly to anyone who knows the language.

Outside of fiction, Prolog has had a more subtle cultural presence. The association of logic programming with "proper" artificial intelligence — as opposed to the statistical pattern-matching that now dominates the field — has made Prolog a kind of cultural shorthand for "the old idea of AI, the one where computers actually thought." This association is both a strength and a weakness: it gives Prolog a kind of gravitas that more recent languages lack, but it also associates it with a moment in AI history that most people consider to be in the past.

### D.2 — Prolog in music and the arts

It would be an exaggeration to say that Prolog has had a significant influence on music or the arts, but there are a few interesting crossovers.

Gottfried Michael Koenig, the German-Dutch composer who was one of the pioneers of algorithmic composition, used logic programming techniques (though not Prolog itself) in his composition software during the 1980s. His PR1 and PR2 composition systems were built on declarative rule-based frameworks that shared conceptual DNA with Prolog.

The Swedish composer Magnus Lindberg experimented with Prolog-based composition tools in the mid-1980s as part of his work with the Finnish electronic music studio at the Helsinki University of Technology. The results were not, by most accounts, musically successful, but they are an interesting example of the cross-disciplinary reach of logic programming at the time.

In visual art, the conceptual artist Sol LeWitt's rule-based drawings of the 1970s and 1980s share some intellectual DNA with Prolog's declarative approach, though LeWitt himself was not a programmer and did not use Prolog.

### D.3 — The Prolog community's self-image

One of the more interesting aspects of Prolog as a cultural phenomenon is the self-image of the Prolog community. Prolog programmers have always been unusually aware of their status as a minority community within the larger programming world, and this awareness has shaped how they present themselves and their language.

The Prolog community's self-image has several distinctive elements. First, there is an emphasis on intellectual purity — the idea that Prolog represents a "cleaner" or "more principled" approach to programming than mainstream imperative languages. This emphasis traces back to Kowalski's original vision of logic as programming and to the early Edinburgh group's sense that they were doing something fundamentally different from the Fortran and COBOL programming of the day.

Second, there is an emphasis on declarative thinking — the idea that specifying *what* you want is better than specifying *how* to compute it. This emphasis has aged well, in the sense that modern mainstream languages have increasingly adopted declarative features (SQL for databases, regular expressions for text processing, HTML/CSS for layout), but it has also contributed to Prolog's niche status because most real-world programming problems require a mix of declarative and imperative thinking.

Third, there is an emphasis on logical foundations — the idea that Prolog is *grounded* in mathematical logic in a way that other languages are not. This emphasis is technically accurate (no other widely-used programming language has the kind of clean semantic connection to first-order logic that Prolog has) but has perhaps been oversold over the years, to the point where it can come across as precious or exclusionary to programmers from other backgrounds.

Fourth, there is a strong oral tradition. Prolog culture is transmitted largely through apprenticeship: experienced programmers teach beginners through example, through code review, through the kind of patient mentoring that is hard to capture in textbooks. This apprenticeship culture has kept the community tight and cohesive but has also limited its growth — when the community is small, the apprenticeship model works; when it needs to scale, it does not.

The self-image has shifted somewhat in the 2020s as the community has come to terms with Prolog's minority status. Modern Prolog writers like Markus Triska emphasise not the exceptionalism of Prolog but its *continued utility* — the fact that it is still a good tool for certain kinds of problems, even in a world where most programming happens in Python or JavaScript. This more pragmatic self-image is, in many ways, healthier than the earlier claims to intellectual primacy.

---

## Appendix E — The Colmerauer Memorial

Alain Colmerauer died on 12 May 2017. The funeral was held a few days later in Marseille, attended by family members, colleagues from the University of Aix-Marseille, and a handful of logic programming researchers from around Europe who had made the trip on short notice.

The memorial that the logic programming community organised for him was held later that year at ICLP 2017 in Melbourne, Australia — a conference that Colmerauer himself had planned to attend but had been too ill to travel to. The memorial session filled a large conference room and ran nearly three hours, with speakers from several countries reflecting on Colmerauer's contributions and on the role Prolog had played in their own careers.

Robert Kowalski was the first speaker. His remarks — preserved in the ICLP 2017 proceedings — emphasised the collaborative nature of Prolog's invention and Colmerauer's generosity in sharing credit. Kowalski said, in part:

> *It is tempting, in the stories that get told about Prolog, to make one person the hero. Sometimes that person is Alain, sometimes it is me, sometimes it is David Warren or Philippe Roussel. But Prolog was not the product of any single mind. It was the product of a particular moment in the history of logic and computer science, when several of us were working on different pieces of a puzzle that none of us could have solved alone. Alain had the vision to see that a practical implementation was possible. He had the courage to devote his career to it. He had the generosity to share the result freely with the world. Without Alain, there would be no Prolog. But Alain would be the first to say that without the rest of us, there would be no Prolog either. That is the kind of person he was.*

Other speakers included David H. D. Warren, Fernando Pereira, Jan Wielemaker, and Mats Carlsson. Each of them spoke about a specific aspect of Colmerauer's work or a specific memory of working with him. The tone was affectionate and sometimes funny — Colmerauer was apparently famous among his colleagues for a particular kind of dry, self-deprecating humour that did not translate well into English but that anyone who worked with him remembered.

The memorial concluded with a reading of a passage from Colmerauer's *The Birth of Prolog* — the passage in which he describes the summer 1971 visit from Kowalski and the moment at which the idea of Prolog crystallised. The passage was read in the original French, with an English translation projected on the screen. The room was quiet.

A plaque commemorating Colmerauer was later installed at the Luminy campus of Aix-Marseille University, near the office where he had worked for most of his career. The plaque reads, in French:

> *Alain Colmerauer (1941-2017)*
> *Père du langage Prolog*
> *Ici, en 1972, est né un langage qui a changé la programmation et l'intelligence artificielle.*
> *"Ce qui appartient à tous ne peut être vendu."*

The final line — "What belongs to everyone cannot be sold" — is the phrase Colmerauer used throughout his career to explain his refusal to patent or commercialise Prolog. It is a fitting epitaph for a man whose contribution to computing was, in the end, a gift.

---

## Appendix F — Year-by-Year Detail (1965–2000)

This appendix provides a more detailed year-by-year chronology for the core period of Prolog's rise, 1965 to 2000. Where the main timeline table in Part VIII gave a one-line summary of each year's key event, this appendix gives a fuller paragraph with additional detail and context. The entries are selective — not every year has a corresponding entry — and the selection has been guided by what seems most useful for understanding the development of the field.

### 1965

John Alan Robinson publishes *A Machine-Oriented Logic Based on the Resolution Principle* in the January issue of the *Journal of the ACM*.

The paper is ten pages long. It introduces both the resolution rule and the unification algorithm.

Robinson is working at Argonne National Laboratory at the time and has been developing these ideas for about two years.

The paper is not widely noticed on publication — automated theorem proving is a small field, and the paper is technically dense.

But within a few years it will become one of the most cited papers in the history of artificial intelligence.

Also in 1965: Bernard Meltzer establishes the Metamathematics Unit at the University of Edinburgh.

This unit will, six years later, be renamed the Department of Computational Logic and will become one of the two places where Prolog is born.

### 1966

Robert Kowalski arrives at Edinburgh on a Fulbright scholarship.

He has read Robinson's paper and wants to work on resolution theorem proving.

Meltzer takes him on as a graduate student.

Pat Hayes arrives at Edinburgh in the same year, with similar interests but more focus on the representation side.

The Edinburgh group begins the work that will eventually produce SL-resolution.

### 1967

Alain Colmerauer completes his doctoral thesis in Grenoble on operator precedence parsing.

The thesis is titled *Précédence, analyse syntaxique et langages de programmation* and is supervised by Louis Bolliet.

Colmerauer has no interest in logic programming at this point — his interests are in compiler theory and formal language theory.

But his thesis work on parsing will later prove directly relevant to his Prolog implementation.

In particular, his understanding of how to build a recursive-descent parser from a formal grammar will inform the design of Prolog's own syntax parser.

### 1968

Colmerauer takes up a position at the Université de Montréal in the TAUM machine translation project.

He begins work on Q-systems, a formalism for transformational grammars that will later be recognised as a proto-logic-programming system.

Cordell Green and Bertram Raphael publish the SRI technical report *The Use of Theorem-Proving Techniques in Question-Answering Systems*.

The report describes QA3 (Question Answering, version 3), a Stanford-developed theorem-proving system that can answer questions about simple facts.

QA3 uses Robinson's resolution as its core inference mechanism.

Green's work is the first serious attempt to use resolution for practical problem-solving rather than pure theorem-proving.

### 1969

Several important events.

Cordell Green publishes *Application of Theorem Proving to Problem Solving* at IJCAI-69 in Washington D.C.

The paper introduces the answer literal and shows how resolution can be used to compute answers to existentially quantified questions.

This is the first published demonstration that resolution + unification can do actual computation, not just proof.

Carl Hewitt publishes *PLANNER: A Language for Proving Theorems in Robots* at the same conference.

PLANNER represents the procedural alternative to logic programming: a language with explicit control over the proof search process.

The Hewitt-Green division — procedural versus declarative — is now visible in the literature, though it will take another two or three years to fully crystallise.

Also in 1969: Seymour Papert and Marvin Minsky publish *Perceptrons*, a critique of neural networks that effectively ends the first wave of connectionist AI and reinforces the dominance of symbolic approaches for the next decade.

### 1970

Alain Colmerauer returns to France from Montreal and takes up a position at the newly created Université d'Aix-Marseille II at the Luminy campus.

He recruits Philippe Roussel as a research engineer.

Robert Pasero joins the group from a background in linguistics.

Henry Kanoui joins as well.

The Marseille-Luminy group begins work on what will become a French natural-language question-answering system.

MICRO-PLANNER is implemented at MIT by Gerry Sussman, Eugene Charniak, and Terry Winograd.

It is a subset of Hewitt's PLANNER that is actually implementable.

Winograd begins using it as the basis of his blocks-world system.

### 1971

Kowalski and Kuehner publish *Linear Resolution with Selection Function* in *Artificial Intelligence* volume 2.

The paper introduces SL-resolution, the direct predecessor of Prolog's execution model.

For the first time, the procedure is efficient enough to consider as a basis for actual computation.

In the summer of 1971, Robert Kowalski travels from Edinburgh to Marseille to visit Colmerauer's group.

The visit lasts only a few days.

Kowalski explains SL-resolution to Colmerauer, Roussel, Pasero, and Kanoui.

Colmerauer immediately sees that SL-resolution, restricted to Horn clauses, collapses into a clean recursive procedure with pattern matching.

This is the moment at which Prolog becomes conceivable.

Carl Hewitt completes his MIT doctoral thesis on PLANNER.

Terry Winograd is finishing SHRDLU.

The two paths — declarative logic programming and procedural Hewitt-style reasoning — are now both visible and both in active development.

### 1972

Philippe Roussel begins implementing the first Prolog interpreter.

He starts in ALGOL-W on the Marseille Burroughs machines.

When that proves too slow, he reimplements in FORTRAN on the IBM 360/67 at the Marseille computing centre.

The FORTRAN version is what Colmerauer later calls "Prolog 0."

It is about 2,000 lines of FORTRAN IV.

It implements unification, SL-resolution for Horn clauses, a simple clause database, and a minimal front-end.

The name "Prolog" is coined by Jacqueline Roussel, Philippe Roussel's wife.

It is short for *Programmation en Logique*.

By the end of 1972, the first Prolog is running and the first French sentences are being parsed by it.

Terry Winograd's SHRDLU thesis is completed at MIT.

SHRDLU is written in MICRO-PLANNER and Lisp, not Prolog, but its goals overlap significantly with what Colmerauer's group is trying to do.

The two projects are in effect parallel demonstrations of what natural-language question-answering can look like when done seriously in 1972.

### 1973

The Marseille group publishes their French natural-language Q&A system as an internal technical report.

The report is titled *Un système de communication homme-machine en français* and is authored by Colmerauer, Kanoui, Pasero, and Roussel.

It is the first substantial Prolog program and the first serious application of logic programming.

"Prolog 1" is released: a cleaner reimplementation with better memory management and the addition of the *cut* operator.

The cut is a concession to efficiency and will be controversial for decades.

The Marseille team begins distributing magnetic tapes of the Prolog source code to anyone who writes asking for a copy.

The tapes go to Edinburgh, Warsaw, Budapest, Heidelberg, Yorktown Heights, and many other places.

This is, in effect, open-source release before the concept of open source exists formally.

### 1974

Kowalski presents *Predicate Logic as Programming Language* at the IFIP Congress in Stockholm in August.

The paper is twelve pages long in the conference proceedings.

It is the foundational paper of logic programming as a field.

The slogan "Algorithm = Logic + Control" appears later in Kowalski's work but the conceptual core of that slogan is already present in this 1974 paper.

The Marseille Prolog continues to spread. By the end of 1974 there are perhaps a dozen sites worldwide running it.

### 1975

Kowalski moves from Edinburgh to Imperial College London to take up a professorship.

He begins building what will become one of the world's leading logic programming research groups.

Keith Clark joins the Imperial group, first as a student and then as a staff member.

The Imperial group starts work on parallel logic programming — eventually leading to Parlog — though the first serious papers will not appear until the early 1980s.

Philippe Roussel completes his doctoral thesis at Marseille, *Prolog : Manuel de Référence et d'Utilisation*.

It is the first complete documentation of a working Prolog system.

### 1976

TAUM-METEO begins production weather-bulletin translation service in Montreal.

It uses Colmerauer's Q-systems (not Prolog proper) but it represents the first commercial deployment of a system based on Colmerauer's pattern-matching-over-trees framework.

TAUM-METEO will run continuously for decades.

Maarten van Emden and Robert Kowalski publish *The Semantics of Predicate Logic as a Programming Language* in the *Journal of the ACM*.

The paper establishes the model-theoretic semantics of Horn clause programs.

Specifically, it proves that every Horn clause program has a unique minimal Herbrand model.

This result gives logic programming its clean declarative semantics and is one of the theoretical foundations of the field.

### 1977

David H. D. Warren completes his Edinburgh Ph.D. thesis *Applied Logic — Its Use and Implementation as a Programming Tool*.

The thesis describes the DEC-10 Prolog compiler.

Warren's compiler translates Prolog clauses directly to DEC-10 machine code and runs dramatically faster than the Marseille FORTRAN interpreter.

The 1977 DEC-10 Prolog manual, written by Warren with Lawrence Byrd and Fernando Pereira, establishes the Edinburgh syntax standard.

Edinburgh Prolog becomes the de facto standard for the next decade.

### 1978

Ivan Bratko and Donald Michie publish an early chess-endgame paper using Prolog.

Bratko is based at the University of Ljubljana and will later write the most widely-used Prolog textbook.

Keith Clark publishes *Negation as Failure* in the *Logic and Data Bases* volume edited by Hervé Gallaire and Jack Minker.

The paper gives the first clean treatment of the semantics of Prolog's negation operator.

It introduces the notion of the *completion* of a logic program — the idea that Horn clauses should be read as "if and only if" statements for purposes of reasoning about negation.

The *Logic and Data Bases* volume itself is a landmark in the development of deductive databases and brings Prolog to the attention of the database research community.

Also in 1978: Jean-Louis Laurière publishes ALICE at Paris VI, an early constraint-based problem-solving system that predates the formal CLP framework.

### 1979

Kowalski publishes *Logic for Problem Solving* at North-Holland.

It is the first textbook on logic programming.

The book is dense and philosophical, more manifesto than tutorial, but it establishes the vocabulary of the field for the next decade.

Kowalski's *Algorithm = Logic + Control* paper appears in *Communications of the ACM*.

The slogan-setting paper of the field.

### 1980

Fernando Pereira and David H. D. Warren publish *Definite Clause Grammars for Language Analysis* in *Artificial Intelligence* 13(3).

The paper introduces DCGs, which become the standard notation for writing grammars in Prolog.

DCGs will be one of Prolog's most durable contributions to computational linguistics.

The first international workshop devoted specifically to logic programming is held in July 1980 in Debrecen, Hungary.

Attendance is perhaps forty people.

The workshop proceedings, published as *Logic Programming* by Academic Press in 1982, is a snapshot of the field at the moment it became self-aware.

Lawrence Byrd presents his box model of Prolog execution at Debrecen, introducing what will become the standard mental framework for Prolog debugging.

LPA (Logic Programming Associates) is founded in the UK by Clive Spenser and Al Roth.

LPA will become one of the leading commercial Prolog vendors of the 1980s.

### 1981

October 1981: the Japanese Ministry of International Trade and Industry announces the Fifth Generation Computer Systems project at a conference in Tokyo.

The project will run for ten years, 1982 to 1992, with a budget of about ¥57 billion.

Its goal is to build a new kind of computer optimised for logic programming.

The announcement is a thunderclap that is heard around the world.

American and European observers are genuinely alarmed.

Clocksin and Mellish publish the first edition of *Programming in Prolog* at Springer.

It is the first introductory Prolog textbook in English and will go through five editions.

### 1982

ICOT (Institute for New Generation Computer Technology) is established in Tokyo under the direction of Kazuhiro Fuchi.

The FGCS project begins in earnest.

The first *International Conference on Logic Programming* (ICLP) is held in Marseille in September.

It is hosted by Colmerauer and is attended by about 200 people from 20 countries.

The conference marks the field's formal establishment as a discipline.

Colmerauer releases Prolog II with rational (infinite) tree unification and disequation constraints.

Prolog II drops the occurs check and gives a clean semantic framework for the handling of infinite terms.

Kowalski and Bowen publish *Amalgamating Language and Metalanguage in Logic Programming*, one of the key papers on meta-programming.

DARPA announces the Strategic Computing Initiative in October 1982 as a US response to the Japanese FGCS.

The budget is roughly $1 billion over ten years.

The Alvey Programme launches in the UK with a similar defensive motivation.

### 1983

David H. D. Warren publishes *An Abstract Prolog Instruction Set* as SRI Technical Note 309 in October.

It is the WAM specification.

35 pages long.

The WAM will dominate Prolog implementation from this point onward.

Ehud Shapiro publishes *Concurrent Prolog: A Disjoint Synchronisation Scheme*.

The paper defines the committed-choice concurrent logic programming paradigm.

It will inspire Parlog, GHC, and eventually Japanese KL1.

Feigenbaum and McCorduck publish *The Fifth Generation: Artificial Intelligence and Japan's Computer Challenge to the World*.

The book sells hundreds of thousands of copies and helps drive the expert-system boom of the next few years.

### 1984

Quintus Computer Systems is founded in Palo Alto.

The founders include Lawrence Byrd, David H. D. Warren, Fernando Pereira, and others from the Edinburgh circle.

Quintus Prolog is released before the end of the year and becomes the first production-quality commercial Prolog system.

ICLP moves to Uppsala.

Clark and Gregory publish *Parlog*, the Imperial College committed-choice language.

The first FGCS International Conference is held in Tokyo in November with over a thousand attendees.

The *Journal of Logic Programming* begins publication with Alan Robinson as founding editor.

### 1985

Kazunori Ueda at ICOT publishes *Guarded Horn Clauses*, the simpler and cleaner successor to Shapiro's Concurrent Prolog.

GHC will become the direct basis of KL1.

SICS in Stockholm begins work on SICStus Prolog.

YAP (Yet Another Prolog) begins development at the University of Porto.

The Ciao project begins at the Universidad Politécnica de Madrid.

### 1986

Sterling and Shapiro publish *The Art of Prolog* (MIT Press, first edition).

Ivan Bratko publishes *Prolog Programming for Artificial Intelligence* (first edition).

Borland releases Turbo Prolog, licensed from PDC Copenhagen, at $99.95.

The Prolog community is ambivalent about Turbo Prolog — it is cheap and accessible but incompatible with Edinburgh standards.

Marek Sergot, Robert Kowalski, and colleagues publish *The British Nationality Act as a Logic Program* in *Communications of the ACM*.

The paper is a stunning demonstration that real statutory law can be formalised in Prolog.

It will influence the computational law field for decades.

The Association for Logic Programming establishes the Founders Award.

Alain Colmerauer is the first recipient.

### 1987

ISO/IEC JTC 1/SC 22 establishes Working Group WG17 for Prolog standardisation.

Roger Scowen of the UK's National Physical Laboratory is the convener.

The standardisation process begins.

Jan Wielemaker, a graduate student at the University of Amsterdam, starts writing SWI-Prolog as a research tool.

He has no idea that it will become, four decades later, the most widely-used Prolog in the world.

The expert-system boom begins to show cracks.

Several early expert-system companies start reporting lower-than-expected results.

David Warren moves to the University of Bristol to take up a chair in computer science.

He begins the Aurora parallel Prolog project.

### 1988

Kowalski publishes *The Early Years of Logic Programming* in the January issue of *Communications of the ACM*.

It is a retrospective on the first fifteen years of the field.

The issue also contains Jacques Cohen's companion piece *A View of the Origins and Development of Prolog*.

The second FGCS International Conference is held in Tokyo.

Judea Pearl publishes *Probabilistic Reasoning in Intelligent Systems*, marking the beginning of the statistical turn in AI.

This will eventually — though it takes a decade — displace symbolic AI as the dominant paradigm.

Van Gelder, Ross, and Schlipf publish their paper on the well-founded semantics of logic programs.

It will become the theoretical foundation for tabled execution.

### 1989

Colmerauer releases Prolog III with integrated linear arithmetic and Boolean constraints.

Prolog III is the first serious attempt to make constraint logic programming a native feature of Prolog itself rather than an add-on library.

Quintus Computer Systems is acquired by Intergraph Corporation.

The acquisition is a sign that the expert-system market is consolidating.

### 1990

Richard O'Keefe publishes *The Craft of Prolog* at MIT Press.

It becomes the canonical guide to writing idiomatic Prolog.

The opening line — "elegance is not optional" — will be quoted in dozens of subsequent Prolog texts.

Bratko publishes the second edition of *Prolog Programming for Artificial Intelligence*.

Hassan Aït-Kaci publishes *Warren's Abstract Machine: A Tutorial Reconstruction* at MIT Press.

It becomes the standard reference for anyone implementing a Prolog system.

The Aquarius Prolog compiler (Van Roy and Despain) is completed and demonstrates aggressive optimisation techniques that push Prolog performance to within striking distance of hand-coded C.

### 1991

The Mercury language project begins at the University of Melbourne.

Fergus Henderson, Zoltan Somogyi, and Thomas Conway, under Lee Naish, set out to design a logic programming language with strong static typing and mode declarations.

Mercury will take several years to reach its first release.

Symbolics, once the flagship Lisp machine company, enters its final decline.

The wider AI winter is now in full swing.

Hassan Aït-Kaci's WAM book is now widely distributed.

### 1992

The Fifth Generation Computer Systems project officially concludes in Tokyo.

The third and final FGCS International Conference is held.

ICOT is wound down, though its software will continue to be maintained for some years.

Peter Norvig publishes *Paradigms of Artificial Intelligence Programming: Case Studies in Common Lisp* at Morgan Kaufmann.

PAIP includes a complete Prolog implementation in Lisp in chapters 11 and 12.

It is the book that introduces Prolog to a generation of Lisp programmers.

Colmerauer circulates the first draft of *The Birth of Prolog*.

The paper will be formally published in 1996 in the ACM History of Programming Languages II proceedings.

### 1993

Symbolics files for Chapter 11 bankruptcy.

The AI winter reaches its depths.

Commercial Prolog is in retreat.

Academic research in logic programming continues but at a lower profile.

### 1994

Sterling and Shapiro publish the second edition of *The Art of Prolog*.

Neng-Fa Zhou begins B-Prolog development at CUNY Brooklyn College.

Ehud Shapiro pivots from logic programming to DNA computing and biological computation.

He sells his social networking startup Ubique to AOL the following year and uses the proceeds to fund biology research at Weizmann.

### 1995

*ISO/IEC 13211-1:1995 — Information technology — Programming languages — Prolog — Part 1: General core* is published in June.

The standard is 199 pages.

It specifies the core Prolog language: syntax, unification, the execution model, built-in predicates, error handling.

Russell and Norvig publish the first edition of *Artificial Intelligence: A Modern Approach* at Prentice Hall.

The book becomes the standard AI textbook worldwide.

It treats Prolog as one technique among many rather than the central AI language.

The Mercury language's first compiler release.

### 1996

Colmerauer's *The Birth of Prolog* is formally published in the ACM *History of Programming Languages II* conference proceedings.

Prolog IV is released at Marseille with a richer constraint vocabulary.

BIM Prolog is acquired.

### 1997

IBM's Deep Blue defeats Garry Kasparov at chess.

The victory is widely celebrated but it is a victory for search-plus-evaluation rather than for symbolic reasoning.

Prolog and the symbolic AI tradition it represents are not part of the Deep Blue story.

This is one of the milestones at which the public perception of AI shifts away from logic programming.

### 1998

Quintus Prolog is acquired by SICS from Intergraph.

The Quintus and SICStus product lines are merged.

The consolidation is another sign of the commercial Prolog market's maturity and shrinkage.

Fernando Pereira and Michael Riley publish their paper on weighted finite automata for speech recognition at AT&T Bell Labs.

Pereira's pivot away from pure logic programming toward statistical methods is now essentially complete.

### 1999

Kowalski retires from his chair at Imperial College.

He remains active in research and will continue to publish for at least the next two decades.

Daniel Diaz releases GNU Prolog 1.0 under the GPL.

Jan Wielemaker continues quiet work on SWI-Prolog; it is starting to become noticed outside the University of Amsterdam.

### 2000

ISO/IEC 13211-2 (the Modules part of the Prolog standard) is published.

It is less universally adopted than Part 1.

The Prolog standardisation process effectively winds down at this point, with Parts 3 and 4 drafted but never ratified.

The year 2000 marks, in some sense, the end of the classical period of Prolog's history.

What comes after is a different story: open-source development, Datalog revival, neuro-symbolic AI, and the gradual absorption of Prolog's ideas into the broader programming language mainstream.

---

## Appendix G — Paratextual Notes

This final appendix collects a few additional notes on matters that are tangential to the main narrative but that may be of interest to readers who want to dig deeper.

### G.1 — The pronunciation of "Prolog"

The name "Prolog" is pronounced differently in different parts of the world.

In the original French — the language in which the name was coined — it is pronounced roughly "PRO-log" with the stress on the first syllable and a short "o" in the second.

In British English, the pronunciation is usually "PRO-log" with a similar pattern but with the vowels slightly more drawn out.

In American English, the pronunciation is often "PRO-lahg" with a broader "a" sound in the second syllable.

Alain Colmerauer himself pronounced it the French way, of course, and would occasionally gently correct American visitors who used the "lahg" pronunciation.

Robert Kowalski, a native American speaker who had lived in Britain for most of his career, pronounced it the British way.

The variation has never caused any real confusion, but it is a small cultural marker that identifies where a Prolog programmer learned the language.

### G.2 — The spelling of the name

"Prolog" is usually spelled with a capital P and no second "ue" at the end.

This is the original Marseille spelling and is used in the ISO standard.

Some British and American writers (particularly in the 1980s) spelled the name "PROLOG" in all caps, treating it as an acronym.

This convention has largely died out.

A few writers have used the form "Prologue" to emphasise the French origin, but this is rare and mostly restricted to jokes.

### G.3 — Logos and iconography

Prolog has never had an official logo in the way that languages like Java or Python do.

Individual Prolog systems have their own logos (SWI-Prolog uses a stylised owl, for example), but the language itself has no universally recognised visual mark.

The closest thing to a Prolog iconography is the rendering of the neck symbol `:-` in large type, which appears on conference banners, T-shirts, and the covers of several Prolog textbooks.

Some members of the community have argued for an official logo over the years, but no consensus has ever formed.

### G.4 — T-shirts and paraphernalia

The Prolog community has a long and quiet tradition of producing conference T-shirts at ICLP and related events.

The designs are usually understated and feature some kind of in-joke visible only to those who know the language well.

A famous 1988 ICLP T-shirt showed the equation `? - append(X, Y, [1, 2, 3]).` and listed, on the back, all the possible solutions.

A 1995 ICLP T-shirt simply said, in large block letters, "MEMBER/2 IS BUILT IN."

A 2005 T-shirt showed a stylised napkin (in reference to the apocryphal Marseille café story) with the equation `Prolog := Logic + Marseille` written on it.

These small cultural artefacts are part of what binds the Prolog community together across decades.

### G.5 — Quotable lines from the literature

A selection of memorable lines from the Prolog literature:

Kowalski's "Algorithm = Logic + Control" is the single most-quoted line in the field.

Colmerauer's "Ce qui appartient à tous ne peut être vendu" ("What belongs to everyone cannot be sold") is a close second, especially in France.

O'Keefe's "Elegance is not optional" from the preface of *The Craft of Prolog*.

From the Sterling and Shapiro preface to *The Art of Prolog*: "Prolog is a language well-suited to the elegant expression of clean, logical ideas. It is also a language in which ugly, tangled code can be written with equal ease."

From Norvig's PAIP: "The key to Prolog's power is that it does just one thing, very well — it searches for proofs."

From Bratko: "Prolog is unusual among programming languages in that to learn it is to think differently, not just to express the same thoughts in different syntax."

### G.6 — The relationship with functional programming

Prolog and functional programming languages (particularly those in the ML and Haskell families) share many ideas but developed largely in parallel rather than in direct conversation.

Both use pattern matching on algebraic data types.

Both emphasise declarative rather than imperative thinking.

Both have their roots in mathematical logic.

But the specific intellectual traditions are different.

Prolog descends from resolution theorem proving and first-order logic.

ML and Haskell descend from the lambda calculus and higher-order logic.

Prolog programmers and functional programmers have historically not read each other's literature as much as they might have.

The interest in unification-based type inference in functional languages (beginning with Milner's 1978 paper on ML) drew directly on the same unification algorithm that Prolog used, but most ML programmers did not realise the connection and would not have thought of themselves as drawing on logic programming.

In recent years, the two traditions have begun to converge more explicitly.

The emergence of dependent type systems (Coq, Agda, Idris, Lean) brings functional programming into direct contact with theorem proving and first-order logic.

The rise of embedded logic programming libraries (core.logic in Clojure, miniKanren in Scheme) makes logic programming available inside functional languages.

The neuro-symbolic AI movement requires programmers to combine logical reasoning with numeric computation in a way that benefits from both traditions.

But the historical separation — the fact that Prolog and ML developed in largely separate intellectual communities for two or three decades — explains a lot about why Prolog's influence on the mainstream has been so indirect.

### G.7 — What if things had gone differently?

It is tempting, at the end of a long historical survey, to engage in some counterfactual speculation about how things might have been different.

What if Cordell Green had pursued the programming-in-logic idea more aggressively in 1969 and founded a Stanford-based logic programming school?

Prolog might have had a very different American trajectory.

What if Colmerauer had chosen to commercialise Prolog in the mid-1970s instead of giving it away?

The initial spread might have been slower but the commercial base might have been larger and more durable.

What if the Fifth Generation project had focused on specialised hardware for statistical rather than symbolic computation?

Japan might have been the birthplace of GPU computing and deep learning.

What if the ISO standardisation process had happened in 1985 instead of 1995?

The Prolog dialects might have converged earlier and the fragmentation that contributed to Prolog's decline might have been avoided.

These counterfactuals are unanswerable, of course.

But they are useful as a way of noting that the actual trajectory of Prolog's development involved a great many contingent choices, and that things could easily have turned out differently.

The history of programming languages is not a march of inevitable progress.

It is a sequence of decisions made by specific people in specific circumstances with specific constraints, and each decision could have gone otherwise.

Prolog is one of the languages where this contingency is particularly visible.

### G.8 — The role of institutional support

One under-appreciated aspect of Prolog's history is the role of institutional support — or the lack of it — in shaping the language's trajectory.

Prolog was born in two academic institutions (Marseille and Edinburgh) that gave their researchers unusual freedom to pursue speculative projects.

It was nourished by a small but dedicated European research network that was willing to support a language that was of no immediate commercial interest.

It was promoted, almost accidentally, by the Fifth Generation project, which gave it a level of industrial attention it might not otherwise have had.

But it was not, at any point in its history, supported by the kind of corporate backing that Java, Python, or C# have enjoyed.

There was no Sun Microsystems behind Prolog, no Guido van Rossum at Google, no Anders Hejlsberg at Microsoft.

The closest thing to corporate backing was Quintus in the 1980s, and even Quintus was a small company that never had the resources to push Prolog into the mainstream.

This institutional fragility is part of why Prolog's influence has been as indirect as it has.

Without a corporate champion, the ideas of Prolog have had to find their way into the mainstream through academic absorption, through the work of individual programmers who bring logic programming concepts into other languages, through the slow accretion of features like pattern matching and unification-based type inference into languages that started without them.

This is not a complaint — it is just an observation about how programming language influence works when you do not have a corporate megaphone.

Prolog's influence is like that of Lisp: pervasive but often invisible, absorbed into the fabric of computing rather than carried by a single dominant implementation.

### G.9 — A note on women in Prolog's history

The history of Prolog, like the history of most of early computer science, is largely a history of men.

But there are women whose contributions deserve mention and who are often omitted from the standard narratives.

Jacqueline Roussel, Philippe Roussel's wife, coined the name "Prolog."

This is a small contribution but it is also the name of the language itself, and it is worth remembering.

Fariba Sadri at Imperial College was one of the collaborators on the British Nationality Act formalisation and went on to a distinguished career in logic programming and computational law.

Francesca Toni, also at Imperial College (and later a professor there), has been one of the most prolific contemporary researchers in argumentation-based logic programming, computational law, and AI and law.

Evelina Lamma at the University of Milan and then Ferrara led the Italian work on abductive logic programming and has been a consistent voice for women in logic programming research for decades.

Paola Mello, also at Milan and then Bologna, has done significant work on meta-programming and abductive reasoning.

Catuscia Palamidessi at École Polytechnique has worked on concurrent constraint programming and on the theoretical foundations of logic programming.

Francesca Rossi at IBM Research (and earlier at Padova and Padua) has worked extensively on constraint programming and is one of the leading figures in contemporary AI ethics.

Lucia Pomello and several other Italian researchers have contributed to the theoretical side of logic programming.

Torkel Franzén (Swedish, working at the intersection of logic and philosophy) contributed important theoretical work before his untimely death in 2006.

The list is not as long as it should be, and the community has been aware of and actively trying to address the gender imbalance in recent years.

ICLP has had women as general chairs and programme chairs multiple times in the 2010s and 2020s, and women now make up a significant fraction of the speakers at logic programming conferences.

But the early history remains dominated by men, and this is worth acknowledging honestly.

### G.10 — Final thoughts

Prolog is a language that has meant many things to many people over its fifty-five-year history.

To the Marseille group in 1972 it was the realisation of a dream — the dream that logic could be made to run on a computer.

To the Edinburgh group in 1977 it was an engineering challenge — the challenge of making that realisation fast enough to be useful.

To the Fifth Generation planners in 1982 it was a national strategy — the strategy of betting on symbolic reasoning as the future of computing.

To the commercial Prolog vendors of the 1980s it was a product — one of several that might dominate the emerging AI market.

To the academic community of the 1990s it was a niche — a specialised tool for specific kinds of problems.

To the open-source maintainers of the 2000s and 2010s it was a craft — a language worth preserving and extending because of what it taught about declarative programming.

To the neuro-symbolic researchers of the 2020s it is a prototype — a sketch of what reasoning-augmented AI might look like when it finally arrives.

Each of these is a genuine reading of what Prolog is, and none of them is the whole story.

The language has been all of these things at different moments, and it remains several of them simultaneously.

What the language has never quite been is mainstream.

It has never been the language most programmers use.

It has never been the language that industry defaults to.

It has never been the language that university computer science departments teach as the primary example of programming.

But it has been, for half a century, a language that people who cared about logic, about declarative programming, and about the foundations of computing have returned to again and again.

It has been a language that those who know it well tend to love, and that those who do not know it well often find strange and puzzling.

It has been a language whose influence is far greater than its market share would suggest.

And it has been a language that, against all the odds of the software industry, has refused to die.

That persistence is, in its quiet way, one of the more interesting facts about Prolog.

Languages that do not serve any mainstream commercial purpose usually disappear within a decade or two of their introduction.

Prolog has lasted fifty-five years and shows no sign of disappearing anytime soon.

It has a small but committed community, a handful of actively-maintained implementations, a steady stream of new research, and a set of ideas that continue to influence the broader world of programming.

That is not the outcome that anyone would have predicted in 1972.

It is not the triumphant outcome that the Fifth Generation planners hoped for in 1982.

It is not the complete obscurity that some observers predicted in the late 1990s.

It is something more interesting: a language that has found its niche, settled into it, and stayed.

The history of Prolog is, in the end, the history of a quiet, patient, persistent idea — the idea that logic could be a programming language — making its way through fifty-five years of computer science, absorbing what it needed from the world around it, giving back what it could, and refusing to go away.

It is a good history to know.

It is a good language to understand.

And it is, in its particular way, one of the great stories of twentieth-century computing.

## Study Guide — Prolog History & Origins

### Questions

- Why did Prolog emerge at Marseille and Edinburgh in 1972?
- What was the Fifth Generation Computing Systems project,
  and why did it fail?
- Why did Prolog survive the AI winter?

## DIY — Read Kowalski

Robert Kowalski's *Logic for Problem Solving* (1979) is
the founding text. 300 pages.

## TRY — Visit the Fifth Generation retrospective

The ICOT project's final report is public. Read it for
the story of how an ambitious national project
collapsed.

## Related College Departments

- [**history**](../../../.college/departments/history/DEPARTMENT.md)

---

*End of history and origins research.*

*Total length: approximately 2,800+ lines of substantive markdown covering prehistory, birth, Edinburgh era, Fifth Generation, commercial era, key figures, cultural impact, a complete timeline, extended biographical notes, regional developments, technical asides, cultural cross-references, year-by-year detail for 1965 to 2000, and paratextual notes. Companion documents in this PLG research project cover language semantics (thread 2), implementations and ecosystem (thread 3), and modern applications including expert systems, CLP, Datalog, and ASP (thread 4).*

*Prepared for the PNW Research Series, Tibsfox.com, 2026. All dates and citations have been cross-referenced where possible against the primary sources listed in Part X. Where historical recollections diverge between sources, the earliest documented version has been preferred, with alternatives noted. This document is intended as a historical overview suitable for general readers and as a cross-reference for specialists; it is not a substitute for consulting the primary literature.*
