/**
 * Skill Migration System -- analyzer and executor for migrating existing
 * skills to complex plane positions.
 *
 * Provides:
 * - SkillMigrationAnalyzer class with analyzeSkill() and enhanceWithHistory()
 * - PlaneMigration executor class with migrateAll() and convertSkillToMetadata()
 * - handleMigratePlaneCommand CLI handler
 * - 6 exported content analysis helpers (pure functions)
 * - ExistingSkillMetadata, InferredPosition, ActivationRecord,
 *   MigrationOptions, MigrationDetail, MigrationReport types
 */

import { type SkillPosition, MATURITY_THRESHOLD } from './types.js';
import { createPosition, classifyByVersine, estimateTheta, estimateRadius } from './arithmetic.js';
import { PositionStore } from './position-store.js';
import { SkillStore } from '../../core/storage/skill-store.js';
import type { Skill } from '../../core/types/skill.js';
import { getExtension } from '../../core/types/extensions.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Wrapper interface for migration input -- encapsulates the skill data
 * needed for position inference.
 */
export interface ExistingSkillMetadata {
  id: string;
  triggers?: {
    intents?: string[];
    files?: string[];
    contexts?: string[];
  };
  content: string;
  extensions?: {
    promotionLevel?: string;
    version?: number;
    learning?: { applicationCount?: number };
  };
}

/**
 * The result of position inference: theta, radius, confidence, and source.
 */
export interface InferredPosition {
  theta: number;
  radius: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'promotion_level' | 'content_analysis' | 'history_enhanced' | 'default';
}

/**
 * Simplified activation history entry for migration.
 */
