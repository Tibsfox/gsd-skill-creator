/**
 * Tests for role YAML parser.
 *
 * Covers:
 * - parseRoleYaml returns typed RoleDefinition for valid YAML
 * - parseRoleYaml returns null for empty, whitespace, invalid syntax, non-object, schema-failing
 * - parseRoleFile returns null for non-existent file
 * - parseRoleFile reads and parses valid YAML from tmp dir
 * - JSON_SCHEMA rejects executable tags (!!js/function)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseRoleYaml, parseRoleFile } from './role-parser.js';

// ============================================================================
// parseRoleYaml
// ============================================================================

describe('parseRoleYaml', () => {
  it('parses valid YAML to RoleDefinition', async () => {
    const yaml = `
name: security-reviewer
description: Reviews code for security issues
extends: base-reviewer
skills:
  - code-review
  - security-scan
constraints:
  - Never modify files
  - Read-only access
tools: "Bash,Read,Grep"
model: opus
`;
    const result = await parseRoleYaml(yaml);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('security-reviewer');
    expect(result!.description).toBe('Reviews code for security issues');
    expect(result!.extends).toBe('base-reviewer');
    expect(result!.skills).toEqual(['code-review', 'security-scan']);
    expect(result!.constraints).toEqual(['Never modify files', 'Read-only access']);
    expect(result!.tools).toBe('Bash,Read,Grep');
    expect(result!.model).toBe('opus');
  });

  it('returns null for empty string', async () => {
    const result = await parseRoleYaml('');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only content', async () => {
    const result = await parseRoleYaml('   \n   \n   ');
    expect(result).toBeNull();
  });

  it('returns null for invalid YAML syntax', async () => {
    const result = await parseRoleYaml('{{{{invalid yaml!!!');
    expect(result).toBeNull();
  });

  it('returns null for non-object YAML (plain string)', async () => {
    const result = await parseRoleYaml('just a plain string');
    expect(result).toBeNull();
  });

  it('returns null for schema-failing YAML (empty name)', async () => {
    const yaml = `
name: ""
`;
    const result = await parseRoleYaml(yaml);
    expect(result).toBeNull();
  });

  it('returns null for YAML with !!js/function tag (JSON_SCHEMA safety)', async () => {
    const yaml = `
name: "malicious"
hack: !!js/function "function() { return 'pwned'; }"
`;
    const result = await parseRoleYaml(yaml);
    expect(result).toBeNull();
  });

  it('preserves unknown fields via passthrough', async () => {
    const yaml = `
name: extended-role
custom_field: hello
priority: 5
`;
    const result = await parseRoleYaml(yaml);
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).custom_field).toBe('hello');
    expect((result as Record<string, unknown>).priority).toBe(5);
  });
});

// ============================================================================
// parseRoleFile
// ============================================================================

describe('parseRoleFile', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-role-parser-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', async () => {
    const result = await parseRoleFile(join(testDir, 'nonexistent.role.yaml'));
    expect(result).toBeNull();
  });

  it('parses a valid role file from disk', async () => {
    const filePath = join(testDir, 'test.role.yaml');
    const content = `
name: disk-role
description: A role loaded from disk
skills:
  - testing
constraints:
  - Be thorough
`;
    await writeFile(filePath, content, 'utf-8');

    const result = await parseRoleFile(filePath);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('disk-role');
    expect(result!.description).toBe('A role loaded from disk');
    expect(result!.skills).toEqual(['testing']);
    expect(result!.constraints).toEqual(['Be thorough']);
    expect(result!.extends).toBeNull();
  });

  it('returns null for file with invalid YAML', async () => {
    const filePath = join(testDir, 'bad.yaml');
    await writeFile(filePath, '{{invalid', 'utf-8');

    const result = await parseRoleFile(filePath);
    expect(result).toBeNull();
  });
});
