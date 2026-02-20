/**
 * Planner agent for the GSD Den.
 *
 * Owns project trajectory -- roadmap, milestone sequencing, phase planning,
 * and resource estimation. When new work arrives, the Planner decomposes it
 * into structured phases. When the Coordinator needs to know what comes next,
 * the Planner provides trajectory data.
 *
 * Provides 5 core capabilities:
 *   1. Vision decomposition -- parse vision text into structured trajectory
 *   2. Resource estimation -- calculate remaining/projected token budget
 *   3. Trajectory reporting -- compare actual progress to plan
 *   4. Trajectory logging (JSONL) -- append-only audit trail
 *   5. Planner class -- stateful wrapper with bound config
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { formatTimestamp } from './encoder.js';

// ============================================================================
// PhaseEstimate schema
// ============================================================================

/**
 * Schema for a single phase's resource estimate.
 */
export const PhaseEstimateSchema = z.object({
  /** Phase name/number */
  phase: z.string(),
  /** Estimated token count for this phase */
  estimatedTokens: z.number().int().positive(),
  /** Skill names required for this phase */
  skillsRequired: z.array(z.string()),
  /** Phase complexity tier */
  complexity: z.enum(['simple', 'standard', 'complex']),
  /** Estimated number of plans for this phase */
  estimatedPlans: z.number().int().positive(),
});

/** TypeScript type for phase estimates */
export type PhaseEstimate = z.infer<typeof PhaseEstimateSchema>;

// ============================================================================
// Trajectory schema
// ============================================================================

/**
 * Schema for a full project trajectory.
 */
export const TrajectorySchema = z.object({
  /** Milestone identifier */
  milestoneId: z.string(),
  /** Total number of phases in the trajectory */
  totalPhases: z.number().int().positive(),
  /** Current phase index (0-based) */
  currentPhase: z.number().int().nonnegative(),
  /** Array of phase estimates */
  phases: z.array(PhaseEstimateSchema),
  /** Sum of all phase token estimates */
  totalEstimatedTokens: z.number().int().nonnegative(),
  /** Trajectory status */
  status: z.enum(['planned', 'in_progress', 'completed', 'replanned']),
});

/** TypeScript type for trajectories */
export type Trajectory = z.infer<typeof TrajectorySchema>;

// ============================================================================
// TrajectoryReport schema
// ============================================================================

/**
 * Schema for a trajectory report comparing actual progress to plan.
 */
export const TrajectoryReportSchema = z.object({
  /** Compact timestamp of report generation */
  timestamp: z.string(),
  /** Milestone identifier */
  milestoneId: z.string(),
  /** Number of phases completed */
  phasesCompleted: z.number().int().nonnegative(),
  /** Total number of phases */
  totalPhases: z.number().int().positive(),
  /** Actual tokens consumed so far */
  tokensConsumed: z.number().int().nonnegative(),
  /** Originally estimated total tokens */
  tokensEstimated: z.number().int().nonnegative(),
  /** Current trajectory status */
  status: z.enum(['on_track', 'deviation', 'ahead', 'behind']),
  /** Reason for deviation (if status is deviation) */
  deviationReason: z.string().optional(),
});

/** TypeScript type for trajectory reports */
export type TrajectoryReport = z.infer<typeof TrajectoryReportSchema>;

// ============================================================================
// TrajectoryEntry schema (JSONL log)
// ============================================================================

/**
 * Schema for a single JSONL log entry.
 */
export const TrajectoryEntrySchema = z.object({
  /** Compact timestamp */
  timestamp: z.string(),
  /** Type of trajectory event */
  type: z.enum(['decomposition', 'estimate', 'report', 'correction']),
  /** Milestone context */
  milestoneId: z.string(),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for trajectory entries */
export type TrajectoryEntry = z.infer<typeof TrajectoryEntrySchema>;

// ============================================================================
// PlannerConfig schema
// ============================================================================

/**
 * Configuration for the Planner agent.
 */
export const PlannerConfigSchema = z.object({
  /** Bus configuration for message sending */
  busConfig: z.any(),
  /** Path to the JSONL trajectory log file */
  logPath: z.string().default('.planning/den/logs/planner.jsonl'),
});

/** TypeScript type for planner config */
export type PlannerConfig = z.infer<typeof PlannerConfigSchema>;

// ============================================================================
// Skill keyword detection
// ============================================================================

/** Known skill keywords to extract from vision text */
const SKILL_KEYWORDS: ReadonlyArray<{ pattern: string; name: string }> = [
  { pattern: 'test', name: 'test' },
  { pattern: 'api', name: 'API' },
  { pattern: 'ui', name: 'UI' },
  { pattern: 'database', name: 'database' },
  { pattern: 'auth', name: 'auth' },
  { pattern: 'deploy', name: 'deploy' },
];

/**
 * Extract skill keywords from a block of text.
 *
 * Uses case-insensitive substring matching against known skill patterns.
 *
 * @param text - Text to scan for skill keywords
 * @returns Deduplicated array of matched skill names
 */
function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const kw of SKILL_KEYWORDS) {
    if (lower.includes(kw.pattern)) {
      found.push(kw.name);
    }
  }

  return found;
}

