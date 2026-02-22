/**
 * Facilitator Agent -- session orchestration, guidance, and energy management.
 *
 * The Facilitator is the session orchestrator (FLIGHT director). This module
 * contains:
 * - assessProblem(): classifies problem statements by nature/complexity (Plan 309-01)
 * - evaluateTransitionReadiness(): weighted confidence scoring for transitions (Plan 309-01)
 * - recommendPathway(): delegates pathway selection from assessment (Plan 309-02)
 * - adaptTechniqueQueue(): maps transition signals to PathwayRouter adaptation (Plan 309-02)
 * - generateGuidance(): phase-aware encouraging guidance messages (Plan 309-02)
 * - handleEnergySignal(): energy-responsive messages with no pressure language (Plan 309-02)
 * - redirectEvaluation(): gentle non-shaming redirects for evaluative content (Plan 309-02)
 * - generateSessionSummary(): markdown session summary with statistics (Plan 309-02)
 *
 * Only imports from ../shared/types.js, ../shared/constants.js,
 * ../pathways/router.js, ../core/session-manager.js, ../core/phase-controller.js.
 * No imports from den/, vtm/, knowledge/.
 */

import type {
  SessionState,
  SessionPhase,
  PathwayId,
  TechniqueId,
  AgentRole,
  EnergyLevel,
  BrainstormMessage,
} from '../shared/types.js';
import { PHASE_ORDER, TECHNIQUE_DEFAULTS } from '../shared/constants.js';
import type { IPathwayRouter, AdaptationSignal } from '../pathways/router.js';
import type { ISessionManager } from '../core/session-manager.js';
import type { IPhaseController } from '../core/phase-controller.js';

// ============================================================================
// Exported types
// ============================================================================

/**
 * Result of problem statement assessment.
 *
 * nature: the inferred category of the problem.
 * complexity: estimated difficulty.
 * recommended_pathway: which guided pathway to use.
 * recommended_techniques: first 2-3 techniques from the pathway.
 * estimated_duration_ms: sum of default durations for recommended techniques.
 * rationale: human-readable explanation of the mapping.
 */
export interface ProblemAssessment {
  nature: 'open-ended' | 'analytical' | 'improvement' | 'decision' | 'explicit' | 'mixed';
  complexity: 'simple' | 'moderate' | 'complex';
  recommended_pathway: PathwayId;
  recommended_techniques: TechniqueId[];
  estimated_duration_ms: number;
  rationale: string;
}

/**
 * Signal indicating a phase or technique transition is warranted.
 *
 * type: what triggered the signal.
 * confidence: 0-1 weighted score.
 * recommendation: next phase or technique.
 * rationale: human-readable explanation.
 */
export interface TransitionSignal {
  type: 'timer_expiry' | 'user_request' | 'energy_low' |
        'saturation_detected' | 'natural_completion' | 'technique_switch';
  confidence: number;
  recommendation: SessionPhase | TechniqueId;
  rationale: string;
}

/**
 * Guidance message from the Facilitator to the user or system.
 */
export interface FacilitatorGuidance {
  message: string;
  internal_action?: string;
  urgency: 'immediate' | 'next-pause' | 'advisory';
}

/**
 * Full Facilitator agent interface.
 *
 * 8 methods total. Plan 309-01 implements assessProblem and
 * evaluateTransitionReadiness. Plan 309-02 fills the remaining 6.
 */
export interface IFacilitatorAgent {
  assessProblem(problem_statement: string, user_context?: Record<string, unknown>): ProblemAssessment;
  recommendPathway(assessment: ProblemAssessment): PathwayId;
  adaptTechniqueQueue(session: SessionState, signal: TransitionSignal): TechniqueId[];
  evaluateTransitionReadiness(session: SessionState): TransitionSignal | null;
  generateGuidance(session: SessionState): FacilitatorGuidance;
  handleEnergySignal(level: EnergyLevel, session: SessionState): FacilitatorGuidance;
  redirectEvaluation(agent: AgentRole, content: string): FacilitatorGuidance;
  generateSessionSummary(session: SessionState): string;
}

// ============================================================================
// Signal word constants
// ============================================================================

/**
 * Signal phrases for open-ended / creative exploration problems.
 */
