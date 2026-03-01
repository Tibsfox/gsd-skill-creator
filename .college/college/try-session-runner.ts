/**
 * TrySessionRunner -- interactive session lifecycle management.
 *
 * Manages step-by-step progression through guided learning experiences
 * ("Your First Derivative", "Make an Omelette"), tracking which concepts
 * are explored and session completion status.
 *
 * @module college/try-session-runner
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CollegeLoader } from './college-loader.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Full try-session definition with steps (loaded from try-sessions/ directory) */
export interface TrySessionDefinition {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  prerequisites: string[];
  steps: TryStep[];
}

/** A single step in a try-session */
export interface TryStep {
  instruction: string;
  expectedOutcome: string;
  hint?: string;
  conceptsExplored: string[];
}

/** Runtime state of a try-session */
export interface TrySessionState {
  sessionId: string;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  currentStep: number;
  totalSteps: number;
  stepsCompleted: boolean[];
  conceptsExplored: string[];
  startedAt: Date;
  completedAt?: Date;
}

// ─── TrySessionRunner ────────────────────────────────────────────────────────

export class TrySessionRunner {
  private state: TrySessionState;
  private definition: TrySessionDefinition;
  private exploredSet: Set<string>;

  private constructor(definition: TrySessionDefinition) {
    this.definition = definition;
    this.exploredSet = new Set<string>();
    this.state = {
      sessionId: definition.id,
      title: definition.title,
      status: 'active',
      currentStep: 0,
      totalSteps: definition.steps.length,
      stepsCompleted: new Array(definition.steps.length).fill(false),
      conceptsExplored: [],
      startedAt: new Date(),
    };

    // Track concepts from the initial step
    this.trackConcepts(0);
  }

  /**
   * Start a session from a definition.
   */
  static start(definition: TrySessionDefinition): TrySessionRunner {
    return new TrySessionRunner(definition);
  }

  /**
   * Load and start a session from a department's try-sessions/ directory.
   *
   * Reads `{basePath}/{departmentId}/try-sessions/{sessionId}.json`
   * and initializes a runner with the parsed definition.
   */
  static async loadSession(
    loader: CollegeLoader,
    departmentId: string,
    sessionId: string,
  ): Promise<TrySessionRunner> {
    const deptPath = loader.getDepartmentPath(departmentId);
    const sessionPath = join(deptPath, 'try-sessions', `${sessionId}.json`);

    if (!existsSync(sessionPath)) {
      throw new Error(
        `Try-session '${sessionId}' not found in department '${departmentId}'. ` +
        `Expected file: ${sessionPath}`,
      );
    }

    const content = readFileSync(sessionPath, 'utf-8');
    const definition: TrySessionDefinition = JSON.parse(content);

    return new TrySessionRunner(definition);
  }

  /**
   * Get the current step.
   */
  getCurrentStep(): TryStep {
    return this.definition.steps[this.state.currentStep];
  }

  /**
   * Advance to the next step.
   *
   * @returns The next step, or null if already at the last step
   */
  nextStep(): TryStep | null {
    if (this.state.currentStep >= this.state.totalSteps - 1) {
      return null;
    }

    this.state.currentStep++;
    this.trackConcepts(this.state.currentStep);
    return this.definition.steps[this.state.currentStep];
  }

  /**
   * Go back to the previous step.
   *
   * @returns The previous step, or null if already at step 0
   */
  previousStep(): TryStep | null {
    if (this.state.currentStep <= 0) {
      return null;
    }

    this.state.currentStep--;
    return this.definition.steps[this.state.currentStep];
  }

  /**
   * Jump to a specific step by index.
   *
   * @param index - The step index to jump to
   * @returns The step at the given index
   * @throws RangeError if index is out of bounds
   */
  goToStep(index: number): TryStep {
    if (index < 0 || index >= this.state.totalSteps) {
      throw new RangeError(
        `Step index ${index} is out of bounds. Valid range: 0-${this.state.totalSteps - 1}`,
      );
    }

    this.state.currentStep = index;
    this.trackConcepts(index);
    return this.definition.steps[index];
  }

  /**
   * Mark the current step as complete and auto-advance.
   *
   * If the last step is completed, the session status changes to 'completed'.
   *
   * @returns The next step, or null if session is now complete
   */
  completeStep(): TryStep | null {
    this.state.stepsCompleted[this.state.currentStep] = true;
    this.trackConcepts(this.state.currentStep);

    // Check if this was the last step
    if (this.state.currentStep >= this.state.totalSteps - 1) {
      this.state.status = 'completed';
      this.state.completedAt = new Date();
      return null;
    }

    // Auto-advance
    this.state.currentStep++;
    this.trackConcepts(this.state.currentStep);
    return this.definition.steps[this.state.currentStep];
  }

  /**
   * Get session progress.
   */
  getProgress(): { currentStep: number; totalSteps: number; percentComplete: number } {
    const completed = this.state.stepsCompleted.filter(Boolean).length;
    return {
      currentStep: this.state.currentStep,
      totalSteps: this.state.totalSteps,
      percentComplete: Math.floor((completed / this.state.totalSteps) * 100),
    };
  }

  /**
   * Get session prerequisites.
   */
  getPrerequisites(): string[] {
    return this.definition.prerequisites;
  }

  /**
   * Get accumulated explored concepts (deduplicated).
   */
  getConceptsExplored(): string[] {
    return Array.from(this.exploredSet);
  }

  /**
   * Get full session state.
   */
  getState(): TrySessionState {
    return {
      ...this.state,
      conceptsExplored: Array.from(this.exploredSet),
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Track concepts explored at a given step index.
   */
  private trackConcepts(stepIndex: number): void {
    const step = this.definition.steps[stepIndex];
    if (step && step.conceptsExplored) {
      for (const concept of step.conceptsExplored) {
        this.exploredSet.add(concept);
      }
    }
  }
}
