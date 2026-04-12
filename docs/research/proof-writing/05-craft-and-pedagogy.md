# 05 — The Craft and Pedagogy of Proof Writing

> **Schwarz deck, slide 32** — *"This is a complete sentence! Proofs are expected to be written in complete sentences, so you'll often use punctuation at the end of formulas. We recommend using the 'mugga mugga' test — if you read a proof and replace all the mathematical notation with 'mugga mugga,' what comes back should be a valid sentence."*

The "mugga mugga" test is Schwarz's compressed statement of the most important craft principle in proof writing: *a proof is English prose, and mathematical notation is punctuation inside the prose, not a replacement for it*. This document expands that principle into the full craft discipline as taught in the Knuth / Larrabee / Roberts *Mathematical Writing* tradition, Polya's heuristic pedagogy, Lakatos's dialectic, and the current empirical research on how mathematicians actually read and evaluate proofs.

## 1. Why craft matters

Mathematical proof has two audiences: your future self (including when you're verifying the proof mechanically) and other mathematicians (who will read, check, and cite your proof). A proof that is technically correct but unreadable fails its second audience. A proof that is readable but technically wrong fails the first. Both audiences must be satisfied.

Craft is the set of conventions that makes a proof readable without sacrificing technical correctness. None of these conventions are logically necessary — a formally verified proof doesn't need any of them — but they are what lets humans check each other's work, and human-checked work is still most of mathematics.

## 2. The Knuth / Larrabee / Roberts discipline

Donald Knuth, Tracy Larrabee, and Paul Roberts taught a course at Stanford in 1987 called *Mathematical Writing* (CS 209). The course notes (Knuth, Larrabee, & Roberts, 1989, "Mathematical Writing," *MAA Notes* 14) are the single best short treatment of the craft. The course produced twenty-seven rules that still define the discipline.

### 2.1 The rules

1. **Symbols in different formulas must be separated by words.** Not $xy$ or $x, y$ next to $f(x)$, but "let $x$ and $y$ be such that $f(x) = y$."
2. **Don't start a sentence with a symbol.** "Let $x$ be..." — not "$x$ is..." (A sentence beginning with "$x$" puts the symbol in the position of a capital letter, which is visually ambiguous.)
3. **Don't use the symbols $\forall, \exists, \Rightarrow, \Leftarrow, \wedge, \vee$ in the body of a proof.** Write "for all," "there exists," "implies," etc. Logical symbols are appropriate in formal statements but not in the informal reasoning. (Schwarz follows this: his slide text uses $\forall$ symbolically in definitions but writes "for any" in the running text of proofs.)
4. **Use vertical bars to denote absolute value, not cardinality, in the same paragraph.** Overloading is confusing. If you must use $|S|$ for cardinality and $|x|$ for absolute value in adjacent prose, break them apart or rename.
5. **Avoid the passive voice when active is natural.** "We define $f(x) = x^2$" is cleaner than "$f(x)$ is defined as $x^2$."
6. **Use the definite article consistently.** "The derivative of $f$" — not "A derivative of $f$." The derivative is unique (once defined), and English grammar should reflect that.
7. **Don't use two notations for the same thing in the same work.** If you write $[n] = \{1, 2, \ldots, n\}$ once, don't also write $\{1, 2, \ldots, n\}$ later without the abbreviation. Consistency is a debt the reader pays if you don't.
8. **Don't overload letters.** $p$ for a prime and $p$ for a proposition in the same proof is an invitation to misread.
9. **Display formulas that the reader must stop to absorb.** Inline formulas are for things the reader sees and moves past. Displayed (centered, on its own line) formulas are for things that matter for the next step.
10. **Number displayed formulas only if you refer back to them.** (Schwarz does this on slide 28: he numbers equations (1), (2), (3) because he refers back. Unused numbers are visual noise.)
11. **Don't use "clearly," "obviously," or "it is easy to see that" unless the point is actually clear, obvious, or easy.** These phrases are a temptation to skip work. Most of the time, if you feel the urge to write "obviously," you haven't explained enough.
12. **Put the most-complicated term of an equation on the left.** This is opposite to what's natural in computation (where you simplify from complex to simple) but right for reading: the reader looks for the subject on the left, not the result.
13. **Avoid ambiguous pronouns.** "This implies..." — *what* implies? Spell out "this fact," "this equation," "this assumption."
14. **Don't use a symbol before you define it.** Every object should be introduced before it is used, not retroactively named after a derivation that uses it anonymously.
15. **Don't define a symbol just before the end of a proof.** If you introduce $k$ in the last line, the reader feels they missed something earlier. Introduce early.
16. **Use parallel construction for parallel ideas.** "Let $x$ be a point in $A$ and $y$ a point in $B$" — both clauses share the same shape. "Let $x$ be in $A$ and let $y$ be a point in $B$" is jarring.
17. **Avoid nested parentheses more than two deep.** $((f(x))^2 + (g(y))^2)$ — clean it up. Consider brackets or alternative notation.
18. **Punctuate displayed formulas as if they were sentences.** A displayed formula ending a sentence gets a period; one in the middle gets a comma. This is what the "mugga mugga test" checks.
19. **Don't use quotation marks for scare quotes in a proof.** If you don't mean the word literally, find a different word. Scare quotes suggest uncertainty that has no place in a proof.
20. **Don't use exclamation points in proofs.** (!) A proof is not a celebration.
21. **Refer to formulas and figures by number, not by "the formula above."** "By equation (3)" is always better than "by the formula two lines up."
22. **Use consistent tense.** Mathematical prose is conventionally written in the present tense: "we see," "this gives," "we have." Mixing tenses is disorienting.
23. **Use "we" rather than "I," even in a single-author paper.** This is a 300-year convention and reflects the collaborative nature of mathematics.
24. **Keep notation as simple as possible.** Fancy notation is ego. Simple notation is service.
25. **Define specialized vocabulary explicitly.** Don't assume the reader knows your field's jargon. The reader might be from a different field.
26. **Avoid homonyms.** Don't use $n$ for both a natural number and a normal vector in the same proof.
27. **Give your lemmas distinguishable names or numbers.** "Lemma 3.2" is forgettable. "The Exchange Lemma" is memorable. When the name is descriptive, your reader can hold it in memory.

These rules are not laws. Working mathematicians violate them constantly — *Mathematical Writing* itself notes several of the rules are sometimes broken in high-profile papers. But they codify the default. When you break a rule, it should be a conscious choice justified by context, not ignorance of the convention.

### 2.2 The "mugga mugga test" in full

Schwarz's version is compressed. The full version, in the Knuth tradition:

1. Read your proof aloud as English prose.
2. Every time you encounter a mathematical symbol, say "blah" or "thing" or "mugga mugga" in its place.
3. The resulting text should still be a well-formed English paragraph — with clear subjects, verbs, objects, and grammatical connectives.

If the result is word salad, your proof has too much notation and too little prose. If the result is a long sequence of "blah" with no connecting words, you've stranded the reader in symbols. Either rewrite until the prose stands up, or reformat as a calculation with words explaining each step.

**Test on Schwarz's proof (slide 31):**

> Theorem: For any integers [blah] and [blah], if [blah] and [blah] are odd, then [blah] + [blah] is even.
> Proof: Consider any arbitrary integers [blah] and [blah] where [blah] and [blah] are odd. Since [blah] is odd, we know that there is an integer [blah] where [blah] = [blah]. Similarly, because [blah] is odd there must be some integer [blah] such that [blah] = [blah]. By adding equations (1) and (2) we learn that [blah] = [blah] = [blah] = [blah]. Equation (3) tells us that there is an integer [blah] (namely, [blah]) such that [blah] = [blah]. Therefore, we see that [blah] + [blah] is even, as required.

Reads as a perfectly grammatical English paragraph. The logical structure (consider, since, similarly, by adding, tells us, therefore, as required) carries the argument; the symbols are details inside the structure. This is the test passing.

## 3. Polya's heuristics

George Polya's *How to Solve It* (1945) is the most influential book ever written on the *process* of doing mathematics — as opposed to the form of finished work. Polya's method has four phases:

### 3.1 Understanding the problem

Before attempting a proof, ensure:

- You know what is given (the hypotheses).
- You know what is to be proved (the conclusion).
- You understand what every word in the statement means (every definition).
- You can restate the theorem in your own words without losing any content.
- You can draw a picture or construct an example.

Schwarz's deck enforces this through the *Intuitions* axis: before proving, draw the rectangles for even integers, or the Venn diagrams for sets. The picture isn't the proof, but it checks that you understand the statement.

### 3.2 Devising a plan

Polya's list of heuristics for finding a proof strategy:

- **Have you seen this problem before?** Or a similar one?
- **Can you restate the problem?** Using different notation, different words, a different formulation?
- **Can you find a connection between the hypothesis and the conclusion?** Does the hypothesis look useful? What does the conclusion make you think of?
- **Can you solve a related, easier problem?** A special case? A more general case?
- **Can you solve part of the problem?**
- **Did you use all the hypotheses?** If not, the proof is suspicious; either you're not done, or the unused hypothesis is extraneous.
- **Is there an analogous problem in a different domain?** Problems about finite sets and problems about infinite sets often have parallel proofs.

Polya's most famous observation: *"A great discovery solves a great problem but there is a grain of discovery in the solution of any problem."* Every proof is, in miniature, a creative act — the standard techniques are only a vocabulary, not a recipe.

### 3.3 Carrying out the plan

Once you have a plan, write each step. Check each step as you write it. Be suspicious of steps that "seem obvious" — most mistakes happen there. When you invoke a theorem, verify that its hypotheses are actually satisfied in your context.

### 3.4 Looking back

After the proof is complete:

- **Can you check the result?** Test on a specific case. Does the conclusion hold?
- **Can you check the argument?** Read each step skeptically. Are there hidden assumptions?
- **Can you derive the result differently?** An alternative proof strengthens your confidence and sometimes reveals new connections.
- **Can you use the result, or the method, for some other problem?** Polya's most underrated advice. The technique is often more valuable than the theorem.

## 4. Lakatos and the dialectic of proofs and refutations

Imre Lakatos's *Proofs and Refutations* (1976, posthumously published) is a philosophical study of how mathematics actually develops, presented as a fictional dialogue between a teacher and students working on Euler's polyhedron formula $V - E + F = 2$. The book's thesis: proof is not a one-shot production but an iterative dialectic between proof attempts and counterexamples.

### 4.1 The Lakatosian cycle

1. **Conjecture.** You guess that a statement is true.
2. **Proof attempt.** You try to prove it.
3. **Counterexample.** Someone produces a case where the conjecture fails.
4. **Examination.** You look at the counterexample. Does the proof attempt actually cover it?
5. **Patch.** Either the counterexample reveals a genuine error (in which case the conjecture is refuted and must be modified) or it reveals a hidden assumption (in which case the conjecture is correct but under-stated).
6. **Refined conjecture.** Add the hidden assumption to the statement.
7. **Repeat.**

Lakatos shows that Euler's formula has a long history of this kind: the original conjecture "for any polyhedron" was repeatedly refuted by objects like a cube with a smaller cube removed (where $V - E + F = 4$), leading to successive refinements: "for any *convex* polyhedron," "for any *simply connected* polyhedron," "for any *2-sphere-homeomorphic* polyhedron." Each refutation sharpened the theorem's statement, and the final theorem is more precise than the original conjecture.

### 4.2 What Lakatos teaches the proof writer

- **Proofs are fallible.** Even published proofs can turn out wrong; the mathematical community is a distributed error-correction system, not a bank of certified truths.
- **Stating the theorem correctly is half the work.** A statement that's too broad will be refuted; a statement that's too narrow will be uninteresting. The final form of a theorem is often the product of many rounds of debate.
- **Counterexamples are allies.** A counterexample isn't a failure of the prover's intelligence — it's a gift of information about the statement's true scope.
- **Definitions get refined too.** When Euler's formula fails for some polyhedra, the response is often to refine the definition of "polyhedron," not to abandon the theorem. Definitional clarification is a form of proof.

### 4.3 Lakatos in practice

Modern research mathematics is more Lakatosian than textbook mathematics suggests. A paper's journey from first draft to published form includes:

1. Informal conjecture and exploration.
2. First proof attempt, often with gaps.
3. Counterexamples and feedback from colleagues.
4. Refined theorem statement.
5. Refined proof.
6. Peer review.
7. Post-publication errata and corrections.

Schwarz's deck teaches the *end-state* of this process — the finalized proof. Students sometimes conclude from this that the professor wrote their proofs in a single linear pass. This is almost never true. Most working mathematicians' first drafts are messy, partial, and contain errors; the final version is the product of many revisions.

## 5. Harel and Sowder's proof-scheme taxonomy

Not all students who "prove" something are using the same mental procedure. Guershon Harel and Larry Sowder (1998, *"Students' proof schemes: Results from exploratory studies"*) conducted empirical research on college students' proof behavior and developed a taxonomy of **proof schemes** — the mental processes students actually use when they think they are proving something.

### 5.1 External proof schemes

The student is convinced by an external authority rather than by the mathematics itself.

- **Ritual scheme.** The proof is accepted because it follows a ritual form: starts with "Proof:", ends with Q.E.D., uses symbols in the right places. The content is not examined.
- **Authoritarian scheme.** The proof is accepted because a trusted source (the textbook, the teacher, Wikipedia) said it's a proof. The student does not verify.
- **Symbolic scheme.** The proof is accepted because symbols can be manipulated into the right shape, regardless of whether the manipulations are meaningful.

### 5.2 Empirical proof schemes

The student is convinced by examples or pictures rather than by general argument.

- **Inductive scheme.** "It works for $n = 1, 2, 3, 4, 5$, so it must be true." (This is *not* mathematical induction — it is empirical induction, the logical fallacy.)
- **Perceptual scheme.** "I can see it from the picture." The geometric or diagrammatic intuition stands in for proof.

Both empirical schemes are *useful* for generating conjectures and understanding claims. The problem is that students use them *instead of* a proof, not *in addition to*.

### 5.3 Analytic proof schemes

The student is convinced by a chain of logical reasoning.

- **Transformational scheme.** The student uses a chain of deductions, transformations, and manipulations to carry the theorem from hypothesis to conclusion. This is the standard informal proof.
- **Axiomatic scheme.** The student sees the proof as a derivation from explicit axioms, understands the role of each axiom, and can imagine varying the axioms. This is the sophisticated mathematician's view.

### 5.4 What this means for teaching

Harel and Sowder's research found that **most entering undergraduate mathematics majors operate with external and empirical schemes, not analytic ones**. They have learned to produce proof-shaped artifacts but have not internalized the logical structure that makes a proof a proof. The transition-to-proof course (where Schwarz's deck lives) is the bridge from empirical/ritual schemes to transformational schemes.

