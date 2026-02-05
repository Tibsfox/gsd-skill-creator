# Extending gsd-skill-creator

This document explains how to extend gsd-skill-creator with custom validators, storage backends, and conflict detectors. It also documents all configurable thresholds and how to tune them.

## Who This Is For

This guide is for contributors who want to:

- Add custom validation rules
- Implement alternative storage backends
- Create new conflict detection strategies
- Tune activation thresholds for their use case

**Prerequisites:**

- TypeScript familiarity
- Understanding of the [codebase layers](./README.md) (if available)
- Familiarity with the skill format (see [OFFICIAL-FORMAT.md](../OFFICIAL-FORMAT.md))

## Extension Philosophy

gsd-skill-creator follows **composition over modification**:

- Extensions are separate files/modules
- Core functionality remains untouched
- Extensions integrate via well-defined interfaces
- All extensions should be testable in isolation

## Adding a New Validator

Validators check skill metadata and content for correctness. Here's a complete working example.

### Step 1: Create the Validator

```typescript
// src/validation/custom-trigger-validator.ts
import type { SkillMetadata } from 'gsd-skill-creator';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that skill descriptions contain activation-friendly language.
 *
 * Best practices for skill descriptions include:
 * - Using action verbs ("Generates", "Creates", "Analyzes")
 * - Including "when" triggers ("Use when...", "Activated when...")
 * - Avoiding vague language ("helper", "utility", "misc")
 */
export function validateActivationLanguage(
  metadata: SkillMetadata
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const description = metadata.description || '';

  // Check for activation trigger phrases
  const triggerPhrases = [
    /use when/i,
    /activated when/i,
    /triggers? when/i,
    /invoke when/i,
  ];

  const hasTriggerPhrase = triggerPhrases.some((pattern) =>
    pattern.test(description)
  );

  if (!hasTriggerPhrase) {
    warnings.push(
      'Description should include activation context (e.g., "Use when...")'
    );
  }

  // Check for action verbs at the start
  const actionVerbs = [
    'generates',
    'creates',
    'analyzes',
    'validates',
    'formats',
    'converts',
    'extracts',
    'transforms',
    'reviews',
    'checks',
  ];

  const startsWithAction = actionVerbs.some((verb) =>
    description.toLowerCase().startsWith(verb)
  );

  if (!startsWithAction) {
    warnings.push(
      'Consider starting description with an action verb (e.g., "Generates...")'
    );
  }

  // Check for vague terms
  const vagueTerms = ['helper', 'utility', 'misc', 'various', 'general'];
  const hasVagueTerm = vagueTerms.some((term) =>
    description.toLowerCase().includes(term)
  );

  if (hasVagueTerm) {
    warnings.push(
      'Description contains vague terms that reduce activation accuracy'
    );
  }

  // Check minimum description length
  if (description.length < 50) {
    errors.push('Description must be at least 50 characters for reliable activation');
  }

  // Check maximum description length
  if (description.length > 500) {
    warnings.push('Description over 500 characters may reduce activation precision');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

### Step 2: Integrate with Validation Chain

To add your validator to the skill creation workflow, modify the create command or add it as a separate validation step:

```typescript
// In your CLI command or workflow:
import { validateActivationLanguage } from './validation/custom-trigger-validator.js';
import type { SkillMetadata } from 'gsd-skill-creator';

async function validateSkillWithCustomRules(metadata: SkillMetadata): Promise<void> {
  // Run custom validation
  const result = validateActivationLanguage(metadata);

  // Log warnings
  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  // Throw on errors
  if (!result.valid) {
    throw new Error(`Validation failed: ${result.errors.join(', ')}`);
  }
}
```

### Step 3: Test the Validator

```typescript
// src/validation/__tests__/custom-trigger-validator.test.ts
import { describe, it, expect } from 'vitest';
import { validateActivationLanguage } from '../custom-trigger-validator.js';

