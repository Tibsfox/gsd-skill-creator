import type { ClusterId, FailureRisk, SequenceRecord } from './sequence-recorder.js';
import { DEFAULT_RECORDER_CONFIG } from './sequence-recorder.js';

/**
 * Mediation advice for cluster boundary crossings.
 * Translates failure risk signals into actionable guidance
 * at the appropriate disclosure level.
 */
export interface MediationAdvice {
  /** Risk category that triggered the advice */
  risk: FailureRisk;
  /** Severity: 'info' for soft transitions, 'warning' for gaps, 'critical' for A-C hops */
  severity: 'info' | 'warning' | 'critical';
  /** Learner-facing message (L0) */
  learnerMessage: string;
  /** Maintainer-facing message (L2) */
  maintainerMessage: string;
  /** Suggested action */
  action: 'continue' | 'pause' | 'verify' | 'mediate' | 'reassign';
  /** Cluster transition that caused this */
  transition: { source: ClusterId; target: ClusterId; distance: number };
}

/** Cluster display names for human-readable output */
const CLUSTER_NAMES: Record<ClusterId, string> = {
  'creative-nexus': 'Creative Nexus',
  'bridge-zone': 'Bridge Zone',
  'rigor-spine': 'Rigor Spine',
};

/** Plain-language cluster descriptions for learners */
const CLUSTER_PLAIN: Record<ClusterId, string> = {
  'creative-nexus': 'creative and exploratory',
  'bridge-zone': 'connecting and translating',
  'rigor-spine': 'precise and verification-focused',
};

/**
 * Translates SequenceRecord risk flags into mediation advice.
 * Specific cluster matches are checked before generic ones
 * (following Lex's pattern-ordering principle).
 */
export function translateTransition(record: SequenceRecord): MediationAdvice[] {
  const advice: MediationAdvice[] = [];
  const { clusterSource: source, clusterTarget: target, transitionDistance: distance } = record;

  if (source === target) return advice;

  const transition = { source, target, distance };

  // Specific: direct Creative <-> Rigor hop (most dangerous)
  if (
    (source === 'creative-nexus' && target === 'rigor-spine') ||
    (source === 'rigor-spine' && target === 'creative-nexus')
  ) {
    advice.push({
      risk: 'communication-failure',
      severity: 'critical',
      learnerMessage:
        "This is a big shift in work style. Consider checking in with the team first.",
      maintainerMessage:
        `Direct ${CLUSTER_NAMES[source]} -> ${CLUSTER_NAMES[target]} transition (d=${distance.toFixed(3)}). ` +
        'Recommend Bridge Zone mediation to preserve fidelity.',
      action: 'mediate',
      transition,
    });
    return advice;
  }

  // Specific: Creative <-> Bridge (moderate, common)
  if (
    (source === 'creative-nexus' && target === 'bridge-zone') ||
    (source === 'bridge-zone' && target === 'creative-nexus')
  ) {
    advice.push({
      risk: 'capability-gap',
      severity: 'info',
      learnerMessage:
        "Shifting gears a bit. Take your time — different kind of thinking here.",
      maintainerMessage:
        `${CLUSTER_NAMES[source]} -> ${CLUSTER_NAMES[target]} (d=${distance.toFixed(3)}). ` +
        'Moderate transition. Monitor for vocabulary mismatch.',
      action: 'continue',
      transition,
    });
    return advice;
  }

  // Specific: Bridge <-> Rigor (moderate, needs verification awareness)
  if (
    (source === 'bridge-zone' && target === 'rigor-spine') ||
    (source === 'rigor-spine' && target === 'bridge-zone')
  ) {
    advice.push({
      risk: 'capability-gap',
      severity: 'warning',
      learnerMessage:
        "Moving into more structured territory. Make sure requirements are clear.",
      maintainerMessage:
        `${CLUSTER_NAMES[source]} -> ${CLUSTER_NAMES[target]} (d=${distance.toFixed(3)}). ` +
        'Verify task spec completeness before proceeding.',
      action: 'verify',
      transition,
    });
    return advice;
  }

  // Generic fallback for any unknown transition with distance > 0
  if (distance > 0) {
    advice.push({
      risk: 'capability-gap',
      severity: distance > DEFAULT_RECORDER_CONFIG.communicationFailureThreshold ? 'critical' : 'warning',
      learnerMessage: "Switching to a different kind of work. Take a moment to adjust.",
      maintainerMessage:
        `Cluster transition: ${CLUSTER_NAMES[source] ?? source} -> ${CLUSTER_NAMES[target] ?? target} (d=${distance.toFixed(3)}).`,
      action: distance > DEFAULT_RECORDER_CONFIG.communicationFailureThreshold ? 'mediate' : 'pause',
      transition,
    });
  }

  return advice;
}

/**
 * Format mediation advice for display at the given disclosure level.
 */
export function formatAdvice(advice: MediationAdvice, level: 'L0' | 'L1' | 'L2'): string {
  const { source, target, distance } = advice.transition;

  if (level === 'L0') {
    return advice.learnerMessage;
  }

  if (level === 'L1') {
    return `Cluster transition: ${CLUSTER_NAMES[source]} -> ${CLUSTER_NAMES[target]} (${CLUSTER_PLAIN[target]} work). ` +
      `Action: ${advice.action}.`;
  }

  // L2: full technical detail
  return `${advice.severity.toUpperCase()}: ${CLUSTER_NAMES[source]} -> ${CLUSTER_NAMES[target]} | ` +
    `d=${distance.toFixed(3)} | risk=${advice.risk} | action=${advice.action}\n` +
    advice.maintainerMessage;
}
