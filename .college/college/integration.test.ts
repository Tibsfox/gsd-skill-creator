/**
 * Integration tests proving all 5 COLL requirements end-to-end.
 *
 * These tests operate against the REAL .college/departments/ directory,
 * proving that the test-department is discovered and usable through all
 * College APIs without any framework code changes (COLL-05).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { CollegeLoader } from './college-loader.js';
import { DepartmentExplorer } from './explorer.js';
import { CrossReferenceResolver } from './cross-reference-resolver.js';
import { TrySessionRunner } from './try-session-runner.js';
import { ConceptRegistry } from '../rosetta-core/concept-registry.js';
import type { RosettaConcept, PanelId, PanelExpression } from '../rosetta-core/types.js';

// ─── Test Setup ──────────────────────────────────────────────────────────────

// Use real .college/departments/ directory from project root
const DEPARTMENTS_PATH = join(process.cwd(), '.college', 'departments');

let loader: CollegeLoader;
let registry: ConceptRegistry;
let explorer: DepartmentExplorer;
let resolver: CrossReferenceResolver;

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'default',
    name: 'Default',
    domain: 'unknown',
    description: 'A default concept',
    panels: new Map<PanelId, PanelExpression>(),
    relationships: [],
    ...overrides,
  };
}

beforeAll(() => {
  loader = new CollegeLoader(DEPARTMENTS_PATH);

  registry = new ConceptRegistry();

  // Register the test-hello-world concept (from test department)
  registry.register(makeConcept({
    id: 'test-hello-world',
    name: 'Hello World',
    domain: 'test-department',
    description: 'The canonical first program -- every programming journey begins here. ' +
      'Hello World teaches output, string literals, and program structure in a single line.',
    relationships: [
      {
        type: 'analogy',
        targetId: 'math-variables',
        description: 'Variables in Hello World are like variables in algebra -- named containers for values',
      },
    ],
  }));

  // Register a math-variables concept for cross-reference testing
  registry.register(makeConcept({
    id: 'math-variables',
    name: 'Variables',
    domain: 'mathematics',
    description: 'Named containers for values in mathematical expressions.',
    relationships: [
      {
        type: 'analogy',
        targetId: 'test-hello-world',
        description: 'Mathematical variables are like programming variables',
      },
    ],
  }));

  explorer = new DepartmentExplorer(loader, registry);
  resolver = new CrossReferenceResolver(registry);
});

// ─── COLL-05: Extensibility ─────────────────────────────────────────────────

describe('COLL-05: New department discovery without framework changes', () => {
  it('listDepartments includes test-department alongside mathematics and culinary-arts', () => {
    const depts = loader.listDepartments();

    expect(depts).toContain('test-department');
    expect(depts).toContain('mathematics');
    expect(depts).toContain('culinary-arts');
  });
});

// ─── COLL-01: Progressive Disclosure ────────────────────────────────────────

describe('COLL-01: Progressive disclosure chain', () => {
  it('loadSummary returns DepartmentSummary with tokenCost under 3000', async () => {
    const summary = await loader.loadSummary('test-department');

    expect(summary.id).toBe('test-department');
    expect(summary.name).toBe('Test Department');
    expect(summary.tokenCost).toBeLessThan(3000);
    expect(summary.wings.length).toBeGreaterThan(0);
    expect(summary.entryPoint).toBe('test-hello-world');
  });

  it('loadWing returns WingContent with hello-world concept and tokenCost under 12000', async () => {
    const wing = await loader.loadWing('test-department', 'basics');

    expect(wing.departmentId).toBe('test-department');
    expect(wing.wing.id).toBe('basics');
    expect(wing.concepts.length).toBeGreaterThan(0);
    expect(wing.concepts[0].id).toBe('test-hello-world');
    expect(wing.tokenCost).toBeLessThan(12000);
  });

  it('loadDeep returns DeepReference with history and cross-references content', async () => {
    const deep = await loader.loadDeep('test-department', 'hello-world');

    expect(deep.departmentId).toBe('test-department');
    expect(deep.content).toContain('Hello World');
    expect(deep.content).toContain('History');
    expect(deep.content).toContain('Cross-References');
    expect(deep.tokenCost).toBeGreaterThan(0);
  });
});

// ─── COLL-02: Explorable Navigation ─────────────────────────────────────────

describe('COLL-02: Department/wing/concept hierarchy navigation', () => {
  it('explore test-department/basics/test-hello-world returns ExplorationResult', async () => {
    const result = await explorer.explore('test-department/basics/test-hello-world');

    expect(result.concept.id).toBe('test-hello-world');
    expect(result.wing.id).toBe('basics');
    expect(result.departmentId).toBe('test-department');
    expect(result.pedagogicalContext).toBeTruthy();
  });

  it('listExplorablePaths returns at least test-department/basics/test-hello-world', async () => {
    const paths = await explorer.listExplorablePaths('test-department');

    expect(paths).toContain('test-department/basics/test-hello-world');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── COLL-03: Try-Sessions ──────────────────────────────────────────────────

describe('COLL-03: Try-session runs from start to completion', () => {
  it('loadSession starts session; stepping through completes it with correct concepts', async () => {
    const runner = await TrySessionRunner.loadSession(loader, 'test-department', 'getting-started');

    expect(runner.getState().status).toBe('active');
    expect(runner.getState().totalSteps).toBe(3);

    // Complete all 3 steps
    runner.completeStep(); // step 0 -> step 1
    runner.completeStep(); // step 1 -> step 2
    runner.completeStep(); // step 2 -> completed

    expect(runner.getState().status).toBe('completed');

    const explored = runner.getConceptsExplored();
    expect(explored).toContain('test-hello-world');
    expect(explored).toContain('math-variables');
  });
});

// ─── COLL-04: Cross-References ──────────────────────────────────────────────

describe('COLL-04: Cross-reference resolution across departments', () => {
  it('resolves analogy relationship from test-hello-world to math-variables', () => {
    const result = resolver.resolve('test-department', 'test-hello-world', 'mathematics');

    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0].conceptId).toBe('math-variables');
    expect(result.matches[0].relationshipType).toBe('analogy');
  });
});

// ─── Token Compliance ───────────────────────────────────────────────────────

describe('Token compliance across all departments', () => {
  it('loadSummary for all departments returns tokenCost under 3000', async () => {
    const depts = loader.listDepartments();

    for (const dept of depts) {
      const summary = await loader.loadSummary(dept);
      expect(summary.tokenCost).toBeLessThan(3000);
    }
  });
});
