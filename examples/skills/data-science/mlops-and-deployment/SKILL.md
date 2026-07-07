---
name: mlops-and-deployment
description: MLOps and the production ML lifecycle -- model packaging and serving, CI/CD for ML, experiment tracking, model registries, reproducibility, production monitoring for data and concept drift, retraining pipelines, A/B and shadow deployment, and rollback. Covers batch vs online/real-time inference, REST endpoints, feature stores, data and version pinning, deterministic pipelines, performance-decay detection, and retraining triggers. Use when deploying models to production, serving predictions, monitoring for data or concept drift, setting up ML CI/CD, tracking experiments, managing a model registry, or planning retraining, shadow rollout, and rollback.
type: skill
category: data-science
status: stable
origin: tibsfox
modified: false
first_seen: 2026-07-06
first_path: examples/skills/data-science/mlops-and-deployment/SKILL.md
superseded_by: null
---
# MLOps and Deployment

Machine learning foundations end where a trained, validated model sits on disk. MLOps begins there. It is the operational discipline of taking that model into production and keeping it reliable: packaging and serving it, versioning everything that produced it, automating the path from commit to deployment, watching it degrade against a shifting world, and closing the loop with retraining. A model that scores 0.94 on a held-out test set is a scientific result; a model that still scores 0.94 on live traffic six months later is an engineering achievement. This skill covers the second thing.

**Agent affinity:** breiman (model packaging, serving strategy, evaluation gates), nightingale (pipeline routing, deployment orchestration, monitoring synthesis)

**Concept IDs:** data-science-drift-detection, data-hypothesis-testing, data-data-quality, data-sampling-methods

## The Production ML Lifecycle

Where the ML workflow stops at "deploy," MLOps treats deployment as the midpoint of a loop, not the finish line.

| Stage | Goal | Key operations |
|---|---|---|
| 1. Package | Freeze the trained model into a portable artifact | Serialize weights + preprocessing; pin dependencies; containerize |
| 2. Register | Record the artifact as a governed, versioned asset | Model registry entry with lineage, metrics, stage (staging/prod) |
| 3. Serve | Expose predictions to consumers | Batch job or online endpoint; feature retrieval; latency/throughput SLOs |
| 4. Release | Move new versions into traffic safely | Shadow, canary, A/B; gated promotion; rollback plan ready |
| 5. Monitor | Detect degradation before users do | Operational metrics + data drift + concept drift + performance decay |
| 6. Trigger | Decide when the model must change | Scheduled, drift-based, or performance-based retraining triggers |
| 7. Retrain | Produce the next candidate | Re-run the reproducible pipeline on fresh data; re-enter at stage 1 |

The distinguishing property of ML systems is that **the code is not the only thing that changes** -- the data changes underneath a static model. This is why MLOps is not "DevOps for models": you version and monitor data and models as first-class artifacts, not just source.

## Model Packaging and Serving

### The Artifact Boundary

A deployable model is more than its weights. Package the entire inference function:

- **Model weights / parameters** (the serialized estimator, e.g. `joblib`, ONNX, SavedModel, TorchScript).
- **Preprocessing** -- the exact fitted transformers (scalers, encoders, vocabularies). A model shipped without its scaler is a silent failure waiting to happen.
- **A signature** -- input schema (names, dtypes, shapes) and output schema, so consumers and monitors can validate.
- **Environment** -- pinned dependency versions, ideally a container image, so the runtime matches training.

Prefer an interchange format (ONNX, PMML) or a container over pickling a raw Python object: pickled objects are brittle across library versions and are a code-execution risk if the source is untrusted.

### Serving Patterns

| Pattern | Latency | How predictions are produced | Use when |
|---|---|---|---|
| **Batch (offline)** | Hours/days | Score a whole dataset on a schedule; write results to a table | Recommendations, churn scores, risk lists -- consumers read precomputed output |
| **Online / real-time (synchronous)** | ms | A request hits a REST/gRPC endpoint and blocks for the prediction | Fraud checks, search ranking, anything in a user request path |
| **Streaming (async)** | sub-second to seconds | Score events off a queue/stream, emit to a downstream topic | Event-driven pipelines, near-real-time enrichment |
| **Edge / embedded** | ms, offline | Model runs on device (mobile, IoT) | No connectivity, privacy, or hard latency constraints |

Batch is cheaper and simpler; reach for online serving only when a fresh prediction must exist *at request time* for an input you could not have precomputed.

### Online Endpoints (REST)

An online model is a service. Design it like one:

- **Contract:** stable request/response schema; validate inputs against the model signature and reject malformed payloads (a 4xx beats a garbage prediction).
- **Health and readiness:** liveness for the process, readiness that confirms the model artifact loaded.
- **Latency budget:** the model is one hop; feature lookups, network, and serialization all count. Measure p99, not the mean.
- **Scaling:** stateless replicas behind a load balancer; autoscale on throughput. Warm the model at startup so the first request is not a cold-start outlier.
- **Batching:** micro-batch concurrent requests for throughput on GPU-bound models, trading a little latency.

### Feature Stores

