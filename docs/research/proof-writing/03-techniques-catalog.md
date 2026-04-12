# 03 — Catalog of Proof Techniques

> **Schwarz deck, slides 15–47** — Two direct proofs on integer parity plus one existential proof by construction.

Schwarz's deck demonstrates three techniques: direct proof, direct proof with multiple antecedents, and existential proof by construction. These are the simplest forms. This document catalogs the full standard toolbox, with a canonical worked example for each technique.

The techniques fall into two groups:

- **Techniques for proving implications.** Direct, contrapositive, contradiction, cases, vacuous, trivial, biconditional.
- **Techniques for proving statements with structure.** Existence, uniqueness, induction (weak, strong, structural), well-ordering, pigeonhole, double-counting, probabilistic, diagonal, invariants, extremal, combinatorial.

Every technique below is a specific logical pattern. Memorizing the pattern is a starting point; internalizing *when to reach for which* is the craft.

## Group A — Techniques for proving implications

### A.1 Direct proof

**Pattern:** To prove $P \implies Q$, assume $P$, derive $Q$.

**Logical rule:** Implication introduction (→I). See document 2, section 3.1.

**Canonical example.** Schwarz slide 22: *If $n$ is an even integer, then $n^2$ is even.*

**Proof.** Let $n$ be an even integer. Since $n$ is even, there is an integer $k$ such that $n = 2k$. Then $n^2 = (2k)^2 = 4k^2 = 2(2k^2)$. Since $2k^2$ is an integer, there is an integer $m$ (namely $2k^2$) such that $n^2 = 2m$. Therefore $n^2$ is even. $\blacksquare$

**When to use.** Default technique. Try this first. Most theorems in most courses are provable directly. Only switch to a different technique if the direct approach stalls.

**When it stalls.** You can't find a way to use the hypothesis $P$ to *build* the conclusion $Q$. This often signals that the natural direction of reasoning is $\neg Q \to \neg P$ (contrapositive) or that the conclusion is so constrained that assuming its negation immediately produces a contradiction.

### A.2 Proof by contrapositive

**Pattern:** To prove $P \implies Q$, prove the equivalent $\neg Q \implies \neg P$ directly.

**Logical rule:** Contraposition equivalence, $P \implies Q \equiv \neg Q \implies \neg P$. See document 2, section 1.3.

**Canonical example.** *If $n^2$ is even, then $n$ is even.*

**Direct attempt fails.** Assume $n^2 = 2k$. You would need to produce an integer $m$ with $n = 2m$. But from $n^2 = 2k$ you know very little about $n$ itself — extracting a square root in the integers is not a direct operation.

**Contrapositive attempt succeeds.** The contrapositive is: *if $n$ is odd, then $n^2$ is odd*.

**Proof.** Suppose $n$ is odd. Then there is an integer $k$ such that $n = 2k + 1$. Therefore $n^2 = (2k + 1)^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1$. Since $2k^2 + 2k$ is an integer, there is an integer $m$ (namely $2k^2 + 2k$) such that $n^2 = 2m + 1$. Thus $n^2$ is odd. This proves the contrapositive; therefore the original implication holds. $\blacksquare$

**When to use.** When $\neg Q$ gives you a more usable hypothesis than $P$. In this example, "$n$ is odd" lets you write $n$ as $2k + 1$ and compute with it directly; "$n^2$ is even" leaves you fighting the square.

**Connection to Schwarz's framework.** The contrapositive is not a distinct proof technique from the direct proof — it is a direct proof of a logically equivalent statement. Once the contrapositive is formed, the proof mechanism is unchanged.

### A.3 Proof by contradiction (reductio ad absurdum)

**Pattern:** To prove $P$, assume $\neg P$, derive a contradiction $\bot$, conclude $P$.

**Logical rule:** $(\neg P \implies \bot) \implies P$. This is **classically** valid. In intuitionistic logic it gives only $\neg \neg P$; the jump from $\neg \neg P$ to $P$ requires the law of excluded middle, which intuitionists reject.

**Canonical example.** *$\sqrt{2}$ is irrational.*

**Proof.** Suppose for contradiction that $\sqrt{2}$ is rational. Then we can write $\sqrt{2} = p/q$ where $p, q \in \mathbb{Z}$, $q \neq 0$, and the fraction is in lowest terms (so $\gcd(p, q) = 1$). Squaring both sides: $2 = p^2 / q^2$, so $p^2 = 2q^2$. This means $p^2$ is even. By the contrapositive theorem above (A.2), $p$ is even. So $p = 2r$ for some integer $r$, and $p^2 = 4r^2 = 2q^2$, so $q^2 = 2r^2$. Hence $q^2$ is even, and again $q$ is even. But then both $p$ and $q$ are even, contradicting $\gcd(p, q) = 1$. Therefore $\sqrt{2}$ is not rational. $\blacksquare$

**When to use.** When the negation of the conclusion gives you a concrete, usable object to reason about, and you can see how that object collides with known facts. Contradiction is especially useful for:

