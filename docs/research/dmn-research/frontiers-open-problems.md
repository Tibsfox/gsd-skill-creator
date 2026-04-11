# Frontiers: Open Problems in Data Mining

*— where a sixty-year-old discipline dissolves into, and is reconstituted by, the age of foundation models —*

## 1. The discipline in 2026: dissolved, or reconstituted?

It is fair to open a forward-looking survey of data mining with an awkward admission. In 2026, it is no longer obvious that "data mining" names a discipline distinct from machine learning, statistics, or — more recently — the application layer of foundation models. The KDD conference still runs, *ACM TKDD* still publishes, and the phrase still means something in enterprise procurement. But the intellectual territory that Usama Fayyad, Gregory Piatetsky-Shapiro, and Padhraic Smyth staked out in the mid-1990s as "Knowledge Discovery in Databases" has been absorbed on three sides: by machine learning (for the modeling), by data engineering (for the pipelines), and, since roughly 2022, by large language models (for the extraction of pattern from text). What remains distinctively "data mining" in 2026 is a specific commitment: *pattern discovery is the end, not the means.* You are not optimizing a loss on a held-out set; you are trying to find something the domain expert did not already know. Everything that follows in this document is framed by that commitment, and by the observation that several of the open problems below are open precisely because the modeling tools now available (transformers, diffusion models, retrieval-augmented generation) are suited to the *means* but not the *end*.

## 2. Mining at the end of structured data: LLMs as universal text miners

The single largest shift in applied data mining since 2020 has been the collapse of the classical "text mining pipeline" — tokenize, tag, parse, extract entities, cluster topics, score sentiment — into a single prompt against a general-purpose language model. Work at NAACL and EMNLP 2023–2025 (Wang et al. 2023 on GPT-NER; Ashok & Lipton 2023 on PromptNER; Wei et al. 2024 on ChatIE) showed that few-shot prompting could match fine-tuned BERT baselines on standard NER benchmarks for high-resource domains, and *exceed* them in low-resource or cross-lingual settings where labeled data was the bottleneck. Topic modeling has seen an analogous shift: BERTopic (Grootendorst 2022) already replaced LDA's word-bag likelihood with sentence-embedding clusters, and more recent work (Pham et al. 2024, "TopicGPT") uses LLMs to directly generate interpretable topic labels and hierarchies. Sentiment analysis, the oldest and flimsiest of the text-mining subtasks, is now essentially solved at the coarse-grained level; what remains hard is aspect-based sentiment in domain-shifted settings, where fine-tuned smaller models still compete with GPT-4-class systems on cost-adjusted metrics.

The consequence for the field is subtle. Traditional text mining used to *be* applied NLP; now applied NLP is a strict subset of prompt engineering plus light orchestration, and the interesting problems have shifted upward. What does it mean to mine a corpus of ten million documents when a single zero-shot pass costs more than the corpus is worth? How do you build reliable extraction pipelines when the underlying model changes every quarter? How do you validate extracted knowledge against ground truth that itself may have been produced by an earlier version of the same model? These questions — evaluation, cost-aware routing, drift under model upgrades, and contamination — are the new text mining. They are not yet well studied.

## 3. Causal inference: the frontier that correlation mining cannot reach

Judea Pearl's long-running critique of machine learning — crystallized in *The Book of Why* (Pearl & Mackenzie 2018) but dating to his 1988 probabilistic reasoning work — is that pattern mining, no matter how sophisticated, sits on the bottom rung of a three-rung ladder: *association, intervention, counterfactual*. Almost all of classical data mining lives on rung one. The causal inference program asks what it would take to climb. The practical answer in 2020s data mining has been three-fold. First, **causal forests** (Wager & Athey 2018; Athey, Tibshirani, Wager 2019), which adapt random forests to estimate heterogeneous treatment effects with honest splitting and valid confidence intervals; the `grf` R package is now standard in applied economics. Second, **Double/Debiased Machine Learning** (Chernozhukov et al. 2018), which provides a Neyman-orthogonal wrapper that lets you plug any ML model into a causal target and still get √n-consistent, asymptotically normal estimates — arguably the most important methodological export from econometrics to data mining this decade. Third, **causal representation learning** (Schölkopf et al. 2021 review), the still-speculative program of learning latent variables that behave as genuine causes rather than statistical artifacts.

