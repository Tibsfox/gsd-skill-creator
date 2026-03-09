# Test Categories

Defines 4 test categories for use in milestone specifications and verification.

## Unit Tests

- Pure function tests with mocked boundaries
- Target: <100ms per test
- Location: `*.test.ts` co-located with source
- Tools: Vitest
- Coverage: Logic branches, edge cases, error paths

## Integration Tests

- Cross-module tests using real filesystem, IPC channels, or subprocess execution
- Target: <5s per test
- Location: `*.integration.test.ts` or integration test directories
- Tools: Vitest with real dependencies
- Coverage: Module boundaries, data flow, error propagation

## Visual Tests

- Browser rendering, layout verification
- Target: Manual or screenshot comparison
- Location: Per-project verification checklists
- Coverage: PNW browsers, dashboard pages, desktop app

## Platform Tests

- OS-specific behavior verification
- Target: Per-platform (macOS, Linux, Windows)
- Location: `docs/testing/` checklists
- Coverage: Bash 3.2 compat, POSIX compliance, file paths, permissions

## Minimum Distribution Guidance

For new milestones with >500 LOC:

- Unit: Required (minimum 2.5% test density floor)
- Integration: Required for cross-module features
- Visual: Required for UI changes
- Platform: Required when touching shell scripts or OS-specific code
