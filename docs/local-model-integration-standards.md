# Local Model Integration Standards

**Authority:** Hemlock (Quality & Standards)
**Date:** 2026-03-04
**Status:** Active
**Hardware baseline:** RTX 4060 Ti (8GB VRAM, CUDA 13.0), 60GB system RAM, i7-6700K 8 cores

---

## 1. Model Selection Criteria

### 1.1 VRAM Budget

The standard holds: **6GB maximum VRAM per model at inference time.** The remaining 2GB is reserved for desktop compositor, Tauri webview, and system overhead.

| Budget tier | VRAM allocation | Use case |
|-------------|-----------------|----------|
| Embedding   | 0.5-1.5 GB      | Sentence-transformers, BGE variants |
| Small LLM   | 3-4 GB          | Phi-3 Mini, Qwen2 1.5B, TinyLlama |
| Medium LLM  | 5-6 GB          | Mistral 7B Q4, Llama 3.1 8B Q4 |
| **Hard ceiling** | **6 GB** | **Never exceed. No exceptions.** |

Quality gate: Any model that reports VRAM usage above 6GB in `nvidia-smi` during inference is rejected, regardless of other metrics.

### 1.2 Minimum Quality Thresholds

Models must meet published benchmark minimums before local deployment. These are pass/fail gates, not optimization targets.

**Embedding models:**

| Benchmark | Minimum | Rationale |
|-----------|---------|-----------|
| MTEB average (retrieval subset) | 45.0 | Below this, heuristic TF-IDF fallback is competitive |
| STS benchmark (Spearman) | 0.75 | Minimum for meaningful semantic similarity |
| Model size | < 500 MB on disk | Reasonable download and cold-start |

The existing `Xenova/bge-small-en-v1.5` (33MB, 384-dim) is the benchmark baseline. Any replacement must exceed its MTEB retrieval score (51.68) on the same task set, or demonstrate equivalent performance on project-specific evaluation (Section 5).

**LLM models:**

| Benchmark | Minimum | Rationale |
|-----------|---------|-----------|
| MMLU (5-shot) | 55.0 | Below this, outputs are unreliable for classification tasks |
| HumanEval (pass@1) | 25.0 | Minimum code comprehension for stamp analysis |
| Quantization | Q4_K_M or higher | Q4_K_S and below show measurable quality degradation on structured tasks |

### 1.3 Quantization Requirements

| Quantization | Status | Notes |
|--------------|--------|-------|
| Q4_K_M | **Minimum accepted** | Balanced quality/size for 7B models |
| Q5_K_M | Preferred | Better quality, still fits 6GB budget for 7B |
| Q6_K | Excellent | Use when VRAM budget allows |
| Q8_0 | Full quality | Only for models under 3B parameters |
| Q4_K_S, Q3, Q2 | **Rejected** | Measurable degradation on structured outputs |
| FP16/BF16 | Size-dependent | Only for models under 1.5B parameters |

### 1.4 License Requirements

| License class | Status | Examples |
|---------------|--------|---------|
| Apache 2.0, MIT, BSD | **Accepted** | BGE, TinyLlama, Qwen2 |
| Llama 3.x Community License | **Accepted** | Meta Llama models |
| Mistral license (Apache 2.0) | **Accepted** | Mistral 7B |
| Non-commercial only | **Rejected** | Cannot use in commercial Wasteland bounties |
| Proprietary / closed-weight | **Rejected** | Weights must be inspectable |

Quality gate: Every model entry in the project must include a `license` field in its configuration. Missing license = rejected.

---

## 2. Performance Benchmarks

### 2.1 Embedding Generation

Measured against the existing embedding infrastructure (`src/embeddings/embedding-service.ts`).

| Metric | Threshold | Measurement method |
|--------|-----------|-------------------|
| Single text latency (GPU) | < 10 ms | Median of 100 calls, warm model |
| Batch latency (100 texts, GPU) | < 200 ms | 985 college concepts is the reference workload |
| Single text latency (CPU fallback) | < 100 ms | Acceptable degradation for fallback mode |
| Batch latency (100 texts, CPU) | < 5,000 ms | Hard ceiling for CPU-only operation |
| Cold start (model load) | < 5 seconds | From disk to first inference |
| Cold start (first download) | N/A | One-time cost, report to user with progress callback |

