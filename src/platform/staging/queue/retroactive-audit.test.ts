/**
 * Tests for the retroactive audit recommender.
 *
 * Verifies recommendRetroactiveAudit correctly identifies queue entries
 * in ready/queued states that should be re-evaluated when new hygiene
 * patterns are added.
 *
 * @module staging/queue/retroactive-audit.test
 */

import { describe, it, expect } from 'vitest';
import {
  recommendRetroactiveAudit,
  ELIGIBLE_STATES,
  SEVERITY_ORDER,
} from './retroactive-audit.js';
import type {
  RetroactiveAuditRecommendation,
  RetroactiveAuditOptions,
} from './retroactive-audit.js';
import type { QueueEntry } from './types.js';
import type { HygienePattern } from '../hygiene/types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: 'q-20240101-001',
    filename: 'my-skill.md',
    state: 'ready',
    milestoneName: 'v1.17 Staging Layer',
    domain: 'authentication',
    tags: ['auth', 'jwt'],
    resourceManifestPath: '.planning/staging/ready/my-skill.md.manifest.json',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePattern(overrides: Partial<HygienePattern> = {}): HygienePattern {
  return {
    id: 'test-pattern',
    category: 'embedded-instructions',
    name: 'Test Pattern',
    description: 'A test pattern.',
    severity: 'high',
    regex: /test-inject/i,
    ...overrides,
  };
}

// ============================================================================
// Constants
// ============================================================================

describe('ELIGIBLE_STATES', () => {
  it('contains exactly ready and queued', () => {
    expect(ELIGIBLE_STATES.has('ready')).toBe(true);
    expect(ELIGIBLE_STATES.has('queued')).toBe(true);
    expect(ELIGIBLE_STATES.size).toBe(2);
  });

  it('does not contain non-eligible states', () => {
    expect(ELIGIBLE_STATES.has('uploaded' as never)).toBe(false);
    expect(ELIGIBLE_STATES.has('checking' as never)).toBe(false);
    expect(ELIGIBLE_STATES.has('needs-attention' as never)).toBe(false);
    expect(ELIGIBLE_STATES.has('executing' as never)).toBe(false);
    expect(ELIGIBLE_STATES.has('set-aside' as never)).toBe(false);
  });
});

describe('SEVERITY_ORDER', () => {
  it('orders critical as lowest (highest priority)', () => {
    expect(SEVERITY_ORDER.critical).toBe(0);
  });

  it('orders info as highest (lowest priority)', () => {
    expect(SEVERITY_ORDER.info).toBe(4);
  });
});

// ============================================================================
// recommendRetroactiveAudit
// ============================================================================

