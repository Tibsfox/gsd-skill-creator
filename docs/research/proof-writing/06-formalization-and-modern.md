# 06 — Formalization and Modern Machine-Checked Proof

> **Schwarz deck, slide 2** — *"We will synthesize definitions, intuitions, and conventions."*

Schwarz's deck teaches the proof conventions a working mathematician uses. This document is about what happens when the conventions become strict enough that a *computer* can check them. The result is a parallel tradition of mathematics — machine-checked, formalized, type-theoretic — that has grown from a curiosity in the 1970s into a serious alternative to the paper tradition in the 2020s.

This document covers: the history of proof assistants, the logical foundations they use, the major systems in use in 2026 (Lean, Coq, Isabelle/HOL, Agda, Mizar, HOL Light), the Mathlib project and the formalization of undergraduate mathematics, the landmark formalization successes (four-color theorem, odd-order theorem, Kepler conjecture, Liquid Tensor Experiment), and what the craft of writing a formalized proof looks like in 2026.

## 1. Why formalize?

A working mathematician writes a proof in the conventions of document 5: prose, citations, implicit steps, "mugga mugga"-readable paragraphs. The reader — a competent peer — fills in gaps from domain knowledge.

This works remarkably well. It has produced essentially all of mathematics. But it has three known failure modes:

### 1.1 Proofs that turn out to be wrong

Peer review catches most errors, but not all. Famous examples:

- **Kempe's 1879 "proof" of the four-color theorem** was accepted for eleven years before Percy Heawood found a flaw in 1890. The flaw could not be repaired by simple patches, and the theorem remained open for another 86 years.
- **Italian school of algebraic geometry (early 20th century).** The 1900s–1930s Italian tradition (Severi, Castelnuovo, Enriques) produced brilliant but sometimes non-rigorous work; many of their results had to be re-proved (sometimes showing the original claims were wrong, sometimes that they were right but for different reasons) by Zariski, Weil, and Grothendieck in the 1940s–60s.
- **Classification of finite simple groups** (1960s–1980s). The original proof spans more than 10,000 pages across hundreds of papers by dozens of authors. Aschbacher and Smith's 2004 *Quasithin Groups* (1,221 pages) was a late-arriving part. The community has high confidence that the classification is correct, but no single person has verified every step, and at least one significant gap was identified and filled after publication.
- **Voevodsky's discovery (2013).** Vladimir Voevodsky, a Fields Medalist, publicly announced that he had found an error in one of his 1990s papers that he had been unable to fix by conventional methods. His subsequent work (on univalent foundations and homotopy type theory) was motivated in part by this experience.

### 1.2 Proofs that are so long no human can verify every step

The four-color theorem's 1976 proof (Appel & Haken) reduces the problem to about 1,900 cases checked by computer. The Kepler conjecture's original proof (Hales, 1998) is several hundred pages plus gigabytes of computer code. The classification of finite simple groups totals over 10,000 pages. No individual mathematician can check all of this. Confidence rests on distributed verification and consistency with other results.

### 1.3 Proofs whose background depends on huge amounts of other unchecked work

Modern algebraic geometry, for instance, rests on Grothendieck's SGA and EGA (thousands of pages of technical foundations written in the 1960s). Any current paper in the field silently assumes all of this is correct. If a subtle error existed at the foundation, it could propagate through decades of subsequent work without detection.

### 1.4 The response — formalization

The dream of formalization is to make every step checkable by a machine. If a proof is expressed in a formal language that a computer can parse, and the computer can verify that every step follows the rules, then (up to the correctness of the computer and the verification software) the proof is certain.

Hilbert's program (document 1) was the original version of this dream. Gödel's incompleteness theorems showed the dream could not be *fully* realized — mathematics cannot be captured in a single complete formal system — but they didn't prevent the weaker goal of mechanically checking any *given* proof. That weaker goal is achievable, and in 2026 is being pursued at increasing scale.

## 2. The history of proof assistants

