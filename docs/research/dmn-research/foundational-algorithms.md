# Foundational Data Mining Algorithms

*The canonical toolkit that defined a discipline from 1990 to 2010*

---

Data mining as a self-conscious discipline emerged in the early 1990s at the confluence of statistics, database systems, machine learning, and pattern recognition. Its founding ambition was pragmatic rather than theoretical: to extract actionable knowledge from the enormous transactional and scientific datasets that relational databases had suddenly made available. Over the following two decades, the field converged on a compact toolkit of algorithms — decision trees, clustering methods, association rule miners, dimensionality reducers, and anomaly detectors — that became the *lingua franca* of applied machine learning well before deep learning arrived to rewrite the defaults. This document surveys that foundational toolkit, tracing the intellectual lineage of each family from its statistical antecedents through its canonical data-mining-era formulation, and examining the tradeoffs that shaped which algorithms were chosen for which problems.

---

## 1. Classification

Classification — the task of assigning a discrete label to an input vector — was the earliest and most developed branch of data mining, inheriting directly from decades of prior work in pattern recognition and statistical discrimination.

### Decision Trees

Decision trees partition the feature space by a sequence of axis-aligned splits, each splitting rule chosen to maximize the purity of the resulting subsets. The modern family traces to three landmark systems. Ross Quinlan's **ID3** (Quinlan, 1986) introduced information gain — the reduction in Shannon entropy induced by a split — as the splitting criterion for categorical features. Given a node with class distribution `p_1, ..., p_k`, the entropy is

```
H(S) = - Σ p_i log_2 p_i
```

and ID3 greedily selects the attribute `A` that maximizes `H(S) - Σ (|S_v|/|S|) H(S_v)` over the values `v` of `A`. Quinlan's successor **C4.5** (Quinlan, 1993) extended the method to handle continuous attributes via threshold splits, missing values via probabilistic weighting, and overfitting via pessimistic error pruning; for a decade C4.5 was the single most widely used data mining algorithm, and it topped the 2006 IEEE ICDM "Top 10 Algorithms in Data Mining" poll (Wu et al., 2008).

In parallel, Leo Breiman, Jerome Friedman, Richard Olshen, and Charles Stone developed **CART** (Breiman, Friedman, Olshen & Stone, 1984), which used the Gini impurity `Σ p_i (1 - p_i)` as its splitting criterion, supported regression trees natively, and introduced cost-complexity pruning. CART's statistical rigor and its authors' influence on the machine learning community made it the default tree algorithm inside R and scikit-learn.

The appeal of trees is interpretability: a path from root to leaf is a conjunctive rule that a human can read. The curse is variance — small perturbations in training data produce very different trees — which motivated the ensemble methods discussed below.

### Naive Bayes

The naive Bayes classifier applies Bayes' rule under the assumption that features are conditionally independent given the class label:

```
P(y | x_1, ..., x_d) ∝ P(y) * Π P(x_i | y)
```

Its roots predate data mining by decades — Maron and Kuhns used it for document retrieval as early as 1960 — but its re-emergence in the 1990s for text classification and spam filtering cemented its place in the canon. Despite the patently false independence assumption, naive Bayes is often remarkably competitive, a phenomenon analyzed by Domingos and Pazzani (1997) who showed that zero-one loss is preserved under a much weaker condition than probability calibration. It trains in a single pass, handles high-dimensional sparse data gracefully, and remains the standard baseline for text classification against which more elaborate methods must justify themselves.

### k-Nearest Neighbors

Fix and Hodges introduced the nearest-neighbor classification rule in a 1951 technical report, and Cover and Hart (1967) proved its celebrated asymptotic error bound: as the training set grows, the error rate of the 1-NN rule is at most twice the Bayes optimal error. The algorithm is nonparametric and lazy — it stores the training set and, at query time, finds the `k` nearest points under some metric and takes a majority vote. Its strengths are simplicity, the absence of any training phase, and the ability to adapt locally to irregular decision boundaries. Its weaknesses are the curse of dimensionality (in high dimensions, "nearest" becomes meaningless), sensitivity to irrelevant features, and linear query cost unless accelerated by spatial indexes such as k-d trees (Bentley, 1975) or, in higher dimensions, locality-sensitive hashing (Indyk & Motwani, 1998).

### Logistic Regression

Logistic regression models the log-odds of a binary outcome as a linear function of the features:

```
log(P(y=1|x) / P(y=0|x)) = w^T x + b
```

