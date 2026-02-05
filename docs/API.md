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

## Storage Layer

APIs for persisting and retrieving skills and patterns. These classes provide the foundation for skill management.

### SkillStore

File-based storage for skills. Skills are stored in subdirectory format: `skill-name/SKILL.md`.

**Constructor:**

```typescript
import { SkillStore } from 'gsd-skill-creator';

const store = new SkillStore('.claude/skills');
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skillsDir` | `string` | `.claude/skills` | Directory for skill storage |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `create` | `name, metadata, body` | `Promise<Skill>` | Create new skill |
| `read` | `name` | `Promise<Skill>` | Read skill by name |
| `update` | `name, metadata?, body?` | `Promise<Skill>` | Update existing skill |
| `delete` | `name` | `Promise<void>` | Delete skill |
| `list` | - | `Promise<string[]>` | List all skill names |
| `exists` | `name` | `Promise<boolean>` | Check if skill exists |
| `listWithFormat` | - | `Promise<{name, format, path}[]>` | List skills with format info |
| `hasLegacySkills` | - | `Promise<boolean>` | Check for legacy flat-file skills |

**Example - Complete CRUD:**

```typescript
import { SkillStore } from 'gsd-skill-creator';

const store = new SkillStore('.claude/skills');

// Create a skill
const skill = await store.create('my-skill', {
  name: 'my-skill',
  description: 'Use when working with X',
}, '# Instructions\n\nDo the thing.');

// Read a skill
const existing = await store.read('my-skill');
console.log(existing.metadata.description);
console.log(existing.body);

// Update a skill
const updated = await store.update('my-skill', {
  description: 'Updated description',
}, 'New body content');

// Delete a skill
await store.delete('my-skill');

// List all skills
const names = await store.list();
console.log(`Found ${names.length} skills`);

// Check existence
const exists = await store.exists('my-skill');
if (!exists) {
  console.log('Skill not found');
}
```

**Skill Structure:**

The `Skill` type returned by read/create/update contains:

```typescript
interface Skill {
  metadata: SkillMetadata;  // YAML frontmatter fields
  body: string;             // Markdown content
  path: string;             // Full path to SKILL.md
}
```

### PatternStore

Append-only storage for usage patterns. Patterns are stored as JSONL files organized by category.

**Constructor:**

```typescript
import { PatternStore } from 'gsd-skill-creator';

const store = new PatternStore('.planning/patterns');
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `patternsDir` | `string` | `.planning/patterns` | Directory for pattern storage |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `append` | `category, data` | `Promise<void>` | Append pattern to category file |
| `read` | `category` | `Promise<Pattern[]>` | Read all patterns from category |

**Example:**

```typescript
import { PatternStore } from 'gsd-skill-creator';

const store = new PatternStore('.planning/patterns');

// Append a command pattern
await store.append('commands', {
  command: 'git commit',
  context: 'After editing files',
  frequency: 5,
});

// Read patterns from a category
const patterns = await store.read('commands');
patterns.forEach(p => {
  console.log(`${p.category}: ${JSON.stringify(p.data)}`);
});
```

**Pattern Structure:**

```typescript
interface Pattern {
  timestamp: number;        // Unix timestamp
  category: PatternCategory;  // 'commands' | 'decisions' | 'files' | 'errors'
  data: Record<string, unknown>;  // Category-specific data
}
```

**Note:** PatternStore is primarily used internally by pattern detection features. Most users won't need to interact with it directly.

### SkillIndex

In-memory index for fast skill lookups and search. Automatically maintains an index file (`.skill-index.json`) for persistence.

**Constructor:**

```typescript
import { SkillStore, SkillIndex } from 'gsd-skill-creator';

