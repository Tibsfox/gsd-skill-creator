# Bias and Pitfalls in Research

*The ways we fool ourselves -- and the discipline required not to*

---

## 1. Confirmation Bias -- The Mother of All Biases

In 1960, Peter Cathcart Wason, a cognitive psychologist at University College London, published a deceptively simple experiment. He told subjects he had a rule in mind that governed sequences of three numbers. He gave them an example that fit the rule: **2, 4, 6**. Their task was to discover the rule by proposing their own sequences; for each one, Wason would tell them whether it conformed to the rule or not. When they felt confident, they could announce their hypothesis.

The results were devastating.

Most subjects immediately hypothesized "increasing by 2" or "even numbers going up" -- a perfectly reasonable inference from the seed example. Then they tested sequences like 8, 10, 12 and 20, 22, 24 and 100, 102, 104. Wason confirmed each one. They grew more confident. They announced their rule. And they were wrong.

Wason's actual rule was simply **"any three ascending numbers."** The sequence 1, 2, 3 fit. So did 5, 97, 1000. So did 0.01, 7, 44. But subjects almost never tested sequences that would *disprove* their hypothesis -- sequences like 1, 2, 3 (which would have confirmed *ascending* but disproved *increasing by 2*) or 5, 4, 3 (which would have disproven both). They asked questions designed to hear "yes" rather than questions designed to hear "no."

This is **confirmation bias**: the systematic tendency to seek, interpret, and remember evidence that confirms what we already believe, while ignoring or dismissing evidence that contradicts it. It is not a minor cognitive quirk. It is not a failure exclusive to lazy thinkers. It is the foundational error from which a dozen other biases spring, and it operates most powerfully when we are unaware of it.

The cruelest twist is that **intelligence makes it worse, not better.** A smarter person is not better at evaluating evidence impartially. A smarter person is better at constructing elaborate, internally consistent arguments for whatever they already believe. Dan Kahan's research on cultural cognition at Yale has shown repeatedly that higher numeracy and scientific literacy correlate with *more* polarized beliefs on politically charged scientific questions, not less. The analytical horsepower gets deployed in service of motivated reasoning. The sword is sharper, but it still points in the direction the wielder chose before the argument began.

Richard Feynman, in his 1974 Caltech commencement address -- later published as "Cargo Cult Science" -- put it with characteristic bluntness:

> **"The first principle is that you must not fool yourself -- and you are the easiest person to fool."**

He went further. He argued that the entire purpose of scientific method is not to prove things true, but to prevent you from deceiving yourself. Controls, blinding, peer review, replication -- these are not bureaucratic rituals. They are **anti-self-deception technology.** Every one of them exists because a smart person, left alone with their data and their hypothesis, will find exactly what they expect to find.

The implication for research practice is stark: the moment you form a hypothesis, you have become your own adversary. The honest move is not to build the strongest case for your idea. The honest move is to build the strongest case *against* it and see if it survives. Karl Popper called this falsificationism. Feynman called it "bending over backwards." Most researchers call it painful. All of them know it is necessary.

---

## 2. Survivorship Bias -- The Missing Data That Never Speaks

During World War II, the Center for Naval Analyses was asked to study the distribution of damage on bombers returning from combat missions. The question seemed straightforward: where should additional armor be placed? The data showed concentration of bullet holes in the fuselage and wings. The obvious recommendation was to reinforce those areas.

**Abraham Wald**, a Hungarian mathematician working with the Statistical Research Group at Columbia University, saw the data differently. The sample, he pointed out, consisted entirely of planes that had *returned*. The planes with holes in the engines and cockpits were not in the dataset because they were at the bottom of the English Channel or in pieces across occupied France. The areas showing the *least* damage on returning aircraft were precisely the areas where damage was *most* lethal -- lethal enough that planes hit there never made it home.

Wald's recommendation: **armor the places that don't have bullet holes.**

