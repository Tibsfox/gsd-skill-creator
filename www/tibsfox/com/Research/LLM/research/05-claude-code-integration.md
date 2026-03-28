# Claude Code Integration

## Overview

This module specifies how Claude Code connects to local inference endpoints, the task routing strategy that determines which requests go to local models vs. the Anthropic API, and the GSD-dialect fine-tuned model as a lightweight subagent.

## ANTHROPIC_BASE_URL Configuration

### The Key Environment Variable

Claude Code sends all API requests to `api.anthropic.com` by default. Setting `ANTHROPIC_BASE_URL` redirects these requests to any compatible endpoint:

```bash
# Route to Ollama (Anthropic Messages API)
export ANTHROPIC_BASE_URL=http://localhost:11434/v1

# Route to LM Studio
export ANTHROPIC_BASE_URL=http://localhost:1234/v1

# Route to vLLM (if configured with Anthropic-compatible endpoint)
export ANTHROPIC_BASE_URL=http://localhost:8000/v1
```

### Configuration Methods

| Method | Scope | Persistence |
|--------|-------|-------------|
| Shell export | Current terminal session | Until terminal closes |
| `.bashrc` / `.zshrc` | All new shells | Permanent |
| `.env` file in project | Project-scoped | Permanent per project |
| Claude Code settings | Claude Code sessions | Permanent |

### Verification

After setting `ANTHROPIC_BASE_URL`, verify the connection:

```bash
# Test the endpoint directly
curl http://localhost:11434/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: not-needed-for-local" \
  -d '{
    "model": "qwen3-coder:8b",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Task Routing Strategy

### The Amiga Principle Applied to Task Routing

Not all tasks require Opus-class reasoning. The routing strategy classifies tasks by judgment complexity:

```
TASK ROUTING MATRIX
====================

  HIGH JUDGMENT                    LOW JUDGMENT
  (Anthropic API)                  (Local Model)
  +------------------+            +------------------+
  | Cross-module     |            | YAML validation  |
  | synthesis        |            |                  |
  | Architecture     |            | Scaffolding      |
  | decisions        |            | generation       |
  | Alignment-       |            | Commit message   |
  | sensitive work   |            | drafting         |
  | Novel problem    |            | Schema checking  |
  | solving          |            | Boilerplate      |
  | Complex code     |            | Template fill    |
  | review           |            | Format conversion|
  +------------------+            +------------------+
```

### Task Categories

| Category | Route | Reason | Examples |
|----------|-------|--------|----------|
| Scaffolding | Local | Deterministic; template-based | File stubs, test boilerplate, interface definitions |
| YAML validation | Local | Schema-checkable; no judgment | Chipset YAML, DACP bundle validation |
| Commit messages | Local | Pattern-based; conventional format | Conventional Commits from diffs |
| Code completion | Local | Context-limited; fast iteration | Single-function implementation |
| Synthesis | API | Requires multi-context reasoning | Cross-module integration, architecture |
| Code review | API | Requires judgment about intent | PR review, security audit |
| Mission planning | API | Requires strategic reasoning | Wave decomposition, resource allocation |
| Novel problems | API | No training data pattern to match | First-time implementations |

### Dynamic Routing

The task router can operate at two levels:

**Manual routing**: Developer explicitly chooses which Claude Code sessions use local vs. API by setting/unsetting `ANTHROPIC_BASE_URL`.

**Automatic routing** (future): A lightweight classifier model examines the prompt and routes based on estimated complexity. This requires the skill-creator integration to intercept API calls before they reach the endpoint.

## GSD-Dialect Model as Subagent

### Subagent Architecture

In the GSD wave execution model, the local model serves as a lightweight subagent for deterministic tasks:

```
WAVE EXECUTION WITH LOCAL SUBAGENT
====================================

  Orchestrator (Opus via API)
       |
       |-- Assigns wave tasks
       |
       +-- Task A (synthesis) -----> Anthropic API (Opus)
       |
       +-- Task B (scaffolding) ---> Local Model (Qwen3-8B + GSD LoRA)
       |
       +-- Task C (validation) ----> Local Model (Qwen3-8B + GSD LoRA)
       |
       +-- Task D (code review) ---> Anthropic API (Sonnet)
       |
       v
  Results aggregated by orchestrator
```

### Benefits

- **Cost reduction**: Scaffolding and validation tasks cost zero API tokens
- **Latency**: Local inference starts immediately (no network round-trip)
- **Privacy**: Sensitive project data never leaves the machine
- **Availability**: Works without internet connection for cached models
- **Throughput**: Multiple local requests can run while waiting for API responses

### Limitations

- **Quality ceiling**: Local models (7-8B on 8GB VRAM) cannot match Opus on complex reasoning
- **Context length**: GGUF models typically limited to 4K-8K context vs. 200K for Claude
- **Multimodal**: No image/document understanding in most local models
- **Tool use**: Limited or absent tool use capability compared to Claude

## Integration with GSD Wave Execution

### Wave-Level Routing

```yaml
wave_config:
  wave_0:
    tasks:
      - name: "Foundation schemas"
        route: local
        model: "qwen3-coder:8b-gsd"
      - name: "Template stubs"
        route: local
        model: "qwen3-coder:8b-gsd"

  wave_1:
    tasks:
      - name: "Module 1 research"
        route: api
        model: "claude-sonnet-4-20250514"
      - name: "Module 2 research"
        route: api
        model: "claude-sonnet-4-20250514"
      - name: "YAML validation"
        route: local
        model: "qwen3-coder:8b-gsd"

  wave_2:
    tasks:
      - name: "Cross-module synthesis"
        route: api
        model: "claude-opus-4-20250514"
```

### Cost Projection

For a typical GSD mission execution (5 waves, 15-20 tasks):

| Scenario | API Tokens | Local Tokens | Est. Cost |
|----------|-----------|-------------|-----------|
| All API (current) | ~200K | 0 | ~$6-12 |
| Hybrid routing | ~120K | ~80K | ~$3.50-7 |
| Aggressive local | ~80K | ~120K | ~$2.50-5 |

The savings compound across missions: at 10 missions per month, hybrid routing saves $25-50/month.

## Security Considerations

### Localhost-Only Binding

```bash
# CORRECT: Bind to localhost only
export ANTHROPIC_BASE_URL=http://127.0.0.1:11434/v1

# DANGEROUS: Bind to all interfaces
# export ANTHROPIC_BASE_URL=http://0.0.0.0:11434/v1
# This exposes the inference endpoint to the network!
```

### API Key Handling

When routing to a local endpoint, the API key field in requests is typically ignored. However:

- Never send a real Anthropic API key to a local endpoint (the endpoint could log it)
- Use a placeholder key: `x-api-key: local-inference-no-key-needed`
- The Ollama and LM Studio servers do not require authentication by default

> **SAFETY: The ANTHROPIC_BASE_URL redirection is transparent to Claude Code. If the local model produces incorrect output on a task that was misrouted (e.g., a judgment-heavy task sent to a 7B model), the error may not be immediately obvious. Start with manual routing and expand to automatic routing only after building confidence in the task classifier.**

## Summary

Claude Code integrates with local inference through the `ANTHROPIC_BASE_URL` environment variable, routing requests to Ollama or LM Studio endpoints that support the Anthropic Messages API. The task routing strategy sends deterministic tasks (scaffolding, validation, commit messages) to local models while reserving judgment-heavy tasks (synthesis, architecture, review) for the Anthropic API. The GSD-dialect LoRA adapter enables the local model to speak the ecosystem's vocabulary. Cost savings of 30-60% are achievable through hybrid routing.
