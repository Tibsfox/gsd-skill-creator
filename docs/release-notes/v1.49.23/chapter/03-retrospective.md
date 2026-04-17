# Retrospective — v1.49.23

## What Worked

- **SYMBEX JIT is the right approach for symbolic math** -- AST-based translation from Python expressions to CUDA C kernels lets users write familiar syntax while getting GPU acceleration. The kernel cache prevents recompilation overhead.
- **NVRTC runtime compilation** -- No ahead-of-time CUDA compilation needed. Kernels are compiled at first use and cached, making the system self-contained.
- **Research-to-chipset pipeline** -- The Unison research directly informed the translation chipset. Research modules mapped cleanly to chipset skills: language foundations became the translation skill, distributed computing became the deployment skill, etc.
- **6 parallel research agents** -- The Unison study used 6 agents producing modules in parallel, completing 28,693 words of research efficiently.

## What Could Be Better

- **Kernel cache has no eviction policy** -- The SYMBEX kernel cache grows unbounded. A LRU eviction strategy would be appropriate for long-running sessions.
- **Translation chipset is theoretical** -- The Unison translation maps (Haskell/TS/Rust/Erlang equivalences) are reference material, not executable translators. Building actual code translation would require a separate milestone.

## Lessons Learned

1. **GPU library diversity requires per-chip backends.** cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC are five different NVIDIA libraries with different APIs, memory models, and error handling. The 5-chip architecture maps directly to this reality -- each chip wraps exactly one GPU library.
2. **AST-based JIT is better than string manipulation.** The SYMBEX compiler parses Python expressions into an AST, transforms the AST to CUDA C, then compiles via NVRTC. This is more complex than string templates but handles operator precedence, nested expressions, and type inference correctly.
3. **Research-to-chipset is a repeatable pattern.** The Unison study proved the pipeline: deep research → synthesis → verification → chipset derivation. The same pattern produced the PNW ECO silicon.yaml and will produce future domain chipsets.
4. **Muse team expansion follows the v1.50 experimental protocol.** Aspen joins as a creative writing muse on the experimental branch, following the established pattern of adding capabilities through the muse team arc rather than direct integration.
