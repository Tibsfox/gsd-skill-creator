/**
 * Module loader tests.
 *
 * Tests the pack directory loader that reads all content files into
 * a single typed LoadedPack object. Uses vi.mock for filesystem mocking.
 *
 * @module module-loader.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KnowledgePack, ModulesFile } from '../types.js';

// Mock node:fs/promises before importing module-loader
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
}));

import { readFile, readdir } from 'node:fs/promises';
import { loadPack } from '../module-loader.js';
import type { LoadedPack } from '../module-loader.js';

const mockReadFile = vi.mocked(readFile);
const mockReaddir = vi.mocked(readdir);

// ============================================================================
// Test data
// ============================================================================

const VALID_SKILLMETA = `
pack_id: MATH-101
pack_name: Mathematics Foundations
version: "1.0.0"
status: alpha
classification: core_academic
description: Core mathematical concepts for young learners.
short_description: Math basics
contributors:
  - name: Test Author
    role: author
copyright: MIT
tags:
  - mathematics
  - stem
grade_levels:
  - label: Elementary
    grades: ["3", "4", "5"]
    estimated_hours: [10, 20]
gsd_integration:
  skill_creator_enabled: false
`;

const VALID_VISION_MD = `# Mathematics Foundations Vision

## Vision

Build mathematical thinking skills from the ground up.

## Core Concepts

Numbers, operations, geometry, measurement.
`;

const VALID_MODULES_YAML = `
pack_id: MATH-101
pack_name: Mathematics Foundations
modules:
  - id: MOD-01
    name: Numbers and Counting
    description: Foundation number concepts
    learning_outcomes:
      - Understand place value
    topics:
      - Counting
    grade_levels:
      - "3"
    time_estimates:
      elementary: 10
    prerequisite_modules: []
`;

const VALID_ACTIVITIES_JSON = JSON.stringify([
  {
    id: 'ACT-01',
    name: 'Counting Game',
    module_id: 'MOD-01',
    grade_range: ['3', '4'],
    duration_minutes: 30,
    description: 'Practice counting with interactive game.',
    materials: ['counters'],
    learning_objectives: ['Count to 100'],
  },
]);

const VALID_ASSESSMENT_MD = `# Assessment Framework

## Beginning

Student struggles with basic concepts.

## Proficient

Student demonstrates solid understanding.
`;

const VALID_RESOURCES_MD = `# Resources

## Textbooks

[Math Fun](https://example.com/math) A great math textbook
`;

// ============================================================================
// loadPack
// ============================================================================

describe('loadPack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a full pack directory with all files present', async () => {
    mockReaddir.mockResolvedValue([
      '.skillmeta',
      'MATH-101-vision.md',
      'MATH-101-modules.yaml',
      'MATH-101-activities.json',
      'MATH-101-assessment.md',
      'MATH-101-resources.md',
      'README.md',
    ] as any);

    mockReadFile.mockImplementation(async (filePath: any) => {
      const path = String(filePath);
      if (path.endsWith('.skillmeta')) return VALID_SKILLMETA;
      if (path.endsWith('-vision.md')) return VALID_VISION_MD;
      if (path.endsWith('-modules.yaml')) return VALID_MODULES_YAML;
      if (path.endsWith('-activities.json')) return VALID_ACTIVITIES_JSON;
      if (path.endsWith('-assessment.md')) return VALID_ASSESSMENT_MD;
      if (path.endsWith('-resources.md')) return VALID_RESOURCES_MD;
      throw new Error(`Unexpected file read: ${path}`);
    });

    const result = await loadPack('/packs/MATH-101');

    expect(result.meta).not.toBeNull();
    expect(result.meta?.pack_id).toBe('MATH-101');
    expect(result.vision).not.toBeNull();
    expect(result.modules).not.toBeNull();
    expect(result.activities).not.toBeNull();
    expect(result.assessment).not.toBeNull();
    expect(result.resources).not.toBeNull();
    expect(result.directory).toBe('/packs/MATH-101');
    expect(result.loadErrors).toHaveLength(0);
  });

  it('loads minimal pack (only .skillmeta present)', async () => {
    mockReaddir.mockResolvedValue(['.skillmeta', 'README.md'] as any);

    mockReadFile.mockImplementation(async (filePath: any) => {
      const path = String(filePath);
      if (path.endsWith('.skillmeta')) return VALID_SKILLMETA;
      const err = new Error(`ENOENT: no such file or directory, open '${path}'`) as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    });

    const result = await loadPack('/packs/MATH-101');

    expect(result.meta).not.toBeNull();
    expect(result.meta?.pack_id).toBe('MATH-101');
    expect(result.vision).toBeNull();
    expect(result.modules).toBeNull();
    expect(result.activities).toBeNull();
    expect(result.assessment).toBeNull();
    expect(result.resources).toBeNull();
    expect(result.loadErrors).toHaveLength(0);
  });

  it('returns error when .skillmeta is missing', async () => {
    mockReaddir.mockResolvedValue(['README.md', 'some-other.txt'] as any);

    const result = await loadPack('/packs/BROKEN');

    expect(result.meta).toBeNull();
    expect(result.loadErrors.length).toBeGreaterThan(0);
    expect(result.loadErrors.some((e) => e.toLowerCase().includes('skillmeta'))).toBe(true);
  });

  it('returns error when .skillmeta has invalid YAML', async () => {
    mockReaddir.mockResolvedValue(['.skillmeta'] as any);

    mockReadFile.mockImplementation(async (filePath: any) => {
      const path = String(filePath);
      if (path.endsWith('.skillmeta')) return 'not_valid: [unclosed bracket';
      throw new Error('Unexpected read');
    });

    const result = await loadPack('/packs/INVALID');

    expect(result.loadErrors.length).toBeGreaterThan(0);
  });

  it('returns error when .skillmeta fails schema validation', async () => {
    mockReaddir.mockResolvedValue(['.skillmeta'] as any);

    // Missing required fields like pack_id, pack_name, etc.
    mockReadFile.mockImplementation(async (filePath: any) => {
      const path = String(filePath);
      if (path.endsWith('.skillmeta')) return 'some_field: value\n';
      throw new Error('Unexpected read');
    });

    const result = await loadPack('/packs/BAD-SCHEMA');

    expect(result.meta).toBeNull();
    expect(result.loadErrors.length).toBeGreaterThan(0);
  });

  it('discovers files by pattern matching in directory listing', async () => {
    // Files are found by their suffix patterns, not hardcoded names
    mockReaddir.mockResolvedValue([
      '.skillmeta',
      'custom-prefix-vision.md',
      'custom-prefix-modules.yaml',
    ] as any);

    mockReadFile.mockImplementation(async (filePath: any) => {
      const path = String(filePath);
      if (path.endsWith('.skillmeta')) return VALID_SKILLMETA;
      if (path.endsWith('-vision.md')) return VALID_VISION_MD;
      if (path.endsWith('-modules.yaml')) return VALID_MODULES_YAML;
      throw new Error('Unexpected read');
    });

    const result = await loadPack('/packs/CUSTOM');

    expect(result.meta).not.toBeNull();
    expect(result.vision).not.toBeNull();
    expect(result.modules).not.toBeNull();
  });

  it('derives pack_id from parsed .skillmeta content', async () => {
    mockReaddir.mockResolvedValue(['.skillmeta'] as any);

    mockReadFile.mockImplementation(async () => VALID_SKILLMETA);

    const result = await loadPack('/packs/wrong-dirname');

    // pack_id comes from .skillmeta content, not directory name
    expect(result.meta?.pack_id).toBe('MATH-101');
  });

  it('returns directory field matching input path', async () => {
    mockReaddir.mockResolvedValue(['.skillmeta'] as any);
    mockReadFile.mockResolvedValue(VALID_SKILLMETA);

    const result = await loadPack('/some/custom/path');
    expect(result.directory).toBe('/some/custom/path');
  });

  it('handles readdir ENOENT gracefully', async () => {
    const err = new Error("ENOENT: no such directory '/nonexistent'") as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReaddir.mockRejectedValue(err);

    const result = await loadPack('/nonexistent');

    expect(result.meta).toBeNull();
    expect(result.loadErrors.length).toBeGreaterThan(0);
  });
});