This is survivorship bias -- the logical error of drawing conclusions from an incomplete dataset that has been filtered by a survival criterion. You are studying the winners, the survivors, the published, the visible. You are not studying the losers, the dead, the unpublished, the silent. And the missing data is often more informative than the data you have.

Survivorship bias pervades modern discourse. Business books study successful companies and extract "principles of success" without examining the thousands of companies that followed identical principles and failed. Startup advice comes overwhelmingly from founders who survived -- the ones who got lucky enough, or early enough, or well-connected enough for their particular set of decisions to yield a positive outcome in a landscape dominated by failure. The advice is real. The selection effect that makes it visible is also real. And the latter makes the former far less generalizable than it appears.

In academic research, survivorship bias operates through publication. The papers that appear in journals are the ones that "worked" -- that found significant effects, confirmed interesting hypotheses, produced clean results. The papers that found nothing, that produced messy or null results, that contradicted fashionable theories -- those papers were never submitted, or were submitted and rejected, or were abandoned in desk drawers. The published literature is a curated exhibition of survivors, and every generalization drawn from it carries the fingerprint of the selection process that created it.

Wald's insight is simple and ruthless: **before you analyze your data, ask what data is missing and why.** The most important information in any dataset may be the records that aren't there.

---

## 3. Publication Bias -- The File Drawer Problem

In 1979, Robert Rosenthal, a psychologist at Harvard, formalized what many researchers had suspected for decades. He called it **the file drawer problem**: for every published study showing a statistically significant result, there are an unknown number of studies that found null results sitting in researchers' file drawers, unpublished and invisible. The published literature is not a representative sample of all research conducted. It is a biased sample, systematically enriched for positive findings.

The mechanism is straightforward and operates at every level. Researchers are less motivated to write up null results -- the narrative is less compelling, the career reward is smaller. Reviewers and editors preferentially accept studies that report significant findings -- they are more "interesting," more "novel," more likely to be cited. Journals have limited pages and unlimited submissions, and a study that "found something" beats a study that "found nothing" in the competition for space. The result is a filter -- a sieve through which the published literature must pass -- that systematically removes null results and amplifies positive ones.

The consequences are not abstract. If only positive results are published, then **the published literature systematically overestimates effect sizes.** A drug that produces no benefit in four out of five trials and a marginal benefit in one looks, in the published record, like a drug that works. A psychological intervention that fails in three labs and succeeds in one becomes a "proven" technique. The true effect, averaged across all studies (published and unpublished), is smaller -- sometimes much smaller, sometimes zero -- but the unpublished studies are invisible.

Detection is possible but imperfect. The **funnel plot** -- a scatter plot of effect size against study precision (typically sample size or standard error) -- provides a visual diagnostic. In the absence of publication bias, the plot should be symmetric: small studies will scatter widely around the true effect, large studies will cluster tightly near it, forming a funnel shape. When publication bias is present, the funnel becomes **asymmetric** -- small studies showing null or negative results are missing from the lower left, leaving a lopsided distribution that leans toward positive effects.

The response has been institutional. The **AllTrials campaign**, launched in 2013 by Ben Goldacre, Sense About Science, the BMJ, the James Lind Initiative, and the Cochrane Collaboration, demands that all clinical trials be registered at inception and all results reported -- not just the ones that showed what the investigators hoped to find. ClinicalTrials.gov, established by the NIH in 2000, now requires pre-registration of clinical trials conducted under FDA jurisdiction. The logic is simple: if you cannot hide null results, you cannot bias the literature toward positive ones.

But registration is only a partial fix. Pre-registration does not prevent interpretation bias, selective reporting within studies, or the subtler forms of data massage that p-hacking enables. The file drawer problem is the most visible symptom of a deeper disease: the incentive structure of academic publishing rewards findings over accuracy, novelty over truth.

---

## 4. P-Hacking -- The Garden of Forking Paths

A p-value of 0.05 means, roughly, that if no real effect exists, you would expect to see data this extreme or more extreme only 5% of the time by chance. It is a threshold, a convention, a line in the sand. It is also a target -- and targets get gamed.