Cox's 1958 paper established the modern formulation; its twentieth-century rediscovery as a foundational supervised learning method occurred through the lens of maximum likelihood estimation and, later, convex optimization. The log-loss objective is convex, admitting efficient training by Newton-Raphson (iteratively reweighted least squares) or, for large-scale problems, stochastic gradient descent. Logistic regression remains the industrial workhorse for calibrated probability estimation — particularly in credit scoring, clinical decision support, and online advertising — because its outputs are well-calibrated probabilities rather than arbitrary scores, and its coefficients correspond to interpretable odds ratios.

### Support Vector Machines

The support vector machine, introduced by Boser, Guyon, and Vapnik (1992) and extended to soft margins by Cortes and Vapnik (1995), dominated the classification literature through the 2000s. The core idea is to find the hyperplane that maximizes the margin — the distance to the nearest training points of either class — yielding the convex quadratic program

```
minimize (1/2) ||w||^2 + C Σ ξ_i
subject to y_i (w^T x_i + b) ≥ 1 - ξ_i, ξ_i ≥ 0
```

The *kernel trick* — replacing inner products `x_i^T x_j` with a kernel function `K(x_i, x_j)` implicitly corresponding to an inner product in a higher-dimensional feature space — allows SVMs to represent highly nonlinear decision boundaries without ever materializing the feature map. Scholkopf and Smola's *Learning with Kernels* (2002) is the canonical reference. SVMs rose on three virtues: strong theoretical grounding in Vapnik-Chervonenkis theory, excellent empirical performance on moderately sized problems, and sparse solutions (only support vectors matter at test time). They declined as dataset sizes outran the O(n^2)-to-O(n^3) training complexity of traditional solvers.

### Random Forests

Breiman's random forest (Breiman, 2001) combined two variance-reduction ideas: bagging (Breiman, 1996), which trains each tree on a bootstrap sample, and random feature subspace selection (Ho, 1995), which considers only a random subset of features at each split. The ensemble vote averages out the high variance of individual trees while preserving their low bias. Random forests are nearly parameter-free in practice — the two tunable knobs (number of trees and mtry) are forgiving — handle mixed data types without preprocessing, tolerate missing values, and provide a free out-of-bag error estimate and feature importance ranking. For tabular classification, they remained the default choice from roughly 2005 through the rise of gradient boosting machines (Friedman, 2001) in the 2010s.

---

## 2. Clustering

Clustering — unsupervised partitioning of data into meaningful groups — has been studied far longer than classification, with taxonomic roots in numerical taxonomy and psychometrics.

### k-Means

The k-means algorithm iterates two steps: assign each point to its nearest centroid, then move each centroid to the mean of its assigned points. It minimizes the within-cluster sum of squares `Σ_k Σ_{i ∈ C_k} ||x_i - μ_k||^2`. Stuart Lloyd developed the procedure for pulse-code modulation at Bell Labs in 1957 (circulated internally but not published until 1982), and James MacQueen gave it its name in 1967. The algorithm's virtues are simplicity, O(nkd) per-iteration cost, and guaranteed monotone convergence of the objective; its vices are sensitivity to initialization (partially addressed by k-means++ seeding of Arthur and Vassilvitskii, 2007), a preference for spherical equally-sized clusters, and the requirement that `k` be specified in advance. For vast amounts of tabular and vector data, k-means remains the first thing practitioners try.

### Hierarchical Clustering

Hierarchical methods produce a tree of nested partitions rather than a flat clustering. Agglomerative variants start with each point in its own cluster and repeatedly merge the closest pair; divisive variants start with a single cluster and recursively split. The choice of *linkage* function — single, complete, average, Ward's — determines cluster shape and sensitivity to outliers. Sokal and Sneath's *Principles of Numerical Taxonomy* (1963) gave the methods their canonical biological formulation; Ward (1963) introduced the variance-minimizing linkage that bears his name. The resulting dendrogram is pedagogically appealing and requires no pre-specification of cluster count, but the O(n^2) memory and O(n^2 log n) time costs confine hierarchical methods to modest dataset sizes.

### DBSCAN

