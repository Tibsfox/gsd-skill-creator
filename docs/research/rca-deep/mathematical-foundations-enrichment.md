# Mathematical Foundations of RCA: Deep Paper Enrichment

> Research compiled 2026-04-08. Sources: academic papers, survey articles, and authoritative references across causal inference, Bayesian networks, graph theory, information theory, and Granger causality.

---

## Paper 1: Pearl's Structural Causal Models and Do-Calculus

**Authors:** Judea Pearl
**Year/Venue:** 2010, *The International Journal of Biostatistics*, 6(2):7. DOI: 10.2202/1557-4679.1203. Also: "Causal inference in statistics: An overview," *Statistics Surveys* 3:96-146, 2009.

### Methodology

Pearl's Structural Causal Model (SCM) framework provides the mathematical foundation for all modern causal inference. An SCM consists of:

1. **Endogenous variables** V = {V_1, ..., V_n} (determined within the system)
2. **Exogenous variables** U = {U_1, ..., U_m} (background/unmeasured factors)
3. **Structural equations** V_i = f_i(pa_i, U_i) governing each variable's determination
4. **A directed acyclic graph (DAG)** encoding the causal structure

The framework defines three levels of the **Causal Hierarchy** (the "Ladder of Causation"):

| Level | Name | Typical Query | Mathematical Expression |
|-------|------|---------------|------------------------|
| 1 | Association | "What if I observe X?" | P(Y\|X) |
| 2 | Intervention | "What if I do X?" | P(Y\|do(X=x)) |
| 3 | Counterfactual | "What if X had been different?" | Y_x(u) |

Each level strictly subsumes the one below and cannot be reduced to it from data alone.

### Key Results / Formulas

#### The do-Operator

The fundamental intervention representation:

```
P_M(y|do(x)) := P_{M_x}(y)
```

This defines post-intervention distributions by modifying model M to create M_x, where the equation determining X is replaced with the constant X = x (a "surgical" intervention that severs all incoming arrows to X in the DAG).

#### The Three Rules of Do-Calculus (Pearl, 1995)

Given a causal DAG G, an intervention do(X), outcome Y, observed Z, and conditioned W:

**Rule 1 — Insertion/Deletion of Observations:**
```
P(y|do(x), z, w) = P(y|do(x), w)
  if (Y _||_ Z | X, W) in G_{X-bar}
```
where G_{X-bar} is G with all arrows INTO X removed.

**Rule 2 — Action/Observation Exchange:**
```
P(y|do(x), do(z), w) = P(y|do(x), z, w)
  if (Y _||_ Z | X, W) in G_{X-bar, Z-underbar}
```
where G_{Z-underbar} additionally removes all arrows OUT OF Z.

**Rule 3 — Insertion/Deletion of Interventions:**
```
P(y|do(x), do(z), w) = P(y|do(x), w)
  if (Y _||_ Z | X, W) in G_{X-bar, Z(W)-bar}
```
where Z(W)-bar removes arrows into Z that are not ancestors of W.

**Completeness:** These three rules are *complete* — repeated application can eliminate the do-operator from any identifiable causal quantity. If they cannot eliminate do(), the effect is provably non-identifiable from observational data alone (Huang & Valtorta, 2006; Shpitser & Pearl, 2006).

#### Back-Door Criterion

A set S satisfies the back-door criterion relative to (X, Y) if:
1. No element of S is a descendant of X
2. S blocks every path between X and Y that contains an arrow INTO X

When satisfied, the causal effect is identified by:
```
P(Y=y|do(X=x)) = SUM_s P(Y=y|X=x, S=s) * P(S=s)
```

#### Front-Door Criterion

When no back-door admissible set exists but a mediator M satisfies:
1. X blocks all paths from M to unobserved confounders
2. All directed paths from X to Y go through M

Then:
```
P(Y=y|do(X=x)) = SUM_m P(M=m|X=x) * SUM_{x'} P(Y=y|X=x', M=m) * P(X=x')
```

#### Truncated Factorization (Markovian Models)

For intervention do(X=x_0) in a Markovian model:
```
P(v_1, v_2, ..., v_k | do(x_0)) = PRODUCT_{V_i not in X} P(v_i|pa_i) |_{x=x_0}
```

#### Causal Effect in Markovian Models (Equation 24)

```
P(Y=y|do(X=x)) = SUM_t P(y|t,x) * P(t)
```
where T represents the direct causes (parents) of X in the DAG.

#### d-Separation

Set S *d-separates* X from Y in DAG G if for every path between X and Y:
- Every chain node (A -> B -> C) or fork node (A <- B -> C) has its middle node in S, OR
- Every collider node (A -> B <- C) has B and all descendants of B NOT in S

Consequence: X _||_ Y | S in the distribution (conditional independence).

#### Unit-Level Counterfactuals

```
Y_x(u) := Y_{M_x}(u)
```
where M_x is the modified model with X's equation replaced by constant x, evaluated at context u.

