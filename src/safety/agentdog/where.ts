/**
 * HB-02 AgentDoG — `Where` axis.
 *
 * Records the offending component identifier + invocation context for a
 * Safety Warden BLOCK decision. The `Where` axis answers: "where in the
 * system did the BLOCK fire from?"
 *
 * Source: arXiv:2601.18491 (AgentDoG). 4B-tier sidecar consumes this axis
 * to localize defenses; v1.49.575 ships only the schema + capture, not the
 * sidecar inference itself.
 *
 * @module safety/agentdog/where
 */

/**
 * `Where` axis — offending component + invocation context.
 *
 * Fields are intentionally narrow. The 4B sidecar can fan these out into
 * richer features later; the on-disk schema is small and stable.
 */
export interface WhereAxis {
  /** Identifier for the offending component (e.g. "skill:foo", "agent:bar"). */
  readonly component: string;
  /** Invocation context — call-site label, current phase, or skill bundle id. */
  readonly invocationContext: string;
}

/**
 * Capture the `Where` axis from a BLOCK record's component + context fields.
 *
 * Pure function — no side effects. Defensive against missing inputs:
 * empty strings are passed through (BLOCK records sometimes carry sparse
 * context; the axis records what was available at the BLOCK call-site).
 */
export function captureWhereAxis(input: {
  component?: string;
  invocationContext?: string;
}): WhereAxis {
  return Object.freeze({
    component: typeof input.component === 'string' ? input.component : '',
    invocationContext:
      typeof input.invocationContext === 'string' ? input.invocationContext : '',
  });
}
