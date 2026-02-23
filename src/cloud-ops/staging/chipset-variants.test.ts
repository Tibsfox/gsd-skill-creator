/**
 * Tests for chipset variant intake and staging.
 *
 * Covers validateChipsetVariant (pure) and stageChipsetVariant,
 * listStagedVariants (I/O). Uses temporary directories.
 *
 * @module cloud-ops/staging/chipset-variants.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validateChipsetVariant,
  stageChipsetVariant,
  listStagedVariants,
} from './chipset-variants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'chipset-variants-test-'));
}

const VALID_VARIANT_YAML = `name: my-custom-variant
description: A custom OpenStack variant for testing
basedOn: openstack-nasa-se
skills:
  - openstack-keystone
  - openstack-nova
agents:
  - exec-keystone
  - exec-compute
teams:
  - deployment
`;

// ---------------------------------------------------------------------------
// validateChipsetVariant -- valid cases
// ---------------------------------------------------------------------------

describe('validateChipsetVariant -- valid', () => {
  it('accepts a well-formed variant YAML with all required keys', () => {
    const result = validateChipsetVariant(VALID_VARIANT_YAML);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts variant with basedOn key', () => {
    const result = validateChipsetVariant(VALID_VARIANT_YAML);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateChipsetVariant -- missing required keys
// ---------------------------------------------------------------------------

describe('validateChipsetVariant -- missing required keys', () => {
  it('rejects empty content', () => {
    const result = validateChipsetVariant('');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('empty'))).toBe(true);
  });

  it('rejects content with no YAML key-value pairs', () => {
    const result = validateChipsetVariant('# just a comment');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('no YAML key-value pairs'))).toBe(true);
  });

  it('rejects variant missing the name key', () => {
    const yaml = `description: A variant
basedOn: openstack-nasa-se
skills:
  - openstack-keystone
agents:
  - exec-keystone
teams:
  - deployment
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'name'"))).toBe(true);
  });

  it('rejects variant missing the description key', () => {
    const yaml = `name: my-variant
basedOn: openstack-nasa-se
skills:
  - openstack-keystone
agents:
  - exec-keystone
teams:
  - deployment
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'description'"))).toBe(true);
  });

  it('rejects variant missing the skills key', () => {
    const yaml = `name: my-variant
description: A variant
basedOn: openstack-nasa-se
agents:
  - exec-keystone
teams:
  - deployment
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'skills'"))).toBe(true);
  });

  it('rejects variant missing the agents key', () => {
    const yaml = `name: my-variant
description: A variant
basedOn: openstack-nasa-se
skills:
  - openstack-keystone
teams:
  - deployment
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'agents'"))).toBe(true);
  });

  it('rejects variant missing the teams key', () => {
    const yaml = `name: my-variant
description: A variant
basedOn: openstack-nasa-se
skills:
  - openstack-keystone
agents:
  - exec-keystone
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'teams'"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateChipsetVariant -- array checks
// ---------------------------------------------------------------------------

describe('validateChipsetVariant -- array structure', () => {
  it('accepts variant with empty arrays ([] syntax)', () => {
    const yaml = `name: minimal
description: Minimal variant
basedOn: openstack-nasa-se
skills: []
agents: []
teams: []
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(true);
  });

  it('rejects skills with non-array inline value', () => {
    const yaml = `name: bad-variant
description: A variant with bad skills
basedOn: openstack-nasa-se
skills: openstack-keystone
agents:
  - exec-keystone
teams:
  - deployment
`;
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("'skills'") && e.includes('list'))).toBe(true);
  });

  it('rejects malformed YAML with unbalanced braces', () => {
    const yaml = VALID_VARIANT_YAML + '\nbad_key: { unclosed';
    const result = validateChipsetVariant(yaml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('curly braces'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stageChipsetVariant -- file I/O
// ---------------------------------------------------------------------------

describe('stageChipsetVariant', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('creates the variant subdirectory inside the staging inbox', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    await stageChipsetVariant({
      basePath: base,
      name: 'my-custom-variant',
      content: VALID_VARIANT_YAML,
      source: 'community',
    });

    expect(existsSync(join(base, '.planning/staging/inbox/chipset-variants/my-custom-variant'))).toBe(true);
  });

  it('writes chipset.yaml to the variant directory', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await stageChipsetVariant({
      basePath: base,
      name: 'test-variant',
      content: VALID_VARIANT_YAML,
      source: 'test',
    });

    expect(existsSync(result.variantPath)).toBe(true);
    expect(readFileSync(result.variantPath, 'utf-8')).toBe(VALID_VARIANT_YAML);
    expect(result.variantPath.endsWith('chipset.yaml')).toBe(true);
  });

  it('writes companion metadata file', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await stageChipsetVariant({
      basePath: base,
      name: 'test-variant',
      content: VALID_VARIANT_YAML,
      source: 'community',
    });

    expect(existsSync(result.metadataPath)).toBe(true);
    const meta = JSON.parse(readFileSync(result.metadataPath, 'utf-8'));
    expect(meta.source).toBe('community');
    expect(meta.status).toBe('inbox');
    expect(meta.variantName).toBe('test-variant');
    expect(meta.validated).toBe(true);
    expect(typeof meta.submitted_at).toBe('string');
  });

  it('marks validated=false in metadata when variant has errors', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const invalidYaml = `name: broken\ndescription: Missing required keys`;

    const result = await stageChipsetVariant({
      basePath: base,
      name: 'broken-variant',
      content: invalidYaml,
      source: 'test',
    });

    const meta = JSON.parse(readFileSync(result.metadataPath, 'utf-8'));
    expect(meta.validated).toBe(false);
    expect(Array.isArray(meta.validationErrors)).toBe(true);
    expect(meta.validationErrors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// listStagedVariants
// ---------------------------------------------------------------------------

describe('listStagedVariants', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('returns empty array when chipset-variants directory does not exist', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await listStagedVariants(base);
    expect(result).toEqual([]);
  });

  it('returns info for a staged variant', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    await stageChipsetVariant({
      basePath: base,
      name: 'alpha-variant',
      content: VALID_VARIANT_YAML,
      source: 'test',
    });

    const list = await listStagedVariants(base);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('alpha-variant');
    expect(list[0].path).toContain('chipset.yaml');
    expect(list[0].validated).toBe(true);
    expect(typeof list[0].stagedAt).toBe('string');
    expect(list[0].stagedAt.length).toBeGreaterThan(0);
  });

  it('returns info for multiple staged variants, sorted by name', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    await stageChipsetVariant({ basePath: base, name: 'zeta-variant', content: VALID_VARIANT_YAML, source: 'test' });
    await stageChipsetVariant({ basePath: base, name: 'alpha-variant', content: VALID_VARIANT_YAML, source: 'test' });
    await stageChipsetVariant({ basePath: base, name: 'beta-variant', content: VALID_VARIANT_YAML, source: 'test' });

    const list = await listStagedVariants(base);
    expect(list).toHaveLength(3);
    expect(list[0].name).toBe('alpha-variant');
    expect(list[1].name).toBe('beta-variant');
    expect(list[2].name).toBe('zeta-variant');
  });

  it('returns empty array when chipset-variants directory exists but is empty', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    // Create the directory manually without any variants
    const { mkdir } = await import('node:fs/promises');
    await mkdir(join(base, '.planning/staging/inbox/chipset-variants'), { recursive: true });

    const list = await listStagedVariants(base);
    expect(list).toEqual([]);
  });

  it('skips directories without chipset.yaml', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    // Stage a valid variant
    await stageChipsetVariant({ basePath: base, name: 'valid-variant', content: VALID_VARIANT_YAML, source: 'test' });

    // Create a directory without chipset.yaml (simulates a partial/failed stage)
    const { mkdir: mkdirFn } = await import('node:fs/promises');
    await mkdirFn(join(base, '.planning/staging/inbox/chipset-variants/incomplete-dir'), { recursive: true });

    const list = await listStagedVariants(base);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('valid-variant');
  });
});
