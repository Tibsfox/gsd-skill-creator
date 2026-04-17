# Retrospective — v1.49.130

## What Worked

- The VRAM math module (M2) provides a genuinely useful calculator: parameters x bytes-per-weight + KV cache + overhead, with specific numbers for every consumer GPU tier from 8GB to 32GB
- Documenting the ANTHROPIC_BASE_URL redirect as the integration point keeps the Claude Code coupling minimal -- one environment variable, no code changes
- The LoRA training module specifically addresses GSD-dialect fine-tuning (DACP bundles, YAML schemas, mission pack structures), making the training data specification concrete and testable

## What Could Be Better

- Multi-GPU inference (tensor parallelism across two consumer cards) is mentioned but not deeply explored -- this is the practical scaling path for consumer hardware
- The cost analysis between local and API inference needs actual measured numbers from the target hardware (RTX 4060 Ti 8GB) rather than extrapolated benchmarks

## Lessons Learned

- The Amiga Principle applied to LLM inference: the 68000 (Claude Code) does not need a faster clock, it needs specialized partners (local GPU for deterministic work, API for judgment). The task routing architecture is the bus that connects them.
- Qwen3.5-35B-A3B at 213 tokens/second on a 24GB GPU demonstrates that mixture-of-experts models have fundamentally changed the economics of local inference -- active parameters matter more than total parameters.
- LoRA fine-tuning on consumer hardware (8-16GB VRAM via Unsloth) means a model that speaks your project's dialect is achievable in hours, not weeks -- the bottleneck is dataset curation, not compute.

---
*Part of the v1.49.101-131 research batch -- 31 new projects in a single session.*
