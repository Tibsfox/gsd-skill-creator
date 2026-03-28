# Frontier Models and Reasoning (2023-present)

## Overview

Since late 2023, the frontier has fractured into distinct dimensions: raw capability, reasoning depth, cost efficiency, and open-weight competitiveness. This module surveys the current model landscape and the emergence of reasoning as a first-class capability.

## Frontier Model Families (Q1 2026)

### Claude (Anthropic)

| Model | Release | Context | Key Capabilities |
|-------|---------|---------|-----------------|
| Claude 3 Opus | Mar 2024 | 200K | Graduate-level reasoning; longest sustained quality |
| Claude 3.5 Sonnet | Jun 2024 | 200K | Best code generation of its era; fast |
| Claude 3.5 Haiku | Oct 2024 | 200K | Cost-efficient; strong for classification |
| Claude Opus 4 | 2025 | 200K | Extended thinking; 7-hour agentic runs |
| Claude Sonnet 4 | 2025 | 200K | Production workhorse; tool use |

Anthropic's Constitutional AI approach -- training models to be helpful, harmless, and honest through self-critique -- distinguishes Claude from competitors. Extended thinking (visible chain-of-thought) enables Claude to work through complex problems step-by-step.

### GPT (OpenAI)

| Model | Release | Context | Key Capabilities |
|-------|---------|---------|-----------------|
| GPT-4 | Mar 2023 | 128K | First multimodal frontier model |
| GPT-4o | May 2024 | 128K | Audio/visual native; faster inference |
| o1 | Sep 2024 | 128K | Reasoning model; chain-of-thought |
| o3 | Dec 2024 | 128K | IMO gold medal level; advanced reasoning |
| GPT-4.1 | 2025 | 1M | Extended context; instruction following |

OpenAI's o-series introduced explicit "thinking time" -- the model generates internal reasoning chains before producing its answer. o3 achieved gold medal performance on the International Mathematical Olympiad (2025).

### Gemini (Google DeepMind)

| Model | Release | Context | Key Capabilities |
|-------|---------|---------|-----------------|
| Gemini 1.5 Pro | Feb 2024 | 1M | First million-token context |
| Gemini 2.0 Flash | Dec 2024 | 1M | Multimodal; agent-native |
| Gemini 2.5 Pro | Mar 2025 | 1M | Deep Think reasoning mode |

Google's Gemini family pioneered million-token context windows and native multimodal understanding (text, image, audio, video in a single model).

### Open-Weight Frontier

| Model | Org | Parameters | License | Benchmark Performance |
|-------|-----|-----------|---------|----------------------|
| DeepSeek-R1 | DeepSeek | 671B (MoE) | MIT | Matches o1 on math/coding |
| Llama 4 Scout | Meta | 109B (MoE) | Meta License | 10M context; 17B active |
| Llama 4 Maverick | Meta | 400B (MoE) | Meta License | Frontier quality, open-weight |
| Qwen 3 | Alibaba | 0.6-235B | Apache 2.0 | Thinking mode; multilingual |
| Mistral Large | Mistral AI | ~100B | Research License | Strong European alternative |

## The Reasoning Revolution

### Inference-Time Compute Scaling

The most significant development since scaling laws: increasing compute at inference time (not just training time) improves reasoning capability:

- **Training-time scaling**: More parameters + more data = better base capability (Kaplan/Chinchilla)
- **Inference-time scaling**: More thinking time per query = better reasoning on hard problems

This is a fundamental shift. A smaller model that "thinks longer" can outperform a larger model that answers immediately on reasoning-heavy tasks.

### Chain-of-Thought and Extended Thinking

Models generate explicit reasoning chains before producing answers:

```
Question: If it takes 5 machines 5 minutes to make 5 widgets,
how long does it take 100 machines to make 100 widgets?

Thinking:
- Each machine makes 1 widget in 5 minutes
- With 100 machines, each still takes 5 minutes for 1 widget
- So 100 machines make 100 widgets in 5 minutes

Answer: 5 minutes
```

Extended thinking (Claude) and Deep Think (Gemini) make this reasoning visible and controllable.

### Mathematical Reasoning Milestones

| Date | Achievement | Model | Benchmark |
|------|------------|-------|-----------|
| Sep 2024 | Silver medal level | o1-preview | International Math Olympiad |
| Dec 2024 | Gold medal level | o3 | International Math Olympiad |
| Mar 2025 | Near-perfect on AIME | Gemini 2.5 | American Invitational Math Exam |
| 2025 | 90%+ on MATH | Multiple | Competition mathematics |

## Cost Collapse

### Price Per Million Tokens (Input)

| Date | Model | Price/1M tokens | Relative |
|------|-------|----------------|----------|
| Mar 2023 | GPT-4 | $30.00 | 1.0x |
| May 2024 | GPT-4o | $5.00 | 6x cheaper |
| Jun 2024 | Claude 3.5 Sonnet | $3.00 | 10x cheaper |
| Oct 2024 | Claude 3.5 Haiku | $0.25 | 120x cheaper |
| Jan 2025 | DeepSeek-R1 (API) | $0.14 | 214x cheaper |
| Mar 2025 | Gemini 2.0 Flash | $0.075 | 400x cheaper |

The cost of frontier-quality inference has dropped by approximately 1000x in 18 months. This is not just price competition -- architectural improvements (MoE, quantization, speculative decoding) genuinely reduce the compute required per token.

## Multimodal Capabilities

### Vision

Frontier models now process images alongside text:

- **Document understanding**: Read PDFs, charts, diagrams, handwritten notes
- **Code from screenshots**: Generate code from UI mockups
- **Scientific figure analysis**: Interpret plots, microscopy images, astronomical data
- **Computer use**: Navigate GUIs by interpreting screen content

### Audio and Video

- **Gemini**: Native audio/video understanding -- process hours of video with transcription and visual analysis
- **GPT-4o**: Real-time voice conversation with emotional understanding
- **Claude**: Image analysis; no native audio (as of Q1 2026)

## The Inference Famine

### Compute Demand vs. Supply

Inference compute demand is growing faster than supply:

- **Training**: One-time cost, amortized across all users
- **Inference**: Per-query cost, scales with usage
- **Demand growth**: 10x per year (estimated)
- **Supply growth**: 2-3x per year (new GPU production)

This gap drives architectural innovation: MoE models that activate fewer parameters per token, quantization that reduces memory per parameter, speculative decoding that reduces generation latency, and caching strategies that avoid redundant computation.

### The Amiga Principle Response

The Inference Famine is driving exactly the architectural innovation that the Amiga Principle describes: not brute scale, but elegant architecture that achieves more with less. MoE models, local inference on consumer GPUs, task routing between API and local models -- these are all responses to the same constraint that Commodore faced in 1985.

> **Related:** See [04-agentic-architecture](04-agentic-architecture.md) for how frontier models are deployed as agents, and [05-alignment-safety](05-alignment-safety.md) for the safety challenges that frontier capabilities create.

## Summary

The frontier model landscape in Q1 2026 features Claude, GPT, Gemini, and strong open-weight competitors (DeepSeek, Llama 4, Qwen 3). The reasoning revolution -- inference-time compute scaling -- has enabled models to win mathematical olympiads. Costs have collapsed 1000x in 18 months. The Inference Famine is driving architectural innovation away from brute scale toward the elegant efficiency that the Amiga Principle prescribes.
