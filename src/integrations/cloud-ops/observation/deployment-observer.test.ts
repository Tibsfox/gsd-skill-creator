/**
 * Tests for the DeploymentObserver.
 *
 * Covers event recording, pattern detection, promotion candidate identification,
 * statistics, config overrides, and event log lifecycle.
 *
 * @module cloud-ops/observation/deployment-observer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeploymentObserver } from './deployment-observer.js';
import type { DeploymentEvent } from './types.js';
import { DEFAULT_DEPLOYMENT_OBSERVER_CONFIG } from './types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Build a deployment event with sensible defaults.
 * Only override fields that matter for the specific test.
 */
function makeEvent(overrides: Partial<DeploymentEvent> = {}): DeploymentEvent {
  return {
    action: 'deploy',
    service: 'keystone',
    timestamp: new Date().toISOString(),
    durationMs: 1000,
    success: true,
    ...overrides,
  };
}

/**
 * Record N identical deploy sequences for the same service on the observer.
 * Each "sequence" is: prechecks → deploy → verify
 */
function recordDeploySequence(
  observer: DeploymentObserver,
  service: string,
  count: number,
  success = true,
): void {
  for (let i = 0; i < count; i++) {
    const base = Date.now() + i * 10000;
    observer.recordEvent(makeEvent({
      action: 'prechecks',
      service,
      timestamp: new Date(base).toISOString(),
      durationMs: 500,
      success: true,
    }));
    observer.recordEvent(makeEvent({
      action: 'deploy',
      service,
      timestamp: new Date(base + 500).toISOString(),
      durationMs: 3000,
      success,
    }));
    observer.recordEvent(makeEvent({
      action: 'verify',
      service,
      timestamp: new Date(base + 3500).toISOString(),
      durationMs: 800,
      success: true,
    }));
  }
}

// ---------------------------------------------------------------------------
// Event recording and retrieval
// ---------------------------------------------------------------------------

describe('DeploymentObserver -- event recording', () => {
  let observer: DeploymentObserver;

  beforeEach(() => {
    observer = new DeploymentObserver();
  });

  it('starts with an empty event log', () => {
    expect(observer.getEventLog()).toHaveLength(0);
  });

  it('records a single event and retrieves it', () => {
    const event = makeEvent({ action: 'deploy', service: 'keystone' });
    observer.recordEvent(event);

    const log = observer.getEventLog();
    expect(log).toHaveLength(1);
    expect(log[0].action).toBe('deploy');
    expect(log[0].service).toBe('keystone');
  });

  it('records multiple events in order', () => {
    observer.recordEvent(makeEvent({ action: 'prechecks', service: 'keystone' }));
    observer.recordEvent(makeEvent({ action: 'deploy', service: 'keystone' }));
    observer.recordEvent(makeEvent({ action: 'verify', service: 'keystone' }));

    const log = observer.getEventLog();
    expect(log).toHaveLength(3);
    expect(log[0].action).toBe('prechecks');
    expect(log[1].action).toBe('deploy');
    expect(log[2].action).toBe('verify');
  });

  it('getEventLog returns a copy (not a reference)', () => {
    observer.recordEvent(makeEvent({ action: 'deploy' }));
    const log = observer.getEventLog();
    // Mutating the copy should not affect the observer
    (log as DeploymentEvent[]).push(makeEvent({ action: 'rollback' }));

    expect(observer.getEventLog()).toHaveLength(1);
  });

  it('clearEventLog resets the event log to empty', () => {
    observer.recordEvent(makeEvent());
    observer.recordEvent(makeEvent());
    expect(observer.getEventLog()).toHaveLength(2);

    observer.clearEventLog();
    expect(observer.getEventLog()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Pattern detection
// ---------------------------------------------------------------------------

describe('DeploymentObserver -- detectPatterns', () => {
  let observer: DeploymentObserver;

  beforeEach(() => {
    // Use minOccurrences=3 (the default) for most tests
    observer = new DeploymentObserver();
  });

  it('returns empty array when event log is empty', () => {
    expect(observer.detectPatterns()).toEqual([]);
  });

  it('detects a pattern from 3 identical deploy sequences', () => {
    recordDeploySequence(observer, 'keystone', 3);

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].sequence).toEqual(['prechecks', 'deploy', 'verify']);
    expect(patterns[0].occurrences).toBe(3);
    expect(patterns[0].services).toContain('keystone');
  });

  it('does not return a sequence observed fewer than minOccurrences times', () => {
    recordDeploySequence(observer, 'keystone', 2); // below threshold of 3

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(0);
  });

  it('different sequences are not conflated', () => {
    // Sequence A: prechecks → deploy → verify (3 times for keystone)
    recordDeploySequence(observer, 'keystone', 3);

    // Sequence B: deploy → reconfigure (3 times for nova)
    for (let i = 0; i < 3; i++) {
      observer.recordEvent(makeEvent({ action: 'deploy', service: 'nova' }));
      observer.recordEvent(makeEvent({ action: 'reconfigure', service: 'nova' }));
    }

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(2);

    const sequences = patterns.map(p => p.sequence.join(':'));
    expect(sequences).toContain('prechecks:deploy:verify');
    expect(sequences).toContain('deploy:reconfigure');
  });

  it('computes success rate from success flags', () => {
    // 3 occurrences: 2 succeed, 1 fails
    recordDeploySequence(observer, 'nova', 2, true);
    recordDeploySequence(observer, 'nova', 1, false);

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(1);
    // Success rate: 2 fully-succeeded / 3 total = 0.667
    expect(patterns[0].successRate).toBeGreaterThan(0.5);
    expect(patterns[0].successRate).toBeLessThan(1.0);
  });

  it('computes average duration across occurrences', () => {
    // Record events with known durations: 3 sequences with total duration 4300ms each
    for (let i = 0; i < 3; i++) {
      observer.recordEvent(makeEvent({ action: 'prechecks', service: 'cinder', durationMs: 500 }));
      observer.recordEvent(makeEvent({ action: 'deploy', service: 'cinder', durationMs: 3000 }));
      observer.recordEvent(makeEvent({ action: 'verify', service: 'cinder', durationMs: 800 }));
    }

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].avgDurationMs).toBe(4300);
  });

  it('pattern includes firstSeen and lastSeen timestamps', () => {
    const t0 = '2026-01-01T00:00:00.000Z';
    const t1 = '2026-01-02T00:00:00.000Z';
    const t2 = '2026-01-03T00:00:00.000Z';

    // 3 occurrences with distinct timestamps
    observer.recordEvent(makeEvent({ action: 'deploy', service: 'glance', timestamp: t0 }));
    observer.recordEvent(makeEvent({ action: 'deploy', service: 'glance', timestamp: t1 }));
    observer.recordEvent(makeEvent({ action: 'deploy', service: 'glance', timestamp: t2 }));

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].firstSeen).toBe(t0);
    expect(patterns[0].lastSeen).toBe(t2);
  });

  it('sorts patterns by occurrence count descending', () => {
    // Pattern A: 5 occurrences for keystone
    recordDeploySequence(observer, 'keystone', 5);

    // Pattern B: 3 occurrences for nova (different service but same sequence key)
    // Force different sequence: just deploy
    for (let i = 0; i < 3; i++) {
      observer.recordEvent(makeEvent({ action: 'deploy', service: 'nova' }));
      observer.recordEvent(makeEvent({ action: 'reconfigure', service: 'nova' }));
    }

    const patterns = observer.detectPatterns();
    expect(patterns[0].occurrences).toBeGreaterThanOrEqual(patterns[1].occurrences);
  });
});

