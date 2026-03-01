import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SkillStore } from './skill-store.js';
import { PathTraversalError } from '../validation/path-safety.js';
import { BudgetExceededError } from '../validation/budget-validation.js';

// ============================================================================
// SkillStore Path Safety Tests
// ============================================================================

describe('SkillStore path safety', () => {
  let tempDir: string;
  let skillsDir: string;
  let store: SkillStore;

  const validMetadata = {
    name: 'test-skill',
    description: 'A test skill for path safety testing',
  };

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-store-pathsafe-'));
    skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    store = new SkillStore(skillsDir);

    // Create a valid skill for read/update/delete/exists tests
    await store.create('test-skill', validMetadata, 'Test body content');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // --------------------------------------------------------------------------
  // Malicious names that must be rejected
  // --------------------------------------------------------------------------

  const maliciousNames = [
    { name: '../malicious', label: 'parent traversal' },
    { name: 'foo/bar', label: 'forward slash separator' },
    { name: 'foo\\bar', label: 'backslash separator' },
    { name: 'foo\x00bar', label: 'null byte' },
    { name: '../../etc/passwd', label: 'deep traversal' },
    { name: '..', label: 'standalone double dot' },
  ];

  // --------------------------------------------------------------------------
  // read()
  // --------------------------------------------------------------------------

  describe('read', () => {
    for (const { name, label } of maliciousNames) {
      it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
        await expect(store.read(name)).rejects.toThrow(PathTraversalError);
      });
    }

    it('reads valid skill without throwing', async () => {
      const skill = await store.read('test-skill');
      expect(skill.metadata.name).toBe('test-skill');
    });
  });

  // --------------------------------------------------------------------------
  // exists()
  // --------------------------------------------------------------------------

  describe('exists', () => {
    for (const { name, label } of maliciousNames) {
      it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
        await expect(store.exists(name)).rejects.toThrow(PathTraversalError);
      });
    }

    it('checks valid skill without throwing', async () => {
      const result = await store.exists('test-skill');
      expect(result).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // delete()
  // --------------------------------------------------------------------------

  describe('delete', () => {
    for (const { name, label } of maliciousNames) {
      it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
        await expect(store.delete(name)).rejects.toThrow(PathTraversalError);
      });
    }

    it('deletes valid skill without throwing', async () => {
      await expect(store.delete('test-skill')).resolves.not.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // update()
  // --------------------------------------------------------------------------

  describe('update', () => {
    for (const { name, label } of maliciousNames) {
      it(`rejects ${label}: "${name.replace('\x00', '\\x00')}"`, async () => {
        await expect(
          store.update(name, { description: 'hacked' }),
        ).rejects.toThrow(PathTraversalError);
      });
    }

    it('updates valid skill without throwing', async () => {
      const result = await store.update('test-skill', {
        description: 'updated description',
      });
      expect(result.metadata.description).toBe('updated description');
    });
  });

  // --------------------------------------------------------------------------
  // create() defense-in-depth (assertSafePath after join)
  // --------------------------------------------------------------------------

  describe('create defense-in-depth', () => {
    it('create() with valid name succeeds', async () => {
      const skill = await store.create(
        'new-valid-skill',
        { name: 'new-valid-skill', description: 'Valid' },
        'body',
      );
      expect(skill.path).toContain('new-valid-skill');
    });
  });
});

// ============================================================================
// SkillStore YAML Safety Tests (72-02)
// ============================================================================

describe('SkillStore YAML safety', () => {
  let tempDir: string;
  let skillsDir: string;
  let store: SkillStore;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-store-yaml-'));
    skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    store = new SkillStore(skillsDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper: write a raw SKILL.md file directly (bypassing store.create).
   */
  function writeRawSkill(name: string, rawContent: string): void {
    const skillDir = path.join(skillsDir, name);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), rawContent, 'utf-8');
  }

  describe('read() rejects dangerous YAML tags', () => {
    it('rejects !!js/function in frontmatter', async () => {
      writeRawSkill('evil-func', [
        '---',
        'name: evil-func',
        'description: !!js/function "function() { return 1; }"',
        '---',
        'body content',
      ].join('\n'));

      await expect(store.read('evil-func')).rejects.toThrow(/[Dd]angerous YAML tag/);
    });

    it('rejects !!js/undefined in frontmatter', async () => {
      writeRawSkill('evil-undef', [
        '---',
        'name: evil-undef',
        'description: !!js/undefined ""',
        '---',
        'body',
      ].join('\n'));

      await expect(store.read('evil-undef')).rejects.toThrow(/YAML/i);
    });

    it('rejects !!python/object in frontmatter', async () => {
      writeRawSkill('evil-python', [
        '---',
        'name: evil-python',
        'description: !!python/object:os.system "rm -rf /"',
        '---',
        'body',
      ].join('\n'));

      await expect(store.read('evil-python')).rejects.toThrow(/YAML/i);
    });
  });

  describe('read() rejects malformed frontmatter via Zod', () => {
    it('rejects missing required name field', async () => {
      writeRawSkill('no-name', [
        '---',
        'description: A valid description',
        '---',
        'body content',
      ].join('\n'));

      await expect(store.read('no-name')).rejects.toThrow(/name/i);
    });

    it('rejects wrong type for description (number instead of string)', async () => {
      writeRawSkill('bad-desc', [
        '---',
        'name: bad-desc',
        'description: 42',
        '---',
        'body content',
      ].join('\n'));

      await expect(store.read('bad-desc')).rejects.toThrow();
    });
  });

  describe('read() succeeds for valid skills (regression)', () => {
    it('reads a valid skill with all standard fields', async () => {
      // Create a valid skill through the store API
      await store.create(
        'valid-skill',
        { name: 'valid-skill', description: 'A perfectly valid skill' },
        'Valid body content',
      );

      const skill = await store.read('valid-skill');
      expect(skill.metadata.name).toBe('valid-skill');
      expect(skill.metadata.description).toBe('A perfectly valid skill');
      expect(skill.body).toBe('Valid body content');
    });

    it('reads a valid skill with optional fields preserved', async () => {
      await store.create(
        'full-skill',
        {
          name: 'full-skill',
          description: 'Full featured skill',
          'allowed-tools': ['Read', 'Write'],
          model: 'claude-sonnet-4-20250514',
        },
        'Full body',
      );

      const skill = await store.read('full-skill');
      expect(skill.metadata.name).toBe('full-skill');
      expect(skill.metadata.description).toBe('Full featured skill');
    });
  });

  // --------------------------------------------------------------------------
  // getSkillsDir (QUAL-06)
  // --------------------------------------------------------------------------

  describe('getSkillsDir', () => {
    it('returns the skillsDir passed to constructor', () => {
      expect(store.getSkillsDir()).toBe(skillsDir);
    });

    it('returns default .claude/skills when no path provided', () => {
      const defaultStore = new SkillStore();
      expect(defaultStore.getSkillsDir()).toBe('.claude/skills');
    });

    it('returns custom path when custom path provided', () => {
      const customStore = new SkillStore('/custom/skills/path');
      expect(customStore.getSkillsDir()).toBe('/custom/skills/path');
    });
  });
});

// ============================================================================
// SkillStore Budget Enforcement Tests (QUAL-04)
// ============================================================================

describe('SkillStore budget enforcement', () => {
  let tempDir: string;
  let skillsDir: string;
  let store: SkillStore;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-store-budget-'));
    skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    store = new SkillStore(skillsDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('create() budget enforcement', () => {
    it('throws BudgetExceededError when content exceeds budget', async () => {
      const largeBody = 'x'.repeat(20000);
      await expect(
        store.create(
          'over-budget',
          { name: 'over-budget', description: 'A skill that exceeds budget' },
          largeBody,
        ),
      ).rejects.toThrow(BudgetExceededError);
    });

    it('BudgetExceededError carries correct skillName', async () => {
      const largeBody = 'x'.repeat(20000);
      try {
        await store.create(
          'over-budget-name-check',
          { name: 'over-budget-name-check', description: 'Test' },
          largeBody,
        );
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BudgetExceededError);
        expect((err as BudgetExceededError).skillName).toBe('over-budget-name-check');
        expect((err as BudgetExceededError).budgetResult.severity).toBe('error');
      }
    });

    it('succeeds when forceOverrideBudget is set on extension data', async () => {
      const largeBody = 'x'.repeat(20000);
      const metadata = {
        name: 'force-override',
        description: 'A skill that exceeds budget but has force override',
        metadata: {
          extensions: {
            'gsd-skill-creator': {
              forceOverrideBudget: {
                charCount: 20000,
                budgetLimit: 15000,
                overriddenAt: new Date().toISOString(),
              },
            },
          },
        },
      };
      const result = await store.create('force-override', metadata, largeBody);
      expect(result.path).toContain('force-override');
    });

    it('succeeds when content is within budget', async () => {
      const smallBody = 'Small skill body content';
      const result = await store.create(
        'within-budget',
        { name: 'within-budget', description: 'A small skill' },
        smallBody,
      );
      expect(result.path).toContain('within-budget');
    });
  });
});
