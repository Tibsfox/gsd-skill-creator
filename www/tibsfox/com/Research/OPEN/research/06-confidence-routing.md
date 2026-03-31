# Confidence-Based Routing

> **Problem ID:** OPEN-P6
> **Domain:** AI / Trust
> **Status:** Partial
> **Through-line:** *A model that says "I'm 95% confident" when it's actually right 60% of the time is worse than a model that says nothing at all -- because the false confidence propagates through every downstream decision. In a trust system, miscalibrated confidence is an integrity failure.*

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

When a language model produces an output, it implicitly or explicitly expresses confidence. The **confidence routing problem** asks two questions:

**Calibration:** Is the model's expressed confidence correlated with its actual accuracy? A well-calibrated model that says "I'm 90% confident" should be correct 90% of the time. Empirically, LLMs are poorly calibrated -- they tend toward overconfidence on factual claims and underconfidence on reasoning tasks (Kadavath et al., 2022).

**Routing:** Given calibrated (or uncalibrated) confidence signals, how should a multi-agent system route tasks to maximize reliability? If Agent A reports low confidence on a code generation task, should the system route to Agent B, request human review, or retry with a different prompt? The routing policy depends on the confidence calibration, creating a circular dependency.

Formally: let `C(a, t)` be agent `a`'s reported confidence on task `t`, and `P(correct | a, t)` be the true probability of correctness. The system is well-calibrated if `P(correct | C(a,t) = c) = c` for all `c in [0,1]`. The routing problem is: given a set of agents `A`, a task `t`, and calibration estimates `hat{P}` for each agent, assign `t` to `argmax_{a in A} hat{P}(correct | a, t)`, subject to cost and latency constraints.

## 2. History

Confidence calibration in neural networks was first studied by Guo et al. (2017), who showed that modern deep networks are significantly miscalibrated: they tend to be overconfident, with accuracy lower than predicted confidence. Temperature scaling was introduced as a simple post-hoc calibration method.

For LLMs specifically, Kadavath et al. (2022) published "Language Models (Mostly) Know What They Know," showing that LLMs can distinguish between questions they can and cannot answer, but their calibration degrades on harder questions and is sensitive to prompt format. The key finding: asking a model "are you sure?" after it answers changes its expressed confidence but does not improve calibration.

The routing problem emerged with the multi-model landscape (2023-2024): GPT-4, Claude 3, Gemini, Llama, Mistral all available at different price points with different capability profiles. Routing systems like Martian, Portkey, and OpenRouter began routing queries to different models based on cost/quality tradeoffs. However, these routers use historical accuracy data, not per-query confidence, to make routing decisions.

FrugalGPT (Chen et al., 2023) formalized the cascading approach: start with a cheap model, check confidence, and escalate to a more expensive model only if confidence is below a threshold. This showed 90% cost reduction with minimal accuracy loss on benchmarks, but relied on well-calibrated confidence from the cheap model -- exactly the assumption that calibration research questions.

## 3. Current State of the Art

