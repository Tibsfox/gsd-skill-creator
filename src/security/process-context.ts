/**
 * ProcessContext — Tier E security chokepoint for child-process spawners.
 *
 * Every module that spawns a child process (spawn, exec, execFile, fork,
 * and their *Sync variants) accepts an optional `ProcessContext`. The
 * context defines:
 *
 *   - `allowList` — command patterns the caller is permitted to spawn.
 *     Matching is performed against the executable name/path (the first
 *     argument to spawn/exec — not the full command line). If a command
 *     does not match any pattern, the chokepoint rejects it before the
 *     process is started.
 *   - `audit` — observation sink that receives one record per spawn
 *     attempt (allowed or denied), including the argv vector. Use to wire
 *     central security telemetry.
 *
 * `ProcessContext` is OPTIONAL on every spawn entry point. When absent,
 * callers fall back to the historical permissive behavior so existing call
 * sites continue to work. A `defaultProcessContext()` helper is provided
 * for tests and call sites that want explicit opt-in to the chokepoint
 * with no restrictions (audit-only).
 *
 * Sibling of `LoaderContext` (v1.49.782) and `EgressContext` (this ship);
 * the three chokepoints share a common shape but specialize their targets
 * (filesystem path / URL / command+argv). See `docs/security-chokepoints.md`
 * for the cross-surface catalog and migration policy.
 *
 * Migration policy: new spawn callers MUST accept `ctx?: ProcessContext` and
 * route every spawn/exec/fork invocation through
 * `ensureProcessAllowed(ctx, command, op, argv?)`. Enforced by
 * `tools/security/audit-process-context.mjs` (run by pre-tag-gate) which
 * greps for `node:child_process` imports in `src/` and reports unwired
 * call sites.
 *
 * @module security/process-context
 */

// ============================================================================
// Pattern matching
// ============================================================================

/**
 * A single allow-list entry for child-process commands.
 *
 *   - `string` — matches if `command === pattern` OR `command.startsWith(pattern)`
 *     when `pattern` ends with `/`. Use exact-match for executables on PATH
 *     (e.g. `'git'`) and prefix-match for absolute paths to interpreter dirs
 *     (e.g. `'/usr/local/bin/'`).
 *   - `RegExp` — matches if `pattern.test(command)`.
 *   - `(command: string) => boolean` — custom predicate. Returns truthy → allow.
 *
 * Note: the pattern is checked against the EXECUTABLE (first arg to spawn/exec),
 * NOT the full command line. Argument vetting is the caller's responsibility;
 * the chokepoint records argv in the audit record so downstream telemetry can
 * see it.
 */
export type CommandPattern = string | RegExp | ((command: string) => boolean);

/** Return true when `command` matches any pattern in `allowList`. */
export function matchesCommandAllowList(
  allowList: readonly CommandPattern[],
  command: string,
): boolean {
  for (const pat of allowList) {
    if (typeof pat === 'string') {
      if (pat.endsWith('/')) {
        if (command === pat.slice(0, -1) || command.startsWith(pat)) return true;
      } else if (command === pat) {
        return true;
      }
    } else if (pat instanceof RegExp) {
      if (pat.test(command)) return true;
    } else if (typeof pat === 'function') {
      if (pat(command)) return true;
    }
  }
  return false;
}

// ============================================================================
// Audit sink
// ============================================================================

/** Operation tag attached to process audit records. Extend as new shapes appear. */
export type ProcessOp =
  | 'spawn'
  | 'spawn-sync'
  | 'exec'
  | 'exec-sync'
  | 'exec-file'
  | 'exec-file-sync'
  | 'fork';

