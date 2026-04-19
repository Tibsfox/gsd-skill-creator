/**
 * M1 Semantic Memory Graph — schema.ts round-trip tests.
 *
 * Verifies:
 *   - entityId / edgeId are deterministic and kind-prefixed
 *   - Entity → canonical → Entity round-trips exactly
 *   - Edge → canonical → Edge round-trips exactly
 *   - toEntity / toEdge projection helpers are exposed
 *   - ENTITY_KINDS vocabulary matches the shared types
 */
import { describe, it, expect } from 'vitest';
import type { Entity, Edge, EntityKind } from '../../types/memory.js';
import {
  ENTITY_KINDS,
  EDGE_RELATIONS,
  entityId,
  edgeId,
  entityToCanonical,
  canonicalToEntity,
  edgeToCanonical,
  canonicalToEdge,
  encodeEntity,
  decodeEntity,
  encodeEdge,
  decodeEdge,
  toEntity,
  toEdge,
} from '../schema.js';

describe('schema — id derivation', () => {
  it('entityId is deterministic and kind-prefixed', () => {
    const a1 = entityId('skill', 'vision-to-mission');
    const a2 = entityId('skill', 'vision-to-mission');
    expect(a1).toBe(a2);
    expect(a1.startsWith('skill:')).toBe(true);
  });

  it('different kinds of same key produce different ids', () => {
    const a = entityId('skill', 'foo');
    const b = entityId('file', 'foo');
    expect(a).not.toBe(b);
  });

  it('edgeId is deterministic', () => {
    const a = edgeId('e1', 'rel', 'e2');
    const b = edgeId('e1', 'rel', 'e2');
    expect(a).toBe(b);
    // Permuting src/dst must NOT be identical — the projection is directional.
    expect(edgeId('e1', 'rel', 'e2')).not.toBe(edgeId('e2', 'rel', 'e1'));
  });

  it('exposes all six EntityKind values in the closed set', () => {
    const expected: EntityKind[] = [
      'skill',
      'command',
      'file',
      'session',
      'decision',
      'outcome',
    ];
    expect(ENTITY_KINDS.slice().sort()).toEqual(expected.slice().sort());
  });

  it('exposes the core edge relations', () => {
    expect(EDGE_RELATIONS.CO_FIRED).toBe('co-fired');
    expect(EDGE_RELATIONS.ACTIVATED_IN).toBe('activated-in');
  });
});

describe('schema — Entity round-trip', () => {
  const entity: Entity = {
    id: 'skill:abc123',
    kind: 'skill',
    attrs: { name: 'vision-to-mission', nested: { a: 1, b: true } },
  };

  it('canonical projection round-trips', () => {
    const canonical = entityToCanonical(entity);
    const restored = canonicalToEntity(canonical);
    expect(restored).toEqual(entity);
  });

  it('byte encoding round-trips', () => {
    const bytes = encodeEntity(entity);
    const restored = decodeEntity(bytes);
    expect(restored).toEqual(entity);
  });

  it('toEntity projection helper works', () => {
    const canonical = entityToCanonical(entity);
    const projected = toEntity(canonical);
    expect(projected).toEqual(entity);
  });
});

describe('schema — Edge round-trip', () => {
  const edge: Edge = {
    src: 'skill:a',
    dst: 'session:b',
    relation: 'activated-in',
    weight: 3.25,
  };

  it('canonical projection round-trips', () => {
    const restored = canonicalToEdge(edgeToCanonical(edge));
    expect(restored).toEqual(edge);
  });

  it('byte encoding round-trips', () => {
    const bytes = encodeEdge(edge);
    const restored = decodeEdge(bytes);
    expect(restored).toEqual(edge);
  });

  it('toEdge projection helper works', () => {
    const canonical = edgeToCanonical(edge);
    const projected = toEdge(canonical);
    expect(projected).toEqual(edge);
  });
});

describe('schema — error handling', () => {
  it('canonicalToEntity throws on unknown kind', () => {
    const bad = entityToCanonical({
      id: 'x',
      kind: 'widget' as EntityKind,
      attrs: {},
    });
    expect(() => canonicalToEntity(bad)).toThrow(/unknown entity kind/);
  });
});