Schwarz's pedagogical moves are designed to push students toward transformational schemes:

- **The triangle framework.** Explicitly separates Intuitions (where empirical and perceptual reasoning live) from Conventions (where transformational reasoning lives) — so students can see both as legitimate but different.
- **The "mugga mugga" test.** Forces the student to verify the transformational chain by checking it reads as prose.
- **"Arbitrary choices" emphasis.** Forces universal introduction, which is the hallmark of analytic reasoning and the opposite of empirical induction.
- **Explicit case analysis.** Makes the logical structure visible on the page.

## 6. How mathematicians actually read proofs

Empirical research on how mathematicians read proofs has accelerated in the 2000s–2020s. Key findings:

### 6.1 Weber and Alcock — "zooming in" and "zooming out"

Keith Weber and Lara Alcock's work (e.g., Weber 2008, "How mathematicians determine if an argument is a valid proof") found that mathematicians read proofs at two levels:

- **Zoomed-in reading.** Check each line's correctness: does this step follow from the previous, given the cited definitions and theorems?
- **Zoomed-out reading.** Check the overall strategy: does the proof accomplish what it claims? Is the argument plausibly going to work given the kind of theorem this is?

Expert mathematicians switch between these two modes constantly. Novices — especially undergraduates — tend to get stuck in zoomed-in mode, checking every step in isolation without seeing the whole.

