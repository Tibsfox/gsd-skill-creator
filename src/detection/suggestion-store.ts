import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import {
  Suggestion,
  SuggestionState,
  SkillCandidate,
  DetectionConfig,
  DEFAULT_DETECTION_CONFIG,
} from '../types/detection.js';

export class SuggestionStore {
  private suggestionsPath: string;
  private config: DetectionConfig;

  constructor(
    patternsDir: string = '.planning/patterns',
    config?: Partial<DetectionConfig>
  ) {
    this.suggestionsPath = join(patternsDir, 'suggestions.json');
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
  }

  /**
   * Load all suggestions from file
   */
  async load(): Promise<Suggestion[]> {
    try {
      const content = await readFile(this.suggestionsPath, 'utf-8');
      return JSON.parse(content) as Suggestion[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      // Corrupted file - return empty and let next save fix it
      console.warn(`Warning: Could not parse suggestions.json, starting fresh`);
      return [];
    }
  }

  /**
   * Save suggestions with atomic write (temp file + rename)
   */
  private async save(suggestions: Suggestion[]): Promise<void> {
    // Ensure parent directory exists
    await mkdir(dirname(this.suggestionsPath), { recursive: true });

    // Write to temp file first
    const tempPath = join(
      tmpdir(),
      `suggestions-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
    );

    await writeFile(tempPath, JSON.stringify(suggestions, null, 2), 'utf-8');
    await rename(tempPath, this.suggestionsPath);
  }

  /**
   * Add new suggestions from candidates (skip duplicates)
   */
  async addCandidates(candidates: SkillCandidate[]): Promise<Suggestion[]> {
    const existing = await this.load();
    const existingIds = new Set(existing.map(s => s.candidate.id));

    const newSuggestions: Suggestion[] = [];
    for (const candidate of candidates) {
      if (!existingIds.has(candidate.id)) {
        newSuggestions.push({
          candidate,
          state: 'pending',
          createdAt: Date.now(),
        });
      }
    }

    if (newSuggestions.length > 0) {
      await this.save([...existing, ...newSuggestions]);
    }

    return newSuggestions;
  }

  /**
   * Get pending suggestions (includes deferred that are due)
   */
  async getPending(): Promise<Suggestion[]> {
    const all = await this.load();
    const now = Date.now();

    return all.filter(s =>
      s.state === 'pending' ||
      (s.state === 'deferred' && s.deferredUntil && s.deferredUntil <= now)
    );
  }

  /**
   * Get all suggestions by state
   */
  async getByState(state: SuggestionState): Promise<Suggestion[]> {
    const all = await this.load();
    return all.filter(s => s.state === state);
  }

  /**
   * Transition suggestion state
   */
  async transition(
    candidateId: string,
    newState: SuggestionState,
    options?: {
      dismissReason?: string;
      createdSkillName?: string;
      skillId?: string;
    }
  ): Promise<Suggestion | null> {
    const all = await this.load();
    const index = all.findIndex(s => s.candidate.id === candidateId);

    if (index === -1) return null;

    const suggestion = all[index];
    suggestion.state = newState;
    suggestion.decidedAt = Date.now();

    if (newState === 'deferred') {
      // Re-surface after deferDays
      suggestion.deferredUntil = Date.now() + (this.config.deferDays * 24 * 60 * 60 * 1000);
    }

    if (options?.dismissReason) {
      suggestion.dismissReason = options.dismissReason;
    }

    if (options?.createdSkillName) {
      suggestion.createdSkillName = options.createdSkillName;
    }

    if (options?.skillId) {
      suggestion.skillId = options.skillId;
    }

    await this.save(all);
    return suggestion;
  }

  /**
   * Clear dismissed suggestions (cleanup)
   */
  async clearDismissed(): Promise<number> {
    const all = await this.load();
    const remaining = all.filter(s => s.state !== 'dismissed');
    const cleared = all.length - remaining.length;

    if (cleared > 0) {
      await this.save(remaining);
    }

    return cleared;
  }

  /**
   * Check if a pattern is already addressed by a suggestion
   * (prevents re-suggesting after dismissal)
   */
  async isAddressed(candidateId: string): Promise<boolean> {
    const all = await this.load();
    return all.some(s =>
      s.candidate.id === candidateId &&
      (s.state === 'accepted' || s.state === 'dismissed')
    );
  }

  /**
   * Get count of suggestions by state
   */
  async getCounts(): Promise<Record<SuggestionState, number>> {
    const all = await this.load();
    const counts: Record<SuggestionState, number> = {
      pending: 0,
      accepted: 0,
      deferred: 0,
      dismissed: 0,
    };

    for (const s of all) {
      counts[s.state]++;
    }

    return counts;
  }
}