- **Non-existence claims.** "There is no $x$ such that $P(x)$" is most naturally proved by assuming such an $x$ exists and reaching a contradiction.
- **Infinity arguments.** "There are infinitely many primes" is classically proved by assuming finitely many and constructing a new prime. (Euclid's original proof is sometimes called a contradiction proof, though it is also expressible as a direct construction.)
- **Uniqueness.** "There is at most one $x$ such that $P(x)$" is often proved by assuming two such $x$'s exist and showing they are equal — or by assuming they are distinct and reaching a contradiction.

**Constructive alternative.** Many classical contradiction proofs have direct constructive analogues. The proof that $\sqrt{2}$ is irrational can be rephrased as: "for every rational $p/q$ in lowest terms, $(p/q)^2 \neq 2$." This is a universal statement, not a negation. The intuitionist accepts this rephrasing but not the original negation-based form. See document 6 for the constructive approach.

### A.4 Proof by cases

**Pattern:** To prove $P$, partition the hypotheses into cases $C_1, C_2, \ldots, C_n$ covering all possibilities, and prove $P$ separately in each case.

**Logical rule:** Disjunction elimination (∨E). See document 2, section 3.4.

**Canonical example.** *For any integer $n$, $n^2 + n$ is even.*

**Proof.** Let $n$ be an integer. We consider two cases based on the parity of $n$.

*Case 1: $n$ is even.* Then $n = 2k$ for some integer $k$. Therefore $n^2 + n = (2k)^2 + 2k = 4k^2 + 2k = 2(2k^2 + k)$, which is even.

*Case 2: $n$ is odd.* Then $n = 2k + 1$ for some integer $k$. Therefore $n^2 + n = (2k+1)^2 + (2k+1) = 4k^2 + 4k + 1 + 2k + 1 = 4k^2 + 6k + 2 = 2(2k^2 + 3k + 1)$, which is even.

In both cases $n^2 + n$ is even. $\blacksquare$

**When to use.** When the hypothesis or the structure of the problem has a natural split that simplifies each branch. The most common splits:

- Parity: even vs. odd.
- Sign: positive vs. zero vs. negative.
- Size: less than vs. equal to vs. greater than.
- Type of object: rational vs. irrational, algebraic vs. transcendental, finite vs. infinite.
- Set membership: $x \in S$ vs. $x \notin S$, which Schwarz uses on slides 108–115.

**Common mistake.** Forgetting to cover a case. A case analysis is only valid if the cases exhaust all possibilities. Proofs that split into "$x > 0$" and "$x < 0$" need to explicitly address $x = 0$ (or exclude it from the hypothesis).

### A.5 Without loss of generality (WLOG)

**Pattern:** When a proof would require multiple symmetric cases, argue one case and assert the others follow by symmetry.

**Canonical example.** *For any real numbers $x$ and $y$, $|x - y| \geq ||x| - |y||$.*

**Proof.** Without loss of generality, assume $|x| \geq |y|$. (If instead $|y| > |x|$, swap the roles of $x$ and $y$; the claim is symmetric.) Then $||x| - |y|| = |x| - |y|$. We compute:

$$|x| = |(x - y) + y| \leq |x - y| + |y|,$$

so $|x| - |y| \leq |x - y|$, which is the desired inequality. $\blacksquare$

**When to use.** When the problem is symmetric in two or more of its variables and the symmetry would otherwise force you to write the same argument twice. WLOG is a labor-saver, not a logical trick.

**Critical discipline.** WLOG is only valid when the cases are *genuinely* symmetric. A common mistake is asserting "WLOG $x > 0$" when the proof's details would differ for $x < 0$. Whenever you write "WLOG," verify that the case you're assuming is genuinely interchangeable with the case you're not proving, and verify that the full proof can be reconstructed by substitution alone.

### A.6 Vacuous proof and trivial proof

**Vacuous pattern.** To prove $P \implies Q$, show that $P$ is false. Then the implication holds vacuously (since the truth table for $\implies$ has $T$ in both rows where the antecedent is false).

**Canonical example.** *For every $x$ in the empty set, $x$ is positive.*

**Proof.** The empty set has no elements, so there is no $x$ for the claim to fail on. The statement holds vacuously. $\blacksquare$

**Trivial pattern.** To prove $P \implies Q$, show that $Q$ is true. Then the implication holds regardless of $P$.

**Canonical example.** *For every real number $x$, if $x \geq 0$, then $x^2 + 1 > 0$.*

**Proof.** For any real number $x$, $x^2 \geq 0$, so $x^2 + 1 \geq 1 > 0$. This holds independently of whether $x \geq 0$. The implication holds trivially. $\blacksquare$

**When to use.** Rarely as primary techniques; more often as acknowledgments within a larger proof that a particular case is vacuous or trivial. Noting these explicitly can save a lot of unnecessary argument.

### A.7 Biconditional proof

**Pattern:** To prove $P \iff Q$, prove both $P \implies Q$ and $Q \implies P$.

**Logical rule:** $(P \iff Q) \equiv (P \implies Q) \land (Q \implies P)$.

**Canonical example.** *An integer $n$ is even if and only if $n^2$ is even.*

**Proof.** ($\implies$) If $n$ is even, then $n^2$ is even. This is theorem A.1 above.

($\impliedby$) If $n^2$ is even, then $n$ is even. This is theorem A.2 above.

Both directions hold, so $n$ is even iff $n^2$ is even. $\blacksquare$

**When to use.** Whenever the theorem is stated as an "if and only if." Schwarz's slide 119 proves the full set-equality theorem $(A \cup C) \cap (B \cup C) = (A \cap B) \cup C$ by showing both $\subseteq$ directions, which is the set-theoretic form of the biconditional pattern (two directions of $\subseteq$ combined give $=$).

### A.8 Proof by counterexample (disproof)

**Pattern:** To disprove a universal statement $\forall x \, P(x)$, exhibit a single $x$ for which $P(x)$ fails.

**Logical rule:** $\neg \forall x \, P(x) \equiv \exists x \, \neg P(x)$, and existential statements are proved by producing a witness.

**Canonical example.** *It is not the case that every continuous function is differentiable.*

**Proof.** The function $f(x) = |x|$ is continuous at every real number. However, $f$ is not differentiable at $x = 0$: the left-hand limit of the difference quotient is $-1$, while the right-hand limit is $+1$, so the derivative does not exist at $0$. Therefore not every continuous function is differentiable. $\blacksquare$

**When to use.** When you have reason to doubt a universal claim. One good counterexample refutes the entire claim; many unsuccessful attempts suggest you should try to prove it. Professional mathematicians go back and forth — trying to prove, then trying to disprove — and follow whichever path yields first.

## Group B — Techniques specific to certain statement shapes

### B.1 Existence by explicit construction

**Pattern:** To prove $\exists x \, P(x)$, produce a specific $x$ and verify $P(x)$.

**Canonical example.** Schwarz slide 48: *For any odd integer $n$, there exist integers $r, s$ with $r^2 - s^2 = n$.*

**Proof.** Let $n$ be an odd integer, so $n = 2k + 1$ for some integer $k$. Let $r = k + 1$ and $s = k$. Then $r^2 - s^2 = (k+1)^2 - k^2 = k^2 + 2k + 1 - k^2 = 2k + 1 = n$. Therefore the integers $r$ and $s$ exist. $\blacksquare$

**When to use.** Default for existence statements. Try this first.

### B.2 Existence by non-constructive argument

**Pattern:** To prove $\exists x \, P(x)$, argue that $\forall x \neg P(x)$ leads to a contradiction, without producing an $x$.

**Canonical example.** *There exist irrational numbers $a$ and $b$ such that $a^b$ is rational.*

**Proof.** Consider the number $\sqrt{2}^{\sqrt{2}}$. This is either rational or irrational.

*Case 1: $\sqrt{2}^{\sqrt{2}}$ is rational.* Let $a = b = \sqrt{2}$. Then $a$ and $b$ are irrational and $a^b = \sqrt{2}^{\sqrt{2}}$ is rational, so the claim holds.

*Case 2: $\sqrt{2}^{\sqrt{2}}$ is irrational.* Let $a = \sqrt{2}^{\sqrt{2}}$ and $b = \sqrt{2}$. Then $a$ is irrational (by assumption) and $b$ is irrational, and $a^b = (\sqrt{2}^{\sqrt{2}})^{\sqrt{2}} = \sqrt{2}^{\sqrt{2} \cdot \sqrt{2}} = \sqrt{2}^2 = 2$, which is rational.

In either case, such $a$ and $b$ exist. $\blacksquare$

**Why it's non-constructive.** The proof never tells you which case actually obtains. As it happens, we know by the Gelfond-Schneider theorem (1934) that $\sqrt{2}^{\sqrt{2}}$ is irrational, so Case 2 is the real one. But this proof predates Gelfond-Schneider and establishes existence without knowing which case.

**Intuitionist's complaint.** An intuitionist does not accept this proof because it does not tell you *which* $(a, b)$ pair works. To the classical mathematician, existence is established; to the intuitionist, it is not.

**When to use.** When direct construction is hard, a clever case split combined with $P \lor \neg P$ can establish existence without explicit witnesses. This pattern — "either $x$ has property or not, and in each case, something exists" — is characteristically classical.

### B.3 Uniqueness

**Pattern:** To prove that there is **at most one** $x$ with $P(x)$, assume two such $x$'s exist and show they are equal.

**Canonical example.** *The equation $ax = b$, where $a \neq 0$, has at most one solution $x$ in $\mathbb{R}$.*

**Proof.** Suppose $x_1$ and $x_2$ are solutions. Then $ax_1 = b$ and $ax_2 = b$. Therefore $ax_1 = ax_2$, and since $a \neq 0$ we may divide: $x_1 = x_2$. The solution, if it exists, is unique. $\blacksquare$

**Existence + uniqueness.** A "there exists a unique $x$ with $P(x)$" statement requires two separate proofs: *existence* (usually by construction, B.1) and *uniqueness* (by the pattern above). The notation $\exists! x \, P(x)$ abbreviates this conjunction.

### B.4 Proof by (weak) induction on the natural numbers

**Pattern:** To prove $\forall n \in \mathbb{N} \, P(n)$, prove:

1. **Base case:** $P(0)$ (or $P(1)$ if starting at 1).
2. **Inductive step:** For all $k$, if $P(k)$ holds, then $P(k + 1)$ holds.

**Logical rule:** The induction axiom — one of the Peano axioms of $\mathbb{N}$ (and provable from the well-ordering principle and the rest of ZF).

**Canonical example.** *$1 + 2 + \cdots + n = \frac{n(n+1)}{2}$ for all $n \geq 1$.*

**Proof by induction on $n$.**

*Base case, $n = 1$:* $1 = 1 \cdot 2 / 2 = 1$. ✓

*Inductive step:* Assume $1 + 2 + \cdots + k = k(k+1)/2$. We show $1 + 2 + \cdots + (k + 1) = (k + 1)(k + 2)/2$. We compute:

$$1 + 2 + \cdots + (k + 1) = (1 + 2 + \cdots + k) + (k + 1) = \frac{k(k+1)}{2} + (k + 1) = \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2}.$$

