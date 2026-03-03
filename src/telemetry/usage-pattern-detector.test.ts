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

// ---------------------------------------------------------------------------
// Helper for correction events (new in plan 41-02)
// ---------------------------------------------------------------------------

function buildEventsWithCorrections(sessions: Array<{
  sessionId: string;
  skills: Array<{
    name: string;
    score?: number;
    loaded?: boolean;
    skipped?: boolean;
    correction?: boolean;
  }>;
}>): UsageEvent[] {
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
      if (skill.correction) {
        events.push({
          type: 'skill-correction',
          skillName: skill.name,
          sessionId: session.sessionId,
          timestamp: ts,
        });
      }
    }
  }

  return events;
}

/** Build scored events for a single skill with explicit timestamps (for drift tests). */
function buildScoredWithTimestamps(
  skillName: string,
  scores: number[],
  baseSessionId = 'sess',
): UsageEvent[] {
  const base = new Date('2026-01-01T00:00:00Z').getTime();
  return scores.map((score, i) => ({
    type: 'skill-scored' as const,
    skillName,
    score,
    matchType: 'intent' as const,
    sessionId: `${baseSessionId}-${i}`,
    timestamp: new Date(base + i * 3_600_000).toISOString(), // 1 hour apart
  }));
}

// ---------------------------------------------------------------------------
// Correction magnet detection (PTRN-04)
// ---------------------------------------------------------------------------

describe('Correction magnet detection (PTRN-04)', () => {
  it('flags skill with correction rate > 0.3 in 10+ loaded sessions as correction magnet', async () => {
    // skill-X: loaded in 10 sessions, correction in 4 → rate=0.4 > 0.3
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'skill-X', loaded: true, ...(i < 4 ? { correction: true } : {}) },
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.correctionMagnets).toContain('skill-X');
    }
  });

  it('does NOT flag skill with correction rate <= 0.3', async () => {
    // skill-Y: loaded in 10 sessions, correction in 2 → rate=0.2 <= 0.3
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'skill-Y', loaded: true, ...(i < 2 ? { correction: true } : {}) },
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.correctionMagnets).not.toContain('skill-Y');
    }
  });

  it('does NOT flag skill loaded in only 3 sessions (below minimum of 5)', async () => {
    const sessions = [
      ...Array.from({ length: 3 }, (_, i) => ({
        sessionId: `sess-${i}`,
        skills: [{ name: 'skill-Z', loaded: true, correction: true }],
      })),
      // Pad to 10 sessions total
      ...Array.from({ length: 7 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'other', loaded: true }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.correctionMagnets).not.toContain('skill-Z');
    }
  });

  it('does NOT flag skill with zero corrections', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [{ name: 'clean-skill', loaded: true }],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.correctionMagnets).not.toContain('clean-skill');
    }
  });
});

// ---------------------------------------------------------------------------
// Score drift detection (PTRN-05)
// ---------------------------------------------------------------------------

describe('Score drift detection (PTRN-05)', () => {
  it('flags skill with significant score decline over time as score-drift', async () => {
    // First 6 events at score=0.9, next 6 at score=0.6
    // earlyAvg=0.9, recentAvg=0.6 → 0.6 < 0.9 × (1-0.15) = 0.765 → drift
    const driftEvents = buildScoredWithTimestamps(
      'drifting-skill',
      [...Array(6).fill(0.9), ...Array(6).fill(0.6)],
    );
    // Add enough sessions for the gate (need 10 distinct sessionIds)
    const padEvents = buildEventsWithCorrections(
      Array.from({ length: 5 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', loaded: true }],
      }))
    );
    const allEvents = [...driftEvents, ...padEvents];
    const detector = new UsagePatternDetector(makeStore(allEvents as UsageEvent[]));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.scoreDriftSkills).toContain('drifting-skill');
    }
  });

  it('does NOT flag skill with stable scores', async () => {
    const stableEvents = buildScoredWithTimestamps(
      'stable-skill',
      Array(12).fill(0.8),
    );
    const padEvents = buildEventsWithCorrections(
      Array.from({ length: 5 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', loaded: true }],
      }))
    );
    const detector = new UsagePatternDetector(makeStore([...stableEvents, ...padEvents] as UsageEvent[]));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.scoreDriftSkills).not.toContain('stable-skill');
    }
  });

  it('does NOT flag skill with fewer than 10 scored events (below minimum)', async () => {
    const fewEvents = buildScoredWithTimestamps(
      'few-events-skill',
      [...Array(4).fill(0.9), ...Array(4).fill(0.2)], // only 8 events
    );
    const padEvents = buildEventsWithCorrections(
      Array.from({ length: 5 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', loaded: true }],
      }))
    );
    const detector = new UsagePatternDetector(makeStore([...fewEvents, ...padEvents] as UsageEvent[]));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.scoreDriftSkills).not.toContain('few-events-skill');
    }
  });

  it('does NOT flag skill with improving scores', async () => {
    // Scores going up: first 6 at 0.4, next 6 at 0.9
    const improvingEvents = buildScoredWithTimestamps(
      'improving-skill',
      [...Array(6).fill(0.4), ...Array(6).fill(0.9)],
    );
    const padEvents = buildEventsWithCorrections(
      Array.from({ length: 5 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', loaded: true }],
      }))
    );
    const detector = new UsagePatternDetector(makeStore([...improvingEvents, ...padEvents] as UsageEvent[]));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.scoreDriftSkills).not.toContain('improving-skill');
    }
  });
});

