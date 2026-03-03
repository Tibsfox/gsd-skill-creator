/**
 * Badge Retrofit Tests — validates complete badge coverage for Phase 1 rooms (1-14)
 * Verifies that every room has minimum Explorer + Apprentice badge coverage.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const engineDir = __dirname;

const badges = JSON.parse(readFileSync(resolve(engineDir, 'badge-definitions.json'), 'utf-8'));
const prerequisiteGraph = JSON.parse(readFileSync(resolve(engineDir, 'badge-prerequisite-graph.json'), 'utf-8'));
const pathRoomMapping = JSON.parse(readFileSync(resolve(engineDir, 'path-room-mapping.json'), 'utf-8'));
const retrofitMapping = JSON.parse(readFileSync(resolve(engineDir, 'badge-retrofit-mapping.json'), 'utf-8'));

// Helper: get all badges for a room
function getBadgesForRoom(roomId: number) {
  return badges.filter((b: Record<string, unknown>) => b.roomId === roomId);
}

// Helper: get badges for a room by tier
function getBadgesByTier(roomId: number, tier: string) {
  return getBadgesForRoom(roomId).filter((b: Record<string, unknown>) => b.tier === tier);
}

// Helper: get badge by ID
function getBadgeById(id: string) {
  return badges.find((b: Record<string, unknown>) => b.id === id);
}

// ============================================================================
// Describe block 1: Room Coverage — Explorer Badges
// ============================================================================
describe('Room Coverage — Explorer Badges', () => {
  it('Room 1 has at least one explorer badge', () => {
    expect(getBadgesByTier(1, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 2 has at least one explorer badge', () => {
    expect(getBadgesByTier(2, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 3 has at least one explorer badge', () => {
    expect(getBadgesByTier(3, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 4 has at least one explorer badge', () => {
    expect(getBadgesByTier(4, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 5 has at least one explorer badge', () => {
    expect(getBadgesByTier(5, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 6 has at least one explorer badge', () => {
    expect(getBadgesByTier(6, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 7 has at least one explorer badge', () => {
    expect(getBadgesByTier(7, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 8 has at least one explorer badge', () => {
    expect(getBadgesByTier(8, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 9 has at least one explorer badge', () => {
    expect(getBadgesByTier(9, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 10 has at least one explorer badge', () => {
    expect(getBadgesByTier(10, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 11 has at least one explorer badge', () => {
    expect(getBadgesByTier(11, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 12 has at least one explorer badge', () => {
    expect(getBadgesByTier(12, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 13 has at least one explorer badge', () => {
    expect(getBadgesByTier(13, 'explorer').length).toBeGreaterThan(0);
  });

  it('Room 14 has at least one explorer badge', () => {
    expect(getBadgesByTier(14, 'explorer').length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Describe block 2: Room Coverage — Apprentice Badges
// ============================================================================
describe('Room Coverage — Apprentice Badges', () => {
  it('Room 1 has at least one apprentice badge', () => {
    expect(getBadgesByTier(1, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 2 has at least one apprentice badge', () => {
    expect(getBadgesByTier(2, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 3 has at least one apprentice badge', () => {
    expect(getBadgesByTier(3, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 4 has at least one apprentice badge', () => {
    expect(getBadgesByTier(4, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 5 has at least one apprentice badge', () => {
    expect(getBadgesByTier(5, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 6 has at least one apprentice badge', () => {
    expect(getBadgesByTier(6, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 7 has at least one apprentice badge', () => {
    expect(getBadgesByTier(7, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 8 has at least one apprentice badge', () => {
    expect(getBadgesByTier(8, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 9 has at least one apprentice badge', () => {
    expect(getBadgesByTier(9, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 10 has at least one apprentice badge', () => {
    expect(getBadgesByTier(10, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 11 has at least one apprentice badge', () => {
    expect(getBadgesByTier(11, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 12 has at least one apprentice badge', () => {
    expect(getBadgesByTier(12, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 13 has at least one apprentice badge', () => {
    expect(getBadgesByTier(13, 'apprentice').length).toBeGreaterThan(0);
  });

  it('Room 14 has at least one apprentice badge', () => {
    expect(getBadgesByTier(14, 'apprentice').length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Describe block 3: Path Coverage — All 9 Paths Have Multiple Rooms
// ============================================================================
describe('Path Coverage — All 9 Paths Have Multiple Rooms', () => {
  it('shelter path spans multiple rooms', () => {
    expect(pathRoomMapping['shelter'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('food path spans multiple rooms', () => {
    expect(pathRoomMapping['food'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('fiber path spans multiple rooms', () => {
    expect(pathRoomMapping['fiber'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('watercraft path spans multiple rooms', () => {
    expect(pathRoomMapping['watercraft'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('plant path spans multiple rooms', () => {
    expect(pathRoomMapping['plant'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('tool path spans multiple rooms', () => {
    expect(pathRoomMapping['tool'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('music path has at least one room', () => {
    // Music path is currently Room 6 only in Phase 1; Phase 2 may expand
    expect(pathRoomMapping['music'].rooms.length).toBeGreaterThanOrEqual(1);
  });

  it('neighbors path spans multiple rooms', () => {
    expect(pathRoomMapping['neighbors'].rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('heritage path spans multiple rooms', () => {
    expect(pathRoomMapping['heritage'].rooms.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// Describe block 4: Badge Retrofit Mapping Completeness
// ============================================================================
describe('Badge Retrofit Mapping Completeness', () => {
  it('retrofitMapping has exactly 14 room mappings', () => {
    expect(retrofitMapping.roomMappings.length).toBe(14);
  });

  it('retrofit mapping covers rooms 1 through 14 with no gaps', () => {
    const roomIds = retrofitMapping.roomMappings.map((m: Record<string, unknown>) => m.roomId as number);
    const sorted = [...roomIds].sort((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('every room mapping has a non-empty badgeIds array', () => {
    for (const mapping of retrofitMapping.roomMappings) {
      const m = mapping as { roomId: number; badgeIds: string[] };
      expect(m.badgeIds.length).toBeGreaterThan(0);
    }
  });

  it('every room mapping has a trySessions array (even if empty for module-based rooms)', () => {
    for (const mapping of retrofitMapping.roomMappings) {
      const m = mapping as { roomId: number; trySessions: unknown[] };
      expect(Array.isArray(m.trySessions)).toBe(true);
    }
  });

  it('all badgeIds in retrofit mapping exist in badge-definitions.json', () => {
    const allBadgeIds = new Set(badges.map((b: Record<string, unknown>) => b.id as string));
    for (const mapping of retrofitMapping.roomMappings) {
      const m = mapping as { roomId: number; badgeIds: string[] };
      for (const badgeId of m.badgeIds) {
        expect(allBadgeIds.has(badgeId)).toBe(true);
      }
    }
  });

  it('heritage-animals-apprentice-01 requires heritage-animals-explorer-01 in prerequisite graph', () => {
    expect(prerequisiteGraph['heritage-animals-apprentice-01']).toContain('heritage-animals-explorer-01');
  });

  it('tool-smithing-explorer-01 exists in badge-definitions.json', () => {
    const badge = getBadgeById('tool-smithing-explorer-01');
    expect(badge).toBeDefined();
    expect((badge as Record<string, unknown>).tier).toBe('explorer');
    expect((badge as Record<string, unknown>).roomId).toBe(7);
  });

  it('food-arctic-explorer-01 exists in badge-definitions.json', () => {
    const badge = getBadgeById('food-arctic-explorer-01');
    expect(badge).toBeDefined();
    expect((badge as Record<string, unknown>).tier).toBe('explorer');
    expect((badge as Record<string, unknown>).roomId).toBe(14);
  });

  it('food-arctic-apprentice-01 has food-arctic-explorer-01 in prerequisite graph', () => {
    expect(prerequisiteGraph['food-arctic-apprentice-01']).toContain('food-arctic-explorer-01');
  });

  it('heritage-seasonal-explorer-01 exists in badge-definitions.json', () => {
    const badge = getBadgeById('heritage-seasonal-explorer-01');
    expect(badge).toBeDefined();
    expect((badge as Record<string, unknown>).tier).toBe('explorer');
    expect((badge as Record<string, unknown>).roomId).toBe(11);
  });

  it('heritage-pottery-apprentice-01 has heritage-pottery-explorer-01 in prerequisite graph', () => {
    expect(prerequisiteGraph['heritage-pottery-apprentice-01']).toContain('heritage-pottery-explorer-01');
  });

  it('total badge count is at least 55 (43 existing + 12 new)', () => {
    expect(badges.length).toBeGreaterThanOrEqual(55);
  });

  it('no duplicate badge IDs in badge-definitions.json', () => {
    const ids = badges.map((b: Record<string, unknown>) => b.id as string);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all Explorer badges have at least 2 components; all other tiers have exactly 4 components', () => {
    for (const badge of badges) {
      const b = badge as Record<string, unknown>;
      const components = b.components as unknown[];
      if (b.tier === 'explorer') {
        expect(components.length).toBeGreaterThanOrEqual(2);
      } else {
        expect(components.length).toBe(4);
      }
    }
  });

  it('all badge components have type matching one of: story, skill, relationship, reflection', () => {
    const validTypes = new Set(['story', 'skill', 'relationship', 'reflection']);
    for (const badge of badges) {
      const b = badge as Record<string, unknown>;
      const components = b.components as Array<Record<string, unknown>>;
      for (const component of components) {
        expect(validTypes.has(component.type as string)).toBe(true);
      }
    }
  });
});