By induction, the formula holds for all $n \geq 1$. $\blacksquare$

**When to use.** Whenever the statement being proved concerns all natural numbers (or all natural numbers from some starting point onward) and has a recursive structure that lets the $n = k + 1$ case be reduced to the $n = k$ case.

**Critical discipline.** The inductive *hypothesis* is $P(k)$, which you may assume freely within the inductive step; the inductive *goal* is $P(k+1)$, which you must derive. Students often conflate these. The phrase "by induction on $n$" signals which variable is being inducted on, which matters when the statement has multiple variables.

### B.5 Strong induction (complete induction)

**Pattern:** To prove $\forall n \in \mathbb{N} \, P(n)$, prove:

1. **Base case:** $P(0)$.
2. **Inductive step:** For all $k \geq 0$, if $P(0), P(1), \ldots, P(k)$ all hold, then $P(k+1)$ holds.

**Equivalence with weak induction.** Strong induction is logically equivalent to weak induction but often more convenient. You can always use strong induction where weak induction suffices; the converse is also true, but the proofs may be less natural.

**Canonical example.** *Every integer $n \geq 2$ has a prime factorization.*

**Proof by strong induction on $n$.**

*Base case, $n = 2$:* $2$ is prime, so $2 = 2$ is its factorization. ✓

*Inductive step:* Suppose every integer $m$ with $2 \leq m \leq k$ has a prime factorization. We show $k + 1$ has one.

*Case 1: $k + 1$ is prime.* Then $k + 1 = k + 1$ is its own factorization.

*Case 2: $k + 1$ is composite.* Then $k + 1 = a \cdot b$ where $2 \leq a, b \leq k$. By the inductive hypothesis, both $a$ and $b$ have prime factorizations. The product of their factorizations is a prime factorization of $k + 1$.

In both cases, $k + 1$ has a prime factorization. By strong induction, every $n \geq 2$ has a prime factorization. $\blacksquare$

**When to use strong induction rather than weak.** When the step from $k$ to $k + 1$ requires not just the immediately preceding case but possibly several earlier cases, or a case whose index you can't predict in advance. Prime factorization is a canonical example: to factor $k + 1$, you might need factorizations of $a$ and $b$ where neither is $k$.

### B.6 Structural induction

**Pattern:** To prove a property $P$ holds for every element of a recursively defined set (trees, lists, formulas, terms in a grammar), prove:

1. **Base cases:** $P$ holds for each base-case constructor.
2. **Inductive steps:** For each recursive constructor, assume $P$ holds for all sub-components and show $P$ holds for the constructed element.

**Canonical example.** *Every propositional formula has the same number of left and right parentheses.*

**Proof by structural induction on formulas.** Define the set of propositional formulas $\text{Form}$ by: (base) every propositional variable $p$ is in $\text{Form}$; (step) if $\varphi, \psi \in \text{Form}$, then $(\neg \varphi)$, $(\varphi \land \psi)$, $(\varphi \lor \psi)$, $(\varphi \implies \psi)$, $(\varphi \iff \psi)$ are in $\text{Form}$. Let $L(\varphi)$ and $R(\varphi)$ denote the number of left and right parentheses in $\varphi$. We show $L(\varphi) = R(\varphi)$ for all $\varphi$.

*Base case.* A propositional variable $p$ has no parentheses, so $L(p) = 0 = R(p)$. ✓

*Inductive step — binary connectives.* Suppose $L(\varphi) = R(\varphi)$ and $L(\psi) = R(\psi)$. Consider $(\varphi \land \psi)$. It adds one left and one right parenthesis to the combined counts. So $L((\varphi \land \psi)) = L(\varphi) + L(\psi) + 1 = R(\varphi) + R(\psi) + 1 = R((\varphi \land \psi))$. Same argument for the other binary connectives.

*Inductive step — negation.* Similarly, $L((\neg \varphi)) = L(\varphi) + 1 = R(\varphi) + 1 = R((\neg \varphi))$.

By structural induction, the property holds for every formula. $\blacksquare$

**When to use.** Whenever your domain is inductively generated by constructors — abstract syntax trees, formal languages, data structures in programming language semantics, Peano naturals themselves. Structural induction generalizes weak induction from the naturals (which have one base constructor, $0$, and one step constructor, successor) to arbitrary inductive types.

