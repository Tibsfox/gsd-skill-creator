/**
 * Co-evolution ledger tests
 *
 * CF-M8-04  200-session fixture produces non-empty offerings in all 4 types
 * SC-CONSENT default settings produce zero offerings
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

import {
  scanSessions,
  runCoEvolutionPass,
  readOfferings,
  DEFAULT_CADENCE_SESSIONS,
  type SessionRecord,
} from '../coEvolution.js';
import { validateOffering } from '../parasocial-guard.js';
import type { OfferingKind } from '../../types/symbiosis.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function tempLedger(): string {
  const dir = join(tmpdir(), `coevo-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return join(dir, 'co-evolution.jsonl');
}

/**
 * Build a 200-session fixture that has enough signal to trigger all four
 * offering types: trajectory (low test-first), consistency (many branches),
 * pattern (clustered weekdays), opportunity (repeated task description).
 */
function build200SessionFixture(): SessionRecord[] {
  const sessions: SessionRecord[] = [];
  const repeatTask = 'deploy staging environment';

  for (let i = 0; i < 200; i++) {
    // Mondays cluster (day 1 of week): sessions 0,7,14…42 → 7 Mondays
    const dayOffset = (i % 7 === 0) ? 0 : i % 7;
    const base = new Date('2025-01-06'); // Monday
    const date = new Date(base);
    date.setDate(base.getDate() + i);

    // Low test-first ratio: only 30% sessions have test-first
    const testFirstCommit = i % 10 < 3;

    // Multiple branches to trigger consistency
    const branchOptions = ['feature/a', 'feature/b', 'feature/c', 'trunk'];
    const branch = branchOptions[i % branchOptions.length]!;

    // Recurring task every 5th session
    const taskDescription = i % 5 === 0 ? repeatTask : `task-${i % 20}`;

    sessions.push({
      index: i,
      date: date.toISOString(),
      activatedSkills: [`skill-${i % 10}`],
      testFirstCommit,
      branch,
      taskDescription,
    });
  }

  return sessions;
}

// ─── SC-CONSENT ───────────────────────────────────────────────────────────────

describe('SC-CONSENT: default settings produce zero offerings', () => {
  it('returns empty offerings when enabled is not set (default false)', () => {
    const sessions = build200SessionFixture();
    const result = scanSessions(sessions);
    expect(result.offerings).toHaveLength(0);
    expect(result.guardRejections).toBe(0);
  });

  it('returns empty offerings when explicitly disabled', () => {
    const sessions = build200SessionFixture();
    const result = scanSessions(sessions, { enabled: false });
    expect(result.offerings).toHaveLength(0);
  });

  it('runCoEvolutionPass with default settings writes nothing to disk', () => {
    const path = tempLedger();
    const sessions = build200SessionFixture();
    const emitted = runCoEvolutionPass(sessions, {}, path);
    expect(emitted).toHaveLength(0);
    // Ledger should be empty
    const onDisk = readOfferings(path);
    expect(onDisk).toHaveLength(0);
  });

  it('returns empty offerings when session list is empty even with enabled=true', () => {
    const result = scanSessions([], { enabled: true });
    expect(result.offerings).toHaveLength(0);
  });
});

// ─── CF-M8-04: all four offering types ───────────────────────────────────────

describe('CF-M8-04: 200-session fixture produces non-empty offerings in all 4 types', () => {
  const sessions = build200SessionFixture();

  it('produces at least one offering when enabled', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    expect(result.offerings.length).toBeGreaterThan(0);
  });

  it('produces a trajectory offering (test-first drift)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    const kinds = result.offerings.map((o) => o.kind);
    expect(kinds).toContain('trajectory' satisfies OfferingKind);
  });

  it('produces a consistency offering (branch divergence)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    const kinds = result.offerings.map((o) => o.kind);
    expect(kinds).toContain('consistency' satisfies OfferingKind);
  });

  it('produces a pattern offering (day-of-week clustering)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    const kinds = result.offerings.map((o) => o.kind);
    expect(kinds).toContain('pattern' satisfies OfferingKind);
  });

  it('produces an opportunity offering (recurring task)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    const kinds = result.offerings.map((o) => o.kind);
    expect(kinds).toContain('opportunity' satisfies OfferingKind);
  });

  it('each offering has required fields (id, ts, kind, content, sourcePointers)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    for (const offering of result.offerings) {
      expect(typeof offering.id).toBe('string');
      expect(offering.id.length).toBeGreaterThan(0);
      expect(typeof offering.ts).toBe('number');
      expect(['trajectory', 'consistency', 'pattern', 'opportunity']).toContain(offering.kind);
      expect(typeof offering.content).toBe('string');
      expect(offering.content.length).toBeGreaterThan(0);
      expect(Array.isArray(offering.sourcePointers)).toBe(true);
    }
  });

  it('appended offerings round-trip through disk (runCoEvolutionPass)', () => {
    const path = tempLedger();
    const emitted = runCoEvolutionPass(sessions, { enabled: true, cadenceSessionCount: 200 }, path);
    expect(emitted.length).toBeGreaterThan(0);

    const onDisk = readOfferings(path);
    expect(onDisk).toHaveLength(emitted.length);
    for (let i = 0; i < emitted.length; i++) {
      expect(onDisk[i]!.id).toBe(emitted[i]!.id);
      expect(onDisk[i]!.kind).toBe(emitted[i]!.kind);
      expect(onDisk[i]!.content).toBe(emitted[i]!.content);
    }
  });

  it('offerings use engineering-observational language (no prohibited registers)', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: 200 });
    for (const offering of result.offerings) {
      const guardResult = validateOffering(offering.content);
      expect(guardResult.ok).toBe(true);
    }
  });

  it('default cadence of 20 also produces offerings from 200-session fixture', () => {
    const result = scanSessions(sessions, { enabled: true, cadenceSessionCount: DEFAULT_CADENCE_SESSIONS });
    expect(result.offerings.length).toBeGreaterThan(0);
  });
});
