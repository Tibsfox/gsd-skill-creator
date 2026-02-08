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

### Teams

| Export | Type | Description |
|--------|------|-------------|
| `TeamStore` | Class | CRUD operations for team config files |
| `getTeamsBasePath()` | Function | Get teams directory for scope |
| `getAgentsBasePath()` | Function | Get agents directory path |
| `generateLeaderWorkerTemplate()` | Function | Generate leader/worker team config |
| `generatePipelineTemplate()` | Function | Generate pipeline team config |
| `generateSwarmTemplate()` | Function | Generate swarm team config |
| `generateGsdResearchTeam()` | Function | Generate GSD parallel research team |
| `generateGsdDebuggingTeam()` | Function | Generate GSD adversarial debugging team |
| `writeTeamAgentFiles()` | Function | Write agent `.md` files for team members |
| `generateAgentContent()` | Function | Generate markdown content for an agent file |
| `teamCreationWizard()` | Function | Interactive/non-interactive team creation |
| `nonInteractiveCreate()` | Function | Create team from CLI flags |
| `validateTeamFull()` | Function | Run all validation checks on team config |
| `validateMemberAgents()` | Function | Check agent files exist for members |
| `detectTaskCycles()` | Function | Detect circular task dependencies |
| `detectToolOverlap()` | Function | Detect shared write-capable tools |
| `detectSkillConflicts()` | Function | Detect cross-member skill conflicts |
| `detectRoleCoherence()` | Function | Detect near-duplicate role descriptions |
| `LEADER_TOOLS` | Constant | Tool array for leader/coordinator agents |
| `WORKER_TOOLS` | Constant | Tool array for leader/worker workers |
| `PIPELINE_STAGE_TOOLS` | Constant | Tool array for pipeline stage agents |
| `SWARM_WORKER_TOOLS` | Constant | Tool array for swarm worker agents |
| `GSD_RESEARCH_AGENT_IDS` | Constant | Agent IDs for GSD research team |
| `GSD_DEBUG_AGENT_IDS` | Constant | Agent IDs for GSD debugging team |
| `RESEARCH_DIMENSIONS` | Constant | Research dimension names |
| `TeamMemberSchema` | Zod Schema | Team member validation |
| `TeamConfigSchema` | Zod Schema | Team config validation |
| `TeamTaskSchema` | Zod Schema | Team task validation |
| `InboxMessageSchema` | Zod Schema | Inbox message validation |
| `validateTeamConfig()` | Function | Validate team config against schema |

### Discovery

| Export | Type | Description |
|--------|------|-------------|
| `parseSessionFile()` | Function | Stream-parse a JSONL session file |
| `parseJsonlLine()` | Function | Parse a single JSONL line |
| `enumerateSessions()` | Function | Find all sessions across projects |
| `classifyUserEntry()` | Function | Classify user entry as prompt or noise |
| `isRealUserPrompt()` | Function | Check if entry is a real user prompt |
| `ScanStateStore` | Class | Persistent scan state with atomic writes |
| `CorpusScanner` | Class | Incremental scanning with watermarks |
| `extractNgrams()` | Function | Extract tool sequence n-grams |
| `buildToolSequence()` | Function | Build tool name sequence from entries |
| `classifyBashCommand()` | Function | Classify Bash command into category |
| `normalizeBashCommand()` | Function | Normalize command for pattern matching |
| `extractBashPatterns()` | Function | Extract patterns from Bash commands |
| `PatternAggregator` | Class | Aggregate patterns across sessions |
| `processSession()` | Function | Process a single session for patterns |
| `createPatternSessionProcessor()` | Function | Create processor for CorpusScanner |
| `scorePattern()` | Function | Multi-factor pattern scoring |
| `rankCandidates()` | Function | Rank and deduplicate candidates |
| `generateSkillDraft()` | Function | Generate draft SKILL.md content |
| `selectCandidates()` | Function | Interactive candidate selection |
| `dbscan()` | Function | DBSCAN clustering algorithm |
| `tuneEpsilon()` | Function | Auto epsilon via k-distance knee |
| `clusterPrompts()` | Function | Full clustering pipeline |
| `createPromptCollectingProcessor()` | Function | Wrap processor to collect prompts |
| `PromptEmbeddingCache` | Class | Content-hash embedding cache |
| `scoreCluster()` | Function | Score a prompt cluster |
| `rankClusterCandidates()` | Function | Rank cluster candidates |
| `generateClusterDraft()` | Function | Generate cluster-based skill draft |

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

### Team Types

| Type | Source | Description |
|------|--------|-------------|
| `TeamConfig` | `types/team.ts` | Top-level team configuration |
| `TeamMember` | `types/team.ts` | Team member definition |
| `TeamTask` | `types/team.ts` | Task in a team's work queue |
| `InboxMessage` | `types/team.ts` | Inter-agent inbox message |
| `TeamValidationResult` | `types/team.ts` | Schema validation result |
| `TeamTopology` | `types/team.ts` | `'leader-worker' \| 'pipeline' \| 'swarm' \| 'custom'` |
| `TeamRole` | `types/team.ts` | `'leader' \| 'worker' \| 'reviewer' \| 'orchestrator' \| 'specialist'` |
| `TeamTaskStatus` | `types/team.ts` | `'pending' \| 'in_progress' \| 'completed'` |
| `TeamMemberModel` | `types/team.ts` | `'haiku' \| 'sonnet' \| 'opus'` |
| `BackendType` | `types/team.ts` | `'in-process' \| 'tmux' \| 'iterm2'` |
| `StructuredMessageType` | `types/team.ts` | Structured message type (extensible) |
| `TemplateOptions` | `teams/templates.ts` | Options for template generators |
| `TemplateResult` | `teams/templates.ts` | Template generation result |
| `GsdTemplateOptions` | `teams/gsd-templates.ts` | Options for GSD template generators |
| `TeamScope` | `teams/team-store.ts` | `'user' \| 'project'` team storage scope |
| `AgentFileResult` | `teams/team-agent-generator.ts` | Agent file generation result |
| `AgentMemberInput` | `teams/team-agent-generator.ts` | Input for agent content generation |
| `WizardOptions` | `teams/team-wizard.ts` | Team creation wizard options |
| `CreatePaths` | `teams/team-wizard.ts` | Injectable paths for testing |
| `TeamFullValidationResult` | `teams/team-validator.ts` | Full validation orchestrator result |
| `TeamFullValidationOptions` | `teams/team-validator.ts` | Full validation options |
| `MemberResolutionResult` | `teams/team-validator.ts` | Agent file resolution result |
| `CycleDetectionResult` | `teams/team-validator.ts` | Task cycle detection result |
| `ToolOverlapResult` | `teams/team-validator.ts` | Write-tool overlap result |
| `SkillConflictResult` | `teams/team-validator.ts` | Cross-member skill conflict result |
| `SkillConflictEntry` | `teams/team-validator.ts` | Single skill conflict entry |
| `RoleCoherenceResult` | `teams/team-validator.ts` | Role coherence validation result |
| `RoleCoherenceWarning` | `teams/team-validator.ts` | Role coherence warning entry |

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

