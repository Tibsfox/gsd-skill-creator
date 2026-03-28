# LoRA and Fine-Tuning Frameworks

## Overview

LoRA (Low-Rank Adaptation) enables fine-tuning large models on consumer GPUs by decomposing weight updates into low-rank matrices. This module documents the mechanics, framework comparison, and the dataset design for GSD-dialect training.

## LoRA Mechanics

### The Core Idea

Instead of updating all model weights during fine-tuning (which requires storing full optimizer states in VRAM), LoRA freezes the pretrained weights and injects trainable low-rank decomposition matrices:

```
Standard fine-tuning:
  W_new = W_pretrained + delta_W    (delta_W is full-rank: same size as W)

LoRA:
  W_new = W_pretrained + B * A      (B is d x r, A is r x d, where r << d)
```

- **d**: Original weight dimension (e.g., 4096 for hidden_dim)
- **r**: LoRA rank (typically 8-64; higher = more expressiveness, more VRAM)
- **Trainable parameters**: 2 * d * r per adapted layer (vs. d * d for full fine-tuning)
- **Memory savings**: For r=16, d=4096: LoRA trains 131K params per layer vs. 16.8M for full fine-tuning -- a 128x reduction

### Which Layers to Adapt

Standard practice adapts the attention projection matrices:

| Layer | Typical LoRA Target | Impact |
|-------|-------------------|--------|
| Q projection | Yes (high impact) | Query attention patterns |
| K projection | Yes (high impact) | Key attention patterns |
| V projection | Yes (moderate) | Value transformation |
| O projection | Sometimes | Output projection |
| MLP up_proj | Sometimes | Feed-forward network |
| MLP down_proj | Sometimes | Feed-forward network |
| MLP gate_proj | Rarely | Gating mechanism |

For GSD-dialect training, targeting Q, K, V, and O projections with rank 16-32 provides good results on 8GB VRAM.

## Framework Comparison

### Unsloth

- **Speed**: 2-5x faster than standard Hugging Face training
- **VRAM**: 80% less VRAM than standard fine-tuning
- **Mechanism**: Custom CUDA kernels that fuse operations; manual gradient checkpointing; optimized LoRA implementation
- **Models**: LLaMA 3.x, Qwen 2.5, Mistral, Gemma, Phi, CodeLlama
- **Interface**: Python API (notebook-friendly) + CLI
- **License**: Apache 2.0
- **Recommended for**: Consumer GPU training (8-24GB VRAM)

### Axolotl

- **Features**: YAML-based configuration; supports LoRA, QLoRA, full fine-tuning, DPO, RLHF
- **VRAM**: Standard Hugging Face PEFT efficiency (no custom kernels)
- **Mechanism**: Wraps Hugging Face Transformers + PEFT + DeepSpeed
- **Models**: Any Hugging Face-compatible model
- **Interface**: YAML config files; CLI
- **License**: Apache 2.0
- **Recommended for**: Complex training configurations; multi-GPU setups

### Hugging Face PEFT

- **Features**: Official LoRA/QLoRA implementation from Hugging Face
- **VRAM**: Baseline efficiency
- **Mechanism**: Standard PyTorch training loop with LoRA adapter injection
- **Models**: Any Hugging Face model
- **Interface**: Python API
- **License**: Apache 2.0
- **Recommended for**: Custom training loops; integration with existing HF pipelines

### Framework Decision Matrix

| Factor | Unsloth | Axolotl | HF PEFT |
|--------|---------|---------|---------|
| Speed | Fastest | Standard | Standard |
| VRAM efficiency | Best | Good | Good |
| Config complexity | Low | Medium (YAML) | Low (Python) |
| Model support | Limited | Broad | Broadest |
| Multi-GPU | Limited | Yes (DeepSpeed) | Yes |
| DPO/RLHF support | Limited | Full | Manual |

## GSD-Dialect Dataset Design

### Training Data Sources

The GSD-dialect LoRA adapter trains on ecosystem-specific data:

