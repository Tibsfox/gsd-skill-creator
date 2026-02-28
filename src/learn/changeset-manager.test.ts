import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { PrimitiveModification } from './merge-engine.js';
import { createChangesetManager } from './changeset-manager.js';
import type { GraphIntegrityValidator } from './changeset-manager.js';

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: 'Test formal statement',
    computationalForm: 'test(x) = x',
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: ['test'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

function makeModification(
  type: 'add' | 'update' | 'remove',
  primitiveId: string,
  primitive: MathematicalPrimitive,
  previousVersion?: MathematicalPrimitive,
): PrimitiveModification {
  const mod: PrimitiveModification = { type, primitiveId, primitive };
  if (previousVersion) mod.previousVersion = previousVersion;
  return mod;
}

/** No-op validator: no dependents on anything */
const emptyValidator: GraphIntegrityValidator = {
  findDependentsOf: () => [],
};

describe('changeset manager: recording', () => {
  it('records an add operation with before/after state', () => {
    const manager = createChangesetManager('session-1');
    const prim = makePrimitive({ id: 'new-prim-1' });

    manager.record(makeModification('add', 'new-prim-1', prim));

    const changeset = manager.getChangeset('session-1');
    expect(changeset).not.toBeNull();
    expect(changeset!.entries.length).toBe(1);
    expect(changeset!.entries[0].type).toBe('add');
    expect(changeset!.entries[0].after).toEqual(prim);
    expect(changeset!.entries[0].before).toBeNull();
  });

  it('records an update operation preserving previous version', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'existing-prim', formalStatement: 'original' });
    const updated = makePrimitive({ id: 'existing-prim', formalStatement: 'updated' });

    manager.record(makeModification('update', 'existing-prim', updated, original));

    const changeset = manager.getChangeset('session-1');
    expect(changeset!.entries[0].type).toBe('update');
    expect(changeset!.entries[0].before).toEqual(original);
    expect(changeset!.entries[0].after).toEqual(updated);
  });

  it('records a remove operation with before state', () => {
    const manager = createChangesetManager('session-1');
    const prim = makePrimitive({ id: 'removed-prim' });

    manager.record(makeModification('remove', 'removed-prim', prim));

    const changeset = manager.getChangeset('session-1');
    expect(changeset!.entries[0].type).toBe('remove');
    expect(changeset!.entries[0].before).toEqual(prim);
    expect(changeset!.entries[0].after).toBeNull();
  });

  it('changeset includes session ID and timestamps', () => {
    const manager = createChangesetManager('session-1');
    const prim = makePrimitive({ id: 'p1' });

    manager.record(makeModification('add', 'p1', prim));

    const changeset = manager.getChangeset('session-1');
    expect(changeset!.sessionId).toBe('session-1');
    expect(typeof changeset!.createdAt).toBe('string');
    expect(changeset!.createdAt.length).toBeGreaterThan(0);
    expect(typeof changeset!.entries[0].timestamp).toBe('string');
  });

  it('records multiple modifications in a single changeset', () => {
    const manager = createChangesetManager('session-1');

    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));
    manager.record(makeModification('add', 'p2', makePrimitive({ id: 'p2' })));
    manager.record(makeModification('add', 'p3', makePrimitive({ id: 'p3' })));

    const changeset = manager.getChangeset('session-1');
    expect(changeset!.entries.length).toBe(3);
    expect(changeset!.entries[0].primitiveId).toBe('p1');
    expect(changeset!.entries[1].primitiveId).toBe('p2');
    expect(changeset!.entries[2].primitiveId).toBe('p3');
  });
});