## Calibration

APIs for collecting activation data, optimizing thresholds, and measuring accuracy.

### CalibrationStore

Persist calibration events (skill activation decisions and user outcomes) for threshold calibration and accuracy benchmarking.

**Storage:** `~/.gsd-skill/calibration/events.jsonl` (JSONL format)

**Constructor:**

```typescript
import { CalibrationStore } from 'gsd-skill-creator';

const store = new CalibrationStore();  // Default path
const customStore = new CalibrationStore('/custom/path');  // Custom path
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `record` | `input` | `Promise<CalibrationEvent>` | Record new calibration event |
| `updateOutcome` | `eventId, outcome` | `Promise<boolean>` | Update event outcome |
| `getAll` | - | `Promise<CalibrationEvent[]>` | Get all events |
| `getKnownOutcomes` | - | `Promise<CalibrationEvent[]>` | Get events with known outcomes |
| `count` | `knownOnly?` | `Promise<number>` | Count events |
| `clear` | - | `Promise<void>` | Clear all data (testing) |

**Example:**

```typescript
import { CalibrationStore } from 'gsd-skill-creator';

const store = new CalibrationStore();

// Record a calibration event
const event = await store.record({
  prompt: 'commit my work',
  skillScores: [
    { skillName: 'git-commit', similarity: 0.85 },
    { skillName: 'save-file', similarity: 0.42 },
  ],
  outcome: 'continued',  // User continued with skill activation
  topSkill: 'git-commit',
  topSimilarity: 0.85,
  activationThreshold: 0.75,
  wouldActivate: true,
});

console.log(`Event ID: ${event.id}`);
console.log(`Timestamp: ${event.timestamp}`);

// Get events with known outcomes for calibration
const knownEvents = await store.getKnownOutcomes();
console.log(`Calibration data: ${knownEvents.length} events`);
```

**CalibrationEvent Type:**

```typescript
interface CalibrationEvent {
  id: string;                    // UUID
  timestamp: string;             // ISO timestamp
  prompt: string;                // User prompt
  skillScores: SkillScore[];     // All skill similarity scores
  outcome: CalibrationOutcome;   // 'continued' | 'corrected' | 'unknown'
  topSkill?: string;             // Highest scoring skill
  topSimilarity?: number;        // Highest similarity score
  activationThreshold: number;   // Threshold at time of event
  wouldActivate: boolean;        // Whether activation would occur
}

type CalibrationOutcome = 'continued' | 'corrected' | 'unknown';
```

### ThresholdOptimizer

Find optimal activation thresholds using F1 score optimization via grid search.

**Constructor:**

```typescript
import { ThresholdOptimizer } from 'gsd-skill-creator';

const optimizer = new ThresholdOptimizer();
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `findOptimalThreshold` | `events, currentThreshold` | `OptimizationResult` | Find optimal threshold |
| `evaluateThreshold` | `events, threshold` | `ThresholdCandidate` | Evaluate single threshold |

**Example:**

```typescript
import { CalibrationStore, ThresholdOptimizer } from 'gsd-skill-creator';

const store = new CalibrationStore();
const optimizer = new ThresholdOptimizer();

// Get calibration data with known outcomes
const events = await store.getKnownOutcomes();
const currentThreshold = 0.75;

// Find optimal threshold
const result = optimizer.findOptimalThreshold(events, currentThreshold);

console.log(`Current threshold: ${result.currentThreshold}`);
console.log(`Current F1: ${(result.currentF1 * 100).toFixed(1)}%`);
console.log(`Optimal threshold: ${result.optimalThreshold}`);
console.log(`Optimal F1: ${(result.optimalF1 * 100).toFixed(1)}%`);
console.log(`Improvement: ${(result.improvement * 100).toFixed(1)}%`);
console.log(`Data points: ${result.dataPoints}`);

// Evaluate a specific threshold
const candidate = optimizer.evaluateThreshold(events, 0.80);
console.log(`Precision: ${(candidate.precision * 100).toFixed(1)}%`);
console.log(`Recall: ${(candidate.recall * 100).toFixed(1)}%`);
```

**OptimizationResult Type:**

```typescript
interface OptimizationResult {
  optimalThreshold: number;      // Best threshold found
  optimalF1: number;             // F1 score at optimal
  currentThreshold: number;      // Comparison baseline
  currentF1: number;             // F1 at current
  improvement: number;           // optimalF1 - currentF1
  dataPoints: number;            // Events used
  allCandidates: ThresholdCandidate[];  // All evaluated
}

interface ThresholdCandidate {
  threshold: number;
  f1: number;         // Harmonic mean of precision/recall
  precision: number;  // TP / (TP + FP)
  recall: number;     // TP / (TP + FN)
  accuracy: number;   // (TP + TN) / total
}
```

### ThresholdHistory

