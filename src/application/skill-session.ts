import type { ActiveSkill, SessionState, TokenTracking, ApplicationConfig } from '../types/application.js';
import { DEFAULT_CONFIG } from '../types/application.js';
import { TokenCounter } from './token-counter.js';

export interface SkillLoadResult {
  success: boolean;
  reason?: 'loaded' | 'budget_exceeded' | 'already_active' | 'max_skills_reached';
  tokenCount?: number;
  remainingBudget?: number;
}

export interface SessionReport {
  activeSkills: ActiveSkill[];
  totalTokens: number;
  budgetLimit: number;
  budgetUsedPercent: number;
  remainingBudget: number;
  tokenTracking: TokenTracking[];
  flaggedSkills: string[];
}

export class SkillSession {
  private state: SessionState;
  private tokenTracking: Map<string, TokenTracking> = new Map();
  private config: ApplicationConfig;

  constructor(
    private tokenCounter: TokenCounter,
    config?: Partial<ApplicationConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const budgetLimit = this.tokenCounter.calculateBudget(
      this.config.contextWindowSize,
      this.config.budgetPercent
    );

    this.state = {
      activeSkills: new Map(),
      totalTokens: 0,
      budgetLimit,
      budgetPercent: this.config.budgetPercent,
    };
  }

  // Check if a skill can be loaded within budget
  canLoad(tokenCount: number): boolean {
    if (this.state.totalTokens + tokenCount > this.state.budgetLimit) {
      return false;
    }

    if (this.state.activeSkills.size >= this.config.maxSkillsPerSession) {
      return false;
    }

    return true;
  }

  // Load a skill into the session
  async load(
    name: string,
    content: string,
    priority: number = 0,
    estimatedSavings: number = 0
  ): Promise<SkillLoadResult> {
    if (this.state.activeSkills.has(name)) {
      return { success: false, reason: 'already_active' };
    }

    if (this.state.activeSkills.size >= this.config.maxSkillsPerSession) {
      return {
        success: false,
        reason: 'max_skills_reached',
        remainingBudget: this.getRemainingBudget()
      };
    }

    const countResult = await this.tokenCounter.count(content);
    const tokenCount = countResult.count;

    if (!this.canLoad(tokenCount)) {
      return {
        success: false,
        reason: 'budget_exceeded',
        tokenCount,
        remainingBudget: this.getRemainingBudget(),
      };
    }

    const activeSkill: ActiveSkill = {
      name,
      loadedAt: new Date(),
      tokenCount,
      priority,
      content,
    };

    const tracking: TokenTracking = {
      skillName: name,
      contentTokens: tokenCount,
      estimatedSavings,
      loadedAt: new Date(),
    };

    this.state.activeSkills.set(name, activeSkill);
    this.state.totalTokens += tokenCount;
    this.tokenTracking.set(name, tracking);

    return {
      success: true,
      reason: 'loaded',
      tokenCount,
      remainingBudget: this.getRemainingBudget(),
    };
  }

  // Unload a skill from the session
  unload(skillName: string): boolean {
    const skill = this.state.activeSkills.get(skillName);
    if (!skill) {
      return false;
    }

    this.state.totalTokens -= skill.tokenCount;
    this.state.activeSkills.delete(skillName);
    this.tokenTracking.delete(skillName);
    return true;
  }

  // Get all active skills (APPLY-05)
  getActive(): ActiveSkill[] {
    return Array.from(this.state.activeSkills.values());
  }

  // Get active skill names for display
  getActiveNames(): string[] {
    return Array.from(this.state.activeSkills.keys());
  }

  // Check if a skill is active
  isActive(skillName: string): boolean {
    return this.state.activeSkills.has(skillName);
  }

  // Get remaining budget
  getRemainingBudget(): number {
    return this.state.budgetLimit - this.state.totalTokens;
  }

  // Get budget usage percentage
  getBudgetUsedPercent(): number {
    if (this.state.budgetLimit === 0) return 0;
    return (this.state.totalTokens / this.state.budgetLimit) * 100;
  }

  // Get total tokens used
  getTotalTokens(): number {
    return this.state.totalTokens;
  }

  // Get token tracking for a skill (TOKEN-02)
  getTokenTracking(skillName: string): TokenTracking | undefined {
    return this.tokenTracking.get(skillName);
  }

  // Get all token tracking entries
  getAllTokenTracking(): TokenTracking[] {
    return Array.from(this.tokenTracking.values());
  }

  // Get flagged skills - those costing more than they save (TOKEN-03)
  getFlaggedSkills(): string[] {
    const flagged: string[] = [];

    for (const [name, tracking] of this.tokenTracking) {
      if (tracking.contentTokens > tracking.estimatedSavings) {
        flagged.push(name);
      }
    }

    return flagged;
  }

  // Get comprehensive session report
  getReport(): SessionReport {
    return {
      activeSkills: this.getActive(),
      totalTokens: this.state.totalTokens,
      budgetLimit: this.state.budgetLimit,
      budgetUsedPercent: this.getBudgetUsedPercent(),
      remainingBudget: this.getRemainingBudget(),
      tokenTracking: this.getAllTokenTracking(),
      flaggedSkills: this.getFlaggedSkills(),
    };
  }

  // Clear all active skills (session reset)
  clear(): void {
    this.state.activeSkills.clear();
    this.state.totalTokens = 0;
    this.tokenTracking.clear();
  }

  // Update config (e.g., change budget percentage)
  updateConfig(config: Partial<ApplicationConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.contextWindowSize !== undefined || config.budgetPercent !== undefined) {
      this.state.budgetLimit = this.tokenCounter.calculateBudget(
        this.config.contextWindowSize,
        this.config.budgetPercent
      );
      this.state.budgetPercent = this.config.budgetPercent;
    }
  }

  // Format active skills for display (APPLY-05)
  formatActiveSkillsDisplay(): string {
    const active = this.getActive();

    if (active.length === 0) {
      return 'No active skills';
    }

    const lines = ['Active Skills:'];

    for (const skill of active) {
      const tokens = skill.tokenCount;
      const tracking = this.tokenTracking.get(skill.name);
      const savings = tracking?.estimatedSavings ?? 0;
      const status = tokens > savings ? ' [flagged]' : '';

      lines.push(`  - ${skill.name}: ${tokens} tokens${status}`);
    }

    const report = this.getReport();
    lines.push('');
    lines.push(`Budget: ${report.totalTokens}/${report.budgetLimit} tokens (${report.budgetUsedPercent.toFixed(1)}%)`);

    return lines.join('\n');
  }

  // Get skill content for a specific active skill
  getSkillContent(skillName: string): string | undefined {
    return this.state.activeSkills.get(skillName)?.content;
  }

  // Get all active skill contents combined (for context injection)
  getAllActiveContent(): string {
    const contents: string[] = [];

    for (const skill of this.state.activeSkills.values()) {
      contents.push(`<!-- Skill: ${skill.name} -->\n${skill.content}`);
    }

    return contents.join('\n\n');
  }

  // Estimate if we can fit additional content
  estimateRemainingCapacity(): {
    canFitSmall: boolean;
    canFitMedium: boolean;
    canFitLarge: boolean;
  } {
    const remaining = this.getRemainingBudget();
    return {
      canFitSmall: remaining >= 500,
      canFitMedium: remaining >= 2000,
      canFitLarge: remaining >= 5000,
    };
  }
}