The open problem is blunt: most enterprise data mining projects still run on observational data where unmeasured confounding is the norm, and the gap between what causal forests can identify and what stakeholders *want to conclude* remains wide. The field needs accessible diagnostics for when a causal claim is even potentially identifiable, and it needs an honest culture around refusing to answer questions the data cannot answer. Neither is close to solved.

## 4. Interpretability: beyond SHAP, toward mechanism

The 2017 paper by Lundberg and Lee that introduced SHAP, and Ribeiro, Singh & Guestrin's 2016 LIME, essentially defined applied interpretability for the second half of the 2010s. Both are local, post-hoc, additive approximations. Both have been shown to be unstable under input perturbation (Slack et al. 2020), vulnerable to adversarial manipulation (Dimanov et al. 2020), and — most damningly — to disagree with each other on the same prediction in ways no user can arbitrate (Krishna et al. 2022, "The Disagreement Problem in Explainable ML"). The response in 2023–2025 has been a shift toward *mechanistic* interpretability: the Anthropic circuits agenda (Elhage et al. 2022; Olsson et al. 2022 on induction heads; Bricken et al. 2023 on sparse-autoencoder features; the 2024 "Scaling Monosemanticity" paper on Claude 3 Sonnet) treats models as programs to be reverse-engineered rather than surfaces to be approximated. This is a different epistemology. It concedes that for a trillion-parameter model you may not get a *human* explanation, but you may at least get a *mathematical* one.

The open problems are real. Mechanistic interpretability has not been shown to scale to the full behavior of a production model; it remains a research program working on slices (induction, indirect-object identification, refusal circuits). It is unclear whether the features found by sparse autoencoders are the "right" decomposition or merely one valid basis. And the "interpretability tax" — the accuracy or latency cost of demanding interpretable models over black boxes — is still real enough that most deployed systems skip it. Data mining as a discipline has historically been more willing than ML-proper to pay this tax (rule induction and decision trees were its native idiom), and the frontier question is whether mechanistic methods can be adapted back to that tradition.

## 5. Federated, private, and sovereign mining

Federated learning, first named by McMahan et al. in 2017, has matured along two axes: cross-device (millions of phones, each with a handful of records, all unreliable — Google's Gboard is the canonical deployment) and cross-silo (a few institutions, each with a lot of data and high availability — typical of healthcare consortia). The 2020s added three things. **Personalized FL** (Fallah et al. 2020; Dinh et al. 2020) recognized that a global model is often worse than a local one, and developed meta-learned or regularized personalization. **Secure aggregation** (Bonawitz et al. 2017; Bell et al. 2020) made the coordinator blind to individual updates at modest communication cost. And **differential privacy at training time** (Abadi et al. 2016's DP-SGD is still the workhorse) was composed with federation to give end-to-end formal guarantees. Open problems: the utility cost of DP-FL on heterogeneous non-IID clients remains punishing; Byzantine-robust aggregation under realistic threat models is unsettled; and the legal question of whether federated training counts as "processing personal data" under GDPR is, as of 2026, still being litigated rather than decided.

## 6. Streams, drift, and the batch/online gap

Data mining was born batch. The field's canonical algorithms — Apriori, C4.5, k-means — all assume you get to see the data twice. The real world, especially the real world of observability data, clickstreams, and sensor fleets, does not permit this. The streaming literature (Gama, Žliobaitė, Bifet et al. 2014 survey on concept drift; MOA and River as open-source libraries) has produced a credible set of online algorithms, but the gap to modern deep models is enormous. Online learning of a large neural network remains an open problem: catastrophic forgetting is not solved by replay buffers alone, concept drift detection is brittle under covariate shift, and the economics usually favor periodic batch retraining over true online learning. The honest frontier statement is that "streaming ML" is mostly "micro-batch ML with good ops." Closing that gap — either by designing architectures that truly support incremental updates, or by proving that micro-batch is provably optimal under realistic drift — is still open.

## 7. Synthetic data: replacement, complement, or contaminant?