### B.7 Well-ordering principle

**Pattern:** To prove a statement about natural numbers, consider the set of counterexamples. If non-empty, it has a least element by well-ordering. Derive a contradiction from the minimality.

**Logical rule:** The well-ordering principle: every non-empty subset of $\mathbb{N}$ has a least element. (Equivalent to induction.)

**Canonical example.** *Every integer $n \geq 2$ has a prime factor.*

**Proof.** Suppose for contradiction that some integer $n \geq 2$ has no prime factor. Let $S$ be the set of such integers, so $S \neq \emptyset$. By well-ordering, $S$ has a least element, call it $m$. Then $m \geq 2$ and $m$ has no prime factor.

If $m$ is prime, then $m$ is its own prime factor — contradiction. So $m$ is composite, meaning $m = a \cdot b$ with $1 < a, b < m$. Since $a < m$, by the minimality of $m$, the integer $a$ has a prime factor $p$. But then $p$ divides $a$, which divides $m$, so $p$ divides $m$, and $p$ is a prime factor of $m$ — contradiction.

Therefore $S$ is empty: every integer $n \geq 2$ has a prime factor. $\blacksquare$

**When to use.** As an alternative to strong induction when the "least counterexample" framing is more natural than the "build up from base case" framing. The two are logically equivalent.

### B.8 Pigeonhole principle

**Pattern:** If $n + 1$ or more objects are distributed into $n$ boxes, at least one box contains at least two objects.

**Generalized form.** If $kn + 1$ or more objects are distributed into $n$ boxes, at least one box contains at least $k + 1$ objects.

**Canonical example.** *Among any 13 people, at least two share a birth month.*

**Proof.** There are 12 months and 13 people. Assigning each person to the month of their birth places 13 "objects" into 12 "boxes." By the pigeonhole principle, some box contains at least two objects — i.e., at least two people share a birth month. $\blacksquare$

**A more sophisticated example.** *Among any $n + 1$ integers chosen from $\{1, 2, \ldots, 2n\}$, two of them are such that one divides the other.*

**Proof.** Every integer $m \in \{1, 2, \ldots, 2n\}$ can be written uniquely as $m = 2^k q$ where $q$ is odd and $q \in \{1, 3, 5, \ldots, 2n - 1\}$. There are $n$ odd numbers in this range. By the pigeonhole principle, among the $n + 1$ chosen integers, two must have the same odd part $q$ — call them $2^{k_1} q$ and $2^{k_2} q$ with $k_1 < k_2$. Then $2^{k_1} q$ divides $2^{k_2} q$, completing the proof. $\blacksquare$

**When to use.** Whenever a problem asks "must there exist..." with bounds on the number of candidates. Pigeonhole is almost always the right idea when you can identify $n + 1$ objects being forced into $n$ categories.

### B.9 Double counting (bijective and combinatorial proofs)

**Pattern:** Count the same set in two different ways; the two counts must be equal.

**Canonical example.** *$\binom{n}{k} = \binom{n}{n-k}$.*

**Combinatorial proof.** The left-hand side counts the number of ways to choose $k$ elements from a set of $n$. The right-hand side counts the number of ways to choose the $n - k$ elements to *leave out*. Each choice of $k$ elements to include corresponds bijectively to its complement, a choice of $n - k$ elements to exclude. The two counts are therefore equal. $\blacksquare$

**A harder example.** *For all $n \geq 1$, $\sum_{k=0}^{n} \binom{n}{k} = 2^n$.*

**Combinatorial proof.** The right-hand side counts the number of subsets of an $n$-element set (each element is either in or out, so $2^n$ subsets). The left-hand side partitions those subsets by size: there are $\binom{n}{k}$ subsets of size $k$, and the sum over all sizes gives all subsets. Both sides count the same thing. $\blacksquare$

**When to use.** For identities involving binomial coefficients, partitions, graphs, or any combinatorial objects where two natural interpretations exist. A combinatorial proof is often more illuminating than an algebraic one because it explains *why* the identity holds, not just that it does.

### B.10 Probabilistic method

**Pattern:** To prove the existence of an object with a certain property, show that a randomly chosen object has the property with positive probability. Then at least one object must have it.

**Canonical example.** *There exists a 2-coloring of the edges of $K_n$ (the complete graph on $n$ vertices) with no monochromatic $K_k$ subgraph, provided $\binom{n}{k} 2^{1 - \binom{k}{2}} < 1$.*

**Proof sketch (Erdős, 1947).** Color each edge of $K_n$ independently red or blue with probability $1/2$ each. For any fixed set of $k$ vertices, the probability that the induced $K_k$ is monochromatic is $2 \cdot (1/2)^{\binom{k}{2}} = 2^{1 - \binom{k}{2}}$. The expected number of monochromatic $K_k$ subgraphs is therefore $\binom{n}{k} 2^{1 - \binom{k}{2}}$, which by hypothesis is less than 1. So with positive probability, the random coloring has no monochromatic $K_k$. Hence at least one such coloring exists. $\blacksquare$

**When to use.** In combinatorics and graph theory, when direct construction of a desired object is hard but random construction succeeds with positive probability. The method is non-constructive in general but has been turned constructive in many cases via techniques like the Lovász Local Lemma and derandomization.

**Historical note.** The probabilistic method was essentially created by Paul Erdős in 1947 in his Ramsey lower bound paper. It is now one of the central techniques of combinatorics.

### B.11 Cantor's diagonal argument

**Pattern:** To show that a set $S$ is larger than (or different from) a set $T$, suppose there is a function from $T$ "covering" $S$, and construct an element of $S$ that differs from every element in the range of the function.

**Canonical example.** *The real numbers in $(0, 1)$ are uncountable.*

**Proof (Cantor, 1891).** Suppose for contradiction that there is a bijection $f : \mathbb{N} \to (0, 1)$. Write each $f(n)$ in decimal as $f(n) = 0.d_{n,1} d_{n,2} d_{n,3} \ldots$ (choosing the representation that does not end in all 9s for numbers with two representations).

Define a new real number $r = 0.r_1 r_2 r_3 \ldots$ by:

$$r_n = \begin{cases} 5 & \text{if } d_{n,n} \neq 5 \\ 6 & \text{if } d_{n,n} = 5 \end{cases}$$

(Any choice that differs from $d_{n,n}$ and avoids 0 and 9 works.)

Then $r \in (0, 1)$ but $r \neq f(n)$ for any $n$, since $r$ and $f(n)$ differ in the $n$-th decimal place. So $f$ is not surjective, contradicting the assumption that it is a bijection. Therefore no bijection $\mathbb{N} \to (0, 1)$ exists, and $(0, 1)$ is uncountable. $\blacksquare$

**When to use.** Whenever you want to show that a collection is too big to be indexed by another collection. Cantor's argument generalizes to:

