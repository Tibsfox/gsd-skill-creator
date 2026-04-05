# Module 4: Integrity and Reproducibility

**Word Count Target:** 10,000–15,000 words
**Model Assignment:** exec-c (Gamma Executor)
**Dependencies:** Module 1 (Foundations and Epistemology), Module 2 (Core Mechanics), Module 3 (History and Social Dimensions)
**College Departments:** Research Ethics, Metascience, Statistics, Library Science

---

## Learning Objectives

By the end of this module, students will be able to:

1. **Analyze** the structural causes of the replication crisis — publication bias, p-hacking, HARKing, publish-or-perish incentives, and insufficient documentation — and explain how they interact to distort the published literature.
2. **Evaluate** the empirical evidence for the replication crisis across psychology, medicine, and economics, using specific data sources and sample sizes.
3. **Distinguish** between open science practices — preregistration, open data, open code, registered reports, preprint servers, and StatCheck — and assess the specific failure mode each is designed to address.
4. **Trace** Jerome Ravetz's 1971 prediction of quality-control breakdown in science and assess the degree to which subsequent events confirmed or refined his analysis.
5. **Synthesize** the GSD through-line: explain how the replication crisis maps to systems without CAPCOM gates, and how GSD's commit-everything approach provides a structural parallel to open-science reform.

---

## Key Terms

**Replication crisis** | **Replication** | **Exact replication** | **Conceptual replication** | **Publication bias** | **File-drawer problem** | **p-hacking** | **HARKing** | **Researcher degrees of freedom** | **Questionable research practices** | **Preregistration** | **Open data** | **Open code** | **Registered report** | **Preprint** | **StatCheck** | **Metascience** | **Publish-or-perish** | **Statistical power** | **Positive predictive value** | **Effect size inflation** | **Forest plot** | **Funnel plot asymmetry** | **Robustness check**

---

## 1. Introduction: When the Loop Breaks

The operational loop described in Module 2 is a machine for producing reliable knowledge — provided it runs correctly. The loop depends on a set of structural conditions: that observations are recorded and reported honestly, that hypotheses are tested before conclusions are drawn, that experiments are designed to detect the effect and not merely confirm the hypothesis, that analyses are conducted as planned rather than as needed to produce significant results, and that the published record accurately represents what was done and what was found.

When these conditions fail — and they can fail in ways that are individually rational for scientists even when they are collectively destructive for science — the output of the loop is no longer reliable. The published literature fills with findings that cannot be replicated. The body of knowledge that practitioners rely on becomes unreliable. The scientific enterprise loses credibility.

This is the **replication crisis**: the empirical finding, documented across psychology, medicine, economics, and other fields starting in the 2000s and accelerating in the 2010s, that a substantial fraction of published scientific findings cannot be reproduced when independent investigators attempt to do so under the same conditions.

This module examines the replication crisis in depth. Section 2 reviews the empirical evidence with specific numbers and sources. Section 3 analyzes the structural causes — the incentive structures and methodological practices that produce systematic bias in the published record. Section 4 examines Jerome Ravetz's remarkable 1971 prediction and how subsequent events bore it out. Section 5 surveys the open science reform movement and its specific responses to each identified failure mode. Section 6 draws the GSD through-line.

---

## 2. The Empirical Evidence

### 2.1 The Reproducibility Project: Psychology (2015)

The most widely cited empirical study of the replication crisis is the Reproducibility Project: Psychology, coordinated by the Open Science Collaboration and published in *Science* in 2015 [Open Science Collaboration, 2015].

The study attempted to replicate 100 published experiments from three high-impact psychology journals (*Journal of Personality and Social Psychology*, *Journal of Experimental Psychology: Learning, Memory, and Cognition*, and *Psychological Science*). Replication studies were conducted by independent researchers following the original protocols as closely as possible.

**Results:**

- 97 of the 100 original studies had found statistically significant effects (p < 0.05).
- **36 of the 100 replication attempts produced statistically significant effects (p < 0.05)** — a replication rate of 36%. [SC-03: source = Open Science Collaboration, 2015, n = 100 studies]
- The mean effect size in replication studies was approximately half the mean effect size in original studies.
- Subjective replication success (assessed by original authors) was higher — about 39% — but still well below 100%.
- Social psychology replicated at a lower rate than cognitive psychology (25% vs. 53%).

The study was not a final verdict on the state of psychology. Critics noted that replication conditions were not always identical to original conditions, that some failed replications may reflect genuine moderating effects rather than original-study error, and that the sample of 100 studies was not a random sample of all psychological research. These are legitimate caveats. But the magnitude of the gap — from 97% original significance to 36% replication significance — was impossible to dismiss as measurement noise.

The Reproducibility Project was not the first such analysis. Failures to replicate had been documented in social psychology, priming research, and other subfields for years before 2015. What the Project did was provide systematic, pre-registered evidence at a scale that could not be dismissed as anecdote.

### 2.2 The Nature Survey: "1,500 Scientists Lift the Lid on Reproducibility" (2016)

In 2016, *Nature* published results from a survey of 1,576 scientists across biology, chemistry, physics, medicine, earth and environmental sciences, and other fields [Baker, 2016].

**Key results:**

- **More than 70% of researchers had tried and failed to reproduce another scientist's experiment.** [SC-03: source = Baker, 2016, n = 1,576 researchers]
- More than 50% had failed to reproduce their own experiments.
- 52% agreed there was a "significant" replication crisis; 38% said there was a "slight" crisis.
- Only 3% said there was no crisis.
- When asked what contributed to the crisis, the most frequently cited factors were: selective reporting, pressure to publish, poor statistical power, low raw data availability, and insufficient replication in methodology sections.
- The crisis was perceived as more severe in certain fields (psychology, medicine, chemistry) than in others (physics, mathematics).

