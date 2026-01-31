# Codebase Structure

**Analysis Date:** 2026-01-30

## Directory Layout

```
gsd-skill-creator/
├── src/
│   ├── agents/                    # Skill composition and agent suggestions
│   │   ├── agent-generator.ts
│   │   ├── agent-generator.test.ts
│   │   ├── agent-suggestion-manager.ts
│   │   ├── cluster-detector.ts
│   │   ├── cluster-detector.test.ts
│   │   ├── co-activation-tracker.ts
│   │   ├── co-activation-tracker.test.ts
│   │   └── index.ts
│   ├── application/               # Skill loading and session management
│   │   ├── conflict-resolver.ts
│   │   ├── relevance-scorer.ts
│   │   ├── skill-applicator.ts
│   │   ├── skill-session.ts
│   │   └── token-counter.ts
│   ├── composition/               # Dependency resolution
│   │   ├── dependency-graph.ts
│   │   ├── dependency-graph.test.ts
│   │   ├── skill-resolver.ts
│   │   ├── skill-resolver.test.ts
│   │   └── index.ts
│   ├── detection/                 # Pattern detection and suggestions
│   │   ├── index.ts
│   │   ├── pattern-analyzer.ts
│   │   ├── pattern-analyzer.test.ts
│   │   ├── skill-generator.ts
│   │   ├── suggestion-manager.ts
│   │   ├── suggestion-store.ts
│   │   └── suggestion-store.test.ts
│   ├── learning/                  # Feedback and refinement
│   │   ├── feedback-detector.ts
│   │   ├── feedback-detector.test.ts
│   │   ├── feedback-store.ts
│   │   ├── feedback-store.test.ts
│   │   ├── index.ts
│   │   ├── refinement-engine.ts
│   │   ├── refinement-engine.test.ts
│   │   ├── version-manager.ts
│   │   └── version-manager.test.ts
│   ├── observation/               # Session tracking and pattern summary
│   │   ├── index.ts
│   │   ├── pattern-summarizer.ts
│   │   ├── pattern-summarizer.test.ts
│   │   ├── retention-manager.ts
│   │   ├── retention-manager.test.ts
│   │   ├── session-observer.ts
│   │   ├── session-observer.test.ts
│   │   ├── transcript-parser.ts
│   │   └── transcript-parser.test.ts
│   ├── storage/                   # Persistence layer
│   │   ├── pattern-store.ts
│   │   ├── skill-index.ts
│   │   └── skill-store.ts
│   ├── types/                     # Shared type definitions
│   │   ├── application.ts
│   │   ├── detection.ts
│   │   ├── learning.ts
│   │   ├── observation.ts
│   │   ├── pattern.ts
│   │   └── skill.ts
│   ├── validation/                # Input validation schemas
│   │   └── skill-validation.ts
│   ├── workflows/                 # Multi-step user workflows
│   │   ├── create-skill-workflow.ts
│   │   ├── list-skills-workflow.ts
│   │   └── search-skills-workflow.ts
│   ├── cli.ts                     # CLI entry point and command routing
│   └── index.ts                   # Module exports and factories
├── dist/                          # Compiled JavaScript (build output)
├── .planning/codebase/            # Architecture documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Directory Purposes

**`src/agents/`:**
- Purpose: Detect skill co-activations and generate composite agents
- Contains: Trackers, detectors, generators, suggestion managers
- Key files: `agent-generator.ts` (create agents), `cluster-detector.ts` (find stable skill groups)

**`src/application/`:**
- Purpose: Execute skill loading with token budgeting and conflict resolution
- Contains: Session state management, token counting, relevance scoring, applicator
- Key files: `skill-applicator.ts` (main entry for applying skills), `skill-session.ts` (budget enforcement)

**`src/composition/`:**
- Purpose: Manage skill dependencies and detect conflicts
- Contains: Dependency graph, skill resolver
- Key files: `skill-resolver.ts` (find and resolve dependencies)

**`src/detection/`:**
- Purpose: Analyze session patterns and suggest new skills
- Contains: Pattern analyzer, suggestion manager and store, skill generator
- Key files: `pattern-analyzer.ts` (memory-efficient JSONL streaming), `suggestion-manager.ts` (UI workflow)

**`src/learning/`:**
- Purpose: Capture feedback and refine existing skills
- Contains: Feedback capture/detection, refinement engine, version tracking
- Key files: `refinement-engine.ts` (bounded improvement proposal), `version-manager.ts` (git integration)

**`src/observation/`:**
- Purpose: Track Claude Code sessions and extract patterns
- Contains: Session parsing, pattern summarization, data retention
- Key files: `session-observer.ts` (session start/end tracking), `pattern-summarizer.ts` (convert sessions to patterns)

**`src/storage/`:**
- Purpose: Persist skills and patterns to disk
- Contains: File-based stores with YAML/JSONL formats
- Key files: `skill-store.ts` (read/write skills), `skill-index.ts` (searchable index)

**`src/types/`:**
- Purpose: Centralized type definitions for domain models
- Contains: Interfaces for skills, patterns, detection results, learning data
- No implementation, only types

**`src/validation/`:**
- Purpose: Validate input against domain constraints
- Contains: Zod schemas for skill names, triggers, metadata
- Key file: `skill-validation.ts` (all validation schemas)

**`src/workflows/`:**
- Purpose: Orchestrate multi-step CLI interactions
- Contains: Interactive workflows for creating, listing, searching skills
- Key files: `create-skill-workflow.ts` (guided skill creation)

**`src/`:**
- `cli.ts`: Command routing, interactive prompt handling, output formatting
- `index.ts`: Module entry point with factory functions and type exports

## Key File Locations

**Entry Points:**
- `src/cli.ts`: CLI binary entry point
- `src/index.ts`: Module/library entry point
- `package.json`: `bin.skill-creator` points to `dist/cli.js`

**Configuration & Types:**
- `src/types/skill.ts`: Skill metadata structure, validation functions
- `src/types/detection.ts`: Detection config, candidate structure
- `src/types/application.ts`: ApplicationConfig (token budget, max skills, API key)
- `src/validation/skill-validation.ts`: Zod schemas for input validation

**Core Logic:**
- `src/storage/skill-store.ts`: Read/write skill SKILL.md files
- `src/detection/pattern-analyzer.ts`: Analyze sessions.jsonl for candidates
- `src/application/skill-applicator.ts`: Load skills into session with budget tracking
- `src/learning/refinement-engine.ts`: Generate and apply skill improvements

**Testing:**
- Test files co-located: `src/module/module.test.ts` pattern
- Framework: Vitest
- Key test files: `src/agents/agent-generator.test.ts`, `src/detection/pattern-analyzer.test.ts`, `src/learning/refinement-engine.test.ts`

## Naming Conventions

**Files:**
- Source: `kebab-case.ts` (e.g., `skill-store.ts`, `pattern-analyzer.ts`)
- Tests: `kebab-case.test.ts` (e.g., `agent-generator.test.ts`)
- Index: `index.ts` (exports for modules)

**Directories:**
- All lowercase, plural or functional name
- Examples: `agents/`, `application/`, `storage/`, `detection/`, `learning/`, `observation/`

**Classes/Types:**
- PascalCase for classes: `SkillStore`, `PatternAnalyzer`, `RefinementEngine`
- camelCase for interfaces/types: `SkillMetadata`, `DetectionConfig`, `SessionObservation`
- UPPERCASE_SNAKE_CASE for constants: `DEFAULT_DETECTION_CONFIG`, `DEFAULT_CONFIG`

**Functions:**
- camelCase: `createStores()`, `validateSkillInput()`, `analyzeCorrection()`
- Factory functions prefixed with `create`: `createApplicationContext()`, `createStores()`

**Variables:**
- camelCase: `activeSkills`, `totalTokens`, `feedbackStore`
- Private fields prefixed with `#` or named with underscore: `private analyzer`, `private config`