The Synthetic Data Vault (SDV, Patki, Wedge, Veeramachaneni 2016 onward) opened the enterprise conversation. CTGAN (Xu et al. 2019) showed that GANs could handle the mixed-type, imbalanced, multimodal reality of tabular data where naïve GANs failed. PATE-GAN (Jordon et al. 2019) and DP-CTGAN added differential privacy. Diffusion models for tabular data (TabDDPM, Kotelnikov et al. 2023) now often beat GAN-based synthesizers on downstream utility. The open problem is not generation; it is validation. "Does a model trained on synthetic data generalize to real data?" (the TSTR — train-synthetic-test-real — protocol) catches coarse failures but not subtle distributional ones. Synthetic data for privacy is even harder: membership inference attacks (Stadler, Oprisanu, Troncoso 2022 "Synthetic Data — Anonymisation Groundhog Day") have repeatedly shown that synthesizers without formal DP leak. The field needs an epistemically honest answer to *when* synthetic data is safe to substitute, and it does not yet have one.

## 8. Data-centric AI

Andrew Ng's 2021 reframing — "improve the data, not the model" — was initially dismissed as marketing, then quietly became consensus. The substantive work behind it is older: Northcutt, Jiang & Chuang's 2021 "Pervasive Label Errors" paper found test-set label errors in the 3–10% range across ImageNet, MNIST, and nine other canonical benchmarks, using Confident Learning (`cleanlab`). Data quality tooling — Great Expectations, Deequ, Soda — has crossed from niche to default in data engineering stacks. The open frontier is *automated* dataset audit: tools that flag leakage, duplication, near-duplicates, label noise, demographic skew, and contamination with upstream training corpora. For LLM-era data mining, contamination is particularly acute: if your "test set" was in the pretraining corpus of the model you are evaluating, your benchmark numbers are meaningless. Sainz et al. (2023) and Golchin & Surdeanu (2024) have begun to formalize contamination detection, but a universally adopted methodology does not yet exist.

## 9. Small data, few-shot, and prompts as feature engineering

The shadow side of the foundation-model era is that for most real problems you do not have big data. Transfer learning from pretrained models (the ULMFiT / BERT / CLIP lineage) is the working answer, and meta-learning (MAML, Finn et al. 2017; Prototypical Networks, Snell et al. 2017) the theoretical one. The practical frontier in 2024–2025 has been treating the prompt itself as a learned feature-extraction pipeline: DSPy (Khattab et al. 2023) compiles natural-language prompts into optimized programs; automatic prompt optimization (APO, Pryzant et al. 2023) treats prompt tuning as discrete optimization. Open problems: the sample complexity of prompt optimization under distribution shift is poorly understood, and the reproducibility of prompt-engineered pipelines across model versions is dismal.

## 10. Foundation models for tabular and graph data

Tabular data — the bread and butter of enterprise data mining — has stubbornly resisted deep learning. Gradient-boosted trees (XGBoost, LightGBM, CatBoost) still win most Kaggle tabular competitions. Two lines of attack are promising. **TabPFN** (Hollmann et al. 2023; TabPFN v2 in 2024) is a transformer pretrained on synthetic tabular datasets that, at inference time, performs Bayesian inference in context — no per-dataset training required. It is competitive with tuned XGBoost on small datasets (< 10k rows) and scales to medium sizes in recent releases. **TabLLM** (Hegselmann et al. 2023) serializes rows as text and uses an LLM, which is useful precisely when you also have unstructured context. The open question is whether a *general-purpose* pretrained tabular foundation model is possible given that tabular "modality" is really millions of incommensurable schemas. For graphs, the analogous question — "BERT for graphs" — is live: the OGB benchmark suite (Hu et al. 2020) has become the shared proving ground, and pretraining approaches (GraphMAE, Hou et al. 2022; GraphGPT, Tang et al. 2023) are promising, but no single model has yet shown zero-shot transfer across graph domains the way CLIP did for images.

## 11. Reproducibility, benchmark saturation, and test-set leakage

The replication crisis in ML is well documented (Pineau et al. 2021 NeurIPS reproducibility program; Kapoor & Narayanan 2023 "Leakage and the Reproducibility Crisis in ML-based Science"). Benchmark saturation is faster: GLUE (Wang et al. 2018) → SuperGLUE (2019) → BIG-bench (Srivastava et al. 2022) → HELM (Liang et al. 2022) → MMLU → GPQA. Each lasts about eighteen months before the frontier labs drive it into the 90s. The structural problem is that benchmarks are public, pretraining corpora are effectively the entire public web, and "held out" is a polite fiction. The frontier here is not technical but sociological: the field must adopt (a) dynamic or held-out benchmarks, (b) contamination audits as a publication requirement, and (c) a healthier attitude toward benchmarks as diagnostics rather than leaderboards. None of this is solved.

