/**
 * Tests for pack content validator.
 *
 * Verifies that validatePackContent checks file existence, runs schema
 * validation on each file present, and produces a structured
 * PackValidationReport with per-file status, overall pass/fail, and
 * error details.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validatePackContent,
  type PackValidationReport,
  type FileValidationStatus,
} from '../content-validator.js';

// ============================================================================
// Helpers
// ============================================================================

/** Minimal valid .skillmeta YAML content. */
const VALID_SKILLMETA = `
pack_id: TEST-101
pack_name: Test Pack
version: "1.0.0"
status: alpha
classification: core_academic
description: A test knowledge pack
contributors:
  - name: Tester
    role: author
copyright: "2026 Test"
grade_levels:
  - label: Elementary
    grades: ["3", "4", "5"]
    estimated_hours: [10, 20]
tags: [test, demo]
gsd_integration:
  activity_scaffolding: false
`.trim();

/** Valid vision markdown. */
const VALID_VISION = `# Test Vision

## Vision

A great test vision.

## Core Concepts

Concepts here.
`;

/** Valid modules YAML content. */
const VALID_MODULES = `
pack_id: TEST-101
pack_name: Test Pack
modules:
  - id: mod-1
    name: Module 1
    description: First module
    learning_outcomes: [LO-1]
    topics: [topic-a]
    grade_levels: ["3", "4"]
    time_estimates:
      elementary: 5
    prerequisite_modules: []
`.trim();

/** Valid activities JSON content. */
const VALID_ACTIVITIES = JSON.stringify([
  {
    id: 'act-1',
    name: 'Activity 1',
    module_id: 'mod-1',
    grade_range: ['3', '4'],
    duration_minutes: 30,
    description: 'A test activity',
    materials: ['pencil'],
    learning_objectives: ['LO-1'],
  },
]);

/** Valid assessment markdown. */
const VALID_ASSESSMENT = `# Assessment

## Beginning

Needs help.

## Proficient

Can do it.
`;

/** Valid resources markdown. */
const VALID_RESOURCES = `# Resources

## Textbooks

[Math Book](https://example.com) A good book.
`;

/** .skillmeta missing pack_id (invalid). */
const INVALID_SKILLMETA = `
pack_name: Missing ID Pack
version: "1.0.0"
status: alpha
classification: core_academic
description: Missing pack_id
contributors:
  - name: Tester
    role: author
copyright: "2026 Test"
grade_levels: []
tags: []
gsd_integration: {}
`.trim();

/** Invalid activities JSON. */
const INVALID_ACTIVITIES = 'not json at all {{{';

/** Invalid modules YAML (missing required pack_id). */
const INVALID_MODULES = `
pack_name: Bad Modules
modules: []
`.trim();

// ============================================================================
// Tests
// ============================================================================

