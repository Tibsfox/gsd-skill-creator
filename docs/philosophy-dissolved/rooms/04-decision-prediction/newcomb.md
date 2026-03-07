# Newcomb's Problem

**Room:** 4 — Decision & Prediction
**Foundation(s):** Information Theory (F7)
**Architecture Connection:** GSD Trust Model

---

## The Paradox

In 1969, the philosopher Robert Nozick introduced a problem attributed to the physicist William Newcomb that split decision theory into two warring camps — a division that remains unresolved after more than half a century of argument. The setup is deceptively simple. A predictor — call them Omega — has an established, nearly perfect track record of forecasting human choices. Omega presents you with two boxes. Box A is transparent and always contains $1,000. Box B is opaque. Yesterday, before you arrived, Omega made a prediction. If Omega predicted you would take only Box B, Omega placed $1,000,000 inside it. If Omega predicted you would take both boxes, Omega left Box B empty. The prediction is already made. The money is already placed. The boxes are sealed. You choose: take only Box B, or take both?

Two schools of decision theory give opposite answers, and both are rigorous. Evidential Decision Theory (EDT) says: take only Box B. Your choice is evidence of what Omega predicted, and Omega's predictions are nearly always correct. One-boxers walk away with $1,000,000 almost every time. Two-boxers walk away with $1,000 almost every time. The expected value calculation is overwhelming: one-boxing wins. Causal Decision Theory (CDT) says: take both boxes. Omega's prediction was made yesterday. The money is already in the boxes or it is not. Your choice right now cannot reach backward through time and rearrange the contents. Whatever is in Box B, taking both boxes nets you exactly $1,000 more than taking one. This is a strict dominance argument — a move that yields more money regardless of the state of the world — and decision theory does not get more fundamental than dominance.

The difficulty is genuine and deep. EDT appears to confuse correlation with causation — it treats the act of choosing as though it *causes* the prediction, when the prediction happened yesterday and no physical mechanism connects your present choice to Omega's past action. CDT appears to leave a million dollars on the table — it produces the logically dominant strategy that, empirically, loses. If you put a thousand CDT agents and a thousand EDT agents through the experiment with a high-accuracy predictor, the EDT agents end up rich and the CDT agents end up poor. CDT is "right" in the sense that it respects the causal structure of time, and EDT is "right" in the sense that it makes more money. Philosophers have been unable to reconcile these two notions of "right" because the tools of philosophical argument — intuitions about causation, dominance principles, thought experiments — cannot measure the thing that actually matters. The debate needs an instrument.

---

## The Foundation

**Instrument: Shannon's Mutual Information and Algorithmic Correlation**

The philosophical debate runs aground because both sides operate with an impoverished model of causation. CDT recognizes only physical-temporal causation: event A causes event B only if A temporally precedes B and there is a physical mechanism transmitting influence from A to B. EDT recognizes evidential correlation but cannot distinguish it from causation, treating any statistical dependence as decision-relevant. Neither framework has the vocabulary to describe what is actually happening between your decision algorithm and Omega's prediction.

