/**
 * Trust CLI Renderer Tests
 *
 * Tests progressive disclosure rendering — Willow's design.
 * All tests verify text content, ignoring ANSI color codes.
 */

import { describe, it, expect } from 'vitest';
import {
  detailLevel,
  renderTrustBadge,
  renderContractType,
  formatTimeRemaining,
  renderRelationshipCompact,
  renderRelationshipDetail,
  renderRelationshipList,
  renderTrustOverview,
  renderCharacterSheet,
  renderPublicProfile,
} from '../trust-cli-renderer.js';
import {
  createRelationship,
  createCharacterSheet,
} from '../trust-relationship.js';
import type { GraphDiversity } from '../trust-graph.js';

// ============================================================================
// Helpers
// ============================================================================

const now = new Date('2026-08-25T18:00:00Z');

function makeRel(
  from: string,
  to: string,
  type: 'permanent' | 'long-term' | 'event-scoped' | 'project-scoped' | 'ephemeral' = 'permanent',
  opts?: { fromLabel?: string; toLabel?: string; ttlSeconds?: number | null; autoRenew?: boolean },
) {
  return createRelationship(from, to, type, 0.8, 0.7, 0.75, 0.65, {
    fromLabel: opts?.fromLabel,
    toLabel: opts?.toLabel,
    ttlSeconds: opts?.ttlSeconds,
    autoRenew: opts?.autoRenew,
    now,
  });
}

// ============================================================================
// Detail Level
// ============================================================================

describe('detailLevel', () => {
  it('maps level 1 to seedling', () => {
    expect(detailLevel(1)).toBe('seedling');
  });

  it('maps level 2 to sapling', () => {
    expect(detailLevel(2)).toBe('sapling');
  });

  it('maps level 3 to old-growth', () => {
    expect(detailLevel(3)).toBe('old-growth');
  });

  it('maps level 0 to seedling', () => {
    expect(detailLevel(0)).toBe('seedling');
  });
});

// ============================================================================
// Trust Badge
// ============================================================================

describe('renderTrustBadge', () => {
  it('includes Seedling for level 1', () => {
    expect(renderTrustBadge(1)).toContain('Seedling');
  });

  it('includes Sapling for level 2', () => {
    expect(renderTrustBadge(2)).toContain('Sapling');
  });

  it('includes Old Growth for level 3', () => {
    expect(renderTrustBadge(3)).toContain('Old Growth');
  });

  it('includes Outsider for level 0', () => {
    expect(renderTrustBadge(0)).toContain('Outsider');
  });
});

// ============================================================================
// Format Time Remaining
// ============================================================================

describe('formatTimeRemaining', () => {
  it('formats seconds', () => {
    expect(formatTimeRemaining(45)).toBe('45s');
  });

  it('formats minutes', () => {
    expect(formatTimeRemaining(300)).toBe('5m');
  });

  it('formats hours', () => {
    expect(formatTimeRemaining(7200)).toBe('2h');
  });

  it('formats days', () => {
    expect(formatTimeRemaining(172800)).toBe('2d');
  });

  it('returns expired for 0', () => {
    expect(formatTimeRemaining(0)).toBe('expired');
  });

  it('returns empty for Infinity', () => {
    expect(formatTimeRemaining(Infinity)).toBe('');
  });
});

// ============================================================================
// Relationship Compact Rendering
// ============================================================================

