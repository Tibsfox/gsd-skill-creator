# 02 — Logic and Language of Proof

> **Schwarz deck, slide 52** — *"A universal statement is a statement of the form: For all $x$, [some-property] holds for $x$. An existential statement is a statement of the form: There is some $x$ where [some-property] holds for $x$."*

Schwarz introduces universal and existential quantifiers with a single slide. This document expands that slide into the complete logical machinery that a mathematical proof relies on: propositional logic, predicate logic, quantifiers and their negation, natural-language translation, and the standard proof-shape patterns induced by each logical form.

## 1. Propositional logic

A **proposition** is a statement that is either true or false. "7 is prime" is a proposition. "The function $f$" is not — it is a name, not a statement. "Is 7 prime?" is not — it is a question.

Propositional logic studies how propositions combine. There are five standard connectives.

### 1.1 The five connectives

| Symbol | Name | English | Truth table |
|---|---|---|---|
| $\neg P$ | Negation | "not $P$", "it is not the case that $P$" | $\neg P$ is true iff $P$ is false. |
| $P \land Q$ | Conjunction | "$P$ and $Q$" | True iff both are true. |
| $P \lor Q$ | Disjunction | "$P$ or $Q$" (inclusive) | True iff at least one is true. |
| $P \implies Q$ | Implication | "if $P$ then $Q$", "$P$ implies $Q$" | False only when $P$ is true and $Q$ is false. |
| $P \iff Q$ | Biconditional | "$P$ if and only if $Q$" | True iff both have the same truth value. |

Full truth table:

| $P$ | $Q$ | $\neg P$ | $P \land Q$ | $P \lor Q$ | $P \implies Q$ | $P \iff Q$ |
|---|---|---|---|---|---|---|
| T | T | F | T | T | T | T |
| T | F | F | F | T | F | F |
| F | T | T | F | T | T | F |
| F | F | T | F | F | T | T |

The row that students find most counterintuitive is the third: when $P$ is false, $P \implies Q$ is *true* regardless of $Q$. "If the moon is made of cheese, then $2 + 2 = 5$" is technically true in classical logic. The intuition: an implication $P \implies Q$ is a *promise* that says "if $P$, then I guarantee $Q$"; the promise is only broken if $P$ happens and $Q$ doesn't. If $P$ never happens, the promise was never tested and is considered kept.

### 1.2 Why the weird truth table for implication matters

Schwarz's first proof template — "To prove a statement of the form 'if $P$, then $Q$', assume that $P$ is true, then show that $Q$ must be true as well" — is the natural-deduction rule for **implication introduction**, and it makes sense only because of the third row of the truth table. If $P$ is false, then $P \implies Q$ is automatically true, so you only need to check the case where $P$ is true. Under the assumption that $P$ holds, you derive $Q$. Done.

This is the rule in full form:

$$\frac{[P] \quad \vdots \quad Q}{P \implies Q} \quad (\text{implication introduction})$$

Read: "In a sub-derivation where $P$ is assumed, if you derive $Q$, then you have established $P \implies Q$ in the outer context."

Every **direct proof** Schwarz presents is an instance of this rule. "Let $n$ be an even integer" starts the sub-derivation under the assumption $P$ = "$n$ is even." The rest of the proof derives $Q$ = "$n^2$ is even" within that sub-derivation. The closing "therefore $n^2$ is even" discharges the assumption and produces the unconditional implication.

### 1.3 Logical equivalence and useful equivalences

Two propositions are **logically equivalent**, written $P \equiv Q$, if they have the same truth value under every assignment of truth values to their atomic variables. Proofs often depend on silently substituting equivalent forms.

**De Morgan's laws** — the most-used equivalences in proof writing:

$$\neg(P \land Q) \equiv \neg P \lor \neg Q$$
$$\neg(P \lor Q) \equiv \neg P \land \neg Q$$

**Implication rewrites** — five equivalent forms of the same implication:

$$P \implies Q$$
$$\equiv \neg P \lor Q$$
$$\equiv \neg Q \implies \neg P \quad \text{(contrapositive)}$$
$$\equiv \neg(P \land \neg Q)$$
$$\equiv (P \land \neg Q) \implies \bot$$

The second form ($\neg P \lor Q$) is how implication is usually defined inside propositional logic. The third is the basis of **proof by contrapositive** (document 3). The fifth is the basis of **proof by contradiction**.

**Double negation** — in classical logic:

$$\neg \neg P \equiv P$$

This equivalence holds in classical logic but *not* in intuitionistic logic. The rejection of double negation is what distinguishes constructive mathematics from classical mathematics; it will return in document 3 when we discuss proof by contradiction and its constructive status.

**Contraposition and conversion.** Students confuse these constantly. The **contrapositive** of $P \implies Q$ is $\neg Q \implies \neg P$, which is equivalent. The **converse** is $Q \implies P$, which is *not* equivalent. Example:

- Original: If $n$ is even, then $n^2$ is even. (True.)
- Contrapositive: If $n^2$ is odd, then $n$ is odd. (True, equivalent to original.)
- Converse: If $n^2$ is even, then $n$ is even. (Also true, but for a different reason — this is a separate theorem.)
- Inverse: If $n$ is odd, then $n^2$ is odd. (Also true, equivalent to the converse.)

### 1.4 Tautologies, contradictions, and satisfiability

- A **tautology** is a formula that is true under every truth assignment: $P \lor \neg P$, $(P \implies Q) \lor (Q \implies P)$.
- A **contradiction** is false under every assignment: $P \land \neg P$, $(P \implies Q) \land (P \land \neg Q)$.
- A formula is **satisfiable** if it is true under at least one assignment.

Every logically valid inference step in a proof corresponds to an implication that is a tautology. Checking the tautology is in principle what guarantees the step is valid.

## 2. Predicate logic

Propositional logic is not expressive enough for mathematics. "$n$ is even" is not a proposition until you know what $n$ is — it is a **predicate**, a statement schema with a free variable. Predicate logic adds:

- **Predicates** — $P(x)$, $Q(x, y)$, meaning "$x$ has property $P$," "$x$ and $y$ are in relation $Q$."
- **Constants** — specific names like $0$, $1$, $\pi$.
- **Functions** — $f(x, y)$, meaning "the result of applying $f$ to $x$ and $y$."
- **Variables** — $x$, $y$, $z$, standing for objects in the domain of discourse.
- **Quantifiers** — $\forall$ ("for all") and $\exists$ ("there exists").

