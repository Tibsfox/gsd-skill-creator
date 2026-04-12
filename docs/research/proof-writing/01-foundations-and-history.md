# 01 — Foundations and History of Mathematical Proof

> **Schwarz deck, slide 4** — *"A proof is an argument that demonstrates why a conclusion is true, subject to certain standards of truth. A mathematical proof is an argument that demonstrates why a mathematical statement is true, following the rules of mathematics."*

The definition is deliberately circular. It tells you a proof is what follows "the rules of mathematics," but it does not tell you what those rules *are*, nor why they are the ones they are, nor how they came to be. The circularity is pedagogically sound at the start of a course — you need to *do* proofs before you can ask what they are. This document closes the circle from the other side: what the rules of mathematics actually are, how we came to agree on them, and what it means for an argument to satisfy them.

## 1. Proof before proof — the pre-axiomatic period

### 1.1 Babylonian and Egyptian mathematics (c. 2000–500 BCE)

The mathematics of the second and first millennia BCE was algorithmic and verifiable but not axiomatic. Plimpton 322 (c. 1800 BCE, Old Babylonian) encodes a table of Pythagorean triples that its creators clearly understood to satisfy $a^2 + b^2 = c^2$, but no surviving tablet contains anything a modern reader would call a proof. The tablets give *procedures* — take this number, add that one, multiply by a third — that produce correct answers. The modern question "why does this procedure work?" is not asked.

This matters for our understanding of proof because it shows that algorithm and proof are separable. A culture can compute correctly for millennia without ever articulating *why* the computation is correct. Proof, in the modern sense, is a particular historical invention, not a universal feature of mathematical practice.

### 1.2 The Greek turn (c. 500–300 BCE)

The decisive break happens in the Greek-speaking world between Thales (c. 624–546 BCE) and Euclid (fl. c. 300 BCE). Thales is traditionally credited with the first *general* mathematical claims accompanied by reasoning — propositions like "the base angles of an isosceles triangle are equal" stated about *all* isosceles triangles, not a particular one, and defended by argument rather than appeal to a computation.

By the time of Euclid, this had crystallized into the **axiomatic method**: start from a small number of statements accepted without proof (axioms and postulates), give precise definitions of the terms you will use, and derive everything else by chains of inference from the axioms. Euclid's *Elements* (c. 300 BCE) presents 465 propositions in 13 books, starting from 23 definitions, 5 postulates, and 5 common notions.

The *Elements* is the first surviving complete example of what Schwarz's deck is asking the student to learn. Every proposition has a statement, a diagram, a construction, a proof, and a closing remark "which was to be demonstrated" ($\ho'per \'edei de\i'xai$, abbreviated Q.E.D.). The pedagogical structure Schwarz uses — **theorem / proof / therefore** — descends more or less unchanged from Book I of the *Elements*.

### 1.3 What Euclid actually did

Euclid's Proposition I.1 — on a given finite straight line, to construct an equilateral triangle — is worth reading in full:

> Let $AB$ be the given finite straight line. It is required to construct an equilateral triangle on the straight line $AB$.
>
> With centre $A$ and distance $AB$ let the circle $BCD$ be described [Postulate 3]; again, with centre $B$ and distance $BA$ let the circle $ACE$ be described [Postulate 3]; and from the point $C$, in which the circles cut one another, to the points $A$ and $B$ let the straight lines $CA$ and $CB$ be joined [Postulate 1].
>
> Now, since the point $A$ is the centre of the circle $CDB$, $AC$ is equal to $AB$. Again, since the point $B$ is the centre of the circle $CAE$, $BC$ is equal to $BA$. But $CA$ was also proved equal to $AB$; therefore each of the straight lines $CA$, $CB$ is equal to $AB$. And things which are equal to the same thing are also equal to one another [Common Notion 1]; therefore $CA$ is also equal to $CB$. Therefore the three straight lines $CA$, $AB$, $BC$ are equal to one another.
>
> Therefore the triangle $ABC$ is equilateral, and it has been constructed on the given finite straight line $AB$.
> (Being) what it was required to do.

