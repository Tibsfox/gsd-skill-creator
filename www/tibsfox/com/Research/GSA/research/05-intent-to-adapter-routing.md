# Intent Classification to LoRA Adapter Routing

> **Domain:** GSD Ecosystem Alignment
> **Module:** 5 -- Intent Bridge, Adapter Selection, Hot-Swap Protocols
> **Through-line:** *Between a natural language prompt and a CUDA kernel running on a GPU tile, there is a bridge. On one side: human intent, ambiguous and creative. On the other side: adapter weights, precise and mathematical. The bridge must translate imprecision into precision without losing the intent. The intent classifier is not a black box -- it is a three-tier pipeline where each tier adds certainty at increasing computational cost, and the first tier that exceeds the confidence threshold wins.*

---

## Table of Contents

1. [The Intent-to-Silicon Gap](#1-the-intent-to-silicon-gap)
2. [Three-Tier Intent Classifier](#2-three-tier-intent-classifier)
3. [Tier 1: Pattern Matching](#3-tier-1-pattern-matching)
4. [Tier 2: Semantic Clustering](#4-tier-2-semantic-clustering)
5. [Tier 3: Model Inference Fallback](#5-tier-3-model-inference-fallback)
6. [Adapter Routing Decision Tree](#6-adapter-routing-decision-tree)
7. [Hot-Swap and Cold-Load Protocols](#7-hot-swap-and-cold-load-protocols)
8. [VRAM Residency Policy](#8-vram-residency-policy)
9. [Production Serving System Integration](#9-production-serving-system-integration)
10. [Failure Modes and Fallback Paths](#10-failure-modes-and-fallback-paths)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Intent-to-Silicon Gap

The GSD chipset's FPGA mode performs intent classification as step 1 of the synthesis pipeline (Module 4, ELABORATION stage). For the silicon layer, this classification must produce an adapter ID -- or set of candidate IDs -- that the LoRA router can act on [1].

The gap between intent and adapter is not a single jump. It is a three-tier cascade where each tier adds computational cost but also adds confidence. The system should use the cheapest tier that produces sufficient confidence, only escalating to more expensive tiers when necessary.

```
INTENT-TO-ADAPTER CASCADE
================================================================

  "Build a React dashboard with WebSocket updates"
       |
  [TIER 1: Pattern Match] ---- < 1ms
       | Match: "React" -> react-patterns skill
       | Match: "WebSocket" -> websocket-integration skill
       | Confidence: 0.87 (above 0.80 threshold)
       | Result: frontend-adapter
       v
  ADAPTER SELECTED (no need for Tier 2 or 3)

  "Help me think through the architectural implications"
       |
  [TIER 1: Pattern Match] ---- < 1ms
       | No strong pattern match
       | Confidence: 0.35 (below threshold)
       v
  [TIER 2: Semantic Cluster] ---- < 50ms
       | DBSCAN clustering against intent embeddings
       | Nearest cluster: "architecture-analysis"
       | Confidence: 0.82
       | Result: architecture-adapter
       v
  ADAPTER SELECTED (no need for Tier 3)
```

> **Related:** [ISA & Bus](04-isa-bus-architecture.md), [GPU Silicon](06-gpu-silicon-execution.md)

---

## 2. Three-Tier Intent Classifier

The classifier operates as a cascade: each tier is tried in order, and the first tier to exceed the confidence threshold produces the final result [1].

| Tier | Method | Latency | Confidence Floor | Cost |
|------|--------|---------|-----------------|------|
| 1 | Keyword/pattern matching | < 1ms | 0.80 | Negligible |
| 2 | Semantic clustering (DBSCAN) | < 50ms | 0.70 | Low (local embedding) |
| 3 | Model inference (cloud API) | 200-2000ms | 0.50 | High (API call) |

The confidence threshold decreases at each tier because later tiers are expected to handle more ambiguous inputs. A Tier 3 result at 0.55 confidence is acceptable because the model inference has much more information to work with than pattern matching [1].

**Threshold Policy:**
- Tier 1 at >= 0.80: Pattern match is unambiguous, proceed directly
- Tier 2 at >= 0.70: Semantic similarity is strong enough, proceed
- Tier 3 at >= 0.50: Model judgment is better than random, proceed with annotation
- Below 0.50 at all tiers: Route to base model without adapter (safety fallback)

---

## 3. Tier 1: Pattern Matching

Tier 1 uses exact and fuzzy string matching against the skill registry. Every skill in `.claude/skills/` has a SKILL.md description with trigger patterns -- domain keywords, file extensions, command names [1].

**Matching Algorithm:**
1. Tokenize the input prompt into words and bigrams
2. Match against skill trigger patterns (exact match, case-insensitive)
3. Score each match: exact = 1.0, partial = 0.5, bigram = 0.7
4. Aggregate scores across all matched skills
5. Select highest-scoring skill; confidence = normalized aggregate score

**Example Skill Trigger Patterns:**
```
react-patterns:
  triggers:
    exact: [react, jsx, tsx, component, hook, useState, useEffect]
    partial: [frontend, ui, interface, dashboard]
    bigram: ["react component", "state management", "virtual dom"]

testing-patterns:
  triggers:
    exact: [test, spec, jest, vitest, coverage, assertion]
    partial: [verify, validate, check, ensure]
    bigram: ["test plan", "test case", "unit test"]
```

**Tier 1 Strengths:** Near-zero latency, deterministic, no network dependency. **Tier 1 Weakness:** Cannot handle novel intent not covered by existing trigger patterns.

---

## 4. Tier 2: Semantic Clustering

Tier 2 uses the PromptClusterer from the skill-creator observation pipeline [1]. Intent embeddings are precomputed for known prompt categories, and the incoming prompt is embedded and compared against cluster centroids using DBSCAN.

**Clustering Process:**
1. Embed the input prompt using a local embedding model (e.g., all-MiniLM-L6-v2)
2. Compute cosine similarity against precomputed cluster centroids
3. Select the nearest cluster above the distance threshold
4. Map cluster_id to adapter_candidates[] via lookup table
5. Confidence = 1.0 - (distance to centroid / max_distance)

**Cluster Registry (example):**

| Cluster ID | Domain | Adapter Candidates | Centroid Distance Threshold |
|-----------|--------|-------------------|---------------------------|
| CLU-001 | Frontend development | frontend-adapter, ui-adapter | 0.35 |
| CLU-002 | Backend services | backend-adapter, api-adapter | 0.30 |
| CLU-003 | Architecture analysis | architecture-adapter | 0.40 |
| CLU-004 | Testing/verification | testing-adapter | 0.25 |
| CLU-005 | Documentation | docs-adapter | 0.30 |
| CLU-006 | DevOps/infrastructure | devops-adapter | 0.35 |
| CLU-007 | Data processing | data-adapter | 0.30 |
| CLU-008 | Security review | security-adapter | 0.25 |

**Tier 2 Strengths:** Handles novel intent that shares semantic similarity with known categories. **Tier 2 Weakness:** Requires precomputed embeddings; new categories need cluster retraining.

---

## 5. Tier 3: Model Inference Fallback

Tier 3 invokes a cloud API (Claude, GPT, Gemini) to classify intent when Tiers 1 and 2 are insufficient. This is the most expensive tier and should be reached only for genuinely novel or ambiguous inputs [1].

**Inference Protocol:**
1. Construct a classification prompt with: the user's input, available adapter descriptions, confidence context from Tiers 1-2
2. Send to cloud API with structured output format
3. Parse the response: adapter_id, confidence, reasoning
4. If confidence >= 0.50, use the result
5. If confidence < 0.50, fall back to base model (no adapter)

**Classification Prompt Template:**
```
Classify the following user intent and select the most appropriate
LoRA adapter from the available options. Return structured JSON.

User intent: "{prompt}"
Tier 1 result: {tier1_result} (confidence: {tier1_confidence})
Tier 2 result: {tier2_result} (confidence: {tier2_confidence})

Available adapters:
{adapter_descriptions}

Respond with:
{
  "adapter_id": "...",
  "confidence": 0.XX,
  "reasoning": "..."
}
```

**Tier 3 Strengths:** Handles genuinely novel intent with model-level reasoning. **Tier 3 Weakness:** High latency (200-2000ms), network dependency, API cost. Should be rare.

> **SAFETY WARNING:** Tier 3 involves sending user prompts to external APIs. The classification prompt must not include sensitive context beyond what is needed for adapter selection. The user's full prompt is sent, but project-specific secrets, credentials, or private context are stripped.

---

## 6. Adapter Routing Decision Tree

The complete routing decision tree from intent to adapter execution:

```
ADAPTER ROUTING DECISION TREE
================================================================

  Input: user prompt
       |
  [Tier 1: Pattern Match]
       |
   confidence >= 0.80? ----yes----> [Select adapter]
       |                                  |
      no                                  v
       |                            [Check VRAM]
  [Tier 2: Semantic Cluster]             |
       |                         hot? --> [Execute]
   confidence >= 0.70? ----yes--> |
       |                    cold? --> [Cold-load, then Execute]
      no                   none? --> [Cloud API fallback]
       |
  [Tier 3: Model Inference]
       |
   confidence >= 0.50? ----yes----> [Select adapter, annotate low-conf]
       |
      no
       |
  [Base model, no adapter]
       |
  [Execute with base model only]
  [Log: "No adapter matched, investigate intent category"]
```

---

## 7. Hot-Swap and Cold-Load Protocols

**Hot-Swap (< 100ms):** The adapter is already resident in VRAM. The LoRA weights are already loaded; the router simply activates them for the next inference batch [2].

**Protocol:**
1. Identify target adapter from intent classifier
2. Verify adapter is VRAM-resident (check residency table)
3. Activate adapter weights in the inference pipeline
4. Begin inference with adapter applied
5. Emit TELEMETRY with adapter_id and activation latency

**Cold-Load (~500ms):** The adapter is in system RAM but not VRAM. Must be loaded before use [2].

**Protocol:**
1. Identify target adapter from intent classifier
2. Check VRAM budget: is there space for a new adapter?
3. If yes: load directly from RAM to VRAM
4. If no: evict the least-recently-used hot adapter, then load
5. Update residency table
6. Activate adapter weights
7. Emit ADAPTER_SWAP signal on bus (Priority 3)

**Eviction Policy:** Least-Recently-Used (LRU) with frequency weighting. An adapter used 100 times in the last hour is harder to evict than one used once. The eviction formula:

```
eviction_score = time_since_last_use * (1 / use_count_last_hour)

Lowest eviction_score = most likely to be evicted
```

---

## 8. VRAM Residency Policy

The RTX 4060 Ti 8GB reference platform supports 3-4 hot adapters simultaneously [3]:

| Slot | Status | Adapter | Size | Last Used |
|------|--------|---------|------|-----------|
| HOT-0 | Resident | frontend-adapter | 50 MB | 2s ago |
| HOT-1 | Resident | testing-adapter | 50 MB | 45s ago |
| HOT-2 | Resident | backend-adapter | 50 MB | 120s ago |
| HOT-3 | Resident | docs-adapter | 50 MB | 300s ago |
| COLD-0 | RAM | architecture-adapter | 50 MB | 1200s ago |
| COLD-1 | RAM | devops-adapter | 50 MB | 3600s ago |
| ... | RAM | (20-30 more) | 50 MB each | various |

**Residency Rules:**
1. Base model is ALWAYS resident (persistent, never evicted)
2. KV cache is ALWAYS resident (persistent, sized at boot)
3. Hot slots filled at boot based on usage history
4. Cold-to-hot promotion on first access (triggers ADAPTER_SWAP signal)
5. Hot-to-cold demotion via LRU when hot slots are full and a new adapter is needed

**Budget Constraint (ABSOLUTE):**
```
base_model + kv_cache + sum(hot_adapters) + cuda_overhead <= 7,700 MB

4,500 + 2,000 + (4 * 50) + 500 = 7,200 MB (within budget)
```

> **SAFETY WARNING:** Exceeding the 7,700 MB VRAM ceiling causes CUDA OOM errors that terminate inference mid-generation. The residency policy must enforce this constraint at all times. The SAFETY_BLOCK signal fires if VRAM utilization exceeds 95% of the ceiling.

---

## 9. Production Serving System Integration

Three production serving systems support dynamic LoRA loading in 2026, each with different strengths:

### vLLM

vLLM supports dynamic adapter loading with in-place replacement for async RL workflows (`load_inplace=True`). The `/v1/load_lora_adapter` endpoint enables hot-swap without interrupting concurrent inference [4].

**GSD Integration:**
```
# vLLM adapter hot-swap
POST /v1/load_lora_adapter
{
  "lora_name": "frontend-adapter",
  "lora_path": "/adapters/frontend-v1.2/",
  "load_inplace": true
}
```

**Best for:** GSD's "3-4 hot adapters" architecture. vLLM can replace a resident adapter while other requests continue batching.

### LoRAX (Predibase)

LoRAX serves thousands of adapters from a single GPU using heterogeneous continuous batching and asynchronous prefetch/offload between VRAM and CPU RAM [5].

**GSD Integration:**
```
# LoRAX multi-adapter inference
POST /v1/chat/completions
{
  "model": "base-model",
  "adapter_id": "frontend-adapter",
  "messages": [...]
}
```

**Best for:** When the skill registry has many low-frequency adapters. LoRAX optimizes aggregate throughput across the full adapter population.

### NVIDIA NIM

NVIDIA NIM implements mixed-batch inference for LoRA swarms using batched GEMM and splitK. Supports dynamic loading from HuggingFace, Predibase, or local filesystem [6].

**GSD Integration:**
```
# NVIDIA NIM LoRA swarm
POST /v1/chat/completions
{
  "model": "meta/llama-3.1-8b-instruct",
  "lora_adapter": "frontend-adapter",
  "messages": [...]
}
```

**Best for:** Highest-performance for a small number of hot adapters. Matches GSD's "3-4 hot adapters in VRAM" architecture exactly.

| System | Hot Adapters | Cold Adapters | Swap Latency | Best For |
|--------|-------------|---------------|-------------|----------|
| vLLM | 3-4 | 20-30 via dynamic load | < 100ms hot | GSD default architecture |
| LoRAX | Thousands | Automatic prefetch | Variable | Large skill registry |
| NVIDIA NIM | 3-4 | Filesystem load | < 100ms hot | Maximum performance |

---

## 10. Failure Modes and Fallback Paths

| Failure Mode | Detection | Recovery | Signal |
|-------------|-----------|----------|--------|
| All tiers below threshold | Tier 3 confidence < 0.50 | Use base model without adapter | TELEMETRY (log) |
| Adapter not found | Registry lookup returns null | Fall back to cloud API for full inference | ADAPTER_SWAP |
| VRAM OOM during cold-load | CUDA OOM exception | Evict two LRU adapters, retry once | SAFETY_BLOCK |
| Cloud API timeout (Tier 3) | 5s timeout on API call | Use Tier 2 result even if below threshold | CONTEXT_WARNING |
| Embedding model unavailable (Tier 2) | Connection refused | Skip Tier 2, go directly to Tier 3 | TELEMETRY (log) |
| Adapter quality degradation | Inference quality metrics below threshold | Flag adapter for retraining, use base model | SKILL_UPDATE |

```
FAILURE CASCADE
================================================================

  Normal path: Tier 1 -> Adapter -> Execute (95% of requests)

  Degraded path 1: Tier 1 fail -> Tier 2 -> Adapter -> Execute (4%)
  Degraded path 2: Tier 1+2 fail -> Tier 3 -> Adapter -> Execute (0.8%)
  Degraded path 3: All tiers fail -> Base model -> Execute (0.15%)
  Emergency path: VRAM OOM -> Evict -> Retry -> Execute (0.05%)
  Fatal path: All recovery fails -> HALT + HITL gate (< 0.01%)
```

---

## 11. Alignment Monitoring: Classifier Drift Detection

The intent classifier itself is subject to alignment drift. As the skill registry evolves, trigger patterns may become stale, cluster centroids may shift, and adapter quality may degrade. The routing layer must monitor its own alignment.

**Drift Indicators:**

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| Tier 1 hit rate drops below 85% | 7-day rolling average | Retrain trigger patterns from recent prompts |
| Tier 2 average distance increasing | Distance > 0.45 for 100 consecutive queries | Re-cluster with DBSCAN on recent embeddings |
| Tier 3 invocation rate exceeds 3% | 7-day rolling average | Investigate: new intent category or degraded Tier 1-2 |
| Adapter quality score declining | Score < 0.70 for 50 consecutive uses | Flag adapter for retraining |
| Base model fallback rate exceeds 1% | 7-day rolling average | Investigate: missing adapter category |

**Drift Correction Protocol:**
```
CLASSIFIER DRIFT CORRECTION
================================================================

  [Monitor] --> drift detected
       |
  [Classify drift type]
       |
  pattern_stale --> [Re-scan skill registry, update Tier 1 patterns]
  cluster_shift --> [Re-embed recent prompts, re-cluster DBSCAN]
  new_category  --> [Generate new adapter via QLoRA pipeline]
  adapter_decay --> [Retrain adapter with recent training pairs]
  unknown       --> [Escalate to HITL gate for human classification]
```

The drift correction protocol is itself a copper list: a sequence of diagnostic and corrective operations that runs autonomously once triggered, escalating to human intervention only when automated correction is insufficient.

---

## 12. Intent Routing as Alignment Mechanism

Intent routing is the alignment mechanism of the silicon layer. It ensures that the right adapter -- the one trained for the specific task domain -- handles each request. When routing is aligned, the adapter's training distribution matches the inference distribution. When routing drifts, the adapter receives out-of-distribution inputs and produces lower-quality outputs.

This is the alignment problem in microcosm: the same structural challenge that Module 1 describes at the ecosystem level (GSD vs. Yegge) appears at the silicon level (intent vs. adapter). The solution is the same at both scales: continuous monitoring, explicit drift detection, and graduated correction.

---

## 13. Cross-References

- **Module 1 (Yegge Ecosystem):** Trust tier integration informs adapter access permissions
- **Module 2 (Gas City Bridge):** Gas City topology configurations routed through this classifier
- **Module 3 (Wire Harness):** ADAPTER_SWAP and SAFETY_BLOCK signals defined in bus specification
- **Module 4 (ISA & Bus):** ELABORATION stage feeds intent to this classifier
- **Module 6 (GPU Silicon):** LoRA execution layer that receives adapter routing decisions
- **CMH:** Chipset evolution patterns inform adapter routing design
- **GSD2:** Core GSD skill registry that provides Tier 1 pattern data
- **MCF:** Multi-configuration framework for managing adapter variants
- **COK:** Convergence analysis for classifier confidence calibration

---

## 14. Sources

1. GSD Project Knowledge: gsd-silicon-layer-spec.md. Intent classification architecture, three-tier cascade.
2. vLLM documentation: LoRA Adapters, dynamic loading, in-place replacement. docs.vllm.ai
3. GSD Project Knowledge: gsd-chipset-architecture-vision.md. VRAM budget, residency policy.
4. vLLM GitHub: /v1/load_lora_adapter endpoint specification. github.com/vllm-project/vllm
5. Predibase/LoRAX: Multi-LoRA inference server documentation. github.com/predibase/lorax
6. NVIDIA Technical Blog. "Seamlessly Deploying a Swarm of LoRA Adapters with NVIDIA NIM." June 2024.
7. GSD Project Knowledge: gsd-instruction-set-architecture-vision.md. FPGA synthesis pipeline, ELABORATION stage.
8. Sentence-Transformers documentation: all-MiniLM-L6-v2 embedding model. sbert.net
9. DBSCAN: Ester, M. et al. "A Density-Based Algorithm for Discovering Clusters." KDD 1996.
10. NVIDIA CUDA Programming Guide: memory management, OOM handling.
11. GSD skill-creator: PromptClusterer observation pipeline (src/core/prompt-clusterer.ts).
12. LoRAServe: "Serving Heterogeneous LoRA Adapters in Distributed LLM Inference Systems." arXiv 2511.22880v1.
13. FlexLoRA: Wen et al. "Entropy-Guided Dynamic Rank Allocation." ICLR 2026.
14. Kim & Choi. "Learning Rate Tuning Accounts for Most LoRA Performance Variance." February 2026.
15. QVAC/Tether: "Cross-Platform BitNet LoRA Framework." tether.io, March 2026.
16. GSD upstream intelligence pack v1.43: adapter performance baseline.
17. Fluence. "7 Best GPU for LLM in 2026." fluence.network, February 2026.