**P-hacking** is the practice of trying multiple analyses on the same data until a statistically significant result appears. It can be crude: run twenty comparisons and report the one that yields p < 0.05 (by pure chance, one in twenty will). More commonly it is subtle, unconscious, and distributed across dozens of small "researcher degrees of freedom" -- legitimate-seeming decisions that cumulatively bias results toward significance.

Andrew Gelman and Eric Loken formalized this in their 2013 paper **"The Garden of Forking Paths."** At every decision point in data analysis, the researcher faces multiple defensible choices:

- Include or exclude outliers?
- Use the full sample or a subgroup?
- Control for this covariate or that one?
- Transform the dependent variable or use it raw?
- Combine these two conditions or analyze them separately?
- Use this statistical test or that one?

Each choice is individually reasonable. No single decision is "wrong." But the space of possible analyses is combinatorially large, and the researcher navigates this space with a map drawn by their own expectations. The "path" through the garden that leads to p < 0.05 is not chosen by fraud. It is chosen by a thousand small, unconscious nudges -- each one defensible, each one pushing toward the destination the researcher already wanted to reach.

Gelman and Loken's key insight is that **you do not need to run all the analyses and cherry-pick.** You need only run one analysis, arrived at through a sequence of choices that were influenced -- however subtly -- by the data itself. The forking happens in the researcher's mind, not in a spreadsheet. This is why p-hacking is so insidious: the researcher can engage in it without awareness, without dishonesty, without any single identifiable moment of misconduct.

FiveThirtyEight's 2015 interactive feature **"Hack Your Way to Scientific Glory"** made this tangible. Users could manipulate analytic choices in a simulated study of whether the U.S. economy performs better under Democratic or Republican presidents. By toggling which economic indicators to include, how to define "the economy," which years to count, and whether to control for various factors, users could produce statistically significant results in *either* direction. The data was real. The analyses were defensible. The conclusions were contradictory. The lesson was clear: **flexibility in analysis is indistinguishable from fabrication in its effects on the literature.**

The defense against p-hacking is **pre-registration** -- specifying the hypothesis, sample, and analysis plan before looking at the data. A pre-registered analysis has no garden of forking paths because the path was fixed before the garden was entered. This does not prevent exploratory analysis (which is valuable and necessary), but it requires that exploratory findings be labeled as such, rather than presented as confirmatory tests.

---

## 5. HARKing -- Hypothesizing After Results Are Known

Imagine a researcher collects data on fifty variables, hoping to find a pattern. She discovers a surprising correlation between variable 23 and variable 41. She writes a paper presenting this correlation as her primary hypothesis, crafting a compelling theoretical rationale for why these two variables should be related, and reports a highly significant p-value as confirmation.

This is **HARKing** -- Hypothesizing After Results are Known -- a term coined by Norbert Kerr in 1998. It is the practice of presenting post hoc findings as though they were predicted a priori. The theoretical story told in the introduction was written after the results section, not before. The prediction is a postdiction dressed in prediction's clothing.

The problem is not that the correlation is spurious (it may or may not be). The problem is that the **statistical test is invalid.** A p-value computed for a hypothesis that was generated from the same data being tested is meaningless. The hypothesis was selected *because* it fit the data. Confirming that the data fits the hypothesis is circular. You are asking the data to confirm what the data already told you, and acting surprised when it does.

The distinction between **prediction** and **postdiction** is the load-bearing wall of statistical inference. A prediction is a statement about what you expect to find, made before you look. A postdiction is a story you tell about what you already found. Both are valuable. The first supports confirmatory inference. The second supports hypothesis generation -- a perfectly respectable activity, provided it is labeled honestly. The sin of HARKing is not exploration. It is the disguising of exploration as confirmation.

**Pre-registration** is the primary defense. By depositing your hypothesis and analysis plan in a public, timestamped registry before data collection, you make HARKing structurally impossible. The registered hypothesis either matches the results or it does not. Any additional findings are automatically flagged as exploratory. The incentive to HARK -- the career reward for "predicting" a surprising result -- is neutralized by the existence of a public record showing what you actually predicted.

