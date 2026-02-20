/**
 * Tests for .skillmeta YAML parser with Zod validation.
 *
 * Validates parseSkillmeta() parses YAML strings and validates against
 * KnowledgePackSchema. Validates parseSkillmetaFile() reads from disk.
 * Tests cover valid minimal, valid full, and various invalid inputs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs/promises before importing module under test
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

// Will import after implementation exists
// import { parseSkillmeta, parseSkillmetaFile } from '../skillmeta-parser.js';
// import { readFile } from 'node:fs/promises';

// ============================================================================
// Helpers
// ============================================================================

/** Minimal valid .skillmeta YAML with only required fields. */
const MINIMAL_SKILLMETA_YAML = `
pack_id: TEST-001
pack_name: "Test Pack"
version: "1.0.0"
status: alpha
classification: core_academic
description: "A test knowledge pack for validation."
contributors:
  - name: "Test Author"
    role: author
copyright: "CC-BY-SA-4.0"
tags:
  - test
  - validation
gsd_integration:
  dashboard_display:
    icon: "test-icon"
    color: "#FF0000"
    position: "Featured"
grade_levels:
  - label: Foundation
    grades: ["PreK", "K"]
    estimated_hours: [10, 20]
`;

/** Full MATH-101 style .skillmeta YAML with all fields. */
const FULL_SKILLMETA_YAML = `
pack_id: MATH-101
pack_name: "Mathematics — Foundational Knowledge Pack"
version: "1.0.0"
release_date: "2026-02-18"
status: alpha
classification: core_academic
learning_domain: quantitative_reasoning
description: |
  Mathematics as a way of thinking: pattern recognition, precise reasoning,
  and building complexity from simple rules.
short_description: "Pattern, precision, and mathematical thinking across K-College"
contributors:
  - name: "GSD Foundation"
    role: architect
  - name: "Mathematics Education Working Group"
    role: content_creators
copyright: "Creative Commons Attribution-ShareAlike 4.0 (CC-BY-SA-4.0)"
maintained_by: GSD-Foundational-Knowledge
dependencies: []
prerequisite_packs: []
recommended_prior_knowledge: []
enables:
  - PHYS-101
  - CODE-101
grade_levels:
  - label: Foundation
    grades: ["PreK", "K", "1", "2"]
    estimated_hours: [40, 60]
  - label: Elementary
    grades: ["3", "4", "5"]
    estimated_hours: [60, 80]
modules:
  - id: MATH-101-M1
    name: "Number & Operations"
    description: "Foundational number sense and operations"
    learning_outcomes:
      - "Recognize and describe numerical patterns"
    topics:
      - "Counting"
      - "Addition"
    grade_levels: ["K", "1", "2"]
    time_estimates:
      foundation: 40
    prerequisite_modules: []
learning_outcomes:
  - code: LO-NUM-001
    description: "Recognize and describe numerical patterns"
    levels: ["K", "1", "2"]
assessment_methods:
  - type: formative
    name: "Mathematical Discourse"
    frequency: ongoing
tools_required: []
tools_optional:
  - name: graphing_calculator
    url: "https://www.desmos.com"
interactive_elements:
  - type: manipulative
    name: "Blocks & Counters"
translations:
  available:
    - language_code: en
      name: English
      complete: true
  planned: ["fr", "zh"]
accessibility:
  screen_reader_compatible: true
  large_text_available: true
standards_alignment:
  - framework: "Common Core State Standards (Math)"
    version: 2010
    alignments:
      K.CC: "Counting & Cardinality"
difficulty:
  conceptual_demand: high
  technical_demand: low
content_flags:
  - flag: anxiety_potential
    description: "Some learners have math anxiety."
    mitigation: "Focus on understanding, not speed."
community:
  discussion_forum: "https://community.gsd.edu/math-101"
maintenance:
  review_frequency: quarterly
metrics:
  active_learners: 0
tags:
  - mathematics
  - stem
resources:
  - type: textbook
    title: "How Children Learn Mathematics"
    author: "David Thornton"
related_packs:
  - id: PHYS-101
    relationship: "Mathematical modeling underlies physics"
gsd_integration:
  dashboard_display:
    icon: "math-symbol"
    color: "#4A90E2"
    position: "Featured - Core"
  activity_scaffolding: true
  skill_creator_enabled: true
  adaptive_pacing: true
  cache_keys:
    - "MATH-101-core-concepts"
files:
  vision_document: "MATH-101-vision.md"
  modules_definition: "MATH-101-modules.yaml"
changelog:
  - version: "1.0.0"
    date: "2026-02-18"
    changes:
      - "Initial release"
qa:
  peer_reviewed: true
  tested_with_learners: false
`;

