# Retrospective — v1.8.1

## What Worked

- **Adversarial audit found 11 real issues across 6 categories.** The audit wasn't a formality -- it caught test mock failures, `any` types, missing CLI validation, path traversal vulnerabilities, and a 1500+ line monolithic `main()`. Every finding was actionable.
- **Refactoring `main()` into 14+ separate command files is the highest-leverage fix.** A 1500-line function is untestable and unmaintainable. Splitting it also sets the pattern for how new commands should be added.
- **5,346 tests passing with 0 failures, strict TypeScript, and 0 npm audit vulnerabilities is a clean baseline.** After 8 versions of feature development, the codebase is now verified clean across all three dimensions (tests, types, dependencies).

## What Could Be Better

- **20+ failing tests from mock constructor issues suggests the original test strategy was fragile.** Factory function mocks that don't match constructor signatures are a design smell -- the mocks and the real code drifted apart without detection.
- **37 hard-coded path references accumulated across v1.0-v1.8 before being extracted.** Each version added paths without centralizing them. A `paths.ts` module should have existed from v1.0.

## Lessons Learned

1. **Adversarial audits should happen at natural pause points.** v1.8.1 follows the v1.8 pipeline release -- a good boundary to stop adding features and stress-test what exists.
2. **Embedding cache with content-based invalidation and TTL cleanup solves the v1.1 cold-start problem.** The HuggingFace model loading that made tests slow (5-second timeout) is now cached, eliminating the performance penalty while keeping the semantic capability.
3. **Path traversal prevention must be wired into every store.** SkillStore, AgentGenerator, TeamStore all needed `assertSafePath` -- one missed store is one vulnerability.

---