**Registered Reports**, a publishing format adopted by a growing number of journals, take this further. In a Registered Report, peer review occurs *before* data collection. If the question and methodology are sound, the journal commits to publish the results regardless of outcome. The researcher cannot HARK because the hypothesis was peer-reviewed and accepted before the data existed. And the journal cannot engage in publication bias because it committed to the paper before knowing the results.

---

## 6. The Base Rate Fallacy -- Ignoring What You Already Know

A disease afflicts 1% of the population. A diagnostic test has 95% sensitivity (it correctly identifies 95% of people who have the disease) and 95% specificity (it correctly identifies 95% of people who do not have the disease). You test positive. What is the probability you have the disease?

The intuitive answer -- somewhere around 95% -- is catastrophically wrong.

Consider 10,000 people. One hundred have the disease. The test correctly identifies 95 of them (sensitivity). Of the 9,900 healthy people, it incorrectly flags 495 (the 5% false positive rate from specificity). Total positive tests: 95 + 495 = 590. Of those 590 positive results, only 95 are true positives. The **positive predictive value** is 95/590, which is approximately **16%.**

You tested positive, and you almost certainly do not have the disease.

This is the **base rate fallacy** -- the cognitive error of ignoring the prior probability (base rate) of an event when evaluating diagnostic evidence. It is not a minor mathematical subtlety. It has killed people. In mass screening programs for rare diseases, false positive rates regularly swamp true positive rates, leading to unnecessary surgeries, biopsies, treatments, and psychological distress. Every first-year epidemiology student learns this arithmetic. Many practicing physicians get it wrong.

The base rate fallacy matters for research methodology because **every statistical test is a diagnostic.** When you compute a p-value, you are asking whether your data is "positive" for a real effect. But the p-value alone does not tell you the probability that the effect is real -- just as a positive test result alone does not tell you the probability of disease. To get the probability of a real effect, you need the base rate: the prior probability that your hypothesis is true.

This is where **Bayesian thinking** becomes essential. Thomas Bayes' theorem provides the formal machinery for combining prior probability with new evidence to produce a posterior probability. It forces you to state what you believed before you saw the data and to show how the data updated that belief. In the disease example, Bayes' theorem takes the prior (1% prevalence), the likelihood (95% sensitivity), and the false positive rate (5%) and produces the posterior (16% probability of disease given a positive test).

Researchers who ignore base rates overinterpret significant results in low-prior-probability domains. If you are testing a truly novel, theoretically unmotivated hypothesis -- one where the prior probability of being correct is, say, 5% -- then even a study with excellent methodology and p < 0.05 may have a posterior probability well below 50%. The data moved the needle. It did not move it far enough.

---

## 7. Goodhart's Law -- When Measures Become Targets

In 1975, Charles Goodhart, a British economist and former chief adviser to the Bank of England, articulated a principle that has since been generalized far beyond monetary policy:

> **"Any observed statistical regularity will tend to collapse once pressure is placed upon it for control purposes."**

Or, in the pithier formulation attributed to Marilyn Strathern:

> **"When a measure becomes a target, it ceases to be a good measure."**

The mechanism is intuitive. A metric is chosen because it correlates with something we care about. We begin to optimize for the metric directly. People figure out how to increase the metric without increasing the thing it was supposed to measure. The correlation between the metric and the underlying quality breaks down. The metric becomes noise disguised as signal.

**Campbell's law** (1979) states the same principle more forcefully: "The more any quantitative social indicator is used for social decision-making, the more subject it will be to corruption pressures and the more apt it will be to distort and corrupt the social processes it is intended to monitor."

The examples in research are everywhere:

- **The journal impact factor** was designed as a tool for librarians to evaluate serial subscriptions. It became the dominant measure of journal "quality," then individual researcher "quality," then departmental "quality." Once it became a target, journals began gaming it: publishing more review articles (which attract citations), rejecting methodologically sound but niche work (which drags down the average), and manipulating citation windows. The correlation between impact factor and any meaningful measure of scientific quality is weak, but the metric drives hiring, tenure, and funding decisions worldwide.

