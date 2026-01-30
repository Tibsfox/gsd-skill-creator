import { readFile, writeFile, stat, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { SkillStore } from './skill-store.js';
import { SkillMetadata } from '../types/skill.js';

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
  path: string;
  mtime: number;  // File modification time for cache invalidation
}

export interface SkillIndexData {
  version: number;
  buildTime: string;
  entries: SkillIndexEntry[];
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

        const entry: SkillIndexEntry = {
          name: skill.metadata.name,
          description: skill.metadata.description,
          enabled: skill.metadata.enabled ?? true,
          triggers: skill.metadata.triggers ? {
            intents: skill.metadata.triggers.intents,
            files: skill.metadata.triggers.files,
            contexts: skill.metadata.triggers.contexts,
          } : undefined,
          path: skillPath,
          mtime: stats.mtimeMs,
        };

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

          this.entries.set(skillName, {
            name: skill.metadata.name,
            description: skill.metadata.description,
            enabled: skill.metadata.enabled ?? true,
            triggers: skill.metadata.triggers ? {
              intents: skill.metadata.triggers.intents,
              files: skill.metadata.triggers.files,
              contexts: skill.metadata.triggers.contexts,
            } : undefined,
            path: entry.path,
            mtime: stats.mtimeMs,
          });
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

        this.entries.set(skillName, {
          name: skill.metadata.name,
          description: skill.metadata.description,
          enabled: skill.metadata.enabled ?? true,
          triggers: skill.metadata.triggers ? {
            intents: skill.metadata.triggers.intents,
            files: skill.metadata.triggers.files,
            contexts: skill.metadata.triggers.contexts,
          } : undefined,
          path: skillPath,
          mtime: stats.mtimeMs,
        });
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