Track threshold changes over time for auditing and rollback.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `record` | `threshold, f1, reason` | `Promise<ThresholdSnapshot>` | Record threshold change |
| `getHistory` | - | `Promise<ThresholdSnapshot[]>` | Get all history |
| `getCurrent` | - | `Promise<ThresholdSnapshot \| null>` | Get current threshold |
| `rollback` | `timestamp` | `Promise<ThresholdSnapshot \| null>` | Rollback to snapshot |

**Example:**

```typescript
import { ThresholdHistory } from 'gsd-skill-creator';

const history = new ThresholdHistory();

// Record a threshold change
await history.record(0.72, 0.89, 'Optimization based on 150 calibration events');

// Get history
const snapshots = await history.getHistory();
snapshots.forEach(s => {
  console.log(`${s.timestamp}: ${s.threshold} (F1: ${s.f1})`);
});

// Rollback if needed
const previousSnapshot = snapshots[1];
if (previousSnapshot) {
  await history.rollback(previousSnapshot.timestamp);
}
```

### BenchmarkReporter

Generate benchmark reports for accuracy analysis.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `computeReport` | `events, threshold, perSkill?` | `BenchmarkReport` | Compute benchmark |
| `formatTerminal` | `report` | `string` | Terminal-friendly output |
| `formatJSON` | `report` | `string` | JSON output |

**Example:**

```typescript
import { CalibrationStore, BenchmarkReporter } from 'gsd-skill-creator';

const store = new CalibrationStore();
const reporter = new BenchmarkReporter();

const events = await store.getKnownOutcomes();
const report = reporter.computeReport(events, 0.75, true);  // Per-skill metrics

console.log(`Overall correlation: ${report.correlation}%`);
console.log(`Precision: ${report.metrics.precision}%`);
console.log(`Recall: ${report.metrics.recall}%`);
console.log(`F1: ${report.metrics.f1}%`);

if (report.recommendations.length > 0) {
  console.log('Recommendations:');
  report.recommendations.forEach(r => console.log(`  - ${r}`));
}

// Terminal output
console.log(reporter.formatTerminal(report));

// JSON for CI
const json = reporter.formatJSON(report);
```

### MCC Utilities

Matthews Correlation Coefficient for balanced accuracy measurement.

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `calculateMCC` | `tp, tn, fp, fn` | `number` | Calculate MCC (-1 to 1) |
| `mccToPercentage` | `mcc` | `number` | Convert to 0-100 scale |

**Example:**

```typescript
import { calculateMCC, mccToPercentage } from 'gsd-skill-creator';

const mcc = calculateMCC(80, 15, 3, 2);  // TP, TN, FP, FN
console.log(`MCC: ${mcc.toFixed(3)}`);   // ~0.87
console.log(`Correlation: ${mccToPercentage(mcc)}%`);  // ~87%
```

### Calibration Types

| Type | Description |
|------|-------------|
| `CalibrationEvent` | Complete calibration event |
| `CalibrationEventInput` | Input for recording events |
| `CalibrationOutcome` | `'continued' \| 'corrected' \| 'unknown'` |
| `SkillScore` | Skill name with similarity score |
| `OptimizationResult` | Threshold optimization results |
| `ThresholdCandidate` | Single threshold evaluation |
| `ThresholdSnapshot` | Historical threshold record |
| `BenchmarkReport` | Benchmark analysis report |

---

## Testing

APIs for managing and running activation test cases.

### TestStore

Persist test cases for skills. Test cases are stored in `<skillsDir>/<skillName>/tests.json`.

**Constructor:**

```typescript
import { TestStore } from 'gsd-skill-creator';

const store = new TestStore('user');     // User scope: ~/.claude/skills
const projectStore = new TestStore('project');  // Project scope: .claude/skills
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | `SkillScope` | `'user'` | `'user'` or `'project'` |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `add` | `skillName, input` | `Promise<TestCase>` | Add new test case |
| `get` | `skillName, testId` | `Promise<TestCase \| null>` | Get test case by ID |
| `update` | `skillName, testId, updates` | `Promise<TestCase \| null>` | Update test case |
| `delete` | `skillName, testId` | `Promise<boolean>` | Delete test case |
| `list` | `skillName` | `Promise<TestCase[]>` | List all test cases |

**Example:**

```typescript
import { TestStore } from 'gsd-skill-creator';

const store = new TestStore('user');

// Add a test case
const test = await store.add('git-commit', {
  prompt: 'commit my changes',
  expected: 'positive',
  description: 'Basic commit intent',
  tags: ['basic', 'intent'],
  difficulty: 'easy',
  minConfidence: 75,
});

console.log(`Test ID: ${test.id}`);

// List all tests for a skill
const tests = await store.list('git-commit');
console.log(`${tests.length} tests for git-commit`);

// Update a test
await store.update('git-commit', test.id, {
  description: 'Updated description',
  difficulty: 'medium',
});

// Delete a test
await store.delete('git-commit', test.id);
```

**TestCase Type:**

```typescript
interface TestCase {
  id: string;                    // UUID
  prompt: string;                // Test prompt
  expected: TestExpectation;     // 'positive' | 'negative' | 'edge-case'
  description?: string;          // Human-readable description
  tags?: string[];               // Categorization tags
  difficulty?: 'easy' | 'medium' | 'hard';
  minConfidence?: number;        // Expected minimum confidence
  maxConfidence?: number;        // Expected maximum confidence
  reason?: string;               // Why this is expected result
  createdAt: string;             // ISO timestamp
}
```

### TestRunner

Execute test cases and collect results. Connects TestStore with BatchSimulator.

**Constructor:**

```typescript
import { TestStore, TestRunner, ResultStore, SkillStore } from 'gsd-skill-creator';

const testStore = new TestStore('user');
const skillStore = new SkillStore('~/.claude/skills');
const resultStore = new ResultStore('user');

