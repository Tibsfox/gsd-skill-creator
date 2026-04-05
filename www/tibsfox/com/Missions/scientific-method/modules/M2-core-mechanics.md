# Module 2: Core Mechanics

**Word Count Target:** 10,000–15,000 words
**Model Assignment:** exec-c (Gamma Executor)
**Dependencies:** Module 1 (Foundations and Epistemology)
**College Departments:** General Science, Research Methods, Statistics, Logic

---

## Learning Objectives

By the end of this module, students will be able to:

1. **Trace** the complete operational loop of the scientific method — observation, hypothesis, experiment, analysis, conclusion, and iteration — through three worked examples drawn from distinct scientific disciplines.
2. **Distinguish** between inductive and deductive reasoning, explain the Raven Paradox, and evaluate the logical limits of both modes in scientific practice.
3. **Differentiate** hypothesis, theory, and scientific law, and defend why these distinctions matter for evaluating scientific claims.
4. **Analyze** an experimental design for adequacy of controls, variable identification, and potential confounders.
5. **Evaluate** the meaning and limits of statistical significance, including why p < 0.05 is a convention rather than a law of nature.

---

## Key Terms

The following terms are bolded on first use and defined in context throughout this module. A consolidated reference appears at the end.

**Operational loop** | **Observation** | **Hypothesis** | **Null hypothesis** | **Experiment** | **Control group** | **Independent variable** | **Dependent variable** | **Confounding variable** | **Analysis** | **Conclusion** | **Iteration** | **Induction** | **Deduction** | **Raven Paradox** | **Confirmation bias** | **Falsifiability** | **Theory** | **Scientific law** | **Statistical significance** | **p-value** | **Type I error** | **Type II error** | **Effect size** | **Replication**

---

## 1. Introduction: Science as a Process, Not a Destination

There is a common misconception that science is a collection of facts — a library of settled answers awaiting consultation. That picture misses something fundamental. Science is, above all, a *process*: a repeating cycle of careful observation, disciplined guessing, structured testing, and honest revision. No single fact inhabits this library permanently. Every answer carries within it a forwarding address to the next question.

This module is about the mechanics of that process. We will examine how the cycle operates step by step, why the cycle must loop rather than terminate, and where the most consequential failure modes live. We will trace the cycle through three historical cases that remain among the most instructive in the history of science: Galileo Galilei's inclined plane experiments in the sixteenth and seventeenth centuries, Ibn Sina's systematic approach to clinical medicine in the eleventh century, and Charles Darwin's argument for natural selection in the nineteenth century. Each case illuminates a different dimension of the operational loop and a different set of reasoning strategies.

We will also examine the logical architecture that underlies the cycle — the interplay of **induction** and **deduction** — and work through the **Raven Paradox** as a precise illustration of why inductive confirmation is more fragile than it appears. We will then draw the distinctions between **hypothesis**, **theory**, and **scientific law**, distinctions that are frequently collapsed in casual usage but that carry real epistemic weight. Finally, we will confront the conventions of **statistical significance** and explain why the ubiquitous threshold p < 0.05 is a useful convention rather than a natural boundary between truth and falsehood.

Throughout, we will track a GSD through-line: the operational loop of science maps cleanly onto the wave-execute-retrospective cycle at the heart of the GSD ecosystem. That mapping is not metaphorical. It reflects a deep structural similarity between disciplined knowledge production and disciplined software construction.

---

## 2. The Operational Loop

### 2.1 Overview

The **operational loop** of science is most commonly depicted as a linear sequence — observe, hypothesize, experiment, analyze, conclude — but this representation is misleading in a critical way. The loop does not end at conclusion. Conclusions are inputs to the next cycle of observation. A well-functioning scientific community treats conclusions as provisional: they hold until contradicted, extended, or refined by subsequent work. The arrow at the end of "conclusion" points back to the beginning.

The full sequence, rendered as a loop, is:

```
Observation → Hypothesis → Experiment → Analysis → Conclusion → Iteration → [back to Observation]
```

Each step has a distinct character and a distinct failure mode. We examine each in turn.

### 2.2 Observation

**Observation** is the entry point of the loop: noticing a phenomenon and recording it carefully enough that others could recognize the same phenomenon. Observation sounds passive, but it is not. Productive scientific observation is *theory-laden* — what we notice depends partly on what we already know and what we are prepared to look for [Kuhn, 1962]. This is not a defect; it is how human attention works. The remedy is not pretending to approach nature with a blank mind but being explicit about the prior frameworks that shape what we attend to.

Good observations share several properties: they are *reproducible* (other observers under similar conditions will record the same thing), *quantified* where possible (numbers carry more information than words), and *documented* with sufficient detail that the conditions of observation can be reconstructed.

Observational failure takes many forms. **Confirmation bias** — the tendency to notice evidence that supports existing beliefs and discount evidence that challenges them — is the most pervasive. It operates below conscious awareness and has been documented across a wide range of experimental and real-world contexts [Bacon, 1620; Mill, 1843]. The classical remedy is structured procedures: pre-specified criteria for what counts as an observation, standardized instruments, and recorded raw data that can be audited by others.

### 2.3 Hypothesis

A **hypothesis** is a proposed explanation for an observed phenomenon, stated in a form that could in principle be tested. The key word is *testable*. A hypothesis that cannot be distinguished from its negation by any possible observation or measurement is not a scientific hypothesis; it is a metaphysical claim. Karl Popper formalized this criterion as **falsifiability**: a hypothesis is scientific if and only if it predicts that some possible observation *would not* occur if the hypothesis is true [Popper, 1959].

In practice, hypotheses are often expressed in paired form:

- **Null hypothesis (H₀):** The default assumption — typically that there is no effect, no relationship, or no difference between conditions.
- **Alternative hypothesis (H₁):** The claim the investigator is actually testing — that some specific effect or relationship does exist.

This pairing matters for statistical testing, as we will see in Section 5. The logic of null-hypothesis significance testing is that we try to accumulate evidence *against* H₀; only when H₀ becomes sufficiently implausible do we provisionally accept H₁.

A hypothesis is not a guess in the pejorative sense. A well-formed scientific hypothesis is based on existing knowledge, is internally consistent, and generates specific, non-obvious predictions. The difference between a good hypothesis and a bad one often comes down to the specificity and non-triviality of those predictions.

### 2.4 Experiment

An **experiment** is a structured procedure for testing a hypothesis by manipulating conditions and measuring outcomes. The key distinction between experiment and mere observation is *control*: in an experiment, the investigator holds some conditions constant (the controls) while varying others (the independent variables) and measuring the result (the dependent variables).

