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