**Token-level confidence** can be extracted from logprobs (the probability the model assigns to each token). High logprob variance in the answer tokens indicates uncertainty. This is a mechanical signal (independent of the model's self-assessment) and correlates with accuracy. Limitation: logprobs are not available from all providers and do not capture uncertainty about the overall reasoning strategy.

**Verbalized confidence** (asking the model "how confident are you on a scale of 1-10") is easy to extract but poorly calibrated. Tian et al. (2023) showed that verbalized confidence can be improved with calibration prompts and few-shot examples of correctly calibrated responses, but the improvement is fragile and task-dependent.

**Ensemble disagreement** uses multiple model calls (or multiple samples from the same model) and measures disagreement as a proxy for uncertainty. High disagreement = low confidence. This is well-calibrated by construction (if 5 out of 5 samples agree, accuracy is high) but expensive (5x cost).

**Conformal prediction** (Angelopoulos & Bates, 2021; adapted for LLMs by Quach et al., 2024) provides distribution-free confidence intervals: given a calibration set, conformal prediction produces prediction sets that are guaranteed to contain the correct answer with probability `1 - alpha`. This is the strongest theoretical guarantee available but requires a calibration dataset for each task domain.

**Mixture-of-experts routing** (Switch Transformer, Fedus et al., 2022; Mixtral, Jiang et al., 2024) routes at the token level within a single model. The router learns which expert to activate for each token. This is not confidence-based routing between agents, but the architecture provides lessons: routing decisions must be fast (per-token latency), and the router itself must be simple to avoid becoming a bottleneck.

## 4. Connection to Our Work

**Trust system (trust-relationship.ts).** The trust system assigns trust scores based on observed agent behavior. Confidence calibration is a critical input: an agent with well-calibrated confidence should receive higher trust than an agent with poorly calibrated confidence, *independent of accuracy*. A 70%-accurate agent that knows it is 70%-accurate is more useful than an 85%-accurate agent that claims 99% confidence, because the first agent's outputs can be correctly weighted in downstream decisions.

**Cedar as confidence filter.** Cedar's role ("trust no one -- earned, not given") maps directly to the calibration problem. Initial trust should be low (default to poorly calibrated) and should increase only as the agent demonstrates calibrated confidence over time. The trust decay mechanism should penalize confidence miscalibration specifically, not just inaccuracy.

**FoxFiber routing.** The FoxFiber vision (trust-based network routing) requires confidence-calibrated routing at the infrastructure level. If FoxFiber routes agent traffic based on trust scores, and trust scores incorporate confidence calibration, then the entire network becomes a confidence-aware routing fabric. Miscalibrated confidence at any node degrades routing quality throughout the network.

**Convoy model escalation.** The deviation rules define an escalation protocol: Rule 1-3 auto-fix, Rule 4 escalate to human. The confidence-routing problem suggests a more granular version: tasks where agent confidence is below a threshold get routed to a higher-capability agent (or agent ensemble) before escalating to a human. This inserts a calibration-aware layer between auto-fix and human escalation.

**GSD executor model selection.** The executor currently runs on a single model (Claude Opus). With confidence routing, the executor could use a lighter model for high-confidence tasks (plan parsing, file creation) and escalate to Opus only for low-confidence tasks (architectural decisions, complex debugging). The `executor_model` field in GSD config is already parameterized for this.

## 5. Open Questions

- **Can we build a per-agent calibration curve from convoy execution history?** Each agent's task completions are committed with success/failure metadata. Over hundreds of tasks, we could estimate each agent's calibration and adjust routing accordingly.
- **Is conformal prediction practical for GSD task routing?** The calibration set requirement means we need historical data for each task *type*. The GSD plan taxonomy (feat, fix, refactor, test, chore) provides natural categories, but the within-category variance may be too high.
- **Should the trust system expose confidence as a first-class metric alongside accuracy?** Currently trust-relationship.ts tracks trust scores as a single number. Decomposing into accuracy and calibration components would allow more nuanced routing.
- **Can ensemble disagreement serve as a real-time confidence signal in the convoy?** If a wave has 4 agents, and 3 produce similar code but 1 diverges, the disagreement is a confidence signal about the divergent agent. This requires comparing outputs mid-wave, which the current architecture does not support.

## 6. References

- Kadavath, S., et al. (2022). "Language Models (Mostly) Know What They Know." [arXiv:2207.05221](https://arxiv.org/abs/2207.05221)
- Guo, C., et al. (2017). "On Calibration of Modern Neural Networks." *ICML 2017*. [arXiv:1706.04599](https://arxiv.org/abs/1706.04599)
- Chen, L., et al. (2023). "FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance." [arXiv:2305.05176](https://arxiv.org/abs/2305.05176)
- Tian, K., et al. (2023). "Just Ask for Calibration: Strategies for Eliciting Calibrated Confidence Scores from Language Models." [arXiv:2305.14975](https://arxiv.org/abs/2305.14975)
- Angelopoulos, A. & Bates, S. (2021). "A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification." [arXiv:2107.07511](https://arxiv.org/abs/2107.07511)
- Quach, V., et al. (2024). "Conformal Language Modeling." [arXiv:2306.10193](https://arxiv.org/abs/2306.10193)
- Fedus, W., et al. (2022). "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity." *JMLR*, 23(120). [arXiv:2101.03961](https://arxiv.org/abs/2101.03961)
- Jiang, A., et al. (2024). "Mixtral of Experts." [arXiv:2401.04088](https://arxiv.org/abs/2401.04088)
