# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- Implementation files: kebab-case with descriptive names (e.g., `pattern-analyzer.ts`, `agent-generator.ts`)
- Test files: same name as implementation + `.test.ts` suffix (e.g., `agent-generator.test.ts`)
- Index/barrel files: `index.ts` to export public API from directories
- Type definition files: kebab-case in `types/` directory (e.g., `src/types/skill.ts`, `src/types/detection.ts`)

**Functions:**
- camelCase for all function names (e.g., `createCandidate`, `analyzeFromSessions`, `generateSkillName`)
- Private methods: camelCase with `private` keyword (e.g., `private countPatterns`, `private isCommonCommand`)
- Public async functions: clear indication of side effects in name (e.g., `create`, `update`, `record`)

**Variables:**
- camelCase for local variables and parameters (e.g., `tempDir`, `skillStore`, `coActivationScore`)
- UPPER_CASE for constants (e.g., `COMMON_COMMANDS`, `DEFAULT_AGENT_GENERATOR_CONFIG`)
- Single-letter or short names acceptable in loops and temporary contexts (e.g., `i`, `a`, `b` in graph algorithms)

**Types:**
- PascalCase for interfaces (e.g., `SkillMetadata`, `GeneratedAgent`, `PatternAnalyzer`)
- PascalCase for classes (e.g., `AgentGenerator`, `PatternAnalyzer`, `SkillStore`)
- PascalCase for exported enums (e.g., pattern types: `'command'`, `'tool'`, `'workflow'`)
- Suffixes indicate purpose: `Config` for configuration objects, `Store` for storage classes, `Generator` for creators

## Code Style

**Formatting:**
- No explicit formatter configured (project relies on TypeScript compiler strictness)
- 2-space indentation (TypeScript default)
- Line length: no strict limit enforced but code readable
- Semicolons: required (TypeScript strict mode)
- Trailing commas: used in multi-line objects and arrays

**Linting:**
- No ESLint configuration detected
- Relies on TypeScript `strict: true` compiler option in `tsconfig.json`
- Type safety enforced at compile time

## Import Organization

**Order:**
1. Standard library imports (Node.js built-ins): `import * as fs from 'fs'`, `import { readFile } from 'fs/promises'`
2. Third-party packages: `import matter from 'gray-matter'`, `import Anthropic from '@anthropic-ai/sdk'`
3. Relative imports from same project: `import { SkillStore } from '../storage/skill-store.js'`
4. Type-only imports when needed: `import type { SomeType } from './types.js'` (though not common in this codebase)

**Path Aliases:**
- No path aliases detected in `tsconfig.json` (uses relative paths throughout)
- Relative imports use `.js` extension (ESM format) even in TypeScript source: `from './types/skill.js'`

## Error Handling

**Patterns:**
- `try/catch` for async operations and file system calls: see `src/detection/pattern-analyzer.ts` lines 50-70 for streaming with error recovery
- Silent error handling: catch common errors and provide fallback behavior (e.g., line 61-63 skips corrupted JSONL lines)
- Validation errors: throw `Error` with descriptive message combining all validation issues: `throw new Error('Invalid skill metadata: ' + errors.join(', '))`
- File not found: checked specifically by error code `(err as NodeJS.ErrnoException).code !== 'ENOENT'` (line 67)

**Error Propagation:**
- Errors thrown from constructor and synchronous methods propagate immediately
- Async methods throw and caller must handle (e.g., `SkillStore.create` throws on validation failure)
- File operations wrapped in try/catch to provide graceful degradation

## Logging

**Framework:** `console` module (no custom logging framework)

**Patterns:**
- Logging not extensively used in core logic; focus on type safety instead
- Console output via `console.log()`, `console.error()` in CLI contexts (`src/cli.ts`)
- No structured logging or log levels
- Tests and business logic clean (no debug logs)

## Comments

**When to Comment:**
- Block comments above class methods explain purpose and usage constraints (see `PatternAnalyzer` lines 27-34)
- Parameter documentation in JSDoc-style comments for complex signatures
- Algorithm explanation: used when logic is non-obvious (e.g., "Calculate recency-weighted confidence" at line 219)
- No inline comments for self-documenting code

**JSDoc/TSDoc:**
- Used for public class methods with `/** ... */` blocks
- Includes brief description of what method does
- No formal `@param`, `@returns` annotations (rely on TypeScript types for clarity)
- Example from `src/agents/agent-generator.ts` line 35-37:
  ```typescript
  /**
   * Generate agent content from a skill cluster (preview)
   */
  async generateContent(cluster: SkillCluster): Promise<GeneratedAgent>
  ```

## Function Design

**Size:**
- Methods typically 5-40 lines
- Larger methods extract helper functions (e.g., `createCandidate` at 205-243 is a helper for `extractCandidates`)
- Streaming operations use callbacks to avoid loading full data into memory

**Parameters:**
- Named parameters preferred over positional: `config?: Partial<ConfigType>` for optional settings
- Destructuring in parameters for object-heavy functions (e.g., `{ name, description, skills, skillDescriptions }` in line 104)
- Type annotations required for all parameters (TypeScript strict mode)

**Return Values:**
- Explicit return types always specified: `async generateContent(cluster: SkillCluster): Promise<GeneratedAgent>`
- Constructors implicitly return instance
- Methods returning `void` for side-effect-only operations (e.g., `async delete()`)
- Helper methods marked `private` to hide internal implementation

## Module Design

**Exports:**
- Class exports: public classes exported from module root (e.g., `export class AgentGenerator`)
- Named exports preferred: `export { AgentGenerator, GeneratedAgent }`
- Type exports alongside implementation: interfaces and types exported with classes
- Constants exported when part of public API: `export const DEFAULT_AGENT_GENERATOR_CONFIG`

**Barrel Files:**
- Index files re-export from subdirectories (e.g., `src/agents/index.ts`, `src/types/index.ts`)
- Not all directories use barrel files (selective, not comprehensive)
- Enables cleaner imports: `import { AgentGenerator } from '../agents'` instead of full path

**Example barrel from `src/agents/index.ts` pattern:**
```typescript
export { AgentGenerator } from './agent-generator.js';
export type { GeneratedAgent } from './agent-generator.js';
```

---

*Convention analysis: 2026-01-30*
