/**
 * Tests for `src/model-affinity/cli.ts`
 *
 * Coverage:
 *   - Flag-off: exits 0 with "disabled" message (CF-ME2-01 / SC-ME2-01)
 *   - Help: exits 0 with usage text
 *   - No skill specified: exits 1 with help
 *   - Single-skill: not-found returns exit 1
 *   - Single-skill: skill with and without affinity (in-memory via skillsDir override)
 *   - Audit mode: --audit flag
 *   - JSON output
 */

import { describe, it, expect } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { modelAffinityCommand } from '../cli.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function captureLog(): { lines: string[]; logger: (line: string) => void } {
  const lines: string[] = [];
  return { lines, logger: (line: string) => lines.push(line) };
}

async function makeTmpDir(): Promise<string> {
  const dir = join(tmpdir(), `me2-cli-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function makeSkillFile(dir: string, name: string, frontmatter: string): Promise<string> {
  const skillDir = join(dir, name);
  await mkdir(skillDir, { recursive: true });
  const path = join(skillDir, 'SKILL.md');
  await writeFile(path, `---\n${frontmatter}\n---\n\nSkill body.`);
  return path;
}

// ---------------------------------------------------------------------------
// Flag-off (CF-ME2-01 / SC-ME2-01)
// ---------------------------------------------------------------------------

describe('modelAffinityCommand — flag-off', () => {
  it('exits 0 with disabled message when featureEnabled=false (SC-ME2-01)', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand([], { featureEnabled: false, logger });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('disabled'))).toBe(true);
  });

  it('silent when quiet + flag-off', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(['--quiet'], { featureEnabled: false, logger, quiet: true });
    expect(code).toBe(0);
    expect(lines).toHaveLength(0);
  });

  it('flag-off even with --audit: exits 0', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(['--audit'], { featureEnabled: false, logger });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('disabled'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

describe('modelAffinityCommand — help', () => {
  it('--help exits 0 and prints usage', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(['--help'], { featureEnabled: true, logger });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('Usage:');
  });

  it('-h exits 0 and prints usage', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(['-h'], { featureEnabled: true, logger });
    expect(code).toBe(0);
    expect(lines.join('\n')).toContain('Usage:');
  });

  it('no args exits 1 with help (missing skill)', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand([], { featureEnabled: true, logger });
    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('Usage:');
  });
});

// ---------------------------------------------------------------------------
// Single-skill inspection
// ---------------------------------------------------------------------------

describe('modelAffinityCommand — single skill', () => {
  it('exits 1 when skill not found', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(
      ['nonexistent-skill-xyz'],
      { featureEnabled: true, logger, skillsDir: '/tmp/nonexistent-dir-xyz' },
    );
    expect(code).toBe(1);
    expect(lines.some((l) => l.includes('not found'))).toBe(true);
  });

  it('exits 0 for skill with no affinity declared (CF-ME2-03)', async () => {
    const dir = await makeTmpDir();
    try {
      await makeSkillFile(dir, 'test-skill', 'name: test-skill\ndescription: test');
      const { lines, logger } = captureLog();
      const code = await modelAffinityCommand(
        ['test-skill', '--model=sonnet'],
        { featureEnabled: true, logger, skillsDir: dir },
      );
      expect(code).toBe(0);
      expect(lines.some((l) => l.includes('none declared'))).toBe(true);
      expect(lines.some((l) => l.includes('0.00') || l.includes('Penalty'))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('exits 0 for skill with matching affinity (ok)', async () => {
    const dir = await makeTmpDir();
    try {
      await makeSkillFile(
        dir,
        'test-skill',
        'name: test-skill\nmodel_affinity:\n  reliable:\n    - sonnet\n    - opus',
      );
      const { lines, logger } = captureLog();
      const code = await modelAffinityCommand(
        ['test-skill', '--model=sonnet'],
        { featureEnabled: true, logger, skillsDir: dir },
      );
      expect(code).toBe(0);
      expect(lines.some((l) => l.includes('OK'))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('surfaces escalation suggestion for tractable skill on unreliable model', async () => {
    const dir = await makeTmpDir();
    try {
      await makeSkillFile(
        dir,
        'test-skill',
        'name: test-skill\nmodel_affinity:\n  reliable:\n    - sonnet\n    - opus\n  unreliable:\n    - haiku',
      );
      const { lines, logger } = captureLog();
      const code = await modelAffinityCommand(
        ['test-skill', '--model=haiku', '--tractability=tractable'],
        { featureEnabled: true, logger, skillsDir: dir },
      );
      expect(code).toBe(0);
      const output = lines.join('\n');
      expect(output).toContain('YES');
      expect(output).toContain('sonnet');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('no escalation for coin-flip skill on unreliable model (CF-ME2-02)', async () => {
    const dir = await makeTmpDir();
    try {
      await makeSkillFile(
        dir,
        'test-skill',
        'name: test-skill\nmodel_affinity:\n  reliable:\n    - opus\n  unreliable:\n    - haiku',
      );
      const { lines, logger } = captureLog();
      const code = await modelAffinityCommand(
        ['test-skill', '--model=haiku', '--tractability=coin-flip'],
        { featureEnabled: true, logger, skillsDir: dir },
      );
      expect(code).toBe(0);
      const output = lines.join('\n');
      expect(output).toContain('no');
      expect(output).not.toContain('YES');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------

describe('modelAffinityCommand — JSON output', () => {
  it('emits valid JSON for single skill (flag-on)', async () => {
    const dir = await makeTmpDir();
    try {
      await makeSkillFile(dir, 'skill-x', 'name: skill-x');
      const { lines, logger } = captureLog();
      const code = await modelAffinityCommand(
        ['skill-x', '--json', '--model=sonnet'],
        { featureEnabled: true, logger, skillsDir: dir },
      );
      expect(code).toBe(0);
      const parsed = JSON.parse(lines.join(''));
      expect(parsed).toHaveProperty('skill');
      expect(parsed).toHaveProperty('decision');
      expect(parsed.decision.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Audit mode
// ---------------------------------------------------------------------------

describe('modelAffinityCommand — audit', () => {
  it('audit mode exits 0 with summary output', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(
      ['--audit', '--model=sonnet'],
      {
        featureEnabled: true,
        logger,
        cwd: '/tmp', // cwd with no skill dirs = zero skills scanned
      },
    );
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('Skills scanned'))).toBe(true);
  });

  it('audit --json emits valid JSON', async () => {
    const { lines, logger } = captureLog();
    const code = await modelAffinityCommand(
      ['--audit', '--json'],
      {
        featureEnabled: true,
        logger,
        cwd: '/tmp',
      },
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(lines.join(''));
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('escalationCount');
  });
});
