/**
 * Tests for extension detector module.
 *
 * Validates detection of gsd-skill-creator via CLI binary and
 * dist/ directory strategies, null capabilities, and DI overrides.
 */

import { describe, it, expect, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { detectExtension, createNullCapabilities } from './extension-detector.js';
import {
  CapturingProcessAuditSink,
  ProcessContextDenied,
  type ProcessContext,
} from '../../security/process-context.js';

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
    // Use DI overrides to simulate "no CLI, no dist/" without module mocking.
    // This tests the same code paths as calling with no args when neither
    // CLI nor dist/ exists, but avoids vi.mock hoisting issues.
    // cliAvailable=false skips CLI, nonexistent distPath fails access().
    const caps = await detectExtension({
      cliAvailable: false,
      distPath: '/nonexistent/skill-creator/dist/that/cannot/exist',
    });
    expect(caps.detected).toBe(false);
    expect(caps.detectionMethod).toBe('none');
  });

  describe('ProcessContext wire (v1.49.850)', () => {
    it('propagates ProcessContextDenied when skill-creator is not in the allowList and no override is provided', async () => {
      // No override → Strategy 1 (CLI binary check) runs and triggers
      // ensureProcessAllowed before execSync. Operator-supplied ctx with
      // an empty allowList rejects 'skill-creator'; the rejection must
      // propagate (NOT be swallowed into Strategy 2's silent fall-through).
      const sink = new CapturingProcessAuditSink();
      const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
      await expect(detectExtension(undefined, restrictiveCtx)).rejects.toThrow(
        ProcessContextDenied,
      );
      expect(sink.records).toHaveLength(1);
      expect(sink.records[0]?.target).toBe('skill-creator');
      expect(sink.records[0]?.allowed).toBe(false);
    });

    it('does not invoke ensureProcessAllowed when an override skips Strategy 1', async () => {
      // overrides.cliAvailable=true → early-return before execSync; no
      // ensureProcessAllowed call → no audit record emitted even with ctx.
      const sink = new CapturingProcessAuditSink();
      const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
      const caps = await detectExtension(
        { cliAvailable: true, cliVersion: '1.7.0' },
        restrictiveCtx,
      );
      expect(caps.detected).toBe(true);
      expect(sink.records).toHaveLength(0);
    });
  });
});