### 6.2 Inglis and Alcock — eye-tracking studies

Matthew Inglis and Lara Alcock's eye-tracking studies (2012, "Expert and novice approaches to reading mathematical proofs") found that:

- Novices spend most of their time on the **surface details** — notation, symbols, formulas.
- Experts spend more time on the **connective tissue** — the prose between formulas, the words "therefore," "since," "we have."
- Experts re-read the statement of the theorem multiple times during the proof, refreshing their understanding of the goal.
- Novices rarely re-read the statement after starting the proof.

This matches the Knuth/Larrabee/Roberts emphasis on prose: the prose carries the logical connections that an expert uses for comprehension, and notation is just the raw material the prose operates on.

### 6.3 Selden and Selden — validation studies

Annie and John Selden (2003, "Validations of proofs considered as texts") asked undergraduates to evaluate whether purported proofs were correct. Findings:

- Undergraduates often accept incorrect proofs as correct.
- Undergraduates often reject correct proofs as incorrect.
- The most common error is not checking whether the proof matches the theorem's claim (accepting a proof of a weaker or different claim).
- Undergraduates rarely notice gaps in the logical chain if the surface notation looks right.

The Selden studies underline a craft responsibility: **write proofs that are evaluable by the intended audience**. If your proof's reader is an undergraduate, the prose should be explicit enough that they can check each step. If your reader is a research mathematician, you can compress — but only as much as the reader can reasonably fill in.

