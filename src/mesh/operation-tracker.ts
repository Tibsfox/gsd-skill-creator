/**
 * OperationTracker -- skill lifecycle state management.
 *
 * Tracks skill state through the pipeline: draft → tested → graded → optimized → packaged.
 * Persists state to .skill-status.json in the skill directory.
 * Validates transitions against allowed edges.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// ============================================================================
// Types
// ============================================================================

/** Skill lifecycle states in pipeline order */
export type SkillLifecycleState = 'draft' | 'tested' | 'graded' | 'optimized' | 'packaged';

/** A recorded state transition */
export interface StateTransition {
  from: SkillLifecycleState;
  to: SkillLifecycleState;
  timestamp: string;
}

/** Persisted state file format */
interface StatusFile {
  state: SkillLifecycleState;
  history: StateTransition[];
}

// ============================================================================
// Valid transitions
// ============================================================================

const VALID_TRANSITIONS: Record<SkillLifecycleState, SkillLifecycleState[]> = {
  draft: ['tested'],
  tested: ['graded', 'optimized'],
  graded: ['optimized'],
  optimized: ['packaged'],
  packaged: [],
};

const STATUS_FILENAME = '.skill-status.json';

// ============================================================================
// OperationTracker
// ============================================================================

/**
 * Tracks skill lifecycle state with persistence and transition validation.
 *
 * Usage:
 * ```typescript
 * const tracker = new OperationTracker('/path/to/skill');
 * await tracker.load();
 * tracker.getState(); // 'draft'
 * tracker.advance('tested');
 * tracker.getState(); // 'tested'
 * ```
 */
export class OperationTracker {
  private state: SkillLifecycleState = 'draft';
  private history: StateTransition[] = [];
  private readonly statusPath: string;

  constructor(private readonly skillDir: string) {
    this.statusPath = join(skillDir, STATUS_FILENAME);
  }

  /**
   * Load state from .skill-status.json. If file doesn't exist or is corrupt,
   * defaults to 'draft' with empty history.
   */
  async load(): Promise<void> {
    try {
      const content = await readFile(this.statusPath, 'utf-8');
      const parsed = JSON.parse(content) as StatusFile;
      if (parsed.state && parsed.history) {
        this.state = parsed.state;
        this.history = parsed.history;
      }
    } catch {
      // Missing or corrupt file — start fresh at draft
      this.state = 'draft';
      this.history = [];
    }
  }

  /** Get the current lifecycle state */
  getState(): SkillLifecycleState {
    return this.state;
  }

  /** Get the full transition history */
  getHistory(): StateTransition[] {
    return [...this.history];
  }

  /**
   * Advance to a new state. Validates the transition is allowed.
   *
   * @param to - Target state
   * @throws Error if transition is not valid from current state
   */
  advance(to: SkillLifecycleState): void {
    const allowed = VALID_TRANSITIONS[this.state];
    if (!allowed.includes(to)) {
      throw new Error(
        `Invalid transition: ${this.state} → ${to}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const transition: StateTransition = {
      from: this.state,
      to,
      timestamp: new Date().toISOString(),
    };

    this.history.push(transition);
    this.state = to;
  }

  /** Persist current state to .skill-status.json */
  async save(): Promise<void> {
    const data: StatusFile = {
      state: this.state,
      history: this.history,
    };
    await writeFile(this.statusPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /** Serializable snapshot */
  toJSON(): { state: SkillLifecycleState; history: StateTransition[] } {
    return {
      state: this.state,
      history: [...this.history],
    };
  }
}
