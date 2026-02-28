// === Changeset Manager ===
//
// Records every registry modification as a reversible changeset with session
// tracking, enabling sc:unlearn to cleanly revert all changes from a learning
// session. The revert process validates graph integrity to ensure no dangling
// references after removal.
//
// Key safety property: revert checks graph integrity BEFORE producing
// operations. If reverting would create dangling references, the revert is
// blocked unless force=true.

import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { PrimitiveModification } from './merge-engine.js';

// === Exported Types ===

export interface ChangesetEntry {
  type: 'add' | 'update' | 'remove';
  primitiveId: string;
  before: MathematicalPrimitive | null;  // null for 'add'
  after: MathematicalPrimitive | null;   // null for 'remove'
  timestamp: string;
}

export interface Changeset {
  sessionId: string;
  createdAt: string;
  entries: ChangesetEntry[];
  reverted: boolean;
}

export interface RevertOperation {
  type: 'add' | 'update' | 'remove';
  primitiveId: string;
  primitive: MathematicalPrimitive;
  previousVersion?: MathematicalPrimitive;
}

export interface IntegrityError {
  type: 'dangling-reference';
  primitiveId: string;
  dependencyTarget: string;
  message: string;
}

export interface RevertResult {
  status: 'success' | 'integrity-violation' | 'forced' | 'already-reverted' | 'not-found';
  sessionId: string;
  operations: RevertOperation[];
  integrityErrors: IntegrityError[];
}

export interface GraphIntegrityValidator {
  findDependentsOf(primitiveId: string): Array<{ id: string; dependencyTarget: string }>;
}

export interface ChangesetManager {
  record(modification: PrimitiveModification): void;
  getChangeset(sessionId: string): Changeset | null;
  listSessions(): string[];
  revert(sessionId: string, validator: GraphIntegrityValidator, force?: boolean): RevertResult;
}

// === Factory ===

export function createChangesetManager(sessionId: string): ChangesetManager {
  const changesets = new Map<string, Changeset>();

  // Create the initial changeset for the active session
  changesets.set(sessionId, {
    sessionId,
    createdAt: new Date().toISOString(),
    entries: [],
    reverted: false,
  });

  function record(modification: PrimitiveModification): void {
    const changeset = changesets.get(sessionId);
    if (!changeset) {
      throw new Error(`No active changeset for session ${sessionId}`);
    }

    let entry: ChangesetEntry;

    switch (modification.type) {
      case 'add':
        entry = {
          type: 'add',
          primitiveId: modification.primitiveId,
          before: null,
          after: modification.primitive,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'update':
        entry = {
          type: 'update',
          primitiveId: modification.primitiveId,
          before: modification.previousVersion ?? null,
          after: modification.primitive,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'remove':
        entry = {
          type: 'remove',
          primitiveId: modification.primitiveId,
          before: modification.primitive,
          after: null,
          timestamp: new Date().toISOString(),
        };
        break;
    }

    changeset.entries.push(entry);
  }

  function getChangeset(targetSessionId: string): Changeset | null {
    return changesets.get(targetSessionId) ?? null;
  }

  function listSessions(): string[] {
    return Array.from(changesets.keys());
  }

  function revert(
    targetSessionId: string,
    validator: GraphIntegrityValidator,
    force = false,
  ): RevertResult {
    const changeset = changesets.get(targetSessionId);

    if (!changeset) {
      return {
        status: 'not-found',
        sessionId: targetSessionId,
        operations: [],
        integrityErrors: [],
      };
    }

    if (changeset.reverted) {
      return {
        status: 'already-reverted',
        sessionId: targetSessionId,
        operations: [],
        integrityErrors: [],
      };
    }

    // Build revert operations in REVERSE order
    const operations: RevertOperation[] = [];
    const reversedEntries = Array.from(changeset.entries).reverse();

    for (const entry of reversedEntries) {
      switch (entry.type) {
        case 'add':
          // Revert add -> remove
          operations.push({
            type: 'remove',
            primitiveId: entry.primitiveId,
            primitive: entry.after!,
          });
          break;

        case 'update':
          // Revert update -> restore previous version
          operations.push({
            type: 'update',
            primitiveId: entry.primitiveId,
            primitive: entry.before!,
            previousVersion: entry.after!,
          });
          break;

        case 'remove':
          // Revert remove -> re-add
          operations.push({
            type: 'add',
            primitiveId: entry.primitiveId,
            primitive: entry.before!,
          });
          break;
      }
    }

    // Graph integrity check: for each 'remove' operation, check if
    // other primitives depend on the one being removed
    const integrityErrors: IntegrityError[] = [];
    const removingIds = new Set(
      operations.filter(op => op.type === 'remove').map(op => op.primitiveId),
    );

    for (const removeOp of operations.filter(op => op.type === 'remove')) {
      const dependents = validator.findDependentsOf(removeOp.primitiveId);
      for (const dependent of dependents) {
        // Only flag if the dependent is NOT also being removed in this revert
        if (!removingIds.has(dependent.id)) {
          integrityErrors.push({
            type: 'dangling-reference',
            primitiveId: dependent.id,
            dependencyTarget: dependent.dependencyTarget,
            message: `Primitive ${dependent.id} depends on ${dependent.dependencyTarget} which would be removed by this revert.`,
          });
        }
      }
    }

    if (integrityErrors.length > 0 && !force) {
      return {
        status: 'integrity-violation',
        sessionId: targetSessionId,
        operations: [],
        integrityErrors,
      };
    }

    if (integrityErrors.length > 0 && force) {
      changeset.reverted = true;
      return {
        status: 'forced',
        sessionId: targetSessionId,
        operations,
        integrityErrors,
      };
    }

    changeset.reverted = true;
    return {
      status: 'success',
      sessionId: targetSessionId,
      operations,
      integrityErrors: [],
    };
  }

  return { record, getChangeset, listSessions, revert };
}