Martin Ester, Hans-Peter Kriegel, Jorg Sander, and Xiaowei Xu introduced DBSCAN at KDD 1996 (Ester et al., 1996), and the paper received the SIGKDD Test of Time Award in 2014. DBSCAN defines clusters as maximal sets of density-connected points: a *core point* has at least `minPts` neighbors within radius `eps`; points within `eps` of a core point are density-reachable; density-reachability is transitively closed to form clusters. The algorithm's strengths are the ability to find arbitrarily shaped clusters, a principled notion of noise (points that are neither core nor reachable), and insensitivity to the ordering of the input. Its weaknesses are sensitivity to `eps` and poor performance when cluster densities vary greatly — limitations addressed by OPTICS (Ankerst et al., 1999) and HDBSCAN (Campello, Moulavi & Sander, 2013).

### Expectation-Maximization and Gaussian Mixtures

A Gaussian mixture model represents the data density as a convex combination of `k` Gaussian components, `p(x) = Σ π_k N(x; μ_k, Σ_k)`. Fitting such a model is the prototypical application of the expectation-maximization algorithm of Dempster, Laird, and Rubin (1977), which alternates between computing posterior responsibilities `γ_ik = P(component k | x_i)` (the E-step) and updating component parameters as responsibility-weighted statistics (the M-step). Unlike k-means, GMMs permit elliptical clusters of unequal size and produce soft assignments — each point carries a posterior over clusters rather than a hard label — but the EM procedure converges only to local optima, and fitting a full covariance matrix per component grows quadratically in dimension.

### Spectral Clustering

Spectral clustering (Shi & Malik, 2000; Ng, Jordan & Weiss, 2001) embeds the data into a low-dimensional space spanned by the eigenvectors of a Laplacian matrix derived from a similarity graph, then runs k-means in that space. The method recovers clusters separated by complicated manifold geometry where Euclidean methods fail, and its graph-theoretic interpretation as an approximation to the normalized cut problem gives it principled footing. Its cost is dominated by the eigendecomposition of an n-by-n matrix, which was a serious practical barrier until the arrival of randomized and Nystrom-based approximations in the late 2000s.

---

## 3. Association Rule and Sequential Pattern Mining

Association rule mining was the first algorithmic problem to be called *data mining* in print, and remains the most distinctive contribution of the field's database-oriented wing.

Rakesh Agrawal, Tomasz Imielinski, and Arun Swami introduced the problem formulation in 1993 (Agrawal, Imielinski & Swami, 1993) in the context of supermarket basket analysis: given a collection of transactions, find rules of the form `X → Y` whose *support* (fraction of transactions containing `X ∪ Y`) exceeds `minsup` and whose *confidence* (`support(X ∪ Y) / support(X)`) exceeds `minconf`. The **Apriori** algorithm of Agrawal and Srikant (1994) exploits the *downward-closure* property — any subset of a frequent itemset is itself frequent — to prune the search space: it enumerates frequent k-itemsets by joining frequent (k-1)-itemsets and testing only the survivors against the database. Apriori's candidate generation became the template for a decade of combinatorial data mining.

Jiawei Han, Jian Pei, and Yiwen Yin's **FP-Growth** (Han, Pei & Yin, 2000) eliminated candidate generation entirely by compressing the database into a frequent-pattern tree and recursively mining conditional FP-trees; on dense datasets FP-Growth typically outperforms Apriori by one to two orders of magnitude. Mohammed Zaki's **Eclat** (Zaki, 2000) offered a third approach: a vertical data layout in which each item is associated with the set of transaction ids (tidsets) containing it, allowing support counting by tidset intersection. Together these three algorithms define the core of association rule mining as taught today.

Sequential pattern mining generalizes the problem to ordered transactions — think of web clickstreams or bioinformatic sequences. Agrawal and Srikant's **GSP** (Srikant & Agrawal, 1996) is the sequential analog of Apriori; Zaki's **SPADE** (Zaki, 2001) lifts Eclat's vertical layout to sequences; Pei, Han, Mortazavi-Asl, Pinto, Chen, Dayal, and Hsu's **PrefixSpan** (Pei et al., 2001) generalizes FP-Growth by projecting the database onto prefixes and mining recursively.

---

## 4. Regression

Regression — predicting a continuous target — inherits directly from classical statistics but acquired new techniques and new scales during the data mining era. Linear regression via ordinary least squares dates to Gauss and Legendre around 1805; polynomial regression is a trivial extension via basis expansion. The data mining era's contribution was the *regularized* regressions that trade a small amount of bias for a large reduction in variance in high-dimensional settings.

