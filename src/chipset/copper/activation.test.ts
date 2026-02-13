/**
 * Tests for PipelineActivationDispatch -- routes MOVE instructions to
 * lite/full/offload/async activation modes with pluggable resolvers.
 */

import { describe, it, expect, vi } from 'vitest';
import type { MoveInstruction } from './types.js';
import type { OffloadOperation, OffloadResult } from '../blitter/types.js';
import { PipelineActivationDispatch } from './activation.js';
import type { ActivationContext, ActivationResult } from './activation.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a MOVE instruction with defaults. */
function move(
  overrides: Partial<MoveInstruction> = {},
): MoveInstruction {
  return {
    type: 'move',
    target: 'skill',
    name: 'test-skill',
    mode: 'lite',
    ...overrides,
  };
}

/** Create a minimal OffloadOperation. */
function offloadOp(overrides: Partial<OffloadOperation> = {}): OffloadOperation {
  return {
    id: 'lint:fix',
    script: 'echo lint',
    scriptType: 'bash',
    workingDir: '.',
    timeout: 5000,
    env: {},
    ...overrides,
  };
}

/** Create a minimal OffloadResult. */
function offloadResult(overrides: Partial<OffloadResult> = {}): OffloadResult {
  return {
    operationId: 'lint:fix',
    exitCode: 0,
    stdout: 'lint',
    stderr: '',
    durationMs: 100,
    timedOut: false,
    ...overrides,
  };
}

// ============================================================================
// Lite Mode Tests
// ============================================================================

describe('PipelineActivationDispatch', () => {
  describe('lite mode', () => {
    it('returns ~200 token estimate on success', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => ({
          path: '.claude/commands/git-commit.md',
          content: '# Git commit skill...(full content)',
        }),
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'git-commit', mode: 'lite' }),
      );

      expect(result.status).toBe('success');
      expect(result.mode).toBe('lite');
      expect(result.tokenEstimate).toBe(200);
      expect(result.name).toBe('git-commit');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('returns failure when skill is not found', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => undefined,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'missing-skill', mode: 'lite' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/not found/i);
    });
  });

  // ============================================================================
  // Full Mode Tests
  // ============================================================================

  describe('full mode', () => {
    it('returns token estimate based on content length', async () => {
      const content = 'x'.repeat(500);
      const ctx: ActivationContext = {
        resolveSkill: async () => ({
          path: '.claude/commands/big-skill.md',
          content,
        }),
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'big-skill', mode: 'full' }),
      );

      expect(result.status).toBe('success');
      expect(result.mode).toBe('full');
      expect(result.tokenEstimate).toBe(Math.ceil(500 / 4));
    });

    it('returns failure when skill is not found', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => undefined,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'missing-skill', mode: 'full' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/not found/i);
    });
  });

  // ============================================================================
  // Offload Mode Tests
  // ============================================================================

  describe('offload mode', () => {
    it('executes script target via offload', async () => {
      const op = offloadOp();
      const res = offloadResult();
      const ctx: ActivationContext = {
        resolveScript: async () => op,
        executeOffload: async () => res,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'script', name: 'lint-fix', mode: 'offload' }),
      );

      expect(result.status).toBe('success');
      expect(result.mode).toBe('offload');
    });

    it('executes skill target that has been promoted to script via offload', async () => {
      const op = offloadOp({ id: 'skill:promoted' });
      const res = offloadResult({ operationId: 'skill:promoted' });
      const ctx: ActivationContext = {
        resolveSkill: async () => ({
          path: '.claude/commands/promoted.md',
          content: '# promoted skill',
        }),
        resolveScript: async () => op,
        executeOffload: async () => res,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'skill', name: 'promoted', mode: 'offload' }),
      );

      expect(result.status).toBe('success');
    });

    it('returns failure when script is not found', async () => {
      const ctx: ActivationContext = {
        resolveScript: async () => undefined,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'script', name: 'missing-script', mode: 'offload' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/not found/i);
    });

    it('returns failure when executeOffload reports non-zero exit code', async () => {
      const op = offloadOp();
      const res = offloadResult({ exitCode: 1 });
      const ctx: ActivationContext = {
        resolveScript: async () => op,
        executeOffload: async () => res,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'script', name: 'lint-fix', mode: 'offload' }),
      );

      expect(result.status).toBe('failure');
    });
  });

  // ============================================================================
  // Async Mode Tests
  // ============================================================================

  describe('async mode', () => {
    it('fires and returns immediately without waiting', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => {
          await new Promise((r) => setTimeout(r, 100));
          return {
            path: '.claude/commands/slow.md',
            content: '# slow skill',
          };
        },
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'slow-skill', mode: 'async' }),
      );

      expect(result.status).toBe('success');
      expect(result.durationMs).toBeLessThan(50);
    });

    it('does not propagate errors (fire-and-forget)', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => {
          throw new Error('background failure');
        },
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'failing-skill', mode: 'async' }),
      );

      expect(result.status).toBe('success');
    });
  });

  // ============================================================================
  // Team Target Tests
  // ============================================================================

  describe('team target', () => {
    it('resolves team definition with full mode', async () => {
      const ctx: ActivationContext = {
        resolveTeam: async () => ({
          name: 'review-team',
          members: ['reviewer', 'linter'],
        }),
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'team', name: 'review-team', mode: 'full' }),
      );

      expect(result.status).toBe('success');
      expect(result.target).toBe('team');
    });

    it('returns failure when team is not found', async () => {
      const ctx: ActivationContext = {
        resolveTeam: async () => undefined,
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'team', name: 'missing-team', mode: 'full' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/not found/i);
    });
  });

  // ============================================================================
  // Edge Case Tests
  // ============================================================================

  describe('edge cases', () => {
    it('passes args through activation', async () => {
      let receivedName: string | undefined;
      const ctx: ActivationContext = {
        resolveSkill: async (name) => {
          receivedName = name;
          return {
            path: '.claude/commands/deploy.md',
            content: '# deploy skill',
          };
        },
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const instruction = move({
        name: 'deploy',
        mode: 'lite',
        args: { branch: 'main', message: 'initial' },
      });
      const result = await dispatch.activate(instruction);

      expect(result.status).toBe('success');
      expect(receivedName).toBe('deploy');
    });

    it('handles thrown exceptions gracefully', async () => {
      const ctx: ActivationContext = {
        resolveSkill: async () => {
          throw new Error('disk failure');
        },
      };
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ name: 'broken-skill', mode: 'full' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/disk failure/);
    });

    it('returns failure when no resolver is configured for target type', async () => {
      const ctx: ActivationContext = {};
      const dispatch = new PipelineActivationDispatch(ctx);
      const result = await dispatch.activate(
        move({ target: 'skill', name: 'any-skill', mode: 'lite' }),
      );

      expect(result.status).toBe('failure');
      expect(result.error).toMatch(/no resolver/i);
    });
  });
});
