import { describe, it, expect } from 'vitest';
import { readFile, readdir, stat } from 'fs/promises';
import { basename, join } from 'path';
import matter from 'gray-matter';
import { SkillMetadataSchema } from './skill-validation.js';

// Path relative to project root (vitest runs from project root)
const EXAMPLES_DIR = join(__dirname, '..', '..', 'examples');

// ============================================================================
// Helper: Discover example directories
// ============================================================================

// Walks the examples subtree and returns every directory containing the target
// file. This is layout-agnostic: it handles both the original flat layout
// (examples/skills/<name>/SKILL.md) and the category-first layout introduced
// during the departments reorg (examples/skills/<category>/<name>/SKILL.md).
// As soon as a directory contains the target file, we record it and stop
// descending — a skill's own subfolders (scripts/, references/, etc.) are
// never mistaken for nested skills.
async function discoverExamples(subdir: string, filename: string): Promise<{ name: string; path: string }[]> {
  const root = join(EXAMPLES_DIR, subdir);
  const examples: { name: string; path: string }[] = [];

  async function walk(currentDir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(currentDir);
    } catch {
      return;
    }

    if (entries.includes(filename)) {
      examples.push({ name: basename(currentDir), path: join(currentDir, filename) });
      return;
    }

    for (const entry of entries) {
      const entryPath = join(currentDir, entry);
      let entryStat;
      try {
        entryStat = await stat(entryPath);
      } catch {
        continue;
      }
      if (entryStat.isDirectory()) {
        await walk(entryPath);
      }
    }
  }

  await walk(root);
  return examples;
}

// ============================================================================
// Skills backward compatibility
// ============================================================================

describe('Backward Compatibility: Example Skills', () => {
  // The examples library grows over time as new skills are imported (see
  // tools/import-filesystem-skills.ts). This test guards that the baseline
  // set (31 skills as of v1.49.192) is never removed, without failing
  // every time a new skill is added. Every skill still has to validate
  // against the schema in the next test.
  const BASELINE_SKILL_COUNT = 31;

  it('should discover at least the baseline example skills', async () => {
    const skills = await discoverExamples('skills', 'SKILL.md');
    expect(skills.length).toBeGreaterThanOrEqual(BASELINE_SKILL_COUNT);
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
  // Same growth-friendly pattern as skills above. Baseline was 22 agents
  // as of v1.49.192; new agents can be added without breaking this test
  // as long as the schema validation below still passes for every one.
  const BASELINE_AGENT_COUNT = 22;

  it('should discover at least the baseline example agents', async () => {
    const agents = await discoverExamples('agents', 'AGENT.md');
    expect(agents.length).toBeGreaterThanOrEqual(BASELINE_AGENT_COUNT);
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