const skillStore = new SkillStore('.claude/skills');
const index = new SkillIndex(skillStore, '.claude/skills');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `skillStore` | `SkillStore` | Store instance for reading skills |
| `skillsDir` | `string` | Skills directory path |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `load` | - | `Promise<void>` | Load index from disk |
| `rebuild` | - | `Promise<void>` | Rebuild index from skills |
| `refresh` | - | `Promise<void>` | Refresh stale entries |
| `getAll` | - | `Promise<SkillIndexEntry[]>` | Get all indexed skills |
| `getEnabled` | - | `Promise<SkillIndexEntry[]>` | Get enabled skills only |
| `search` | `query` | `Promise<SkillIndexEntry[]>` | Search by name/description |
| `findByTrigger` | `intent?, file?, context?` | `Promise<SkillIndexEntry[]>` | Find by trigger pattern |

**Example - Search and Filter:**

```typescript
import { createStores } from 'gsd-skill-creator';

const { skillIndex } = createStores();

// Get all skills
const all = await skillIndex.getAll();
console.log(`Total skills: ${all.length}`);

// Get enabled skills only
const enabled = await skillIndex.getEnabled();
console.log(`Enabled skills: ${enabled.length}`);

// Search by name or description
const results = await skillIndex.search('git');
results.forEach(skill => {
  console.log(`${skill.name}: ${skill.description}`);
});

// Find by trigger pattern
const triggered = await skillIndex.findByTrigger('commit changes');
triggered.forEach(skill => {
  console.log(`Matched: ${skill.name}`);
});
```

**Index Entry Structure:**

```typescript
interface SkillIndexEntry {
  name: string;
  description: string;
  enabled: boolean;
  triggers?: {
    intents?: string[];
    files?: string[];
    contexts?: string[];
  };
  path: string;
  mtime: number;  // File modification time
}
```

### listAllScopes()

List skills from all scopes (user and project) with conflict detection.

```typescript
import { listAllScopes } from 'gsd-skill-creator';

const skills = await listAllScopes();

skills.forEach(skill => {
  const conflict = skill.hasConflict ? ' (CONFLICT)' : '';
  console.log(`[${skill.scope}] ${skill.name}${conflict}`);
});
```

**Returns:** `Promise<ScopedSkillEntry[]>`

**ScopedSkillEntry Structure:**

```typescript
interface ScopedSkillEntry extends SkillIndexEntry {
  scope: 'user' | 'project';
  hasConflict?: boolean;  // Same name exists at other scope
}
```

---

## Validation

Zod schemas and validation functions for skill input validation. These ensure skills meet the official Claude Code specification before storage.

### Schemas

Zod schemas for validating skill data.

| Schema | Purpose |
|--------|---------|
| `SkillInputSchema` | Full skill creation input validation |
| `SkillUpdateSchema` | Partial skill update validation |
| `SkillNameSchema` | Skill name format validation (legacy) |
| `OfficialSkillNameSchema` | Strict official name validation |
| `TriggerPatternsSchema` | Trigger patterns array validation |
| `SkillMetadataSchema` | Full metadata validation |
| `GsdExtensionSchema` | Extension data validation |

**Example - Using Schemas Directly:**

```typescript
import { SkillInputSchema, OfficialSkillNameSchema } from 'gsd-skill-creator';

// Parse and validate input
const result = SkillInputSchema.safeParse({
  name: 'my-skill',
  description: 'Use when working with X',
});

if (!result.success) {
  console.log('Validation errors:', result.error.issues);
} else {
  console.log('Valid input:', result.data);
}

// Validate just the name
const nameResult = OfficialSkillNameSchema.safeParse('My-Skill');
// { success: false, error: ... }
```

### validateSkillInput()

Validate complete skill input for creation. Throws on validation failure.

**Signature:**

```typescript
function validateSkillInput(input: unknown): SkillInput
```

**Throws:** `Error` with detailed message if validation fails

**Example:**

```typescript
import { validateSkillInput } from 'gsd-skill-creator';

try {
  const validated = validateSkillInput({
    name: 'my-skill',
    description: 'Use when working with X',
    enabled: true,
    triggers: {
      intents: ['work with X', 'handle X'],
    },
  });
  console.log('Valid:', validated.name);
} catch (error) {
  console.error('Invalid:', error.message);
  // "Invalid skill input: name: Name must be lowercase..."
}
```

### validateSkillUpdate()

Validate partial skill update data. All fields are optional except `name` (which cannot be updated).

**Signature:**

