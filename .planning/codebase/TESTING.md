# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Runner:**
- Vitest 1.0.0 - configured in `package.json` as test script
- Config: No explicit `vitest.config.ts` file detected; uses TypeScript defaults
- ESM native (project uses `"type": "module"`)

**Assertion Library:**
- Vitest built-in assertion API via `expect()`

**Run Commands:**
```bash
npm test                 # Run all tests (vitest default single-run mode)
npm test -- --watch     # Watch mode (inferred, follows standard vitest usage)
npm test -- --coverage  # Coverage reporting (inferred capability)
```

## Test File Organization

**Location:**
- **Co-located pattern**: Test files live alongside implementation in same directory
- Example: `src/agents/agent-generator.ts` paired with `src/agents/agent-generator.test.ts`

**Naming:**
- Pattern: `{module}.test.ts` (not `.spec.ts`)
- Examples: `pattern-analyzer.test.ts`, `agent-generator.test.ts`, `feedback-store.test.ts`

**Structure:**
```
src/
├── agents/
│   ├── agent-generator.ts
│   ├── agent-generator.test.ts
│   ├── cluster-detector.ts
│   ├── cluster-detector.test.ts
│   └── ...
├── detection/
│   ├── pattern-analyzer.ts
│   ├── pattern-analyzer.test.ts
│   └── ...
└── storage/
    ├── skill-store.ts
    └── (no test file for skill-store detected)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MyClass } from './my-module.js';

describe('MyClass', () => {
  // Setup
  let instance: MyClass;
  let tempDir: string;

  beforeEach(async () => {
    // Create test fixtures
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
    instance = new MyClass(tempDir);
  });

  afterEach(async () => {
    // Clean up resources
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('featureName', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = await instance.method(input);

      // Assert
      expect(result).toContain('expected');
    });
  });
});
```

**Patterns:**
- **Setup**: `beforeEach` creates temp directories for file system tests, initializes stores/instances
- **Teardown**: `afterEach` aggressively cleans: `rm(tempDir, { recursive: true, force: true })`
- **Assertion**: `expect()` API with matchers like `.toBe()`, `.toContain()`, `.toBeDefined()`, `.toHaveLength()`
- **Nesting**: Nested `describe()` blocks organize tests by feature (see `agent-generator.test.ts` lines 54-209)

## Mocking

**Framework:** No explicit mocking library detected (no `jest.mock()`, `vitest.mock()`, or `sinon`)

**Patterns:**
- **Test doubles**: Create minimal real objects instead of mocks
  - Example from `agent-generator.test.ts` lines 17-26: Helper function `createCluster()` builds test data manually
  - Example from `pattern-analyzer.test.ts` lines 20-42: `createSession()` helper constructs `SessionObservation` objects
- **Real file system**: Use actual temp directories for I/O tests instead of mocking
  - `fs.mkdtempSync(path.join(os.tmpdir(), 'agent-generator-test-'))` creates real test directory
  - Allows testing real error conditions and file operations

**What to Mock:**
- Not applicable to this codebase - prefers real implementations for I/O

**What NOT to Mock:**
- File system operations - tests use real `fs/promises` and temp directories
- Date/timestamps in session objects - use actual `Date.now()`
- Network calls - not tested (no integration tests with external APIs visible)

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function pattern (from pattern-analyzer.test.ts lines 20-42)
function createSession(overrides: Partial<SessionObservation>): SessionObservation {
  return {
    sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    startTime: Date.now() - 60000,
    endTime: Date.now(),
    durationMinutes: 1,
    source: 'startup',
    reason: 'logout',
    metrics: {
      userMessages: 1,
      assistantMessages: 1,
      toolCalls: 1,
      uniqueFilesRead: 1,
      uniqueFilesWritten: 0,
      uniqueCommandsRun: 1,
    },
    topCommands: [],
    topFiles: [],
    topTools: [],
    activeSkills: [],
    ...overrides,  // Allow test-specific customization
  };
}

