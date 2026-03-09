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

## Retrospective

### What Worked
- **Git workflow intelligence as a progressive disclosure skill.** Branch naming conventions, merge strategies, and conflict resolution patterns are surfaced at the right depth depending on context. This isn't a git tutorial -- it's a skill that understands repository context and adapts.
- **Git observation feeding pattern detection.** The observation bridge from git operations to skill-creator's pattern detection system means the tool learns from actual repository usage, not just from configured rules.

### What Could Be Better
- **272 tests across 51 files is a thin ratio for a module that parses git state.** Git repositories have enormous state diversity (detached HEAD, merge conflicts, rebases in progress, submodules, worktrees). The edge case surface is large.
- **Coverage reporting was added (@vitest/coverage-v8) but no coverage numbers are reported.** Adding the tool without reporting the baseline means coverage can't be tracked over time.

## Lessons Learned

1. **Git workflow skills need repository context, not just command knowledge.** A skill that knows "git rebase" is less useful than one that knows "this repository uses merge commits on main and rebases on feature branches." The git module types with Zod validation capture this context structurally.
2. **Adding coverage tooling is a foundation investment.** @vitest/coverage-v8 may not have produced reportable numbers in this release, but it enables coverage-gated quality checks in future releases. The payoff is downstream.