### 2.1 Automath (de Bruijn, 1967)

The first proof checker. Nicolaas Govert de Bruijn at Eindhoven designed a language called Automath in which mathematics could be written in a form that a computer could check line by line. Jutting used Automath in 1977 to check Edmund Landau's *Grundlagen der Analysis* (Foundations of Analysis) — the first formalization of a substantial mathematical text.

### 2.2 LCF (Milner, 1972)

At Edinburgh, Robin Milner and his group built LCF (Logic for Computable Functions), introducing the idea of a **kernel**: a small, trusted core that implements the rules of inference, plus a larger untrusted layer where "tactics" (programs that generate proofs) are written. The kernel approach is the foundation of almost every modern proof assistant: you only have to trust the kernel, which is small enough to audit by hand.

LCF's implementation language, ML, was invented for this purpose and went on to become a major programming language family.

### 2.3 HOL (Gordon, 1988) and Isabelle (Paulson, 1989)

Mike Gordon at Cambridge created HOL (Higher-Order Logic), an LCF-style system based on Church's simple theory of types. Lawrence Paulson, also at Cambridge, created Isabelle, a generic proof assistant that could host many logics (including HOL, but also ZFC and first-order logic).

Isabelle/HOL — Isabelle instantiated with HOL — remains one of the most widely used proof assistants today, especially for software and hardware verification.

### 2.4 Coq (Coquand & Huet, 1984)

Thierry Coquand and Gérard Huet at INRIA developed the Calculus of Constructions, a dependent type theory, and built Coq (originally CoC) on top of it. Coq's key innovation was the *Curry-Howard correspondence* taken seriously: propositions are types, and proofs are programs, and the kernel checks that the program has the claimed type.

Coq is now (2026) over 40 years old and has been used for major formalizations including the four-color theorem (Gonthier, 2005) and the odd-order theorem (Gonthier et al., 2012).

### 2.5 Mizar (Trybulec, 1973)

Andrzej Trybulec's Mizar system, developed in Poland, took a different approach: use a declarative proof language resembling informal mathematics, backed by an automated checker. Mizar's **Journal of Formalized Mathematics** has been publishing machine-checked theorems since 1990.

Mizar's influence on modern proof assistants is quieter than LCF's, but its insistence that the proof language should *read like mathematics* has shaped the design of every declarative style that followed.

### 2.6 Agda (Norell, 2007)

Ulf Norell's Agda, developed at Chalmers, is a dependently typed programming language that doubles as a proof assistant. Like Coq, it is based on the Curry-Howard correspondence. Agda's interactive mode is famous for "hole-driven development" — you write the type you want to prove, leave holes in the term, and ask Agda what type each hole needs. The system fills in types as you go.

### 2.7 Lean (de Moura, 2013)

Leonardo de Moura at Microsoft Research started Lean in 2013 with the explicit goal of building a proof assistant that working mathematicians would use. Lean went through three major iterations:

- **Lean 2 (2013).** Proof of concept.
- **Lean 3 (2017).** The version that attracted the first wave of mathematicians. The Mathlib community formed around Lean 3.
- **Lean 4 (2021).** Complete redesign using Lean itself as the meta-language. Faster, more extensible, and the current target as of 2026.

Lean 4 is the center of gravity of the 2020s formalization movement, and Mathlib — the Lean mathematical library — is the largest collaborative mathematics formalization project in history.

## 3. Logical foundations of proof assistants

Different proof assistants use different foundational logics. The choice matters because it determines what can be expressed and what can be automated.

### 3.1 Simple type theory (HOL, Isabelle/HOL)

Church's simple type theory has a base set of types (typically $o$ for truth values and $\iota$ for individuals) and function types ($\alpha \to \beta$). Quantifiers range over typed variables; every term has a unique type; and the logic is higher-order (you can quantify over functions, predicates, sets).

