# Distributed Intelligence Emergence

> **Problem ID:** OPEN-P4
> **Domain:** Multi-Agent Systems
> **Status:** Active
> **Through-line:** *Four Opus agents running in parallel is not distributed intelligence -- it is parallel labor. Distributed intelligence requires that the collective exhibit capabilities none of the individuals possess. The Gastown convoy model is our test bed for whether orchestration can cross that threshold.*

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

When multiple AI agents collaborate through structured protocols, does the collective system exhibit capabilities that exceed the sum of its parts? Specifically: is there a meaningful sense in which a multi-agent system can solve problems that no individual agent can, not merely by dividing labor, but through emergent coordination that produces qualitatively new capabilities?

This is distinct from parallelism. Four agents building four different files simultaneously is parallel labor -- each agent works independently on a well-defined subtask. Distributed intelligence would require the agents to collectively discover solutions, detect errors, or make decisions that none could achieve alone.

The formal version: let `A = {a_1, ..., a_n}` be a set of agents, `P` a protocol governing their interaction, and `T` a task. The system `(A, P)` exhibits **emergent distributed intelligence** on `T` if: (1) no individual `a_i` can solve `T` alone within the same resource budget, and (2) `(A, P)` solves `T` not merely by partitioning it into subtasks solvable by individuals, but through interaction effects -- information exchange, error correction, or constraint propagation that alters each agent's behavior.

## 2. History

The question dates to Minsky's "Society of Mind" (1986), which proposed that intelligence emerges from the interaction of many simple agents ("agencies") that individually have no understanding. Minsky's framework was philosophical rather than computational, but it set the terms of debate.

In classical multi-agent systems (Wooldridge, 2009), emergence was studied through simulations: flocking (Reynolds, 1987), ant colony optimization (Dorigo et al., 1996), and particle swarm optimization (Kennedy & Eberhart, 1995). These showed that simple local rules could produce globally intelligent behavior, but the agents were homogeneous and the tasks were narrow.

The LLM era created a new regime: agents that are individually capable of general reasoning, communicating through natural language, and operating on open-ended tasks. Park et al. (2023) demonstrated emergent social behaviors in "Generative Agents" -- LLM-powered agents in a simulated town that spontaneously organized social events and spread information through gossip networks. This was the first convincing demonstration that LLM-based multi-agent systems could exhibit qualitatively new behaviors.

AutoGen (Wu et al., 2023), CrewAI (2024), and MetaGPT (Hong et al., 2023) formalized LLM multi-agent frameworks with role assignment, message passing, and coordination protocols. These demonstrated practical benefits (better code generation, more thorough analysis) but the "emergence" question remained open: were the improvements from genuine interaction effects, or from the well-known benefits of ensemble methods (multiple independent attempts at the same task)?

## 3. Current State of the Art

**Role specialization** is the most reliable emergence pattern. When agents adopt distinct roles (planner, coder, reviewer, tester), the system performs better than a single agent cycling through roles. MetaGPT (Hong et al., 2023) showed this for software engineering tasks, with role-specialized agents reducing code errors by 30-50% compared to a single multi-role agent.

**Debate and self-correction.** Du et al. (2023) showed that multiple LLMs debating each other improved factual accuracy and reasoning, with gains that exceeded simple majority voting. The interaction itself -- not just the aggregation -- contributed to improved answers. Liang et al. (2024) extended this to show that heterogeneous debate (using different model families) outperforms homogeneous debate.

**Emergent communication protocols.** Mu et al. (2024) demonstrated that LLM agents can develop task-specific communication shorthand that improves efficiency over natural language, suggesting that the agents adapt their interaction to the task rather than just executing a fixed protocol.

**Scaling laws for multi-agent systems** remain poorly understood. Unlike single-model scaling laws (Kaplan et al., 2020), there is no established relationship between agent count, communication bandwidth, and task performance. Adding more agents can decrease performance (coordination overhead) as easily as increase it.

The gap: no framework predicts when a multi-agent system will exhibit emergence versus when it will merely distribute labor. The distinction is detectable post-hoc but not predictable ex-ante.

