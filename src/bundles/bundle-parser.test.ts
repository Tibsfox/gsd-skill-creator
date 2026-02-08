/**
 * Tests for bundle YAML parser.
 *
 * Covers:
 * - parseBundleYaml returns typed BundleDefinition for valid YAML
 * - parseBundleYaml returns null for empty, invalid, schema-failing YAML
 * - parseBundleFile returns null for non-existent file
 * - parseBundleFile reads and parses valid YAML from tmp dir
 * - JSON_SCHEMA rejects executable tags (!!js/function)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseBundleYaml, parseBundleFile } from './bundle-parser.js';

// ============================================================================
// parseBundleYaml
// ============================================================================

describe('parseBundleYaml', () => {
  it('parses valid YAML to BundleDefinition', async () => {
    const yaml = `
name: frontend-dev
description: Frontend development bundle
version: 2
phase: implementation
skills:
  - name: ts
    required: true
  - name: react
    required: false
created_at: "2026-02-08"
`;
    const result = await parseBundleYaml(yaml);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('frontend-dev');
    expect(result!.description).toBe('Frontend development bundle');
    expect(result!.version).toBe(2);
    expect(result!.phase).toBe('implementation');
    expect(result!.skills).toHaveLength(2);
    expect(result!.skills[0].name).toBe('ts');
    expect(result!.skills[0].required).toBe(true);
    expect(result!.skills[1].name).toBe('react');
    expect(result!.skills[1].required).toBe(false);
  });

  it('returns null for empty string', async () => {
    const result = await parseBundleYaml('');
    expect(result).toBeNull();
  });

  it('returns null for invalid YAML syntax', async () => {
    const result = await parseBundleYaml('{{{{invalid yaml!!!');
    expect(result).toBeNull();
  });

  it('returns null for schema-violating YAML (no name)', async () => {
    const yaml = `
skills:
  - name: ts
`;
    const result = await parseBundleYaml(yaml);
    expect(result).toBeNull();
  });

  it('returns null for non-object YAML (plain string)', async () => {
    const result = await parseBundleYaml('just a plain string');
    expect(result).toBeNull();
  });

  it('returns null for YAML with !!js/function tag (JSON_SCHEMA safety)', async () => {
    const yaml = `
name: "malicious"
skills:
  - name: ts
hack: !!js/function "function() { return 'pwned'; }"
`;
    const result = await parseBundleYaml(yaml);
    expect(result).toBeNull();
  });

  it('preserves unknown fields via passthrough', async () => {
    const yaml = `
name: extended-bundle
skills:
  - name: ts
custom_field: hello
priority: 5
`;
    const result = await parseBundleYaml(yaml);
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).custom_field).toBe('hello');
    expect((result as Record<string, unknown>).priority).toBe(5);
  });
});

// ============================================================================
// parseBundleFile
// ============================================================================

describe('parseBundleFile', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-bundle-parser-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns null for non-existent file', async () => {
    const result = await parseBundleFile(join(testDir, 'nonexistent.bundle.yaml'));
    expect(result).toBeNull();
  });

  it('parses a valid bundle file from disk', async () => {
    const filePath = join(testDir, 'test.bundle.yaml');
    const content = `
name: disk-bundle
description: A bundle loaded from disk
skills:
  - name: testing
    required: true
`;
    await writeFile(filePath, content, 'utf-8');

    const result = await parseBundleFile(filePath);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('disk-bundle');
    expect(result!.description).toBe('A bundle loaded from disk');
    expect(result!.skills).toHaveLength(1);
    expect(result!.skills[0].name).toBe('testing');
  });

  it('returns null for file with invalid YAML', async () => {
    const filePath = join(testDir, 'bad.yaml');
    await writeFile(filePath, '{{invalid', 'utf-8');

    const result = await parseBundleFile(filePath);
    expect(result).toBeNull();
  });
});
