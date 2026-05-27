/**
 * EgressContext — Tier E security chokepoint for network-egress callers.
 *
 * Every module that issues an outbound network request (fetch, websocket,
 * eventsource) accepts an optional `EgressContext`. The context defines:
 *
 *   - `allowList` — URL patterns the caller is permitted to reach.
 *     If a URL does not match any pattern, the chokepoint rejects it before
 *     the network request happens.
 *   - `audit` — observation sink that receives one record per egress attempt
 *     (allowed or denied). Use to wire central security telemetry.
 *
 * `EgressContext` is OPTIONAL on every egress entry point. When absent,
 * callers fall back to the historical permissive behavior so existing call
 * sites continue to work. A `defaultEgressContext()` helper is provided for
 * tests and call sites that want explicit opt-in to the chokepoint with no
 * restrictions (audit-only).
 *
 * Sibling of `LoaderContext` (v1.49.782) and `ProcessContext` (this ship);
 * the three chokepoints share a common shape but specialize their targets
 * (filesystem path / URL / command+argv). See `docs/security-chokepoints.md`
 * for the cross-surface catalog and migration policy.
 *
 * Migration policy: new egress callers MUST accept `ctx?: EgressContext` and
 * route every fetch/websocket/eventsource invocation through
 * `ensureEgressAllowed(ctx, url, op)`. Enforced by
 * `tools/security/audit-egress-context.mjs` (run by pre-tag-gate) which greps
 * for `fetch(` invocations in `src/` and reports unwired call sites.
 *
 * @module security/egress-context
 */

// ============================================================================
// Pattern matching
// ============================================================================

/**
 * A single allow-list entry for URLs.
 *
 *   - `string` — matches if `url === pattern` OR `url.startsWith(pattern)`
 *     when `pattern` ends with `/`. Exact-match for endpoint URLs, prefix-match
 *     for host/path prefixes (e.g. `'https://api.osv.dev/'`).
 *   - `RegExp` — matches if `pattern.test(url)`.
 *   - `(url: string) => boolean` — custom predicate. Returns truthy → allow.
 */
export type UrlPattern = string | RegExp | ((url: string) => boolean);

/** Return true when `url` matches any pattern in `allowList`. */
export function matchesUrlAllowList(
  allowList: readonly UrlPattern[],
  url: string,
): boolean {
  for (const pat of allowList) {
    if (typeof pat === 'string') {
      if (pat.endsWith('/')) {
        if (url === pat.slice(0, -1) || url.startsWith(pat)) return true;
      } else if (url === pat) {
        return true;
      }
    } else if (pat instanceof RegExp) {
      if (pat.test(url)) return true;
    } else if (typeof pat === 'function') {
      if (pat(url)) return true;
    }
  }
  return false;
}

// ============================================================================
// Audit sink
// ============================================================================

/** Operation tag attached to egress audit records. Extend as new shapes appear. */
export type EgressOp =
  | 'fetch'
  | 'fetch-stream'
  | 'websocket-open'
  | 'eventsource-open';

/** One row of audit output emitted by an egress caller. */
export interface EgressAuditRecord {
  /** Caller module that emitted the record, e.g. `dependency-auditor/osv-client`. */
  source: string;
  /** Operation being performed. */
  op: EgressOp;
  /** Full URL about to be requested. */
  target: string;
  /** Whether the allowList admitted the operation. */
  allowed: boolean;
  /** Time the record was emitted (Date.now() at call site). */
  timestamp: number;
  /** Optional human-readable note (e.g. HTTP method, retry attempt). */
  note?: string;
}

/** Pluggable observation sink. */
export interface EgressAuditSink {
  record(entry: EgressAuditRecord): void;
}

/** No-op sink — default when callers don't want audit output. */
export const NULL_EGRESS_AUDIT_SINK: EgressAuditSink = {
  record(): void {
    /* intentionally empty */
  },
};

/**
 * Capturing sink — collects records in memory.
 * Intended for tests and short-lived diagnostics, not production telemetry.
 */
export class CapturingEgressAuditSink implements EgressAuditSink {
  readonly records: EgressAuditRecord[] = [];
  record(entry: EgressAuditRecord): void {
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
 * The chokepoint type threaded through every network-egress caller.
 *
 * Both fields are required when a context is provided. Pass
 * `defaultEgressContext()` for a permissive-but-audited context, or omit
 * the parameter entirely for historical permissive behavior.
 */
export interface EgressContext {
  /** Allow-list of URL patterns the caller may reach. Empty list = deny all. */
  readonly allowList: readonly UrlPattern[];
  /** Sink for audit records. */
  readonly audit: EgressAuditSink;
}

/**
 * Build a permissive context (matches every URL) that still emits audit
 * records. Useful for tests and incremental rollout.
 */
export function defaultEgressContext(
  sink: EgressAuditSink = NULL_EGRESS_AUDIT_SINK,
): EgressContext {
  return {
    allowList: [/.*/],
    audit: sink,
  };
}

// ============================================================================
// Enforcement helper
// ============================================================================

/** Error thrown when an egress operation is rejected by an `EgressContext.allowList`. */
export class EgressContextDenied extends Error {
  readonly target: string;
  readonly source: string;
  readonly op: EgressOp;
  constructor(source: string, op: EgressOp, target: string) {
    super(`EgressContext denied ${op} on ${target} (source: ${source})`);
    this.name = 'EgressContextDenied';
    this.source = source;
    this.op = op;
    this.target = target;
  }
}

/**
 * Gate a single network egress operation through an `EgressContext`.
 *
 *   - If `ctx` is `undefined`, returns silently (legacy permissive mode).
 *   - Otherwise checks `ctx.allowList` and emits one audit record.
 *   - Throws `EgressContextDenied` when the operation is not allowed.
 *
 * Call this at every entry point that issues an outbound network request,
 * BEFORE the request is sent.
 *
 * @param ctx Optional context; `undefined` → legacy permissive mode.
 * @param source Caller module identifier (e.g. `dependency-auditor/osv-client`).
 * @param op Tag describing the operation.
 * @param target Full URL about to be requested.
 * @param note Optional context for the audit record (e.g. HTTP method).
 */
export function ensureEgressAllowed(
  ctx: EgressContext | undefined,
  source: string,
  op: EgressOp,
  target: string,
  note?: string,
): void {
  if (!ctx) return;
  const allowed = matchesUrlAllowList(ctx.allowList, target);
  ctx.audit.record({
    source,
    op,
    target,
    allowed,
    timestamp: Date.now(),
    ...(note !== undefined ? { note } : {}),
  });
  if (!allowed) {
    throw new EgressContextDenied(source, op, target);
  }
}