Information theory provides that vocabulary. The mutual information $I(D; P)$ between two random variables $D$ (your decision) and $P$ (Omega's prediction) quantifies exactly how much knowing one tells you about the other:

$$I(D; P) = H(D) - H(D \mid P) = H(P) - H(P \mid D)$$

where $H(\cdot)$ is Shannon entropy and $H(\cdot \mid \cdot)$ is conditional entropy. When $I(D; P) = 0$, the two are statistically independent — knowing your decision tells Omega nothing, and knowing Omega's prediction tells you nothing. When $I(D; P) = H(D)$, the mutual information is maximal — Omega's prediction captures the full information content of your decision process. The magnitude of $I(D; P)$ is a measurable quantity, not a philosophical position. It is the instrument the debate was missing.

**The framework:** Mutual information measures the shared algorithmic information between a decision process and a predictive model of that process. Causal influence can flow through shared information — through the fact that the predictor modeled the decision algorithm — without requiring backward-in-time physical causation.

---

## The Resolution

### The Source of the Correlation

The CDT/EDT debate assumes that if your choice does not physically cause Omega's prediction, then the correlation between your choice and the prediction must be mere evidential coincidence — a statistical regularity with no causal basis. But this is a false dichotomy. There is a third possibility: the correlation exists because Omega *modeled your decision algorithm*.

Omega did not read the future. Omega studied you — your history of choices, your decision-making patterns, your responses to similar situations, perhaps even the computational structure of your reasoning process. From this study, Omega built a model $\hat{D}$ of your decision algorithm $D$. If the model is high-fidelity, then the mutual information between the model's output and your actual decision is high:

$$I(D; \hat{D}) \approx H(D)$$

Omega's prediction $P$ is a deterministic function of $\hat{D}$: predict one-boxing if $\hat{D}$ outputs one-box, predict two-boxing if $\hat{D}$ outputs two-box. By the data processing inequality, $I(D; P) \leq I(D; \hat{D})$. But since $P$ is a simple function of $\hat{D}$ (a binary mapping that preserves the relevant bit), $I(D; P) \approx I(D; \hat{D}) \approx H(D)$.

The correlation between your decision and the prediction is not a spooky backward-in-time effect. It is a forward-in-time consequence of shared information: your decision algorithm $D$ exists at the time Omega studies you, Omega builds a model $\hat{D}$ that captures the information in $D$, and both your actual decision and Omega's prediction are outputs of processes that share this common informational ancestor.

### Dissolving the CDT/EDT Divide

CDT is correct about the physics. Your act of choosing does not send a signal backward through time. The money is in the boxes or it is not, and your hand reaching for one box or two does not rearrange the contents. No law of physics is violated.

EDT is correct about the statistics. Your choice *is* correlated with the prediction, and the correlation is not coincidental — it is grounded in the shared information between your algorithm and Omega's model. One-boxing is statistically associated with finding $1,000,000 in Box B because the same algorithmic structure that produces one-boxing is the structure that Omega's model detected and responded to.

Information theory unifies them. The mutual information $I(D; P)$ measures the strength of the algorithmic correlation. This is not backward causation (CDT is right to reject that). It is not mere coincidence (EDT is right that the correlation is decision-relevant). It is *informational causation*: the causal chain runs from your decision algorithm, through Omega's observation and modeling process, to Omega's prediction. The information flowed forward in time at every step. The correlation in the outputs is a consequence of the shared information in the inputs.

### The Decision Criterion

Once the framework is in place, the optimal strategy depends on a measurable quantity rather than a philosophical commitment:

$$\text{If } I(D; P) \approx H(D): \text{ one-box.}$$
$$\text{If } I(D; P) \approx 0: \text{ two-box.}$$

When $I(D; P)$ is high — when Omega's model captures nearly all the information in your decision process — then your decision algorithm and Omega's prediction are tightly coupled. Choosing to one-box means you are the kind of algorithm that one-boxes, which means Omega's model predicted one-boxing, which means Box B contains $1,000,000. The expected value of one-boxing approaches $1,000,000.

When $I(D; P)$ is low — when Omega is a poor predictor, or when Omega's model is based on a population average rather than your specific algorithm — then the correlation is weak. Your choice tells you little about the prediction. In this regime, CDT's dominance argument holds: take both boxes, because the prediction is approximately independent of your choice, and two-boxing strictly dominates.

The paradox persisted because philosophers treated it as an all-or-nothing question: *always* one-box or *always* two-box. The information-theoretic resolution reveals that the answer is conditional on a measurable parameter. The debate was not about a difference in values or rationality standards. It was about an unmeasured variable. Once you measure $I(D; P)$, the optimal strategy is determined, and the two schools of decision theory agree.

### The Key Insight

The paradox rests on an impoverished model of causation that permits only two options: direct physical causation (CDT) or evidential correlation (EDT). Information theory introduces a third: algorithmic correlation through shared information. The predictor did not read the future. The predictor read your algorithm and simulated its output. The mutual information between your decision and the prediction is the measure of how well the predictor succeeded. Once this quantity is on the table, the paradox dissolves into a measurement problem — and measurement problems have answers.

---

## The Architecture

### The Wasteland Federation Trust Model

The wasteland federation's trust escalation system is Newcomb's Problem resolved as engineering.

A rig in the federation declares its intent before executing a task — it commits to a plan, a scope, and a set of deliverables. The federation's trust system then observes the rig's actual behavior: what it built, how closely the output matched the declared intent, whether it respected boundaries. The trust level encodes exactly the mutual information $I(\text{declared}; \text{observed})$ between a rig's commitments and its actions.

A high-trust rig is one where $I(\text{declared}; \text{observed}) \approx H(\text{declared})$ — the federation's model of the rig accurately predicts the rig's behavior, because the rig's behavior faithfully follows its declarations. This is the Newcomb setup: the federation (Omega) has modeled the rig (the decision-maker) and allocated resources (the money in Box B) based on its prediction of the rig's behavior. A rig that consistently does what it says it will do — a one-boxer, in the analogy — earns high trust and receives greater autonomy, larger task allocations, and access to more sensitive operations. A rig that deviates from its declarations — a two-boxer, grabbing resources beyond its stated scope — triggers trust degradation regardless of whether the individual deviation was locally profitable.

The trust escalation system does not argue about whether the rig's declared intent "causes" its future behavior in a philosophically rigorous sense. It measures the mutual information. The `evaluateTrustLevel()` function computes the correlation between declared and observed over a sliding window of past interactions. If the correlation is high, trust rises. If it drops, trust falls. The system does not need to resolve the CDT/EDT debate. It sidesteps it entirely by measuring $I(D; P)$ directly — exactly the quantity that dissolves the paradox.

This is the deeper lesson. You earn trust not by arguing about causation, not by asserting that your future behavior will match your declarations, but by having high mutual information between your commitments and your actions — by being the kind of algorithm whose outputs are predictable from its stated intentions. The federation does not care whether the correlation is "causal" or "evidential." It cares whether the correlation is high. That is Newcomb's Problem, dissolved into an operational principle: trust is measured mutual information between declared intent and observed behavior, and the optimal strategy — for rigs as for decision-makers — is to be the kind of agent whose declarations predict its actions.

**Component:** Wasteland Federation Trust Escalation System
**Correspondence:** Trust levels encode $I(\text{declared}; \text{observed})$. High-trust rigs are one-boxers — agents whose behavior is predictable from their commitments. The trust system resolves Newcomb's Problem by measuring the mutual information directly, making the CDT/EDT debate architecturally irrelevant.
