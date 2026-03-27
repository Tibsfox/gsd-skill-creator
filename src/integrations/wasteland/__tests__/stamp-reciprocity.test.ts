/**
 * Tests for Stamp Reciprocity — balance tracking, opportunities, notifications.
 *
 * Covers:
 * - getStampBalance: issued vs received counts
 * - getReciprocityOpportunities: finds unstamped work from your stampers
 * - getStampGraph: full network pairs
 * - generateNotification: human-readable stamp notification
 * - generateReciprocityNudge: balance nudge text
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getStampBalance,
  getReciprocityOpportunities,
  getStampGraph,
  generateNotification,
  generateReciprocityNudge,
} from '../stamp-reciprocity.js';
import type { StampBalance, StampEvent, QueryFn } from '../stamp-reciprocity.js';

// ============================================================================
// Helpers
// ============================================================================

function mockQuery(responses: Record<string, unknown>[][]): QueryFn {
  let callIdx = 0;
  return vi.fn(async () => {
    const rows = responses[callIdx] || [];
    callIdx++;
    return { rows };
  });
}

// ============================================================================
// getStampBalance
// ============================================================================

describe('getStampBalance', () => {
  it('returns correct balance for active stamper', async () => {
    const query = mockQuery([
      [{ cnt: 4, unique_rigs: 3 }],  // issued
      [{ cnt: 1, unique_rigs: 1 }],  // received
    ]);
    const balance = await getStampBalance(query, 'fox');
    expect(balance.handle).toBe('fox');
    expect(balance.stampsIssued).toBe(4);
    expect(balance.stampsReceived).toBe(1);
    expect(balance.balance).toBe(3);
    expect(balance.uniqueRigsStamped).toBe(3);
    expect(balance.uniqueRigsReceivedFrom).toBe(1);
  });

  it('returns zeros for new rig', async () => {
    const query = mockQuery([
      [{ cnt: 0, unique_rigs: 0 }],
      [{ cnt: 0, unique_rigs: 0 }],
    ]);
    const balance = await getStampBalance(query, 'newbie');
    expect(balance.stampsIssued).toBe(0);
    expect(balance.stampsReceived).toBe(0);
    expect(balance.balance).toBe(0);
  });

  it('handles negative balance (received more than issued)', async () => {
    const query = mockQuery([
      [{ cnt: 1, unique_rigs: 1 }],
      [{ cnt: 5, unique_rigs: 3 }],
    ]);
    const balance = await getStampBalance(query, 'lurker');
    expect(balance.balance).toBe(-4);
  });
});

// ============================================================================
// getReciprocityOpportunities
// ============================================================================

describe('getReciprocityOpportunities', () => {
  it('finds unstamped completions from rigs who stamped you', async () => {
    const query = mockQuery([
      // stampers query
      [{ author: 'alice', stamp_count: 2 }],
      // reverse stamps (fox → alice)
      [{ cnt: 0 }],
      // alice's unstamped completions
      [{ id: 'c-al-1', wanted_id: 'w-1', completed_by: 'alice', evidence: 'PR #1', title: 'Feature' }],
    ]);
    const opps = await getReciprocityOpportunities(query, 'fox');
    expect(opps).toHaveLength(1);
    expect(opps[0].completedBy).toBe('alice');
    expect(opps[0].theyStampedYou).toBe(2);
    expect(opps[0].youStampedThem).toBe(0);
  });

  it('returns empty when no one has stamped you', async () => {
    const query = mockQuery([[]]);
    const opps = await getReciprocityOpportunities(query, 'loner');
    expect(opps).toEqual([]);
  });

  it('sorts by reciprocity debt (highest first)', async () => {
    const query = mockQuery([
      // two stampers
      [{ author: 'alice', stamp_count: 1 }, { author: 'bob', stamp_count: 5 }],
      // fox → alice: 1 stamp
      [{ cnt: 1 }],
      // alice's completions: none
      [],
      // fox → bob: 0 stamps
      [{ cnt: 0 }],
      // bob's completions: 1
      [{ id: 'c-bob-1', wanted_id: 'w-2', completed_by: 'bob', evidence: 'test', title: 'Bob work' }],
    ]);
    const opps = await getReciprocityOpportunities(query, 'fox');
    // Bob has higher debt (5 stamps given, 0 received back)
    expect(opps.length).toBeGreaterThan(0);
    expect(opps[0].completedBy).toBe('bob');
  });
});

// ============================================================================
// getStampGraph
// ============================================================================

describe('getStampGraph', () => {
  it('returns all stamper-recipient pairs', async () => {
    const query = mockQuery([
      [
        { author: 'fox', subject: 'alice', cnt: 3, avg_q: 4.0 },
        { author: 'alice', subject: 'fox', cnt: 1, avg_q: 5.0 },
      ],
    ]);
    const graph = await getStampGraph(query);
    expect(graph).toHaveLength(2);
    expect(graph[0].stamper).toBe('fox');
    expect(graph[0].count).toBe(3);
    expect(graph[0].avgQuality).toBe(4.0);
  });

  it('returns empty for no stamps', async () => {
    const query = mockQuery([[]]);
    expect(await getStampGraph(query)).toEqual([]);
  });
});

// ============================================================================
// generateNotification
// ============================================================================

describe('generateNotification', () => {
  it('generates readable notification', () => {
    const event: StampEvent = {
      stampId: 's-1',
      stamper: 'alice',
      recipient: 'fox',
      wantedId: 'w-1',
      title: 'Build parser',
      quality: 4,
      reliability: 5,
      creativity: 3,
    };
    const text = generateNotification(event);
    expect(text).toContain('alice');
    expect(text).toContain('Build parser');
    expect(text).toContain('Q:4');
    expect(text).toContain('R:5');
    expect(text).toContain('C:3');
    expect(text).toContain('4.0'); // avg
  });
});

// ============================================================================
// generateReciprocityNudge
// ============================================================================

describe('generateReciprocityNudge', () => {
  it('generates nudge when received > issued', () => {
    const balance: StampBalance = {
      handle: 'fox',
      stampsIssued: 1,
      stampsReceived: 4,
      balance: -3,
      uniqueRigsStamped: 1,
      uniqueRigsReceivedFrom: 2,
    };
    const nudge = generateReciprocityNudge(balance);
    expect(nudge).not.toBeNull();
    expect(nudge).toContain('3 review(s)');
    expect(nudge).toContain('wl stamp --list');
  });

  it('returns null when balanced or positive', () => {
    const balance: StampBalance = {
      handle: 'fox',
      stampsIssued: 4,
      stampsReceived: 2,
      balance: 2,
      uniqueRigsStamped: 2,
      uniqueRigsReceivedFrom: 1,
    };
    expect(generateReciprocityNudge(balance)).toBeNull();
  });

  it('returns null when no stamps received', () => {
    const balance: StampBalance = {
      handle: 'newbie',
      stampsIssued: 0,
      stampsReceived: 0,
      balance: 0,
      uniqueRigsStamped: 0,
      uniqueRigsReceivedFrom: 0,
    };
    expect(generateReciprocityNudge(balance)).toBeNull();
  });
});
