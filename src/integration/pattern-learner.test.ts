import { describe, it, expect } from 'vitest';
import { detectPatterns, getPackageWarning, PatternLearner } from './pattern-learner.js';
import type { HealthEvent } from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  packageName: string,
  projectId: string,
  classification: string,
): HealthEvent {
  return {
    id: `${packageName}-${projectId}`,
    timestamp: '2026-03-03T00:00:00.000Z',
    eventType: 'diagnosis',
    packageName,
    ecosystem: 'npm',
    packageVersion: '1.0.0',
    decisionRationale: `Package classified as ${classification}`,
    payload: { classification },
    projectId,
  };
}

/** Generate N events for a package across N distinct projects with given classification. */
function makeEventsForProjects(
  packageName: string,
  count: number,
  classification: string,
): HealthEvent[] {
  return Array.from({ length: count }, (_, i) =>
    makeEvent(packageName, `project-${i + 1}`, classification)
  );
}

// ─── detectPatterns ───────────────────────────────────────────────────────────

describe('detectPatterns', () => {
  it('returns [] when no events', () => {
    expect(detectPatterns([])).toEqual([]);
  });

  it('returns [] when fewer than 5 projects observed failure', () => {
    const events = makeEventsForProjects('bad-pkg', 4, 'abandoned');
    expect(detectPatterns(events)).toHaveLength(0);
  });

  it('returns PatternMatch when exactly 5 projects observed failure', () => {
    const events = makeEventsForProjects('bad-pkg', 5, 'abandoned');
    const matches = detectPatterns(events);
    expect(matches).toHaveLength(1);
    expect(matches[0].packageName).toBe('bad-pkg');
    expect(matches[0].projectCount).toBe(5);
  });

  it('returns PatternMatch when more than 5 projects observed failure', () => {
    const events = makeEventsForProjects('bad-pkg', 8, 'abandoned');
    const matches = detectPatterns(events);
    expect(matches[0].projectCount).toBe(8);
  });

  it('does NOT count healthy classifications as patterns', () => {
    const events = makeEventsForProjects('healthy-pkg', 10, 'healthy');
    expect(detectPatterns(events)).toHaveLength(0);
  });

  it('does NOT count aging classifications as patterns', () => {
    const events = makeEventsForProjects('aging-pkg', 10, 'aging');
    expect(detectPatterns(events)).toHaveLength(0);
  });

  it('counts abandoned as a pattern', () => {
    const events = makeEventsForProjects('pkg', 5, 'abandoned');
    expect(detectPatterns(events)).toHaveLength(1);
  });

  it('counts vulnerable as a pattern', () => {
    const events = makeEventsForProjects('pkg', 5, 'vulnerable');
    expect(detectPatterns(events)).toHaveLength(1);
  });

  it('counts stale as a pattern', () => {
    const events = makeEventsForProjects('pkg', 5, 'stale');
    expect(detectPatterns(events)).toHaveLength(1);
  });

  it('counts conflicting as a pattern', () => {
    const events = makeEventsForProjects('pkg', 5, 'conflicting');
    expect(detectPatterns(events)).toHaveLength(1);
  });

  it('counts each distinct projectId only once per package (deduplication)', () => {
    // 3 events for project-1 and 2 events for project-2 = 2 distinct projects, not 5
    const events = [
      makeEvent('pkg', 'project-1', 'abandoned'),
      makeEvent('pkg', 'project-1', 'abandoned'),
      makeEvent('pkg', 'project-1', 'abandoned'),
      makeEvent('pkg', 'project-2', 'abandoned'),
      makeEvent('pkg', 'project-2', 'abandoned'),
    ];
    // Only 2 distinct projects — below threshold of 5
    expect(detectPatterns(events)).toHaveLength(0);
  });

  it('same package in same project counted only once', () => {
    // 5 events from same project = still 1 distinct project
    const events = Array.from({ length: 5 }, () =>
      makeEvent('pkg', 'same-project', 'abandoned')
    );
    expect(detectPatterns(events)).toHaveLength(0);
  });

  it('results sorted by projectCount descending', () => {
    const events = [
      ...makeEventsForProjects('pkg-a', 7, 'abandoned'),
      ...makeEventsForProjects('pkg-b', 10, 'abandoned'),
      ...makeEventsForProjects('pkg-c', 5, 'abandoned'),
    ];
    const matches = detectPatterns(events);
    expect(matches[0].packageName).toBe('pkg-b'); // 10
    expect(matches[1].packageName).toBe('pkg-a'); // 7
    expect(matches[2].packageName).toBe('pkg-c'); // 5
  });

  it('patternSummary mentions packageName and projectCount', () => {
    const events = makeEventsForProjects('critical-dep', 6, 'abandoned');
    const matches = detectPatterns(events);
    expect(matches[0].patternSummary).toContain('critical-dep');
    expect(matches[0].patternSummary).toContain('6');
  });

  it('evidenceProjectIds is sorted', () => {
    const events = [
      makeEvent('pkg', 'project-z', 'abandoned'),
      makeEvent('pkg', 'project-a', 'abandoned'),
      makeEvent('pkg', 'project-m', 'abandoned'),
      makeEvent('pkg', 'project-b', 'abandoned'),
      makeEvent('pkg', 'project-c', 'abandoned'),
    ];
    const matches = detectPatterns(events);
    const ids = matches[0].evidenceProjectIds;
    expect(ids).toEqual([...ids].sort());
  });

  it('custom threshold: matches when projectCount >= threshold', () => {
    const events = makeEventsForProjects('pkg', 3, 'abandoned');
    const matches = detectPatterns(events, 3); // custom threshold
    expect(matches).toHaveLength(1);
  });

  it('does NOT match when projectCount < threshold', () => {
    const events = makeEventsForProjects('pkg', 3, 'abandoned');
    const matches = detectPatterns(events, 4); // threshold 4, only 3 projects
    expect(matches).toHaveLength(0);
  });

  it('multiple packages can each exceed threshold independently', () => {
    const events = [
      ...makeEventsForProjects('pkg-a', 5, 'abandoned'),
      ...makeEventsForProjects('pkg-b', 5, 'vulnerable'),
    ];
    const matches = detectPatterns(events);
    expect(matches).toHaveLength(2);
  });
});

