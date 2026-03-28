# Image Production Pipeline

## Overview

This module documents the image generation model landscape, VRAM tier routing for consumer GPUs, ControlNet integration, and workflow templates for the complete image production pipeline.

## Model Landscape (March 2026)

### FLUX.1

Black Forest Labs' FLUX family represents the current state of the art for open-weight image generation:

- **FLUX.1 Dev**: 12B parameters, non-commercial license. Highest quality in the family. Requires ~24GB VRAM at FP16; ~12GB at FP8 quantization. Guidance distilled -- no classifier-free guidance needed.
- **FLUX.1 Schnell**: 12B parameters, Apache 2.0 license. 4-step generation (vs. 20-50 for Dev). Optimized for speed at moderate quality cost. Same VRAM profile as Dev.
- **FLUX.1 FP8 Quantized**: The practical deployment target for consumer GPUs. FP8 quantization (E4M3FN format) reduces memory footprint by ~50% with minimal quality loss. Fits in 16GB VRAM for 1024x1024 generation.

### Stable Diffusion XL (SDXL)

Stability AI's SDXL remains the most widely deployed open model due to its ControlNet ecosystem:

- **Parameters**: 6.6B (base + refiner architecture)
- **VRAM**: ~8GB at FP16 for base model; ~12GB with refiner
- **License**: Open RAIL-M (permissive with use restrictions)
- **Strengths**: Largest ControlNet ecosystem; extensive LoRA library; well-understood prompt syntax
- **Limitations**: Lower coherence than FLUX for complex compositions; requires negative prompts

### Stable Diffusion 3.5

Stability AI's architecture update introducing MMDiT (Multi-Modal Diffusion Transformer):

- **SD 3.5 Large**: 8B parameters, ~16GB VRAM at FP16
- **SD 3.5 Medium**: 2.6B parameters, ~8GB VRAM at FP16
- **SD 3.5 Large Turbo**: 4-step variant for fast generation
- **License**: Stability Community License (free under $1M revenue)

## VRAM Tier Routing

### Routing Table

| GPU VRAM | Recommended Model | Resolution | Batch Size | Est. Time (20 steps) |
|----------|-------------------|------------|------------|---------------------|
| 8 GB | SDXL (FP16) or SD 3.5 Medium | 1024x1024 | 1 | 15-25s |
| 12 GB | FLUX.1 Schnell (FP8) | 1024x1024 | 1 | 8-12s |
| 16 GB | FLUX.1 Dev (FP8) | 1024x1024 | 1 | 20-35s |
| 24 GB | FLUX.1 Dev (FP16) | 1024x1024 | 1-2 | 15-25s |
| 24 GB | SDXL + ControlNet + Refiner | 1024x1024 | 1 | 25-40s |

### VRAM Budget Formula

```
VRAM_total = model_weights + KV_cache + activations + overhead

model_weights = parameters * bytes_per_param
  FP16: bytes_per_param = 2
  FP8:  bytes_per_param = 1

KV_cache = batch_size * seq_len * hidden_dim * 2 * bytes_per_param
activations = batch_size * (height/8) * (width/8) * channels * bytes_per_param
overhead = ~1-2 GB (CUDA context, Python runtime)
```

### Auto-Selection Logic

The VRAM router queries `nvidia-smi` at startup, reads available VRAM, subtracts a 1.5GB safety margin, and selects the highest-quality model that fits:

1. Check available VRAM
2. Subtract 1.5GB safety margin
3. Match against routing table
4. If exact match unavailable, fall back to next lower tier
5. Report selected configuration to skill-creator registry

## ControlNet Integration

ControlNet enables guided generation by conditioning the diffusion process on structural inputs:

### Supported Control Types

| Control Type | Input | Use Case |
|-------------|-------|----------|
| Canny Edge | Edge-detected image | Preserve structural outlines |
| Depth Map | Depth estimation (MiDaS) | Maintain spatial relationships |
| OpenPose | Skeleton keypoints | Character pose guidance |
| Scribble | Hand-drawn sketch | Creative intent to full image |
| Segmentation | Semantic map | Region-specific generation |
| Normal Map | Surface normals | Lighting-consistent generation |
| Lineart | Clean line drawing | Illustration style control |

### ControlNet VRAM Overhead

Each ControlNet model adds approximately 1.4GB (SDXL ControlNet at FP16) to the VRAM budget. Multiple ControlNets can be stacked (e.g., Depth + OpenPose) but each additional control model adds to the VRAM requirement.

## Workflow Templates

### Template 1: Text-to-Image (FLUX FP8)

Minimal text-to-image generation using FLUX.1 Dev at FP8 quantization. Target: 16GB GPU, <90s completion.

Key nodes: CheckpointLoaderSimple -> CLIPTextEncode (positive + negative) -> KSampler -> VAEDecode -> SaveImage

### Template 2: Text-to-Image (SDXL)

Standard SDXL pipeline with base model generation. Compatible with 8GB GPUs.

Key nodes: CheckpointLoaderSimple -> CLIPTextEncode x2 -> KSampler -> VAEDecode -> SaveImage

### Template 3: SDXL + ControlNet (Depth)

Depth-guided generation for maintaining spatial relationships from a reference image.

Key nodes: LoadImage -> DepthEstimation -> ControlNetApply -> KSampler -> VAEDecode -> SaveImage

### Template 4: Image-to-Image (SDXL)

Modify an existing image while preserving its structure. Denoise strength controls the balance between input preservation and creative generation.

Key nodes: LoadImage -> VAEEncode -> KSampler (denoise: 0.4-0.7) -> VAEDecode -> SaveImage

### Template 5: Upscale (4x)

4x upscaling using a dedicated upscale model. Operates in tile mode to fit in limited VRAM.

Key nodes: LoadImage -> UpscaleModelLoader -> ImageUpscaleWithModel -> SaveImage

## Seed Management

### Consistent Seed Strategy

For batch generation and iterative refinement:

- **Fixed seed**: Same seed + same prompt + same workflow = identical output (deterministic)
- **Seed increment**: seed + N for batch variation while maintaining style consistency
- **Random seed**: -1 or `random.randint(0, 2**32)` for exploration

### Batch Generation Pattern

```python
base_seed = 42
for i in range(batch_size):
    workflow["sampler"]["inputs"]["seed"] = base_seed + i
    prompt_id = await client.dispatch(workflow)
    results.append(prompt_id)
```

> **SAFETY: Generated images inherit the biases of training data. The skill-creator registry should log prompt-to-output mappings to enable audit of generation patterns. No generated image should be represented as photographic evidence.**

## Summary

The image production pipeline supports three model families (FLUX.1, SDXL, SD 3.5) with automatic VRAM-based routing for consumer GPUs from 8GB to 24GB. Five workflow templates cover the core generation patterns. ControlNet integration enables structural guidance. Seed management ensures reproducibility for iterative refinement workflows.