A **control group** is a group of subjects or conditions that receive no intervention (or a standard/baseline intervention) and against which the experimental group is compared. Without a control group, there is no baseline; any observed change in the experimental group could reflect the natural course of events, measurement drift, or a host of other factors.

Three categories of variables structure every experiment:

- **Independent variable (IV):** The variable the experimenter manipulates — what is changed between experimental and control conditions.
- **Dependent variable (DV):** The variable the experimenter measures — what is expected to change in response to the IV.
- **Confounding variable:** Any variable that is correlated with both the IV and the DV, potentially producing a spurious association between them.

The art of experimental design is largely the art of identifying and neutralizing confounders. Randomization — randomly assigning subjects to experimental and control conditions — is the most powerful tool available for this purpose because it distributes unmeasured confounders evenly across conditions in expectation.

### 2.5 Analysis

**Analysis** is the process of extracting pattern from data. It encompasses data cleaning and validation (ensuring the data actually measures what it was supposed to measure), descriptive statistics (characterizing the distribution of observations), inferential statistics (drawing conclusions about populations from samples), and visualization (representing patterns in a form that the human visual system can process efficiently).

Analysis has failure modes that are distinct from the failure modes of observation and experimentation. The most consequential is **p-hacking** — the practice, often unconscious, of continuing to collect data, adding new variables, or trying different statistical tests until a significant result is obtained. This practice dramatically inflates the false-positive rate. We return to it in Module 4.

A sound analysis is pre-specified: the statistical tests to be used, the criterion for significance, and the stopping rule for data collection are all decided before data collection begins. Pre-registration — the formal commitment of these decisions in a time-stamped public record before the study is run — has emerged as the most effective structural remedy for analysis-stage distortion [Munafo et al., 2017].

### 2.6 Conclusion

A **conclusion** is the inferential step from results to meaning: what do these data tell us about the hypothesis, and what do they tell us about the broader phenomenon under study? A well-formed conclusion matches the scope of the evidence. A study that tests 200 undergraduate students at a single North American university does not directly support a conclusion about all humans; it supports a conclusion about samples similar to the one studied, with a caveat about generalizability that needs to be addressed in future work.

Conclusions should also be explicit about alternative explanations: plausible accounts of the data that are consistent with H₀ or with a hypothesis other than H₁. The absence of a significant result does not prove H₀; it means only that the study lacked sufficient evidence to reject H₀. These are different claims.

### 2.7 Iteration

**Iteration** is what makes science cumulative. A completed study is a contribution to an ongoing conversation, not a final word. The conclusion of one study identifies new questions, points to uncontrolled variables that should be addressed, and often generates new hypotheses that were not anticipated at the start. This is how science advances: not through individual decisive experiments but through communities of investigators working over time, each study building on the last.

The iteration step is where the loop reconnects to observation. The conclusions of prior studies shape what is attended to in subsequent observations — which brings us back to the theory-laden nature of observation noted in Section 2.2. The loop is genuinely circular, but not viciously so: each pass around the loop incorporates more information and more carefully controlled conditions than the last.

---

## 3. Induction and Deduction

### 3.1 Two Modes of Inference

Scientific reasoning draws on two complementary inferential modes that have different logical structures and different relationships to truth.

**Induction** is inference from specific instances to a general rule. From many observations of copper conducting electricity, the inductivist concludes: *all copper conducts electricity*. Induction is ampliative — the conclusion goes beyond what is strictly contained in the premises. This is what makes it powerful: it allows generalization. But it is also what makes it logically fragile: no finite number of confirming instances can guarantee the truth of a universal generalization.

**Deduction** is inference from general premises to specific conclusions. If all copper conducts electricity, and this object is made of copper, then this object conducts electricity. Deduction is truth-preserving: if the premises are true and the argument is valid, the conclusion is guaranteed. But it is not ampliative: the conclusion is already contained in the premises. Deduction cannot generate new knowledge from old; it can only make explicit what was already implicit.

Science uses both modes. Induction generates hypotheses and theories from accumulated observations. Deduction derives testable predictions from hypotheses and theories. The interplay between them is what gives science both its generative power (induction) and its precision (deduction).

### 3.2 The Problem of Induction

David Hume noted in the eighteenth century that induction cannot be rationally justified by induction — that would be circular — and cannot be justified by deduction — deductive arguments about inductive reliability require inductive premises [Hume, 1739; discussed in Mill, 1843]. The **problem of induction** is the observation that there is no logically secure bridge from "this has always been the case so far" to "this will always be the case."

Popper's proposed resolution was to abandon induction as the foundation of science altogether. On his account, science proceeds by bold conjectures (hypotheses) subjected to rigorous attempts at falsification [Popper, 1959]. A hypothesis survives as long as it has withstood serious attempts to falsify it — it is *corroborated* — but it is never *confirmed* in the inductivist sense. A single genuine counterexample refutes a universal hypothesis; no number of confirmations can establish one with certainty.

In practice, scientists use induction. Popper's prescription is logically cleaner than scientific practice actually is, and philosophers of science have spent considerable effort developing more nuanced accounts [Lakatos, 1970; Kuhn, 1962; Feyerabend, 1975]. The important practical point is that scientists should hold inductive generalizations with appropriate tentativeness, remain alert to the possibility of counterexamples, and not mistake the absence of known exceptions for the impossibility of exceptions.

### 3.3 The Raven Paradox

The **Raven Paradox** was formulated by the philosopher Carl Gustav Hempel in the 1940s and remains a precise illustration of the strangeness at the heart of inductive confirmation [Hempel, 1945; discussed in sep-scimethod].

The paradox proceeds as follows. Consider the hypothesis:

> H: All ravens are black.

This is a universal generalization in the standard form. Observing a black raven seems to confirm H — it is an instance of the predicted class. Standard confirmation theory holds that any observation consistent with H provides some degree of confirmation for H.

Now consider the logically equivalent statement:

> H': All non-black things are non-ravens.

H and H' are logically equivalent: any world in which one is true is a world in which the other is true. By the equivalence condition of confirmation theory, any observation that confirms H also confirms H'.

But an observation that confirms H' is an observation of a non-black non-raven — for example, a green apple. So the green apple confirms "All non-black things are non-ravens," which is equivalent to "All ravens are black."

Conclusion: observing a green apple confirms that all ravens are black.

This seems absurd. The green apple appears to have nothing to do with raven coloration. Yet the argument is logically valid given the premises. The paradox reveals that our intuitive notion of "confirmation" — that an observation confirms a hypothesis when it is an instance of the hypothesis — is either wrong or must be substantially qualified.

