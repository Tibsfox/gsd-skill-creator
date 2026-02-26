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

---
