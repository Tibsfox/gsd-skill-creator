/**
 * Failure Mode Classifier — Layer 1, Wave 1
 *
 * Categorizes failures into 6 classes, builds failure signatures,
 * performs Bayesian agent-vs-task attribution, and associates
 * preventative interventions.
 */

import type {
  ObservationEvent,
  FailureClass,
  FailureSignature,
  FailureAttribution,
  AgentProfile,
} from './types.js';

// ============================================================================
// Failure Classification
// ============================================================================

/** Classification rules mapping failure reasons to classes */
const CLASSIFICATION_RULES: Array<{
  patterns: RegExp[];
  failureClass: FailureClass;
}> = [
  {
    patterns: [/capability/i, /skill[-_]?mismatch/i, /not[-_]?qualified/i, /experience/i],
    failureClass: 'capability-gap',
  },
  {
    patterns: [/scope/i, /requirement/i, /unclear/i, /ambiguous/i, /spec/i],
    failureClass: 'scope-gap',
  },
  {
    patterns: [/dependency/i, /prerequisite/i, /missing[-_]?dep/i, /blocked[-_]?by/i],
    failureClass: 'dependency-gap',
  },
  {
    patterns: [/timeout/i, /timed[-_ ]?out/i, /took[-_ ]?too[-_ ]?long/i, /exceeded[-_ ]?deadline/i],
    failureClass: 'timeout',
  },
  {
    patterns: [/communication/i, /handoff/i, /transfer[-_]?fail/i, /lost/i, /disconnect/i],
    failureClass: 'communication-failure',
  },
  {
    patterns: [/safety/i, /violation/i, /boundary/i, /forbidden/i, /restricted/i],
    failureClass: 'safety-violation',
  },
];

/**
 * Classify a failure reason string into one of 6 failure classes.
 * Returns 'scope-gap' as default if no pattern matches.
 */
export function classifyFailure(reason: string): FailureClass {
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.patterns.some(p => p.test(reason))) {
      return rule.failureClass;
    }
  }
  return 'scope-gap'; // Default: unclear failures often stem from scope issues
}

/**
 * Extract failure events from observations and classify them.
 */
export function classifyFailures(events: ObservationEvent[]): Array<{
  event: ObservationEvent;
  failureClass: FailureClass;
}> {
  return events
    .filter(e => e.eventType === 'task-failed')
    .map(event => {
      const reason = (event.metadata?.reason as string) ?? '';
      return { event, failureClass: classifyFailure(reason) };
    });
}

// ============================================================================
// Failure Signature Database
// ============================================================================

/** In-memory failure signature store */
export interface FailureSignatureStore {
  addFailure(event: ObservationEvent, failureClass: FailureClass): FailureSignature;
  getSignatures(): FailureSignature[];
  matchSignature(taskType: string, conditions: Record<string, unknown>): FailureSignature | null;
  getClassDistribution(): Map<FailureClass, number>;
}

/**
 * Create a failure signature store for building preventative patterns.
 */
export function createFailureSignatureStore(): FailureSignatureStore {
  const signatures = new Map<string, FailureSignature>();

  function signatureKey(failureClass: FailureClass, taskType: string): string {
    return `${failureClass}::${taskType}`;
  }

  return {
    addFailure(event: ObservationEvent, failureClass: FailureClass): FailureSignature {
      const taskType = (event.metadata?.taskType as string) ?? event.taskId.split('-').pop() ?? 'unknown';
      const key = signatureKey(failureClass, taskType);

      const existing = signatures.get(key);
      if (existing) {
        existing.occurrences++;
        existing.lastSeen = event.timestamp;
        return existing;
      }

      const sig: FailureSignature = {
        id: `sig-${signatures.size}`,
        failureClass,
        taskType,
        conditions: {
          reason: event.metadata?.reason,
          townId: event.townId,
        },
        preventativeAction: getPreventativeAction(failureClass),
        occurrences: 1,
        lastSeen: event.timestamp,
      };

      signatures.set(key, sig);
      return sig;
    },

    getSignatures(): FailureSignature[] {
      return Array.from(signatures.values());
    },

    matchSignature(taskType: string, conditions: Record<string, unknown>): FailureSignature | null {
      // Try exact match first, then class-only match
      for (const sig of signatures.values()) {
        if (sig.taskType === taskType) {
          return sig;
        }
      }
      // Check if any condition matches
      for (const sig of signatures.values()) {
        const sigReason = sig.conditions.reason as string | undefined;
        const inputReason = conditions.reason as string | undefined;
        if (sigReason && inputReason && sigReason === inputReason) {
          return sig;
        }
      }
      return null;
    },

    getClassDistribution(): Map<FailureClass, number> {
      const dist = new Map<FailureClass, number>();
      for (const sig of signatures.values()) {
        dist.set(sig.failureClass, (dist.get(sig.failureClass) ?? 0) + sig.occurrences);
      }
      return dist;
    },
  };
}