```typescript
function validateSkillUpdate(input: unknown): SkillUpdate
```

**Throws:** `Error` with detailed message if validation fails

**Example:**

```typescript
import { validateSkillUpdate } from 'gsd-skill-creator';

const validated = validateSkillUpdate({
  description: 'Updated description',
  enabled: false,
});
```

### validateSkillNameStrict()

Strict name validation with detailed errors and suggestions for invalid names.

**Signature:**

```typescript
function validateSkillNameStrict(name: string): StrictNameValidationResult

interface StrictNameValidationResult {
  valid: boolean;
  errors: string[];
  suggestion?: string;
}
```

**Example:**

```typescript
import { validateSkillNameStrict } from 'gsd-skill-creator';

// Valid name
const valid = validateSkillNameStrict('my-skill');
// { valid: true, errors: [] }

// Invalid name with suggestion
const invalid = validateSkillNameStrict('My-Skill');
// {
//   valid: false,
//   errors: ['Name must start with a lowercase letter...'],
//   suggestion: 'my-skill'
// }

// Invalid with multiple errors
const bad = validateSkillNameStrict('My--Skill!!');
// {
//   valid: false,
//   errors: ['Invalid characters...', 'Cannot contain consecutive hyphens...'],
//   suggestion: 'my-skill'
// }
```

**Name Requirements:**
- 1-64 characters
- Only lowercase letters, numbers, and hyphens
- Must start and end with letter or number
- No consecutive hyphens (`--`)

### validateReservedName()

Check if a name conflicts with Claude Code built-in commands.

**Signature:**

```typescript
function validateReservedName(name: string): Promise<ReservedNameValidationResult>

interface ReservedNameValidationResult {
  valid: boolean;
  reserved: boolean;
  category?: string;
  reason?: string;
  error?: string;
  alternatives?: string[];
}
```

**Example:**

```typescript
import { validateReservedName } from 'gsd-skill-creator';

// Non-reserved name
const ok = await validateReservedName('my-custom-skill');
// { valid: true, reserved: false }

// Reserved name
const reserved = await validateReservedName('init');
// {
//   valid: false,
//   reserved: true,
//   category: 'commands',
//   reason: 'Built-in Claude Code command',
//   error: 'Name "init" is reserved...',
//   alternatives: ['my-init', 'custom-init', 'project-init']
// }
```

### validateDescriptionQuality()

Check description quality for reliable skill activation. Returns warnings (not errors) for poor descriptions.

**Signature:**

```typescript
function validateDescriptionQuality(description: string): DescriptionQualityResult

interface DescriptionQualityResult {
  hasActivationTriggers: boolean;
  warning?: string;
  suggestions?: string[];
}
```

**Example:**

```typescript
import { validateDescriptionQuality } from 'gsd-skill-creator';

// Good description with activation triggers
const good = validateDescriptionQuality('Use when working with TypeScript projects');
// { hasActivationTriggers: true }

// Poor description lacking triggers
const poor = validateDescriptionQuality('Handles TypeScript');
// {
//   hasActivationTriggers: false,
//   warning: 'Description may not activate reliably - lacks trigger phrases',
//   suggestions: [
//     'Add "Use when..." to specify when this skill should activate',
//     'Include specific keywords users might mention',
//     'Example: "Use when working with TypeScript projects"'
//   ]
// }
```

### hasActivationPattern()

Quick check if description contains activation-friendly patterns.

**Signature:**

```typescript
function hasActivationPattern(description: string): boolean
```

**Example:**

```typescript
import { hasActivationPattern } from 'gsd-skill-creator';

hasActivationPattern('Use when editing Python files');  // true
hasActivationPattern('Activate when user mentions git');  // true
hasActivationPattern('Helps with testing');  // true
hasActivationPattern('Python utilities');  // false
```

**Recognized Patterns:**
- "Use when..."
- "When user/you/working/editing..."
- "Activate when..."
- "For handling/processing/working with..."
- "Helps with/to..."
- "Asks/mentions/says..."

### suggestFixedName()

Transform an invalid skill name into a valid suggestion.

