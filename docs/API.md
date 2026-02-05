# API Reference

`gsd-skill-creator` exports a comprehensive API for programmatic skill management. This reference documents all public exports from `src/index.ts`.

**Quick Start:**

```typescript
import { createStores, createApplicationContext } from 'gsd-skill-creator';

// Basic usage - create stores for skill management
const { skillStore, skillIndex, patternStore } = createStores();

// List all skills
const skills = await skillIndex.getAll();

// Full application context with skill applicator
const { skillStore, skillIndex, applicator } = createApplicationContext();
const result = await applicator.apply('commit my changes');
```

---

## Public Exports

Quick reference of all exports organized by functional layer.

### Storage

| Export | Type | Description |
|--------|------|-------------|
| `SkillStore` | Class | CRUD operations for skill files |
| `PatternStore` | Class | Pattern persistence for learning |
| `SkillIndex` | Class | In-memory skill index with search |
| `createStores()` | Function | Factory for all stores |
| `createScopedStores()` | Function | Scope-aware store factory |
| `createApplicationContext()` | Function | Full context with applicator |
| `listAllScopes()` | Function | List available skill scopes |

### Validation

| Export | Type | Description |
|--------|------|-------------|
| `SkillInputSchema` | Zod Schema | Complete skill input validation |
| `SkillNameSchema` | Zod Schema | Name validation rules |
| `TriggerPatternsSchema` | Zod Schema | Trigger pattern validation |
| `SkillUpdateSchema` | Zod Schema | Partial update validation |
| `validateSkillInput()` | Function | Validate skill input data |
| `validateSkillUpdate()` | Function | Validate skill updates |
| `validateSkillName()` | Function | Basic name validation |
| `validateSkillMetadata()` | Function | Metadata schema check |

### Scope Utilities

| Export | Type | Description |
|--------|------|-------------|
| `getSkillsBasePath()` | Function | Get skills directory for scope |
| `getSkillPath()` | Function | Get full path to skill file |
| `parseScope()` | Function | Parse scope from string input |
| `resolveScopedSkillPath()` | Function | Resolve skill to actual file |
| `SCOPE_FLAG` | Constant | CLI flag name (`--project`) |
| `SCOPE_FLAG_SHORT` | Constant | Short flag (`-p`) |

### Application

| Export | Type | Description |
|--------|------|-------------|
| `TokenCounter` | Class | Count tokens in skill content |
| `RelevanceScorer` | Class | Score skill relevance to prompts |
| `ConflictResolver` | Class | Resolve overlapping skill activations |
| `SkillSession` | Class | Manage active skill session |
| `SkillApplicator` | Class | Apply skills to prompts |
| `DEFAULT_CONFIG` | Object | Default application configuration |

### Learning

| Export | Type | Description |
|--------|------|-------------|
| `FeedbackStore` | Class | Store correction feedback |
| `FeedbackDetector` | Class | Detect corrections in output |
| `RefinementEngine` | Class | Generate bounded refinements |
| `VersionManager` | Class | Track skill versions |
| `DEFAULT_BOUNDED_CONFIG` | Object | Default learning bounds |

### Calibration

| Export | Type | Description |
|--------|------|-------------|
| `CalibrationStore` | Class | Store calibration events |
| `ThresholdOptimizer` | Class | Find optimal threshold |
| `ThresholdHistory` | Class | Track threshold changes |
| `BenchmarkReporter` | Class | Generate benchmark reports |
| `calculateMCC()` | Function | Matthews Correlation Coefficient |
| `mccToPercentage()` | Function | Convert MCC to percentage |

### Workflows

| Export | Type | Description |
|--------|------|-------------|
| `createSkillWorkflow()` | Function | Create skill via workflow |
| `listSkillsWorkflow()` | Function | List skills via workflow |
| `searchSkillsWorkflow()` | Function | Search skills via workflow |

---

## Factory Functions

The primary entry points for using the library. These factories create properly configured instances with consistent paths.

### createStores()

Create all stores with consistent paths.