// ============================================================================
// Preventative Actions
// ============================================================================

/**
 * Map failure classes to default preventative actions.
 */
function getPreventativeAction(failureClass: FailureClass): string {
  const actions: Record<FailureClass, string> = {
    'capability-gap': 'Add pre-execution capability match gate: verify agent cluster includes this task type',
    'scope-gap': 'Add scope validation gate: check task metadata completeness before claim',
    'dependency-gap': 'Add dependency check gate: verify all prerequisite tasks completed',
    'timeout': 'Add timeout prediction gate: estimate completion time from agent history',
    'communication-failure': 'Add handoff quality gate: verify destination town has available agents',
    'safety-violation': 'Add safety boundary gate: check agent actions against safety constraints',
  };
  return actions[failureClass];
}

// ============================================================================
// Bayesian Failure Attribution
// ============================================================================

/**
 * Perform Bayesian attribution to determine whether a failure is
 * agent-side or task-side.
 *
 * Prior: agent's historical success rate for this task type.
 * Evidence: task's overall success rate across all agents.
 *
 * Returns probability distribution over agent-side vs task-side.
 */
export function bayesianAttribution(
  event: ObservationEvent,
  agentProfile: AgentProfile | undefined,
  taskSuccessRate: number, // How often this task type succeeds across all agents
): FailureAttribution {
  const failureClass = classifyFailure((event.metadata?.reason as string) ?? '');

  // Prior: agent's success rate for this task type
  const taskType = (event.metadata?.taskType as string) ?? 'unknown';
  const agentDim = agentProfile?.vector.dimensions[taskType] ?? 0.5;
  const agentPrior = agentDim; // Higher = agent is better at this

  // Likelihood: P(failure | agent-cause) vs P(failure | task-cause)
  // If agent has low capability, agent-cause more likely
  // If task has low success rate, task-cause more likely
  const agentLikelihood = 1 - agentPrior;  // Low capability -> high agent-cause likelihood
  const taskLikelihood = 1 - taskSuccessRate; // Low task success -> high task-cause likelihood

  // Bayesian update
  const totalLikelihood = agentLikelihood + taskLikelihood;
  const agentPosterior = totalLikelihood > 0
    ? agentLikelihood / totalLikelihood
    : 0.5;
  const taskPosterior = 1 - agentPosterior;

  // Confidence based on evidence strength
  const evidence: string[] = [];
  if (agentProfile) {
    evidence.push(`Agent success rate for ${taskType}: ${(agentDim * 100).toFixed(1)}%`);
    evidence.push(`Agent total tasks: ${agentProfile.vector.totalTasks}`);
  }
  evidence.push(`Task type overall success rate: ${(taskSuccessRate * 100).toFixed(1)}%`);

  const confidence = Math.abs(agentPosterior - 0.5) * 2; // 0 = uncertain, 1 = highly confident

  return {
    taskId: event.taskId,
    failureClass,
    agentSideProbability: agentPosterior,
    taskSideProbability: taskPosterior,
    confidence,
    evidence,
  };
}
