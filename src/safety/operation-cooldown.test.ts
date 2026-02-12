import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { OperationCooldown, DEFAULT_COOLDOWNS } from './operation-cooldown.js';
import type { CooldownConfig, CooldownCheckResult } from './operation-cooldown.js';

// ============================================================================
// OperationCooldown Tests
// ============================================================================

describe('OperationCooldown', () => {
  let tmpDir: string;
  let statePath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cooldown-test-'));
    statePath = join(tmpDir, '.cooldown-state.json');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // check() tests
  // --------------------------------------------------------------------------

  describe('check()', () => {
    it('should allow first invocation (no prior record)', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      const result = await cooldown.check('discover');
      expect(result.allowed).toBe(true);
    });

    it('should deny invocation within cooldown period', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      await cooldown.record('discover');
      const result = await cooldown.check('discover');

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.remainingMs).toBeGreaterThan(0);
        expect(result.remainingMs).toBeLessThanOrEqual(300000);
        expect(result.message).toContain('discover');
        expect(result.message).toContain('cooldown');
      }
    });

    it('should allow invocation after cooldown expires', async () => {
      const cooldown = new OperationCooldown({ discover: 100 }, statePath);

      await cooldown.record('discover');

      // Wait for cooldown to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await cooldown.check('discover');
      expect(result.allowed).toBe(true);
    });

    it('should always allow unconfigured operations', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      // 'unknown-op' is not in config
      const result = await cooldown.check('unknown-op');
      expect(result.allowed).toBe(true);
    });

    it('should track multiple operations independently', async () => {
      const cooldown = new OperationCooldown({
        discover: 300000,
        'corpus-scan': 300000,
      }, statePath);

      await cooldown.record('discover');

      // discover should be in cooldown
      const discoverResult = await cooldown.check('discover');
      expect(discoverResult.allowed).toBe(false);

      // corpus-scan should be allowed (not yet recorded)
      const corpusResult = await cooldown.check('corpus-scan');
      expect(corpusResult.allowed).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // record() tests
  // --------------------------------------------------------------------------

  describe('record()', () => {
    it('should persist timestamp to state file', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      await cooldown.record('discover');

      const content = await readFile(statePath, 'utf-8');
      const state = JSON.parse(content);
      expect(state.discover).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should create parent directories if needed', async () => {
      const nestedPath = join(tmpDir, 'deep', 'nested', 'state.json');
      const cooldown = new OperationCooldown({ discover: 300000 }, nestedPath);

      await cooldown.record('discover');

      const content = await readFile(nestedPath, 'utf-8');
      expect(content).toBeTruthy();
    });

    it('should preserve existing operation timestamps', async () => {
      const cooldown = new OperationCooldown({
        discover: 300000,
        'corpus-scan': 300000,
      }, statePath);

      await cooldown.record('discover');
      await cooldown.record('corpus-scan');

      const content = await readFile(statePath, 'utf-8');
      const state = JSON.parse(content);
      expect(state.discover).toBeDefined();
      expect(state['corpus-scan']).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // reset() tests
  // --------------------------------------------------------------------------

  describe('reset()', () => {
    it('should clear cooldown for specific operation', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      await cooldown.record('discover');

      // Should be in cooldown
      let result = await cooldown.check('discover');
      expect(result.allowed).toBe(false);

      // Reset
      await cooldown.reset('discover');

      // Should be allowed again
      result = await cooldown.check('discover');
      expect(result.allowed).toBe(true);
    });

    it('should not affect other operations', async () => {
      const cooldown = new OperationCooldown({
        discover: 300000,
        'corpus-scan': 300000,
      }, statePath);

      await cooldown.record('discover');
      await cooldown.record('corpus-scan');

      await cooldown.reset('discover');

      // discover should be allowed
      const discoverResult = await cooldown.check('discover');
      expect(discoverResult.allowed).toBe(true);

      // corpus-scan should still be in cooldown
      const corpusResult = await cooldown.check('corpus-scan');
      expect(corpusResult.allowed).toBe(false);
    });

    it('should be no-op for non-existent operation', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      // Should not throw
      await expect(cooldown.reset('nonexistent')).resolves.toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // getState() tests
  // --------------------------------------------------------------------------

  describe('getState()', () => {
    it('should return empty record when no state exists', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);

      const state = await cooldown.getState();
      expect(state).toEqual({});
    });

    it('should return all recorded timestamps', async () => {
      const cooldown = new OperationCooldown({
        discover: 300000,
        'corpus-scan': 300000,
      }, statePath);

      await cooldown.record('discover');
      await cooldown.record('corpus-scan');

      const state = await cooldown.getState();
      expect(Object.keys(state)).toHaveLength(2);
      expect(state.discover).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(state['corpus-scan']).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // --------------------------------------------------------------------------
  // Graceful recovery tests
  // --------------------------------------------------------------------------

  describe('graceful recovery', () => {
    it('should treat corrupt state file as empty', async () => {
      await writeFile(statePath, 'not valid json!!!', 'utf-8');

      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);
      const result = await cooldown.check('discover');
      expect(result.allowed).toBe(true);
    });

    it('should treat missing state file as empty', async () => {
      const cooldown = new OperationCooldown({ discover: 300000 }, statePath);
      const result = await cooldown.check('discover');
      expect(result.allowed).toBe(true);
    });

    it('should persist state across instances', async () => {
      const cooldown1 = new OperationCooldown({ discover: 300000 }, statePath);
      await cooldown1.record('discover');

      // New instance reading same state file
      const cooldown2 = new OperationCooldown({ discover: 300000 }, statePath);
      const result = await cooldown2.check('discover');
      expect(result.allowed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // DEFAULT_COOLDOWNS tests
  // --------------------------------------------------------------------------

  describe('DEFAULT_COOLDOWNS', () => {
    it('should have discover cooldown', () => {
      expect(DEFAULT_COOLDOWNS.discover).toBe(5 * 60 * 1000);
    });

    it('should have corpus-scan cooldown', () => {
      expect(DEFAULT_COOLDOWNS['corpus-scan']).toBe(5 * 60 * 1000);
    });
  });
});
