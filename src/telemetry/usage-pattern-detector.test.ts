import { describe, it, expect, vi } from 'vitest';
import { UsagePatternDetector } from './usage-pattern-detector.js';
import type { EventStore } from './event-store.js';
import type { UsageEvent } from './types.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeStore(events: UsageEvent[]): EventStore {
  return {
    read: vi.fn(async () => events),
    append: vi.fn(async () => {}),
    getFileSizeBytes: vi.fn(async () => 0),
  } as unknown as EventStore;
}

/** Build a flat UsageEvent array from a simple session description. */
interface SessionSpec {
  sessionId: string;
  skills: Array<{
    name: string;
    /** Score to emit a skill-scored event (omit to skip scoring). */
    score?: number;
    /** Emit a skill-loaded event for this skill. */
    loaded?: boolean;
    /** Emit a skill-budget-skipped event for this skill. */
    skipped?: boolean;
  }>;
}

function buildEvents(sessions: SessionSpec[]): UsageEvent[] {
  const events: UsageEvent[] = [];
  const ts = new Date().toISOString();

  for (const session of sessions) {
    for (const skill of session.skills) {
      if (skill.score !== undefined) {
        events.push({
          type: 'skill-scored',
          skillName: skill.name,
          score: skill.score,
          matchType: 'intent',
          sessionId: session.sessionId,
          timestamp: ts,
        });
      }
      if (skill.loaded) {
        events.push({
          type: 'skill-loaded',
          skillName: skill.name,
          tokenCount: 400,
          sessionId: session.sessionId,
          timestamp: ts,
        });
      }
      if (skill.skipped) {
        events.push({
          type: 'skill-budget-skipped',
          skillName: skill.name,
          reason: 'budget_exceeded',
          estimatedTokens: 800,
          sessionId: session.sessionId,
          timestamp: ts,
        });
      }
    }
  }

  return events;
}

/** Create N sessions each with the given skill specs. sessionIds are 'sess-0' ... 'sess-N-1'. */
function nSessions(n: number, skills: SessionSpec['skills']): SessionSpec[] {
  return Array.from({ length: n }, (_, i) => ({ sessionId: `sess-${i}`, skills }));
}

// ---------------------------------------------------------------------------
// Minimum session gate (PTRN-07)
// ---------------------------------------------------------------------------