**Signature:**

```typescript
function suggestFixedName(input: string): string | null
```

**Example:**

```typescript
import { suggestFixedName } from 'gsd-skill-creator';

suggestFixedName('My-Skill');      // 'my-skill'
suggestFixedName('foo__bar');      // 'foo-bar'
suggestFixedName('hello world');   // 'hello-world'
suggestFixedName('valid-name');    // null (already valid, no change needed)
```

### Input/Update Types

Types inferred from validation schemas.

| Type | Description |
|------|-------------|
| `SkillInput` | Validated input for skill creation |
| `SkillUpdate` | Validated input for skill updates |

**SkillInput Fields:**

```typescript
interface SkillInput {
  name: string;           // Required: 1-64 chars, lowercase/numbers/hyphens
  description: string;    // Required: 1-1024 chars
  enabled?: boolean;      // Default: true
  triggers?: {
    intents?: string[];   // Activation phrases
    files?: string[];     // File patterns
    contexts?: string[];  // Context patterns
    threshold?: number;   // 0-1 activation threshold
  };
  // Claude Code official fields
  'disable-model-invocation'?: boolean;
  'user-invocable'?: boolean;
  'allowed-tools'?: string[];
  'argument-hint'?: string;
  model?: string;
  context?: 'fork';
  agent?: string;
  hooks?: Record<string, unknown>;
}
```

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

## Embeddings

APIs for generating semantic embeddings used in conflict detection and activation simulation.

### getEmbeddingService()

Get an initialized EmbeddingService instance. This is the recommended entry point.

```typescript
import { getEmbeddingService } from 'gsd-skill-creator';

const service = await getEmbeddingService();
```

**Returns:** `Promise<EmbeddingService>`

The service is lazily initialized on first call. Subsequent calls return the same singleton instance.

### EmbeddingService

Generate semantic embeddings with automatic caching and fallback support.

The service uses [BGE-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5) for 384-dimensional embeddings. When the model is unavailable (no network, memory constraints), it automatically falls back to TF-IDF heuristic embeddings.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `embed` | `text`, `skillName?` | `Promise<EmbeddingResult>` | Generate embedding for single text |
| `embedBatch` | `texts`, `skillNames?` | `Promise<EmbeddingResult[]>` | Batch embedding for efficiency |
| `getOrCompute` | `skillName`, `content` | `Promise<EmbeddingResult>` | Alias for embed with skillName |
| `getStatus` | - | `ServiceStatus` | Check service status |
| `isUsingFallback` | - | `boolean` | Check if using heuristic mode |
| `reloadModel` | - | `Promise<boolean>` | Attempt to reload model after fallback |
| `saveCache` | - | `Promise<void>` | Force save cache to disk |

**EmbeddingResult Type:**

```typescript
interface EmbeddingResult {
  embedding: number[];   // 384-dimensional vector
  fromCache: boolean;    // Whether result was cached
  method: 'model' | 'heuristic';  // Computation method used
}
```

**Example - Single Embedding:**

```typescript
import { getEmbeddingService } from 'gsd-skill-creator';

const service = await getEmbeddingService();

// Without caching
const result = await service.embed('commit my changes');
console.log(result.embedding.length); // 384

// With caching (pass skillName)
const cached = await service.embed('commit my changes', 'git-commit');
console.log(cached.fromCache); // false (first call)

const second = await service.embed('commit my changes', 'git-commit');
console.log(second.fromCache); // true (cache hit)
```

**Example - Batch Embedding:**

```typescript
const service = await getEmbeddingService();

// Batch embedding for efficiency
const results = await service.embedBatch(
  ['commit my changes', 'create a new file', 'run tests'],
  ['git-commit', 'file-create', 'test-runner']  // skill names for caching
);

results.forEach((r, i) => {
  console.log(`Skill ${i}: ${r.method}, cached: ${r.fromCache}`);
});
```

**Example - Service Status:**

```typescript
const service = await getEmbeddingService();
const status = service.getStatus();

console.log(`Initialized: ${status.initialized}`);
console.log(`Using fallback: ${status.fallbackMode}`);
console.log(`Cache entries: ${status.cacheStats.entries}`);
console.log(`Model: ${status.cacheStats.modelId}`);
```

