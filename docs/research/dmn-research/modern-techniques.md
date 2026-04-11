# Modern Data Mining: Techniques After the Classical Era
*—where decision trees learned to vote, words learned to count themselves, and graphs learned to remember—*

## 1. Introduction: The Shape of the Modern Era

By 2010, the classical data mining toolbox — C4.5, CART, Apriori, k-means, naive Bayes, and the original SVM — had been stable for roughly a decade. What followed was not a replacement of those tools but a layering on top of them: ensembles that treated weak learners as building blocks, deep networks that absorbed representation learning into end-to-end training, and a steady shift from hand-crafted features to learned embeddings. The 2010s also saw data mining lose much of its disciplinary independence, becoming partially absorbed into machine learning, partially into data engineering, and partially into a new thing called "AI." This document surveys the techniques that define data mining as it is practiced in the 2020s, covering the period 2010–2026 with occasional glances back at the seminal work of the 1990s and 2000s that made the modern synthesis possible.

## 2. Ensemble Methods: Why Boosted Trees Still Win on Tables

The single most durable result in applied data mining is that, on structured tabular data with mixed types and moderate sample sizes, gradient-boosted decision trees remain the best or near-best choice in 2025. This was not obvious in 2010 and remains an active source of friction between "deep learning will eat everything" narratives and empirical benchmark reality.

**Bagging**, introduced by Leo Breiman in 1996 ("Bagging Predictors," *Machine Learning* 24:123–140), established that variance reduction via bootstrap aggregation could turn unstable base learners — especially decision trees — into strong predictors. Breiman's 2001 random forest paper (*Machine Learning* 45:5–32) added per-split feature subsampling and became a default tool in every statistician's toolkit.

**AdaBoost** (Freund and Schapire, 1995, "A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting," later formalized in *Journal of Computer and System Sciences* 55:119–139, 1997) changed the framing from variance reduction to sequential error correction. It won the Gödel Prize in 2003 for proving that a weak learner slightly better than chance could be boosted to arbitrarily high accuracy on the training set. Friedman, Hastie, and Tibshirani's 2000 paper "Additive Logistic Regression" (*Annals of Statistics* 28:337–407) reframed boosting as gradient descent in function space, which became the conceptual bridge to modern gradient boosting.

**Gradient Boosting Machines** (Friedman, 2001, "Greedy Function Approximation: A Gradient Boosting Machine," *Annals of Statistics* 29:1189–1232) generalized the framework: any differentiable loss, any base learner, trees as the default. For nearly a decade this was implemented slowly and in scattered libraries.

**XGBoost** (Chen and Guestrin, 2016 KDD paper "XGBoost: A Scalable Tree Boosting System," though the system was released in 2014) was the breakout. It added a second-order Taylor approximation of the loss, column subsampling, regularized leaf weights, a sparsity-aware split-finding algorithm that handled missing values natively, and a cache-friendly block structure for out-of-core computation. Between 2015 and 2017 XGBoost won the majority of Kaggle structured-data competitions, and remains the de facto baseline against which all tabular methods are measured. The paper has been cited over 30,000 times.

**LightGBM** (Ke et al., NeurIPS 2017, "LightGBM: A Highly Efficient Gradient Boosting Decision Tree") replaced the standard level-wise tree growth with leaf-wise growth, introduced histogram-based binning of features, and added Gradient-based One-Side Sampling (GOSS) and Exclusive Feature Bundling (EFB). On typical tabular benchmarks LightGBM trains 5–20× faster than XGBoost with comparable accuracy.

**CatBoost** (Prokhorenkova et al., NeurIPS 2018, "CatBoost: unbiased boosting with categorical features") addressed two persistent issues: target leakage in mean-encoding of categorical variables, and the "prediction shift" bias where the same data is used to train and score internal splits. Its ordered boosting and ordered target statistics gave principled categorical handling without manual one-hot expansion.

Why does this family still win? The 2022 benchmark by Grinsztajn, Oyallon, and Varoquaux ("Why do tree-based models still outperform deep learning on tabular data?", NeurIPS 2022) isolated three reasons: tree ensembles are rotationally non-invariant in a way that matches the axis-aligned structure of tabular features, they are robust to uninformative features, and they handle irregular, discontinuous target functions that MLPs smooth over. The paper has become the standard reference for the "trees-vs-nets" debate.

## 3. Deep Learning Convergence

Beginning with Krizhevsky, Sutskever, and Hinton's AlexNet result on ImageNet (NeurIPS 2012), deep learning absorbed vast territories once claimed by data mining. Anomaly detection migrated to **autoencoders** — a network trained to reconstruct its input, where reconstruction error serves as an anomaly score. Sakurada and Yairi's 2014 paper "Anomaly Detection Using Autoencoders with Nonlinear Dimensionality Reduction" (MLSDA) gave the canonical formulation; later variational autoencoders (Kingma and Welling, 2013) added probabilistic grounding, and deep SVDD (Ruff et al., ICML 2018) fused one-class SVM objectives with representation learning.