## Where to Add New Code

**New Feature in Existing Domain:**

1. **Skill creation enhancement**:
   - Logic: Add to `src/workflows/create-skill-workflow.ts` (lines ~80+)
   - Validation: Extend `src/validation/skill-validation.ts`
   - Tests: Create `src/workflows/create-skill-workflow.test.ts`

2. **New detection pattern type**:
   - Type definition: Add interface to `src/types/detection.ts`
   - Analyzer: Extend `src/detection/pattern-analyzer.ts` (the `processSession()` method)
   - Tests: Add to `src/detection/pattern-analyzer.test.ts`

3. **New scoring algorithm**:
   - Implementation: Extend `src/application/relevance-scorer.ts` or create `src/application/new-scorer.ts`
   - Usage: Update `src/application/skill-applicator.ts` to use it
   - Tests: Create `src/application/new-scorer.test.ts`

**New Component/Module:**

1. Create directory under `src/{domain}/` (e.g., `src/caching/` for a new caching layer)
2. Main implementation: `src/caching/cache-manager.ts`
3. Tests: `src/caching/cache-manager.test.ts`
4. Exports: `src/caching/index.ts`
5. Integration:
   - Update imports in modules that depend on it
   - Export from `src/index.ts` if external facing
   - Add types to `src/types/` if introducing new domain models