const OPEN_ENDED_SIGNALS: string[] = [
  'blank slate', 'brainstorm from scratch', 'new app', 'new product', 'new idea',
  'start fresh', 'out of ideas', 'no idea where to start', 'imagine', 'explore',
  'create something', 'invent', 'innovate',
];

/**
 * Signal phrases for analytical / problem-solving problems.
 */
const ANALYTICAL_SIGNALS: string[] = [
  'why does', 'why do', 'root cause', 'keep happening', 'understand the problem',
  'abandon', 'abandoning', 'failing', 'not working', 'why is', 'what causes',
  'diagnosis', 'investigate',
];

/**
 * Signal phrases for improvement / product-innovation problems.
 */
const IMPROVEMENT_SIGNALS: string[] = [
  'how can we improve', 'make it better', 'make our', 'features for', 'enhance',
  'upgrade', 'onboarding', 'improve', 'better', 'optimize',
];

/**
 * Signal phrases for decision-making problems.
 */
const DECISION_SIGNALS: string[] = [
  'should we', 'pros and cons', 'weighing options', 'or vue', 'or react',
  'a or b', 'choose between', 'which option', 'decide', 'trade-offs', 'tradeoff',
];

/**
 * Signal phrases for explicit / free-form technique requests.
 */
const EXPLICIT_SIGNALS: string[] = [
  'i want to use', 'scamper session', 'six hats', 'rapid ideation', 'mind map',
  'five whys', 'let me just', 'just brainstorm', 'specific technique',
];

/**
 * Signal phrases indicating user readiness for transition.
 * Used by evaluateTransitionReadiness for user_signal_factor.
 */
const USER_READY_SIGNALS: string[] = [
  'running low', 'running dry', 'stuck', 'nothing more', 'ready to move',
  'move on', 'done with this', 'that is all', "can't think", 'dried up',
];

// ============================================================================
// Nature type for scoring
// ============================================================================

type ProblemNature = ProblemAssessment['nature'];

/**
 * All signal categories mapped to their nature label and phrases.
 */
const SIGNAL_CATEGORIES: Array<{ nature: Exclude<ProblemNature, 'mixed'>; signals: string[] }> = [
  { nature: 'open-ended', signals: OPEN_ENDED_SIGNALS },
  { nature: 'analytical', signals: ANALYTICAL_SIGNALS },
  { nature: 'improvement', signals: IMPROVEMENT_SIGNALS },
  { nature: 'decision', signals: DECISION_SIGNALS },
  { nature: 'explicit', signals: EXPLICIT_SIGNALS },
];

// ============================================================================
// Pathway -> technique mapping
// ============================================================================

/**
 * First 2 recommended techniques for each pathway.
 * Used by assessProblem to provide immediate technique recommendations
 * without requiring a PathwayRouter instance (keeps the function pure).
 */
const PATHWAY_TECHNIQUES: Record<PathwayId, TechniqueId[]> = {
  'creative-exploration': ['freewriting', 'mind-mapping'],
  'problem-solving': ['question-brainstorming', 'five-whys'],
  'product-innovation': ['scamper', 'round-robin'],
  'decision-making': ['six-thinking-hats', 'starbursting'],
  'free-form': ['rapid-ideation'],
};

/**
 * Nature -> pathway mapping.
 */
const NATURE_PATHWAY: Record<Exclude<ProblemNature, 'mixed'>, PathwayId> = {
  'open-ended': 'creative-exploration',
  'analytical': 'problem-solving',
  'improvement': 'product-innovation',
  'decision': 'decision-making',
  'explicit': 'free-form',
};

// ============================================================================
// Standalone functions (pure, no class dependency)
// ============================================================================

/**
 * Detect complexity from problem statement length and keywords.
 *
 * Priority order:
 * 1. Complex keywords always win (architecture/enterprise are never simple)
 * 2. Simple keywords win when no complex keywords present
 * 3. Length thresholds: < 50 chars -> simple, > 200 chars -> complex
 * 4. Otherwise -> moderate
 */