### Caching Behavior

Embeddings are automatically cached when a `skillName` parameter is provided.

**Cache Location:** `.planning/calibration/embedding-cache.json`

**Cache Key:** Skill name + SHA-256 hash of content (first 16 characters)

**Cache Invalidation:** Automatic when content changes (hash mismatch)

**When to use skillName:**
- Always pass it when embedding skill descriptions (enables caching)
- Omit when embedding user prompts (they vary too much to cache effectively)

```typescript
// Good: skill descriptions benefit from caching
await service.embed(skill.description, skill.name);

// Also fine: one-off prompts don't need caching
await service.embed(userPrompt);
```

### Fallback Mode

When the HuggingFace model fails to load (network issues, memory constraints), the service automatically enters fallback mode using TF-IDF heuristic embeddings.

**Checking fallback status:**

```typescript
const service = await getEmbeddingService();

if (service.isUsingFallback()) {
  console.log('Using heuristic embeddings (model unavailable)');
}
```

**Reloading the model:**

```typescript
// After network becomes available
const success = await service.reloadModel();
if (success) {
  console.log('Model loaded successfully');
} else {
  console.log('Still in fallback mode');
}
```

**CLI command:** Use `gsd-skill reload-embeddings` to attempt model reload.

### cosineSimilarity()

Calculate similarity between two embedding vectors.

**Signature:**

```typescript
function cosineSimilarity(a: number[], b: number[]): number
```

**Returns:** Similarity score from -1 to 1 (higher = more similar)

**Example:**

```typescript
import { cosineSimilarity, getEmbeddingService } from 'gsd-skill-creator';

const service = await getEmbeddingService();

const embedding1 = (await service.embed('commit changes')).embedding;
const embedding2 = (await service.embed('save changes')).embedding;
const embedding3 = (await service.embed('delete files')).embedding;

console.log(cosineSimilarity(embedding1, embedding2)); // ~0.85 (similar)
console.log(cosineSimilarity(embedding1, embedding3)); // ~0.40 (different)
```

### Embedding Types

| Type | Description |
|------|-------------|
| `EmbeddingVector` | `number[]` - 384-dimensional embedding |
| `EmbeddingResult` | Result with embedding, cache status, and method |
| `EmbeddingServiceConfig` | Configuration options |
| `ProgressInfo` | Model download progress |
| `CacheEntry` | Single cache entry with metadata |
| `CacheStore` | Full cache structure |

---

## Conflict Detection

APIs for detecting semantic conflicts between skills that may cause activation confusion.

### ConflictDetector

Detect skills with overlapping descriptions using embedding similarity.

**Constructor:**

```typescript
import { ConflictDetector } from 'gsd-skill-creator';

const detector = new ConflictDetector();  // Uses default threshold (0.85)
const strict = new ConflictDetector({ threshold: 0.90 });  // Stricter matching
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `0.85` | Minimum similarity to flag as conflict |

**Threshold range:** 0.5 to 0.95 (values outside are clamped with warning)

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `detect` | `skills` | `Promise<ConflictDetectionResult>` | Find conflicting skill pairs |

**ConflictDetectionResult Type:**

```typescript
interface ConflictDetectionResult {
  conflicts: ConflictPair[];  // Detected conflict pairs
  skillCount: number;         // Total skills analyzed
  pairsAnalyzed: number;      // Number of pairs compared
  threshold: number;          // Threshold used
  analysisMethod: 'model' | 'heuristic';  // Embedding method used
}
```

**ConflictPair Type:**

```typescript
interface ConflictPair {
  skillA: string;             // First skill name
  skillB: string;             // Second skill name
  similarity: number;         // Similarity score (0-1)
  severity: 'high' | 'medium';  // Based on similarity
  overlappingTerms: string[]; // Common words found
  descriptionA: string;       // First skill description
  descriptionB: string;       // Second skill description
}
```

**Example - Basic Detection:**

```typescript
import { ConflictDetector } from 'gsd-skill-creator';