describe('renderRelationshipCompact', () => {
  it('seedling: shows handles and type only', () => {
    const rel = makeRel('fox-042', 'cedar-011');
    const output = renderRelationshipCompact(rel, 'seedling', now);

    expect(output).toContain('fox-042');
    expect(output).toContain('cedar-011');
    expect(output).toContain('permanent');
    // No labels at seedling level
    expect(output).not.toContain('"family"');
  });

  it('sapling: shows labels', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'permanent', {
      fromLabel: 'family',
      toLabel: 'family',
    });
    const output = renderRelationshipCompact(rel, 'sapling', now);

    expect(output).toContain('"family"');
  });

  it('old-growth: shows harmony score', () => {
    const rel = makeRel('fox-042', 'cedar-011');
    const output = renderRelationshipCompact(rel, 'old-growth', now);

    expect(output).toContain('harmony=');
  });

  it('shows auto-renew indicator', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'ephemeral', {
      ttlSeconds: 3600,
      autoRenew: true,
    });
    const output = renderRelationshipCompact(rel, 'seedling', now);

    expect(output).toContain('♻');
  });

  it('shows time remaining for expiring contracts', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'ephemeral', {
      ttlSeconds: 3600,
    });
    const output = renderRelationshipCompact(rel, 'seedling', now);

    expect(output).toContain('expires in');
  });

  it('shows [EXPIRED] tag for expired contracts', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'ephemeral', {
      ttlSeconds: 60,
    });
    // Advance time past expiry
    const later = new Date(now.getTime() + 120_000);
    const output = renderRelationshipCompact(rel, 'seedling', later);

    expect(output).toContain('EXPIRED');
    expect(output).not.toContain('expires in');
  });
});

// ============================================================================
// Relationship Detail Rendering
// ============================================================================

describe('renderRelationshipDetail', () => {
  it('seedling: shows plain language description', () => {
    const rel = makeRel('fox-042', 'cedar-011');
    const output = renderRelationshipDetail(rel, 'seedling', now);

    expect(output).toContain('fox-042');
    expect(output).toContain('cedar-011');
    // Should have a plain language description (from describeAsymmetry level 1)
    expect(output).toMatch(/connection|trust|both ways/i);
  });

  it('sapling: shows labels and description', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'permanent', {
      fromLabel: 'family',
      toLabel: 'chosen family',
    });
    const output = renderRelationshipDetail(rel, 'sapling', now);

    expect(output).toContain('"family"');
    expect(output).toContain('"chosen family"');
  });

  it('old-growth: shows full numerical detail', () => {
    const rel = makeRel('fox-042', 'cedar-011');
    const output = renderRelationshipDetail(rel, 'old-growth', now);

    // Should have asymmetry classification with numbers
    expect(output).toMatch(/harmony=|mag-ratio=/);
    // Should show individual vector descriptions
    expect(output).toContain('fox-042:');
    expect(output).toContain('cedar-011:');
    expect(output).toMatch(/r=\d+\.\d+/);
  });

  it('shows renewal count when present', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'ephemeral', {
      ttlSeconds: 3600,
      autoRenew: true,
    });
    // Simulate a renewed contract
    const renewed = {
      ...rel,
      contract: { ...rel.contract, renewalCount: 3 },
    };
    const output = renderRelationshipDetail(renewed, 'sapling', now);

    expect(output).toContain('renewed 3×');
  });
});

// ============================================================================
// Relationship List
// ============================================================================

describe('renderRelationshipList', () => {
  it('shows count header', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011'),
      makeRel('fox-042', 'raven-007', 'event-scoped', { ttlSeconds: 604800 }),
    ];
    const output = renderRelationshipList('fox-042', rels, 'seedling', now);

    expect(output).toContain('2 active');
  });

  it('shows guidance when empty', () => {
    const output = renderRelationshipList('fox-042', [], 'seedling', now);

    expect(output).toContain('No active trust connections');
    expect(output).toContain('wl trust add');
  });

  it('does not show add hint at sapling level', () => {
    const output = renderRelationshipList('fox-042', [], 'sapling', now);

    expect(output).toContain('No active trust connections');
    expect(output).not.toContain('wl trust add');
  });
});

// ============================================================================
// Trust Overview
// ============================================================================

