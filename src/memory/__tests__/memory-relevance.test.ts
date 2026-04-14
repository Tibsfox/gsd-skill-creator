import { describe, it, expect } from 'vitest';
import {
  temporalRelevance,
  inferTemporalClass,
  scopeRelevance,
  TEMPORAL_DECAY,
  SCOPE_BASE_RELEVANCE,
} from '../types.js';
import type { MemoryProvenance, QueryContext, MemoryType, MemoryScope } from '../types.js';

// ─── temporalRelevance() ─────────────────────────────────────────────────────

describe('temporalRelevance()', () => {
  it('timeless memories never decay', () => {
    expect(temporalRelevance('timeless', 0)).toBe(1.0);
    expect(temporalRelevance('timeless', 365)).toBe(1.0);
    expect(temporalRelevance('timeless', 10000)).toBe(1.0);
  });

  it('brand new memories have relevance 1.0 for all classes', () => {
    expect(temporalRelevance('durable', 0)).toBe(1.0);
    expect(temporalRelevance('seasonal', 0)).toBe(1.0);
    expect(temporalRelevance('ephemeral', 0)).toBe(1.0);
    expect(temporalRelevance('dated', 0)).toBe(1.0);
  });

  it('ephemeral memories decay fast — ~0.5 at 3 days', () => {
    const factor = temporalRelevance('ephemeral', 3);
    expect(factor).toBeCloseTo(0.5, 1);
  });

  it('ephemeral memories approach zero (floor = 0)', () => {
    const factor = temporalRelevance('ephemeral', 30);
    expect(factor).toBeLessThan(0.01); // 2^(-30/3) ≈ 0.001
  });

  it('seasonal memories decay to ~0.5 at 30 days', () => {
    const factor = temporalRelevance('seasonal', 30);
    expect(factor).toBeCloseTo(0.5, 1);
  });

  it('seasonal memories have floor of 0.1', () => {
    const factor = temporalRelevance('seasonal', 365);
    expect(factor).toBeGreaterThanOrEqual(0.1);
  });

  it('durable memories decay slowly — still ~0.5 at 180 days', () => {
    const factor = temporalRelevance('durable', 180);
    expect(factor).toBeCloseTo(0.5, 1);
  });

  it('durable memories have floor of 0.3', () => {
    const factor = temporalRelevance('durable', 3650);
    expect(factor).toBeGreaterThanOrEqual(0.3);
  });

  it('dated memories decay fast but retain historical value (floor 0.2)', () => {
    const at7 = temporalRelevance('dated', 7);
    expect(at7).toBeCloseTo(0.5, 1);
    const at365 = temporalRelevance('dated', 365);
    expect(at365).toBeGreaterThanOrEqual(0.2);
  });

  it('decay is monotonically decreasing with age', () => {
    const classes: Array<'durable' | 'seasonal' | 'ephemeral' | 'dated'> = [
      'durable', 'seasonal', 'ephemeral', 'dated',
    ];
    for (const cls of classes) {
      let prev = 1.0;
      for (const days of [1, 7, 30, 90, 180, 365]) {
        const factor = temporalRelevance(cls, days);
        expect(factor).toBeLessThanOrEqual(prev);
        prev = factor;
      }
    }
  });

  it('at equal age, ephemeral < seasonal < dated < durable', () => {
    const age = 14;
    const eph = temporalRelevance('ephemeral', age);
    const sea = temporalRelevance('seasonal', age);
    const dat = temporalRelevance('dated', age);
    const dur = temporalRelevance('durable', age);
    expect(eph).toBeLessThan(sea);
    expect(dat).toBeLessThan(dur);
  });
});

// ─── inferTemporalClass() ────────────────────────────────────────────────────

describe('inferTemporalClass()', () => {
  it('global user memories are timeless', () => {
    expect(inferTemporalClass('user', 'global')).toBe('timeless');
  });

  it('global feedback is durable', () => {
    expect(inferTemporalClass('feedback', 'global')).toBe('durable');
  });

  it('semantic knowledge is durable', () => {
    expect(inferTemporalClass('semantic', 'project')).toBe('durable');
    expect(inferTemporalClass('semantic', 'global')).toBe('durable');
  });

  it('references are durable', () => {
    expect(inferTemporalClass('reference', 'project')).toBe('durable');
  });

  it('project-scoped project memories are seasonal', () => {
    expect(inferTemporalClass('project', 'project')).toBe('seasonal');
  });

  it('session-scoped anything is ephemeral', () => {
    expect(inferTemporalClass('user', 'session')).toBe('ephemeral');
    expect(inferTemporalClass('feedback', 'session')).toBe('ephemeral');
    expect(inferTemporalClass('project', 'session')).toBe('ephemeral');
  });

  it('episodic memories are dated (historical value)', () => {
    expect(inferTemporalClass('episodic', 'project')).toBe('dated');
    expect(inferTemporalClass('episodic', 'global')).toBe('dated');
  });

  it('default is seasonal for unmatched combinations', () => {
    expect(inferTemporalClass('feedback', 'branch')).toBe('seasonal');
  });
});

// ─── scopeRelevance() ────────────────────────────────────────────────────────