// ============================================================================
// parseSkillmeta
// ============================================================================

describe('parseSkillmeta', () => {
  // Dynamic import to handle module not existing yet
  let parseSkillmeta: (yaml: string) => Promise<{ success: boolean; data?: unknown; errors?: string[] }>;

  beforeEach(async () => {
    const mod = await import('../skillmeta-parser.js');
    parseSkillmeta = mod.parseSkillmeta;
  });

  it('parses valid minimal .skillmeta YAML', async () => {
    const result = await parseSkillmeta(MINIMAL_SKILLMETA_YAML);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      const data = result.data as Record<string, unknown>;
      expect(data.pack_id).toBe('TEST-001');
      expect(data.pack_name).toBe('Test Pack');
      expect(data.version).toBe('1.0.0');
      expect(data.status).toBe('alpha');
      expect(data.classification).toBe('core_academic');
    }
  });

  it('parses valid full MATH-101 .skillmeta YAML', async () => {
    const result = await parseSkillmeta(FULL_SKILLMETA_YAML);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.pack_id).toBe('MATH-101');
      expect(data.pack_name).toBe('Mathematics — Foundational Knowledge Pack');
      expect(data.version).toBe('1.0.0');
      expect(data.release_date).toBe('2026-02-18');
      expect(data.learning_domain).toBe('quantitative_reasoning');
      expect(data.enables).toEqual(['PHYS-101', 'CODE-101']);
      expect((data.contributors as unknown[]).length).toBe(2);
      expect((data.modules as unknown[]).length).toBe(1);
      expect((data.learning_outcomes as unknown[]).length).toBe(1);
      expect((data.tags as string[])).toContain('mathematics');
    }
  });

  it('returns failure for missing pack_id', async () => {
    const yaml = `
pack_name: "No ID Pack"
version: "1.0.0"
status: alpha
classification: core_academic
description: "Missing pack_id field."
contributors:
  - name: "Author"
    role: author
copyright: "CC-BY-SA-4.0"
tags: [test]
gsd_integration: {}
grade_levels:
  - label: Foundation
    grades: ["K"]
    estimated_hours: [10, 20]
`;
    const result = await parseSkillmeta(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      const joined = result.errors!.join(' ');
      expect(joined.toLowerCase()).toContain('pack_id');
    }
  });

  it('returns failure for bad status value', async () => {
    const yaml = `
pack_id: BAD-STATUS
pack_name: "Bad Status"
version: "1.0.0"
status: draft
classification: core_academic
description: "Invalid status value."
contributors:
  - name: "Author"
    role: author
copyright: "CC-BY-SA-4.0"
tags: [test]
gsd_integration: {}
grade_levels:
  - label: Foundation
    grades: ["K"]
    estimated_hours: [10, 20]
`;
    const result = await parseSkillmeta(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
      const joined = result.errors!.join(' ');
      expect(joined.toLowerCase()).toContain('status');
    }
  });

  it('returns failure for malformed YAML', async () => {
    const result = await parseSkillmeta('": invalid: yaml: ---"');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });

  it('returns failure when YAML is not an object', async () => {
    const result = await parseSkillmeta('"just a string"');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });

  it('produces human-readable error messages with field paths', async () => {
    const yaml = `
pack_name: "Missing required fields"
version: 123
status: invalid_status
`;
    const result = await parseSkillmeta(yaml);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Errors should mention field paths
      const joined = result.errors!.join('\n');
      expect(joined).toMatch(/pack_id/);
      expect(joined).toMatch(/status/);
    }
  });
});

// ============================================================================
// parseSkillmetaFile
// ============================================================================

describe('parseSkillmetaFile', () => {
  let parseSkillmetaFile: (path: string) => Promise<{ success: boolean; data?: unknown; errors?: string[] }>;
  let mockReadFile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const mod = await import('../skillmeta-parser.js');
    parseSkillmetaFile = mod.parseSkillmetaFile;
    const fs = await import('node:fs/promises');
    mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
    mockReadFile.mockReset();
  });

  it('reads and parses a valid file', async () => {
    mockReadFile.mockResolvedValue(MINIMAL_SKILLMETA_YAML);
    const result = await parseSkillmetaFile('/path/to/pack/.skillmeta');
    expect(result.success).toBe(true);
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/pack/.skillmeta', 'utf-8');
  });

  it('returns failure for file not found (ENOENT)', async () => {
    const err = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValue(err);

    const result = await parseSkillmetaFile('/missing/file.skillmeta');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
      const joined = result.errors!.join(' ');
      expect(joined).toContain('/missing/file.skillmeta');
    }
  });
});
