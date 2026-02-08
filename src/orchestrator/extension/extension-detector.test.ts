/**
 * Tests for extension detector module.
 *
 * Validates detection of gsd-skill-creator via CLI binary and
 * dist/ directory strategies, null capabilities, and DI overrides.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { detectExtension, createNullCapabilities } from './extension-detector.js';

describe('createNullCapabilities', () => {
  it('returns object with detected=false', () => {
    const caps = createNullCapabilities();
    expect(caps.detected).toBe(false);
  });

  it('returns all features disabled', () => {
    const caps = createNullCapabilities();
    expect(caps.features.semanticClassification).toBe(false);
    expect(caps.features.enhancedDiscovery).toBe(false);
    expect(caps.features.enhancedLifecycle).toBe(false);
    expect(caps.features.customSkillCreation).toBe(false);
  });

  it('returns detectionMethod "none"', () => {
    const caps = createNullCapabilities();
    expect(caps.detectionMethod).toBe('none');
  });

  it('returns version null', () => {
    const caps = createNullCapabilities();
    expect(caps.version).toBeNull();
  });
});

describe('detectExtension', () => {
  it('returns detected=true with cli-binary method when CLI is available', async () => {
    const caps = await detectExtension({ cliAvailable: true, cliVersion: '1.7.0' });
    expect(caps.detected).toBe(true);
    expect(caps.detectionMethod).toBe('cli-binary');
    expect(caps.version).toBe('1.7.0');
  });

  it('returns all features enabled when detected via CLI', async () => {
    const caps = await detectExtension({ cliAvailable: true });
    expect(caps.features.semanticClassification).toBe(true);
    expect(caps.features.enhancedDiscovery).toBe(true);
    expect(caps.features.enhancedLifecycle).toBe(true);
    expect(caps.features.customSkillCreation).toBe(true);
  });

  it('returns detected=true with dist-directory method when dist/ exists', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ext-detect-'));
    try {
      const caps = await detectExtension({ cliAvailable: false, distPath: tempDir });
      expect(caps.detected).toBe(true);
      expect(caps.detectionMethod).toBe('dist-directory');
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });

  it('returns version null when detected via dist/ (no CLI)', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ext-detect-'));
    try {
      const caps = await detectExtension({ cliAvailable: false, distPath: tempDir });
      expect(caps.version).toBeNull();
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });

  it('returns null capabilities when neither CLI nor dist/ available', async () => {
    const caps = await detectExtension({
      cliAvailable: false,
      distPath: '/nonexistent/path/that/does/not/exist',
    });
    expect(caps.detected).toBe(false);
    expect(caps.detectionMethod).toBe('none');
    expect(caps.features.semanticClassification).toBe(false);
    expect(caps.features.enhancedDiscovery).toBe(false);
    expect(caps.features.enhancedLifecycle).toBe(false);
    expect(caps.features.customSkillCreation).toBe(false);
  });

  it('CLI detection takes priority over dist/ detection', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'ext-detect-'));
    try {
      const caps = await detectExtension({
        cliAvailable: true,
        cliVersion: '1.7.0',
        distPath: tempDir,
      });
      expect(caps.detectionMethod).toBe('cli-binary');
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });

  it('handles missing overrides (no args) gracefully', async () => {
    // Mock child_process.execSync to throw (CLI not available)
    vi.mock('node:child_process', () => ({
      execSync: vi.fn(() => {
        throw new Error('Command not found: skill-creator');
      }),
    }));

    // Mock fs/promises access to reject (dist/ not available)
    const originalAccess = (await import('node:fs/promises')).access;
    vi.mock('node:fs/promises', async (importOriginal) => {
      const mod = await importOriginal<typeof import('node:fs/promises')>();
      return {
        ...mod,
        access: vi.fn(() => Promise.reject(new Error('ENOENT'))),
      };
    });

    // Re-import to pick up mocks
    const { detectExtension: detectFresh } = await import('./extension-detector.js');
    const caps = await detectFresh();
    expect(caps.detected).toBe(false);
    expect(caps.detectionMethod).toBe('none');

    vi.restoreAllMocks();
  });
});