```typescript
import { createStores } from 'gsd-skill-creator';

// Default: project-level skills at .claude/skills
const { skillStore, skillIndex, patternStore } = createStores();

// Custom paths
const stores = createStores({
  skillsDir: '/custom/path/skills',
  patternsDir: '/custom/path/patterns',
});

// With scope (determines skillsDir automatically)
const stores = createStores({
  scope: 'user',  // Uses ~/.claude/skills
});
```

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `patternsDir` | `string` | `.planning/patterns` | Pattern storage path |
| `skillsDir` | `string` | `.claude/skills` | Skill storage path |
| `scope` | `SkillScope` | - | If set, overrides skillsDir |

**Returns:** `{ patternStore, skillStore, skillIndex }`

### createScopedStores()

Create stores configured for a specific scope (user or project).

```typescript
import { createScopedStores } from 'gsd-skill-creator';

// User-level skills at ~/.claude/skills
const {
  skillStore,
  skillIndex,
  patternStore,
  scope,
  skillsDir,
} = createScopedStores('user');

// Project-level skills at .claude/skills
const stores = createScopedStores('project');

// With custom patterns directory
const stores = createScopedStores('user', {
  patternsDir: '/custom/patterns',
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `scope` | `'user' \| 'project'` | Target scope for skills |
| `options.patternsDir` | `string` | Optional patterns path |

**Returns:** `{ patternStore, skillStore, skillIndex, scope, skillsDir }`

### createApplicationContext()

Create full application context including the skill applicator.

```typescript
import { createApplicationContext } from 'gsd-skill-creator';

const {
  skillStore,
  skillIndex,
  patternStore,
  applicator,
} = createApplicationContext();

// Apply skills to a prompt
const result = await applicator.apply('commit my changes');
if (result.activated) {
  console.log(`Activated: ${result.skillName}`);
  console.log(result.content);
}

// With custom configuration
const context = createApplicationContext({
  skillsDir: '.claude/skills',
  config: {
    maxTokens: 4000,
    activationThreshold: 0.75,
  },
});
```

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `patternsDir` | `string` | `.planning/patterns` | Pattern storage path |
| `skillsDir` | `string` | `.claude/skills` | Skill storage path |
| `config` | `Partial<ApplicationConfig>` | - | Override default config |

**Returns:** `{ patternStore, skillStore, skillIndex, applicator }`

---

## TypeScript Types

Key types exported for TypeScript consumers. For complete type definitions, see the source files.

### Core Types

| Type | Source | Description |
|------|--------|-------------|
| `Pattern` | `types/pattern.ts` | Usage pattern structure |
| `PatternCategory` | `types/pattern.ts` | Pattern categorization |
| `CommandPattern` | `types/pattern.ts` | Command pattern data |
| `DecisionPattern` | `types/pattern.ts` | Decision pattern data |

### Skill Types

| Type | Source | Description |
|------|--------|-------------|
| `Skill` | `types/skill.ts` | Complete skill structure |
| `SkillMetadata` | `types/skill.ts` | YAML frontmatter fields |
| `SkillTrigger` | `types/skill.ts` | Trigger configuration |
| `SkillLearning` | `types/skill.ts` | Learning metadata |
| `SkillCorrection` | `types/skill.ts` | Correction tracking |

### Scope Types

| Type | Source | Description |
|------|--------|-------------|
| `SkillScope` | `types/scope.ts` | `'user' \| 'project'` |
| `ScopedSkillPath` | `types/scope.ts` | Resolved skill path with scope |

### Application Types

| Type | Source | Description |
|------|--------|-------------|
| `TokenCountResult` | `types/application.ts` | Token counting result |
| `ScoredSkill` | `types/application.ts` | Skill with relevance score |
| `ActiveSkill` | `types/application.ts` | Currently active skill |
| `SessionState` | `types/application.ts` | Session state snapshot |
| `ConflictResult` | `types/application.ts` | Conflict resolution result |
| `TokenTracking` | `types/application.ts` | Token usage tracking |
| `ApplicationConfig` | `types/application.ts` | Application configuration |
| `ApplyResult` | `application/skill-applicator.ts` | Result of apply operation |
| `InvokeResult` | `application/skill-applicator.ts` | Result of invoke operation |
| `SkillLoadResult` | `application/skill-session.ts` | Skill loading result |
| `SessionReport` | `application/skill-session.ts` | Session activity report |

### Input/Update Types

| Type | Source | Description |
|------|--------|-------------|
| `SkillInput` | `validation/skill-validation.ts` | Validated skill input |
| `SkillUpdate` | `validation/skill-validation.ts` | Validated skill update |

### Storage Types

| Type | Source | Description |
|------|--------|-------------|
| `SkillIndexEntry` | `storage/skill-index.ts` | Single index entry |
| `SkillIndexData` | `storage/skill-index.ts` | Full index structure |
| `ScopedSkillEntry` | `storage/skill-index.ts` | Entry with scope info |

### Calibration Types

| Type | Source | Description |
|------|--------|-------------|
| `CalibrationEvent` | `calibration/index.ts` | Recorded calibration event |
| `CalibrationOutcome` | `calibration/index.ts` | Event outcome type |
| `CalibrationEventInput` | `calibration/index.ts` | Input for recording |
| `SkillScore` | `calibration/index.ts` | Skill similarity score |
| `OptimizationResult` | `calibration/index.ts` | Threshold optimization result |
| `ThresholdSnapshot` | `calibration/index.ts` | Historical threshold |
| `BenchmarkReport` | `calibration/index.ts` | Benchmark analysis report |

---

## Learning Module

APIs for feedback capture, skill refinement, and version management.

### FeedbackStore

Store and retrieve correction feedback for skills.

```typescript
import { FeedbackStore } from 'gsd-skill-creator';

