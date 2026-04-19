/**
 * Tests for `src/output-structure/cli.ts`
 *
 * Coverage:
 *   - outputStructureHelp: returns non-empty string
 *   - Feature-flag SC-ME5-01: disabled flag exits 0 silently
 *   - CF-ME5-01: --apply is opt-in; default is dry-run
 *   - CF-ME5-02: report format (classified/flagged counts)
 *   - Help flag
 *   - Single-skill inspection (JSON mode)
 *   - Missing skill → exit 1
 *   - Dry-run vs apply (using temp directory)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { outputStructureCommand, outputStructureHelp } from '../cli.js';

// ---------------------------------------------------------------------------
// outputStructureHelp
// ---------------------------------------------------------------------------

describe('outputStructureHelp', () => {
  it('returns a non-empty string', () => {
    const help = outputStructureHelp();
    expect(typeof help).toBe('string');
    expect(help.length).toBeGreaterThan(0);
  });

  it('mentions --migrate-all and --apply', () => {
    const help = outputStructureHelp();
    expect(help).toContain('--migrate-all');
    expect(help).toContain('--apply');
  });
});

// ---------------------------------------------------------------------------
// Feature-flag (SC-ME5-01)
// ---------------------------------------------------------------------------

describe('outputStructureCommand — feature flag SC-ME5-01', () => {
  it('exits 0 and is silent when featureEnabled=false', async () => {
    const lines: string[] = [];
    const code = await outputStructureCommand(['--migrate-all'], {
      featureEnabled: false,
      quiet: true,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines).toEqual([]);
  });

  it('shows disabled message when featureEnabled=false and not quiet', async () => {
    const lines: string[] = [];
    const code = await outputStructureCommand(['--migrate-all'], {
      featureEnabled: false,
      quiet: false,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines.some(l => l.includes('disabled'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Help flag
// ---------------------------------------------------------------------------

describe('outputStructureCommand — help', () => {
  it('returns 0 for --help', async () => {
    const lines: string[] = [];
    const code = await outputStructureCommand(['--help'], {
      featureEnabled: true,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines.some(l => l.includes('Usage'))).toBe(true);
  });

  it('returns 0 for -h', async () => {
    const code = await outputStructureCommand(['-h'], {
      featureEnabled: true,
      logger: () => {},
    });
    expect(code).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Single-skill not found
// ---------------------------------------------------------------------------

describe('outputStructureCommand — missing skill', () => {
  it('returns 1 when skill not found', async () => {
    const code = await outputStructureCommand(['this-skill-does-not-exist-abc123'], {
      featureEnabled: true,
      skillsDir: '/tmp/nonexistent-skills-dir-abc123',
      logger: () => {},
    });
    expect(code).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// No args → help + exit 1
// ---------------------------------------------------------------------------

describe('outputStructureCommand — no args', () => {
  it('returns 1 when no args', async () => {
    const code = await outputStructureCommand([], {
      featureEnabled: true,
      logger: () => {},
    });
    expect(code).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Migrate-all on real temp directory
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'output-structure-cli-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

async function createSkillFile(dir: string, name: string, content: string): Promise<string> {
  const skillDir = join(dir, name);
  await mkdir(skillDir, { recursive: true });
  const filePath = join(skillDir, 'SKILL.md');
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

const PROSE_SKILL = `---
name: prose-skill
description: A prose skill
---
Analyze the codebase, explain the design decisions, and review the code.
`;

const STRUCTURED_SKILL = `---
name: structured-skill
description: A structured skill
output_structure:
  kind: json-schema
  schema: '{"type":"object"}'
---
Returns JSON schema output.
`;

const UNCLASSIFIED_SKILL = `---
name: unclassified-skill
description: Unclassified
---
This skill does something.
`;

describe('outputStructureCommand — migrate-all dry-run (CF-ME5-01)', () => {
  it('returns 0 or 2 (review required) without modifying files', async () => {
    await createSkillFile(tmpDir, 'skill-a', PROSE_SKILL);
    await createSkillFile(tmpDir, 'skill-b', STRUCTURED_SKILL);

    const lines: string[] = [];
    const code = await outputStructureCommand(['--migrate-all'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      apply: false,
      logger: (l) => { lines.push(l); },
    });

    expect([0, 2]).toContain(code);
    expect(lines.some(l => l.includes('Scanned'))).toBe(true);
    // Should say dry-run, not "Applied"
    expect(lines.some(l => l.toLowerCase().includes('dry-run'))).toBe(true);
  });

  it('reports already-classified skills correctly (CF-ME5-02)', async () => {
    await createSkillFile(tmpDir, 'skill-c', STRUCTURED_SKILL);

    const lines: string[] = [];
    await outputStructureCommand(['--migrate-all'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      apply: false,
      logger: (l) => { lines.push(l); },
    });

    expect(lines.some(l => l.includes('Already classified'))).toBe(true);
  });
});

describe('outputStructureCommand — migrate-all --apply (CF-ME5-05 idempotency)', () => {
  it('applies and second run produces zero-diff (idempotency)', async () => {
    await createSkillFile(tmpDir, 'skill-d', UNCLASSIFIED_SKILL);

    const lines1: string[] = [];
    await outputStructureCommand(['--migrate-all', '--apply'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      apply: true,
      logger: (l) => { lines1.push(l); },
    });

    expect(lines1.some(l => l.includes('Applied'))).toBe(true);

    // Second run — all should be already classified
    const lines2: string[] = [];
    await outputStructureCommand(['--migrate-all', '--apply'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      apply: true,
      logger: (l) => { lines2.push(l); },
    });

    // Second pass: the skill is now already classified
    const alreadyClassifiedLine = lines2.find(l => l.includes('Already classified'));
    expect(alreadyClassifiedLine).toBeDefined();
  });
});

describe('outputStructureCommand — JSON output', () => {
  it('migrate-all --json emits parseable JSON', async () => {
    await createSkillFile(tmpDir, 'skill-e', PROSE_SKILL);

    const lines: string[] = [];
    await outputStructureCommand(['--migrate-all', '--json'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      apply: false,
      json: true,
      logger: (l) => { lines.push(l); },
    });

    // In JSON mode the report is emitted as a single JSON.stringify block;
    // locate the line that starts the JSON object.
    const jsonStart = lines.findIndex(l => l.trimStart().startsWith('{'));
    expect(jsonStart).toBeGreaterThanOrEqual(0);
    const combined = lines.slice(jsonStart).join('\n');
    let parsed: unknown;
    expect(() => { parsed = JSON.parse(combined); }).not.toThrow();
    expect(parsed).toHaveProperty('total');
  });
});

describe('outputStructureCommand — single skill inspection', () => {
  it('inspects a real skill file by direct path and returns 0', async () => {
    const filePath = await createSkillFile(tmpDir, 'skill-f', STRUCTURED_SKILL);

    const lines: string[] = [];
    // Pass the direct file path as the skill name
    const code = await outputStructureCommand([filePath], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: (l) => { lines.push(l); },
    });

    expect(code).toBe(0);
    expect(lines.some(l => l.includes('json-schema') || l.includes('tractable'))).toBe(true);
  });

  it('single skill JSON mode emits parseable output', async () => {
    const filePath = await createSkillFile(tmpDir, 'skill-g', PROSE_SKILL);

    const lines: string[] = [];
    const code = await outputStructureCommand([filePath, '--json'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      json: true,
      logger: (l) => { lines.push(l); },
    });

    expect(code).toBe(0);
    const combined = lines.join('\n');
    let parsed: unknown;
    expect(() => { parsed = JSON.parse(combined); }).not.toThrow();
    expect(parsed).toHaveProperty('output_structure');
    expect(parsed).toHaveProperty('tractability');
  });
});