const runner = new TestRunner(testStore, skillStore, resultStore, 'user');
```

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `runForSkill` | `skillName, options?` | `Promise<TestRunResult>` | Run all tests for skill |

**RunOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `0.75` | Activation threshold |
| `storeResults` | `boolean` | `true` | Save results to history |
| `onProgress` | `function` | - | Progress callback |

**Example:**

```typescript
import {
  TestStore,
  TestRunner,
  ResultStore,
  SkillStore,
} from 'gsd-skill-creator';

const testStore = new TestStore('user');
const skillStore = new SkillStore('~/.claude/skills');
const resultStore = new ResultStore('user');
const runner = new TestRunner(testStore, skillStore, resultStore, 'user');

// Run tests for a skill
const result = await runner.runForSkill('git-commit', {
  threshold: 0.75,
  onProgress: ({ current, total }) => {
    console.log(`Progress: ${current}/${total}`);
  },
});

console.log(`Accuracy: ${result.metrics.accuracy}%`);
console.log(`Passed: ${result.metrics.passed}/${result.metrics.total}`);
console.log(`False positives: ${result.metrics.falsePositives}`);
console.log(`False negatives: ${result.metrics.falseNegatives}`);

// Check individual results
result.positiveResults.forEach(r => {
  const status = r.passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${r.prompt}`);
});
```

**TestRunResult Type:**

```typescript
interface TestRunResult {
  skillName: string;
  timestamp: string;
  metrics: RunMetrics;
  positiveResults: TestCaseResult[];
  negativeResults: TestCaseResult[];
  edgeCaseResults: TestCaseResult[];
  threshold: number;
  duration: number;
}

interface RunMetrics {
  total: number;
  passed: number;
  failed: number;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
}
```

### Result Formatting

Format test results for display.

| Export | Description |
|--------|-------------|
| `ResultFormatter` | Class for formatting results |
| `formatTestResults(results, options)` | Format for terminal output |
| `formatTestJSON(results)` | Format as JSON |

**Example:**

```typescript
import { formatTestResults, formatTestJSON } from 'gsd-skill-creator';

// Terminal output
console.log(formatTestResults(result, { verbose: true }));

// JSON for CI
const json = formatTestJSON(result);
fs.writeFileSync('test-results.json', json);
```

### ReviewWorkflow

Interactive workflow for reviewing and approving generated test cases.

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `review` | `skillName, tests` | `Promise<ReviewResult>` | Interactive review |

> **Note:** Test generators (`HeuristicTestGenerator`, `LLMTestGenerator`) are exported via the testing module for advanced use but are typically accessed via the `test generate` CLI command.

### Testing Types

| Type | Description |
|------|-------------|
| `TestCase` | Complete test case |
| `TestCaseInput` | Input for creating test case |
| `TestExpectation` | `'positive' \| 'negative' \| 'edge-case'` |
| `TestResult` | Legacy result type |
| `TestCaseResult` | Individual test execution result |
| `RunMetrics` | Aggregated test metrics |
| `TestRunResult` | Complete test run result |
| `TestRunSnapshot` | Historical test run |
| `RunOptions` | Test runner options |
| `FormatOptions` | Formatting options |
| `ValidationWarning` | Test validation warning |
| `ReviewResult` | Review workflow result |

---

## Application Components

Lower-level components for building custom skill systems. Most users should use factory functions instead.

| Component | Purpose |
|-----------|---------|
| `TokenCounter` | Count tokens in skill content using tiktoken |
| `RelevanceScorer` | Score skill relevance to user prompts |
| `ConflictResolver` | Resolve overlapping skill activations at runtime |
| `SkillSession` | Manage active skills within a session |
| `SkillApplicator` | Apply skills to Claude conversations |

**Example - SkillApplicator:**

```typescript
import { createApplicationContext } from 'gsd-skill-creator';

const { applicator } = createApplicationContext();

// Apply skills to a prompt
const result = await applicator.apply('commit my changes');

if (result.activated) {
  console.log(`Skill: ${result.skillName}`);
  console.log(`Content:\n${result.content}`);
}

// Invoke a specific skill by name
const invokeResult = await applicator.invoke('git-commit');
console.log(invokeResult.content);
```

See source files for detailed API documentation of individual components.

---

## Workflows

High-level workflow functions for common operations.

| Function | Description |
|----------|-------------|
| `createSkillWorkflow()` | Interactive skill creation with validation |
| `listSkillsWorkflow()` | List skills with formatting options |
| `searchSkillsWorkflow()` | Interactive fuzzy search for skills |

**Example:**

```typescript
import { createSkillWorkflow, listSkillsWorkflow } from 'gsd-skill-creator';

// Create a skill interactively
const skill = await createSkillWorkflow({
  name: 'my-skill',
  description: 'Use when working with X',
});

// List all skills with details
await listSkillsWorkflow({ verbose: true });
```

> **Note:** These workflows are designed for CLI use. For programmatic access, use the underlying stores directly.

---

## Teams Module

APIs for creating, storing, validating, and managing agent teams. Teams coordinate multiple Claude Code agents working in parallel using leader-worker, pipeline, or swarm topologies.

### Team Types and Constants

Core types and constant arrays used throughout the teams module.

**Type Aliases:**

| Type | Values | Description |
|------|--------|-------------|
| `TeamTopology` | `'leader-worker' \| 'pipeline' \| 'swarm' \| 'custom'` | Team coordination pattern |
| `TeamRole` | `'leader' \| 'worker' \| 'reviewer' \| 'orchestrator' \| 'specialist'` | Member role classification |
| `TeamTaskStatus` | `'pending' \| 'in_progress' \| 'completed'` | Task lifecycle status |
| `TeamMemberModel` | `'haiku' \| 'sonnet' \| 'opus'` | Claude model alias |
| `BackendType` | `'in-process' \| 'tmux' \| 'iterm2'` | Process backend type |
| `StructuredMessageType` | Known types + `string` | Inter-agent message type (extensible) |

**Constant Arrays:**

| Constant | Type | Description |
|----------|------|-------------|
| `TEAM_TOPOLOGIES` | `readonly string[]` | Valid topology values |
| `TEAM_ROLES` | `readonly string[]` | Valid role values |
| `TEAM_TASK_STATUSES` | `readonly string[]` | Valid task status values |
| `TEAM_MEMBER_MODELS` | `readonly string[]` | Valid model aliases |
| `BACKEND_TYPES` | `readonly string[]` | Valid backend types |
| `STRUCTURED_MESSAGE_TYPES` | `readonly string[]` | Known message types |

**Key Interfaces:**

```typescript
import type { TeamConfig, TeamMember, TeamTask, InboxMessage } from 'gsd-skill-creator';

// TeamConfig: top-level team configuration
const config: TeamConfig = {
  name: 'my-team',
  description: 'Research team for API analysis',
  leadAgentId: 'my-team-lead',
  createdAt: new Date().toISOString(),
  members: [/* TeamMember[] */],
};

// TeamMember: individual agent in a team
const member: TeamMember = {
  agentId: 'my-team-lead',
  name: 'Lead',
  agentType: 'coordinator',
  model: 'sonnet',
  backendType: 'tmux',
  prompt: 'Coordinate the research team...',
};

// TeamTask: work item in the team's queue
const task: TeamTask = {
  id: 'task-1',
  subject: 'Analyze API surface',
  status: 'pending',
  owner: 'my-team-worker-1',
  blockedBy: ['task-0'],
};

// InboxMessage: inter-agent communication
const message: InboxMessage = {
  from: 'my-team-lead',
  text: 'Please begin task-1',
  timestamp: new Date().toISOString(),
  read: false,
};
```

### Template Generators

Pure functions that produce valid `TeamConfig` objects with pattern-specific members, tools, and sample tasks. No side effects or I/O.

**Tool Constant Arrays:**

| Constant | Tools Included | Used By |
|----------|---------------|---------|
| `LEADER_TOOLS` | Read, Write, Bash, Glob, Grep, TaskCreate, TaskList, TaskGet, TaskUpdate, SendMessage, TeammateTool | Leader/coordinator agents |
| `WORKER_TOOLS` | Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, TaskGet, TaskUpdate, SendMessage | Leader/worker workers |
| `PIPELINE_STAGE_TOOLS` | Read, Write, Edit, Bash, Glob, Grep, TaskGet, TaskUpdate, SendMessage | Pipeline stage agents |
| `SWARM_WORKER_TOOLS` | Read, Write, Edit, Bash, Glob, Grep, TaskList, TaskGet, TaskUpdate, SendMessage | Swarm worker agents |

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `generateLeaderWorkerTemplate` | `opts: TemplateOptions` | `TemplateResult` | 1 coordinator + N workers |
| `generatePipelineTemplate` | `opts: TemplateOptions` | `TemplateResult` | 1 orchestrator + N sequential stages |
| `generateSwarmTemplate` | `opts: TemplateOptions` | `TemplateResult` | 1 coordinator + N self-claiming workers |

**TemplateOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | Required | Team name, used as prefix for agent IDs |
| `description` | `string` | Pattern-specific | Human-readable team description |
| `workerCount` | `number` | `3` | Number of workers or stages |

**TemplateResult:**

```typescript
interface TemplateResult {
  config: TeamConfig;          // Valid config ready for serialization
  sampleTasks: TeamTask[];     // Placeholder tasks demonstrating the pattern
  patternInfo: {
    topology: string;          // e.g., 'leader-worker'
    description: string;       // Pattern explanation
    memberSummary: string;     // e.g., '1 lead + 3 workers'
  };
}
```

**Example - Generate a Leader/Worker Team:**

```typescript
import { generateLeaderWorkerTemplate } from 'gsd-skill-creator';

const result = generateLeaderWorkerTemplate({
  name: 'code-review',
  description: 'Parallel code review team',
  workerCount: 4,
});

console.log(result.config.name);                // 'code-review'
console.log(result.config.members.length);       // 5 (1 lead + 4 workers)
console.log(result.config.leadAgentId);          // 'code-review-lead'
console.log(result.patternInfo.memberSummary);   // '1 lead + 4 workers'
console.log(result.sampleTasks.length);          // 2
```

**Example - Generate a Pipeline Team:**

```typescript
import { generatePipelineTemplate } from 'gsd-skill-creator';

const result = generatePipelineTemplate({
  name: 'data-pipeline',
  workerCount: 3,
});

// Pipeline tasks have sequential dependencies
console.log(result.sampleTasks[0].blockedBy);    // undefined (first stage)
console.log(result.sampleTasks[1].blockedBy);    // ['stage-1']
console.log(result.sampleTasks[2].blockedBy);    // ['stage-2']
```

### GSD Templates

Pre-configured team templates for GSD workflows: parallel research and adversarial debugging.

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `generateGsdResearchTeam` | `opts?: GsdTemplateOptions` | `TemplateResult` | 1 synthesizer + 4 dimension researchers |
| `generateGsdDebuggingTeam` | `opts?: GsdTemplateOptions` | `TemplateResult` | 1 coordinator + 3 adversarial debuggers |

**GsdTemplateOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `'gsd-research'` or `'gsd-debug'` | Team name override |
| `description` | `string` | Pattern-specific | Team description override |

**Constants:**

| Constant | Description |
|----------|-------------|
| `GSD_RESEARCH_AGENT_IDS` | Readonly tuple of 5 agent IDs for the research team |
| `GSD_DEBUG_AGENT_IDS` | Readonly tuple of 4 agent IDs for the debugging team |
| `RESEARCH_DIMENSIONS` | `['stack', 'features', 'architecture', 'pitfalls']` |

**Example - GSD Research Team:**

```typescript
import { generateGsdResearchTeam, RESEARCH_DIMENSIONS } from 'gsd-skill-creator';

const result = generateGsdResearchTeam();

console.log(result.config.members.length);       // 5 (1 synthesizer + 4 researchers)
console.log(result.config.leadAgentId);          // 'gsd-research-synthesizer'
console.log(RESEARCH_DIMENSIONS);                // ['stack', 'features', 'architecture', 'pitfalls']

// Research tasks: one per dimension + synthesis
console.log(result.sampleTasks.length);          // 5
console.log(result.sampleTasks[4].subject);      // 'Synthesize research findings'
console.log(result.sampleTasks[4].blockedBy);    // ['research-stack', 'research-features', ...]
```

**Example - GSD Debugging Team:**

```typescript
import { generateGsdDebuggingTeam } from 'gsd-skill-creator';

const result = generateGsdDebuggingTeam({ name: 'my-debug' });

console.log(result.config.members.length);       // 4 (1 coordinator + 3 debuggers)
console.log(result.config.leadAgentId);          // 'gsd-debug-lead'

// Debug tasks: hypothesize -> 3 investigations -> synthesize
console.log(result.sampleTasks.length);          // 5
console.log(result.sampleTasks[0].subject);      // 'Form debugging hypotheses'
```

### TeamStore

File-based persistence for team configurations. Configs are stored as JSON at `{teamsDir}/{teamName}/config.json`. Validates configs with Zod schemas before writing.

**Constructor:**

```typescript
import { TeamStore, getTeamsBasePath } from 'gsd-skill-creator';

// Project-level teams
const store = new TeamStore('.claude/teams');

// User-level teams
const store = new TeamStore(getTeamsBasePath('user'));
// resolves to ~/.claude/teams
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `teamsDir` | `string` | Directory for team config storage |

**Methods:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `save` | `config: TeamConfig` | `Promise<string>` | Validate and save config, returns path |
| `read` | `teamName: string` | `Promise<TeamConfig>` | Read config by team name |
| `exists` | `teamName: string` | `Promise<boolean>` | Check if team config exists |
| `list` | - | `Promise<string[]>` | List all team names |
| `delete` | `teamName: string` | `Promise<void>` | Delete team config and directory |

**Path Helpers:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getTeamsBasePath` | `scope: TeamScope` | `string` | `'user'` -> `~/.claude/teams`, `'project'` -> `.claude/teams` |
| `getAgentsBasePath` | - | `string` | Always `.claude/agents` (project scope) |

**Example - Complete CRUD:**

```typescript
import { TeamStore, generateLeaderWorkerTemplate } from 'gsd-skill-creator';

const store = new TeamStore('.claude/teams');

// Create a team from template
const { config } = generateLeaderWorkerTemplate({ name: 'my-team' });
const configPath = await store.save(config);
console.log(`Saved to: ${configPath}`);

// Read it back
const loaded = await store.read('my-team');
console.log(loaded.name);           // 'my-team'
console.log(loaded.members.length); // 4

// List all teams
const teams = await store.list();
console.log(`Found ${teams.length} teams`);

// Check existence
const exists = await store.exists('my-team');
console.log(exists);  // true

// Delete
await store.delete('my-team');
```

### Agent File Generation

Generate role-aware agent `.md` files for team members. Coordinators/orchestrators get leader-focused instructions; workers get task-execution-focused instructions.

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `generateAgentContent` | `member, teamName, tools` | `string` | Generate markdown with YAML frontmatter |
| `writeTeamAgentFiles` | `members, teamName, agentsDir` | `AgentFileResult` | Write agent files, skip existing |

**AgentMemberInput:**

| Field | Type | Description |
|-------|------|-------------|
| `agentId` | `string` | Unique agent identifier |
| `name` | `string` | Display name |
| `agentType` | `string?` | Agent classification (e.g., `'coordinator'`, `'worker'`) |
| `tools` | `string[]` | Tools assigned to this member |

**AgentFileResult:**

```typescript
interface AgentFileResult {
  created: string[];   // agentIds of newly created files
  skipped: string[];   // agentIds of existing files (preserved)
}
```

**Example - Generate Agent Files:**

```typescript
import {
  writeTeamAgentFiles,
  generateAgentContent,
  LEADER_TOOLS,
  WORKER_TOOLS,
} from 'gsd-skill-creator';

// Generate content for a single agent
const content = generateAgentContent(
  { agentId: 'my-team-lead', name: 'Lead', agentType: 'coordinator', tools: LEADER_TOOLS },
  'my-team',
  LEADER_TOOLS,
);
console.log(content);  // Markdown with YAML frontmatter

// Write agent files for all members (existing files are never overwritten)
const result = writeTeamAgentFiles(
  [
    { agentId: 'my-team-lead', name: 'Lead', agentType: 'coordinator', tools: LEADER_TOOLS },
    { agentId: 'my-team-worker-1', name: 'Worker 1', agentType: 'worker', tools: WORKER_TOOLS },
  ],
  'my-team',
  '.claude/agents',
);

console.log(`Created: ${result.created.join(', ')}`);
console.log(`Skipped: ${result.skipped.join(', ')}`);
```

### Team Creation Wizard

Interactive and non-interactive team creation workflows. The interactive wizard uses `@clack/prompts` to guide users through pattern selection, naming, and scope configuration.

**Functions:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `teamCreationWizard` | `opts?: WizardOptions` | `Promise<void>` | Entry point (routes to interactive or non-interactive) |
| `nonInteractiveCreate` | `opts, paths?` | `Promise<void>` | Create team from CLI flags |

**Routing Logic:** If both `name` and `pattern` are provided, `teamCreationWizard` uses the non-interactive path. Otherwise, it launches the interactive wizard.

**WizardOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | - | Team name (lowercase, alphanumeric + hyphens) |
| `pattern` | `string` | - | `'leader-worker' \| 'pipeline' \| 'swarm'` |
| `members` | `string` | `'3'` | Worker/stage count (1-10) |
| `scope` | `string` | `'project'` | `'user' \| 'project'` |
| `description` | `string` | - | Optional team description |

**CreatePaths (for testing):**

| Field | Type | Description |
|-------|------|-------------|
| `teamsDir` | `string` | Directory for team config files |
| `agentsDir` | `string` | Directory for agent `.md` files |

**Example - Non-Interactive Creation:**

```typescript
import { nonInteractiveCreate } from 'gsd-skill-creator';

await nonInteractiveCreate({
  name: 'my-research-team',
  pattern: 'leader-worker',
  members: '4',
  scope: 'project',
  description: 'Parallel research team',
});
// Creates config at .claude/teams/my-research-team/config.json
// Creates agent files at .claude/agents/{agentId}.md
```

**Example - Interactive Wizard:**

```typescript
import { teamCreationWizard } from 'gsd-skill-creator';

// No name/pattern -> launches interactive prompts
await teamCreationWizard();

// With name/pattern -> non-interactive path
await teamCreationWizard({
  name: 'fast-team',
  pattern: 'swarm',
});
```

### Team Validation

Comprehensive validation for team configurations including schema validation, agent resolution, cycle detection, tool overlap analysis, skill conflict detection, and role coherence checking.

**Primary Function:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `validateTeamFull` | `config, options?` | `Promise<TeamFullValidationResult>` | Run all 7 validation checks |

**Individual Validators:**

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `validateTeamConfig` | `config: unknown` | `TeamValidationResult` | Schema validation (Zod) |
| `validateMemberAgents` | `members, agentsDirs?` | `MemberResolutionResult[]` | Check agent files exist on disk |
| `detectTaskCycles` | `tasks: TeamTask[]` | `CycleDetectionResult` | Detect circular `blockedBy` dependencies |
| `detectToolOverlap` | `members: TeamMember[]` | `ToolOverlapResult[]` | Find shared write-capable tools |
| `detectSkillConflicts` | `memberSkills, options?` | `Promise<SkillConflictResult>` | Cross-member skill overlap (async) |
| `detectRoleCoherence` | `members, options?` | `Promise<RoleCoherenceResult>` | Near-duplicate role descriptions (async) |

**TeamFullValidationResult:**

```typescript
interface TeamFullValidationResult {
  valid: boolean;                          // No errors (warnings allowed)
  errors: string[];                        // Blocking issues
  warnings: string[];                      // Non-blocking suggestions
  memberResolution: MemberResolutionResult[];  // Per-member agent file status
  data?: TeamConfig;                       // Parsed config (if schema valid)
}
```

**TeamFullValidationOptions:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentsDirs` | `string[]` | Project + user scope | Directories to search for agent files |
| `sharedSkills` | `string[]` | - | Skills excluded from conflict detection |
| `threshold` | `number` | `0.85` | Similarity threshold for conflicts |
| `tasks` | `TeamTask[]` | - | Tasks for cycle detection (optional) |
| `memberSkills` | `Array<{agentId, skills}>` | - | Skills for conflict detection (optional) |
| `memberDescriptions` | `Array<{agentId, agentType?, description}>` | - | Descriptions for role coherence (optional) |

**Validation Sequence:**

1. **Schema validation** -- early return on failure
2. **Topology rules** -- leader count, member roles
3. **Member resolution** -- agent files on disk
4. **Task cycles** -- circular `blockedBy` (if tasks provided)
5. **Tool overlap** -- shared Write/Edit/MultiEdit (warnings)
6. **Skill conflicts** -- cross-member semantic overlap (if memberSkills provided)
7. **Role coherence** -- near-duplicate descriptions (if memberDescriptions provided)

**Example - Full Validation:**

```typescript
import { validateTeamFull } from 'gsd-skill-creator';

const result = await validateTeamFull(
  {
    name: 'my-team',
    leadAgentId: 'my-team-lead',
    createdAt: new Date().toISOString(),
    members: [
      { agentId: 'my-team-lead', name: 'Lead', agentType: 'coordinator' },
      { agentId: 'my-team-worker-1', name: 'Worker 1' },
    ],
  },
  {
    tasks: [
      { id: 'task-1', subject: 'Do A', status: 'pending' },
      { id: 'task-2', subject: 'Do B', status: 'pending', blockedBy: ['task-1'] },
    ],
  },
);

if (result.valid) {
  console.log('Team is valid!');
} else {
  console.log('Errors:', result.errors);
}

console.log('Warnings:', result.warnings);

// Check member agent file resolution
result.memberResolution.forEach(m => {
  console.log(`${m.agentId}: ${m.status}`);
  if (m.status === 'missing' && m.suggestions) {
    console.log(`  Did you mean: ${m.suggestions.join(', ')}?`);
  }
});
```

**Example - Individual Validators:**

```typescript
import { detectTaskCycles, detectToolOverlap } from 'gsd-skill-creator';

// Detect circular task dependencies
const cycleResult = detectTaskCycles([
  { id: 'a', subject: 'Task A', status: 'pending', blockedBy: ['c'] },
  { id: 'b', subject: 'Task B', status: 'pending', blockedBy: ['a'] },
  { id: 'c', subject: 'Task C', status: 'pending', blockedBy: ['b'] },
]);
console.log(cycleResult.hasCycle);  // true
console.log(cycleResult.cycle);     // ['a', 'b', 'c']

// Detect write-tool overlap
const overlaps = detectToolOverlap([
  { agentId: 'worker-1', name: 'W1', tools: ['Read', 'Write', 'Edit'] },
  { agentId: 'worker-2', name: 'W2', tools: ['Read', 'Write'] },
] as any);
console.log(overlaps);
// [{ tool: 'Write', members: ['worker-1', 'worker-2'] }]
```

### Zod Schemas

Schemas for validating team data structures. Available for direct use with Zod's `.safeParse()` or `.parse()`.

| Schema | Purpose |
|--------|---------|
| `TeamMemberSchema` | Validate a single team member object |
| `TeamConfigSchema` | Validate a complete team configuration |
| `TeamTaskSchema` | Validate a team task object |
| `InboxMessageSchema` | Validate an inbox message object |

**Example - Direct Schema Use:**

```typescript
import { TeamConfigSchema, TeamMemberSchema } from 'gsd-skill-creator';

const result = TeamConfigSchema.safeParse({
  name: 'my-team',
  leadAgentId: 'my-team-lead',
  createdAt: new Date().toISOString(),
  members: [{ agentId: 'my-team-lead', name: 'Lead' }],
});

if (!result.success) {
  console.log('Errors:', result.error.issues);
}
```

### See Also

- [CLI Reference](./CLI.md) - Team CLI commands (`team create`, `team list`, `team validate`, `team spawn`, `team status`)
- [GSD Teams Guide](./GSD-TEAMS.md) - When to use teams vs. subagents in GSD workflows

---

## Discovery Module

The discovery module scans Claude Code session logs to find recurring interaction patterns and generate draft skills. All exports are available from the `gsd-skill-creator` package.

### Session Parsing

```typescript
import { parseSessionFile, enumerateSessions, classifyUserEntry } from 'gsd-skill-creator';

// Stream-parse a JSONL session file
for await (const entry of parseSessionFile('/path/to/session.jsonl')) {
  if (entry.kind === 'tool-uses') {
    console.log('Tools used:', entry.tools.map(t => t.name));
  }
  if (entry.kind === 'user' && classifyUserEntry(entry).isRealPrompt) {
    console.log('Real prompt:', entry.text);
  }
}

// Enumerate all sessions across projects
const sessions = await enumerateSessions();
for (const session of sessions) {
  console.log(`${session.projectSlug}: ${session.sessionId}`);
}
```

### Incremental Scanning

```typescript
import { ScanStateStore, CorpusScanner } from 'gsd-skill-creator';

const stateStore = new ScanStateStore('/path/to/scan-state.json');
const scanner = new CorpusScanner({
  stateStore,
  excludeProjects: ['my-private-project'],
  forceRescan: false,
});

const result = await scanner.scan(async (sessionFile, metadata) => {
  // Process each new/modified session
  console.log(`Processing: ${metadata.projectSlug}/${metadata.sessionId}`);
});

console.log(`Scanned ${result.newSessions} new, ${result.skippedSessions} skipped`);
```

### Pattern Extraction

```typescript
import {
  extractNgrams, classifyBashCommand,
  PatternAggregator, createPatternSessionProcessor,
} from 'gsd-skill-creator';

// Extract tool sequence n-grams
const toolNames = ['Read', 'Edit', 'Bash'];
const bigrams = extractNgrams(toolNames, 2); // ['Read->Edit', 'Edit->Bash']
const trigrams = extractNgrams(toolNames, 3); // ['Read->Edit->Bash']

// Classify Bash commands
const category = classifyBashCommand('git commit -m "fix"'); // 'git'

// Aggregate patterns across sessions
const aggregator = new PatternAggregator();
const processor = createPatternSessionProcessor(aggregator);
// Use processor with CorpusScanner...
const results = aggregator.getResults(); // { patterns, projectSlugs }
```

### Ranking & Drafting

```typescript
import { rankCandidates, generateSkillDraft, selectCandidates } from 'gsd-skill-creator';

// Rank candidates from aggregated patterns
const ranked = rankCandidates(patterns, {
  totalSessions: 100,
  existingSkills: [{ name: 'git-commit', description: '...' }],
});

// Interactive selection
const selected = await selectCandidates(ranked);

// Generate draft SKILL.md for each selected candidate
for (const candidate of selected) {
  const draft = generateSkillDraft(candidate);
  console.log(draft); // Full SKILL.md content with frontmatter
}
```

### Semantic Clustering

```typescript
import {
  dbscan, tuneEpsilon, clusterPrompts,
  PromptEmbeddingCache, rankClusterCandidates, generateClusterDraft,
} from 'gsd-skill-creator';

// Low-level DBSCAN
const points = [[0.1, 0.2], [0.15, 0.25], [0.9, 0.8]];
const result = dbscan(points, { epsilon: 0.3, minPoints: 2, distanceFn: cosineDistance });

// Auto-tune epsilon
const epsilon = tuneEpsilon(embeddings, { minEpsilon: 0.05, maxEpsilon: 0.5 });

// Full clustering pipeline
const clusters = await clusterPrompts(collectedPrompts, {
  embeddingCache: new PromptEmbeddingCache('/path/to/cache'),
});

// Rank and draft cluster candidates
const clusterCandidates = rankClusterCandidates(clusters, { totalSessions: 100 });
for (const candidate of clusterCandidates) {
  const draft = generateClusterDraft(candidate);
}
```

### Discovery Types

Key types exported from the discovery module:

| Type | Description |
|------|-------------|
| `ParsedEntry` | Union of all parsed JSONL entry types |
| `ScanState` | Persisted scan state (watermarks, stats) |
| `SessionWatermark` | Per-session scan tracking data |
| `ScanResult` | Result of a corpus scan operation |
| `BashCategory` | Bash command category union type |
| `PatternOccurrence` | Aggregated pattern with frequency data |
| `RankedCandidate` | Scored and ranked pattern candidate |
| `ScoreBreakdown` | Per-factor scoring details |
| `PatternEvidence` | Evidence supporting a candidate |
| `CollectedPrompt` | User prompt collected during scanning |
| `DbscanResult` | DBSCAN clustering output |
| `PromptCluster` | Cluster of semantically similar prompts |
| `ClusterCandidate` | Scored cluster candidate |

### See Also

- [CLI Reference](./CLI.md) - `discover` command documentation
- [Architecture: Discovery Layer](./architecture/layers.md#discovery) - Module internals

---

## See Also

- [CLI Reference](./CLI.md) - Command-line interface documentation
- [Official Format](./OFFICIAL-FORMAT.md) - Skill format specification
- [Extensions](./EXTENSIONS.md) - Extended frontmatter fields
- [GSD Teams Guide](./GSD-TEAMS.md) - Agent teams conversion guide

---

*API Reference for gsd-skill-creator*