Several resolutions have been proposed. The most widely accepted observes that the green apple does provide a tiny, almost vanishingly small degree of confirmation for the raven hypothesis — it rules out one more non-black thing as potentially being a non-raven. Given the vast number of non-black things in the world compared to the number of ravens, the confirmation is negligible but technically nonzero. This resolution preserves the logic while explaining why we intuitively dismiss it: the effect is so small as to be practically meaningless.

The Raven Paradox teaches several lessons with direct scientific relevance:

1. Confirmation is graded, not binary. Evidence provides more or less support for a hypothesis depending on how discriminating it is.
2. Logically equivalent formulations of a hypothesis should, in principle, be confirmed by the same evidence. This has implications for how we frame hypotheses.
3. The relevance of an observation to a hypothesis depends not just on formal logic but on background knowledge about the sizes and distributions of the relevant populations.
4. Inductive reasoning requires careful attention to the relationship between hypothesis structure and evidence structure.

### 3.4 Deductive Structure of Hypothesis Testing

While induction generates hypotheses, the logic of testing them is largely deductive. A hypothesis H, combined with auxiliary assumptions A (about instruments, background conditions, and so on), predicts an observable outcome O:

```
H ∧ A → O
```

If O is observed, we cannot conclude H by deduction (affirming the consequent is a deductive fallacy). But if O is *not* observed (¬O), we can conclude ¬H ∨ ¬A (modus tollens): either the hypothesis is false or one of the auxiliary assumptions is false.

This is the **Duhem-Quine problem**: negative evidence refutes not just the hypothesis but the entire conjunction of hypothesis and auxiliary assumptions. In practice, when an experiment fails to produce the predicted result, scientists face a choice between revising the hypothesis and revising the auxiliaries. How they navigate this choice is partly a matter of logic and partly a matter of sociological and historical factors specific to their field [Kuhn, 1962; Lakatos, 1970].

---

## 4. Hypothesis, Theory, and Law

### 4.1 Common Misunderstandings

Three terms — *hypothesis*, *theory*, and *law* — are frequently confused in public discourse about science. The confusion is consequential: it allows well-established scientific frameworks to be rhetorically demoted ("it's just a theory") and allows poorly supported claims to be presented as more settled than they are.

The confusion stems partly from ordinary language, where "theory" means something like "speculation" and "law" carries connotations of certainty and universality. Scientific usage is different.

### 4.2 Hypothesis

A **hypothesis** is a proposed, testable explanation for a specific observation or set of observations. It is a tentative claim made early in an investigation, before extensive testing has been done. Hypotheses are provisional by definition: the point of the operational loop is to test them. A hypothesis that has been extensively tested and not falsified may eventually be elevated to the status of a theory, but that process takes time and involves many independent investigations.

Hypotheses operate at a relatively fine-grained level. "The increased prevalence of type II diabetes in this population is related to dietary changes over the past two decades" is a hypothesis. It is specific, testable, and concerns a particular phenomenon.

### 4.3 Theory

A **theory** in science is a well-substantiated explanatory framework that has been tested extensively across many contexts, has withstood serious attempts at falsification, is internally consistent, and has demonstrated predictive power beyond the observations that motivated it [Popper, 1959; sep-scimethod]. Theories do not become laws with enough evidence; they occupy a different logical category.

The theory of evolution by natural selection is not a hypothesis awaiting confirmation; it is a framework that has passed more than 160 years of diverse and stringent tests across paleontology, genetics, biogeography, ecology, comparative anatomy, and molecular biology. It has predictive power: it predicts the features of the fossil record, the distribution of molecular homologies, the dynamics of antibiotic resistance, and much else. The same is true of atomic theory, germ theory, the general theory of relativity, and quantum field theory.

To call evolution "just a theory" in the ordinary-language sense is to commit a category error. In scientific usage, "theory" is not below "fact" on a hierarchy of certainty; it is a different kind of thing — an explanatory structure, not a single claim.

Theories are nonetheless falsifiable [Popper, 1959]. The theory of evolution would be falsified, as the biologist J.B.S. Haldane reportedly suggested, by fossil rabbits in the Precambrian. That none have been found — despite massive fossil collection over more than a century — is evidence for the theory. But the possibility of falsification is what gives the theory its scientific status.

### 4.4 Scientific Law

A **scientific law** is a concise descriptive statement of a consistent relationship observed in nature, often expressed mathematically. Newton's second law of motion (F = ma), Ohm's law (V = IR), and the ideal gas law (PV = nRT) are canonical examples.

Laws describe *what* happens; theories explain *why*. Newton's law of universal gravitation describes the mathematical relationship between mass and gravitational force. The general theory of relativity provides an explanatory framework — spacetime curvature — that accounts for why that relationship holds and that reproduces Newton's law as a special case in conditions of low mass and low velocity.

The distinction is important because laws can be exceptions to patterns: Ohm's law holds for linear (ohmic) materials but not for semiconductors or biological membranes. The ideal gas law is an approximation that breaks down at high pressures and low temperatures. Laws encode regularities; they do not guarantee that those regularities hold universally or at all scales.

### 4.5 The Hierarchy in Practice

The practical import of these distinctions is as follows:

| Term | Status | Primary Function |
|------|--------|-----------------|
| Hypothesis | Tentative, early-stage | Generates testable predictions |
| Theory | Well-tested, integrative | Explains and predicts phenomena |
| Law | Descriptive, often mathematical | States reliable regularities |

None of these terms means "certain." Science does not deal in certainties; it deals in degrees of evidential support, calibrated by the rigor and quantity of testing. A hypothesis backed by strong evidence is more credible than a theory backed by weak evidence, even though hypothesis nominally precedes theory in the hierarchy. What matters is the evidence, not the label.

---

## 5. Controls, Variables, and Statistical Significance

### 5.1 The Logic of Control

The logic of controlled experimentation was stated with unusual clarity by Claude Bernard in 1865:

> "Experiments must be comparative. To be sure an experimental condition is the cause of a phenomenon, the philosopher must always seek to prevent the phenomenon from occurring, or he can vary the condition, i.e., apply the experimental method; but above all he must accept the physiologist's comparative method, i.e., always apply, in his experimental reasoning, the logical principle of a single variable." [Bernard, 1865]

Bernard was writing about physiology, but his principle generalizes. The logic is simple: if two groups differ in only one way (the independent variable), then any difference in outcome (the dependent variable) must be due to that one difference. This logic holds exactly only in ideal conditions, which is why real experimental design must also address randomization, blinding, sample size, and potential confounders.

### 5.2 Variables in Depth

