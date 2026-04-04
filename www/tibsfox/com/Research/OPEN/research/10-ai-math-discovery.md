# AI-Assisted Mathematical Discovery

> **Problem ID:** OPEN-P10
> **Domain:** AI / Mathematics
> **Status:** Partial
> **Through-line:** *When AlphaProof solves an IMO problem or FunSearch discovers a new construction, has AI done mathematics? Or has it done sophisticated search within a human-defined space? The distinction matters because genuine mathematical discovery requires identifying which questions to ask -- not just answering them. The muse council is our small-scale experiment in collective mathematical reasoning: 13 perspectives converging on problems none would formulate alone.*

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [History](#2-history)
3. [Current State of the Art](#3-current-state-of-the-art)
4. [Connection to Our Work](#4-connection-to-our-work)
5. [Open Questions](#5-open-questions)
6. [References](#6-references)

---

## 1. Problem Statement

Can AI systems generate genuinely novel mathematical conjectures -- not merely verify existing conjectures, search parameter spaces, or prove theorems within known frameworks, but identify structural patterns and formulate questions that extend the boundary of mathematical knowledge?

The problem has three levels of increasing difficulty:

**Level 1: Conjecture verification.** Given a conjecture, can AI determine whether it is true or false? This is formalized as automated theorem proving (ATP) and has a long history. Current frontier: AlphaProof (DeepMind, 2024) solved 4 of 6 IMO 2024 problems, achieving a silver medal equivalent. This is Level 1 -- the problems were human-formulated.

**Level 2: Conjecture generation within known frameworks.** Given a mathematical domain (e.g., graph theory, number theory), can AI generate new conjectures that are true, non-trivial, and interesting? FunSearch (Romera-Paredes et al., 2024) discovered new constructions in extremal combinatorics that beat human-known bounds. The Ramanujan Machine (Raayoni et al., 2021) generated new continued fraction identities for mathematical constants. These are Level 2 -- the search space was defined by humans, but the specific discoveries were not.

**Level 3: Problem formulation.** Can AI identify which mathematical questions are worth asking? This requires understanding the structure of a mathematical field, recognizing gaps in existing theory, and formulating questions that, if answered, would advance understanding. No AI system has convincingly demonstrated Level 3 capability.

## 2. History

**1950s-1970s:** Early AI researchers (Newell, Shaw, Simon) built theorem provers that could derive logical conclusions from axioms. The Logic Theorist (1956) proved theorems from *Principia Mathematica*. These systems were search-based, exploring the space of derivations.

**1990s-2000s:** Automated conjecture-making programs emerged. Graffiti (Fajtlowicz, 1988) generated graph theory conjectures by correlating graph invariants. HR (Colton, 2002) combined concept formation with conjecture generation. These systems produced genuine mathematical output: some Graffiti conjectures were published in journals and remain open.

**2016:** DeepMind's AlphaGo defeated Lee Sedol, demonstrating superhuman performance in a game requiring strategic reasoning. Move 37 in Game 2 was described by commentators as "creative" -- a move no human would play that turned out to be strategically brilliant. This was the first widely recognized instance of AI producing a genuinely novel strategy.

**2019-2021:** AI for mathematics gained momentum. Davies et al. (2021) used ML to discover a new relationship between knot invariants (the algebraic and geometric signatures), which was then proven by mathematicians. The Ramanujan Machine (2021) discovered new continued fraction formulas. These were Level 2 discoveries: genuine mathematical novelties within human-defined search spaces.

**2024:** FunSearch (Romera-Paredes et al., 2024) used LLMs in an evolutionary loop to discover new constructions in extremal combinatorics, specifically finding cap sets in F_3^n that exceeded the best known human constructions. AlphaProof (DeepMind, 2024) combined reinforcement learning with Lean 4 formalization to solve IMO-level competition problems. AlphaGeometry 2 (DeepMind, 2024) solved olympiad geometry problems at human expert level.

## 3. Current State of the Art

**FunSearch** represents the current frontier for AI-generated mathematical constructions. The key innovation: use an LLM to propose candidate programs (constructions encoded as code), evaluate them automatically, and evolve the population using the LLM as a mutation operator. The LLM never "understands" the mathematics, but the evolutionary loop discovers constructions that mathematicians had not found.

**AlphaProof** represents the frontier for AI theorem proving. By training on synthetic Lean 4 proofs and using reinforcement learning to explore the proof search space, AlphaProof achieved silver-medal performance at IMO 2024. The system works within formalized mathematics -- it cannot discover new concepts or definitions, but it can find proofs that require creative combinations of known techniques.

**LLMs as mathematical assistants.** Claude, GPT-4, and Gemini can assist with mathematical reasoning: explaining concepts, suggesting proof strategies, checking computations, and generating conjectures when prompted. Their reliability on novel mathematical reasoning is inconsistent -- they excel at pattern matching and analogy but struggle with genuinely new territory.

**The gap.** No system convincingly does Level 3: formulating new mathematical problems that advance a field. The bottleneck is meta-mathematical understanding: knowing what is known, what is unknown, what is interesting, and what connections between fields might be productive. This requires the kind of broad, integrative reasoning that current AI systems approximate but do not possess.

## 4. Connection to Our Work

**The muse council as a multi-perspective reasoning system.** The muse team (13+1 members across two arcs) operates as a collective reasoning system for the gsd-skill-creator project. Each muse brings a different perspective: Cedar (trust and verification), Hemlock (correctness and rigor), Euclid (mathematical structure), Shannon (information theory), and others. When the council deliberates on a problem, the interaction between perspectives can produce insights that no individual muse would generate. This is a small-scale experiment in whether structured multi-perspective reasoning crosses the threshold from Level 1 (verification) to Level 2 (generation).

**Rosetta clusters as cross-domain discovery infrastructure.** The 13 Rosetta clusters (Ecology, Electronics, Infrastructure, Energy, Creative, Business, Vision, Broadcasting, Science, Music, Space, AI & Computation, Graphics) organize 190+ research projects by domain. Cross-cluster connections -- where a pattern in one domain illuminates a structure in another -- are the project-level analogue of mathematical discovery. The Collatz conjecture (P7) connects to convergence analysis in multi-agent systems; Kuramoto synchronization (P11) connects to cooperative network behavior. These connections were discovered through the research process, not pre-planned.

**College mathematics department.** The `.college/` structure includes a mathematics department that could serve as the formalization layer for AI-discovered conjectures. Patterns discovered by agents during execution (e.g., "task completion time follows a log-normal distribution") could be formalized, tested, and potentially proven within the college framework.

**FunSearch architecture and GSD.** The FunSearch pattern (LLM proposes, evaluator selects, population evolves) maps to the GSD pipeline: the planner proposes, the executor implements, the verifier evaluates, and the next iteration improves. Could the GSD pipeline be adapted to evolve mathematical constructions, using the research series as the evaluation environment?

## 5. Open Questions

- **Can the muse council generate Level 2 mathematical conjectures?** Set up a structured experiment: give the council a mathematical domain (e.g., properties of trust score distributions in the trust system), have each muse analyze from their perspective, and check whether the collective output includes conjectures that no individual muse proposed.
- **Is cross-cluster pattern matching a form of mathematical discovery?** When a pattern from the Music cluster (harmonic series, resonance) illuminates a problem in the AI & Computation cluster (attention mechanisms, frequency-domain analysis), is this discovery or analogy?
- **Can the FunSearch evolutionary loop run within the GSD convoy model?** Use parallel agents as the population, the LLM as the mutation operator, and a mathematical evaluator as the fitness function. The convoy infrastructure (wave-based execution, atomic commits) provides the orchestration layer.
- **What would Level 3 AI math discovery look like in our context?** An agent that, during execution, notices a pattern, formulates it as a conjecture, and flags it for investigation -- without being asked to do math. The skill-creator's adaptive learning layer is designed to detect and encode patterns. Could it detect mathematical ones?

## 6. References

- Romera-Paredes, B., et al. (2024). "Mathematical Discoveries from Program Search with Large Language Models." *Nature*, 625, 468-475. [nature.com](https://www.nature.com/articles/s41586-023-06924-6)
- DeepMind (2024). "AlphaProof and AlphaGeometry 2." [deepmind.google](https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/)
- Davies, A., et al. (2021). "Advancing Mathematics by Guiding Human Intuition with AI." *Nature*, 600, 70-74. [arXiv:2111.15323](https://arxiv.org/abs/2111.15323)
- Raayoni, G., et al. (2021). "Generating Conjectures on Fundamental Constants with the Ramanujan Machine." *Nature*, 590, 67-73.
- Fajtlowicz, S. (1988). "On Conjectures of Graffiti." *Discrete Mathematics*, 72, 113-118.
- Colton, S. (2002). *Automated Theory Formation in Pure Mathematics*. Springer.
- Trinh, T.H., et al. (2024). "Solving Olympiad Geometry without Human Demonstrations." *Nature*, 625, 476-482.
- He, Y.H., et al. (2019). "Machine Learning Algebraic Geometry." *Physics Letters B*, 801, 135102.
