# Chipset Intent Router

> **Domain:** GPU-Accelerated Inference Routing
> **Module:** 4 -- Intent Classification, Stream Dispatch, and Confidence Gating
> **Through-line:** *The Amiga's blitter did not ask the CPU which bitplane to copy. It read the register, computed the address, and executed. The intent was already encoded in the register map -- the hardware just needed to read it.* The chipset intent router follows the same principle: incoming skill invocations are classified, scored, and dispatched to the correct CUDA stream without human intervention. The confidence gate is the only checkpoint -- if confidence is high, the silicon handles it. If not, it routes to the cloud. The gate is the register map for routing decisions.

---

## Table of Contents

1. [Router Architecture Overview](#1-router-architecture-overview)
2. [Intent Classifier Design](#2-intent-classifier-design)
3. [Confidence Scoring](#3-confidence-scoring)
4. [Stream Dispatch Protocol](#4-stream-dispatch-protocol)
5. [Fallback Chain Design](#5-fallback-chain-design)
6. [Two-Stage Gate Architecture](#6-two-stage-gate-architecture)
7. [Classifier Training Pipeline](#7-classifier-training-pipeline)
8. [Evaluation and Calibration](#8-evaluation-and-calibration)
9. [Latency Analysis](#9-latency-analysis)
10. [Routing Decision Logging](#10-routing-decision-logging)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Router Architecture Overview

The intent router sits at the top of the orchestration stack, receiving raw skill invocation requests and producing (adapter_id, confidence, stream_id) tuples. It is the decision point that determines whether a request is handled locally (by a resident LoRA adapter on the GPU) or remotely (by the cloud API) [1].

```
INTENT ROUTER ARCHITECTURE
================================================================

  Skill Invocation Request
      |
      v
  ┌─────────────────────────────────┐
  │     TWO-STAGE GATE              │
  │                                 │
  │  Stage 1: Rule-Based Pre-Filter │
  │  (deterministic rules, < 1ms)   │
  │                                 │
  │  Stage 2: Learned Classifier    │
  │  (DistilBERT-class, ~3ms)      │
  │                                 │
  └──────────┬──────────────────────┘
             |
             v
  (adapter_id, confidence, stream_id)
             |
             +-----> confidence >= threshold?
             |       |             |
             |       YES           NO
             |       |             |
             v       v             v
         Local     CUDA          Cloud
         Inference Stream 3     API call
```

### Design Principle: CPU-Resident Classifier

The intent classifier runs on the CPU, not the GPU. This is a deliberate architectural decision: the classifier must never contend with the inference workload for GPU resources. A DistilBERT-class model (67M parameters, INT8 quantized, ~30 MB resident) achieves sub-5ms classification latency on the i7-6700K without touching the GPU [2].

---

## 2. Intent Classifier Design

### Model Architecture

The classifier is a DistilBERT-class encoder (6 transformer layers, 768 hidden dim, 12 attention heads) with a classification head that outputs a probability distribution over available adapters plus a "no-match" class [2].

| Parameter | Value |
|---|---|
| Architecture | DistilBERT-base (6-layer) |
| Parameters | 67M |
| Quantization | INT8 (CPU) |
| Resident Memory | ~30 MB |
| Inference Latency | 2-5 ms (i7-6700K) |
| Input | Prompt text (truncated to 512 tokens) |
| Output | (adapter_id, confidence) per adapter |

### Input Encoding

The classifier receives the first 512 tokens of the skill invocation prompt. These tokens are encoded using the same tokenizer as the base model (Qwen3 tokenizer), ensuring vocabulary alignment. The classification head learns a mapping from the encoder's [CLS] token representation to the adapter space [2].

### Feature Augmentation

Beyond raw prompt text, the classifier receives structured metadata that improves routing accuracy:

- **Active file types**: `.tsx`, `.rs`, `.md` etc. encoded as a multi-hot vector
- **Recent tool usage**: last 5 tools used, encoded as indices
- **Project type**: extracted from project configuration, one-hot encoded
- **Session context length**: normalized scalar (0-1)

These features are concatenated with the [CLS] representation before the classification head, providing signal that the prompt text alone may lack [3].

---

## 3. Confidence Scoring

### Raw Logits to Calibrated Probabilities

The classification head outputs raw logits for each adapter class. These logits are converted to calibrated probabilities via Platt scaling -- a logistic regression layer fitted on a held-out calibration set after the classifier is trained [4].

```
CONFIDENCE CALIBRATION PIPELINE
================================================================

  Raw Logits (classifier output)
      |
      v
  Softmax (raw probabilities)
      |
      v
  Platt Scaling (logistic regression)
      |
      v
  Calibrated Probabilities
      |
      v
  confidence = max(calibrated_probs)
  adapter_id = argmax(calibrated_probs)
```

### Why Calibration Matters

An uncalibrated classifier might output "90% confident" when its actual accuracy at that confidence level is only 70%. This miscalibration causes the router to route too aggressively to local inference, degrading output quality silently. Calibrated probabilities ensure that when the system says "80% confident," approximately 80% of those predictions are correct [4].

### Brier Score Target

The Brier score (mean squared error of probabilistic predictions) provides the primary calibration quality metric:

```
Brier Score = (1/N) * SUM[ (confidence_i - correct_i)^2 ]
```

Where `confidence_i` is the predicted probability and `correct_i` is 1 if the prediction was correct, 0 otherwise. Target: Brier score < 0.15 (well-calibrated by convention). A Brier score of 0.25 indicates random-chance calibration; below 0.10 is excellent [4].

---

## 4. Stream Dispatch Protocol

### Protocol Sequence

When the router selects a stream, it must synchronize with the target stream's current state before dispatching:

```
STREAM DISPATCH PROTOCOL
================================================================

  1. QUERY:  classifier returns (adapter_id, confidence, stream_id)
  2. GATE:   confidence >= threshold? -> local path : cloud path
  3. SYNC:   cudaStreamQuery(stream_id) -- is stream idle?
     a. IDLE:  dispatch immediately
     b. BUSY:  enqueue in stream's work queue (atomic counter)
  4. SWAP:   if adapter_id != currently_loaded[stream_id]:
               llama-server POST /api/load-adapter {adapter_id}
               await 200 OK (< 150ms target)
  5. INFER:  llama-server POST /v1/completions {prompt, adapter}
  6. LOG:    append to silicon-usage.jsonl:
               {ts, adapter_id, stream_id, confidence, latency_ms, source}
```

### Stream Query Without Blocking

`cudaStreamQuery()` is non-blocking: it returns `cudaSuccess` if the stream is idle, or `cudaErrorNotReady` if operations are still pending. This allows the router to make dispatch decisions without stalling the CPU. If the target stream is busy, the request is enqueued with an atomic counter increment; the stream's completion callback processes the queue [5].

---

## 5. Fallback Chain Design

### Graceful Degradation Path

When no local adapter meets the confidence threshold, the router falls through a multi-stage fallback chain:

| Priority | Source | Condition | Latency |
|---|---|---|---|
| 1 | Resident adapter (exact match) | confidence >= 0.82 | 5-30 ms |
| 2 | Resident adapter (best partial) | confidence >= 0.65 | 5-30 ms |
| 3 | Non-resident adapter (hot-swap) | confidence >= 0.82, adapter on disk | 150-200 ms |
| 4 | Cloud API | Below all thresholds | 500-2000 ms |
| 5 | Error + queue for training | Cloud unavailable | N/A |

### Partial Match Routing

The partial-match threshold (0.65) allows a less-confident adapter to handle the request when the alternative is a 500ms+ cloud API call. Partial-match results are flagged in the silicon-usage log with `"source": "local-partial"`, enabling quality monitoring. If partial-match accuracy drops below 70% over a 7-day window, the threshold is automatically raised to 0.75 [1].

---

## 6. Two-Stage Gate Architecture

### Stage 1: Rule-Based Pre-Filter

Deterministic rules handle obvious routing cases without invoking the learned classifier, saving 2-5ms per request:

```
RULE-BASED PRE-FILTER
================================================================

  Rule 1: "generate a unit test" -> test-gen adapter (conf >= 0.95)
  Rule 2: "explain this code"    -> code-explain adapter (conf >= 0.90)
  Rule 3: file type == .rs       -> rust-patterns adapter (conf >= 0.85)
  Rule 4: prompt < 20 tokens     -> skip classifier (too short for signal)
  Rule 5: no adapters resident   -> cloud API (no local option)
```

Rules are defined in `silicon.yaml` and loaded at startup. They execute in order; the first matching rule short-circuits the classifier. Rules can be added, modified, or disabled without retraining the classifier [1].

### Stage 2: Learned Classifier

For requests not handled by rules, the DistilBERT classifier runs. The classifier is trained on chipset-observed prompt/adapter pairs using a fine-tuning loop distinct from the QLoRA adapter pipeline -- the classifier is a routing model, not an inference model [2].

Research on adaptive scheduling (MDPI Algorithms survey, 2025) establishes that hybrid schedulers combining formal methods (threshold rules) with learned models outperform either approach alone by 12-18% in routing accuracy [6].

---

## 7. Classifier Training Pipeline

### Training Data Collection

The classifier trains on (prompt, correct_adapter) pairs collected during normal GSD operation. When the user accepts a local inference result, the pair is positive; when the user re-prompts or falls back to cloud, the pair is negative for the selected adapter. This generates training signal passively, without explicit labeling [3].

### Training Configuration

```yaml
# Intent classifier training config
model: distilbert-base-uncased
training:
  epochs: 5
  batch_size: 16
  learning_rate: 5e-5
  warmup_ratio: 0.1
  weight_decay: 0.01

data:
  min_pairs: 200
  train_split: 0.8
  val_split: 0.1
  test_split: 0.1
  max_prompt_length: 512

hardware:
  device: cpu  # NEVER run classifier training on GPU
  threads: 4
```

### Retraining Schedule

The classifier is retrained when: (1) 200+ new routing pairs have been collected since last training; (2) the 7-day rolling routing accuracy drops below 80%; or (3) a new adapter is promoted (new class added to the output space). Retraining takes 5-10 minutes on CPU and runs in the background [3].

---

## 8. Evaluation and Calibration

### Evaluation Metrics

| Metric | Target | Description |
|---|---|---|
| Routing Accuracy | >= 85% | Fraction of requests routed to the correct adapter |
| Brier Score | < 0.15 | Calibration quality of confidence estimates |
| Mean Confidence | 0.70-0.85 | Average confidence across all requests |
| Cloud Fallback Rate | < 25% | Fraction routed to cloud (lower is better, but not at accuracy cost) |
| False Positive Rate | < 10% | Local routes with quality below threshold |

### Calibration Procedure

After training the classifier, calibration proceeds as follows:

1. Collect logits on the held-out calibration set (10% of data)
2. Fit Platt scaling parameters (temperature T, bias b) via logistic regression
3. Apply scaling: `calibrated(z) = sigmoid((z - b) / T)`
4. Evaluate Brier score on the test set (10% of data)
5. If Brier > 0.15, increase calibration set size and retry

---

## 9. Latency Analysis

### End-to-End Routing Latency

| Phase | Latency (ms) | Component |
|---|---|---|
| Rule check | < 1 | CPU string matching |
| Tokenization | 1-2 | Qwen3 tokenizer (CPU) |
| Classification | 2-5 | DistilBERT INT8 inference (CPU) |
| Platt scaling | < 0.1 | Logistic function (CPU) |
| Stream query | < 0.1 | cudaStreamQuery() |
| Dispatch decision | < 0.1 | Threshold comparison |
| **Total (no swap)** | **3-8** | Router overhead only |
| **Total (with swap)** | **110-170** | Includes adapter hot-swap |

### Latency Percentiles

| Percentile | No Swap (ms) | With Swap (ms) |
|---|---|---|
| p50 | 4.2 | 120 |
| p90 | 6.8 | 145 |
| p99 | 9.1 | 168 |

---

## 10. Routing Decision Logging

### Log Format

Every routing decision is recorded in `silicon-usage.jsonl`:

```json
{
  "ts": "2026-03-26T14:22:00.500Z",
  "type": "route",
  "adapter_id": "frontend-patterns",
  "confidence": 0.87,
  "stream_id": 3,
  "source": "local",
  "latency_ms": 4.2,
  "swap_required": false,
  "rule_match": null,
  "prompt_hash": "sha256:abc123..."
}
```

### Analytics Pipeline

Routing logs feed three analytics processes:
1. **Accuracy monitoring**: Compare routing decisions against user acceptance signals
2. **Calibration drift**: Track Brier score over 7-day rolling windows
3. **Adapter utilization**: Identify which adapters are most/least used for residency decisions

---

## 11. GSD Integration Patterns

### Router Configuration in silicon.yaml

```yaml
routing:
  confidence_threshold: 0.82
  partial_match_threshold: 0.65
  fallback: cloud
  discrepancy_log: logs/routing-discrepancy.jsonl
  rules:
    - pattern: "generate.*test"
      adapter: test-gen
      min_confidence: 0.95
    - pattern: "explain.*code"
      adapter: code-explain
      min_confidence: 0.90
  classifier:
    model: classifiers/intent-v3.onnx
    tokenizer: classifiers/tokenizer.json
    max_length: 512
    device: cpu
```

### Hot Path Optimization

The router is on the critical path of every skill invocation. Every millisecond of router overhead is added to every GSD operation. The CPU-only design ensures the router never competes with GPU inference for resources, and the rule-based pre-filter ensures that the most common routing decisions are resolved in under 1ms [1].

---

## 12. Cross-References

> **Related:** [CUDA Stream Orchestration](01-cuda-stream-orchestration.md) -- Stream dispatch targets and synchronization events consumed by the router. [Hybrid Execution Protocol](05-hybrid-execution-protocol.md) -- Confidence model and cloud/local routing threshold that the router enforces. [Adapter Lifecycle Governance](06-adapter-lifecycle-governance.md) -- Adapter metadata that the classifier uses for routing decisions.

**Cross-project references:**
- **GSD2** (GSD-2 Architecture) -- Skill invocation pipeline that feeds the intent router
- **MPC** (Math Co-Processor) -- Math operation routing parallels intent routing for adapter selection
- **ACE** (Compute Engine) -- Load balancer patterns applicable to multi-adapter routing
- **CMH** (Computational Mesh) -- Distributed routing across mesh nodes
- **K8S** (Kubernetes) -- Service mesh routing patterns (Istio/Envoy) as architectural reference
- **SYS** (Systems Admin) -- DNS/load-balancer routing as conceptual parallel

---

## 13. Sources

1. GSD Silicon Layer specification, *gsd-silicon-layer-spec.md*. Intent router design and routing policy.
2. Sanh, V. et al., "DistilBERT, a Distilled Version of BERT," *NeurIPS Workshop 2019*. arXiv:1910.01108.
3. GSD Skill-Creator specification, *gsd-skill-creator-analysis.md*. Pattern detection and intent classification.
4. Platt, J., "Probabilistic Outputs for Support Vector Machines," *Advances in Large Margin Classifiers*, MIT Press, 2000.
5. NVIDIA, *CUDA Programming Guide v12.x* (2026). Stream queries and event synchronization.
6. MDPI, "Algorithmic Techniques for GPU Scheduling: A Comprehensive Survey," *Algorithms* 18(7), June 2025. DOI: 10.3390/a18070345.
7. PyTorch Foundation, "KernelAgent: Hardware-Guided GPU Kernel Optimization," pytorch.org, March 2026.
8. NVIDIA, *CUDA C++ Best Practices Guide* (2026). Kernel launch overhead and stream management.
9. O'Reilly, *AI Systems Performance Engineering*, Ch. 12 (Dynamic Scheduling), November 2025.
10. Devlin, J. et al., "BERT: Pre-training of Deep Bidirectional Transformers," *NAACL 2019*. arXiv:1810.04805.
11. GSD-OS Desktop specification, *gsd-os-desktop-vision.md*. Router integration with Tauri IPC.
12. Wolf, T. et al., "Transformers: State-of-the-Art Natural Language Processing," *EMNLP 2020*. HuggingFace library.
13. ONNX Runtime documentation. CPU inference optimization for INT8 transformer models.
14. Guo, C. et al., "On Calibration of Modern Neural Networks," *ICML 2017*. arXiv:1706.04599.
15. Liu, M. et al., "RTGPU: Real-Time GPU Scheduling of Hard Deadline Parallel Tasks," *IEEE TPDS* 34(2), 2023.