**Independent variable (IV):** What the experimenter manipulates. In a drug trial, the IV might be whether patients receive the drug or a placebo. In a physics experiment, it might be the angle of an inclined plane. The IV should be precisely defined and precisely controlled — variation in the IV that is not under the experimenter's control is a source of noise.

**Dependent variable (DV):** What the experimenter measures. The DV should be quantified with instruments whose precision and accuracy are known. In a drug trial, the DV might be blood pressure at six weeks. In a physics experiment, it might be the time for an object to travel a fixed distance.

**Confounding variable:** An unmeasured or uncontrolled variable that is associated with both the IV and the DV. Classic examples include socioeconomic status in medical research (correlated with both treatment access and health outcomes), temperature in chemistry experiments, and time-of-day effects in behavioral research. Identifying potential confounders and either controlling for them (by holding them constant or measuring and adjusting statistically) or neutralizing them (by randomization) is one of the primary skills of experimental design.

**Control group:** The group that receives no intervention or a baseline/standard intervention. The control group defines the baseline against which the experimental effect is measured. Without a control group, there is no way to distinguish the effect of the intervention from the effect of time, regression to the mean, placebo response, or natural variation.

### 5.3 Statistical Significance: The Convention and Its Limits

**Statistical significance** is a formal criterion for deciding when a result is unlikely enough to be due to chance that it warrants attention. The most widely used criterion is that the probability of observing a result at least as extreme as the one obtained, *assuming the null hypothesis is true*, is less than 5% — the famous **p < 0.05** threshold.

This probability is the **p-value**. A p-value of 0.03 means that, if the null hypothesis were true, there would be a 3% chance of observing a result this extreme or more extreme by chance alone. By the conventional threshold, this result is "statistically significant."

#### The p-value is not what most people think it is.

A p-value is *not*:
- The probability that the null hypothesis is true
- The probability that the alternative hypothesis is true
- The probability that the result was obtained by chance
- A measure of the size or practical importance of an effect

A p-value is: a conditional probability of the data given the null hypothesis. It answers the question: "If there were truly no effect, how often would we expect to see a result at least this extreme?" That is a precise and useful question. But it is not the same as the question most people want answered: "Given this result, how likely is it that there is a real effect?"

#### The 5% threshold is a convention, not a law.

Ronald Fisher, who formalized null-hypothesis significance testing in the 1920s, used 0.05 as a convenient round number — roughly two standard deviations from the mean in a normal distribution. He did not intend it as an immutable boundary [Fisher, 1935; discussed in sep-scimethod]. Jerzy Neyman and Egon Pearson, who developed the alternative framework of hypothesis testing with fixed error rates, were explicit that the choice of threshold depends on the relative costs of **Type I** and **Type II errors** in the specific domain of application.

A **Type I error** is a false positive: rejecting the null hypothesis when it is actually true. The conventional p < 0.05 criterion sets the Type I error rate at 5%.

A **Type II error** is a false negative: failing to reject the null hypothesis when it is actually false. The Type II error rate depends on the power of the study, which depends on sample size, effect size, and measurement precision.

The appropriate balance between Type I and Type II errors depends on the domain. In drug safety testing, a false positive (approving an ineffective drug) may be less costly than a false negative (missing an effective treatment), or the reverse, depending on the disease, the available alternatives, and the side-effect profile of the candidate drug. Setting p < 0.05 as a universal standard ignores these domain-specific considerations.

#### Statistical significance does not mean practical significance.

A result can be statistically significant and practically trivial. With a large enough sample, even a tiny effect — one too small to matter in any practical sense — will produce a p-value below 0.05. This is why **effect size** — a measure of the magnitude of the difference or relationship, independent of sample size — is as important as statistical significance in evaluating results. Common effect size measures include Cohen's d (for differences between means), the correlation coefficient r (for relationships between continuous variables), and the odds ratio (for binary outcomes in medical research).

#### Statistical significance and replication.

A p < 0.05 result has a 5% false-positive rate — which means that, across a field where the null hypothesis is true for a large fraction of tested hypotheses, a substantial proportion of published "significant" results may be false positives. The interaction between publication bias (the tendency to publish significant results and not publish null results), p-hacking, and the 5% threshold is a major structural cause of the replication crisis discussed in Module 4. Here it is sufficient to note that a single statistically significant result, obtained in a single study, is not strong evidence of a real effect — it is a preliminary signal that warrants replication and follow-up.

---

## 6. Worked Example 1: Galileo's Inclined Plane (Physics)

### 6.1 Context and Background

In the late sixteenth and early seventeenth centuries, the dominant account of falling bodies was Aristotelian: heavier objects fall faster than lighter ones, and velocity during fall is constant (non-accelerating). Galileo Galilei (1564–1642) was not the first to question these claims, but he was the first to systematically test them with carefully controlled quantitative experiments [wiki-histscimethod; Bernard, 1865].

Galileo faced a practical problem: objects in free fall near the surface of the Earth move too fast to measure accurately with the instruments available in his time. His solution was elegant: use an inclined plane to slow the motion down. A ball rolling down an inclined plane undergoes the same physics as a falling body — gravity is the driving force in both cases — but the effective gravitational acceleration is reduced by the sine of the angle of incline. By making the angle small, Galileo could slow the motion enough to measure.

### 6.2 Observation

The original observation was the Aristotelian prediction itself: Galileo observed that the prevailing account — heavier objects fall faster — was difficult to test directly and had never been subjected to systematic quantitative scrutiny. He also noted qualitative evidence against the Aristotelian view: watching objects of different masses dropped from the Leaning Tower of Pisa (an experiment attributed to Galileo but likely apocryphal as a single decisive test) suggested that the difference was smaller than the theory predicted.

More importantly, Galileo observed that the Aristotelian account did not specify whether velocity was constant or changing during fall — a question the theory simply did not address precisely.

### 6.3 Hypothesis

Galileo's hypothesis was: *the motion of a falling body is uniformly accelerated — the velocity increases linearly with time, and the distance covered increases as the square of the time elapsed.*

In modern notation, this is the kinematic equation for constant acceleration: s = ½at², where s is distance, a is acceleration, and t is time.

This was a bold and specific prediction. It was not derived from Aristotelian theory; it was a new conjecture based on reasoning about the nature of uniform change.

### 6.4 Experiment

Galileo constructed a groove in a long plank of wood, lined it with parchment to reduce friction, and rolled a bronze ball down the groove. He measured the distance traveled in successive equal time intervals, using a water clock — water flowing into a vessel from a tap, with the amount of water serving as a proxy for elapsed time.

