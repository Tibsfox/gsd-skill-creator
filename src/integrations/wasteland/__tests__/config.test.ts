import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, saveConfig, HopConfigSchema } from '../config.js';
import type { HopConfig } from '../config.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ZodError } from 'zod';

// Minimal valid config for testing
const validConfig: HopConfig = {
  handle: 'fox',
  display_name: 'Foxy',
  type: 'human',
  dolthub_org: 'tibsfox',
  email: 'fox@example.com',
  wastelands: [
    {
      upstream: 'hop/wl-commons',
      fork: 'tibsfox/wl-commons',
      local_dir: '/home/fox/wl-commons',
      joined_at: '2026-03-06T00:00:00.000Z',
    },
  ],
  schema_version: '1.0',
  mvr_version: '0.1',
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hop-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('saveConfig', () => {
  it('creates <configDir>/.hop/config.json', async () => {
    await saveConfig(validConfig, tmpDir);
    const configPath = path.join(tmpDir, '.hop', 'config.json');
    const stat = await fs.stat(configPath);
    expect(stat.isFile()).toBe(true);
  });

  it('saved JSON is parseable and matches the saved object', async () => {
    await saveConfig(validConfig, tmpDir);
    const configPath = path.join(tmpDir, '.hop', 'config.json');
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as HopConfig;
    expect(parsed).toEqual(validConfig);
  });

  it('creates .hop/ directory if it does not exist', async () => {
    const hopDir = path.join(tmpDir, '.hop');
    // Verify dir does not exist yet
    await expect(fs.stat(hopDir)).rejects.toThrow();
    await saveConfig(validConfig, tmpDir);
    const stat = await fs.stat(hopDir);
    expect(stat.isDirectory()).toBe(true);
  });

  it('overwrites existing config file (idempotent)', async () => {
    await saveConfig(validConfig, tmpDir);
    const modified: HopConfig = { ...validConfig, display_name: 'Updated Foxy' };
    await saveConfig(modified, tmpDir);
    const configPath = path.join(tmpDir, '.hop', 'config.json');
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as HopConfig;
    expect(parsed.display_name).toBe('Updated Foxy');
  });
});

describe('loadConfig', () => {
  it('round-trip: save then load returns same data', async () => {
    await saveConfig(validConfig, tmpDir);
    const loaded = await loadConfig(tmpDir);
    expect(loaded).toEqual(validConfig);
  });

  it('throws descriptive error mentioning "wl config init" when file does not exist', async () => {
    await expect(loadConfig(tmpDir)).rejects.toThrow('wl config init');
  });

  it('throws descriptive error when config file contains invalid JSON', async () => {
    const hopDir = path.join(tmpDir, '.hop');
    await fs.mkdir(hopDir, { recursive: true });
    await fs.writeFile(path.join(hopDir, 'config.json'), 'not valid json { broken');
    await expect(loadConfig(tmpDir)).rejects.toThrow('wl config init');
  });

  it('throws descriptive error when config has wrong schema shape', async () => {
    const hopDir = path.join(tmpDir, '.hop');
    await fs.mkdir(hopDir, { recursive: true });
    // Missing required fields
    await fs.writeFile(path.join(hopDir, 'config.json'), JSON.stringify({ handle: 'fox' }));
    await expect(loadConfig(tmpDir)).rejects.toThrow(/validation failed/i);
  });
});

describe('HopConfigSchema', () => {
  it('parse succeeds for a well-formed config', () => {
    const result = HopConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('parse throws ZodError when required fields are missing', () => {
    expect(() => HopConfigSchema.parse({ handle: 'fox' })).toThrow(ZodError);
  });
});