Benchmark result baseline: The existing `Xenova/bge-small-en-v1.5` runs CPU-only via `@huggingface/transformers`. Any GPU-accelerated replacement must beat CPU baselines by at least 5x on batch workloads, or the GPU overhead is not justified.

### 2.2 LLM Inference

| Metric | Threshold | Notes |
|--------|-----------|-------|
| Time to first token | < 500 ms | User-perceptible responsiveness |
| Tokens per second (generation) | >= 15 tok/s | Below this, interactive use is impractical |
| Context window utilization | >= 2048 tokens | Minimum for muse voice + context |
| Prompt evaluation rate | >= 100 tok/s | For processing input context |

Calibration note: These thresholds assume ollama as the inference runtime. If using a different runtime (llama.cpp direct, vLLM, etc.), re-benchmark and document.

### 2.3 Memory Ceilings

| Resource | Hard ceiling | Soft warning |
|----------|-------------|-------------|
| VRAM (GPU) | 6 GB | 5 GB (triggers warning log) |
| System RAM (model runtime) | 8 GB | 6 GB |
| System RAM (total process) | 16 GB | 12 GB |
| Disk (model storage) | 10 GB total across all models | 7 GB |

The system has 60GB RAM, but local models must not monopolize it. Other processes (Tauri desktop, Claude Code, build tools, tests) need headroom.

---

## 3. Quality Gates Per Use Case

### 3.1 Activation Scoring

**Context:** `src/activation/activation-scorer.ts` scores skill descriptions for auto-activation reliability.

| Metric | Target | Measurement |
|--------|--------|-------------|
| Rank correlation with heuristic scorer | Spearman rho >= 0.85 | Compare embedding-based rankings to existing heuristic on 50+ skill descriptions |
| Score stability | Std dev < 0.05 across runs | Same input must produce same score (deterministic after model load) |
| Improvement over keyword baseline | >= 10% on edge cases | Embedding-based scoring must improve on ambiguous descriptions where keywords fail |

Quality gate: If embedding-based activation scoring does not beat the existing heuristic scorer (`src/activation/activation-scorer.ts`) by a measurable margin on the project's own skill corpus, do not ship it. The heuristic works. The bar for replacement is improvement, not equivalence.

### 3.2 College Concept Similarity

**Context:** 985 college concepts across 42 departments. Similarity used for prerequisite detection, concept clustering, and cross-department linking.

| Metric | Target | Measurement |
|--------|--------|-------------|
| Intra-department similarity | Mean cosine > 0.5 | Concepts within the same department should cluster |
| Inter-department separation | Mean cosine < 0.35 | Concepts across unrelated departments should separate |
| Human-judged quality | >= 80% agreement | 50-concept sample, 3 human judges, "is this similarity ranking reasonable?" |
| Consistency with wasteland profiler | Cosine similarity correlation >= 0.9 | Embedding-based similarity on agent capability vectors must not diverge from the existing `cosineSimilarity()` in `agent-profiler.ts` |

Governance note: The agent profiler (`src/integrations/wasteland/agent-profiler.ts`) and embedding service (`src/embeddings/`) both implement cosine similarity independently. Any local model integration must use the canonical `cosineSimilarity()` from `src/embeddings/cosine-similarity.ts` for embedding vectors, and the profiler's version only for capability vectors (which are `Record<string, number>`, not dense arrays).

### 3.3 Muse Voice Checking

**Context:** Verify that generated text matches a target muse voice/tone. Binary classification: voice-match or voice-mismatch.

| Metric | Target | Measurement |
|--------|--------|-------------|
| Precision | >= 0.90 | False positives (wrong voice accepted) are worse than false negatives |
| Recall | >= 0.75 | Some misses are acceptable; human review catches them |
| F1 score | >= 0.82 | Balanced measure |
| Latency per check | < 2 seconds | Must not block commit workflow |

**Evaluation corpus:** Minimum 100 labeled examples per muse voice (voice-match / voice-mismatch pairs). Build the corpus before deploying the model — not after.