- **The h-index**, proposed by Jorge Hirsch in 2005, was intended as a simple summary of a researcher's citation impact. It became a target for career advancement. Researchers now strategically self-cite, form citation cartels, salami-slice publications to maximize count, and choose research topics based on citation potential rather than scientific importance.

- **Citation counts** incentivize writing citable rather than readable papers, producing literature optimized for reference lists rather than understanding.

- **Lines of code** as a productivity metric incentivize verbose code. **Test count** incentivizes trivial tests. **Coverage percentage** incentivizes testing the easy paths and ignoring the hard ones.

In every case the same dynamic plays out: the metric was informative *before* it was a target. The act of targeting it destroyed the correlation that made it informative. Goodhart's law is not a failure of measurement. It is a failure of incentive design -- the predictable consequence of optimizing for a proxy instead of the thing itself.

---

## 8. Anchoring and Availability -- The Invisible Thumb on the Scale

**Anchoring** is the cognitive bias in which the first piece of information encountered on a topic disproportionately influences subsequent judgments. In a classic demonstration, Amos Tversky and Daniel Kahneman (1974) had subjects spin a rigged wheel that landed on either 10 or 65, then asked them to estimate the percentage of African countries in the United Nations. Subjects who saw 10 guessed a median of 25%. Subjects who saw 65 guessed a median of 45%. The wheel was explicitly random. The anchor was explicitly irrelevant. It influenced judgment anyway.

In research, the first paper you read on a topic sets your anchor. Its framing, its effect sizes, its methodological choices, its theoretical lens -- all of these become the baseline against which you evaluate everything that follows. If the first paper reports a large effect, subsequent papers reporting smaller effects feel "disappointing" or "failed to replicate." If the first paper frames the question as a debate between two theories, you may never notice that a third theory was excluded from the conversation. The anchor does not need to be correct to be influential. It needs only to be first.

**Availability bias** is the tendency to overweight information that is vivid, recent, or emotionally charged. We judge the probability of events not by their actual frequency but by the ease with which examples come to mind. Plane crashes are vividly memorable; car accidents are not. We fear flying and drive without concern, despite the statistics pointing in exactly the opposite direction.

In literature reviews, availability bias means that **memorable studies distort your picture of the field.** The study with the dramatic result, the clever title, the famous author, the controversial conclusion -- these are the studies that come to mind when you think about a topic. The twenty careful, incremental, methodologically sound studies that collectively tell a more accurate story are less available and therefore less influential on your mental model.

Together, anchoring and availability create a systematic distortion in how researchers process information. The first thing you read and the most vivid thing you remember are not necessarily the most representative things in the literature. A disciplined literature review must counteract both: read broadly before forming impressions (to avoid anchoring on a single study) and actively seek out the boring, incremental, unsexy work that availability bias would cause you to overlook.

---

## 9. The Replication Crisis -- Systemic Failure

In 2005, John Ioannidis, a Greek-American physician and professor at Stanford, published a paper in PLOS Medicine with the provocative title **"Why Most Published Research Findings Are False."** It was not a polemic. It was a mathematical argument.

Ioannidis modeled the probability that a published finding is true as a function of several variables: the prior probability of the hypothesis (R), the statistical power of the study, the significance threshold (alpha), the number of research teams investigating the question, and the degree of bias (including publication bias, p-hacking, and selective reporting). He showed that under realistic assumptions -- low prior probability, underpowered studies, flexible analysis, strong publication bias, multiple teams racing to publish -- the probability that a statistically significant published finding reflects a true effect can be **well below 50%.**

