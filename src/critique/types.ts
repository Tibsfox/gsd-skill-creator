/**
 * Core types for the critique loop module.
 *
 * These types are shared across the critique module tree:
 * loop.ts, draft.ts, revise.ts, stages/*, subagent-client.ts.
 *
 * Naming note: "refine" is already taken by src/learning/refinement-engine.ts
 * and src/cli.ts:632 (`case 'refine'`). All symbols here use "critique".
 */

// ============================================================================
// Core domain types
// ============================================================================

/**
 * A single finding from a critique stage.
 * Stages return arrays of these; the loop collects them per iteration.
 */
export interface CritiqueFinding {
  /** Stage that produced this finding (e.g. 'spec-compliance', 'link-check') */
  stage: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: { file: string; line?: number };
  fixHint?: string;
}

/**
 * A critique stage is a named reviewers that inspects a draft and returns
 * zero or more findings. Zero findings = stage passed this iteration.
 *
 * CritiqueStage is an interface (not an enum). Stages are registered via a
 * factory function and passed as an array to runCritiqueLoop.
 */
export interface CritiqueStage {
  name: string;
  run(draft: SkillDraft): Promise<CritiqueFinding[]>;
}

/**
 * An in-memory working copy of a skill under critique.
 * The loop passes this through draft → stages → revise each iteration.
 */
export interface SkillDraft {
  skillName: string;
  skillDir: string;
  /** SKILL.md body (frontmatter + content) */
  body: string;
  /** Parsed frontmatter fields */
  metadata: Record<string, unknown>;
  /** Additional files in the skill directory (path → contents) */
  files: Map<string, string>;
}

// ============================================================================
// Loop configuration + result types
// ============================================================================

export interface CritiqueConfig {
  /** Hard cap on iterations (default 5). Max-iter exit is non-zero. */
  maxIterations: number;
  /** Number of consecutive all-pass iterations to declare convergence (default 2). */
  convergenceWindow: number;
  /** Detect stalls when consecutive iterations produce identical findings (default true). */
  stallDetection: boolean;
  /** Directory for critique log files (default '.local/critique-logs'). */
  logDir?: string;
}

export type CritiqueStatus = 'converged' | 'max-iterations' | 'stalled';

export interface CritiqueIterationLog {
  iteration: number;
  findings: CritiqueFinding[];
  durationMs: number;
}

export interface CritiqueResult {
  status: CritiqueStatus;
  /** Number of iterations actually executed. */
  iterations: number;
  /** Findings from the final iteration (empty on converged). */
  finalFindings: CritiqueFinding[];
  /** Per-iteration log for telemetry. */
  log: CritiqueIterationLog[];
  /** Final skill draft after all revisions. */
  draft: SkillDraft;
  /** sha256 of final body — used by publish gate to detect staleness. */
  skillHash: string;
}

// ============================================================================
// SubagentClient interface (implemented in subagent-client.ts)
// ============================================================================

export interface SubagentClient {
  review(
    prompt: string,
    content: string,
  ): Promise<{ findings: CritiqueFinding[]; rawResponse?: string }>;
}