describe('validatePackContent', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'content-validator-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('validates a complete pack with all 6 files', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);
    await writeFile(join(testDir, 'TEST-101-vision.md'), VALID_VISION);
    await writeFile(join(testDir, 'TEST-101-modules.yaml'), VALID_MODULES);
    await writeFile(join(testDir, 'TEST-101-activities.json'), VALID_ACTIVITIES);
    await writeFile(join(testDir, 'TEST-101-assessment.md'), VALID_ASSESSMENT);
    await writeFile(join(testDir, 'TEST-101-resources.md'), VALID_RESOURCES);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(true);
    expect(report.packId).toBe('TEST-101');
    expect(report.directory).toBe(testDir);
    expect(report.errors).toHaveLength(0);

    // All 6 files should have status entries
    expect(report.fileStatuses.length).toBeGreaterThanOrEqual(6);

    // Every existing file should be valid
    for (const status of report.fileStatuses) {
      if (status.exists) {
        expect(status.valid).toBe(true);
      }
    }
  });

  it('validates a minimal pack with only .skillmeta', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(true);
    expect(report.packId).toBe('TEST-101');
    expect(report.errors).toHaveLength(0);

    // .skillmeta should exist and be valid
    const metaStatus = report.fileStatuses.find((s) => s.file === '.skillmeta');
    expect(metaStatus).toBeDefined();
    expect(metaStatus!.exists).toBe(true);
    expect(metaStatus!.valid).toBe(true);

    // Optional files should show exists: false, valid: null
    const optionals = report.fileStatuses.filter((s) => s.file !== '.skillmeta');
    for (const opt of optionals) {
      if (!opt.exists) {
        expect(opt.valid).toBeNull();
      }
    }
  });

  it('reports failure when .skillmeta is missing', async () => {
    await writeFile(join(testDir, 'TEST-101-vision.md'), VALID_VISION);
    await writeFile(join(testDir, 'TEST-101-modules.yaml'), VALID_MODULES);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);
    expect(report.packId).toBeNull();
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors.some((e) => e.includes('.skillmeta'))).toBe(true);

    const metaStatus = report.fileStatuses.find((s) => s.file === '.skillmeta');
    expect(metaStatus).toBeDefined();
    expect(metaStatus!.exists).toBe(false);
    expect(metaStatus!.valid).toBeNull();
  });

  it('reports failure when .skillmeta has invalid schema', async () => {
    await writeFile(join(testDir, '.skillmeta'), INVALID_SKILLMETA);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);

    const metaStatus = report.fileStatuses.find((s) => s.file === '.skillmeta');
    expect(metaStatus).toBeDefined();
    expect(metaStatus!.exists).toBe(true);
    expect(metaStatus!.valid).toBe(false);
    expect(metaStatus!.errors.length).toBeGreaterThan(0);
  });

  it('reports failure when modules.yaml fails schema validation', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);
    await writeFile(join(testDir, 'TEST-101-modules.yaml'), INVALID_MODULES);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);

    const modulesStatus = report.fileStatuses.find((s) =>
      s.file.endsWith('-modules.yaml'),
    );
    expect(modulesStatus).toBeDefined();
    expect(modulesStatus!.exists).toBe(true);
    expect(modulesStatus!.valid).toBe(false);
    expect(modulesStatus!.errors.length).toBeGreaterThan(0);
  });

  it('reports failure when activities.json has malformed JSON', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);
    await writeFile(join(testDir, 'TEST-101-activities.json'), INVALID_ACTIVITIES);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);

    const actStatus = report.fileStatuses.find((s) =>
      s.file.endsWith('-activities.json'),
    );
    expect(actStatus).toBeDefined();
    expect(actStatus!.exists).toBe(true);
    expect(actStatus!.valid).toBe(false);
    expect(actStatus!.errors.length).toBeGreaterThan(0);
  });

  it('reports mixed validity (some files valid, some invalid)', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);
    await writeFile(join(testDir, 'TEST-101-vision.md'), VALID_VISION);
    await writeFile(join(testDir, 'TEST-101-activities.json'), INVALID_ACTIVITIES);

    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);

    const metaStatus = report.fileStatuses.find((s) => s.file === '.skillmeta');
    expect(metaStatus!.valid).toBe(true);

    const visionStatus = report.fileStatuses.find((s) =>
      s.file.endsWith('-vision.md'),
    );
    expect(visionStatus!.valid).toBe(true);

    const actStatus = report.fileStatuses.find((s) =>
      s.file.endsWith('-activities.json'),
    );
    expect(actStatus!.valid).toBe(false);
  });

  it('reports failure for an empty directory', async () => {
    const report = await validatePackContent(testDir);

    expect(report.valid).toBe(false);
    expect(report.packId).toBeNull();
    expect(report.errors.some((e) => e.includes('.skillmeta'))).toBe(true);
  });

  it('reports failure when directory does not exist', async () => {
    const nonExistent = join(testDir, 'no-such-dir');

    const report = await validatePackContent(nonExistent);

    expect(report.valid).toBe(false);
    expect(report.packId).toBeNull();
    expect(report.errors.length).toBeGreaterThan(0);
  });

  it('extracts packId from valid .skillmeta', async () => {
    await writeFile(join(testDir, '.skillmeta'), VALID_SKILLMETA);

    const report = await validatePackContent(testDir);

    expect(report.packId).toBe('TEST-101');
  });
});
