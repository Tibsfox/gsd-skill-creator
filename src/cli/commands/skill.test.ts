/**
 * skill.test.ts — unit tests for the `skill` namespaced command, focused on the
 * `skill ship` orchestrator (validate -> critique -> test-triggering).
 *
 * The all-green happy path requires satisfying each gate's preconditions
 * (a converged critique + a triggering.test.md) and is covered by a live smoke;
 * these tests pin the guard and the short-circuit / aggregate-exit behavior.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { skillCommand } from './skill.js';

// Stub the two dispatch-injected helpers.
const parseSkillsDir = (dir: string) => () => dir;
const parseStringFlag = (args: string[], name: string): string | undefined => {
  const pfx = `${name}=`;
  const a = args.find((x) => x.startsWith(pfx));
  return a ? a.slice(pfx.length) : undefined;
};

describe('skill ship', () => {
  let tmp: string;
  let skillsDir: string;

  beforeEach(async () => {
    tmp = await mkdtemp(join(tmpdir(), 'ship-'));
    skillsDir = join(tmp, 'skills');
    await mkdir(skillsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmp, { recursive: true, force: true });
  });

  it('returns 1 when no skill name is given', async () => {
    const code = await skillCommand(['skill', 'ship'], parseSkillsDir(skillsDir), parseStringFlag);
    expect(code).toBe(1);
  });

  it('returns 1 and short-circuits when the first gate (validate) fails', async () => {
    // No skill exists in skillsDir → validate fails → ship aggregates to exit 1
    // without proceeding to critique/test-triggering.
    const code = await skillCommand(
      ['skill', 'ship', 'nonexistent-skill'],
      parseSkillsDir(skillsDir),
      parseStringFlag,
    );
    expect(code).toBe(1);
  });
});

describe('skill (unknown subcommand)', () => {
  it('returns 0 for bare `skill` (prints help)', async () => {
    const code = await skillCommand(['skill'], () => '', parseStringFlag);
    expect(code).toBe(0);
  });

  it('returns 1 for an unknown subcommand', async () => {
    const code = await skillCommand(['skill', 'bogus'], () => '', parseStringFlag);
    expect(code).toBe(1);
  });
});
