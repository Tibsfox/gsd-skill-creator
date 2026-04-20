import type { SkillIndex } from '../storage/skill-index.js';
import type { SkillStore } from '../storage/skill-store.js';
import { TokenCounter } from './token-counter.js';
import { RelevanceScorer } from './relevance-scorer.js';
import { ConflictResolver } from './conflict-resolver.js';
import { SkillSession, type SkillLoadResult, type SessionReport } from './skill-session.js';
import type { ApplicationConfig, ConflictResult, BudgetProfile, SkippedSkill, BudgetWarning } from '../types/application.js';
import { DEFAULT_CONFIG } from '../types/application.js';
import { SkillPipeline, createEmptyContext, type PipelineStage } from './skill-pipeline.js';
import { ScoreStage, ResolveStage, LoadStage, BudgetStage, CacheOrderStage, ModelFilterStage } from './stages/index.js';
import { AdaptiveRouter, CorrectionStage } from '../retrieval/index.js';
import type { CorrectionConfig } from '../retrieval/types.js';
import { EmbeddingService } from '../embeddings/embedding-service.js';
import type { EventStore, PatternReport } from '../telemetry/index.js';
import { TelemetryStage, ScoreAdjuster } from '../telemetry/index.js';
import type { SensoriaHookOptions } from '../sensoria/applicator-hook.js';
import { createSensoriaStage, readSensoriaEnabledFlag } from '../sensoria/applicator-hook.js';
import {
  createCoprocessorStage,
  readCoprocessorEnabledFlag,
  type CoprocessorHookResult,
} from '../coprocessor/applicator-hook.js';
import { readOrchestrationEnabledFlag } from '../orchestration/settings.js';

export interface CoprocessorHookOptions {
  enabled?: boolean;
  settingsPath?: string;
  onResult?: (result: CoprocessorHookResult) => void;
}

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
  /**
   * M5 orchestration-path flag. When true, callers that opt-in via
   * `applyViaSelector()` run through the `ActivationSelector` (M5) which
   * composes M1+M2+M6. Flag-off (default) preserves the legacy pipeline
   * byte-identically.
   */
  private orchestrationEnabled: boolean;

  constructor(
    private skillIndex: SkillIndex,
    private skillStore: SkillStore,
    config?: Partial<ApplicationConfig>,
    budgetProfile?: BudgetProfile,
    modelProfile?: string,
    retrievalConfig?: RetrievalConfig,
    eventStore?: EventStore,
    patternReport?: PatternReport,
    sensoriaOptions?: SensoriaHookOptions,
    coprocessorOptions?: CoprocessorHookOptions,
  ) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };

    this.tokenCounter = new TokenCounter(fullConfig.apiKey);
    this.scorer = new RelevanceScorer();
    this.resolver = new ConflictResolver();
    this.session = new SkillSession(this.tokenCounter, fullConfig);
    this.budgetProfile = budgetProfile;
    this.modelProfile = modelProfile;

    // M5 orchestration-path flag. Reads `gsd-skill-creator.orchestration.enabled`
    // from settings.json. Default OFF — byte-identical v1.49.560 behaviour.
    // The flag is recorded but NOT consulted by the legacy `apply()` path so
    // the SC-FLAG-OFF byte-identical guarantee is preserved. Callers wanting
    // the M5-driven orchestration must invoke `applyViaSelector()` explicitly.
    this.orchestrationEnabled = readOrchestrationEnabledFlag();

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

    // Wire ScoreAdjuster when pattern report is available (INTG-04 / ADAPT-01 pipeline wiring)
    if (patternReport && patternReport.type === 'report') {
      const adjuster = new ScoreAdjuster();
      const scoreAdjustStage: PipelineStage = {
        name: 'score-adjust',
        process: async (context) => {
          if (!context.earlyExit) {
            context.scoredSkills = adjuster.adjust(context.scoredSkills, patternReport);
          }
          return context;
        },
      };
      this.pipeline.insertBefore('resolve', scoreAdjustStage);
    }

    // M6 Sensoria net-shift gate (feature-flagged, default-off).
    // Only instantiated when the global flag is on AND options are supplied or
    // readable from settings.json — byte-identical v1.49.560 behaviour when off
    // (SC-FLAG-OFF: no stage is added, no module code runs).
    {
      const explicitEnabled = sensoriaOptions?.enabled;
      const resolvedEnabled = explicitEnabled === undefined
        ? readSensoriaEnabledFlag(sensoriaOptions?.settingsPath)
        : explicitEnabled;
      if (resolvedEnabled) {
        this.pipeline.insertAfter(
          'resolve',
          createSensoriaStage(this.skillStore, { ...sensoriaOptions, enabled: true }),
        );
      }
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

    // Coprocessor pre-warm hook (feature-flagged, default-off).
    // Reads `gsd-skill-creator.coprocessor.enabled` from settings.json. When
    // the flag is false, no stage is added — byte-identical pre-hook behaviour.
    {
      const explicitEnabled = coprocessorOptions?.enabled;
      const resolvedEnabled = explicitEnabled === undefined
        ? readCoprocessorEnabledFlag(
            coprocessorOptions?.settingsPath ?? '.claude/settings.json',
          )
        : explicitEnabled;
      if (resolvedEnabled) {
        this.pipeline.addStage(
          createCoprocessorStage({ onResult: coprocessorOptions?.onResult }),
        );
      }
    }

    if (eventStore) {
      this.pipeline.addStage(new TelemetryStage(eventStore));
    }
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

  /**
   * Is the M5 orchestration path enabled?
   * Gated by `gsd-skill-creator.orchestration.enabled` in settings.json.
   */
  isOrchestrationEnabled(): boolean {
    return this.orchestrationEnabled;
  }
}
