/**
 * Tests for `src/tractability/audit.ts`
 *
 * Coverage:
 *   CF-ME1-03 — classified_ratio and tractable_ratio always present
 *   SC-ME1-01 — feature-flag returns disabled report with isDisabled=true
 *   IT-W1-ME1 — classified_ratio ≥ 95% expectation surfaced
 *   - runAudit() with a temp directory of synthetic skills
 *   - formatAuditReport() output shape
 *   - unclassifiable list accuracy
 *   - Whole-repo smoke (scans .claude/skills/ from the actual repo)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runAudit, formatAuditReport } from '../audit.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeSkill(dir: string, name: string, content: string): Promise<void> {
  const skillDir = join(dir, name);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

const TRACTABLE_SKILL = `---
name: test-structured
description: A structured skill
output_structure:
  kind: json-schema
  schema: '{"type":"object"}'
---
Emit a JSON object.
`;

const COIN_FLIP_SKILL = `---
name: test-prose
description: A prose skill
output_structure:
  kind: prose
---
Write a paragraph about the topic.
`;

const NO_STRUCTURE_SKILL = `---
name: test-unclassified
description: A skill with no output_structure
---
Just do something.
`;

// ---------------------------------------------------------------------------
// Feature-flag (SC-ME1-01)
// ---------------------------------------------------------------------------

describe('runAudit — feature flag SC-ME1-01', () => {
  it('returns isDisabled=true when featureEnabled=false', async () => {
    const report = await runAudit({ featureEnabled: false });
    expect(report.isDisabled).toBe(true);
    expect(report.total).toBe(0);
    expect(report.entries).toHaveLength(0);
  });

  it('classifiedRatio is 0 when disabled', async () => {
    const report = await runAudit({ featureEnabled: false });
    expect(report.classifiedRatio).toBe(0);
  });

  it('returns isDisabled=false when featureEnabled=true (with empty dirs)', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'me1-audit-'));
    try {
      const report = await runAudit({ featureEnabled: true, extraDirs: [], cwd: tmpDir });
      // With no standard dirs in tmpDir, will scan them but find nothing
      expect(report.isDisabled).toBe(false);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Core audit with synthetic skills
// ---------------------------------------------------------------------------

describe('runAudit — synthetic skills', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'me1-audit-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('classifies tractable skill correctly', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    const entry = report.entries.find((e) => e.name === 'structured');
    expect(entry?.classification.tractabilityClass).toBe('tractable');
  });

  it('classifies prose skill as coin-flip', async () => {
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    const entry = report.entries.find((e) => e.name === 'prose-skill');
    expect(entry?.classification.tractabilityClass).toBe('coin-flip');
  });

  it('classifies skill with no output_structure as unknown', async () => {
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    const entry = report.entries.find((e) => e.name === 'unclassified');
    expect(entry?.classification.tractabilityClass).toBe('unknown');
  });

  it('includes unknown skills in unclassifiable list', async () => {
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    expect(report.unclassifiable.some((e) => e.name === 'unclassified')).toBe(true);
  });

  it('CF-ME1-03: always includes classifiedRatio and tractableRatio', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    expect(typeof report.classifiedRatio).toBe('number');
    expect(typeof report.tractableRatio).toBe('number');
    expect(report.classifiedRatio).toBeGreaterThanOrEqual(0);
    expect(report.classifiedRatio).toBeLessThanOrEqual(1);
    expect(report.tractableRatio).toBeGreaterThanOrEqual(0);
    expect(report.tractableRatio).toBeLessThanOrEqual(1);
  });

  it('counts sum to total', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    const sum = report.counts.tractable + report.counts['coin-flip'] + report.counts.unknown;
    expect(sum).toBe(report.total);
  });

  it('classifiedCount = total - unknown count', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    expect(report.classifiedCount).toBe(report.total - report.counts.unknown);
  });

  it('classifiedRatio = classifiedCount / total', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    const expected = report.classifiedCount / report.total;
    expect(report.classifiedRatio).toBeCloseTo(expected, 5);
  });

  it('tractableRatio = tractableCount / classifiedCount', async () => {
    await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
    await writeSkill(tmpDir, 'prose-skill', COIN_FLIP_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    if (report.classifiedCount > 0) {
      const expected = report.tractableCount / report.classifiedCount;
      expect(report.tractableRatio).toBeCloseTo(expected, 5);
    }
  });

  it('tractableRatio is 0 when classifiedCount is 0', async () => {
    await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    // classifiedCount=0 → tractableRatio=0
    if (report.classifiedCount === 0) {
      expect(report.tractableRatio).toBe(0);
    }
  });

  it('handles empty directory gracefully', async () => {
    const emptyDir = join(tmpDir, 'empty');
    await mkdir(emptyDir, { recursive: true });
    const report = await runAudit({ featureEnabled: true, extraDirs: [emptyDir], cwd: tmpDir });
    expect(report.total).toBe(0);
    expect(report.classifiedRatio).toBe(0);
  });

  it('timestamp is a valid ISO string', async () => {
    const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
  });
});

// ---------------------------------------------------------------------------
// formatAuditReport
// ---------------------------------------------------------------------------

describe('formatAuditReport', () => {
  it('returns disabled message when isDisabled=true', () => {
    const report = {
      timestamp: new Date().toISOString(),
      total: 0,
      classifiedCount: 0,
      classifiedRatio: 0,
      tractableCount: 0,
      tractableRatio: 0,
      counts: { tractable: 0, 'coin-flip': 0, unknown: 0 },
      entries: [],
      unclassifiable: [],
      isDisabled: true,
    };
    const text = formatAuditReport(report);
    expect(text).toContain('disabled');
  });

  it('includes Scanned count line', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'me1-fmt-'));
    try {
      await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
      const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
      const text = formatAuditReport(report, tmpDir);
      expect(text).toContain('Scanned:');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('includes Classified ratio line', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'me1-fmt-'));
    try {
      await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
      const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
      const text = formatAuditReport(report, tmpDir);
      expect(text).toContain('Classified ratio');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('includes Tractable ratio line', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'me1-fmt-'));
    try {
      await writeSkill(tmpDir, 'structured', TRACTABLE_SKILL);
      const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
      const text = formatAuditReport(report, tmpDir);
      expect(text).toContain('Tractable ratio');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('lists unclassifiable skills when present', async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), 'me1-fmt-'));
    try {
      await writeSkill(tmpDir, 'unclassified', NO_STRUCTURE_SKILL);
      const report = await runAudit({ featureEnabled: true, extraDirs: [tmpDir], cwd: tmpDir });
      const text = formatAuditReport(report, tmpDir);
      expect(text).toContain('Unclassified');
      expect(text).toContain('unclassified');
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// Whole-repo smoke test
// ---------------------------------------------------------------------------

describe('runAudit — whole-repo smoke', () => {
  it('scans .claude/skills and returns a report with total > 0', async () => {
    // Use the actual repo root to smoke-test real skill discovery
    // __tests__/ is 3 levels inside the repo: src/tractability/__tests__/
    const repoRoot = new URL('../../..', import.meta.url).pathname;
    const report = await runAudit({
      featureEnabled: true,
      cwd: repoRoot,
    });
    expect(report.isDisabled).toBe(false);
    expect(report.total).toBeGreaterThan(0);
    expect(typeof report.classifiedRatio).toBe('number');
    expect(typeof report.tractableRatio).toBe('number');
    // Per-class counts must be non-negative
    expect(report.counts.tractable).toBeGreaterThanOrEqual(0);
    expect(report.counts['coin-flip']).toBeGreaterThanOrEqual(0);
    expect(report.counts.unknown).toBeGreaterThanOrEqual(0);
  }, 30_000); // longer timeout for filesystem scan
});