// ---------------------------------------------------------------------------
// Load-but-never-activate detection (PTRN-06)
// ---------------------------------------------------------------------------

describe('Load-never-activate detection (PTRN-06)', () => {
  it('flags skill loaded in 10+ sessions, never corrected, never scored above 0.5', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [{ name: 'passive-skill', loaded: true, score: 0.3 }],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.loadNeverActivateSkills).toContain('passive-skill');
    }
  });

  it('does NOT flag skill that has correction events', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'corrected-skill', loaded: true, score: 0.3, ...(i === 0 ? { correction: true } : {}) },
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.loadNeverActivateSkills).not.toContain('corrected-skill');
    }
  });

  it('does NOT flag skill scored above 0.5 threshold', async () => {
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [
        { name: 'high-score-skill', loaded: true, score: i === 0 ? 0.8 : 0.3 },
      ],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.loadNeverActivateSkills).not.toContain('high-score-skill');
    }
  });

  it('does NOT flag skill loaded in only 3 sessions (below loadNeverActivateMinLoads=5)', async () => {
    const sessions = [
      ...Array.from({ length: 3 }, (_, i) => ({
        sessionId: `sess-${i}`,
        skills: [{ name: 'rare-skill', loaded: true, score: 0.2 }],
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        sessionId: `pad-${i}`,
        skills: [{ name: 'pad-skill', loaded: true }],
      })),
    ];
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.loadNeverActivateSkills).not.toContain('rare-skill');
    }
  });

  it('flags skill with scores strictly below 0.5 threshold as never-activate', async () => {
    // score=0.49 is strictly below threshold (0.5) → skill is not "active" via score
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      sessionId: `sess-${i}`,
      skills: [{ name: 'borderline-skill', loaded: true, score: 0.49 }],
    }));
    const detector = new UsagePatternDetector(makeStore(buildEventsWithCorrections(sessions)));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(result.loadNeverActivateSkills).toContain('borderline-skill');
    }
  });
});

// ---------------------------------------------------------------------------
// Regression guard: existing patterns still work after plan 41-02 changes
// ---------------------------------------------------------------------------

describe('Regression guard: Plan 41-01 patterns unaffected', () => {
  it('PatternReport still has all original fields (highValueSkills, deadSkills, budgetCasualties)', async () => {
    const events = buildEvents(nSessions(15, [{ name: 'skill-a', score: 0.8, loaded: true }]));
    const detector = new UsagePatternDetector(makeStore(events));
    const result = await detector.analyze();
    expect(result.type).toBe('report');
    if (result.type === 'report') {
      expect(Array.isArray(result.highValueSkills)).toBe(true);
      expect(Array.isArray(result.deadSkills)).toBe(true);
      expect(Array.isArray(result.budgetCasualties)).toBe(true);
      expect(Array.isArray(result.correctionMagnets)).toBe(true);
      expect(Array.isArray(result.scoreDriftSkills)).toBe(true);
      expect(Array.isArray(result.loadNeverActivateSkills)).toBe(true);
    }
  });
});
