# The Data Mining Process: Methodologies and Frameworks
*—From KDD to MLOps: how the discipline learned to structure its own work—*

## Introduction

Data mining is often caricatured as the act of "running an algorithm on a dataset." Anyone who has actually delivered a data mining project knows this caricature hides the real labor: framing a business question, locating the right data, cleaning it until it is fit for purpose, choosing a modeling approach, validating that the model generalizes, and finally convincing a skeptical stakeholder to deploy it into a production workflow where it will either create value or decay into shelfware. The algorithm is perhaps ten percent of the story. The rest is process.

This document surveys the process frameworks that the field developed, beginning with the academic KDD pipeline of the mid-1990s and tracing the lineage through CRISP-DM, SEMMA, ASUM-DM, TDSP, and into the contemporary MLOps movement. Each framework emerged in response to a specific pain point in the practice of its day, and each has characteristic blind spots. Understanding why a framework appeared, and why it eventually stopped being enough, is the most reliable way to choose sensibly among them in a new project.

## The KDD Process (Fayyad, Piatetsky-Shapiro, Smyth, 1996)

The first widely cited process description of data mining appears in Usama Fayyad, Gregory Piatetsky-Shapiro, and Padhraic Smyth's 1996 papers, most notably "From Data Mining to Knowledge Discovery in Databases" in *AI Magazine* and the edited volume *Advances in Knowledge Discovery and Data Mining*. The authors were careful to distinguish "knowledge discovery in databases" (KDD) as the overarching process from "data mining" as one step within it—a distinction the broader community promptly collapsed.

The canonical KDD pipeline has five steps, sitting between raw data on one end and actionable knowledge on the other.

1. **Selection.** Given a problem and a universe of available data, choose the target dataset: which tables, which rows, which columns, which time windows are in scope. The output is a well-defined extract.
2. **Preprocessing.** Handle missing values, reconcile duplicates, harmonize units, remove or flag outliers, and address noise. This step produces "clean" data that can be trusted by downstream algorithms.
3. **Transformation.** Reduce and project the data into a form suitable for the mining task. This includes dimensionality reduction, feature construction, discretization, normalization, and encoding of categorical variables.
4. **Data mining.** Apply the actual algorithm—classification, regression, clustering, association rule mining, sequence analysis, anomaly detection—to discover patterns.
5. **Interpretation/evaluation.** Turn patterns into knowledge: visualize, test against held-out data, check for plausibility, consult domain experts, and assess whether the findings are actionable. Fayyad et al. explicitly made this a step in the pipeline rather than an afterthought.

KDD was a research framework. Its strengths are its conceptual clarity and its insistence that mining sits in a broader discovery loop; its weakness, visible within a few years, is that it says almost nothing about how a project begins or ends. It starts with data already in hand and stops at "knowledge"—leaving unspoken the business framing on one side and the deployment into a running system on the other. Industry needed something with bookends.

## CRISP-DM (1996–1999)

The bookends arrived with CRISP-DM, the Cross-Industry Standard Process for Data Mining. Work began in 1996 as a European Commission ESPRIT project led by an industry consortium: DaimlerChrysler (then Daimler-Benz), the statistical software vendor SPSS (at the time marketing its Clementine toolkit), the database and hardware company NCR, and the Dutch insurer OHRA. The version 1.0 reference model and user guide were published in 1999 and remain, astonishingly, the most widely cited industrial data mining methodology a quarter century later, despite no official revision since 2000.

CRISP-DM organizes work into six phases connected by a non-linear flow, explicitly drawn with arrows that allow backtracking between adjacent phases and an outer loop returning from deployment to business understanding.

1. **Business understanding.** Translate organizational objectives into data mining goals, assess resources and constraints, define success criteria, and produce a project plan. Without this phase, teams build models that answer technically interesting but commercially irrelevant questions.
2. **Data understanding.** Collect initial data, describe it, explore it with summary statistics and visualizations, and verify its quality. The outputs are a data description report and a first inventory of quality problems.
3. **Data preparation.** Select, clean, construct, integrate, and format the data for modeling. CRISP-DM assumes this phase dominates elapsed time on most projects, and it includes explicit tasks for constructing derived attributes and generating records.
4. **Modeling.** Select modeling techniques, design test procedures, build models, and assess them. Multiple models are expected. This is the phase most people think of as "data mining."
5. **Evaluation.** Evaluate the model against business success criteria—not merely against statistical metrics—review the process for any missed opportunities or defects, and decide whether to deploy, iterate, or abandon.
6. **Deployment.** Plan deployment, plan monitoring and maintenance, produce a final report, and conduct a project review. CRISP-DM explicitly anticipated that models would need to be re-trained and re-delivered, a view often lost in later romanticizations of "the notebook."