// ---------------------------------------------------------------------------
// Promotion candidate identification
// ---------------------------------------------------------------------------

describe('DeploymentObserver -- identifyPromotionCandidates', () => {
  it('returns empty array when no patterns meet thresholds', () => {
    const observer = new DeploymentObserver();
    expect(observer.identifyPromotionCandidates()).toEqual([]);
  });

  it('returns candidate for pattern with high success rate and enough occurrences', () => {
    // Need: occurrences=10+, successRate>=0.9, confidence=(10/10)*1.0=1.0 >= 0.8
    const observer = new DeploymentObserver();
    recordDeploySequence(observer, 'keystone', 10, true);

    const candidates = observer.identifyPromotionCandidates();
    expect(candidates.length).toBeGreaterThan(0);

    const candidate = candidates[0];
    expect(candidate.confidence).toBeGreaterThanOrEqual(0.8);
    expect(candidate.pattern.successRate).toBeGreaterThanOrEqual(0.9);
  });

  it('filters out patterns with success rate below minSuccessRate', () => {
    const observer = new DeploymentObserver({ minSuccessRate: 0.9 });

    // 10 occurrences, but only 50% success rate -- below 0.9 threshold
    recordDeploySequence(observer, 'nova', 5, true);
    recordDeploySequence(observer, 'nova', 5, false);

    const candidates = observer.identifyPromotionCandidates();
    // With 50% success rate, the pattern should not be a candidate
    expect(candidates.every(c => c.pattern.successRate >= 0.9)).toBe(true);
  });

  it('filters out patterns with confidence below promotionThreshold', () => {
    // minOccurrences=3, promotionThreshold=0.8
    // With 3 occurrences and 100% success: confidence = min((3/10)*1.0, 1.0) = 0.3
    // That is below the default threshold of 0.8 -- should not be a candidate
    const observer = new DeploymentObserver();
    recordDeploySequence(observer, 'swift', 3, true);

    const candidates = observer.identifyPromotionCandidates();
    expect(candidates).toHaveLength(0);
  });

  it('includes suggested skill name derived from services', () => {
    const observer = new DeploymentObserver();
    // 10 occurrences to get confidence above 0.8
    recordDeploySequence(observer, 'keystone', 10, true);

    const candidates = observer.identifyPromotionCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0].suggestedSkillName).toBe('deploy-keystone-sequence');
  });

  it('includes human-readable reason in candidate', () => {
    const observer = new DeploymentObserver();
    recordDeploySequence(observer, 'keystone', 10, true);

    const candidates = observer.identifyPromotionCandidates();
    expect(candidates).toHaveLength(1);
    expect(candidates[0].reason).toContain('10');
    expect(candidates[0].reason).toContain('100%');
  });

  it('sorts candidates by confidence descending', () => {
    const observer = new DeploymentObserver();
    // keystone: 10 occurrences, 100% success -> confidence = 1.0
    recordDeploySequence(observer, 'keystone', 10, true);

    // nova: add a different pattern with slightly lower confidence
    // 9 occurrences, 100% success -> confidence = min((9/10)*1.0, 1.0) = 0.9
    for (let i = 0; i < 9; i++) {
      observer.recordEvent(makeEvent({ action: 'deploy', service: 'nova', success: true }));
      observer.recordEvent(makeEvent({ action: 'reconfigure', service: 'nova', success: true }));
    }

    const candidates = observer.identifyPromotionCandidates();
    for (let i = 0; i < candidates.length - 1; i++) {
      expect(candidates[i].confidence).toBeGreaterThanOrEqual(candidates[i + 1].confidence);
    }
  });
});

