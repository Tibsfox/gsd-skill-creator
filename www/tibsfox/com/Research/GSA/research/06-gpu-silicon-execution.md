# GPU Silicon Execution Layer

> **Domain:** GSD Ecosystem Alignment
> **Module:** 6 -- QLoRA Training, Adapter Distillation, CUDA Kernel Execution
> **Through-line:** *At the bottom of the stack, there is silicon. The RTX 4060 Ti's 4,352 CUDA cores don't know about skills, agents, or wave plans. They know about matrix multiplications -- GEMM operations on tiles of floating-point numbers. The entire prompt-to-silicon pipeline exists to translate a human sentence into a sequence of GEMM operations that produces the right answer. LoRAFusion, LoRA-Switch, vLLM, NVIDIA NIM -- these are the copper list runners at the silicon level, each finding a different way to make the matrix math go fast.*

---

## Table of Contents

1. [The Silicon Layer](#1-the-silicon-layer)
2. [LoRAFusion: Tile-Level Kernel Architecture](#2-lorafusion-tile-level-kernel-architecture)
3. [LoRA-Switch: Token-Wise Routing](#3-lora-switch-token-wise-routing)
4. [vLLM Dynamic LoRA Loading](#4-vllm-dynamic-lora-loading)
5. [NVIDIA NIM Mixed-Batch Inference](#5-nvidia-nim-mixed-batch-inference)
6. [LoRAServe: Heterogeneous Adapter Placement](#6-loraserve-heterogeneous-adapter-placement)
7. [QLoRA Training Pipeline](#7-qlora-training-pipeline)
8. [Performance Benchmarks: RTX 4060 Ti Reference](#8-performance-benchmarks-rtx-4060-ti-reference)
9. [VRAM Budget Deep Dive](#9-vram-budget-deep-dive)
10. [Safety and Sensitivity Boundaries](#10-safety-and-sensitivity-boundaries)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Silicon Layer

The GPU silicon execution layer is the bottom of the GSD stack. Everything above it -- natural language, workflow phases, ISA instructions, adapter routing -- ultimately resolves to CUDA kernel launches on GPU hardware [1].

The RTX 4060 Ti is the reference platform:
- **Architecture:** Ada Lovelace (AD106)
- **CUDA cores:** 4,352
- **VRAM:** 8 GB GDDR6 (256-bit bus)
- **Memory bandwidth:** 288 GB/s
- **TDP:** 160W
- **Inference:** 40-53 tok/s (Q4_K_M 7B) [7]

```
SILICON LAYER ARCHITECTURE
================================================================

  From Module 5 (Intent Router):
    adapter_id: "frontend-adapter"
    confidence: 0.87
    slot: HOT-0

       |
       v

  GPU EXECUTION PIPELINE:
  +------------------+    +------------------+    +------------------+
  | KV Cache         |    | Base Model       |    | LoRA Branch      |
  | (2,000 MB)       |    | (4,500 MB)       |    | (50 MB)          |
  | fp8 quantized    |    | Q4_K_M weights   |    | Hot adapter      |
  +--------+---------+    +--------+---------+    +--------+---------+
           |                       |                       |
           v                       v                       v
  +----------------------------------------------------------------+
  |                    CUDA GEMM Kernel                             |
  |  Base output = W_base * x                                      |
  |  LoRA output = W_base * x + (B * A) * x                       |
  |  Fused: single kernel, shared memory, tile-level routing       |
  +----------------------------------------------------------------+
           |
           v
  Token output --> next token --> ... --> complete response
```

---

## 2. LoRAFusion: Tile-Level Kernel Architecture

LoRAFusion (Zhu et al., EuroSys 2026) achieves 1.47x average end-to-end speedup for multi-LoRA training by fusing the LoRA branch operations with base GEMM at the tile level [2].

**Key Insight:** LoRA's memory-bound path (the low-rank matrices A and B) can be fused with the frozen base model's compute-bound path, eliminating redundant reads of the partial output gradient. FusedMultiLoRA routes adapters at the *tile level* rather than the *layer level*, enabling fine-grained VRAM utilization [2].

**Tile-Level Routing:**
```
STANDARD MULTI-LoRA (layer level):
  Layer 1: [Base GEMM] + [LoRA-A GEMM] + [LoRA-B GEMM]  (3 kernels)
  Layer 2: [Base GEMM] + [LoRA-A GEMM] + [LoRA-B GEMM]  (3 kernels)
  ...
  Total: 3 * num_layers kernel launches

LoRAFusion (tile level):
  Layer 1: [Fused Base+LoRA GEMM]  (1 kernel, tile-level routing)
  Layer 2: [Fused Base+LoRA GEMM]  (1 kernel, tile-level routing)
  ...
  Total: num_layers kernel launches (3x fewer launches)
```

**Performance on RTX 4060 Ti:**
- Training speedup: 1.47x average over standard multi-LoRA [2]
- Memory savings: shared output buffer eliminates redundant gradient storage
- Tile routing: hot tiles of frequently-used adapters stay resident while cold tiles are paged

**GSD Implication:** Tile-level routing means the VRAM residency policy operates at finer granularity than whole-adapter loading. Instead of loading or evicting an entire 50 MB adapter, the system can page individual tiles (~1-5 MB) based on access frequency [2].

> **Related:** [Intent Router](05-intent-to-adapter-routing.md), [Wire Harness](03-control-surface-wire-harness.md)

---

## 3. LoRA-Switch: Token-Wise Routing

LoRA-Switch (OpenReview, 2024) addresses the MoE-style dynamic adapter problem. When a single inference request spans multiple skill domains, traditional layer-wise or block-wise routing incurs 2.5x+ latency overhead due to fragmented CUDA kernel calls [3].

**Solution:** Token-wise routing merges the selected adapter weights into the backbone for each token, eliminating CUDA fragmentation.

```
LAYER-WISE vs TOKEN-WISE ROUTING
================================================================

  Layer-wise (standard):
    Token 1: [Base + LoRA-A] [Base + LoRA-A] [Base + LoRA-A]  (all layers)
    Token 2: [Base + LoRA-B] [Base + LoRA-B] [Base + LoRA-B]  (adapter switch)
    --> Context switch at every layer boundary = CUDA overhead

  Token-wise (LoRA-Switch):
    Token 1: [Base + merged_A_weights] across all layers (single kernel per layer)
    Token 2: [Base + merged_B_weights] across all layers (single kernel per layer)
    --> Adapter weights pre-merged, no per-layer switching
```

**GSD Use Case:** When a user prompt like "Build a React dashboard and write tests for it" spans frontend (react-adapter) and testing (testing-adapter) domains, token-wise routing can blend adapter activations within a single inference pass rather than requiring sequential adapter swaps [3].

**Performance:**
- Latency reduction: 2.5x improvement over layer-wise multi-adapter routing [3]
- Quality: comparable to sequential adapter application (no significant degradation)
- Memory: requires pre-merged weight matrices (small additional VRAM per active blend)

---

## 4. vLLM Dynamic LoRA Loading

vLLM supports dynamic adapter loading with in-place replacement, specifically designed for async RL workflows where adapter weights change frequently [4].

**Key Features:**
- **In-place loading** (`load_inplace=True`): Replace a resident adapter without deallocating VRAM
- **Concurrent inference**: Hot-swap does not interrupt batched inference on other adapters
- **API endpoint**: `/v1/load_lora_adapter` for programmatic adapter management
- **Prompt-level adapter selection**: Each request in a batch can specify its own adapter

**GSD Integration Architecture:**
```
GSD SKILL-CREATOR --> vLLM ADAPTER MANAGEMENT
================================================================

  Intent Classifier (Module 5)
       |
       v
  [Adapter ID: "frontend-adapter"]
       |
       v
  vLLM Server:
    /v1/load_lora_adapter
      POST { lora_name: "frontend", lora_path: "/adapters/frontend-v1/" }
    /v1/chat/completions
      POST { model: "base", lora_adapter: "frontend", messages: [...] }

  Concurrent requests with different adapters:
    Request 1: frontend-adapter (batch position 0-3)
    Request 2: testing-adapter (batch position 4-7)
    --> Both execute in the same inference batch
```

**Latency:**
- Hot-swap (resident adapter): < 100ms [4]
- Cold-load (from filesystem): ~500ms [1]
- In-place replacement: < 100ms (no deallocation overhead) [4]

---

## 5. NVIDIA NIM Mixed-Batch Inference

NVIDIA NIM implements mixed-batch inference for LoRA swarms using batched GEMM and splitK optimization [5].

**splitK Optimization:** When multiple requests in a batch use different adapters, NIM splits the GEMM computation along the K dimension, allowing different adapter branches to share the same kernel launch. This reduces the total number of kernel launches from (requests * layers) to (layers), with per-request adapter routing handled inside the kernel [5].

**Performance Characteristics:**
- Batch size 1: comparable to vLLM
- Batch size 4-8: NIM advantage emerges (splitK amortizes adapter switching)
- Batch size 16+: NIM achieves near-linear scaling with batch size

**GSD Integration:** NIM is optimal when GSD runs multiple parallel agents (polecats) that each need different adapters. A 4-polecat Gas Town topology maps perfectly to NIM's sweet spot at batch size 4.

```
NIM MIXED-BATCH FOR GAS TOWN
================================================================

  Polecat 1 (frontend-adapter) ──┐
  Polecat 2 (testing-adapter)  ──┤──> [NIM Server]
  Polecat 3 (backend-adapter)  ──┤    splitK GEMM
  Polecat 4 (docs-adapter)    ──┘    single kernel launch
                                          |
                                     [4 responses]
                                     each with correct adapter
```

---

## 6. LoRAServe: Heterogeneous Adapter Placement

LoRAServe (arXiv 2511.22880, November 2025) addresses the distributed deployment problem: when adapters have different computational profiles (rank, quantization, model size), placement across heterogeneous hardware must be optimized for overall system throughput [6].

**Key Contribution:** Optimal adapter placement across heterogeneous GPU hardware. A fleet with mixed RTX 4060 Ti (8GB) and RTX 5090 (32GB) cards can be optimized: high-frequency adapters on the faster card, low-frequency adapters on the smaller card.

**GSD Relevance:** As the GSD ecosystem grows beyond a single GPU, LoRAServe's placement algorithms become critical for:
- Multi-GPU desktop setups (dual RTX 4060 Ti or RTX 4060 Ti + RTX 5090)
- Cloud burst: routing overflow requests to cloud GPUs when local VRAM is full
- Federation: distributing adapters across multiple Wasteland participants

---

## 7. QLoRA Training Pipeline

QLoRA training generates the adapters that the inference pipeline serves. The training pipeline runs on the same RTX 4060 Ti reference hardware, using system RAM for the training workspace [1].

**Pipeline Stages:**

1. **Data Generation:** Claude generates training pairs from successful skill applications (input prompt, expected output)
2. **Quality Filtering:** Remove low-quality pairs, deduplicate, ensure diversity across domains
3. **Quantization:** Base model quantized to 4-bit (Q4_K_M) for training efficiency
4. **Training:** QLoRA training with rank 8-16, alpha 16-32, learning rate 1e-4 to 3e-4
5. **Evaluation:** Held-out eval set (minimum 50 pairs), quality metrics computed
6. **Distillation:** Full adapter distilled to deployment size (rank reduction if needed)
7. **Deployment:** Adapter loaded to cold storage (system RAM), promoted to hot on first use

```
QLoRA TRAINING PIPELINE
================================================================

  [Claude generates training pairs]
       |
  [Quality filter: dedup, diversity, balance]
       |
  [Quantize base model to Q4_K_M]
       |
  [Train: QLoRA, rank 8-16, 500 examples]
       |  System RAM: 8,000 MB workspace
       |  GPU: 4,500 MB base model (shared with inference)
       |  Training throughput: 500-628 tok/s
       |
  [Evaluate: held-out set, min 50 pairs]
       |
  [Distill: reduce rank if deployment target requires]
       |
  [Deploy: RAM (cold) --> VRAM (hot on first access)]
```

**Training Budget:**
- 500 training examples: minutes, not hours on RTX 4060 Ti [1]
- Workspace: 8,000 MB system RAM (does not compete with VRAM)
- Throughput: 500-628 tok/s (IBM aLoRA research benchmark) [8]

> **SAFETY WARNING:** No adapters promoted to deployment without minimum 50 training pairs and held-out evaluation. This is a GATE-level safety constraint (see Module 3 bus signal SC-VRAM). An adapter trained on insufficient data may produce confident but incorrect outputs.

---

## 8. Performance Benchmarks: RTX 4060 Ti Reference

| Metric | Value | Source |
|--------|-------|--------|
| Local inference (Q4_K_M 7B) | 40-53 tok/s | Ollama RTX 4060 benchmarks [7] |
| LoRAFusion training speedup | 1.47x average | EuroSys 2026, arXiv 2510.00206 [2] |
| LoRA hot-swap latency | < 100ms | vLLM in-place load documentation [4] |
| LoRA cold-swap latency | ~500ms | GSD silicon layer spec (VRAM page) [1] |
| QLoRA training throughput | 500-628 tok/s | IBM aLoRA research [8] |
| Training run (500 examples) | Minutes, not hours | GSD silicon layer spec [1] |
| KV cache overhead (128k ctx, 70B model) | 39 GB | Fluence GPU guide 2026 [7] |
| Consumer peak (RTX 5090, 7B) | 5,841 tok/s | Fluence GPU guide 2026 [7] |
| VRAM total | 8,192 MB (8 GB GDDR6) | NVIDIA RTX 4060 Ti specifications |
| Memory bandwidth | 288 GB/s | NVIDIA RTX 4060 Ti specifications |
| CUDA cores | 4,352 | NVIDIA RTX 4060 Ti specifications |
| TDP | 160W | NVIDIA RTX 4060 Ti specifications |

**Comparison: Current vs Next-Gen Reference:**

| Metric | RTX 4060 Ti (current) | RTX 5090 (next-gen) | Improvement |
|--------|----------------------|--------------------|----|
| VRAM | 8 GB | 32 GB | 4x |
| Inference (7B) | 40-53 tok/s | 5,841 tok/s | ~110x |
| Hot adapters | 3-4 | 12-16 | ~4x |
| Training workspace | System RAM | VRAM-resident | Eliminates RAM bottleneck |

> **DRIFT WARNING:** The RTX 5090 represents a generational leap that would fundamentally change the VRAM budget arithmetic. All adapter counts, residency policies, and training budgets would need re-evaluation if the reference platform upgrades.

---

## 9. VRAM Budget Deep Dive

The VRAM budget is the binding constraint of the silicon layer. Every byte must be accounted for [1]:

```
VRAM BUDGET ACCOUNTING (RTX 4060 Ti 8GB)
================================================================

  PERSISTENT (never evicted):
    Base model (Q4_K_M 7B):      4,500 MB  [55.0%]
    KV cache (fp8, 128k ctx):    2,000 MB  [24.4%]
    CUDA runtime overhead:         500 MB  [ 6.1%]
    ──────────────────────────────────────────
    Persistent total:            7,000 MB  [85.4%]

  DYNAMIC (managed by residency policy):
    Hot adapter slot 0:             50 MB  [ 0.6%]
    Hot adapter slot 1:             50 MB  [ 0.6%]
    Hot adapter slot 2:             50 MB  [ 0.6%]
    Hot adapter slot 3:             50 MB  [ 0.6%]
    ──────────────────────────────────────────
    Dynamic total:                 200 MB  [ 2.4%]

  HEADROOM:
    Available:                     992 MB  [12.1%]
    Safety ceiling:                292 MB  [ 3.6%]
    ──────────────────────────────────────────
    TOTAL:                       8,192 MB  [100%]

  SYSTEM RAM (60 GB):
    Cold adapters (20-30):       1,000 MB
    QLoRA training workspace:    8,000 MB
    OS + applications:          ~51,000 MB
```

**Budget Rules (ABSOLUTE):**
1. Persistent allocation must not change during runtime
2. Dynamic allocation must not exceed 200 MB total (4 slots x 50 MB)
3. Headroom must never drop below 292 MB (SAFETY_BLOCK triggers at 95%)
4. Cold adapters live in system RAM exclusively
5. Training workspace uses system RAM, never competes with VRAM

---

## 10. Safety and Sensitivity Boundaries

| Area | Boundary Type | Specification |
|------|--------------|---------------|
| Adapter training data quality | GATE | No adapters promoted without minimum 50 training pairs and held-out eval [1] |
| ZFC compliance | GATE | Intent classifier must not embed heuristic reasoning in orchestration code [9] |
| Staging layer gate | ABSOLUTE | All adapter deployments must pass through staging; push.default=nothing enforced [1] |
| VRAM budget ceiling | ABSOLUTE | Base model + hot adapters + KV cache must not exceed 7,700 MB; headroom reserved [1] |
| Wasteland reputation anti-collusion | ANNOTATE | Bounded reputation changes flagged but detection not yet architectural [9] |
| Gas City bridge compatibility | ANNOTATE | Bridge spec is proposal; requires Knutsen/Sells review before implementation [9] |

**Training Data Safety:**
- No training on user-private data without explicit consent
- Training pairs derived from skill-creator's own output (self-supervised)
- Held-out evaluation must demonstrate quality improvement over base model
- Adapter version tracked in chipset.lock for reproducibility

---

## 11. End-to-End Timing: Prompt to Token

The complete prompt-to-token timing budget, from human keystroke to first generated token:

| Stage | Component | Latency | Cumulative |
|-------|-----------|---------|------------|
| 1 | Human types prompt | Variable | 0ms (start) |
| 2 | Tier 1 intent classification | < 1ms | 1ms |
| 3 | Adapter residency check | < 1ms | 2ms |
| 4a | Hot adapter activation | < 100ms | 102ms |
| 4b | Cold adapter load (if needed) | ~500ms | 502ms |
| 5 | KV cache prefill | 50-200ms | 152-702ms |
| 6 | First token generation | ~20ms | 172-722ms |
| 7 | Subsequent tokens | 19-25ms each | Streaming |

**Time to first token (TTFT):**
- Best case (hot adapter): ~172ms
- Typical case (hot adapter): ~200ms
- Cold adapter: ~722ms
- Cloud fallback (Tier 3): ~2200ms

```
TIMING BUDGET VISUALIZATION
================================================================

  0ms        1ms    2ms        102ms          152ms    172ms
  |-----------|------|-----------|--------------|--------|---->
  Human       T1     Check      Hot activate   Prefill  First
  types       match  VRAM       adapter        KV cache token

  Subsequent tokens: every ~22ms (40-53 tok/s)

  100 token response: 172ms + (99 * 22ms) = ~2.3s total
  500 token response: 172ms + (499 * 22ms) = ~11.2s total
```

---

## 12. The Silicon Layer as Alignment Ground Truth

The silicon layer is where alignment becomes physically verifiable. At every other level of the stack, alignment is assessed by comparing documents, plans, and specifications. At the silicon level, alignment is assessed by comparing actual inference output to expected output -- measurable, quantifiable, and reproducible.

**Alignment Metrics at the Silicon Level:**

| Metric | Description | Target |
|--------|-------------|--------|
| Adapter match rate | % of requests routed to the correct adapter | > 95% |
| Quality score | Output quality with adapter vs. without | > 1.15x improvement |
| Latency budget compliance | % of requests within TTFT budget | > 99% |
| VRAM budget compliance | % of time within VRAM ceiling | 100% (ABSOLUTE) |
| Training pair quality | Held-out eval accuracy | > 0.80 |

When these metrics are green, the entire stack -- from Level 5 intent down to Level 1 silicon -- is aligned. When any metric drifts, the misalignment can be traced upward through the stack to its source.

This is the through-line of the entire GSA project: alignment is not a one-time property. It is a continuous measurement across every level of the stack, from human intent to GPU tile, verified at the silicon layer where the math is honest and the numbers don't lie.

---

## 13. Cross-References

- **Module 1 (Yegge Ecosystem):** Trust tier integration informs adapter access control
- **Module 2 (Gas City Bridge):** Gas City topologies determine which adapters are needed
- **Module 3 (Wire Harness):** VRAM budget constraints enforced by bus architecture
- **Module 4 (ISA & Bus):** ROUTE GPU instruction triggers silicon execution
- **Module 5 (Intent Router):** Adapter selection decisions that precede silicon execution
- **MCF:** Multi-configuration framework for adapter variant management
- **COK:** Convergence analysis for training quality verification
- **K8S:** Container-level GPU scheduling patterns
- **MGU:** Mathematical foundations of quantization and low-rank approximation

---

## 14. Sources

1. GSD Project Knowledge: gsd-silicon-layer-spec.md. VRAM budget, training pipeline, reference hardware.
2. Zhu, Z. et al. "LoRAFusion: Efficient LoRA Fine-Tuning for LLMs." EuroSys 2026, Edinburgh. arXiv 2510.00206.
3. LoRA-Switch: "Boosting the Efficiency of Dynamic LLM Adapters via System-Algorithm Co-design." OpenReview, 2024.
4. vLLM documentation: LoRA Adapters, dynamic loading, in-place replacement. docs.vllm.ai
5. NVIDIA Technical Blog. "Seamlessly Deploying a Swarm of LoRA Adapters with NVIDIA NIM." June 2024.
6. LoRAServe: "Serving Heterogeneous LoRA Adapters in Distributed LLM Inference Systems." arXiv 2511.22880v1, November 2025.
7. Fluence. "7 Best GPU for LLM in 2026." fluence.network, February 2026.
8. IBM Research: aLoRA adaptive low-rank training, throughput benchmarks.
9. GSD Project Knowledge: skill-creator-wasteland-integration-analysis.md. Safety boundaries, ZFC compliance.
10. Predibase/LoRAX: Multi-LoRA inference server documentation. github.com/predibase/lorax
11. NVIDIA CUDA Programming Guide: GEMM optimization, memory management, kernel fusion.
12. Ollama documentation: llama.cpp integration, quantized model loading, RTX 4060 Ti benchmarks.
13. Wen et al. "FlexLoRA: Entropy-Guided Dynamic Rank Allocation." ICLR 2026.
14. Kim & Choi. "Learning Rate Tuning Accounts for Most LoRA Performance Variance." February 2026.
15. Tether/QVAC. "Cross-Platform BitNet LoRA Framework." tether.io, March 17, 2026.
16. NVIDIA RTX 4060 Ti Specifications. Technical reference, nvidia.com.
17. NVIDIA RTX 5090 Specifications. Blackwell architecture reference, nvidia.com.
18. Patterson, David A. and Hennessy, John L. *Computer Architecture: A Quantitative Approach.* 6th ed., Morgan Kaufmann, 2017. GEMM optimization principles.
