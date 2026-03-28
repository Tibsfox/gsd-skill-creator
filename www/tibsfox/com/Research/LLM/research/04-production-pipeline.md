# Model-to-Production Pipeline

## Overview

This module documents the end-to-end pipeline from model selection through deployment to continuous monitoring, with particular focus on the eval harness for GSD-specific tasks.

## Pipeline Architecture

```
MODEL-TO-PRODUCTION PIPELINE
==============================

  1. SELECT          2. QUANTIZE         3. SERVE
  Base model         GGUF Q4_K_M         Ollama / vLLM
  from Hub           or FP8              API endpoint
     |                  |                    |
     v                  v                    v
  4. EVALUATE        5. DEPLOY           6. MONITOR
  GSD-specific       Claude Code          Throughput
  eval harness       integration          Quality drift
     |                  |                    |
     +------ FEEDBACK LOOP ------+          |
     |                           |          |
  7. FINE-TUNE                   +----------+
  LoRA adapter                   Regression
  on failures                    detection
```

## Model Selection

### Criteria

| Factor | Weight | Measurement |
|--------|--------|-------------|
| VRAM fit | Critical | Must load + KV cache on target GPU |
| Code quality | High | HumanEval, MBPP benchmarks |
| Instruction following | High | IFEval, MT-Bench scores |
| Quantization tolerance | Medium | Perplexity delta at target quant |
| License | Medium | Must allow local deployment |
| Community support | Medium | Ollama library availability |

### Recommended Models (March 2026)

| GPU | Primary Model | Fallback |
|-----|--------------|----------|
| 8 GB | Qwen3-Coder-8B (Q4_K_M) | Devstral-Small-7B (Q4_K_M) |
| 16 GB | Qwen3-Coder-14B (Q4_K_M) | Devstral-14B (Q4_K_M) |
| 24 GB | Qwen3.5-35B-A3B (Q4_K_M) | DeepSeek-Coder-V2-16B (Q8_0) |

## Eval Harness

### GSD-Specific Evaluation Tasks

The eval harness tests the model on tasks directly relevant to the GSD ecosystem:

| Task ID | Description | Pass Criteria | Weight |
|---------|-------------|---------------|--------|
| DACP-GEN | Generate a valid DACP three-part bundle from a text description | JSON validates against DACP schema | 20% |
| YAML-VAL | Validate a chipset YAML configuration and identify errors | All errors found; no false positives | 15% |
| COMMIT-MSG | Generate a Conventional Commit message for a diff | Correct type, scope, subject; <72 chars | 10% |
| PLAN-PHASE | Create a phase plan outline from requirements | Contains all required sections | 15% |
| CODE-SCAFFOLD | Generate TypeScript boilerplate from a type definition | Type-checks with tsc; no errors | 20% |
| PNW-TAXONOMY | Answer questions about PNW species and ecoregions | Factually correct per reference data | 10% |
| MISSION-STRUCT | Parse mission pack structure and extract module list | All modules identified; correct order | 10% |

### Eval Framework

```python
class GSDEvalHarness:
    def __init__(self, model_endpoint, eval_dataset_path):
        self.client = OpenAIClient(base_url=model_endpoint)
        self.dataset = load_jsonl(eval_dataset_path)
        self.results = []

    def run_eval(self, task_id: str) -> EvalResult:
        task_examples = [e for e in self.dataset if e['task'] == task_id]
        correct = 0
        for example in task_examples:
            response = self.client.chat(
                messages=[{"role": "user", "content": example['prompt']}],
                temperature=0.0,
                max_tokens=2048
            )
            passed = self.evaluate(task_id, response, example['expected'])
            correct += int(passed)
        return EvalResult(
            task_id=task_id,
            total=len(task_examples),
            passed=correct,
            score=correct / len(task_examples)
        )
```

### Baseline vs. LoRA Comparison

The eval harness runs against both the base model and the LoRA-adapted model:

| Task | Base Model Score | LoRA Score | Delta |
|------|-----------------|------------|-------|
| DACP-GEN | (baseline) | (post-training) | improvement |
| YAML-VAL | (baseline) | (post-training) | improvement |
| ... | ... | ... | ... |

If the LoRA model scores lower than the base model on any task, the adapter has introduced a regression and should not be deployed.

## Deployment Patterns

### Always-On Local Inference

For developers who use local models daily:

```bash
# systemd service for Ollama
[Unit]
Description=Ollama Local Inference Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_MODELS=/data/models"
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### On-Demand Startup

For systems where GPU is shared between inference and other tasks (gaming, ComfyUI):

```bash
# Start before Claude Code session
ollama serve &
ollama pull qwen3-coder:8b-q4_k_m

# Stop after session
ollama stop qwen3-coder:8b-q4_k_m
killall ollama
```

## A/B Testing

### Methodology

Run the same GSD tasks through both the Anthropic API (Claude) and the local model, then compare:

| Metric | Measurement |
|--------|-------------|
| Task completion rate | % of tasks completed without human correction |
| Output quality | Human rating 1-5 on a sample of 50 outputs |
| Latency | Time from request to complete response |
| Cost | API cost (Anthropic) vs. electricity cost (local) |

### Cost Analysis

| Task Category | Volume/Month | Anthropic Cost | Local Cost | Savings |
|--------------|-------------|----------------|------------|---------|
| YAML validation | 500 | ~$5 | ~$0.10 (electricity) | 98% |
| Scaffolding | 200 | ~$8 | ~$0.05 | 99% |
| Commit messages | 300 | ~$3 | ~$0.03 | 99% |
| Cross-module synthesis | 50 | ~$25 | N/A (use API) | 0% |
| **Total** | **1,050** | **~$41** | **~$25.18** | **39%** |

The savings increase dramatically for heavier workloads. The key insight: high-judgment tasks (synthesis, architecture decisions) remain on the Anthropic API. Deterministic, repetitive tasks move to local inference.

## Continuous Monitoring

### Regression Detection

```python
class QualityMonitor:
    def __init__(self, baseline_scores: dict):
        self.baseline = baseline_scores
        self.window = deque(maxlen=100)  # Rolling window

    def check(self, task_id: str, score: float) -> Alert:
        self.window.append((task_id, score))
        recent_avg = mean([s for t, s in self.window if t == task_id])
        if recent_avg < self.baseline[task_id] * 0.9:  # 10% degradation
            return Alert(
                level="WARNING",
                message=f"{task_id} score {recent_avg:.2f} below baseline {self.baseline[task_id]:.2f}"
            )
        return None
```

### Metrics to Track

- **Tokens per second**: Detect performance degradation from thermal throttling or resource contention
- **Error rate**: Track API errors, OOM events, and timeout failures
- **Quality scores**: Rolling eval scores on a sample of production traffic
- **VRAM usage**: Monitor for memory leaks over long-running sessions

> **Related:** See [03-lora-training](03-lora-training.md) for the training pipeline that feeds into this production pipeline and [05-claude-code-integration](05-claude-code-integration.md) for the task routing that determines which requests go to local vs. API.

## Summary

The model-to-production pipeline connects model selection, quantization, serving, evaluation, deployment, and monitoring into a continuous loop. The GSD-specific eval harness with 7 task categories ensures the local model actually improves ecosystem workflows before deployment. A/B testing quantifies the cost savings (39-99% per task category) while continuous monitoring detects quality regressions.
