# The Epistemology of Research

*What is truth, and how do we find it? -- from Plato to Bayesian inference*

---

This is the foundational document in the research methodology series. Before we can discuss how to gather data, how to structure experiments, how to validate claims, or how to build systems that process knowledge -- we must confront the question that underlies all of it: **what does it mean to know something?**

The answer is not obvious. It has never been obvious. Twenty-four centuries of Western philosophy have produced at least a dozen mutually incompatible answers, and the Eastern traditions have produced several more. What follows is a tour through the most influential positions, not as a history lesson for its own sake, but because every one of these positions is alive in the assumptions we make when we build software that processes, stores, and retrieves research.

When you write a triple store that captures the relationship "X causes Y," you are making an epistemological commitment. When you store a claim with a confidence score, you are implicitly adopting a Bayesian framework. When you flag a paper as "disproven," you are channeling Popper whether you know it or not. Understanding these frameworks is not optional for builders of knowledge systems. It is the foundation.

---

## 1. The Ancient Roots: Episteme, Doxa, and the Problem of Appearances

### Plato and the Divided Line

The Western epistemological tradition begins with a distinction that Plato drew in the *Republic* (c. 375 BCE): the difference between **episteme** (knowledge) and **doxa** (opinion, or mere belief). For Plato, the physical world of sensory experience was fundamentally unreliable -- shadows on the wall of a cave, to use his most famous metaphor. True knowledge was not derived from observation of particular things but from rational contemplation of the **Forms** -- abstract, eternal, perfect archetypes of which physical objects are imperfect copies.

The **Allegory of the Cave** (Republic VII, 514a-520a) is not merely a teaching aid. It is a complete epistemological program. The prisoners chained to the wall, watching shadows cast by a fire, believe the shadows are reality. The philosopher who breaks free, ascends to the sunlight, and sees the real objects is initially blinded -- the truth is painful, disorienting, and the other prisoners will resist it. This is Plato's model of intellectual progress: you do not accumulate observations until truth emerges; you undergo a radical reorientation of your entire understanding.

For Plato, a geometer who draws a triangle in the sand is not studying *that* triangle. She is using it as a prompt to reason about the Form of Triangle -- the perfect, abstract, triangular thing that exists nowhere in the physical world but that makes all physical triangles intelligible. The drawn triangle has thick lines and imperfect angles. The Form has none of these defects. True knowledge -- episteme -- is knowledge of the Forms.

This matters more than you might think for computational epistemology. Every time we abstract away from particular instances to a schema, a type, a category, we are doing something that Plato would recognize. When a type system enforces that all `User` objects have an `email` field, it is asserting a Form -- an abstract archetype that constrains what a particular user can be.

### Aristotle and the Empirical Turn

Aristotle was Plato's student, and he disagreed profoundly. Where Plato distrusted the senses and sought truth in abstract Forms, Aristotle began with observation. His method was to collect particular instances, classify them, and derive general principles through **induction** (epagoge). The *Organon* -- his collected logical works -- laid out the formal structure of **syllogistic reasoning**: if all men are mortal, and Socrates is a man, then Socrates is mortal. But the premises themselves came from observation and experience, not from mystical contemplation of Forms.

Aristotle's four causes (material, formal, efficient, and final) represented an attempt to give a complete account of *why* something is the way it is. A bronze statue is bronze (material cause), shaped like a horse (formal cause), made by a sculptor (efficient cause), and intended to honor a general (final cause). This four-fold explanatory framework dominated Western science for nearly two millennia, and its ghost still haunts our intuitions about explanation. When a developer asks "why does this function exist?" they might be asking about its implementation (material/formal), its author (efficient), or its purpose (final) -- and the answer depends on which cause you address.

The critical point for our purposes: Aristotle was the first systematic empiricist in the Western tradition, but he was also the first to identify the **problem of induction** in embryonic form. How many swans must you observe before you can say "all swans are white"? Aristotle did not solve this problem. Nobody has. It would take Hume, two thousand years later, to make the problem inescapable.

---

## 2. The Rationalist Tradition: Descartes and the Architecture of Certainty

### Methodological Doubt

Rene Descartes (1596-1650) arrived at philosophy during a period of intellectual crisis. The Aristotelian synthesis that had governed European thought for centuries was crumbling under the weight of Copernicus, Galileo, and the new astronomy. If the received authorities could be wrong about the structure of the cosmos, what else might they be wrong about? Descartes' response was radical: doubt everything. Systematically. Ruthlessly. Not as a permanent skepticism, but as a method for finding something -- anything -- that could not be doubted.

