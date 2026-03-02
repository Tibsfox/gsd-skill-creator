import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SkillMetadataSchema } from './skill-validation.js';

/**
 * Load a JSON fixture from the __fixtures__ directory.
 */
function loadFixture(filename: string): Record<string, unknown> {
  const filepath = join(__dirname, '__fixtures__', filename);
  return JSON.parse(readFileSync(filepath, 'utf-8')) as Record<string, unknown>;
}

/**
 * Recursively assert no values are undefined at any depth.
 */
function assertNoUndefinedValues(obj: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    expect(value, `"${fullPath}" must not be undefined`).not.toBeUndefined();
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      assertNoUndefinedValues(value as Record<string, unknown>, fullPath);
    }
  }
}

describe('Schema Migration Fixtures', () => {
  describe('legacy-root-extensions.json', () => {
    it('should parse successfully through SkillMetadataSchema', () => {
      const fixture = loadFixture('legacy-root-extensions.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });

    it('should preserve all input fields without undefined values', () => {
      const fixture = loadFixture('legacy-root-extensions.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        assertNoUndefinedValues(result.data as Record<string, unknown>);
      }
    });

    it('should preserve all original keys in output', () => {
      const fixture = loadFixture('legacy-root-extensions.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        for (const key of Object.keys(fixture)) {
          expect(result.data).toHaveProperty(key);
        }
      }
    });
  });

  describe('legacy-minimal.json', () => {
    it('should parse successfully through SkillMetadataSchema', () => {
      const fixture = loadFixture('legacy-minimal.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });

    it('should preserve name and description exactly', () => {
      const fixture = loadFixture('legacy-minimal.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('minimal-skill');
        expect(result.data.description).toBe('Minimal skill with just name and description.');
      }
    });
  });

  describe('legacy-new-format.json', () => {
    it('should parse successfully through SkillMetadataSchema', () => {
      const fixture = loadFixture('legacy-new-format.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });

    it('should preserve metadata.extensions.gsd-skill-creator fields', () => {
      const fixture = loadFixture('legacy-new-format.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const metadata = data.metadata as Record<string, unknown>;
        expect(metadata).toBeDefined();
        const extensions = metadata.extensions as Record<string, unknown>;
        expect(extensions).toBeDefined();
        const gsd = extensions['gsd-skill-creator'] as Record<string, unknown>;
        expect(gsd).toBeDefined();
        expect(gsd.enabled).toBe(true);
        expect(gsd.version).toBe(3);
      }
    });

    it('should have no undefined values at any depth', () => {
      const fixture = loadFixture('legacy-new-format.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        assertNoUndefinedValues(result.data as Record<string, unknown>);
      }
    });
  });

  describe('legacy-with-claude-fields.json', () => {
    it('should parse successfully through SkillMetadataSchema', () => {
      const fixture = loadFixture('legacy-with-claude-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });

    it('should parse allowed-tools string into array', () => {
      const fixture = loadFixture('legacy-with-claude-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data['allowed-tools']).toEqual(['Read', 'Grep', 'Bash']);
      }
    });

    it('should preserve model, context, and agent fields', () => {
      const fixture = loadFixture('legacy-with-claude-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe('claude-sonnet-4-20250514');
        expect(result.data.context).toBe('fork');
        expect(result.data.agent).toBe('code-reviewer');
      }
    });
  });

  describe('legacy-unknown-fields.json', () => {
    it('should parse successfully through SkillMetadataSchema', () => {
      const fixture = loadFixture('legacy-unknown-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
    });

    it('should preserve unknown passthrough fields', () => {
      const fixture = loadFixture('legacy-unknown-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data['custom-tool-field']).toBe('preserved-value');
        expect(data['another-extension']).toEqual({ nested: true, count: 42 });
      }
    });

    it('should preserve spec-standard optional fields', () => {
      const fixture = loadFixture('legacy-unknown-fields.json');
      const result = SkillMetadataSchema.safeParse(fixture);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.license).toBe('MIT');
        expect(result.data.compatibility).toBe('Claude Code v1.0+');
      }
    });
  });

  describe('Negative: strict schema rejects legacy-permissive names', () => {
    it('should reject name with leading hyphen', () => {
      const result = SkillMetadataSchema.safeParse({
        name: '-leading-hyphen',
        description: 'Invalid name fixture.',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with trailing hyphen', () => {
      const result = SkillMetadataSchema.safeParse({
        name: 'trailing-',
        description: 'Invalid name fixture.',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name with consecutive hyphens', () => {
      const result = SkillMetadataSchema.safeParse({
        name: 'double--hyphen',
        description: 'Invalid name fixture.',
      });
      expect(result.success).toBe(false);
    });
  });
});