**New Workflow:**

1. Create `src/workflows/new-workflow.ts`
2. Export from `src/index.ts` as `export { newWorkflow }`
3. Add CLI command to `src/cli.ts` (case handler in switch statement)
4. Add help text to `showHelp()` function

**Utilities:**

- Shared helpers: `src/{domain}/helper.ts` or create `src/utils/helper.ts` if cross-domain
- Type-only utilities: Add to existing `src/types/` files

**Test Fixtures:**

- Fixtures per module: `src/{module}/fixtures.ts` (if complex)
- Test data: Define inline in test file using factory functions (see `src/agents/agent-generator.test.ts` for example)

## Special Directories

**`dist/`:**
- Purpose: Compiled JavaScript output
- Generated: Yes (via `npm run build`)
- Committed: No (gitignored)
- Source mapping: TypeScript with declaration files enabled

**`.planning/codebase/`:**
- Purpose: Architecture documentation files
- Generated: No (manually maintained)
- Committed: Yes
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md (if applicable)

**`.planning/patterns/` (runtime):**
- Purpose: Session observations, suggestions, feedback (not in repo)
- Generated: Yes (at runtime by observation module)
- Committed: No (gitignored)
- Files: sessions.jsonl, suggestions.json, feedback.jsonl, agent-suggestions.json

**`.claude/skills/` (runtime):**
- Purpose: Stored skill definitions
- Generated: Yes (created via CLI or programmatically)
- Committed: Yes (skills are git-tracked for versioning)
- Structure: `.claude/skills/{skill-name}/SKILL.md`

**`.claude/agents/` (runtime):**
- Purpose: Generated composite agents
- Generated: Yes (via agents suggest/accept workflow)
- Committed: Yes (agents are git-tracked)
- Structure: `.claude/agents/{agent-name}.md`

## Import Patterns

**Absolute imports not used:**
- All imports are relative paths (e.g., `import { Skill } from '../types/skill.js'`)
- TypeScript configured with ES modules (`"type": "module"`)

**Standard patterns:**

```typescript
// Type imports (no runtime)
import type { Skill, SkillMetadata } from '../types/skill.js';

// Implementation imports
import { SkillStore } from '../storage/skill-store.js';
import { PatternAnalyzer } from './pattern-analyzer.js';

// Star imports for barrel files
export * from './feedback-store.js';
export * from './refinement-engine.js';
```

**Module organization:**
- Each domain has an `index.ts` that exports public API (types + classes)
- Internal cross-domain imports go directly to implementation files
- External imports use barrel files (`src/index.ts`)

---

*Structure analysis: 2026-01-30*
