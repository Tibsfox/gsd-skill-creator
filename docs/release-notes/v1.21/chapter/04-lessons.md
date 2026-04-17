# Lessons — v1.21

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Bidirectional IPC needs three patterns, not one.**
   Commands (webview to Rust), events (Rust to webview), and channels (streaming) each serve a different communication need. Trying to unify them into a single pattern would add complexity, not reduce it.
   _🤖 Status: `investigate` · lesson #107 · needs review_
   > LLM reasoning: The v1.42 snippet is about git workflow skills and has no connection to IPC patterns.

2. **Watermark-based flow control for PTY is essential.**
   Pause at high-water, resume at low-water prevents the terminal from overwhelming the webview renderer. This is the same pattern used in TCP flow control -- proven at scale.
   _🤖 Status: `investigate` · lesson #108 · needs review_
   > LLM reasoning: The v1.42 snippet covers git tooling, not PTY flow control or watermarking.

3. **Boot sequences should be skippable.**
   The Amiga chipset boot animation is delightful the first time and annoying the tenth. Click-or-keypress skip respects the user's time without removing the experience entirely.
   _🤖 Status: `investigate` · lesson #109 · needs review_
   > LLM reasoning: The v1.39 snippet mentions GSD-OS Bootstrap & READY Prompt but gives no evidence of a skip affordance.

4. **Copper list raster effects are the kind of detail that defines a project's personality.**
   Per-scanline color manipulation for gradient fills is technically unnecessary but emotionally essential for the Amiga tribute.
---
   _🤖 Status: `investigate` · lesson #110 · needs review_
   > LLM reasoning: The v1.23 snippet only names 'Project AMIGA' without detail confirming copper-list raster effects were implemented.

5. **11 phases is the largest single release so far.**
   The scope spans Tauri shell, WebGL engine, palette system, PTY terminal, desktop environment, and boot calibration. Any one of these could be its own release. The coupling risk is that bugs in the PTY layer affect the boot sequence timeline.
   _🤖 Status: `investigate` · lesson #111 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack is unrelated to managing release scope/coupling risk across many phases.

6. **OKLCH palette generation is sophisticated but hard to validate.**
   Perceptually uniform color interpolation is the right choice, but verifying that the 5 presets (Amiga Kickstart 1.3, Workbench 2.0/3.1, C64, custom) actually look correct requires visual inspection, not unit tests.
   _🤖 Status: `investigate` · lesson #112 · needs review_
   > LLM reasoning: v1.24 GSD Conformance Audit doesn't address visual validation of OKLCH palette presets.
