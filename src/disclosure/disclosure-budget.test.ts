import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DisclosureBudget } from './disclosure-budget.js';
import type { SkillSizeBreakdown, DisclosureBudgetResult } from './disclosure-budget.js';

describe('DisclosureBudget', () => {
  let budget: DisclosureBudget;
  let tempDir: string;

  beforeEach(async () => {
    budget = new DisclosureBudget();
    tempDir = await mkdtemp(join(tmpdir(), 'disclosure-budget-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('calculateBreakdown', () => {
    it('returns correct breakdown for skill with only SKILL.md', async () => {
      const skillContent = 'This is a simple skill with some content words here.';
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.skillMdChars).toBe(skillContent.length);
      expect(result.skillMdWords).toBeGreaterThan(0);
      expect(result.references).toHaveLength(0);
      expect(result.scripts).toHaveLength(0);
      expect(result.alwaysLoadedChars).toBe(skillContent.length);
      expect(result.conditionalChars).toBe(0);
      expect(result.totalChars).toBe(skillContent.length);
    });

    it('accounts for references/ files separately from SKILL.md', async () => {
      const skillContent = 'Main skill content here.';
      const refAContent = 'Reference A content with many words for testing.';
      const refBContent = 'Reference B content also has several words in it.';

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'references'));
      await writeFile(join(tempDir, 'references', 'a.md'), refAContent);
      await writeFile(join(tempDir, 'references', 'b.md'), refBContent);

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.skillMdChars).toBe(skillContent.length);
      expect(result.references).toHaveLength(2);
      expect(result.alwaysLoadedChars).toBe(skillContent.length);
      expect(result.conditionalChars).toBe(refAContent.length + refBContent.length);
      expect(result.totalChars).toBe(skillContent.length + refAContent.length + refBContent.length);
    });

    it('accounts for scripts/ files in conditionalChars', async () => {
      const skillContent = 'Skill with scripts.';
      const scriptContent = '#!/bin/bash\ngit init\ngit add .';

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'scripts'));
      await writeFile(join(tempDir, 'scripts', 'setup.sh'), scriptContent);

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.scripts).toHaveLength(1);
      expect(result.scripts[0].chars).toBe(scriptContent.length);
      expect(result.conditionalChars).toBe(scriptContent.length);
      expect(result.alwaysLoadedChars).toBe(skillContent.length);
    });

    it('computes totalChars as alwaysLoaded + conditional', async () => {
      const skillContent = 'Main skill.';
      const refContent = 'Reference content.';
      const scriptContent = '#!/bin/bash\nnpm install';

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'references'));
      await writeFile(join(tempDir, 'references', 'guide.md'), refContent);
      await mkdir(join(tempDir, 'scripts'));
      await writeFile(join(tempDir, 'scripts', 'build.sh'), scriptContent);

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.totalChars).toBe(result.alwaysLoadedChars + result.conditionalChars);
      expect(result.totalChars).toBe(
        skillContent.length + refContent.length + scriptContent.length,
      );
    });

    it('handles empty references/ directory', async () => {
      const skillContent = 'Skill content here.';
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'references'));

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.references).toHaveLength(0);
      expect(result.conditionalChars).toBe(0);
    });

    it('handles skill with scripts but no references', async () => {
      const skillContent = 'Skill without references but with scripts.';
      const scriptContent = '#!/usr/bin/env node\nconsole.log("hello");';

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'scripts'));
      await writeFile(join(tempDir, 'scripts', 'run.sh'), scriptContent);

      const result = await budget.calculateBreakdown(tempDir);

      expect(result.references).toHaveLength(0);
      expect(result.scripts).toHaveLength(1);
      expect(result.conditionalChars).toBe(scriptContent.length);
    });

    it('throws graceful error for non-existent directory', async () => {
      await expect(
        budget.calculateBreakdown('/tmp/does-not-exist-xyz-12345'),
      ).rejects.toThrow();
    });
  });

  describe('checkDisclosureBudget', () => {
    it('returns skillMdSeverity ok for small SKILL.md', async () => {
      const skillContent = 'Small skill content.';
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);

      const result = await budget.checkDisclosureBudget(tempDir);

      expect(result.skillMdSeverity).toBe('ok');
      expect(result.breakdown.skillMdChars).toBe(skillContent.length);
    });

    it('returns skillMdSeverity error for SKILL.md over budget', async () => {
      // Create a SKILL.md that exceeds 15000 chars
      const skillContent = 'x'.repeat(16000);
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);

      const result = await budget.checkDisclosureBudget(tempDir);

      expect(result.skillMdSeverity).toBe('error');
    });

    it('large references do not affect skillMdSeverity', async () => {
      const skillContent = 'Small skill.';
      const refContent = 'x'.repeat(20000); // Very large reference

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'references'));
      await writeFile(join(tempDir, 'references', 'huge.md'), refContent);

      const result = await budget.checkDisclosureBudget(tempDir);

      // SKILL.md itself is small, so severity should be ok
      expect(result.skillMdSeverity).toBe('ok');
      // Total size includes references for informational reporting
      expect(result.breakdown.totalChars).toBeGreaterThan(20000);
    });

    it('returns per-file breakdown for display', async () => {
      const skillContent = 'Skill body.';
      const refA = 'Reference A content.';
      const refB = 'Reference B content.';

      await writeFile(join(tempDir, 'SKILL.md'), skillContent);
      await mkdir(join(tempDir, 'references'));
      await writeFile(join(tempDir, 'references', 'a.md'), refA);
      await writeFile(join(tempDir, 'references', 'b.md'), refB);

      const result = await budget.checkDisclosureBudget(tempDir);

      expect(result.breakdown.references).toHaveLength(2);
      expect(result.breakdown.references[0].filename).toBeDefined();
      expect(result.breakdown.references[0].chars).toBeGreaterThan(0);
    });

    it('includes informational message with budget percent', async () => {
      const skillContent = 'Skill content for budget test.';
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);

      const result = await budget.checkDisclosureBudget(tempDir);

      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.skillMdBudgetPercent).toBeGreaterThanOrEqual(0);
    });

    it('includes totalSeverity for informational reporting', async () => {
      const skillContent = 'Small skill.';
      await writeFile(join(tempDir, 'SKILL.md'), skillContent);

      const result = await budget.checkDisclosureBudget(tempDir);

      expect(result.totalSeverity).toBeDefined();
      expect(['ok', 'info', 'warning', 'error']).toContain(result.totalSeverity);
    });
  });
});
