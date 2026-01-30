import type { SkillIndex, SkillIndexEntry } from '../storage/skill-index.js';
import type { SkillStore } from '../storage/skill-store.js';
import { TokenCounter } from './token-counter.js';
import { RelevanceScorer } from './relevance-scorer.js';
import { ConflictResolver } from './conflict-resolver.js';
import { SkillSession, type SkillLoadResult, type SessionReport } from './skill-session.js';
import type { ScoredSkill, ApplicationConfig, ConflictResult } from '../types/application.js';
import { DEFAULT_CONFIG } from '../types/application.js';

export interface ApplyResult {
  loaded: string[];
  skipped: string[];
  conflicts: ConflictResult;
  report: SessionReport;
}

export interface InvokeResult {
  success: boolean;
  skillName: string;
  content?: string;
  error?: string;
  loadResult?: SkillLoadResult;
}

export class SkillApplicator {
  private tokenCounter: TokenCounter;
  private scorer: RelevanceScorer;
  private resolver: ConflictResolver;
  private session: SkillSession;
  private indexed = false;

  constructor(
    private skillIndex: SkillIndex,
    private skillStore: SkillStore,
    config?: Partial<ApplicationConfig>
  ) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    this.tokenCounter = new TokenCounter(fullConfig.apiKey);
    this.scorer = new RelevanceScorer();
    this.resolver = new ConflictResolver();
    this.session = new SkillSession(this.tokenCounter, fullConfig);
  }

  // Initialize by indexing all enabled skills
  async initialize(): Promise<void> {
    const skills = await this.skillIndex.getEnabled();
    this.scorer.indexSkills(skills);
    this.indexed = true;
  }

  // Auto-apply relevant skills based on context (APPLY-01)
  async apply(
    intent?: string,
    file?: string,
    context?: string
  ): Promise<ApplyResult> {
    if (!this.indexed) {
      await this.initialize();
    }

    const loaded: string[] = [];
    const skipped: string[] = [];

    const matches = await this.skillIndex.findByTrigger(intent, file, context);

    if (matches.length === 0) {
      return {
        loaded,
        skipped,
        conflicts: { hasConflict: false, conflictingSkills: [], resolution: 'priority' },
        report: this.session.getReport(),
      };
    }

    const query = [intent, context].filter(Boolean).join(' ');
    let scoredSkills: ScoredSkill[] = [];

    if (query) {
      scoredSkills = this.scorer.scoreAgainstQuery(query);
      const matchNames = new Set(matches.map(m => m.name));
      scoredSkills = scoredSkills.filter(s => matchNames.has(s.name));
    } else {
      scoredSkills = matches.map(m => ({ name: m.name, score: 1, matchType: 'file' as const }));
    }

    const conflicts = this.resolver.detectConflicts(matches);
    const resolved = this.resolver.resolveByPriority(scoredSkills);

    for (const scored of resolved) {
      if (this.session.isActive(scored.name)) {
        continue;
      }

      try {
        const skill = await this.skillStore.read(scored.name);
        const estimatedSavings = skill.body.length * 2;

        const result = await this.session.load(
          scored.name,
          skill.body,
          scored.score,
          estimatedSavings
        );

        if (result.success) {
          loaded.push(scored.name);
        } else {
          skipped.push(scored.name);
        }
      } catch {
        skipped.push(scored.name);
      }
    }

    return {
      loaded,
      skipped,
      conflicts,
      report: this.session.getReport(),
    };
  }

  // Manually invoke a specific skill (APPLY-03)
  async invoke(skillName: string): Promise<InvokeResult> {
    if (this.session.isActive(skillName)) {
      const content = this.session.getSkillContent(skillName);
      return {
        success: true,
        skillName,
        content,
      };
    }

    try {
      const skill = await this.skillStore.read(skillName);
      const estimatedSavings = skill.body.length * 2;

      const loadResult = await this.session.load(
        skillName,
        skill.body,
        100,
        estimatedSavings
      );

      if (loadResult.success) {
        return {
          success: true,
          skillName,
          content: skill.body,
          loadResult,
        };
      } else {
        return {
          success: false,
          skillName,
          error: `Could not load skill: ${loadResult.reason}`,
          loadResult,
        };
      }
    } catch {
      return {
        success: false,
        skillName,
        error: `Skill not found: ${skillName}`,
      };
    }
  }

  // Get current session state
  getSession(): SkillSession {
    return this.session;
  }

  // Get session report
  getReport(): SessionReport {
    return this.session.getReport();
  }

  // Get active skills display (APPLY-05)
  getActiveDisplay(): string {
    return this.session.formatActiveSkillsDisplay();
  }

  // Unload a skill
  unload(skillName: string): boolean {
    return this.session.unload(skillName);
  }

  // Clear all active skills
  clear(): void {
    this.session.clear();
  }

  // Re-index skills (call after skills are modified)
  async reindex(): Promise<void> {
    const skills = await this.skillIndex.getEnabled();
    this.scorer.indexSkills(skills);
  }
}
