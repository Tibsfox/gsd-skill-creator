import { describe, it, expect, beforeAll } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile, rm, mkdir } from 'fs/promises';
import {
  ReservedNameValidator,
  ReservedNamesConfigSchema,
  formatReservedNameError,
} from './reserved-names.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const testConfigDir = join(__dirname, '..', '..', 'test-fixtures');
const testConfigPath = join(testConfigDir, 'test-reserved-names.json');

const validConfig = {
  version: '1.0.0',
  lastSync: '2026-01-30T00:00:00.000Z',
  sourceVersion: 'Claude Code 1.0.33',
  categories: {
    'built-in-commands': {
      description: 'Claude Code slash commands',
      reason: 'conflicts with built-in Claude Code command',
      names: ['clear', 'help', 'status'],
    },
    'agent-types': {
      description: 'Built-in agent type names',
      reason: 'conflicts with built-in Claude Code agent',
      names: ['explore', 'plan', 'task'],
    },
    'system-skills': {
      description: 'System-reserved skill names',
      reason: 'conflicts with Claude Code system feature',
      names: ['skill', 'agent', 'system'],
    },
  },
};

describe('ReservedNameValidator', () => {
  describe('Loading', () => {
    beforeAll(async () => {
      await mkdir(testConfigDir, { recursive: true });
    });

    it('should load successfully from default path', async () => {
      const validator = await ReservedNameValidator.load();
      expect(validator).toBeDefined();
      expect(validator.getMetadata().version).toBeDefined();
    });

    it('should load successfully from custom path', async () => {
      await writeFile(testConfigPath, JSON.stringify(validConfig));
      try {
        const validator = await ReservedNameValidator.load(testConfigPath);
        expect(validator).toBeDefined();
        expect(validator.getMetadata().version).toBe('1.0.0');
      } finally {
        await rm(testConfigPath, { force: true });
      }
    });

    it('should throw on invalid JSON structure', async () => {
      await writeFile(testConfigPath, '{ invalid json }');
      try {
        await expect(ReservedNameValidator.load(testConfigPath)).rejects.toThrow('Invalid JSON');
      } finally {
        await rm(testConfigPath, { force: true });
      }
    });

    it('should throw on missing required fields', async () => {
      const invalidConfig = {
        version: '1.0.0',
        // missing lastSync, sourceVersion, categories
      };
      await writeFile(testConfigPath, JSON.stringify(invalidConfig));
      try {
        await expect(ReservedNameValidator.load(testConfigPath)).rejects.toThrow('Invalid reserved names config');
      } finally {
        await rm(testConfigPath, { force: true });
      }
    });

    it('should throw on missing config file', async () => {
      await expect(ReservedNameValidator.load('/nonexistent/path/config.json')).rejects.toThrow('Failed to read');
    });

    it('should throw on invalid version format', async () => {
      const invalidConfig = {
        ...validConfig,
        version: 'not-semver',
      };
      await writeFile(testConfigPath, JSON.stringify(invalidConfig));
      try {
        await expect(ReservedNameValidator.load(testConfigPath)).rejects.toThrow('semver');
      } finally {
        await rm(testConfigPath, { force: true });
      }
    });
  });

  describe('isReserved()', () => {
    let validator: ReservedNameValidator;

    beforeAll(async () => {
      validator = await ReservedNameValidator.load();
    });

    describe('exact matches', () => {
      it('should return reserved=true for exact match "help"', () => {
        const result = validator.isReserved('help');
        expect(result.reserved).toBe(true);
        expect(result.entry).toBeDefined();
        expect(result.entry!.name).toBe('help');
      });

      it('should return reserved=true for "clear"', () => {
        const result = validator.isReserved('clear');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "explore"', () => {
        const result = validator.isReserved('explore');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "skill"', () => {
        const result = validator.isReserved('skill');
        expect(result.reserved).toBe(true);
      });
    });

    describe('case-insensitive matching', () => {
      it('should return reserved=true for "Help" (capitalized)', () => {
        const result = validator.isReserved('Help');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "HELP" (all uppercase)', () => {
        const result = validator.isReserved('HELP');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "hElP" (mixed case)', () => {
        const result = validator.isReserved('hElP');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "CLEAR" (all uppercase)', () => {
        const result = validator.isReserved('CLEAR');
        expect(result.reserved).toBe(true);
      });

      it('should return reserved=true for "Skill" (capitalized)', () => {
        const result = validator.isReserved('Skill');
        expect(result.reserved).toBe(true);
      });
    });

    describe('non-reserved names', () => {
      it('should return reserved=false for "my-custom-skill"', () => {
        const result = validator.isReserved('my-custom-skill');
        expect(result.reserved).toBe(false);
        expect(result.entry).toBeUndefined();
      });

      it('should return reserved=false for "helper-tool"', () => {
        const result = validator.isReserved('helper-tool');
        expect(result.reserved).toBe(false);
      });

      it('should return reserved=false for "build-project"', () => {
        const result = validator.isReserved('build-project');
        expect(result.reserved).toBe(false);
      });

      it('should return reserved=false for partial matches like "helper"', () => {
        const result = validator.isReserved('helper');
        expect(result.reserved).toBe(false);
      });

      it('should return reserved=false for "my-help"', () => {
        const result = validator.isReserved('my-help');
        expect(result.reserved).toBe(false);
      });
    });

    describe('correct category assignment', () => {
      it('should return "built-in-commands" for "clear"', () => {
        const result = validator.isReserved('clear');
        expect(result.reserved).toBe(true);
        expect(result.entry!.category).toBe('built-in-commands');
      });

      it('should return "agent-types" for "explore"', () => {
        const result = validator.isReserved('explore');
        expect(result.reserved).toBe(true);
        expect(result.entry!.category).toBe('agent-types');
      });

      it('should return "system-skills" for "skill"', () => {
        const result = validator.isReserved('skill');
        expect(result.reserved).toBe(true);
        expect(result.entry!.category).toBe('system-skills');
      });

      it('should return context-specific reason for built-in commands', () => {
        const result = validator.isReserved('help');
        expect(result.entry!.reason).toContain('built-in Claude Code command');
      });

      it('should return context-specific reason for agent types', () => {
        const result = validator.isReserved('task');
        expect(result.entry!.reason).toContain('built-in Claude Code agent');
      });

      it('should return context-specific reason for system skills', () => {
        const result = validator.isReserved('agent');
        expect(result.entry!.reason).toContain('Claude Code system feature');
      });
    });
  });

  describe('suggestAlternatives()', () => {
    let validator: ReservedNameValidator;

    beforeAll(async () => {
      validator = await ReservedNameValidator.load();
    });

    it('should return valid alternatives for reserved name "help"', () => {
      const alternatives = validator.suggestAlternatives('help');
      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.length).toBeLessThanOrEqual(3);
    });

    it('should return alternatives that are not reserved', () => {
      const alternatives = validator.suggestAlternatives('skill');
      for (const alt of alternatives) {
        const result = validator.isReserved(alt);
        expect(result.reserved).toBe(false);
      }
    });

    it('should return alternatives that pass name validation', () => {
      const alternatives = validator.suggestAlternatives('system');
      const namePattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
      for (const alt of alternatives) {
        expect(namePattern.test(alt)).toBe(true);
        expect(alt.includes('--')).toBe(false);
        expect(alt.length).toBeLessThanOrEqual(64);
      }
    });

    it('should respect maxCount parameter', () => {
      const alternatives = validator.suggestAlternatives('help', 1);
      expect(alternatives.length).toBeLessThanOrEqual(1);
    });

    it('should return fewer alternatives if maxCount is 5', () => {
      const alternatives = validator.suggestAlternatives('status', 5);
      expect(alternatives.length).toBeLessThanOrEqual(5);
      expect(alternatives.length).toBeGreaterThan(0);
    });

    it('should return empty array if no valid alternatives possible', () => {
      const alternatives = validator.suggestAlternatives('');
      expect(alternatives).toEqual([]);
    });

    it('should handle names with invalid characters', () => {
      const alternatives = validator.suggestAlternatives('HELP');
      expect(alternatives.length).toBeGreaterThan(0);
      // Alternatives should be lowercase
      for (const alt of alternatives) {
        expect(alt).toBe(alt.toLowerCase());
      }
    });

    it('should use prefix patterns like my-, custom-, project-', () => {
      const alternatives = validator.suggestAlternatives('clear');
      const hasPrefixPattern = alternatives.some(
        (alt) =>
          alt.startsWith('my-') ||
          alt.startsWith('custom-') ||
          alt.startsWith('project-') ||
          alt.startsWith('local-') ||
          alt.startsWith('user-')
      );
      expect(hasPrefixPattern).toBe(true);
    });
  });

  describe('getAllReservedNames()', () => {
    let validator: ReservedNameValidator;

    beforeAll(async () => {
      validator = await ReservedNameValidator.load();
    });

    it('should return all categories', () => {
      const allNames = validator.getAllReservedNames();
      expect(allNames['built-in-commands']).toBeDefined();
      expect(allNames['agent-types']).toBeDefined();
      expect(allNames['system-skills']).toBeDefined();
    });

    it('should include names array in each category', () => {
      const allNames = validator.getAllReservedNames();
      expect(Array.isArray(allNames['built-in-commands'].names)).toBe(true);
      expect(allNames['built-in-commands'].names.length).toBeGreaterThan(0);
    });

    it('should include description and reason in each category', () => {
      const allNames = validator.getAllReservedNames();
      for (const category of Object.values(allNames)) {
        expect(category.description).toBeDefined();
        expect(category.reason).toBeDefined();
      }
    });

    it('should include "help" in built-in-commands', () => {
      const allNames = validator.getAllReservedNames();
      expect(allNames['built-in-commands'].names).toContain('help');
    });

    it('should include "explore" in agent-types', () => {
      const allNames = validator.getAllReservedNames();
      expect(allNames['agent-types'].names).toContain('explore');
    });

    it('should include "skill" in system-skills', () => {
      const allNames = validator.getAllReservedNames();
      expect(allNames['system-skills'].names).toContain('skill');
    });
  });

  describe('getMetadata()', () => {
    let validator: ReservedNameValidator;

    beforeAll(async () => {
      validator = await ReservedNameValidator.load();
    });

    it('should return version from config', () => {
      const metadata = validator.getMetadata();
      expect(metadata.version).toBeDefined();
      expect(metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should return lastSync from config', () => {
      const metadata = validator.getMetadata();
      expect(metadata.lastSync).toBeDefined();
      expect(new Date(metadata.lastSync).toISOString()).toBe(metadata.lastSync);
    });

    it('should return sourceVersion from config', () => {
      const metadata = validator.getMetadata();
      expect(metadata.sourceVersion).toBeDefined();
      expect(metadata.sourceVersion).toContain('Claude Code');
    });
  });
});

