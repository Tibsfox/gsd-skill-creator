/**
 * Practice Journal Tests
 *
 * Tests for PracticeJournal, JournalDisplay, and StreakTracker.
 * Uses os.tmpdir() for filesystem tests to avoid writing to the working tree.
 *
 * CRITICAL: All display output is scanned for forbidden guilt language.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

import { PracticeJournal } from './practice-journal.js';
import { JournalDisplay } from './journal-display.js';
import { StreakTracker } from './streak-tracker.js';
import type { JournalEntry, MindBodyWingId } from '../types.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a journal entry for a given date offset from today. */
function makeEntry(daysAgo: number, overrides: Partial<JournalEntry> = {}): JournalEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(12, 0, 0, 0);
  return {
    date,
    durationMinutes: 15,
    modules: ['yoga'] as MindBodyWingId[],
    energyBefore: 3 as const,
    energyAfter: 4 as const,
    ...overrides,
  };
}

/** Create entries for consecutive days ending today. */
function makeConsecutiveEntries(count: number): JournalEntry[] {
  return Array.from({ length: count }, (_, i) => makeEntry(count - 1 - i));
}

/** Forbidden guilt-language terms. */
const FORBIDDEN_TERMS = ['missed', 'failed', 'should have', 'days since', 'falling behind'];

/** Scan text for forbidden guilt language. */
function assertNoGuiltLanguage(text: string): void {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    expect(lower).not.toContain(term);
  }
}

// ─── PracticeJournal Tests ──────────────────────────────────────────────────

describe('PracticeJournal', () => {
  let tmpDir: string;
  let journal: PracticeJournal;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'journal-test-'));
    journal = new PracticeJournal(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('addEntry creates file in data directory', async () => {
    const entry = makeEntry(0);
    await journal.addEntry(entry);

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const filePath = join(tmpDir, `${y}-${m}-${d}.json`);
    expect(existsSync(filePath)).toBe(true);
  });

  it('getEntry returns the entry for a given date', async () => {
    const entry = makeEntry(0, { observation: 'Great session' });
    await journal.addEntry(entry);

    const retrieved = await journal.getEntry(entry.date);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.durationMinutes).toBe(15);
    expect(retrieved!.observation).toBe('Great session');
    expect(retrieved!.modules).toEqual(['yoga']);
  });

  it('getEntry returns null for missing date', async () => {
    const farDate = new Date(2020, 0, 1);
    const result = await journal.getEntry(farDate);
    expect(result).toBeNull();
  });

  it('getEntries returns entries in date range', async () => {
    const entries = makeConsecutiveEntries(5);
    for (const e of entries) {
      await journal.addEntry(e);
    }

    // Get entries from 3 days ago to 1 day ago
    const start = new Date();
    start.setDate(start.getDate() - 3);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);

    const result = await journal.getEntries(start, end);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('getEntries returns all entries when no range specified', async () => {
    const entries = makeConsecutiveEntries(3);
    for (const e of entries) {
      await journal.addEntry(e);
    }

    const result = await journal.getEntries();
    expect(result.length).toBe(3);
  });

  it('getEntries returns empty array for empty journal', async () => {
    const result = await journal.getEntries();
    expect(result).toEqual([]);
  });

  it('getStreak returns 0 for no entries', async () => {
    const streak = await journal.getStreak();
    expect(streak).toBe(0);
  });

  it('getStreak returns correct count for consecutive days', async () => {
    const entries = makeConsecutiveEntries(4);
    for (const e of entries) {
      await journal.addEntry(e);
    }

    const streak = await journal.getStreak();
    expect(streak).toBe(4);
  });

  it('getStreak resets after gap', async () => {
    // Add entry 5 days ago, then 1 day ago and today (gap of 3 days)
    await journal.addEntry(makeEntry(5));
    await journal.addEntry(makeEntry(1));
    await journal.addEntry(makeEntry(0));

    const streak = await journal.getStreak();
    expect(streak).toBe(2); // only the recent consecutive pair
  });

  it('getTotalSessions counts all entries', async () => {
    const entries = makeConsecutiveEntries(3);
    for (const e of entries) {
      await journal.addEntry(e);
    }

    const total = await journal.getTotalSessions();
    expect(total).toBe(3);
  });

  it('getTotalSessions returns 0 for empty journal', async () => {
    const total = await journal.getTotalSessions();
    expect(total).toBe(0);
  });

  it('getLastSessionDate returns the most recent date', async () => {
    await journal.addEntry(makeEntry(3));
    await journal.addEntry(makeEntry(1));
    await journal.addEntry(makeEntry(5));

    const last = await journal.getLastSessionDate();
    expect(last).not.toBeNull();
    // Most recent should be 1 day ago
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expect(last!.getDate()).toBe(expected.getDate());
  });

  it('getLastSessionDate returns null for empty journal', async () => {
    const last = await journal.getLastSessionDate();
    expect(last).toBeNull();
  });

  it('addEntry preserves all fields through round-trip', async () => {
    const entry: JournalEntry = {
      date: new Date(2026, 2, 1, 12, 0, 0),
      durationMinutes: 30,
      modules: ['tai-chi', 'meditation'],
      energyBefore: 2,
      energyAfter: 5,
      observation: 'Found a new level of calm.',
    };
    await journal.addEntry(entry);

    const retrieved = await journal.getEntry(new Date(2026, 2, 1));
    expect(retrieved).not.toBeNull();
    expect(retrieved!.durationMinutes).toBe(30);
    expect(retrieved!.modules).toEqual(['tai-chi', 'meditation']);
    expect(retrieved!.energyBefore).toBe(2);
    expect(retrieved!.energyAfter).toBe(5);
    expect(retrieved!.observation).toBe('Found a new level of calm.');
  });
});