describe('validateActivationLanguage', () => {
  it('passes for well-formed descriptions', () => {
    const result = validateActivationLanguage({
      name: 'my-skill',
      description:
        'Generates commit messages following conventional commit format. Use when the user asks to commit changes.',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('warns when missing trigger phrase', () => {
    const result = validateActivationLanguage({
      name: 'my-skill',
      description: 'Generates commit messages following conventional commit format.',
    });

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      'Description should include activation context (e.g., "Use when...")'
    );
  });

  it('fails for short descriptions', () => {
    const result = validateActivationLanguage({
      name: 'my-skill',
      description: 'A commit helper.',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Description must be at least 50 characters for reliable activation'
    );
  });
});
```

## Custom Storage Backend

The default storage uses the filesystem, but you can implement alternative backends for team sharing, cloud sync, or database storage.

### Storage Backend Interface

First, understand the interface contract that any storage backend must satisfy:

```typescript
// src/storage/storage-backend.ts
import type { Skill, SkillMetadata } from 'gsd-skill-creator';

/**
 * Interface for skill storage backends.
 *
 * Implementations must handle:
 * - Atomic writes (prevent partial saves)
 * - Concurrent access (serialize writes if needed)
 * - Missing skill handling (return null, not throw)
 */
export interface SkillStorageBackend {
  /**
   * Create a new skill.
   * @throws Error if skill already exists or validation fails
   */
  create(name: string, metadata: SkillMetadata, body: string): Promise<Skill>;

  /**
   * Read a skill by name.
   * @returns The skill or null if not found
   */
  read(name: string): Promise<Skill | null>;

  /**
   * Update an existing skill.
   * @throws Error if skill doesn't exist or validation fails
   */
  update(
    name: string,
    updates: Partial<SkillMetadata>,
    newBody?: string
  ): Promise<Skill>;

  /**
   * Delete a skill.
   * @returns true if deleted, false if not found
   */
  delete(name: string): Promise<boolean>;

  /**
   * List all skill names.
   */
  list(): Promise<string[]>;

  /**
   * Check if a skill exists.
   */
  exists(name: string): Promise<boolean>;
}
```

### Example: SQLite Storage Backend

Here's a complete example of a SQLite-backed storage implementation:

```typescript
// src/storage/sqlite-skill-store.ts
import Database from 'better-sqlite3';
import type { Skill, SkillMetadata } from 'gsd-skill-creator';
import { validateSkillMetadata } from 'gsd-skill-creator';
import type { SkillStorageBackend } from './storage-backend.js';

/**
 * SQLite-backed skill storage for team environments.
 *
 * Benefits:
 * - Transactional writes (atomic)
 * - Query capabilities (search, filter)
 * - Single file database (portable)
 * - Concurrent read access
 *
 * Trade-offs:
 * - Binary format (not git-friendly for diffs)
 * - Requires better-sqlite3 dependency
 */
export class SQLiteSkillStore implements SkillStorageBackend {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS skills (
        name TEXT PRIMARY KEY,
        metadata TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_skills_updated
        ON skills(updated_at DESC);
    `);
  }

  async create(
    name: string,
    metadata: SkillMetadata,
    body: string
  ): Promise<Skill> {
    // Validate metadata
    const errors = validateSkillMetadata(metadata);
    if (errors.length > 0) {
      throw new Error(`Invalid metadata: ${errors.join(', ')}`);
    }

    // Check doesn't exist
    if (await this.exists(name)) {
      throw new Error(`Skill "${name}" already exists`);
    }

    const now = new Date().toISOString();
    const fullMetadata: SkillMetadata = {
      ...metadata,
      name,
    };

    this.db
      .prepare(
        `INSERT INTO skills (name, metadata, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, JSON.stringify(fullMetadata), body, now, now);

    return {
      metadata: fullMetadata,
      body,
      path: `sqlite://${name}`,
    };
  }

  async read(name: string): Promise<Skill | null> {
    const row = this.db
      .prepare('SELECT metadata, body FROM skills WHERE name = ?')
      .get(name) as { metadata: string; body: string } | undefined;

    if (!row) {
      return null;
    }

    return {
      metadata: JSON.parse(row.metadata) as SkillMetadata,
      body: row.body,
      path: `sqlite://${name}`,
    };
  }

  async update(
    name: string,
    updates: Partial<SkillMetadata>,
    newBody?: string
  ): Promise<Skill> {
    const existing = await this.read(name);
    if (!existing) {
      throw new Error(`Skill "${name}" not found`);
    }

    const updatedMetadata: SkillMetadata = {
      ...existing.metadata,
      ...updates,
    };

    // Validate updated metadata
    const errors = validateSkillMetadata(updatedMetadata);
    if (errors.length > 0) {
      throw new Error(`Invalid metadata: ${errors.join(', ')}`);
    }

    const body = newBody ?? existing.body;
    const now = new Date().toISOString();

    this.db
      .prepare(
        `UPDATE skills SET metadata = ?, body = ?, updated_at = ?
         WHERE name = ?`
      )
      .run(JSON.stringify(updatedMetadata), body, now, name);

    return {
      metadata: updatedMetadata,
      body,
      path: `sqlite://${name}`,
    };
  }

  async delete(name: string): Promise<boolean> {
    const result = this.db
      .prepare('DELETE FROM skills WHERE name = ?')
      .run(name);

    return result.changes > 0;
  }

  async list(): Promise<string[]> {
    const rows = this.db
      .prepare('SELECT name FROM skills ORDER BY name')
      .all() as { name: string }[];

    return rows.map((r) => r.name);
  }

  async exists(name: string): Promise<boolean> {
    const row = this.db
      .prepare('SELECT 1 FROM skills WHERE name = ? LIMIT 1')
      .get(name);

    return row !== undefined;
  }

  /**
   * Search skills by name or description.
   * SQLite-specific extension method.
   */
  async search(query: string): Promise<Skill[]> {
    const rows = this.db
      .prepare(
        `SELECT metadata, body FROM skills
         WHERE name LIKE ? OR metadata LIKE ?
         ORDER BY updated_at DESC`
      )
      .all(`%${query}%`, `%${query}%`) as { metadata: string; body: string }[];

    return rows.map((row) => ({
      metadata: JSON.parse(row.metadata) as SkillMetadata,
      body: row.body,
      path: `sqlite://search`,
    }));
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}
```

### When Custom Storage Makes Sense

| Use Case | Recommended Backend |
|----------|---------------------|
| Single developer | Filesystem (default) |
| Team sharing | SQLite or PostgreSQL |
| Cloud sync | S3 + DynamoDB or Firebase |
| Version control | Filesystem (git-friendly) |
| High concurrency | PostgreSQL or Redis |

## Adding a New Conflict Detector

Conflict detectors identify skills with overlapping functionality. Here's how to create a custom detector.

### Conflict Detector Interface

```typescript
// src/conflicts/conflict-detector-interface.ts
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingSkill: string | null;
  similarity: number;
  severity: 'low' | 'medium' | 'high';
  reason?: string;
}

export interface ConflictDetectorConfig {
  threshold: number;
  highSeverityThreshold?: number;
}
```

### Example: Keyword-Based Conflict Detector

This detector uses keyword overlap instead of embeddings, useful when you want faster detection without ML dependencies:

```typescript
// src/conflicts/keyword-conflict-detector.ts
import type { Skill } from 'gsd-skill-creator';

export interface KeywordConflictResult {
  hasConflict: boolean;
  skillA: string;
  skillB: string;
  overlapScore: number;
  sharedKeywords: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Detects conflicts using keyword overlap analysis.
 *
 * Faster than embedding-based detection but less accurate for
 * semantic similarity. Best for quick checks or when embeddings
 * are unavailable.
 */
export class KeywordConflictDetector {
  private threshold: number;
  private stopWords: Set<string>;

  constructor(config: { threshold?: number } = {}) {
    this.threshold = config.threshold ?? 0.5; // 50% keyword overlap
    this.stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
      'and', 'but', 'or', 'if', 'when', 'where', 'what', 'which', 'who',
      'this', 'that', 'these', 'those', 'it', 'its', 'use', 'using',
    ]);
  }

  /**
   * Extract meaningful keywords from text.
   */
  private extractKeywords(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !this.stopWords.has(word));

    return new Set(words);
  }

  /**
   * Calculate Jaccard similarity between two keyword sets.
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * Detect conflicts among a set of skills.
   */
  async detect(skills: Skill[]): Promise<KeywordConflictResult[]> {
    const results: KeywordConflictResult[] = [];

    // Extract keywords for all skills
    const skillKeywords = skills.map((skill) => ({
      name: skill.metadata.name,
      keywords: this.extractKeywords(skill.metadata.description || ''),
    }));

    // Pairwise comparison
    for (let i = 0; i < skillKeywords.length; i++) {
      for (let j = i + 1; j < skillKeywords.length; j++) {
        const a = skillKeywords[i];
        const b = skillKeywords[j];

        const overlapScore = this.jaccardSimilarity(a.keywords, b.keywords);

        if (overlapScore >= this.threshold) {
          const sharedKeywords = [...a.keywords].filter((k) => b.keywords.has(k));

          results.push({
            hasConflict: true,
            skillA: a.name,
            skillB: b.name,
            overlapScore,
            sharedKeywords,
            severity:
              overlapScore >= 0.8 ? 'high' : overlapScore >= 0.6 ? 'medium' : 'low',
          });
        }
      }
    }

    // Sort by overlap score descending
    results.sort((a, b) => b.overlapScore - a.overlapScore);

    return results;
  }
}
```

### Example: Embedding-Based Custom Detector

For more accurate semantic detection using the built-in embedding service:

```typescript
// src/conflicts/custom-embedding-detector.ts
import {
  getEmbeddingService,
  cosineSimilarity,
  type EmbeddingResult,
} from 'gsd-skill-creator';

export interface SemanticConflictResult {
  skillA: string;
  skillB: string;
  similarity: number;
  severity: 'high' | 'medium';
  descriptionA: string;
  descriptionB: string;
}

/**
 * Custom conflict detector with configurable thresholds.
 *
 * Uses the same embedding service as the built-in detector
 * but allows custom threshold configuration and filtering.
 */
export class CustomEmbeddingDetector {
  private conflictThreshold: number;
  private highSeverityThreshold: number;

  constructor(config: {
    conflictThreshold?: number;
    highSeverityThreshold?: number;
  } = {}) {
    this.conflictThreshold = config.conflictThreshold ?? 0.85;
    this.highSeverityThreshold = config.highSeverityThreshold ?? 0.90;
  }

  async detectConflicts(
    skills: Array<{ name: string; description: string }>
  ): Promise<SemanticConflictResult[]> {
    if (skills.length < 2) {
      return [];
    }

    // Get embedding service
    const embeddingService = await getEmbeddingService();

    // Batch embed all descriptions
    const descriptions = skills.map((s) => s.description);
    const skillNames = skills.map((s) => s.name);
    const embeddings: EmbeddingResult[] = await embeddingService.embedBatch(
      descriptions,
      skillNames
    );

    const results: SemanticConflictResult[] = [];

    // Pairwise comparison
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const similarity = cosineSimilarity(
          embeddings[i].embedding,
          embeddings[j].embedding
        );

        if (similarity >= this.conflictThreshold) {
          results.push({
            skillA: skills[i].name,
            skillB: skills[j].name,
            similarity,
            severity: similarity >= this.highSeverityThreshold ? 'high' : 'medium',
            descriptionA: skills[i].description,
            descriptionB: skills[j].description,
          });
        }
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return results;
  }
}
```

## Key Thresholds and Tuning

gsd-skill-creator uses several configurable thresholds. Understanding these helps you tune behavior for your use case.

### Conflict Detection Threshold

| Property | Value |
|----------|-------|
| **Default** | 0.85 |
| **Location** | [src/conflicts/conflict-detector.ts](../../src/conflicts/conflict-detector.ts) |
| **CLI Flag** | `--threshold=<n>` |
| **Range** | 0.5 to 0.95 |

**What it means:** Minimum cosine similarity between skill descriptions to flag as a potential conflict.

**Impact of changing:**

| Direction | Effect |
|-----------|--------|
| Lower (e.g., 0.80) | More conflicts detected (higher recall, more false positives) |
| Higher (e.g., 0.90) | Fewer conflicts detected (higher precision, may miss real conflicts) |

**Tuning guidance:**

- **Strict projects** (few skills, high overlap risk): Lower to 0.80
- **Diverse skill sets** (many distinct skills): Raise to 0.88-0.90
- **Default (0.85)** works well for most projects

**How to change:**

```bash
# CLI
skill-creator detect-conflicts --threshold=0.80

# Programmatic
import { ConflictDetector } from 'gsd-skill-creator';
const detector = new ConflictDetector({ threshold: 0.80 });
```

### High Severity Threshold

| Property | Value |
|----------|-------|
| **Default** | 0.90 |
| **Location** | [src/conflicts/conflict-detector.ts](../../src/conflicts/conflict-detector.ts) |
| **Purpose** | Distinguishes "high" from "medium" severity |

**What it means:** Similarity above this threshold indicates near-duplicate skills that almost certainly conflict.

**Tuning guidance:** Rarely needs adjustment. 0.90 is an industry standard for near-duplicates.

### Activation Threshold

| Property | Value |
|----------|-------|
| **Default** | 0.75 |
| **Location** | [src/simulation/](../../src/simulation/), CLI commands |
| **CLI Flag** | `--threshold=<n>` |
| **Calibration** | `skill-creator calibrate` |

**What it means:** Minimum similarity between a prompt and skill description for the simulator to predict activation.

**Impact of changing:**

| Direction | Effect |
|-----------|--------|
| Lower (e.g., 0.70) | More skills predicted to activate (higher recall, lower precision) |
| Higher (e.g., 0.80) | Fewer skills predicted (higher precision, lower recall) |

**Tuning guidance:**

1. **Use calibration** for data-driven optimization (see [Calibration Workflow](#calibration-workflow))
2. **Lower for broad skills** that should activate often
3. **Raise for specific skills** that should only activate for exact matches

**How to change:**

```bash
# CLI - per-command
skill-creator simulate "my prompt" --threshold=0.70
skill-creator test run --all --threshold=0.80

# Calibration - data-driven
skill-creator calibrate
```

### Confidence Categories

| Level | Similarity Range | Location |
|-------|------------------|----------|
| **High** | 85%+ | [src/simulation/confidence-categorizer.ts](../../src/simulation/confidence-categorizer.ts) |
| **Medium** | 70-84% | |
| **Low** | 50-69% | |
| **None** | Below 50% | |

**What these mean:** Display categories for human interpretation. They don't affect activation decisions.

**Customizing categories:**

```typescript
import { categorizeConfidence, type ConfidenceThresholds } from 'gsd-skill-creator';

const customThresholds: ConfidenceThresholds = {
  high: 0.90,    // More stringent "high" threshold
  medium: 0.75,  // Raise medium floor
  low: 0.50,     // Keep low threshold
};

const level = categorizeConfidence(0.82, customThresholds); // 'medium'
```

### Calibration Minimum Events

| Property | Value |
|----------|-------|
| **Default** | 75 events |
| **Location** | Calibration logic |
| **Purpose** | Minimum data for statistically meaningful calibration |

**Why 75?** This provides enough data points for reliable F1 score calculation while being achievable within a few days of normal usage.

## Calibration Workflow

The calibration workflow optimizes the activation threshold based on real usage data.

### How It Works

1. **Event Recording**: During normal use, the system records activation predictions and actual outcomes
2. **Data Accumulation**: Wait for 75+ events with known outcomes
3. **Threshold Search**: Calibration finds the threshold that maximizes F1 score
4. **Review and Apply**: Preview changes, then apply if improvement is significant

### Running Calibration

```bash
# Step 1: Check if you have enough data
skill-creator calibrate --preview
# Output: "Insufficient data: 42/75 events. Continue using skills to accumulate more."

# Step 2: Once you have enough data, preview the calibration
skill-creator calibrate --preview
# Output:
# Current threshold: 0.75 (F1: 82.3%)
# Optimal threshold: 0.72 (F1: 87.1%)
# Improvement: +4.8%

# Step 3: Apply the calibration
skill-creator calibrate

# Step 4: Verify improvement
skill-creator benchmark
```

### Programmatic Calibration

```typescript
import { CalibrationStore, ThresholdHistory } from 'gsd-skill-creator';

async function runCalibration(): Promise<void> {
  const store = new CalibrationStore();
  const history = new ThresholdHistory();

  // Get events with known outcomes
  const events = await store.getKnownOutcomes();

  if (events.length < 75) {
    console.log(`Need ${75 - events.length} more events for calibration`);
    return;
  }

  // Calculate optimal threshold (simplified)
  // Real implementation uses F1 score optimization
  const optimal = findOptimalThreshold(events);

  // Save to history
  await history.save({
    globalThreshold: optimal.threshold,
    skillOverrides: {},
    f1Score: optimal.f1Score,
    dataPointsUsed: events.length,
    reason: 'calibration',
  });

  console.log(`Applied threshold ${optimal.threshold} (F1: ${optimal.f1Score})`);
}

function findOptimalThreshold(events: CalibrationEvent[]): {
  threshold: number;
  f1Score: number;
} {
  // Sweep thresholds from 0.5 to 0.95
  let bestThreshold = 0.75;
  let bestF1 = 0;

  for (let t = 0.5; t <= 0.95; t += 0.01) {
    const f1 = calculateF1(events, t);
    if (f1 > bestF1) {
      bestF1 = f1;
      bestThreshold = t;
    }
  }

  return { threshold: bestThreshold, f1Score: bestF1 };
}
```

### Rollback

If a calibration makes things worse:

```bash
# Undo the last calibration
skill-creator calibrate rollback

# View history
skill-creator calibrate history
```

For full calibration command details, see [CLI.md](../CLI.md#calibrate).

## Best Practices

### General Extension Guidelines

1. **Keep extensions in separate files** - Don't modify core modules
2. **Follow existing type patterns** - Use the same interfaces and types
3. **Write tests for new functionality** - Maintain test coverage
4. **Document threshold choices** - Explain why you chose specific values
5. **Consider backward compatibility** - Don't break existing behavior

### Validator Best Practices

- Return warnings for suggestions, errors for blockers
- Keep validation fast (< 100ms)
- Test edge cases (empty strings, very long strings, unicode)
- Provide actionable error messages

### Storage Backend Best Practices

- Implement atomic writes to prevent corruption
- Handle concurrent access (use write queues or transactions)
- Return null for missing items, throw for actual errors
- Add backend-specific methods as extensions, not interface changes

### Conflict Detector Best Practices

- Sort results by similarity descending
- Include enough context for manual review
- Consider offering resolution suggestions
- Test with diverse skill sets

## See Also

- [OFFICIAL-FORMAT.md](../OFFICIAL-FORMAT.md) - Skill and agent format specification
- [CLI.md](../CLI.md) - Command reference
- [storage.md](./storage.md) - Storage architecture documentation
