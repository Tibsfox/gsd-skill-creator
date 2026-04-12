# 04 — Proofs on Mathematical Structures

> **Schwarz deck, slides 10–120** — Proofs about integer parity and proofs about sets.

Schwarz's deck covers two concrete domains: integers (via even/odd) and sets (via union / intersection / subset / equality). This document generalizes to the structures that a standard undergraduate curriculum treats: the number systems $\mathbb{N}, \mathbb{Z}, \mathbb{Q}, \mathbb{R}, \mathbb{C}$; divisibility and modular arithmetic; sets, cardinality, functions, relations, and orders; and the algebraic hierarchy (monoids, groups, rings, fields). Each section presents the key definitions, representative theorems, and canonical proof patterns.

The emphasis is on **which technique from document 3 applies to which structure** — Schwarz's deck teaches proof writing in the abstract; here we see how proof writing specializes when the objects are numbers, sets, functions, or groups.

## 1. Integers and divisibility

### 1.1 Definitions

A natural starting point for a transition-to-proof course. Everything here can be proved rigorously from the Peano axioms or from the definition of $\mathbb{Z}$ as equivalence classes of pairs of naturals, but in practice $\mathbb{Z}$ is taken as given.

**Definition (divides).** For integers $a, b$, we say $a$ divides $b$, written $a \mid b$, if there exists an integer $k$ such that $b = ak$. Equivalently, $b$ is a multiple of $a$.

**Definition (even).** An integer $n$ is **even** iff $2 \mid n$, i.e., iff there exists an integer $k$ such that $n = 2k$. (Schwarz slide 14.)

**Definition (odd).** An integer $n$ is **odd** iff there exists an integer $k$ such that $n = 2k + 1$. (Schwarz slide 26.)

**Definition (prime).** A positive integer $p \geq 2$ is **prime** iff its only positive divisors are $1$ and $p$.

**Definition (gcd).** For integers $a, b$ not both zero, $\gcd(a, b)$ is the largest positive integer that divides both $a$ and $b$. (Existence is a mini-theorem; the set of common divisors is finite and non-empty.)

### 1.2 Representative theorems

**Theorem (transitivity of divides).** If $a \mid b$ and $b \mid c$, then $a \mid c$.

*Direct proof.* From $a \mid b$, there exists $k$ with $b = ak$. From $b \mid c$, there exists $\ell$ with $c = b\ell$. Substituting, $c = (ak)\ell = a(k\ell)$. Since $k\ell$ is an integer, $a \mid c$. $\blacksquare$

**Theorem (division algorithm).** For any integers $a$ and $b$ with $b > 0$, there exist *unique* integers $q$ and $r$ with $0 \leq r < b$ and $a = bq + r$.

*Proof sketch.* Existence: consider the set $S = \{a - bq : q \in \mathbb{Z}, a - bq \geq 0\}$. $S$ is non-empty (choose $q$ very negative) and bounded below by 0, so by well-ordering $S$ has a least element $r$. Show $r < b$: if $r \geq b$, then $r - b \in S$ and $r - b < r$, contradicting minimality. Uniqueness: suppose $a = bq_1 + r_1 = bq_2 + r_2$ with $0 \leq r_1, r_2 < b$. Then $b(q_1 - q_2) = r_2 - r_1$; since $|r_2 - r_1| < b$, the only multiple of $b$ with absolute value less than $b$ is 0, so $q_1 = q_2$ and $r_1 = r_2$. $\blacksquare$