describe('ReservedNamesConfigSchema', () => {
  it('should accept valid config', () => {
    const result = ReservedNamesConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject missing version', () => {
    const { version, ...withoutVersion } = validConfig;
    const result = ReservedNamesConfigSchema.safeParse(withoutVersion);
    expect(result.success).toBe(false);
  });

  it('should reject invalid semver version', () => {
    const result = ReservedNamesConfigSchema.safeParse({
      ...validConfig,
      version: '1.0',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid lastSync datetime', () => {
    const result = ReservedNamesConfigSchema.safeParse({
      ...validConfig,
      lastSync: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing categories', () => {
    const { categories, ...withoutCategories } = validConfig;
    const result = ReservedNamesConfigSchema.safeParse(withoutCategories);
    expect(result.success).toBe(false);
  });

  it('should reject missing category fields', () => {
    const result = ReservedNamesConfigSchema.safeParse({
      ...validConfig,
      categories: {
        ...validConfig.categories,
        'built-in-commands': {
          description: 'test',
          // missing reason and names
        },
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('formatReservedNameError()', () => {
  let validator: ReservedNameValidator;

  beforeAll(async () => {
    validator = await ReservedNameValidator.load();
  });

  it('should include input name in message', () => {
    const checkResult = validator.isReserved('help');
    const message = formatReservedNameError('help', checkResult);
    expect(message).toContain('"help"');
  });

  it('should include category-specific reason', () => {
    const checkResult = validator.isReserved('help');
    const message = formatReservedNameError('help', checkResult);
    expect(message).toContain('built-in Claude Code command');
  });

  it('should include alternatives when provided', () => {
    const checkResult = validator.isReserved('help');
    const alternatives = validator.suggestAlternatives('help');
    const message = formatReservedNameError('help', checkResult, alternatives);
    expect(message).toContain('Suggested alternatives');
    for (const alt of alternatives) {
      expect(message).toContain(alt);
    }
  });

  it('should include documentation link', () => {
    const checkResult = validator.isReserved('help');
    const message = formatReservedNameError('help', checkResult);
    expect(message).toContain('https://code.claude.com/docs/en/skills#naming');
  });

  it('should handle empty alternatives array', () => {
    const checkResult = validator.isReserved('help');
    const message = formatReservedNameError('help', checkResult, []);
    expect(message).not.toContain('Suggested alternatives');
    expect(message).toContain('more information');
  });

  it('should return empty string for non-reserved names', () => {
    const checkResult = validator.isReserved('my-skill');
    const message = formatReservedNameError('my-skill', checkResult);
    expect(message).toBe('');
  });

  it('should explain built-in command conflicts', () => {
    const checkResult = validator.isReserved('clear');
    const message = formatReservedNameError('clear', checkResult);
    expect(message).toContain('built-in command');
    expect(message).toContain('prevent');
  });

  it('should explain agent-type conflicts', () => {
    const checkResult = validator.isReserved('explore');
    const message = formatReservedNameError('explore', checkResult);
    expect(message).toContain('agent');
    expect(message).toContain('routing');
  });

  it('should explain system-skill conflicts', () => {
    const checkResult = validator.isReserved('skill');
    const message = formatReservedNameError('skill', checkResult);
    expect(message).toContain('system');
    expect(message).toContain('loading');
  });

  it('should format message with newlines for readability', () => {
    const checkResult = validator.isReserved('help');
    const alternatives = validator.suggestAlternatives('help');
    const message = formatReservedNameError('help', checkResult, alternatives);
    expect(message.split('\n').length).toBeGreaterThan(3);
  });
});