The survey is self-reported and subject to social desirability bias, but its scale (1,576 respondents) and breadth (multiple disciplines) make it one of the most comprehensive cross-field assessments available. The fact that more than 50% of scientists reported failing to reproduce their own results is particularly striking: this is not a complaint about other people's work but a frank admission about the instability of one's own.

### 2.3 The Federal Reserve Economics Replication Study (2015)

Economics faced its own version of the replication crisis. A systematic study by researchers at the Federal Reserve Bank of Minneapolis (Chang and Li, 2015) attempted to replicate 67 published macroeconomic studies using data and code from the original authors.

**Results:**

- **49 of 59 studies with sufficient data available could not be fully replicated.** [SC-03: source = Chang and Li, 2015, Federal Reserve Bank of Minneapolis, n = 67 published macroeconomic studies, 59 with usable data]
- Only 8 of 59 studies (approximately 14%) could be replicated in full.
- The most common obstacle was missing or insufficiently documented data and code.

The economics result illustrates a different dimension of the replication crisis than the psychology result. In psychology, the primary failure was that effects were too small or too variable to survive independent replication. In economics, the primary failure was documentation: original studies did not provide sufficient materials for replication to even be attempted. This is the **transparency** dimension of the crisis, distinct from but related to the statistical dimension.

Economics is not unusual in this respect. A 2014 study by Iqbal et al. examined 268 randomized controlled trials in high-impact medical journals and found that only 37% provided raw data available to reviewers. A 2012 study of computational biology found that many published computational results could not be reproduced because the code and data were unavailable.

### 2.4 Fanelli (2010): The Improbably High Positive Rate

Daniele Fanelli's 2010 meta-analysis [Fanelli, 2010] examined 4,656 papers across all scientific disciplines published between 1990 and 2007 and assessed the proportion that reported a fully positive result — i.e., results that supported the tested hypothesis.

**Results:**

- **91.5% of papers across all fields reported positive results** — i.e., confirmation of the tested hypothesis. [SC-03: source = Fanelli, 2010, n = 4,656 papers, 1990–2007]
- The positive rate was highest in the social sciences (including psychology) and lowest in the physical sciences.
- The positive rate increased over time: papers published in 2007 were more likely to report positive results than papers published in 1990.

A 91.5% positive rate across all fields is implausible on scientific grounds. No field tests only correct hypotheses. Even in a well-functioning research system, a significant fraction of tested hypotheses should be false — that is, the operational loop should generate both positive and negative results, and both should appear in the published record.

The most parsimonious explanation for a 91.5% positive rate is systematic suppression of negative results: through the file-drawer problem (studies with null results are not submitted for publication), through publication bias (journals are less likely to accept null results even when submitted), through selective reporting (studies with mixed results are reported in ways that emphasize positive findings), and through p-hacking (analyses are adjusted until significance is achieved).

Fanelli noted that the rising positive rate over time could reflect genuine improvements in experimental design and hypothesis selection — better science producing more reliable positive results. But the magnitude of the increase, and its concentration in soft sciences rather than hard sciences, is more consistent with a systematic increase in selective reporting practices than with genuine methodological improvement.

---

## 3. Structural Causes

### 3.1 Publication Bias and the File-Drawer Problem

**Publication bias** is the systematic tendency for positive results to be published at higher rates than negative or null results. It operates at multiple stages:

- **Investigator stage:** Researchers may not write up null results, expecting they will not be publishable and not wishing to invest the time.
- **Submission stage:** Studies with null results are submitted for publication less frequently than studies with positive results.
- **Review stage:** Editors and reviewers apply higher scrutiny to null results, requiring more convincing evidence before accepting them, or reject them on the grounds that "a negative result is not informative" — a logically incorrect position.
- **Revision stage:** Authors under pressure to publish may selectively report the positive analyses from a study with mixed results.

The **file-drawer problem** is the cumulative result of investigator-stage publication bias: a large number of null and negative results that are never published, leaving the published record as an unrepresentative sample of all research conducted. Robert Rosenthal estimated in 1979 that for every published positive result, there could be many unpublished null results in file drawers — enough to nullify the apparent positive if they were aggregated.

The file-drawer problem is not merely a theoretical concern. Funnel plot analysis — a meta-analytic technique that assesses whether the distribution of study results is consistent with the expected pattern from sampling error alone — routinely shows **funnel plot asymmetry** in meta-analyses across many fields. Asymmetric funnel plots indicate that small studies with null results are underrepresented in the published literature, consistent with systematic publication bias.

### 3.2 p-Hacking

**p-Hacking** (also called "fishing," "data dredging," or "the garden of forking paths") refers to the practice of adjusting the analysis of a study — by adding data, dropping data, trying different outcome measures, applying different statistical tests, or including or excluding covariates — until a statistically significant result (p < 0.05) is obtained.

p-Hacking inflates the Type I error rate dramatically. If an investigator has five independent ways to analyze a dataset and reports only the most significant, the probability of obtaining at least one false positive at p < 0.05 is approximately 1 - 0.95⁵ = 0.226, or about 23%. If there are ten analytical paths, the probability exceeds 40%. The nominal false-positive rate of 5% applies only when a single, pre-specified analysis is conducted; it does not apply to the best result from a search over many possible analyses.

p-Hacking is often unconscious. Researchers may genuinely believe they are exploring the data appropriately rather than fishing for significance. The **researcher degrees of freedom** available in a typical study — choices about data collection stopping rules, outlier exclusion, covariate inclusion, outcome variable selection, and statistical test choice — are numerous and individually defensible but collectively provide ample opportunity for false positives to emerge even without deliberate manipulation.

Simmons, Nelson, and Simonsohn (2011) demonstrated this empirically with a study showing that the choice of four specific flexible analytical decisions — sample size stopping rule, inclusion of a covariate, elimination of one of two conditions, and exclusion of outliers — could reliably produce a "significant" result from random data. Each decision seemed individually reasonable; the combination produced systematic inflation.

