# v1.42 — SC Git Support

**Shipped:** 2026-02-26 | **Phases:** 4 (394-397) | **Plans:** 8 | **Commits:** 17 | **Tests:** 272

## Overview

Added git workflow intelligence to skill-creator, enabling skills that understand repository context — branch patterns, commit conventions, merge strategies, and git-based observation for pattern detection.

## Key Features

- **Git Workflow Skill**: Progressive disclosure skill for git operations with branch naming conventions, merge strategies, and conflict resolution patterns
- **CLI Command Registration**: Registered git workflow commands in skill-creator's CLI interface
- **Git Module Types**: Shared TypeScript types for git operations with Zod validation
- **Coverage Reporting**: Added @vitest/coverage-v8 for test coverage analysis
- **Safety-Critical Tests**: Integration and safety tests for git module operations

## Wave Execution

| Wave | Phases | Description |
|------|--------|-------------|
| 0 | 394 | Foundation types and git module interfaces |
| 1 | 395 | Git observation and pattern detection |
| 2 | 396 | Workflow skill generation from git patterns |
| 3 | 397 | CLI integration and safety tests |

## Stats

51 files changed, 10,117 insertions, 272 tests
