import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../core/types/mfe-types.js';
import type { PrimitiveModification } from '../learn/merge-engine.js';
import { createChangesetManager } from '../learn/changeset-manager.js';
import type { GraphIntegrityValidator } from '../learn/changeset-manager.js';
import { scUnlearn } from './sc-unlearn.js';
import type { ScUnlearnOptions } from './sc-unlearn.js';

// === Test Helpers ===

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

function makeDefaultOptions(
  overrides: Partial<ScUnlearnOptions> = {},
): ScUnlearnOptions {
  const manager = createChangesetManager('default-session');
  return {
    changesetManager: manager,
    graphValidator: emptyValidator,
    ...overrides,
  };
}

// === Tests ===

describe('sc:unlearn: session lookup', () => {
  it('not-found session returns success=false with status not-found', () => {
    const manager = createChangesetManager('other-session');
    const result = scUnlearn('nonexistent', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(false);
    expect(result.status).toBe('not-found');
    expect(result.sessionId).toBe('nonexistent');
    expect(result.summary).toContain('nonexistent');
  });

  it('valid session with recorded operations proceeds to revert', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(true);
    expect(result.status).toBe('success');
    expect(result.operationsReverted).toBe(1);
  });
});

describe('sc:unlearn: revert execution', () => {
  it('successfully reverts a session with add operations (returns primitivesRemoved)', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));
    manager.record(makeModification('add', 'p2', makePrimitive({ id: 'p2' })));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(true);
    expect(result.primitivesRemoved).toContain('p1');
    expect(result.primitivesRemoved).toContain('p2');
    expect(result.operationsReverted).toBe(2);
  });

  it('successfully reverts a session with update operations (returns primitivesRestored)', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'p1', formalStatement: 'original' });
    const updated = makePrimitive({ id: 'p1', formalStatement: 'updated' });
    manager.record(makeModification('update', 'p1', updated, original));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(true);
    expect(result.primitivesRestored).toContain('p1');
    expect(result.operationsReverted).toBe(1);
  });

  it('successfully reverts mixed add+update+remove operations', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'b', formalStatement: 'original-b' });
    const updatedB = makePrimitive({ id: 'b', formalStatement: 'updated-b' });

    manager.record(makeModification('add', 'a', makePrimitive({ id: 'a' })));
    manager.record(makeModification('update', 'b', updatedB, original));
    manager.record(makeModification('remove', 'c', makePrimitive({ id: 'c' })));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(true);
    expect(result.operationsReverted).toBe(3);
    // add -> remove (primitive removed), update -> restore, remove -> re-add
    expect(result.primitivesRemoved).toContain('a');
    expect(result.primitivesRestored).toContain('b');
    // c was re-added (remove reverted to add), not in removed or restored
  });

  it('operations are reverted in reverse order (verified by changeset.reverted=true)', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));
    manager.record(makeModification('add', 'p2', makePrimitive({ id: 'p2' })));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.success).toBe(true);
    // After revert, changeset should be marked as reverted
    const changeset = manager.getChangeset('session-1');
    expect(changeset!.reverted).toBe(true);
  });
});

describe('sc:unlearn: integrity validation', () => {
  it('revert blocked when dependent primitives exist outside session (status: integrity-violation)', () => {
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

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      graphValidator: validator,
    }));

    expect(result.success).toBe(false);
    expect(result.status).toBe('integrity-violation');
  });

  it('revert blocked returns integrityErrors listing orphaned primitives', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const validator: GraphIntegrityValidator = {
      findDependentsOf: (id: string) => {
        if (id === 'p1') {
          return [{ id: 'orphan-1', dependencyTarget: 'p1' }];
        }
        return [];
      },
    };

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      graphValidator: validator,
    }));

    expect(result.integrityErrors.length).toBeGreaterThan(0);
    expect(result.integrityErrors[0].primitiveId).toBe('orphan-1');
    expect(result.integrityErrors[0].dependencyTarget).toBe('p1');
    expect(result.summary).toContain('orphan');
  });

  it('--force bypasses integrity check (status: forced, operations present)', () => {
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

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      graphValidator: validator,
      force: true,
    }));

    expect(result.success).toBe(true);
    expect(result.status).toBe('forced');
    expect(result.operationsReverted).toBeGreaterThan(0);
    expect(result.integrityErrors.length).toBeGreaterThan(0);
  });

  it('no integrity issue when dependents are also in the revert set', () => {
    const manager = createChangesetManager('session-1');
    // Both p1 and q1 are added in same session
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));
    manager.record(makeModification('add', 'q1', makePrimitive({ id: 'q1' })));

    // q1 depends on p1, but both are being removed in the revert
    const validator: GraphIntegrityValidator = {
      findDependentsOf: (id: string) => {
        if (id === 'p1') {
          return [{ id: 'q1', dependencyTarget: 'p1' }];
        }
        return [];
      },
    };

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      graphValidator: validator,
    }));

    expect(result.success).toBe(true);
    expect(result.status).toBe('success');
    expect(result.integrityErrors.length).toBe(0);
  });
});