CRISP-DM's genius was structural. By framing the work as a cycle beginning and ending with business concerns, and by giving data preparation equal billing with modeling, it corrected two failure modes that had plagued 1990s projects: technically competent solutions to the wrong problem, and technically competent solutions to the right problem that could not be put into production. Its weakness is the corresponding strength: it is prescriptive about ordering and deliverables, and its document-heavy style does not map cleanly onto modern iterative, agile, or notebook-driven workflows. There have been periodic attempts to refresh it—including a CRISP-DM 2.0 special interest group convened in 2006—but none produced an authoritative successor, and the 1999 guide remains the reference.

## SEMMA (SAS Institute)

While CRISP-DM was being assembled by a cross-vendor consortium, SAS Institute promulgated its own five-step mnemonic for users of SAS Enterprise Miner: **Sample, Explore, Modify, Model, Assess**. SEMMA was designed as a tool-centric workflow and has always been more narrowly scoped than CRISP-DM.

1. **Sample.** Draw a statistically representative subset of the data large enough to contain significant information yet small enough to manipulate quickly.
2. **Explore.** Search the sample for anticipated and unanticipated relationships using visualization and statistical summaries.
3. **Modify.** Create, select, and transform variables; handle outliers and missing data; prepare the data for modeling.
4. **Model.** Apply modeling techniques ranging from classical regression to neural networks and decision trees.
5. **Assess.** Evaluate the usefulness and reliability of the models by comparing them across holdout samples and business criteria.

SEMMA is an excellent description of what a statistician does inside a mining toolkit once the business problem and the data extract are already settled. Its official SAS documentation is careful to describe SEMMA as a methodology for the analytical workflow, not the entire project—business understanding and deployment are considered out of scope. In practice, SEMMA partisans have sometimes presented it as a rival to CRISP-DM, but the frameworks do not compete on equal ground: SEMMA covers CRISP-DM's data understanding, data preparation, modeling, and evaluation steps; it deliberately omits the bookends. Where CRISP-DM is intended to be tool-neutral, SEMMA was born of and remains tied to a single vendor's product family.

## ASUM-DM (IBM, 2015)

By the early 2010s, CRISP-DM's age was showing. Projects now sat inside formal implementation programs, included infrastructure provisioning and operational support, and needed to interoperate with project-management methodologies like PMI and agile. In 2015 IBM released **ASUM-DM**—Analytics Solutions Unified Method for Data Mining—as part of its broader ASUM family. ASUM-DM preserved CRISP-DM's six-phase conceptual spine but wrapped it in templates for infrastructure setup, operations handover, and organizational change management, and re-ordered certain tasks to accommodate agile iterations. It made the deployment phase substantially heavier and added explicit tracks for non-technical work such as sponsor management and benefits realization. ASUM-DM remains primarily an IBM-consulting artifact and has never had CRISP-DM's cross-industry reach, but it is representative of a larger industry move: recognizing that a data mining project is an IT project plus a change-management project plus an analytics project, and that the analytics part is the smallest of the three.

## TDSP (Microsoft, 2016)

Microsoft's **Team Data Science Process**, introduced around 2016, was the first widely adopted methodology designed explicitly for teams working in version-controlled, cloud-native environments. TDSP identifies five lifecycle phases—business understanding, data acquisition and understanding, modeling, deployment, and customer acceptance—and layers on top a standardized project structure (a prescribed Git repository layout), role definitions (solution architect, project lead, data scientist, project manager), and a catalog of document templates. It integrates explicitly with Azure Machine Learning and DevOps tooling, and it anticipates that multiple data scientists will be working concurrently in branches, running experiments that must be reproducible by teammates.

Compared with CRISP-DM, TDSP is less a conceptual framework and more an opinionated scaffold. It assumes git, it assumes notebooks, it assumes cloud compute, and it assumes a team. Where it shines is in the collaboration problem CRISP-DM barely acknowledged; where it is weaker is in the early, exploratory, poorly-scoped projects where imposing a Git structure from day one adds friction without benefit.

## Data Preparation as the Bulk of the Work

A persistent folklore claim is that data scientists spend "eighty percent of their time cleaning data." The figure is surprisingly hard to source. It appears in a 2014 *New York Times* article by Steve Lohr, "For Big-Data Scientists, 'Janitor Work' Is Key Hurdle to Insights," citing interviews with practitioners. Subsequent CrowdFlower/Figure Eight "State of Data Science" surveys (2016–2018) reported similar figures—typically sixty to eighty percent—derived from practitioner self-reports. Academic studies using instrumented workflows have found wider variance: some exploratory projects spend more than ninety percent on preparation; some maintenance projects on stable pipelines spend less than twenty. The eighty percent number is thus best read as an order-of-magnitude claim rather than a measurement: preparation is usually the largest single category of effort, often by a wide margin, and underestimating it is the single most common source of schedule overruns in mining projects. Both KDD and CRISP-DM baked this assumption into their structure, and both deserve credit for it.

## Feature Engineering as Craft

