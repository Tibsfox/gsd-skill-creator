// Token counting result with source tracking
export interface TokenCountResult {
  count: number;
  source: 'api' | 'estimate';
  confidence: 'high' | 'medium';
}

// Skill with relevance score for ranking
export interface ScoredSkill {
  name: string;
  score: number;
  matchType: 'intent' | 'file' | 'context';
}

// Active skill in session with token consumption
export interface ActiveSkill {
  name: string;
  loadedAt: Date;
  tokenCount: number;
  priority: number;
  content: string;
}

// Session state tracking active skills and budget
export interface SessionState {
  activeSkills: Map<string, ActiveSkill>;
  totalTokens: number;
  budgetLimit: number;
  budgetPercent: number;
}

// Conflict detection result
export interface ConflictResult {
  hasConflict: boolean;
  conflictingSkills: string[];
  resolution: 'priority' | 'merge' | 'user-choice';
  winner?: string;
}

// Token tracking for before/after comparison (TOKEN-01)
export interface TokenTracking {
  skillName: string;
  contentTokens: number;
  estimatedSavings: number;
  loadedAt: Date;
}

// Priority tier for token budget allocation
export type PriorityTier = 'critical' | 'standard' | 'optional';

// Model tier for model-aware skill activation
export type ModelTier = 'opus' | 'sonnet' | 'haiku';

// Model guidance metadata for skill filtering
export interface ModelGuidance {
  preferred: ModelTier[];          // Which model tiers this skill targets (e.g., ['opus', 'sonnet'])
  minimumCapability?: number;      // Minimum capability level (opus=3, sonnet=2, haiku=1)
}

// Skill skipped due to budget constraints
export interface SkippedSkill {
  name: string;
  tier: PriorityTier;
  reason: 'budget_exceeded' | 'hard_ceiling_reached' | 'lower_priority' | 'model_mismatch';
  estimatedTokens: number;
}

// Budget threshold warning
export interface BudgetWarning {
  threshold: 50 | 80 | 100;
  currentUsagePercent: number;
  message: string;
}

// Per-agent budget profile configuration
export interface BudgetProfile {
  name: string;
  budgetPercent: number;        // Standard budget as fraction (e.g., 0.05 = 5%)
  hardCeilingPercent: number;   // Absolute max including critical overflow (e.g., 0.10)
  tiers: {
    critical: string[];         // Skill names that always load (up to hard ceiling)
    standard: string[];         // Skill names that load within standard budget
    optional: string[];         // Skill names that load only if budget remains
  };
  thresholds: {
    warn50: boolean;
    warn80: boolean;
    warn100: boolean;
  };
}

// Configuration for skill application
export interface ApplicationConfig {
  contextWindowSize: number;
  budgetPercent: number;
  relevanceThreshold: number;
  maxSkillsPerSession: number;
  apiKey?: string;
}

// Default configuration values
export const DEFAULT_CONFIG: ApplicationConfig = {
  contextWindowSize: 200_000,
  budgetPercent: 0.03,
  relevanceThreshold: 0.1,
  maxSkillsPerSession: 5,
};
