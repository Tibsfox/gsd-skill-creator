/**
 * Safety & Quality Gate Suggester — Layer 2, Wave 2
 *
 * Generates pre/post execution gates from failure signatures.
 * Tracks true positive rate (TPR) and false positive rate (FPR < 10%).
 * Implements progressive automation and escalation protocol.
 */

import type {
  FailureSignature,
  FailureClass,
  ClusterResult,
  GateSpec,
  GateResult,
} from './types.js';

// ============================================================================
// Gate Generation
// ============================================================================

/** Gate performance tracking record */
export interface GatePerformance {
  gateId: string;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  totalChecks: number;
  humanOverrides: number;
  tpr: number;
  fpr: number;
  approvalRate: number;
}

/** Gate automation promotion criteria */
export interface PromotionCriteria {
  minApprovalRate: number;
  minSamples: number;
  maxFPR: number;
  promotionWindowDays: number;
}

const DEFAULT_PROMOTION: PromotionCriteria = {
  minApprovalRate: 0.9,
  minSamples: 20,
  maxFPR: 0.1,
  promotionWindowDays: 14,
};

/**
 * Generate a pre-execution gate from a failure signature.
 */
export function generatePreGate(
  signature: FailureSignature,
  clusters: ClusterResult[],
): GateSpec {
  const check = createGateCheck(signature, clusters);

  return {
    id: `gate-pre-${signature.id}`,
    name: `Pre: ${signature.failureClass} check for ${signature.taskType}`,
    type: 'pre-execution',
    check,
    sourceFailureSignatures: [signature.id],
    automationLevel: isHighRisk(signature.failureClass) ? 'human-approval' : 'human-approval',
    truePositiveRate: 0,
    falsePositiveRate: 0,
  };
}

/**
 * Generate a post-execution gate from a failure signature.
 */
export function generatePostGate(
  signature: FailureSignature,
): GateSpec {
  return {
    id: `gate-post-${signature.id}`,
    name: `Post: ${signature.failureClass} verification for ${signature.taskType}`,
    type: 'post-execution',
    check: (_task, _agent, context) => {
      // Post-execution: check if output is complete
      const hasDeliverables = context.deliverables !== undefined;
      const qualityScore = (context.qualityScore as number) ?? 0;
      return {
        pass: hasDeliverables && qualityScore > 0.5,
        reason: hasDeliverables
          ? `Quality score: ${qualityScore}`
          : 'Missing deliverables in output',
        confidence: qualityScore,
      };
    },
    sourceFailureSignatures: [signature.id],
    automationLevel: 'human-approval',
    truePositiveRate: 0,
    falsePositiveRate: 0,
  };
}

/**
 * Create a gate check function based on failure class.
 */
function createGateCheck(
  signature: FailureSignature,
  clusters: ClusterResult[],
): GateSpec['check'] {
  switch (signature.failureClass) {
    case 'capability-gap':
      return (task, agent, _context) => {
        const taskType = (task.taskType as string) ?? '';
        const agentCluster = (agent.clusterId as string) ?? '';
        const matching = clusters.find(c =>
          c.clusterId === agentCluster && (c.centroid[taskType] ?? 0) > 0.3,
        );
        return {
          pass: matching !== undefined,
          reason: matching
            ? `Agent cluster ${agentCluster} matches task type ${taskType}`
            : `Agent cluster ${agentCluster} has low capability for ${taskType}`,
          confidence: matching ? (matching.centroid[taskType] ?? 0) : 0.2,
        };
      };

    case 'scope-gap':
      return (task, _agent, _context) => {
        const hasDescription = typeof task.description === 'string' && task.description.length > 0;
        const hasRequirements = Array.isArray(task.requirements) && task.requirements.length > 0;
        return {
          pass: hasDescription && hasRequirements,
          reason: !hasDescription
            ? 'Task missing description'
            : !hasRequirements
            ? 'Task missing requirements list'
            : 'Task metadata complete',
          confidence: hasDescription && hasRequirements ? 0.85 : 0.3,
        };
      };

    case 'dependency-gap':
      return (task, _agent, context) => {
        const deps = (task.dependencies as string[]) ?? [];
        const completed = (context.completedTasks as string[]) ?? [];
        const completedSet = new Set(completed);
        const unmet = deps.filter(d => !completedSet.has(d));
        return {
          pass: unmet.length === 0,
          reason: unmet.length === 0
            ? 'All dependencies satisfied'
            : `Unmet dependencies: ${unmet.join(', ')}`,
          confidence: deps.length > 0 ? (deps.length - unmet.length) / deps.length : 1,
        };
      };

    case 'timeout':
      return (task, agent, _context) => {
        const estimatedMs = (task.estimatedDurationMs as number) ?? 0;
        const agentAvgMs = (agent.avgDurationMs as number) ?? 0;
        const riskRatio = agentAvgMs > 0 ? estimatedMs / agentAvgMs : 1;
        return {
          pass: riskRatio < 3, // Agent shouldn't take more than 3x their average
          reason: riskRatio < 3
            ? `Estimated duration within acceptable range (ratio: ${riskRatio.toFixed(1)})`
            : `High timeout risk: estimated ${estimatedMs}ms vs agent average ${agentAvgMs}ms`,
          confidence: Math.min(1, 1 / riskRatio),
        };
      };

    case 'communication-failure':
    case 'safety-violation':
    default:
      return (_task, _agent, _context) => ({
        pass: true,
        reason: `Manual review required for ${signature.failureClass} risk`,
        confidence: 0.5,
      });
  }
}

