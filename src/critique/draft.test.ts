import { describe, it, expect } from 'vitest';
import { loadDraft } from './draft.js';

// ============================================================================
// Helpers
// ============================================================================

function makeFS(files: Record<string, string>): {
  readFile: (p: string) => Promise<string>;
  readDir: (p: string) => Promise<string[]>;
} {
  const store = new Map(Object.entries(files));
  return {
    readFile: async (p: string) => {
      const content = store.get(p);
      if (content === undefined) throw new Error(`Not found: ${p}`);
      return content;
    },
    readDir: async (p: string) => {
      return [...store.keys()]
        .filter((k) => k.startsWith(p + '/'))
        .map((k) => k.slice(p.length + 1));
    },
  };
}

const VALID_SKILL_MD = `---
name: my-skill
description: A test skill for unit tests
requires-critique: false
---

# My Skill

Use when working on test scenarios.

## Steps

1. Analyze the input
2. Produce output
`;

// ============================================================================
// Tests
// ============================================================================

describe('loadDraft', () => {
  it('reads SKILL.md, parses frontmatter, populates body', async () => {
    const skillDir = '/skills/my-skill';
    const deps = makeFS({ [`${skillDir}/SKILL.md`]: VALID_SKILL_MD });

    const draft = await loadDraft(skillDir, deps);

    expect(draft.skillName).toBe('my-skill');
    expect(draft.skillDir).toBe(skillDir);
    expect(draft.body).toContain('# My Skill');
    expect(draft.metadata['name']).toBe('my-skill');
    expect(draft.metadata['description']).toBe('A test skill for unit tests');
  });

  it('surfaces missing SKILL.md as a clear error', async () => {
    const skillDir = '/skills/missing-skill';
    const deps = makeFS({}); // empty FS

    await expect(loadDraft(skillDir, deps)).rejects.toThrow(/SKILL\.md/i);
  });

  it('populates files map with additional files in the skill directory', async () => {
    const skillDir = '/skills/my-skill';
    const deps = makeFS({
      [`${skillDir}/SKILL.md`]: VALID_SKILL_MD,
      [`${skillDir}/rules/rule-1.md`]: '# Rule 1\nAlways be consistent.',
    });

    const draft = await loadDraft(skillDir, deps);
    expect(draft.files.size).toBeGreaterThanOrEqual(1);
  });

  it('skill name comes from frontmatter name field', async () => {
    const skillDir = '/skills/anything';
    const deps = makeFS({ [`${skillDir}/SKILL.md`]: VALID_SKILL_MD });
    const draft = await loadDraft(skillDir, deps);
    expect(draft.skillName).toBe('my-skill');
  });
});
