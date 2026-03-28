# GPU Architecture and Quantization

## Overview

Selecting the right GPU and quantization level is the foundational hardware decision for local inference. This module provides VRAM math, benchmark data, and cost-performance analysis for consumer NVIDIA GPUs running models from 7B to 70B parameters.

## Consumer GPU Comparison

### NVIDIA GeForce RTX Series

| GPU | VRAM | Bandwidth | FP16 TFLOPS | Price (MSRP) | Notes |
|-----|------|-----------|-------------|-------------|-------|
| RTX 4060 Ti 8GB | 8 GB | 288 GB/s | 22.1 | $399 | Current dev workstation GPU |
| RTX 4060 Ti 16GB | 16 GB | 288 GB/s | 22.1 | $499 | Double VRAM, same compute |
| RTX 3090 | 24 GB | 936 GB/s | 35.6 | ~$800 used | Best value for 24GB; legacy |
| RTX 4090 | 24 GB | 1,008 GB/s | 82.6 | $1,599 | Current consumer king |
| RTX 5090 | 32 GB | 1,792 GB/s | ~100+ | $1,999 | Next-gen (2025-2026) |

### Key Metrics for Inference

- **VRAM**: Determines the largest model you can load. The hard constraint.
- **Memory bandwidth**: Determines token generation speed (tokens/second). Inference is memory-bandwidth-bound, not compute-bound.
- **FP16 TFLOPS**: Matters for prompt processing (prefill) but not for generation.

### The RTX 4060 Ti 8GB Reality

The current dev workstation GPU (RTX 4060 Ti 8GB) constrains model selection significantly:

- **7B models**: Comfortable at Q4_K_M quantization (~4.5GB VRAM)
- **8B models**: Fits at Q4_K_M (~5GB VRAM), tight with KV cache for long contexts
- **14B models**: Requires Q3_K_M or lower (~6.5GB), with reduced quality
- **32B+ models**: Does not fit -- requires CPU offloading (very slow) or a bigger GPU

## VRAM Math

### The Formula

```
VRAM_required = model_weights + kv_cache + activations + overhead

model_weights = parameters * bytes_per_weight
kv_cache = 2 * num_layers * hidden_dim * context_length * bytes_per_kv * batch_size
activations = ~0.5-1.0 GB (varies by architecture)
overhead = ~0.5-1.5 GB (CUDA context, runtime)
```

### Bytes Per Weight by Quantization

| Quantization | Bytes/Weight | 7B Model | 14B Model | 32B Model | 70B Model |
|-------------|-------------|----------|-----------|-----------|-----------|
| FP16 | 2.0 | 14.0 GB | 28.0 GB | 64.0 GB | 140.0 GB |
| Q8_0 | 1.0 | 7.0 GB | 14.0 GB | 32.0 GB | 70.0 GB |
| Q5_K_M | 0.63 | 4.4 GB | 8.8 GB | 20.2 GB | 44.1 GB |
| Q4_K_M | 0.50 | 3.5 GB | 7.0 GB | 16.0 GB | 35.0 GB |
| Q3_K_M | 0.38 | 2.7 GB | 5.3 GB | 12.2 GB | 26.6 GB |
| Q2_K | 0.25 | 1.8 GB | 3.5 GB | 8.0 GB | 17.5 GB |

### KV Cache Calculator

KV cache grows linearly with context length. For a typical 32-layer, 4096-hidden-dim model:

| Context Length | KV Cache (FP16) | KV Cache (Q8) |
|---------------|-----------------|---------------|
| 2,048 | 0.5 GB | 0.25 GB |
| 4,096 | 1.0 GB | 0.5 GB |
| 8,192 | 2.0 GB | 1.0 GB |
| 16,384 | 4.0 GB | 2.0 GB |
| 32,768 | 8.0 GB | 4.0 GB |

### Practical VRAM Budget: RTX 4060 Ti 8GB

