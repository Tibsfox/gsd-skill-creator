# Lessons — v1.41

4 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **A monolithic CLAUDE.md that grows past ~50 lines stops being read.**
   The 417-line version was functionally ignored. The 46-line replacement works because Claude Code actually reads it every session. The threshold between "useful context" and "ignored wall of text" is real and lower than expected.
   _🤖 Status: `investigate` · lesson #219 · needs review_
   > LLM reasoning: Gource visualization pack is unrelated to CLAUDE.md size discipline.

2. **Skills, hooks, and subagents are three distinct enforcement mechanisms.**
   Skills activate contextually (session awareness, security hygiene). Hooks fire deterministically on tool use (commit validation, phase transitions). Subagents operate with scoped permissions (executor, verifier, planner). Mapping each concern to the right mechanism is the architecture decision.
   _🤖 Status: `investigate` · lesson #220 · needs review_
   > LLM reasoning: Heritage Skills Educational Pack snippet doesn't demonstrate mapping concerns to skills/hooks/subagents mechanisms.

3. **install.cjs as a deployment mechanism for skills/hooks/agents makes the configuration reproducible.**
   Without it, the .claude/ directory would drift between machines. The install script is the source of truth for what Claude Code loads.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #221_

4. **No test count reported.**
   This is the only release in the v1.33-v1.41 range without a test count. Skills, hooks, and agent definitions should have validation tests, even if they're structural rather than functional.
   _🤖 Status: `applied` (applied in `v1.42`) · lesson #222 · needs review_
   > LLM reasoning: v1.42 adds @vitest/coverage-v8, establishing test count/coverage reporting going forward.