A **first-order formula** is built from these using the propositional connectives plus quantifiers. Almost every theorem in ordinary mathematics can be written as a first-order formula over an appropriate domain.

### 2.1 The two quantifiers

$$\forall x \, P(x) \quad \text{means} \quad \text{"for every } x \text{ in the domain, } P(x) \text{ is true."}$$
$$\exists x \, P(x) \quad \text{means} \quad \text{"there is at least one } x \text{ in the domain such that } P(x) \text{ is true."}$$

The **domain of discourse** — what the variables range over — must be specified, either explicitly or by context. Without it, quantifiers are ambiguous. When Schwarz writes "For any odd integer $n$," the domain is the integers, and "odd integer $n$" is a restriction.

**Restricted quantifiers.** The common shorthand:

$$\forall x \in S \, P(x) \quad \text{abbreviates} \quad \forall x \, (x \in S \implies P(x))$$
$$\exists x \in S \, P(x) \quad \text{abbreviates} \quad \exists x \, (x \in S \land P(x))$$

Note the asymmetry: universal restriction is expressed with $\implies$, existential with $\land$. This matters for negation (next subsection).

### 2.2 Negating quantified statements

The single most-useful rule in predicate logic is **pushing negations through quantifiers**:

$$\neg \forall x \, P(x) \equiv \exists x \, \neg P(x)$$
$$\neg \exists x \, P(x) \equiv \forall x \, \neg P(x)$$

Read: "It is not the case that every $x$ satisfies $P$" is equivalent to "some $x$ does not satisfy $P$." And: "There is no $x$ satisfying $P$" is equivalent to "every $x$ fails $P$."

This is obvious in English but easy to mis-apply in formal statements with nested quantifiers. The general rule: to negate a formula, push the negation inward, flipping each quantifier ($\forall \leftrightarrow \exists$) as you go, and stop when you reach atomic predicates (which you negate directly).

**Example.** The $\varepsilon$-$\delta$ definition of continuity:

$$f \text{ is continuous at } a \iff \forall \varepsilon > 0 \, \exists \delta > 0 \, \forall x \, (|x - a| < \delta \implies |f(x) - f(a)| < \varepsilon)$$

Negation:

$$f \text{ is discontinuous at } a \iff \exists \varepsilon > 0 \, \forall \delta > 0 \, \exists x \, (|x - a| < \delta \land |f(x) - f(a)| \geq \varepsilon)$$

Every $\forall$ became $\exists$; every $\exists$ became $\forall$; the final atomic implication became a conjunction with negated consequent. A full first-year analysis course rests on being able to execute this transformation without making errors.

### 2.3 Free and bound variables, and the scope of quantifiers

In $\forall x \, P(x, y)$, the variable $x$ is **bound** (by $\forall$) and $y$ is **free**. Free variables are parameters; bound variables are internal machinery. Two formulas that differ only in the names of their bound variables are equivalent:

$$\forall x \, P(x, y) \equiv \forall z \, P(z, y).$$

This seems trivial but becomes important when quantifiers are nested or when substituting into formulas. A common mistake is **variable capture** — substituting an expression containing a variable that accidentally becomes bound by an enclosing quantifier. Proof assistants handle this automatically; humans do not.

### 2.4 Quantifier order matters

$\forall x \exists y \, P(x, y)$ and $\exists y \forall x \, P(x, y)$ are *different statements*. The first says every $x$ has some $y$ making $P(x, y)$ true, with $y$ possibly depending on $x$. The second says there is a single $y$ that works for every $x$. The second implies the first, but not conversely.