// ---------------------------------------------------------------------------
// Custom config
// ---------------------------------------------------------------------------

describe('DeploymentObserver -- custom configuration', () => {
  it('respects custom minOccurrences threshold', () => {
    const observer = new DeploymentObserver({ minOccurrences: 5 });
    // Only 3 occurrences -- below custom threshold of 5
    recordDeploySequence(observer, 'keystone', 3);

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(0);
  });

  it('respects custom promotionThreshold', () => {
    // With a very low threshold, even 3 occurrences can qualify
    const observer = new DeploymentObserver({
      minOccurrences: 3,
      minSuccessRate: 0.5,
      promotionThreshold: 0.1, // Very low -- (3/10)*1.0 = 0.3 >= 0.1
    });
    recordDeploySequence(observer, 'keystone', 3, true);

    const candidates = observer.identifyPromotionCandidates();
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('config override merges with defaults', () => {
    // Only override minOccurrences -- other fields should use defaults
    const observer = new DeploymentObserver({ minOccurrences: 2 });

    // 2 occurrences now qualifies
    recordDeploySequence(observer, 'keystone', 2);

    const patterns = observer.detectPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].occurrences).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

describe('DeploymentObserver -- getStats', () => {
  it('returns zero counts when event log is empty', () => {
    const observer = new DeploymentObserver();
    const stats = observer.getStats();

    expect(stats.totalEvents).toBe(0);
    expect(stats.uniquePatterns).toBe(0);
    expect(stats.promotionCandidates).toBe(0);
  });

  it('returns correct totalEvents count', () => {
    const observer = new DeploymentObserver();
    observer.recordEvent(makeEvent());
    observer.recordEvent(makeEvent());
    observer.recordEvent(makeEvent());

    expect(observer.getStats().totalEvents).toBe(3);
  });

  it('returns correct uniquePatterns count', () => {
    const observer = new DeploymentObserver();
    // Pattern A: 3x keystone prechecks:deploy:verify
    recordDeploySequence(observer, 'keystone', 3);
    // Pattern B: 3x nova deploy:reconfigure
    for (let i = 0; i < 3; i++) {
      observer.recordEvent(makeEvent({ action: 'deploy', service: 'nova' }));
      observer.recordEvent(makeEvent({ action: 'reconfigure', service: 'nova' }));
    }

    const stats = observer.getStats();
    expect(stats.uniquePatterns).toBe(2);
  });

  it('returns correct promotionCandidates count', () => {
    const observer = new DeploymentObserver();
    // 10 occurrences should generate a candidate
    recordDeploySequence(observer, 'keystone', 10, true);

    const stats = observer.getStats();
    expect(stats.promotionCandidates).toBeGreaterThan(0);
  });

  it('stats reset to zero after clearEventLog', () => {
    const observer = new DeploymentObserver();
    recordDeploySequence(observer, 'keystone', 10, true);

    observer.clearEventLog();
    const stats = observer.getStats();

    expect(stats.totalEvents).toBe(0);
    expect(stats.uniquePatterns).toBe(0);
    expect(stats.promotionCandidates).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_DEPLOYMENT_OBSERVER_CONFIG
// ---------------------------------------------------------------------------

describe('DEFAULT_DEPLOYMENT_OBSERVER_CONFIG', () => {
  it('has the expected default values', () => {
    expect(DEFAULT_DEPLOYMENT_OBSERVER_CONFIG.minOccurrences).toBe(3);
    expect(DEFAULT_DEPLOYMENT_OBSERVER_CONFIG.minSuccessRate).toBe(0.9);
    expect(DEFAULT_DEPLOYMENT_OBSERVER_CONFIG.promotionThreshold).toBe(0.8);
  });
});
