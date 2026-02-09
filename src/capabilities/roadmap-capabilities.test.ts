/**
 * Tests for ROADMAP.md capability declaration parsing.
 *
 * Covers single-line format, multi-line format, multiple capabilities per verb,
 * empty/missing declarations, block termination at metadata boundaries,
 * invalid type/name filtering, and mixed valid/invalid entries.
 */

import { describe, it, expect } from 'vitest';
import { parseCapabilityDeclarations } from './roadmap-capabilities.js';
import type { CapabilityRef } from './types.js';

describe('parseCapabilityDeclarations', () => {
  // --------------------------------------------------------------------------
  // Test 1: Single-line format
  // --------------------------------------------------------------------------

  it('parses single-line capabilities declaration', () => {
    const lines = [
      '**Goal**: Build something',
      '**Capabilities**: use: skill/beautiful-commits, skill/typescript-patterns',
      '**Success Criteria**:',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(2);
    expect(refs[0]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'skill',
      name: 'beautiful-commits',
    });
    expect(refs[1]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'skill',
      name: 'typescript-patterns',
    });
  });

  // --------------------------------------------------------------------------
  // Test 2: Multi-line format
  // --------------------------------------------------------------------------

  it('parses multi-line capabilities block', () => {
    const lines = [
      '**Goal**: Build something',
      '**Capabilities**:',
      '  - use: skill/name1',
      '  - create: agent/my-agent',
      '  - after: skill/test-gen',
      '**Success Criteria**:',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(3);
    expect(refs[0]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'skill',
      name: 'name1',
    });
    expect(refs[1]).toEqual<CapabilityRef>({
      verb: 'create',
      type: 'agent',
      name: 'my-agent',
    });
    expect(refs[2]).toEqual<CapabilityRef>({
      verb: 'after',
      type: 'skill',
      name: 'test-gen',
    });
  });

  // --------------------------------------------------------------------------
  // Test 3: Multiple capabilities per verb line
  // --------------------------------------------------------------------------

  it('parses multiple capabilities on a single verb line', () => {
    const lines = [
      '**Capabilities**:',
      '  - use: skill/a, agent/b, team/c',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(3);
    expect(refs[0]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'skill',
      name: 'a',
    });
    expect(refs[1]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'agent',
      name: 'b',
    });
    expect(refs[2]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'team',
      name: 'c',
    });
  });

  // --------------------------------------------------------------------------
  // Test 4: Empty/no capabilities
  // --------------------------------------------------------------------------

  it('returns empty array when no capabilities declared', () => {
    const lines = [
      '**Goal**: Build something',
      '**Depends on**: Phase 54',
      '**Requirements**: CAP-02',
      '**Success Criteria**:',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 5: Block terminates at next metadata line
  // --------------------------------------------------------------------------

  it('terminates capabilities block at next metadata or heading', () => {
    const lines = [
      '**Capabilities**:',
      '  - use: skill/first',
      '**Success Criteria** (what must be TRUE):',
      '  - use: skill/should-not-parse',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('first');
  });

  it('terminates capabilities block at phase heading', () => {
    const lines = [
      '**Capabilities**:',
      '  - use: skill/first',
      '### Phase 56: Next Phase',
      '  - use: skill/should-not-parse',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('first');
  });

  it('terminates capabilities block at numbered list', () => {
    const lines = [
      '**Capabilities**:',
      '  - use: skill/first',
      '**Plans**:',
      '1. Some plan item',
      '  - use: skill/should-not-parse',
    ];

    const refs = parseCapabilityDeclarations(lines);

    // "use: skill/first" is the only valid one before **Plans**: terminates the block
    expect(refs).toHaveLength(1);
    expect(refs[0].name).toBe('first');
  });

  // --------------------------------------------------------------------------
  // Test 6: Invalid type/name format filtered out
  // --------------------------------------------------------------------------

  it('filters out entries with no slash separator', () => {
    const lines = [
      '**Capabilities**: use: invalid',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toEqual([]);
  });

  it('filters out entries with unknown type', () => {
    const lines = [
      '**Capabilities**: use: unknown/name',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Test 7: Mixed valid and invalid entries
  // --------------------------------------------------------------------------

  it('returns only valid entries from mixed line', () => {
    const lines = [
      '**Capabilities**: use: skill/good, invalid, unknown/bad, agent/valid',
    ];

    const refs = parseCapabilityDeclarations(lines);

    expect(refs).toHaveLength(2);
    expect(refs[0]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'skill',
      name: 'good',
    });
    expect(refs[1]).toEqual<CapabilityRef>({
      verb: 'use',
      type: 'agent',
      name: 'valid',
    });
  });
});