// Usage in test
const sessions = [
  createSession({ topCommands: ['prisma', 'migrate'] }),
  createSession({ topCommands: ['prisma', 'generate'] }),
];
```

**Location:**
- Defined inside each test file at module level (lines 17-26 in `agent-generator.test.ts`)
- Not extracted to shared fixtures directory
- Per-test customization via spread operator and `Partial<T>` typing

## Coverage

**Requirements:** No coverage targets enforced (no config file visible)

**View Coverage:**
```bash
npm test -- --coverage  # Standard vitest coverage command (inferred)
```

## Test Types

**Unit Tests:**
- **Scope**: Individual class/function behavior (e.g., `PatternAnalyzer.analyzeFromSessions()`)
- **Approach**:
  - Create test data with factories
  - Call method with various inputs
  - Assert output meets expectations
  - Example: `pattern-analyzer.test.ts` lines 44-95 test analyzer behavior with different threshold settings

**Integration Tests:**
- **Scope**: Multi-class workflows (e.g., `AgentGenerator` using `SkillStore`)
- **Approach**:
  - Set up real dependencies in `beforeEach`
  - Execute workflows that span multiple modules
  - Verify final state on disk
  - Example: `agent-generator.test.ts` lines 121-132 test `create()` which calls `SkillStore` and writes files

**E2E Tests:**
- Not detected in this codebase
- No end-to-end test framework configured

## Common Patterns

**Async Testing:**
```typescript
// Test async functions directly - vitest auto-waits for Promise
it('should stream and analyze sessions from JSONL file', async () => {
  const analyzer = new PatternAnalyzer({ threshold: 2 });

  const sessions = [
    createSession({ topCommands: ['make'] }),
    createSession({ topCommands: ['make'] }),
  ];

  const lines = sessions.map(s => JSON.stringify({
    timestamp: Date.now(),
    category: 'sessions',
    data: s,
  }));
  await writeFile(sessionsFile, lines.join('\n') + '\n');

  const candidates = await analyzer.analyze(sessionsFile);  // Async call

  expect(candidates.find(c => c.pattern === 'make')).toBeDefined();
});
```

**Error Testing:**
```typescript
// Testing error conditions with rejects.toThrow()
it('throws error if agent already exists', async () => {
  const agentsDir = path.join(tempDir, 'agents');
  fs.mkdirSync(agentsDir, { recursive: true });
  fs.writeFileSync(path.join(agentsDir, 'test-agent.md'), 'existing');

  const generator = new AgentGenerator(skillStore, { agentsDir });
  const cluster = createCluster({ suggestedName: 'test-agent' });

  await expect(generator.create(cluster)).rejects.toThrow(
    "Agent 'test-agent' already exists"
  );
});
```

**File System Testing:**
```typescript
// Common pattern: verify files written correctly
it('writes agent file to disk', async () => {
  const agentsDir = path.join(tempDir, 'agents');
  const generator = new AgentGenerator(skillStore, { agentsDir });
  const cluster = createCluster();

  const result = await generator.create(cluster);

  expect(fs.existsSync(result.filePath)).toBe(true);
  const content = fs.readFileSync(result.filePath, 'utf8');
  expect(content).toContain('name: test-agent');
});
```

**Boundary/Edge Cases:**
```typescript
// Tests explicitly cover edge cases (long names, missing items, etc.)
it('truncates long names', async () => {
  const agentsDir = path.join(tempDir, 'agents');
  const generator = new AgentGenerator(skillStore, { agentsDir });
  const longName = 'a'.repeat(100);
  const cluster = createCluster({ suggestedName: longName });

  const result = await generator.generateContent(cluster);

  expect(result.name.length).toBeLessThanOrEqual(64);
});

it('handles missing skill descriptions gracefully', async () => {
  const agentsDir = path.join(tempDir, 'agents');
  const generator = new AgentGenerator(skillStore, { agentsDir });
  const cluster = createCluster({ skills: ['skill-a', 'nonexistent-skill'] });

  const result = await generator.generateContent(cluster);

  expect(result.content).toContain('(description not available)');
});
```

---

*Testing analysis: 2026-01-30*
