import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import {
  PLATFORMS,
  getSupportedPlatforms,
  exportForPlatform,
  exportSkillDirectory,
} from './platform-adapter.js';
import type { PlatformConfig } from './platform-adapter.js';
import type { Skill } from '../types/skill.js';

// ============================================================================
// Platform Registry tests
// ============================================================================

describe('PLATFORMS registry', () => {
  it('has entries for all 5 supported platforms', () => {
    const ids = Object.keys(PLATFORMS);
    expect(ids).toContain('claude');
    expect(ids).toContain('cursor');
    expect(ids).toContain('codex');
    expect(ids).toContain('copilot');
    expect(ids).toContain('gemini');
    expect(ids).toHaveLength(5);
  });

  it('each platform has name, userSkillsDir, projectSkillsDir, supportsAllowedTools', () => {
    for (const [id, config] of Object.entries(PLATFORMS)) {
      expect(config.name, `${id}.name`).toBeDefined();
      expect(typeof config.name).toBe('string');
      expect(config.userSkillsDir, `${id}.userSkillsDir`).toBeDefined();
      expect(typeof config.userSkillsDir).toBe('string');
      expect(config.projectSkillsDir, `${id}.projectSkillsDir`).toBeDefined();
      expect(typeof config.projectSkillsDir).toBe('string');
      expect(config.supportsAllowedTools, `${id}.supportsAllowedTools`).toBeDefined();
      expect(typeof config.supportsAllowedTools).toBe('boolean');
    }
  });

  it('Claude Code paths: user=~/.claude/skills, project=.claude/skills', () => {
    expect(PLATFORMS.claude.userSkillsDir).toBe('~/.claude/skills');
    expect(PLATFORMS.claude.projectSkillsDir).toBe('.claude/skills');
  });

  it('Cursor paths: user=~/.cursor/skills, project=.cursor/skills', () => {
    expect(PLATFORMS.cursor.userSkillsDir).toBe('~/.cursor/skills');
    expect(PLATFORMS.cursor.projectSkillsDir).toBe('.cursor/skills');
  });

  it('Codex CLI paths: user=~/.agents/skills, project=.agents/skills', () => {
    expect(PLATFORMS.codex.userSkillsDir).toBe('~/.agents/skills');
    expect(PLATFORMS.codex.projectSkillsDir).toBe('.agents/skills');
  });

  it('Copilot paths: user=~/.copilot/skills, project=.github/skills', () => {
    expect(PLATFORMS.copilot.userSkillsDir).toBe('~/.copilot/skills');
    expect(PLATFORMS.copilot.projectSkillsDir).toBe('.github/skills');
  });

  it('Gemini CLI paths: user=~/.gemini/skills, project=.gemini/skills', () => {
    expect(PLATFORMS.gemini.userSkillsDir).toBe('~/.gemini/skills');
    expect(PLATFORMS.gemini.projectSkillsDir).toBe('.gemini/skills');
  });
});

describe('getSupportedPlatforms', () => {
  it('returns array of platform IDs', () => {
    const platforms = getSupportedPlatforms();
    expect(platforms).toEqual(expect.arrayContaining(['claude', 'cursor', 'codex', 'copilot', 'gemini']));
    expect(platforms).toHaveLength(5);
  });
});

// ============================================================================
// exportForPlatform() tests
// ============================================================================