## 12. Sustainability and the small-model renaissance

Strubell, Ganesh & McCallum's 2019 "Energy and Policy Considerations" paper was the first shot; Patterson et al. (2021, 2022) gave the field a more careful accounting. The headline numbers for frontier-model training now sit in the tens of millions of dollars and the hundreds of tonnes of CO₂-equivalent. A countermovement — visible in Mistral 7B, Phi-3 (Abdin et al. 2024), Gemma, the quantized Llama lineage — argues that careful data curation and distillation can produce small models that punch far above their parameter count. For data mining specifically, this is welcome: most enterprise extraction tasks do not need a 400B model, and a well-distilled 7B may be both cheaper and easier to govern. The open problem is rigorous cost–quality Pareto frontiers for realistic mining tasks, not just academic benchmarks.

## 13. Machine unlearning and the right to be forgotten

GDPR Article 17 and the CCPA give individuals the legal right to erasure. Trained models remember. Cao & Yang (2015) introduced the term "machine unlearning"; Bourtoule et al. (2021) proposed SISA (Sharded, Isolated, Sliced, and Aggregated) training, which makes exact unlearning tractable by partitioning. Approximate unlearning methods (Guo et al. 2020 on certified removal; Neel, Roth, Sharifi-Malvajerdi 2021) trade guarantees for cost. Open problems abound. Unlearning in foundation models is essentially an unsolved problem: you cannot shard a pretraining run after the fact. Certified unlearning with tight privacy accounting against an adversary with query access is still a small literature. And the legal definition of "forgotten" has not been harmonized with the technical definitions, so regulatory compliance and mathematical guarantee can diverge.

## 14. Is data mining still its own thing?

Return to the opening question. A fair 2026 answer is that "data mining" now names a *stance* more than a set of algorithms: the stance that finding unexpected patterns in data — patterns the domain expert did not predict and the analyst is prepared to defend — is an end worth pursuing on its own terms. Machine learning, under this framing, is a toolbox; statistics is the discipline of honest measurement; foundation models are a new and powerful *sense organ* for unstructured data; and data mining is the activity that uses all of them to interrogate a domain. The open problems above — causal, interpretable, federated, streaming, synthetic, small-data, tabular, graph, reproducible, sustainable, unlearnable — are therefore not "mining problems" in the old sense. They are the conditions under which honest pattern discovery can continue to be practiced in the 2020s. The field's future depends less on a new Apriori and more on whether the next generation of practitioners can hold the old commitment — *find something the expert did not already know, and be prepared to defend it* — while wielding tools that are themselves barely understood by their creators. That is a frontier worth working on.

---

## Addendum: 2025 confirmations — CRISP-DM revisited, vector search, and the tool rewrite

This section was added in April 2026 as part of a catalog-wide enrichment
pass. The body above is unusually current already (it was written with
2022–2025 work in mind) and does not need large additions. Two small
2025-specific points are worth adding because they confirm the body's
direction and tighten its framing.

### CRISP-DM, still the dominant methodology (and increasingly critiqued)

The body's discussion of the "dissolution vs. reconstitution" of data
mining as a discipline is in tension with the continued industrial
dominance of **CRISP-DM** — the 1996-vintage "Cross-Industry Standard
Process for Data Mining" process model — as the most widely-used
methodology in enterprise data-mining and data-science practice. The
2025 survey work (notably the December 2024 "CRISP-DM for Data Science
2025" report from Data Science PM) confirms three things the body
already implies:

1. CRISP-DM is **still the #1 methodology** in enterprise data
   mining, by the same margin it held in 2014 when KDnuggets last
   did a systematic survey.
2. The methodology is **unmaintained** — there has been no formal
   revision of the 1999 spec that CRISP-DM 1.0 published. IBM's
   ASUM-DM (2015) was supposed to be the revision but never reached
   the CRISP-DM community's critical mass.
3. The 2025 consensus is that **a replacement is long overdue**.
   The reasons are exactly the ones the body above names: the
   modeling step of CRISP-DM's six-phase loop (business
   understanding → data understanding → data preparation → modeling
   → evaluation → deployment) is no longer a single activity, and
   the "deployment" phase was never designed for the
   continuously-retrained, continuously-evaluated reality of
   production ML systems.

