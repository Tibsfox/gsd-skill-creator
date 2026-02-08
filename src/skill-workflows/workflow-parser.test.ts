/**
 * Tests for workflow YAML parser.
 *
 * Covers:
 * - Valid YAML parses to WorkflowDefinition with correct types
 * - Invalid YAML (syntax error) returns null
 * - YAML missing required fields returns null
 * - Empty content returns null
 * - parseWorkflowFile returns null for non-existent file
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseWorkflowYaml, parseWorkflowFile } from './workflow-parser.js';

// ============================================================================
// parseWorkflowYaml
// ============================================================================

describe('parseWorkflowYaml', () => {
  it('parses valid YAML to WorkflowDefinition', async () => {
    const yaml = `
name: ci-pipeline
description: CI/CD pipeline
steps:
  - id: lint
    skill: code-linter
  - id: test
    skill: unit-tester
    needs:
      - lint
  - id: deploy
    skill: deployer
    needs:
      - test
`;
    const result = await parseWorkflowYaml(yaml);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('ci-pipeline');
    expect(result!.description).toBe('CI/CD pipeline');
    expect(result!.version).toBe(1);
    expect(result!.extends).toBeNull();
    expect(result!.steps).toHaveLength(3);
    expect(result!.steps[0].id).toBe('lint');
    expect(result!.steps[0].needs).toEqual([]);
    expect(result!.steps[1].needs).toEqual(['lint']);
    expect(result!.steps[2].needs).toEqual(['test']);
  });

  it('returns null for invalid YAML syntax', async () => {
    const result = await parseWorkflowYaml('{{{{invalid yaml!!!');
    expect(result).toBeNull();
  });

  it('returns null for YAML missing required fields', async () => {
    const yaml = `
description: no name or steps
version: 1
`;
    const result = await parseWorkflowYaml(yaml);
    expect(result).toBeNull();
  });

  it('returns null for YAML with empty steps array', async () => {
    const yaml = `
name: empty-steps
steps: []
`;
    const result = await parseWorkflowYaml(yaml);
    expect(result).toBeNull();
  });

  it('returns null for empty content', async () => {
    const result = await parseWorkflowYaml('');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only content', async () => {
    const result = await parseWorkflowYaml('   \n   \n   ');
    expect(result).toBeNull();
  });

  it('preserves unknown fields via passthrough', async () => {
    const yaml = `
name: extended
custom_field: hello
steps:
  - id: a
    skill: sa
    custom_step_field: world
`;
    const result = await parseWorkflowYaml(yaml);
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).custom_field).toBe('hello');
    expect((result!.steps[0] as Record<string, unknown>).custom_step_field).toBe('world');
  });
});

// ============================================================================
// parseWorkflowFile
// ============================================================================

describe('parseWorkflowFile', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-parser-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', async () => {
    const result = await parseWorkflowFile(join(testDir, 'nonexistent.yaml'));
    expect(result).toBeNull();
  });

  it('parses a valid workflow file from disk', async () => {
    const filePath = join(testDir, 'test.workflow.yaml');
    const content = `
name: disk-workflow
steps:
  - id: step1
    skill: skill1
`;
    await writeFile(filePath, content, 'utf-8');

    const result = await parseWorkflowFile(filePath);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('disk-workflow');
    expect(result!.steps).toHaveLength(1);
  });

  it('returns null for file with invalid YAML', async () => {
    const filePath = join(testDir, 'bad.yaml');
    await writeFile(filePath, '{{invalid', 'utf-8');

    const result = await parseWorkflowFile(filePath);
    expect(result).toBeNull();
  });
});
