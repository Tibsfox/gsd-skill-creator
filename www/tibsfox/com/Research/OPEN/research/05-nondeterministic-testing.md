# Nondeterministic System Testing

> **Problem ID:** OPEN-P5
> **Domain:** Testing / Verification Theory
> **Status:** Active
> **Through-line:** *21,298 deterministic tests prove the scaffold is correct. Zero tests prove the agents that inhabit the scaffold will reason correctly on the next run. The gap between deterministic infrastructure testing and stochastic agent verification is the frontier of software quality assurance for AI-native systems.*

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

How do you write reliable tests for a system whose outputs are fundamentally stochastic? Standard software testing relies on determinism: given input X, the system must produce output Y. If it does not, the test fails and a bug has been found. LLM-based systems violate this assumption at every level.

The challenge has three layers:

**Layer 1: Output variability.** The same prompt may produce different outputs across runs (different wording, different ordering, different level of detail). Testing must distinguish between acceptable variation (different phrasing of the same correct answer) and unacceptable variation (different factual content or different actions taken).

**Layer 2: Path variability.** Even when the final output is the same, the reasoning path may differ. A model might reach the correct answer through a valid chain of reasoning on one run and through an invalid chain that happens to produce the correct answer on another. Testing the path, not just the output, requires P1 (faithfulness) to be solved.

**Layer 3: Context sensitivity.** LLM outputs depend on the full conversation context, system prompt, and model version. A test that passes today may fail tomorrow after a model update, even with identical inputs. This is not a bug in the traditional sense -- it is a property of the system.

The formal framing: given a stochastic system `S` and a specification `phi`, we want to verify `P(S |= phi) >= 1 - epsilon` for some acceptable error rate `epsilon`. This is a probabilistic verification problem, fundamentally different from the Boolean pass/fail of classical testing.

## 2. History

Nondeterministic testing has roots in concurrent systems testing (1980s-1990s), where race conditions and scheduling variability made tests unreliable. Techniques included stress testing, sleep-based synchronization (fragile), and formal verification of concurrent protocols (Lamport, 1978; Pnueli, 1977).

Property-based testing (Claessen & Hughes, 2000) shifted the paradigm from "assert specific output" to "assert output satisfies properties." QuickCheck (Haskell, 2000) and its descendants (Hypothesis for Python, fast-check for TypeScript) generate random inputs and check that outputs satisfy invariants. This handles Layer 1 variability for deterministic functions but does not directly address LLM stochasticity.

Metamorphic testing (Chen et al., 1998) introduced a complementary approach: instead of checking absolute correctness, check that input-output relationships are preserved across transformations. If `f(x) = y`, then `f(g(x))` should satisfy some known relation with `y`. This is powerful for "test oracle" problems where the correct output is unknown.

The LLM testing era (2023-present) has seen rapid development of specialized frameworks: LangSmith (2023) for trace-based testing, DeepEval (2024) for LLM output evaluation, and Promptfoo (2024) for prompt regression testing. These tools provide infrastructure but not theory -- they offer ways to run tests, not principles for what tests to write.

## 3. Current State of the Art

**Behavioral testing / CheckList** (Ribeiro et al., 2020) applies software testing concepts (minimum functionality, invariance, directional expectation) to NLP models. Tests check capabilities ("the model can do sentiment analysis") rather than specific outputs. This is the closest existing framework to Layer 1 testing for LLMs.

**Statistical testing** treats LLM evaluation as hypothesis testing. Run the same test N times, collect outputs, compute the pass rate. If `pass_rate >= threshold`, the test passes. This handles variability but requires many runs (expensive) and does not distinguish between "always almost right" and "sometimes completely wrong" (distribution shape matters, not just mean).

**Metamorphic testing for LLMs** (Xie et al., 2024) defines LLM-specific metamorphic relations: adding irrelevant context should not change the answer, paraphrasing the question should not change the answer, increasing the difficulty should not improve accuracy. These are practical and scalable but require domain expertise to define the relations.

**Fuzzing** (Perez & Ribeiro, 2022) applies adversarial input generation to LLMs, discovering inputs that trigger failures. Red-teaming frameworks (Anthropic, 2023) formalize this into systematic vulnerability discovery. This is complementary to correctness testing -- it finds failure modes rather than verifying success modes.