The hardest online-serving bug is **training/serving skew**: the features computed offline for training differ subtly from those computed online at inference. A feature store solves this by computing each feature once and serving it to both paths.

- **Offline store** (columnar warehouse) provides point-in-time-correct features for training -- crucially, the feature *as it was known at label time*, never leaking the future.
- **Online store** (low-latency key-value) serves the same feature definitions at inference in milliseconds.
- **Shared definitions** guarantee the same transformation logic feeds training and serving, eliminating skew and enabling feature reuse across models.

## Reproducibility

If you cannot rebuild a model bit-for-bit from recorded inputs, you cannot debug it, audit it, or trust its retraining.

### Version and Pin Everything

| What | How | Why |
|---|---|---|
| **Code** | Git commit SHA | The transformation and training logic |
| **Data** | Dataset version / snapshot hash (DVC, lakeFS, immutable partitions) | Data is the second half of the model; "latest" is not reproducible |
| **Config / hyperparameters** | Checked-in config, logged per run | The knobs that produced this artifact |
| **Environment** | Pinned lockfile + container image digest | Library versions change numeric results |
| **Model** | Registry version + hash | The output, linked back to all of the above |

A model artifact should carry **lineage**: given a version, you can name the exact code SHA, data version, and config that produced it.

### Deterministic Pipelines

- **Seed** every stochastic step (splits, initialization, shuffling, augmentation) and record the seed.
- Beware nondeterminism you do not control -- unordered parallel reductions, GPU kernel nondeterminism, dict/set ordering. Pin what you can; document what you cannot.
- Make the pipeline **idempotent**: re-running a stage on the same inputs yields the same outputs, so partial failures re-run safely.

## Experiment Tracking and Model Registries

### Experiment Tracking

During development you will train hundreds of candidates. Track each run's **parameters, metrics, code version, data version, and artifacts** (MLflow, Weights & Biases, or equivalent) so you can compare runs, reproduce the winner, and answer "why did we ship this one?" months later. An untracked experiment is a result you cannot defend.

### Model Registry

The registry is the governed inventory of models that are candidates for or are in production. It provides:

- **Versioning** -- immutable, numbered model versions with their metrics and lineage.
- **Stage transitions** -- `None -> Staging -> Production -> Archived`, with an explicit, often gated, promotion step.
- **A single source of truth** -- serving infrastructure pulls "the Production version of model X," decoupling deployment from any one training run.
- **Governance** -- who promoted what, when, and against which evaluation. This is the audit trail regulators and incident reviews ask for.

## CI/CD for ML

Classic CI/CD ships code. ML adds two more moving parts -- data and models -- so the discipline extends to **CI/CD/CT** (continuous training).

- **Continuous Integration** extends beyond unit tests to *data validation* (schema, ranges, distributions) and *model validation* (does the retrained candidate beat the current production model on a frozen evaluation set and on fairness/slice metrics?).
- **Continuous Delivery** deploys not just a service but a *training pipeline*; the deliverable is a repeatable pipeline that can produce a model, not only the model.
- **Continuous Training** automatically retrains and re-validates when triggered (see Retraining Triggers), producing a new registry candidate.

**Gate promotion on evaluation, never on "it trained."** A candidate must clear: no regression on the reference test set, acceptable performance on protected slices, and passing data-validation checks. Only then does it become eligible for release. Test the *pipeline*, not just the model -- most production failures are plumbing (a schema change, a null feature), not modeling.

## Monitoring in Production

A deployed model degrades silently: it keeps returning confident predictions while the world drifts away from its training distribution. Monitor three layers.

**1. Operational health** (it is a service): latency, throughput, error rate, saturation. Necessary but not sufficient -- a model can be perfectly healthy operationally while making increasingly wrong predictions.

**2. Data and model quality:**

| Signal | What it means | How to detect | Latency to detect |
|---|---|---|---|
| **Data drift (covariate shift)** | P(X) changes -- inputs no longer look like training data | Compare live feature distributions to a training baseline (PSI, KL divergence, KS test, Chi-square) | Immediate -- needs only inputs |
| **Concept drift** | P(y \| X) changes -- the input/output relationship itself shifts | Track prediction quality once labels arrive; monitor prediction distribution as an early proxy | Delayed -- needs ground-truth labels |
| **Label / prediction drift** | P(y-hat) shifts | Compare the output distribution to the training-time label distribution | Immediate -- an early warning before labels land |
| **Performance decay** | Accuracy/AUC/RMSE fall over time | Recompute metrics on labeled production data by time window | As fast as labels arrive |
| **Data quality break** | Nulls, new categories, out-of-range, schema change | Assertions/validation at the serving boundary | Immediate |

Distinguish drift types because the fix differs: **data drift** may only need recalibration or retraining on recent data; **concept drift** means the learned relationship is stale and the model must relearn. Concept drift can be *sudden* (a policy change), *gradual*, *incremental*, or *recurring* (seasonality) -- and each calls for a different retraining cadence.

**3. The label-latency problem:** ground truth often arrives late (a loan default surfaces months later) or never. When you cannot measure accuracy in real time, use **proxy signals** -- input drift, prediction drift, and business KPIs -- as leading indicators, and reserve delayed labels for confirmation.

