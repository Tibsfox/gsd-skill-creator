import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { VersionManager } from './version-manager.js';

const execAsync = promisify(exec);

describe('VersionManager', () => {
  const testDir = join(tmpdir(), `version-manager-test-${Date.now()}`);
  const skillsDir = join(testDir, '.claude', 'skills');
  let manager: VersionManager;

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(join(testDir, '.claude', 'skills', 'test-skill'), { recursive: true });

    // Initialize git repo with signing disabled
    await execAsync('git init', { cwd: testDir });
    await execAsync('git config user.email "test@test.com"', { cwd: testDir });
    await execAsync('git config user.name "Test User"', { cwd: testDir });
    await execAsync('git config commit.gpgsign false', { cwd: testDir });

    manager = new VersionManager('.claude/skills', testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('getHistory', () => {
    it('should return empty array for untracked skill', async () => {
      const history = await manager.getHistory('nonexistent-skill');
      expect(history).toEqual([]);
    });

    it('should return version history for tracked skill', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      // Create and commit version 1
      await writeFile(skillPath, '# Test Skill v1');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "feat(test-skill): initial version v1"', { cwd: testDir });

      // Create and commit version 2
      await writeFile(skillPath, '# Test Skill v2');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "feat(test-skill): update to v2"', { cwd: testDir });

      const history = await manager.getHistory('test-skill');

      expect(history.length).toBe(2);
      expect(history[0].message).toContain('v2');
      expect(history[1].message).toContain('v1');
      // v2 should be same time or after v1 (may be equal if commits are fast)
      expect(history[0].date.getTime()).toBeGreaterThanOrEqual(history[1].date.getTime());
    });

    it('should parse version number from commit message', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      await writeFile(skillPath, '# Test Skill');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "update version 3"', { cwd: testDir });

      const history = await manager.getHistory('test-skill');

      expect(history[0].version).toBe(3);
    });
  });

  describe('getVersionContent', () => {
    it('should return content at specific version', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      // Create version 1
      await writeFile(skillPath, '# Original Content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 1"', { cwd: testDir });

      // Get hash of version 1
      const { stdout: hash1 } = await execAsync('git rev-parse HEAD', { cwd: testDir });

      // Create version 2
      await writeFile(skillPath, '# Modified Content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 2"', { cwd: testDir });

      // Get content at version 1
      const content = await manager.getVersionContent('test-skill', hash1.trim());

      expect(content).toContain('Original Content');
    });

    it('should throw for invalid hash', async () => {
      await expect(
        manager.getVersionContent('test-skill', 'invalidhash')
      ).rejects.toThrow();
    });
  });

  describe('getCurrentHash', () => {
    it('should return null for untracked skill', async () => {
      const hash = await manager.getCurrentHash('nonexistent-skill');
      expect(hash).toBeNull();
    });

    it('should return current hash for tracked skill', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      await writeFile(skillPath, '# Test Skill');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "initial"', { cwd: testDir });

      const hash = await manager.getCurrentHash('test-skill');

      expect(hash).not.toBeNull();
      expect(hash!.length).toBe(40); // Full SHA
    });
  });

  describe('rollback', () => {
    it('should rollback to previous version', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      // Create version 1
      await writeFile(skillPath, '# Version 1 Content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 1"', { cwd: testDir });

      const { stdout: hash1 } = await execAsync('git rev-parse HEAD', { cwd: testDir });

      // Create version 2
      await writeFile(skillPath, '# Version 2 Content');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 2"', { cwd: testDir });

      // Rollback to version 1
      const result = await manager.rollback('test-skill', hash1.trim());

      expect(result.success).toBe(true);
      expect(result.message).toContain('rollback');
      expect(result.newHash).toBeDefined();

      // Verify content is reverted
      const content = await manager.getVersionContent('test-skill', result.newHash!);
      expect(content).toContain('Version 1 Content');
    });

    it('should fail for untracked skill', async () => {
      const result = await manager.rollback('nonexistent-skill', 'abc123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not tracked');
    });

    it('should fail for invalid hash', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      await writeFile(skillPath, '# Test');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "initial"', { cwd: testDir });

      const result = await manager.rollback('test-skill', 'invalidhash123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('compareVersions', () => {
    it('should return diff between versions', async () => {
      const skillPath = join(skillsDir, 'test-skill', 'SKILL.md');

      // Create version 1
      await writeFile(skillPath, 'Line 1\nLine 2\nLine 3');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 1"', { cwd: testDir });

      const { stdout: hash1 } = await execAsync('git rev-parse HEAD', { cwd: testDir });

      // Create version 2
      await writeFile(skillPath, 'Line 1\nModified Line\nLine 3');
      await execAsync('git add .', { cwd: testDir });
      await execAsync('git commit -m "version 2"', { cwd: testDir });

      const { stdout: hash2 } = await execAsync('git rev-parse HEAD', { cwd: testDir });

      const diff = await manager.compareVersions('test-skill', hash1.trim(), hash2.trim());

      expect(diff).toContain('-Line 2');
      expect(diff).toContain('+Modified Line');
    });
  });
});