describe('renderTrustOverview', () => {
  it('seedling: shows handle, level, connection count', () => {
    const output = renderTrustOverview({
      handle: 'fox-042',
      trustLevel: 1,
      activeConnections: 3,
      bondCount: 0,
    });

    expect(output).toContain('fox-042');
    expect(output).toContain('Seedling');
    expect(output).toContain('3 active connections');
  });

  it('sapling: shows bond count', () => {
    const output = renderTrustOverview({
      handle: 'fox-042',
      trustLevel: 2,
      activeConnections: 5,
      bondCount: 2,
    });

    expect(output).toContain('Sapling');
    expect(output).toContain('2 multi-context bonds');
  });

  it('seedling: hides bond count', () => {
    const output = renderTrustOverview({
      handle: 'fox-042',
      trustLevel: 1,
      activeConnections: 5,
      bondCount: 2,
    });

    expect(output).not.toContain('bond');
  });

  it('old-growth: shows graph diversity', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 3,
      typesPresent: ['permanent', 'event-scoped', 'ephemeral'],
      score: 0.6,
      activeConnectionCount: 5,
    };
    const output = renderTrustOverview({
      handle: 'fox-042',
      trustLevel: 3,
      activeConnections: 5,
      bondCount: 1,
      diversity,
    });

    expect(output).toContain('Old Growth');
    expect(output).toContain('Graph diversity: 0.60');
    expect(output).toContain('3/5 types');
    expect(output).toContain('permanent');
  });

  it('handles singular connection', () => {
    const output = renderTrustOverview({
      handle: 'fox-042',
      trustLevel: 1,
      activeConnections: 1,
      bondCount: 0,
    });

    expect(output).toContain('1 active connection');
    expect(output).not.toContain('connections');
  });
});

// ============================================================================
// Character Sheet
// ============================================================================

describe('renderCharacterSheet', () => {
  it('shows display name and handle', () => {
    const sheet = createCharacterSheet('fox-042', 'Foxy', {
      icon: 'fox-icon',
      bio: 'Forest dweller',
      now,
    });
    const output = renderCharacterSheet(sheet);

    expect(output).toContain('Foxy');
    expect(output).toContain('fox-042');
    expect(output).toContain('fox-icon');
    expect(output).toContain('Forest dweller');
  });

  it('shows camp and skills', () => {
    const sheet = createCharacterSheet('cedar-011', 'Cedar', {
      homeCamp: 'cedar-grove',
      visibleSkills: ['documentation', 'verification'],
      now,
    });
    const output = renderCharacterSheet(sheet);

    expect(output).toContain('cedar-grove');
    expect(output).toContain('documentation, verification');
  });

  it('shows custom fields', () => {
    const sheet = createCharacterSheet('raven-007', 'Raven', {
      customFields: { pronouns: 'they/them' },
      now,
    });
    const output = renderCharacterSheet(sheet);

    expect(output).toContain('pronouns: they/them');
  });

  it('shows reputation visibility', () => {
    const sheet = createCharacterSheet('owl-001', 'Owl', { now });
    const output = renderCharacterSheet(sheet);

    expect(output).toContain('summary');
  });
});

// ============================================================================
// Public Profile (Progressive Disclosure)
// ============================================================================

describe('renderPublicProfile', () => {
  const sheet = createCharacterSheet('cedar-011', 'Cedar', {
    icon: 'tree',
    bio: 'Scribe and oracle',
    homeCamp: 'cedar-grove',
    visibleSkills: ['documentation', 'verification'],
    customFields: { pronouns: 'they/them' },
    now,
  });

  it('seedling viewer: sees name, bio, camp only', () => {
    const output = renderPublicProfile(sheet, 1);

    expect(output).toContain('Cedar');
    expect(output).toContain('Scribe and oracle');
    expect(output).toContain('cedar-grove');
    // Skills and custom fields hidden at seedling
    expect(output).not.toContain('documentation');
    expect(output).not.toContain('pronouns');
  });

  it('sapling viewer: sees skills and custom fields', () => {
    const output = renderPublicProfile(sheet, 2);

    expect(output).toContain('Cedar');
    expect(output).toContain('documentation, verification');
    expect(output).toContain('pronouns: they/them');
  });

  it('old-growth viewer: sees full detail', () => {
    const output = renderPublicProfile(sheet, 3);

    expect(output).toContain('Cedar');
    expect(output).toContain('tree');
    expect(output).toContain('documentation, verification');
    expect(output).toContain('pronouns: they/them');
  });

  it('minimal sheet shows name only', () => {
    const minimal = createCharacterSheet('anon-001', 'Anonymous', { now });
    const output = renderPublicProfile(minimal, 3);

    expect(output).toContain('Anonymous');
    // No camp, bio, skills, or custom fields
  });
});