## 7. The editorial pass — revising proofs

A first-draft proof is rarely the final proof. Professional mathematicians revise heavily. Here is a checklist for the editorial pass, adapted from Knuth/Larrabee/Roberts and from the author's own practice.

### 7.1 Structural checklist

- [ ] Does the proof's first sentence make clear what is being proved?
- [ ] Does every definition used appear before its first use, either in the proof or in the surrounding context?
- [ ] Is the overall proof strategy visible from the opening sentence or two? ("We proceed by induction on $n$." "We prove both directions separately.")
- [ ] Does the proof end with a clear statement that what was to be shown has been shown?
- [ ] Are the major logical steps (case splits, inductive steps, existential elimination) signaled explicitly?

### 7.2 Line-level checklist

- [ ] Does every sentence begin with a word, not a symbol?
- [ ] Is every variable either introduced before use or quantified in the statement?
- [ ] Are all equations that the reader must absorb on their own line?
- [ ] Does each displayed equation end with appropriate punctuation?
- [ ] Is the notation consistent throughout? (Same letter for the same object, different letters for different objects.)
- [ ] Does the proof cite every non-trivial step, either by naming the theorem or by deriving it inline?
- [ ] Is every "clearly" / "obviously" / "it is easy to see" either deleted or justified?

### 7.3 Logical checklist

- [ ] Is every hypothesis actually used? If not, the hypothesis is extraneous or the proof is wrong.
- [ ] Does every case in a case analysis actually cover part of the hypothesis space? Do the cases collectively cover all possibilities?
- [ ] In every inductive proof, is the inductive hypothesis clearly stated, and is the inductive goal clearly distinguished from it?
- [ ] In every existential proof, is a specific witness produced (or, if non-constructive, is the use of excluded middle made explicit)?
- [ ] In every universal proof, is the choice of variable *genuinely* arbitrary, or does the proof silently rely on a property that not all choices would have?