// ─── JournalDisplay Tests ───────────────────────────────────────────────────

describe('JournalDisplay', () => {
  let display: JournalDisplay;

  beforeEach(() => {
    display = new JournalDisplay();
  });

  describe('renderWelcome', () => {
    it('shows warm invitation for new user', () => {
      const text = display.renderWelcome(null, 0);
      expect(text).toContain('Every journey begins with a single step');
      assertNoGuiltLanguage(text);
    });

    it('says "Welcome back" after absence -- NOT "You missed X days"', () => {
      const lastSession = new Date();
      lastSession.setDate(lastSession.getDate() - 10);
      const text = display.renderWelcome(lastSession, 0);
      expect(text).toBe('Welcome back.');
      assertNoGuiltLanguage(text);
    });

    it('shows active streak with day count', () => {
      const lastSession = new Date();
      const text = display.renderWelcome(lastSession, 7);
      expect(text).toContain('Day 7');
      expect(text).toContain('The practice continues');
      assertNoGuiltLanguage(text);
    });

    it('never contains forbidden guilt language in any scenario', () => {
      // Test all scenarios
      const scenarios = [
        display.renderWelcome(null, 0),
        display.renderWelcome(new Date(2020, 0, 1), 0),
        display.renderWelcome(new Date(), 1),
        display.renderWelcome(new Date(), 100),
      ];
      for (const text of scenarios) {
        assertNoGuiltLanguage(text);
      }
    });
  });

  describe('renderEntryList', () => {
    it('shows informational text for empty list', () => {
      const text = display.renderEntryList([]);
      expect(text).toContain('ready when you are');
      assertNoGuiltLanguage(text);
    });

    it('shows date, duration, modules, and energy', () => {
      const entry = makeEntry(0, {
        durationMinutes: 20,
        modules: ['yoga', 'breath'],
        energyBefore: 2,
        energyAfter: 4,
      });
      const text = display.renderEntryList([entry]);
      expect(text).toContain('20 min');
      expect(text).toContain('Yoga');
      expect(text).toContain('Breath');
      expect(text).toContain('2 -> 4');
      assertNoGuiltLanguage(text);
    });

    it('includes observation when present', () => {
      const entry = makeEntry(0, { observation: 'Felt grounded.' });
      const text = display.renderEntryList([entry]);
      expect(text).toContain('Felt grounded.');
      assertNoGuiltLanguage(text);
    });

    it('scan ALL display output for forbidden terms', () => {
      const entries = makeConsecutiveEntries(5);
      const text = display.renderEntryList(entries);
      assertNoGuiltLanguage(text);
    });
  });

  describe('renderStats', () => {
    it('shows factual stats for entries', () => {
      const entries = [
        makeEntry(0, { durationMinutes: 10, modules: ['yoga'] }),
        makeEntry(1, { durationMinutes: 20, modules: ['yoga', 'breath'] }),
        makeEntry(2, { durationMinutes: 30, modules: ['tai-chi'] }),
      ];
      const text = display.renderStats(entries);
      expect(text).toContain('Total sessions: 3');
      expect(text).toContain('Average duration: 20 min');
      expect(text).toContain('Most practiced');
      assertNoGuiltLanguage(text);
    });

    it('shows informational text for no sessions', () => {
      const text = display.renderStats([]);
      expect(text).toContain('No sessions recorded yet');
      assertNoGuiltLanguage(text);
    });

    it('stats show factual information without judgment', () => {
      const entries = makeConsecutiveEntries(10);
      const text = display.renderStats(entries);
      assertNoGuiltLanguage(text);
      // Should not contain comparative or judgmental terms
      expect(text.toLowerCase()).not.toContain('better');
      expect(text.toLowerCase()).not.toContain('worse');
      expect(text.toLowerCase()).not.toContain('not enough');
    });
  });
});