### Tables/Data

**The Define-Assume-Identify-Estimate Protocol:**

| Step | Action | Output |
|------|--------|--------|
| Define | Express target quantity Q as Q(M) | Formal causal query |
| Assume | Encode causal assumptions as DAG | Graphical model |
| Identify | Check if Q is computable from P(v) | Identifiability proof |
| Estimate | Compute statistical estimate or bounds | Numerical answer |

**Linear SCM Example:**
```
y = beta*x + u_Y

Cov(X,Y) = beta                    (no confounding)
Cov(X,Y) = beta + Cov(U_Y, U_X)   (with confounding)
```
This demonstrates why naive regression conflates causal effect (beta) with confounding bias.

### Implications for RCA

SCMs with do-calculus interventions can identify **true root causes** rather than correlated symptoms. In fault diagnosis:
- **Level 1 (association):** "Component A and failure B co-occur" — insufficient for RCA
- **Level 2 (intervention):** "If we fix component A, failure B probability drops by 73%" — actionable RCA
- **Level 3 (counterfactual):** "Given this specific failure, would it have occurred if A had been normal?" — forensic RCA

The back-door and front-door criteria provide concrete algorithms for determining which variables to condition on when estimating root cause effects from observational monitoring data.

---

## Paper 2: Bayesian Networks for Fault Diagnosis — Comparative Evaluation

**Authors:** Paul Ou, Abel Armas Cervantes, Mansoureh Maadi, Kym Baker, Armando Camillo, Sally L. Gras, Michael Kirley
**Year/Venue:** 2026, *Journal of Process Control*, Vol. 160, Art. 103674. DOI: 10.1016/j.jprocont.2026.103674

*Supplemented by:* Ademujimi & Prabhu, "Fusion-Learning of Bayesian Network Models for Fault Diagnostics," *Sensors* 21(22):7633, 2021. Papageorgiou et al., "A systematic review on machine learning methods for root cause analysis towards zero-defect manufacturing," *Frontiers in Manufacturing Technology* 2:972712, 2022.

### Methodology

The Ou et al. (2026) paper evaluates a **two-stage FDD-BN (Fault Detection and Diagnosis — Bayesian Network) framework** where:

1. **Stage 1 — Fault Detection:** Statistical methods (PCA, T-squared, SPE) or ML methods (LSTM-AE, OCSVM) detect anomalies
2. **Stage 2 — Root Cause Diagnosis:** Bayesian network structure learning algorithms construct a causal DAG, then Bayesian inference propagates evidence to identify root causes

**Evaluation benchmarks:**
- Tennessee Eastman Process (TEP) — 52 measured variables, 28 fault scenarios, the gold standard for process fault diagnosis
- Industrial-scale Penicillin Simulation — biopharmaceutical benchmark with all fault scenarios

**Causal discovery algorithms evaluated:**
- PC algorithm (constraint-based)
- GES (Greedy Equivalence Search, score-based)
- NOTEARS (continuous optimization-based)
- DirectLiNGAM (functional causal model-based)

**BN evaluation metrics:**
- Fault Detection Rate (FDR)
- False Alarm Rate (FAR)
- Evidence Accuracy (EA) — measures how well diagnosis identifies the key symptom variable
- Top-K Hit Rate
- Mean Absolute Error (MAE)
- Structural Hamming Distance (SHD) — for DAG accuracy

### Key Results / Formulas

#### Bayesian Network Fundamentals

A Bayesian network is a pair (G, P) where G is a DAG and P is a joint probability distribution factorizing as:

```
P(X_1, X_2, ..., X_n) = PRODUCT_{i=1}^{n} P(X_i | Pa(X_i))
```

where Pa(X_i) denotes the parents of X_i in G.

**Bayesian inference for diagnosis** uses Bayes' theorem:
```
P(Root Cause = c | Evidence = e) = P(e|c) * P(c) / P(e)
```