**Example.** Let $P(x, y)$ be "$y$ is the mother of $x$" over the domain of humans. Then $\forall x \exists y \, P(x, y)$ is true (every person has a mother), but $\exists y \forall x \, P(x, y)$ is false (there is no single person who is everyone's mother).

**Example from analysis.** Uniform continuity. A function $f$ is *continuous* on $[a, b]$ iff $\forall \varepsilon \forall x \exists \delta \ldots$. A function is *uniformly continuous* on $[a, b]$ iff $\forall \varepsilon \exists \delta \forall x \ldots$. The $\exists \delta$ moves out of the $\forall x$ scope — in uniform continuity, the same $\delta$ works for every $x$. On a closed interval, continuity implies uniform continuity (Heine-Cantor theorem), but this is a non-trivial fact; the general theorem is false.

## 3. Schwarz's proof templates, formally

Schwarz's deck introduces several proof patterns informally. Each corresponds to a specific natural-deduction rule. Making the correspondence explicit helps students see *why* the templates are the shapes they are.

### 3.1 "If $P$, then $Q$" → assume $P$, show $Q$

Natural-deduction rule: **implication introduction** (→I).

$$\frac{[P]^{(1)} \quad \vdots \quad Q}{P \implies Q}^{(1)}$$

**Schwarz example.** Slide 22: "If $n$ is an even integer, then $n^2$ is even."

**Proof shape:**

```
1. Let n be an even integer.           [assumption: P]
2. Since n is even, n = 2k for some k. [definition of even]
3. n² = (2k)² = 4k² = 2(2k²).          [algebra]
4. There is some m (namely 2k²) with n² = 2m.
5. Therefore n² is even.               [definition of even, Q]
6. QED.                                [discharge P, conclude P → Q]
```

### 3.2 "$P \land Q$" → show $P$, then show $Q$

Natural-deduction rule: **conjunction introduction** (∧I).

$$\frac{P \quad Q}{P \land Q}$$

Used silently whenever a theorem has a conjunction in its conclusion, e.g., "if $n$ is even, then $n^2$ is even *and* $n^2$ is nonnegative." Most proofs split such theorems into two sub-proofs.

### 3.3 "$P \lor Q$" → show either $P$ or $Q$ (but name which)

Natural-deduction rule: **disjunction introduction** (∨I).

$$\frac{P}{P \lor Q} \qquad \frac{Q}{P \lor Q}$$

**Classical theorem.** "Every integer is even or odd." Standard proof: take an integer $n$, use the division algorithm, either the remainder when $n$ is divided by 2 is 0 (case: $n$ is even) or it is 1 (case: $n$ is odd). In both cases the disjunction holds.

### 3.4 "If $P$, $Q$, or $R$, then $X$" → case analysis

Natural-deduction rule: **disjunction elimination** (∨E, "proof by cases").

$$\frac{P \lor Q \quad [P]^{(1)} \vdots X \quad [Q]^{(2)} \vdots X}{X}^{(1)(2)}$$

**Schwarz example.** Slide 108: The proof of $(A \cup C) \cap (B \cup C) \subseteq (A \cap B) \cup C$ splits on whether $x \in C$ or $x \notin C$. In Case 1, $x \in C$ immediately gives $x \in (A \cap B) \cup C$. In Case 2, $x \notin C$ forces $x \in A$ and $x \in B$, hence $x \in A \cap B$, hence $x \in (A \cap B) \cup C$. Both cases yield the conclusion.

### 3.5 "$\forall x \, P(x)$" → arbitrary $x$, show $P(x)$

Natural-deduction rule: **universal introduction** (∀I).

$$\frac{P(x) \text{ for arbitrary } x}{\forall x \, P(x)}$$

The critical word is *arbitrary*: you introduce a variable $x$ with no constraints beyond the theorem's hypotheses, and reason about $x$ without ever using any specific value. Schwarz's slide 30 makes this explicit: *"This is called making arbitrary choices. Rather than specifying what $m$ and $n$ are, we're signaling to the reader that they could, in principle, supply any choices of $m$ and $n$ that they'd like."*

**Common mistake.** Claiming "$\forall x \, P(x)$" from $P(x_0)$ for a specific $x_0$. This is invalid. Verifying the claim for a specific value is not a proof — you must reason about an arbitrary element.

### 3.6 "$\exists x \, P(x)$" → produce a witness

Natural-deduction rule: **existential introduction** (∃I).

$$\frac{P(t) \text{ for some term } t}{\exists x \, P(x)}$$

**Schwarz example.** Slide 48: "For any odd integer $n$, there exist integers $r$ and $s$ where $r^2 - s^2 = n$."

Standard proof: pick $n = 2k + 1$ (odd), then set $r = k + 1$ and $s = k$. Compute: $r^2 - s^2 = (k+1)^2 - k^2 = 2k + 1 = n$. The witnesses $r$ and $s$ are produced explicitly; the proof *constructs* them.

This is the **simplest approach** Schwarz names on slide 56: "Search far and wide, find an $x$ that has the right property, then show why your choice is correct." It is also the approach an intuitionist requires. Document 3 discusses the non-constructive alternatives.

### 3.7 "Assume $\forall x \, P(x)$" → instantiate at any $t$

Natural-deduction rule: **universal elimination** (∀E).

$$\frac{\forall x \, P(x)}{P(t)}$$

When you have a universal statement in your hypotheses, you can use it on any term $t$ you like. The most common place students use this: applying a known theorem. "By the Pythagorean theorem, $a^2 + b^2 = c^2$" is an instance of ∀E — the Pythagorean theorem is $\forall a, b, c \, (\text{right triangle with legs } a, b \text{ and hypotenuse } c \implies a^2 + b^2 = c^2)$, and you are applying it to the specific triangle in your proof.

### 3.8 "Assume $\exists x \, P(x)$" → introduce a name for the witness

Natural-deduction rule: **existential elimination** (∃E).

$$\frac{\exists x \, P(x) \quad [P(c)]^{(1)} \vdots Q}{Q}^{(1)}$$

where $c$ is a *fresh* variable not used elsewhere. In English: "Let $c$ be an element whose existence is guaranteed by the hypothesis. Then..." The variable $c$ stands for the witness, but you don't know which witness it is, so you can only use the property that the witness is guaranteed to have.

**Schwarz example.** Slide 25, the "$n$ is even" step: "Since $n$ is even, there is some integer $k$ such that $n = 2k$." The name $k$ is introduced for the unknown witness — we don't know *which* integer satisfies $n = 2k$, only that one exists. The rest of the proof uses $k$ without ever computing its value. This is ∃E in action.

## 4. Formal vs. informal proof

A fully formal proof is a sequence of formulas where each is either an axiom or derived from previous ones by a specific rule. A fully formal proof of even the simplest theorem (say, "$\forall n \, (n \text{ even} \implies n^2 \text{ even})$") in a classical first-order calculus is thousands of symbols long and utterly unreadable.

Working mathematicians do not write fully formal proofs. They write **informal proofs** in natural language, which tacitly rely on the existence of a formal proof "in principle." The informal proof is what humans can check; the formal proof is what a machine could check.

The relationship between the two is:

$$\text{informal proof} = \text{proof sketch}(\text{formal proof})$$

An informal proof is a compressed description of a formal proof. Steps the reader can easily fill in are omitted. Steps the reader cannot fill in must be made explicit. What "easily" means depends on the audience — a proof for undergraduates spells out more steps than a proof in a research paper.

### 4.1 The right level of formality

Too formal and the proof becomes unreadable. Too informal and the reader can't tell if each step is justified. The right level is the one where a *competent peer* in the intended audience can fill in the gaps without guessing. Schwarz's deck teaches the level appropriate for a transition-to-proof course: every step is spelled out, every definition is invoked explicitly, and the "mugga mugga test" ensures the prose is readable.

A research paper's proof is roughly two to five times more compressed than Schwarz's model proofs. A Bourbaki treatise is another two to five times more compressed than that. A proof assistant's proof is infinitely more verbose, because the machine has no intuition.

### 4.2 The hidden logic in informal proofs

Every well-written informal proof encodes a formal proof. The encoding conventions are stable enough that a skilled reader can usually reconstruct the formal proof in their head while reading. Some of the encodings:

| Informal phrase | Formal step |
|---|---|
| "Let $x$ be an element of $S$." | ∀I (introduce an arbitrary element) |
| "Suppose $P$." | Assumption for →I or ¬I |
| "By [theorem name], we have $Q$." | ∀E applied to a cited theorem |
| "Hence, $P$." | Modus ponens or other inference |
| "Since $\exists x \, P(x)$, let $a$ be such an $x$." | ∃E (introduce a name for the witness) |
| "To prove $P$, it suffices to show $Q$." | Replace goal by $Q$ (usually via an equivalence or implication) |
| "Without loss of generality, assume $P$." | ∨E with a symmetry argument (document 3) |
| "Conversely..." | Start the proof of the reverse direction of an iff |
| "Let $x$ be the least integer such that $P(x)$." | Well-ordering principle applied to $\{n : P(n)\}$ |

Every one of these informal phrases is a *shorthand for a specific logical step*. Learning to read proofs means learning to unpack the shorthands in real time.

## 5. Translating between English and logic

The hardest step in Schwarz's deck is implicit: turning an English statement into the logical form it actually asserts. Misreading the English leads to proving the wrong theorem.

### 5.1 Common English constructions and their logical form

| English | Logical form |
|---|---|
| "All $P$ are $Q$." | $\forall x \, (P(x) \implies Q(x))$ |
| "Every $P$ is a $Q$." | $\forall x \, (P(x) \implies Q(x))$ |
| "Only $P$s are $Q$s." | $\forall x \, (Q(x) \implies P(x))$ — note direction |
| "No $P$ is a $Q$." | $\forall x \, (P(x) \implies \neg Q(x))$ |
| "Some $P$ is a $Q$." | $\exists x \, (P(x) \land Q(x))$ |
| "$P$ unless $Q$." | $\neg Q \implies P$ (or equivalently $Q \lor P$) |
| "$P$ only if $Q$." | $P \implies Q$ |
| "$P$ if $Q$." | $Q \implies P$ — note direction |
| "$P$ if and only if $Q$." | $P \iff Q$ |
| "$P$ is necessary for $Q$." | $Q \implies P$ |
| "$P$ is sufficient for $Q$." | $P \implies Q$ |
| "$P$ unless $Q$, in which case $R$." | $(\neg Q \implies P) \land (Q \implies R)$ |

The "only if" / "if" trap catches almost every student. "$n$ is even only if $n^2$ is even" is $n \text{ even} \implies n^2 \text{ even}$. "$n$ is even if $n^2$ is even" is $n^2 \text{ even} \implies n \text{ even}$. They are logically distinct statements.

### 5.2 Implicit quantifiers

Many mathematical statements have implicit universal quantifiers. "The derivative of $x^2$ is $2x$" is really "$\forall x \, (\frac{d}{dx} x^2 = 2x)$." The convention is: if a variable appears in a statement without a quantifier binding it, and the statement is claimed as a theorem (not a definition or a hypothesis), it is implicitly universally quantified.

This matters when negating such statements. "The derivative of $f$ is not always continuous" is not "not (derivative of $f$ is continuous)" — it is "there exists a point where the derivative is not continuous." Pushing the negation through the implicit quantifier changes the meaning.

### 5.3 Ambiguity in everyday English

English is much less precise than logic. "If you eat your vegetables, you can have dessert" is usually understood to mean "if and only if," not just "if." "Or" in English sometimes means inclusive-or ("you can have tea or coffee — or both") and sometimes exclusive-or ("live or die"). Proof writing deliberately narrows the meanings:

- In mathematical English, "or" is always **inclusive**. If exclusive is meant, you must say "exactly one of" or "either $P$ or $Q$ but not both."
- In mathematical English, "if" is usually **exactly** "if" — the one-directional implication. If biconditional is meant, you must say "if and only if" or "iff."
- In mathematical English, "$P$ implies $Q$" is **not the same** as "$P$ causes $Q$." There is no notion of causation in mathematical logic.

## 6. Logical fallacies students actually commit

Every teacher of transition-to-proof courses has a list of common logical errors students make. Here are the most frequent, with the logical diagnosis.

### 6.1 Affirming the consequent

**Invalid pattern:** From $P \implies Q$ and $Q$, conclude $P$.

**Example.** "If $n$ is even, then $n^2$ is even. We have that $n^2$ is even. Therefore $n$ is even." This *happens* to produce a true conclusion, but the reasoning is invalid — you haven't used any property that rules out odd $n$ with even $n^2$, because there aren't any, but the reasoning doesn't establish that. The correct reasoning is the contrapositive or a direct argument via the definitions.

### 6.2 Denying the antecedent

**Invalid pattern:** From $P \implies Q$ and $\neg P$, conclude $\neg Q$.

**Example.** "If a function is differentiable, it is continuous. $f$ is not differentiable. Therefore $f$ is not continuous." False — $|x|$ is continuous at 0 but not differentiable there.

### 6.3 Converse confusion

Proving $P \implies Q$ and treating it as $Q \implies P$. The canonical example is the converse trap: proving "if $n$ is even, then $n^2$ is even" and concluding "if $n^2$ is even, then $n$ is even." The converse is also true in this case, but by a separate proof.

### 6.4 Quantifier scope errors

**Invalid pattern:** Switching $\forall$ and $\exists$ when one is nested inside the other.

**Example.** "Every real number has an additive inverse" is $\forall x \exists y \, (x + y = 0)$. A student writes "there is a real number that is the additive inverse of every real number," which is $\exists y \forall x \, (x + y = 0)$. The second is false. The order matters.

### 6.5 Proof by example

**Invalid pattern:** Checking a claim on a specific value and concluding it holds universally.

**Example.** "$2^2 - 2 = 2$ is even, $3^2 - 3 = 6$ is even, therefore $n^2 - n$ is even for all $n$." The conclusion happens to be true, but the reasoning is not a proof. A valid proof reasons about an arbitrary $n$: "Let $n$ be an integer. Then $n^2 - n = n(n - 1)$ is the product of consecutive integers, so one of them is even, so the product is even."

### 6.6 Assuming what you're trying to prove

**Invalid pattern:** Treating the goal as a hypothesis.

**Example.** "To prove that $n^2$ is even when $n$ is even, assume $n^2$ is even. Then there is an $m$ such that $n^2 = 2m$. Thus $n^2$ is even." Circular. The premise was assumed, not derived.

### 6.7 Proof by vigorous hand-waving

**Pattern:** Replacing a step with "clearly," "obviously," or "it is easy to see that..." when the step is not clear, not obvious, and not easy.

**Diagnosis.** These phrases are permitted in informal proofs only when the step genuinely is a routine consequence of what came before, within the reader's expected background. Using them to paper over a gap the writer cannot fill is the most common professional-level proof error. Editors and referees are trained to catch it.

## 7. The Curry-Howard correspondence — logic as types

This subsection is a peek ahead to document 6. In the 1930s–60s a deep connection was discovered between logical proof and typed computation. Known as the **Curry-Howard correspondence** (or *propositions-as-types*), it says:

| Logic | Type theory |
|---|---|
| Proposition | Type |
| Proof of $P$ | Term (program) of type $P$ |
| Implication $P \implies Q$ | Function type $P \to Q$ |
| Conjunction $P \land Q$ | Product type $P \times Q$ |
| Disjunction $P \lor Q$ | Sum type $P + Q$ |
| Universal $\forall x : A \, P(x)$ | Dependent function type $\prod_{x : A} P(x)$ |
| Existential $\exists x : A \, P(x)$ | Dependent pair type $\sum_{x : A} P(x)$ |
| Proof by modus ponens | Function application |
| Proof by assumption + discharge | Lambda abstraction |

This is not a metaphor — it is a precise mathematical correspondence. Every term in a sufficiently expressive type theory corresponds to a proof in the corresponding logic, and vice versa. Proof assistants like Coq, Lean, and Agda are built on this correspondence: when you prove a theorem in Lean, you are writing a program whose type is the theorem's statement, and the kernel checks that the program is well-typed.

The consequence for the question "what is a proof?" is profound. In the Curry-Howard view, a proof is not a sequence of formulas — it is a program. The act of proving is the act of programming. This is the point of view that document 6 will explore in detail.

## 8. Summary: the logical discipline of proof writing

Every well-written proof enforces, explicitly or implicitly, the following disciplines:

1. **Every statement is either a proposition or a predicate.** Ambiguous prose is rewritten until this is true.
2. **Every variable is quantified or named.** Free variables in a theorem statement are implicitly universally quantified.
3. **Every inference is an application of a specific rule.** The rule may be cited explicitly (in a formal proof) or left implicit (in an informal proof), but it must exist.
4. **Every definition is either cited or remembered.** The reader is assumed to know basic notation and common definitions but not unusual ones.
5. **Every use of a universal statement produces a specific instance.** The proof names the instance.
6. **Every use of an existential statement introduces a witness name.** The proof reasons about the witness using only the stated property.
7. **Every proof of a universal statement reasons about an arbitrary element.** The proof does not rely on properties of any particular element.
8. **Every proof of an existential statement produces a witness.** The witness may be constructed, named, or chosen from a known set, but it must be produced (in classical logic, this can be done non-constructively; in constructive logic, an actual construction is required).
9. **Every proof of an implication assumes the antecedent.** The proof derives the consequent from the assumption and discharges the assumption at the end.
10. **Every proof of a negation reaches a contradiction.** The standard form is: assume $P$, derive $\bot$ (a contradiction), conclude $\neg P$.

Schwarz's deck teaches disciplines 1, 4, 5, 6, 7, 8 (for existence), and 9 explicitly. This document has made disciplines 2, 3, 10 and the logical structure behind the others visible.

## 9. Further reading

### Logic textbooks at first-year graduate level

- Enderton, H. B. (2001). *A Mathematical Introduction to Logic* (2nd ed.). Academic Press. The standard American graduate textbook.
- Shoenfield, J. R. (2001). *Mathematical Logic*. Association for Symbolic Logic / A K Peters. Older and more austere; still a classic.
- van Dalen, D. (2013). *Logic and Structure* (5th ed.). Springer. Covers natural deduction carefully.
- Mendelson, E. (2015). *Introduction to Mathematical Logic* (6th ed.). Chapman & Hall/CRC.

### Natural deduction and Gentzen-style proof systems

- Gentzen, G. (1969). *The Collected Papers of Gerhard Gentzen* (ed. M. E. Szabo). North-Holland. The original source of natural deduction, sequent calculus, and cut elimination.
- Prawitz, D. (2006). *Natural Deduction: A Proof-Theoretical Study*. Dover (original 1965). Still the definitive monograph on natural deduction.

### Proof theory and the Curry-Howard correspondence

- Sørensen, M. H., & Urzyczyn, P. (2006). *Lectures on the Curry-Howard Isomorphism*. Elsevier. The standard reference, covers the correspondence in detail.
- Girard, J.-Y., Lafont, Y., & Taylor, P. (1989). *Proofs and Types*. Cambridge University Press. Free online. Dense but rewarding.
- Wadler, P. (2015). "Propositions as types." *Communications of the ACM*, 58(12), 75–84. A readable and widely cited introduction for computer scientists.

### For transition-to-proof students (complements Schwarz)

- Velleman, D. J. (2019). *How to Prove It: A Structured Approach* (3rd ed.). Cambridge University Press.
- Hammack, R. (2018). *Book of Proof* (3rd ed.). https://www.people.vcu.edu/~rhammack/BookOfProof/ Free online.
- Chartrand, G., Polimeni, A. D., & Zhang, P. (2017). *Mathematical Proofs: A Transition to Advanced Mathematics* (4th ed.). Pearson.

## Cross-references within this mission

- **Document 1** established the historical context for the modern proof convention.
- **Document 3** catalogs the proof techniques (direct, contrapositive, contradiction, cases, construction, induction, etc.) whose logical foundations are described in this document.
- **Document 5** treats the *craft* of turning logical form into readable mathematical English.
- **Document 6** develops the Curry-Howard correspondence at greater length and connects it to modern proof assistants.

---

## Study Guide — Logic and Language of Proof

### Prerequisites

- Comfort with basic algebra (variables, equations, substitution).
- Familiarity with truth tables is helpful but not required — section 1 teaches them from scratch.
- Reading document 1 first provides historical context but is not mandatory.

### Key vocabulary

| Term | Definition | Section |
|---|---|---|
| **Proposition** | A statement that is either true or false. | 1 |
| **Predicate** | A statement with free variables — becomes a proposition when the variables are bound or assigned values. | 2 |
| **Connective** | $\neg, \land, \lor, \implies, \iff$ — the five ways to combine propositions. | 1.1 |
| **Quantifier** | $\forall$ ("for all") and $\exists$ ("there exists") — bind free variables in predicates. | 2.1 |
| **Tautology** | A formula true under every truth assignment. | 1.4 |
| **Logical equivalence** | Two formulas have the same truth value under every assignment. | 1.3 |
| **Contrapositive** | $P \implies Q$ rewritten as $\neg Q \implies \neg P$ (equivalent). | 1.3 |
| **Converse** | $P \implies Q$ rewritten as $Q \implies P$ (NOT equivalent). | 1.3 |
| **Natural deduction** | A proof system whose rules match how informal proofs work: introduce and eliminate connectives. | 3 |
| **Curry-Howard correspondence** | The deep equivalence: propositions = types, proofs = programs. | 7 |
| **Free variable** | A variable not bound by any quantifier — acts as a parameter. | 2.3 |
| **Bound variable** | A variable captured by a quantifier — internal to a formula, can be renamed. | 2.3 |

### Reading order

1. Sections 1–1.4 (propositional logic) — build truth tables by hand until they're automatic.
2. Section 2 (predicate logic) — the jump from propositions to predicates is the hardest conceptual step. Take it slowly. Negating quantified statements (section 2.2) is the single most-used skill.
3. Section 3 (Schwarz's templates formalized) — read alongside the Schwarz deck slides 15–50.
4. Section 4 (formal vs. informal proof) — read once, then revisit after writing your first ten proofs.
5. Section 5 (English-to-logic translation) — use as a reference table whenever you're stuck translating a theorem statement.
6. Section 6 (fallacies) — study each fallacy with an example you construct yourself.
7. Section 7 (Curry-Howard) — read lightly on first pass; return to it after reading document 6.

### Study plans

**1-week sprint.** Master sections 1–2. Build every truth table in section 1.1 from memory. Negate 10 quantified statements (make up your own) using the rules of section 2.2. Translate 10 English sentences into formal logic using section 5.1's table.

**1-month deep dive.** Work through Velleman's *How to Prove It* chapters 1–3 (propositional logic, quantifiers, proofs involving connectives). For each Velleman exercise, identify which natural-deduction rule from section 3 the proof uses. Write a 2-page "cheat sheet" mapping English proof phrases to their logical rules (section 4.2 table, expanded with your own examples).

**6-month foundation.** Add Enderton's *A Mathematical Introduction to Logic* chapters 1–2 (propositional and predicate logic). Work through the completeness theorem for propositional logic (every tautology has a proof). Read Prawitz's *Natural Deduction* chapter 1 for the formal rules. Attempt to implement a simple propositional-logic tautology checker in Python or Lean.

---

## TRY Session — Negate a Quantified Statement

**Duration:** 15 minutes.
**Materials:** Pen and paper.

**Steps:**

1. Start with the $\varepsilon$-$\delta$ definition of continuity from section 2.2:
   $$f \text{ continuous at } a \iff \forall \varepsilon > 0\, \exists \delta > 0\, \forall x\, (|x - a| < \delta \implies |f(x) - f(a)| < \varepsilon)$$
2. Negate it by pushing $\neg$ inward: flip each quantifier ($\forall \leftrightarrow \exists$), and negate the innermost atomic statement.
3. Write out the result. It should be:
   $$f \text{ discontinuous at } a \iff \exists \varepsilon > 0\, \forall \delta > 0\, \exists x\, (|x - a| < \delta \land |f(x) - f(a)| \geq \varepsilon)$$
4. Read the negation aloud in English: "There is some tolerance $\varepsilon$ such that no matter how small we make $\delta$, there is always some $x$ within $\delta$ of $a$ whose function value is at least $\varepsilon$ away from $f(a)$."
5. Invent a function that is discontinuous at $a = 0$ and verify that the negation applies to it. (Example: $f(x) = 0$ for $x \leq 0$, $f(x) = 1$ for $x > 0$. Take $\varepsilon = 1/2$.)

**What to observe:** The negation process is *mechanical* — you don't need to understand the math to push the negation through. But reading the result in English verifies that the mechanics produced something meaningful.

---

## TRY Session — Spot the Fallacy

**Duration:** 15 minutes.
**Materials:** Pen and paper.

For each of the following "proofs," identify the logical fallacy from section 6.

1. "Theorem: If $n$ is even, then $n$ is divisible by 4. Proof: Let $n = 4$. Then $n$ is even, and $n/4 = 1$, so $n$ is divisible by 4." *(Fallacy: proof by example — does not generalize beyond $n = 4$.)*

2. "Theorem: $n^2$ is even implies $n$ is even. Proof: Assume $n$ is even. Then $n = 2k$, so $n^2 = 4k^2 = 2(2k^2)$ is even. Done." *(Fallacy: affirming the consequent — proved the converse, not the original.)*

3. "Theorem: Every continuous function is differentiable. Proof: Let $f(x) = x^2$. Then $f$ is continuous and $f'(x) = 2x$, so $f$ is differentiable." *(Fallacy: proof by example — one function doesn't establish the universal claim, and the claim is in fact false.)*

4. "Theorem: There is no largest prime. Proof: Suppose $p$ is the largest prime. Then $p + 1$ is not prime, so it has a prime factor $q$. Since $q$ divides $p + 1$ but not $p$... wait, actually $q$ could be $p + 1$ itself." *(Not actually a fallacy — this is a correct start to the standard proof. The student who wrote this stopped too early.)*

**What to observe:** Fallacies are not always obvious from the surface. The "proof by example" fallacy (items 1 and 3) is the most common student error. The "affirming the consequent" fallacy (item 2) is the most dangerous because it *produces a true result* for a wrong reason.

---

## DIY — Build a Truth-Table Verifier

**Scope:** 2–4 hours.
**Language:** Python, Lean 4, or any language with pattern matching.
**Deliverable:** A program that takes a propositional formula as input and evaluates it under all truth assignments, reporting whether it is a tautology, contradiction, or satisfiable.

**Specification:**

1. Parse formulas with atoms $p, q, r$ and connectives $\neg, \land, \lor, \implies, \iff$.
2. Enumerate all $2^n$ truth assignments for $n$ atoms.
3. Evaluate each assignment; print the truth table.
4. Report: tautology / contradiction / satisfiable.

**Test cases:**

- $p \lor \neg p$ → tautology.
- $p \land \neg p$ → contradiction.
- $(p \implies q) \implies (\neg q \implies \neg p)$ → tautology (contrapositive equivalence).
- $(p \implies q) \land p \land \neg q$ → contradiction (modus ponens check).
- $p \implies q$ → satisfiable but not a tautology.

**Stretch:** Extend to first-order formulas over a finite domain (e.g., $\{0, 1, 2\}$) — enumerate all interpretations and check quantified statements by brute force.

---

## DIY — Translate Schwarz's Proofs into Formal Natural Deduction

**Scope:** 3–5 hours.
**Materials:** Pen and paper (or a natural-deduction proof editor like Pandoc/Fitch).
**Deliverable:** Formal natural-deduction derivations for Schwarz's four proofs.

**Task:** Take each of the four proofs in the Schwarz deck and rewrite them as formal natural-deduction trees using the rules from section 3 (→I, ∧I, ∨I, ∨E, ∀I, ∀E, ∃I, ∃E). Each line of the tree should cite exactly one rule and name the lines it depends on.

Start with the simplest (n even → n² even) and work up to the set-distributive proof (which requires ∨E case analysis).

**What you learn:** The gap between an informal proof and its formal skeleton. You'll discover that the formal tree is much longer (10–20 lines for a 5-line prose proof) but that every step is unambiguous.

---

## College & Rosetta Deep Links

### Department connections

| College Department | Concept ID | Connection |
|---|---|---|
| **Logic** | `log-propositional-logic` | Section 1 is a complete treatment of this concept's scope |
| **Logic** | `log-predicate-logic` | Section 2 covers quantifiers, free/bound variables, scope, negation |
| **Logic** | `log-formal-proof-systems` | Sections 3–4 develop natural deduction as a formal proof system |
| **Logic** | `log-argument-structure` | Section 6 (fallacies) is the negative case — what happens when argument structure breaks |
| **Logic** | `log-causal-reasoning` | Section 1.2 note: "$P$ implies $Q$" is NOT causal — important distinction |
| **Logic** | `log-analogical-reasoning` | Section 6: reasoning by analogy vs. reasoning by logical structure |
| **Math** | `math-variables-unknowns` | Section 2.3 (free vs. bound variables) — the distinction between variables as parameters and variables as internal machinery |
| **Math** | `math-equations-expressions` | Section 2 — predicates as expressions, equations as propositions |
| **Math** | `math-functions` | Section 3.6–3.8 — function types in the Curry-Howard correspondence |
| **Writing** | writing-process | Section 4 — the discipline of writing proofs as prose |
| **Critical Thinking** | (reasoning skills) | Section 6 — the full fallacy catalog is a critical-thinking exercise |

### Rosetta panel routes

- **Python panel:** The DIY truth-table verifier is a direct Python exercise. Propositional logic evaluation maps cleanly to Python's `eval` or pattern-matching on ASTs.
- **Lisp panel:** Propositional formulas ARE S-expressions. `(implies (and p q) p)` is valid Lisp AND valid propositional logic. A Lisp panel could implement a tautology checker as a metacircular exercise.
- **ALGOL panel:** BNF grammar notation, invented in the ALGOL 60 report, is the same notation used for formal grammars of propositional and predicate logic. The connection is: formal language design IS logic.
- **Java panel:** Java's type system (generics, wildcards) is a limited dependent type theory. The Curry-Howard correspondence (section 7) explains why Java generics feel like logic.
- **Pascal panel:** Pascal's strong typing discipline was influenced by formal logic. The `if-then-else` in Pascal maps to case analysis (∨E) in natural deduction.
- **Lean 4 (future):** Section 7 (Curry-Howard) is the direct bridge. Every Lean proof IS a typed term.

### Cross-department threads

- **Logic → Mathematics:** Predicate logic is the language of all mathematical definitions. Every definition in the Mathematics department (`math-euler-formula`, `math-trig-functions`, etc.) is formally a predicate in first-order logic.
- **Logic → Coding → Technology:** Boolean algebra (propositional logic with $\{0, 1\}$) underlies digital circuits, programming conditionals, and database queries. This is the Logic → Coding → Electronics → Technology chain.
- **Logic → Philosophy → Theology:** The question "what can be proved?" connects to epistemology (what can be known?) and to theological arguments by logical structure (e.g., the ontological argument's formal structure). Section 3.3 (Gödel) connects to the philosophical limits of formal systems.

---

## Knowledge Gap Fills — Third Pass

### Resolution and the Prolog connection

Section 3 presents natural deduction as the proof system behind informal proofs. A major alternative — **resolution** — is absent. Resolution (Robinson, 1965) is a single inference rule: from clauses $C_1 \lor p$ and $C_2 \lor \neg p$, derive $C_1 \lor C_2$. A proof by resolution works by negating the goal, converting everything to clausal form (CNF), and deriving the empty clause (contradiction).

Resolution is important because:

1. **It is the foundation of logic programming.** Prolog programs ARE sets of Horn clauses, and Prolog execution IS SLD resolution — a restricted form of resolution that searches for refutations of the negated goal. See `docs/research/plg-research/language-semantics.md` section 4 for the complete account. Kowalski's "Algorithm = Logic + Control" (1979) is the philosophical manifesto: a Prolog program is simultaneously a logical specification and an executable algorithm.

2. **It is the basis of most automated theorem provers.** SAT solvers (DPLL, CDCL) are propositional resolution engines. SMT solvers extend them with theory-specific reasoning. These are the workhorses of hardware verification, software model checking, and the `omega` / `decide` tactics in Lean's automation layer.

3. **It completes the picture of proof methods.** Natural deduction is for humans. Resolution is for machines. Sequent calculus (Gentzen, 1934) is for proof theorists. All three prove the same theorems (completeness), but their internal structure differs, and the choice of system shapes what proofs look like.

### Boolean algebra and digital circuits

Section 1 treats propositional logic purely as a logical system. It is also the mathematical foundation of digital circuits: every combinational circuit is a Boolean function, every Boolean function has a truth table, and circuit optimization is equivalent to Boolean minimization (Karnaugh maps, Quine-McCluskey algorithm).

This connection matters because it makes propositional logic *tangible*. An AND gate IS conjunction. An OR gate IS disjunction. A NOT gate IS negation. De Morgan's laws (section 1.3) are circuit equivalences: $\neg(A \land B) \equiv \neg A \lor \neg B$ says a NAND gate equals an OR gate with inverted inputs.

The connection runs deeper: Claude Shannon's 1937 master's thesis — "A Symbolic Analysis of Relay and Switching Circuits," widely considered the most important master's thesis of the 20th century — showed that Boolean algebra could design and analyze switching circuits. This is the moment where Boole's abstract logic (1847) became engineering reality.

### Tarski's undefinability theorem

Section 3 of document 1 mentions Gödel's incompleteness but not Tarski's complementary result. Alfred Tarski (1933) proved that **truth in a formal language cannot be defined within that language**. More precisely: for any sufficiently powerful formal language $L$, there is no predicate $\text{True}(x)$ definable in $L$ such that for every sentence $\varphi$ of $L$, $\text{True}(\ulcorner \varphi \urcorner) \iff \varphi$.

The proof uses the same diagonal technique as Gödel and produces the Liar sentence: "This sentence is not true." If truth were definable, the Liar sentence would be both true and false — contradiction. Therefore truth is not definable.

Consequence for section 4 (formal vs. informal proof): the notion of "truth" that a working mathematician uses is *not the same* as "provability." Tarski's theorem says truth can't even be defined internally. This is why mathematicians work with provability (which is definable) and treat truth as a meta-level concept.

### Sequent calculus — the missing proof system

Natural deduction (section 3) is one proof system. Sequent calculus, invented by Gentzen simultaneously with natural deduction in 1934, is the other major system used in proof theory. A sequent $\Gamma \vdash \Delta$ reads "from the assumptions $\Gamma$, at least one of $\Delta$ holds." Each connective has a left rule (used when the connective appears in an assumption) and a right rule (used when it appears in the conclusion).

Sequent calculus matters because:

- **Cut elimination** (Gentzen's Hauptsatz): every proof in sequent calculus can be transformed into one that doesn't use the cut rule ($\Gamma \vdash A$ and $A, \Sigma \vdash \Delta$ implies $\Gamma, \Sigma \vdash \Delta$). Cut-free proofs have the *subformula property*: every formula in the proof is a subformula of the goal. This makes proof search tractable.
- **Proof search** in cut-free sequent calculus is the computational model behind type-checking in proof assistants. Lean's kernel is essentially a cut-free sequent calculus checker.

## Lessons Learned & Retrospectives — Third Pass

### The Prolog retrospective

Our `plg-research` project (4 files, Prolog history/language/applications/implementations) is the deepest existing treatment of logic-as-computation in our corpus. Key lesson: **Prolog makes the connection between logic and computation concrete in a way that no amount of abstract Curry-Howard exposition does.** A student who writes `append([], Ys, Ys). append([X|Xs], Ys, [X|Zs]) :- append(Xs, Ys, Zs).` and sees Prolog *compute* the result by *proving* the query has experienced the propositions-as-types correspondence without needing to know the theory.

Recommendation: pair document 2 with a Prolog exercise before teaching Curry-Howard (section 7). The concrete experience of "programming = proving" makes the abstract theory land faster.

### The ALGOL retrospective

Our `alg-research` project (4 files) covers BNF — the formal grammar notation invented for the ALGOL 60 report. The connection to this document: BNF is the computing world's answer to the question "how do we formally specify the syntax of a language?" — exactly the question Frege answered for logic in 1879. The ALGOL committee (Backus, Naur, et al.) were doing for programming languages what Frege did for logical languages: making the rules explicit, complete, and unambiguous. See `docs/research/alg-research/bnf-cfg.md` (38 proof/logic/formal mentions) for the full treatment.

### Session enrichment retrospective

Across Sessions 017–019 (research enrichment missions), the most effective Study Guide sections shared three features: (a) tiered study plans with named resources, (b) a glossary table anchored to section numbers, (c) actionable verbs ("prove X," "read Y," "implement Z") rather than passive reading instructions. This document's study guide (from the second pass) follows that pattern. The third pass adds the missing corpus links that make the study plans *navigable* within our own knowledge base.

## Deep Corpus Links — Third Pass

### Research corpus cross-references

| Section | Target | Connection |
|---|---|---|
| 1.1 (truth tables) | `docs/research/plg-research/language-semantics.md` §4 | SLD resolution is the automated proof-search counterpart to truth-table evaluation |
| 1.3 (De Morgan, equivalences) | `docs/research/alg-research/bnf-cfg.md` | BNF grammar transformations (left-factoring, elimination of left recursion) are syntactic analogues of logical equivalence transformations |
| 2 (predicate logic) | `docs/research/plg-research/language-semantics.md` §1–3 | Prolog terms, unification, and resolution are predicate logic made executable |
| 3 (natural deduction rules) | `docs/research/lsp-research/history-philosophy.md` §1 | Church's lambda calculus is the computational side of natural deduction (Curry-Howard). The Lisp history doc covers Church's Princeton work |
| 5 (English-to-logic) | `docs/research/research-methodology/writing-papers.md` | Translating between natural language and formal claims is a core research writing skill |
| 6 (fallacies) | `docs/research/research-methodology/bias-and-pitfalls.md` | Logical fallacies in proofs parallel cognitive biases in research — both are systematic reasoning errors |
| 7 (Curry-Howard) | `docs/research/rst-research/language-ownership.md` | Rust's ownership = affine logic types. Every borrow-checker pass is a proof of memory safety via the Curry-Howard correspondence applied to linear/affine type theory |
| 7 (Curry-Howard) | `docs/research/jts-research/language-types.md` | TypeScript's structural type system is a weak proof system — assignability checking IS propositional proof checking |

### Live site pages

| Section | Page | Connection |
|---|---|---|
| 2 (predicate logic) | `Research/PLG/language.html` | Prolog's syntax IS predicate logic syntax |
| 1 (propositional logic) | `Research/ALG/history.html` | BNF = formal grammar = formal language specification |
| 7 (Curry-Howard) | `Research/LSP/history.html` | Lambda calculus = the computational realization of natural deduction |
| 7 (Curry-Howard) | `Research/RST/learn.html` | Rust type system = affine logic |
| 6 (fallacies) | `Research/RCA/classical-methods.html` | Card's 2017 critique of 5 Whys identifies the same logical fallacy (single-pathway forcing) that section 6 calls "proof by example" |

### College concept deepening

| Concept ID | Third-pass extension |
|---|---|
| `log-propositional-logic` | Now connects to Boolean algebra → Shannon 1937 → digital circuits. The propositional concept encompasses both pure logic AND applied engineering |
| `log-predicate-logic` | Now connects to Prolog (SLD resolution) as the computational realization, and to Tarski's undefinability as the theoretical limit |
| `log-formal-proof-systems` | Now includes resolution, sequent calculus, and natural deduction as three equivalent but structurally different proof systems — a Rosetta Stone within logic itself |
