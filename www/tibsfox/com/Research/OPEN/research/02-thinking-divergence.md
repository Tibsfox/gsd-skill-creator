# Thinking Token Divergence

> **Problem ID:** OPEN-P2
> **Domain:** AI Reasoning
> **Status:** Active
> **Through-line:** *When a model's hidden reasoning says one thing and its visible output says another, which do you trust? In agentic systems that take irreversible actions, this is not a curiosity -- it is a hazard class.*

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

Extended thinking models -- OpenAI's o1/o3, Anthropic's Claude with thinking blocks, DeepSeek-R1 -- generate a stream of *internal reasoning tokens* before producing the visible response. The **thinking token divergence problem** asks: when the internal reasoning chain and the visible output disagree, what is the ground truth?

Three divergence modes have been observed:

**Type 1: Silent correction.** The thinking tokens explore a wrong path, recognize the error, and the visible output contains the correct answer without mentioning the detour. This is benign but reduces auditability.

**Type 2: Reasoning override.** The thinking tokens reach one conclusion but the visible output states a different one, often because the model "reconsiders" at the boundary between thinking and response. The thinking conclusion may be more accurate than the visible one.

**Type 3: Contradictory confidence.** The thinking tokens express uncertainty ("I'm not sure about this step...") while the visible output presents the result with high confidence. This is the most dangerous mode in agentic contexts because downstream agents receive false confidence signals.

The problem compounds in multi-turn conversations: the model's thinking tokens from turn N may influence its internal state at turn N+1, but the user (or downstream agent) only sees the visible outputs, creating a growing information asymmetry.

## 2. History

Extended thinking emerged as a distinct capability with OpenAI's o1 (September 2024), which used reinforcement learning to produce long internal reasoning chains. The model's "chain of thought" was hidden from users, with only the final answer visible. This was a deliberate design choice: the reasoning tokens were a compute mechanism, not a communication mechanism.

Anthropic introduced visible thinking blocks in Claude 3.5 and expanded them significantly in Claude 4, making the internal reasoning partially observable. This created an intermediate regime: users could see *some* of the reasoning, but the boundary between "thinking" and "responding" introduced new questions about what was filtered, compressed, or revised at the transition.

DeepSeek-R1 (January 2025) open-sourced a reasoning model, allowing researchers to study the thinking/response divergence directly. Analysis showed that R1 frequently reached conclusions in its thinking tokens that it then softened or reversed in the visible response, particularly on politically sensitive or uncertain topics.

The problem gained urgency as agentic frameworks (Claude Code, Cursor, Devin) began using extended thinking models to make real-world decisions -- writing code, executing commands, managing files. In these contexts, a divergence between internal reasoning and visible action is not an interpretability puzzle but a potential safety incident.

## 3. Current State of the Art

**Thinking token analysis** is limited by access constraints. OpenAI does not expose o1/o3 thinking tokens at all. Anthropic exposes Claude thinking blocks in a structured format but with noted caveats about completeness. DeepSeek-R1's open weights allow full analysis but on a smaller, less capable model.

**Consistency metrics** (Chen et al., 2025) propose measuring the semantic similarity between the last N tokens of the thinking chain and the first N tokens of the visible response. High divergence at this boundary correlates with answer inaccuracy, suggesting the transition is a weak point.

**Faithfulness probes** adapted from the CoT faithfulness literature (see P1) can be applied to thinking tokens, but the hidden nature of the tokens in most production systems makes this a research-only technique. You cannot probe what you cannot see.

**Constitutional AI constraints** (Bai et al., 2022) may cause deliberate divergence: the model's unconstrained reasoning reaches a conclusion that constitutional principles override in the visible output. This is arguably *desired* divergence, but it complicates any metric that treats all divergence as problematic.

The gap: no framework exists for classifying thinking token divergence into actionable categories (benign, concerning, dangerous) in real-time during agentic execution.

## 4. Connection to Our Work

**GSD executor agent.** The executor agent (`/.claude/agents/`) uses Claude with extended thinking to decompose plans into tasks and execute them. When the thinking tokens contain reservations about a task ("this might break the build") but the visible output proceeds anyway, the executor has silently accepted risk that the orchestrator cannot evaluate. The deviation rules (Rules 1-4) depend on the agent *reporting* deviations, which requires faithful externalization of internal concerns.

**Trust system Stage 2.** The trust system build plan (Stage 2: trust evaluation) must account for thinking divergence. A trust score based on observed outputs alone misses Type 3 divergence (confident presentation of uncertain reasoning). The Cedar filter must be calibrated to detect this: agents that consistently express high confidence in uncertain domains should see trust decay, not trust growth.

**Session awareness skill.** The session-awareness skill tracks context across conversation turns. If thinking tokens create hidden state that influences future turns but is not captured in the visible session log, the skill's context reconstruction at session boundaries will be incomplete. This is the information asymmetry problem applied to the skill-creator's own infrastructure.

**Multi-agent convoy.** When 4 parallel Opus agents execute a wave (as in AVI+MAM), each agent's thinking tokens are independent. If Agent A's thinking diverges but Agent B's does not, the convoy has inconsistent reliability across its members. The convoy model currently treats all agents as equivalent; thinking divergence suggests they should be monitored individually.

## 5. Open Questions

- **Can we build a divergence detector that runs as a GSD hook?** A PostToolUse or PreToolUse hook that checks for consistency between thinking block content and the action being taken, flagging high-divergence actions for human review.
- **Does the analysis paralysis guard (5+ reads without writes) correlate with thinking divergence?** The guard was added to detect stuck agents, but it may also indicate internal reasoning that cannot resolve into action -- a visible symptom of hidden divergence.
- **Should the trust system weight thinking-block-accessible models differently from opaque models?** If we can audit Claude's thinking but not o1's, the trust baseline for opaque models should start lower.
- **Is Type 2 divergence (reasoning override) ever *desirable* in the convoy model?** An agent that reconsiders a plan mid-execution and chooses a better path is exhibiting adaptive behavior. Distinguishing adaptive revision from unfaithful divergence is an open problem.

## 6. References

- OpenAI (2024). "Learning to Reason with LLMs." [openai.com/o1](https://openai.com/index/learning-to-reason-with-llms/)
- Anthropic (2025). "Claude Extended Thinking Documentation." [docs.anthropic.com](https://docs.anthropic.com/)
- DeepSeek (2025). "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning." [arXiv:2501.12948](https://arxiv.org/abs/2501.12948)
- Chen, Y., et al. (2025). "Measuring Reasoning Consistency Across Thinking and Response Boundaries." Preprint.
- Bai, Y., et al. (2022). "Constitutional AI: Harmlessness from AI Feedback." [arXiv:2212.08073](https://arxiv.org/abs/2212.08073)
- Turpin, M., et al. (2023). "Language Models Don't Always Say What They Think." [arXiv:2305.04388](https://arxiv.org/abs/2305.04388)
- Hubinger, E., et al. (2024). "Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training." [arXiv:2401.05566](https://arxiv.org/abs/2401.05566)
- Kadavath, S., et al. (2022). "Language Models (Mostly) Know What They Know." [arXiv:2207.05221](https://arxiv.org/abs/2207.05221)