// ============================================================================
// Token estimation constants
// ============================================================================

/** Token estimate by complexity tier */
const COMPLEXITY_TOKENS: Record<string, number> = {
  simple: 15000,
  standard: 30000,
  complex: 50000,
};

// ============================================================================
// decomposeVision
// ============================================================================

/**
 * Parse a vision document text and produce a Trajectory.
 *
 * Heuristic decomposition:
 * - Count "Phase" or "## " headings for totalPhases (min 1)
 * - Count bullet points per section for estimatedPlans per phase (min 1)
 * - Assign complexity based on bullet count: <=3 = simple, 4-6 = standard, >6 = complex
 * - Estimate tokens per phase based on complexity
 * - Extract skill keywords from section content
 *
 * @param visionText - Raw vision document text
 * @param milestoneId - Milestone identifier (default: 'milestone-1')
 * @returns Structured trajectory
 */
export function decomposeVision(visionText: string, milestoneId: string = 'milestone-1'): Trajectory {
  // Split into sections by headings (## or "Phase N" pattern)
  const headingPattern = /^(?:#{1,3}\s+|Phase\s+\d)/m;
  const lines = visionText.split('\n');

  const sections: Array<{ name: string; content: string[] }> = [];
  let currentSection: { name: string; content: string[] } | null = null;

  for (const line of lines) {
    if (headingPattern.test(line)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      // Extract heading name: strip ## prefix and trim
      const name = line.replace(/^#{1,3}\s+/, '').trim();
      currentSection = { name, content: [] };
    } else if (currentSection) {
      currentSection.content.push(line);
    }
  }

  // Push last section
  if (currentSection) {
    sections.push(currentSection);
  }

  // If no headings found, create a single default section
  if (sections.length === 0) {
    sections.push({ name: 'Phase 1', content: lines });
  }

  // Convert sections to phase estimates
  const phases: PhaseEstimate[] = sections.map((section) => {
    const bullets = section.content.filter((l) => /^\s*-\s+/.test(l));
    const bulletCount = Math.max(bullets.length, 1);
    const sectionText = section.content.join('\n');

    let complexity: 'simple' | 'standard' | 'complex';
    if (bulletCount <= 3) {
      complexity = 'simple';
    } else if (bulletCount <= 6) {
      complexity = 'standard';
    } else {
      complexity = 'complex';
    }

    return PhaseEstimateSchema.parse({
      phase: section.name,
      estimatedTokens: COMPLEXITY_TOKENS[complexity],
      skillsRequired: extractSkills(sectionText),
      complexity,
      estimatedPlans: bulletCount,
    });
  });

  const totalEstimatedTokens = phases.reduce((sum, p) => sum + p.estimatedTokens, 0);

  return TrajectorySchema.parse({
    milestoneId,
    totalPhases: phases.length,
    currentPhase: 0,
    phases,
    totalEstimatedTokens,
    status: 'planned',
  });
}

// ============================================================================
// estimatePhaseResources
// ============================================================================

/**
 * Calculate remaining token budget, average per phase, and projected total.
 *
 * @param phases - Array of phase estimates
 * @param completedPhases - Number of phases completed so far
 * @param tokensUsed - Actual tokens consumed so far
 * @returns Resource estimation with remaining, avgPerPhase, projectedTotal
 */
export function estimatePhaseResources(
  phases: PhaseEstimate[],
  completedPhases: number,
  tokensUsed: number,
): { remaining: number; avgPerPhase: number; projectedTotal: number } {
  const totalEstimated = phases.reduce((sum, p) => sum + p.estimatedTokens, 0);
  const remaining = totalEstimated - tokensUsed;
  const avgPerPhase = completedPhases > 0 ? Math.round(tokensUsed / completedPhases) : 0;
  const projectedTotal = completedPhases > 0
    ? avgPerPhase * phases.length
    : totalEstimated;

  return { remaining, avgPerPhase, projectedTotal };
}

// ============================================================================
// generateTrajectoryReport
// ============================================================================

/**
 * Produce a trajectory report comparing actual progress to plan.
 *
 * Status logic:
 * - deviation: trajectory.status === 'replanned'
 * - ahead: phaseProgress > tokenProgress + 0.1
 * - behind: tokenProgress > phaseProgress + 0.1
 * - on_track: otherwise
 *
 * @param trajectory - Current trajectory state
 * @param tokensConsumed - Actual tokens consumed
 * @returns Trajectory report
 */
export function generateTrajectoryReport(trajectory: Trajectory, tokensConsumed: number): TrajectoryReport {
  const now = new Date();
  const timestamp = formatTimestamp(now);

  const phaseProgress = trajectory.currentPhase / trajectory.totalPhases;
  const tokenProgress = trajectory.totalEstimatedTokens > 0
    ? tokensConsumed / trajectory.totalEstimatedTokens
    : 0;

  let status: 'on_track' | 'deviation' | 'ahead' | 'behind';
  let deviationReason: string | undefined;

  if (trajectory.status === 'replanned') {
    status = 'deviation';
    deviationReason = 'Trajectory was replanned';
  } else if (phaseProgress > tokenProgress + 0.1) {
    status = 'ahead';
  } else if (tokenProgress > phaseProgress + 0.1) {
    status = 'behind';
  } else {
    status = 'on_track';
  }

  return TrajectoryReportSchema.parse({
    timestamp,
    milestoneId: trajectory.milestoneId,
    phasesCompleted: trajectory.currentPhase,
    totalPhases: trajectory.totalPhases,
    tokensConsumed,
    tokensEstimated: trajectory.totalEstimatedTokens,
    status,
    deviationReason,
  });
}

// ============================================================================
// JSONL logging
// ============================================================================

/**
 * Append a trajectory entry to a JSONL log file.
 *
 * Creates the file and directory if they do not exist. Each entry is one
 * JSON object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Trajectory entry to append
 */
export async function appendTrajectoryEntry(logPath: string, entry: TrajectoryEntry): Promise<void> {
  const validated = TrajectoryEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all trajectory entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated TrajectoryEntry objects
 */
export async function readTrajectoryLog(logPath: string): Promise<TrajectoryEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => TrajectoryEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Planner class (stateful wrapper)
// ============================================================================

/**
 * Stateful Planner wrapping all stateless functions with bound config.
 *
 * Follows the Coordinator pattern: constructor validates config via Zod,
 * stateless methods do the real work. Use createPlanner factory for
 * ergonomic creation with filesystem setup.
 */
export class Planner {
  private readonly plannerConfig: PlannerConfig;
  private trajectory: Trajectory | null = null;

  /**
   * Create a new Planner instance.
   *
   * @param config - Planner configuration (validated through Zod)
   */
  constructor(config: PlannerConfig) {
    this.plannerConfig = PlannerConfigSchema.parse(config);
  }

  /**
   * Decompose a vision document into a trajectory.
   *
   * @param visionText - Raw vision document text
   * @param milestoneId - Optional milestone identifier override
   * @returns Structured trajectory
   */
  decompose(visionText: string, milestoneId?: string): Trajectory {
    this.trajectory = decomposeVision(visionText, milestoneId);
    return this.trajectory;
  }

  /**
   * Estimate resource consumption based on stored trajectory.
   *
   * @param completedPhases - Number of phases completed so far
   * @param tokensUsed - Actual tokens consumed so far
   * @returns Resource estimation
   * @throws Error if no trajectory has been set
   */
  estimate(completedPhases: number, tokensUsed: number): { remaining: number; avgPerPhase: number; projectedTotal: number } {
    if (!this.trajectory) {
      throw new Error('No trajectory set. Call decompose() or setTrajectory() first.');
    }
    return estimatePhaseResources(this.trajectory.phases, completedPhases, tokensUsed);
  }

  /**
   * Generate a trajectory report and log it.
   *
   * @param tokensConsumed - Actual tokens consumed
   * @returns Trajectory report
   * @throws Error if no trajectory has been set
   */
  async report(tokensConsumed: number): Promise<TrajectoryReport> {
    if (!this.trajectory) {
      throw new Error('No trajectory set. Call decompose() or setTrajectory() first.');
    }

    const report = generateTrajectoryReport(this.trajectory, tokensConsumed);

    await appendTrajectoryEntry(this.plannerConfig.logPath, {
      timestamp: report.timestamp,
      type: 'report',
      milestoneId: this.trajectory.milestoneId,
      detail: {
        status: report.status,
        phasesCompleted: report.phasesCompleted,
        totalPhases: report.totalPhases,
        tokensConsumed: report.tokensConsumed,
        tokensEstimated: report.tokensEstimated,
      },
    });

    return report;
  }

  /**
   * Store or update the current trajectory.
   *
   * @param trajectory - Trajectory to store
   */
  setTrajectory(trajectory: Trajectory): void {
    this.trajectory = TrajectorySchema.parse(trajectory);
  }

  /**
   * Get the current trajectory (null if not yet set).
   *
   * @returns Current trajectory or null
   */
  getTrajectory(): Trajectory | null {
    return this.trajectory;
  }

  /**
   * Read the full trajectory log.
   *
   * @returns Array of all trajectory entries
   */
  async getLog(): Promise<TrajectoryEntry[]> {
    return readTrajectoryLog(this.plannerConfig.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create and initialize a Planner.
 *
 * Ensures the log directory exists before returning the ready-to-use instance.
 *
 * @param config - Planner configuration
 * @returns Initialized Planner instance
 */
export async function createPlanner(config: PlannerConfig): Promise<Planner> {
  const validated = PlannerConfigSchema.parse(config);
  await mkdir(dirname(validated.logPath), { recursive: true });
  return new Planner(validated);
}