Notice the structure:

- **Construction** — create the objects the proof will reason about.
- **Citation of postulates** — each move appeals to a specific postulate or common notion.
- **Chain of equalities** — each step cites the previous.
- **Closing statement** — re-asserts what was to be shown.

This is the same structure Schwarz teaches: set up the objects (*"let $n$ be an even integer"*), invoke the definition (*"since $n$ is even, there is some integer $k$ such that $n = 2k$"*), reason forward (*"this means $n^2 = (2k)^2 = 4k^2 = 2(2k^2)$"*), and close (*"therefore $n^2$ is even"*). The form is 2300 years old.

### 1.4 The gap Euclid left

Euclid's *Elements* was the gold standard of rigor for two millennia. But the gold was not pure. In Proposition I.1 above, the proof silently assumes that the two circles *intersect* at a point $C$. Nothing in the postulates guarantees this. The assumption is so geometrically obvious that Euclid takes it for granted — but "obvious" is not the same as "proven."

These gaps — unstated assumptions justified by geometric intuition — accumulated over the centuries. By the 19th century, mathematicians had noticed many of them. The most famous is the **parallel postulate** (Postulate 5), which Euclid himself seems to have distrusted; he proved the first 28 propositions of Book I without using it. Attempts to derive it from the other postulates failed for 2000 years, culminating in the 19th-century realization (Gauss, Lobachevsky, Bolyai) that non-Euclidean geometries *exist*, and that Postulate 5 is independent of the others.

The 19th-century crisis is what made modern proof necessary. If Euclid's "obvious" assumptions could turn out to be non-trivial and sometimes false, no "obvious" step could be trusted anymore. Every step of every proof had to be defended from a stated axiom.

## 2. The rigor revolution (1800s)

### 2.1 Cauchy, Weierstrass, and the arithmetization of analysis

The 19th century began with calculus in a state of rigor comparable to Euclid's — powerful, successful, and built on foundations that mathematicians themselves found dubious. Newton and Leibniz had written as if infinitesimal quantities were meaningful, and their 18th-century successors (Euler, Lagrange) had reached conclusions of enormous beauty and subtlety without a secure definition of what a limit, a derivative, or an integral actually *was*.

Augustin-Louis Cauchy (1789–1857) replaced the infinitesimal with the *limit*, defined in terms of inequalities. Karl Weierstrass (1815–1897) made Cauchy's definition precise with the $\varepsilon$-$\delta$ definition that now appears in every first-year analysis course:

$$\lim_{x \to a} f(x) = L \iff \forall \varepsilon > 0\ \exists \delta > 0\ \forall x\ (0 < |x - a| < \delta \implies |f(x) - L| < \varepsilon).$$

This is the first place in our history where the logical machinery of modern proof — nested quantifiers, conditionals, precise inequalities — becomes visible on the surface. Schwarz's deck teaches the same discipline with simpler examples; $\varepsilon$-$\delta$ is where that discipline first became unavoidable.

Weierstrass's students — Cantor, Dedekind, Frege — carried the rigor program further. By 1872 Dedekind had given a construction of the real numbers from the rationals (Dedekind cuts), and Cantor had done the same with Cauchy sequences. The reals were no longer a primitive notion from geometry; they were a set built from $\mathbb{Q}$ by a precise construction.

### 2.2 Cantor, sets, and the foundation of foundations

Georg Cantor (1845–1918) invented set theory as a tool for analysis and found that it had far larger consequences than its original purpose. In papers from 1874 onward, Cantor showed:

- The rational numbers are countable.
- The real numbers are not.
- There is no largest cardinality — for any set $S$, the power set $\mathcal{P}(S)$ is strictly larger.
- The real line and the real plane have the same cardinality.

