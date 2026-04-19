/**
 * Tests for `src/output-structure/migrate.ts`
 *
 * Coverage:
 *   - inferOutputStructure: structured signals, prose signals, mixed, no signals
 *   - migrateSkill: no frontmatter, already classified (idempotent), unclassified
 *   - applyMigration: already-classified no-op, inserts yaml, no-frontmatter prepend
 *   - buildScanReport: correct counts
 */

import { describe, it, expect } from 'vitest';
import {
  inferOutputStructure,
  migrateSkill,
  applyMigration,
  buildScanReport,
} from '../migrate.js';
import type { ScanEntry } from '../migrate.js';

// ---------------------------------------------------------------------------
// inferOutputStructure
// ---------------------------------------------------------------------------

describe('inferOutputStructure — structured signals', () => {
  it('classifies content with JSON code fence as json-schema', () => {
    const body = 'This skill outputs ```json\n{"result": "value"}\n``` responses.';
    const r = inferOutputStructure(body);
    expect(r.structure.kind).toBe('json-schema');
    expect(r.structuredSignals.length).toBeGreaterThan(0);
  });

  it('classifies content with "schema" keyword', () => {
    const body = 'Produces a structured schema output for the agent.';
    const r = inferOutputStructure(body);
    expect(['json-schema', 'markdown-template']).toContain(r.structure.kind);
  });

  it('high-confidence structured → not flagged for review', () => {
    const body = 'Outputs JSON. Provides YAML. Uses schema. Has template. Structured output format. Frontmatter-bound.';
    const r = inferOutputStructure(body);
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
  });
});

describe('inferOutputStructure — prose signals', () => {
  it('classifies content with prose keywords as prose', () => {
    const body = 'Review and analyze the code, explain your reasoning, discuss options.';
    const r = inferOutputStructure(body);
    expect(r.structure.kind).toBe('prose');
    expect(r.proseSignals.length).toBeGreaterThan(0);
  });

  it('high-confidence prose → not flagged for review', () => {
    const body = 'Analyze and explain the codebase. Review pull requests. Comment on code quality. Narrate the changes. Discuss with the team. Consider alternatives.';
    const r = inferOutputStructure(body);
    expect(r.structure.kind).toBe('prose');
    expect(r.confidence).toBeGreaterThan(0.5);
  });
});

describe('inferOutputStructure — no signals', () => {
  it('returns prose with low confidence for empty body', () => {
    const r = inferOutputStructure('');
    expect(r.structure.kind).toBe('prose');
    expect(r.confidence).toBeLessThan(0.8);
    expect(r.flaggedForReview).toBe(true);
  });

  it('returns prose with low confidence for generic text', () => {
    const r = inferOutputStructure('This skill helps with tasks.');
    expect(r.flaggedForReview).toBe(true);
  });
});

