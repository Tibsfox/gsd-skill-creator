/**
 * Streak Tracker -- tracks consecutive practice days.
 *
 * Terminology note: When a streak ends, the status is "paused" -- never
 * "broken." A gap is a gap, not a failure.
 *
 * @module departments/mind-body/journal/streak-tracker
 */

import type { JournalEntry } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format a Date as YYYY-MM-DD for comparison. */
function dateToKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Get the previous calendar day. */
function previousDay(date: Date): Date {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return prev;
}

// ─── StreakTracker ───────────────────────────────────────────────────────────

/**
 * Calculates practice streaks from journal entries.
 *
 * A streak is a sequence of consecutive calendar days that each have at
 * least one journal entry. Gaps (even of one day) end the current streak
 * but the status is "paused" -- never negative language.
 */
export class StreakTracker {
  /**
   * Calculate the current streak -- consecutive days ending at the most
   * recent entry date.
   *
   * Returns 0 if there are no entries.
   */
  calculateStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    const dateSet = new Set(entries.map((e) => dateToKey(e.date)));

    // Find most recent date
    const sorted = [...entries].sort((a, b) => b.date.getTime() - a.date.getTime());
    let current = new Date(sorted[0].date);
    let streak = 0;

    while (dateSet.has(dateToKey(current))) {
      streak++;
      current = previousDay(current);
    }

    return streak;
  }

  /**
   * Find the longest streak in the entire entry history.
   */
  getLongestStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;

    // Get unique sorted dates
    const dateKeys = [...new Set(entries.map((e) => dateToKey(e.date)))].sort();

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dateKeys.length; i++) {
      const prevDate = new Date(dateKeys[i - 1] + 'T12:00:00');
      const currDate = new Date(dateKeys[i] + 'T12:00:00');

      // Check if dates are consecutive (difference of 1 day)
      const diffMs = currDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    return longest;
  }

  /**
   * Get the active status based on entries.
   *
   * - 'new': no entries at all
   * - 'active': the most recent entry is today
   * - 'paused': the most recent entry is before today (gap exists)
   */
  getActiveStatus(entries: JournalEntry[]): 'active' | 'paused' | 'new' {
    if (entries.length === 0) return 'new';

    const todayKey = dateToKey(new Date());
    const hasToday = entries.some((e) => dateToKey(e.date) === todayKey);

    return hasToday ? 'active' : 'paused';
  }
}
