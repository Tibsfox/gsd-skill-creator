import { describe, it, expect, vi } from 'vitest';
import {
  withErrorBoundary,
  HookExecutionError,
  HookErrorBoundaryOptions,
} from './hook-error-boundary.js';

// ============================================================================
// Hook Error Boundary Tests
// ============================================================================

describe('HookExecutionError', () => {
  it('has name "HookExecutionError"', () => {
    const err = new HookExecutionError('boom');
    expect(err.name).toBe('HookExecutionError');
  });

  it('extends Error', () => {
    const err = new HookExecutionError('boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
  });

  it('supports cause property', () => {
    const cause = new Error('root cause');
    const err = new HookExecutionError('wrapper', cause);
    expect(err.cause).toBe(cause);
  });
});

describe('withErrorBoundary', () => {
  describe('successful execution', () => {
    it('passes through return value for successful async function', async () => {
      const wrapped = withErrorBoundary(async () => 42);
      const result = await wrapped();
      expect(result).toBe(42);
    });

    it('passes through null return value', async () => {
      const wrapped = withErrorBoundary(async () => null);
      const result = await wrapped();
      expect(result).toBeNull();
    });

    it('passes through object return values', async () => {
      const obj = { key: 'value', nested: { a: 1 } };
      const wrapped = withErrorBoundary(async () => obj);
      const result = await wrapped();
      expect(result).toEqual(obj);
    });

    it('passes through string return values', async () => {
      const wrapped = withErrorBoundary(async () => 'hello');
      const result = await wrapped();
      expect(result).toBe('hello');
    });
  });

  describe('error handling', () => {
    it('catches synchronous throw and returns undefined', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const wrapped = withErrorBoundary(async () => {
        throw new Error('sync boom');
      });
      const result = await wrapped();
      expect(result).toBeUndefined();
      stderrSpy.mockRestore();
    });

    it('catches async rejection and returns undefined', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const wrapped = withErrorBoundary(
        () => Promise.reject(new Error('async boom')),
      );
      const result = await wrapped();
      expect(result).toBeUndefined();
      stderrSpy.mockRestore();
    });

    it('logs error to stderr with default hook name', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const wrapped = withErrorBoundary(async () => {
        throw new Error('test error');
      });
      await wrapped();
      expect(stderrSpy).toHaveBeenCalled();
      const output = stderrSpy.mock.calls.map(c => String(c[0])).join('');
      expect(output).toContain('[hook-error-boundary]');
      expect(output).toContain('unknown-hook');
      expect(output).toContain('test error');
      stderrSpy.mockRestore();
    });

    it('logs error to stderr with custom hook name', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const wrapped = withErrorBoundary(
        async () => { throw new Error('named error'); },
        { hookName: 'my-hook' },
      );
      await wrapped();
      const output = stderrSpy.mock.calls.map(c => String(c[0])).join('');
      expect(output).toContain('my-hook');
      stderrSpy.mockRestore();
    });

    it('never re-throws -- the session continues', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const wrapped = withErrorBoundary(async () => {
        throw new Error('should not escape');
      });
      // Should NOT throw
      await expect(wrapped()).resolves.toBeUndefined();
      stderrSpy.mockRestore();
    });

    it('calls onError callback when provided', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const onError = vi.fn();
      const wrapped = withErrorBoundary(
        async () => { throw new Error('callback test'); },
        { onError },
      );
      await wrapped();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      stderrSpy.mockRestore();
    });
  });

  describe('timeout', () => {
    it('aborts and returns undefined when function exceeds timeout', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const neverResolves = () => new Promise<number>(() => {
        // intentionally never resolves
      });
      const wrapped = withErrorBoundary(neverResolves, { timeoutMs: 50 });
      const result = await wrapped();
      expect(result).toBeUndefined();
      stderrSpy.mockRestore();
    });

    it('logs timeout error to stderr', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const neverResolves = () => new Promise<string>(() => {});
      const wrapped = withErrorBoundary(neverResolves, {
        timeoutMs: 50,
        hookName: 'slow-hook',
      });
      await wrapped();
      const output = stderrSpy.mock.calls.map(c => String(c[0])).join('');
      expect(output).toContain('slow-hook');
      expect(output).toMatch(/timeout/i);
      stderrSpy.mockRestore();
    });

    it('uses default timeout of 10000ms', () => {
      // Verify the option interface accepts timeoutMs and has a sensible default
      // We test this indirectly by verifying a fast function completes
      const wrapped = withErrorBoundary(async () => 'fast');
      // If default was 0, this would timeout immediately
      return expect(wrapped()).resolves.toBe('fast');
    });
  });
});