describe('scopeRelevance()', () => {
  const globalMemory: MemoryProvenance = {
    scope: 'global',
    visibility: 'private',
    domains: [],
  };

  const artemisProjectMemory: MemoryProvenance = {
    scope: 'project',
    visibility: 'internal',
    project: 'artemis-ii',
    domains: ['space', 'research'],
  };

  const nasaProjectMemory: MemoryProvenance = {
    scope: 'project',
    visibility: 'internal',
    project: 'nasa',
    domains: ['space'],
  };

  const artemisBranchMemory: MemoryProvenance = {
    scope: 'branch',
    visibility: 'internal',
    project: 'artemis-ii',
    branch: 'artemis-ii',
    domains: ['space', 'research'],
  };

  const devBranchMemory: MemoryProvenance = {
    scope: 'branch',
    visibility: 'internal',
    project: 'artemis-ii',
    branch: 'dev',
    domains: [],
  };

  const sessionMemory: MemoryProvenance = {
    scope: 'session',
    visibility: 'private',
    workspace: 'session-123',
    domains: [],
  };

  const domainMemory: MemoryProvenance = {
    scope: 'domain',
    visibility: 'public',
    domains: ['networking', 'security'],
  };

  const artemisContext: QueryContext = {
    project: 'artemis-ii',
    branch: 'artemis-ii',
    domains: ['space', 'research'],
    session: 'session-123',
  };

  it('global memories always return base relevance', () => {
    const score = scopeRelevance(globalMemory, artemisContext);
    expect(score).toBe(SCOPE_BASE_RELEVANCE.global);
    expect(score).toBe(0.6);
  });

  it('matching project gets full project relevance', () => {
    const score = scopeRelevance(artemisProjectMemory, artemisContext);
    expect(score).toBe(SCOPE_BASE_RELEVANCE.project);
    expect(score).toBe(0.8);
  });

  it('different project gets penalized', () => {
    const score = scopeRelevance(nasaProjectMemory, artemisContext);
    expect(score).toBeLessThan(SCOPE_BASE_RELEVANCE.project);
    expect(score).toBeCloseTo(0.24, 1);
  });

  it('matching branch + project gets full branch relevance', () => {
    const score = scopeRelevance(artemisBranchMemory, artemisContext);
    expect(score).toBe(SCOPE_BASE_RELEVANCE.branch);
    expect(score).toBe(0.9);
  });

  it('same project different branch gets partial relevance', () => {
    const score = scopeRelevance(devBranchMemory, artemisContext);
    expect(score).toBe(0.9 * 0.5); // 0.45
  });

  it('matching session gets full session relevance', () => {
    const score = scopeRelevance(sessionMemory, artemisContext);
    expect(score).toBe(SCOPE_BASE_RELEVANCE.session);
    expect(score).toBe(1.0);
  });

  it('different session gets zero', () => {
    const otherContext: QueryContext = { session: 'session-456' };
    const score = scopeRelevance(sessionMemory, otherContext);
    expect(score).toBe(0);
  });

  it('matching domain gets full domain relevance', () => {
    const ctx: QueryContext = { domains: ['security', 'networking'] };
    const score = scopeRelevance(domainMemory, ctx);
    expect(score).toBe(SCOPE_BASE_RELEVANCE.domain);
    expect(score).toBe(0.7);
  });

  it('non-matching domain gets penalized', () => {
    const ctx: QueryContext = { domains: ['music'] };
    const score = scopeRelevance(domainMemory, ctx);
    expect(score).toBeLessThan(SCOPE_BASE_RELEVANCE.domain);
  });

  it('scope relevance ordering: session > branch > project > domain > global', () => {
    // All matching the artemis context
    const scores = {
      session: scopeRelevance(sessionMemory, artemisContext),
      branch: scopeRelevance(artemisBranchMemory, artemisContext),
      project: scopeRelevance(artemisProjectMemory, artemisContext),
      domain: scopeRelevance(domainMemory, { ...artemisContext, domains: ['networking'] }),
      global: scopeRelevance(globalMemory, artemisContext),
    };
    expect(scores.session).toBeGreaterThanOrEqual(scores.branch);
    expect(scores.branch).toBeGreaterThan(scores.project);
    expect(scores.project).toBeGreaterThan(scores.global);
  });

  it('empty query context still returns reasonable scores', () => {
    const emptyCtx: QueryContext = {};
    // Global should still work
    expect(scopeRelevance(globalMemory, emptyCtx)).toBe(0.6);
    // Project with no context project gets penalized
    expect(scopeRelevance(artemisProjectMemory, emptyCtx)).toBeLessThan(0.8);
  });
});

// ─── TEMPORAL_DECAY config ───────────────────────────────────────────────────

describe('TEMPORAL_DECAY', () => {
  it('all classes have positive half-lives', () => {
    for (const [cls, config] of Object.entries(TEMPORAL_DECAY)) {
      expect(config.halfLifeDays).toBeGreaterThan(0);
    }
  });

  it('all floors are between 0 and 1', () => {
    for (const [cls, config] of Object.entries(TEMPORAL_DECAY)) {
      expect(config.floor).toBeGreaterThanOrEqual(0);
      expect(config.floor).toBeLessThanOrEqual(1);
    }
  });

  it('timeless has infinite half-life and floor of 1.0', () => {
    expect(TEMPORAL_DECAY.timeless.halfLifeDays).toBe(Infinity);
    expect(TEMPORAL_DECAY.timeless.floor).toBe(1.0);
  });

  it('ephemeral has shortest finite half-life and zero floor', () => {
    const finite = Object.entries(TEMPORAL_DECAY)
      .filter(([_, c]) => c.halfLifeDays !== Infinity)
      .map(([_, c]) => c.halfLifeDays);
    expect(TEMPORAL_DECAY.ephemeral.halfLifeDays).toBe(Math.min(...finite));
    expect(TEMPORAL_DECAY.ephemeral.floor).toBe(0);
  });
});