// ─── getPackageWarning ────────────────────────────────────────────────────────

describe('getPackageWarning', () => {
  it('returns null when package has no pattern', () => {
    const events = makeEventsForProjects('unknown-pkg', 3, 'abandoned');
    expect(getPackageWarning(events, 'unknown-pkg')).toBeNull();
  });

  it('returns PatternMatch when package exceeds threshold', () => {
    const events = makeEventsForProjects('bad-pkg', 5, 'abandoned');
    const warning = getPackageWarning(events, 'bad-pkg');
    expect(warning).not.toBeNull();
    expect(warning!.packageName).toBe('bad-pkg');
  });

  it('returns null for a different package that is below threshold', () => {
    const events = [
      ...makeEventsForProjects('big-pkg', 5, 'abandoned'),
      ...makeEventsForProjects('small-pkg', 3, 'abandoned'),
    ];
    expect(getPackageWarning(events, 'small-pkg')).toBeNull();
  });
});

// ─── PatternLearner class ─────────────────────────────────────────────────────

describe('PatternLearner', () => {
  it('detect() delegates to detectPatterns', () => {
    const learner = new PatternLearner();
    const events = makeEventsForProjects('pkg', 5, 'abandoned');
    const matches = learner.detect(events);
    expect(matches).toHaveLength(1);
  });

  it('getWarning() delegates to getPackageWarning', () => {
    const learner = new PatternLearner();
    const events = makeEventsForProjects('pkg', 5, 'abandoned');
    const warning = learner.getWarning(events, 'pkg');
    expect(warning).not.toBeNull();
  });

  it('class uses custom threshold when configured', () => {
    const learner = new PatternLearner(3);
    const events = makeEventsForProjects('pkg', 3, 'abandoned');
    const matches = learner.detect(events);
    expect(matches).toHaveLength(1);
  });
});