In the *Meditations on First Philosophy* (1641), Descartes conducted a thought experiment. He imagined an evil demon (genius malignus) of unlimited power and cunning, dedicated to deceiving him about everything. Could such a demon make him believe that 2 + 3 = 5 when it actually equals something else? Could the demon make him believe the physical world exists when it does not? Descartes argued yes -- everything perceived through the senses, everything learned from authority, everything calculated through mathematics could, in principle, be the product of systematic deception.

Everything except one thing: **"Cogito, ergo sum"** -- I think, therefore I am. Even if the demon is deceiving me about everything, the very act of being deceived requires that I exist as a thinking thing. Doubt itself proves the doubter.

From this single indubitable foundation, Descartes attempted to rebuild all of knowledge through **deductive reasoning** -- chains of logic that, if the premises are certain and the steps are valid, produce conclusions that are equally certain. Mathematics was his model. A geometric proof does not depend on observation. It depends on axioms and rules of inference. If you accept the axioms, the theorems follow necessarily.

### The Rationalist Legacy

Descartes, Spinoza, and Leibniz -- the great Continental rationalists -- shared a conviction that the senses are unreliable and that true knowledge comes from reason alone. Their model of knowledge was **mathematics**: a system of truths derived by deduction from self-evident axioms, requiring no empirical input whatsoever.

This tradition is alive every time a software engineer writes a formal proof of correctness, every time a type system catches an error at compile time rather than at runtime, every time someone argues that a mathematical proof is more reliable than a million test cases. The rationalist intuition -- that deduction from clear premises is the gold standard of knowledge -- is deep in the bones of computer science. Dijkstra's famous remark that "testing shows the presence, not the absence, of bugs" is pure rationalism. He wanted proofs, not experiments.

---

## 3. The Empiricist Tradition: Locke, Berkeley, and Hume

### The Tabula Rasa

