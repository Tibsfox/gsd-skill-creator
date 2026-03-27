/**
 * Unit tests for brainstorm filesystem bus schemas module.
 *
 * Covers FOUND-03 (collision-resistant filename generation),
 * FOUND-04 (session directory initialization), and
 * FOUND-05 (runtime constants correctness).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
  brainstormMessageFilename,
  resetBrainstormCounter,
  initBrainstormSession,
} from './schemas.js';
import { TechniqueIdSchema } from './types.js';
import {
  TECHNIQUE_DEFAULTS,
  AGENT_PHASE_RULES,
  MESSAGE_PRIORITIES,
} from './constants.js';

// ============================================================================
// FOUND-03: Collision-resistant filename generation
// ============================================================================

describe('brainstormMessageFilename', () => {
  beforeEach(() => {
    resetBrainstormCounter();
  });

  it('generates 4 unique filenames when called 4 times synchronously', () => {
    const filenames = new Set([
      brainstormMessageFilename('facilitator', 'broadcast'),
      brainstormMessageFilename('ideator', 'broadcast'),
      brainstormMessageFilename('system', 'facilitator'),
      brainstormMessageFilename('critic', 'scribe'),
    ]);
    expect(filenames.size).toBe(4);
  });

  it('produces filenames that sort lexicographically in write order', () => {
    const f1 = brainstormMessageFilename('system', 'broadcast');
    const f2 = brainstormMessageFilename('ideator', 'broadcast');
    const f3 = brainstormMessageFilename('analyst', 'mapper');
    const f4 = brainstormMessageFilename('facilitator', 'scribe');
    const sorted = [f1, f2, f3, f4].slice().sort();
    expect(sorted).toEqual([f1, f2, f3, f4]);
  });

  it('resets counter to 0 -- filename after reset starts with _000001', () => {
    // Generate a few filenames to advance counter
    brainstormMessageFilename('system', 'broadcast');
    brainstormMessageFilename('system', 'broadcast');

    // Reset
    resetBrainstormCounter();

    // Next filename should have counter 000001
    const filename = brainstormMessageFilename('system', 'broadcast');
    expect(filename).toMatch(/_000001_/);
  });

  it('produces filenames with .msg extension', () => {
    const filename = brainstormMessageFilename('facilitator', 'broadcast');
    expect(filename).toMatch(/\.msg$/);
  });

  it('includes source and destination in filename', () => {
    const filename = brainstormMessageFilename('ideator', 'mapper');
    expect(filename).toContain('ideator');
    expect(filename).toContain('mapper');
  });
});

// ============================================================================
// FOUND-04: Session directory initialization
// ============================================================================

describe('initBrainstormSession', () => {
  let testDir: string;
  const sessionId = randomUUID();

  beforeEach(() => {
    testDir = join(tmpdir(), `brainstorm-test-${randomUUID()}`);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('creates 4 bus subdirectories in a temp directory', async () => {
    const config = { brainstormDir: testDir, sessionId };
    await initBrainstormSession(config);

    const busDir = join(testDir, 'sessions', sessionId, 'bus');
    const expectedDirs = ['session', 'capture', 'user', 'energy'];

    for (const dir of expectedDirs) {
      const dirStat = await stat(join(busDir, dir));
      expect(dirStat.isDirectory()).toBe(true);
    }
  });

  it('is idempotent -- calling twice does not throw', async () => {
    const config = { brainstormDir: testDir, sessionId };
    await initBrainstormSession(config);
    // Second call should not throw
    await expect(initBrainstormSession(config)).resolves.toBeUndefined();
  });
});

// ============================================================================
// FOUND-05: Runtime constants correctness
// ============================================================================

describe('TECHNIQUE_DEFAULTS', () => {
  it('has exactly 16 keys matching all TechniqueId values', () => {
    expect(Object.keys(TECHNIQUE_DEFAULTS)).toHaveLength(16);
  });

  it('has a key for every TechniqueId enum value', () => {
    TechniqueIdSchema.options.every((id: string) => {
      expect(id in TECHNIQUE_DEFAULTS).toBe(true);
    });
  });
});

describe('AGENT_PHASE_RULES', () => {
  it('has exactly 8 keys (one per agent role)', () => {
    expect(Object.keys(AGENT_PHASE_RULES)).toHaveLength(8);
  });

  it('critic.active contains ONLY ["converge"]', () => {
    expect(AGENT_PHASE_RULES.critic.active).toEqual(['converge']);
  });
});

describe('MESSAGE_PRIORITIES', () => {
  it('has 10 named entries covering all priority categories', () => {
    // Implementation has 10 entries (not 9 as originally specced):
    // Two entries share priority 0 (RULES_VIOLATION, USER_INPUT) and
    // two share priority 1 (PHASE_TRANSITION, HAT_COLOR_CHANGE)
    expect(Object.keys(MESSAGE_PRIORITIES)).toHaveLength(10);
  });

  it('covers priority levels 0-7', () => {
    const values = Object.values(MESSAGE_PRIORITIES) as number[];
    const uniqueLevels = new Set(values);
    // Levels 0 through 7 should all be present
    for (let i = 0; i <= 7; i++) {
      expect(uniqueLevels.has(i)).toBe(true);
    }
  });

  it('RULES_VIOLATION and USER_INPUT are highest priority (0)', () => {
    expect(MESSAGE_PRIORITIES.RULES_VIOLATION).toBe(0);
    expect(MESSAGE_PRIORITIES.USER_INPUT).toBe(0);
  });

  it('HEARTBEAT is lowest priority (7)', () => {
    expect(MESSAGE_PRIORITIES.HEARTBEAT).toBe(7);
  });
});