### 3.3 HARKing: Hypothesizing After Results Are Known

**HARKing** (Hypothesizing After Results are Known) refers to the practice of presenting a hypothesis as having been formulated *before* the study was conducted when it was actually formulated *after* seeing the results. A researcher runs an exploratory analysis, finds an interesting pattern, and then writes the paper as though the analysis was confirmatory — as though the pattern was predicted in advance.

HARKing is particularly insidious because it converts exploratory research into apparent confirmatory research. Exploratory research — looking for patterns without a pre-specified hypothesis — is legitimate and important; it generates candidate hypotheses for future testing. The problem arises when exploratory results are presented as confirmatory without adequate disclosure. The statistical guarantees of confirmatory research (the Type I error rate, the p-value interpretation) do not apply to exploratory analyses, but HARKed results are presented as though they do.

HARKing inflates the apparent predictive power of a field. When research looks more successful than it actually is — because the "predictions" were actually post-hoc rationalizations of observed patterns — confidence in the field's theories is calibrated to a distorted record. Students, practitioners, and policymakers who rely on that record are misled.

Methodologically, HARKing is difficult to detect without independent knowledge of what was actually planned. Preregistration is the primary structural defense against it.

### 3.4 Publish-or-Perish and Incentive Misalignment

The academic incentive structure in most institutions rewards publications — particularly publications in high-impact journals — above most other activities. Hiring, promotion, tenure, and grant funding all depend heavily on publication counts and journal prestige. This creates a systematic incentive to produce publishable results — which, given publication bias, means positive results — by whatever means necessary.

The **publish-or-perish** pressure is not a recent phenomenon; it predates the replication crisis by decades. But its intensity has increased as academic job markets have become more competitive and as research funding has become more concentrated in research-intensive institutions. The structural consequence is that researchers who report honest null results or who invest time in careful replication studies — which rarely produce novel, publishable positive findings — are penalized relative to researchers who report positive results by any means available.

Jerome Ravetz's 1971 analysis anticipated this dynamic with unusual precision (Section 4). The key insight is that the incentive structure does not require individual dishonesty to produce collective distortion. Each individual researcher, making locally rational decisions in a system that rewards publication of positive results, contributes to a collective record that is systematically biased. The bias is a structural consequence, not a moral failing, though moral failures are also present.

### 3.5 Insufficient Documentation

Replication requires that the original study be documented with sufficient precision that an independent investigator can repeat the procedure. This is the **methods section** requirement of scientific publication — the claim, explicit or implicit, that the study can be reproduced.

In practice, methods sections are frequently inadequate for this purpose. Key details may be omitted — exact reagent concentrations, precise wording of survey questions, specifications of computational algorithms, raw data and analysis code. The omissions may reflect journal page limits, reviewer norms that treat extensive methods as unnecessary detail, or unconscious assumptions about what "everyone knows."

The computational sciences face a particular version of this problem: **computational reproducibility**. A published analysis is only reproducible if the code that produced it is available and executable in an environment that matches the original. Version dependencies, operating system differences, random seeds, and hardware dependencies can all prevent reproduction of a computational result even when the code is nominally available.

Insufficient documentation is distinct from the statistical failure modes described above. It is a failure of scientific communication rather than a failure of scientific inference. But it compounds the other problems: a study that cannot be reproduced cannot be detected as a false positive, and the literature remains permanently polluted with unreproducible claims.

---

## 4. Jerome Ravetz and the 1971 Prediction

### 4.1 Scientific Knowledge and Its Social Problems (1971)

Jerome Ravetz (1929–) is a philosopher and historian of science whose 1971 book *Scientific Knowledge and Its Social Problems* [Ravetz, 1971] contained a detailed analysis of the conditions under which scientific quality control could fail. The book was published before the replication crisis was a recognized phenomenon — before the term "replication crisis" existed — and before the specific studies documenting it had been conducted. Yet the structural analysis Ravetz offered maps remarkably well onto the dynamics that would be documented in detail forty years later.

Ravetz's core argument was that science, like all complex social institutions, depends on a set of informal quality-control mechanisms that can be eroded by changes in the scale, funding structure, and social organization of research. He identified several conditions that were already changing in 1971 and that he predicted would lead to quality-control breakdown.

### 4.2 Mass Science and the Industrial Mode

In the pre-war period, Ravetz argued, science was a relatively small community of investigators with strong shared norms, direct personal relationships, and intrinsic motivation. Quality control was maintained by peer reputation: bad science damaged a researcher's standing in a community where everyone knew everyone.

The post-war expansion of science — more researchers, more institutions, more funding, more specialization — disrupted this informal mechanism. Ravetz described the emergence of an **industrial mode** of science production, in which research output is measured by quantity (publications, grants, students trained) rather than quality. In the industrial mode, the incentive is to produce publishable results rapidly rather than to produce reliable results carefully. The peer relationships that sustained informal quality control are replaced by anonymous peer review, which is less effective at detecting subtle forms of questionable practice.

This analysis predates the term "publish-or-perish" by at least a decade but identifies the same structural dynamic.

### 4.3 Shoddy Science and the Fading of Craft

Ravetz introduced a distinction between **craft** science and **shoddy** science. Craft science is characterized by mastery of the methodological tools of a field, internalized commitment to the norms of the community, and the exercise of judgment about when results are reliable enough to be reported. Shoddy science substitutes mechanical compliance with formal procedures for genuine methodological mastery — the researcher goes through the motions of science (conducting experiments, computing p-values, writing methods sections) without the judgment that makes those motions reliable.

Ravetz predicted that the industrial mode of science would produce an increasing proportion of shoddy science: not because researchers were dishonest, but because the incentive structure rewarded formal compliance over genuine quality, and because the training pipeline for new researchers was increasingly focused on productivity rather than craft.

The post-hoc visibility of this prediction is striking. The replication crisis is largely a crisis of shoddy science: researchers mechanically applying statistical procedures, reporting results without adequate documentation, conducting analyses that look formally correct but are substantively misleading.

