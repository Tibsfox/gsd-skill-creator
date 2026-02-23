/**
 * Tests for OpenStack configuration file intake and staging.
 *
 * Covers validateConfigFile (pure) and stageOpenStackConfig (I/O).
 * Uses temporary directories to avoid polluting the project.
 *
 * @module cloud-ops/staging/config-intake.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validateConfigFile,
  stageOpenStackConfig,
  SUPPORTED_CONFIG_TYPES,
} from './config-intake.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'config-intake-test-'));
}

// ---------------------------------------------------------------------------
// validateConfigFile -- globals
// ---------------------------------------------------------------------------

describe('validateConfigFile -- globals', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('accepts valid globals YAML with key-value pairs', () => {
    const content = `---
kolla_base_distro: "ubuntu"
kolla_install_type: "source"
network_interface: "eth0"
`;
    const result = validateConfigFile(content, 'globals');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.configType).toBe('globals');
  });

  it('rejects empty content', () => {
    const result = validateConfigFile('', 'globals');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects content with no YAML key-value pairs', () => {
    const content = `# This is just a comment
# Nothing else here`;
    const result = validateConfigFile(content, 'globals');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('key-value'))).toBe(true);
  });

  it('rejects content with unbalanced curly braces', () => {
    const content = `kolla_base_distro: "ubuntu"
bad_key: { unclosed`;
    const result = validateConfigFile(content, 'globals');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('curly braces'))).toBe(true);
  });

  it('adds a warning for multi-document YAML', () => {
    const content = `---
kolla_base_distro: "ubuntu"
---
another_doc: true
`;
    const result = validateConfigFile(content, 'globals');
    expect(result.warnings.some(w => w.includes('multiple YAML documents'))).toBe(true);
  });

  it('configType in result matches argument', () => {
    const result = validateConfigFile('kolla_base_distro: ubuntu', 'globals');
    expect(result.configType).toBe('globals');
  });
});

// ---------------------------------------------------------------------------
// validateConfigFile -- passwords
// ---------------------------------------------------------------------------

describe('validateConfigFile -- passwords', () => {
  it('accepts valid passwords YAML', () => {
    const content = `keystone_admin_password: "supersecret"
database_password: "dbpass"
rabbitmq_password: "mqpass"
`;
    const result = validateConfigFile(content, 'passwords');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects malformed YAML with unbalanced brackets', () => {
    const content = `keystone_admin_password: "secret"
broken: [unclosed`;
    const result = validateConfigFile(content, 'passwords');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('square brackets'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateConfigFile -- inventory
// ---------------------------------------------------------------------------

describe('validateConfigFile -- inventory', () => {
  it('accepts inventory with [control] group header', () => {
    const content = `[control]
controller01 ansible_host=192.168.1.10

[compute]
compute01 ansible_host=192.168.1.20
`;
    const result = validateConfigFile(content, 'inventory');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts inventory with only [all] group header', () => {
    const content = `[all]
node01 ansible_host=192.168.1.10
`;
    const result = validateConfigFile(content, 'inventory');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects inventory without any group headers', () => {
    const content = `controller01 ansible_host=192.168.1.10
compute01 ansible_host=192.168.1.20`;
    const result = validateConfigFile(content, 'inventory');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('group header'))).toBe(true);
  });

  it('warns when [control] group is missing from non-[all] inventory', () => {
    const content = `[storage]
storage01 ansible_host=192.168.1.30
`;
    const result = validateConfigFile(content, 'inventory');
    expect(result.valid).toBe(true);
    expect(result.warnings.some(w => w.includes('[control]'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateConfigFile -- certificates
// ---------------------------------------------------------------------------

describe('validateConfigFile -- certificates', () => {
  it('accepts valid PEM certificate content', () => {
    const content = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJrEaVN...
-----END CERTIFICATE-----`;
    const result = validateConfigFile(content, 'certificates');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects content without PEM header', () => {
    const content = `This is not a certificate`;
    const result = validateConfigFile(content, 'certificates');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('PEM block header'))).toBe(true);
  });

  it('rejects PEM with BEGIN but no END', () => {
    const content = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJrEaVN...`;
    const result = validateConfigFile(content, 'certificates');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('footer'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateConfigFile -- custom
// ---------------------------------------------------------------------------

describe('validateConfigFile -- custom', () => {
  it('accepts any non-empty content', () => {
    const result = validateConfigFile('anything goes here', 'custom');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('adds advisory warning about no structural validation', () => {
    const result = validateConfigFile('content', 'custom');
    expect(result.warnings.some(w => w.includes('no structural validation'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stageOpenStackConfig -- file I/O
// ---------------------------------------------------------------------------

describe('stageOpenStackConfig', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('creates the cloud-ops inbox directory if it does not exist', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    await stageOpenStackConfig({
      basePath: base,
      filename: 'globals.yml',
      content: 'kolla_base_distro: ubuntu',
      configType: 'globals',
      source: 'test',
    });

    expect(existsSync(join(base, '.planning/staging/inbox/cloud-ops'))).toBe(true);
  });

  it('writes config file to the correct path', async () => {
    const base = createTempDir();
    tempDirs.push(base);
    const content = 'kolla_base_distro: ubuntu\nnetwork_interface: eth0';

    const result = await stageOpenStackConfig({
      basePath: base,
      filename: 'globals.yml',
      content,
      configType: 'globals',
      source: 'test',
    });

    expect(existsSync(result.documentPath)).toBe(true);
    expect(readFileSync(result.documentPath, 'utf-8')).toBe(content);
    expect(result.documentPath).toContain('cloud-ops');
    expect(result.documentPath.endsWith('globals.yml')).toBe(true);
  });

  it('writes companion metadata file alongside the config', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await stageOpenStackConfig({
      basePath: base,
      filename: 'passwords.yml',
      content: 'keystone_admin_password: secret',
      configType: 'passwords',
      source: 'dashboard',
    });

    expect(existsSync(result.metadataPath)).toBe(true);
    expect(result.metadataPath.endsWith('passwords.yml.meta.json')).toBe(true);

    const meta = JSON.parse(readFileSync(result.metadataPath, 'utf-8'));
    expect(meta.source).toBe('dashboard');
    expect(meta.status).toBe('inbox');
    expect(meta.configType).toBe('passwords');
    expect(typeof meta.submitted_at).toBe('string');
    expect(meta.validation).toBeDefined();
  });

  it('includes validation result in metadata', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await stageOpenStackConfig({
      basePath: base,
      filename: 'globals.yml',
      content: 'kolla_base_distro: ubuntu',
      configType: 'globals',
      source: 'cli',
    });

    const meta = JSON.parse(readFileSync(result.metadataPath, 'utf-8'));
    expect(meta.validation.valid).toBe(true);
    expect(Array.isArray(meta.validation.errors)).toBe(true);
    expect(Array.isArray(meta.validation.warnings)).toBe(true);
  });

  it('returns validation result in the return value', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    const result = await stageOpenStackConfig({
      basePath: base,
      filename: 'globals.yml',
      content: 'kolla_base_distro: ubuntu',
      configType: 'globals',
      source: 'test',
    });

    expect(result.validation.valid).toBe(true);
    expect(result.validation.configType).toBe('globals');
  });

  it('stages invalid config files (validation does not block staging)', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    // Invalid: inventory without group headers
    const result = await stageOpenStackConfig({
      basePath: base,
      filename: 'inventory',
      content: 'not a valid inventory',
      configType: 'inventory',
      source: 'test',
    });

    // File still staged
    expect(existsSync(result.documentPath)).toBe(true);
    // But validation reports failure
    expect(result.validation.valid).toBe(false);
  });

  it('handles multiple staged files without collision', async () => {
    const base = createTempDir();
    tempDirs.push(base);

    await stageOpenStackConfig({
      basePath: base,
      filename: 'globals.yml',
      content: 'kolla_base_distro: ubuntu',
      configType: 'globals',
      source: 'test',
    });

    await stageOpenStackConfig({
      basePath: base,
      filename: 'passwords.yml',
      content: 'keystone_admin_password: secret',
      configType: 'passwords',
      source: 'test',
    });

    expect(existsSync(join(base, '.planning/staging/inbox/cloud-ops/globals.yml'))).toBe(true);
    expect(existsSync(join(base, '.planning/staging/inbox/cloud-ops/passwords.yml'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SUPPORTED_CONFIG_TYPES constant
// ---------------------------------------------------------------------------

describe('SUPPORTED_CONFIG_TYPES', () => {
  it('has entries for all five config types', () => {
    const types = ['globals', 'passwords', 'inventory', 'certificates', 'custom'];
    for (const t of types) {
      expect(SUPPORTED_CONFIG_TYPES).toHaveProperty(t);
    }
  });
});