Cantor's diagonal argument (1891) — that $\mathbb{R}$ is uncountable — is one of the most important proof techniques ever invented. We'll see it in detail in document 3. Its importance here is historical: it demonstrated that *logical reasoning about infinity could produce surprising, non-obvious, and undeniable theorems*. Before Cantor, mathematicians had talked about the infinite with caution. After Cantor, they talked about it with precision.

### 2.3 Frege and the logicization of proof

Gottlob Frege (1848–1925) asked a different question: what are the rules of inference that a proof uses? Could one write down those rules precisely enough that checking a proof became a mechanical operation? Frege's *Begriffsschrift* (1879) — literally "concept-script" — was the first modern formal logic. It introduced:

- Propositional connectives with truth-functional definitions.
- Predicates and quantifiers in something close to their modern form.
- A set of inference rules (modus ponens and substitution).
- An explicit claim: every valid mathematical inference can in principle be reduced to repeated applications of these rules.

This was the first time anyone had tried to specify what a proof is at the level of individual logical steps. Before Frege, "proof" meant "an argument that convinces competent mathematicians." After Frege, it meant (at least in principle) "a sequence of strings each derivable from the previous by a rule on the list."

### 2.4 The Russell paradox and the collapse

Frege's program came very close to success. His two-volume *Grundgesetze der Arithmetik* (1893, 1903) was his attempt to derive all of arithmetic from logic alone. In June 1902, Bertrand Russell sent Frege a letter containing what is now called **Russell's paradox**:

> Consider the set $R = \{ x : x \notin x \}$ of all sets that are not members of themselves. Is $R \in R$?
>
> - If $R \in R$, then by the definition of $R$, $R \notin R$. Contradiction.
> - If $R \notin R$, then $R$ satisfies the defining condition of $R$, so $R \in R$. Contradiction.

Frege's response, printed in an appendix to the second volume of *Grundgesetze*, is one of the most famous moments in the history of mathematics:

> "A scientist can hardly meet with anything more undesirable than to have the foundation give way just as the work is finished. I was put in this position by a letter from Mr. Bertrand Russell when the work was nearly through the press."

Russell's paradox showed that Frege's original set-formation principle — the **axiom of unrestricted comprehension**, which said you could form a set by specifying any property — was inconsistent. The whole tower of logical foundations had to be rebuilt with a more careful comprehension principle. The period 1900–1930 is the period of that rebuilding.

## 3. Hilbert's program and the formalist response (1900–1930)

### 3.1 The Hilbert program

David Hilbert (1862–1943) was the 20th century's most influential advocate for making mathematics fully rigorous. In his 1900 address to the International Congress of Mathematicians in Paris, Hilbert posed 23 problems, several of which were directly about the foundations of mathematics. His most ambitious goal was to show that mathematics could be put on a fully formal basis: every theorem proved, every proof mechanically checkable, and the consistency of the whole system proved by the same methods.

Hilbert's program had three pillars:

1. **Formalize all of mathematics** in a precise logical calculus.
2. **Prove the calculus is consistent** — no contradiction like Russell's paradox can arise.
3. **Prove the calculus is complete** — every true mathematical statement has a proof in the system.

If Hilbert's program had succeeded, the question "what is a proof?" would have had a completely precise answer: a finite string of symbols that is a derivation in Hilbert's calculus. Checking a proof would become a mechanical operation. Mathematical truth and mathematical provability would coincide.

### 3.2 Principia Mathematica and Zermelo-Fraenkel set theory

Two parallel efforts produced the foundational formal systems that every modern proof (tacitly) lives in.

**Principia Mathematica** (Whitehead & Russell, 1910–1913) took Frege's approach, fixed Russell's paradox with a theory of types, and attempted to derive all of mathematics from logic. It famously takes over 300 pages to prove that $1 + 1 = 2$. The book succeeded at its technical goal but was too unwieldy for working mathematicians to adopt.

**Zermelo-Fraenkel set theory (ZF)** (Zermelo 1908, Fraenkel 1922, Skolem 1922) took a different approach: keep sets as primitive, but restrict set formation to a small number of axioms that avoid Russell's paradox. The axioms of ZF are:

1. **Extensionality** — two sets with the same elements are equal.
2. **Pairing** — given any two sets $a, b$, the set $\{a, b\}$ exists.
3. **Union** — for any set of sets, the union is a set.
4. **Power set** — for any set $S$, the set $\mathcal{P}(S)$ of all subsets exists.
5. **Infinity** — there exists an infinite set.
6. **Replacement** — the image of a set under a definable function is a set.
7. **Foundation (Regularity)** — every non-empty set has a $\in$-minimal element.
8. **Separation** — for any set $S$ and property $P$, the subset $\{x \in S : P(x)\}$ exists. (This is the restricted comprehension that avoids Russell's paradox.)

Together with the **Axiom of Choice** (AC), this becomes **ZFC**. ZFC has been the de facto foundation of mathematics since approximately 1950. When a working mathematician reasons about sets without specifying which axioms they are using, they are almost always using ZFC.

Every proof Schwarz's deck discusses — and every proof in this research mission — is formally a proof in ZFC, though this is almost never made explicit. Mathematicians work in an informal dialect of ZFC the way programmers work in Python rather than assembly language.

### 3.3 Gödel's incompleteness theorems

Kurt Gödel (1906–1978) proved that Hilbert's program was impossible.

**Gödel's First Incompleteness Theorem** (1931): Any consistent formal system strong enough to express elementary arithmetic contains true statements that cannot be proved within the system.

**Gödel's Second Incompleteness Theorem** (1931): No consistent formal system strong enough to express elementary arithmetic can prove its own consistency.

The technique — Gödel numbering, the construction of a self-referential sentence that says "I am not provable" — is one of the most beautiful proofs in mathematics. Its consequence for the question "what is a proof?" is enormous:

- Mathematical **truth** and mathematical **provability** are genuinely different properties. There are mathematical statements that are true but unprovable (in any fixed formal system strong enough for arithmetic).
- No formal system can be the last word. For any system $S$, there is a statement $G_S$ — the Gödel sentence for $S$ — that $S$ cannot decide.
- Proving that your formal system is consistent requires a stronger formal system. There is no self-justifying foundation.

### 3.4 What Gödel means for Schwarz's definition

Schwarz defines a proof as "an argument that demonstrates why a mathematical statement is true, following the rules of mathematics." After Gödel, we know this definition is already slightly imprecise: mathematical truth and the rules of mathematics don't fully align. A more careful definition might be:

> A proof is an argument whose steps each follow from a fixed, agreed-upon set of rules — and whose conclusion therefore *must* be accepted *if* the rules are accepted and consistent.

Notice the qualifications. Proof establishes conditional truth: *if* the axioms are consistent and *if* the rules of inference are sound, *then* the conclusion holds. Absolute certainty is not available. This is not a defect — it is the nature of mathematics.

## 4. The Bourbaki program and modern practice (1930s–1970s)

### 4.1 Nicolas Bourbaki

In 1934, a group of young French mathematicians — including André Weil, Jean Dieudonné, Henri Cartan, Claude Chevalley, and Szolem Mandelbrojt — began writing a comprehensive treatise on modern mathematics under the collective pseudonym **Nicolas Bourbaki**. Their goal was to present mathematics from a single, unified, fully rigorous standpoint, starting from the axioms of set theory and building the whole edifice systematically.

The Bourbaki treatise *Éléments de Mathématique* eventually ran to over 7000 pages across multiple volumes (Set Theory, Algebra, General Topology, Functions of a Real Variable, Topological Vector Spaces, Integration, etc.). Its influence on 20th-century mathematics is immense:

- **The modern definition of a structure** — a set with operations and axioms — is Bourbaki's.
- **The concept of a "category" of structures** (group, ring, topological space, measure space) and the emphasis on morphisms between them is a Bourbaki contribution.
- **The style of modern proof writing** — dense, symbolic, structured by definitions and propositions — is the Bourbaki style.

Not all of Bourbaki's influence was positive. Critics (notably Vladimir Arnold) argue that Bourbaki's insistence on complete generality and complete rigor drained mathematics of its concrete, problem-solving character and produced a generation of mathematicians who could prove but not compute. Schwarz's deck leans in the opposite direction — it is proudly concrete, pictorial, and pedagogical.

### 4.2 The modern proof convention

By the 1970s, a set of conventions had stabilized for what a working mathematician's proof looks like. The conventions have never been written down officially — they are learned by apprenticeship — but they include:

1. **A proof is prose.** It consists of complete English sentences, with mathematical symbols used as nouns within those sentences. Schwarz's "mugga mugga test" (page 32 of the deck) is a direct expression of this convention.
2. **A proof cites its definitions.** When a term is first used, its definition is either given or referenced. Schwarz's *Definitions* axis is this convention.
3. **A proof proceeds linearly.** Each step follows from the previous steps and from stated prior results. Backtracking and "consider" moves are allowed but must be clearly marked.
4. **A proof ends with Q.E.D. or $\blacksquare$.** The end-of-proof marker is not decorative — it signals the reader that the argument is complete.
5. **A proof is checkable by competent peers.** If a proof is correct, another mathematician reading it carefully should be able to verify every step. This is the social criterion of proof: a proof is what the mathematical community accepts as a proof.
6. **A proof does not reference its author's intentions.** The proof stands or falls on its written content. "I meant that..." is not a valid defense.

These are social conventions. They vary slightly across fields (number theorists write differently from geometers), across countries (French proofs are on average more formal than American ones), and across time. But the core is stable.

## 5. The 20th-century expansion of proof

### 5.1 Constructive mathematics

Not all mathematicians accept the classical conventions. **Intuitionism**, founded by L.E.J. Brouwer (1881–1966), rejects the law of excluded middle ($P \lor \neg P$) as a general principle and requires that existence proofs actually construct the object whose existence is claimed. A classical proof by contradiction that "there exists an $x$ with property $P$" is not accepted by an intuitionist unless the proof also produces an $x$.

This is not crankery. The Brouwer-Heyting-Kolmogorov interpretation of intuitionistic logic corresponds (via the Curry-Howard correspondence) to *types* in programming languages, and every modern proof assistant (Coq, Lean, Agda) is built on this foundation. Intuitionistic proof is constructive proof, and constructive proof is what a computer can run.

Schwarz's deck teaches proof in the classical tradition, which is still the default for most working mathematicians. But the existence of a coherent constructive alternative — that has its own theorems, its own techniques, and its own computer realization — means the question "what counts as a proof?" is not fully settled even today.

### 5.2 Computer-assisted proof

The first computer-assisted mathematical proof of a significant result was Appel and Haken's 1976 proof of the **four-color theorem** — the claim that any planar map can be colored with four colors so that no two adjacent regions share a color. The proof reduced the problem to roughly 1,900 configurations, each of which was checked by computer. No human has ever read every step; the proof's correctness depends on the correctness of the software and hardware used.

This was controversial. Many mathematicians felt that a "proof" that required a computer was not really a proof, because it was not checkable by a human reader. The controversy has gradually subsided as computer-assisted proof has become a standard tool, but it raised an important question: does the definition of proof depend on the cognitive capacities of a human reader, or only on logical correctness?

Later computer-assisted results include:

- **Kepler conjecture** (Thomas Hales, 1998; fully formalized in Lean/HOL Light by Hales and team, 2014). The conjecture, proposed by Kepler in 1611, states that no packing of equal spheres in three-dimensional Euclidean space has density greater than $\pi/\sqrt{18} \approx 0.7405$ (the density of the face-centered cubic packing). Hales's original 1998 proof was several hundred pages and included massive computer computations. The Flyspeck project (2003–2014) produced a fully machine-checked version.
- **Feit-Thompson odd-order theorem** (fully formalized in Coq by Gonthier and team, 2012). The original 1963 proof by Feit and Thompson is 255 pages; the Coq formalization is one of the largest machine-checked proofs ever produced and demonstrated that pure-mathematics proofs of substantial complexity could be put on a formal foundation.

### 5.3 The formalization movement (2010s–present)

The 2010s and 2020s have seen an explosion of interest in formalization. The **Lean mathematical library** (Mathlib) — at the time of this writing, over 1.5 million lines of formalized mathematics covering undergraduate and early graduate analysis, algebra, topology, and number theory — is the largest collaborative mathematics formalization project ever. The **Liquid Tensor Experiment** (2020–2022), led by Peter Scholze and formalized in Lean by Adam Topaz, Johan Commelin, and others, formalized a highly technical theorem from Scholze's research program about condensed mathematics. Scholze himself had written that he was uncertain the original proof was correct; the formalization confirmed it was.

This is a new phase in the history of proof. For the first time, cutting-edge research results are being checked by machine as they are produced. Document 6 of this mission treats the formalization movement in detail.

## 6. What "proof" means in 2026

After this history, we can give a more complete answer to Schwarz's opening question. A **mathematical proof** in 2026 is any of the following, depending on context:

| Context | What counts as proof |
|---|---|
| **Working mathematician** | An argument in the conventional prose style that another competent mathematician can read, check, and accept as a valid derivation from known results within an implicit ZFC framework. |
| **Logician / foundations** | A finite sequence of formulas in a fully specified formal calculus (first-order logic + ZFC axioms, or an equivalent system), where each step is either an axiom or follows from previous steps by a specified inference rule. |
| **Constructivist / type theorist** | A program — a term in a dependent type theory — whose type is the statement being proved. The Curry-Howard correspondence makes this precise: propositions are types, proofs are programs. |
| **Computer-assisted / formalized** | A proof expressed in the language of a proof assistant (Lean, Coq, Isabelle/HOL, Agda) and accepted by the assistant's kernel as type-correct. |
| **Applied / experimental** | A combination of mathematical argument and computational evidence where the computational evidence cannot be eliminated (e.g., Appel & Haken's four-color proof, Hales's original Kepler proof). |

All five senses coexist. A working mathematician might write a proof in the first sense, silently relying on the second sense as a guarantee that the argument could be formalized if challenged, while a collaborator at the same institution formalizes it in the fourth sense. This is the present state of the art.

## 7. Consequences for Schwarz's framework

Several features of Schwarz's pedagogy become clearer in historical context:

**The Definitions axis.** Definitions are the load-bearing elements of modern mathematics because of the post-Frege realization that intuition alone cannot justify a step. If you do not know exactly what "even" means, you cannot prove $n^2$ is even. This is a 19th-century innovation; mathematicians before Weierstrass did not define concepts with this precision.

**The Conventions axis.** The specific conventions Schwarz teaches (complete sentences, citation of definitions, arbitrary choices, numbered equations, end-of-proof markers) are largely 20th-century inheritances from Bourbaki and the modern research paper format. They are not natural or inevitable; they are the current culture's solution to the problem of unambiguous communication.

**The Intuitions axis.** The surprise here is the status of intuition. In Euclid's time, intuition (especially geometric intuition) could justify steps of a proof. After the 19th-century rigor revolution, intuition can motivate a proof but cannot *justify* a step — every step must cite a definition or a prior result. Schwarz's deck is careful about this: the rectangular diagrams are labeled as "intuitions," and the prose proofs never cite them as evidence.

**The If-P-Then-Q template.** Schwarz's recurring pattern — "to prove 'if P then Q', assume P, then show Q must be true" — is the natural-deduction rule for implication introduction, formalized by Gerhard Gentzen in 1934. When Schwarz asks students to memorize this pattern, they are memorizing a piece of 20th-century proof theory.

**The "mugga mugga" test.** This is Schwarz's statement that a proof must read as coherent English when mathematical notation is replaced by nonsense syllables. It is a practical expression of a very deep principle: proofs are not symbol-manipulation but natural-language arguments that happen to include mathematical notation. The reader reconstructs the logical structure from the language. This is the working mathematician's definition of proof, and it is why formalized proofs (which are often unreadable to humans) are a different animal.

## 8. Further reading

### Primary texts

- Euclid (c. 300 BCE). *The Thirteen Books of Euclid's Elements*. Translated by Thomas L. Heath, 1908. Dover edition, 1956. Still the most important single source for understanding what classical geometric proof looks like.
- Frege, G. (1879). *Begriffsschrift, eine der arithmetischen nachgebildete Formelsprache des reinen Denkens*. Halle. English translation: *Conceptual Notation*, Oxford University Press, 1972.
- Russell, B., & Whitehead, A. N. (1910–1913). *Principia Mathematica* (3 vols.). Cambridge University Press.
- Hilbert, D., & Ackermann, W. (1928). *Grundzüge der theoretischen Logik*. Springer. The first textbook on modern formal logic.
- Gödel, K. (1931). "Über formal unentscheidbare Sätze der Principia Mathematica und verwandter Systeme I." *Monatshefte für Mathematik und Physik*, 38, 173–198.
- Bourbaki, N. (1939–). *Éléments de Mathématique*. Multiple volumes, Hermann & Masson.

### Secondary sources and history

- Kline, M. (1972). *Mathematical Thought from Ancient to Modern Times*. Oxford University Press. Three volumes covering the history of mathematics from antiquity through the mid-20th century. The standard reference.
- Grattan-Guinness, I. (2000). *The Search for Mathematical Roots, 1870–1940*. Princeton University Press. Covers the rigor revolution and Hilbert program in detail.
- Mancosu, P. (1996). *Philosophy of Mathematics and Mathematical Practice in the Seventeenth Century*. Oxford University Press.
- Ferreirós, J. (2007). *Labyrinth of Thought: A History of Set Theory and Its Role in Modern Mathematics* (2nd ed.). Birkhäuser.
- Stillwell, J. (2010). *Mathematics and Its History* (3rd ed.). Springer. More accessible than Kline.

### The formalization turn

- Aschbacher, M. (2004). "The Status of the Classification of the Finite Simple Groups." *Notices of the AMS*, 51(7), 736–740. Discusses the social and verification problems of very long classical proofs.
- Gonthier, G., et al. (2013). "A Machine-Checked Proof of the Odd Order Theorem." *Interactive Theorem Proving*, LNCS 7998, 163–179. The Feit-Thompson formalization paper.
- Hales, T. C., et al. (2017). "A Formal Proof of the Kepler Conjecture." *Forum of Mathematics, Pi*, 5, e2.
- Scholze, P. (2021). "Liquid Tensor Experiment." Blog post and Lean project. https://xenaproject.wordpress.com/2020/12/05/liquid-tensor-experiment/

### For Schwarz's students

- Velleman, D. J. (2019). *How to Prove It: A Structured Approach* (3rd ed.). Cambridge University Press. The single most popular textbook for the transition-to-proof course that Schwarz's deck introduces.
- Hammack, R. (2018). *Book of Proof* (3rd ed.). Open textbook, free at https://www.people.vcu.edu/~rhammack/BookOfProof/. An excellent free alternative to Velleman.
- Solow, D. (2013). *How to Read and Do Proofs* (6th ed.). Wiley. An older standard, focused on the "proof-reading" and "proof-construction" decomposition that Schwarz's deck echoes.

## Cross-references within this mission

- **Document 2** (`02-logic-and-language.md`) develops the formal logic that this document has only sketched.
- **Document 3** (`03-techniques-catalog.md`) presents the proof techniques whose *form* Schwarz introduces with two direct examples — direct, contrapositive, contradiction, cases, construction, induction, and more.
- **Document 6** (`06-formalization-and-modern.md`) picks up the story of computer-assisted and formalized proof where this document leaves off.
