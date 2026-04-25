/**
 * Experience Compression — level classifier tests.
 *
 * Coverage:
 *   ≥3 fixture types per level = 9+ classifier tests.
 *   Episodic: raw log string / heterogeneous array / large mixed object
 *   Procedural: regular small object / uniform array / moderate object
 *   Declarative: rule-form object / explicit tag / boolean primitive
 *
 * All tests use `classifyLevel` directly (no I/O, no feature flag).
 */

import { describe, it, expect } from 'vitest';
import { classifyLevel } from '../level-classifier.js';
import type { ExperienceContent } from '../types.js';

// ---------------------------------------------------------------------------
// Episodic fixtures  (expect level === 'episodic')
// ---------------------------------------------------------------------------

describe('level-classifier — episodic tier', () => {
  it('classifies a raw log string (high variability) as episodic', () => {
    const content: ExperienceContent = {
      id: 'ep-1',
      payload:
        'ERROR 2026-04-24T10:30:00Z user=foxy action=compress status=500 msg=internal_server_error stack_trace=at compress:42 at index:17 at main:3 request_id=abc123def456 session=xyz789',
      byteSize: 200,
      variabilityScore: 0.85,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('episodic');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    expect(result.signals.variability).toBeGreaterThan(0.6);
  });

  it('classifies a heterogeneous array as episodic', () => {
    const content: ExperienceContent = {
      id: 'ep-2',
      payload: [42, 'event-fired', true, { ts: 1714000000 }, null, 'END'],
      byteSize: 120,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('episodic');
  });

  it('classifies content with explicit high-variability tag as episodic', () => {
    const content: ExperienceContent = {
      id: 'ep-3',
      payload: { eventA: 1, eventB: 'x', eventC: [1, 2, 3], eventD: null },
      byteSize: 80,
      tags: ['high-variability'],
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('episodic');
  });

  it('classifies content with zero abstraction depth and low regularity as episodic', () => {
    const content: ExperienceContent = {
      id: 'ep-4',
      payload: 'raw event trace data with many unique tokens and no structure',
      byteSize: 200,
      abstractionDepth: 0,
      variabilityScore: 0.7,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('episodic');
  });
});

// ---------------------------------------------------------------------------
// Procedural fixtures  (expect level === 'procedural')
// ---------------------------------------------------------------------------

describe('level-classifier — procedural tier', () => {
  it('classifies a regular parameterised skill object as procedural', () => {
    const content: ExperienceContent = {
      id: 'proc-1',
      payload: {
        skillName: 'compress-session',
        parameters: { level: 'procedural', threshold: 0.4 },
        steps: ['classify', 'extract-pattern', 'emit-record'],
      },
      byteSize: 200,
      variabilityScore: 0.35,
      abstractionDepth: 2,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('procedural');
  });

  it('classifies a uniform typed array as procedural', () => {
    const content: ExperienceContent = {
      id: 'proc-2',
      payload: [
        { action: 'read', resource: 'skill-a', ts: 1714000001 },
        { action: 'write', resource: 'skill-b', ts: 1714000002 },
        { action: 'read', resource: 'skill-c', ts: 1714000003 },
      ],
      byteSize: 300,
      variabilityScore: 0.4,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('procedural');
  });

  it('classifies content with explicit procedural tag as procedural', () => {
    const content: ExperienceContent = {
      id: 'proc-3',
      payload: { pattern: 'retry-on-timeout', attempts: 3, backoff: 'exponential' },
      byteSize: 100,
      tags: ['structural-pattern'],
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('procedural');
  });
});

// ---------------------------------------------------------------------------
// Declarative fixtures  (expect level === 'declarative')
// ---------------------------------------------------------------------------

describe('level-classifier — declarative tier', () => {
  it('classifies a compact rule-form object as declarative', () => {
    const content: ExperienceContent = {
      id: 'dec-1',
      payload: { rule: 'bounded-learning', constraint: 'max-change=0.20' },
      byteSize: 60,
      variabilityScore: 0.05,
      abstractionDepth: 4,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('declarative');
  });

  it('classifies content with explicit rule-form tag as declarative', () => {
    const content: ExperienceContent = {
      id: 'dec-2',
      payload: { policy: 'no-bypass', target: 'CAPCOM' },
      byteSize: 40,
      tags: ['rule-form'],
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('declarative');
  });

  it('classifies a boolean primitive (rule-like) as declarative', () => {
    const content: ExperienceContent = {
      id: 'dec-3',
      payload: true,
      byteSize: 50,
      variabilityScore: 0.05,
      abstractionDepth: 4,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('declarative');
  });
});

// ---------------------------------------------------------------------------
// Signal values
// ---------------------------------------------------------------------------

describe('level-classifier — signal values', () => {
  it('exposes variability, structuralRegularity, abstractionDepth signals', () => {
    const content: ExperienceContent = {
      id: 'sig-1',
      payload: 'simple string payload',
      byteSize: 30,
    };
    const result = classifyLevel(content);
    expect(typeof result.signals.variability).toBe('number');
    expect(typeof result.signals.structuralRegularity).toBe('number');
    expect(typeof result.signals.abstractionDepth).toBe('number');
  });

  it('confidence is in [0.5, 1.0] for all fixtures', () => {
    const fixtures: ExperienceContent[] = [
      { id: 'c-1', payload: 'raw log', byteSize: 20, variabilityScore: 0.9 },
      { id: 'c-2', payload: { rule: 'x' }, byteSize: 20, variabilityScore: 0.05, abstractionDepth: 4 },
      { id: 'c-3', payload: [1, 2, 3], byteSize: 20, variabilityScore: 0.4 },
    ];
    for (const f of fixtures) {
      const r = classifyLevel(f);
      expect(r.confidence).toBeGreaterThanOrEqual(0.5);
      expect(r.confidence).toBeLessThanOrEqual(1.0);
    }
  });
});
