/**
 * Unit tests for skill.* gateway tools.
 *
 * Tests skill search, inspection, and activation against temp directories
 * with mock skill structures using SkillStore and SkillIndex.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import matter from 'gray-matter';
import {
  searchSkills,
  inspectSkill,
  activateSkill,
  type SkillSearchResult,
  type SkillInspectResult,
  type SkillActivateResult,
} from './skill-tools.js';

// ── Helpers ─────────────────────────────────────────────────────────────

let tempDir: string;
let skillsDir: string;

/** Create a mock skill in the skills directory. */
async function createMockSkill(
  name: string,
  description: string,
  body: string,
): Promise<void> {
  const skillDir = join(skillsDir, name);
  await mkdir(skillDir, { recursive: true });

  const metadata = {
    name,
    description,
  };
  const content = matter.stringify(body, metadata);
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('Skill Tools', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'skill-tools-'));
    skillsDir = join(tempDir, '.claude', 'skills');
    await mkdir(skillsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // ── searchSkills ────────────────────────────────────────────────────

  describe('searchSkills', () => {
    it('returns empty array when no skills match', async () => {
      await createMockSkill('typescript-helper', 'Helps with TypeScript code', 'Use TypeScript best practices.');
      const results = await searchSkills(skillsDir, 'python');
      expect(results).toEqual([]);
    });

    it('returns matching skills sorted by score', async () => {
      await createMockSkill('typescript-helper', 'Helps with TypeScript code', 'TS helper body.');
      await createMockSkill('test-runner', 'Runs test suites', 'Test runner body.');
      await createMockSkill('typescript-linter', 'Lints TypeScript files', 'Linter body.');

      const results = await searchSkills(skillsDir, 'typescript');
      expect(results.length).toBeGreaterThanOrEqual(2);
      // Results should include typescript-helper and typescript-linter
      const names = results.map((r) => r.name);
      expect(names).toContain('typescript-helper');
      expect(names).toContain('typescript-linter');
    });

    it('returns results with score and description', async () => {
      await createMockSkill('code-review', 'Automated code review skill', 'Review code.');
      const results = await searchSkills(skillsDir, 'code');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('code-review');
      expect(results[0]!.description).toBe('Automated code review skill');
      expect(results[0]!.score).toBeGreaterThan(0);
    });

    it('returns empty array when skills directory does not exist', async () => {
      const results = await searchSkills(join(tempDir, 'nonexistent'), 'anything');
      expect(results).toEqual([]);
    });
  });

  // ── inspectSkill ────────────────────────────────────────────────────

  describe('inspectSkill', () => {
    it('returns full skill content and metadata', async () => {
      await createMockSkill(
        'my-skill',
        'A helpful skill',
        'This is the skill body with instructions.',
      );
      const result = await inspectSkill(skillsDir, 'my-skill');
      expect(result.found).toBe(true);
      expect(result.name).toBe('my-skill');
      expect(result.description).toBe('A helpful skill');
      expect(result.body).toContain('This is the skill body');
      expect(result.path).toContain('my-skill');
    });

    it('returns found=false for nonexistent skill', async () => {
      const result = await inspectSkill(skillsDir, 'nonexistent');
      expect(result.found).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns metadata fields', async () => {
      await createMockSkill('with-meta', 'Skill with metadata', 'Body content.');
      const result = await inspectSkill(skillsDir, 'with-meta');
      expect(result.found).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.name).toBe('with-meta');
      expect(result.metadata!.description).toBe('Skill with metadata');
    });
  });

  // ── activateSkill ───────────────────────────────────────────────────

  describe('activateSkill', () => {
    it('returns activation result with token estimate', async () => {
      const body = 'A'.repeat(400); // 400 chars = ~100 tokens
      await createMockSkill('activatable', 'Can be activated', body);
      const result = await activateSkill(skillsDir, 'activatable');
      expect(result.activated).toBe(true);
      expect(result.name).toBe('activatable');
      expect(result.estimatedTokens).toBeGreaterThan(0);
      // 400 chars / 4 = 100 tokens
      expect(result.estimatedTokens).toBe(100);
    });

    it('returns activated=false for nonexistent skill', async () => {
      const result = await activateSkill(skillsDir, 'nonexistent');
      expect(result.activated).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('reports budget impact', async () => {
      await createMockSkill('budgeted', 'Budget test skill', 'Some body content here.');
      const result = await activateSkill(skillsDir, 'budgeted');
      expect(result.activated).toBe(true);
      expect(result.budgetImpact).toBeDefined();
      expect(result.budgetImpact!.tokensAdded).toBe(result.estimatedTokens);
    });
  });
});
