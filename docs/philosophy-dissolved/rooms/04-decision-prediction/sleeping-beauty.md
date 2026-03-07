# The Sleeping Beauty Problem

**Room:** 4 — Decision & Prediction
**Foundation(s):** Set Theory (F5) + Information Theory (F7)
**Architecture Connection:** GSD Observation Engine

---

## The Paradox

In 2000, the philosopher Adam Elga posed a problem in the philosophy of probability that has generated a literature of remarkable sophistication and zero consensus. The setup is precise. Sleeping Beauty agrees to the following experiment. On Sunday, she is put to sleep. A fair coin is flipped. If the coin lands Heads, she is awakened on Monday, interviewed, and the experiment ends. If the coin lands Tails, she is awakened on Monday, interviewed, put back to sleep with her memory of Monday's awakening erased, and then awakened again on Tuesday for a second interview. The key feature: upon each awakening, Beauty has no way to determine whether it is Monday or Tuesday, or whether the coin landed Heads or Tails. Her subjective experience of each awakening is identical. Each time she wakes, she is asked: "What is your credence that the coin landed Heads?"

The Halfer position: $P(\text{Heads}) = 1/2$. The coin is fair. Beauty knew before the experiment that the coin had a 50% chance of landing Heads. Upon awakening, she learns nothing new — she knew in advance that she would be awakened at least once regardless of the coin's outcome. An awakening is guaranteed under both Heads and Tails, so the experience of awakening carries no information about the coin. Her credence should remain at the prior: one half.

The Thirder position: $P(\text{Heads}) = 1/3$. There are three possible awakening-states that Beauty might be experiencing: Monday-Heads, Monday-Tails, and Tuesday-Tails. Beauty cannot distinguish among them. If she treats them as equiprobable (she has no evidence favoring any one over the others), then she is in one of three states, only one of which corresponds to Heads. Her credence in Heads should be one third.

Both arguments are internally coherent, and the disagreement has persisted for a quarter-century because each side can identify a flaw in the other's reasoning without resolving their own. The halfer accuses the thirder of conflating the probability of a coin outcome with the frequency of awakening-experiences. The thirder accuses the halfer of ignoring the indexical information available to Beauty — the fact that she is *this* awakening, not merely that she is "in the experiment." The debate has produced careful formalisms on both sides (Elga 2000, Lewis 2001, Dorr 2002, Titelbaum 2013) and no resolution, because the disagreement is not about the mathematics of probability. It is about what the mathematics should be *applied to*.

---

## The Foundation

**Instruments: Set Theory (F5) and Information Theory (F7)**

The halfer and the thirder are not making the same calculation with different results. They are making *different calculations* — each correct within its own framework — and the paradox arises from the ambiguity about which calculation is the right one. This is a problem about the definition of the sample space, and the definition of a sample space is a question in set theory. It is also a problem about what constitutes a "new observation," and that is a question in information theory.

Set theory (F5) provides the formal apparatus for defining probability spaces: a sample space $\Omega$, a sigma-algebra $\mathcal{F}$ of events, and a probability measure $P$ on $\mathcal{F}$. The critical move is the *choice of $\Omega$*. Different sample spaces yield different probability measures, and both can be mathematically valid. The paradox persists because the problem statement does not uniquely determine the sample space — it is compatible with more than one.

Information theory (F7) provides the apparatus for determining whether Beauty gains information upon awakening. The question "did she learn something new?" translates into: what is the mutual information $I(\text{awakening}; \text{coin})$ between the experience of awakening and the coin outcome? If the mutual information is zero, the halfer is right — awakening carries no news. If it is positive, the thirder has a case — awakening shifts the posterior. The answer depends on how the observation is defined, which depends on the sample space.

**The framework:** The Sleeping Beauty Problem is a sample-space ambiguity — a disagreement about $\Omega$ — resolvable by specifying what is being measured. Different questions about the same experiment have different correct answers.

---

## The Resolution

### Two Sample Spaces, Two Correct Answers

Define the experiment formally and construct both sample spaces.

**The Halfer's sample space $\Omega_H$:** The set of possible *world-states* — outcomes of the coin flip.

$$\Omega_H = \{\text{Heads}, \text{Tails}\}$$

The coin is fair, so $P_H(\text{Heads}) = P_H(\text{Tails}) = 1/2$.

