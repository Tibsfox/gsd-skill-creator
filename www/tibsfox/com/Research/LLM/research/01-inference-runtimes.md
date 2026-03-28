# Inference Runtime Landscape

## Overview

Three major local inference runtimes serve open-weight language models on consumer hardware. This module compares Ollama, vLLM, and LM Studio across deployment contexts, API compatibility, and performance characteristics.

## Ollama

### Architecture

Ollama is a developer-first CLI tool for running large language models locally. It wraps llama.cpp as the inference backend and provides a model management layer inspired by Docker:

- **Model format**: GGUF (llama.cpp native)
- **Model registry**: `ollama.com/library` -- pull models like `ollama pull llama3.2`
- **API**: OpenAI-compatible `/v1/chat/completions` endpoint + Anthropic Messages API (since v0.5+)
- **Platform**: macOS, Linux, Windows; Apple Silicon and NVIDIA GPU acceleration
- **Default port**: 11434

### Key Commands

| Command | Purpose |
|---------|---------|
| `ollama pull qwen3-coder:32b` | Download a model |
| `ollama run qwen3-coder:32b` | Interactive chat |
| `ollama serve` | Start the API server |
| `ollama list` | List downloaded models |
| `ollama show qwen3-coder:32b` | Model metadata and parameters |
| `ollama create mymodel -f Modelfile` | Create custom model with system prompt |

### Strengths and Limitations

- **Strengths**: Simplest setup (single binary); excellent model library; automatic VRAM management; concurrent model serving; Modelfile customization
- **Limitations**: Single-user focused (no production load balancing); GGUF format only (no AWQ/GPTQ); limited batching compared to vLLM

## vLLM

### Architecture

vLLM is a high-throughput inference engine designed for production serving. Its key innovation is PagedAttention, which manages KV cache memory like virtual memory pages:

- **Model format**: SafeTensors, AWQ, GPTQ, FP8 (Hugging Face Hub)
- **API**: OpenAI-compatible; also supports custom serving endpoints
- **Platform**: Linux (primary); NVIDIA GPU required
- **Key feature**: PagedAttention -- eliminates KV cache fragmentation, enabling 2-4x throughput improvement over naive implementations

### Performance Characteristics

| Feature | vLLM | Ollama | LM Studio |
|---------|------|--------|-----------|
| Concurrent requests | Excellent | Limited | Limited |
| Throughput (tok/s, batch) | Highest | Moderate | Moderate |
| Latency (single request) | Low | Low | Low |
| Memory efficiency | Best (PagedAttention) | Good (GGUF) | Good (GGUF) |
| Setup complexity | High | Low | Lowest |

### Speculative Decoding

vLLM supports speculative decoding: a small "draft" model generates candidate tokens that the large model verifies in parallel. This can reduce latency by 2-3x for tasks where the draft model's predictions are frequently correct (code completion, structured output).

## LM Studio

### Architecture

LM Studio provides a GUI application with an embedded inference server. Since version 0.4.1 (January 2026), it supports Anthropic Messages API compatibility:

- **Model format**: GGUF (primary); SafeTensors (via conversion)
- **Model discovery**: Built-in Hugging Face Hub browser with VRAM compatibility filtering
- **API**: OpenAI-compatible + Anthropic Messages API (v0.4.1+)
- **Platform**: macOS, Windows, Linux; Apple Silicon and NVIDIA GPU
- **Default port**: 1234

### Key Features

- **VRAM calculator**: Shows estimated memory usage before loading a model
- **Chat interface**: Built-in chat UI for testing prompts
- **Model comparison**: Load two models side-by-side for A/B testing
- **API server**: Toggle-on server mode exposing OpenAI/Anthropic-compatible endpoints

## API Compatibility Matrix

| Feature | Ollama | vLLM | LM Studio |
|---------|--------|------|-----------|
| `/v1/chat/completions` | Yes | Yes | Yes |
| `/v1/completions` | Yes | Yes | Yes |
| `/v1/embeddings` | Yes | Yes | Limited |
| Anthropic Messages API | Yes (v0.5+) | No | Yes (v0.4.1+) |
| Streaming | Yes | Yes | Yes |
| Function calling | Yes | Yes | Yes |
| JSON mode | Yes | Yes | Yes |
| Vision (multimodal) | Yes | Yes | Yes |

### ANTHROPIC_BASE_URL Integration

The critical integration point for Claude Code is the `ANTHROPIC_BASE_URL` environment variable. When set, Claude Code sends API requests to the specified endpoint instead of `api.anthropic.com`:

```bash
# Ollama (with Anthropic Messages API support)
export ANTHROPIC_BASE_URL=http://localhost:11434/v1

# LM Studio (with Anthropic Messages API support)
export ANTHROPIC_BASE_URL=http://localhost:1234/v1
```

This redirection is transparent to Claude Code -- it sends the same request format and receives the same response format. The local model must support the Anthropic Messages API schema for this to work correctly.

## Model Format Comparison

### GGUF

- **Origin**: llama.cpp project
- **Quantization**: Built-in quantization levels (Q2_K through Q8_0, FP16)
- **Compatibility**: Ollama, LM Studio, llama.cpp, koboldcpp
- **Advantage**: Single-file format; quantization metadata embedded in the file
- **Disadvantage**: CPU-heavy dequantization for some operations

### SafeTensors

- **Origin**: Hugging Face
- **Quantization**: Separate from model file; applied at load time or via conversion
- **Compatibility**: vLLM, Hugging Face Transformers, TGI
- **Advantage**: Standard format for model distribution; fast loading
- **Disadvantage**: Requires separate quantization tooling

### AWQ / GPTQ

- **Purpose**: GPU-optimized quantization formats
- **AWQ**: Activation-aware weight quantization -- preserves salient weights
- **GPTQ**: Post-training quantization using second-order information
- **Compatibility**: vLLM, AutoGPTQ, AutoAWQ
- **Advantage**: Faster GPU inference than GGUF quantization
- **Disadvantage**: GPU-only; less portable than GGUF

## Deployment Decision Matrix

| Use Case | Recommended Runtime | Reason |
|----------|-------------------|--------|
| Developer workstation, single user | Ollama | Simplest setup; excellent DX |
| Production serving, multiple users | vLLM | PagedAttention; batch throughput |
| Non-technical users, GUI needed | LM Studio | Visual model management |
| Claude Code integration | Ollama or LM Studio | Anthropic Messages API support |
| Maximum throughput, GPU cluster | vLLM | Distributed serving; tensor parallelism |

> **Related:** See [02-gpu-quantization](02-gpu-quantization.md) for VRAM math per model and [05-claude-code-integration](05-claude-code-integration.md) for the ANTHROPIC_BASE_URL configuration details.

## Summary

Ollama is the recommended primary runtime for GSD ecosystem integration due to its developer-first design, Anthropic Messages API support, and simple model management. vLLM is the production alternative for high-throughput serving. LM Studio provides a GUI option with the same API compatibility. All three support the OpenAI-compatible API; Ollama and LM Studio additionally support the Anthropic Messages API required for transparent Claude Code redirection.
