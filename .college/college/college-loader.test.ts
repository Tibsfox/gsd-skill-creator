/**
 * Tests for CollegeLoader -- progressive disclosure with three-tier
 * loading (summary/active/deep) and filesystem-based department discovery.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  CollegeLoader,
  DepartmentNotFoundError,
  WingNotFoundError,
} from './college-loader.js';

// ─── Test Setup ──────────────────────────────────────────────────────────────

let tempDir: string;

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'college-test-'));

  // Create test-dept directory structure
  const deptDir = join(tempDir, 'test-dept');
  mkdirSync(deptDir, { recursive: true });
  mkdirSync(join(deptDir, 'concepts', 'algebra'), { recursive: true });
  mkdirSync(join(deptDir, 'references'), { recursive: true });
  mkdirSync(join(deptDir, 'try-sessions'), { recursive: true });

  // Write DEPARTMENT.md
  writeFileSync(
    join(deptDir, 'DEPARTMENT.md'),
    `# Test Department

**Domain:** test-dept
**Purpose:** Testing the CollegeLoader

## Wings

- Algebra -- fundamental algebraic concepts

## Entry Point

test-ratios

## Learning Path

1. ratios (start here)
`,
  );

  // Write a concept file
  writeFileSync(
    join(deptDir, 'concepts', 'algebra', 'ratios.ts'),
    `export const ratios = {
  id: 'test-ratios',
  name: 'Ratios',
  domain: 'test-dept',
  description: 'The relationship between two quantities expressed as a fraction.',
  panels: new Map(),
  relationships: [],
};
`,
  );

  // Write a deep reference
  writeFileSync(
    join(deptDir, 'references', 'exponential-decay.md'),
    `# Exponential Decay

Exponential decay describes quantities that decrease proportionally to their current value.

## Formula

N(t) = N0 * e^(-lambda * t)

## Applications

Used in radioactive decay, cooling curves, and pharmacokinetics.
`,
  );

  // Create a second department to test discovery
  const dept2Dir = join(tempDir, 'other-dept');
  mkdirSync(dept2Dir, { recursive: true });
  writeFileSync(
    join(dept2Dir, 'DEPARTMENT.md'),
    `# Other Department

**Domain:** other-dept

## Wings

- Basics -- basic things

## Entry Point

other-intro
`,
  );
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CollegeLoader', () => {
  it('loadSummary returns DepartmentSummary with name, wings, entryPoint, and tokenCost under 3000', async () => {
    const loader = new CollegeLoader(tempDir);
    const summary = await loader.loadSummary('test-dept');

    expect(summary.id).toBe('test-dept');
    expect(summary.name).toBe('Test Department');
    expect(summary.wings).toHaveLength(1);
    expect(summary.wings[0].id).toBe('algebra');
    expect(summary.wings[0].name).toBe('Algebra');
    expect(summary.entryPoint).toBe('test-ratios');
    expect(summary.tokenCost).toBeLessThan(3000);
  });

  it('loadSummary throws DepartmentNotFoundError for non-existent department', async () => {
    const loader = new CollegeLoader(tempDir);
    await expect(loader.loadSummary('nonexistent')).rejects.toThrow(
      DepartmentNotFoundError,
    );
  });

  it('loadWing returns WingContent with concepts array and tokenCost under 12000', async () => {
    const loader = new CollegeLoader(tempDir);
    const wing = await loader.loadWing('test-dept', 'algebra');

    expect(wing.departmentId).toBe('test-dept');
    expect(wing.wing.id).toBe('algebra');
    expect(wing.wing.name).toBe('Algebra');
    expect(wing.concepts).toHaveLength(1);
    expect(wing.concepts[0].id).toBe('test-ratios');
    expect(wing.tokenCost).toBeLessThan(12000);
  });

  it('loadWing throws WingNotFoundError for non-existent wing', async () => {
    const loader = new CollegeLoader(tempDir);
    await expect(loader.loadWing('test-dept', 'nonexistent')).rejects.toThrow(
      WingNotFoundError,
    );
  });

  it('loadDeep returns DeepReference with content from references/', async () => {
    const loader = new CollegeLoader(tempDir);
    const deep = await loader.loadDeep('test-dept', 'exponential-decay');

    expect(deep.departmentId).toBe('test-dept');
    expect(deep.topic).toBe('exponential-decay');
    expect(deep.content).toContain('Exponential Decay');
    expect(deep.content).toContain('N(t) = N0');
    expect(deep.tokenCost).toBeGreaterThan(0);
  });

  it('loadDeep for non-existent topic returns DeepReference with empty content message', async () => {
    const loader = new CollegeLoader(tempDir);
    const deep = await loader.loadDeep('test-dept', 'nonexistent-topic');

    expect(deep.departmentId).toBe('test-dept');
    expect(deep.topic).toBe('nonexistent-topic');
    expect(deep.content).toContain('no deep reference available');
  });

  it('listDepartments discovers departments from filesystem without hardcoded list', () => {
    const loader = new CollegeLoader(tempDir);
    const depts = loader.listDepartments();

    expect(depts).toContain('test-dept');
    expect(depts).toContain('other-dept');
    expect(depts.length).toBeGreaterThanOrEqual(2);
  });

  it('adding a new department directory makes it appear in listDepartments without code changes', () => {
    const loader = new CollegeLoader(tempDir);

    // Create new department on the fly
    const newDeptDir = join(tempDir, 'dynamic-dept');
    mkdirSync(newDeptDir, { recursive: true });
    writeFileSync(
      join(newDeptDir, 'DEPARTMENT.md'),
      '# Dynamic Department\n\n## Wings\n\n- Testing\n\n## Entry Point\n\ndynamic-intro\n',
    );

    const depts = loader.listDepartments();
    expect(depts).toContain('dynamic-dept');

    // Clean up
    rmSync(newDeptDir, { recursive: true, force: true });
  });

  it('loadSummary token cost is enforced -- summary exceeding 3K tokens gets truncated', async () => {
    // Create a department with a very long description to exceed 3K tokens
    const bigDeptDir = join(tempDir, 'big-dept');
    mkdirSync(bigDeptDir, { recursive: true });
    // 3000 tokens * 4 chars/token = 12000 chars, so 15000 chars should exceed
    const longDescription = 'A'.repeat(15000);
    writeFileSync(
      join(bigDeptDir, 'DEPARTMENT.md'),
      `# Big Department\n\n**Domain:** big-dept\n\n${longDescription}\n\n## Wings\n\n- Stuff -- things\n\n## Entry Point\n\nbig-intro\n`,
    );

    const loader = new CollegeLoader(tempDir);
    const summary = await loader.loadSummary('big-dept');

    expect(summary.tokenCost).toBeLessThanOrEqual(3000);

    // Clean up
    rmSync(bigDeptDir, { recursive: true, force: true });
  });
});
