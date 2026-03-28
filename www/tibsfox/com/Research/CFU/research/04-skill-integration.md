# Skill-Creator Integration Architecture

## Overview

This module specifies how ComfyUI integrates with the GSD skill-creator ecosystem through DACP bundles, MCP bridge patterns, and the registry feedback loop that enables learning from generation outcomes.

## DACP Bundle Structure

### The Three-Part Generation Bundle

The DACP three-part bundle maps to ComfyUI generation requests:

**Part 1: Human Intent**
```json
{
  "type": "image_generation",
  "description": "Generate hero image for Seattle skyline research module",
  "style": "photorealistic, golden hour lighting, Mount Rainier visible",
  "output_path": ".planning/staging/assets/seattle_hero.png",
  "priority": "normal",
  "constraints": {
    "max_resolution": "1024x1024",
    "format": "PNG",
    "aspect_ratio": "16:9"
  }
}
```

**Part 2: Workflow JSON**
The complete ComfyUI workflow graph, either selected from the template library or dynamically assembled based on the intent analysis.

**Part 3: Executable Trigger**
```json
{
  "trigger": "immediate",
  "comfyui_endpoint": "http://localhost:8188",
  "timeout_seconds": 300,
  "retry_on_oom": true,
  "fallback_model": "sdxl_base"
}
```

### Intent-to-Workflow Translation

The skill-creator analyzes the human intent (Part 1) and selects the appropriate workflow template:

| Intent Keywords | Selected Template | Model |
|----------------|-------------------|-------|
| "photorealistic", "photograph" | FLUX FP8 T2I | FLUX.1 Dev |
| "illustration", "artwork" | SDXL T2I | SDXL + style LoRA |
| "based on image", "modify" | SDXL I2I | SDXL (denoise 0.4-0.7) |
| "upscale", "enhance" | 4x Upscale | RealESRGAN |
| "animate", "video", "motion" | LTX-2.3 T2V | LTX-Video |
| "controlled", "pose", "depth" | SDXL + ControlNet | SDXL + control model |

## MCP Bridge Specification

### Planning-Bridge Pattern

The MCP bridge adapts the existing planning-bridge pattern (used for WordPress and other integrations) to ComfyUI:

```
MCP BRIDGE ARCHITECTURE
========================

  Skill-Creator Agent
       |
       | DACP Bundle (intent + workflow + trigger)
       v
  MCP Bridge Server
       |
       |-- Validates workflow against /object_info
       |-- Routes to correct ComfyUI instance
       |-- Translates MCP tool calls to REST/WS
       v
  ComfyUI Instance (Docker)
       |
       | WebSocket events
       v
  MCP Bridge Server
       |
       | Progress events + artifacts
       v
  Skill-Creator Agent
       |
       | Log to registry
       v
  Learning Loop
```

### MCP Tool Definitions

The bridge exposes ComfyUI capabilities as MCP tools:

- `comfyui_generate_image`: Submit a text-to-image generation request
- `comfyui_generate_video`: Submit a text-to-video generation request
- `comfyui_img2img`: Modify an existing image
- `comfyui_upscale`: Upscale an image
- `comfyui_list_models`: Enumerate available models
- `comfyui_queue_status`: Check queue depth and running jobs
- `comfyui_cancel`: Cancel a running generation

### Handshake Protocol

On skill-creator session start:

1. MCP bridge connects to ComfyUI instance
2. Queries `/object_info` for available nodes
3. Queries `/system_stats` for VRAM availability
4. Registers available MCP tools based on installed models
5. Reports capabilities to skill-creator

## Registry Feedback Loop

### Generation Logging

Every generation is logged to the skill-creator registry with:

```json
{
  "generation_id": "gen_20260327_001",
  "timestamp": "2026-03-27T14:23:45Z",
  "intent": "hero image for Seattle module",
  "prompt_text": "photorealistic Seattle skyline, golden hour...",
  "negative_prompt": "blurry, low quality, text",
  "model": "flux1-dev-fp8",
  "seed": 42,
  "steps": 20,
  "cfg": 7.5,
  "resolution": "1024x576",
  "generation_time_seconds": 34.2,
  "vram_peak_mb": 14200,
  "output_path": ".planning/staging/assets/seattle_hero.png",
  "user_rating": null,
  "reuse_count": 0
}
```

### Pattern Detection

After accumulating generation logs, the learning loop identifies:

- **Recurring prompts**: Same or similar prompts used multiple times -> template candidate
- **Model preferences**: Which model consistently produces accepted outputs for which style
- **Parameter optimization**: Optimal step count, CFG, and resolution for each model/style combination
- **Failure patterns**: Common OOM conditions, quality rejections, and their parameter contexts

### Template Promotion

When a generation pattern appears 3+ times with positive outcomes:

1. Extract the workflow JSON as a named template
2. Parameterize the variable elements (prompt text, seed, output path)
3. Register as a reusable skill template
4. Surface in skill-creator suggestions: "You've generated 5 Seattle skylines with FLUX -- use the `seattle-hero` template?"

## Workflow Library Management

### Template Storage

Templates are stored as JSON files in the skill-creator's template directory:

```
.claude/skills/comfyui/templates/
  flux-t2i-1024.json
  sdxl-t2i-1024.json
  sdxl-controlnet-depth.json
  ltx-t2v-5sec.json
  upscale-4x-tile.json
  seattle-hero.json  (promoted from registry)
```

### Version Control

Templates are versioned alongside the skill-creator configuration. When ComfyUI updates break a workflow (node API changes), the template validation step catches the incompatibility before execution.

> **Related:** See [01-api-bridge](01-api-bridge.md) for the underlying REST/WebSocket client and [05-security-sandboxing](05-security-sandboxing.md) for Docker isolation of the ComfyUI instance that the MCP bridge connects to.

## Summary

The skill-creator integration layer wraps ComfyUI in a DACP-compatible interface: human intent maps to workflow selection, execution flows through the MCP bridge to a Docker-isolated ComfyUI instance, and outcomes feed back into the registry for pattern detection and template promotion. The learning loop closes the cycle: what starts as ad-hoc generation evolves into a library of reusable, optimized workflow templates.