### 7.4 Audience checklist

- [ ] Is the level of detail appropriate to the intended audience?
- [ ] Are there terms or techniques the audience might not know, and if so, are they introduced or cited?
- [ ] Is the proof self-contained (to the appropriate level), or does it silently rely on unstated facts?

## 8. Common pitfalls and how to avoid them

### 8.1 The "plug-and-chug" proof

A proof that mechanically substitutes definitions into a goal, simplifies, and stops. No insight is communicated. The reader, at the end, knows the theorem holds but not *why*.

**Fix.** Add a sentence at the start or end explaining the strategy. "The key observation is that [...]." "The proof works because [...]." Even one sentence of narration transforms a plug-and-chug proof into a comprehension-supporting proof.

### 8.2 The bare calculation

A block of algebra with no words, connecting no ideas, reaching a conclusion with no signposting.

**Fix.** Add transitions. "Expanding, we get:" "By the binomial theorem:" "Substituting (2) into (1):" The transitions cost almost nothing and raise readability enormously.

### 8.3 The proof that assumes its conclusion

Restating the conclusion as a hypothesis and deriving the conclusion. Always invalid.

**Fix.** Re-read the first and last sentences of the proof. If they say the same thing, you haven't proved anything — you've asserted it twice.

### 8.4 The proof that omits the hard case

"The case $x = 0$ is trivial and is left to the reader." Often, when you look, the case $x = 0$ is where the argument actually breaks.

**Fix.** Never leave cases to the reader without first checking them. If the case is genuinely trivial, include it in one sentence and move on. If it's not trivial, include it in full.

### 8.5 The "by a similar argument" shortcut

After proving one of several symmetric cases, asserting that the others follow by a similar argument. Sometimes valid, sometimes hides an error.

**Fix.** Explicitly verify that the argument is symmetric. If the cases are *not* symmetric in some crucial detail, the shortcut is invalid. If they are symmetric, write out enough of one case that the reader can mechanically reconstruct the other.

### 8.6 The universal witness

Claiming an existential fact has been proven because you produced a single example. (Usually the result of confusing universal and existential statements.)

**Fix.** Check that the theorem is existential, not universal. If universal, you need to reason about an arbitrary element; a single example is not enough.

### 8.7 Notation collision

Using the same symbol for two different things in the same proof. Every reader gets confused.

**Fix.** Read through your proof and list every meaningful symbol. If any symbol appears with two roles, rename one.

## 9. The student's first year in proofs

Schwarz's deck is usually taught in the first quarter of a transition-to-proof course — CS103 at Stanford, MATH 3210 at other schools, or similar names elsewhere. The full arc of the course typically covers:

