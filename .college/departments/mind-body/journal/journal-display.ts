/**
 * Journal Display -- renders practice journal data for human consumption.
 *
 * CRITICAL UX RULE: NO GUILT LANGUAGE.
 * - Never: "missed", "failed", "should have", "X days since", "falling behind"
 * - After absence: "Welcome back." -- NEVER "You missed X days"
 * - Gaps are gaps, not failures
 * - Energy shown as information, never judgment
 *
 * @module departments/mind-body/journal/journal-display
 */

import type { JournalEntry, MindBodyWingId } from '../types.js';

// ─── Wing Display Names ─────────────────────────────────────────────────────

const WING_NAMES: Record<MindBodyWingId, string> = {
  'breath': 'Breath',
  'meditation': 'Meditation',
  'yoga': 'Yoga',
  'pilates': 'Pilates',
  'martial-arts': 'Martial Arts',
  'tai-chi': 'Tai Chi',
  'relaxation': 'Relaxation',
  'philosophy': 'Philosophy',
};

// ─── JournalDisplay ─────────────────────────────────────────────────────────

/**
 * Renders journal data as human-readable text.
 *
 * All output follows the no-guilt principle: information is presented
 * factually, without judgment or comparison.
 */
export class JournalDisplay {
  /**
   * Render a welcome message based on practice history.
   *
   * - No sessions ever: warm invitation to begin
   * - Gap of more than 1 day: "Welcome back." (no mention of gap)
   * - Active streak: "Day [N]. The practice continues."
   */
  renderWelcome(lastSession: Date | null, streak: number): string {
    if (lastSession === null) {
      return 'Welcome to your practice journal. Every journey begins with a single step.';
    }

    if (streak === 0) {
      // There was a previous session but no active streak -- user is returning
      return 'Welcome back.';
    }

    return `Day ${streak}. The practice continues.`;
  }

  /**
   * Render a list of journal entries as readable text.
   * Shows date, duration, modules practiced, and energy levels.
   */
  renderEntryList(entries: JournalEntry[]): string {
    if (entries.length === 0) {
      return 'No entries yet. Your journal is ready when you are.';
    }

    const lines: string[] = [];

    for (const entry of entries) {
      const date = this.formatDate(entry.date);
      const duration = `${entry.durationMinutes} min`;
      const modules = entry.modules.map((m) => WING_NAMES[m] || m).join(', ');
      const energy = `Energy: ${entry.energyBefore} -> ${entry.energyAfter}`;

      let line = `${date}  ${duration}  ${modules}  ${energy}`;
      if (entry.observation) {
        line += `\n  "${entry.observation}"`;
      }

      lines.push(line);
    }

    return lines.join('\n');
  }

  /**
   * Render aggregate statistics from journal entries.
   * Shows total sessions, average duration, and favorite modules.
   * All stats are factual -- no judgment, no comparison.
   */
  renderStats(entries: JournalEntry[]): string {
    if (entries.length === 0) {
      return 'No sessions recorded yet.';
    }

    const totalSessions = entries.length;
    const totalDuration = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const avgDuration = Math.round(totalDuration / totalSessions);

    // Count module frequencies
    const moduleCounts = new Map<MindBodyWingId, number>();
    for (const entry of entries) {
      for (const mod of entry.modules) {
        moduleCounts.set(mod, (moduleCounts.get(mod) || 0) + 1);
      }
    }

    // Sort by frequency descending
    const sorted = [...moduleCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topModules = sorted.slice(0, 3).map(([id, count]) => {
      const name = WING_NAMES[id] || id;
      return `${name} (${count} sessions)`;
    });

    const lines = [
      `Total sessions: ${totalSessions}`,
      `Average duration: ${avgDuration} min`,
    ];

    if (topModules.length > 0) {
      lines.push(`Most practiced: ${topModules.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Format a Date as a readable string (YYYY-MM-DD).
   */
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
