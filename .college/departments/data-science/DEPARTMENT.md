# Data Science Department

**Domain:** data-science
**Source:** DATA-101 Data Science & Analysis Foundational Knowledge Pack
**Status:** Active
**Purpose:** Data literacy, analysis, visualization, and ethics from K-College -- reading, working with, analyzing, and arguing with data

## Wings

- Data Collection -- Data sources, population vs. sample, sampling bias, data quality, and organization
- Exploratory Analysis -- Measures of center and spread, percentiles, distributions, outliers, correlation
- Visualization & Communication -- Chart types, visual design, misleading graphs, dashboards, data storytelling
- Statistical Inference -- Probability, normal distribution, hypothesis testing, confidence intervals, sampling error
- Data Ethics -- Privacy and consent, data ownership, algorithmic bias, transparency, and responsible practice

## Entry Point

data-data-sources

## Concepts

### Data Collection (4 concepts)
- data-data-sources -- Primary vs. secondary data, structured vs. unstructured, observational vs. experimental
- data-sampling-methods -- Random, stratified, cluster sampling -- when each applies and why
- data-sampling-bias -- Selection, confirmation, and survivorship bias in data collection
- data-data-quality -- Accuracy, completeness, consistency, timeliness -- the four pillars of good data

### Exploratory Analysis (4 concepts)
- data-measures-of-center -- Mean, median, mode -- when each is appropriate and how outliers affect each
- data-measures-of-spread -- Range, IQR, variance, standard deviation -- describing data variability
- data-distributions -- Normal, skewed, bimodal distributions and what shape reveals about data
- data-correlation -- Pearson r, scatter plots, correlation vs. causation -- the most important distinction

### Visualization & Communication (4 concepts)
- data-chart-types -- Bar, line, scatter, histogram, box plot -- matching chart to data type
- data-visual-design -- Color, scale, labels, and the principles of honest visualization
- data-misleading-graphs -- Truncated axes, cherry-picking, dual axes -- recognizing manipulation
- data-data-storytelling -- Narrative structure for findings: context, finding, implication, recommendation

### Statistical Inference (4 concepts)
- data-probability-basics -- Sample spaces, events, conditional probability, independence
- data-normal-distribution -- Z-scores, the 68-95-99.7 rule, central limit theorem
- data-hypothesis-testing -- Null hypothesis, p-values, Type I/II errors, statistical significance
- data-confidence-intervals -- Point estimates, margin of error, interpreting intervals

### Data Ethics (4 concepts)
- data-privacy-consent -- Informed consent, anonymization, GDPR principles, data minimization
- data-algorithmic-bias -- Sources of bias in ML systems, disparate impact, fairness metrics
- data-data-ownership -- Who owns data, open data, data rights and responsibilities
- data-responsible-practice -- Reproducibility, transparency, open science, responsible data use

### Scientific ML & Geosciences Pipelines (2 concepts)
- data-science-data-assimilation-4dvar -- 4D-Variational data assimilation (ECMWF IFS baseline)
- data-science-ai-weather-pipeline -- 2022-2026 ML weather-prediction progression (FourCastNet → AIFS)

### Drift in LLM Systems (3 concepts, Phase 690)
- data-science-semantic-drift -- SD score 0.77–0.79 across major LLMs; 37% paragraph drift onset (Spataru 2024)
- data-science-knowledge-drift -- Misinformation-induced belief shift: +56.6% overconfidence / -52.8% uncertainty (Fastowski 2024)
- data-science-drift-detection -- DriftLens + D3Bench tooling; MMD/ADWIN/Page-Hinkley adapted to LLM context (Greco 2024, Muller 2024)

### Modern Inference & Uncertainty (6 concepts, June-2026 arXiv)
- data-science-conformal-prediction -- Distribution-free, finite-sample-valid prediction intervals via exchangeability (Statistical Inference)
- data-science-prediction-calibration -- Reliability of probabilistic forecasts; reliability diagrams, ECE, recalibration (Statistical Inference)
- data-science-prediction-powered-inference -- Valid, label-efficient inference from a few labels plus many model predictions (Statistical Inference)
- data-science-sequential-testing-by-betting -- Anytime-valid testing via test martingales / e-values over a data stream (Statistical Inference)
- data-science-d-separation -- Graphical conditional-independence criterion on a causal DAG; correlation vs causation made rigorous (Statistical Inference)
- data-science-density-evolution -- Multiscale KDE as heat-flow scale-space; modes and feature lifetimes across bandwidth (Exploratory Analysis)

### June-2026 arXiv T2 (2 concepts)
- data-science-causal-density-ratio -- Causal density functions -- Radon-Nikodym derivatives comparing interventional to observational laws -- act as pointwise density ratios so that… (arXiv:2606.00754)
- data-science-epistemic-aleatoric-uncertainty -- Predictive uncertainty separates into aleatoric (irreducible noise) and epistemic parts, with the epistemic part further split into sample-reducible… (arXiv:2606.12646)

### June-2026 arXiv scan backfill (2 concepts)
- data-science-compression-spectrum -- Unifies episodic memory, procedural skills, and declarative rules as points on one compression axis (5-20x / 50-500x / 1000x+); cross-community citation below 1%, exposing the missing adaptive cross-level compression diagonal (arXiv:2604.15877)
- data-science-heuristics-free-ssl -- LeJEPA replaces a decade of anti-collapse SSL tricks with one provable objective (SIGReg) targeting the isotropic Gaussian; stable 1.8B ViT-g training, 79% ImageNet-1K probe, Spearman ~0.99 loss-to-accuracy (arXiv:2511.08544)

## Calibration Models

- Statistical models -- quantitative domains require precision calibration

## Safety Boundaries

None -- data science department has no safety-critical parameters.