const detector = new ConflictDetector({ threshold: 0.85 });

const result = await detector.detect([
  { name: 'git-commit', description: 'Use when committing changes to git repository' },
  { name: 'save-work', description: 'Use when saving and committing work to git' },
  { name: 'run-tests', description: 'Use when running test suites' },
]);

console.log(`Analyzed ${result.skillCount} skills`);
console.log(`Compared ${result.pairsAnalyzed} pairs`);
console.log(`Found ${result.conflicts.length} conflicts`);

result.conflicts.forEach(c => {
  console.log(`${c.skillA} <-> ${c.skillB}: ${(c.similarity * 100).toFixed(1)}% (${c.severity})`);
  console.log(`  Common terms: ${c.overlappingTerms.join(', ')}`);
});
```

### Severity Levels

Conflicts are categorized by severity based on similarity score:

| Severity | Similarity | Meaning |
|----------|------------|---------|
| `high` | > 90% | Very likely conflict, activation confusion probable |
| `medium` | 85-90% | Possible conflict, worth reviewing |

**Example - Filtering by Severity:**

```typescript
const result = await detector.detect(skills);

const critical = result.conflicts.filter(c => c.severity === 'high');
console.log(`${critical.length} high-severity conflicts need immediate attention`);

const warnings = result.conflicts.filter(c => c.severity === 'medium');
console.log(`${warnings.length} medium-severity conflicts to review`);
```

### ConflictFormatter

Format conflict detection results for display.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `formatTerminal` | `result` | `string` | Colored terminal output |
| `formatJSON` | `result` | `string` | JSON output for scripting |

**Example:**

```typescript
import { ConflictDetector, ConflictFormatter } from 'gsd-skill-creator';

const detector = new ConflictDetector();
const result = await detector.detect(skills);

const formatter = new ConflictFormatter();

// For CLI display
console.log(formatter.formatTerminal(result));

// For CI/scripting
const json = formatter.formatJSON(result);
fs.writeFileSync('conflicts.json', json);
```

### RewriteSuggester

Generate suggestions to differentiate conflicting skills.

Uses Claude API when `ANTHROPIC_API_KEY` is available, otherwise provides heuristic suggestions based on overlapping terms.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `suggest` | `conflict`, `skill1`, `skill2` | `Promise<RewriteSuggestion>` | Generate rewrite suggestion |

**Example:**

```typescript
import { ConflictDetector, RewriteSuggester, SkillStore } from 'gsd-skill-creator';

const detector = new ConflictDetector();
const suggester = new RewriteSuggester();
const store = new SkillStore('.claude/skills');

const result = await detector.detect(skills);

for (const conflict of result.conflicts) {
  const skill1 = await store.read(conflict.skillA);
  const skill2 = await store.read(conflict.skillB);

  const suggestion = await suggester.suggest(conflict, skill1, skill2);
  console.log(`Suggestion for ${conflict.skillA}:`);
  console.log(`  ${suggestion.suggestedDescription}`);
}
```

### Conflict Detection Types

| Type | Description |
|------|-------------|
| `ConflictConfig` | Configuration with threshold |
| `ConflictPair` | Single detected conflict |
| `ConflictDetectionResult` | Full detection results |
| `RewriteSuggestion` | Rewrite suggestion for conflict |

---

## Simulation

APIs for predicting skill activation behavior using semantic similarity.

### ActivationSimulator

Simulate which skill would activate for a given prompt.

**Constructor:**

```typescript
import { ActivationSimulator } from 'gsd-skill-creator';