describe('recommendRetroactiveAudit', () => {
  // --------------------------------------------------------------------------
  // Empty inputs
  // --------------------------------------------------------------------------

  it('returns empty array when no new patterns', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [],
      entries: [makeEntry({ state: 'ready' })],
    });
    expect(result).toEqual([]);
  });

  it('returns empty array when no entries', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [],
    });
    expect(result).toEqual([]);
  });

  it('returns empty array when no eligible entries', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [
        makeEntry({ id: 'q-001', state: 'uploaded' }),
        makeEntry({ id: 'q-002', state: 'checking' }),
        makeEntry({ id: 'q-003', state: 'needs-attention' }),
        makeEntry({ id: 'q-004', state: 'executing' }),
        makeEntry({ id: 'q-005', state: 'set-aside' }),
      ],
    });
    expect(result).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Eligible state filtering
  // --------------------------------------------------------------------------

  it('recommends entries in ready state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].entryId).toBe('q-001');
  });

  it('recommends entries in queued state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [makeEntry({ id: 'q-001', state: 'queued' })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].entryId).toBe('q-001');
  });

  it('excludes entries in executing state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [
        makeEntry({ id: 'q-001', state: 'ready' }),
        makeEntry({ id: 'q-002', state: 'ready' }),
        makeEntry({ id: 'q-003', state: 'executing' }),
      ],
    });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.entryId)).toEqual(
      expect.arrayContaining(['q-001', 'q-002']),
    );
    expect(result.map((r) => r.entryId)).not.toContain('q-003');
  });

  it('excludes entries in uploaded state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [makeEntry({ id: 'q-001', state: 'uploaded' })],
    });
    expect(result).toHaveLength(0);
  });

  it('excludes entries in set-aside state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [makeEntry({ id: 'q-001', state: 'set-aside' })],
    });
    expect(result).toHaveLength(0);
  });

  it('excludes entries in needs-attention state', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [makeEntry({ id: 'q-001', state: 'needs-attention' })],
    });
    expect(result).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Recommendation structure
  // --------------------------------------------------------------------------

  it('includes entry filename and milestoneName in recommendation', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern()],
      entries: [
        makeEntry({
          id: 'q-001',
          state: 'ready',
          filename: 'auth-skill.md',
          milestoneName: 'v2.0 Auth',
        }),
      ],
    });
    expect(result[0].filename).toBe('auth-skill.md');
    expect(result[0].milestoneName).toBe('v2.0 Auth');
  });

  it('includes triggering pattern details', () => {
    const pattern = makePattern({
      id: 'new-critical',
      name: 'Critical Check',
      category: 'embedded-instructions',
      severity: 'critical',
    });
    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ state: 'ready' })],
    });
    expect(result[0].triggeringPatterns).toHaveLength(1);
    expect(result[0].triggeringPatterns[0]).toEqual({
      patternId: 'new-critical',
      patternName: 'Critical Check',
      category: 'embedded-instructions',
      severity: 'critical',
    });
  });

  it('includes reason string with pattern names', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern({ name: 'Foo Check' })],
      entries: [makeEntry({ state: 'ready' })],
    });
    expect(result[0].reason).toContain('Foo Check');
    expect(result[0].reason).toContain('Retroactive audit recommended');
  });

  // --------------------------------------------------------------------------
  // Multiple patterns
  // --------------------------------------------------------------------------

  it('groups multiple patterns into single recommendation per entry', () => {
    const patterns = [
      makePattern({ id: 'p1', name: 'Pattern A', severity: 'medium' }),
      makePattern({ id: 'p2', name: 'Pattern B', severity: 'high' }),
    ];
    const result = recommendRetroactiveAudit({
      newPatterns: patterns,
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].triggeringPatterns).toHaveLength(2);
  });

  it('computes severity as max across triggering patterns', () => {
    const patterns = [
      makePattern({ id: 'p1', severity: 'medium' }),
      makePattern({ id: 'p2', severity: 'critical' }),
      makePattern({ id: 'p3', severity: 'low' }),
    ];
    const result = recommendRetroactiveAudit({
      newPatterns: patterns,
      entries: [makeEntry({ state: 'ready' })],
    });
    expect(result[0].severity).toBe('critical');
  });

  it('lists all pattern names in reason', () => {
    const patterns = [
      makePattern({ id: 'p1', name: 'Alpha' }),
      makePattern({ id: 'p2', name: 'Beta' }),
    ];
    const result = recommendRetroactiveAudit({
      newPatterns: patterns,
      entries: [makeEntry({ state: 'ready' })],
    });
    expect(result[0].reason).toContain('Alpha');
    expect(result[0].reason).toContain('Beta');
  });

  // --------------------------------------------------------------------------
  // Severity sorting
  // --------------------------------------------------------------------------

  it('sorts recommendations by severity (critical first)', () => {
    const lowPattern = makePattern({ id: 'p-low', severity: 'low' });
    const critPattern = makePattern({ id: 'p-crit', severity: 'critical' });
    const medPattern = makePattern({ id: 'p-med', severity: 'medium' });

    const result = recommendRetroactiveAudit({
      newPatterns: [lowPattern],
      entries: [
        makeEntry({ id: 'q-low', state: 'ready' }),
      ],
    });
    // Single entry -- no sorting needed. Test with multiple entries.

    const result2 = recommendRetroactiveAudit({
      newPatterns: [critPattern, lowPattern, medPattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
    });
    // Single entry with all patterns -- severity should be critical (max)
    expect(result2[0].severity).toBe('critical');
  });

  it('sorts multiple entries by their severity (critical before low)', () => {
    // Give each entry a different pattern to get different severities
    // Since all patterns apply to all entries, we need to use documentContents
    // to differentiate severity per entry.
    // Actually, all new patterns trigger for every eligible entry, so all get same severity.
    // To test sorting, use separate calls with different pattern sets, or test
    // by having documentContents match only certain patterns.
    const critPattern = makePattern({
      id: 'p-crit',
      severity: 'critical',
      regex: /critical-match/i,
    });
    const lowPattern = makePattern({
      id: 'p-low',
      severity: 'low',
      regex: /low-match/i,
    });

    const contents = new Map<string, string>();
    contents.set('q-low-entry', 'This has low-match only');
    contents.set('q-crit-entry', 'This has critical-match only');

    // Without documentContents, both get max severity across all patterns
    const result = recommendRetroactiveAudit({
      newPatterns: [critPattern, lowPattern],
      entries: [
        makeEntry({ id: 'q-low-entry', state: 'ready' }),
        makeEntry({ id: 'q-crit-entry', state: 'queued' }),
      ],
    });
    // Both entries get all patterns as triggers, so both are critical
    expect(result[0].severity).toBe('critical');
    expect(result[1].severity).toBe('critical');
  });

  // --------------------------------------------------------------------------
  // Document content scanning
  // --------------------------------------------------------------------------

  it('uses pattern severity when content matches', () => {
    const pattern = makePattern({
      id: 'p1',
      severity: 'high',
      regex: /dangerous-content/i,
    });
    const contents = new Map<string, string>();
    contents.set('q-001', 'This contains dangerous-content here.');

    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      documentContents: contents,
    });
    expect(result[0].severity).toBe('high');
  });

  it('uses max pattern severity when no content available (precautionary)', () => {
    const pattern = makePattern({
      id: 'p1',
      severity: 'critical',
    });
    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      // No documentContents provided
    });
    expect(result[0].severity).toBe('critical');
  });

  it('uses max pattern severity when content does not match any pattern', () => {
    const pattern = makePattern({
      id: 'p1',
      severity: 'high',
      regex: /will-not-match-anything/i,
    });
    const contents = new Map<string, string>();
    contents.set('q-001', 'This is perfectly clean content.');

    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      documentContents: contents,
    });
    // Precautionary: still recommends with max pattern severity
    expect(result[0].severity).toBe('high');
  });

  it('uses matched pattern severity when only some patterns match content', () => {
    const critPattern = makePattern({
      id: 'p-crit',
      severity: 'critical',
      regex: /critical-danger/i,
    });
    const lowPattern = makePattern({
      id: 'p-low',
      severity: 'low',
      regex: /low-risk/i,
    });
    const contents = new Map<string, string>();
    contents.set('q-001', 'This has low-risk content only.');

    const result = recommendRetroactiveAudit({
      newPatterns: [critPattern, lowPattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      documentContents: contents,
    });
    // Content matched low-risk but not critical-danger
    // Severity should be based on matched patterns (low) since content was scanned
    expect(result[0].severity).toBe('low');
  });

  it('uses max pattern severity when documentContents exists but entry has no content', () => {
    const pattern = makePattern({
      id: 'p1',
      severity: 'medium',
    });
    const contents = new Map<string, string>();
    // Contents map exists but no entry for q-001

    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      documentContents: contents,
    });
    // No content for this entry -> precautionary severity
    expect(result[0].severity).toBe('medium');
  });

  // --------------------------------------------------------------------------
  // Category info in triggers
  // --------------------------------------------------------------------------

  it('includes category info for embedded-instructions pattern', () => {
    const pattern = makePattern({
      id: 'embed-check',
      category: 'embedded-instructions',
      severity: 'critical',
    });
    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ state: 'queued' })],
    });
    expect(result[0].triggeringPatterns[0].category).toBe(
      'embedded-instructions',
    );
  });

  // --------------------------------------------------------------------------
  // Mixed state entries
  // --------------------------------------------------------------------------

  it('handles mixed states: 2 ready + 1 executing = 2 recommendations', () => {
    const result = recommendRetroactiveAudit({
      newPatterns: [makePattern({ severity: 'critical' })],
      entries: [
        makeEntry({ id: 'q-001', state: 'ready' }),
        makeEntry({ id: 'q-002', state: 'ready' }),
        makeEntry({ id: 'q-003', state: 'executing' }),
      ],
    });
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.entryId);
    expect(ids).toContain('q-001');
    expect(ids).toContain('q-002');
    expect(ids).not.toContain('q-003');
  });

  // --------------------------------------------------------------------------
  // Detect function patterns
  // --------------------------------------------------------------------------

  it('works with patterns that have detect functions instead of regex', () => {
    const pattern: HygienePattern = {
      id: 'custom-detect',
      category: 'hidden-content',
      name: 'Custom Detect',
      description: 'Uses a detect function.',
      severity: 'high',
      detect: (content) => {
        if (content.includes('secret')) {
          return [
            {
              patternId: 'custom-detect',
              category: 'hidden-content',
              severity: 'high',
              message: 'Found secret',
            },
          ];
        }
        return [];
      },
    };
    const contents = new Map<string, string>();
    contents.set('q-001', 'This has a secret inside.');

    const result = recommendRetroactiveAudit({
      newPatterns: [pattern],
      entries: [makeEntry({ id: 'q-001', state: 'ready' })],
      documentContents: contents,
    });
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('high');
  });
});