function detectComplexity(input: string): ProblemAssessment['complexity'] {
  const lower = input.toLowerCase();
  const simpleKeywords = ['quick', 'simple', 'small', 'easy'];
  const complexKeywords = ['architecture', 'system', 'enterprise', 'comprehensive', 'large-scale'];

  const hasComplexKeyword = complexKeywords.some(k => lower.includes(k));
  const hasSimpleKeyword = simpleKeywords.some(k => lower.includes(k));

  // Complex keywords or long input -> complex
  if (hasComplexKeyword || input.length > 200) {
    return 'complex';
  }
  // Simple keywords or very short input -> simple
  if (hasSimpleKeyword || input.length < 50) {
    return 'simple';
  }
  return 'moderate';
}

/**
 * Assess a problem statement to determine its nature, complexity,
 * recommended pathway, and techniques.
 *
 * Algorithm:
 * 1. Score each nature by counting matching signal phrases in the lowercased input
 * 2. Winner-takes-all: highest score determines nature
 * 3. If tie or zero: nature = 'mixed', pathway = 'problem-solving'
 * 4. Derive complexity from length and keyword presence
 * 5. Look up recommended techniques from PATHWAY_TECHNIQUES
 * 6. Sum TECHNIQUE_DEFAULTS durations for estimated_duration_ms
 */
export function assessProblem(
  problem_statement: string,
  _user_context?: Record<string, unknown>,
): ProblemAssessment {
  const inputLower = problem_statement.toLowerCase();

  // Score each nature category
  const scores = new Map<Exclude<ProblemNature, 'mixed'>, { count: number; matched: string[] }>();

  for (const { nature, signals } of SIGNAL_CATEGORIES) {
    const matched: string[] = [];
    for (const phrase of signals) {
      if (inputLower.includes(phrase)) {
        matched.push(phrase);
      }
    }
    scores.set(nature, { count: matched.length, matched });
  }

  // Find winner (highest score)
  let bestNature: Exclude<ProblemNature, 'mixed'> | null = null;
  let bestScore = 0;
  let isTied = false;

  for (const [nature, { count }] of scores) {
    if (count > bestScore) {
      bestScore = count;
      bestNature = nature;
      isTied = false;
    } else if (count === bestScore && count > 0) {
      isTied = true;
    }
  }

  // Determine nature and pathway
  let nature: ProblemNature;
  let pathway: PathwayId;
  let rationale: string;

  if (bestScore === 0 || bestNature === null || isTied) {
    // No signals or tied -> default to mixed/problem-solving
    nature = 'mixed';
    pathway = 'problem-solving';
    rationale = 'No clear signals detected -- defaulting to problem-solving';
  } else {
    nature = bestNature;
    pathway = NATURE_PATHWAY[bestNature];
    const topPhrases = scores.get(bestNature)!.matched.slice(0, 2);
    rationale = `Problem contains ${nature} signals: '${topPhrases.join("', '")}'`;
  }

  // Complexity
  const complexity = detectComplexity(problem_statement);

  // Recommended techniques and duration
  const recommended_techniques = PATHWAY_TECHNIQUES[pathway];
  const estimated_duration_ms = recommended_techniques.reduce((sum, t) => {
    return sum + TECHNIQUE_DEFAULTS[t].duration_ms;
  }, 0);

  return {
    nature,
    complexity,
    recommended_pathway: pathway,
    recommended_techniques,
    estimated_duration_ms,
    rationale,
  };
}

/**
 * Evaluate whether a session is ready for a phase or technique transition.
 *
 * Weighted confidence formula (from spec):
 *   confidence = timer_factor * 0.2 + saturation_factor * 0.3
 *              + user_signal_factor * 0.4 + minimum_threshold_factor * 0.1
 *
 * Returns null if:
 * - No active technique (no timer to track)
 * - technique_timer is null
 * - Confidence < 0.5
 *
 * Returns TransitionSignal with:
 * - type: dominant contributing factor
 * - confidence: the weighted score
 * - recommendation: next phase from PHASE_ORDER
 * - rationale: human-readable explanation
 */