This was not a theoretical curiosity. In 2011, the Open Science Collaboration, led by Brian Nosek at the University of Virginia, began systematically replicating 100 published psychology studies. The results, published in *Science* in 2015, confirmed Ioannidis's mathematical prediction: only **36 out of 100** replications produced significant results, and the mean effect size across replications was roughly half the original estimates. Studies that had reported barely significant results (p-values near 0.05) replicated at even lower rates.

Similar replication projects in other fields produced similar results:

- **Cancer biology** (Reproducibility Project: Cancer Biology, 2021): fewer than half of high-profile preclinical cancer studies could be replicated, and effect sizes were, on average, 85% smaller than originally reported.
- **Economics** (Camerer et al., 2016): 11 of 18 experimental economics studies replicated, with effect sizes averaging 66% of originals.
- **Social science** (Social Sciences Replication Project, 2018): 13 of 21 social science studies published in *Nature* and *Science* replicated.

The replication crisis is not caused by any single bias. It is the **compound failure** of every bias described in this document operating simultaneously within a system of misaligned incentives:

| Bias | Contribution |
|------|-------------|
| Confirmation bias | Researchers find what they expect to find |
| Survivorship bias | Failed studies are invisible |
| Publication bias | Only positive results reach the literature |
| P-hacking | Flexibility in analysis inflates false positive rates |
| HARKing | Post hoc hypotheses are presented as predictions |
| Base rate neglect | Low-prior hypotheses tested at conventional alpha produce mostly false positives |
| Goodhart's law | Metrics (p < 0.05, impact factor, h-index) are gamed |
| Small samples | Underpowered studies produce noisy estimates and inflated effects |
| Career incentives | "Publish or perish" rewards volume and novelty over accuracy |

The crisis is not a failure of individual integrity. Most researchers are honest. The crisis is a **systemic failure** -- a set of individually rational behaviors (pursue interesting hypotheses, report significant results, publish in high-impact journals, build an impressive CV) that collectively produce an unreliable literature. Each actor in the system is optimizing locally. The global outcome is a body of published knowledge that is less trustworthy than its consumers assume.

Ioannidis's paper has been cited over 12,000 times. It remains one of the most accessed papers in the history of PLOS Medicine. Its title, fifteen words long, reframed an entire generation's relationship with published research.

---

## 10. Defenses -- The Discipline Required Not to Fool Yourself

The biases cataloged above are not destiny. They are failure modes with known countermeasures. No single countermeasure is sufficient. Together, they form a defense-in-depth strategy against the most dangerous adversary any researcher faces: themselves.

### Pre-registration

Specify your hypothesis, sample, and analysis plan in a public, timestamped registry before collecting data. This eliminates p-hacking and HARKing by fixing the analytical path before the garden of forking paths is entered. The Open Science Framework (osf.io), AsPredicted, and ClinicalTrials.gov provide infrastructure. Pre-registration does not prevent exploration -- it requires that exploration be labeled as such.

### Registered Reports

Peer review the question and methodology *before* data collection. If accepted, the journal publishes regardless of results. This eliminates publication bias at the source. Over 350 journals now accept Registered Reports across fields from psychology to ecology to economics.

### Adversarial Collaboration

When two researchers disagree, they design a study together -- agreeing in advance on the methods, the data, and the criteria for adjudication. The result is accepted by both parties, regardless of which hypothesis it supports. Daniel Kahneman championed this approach as a way to resolve disputes that otherwise calcify into entrenched positions defended by confirmation bias.

### Blinding

Keep the analyst unaware of group assignments. Keep the data collector unaware of the hypothesis. Keep the outcome assessor unaware of treatment status. Every layer of blinding removes a channel through which confirmation bias can operate. In computational research, blinding can mean having one team prepare the data and a separate team analyze it.

### Large Samples and Power Analysis

Small samples produce noisy estimates and inflated effect sizes (because only large observed effects cross the significance threshold in small samples). Computing the required sample size *before* data collection -- based on a realistic estimate of effect size -- ensures that the study is capable of detecting true effects and that significant results are unlikely to be statistical flukes.

### Meta-analysis