/** One row of audit output emitted by a child-process caller. */
export interface ProcessAuditRecord {
  /** Caller module that emitted the record, e.g. `dependency-auditor/dry-run-gate`. */
  source: string;
  /** Operation being performed. */
  op: ProcessOp;
  /** Executable about to be spawned (first arg to spawn/exec). */
  target: string;
  /** Argument vector passed alongside `target`. Empty array for shell-string exec(). */
  argv: readonly string[];
  /** Whether the allowList admitted the operation. */
  allowed: boolean;
  /** Time the record was emitted (Date.now() at call site). */
  timestamp: number;
  /** Optional human-readable note (e.g. cwd, timeout). */
  note?: string;
}

/** Pluggable observation sink. */
export interface ProcessAuditSink {
  record(entry: ProcessAuditRecord): void;
}

/** No-op sink — default when callers don't want audit output. */
export const NULL_PROCESS_AUDIT_SINK: ProcessAuditSink = {
  record(): void {
    /* intentionally empty */
  },
};

/**
 * Capturing sink — collects records in memory.
 * Intended for tests and short-lived diagnostics, not production telemetry.
 */
export class CapturingProcessAuditSink implements ProcessAuditSink {
  readonly records: ProcessAuditRecord[] = [];
  record(entry: ProcessAuditRecord): void {
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
 * The chokepoint type threaded through every child-process caller.
 *
 * Both fields are required when a context is provided. Pass
 * `defaultProcessContext()` for a permissive-but-audited context, or omit
 * the parameter entirely for historical permissive behavior.
 */
export interface ProcessContext {
  /** Allow-list of command patterns the caller may spawn. Empty list = deny all. */
  readonly allowList: readonly CommandPattern[];
  /** Sink for audit records. */
  readonly audit: ProcessAuditSink;
}

/**
 * Build a permissive context (matches every command) that still emits audit
 * records. Useful for tests and incremental rollout.
 */
export function defaultProcessContext(
  sink: ProcessAuditSink = NULL_PROCESS_AUDIT_SINK,
): ProcessContext {
  return {
    allowList: [/.*/],
    audit: sink,
  };
}

// ============================================================================
// Enforcement helper
// ============================================================================

/** Error thrown when a spawn operation is rejected by a `ProcessContext.allowList`. */
export class ProcessContextDenied extends Error {
  readonly target: string;
  readonly argv: readonly string[];
  readonly source: string;
  readonly op: ProcessOp;
  constructor(source: string, op: ProcessOp, target: string, argv: readonly string[]) {
    super(`ProcessContext denied ${op} of ${target} (source: ${source})`);
    this.name = 'ProcessContextDenied';
    this.source = source;
    this.op = op;
    this.target = target;
    this.argv = argv;
  }
}

/**
 * Gate a single child-process spawn through a `ProcessContext`.
 *
 *   - If `ctx` is `undefined`, returns silently (legacy permissive mode).
 *   - Otherwise checks `ctx.allowList` against `command` and emits one
 *     audit record including the full argv.
 *   - Throws `ProcessContextDenied` when the operation is not allowed.
 *
 * Call this at every entry point that starts a child process, BEFORE
 * the spawn.
 *
 * @param ctx Optional context; `undefined` → legacy permissive mode.
 * @param source Caller module identifier (e.g. `dependency-auditor/dry-run-gate`).
 * @param op Tag describing the spawn variant.
 * @param command Executable name or path about to be spawned.
 * @param argv Argument vector (empty array for shell-string exec).
 * @param note Optional context for the audit record (e.g. cwd, timeout).
 */
export function ensureProcessAllowed(
  ctx: ProcessContext | undefined,
  source: string,
  op: ProcessOp,
  command: string,
  argv: readonly string[] = [],
  note?: string,
): void {
  if (!ctx) return;
  const allowed = matchesCommandAllowList(ctx.allowList, command);
  ctx.audit.record({
    source,
    op,
    target: command,
    argv,
    allowed,
    timestamp: Date.now(),
    ...(note !== undefined ? { note } : {}),
  });
  if (!allowed) {
    throw new ProcessContextDenied(source, op, command, argv);
  }
}
