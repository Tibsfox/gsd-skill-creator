# v1.49.23 — Unison Language & Math Co-Processor Completion

**Shipped:** 2026-03-08
**Commits:** 8
**Files:** 109 changed | **New Code:** ~45,100 LOC
**Tests:** 48 (SYMBEX JIT) + 16 (dashboard math panel)

## Summary

Completes the math co-processor with full GPU acceleration paths and ships a comprehensive Unison Language research study with derived translation chipset. Adds cuSOLVER, cuFFT, cuRAND GPU backends, the SYMBEX JIT compiler via NVRTC, wires the dashboard math panel to live MCP data, and delivers the complete PNW research collection with the Aspen creative writing muse.

## Key Features

### Math Co-Processor GPU Completion
- **cuSOLVER:** Dense linear solves, SVD, and eigenvalue decomposition via NVIDIA cuSOLVER
- **cuFFT:** FFT and IFFT via NVIDIA cuFFT library
- **cuRAND:** Monte Carlo simulation via NVIDIA cuRAND with configurable distributions
- **SYMBEX JIT Compiler:** AST-based Python-to-CUDA C translator with NVRTC runtime compilation, kernel cache, 48 JIT-specific tests
- **MCP server configuration:** Added to project `.mcp.json` for Claude Code integration
- **Dashboard wiring:** MathBridge polls MCP server, traces operations, 16 tests

### Unison Language Research
- **Deep research study** (`www/UNI/`) -- 5 research modules + synthesis + verification, 28,693 words, 28 sources
- **Research modules:** Language foundations, content-addressed code, distributed computing model, abilities system, ecosystem & adoption
- **Static browser:** Blue/steel themed, same architecture as PNW research browsers
- **Translation chipset** (`data/chipset/unison-translation.yaml`) -- 6 skills, 4 agents, translation maps for Haskell, TypeScript, Rust, and Erlang equivalences

### PNW Research Collection
- **Complete collection staging** -- All PNW research (COL, CAS, ECO, GDN) plus mission packs organized for deployment
- **Aspen muse** -- Creative writing muse added to the muse team (experimental, v1.50 arc)

## Retrospective

### What Worked
- **SYMBEX JIT is the right approach for symbolic math** -- AST-based translation from Python expressions to CUDA C kernels lets users write familiar syntax while getting GPU acceleration. The kernel cache prevents recompilation overhead.
- **NVRTC runtime compilation** -- No ahead-of-time CUDA compilation needed. Kernels are compiled at first use and cached, making the system self-contained.
- **Research-to-chipset pipeline** -- The Unison research directly informed the translation chipset. Research modules mapped cleanly to chipset skills: language foundations became the translation skill, distributed computing became the deployment skill, etc.
- **6 parallel research agents** -- The Unison study used 6 agents producing modules in parallel, completing 28,693 words of research efficiently.

### What Could Be Better
- **Kernel cache has no eviction policy** -- The SYMBEX kernel cache grows unbounded. A LRU eviction strategy would be appropriate for long-running sessions.
- **Translation chipset is theoretical** -- The Unison translation maps (Haskell/TS/Rust/Erlang equivalences) are reference material, not executable translators. Building actual code translation would require a separate milestone.

## Lessons Learned

1. **GPU library diversity requires per-chip backends.** cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC are five different NVIDIA libraries with different APIs, memory models, and error handling. The 5-chip architecture maps directly to this reality -- each chip wraps exactly one GPU library.
2. **AST-based JIT is better than string manipulation.** The SYMBEX compiler parses Python expressions into an AST, transforms the AST to CUDA C, then compiles via NVRTC. This is more complex than string templates but handles operator precedence, nested expressions, and type inference correctly.
3. **Research-to-chipset is a repeatable pattern.** The Unison study proved the pipeline: deep research → synthesis → verification → chipset derivation. The same pattern produced the PNW ECO silicon.yaml and will produce future domain chipsets.
4. **Muse team expansion follows the v1.50 experimental protocol.** Aspen joins as a creative writing muse on the experimental branch, following the established pattern of adding capabilities through the muse team arc rather than direct integration.
