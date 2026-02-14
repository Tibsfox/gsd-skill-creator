---
name: test-generator
description: Generates test cases for functions and components. Use when writing tests or creating test suites.
---

# Test Generation

## Structure (AAA Pattern)

```typescript
it('should [expected] when [condition]', () => {
  // Arrange — set up data
  // Act — perform operation
  // Assert — verify outcome
});
```

## Test Categories

| Category | Test For |
|----------|----------|
| Happy path | Valid input → expected output |
| Edge cases | Empty, null, boundary values |
| Error cases | Invalid input, failures |
| Side effects | State changes, calls made |
| Async | Resolve/reject paths |

## Naming

Pattern: `should [behavior] when [condition]`

## Organization

- Group with `describe` by function/method
- Reset state in `beforeEach`
- One concept per test

## Anti-Patterns

| Don't | Do |
|-------|------|
| Test implementation | Test behavior |
| Share mutable state | Reset in beforeEach |
| Many assertions per test | One concept per test |
| Test private methods | Test through public API |
| Snapshot overuse | Assert specific values |