### 4.4 The Limits of Peer Review

Ravetz also predicted that peer review — the primary formal quality-control mechanism of academic science — would prove inadequate to detect the quality failures produced by the industrial mode. His argument was that peer review works well for detecting outright fraud and obvious error, but poorly for detecting the subtle distortions introduced by selective reporting, p-hacking, and HARKing. A reviewer who sees a clean manuscript with significant results and adequate methods has no way to detect that the significance was achieved by trying multiple analyses, that the methods describe only the analysis that worked, or that the hypothesis in the introduction was formulated after seeing the data.

The subsequent empirical literature has confirmed this prediction. Peer review has proven largely ineffective at detecting the failure modes that drive the replication crisis [Munafo et al., 2017]. The failures are structurally invisible to reviewers who see only the final polished manuscript, not the process that produced it.

### 4.5 Assessment of the Prediction

Ravetz's 1971 analysis was not precise in every detail. He did not predict the specific magnitude of the replication failure, the particular role of the p < 0.05 threshold, or the specific dynamics of digital-age data sharing and computation. His solutions — "critical science" as a form of reflexive quality monitoring — were not the preregistration and open-data solutions that have actually emerged.

But the structural analysis was remarkably accurate: mass expansion of science, industrial production incentives, informal quality-control breakdown, peer review inadequacy, and the systematic production of unreliable results. The replication crisis is not an accident or a moral failure of a generation of researchers; it is a structural consequence of the incentive architecture that Ravetz identified in 1971.

---

## 5. Open Science Responses

### 5.1 Overview

The open science movement is a collection of practices, norms, and institutional reforms designed to address the structural causes of the replication crisis. It is not a single program with a single sponsor; it is a distributed response from many investigators, institutions, and funding bodies who recognized that the existing incentive structure was producing unreliable science and who proposed structural remedies.

The major open science practices are:

1. **Preregistration**
2. **Open data**
3. **Open code** (with StatCheck)
4. **Registered reports**
5. **Preprint servers**
6. **Metascience and systematic replication**

Each practice addresses a specific failure mode. We examine each in turn.

### 5.2 Preregistration

**Preregistration** is the practice of recording, in a time-stamped public repository, the key details of a study — its hypothesis, design, data collection procedure, and analysis plan — *before* data collection begins. The preregistration is linked to the eventual published paper, allowing readers to verify that the reported analysis matches what was planned.

Preregistration directly addresses three failure modes:

1. **HARKing:** If the hypothesis is recorded before the study is run, post-hoc hypothesis generation is visible. Departures from the pre-specified hypothesis must be disclosed and described as exploratory.
2. **p-Hacking:** If the analysis plan is pre-specified, the researcher is committed to running that analysis and cannot adjust it after seeing the data (or must disclose any deviations).
3. **Selective outcome reporting:** If the outcomes of interest are pre-specified, the omission of non-significant outcomes is visible.

Preregistration does not prevent researchers from conducting exploratory analyses; it requires that exploratory analyses be clearly labeled as such. The distinction between pre-registered (confirmatory) and non-pre-registered (exploratory) analyses provides readers with an accurate epistemic map of the evidence: confirmatory analyses carry the statistical guarantees that their p-values imply; exploratory analyses do not and should be treated as hypothesis-generating rather than hypothesis-confirming.

The major preregistration repositories include the Open Science Framework (OSF, osf.io), AsPredicted (aspredicted.org), and ClinicalTrials.gov (for medical research). As of 2020, the number of preregistrations on OSF exceeded 100,000, up from virtually zero in 2012.

### 5.3 Open Data

**Open data** is the practice of making the raw data underlying a published study publicly available, in a format that allows other researchers to replicate the analysis, conduct secondary analyses, and check the data for errors.

Open data addresses the **documentation failure** dimension of the replication crisis. If the raw data are available, a replication attempt is possible even when the original investigators are unavailable or uncooperative. It also enables error detection: several high-profile cases in which published papers were retracted because of data fabrication or error were discovered precisely because the authors had made their data available and careful reviewers found anomalies.

Barriers to open data include concerns about participant privacy (especially for medical and social science data involving sensitive information), competitive disadvantage (releasing data before follow-up analyses are complete), and the effort required to prepare data for public release (documentation, format standardization, metadata). These barriers are real and have driven the development of data-sharing platforms with privacy controls (e.g., ICPSR for social science, UK Biobank for medical data) and data management planning requirements by funders.

The norm shift has been substantial but uneven. Many major funders (including the National Institutes of Health, the UK Research Councils, and the European Commission) now require data management plans and, in some cases, data sharing as a condition of funding. Some journals have adopted data availability statements as a mandatory element of published papers.

### 5.4 Open Code and StatCheck

**Open code** is the practice of making the analysis code (R scripts, Python scripts, Stata do-files, etc.) underlying a published analysis publicly available, alongside the data. Open code enables **computational reproducibility**: the ability to run exactly the analysis that produced the reported results and verify that the code and data produce the reported outputs.

Without open code, even available data may not enable replication: if the analysis involved complex data cleaning, variable construction, or modeling choices, the data alone may not be sufficient for an independent researcher to reproduce the analysis.

**StatCheck** is an automated tool [Epskamp and Nuijten, 2016] that checks published papers for statistical reporting errors: inconsistencies between test statistics, degrees of freedom, and reported p-values. StatCheck was applied to 30,717 papers published between 1985 and 2013, finding that approximately 50% contained at least one statistical reporting inconsistency and approximately 13% contained at least one *major* inconsistency (one that would change the significance conclusion). These errors are not necessarily indicative of fraud — many are transcription errors — but they are indicative of the inadequacy of peer review as a quality-control mechanism for statistical reporting.

