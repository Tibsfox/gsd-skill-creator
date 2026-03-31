# Machine Unlearning

> **Problem ID:** OPEN-P12
> **Domain:** AI / Privacy / Security
> **Status:** Partial
> **Through-line:** *If a user asks to be forgotten, can the model truly forget? Not "ignore when prompted" but actually remove the influence of their data from every weight, every activation pattern, every emergent capability that their data contributed to? If not, then consent frameworks -- including GUPP and DACP -- are unenforceable promises. The right to be forgotten requires the ability to be forgotten.*

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

**Machine unlearning** is the problem of removing the influence of specific training data from a trained machine learning model without retraining from scratch. Formally:

Let `M` be a model trained on dataset `D = {d_1, ..., d_n}`. Given a subset `D_f subset D` (the "forget set"), produce a model `M'` such that:

1. **Unlearning guarantee:** `M'` is indistinguishable (in some formal sense) from a model `M*` trained on `D \ D_f` from scratch.
2. **Utility preservation:** `M'` performs comparably to `M` on tasks not involving `D_f`.
3. **Efficiency:** Producing `M'` is significantly cheaper than retraining `M*` from scratch.

The "indistinguishable" requirement is the crux. Strong unlearning (also called exact unlearning) requires that the distribution of `M'` is identical to the distribution of `M*` -- not just that `M'` cannot reproduce the forgotten data, but that no statistical test can distinguish `M'` from a model that never saw the data. Weak unlearning requires only that specific outputs related to `D_f` are suppressed.

For large language models, the problem is especially hard because:
- Training data influences are distributed across billions of parameters
- Individual data points contribute to emergent capabilities (not just memorized outputs)
- The training process is not easily invertible
- Verification requires knowing what "never having seen the data" looks like

## 2. History

**2015-2019:** The "right to be forgotten" (GDPR Article 17, effective 2018) creates a legal mandate for data deletion. For traditional databases, this is straightforward. For ML models trained on the data, the question is: does deleting the training data suffice, or must the model itself be modified?

**2019:** Cao & Yang publish "Towards Making Systems Forget with Machine Unlearning," the first systematic treatment. They propose SISA (Sharded, Isolated, Sliced, and Aggregated) training: partition the training data into shards, train sub-models on each shard, and aggregate. To unlearn, retrain only the shard containing the forgotten data. This is exact unlearning but requires the sharding structure to be set up before training.

**2020-2021:** Bourtoule et al. (2021) formalize SISA and demonstrate it on CIFAR-10 and Purchase datasets. Golatkar et al. (2020) propose approximate unlearning using Fisher information to estimate and remove the influence of specific data points. Sekhari et al. (2021) provide theoretical bounds on the cost of unlearning as a function of model complexity.

**2022-2023:** The NeurIPS 2023 Machine Unlearning Challenge focuses the community on standardized benchmarks and evaluation criteria. Jia et al. (2023) show that existing approximate unlearning methods fail against adaptive adversaries -- an adversary who knows the unlearning algorithm was applied can often recover the supposedly forgotten data.

**2024-2025:** LLM-specific unlearning research intensifies. Eldan & Russinovich (2023) demonstrate "Who's Harry Potter" -- removing knowledge of a specific fictional universe from a language model. Maini et al. (2024) propose TOFU (Task of Fictitious Unlearning), a benchmark for evaluating unlearning in LLMs. The Google DeepMind Machine Unlearning Challenge (2024) establishes large-scale evaluation protocols.

## 3. Current State of the Art

**Exact unlearning (SISA-style)** is the only method with provable guarantees. The cost: each shard must be small enough that retraining is fast, but large enough that the sub-model is useful. For LLMs with trillions of tokens of training data, the shard size needed for efficient retraining is far too small for useful sub-models. SISA does not scale to foundation models.

**Approximate unlearning** uses gradient-based methods to adjust the model's weights to remove the influence of forgotten data. Techniques include:
- **Influence function-based:** Estimate the influence of each training point on the model's parameters (Koh & Liang, 2017) and reverse it. Works for convex models; unreliable for deep networks.
- **Fine-tuning on negatives:** Fine-tune the model to produce incorrect or random outputs when prompted with information from `D_f`. This suppresses outputs but does not remove the underlying knowledge (it is "forgetting" by overwriting, not by removal).
- **Gradient ascent:** Perform gradient ascent on the loss of `D_f`, undoing the gradient descent that incorporated the data. This is theoretically motivated but destabilizes the model for large forget sets.

**Verification is the bottleneck.** Even if an unlearning algorithm produces `M'`, how do we verify that unlearning actually occurred? Membership inference attacks (Shokri et al., 2017) can test whether a specific data point was in the training set, but they have limited power and cannot detect subtle residual influence.

**The gap:** For LLMs, no method achieves all three desiderata simultaneously: strong unlearning guarantee, utility preservation, and efficiency. Current methods sacrifice at least one.

## 4. Connection to Our Work