Quality gate: Precision is the priority metric. A voice checker that accepts wrong voices undermines trust. Better to miss some correct voices (low recall) than to accept incorrect ones (low precision).

### 3.4 Stamp Analysis

**Context:** Analyzing commit stamps for pattern detection, quality signals, and drift.

| Metric | Target | Measurement |
|--------|--------|-------------|
| False positive rate | < 5% | Flagging clean stamps as anomalous |
| False negative rate | < 10% | Missing actual anomalies |
| Processing throughput | >= 50 stamps/second | Batch analysis of commit history |
| Drift detection sensitivity | Detect 15% quality shift within 10 stamps | Rolling window analysis |

---

## 4. Resource Management

### 4.1 Model Loading/Unloading Policy

```
Priority order (highest to lowest):
1. Active inference request (never unload during inference)
2. Embedding model (most frequently used, smallest footprint)
3. LLM model (loaded on demand, unloaded after idle timeout)
```

| Policy | Rule |
|--------|------|
| Embedding model lifecycle | Load on first `embed()` call. Keep resident. Unload only on process exit. |
| LLM model lifecycle | Load on demand. Unload after 5 minutes idle. |
| Concurrent models | Maximum 1 LLM + 1 embedding model loaded simultaneously |
| Preloading | Never preload models at application startup. Lazy initialization only. |

This matches the existing pattern in `EmbeddingService` (lazy singleton with `init()` on first use).

### 4.2 VRAM Contention

When VRAM is contested between embedding model and LLM:

1. **Embedding model has priority.** It is smaller, more frequently used, and faster to reload.
2. **LLM yields.** If an embedding request arrives while LLM occupies VRAM, the LLM is unloaded first.
3. **Queue, don't crash.** If VRAM is fully occupied, queue the request with a 30-second timeout rather than failing immediately.

### 4.3 Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| GPU unavailable (driver issue, VRAM exhaustion) | Fall back to CPU inference. Log warning. |
| CPU inference too slow (exceeds threshold) | Fall back to heuristic embedder (`HeuristicEmbedder` in `src/embeddings/heuristic-fallback.ts`). Log warning. |
| Model file corrupted or missing | Fall back to heuristic. Attempt re-download on next startup. |
| ollama not running | Report to caller. Do not auto-start services. |

The standard holds: **every code path that calls a local model must have a fallback.** The existing `EmbeddingService` pattern (model -> heuristic fallback) is the reference implementation. LLM use cases must follow the same pattern with an appropriate fallback (keyword matching, rule-based classification, or skip-with-warning).

---

## 5. Testing Requirements

### 5.1 Regression Tests for Model Swaps

When replacing or upgrading a local model:

1. **Golden set test.** Maintain a frozen test corpus (minimum 50 inputs with expected outputs). Run the new model against it. Pass criteria: no more than 5% regression on any single metric.
2. **Cache invalidation.** Model version change must invalidate the embedding cache. The existing `MODEL_VERSION` constant in `embedding-service.ts` handles this — do not bypass it.
3. **Fallback verification.** Temporarily disable the model and verify the fallback path produces usable (if degraded) results.

### 5.2 A/B Comparison Framework

The codebase already has A/B testing infrastructure (`ABTestResult`, `SPRTResult` in `src/integrations/wasteland/types.ts`). Local model evaluation must use this framework.

| Comparison | Method | Minimum samples |
|------------|--------|-----------------|
| Local embedding vs Claude API embedding | Cosine similarity correlation on shared test set | 200 text pairs |
| Local LLM classification vs Claude API | Agreement rate on labeled test set | 100 labeled examples |
| New model vs current model | SPRT with alpha=0.05, beta=0.1 | Until SPRT decides (typically 50-200 samples) |

Quality gate: Do not ship a model swap without running SPRT to statistical significance. "It seems better" is not evidence. The standard is quantitative.

### 5.3 Embedding Drift Detection

Embeddings must be consistent across sessions. Drift indicates model state corruption, version mismatch, or non-deterministic inference.

| Check | Threshold | Frequency |
|-------|-----------|-----------|
| Sentinel embedding stability | Cosine similarity > 0.999 with reference | Every model load |
| Batch consistency | Max pairwise deviation < 0.001 across runs | Weekly automated test |
| Cross-method divergence | Model vs heuristic correlation tracked | Continuous (logged per `EmbeddingResult.method`) |