StatCheck is particularly significant as an example of how automation can serve quality control in science. It is fast, consistent, and objective — it checks every number in a paper against formal statistical relationships, a task that human reviewers routinely neglect. Its deployment has accelerated the detection and correction of errors in the published literature.

### 5.5 Registered Reports

**Registered reports** are a journal format in which the peer review process is split into two stages:

1. **Stage 1 review:** The research question, background, design, and analysis plan are reviewed before data collection. If approved, the journal issues an **in-principle acceptance** — a commitment to publish the paper regardless of the results, provided the study is conducted as planned.

2. **Stage 2 review:** The completed paper — with results and discussion — is reviewed for fidelity to the registered design and for quality of reporting. The results themselves are not a criterion for acceptance.

Registered reports directly address publication bias: the in-principle acceptance commits the journal to publish null results if the study was conducted as planned. They also address HARKing and p-hacking by requiring a pre-specified design before data collection.

The registered reports format was introduced by *Cortex* in 2013 and has since been adopted by more than 300 journals. Early analyses of registered reports suggest that they produce null results at substantially higher rates than conventional articles (approximately 44% vs. 11% in one comparison), consistent with the hypothesis that conventional publication practices suppress null results.

### 5.6 Preprint Servers

A **preprint** is a version of a paper made publicly available before formal peer review. The preprint server *arXiv* (arxiv.org) has been the primary venue for preprints in physics, mathematics, and computer science since its founding in 1991. In biology and medicine, the bioRxiv and medRxiv servers have grown rapidly since 2013 and 2019 respectively; in psychology and social science, PsyArXiv (launched 2016) has become a major venue.

Preprint servers address the replication crisis in several ways:

1. **Transparency:** Research results are publicly available before peer review, allowing the community to engage with findings before the gatekeeping stage that can suppress null results.
2. **Speed:** Results are available in weeks rather than months or years, enabling faster detection of problems and faster accumulation of independent replication attempts.
3. **Completeness:** Preprints can include null results and negative findings that might not survive the conventional publication process.

Preprints carry risks as well as benefits. Without peer review, they may contain errors that the peer review process would have caught. High-profile cases in which preprints with serious errors were widely circulated — most notoriously during the COVID-19 pandemic — have highlighted the dangers of treating unreviewed preprints as equivalent to peer-reviewed publications.

The appropriate use of preprints is as preliminary scientific communication: useful for community engagement and early feedback, to be treated with appropriate caution and updated when the reviewed version is available.

### 5.7 Metascience

**Metascience** — the scientific study of science itself — has emerged as a coherent research program, studying how scientific practices affect scientific outputs. The Reproducibility Project is an example; so are systematic meta-analyses of publication bias, analyses of citation patterns and their relationship to replication success, and studies of how peer review processes affect the quality of published research.

Metascience provides the empirical foundation for the open science reform movement. Rather than arguing for reform on philosophical grounds, metascience provides data: this is how often results replicate; this is how much publication bias inflates effect sizes; this is how preregistration changes the proportion of null results published. The reform movement is itself an application of the scientific method to the problem of scientific quality.

---

## 6. The Landscape by Field

### 6.1 Psychology

Psychology was the field most visibly implicated in the replication crisis, largely because the Reproducibility Project focused on it and because several high-profile failures — the "social priming" literature, ego depletion, embodied cognition studies — attracted substantial attention.

The 36% replication rate [OSC, 2015] is an average; social psychology replicated at approximately 25%, while cognitive psychology replicated at approximately 53%. The difference likely reflects differences in the nature of the phenomena: cognitive phenomena (response times, memory capacities, perceptual thresholds) are more stable and less context-dependent than social psychological phenomena (behavior in social contexts, which is inherently more sensitive to cultural and situational variation).

Psychology has been at the forefront of open science adoption: the journals of the Association for Psychological Science have introduced badges for open data, open materials, and preregistration; the Center for Open Science has partnered with dozens of psychology journals; and many psychology training programs now include open science practices in their curricula.

### 6.2 Medicine and Clinical Research

Medicine's replication crisis predates the term. John Ioannidis's 2005 paper "Why Most Published Research Findings Are False" was focused primarily on medical research and attracted enormous attention within the field. The specific failure modes in medicine include:

- **HARKing in clinical trials:** Changing primary outcomes after seeing data is relatively common in registered trials; analyses of ClinicalTrials.gov registrations have found substantial rates of outcome switching.
- **Publication bias in clinical trials:** A 2012 study found that approximately half of clinical trials registered on ClinicalTrials.gov reported results; the unreported trials disproportionately had null or negative results.
- **Ghost authorship and industry influence:** Pharmaceutical industry funding of clinical trials has been associated with higher rates of positive results and selective reporting.

The clinical trial has been the gold standard of medical evidence precisely because it was designed, from its introduction in the 1940s, to address the failure modes of uncontrolled observation. But the clinical trial infrastructure is itself vulnerable to the same structural pressures that affect academic research.

### 6.3 Economics

The Federal Reserve study [Chang and Li, 2015] documented a primarily documentation-based crisis: results could not be reproduced because data and code were unavailable, not necessarily because the original results were statistically fragile.

The economics replication crisis also has a statistical dimension. A 2016 analysis of registered RCTs in development economics found substantial evidence of p-hacking: the distribution of p-values just below 0.05 was anomalously high, consistent with selective reporting and analytical adjustment to achieve significance.

Economics responded to the replication crisis somewhat later than psychology, but the American Economic Association launched the AEA RCT Registry in 2013, and several top journals now require pre-analysis plans for RCT publications.

### 6.4 Neuroscience

Neuroimaging research faced a specific version of the replication crisis: the problem of **voxel-wise multiple comparisons**. An fMRI study analyzes tens of thousands of voxels simultaneously; without appropriate correction for multiple comparisons, the false-positive rate is extremely high. Eklund et al. (2016) demonstrated that standard cluster-inference methods used in fMRI research could produce false-positive rates up to 70% under some conditions, calling into question decades of neuroimaging results.

