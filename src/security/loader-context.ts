/**
 * LoaderContext — Tier E security chokepoint for disk loaders.
 *
 * Every loader that reads bytes from the filesystem accepts an optional
 * `LoaderContext`. The context defines:
 *
 *   - `allowList` — patterns the loader is permitted to read.
 *     If a load path does not match any pattern, the loader rejects it
 *     before touching the filesystem.
 *   - `audit` — observation sink that receives one record per load attempt
 *     (allowed or denied). Use to wire central security telemetry.
 *
 * `LoaderContext` is OPTIONAL on every disk-loader entry point. When
 * absent, loaders fall back to the historical permissive behavior so
 * existing call sites continue to work. A `defaultLoaderContext()` helper
 * is provided for tests and call sites that want explicit opt-in to the
 * chokepoint with no restrictions (audit-only).
 *
 * Migration policy: new disk-loaders MUST accept `ctx?: LoaderContext`
 * and route every fs read through `ensureAllowed(ctx, path, op)`.
 * Enforced by `src/security/loader-context-audit.test.ts` (a vitest harness
 * run as part of the standard test suite) which greps for `node:fs` imports
 * in any `src/` path matching `loader.ts` and rejects files lacking either
 * the chokepoint shape or an explicit `Role: NOT a disk loader` header
 * doc comment.
 *
 * Sibling chokepoints (v1.49.806): `EgressContext` for network egress,
 * `ProcessContext` for child-process spawn. See
 * `docs/security-chokepoints.md` for the cross-surface catalog.
 *
 * @module security/loader-context
 */

// ============================================================================
// Pattern matching
// ============================================================================

/**
 * A single allow-list entry.
 *
 *   - `string` — matches if `path === pattern` OR `path.startsWith(pattern)`
 *     when `pattern` ends with `/`. Exact-match for files, prefix-match for
 *     directories.
 *   - `RegExp` — matches if `pattern.test(path)`.
 *   - `(path: string) => boolean` — custom predicate. Returns truthy → allow.
 */
export type PathPattern = string | RegExp | ((path: string) => boolean);

/** Return true when `path` matches any pattern in `allowList`. */
export function matchesAllowList(allowList: readonly PathPattern[], path: string): boolean {
  for (const pat of allowList) {
    if (typeof pat === 'string') {
      if (pat.endsWith('/')) {
        if (path === pat.slice(0, -1) || path.startsWith(pat)) return true;
      } else if (path === pat) {
        return true;
      }
    } else if (pat instanceof RegExp) {
      if (pat.test(path)) return true;
    } else if (typeof pat === 'function') {
      if (pat(path)) return true;
    }
  }
  return false;
}

// ============================================================================
// Audit sink
// ============================================================================

/** Operation tag attached to audit records. Extend as new loader shapes appear. */
export type LoaderOp =
  | 'read-file'
  | 'read-dir'
  | 'exists-check'
  | 'fetch-url'
  | 'load-bundle'
  | 'load-cartridge'
  | 'load-pack'
  | 'load-skill';

/** One row of audit output emitted by a loader. */
export interface LoaderAuditRecord {
  /** Loader module that emitted the record, e.g. `cartridge/loader`. */
  source: string;
  /** Operation being performed. */
  op: LoaderOp;
  /** Filesystem path or URL being acted on. */
  target: string;
  /** Whether the allowList admitted the operation. */
  allowed: boolean;
  /** Time the record was emitted (Date.now() at call site). */
  timestamp: number;
  /** Optional human-readable note (e.g. the rejected pattern, error context). */
  note?: string;
}

/** Pluggable observation sink. */
export interface AuditSink {
  record(entry: LoaderAuditRecord): void;
}

/** No-op sink — default when callers don't want audit output. */
export const NULL_AUDIT_SINK: AuditSink = {
  record(): void {
    /* intentionally empty */
  },
};

/**
 * Capturing sink — collects records in memory.
 * Intended for tests and short-lived diagnostics, not production telemetry.
 */
export class CapturingAuditSink implements AuditSink {
  readonly records: LoaderAuditRecord[] = [];
  record(entry: LoaderAuditRecord): void {
    this.records.push(entry);
  }
  clear(): void {
    this.records.length = 0;
  }
}

// ============================================================================
// Context shape
// ============================================================================

/**
 * The chokepoint type threaded through every disk-loader.
 *
 * Both fields are required when a context is provided. Pass
 * `defaultLoaderContext()` for a permissive-but-audited context, or
 * omit the parameter entirely for historical permissive behavior.
 */
export interface LoaderContext {
  /** Allow-list of paths the loader may touch. Empty list = deny everything. */
  readonly allowList: readonly PathPattern[];
  /** Sink for audit records. */
  readonly audit: AuditSink;
}

/**
 * Build a permissive context (matches every path) that still emits audit
 * records. Useful for tests and incremental rollout.
 */
export function defaultLoaderContext(sink: AuditSink = NULL_AUDIT_SINK): LoaderContext {
  return {
    allowList: [/.*/],
    audit: sink,
  };
}

// ============================================================================
// Enforcement helper
// ============================================================================

/** Error thrown when an operation is rejected by a `LoaderContext.allowList`. */
export class LoaderContextDenied extends Error {
  readonly target: string;
  readonly source: string;
  readonly op: LoaderOp;
  constructor(source: string, op: LoaderOp, target: string) {
    super(`LoaderContext denied ${op} on ${target} (source: ${source})`);
    this.name = 'LoaderContextDenied';
    this.source = source;
    this.op = op;
    this.target = target;
  }
}

/**
 * Gate a single filesystem operation through a `LoaderContext`.
 *
 *   - If `ctx` is `undefined`, returns silently (legacy permissive mode).
 *   - Otherwise checks `ctx.allowList` and emits one audit record.
 *   - Throws `LoaderContextDenied` when the operation is not allowed.
 *
 * Call this at every entry point that touches the filesystem, BEFORE
 * the read.
 *
 * @param ctx Optional context; `undefined` → legacy permissive mode.
 * @param source Loader module identifier (e.g. `cartridge/loader`).
 * @param op Tag describing the operation.
 * @param target Filesystem path or URL about to be acted on.
 * @param note Optional context for the audit record.
 */
export function ensureAllowed(
  ctx: LoaderContext | undefined,
  source: string,
  op: LoaderOp,
  target: string,
  note?: string,
): void {
  if (!ctx) return;
  const allowed = matchesAllowList(ctx.allowList, target);
  ctx.audit.record({
    source,
    op,
    target,
    allowed,
    timestamp: Date.now(),
    ...(note !== undefined ? { note } : {}),
  });
  if (!allowed) {
    throw new LoaderContextDenied(source, op, target);
  }
}