describe('exportForPlatform', () => {
  const fullSkill: Skill = {
    metadata: {
      name: 'test-skill',
      description: 'A test skill for export',
      license: 'MIT',
      compatibility: 'Claude Code 1.0+',
      'allowed-tools': ['Read', 'Write', 'Grep'],
      context: 'fork',
      agent: 'security-agent',
      model: 'claude-sonnet-4-20250514',
      hooks: { pre: 'echo hello' },
      'disable-model-invocation': true,
      'user-invocable': true,
      'argument-hint': 'file path',
      metadata: {
        extensions: {
          'gsd-skill-creator': { version: 3, enabled: true, createdAt: '2025-01-01' },
        },
      },
    },
    body: '# Instructions\n\nDo the thing.\n\nSee references\\guide.md for details.',
    path: '/skills/test-skill/SKILL.md',
  };

  // --- Claude target ---

  it('Claude target: preserves ALL fields (context, agent, model, hooks, etc.)', () => {
    const result = exportForPlatform(fullSkill, 'claude');
    const parsed = matter(result);

    expect(parsed.data.name).toBe('test-skill');
    expect(parsed.data.description).toBe('A test skill for export');
    expect(parsed.data.license).toBe('MIT');
    expect(parsed.data.compatibility).toBe('Claude Code 1.0+');
    expect(parsed.data.context).toBe('fork');
    expect(parsed.data.agent).toBe('security-agent');
    expect(parsed.data.model).toBe('claude-sonnet-4-20250514');
    expect(parsed.data.hooks).toEqual({ pre: 'echo hello' });
    expect(parsed.data['disable-model-invocation']).toBe(true);
    expect(parsed.data['user-invocable']).toBe(true);
    expect(parsed.data['argument-hint']).toBe('file path');
  });

  it('Claude target: keeps allowed-tools as array (not space-delimited string)', () => {
    const result = exportForPlatform(fullSkill, 'claude');
    const parsed = matter(result);

    expect(Array.isArray(parsed.data['allowed-tools'])).toBe(true);
    expect(parsed.data['allowed-tools']).toEqual(['Read', 'Write', 'Grep']);
  });

  // --- Cursor target ---

  it('Cursor target: strips context, agent, model, hooks, disable-model-invocation, user-invocable, argument-hint', () => {
    const result = exportForPlatform(fullSkill, 'cursor');
    const parsed = matter(result);

    expect(parsed.data.name).toBe('test-skill');
    expect(parsed.data.description).toBe('A test skill for export');
    expect('context' in parsed.data).toBe(false);
    expect('agent' in parsed.data).toBe(false);
    expect('model' in parsed.data).toBe(false);
    expect('hooks' in parsed.data).toBe(false);
    expect('disable-model-invocation' in parsed.data).toBe(false);
    expect('user-invocable' in parsed.data).toBe(false);
    expect('argument-hint' in parsed.data).toBe(false);
  });

  it('Cursor target: converts allowed-tools to space-delimited string', () => {
    const result = exportForPlatform(fullSkill, 'cursor');
    const parsed = matter(result);

    expect(typeof parsed.data['allowed-tools']).toBe('string');
    expect(parsed.data['allowed-tools']).toBe('Read Write Grep');
  });

  // --- Codex target ---

  it('Codex target: strips same extension fields as Cursor', () => {
    const result = exportForPlatform(fullSkill, 'codex');
    const parsed = matter(result);

    expect(parsed.data.name).toBe('test-skill');
    expect('context' in parsed.data).toBe(false);
    expect('agent' in parsed.data).toBe(false);
    expect('model' in parsed.data).toBe(false);
    expect('hooks' in parsed.data).toBe(false);
    expect('disable-model-invocation' in parsed.data).toBe(false);
    expect('user-invocable' in parsed.data).toBe(false);
    expect('argument-hint' in parsed.data).toBe(false);
  });

  // --- Copilot target ---

  it('Copilot target: strips same extension fields as Cursor', () => {
    const result = exportForPlatform(fullSkill, 'copilot');
    const parsed = matter(result);

    expect(parsed.data.name).toBe('test-skill');
    expect('context' in parsed.data).toBe(false);
    expect('agent' in parsed.data).toBe(false);
    expect('model' in parsed.data).toBe(false);
    expect('hooks' in parsed.data).toBe(false);
  });

  // --- Gemini target ---

  it('Gemini target: strips same extension fields as Cursor', () => {
    const result = exportForPlatform(fullSkill, 'gemini');
    const parsed = matter(result);

    expect(parsed.data.name).toBe('test-skill');
    expect('context' in parsed.data).toBe(false);
    expect('agent' in parsed.data).toBe(false);
    expect('model' in parsed.data).toBe(false);
    expect('hooks' in parsed.data).toBe(false);
  });

  // --- Cross-target shared behaviors ---

  it('all non-Claude targets: strip metadata.extensions[gsd-skill-creator]', () => {
    for (const platformId of ['cursor', 'codex', 'copilot', 'gemini']) {
      const result = exportForPlatform(fullSkill, platformId);
      const parsed = matter(result);

      const meta = parsed.data.metadata as Record<string, unknown> | undefined;
      if (meta?.extensions) {
        const extensions = meta.extensions as Record<string, unknown>;
        expect(extensions['gsd-skill-creator'], `${platformId} should strip gsd-skill-creator`).toBeUndefined();
      }
    }
  });

  it('all targets: preserve name, description, license, compatibility', () => {
    for (const platformId of getSupportedPlatforms()) {
      const result = exportForPlatform(fullSkill, platformId);
      const parsed = matter(result);

      expect(parsed.data.name, `${platformId}.name`).toBe('test-skill');
      expect(parsed.data.description, `${platformId}.description`).toBe('A test skill for export');
      expect(parsed.data.license, `${platformId}.license`).toBe('MIT');
      expect(parsed.data.compatibility, `${platformId}.compatibility`).toBe('Claude Code 1.0+');
    }
  });

  it('all targets: normalize paths in body content', () => {
    for (const platformId of getSupportedPlatforms()) {
      const result = exportForPlatform(fullSkill, platformId);

      expect(result, `${platformId} should normalize references path`).toContain('references/guide.md');
      expect(result, `${platformId} should not have backslash path`).not.toContain('references\\guide.md');
    }
  });

  it('invalid platform ID throws descriptive error', () => {
    expect(() => exportForPlatform(fullSkill, 'vscode')).toThrow(/Unknown platform: vscode/);
    expect(() => exportForPlatform(fullSkill, 'vscode')).toThrow(/Supported:/);
  });
});