Advantages: well-understood, compact semantic model, excellent automation support (HOL Light's kernel is under 500 lines).

Disadvantages: no dependent types, so expressing things like "vectors of length $n$" requires tricks.

### 3.2 Dependent type theory (Coq, Agda, Lean)

In dependent type theory, types can depend on values. "Vector of length $n$" is a type $\text{Vec}(A, n)$ where $n$ is a natural number. Functions can take values and return types ($n \mapsto \text{Vec}(A, n)$), and types can be returned by pattern-matching on values.

The system used by Coq, Agda, and Lean is called the **Calculus of Inductive Constructions (CIC)** in Coq's case or variants thereof. It is rich enough to express every theorem of mainstream mathematics, and its underlying theory is constructive (no law of excluded middle by default, but LEM can be added as an axiom when needed).

Advantages: vastly more expressive than simple type theory; supports "propositions as types" directly; allows programs and proofs to share the same type system.

Disadvantages: the kernel is more complex; type-checking is more expensive; learning curve is steeper.

### 3.3 ZFC-style set theory (Mizar, Metamath)

A few systems formalize all of mathematics inside first-order logic plus the ZFC axioms — essentially, the foundation that document 1 described. Mizar and Metamath are the largest examples.

Advantages: very close to the working mathematician's informal foundation; every theorem proved is formally a theorem of ZFC.

Disadvantages: no type discipline, so the system cannot distinguish "a group" from "a set of three elements with a binary operation"; more prone to unintended overloading of notation.

### 3.4 Homotopy type theory / univalent foundations

A relative newcomer. HoTT (homotopy type theory) adds to dependent type theory the **univalence axiom** — roughly, that equivalent types are equal — and reinterprets identity types as paths in a topological space. This leads to a foundation where mathematical structures and their isomorphisms are handled natively, solving some longstanding annoyances in formalization.

HoTT is still partly experimental but has attracted significant attention. Voevodsky's motivation for HoTT came from his experience with the formalization gaps in his own work.

## 4. Mathlib and the formalization of undergraduate mathematics

The single most important development in 2020s formalization is the growth of **Mathlib**, the Lean mathematical library. As of early 2026, Mathlib contains over 1.5 million lines of Lean code formalizing:

- Linear algebra (vectors, matrices, eigenvalues, diagonalization, tensor products).
- Abstract algebra (groups, rings, fields, modules, ideals, Galois theory).
- Topology (point-set topology, metric spaces, uniform spaces, continuity, compactness).
- Real and complex analysis (limits, derivatives, integrals, differential equations, measure theory).
- Number theory (unique factorization, Dirichlet series, zeta functions, basic analytic number theory).
- Category theory (limits, colimits, adjunctions, monoidal categories).
- Algebraic geometry (schemes, sheaves, cohomology — still being filled in).

Mathlib is written collaboratively by hundreds of contributors across dozens of countries. Every pull request is reviewed for correctness, style, and consistency. The review process enforces a craft discipline analogous to (but more mechanical than) the traditional referee system.

### 4.1 What does a Lean 4 proof look like?

Schwarz's first proof — if $n$ is even then $n^2$ is even — in Lean 4 (Mathlib-style) looks roughly like:

```lean
theorem even_sq_of_even (n : ℤ) (hn : Even n) : Even (n^2) := by
  obtain ⟨k, hk⟩ := hn
  exact ⟨2 * k^2, by rw [hk]; ring⟩
```

Line by line:

- `theorem even_sq_of_even` — name of the theorem.
- `(n : ℤ)` — take an integer $n$.
- `(hn : Even n)` — and a hypothesis that $n$ is even.
- `: Even (n^2)` — the conclusion is that $n^2$ is even.
- `:= by` — what follows is a proof given as a sequence of tactics.
- `obtain ⟨k, hk⟩ := hn` — destructure the evidence that $n$ is even into a witness $k$ and a proof $hk : n = 2 \cdot k$ (this is the ∃E step — naming the witness).
- `exact ⟨2 * k^2, by rw [hk]; ring⟩` — produce a witness $2k^2$ along with a proof that $n^2 = 2 \cdot (2k^2)$, which is established by rewriting using $hk$ and then calling the `ring` tactic for the algebraic verification.

The three-line Lean proof corresponds directly to Schwarz's prose proof. Each informal step has a formal counterpart:

| Informal (Schwarz) | Formal (Lean 4) |
|---|---|
| "Let $n$ be an even integer." | `(n : ℤ) (hn : Even n)` in the theorem statement |
| "Since $n$ is even, there is some integer $k$ such that $n = 2k$." | `obtain ⟨k, hk⟩ := hn` |
| "This means $n^2 = (2k)^2 = 4k^2 = 2(2k^2)$." | `rw [hk]; ring` |
| "From this, we see that there is an integer $m$ (namely, $2k^2$) where $n^2 = 2m$." | The witness `2 * k^2` in the anonymous constructor |
| "Therefore, $n^2$ is even." | The `exact` closes the goal `Even (n^2)` |

The Lean proof is about the same length as the prose proof, but *every step is machine-checked*. The `ring` tactic verifies the algebra; the `obtain` destructuring verifies that $n$ has the form $2k$; the outer constructor verifies that $2k^2$ is indeed a valid witness for $n^2$ being even.

### 4.2 Tactics — the formal analogue of proof techniques

Proof techniques (document 3) become **tactics** in a proof assistant. Each technique has a corresponding tactic, often named after it:

| Proof technique | Lean 4 tactic (examples) |
|---|---|
| Direct proof (introduce and apply) | `intro`, `exact`, `apply` |
| Case analysis | `cases`, `rcases`, `obtain` |
| Induction | `induction`, `strong_induction` |
| Contradiction | `exfalso`, `contradiction`, `absurd` |
| Contrapositive | `contrapose`, `contrapose!` |
| Existence by construction | `refine ⟨_, _⟩`, `use` |
| Universal introduction | `intro` |
| Rewriting with an equality | `rw` |
| Algebraic simplification | `ring`, `ring_nf`, `linarith` |
| Propositional simplification | `simp`, `decide` |
| Call an automated prover | `omega`, `polyrith`, `nlinarith` |

Learning to use a proof assistant is, in part, learning to translate the informal technique into the formal tactic. The translation is usually straightforward for simple proofs but can become an art for complex ones.

### 4.3 The Mathlib naming convention

Mathlib enforces a strict naming convention designed to make theorem names *searchable*. The name of a theorem describes its statement in a predictable format:

- `add_comm` — "addition is commutative."
- `mul_add` — "multiplication distributes over addition."
- `one_lt_two` — "one is less than two."
- `Nat.succ_lt_succ` — "in `Nat`, if $a < b$ then $\text{succ}(a) < \text{succ}(b)$."

The rules are documented; hundreds of pages of naming conventions exist. The payoff is that a mathematician who knows the conventions can guess the name of the theorem they want and find it without searching the documentation. This is craft, formalized and enforced at the library level.

## 5. Landmark formalization projects

### 5.1 The four-color theorem (Gonthier, 2005)

The Kempe–Appel–Haken proof of the four-color theorem had been controversial because it relied on computer checking of ~1,900 cases. In 2005, Georges Gonthier and his team formalized the entire proof in Coq, including both the combinatorial argument and the case checking. The Coq formalization is substantially more rigorous than the original: every step, including the computer-checked cases, is verified by the Coq kernel.

### 5.2 The odd-order theorem (Gonthier et al., 2012)

The Feit-Thompson theorem — every finite group of odd order is solvable — is one of the cornerstones of the classification of finite simple groups. The original 1963 proof by Feit and Thompson is 255 pages of dense finite group theory. In 2012, Gonthier led a team that formalized the entire proof in Coq, running to about 150,000 lines. This was the first time a full research-grade result of comparable difficulty had been formalized.

The formalization took approximately 6 years of effort across a team that eventually grew to 15 contributors. The team built up the required background (substantial parts of group theory and character theory) as Coq libraries as they went.

### 5.3 The Kepler conjecture (Hales et al., 2014)

Thomas Hales's original 1998 proof of the Kepler conjecture consisted of several hundred pages of arguments plus about 3 gigabytes of computer code. When Hales submitted it to *Annals of Mathematics*, the referees eventually concluded that they were 99% certain the proof was correct but could not fully verify it. Hales launched the **Flyspeck project** in 2003 to formalize the entire proof, and it was completed in 2014 using a combination of HOL Light and Isabelle.

The Flyspeck formalization produced a machine-checked version of the proof, including the numerical computations, such that the correctness of the proof depends only on the correctness of the HOL Light and Isabelle kernels. The Kepler conjecture became the first *Annals*-level result whose proof was fully formalized.

### 5.4 The Liquid Tensor Experiment (2020–2022)

Peter Scholze's *Liquid Tensor Experiment* (LTE) is the most dramatic formalization story of the 2020s. Scholze had developed a theory — condensed mathematics — that rested on a technical theorem about ext groups of "liquid modules." Scholze himself wrote a blog post in 2020 saying that he was *uncertain* whether his proof was correct:

> "I think this is the most important theorem I have proven. I think that with this theorem, the theory of liquid vector spaces will be a cornerstone of much of what I have done, and a cornerstone of what Dustin Clausen and I will do."
>
> "I still don't know whether the proof is correct, and I don't think any other mathematician has read and understood it."

Scholze challenged the Lean community to formalize the key theorem. A team led by Johan Commelin and Adam Topaz accepted the challenge. Eighteen months later, in July 2022, the formalization was complete. The theorem is correct.

This was a watershed moment. For the first time, a formal proof assistant verified a cutting-edge research result whose correctness the human author had doubts about, *in time to be useful for the mathematician's research program*. The formalization did not delay the research — it accelerated it.

### 5.5 The sphere eversion project (2023)

In 2023, a team formalized in Lean 4 the theorem that the sphere can be turned inside out in three dimensions through a continuous deformation (sphere eversion). This is a classical result of differential topology (Smale, 1958) whose original proof is extremely non-intuitive — the formalization required developing significant infrastructure for differential topology in Mathlib. It is one of the more complex topology results formalized to date.

### 5.6 Polynomial Freiman–Ruzsa conjecture (2023–)

In late 2023, Terence Tao and collaborators announced a proof of the polynomial Freiman-Ruzsa conjecture, a longstanding problem in additive combinatorics. Within weeks, a Lean formalization of the proof was underway, with Tao himself contributing to it. The formalization was completed in a few weeks — dramatically faster than previous landmark formalizations — because Mathlib's infrastructure had by then grown to cover much of the needed background, and because the Lean community had become expert at rapid formalization of research papers.

Tao has subsequently written several high-profile blog posts advocating formalization as a new standard of rigor for research mathematics.

## 6. The craft of writing formalized proofs

Writing a proof in Lean (or Coq, or Isabelle) is a different craft discipline from writing a prose proof. Some key differences:

### 6.1 Nothing is implicit

In a prose proof, you silently assume the reader knows the definition of a group, the associativity of multiplication, and the names of basic theorems. In Lean, *nothing is assumed*. If you want to use associativity, you have to invoke a specific lemma (e.g., `mul_assoc`). If you want to assume a set is finite, you have to supply the finiteness proof as an explicit argument.

This is the opposite of the "mugga mugga" discipline. In prose, the conventions are tacit; in Lean, they are explicit.

### 6.2 The library is the dictionary

When you write a prose proof, your vocabulary is "everything I remember from textbooks." When you write a Lean proof, your vocabulary is "everything currently in Mathlib." If a theorem you need isn't in Mathlib, you have to prove it first (and consider contributing it back). Substantial parts of a formalization are infrastructure — definitions and lemmas needed to get to the theorem you actually care about.

### 6.3 Debugging is interactive

Lean's interactive mode lets you see the state of the proof at each point: what hypotheses are in context, what goal remains, which tactics are available. This is qualitatively different from prose proof writing, where you debug by re-reading. Formalization tends to be more like programming than like writing.

### 6.4 Errors are loud

If a step is wrong, Lean complains immediately. You cannot push forward with a gap in a formal proof; the kernel will not accept the next step until the current one is resolved. This is a constant discipline and one of the most valuable features of formalization.

### 6.5 The reader is (also) the compiler

A formalized proof has two audiences: the human who wants to understand what you did, and the Lean kernel that verifies you did it. The craft discipline needs to serve both:

- Use meaningful names (for the human).
- Use tactics that run fast (for the kernel).
- Include comments explaining the high-level strategy (for the human).
- Keep lemma statements clean enough to be cited (for the library).

The craft rules of document 5 mostly transfer — with the prominent exception of the "mugga mugga" test, which doesn't apply to tactic blocks.

## 7. Limitations and criticisms of formalization

Formalization is not universally accepted as the future of mathematics. Several criticisms recur.

### 7.1 Cost

Formalizing a research paper takes weeks to years of effort. The Feit-Thompson formalization was 6 years. Kepler was over a decade. Even with Mathlib's infrastructure, a typical research paper takes weeks to months to formalize. Most working mathematicians cannot spare that time.

### 7.2 Loss of insight

A Lean proof is often *less insightful* than the prose proof. The tactics move symbols around; the narrative that explained *why* the proof works can be lost. Formalization can feel like transcribing music into MIDI: the notes are preserved, but the performance isn't.

The counter-argument: insight lives in the prose, not the formal proof, and the two can coexist. The formalization is a correctness certificate, not a replacement for exposition.

### 7.3 Trust shifted, not eliminated

A formalized proof is trusted to the extent you trust the proof assistant's kernel and the hardware/software stack. The kernel is usually small (HOL Light's is famously under 500 lines), but it is not nothing, and the operating system and compiler below it are enormous. A formalized proof is *more* trustworthy than a prose proof, but it is not *absolutely* trustworthy.

