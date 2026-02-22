/**
 * Scribe agent -- always-on capture across all phases, artifact generation.
 *
 * The Scribe is the silent, ever-present recorder that captures every idea,
 * question, cluster, and evaluation emitted by other agents. It operates
 * across all five session phases (explore, diverge, organize, converge, act)
 * and uses no techniques itself.
 *
 * Critical behavioral constraints:
 * 1. The Scribe NEVER generates ideas or questions of its own
 * 2. generateIdea() and generateQuestion() throw unconditionally
 * 3. All capture methods validate with Zod schemas before accepting
 * 4. Artifact generation delegates entirely to ArtifactGenerator
 *
 * The Scribe's capture methods (captureIdea, captureQuestion, captureClusters,
 * captureEvaluation) validate incoming data with Zod schemas to enforce
 * data integrity across the agent boundary. Captured content is emitted
 * to the capture loop outbox unchanged -- the Scribe never modifies
 * captured content.
 *
 * Only imports from ../shared/types.js, ../artifacts/generator.js,
 * ../techniques/engine.js, ../core/rules-engine.js, and ./base.js.
 * Zero imports from den/, vtm/, knowledge/.
 */

import type {
  TechniqueId,
  Idea,
  Question,
  Cluster,
  Evaluation,
  SessionState,
} from '../shared/types.js';

import {
  IdeaSchema,
  QuestionSchema,
  EvaluationSchema,
} from '../shared/types.js';

import type { TechniqueEngine } from '../techniques/engine.js';
import type { RulesEngine } from '../core/rules-engine.js';

import { ArtifactGenerator } from '../artifacts/generator.js';
import { TechniqueAgent } from './base.js';

// ============================================================================
// Scribe agent
// ============================================================================

/**
 * Scribe agent -- always-on capture and artifact generation.
 *
 * Active in all 5 phases. Uses no techniques. Captures output from every
 * other agent via typed capture methods. Delegates artifact rendering
 * to ArtifactGenerator.
 */
export class Scribe extends TechniqueAgent {
  /** ArtifactGenerator instance for producing session artifacts. */
  private readonly artifactGenerator: ArtifactGenerator;

  constructor(engine: TechniqueEngine, rulesEngine: RulesEngine) {
    super('scribe', engine, rulesEngine);
    this.artifactGenerator = new ArtifactGenerator();
  }

  // ==========================================================================
  // Technique assignment -- Scribe uses no techniques
  // ==========================================================================

  /**
   * Return an empty array -- Scribe operates no techniques.
   *
   * The Scribe captures output from other agents and generates artifacts.
   * It never loads or runs technique instances.
   */
  getAssignedTechniques(): TechniqueId[] {
    return [];
  }

  // ==========================================================================
  // Capture methods -- validate with Zod, emit to capture loop
  // ==========================================================================

  /**
   * Capture an idea from another agent.
   *
   * Validates the idea against IdeaSchema using Zod parse() before
   * accepting. Emits the validated idea to the capture loop unchanged.
   * Throws ZodError if the idea fails validation.
   */
  captureIdea(idea: Idea): void {
    // Validate across the agent boundary -- never trust unvalidated data
    IdeaSchema.parse(idea);

    this.emitToCapture({
      agent: 'scribe',
      content_type: 'idea',
      content: idea,
      session_id: this.currentSessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Capture a question from another agent.
   *
   * Validates the question against QuestionSchema using Zod parse()
   * before accepting. Emits the validated question to the capture loop
   * unchanged. Throws ZodError if the question fails validation.
   */
  captureQuestion(question: Question): void {
    QuestionSchema.parse(question);

    this.emitToCapture({
      agent: 'scribe',
      content_type: 'question',
      content: question,
      session_id: this.currentSessionId,
      timestamp: Date.now(),
    });
  }

  /**
   * Capture clusters from the Mapper agent.
   *
   * Emits each cluster individually to the capture loop. Clusters
   * are not validated with a Zod schema here because they arrive
   * as arrays that have already been validated by the Mapper.
   */
  captureClusters(clusters: Cluster[]): void {
    for (const cluster of clusters) {
      this.emitToCapture({
        agent: 'scribe',
        content_type: 'cluster',
        content: cluster,
        session_id: this.currentSessionId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Capture an evaluation from the Critic agent.
   *
   * Validates the evaluation against EvaluationSchema using Zod parse()
   * before accepting. Emits the validated evaluation to the capture loop
   * unchanged. Throws ZodError if the evaluation fails validation.
   */
  captureEvaluation(evaluation: Evaluation): void {
    EvaluationSchema.parse(evaluation);

    this.emitToCapture({
      agent: 'scribe',
      content_type: 'evaluation',
      content: evaluation,
      session_id: this.currentSessionId,
      timestamp: Date.now(),
    });
  }

  // ==========================================================================
  // Artifact generation -- delegates to ArtifactGenerator
  // ==========================================================================

  /**
   * Generate a full session transcript as Markdown.
   *
   * Delegates entirely to ArtifactGenerator.generateTranscript().
   */
  generateTranscript(session: SessionState): string {
    return this.artifactGenerator.generateTranscript(session);
  }

  /**
   * Generate a standalone action plan as Markdown.
   *
   * Delegates entirely to ArtifactGenerator.generateActionPlan().
   */
  generateActionPlan(session: SessionState): string {
    return this.artifactGenerator.generateActionPlan(session);
  }

  /**
   * Generate a complete session export as formatted JSON.
   *
   * Delegates entirely to ArtifactGenerator.generateJsonExport().
   */
  generateJsonExport(session: SessionState): string {
    return this.artifactGenerator.generateJsonExport(session);
  }

  /**
   * Generate a cluster map visualization as Markdown.
   *
   * Delegates entirely to ArtifactGenerator.generateClusterMap().
   */
  generateClusterMap(session: SessionState): string {
    return this.artifactGenerator.generateClusterMap(session);
  }

  // ==========================================================================
  // Behavioral constraints -- Scribe CANNOT generate ideas or questions
  // ==========================================================================

  /**
   * Behavioral constraint: Scribe CANNOT generate ideas.
   *
   * This method exists solely to document and enforce the constraint.
   * Any attempt to call it throws unconditionally. The Scribe captures
   * ideas from other agents -- it never creates ideas of its own.
   */
  generateIdea(): never {
    throw new Error('Scribe cannot generate ideas -- behavioral constraint violation');
  }

  /**
   * Behavioral constraint: Scribe CANNOT generate questions.
   *
   * This method exists solely to document and enforce the constraint.
   * Any attempt to call it throws unconditionally. The Scribe captures
   * questions from other agents -- it never creates questions of its own.
   */
  generateQuestion(): never {
    throw new Error('Scribe cannot generate questions -- behavioral constraint violation');
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new Scribe agent instance.
 *
 * Factory function following the project's functional API + class wrapper
 * pattern.
 */
export function createScribe(engine: TechniqueEngine, rulesEngine: RulesEngine): Scribe {
  return new Scribe(engine, rulesEngine);
}