The neuroscience case illustrates that the replication crisis is not limited to a few bad actors in a few fields. It reflects the interaction of complex, high-dimensional data with analytical procedures that were developed before the consequences of multiple comparisons were fully understood.

---

## 7. What Reproducibility Actually Requires

### 7.1 Types of Replication

Not all replications are the same. A useful taxonomy distinguishes:

- **Exact replication (direct replication):** Running the original study as close to identically as possible — same materials, procedures, population, and analysis plan — to assess whether the original result is robust.
- **Conceptual replication:** Testing the same hypothesis with different operationalizations, different populations, or different designs, to assess the generalizability of the finding.

Both types are valuable and serve different purposes. Exact replication tests whether a specific result is stable. Conceptual replication tests whether the underlying construct is real and robust across contexts. A finding that survives many conceptual replications but not exact replication may reflect a genuine phenomenon that is sensitive to context; a finding that survives exact replication but not conceptual replication may reflect a methodological artifact of the original design.

The distinction matters because some critics of the Reproducibility Project argued that exact replication was an inadequate test — that genuine effects might not replicate exactly if conditions were not precisely matched. This is a legitimate methodological point, but it must be applied carefully: invoking moderating effects post-hoc to explain every replication failure is itself a form of HARKing.

### 7.2 The FAIR Principles

**FAIR** — Findable, Accessible, Interoperable, Reusable — is a set of data management principles developed by a working group of researchers, funders, and data managers and published in *Scientific Data* in 2016. FAIR provides a framework for making research data and code useful not just to the original investigators but to future researchers conducting replications, meta-analyses, and secondary analyses.

The FAIR principles do not prescribe specific technical solutions; they prescribe properties that data should have. Data should be **findable** (uniquely identified and registered in a searchable resource), **accessible** (retrievable under clearly specified access conditions), **interoperable** (using standard formats and vocabularies), and **reusable** (with sufficient metadata to enable understanding and reuse by others).

FAIR has been adopted by the European Commission and several major funding agencies as a standard for data management requirements. It represents the infrastructure layer of the open science movement: not a statement of norms but a technical specification for how norms can be operationalized.

### 7.3 The Reproducibility Stack

Full reproducibility requires what can be called a **reproducibility stack** — a complete record of every element needed to repeat the original study:

1. **Hypothesis and design** (preregistration)
2. **Raw data** (open data)
3. **Analysis code** (open code)
4. **Software environment** (container images, version-locked dependency files)
5. **Methods documentation** (sufficient detail in the published paper)
6. **Reporting standards** (use of standardized checklists — CONSORT for clinical trials, ARRIVE for animal studies, STROBE for observational studies)

Most published research satisfies only some elements of this stack. The field has been moving toward more complete stacks, but the movement is uneven across disciplines and institutions.

---

## 8. Reform in Practice: Challenges and Limits

### 8.1 Preregistration Does Not Solve Everything

Preregistration is the most-discussed open science reform, but it is not a panacea. Several limitations deserve emphasis:

- **Preregistration of exploratory research:** Many legitimate investigations begin without a clear prior hypothesis. Requiring preregistration before any data can be collected would prohibit exploratory research — a significant constraint on science's ability to follow unexpected findings.
- **Preregistration without compliance:** Preregistrations can be written after the fact (postdiction masquerading as prediction), can be too vague to actually constrain the analysis, or can be deparated from without adequate disclosure. The mere existence of a preregistration does not guarantee its integrity.
- **Multiple preregistrations:** A researcher who submits many preregistrations and pursues only the ones that produce significant results is engaging in p-hacking at the study level rather than the analysis level.

These limitations do not argue against preregistration; they argue for realistic expectations about what it can achieve. Preregistration is a structural improvement that reduces the ease of certain questionable practices. It does not make those practices impossible and does not address all failure modes.

### 8.2 Open Data Without Context

Raw data without adequate documentation is of limited value. An open dataset that lacks a codebook, that uses non-standard variable names, that has not been validated against the original paper's analysis, and that includes known quirks without disclosure does not enable replication. The preparation of genuinely usable open data requires effort, skill, and norms about what constitutes adequate documentation — effort and norms that are still developing across most fields.

### 8.3 The Incentive Problem Persists

The most fundamental challenge facing open science reform is that it asks individual researchers to invest effort in practices (careful documentation, data sharing, null-result publication) that provide collective benefits but few individual rewards under the existing incentive structure. Publishing in high-impact journals still requires positive results. Tenure committees still count publications and grant funding, not preregistrations and shared datasets.

The most effective interventions for changing scientific norms have historically operated at the institutional level — funders requiring data sharing, journals requiring preregistration, departments rewarding open science contributions in hiring and promotion decisions. These changes are occurring but slowly, and their distribution across institutions and countries is uneven.

---

## 9. The Broader Stakes

### 9.1 Science as a Public Good

The replication crisis is not merely a technical problem for specialists. Science informs medical practice, public policy, educational practice, environmental regulation, and many other domains with direct consequences for human welfare. When the published literature is systematically biased — when effect sizes are inflated, when null results are suppressed, when results cannot be reproduced — practitioners who rely on that literature make worse decisions than they would with accurate information.

The stakes are particularly high in medicine, where treatment decisions affect individual patients, and in public policy, where resource allocation decisions affect populations. The history of evidence-based medicine is in part a history of discovering that confident-seeming interventions supported by the published literature turned out, on more careful examination, to be ineffective or harmful — hormone replacement therapy, antidepressant efficacy in mild-to-moderate depression, the effectiveness of various educational interventions, the scope of stereotype threat effects. These revisions are not failures of science; they are science working as it should, eventually correcting itself. But the cost of the correction, in misdirected resources and patient harm, is real.

### 9.2 Public Trust in Science