```
Available VRAM:          8.0 GB
CUDA overhead:          -0.5 GB
Safety margin:          -0.5 GB
Usable for model + KV:  7.0 GB

Qwen3-8B at Q4_K_M:     4.0 GB (weights)
KV cache (4096 ctx):    +0.5 GB
Activations:            +0.5 GB
Total:                   5.0 GB  ✓ FITS (2.0 GB headroom)

Qwen3-14B at Q4_K_M:    7.0 GB (weights)
KV cache (4096 ctx):    +1.0 GB
Total:                   8.5 GB  ✗ DOES NOT FIT
```

## Quantization Quality Impact

### Benchmark: Perplexity by Quantization Level

Lower perplexity = better model quality. Measured on WikiText-2 validation set:

| Model | FP16 | Q8_0 | Q5_K_M | Q4_K_M | Q3_K_M | Q2_K |
|-------|------|------|--------|--------|--------|------|
| LLaMA 3 8B | 6.14 | 6.15 | 6.18 | 6.24 | 6.41 | 7.12 |
| Qwen 2.5 7B | 7.02 | 7.03 | 7.06 | 7.10 | 7.28 | 8.01 |

Key insight: Q4_K_M introduces only ~1-2% perplexity degradation compared to FP16, while using 75% less memory. Q3_K_M shows noticeable degradation. Q2_K is generally too lossy for production use.

### Recommended Quantization by VRAM

| VRAM | Target Model Size | Quantization | Quality Rating |
|------|-------------------|-------------|----------------|
| 8 GB | 7-8B | Q4_K_M | Good |
| 12 GB | 7-8B | Q8_0 | Excellent |
| 16 GB | 14B | Q4_K_M | Good |
| 24 GB | 32B | Q4_K_M | Good |
| 24 GB | 14B | Q8_0 | Excellent |
| 32 GB | 70B | Q3_K_M | Moderate |

## Throughput Benchmarks

### Tokens Per Second by GPU and Model

| GPU | Model | Quant | Prompt (tok/s) | Generation (tok/s) |
|-----|-------|-------|----------------|-------------------|
| RTX 4060 Ti 8GB | Qwen3-8B | Q4_K_M | 1,200 | 42 |
| RTX 4090 24GB | Qwen3-8B | Q4_K_M | 4,500 | 110 |
| RTX 4090 24GB | Qwen3.5-35B-A3B | Q4_K_M | 2,800 | 213 |
| RTX 3090 24GB | Qwen3-8B | Q4_K_M | 2,200 | 75 |
| Apple M3 Max 48GB | Qwen3-8B | Q4_K_M | 1,800 | 55 |

The RTX 4090's memory bandwidth (1,008 GB/s) makes it approximately 2.5x faster than the RTX 4060 Ti (288 GB/s) for token generation, which is memory-bandwidth-bound.

## Mixture-of-Experts (MoE) Advantage

### Why MoE Models Punch Above Their Weight

MoE models like Qwen3.5-35B-A3B activate only a subset of their parameters per token:

- **Total parameters**: 35B
- **Active parameters per token**: 3B (the "A3B" designation)
- **VRAM for weights**: Same as a 35B dense model (Q4_K_M: ~17.5GB)
- **Generation speed**: Comparable to a 3B dense model (only active parameters compute)
- **Quality**: Comparable to a dense 14-32B model (total parameter knowledge)

This makes MoE models ideal for local inference: they fit in 24GB VRAM, generate tokens as fast as a small model, but reason with the knowledge of a much larger one.

> **SAFETY: VRAM figures in this module are estimates based on published specifications and community benchmarks. Actual VRAM usage varies by runtime implementation, CUDA version, and system configuration. Always verify with `nvidia-smi` during actual inference.**

## Summary

GPU selection for local inference is primarily a VRAM and memory bandwidth decision. The RTX 4060 Ti 8GB handles 7-8B models comfortably at Q4_K_M quantization. For larger models (14B+) or higher quality quantization, 16-24GB GPUs are required. MoE architectures like Qwen3.5-35B-A3B offer the best quality-per-VRAM ratio. Q4_K_M quantization provides the optimal quality/memory tradeoff for most use cases.