### 7.4 Only a small fraction of mathematics is formalized

Mathlib (2026) covers undergraduate mathematics well and early graduate mathematics partially. Research-level mathematics in most fields is not formalized. A paper in modern algebraic geometry, modern number theory, or high-dimensional topology typically assumes a substantial corpus of results that Mathlib doesn't yet cover. Formalizing such a paper would require first formalizing the corpus, which is often the larger task.

### 7.5 The skill gap

Learning to use Lean or Coq productively takes months or years. A working mathematician who can write a correct paper proof in a day may spend weeks learning to formalize it. The payoff is real but delayed.

## 8. The future

As of 2026, the trajectory of the formalization movement points in one direction: more. Mathlib grows at a roughly exponential rate. New research papers are being formalized weeks or months after publication, not years. AI-assisted proof writing (GitHub Copilot-style completion specialized for Lean) is becoming usable. Major results like the PFR conjecture formalization have begun to appear on the same timescale as the original publications.

Several trends to watch:

- **Lean adoption by working mathematicians.** Peter Scholze's public engagement with Lean led other senior mathematicians to try it. Terence Tao is the most visible current convert. As senior mathematicians adopt the tool, graduate students follow.
- **AI/LLM tactic assistants.** Neural networks trained on Mathlib can now produce partial proofs for many routine lemmas. The 2022–2025 wave of LLM-assisted theorem proving has not fully solved the problem, but it has made formalization substantially more tractable.
- **Reverse mathematics and formalization as a foundational project.** There is a growing movement to formalize not just theorems but the *dependencies* between theorems, producing a machine-verified map of which parts of mathematics rest on which axioms.
- **Textbook formalization.** Several projects aim to formalize canonical textbooks (e.g., Rudin's *Principles of Mathematical Analysis*, Halmos's *Naive Set Theory*) as Lean files that students can read alongside the printed text. When complete, this would give students a way to *execute* their reading — click on any theorem to see its machine-checked proof.
- **Journal-level standards.** As formalized proofs become cheaper to produce, some journals have begun to accept or require Lean formalizations of key results. The *Journal of Formalized Mathematics* (Mizar) has been doing this since 1990; the *Annals* is beginning experimental programs for select papers.