/**
 * Check if a failure class is high-risk (never auto-promote).
 */
export function isHighRisk(failureClass: FailureClass): boolean {
  return failureClass === 'safety-violation' || failureClass === 'capability-gap';
}

// ============================================================================
// Performance Tracking
// ============================================================================

/**
 * Create a gate performance tracker.
 */
export function createGatePerformance(gateId: string): GatePerformance {
  return {
    gateId,
    truePositives: 0,
    falsePositives: 0,
    trueNegatives: 0,
    falseNegatives: 0,
    totalChecks: 0,
    humanOverrides: 0,
    tpr: 0,
    fpr: 0,
    approvalRate: 1,
  };
}

/**
 * Record a gate check outcome and update performance metrics.
 */
export function recordGateOutcome(
  perf: GatePerformance,
  gatePassed: boolean,
  actualOutcome: boolean, // true = task succeeded, false = task failed
  humanOverride: boolean = false,
): GatePerformance {
  const updated = { ...perf };
  updated.totalChecks++;

  if (humanOverride) {
    updated.humanOverrides++;
  }

  if (!gatePassed && !actualOutcome) {
    updated.truePositives++; // Gate blocked, task would have failed
  } else if (!gatePassed && actualOutcome) {
    updated.falsePositives++; // Gate blocked, task would have succeeded
  } else if (gatePassed && actualOutcome) {
    updated.trueNegatives++; // Gate passed, task succeeded
  } else {
    updated.falseNegatives++; // Gate passed, task failed
  }

  // Recompute rates
  const positives = updated.truePositives + updated.falseNegatives;
  const negatives = updated.falsePositives + updated.trueNegatives;
  updated.tpr = positives > 0 ? updated.truePositives / positives : 0;
  updated.fpr = negatives > 0 ? updated.falsePositives / negatives : 0;
  updated.approvalRate = updated.totalChecks > 0
    ? (updated.trueNegatives + updated.falseNegatives) / updated.totalChecks
    : 1;

  return updated;
}

/**
 * Check if a gate should be promoted to auto-approve.
 */
export function shouldPromote(
  perf: GatePerformance,
  gate: GateSpec,
  criteria: PromotionCriteria = DEFAULT_PROMOTION,
): boolean {
  // High-risk gates never auto-promote
  for (const sigId of gate.sourceFailureSignatures) {
    // Check the gate name for high-risk indicators
    if (gate.name.includes('safety-violation') || gate.name.includes('capability-gap')) {
      return false;
    }
  }

  return (
    perf.totalChecks >= criteria.minSamples &&
    perf.approvalRate >= criteria.minApprovalRate &&
    perf.fpr <= criteria.maxFPR
  );
}

// ============================================================================
// Batch Gate Generation
// ============================================================================

/**
 * Generate gates for all failure signatures.
 * Returns both pre and post execution gates.
 */
export function generateGates(
  signatures: FailureSignature[],
  clusters: ClusterResult[],
): GateSpec[] {
  const gates: GateSpec[] = [];
  for (const sig of signatures) {
    gates.push(generatePreGate(sig, clusters));
    gates.push(generatePostGate(sig));
  }
  return gates;
}