**GUPP (Generalized User Privacy Protocol).** GUPP defines how user data is collected, stored, and deleted in the gsd-skill-creator ecosystem. The machine unlearning problem is GUPP's enforcement challenge: if a user revokes consent for their data to be used in skill training, GUPP requires that the data's influence be removed from all trained skills. If machine unlearning is impossible to verify, GUPP's deletion guarantee becomes aspirational rather than enforceable.

**DACP (Distributed Agent Consent Protocol).** DACP governs how agents request and revoke consent for data sharing. When an agent revokes consent, all downstream agents that incorporated the shared data should unlearn it. In a multi-agent system with chained data flows, unlearning must propagate: if Agent A shares data with Agent B, which shares a derivative with Agent C, revoking A's consent requires unlearning in both B and C. This is the **cascading unlearning** problem, significantly harder than single-model unlearning.

**Trust system and unlearning.** The trust-relationship.ts module tracks trust scores based on historical interactions. If an interaction is later determined to be fraudulent or based on revoked data, the trust score should be recalculated as if the interaction never occurred. This is exact unlearning applied to the trust graph -- and it requires that the trust score function be efficiently invertible with respect to individual interactions.

**Skill-creator adaptive learning.** The skill-creator learns from usage patterns to improve skills. If a user's usage patterns are revoked, the influenced skills must be updated. The SISA approach (shard the training data) could be applied: train skills on user-specific shards, so that unlearning requires retraining only one shard. This design decision should be made before the skill-creator's learning pipeline is finalized.

**Fox CapComm alignment.** Fox CapComm (the communications company in the Fox infrastructure vision) handles data transit and storage. If Fox CapComm routes agent communications that include user data, and the user later revokes consent, the unlearning problem extends to the infrastructure layer: not just the model, but the communication logs, caches, and derived analytics must all be cleaned. This is the "data gravity" problem -- once data enters a system, its influence spreads to every component it touches.

**Security-hygiene skill.** The security-hygiene skill handles safety in the self-modifying gsd-skill-creator system. Machine unlearning adds a new dimension: can the system unlearn a malicious skill that was learned from adversarial data? If an attacker injects poisoned data that teaches the system a dangerous skill, unlearning must remove not just the data but the skill and all its downstream effects.

## 5. Open Questions

- **Can GUPP be designed with SISA-compatible data sharding from the start?** If user data is sharded at collection time, unlearning becomes tractable. The design cost is up-front but avoids the impossible problem of post-hoc unlearning from a monolithic model.
- **Is cascading unlearning in the DACP multi-agent chain computationally feasible?** The worst case is exponential (each agent shares derivatives with multiple others). Can the DACP protocol structure data flows to bound the cascade depth?
- **Can the trust system's recalculation be made efficient for unlearning?** If trust scores are computed as running averages, removing one interaction requires recomputing the average -- O(1) if we store sufficient statistics. But if trust is computed via a neural function of interaction history, unlearning requires the full machinery of approximate unlearning.
- **Should the gsd-skill-creator adopt a "forgettable by design" architecture?** Rather than solving unlearning after the fact, design every learning component (skills, trust, routing) to support efficient unlearning from the start. This is a fundamental architectural decision for v1.50 and beyond.
- **Is there a verification protocol for unlearning in multi-agent systems?** Membership inference adapted for agent chains: after unlearning, no agent in the chain can produce outputs that distinguish the forgotten data from random data. Can this be tested efficiently?

## 6. References

- Cao, Y. & Yang, J. (2015). "Towards Making Systems Forget with Machine Unlearning." *IEEE S&P 2015*.
- Bourtoule, L., et al. (2021). "Machine Unlearning." *IEEE S&P 2021*. [arXiv:1912.03817](https://arxiv.org/abs/1912.03817)
- Golatkar, A., et al. (2020). "Eternal Sunshine of the Spotless Net: Selective Forgetting in Deep Networks." *CVPR 2020*. [arXiv:1911.04933](https://arxiv.org/abs/1911.04933)
- Sekhari, A., et al. (2021). "Remember What You Want to Forget: Algorithms for Machine Unlearning." *NeurIPS 2021*. [arXiv:2103.03279](https://arxiv.org/abs/2103.03279)
- Eldan, R. & Russinovich, M. (2023). "Who's Harry Potter? Approximate Unlearning in LLMs." [arXiv:2310.02238](https://arxiv.org/abs/2310.02238)
- Maini, P., et al. (2024). "TOFU: A Task of Fictitious Unlearning for LLMs." [arXiv:2401.06121](https://arxiv.org/abs/2401.06121)
- Jia, J., et al. (2023). "Model Sparsity Can Simplify Machine Unlearning." *NeurIPS 2023*. [arXiv:2304.04934](https://arxiv.org/abs/2304.04934)
- Koh, P.W. & Liang, P. (2017). "Understanding Black-Box Predictions via Influence Functions." *ICML 2017*. [arXiv:1703.04730](https://arxiv.org/abs/1703.04730)
- Shokri, R., et al. (2017). "Membership Inference Attacks Against Machine Learning Models." *IEEE S&P 2017*. [arXiv:1610.05820](https://arxiv.org/abs/1610.05820)
- Google DeepMind (2024). "Machine Unlearning Challenge." [unlearning-challenge.github.io](https://unlearning-challenge.github.io/)
