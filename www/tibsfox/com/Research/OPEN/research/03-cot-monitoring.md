# CoT Monitoring at Scale

> **Problem ID:** OPEN-P3
> **Domain:** AI / Testing
> **Status:** Active
> **Through-line:** *You cannot test what you cannot observe, and you cannot observe what does not hold still. LLM reasoning is a moving target that changes with context, temperature, and the phase of the moon. Monitoring it at production scale requires new verification architectures.*

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

Given that chain-of-thought reasoning may be unfaithful (P1) and thinking tokens may diverge from visible output (P2), how do we build monitoring systems that detect reasoning failures at production scale?

The requirements are severe:
- **Latency:** Monitoring must not significantly delay agent execution in the convoy model
- **Coverage:** Must handle diverse task types (code generation, planning, document synthesis, mathematical reasoning)
- **Nondeterminism:** The same input may produce different (valid) reasoning chains across runs
- **Volume:** A single plan execution in GSD may involve 20-50 agent calls, each generating 1K-100K reasoning tokens
- **Actionability:** Detection must produce actionable signals (stop, retry, escalate), not just logs

Classical software monitoring assumes deterministic behavior: given input X, the system should always produce output Y. LLM reasoning is stochastic, context-dependent, and path-dependent. A monitoring architecture must account for all three.

## 2. History

The first generation of LLM monitoring (2022-2023) focused on output quality: checking whether generated text was toxic, factually incorrect, or off-topic. Tools like Guardrails AI, NeMo Guardrails, and LangSmith provided post-hoc filtering and tracing. These were output monitors, not reasoning monitors.

The second generation (2023-2024) introduced process monitoring: checking intermediate reasoning steps, not just final answers. Lightman et al. (2023) trained process reward models (PRMs) that scored each step of mathematical reasoning. Uesato et al. (2022) compared outcome-based and process-based supervision, finding that process supervision caught more subtle errors.

The third generation (2024-present) confronts the agentic monitoring problem: models that take actions in the real world (executing code, modifying files, making API calls) need monitoring that operates in the action loop, not just on the text output. Anthropic's model spec (2025) introduced the concept of "action monitoring" where the system checks proposed actions against safety constraints before execution.

The gap remains: there is no unified framework for monitoring reasoning quality across heterogeneous agent tasks at the scale and latency required by production multi-agent systems.

## 3. Current State of the Art

**Process reward models (PRMs)** are the strongest existing technique. Lightman et al. (2023) showed that training a verifier to check each reasoning step outperforms training one to check only the final answer. The PRM800K dataset provides step-level annotations for mathematical reasoning. Limitation: PRMs are domain-specific and expensive to train for new domains.

**Metamorphic testing** (Chen et al., 2018; adapted for LLMs by Xie et al., 2024) defines metamorphic relations: if you perturb the input in a known way, the output should change in a predictable way. For example, if you add 10 to every number in a math problem, the answer should change by a calculable amount. This works without knowing the "correct" answer and scales well, but requires domain-specific relation definitions.

**Statistical process control** (SPC) adapted from manufacturing applies control charts to LLM output metrics (perplexity, token entropy, reasoning step count). When metrics drift outside control limits, the system flags the output for review. Limitation: SPC detects distributional shifts, not individual reasoning failures.

**Constitutional monitoring** (Anthropic, 2025) uses a secondary model call to evaluate whether the primary model's output satisfies a set of principles. This is effectively a lightweight debate protocol. Limitation: the monitor model may share the same systematic biases as the primary model.

**Trace-based observability** (OpenTelemetry for LLMs, LangFuse, Helicone) provides infrastructure for logging and analyzing reasoning traces. These tools capture the data but do not analyze it for faithfulness or correctness -- they are the plumbing, not the intelligence.

## 4. Connection to Our Work

**GSD hooks as monitoring infrastructure.** The gsd-skill-creator already has a hook system (PreToolUse, PostToolUse, PostCompact, FileChanged) that fires deterministically at action boundaries. These hooks are the natural insertion point for reasoning monitors. A PostToolUse hook could check whether the action taken is consistent with the plan's task description and the agent's stated reasoning. The hook system runs synchronously, providing the latency guarantees needed for real-time monitoring.

**The 21,298 test baseline.** The gsd-skill-creator's test suite provides a deterministic verification layer. The monitoring problem is specifically about the gap between what the tests verify (outputs from deterministic code) and what the agents produce (outputs from stochastic reasoning). Metamorphic testing could bridge this gap: define metamorphic relations for agent tasks (e.g., "if you permute the order of independent tasks in a plan, the outputs should be equivalent").

**Convoy model natural checkpoints.** The Gastown convoy model structures execution into waves with explicit synchronization points. These synchronization points are natural monitoring checkpoints. Rather than monitoring every reasoning token, monitor the aggregate behavior at wave boundaries: did all agents in the wave produce consistent results? Did any agent deviate from the plan in a way the others did not?

**S-PATH RAG pattern.** The S-PATH RAG architecture (arXiv:2603.23512) uses graph-aware retrieval with a verifier pattern and path budget. The verifier pattern -- checking whether the retrieval path supports the generated answer -- is directly applicable to CoT monitoring: check whether the reasoning path supports the final action.

**Skill validation pipeline.** When the skill-creator validates a new skill, it currently runs the skill and checks outputs. A reasoning monitor could extend this: validate not just that the skill produces correct outputs, but that its reasoning traces exhibit the expected structure. Skills with unstable reasoning traces (high variance across runs) could be flagged for additional testing.

## 5. Open Questions

- **Can metamorphic relations be auto-generated from GSD plan descriptions?** A plan task like "create user authentication" has implicit metamorphic properties (e.g., changing the user's name should not change the auth flow logic). If we can extract these automatically, monitoring becomes plan-driven rather than manually configured.
- **What is the right granularity for convoy monitoring?** Per-token (too expensive), per-step (requires step identification), per-task (too coarse), per-wave (natural fit but delayed)?
- **Can the muse council serve as a process reward model?** Each muse evaluates from a different perspective (Cedar for trust, Hemlock for correctness, Willow for coherence). Their collective evaluation of a reasoning trace could approximate a multi-domain PRM without training a dedicated model.
- **Is there a useful signal in the analysis paralysis guard?** The guard triggers after 5+ reads without writes. This behavioral signal (an agent that reads extensively but cannot act) may correlate with reasoning failures. Tracking guard activations across sessions could reveal patterns.

## 6. References

- Lightman, H., et al. (2023). "Let's Verify Step by Step." [arXiv:2305.20050](https://arxiv.org/abs/2305.20050)
- Uesato, J., et al. (2022). "Solving Math Word Problems with Process- and Outcome-Based Feedback." [arXiv:2211.14275](https://arxiv.org/abs/2211.14275)
- Chen, T.Y., et al. (2018). "Metamorphic Testing: A Review of Challenges and Opportunities." *ACM Computing Surveys*, 51(1).
- Xie, X., et al. (2024). "Metamorphic Testing for LLM-Based Systems." [arXiv:2403.07820](https://arxiv.org/abs/2403.07820)
- S-PATH (2025). "Graph-Aware Retrieval-Augmented Generation with Path Budget." [arXiv:2603.23512](https://arxiv.org/abs/2603.23512)
- Anthropic (2025). "The Model Spec." [anthropic.com/model-spec](https://www.anthropic.com/research/the-model-spec)
- Helicone (2025). "LLM Observability Platform." [helicone.ai](https://www.helicone.ai/)
- LangFuse (2025). "Open Source LLM Engineering Platform." [langfuse.com](https://langfuse.com/)
