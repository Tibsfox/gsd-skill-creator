# Video Production Pipeline

## Overview

Video generation through ComfyUI requires specialized models, higher VRAM budgets, and longer execution times than image generation. This module surveys the video model landscape, documents VRAM requirements, and specifies workflow templates for text-to-video and image-to-video production.

## Video Model Survey (March 2026)

### LTX Video 2.3

Lightricks' LTX-Video is the current leader for consumer-GPU video generation:

- **Architecture**: Transformer-based video diffusion with temporal attention
- **VRAM**: 12GB minimum (5-second clip at 480p); 16GB recommended (720p)
- **Resolution**: Up to 720p native; 1080p with upscaling
- **Duration**: 2-10 seconds per generation
- **Speed**: ~30 seconds for a 5-second clip on RTX 4090
- **License**: Apache 2.0
- **ComfyUI integration**: Native nodes via LTX-Video-ComfyUI extension

### Wan 2.2 (Alibaba)

- **Architecture**: DiT-based video generation with flow matching
- **Variants**: Wan 2.2 1.3B (fast), Wan 2.2 14B (quality)
- **VRAM**: 8GB (1.3B model), 24GB (14B model at FP8)
- **Resolution**: Up to 720p
- **Duration**: 2-8 seconds
- **License**: Apache 2.0
- **Strengths**: Excellent motion coherence; strong prompt adherence

### CogVideoX (Tsinghua/ZhiPu)

- **Architecture**: 3D causal VAE + expert transformer
- **Variants**: CogVideoX-2B, CogVideoX-5B
- **VRAM**: 12GB (2B), 20GB (5B)
- **Resolution**: 480x720
- **Duration**: 6 seconds at 8fps
- **License**: Apache 2.0
- **Strengths**: Long-duration coherence; camera motion control

### HunyuanVideo (Tencent)

- **Architecture**: Full transformer video diffusion
- **Parameters**: 13B
- **VRAM**: 24GB minimum (FP8 quantization required for consumer GPUs)
- **Resolution**: Up to 720p
- **Duration**: 2-5 seconds
- **License**: Tencent Hunyuan Community License
- **Strengths**: Highest absolute quality; cinematic motion

### AnimateDiff

- **Architecture**: Motion modules for Stable Diffusion 1.5 and SDXL
- **VRAM**: 8GB (SD 1.5 base); 12GB (SDXL base)
- **Resolution**: 512x512 (SD 1.5), 1024x1024 (SDXL)
- **Duration**: 16-32 frames (1-2 seconds at 16fps)
- **License**: Apache 2.0
- **Strengths**: Access to entire SD ecosystem (LoRAs, ControlNets, trained checkpoints)

## Model Selection Matrix

| Priority | Model | VRAM | Speed | Quality | Best For |
|----------|-------|------|-------|---------|----------|
| Primary | LTX-2.3 | 12-16GB | Fast | High | General T2V, quick iterations |
| Secondary | Wan 2.2 1.3B | 8GB | Fast | Good | Low-VRAM systems |
| Quality | HunyuanVideo | 24GB | Slow | Excellent | Final renders |
| Ecosystem | AnimateDiff | 8-12GB | Medium | Good | SD LoRA/ControlNet reuse |

## Text-to-Video Workflow

### LTX-2.3 Text-to-Video Template

```
Workflow nodes:
1. LTXVideoModelLoader -> Load LTX-2.3 checkpoint
2. CLIPTextEncode -> Encode positive prompt
3. CLIPTextEncode -> Encode negative prompt
4. LTXVideoSampler -> Generate video latents
   - steps: 30
   - cfg: 7.0
   - width: 768, height: 512
   - num_frames: 49 (2 seconds at 24fps)
5. LTXVideoVAEDecode -> Decode latents to frames
6. VHS_VideoCombine -> Assemble frames to MP4
   - fps: 24
   - codec: h264
```

### Wan 2.2 Text-to-Video Template

Similar structure with Wan-specific loader and sampler nodes. The 1.3B variant is the recommended entry point for consumer GPUs.

## Image-to-Video Workflow

Image-to-video (I2V) uses a reference image as the first frame and generates motion from it:

1. Load reference image
2. Encode image through the video model's image encoder
3. Condition the video generation on the image embedding
4. Generate subsequent frames
5. Assemble to video

This enables a powerful creative workflow: generate a still image with the image pipeline (FLUX, SDXL), then animate it with the video pipeline.

## Frame Interpolation

### RIFE (Real-Time Intermediate Flow Estimation)

For smoother output, RIFE interpolates between generated frames:

- **Input**: Video at 8-16fps (raw model output)
- **Output**: Video at 24-60fps (interpolated)
- **VRAM overhead**: Minimal (~500MB)
- **ComfyUI integration**: VHS_RIFE_Interpolation node

### Temporal Consistency

Video models can produce flickering or temporal artifacts. Mitigation strategies:

- **Higher step count**: More sampling steps improve temporal coherence at the cost of generation time
- **Lower CFG**: Reducing classifier-free guidance strength reduces frame-to-frame variation
- **Fixed seed**: Consistent seed across regeneration attempts ensures reproducible starting points
- **Frame blending**: Post-processing blur between frames reduces perceptual flicker

## Multi-Clip Assembly

### Consistent Seed Chain

For generating multi-clip sequences with visual consistency:

```python
base_seed = 42
clips = []
for i, prompt in enumerate(scene_prompts):
    workflow["sampler"]["inputs"]["seed"] = base_seed + (i * 1000)
    workflow["positive"]["inputs"]["text"] = prompt
    prompt_id = await client.dispatch(workflow)
    clips.append(await client.get_artifacts(prompt_id))
```

### Scene Transition Patterns

- **Hard cut**: Direct concatenation of clips (simplest)
- **Cross-dissolve**: Overlap final/first frames with alpha blending
- **Image-to-video bridge**: Use the last frame of clip N as the I2V input for clip N+1

## VRAM Optimization Strategies

| Strategy | VRAM Savings | Quality Impact | Implementation |
|----------|-------------|----------------|----------------|
| FP8 quantization | ~50% | Minimal | Model-specific FP8 checkpoints |
| Tiled VAE decode | 2-4GB | None | ComfyUI built-in tiling |
| Lower resolution | Proportional | Noticeable | Reduce width/height, upscale after |
| Fewer frames | Proportional | Shorter output | Reduce num_frames |
| CPU offload | Variable | Slower execution | `--lowvram` or `--cpu` flags |

> **Related:** See [02-image-pipeline](02-image-pipeline.md) for the image generation step that often precedes I2V, and [01-api-bridge](01-api-bridge.md) for the WebSocket progress tracking that monitors these long-running jobs.

## Summary

The video production pipeline supports five model families with LTX-2.3 as the primary choice for consumer GPUs. Text-to-video and image-to-video workflows are templated for ComfyUI execution. Frame interpolation via RIFE smooths output to production frame rates. Multi-clip assembly with consistent seed chains enables sequence generation. VRAM optimization strategies make video generation accessible on GPUs from 8GB upward.