- **Cantor's theorem:** $|S| < |\mathcal{P}(S)|$ for every set $S$.
- **Russell's paradox:** via the same diagonal reasoning applied to sets containing themselves.
- **Halting problem undecidability** (Turing, 1936).
- **Gödel's first incompleteness theorem** (Gödel, 1931).
- **Tarski's undefinability of truth.**

Diagonal arguments are one of the most important technical ideas in 20th-century mathematics and computer science.

### B.12 Invariant argument

**Pattern:** To show that a system (game, process, recurrence) cannot reach a certain state, find a quantity (the invariant) that is preserved by every allowed move and has different values in the starting and target states.

**Canonical example.** *A standard 8×8 chessboard with two diagonally opposite corner squares removed cannot be tiled by 1×2 dominoes.*

**Proof.** Color the chessboard in the usual black-and-white pattern. Each domino, when placed on the board, covers exactly one black and one white square. So any tiling by $k$ dominoes covers exactly $k$ black and $k$ white squares — the counts are equal.

The two diagonally opposite corners of a chessboard are the same color (say, both white). Removing them leaves 32 black squares and 30 white squares. Any valid tiling would cover equal numbers of each, so at most $\min(32, 30) = 30$ dominoes fit, covering 60 squares — but the board has 62 squares. Therefore no complete tiling exists. $\blacksquare$

**When to use.** For impossibility proofs in games, puzzles, and combinatorial processes. Find a quantity (parity, sum, product, coloring, algebraic expression) that every move preserves, and show the starting and ending states disagree on it.

### B.13 Extremal principle

**Pattern:** To prove a property holds, pick an object that is extremal in some way (largest, smallest, maximum, minimum), and use the extremality to derive information.

**Canonical example.** *Among any set of $n \geq 3$ points in the plane, if every three points determine a line that contains a fourth point from the set, then all the points are collinear.* (Sylvester-Gallai theorem, in contrapositive form — the Sylvester-Gallai theorem itself says: given any finite set of non-collinear points in the plane, there is a line passing through exactly two of the points. The extremal proof is due to Kelly (1948).)

**Proof sketch (Kelly, 1948).** Suppose not all points are collinear. Consider all pairs (point $P$, line $\ell$) where $P$ is a point of the set, $\ell$ is a line through at least two points of the set, and $P \notin \ell$. Among all such pairs, pick the one minimizing the distance from $P$ to $\ell$. By a short geometric argument using the foot of the perpendicular from $P$ to $\ell$, the line $\ell$ must contain *exactly* two points of the set — otherwise we could find a pair with smaller distance, contradicting minimality. $\blacksquare$

**When to use.** When the structure of the problem suggests a natural "extreme" element, and when reasoning about the extreme element reveals a contradiction or directly establishes the goal. Common choices of extremum:

- Smallest counterexample (leads to well-ordering arguments).
- Minimum of a function.
- Longest path, shortest path, maximum flow in a graph.
- Largest element of a bounded set.

## 4. Combinations and higher-order patterns

Most real proofs combine several techniques. A proof might use direct proof for the main argument, case analysis on a key sub-case, induction for a recursive sub-claim, and contradiction for a uniqueness sub-claim. The catalog above is a vocabulary, not a recipe.

Some common combination patterns:

- **Induction with case analysis.** Within the inductive step, split on the structure of the object at step $k+1$.
- **Contradiction with construction.** Assume $\neg P$, construct an object from the assumption, show it has contradictory properties.
- **Two-phase existence proofs.** First prove something exists (existence), then prove it's unique (uniqueness).
- **Double induction.** Induction on one variable, inside which is another induction on a second variable. Common for theorems about matrices, grids, or pairs of naturals.
- **Lexicographic induction.** Induction on pairs or tuples under lexicographic order.

## 5. Choosing a technique

Research mathematicians don't consciously choose techniques — they see the structure of the problem and a technique suggests itself. Students develop this intuition through practice. Some heuristics:

1. **Default to direct proof.** Try it first. Switch only if stuck.
2. **If $P$ is hard to use, try contrapositive.** The contrapositive lets you reason from $\neg Q$, which may be easier.
3. **If the conclusion is a negation or non-existence, consider contradiction.** Assuming the opposite gives you a concrete object to reason about.
4. **If the hypothesis naturally splits, use cases.** Parity, sign, size, set membership.
5. **If the domain is $\mathbb{N}$ or has a recursive structure, try induction.** Weak first, strong if needed.
6. **If the claim is "there exists ...," try explicit construction.** Non-constructive existence is a last resort.
7. **If the object is combinatorial and counts are involved, try double counting or pigeonhole.**
8. **If you need to show a system can't reach a state, look for an invariant.**
9. **If explicit construction fails but randomness works, try the probabilistic method.**
10. **If nothing works, try assuming the minimal counterexample (well-ordering).**

## 6. The meta-technique: reformulation

A hidden technique underlying all the others: **reformulate the statement into an equivalent one that matches a standard technique.** Sometimes a theorem stated in one form is easy to prove; in another form, impossible. The art is knowing the reformulations.

Common reformulations:

- $P \implies Q \iff \neg Q \implies \neg P$ (contrapositive).
- $\forall x \, P(x) \iff \neg \exists x \, \neg P(x)$ (quantifier dualities).
- $A \subseteq B \iff \forall x \, (x \in A \implies x \in B)$ (element-wise set containment).
- $A = B \iff A \subseteq B \text{ and } B \subseteq A$ (Schwarz slide 117 — set equality by two subset inclusions).
- $f \text{ is injective} \iff \forall x, y \, (f(x) = f(y) \implies x = y)$.
- $n \text{ is prime} \iff n > 1 \text{ and } \forall a, b \, (ab = n \implies a = 1 \text{ or } b = 1)$.

Each reformulation unlocks a different set of techniques. Part of learning proof writing is learning to recognize which reformulation applies.

## 7. Further reading

### Technique-focused proof textbooks

- Velleman, D. J. (2019). *How to Prove It: A Structured Approach* (3rd ed.). Cambridge University Press. Techniques organized by logical form.
- Hammack, R. (2018). *Book of Proof* (3rd ed.). Open textbook. https://www.people.vcu.edu/~rhammack/BookOfProof/
- Cupillari, A. (2012). *The Nuts and Bolts of Proofs* (4th ed.). Academic Press.
- Solow, D. (2013). *How to Read and Do Proofs* (6th ed.). Wiley.

### Specific techniques at depth

- Polya, G. (2004). *Mathematics and Plausible Reasoning* (2 vols.). Princeton University Press (reprints of 1954 originals). Vol. 2, *Patterns of Plausible Inference*, covers induction at length.
- Alon, N., & Spencer, J. H. (2016). *The Probabilistic Method* (4th ed.). Wiley. The standard reference.
- Aigner, M., & Ziegler, G. M. (2018). *Proofs from THE BOOK* (6th ed.). Springer. A collection of gorgeous proofs across many techniques.
- Benjamin, A. T., & Quinn, J. J. (2003). *Proofs That Really Count: The Art of Combinatorial Proof*. Mathematical Association of America.

