/**
 * HB-04 W/E/E roles — runtime role-isolation enforcer.
 *
 * Per ADR-2604.21003 §isolation invariants:
 *   - Worker writes its own state only.
 *   - Evaluator reads Worker output (read-only) and writes Evaluator state.
 *   - Evolution reads aggregated history (read-only) and writes Evolution
 *     state.
 *   - There are NO cross-role write paths.
 *
 * This module provides:
 *   - {@link assertRoleWrite} — runtime check used by role implementations
 *     before any state mutation. Cross-role writes throw at runtime; this
 *     is the assertion the role-isolation test pins.
 *   - {@link makeRoleView} — produces a frozen, designated-fields view of
 *     another role's state for the consuming role. Anything not in the
 *     designated allow-list is omitted. Composes with `Object.freeze` so
 *     incidental mutation also throws in strict mode.
 *
 * @module skill-creator/roles/role-isolation
 */

import type { Role, IsolationViolation } from './types.js';

/** Allow-list of fields each role may expose to the next role downstream. */
export const DESIGNATED_FIELDS: Readonly<Record<Role, ReadonlyArray<string>>> = Object.freeze({
  // Worker → Evaluator: only the candidate set is visible. internalNotes
  // are explicitly omitted (test pins this).
  worker: Object.freeze(['role', 'taskId', 'candidates']),
  // Evaluator → Evolution: only diagnostics are visible.
  evaluator: Object.freeze(['role', 'diagnostics']),
  // Evolution → (no downstream peer in v1.49.575).
  evolution: Object.freeze(['role', 'proposals']),
});

/** Thrown when a role attempts a cross-role write. */
export class RoleIsolationError extends Error {
  readonly violation: IsolationViolation;
  constructor(violation: IsolationViolation) {
    super(
      `role-isolation violation: ${violation.fromRole} attempted to write ` +
        `${violation.toRole}.${violation.field} at ${violation.at}`,
    );
    this.name = 'RoleIsolationError';
    this.violation = violation;
  }
}

/**
 * Assert that `actorRole` is the same as `targetRole`. If not, throw a
 * {@link RoleIsolationError} — cross-role writes are NEVER permitted.
 */
export function assertRoleWrite(
  actorRole: Role,
  targetRole: Role,
  field: string,
): void {
  if (actorRole !== targetRole) {
    throw new RoleIsolationError({
      fromRole: actorRole,
      toRole: targetRole,
      field,
      at: new Date().toISOString(),
    });
  }
}

/**
 * Build a read-only view of `state` for the consuming role, containing
 * only the designated allow-listed fields for the producing role.
 *
 * Fields not in the allow-list are stripped. The returned object is
 * deep-frozen so incidental writes throw in strict mode.
 */
export function makeRoleView<T extends Record<string, unknown>>(
  producingRole: Role,
  state: T,
): Readonly<Partial<T>> {
  const allowed = DESIGNATED_FIELDS[producingRole];
  const view: Partial<T> = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(state, field)) {
      (view as Record<string, unknown>)[field] = (state as Record<string, unknown>)[field];
    }
  }
  return Object.freeze(view);
}

/** True if {@link makeRoleView} would expose `field` from `producingRole`. */
export function isDesignatedField(producingRole: Role, field: string): boolean {
  return DESIGNATED_FIELDS[producingRole].includes(field);
}