**Theorem (Euclid's lemma).** If $p$ is prime and $p \mid ab$, then $p \mid a$ or $p \mid b$.

*Proof sketch.* If $p \mid a$, done. Otherwise $\gcd(p, a) = 1$ (the only divisors of $p$ are 1 and $p$, and $p$ doesn't divide $a$). By Bézout's identity, there exist integers $x, y$ with $px + ay = 1$. Multiply by $b$: $pxb + aby = b$. Since $p \mid pxb$ and $p \mid ab$ (so $p \mid aby$), $p \mid b$. $\blacksquare$

**Theorem (infinitely many primes, Euclid).** There are infinitely many primes.

*Proof by contradiction.* Suppose the primes are $p_1, p_2, \ldots, p_n$ (a finite list). Consider $N = p_1 p_2 \cdots p_n + 1$. If $N$ is prime, it is a prime not in the list, contradiction. If $N$ is composite, it has a prime factor $p$. This $p$ cannot be any of $p_1, \ldots, p_n$, since dividing $N$ by any $p_i$ leaves remainder 1. So $p$ is a prime not in the list, contradiction. Therefore the list of primes is infinite. $\blacksquare$

**Theorem (fundamental theorem of arithmetic).** Every integer $n \geq 2$ can be written uniquely (up to order) as a product of primes.

*Existence by strong induction.* See document 3, example B.5.

*Uniqueness by strong induction + Euclid's lemma.* Suppose $p_1 p_2 \cdots p_r = q_1 q_2 \cdots q_s$ are two prime factorizations of $n$. Then $p_1 \mid q_1 q_2 \cdots q_s$. By Euclid's lemma (extended by induction to $s$ factors), $p_1 \mid q_j$ for some $j$. Since $q_j$ is prime, $p_1 = q_j$. Cancel both from their respective products and apply the induction hypothesis to the smaller $n/p_1$. $\blacksquare$

### 1.3 Modular arithmetic

**Definition (congruence).** For integers $a, b, m$ with $m > 0$, we write $a \equiv b \pmod{m}$ iff $m \mid (a - b)$.

**Theorem (congruence is an equivalence relation).** $\equiv \pmod{m}$ is reflexive, symmetric, and transitive.

*Proof.* Reflexivity: $a - a = 0 = m \cdot 0$, so $a \equiv a$. Symmetry: if $a \equiv b$, then $m \mid (a - b)$, so $m \mid -(a - b) = (b - a)$, so $b \equiv a$. Transitivity: if $a \equiv b$ and $b \equiv c$, then $m \mid (a - b)$ and $m \mid (b - c)$, so $m \mid [(a - b) + (b - c)] = a - c$, so $a \equiv c$. $\blacksquare$

**Theorem (congruence respects arithmetic).** If $a \equiv b \pmod{m}$ and $c \equiv d \pmod{m}$, then $a + c \equiv b + d \pmod{m}$ and $ac \equiv bd \pmod{m}$.

*Proof of multiplication.* From $a \equiv b$, $a = b + m k$ for some $k$. From $c \equiv d$, $c = d + m \ell$ for some $\ell$. Then $ac = (b + mk)(d + m\ell) = bd + bm\ell + dmk + m^2 k\ell = bd + m(b\ell + dk + mk\ell)$. Since $b\ell + dk + mk\ell$ is an integer, $ac \equiv bd \pmod{m}$. $\blacksquare$

**Theorem (Fermat's little theorem).** If $p$ is prime and $p \nmid a$, then $a^{p-1} \equiv 1 \pmod{p}$.

*Proof sketch.* Consider the set $\{a, 2a, 3a, \ldots, (p-1)a\} \pmod p$. These are all distinct modulo $p$ (if $ia \equiv ja$, then $p \mid (i - j)a$; since $p \nmid a$, $p \mid (i - j)$; since $|i - j| < p$, $i = j$). So this set equals $\{1, 2, \ldots, p-1\} \pmod p$. Take products: $a \cdot 2a \cdots (p-1)a \equiv 1 \cdot 2 \cdots (p-1) \pmod p$, i.e., $a^{p-1} (p-1)! \equiv (p-1)! \pmod p$. Divide both sides by $(p-1)!$ (which is invertible mod $p$ since $p$ is prime and $p \nmid (p-1)!$) to get $a^{p-1} \equiv 1 \pmod p$. $\blacksquare$

**Proof techniques used.** Mostly direct proof combined with existential elimination (naming witnesses for divisibility), case analysis on parity or modular residue, strong induction for recursive structures, and contradiction for non-existence/infinity claims.

## 2. Real numbers and analysis

### 2.1 Definitions

**Definition (rational).** A real number $r$ is **rational** iff there exist integers $p, q$ with $q \neq 0$ such that $r = p/q$. Otherwise $r$ is **irrational**.

**Definition (supremum).** For a non-empty set $S \subseteq \mathbb{R}$ bounded above, $\sup S$ is the least real number $u$ such that $s \leq u$ for every $s \in S$.

**Axiom (completeness of $\mathbb{R}$).** Every non-empty subset of $\mathbb{R}$ bounded above has a supremum in $\mathbb{R}$.

The completeness axiom is what distinguishes $\mathbb{R}$ from $\mathbb{Q}$. The set $\{x \in \mathbb{Q} : x^2 < 2\}$ is bounded above in $\mathbb{Q}$ but has no rational supremum; in $\mathbb{R}$ the supremum is $\sqrt{2}$.

**Definition ($\varepsilon$-$\delta$ continuity).** A function $f : \mathbb{R} \to \mathbb{R}$ is **continuous at** $a \in \mathbb{R}$ iff

$$\forall \varepsilon > 0 \, \exists \delta > 0 \, \forall x \, (|x - a| < \delta \implies |f(x) - f(a)| < \varepsilon).$$

### 2.2 Representative theorems

**Theorem.** $\sqrt{2}$ is irrational. (Document 3, example A.3.)

**Theorem (Archimedean property).** For any real numbers $x, y$ with $x > 0$, there exists a positive integer $n$ such that $nx > y$.

*Proof by contradiction.* Suppose not: for some $x > 0$ and $y$, $nx \leq y$ for all $n \in \mathbb{N}$. Then the set $S = \{nx : n \in \mathbb{N}\}$ is bounded above by $y$. By completeness, $u = \sup S$ exists. Since $u - x < u$ and $u$ is the *least* upper bound, $u - x$ is not an upper bound, so there exists $m \in \mathbb{N}$ with $mx > u - x$. But then $(m+1)x > u$, contradicting $u$ being an upper bound for $S$. $\blacksquare$

**Theorem (density of $\mathbb{Q}$ in $\mathbb{R}$).** Between any two distinct real numbers there is a rational number.

*Proof sketch.* Given $x < y$, let $n$ be a positive integer with $n(y - x) > 1$ (by Archimedean property). Let $m$ be the least integer with $m > nx$ (again by Archimedean). Then $m - 1 \leq nx < m$, so $m \leq nx + 1 < ny$, giving $nx < m < ny$, so $x < m/n < y$. The rational $m/n$ is between. $\blacksquare$

**Theorem (compositions of continuous functions are continuous).** If $f$ and $g$ are continuous at appropriate points, then $g \circ f$ is continuous.

*Direct proof using $\varepsilon$-$\delta$.* Suppose $f$ is continuous at $a$ and $g$ is continuous at $f(a)$. We show $g \circ f$ is continuous at $a$. Let $\varepsilon > 0$. Since $g$ is continuous at $f(a)$, there exists $\delta_1 > 0$ such that $|y - f(a)| < \delta_1 \implies |g(y) - g(f(a))| < \varepsilon$. Since $f$ is continuous at $a$, there exists $\delta_2 > 0$ such that $|x - a| < \delta_2 \implies |f(x) - f(a)| < \delta_1$. Chaining: if $|x - a| < \delta_2$, then $|f(x) - f(a)| < \delta_1$, so $|g(f(x)) - g(f(a))| < \varepsilon$. Taking $\delta = \delta_2$ gives the continuity of $g \circ f$ at $a$. $\blacksquare$

The nested quantifier structure of $\varepsilon$-$\delta$ proofs is exactly what Schwarz's deck prepares students to handle: multiple arbitrary choices ("let $\varepsilon$"), witness-producing from existential statements ("there exists $\delta_1$"), chains of implications.

### 2.3 The completeness axiom at work

Many theorems about $\mathbb{R}$ that seem intuitively obvious are actually consequences of completeness:

- **Monotone convergence theorem:** every bounded monotone sequence in $\mathbb{R}$ converges.
- **Bolzano-Weierstrass theorem:** every bounded sequence in $\mathbb{R}$ has a convergent subsequence.
- **Intermediate value theorem:** a continuous function on $[a, b]$ takes every value between $f(a)$ and $f(b)$.
- **Heine-Borel theorem:** $[a, b]$ is compact.
- **Extreme value theorem:** a continuous function on a closed interval attains its supremum and infimum.

Each of these can be proved from completeness with the techniques in document 3 — mostly direct proof, occasional contradiction, and frequent $\varepsilon$-$\delta$ reasoning.

## 3. Sets and cardinality

### 3.1 Definitions

**Definition (subset).** $A \subseteq B$ iff $\forall x \, (x \in A \implies x \in B)$.

**Definition (set equality).** $A = B$ iff $A \subseteq B$ and $B \subseteq A$. (Schwarz slide 117.)

**Definition (union, intersection, difference, symmetric difference).**

- $A \cup B = \{x : x \in A \text{ or } x \in B\}$.
- $A \cap B = \{x : x \in A \text{ and } x \in B\}$.
- $A \setminus B = \{x : x \in A \text{ and } x \notin B\}$.
- $A \triangle B = (A \setminus B) \cup (B \setminus A)$.

**Definition (power set).** $\mathcal{P}(A) = \{S : S \subseteq A\}$.

**Definition (cartesian product).** $A \times B = \{(a, b) : a \in A, b \in B\}$.

**Definition (cardinality).** Two sets $A$ and $B$ have the same **cardinality**, $|A| = |B|$, iff there exists a bijection $f : A \to B$.

A set is **finite** if it has the same cardinality as $\{1, 2, \ldots, n\}$ for some $n \in \mathbb{N}$ (or is empty); **countably infinite** if it has the same cardinality as $\mathbb{N}$; **countable** if it is finite or countably infinite; **uncountable** otherwise.

### 3.2 Representative theorems

**Theorem.** $(A \cap B) \cup C = (A \cup C) \cap (B \cup C)$. (Schwarz slide 119.)

*Proof by two subset inclusions.*

($\subseteq$) Pick any $x \in (A \cap B) \cup C$. We show $x \in (A \cup C) \cap (B \cup C)$.

Case 1: $x \in A \cap B$. Then $x \in A$, so $x \in A \cup C$. Also $x \in B$, so $x \in B \cup C$. Therefore $x \in (A \cup C) \cap (B \cup C)$.

Case 2: $x \in C$. Then $x \in A \cup C$ and $x \in B \cup C$, so $x \in (A \cup C) \cap (B \cup C)$.

Either way, $(A \cap B) \cup C \subseteq (A \cup C) \cap (B \cup C)$.

($\supseteq$) Pick any $x \in (A \cup C) \cap (B \cup C)$. We show $x \in (A \cap B) \cup C$. (This is the direction Schwarz shows in detail on slide 108.)

Case 1: $x \in C$. Then $x \in (A \cap B) \cup C$.

Case 2: $x \notin C$. From $x \in A \cup C$, since $x \notin C$, $x \in A$. From $x \in B \cup C$, since $x \notin C$, $x \in B$. So $x \in A \cap B$, hence $x \in (A \cap B) \cup C$.

Either way, $(A \cup C) \cap (B \cup C) \subseteq (A \cap B) \cup C$.

By set equality via two subset inclusions, the two sets are equal. $\blacksquare$

**Theorem (De Morgan's laws for sets).** $(A \cup B)^c = A^c \cap B^c$ and $(A \cap B)^c = A^c \cup B^c$ (where complement is taken in some ambient universe).

*Proof of first law.*

$x \in (A \cup B)^c$ iff $x \notin A \cup B$ iff $\neg(x \in A \text{ or } x \in B)$ iff $x \notin A$ and $x \notin B$ iff $x \in A^c$ and $x \in B^c$ iff $x \in A^c \cap B^c$. $\blacksquare$

(This style of proof — a chain of iff's — is particularly efficient for set equalities that reduce to propositional equivalences. Schwarz's deck uses the more explicit two-direction style because it makes each step visible; the iff-chain style is more compact but can hide errors.)

**Theorem (Cantor's theorem).** For any set $A$, $|A| < |\mathcal{P}(A)|$.

*Proof.* First, $|A| \leq |\mathcal{P}(A)|$ because the map $a \mapsto \{a\}$ is an injection. So we need to show there is no bijection $A \to \mathcal{P}(A)$.

Suppose for contradiction that $f : A \to \mathcal{P}(A)$ is surjective. Define $D = \{a \in A : a \notin f(a)\}$. Since $D \subseteq A$, $D \in \mathcal{P}(A)$, so by surjectivity there exists $a_0 \in A$ with $f(a_0) = D$. Is $a_0 \in D$?

- If $a_0 \in D$, then by definition of $D$, $a_0 \notin f(a_0) = D$, contradiction.
- If $a_0 \notin D$, then $a_0$ satisfies the defining condition of $D$ ($a_0 \notin f(a_0) = D$), so $a_0 \in D$, contradiction.

Either way we reach a contradiction. So no surjection $A \to \mathcal{P}(A)$ exists, hence no bijection, hence $|A| < |\mathcal{P}(A)|$. $\blacksquare$

This is **Cantor's diagonal argument** (document 3, B.11) in its most general form. The specific case $A = \mathbb{N}$ gives $|\mathbb{N}| < |\mathcal{P}(\mathbb{N})| = |\mathbb{R}|$ — the real numbers are uncountable.

**Theorem (Cantor-Schröder-Bernstein).** If $|A| \leq |B|$ and $|B| \leq |A|$, then $|A| = |B|$. That is, if there exist injections $A \to B$ and $B \to A$, there exists a bijection $A \to B$.

The proof is subtle — a typical treatment uses the König lemma or a fixed-point argument. The theorem is useful because establishing two injections is often much easier than constructing a bijection directly.

### 3.3 Proof techniques on sets

The canonical pattern for set equality is the one Schwarz teaches: prove both $\subseteq$ directions by element-chasing. "Element-chasing" means picking an arbitrary $x \in A$ and tracing what it must satisfy, ending with $x \in B$.

Almost every set-theoretic proof in an undergraduate course reduces to this pattern plus case analysis on set membership ($x \in S$ vs. $x \notin S$). The logical backbone is disjunction elimination (∨E).

## 4. Functions and relations

### 4.1 Definitions

**Definition (function).** A function $f : A \to B$ is a rule assigning to each $a \in A$ a unique $b \in B$, written $f(a)$. Formally, a function is a subset $f \subseteq A \times B$ such that for every $a \in A$, there is exactly one $b \in B$ with $(a, b) \in f$.

**Definition (injection, surjection, bijection).**

- $f$ is **injective** (one-to-one) iff $\forall a_1, a_2 \, (f(a_1) = f(a_2) \implies a_1 = a_2)$.
- $f$ is **surjective** (onto) iff $\forall b \in B \, \exists a \in A \, (f(a) = b)$.
- $f$ is **bijective** iff injective and surjective.

**Definition (composition).** Given $f : A \to B$ and $g : B \to C$, the composition $g \circ f : A \to C$ is defined by $(g \circ f)(a) = g(f(a))$.

**Definition (inverse).** If $f : A \to B$ is a bijection, the **inverse** $f^{-1} : B \to A$ is the unique function such that $f^{-1}(f(a)) = a$ for all $a \in A$ and $f(f^{-1}(b)) = b$ for all $b \in B$.

**Definition (equivalence relation).** A relation $\sim$ on a set $A$ is an **equivalence relation** iff it is:
- Reflexive: $\forall a \, (a \sim a)$.
- Symmetric: $\forall a, b \, (a \sim b \implies b \sim a)$.
- Transitive: $\forall a, b, c \, (a \sim b \land b \sim c \implies a \sim c)$.

**Definition (equivalence class).** For $a \in A$, the equivalence class $[a] = \{b \in A : b \sim a\}$.

**Theorem (equivalence classes partition).** If $\sim$ is an equivalence relation on $A$, the equivalence classes form a partition of $A$: every element belongs to exactly one class.

*Proof sketch.* Every $a$ belongs to $[a]$ (by reflexivity). If $b \in [a] \cap [c]$, then $b \sim a$ and $b \sim c$; by symmetry and transitivity, $a \sim c$, so $[a] = [c]$ (any element of $[a]$ is equivalent to $a$, hence to $c$, hence in $[c]$; and conversely). So two classes are either equal or disjoint. Together with the fact that classes cover $A$, this gives a partition. $\blacksquare$

### 4.2 Representative theorems

**Theorem.** The composition of injections is an injection.

*Direct proof.* Let $f : A \to B$ and $g : B \to C$ be injective. Suppose $(g \circ f)(a_1) = (g \circ f)(a_2)$. Then $g(f(a_1)) = g(f(a_2))$. Since $g$ is injective, $f(a_1) = f(a_2)$. Since $f$ is injective, $a_1 = a_2$. Therefore $g \circ f$ is injective. $\blacksquare$

**Theorem.** If $f : A \to B$ and $g : B \to A$ satisfy $g \circ f = \text{id}_A$, then $f$ is injective.

*Direct proof.* Suppose $f(a_1) = f(a_2)$. Applying $g$: $g(f(a_1)) = g(f(a_2))$, i.e., $a_1 = a_2$ (using $g \circ f = \text{id}_A$). So $f$ is injective. $\blacksquare$

**Theorem.** Let $f : A \to B$ be a function. Then $f$ is bijective iff $f$ has a two-sided inverse.

*Proof.* ($\implies$) If $f$ is bijective, define $g : B \to A$ by $g(b) = $ the unique $a$ with $f(a) = b$ (unique because $f$ is injective; exists because $f$ is surjective). Check $f \circ g = \text{id}_B$ and $g \circ f = \text{id}_A$.

($\impliedby$) If $g \circ f = \text{id}_A$, then $f$ is injective (by the previous theorem). If $f \circ g = \text{id}_B$, then for any $b \in B$, $f(g(b)) = b$, so $g(b)$ is a pre-image of $b$, hence $f$ is surjective. Therefore $f$ is bijective. $\blacksquare$

## 5. Orders and ordinals

### 5.1 Definitions

**Definition (partial order).** A relation $\leq$ on a set $A$ is a **partial order** iff reflexive, antisymmetric ($a \leq b \land b \leq a \implies a = b$), and transitive.

**Definition (total order).** A partial order is **total** (or linear) iff every two elements are comparable: $\forall a, b \, (a \leq b \lor b \leq a)$.

**Definition (well-order).** A total order is a **well-order** iff every non-empty subset has a least element.

### 5.2 Representative theorems

**Theorem (well-ordering principle for $\mathbb{N}$).** The usual order on $\mathbb{N}$ is a well-order.

This is equivalent to the induction principle; the proof is a standard exercise.

**Theorem (Zorn's lemma).** If every chain in a partially ordered set $P$ has an upper bound, then $P$ contains a maximal element.

Zorn's lemma is equivalent to the axiom of choice and is used in many algebraic existence proofs (the existence of maximal ideals in rings, bases in vector spaces, algebraic closures). The proof is non-constructive and lives outside the pedagogical scope of Schwarz's deck, but it is a canonical use of the extremal principle (document 3, B.13).

## 6. Algebraic structures

### 6.1 Groups

**Definition (group).** A **group** is a pair $(G, \cdot)$ where $G$ is a set and $\cdot : G \times G \to G$ is an operation satisfying:

1. **Associativity:** $(a \cdot b) \cdot c = a \cdot (b \cdot c)$ for all $a, b, c \in G$.
2. **Identity:** there exists $e \in G$ such that $e \cdot a = a \cdot e = a$ for all $a$.
3. **Inverse:** for every $a \in G$, there exists $a^{-1} \in G$ with $a \cdot a^{-1} = a^{-1} \cdot a = e$.

**Theorem (uniqueness of identity).** A group has exactly one identity.

*Proof.* Suppose $e_1$ and $e_2$ are both identities. Consider $e_1 \cdot e_2$. Using $e_1$ as identity: $e_1 \cdot e_2 = e_2$. Using $e_2$ as identity: $e_1 \cdot e_2 = e_1$. Therefore $e_1 = e_2$. $\blacksquare$

A three-line proof, but it shows the whole pattern of algebra: starting from the axioms, deriving constraints, concluding uniqueness. This is **structural proof** — the objects are defined by axioms, and the reasoning proceeds by invoking those axioms one at a time.

**Theorem (uniqueness of inverse).** Each element of a group has a unique inverse.

*Proof.* Suppose $b$ and $c$ are both inverses of $a$. Then $b = b \cdot e = b \cdot (a \cdot c) = (b \cdot a) \cdot c = e \cdot c = c$. $\blacksquare$

**Theorem (left cancellation).** In a group, $a \cdot b = a \cdot c \implies b = c$.

*Proof.* Multiply both sides on the left by $a^{-1}$: $a^{-1} \cdot (a \cdot b) = a^{-1} \cdot (a \cdot c)$, i.e., $(a^{-1} \cdot a) \cdot b = (a^{-1} \cdot a) \cdot c$ by associativity, i.e., $e \cdot b = e \cdot c$, i.e., $b = c$. $\blacksquare$

### 6.2 Rings and fields

**Definition (ring).** A **ring** $(R, +, \cdot)$ is a set $R$ with two operations such that:

1. $(R, +)$ is an abelian group (written additively).
2. $\cdot$ is associative.
3. Distributivity: $a \cdot (b + c) = a \cdot b + a \cdot c$ and $(a + b) \cdot c = a \cdot c + b \cdot c$.

**Theorem.** In a ring, $a \cdot 0 = 0$ for every $a$.

*Proof.* $a \cdot 0 = a \cdot (0 + 0) = a \cdot 0 + a \cdot 0$. Subtracting $a \cdot 0$ from both sides (using the additive group structure), $0 = a \cdot 0$. $\blacksquare$

**Definition (field).** A **field** is a commutative ring in which every non-zero element has a multiplicative inverse. $\mathbb{Q}, \mathbb{R}, \mathbb{C}$ are fields; $\mathbb{Z}$ is a ring but not a field.

**Theorem (field has no zero divisors).** In a field, $ab = 0 \implies a = 0 \lor b = 0$.

*Proof by contradiction.* Suppose $ab = 0$ but $a \neq 0$ and $b \neq 0$. Then $a$ has an inverse $a^{-1}$. Multiplying: $b = 1 \cdot b = (a^{-1} a) b = a^{-1} (ab) = a^{-1} \cdot 0 = 0$, contradicting $b \neq 0$. $\blacksquare$

### 6.3 Vector spaces

**Definition (vector space).** A **vector space** over a field $F$ is an abelian group $(V, +)$ together with a scalar multiplication $F \times V \to V$ satisfying four axioms (associativity, distributivity over vector addition, distributivity over scalar addition, identity). The elements of $V$ are vectors, the elements of $F$ are scalars.

**Theorem (uniqueness of zero vector).** The zero vector $0 \in V$ is unique.

*Proof.* Same structural argument as for groups. If $0_1$ and $0_2$ are both additive identities, then $0_1 = 0_1 + 0_2 = 0_2$. $\blacksquare$

**Theorem (scalar times zero is zero).** For any $c \in F$, $c \cdot 0_V = 0_V$.

*Proof.* $c \cdot 0_V = c \cdot (0_V + 0_V) = c \cdot 0_V + c \cdot 0_V$. Subtracting $c \cdot 0_V$ from both sides, $0_V = c \cdot 0_V$. $\blacksquare$

**Theorem (linear independence of eigenvectors with distinct eigenvalues).** Let $T : V \to V$ be a linear transformation and $v_1, v_2, \ldots, v_n$ eigenvectors of $T$ with distinct eigenvalues. Then $v_1, v_2, \ldots, v_n$ are linearly independent.

*Proof by strong induction on $n$.* Base case $n = 1$: a single nonzero vector is linearly independent. Inductive step: assume the claim for $n - 1$. Suppose $c_1 v_1 + c_2 v_2 + \cdots + c_n v_n = 0$. Apply $T$: $c_1 \lambda_1 v_1 + \cdots + c_n \lambda_n v_n = 0$. Multiply the original equation by $\lambda_n$: $c_1 \lambda_n v_1 + \cdots + c_n \lambda_n v_n = 0$. Subtract: $c_1 (\lambda_1 - \lambda_n) v_1 + c_2 (\lambda_2 - \lambda_n) v_2 + \cdots + c_{n-1} (\lambda_{n-1} - \lambda_n) v_{n-1} = 0$. By the induction hypothesis, the $v_i$'s for $i < n$ are linearly independent, so each $c_i (\lambda_i - \lambda_n) = 0$ for $i < n$. Since $\lambda_i \neq \lambda_n$, we get $c_i = 0$ for $i < n$. Substituting back into the original, $c_n v_n = 0$, and since $v_n \neq 0$, $c_n = 0$. All coefficients vanish, so the vectors are linearly independent. $\blacksquare$

### 6.4 Proof techniques on algebraic structures

Algebraic proofs have a distinctive flavor:

- **Axioms as hypotheses.** The structure is defined by axioms; every proof invokes those axioms.
- **Structural induction on expressions.** When proving things about terms or formulas built from the structure's operations, structural induction is natural.
- **Uniqueness by "assume two, show equal".** The identity/inverse uniqueness proofs above are the template.
- **Cancellation, associativity, commutativity.** These become invisible steps once students are fluent — a move like "$(ab)c^{-1} = a(bc^{-1})$" is not separately justified.

## 7. Combinatorics and number theory

**Theorem.** For any integer $n \geq 1$, $\sum_{k=1}^{n} k = n(n+1)/2$. (Document 3, B.4.)

**Theorem.** For any integer $n \geq 1$, $\sum_{k=1}^{n} k^2 = n(n+1)(2n+1)/6$.

**Theorem (Pascal's identity).** $\binom{n}{k} + \binom{n}{k-1} = \binom{n+1}{k}$.

*Combinatorial proof.* The right side counts subsets of size $k$ from $\{1, 2, \ldots, n+1\}$. Split by whether $n + 1$ is included: if yes, the remaining $k - 1$ elements form a subset of $\{1, \ldots, n\}$, giving $\binom{n}{k-1}$; if no, the $k$ elements form a subset of $\{1, \ldots, n\}$, giving $\binom{n}{k}$. Adding: $\binom{n}{k-1} + \binom{n}{k} = \binom{n+1}{k}$. $\blacksquare$

**Theorem (Bertrand's postulate).** For any integer $n \geq 1$, there is a prime $p$ with $n < p \leq 2n$.

The proof (Chebyshev 1852, Erdős's elementary proof 1932) is too involved to include here but is a canonical example of mixing number theory, combinatorics, and analytic estimates.

## 8. What Schwarz's deck prepares you for

The deck teaches proofs about even/odd and about sets. The techniques it introduces — direct proof, definition-citation, arbitrary choices, case analysis, two-direction subset containment — are the same techniques that drive all the structures in this document. The difference is that the objects become richer:

- Integers → real numbers (with $\varepsilon$-$\delta$ arguments and completeness).
- Sets → functions and relations (with composition and equivalence classes).
- Functions → algebraic structures (with axiom-driven reasoning).
- Algebraic structures → vector spaces, modules, categories (with higher-level abstractions).

The progression is one of **abstraction**, not of proof technique. The same direct/contradiction/induction/construction techniques apply throughout. What changes is what you can say about the objects and what definitions you need to invoke.

## 9. Further reading

### Standard undergraduate references

- **Number theory:** Niven, I., Zuckerman, H. S., & Montgomery, H. L. (1991). *An Introduction to the Theory of Numbers* (5th ed.). Wiley. The standard reference.
- **Real analysis:** Rudin, W. (1976). *Principles of Mathematical Analysis* (3rd ed.). McGraw-Hill. Famously terse; pair with a gentler first pass.
- **Real analysis (gentler):** Abbott, S. (2015). *Understanding Analysis* (2nd ed.). Springer.
- **Set theory:** Halmos, P. (1974). *Naive Set Theory*. Springer. Short, classic.
- **Abstract algebra:** Dummit, D. S., & Foote, R. M. (2003). *Abstract Algebra* (3rd ed.). Wiley. The comprehensive reference.
- **Abstract algebra (gentler):** Herstein, I. N. (1996). *Abstract Algebra* (3rd ed.). Wiley.
- **Linear algebra:** Axler, S. (2015). *Linear Algebra Done Right* (3rd ed.). Springer.
- **Combinatorics:** Stanley, R. P. (2011). *Enumerative Combinatorics*, Vol. 1 (2nd ed.). Cambridge University Press.

### Books that emphasize proof craft

- Aigner, M., & Ziegler, G. M. (2018). *Proofs from THE BOOK* (6th ed.). Springer. A compendium of the most elegant proofs known.
- Hardy, G. H., & Wright, E. M. (2008). *An Introduction to the Theory of Numbers* (6th ed.). Oxford. Classic; filled with beautifully written proofs.

## Cross-references within this mission

- **Document 3** provides the technique catalog applied throughout this document.
- **Document 5** discusses how to write proofs about these structures in readable prose.
- **Document 6** treats how each algebraic and analytic structure is formalized in proof assistants (e.g., the Mathlib algebra and analysis libraries).

---

## Study Guide — Proofs on Mathematical Structures

### Prerequisites

- Document 2 (logic and language) — quantifiers and their negation are used constantly.
- Document 3 (techniques catalog) — every proof in this document uses one or more cataloged techniques.
- High-school algebra for section 1 (integers). First-year calculus for section 2 (reals). Set notation for section 3. No prerequisites beyond curiosity for sections 4–7 — the definitions are self-contained.

### Reading order by structure

This document is a reference, not a linear text. Jump to the structure you're working on.

| Your current course | Start here |
|---|---|
| Transition to proof / discrete math | Section 1 (integers) → section 3 (sets) → section 4 (functions/relations) |
| Real analysis | Section 2 (reals and analysis) — pair with Abbott or Rudin |
| Abstract algebra | Section 6 (algebraic structures) — pair with Dummit & Foote or Herstein |
| Linear algebra | Section 6.3 (vector spaces) — pair with Axler |
| Combinatorics | Section 7 (combinatorics and number theory) |

### Key vocabulary per structure

**Integers:** divides ($a \mid b$), even, odd, prime, composite, gcd, congruence modulo $m$, Bézout's identity.

**Reals:** rational, irrational, supremum, infimum, completeness, $\varepsilon$-$\delta$, continuous, convergent, Cauchy sequence, Archimedean property.

**Sets:** subset ($\subseteq$), union ($\cup$), intersection ($\cap$), complement, power set ($\mathcal{P}$), cardinality, countable, uncountable, bijection.

**Algebraic:** group, abelian, identity, inverse, ring, field, vector space, linear independence, subgroup, ideal, homomorphism, isomorphism.

### Study plans

**1-week sprint (integers + sets).** Prove: (a) transitivity of divides, (b) $\gcd(a, b) = \gcd(b, a \bmod b)$ (Euclidean algorithm correctness), (c) De Morgan's law for sets, (d) the power set of a 3-element set has 8 elements. Four proofs, four structures.

**1-month deep dive (add reals + algebra).** Add: (e) $\sqrt{2}$ is irrational, (f) the Archimedean property, (g) uniqueness of group identity, (h) every field has no zero divisors. Read Abbott's *Understanding Analysis* chapters 1–2 alongside section 2. Read Herstein's *Abstract Algebra* chapter 2 alongside section 6.

**6-month mastery.** Work through one complete textbook per structure: Niven/Zuckerman/Montgomery for number theory, Rudin for analysis, Dummit & Foote for algebra, Axler for linear algebra. For each chapter, identify the proof techniques used (cross-reference document 3). Maintain a "proof journal" — one page per proof, recording the theorem, the technique, and the key insight.

---

## TRY Session — Implement the Euclidean Algorithm and Prove It Correct

**Duration:** 30 minutes.
**Materials:** Python (or pen and paper).

**Steps:**

1. Implement the Euclidean algorithm:
   ```python
   def gcd(a, b):
       while b != 0:
           a, b = b, a % b
       return a
   ```
2. Run it on `gcd(48, 18)` by hand. Write out each step: `(48, 18) → (18, 12) → (12, 6) → (6, 0)`. Answer: 6.
3. Now prove correctness. The key lemma is: $\gcd(a, b) = \gcd(b, a \bmod b)$. Prove this by showing that any common divisor of $a$ and $b$ is also a common divisor of $b$ and $a \bmod b$, and vice versa.
4. Prove termination: the second argument strictly decreases at each step ($a \bmod b < b$), so by well-ordering, the algorithm terminates.

**What to observe:** You just proved a program correct using mathematical techniques. The termination proof uses the well-ordering principle (document 3, B.7). The correctness proof is a direct proof on the divisibility structure (section 1). Algorithm and proof are partners.

---

## TRY Session — Build a Group From Scratch

**Duration:** 20 minutes.
**Materials:** Pen and paper.

**Steps:**

1. Consider the set $\{0, 1, 2, 3\}$ with the operation $a \oplus b = (a + b) \bmod 4$. Verify the group axioms:
   - Closure: for any $a, b \in \{0,1,2,3\}$, $a \oplus b \in \{0,1,2,3\}$. (Why?)
   - Associativity: $(a \oplus b) \oplus c = a \oplus (b \oplus c)$. (Follows from associativity of integer addition.)
   - Identity: $0 \oplus a = a \oplus 0 = a$. (Check.)
   - Inverse: the inverse of $a$ is $4 - a \bmod 4$. Verify for each element.
2. Write out the complete $4 \times 4$ Cayley table (group multiplication table).
3. Now prove: in this group, every element is its own inverse iff the group has exponent 2. Is $\mathbb{Z}/4\mathbb{Z}$ of exponent 2? (No — $1 \oplus 1 = 2 \neq 0$.)
4. Find a group of order 4 where every element IS its own inverse. (Answer: $\mathbb{Z}/2\mathbb{Z} \times \mathbb{Z}/2\mathbb{Z}$, the Klein four-group.)

**What to observe:** Axiom-checking is *verification*, not *proof*. But the verification builds the muscle memory of invoking axioms one at a time — the same muscle used in abstract proofs like section 6.1's uniqueness-of-identity theorem.

---

## DIY — The Number Theory Proof Portfolio

**Scope:** 1–2 weeks.
**Deliverable:** A portfolio of 8 proofs on integers, each 1/2 to 1 page.

| # | Theorem | Technique hint |
|---|---|---|
| 1 | $a \mid b$ and $a \mid c$ implies $a \mid (bx + cy)$ for any integers $x, y$. | Direct |
| 2 | If $n^2$ is divisible by 3, then $n$ is divisible by 3. | Contrapositive or cases ($n \bmod 3$) |
| 3 | There are infinitely many primes of the form $4k + 3$. | Contradiction (variant of Euclid) |
| 4 | For every $n \geq 1$, $\sum_{k=1}^n k^3 = \left(\sum_{k=1}^n k\right)^2$. | Induction |
| 5 | Every integer can be written in base 2. | Strong induction |
| 6 | $a \equiv b \pmod{m}$ implies $a^n \equiv b^n \pmod{m}$ for all $n \geq 1$. | Induction + congruence arithmetic |
| 7 | Fermat's little theorem: $a^p \equiv a \pmod{p}$ for prime $p$. | Multiple approaches possible |
| 8 | There is no integer solution to $x^2 + y^2 = 4k + 3$. | Cases on parity of $x, y$ |

---

## DIY — Set-Theoretic Distributive Laws

**Scope:** 2–3 hours.
**Deliverable:** Complete proofs of all four distributive laws.

Prove each using element-chasing (both $\subseteq$ directions):

1. $A \cap (B \cup C) = (A \cap B) \cup (A \cap C)$
2. $A \cup (B \cap C) = (A \cup B) \cap (A \cup C)$ (this is Schwarz's slide 119)
3. $A \cap (B \triangle C) = (A \cap B) \triangle (A \cap C)$
4. $A \times (B \cup C) = (A \times B) \cup (A \times C)$

For each, also write the proof as a chain of iff's (the compact style from section 3.2) and compare readability with the two-direction style.

---

## College & Rosetta Deep Links

### Department connections

| College Department | Concept ID | Connection |
|---|---|---|
| **Math** | `math-number-cardinality` | Section 3 (cardinality, Cantor's theorem, countable vs. uncountable) |
| **Math** | `math-operations-meaning` | Section 1 (divisibility as an operation, modular arithmetic) |
| **Math** | `math-functions` | Section 4 (injections, surjections, bijections, composition, inverse) |
| **Math** | `math-variables-unknowns` | All sections — variables in proofs ARE unknowns being reasoned about |
| **Math** | `math-equations-expressions` | Section 1.3 (congruence equations), section 6 (algebraic identities) |
| **Math** | `math-complex-numbers` | Section 2 connects via completeness; section 6 extends to fields including $\mathbb{C}$ |
| **Math** | `math-euler-formula` | Section 6.2 (fields) — Euler's formula lives in $\mathbb{C}$, which is a field |
| **Mathematics** | `math-trig-functions` | Section 2 (real analysis) — trig functions are continuous on $\mathbb{R}$; their properties are proved by $\varepsilon$-$\delta$ |
| **Logic** | `log-formal-proof-systems` | Every proof in this document is formally a derivation in ZFC |
| **Logic** | `log-predicate-logic` | Every definition in section 1–6 is a predicate-logic formula |
| **Statistics** | (distributions, counting) | Section 7 (combinatorics) — binomial coefficients underlie the binomial distribution |

### Rosetta panel routes

- **Python panel:** Section 1 maps to Python `sympy` number-theory functions (`gcd`, `isprime`, `factorint`). Section 3 maps to Python `set` operations. Section 6 maps to `numpy` linear algebra. Each structure in this document has a Python computational counterpart.
- **C++ panel:** Section 6 (algebraic structures) maps to C++ templates — a C++ `Group<T>` template is a computational realization of the group axioms.
- **Fortran panel:** Section 2 (real analysis) — Fortran's numerical computing origins connect directly to real-number computation. IEEE 754 floating-point is a computational approximation of $\mathbb{R}$.
- **Lisp panel:** Section 3 (sets) — Lisp's native list operations (`union`, `intersection`, `set-difference`) implement the set operations exactly. Section 6.3 (vector spaces) maps to Lisp vector arithmetic.
- **Pascal panel:** Section 7 (Pascal's identity for binomial coefficients) — named after Blaise Pascal, who also influenced the programming language. The triangle connecting math and programming is literal.

### Cross-department threads

- **Math → Logic → Coding:** Every algebraic structure (group, ring, field) has a formal definition (Logic), a set of theorems (Math), and a computational implementation (Coding). The thread runs through all three departments simultaneously.
- **Math → Physics → Engineering:** The structures in section 6 are the language of physics. Groups describe symmetries, vector spaces describe states, fields describe scalars. A student who masters algebraic proof is ready for theoretical physics.
- **Math → Statistics → Data Science:** Section 7's combinatorics underlies probability theory, which underlies statistics, which underlies data science. The chain from binomial coefficients to machine learning passes through every link.
- **Math → Economics → Business:** Section 1.3 (modular arithmetic) underlies cryptography, which underlies digital commerce. Fermat's little theorem is used in RSA encryption.
