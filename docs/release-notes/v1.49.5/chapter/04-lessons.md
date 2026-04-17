# Lessons — v1.49.5

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Audit-then-move with a machine-readable manifest is the safe way to reorganize a repository.**
   The `moves.json` approach from Phase 460 should be the template for any future large-scale file reorganization.
   _⚙ Status: `investigate` · lesson #282_

2. **FHS 3.0 + XDG compliance earns ecosystem integration for free.**
   Standard paths mean standard tooling (package managers, desktop environments, systemd) works without custom integration.
   _🤖 Status: `investigate` · lesson #283 · needs review_
   > LLM reasoning: Muse/MCP integration in v1.49.16 is unrelated to FHS/XDG ecosystem payoff; no direct evidence.

3. **Stale path sweeps after reorganization are non-negotiable.**
   A grep audit confirming zero remaining hardcoded old paths is the only way to trust that a large move is complete.
   _⚙ Status: `investigate` · lesson #284_

4. **scdoc over groff is the right choice for modern Linux projects.**
   Readable source, used by the Sway/wlroots ecosystem, and produces correct man pages without groff macros.
   _⚙ Status: `investigate` · lesson #285_

5. **Root directories went from 33 to 26 -- still high.**
   The consolidation removed 7 directories but 26 root-level entries is still a lot for a new contributor to parse. The `data/` consolidation (schemas, chipset, citations) was the right pattern -- more could follow.
   _🤖 Status: `investigate` · lesson #286 · needs review_
   > LLM reasoning: Candidate is about AWF Living Systems/landing page, not directly about reducing root directory count.

6. **Debian and RPM packaging infrastructure is speculative.**
   The packaging files are correct but untested in actual build environments (no CI for `.deb` or `.rpm` builds). They could drift from reality silently.
   _🤖 Status: `investigate` · lesson #287 · needs review_
   > LLM reasoning: Blue Infrastructure snippet doesn't clearly address .deb/.rpm CI testing.
