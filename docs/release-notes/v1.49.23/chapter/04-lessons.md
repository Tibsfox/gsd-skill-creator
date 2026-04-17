# Lessons — v1.49.23

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **GPU library diversity requires per-chip backends.**
   cuBLAS, cuSOLVER, cuFFT, cuRAND, and NVRTC are five different NVIDIA libraries with different APIs, memory models, and error handling. The 5-chip architecture maps directly to this reality -- each chip wraps exactly one GPU library.
   _⚙ Status: `investigate` · lesson #368_

2. **AST-based JIT is better than string manipulation.**
   The SYMBEX compiler parses Python expressions into an AST, transforms the AST to CUDA C, then compiles via NVRTC. This is more complex than string templates but handles operator precedence, nested expressions, and type inference correctly.
   _⚙ Status: `investigate` · lesson #369_

3. **Research-to-chipset is a repeatable pattern.**
   The Unison study proved the pipeline: deep research → synthesis → verification → chipset derivation. The same pattern produced the PNW ECO silicon.yaml and will produce future domain chipsets.
   _⚙ Status: `investigate` · lesson #370_

4. **Muse team expansion follows the v1.50 experimental protocol.**
   Aspen joins as a creative writing muse on the experimental branch, following the established pattern of adding capabilities through the muse team arc rather than direct integration.
   _🤖 Status: `investigate` · lesson #371 · needs review_
   > LLM reasoning: Chorus Protocol snippet doesn't clearly show muse team expansion following the v1.50 protocol.

5. **Kernel cache has no eviction policy**
   The SYMBEX kernel cache grows unbounded. A LRU eviction strategy would be appropriate for long-running sessions.
   _⚙ Status: `investigate` · lesson #372_

6. **Translation chipset is theoretical**
   The Unison translation maps (Haskell/TS/Rust/Erlang equivalences) are reference material, not executable translators. Building actual code translation would require a separate milestone.
   _⚙ Status: `investigate` · lesson #373_