Whether formalized proof becomes the default standard for research mathematics — the way $\varepsilon$-$\delta$ became the default for analysis in the 20th century — is an open question. The trajectory suggests yes. The obstacles (cost, insight, skill gap) remain real but are shrinking.

## 9. What Schwarz's deck looks like from the formal side

If you have a student who has worked through Schwarz's 121 slides and wants to see what their proofs would look like in Lean 4, the correspondence is direct:

- **Slide 22** — "If $n$ is even, then $n^2$ is even."

  ```lean
  theorem even_sq_of_even (n : ℤ) (hn : Even n) : Even (n^2) := by
    obtain ⟨k, hk⟩ := hn
    exact ⟨2 * k^2, by rw [hk]; ring⟩
  ```

- **Slide 31** — "For any integers $m, n$, if $m$ and $n$ are odd, then $m + n$ is even."

  ```lean
  theorem even_add_of_both_odd (m n : ℤ) (hm : Odd m) (hn : Odd n) :
      Even (m + n) := by
    obtain ⟨k, hk⟩ := hm
    obtain ⟨r, hr⟩ := hn
    exact ⟨k + r + 1, by rw [hk, hr]; ring⟩
  ```

- **Slide 48** — "For any odd integer $n$, there exist integers $r, s$ with $r^2 - s^2 = n$."

  ```lean
  theorem odd_eq_sq_diff (n : ℤ) (hn : Odd n) :
      ∃ r s : ℤ, r^2 - s^2 = n := by
    obtain ⟨k, hk⟩ := hn
    refine ⟨k + 1, k, ?_⟩
    rw [hk]
    ring
  ```

