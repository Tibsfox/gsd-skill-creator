/**
 * draft.ts — load a skill from disk into an in-memory SkillDraft.
 */

import type { SkillDraft } from './types.js';

export interface LoadDraftDeps {
  readFile: (p: string) => Promise<string>;
  readDir?: (p: string) => Promise<string[]>;
}

/**
 * Load a skill directory into a SkillDraft.
 *
 * Reads SKILL.md, parses frontmatter via gray-matter, populates metadata, body,
 * and files map. Skill name comes from frontmatter `name` field.
 */
export async function loadDraft(
  skillDir: string,
  deps: LoadDraftDeps,
): Promise<SkillDraft> {
  const { readFile, readDir } = deps;

  // Read SKILL.md — surface a clear error if missing
  let rawSkill: string;
  try {
    rawSkill = await readFile(`${skillDir}/SKILL.md`);
  } catch (err) {
    throw new Error(
      `Could not load SKILL.md from ${skillDir}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Parse frontmatter — use dynamic import to match validate.ts pattern
  const matter = (await import('gray-matter')).default;
  const parsed = matter(rawSkill);

  const metadata = parsed.data as Record<string, unknown>;
  const body = rawSkill; // full SKILL.md including frontmatter

  // Skill name from frontmatter
  const skillName = typeof metadata['name'] === 'string' ? metadata['name'] : skillDir.split('/').pop() ?? 'unknown';

  // Populate files map with additional skill files
  const files = new Map<string, string>();
  files.set('SKILL.md', rawSkill);

  if (readDir) {
    try {
      const entries = await readDir(skillDir);
      for (const entry of entries) {
        if (entry === 'SKILL.md') continue; // already loaded
        try {
          const content = await readFile(`${skillDir}/${entry}`);
          files.set(entry, content);
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // readDir failure is non-fatal
    }
  }

  return {
    skillName,
    skillDir,
    body,
    metadata,
    files,
  };
}