In practice, belief propagation algorithms (Pearl's message-passing, junction tree) compute posterior probabilities across the network.

#### Key Findings from Ou et al. (2026)

- **ML-based FDD methods offer more robust and consistent performance** across both benchmark datasets compared to statistical methods
- **LSTM-AE and OCSVM** emerged as the most robust methods with high fault detection rate, low false alarm rate, and strong evidence accuracy
- **Automated causal discovery does not consistently yield sufficiently accurate network structures** for effective root cause analysis — the fault detection component is reliable, but structure learning remains the bottleneck
- **Algorithm performance varies based on dataset characteristics** — no single structure learning algorithm dominates

#### Fusion-Learning Results (Ademujimi & Prabhu, 2021)

Structural comparison on UPS fault diagnostics (733 incident logs, 3 years):

| DAG Source | Edges | Variables |
|-----------|-------|-----------|
| Qualitative (NLP from logs) | 41 | 38 |
| Quantitative (sensor data) | 2 | 6 |
| Fused model | 43 | 38 |

- Hill Climbing algorithm achieved **SHD = 5** for top 6 faults vs. expert-derived structure
- Manual annotation: ~20 minutes per incident row, 421 rows across 3 iterations

#### Systematic Review Findings (Papageorgiou et al., 2022)

ML methods for RCA in manufacturing are categorized as:

| Category | Methods | Strengths |
|----------|---------|-----------|
| Deterministic | Association rules, PCA, regression | Interpretable, low compute |
| Probabilistic | Bayesian Networks, Fuzzy Cognitive Maps | Uncertainty quantification, causal structure |
| Deep Learning | CNN, LSTM, ResNet | High accuracy on complex patterns |

Key finding: "Bayesian networks are among the most popular learning models" for probabilistic RCA, but "machine learning methods for root cause analysis seem to be under-explored" in manufacturing contexts despite growing data volumes.

### Tables/Data

**BN Structure Learning Algorithm Comparison (compiled from literature):**

| Algorithm | Type | Assumptions | Scalability | DAG Quality |
|-----------|------|-------------|-------------|-------------|
| PC | Constraint-based | Faithfulness | O(p^d) worst-case | Good on sparse graphs |
| GES | Score-based | Score equivalence | Polynomial for sparse | Consistent under assumptions |
| NOTEARS | Continuous optimization | Acyclicity as constraint | Handles medium-scale | Variable (depends on nonlinearity) |
| DirectLiNGAM | Functional model | Non-Gaussian, linear | O(p^3) | Identifiable (unique DAG) |

### Implications for RCA

1. **Two-stage architecture is practical** — separate fault detection from causal diagnosis
2. **Structure learning is the weak link** — BN inference is reliable once the graph is correct, but learning the graph automatically from data remains unreliable
3. **Domain knowledge integration is critical** — fusion of expert knowledge with data-driven learning (as in Ademujimi's work) significantly improves DAG quality
4. **No single BN method dominates** — method selection must be tuned to data characteristics (linearity, sample size, dimensionality)

---

## Paper 3: Graph-Theoretic Approaches — Centrality Measures for Fault Localization

**Authors:** (Attributed to cloud computing research group, ArXiv 2109.11390)
**Year/Venue:** 2021, ArXiv preprint. Supplemented by: Xin et al., "CausalRCA: Causal inference based precise fine-grained root cause localization for microservice applications," *Journal of Systems and Software* 203:111724, 2023. Lin et al., "RUN: Root Cause Analysis in Microservice Using Neural Granger Causal Discovery," AAAI 2024.

### Methodology

The graph-theoretic approach represents cloud/microservice systems as **directed fault graphs** FG(V, E) where:
- **Nodes** represent individual faults (not components — finer granularity)
- **Edges** represent fault propagation relationships
- **Edge weights** encode conditional failure probabilities (impact factor values)

**Fault Graph Construction:**
```
E_{f1,f2} = P_{f1} * ifv(f1, f2) + Z
P_{f2} = P_{f1} * ifv(f1, f2)
```
where:
- P_{fi} = independent probability of fault i
- ifv(f1, f2) = impact factor value (conditional probability of f2 given f1)
- Z = normalization constant for cyclic dependencies

**Centrality measures evaluated for fault ranking:**

1. **Alpha Centrality (Katz):**
```
C_Katz(f_i) = alpha * SUM_j A_FG(j,i) * C_Katz(f_j) + beta
```
Vector form: C_Katz = beta * (I - alpha * A^T)^{-1}

2. **Eigenvector-Based Rank (EVR):**
```
EVR(f_n) = SUM_j [EVR(f_j) / L(f_j)] * ifv(f_j, f_n)
```

3. **Closeness-Based Rank (CR):**
```
CR(f_n) = SUM_j [1/d(f_n, f_j)] * ifv(f_n, f_j)
```

4. **PageRank** (standard formulation):
```
PR(v) = (1-d)/N + d * SUM_{u in B(v)} PR(u) / L(u)
```
where d = damping factor (typically 0.85), B(v) = set of pages linking to v, L(u) = outgoing link count.

**CausalRCA (Xin et al., 2023)** uses gradient-based causal structure learning (NOTEARS-variant) to construct weighted causal graphs, then applies a dedicated root cause inference mechanism for fine-grained metric-level localization.

**RUN (Lin et al., AAAI 2024)** combines:
- Contrastive learning backbone encoder for time series representation
- Neural Granger causal discovery via time series forecasting
- PageRank with personalization vector for Top-k root cause ranking

### Key Results / Formulas

#### Centrality Measure Performance Comparison

| Centrality Measure | Threshold 0.6 | Threshold 0.7 | Threshold 0.8 |
|-------------------|---------------|---------------|---------------|
| Alpha Centrality | **96.37%** | **93.80%** | **93.17%** |
| Eigenvector | 88.89% | 65.30% | 60.30% |
| Closeness | 76.69% | 61.51% | 42.32% |

**Alpha centrality demonstrated superior performance** at all thresholds. The advantage stems from its consideration of edge weights representing fault influence degrees and its ability to propagate influence through the full graph topology.

**Closeness centrality produced the highest false-positive rates.** Eigenvector centrality showed moderate performance that degraded sharply with increasing thresholds.

#### CausalRCA Performance

- Average **MAP@3 = 0.719** for faulty service metric localization
- **10% improvement** over baseline methods in fine-grained localization
- Average **Avg@5 improvement: 9.43%** over baselines

#### Important Caveat

Research by Borg et al. (*Scientific Reports*, 2019, PMC6497646) demonstrates that "the relation between causal influence and node centrality measures is not straightforward" — centrality is a heuristic proxy for causal importance, not a formal causal quantity.

### Tables/Data

**Comprehensive RCA Method Benchmark (from survey: "Root Cause Analysis for Microservices based on Causal Inference: How Far Are We?" — 21 methods, 8 datasets):**

**Best Performers on Real Microservice Systems (Avg@5):**

| Method | Online Boutique | Sock Shop 1 (CPU) | Sock Shop 1 (MEM) |
|--------|----------------|--------------------|--------------------|
| BARO [t_delta=0] | 0.94-1.00 | 0.94-1.00 | 0.94-1.00 |
| CausalRCA | 0.97-0.98 | 0.97-0.98 | — |
| CIRCA [t_delta=0] | 0.94-0.98 | 0.94-0.98 | — |
| NSigma [t_delta=0] | 0.94-1.00 | 0.94-1.00 | — |

**Weak Performers (Avg@5 typically 0.04-0.47):**
PC, FCI, Granger, LiNGAM, fGES, NTLR-PageRank, random walk, CausalAI, RUN, MicroCause — "mostly perform similarly to Dummy"

**F1 Scores for Causal Graph Construction (Synthetic Datasets):**

| Dataset | Best Method | F1 Score |
|---------|------------|----------|
| CIRCA10 (10 nodes) | PC | 0.49 |
| CIRCA50 (50 nodes) | PC | 0.38 |
| RCD10 | FCI | 0.36 |
| RCD50 | PC | 0.30 |
| CausIL10 | DirectLiNGAM | 0.54 |
| CausIL50 | PC | 0.30 |

"All methods struggle with estimating edge directions."

**Runtime Efficiency (seconds):**

| Method | Small System (10 nodes) | Large System (212 metrics) |
|--------|------------------------|---------------------------|
| NSigma/BARO | 0.01 | 0.01 |
| PC-based | 0.17-0.21 | 129-154 |
| CausalRCA | 51-54 | 1,326 |
| RUN | 1,078-1,095 | Exceeded timeout |

### Implications for RCA

1. **Alpha centrality outperforms PageRank and other measures** for fault localization in directed fault graphs
2. **Simple statistical methods (NSigma, BARO) often outperform complex causal discovery** on real systems when failure time is known precisely
3. **Scalability is a critical differentiator** — neural methods (RUN) are 100,000x slower than statistical baselines
4. **Causal graph quality is low** — even the best methods achieve only F1=0.54 on synthetic benchmarks; real-world graphs are worse
5. **Fine-grained localization** (metric-level, not just service-level) provides significantly more actionable results

---

## Paper 4: Information-Theoretic Fault Localization — Transfer Entropy and Mutual Information

**Authors:** Thomas Schreiber (foundational); Yu & Bhatt (application to alarm series)
**Year/Venue:** Schreiber: 2000, *Physical Review Letters* 85:461-464. DOI: 10.1103/PhysRevLett.85.461. Yu et al.: 2017, *Entropy* 19(12):663. Applications review: Rezaei et al., 2024, *Entropy* (PMC11675792).

### Methodology

#### Shannon Entropy (Foundation)

The base measure of uncertainty for a discrete random variable X:
```
H(X) = -SUM_i p(x_i) * log(p(x_i))
```

#### Conditional Entropy

The expected remaining uncertainty in Y after observing X:
```
H(Y|X) = -SUM_{x,y} p(x,y) * log(p(y|x))
         = H(X,Y) - H(X)
```

#### Mutual Information

Quantifies the statistical dependency between two variables:
```
I(X;Y) = H(X) + H(Y) - H(X,Y)
        = SUM_{x,y} p(x,y) * log[p(x,y) / (p(x)*p(y))]
```
I(X;Y) >= 0, with equality iff X and Y are independent.

**Application to fault diagnosis:** Mutual information identifies which sensor variables share the most information with fault indicators, enabling feature selection for diagnostic models.

#### Kullback-Leibler Divergence

Measures the "distance" between two probability distributions:
```
D_KL(p||q) = SUM_i p(x_i) * log(p(x_i) / q(x_i))
```
D_KL >= 0 (Gibbs' inequality), with equality iff p = q.

**Application:** Comparing the distribution of a variable under normal vs. fault conditions quantifies how much that variable's behavior shifts during failure.

#### Transfer Entropy (Schreiber, 2000)

The core innovation — measures **directed information flow** between time series while conditioning out shared history:

```
T_{X->Y} = H(Y_t | Y_{t-1:t-L}) - H(Y_t | Y_{t-1:t-L}, X_{t-1:t-L})
```

Equivalently expressed as conditional mutual information:
```
T_{X->Y} = I(Y_t ; X_{t-1:t-L} | Y_{t-1:t-L})
```

**Key distinction from time-delayed mutual information:** Standard MI fails to distinguish information that is actually exchanged from shared information due to common history and input signals. Transfer entropy conditions out these shared influences via appropriate conditioning of transition probabilities.

**Properties:**
- T_{X->Y} >= 0
- T_{X->Y} != T_{Y->X} in general (asymmetric — detects directionality)
- Model-free: no parametric assumptions required
- Reduces to Granger causality for Gaussian VAR processes
- Captures nonlinear causal dependencies that Granger causality misses

#### Directed Information (Massey, 1990)

The cumulative transfer entropy:
```
I(X^n -> Y^n) = SUM_{i=1}^{n} I(X^i ; Y_i | Y^{i-1})
```

### Key Results / Formulas

#### Transfer Entropy for Alarm Series (Yu et al., 2017)

Applied to multi-valued alarm series in industrial processes:
- Transfer entropy captures causality between alarm variables that traditional correlation analysis misses
- The method detects **asymmetric coupling** between subsystems — critical for distinguishing upstream root causes from downstream symptoms
- Computational complexity is the main challenge: TE estimation requires sufficient data for accurate probability estimation in high-dimensional spaces

#### Lag-Specific Transfer Entropy

Recent work (PMC12251659) extends TE to identify **time delays** in causal relationships:
```
T_{X->Y}(tau) = I(Y_t ; X_{t-tau} | Y_{t-1:t-L}, X_{t-1:t-L} \ X_{t-tau})
```
This enables root cause identification AND estimation of propagation delay in industrial sensor networks.

#### Information-Theoretic Feature Selection for Fault Diagnosis

Several entropy-based methods support diagnostic feature extraction:

| Method | Application | Mechanism |
|--------|-------------|-----------|
| Approximate Entropy | Bearing fault detection | Quantifies signal regularity |
| Sample Entropy | Battery multi-fault diagnosis | Improved ApEn without self-matching |
| Dispersion Entropy | Rotating machinery faults | Captures signal dispersion patterns |
| Fluctuation-Based DE | Vibration signal analysis | Models amplitude fluctuation dynamics |
| Energy Entropy | Bearing prediction | Frequency-band energy distribution |

### Tables/Data

**Information-Theoretic Measures Comparison for Causal Discovery:**

| Measure | Directional? | Nonlinear? | Model-Free? | Computational Cost |
|---------|-------------|------------|-------------|-------------------|
| Mutual Information | No | Yes | Yes | O(N log N) |
| Time-Delayed MI | Weak | Yes | Yes | O(N log N) |
| Transfer Entropy | **Yes** | **Yes** | **Yes** | O(N * k^{2d}) |
| Granger Causality | Yes | No (linear) | No (VAR) | O(N * p^2) |
| Conditional MI | Yes | Yes | Yes | O(N * k^{3d}) |

where N = sample size, k = histogram bins, d = embedding dimension, p = number of variables.

### Implications for RCA

1. **Transfer entropy is the information-theoretic gold standard** for directed causal discovery — it is model-free, nonlinear, and asymmetric
2. **The curse of dimensionality** limits TE to moderate-dimensional systems; binning/kernel estimation becomes unreliable in high dimensions
3. **Mutual information is excellent for feature selection** — identifying which monitoring variables are most informative about fault states
4. **KL divergence provides fault severity scoring** — larger divergence between normal and fault distributions indicates more anomalous behavior
5. **Lag-specific TE directly estimates fault propagation delays** — critical for root cause sequencing in multi-stage systems

---

## Paper 5: Granger Causality in Systems Monitoring

**Authors:** (Foundational) Clive W. J. Granger; (Review) Ali Shojaie & Emily B. Fox; (Microservice application) Cheng-Ming Lin, Ching Chang, Wei-Yao Wang, Kuang-Da Wang, Wen-Chih Peng
**Year/Venue:** Granger: 1969, *Econometrica* 37(3):424-438. Shojaie & Fox: 2022, *Annual Review of Statistics and Its Application* 9:289-319. Lin et al.: 2024, *AAAI Conference on Artificial Intelligence* 38(1).

### Methodology

#### Granger's Original Definition (1969)

Series Y **Granger-causes** X if predictions of X based on its own past AND the past of Y are better than predictions based only on X's own past. Formally:

```
var[X_t - P(X_t | H_{<t})] < var[X_t - P(X_t | H_{<t} \ Y_{<t})]
```
where H_{<t} is all relevant information up to time t-1.

#### VAR Model Formulation

**Bivariate case (Granger's original formulation):**

Unrestricted model:
```
X_t = a_0 + SUM_{k=1}^{d} a_k * X_{t-k} + SUM_{k=1}^{d} b_k * Y_{t-k} + epsilon_t
```

Restricted model (null hypothesis):
```
X_t = a_0 + SUM_{k=1}^{d} a_k * X_{t-k} + epsilon_t
```

Y Granger-causes X if and only if b_k != 0 for some 1 <= k <= d.

**Multivariate VAR (p-dimensional):**
```
X_t = SUM_{k=1}^{d} A_k * X_{t-k} + e_t
```
where X_t = (X_{1t}, ..., X_{pt})^T, A_k are p x p coefficient matrices, e_t ~ N(0, Sigma).

X_j is Granger causal for X_i iff A^k_{ij} != 0 for some 1 <= k <= d.

#### F-Test for Granger Causality

```
F(p, n-2p-1) = [(SSE_restricted - SSE_unrestricted) / p] / [SSE_unrestricted / (n - 2p - 1)]
```

Equivalently (from Shojaie & Fox):
```
F = [(RSS_red - RSS_full) / (r - s)] / [RSS_full / (T - r)]
```
where r, s = parameters in full and reduced models, T = time series length.

Reject H_0 (no Granger causality) if F > F_critical at chosen significance level.

#### Penalized VAR for High-Dimensional Systems

When p (number of variables) is large relative to T (time series length), standard VAR estimation fails. Penalized approaches:

**Lasso VAR (Fujita et al., 2007):**
```
min_{A_1,...,A_d} SUM_{t=d+1}^{T} ||X_t - SUM_{k=1}^{d} A_k X_{t-k}||_2^2 + lambda * SUM_{k,i,j} |A_{ij}^k|
```

**Group Lasso (Lozano et al., 2009):**
```
Omega(A_1,...,A_d) = lambda * SUM_{i,j=1}^{p} ||(A_{ij}^1, ..., A_{ij}^d)||_2
```
This enforces Granger noncausality by zeroing ALL lags for coefficient A_{ij} jointly — either variable j causes variable i at all lags, or at none.

#### Neural Granger Causality (Tank et al., 2019; Lin et al., 2024)

**Component-wise MLP formulation:**
```
h_t^1 = sigma(SUM_{k=1}^{K} W_{1k} * X_{t-k} + b_1)
h_t^l = sigma(W_l * h_t^{l-1} + b_l),  l = 2,...,L-1
X_t^i = W_L * h_t^{L-1} + b_L + e_t^i
```

Granger noncausality holds if the entire column W_{:j}^{1k} = 0 for all k (variable j's history has zero weight at the input layer).

**LSTM variant:**
```
f_t = sigma(W_f * X_t + U_f * h_{t-1})        [forget gate]
i_t = sigma(W_{in} * X_t + U_{in} * h_{t-1})  [input gate]
o_t = sigma(W_o * X_t + U_o * h_{t-1})        [output gate]
c_t = f_t (.) c_{t-1} + i_t (.) sigma(W_c * X_t + U_c * h_{t-1})
h_t = o_t (.) sigma(c_t)
```
where (.) denotes element-wise multiplication.

**RUN (Lin et al., AAAI 2024):** Combines:
1. Contrastive learning to encode temporal context
2. Neural forecasting model for Granger causal discovery
3. PageRank with personalization vector for Top-k root cause ranking
- Evaluated on synthetic and real-world Sock-Shop microservice datasets
- Metrics: Hit Ratio @ k (HR@k) and Mean Reciprocal Rank (MRR)
- Compared against: epsilon-Diagnosis, AutoMAP, RCD, Psi-PC, CausalRCA

### Key Results / Formulas

#### Seven Restrictive Assumptions of Classical Granger Causality

| # | Assumption | Violation Impact |
|---|-----------|-----------------|
| 1 | Continuous-valued series | Cannot handle categorical/count data |
| 2 | Linear dynamics | Misses nonlinear causal mechanisms |
| 3 | Discrete regular time grid | Fails for irregular sampling |
| 4 | Known lag order | Misspecification biases results |
| 5 | Stationarity | Non-stationary series yield spurious causality |
| 6 | Perfect observation | Measurement error inflates false negatives |
| 7 | Complete system (no hidden confounders) | Confounders create spurious causality |

#### Real-World Microservice RCA Performance

From the comprehensive survey (2408.13729), evaluating 21 methods on 8 datasets:

**Data length sensitivity:**
- RCD: Avg@5 increases from 0.13 to 0.79 on Online Boutique when data length goes from 60 to 600 points
- CausalRCA: Improves from 0.62 to 0.93 on Sock Shop 1 with extended data
- NSigma/BARO: Effective with minimal data when failure time is precise

**Failure time sensitivity:**
- CIRCA and NSigma are sensitive to failure occurrence time specification, especially for large systems (Train Ticket, 212 metrics)
- RCD, epsilon-Diagnosis, and BARO are more robust to imprecise failure timing

**Scalability:** All causal discovery methods are "seven to thousands of times slower" when graph size increases from 10 to 50 nodes.

#### Connection to Transfer Entropy

Transfer entropy reduces to Granger causality for Gaussian VAR processes. For non-Gaussian or nonlinear processes, transfer entropy detects causal dependencies that linear Granger causality misses, but at much higher computational cost and with higher variance.

### Tables/Data

**Granger Causality Extensions Timeline:**

| Year | Extension | Authors | Key Advance |
|------|-----------|---------|-------------|
| 1969 | Original definition | Granger | Spectral + VAR formulation |
| 1972 | MA representation | Sims | Equivalence proof |
| 2000 | Transfer entropy | Schreiber | Model-free nonlinear extension |
| 2007 | Lasso VAR | Fujita et al. | High-dimensional networks |
| 2009 | Group Lasso | Lozano et al. | Joint lag/causality selection |
| 2019 | Neural GC (MLP/LSTM) | Tank et al. | Nonlinear deep learning |
| 2021 | Hawkes process GC | Various | Point process extension |
| 2024 | RUN (contrastive + neural) | Lin et al. | Microservice RCA application |

**Software Implementations:**

| Package | Language | Method |
|---------|----------|--------|
| mgm | R | Multivariate Granger models |
| bigvar | R | High-dimensional VAR |
| ngc | Python | Network Granger causality |
| tigramite | Python | PCMCI causal discovery |
| CausalRCA | Python | Gradient-based causal graphs |

### Implications for RCA

1. **Granger causality is the natural fit for time-series monitoring data** — it directly tests whether one metric's history improves prediction of another
2. **The F-test provides a principled statistical threshold** for declaring causal relationships, unlike correlation-based heuristics
3. **Classical Granger fails on nonlinear systems** — neural extensions or transfer entropy are needed for complex microservice interactions
4. **High-dimensional penalty methods (Group Lasso)** enable network-wide causal discovery from monitoring data with hundreds of metrics
5. **Scalability remains the critical bottleneck** — simple statistical methods often outperform sophisticated causal discovery on real systems because they complete in time

---

## Cross-Cutting Synthesis: Mathematical Methods in Practical RCA

### The RCA Mathematical Pipeline

The five mathematical frameworks form a natural pipeline for root cause analysis:

```
[Time Series Monitoring Data]
        |
        v
[1. Information Theory] --- Entropy-based anomaly detection
   H(X_fault) >> H(X_normal)  identifies affected variables
   MI feature selection narrows the search space
        |
        v
[2. Granger Causality] --- Temporal causal discovery
   VAR/Neural GC on metric time series
   Builds directed causal graph from data
        |
        v
[3. Graph Theory] --- Structural root cause ranking
   Centrality measures (Alpha, PageRank) on causal graph
   Ranks nodes by causal influence
        |
        v
[4. Bayesian Networks] --- Probabilistic diagnosis
   BN inference with evidence propagation
   P(Root Cause | Observed Symptoms)
        |
        v
[5. Structural Causal Models] --- Interventional reasoning
   do-calculus for "what if we fix X?"
   Counterfactuals for forensic attribution
```

### Method Selection Guide

| System Property | Recommended Method | Why |
|----------------|-------------------|-----|
| Linear, low-dimensional, regular time series | Classical Granger (F-test) | Principled, fast, well-understood |
| Nonlinear, moderate-dimensional | Transfer Entropy | Model-free, captures nonlinear coupling |
| High-dimensional (100+ metrics) | Penalized VAR (Group Lasso) | Scales with sparsity assumption |
| Known causal structure, uncertain parameters | Bayesian Network inference | Principled uncertainty quantification |
| Unknown structure, need direction | PC + Alpha Centrality | Constraint-based discovery + ranking |
| Need interventional predictions | SCM + do-calculus | Only framework for "what if we fix?" |
| Real-time, precise failure time known | NSigma/BARO | 0.01s runtime, Avg@5 > 0.94 |

### Key Numbers for Practitioners

| Metric | Value | Context |
|--------|-------|---------|
| Alpha centrality accuracy | 96.37% | Fault localization at 0.6 threshold |
| Best causal graph F1 | 0.54 | DirectLiNGAM on 10-node synthetic |
| Best Avg@5 on real systems | 0.94-1.00 | BARO/NSigma with known failure time |
| CausalRCA MAP@3 | 0.719 | Fine-grained metric localization |
| Runtime ratio (simple:complex) | 1 : 100,000 | NSigma (0.01s) vs RUN (1,095s) |
| Graph construction F1 at 50 nodes | 0.30-0.38 | All methods degrade with scale |
| Data sensitivity range | 0.13 → 0.79 | RCD Avg@5 with 10x more data |
| Structure learning SHD | 5 | Fused BN vs expert (6 top faults) |

### Fundamental Tensions in RCA Mathematics

1. **Accuracy vs. Speed:** The most theoretically rigorous methods (SCM, neural GC) are orders of magnitude slower than statistical baselines. In production RCA, a 0.01-second answer that is 90% accurate often beats a 1,000-second answer that is 95% accurate.

2. **Identifiability vs. Practicality:** Pearl's do-calculus provides the only mathematically sound framework for causal claims, but it requires a correct causal graph — and graph discovery F1 scores rarely exceed 0.50 on realistic systems.

3. **Linearity vs. Generality:** Granger causality and BN structure learning assume linearity or specific distributional forms. Transfer entropy and neural methods handle nonlinearity but suffer from variance and computational cost.

4. **Observability vs. Confounding:** All methods assume the observed variables capture the true causal system. Hidden confounders (unmonitored components, external factors) generate spurious causal links that no statistical test can detect without structural assumptions.

5. **Structure vs. Anomaly Detection:** The survey evidence shows that simple anomaly scoring (NSigma) often outperforms elaborate causal discovery for RCA. This suggests the bottleneck is not causal reasoning but causal graph quality — when the graph is known, BN inference and do-calculus work well.

### Synthesis Formula: Unified RCA Score

A practical RCA system can combine these mathematical foundations into a unified root cause score:

```
RCA_Score(node_i) = w_1 * C_alpha(node_i)           [graph centrality]
                  + w_2 * T_{node_i -> anomaly}      [transfer entropy to anomaly]
                  + w_3 * P(RC=i | evidence)          [BN posterior]
                  + w_4 * |H(X_i^fault) - H(X_i^normal)|  [entropy shift]
                  + w_5 * GC_Fstat(node_i -> target)  [Granger F-statistic]
```

where weights w_1...w_5 are tuned by domain and system characteristics. This ensemble approach mitigates the weaknesses of any single mathematical framework while leveraging their complementary strengths.

---

## References

1. Pearl, J. (2010). "An Introduction to Causal Inference." *The International Journal of Biostatistics*, 6(2):7. PMC2836213.
2. Pearl, J. (2009). "Causal inference in statistics: An overview." *Statistics Surveys*, 3:96-146.
3. Pearl, J. (2009). *Causality: Models, Reasoning, and Inference* (2nd ed.). Cambridge University Press.
4. Ou, P. et al. (2026). "Comparative study of Bayesian Network-based root cause analysis methods for chemical and bioprocess systems." *Journal of Process Control*, 160:103674.
5. Ademujimi, T. & Prabhu, V. (2021). "Fusion-Learning of Bayesian Network Models for Fault Diagnostics." *Sensors*, 21(22):7633.
6. Papageorgiou, K. et al. (2022). "A systematic review on machine learning methods for root cause analysis towards zero-defect manufacturing." *Frontiers in Manufacturing Technology*, 2:972712.
7. (2021). "Fault Localization in Cloud using Centrality Measures." ArXiv:2109.11390.
8. Xin, R. et al. (2023). "CausalRCA: Causal inference based precise fine-grained root cause localization for microservice applications." *Journal of Systems and Software*, 203:111724.
9. Lin, C.-M. et al. (2024). "Root Cause Analysis in Microservice Using Neural Granger Causal Discovery." *AAAI*, 38(1).
10. (2024). "Root Cause Analysis for Microservices based on Causal Inference: How Far Are We?" ArXiv:2408.13729.
11. Schreiber, T. (2000). "Measuring Information Transfer." *Physical Review Letters*, 85:461-464.
12. Rezaei, M. et al. (2024). "Applications of Entropy in Data Analysis and Machine Learning: A Review." *Entropy* (PMC11675792).
13. Granger, C. W. J. (1969). "Investigating Causal Relations by Econometric Models and Cross-spectral Methods." *Econometrica*, 37(3):424-438.
14. Shojaie, A. & Fox, E. B. (2022). "Granger Causality: A Review and Recent Advances." *Annual Review of Statistics and Its Application*, 9:289-319.
15. Huang, Y. & Valtorta, M. (2006). "Pearl's Calculus of Intervention Is Complete." *UAI*.

## Study Guide — Mathematical Foundations of RCA

Concepts: Bayesian networks, Pearl's do-calculus,
Granger causality, transfer entropy, information theory.

## DIY — Read Pearl chapter 1

*The Book of Why* (Pearl 2018), chapter 1. The
ladder of causation. Accessible.

## TRY — Build a Bayesian network

Use `pgmpy` in Python. Model a small causal system
(sprinkler/rain/grass). Query interventions.
