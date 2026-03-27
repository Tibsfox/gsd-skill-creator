# Hybrid Execution Protocol

> **Domain:** Cloud/Local Inference Routing
> **Module:** 5 -- Confidence Models, Discrepancy Logging, and Adaptive Routing
> **Through-line:** *The Amiga's Copper coprocessor had a simple contract: execute the display list sequentially, yield when the beam reaches a certain position, and never, ever miss a deadline.* Hybrid execution has the same contract: route confidently, fall back gracefully, and never silently degrade quality. The confidence model is the Copper list -- a deterministic sequence of threshold checks that decides, for each request, whether the local GPU or the cloud API is the right execution path. When the model is wrong, the discrepancy logger catches it. When the adapter drifts, the staleness detector flags it. The system does not hope for correctness. It measures it.

---

## Table of Contents

1. [Hybrid Execution Overview](#1-hybrid-execution-overview)
2. [Confidence Model Design](#2-confidence-model-design)
3. [Platt Scaling Calibration](#3-platt-scaling-calibration)
4. [Threshold Calibration Procedure](#4-threshold-calibration-procedure)
5. [Discrepancy Detection](#5-discrepancy-detection)
6. [Continuous Improvement Loop](#6-continuous-improvement-loop)
7. [Degradation Detection](#7-degradation-detection)
8. [Staleness Monitoring](#8-staleness-monitoring)
9. [Cost-Benefit Analysis](#9-cost-benefit-analysis)
10. [Edge Cases and Failure Modes](#10-edge-cases-and-failure-modes)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Hybrid Execution Overview

Hybrid execution mode routes each inference request to either the local GPU (via a resident LoRA adapter) or the cloud API, based on the intent classifier's confidence score. The goal is to maximize local inference (lower latency, zero API cost, privacy-preserving) while maintaining output quality at or above the cloud API baseline [1].

```
HYBRID EXECUTION DECISION TREE
================================================================

  Incoming Request
      |
      v
  Intent Classifier
      |
      v
  confidence >= 0.82 ?
      |          |
     YES         NO
      |          |
      v          v
  LOCAL PATH   confidence >= 0.65 ?
  Stream 3     |          |
  adapter      YES        NO
  inference    |          |
               v          v
            PARTIAL     CLOUD PATH
            LOCAL       API call
            (flagged)   (logged)
      |          |          |
      v          v          v
  ┌──────────────────────────┐
  │  DISCREPANCY LOGGER      │
  │  (5% sample rate)        │
  │  Compare local vs cloud  │
  │  Flag divergence > 0.25  │
  └──────────────────────────┘
```

### The Three Paths

| Path | Trigger | Latency | Cost | Quality |
|---|---|---|---|---|
| Local (full confidence) | confidence >= 0.82 | 5-30 ms | Zero | Adapter-dependent |
| Local (partial match) | 0.65 <= confidence < 0.82 | 5-30 ms | Zero | Lower; monitored |
| Cloud | confidence < 0.65 | 500-2000 ms | API tokens | Baseline quality |

---

## 2. Confidence Model Design

### Calibrated Probability Estimates

The confidence model produces calibrated probability estimates -- meaning the model's stated confidence closely tracks its actual accuracy. When the model says "80% confident," approximately 80% of those predictions should be correct. This is a stronger requirement than simple accuracy: a model can be 90% accurate but poorly calibrated if it always outputs 99% confidence [2].

### Reliability Diagram

A reliability diagram plots predicted confidence (x-axis) against actual accuracy (y-axis). A perfectly calibrated model follows the diagonal. Most neural networks are overconfident -- they cluster in the upper-left quadrant (high confidence, moderate accuracy). Platt scaling corrects this [2].

```
RELIABILITY DIAGRAM (BEFORE / AFTER CALIBRATION)
================================================================

  Accuracy
  1.0 |                                          ..*
      |                                     ..**
  0.8 |                                ..**
      |                           ..**
  0.6 |                      ..**
      |                 ..**               Before: overconfident
  0.4 |            ..**                    (curve below diagonal)
      |       ..**
  0.2 |  ..**                              After: well-calibrated
      |.**                                 (curve follows diagonal)
  0.0 +──────────────────────────────────
      0.0   0.2   0.4   0.6   0.8   1.0
                   Confidence

  Diagonal = perfect calibration
  Curve below diagonal = overconfident
  Curve above diagonal = underconfident
```

### Expected Calibration Error (ECE)

ECE partitions predictions into M bins by confidence, then computes the weighted average of |accuracy - confidence| per bin:

```
ECE = SUM_m (n_m / N) * |accuracy_m - confidence_m|
```

Target ECE: < 0.05. This means the average calibration error across all confidence bins is less than 5 percentage points [2].

---

## 3. Platt Scaling Calibration

### Mathematical Foundation

Platt scaling fits a logistic regression on the classifier's raw logits using a held-out calibration set. Given raw logit z, the calibrated probability is:

```
p(y=1 | z) = sigmoid(a * z + b)
```

Where parameters (a, b) are learned by minimizing the negative log-likelihood on the calibration set. This two-parameter model corrects both the scale and shift of the classifier's confidence distribution [3].

### Implementation

```python
from sklearn.linear_model import LogisticRegression
import numpy as np

def calibrate_platt(logits, labels):
    """Fit Platt scaling parameters on calibration set."""
    lr = LogisticRegression(C=1e10, solver='lbfgs')  # No regularization
    lr.fit(logits.reshape(-1, 1), labels)
    return lr  # .predict_proba() gives calibrated outputs

# Usage
calibrator = calibrate_platt(val_logits, val_labels)
calibrated_probs = calibrator.predict_proba(test_logits.reshape(-1, 1))[:, 1]
```

### Temperature Scaling Alternative

Temperature scaling is a simpler single-parameter variant: `p = softmax(z / T)` where T is learned on the calibration set. It preserves the ranking of predictions (unlike Platt scaling which can change ranking) but has less expressive power. For GSD's router, Platt scaling is preferred because ranking preservation is less important than calibration accuracy [4].

---

## 4. Threshold Calibration Procedure

### Setting the Confidence Threshold

The confidence threshold (default: 0.82) balances two competing objectives: routing more requests locally (lower latency, zero cost) versus maintaining quality (avoiding bad local inference). The threshold is calibrated using a validation set of (prompt, local_response, cloud_response) triples [1].

### Calibration Algorithm

```
THRESHOLD CALIBRATION
================================================================

  For threshold t in [0.50, 0.55, 0.60, ..., 0.95]:
    local_count = count(confidence >= t)
    local_quality = mean_quality(local_responses where confidence >= t)
    cloud_fallback_rate = 1 - (local_count / total)

    score(t) = local_quality * (1 - cloud_fallback_rate)
               - penalty * max(0, baseline_quality - local_quality)

  optimal_threshold = argmax(score(t))
```

### Threshold Adjustment Triggers

The threshold is re-calibrated when:
1. 500+ new routing decisions have been logged since last calibration
2. The 7-day rolling Brier score exceeds 0.15
3. A new adapter is promoted (changes the routing landscape)
4. The user explicitly requests recalibration via `gsd chipset calibrate`

---

## 5. Discrepancy Detection

### Sampling Strategy

Comparing every local inference result against the cloud API would negate the cost savings of local inference. Instead, a sampling strategy validates a subset of local decisions [1]:

| Sampling Rate | Condition | Purpose |
|---|---|---|
| 5% | Normal operation (rolling confidence > 0.75) | Baseline quality monitoring |
| 20% | Degradation warning (rolling confidence 0.60-0.75) | Accelerated detection |
| 50% | Critical (rolling confidence < 0.60) | Maximum visibility |
| 100% | After adapter promotion (first 48 hours) | Validation of new adapter |

### Semantic Similarity Measurement

Discrepancy is measured by computing the cosine similarity between the local response and a sampled cloud response using a lightweight embedding model (all-MiniLM-L6-v2, 23 MB, CPU-resident):

```
similarity = cosine(embed(local_response), embed(cloud_response))
```

When similarity falls below 0.75, the (prompt, local_response, cloud_response) triple is logged as a discrepancy and flagged for the next distillation cycle [1].

### Discrepancy Log Format

```json
{
  "ts": "2026-03-26T14:22:00.750Z",
  "type": "discrepancy",
  "adapter_id": "frontend-patterns",
  "confidence": 0.84,
  "similarity": 0.62,
  "prompt_hash": "sha256:abc123...",
  "local_response_hash": "sha256:def456...",
  "cloud_response_hash": "sha256:ghi789...",
  "flagged_for_training": true
}
```

> **SAFETY WARNING:** Discrepancy logging involves sending a sample of prompts to the cloud API. The `sharing: private` flag in silicon.yaml must be respected -- if an adapter is marked private, its prompts are never sent to the cloud for comparison. Discrepancy detection for private adapters relies on the Brier score and user acceptance signals only.

---

## 6. Continuous Improvement Loop

### Feedback Cycle

```
CONTINUOUS IMPROVEMENT LOOP
================================================================

  Session Activity
      |
      v
  Training Pair Extraction ──> Quality Gates ──> QLoRA Training
      |                                              |
      v                                              v
  Routing Decisions ──> Discrepancy Logger ──> Adapter Update
      |                       |
      v                       v
  Accuracy Monitoring    Staleness Detection
      |                       |
      v                       v
  Threshold Calibration   Retraining Trigger
      |
      v
  Next Session (improved adapter + calibrated threshold)
```

### Loop Timing

| Component | Frequency | Duration |
|---|---|---|
| Training pair extraction | Continuous (session activity) | Real-time |
| QLoRA training | When 50+ new pairs accumulated | 15-30 min |
| Discrepancy sampling | 5% of local inferences | Per-request |
| Accuracy monitoring | 7-day rolling window | Continuous |
| Threshold calibration | On 500+ new decisions | 2-5 min (CPU) |
| Staleness check | Daily | < 1 min |

---

## 7. Degradation Detection

### Multi-Signal Degradation Model

Adapter degradation is detected through three independent signals. When any two of three signals fire simultaneously, the adapter is flagged for retraining [1]:

**Signal 1: Confidence Drop**
The 7-day rolling average confidence for the adapter drops below the declared `confidence_floor` in silicon.yaml. This indicates the classifier is becoming less certain about routing to this adapter.

**Signal 2: Discrepancy Spike**
More than 15 high-divergence samples (similarity < 0.75) accumulate in any 7-day window. This indicates the adapter's responses are drifting from the cloud baseline.

**Signal 3: User Rejection Rate**
More than 20% of the adapter's local inference results are rejected by the user (re-prompted, edited, or replaced) in a 7-day window. This is the strongest signal because it reflects actual user experience.

```
DEGRADATION DETECTION
================================================================

  Signal 1: Confidence Drop          ──┐
  (rolling avg < confidence_floor)     │
                                       ├──> 2 of 3 triggers?
  Signal 2: Discrepancy Spike       ──┤       |
  (15+ divergences in 7 days)         │      YES ──> Flag for retraining
                                       │       |
  Signal 3: User Rejection Rate     ──┘      NO  ──> Continue monitoring
  (> 20% rejection in 7 days)
```

---

## 8. Staleness Monitoring

### Time-Based Staleness

An adapter becomes time-stale when more than `staleness_threshold_days` (default: 30) have elapsed since the last training pair was added. This indicates that the user's workflow may have evolved beyond the adapter's training distribution [5].

### Activity-Based Staleness

An adapter becomes activity-stale when fewer than 10 routing decisions per week target it over a 3-week period. This indicates the adapter is no longer relevant to the user's current work, regardless of its age.

### Staleness Response

| Staleness Type | Action | Dashboard Display |
|---|---|---|
| Time-stale (30 days) | Downgrade to candidate; surface recommendation | Amber icon + "stale" label |
| Activity-stale (3 weeks) | Move to inactive; evict from VRAM residency | Gray icon + "inactive" label |
| Both time + activity stale | Archive; remove from routing consideration | Archive icon |

---

## 9. Cost-Benefit Analysis

### Local vs. Cloud Economics

| Metric | Local Inference | Cloud API |
|---|---|---|
| Latency (p50) | 25 ms | 800 ms |
| Latency (p99) | 150 ms | 3000 ms |
| Cost per request | $0.00 | $0.002-0.01 |
| Privacy | Full (never leaves device) | Prompt sent to cloud |
| Quality (well-tuned adapter) | 90-95% of cloud | Baseline |
| Quality (stale adapter) | 60-80% of cloud | Baseline |
| Availability | Always (no network) | Network-dependent |

### Break-Even Analysis

For a user making 200 skill invocations per day with a cloud API cost of $0.005 per request:
- Cloud-only cost: $1.00/day, $365/year
- Hybrid (75% local): $0.25/day, $91/year
- Annual savings: $274 + latency improvement + privacy benefit

The RTX 4060 Ti consumes approximately 85W during inference (~$0.02/hour at $0.12/kWh). At 8 hours/day of active inference, the electricity cost is $0.16/day. The net savings from hybrid execution remain strongly positive [6].

---

## 10. Edge Cases and Failure Modes

### Edge Case 1: Cold Start

On first session (no trained adapters), all requests route to cloud. Training pairs accumulate passively. The dashboard shows "Learning Mode" with a progress indicator toward the first adapter promotion. Expected time to first adapter: 3-5 sessions with 50+ quality-gated pairs.

### Edge Case 2: Cloud Unavailable

When the cloud API is unreachable, partial-match local routing becomes the best available option. The threshold drops automatically from 0.82 to 0.55 with quality monitoring at maximum sensitivity (50% sampling rate against cached cloud responses). The dashboard shows "Offline Mode" with a quality confidence indicator.

### Edge Case 3: VRAM Pressure During Routing

If VRAM is near capacity during a routing decision, the router checks VRAM availability before attempting an adapter hot-swap. If insufficient VRAM exists and no adapter can be evicted, the request routes to cloud regardless of confidence score. This prevents OOM crashes in the inference pipeline.

### Edge Case 4: Adversarial Confidence

A user who consistently accepts low-quality local responses (to avoid cloud latency) could create a positive feedback loop where the adapter's training data is contaminated. Mitigation: periodic cloud-comparison sampling is mandatory (cannot be disabled) and runs regardless of user acceptance signals.

> **SAFETY WARNING:** The discrepancy sampling rate must never drop to 0%. Even at minimum sampling (5%), the system needs continuous cloud-comparison data to detect silent quality degradation. Disabling discrepancy detection is equivalent to removing the check engine light.

---

## 11. GSD Integration Patterns

### silicon.yaml Configuration

```yaml
routing:
  confidence_threshold: 0.82
  partial_match_threshold: 0.65
  fallback: cloud
  discrepancy_log: logs/routing-discrepancy.jsonl

hybrid:
  sampling_rate_normal: 0.05
  sampling_rate_degraded: 0.20
  sampling_rate_critical: 0.50
  sampling_rate_promotion: 1.00
  promotion_validation_hours: 48
  similarity_threshold: 0.75
  degradation_window_days: 7
  degradation_discrepancy_limit: 15
  degradation_rejection_rate: 0.20
  staleness_threshold_days: 30
  activity_stale_weeks: 3
  activity_stale_min_routes: 10
```

### Dashboard Integration

The hybrid execution module surfaces three key indicators on the Denise panel:
1. **Routing bar**: Percentage of requests routed local vs. cloud (real-time)
2. **Quality gauge**: Rolling 7-day discrepancy rate (target: < 10%)
3. **Adapter health**: Per-adapter confidence trend with staleness warnings

---

## 12. Cross-References

> **Related:** [Chipset Intent Router](04-chipset-intent-router.md) -- Classifier that produces the confidence scores consumed by this module's threshold gate. [LoRA Adapter Pipeline](02-lora-adapter-pipeline.md) -- Training pipeline that receives discrepancy-flagged pairs for retraining. [Adapter Lifecycle Governance](06-adapter-lifecycle-governance.md) -- Staleness detection and promotion criteria that interact with the degradation model.

**Cross-project references:**
- **GSD2** (GSD-2 Architecture) -- Session lifecycle that drives the continuous improvement loop
- **ACE** (Compute Engine) -- Cloud API cost management and fallback routing patterns
- **K8S** (Kubernetes) -- Circuit breaker patterns (Hystrix/Resilience4j) as architectural reference for fallback chains
- **MCF** (Multi-Cluster Federation) -- Federated confidence model aggregation across mesh nodes
- **SYS** (Systems Admin) -- Monitoring alerting patterns for degradation detection
- **OCN** (Open Compute) -- Cost modeling for hybrid cloud/on-premise GPU infrastructure

---

## 13. Sources

1. GSD Silicon Layer specification, *gsd-silicon-layer-spec.md*. Hybrid execution mode and confidence model design.
2. Guo, C. et al., "On Calibration of Modern Neural Networks," *ICML 2017*. arXiv:1706.04599.
3. Platt, J., "Probabilistic Outputs for Support Vector Machines," *Advances in Large Margin Classifiers*, MIT Press, 2000.
4. Hinton, G. et al., "Distilling the Knowledge in a Neural Network," arXiv:1503.02531 (2015). Temperature scaling.
5. GSD Chipset Architecture specification, *gsd-chipset-architecture-vision.md*. Adapter lifecycle governance.
6. RTX 4060 Ti power measurement. Local workstation (PNW), wall-meter reading under sustained inference load.
7. O'Reilly, *AI Systems Performance Engineering*, Ch. 12 (Dynamic Scheduling), November 2025.
8. MDPI, "Algorithmic Techniques for GPU Scheduling: A Comprehensive Survey," *Algorithms* 18(7), June 2025.
9. Reimers, N. and Gurevych, I., "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks," *EMNLP 2019*. arXiv:1908.10084. (all-MiniLM-L6-v2 embedding model.)
10. Niculescu-Mizil, A. and Caruana, R., "Predicting Good Probabilities with Supervised Learning," *ICML 2005*. Calibration evaluation methodology.
11. GSD-OS Desktop specification, *gsd-os-desktop-vision.md*. Dashboard integration and quality indicators.
12. NVIDIA, *CUDA Programming Guide v12.x* (2026). Stream priority and scheduling.
13. Dettmers, T. et al., "QLoRA: Efficient Finetuning of Quantized LLMs," *NeurIPS 2023*. Adapter quality evaluation.
14. NVIDIA, *NVML API Reference Guide* (2026). VRAM pressure monitoring during routing decisions.
15. llama.cpp project, *llama-server API Documentation* (2026). Adapter hot-swap latency measurements.
16. Netflix, "Hystrix: Latency and Fault Tolerance for Distributed Systems," (2020). Circuit breaker patterns for fallback chains.