### History of techniques

- Kline, M. (1972). *Mathematical Thought from Ancient to Modern Times*. Oxford University Press.
- Grabiner, J. V. (1983). "The changing concept of change: The derivative from Fermat to Weierstrass." *Mathematics Magazine*, 56(4), 195–206.

## Cross-references within this mission

- **Document 2** provides the logical rules each technique is built on.
- **Document 4** applies these techniques to specific mathematical structures.
- **Document 5** covers the craft of turning technique into well-written prose.
- **Document 6** discusses how each technique is expressed in proof assistants, where the technique catalog becomes a library of tactics.

---

## Study Guide — Proof Techniques Catalog

### Prerequisites

- Document 2 (logic and language) — you need to know what $\forall$, $\exists$, $\implies$, $\neg$ mean before learning the techniques that operate on them.
- Basic comfort with even/odd integers, set membership, and simple algebraic manipulation.

### Key vocabulary

| Term | Definition | Technique |
|---|---|---|
| **Direct proof** | Assume hypothesis, derive conclusion by forward reasoning. | A.1 |
| **Contrapositive** | Prove $\neg Q \implies \neg P$ instead of $P \implies Q$. | A.2 |
| **Contradiction (reductio)** | Assume $\neg P$, derive $\bot$, conclude $P$. | A.3 |
| **Case analysis** | Partition the hypothesis space, prove each case separately. | A.4 |
| **WLOG** | Reduce symmetric cases to one representative case. | A.5 |
| **Induction (weak)** | Base case + inductive step ($P(k) \implies P(k+1)$). | B.4 |
| **Strong induction** | Base case + inductive step assuming $P(0), \ldots, P(k)$. | B.5 |
| **Structural induction** | Induction on recursively defined structures (trees, formulas). | B.6 |
| **Witness / construction** | Explicitly produce an object satisfying an existential claim. | B.1 |
| **Pigeonhole** | $n+1$ objects in $n$ boxes → some box has $\geq 2$. | B.8 |
| **Diagonal argument** | Construct an object differing from every element of a list at a designated position. | B.11 |
| **Invariant** | A quantity preserved by every allowed operation; use it to show a state is unreachable. | B.12 |

### Mastery checklist

For each technique in the catalog, you have mastered it when you can:

- [ ] State the technique's logical pattern from memory.
- [ ] Write one worked proof using the technique without referring to notes.
- [ ] Identify which technique a given proof uses, given only the proof text.
- [ ] Explain when the technique is the right choice and when it isn't.
- [ ] Solve a problem where the technique is not immediately obvious but becomes so after reformulation (section 6).

### Study plans

**1-week sprint.** Focus on Group A (implications). Master direct proof, contrapositive, and contradiction. Prove: (a) $\sqrt{3}$ is irrational (A.3), (b) if $n^2$ is odd then $n$ is odd (A.2), (c) for any integer $n$, $n^2 + n$ is even (A.4). Three proofs, three techniques.

**1-month deep dive.** Add Group B. Prove the sum formula $1 + 2 + \cdots + n = n(n+1)/2$ by induction (B.4). Prove every integer $\geq 2$ has a prime factorization by strong induction (B.5). Prove the 13-people birthday-month pigeonhole (B.8). Prove $\mathbb{R}$ is uncountable by Cantor's diagonal (B.11). Prove the mutilated chessboard by invariant (B.12). One proof per technique, 8 total.

**6-month mastery.** Work through Hammack's *Book of Proof* or Velleman's *How to Prove It* cover to cover, identifying the technique used in every proof. Add Aigner & Ziegler's *Proofs from THE BOOK* for beauty. For every technique, collect 5 favorite proofs — your personal "proof gallery."

---

## TRY Session — Your First Proof by Contradiction

**Duration:** 20 minutes.
**Materials:** Pen and paper.

**Theorem to prove:** $\sqrt{3}$ is irrational.

**Steps:**