describe('PatternInsufficient (minimum session gate)', () => {
  it('returns insufficient when store has 0 sessions', async () => {
    const detector = new UsagePatternDetector(makeStore([]));
    const result = await detector.analyze();
    expect(result.type).toBe('insufficient');
    if (result.type === 'insufficient') {
      expect(result.sessionCount).toBe(0);
      expect(result.minimumRequired).toBe(10);
      expect(result.message).toContain('10 sessions');
    }
  });

  it('returns insufficient when store has 9 distinct sessions', async () => {
    const events = buildEvents(nSessions(9, [{ name: 'skill-a', score: 0.7, loaded: true }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('insufficient');
    if (result.type === 'insufficient') {
      expect(result.sessionCount).toBe(9);
    }
  });

  it('returns a report (not insufficient) when store has exactly 10 distinct sessions', async () => {
    const events = buildEvents(nSessions(10, [{ name: 'skill-a', score: 0.7, loaded: true }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
  });

  it('message includes actual count when insufficient', async () => {
    const events = buildEvents(nSessions(3, [{ name: 'skill-a', score: 0.5 }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('insufficient');
    if (result.type === 'insufficient') {
      expect(result.message).toContain('3');
    }
  });

  it('respects custom minimumSessions config', async () => {
    const events = buildEvents(nSessions(5, [{ name: 'skill-a', score: 0.5 }]));
    const detector = new UsagePatternDetector(makeStore(events), { minimumSessions: 3 });
    const result = await detector.analyze();
    // 5 sessions >= 3 minimum → should return a report
    expect(result.type).toBe('report');
  });
});

// ---------------------------------------------------------------------------
// PatternReport basics
// ---------------------------------------------------------------------------

describe('PatternReport structure', () => {
  it('totalSessions matches distinct sessionId count', async () => {
    const events = buildEvents(nSessions(15, [{ name: 'skill-a', score: 0.8, loaded: true }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.totalSessions).toBe(15);
    }
  });

  it('analyzedSkills contains one entry per distinct skill', async () => {
    const events = buildEvents(
      nSessions(10, [
        { name: 'skill-a', score: 0.8, loaded: true },
        { name: 'skill-b', score: 0.6 },
        { name: 'skill-c', skipped: true },
      ])
    );
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      const names = result.analyzedSkills.map(e => e.skillName).sort();
      expect(names).toEqual(['skill-a', 'skill-b', 'skill-c'].sort());
    }
  });
});

// ---------------------------------------------------------------------------
// High-value detection (PTRN-01)
// ---------------------------------------------------------------------------

describe('High-value detection (PTRN-01)', () => {
  it('identifies top 10% skills by loadRate × avgScore', async () => {
    // skill-A: loaded in all 30 sessions, scored at 0.9 → loadRate=1.0, value=0.9
    // skill-B: loaded in 5 of 30 sessions, scored at 0.5 → loadRate=0.167, value=0.083
    const sessions: SessionSpec[] = Array.from({ length: 30 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'skill-A', score: 0.9, loaded: true },
        // skill-B only loaded in first 5 sessions
        ...(i < 5 ? [{ name: 'skill-B', score: 0.5, loaded: true }] : []),
      ],
    }));

    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      // With 2 loaded skills, top 10% = ceil(2 * 0.1) = 1
      expect(result.highValueSkills).toContain('skill-A');
      expect(result.highValueSkills).not.toContain('skill-B');
    }
  });

  it('highValueSkills is empty when no skills have been loaded', async () => {
    // Only scored events, no loads
    const events = buildEvents(nSessions(15, [{ name: 'skill-a', score: 0.9 }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.highValueSkills).toHaveLength(0);
    }
  });

  it('includes at least 1 skill in highValueSkills when skills exist with loads', async () => {
    // 10 skills, each loaded once — ceil(10 * 0.1) = 1
    const sessions: SessionSpec[] = nSessions(10, [
      ...Array.from({ length: 10 }, (_, i) => ({
        name: `skill-${i}`,
        score: (i + 1) * 0.1,
        loaded: true as const,
      })),
    ]);
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.highValueSkills.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Dead skill detection (PTRN-02)
// ---------------------------------------------------------------------------

describe('Dead skill detection (PTRN-02)', () => {
  it('identifies skill loaded but never scored as dead when totalSessions >= 30', async () => {
    const sessions: SessionSpec[] = Array.from({ length: 30 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'active-skill', score: 0.8, loaded: true },
        // dead-skill appears in first 5 sessions (loaded) but never scored
        ...(i < 5 ? [{ name: 'dead-skill', loaded: true as const }] : []),
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.deadSkills).toContain('dead-skill');
    }
  });

  it('dead detection is empty when totalSessions < 30 (deadSkillSessionThreshold)', async () => {
    // Only 15 sessions — below the 30-session threshold for dead detection
    const events = buildEvents(
      nSessions(15, [
        { name: 'active-skill', score: 0.8, loaded: true },
        { name: 'dead-skill', loaded: true }, // never scored
      ])
    );
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.deadSkills).toHaveLength(0);
    }
  });

  it('scored skill does NOT appear in deadSkills', async () => {
    const sessions: SessionSpec[] = nSessions(30, [
      { name: 'skill-a', score: 0.7, loaded: true },
    ]);
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.deadSkills).not.toContain('skill-a');
    }
  });

  it('skill that only appears in scored events (no load/skip) does NOT appear in deadSkills', async () => {
    // A skill only scored (not loaded or skipped) has no "presence" outside scoring
    const sessions: SessionSpec[] = nSessions(30, [
      { name: 'scored-only', score: 0.6 },
    ]);
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.deadSkills).not.toContain('scored-only');
    }
  });

  it('identifies budget-skipped but never scored skill as dead when totalSessions >= 30', async () => {
    const sessions: SessionSpec[] = Array.from({ length: 30 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'active-skill', score: 0.8, loaded: true },
        ...(i < 10 ? [{ name: 'ghost-skill', skipped: true as const }] : []),
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.deadSkills).toContain('ghost-skill');
    }
  });
});

// ---------------------------------------------------------------------------
// Budget casualty detection (PTRN-03)
// ---------------------------------------------------------------------------

describe('Budget casualty detection (PTRN-03)', () => {
  it('identifies skill with skip rate > 0.5 scored in 10+ sessions as budget casualty', async () => {
    // skill-X: scored in 10 sessions, budget-skipped in 7 → rate = 0.7
    const sessions: SessionSpec[] = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'skill-X', score: 0.8, ...(i < 7 ? { skipped: true as const } : { loaded: true as const }) },
      ],
    }));
    // Add more sessions to reach 10-session minimum
    const allSessions = [
      ...sessions,
      ...Array.from({ length: 10 }, (_, i) => ({
        sessionId: `extra-${i}`,
        skills: [{ name: 'other-skill', score: 0.5, loaded: true as const }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEvents(allSessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.budgetCasualties).toContain('skill-X');
    }
  });

  it('skill scored in only 3 sessions does NOT appear in budgetCasualties (below minimum)', async () => {
    // Only 3 scored sessions (below budgetCasualtyMinSessions=5)
    const sessions: SessionSpec[] = [
      ...Array.from({ length: 3 }, (_, i) => ({
        sessionId: `sess-${i}`,
        skills: [{ name: 'skill-Y', score: 0.8, skipped: true as const }],
      })),
      // Pad to 10 sessions for gate
      ...Array.from({ length: 7 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', score: 0.5, loaded: true as const }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.budgetCasualties).not.toContain('skill-Y');
    }
  });

  it('skill with skip rate exactly at threshold (0.5) does NOT appear in budgetCasualties', async () => {
    // skip rate = 5/10 = 0.5 — not strictly greater than threshold
    const sessions: SessionSpec[] = [
      ...Array.from({ length: 5 }, (_, i) => ({
        sessionId: `sess-skip-${i}`,
        skills: [{ name: 'borderline', score: 0.8, skipped: true as const }],
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        sessionId: `sess-load-${i}`,
        skills: [{ name: 'borderline', score: 0.8, loaded: true as const }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.budgetCasualties).not.toContain('borderline');
    }
  });

  it('skill with skip rate below 0.5 does NOT appear in budgetCasualties', async () => {
    // skip rate = 4/10 = 0.4
    const sessions: SessionSpec[] = [
      ...Array.from({ length: 4 }, (_, i) => ({
        sessionId: `sess-skip-${i}`,
        skills: [{ name: 'low-skip', score: 0.8, skipped: true as const }],
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        sessionId: `sess-load-${i}`,
        skills: [{ name: 'low-skip', score: 0.8, loaded: true as const }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEvents(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.budgetCasualties).not.toContain('low-skip');
    }
  });
});