export function evaluateTransitionReadiness(
  session: SessionState,
): TransitionSignal | null {
  // No active technique -> no timer -> nothing to evaluate
  if (session.timer.technique_timer === null) {
    return null;
  }

  const { remaining_ms, total_ms } = session.timer.technique_timer;

  // Timer factor: proportion of time elapsed (clamped 0-1)
  const timer_factor = Math.min(1, Math.max(0, (total_ms - remaining_ms) / total_ms));

  // Velocity / saturation factor
  const now = Date.now();
  const sessionStart = session.metadata.created_at;
  const fiveMinMs = 300_000;
  const firstFiveEnd = sessionStart + fiveMinMs;
  const fiveMinAgo = now - fiveMinMs;

  const first5 = session.ideas.filter(
    idea => idea.timestamp >= sessionStart && idea.timestamp < firstFiveEnd,
  ).length;

  const last5 = session.ideas.filter(
    idea => idea.timestamp >= fiveMinAgo,
  ).length;

  let saturation_factor: number;
  if (first5 === 0 && last5 === 0) {
    saturation_factor = 0.0;
  } else if (first5 === 0 && last5 > 0) {
    saturation_factor = 0.0; // still early / no baseline
  } else if (last5 < first5 * 0.2) {
    saturation_factor = 1.0;
  } else {
    saturation_factor = Math.min(1, Math.max(0, 1.0 - (last5 / Math.max(first5, 1))));
  }

  // User signal factor
  const problemLower = session.problem_statement.toLowerCase();
  const user_signal_factor = USER_READY_SIGNALS.some(s => problemLower.includes(s)) ? 1.0 : 0.0;

  // Minimum threshold factor
  const minimum_threshold_factor = session.ideas.length >= 5 ? 1.0 : 0.0;

  // Weighted confidence
  const confidence =
    timer_factor * 0.2 +
    saturation_factor * 0.3 +
    user_signal_factor * 0.4 +
    minimum_threshold_factor * 0.1;

  // Below threshold -> not worth signaling
  if (confidence < 0.5) {
    return null;
  }

  // Determine dominant type
  let type: TransitionSignal['type'];
  const weightedUser = user_signal_factor * 0.4;
  const weightedSaturation = saturation_factor * 0.3;
  const weightedTimer = timer_factor * 0.2;

  if (weightedUser >= 0.35) {
    type = 'user_request';
  } else if (weightedSaturation >= 0.25) {
    type = 'saturation_detected';
  } else if (weightedTimer >= 0.18) {
    type = 'timer_expiry';
  } else {
    type = 'natural_completion';
  }

  // Recommendation: next phase after current
  const currentPhaseIndex = PHASE_ORDER.indexOf(session.phase);
  const nextPhase: SessionPhase = currentPhaseIndex < PHASE_ORDER.length - 1
    ? PHASE_ORDER[currentPhaseIndex + 1]
    : 'act';

  // Build rationale
  const parts: string[] = [];
  if (weightedTimer > 0.05) parts.push(`timer ${Math.round(timer_factor * 100)}% elapsed`);
  if (weightedSaturation > 0.05) parts.push(`idea velocity declining`);
  if (weightedUser > 0.05) parts.push(`user signals readiness`);
  if (minimum_threshold_factor > 0) parts.push(`${session.ideas.length} ideas generated`);
  const rationale = `Transition recommended: ${parts.join(', ')}`;

  return {
    type,
    confidence,
    recommendation: nextPhase,
    rationale,
  };
}

// ============================================================================
// Technique contextual hints
// ============================================================================

/**
 * Technique-specific hints appended to guidance messages when a technique
 * is active. Only the listed techniques have hints; others get no addition.
 */
const TECHNIQUE_HINTS: Partial<Record<TechniqueId, string>> = {
  'scamper': ' Remember, each lens is a different lens to look through -- what could you Substitute?',
  'six-thinking-hats': " Stay in the current hat's mode -- what does this perspective tell you?",
  'five-whys': " Keep asking 'why' -- each answer brings us closer to the root.",
  'brainwriting-635': ' Build on the ideas above -- take one and push it further.',
};

// ============================================================================
// Facilitation voice safety check
// ============================================================================

/**
 * Pressure phrases that must NEVER appear in any facilitator message.
 *
 * This is a development-time safety net. If any of these phrases leak
 * into generated messages, the method throws immediately so the violation
 * is caught during testing.
 */
const PRESSURE_PHRASES: string[] = [
  'you need to',
  'you must',
  'you should have',
  'not enough',
  'try harder',
  'more ideas',
];

/**
 * Assert that a message contains no pressure language.
 *
 * Throws Error if any PRESSURE_PHRASES appear in the message.
 * Called as a built-in safety check at development time.
 */