John Locke (1632-1704) attacked the rationalist program at its root. In *An Essay Concerning Human Understanding* (1689), Locke argued that there are no **innate ideas** -- no knowledge that the mind possesses prior to experience. The mind at birth is a **tabula rasa**, a blank slate, and all knowledge comes from two sources: **sensation** (external experience) and **reflection** (the mind's awareness of its own operations).

This seems straightforward, even obvious, to modern sensibilities. But its implications are revolutionary. If all knowledge comes from experience, then there is no privileged access to eternal truths. There are no Platonic Forms to contemplate. There are no Cartesian clear and distinct ideas that arrive fully formed in the mind. There is only what you have observed, what you have experienced, and what you have reasoned from those observations.

### Hume's Guillotine

David Hume (1711-1776) took empiricism to its logical conclusion, and the result was devastating. In *A Treatise of Human Nature* (1739) and *An Enquiry Concerning Human Understanding* (1748), Hume identified a problem so fundamental that it has never been fully resolved: the **problem of induction**.

The argument is simple and lethal. You have observed the sun rising every morning of your life. Your parents observed it. Their parents observed it. Every recorded human being in history has observed the sun rising. Can you therefore **know** that it will rise tomorrow?

Hume says no. Not with certainty. Not with anything that deserves the name "knowledge" in the rationalist sense. The inference from "the sun has always risen" to "the sun will rise tomorrow" requires a hidden premise: that the future will resemble the past. And how do you justify *that* premise? Only by appeal to past experience -- the future has always resembled the past so far. But that is circular. You are using induction to justify induction.

This is not a mere philosophical parlor trick. It strikes at the heart of all empirical science. Every scientific law, every experimental result, every engineering specification is a generalization from past observations to future expectations. Hume showed that this generalization is logically unjustified. We do it -- we must do it -- but we cannot give it a deductive foundation.

Hume also drew the distinction between **relations of ideas** (analytic truths like "all bachelors are unmarried," which are true by definition) and **matters of fact** (synthetic truths like "the sun will rise tomorrow," which depend on experience). Only the former are certain. The latter are, at best, highly probable -- but probability is not certainty, and the gap between them is infinite.

---

## 4. Kant's Synthesis: The Mind Structures Experience

### The Copernican Revolution in Philosophy

Immanuel Kant (1724-1804) was, by his own account, "awakened from dogmatic slumber" by Hume. The *Critique of Pure Reason* (1781, revised 1787) is his response: a monumental attempt to show that knowledge is neither purely rational nor purely empirical, but a product of the interaction between the mind's structure and the raw material of experience.

Kant's key innovation was the concept of **synthetic a priori knowledge** -- knowledge that is genuinely informative about the world (synthetic, not merely definitional) but that does not depend on particular experiences (a priori). His paradigm example was arithmetic: "7 + 5 = 12" is not true by definition (you cannot derive 12 from the concepts of 7, 5, and addition alone -- you must perform a synthesis), but it is not learned from experience either (you do not need to count physical objects to verify it). It is a truth that the mind contributes to experience.

Kant argued that the mind comes equipped with **categories of understanding** -- causal connection, substance, quantity, quality, and others -- that structure raw sensory input into the coherent experience we call the world. We do not passively receive the world as it is; we actively construct our experience according to innate cognitive architecture. Space and time are not features of things-in-themselves but **forms of intuition** -- the framework within which the mind organizes its experience.

The implication is profound: we can have genuine knowledge of the world as we experience it (the **phenomenal** world), but we can never know things as they are in themselves (the **noumenal** world). Science is possible -- contra Hume's radical skepticism -- but it is knowledge of appearances, not of ultimate reality.

For computational systems, Kant's insight translates to a recognition that every observation is mediated by a framework. A temperature sensor does not perceive temperature; it converts a voltage differential into a number according to a calibration curve. A natural language model does not understand text; it processes token sequences through learned parameters. The framework is always there, and it always shapes what counts as data.

---

## 5. Popper's Falsificationism: The Demarcation Problem

### What Separates Science from Pseudoscience?

Karl Popper (1902-1994) is arguably the most influential philosopher of science of the twentieth century, and his central contribution is elegant in its simplicity: a theory is scientific if and only if it is **falsifiable**.

Popper arrived at this criterion by reflecting on the difference between Einstein's general relativity and three other theories that were popular in early twentieth-century Vienna: Marxist historical materialism, Freudian psychoanalysis, and Adlerian individual psychology. All four claimed to explain human behavior or physical phenomena. But Popper noticed a crucial asymmetry.

Einstein's theory made a **specific, risky prediction**: light from distant stars would be bent by the sun's gravity by a precise amount, measurable during a solar eclipse. Arthur Eddington's 1919 expedition confirmed this prediction (within the measurement uncertainty of the time). Had the light not been bent, the theory would have been refuted. Einstein put his theory at risk.

Marx, Freud, and Adler, by contrast, seemed to explain everything. A Marxist could explain why a revolution happened (the contradictions of capitalism) and why it did not (false consciousness). A Freudian could explain why a patient loved his mother (Oedipus complex) and why he hated her (reaction formation). **A theory that can explain any possible observation explains nothing**, because it does not exclude any possible state of affairs.

This is the **demarcation criterion**: the boundary between science and non-science. A scientific theory must specify, in advance, what observations would prove it wrong. If no conceivable observation could falsify it, it is not science -- it may be metaphysics, or mathematics, or poetry, but it is not an empirical claim about the world.

### The Asymmetry of Verification and Falsification

Popper also identified a deep logical asymmetry between **verification** and **falsification**. No finite number of observations can verify a universal claim ("all swans are white"), because the next observation might be a black swan. But a single observation *can* falsify it -- one black swan, and the universal claim is dead.

This means we can never **prove** a scientific theory true. We can only fail to prove it false. A theory that has survived many sincere attempts at falsification is **corroborated** -- it has earned our tentative confidence -- but it is never confirmed. Science progresses not by accumulating verified truths but by eliminating errors. Every refuted theory is progress, because it narrows the space of possibilities.

For knowledge systems, Popper's framework has immediate practical implications. When we store a claim in a database, we should not think of it as "true" but as "not yet falsified." When we update a claim based on new evidence, we are not correcting an error; we are performing the normal operation of rational inquiry. The system should be designed for retraction and revision, not for the accumulation of permanent truths.

---

## 6. Kuhn's Paradigm Shifts: The Structure of Scientific Revolutions

### Normal Science and Revolution

Thomas Kuhn (1922-1996) published *The Structure of Scientific Revolutions* in 1962, and it detonated like a bomb in the philosophy of science. Kuhn argued that Popper's picture of science -- individual theories being tested against evidence and discarded when falsified -- bore little resemblance to how science actually works.

In practice, Kuhn argued, science operates in two modes. **Normal science** is the day-to-day work of researchers operating within a shared **paradigm** -- a framework of assumptions, methods, exemplary solutions, and shared values that defines what counts as a legitimate problem and what counts as a legitimate solution. Normal science is puzzle-solving: applying the paradigm to new cases, extending its reach, refining its measurements. It is not heroic. It is not revolutionary. It is the bread and butter of scientific work, and it is enormously productive precisely because researchers do not question the paradigm's foundations.

But anomalies accumulate. Observations that the paradigm cannot explain -- or that require increasingly elaborate auxiliary hypotheses to accommodate -- pile up. For a long time, these anomalies are ignored, explained away, or set aside as unsolved puzzles. The paradigm is too productive to abandon over a few embarrassments.

Then, sometimes, a **crisis** develops. The anomalies become too numerous, too central, too embarrassing. A new framework emerges that explains the anomalies -- but at the cost of reorganizing the entire field's understanding. The shift from Ptolemaic to Copernican astronomy, from Newtonian to Einsteinian mechanics, from classical to quantum physics -- these are **paradigm shifts**, and they are not smooth, incremental transitions. They are wholesale replacements of one worldview by another.

### Incommensurability

Kuhn's most controversial claim was **incommensurability**: the idea that scientists working in different paradigms literally see different worlds. A Newtonian physicist looking at a swinging pendulum sees a body constrained by a force, gradually losing energy to friction. An Aristotelian sees a body struggling to reach its natural state of rest. They are not disagreeing about the interpretation of shared data; they are seeing different data, because their paradigms determine what counts as data.

This does not make paradigm choice irrational. Scientists resist paradigm changes not because they are stubborn or stupid, but because they have rational commitment to a framework that has proven productive. The old paradigm has solved hundreds of problems; the new paradigm has solved a handful of anomalies but has not yet proven itself on the full range of phenomena. Switching paradigms is a leap of faith -- an informed, rational leap, but a leap nonetheless.

For our purposes, Kuhn's framework is a warning about the danger of encoding paradigmatic assumptions into knowledge systems. A triple store built on one ontology may be literally unable to represent the claims of a competing framework. If your schema assumes that diseases are caused by pathogens, you cannot represent a humoral theory of disease within it -- not because humoral theory is wrong (it is), but because the schema excludes it structurally. The ontology is not neutral; it embodies a paradigm.

---

## 7. Lakatos and Research Programs: The Sophisticated Middle Ground

### Bridging Popper and Kuhn

Imre Lakatos (1922-1974) saw merit in both Popper and Kuhn and attempted a synthesis. His concept of **research programs** provides a more nuanced picture than either pure falsificationism or paradigm theory.

A research program consists of a **hard core** -- a set of fundamental assumptions that practitioners agree not to question -- surrounded by a **protective belt** of auxiliary hypotheses that can be modified, adjusted, or replaced in response to anomalies. When an experiment contradicts the program, you do not immediately abandon the hard core; you modify the protective belt. You add epicycles. You postulate hidden variables. You refine your instruments.

This is not irrational. It is how productive science actually works. Newton's mechanics was contradicted by the anomalous precession of Mercury's orbit for over a century. Physicists did not abandon Newtonian mechanics; they postulated a hidden planet (Vulcan), re-examined their observations, and refined their calculations. This was perfectly reasonable protective-belt work. It just happened to be wrong -- the solution required Einstein, not Vulcan.

Lakatos distinguished between **progressive** and **degenerating** research programs. A progressive program makes novel predictions that are subsequently confirmed: each adjustment to the protective belt opens new empirical territory. A degenerating program makes only *ad hoc* adjustments: each modification saves the theory from refutation but predicts nothing new. Ptolemaic astronomy in its final centuries was degenerating -- each new epicycle saved the appearances but made no novel predictions. Copernican astronomy was progressive -- it predicted stellar parallax (not observed until 1838, but predicted from the start).

The practical value of Lakatos for knowledge systems is the distinction between defensive and productive revision. When we update a stored claim to accommodate new evidence, we should ask: does this update make the knowledge graph more predictive, or is it merely papering over an anomaly? A system that tracks not just what was revised but *whether the revision was progressive* would be genuinely epistemologically aware.

---

## 8. Feyerabend's Anarchism: Against Method

### The Case for Chaos

Paul Feyerabend (1924-1994) was the enfant terrible of the philosophy of science. His *Against Method* (1975) argued, with relentless historical examples, that there is no single scientific method that has produced all of science's successes. Every methodological rule you can articulate -- test your theories against evidence, be consistent, do not use ad hoc hypotheses, respect established results -- has been productively violated by scientists who went on to make major discoveries.

Galileo did not merely observe the moons of Jupiter through his telescope and report what he saw. He engaged in **propaganda**: he published in Italian rather than Latin (to reach a broader audience), he ridiculed his opponents (the *Dialogue Concerning the Two Chief World Systems* is a work of polemical rhetoric as much as science), and he used his telescope at a time when its optical properties were poorly understood and its images were unreliable by the standards of the day. He was right, but he was right for reasons that violated every norm of careful empirical science as understood by his contemporaries.

Feyerabend's slogan -- **"anything goes"** -- is frequently misunderstood as an endorsement of irrationalism. It is not. It is an observation that no fixed methodology can account for the full history of scientific progress. The rules work sometimes, in some contexts. Breaking the rules works sometimes, in other contexts. The only meta-rule that survives historical scrutiny is that there is no universal meta-rule.

For system builders, Feyerabend is a cautionary voice against methodological rigidity. A knowledge system that enforces a single validation pipeline -- every claim must pass through the same gates in the same order -- will inevitably reject some valid claims and accept some invalid ones. The system should be flexible enough to accommodate multiple modes of validation, multiple standards of evidence, multiple pathways from observation to stored knowledge.

---

## 9. Bayesian Epistemology: Updating Beliefs with Evidence

### The Modern Synthesis

Most working scientists, if you ask them to articulate their epistemology, will describe something close to **Bayesian inference** -- even if they have never heard of Thomas Bayes (1702-1761) or read a single paper on Bayesian epistemology.

The core idea is disarmingly simple. You begin with a **prior probability** -- your initial degree of belief in a hypothesis before seeing any evidence. You then observe evidence and update your belief using **Bayes' theorem**:

> P(H|E) = P(E|H) * P(H) / P(E)

The **posterior probability** P(H|E) -- your updated belief in the hypothesis given the evidence -- is proportional to the **likelihood** P(E|H) -- the probability of observing that evidence if the hypothesis were true -- times the **prior** P(H), normalized by the total probability of the evidence P(E).

What makes this framework so powerful is that it provides a precise, quantitative account of how rational agents should update their beliefs. It handles uncertainty natively. It accommodates degrees of belief rather than binary true/false. It can incorporate new evidence incrementally rather than requiring a complete re-evaluation of all past data. And it naturally implements something like Popper's falsificationism: evidence that is unlikely under the hypothesis (low P(E|H)) drives the posterior down, while evidence that is more likely under the hypothesis than under alternatives drives it up.

### Prior Probabilities and the Problem of Subjectivity

The Bayesian framework has a notorious weakness: where do the priors come from? If two scientists start with different priors -- one believing a hypothesis is 90% likely, the other 10% -- they will update differently even when confronted with the same evidence. In principle, with enough evidence, their posteriors will converge (this is the content of several convergence theorems). In practice, convergence can be slow, and the choice of prior is often the most consequential and least justified step in the analysis.

This is not a fatal flaw. It is an honest acknowledgment of something that all other frameworks paper over: **the starting point matters**. Popper pretended that theories are tested against evidence without prior commitments. Kuhn showed that prior commitments (paradigms) determine what counts as evidence. Bayesian epistemology makes prior commitments explicit, quantitative, and subject to update. It does not solve the problem of subjectivity; it domesticates it.

For knowledge systems, the Bayesian framework suggests that every stored claim should carry a confidence level that is updated as new evidence arrives. A claim with a confidence of 0.95 that has been tested against hundreds of observations is qualitatively different from a claim with a confidence of 0.95 based on a single expert's opinion. The posterior probability is not the whole story -- the *amount of evidence* behind it matters, and a mature system should track both.

---

## 10. What This Means for Us

### Claims, Not Truths

We are builders of AI systems that process research. We build memory stores, knowledge graphs, triple stores, embedding spaces. Every one of these systems encodes epistemological commitments, whether its builders recognize them or not.

The single most important lesson from twenty-four centuries of epistemology is this: **our systems store claims, not truths.** A triple `(aspirin, treats, headache)` is not a fact about the world. It is a claim, made by some source, at some time, with some evidence, within some paradigm. A responsible knowledge system must track all of these contextual dimensions. Who said it? When? What evidence supported it? What framework was assumed? Has the claim survived attempts at falsification?

### The Grove Format as Epistemological Architecture

Our Grove format -- the content-addressed record specification that underpins the skill library -- already embodies some of these insights. Content addressing means that a claim's identity is determined by its content, not by an arbitrary ID assigned by an authority. This is closer to Lakatos than to Kuhn: the claim stands or falls on its own terms, not on the authority of the paradigm that produced it.

But content addressing alone is not enough. A claim that is content-addressed but carries no provenance, no confidence level, and no falsification history is epistemologically naive. It is an assertion without an epistemology. The next steps for our knowledge systems should include:

1. **Provenance tracking** -- every claim should carry a chain of sources back to its origin.
2. **Confidence propagation** -- when claim A depends on claim B, A's confidence should be bounded by B's.
3. **Falsification records** -- when a claim is retracted or superseded, the retraction should be first-class data, not a deletion.
4. **Paradigm tagging** -- claims should be tagged with the framework within which they are meaningful, so that cross-paradigm queries can be handled with appropriate caution.
5. **Progressive vs. degenerating markers** -- if a body of claims requires increasingly elaborate revisions to accommodate new evidence, the system should surface this pattern.

### The Memory Arena as Epistemological Infrastructure

Our memory arena -- the Rust-backed, mmap-based persistent storage layer -- is the substrate on which all of this runs. Chunks in the arena are not truths; they are records. The tier system (hot RAM, warm NVMe, cold postgres) is not a hierarchy of certainty; it is a hierarchy of access frequency. A claim that moves from hot to cold is not becoming less true -- it is becoming less recently relevant.

But there is an epistemological insight even here: **the act of retrieving a claim changes its status.** A claim that is accessed frequently is, in Bayesian terms, a claim that the system's users find informative -- it is doing work, constraining decisions, shaping outputs. A claim that is never accessed is epistemologically inert. The access pattern is itself evidence about the claim's utility, and a sophisticated system could use access frequency as a weak prior for relevance.

### The Honest Position

We cannot resolve the epistemological debates that Plato, Hume, Kant, Popper, Kuhn, and Lakatos have waged for millennia. We should not try. What we can do is build systems that are **epistemologically honest** -- systems that represent claims as claims, that track evidence and provenance, that handle retraction gracefully, that do not pretend to store truth when they store belief, and that make their own assumptions visible and inspectable.

The history of epistemology is not a sequence of failed attempts to find truth. It is a sequence of increasingly sophisticated accounts of what "truth" means, what "evidence" counts as, and how rational agents should navigate uncertainty. Every position in this history -- from Plato's Forms to Bayesian posteriors -- captures something real about the structure of knowledge. Our systems should be capacious enough to learn from all of them.

---

## Further Reading in This Series

- **[The Structure of a Research Question](structure-of-research-question.md)** -- how to formulate questions that are precise enough to investigate and open enough to surprise you
- **[Evidence and Argumentation](evidence-and-argumentation.md)** -- what counts as evidence, how arguments are structured, and the difference between deductive, inductive, and abductive reasoning
- **[Methodology Survey](methodology-survey.md)** -- quantitative, qualitative, mixed methods, and computational approaches
- **[Reproducibility and Replication](reproducibility-and-replication.md)** -- the replication crisis, preregistration, and what it means for a result to be "real"
- **[Research Ethics](research-ethics.md)** -- from the Nuremberg Code to IRBs to the ethics of AI-generated research

---

## Study Guide — Epistemology of Research

Key distinctions: knowledge-that vs knowledge-how,
a priori vs empirical, justified belief vs truth.

## DIY — Write down what you think "evidence" means

One paragraph. Then read the epistemology literature's
answer. Note gaps.

## TRY — Apply Bayesian updating

Pick a contested claim. Write your prior. Read one
paper. Update. Write your posterior.

*Part of the [Research Methodology Series](.), a component of the [Artemis II Research Program](../../../ERDOS-TRACKER.md).*
