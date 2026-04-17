# Lessons — v1.49.1

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Field naming inconsistencies between CLI and core types are a common bug class in TypeScript projects.**
   Zod schemas shared between the CLI layer and the domain layer catch these at compile time. When they drift, the fix is always "align to the canonical schema" plus a backward-compat shim.
   _🤖 Status: `applied` (applied in `v1.49.2`) · lesson #266 · needs review_
   > LLM reasoning: v1.49.2 TypeScript fixes patch directly addresses field-naming/type drift between CLI and core.

2. **Patch releases with full regression verification (19,110 tests, 0 failures) set the quality floor.**
   Even a single-field bugfix runs the complete test suite. This discipline prevents "it's just a small change" from introducing regressions.
   _🤖 Status: `applied` (applied in `v1.49.2`) · lesson #267 · needs review_
   > LLM reasoning: v1.49.2 is itself another patch release continuing the full-regression discipline established in v1.49.1.

3. **Mixed field names (`type` vs `handoff_type`) shipped in the first place.**
   This patch exists because the original DACP CLI implementation used inconsistent field naming. Stricter type checking or a shared schema between CLI and core types would have prevented the inconsistency.
   _🤖 Status: `investigate` · lesson #268 · needs review_
   > LLM reasoning: Candidate mentions TypeScript fixes generically but no direct evidence of shared schema for DACP field naming.