- **Slide 119** — "$(A \cup C) \cap (B \cup C) = (A \cap B) \cup C$."

  ```lean
  theorem inter_union_eq (A B C : Set α) :
      (A ∪ C) ∩ (B ∪ C) = (A ∩ B) ∪ C := by
    ext x
    simp only [Set.mem_inter_iff, Set.mem_union]
    tauto
  ```

  (Mathlib's `tauto` tactic handles the propositional case analysis automatically. If you prefer an explicit proof mirroring Schwarz's two-case argument, you can use `by_cases hxC : x ∈ C` and branch.)

Each of these Lean snippets is a full, machine-checkable proof of a theorem from Schwarz's deck. The infrastructure — the definitions of `Even`, `Odd`, `Set`, `∪`, `∩`, the ring tactic — is all in Mathlib. The proof is 3–5 lines. Schwarz's prose proof is 20–30 lines. Both are correct; both are readable (to their intended audiences); both establish the same theorem.

## 10. Further reading

### Tutorials and textbooks for each major system

- **Lean 4:** Avigad, J., de Moura, L., & Kong, S. (2024). *Theorem Proving in Lean 4*. Available at https://leanprover.github.io/theorem_proving_in_lean4/. The canonical introduction.
- **Lean 4 for mathematicians:** Avigad, J., & Massot, P. (2024). *Mathematics in Lean*. Available at https://leanprover-community.github.io/mathematics_in_lean/. Designed for working mathematicians.
- **Coq:** Pierce, B. C., et al. (2024). *Software Foundations*. Available at https://softwarefoundations.cis.upenn.edu/. Six volumes covering Coq and verified software.
- **Coq (math-focused):** Bertot, Y., & Castéran, P. (2004). *Interactive Theorem Proving and Program Development: Coq'Art*. Springer.
- **Isabelle/HOL:** Nipkow, T., Paulson, L. C., & Wenzel, M. (2002). *Isabelle/HOL: A Proof Assistant for Higher-Order Logic*. Springer.
- **Agda:** Stump, A. (2016). *Verified Functional Programming in Agda*. ACM Books.
- **HOL Light:** Harrison, J. (2009). *Handbook of Practical Logic and Automated Reasoning*. Cambridge University Press. Includes HOL Light by the implementor of the Flyspeck Kepler proof.

