import { readFile, writeFile, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { SkillStore } from './skill-store.js';
import { Skill } from '../types/skill.js';
import { getExtension } from '../types/extensions.js';
import type { SkillScope } from '../types/scope.js';
import { getSkillsBasePath } from '../types/scope.js';

// Index entry with metadata snapshot and mtime for invalidation
export interface SkillIndexEntry {
  name: string;
  description: string;
  enabled: boolean;
  triggers?: {
    intents?: string[];
    files?: string[];
    contexts?: string[];
  };
  events?: {
    emits?: string[];
    listens?: string[];
  };
  path: string;
  mtime: number;  // File modification time for cache invalidation
}

export interface SkillIndexData {
  version: number;
  buildTime: string;
  entries: SkillIndexEntry[];
}

/**
 * Extended skill entry with scope and conflict information.
 * Used for multi-scope listing to show which scope each skill belongs to
 * and whether there's a name conflict across scopes.
 */
export interface ScopedSkillEntry extends SkillIndexEntry {
  scope: SkillScope;
  hasConflict?: boolean;  // Same name exists at other scope
}

export class SkillIndex {
  private indexPath: string;
  private entries: Map<string, SkillIndexEntry> = new Map();
  private loaded = false;

  constructor(
    private skillStore: SkillStore,
    private skillsDir: string = '.claude/skills'
  ) {
    this.indexPath = join(skillsDir, '.skill-index.json');
  }

  /**
   * Build an index entry from a skill, using getExtension accessor
   * for format-agnostic access to extension fields.
   */
  private buildEntry(skill: Skill, skillPath: string, mtime: number): SkillIndexEntry {
    const ext = getExtension(skill.metadata);
    const events = ext.events ? {
      emits: ext.events.emits,
      listens: ext.events.listens,
    } : undefined;
    return {
      name: skill.metadata.name,
      description: skill.metadata.description,
      enabled: ext.enabled ?? true,
      triggers: ext.triggers ? {
        intents: ext.triggers.intents,
        files: ext.triggers.files,
        contexts: ext.triggers.contexts,
      } : undefined,
      events,
      path: skillPath,
      mtime,
    };
  }

  // Load index from disk or rebuild if missing/stale
  async load(): Promise<void> {
    try {
      const content = await readFile(this.indexPath, 'utf-8');
      const data: SkillIndexData = JSON.parse(content);

      // Load entries into map
      this.entries.clear();
      for (const entry of data.entries) {
        this.entries.set(entry.name, entry);
      }

      this.loaded = true;
    } catch {
      // Index doesn't exist or is corrupted, rebuild
      await this.rebuild();
    }
  }

  // Save index to disk
  async save(): Promise<void> {
    const data: SkillIndexData = {
      version: 1,
      buildTime: new Date().toISOString(),
      entries: Array.from(this.entries.values()),
    };

    // Ensure directory exists
    await mkdir(dirname(this.indexPath), { recursive: true });

    await writeFile(this.indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Full rebuild of index from skill files
  async rebuild(): Promise<void> {
    this.entries.clear();

    const skillNames = await this.skillStore.list();

    for (const skillName of skillNames) {
      try {
        const skill = await this.skillStore.read(skillName);
        const skillPath = join(this.skillsDir, skillName, 'SKILL.md');
        const stats = await stat(skillPath);

        const entry = this.buildEntry(skill, skillPath, stats.mtimeMs);
        this.entries.set(skillName, entry);
      } catch (err) {
        // Skip skills that fail to parse
        console.warn(`Skipping skill ${skillName}:`, err);
      }
    }

    await this.save();
    this.loaded = true;
  }

  // Check if a specific entry needs update (mtime changed)
  private async needsUpdate(entry: SkillIndexEntry): Promise<boolean> {
    try {
      const stats = await stat(entry.path);
      return stats.mtimeMs !== entry.mtime;
    } catch {
      // File doesn't exist anymore
      return true;
    }
  }

  // Refresh stale entries without full rebuild
  async refresh(): Promise<void> {
    if (!this.loaded) {
      await this.load();
      return;
    }

    // Check for stale entries
    for (const [skillName, entry] of this.entries) {
      if (await this.needsUpdate(entry)) {
        // Re-read skill and update entry
        try {
          const skill = await this.skillStore.read(skillName);
          const stats = await stat(entry.path);

          const updatedEntry = this.buildEntry(skill, entry.path, stats.mtimeMs);
          this.entries.set(skillName, updatedEntry);
        } catch {
          // Skill was deleted, remove from index
          this.entries.delete(skillName);
        }
      }
    }

    // Check for new skills not in index
    const skillNames = await this.skillStore.list();
    for (const skillName of skillNames) {
      if (!this.entries.has(skillName)) {
        const skill = await this.skillStore.read(skillName);
        const skillPath = join(this.skillsDir, skillName, 'SKILL.md');
        const stats = await stat(skillPath);

        const newEntry = this.buildEntry(skill, skillPath, stats.mtimeMs);
        this.entries.set(skillName, newEntry);
      }
    }

    await this.save();
  }

  // Get all index entries (calls refresh first)
  async getAll(): Promise<SkillIndexEntry[]> {
    await this.refresh();
    return Array.from(this.entries.values());
  }

  // Get enabled skills only
  async getEnabled(): Promise<SkillIndexEntry[]> {
    const all = await this.getAll();
    return all.filter(entry => entry.enabled);
  }

  // Search by name or description (simple substring match)
  async search(query: string): Promise<SkillIndexEntry[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return all.filter(entry =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery)
    );
  }

  // Find skills matching trigger patterns
  async findByTrigger(
    intent?: string,
    file?: string,
    context?: string
  ): Promise<SkillIndexEntry[]> {
    const enabled = await this.getEnabled();

    return enabled.filter(entry => {
      if (!entry.triggers) return false;

      // Check intent patterns (regex match)
      if (intent && entry.triggers.intents) {
        const matches = entry.triggers.intents.some(pattern => {
          try {
            return new RegExp(pattern, 'i').test(intent);
          } catch {
            return intent.toLowerCase().includes(pattern.toLowerCase());
          }
        });
        if (matches) return true;
      }

      // Check file patterns (glob-like, simplified)
      if (file && entry.triggers.files) {
        const matches = entry.triggers.files.some(pattern => {
          // Simple glob: * matches anything
          const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
          );
          return regex.test(file);
        });
        if (matches) return true;
      }

      // Check context patterns (substring match)
      if (context && entry.triggers.contexts) {
        const matches = entry.triggers.contexts.some(pattern =>
          context.toLowerCase().includes(pattern.toLowerCase())
        );
        if (matches) return true;
      }

      return false;
    });
  }
}

/**
 * List skills from all scopes (user and project) with conflict detection.
 *
 * This standalone function creates separate stores for each scope and
 * combines results with scope and conflict information.
 *
 * @returns Array of ScopedSkillEntry from both user and project scopes
 */
export async function listAllScopes(): Promise<ScopedSkillEntry[]> {
  const userDir = getSkillsBasePath('user');
  const projectDir = getSkillsBasePath('project');

  // Create separate stores for each scope
  const userStore = new SkillStore(userDir);
  const projectStore = new SkillStore(projectDir);

  const userIndex = new SkillIndex(userStore, userDir);
  const projectIndex = new SkillIndex(projectStore, projectDir);

  // Load both indexes in parallel
  const [userSkills, projectSkills] = await Promise.all([
    userIndex.getAll(),
    projectIndex.getAll(),
  ]);

  // Build name sets for conflict detection
  const userNames = new Set(userSkills.map(s => s.name));
  const projectNames = new Set(projectSkills.map(s => s.name));

  // Combine with scope and conflict info
  const result: ScopedSkillEntry[] = [
    ...userSkills.map(s => ({
      ...s,
      scope: 'user' as const,
      hasConflict: projectNames.has(s.name),
    })),
    ...projectSkills.map(s => ({
      ...s,
      scope: 'project' as const,
      hasConflict: userNames.has(s.name),
    })),
  ];

  return result;
}
