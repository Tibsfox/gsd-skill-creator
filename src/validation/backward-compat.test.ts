import { describe, it, expect } from 'vitest';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import { SkillMetadataSchema } from './skill-validation.js';

// Path relative to project root (vitest runs from project root)
const EXAMPLES_DIR = join(__dirname, '..', '..', 'examples');

// ============================================================================
// Helper: Discover example directories
// ============================================================================

async function discoverExamples(subdir: string, filename: string): Promise<{ name: string; path: string }[]> {
  const dir = join(EXAMPLES_DIR, subdir);
  const entries = await readdir(dir);
  const examples: { name: string; path: string }[] = [];

  for (const entry of entries) {
    const entryPath = join(dir, entry);
    const entryStat = await stat(entryPath);
    if (entryStat.isDirectory()) {
      const filePath = join(entryPath, filename);
      try {
        await stat(filePath);
        examples.push({ name: entry, path: filePath });
      } catch {
        // Directory exists but no matching file — skip
      }
    }
  }

  return examples;
}

// ============================================================================
// Skills backward compatibility
// ============================================================================

describe('Backward Compatibility: Example Skills', () => {
  it('should discover all 33 example skills', async () => {
    const skills = await discoverExamples('skills', 'SKILL.md');
    expect(skills.length).toBe(33);
  });

  it('should validate every example skill against SkillMetadataSchema', async () => {
    const skills = await discoverExamples('skills', 'SKILL.md');
    const failures: { name: string; errors: string }[] = [];

    for (const skill of skills) {
      const content = await readFile(skill.path, 'utf-8');
      const { data } = matter(content);
      const result = SkillMetadataSchema.safeParse(data);

      if (!result.success) {
        const errors = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        failures.push({ name: skill.name, errors });
      }
    }

    if (failures.length > 0) {
      const msg = failures.map(f => `  ${f.name}: ${f.errors}`).join('\n');
      expect.fail(`${failures.length} skill(s) failed validation:\n${msg}`);
    }
  });

  it('should validate each skill has at minimum name and description', async () => {
    const skills = await discoverExamples('skills', 'SKILL.md');

    for (const skill of skills) {
      const content = await readFile(skill.path, 'utf-8');
      const { data } = matter(content);
      expect(data.name, `${skill.name}: missing name`).toBeDefined();
      expect(typeof data.name, `${skill.name}: name should be string`).toBe('string');
      expect(data.description, `${skill.name}: missing description`).toBeDefined();
      expect(typeof data.description, `${skill.name}: description should be string`).toBe('string');
    }
  });
});

// ============================================================================
// Agents backward compatibility
// ============================================================================

describe('Backward Compatibility: Example Agents', () => {
  it('should discover all 22 example agents', async () => {
    const agents = await discoverExamples('agents', 'AGENT.md');
    expect(agents.length).toBe(22);
  });

  it('should validate every example agent has name and description', async () => {
    const agents = await discoverExamples('agents', 'AGENT.md');
    const failures: { name: string; errors: string }[] = [];

    for (const agent of agents) {
      const content = await readFile(agent.path, 'utf-8');
      const { data } = matter(content);

      // Agents use 'tools' (not 'allowed-tools') and 'model' — these pass via .passthrough()
      // At minimum, validate name and description are present
      if (!data.name || typeof data.name !== 'string') {
        failures.push({ name: agent.name, errors: 'Missing or invalid name field' });
        continue;
      }
      if (!data.description || typeof data.description !== 'string') {
        failures.push({ name: agent.name, errors: 'Missing or invalid description field' });
        continue;
      }

      // Validate against SkillMetadataSchema (agents share the same base schema)
      // .passthrough() ensures agent-specific fields (tools, model) are preserved
      const result = SkillMetadataSchema.safeParse(data);
      if (!result.success) {
        const errors = result.error.issues
          .map(issue => `${issue.path.join('.')}: ${issue.message}`)
          .join('; ');
        failures.push({ name: agent.name, errors });
      }
    }

    if (failures.length > 0) {
      const msg = failures.map(f => `  ${f.name}: ${f.errors}`).join('\n');
      expect.fail(`${failures.length} agent(s) failed validation:\n${msg}`);
    }
  });

  it('should preserve agent-specific fields via passthrough', async () => {
    const agents = await discoverExamples('agents', 'AGENT.md');

    for (const agent of agents) {
      const content = await readFile(agent.path, 'utf-8');
      const { data } = matter(content);
      const result = SkillMetadataSchema.safeParse(data);

      if (result.success) {
        // If agent has 'tools' field, it should be preserved by passthrough
        if (data.tools) {
          expect(
            (result.data as Record<string, unknown>).tools,
            `${agent.name}: tools field not preserved`,
          ).toBeDefined();
        }
      }
    }
  });
});

// ============================================================================
// Edge cases: minimal, legacy, new format, unknown fields
// ============================================================================

describe('Backward Compatibility: Edge Cases', () => {
  it('should pass validation for minimal frontmatter (name + description only)', () => {
    const minimal = { name: 'minimal-skill', description: 'A minimal skill.' };
    const result = SkillMetadataSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('should pass validation for legacy extension fields at root', () => {
    const legacy = {
      name: 'legacy-skill',
      description: 'A legacy skill with root-level extension fields.',
      triggers: { intents: ['test'], threshold: 0.8 },
      enabled: true,
      version: 1,
    };
    const result = SkillMetadataSchema.safeParse(legacy);
    expect(result.success).toBe(true);
  });

  it('should pass validation for new metadata.extensions container format', () => {
    const newFormat = {
      name: 'new-format-skill',
      description: 'Skill using the metadata.extensions container.',
      metadata: {
        extensions: {
          'gsd-skill-creator': {
            triggers: { intents: ['test'] },
            enabled: true,
            version: 2,
          },
        },
      },
    };
    const result = SkillMetadataSchema.safeParse(newFormat);
    expect(result.success).toBe(true);
  });

  it('should pass validation for allowed-tools as array', () => {
    const skill = {
      name: 'array-tools-skill',
      description: 'Skill with allowed-tools as array.',
      'allowed-tools': ['Read', 'Grep', 'Bash'],
    };
    const result = SkillMetadataSchema.safeParse(skill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data['allowed-tools']).toEqual(['Read', 'Grep', 'Bash']);
    }
  });

  it('should pass validation for allowed-tools as space-delimited string', () => {
    const skill = {
      name: 'string-tools-skill',
      description: 'Skill with allowed-tools as string.',
      'allowed-tools': 'Read Grep Bash',
    };
    const result = SkillMetadataSchema.safeParse(skill);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data['allowed-tools']).toEqual(['Read', 'Grep', 'Bash']);
    }
  });

  it('should pass validation for unknown fields via passthrough', () => {
    const skillWithUnknown = {
      name: 'unknown-fields-skill',
      description: 'Skill with unknown extra fields.',
      'custom-field': 'some value',
      'another-thing': 42,
    };
    const result = SkillMetadataSchema.safeParse(skillWithUnknown);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['custom-field']).toBe('some value');
      expect((result.data as Record<string, unknown>)['another-thing']).toBe(42);
    }
  });
});