The **independent variable** was time (successive equal intervals). The **dependent variable** was distance traveled. Galileo controlled for the angle of the incline (held constant within each experimental run), the surface smoothness (the parchment lining), and the starting position of the ball.

He repeated the experiment "a full hundred times" (his words) at multiple angles of incline, finding consistent results each time.

### 6.5 Analysis

Galileo's analysis was geometric and proto-algebraic rather than statistical in the modern sense, but it was rigorous. He computed the ratios of distances covered in successive time intervals and found them to be in the ratio 1 : 3 : 5 : 7 : ... — the sequence of odd numbers. This is precisely what the uniformly accelerated motion hypothesis predicts: in equal time intervals, the additional distances covered are proportional to successive odd numbers.

He varied the angle and found that the relationship held across all angles, with the magnitude of acceleration scaling with the sine of the angle.

### 6.6 Conclusion

Galileo's conclusion was that free fall near the Earth's surface is uniformly accelerated, with acceleration independent of mass. This directly contradicted the Aristotelian account. The quantitative regularity he found — distance proportional to time squared — became the foundation for Newton's mechanics a generation later.

### 6.7 Iteration

Galileo's work was not accepted immediately. It required the corroboration of subsequent investigators, the development of more precise measuring instruments, and eventually the theoretical synthesis provided by Newton's laws of motion. The iteration from Galileo's experiments to Newton's mechanics to Einstein's general relativity is a textbook example of how the operational loop accumulates into a theoretical edifice over time.

### 6.8 Operational Loop Mapping

| Loop Step | Galileo |
|-----------|---------|
| Observation | Objects in free fall; Aristotelian account untested |
| Hypothesis | Uniform acceleration; s = ½at² |
| Experiment | Inclined plane; controlled angle, surface, starting position |
| Analysis | Ratios of successive distances; odd-number series |
| Conclusion | Uniform acceleration, mass-independent |
| Iteration | Corroboration, Newton's synthesis, extension to celestial mechanics |

---

## 7. Worked Example 2: Ibn Sina and Clinical Trials (Medicine)

### 7.1 Context and Background

Abu Ali al-Husayn ibn Sina (980–1037 CE), known in Europe as Avicenna, was a physician, philosopher, and polymath from Bukhara (in present-day Uzbekistan) who is among the most influential figures in the history of medicine [wiki-histscimethod; pmc-2021]. His *Canon of Medicine* (Al-Qanun fi al-Tibb), composed around 1025 CE, remained a standard medical textbook in both the Islamic world and Europe for more than six centuries.

What is less widely known is that the *Canon* contains an explicit methodology for testing the efficacy of drugs that anticipates several key features of modern clinical trial design. Ibn Sina was working within the tradition of Galenic medicine, but he subjected that tradition to systematic critical examination and developed procedures for moving beyond anecdote to tested knowledge.

### 7.2 Observation

Ibn Sina's starting observation was methodological: existing medical knowledge about drug efficacy was largely based on anecdote, authority, and theoretical reasoning from Galenic humoral theory. The accumulated stock of knowledge was large but poorly tested. How could one distinguish effective treatments from ineffective ones given this background noise?

### 7.3 Hypothesis

Ibn Sina's implicit hypothesis was epistemological: *systematic controlled testing of drugs in human patients, with attention to dose, timing, condition of the patient, and replication, will produce more reliable knowledge of efficacy than anecdote or theoretical reasoning alone.*

This is a methodological hypothesis rather than a clinical one — a hypothesis about how to produce knowledge rather than about a specific mechanism.

### 7.4 Experimental Criteria

In the *Canon*, Ibn Sina laid out seven conditions for establishing that a drug is effective. In modern paraphrase, these include:

1. The drug must be pure — not mixed with other substances that could produce the observed effect.
2. The drug should be tested on a simple (single-cause) disease rather than a complex one.
3. The drug should be tested on two contrasting types of disease, so that its effects can be attributed to the drug and not to a property of one type of disease.
4. The drug's quality should match the disease — the timing and degree of action must correspond.
5. The timing of the drug's action must be observed — what happens when, and in what sequence.
6. The effect must be consistent and stable — seen repeatedly, not just once.
7. Testing should be done in humans, not only animals, because animal and human physiology may differ.

Several of these criteria map directly onto modern clinical trial design: the requirement for a "pure" drug corresponds to controlling the independent variable; the requirement for testing in contrasting diseases corresponds to between-groups comparison; the requirement for consistency and stability corresponds to replication; and the preference for human testing corresponds to the ecological validity criterion.

### 7.5 Analysis and Conclusion

Ibn Sina's analytical approach was qualitative: assess whether the drug produced the predicted effect consistently, in the right cases, and with the right timing. This is not statistical significance testing, but it is a structured comparison against a baseline that excludes several alternative explanations.

His conclusion was methodological: knowledge of drug efficacy requires systematic observation under controlled conditions, not just theoretical argument. The *Canon* organized medical knowledge by this standard, grading therapies by the quality of the evidence supporting them.

### 7.6 Iteration

Ibn Sina's framework was not immediately institutionalized as a research methodology — the conditions for institutionalized clinical research did not emerge until the twentieth century. But his criteria circulated within Islamic and European medical scholarship for centuries and contributed to the gradual shift from purely theoretical medicine to empirical medicine that culminated in the controlled clinical trial as a formal institution in the twentieth century. The first fully randomized controlled trial in modern form — the Medical Research Council trial of streptomycin for tuberculosis — was conducted in 1948, nearly a thousand years after Ibn Sina's formulation of the underlying principles.

### 7.7 Operational Loop Mapping

| Loop Step | Ibn Sina |
|-----------|---------|
| Observation | Medical knowledge based on anecdote and theory; unreliable |
| Hypothesis | Systematic controlled testing produces better knowledge |
| Experiment | Seven-condition testing framework for drug efficacy |
| Analysis | Qualitative consistency check; contrast conditions |
| Conclusion | Systematic testing required; criteria for reliable knowledge |
| Iteration | Medieval medical scholarship; eventually modern RCT |

---

## 8. Worked Example 3: Darwin's Natural Selection (Biology)

### 8.1 Context and Background

Charles Darwin (1809–1882) developed the theory of evolution by natural selection over a period of approximately two decades, from his voyage on HMS Beagle (1831–1836) through the publication of *On the Origin of Species* in 1859 and beyond. Darwin's approach is a masterclass in the operational loop at a large scale — sustained, systematic observation over years, followed by hypothesizing, further testing, and the gradual construction of an integrative theory.