Within the preparation phase lives feature engineering, the construction of derived variables that make patterns visible to downstream algorithms. In the era of linear models, decision trees, and gradient-boosted ensembles, feature engineering was arguably the decisive activity: a team that knew its domain and constructed the right ratios, lag variables, interaction terms, target encodings, and windowed aggregates routinely outperformed a team with fancier algorithms and naive inputs. The Kaggle competition community codified many of these tricks into a practitioner literature during the 2010s.

The deep learning revolution narrowed the gap by shifting representation learning into the model itself: convolutional networks learn hierarchical image features, transformers learn contextual text features, and end-to-end training in principle eliminates the handcrafted layer. In practice the picture is mixed. For tabular data—the overwhelming majority of enterprise mining work—hand-crafted features remain competitive or superior, and frameworks such as XGBoost and LightGBM continue to dominate benchmarks. For unstructured data the learned representation usually wins. Contemporary practice treats feature engineering as a spectrum from fully manual to fully learned, with automated feature engineering tools (Featuretools, tsfresh) and foundation-model embeddings occupying the middle.

## Evaluation Protocols

Evaluation is where projects most often fool themselves. The simplest protocol—train on part of the data, test on a held-out remainder—already hides traps: if the split is random on temporally ordered data, tomorrow's information can leak into yesterday's training set; if rows are not independent (clustered patients, repeat customers), random splits underestimate generalization error. *k*-fold cross-validation, in which the data is partitioned into *k* folds and each is used once as a test set, gives more stable estimates at *k* times the compute, but inherits the same leakage risks when applied naively.

For time-series and event-stream data the correct protocol is a **temporal split**, often implemented as expanding or rolling windows so that every evaluation mimics deployment: predict the future from the past, never the reverse. Leakage—allowing future, target-correlated, or held-out information to reach the model during training—is the single most common cause of models that look brilliant in the lab and fail in production. A further hazard is overfitting to the test set through iterated tuning: each time a modeler looks at test-set performance and adjusts hyperparameters, a small amount of information leaks from the test set into the model, and after enough iterations the test set ceases to be an honest estimate of generalization. The customary defense is a three-way split (train, validation, test) with the test set touched only once, at the end.

## The Reproducibility Crisis

By the late 2010s the machine learning community was grappling with its own version of the reproducibility crisis that had hit psychology and biomedicine. At NeurIPS 2018 the conference introduced a reproducibility program that asked authors to complete a checklist covering data, code, hyperparameters, compute environment, and evaluation protocol. Joelle Pineau's team published the **Machine Learning Reproducibility Checklist**, which was subsequently adopted in various forms by NeurIPS, ICML, AAAI, and several journals. The checklist foregrounds documentation: a clear description of the dataset and its splits, the full hyperparameter configuration used, the random seeds, the number of runs, the compute environment, and explicit reporting of variance rather than only point estimates of accuracy. In parallel, the "papers with code" movement pressured authors to release runnable artifacts alongside publications. None of this made data mining fully reproducible, but it raised the baseline significantly and made failures to reproduce visible rather than silent.

## MLOps as Successor

The final twist in this lineage is MLOps—the application of DevOps disciplines to machine learning systems—which emerged in the late 2010s and took its canonical shape in Google's 2015 paper "Hidden Technical Debt in Machine Learning Systems" and subsequent practitioner writing. MLOps accepts that a deployed model is not a project output but a living service whose inputs drift, whose upstream dependencies change, and whose performance decays. It prescribes continuous integration of data and code, continuous training on refreshed data, continuous monitoring of predictions against ground truth as it arrives, automated rollback on degradation, and feature stores that serve the same transformations to both training and serving code. Where CRISP-DM's "deployment" phase was one of six and often compressed into a handoff document, MLOps makes deployment and monitoring the center of gravity. A well-run MLOps practice still contains a CRISP-DM cycle inside it—someone still has to understand the business, the data, and the model—but the cycle runs continuously and is instrumented end to end.

## Conclusion

No single framework has proved sufficient across the full range of data mining work. KDD gave the field a vocabulary. CRISP-DM gave it a project structure that still works for individual engagements. SEMMA codified the analytical core. ASUM-DM and TDSP adapted the vocabulary to enterprise and team realities. MLOps acknowledged that models live in production and must be cared for like any other running system. The mature practitioner reads all of these as overlapping lenses on a single underlying reality: data mining is an iterative sociotechnical process whose success depends at least as much on problem framing, data plumbing, validation discipline, and operational handover as on any algorithm. The frameworks do not disagree about this; they disagree only about which slice of it is most urgent to standardize.

## Study Guide — Process & Methodology

### Frameworks

- **KDD** (Fayyad 1996).
- **CRISP-DM** (1996-2000, still dominant).
- **SEMMA** (SAS).
- **TDSP** (Microsoft).
- **MLOps** (Google 2015, now universal).

## DIY — Run one CRISP-DM cycle

Pick a small problem. Walk through all six phases
(business understanding, data understanding, prep,
modeling, evaluation, deployment) in one week.

## TRY — Set up MLflow

MLflow tracks experiments. Use it on your next ML
project. Experience the difference logged vs unlogged.