const simulator = new ActivationSimulator();  // Default threshold: 0.75
const customSimulator = new ActivationSimulator({
  threshold: 0.80,           // Require 80% similarity for activation
  challengerMargin: 0.1,     // 10% margin for challengers
  challengerFloor: 0.5,      // Minimum 50% for challenger consideration
  includeTrace: true,        // Include timing/debug info
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `0.75` | Minimum similarity to consider activation |
| `challengerMargin` | `number` | `0.1` | Within this margin of winner = challenger |
| `challengerFloor` | `number` | `0.5` | Minimum similarity for challenger |
| `includeTrace` | `boolean` | `false` | Include debug trace in results |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `simulate` | `prompt, skills` | `Promise<SimulationResult>` | Predict which skill would activate |
| `getConfig` | - | `SimulationConfig` | Get current configuration |

**Example:**

```typescript
import { ActivationSimulator } from 'gsd-skill-creator';

const simulator = new ActivationSimulator();

const result = await simulator.simulate('commit my changes', [
  { name: 'git-commit', description: 'Use when committing changes to git repository' },
  { name: 'prisma-migrate', description: 'Use when running database migrations' },
  { name: 'test-runner', description: 'Use when running test suites' },
]);

if (result.winner) {
  console.log(`Would activate: ${result.winner.skillName}`);
  console.log(`Confidence: ${result.winner.confidence.toFixed(1)}%`);
  console.log(`Level: ${result.winner.confidenceLevel}`);  // 'high', 'medium', 'low'
} else {
  console.log('No skill would activate');
}

console.log(`Explanation: ${result.explanation}`);
// "git-commit" would activate at 87.3%.

// Check for close competitors
if (result.challengers.length > 0) {
  console.log('Close competitors:');
  result.challengers.forEach(c => {
    console.log(`  - ${c.skillName}: ${c.confidence.toFixed(1)}%`);
  });
}
```

**SimulationResult Type:**

```typescript
interface SimulationResult {
  prompt: string;                    // Input prompt
  winner: SkillPrediction | null;    // Predicted activated skill
  challengers: SkillPrediction[];    // Close runner-ups
  allPredictions: SkillPrediction[]; // All skills ranked by similarity
  explanation: string;               // Human-readable explanation
  method: 'model' | 'heuristic';     // Embedding method used
  trace?: SimulationTrace;           // Debug info (if includeTrace: true)
}
```

**SkillPrediction Type:**

```typescript
interface SkillPrediction {
  skillName: string;
  similarity: number;           // 0-1 raw similarity score
  confidence: number;           // 0-100 percentage
  confidenceLevel: ConfidenceLevel;  // 'high' | 'medium' | 'low' | 'none'
  wouldActivate: boolean;       // Whether above threshold
}
```

### BatchSimulator

Run simulations across multiple prompts efficiently. Achieves 5x+ speedup through:
1. Batching embedding requests (amortizes model overhead)
2. Pre-computing skill embeddings (reused across all prompts)
3. Concurrent similarity computation

**Constructor:**

```typescript
import { BatchSimulator } from 'gsd-skill-creator';

const batch = new BatchSimulator();  // Default concurrency: 10
const customBatch = new BatchSimulator({
  concurrency: 20,             // Parallel operations limit
  threshold: 0.75,             // Activation threshold
  verbosity: 'all',            // 'summary' | 'all' | 'failures'
  onProgress: (p) => console.log(`${p.percent}%`),  // Progress callback
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | `number` | `10` | Maximum parallel operations |
| `threshold` | `number` | `0.75` | Activation threshold |
| `verbosity` | `string` | `'summary'` | Result filtering level |
| `onProgress` | `function` | - | Progress callback |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `runTestSuite` | `prompts, skills` | `Promise<BatchResult>` | Run many prompts vs skills |
| `runCrossSkill` | `prompt, skills` | `Promise<SimulationResult>` | One prompt vs all skills |
| `runTestSuiteWithProgress` | `prompts, skills` | `Promise<BatchResult>` | With visual progress bar |
| `filterResults` | `results` | `SimulationResult[]` | Filter by verbosity setting |

**Example - Test Suite:**

```typescript
import { BatchSimulator } from 'gsd-skill-creator';

const batch = new BatchSimulator({ concurrency: 20 });

const prompts = [
  'commit my changes',
  'run the tests',
  'deploy to production',
  'fix the bug in auth',
];

const skills = [
  { name: 'git-commit', description: 'Use when committing changes' },
  { name: 'test-runner', description: 'Use when running tests' },
  { name: 'deploy', description: 'Use when deploying applications' },
];

const result = await batch.runTestSuite(prompts, skills);

console.log(`Processed: ${result.stats.total} prompts`);
console.log(`Activations: ${result.stats.activations}`);
console.log(`Close competitions: ${result.stats.closeCompetitions}`);
console.log(`No activations: ${result.stats.noActivations}`);
console.log(`Duration: ${result.duration}ms`);

// Access individual results
result.results.forEach((r, i) => {
  console.log(`"${prompts[i]}" -> ${r.winner?.skillName ?? 'none'}`);
});
```

**Example - Progress Callback:**

```typescript
const batch = new BatchSimulator({
  onProgress: ({ current, total, percent, currentPrompt }) => {
    process.stdout.write(`\r[${percent}%] Processing: ${currentPrompt}`);
  },
});

const result = await batch.runTestSuite(prompts, skills);
console.log('\nDone!');
```

**BatchResult Type:**

```typescript
interface BatchResult {
  results: SimulationResult[];  // Individual results
  stats: BatchStats;            // Summary statistics
  duration: number;             // Total time in milliseconds
}

interface BatchStats {
  total: number;           // Total prompts processed
  activations: number;     // Prompts where skill activated
  closeCompetitions: number;  // Activations with challengers
  noActivations: number;   // Prompts with no activation
}
```

### Confidence Utilities

Helper functions for interpreting and formatting confidence scores.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `categorizeConfidence` | `score: number` | `ConfidenceLevel` | Categorize score as high/medium/low/none |
| `formatConfidence` | `score: number` | `string` | Format as percentage string (e.g., "87.3%") |
| `getDefaultThresholds` | - | `ConfidenceThresholds` | Get default threshold values |
| `detectChallengers` | `winner, predictions, config` | `ChallengerResult` | Find close runner-ups |
| `isWeakMatch` | `score, threshold` | `boolean` | Check if score is borderline |

**Example:**

```typescript
import {
  categorizeConfidence,
  formatConfidence,
  getDefaultThresholds,
  isWeakMatch,
} from 'gsd-skill-creator';

const score = 0.823;

console.log(categorizeConfidence(score));  // 'high'
console.log(formatConfidence(score));      // '82.3%'

const thresholds = getDefaultThresholds();
console.log(thresholds);
// { high: 0.85, medium: 0.70, low: 0.50 }

// Check if a match is borderline
if (isWeakMatch(score, 0.80)) {
  console.log('This is a borderline match - consider reviewing');
}
```

**ConfidenceLevel Type:**

```typescript
type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';
```

| Level | Score Range | Meaning |
|-------|-------------|---------|
| `high` | >= 85% | Strong match, reliable activation |
| `medium` | 70-84% | Reasonable match, likely correct |
| `low` | 50-69% | Weak match, may need review |
| `none` | < 50% | No meaningful match |

### Explanation and Hint Generation

Functions for generating human-readable explanations and differentiation hints.

| Function | Description |
|----------|-------------|
| `generateExplanation` | Generate natural language explanation of prediction |
| `generateBriefNegativeExplanation` | Short explanation when no skill matches |
| `generateDifferentiationHints` | Suggestions to differentiate similar skills |
| `formatHints` | Format hints for display |

These are used internally by `ActivationSimulator` but can be called directly for custom formatting.

### Simulation Types

| Type | Description |
|------|-------------|
| `SimulationSkillInput` | Input skill for simulation (name + description) |
| `SimulationConfig` | Simulator configuration options |
| `SimulationResult` | Full simulation result |
| `SimulationTrace` | Debug/timing information |
| `SkillPrediction` | Single skill prediction with scores |
| `ConfidenceLevel` | Confidence categorization |
| `ConfidenceThresholds` | Threshold configuration |
| `BatchConfig` | Batch simulator configuration |
| `BatchResult` | Batch simulation results |
| `BatchStats` | Summary statistics |
| `BatchProgress` | Progress callback data |
| `ChallengerConfig` | Challenger detection config |
| `ChallengerResult` | Challenger detection result |
| `DifferentiationHint` | Hint for differentiating skills |
| `ExplanationOptions` | Explanation generation options |

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
