import type { SkillIndex } from '../storage/skill-index.js';
import type { SkillStore } from '../storage/skill-store.js';
import { TokenCounter } from './token-counter.js';
import { RelevanceScorer } from './relevance-scorer.js';
import { ConflictResolver } from './conflict-resolver.js';
import { SkillSession, type SkillLoadResult, type SessionReport } from './skill-session.js';
import type { ApplicationConfig, ConflictResult, BudgetProfile, SkippedSkill, BudgetWarning } from '../types/application.js';
import { DEFAULT_CONFIG } from '../types/application.js';
import { SkillPipeline, createEmptyContext } from './skill-pipeline.js';
import { ScoreStage, ResolveStage, LoadStage, BudgetStage, CacheOrderStage, ModelFilterStage } from './stages/index.js';
import { AdaptiveRouter, CorrectionStage } from '../retrieval/index.js';
import type { CorrectionConfig } from '../retrieval/types.js';
import { EmbeddingService } from '../embeddings/embedding-service.js';

/**
 * Optional configuration for enabling retrieval-augmented features.
 * When enabled, AdaptiveRouter selects scoring strategy per query,
 * and CorrectionStage refines low-confidence results.
 */
export interface RetrievalConfig {
  /** Enable adaptive routing + correction (default: false) */
  enabled?: boolean;
  /** Override default correction thresholds */
  correctionConfig?: CorrectionConfig;
}

export interface ApplyResult {
  loaded: string[];
  skipped: string[];
  conflicts: ConflictResult;
  report: SessionReport;
  skippedWithReasons: SkippedSkill[];
  budgetWarnings: BudgetWarning[];
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
  private pipeline: SkillPipeline;
  private budgetProfile?: BudgetProfile;
  private modelProfile?: string;
  private indexed = false;

  constructor(
    private skillIndex: SkillIndex,
    private skillStore: SkillStore,
    config?: Partial<ApplicationConfig>,
    budgetProfile?: BudgetProfile,
    modelProfile?: string,
    retrievalConfig?: RetrievalConfig,
  ) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    this.tokenCounter = new TokenCounter(fullConfig.apiKey);
    this.scorer = new RelevanceScorer();
    this.resolver = new ConflictResolver();
    this.session = new SkillSession(this.tokenCounter, fullConfig);
    this.budgetProfile = budgetProfile;
    this.modelProfile = modelProfile;

    // Pipeline order: Score -> [Correction] -> Resolve -> ModelFilter (conditional) -> CacheOrder -> Budget (conditional) -> Load
    this.pipeline = new SkillPipeline();

    // Score stage: optionally with adaptive routing
    if (retrievalConfig?.enabled) {
      const router = new AdaptiveRouter();
      const embeddingService = EmbeddingService.getInstance();
      this.pipeline.addStage(new ScoreStage(this.skillIndex, this.scorer, router, embeddingService));
    } else {
      this.pipeline.addStage(new ScoreStage(this.skillIndex, this.scorer));
    }

    this.pipeline.addStage(new ResolveStage(this.resolver));

    // Insert correction stage after score if retrieval enabled
    if (retrievalConfig?.enabled) {
      const embeddingService = EmbeddingService.getInstance();
      const correctionStage = new CorrectionStage(
        embeddingService,
        this.scorer,
        retrievalConfig.correctionConfig,
      );
      this.pipeline.insertAfter('score', correctionStage);
    }

    if (modelProfile) {
      this.pipeline.addStage(new ModelFilterStage(this.skillStore));
    }

    this.pipeline.addStage(new CacheOrderStage(this.skillStore));

    if (budgetProfile) {
      this.pipeline.addStage(new BudgetStage(
        this.tokenCounter,
        budgetProfile,
        this.skillStore,
        fullConfig.contextWindowSize
      ));
    }

    this.pipeline.addStage(new LoadStage(this.skillStore, this.session));
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

    const pipelineContext = createEmptyContext({
      intent,
      file,
      context,
      modelProfile: this.modelProfile,
      getReport: () => this.session.getReport(),
    });

    const result = await this.pipeline.process(pipelineContext);

    return {
      loaded: result.loaded,
      skipped: result.skipped,
      conflicts: result.conflicts,
      report: result.getReport(),
      skippedWithReasons: result.budgetSkipped,
      budgetWarnings: result.budgetWarnings,
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

  // Get pipeline for extensibility (insertBefore/insertAfter)
  getPipeline(): SkillPipeline {
    return this.pipeline;
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