| Source | Content | Est. Examples |
|--------|---------|---------------|
| DACP bundle patterns | Three-part bundle structure examples | 200-500 |
| Chipset YAML schemas | Amiga chipset configuration examples | 100-200 |
| Mission pack structure | Vision/Research/Mission document patterns | 50-100 |
| PNW bioregion taxonomy | Species, ecoregion, and habitat terminology | 300-500 |
| GSD workflow commands | Phase plans, roadmap entries, state transitions | 200-400 |
| Commit message style | Conventional Commits with GSD scope conventions | 500-1000 |

### Data Format

Training data formatted as instruction/response pairs in the Alpaca format:

```json
{
  "instruction": "Generate a DACP bundle for requesting an image generation of the PNW rainforest canopy at dawn.",
  "input": "",
  "output": "{\n  \"human_intent\": {\n    \"type\": \"image_generation\",\n    \"description\": \"PNW temperate rainforest canopy at dawn, moss-covered Sitka spruce, morning fog\",\n    \"style\": \"photorealistic\"\n  },\n  \"workflow\": \"flux-t2i-1024\",\n  \"trigger\": {\n    \"type\": \"immediate\",\n    \"output_path\": \".planning/staging/assets/pnw_canopy.png\"\n  }\n}"
}
```

### Data Quality Requirements

- **Accuracy**: Every YAML schema example must validate against the actual schema
- **Consistency**: Terminology matches the GSD ecosystem exactly (no synonyms or paraphrases)
- **Diversity**: Cover the full range of GSD operations, not just common patterns
- **Negative examples**: Include examples of incorrect format with correction explanations

## GGUF Export Pipeline

### From Fine-Tuned Checkpoint to Servable Model

```
Training (Unsloth/Axolotl)
     |
     v
LoRA Adapter (safetensors)
     |
     v
Merge with Base Model
     |   (lora.merge_and_unload())
     v
Full Model (safetensors)
     |
     v
GGUF Conversion
     |   (llama.cpp/convert_hf_to_gguf.py)
     v
Quantize to Target Level
     |   (llama.cpp/llama-quantize model.gguf model-Q4_K_M.gguf Q4_K_M)
     v
GGUF Model (deployable)
     |
     v
Ollama Modelfile
     |   (FROM ./model-Q4_K_M.gguf)
     v
Ollama Serve
```

### Critical Steps

1. **Merge**: The LoRA adapter must be merged back into the base model weights before GGUF conversion. Serving separate adapter + base is possible but adds latency.
2. **Conversion**: The `convert_hf_to_gguf.py` script from llama.cpp handles the format conversion. Tokenizer and metadata are embedded in the GGUF file.
3. **Quantization**: Apply the target quantization level during conversion (Q4_K_M recommended for deployment).
4. **Modelfile**: Create an Ollama Modelfile that references the GGUF file and sets system prompt, temperature, and other parameters.

## Training on RTX 4060 Ti 8GB

### What Fits

| Model | Quant | LoRA Rank | Batch Size | Context | VRAM Usage |
|-------|-------|-----------|------------|---------|------------|
| Qwen3-8B | QLoRA (4-bit) | 16 | 1 | 2048 | ~6.5 GB |
| Qwen3-8B | QLoRA (4-bit) | 32 | 1 | 2048 | ~7.2 GB |
| Qwen3-8B | QLoRA (4-bit) | 16 | 2 | 1024 | ~7.0 GB |
| CodeLlama-7B | QLoRA (4-bit) | 16 | 1 | 2048 | ~6.0 GB |

### Training Time Estimates

For a GSD-dialect dataset of ~2,000 examples:

| Framework | Epochs | Est. Time (RTX 4060 Ti) |
|-----------|--------|------------------------|
| Unsloth | 3 | 15-30 minutes |
| Axolotl | 3 | 45-90 minutes |
| HF PEFT | 3 | 45-90 minutes |

> **Related:** See [01-inference-runtimes](01-inference-runtimes.md) for serving the trained model and [04-production-pipeline](04-production-pipeline.md) for the eval harness that validates training quality.

## Summary

LoRA enables fine-tuning models up to 8B parameters on an RTX 4060 Ti 8GB using QLoRA (4-bit quantization during training). Unsloth is the recommended framework for consumer GPU training due to its 2-5x speed advantage. The GSD-dialect dataset draws from DACP bundles, chipset schemas, mission pack structures, and PNW taxonomy. The GGUF export pipeline converts trained adapters into Ollama-servable models in under an hour.
