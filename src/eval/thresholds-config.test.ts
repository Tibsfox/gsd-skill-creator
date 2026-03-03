/**
 * Tests for ThresholdsConfigLoader.
 *
 * Covers: loadFromFile() success and fallback, getThresholdForChip() with
 * chip-specific overrides and default fallback, getStatus() boundary conditions
 * including exact-equality tolerance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { ThresholdsConfigLoader, DEFAULT_PASS_RATE_THRESHOLD } from './thresholds-config.js';

// ============================================================================
// Mock helpers
// ============================================================================

vi.mock('node:fs/promises');

const mockReadFile = vi.mocked(fs.readFile);

const validConfigJson = JSON.stringify({
  version: 1,
  defaultPassRate: 0.8,
  chips: {
    ollama: { passRate: 0.7 },
    anthropic: { passRate: 0.9 },
  },
});

// ============================================================================
// loadFromFile()
// ============================================================================

describe('ThresholdsConfigLoader.loadFromFile()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and validates thresholds.json from configPath', async () => {
    mockReadFile.mockResolvedValueOnce(validConfigJson);
    const loader = new ThresholdsConfigLoader('/tmp/test-thresholds.json');
    const config = await loader.loadFromFile();

    expect(config.version).toBe(1);
    expect(config.defaultPassRate).toBe(0.8);
    expect(config.chips['ollama'].passRate).toBe(0.7);
  });

  it('returns default config when file is missing (ENOENT)', async () => {
    const enoentError = Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' });
    mockReadFile.mockRejectedValueOnce(enoentError);

    const loader = new ThresholdsConfigLoader('/tmp/nonexistent.json');
    const config = await loader.loadFromFile();

    expect(config.version).toBe(1);
    expect(config.defaultPassRate).toBe(DEFAULT_PASS_RATE_THRESHOLD);
    expect(config.chips).toEqual({});
  });

  it('throws on malformed JSON', async () => {
    mockReadFile.mockResolvedValueOnce('{ not valid json }');
    const loader = new ThresholdsConfigLoader('/tmp/bad.json');

    await expect(loader.loadFromFile()).rejects.toThrow();
  });

  it('throws on schema validation failure (wrong version)', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({
      version: 2,
      defaultPassRate: 0.75,
      chips: {},
    }));
    const loader = new ThresholdsConfigLoader('/tmp/wrong-version.json');

    await expect(loader.loadFromFile()).rejects.toThrow();
  });

  it('throws on non-ENOENT file system errors', async () => {
    const permError = Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
    mockReadFile.mockRejectedValueOnce(permError);

    const loader = new ThresholdsConfigLoader('/tmp/restricted.json');
    await expect(loader.loadFromFile()).rejects.toThrow('EACCES');
  });

  it('defaults configPath to process.cwd()/thresholds.json when not provided', async () => {
    mockReadFile.mockResolvedValueOnce(validConfigJson);
    const loader = new ThresholdsConfigLoader();
    await loader.loadFromFile();

    const expectedPath = path.join(process.cwd(), 'thresholds.json');
    expect(mockReadFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
  });
});

// ============================================================================
// getThresholdForChip()
// ============================================================================

describe('ThresholdsConfigLoader.getThresholdForChip()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns chip-specific passRate when chip is configured', async () => {
    mockReadFile.mockResolvedValueOnce(validConfigJson);
    const loader = new ThresholdsConfigLoader('/tmp/test.json');
    await loader.loadFromFile();

    expect(loader.getThresholdForChip('ollama')).toBe(0.7);
    expect(loader.getThresholdForChip('anthropic')).toBe(0.9);
  });

  it('returns defaultPassRate when chip is not configured', async () => {
    mockReadFile.mockResolvedValueOnce(validConfigJson);
    const loader = new ThresholdsConfigLoader('/tmp/test.json');
    await loader.loadFromFile();

    expect(loader.getThresholdForChip('nonexistent')).toBe(0.8);
  });

  it('throws if loadFromFile() has not been called', () => {
    const loader = new ThresholdsConfigLoader('/tmp/test.json');
    expect(() => loader.getThresholdForChip('ollama')).toThrow();
  });
});

// ============================================================================
// getStatus()
// ============================================================================

describe('ThresholdsConfigLoader.getStatus()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function makeLoadedLoader(): Promise<ThresholdsConfigLoader> {
    mockReadFile.mockResolvedValueOnce(validConfigJson);
    const loader = new ThresholdsConfigLoader('/tmp/test.json');
    await loader.loadFromFile();
    return loader;
  }

  it('returns "above" when passRate is above chip threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.8
    expect(loader.getStatus(0.8, 'ollama')).toBe('above');
  });

  it('returns "below" when passRate is below chip threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.5
    expect(loader.getStatus(0.5, 'ollama')).toBe('below');
  });

  it('returns "at" when passRate exactly equals chip threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.7
    expect(loader.getStatus(0.7, 'ollama')).toBe('at');
  });

  it('returns "at" when passRate is within tolerance of threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.7009 (within 0.001 tolerance)
    expect(loader.getStatus(0.7009, 'ollama')).toBe('at');
  });

  it('returns "above" when passRate is just outside tolerance above threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.7011 (just outside 0.001 tolerance above)
    expect(loader.getStatus(0.7011, 'ollama')).toBe('above');
  });

  it('returns "below" when passRate is just outside tolerance below threshold', async () => {
    const loader = await makeLoadedLoader();
    // ollama threshold = 0.7, passRate = 0.6989 (just outside 0.001 tolerance below)
    expect(loader.getStatus(0.6989, 'ollama')).toBe('below');
  });

  it('falls back to defaultPassRate for unknown chip', async () => {
    const loader = await makeLoadedLoader();
    // default threshold = 0.8, passRate = 0.9 -> 'above'
    expect(loader.getStatus(0.9, 'unknown-chip')).toBe('above');
    // default threshold = 0.8, passRate = 0.6 -> 'below'
    expect(loader.getStatus(0.6, 'unknown-chip')).toBe('below');
    // default threshold = 0.8, passRate = 0.8 -> 'at'
    expect(loader.getStatus(0.8, 'unknown-chip')).toBe('at');
  });
});

// ============================================================================
// DEFAULT_PASS_RATE_THRESHOLD re-export
// ============================================================================

describe('DEFAULT_PASS_RATE_THRESHOLD (re-export from thresholds-config)', () => {
  it('is 0.75', () => {
    expect(DEFAULT_PASS_RATE_THRESHOLD).toBe(0.75);
  });
});