**Contract-based testing** for agents (emerging, 2025) defines pre/post-conditions for agent actions: before the agent writes a file, the file must not exist; after the agent writes a file, the file must contain certain elements. This reduces the stochastic problem to a deterministic contract-checking problem, at the cost of testing behavior rather than reasoning.

## 4. Connection to Our Work

**The 21,298-test baseline.** The gsd-skill-creator's existing test suite is entirely deterministic: TypeScript unit tests (Vitest) that verify function behavior. This is the Layer 0 foundation -- if the infrastructure is wrong, nothing else matters. The unsolved problem is Layer 1+: testing the agents that use the infrastructure.

**Convoy model as test harness.** The Gastown convoy model structures agent execution into discrete, observable steps (tasks within waves). Each task has a "done criteria" defined in the plan. Currently, done criteria are checked by the executor agent -- itself an LLM. A hybrid approach: use deterministic contract checks (file exists, tests pass, no build errors) as the hard verification layer, and use LLM-based evaluation only for subjective quality assessments (code style, documentation completeness).

**TDD for agents.** The GSD TDD execution flow (RED-GREEN-REFACTOR) works for deterministic code. For agent behavior, we need a stochastic TDD variant: write a test that specifies a *property* the agent's output should satisfy, run the agent multiple times to estimate the satisfaction probability, and treat the property as passing if the probability exceeds a threshold. This is expensive but well-defined.

**Skill validation.** When the skill-creator validates a new skill, it could apply metamorphic testing: create the same skill with slightly different prompts and check that the outputs are semantically equivalent. If small prompt variations produce wildly different skills, the skill definition is fragile and should be revised.

**The fix attempt limit.** The deviation rules include a "3 auto-fix attempts per task" limit. This is implicitly a statistical stopping rule: after 3 failures, the probability of success on the next attempt is low enough that continuing is not worth the cost. This intuition could be formalized using sequential analysis (Wald, 1945).

## 5. Open Questions

- **Can we auto-generate metamorphic relations from GSD plan task descriptions?** If a task says "create user authentication endpoint," implied relations include: changing the endpoint path should not change the auth logic; changing the user model should be reflected in the auth response; adding a field to the user model should not break existing auth.
- **What is the right epsilon for convoy execution?** If we accept a 5% failure rate per agent per task, and a wave has 4 agents each doing 5 tasks, the probability of at least one failure is `1 - 0.95^20 = 64%`. The convoy model needs much tighter per-task reliability than single-agent systems.
- **Can the hook system implement contract-based testing automatically?** PreToolUse checks preconditions, PostToolUse checks postconditions. The hook system already fires at action boundaries. Extending it with contract definitions would create a deterministic verification layer around stochastic agent behavior.
- **Is there a useful signal in Vitest's `--retry` flag?** Running flaky tests multiple times with retries is standard practice. Can we apply the same pattern to agent task execution, with the GSD executor retrying tasks that fail soft verification (output quality) while hard verification (build success, test passage) remains Boolean?

## 6. References

- Claessen, K. & Hughes, J. (2000). "QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs." *ICFP 2000*.
- Chen, T.Y., et al. (1998). "Metamorphic Testing: A New Approach for Generating Next Test Cases." Technical Report HKUST-CS98-01.
- Ribeiro, M.T., et al. (2020). "Beyond Accuracy: Behavioral Testing of NLP Models with CheckList." *ACL 2020*. [arXiv:2005.04118](https://arxiv.org/abs/2005.04118)
- Xie, X., et al. (2024). "Metamorphic Testing for LLM-Based Systems." [arXiv:2403.07820](https://arxiv.org/abs/2403.07820)
- Perez, E. & Ribeiro, M.T. (2022). "Red Teaming Language Models with Language Models." [arXiv:2202.03286](https://arxiv.org/abs/2202.03286)
- Lamport, L. (1978). "Time, Clocks, and the Ordering of Events in a Distributed System." *CACM*, 21(7).
- Pnueli, A. (1977). "The Temporal Logic of Programs." *FOCS 1977*.
- Wald, A. (1945). "Sequential Tests of Statistical Hypotheses." *Annals of Mathematical Statistics*, 16(2).
- Lightman, H., et al. (2023). "Let's Verify Step by Step." [arXiv:2305.20050](https://arxiv.org/abs/2305.20050)