Implementation: On model load, embed a fixed sentinel string (e.g., `"quality gate sentinel v1"`) and compare against a stored reference vector. If cosine similarity drops below 0.999, log a warning and flag the model as potentially drifted.

---

## 6. Security Boundaries

### 6.1 Filesystem Access

| Rule | Enforcement |
|------|-------------|
| Read-only access to codebase | Model process runs with read-only mounts to `src/`, `docs/`, `.claude/` |
| No access to `.planning/` | Consistent with project-wide `.planning/` isolation |
| No access to `.env`, credentials, keys | Excluded from any model input pipeline |
| Model weights stored in `~/.cache/` or `~/.ollama/` | Not in the project directory |

### 6.2 Network Isolation

| Rule | Enforcement |
|------|-------------|
| No network access during inference | Model must be fully local after initial download |
| Model download: HTTPS only, verified checksums | Use `@huggingface/transformers` built-in verification or ollama's digest verification |
| No telemetry from model runtimes | Disable any phone-home in ollama config, HuggingFace env vars |
| No model output sent to external services | Local models produce local results only |

### 6.3 Output Sanitization

Before any local model output is used in commits, stamps, or external-facing artifacts:

| Check | Rule |
|-------|------|
| Length limit | Truncate LLM output to 2000 characters maximum |
| Content filter | Strip any content that looks like injected instructions (prompt injection defense) |
| Format validation | Structured outputs (JSON, scores) must pass schema validation before use |
| No raw model output in git | Model outputs are inputs to deterministic formatters, never committed verbatim |

Quality gate: Treat local model output with the same skepticism as external API responses. Validate at the boundary. The model is a tool, not an authority.

---

## 7. Approved Model Registry

Models are approved for use only after passing the gates above. This registry is the single source of truth.

### 7.1 Approved Embedding Models

| Model | VRAM | Dimensions | MTEB (retrieval) | Status |
|-------|------|------------|-------------------|--------|
| `Xenova/bge-small-en-v1.5` | CPU-only (33MB) | 384 | 51.68 | **Current baseline** |
| `sentence-transformers/all-MiniLM-L6-v2` | ~0.5 GB | 384 | 49.54 | Approved (GPU candidate) |
| `BAAI/bge-base-en-v1.5` | ~1.0 GB | 768 | 53.25 | Approved (quality upgrade) |

### 7.2 Approved LLM Models

| Model | VRAM (Q4_K_M) | MMLU | HumanEval | Status |
|-------|---------------|------|-----------|--------|
| `microsoft/Phi-3-mini-4k-instruct` | ~3.5 GB | 68.8 | 57.3 | Approved |
| `Qwen/Qwen2-1.5B-Instruct` | ~1.5 GB | 56.5 | 31.6 | Approved (lightweight) |
| `mistralai/Mistral-7B-Instruct-v0.3` | ~5.5 GB | 62.5 | 32.9 | Approved (budget allows) |

### 7.3 Adding to the Registry

To add a new model:

1. Verify license (Section 1.4)
2. Verify VRAM budget (Section 1.1)
3. Verify benchmark minimums (Section 1.2)
4. Run golden set regression (Section 5.1)
5. Run A/B comparison via SPRT (Section 5.2)
6. Update this registry with results
7. Update `MODEL_VERSION` constant to invalidate cache

---

## Appendix: Measurement Procedures

### A. VRAM Measurement

```bash
# During inference (not idle):
nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits
# Subtract baseline (desktop idle VRAM usage, typically 400-800 MB)
# Result must be < 6000 MB
```

### B. Latency Measurement

```bash
# Embedding: median of 100 warm calls
# LLM: median of 20 warm generations (50 token output)
# Exclude first call (cold start measured separately)
# Report: p50, p95, p99
```

### C. Sentinel Drift Check

```typescript
const SENTINEL = "quality gate sentinel v1";
const REFERENCE_HASH = "<stored hash of reference embedding>";
// On model load: embed(SENTINEL), compare cosine to stored reference
// Threshold: >= 0.999
```

---

The standard holds. Every model earns its place through measurement, not assumption.