function assertNoPresureLanguage(message: string, methodName: string): void {
  const lower = message.toLowerCase();
  for (const phrase of PRESSURE_PHRASES) {
    if (lower.includes(phrase)) {
      throw new Error(
        `Facilitation voice violation: pressure language detected in ${methodName}: "${phrase}"`,
      );
    }
  }
}

// ============================================================================
// FacilitatorAgent class
// ============================================================================

/**
 * FacilitatorAgent -- the session FLIGHT director.
 *
 * Wraps the standalone pure functions and provides the full
 * IFacilitatorAgent interface. All 8 methods implemented across
 * Plan 309-01 (assessProblem, evaluateTransitionReadiness) and
 * Plan 309-02 (remaining 6 methods).
 */
export class FacilitatorAgent implements IFacilitatorAgent {
  private readonly sessionManager: ISessionManager;
  private readonly phaseController: IPhaseController;
  private readonly pathwayRouter: IPathwayRouter;

  constructor(
    sessionManager: ISessionManager,
    phaseController: IPhaseController,
    pathwayRouter: IPathwayRouter,
  ) {
    this.sessionManager = sessionManager;
    this.phaseController = phaseController;
    this.pathwayRouter = pathwayRouter;
  }

  assessProblem(problem_statement: string, user_context?: Record<string, unknown>): ProblemAssessment {
    return assessProblem(problem_statement, user_context);
  }

  evaluateTransitionReadiness(session: SessionState): TransitionSignal | null {
    return evaluateTransitionReadiness(session);
  }

  /**
   * Recommend a pathway based on a completed problem assessment.
   *
   * The assessment already resolved the pathway via assessProblem(),
   * so this method simply returns the recommended_pathway from the
   * assessment. This is intentionally simple -- assessProblem() already
   * calls the signal analysis logic internally.
   */
  recommendPathway(assessment: ProblemAssessment): PathwayId {
    return assessment.recommended_pathway;
  }

  /**
   * Adapt the technique queue based on a transition signal.
   *
   * Maps the TransitionSignal type to an AdaptationSignal for PathwayRouter:
   * - energy_low / saturation_detected -> saturation signal
   * - user_request -> user_request signal with recommended technique
   * - default -> low_energy signal
   *
   * Delegates to pathwayRouter.adaptTechniqueQueue() for the actual resequencing.
   */
  adaptTechniqueQueue(session: SessionState, signal: TransitionSignal): TechniqueId[] {
    let adaptSignal: AdaptationSignal;

    if (signal.type === 'energy_low' || signal.type === 'saturation_detected') {
      adaptSignal = {
        type: 'saturation',
        current_technique: session.active_technique ?? 'freewriting',
      };
    } else if (signal.type === 'user_request') {
      adaptSignal = {
        type: 'user_request',
        requested_technique: signal.recommendation as TechniqueId,
      };
    } else {
      adaptSignal = {
        type: 'low_energy',
        completed_techniques: session.metadata.techniques_used,
      };
    }

    return this.pathwayRouter.adaptTechniqueQueue(session.technique_queue, adaptSignal, session);
  }

  /**
   * Generate phase-aware guidance using encouraging language only.
   *
   * No urgency, no pressure, no "you need to", no "you should have",
   * no "not enough". All messages are process-oriented, not content-oriented.
   *
   * If a technique is active, appends a technique-contextual hint.
   */
  generateGuidance(session: SessionState): FacilitatorGuidance {
    const { phase, energy_level, active_technique } = session;

    let guidance: FacilitatorGuidance;

    switch (phase) {
      case 'explore':
        guidance = {
          message: "Let's explore the problem space. What aspects feel most important to you?",
          urgency: 'advisory',
        };
        break;

      case 'diverge':
        switch (energy_level) {
          case 'high':
            guidance = {
              message: 'Great flow -- keep going! All ideas are welcome here.',
              urgency: 'advisory',
            };
            break;
          case 'medium':
            guidance = {
              message: 'What about approaching it from a completely different angle?',
              urgency: 'advisory',
            };
            break;
          case 'low':
            guidance = {
              message: "Let's try a fresh angle. How about switching to a new approach?",
              internal_action: 'suggest_technique_switch',
              urgency: 'next-pause',
            };
            break;
          case 'flagging':
            guidance = {
              message: "You've built a solid idea base. Ready to start organizing them?",
              internal_action: 'suggest_phase_transition',
              urgency: 'next-pause',
            };
            break;
          default:
            guidance = {
              message: 'Great flow -- keep going! All ideas are welcome here.',
              urgency: 'advisory',
            };
        }
        break;

      case 'organize':
        guidance = {
          message: 'Look for natural groupings -- what themes keep appearing?',
          urgency: 'advisory',
        };
        break;

      case 'converge':
        guidance = {
          message: "Let's find the most promising directions. What stands out to you?",
          urgency: 'advisory',
        };
        break;

      case 'act':
        guidance = {
          message: 'Time to turn ideas into actions. Which ones feel most actionable?',
          urgency: 'advisory',
        };
        break;

      default:
        guidance = {
          message: "Let's explore the problem space. What aspects feel most important to you?",
          urgency: 'advisory',
        };
    }

    // Append technique-contextual hint if a technique is active
    if (active_technique) {
      const hint = TECHNIQUE_HINTS[active_technique];
      if (hint) {
        guidance = { ...guidance, message: guidance.message + hint };
      }
    }

    return guidance;
  }

