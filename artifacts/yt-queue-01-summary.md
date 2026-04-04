# yt-queue-01: Recursive Language Models (RLMs)

**Source:** YouTube transcript (yt-queue-01.en.vtt)
**Topic:** Recursive Language Models -- an inference paradigm from MIT for handling arbitrarily long contexts
**Extracted:** 2026-04-03

---

## What Are RLMs?

Recursive Language Models are an **inference scaffold** (not a new model architecture) where a pre-trained LLM interacts with arbitrarily long prompts through an external **programmable environment** -- specifically a Read-Eval-Print Loop (REPL). Instead of dumping an entire massive context into the LLM's window, the RLM approach gives the LLM a Python REPL and lets it **write code to explore, decompose, and transform** the prompt data programmatically. The LLM works like a human in a Jupyter notebook: it peeks at slices of data, writes analysis code, executes it, reads output, then decides what to do next -- block by block.

## The Problem: Long Context Degradation

LLMs have fixed context windows and suffer from two well-documented problems:

- **U-shaped retrieval curve:** Models retrieve information well from the beginning and end of their context but degrade in the middle.
- **Context rot:** When 95% of the input is irrelevant to the query, the noise causes hallucinations.

Existing approaches (RAG, multi-step ReAct loops, CodeAct, sub-agent architectures) all attempt to address this. RLMs claim to outperform all of them.

## Key Technical Details

1. **REPL-based exploration:** The LLM writes Python code to selectively load only the relevant portions of context into its window -- it *chooses* what to see.
2. **Recursive sub-agents:** The LLM can call `llm_query()` to spawn child RLM agents for subtasks. These sub-agents can themselves recurse (with a configurable depth limit to prevent runaway costs).
3. **Symbolic variable return:** Sub-agent results are returned as **Python variables** in the parent's REPL -- not dumped into the parent's context window. The parent can inspect, transform, or directly compose these results without reading the raw text.
4. **Non-autoregressive output:** RLMs can construct answers inside Python variables rather than generating them token-by-token. This means theoretically unlimited output length and avoidance of autoregressive counting errors (e.g., the "count Rs in strawberry" problem).
5. **Implementation architecture:** The presenter built an implementation using **Deno** as the orchestrator runtime with **Pyodide** (Python-in-WebAssembly) providing the sandboxed REPL. Pyodide natively supports the REPL pattern where state persists across code blocks.
6. **Cost efficiency:** Sub-agents maintain their own message histories, hitting KV caches frequently. Output tokens (the expensive part) are minimal since the LLM writes small code snippets rather than generating long prose.

## Performance Claims

- Outperforms RAG, ReAct, CodeAct, and sub-agent architectures on long-context benchmarks
- Tested on LongBench HotpotQA dataset (multi-hop reasoning over long documents)
- More robust to noise: even if 99% of input is irrelevant, the recursive search means the LLM never processes data it doesn't need
- Preserves **causal/positional relationships** in text (unlike RAG's similarity-based retrieval, which loses ordering)

## Papers and Researchers

- The RLM paper originated from **MIT** (specific authors not named in the transcript)
- The presenter implemented it from scratch, referencing the DSPy RLM module for architectural inspiration
- Models used in demos: **MiniMax M2.5** (sub-agents) and **Zhipu GLM-5** (main agent)

## Connection to Agent Orchestration

RLMs are directly relevant to our multi-agent work:

- **Symbolic composition over context pollution:** Sub-agent results stay as variables, not raw text in the parent's context. This is the inverse of how most agent frameworks work (Claude Code, etc.) where sub-agent output floods the parent context.
- **Recursive task decomposition:** Natural fit for multi-hop reasoning, code-based search, and multi-document synthesis -- the same patterns our Gastown orchestration handles.
- **REPL as execution environment:** The code-writing-and-executing loop mirrors our polecat-worker pattern. The key insight is that the LLM controls what enters its own context window through code.
- **Depth-limited recursion with model tiering:** Using stronger models at the root agent and cheaper models for sub-agents maps directly to our mayor/polecat hierarchy and GSD's model profile system.
- **Cost structure:** Input-heavy (cached) with minimal output tokens. This inverts the typical agent cost profile and could significantly reduce API spend for research-heavy tasks.
