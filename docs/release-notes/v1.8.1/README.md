# v1.8.1 — Audit Remediation (Patch)

**Shipped:** 2026-02-11

Comprehensive bugfix release addressing all findings from a full adversarial code audit. 11 issues spanning test infrastructure, type safety, CLI validation, error handling, security, and code quality.

### Critical Fixes

- **Test Mock Constructors:** Fixed 20+ failing tests by replacing factory function mocks with proper constructor implementations
- **Team Validator Mock:** Fixed ConflictDetector mock implementation (47/47 tests passing)
- **IntentClassifier Timeout:** Added embeddings mock to prevent 5-second model loading during tests

### High Priority Fixes

- Replaced all `any` types with proper interfaces across 20+ files
- Added CLI argument bounds checking, path validation, and clear error messages
- Wrapped dynamic imports and async handlers with proper error handling
- Created DependencyChecker module for startup validation with clear diagnostics

### Medium Priority Fixes

- Path traversal vulnerability remediation with boundary validation
- Extracted 37 hard-coded path references to configurable constants
- Refactored 1500+ line monolithic `main()` into 14+ separate command files
- Implemented embedding cache with content-based invalidation and TTL cleanup

### Verification

- 5,346 tests passing, 0 failures
- Strict TypeScript mode with 0 errors
- npm audit: 0 vulnerabilities

## Retrospective

### What Worked
- **Adversarial audit found 11 real issues across 6 categories.** The audit wasn't a formality -- it caught test mock failures, `any` types, missing CLI validation, path traversal vulnerabilities, and a 1500+ line monolithic `main()`. Every finding was actionable.
- **Refactoring `main()` into 14+ separate command files is the highest-leverage fix.** A 1500-line function is untestable and unmaintainable. Splitting it also sets the pattern for how new commands should be added.
- **5,346 tests passing with 0 failures, strict TypeScript, and 0 npm audit vulnerabilities is a clean baseline.** After 8 versions of feature development, the codebase is now verified clean across all three dimensions (tests, types, dependencies).

### What Could Be Better
- **20+ failing tests from mock constructor issues suggests the original test strategy was fragile.** Factory function mocks that don't match constructor signatures are a design smell -- the mocks and the real code drifted apart without detection.
- **37 hard-coded path references accumulated across v1.0-v1.8 before being extracted.** Each version added paths without centralizing them. A `paths.ts` module should have existed from v1.0.

## Lessons Learned

1. **Adversarial audits should happen at natural pause points.** v1.8.1 follows the v1.8 pipeline release -- a good boundary to stop adding features and stress-test what exists.
2. **Embedding cache with content-based invalidation and TTL cleanup solves the v1.1 cold-start problem.** The HuggingFace model loading that made tests slow (5-second timeout) is now cached, eliminating the performance penalty while keeping the semantic capability.
3. **Path traversal prevention must be wired into every store.** SkillStore, AgentGenerator, TeamStore all needed `assertSafePath` -- one missed store is one vulnerability.

---
