# Lessons — v1.49.130

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The Amiga Principle applied to LLM inference: the 68000 (Claude Code) does not need a faster clock, it needs specialized partners (local GPU for deterministic work, API for judgment).**
   The task routing architecture is the bus that connects them.
   _⚙ Status: `investigate` · lesson #754_

2. **Qwen3.5-35B-A3B at 213 tokens/second on a 24GB GPU demonstrates that mixture-of-experts models have fundamentally changed the economics of local inference -- active parameters matter more than total p**
   Qwen3.5-35B-A3B at 213 tokens/second on a 24GB GPU demonstrates that mixture-of-experts models have fundamentally changed the economics of local inference -- active parameters matter more than total parameters.
   _⚙ Status: `investigate` · lesson #755_

3. **LoRA fine-tuning on consumer hardware (8-16GB VRAM via Unsloth) means a model that speaks your project's dialect is achievable in hours, not weeks -- the bottleneck is dataset curation, not compute.**
   _⚙ Status: `investigate` · lesson #756_

4. **Multi-GPU inference (tensor parallelism across two consumer cards) is mentioned but not deeply explored -- this is the practical scaling path for consumer hardware**
   _⚙ Status: `investigate` · lesson #757_

5. **The cost analysis between local and API inference needs actual measured numbers from the target hardware (RTX 4060 Ti 8GB) rather than extrapolated benchmarks**
   _🤖 Status: `investigate` · lesson #758 · needs review_
   > LLM reasoning: No evidence of measured RTX 4060 Ti local-vs-API inference benchmarks in candidate release.