const store = new FeedbackStore();

// Record correction feedback
await store.record({
  skillName: 'my-commit-skill',
  type: 'correction',
  original: 'Original output...',
  corrected: 'Corrected output...',
  context: { prompt: 'commit my changes' },
});

// Get all feedback
const all = await store.getAll();

// Get feedback for specific skill
const skillFeedback = await store.getBySkill('my-commit-skill');
```

**Methods:**

| Method | Description |
|--------|-------------|
| `record(event)` | Record a feedback event |
| `getAll()` | Get all feedback events |
| `getBySkill(name)` | Get feedback for specific skill |

### RefinementEngine

Generate bounded refinements from accumulated feedback.

```typescript
import { RefinementEngine, FeedbackStore, SkillStore } from 'gsd-skill-creator';

const feedbackStore = new FeedbackStore();
const skillStore = new SkillStore('.claude/skills');
const engine = new RefinementEngine(feedbackStore, skillStore);

// Check eligibility and get suggestion
const suggestion = await engine.suggest('my-commit-skill');

if (suggestion.eligible) {
  console.log('Suggested changes:');
  suggestion.changes.forEach(change => {
    console.log(`- ${change.type}: ${change.description}`);
  });
}
```

**Refinement Bounds:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Minimum corrections | 3 | Required before suggestions |
| Maximum change | 20% | Content change limit per refinement |
| Cooldown | 7 days | Between refinements |

**Methods:**

| Method | Description |
|--------|-------------|
| `suggest(skillName)` | Generate refinement suggestion |
| `checkEligibility(skillName)` | Check if skill is eligible |
| `apply(skillName, suggestion)` | Apply approved refinement |

### VersionManager

Track skill versions and enable rollback.

```typescript
import { VersionManager } from 'gsd-skill-creator';

const manager = new VersionManager('.claude/skills');

// Get version history
const history = await manager.getHistory('my-commit-skill');
history.forEach(version => {
  console.log(`${version.hash} - ${version.date} - ${version.message}`);
});

// Rollback to previous version
const result = await manager.rollback('my-commit-skill', 'abc1234');
if (result.success) {
  console.log(`Rolled back to version ${result.version}`);
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `getHistory(skillName)` | Get version history |
| `rollback(skillName, hash?)` | Rollback to version |
| `getCurrentVersion(skillName)` | Get current version info |

### Learning Types

| Type | Description |
|------|-------------|
| `FeedbackEvent` | Recorded feedback event |
| `FeedbackType` | `'correction' \| 'override' \| 'rejection'` |
| `RefinementSuggestion` | Generated refinement proposal |
| `SuggestedChange` | Individual change in suggestion |
| `SkillVersion` | Version history entry |
| `EligibilityResult` | Refinement eligibility check |
| `RollbackResult` | Rollback operation result |
| `BoundedLearningConfig` | Learning bounds configuration |
| `CorrectionAnalysis` | Analysis of correction patterns |

---

## See Also

- [CLI Reference](./CLI.md) - Command-line interface documentation
- [Official Format](./OFFICIAL-FORMAT.md) - Skill file format specification
- [Extensions](./EXTENSIONS.md) - Extension format documentation