// ─── StreakTracker Tests ────────────────────────────────────────────────────

describe('StreakTracker', () => {
  let tracker: StreakTracker;

  beforeEach(() => {
    tracker = new StreakTracker();
  });

  it('returns 0 for empty entries', () => {
    expect(tracker.calculateStreak([])).toBe(0);
  });

  it('counts consecutive days correctly', () => {
    const entries = makeConsecutiveEntries(5);
    expect(tracker.calculateStreak(entries)).toBe(5);
  });

  it('gap resets streak', () => {
    // 5 days ago, 4 days ago, then gap, then 1 day ago, today
    const entries = [
      makeEntry(5),
      makeEntry(4),
      makeEntry(1),
      makeEntry(0),
    ];
    expect(tracker.calculateStreak(entries)).toBe(2);
  });

  it('single entry has streak of 1', () => {
    const entries = [makeEntry(0)];
    expect(tracker.calculateStreak(entries)).toBe(1);
  });

  describe('getLongestStreak', () => {
    it('returns 0 for no entries', () => {
      expect(tracker.getLongestStreak([])).toBe(0);
    });

    it('finds longest streak even if not current', () => {
      // Past streak of 4 (10, 9, 8, 7 days ago), current streak of 2 (1, 0)
      const entries = [
        makeEntry(10),
        makeEntry(9),
        makeEntry(8),
        makeEntry(7),
        makeEntry(1),
        makeEntry(0),
      ];
      expect(tracker.getLongestStreak(entries)).toBe(4);
    });

    it('returns 1 for single entry', () => {
      expect(tracker.getLongestStreak([makeEntry(5)])).toBe(1);
    });

    it('tracks longest streak separately from current', () => {
      const entries = makeConsecutiveEntries(3);
      expect(tracker.getLongestStreak(entries)).toBe(3);
    });
  });

  describe('getActiveStatus', () => {
    it('returns "new" for 0 entries', () => {
      expect(tracker.getActiveStatus([])).toBe('new');
    });

    it('returns "active" when today has an entry', () => {
      const entries = [makeEntry(0)];
      expect(tracker.getActiveStatus(entries)).toBe('active');
    });

    it('returns "paused" when most recent entry is before today', () => {
      const entries = [makeEntry(3)];
      expect(tracker.getActiveStatus(entries)).toBe('paused');
    });

    it('uses "paused" not "broken" for gaps', () => {
      // This is a language/terminology check
      const status = tracker.getActiveStatus([makeEntry(5)]);
      expect(status).toBe('paused');
      expect(status).not.toBe('broken');
    });
  });
});