The replication crisis has received substantial public attention, and its effects on public trust in science are complex. On one hand, the willingness of the scientific community to conduct rigorous self-examination — to pre-register, to attempt replications, to publish null results — is itself evidence of the health of science as an institution. On the other hand, public coverage of the crisis sometimes presents it as evidence that scientists cannot be trusted, conflating the structural problems of specific research subfields with the reliability of established science.

The appropriate public understanding of the replication crisis is neither "science is unreliable" nor "this is a problem that has been solved." It is: science has structural vulnerabilities that have been recognized and are being addressed; the strength of any scientific claim depends on the rigor with which it has been tested and replicated; established scientific consensus (on climate change, evolution, vaccine safety) rests on evidence far more extensive and robust than the typical psychology or social priming study; and citizens and practitioners should be calibrated consumers of scientific evidence rather than passive receivers.

---

## 10. GSD Ecosystem Connection

### 10.1 The Replication Crisis as the Absence of CAPCOM Gates

The structural cause of the replication crisis is a breakdown in quality control: the mechanisms that should catch errors, bias, and unreliable results before they enter the published record are inadequate to the task. Peer review does not catch p-hacking or HARKing. Editors do not have access to the file drawer. Readers cannot independently verify results without raw data and code.

The GSD CAPCOM gate is a structural quality-control mechanism that serves an analogous function in the software development loop. A CAPCOM gate requires evidence — test coverage, integration results, review — before work advances from one phase to the next. Without CAPCOM gates, the equivalent of p-hacking is trivial: mark a feature complete because the happy-path test passes, without asking whether edge cases are handled, whether the integration is correct, or whether the implementation is maintainable. Mark a milestone complete because the visible output looks right, without running the full test suite.

The replication crisis shows, at scale, what happens when quality-control checkpoints are absent or ineffective. Features ship broken. Results enter the literature unvalidated. The cumulative record becomes unreliable. The structural response — preregistration, open data, registered reports — is the equivalent of mandatory CAPCOM gates: structural checkpoints that cannot be bypassed without the bypass being visible.

### 10.2 Commit-Everything as Open Science

The GSD principle of committing everything — every change, every attempted fix, every wave result — is an instantiation of the open science principle. In science, the equivalent is: document everything, make data available, report null results. Both practices are premised on the same insight: the value of a record lies in its completeness and accessibility, not in its curation.

A git log that contains only successful merges tells a distorted story about the development process: it looks like everything worked on the first try, when in fact there were many iterations, dead ends, and revisions. A literature that contains only positive results tells a distorted story about scientific investigation: it looks like every hypothesis that was tested was correct, when in fact the majority were not.

The practice of committing everything — including failed attempts, abandoned approaches, and reverted changes — creates a complete, honest record. It is harder to use and requires more sophisticated tooling to navigate, but it is more reliable as a substrate for building forward. The same is true of a published record that includes null results, failed replications, and revisions.

### 10.3 Preregistration as Wave Planning

The practice of writing a wave plan before executing the wave is structurally analogous to preregistration. The wave plan commits to what will be done, in what order, with what tests and acceptance criteria, before the work begins. It prevents the equivalent of HARKing in development: presenting a post-hoc rationalization of what was actually done as a planned approach.

Wave planning also prevents the equivalent of p-hacking in development: trying many approaches until something passes the tests, then reporting only the successful approach as if it were the first attempt. If the wave plan is public and time-stamped, departures from it are visible. If a different approach was required, the retrospective documents why — creating a record of the iteration that is honest about what was learned.

### 10.4 The Publish-or-Perish Parallel in Software

The incentive structure of publish-or-perish — reward publication frequency over quality — has a parallel in software organizations that reward feature velocity over reliability. A team measured by number of features shipped per sprint faces the same structural incentives as a researcher measured by number of papers published: cut corners on quality, under-invest in testing, ship things that work in demos but fail in edge cases.

The GSD discipline of verification waves — dedicated waves that do nothing but verify, test, and document prior work — is a structural counterweight to feature-velocity pressure, analogous to the role of registered reports and mandatory replication studies in science. It institutionalizes the time and space for quality control rather than leaving it as an afterthought.

---

## 11. Cross-Module Connections

- [Module 1: Foundations and Epistemology] — the epistemological foundations of falsifiability and the problem of induction; the sociology of scientific knowledge (Kuhn, Lakatos) provides context for understanding how communities of investigators can collectively maintain false beliefs.
- [Module 2: Core Mechanics] — the operational loop and its failure modes; the statistical significance discussion in Module 2 provides the conceptual foundation for the p-hacking analysis in this module.
- [Module 3: History and Social Dimensions] — the historical development of peer review, academic incentive structures, and institutional science provides context for why the replication crisis emerged when it did.
- [Module 5: Contemporary and Future Directions] — AI tools for automated hypothesis generation, experiment design, and meta-analysis; the open science infrastructure discussed here provides the data and documentation standards that AI-assisted metascience depends on.

---

## 12. College Department Mappings

| Section | Department |
|---------|-----------|
| 2. Empirical evidence | Metascience, Statistics |
| 3. Structural causes | Research Ethics, Metascience |
| 4. Ravetz prediction | Research Ethics, History of Science |
| 5. Open science responses | Research Methods, Library Science |
| 6. Field landscape | Metascience, Research Methods |
| 7. Reproducibility requirements | Research Methods, Library Science |
| 8. Reform challenges | Research Ethics |
| 9. Broader stakes | Research Ethics, Science Policy |
| 10. GSD ecosystem | Applied Research Methods |

---

## 13. Key Terms Reference

**Replication crisis:** The empirical finding that a substantial fraction of published scientific results cannot be reproduced by independent investigators.

**Replication:** The attempt by independent investigators to reproduce a previously published result.

**Exact replication:** Replication using the same materials, procedures, population, and analysis as the original study.

**Conceptual replication:** Testing the same hypothesis with different operationalizations or contexts.

