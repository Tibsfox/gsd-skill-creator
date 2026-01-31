import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { SkillStore } from '../storage/skill-store.js';
import { SkillResolver } from './skill-resolver.js';
import { SkillMetadata, getExtension } from '../types/skill.js';

describe('SkillResolver', () => {
  const testDir = join(tmpdir(), `skill-resolver-test-${Date.now()}`);
  let skillStore: SkillStore;
  let resolver: SkillResolver;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    skillStore = new SkillStore(testDir);
    resolver = new SkillResolver(skillStore);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createSkill(name: string, metadata: Partial<SkillMetadata>, body: string): Promise<void> {
    const fullMetadata: SkillMetadata = {
      name,
      description: `Description for ${name}`,
      ...metadata,
    };
    await skillStore.create(name, fullMetadata, body);
  }

  describe('resolve', () => {
    it('should return unchanged skill when no extends', async () => {
      await createSkill('standalone', {}, '# Standalone Skill\n\nContent here.');

      const result = await resolver.resolve('standalone');

      expect(result.inheritanceChain).toEqual(['standalone']);
      expect(result.resolvedContent).toContain('Standalone Skill');
      const ext = getExtension(result.resolvedMetadata);
      expect(ext.extends).toBeUndefined();
    });

    it('should merge single level extension (parent before child)', async () => {
      await createSkill('parent', {}, '# Parent Skill\n\nParent content.');
      await createSkill('child', { extends: 'parent' }, '# Child Skill\n\nChild content.');

      const result = await resolver.resolve('child');

      expect(result.inheritanceChain).toEqual(['parent', 'child']);
      // Parent content should come before child content
      expect(result.resolvedContent.indexOf('Parent content')).toBeLessThan(
        result.resolvedContent.indexOf('Child content')
      );
      // Should have separator between parent and child
      expect(result.resolvedContent).toContain('---');
    });

    it('should merge multi-level extension in correct order', async () => {
      await createSkill('grandparent', {}, '# Grandparent');
      await createSkill('parent', { extends: 'grandparent' }, '# Parent');
      await createSkill('child', { extends: 'parent' }, '# Child');

      const result = await resolver.resolve('child');

      expect(result.inheritanceChain).toEqual(['grandparent', 'parent', 'child']);
      // Order: grandparent, parent, child
      const gIndex = result.resolvedContent.indexOf('Grandparent');
      const pIndex = result.resolvedContent.indexOf('Parent');
      const cIndex = result.resolvedContent.indexOf('Child');
      expect(gIndex).toBeLessThan(pIndex);
      expect(pIndex).toBeLessThan(cIndex);
    });

    it('should union trigger arrays with no duplicates', async () => {
      await createSkill('parent', {
        triggers: {
          intents: ['build', 'deploy'],
          files: ['*.ts'],
        },
      }, '# Parent');

      await createSkill('child', {
        extends: 'parent',
        triggers: {
          intents: ['deploy', 'test'], // deploy is duplicate
          files: ['*.tsx'],
        },
      }, '# Child');

      const result = await resolver.resolve('child');
      const ext = getExtension(result.resolvedMetadata);

      // Intents should be unioned: build, deploy, test
      expect(ext.triggers?.intents).toContain('build');
      expect(ext.triggers?.intents).toContain('deploy');
      expect(ext.triggers?.intents).toContain('test');
      expect(ext.triggers?.intents?.length).toBe(3); // No duplicates

      // Files should be unioned
      expect(ext.triggers?.files).toContain('*.ts');
      expect(ext.triggers?.files).toContain('*.tsx');
    });

    it('should use child values for name, description, threshold', async () => {
      await createSkill('parent', {
        triggers: { threshold: 0.5 },
      }, '# Parent');

      await createSkill('child', {
        extends: 'parent',
        description: 'Child-specific description',
        triggers: { threshold: 0.8 },
      }, '# Child');

      const result = await resolver.resolve('child');
      const ext = getExtension(result.resolvedMetadata);

      expect(result.resolvedMetadata.name).toBe('child');
      expect(result.resolvedMetadata.description).toBe('Child-specific description');
      expect(ext.triggers?.threshold).toBe(0.8);
    });

    it('should NOT inherit learning metadata', async () => {
      await createSkill('parent', {
        learning: {
          applicationCount: 10,
          lastRefined: '2024-01-01',
        },
      }, '# Parent');

      await createSkill('child', {
        extends: 'parent',
        learning: {
          applicationCount: 2,
        },
      }, '# Child');

      const result = await resolver.resolve('child');
      const ext = getExtension(result.resolvedMetadata);

      // Should use child's learning, not parent's
      expect(ext.learning?.applicationCount).toBe(2);
      expect(ext.learning?.lastRefined).toBeUndefined();
    });

    it('should throw for circular dependency', async () => {
      await createSkill('skill-a', { extends: 'skill-b' }, '# A');
      await createSkill('skill-b', { extends: 'skill-a' }, '# B');

      await expect(resolver.resolve('skill-a')).rejects.toThrow(
        /Circular dependency detected/
      );
    });

    it('should throw for missing parent skill', async () => {
      await createSkill('orphan', { extends: 'nonexistent' }, '# Orphan');

      // SkillStore throws ENOENT for missing files
      await expect(resolver.resolve('orphan')).rejects.toThrow();
    });

    it('should throw for non-existent skill', async () => {
      // SkillStore throws ENOENT for missing files
      await expect(resolver.resolve('does-not-exist')).rejects.toThrow();
    });

    it('should clear extends from resolved metadata', async () => {
      await createSkill('parent', {}, '# Parent');
      await createSkill('child', { extends: 'parent' }, '# Child');

      const result = await resolver.resolve('child');
      const ext = getExtension(result.resolvedMetadata);

      expect(ext.extends).toBeUndefined();
    });
  });
});
