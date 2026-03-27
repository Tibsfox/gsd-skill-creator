/**
 * Interview Simulator Feedback Engine.
 *
 * Provides Pilimmaksarniq-aligned feedback (IQ-05: learning through practice,
 * never punitive) on simulated oral history interview questions.
 *
 * Cultural Sovereignty Integration: evaluateQuestion() calls the Cultural
 * Sovereignty Warden to prevent the simulator from being used to extract
 * Level 3-4 restricted content.
 *
 * @module heritage-skills-pack/oral-history/simulator/feedback-engine
 */

import { createRequire } from 'module';
import { CulturalSovereigntyWarden } from '../../safety/cultural-warden.js';
import type { Tradition } from '../../shared/types.js';
import { CulturalSovereigntyLevel } from '../../shared/types.js';

const require = createRequire(import.meta.url);

// ─── Interfaces ───────────────────────────────────────────────────────────────

/**
 * Feedback returned for an evaluated interview question.
 */
export interface SimulationFeedback {
  /** Whether the question follows interview best practices. */
  isAppropriate: boolean;
  /** List of protocol violations detected, if any. */
  violations: ProtocolViolation[];
  /** Pilimmaksarniq-aligned guidance for improvement. */
  guidance: string;
  /** Whether this question was blocked by cultural sovereignty enforcement. */
  culturalSovereigntyBlocked: boolean;
  /** Cultural sovereignty level detected (1-4), if applicable. */
  detectedSovereigntyLevel?: number;
}

/**
 * A protocol violation detected during question evaluation.
 */
export interface ProtocolViolation {
  /** Short violation code. */
  code: string;
  /** Human-readable description of the violation. */
  description: string;
  /** Which practice this violation relates to (practice-01 through practice-12). */
  relatedPractice: string;
}

// ─── Error Types ──────────────────────────────────────────────────────────────

/**
 * Thrown when a SimulationSession protocol is violated — e.g. asking a
 * question before consent has been acknowledged, or attempting to extract
 * Level 3-4 restricted cultural content through the simulator.
 */
export class SimulatorProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SimulatorProtocolError';
  }
}

// ─── IQ Principle Shape ───────────────────────────────────────────────────────

interface IQPrinciple {
  id: string;
  name: string;
  englishName: string;
  applicationNotes: string;
}

// ─── Scenario Shape ───────────────────────────────────────────────────────────

export interface EvaluatableScenario {
  tradition: Tradition | string;
  culturallySensitiveTopics: string[];
  protocolViolationTriggers: string[];
}

// ─── FeedbackEngine ───────────────────────────────────────────────────────────

/**
 * Evaluates interview questions against scenario protocol requirements and
 * cultural sovereignty rules. Provides Pilimmaksarniq-aligned (IQ-05) feedback
 * that is never punitive — violations are framed as learning opportunities.
 *
 * Constructor injection for CulturalSovereigntyWarden enables mock-based testing
 * without loading the rules files.
 */
export class FeedbackEngine {
  private warden: CulturalSovereigntyWarden;

  constructor(warden?: CulturalSovereigntyWarden) {
    this.warden = warden ?? new CulturalSovereigntyWarden();
  }

  /**
   * Evaluate a question against a scenario for protocol violations and
   * cultural sovereignty compliance.
   *
   * If the question triggers a Level 3-4 cultural sovereignty classification,
   * it is blocked — the simulator cannot be used to extract restricted content.
   * This is a hard requirement: the simulator must never serve as a backdoor
   * to community-restricted or sacred knowledge.
   */
  evaluateQuestion(question: string, scenario: EvaluatableScenario): SimulationFeedback {
    // Check Cultural Sovereignty Warden for Level 3-4 content extraction attempts.
    // The warden classify() signature accepts (content, tradition, domain).
    const wardenResult = this.warden.classify(
      question,
      scenario.tradition as Tradition,
      'general',
    );

    const sovereigntyLevel = wardenResult.level as unknown as number;

    if (sovereigntyLevel >= CulturalSovereigntyLevel.COMMUNITY_RESTRICTED) {
      return {
        isAppropriate: false,
        violations: [
          {
            code: 'CULTURAL_SOVEREIGNTY_BLOCK',
            description: `This question approaches Level ${sovereigntyLevel} restricted content. The Interview Simulator cannot be used to extract community-restricted or sacred knowledge. ${wardenResult.explanation}`,
            relatedPractice: 'practice-12',
          },
        ],
        guidance: this.getPilimmaksarniqGuidance('cultural-sovereignty'),
        culturalSovereigntyBlocked: true,
        detectedSovereigntyLevel: sovereigntyLevel,
      };
    }

    // Check protocol violation triggers using keyword matching.
    const violations: ProtocolViolation[] = [];
    const questionLower = question.toLowerCase();

    for (const trigger of scenario.protocolViolationTriggers) {
      // Extract significant words (length > 4) from the trigger phrase.
      const triggerWords = trigger
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4 && /^[a-z]/.test(w));

      if (triggerWords.length > 0 && triggerWords.some(word => questionLower.includes(word))) {
        violations.push({
          code: 'PROTOCOL_VIOLATION',
          description: trigger,
          relatedPractice: this.mapTriggerToPractice(trigger),
        });
      }
    }