**Publication bias:** The systematic tendency for positive results to be published at higher rates than null results.

**File-drawer problem:** The accumulation of unpublished null results due to publication bias, biasing the published record.

**p-Hacking:** Adjusting data collection or analysis until p < 0.05 is achieved, inflating the Type I error rate.

**HARKing:** Hypothesizing After Results are Known; presenting post-hoc hypotheses as if they were pre-specified.

**Researcher degrees of freedom:** The many individually defensible analytical choices available in a typical study, which collectively enable false-positive inflation.

**Questionable research practices:** A family of practices — p-hacking, HARKing, selective reporting, insufficient documentation — that distort the published record without constituting outright fraud.

**Preregistration:** Time-stamped public commitment of study design and analysis plan before data collection.

**Open data:** Making raw research data publicly available alongside the published paper.

**Open code:** Making analysis code publicly available to enable computational reproducibility.

**Registered report:** A journal format providing in-principle acceptance before data collection, based on the quality of the study design.

**Preprint:** A version of a paper made publicly available before peer review.

**StatCheck:** Automated tool for detecting statistical reporting errors in published papers.

**Metascience:** The scientific study of scientific practice.

**Publish-or-perish:** The academic incentive structure that rewards publication frequency over quality.

**Statistical power:** The probability of detecting a true effect of a given size.

**Positive predictive value:** The probability that a statistically significant result reflects a true effect.

**Effect size inflation:** The tendency for small studies and selectively reported studies to overestimate the true effect size.

**Forest plot:** A graphical representation of results from multiple studies in a meta-analysis.

**Funnel plot asymmetry:** The distortion in the distribution of study results caused by publication bias.

**Robustness check:** Testing whether a result holds under alternative analytical specifications.

---

## 14. Assessment Questions

1. The Reproducibility Project found that 36% of 100 psychology studies produced significant effects when replicated, compared to 97% of the original studies. Some critics argued this understates the true replication rate because exact conditions were not perfectly reproduced. Evaluate this criticism. What would constitute a compelling rebuttal and what would constitute a compelling defense?

2. Fanelli (2010) found a 91.5% positive rate across 4,656 published papers. A proponent of the status quo argues this reflects improvement in hypothesis quality over time — researchers have gotten better at testing only good hypotheses. Construct the strongest version of this argument and then explain why the evidence does not support it as the primary explanation.

3. Compare preregistration and registered reports as responses to the replication crisis. What specific failure mode does each address? In what circumstances would preregistration be insufficient without a registered report structure?

4. Jerome Ravetz wrote *Scientific Knowledge and Its Social Problems* in 1971, decades before the replication crisis was empirically documented. Identify two specific claims from his analysis that were confirmed by subsequent events and one aspect of the crisis that his analysis did not anticipate.

5. The GSD principle of committing everything — including failed attempts — is described as an analogy to open science's emphasis on publishing null results. Evaluate this analogy. In what ways is it accurate? In what ways does it break down? What would a GSD practice equivalent to preregistration look like in detail?

---

## 15. Sources

Baker, M. (2016). 1,500 scientists lift the lid on reproducibility. *Nature*, 533, 452–454. [n = 1,576 researchers]

Bernard, C. (1865). *An Introduction to the Study of Experimental Medicine*. Paris.

Chang, A.C., and Li, P. (2015). Is economics research replicable? Sixty published papers from thirteen journals say "usually not." Finance and Economics Discussion Series, Federal Reserve Board, Washington, D.C. [n = 67 published macroeconomic studies]

Eklund, A., Nichols, T.E., and Knutsson, H. (2016). Cluster failure: Why fMRI inferences for spatial extent have inflated false-positive rates. *Proceedings of the National Academy of Sciences*, 113(28), 7900–7905.

Epskamp, S., and Nuijten, M.B. (2016). statcheck: Extract statistics from articles and recompute p values. R package version 1.0.1.

Fanelli, D. (2010). "Positive" results increase down the hierarchy of the sciences. *PLOS ONE*, 5(4), e10068. [n = 4,656 papers]

Fisher, R.A. (1935). *The Design of Experiments*. Oliver and Boyd, Edinburgh.

Iqbal, S.A., Wallach, J.D., Khoury, M.J., Schully, S.D., and Ioannidis, J.P.A. (2016). Reproducible research practices and transparency across the biomedical literature. *PLOS Biology*, 14(1), e1002333. [n = 268 RCTs]

Ioannidis, J.P.A. (2005). Why most published research findings are false. *PLOS Medicine*, 2(8), e124.

Kuhn, T.S. (1962). *The Structure of Scientific Revolutions*. University of Chicago Press.

Lakatos, I. (1970). Falsification and the methodology of scientific research programmes. In *Criticism and the Growth of Knowledge*. Cambridge University Press.

Munafo, M.R., Nosek, B.A., Bishop, D.V.M., et al. (2017). A manifesto for reproducible science. *Nature Human Behaviour*, 1(1), 0021.

Open Science Collaboration (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251). [n = 100 studies]

Popper, K.R. (1959). *The Logic of Scientific Discovery*. Hutchinson, London.

Ravetz, J.R. (1971). *Scientific Knowledge and Its Social Problems*. Oxford University Press.

Rosenthal, R. (1979). The "file drawer problem" and tolerance for null results. *Psychological Bulletin*, 86(3), 638–641.

Simmons, J.P., Nelson, L.D., and Simonsohn, U. (2011). False-positive psychology: Undisclosed flexibility in data collection and analysis allows presenting anything as significant. *Psychological Science*, 22(11), 1359–1366.

Wilkinson, M.D., et al. (2016). The FAIR Guiding Principles for scientific data management and stewardship. *Scientific Data*, 3, 160018.

Wikipedia: Replication crisis. en.wikipedia.org/wiki/Replication_crisis

Stanford Encyclopedia of Philosophy: Scientific Method. plato.stanford.edu/entries/scientific-method/
