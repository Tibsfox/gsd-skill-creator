/**
 * Tests for DepartmentExplorer -- path-based navigation of the
 * department/wing/concept hierarchy.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CollegeLoader } from './college-loader.js';
import { DepartmentExplorer, ExplorationError } from './explorer.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaConcept, PanelId, PanelExpression } from '../rosetta-core/types.js';

// ─── Test Setup ──────────────────────────────────────────────────────────────

let tempDir: string;
let loader: CollegeLoader;
let registry: ConceptRegistry;
let explorer: DepartmentExplorer;

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'default',
    name: 'Default',
    domain: 'test-dept',
    description: 'A default concept',
    panels: new Map<PanelId, PanelExpression>(),
    relationships: [],
    ...overrides,
  };
}

beforeAll(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'explorer-test-'));

  // Create test-dept structure
  const deptDir = join(tempDir, 'test-dept');
  mkdirSync(join(deptDir, 'concepts', 'algebra'), { recursive: true });
  mkdirSync(join(deptDir, 'concepts', 'geometry'), { recursive: true });
  mkdirSync(join(deptDir, 'references'), { recursive: true });
  mkdirSync(join(deptDir, 'try-sessions'), { recursive: true });

  writeFileSync(
    join(deptDir, 'DEPARTMENT.md'),
    `# Test Department

**Domain:** test-dept
**Purpose:** Testing the DepartmentExplorer

This department covers algebraic and geometric concepts for testing purposes.

## Wings

- Algebra -- fundamental algebraic concepts
- Geometry -- shapes and spatial reasoning

## Entry Point

test-ratios

## Learning Path

1. ratios (start here)
2. angles
`,
  );

  // Concept files
  writeFileSync(
    join(deptDir, 'concepts', 'algebra', 'ratios.ts'),
    `export const ratios = {
  id: 'test-ratios',
  name: 'Ratios',
  domain: 'test-dept',
  description: 'Comparing quantities.',
  panels: new Map(),
  relationships: [
    { type: 'analogy', targetId: 'other-proportions', description: 'Ratios relate to proportions' }
  ],
};`,
  );

  writeFileSync(
    join(deptDir, 'concepts', 'geometry', 'angles.ts'),
    `export const angles = {
  id: 'test-angles',
  name: 'Angles',
  domain: 'test-dept',
  description: 'Measuring rotation between lines.',
  panels: new Map(),
  relationships: [],
};`,
  );

  // Set up loader, registry, and explorer
  loader = new CollegeLoader(tempDir);

  registry = new ConceptRegistry();
  registry.register(makeConcept({
    id: 'test-ratios',
    name: 'Ratios',
    domain: 'test-dept',
    description: 'Comparing quantities.',
    relationships: [
      { type: 'analogy', targetId: 'other-proportions', description: 'Ratios relate to proportions' },
    ],
  }));
  registry.register(makeConcept({
    id: 'test-angles',
    name: 'Angles',
    domain: 'test-dept',
    description: 'Measuring rotation between lines.',
  }));
  registry.register(makeConcept({
    id: 'other-proportions',
    name: 'Proportions',
    domain: 'other-dept',
    description: 'Proportional relationships.',
  }));

  explorer = new DepartmentExplorer(loader, registry);
});

afterAll(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DepartmentExplorer', () => {
  it('explore("test-dept/algebra/test-ratios") returns ExplorationResult with concept, wing, departmentId, and pedagogical context', async () => {
    const result = await explorer.explore('test-dept/algebra/test-ratios');

    expect(result.path).toBe('test-dept/algebra/test-ratios');
    expect(result.concept.id).toBe('test-ratios');
    expect(result.wing.id).toBe('algebra');
    expect(result.departmentId).toBe('test-dept');
    expect(result.pedagogicalContext).toBeTruthy();
  });

  it('explore("test-dept") returns ExplorationResult with the department entry point concept', async () => {
    const result = await explorer.explore('test-dept');

    expect(result.concept.id).toBe('test-ratios');
    expect(result.departmentId).toBe('test-dept');
  });

  it('explore("test-dept/algebra") returns ExplorationResult with first concept in algebra wing', async () => {
    const result = await explorer.explore('test-dept/algebra');

    expect(result.concept.id).toBe('test-ratios');
    expect(result.wing.id).toBe('algebra');
    expect(result.departmentId).toBe('test-dept');
  });

  it('explore("nonexistent/wing/concept") throws ExplorationError with helpful message', async () => {
    await expect(explorer.explore('nonexistent/wing/concept')).rejects.toThrow(
      ExplorationError,
    );
  });

  it('ExplorationResult.relatedPaths contains navigable paths from concept relationships', async () => {
    const result = await explorer.explore('test-dept/algebra/test-ratios');

    // test-ratios has an analogy to other-proportions
    expect(result.relatedPaths.length).toBeGreaterThan(0);
    expect(result.relatedPaths.some((p) => p.includes('other-proportions'))).toBe(true);
  });

  it('explore() result includes pedagogicalContext extracted from DEPARTMENT.md', async () => {
    const result = await explorer.explore('test-dept/algebra/test-ratios');

    // Should contain content from the DEPARTMENT.md preamble
    expect(result.pedagogicalContext).toContain('algebraic');
  });

  it('listExplorablePaths returns all valid paths for department in hierarchy order', async () => {
    const paths = await explorer.listExplorablePaths('test-dept');

    expect(paths).toContain('test-dept/algebra/test-ratios');
    expect(paths).toContain('test-dept/geometry/test-angles');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });
});
