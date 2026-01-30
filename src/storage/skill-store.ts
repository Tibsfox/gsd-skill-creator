import matter from 'gray-matter';
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { Skill, SkillMetadata, validateSkillMetadata } from '../types/skill.js';

export class SkillStore {
  constructor(private skillsDir: string = '.claude/skills') {}

  // Create a new skill
  async create(skillName: string, metadata: SkillMetadata, body: string): Promise<Skill> {
    // Validate metadata
    const errors = validateSkillMetadata(metadata);
    if (errors.length > 0) {
      throw new Error(`Invalid skill metadata: ${errors.join(', ')}`);
    }

    // Add timestamps
    const now = new Date().toISOString();
    const fullMetadata: SkillMetadata = {
      ...metadata,
      enabled: metadata.enabled ?? true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const skillDir = join(this.skillsDir, skillName);
    const skillPath = join(skillDir, 'SKILL.md');

    // Ensure directory exists
    await mkdir(skillDir, { recursive: true });

    // Create frontmatter content using gray-matter
    const content = matter.stringify(body, fullMetadata);

    await writeFile(skillPath, content, 'utf-8');

    return {
      metadata: fullMetadata,
      body: body.trim(),
      path: skillPath,
    };
  }

  // Read a skill by name
  async read(skillName: string): Promise<Skill> {
    const skillPath = join(this.skillsDir, skillName, 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8');

    const { data, content: body } = matter(content);

    return {
      metadata: data as SkillMetadata,
      body: body.trim(),
      path: skillPath,
    };
  }

  // Update an existing skill
  async update(skillName: string, updates: Partial<SkillMetadata>, newBody?: string): Promise<Skill> {
    const existing = await this.read(skillName);

    const updatedMetadata: SkillMetadata = {
      ...existing.metadata,
      ...updates,
      version: (existing.metadata.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated metadata
    const errors = validateSkillMetadata(updatedMetadata);
    if (errors.length > 0) {
      throw new Error(`Invalid skill metadata: ${errors.join(', ')}`);
    }

    const body = newBody ?? existing.body;
    const content = matter.stringify(body, updatedMetadata);

    await writeFile(existing.path, content, 'utf-8');

    return {
      metadata: updatedMetadata,
      body: body.trim(),
      path: existing.path,
    };
  }

  // Delete a skill
  async delete(skillName: string): Promise<void> {
    const skillDir = join(this.skillsDir, skillName);
    const skillPath = join(skillDir, 'SKILL.md');

    // Remove SKILL.md file
    await unlink(skillPath);

    // Note: Directory left in place (may contain reference.md, scripts/)
    // Full cleanup would require rmdir, but that's more destructive
  }

  // List all skill names
  async list(): Promise<string[]> {
    try {
      const entries = await readdir(this.skillsDir, { withFileTypes: true });

      const skillNames: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // Check if SKILL.md exists
          const skillPath = join(this.skillsDir, entry.name, 'SKILL.md');
          try {
            await stat(skillPath);
            skillNames.push(entry.name);
          } catch {
            // No SKILL.md, skip
          }
        }
      }

      return skillNames;
    } catch (err) {
      // Skills directory doesn't exist yet
      return [];
    }
  }

  // Check if a skill exists
  async exists(skillName: string): Promise<boolean> {
    const skillPath = join(this.skillsDir, skillName, 'SKILL.md');
    try {
      await stat(skillPath);
      return true;
    } catch {
      return false;
    }
  }
}