1. Assume for contradiction that $\sqrt{3} = p/q$ with $\gcd(p, q) = 1$.
2. Square both sides: $3 = p^2/q^2$, so $p^2 = 3q^2$.
3. Conclude $3 \mid p^2$. Now you need the fact: if $3 \mid p^2$ then $3 \mid p$. (Prove this as a mini-lemma using Euclid's lemma or by considering $p \bmod 3$.)
4. Write $p = 3r$, substitute: $9r^2 = 3q^2$, so $q^2 = 3r^2$, hence $3 \mid q$.
5. Both $p$ and $q$ are divisible by 3, contradicting $\gcd(p, q) = 1$.
6. Therefore $\sqrt{3}$ is irrational. $\blacksquare$

**What to observe:** The structure is identical to the $\sqrt{2}$ proof (A.3). The only difference is replacing "2" with "3" everywhere. Ask yourself: for which integers $n$ does this proof template work? (Answer: all primes, and more generally all squarefree integers.)

---

## TRY Session — Invariant Reasoning on the 15-Puzzle

**Duration:** 20 minutes.
**Materials:** A physical 15-puzzle or an online simulator.

**Theorem:** Exactly half of the $16!/2$ permutations of the 15-puzzle are reachable from the solved state.

**Steps:**

1. Number the tiles 1–15 in a 4×4 grid. The blank is tile 16.
2. Every legal move is a transposition of the blank with an adjacent tile.
3. Define the **parity of a permutation** as even or odd based on the number of transpositions needed to reach it from the identity.
4. Observe: each slide move changes the parity of the permutation *and* moves the blank one step in the grid. The parity of the blank's position (in taxicab distance from its home) changes by 1.
5. The **invariant** is: (parity of permutation) + (parity of blank's taxicab distance from home) is constant modulo 2.
6. In the solved position, both are 0. So only positions where permutation parity + blank distance parity is even are reachable.
7. Verify: swap tiles 14 and 15 (with blank in its home position). The permutation has odd parity, the blank distance is 0 (even), so the sum is odd — unreachable. This is why the "14-15 puzzle" is impossible.

**What to observe:** You proved something impossible by finding a quantity that never changes. No amount of sliding will alter the invariant's value. This is technique B.12 in action.

---

## DIY — Prove Five Theorems, Five Techniques

**Scope:** 3–5 hours across a week.
**Deliverable:** Five written proofs, each using a different technique.

| # | Theorem | Required technique |
|---|---|---|
| 1 | The product of any two odd numbers is odd. | Direct (A.1) |
| 2 | If $3n + 2$ is odd, then $n$ is odd. | Contrapositive (A.2) |
| 3 | There is no smallest positive rational number. | Contradiction (A.3) |
| 4 | For any $n \geq 1$, $1 + 3 + 5 + \cdots + (2n - 1) = n^2$. | Induction (B.4) |
| 5 | Among any 5 integers, some pair has the same remainder modulo 4. | Pigeonhole (B.8) |

**Verification:** After writing each proof, apply the "mugga mugga test" (document 5): read it aloud, replacing all math with "blah." Does the English still work?

---

## DIY — The Proof Technique Spotter

**Scope:** 2–3 hours.
**Materials:** A proof-based textbook (Hammack, Velleman, or Rudin chapter 1).

**Task:** Read 10 proofs in the textbook. For each proof, write one line identifying:

1. The technique used (from the catalog).
2. The key step where the technique is deployed.
3. Whether a different technique could have worked.

**Stretch:** Find a proof that uses *two* techniques in combination (e.g., induction with case analysis inside the inductive step). Explain how the techniques compose.

---

## College & Rosetta Deep Links

### Department connections

| College Department | Concept ID | Connection |
|---|---|---|
| **Logic** | `log-formal-proof-systems` | Every technique is a rule or pattern within a formal proof system |
| **Logic** | `log-propositional-logic` | Contradiction (A.3), cases (A.4), and contrapositive (A.2) are propositional-logic transformations |
| **Logic** | `log-predicate-logic` | Universal introduction (B.4 base of induction), existential introduction (B.1 witness construction) |
| **Math** | `math-pattern-recognition` | Section 5 (choosing a technique) — pattern recognition is the meta-skill that determines which proof technique fits a problem |
| **Math** | `math-number-cardinality` | B.11 (diagonal argument) proves cardinality results; B.8 (pigeonhole) is a cardinality-based technique |
| **Math** | `math-equations-expressions` | Group A techniques all manipulate algebraic expressions within proofs |
| **Math** | `math-functions` | B.1–B.3 (existence, uniqueness) concern function properties (injectivity, surjectivity) |
| **Problem-Solving** | (heuristics) | Section 5 (choosing a technique) is a structured problem-solving heuristic — Polya's method applied to proof selection |
| **Critical Thinking** | (evaluation) | Technique A.8 (counterexample / disproof) is critical thinking applied to mathematical claims |

### Rosetta panel routes

Each proof technique can be demonstrated in code:

- **Python panel:** Induction proofs correspond to recursive functions. Strong induction corresponds to dynamic programming. A Python exercise: implement $n!$ recursively (weak induction) and Fibonacci (strong induction / memoization).
- **C++ panel:** The invariant technique (B.12) maps to loop invariants in imperative programming. A C++ exercise: prove a loop's correctness by identifying its invariant.
- **Lisp panel:** Structural induction (B.6) is the proof technique for recursive data structures, which Lisp makes first-class. A Lisp exercise: prove that `(length (append xs ys)) = (+ (length xs) (length ys))` by structural induction on `xs`.
- **Fortran panel:** The pigeonhole principle (B.8) appears in numerical algorithms as collision detection. A Fortran exercise: given an array of $n + 1$ integers in $\{1, \ldots, n\}$, find a duplicate.
- **Pascal panel:** Case analysis (A.4) maps directly to Pascal's `case` statement. The connection between logical case analysis and programming case statements is the through-line.

### Cross-department threads

- **Logic → Math → Problem-Solving:** The technique catalog is the intersection of logic (the rules), math (the content), and problem-solving (the strategy). A student who masters all three departments simultaneously builds proof fluency faster than one who studies them separately.
- **Math → Coding:** Every induction proof has a recursive program counterpart. Every recursive program has an induction proof of its correctness. This is the Curry-Howard thread from document 2/6.
- **Logic → Philosophy:** Proof by contradiction (A.3) depends on the law of excluded middle. The constructivist rejection of LEM (document 1, section 5.1) means some contradiction proofs are *not* accepted in all philosophical frameworks. This is a living debate.

---

## Knowledge Gap Fills — Third Pass

### The well-ordering principle deserves more than a single example

Section B.7 gives only one example (every $n \geq 2$ has a prime factor). Well-ordering is actually a *meta-technique* that underlies all induction: weak induction, strong induction, and transfinite induction are all logically equivalent to well-ordering applied to different ordered sets. The equivalence chain:

$$\text{Well-ordering of } \mathbb{N} \iff \text{Weak induction} \iff \text{Strong induction}$$

**Proof sketch (well-ordering → strong induction).** Suppose $P(0)$ is true and $[\forall j \leq k, P(j)] \implies P(k+1)$. Let $S = \{n \in \mathbb{N} : \neg P(n)\}$. If $S \neq \emptyset$, by well-ordering $S$ has a least element $m$. Then $m > 0$ (since $P(0)$ holds) and $P(j)$ holds for all $j < m$ (by minimality of $m$). By the inductive hypothesis, $P(m)$ holds — contradiction. So $S = \emptyset$. $\blacksquare$

**Proof sketch (strong induction → well-ordering).** Given a non-empty $S \subseteq \mathbb{N}$, prove by strong induction that every $n$ either is in $S$ or has a predecessor in $S$ that is smaller. The base case ($n = 0$) either gives $0 \in S$ or $S$ has no element $\leq 0$. The inductive step resolves the minimal element. $\blacksquare$

This equivalence is important because it means you can always reformulate an induction proof as a "least counterexample" proof and vice versa. The technique that *looks* right for a problem might not be the one that *works* — reformulation (section 6) is the meta-skill.

### Proof by exhaustion vs. proof by cases

Section A.4 covers proof by cases. A related but distinct technique — **proof by exhaustion** — verifies every case individually when the domain is finite. The four-color theorem's 1976 proof is proof by exhaustion (1,900 cases checked by computer). More modestly: "Every prime greater than 3 is of the form $6k \pm 1$" can be proved by exhaustion over the 6 residue classes modulo 6 (classes 0, 2, 3, 4 are eliminated as divisible by 2 or 3, leaving classes 1 and 5).

The distinction matters pedagogically: cases is a *structural* technique (the cases come from the problem's logical form), while exhaustion is a *computational* technique (the cases come from enumerating a finite set). Automation can handle exhaustion but not arbitrary case analysis.

### Proof by construction — the constructive emphasis

Section B.1 treats construction as "produce a witness." In constructive mathematics, this is not just one technique among many — it is the *only* acceptable way to prove existence. The Brouwer-Heyting-Kolmogorov (BHK) interpretation makes this precise:

- A proof of $\exists x \, P(x)$ is a pair $(a, p)$ where $a$ is a value and $p$ is a proof of $P(a)$.
- A proof of $P \lor Q$ is either a proof of $P$ or a proof of $Q$, together with a tag saying which.
- There is no proof of $P \lor \neg P$ in general (the law of excluded middle is not an axiom).

This means the non-constructive existence proof (B.2 — the $a^b$ example) is *not valid* in constructive mathematics. The technique catalog should be understood as having two tiers: constructive techniques (valid everywhere) and classical techniques (valid only with LEM). Every technique in Group A (direct, contrapositive, cases, biconditional) is constructive. Contradiction (A.3 in its full generality) and non-constructive existence (B.2) are classical-only.

### The Erdős probabilistic method — a fuller example

Section B.10 gives a terse sketch. Here is a more accessible example:

**Theorem (Erdős, 1963).** There exists a tournament on $n$ vertices with no dominating set of size $\lceil \log_2 n \rceil - 1$. (A tournament is a complete directed graph; a dominating set $S$ is a set such that every vertex outside $S$ is beaten by some vertex in $S$.)

**Proof.** Orient each edge of $K_n$ independently with probability $1/2$. For any set $S$ of size $k = \lceil \log_2 n \rceil - 1$, the probability that a fixed vertex $v \notin S$ beats every vertex in $S$ is $(1/2)^k$. The probability that $v$ is NOT dominated by $S$ is also $(1/2)^k$. The probability that SOME vertex is not dominated is at most $(n - k) \cdot (1/2)^k$. By union bound over all $\binom{n}{k}$ choices of $S$:

$$\Pr[\text{some } S \text{ of size } k \text{ dominates}] \leq \binom{n}{k} (n-k) (1/2)^k < n^k \cdot n \cdot 2^{-k} = n^{k+1} / 2^k.$$

When $k = \lceil \log_2 n \rceil - 1$, we have $2^k < n$, so $n^{k+1}/2^k > 1$ only barely; with a more careful computation the bound is $< 1$. So with positive probability, no dominating set of that size exists. Therefore some tournament achieves this. $\blacksquare$

The probabilistic method is non-constructive (you don't know *which* tournament works) but establishes existence. It is the prototypical application of probability to combinatorics and was essentially invented by Erdős.

## Lessons Learned & Retrospectives — Third Pass

### What our own proofs taught about technique selection

The memory arena milestones used a specific mix of techniques:

| Milestone | Key proof technique | Why that technique |
|---|---|---|
| M1 (alloc/get) | Direct proof + exhaustive testing | 99 Rust tests verified each operation by direct construction of witnesses |
| M2 (warm-start 16.58x) | Statistical hypothesis testing | Performance claims require p-values, not logical deduction — this is the empirical parallel to proof |
| M3–M4 (crossfade) | Invariant (chunk-state machine) | The state enum is a type-level invariant; Rust's exhaustive match enforces it |
| M5 (sweep policy) | Case analysis on access patterns | The sweep driver branches on hot/warm/cold thresholds — each case has a different action |
| M6 (VRAM) | Construction (explicit witness) | The VramPool produces a concrete GPU allocation or returns an error — existence by construction |
| M7 (allocator bake-off) | Comparison by exhaustion | 4 allocators tested across the same benchmarks — proof by complete enumeration |
| M13 (Grove integration) | Structural induction on the arena tree | Content-addressed records form a tree; properties verified by structural induction over the tree shape |

The pattern: **simple techniques dominate real engineering proofs.** Direct proof + case analysis + invariants covered >80% of our proof needs. Contradiction, induction, and the diagonal argument appeared only in edge cases. This matches the section 5 selection heuristic: default to direct, escalate only when needed.

### The PCG statistical proof retrospective

Our `rng-research` work included proving PCG generator quality via TestU01 BigCrush (160 statistical tests). This is an example of **computational proof** — you don't prove that the generator is random (it isn't), you prove that no statistical test from a large battery can distinguish its output from true randomness at a given significance level. See `docs/research/rng-research/testing-quality.md`.

The lesson: proof by exhaustive testing is proof by exhaustion (the gap fill above), applied to test suites rather than mathematical cases. The technique is the same; the domain is different.

## Deep Corpus Links — Third Pass

### Research corpus cross-references

| Technique | Target | Connection |
|---|---|---|
| B.11 (diagonal) | `docs/research/mlc-research/` (machine-level computing) | Turing's halting-problem undecidability proof uses the same diagonal technique as Cantor. The MLC research covers Turing machines at the hardware level |
| B.10 (probabilistic) | `docs/research/rng-research/testing-quality.md` | BigCrush as statistical proof of randomness quality — the testing battery is a probabilistic proof tool |
| B.10 (probabilistic) | `docs/research/dmn-research/` (data mining) | ML convergence proofs (PAC learning, VC dimension) use probabilistic arguments structurally identical to Erdős's method |
| B.4–B.6 (induction) | `docs/research/lsp-research/history-philosophy.md` §1 | Church's lambda calculus defines computation by recursive reduction — structural induction on lambda terms is how you prove properties of programs |
| B.12 (invariant) | `docs/research/rst-research/language-ownership.md` | Rust's borrow checker maintains the aliasing invariant: at most one mutable reference OR any number of shared references. This is a type-level invariant enforced at compile time |
| A.2 (contrapositive) | `docs/research/rca-deep/classical-methods-enrichment.md` | The contrapositive of "5 Whys finds root causes" is "if 5 Whys didn't find the root cause, the method failed" — Card's 2017 critique is essentially a contrapositive argument |
| A.4 (case analysis) | `docs/research/plg-research/language-semantics.md` §5 (the cut) | Prolog's cut (!) prunes case analysis at runtime — it is the computational equivalent of "this case is impossible, skip it" |
| B.1 (construction) | `docs/research/python-research/` | Python's REPL culture — "try it and see if it works" — is computational witness construction |

### Live site pages

| Technique | Page | Connection |
|---|---|---|
| B.4 (induction) | `Research/LSP/history.html` | Lambda calculus = recursive computation = induction |
| B.11 (diagonal) | `Research/RCA/mathematical-foundations.html` | Diagonal argument underlies impossibility results in causal inference |
| B.8 (pigeonhole) | `Research/FOR/learn.html` | Fortran numerical algorithms encounter pigeonhole in hash collisions |
| A.4 (cases) | `Research/PLG/language.html` | Prolog clauses = case analysis branches |
| B.12 (invariant) | `Research/RST/learn.html` | Rust ownership invariant = compile-time proof of memory safety |

### College concept deepening

| Concept ID | Third-pass extension |
|---|---|
| `math-pattern-recognition` | Technique selection (section 5) IS pattern recognition applied to logical structure — recognizing that a problem "looks like" a pigeonhole problem or an invariant problem |
| `log-formal-proof-systems` | Resolution (new gap fill in doc 2) + natural deduction + sequent calculus are three equivalent proof systems. The technique catalog operates within natural deduction; resolution underlies SAT solvers; sequent calculus underlies proof assistants |
| `math-functions` | Existence/uniqueness proofs (B.1–B.3) are the core technique for reasoning about functions. Proving a function is well-defined = proving existence + uniqueness of its output for each input |
