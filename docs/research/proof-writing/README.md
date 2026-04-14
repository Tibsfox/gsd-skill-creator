# Mathematical Proofs — Deep Research Mission

**Foundation text:** Keith Schwarz, *Mathematical Proofs* (Stanford CS103 Lecture 01, 121 slides).
**Mission start:** 2026-04-11, Session 020.
**Research pattern:** Mirrors `docs/research/rca-deep/` — 6 enrichment documents + README, each ~500–900 lines, extending a compact pedagogical foundation into comprehensive research material.

## The foundation text

Schwarz's CS103 deck introduces proof writing through a three-axis pedagogical frame — the **Definitions / Intuitions / Conventions** triangle — and walks a student through four canonical proofs:

1. **Direct proof on numbers.** If $n$ is an even integer, then $n^2$ is even. Introduces the definition of *even*, the structure of a direct proof, the naming of unknowns, and the discipline of reading proofs as English sentences (the "mugga mugga test" for readability).
2. **Direct proof with multiple antecedents.** For any integers $m$ and $n$, if both are odd, then $m + n$ is even. Introduces arbitrary choices, numbered equations, and the convention that proofs are complete sentences with punctuation.
3. **Existential proof by construction.** For any odd integer $n$, there exist integers $r$ and $s$ with $r^2 - s^2 = n$. Introduces universal and existential statements, and proof by witness-construction.
4. **Proof on sets.** $(A \cup C) \cap (B \cup C) = (A \cap B) \cup C$. Introduces element-wise reasoning, set containment by element-chasing, case analysis, subset-based equality, and proofs that build on earlier proofs.

The deck's 121 slides are a *minimal, pedagogically exquisite* first-week course in proof writing. It is not comprehensive. It deliberately omits induction, contradiction, contrapositive, combinatorial proof, structural induction, formal logic, and almost every proof technique beyond the first two. It establishes a framework the student can *grow into*, not a complete reference.

**This research mission extends the foundation into the comprehensive reference the Schwarz deck prepares a student to absorb.** Each document below takes one dimension of the Schwarz frame and expands it with the scholarly, historical, and technical depth needed to reach graduate-level proof fluency.

## The six enrichment documents

| # | File | Extends the Schwarz frame by... | Target length |
|---|---|---|---|
| 1 | `01-foundations-and-history.md` | Tracing what counts as a "proof" from Euclid through Hilbert, Gödel, Bourbaki, and into modern machine-verified mathematics. Grounds the *Definitions* axis historically. | ~700 lines |
| 2 | `02-logic-and-language.md` | Making explicit the logical machinery that Schwarz's sentence-level discipline tacitly relies on: propositional & predicate logic, quantifiers, scope, negation, and the translation between English and formal notation. | ~700 lines |
| 3 | `03-techniques-catalog.md` | Cataloging the proof techniques Schwarz doesn't cover yet: direct, contrapositive, contradiction, cases, construction, induction (weak / strong / structural), well-ordering, pigeonhole, double-counting, probabilistic method, diagonal argument, invariants, extremal principle. Each with a canonical worked example. | ~900 lines |
| 4 | `04-proofs-on-structures.md` | Applying the technique catalog to the structures mathematicians actually work on: $\mathbb{N}, \mathbb{Z}, \mathbb{Q}, \mathbb{R}$ and their subsystems (divisibility, modular arithmetic, primality, gcd), sets and cardinality, functions and relations, orders, and the algebraic hierarchy (groups, rings, fields). | ~800 lines |
| 5 | `05-craft-and-pedagogy.md` | Expanding Schwarz's *Conventions* axis into a full craft discipline: the Knuth / Larrabee / Roberts "Mathematical Writing" standards, Polya's heuristics, Lakatos's dialectic, the Harel–Sowder proof-scheme taxonomy, and current empirical research on how mathematicians read and evaluate proofs. | ~700 lines |
| 6 | `06-formalization-and-modern.md` | Connecting the paper tradition to machine-checkable mathematics: Coq, Lean, Isabelle/HOL, Agda, the Mathlib project, the Liquid Tensor Experiment, automated theorem provers, and the 2020s movement to put mathematical proof on a formal foundation. | ~700 lines |

Together: approximately **4,500 lines** of substantive content with peer-reviewed citations at every step.

## Reading order

- **Linear reading** — recommended for first absorption. 01 → 06.
- **Topical reading** — jump directly to the document matching your current question.
- **Schwarz-first reading** — read the deck first, then use any document here as a drill-down when the deck stops.

## Scope discipline

This mission is **reference material**, not textbook replacement. Each document is designed to deepen understanding of a topic that Schwarz's deck introduces or implicitly assumes. It is not a substitute for reading actual textbooks (Velleman's *How to Prove It*, Hammack's *Book of Proof*, Polya's *How to Solve It*, Lakatos's *Proofs and Refutations*, Bourbaki's *Éléments*, or the Mathlib documentation). Those are cited in full bibliographies at the end of each document.

## Cross-references to the foundation text

Throughout the documents, explicit back-references to the Schwarz deck appear as:

> **Schwarz deck, slide 22** — *"If $n$ is an even integer, then $n^2$ is even."*

This keeps the link to the foundation text visible even in the most technical sections.

## Through-line

Schwarz's triangle — Definitions, Intuitions, Conventions — is not a pedagogical gimmick. It is the decomposition that every working mathematician uses (tacitly) when reading or writing a proof:

- The **definitions** determine what the words in the theorem actually mean.
- The **intuitions** answer the question "why should this be true?"
- The **conventions** determine what counts as a legal move and what counts as a complete argument.

The six documents in this mission are organized around this decomposition:

- Document 1 traces how *definitions* became the foundation of modern mathematics (the axiomatic turn from Euclid to Hilbert).
- Document 2 formalizes the *logical conventions* that structure proof writing.
- Document 3 is the catalog of *technique conventions* — the moves that count as legal.
- Document 4 shows how the *definitions* and *techniques* combine to operate on specific mathematical structures.
- Document 5 returns to the *conventions* as a craft discipline — how professionals actually read and write proofs.
- Document 6 examines what happens when the *conventions* become machine-checkable rules.

The *intuitions* axis runs through all six documents as the connecting thread — every worked example pairs the formal argument with the informal "why should this be true" story.