Combine multiple studies quantitatively to estimate a pooled effect size. Meta-analysis can detect publication bias (through funnel plot asymmetry), estimate the true effect size (correcting for publication bias), and identify moderators that explain variation across studies. It is not a panacea -- "garbage in, garbage out" applies -- but it is a powerful tool for moving beyond the results of any single study.

### Open Data and Open Code

Publish the raw data and the analysis code alongside the paper. This allows anyone to verify the results, attempt alternative analyses, and detect errors or p-hacking. It transforms science from a trust-based system to a verify-based system. The shift is slow, sometimes painful, and entirely necessary.

### Replication

Repeat the study. If the finding is real, it will replicate. If it does not replicate, it was noise, or artifact, or fraud, or the product of some uncontrolled variable. Replication is the ultimate test, and the replication crisis exists precisely because the field failed to apply this test systematically for decades.

### The Bayesian Turn

Replace null hypothesis significance testing (NHST) with Bayesian inference. Report posterior probabilities and Bayes factors rather than p-values. Force explicit statement of priors. The Bayesian framework naturally incorporates base rates, handles null results gracefully (a Bayes factor can provide evidence *for* the null, not just failure to reject it), and eliminates the arbitrary threshold of p < 0.05.

### Intellectual Humility

The hardest defense and the most important. The willingness to say "I was wrong," "I don't know," "the data contradicts my theory and my theory must change." This is not a statistical technique. It is a disposition. It cannot be mandated by journal policy or enforced by institutional review boards. It can only be cultivated -- by individuals, by labs, by departments, by entire fields -- through a culture that rewards accuracy over impact, truth over novelty, correction over consistency.

### Our Approach

In this project's methodology, these defenses are not aspirational. They are structural.

**Verify-work after execute-phase.** Every phase of GSD workflow ends with explicit verification -- not "does it look right?" but "does it match the specification, reproduce on a clean build, and survive adversarial review?" Verification is not optional, not deferred, and not delegated to the person who wrote the code.

**Nyquist sampling.** You must sample at twice the frequency of the phenomenon you are trying to measure. Undersampled data produces aliased conclusions -- patterns that look real but are artifacts of insufficient resolution. This principle, borrowed from signal processing, applies to literature reviews (read enough papers to avoid anchoring), to testing (run enough tests to distinguish signal from noise), and to replication (reproduce enough times to trust the result).

**Adversarial review.** The adversarial-pr-review process is an implementation of adversarial collaboration: the reviewer's job is not to approve, but to break. Find the assumption that does not hold. Find the edge case that crashes. Find the argument that does not survive cross-examination. A review that finds nothing wrong is not a good review. It is an insufficient review.

**Trust no one** -- including yourself. Cedar's principle is not cynicism. It is epistemological hygiene. Trust is earned through verified behavior, not declared through assertion. Data earns trust by surviving replication. Code earns trust by passing tests it did not know about in advance. Hypotheses earn trust by predicting observations they were not constructed to explain. The default state is not distrust. The default state is *unverified* -- and unverified is not the same as false, but it is not the same as true either.

---

## Coda

The biases described here are not aberrations. They are the default operating mode of the human mind applied to the task of understanding the world. Confirmation bias is efficient -- it would be paralyzing to treat every belief as equally uncertain at every moment. Survivorship bias is invisible by construction -- you cannot see what is not there. Publication bias is the rational response to the incentive structures we have built. P-hacking is the unconscious consequence of analytical flexibility. HARKing is the natural tendency to impose narrative on data.

None of these are moral failures. All of them are epistemic failures. The difference is crucial. You do not solve epistemic failures with willpower or good intentions. You solve them with **structure** -- with pre-registration, blinding, replication, open data, adversarial review, and the institutional courage to publish null results, admit error, and reward accuracy over impact.

Feynman was right. You are the easiest person to fool. The discipline required not to fool yourself is not a personality trait. It is a set of practices, a culture of verification, a commitment to methods that constrain your own freedom in the service of getting closer to truth. It is uncomfortable. It is slow. It is the only thing that works.