### The Mathlib community and its resources

- **Mathlib documentation:** https://leanprover-community.github.io/mathlib4_docs/
- **Zulip chat:** https://leanprover.zulipchat.com/. The primary discussion forum. Very active.
- **Massot, P. (2023). "The future of mathematics?" (lecture notes and videos).** Patrick Massot's tutorials are among the best introductions to Mathlib for mathematicians.

### Formalization landmark papers

- Gonthier, G. (2008). "Formal proof — the four-color theorem." *Notices of the AMS*, 55(11), 1382–1393.
- Gonthier, G., et al. (2013). "A machine-checked proof of the odd order theorem." *Interactive Theorem Proving*, LNCS 7998, 163–179.
- Hales, T. C., et al. (2017). "A formal proof of the Kepler conjecture." *Forum of Mathematics, Pi*, 5, e2.
- Scholze, P. (2020). "Liquid tensor experiment." https://xenaproject.wordpress.com/2020/12/05/liquid-tensor-experiment/
- Commelin, J., & Topaz, A. (2022). "Formalization of the liquid tensor experiment." *arXiv* and Lean repository.
- Tao, T. (2023). "Formalizing the proof of the PFR conjecture." *What's New* blog posts.

### Philosophical and foundational background

- Awodey, S. (2014). "Structuralism, invariance, and univalence." *Philosophia Mathematica*, 22(1), 1–11.
- The Univalent Foundations Program. (2013). *Homotopy Type Theory: Univalent Foundations of Mathematics*. Institute for Advanced Study.
- Harper, R. (2016). *Practical Foundations for Programming Languages* (2nd ed.). Cambridge University Press. Background on dependent type theory.
- Wadler, P. (2015). "Propositions as types." *Communications of the ACM*, 58(12), 75–84.

