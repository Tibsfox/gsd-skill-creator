import matter from 'gray-matter';
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { Skill, SkillMetadata, validateSkillMetadata } from '../types/skill.js';
import { validateSkillNameStrict, suggestFixedName, validateReservedName } from '../validation/skill-validation.js';
import {
  getExtension,
  isLegacyFormat,
  hasExtensionData,
  type GsdSkillCreatorExtension,
} from '../types/extensions.js';
import type { OfficialSkillMetadata } from '../types/skill.js';

/**
 * Normalize metadata to official Claude Code format for writing to disk.
 * Extension fields are moved under metadata.extensions['gsd-skill-creator'].
 * Empty extension containers are not written.
 */
function normalizeForWrite(metadata: SkillMetadata): OfficialSkillMetadata {
  // Extract extension data from either location
  const ext = getExtension(metadata);

  // Build official metadata (without legacy fields at root)
  const official: OfficialSkillMetadata = {
    name: metadata.name,
    description: metadata.description,
  };

  // Add optional official fields only if defined
  if (metadata['disable-model-invocation'] !== undefined) {
    official['disable-model-invocation'] = metadata['disable-model-invocation'];
  }
  if (metadata['user-invocable'] !== undefined) {
    official['user-invocable'] = metadata['user-invocable'];
  }
  if (metadata['allowed-tools']) {
    official['allowed-tools'] = metadata['allowed-tools'];
  }
  if (metadata['argument-hint']) {
    official['argument-hint'] = metadata['argument-hint'];
  }
  if (metadata.model) {
    official.model = metadata.model;
  }
  if (metadata.context) {
    official.context = metadata.context;
  }
  if (metadata.agent) {
    official.agent = metadata.agent;
  }
  if (metadata.hooks) {
    official.hooks = metadata.hooks;
  }

  // Add extension container only if there's data
  if (hasExtensionData(ext)) {
    official.metadata = {
      extensions: {
        'gsd-skill-creator': ext,
      },
    };
  }

  return official;
}

export class SkillStore {
  constructor(private skillsDir: string = '.claude/skills') {}

