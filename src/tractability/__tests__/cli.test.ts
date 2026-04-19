/**
 * Tests for `src/tractability/cli.ts`
 *
 * Coverage:
 *   - tractabilityHelp: returns non-empty string with --audit and --json mentions
 *   - SC-ME1-01: feature-flag disabled exits 0 cleanly
 *   - --help flag exits 0 with usage text
 *   - Single-skill inspection (JSON mode and text mode)
 *   - Missing skill → exit 1
 *   - --audit flag triggers repo-wide audit
 *   - --json flag emits JSON
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { tractabilityCommand, tractabilityHelp } from '../cli.js';

// ---------------------------------------------------------------------------
// tractabilityHelp
// ---------------------------------------------------------------------------

describe('tractabilityHelp', () => {
  it('returns a non-empty string', () => {
    const h = tractabilityHelp();
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });

  it('mentions --audit', () => {
    expect(tractabilityHelp()).toContain('--audit');
  });

  it('mentions --json', () => {
    expect(tractabilityHelp()).toContain('--json');
  });

  it('mentions both command aliases', () => {
    expect(tractabilityHelp()).toContain('tractability');
    expect(tractabilityHelp()).toContain('tract');
  });

  it('mentions all three tractability classes', () => {
    const h = tractabilityHelp();
    expect(h).toContain('tractable');
    expect(h).toContain('coin-flip');
    expect(h).toContain('unknown');
  });
});

// ---------------------------------------------------------------------------
// Feature-flag (SC-ME1-01)
// ---------------------------------------------------------------------------

describe('tractabilityCommand — feature flag', () => {
  it('exits 0 silently when featureEnabled=false and quiet=true', async () => {
    const lines: string[] = [];
    const code = await tractabilityCommand(['--audit'], {
      featureEnabled: false,
      quiet: true,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines).toHaveLength(0);
  });

  it('exits 0 with disabled message when featureEnabled=false and not quiet', async () => {
    const lines: string[] = [];
    const code = await tractabilityCommand(['--audit'], {
      featureEnabled: false,
      quiet: false,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('disabled'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Help flag
// ---------------------------------------------------------------------------

describe('tractabilityCommand — help', () => {
  it('returns 0 for --help', async () => {
    const lines: string[] = [];
    const code = await tractabilityCommand(['--help'], {
      featureEnabled: true,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    expect(lines.some((l) => l.includes('Usage'))).toBe(true);
  });

  it('returns 1 and shows help for no arguments', async () => {
    const lines: string[] = [];
    const code = await tractabilityCommand([], {
      featureEnabled: true,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Single-skill inspection with temp dir
// ---------------------------------------------------------------------------

describe('tractabilityCommand — single skill inspection', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'me1-cli-'));
    // Create a tractable skill
    const tractableDir = join(tmpDir, 'structured');
    await mkdir(tractableDir, { recursive: true });
    await writeFile(join(tractableDir, 'SKILL.md'), `---
name: structured
description: A structured skill
output_structure:
  kind: json-schema
  schema: '{"type":"object"}'
---
Emit a JSON object.
`, 'utf-8');

    // Create a prose skill
    const proseDir = join(tmpDir, 'prose-skill');
    await mkdir(proseDir, { recursive: true });
    await writeFile(join(proseDir, 'SKILL.md'), `---
name: prose-skill
description: A prose skill
output_structure:
  kind: prose
---
Write a paragraph.
`, 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('exits 0 for a known skill', async () => {
    const code = await tractabilityCommand(['structured'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: () => {},
    });
    expect(code).toBe(0);
  });

  it('exits 1 for an unknown skill', async () => {
    const code = await tractabilityCommand(['no-such-skill'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: () => {},
    });
    expect(code).toBe(1);
  });

  it('JSON mode emits valid JSON with tractabilityClass', async () => {
    const lines: string[] = [];
    const code = await tractabilityCommand(['structured', '--json'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(lines.join('\n'));
    expect(parsed.tractabilityClass).toBe('tractable');
    expect(parsed.confidence).toBeDefined();
    expect(Array.isArray(parsed.evidence)).toBe(true);
  });

  it('JSON mode includes skill name', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['structured', '--json'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    const parsed = JSON.parse(lines.join('\n'));
    expect(parsed.skill).toBe('structured');
  });

  it('text mode outputs tractability label', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['structured'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    const out = lines.join('\n');
    expect(out).toContain('Tractability');
    expect(out).toContain('tractable');
  });

  it('prose skill classified as coin-flip in JSON mode', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['prose-skill', '--json'], {
      featureEnabled: true,
      skillsDir: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    const parsed = JSON.parse(lines.join('\n'));
    expect(parsed.tractabilityClass).toBe('coin-flip');
  });
});

// ---------------------------------------------------------------------------
// Audit flag
// ---------------------------------------------------------------------------

describe('tractabilityCommand — --audit', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'me1-audit-cli-'));
    const d1 = join(tmpDir, 'skill1');
    await mkdir(d1, { recursive: true });
    await writeFile(join(d1, 'SKILL.md'), `---
name: skill1
output_structure:
  kind: json-schema
  schema: '{}'
---
Body.
`, 'utf-8');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('exits 0', async () => {
    const code = await tractabilityCommand(['--audit'], {
      featureEnabled: true,
      extraDirs: [tmpDir],
      cwd: tmpDir,
      logger: () => {},
    });
    expect(code).toBe(0);
  });

  it('JSON audit emits valid JSON with classifiedRatio', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['--audit', '--json'], {
      featureEnabled: true,
      extraDirs: [tmpDir],
      cwd: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    const parsed = JSON.parse(lines.join('\n'));
    expect(typeof parsed.classifiedRatio).toBe('number');
    expect(typeof parsed.tractableRatio).toBe('number');
    expect(typeof parsed.total).toBe('number');
    expect(Array.isArray(parsed.entries)).toBe(true);
    expect(Array.isArray(parsed.unclassifiable)).toBe(true);
  });

  it('text audit output contains Scanned line', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['--audit'], {
      featureEnabled: true,
      extraDirs: [tmpDir],
      cwd: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    expect(lines.some((l) => l.includes('Scanned'))).toBe(true);
  });

  it('text audit output contains Classified ratio', async () => {
    const lines: string[] = [];
    await tractabilityCommand(['--audit'], {
      featureEnabled: true,
      extraDirs: [tmpDir],
      cwd: tmpDir,
      logger: (l) => { lines.push(l); },
    });
    expect(lines.some((l) => l.includes('Classified ratio'))).toBe(true);
  });
});
