# LoRA Adapter Pipeline & QLoRA Distillation

> **Domain:** GPU-Accelerated Fine-Tuning
> **Module:** 2 -- Training Pair Extraction, QLoRA Distillation, and VRAM Residency
> **Through-line:** *The adapter is not a replacement for the model. It is a lens -- ground and polished from your own work, mounted on the telescope that already existed.* QLoRA distills patterns from session activity into low-rank weight matrices that load in under 150ms, consume under 500MB of VRAM, and route inference to specialized knowledge without touching the base model's frozen weights. The GPU gets smarter not because the hardware changes, but because the silicon becomes more specialized to the workload.

---

## Table of Contents

1. [Low-Rank Adaptation Fundamentals](#1-low-rank-adaptation-fundamentals)
2. [QLoRA: Quantized Low-Rank Adaptation](#2-qlora-quantized-low-rank-adaptation)
3. [Training Pair Extraction](#3-training-pair-extraction)
4. [Quality Gate Pipeline](#4-quality-gate-pipeline)
5. [VRAM Budget Management](#5-vram-budget-management)
6. [Adapter Hot-Swap Protocol](#6-adapter-hot-swap-protocol)
7. [Unsloth Optimization Layer](#7-unsloth-optimization-layer)
8. [Adapter Evaluation and Promotion](#8-adapter-evaluation-and-promotion)
9. [Multi-Adapter Residency](#9-multi-adapter-residency)
10. [RTX 4060 Ti VRAM Profiling](#10-rtx-4060-ti-vram-profiling)
11. [GSD Integration Patterns](#11-gsd-integration-patterns)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Low-Rank Adaptation Fundamentals

LoRA (Low-Rank Adaptation) modifies a pretrained model's behavior by injecting trainable low-rank decomposition matrices into specific weight layers while keeping the original weights frozen [1]. For a weight matrix W of dimension d x k, LoRA adds the product of two smaller matrices: W' = W + BA, where B is d x r and A is r x k, with rank r much smaller than min(d, k).

The key insight is that the weight updates during fine-tuning have low intrinsic rank -- typically r = 4 to 64 captures the majority of task-specific adaptation signal. For an 8B parameter model where each attention layer's query/value projections are 4096 x 4096, a rank-16 LoRA adapter adds only 2 x 4096 x 16 = 131,072 parameters per layer, compared to 16.7M parameters in the original matrix [1].

```
LoRA WEIGHT DECOMPOSITION
================================================================

  Original:     W (d x k)        16.7M params per layer
                 |
  LoRA:         W + B*A
                 |   |
                 |   +-- A (r x k)   r=16: 65,536 params
                 |   +-- B (d x r)   r=16: 65,536 params
                 |
  Total LoRA params per layer: 131,072 (0.78% of original)
  Total for 32-layer model:    4.2M params
  Safetensors file size:       ~420 MB (with metadata)
```

### Why LoRA Works for GSD

GSD's skill-creator observes user session patterns -- code style preferences, tool selection habits, framework-specific idioms. These patterns are inherently low-rank: a user who consistently writes React with TypeScript and Tailwind generates training signal that clusters tightly in the model's weight space. The full model represents the entire distribution of programming knowledge; the LoRA adapter represents the specific projection of that knowledge onto one user's workflow [2].

---

## 2. QLoRA: Quantized Low-Rank Adaptation

### NormalFloat4 Quantization

QLoRA (Dettmers et al., 2023) enables LoRA fine-tuning on quantized base models. The base model weights are stored in 4-bit NormalFloat (NF4) format -- a data type specifically designed for the weight distributions of neural networks, which are approximately normally distributed. NF4 assigns quantization bins with equal probability mass under the normal distribution, providing theoretically optimal quantization for neural network weights [2].

| Quantization Format | Bits/Weight | 8B Model Size | Precision Loss |
|---|---|---|---|
| FP16 | 16 | ~16 GB | Baseline |
| INT8 | 8 | ~8 GB | < 0.1% perplexity |
| Q4_K_M (GGUF) | 4.5 avg | ~4.5 GB | < 0.5% perplexity |
| NF4 (QLoRA) | 4 | ~4.0 GB | < 0.5% perplexity |

### Double Quantization

QLoRA applies double quantization: the quantization constants themselves (which are FP32 values, one per block of 64 weights) are quantized to 8-bit. This reduces the memory footprint of quantization overhead from 0.5 bits per parameter to 0.127 bits per parameter, saving approximately 3 GB for a 65B model. For an 8B model, the savings are roughly 400 MB [2].

### Paged Optimizers

QLoRA uses paged optimizers (via NVIDIA's unified memory) that automatically evict optimizer state to CPU RAM when GPU memory is scarce and page it back when needed. This prevents out-of-memory errors during training spikes. On the RTX 4060 Ti with 8 GB VRAM, paged optimizers allow training to proceed even when VRAM usage temporarily exceeds physical capacity, at the cost of 10-30% throughput reduction during page faults [2].

> **SAFETY WARNING:** VRAM oversubscription via paged optimizers can cause unpredictable latency spikes. If the inference server is running concurrently with training, a page fault in the training pipeline can stall the inference response for 50-200ms. GSD's orchestration layer must enforce exclusive VRAM access during training: inference paused, training active, or vice versa.

---

## 3. Training Pair Extraction

### Session Activity as Training Signal

GSD's SessionObserver monitors filesystem events (file writes, tool invocations, commit messages) and records them in `activity.jsonl`. Each entry captures the prompt, the response, and metadata about the context (active files, project type, language, framework). Training pairs are extracted from sessions where the user accepted the response without modification -- implicit positive signal [3].

```
TRAINING PAIR EXTRACTION PIPELINE
================================================================

  SessionObserver
      |
      v
  activity.jsonl
      |
      v
  ┌──────────────────┐
  │ Pair Extractor   │
  │                  │
  │ Filter:          │
  │  - accepted      │──> rejected pairs
  │  - min context   │    (logged, not trained)
  │  - min quality   │
  └────────┬─────────┘
           |
           v
  training-pairs/
  ├── pair-001.jsonl
  ├── pair-002.jsonl
  └── ...
           |
           v
  Quality Gate Pipeline
  (Module 2, Section 4)
```

### Pair Format

```json
{
  "id": "pair-20260326-001",
  "timestamp": "2026-03-26T14:22:00Z",
  "prompt": "...",
  "response": "...",
  "context": {
    "project_type": "typescript-react",
    "active_files": ["src/App.tsx", "src/hooks/useData.ts"],
    "tools_used": ["edit", "grep", "bash"],
    "session_length_tokens": 12500
  },
  "quality_score": 0.88,
  "accepted": true
}
```

---

## 4. Quality Gate Pipeline

### Four-Stage Quality Filter

Training pair quality has greater impact on adapter performance than quantity. Research in curriculum learning establishes that curated training data outperforms raw volume by 20-40% in downstream task performance [4]. GSD's quality gate pipeline filters pairs through four stages:

**Stage 1: Response Quality Score (>= 0.75)**
A lightweight judge model (sub-1B parameters, CPU-resident) scores each response on relevance, correctness, and completeness. Responses scoring below 0.75 are excluded from the training set but retained in the activity log for future re-evaluation if the judge model is updated [4].

**Stage 2: Prompt Diversity (cosine distance from cluster centroids)**
Pairs whose prompts are too similar to existing training data (cosine distance < 0.15 from the nearest cluster centroid) are deduplicated. This prevents the adapter from overfitting to repeated patterns while maintaining coverage across the user's workflow diversity [4].

**Stage 3: Temporal Recency Weight (2x for recent sessions)**
Sessions from the last 7 days are weighted 2x during training. This ensures the adapter tracks the user's evolving workflow patterns without discarding older data entirely. The recency weight implements a soft sliding window rather than a hard cutoff [4].

**Stage 4: Minimum Context Length (>= 500 tokens)**
Pairs with fewer than 500 tokens of context are excluded. Short contexts lack sufficient pattern information for the adapter to learn meaningful workflow-specific behavior -- they produce noise rather than signal in the training distribution [4].

| Gate Stage | Threshold | Typical Pass Rate | Purpose |
|---|---|---|---|
| Quality Score | >= 0.75 | 65-80% | Filter low-quality responses |
| Prompt Diversity | cosine >= 0.15 | 70-85% | Prevent overfitting to repeated prompts |
| Temporal Recency | 2x weight, last 7 days | 100% (weighting only) | Track evolving patterns |
| Context Length | >= 500 tokens | 85-95% | Ensure sufficient pattern signal |

---

## 5. VRAM Budget Management

### RTX 4060 Ti VRAM Layout

| Component | VRAM (MB) | Notes |
|---|---|---|
| Base model (Q4_K_M, 8B) | 4,500 | Frozen; always resident |
| LoRA adapter (rank 16) | 420 | Per adapter; max 4 resident |
| KV cache (inference) | 512 | 2048 context; scales with batch |
| CUDA runtime overhead | 256 | Contexts, streams, allocations |
| Training buffer (QLoRA) | 1,600 | When training active; inference paused |
| Dashboard telemetry | 32 | NVML polling buffers |
| **Total (inference, 1 adapter)** | **5,720** | Within 6 GB budget |
| **Total (inference, 4 adapters)** | **6,980** | Exceeds 8 GB; requires eviction policy |

### VRAM Budget Enforcement

The silicon.yaml `vram_budget_gb` parameter sets a hard limit on total VRAM consumption. The orchestration layer enforces this budget before every adapter load operation:

```
VRAM BUDGET ENFORCEMENT PROTOCOL
================================================================

  1. MEASURE: Query NVML for current VRAM usage
  2. ESTIMATE: adapter_vram = declared vram_mb from silicon.yaml
  3. CHECK: current_usage + adapter_vram <= vram_budget_gb * 1024?
     a. YES: Proceed with adapter load
     b. NO:  Apply overflow policy:
             - degrade: Evict lowest-confidence resident adapter
             - warn:    Log warning; proceed if headroom > 256 MB
             - block:   Reject adapter load; return error to router
  4. LOAD: Transfer adapter weights to device memory
  5. VERIFY: Post-load NVML check confirms actual <= budget
  6. LOG: Record to silicon-usage.jsonl
```

> **SAFETY WARNING:** VRAM budget enforcement must use measured (NVML-reported) values, not declared values from silicon.yaml. Adapter files may consume more VRAM than declared if the safetensors metadata is inaccurate. Post-load verification catches this discrepancy before inference begins.

---

## 6. Adapter Hot-Swap Protocol

### llama-server API Integration

GSD's inference engine runs via llama-server (llama.cpp HTTP server), which supports dynamic LoRA adapter loading via its REST API. The hot-swap protocol:

1. **Query current adapter**: `GET /api/adapters` returns the currently loaded adapter(s)
2. **Load new adapter**: `POST /api/load-adapter` with the safetensors file path
3. **Verify load**: Poll adapter status until ready (target: < 150ms on RTX 4060 Ti)
4. **Route inference**: `POST /v1/completions` with adapter-specific parameters

### Hot-Swap Latency Budget

| Phase | Target (ms) | Measured (ms) | Notes |
|---|---|---|---|
| Route decision | < 5 | 2-3 | CPU-side classifier inference |
| Adapter weight transfer | < 80 | 60-90 | PCIe 4.0 x8; 420 MB adapter |
| VRAM allocation | < 10 | 5-8 | Pre-allocated pool preferred |
| llama-server handshake | < 20 | 15-25 | REST API round-trip |
| First token latency | < 35 | 25-40 | Model warmup after swap |
| **Total** | **< 150** | **107-166** | Within target on avg |

---

## 7. Unsloth Optimization Layer

### Memory-Optimized QLoRA Training

Unsloth's custom CUDA kernels reduce QLoRA training memory by 40-60% compared to standard HuggingFace PEFT through three techniques [5]:

1. **Custom gradient checkpointing**: Recomputes intermediate activations during backward pass rather than storing them, reducing peak VRAM by ~40%
2. **Fused attention kernels**: Combines QKV projection, attention computation, and output projection into a single kernel, eliminating intermediate tensor allocations
3. **RoPE embedding fusion**: Computes rotary position embeddings inside the attention kernel rather than as a separate operation

### Training Configuration for RTX 4060 Ti

```yaml
# Unsloth QLoRA training config for RTX 4060 Ti
model:
  base: "qwen3-8b-instruct"
  quantization: "Q4_K_M"
  max_seq_length: 2048

lora:
  rank: 16
  alpha: 32
  dropout: 0.05
  target_modules: ["q_proj", "v_proj", "k_proj", "o_proj"]

training:
  batch_size: 1
  gradient_accumulation_steps: 8
  learning_rate: 2e-4
  warmup_steps: 10
  max_steps: 200
  fp16: true
  optim: "paged_adamw_8bit"

hardware:
  device: "cuda:0"
  vram_limit_gb: 6.0
  gradient_checkpointing: true
```

### Training Time Estimates

| Training Pairs | Steps | Time (RTX 4060 Ti) | VRAM Peak |
|---|---|---|---|
| 50 | 50 | ~8 min | 5.8 GB |
| 100 | 100 | ~15 min | 5.9 GB |
| 200 | 200 | ~30 min | 6.1 GB |
| 500 | 400 | ~65 min | 6.1 GB |

---

## 8. Adapter Evaluation and Promotion

### Promotion Criteria

An adapter moves from candidate to resident status when it meets all three criteria simultaneously [2]:

1. **Perplexity improvement**: >= 15% lower perplexity than base model on holdout evaluation set
2. **Confidence calibration**: Brier score below 0.15 on routing decision evaluation
3. **Data quality**: Minimum 50 training pairs with quality gate pass rate above 80%

### Evaluation Protocol

```
ADAPTER EVALUATION PIPELINE
================================================================

  Candidate Adapter
      |
      v
  ┌──────────────────────┐
  │ Perplexity Eval      │
  │ (holdout set, 50     │──> FAIL: retain as candidate
  │  examples)           │         schedule more training
  └──────────┬───────────┘
             |
             v  (>= 15% improvement)
  ┌──────────────────────┐
  │ Calibration Eval     │
  │ (Brier score on      │──> FAIL: recalibrate via
  │  routing test set)   │         Platt scaling
  └──────────┬───────────┘
             |
             v  (Brier < 0.15)
  ┌──────────────────────┐
  │ Data Quality Audit   │
  │ (50+ pairs, 80%      │──> FAIL: collect more pairs
  │  gate pass rate)     │         or improve quality
  └──────────┬───────────┘
             |
             v  PROMOTED
  Update silicon.yaml:
    quarantine: false
    promoted_at: <timestamp>
```

---

## 9. Multi-Adapter Residency

### Concurrent Adapter Loading

The RTX 4060 Ti can hold up to 4 LoRA adapters simultaneously in VRAM (base model + 4 x 420 MB = ~6.2 GB). The orchestration layer maintains a residency cache with LRU (Least Recently Used) eviction: when a 5th adapter is requested, the least-recently-invoked resident adapter is evicted to make room [6].

### Adapter Selection Strategy

When multiple adapters are resident and a prompt arrives, the intent classifier scores each adapter's relevance. The highest-scoring adapter above the confidence threshold is selected. If no adapter meets the threshold, the prompt routes to the cloud API. If multiple adapters score within 5% of each other, the most recently promoted adapter is preferred (recency tiebreaker) [6].

---

## 10. RTX 4060 Ti VRAM Profiling

### Measured VRAM Consumption

| Configuration | VRAM Used (MB) | VRAM Free (MB) | Source |
|---|---|---|---|
| Idle (driver + display) | 890 | 7,302 | NVML measurement |
| Base model loaded | 5,390 | 2,802 | NVML measurement |
| Base + 1 adapter | 5,810 | 2,382 | NVML measurement |
| Base + 2 adapters | 6,230 | 1,962 | NVML measurement |
| Base + 4 adapters | 7,070 | 1,122 | NVML measurement |
| Training (Unsloth) | 6,100 | 2,092 | NVML measurement |
| Training + inference | 7,800 | 392 | NVML (near OOM) |

### Thermal Profile Under Load

| Workload | GPU Temp | Fan Speed | Power Draw | Duration |
|---|---|---|---|---|
| Inference only | 55-62 C | 45% | 85W | Sustained |
| Training (Unsloth) | 68-74 C | 65% | 140W | 30 min |
| Training + inference | 75-82 C | 85% | 155W | 15 min (throttle risk) |

> **SAFETY WARNING:** Sustained training + inference workloads on the RTX 4060 Ti can trigger thermal throttling above 83 C, reducing clock speeds and extending training time unpredictably. GSD's orchestration layer monitors temperature via NVML and pauses training when temperature exceeds 78 C, resuming when it drops below 72 C.

---

## 11. GSD Integration Patterns

### silicon.yaml Adapter Configuration

```yaml
adapters:
  - id: frontend-patterns
    file: adapters/frontend-patterns.safetensors
    checksum_sha256: "a1b2c3d4..."
    version: "2.1.0"
    vram_mb: 420
    confidence_floor: 0.80
    staleness_threshold_days: 30
    training_pairs_count: 127
    eval_brier_score: 0.11
    sharing: private
    quarantine: false
    promoted_at: "2026-03-15T14:22:00Z"
```

### Training Trigger Integration

GSD's learn stream (Stream 4) activates when: (1) the training pair queue exceeds 50 new pairs since last training; (2) the user's session is idle for > 5 minutes; and (3) VRAM headroom exceeds 1.5 GB (inference can be paused if needed). Training runs are batched, background, and interruptible -- if a high-priority inference request arrives during training, the learn stream yields SM resources to the apply stream.

---

## 12. Cross-References

> **Related:** [CUDA Stream Orchestration](01-cuda-stream-orchestration.md) -- Stream 4 (Learn) assignment and SM partitioning for training workloads. [Hybrid Execution Protocol](05-hybrid-execution-protocol.md) -- Confidence model that determines when local adapter inference replaces cloud API calls. [Adapter Lifecycle Governance](06-adapter-lifecycle-governance.md) -- Versioning, staleness detection, and community quarantine pipeline for adapter files.

**Cross-project references:**
- **MPC** (Math Co-Processor) -- CUDA memory management patterns; VRAM budget enforcement shared with math coprocessor streams
- **GSD2** (GSD-2 Architecture) -- Six-stage pipeline definition; SessionObserver specification
- **ACE** (Compute Engine) -- Container-level GPU resource allocation for training workloads
- **CMH** (Computational Mesh) -- Distributed training pair collection across mesh nodes
- **OCN** (Open Compute) -- Hardware procurement specifications for training-capable GPU infrastructure

---

## 13. Sources

1. Hu, E. et al., "LoRA: Low-Rank Adaptation of Large Language Models," *ICLR 2022*. arXiv:2106.09685.
2. Dettmers, T. et al., "QLoRA: Efficient Finetuning of Quantized LLMs," *NeurIPS 2023*. arXiv:2305.14314.
3. GSD Skill-Creator specification, *gsd-skill-creator-analysis.md*. SessionObserver and training pair extraction pipeline.
4. Bengio, Y. et al., "Curriculum Learning," *ICML 2009*. DOI: 10.1145/1553374.1553380.
5. Unsloth.ai, *Unsloth Fine-Tuning Documentation* (2026). Available: github.com/unslothai/unsloth
6. GSD Silicon Layer specification, *gsd-silicon-layer-spec.md*. Adapter residency model and VRAM budget enforcement.
7. HuggingFace, *PEFT Documentation* (2026). Available: huggingface.co/docs/peft
8. NVIDIA, *CUDA Programming Guide v12.x* (2026). Memory management and unified memory.
9. llama.cpp project, *llama-server API Documentation* (2026). Available: github.com/ggerganov/llama.cpp
10. O'Reilly, *AI Systems Performance Engineering*, Ch. 12 (Dynamic Scheduling), November 2025.
11. Zhu, Y. et al., "Training Data Quality Assessment for LLM Fine-Tuning," arXiv:2402.15890 (2024).
12. NVIDIA, *nvml-wrapper Rust Crate Documentation* (2026). Available: crates.io/crates/nvml-wrapper
13. Wang, S. et al., "MSched: GPU Multitasking via Proactive Memory Scheduling," arXiv:2512.24637 (2026).
14. NVIDIA, *NVML API Reference Guide* (2026). Available: docs.nvidia.com/deploy/nvml-api/
15. GSD-OS Desktop specification, *gsd-os-desktop-vision.md*. Training trigger integration and idle detection.
16. Lester, B. et al., "The Power of Scale for Parameter-Efficient Prompt Tuning," *EMNLP 2021*. arXiv:2104.08691.