The deeper convergence was **feature engineering → representation learning**. Classical data mining spent enormous effort on manual features: n-grams, PCA projections, TF-IDF scores, hand-tuned interaction terms. Deep models learned these implicitly from raw inputs. By 2020, a typical pipeline for text, image, or sequence data skipped explicit feature construction entirely, feeding tokens or pixels into a pretrained encoder and fine-tuning the last layers.

## 4. Graph Mining

Graphs — social networks, citation graphs, knowledge bases, molecular structures — were always awkward for classical mining because they lack a natural feature-vector representation.

**PageRank** (Brin and Page, 1998, "The Anatomy of a Large-Scale Hypertextual Web Search Engine," *Computer Networks and ISDN Systems* 30:107–117) was the first widely deployed graph mining algorithm, computing the stationary distribution of a random walk over the hyperlink graph. Its success at Google made spectral methods on graphs mainstream.

**Community detection** produced two families. **Girvan and Newman** (2002, "Community structure in social and biological networks," *PNAS* 99:7821–7826) used edge betweenness to iteratively split graphs, while **Louvain** (Blondel, Guillaume, Lambiotte, and Lefebvre, 2008, "Fast unfolding of communities in large networks," *Journal of Statistical Mechanics*) optimized modularity greedily at multiple scales. Louvain became the default because it scales to millions of nodes; the 2019 Leiden refinement (Traag, Waltman, and van Eck) fixed a subtle guarantee about internal connectedness.

**node2vec** (Grover and Leskovec, KDD 2016, "node2vec: Scalable Feature Learning for Networks") ported the skip-gram objective from word2vec to graphs: a biased random walk generated "sentences" of node IDs, and a shallow neural network learned node embeddings. DeepWalk (Perozzi et al., KDD 2014) had the earlier version; node2vec added the *p* and *q* hyperparameters controlling the breadth-first vs depth-first character of the walk.

**Graph Neural Networks** arrived as a coherent family around 2017. The **Graph Convolutional Network** (Kipf and Welling, ICLR 2017, "Semi-Supervised Classification with Graph Convolutional Networks") proposed a first-order approximation of spectral graph convolution, reducing each layer to a symmetric normalized Laplacian multiplied by a learned weight matrix. **GraphSAGE** (Hamilton, Ying, and Leskovec, NeurIPS 2017, "Inductive Representation Learning on Large Graphs") replaced the transductive spectral view with a neighborhood-sampling-and-aggregation scheme that worked on unseen nodes. The **Graph Attention Network** (Veličković et al., ICLR 2018) added per-edge attention weights, letting the model learn which neighbors matter. Together these three papers defined the GNN canon of the late 2010s and were followed by a cascade of variants — GIN, R-GCN, APPNP, Graph Transformers — through the early 2020s.

## 5. Streaming and Online Data Mining

When data arrives as an unbounded stream, you cannot store it and cannot assume stationarity.

**Hoeffding trees** (Domingos and Hulten, KDD 2000, "Mining High-Speed Data Streams") use the Hoeffding inequality to decide, with provable confidence, when enough samples have arrived to split a node. Their implementation, the **Very Fast Decision Tree (VFDT)**, processes tuples in constant time per example and constant memory, and converges asymptotically to the batch tree a classical algorithm would produce.

**Concept drift** — the distribution shift that occurs as the world changes under a deployed model — demanded new detection methods. **ADWIN** (Bifet and Gavaldà, SDM 2007, "Learning from Time-Changing Data with Adaptive Windowing") maintains a variable-size window and statistically tests for differences between sub-windows, shrinking when drift is detected. DDM, EDDM, and Page-Hinkley tests supplemented it. Streaming k-means variants such as CluStream (Aggarwal et al., VLDB 2003) and StreamKM++ (Ackermann et al., 2012) handled clustering over evolving data using micro-cluster summaries and coreset constructions.

## 6. AutoML

If data mining's 2000s promise was "let a domain expert build a model," AutoML's 2010s promise was "let anyone build a model."

**Auto-sklearn** (Feurer et al., NeurIPS 2015, "Efficient and Robust Automated Machine Learning") used Bayesian optimization over the scikit-learn pipeline space, with meta-learning warm-starts and final ensembling. **TPOT** (Olson et al., 2016) used genetic programming to evolve scikit-learn pipelines. **H2O AutoML** delivered production-grade stacked ensembles with automatic feature preprocessing. **Google AutoML** (2017 onward) and Cloud AutoML Tables commercialized neural architecture search for non-specialists.

The limits became clear by 2020: AutoML excels at model selection and hyperparameter tuning on well-prepared data, but cannot substitute for domain understanding when framing the problem, cleaning the data, or choosing which loss function matches business cost. The democratization has been real but partial.

## 7. Representation Learning for Text

**word2vec** (Mikolov et al., 2013, "Efficient Estimation of Word Representations in Vector Space" and "Distributed Representations of Words and Phrases and their Compositionality") introduced the CBOW and skip-gram architectures, producing dense 100–300-dimensional vectors whose linear structure captured analogies ("king – man + woman ≈ queen"). **GloVe** (Pennington, Socher, and Manning, EMNLP 2014, "GloVe: Global Vectors for Word Representation") framed the same goal as matrix factorization of a global co-occurrence statistic.