1. **Weeks 1–3** (Schwarz's deck lives here): What a proof is. Direct proofs. Simple set operations.
2. **Weeks 4–6:** Logic (propositional, predicate). Negation and quantifier pushes. Proofs by contrapositive and contradiction.
3. **Weeks 7–9:** Induction and well-ordering. Recursively defined sets and structural induction.
4. **Weeks 10–12:** Functions and cardinality. Pigeonhole. Cantor's diagonal. Countable and uncountable sets.
5. **Weeks 13–15:** Introduction to combinatorics and/or introduction to analysis. First $\varepsilon$-$\delta$ proofs.

Students who emerge from this course and go on to upper-division courses in analysis, algebra, topology, or number theory are expected to arrive fluent in:

- Reading a theorem statement and identifying the hypothesis, conclusion, and implicit quantifiers.
- Choosing an appropriate proof technique from the catalog (document 3).
- Writing a proof in the Knuth-style prose discipline (this document).
- Debugging their own proofs — finding gaps, unjustified steps, incorrect cases.

The craft principles in this document are what a student internalizes over their first year of proof-based mathematics. Schwarz's deck is the entry point, not the destination.

## 10. Craft in research-level mathematics

At the research level, the craft conventions become more demanding, not less:

- **Density.** Research proofs are compressed. A journal article's proof might take as much effort to *read* as to write. Compression is achieved by citing known results aggressively — "By Theorem 2.3 of [Smith, 1996]..." — and by omitting steps that the intended audience can fill in.
- **Structural signaling.** Long proofs are broken into lemmas, each with a clear role. The main proof is a sequence of lemma invocations, each followed by a short argument using the lemma.
- **Convention inheritance.** Each mathematical subfield has its own notation and terminology. A research proof in algebraic topology uses conventions that would baffle an analyst. Learning a new field includes learning its craft conventions.
- **Referee culture.** Peer review is the main enforcement mechanism for craft. A referee who can't follow the proof will recommend rejection or revision, regardless of technical correctness.

A working mathematician's craft discipline is built up over a decade or more. Schwarz's deck is Day 1.

## 11. Further reading

### Core craft references

- Knuth, D. E., Larrabee, T., & Roberts, P. M. (1989). *Mathematical Writing*. MAA Notes Series, Vol. 14. The definitive short treatment.
- Halmos, P. R. (1970). "How to write mathematics." *L'Enseignement Mathématique*, 16, 123–152. A classic essay by one of the 20th century's great expositors.
- Gillman, L. (1987). *Writing Mathematics Well: A Manual for Authors*. Mathematical Association of America.
- Higham, N. J. (1998). *Handbook of Writing for the Mathematical Sciences* (2nd ed.). SIAM. The most comprehensive modern style guide.
- Krantz, S. G. (1997). *A Primer of Mathematical Writing*. American Mathematical Society.

### Polya and problem-solving

- Polya, G. (1945). *How to Solve It*. Princeton University Press. (Still in print; multiple editions.)
- Polya, G. (1954). *Mathematics and Plausible Reasoning* (2 vols.). Princeton University Press.
- Polya, G. (1962–1965). *Mathematical Discovery* (2 vols.). Wiley.
- Schoenfeld, A. H. (1985). *Mathematical Problem Solving*. Academic Press. An empirical extension of Polya's work.

### Lakatos

- Lakatos, I. (1976). *Proofs and Refutations: The Logic of Mathematical Discovery* (J. Worrall & E. Zahar, Eds.). Cambridge University Press.

### Empirical research on proof comprehension

- Harel, G., & Sowder, L. (1998). "Students' proof schemes: Results from exploratory studies." In *Research in Collegiate Mathematics Education III*, 234–283. American Mathematical Society.
- Weber, K. (2008). "How mathematicians determine if an argument is a valid proof." *Journal for Research in Mathematics Education*, 39(4), 431–459.
- Inglis, M., & Alcock, L. (2012). "Expert and novice approaches to reading mathematical proofs." *Journal for Research in Mathematics Education*, 43(4), 358–390.
- Selden, A., & Selden, J. (2003). "Validations of proofs considered as texts: Can undergraduates tell whether an argument proves a theorem?" *Journal for Research in Mathematics Education*, 34(1), 4–36.
- Mejia-Ramos, J. P., Fuller, E., Weber, K., Rhoads, K., & Samkoff, A. (2012). "An assessment model for proof comprehension in undergraduate mathematics." *Educational Studies in Mathematics*, 79(1), 3–18.

### Style guides for specific audiences

- Steenrod, N. E., Halmos, P. R., Schiffer, M. M., & Dieudonné, J. A. (1973). *How to Write Mathematics*. American Mathematical Society. Four essays by four major mathematicians on the writing of their respective fields.
- Swanson, E. (1999). *Mathematics into Type* (updated edition). American Mathematical Society. Specifically about preparing mathematical manuscripts for publication.

## Cross-references within this mission

- **Document 1** situates the craft conventions historically — the modern discipline is an inheritance from Euclid via Bourbaki.
- **Document 2** provides the logical machinery the craft conventions tacitly rely on.
- **Document 3** gives the technique catalog that a well-crafted proof deploys.
- **Document 4** applies the techniques to specific structures — this document's principles are how to write those proofs well.
- **Document 6** shows the alternative craft discipline of formalized mathematics, where the reader is a machine and many of this document's conventions are inverted.

---

## Study Guide — Craft and Pedagogy of Proof Writing

### Prerequisites

- At least 5 proofs written (any quality) — you need raw material to apply craft principles to.
- Document 3 (techniques catalog) — the craft is about *presenting* a technique, not choosing one.
- Willingness to read your own writing critically.

### Key vocabulary

| Term | Definition | Section |
|---|---|---|
| **Mugga mugga test** | Replace all math notation with nonsense syllables; the result should be grammatical English. | 2.2 |
| **Knuth rules** | The 27 conventions from Knuth/Larrabee/Roberts (Stanford CS 209, 1987). | 2.1 |
| **Polya's heuristics** | Four-phase problem-solving method: understand, plan, carry out, look back. | 3 |
| **Lakatos's dialectic** | Conjecture → proof attempt → counterexample → refinement → repeat. | 4 |
| **Proof scheme** | Harel & Sowder's taxonomy: external (ritual/authority/symbolic), empirical (inductive/perceptual), analytic (transformational/axiomatic). | 5 |
| **Zoomed-in / zoomed-out** | Weber & Alcock's two reading levels: line-level correctness vs. strategy-level coherence. | 6.1 |

### Reading order

1. Section 1 (why craft matters) — motivation.
2. Section 2 (Knuth rules) — the core discipline. Read once, then return whenever you're editing a proof.
3. Section 3 (Polya) — read before your next problem set.
4. Section 7 (the editorial pass) — use as a checklist on every proof you write for the next month.
5. Sections 4–6 (Lakatos, Harel-Sowder, empirical research) — read when you want to understand *why* students struggle with proofs, not just how to write them.
6. Sections 8–10 (pitfalls, first year, research level) — read for awareness and future reference.

### Study plans

**1-week sprint.** Read section 2 (Knuth rules) and section 7 (editorial pass). Take three proofs you've already written and apply the 27 Knuth rules + the editorial checklist. Rewrite each proof. Compare before and after.

**1-month deep dive.** Read Polya's *How to Solve It* Part I (20 pages). For every proof you write this month, explicitly identify which Polya phase you're in as you work. Read Halmos's "How to write mathematics" essay (15 pages). Apply Halmos's advice to one proof you're proud of — does it survive his standards?

**6-month mastery.** Read Lakatos's *Proofs and Refutations* in full. It's a novel-length philosophical dialogue and one of the most enjoyable mathematics books ever written. After reading it, go back to a proof you struggled with and trace the Lakatosian cycle: what was your original conjecture? Where did it fail? How did you refine it? Keep a "Lakatos journal" of your proof-writing evolution.

---

## TRY Session — The Mugga Mugga Test

**Duration:** 15 minutes.
**Materials:** A proof you've recently written (any topic).

**Steps:**

1. Read your proof aloud, but replace every mathematical symbol with "mugga mugga" (or "blah").
2. Listen to the result. Is it a grammatical English paragraph? Does it have:
   - A clear opening sentence? ("Let mugga mugga be mugga mugga.")
   - Connective tissue? ("Since mugga mugga, we know mugga mugga.")
   - A conclusion? ("Therefore, mugga mugga is mugga mugga.")
3. If the result is choppy ("Mugga mugga. Mugga mugga. Mugga mugga."), your proof needs more prose connecting the formulas.
4. If the result is unintelligible ("Mugga mugga mugga mugga mugga"), your proof has too many symbols in sequence without English words.
5. Rewrite until the mugga-mugga version reads like a paragraph.

**What to observe:** Most first-draft proofs fail the test. The rewrite is usually only 3–5 words per sentence longer than the original, but the difference in readability is dramatic.

---

## TRY Session — Apply Polya's Four Phases to a New Theorem

**Duration:** 30 minutes.
**Materials:** Pen and paper.

**Theorem to prove:** For any positive integer $n$, the number $n^3 - n$ is divisible by 6.

**Steps, by Polya phase:**

*Phase 1 — Understand:*
1. What does the theorem claim? ($6 \mid n^3 - n$ for all $n \geq 1$.)
2. Try examples: $n = 1 \Rightarrow 0$ (divisible by 6). $n = 2 \Rightarrow 6$. $n = 3 \Rightarrow 24 = 4 \times 6$. $n = 4 \Rightarrow 60 = 10 \times 6$. Pattern holds.
3. Factor: $n^3 - n = n(n-1)(n+1) = (n-1) \cdot n \cdot (n+1)$. This is a product of three consecutive integers.

*Phase 2 — Plan:*
4. Among three consecutive integers, one is divisible by 3 (pigeonhole on remainders mod 3). At least one is even (pigeonhole on remainders mod 2). So the product is divisible by $2 \times 3 = 6$.
5. Alternative plan: induction on $n$. Verify base case, then show $(k+1)^3 - (k+1) - (k^3 - k) = 3k^2 + 3k = 3k(k+1)$, which is divisible by 6 since $k(k+1)$ is even.

*Phase 3 — Carry out:*
6. Write the proof using whichever plan you prefer. Apply the mugga mugga test.

*Phase 4 — Look back:*
7. Can you generalize? What about $n^5 - n$? (Divisible by 30 = 2 × 3 × 5. Why?)

**What to observe:** Phase 2 (devising a plan) is where the creativity happens. Two valid plans exist for this theorem — the factoring approach and the induction approach. Neither is "better"; the factoring approach is more insightful, the induction approach is more mechanical. Knowing both is the skill.

---

## TRY Session — Peer Review a Proof

**Duration:** 20 minutes.
**Materials:** Exchange proofs with a partner (or use your own proof from a previous assignment as if someone else wrote it).

**Steps:**

1. Read the proof with the **zoomed-out** lens first (Weber & Alcock, section 6.1): does the overall strategy make sense for this type of theorem? Is the technique appropriate?
2. Read with the **zoomed-in** lens: check each line. Does it follow from the previous lines? Is every definition invoked? Is every quantifier handled correctly?
3. Apply the editorial checklist from section 7.
4. Write feedback: (a) one thing the proof does well, (b) one specific line where the reasoning could be clearer, (c) one thing you would change.

**What to observe:** You will likely notice that reading someone else's proof is harder than writing your own. The difficulty is diagnostic — it reveals which parts of the proof are under-explained. If you can't follow a step, the step needs more prose, not because you're slow but because the writer omitted a link.

---

## DIY — Rewrite a Textbook Proof in Three Styles

**Scope:** 2–3 hours.
**Deliverable:** One proof written three ways.

**Task:** Choose a moderately complex theorem from your current course (something 10–20 lines in the textbook). Rewrite the proof in three styles:

1. **Maximum formality.** Every step cites its justification by name (theorem number, axiom, definition). Numbered equations throughout. No gaps.
2. **Schwarz style.** The Definitions/Intuitions/Conventions triangle: explain each definition used, give a visual or numerical intuition before the formal proof, and write in complete sentences with the mugga-mugga test passing.
3. **Research paper style.** Compress to roughly half the length of the textbook version. Cite prior results aggressively ("By [Theorem 3.2],..."). Assume the reader is a peer who can fill in routine steps.

**What you learn:** Each style serves a different audience. Formality for machine-checking, Schwarz style for students, research style for experts. The same mathematical content looks different in each, and the *craft choices* — what to include, what to omit, what to explain — are different.

---

## DIY — The Proof-Scheme Self-Assessment

**Scope:** 1 hour.
**Deliverable:** A 1-page self-assessment.

**Task:** Read the Harel-Sowder taxonomy (section 5). For each proof scheme, honestly assess whether you have used it in the past month:

1. **Ritual scheme.** Did you ever write "Proof:" at the top and "QED" at the bottom without understanding the middle?
2. **Authoritarian scheme.** Did you ever accept a proof because the textbook said so, without checking the steps?
3. **Symbolic scheme.** Did you ever manipulate symbols to reach a conclusion without understanding what the symbols meant?
4. **Inductive scheme.** Did you ever check examples and conclude a universal statement was true?
5. **Perceptual scheme.** Did you ever draw a picture and call it a proof?
6. **Transformational scheme.** Did you write a proof where each step followed logically from the previous, and you understood why?
7. **Axiomatic scheme.** Did you write a proof where you could name the axioms being used and imagine changing them?

Most students find they use 1–5 more often than they'd like. The goal is to increase 6 and 7 over time, not to feel guilty about 1–5.

---

## College & Rosetta Deep Links

### Department connections

| College Department | Concept ID | Connection |
|---|---|---|
| **Writing** | writing-process | The entire document — proof writing IS writing. Section 2 (Knuth rules) is a style guide; section 7 (editorial pass) is the revision process |
| **Communication** | (clarity, audience) | Section 4 (formal vs. informal proof) — adapting rigor level to audience is a communication skill |
| **Logic** | `log-argument-structure` | Section 6 (fallacies, section 8 pitfalls) — the negative cases of argument structure |
| **Logic** | `log-formal-proof-systems` | Section 4 (the gap between formal and informal proof) |
| **Critical Thinking** | (evaluation, metacognition) | Section 5 (Harel-Sowder proof schemes) is a metacognitive framework — knowing how you think about proofs |
| **Problem-Solving** | (heuristics, strategies) | Section 3 (Polya's four phases) — the canonical problem-solving method |
| **Philosophy** | (epistemology) | Section 4 (Lakatos) — the nature of mathematical knowledge as a social construction refined by dialogue |
| **Psychology** | (cognitive science) | Section 6 (Weber, Inglis, Selden) — empirical research on mathematical cognition |
| **Learning** | (metacognition, study skills) | The study plans in every document — learning how to learn proofs |
| **Reading** | reading-discovery | Section 6 (eye-tracking research) — how experts read proofs differently from novices |

### Rosetta panel routes

- **Python panel:** Section 7's editorial checklist can be partially automated. A Python script that checks whether displayed formulas end with punctuation, whether sentences start with a word (not a symbol), and whether variables are introduced before use. This connects Writing → Coding.
- **Natural language panel:** Section 5 (English-to-logic translation) is a Rosetta cross-reference between natural language and formal language. The same concept expressed in English, in symbols, and in code.
- **All 9 panels:** Section 2.1 rule 3 (don't use logical symbols in prose) has an analogue in every programming language: don't use operator overloading to the point of illegibility. The craft principle transcends the notation system.

### Cross-department threads

- **Writing → Logic → Math:** Proof writing sits at the intersection of all three. The Writing department teaches prose structure, Logic teaches logical structure, and Mathematics teaches the content. A proof course is implicitly a course in all three departments.
- **Philosophy → Logic → Psychology:** Lakatos (section 4, Philosophy) describes how proofs develop dialectically; Harel-Sowder (section 5, Logic/Psychology) describes how students think about proofs; Weber/Inglis (section 6, Psychology) measures how experts evaluate proofs. Together they form a complete picture of proof as a human activity.
- **Learning → Problem-Solving → Critical Thinking:** Polya (section 3) teaches how to solve problems; the proof-scheme taxonomy (section 5) teaches how to recognize your own reasoning patterns; the editorial pass (section 7) teaches how to evaluate and improve your own work. All three are metacognitive skills.