  // Create a new skill
  async create(skillName: string, metadata: SkillMetadata, body: string): Promise<Skill> {
    // Validate skill name against official Claude Code specification
    const nameValidation = validateSkillNameStrict(skillName);
    if (!nameValidation.valid) {
      const suggestion = nameValidation.suggestion;
      const errorMsg = suggestion
        ? `Invalid skill name "${skillName}": ${nameValidation.errors.join('; ')}. Suggestion: "${suggestion}"`
        : `Invalid skill name "${skillName}": ${nameValidation.errors.join('; ')}`;
      throw new Error(errorMsg);
    }

    // Check for reserved names (fallback protection - workflow should check first)
    // Skip if forceOverrideReservedName is set (user already confirmed override in workflow)
    const existingExtForCheck = getExtension(metadata);
    if (!existingExtForCheck.forceOverrideReservedName) {
      const reservedCheck = await validateReservedName(skillName);
      if (!reservedCheck.valid) {
        throw new Error(reservedCheck.error);
      }
    }

    // Validate that skillName matches metadata.name if provided
    if (metadata.name && metadata.name !== skillName) {
      throw new Error(
        `Skill name mismatch: skillName parameter "${skillName}" does not match metadata.name "${metadata.name}". ` +
        `These must be identical.`
      );
    }

    // Validate metadata structure
    const errors = validateSkillMetadata(metadata);
    if (errors.length > 0) {
      throw new Error(`Invalid skill metadata: ${errors.join(', ')}`);
    }

    const now = new Date().toISOString();

    // Build extension data, merging any provided extension fields
    const existingExt = getExtension(metadata);
    const fullExt: GsdSkillCreatorExtension = {
      ...existingExt,
      enabled: existingExt.enabled ?? true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Build full metadata for internal use (new format)
    const fullMetadata: SkillMetadata = {
      name: metadata.name,
      description: metadata.description,
      'disable-model-invocation': metadata['disable-model-invocation'],
      'user-invocable': metadata['user-invocable'],
      'allowed-tools': metadata['allowed-tools'],
      'argument-hint': metadata['argument-hint'],
      model: metadata.model,
      context: metadata.context,
      agent: metadata.agent,
      hooks: metadata.hooks,
      metadata: {
        extensions: {
          'gsd-skill-creator': fullExt,
        },
      },
    };

    // Log if migrating from legacy format
    if (isLegacyFormat(metadata)) {
      console.info(`Migrating skill "${skillName}" to new metadata format`);
    }

    // Normalize for disk (new format, no legacy fields at root)
    const diskMetadata = normalizeForWrite(fullMetadata);

    const skillDir = join(this.skillsDir, skillName);
    const skillPath = join(skillDir, 'SKILL.md');

    // Ensure directory exists
    await mkdir(skillDir, { recursive: true });

    // Create frontmatter content using gray-matter
    const content = matter.stringify(body, diskMetadata);

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
    const existingExt = getExtension(existing.metadata);
    const updateExt = getExtension(updates);

    // Merge extension data from existing and updates
    const mergedExt: GsdSkillCreatorExtension = {
      ...existingExt,
      ...updateExt,
      version: (existingExt.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    // Build full updated metadata (new format)
    const updatedMetadata: SkillMetadata = {
      name: updates.name ?? existing.metadata.name,
      description: updates.description ?? existing.metadata.description,
      'disable-model-invocation': updates['disable-model-invocation'] ?? existing.metadata['disable-model-invocation'],
      'user-invocable': updates['user-invocable'] ?? existing.metadata['user-invocable'],
      'allowed-tools': updates['allowed-tools'] ?? existing.metadata['allowed-tools'],
      'argument-hint': updates['argument-hint'] ?? existing.metadata['argument-hint'],
      model: updates.model ?? existing.metadata.model,
      context: updates.context ?? existing.metadata.context,
      agent: updates.agent ?? existing.metadata.agent,
      hooks: updates.hooks ?? existing.metadata.hooks,
      metadata: {
        extensions: {
          'gsd-skill-creator': mergedExt,
        },
      },
    };

    // Validate updated metadata
    const errors = validateSkillMetadata(updatedMetadata);
    if (errors.length > 0) {
      throw new Error(`Invalid skill metadata: ${errors.join(', ')}`);
    }

    // Log if migrating from legacy format
    if (isLegacyFormat(existing.metadata)) {
      console.info(`Migrating skill "${skillName}" to new metadata format`);
    }

    // Normalize for disk (new format, no legacy fields at root)
    const diskMetadata = normalizeForWrite(updatedMetadata);

    const body = newBody ?? existing.body;
    const content = matter.stringify(body, diskMetadata);

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

  /**
   * List all skills with their format indicator.
   *
   * Returns both current (subdirectory) and legacy (flat file) skills,
   * with metadata about their format for migration purposes.
   *
   * @returns Array of skill info objects with name, format, and path
   */
  async listWithFormat(): Promise<{ name: string; format: 'current' | 'legacy'; path: string }[]> {
    const results: { name: string; format: 'current' | 'legacy'; path: string }[] = [];

    try {
      const entries = await readdir(this.skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        if (entry.isDirectory()) {
          // Check for current subdirectory format
          const skillPath = join(this.skillsDir, entry.name, 'SKILL.md');
          try {
            await stat(skillPath);
            results.push({
              name: entry.name,
              format: 'current',
              path: skillPath,
            });
          } catch {
            // Directory without SKILL.md - not a valid skill
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Check for legacy flat-file format
          const skillPath = join(this.skillsDir, entry.name);
          const name = entry.name.replace(/\.md$/, '');
          results.push({
            name,
            format: 'legacy',
            path: skillPath,
          });
        }
      }
    } catch {
      // Skills directory doesn't exist yet
    }

    return results;
  }

  /**
   * Check if there are any legacy flat-file skills in the skills directory.
   *
   * @returns true if at least one legacy skill exists
   */
  async hasLegacySkills(): Promise<boolean> {
    try {
      const entries = await readdir(this.skillsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;

        // Check for .md files directly in skillsDir (not in subdirectories)
        if (entry.isFile() && entry.name.endsWith('.md')) {
          return true;
        }
      }
    } catch {
      // Skills directory doesn't exist
    }

    return false;
  }
}
