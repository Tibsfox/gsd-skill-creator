/**
 * Component 00 — prov.ts type-narrowing + closed-set runtime tests.
 *
 * The substrate-conformance test in Component 09 (`prov-closed-set.test.ts`)
 * additionally parses the migration SQL and diffs against `NODE_TYPES` /
 * `PROV_RELATIONS`. Here we only test the TypeScript-level shape: type guards,
 * sub_type narrowing, and edge-id recipe.
 */

import { describe, it, expect } from 'vitest';
import {
  NODE_TYPES,
  PROV_RELATIONS,
  KNOWN_SUB_TYPES,
  isActivity,
  isEntity,
  isAgent,
  hasSubType,
  edgeIdRecipe,
  type ProvNode,
  type ProvEdge,
} from '../prov.js';

describe('prov.ts — closed sets are frozen and complete', () => {
  it('NODE_TYPES is frozen', () => {
    expect(Object.isFrozen(NODE_TYPES)).toBe(true);
  });

  it('NODE_TYPES contains exactly 6 distinct values', () => {
    const set = new Set(NODE_TYPES);
    expect(set.size).toBe(6);
    expect(set).toEqual(
      new Set(['Entity', 'Activity', 'Agent', 'Plan', 'Bundle', 'Collection']),
    );
  });

  it('PROV_RELATIONS is frozen', () => {
    expect(Object.isFrozen(PROV_RELATIONS)).toBe(true);
  });

  it('PROV_RELATIONS contains exactly 15 distinct values matching the T5 SQL CHECK', () => {
    // Substrate source-of-truth: 7 starting-point + 8 extended = 15 total.
    // (mission README narrative bullet abbreviates this; the SQL is the source
    // of truth — see PLAN-AUDIT.md Finding A1.)
    const set = new Set(PROV_RELATIONS);
    expect(set.size).toBe(15);
    expect(set).toEqual(
      new Set([
        'wasGeneratedBy',
        'used',
        'wasInformedBy',
        'wasDerivedFrom',
        'wasAttributedTo',
        'wasAssociatedWith',
        'actedOnBehalfOf',
        'wasInfluencedBy',
        'hadMember',
        'wasRevisionOf',
        'wasQuotationFrom',
        'specializationOf',
        'alternateOf',
        'hadPlan',
        'hadActivity',
      ]),
    );
  });

  it('KNOWN_SUB_TYPES registry is frozen and includes roundtrip-event', () => {
    expect(Object.isFrozen(KNOWN_SUB_TYPES)).toBe(true);
    // Component 05 will emit Activity nodes with this sub_type.
    expect(KNOWN_SUB_TYPES.roundtripEvent).toBe('roundtrip-event');
  });
});

describe('prov.ts — type guards narrow correctly', () => {
  const baseTimestamp = '2026-05-09T00:00:00Z';

  const entity: ProvNode = {
    node_id: 'commit:e3ad12b25',
    node_type: 'Entity',
    sub_type: 'commit',
    payload: {},
    created_at: baseTimestamp,
  };

  const activity: ProvNode = {
    node_id: 'session:2026-05-09-flight-ops-wave-0',
    node_type: 'Activity',
    sub_type: 'session',
    payload: { mission: 'scribe-buildout' },
    started_at: baseTimestamp,
    created_at: baseTimestamp,
  };

  const agent: ProvNode = {
    node_id: 'agent:tibsfox',
    node_type: 'Agent',
    sub_type: 'person',
    payload: {},
    created_at: baseTimestamp,
  };

  it('isActivity narrows to Activity nodes', () => {
    expect(isActivity(activity)).toBe(true);
    expect(isActivity(entity)).toBe(false);
    if (isActivity(activity)) {
      // Type-narrowed: this access compiles.
      expect(activity.node_type).toBe('Activity');
    }
  });

  it('isEntity narrows to Entity nodes', () => {
    expect(isEntity(entity)).toBe(true);
    expect(isEntity(activity)).toBe(false);
  });

  it('isAgent narrows to Agent nodes', () => {
    expect(isAgent(agent)).toBe(true);
    expect(isAgent(entity)).toBe(false);
  });

  it('hasSubType narrows on the discriminator', () => {
    const roundtripEvent: ProvNode = {
      node_id: 'roundtrip:abcdef0123456789',
      node_type: 'Activity',
      sub_type: 'roundtrip-event',
      payload: {
        roundTrip: {
          direction: 'forward',
          sourceLanguage: 'typescript',
          targetLanguage: 'verilog',
          sourceSha: 'cb1aaef8c3f5...',
          targetSha: 'aaaaaaaaaaaaaaaa',
          svgSha: 'bbbbbbbbbbbbbbbb',
        },
      },
      created_at: baseTimestamp,
    };
    expect(hasSubType(roundtripEvent, 'roundtrip-event')).toBe(true);
    expect(hasSubType(roundtripEvent, 'session')).toBe(false);
    if (hasSubType(roundtripEvent, 'roundtrip-event')) {
      // Type-narrowed: TS sees `sub_type: 'roundtrip-event'`.
      expect(roundtripEvent.sub_type).toBe('roundtrip-event');
    }
  });
});

describe('prov.ts — edgeIdRecipe is pure data', () => {
  it('returns a frozen recipe with the correct algorithm + inputs + slice length', () => {
    const recipe = edgeIdRecipe('agent:claude', 'actedOnBehalfOf', 'agent:tibsfox');
    expect(Object.isFrozen(recipe)).toBe(true);
    expect(recipe.algorithm).toBe('sha256');
    expect(recipe.inputs).toEqual(['agent:claude', 'actedOnBehalfOf', 'agent:tibsfox']);
    expect(recipe.sliceLength).toBe(16);
  });

  it('does NOT compute the hash — it only specifies the recipe', () => {
    // Intentional: prov.ts is zero-runtime-dep. Hashing is the consumer's job.
    const recipe = edgeIdRecipe('a', 'used', 'b');
    expect(typeof recipe.algorithm).toBe('string');
    // No `hash` or `digest` field.
    expect('hash' in recipe).toBe(false);
    expect('digest' in recipe).toBe(false);
  });
});

describe('prov.ts — ProvEdge structural shape compiles', () => {
  it('accepts a well-formed edge', () => {
    const edge: ProvEdge = {
      edge_id: 'abcdef0123456789',
      src_id: 'agent:claude',
      dst_id: 'agent:tibsfox',
      relation: 'actedOnBehalfOf',
      payload: {},
      created_at: '2026-05-09T00:00:00Z',
    };
    expect(edge.relation).toBe('actedOnBehalfOf');
  });
});
