/**
 * Interview Simulator — practice interview system for oral history methodology.
 *
 * Provides 5 scenario types with real-time cultural sensitivity checking
 * and Pilimmaksarniq-aligned (IQ-05) feedback. Hard requirement: the
 * simulator cannot be used to extract Level 3-4 restricted cultural content.
 *
 * Scenarios cover:
 * - Appalachian elder: craft documentation, standard consent
 * - First Nations knowledge keeper (Anishinaabe/Ojibwe): OCAP consent modeling
 * - Inuit elder (Nunavut, Kivalliq): IQ-aligned relationship building, NISR compliance
 * - Family member: personal heritage documentation, cross-tradition
 * - Community group (Métis Nation of Ontario): multiple perspectives, community consent
 *
 * @module heritage-skills-pack/oral-history/simulator
 */

import { createRequire } from 'module';
import {
  FeedbackEngine,
  SimulatorProtocolError,
} from './feedback-engine.js';
import type { SimulationFeedback } from './feedback-engine.js';
import type { Tradition } from '../../shared/types.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { FeedbackEngine, SimulatorProtocolError } from './feedback-engine.js';
export type { SimulationFeedback, ProtocolViolation } from './feedback-engine.js';

const require = createRequire(import.meta.url);

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * A practice interview scenario defining the simulated knowledge holder's
 * persona, consent requirements, sample questions, and protocol violation triggers.
 */
export interface SimulatorScenario {
  /** Unique scenario identifier. */
  id: string;
  /** Human-readable scenario title. */
  title: string;
  /** Cultural tradition of this scenario. */
  tradition: Tradition | string;
  /** Rich description of the simulated knowledge holder. */
  personaDescription: string;
  /** Consent protocol required before this scenario can proceed. */
  consentProtocolId: string;
  /** Cultural sensitivity level (1-4). */
  sensitivityLevel: number;
  /** Context for the simulated interview. */
  practiceContext: string;
  /** Example questions that follow oral history best practices. */
  sampleQuestions: string[];
  /** Phrases or patterns that indicate a protocol violation. */
  protocolViolationTriggers: string[];
  /** Topics that require careful handling in this scenario. */
  culturallySensitiveTopics: string[];
}

/**
 * A summary of a completed simulation session.
 */
export interface SessionSummary {
  /** ID of the scenario used. */
  scenarioId: string;
  /** Total questions asked in the session. */
  questionsAsked: number;
  /** Number of questions that triggered protocol violations (includes sovereignty blocks). */
  violationsDetected: number;
  /** Number of questions blocked by cultural sovereignty enforcement. */
  culturalSovereigntyBlocks: number;
  /** Whether consent was acknowledged before questioning began. */
  consentAcknowledged: boolean;
  /** Whether the session was formally completed via complete(). */
  completed: boolean;
}

// ─── Data Loaders ─────────────────────────────────────────────────────────────

/**
 * Load all 5 interview simulator scenarios.
 */
export function loadScenarios(): SimulatorScenario[] {
  return require('./scenarios.json') as SimulatorScenario[];
}

/**
 * Get a specific scenario by its ID.
 *
 * Valid IDs: scenario-appalachian-elder, scenario-fn-knowledge-keeper,
 * scenario-inuit-elder, scenario-family-member, scenario-community-group
 *
 * @throws Error if the scenario ID is not found
 */
export function getScenario(id: string): SimulatorScenario {
  const scenarios = loadScenarios();
  const scenario = scenarios.find(s => s.id === id);
  if (!scenario) {
    throw new Error(
      `Unknown scenario ID: ${id}. Valid IDs: scenario-appalachian-elder, scenario-fn-knowledge-keeper, scenario-inuit-elder, scenario-family-member, scenario-community-group`,
    );
  }
  return scenario;
}

// ─── SimulationSession ────────────────────────────────────────────────────────

/**
 * A practice interview session for a specific scenario.
 *
 * Protocol enforcement:
 * - Consent must be acknowledged via acknowledgeConsent() before askQuestion()
 * - Level 3-4 content extraction attempts are blocked and throw SimulatorProtocolError
 * - All violations and blocks are tracked in the session summary
 *
 * Usage:
 * ```typescript
 * const session = new SimulationSession('scenario-inuit-elder');
 * session.acknowledgeConsent();
 * const feedback = session.askQuestion('How did you first learn to build a qajaq?');
 * const summary = session.complete();
 * ```
 */
export class SimulationSession {
  private scenario: SimulatorScenario;
  private feedbackEngine: FeedbackEngine;
  private _questionsAsked = 0;
  private _violationsDetected = 0;
  private _culturalSovereigntyBlocks = 0;
  private _consentAcknowledged = false;
  private _completed = false;

  constructor(scenarioId: string, feedbackEngine?: FeedbackEngine) {
    this.scenario = getScenario(scenarioId);
    this.feedbackEngine = feedbackEngine ?? new FeedbackEngine();
  }

  // ─── Consent Management ────────────────────────────────────────────────────

  /**
   * Acknowledge the consent protocol required for this scenario.
   *
   * Must be called before askQuestion(). The required consent protocol ID
   * is available via scenario.consentProtocolId.
   */
  acknowledgeConsent(): void {
    this._consentAcknowledged = true;
  }

  // ─── Question Evaluation ───────────────────────────────────────────────────

  /**
   * Evaluate a practice interview question and return Pilimmaksarniq-aligned feedback.
   *
   * @throws SimulatorProtocolError if consent has not been acknowledged
   * @throws SimulatorProtocolError if the question attempts to extract Level 3-4 content
   */
  askQuestion(question: string): SimulationFeedback {
    if (!this._consentAcknowledged) {
      throw new SimulatorProtocolError(
        `Consent for the '${this.scenario.consentProtocolId}' protocol must be acknowledged before asking questions. Call session.acknowledgeConsent() first.`,
      );
    }

    this._questionsAsked++;
    const feedback = this.feedbackEngine.evaluateQuestion(question, this.scenario);

    if (feedback.culturalSovereigntyBlocked) {
      this._culturalSovereigntyBlocks++;
      this._violationsDetected++;
    } else if (!feedback.isAppropriate) {
      this._violationsDetected++;
    }

    return feedback;
  }

  // ─── Session Completion ────────────────────────────────────────────────────

  /**
   * Close the session and return a summary.
   * After complete() is called, the session is marked completed.
   */
  complete(): SessionSummary {
    this._completed = true;
    return this.getSummary();
  }

  /**
   * Return the current session summary without closing the session.
   */
  getSummary(): SessionSummary {
    return {
      scenarioId: this.scenario.id,
      questionsAsked: this._questionsAsked,
      violationsDetected: this._violationsDetected,
      culturalSovereigntyBlocks: this._culturalSovereigntyBlocks,
      consentAcknowledged: this._consentAcknowledged,
      completed: this._completed,
    };
  }

  // ─── Accessors ─────────────────────────────────────────────────────────────

  /** The scenario loaded for this session. */
  get scenarioData(): SimulatorScenario {
    return this.scenario;
  }
}
