# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.8.1] - 2026-02-12

### Fixed - Critical (3)

- **Test Infrastructure:** Fixed mock constructors for TestStore, TestRunner, ResultStore (27/27 tests pass)
- **Team Validator Mocks:** Fixed ConflictDetector mock to work with constructor pattern (47/47 tests pass)
- **Semantic Test Timeout:** Resolved timeout in IntentClassifier tests (34/34 tests pass, 101ms execution)

### Fixed - High Priority (4)

- **Type Safety:** Replaced `any` types in 20+ files with proper TypeScript interfaces (strict mode)
- **CLI Validation:** Added bounds checking for numeric args and path validation
- **Promise Handling:** Wrapped all async operations with proper error handling
- **Dependency Validation:** Added DependencyChecker module with clear error messages

### Fixed - Medium Priority (4)

- **File Path Security:** Hardened with path.resolve() and boundary validation
- **Hard-coded Paths:** Extracted to configurable constants
- **Main() Function:** Refactored from 1500+ lines to ~200 lines
- **Cache Invalidation:** Implemented content-based and TTL-based invalidation

### Verification

- ✅ 5,346 tests passing
- ✅ Strict TypeScript mode (0 errors)
- ✅ 0 npm vulnerabilities
- ✅ All 11 audit findings resolved

---

## [1.8.0] - 2026-02-11

### Added

- Capability-Aware Planning with pluggable skill pipeline
- Token Efficiency with per-agent budgets
- Capability Manifests and skill injection
- Cache-aware skill ordering
- Research compression (10-20x reduction)
- Parallelization advisor

---

## [1.7.0] - 2026-01-15

### Added

- GSD Master Orchestration Agent
- Skill Workflows and Roles
- Work Bundles and Inter-Skill Events
- Session Continuity

---

## [1.6.0] - 2025-11-20

- 34 cross-domain examples
- Local installation support
- Beautiful commits skill

---

## [1.5.0] - 2025-09-15

- Pattern Discovery
- DBSCAN Clustering
- Draft Generation

---

## [1.4.0] - 2025-07-10

- Agent Teams with multiple topologies
- Team schemas and validation

---

## [1.3.0] - 2025-05-05

- Documentation overhaul
- Official format specification

---

## [1.2.0] - 2025-03-01

- Test infrastructure
- Activation simulation
- Benchmarking

---

## [1.1.0] - 2025-01-15

- Semantic conflict detection
- Activation scoring
- Local embeddings

---

## [1.0.0] - 2024-11-01

- Core skill management
- Pattern observation
- Agent composition
- Quality validation