    const isAppropriate = violations.length === 0;

    return {
      isAppropriate,
      violations,
      guidance:
        violations.length > 0
          ? this.generateFeedback(violations)
          : 'Your question shows respectful curiosity and follows oral history best practices. Continue building on this foundation.',
      culturalSovereigntyBlocked: false,
      detectedSovereigntyLevel: sovereigntyLevel,
    };
  }

  /**
   * Generate Pilimmaksarniq-aligned feedback for a list of protocol violations.
   *
   * Feedback is never punitive — violations are framed as learning opportunities,
   * consistent with IQ-05 Pilimmaksarniq: development through practice and
   * patient mentorship.
   */
  generateFeedback(violations: ProtocolViolation[]): string {
    if (violations.length === 0) {
      return 'Your question demonstrates care for the knowledge holder and follows the core practices. This is how respectful oral history begins.';
    }

    const feedbackParts = violations.map(v => {
      if (v.code === 'CULTURAL_SOVEREIGNTY_BLOCK') {
        return `Pause here. This question approaches content that belongs to the community to share on their own terms. Redirect your curiosity toward what the knowledge holder has already offered to share.`;
      }
      return `Notice: ${v.description}. In Pilimmaksarniq practice, this is a learning moment — the most important skill is recognizing when to hold back and let the knowledge holder guide the direction.`;
    });

    return feedbackParts.join(' ') + ' ' + this.getPilimmaksarniqGuidance('general');
  }

  /**
   * Return IQ-05 Pilimmaksarniq guidance text for self-directed improvement.
   *
   * @param context - 'cultural-sovereignty' for blocked content guidance,
   *                  'general' for standard Pilimmaksarniq application notes.
   */
  getPilimmaksarniqGuidance(context: string): string {
    if (context === 'cultural-sovereignty') {
      return `IQ-05 Pilimmaksarniq teaches that knowledge is transmitted through relationship and earned trust, not through direct questioning. When a knowledge holder indicates a boundary, that boundary IS the teaching. Return to relationship-building before continuing.`;
    }

    // Load IQ principles and find Pilimmaksarniq (IQ-05).
    const iqPrinciples = require('../../northern-ways/iq-principles.json') as IQPrinciple[];
    const pilimmaksarniq = iqPrinciples.find(p => p.id === 'IQ-05');

    return (
      pilimmaksarniq?.applicationNotes ??
      'Continue practicing — observation and patience are the foundation of respectful oral history work.'
    );
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Map a violation trigger phrase to a related practice ID.
   * Returns 'practice-12' for cultural/sovereignty violations, specific
   * practice IDs for other recognizable patterns, and 'practice-01' as
   * the general fallback.
   */
  private mapTriggerToPractice(trigger: string): string {
    const lower = trigger.toLowerCase();
    if (lower.includes('consent') || lower.includes('recording') || lower.includes('ocap')) {
      return 'practice-03';
    }
    if (
      lower.includes('ceremonial') ||
      lower.includes('sacred') ||
      lower.includes('spiritual') ||
      lower.includes('angakkuq')
    ) {
      return 'practice-12';
    }
    if (lower.includes('relationship') || lower.includes('introduction')) {
      return 'practice-02';
    }
    if (lower.includes('pressure') || lower.includes('declines') || lower.includes('refused')) {
      return 'practice-08';
    }
    if (lower.includes('nisr') || lower.includes('documentation')) {
      return 'practice-03';
    }
    return 'practice-01';
  }
}