The halfer's question: "Given that Beauty is a participant in this experiment (and she knows she is), what is the probability that the coin landed Heads?" The answer is $1/2$. The coin is fair. Being awakened is compatible with both outcomes. The experience of awakening does not discriminate between Heads and Tails — Beauty would be awakened at least once in either case — so no Bayesian update occurs.

Formally, the likelihood ratio is:

$$\frac{P(\text{awakened} \mid \text{Heads})}{P(\text{awakened} \mid \text{Tails})} = \frac{1}{1} = 1$$

A likelihood ratio of 1 produces no shift in posterior probability. The prior was $1/2$; the posterior is $1/2$. The halfer's calculation is correct.

**The Thirder's sample space $\Omega_T$:** The set of possible *awakening-experiences* — observer-moments that Beauty might be inhabiting.

$$\Omega_T = \{\text{Mon-Heads}, \text{Mon-Tails}, \text{Tue-Tails}\}$$

The experiment generates one awakening under Heads and two under Tails. If Beauty applies the principle of indifference over awakening-experiences (she has no evidence favoring any one over the others), then:

$$P_T(\text{Mon-Heads}) = P_T(\text{Mon-Tails}) = P_T(\text{Tue-Tails}) = \frac{1}{3}$$

The thirder's question: "Given that Beauty is having *this particular awakening-experience*, what fraction of such experiences correspond to Heads?" The answer is $1/3$. One out of three equiprobable awakening-states is a Heads-state.

The thirder's calculation is also correct — within the sample space $\Omega_T$.

### The Ambiguity Identified

The halfer and the thirder give different answers because they are answering different questions:

| | Halfer | Thirder |
|---|---|---|
| **Sample space** | Coin outcomes $\Omega_H$ | Awakening-experiences $\Omega_T$ |
| **Unit of analysis** | World-state | Observer-moment |
| **Question** | What is the probability of Heads? | What fraction of my possible experiences are Heads-experiences? |
| **Answer** | $1/2$ | $1/3$ |

Both answers are mathematically correct within their respective probability spaces. The disagreement is not a contradiction — it is an ambiguity in the question "What is your credence that the coin landed Heads?" That question does not specify which probability space Beauty should use to answer it.

### Information Theory Resolves the Ambiguity

Information theory dissolves the apparent disagreement by clarifying what Beauty's awakening tells her under each framing.