## Retraining Triggers and Pipelines

Retraining is the loop that keeps a model current. Choose a trigger policy:

| Trigger | Mechanism | Best for |
|---|---|---|
| **Scheduled** | Retrain on a fixed cadence (nightly/weekly) | Steady, predictable drift; simplest to operate |
| **Performance-based** | Retrain when a monitored metric crosses a threshold | Costly retraining; you retrain only when quality demands it |
| **Drift-based** | Retrain when input/prediction drift exceeds a bound | Fast-moving inputs where labels lag |
| **Data-volume-based** | Retrain when N new labeled examples accumulate | Cold-start growth; label-scarce domains |

A retraining pipeline is the *same* reproducible pipeline used originally, re-run on fresh data: assemble and validate new data, retrain, evaluate the candidate against the current production model on a frozen set, and -- only if it wins and passes checks -- register it and hand it to the release stage. Automate the candidate; keep a human (or a hard gate) on promotion. Guard against **feedback loops**: when a model's own predictions influence the data it later trains on (a ranker teaches users what to click), naive retraining amplifies its own biases. Log the decisions the model influenced so you can correct for them.

## Progressive Deployment and Rollback

Never flip 100% of traffic to a new model version at once. Release progressively so a bad model is contained.

| Strategy | How it works | What it answers |
|---|---|---|
| **Shadow (dark launch)** | New model scores live traffic in parallel; its output is logged, not served | "Does it behave sanely on real inputs?" -- zero user risk |
| **Canary** | Route a small % of traffic to the new version, watch metrics, ramp up | "Is it safe to widen?" |
| **A/B test** | Split traffic between versions and compare a business metric with statistical rigor | "Is the new model actually *better* for users?" |
| **Blue-green** | Stand up the new version alongside the old, switch over, keep old warm | Instant cutover with an instant fallback |

**Shadow answers correctness, A/B answers value.** Shadow deployment catches operational and sanity failures before any user is affected; A/B testing measures whether the offline metric gain translates to a real outcome (offline AUC gains routinely fail to move the business metric).

**Rollback** is the non-negotiable safety net. Because the previous model is an immutable, registered artifact, rollback is a **version pointer change**, not a rebuild: repoint the serving layer at the last-known-good Production version. Keep the prior version deployable and warm; define, in advance, the metric thresholds that trigger an automatic rollback. A deployment strategy without a tested rollback path is not a deployment strategy.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Shipping the model without its preprocessing | Serving computes features differently than training | Package the fitted transformers with the model; or use a feature store |
| Training/serving skew | Offline and online feature logic diverge | Single feature definition serving both paths; monitor feature parity |
| Monitoring only latency/errors | The model degrades silently while "healthy" | Add data-drift, prediction-drift, and performance monitors |
| Assuming labels arrive quickly | Performance can't be measured for weeks/months | Use drift and prediction proxies as leading indicators |
| "Latest" data, no versioning | The model is irreproducible; you can't audit or debug | Pin data version + code SHA + config in the model's lineage |
| Promoting on "it trained" | Regressions and fairness violations slip to prod | Gate promotion on evaluation vs the current production model |
| Big-bang 100% deploy | A bad version hits every user at once | Shadow, then canary/A-B, with a tested rollback |
| Ignoring feedback loops | The model trains on data it shaped, amplifying bias | Log influenced decisions; hold out control traffic |

## Cross-References

- **breiman agent:** Model selection and evaluation -- the quality gate a retrained candidate must clear before promotion.
- **nightingale agent:** Department routing and synthesis -- orchestrating the deploy/monitor/retrain loop across specialists.
- **machine-learning-foundations skill:** The training-side counterpart; produces the validated model this skill takes to production. Its final workflow stage ("deployment") is this skill's entire subject.
- **experimental-design-ds skill:** The statistical backbone of A/B tests and shadow evaluations -- randomization, sample size, and causal reading of a rollout.
- **ethics-governance skill:** Fairness monitoring, model cards, and the accountability trail that model registries and gated promotion make enforceable.
- **data-wrangling skill:** The reproducible transformation chain that feature stores and retraining pipelines depend on.

## References

- Sculley, D., et al. (2015). "Hidden Technical Debt in Machine Learning Systems." *Advances in Neural Information Processing Systems (NeurIPS)*, 28.
- Breck, E., Cai, S., Nielsen, E., Salib, M., & Sculley, D. (2017). "The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction." *IEEE International Conference on Big Data*, 1123-1132.
- Huyen, C. (2022). *Designing Machine Learning Systems*. O'Reilly Media.
- Gama, J., Zliobaite, I., Bifet, A., Pechenizkiy, M., & Bouchachia, A. (2014). "A Survey on Concept Drift Adaptation." *ACM Computing Surveys*, 46(4), 1-37.
- Paleyes, A., Urma, R.-G., & Lawrence, N. D. (2022). "Challenges in Deploying Machine Learning: A Survey of Case Studies." *ACM Computing Surveys*, 55(6), 1-29.
