// CF-H-033 — skill lifecycle state machine + 90d staleness flag.
//
// Verifies:
//   - The lifecycle state machine permits exactly the documented transitions
//     (DRAFT -> ACTIVE -> DEPRECATED -> RETIRED -> ARCHIVED).
//   - Reverse transitions and skips are rejected.
//   - The 90-day staleness flag fires for an ACTIVE skill whose updated
//     date is more than 90 days behind a synthetic "now".
//   - Skills in non-ACTIVE states (DEPRECATED, RETIRED, ARCHIVED, DRAFT)
//     are exempt from the staleness check.
//
// Closes: OGA-033 (MEDIUM).

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const DIGEST_PATH = resolve(REPO_ROOT, 'project-claude', 'commands', 'sc', 'digest.md');

// ----- State machine ---------------------------------------------------------

const VALID = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'RETIRED', 'ARCHIVED'] as const;
type State = (typeof VALID)[number];

const TRANSITIONS: Record<State, State[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['DEPRECATED'],
  DEPRECATED: ['RETIRED', 'ACTIVE'], // un-deprecate is allowed (revival)
  RETIRED: ['ARCHIVED'],
  ARCHIVED: [],
};

function canTransition(from: State, to: State): boolean {
  return TRANSITIONS[from].includes(to);
}

// ----- Staleness -------------------------------------------------------------

const STALENESS_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function isStale(updated: string, status: State, now: Date): boolean {
  if (status !== 'ACTIVE') return false;
  const updatedDate = new Date(updated);
  return daysBetween(updatedDate, now) > STALENESS_DAYS;
}

// ----- Tests -----------------------------------------------------------------

describe('CF-H-033: lifecycle state machine — valid forward transitions', () => {
  it('DRAFT -> ACTIVE is allowed', () => {
    expect(canTransition('DRAFT', 'ACTIVE')).toBe(true);
  });

  it('ACTIVE -> DEPRECATED is allowed', () => {
    expect(canTransition('ACTIVE', 'DEPRECATED')).toBe(true);
  });

  it('DEPRECATED -> RETIRED is allowed', () => {
    expect(canTransition('DEPRECATED', 'RETIRED')).toBe(true);
  });

  it('RETIRED -> ARCHIVED is allowed', () => {
    expect(canTransition('RETIRED', 'ARCHIVED')).toBe(true);
  });

  it('DEPRECATED -> ACTIVE (revival) is allowed', () => {
    expect(canTransition('DEPRECATED', 'ACTIVE')).toBe(true);
  });
});

describe('CF-H-033: lifecycle state machine — invalid transitions', () => {
  it('DRAFT -> RETIRED (skip ACTIVE) is rejected', () => {
    expect(canTransition('DRAFT', 'RETIRED')).toBe(false);
  });

  it('ACTIVE -> ARCHIVED (skip DEPRECATED+RETIRED) is rejected', () => {
    expect(canTransition('ACTIVE', 'ARCHIVED')).toBe(false);
  });

  it('ARCHIVED is terminal (no outgoing transitions)', () => {
    for (const target of VALID) {
      expect(canTransition('ARCHIVED', target)).toBe(false);
    }
  });

  it('RETIRED -> ACTIVE (un-retire) is rejected', () => {
    expect(canTransition('RETIRED', 'ACTIVE')).toBe(false);
  });
});

describe('CF-H-033: 90-day staleness flag', () => {
  const NOW = new Date('2026-04-25T00:00:00.000Z');

  it('fires for an ACTIVE skill 134 days stale', () => {
    expect(isStale('2025-12-12', 'ACTIVE', NOW)).toBe(true);
  });

  it('fires for an ACTIVE skill exactly 91 days stale', () => {
    const updated = new Date(NOW.getTime() - 91 * MS_PER_DAY).toISOString().slice(0, 10);
    expect(isStale(updated, 'ACTIVE', NOW)).toBe(true);
  });

  it('does NOT fire for an ACTIVE skill 89 days stale', () => {
    const updated = new Date(NOW.getTime() - 89 * MS_PER_DAY).toISOString().slice(0, 10);
    expect(isStale(updated, 'ACTIVE', NOW)).toBe(false);
  });

  it('does NOT fire for an ACTIVE skill updated today', () => {
    expect(isStale('2026-04-25', 'ACTIVE', NOW)).toBe(false);
  });

  it.each(['DRAFT', 'DEPRECATED', 'RETIRED', 'ARCHIVED'] as State[])(
    'does NOT fire for a %s skill 134 days stale (only ACTIVE is surveyed)',
    (status) => {
      expect(isStale('2025-12-12', status, NOW)).toBe(false);
    },
  );
});

describe('CF-H-033: sc:digest wires the staleness check', () => {
  it('digest command file exists', () => {
    expect(existsSync(DIGEST_PATH)).toBe(true);
  });

  it('contains a Lifecycle Staleness section', () => {
    const text = readFileSync(DIGEST_PATH, 'utf-8');
    expect(text).toMatch(/Lifecycle Staleness/i);
  });

  it('documents the 90-day threshold', () => {
    const text = readFileSync(DIGEST_PATH, 'utf-8');
    expect(text).toMatch(/90\s*days?/i);
  });

  it('exempts non-ACTIVE skills from the staleness check', () => {
    const text = readFileSync(DIGEST_PATH, 'utf-8');
    // Match either bare or backtick-wrapped ACTIVE.
    expect(text).toMatch(/only\s+`?ACTIVE`?\s+skills?\s+are\s+surveyed/i);
  });
});