Under $\Omega_H$ (the halfer's space), Beauty's observation is "I am awake." The mutual information between this observation and the coin outcome is:

$$I(\text{awake}; \text{coin}) = H(\text{coin}) - H(\text{coin} \mid \text{awake})$$

Since $P(\text{awake} \mid \text{Heads}) = P(\text{awake} \mid \text{Tails}) = 1$, observing "I am awake" provides exactly zero bits of information about the coin. Beauty's posterior equals her prior. The halfer's answer is the correct answer to the question "What does my awakening tell me about the coin?"

Under $\Omega_T$ (the thirder's space), Beauty's observation is not "I am awake" but "I am having an awakening-experience, and I must self-locate among the possible awakening-experiences." This is a different observation — it includes an indexical component ("which awakening am I?") that the halfer's framing omits. The mutual information under $\Omega_T$ between "this is a specific awakening-experience" and "the coin landed Heads" is:

$$I(\text{experience}; \text{Heads}) = \log 3 - \log 2 \approx 0.585 \text{ bits}$$

The thirder's framework treats each awakening as a distinct observation that carries self-locating information. The information content is positive because the awakening-experience is more likely to be a Tails-experience (two chances) than a Heads-experience (one chance).

### Self-Locating Belief

The deeper issue illuminated by the Sleeping Beauty Problem is the question of *self-locating probability* — the probability assigned not to a state of the world but to one's position within a state of the world. Standard probability theory assigns measures to events in $\Omega$. Self-locating probability assigns measures to *centered* events — events indexed by an observer and a time.

The halfer uses an *uncentered* probability space: the coin either landed Heads or Tails, and the probability of each is determined by the coin's physical properties. The thirder uses a *centered* probability space: Beauty is one of $N$ possible observer-moments, and the probability of being any particular observer-moment is determined by both the coin and the awakening protocol.

Both are legitimate probability spaces. The halfer's space answers questions about the world. The thirder's space answers questions about the observer's location within the world. The apparent paradox arises from the fact that the question "What is your credence in Heads?" is ambiguous between an uncentered interpretation (what happened to the coin?) and a centered interpretation (what kind of observer-moment am I?).

This is not philosophical evasion. It is the mathematical recognition that a probability measure requires a sample space, and a sample space requires a specification of what counts as an outcome. "Heads vs. Tails" and "Monday-Heads vs. Monday-Tails vs. Tuesday-Tails" are different outcome specifications. The question must choose one. Once it does, the answer is determined. The paradox dissolves because it rests on an ambiguity in the question, not a contradiction in the mathematics.

### The Key Insight

The Sleeping Beauty Problem is not a paradox about probability. It is an ambiguity about sample spaces. The halfer defines $\Omega$ as coin outcomes and gets $P(\text{Heads}) = 1/2$. The thirder defines $\Omega$ as awakening-experiences and gets $P(\text{Heads}) = 1/3$. Both calculations are correct. They are computing different quantities — world-state probability versus observer-moment frequency — and calling both "credence." Mathematics dissolves the paradox by demanding precision about what is being measured: once you specify the sample space, the answer is uniquely determined.

---

## The Architecture

### The Observation Engine and EphemeralStore

The GSD skill-creator's observation engine faces a Sleeping Beauty-like question every time it processes recurring patterns across multiple sessions. When the same behavioral pattern — say, a particular type of skill invocation failure — appears in three different sessions, the system must decide: is this one pattern observed three times, or three patterns? The answer depends on exactly the same sample-space choice that divides halfers from thirders.

If the observation engine counts by *pattern-identity* (the halfer's world-state space), the answer is one. There is one underlying pattern — a single root cause, a single structural feature of the system — that manifests repeatedly. The probability that this pattern is real (rather than noise) should be assessed based on the pattern itself, not amplified by the number of times it appears. A genuine pattern observed once is just as real as one observed ten times.

If the observation engine counts by *observation-instances* (the thirder's experience space), the answer is three. Each session is a distinct observation context — a different time, different inputs, different surrounding conditions. Three independent observations of the same pattern constitute stronger evidence than one observation, because each instance is an independent sample that could have failed to exhibit the pattern but did not. The evidential weight scales with the count.

The observation engine resolves this ambiguity the same way mathematics resolves the Sleeping Beauty Problem: by tracking both quantities explicitly and using each for its appropriate purpose. The `getSessionCounts()` function maintains two registers:

1. **Distinct pattern keys** — unique identifiers for behavioral patterns, counted once per pattern regardless of how many times it appears. This is the halfer's $\Omega$: the space of world-states (underlying patterns that exist or do not exist).

2. **Observation counts per key per session** — the number of times each pattern was observed in each session. This is the thirder's $\Omega$: the space of observation-experiences (each instance of encountering the pattern in a specific context).

The first register answers the question "how many distinct patterns has the system identified?" The second answers "how much evidence supports each pattern?" Both numbers are correct. They answer different questions. The observation engine does not choose between them — it computes both and routes each to the consumer that needs it. The pattern catalog uses distinct keys. The promotion evaluator uses observation counts. The learning loop uses the ratio between them (observation density per pattern) as a signal of pattern robustness.

The EphemeralStore embodies this dual-register architecture at the storage level. Ephemeral observations — raw sightings of behavioral events — are stored with full session context (timestamp, session ID, invocation context). When the system asks "what did I observe?", it queries the experience space and gets the full count. When the system asks "what patterns exist?", it queries the pattern space and gets the deduplicated set. The two queries return different cardinalities for the same underlying data, just as the halfer and thirder return different credences for the same underlying experiment. Neither query is wrong. They are measurements in different sample spaces.

This is the Sleeping Beauty Problem, dissolved and made operational. The philosophical debate persisted because it demanded a single answer to a question that has two correct answers depending on the sample space. The observation engine sidesteps the debate by maintaining both sample spaces simultaneously and using each where it is appropriate. The pattern count is the halfer's answer. The observation count is the thirder's answer. The system needs both, because different architectural decisions depend on different units of analysis — and the mathematics tells us that both units are valid.

**Component:** GSD Observation Engine / EphemeralStore
**Correspondence:** The observation engine tracks both distinct pattern keys ($\Omega_H$, halfer's world-states) and observation instance counts ($\Omega_T$, thirder's experience-moments). Both registers are correct for different questions. The Sleeping Beauty ambiguity is resolved by maintaining dual sample spaces and routing each to its appropriate consumer.
