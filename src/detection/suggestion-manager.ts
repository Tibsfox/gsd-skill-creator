import { PatternAnalyzer } from './pattern-analyzer.js';
import { SuggestionStore } from './suggestion-store.js';
import { SkillGenerator, GeneratedSkill } from './skill-generator.js';
import { SkillStore } from '../storage/skill-store.js';
import {
  Suggestion,
  SkillCandidate,
  DetectionConfig,
  DEFAULT_DETECTION_CONFIG,
} from '../types/detection.js';
import { inferDomain, generateSkillId } from '../identifiers/generator.js';
import type { AgentId } from '../identifiers/types.js';
import { DOMAIN_PREFIX_MAP } from '../identifiers/types.js';

export interface DetectionResult {
  newCandidates: number;
  totalPending: number;
  suggestions: Suggestion[];
}

export interface AcceptResult {
  success: boolean;
  skillName?: string;
  error?: string;
}

export class SuggestionManager {
  private analyzer: PatternAnalyzer;
  private store: SuggestionStore;
  private generator: SkillGenerator;

  constructor(
    patternsDir: string = '.planning/patterns',
    skillStore?: SkillStore,
    config?: Partial<DetectionConfig>
  ) {
    this.analyzer = new PatternAnalyzer(config);
    this.store = new SuggestionStore(patternsDir, config);
    this.generator = new SkillGenerator(skillStore ?? new SkillStore());
  }

  /**
   * Run full detection: analyze sessions, store new candidates
   */
  async runDetection(sessionsPath?: string): Promise<DetectionResult> {
    const path = sessionsPath ?? '.planning/patterns/sessions.jsonl';

    // Analyze patterns
    const candidates = await this.analyzer.analyze(path);

    // Filter out already-addressed patterns
    const newCandidates: SkillCandidate[] = [];
    for (const candidate of candidates) {
      const addressed = await this.store.isAddressed(candidate.id);
      if (!addressed) {
        newCandidates.push(candidate);
      }
    }

    // Store new candidates as pending suggestions
    await this.store.addCandidates(newCandidates);

    // Get all pending for return
    const pending = await this.store.getPending();

    return {
      newCandidates: newCandidates.length,
      totalPending: pending.length,
      suggestions: pending,
    };
  }

  /**
   * Get pending suggestions without re-analyzing
   */
  async getPending(): Promise<Suggestion[]> {
    return this.store.getPending();
  }

  /**
   * Preview what skill would be created (for user review)
   */
  previewSkill(candidate: SkillCandidate): GeneratedSkill {
    return this.generator.generateScaffold(candidate);
  }

  /**
   * Accept suggestion: create skill and update state
   */
  async accept(candidateId: string): Promise<AcceptResult> {
    const pending = await this.store.getPending();
    const suggestion = pending.find(s => s.candidate.id === candidateId);

    if (!suggestion) {
      return { success: false, error: 'Suggestion not found or not pending' };
    }

    try {
      const skillName = await this.generator.createFromCandidate(suggestion.candidate);
      const domain = inferDomain(
        suggestion.candidate.suggestedDescription,
        suggestion.candidate.pattern
      );
      const agentId = `${DOMAIN_PREFIX_MAP[domain]}-0` as AgentId;
      const skillId = generateSkillId(agentId, skillName);
      await this.store.transition(candidateId, 'accepted', { createdSkillName: skillName, skillId });
      return { success: true, skillName };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Defer suggestion: will re-surface later
   */
  async defer(candidateId: string): Promise<boolean> {
    const result = await this.store.transition(candidateId, 'deferred');
    return result !== null;
  }

  /**
   * Dismiss suggestion: won't be suggested again
   */
  async dismiss(candidateId: string, reason?: string): Promise<boolean> {
    const result = await this.store.transition(candidateId, 'dismissed', { dismissReason: reason });
    return result !== null;
  }

  /**
   * Get suggestions grouped by state
   */
  async getStats(): Promise<{ pending: number; deferred: number; accepted: number; dismissed: number }> {
    return this.store.getCounts();
  }

  /**
   * Clear dismissed suggestions
   */
  async clearDismissed(): Promise<number> {
    return this.store.clearDismissed();
  }

  /**
   * Get the skill generator for formatting evidence
   */
  getGenerator(): SkillGenerator {
    return this.generator;
  }
}
