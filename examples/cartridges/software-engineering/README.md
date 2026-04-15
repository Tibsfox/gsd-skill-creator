# Software Engineering

A full cartridge for software engineering as a **theoretical and
mathematical** discipline — the computer-science foundations
underneath daily programming work. Theory-first, language-specific
where it matters, education-aware throughout.

Pairs with `software-development` (the applied side) and
`software-management` (the operational side). Where those cartridges
ask "what should I write" and "how do I ship it," this one asks
"what does it *mean*, and how do I prove it works?"

- Slug: `software-engineering`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — discrete mathematics, formal logic and proof,
  computability and complexity, automata and formal languages, type
  theory and type systems, lambda calculus, program semantics
  (operational / denotational / axiomatic), algorithms and data
  structures, programming language theory (parsing / compilers),
  formal methods and verification (Hoare / model checking / proof
  assistants), CS curriculum and learning pathways, category theory
  for computer science
- **5 agents** — `cs-professor` (Opus capcom), `proof-theorist`,
  `language-theorist`, `algorithms-analyst`, `curriculum-advisor`
- **4 teams** — theory-foundations, proof-and-verification,
  language-design, curriculum-and-learning
- **6 grove record types** — `TheoremRecord`, `ProofArtifact`,
  `TypeJudgment`, `ComplexityAnalysis`, `LanguageSpec`,
  `LearningPathway`

## Load + validate

```
skill-creator cartridge load ./cartridge.yaml
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

All four forge gates (validate / eval / dedup / metrics) should be
green before shipping or depending on this cartridge.

## Design notes

- **Three "software" cartridges, three stances.** `software-development`
  writes code, `software-management` moves and ships code,
  `software-engineering` reasons about code. Use them in parallel;
  they are complementary, not overlapping.
- **Curry-Howard is load-bearing.** `formal-logic-and-proof`,
  `type-theory-and-type-systems`, and `formal-methods-and-verification`
  share the same mathematical substrate — a proof *is* a program.
- **Curriculum is a first-class skill.** Theory without a pathway to
  learn it is inert; `cs-curriculum-and-learning-pathways` keeps the
  cartridge honest about how someone actually gets here from a
  working-programmer starting point.
- **Canonical textbook anchors.** Curriculum work should reach for
  SICP, CLRS, TAPL, PFPL, Sipser, Arora-Barak, HoTT Book, and the
  standard proof-assistant tutorials (Software Foundations,
  Theorem Proving in Lean) when sequencing a pathway.
