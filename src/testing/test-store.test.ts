import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFile, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { TestStore } from './test-store.js';
import type { TestCase } from '../types/testing.js';
import type { TestCaseInput } from '../validation/test-validation.js';

// Mock getSkillsBasePath to use temp directories
vi.mock('../types/scope.js', async () => {
  const testBaseDir = join(tmpdir(), `test-store-test-${Date.now()}`);
  return {
    getSkillsBasePath: (scope: 'user' | 'project') => {
      if (scope === 'user') {
        return join(testBaseDir, 'user-skills');
      }
      return join(testBaseDir, 'project-skills');
    },
  };
});

describe('TestStore', () => {
  // Resolve the mocked base path for cleanup
  let testBaseDir: string;
  let userSkillsDir: string;
  let projectSkillsDir: string;

  beforeEach(async () => {
    // Get the paths from the mock
    const { getSkillsBasePath } = await import('../types/scope.js');
    userSkillsDir = getSkillsBasePath('user');
    projectSkillsDir = getSkillsBasePath('project');
    testBaseDir = join(userSkillsDir, '..');

    // Create skill directories
    await mkdir(join(userSkillsDir, 'test-skill'), { recursive: true });
    await mkdir(join(projectSkillsDir, 'test-skill'), { recursive: true });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    // Clean up temp directories
    await rm(testBaseDir, { recursive: true, force: true }).catch(() => {});
  });

  function createValidInput(
    prompt: string = 'Can you help me with authentication?',
    expected: 'positive' | 'negative' | 'edge-case' = 'positive'
  ): TestCaseInput {
    return {
      prompt,
      expected,
      description: 'Test description',
      tags: ['auth', 'test'],
    };
  }

  describe('load', () => {
    it('should return empty array when file does not exist', async () => {
      const store = new TestStore('user');
      const tests = await store.load('nonexistent-skill');
      expect(tests).toEqual([]);
    });

    it('should return parsed tests when file exists', async () => {
      const store = new TestStore('user');

      // Create a test file manually
      const testsPath = join(userSkillsDir, 'test-skill', 'tests.json');
      const testData: TestCase[] = [
        {
          id: 'test-123',
          prompt: 'Test prompt',
          expected: 'positive',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      await writeFile(testsPath, JSON.stringify(testData, null, 2));

      const tests = await store.load('test-skill');
      expect(tests).toHaveLength(1);
      expect(tests[0].id).toBe('test-123');
      expect(tests[0].prompt).toBe('Test prompt');
    });

    it('should handle corrupted JSON gracefully', async () => {
      const store = new TestStore('user');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Write corrupted JSON
      const testsPath = join(userSkillsDir, 'test-skill', 'tests.json');
      await writeFile(testsPath, '{ invalid json }');

      const tests = await store.load('test-skill');
      expect(tests).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not parse tests.json for 'test-skill'")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('add', () => {
    it('should create test with all fields', async () => {
      const store = new TestStore('user');
      const input: TestCaseInput = {
        prompt: 'How do I handle auth errors?',
        expected: 'positive',
        description: 'Authentication error handling',
        tags: ['auth', 'error'],
        difficulty: 'medium',
        minConfidence: 0.7,
      };

      const test = await store.add('test-skill', input);

      expect(test.prompt).toBe(input.prompt);
      expect(test.expected).toBe(input.expected);
      expect(test.description).toBe(input.description);
      expect(test.tags).toEqual(input.tags);
      expect(test.difficulty).toBe(input.difficulty);
      expect(test.minConfidence).toBe(input.minConfidence);
    });

    it('should generate UUID for id', async () => {
      const store = new TestStore('user');
      const test = await store.add('test-skill', createValidInput());

      // UUID v4 format check
      expect(test.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should set createdAt timestamp', async () => {
      const store = new TestStore('user');
      const before = new Date().toISOString();
      const test = await store.add('test-skill', createValidInput());
      const after = new Date().toISOString();

      expect(test.createdAt).toBeDefined();
      expect(test.createdAt >= before).toBe(true);
      expect(test.createdAt <= after).toBe(true);
    });

    it('should create tests.json if it does not exist', async () => {
      const store = new TestStore('user');

      // Use a new skill that doesn't have tests.json yet
      await mkdir(join(userSkillsDir, 'new-skill'), { recursive: true });

      await store.add('new-skill', createValidInput());

      const testsPath = join(userSkillsDir, 'new-skill', 'tests.json');
      const content = await readFile(testsPath, 'utf-8');
      const tests = JSON.parse(content);

      expect(tests).toHaveLength(1);
    });

    it('should throw on duplicate prompt (exact match)', async () => {
      const store = new TestStore('user');
      const prompt = 'Exact duplicate prompt for testing';

      await store.add('test-skill', createValidInput(prompt));

      await expect(
        store.add('test-skill', createValidInput(prompt))
      ).rejects.toThrow('Duplicate test prompt');
    });

    it('should log warnings for soft limit violations', async () => {
      const store = new TestStore('user');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create input with soft limit violation (very short prompt)
      const input: TestCaseInput = {
        prompt: 'hi', // Too short
        expected: 'positive',
      };

      await store.add('test-skill', input);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Very short prompt')
      );

      consoleSpy.mockRestore();
    });

    it('should throw on validation errors', async () => {
      const store = new TestStore('user');

      const invalidInput = {
        prompt: '', // Empty prompt - validation error
        expected: 'positive',
      } as TestCaseInput;

      await expect(store.add('test-skill', invalidInput)).rejects.toThrow(
        'Invalid test case input'
      );
    });

    it('should warn when skill directory does not exist', async () => {
      const store = new TestStore('user');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await store.add('nonexistent-skill', createValidInput('Unique prompt 1'));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skill directory 'nonexistent-skill' does not exist")
      );

      consoleSpy.mockRestore();
    });
  });

  describe('get', () => {
    it('should return test when found', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput());

      const found = await store.get('test-skill', created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.prompt).toBe(created.prompt);
    });

    it('should return null when not found', async () => {
      const store = new TestStore('user');
      await store.add('test-skill', createValidInput());

      const found = await store.get('test-skill', 'nonexistent-id');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update fields correctly', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput());

      const updated = await store.update('test-skill', created.id, {
        description: 'Updated description',
        tags: ['updated'],
      });

      expect(updated).not.toBeNull();
      expect(updated!.description).toBe('Updated description');
      expect(updated!.tags).toEqual(['updated']);
      // Original fields should be preserved
      expect(updated!.prompt).toBe(created.prompt);
    });

    it('should throw on duplicate prompt when changing to existing prompt', async () => {
      const store = new TestStore('user');

      const test1 = await store.add('test-skill', createValidInput('First prompt'));
      const test2 = await store.add('test-skill', createValidInput('Second prompt'));

      // Try to update test2's prompt to match test1's
      await expect(
        store.update('test-skill', test2.id, { prompt: 'First prompt' })
      ).rejects.toThrow('Duplicate test prompt');
    });

    it('should return null for non-existent test id', async () => {
      const store = new TestStore('user');
      await store.add('test-skill', createValidInput());

      const result = await store.update('test-skill', 'nonexistent-id', {
        description: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should preserve id and createdAt', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput());

      const updated = await store.update('test-skill', created.id, {
        prompt: 'Completely new prompt that is different',
        expected: 'negative',
      });

      expect(updated!.id).toBe(created.id);
      expect(updated!.createdAt).toBe(created.createdAt);
    });

    it('should allow updating prompt to same value', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput('Same prompt'));

      // Update with the same prompt (should not throw)
      const updated = await store.update('test-skill', created.id, {
        prompt: 'Same prompt',
        description: 'Updated description',
      });

      expect(updated).not.toBeNull();
      expect(updated!.prompt).toBe('Same prompt');
    });
  });

  describe('delete', () => {
    it('should return true and remove test', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput());

      const deleted = await store.delete('test-skill', created.id);

      expect(deleted).toBe(true);

      const found = await store.get('test-skill', created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      const store = new TestStore('user');
      await store.add('test-skill', createValidInput());

      const deleted = await store.delete('test-skill', 'nonexistent-id');

      expect(deleted).toBe(false);
    });

    it('should persist deletion to file', async () => {
      const store = new TestStore('user');
      const created = await store.add('test-skill', createValidInput());

      await store.delete('test-skill', created.id);

      // Read directly from file to verify persistence
      const testsPath = join(userSkillsDir, 'test-skill', 'tests.json');
      const content = await readFile(testsPath, 'utf-8');
      const tests = JSON.parse(content);

      expect(tests).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('should return all tests', async () => {
      const store = new TestStore('user');

      await store.add('test-skill', createValidInput('Prompt 1'));
      await store.add('test-skill', createValidInput('Prompt 2'));
      await store.add('test-skill', createValidInput('Prompt 3'));

      const tests = await store.list('test-skill');

      expect(tests).toHaveLength(3);
    });

    it('should return empty array for new skill', async () => {
      const store = new TestStore('user');

      const tests = await store.list('empty-skill');

      expect(tests).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      const store = new TestStore('user');

      expect(await store.count('test-skill')).toBe(0);

      await store.add('test-skill', createValidInput('Prompt A'));
      expect(await store.count('test-skill')).toBe(1);

      await store.add('test-skill', createValidInput('Prompt B'));
      expect(await store.count('test-skill')).toBe(2);
    });
  });

  describe('atomic writes', () => {
    it('should produce valid JSON after save', async () => {
      const store = new TestStore('user');

      // Add multiple tests
      await store.add('test-skill', createValidInput('Prompt X'));
      await store.add('test-skill', createValidInput('Prompt Y'));
      await store.add('test-skill', createValidInput('Prompt Z'));

      // Read file directly and verify it's valid JSON
      const testsPath = join(userSkillsDir, 'test-skill', 'tests.json');
      const content = await readFile(testsPath, 'utf-8');

      // Should not throw
      const parsed = JSON.parse(content);
      expect(parsed).toHaveLength(3);

      // Verify pretty-printed with 2-space indent
      expect(content).toContain('  "id"');
    });

    it('should handle concurrent add operations', async () => {
      const store = new TestStore('user');

      // Add many tests concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(store.add('test-skill', createValidInput(`Concurrent prompt ${i}`)));
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(10);

      // All should have unique IDs
      const ids = new Set(results.map((t) => t.id));
      expect(ids.size).toBe(10);

      // All should be persisted
      const tests = await store.list('test-skill');
      expect(tests).toHaveLength(10);
    });
  });

  describe('scope handling', () => {
    it('should write to user scope path', async () => {
      const store = new TestStore('user');
      await store.add('test-skill', createValidInput('User scope prompt'));

      const testsPath = join(userSkillsDir, 'test-skill', 'tests.json');
      const content = await readFile(testsPath, 'utf-8');
      const tests = JSON.parse(content);

      expect(tests).toHaveLength(1);
      expect(tests[0].prompt).toBe('User scope prompt');
    });

    it('should write to project scope path', async () => {
      const store = new TestStore('project');
      await store.add('test-skill', createValidInput('Project scope prompt'));

      const testsPath = join(projectSkillsDir, 'test-skill', 'tests.json');
      const content = await readFile(testsPath, 'utf-8');
      const tests = JSON.parse(content);

      expect(tests).toHaveLength(1);
      expect(tests[0].prompt).toBe('Project scope prompt');
    });

    it('should keep user and project scopes separate', async () => {
      const userStore = new TestStore('user');
      const projectStore = new TestStore('project');

      await userStore.add('test-skill', createValidInput('User test'));
      await projectStore.add('test-skill', createValidInput('Project test'));

      const userTests = await userStore.list('test-skill');
      const projectTests = await projectStore.list('test-skill');

      expect(userTests).toHaveLength(1);
      expect(userTests[0].prompt).toBe('User test');

      expect(projectTests).toHaveLength(1);
      expect(projectTests[0].prompt).toBe('Project test');
    });
  });

  describe('edge cases', () => {
    it('should handle empty skill name', async () => {
      const store = new TestStore('user');

      // Should still work (creates path at basePath/tests.json)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await store.add('', createValidInput('Empty skill name test'));
      consoleSpy.mockRestore();

      const tests = await store.list('');
      expect(tests).toHaveLength(1);
    });

    it('should handle special characters in prompt', async () => {
      const store = new TestStore('user');
      const specialPrompt = 'Test with "quotes" and \n newlines and \t tabs';

      const test = await store.add('test-skill', createValidInput(specialPrompt));

      expect(test.prompt).toBe(specialPrompt);

      // Verify persisted correctly
      const loaded = await store.get('test-skill', test.id);
      expect(loaded!.prompt).toBe(specialPrompt);
    });

    it('should handle unicode in prompt', async () => {
      const store = new TestStore('user');
      const unicodePrompt = 'Test with unicode: cafe, emoji, chinese';

      const test = await store.add('test-skill', createValidInput(unicodePrompt));

      const loaded = await store.get('test-skill', test.id);
      expect(loaded!.prompt).toBe(unicodePrompt);
    });
  });
});
