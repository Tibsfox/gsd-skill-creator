# v1.49.130 "Local LLM"

**Released:** 2026-03-28
**Code:** LLM
**Series:** PNW Research Series (#130 of 167)

## Summary

The Local LLM Ecosystem maps the complete stack for running language model inference on consumer hardware and integrating it with Claude Code as a hybrid intelligence layer. Following the Amiga Principle -- give the 68000 partners, not a faster clock -- this project documents three major inference runtimes (Ollama, vLLM, LM Studio), GPU architecture and quantization mathematics, LoRA fine-tuning pipelines for GSD-dialect training, and the ANTHROPIC_BASE_URL routing strategy that sends deterministic work to local hardware while reserving Opus-class reasoning for judgment-heavy synthesis.

## Key Features

| Metric | Value |
|--------|-------|
| Research Modules | 5 |
| Total Lines | ~4,502 |
| Safety-Critical Tests | 5 |
| Parallel Tracks | 2 |
| Est. Tokens | ~174K |
| Color Theme | Deep indigo / electric blue / teal |

### Research Modules

1. **M1: Inference Runtime Landscape** -- Three major runtimes compared (Ollama, vLLM, LM Studio), OpenAI/Anthropic-compatible API endpoints, PagedAttention for memory efficiency, speculative decoding, model format support (GGUF, SafeTensors, AWQ, GPTQ)
2. **M2: GPU Architecture & Quantization** -- VRAM math for consumer GPUs (RTX 3090/4090/5090/4060 Ti), quantization landscape (Q4_K_M, Q5_K_M, Q8_0, FP16), memory formula (parameters x bytes-per-weight + KV cache + overhead), throughput benchmarks
3. **M3: LoRA & Fine-Tuning Frameworks** -- Low-rank decomposition mechanics, framework comparison (Unsloth 2-5x faster at 80% less VRAM, Axolotl, HF PEFT), dataset preparation for GSD-dialect training, GGUF export pipeline
4. **M4: Model-to-Production Pipeline** -- End-to-end pipeline from model selection to monitoring, eval harness for GSD-specific tasks (DACP bundle generation, YAML validation), A/B testing between base and LoRA adapter, regression detection
5. **M5: Claude Code Integration** -- ANTHROPIC_BASE_URL redirection to local inference, task routing strategy (scaffolding to local, synthesis to API), LM Studio/Ollama Anthropic Messages API support, cost analysis per task category

### Cross-References

- **CFU** (ComfyUI) -- VRAM tier management, DACP bundle protocol, Docker deployment
- **AIH** (Intelligence Horizon) -- GPU compute, quantization, scaling laws, model evaluation
- **TCP** (TCP/IP Protocol) -- Inference serving APIs, WebSocket connections
- **SYS** (Systems Administration) -- Container deployment, localhost API configuration
- **MST** (Mesh Telescope) -- Task routing patterns, GSD wave execution

## Retrospective

### What Worked
- The VRAM math module (M2) provides a genuinely useful calculator: parameters x bytes-per-weight + KV cache + overhead, with specific numbers for every consumer GPU tier from 8GB to 32GB
- Documenting the ANTHROPIC_BASE_URL redirect as the integration point keeps the Claude Code coupling minimal -- one environment variable, no code changes
- The LoRA training module specifically addresses GSD-dialect fine-tuning (DACP bundles, YAML schemas, mission pack structures), making the training data specification concrete and testable

### What Could Be Better
- Multi-GPU inference (tensor parallelism across two consumer cards) is mentioned but not deeply explored -- this is the practical scaling path for consumer hardware
- The cost analysis between local and API inference needs actual measured numbers from the target hardware (RTX 4060 Ti 8GB) rather than extrapolated benchmarks

## Lessons Learned

- The Amiga Principle applied to LLM inference: the 68000 (Claude Code) does not need a faster clock, it needs specialized partners (local GPU for deterministic work, API for judgment). The task routing architecture is the bus that connects them.
- Qwen3.5-35B-A3B at 213 tokens/second on a 24GB GPU demonstrates that mixture-of-experts models have fundamentally changed the economics of local inference -- active parameters matter more than total parameters.
- LoRA fine-tuning on consumer hardware (8-16GB VRAM via Unsloth) means a model that speaks your project's dialect is achievable in hours, not weeks -- the bottleneck is dataset curation, not compute.

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
