/**
 * Stamp Reciprocity — Cross-validation protocol and reciprocity tracking.
 *
 * Tracks stamp reciprocity across the federation. When rig A stamps rig B's
 * work, B is encouraged (not required) to review A's work in return.
 *
 * Entry points:
 * - getStampBalance(query, handle): stamps issued vs received
 * - getReciprocityOpportunities(query, handle): completions from rigs who stamped you
 * - getStampGraph(query): full stamp network for analysis
 * - generateNotification(event): human-readable notification text
 *
 * No enforcement — reciprocity is encouraged, never required.
 *
 * @module stamp-reciprocity
 */

import { sqlEscape } from './sql-escape.js';

// ============================================================================
// Types
// ============================================================================

/** Stamp balance for a single rig */
export interface StampBalance {
  handle: string;
  stampsIssued: number;
  stampsReceived: number;
  balance: number;
  uniqueRigsStamped: number;
  uniqueRigsReceivedFrom: number;
}

/** A reciprocity opportunity — a completion from someone who stamped your work */
export interface ReciprocityOpportunity {
  completionId: string;
  wantedId: string;
  completedBy: string;
  evidence: string;
  title: string;
  theyStampedYou: number;
  youStampedThem: number;
}

/** A pair in the stamp graph */
export interface StampPair {
  stamper: string;
  recipient: string;
  count: number;
  avgQuality: number;
}

/** Stamp event for notification generation */
export interface StampEvent {
  stampId: string;
  stamper: string;
  recipient: string;
  wantedId: string;
  title: string;
  quality: number;
  reliability: number;
  creativity: number;
}

/** Query function matching DoltClient */
export type QueryFn = (sql: string) => Promise<{ rows: Record<string, unknown>[] }>;

// ============================================================================
// Balance
// ============================================================================

/**
 * Get stamp balance for a rig — how many stamps issued vs received.
 */
export async function getStampBalance(query: QueryFn, handle: string): Promise<StampBalance> {
  const escaped = sqlEscape(handle);

  const issuedResult = await query(
    `SELECT COUNT(*) as cnt, COUNT(DISTINCT subject) as unique_rigs FROM stamps WHERE author = '${escaped}'`
  );
  const receivedResult = await query(
    `SELECT COUNT(*) as cnt, COUNT(DISTINCT author) as unique_rigs FROM stamps WHERE subject = '${escaped}'`
  );

  const issued = Number(issuedResult.rows[0]?.cnt ?? 0);
  const received = Number(receivedResult.rows[0]?.cnt ?? 0);

  return {
    handle,
    stampsIssued: issued,
    stampsReceived: received,
    balance: issued - received,
    uniqueRigsStamped: Number(issuedResult.rows[0]?.unique_rigs ?? 0),
    uniqueRigsReceivedFrom: Number(receivedResult.rows[0]?.unique_rigs ?? 0),
  };
}

// ============================================================================
// Reciprocity Opportunities
// ============================================================================

/**
 * Find completions from rigs who have stamped your work but you haven't
 * stamped theirs. These are the highest-reciprocity review opportunities.
 */
export async function getReciprocityOpportunities(
  query: QueryFn,
  handle: string,
): Promise<ReciprocityOpportunity[]> {
  const escaped = sqlEscape(handle);

  // Find rigs who stamped our work
  const stampersResult = await query(
    `SELECT author, COUNT(*) as stamp_count FROM stamps WHERE subject = '${escaped}' GROUP BY author`
  );

  if (stampersResult.rows.length === 0) return [];

  const opportunities: ReciprocityOpportunity[] = [];

  for (const row of stampersResult.rows) {
    const stamper = row.author as string;
    const theyStampedYou = Number(row.stamp_count);

    // Count how many times we've stamped them back
    const reverseResult = await query(
      `SELECT COUNT(*) as cnt FROM stamps WHERE author = '${escaped}' AND subject = '${sqlEscape(stamper)}'`
    );
    const youStampedThem = Number(reverseResult.rows[0]?.cnt ?? 0);

    // Find their unstamped completions
    const completionsResult = await query(
      `SELECT c.id, c.wanted_id, c.completed_by, c.evidence, w.title ` +
      `FROM completions c LEFT JOIN wanted w ON c.wanted_id = w.id ` +
      `WHERE c.completed_by = '${sqlEscape(stamper)}' AND c.validated_by IS NULL`
    );

    for (const comp of completionsResult.rows) {
      opportunities.push({
        completionId: comp.id as string,
        wantedId: (comp.wanted_id as string) || '',
        completedBy: stamper,
        evidence: (comp.evidence as string) || '',
        title: (comp.title as string) || (comp.wanted_id as string) || '',
        theyStampedYou,
        youStampedThem,
      });
    }
  }

  // Sort: highest reciprocity debt first (they stamped you most, you stamped them least)
  opportunities.sort((a, b) => {
    const debtA = a.theyStampedYou - a.youStampedThem;
    const debtB = b.theyStampedYou - b.youStampedThem;
    return debtB - debtA;
  });

  return opportunities;
}

// ============================================================================
// Stamp Graph
// ============================================================================

/**
 * Get the full stamp graph — all stamper→recipient pairs with counts.
 */
export async function getStampGraph(query: QueryFn): Promise<StampPair[]> {
  const result = await query(
    `SELECT author, subject, COUNT(*) as cnt, AVG(JSON_EXTRACT(valence, '$.quality')) as avg_q ` +
    `FROM stamps GROUP BY author, subject ORDER BY cnt DESC`
  );

  return result.rows.map(row => ({
    stamper: row.author as string,
    recipient: row.subject as string,
    count: Number(row.cnt),
    avgQuality: Number(row.avg_q ?? 0),
  }));
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Generate a human-readable notification for a stamp event.
 */
export function generateNotification(event: StampEvent): string {
  const avg = ((event.quality + event.reliability + event.creativity) / 3).toFixed(1);
  return `${event.stamper} validated your completion on "${event.title}" ` +
    `(Q:${event.quality}/R:${event.reliability}/C:${event.creativity}, avg ${avg}). ` +
    `Consider reviewing their open work in return.`;
}

/**
 * Generate a reciprocity nudge for a rig with imbalanced stamps.
 */
export function generateReciprocityNudge(balance: StampBalance): string | null {
  if (balance.stampsReceived === 0) return null;
  if (balance.balance >= 0) return null;

  const debt = Math.abs(balance.balance);
  return `You've received ${balance.stampsReceived} stamp(s) from ${balance.uniqueRigsReceivedFrom} rig(s) ` +
    `but issued ${balance.stampsIssued}. ${debt} review(s) would balance the exchange. ` +
    `Run \`wl stamp --list\` to find work to validate.`;
}