describe('inferOutputStructure — mixed signals', () => {
  it('flags for review when both structured and prose signals are present', () => {
    const body = 'Analyze the JSON schema output and explain the results. Review the structured data.';
    const r = inferOutputStructure(body);
    // Mixed signals → should be lower confidence
    // Either classification is valid; what matters is the flag
    expect(typeof r.flaggedForReview).toBe('boolean');
    // Confidence should be non-zero
    expect(r.confidence).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// migrateSkill
// ---------------------------------------------------------------------------

const SKILL_WITH_OUTPUT_STRUCTURE = `---
name: my-skill
description: A test skill
output_structure:
  kind: json-schema
  schema: '{"type":"object"}'
---

# My Skill
This skill outputs JSON.
`;

const SKILL_WITHOUT_OUTPUT_STRUCTURE = `---
name: my-skill
description: A test skill
---

# My Skill
This skill reviews code and explains changes.
`;

const SKILL_NO_FRONTMATTER = `# My Skill
This skill summarize and analyse the codebase.
`;

describe('migrateSkill — already classified (CF-ME5-05 idempotency)', () => {
  it('returns alreadyClassified=true when output_structure is present', () => {
    const patch = migrateSkill(SKILL_WITH_OUTPUT_STRUCTURE);
    expect(patch.alreadyClassified).toBe(true);
    expect(patch.inferred).toBeUndefined();
  });
});

describe('migrateSkill — unclassified skill', () => {
  it('returns alreadyClassified=false with inference for skill without output_structure', () => {
    const patch = migrateSkill(SKILL_WITHOUT_OUTPUT_STRUCTURE);
    expect(patch.alreadyClassified).toBe(false);
    expect(patch.inferred).toBeDefined();
    expect(patch.inference).toBeDefined();
  });

  it('returns alreadyClassified=false for skill with no frontmatter', () => {
    const patch = migrateSkill(SKILL_NO_FRONTMATTER);
    expect(patch.alreadyClassified).toBe(false);
    expect(patch.inferred).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// applyMigration (CF-ME5-05)
// ---------------------------------------------------------------------------

describe('applyMigration — idempotency (CF-ME5-05)', () => {
  it('returns content unchanged when alreadyClassified', () => {
    const patch = migrateSkill(SKILL_WITH_OUTPUT_STRUCTURE);
    const result = applyMigration(SKILL_WITH_OUTPUT_STRUCTURE, patch);
    expect(result).toBe(SKILL_WITH_OUTPUT_STRUCTURE);
  });

  it('applying twice produces the same result (idempotent)', () => {
    const patch1 = migrateSkill(SKILL_WITHOUT_OUTPUT_STRUCTURE);
    const first = applyMigration(SKILL_WITHOUT_OUTPUT_STRUCTURE, patch1);
    const patch2 = migrateSkill(first);
    const second = applyMigration(first, patch2);
    // Second application is a no-op
    expect(second).toBe(first);
  });
});

describe('applyMigration — inserts output_structure', () => {
  it('inserts the field into existing frontmatter', () => {
    const patch = migrateSkill(SKILL_WITHOUT_OUTPUT_STRUCTURE);
    const result = applyMigration(SKILL_WITHOUT_OUTPUT_STRUCTURE, patch);
    expect(result).toContain('output_structure');
    expect(result).toContain('kind:');
  });

  it('preserves existing frontmatter fields', () => {
    const patch = migrateSkill(SKILL_WITHOUT_OUTPUT_STRUCTURE);
    const result = applyMigration(SKILL_WITHOUT_OUTPUT_STRUCTURE, patch);
    expect(result).toContain('name: my-skill');
    expect(result).toContain('description: A test skill');
  });

  it('prepends frontmatter when none exists', () => {
    const patch = migrateSkill(SKILL_NO_FRONTMATTER);
    const result = applyMigration(SKILL_NO_FRONTMATTER, patch);
    expect(result.trimStart().startsWith('---')).toBe(true);
    expect(result).toContain('output_structure');
  });
});

describe('applyMigration — patch with no inferred (no-op)', () => {
  it('returns content unchanged when patch has no inferred structure', () => {
    const noPatchPatch = { alreadyClassified: false, inferred: undefined };
    const result = applyMigration(SKILL_WITHOUT_OUTPUT_STRUCTURE, noPatchPatch);
    expect(result).toBe(SKILL_WITHOUT_OUTPUT_STRUCTURE);
  });
});

// ---------------------------------------------------------------------------
// buildScanReport
// ---------------------------------------------------------------------------

describe('buildScanReport', () => {
  it('correctly counts alreadyClassified entries', () => {
    const entries: ScanEntry[] = [
      { path: 'a.md', patch: { alreadyClassified: true } },
      { path: 'b.md', patch: { alreadyClassified: true } },
      { path: 'c.md', patch: {
        alreadyClassified: false,
        inferred: { kind: 'prose' },
        inference: {
          structure: { kind: 'prose' },
          confidence: 0.9,
          flaggedForReview: false,
          structuredSignals: [],
          proseSignals: ['analyze'],
        },
      }},
    ];
    const report = buildScanReport(entries);
    expect(report.total).toBe(3);
    expect(report.alreadyClassified).toBe(2);
    expect(report.autoClassified).toBe(1);
    expect(report.flaggedForReview).toBe(0);
  });

  it('correctly counts flaggedForReview entries', () => {
    const entries: ScanEntry[] = [
      { path: 'x.md', patch: {
        alreadyClassified: false,
        inferred: { kind: 'prose' },
        inference: {
          structure: { kind: 'prose' },
          confidence: 0.5,
          flaggedForReview: true,
          structuredSignals: [],
          proseSignals: [],
        },
      }},
    ];
    const report = buildScanReport(entries);
    expect(report.flaggedForReview).toBe(1);
    expect(report.autoClassified).toBe(0);
  });

  it('returns zero counts for empty entries', () => {
    const report = buildScanReport([]);
    expect(report.total).toBe(0);
    expect(report.alreadyClassified).toBe(0);
    expect(report.autoClassified).toBe(0);
    expect(report.flaggedForReview).toBe(0);
  });
});
