# Lessons — v1.49.7

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Every external tool dependency should have a fallback path.**
   tmux, like any CLI tool, may not be installed. The raw PTY fallback pattern is reusable for any optional external dependency.
   _🤖 Status: `investigate` · lesson #293 · needs review_
   > LLM reasoning: Progressive Internalization Engine touches dependencies broadly but doesn't specifically address external CLI fallback patterns.

2. **Dependency graphs must be identical across language boundaries.**
   When Rust and TypeScript both model the same service dependency graph, divergences are silent bugs that corrupt orchestration logic.
   _🤖 Status: `investigate` · lesson #294 · needs review_
   > LLM reasoning: Candidate mentions dependency health monitoring but snippet too vague to confirm it enforces Rust/TS graph parity.

3. **This should have been part of v1.49.6 (macOS compatibility).**
   The tmux-optional work is a natural companion to the Bash 3.2 fixes -- both are about making the system work on environments that don't have Linux-centric tooling.
   _⚙ Status: `investigate` · lesson #295_
