import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SkillStore } from './skill-store.js';
import { PathTraversalError } from '../validation/path-safety.js';

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