describe('changeset manager: revert (sc:unlearn)', () => {
  it('reverts add operations by removing the added primitive', () => {
    const manager = createChangesetManager('session-1');
    const prim = makePrimitive({ id: 'p1' });
    manager.record(makeModification('add', 'p1', prim));

    const result = manager.revert('session-1', emptyValidator);

    expect(result.status).toBe('success');
    expect(result.operations.length).toBe(1);
    expect(result.operations[0].type).toBe('remove');
    expect(result.operations[0].primitiveId).toBe('p1');
  });

  it('reverts update operations by restoring previous version', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'p1', formalStatement: 'original' });
    const updated = makePrimitive({ id: 'p1', formalStatement: 'updated' });
    manager.record(makeModification('update', 'p1', updated, original));

    const result = manager.revert('session-1', emptyValidator);

    expect(result.status).toBe('success');
    expect(result.operations.length).toBe(1);
    expect(result.operations[0].type).toBe('update');
    expect(result.operations[0].primitive.formalStatement).toBe('original');
  });

  it('reverts remove operations by re-adding the removed primitive', () => {
    const manager = createChangesetManager('session-1');
    const prim = makePrimitive({ id: 'p1' });
    manager.record(makeModification('remove', 'p1', prim));

    const result = manager.revert('session-1', emptyValidator);

    expect(result.status).toBe('success');
    expect(result.operations.length).toBe(1);
    expect(result.operations[0].type).toBe('add');
    expect(result.operations[0].primitiveId).toBe('p1');
  });

  it('reverts multiple operations in reverse order', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'b', formalStatement: 'original-b' });
    const updatedB = makePrimitive({ id: 'b', formalStatement: 'updated-b' });

    manager.record(makeModification('add', 'a', makePrimitive({ id: 'a' })));
    manager.record(makeModification('update', 'b', updatedB, original));
    manager.record(makeModification('add', 'c', makePrimitive({ id: 'c' })));

    const result = manager.revert('session-1', emptyValidator);

    expect(result.status).toBe('success');
    expect(result.operations.length).toBe(3);
    // Reverse order: remove c, restore b, remove a
    expect(result.operations[0].type).toBe('remove');
    expect(result.operations[0].primitiveId).toBe('c');
    expect(result.operations[1].type).toBe('update');
    expect(result.operations[1].primitiveId).toBe('b');
    expect(result.operations[2].type).toBe('remove');
    expect(result.operations[2].primitiveId).toBe('a');
  });
});

describe('changeset manager: graph integrity validation', () => {
  it('revert succeeds when no integrity violations', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const result = manager.revert('session-1', emptyValidator);

    expect(result.status).toBe('success');
    expect(result.integrityErrors.length).toBe(0);
  });

  it('revert fails when removing a primitive that others depend on', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    // Validator reports that Q depends on P
    const validator: GraphIntegrityValidator = {
      findDependentsOf: (id: string) => {
        if (id === 'p1') {
          return [{ id: 'q1', dependencyTarget: 'p1' }];
        }
        return [];
      },
    };

    const result = manager.revert('session-1', validator);

    expect(result.status).toBe('integrity-violation');
    expect(result.integrityErrors.length).toBeGreaterThan(0);
    expect(result.integrityErrors[0].type).toBe('dangling-reference');
    expect(result.integrityErrors[0].primitiveId).toBe('q1');
    expect(result.integrityErrors[0].dependencyTarget).toBe('p1');
  });

  it('revert with force=true proceeds despite integrity violations', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const validator: GraphIntegrityValidator = {
      findDependentsOf: (id: string) => {
        if (id === 'p1') {
          return [{ id: 'q1', dependencyTarget: 'p1' }];
        }
        return [];
      },
    };

    const result = manager.revert('session-1', validator, true);

    expect(result.status).toBe('forced');
    expect(result.operations.length).toBeGreaterThan(0);
    expect(result.integrityErrors.length).toBeGreaterThan(0);
  });
});

describe('changeset manager: session querying', () => {
  it('getChangeset returns changeset by session ID', () => {
    const manager1 = createChangesetManager('session-1');
    manager1.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const manager2 = createChangesetManager('session-2');
    manager2.record(makeModification('add', 'p2', makePrimitive({ id: 'p2' })));

    // Each manager tracks its own session
    const cs1 = manager1.getChangeset('session-1');
    expect(cs1).not.toBeNull();
    expect(cs1!.entries.length).toBe(1);
    expect(cs1!.entries[0].primitiveId).toBe('p1');

    const cs2 = manager2.getChangeset('session-2');
    expect(cs2).not.toBeNull();
    expect(cs2!.entries.length).toBe(1);
    expect(cs2!.entries[0].primitiveId).toBe('p2');
  });

  it('listSessions returns all recorded session IDs', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const sessions = manager.listSessions();
    expect(sessions).toContain('session-1');
  });

  it('getChangeset returns null for unknown session', () => {
    const manager = createChangesetManager('session-1');
    expect(manager.getChangeset('nonexistent')).toBeNull();
  });
});

describe('changeset manager: edge cases', () => {
  it('revert of already-reverted session returns error', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    // First revert succeeds
    const first = manager.revert('session-1', emptyValidator);
    expect(first.status).toBe('success');

    // Second revert should fail
    const second = manager.revert('session-1', emptyValidator);
    expect(second.status).toBe('already-reverted');
  });
});