### Critical and retrospective essays

- Voevodsky, V. (2014). "Univalent foundations — a journey." Lecture and notes. https://www.math.ias.edu/vladimir/Lectures
- Wiedijk, F. (2008). "Formal proof — getting started." *Notices of the AMS*, 55(11), 1408–1414.
- Buzzard, K. (2020). "The future of mathematics?" Lecture series. https://www.youtube.com/results?search_query=buzzard+future+of+mathematics

## Cross-references within this mission

- **Document 1** traced the historical arc from Euclid to Hilbert's program. This document picks up the story after Hilbert, in the computer era.
- **Document 2** introduced the Curry-Howard correspondence in outline. This document is its application.
- **Document 3** cataloged proof techniques. This document showed how each technique maps to tactics in a proof assistant.
- **Document 4** presented proofs on structures. The same proofs — on numbers, sets, functions, groups — all have Lean formalizations in Mathlib.
- **Document 5** described the craft of prose proof writing. This document described its formal counterpart.

## Closing note

Schwarz's deck ends on slide 121 with the set-equality theorem proved both ways, as Schwarz says, "building on what we already know." That is not the end of learning to write proofs — it is the beginning. From that foundation, a student can grow into:

- The formal logic of document 2.
- The technique catalog of document 3.
- The specific structures of document 4.
- The craft discipline of document 5.
- And, if they choose, the formalization tradition of this document.

Each path extends the Schwarz frame. None of them replaces it. The Definitions / Intuitions / Conventions triangle remains the organizing principle of every working mathematician's proof, whether the proof lives on paper or in Lean's kernel. The goal of this research mission has been to show what the triangle fills up with — from Euclid through Mathlib — when its corners are taken seriously.