The dominant view before Darwin was that species were fixed — created in their present forms and not significantly modified over time. There was geological and fossil evidence for extinction and for the existence of past species different from any living ones, but the mechanism of change was unclear. Jean-Baptiste Lamarck had proposed a mechanism (inheritance of acquired characteristics) that was eventually rejected, but his work established that transformation of species over time was a legitimate scientific question.

### 8.2 Observation

Darwin's observations during the Beagle voyage were extensive and carefully documented. Several were particularly consequential:

1. **Galápagos finches:** Different islands in the Galápagos archipelago harbored distinct but closely related species of finches, with beaks adapted to the food sources available on each island. This pattern was difficult to explain if species were fixed and had been created separately for each island.

2. **Fossil record:** South American fossils included extinct species that were similar to, but distinct from, living South American species. This suggested that species were related by descent.

3. **Geographic distribution:** The pattern of species distribution across the planet did not correspond to the pattern one would expect if species were optimally designed for their environments. Species were clustered by geography in ways that suggested common descent.

4. **Selective breeding:** Domestic animals and plants had been dramatically modified by human selection over centuries. The range of variation achievable by artificial selection demonstrated that heritable variation was abundant and that selection could drive substantial change.

### 8.3 Hypothesis

Darwin's hypothesis was: *species change over time through a process of natural selection acting on heritable variation. Individuals with heritable traits that improve survival and reproduction leave more offspring than individuals without those traits; over many generations, the frequency of advantageous traits increases in the population.*

This hypothesis had several components:
- Heritable variation exists within populations.
- Some variants are better suited to their environment than others (differential fitness).
- Better-suited variants survive and reproduce at higher rates.
- Over generations, the composition of the population shifts toward the better-suited variants.
- Given enough time and the right conditions, this process can produce new species from a common ancestor.

### 8.4 Experiment and Evidence

Darwin could not perform controlled experiments in the laboratory on species formation — the timescales involved are far too long for direct experimental observation. His evidence was instead a synthesis of multiple independent lines of evidence, each of which predicted the same conclusion:

- **Comparative anatomy:** Related species share structural features (homologies) that make sense as modifications of a common ancestral structure — for example, the forelimbs of humans, bats, whales, and horses.
- **Embryology:** Closely related species with very different adult forms have similar embryos, suggesting a common developmental program modified by selection.
- **Biogeography:** The distribution of species across continents and islands follows the pattern expected if species dispersed from common ancestors and diversified in isolation.
- **Artificial selection:** The speed of change achievable by human breeders demonstrated that selection acting on heritable variation could produce dramatic modification within observable timescales.

Darwin's experimental design was unusual by the standards of laboratory science: he was performing a kind of inference to the best explanation across multiple independent lines of evidence rather than testing a single hypothesis with a controlled experiment. This is a legitimate and powerful evidential strategy when direct experimentation is impossible, but it requires that the hypothesis explain all lines of evidence simultaneously, that alternative explanations be considered and rejected, and that the hypothesis make novel predictions that are subsequently confirmed.

### 8.5 Analysis

Darwin's analysis was qualitative and inferential: he assessed whether the theory of natural selection was consistent with each line of evidence, whether alternative theories were equally consistent, and whether the theory generated novel, testable predictions.

The quantitative analysis of natural selection came later, through the work of Ronald Fisher, J.B.S. Haldane, and Sewall Wright in the early twentieth century — the "Modern Synthesis" that integrated Darwinian selection with Mendelian genetics. The population genetics equations they developed allowed precise quantitative predictions about the rate and direction of evolutionary change under specified conditions.

### 8.6 Conclusion

Darwin's conclusion — that all species on Earth are related by descent with modification through natural selection — was both the most powerful and the most controversial scientific claim of the nineteenth century. It was controversial because it displaced humans from a special position in the biological world, not because the evidence was weak. The evidence was, and remains, among the most comprehensive and multi-sourced in the history of science.

### 8.7 Iteration

Since 1859, the theory of evolution has been extended, refined, and augmented — but not overturned. The discovery of the molecular mechanism of heredity (DNA), the development of population genetics, the fossil evidence accumulated over 160+ years, the phylogenetic analyses enabled by genomic sequencing, and the direct observation of evolution in real time (in bacteria, viruses, and fast-breeding animals) have all corroborated and extended the core theory. The iteration from Darwin's original formulation to the modern extended evolutionary synthesis is an example of how a well-supported theory accumulates corroboration without losing its essential explanatory core.

### 8.8 Operational Loop Mapping

| Loop Step | Darwin |
|-----------|-------|
| Observation | Galápagos finches; fossil record; biogeography; selective breeding |
| Hypothesis | Natural selection acting on heritable variation produces species |
| Experiment | Synthesis of multiple independent lines of evidence |
| Analysis | Inference to best explanation; consistency across evidence types |
| Conclusion | Common descent with modification through natural selection |
| Iteration | Modern Synthesis; molecular biology; genomic phylogenetics |

---

## 9. Synthesis: The Loop as a Living System

### 9.1 Why the Loop Never Terminates

Each of the three worked examples illustrates the same structural point: the operational loop does not terminate with a "final answer." Galileo's result needed Newton. Darwin's qualitative synthesis needed population genetics. Ibn Sina's criteria needed the randomized controlled trial as institutional infrastructure.

The loop is self-extending because science is a conversation between investigators across time. Each study changes the landscape of what is known and therefore changes the landscape of what is worth asking next. Conclusions become observations for the next cycle. The cumulative structure of science — its ability to build progressively more precise and more general explanations — depends on the loop not terminating.

### 9.2 The Role of Community

The individual scientist in these narratives is important, but the community is more important. Science is not primarily a solo activity; it is a social practice. The operational loop operates not just within individual investigations but across communities of investigators. A hypothesis is confirmed not by a single study but by a pattern of studies across independent investigators, labs, and contexts. A theory is established not by a single confirming experiment but by a network of interlocking studies that all point in the same direction.

This communal character of science is both its strength and its vulnerability. Its strength is that systematic errors in individual studies tend to be cancelled out when many independent groups are doing similar work. Its vulnerability is that systematic errors shared across a community — shared methodological assumptions, shared publication biases, shared incentive structures — can distort the collective record in ways that no individual study can correct. This vulnerability is the subject of Module 4.

### 9.3 The Induction-Deduction Interplay in Practice

Real scientific practice does not neatly alternate between inductive and deductive phases. Observations, hypotheses, experimental designs, analytical choices, and interpretations are all interleaved with both inductive generalizations and deductive derivations. A working scientist simultaneously:

- Uses induction to generate candidate hypotheses from observed patterns.
- Uses deduction to derive specific predictions from those hypotheses.
- Uses induction to infer likely confounders from prior knowledge.
- Uses deduction to plan the experimental design needed to rule out specific alternative explanations.
- Uses induction to interpret anomalous results as invitations to revise auxiliary assumptions rather than the core hypothesis.

The picture of science as a clean alternation between inductive and deductive phases is a pedagogical simplification. The reality is that skilled scientific reasoning involves continuous switching between the two modes, with background knowledge and disciplinary norms guiding the switching.

---

## 10. Statistical Significance: Deeper Issues

### 10.1 The Base Rate Problem

One underappreciated limit of the p < 0.05 convention is that its meaning depends heavily on the **prior probability** that the hypothesis being tested is true. Consider a research program in which most tested hypotheses are false — perhaps because the area is poorly understood and researchers are exploring many speculative hypotheses. In this regime, even if only 5% of truly null results produce significant findings by chance, the proportion of published significant findings that are false positives can be very high.

Statistician John Ioannidis formalized this reasoning in a widely cited paper in 2005, arguing that most published research findings are false under plausible assumptions about base rates and study power. The argument is not that p-values are meaningless but that a p-value cannot be interpreted without knowledge of the prior probability of the hypothesis — and that in many research areas, the prior is low, making false positives common even at conventional significance thresholds.

The practical implication is that **replication** is not optional. A single statistically significant study is evidence, but it is not strong evidence when the prior probability of the hypothesis is low. The evidentiary weight of a finding increases substantially when it has been independently replicated under varied conditions.

### 10.2 Power and Sample Size

**Statistical power** is the probability that a study will detect a true effect of a given size, given the study design. Power depends on three factors: the sample size, the effect size, and the significance threshold. A study with low power has a high **Type II error** rate — it will often fail to detect real effects.

In many research fields, typical studies are underpowered — they are designed to detect only large effects, while the actual effects of interest are often small. An underpowered study that fails to find an effect cannot be taken as strong evidence that no effect exists; it may simply not have been able to see the effect even if it were there.

The consequence of systematic underpowering is that when a small study does find a significant result, it is more likely to be a false positive than a result from a well-powered study. This is because small studies that find significant results have often done so by chance — the sample happened, by luck, to exhibit a large apparent effect. This phenomenon, sometimes called the "winner's curse" or "winner's bias," inflates the apparent size of effects in small, positive studies.

### 10.3 The 5% Threshold in Context

The p < 0.05 threshold is embedded in the statistical culture of most sciences through a combination of historical accident, regulatory convention (the U.S. Food and Drug Administration has used 0.05 as a standard threshold for drug approval), and editorial practice (many journals treat p < 0.05 as a necessary condition for publication of results claiming a positive effect).

The threshold is not wrong for the uses it was designed for. It provides a common, legible standard that allows comparison across studies. But treating it as a bright line between "real" and "not real" — which it was never intended to be — distorts scientific practice in several ways:

- It encourages **p-hacking**: adjusting analyses until p < 0.05 is achieved.
- It encourages **selective reporting**: reporting only the analyses that produced p < 0.05.
- It discourages the publication of well-designed studies with p > 0.05 (the file-drawer problem).
- It creates a false sense of certainty around results that just barely clear the threshold.

The American Statistical Association published a statement in 2016 explicitly cautioning against treating p < 0.05 as a definitive criterion for scientific truth, and a follow-up statement in 2019 recommending against using "statistically significant" as a dichotomous descriptor at all. The discussion about better statistical practice — including greater emphasis on effect sizes, confidence intervals, Bayesian methods, and pre-registration — is ongoing and consequential.

---

## 11. GSD Ecosystem Connection

### 11.1 The Operational Loop as Wave-Execute-Retrospective

The GSD ecosystem is built around a recurring cycle: waves are planned, executed, and reviewed in retrospectives that feed back into the next planning round. This structure is the operational loop of science translated into software production.

The mapping is precise:

| Scientific Loop | GSD Cycle |
|----------------|-----------|
| Observation | Context gathering at session start; state files; logs |
| Hypothesis | Wave plan: what do we expect to produce and how? |
| Experiment | Wave execution: run the planned work |
| Analysis | Test output, CAPCOM gate review, verification runs |
| Conclusion | Retrospective: what actually happened vs. what was planned? |
| Iteration | Next wave plan, informed by retrospective findings |

### 11.2 Controls and Variables in Development

Controlled experimentation has direct analogies in software development:

- **Independent variable:** The change being made — a single, isolated modification to a module or configuration.
- **Dependent variable:** The test results, performance metrics, or user-visible behavior being measured.
- **Confounding variable:** Environmental differences between test runs, unrelated recent commits that affect behavior, or shared state between tests.
- **Control group:** The baseline: the system state before the change, or a parallel branch that receives no modification.

The discipline of controlled commits — one logical change per commit, with tests before and after — is the software equivalent of controlled experimentation. It makes attribution of effect to cause tractable. A commit that changes ten unrelated things at once is the equivalent of an experiment with ten simultaneous interventions: the results are uninterpretable.

### 11.3 Statistical Significance and CAPCOM Gates

The GSD CAPCOM gate serves a similar function to the significance threshold in statistical testing: it is a structured checkpoint that requires evidence of a certain quality before work can advance from one phase to the next. The gate prevents premature conclusions — declaring a module complete when tests are passing but coverage is inadequate, or when integration behavior has not been verified.

The parallel to statistical significance is not perfect — software verification is not probabilistic in the same way that statistical inference is — but the structural function is the same: a standardized checkpoint that prevents the confirmation bias of the developer (who wants the feature to work) from substituting for actual evidence that it does.

### 11.4 Induction in GSD: Pattern Learning from Retrospectives

The retrospective cycle in GSD is explicitly inductive. Each retrospective draws on the specific evidence of the most recent wave to update general principles about what works and what does not. Over time, accumulated retrospectives constitute an inductive knowledge base: patterns that have been observed consistently across many waves, in many contexts, are promoted from tentative observations to standing norms.

This is precisely the structure of inductive reasoning: from specific instances to general rules, with the rules remaining revisable as new instances accumulate. The GSD patterns file, the standing rules in CLAUDE.md, and the skill library are all inductive generalizations from accumulated specific experiences — with the important qualification that they are explicitly provisional and should be revised when new evidence warrants.

---

## 12. Cross-Module Connections