// ============================================================================
// exportSkillDirectory() tests
// ============================================================================

describe('exportSkillDirectory', () => {
  let sourceDir: string;
  let targetDir: string;

  beforeEach(async () => {
    sourceDir = await mkdtemp(join(tmpdir(), 'skill-src-'));
    targetDir = await mkdtemp(join(tmpdir(), 'skill-tgt-'));
  });

  afterEach(async () => {
    await rm(sourceDir, { recursive: true, force: true });
    await rm(targetDir, { recursive: true, force: true });
  });

  async function writeSkillMd(dir: string, metadata: Record<string, unknown>, body: string): Promise<void> {
    const content = matter.stringify(body, metadata);
    await writeFile(join(dir, 'SKILL.md'), content, 'utf-8');
  }

  it('copies SKILL.md from source to target directory', async () => {
    await writeSkillMd(sourceDir, {
      name: 'copy-skill',
      description: 'Test copy',
    }, '# Instructions\n\nDo it.');

    const files = await exportSkillDirectory(sourceDir, targetDir, 'claude');

    const targetSkillMd = await readFile(join(targetDir, 'SKILL.md'), 'utf-8');
    expect(targetSkillMd).toContain('copy-skill');
    expect(files).toContain('SKILL.md');
  });

  it('copies references/ subdirectory recursively', async () => {
    await writeSkillMd(sourceDir, {
      name: 'ref-skill',
      description: 'Skill with references',
    }, '# Instructions\n\nSee references/guide.md');

    const refsDir = join(sourceDir, 'references');
    await mkdir(refsDir, { recursive: true });
    await writeFile(join(refsDir, 'guide.md'), '# Guide\n\nStep-by-step instructions.');

    const files = await exportSkillDirectory(sourceDir, targetDir, 'cursor');

    const targetGuide = await readFile(join(targetDir, 'references', 'guide.md'), 'utf-8');
    expect(targetGuide).toContain('# Guide');
    expect(files).toContain('references/guide.md');
  });

  it('copies scripts/ subdirectory recursively', async () => {
    await writeSkillMd(sourceDir, {
      name: 'script-skill',
      description: 'Skill with scripts',
    }, '# Instructions\n\nRun scripts/build.sh');

    const scriptsDir = join(sourceDir, 'scripts');
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(join(scriptsDir, 'build.sh'), '#!/bin/bash\necho "Building..."');

    const files = await exportSkillDirectory(sourceDir, targetDir, 'codex');

    const targetScript = await readFile(join(targetDir, 'scripts', 'build.sh'), 'utf-8');
    expect(targetScript).toContain('#!/bin/bash');
    expect(files).toContain('scripts/build.sh');
  });

  it('handles skill with only SKILL.md (no subdirectories)', async () => {
    await writeSkillMd(sourceDir, {
      name: 'minimal-skill',
      description: 'No subdirs',
    }, '# Minimal\n\nJust content.');

    const files = await exportSkillDirectory(sourceDir, targetDir, 'gemini');

    expect(files).toEqual(['SKILL.md']);
    // Verify no unexpected directories
    const entries = await readdir(targetDir);
    expect(entries).toEqual(['SKILL.md']);
  });

  it('target SKILL.md has platform-appropriate frontmatter', async () => {
    await writeSkillMd(sourceDir, {
      name: 'platform-test',
      description: 'Tests platform transform',
      context: 'fork',
      agent: 'my-agent',
      model: 'claude-sonnet-4-20250514',
      'allowed-tools': ['Read', 'Write'],
    }, '# Instructions\n\nDo it.');

    await exportSkillDirectory(sourceDir, targetDir, 'cursor');

    const content = await readFile(join(targetDir, 'SKILL.md'), 'utf-8');
    const parsed = matter(content);

    // Cursor should strip Claude extension fields
    expect(parsed.data.name).toBe('platform-test');
    expect('context' in parsed.data).toBe(false);
    expect('agent' in parsed.data).toBe(false);
    expect('model' in parsed.data).toBe(false);
    // Cursor: allowed-tools as space-delimited string
    expect(parsed.data['allowed-tools']).toBe('Read Write');
  });

  it('paths in copied SKILL.md content are normalized to forward slashes', async () => {
    await writeSkillMd(sourceDir, {
      name: 'path-norm-skill',
      description: 'Path normalization test',
    }, '# Instructions\n\nSee references\\nested\\file.md and scripts\\run.sh');

    await exportSkillDirectory(sourceDir, targetDir, 'copilot');

    const content = await readFile(join(targetDir, 'SKILL.md'), 'utf-8');
    expect(content).toContain('references/nested/file.md');
    expect(content).toContain('scripts/run.sh');
    expect(content).not.toContain('references\\nested\\file.md');
    expect(content).not.toContain('scripts\\run.sh');
  });

  // ========================================================================
  // YAML safety validation (72-02)
  // ========================================================================

  describe('YAML safety validation', () => {
    it('rejects SKILL.md with !!js/function in frontmatter', async () => {
      await writeFile(
        join(sourceDir, 'SKILL.md'),
        [
          '---',
          'name: evil-func',
          'description: !!js/function "function() { return 1; }"',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );

      await expect(
        exportSkillDirectory(sourceDir, targetDir, 'claude'),
      ).rejects.toThrow(/[Dd]angerous YAML tag/);
    });

    it('rejects SKILL.md with missing required name field', async () => {
      await writeFile(
        join(sourceDir, 'SKILL.md'),
        [
          '---',
          'description: A valid description',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );

      await expect(
        exportSkillDirectory(sourceDir, targetDir, 'cursor'),
      ).rejects.toThrow(/name/i);
    });

    it('rejects SKILL.md with wrong type for description', async () => {
      await writeFile(
        join(sourceDir, 'SKILL.md'),
        [
          '---',
          'name: bad-desc',
          'description: 42',
          '---',
          'body content',
        ].join('\n'),
        'utf-8',
      );

      await expect(
        exportSkillDirectory(sourceDir, targetDir, 'codex'),
      ).rejects.toThrow();
    });

    it('succeeds for valid SKILL.md (regression check)', async () => {
      await writeSkillMd(sourceDir, {
        name: 'valid-skill',
        description: 'A perfectly valid skill',
      }, '# Valid\n\nValid body.');

      const files = await exportSkillDirectory(sourceDir, targetDir, 'claude');
      expect(files).toContain('SKILL.md');
    });
  });
});