The body's framing that "data mining now names a stance more than a
set of algorithms" is consistent with the observation that the most
widely-used methodology is older than most of its practitioners.
CRISP-DM persists because it works well enough for the discipline's
core commitment — honest pattern discovery with a stakeholder in the
loop — even as the tools it was written against have changed
completely. Its eventual replacement will have to preserve that
commitment while updating everything else.

**Sources:** [CRISP-DM Explained: A Proven Data Mining Methodology — Udacity, March 2025](https://www.udacity.com/blog/2025/03/crisp-dm-explained-a-proven-data-mining-methodology.html) · [What is CRISP DM? — Data Science PM](https://www.datascience-pm.com/crisp-dm-2/) · [CRISP-DM for Data Science 2025 — Data Science PM (PDF)](https://www.datascience-pm.com/wp-content/uploads/2024/12/CRISP-DM-for-Data-Science-2025.pdf) · [Cross-industry standard process for data mining — Wikipedia](https://en.wikipedia.org/wiki/Cross-industry_standard_process_for_data_mining)

### Vector databases and the tooling rewrite wave

The body's section on LLMs as universal text miners implies — but
does not name — the production-infrastructure layer that makes
LLM-based mining actually work: the **vector database**. 2025 was
the year vector databases stopped being a research curiosity and
became a standard piece of the enterprise data stack. The reference
lists from the 2026 SecondTalent survey ("Top 10 Vector Databases
for LLM Applications") includes Pinecone, Weaviate, Milvus, Qdrant,
Chroma, pgvector-on-Postgres, Redis's vector module, Vespa, and
several newer entrants, each with production deployments at
hyperscale.

A 2025 development worth noting for this document specifically:
several of the major vector databases have undergone **Rust rewrites**
from earlier Python implementations, and the reported performance
deltas are in the range of **4× on writes and queries** relative to
the pre-rewrite Python versions. This mirrors the broader industry
pattern (Pydantic, Polars, uv, Ruff) of Python-ecosystem tools being
rewritten in Rust to achieve production throughput. For practitioners
building mining pipelines on top of these tools, the rewrite wave
means that the vector-store layer is now fast enough not to be the
bottleneck, which moves the bottleneck upward to the embedding model
and downward to the storage I/O — both of which are active research
fronts in their own right.

**Source:** [Top 10 Vector Databases for LLM Applications in 2026 — SecondTalent](https://www.secondtalent.com/resources/top-vector-databases-for-llm-applications/)

### What this means for the body

The body's open-problem list is accurate. This addendum does not
displace any of it. What the 2025 data adds is confirmation that
(a) the discipline's methodology inheritance is still CRISP-DM and
is likely to remain so until a replacement is explicitly shipped,
and (b) the production-infrastructure layer for LLM-era mining has
matured to the point where tooling is no longer the limiting
factor for most practitioners.

## Related College Departments

This research cross-links to the following college departments in
`.college/departments/`:

- [**data-science**](../../../.college/departments/data-science/DEPARTMENT.md)
  — Data mining sits directly in the data-science department's
  scope. The CRISP-DM framework, the LLM-era extraction pipelines,
  and the vector-database infrastructure are all data-science
  working topics.
- [**coding**](../../../.college/departments/coding/DEPARTMENT.md) —
  Foundational data-mining algorithms (Apriori, k-means, decision
  trees) are canonical examples for the Algorithms & Efficiency
  wing, and the streaming/online variants are in active research
  development.
- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
  — Causal inference, statistical testing, and the mathematical
  basis of interpretability are mathematics-department topics that
  data mining specifically needs.
- [**critical-thinking**](../../../.college/departments/critical-thinking/DEPARTMENT.md)
  — The discipline's core commitment ("find something the expert
  did not already know, and be prepared to defend it") is a
  critical-thinking stance first and an algorithmic practice
  second.

---

*References are given inline by author and year; a full bibliography appears in the companion document `references.md` in this series.*

*Addendum (CRISP-DM 2025, vector database tooling rewrite) and Related College Departments cross-link added during the Session 018 catalog enrichment pass.*