## 4. Connection to Our Work

**The Gastown convoy model.** The convoy model is our primary distributed intelligence experiment. In the AVI+MAM pipeline, 4 parallel Opus agents execute wave tasks. Currently, these operate as parallel labor: each agent gets an independent task, executes it, and commits. The convoy coordinator (the GSD executor) handles synchronization at wave boundaries but does not facilitate inter-agent communication during execution.

The question: could the convoy model be extended to permit inter-agent signals during execution? For example, if Agent A discovers a problem in the shared codebase while executing its task, could it signal Agents B, C, and D to adapt? This would move the convoy from parallel labor toward distributed intelligence, but the coordination overhead must be carefully managed.

**GUPP/DACP federation.** The Generalized User Privacy Protocol and Distributed Agent Consent Protocol define how agents request, grant, and revoke permissions. In a multi-agent system, these protocols create a permission topology that constrains information flow. The emergence question: does constrained information flow (agents that cannot see everything) sometimes produce *better* outcomes than full information sharing, by forcing each agent to develop more robust local strategies?

**Trust system as coordination signal.** The trust system (trust-relationship.ts, 95 tests) provides trust scores for agents. In a distributed intelligence system, trust scores could serve as a coordination primitive: agents weight information from high-trust peers more heavily, creating a natural information hierarchy that emerges from performance history rather than being centrally assigned.

**Mission pack pipeline.** The proven pipeline (vision, wave plan, parallel executors, atomic commits) structures work at 50+ project scale (Gastown convoy model). The pipeline deliberately limits emergence: tasks are pre-planned, agents are independent, and synchronization is batch-oriented. This design choice prioritizes reliability over emergence. The open question is whether there exists a hybrid: structured enough to be reliable, flexible enough to permit beneficial interaction effects.

## 5. Open Questions

- **Can we measure emergence in the convoy model?** If we run the same wave tasks both as parallel-independent and as communicating agents, and the communicating agents produce measurably better results (fewer bugs, more coherent code, better documentation), that is evidence of emergence.
- **What is the minimum communication bandwidth for emergence?** The convoy model currently uses zero inter-agent communication during execution. How much communication is needed to cross the threshold from parallel labor to distributed intelligence?
- **Does the muse council exhibit emergence?** The 13+1 muse team (Build Arc: Cedar, Hemlock, Willow, Foxy, Sam, Raven, Hawk, Owl, Lex; Understanding Arc: Socrates, Euclid, Shannon, Amiga) operates as a deliberative council. When the council makes a decision that no individual muse would have made, that is emergence. Can we formalize this?
- **Is the fox companies vision (FoxFiber, FoxCompute, Fox CapComm) a distributed intelligence architecture at the organizational level?** Separate companies with distinct capabilities that produce collective outcomes through market mechanisms rather than central coordination.

## 6. References

- Minsky, M. (1986). *The Society of Mind*. Simon & Schuster.
- Park, J.S., et al. (2023). "Generative Agents: Interactive Simulacra of Human Behavior." [arXiv:2304.03442](https://arxiv.org/abs/2304.03442)
- Hong, S., et al. (2023). "MetaGPT: Meta Programming for Multi-Agent Collaborative Framework." [arXiv:2308.00352](https://arxiv.org/abs/2308.00352)
- Wu, Q., et al. (2023). "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." [arXiv:2308.08155](https://arxiv.org/abs/2308.08155)
- Du, Y., et al. (2023). "Improving Factuality and Reasoning in Language Models through Multiagent Debate." [arXiv:2305.14325](https://arxiv.org/abs/2305.14325)
- Liang, T., et al. (2024). "Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate." [arXiv:2305.19118](https://arxiv.org/abs/2305.19118)
- Mu, J., et al. (2024). "Emergent Communication in Multi-Agent LLM Systems." Preprint.
- Kaplan, J., et al. (2020). "Scaling Laws for Neural Language Models." [arXiv:2001.08361](https://arxiv.org/abs/2001.08361)
- Wooldridge, M. (2009). *An Introduction to MultiAgent Systems*. Wiley.