export interface ActivationRecord {
  context: {
    fileCount?: number;
    phase?: string;
    semanticMatchScore?: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

/** Promotion level to theta mapping. */
const PROMOTION_LEVEL_THETA: Record<string, number> = {
  conversation: Math.PI / 2,
  skill_md: Math.PI / 4,
  lora_adapter: Math.PI / 8,
  compiled: 0.01,
};

// ============================================================================
// Content Analysis Helpers (exported, pure)
// ============================================================================

/**
 * Count code block fences (``` pairs). Returns Math.floor(count / 2).
 */
export function countCodeBlocks(content: string): number {
  const matches = content.match(/```/g);
  if (!matches) return 0;
  return Math.floor(matches.length / 2);
}

/**
 * Count backticked multi-word commands like `npm install`, `git commit`.
 * Must have at least two words inside backticks, starting with lowercase letter.
 */
export function countExplicitCommands(content: string): number {
  const matches = content.match(/`[a-z][\w-]*\s+[\w-]+.*?`/g);
  return matches ? matches.length : 0;
}

/**
 * Count file path patterns like src/foo/bar.ts, ./config.yaml.
 */
export function countFilePaths(content: string): number {
  const matches = content.match(/(?:^|\s|['"(])([.\w/-]+\.\w{1,5})(?=[\s'")\],;]|$)/gm);
  return matches ? matches.length : 0;
}

/**
 * Count semantic description phrases: "Use when", "Triggers when",
 * "Applies to", "Consider", "Should".
 */
export function countSemanticDescriptions(content: string): number {
  const matches = content.match(/\b(use when|triggers? when|applies? to|consider|should)\b/gi);
  return matches ? matches.length : 0;
}

/**
 * Count conditional logic keywords: "if", "when", "unless", "provided that".
 */
export function countConditionalLogic(content: string): number {
  const matches = content.match(/\b(if|when|unless|provided that)\b/gi);
  return matches ? matches.length : 0;
}

/**
 * Determine if a context string represents a GSD phase context.
 */
export function isPhaseContext(ctx: string): boolean {
  return ['execute', 'verify', 'plan-phase', 'complete-milestone'].includes(ctx);
}

// ============================================================================
// Internal Helpers (not exported)
// ============================================================================

/**
 * Estimate theta for migration. Defaults to PI/4 if both signals are zero.
 */
function estimateMigrationTheta(concrete: number, abstract: number): number {
  if (concrete === 0 && abstract === 0) return Math.PI / 4;
  return estimateTheta(concrete, abstract);
}

/**
 * Estimate radius for migration. Clamps minimum to 0.1 for existing skills.
 */
function estimateMigrationRadius(maturityIndicators: number): number {
  return Math.max(0.1, estimateRadius(maturityIndicators, MATURITY_THRESHOLD));
}

// ============================================================================
// SkillMigrationAnalyzer
// ============================================================================

/**
 * Analyzes existing skill metadata and content to infer complex plane positions.
 *
 * Pipeline:
 * 1. Score triggers (files -> concrete, intents -> abstract, contexts -> classified)
 * 2. Score content (code blocks, commands, paths -> concrete; semantic phrases, conditionals -> abstract)
 * 3. Check promotion level override (exact theta mapping)
 * 4. Compute theta/radius from signals
 * 5. Optionally enhance with activation history (40% content + 60% history blend)
 */
export class SkillMigrationAnalyzer {
  /**
   * Analyze a skill's metadata and content to infer its complex plane position.
   */
  analyzeSkill(skill: ExistingSkillMetadata): InferredPosition {
    let concreteScore = 0;
    let abstractScore = 0;
    let maturityIndicators = 0;

    // -- Trigger analysis --
    const triggers = skill.triggers;
    if (triggers) {
      const fileCount = triggers.files?.length ?? 0;
      const intentCount = triggers.intents?.length ?? 0;
      concreteScore += fileCount * 2;
      abstractScore += intentCount * 2;

      // Context classification
      if (triggers.contexts) {
        for (const ctx of triggers.contexts) {
          if (isPhaseContext(ctx)) {
            concreteScore += 1;
          } else {
            abstractScore += 1;
          }
        }
      }

      // Maturity from trigger array lengths
      maturityIndicators += fileCount + intentCount + (triggers.contexts?.length ?? 0);
    }

    // -- Content analysis --
    const content = skill.content;
    const codeBlocks = countCodeBlocks(content);
    const explicitCommands = countExplicitCommands(content);
    const filePaths = countFilePaths(content);
    const semanticDescs = countSemanticDescriptions(content);
    const conditionalLogic = countConditionalLogic(content);

    concreteScore += codeBlocks * 3 + explicitCommands * 2 + filePaths * 1;
    abstractScore += semanticDescs * 2 + conditionalLogic * 1;

    maturityIndicators += Math.floor(content.length / 500);

    // -- Promotion level override --
    const promotionLevel = skill.extensions?.promotionLevel;
    if (promotionLevel && promotionLevel in PROMOTION_LEVEL_THETA) {
      return {
        theta: PROMOTION_LEVEL_THETA[promotionLevel],
        radius: 0.7,
        confidence: 'high',
        source: 'promotion_level',
      };
    }

    // -- Default if no signals --
    if (concreteScore === 0 && abstractScore === 0 && maturityIndicators <= 1) {
      return {
        theta: Math.PI / 4,
        radius: 0.1,
        confidence: 'low',
        source: 'default',
      };
    }

    // -- Compute theta and radius --
    const theta = estimateMigrationTheta(concreteScore, abstractScore);
    const radius = estimateMigrationRadius(maturityIndicators);
    const confidence = maturityIndicators > 5 ? 'medium' : 'low';

    return {
      theta,
      radius,
      confidence,
      source: 'content_analysis',
    };
  }

  /**
   * Enhance an inferred position with activation history data.
   *
   * Blending ratio: 40% content analysis + 60% history signals.
   */
  enhanceWithHistory(inferred: InferredPosition, history: ActivationRecord[]): InferredPosition {
    if (history.length === 0) return inferred;

    let historyConcrete = 0;
    let historyAbstract = 0;

    for (const record of history) {
      historyConcrete += record.context.fileCount ?? 0;
      historyAbstract += record.context.semanticMatchScore ?? 0;

      if (record.context.phase === 'execute') {
        historyConcrete += 2;
      }
      if (record.context.phase === 'research') {
        historyAbstract += 2;
      }
    }

    const historyTheta = estimateTheta(historyConcrete, historyAbstract);
    const blendedTheta = 0.4 * inferred.theta + 0.6 * historyTheta;
    const enhancedRadius = Math.min(1.0, estimateRadius(history.length, MATURITY_THRESHOLD));

    return {
      theta: blendedTheta,
      radius: Math.max(inferred.radius, enhancedRadius),
      confidence: 'high',
      source: 'history_enhanced',
    };
  }
}

// ============================================================================
// Migration Executor Types
// ============================================================================

/**
 * Options controlling migration behavior.
 */
export interface MigrationOptions {
  dryRun: boolean;
  force: boolean;
  includeHistory: boolean;
  verbose: boolean;
}

/**
 * Per-skill migration result detail.
 */
export interface MigrationDetail {
  skillId: string;
  position?: SkillPosition;
  confidence?: string;
  source?: string;
  error?: string;
}

/**
 * Aggregate migration report.
 */
export interface MigrationReport {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: MigrationDetail[];
}

// ============================================================================
// PlaneMigration Executor
// ============================================================================

/**
 * Orchestrates bulk migration of existing skills to complex plane positions.
 *
 * - Idempotent: second run with same skills produces 0 migrated
 * - Non-destructive: never modifies SKILL.md files
 * - Error-isolated: failure in one skill does not block others
 */
export class PlaneMigration {
  constructor(
    private analyzer: SkillMigrationAnalyzer,
    private positionStore: PositionStore,
    private skillStore: SkillStore,
  ) {}

  /**
   * Convert a Skill object (from SkillStore) into ExistingSkillMetadata
   * for the analyzer.
   */
  convertSkillToMetadata(skill: Skill): ExistingSkillMetadata {
    const ext = getExtension(skill.metadata);
    return {
      id: skill.metadata.name,
      triggers: ext.triggers ?? skill.metadata.triggers,
      content: skill.body,
      extensions: {
        promotionLevel: (ext as Record<string, unknown>).promotionLevel as string | undefined,
        version: ext.version,
        learning: ext.learning
          ? { applicationCount: ext.learning.applicationCount }
          : undefined,
      },
    };
  }

  /**
   * Migrate all skills to complex plane positions.
   */
  async migrateAll(options?: Partial<MigrationOptions>): Promise<MigrationReport> {
    const opts: MigrationOptions = {
      dryRun: options?.dryRun ?? false,
      force: options?.force ?? false,
      includeHistory: options?.includeHistory ?? true,
      verbose: options?.verbose ?? false,
    };

    const skillNames = await this.skillStore.list();
    const report: MigrationReport = {
      total: skillNames.length,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: [],
    };

    for (const name of skillNames) {
      // Skip if already positioned (unless force)
      if (!opts.force && this.positionStore.get(name)) {
        report.skipped++;
        continue;
      }

      try {
        const skill = await this.skillStore.read(name);
        const metadata = this.convertSkillToMetadata(skill);

        // Analyze content
        const inferred = this.analyzer.analyzeSkill(metadata);

        // Note: activation history loading is a future enhancement.
        // When Phase 366 wires everything, history can be loaded and
        // passed to enhanceWithHistory() here.

        // Create position
        const position = createPosition(
          inferred.theta,
          inferred.radius,
          0,  // No angular velocity for migrated skills
        );

        if (!opts.dryRun) {
          this.positionStore.set(name, position);
        }

        report.migrated++;
        report.details.push({
          skillId: name,
          position,
          confidence: inferred.confidence,
          source: inferred.source,
        });
      } catch (error) {
        report.errors++;
        report.details.push({
          skillId: name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (!opts.dryRun && report.migrated > 0) {
      await this.positionStore.save();
    }

    return report;
  }
}

// ============================================================================
// CLI Handler
// ============================================================================

/**
 * CLI handler for the `migrate-plane` command.
 *
 * Creates SkillStore, PositionStore, SkillMigrationAnalyzer, runs migration,
 * and prints summary to console.
 */
export async function handleMigratePlaneCommand(
  options: Partial<MigrationOptions> = {},
): Promise<void> {
  const skillStore = new SkillStore();
  const positionStore = new PositionStore();
  const analyzer = new SkillMigrationAnalyzer();
  const migration = new PlaneMigration(analyzer, positionStore, skillStore);

  await positionStore.load();

  console.log('Analyzing existing skills for complex plane migration...');
  const report = await migration.migrateAll(options);

  const dryRunLabel = options.dryRun ? '(DRY RUN) ' : '';
  console.log(`\nMigration ${dryRunLabel}Complete:`);
  console.log(`  Total skills: ${report.total}`);
  console.log(`  Migrated: ${report.migrated}`);
  console.log(`  Skipped (already positioned): ${report.skipped}`);
  console.log(`  Errors: ${report.errors}`);

  if (options.verbose) {
    for (const detail of report.details) {
      if (detail.position) {
        const zone = classifyByVersine(detail.position);
        console.log(
          `  ${detail.skillId}: theta=${detail.position.theta.toFixed(3)} ` +
          `r=${detail.position.radius.toFixed(3)} [${zone}] ` +
          `(${detail.confidence}, ${detail.source})`,
        );
      } else if (detail.error) {
        console.log(`  ${detail.skillId}: ERROR -- ${detail.error}`);
      }
    }
  }
}