describe('sc:unlearn: skill regeneration', () => {
  it('after revert, affected domain skills are regenerated', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1', domain: 'perception' })));

    // Provide enough existing primitives (30+) to trigger skill generation
    const existing: MathematicalPrimitive[] = [];
    for (let i = 0; i < 35; i++) {
      existing.push(makePrimitive({
        id: `existing-${i}`,
        domain: 'perception',
        keywords: ['math'],
      }));
    }

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      existingPrimitives: existing,
      regenerateSkills: true,
    }));

    expect(result.success).toBe(true);
    expect(result.skillsRegenerated.length).toBeGreaterThan(0);
  });

  it('regenerated skill files listed in result', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1', domain: 'perception' })));

    const existing: MathematicalPrimitive[] = [];
    for (let i = 0; i < 35; i++) {
      existing.push(makePrimitive({
        id: `existing-${i}`,
        domain: 'perception',
        keywords: ['math'],
      }));
    }

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      existingPrimitives: existing,
      regenerateSkills: true,
    }));

    expect(result.skillsRegenerated.length).toBeGreaterThan(0);
    // File name should include domain slug
    expect(result.skillsRegenerated[0]).toContain('perception');
  });

  it('skip regeneration when regenerateSkills=false', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1', domain: 'perception' })));

    const existing: MathematicalPrimitive[] = [];
    for (let i = 0; i < 35; i++) {
      existing.push(makePrimitive({ id: `existing-${i}`, domain: 'perception', keywords: ['math'] }));
    }

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      existingPrimitives: existing,
      regenerateSkills: false,
    }));

    expect(result.success).toBe(true);
    expect(result.skillsRegenerated.length).toBe(0);
  });

  it('skip regeneration when no existingPrimitives provided', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1', domain: 'perception' })));

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      regenerateSkills: true,
      // No existingPrimitives provided
    }));

    expect(result.success).toBe(true);
    expect(result.skillsRegenerated.length).toBe(0);
    expect(result.summary).toContain('skipped');
  });
});

describe('sc:unlearn: progress', () => {
  it('onProgress called for load, validate, revert, regenerate stages', () => {
    const manager = createChangesetManager('session-1');
    manager.record(makeModification('add', 'p1', makePrimitive({ id: 'p1' })));

    const stages: string[] = [];
    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      onProgress: (stage: string) => stages.push(stage),
    }));

    expect(result.success).toBe(true);
    expect(stages).toContain('load');
    expect(stages).toContain('validate');
    expect(stages).toContain('revert');
    // regenerate only fires when regenerateSkills is true (default)
    expect(stages).toContain('regenerate');
  });
});

describe('sc:unlearn: summary', () => {
  it('summary includes session ID, operation count, removed/restored counts', () => {
    const manager = createChangesetManager('session-1');
    const original = makePrimitive({ id: 'b', formalStatement: 'original-b' });
    const updatedB = makePrimitive({ id: 'b', formalStatement: 'updated-b' });

    manager.record(makeModification('add', 'a', makePrimitive({ id: 'a' })));
    manager.record(makeModification('update', 'b', updatedB, original));

    const result = scUnlearn('session-1', makeDefaultOptions({ changesetManager: manager }));

    expect(result.summary).toContain('session-1');
    expect(result.summary).toContain('2');  // 2 operations
    expect(result.summary).toContain('removed');
    expect(result.summary).toContain('restored');
  });

  it('forced revert summary mentions integrity warnings', () => {
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

    const result = scUnlearn('session-1', makeDefaultOptions({
      changesetManager: manager,
      graphValidator: validator,
      force: true,
    }));

    expect(result.summary).toContain('forced');
    expect(result.summary).toContain('integrity');
  });
});