**Ridge regression** (Hoerl & Kennard, 1970) adds an L2 penalty `λ ||w||^2` to the least-squares objective, producing the closed-form solution `w = (X^T X + λI)^{-1} X^T y`. It handles multicollinearity gracefully and shrinks coefficients smoothly. Robert Tibshirani's **lasso** (Tibshirani, 1996) substitutes an L1 penalty `λ ||w||_1`, which produces sparse solutions — many coefficients are driven exactly to zero, performing variable selection and estimation simultaneously. The elastic net of Zou and Hastie (2005) combines both penalties to handle correlated features. For nonlinear regression on tabular data, tree-based methods — regression trees, random forest regression, and gradient boosted regression trees — eventually displaced kernel methods and neural networks as the practitioner's default.

---

## 5. Dimensionality Reduction

The curse of dimensionality — the rapid degradation of distance-based algorithms as dimensionality grows — made dimensionality reduction a central concern for data mining. The oldest and most durable method is **principal component analysis**, introduced by Karl Pearson (Pearson, 1901) as a least-squares fit of a line to a cloud of points and independently developed by Harold Hotelling (Hotelling, 1933) in the context of psychological testing. PCA computes the orthonormal basis `u_1, ..., u_d` of eigenvectors of the sample covariance matrix, sorted by eigenvalue; projecting data onto the top-k eigenvectors yields the rank-k linear subspace that maximizes retained variance (equivalently, minimizes reconstruction error). The modern computation uses the singular value decomposition `X = U Σ V^T`, avoiding the explicit covariance matrix for numerical stability.

**Linear discriminant analysis** (Fisher, 1936), by contrast, finds projections that maximize the ratio of between-class to within-class scatter, yielding a supervised dimensionality reduction. **Multidimensional scaling** (Torgerson, 1952; Kruskal, 1964) takes a matrix of pairwise dissimilarities and finds a low-dimensional embedding that preserves them, with classical MDS reducing to eigendecomposition of the doubly-centered squared-distance matrix and non-metric variants minimizing stress through iterative optimization. Nonlinear successors include Isomap (Tenenbaum, de Silva & Langford, 2000), locally linear embedding (Roweis & Saul, 2000), and Laplacian eigenmaps (Belkin & Niyogi, 2003). **t-distributed stochastic neighbor embedding** (van der Maaten & Hinton, 2008) — technically a late arrival at the tail of the foundational era — became the default visualization method for high-dimensional data by matching Gaussian neighborhood distributions in the source space to Student-t distributions in a two-dimensional embedding, exaggerating local structure at the expense of global geometry.

---

## 6. Outlier and Anomaly Detection

Outlier detection predates data mining by centuries — Peirce's criterion dates to 1852 — but acquired a distinct algorithmic flavor in the 1990s. Statistical methods assume a parametric distribution and flag points with low likelihood under it: Grubbs' test, the modified Z-score, and Mahalanobis distance for multivariate Gaussians. Distance-based outliers, formalized by Knorr and Ng (1998), flag points with fewer than `k` neighbors within radius `r`, eschewing distributional assumptions at the cost of requiring the user to set global distance thresholds.

The **local outlier factor** (LOF) of Breunig, Kriegel, Ng, and Sander (2000) was the conceptual breakthrough. LOF measures the degree to which a point is an outlier *relative to its local neighborhood*, using the ratio of a point's average reachability distance to that of its neighbors. A LOF score near 1 indicates a point of typical density; scores substantially above 1 indicate outliers. The method handles datasets with widely varying density — something global methods fundamentally cannot — and its paper at SIGMOD 2000 was the launching point for a decade of density-based anomaly detection work. Later additions to the canon include isolation forests (Liu, Ting & Zhou, 2008), one-class SVMs (Scholkopf et al., 2001), and angle-based outlier detection (Kriegel, Schubert & Zimek, 2008).

---

## 7. Closing Observations

Viewed together, the foundational data mining toolkit exhibits three recurring themes. First, the field consistently privileged *interpretability and scalability* over raw predictive accuracy: Apriori, C4.5, k-means, and PCA all produce outputs that a domain expert can inspect, and all scale to the data volumes of the late twentieth century on commodity hardware. Second, the theoretical underpinnings are shallow by the standards of modern machine learning — many of the algorithms are greedy heuristics whose convergence guarantees, if any, are asymptotic or local — yet their empirical reliability on diverse real-world data was the foundation on which deep learning would later be evaluated and deployed. Third, and most strikingly, nearly every algorithm in this survey is still in active production use somewhere in 2025: random forests drive fraud detection, k-means quantizes embeddings, Apriori mines clinical code co-occurrences, PCA whitens inputs for neural networks, and LOF watches over monitoring dashboards. The discipline's founding toolkit has outlived every hype cycle that tried to replace it — a testament both to the taste of the founders and to the enduring difficulty of the problems they chose to solve.