  /**
   * Handle an energy level signal with encouraging, non-pressuring response.
   *
   * NEVER uses pressure language. The built-in safety check at the end
   * throws if any pressure phrase leaks into the message.
   */
  handleEnergySignal(level: EnergyLevel, session: SessionState): FacilitatorGuidance {
    let guidance: FacilitatorGuidance;

    switch (level) {
      case 'high':
        guidance = {
          message: 'Great flow -- keep going!',
          urgency: 'advisory',
        };
        break;

      case 'medium':
        guidance = {
          message: 'What about trying a completely different angle?',
          urgency: 'advisory',
        };
        break;

      case 'low':
        guidance = {
          message: "Let's try approaching this differently. How about switching things up?",
          internal_action: 'suggest_technique_switch',
          urgency: 'next-pause',
        };
        break;

      case 'flagging': {
        const ideaCount = session.ideas.length;
        guidance = {
          message: `You've generated ${ideaCount} ideas -- that's a solid foundation. Ready to start organizing them?`,
          internal_action: 'suggest_phase_transition',
          urgency: 'next-pause',
        };
        break;
      }

      default:
        guidance = {
          message: 'Great flow -- keep going!',
          urgency: 'advisory',
        };
    }

    // Built-in safety check: pressure language must never appear
    assertNoPresureLanguage(guidance.message, 'handleEnergySignal');

    return guidance;
  }

  /**
   * Redirect evaluative content during diverge phase.
   *
   * Always returns advisory-urgency guidance. Never judgmental.
   * The agent and content parameters are accepted but NOT included in
   * the message (privacy/non-shaming principle). Does NOT name the
   * agent or quote the content back.
   */
  redirectEvaluation(_agent: AgentRole, _content: string): FacilitatorGuidance {
    return {
      message: "Let's save that thought for the Converge phase -- right now, the wilder the better. What other directions could we explore?",
      urgency: 'advisory',
    };
  }

  /**
   * Generate a markdown session summary with statistics.
   *
   * Pure function: takes session state, returns a formatted Markdown string.
   * Uses template literals. The output is valid Markdown.
   */
  generateSessionSummary(session: SessionState): string {
    const durationMinutes = Math.round(session.timer.session_timer.elapsed_ms / 60_000);
    const techniquesUsed = session.metadata.techniques_used;
    const techniquesList = techniquesUsed.length > 0
      ? techniquesUsed.map(t => `- ${t}`).join('\n')
      : '- None yet';
    const clustersList = session.clusters.length > 0
      ? session.clusters.map(c => `- **${c.label}** (${c.idea_ids.length} ideas)`).join('\n')
      : '- No clusters formed yet';
    const topIdeas = session.ideas.length > 0
      ? session.ideas.slice(0, 5).map((idea, i) => `${i + 1}. ${idea.content}`).join('\n')
      : 'No ideas captured yet';

    return `## Session Summary

**Problem:** ${session.problem_statement}
**Status:** ${session.status} | **Phase reached:** ${session.phase}
**Duration:** ${durationMinutes} minutes

### Ideas Generated
${session.ideas.length} total ideas across ${techniquesUsed.length} technique(s)

### Techniques Used
${techniquesList}

### Clusters Formed
${clustersList}

### Top Ideas
${topIdeas}`;
  }
}
