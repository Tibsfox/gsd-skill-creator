import type { ConflictResult, ScoredSkill } from '../types/application.js';
import type { SkillIndexEntry } from '../storage/skill-index.js';

export class ConflictResolver {
  // Detect overlapping triggers between skills
  detectConflicts(skills: SkillIndexEntry[]): ConflictResult {
    const intentMap = new Map<string, string[]>();
    const fileMap = new Map<string, string[]>();
    const contextMap = new Map<string, string[]>();

    for (const skill of skills) {
      if (!skill.triggers) continue;

      for (const intent of skill.triggers.intents ?? []) {
        const existing = intentMap.get(intent) ?? [];
        existing.push(skill.name);
        intentMap.set(intent, existing);
      }

      for (const file of skill.triggers.files ?? []) {
        const existing = fileMap.get(file) ?? [];
        existing.push(skill.name);
        fileMap.set(file, existing);
      }

      for (const context of skill.triggers.contexts ?? []) {
        const existing = contextMap.get(context) ?? [];
        existing.push(skill.name);
        contextMap.set(context, existing);
      }
    }

    const conflicts = new Set<string>();

    for (const [, skillNames] of intentMap) {
      if (skillNames.length > 1) {
        skillNames.forEach(name => conflicts.add(name));
      }
    }

    for (const [, skillNames] of fileMap) {
      if (skillNames.length > 1) {
        skillNames.forEach(name => conflicts.add(name));
      }
    }

    for (const [, skillNames] of contextMap) {
      if (skillNames.length > 1) {
        skillNames.forEach(name => conflicts.add(name));
      }
    }

    if (conflicts.size === 0) {
      return {
        hasConflict: false,
        conflictingSkills: [],
        resolution: 'priority',
      };
    }

    return {
      hasConflict: true,
      conflictingSkills: Array.from(conflicts),
      resolution: 'priority',
    };
  }

  // Resolve conflicts by priority (highest score wins)
  resolveByPriority(
    scoredSkills: ScoredSkill[],
    maxSkills: number = 3
  ): ScoredSkill[] {
    return scoredSkills.slice(0, maxSkills);
  }

  // Resolve by selecting non-overlapping skills
  resolveNonOverlapping(
    skills: SkillIndexEntry[],
    scoredSkills: ScoredSkill[],
    maxSkills: number = 3
  ): ScoredSkill[] {
    const skillMap = new Map(skills.map(s => [s.name, s]));
    const selected: ScoredSkill[] = [];
    const usedIntents = new Set<string>();
    const usedFiles = new Set<string>();
    const usedContexts = new Set<string>();

    for (const scored of scoredSkills) {
      if (selected.length >= maxSkills) break;

      const skill = skillMap.get(scored.name);
      if (!skill?.triggers) {
        selected.push(scored);
        continue;
      }

      let overlaps = false;

      for (const intent of skill.triggers.intents ?? []) {
        if (usedIntents.has(intent)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        for (const file of skill.triggers.files ?? []) {
          if (usedFiles.has(file)) {
            overlaps = true;
            break;
          }
        }
      }

      if (!overlaps) {
        for (const context of skill.triggers.contexts ?? []) {
          if (usedContexts.has(context)) {
            overlaps = true;
            break;
          }
        }
      }

      if (!overlaps) {
        selected.push(scored);
        (skill.triggers.intents ?? []).forEach(i => usedIntents.add(i));
        (skill.triggers.files ?? []).forEach(f => usedFiles.add(f));
        (skill.triggers.contexts ?? []).forEach(c => usedContexts.add(c));
      }
    }

    return selected;
  }

  // Get conflict details for logging/debugging
  getConflictDetails(skills: SkillIndexEntry[]): Map<string, string[]> {
    const details = new Map<string, string[]>();

    for (const skill of skills) {
      if (!skill.triggers) continue;

      for (const intent of skill.triggers.intents ?? []) {
        const key = `intent:${intent}`;
        const existing = details.get(key) ?? [];
        existing.push(skill.name);
        details.set(key, existing);
      }
    }

    for (const [key, names] of details) {
      if (names.length < 2) {
        details.delete(key);
      }
    }

    return details;
  }
}