---

## References

- Agrawal, R., Imielinski, T., & Swami, A. (1993). Mining association rules between sets of items in large databases. *ACM SIGMOD Record*, 22(2), 207-216.
- Agrawal, R., & Srikant, R. (1994). Fast algorithms for mining association rules. *VLDB '94*, 487-499.
- Ankerst, M., Breunig, M. M., Kriegel, H.-P., & Sander, J. (1999). OPTICS: Ordering points to identify the clustering structure. *ACM SIGMOD*, 49-60.
- Arthur, D., & Vassilvitskii, S. (2007). k-means++: The advantages of careful seeding. *SODA '07*, 1027-1035.
- Belkin, M., & Niyogi, P. (2003). Laplacian eigenmaps for dimensionality reduction and data representation. *Neural Computation*, 15(6), 1373-1396.
- Bentley, J. L. (1975). Multidimensional binary search trees used for associative searching. *Communications of the ACM*, 18(9), 509-517.
- Boser, B. E., Guyon, I. M., & Vapnik, V. N. (1992). A training algorithm for optimal margin classifiers. *COLT '92*, 144-152.
- Breiman, L. (1996). Bagging predictors. *Machine Learning*, 24(2), 123-140.
- Breiman, L. (2001). Random forests. *Machine Learning*, 45(1), 5-32.
- Breiman, L., Friedman, J. H., Olshen, R. A., & Stone, C. J. (1984). *Classification and Regression Trees*. Wadsworth.
- Breunig, M. M., Kriegel, H.-P., Ng, R. T., & Sander, J. (2000). LOF: Identifying density-based local outliers. *ACM SIGMOD*, 93-104.
- Campello, R. J. G. B., Moulavi, D., & Sander, J. (2013). Density-based clustering based on hierarchical density estimates. *PAKDD 2013*.
- Cortes, C., & Vapnik, V. (1995). Support-vector networks. *Machine Learning*, 20(3), 273-297.
- Cover, T. M., & Hart, P. E. (1967). Nearest neighbor pattern classification. *IEEE Transactions on Information Theory*, 13(1), 21-27.
- Cox, D. R. (1958). The regression analysis of binary sequences. *Journal of the Royal Statistical Society, Series B*, 20(2), 215-242.
- Dempster, A. P., Laird, N. M., & Rubin, D. B. (1977). Maximum likelihood from incomplete data via the EM algorithm. *Journal of the Royal Statistical Society, Series B*, 39(1), 1-38.
- Domingos, P., & Pazzani, M. (1997). On the optimality of the simple Bayesian classifier under zero-one loss. *Machine Learning*, 29(2-3), 103-130.
- Ester, M., Kriegel, H.-P., Sander, J., & Xu, X. (1996). A density-based algorithm for discovering clusters in large spatial databases with noise. *KDD '96*, 226-231.
- Fisher, R. A. (1936). The use of multiple measurements in taxonomic problems. *Annals of Eugenics*, 7(2), 179-188.
- Fix, E., & Hodges, J. L. (1951). Discriminatory analysis, nonparametric discrimination: Consistency properties. USAF School of Aviation Medicine, Technical Report 4.
- Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*, 29(5), 1189-1232.
- Han, J., Pei, J., & Yin, Y. (2000). Mining frequent patterns without candidate generation. *ACM SIGMOD*, 1-12.
- Ho, T. K. (1995). Random decision forests. *ICDAR '95*, 278-282.
- Hoerl, A. E., & Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. *Technometrics*, 12(1), 55-67.
- Hotelling, H. (1933). Analysis of a complex of statistical variables into principal components. *Journal of Educational Psychology*, 24(6), 417-441.
- Indyk, P., & Motwani, R. (1998). Approximate nearest neighbors: Towards removing the curse of dimensionality. *STOC '98*, 604-613.
- Knorr, E. M., & Ng, R. T. (1998). Algorithms for mining distance-based outliers in large datasets. *VLDB '98*, 392-403.
- Kriegel, H.-P., Schubert, M., & Zimek, A. (2008). Angle-based outlier detection in high-dimensional data. *KDD '08*, 444-452.
- Kruskal, J. B. (1964). Multidimensional scaling by optimizing goodness of fit to a nonmetric hypothesis. *Psychometrika*, 29(1), 1-27.
- Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). Isolation forest. *ICDM '08*, 413-422.
- Lloyd, S. P. (1982). Least squares quantization in PCM. *IEEE Transactions on Information Theory*, 28(2), 129-137 (work done at Bell Labs in 1957).
- MacQueen, J. (1967). Some methods for classification and analysis of multivariate observations. *Proceedings of the 5th Berkeley Symposium on Mathematical Statistics and Probability*, 1, 281-297.
- Maron, M. E., & Kuhns, J. L. (1960). On relevance, probabilistic indexing and information retrieval. *Journal of the ACM*, 7(3), 216-244.
- Ng, A. Y., Jordan, M. I., & Weiss, Y. (2001). On spectral clustering: Analysis and an algorithm. *NIPS 14*.
- Pearson, K. (1901). On lines and planes of closest fit to systems of points in space. *Philosophical Magazine*, 2(11), 559-572.
- Pei, J., Han, J., Mortazavi-Asl, B., Pinto, H., Chen, Q., Dayal, U., & Hsu, M.-C. (2001). PrefixSpan: Mining sequential patterns efficiently by prefix-projected pattern growth. *ICDE '01*, 215-224.
- Quinlan, J. R. (1986). Induction of decision trees. *Machine Learning*, 1(1), 81-106.
- Quinlan, J. R. (1993). *C4.5: Programs for Machine Learning*. Morgan Kaufmann.
- Roweis, S. T., & Saul, L. K. (2000). Nonlinear dimensionality reduction by locally linear embedding. *Science*, 290(5500), 2323-2326.
- Scholkopf, B., Platt, J. C., Shawe-Taylor, J., Smola, A. J., & Williamson, R. C. (2001). Estimating the support of a high-dimensional distribution. *Neural Computation*, 13(7), 1443-1471.
- Scholkopf, B., & Smola, A. J. (2002). *Learning with Kernels*. MIT Press.
- Shi, J., & Malik, J. (2000). Normalized cuts and image segmentation. *IEEE TPAMI*, 22(8), 888-905.
- Sokal, R. R., & Sneath, P. H. A. (1963). *Principles of Numerical Taxonomy*. W. H. Freeman.
- Srikant, R., & Agrawal, R. (1996). Mining sequential patterns: Generalizations and performance improvements. *EDBT '96*, 3-17.
- Tenenbaum, J. B., de Silva, V., & Langford, J. C. (2000). A global geometric framework for nonlinear dimensionality reduction. *Science*, 290(5500), 2319-2323.
- Tibshirani, R. (1996). Regression shrinkage and selection via the lasso. *Journal of the Royal Statistical Society, Series B*, 58(1), 267-288.
- Torgerson, W. S. (1952). Multidimensional scaling: I. Theory and method. *Psychometrika*, 17(4), 401-419.
- van der Maaten, L., & Hinton, G. (2008). Visualizing data using t-SNE. *Journal of Machine Learning Research*, 9, 2579-2605.
- Ward, J. H. (1963). Hierarchical grouping to optimize an objective function. *Journal of the American Statistical Association*, 58(301), 236-244.
- Wu, X., Kumar, V., Quinlan, J. R., et al. (2008). Top 10 algorithms in data mining. *Knowledge and Information Systems*, 14(1), 1-37.
- Zaki, M. J. (2000). Scalable algorithms for association mining. *IEEE TKDE*, 12(3), 372-390.
- Zaki, M. J. (2001). SPADE: An efficient algorithm for mining frequent sequences. *Machine Learning*, 42(1-2), 31-60.
- Zou, H., & Hastie, T. (2005). Regularization and variable selection via the elastic net. *Journal of the Royal Statistical Society, Series B*, 67(2), 301-320.

## Study Guide — Foundational Algorithms

Top 10: Apriori, k-means, EM, PageRank, AdaBoost, kNN, CART,
Naive Bayes, SVM, C4.5 (Wu et al. 2008).

## DIY — Implement k-means from scratch

30 lines of numpy. The simplest clustering algorithm,
and the one every practitioner has to know.

## TRY — Read Wu 2008

"Top 10 algorithms in data mining" — the canonical
survey.

## Related College Departments

- [**mathematics**](../../../.college/departments/mathematics/DEPARTMENT.md)