- [Module 1: Foundations and Epistemology] — establishes the philosophical framework within which the operational loop operates; introduces falsifiability, the problem of induction, and the sociology of scientific knowledge. The current module operationalizes those foundations.
- [Module 3: History and Social Dimensions] — traces how the operational loop has functioned in specific historical and social contexts; examines how community structure, reward systems, and power dynamics have shaped scientific practice.
- [Module 4: Integrity and Reproducibility] — examines what happens when the operational loop is distorted by incentive structures, publication bias, and methodological failures; the current module's treatment of statistical significance and p-hacking connects directly to Module 4's treatment of the replication crisis.
- [Module 5: Contemporary and Future Directions] — examines how AI tools are reshaping hypothesis generation and experimental design; the operational loop structure described here provides the baseline against which AI augmentation should be evaluated.

---

## 13. College Department Mappings

| Section | Department |
|---------|-----------|
| 2–3. Operational loop and reasoning modes | General Science, Logic |
| 4. Hypothesis, theory, law | General Science, Research Methods |
| 5. Controls, variables, statistical significance | Statistics, Research Methods |
| 6. Galileo's inclined plane | General Science, Physics |
| 7. Ibn Sina's clinical methodology | Research Methods, History of Science |
| 8. Darwin's natural selection | General Science, Biology |
| 9. Synthesis and community | Research Methods, Sociology of Science |
| 10. Statistical significance deeper issues | Statistics |
| 11. GSD ecosystem connection | Applied Research Methods |

---

## 14. Key Terms Reference

**Operational loop:** The recurring cycle of observation, hypothesis, experiment, analysis, conclusion, and iteration that defines scientific practice.

**Observation:** Careful, reproducible noticing of a phenomenon, shaped by theoretical background knowledge.

**Hypothesis:** A testable, falsifiable proposed explanation for a specific observation or set of observations.

**Null hypothesis (H₀):** The default assumption of no effect, used as the baseline for statistical testing.

**Experiment:** A structured procedure for testing a hypothesis by manipulating conditions and measuring outcomes.

**Control group:** A group receiving no intervention or a baseline intervention, against which the experimental group is compared.

**Independent variable (IV):** The variable manipulated by the experimenter.

**Dependent variable (DV):** The variable measured by the experimenter.

**Confounding variable:** An unmeasured or uncontrolled variable associated with both the IV and the DV.

**Analysis:** The process of extracting pattern and meaning from data.

**Conclusion:** The inferential step from results to meaning, matching the scope of the evidence.

**Iteration:** The return of conclusions to the next cycle of observation, making science cumulative.

**Induction:** Inference from specific instances to a general rule; ampliative but not logically guaranteed.

**Deduction:** Inference from general premises to specific conclusions; truth-preserving but not ampliative.

**Raven Paradox:** The logical demonstration that a green apple confirms "all ravens are black," revealing that inductive confirmation is graded and depends on background knowledge.

**Confirmation bias:** The tendency to notice confirming evidence and discount disconfirming evidence.

**Falsifiability:** The criterion (Popper) that a scientific hypothesis must be capable of being refuted by some possible observation.

**Theory:** A well-tested, integrative explanatory framework with demonstrated predictive power.

**Scientific law:** A concise descriptive statement of a consistent relationship in nature, often mathematical.

**Statistical significance:** A formal criterion based on the probability of observing a result at least as extreme as the one obtained, assuming the null hypothesis is true.

**p-value:** The probability of the observed data (or more extreme) under the null hypothesis.

**Type I error:** Rejecting the null hypothesis when it is true (false positive).

**Type II error:** Failing to reject the null hypothesis when it is false (false negative).

**Effect size:** A measure of the magnitude of an effect, independent of sample size.

**Replication:** Independent repetition of a study to verify its findings.

---

## 15. Assessment Questions

1. Galileo faced a practical barrier to testing free fall directly and used an inclined plane as a workaround. Identify the independent variable, dependent variable, and at least two potential confounders in his inclined plane experiment, and explain how he controlled for them.

2. The Raven Paradox demonstrates that observing a green apple technically confirms "all ravens are black." Explain the logical steps of the paradox and describe at least one resolution. What does the paradox reveal about the relationship between evidence and hypothesis structure?

3. A pharmaceutical company reports that a new pain medication reduced average pain scores by 0.3 points on a 100-point scale (p = 0.003, n = 4,000). Evaluate whether this result is scientifically meaningful. What additional information would you need to assess the practical significance of the finding?

4. Compare the evidential strategies used by Darwin and Galileo. Darwin could not perform controlled laboratory experiments on species formation; Galileo could. How did Darwin compensate? What are the strengths and limits of each strategy?

5. Map the three stages of the GSD wave-execute-retrospective cycle to the corresponding stages of the scientific operational loop, and identify one failure mode in the GSD cycle that has a direct parallel to a known failure mode in scientific practice.

---

## 16. Sources

Bacon, F. (1620). *Novum Organum*. London.

Baker, M. (2016). 1,500 scientists lift the lid on reproducibility. *Nature*, 533, 452–454. [n = 1,576 researchers]

Bernard, C. (1865). *An Introduction to the Study of Experimental Medicine*. Paris.

Darwin, C. (1859). *On the Origin of Species by Means of Natural Selection*. John Murray, London.

Fisher, R.A. (1935). *The Design of Experiments*. Oliver and Boyd, Edinburgh.

Galilei, G. (1638). *Discourses and Mathematical Demonstrations Relating to Two New Sciences*. Elzevir, Leiden.

Hempel, C.G. (1945). Studies in the Logic of Confirmation. *Mind*, 54(213), 1–26.

Hume, D. (1739). *A Treatise of Human Nature*. London.

Ibn Sina. (~1025 CE). *Al-Qanun fi al-Tibb (The Canon of Medicine)*. Translated and discussed in Gruner, O.C. (1930). *A Treatise on the Canon of Medicine of Avicenna*. London.

Ioannidis, J.P.A. (2005). Why most published research findings are false. *PLOS Medicine*, 2(8), e124.

Kuhn, T.S. (1962). *The Structure of Scientific Revolutions*. University of Chicago Press.

Lakatos, I. (1970). Falsification and the methodology of scientific research programmes. In *Criticism and the Growth of Knowledge*. Cambridge University Press.

Mill, J.S. (1843). *A System of Logic*. London.

Munafo, M.R., et al. (2017). A manifesto for reproducible science. *Nature Human Behaviour*, 1(1), 0021.

Open Science Collaboration (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251). [n = 100 studies]

Popper, K.R. (1959). *The Logic of Scientific Discovery*. Hutchinson, London.

Stanford Encyclopedia of Philosophy: Scientific Method. plato.stanford.edu/entries/scientific-method/

Wikipedia: History of Scientific Method. en.wikipedia.org/wiki/History_of_scientific_method