These static embeddings were replaced by **contextual** embeddings. **ELMo** (Peters et al., NAACL 2018, "Deep contextualized word representations") used stacked bidirectional LSTMs to give each word a vector that depended on its sentence. **BERT** (Devlin et al., NAACL 2019, "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding") replaced recurrence with the Transformer and introduced masked language modeling. For text mining this was transformative: classical NLP pipelines that chained POS-taggers, chunkers, and hand-written features collapsed into a single "encode with BERT, add a linear head" recipe that won nearly every benchmark.

## 8. Topic Modeling

**Latent Dirichlet Allocation** (Blei, Ng, and Jordan, 2003, *Journal of Machine Learning Research* 3:993–1022) is the canonical probabilistic topic model: documents are mixtures over topics, topics are mixtures over words, and both mixtures are Dirichlet-distributed. LDA became the workhorse of computational social science and digital humanities throughout the 2010s. **Dynamic Topic Models** (Blei and Lafferty, ICML 2006) let topic-word distributions drift over time via a Gaussian state-space model. **Neural topic models** beginning with NVDM (Miao, Yu, and Blunsom, ICML 2016) used variational autoencoders on the bag-of-words representation. By 2020, BERTopic (Grootendorst, 2022) combined BERT embeddings, UMAP dimensionality reduction, and HDBSCAN clustering to produce topics that many practitioners found more coherent than LDA.

## 9. Time Series Mining

Classical time series mining leaned on **Dynamic Time Warping** (Sakoe and Chiba, 1978), **SAX** (Symbolic Aggregate approXimation; Lin, Keogh, Lonardi, and Chiu, 2003), and **shapelets** (Ye and Keogh, KDD 2009), which discovered short, discriminative subsequences. These remain in use, especially in energy and manufacturing domains where interpretability matters.

Modern deep time series models include **N-BEATS** (Oreshkin et al., ICLR 2020, "N-BEATS: Neural basis expansion analysis for interpretable time series forecasting"), which stacked fully connected blocks with residual connections and beat the M4 competition winner without domain-specific feature engineering, and the **Temporal Fusion Transformer** (Lim et al., 2021, *International Journal of Forecasting*), which combined LSTM encoders with self-attention and variable selection networks for multi-horizon forecasting with heterogeneous inputs.

## 10. Causal Data Mining

Correlation mining gave way, starting in the mid-2010s, to a genuine causal turn. **Judea Pearl's do-calculus** (*Causality: Models, Reasoning, and Inference*, 2000, 2nd ed. 2009) had existed for years but was largely ignored by the mining community until the causal inference revolution in economics and biostatistics made it unavoidable. **Causal forests** (Athey and Wager, 2019, "Estimation and Inference of Heterogeneous Treatment Effects using Random Forests," *Journal of the American Statistical Association* 113:1228–1242, earlier 2015 preprint) adapted random forests to estimate heterogeneous treatment effects with asymptotic normality guarantees. **DoWhy** (Sharma and Kiciman, 2020, open-sourced by Microsoft Research) gave a Pythonic four-step pipeline — model, identify, estimate, refute — that brought causal reasoning into ordinary data science notebooks.

## 11. Self-Supervised and Foundation Models for Tables

Finally, the question that animated the late 2010s and early 2020s: can deep learning's pretraining paradigm — the very thing that made BERT transformative for text — work on tabular data? Three serious attempts:

**TabNet** (Arık and Pfister, AAAI 2021, "TabNet: Attentive Interpretable Tabular Learning") used sequential attention to choose which features to reason about at each decision step, offering interpretability alongside competitive performance.

**TabTransformer** (Huang et al., 2020) embedded categorical variables and passed them through a Transformer encoder before concatenating with numerical features, winning on several categorical-heavy benchmarks.

**TabPFN** (Hollmann et al., ICLR 2023, "TabPFN: A Transformer That Solves Small Tabular Classification Problems in a Second") took the most radical approach: pretrain a single Transformer on millions of synthetic tabular datasets drawn from a structural causal model prior, and at inference time perform in-context classification without any fine-tuning. On datasets with up to 1,000 samples and 100 features it matched or exceeded well-tuned gradient boosting while taking under a second per dataset. TabPFN 2 (2024) extended this to larger datasets and regression, and has reignited debate about whether the era of "trees still win on tables" is finally ending — or whether boosting remains the right answer for everything outside the small-dataset regime.

## 12. Closing Note

The modern data mining toolbox is not a single framework but a layered ecosystem. Boosted trees handle structured tables; GNNs handle networks; Transformers handle sequences; causal forests handle treatment effects; AutoML wraps the whole thing for non-specialists. The unifying theme is that every decade-old hand-crafted step — feature engineering, model selection, distance computation, feature bundling — has an automated descendant. What has *not* been automated is the act of framing: deciding what to predict, why it matters, and what counts as a good answer. That remains the data miner's job, and probably will for some time yet.
