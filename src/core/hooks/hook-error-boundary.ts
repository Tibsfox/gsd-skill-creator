// ============================================================================
// Hook Error Boundary
// ============================================================================
// Wraps hook execution to catch errors and enforce timeouts, preventing
// bugs in hook code from crashing or hanging Claude Code sessions.
// Errors are caught, logged to stderr, and the session continues.

/**
 * Custom error for hook execution failures.
 */
export class HookExecutionError extends Error {
  override name = 'HookExecutionError' as const;

  constructor(message: string, cause?: Error) {
    super(message);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Options for withErrorBoundary wrapper.
 */
export interface HookErrorBoundaryOptions {
  /** Hook name for logging context (default: 'unknown-hook') */
  hookName?: string;
  /** Timeout in milliseconds (default: 10_000) */
  timeoutMs?: number;
  /** Optional error callback */
  onError?: (error: Error) => void;
}

/**
 * Wrap an async hook function with error boundary and timeout protection.
 *
 * - If the function throws synchronously, catches and returns undefined
 * - If the function rejects (async error), catches and returns undefined
 * - If the function exceeds the timeout, aborts and returns undefined
 * - If the function succeeds, passes through the return value unchanged
 * - Errors are logged to stderr with hook name context
 * - The original error is never re-thrown
 *
 * @param fn - Async function to wrap
 * @param options - Configuration for hook name, timeout, error callback
 * @returns Wrapped function that never throws
 */
export function withErrorBoundary<T>(
  fn: () => Promise<T>,
  options?: HookErrorBoundaryOptions,
): () => Promise<T | undefined> {
  const hookName = options?.hookName ?? 'unknown-hook';
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const onError = options?.onError;

  return async (): Promise<T | undefined> => {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_resolve, reject) => {
          setTimeout(() => {
            reject(
              new HookExecutionError(
                `Hook "${hookName}" timeout after ${timeoutMs}ms`,
              ),
            );
          }, timeoutMs);
        }),
      ]);
      return result;
    } catch (err: unknown) {
      const error =
        err instanceof Error ? err : new Error(String(err));

      process.stderr.write(
        `[hook-error-boundary] ${hookName}: ${error.message}\n`,
      );

      if (onError) {
        onError(error);
      }

      return undefined;
    }
  };
}
