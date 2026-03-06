/**
 * cluster-translator.ts — Pattern Intelligence: Cluster Transition Guidance
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * ClusterTranslator converts SequenceRecord risk flags into human-readable
 * mediation advice at three disclosure levels (L0, L1, L2). It translates
 * the mathematical language of cluster distances and risk categories into
 * actionable guidance that makes sense to different audiences.
 *
 * WHY THIS EXISTS
 * ---------------
 * SequenceRecorder works in abstractions: "transition distance 0.972,
 * risk: communication-failure." That's precise but not actionable to a learner.
 * ClusterTranslator is the bridge between machine-readable risk signals and
 * human-readable guidance.
 *
 * This is Willow's role embodied in code — from CENTERCAMP-PERSONAL-JOURNAL:
 * "Don't ask permission to build bridges. Just build them."
 * ClusterTranslator builds the bridge between technical measurement and
 * understandable guidance, serving both learners and maintainers.
 *
 * DISCLOSURE LEVELS
 * -----------------
 * The three disclosure levels reflect different audiences:
 *
 *   L0 (learner): Plain English. "This is a big shift in work style."
 *     For someone learning the system. No technical terms. Focus on action.
 *
 *   L1 (intermediate): Cluster names + action. "Cluster transition: Creative Nexus
 *     → Rigor Spine (precise work). Action: mediate."
 *     For someone who knows the cluster names but not the math.
 *
 *   L2 (maintainer): Full technical detail. "CRITICAL: creative-nexus → rigor-spine |
 *     d=0.972 | risk=communication-failure | action=mediate"
 *     For debugging, monitoring, and systems analysis.
 *
 * This graduated disclosure reflects the design principle: "Transparency as Pedagogy."
 * New developers see L0 and understand what to do. Experienced developers get L2
 * and understand why.
 *
 * TRANSITION CLASSIFICATION
 * -------------------------
 * translateTransition() evaluates the three possible cross-cluster transitions
 * in order of specificity (most specific first), following Lex's pattern-ordering
 * principle (documented in the comment below the function signature):
 *
 *   1. Creative ↔ Rigor (d=0.972): CRITICAL — direct A-to-C hop, mediation required
 *      "This is the most dangerous transition — two fundamentally different work styles."
 *
 *   2. Creative ↔ Bridge (d=0.410): INFO — soft transition, common, no special action
 *      "Switching gears, take your time."
 *
 *   3. Bridge ↔ Rigor (d=0.570): WARNING — needs verification before proceeding
 *      "Make sure requirements are clear."
 *
 *   4. Generic fallback: any other cross-cluster transition with distance > 0.
 *      Severity scales by distance: above communicationFailureThreshold = critical.
 *
 * Intra-cluster transitions (source === target) return empty advice — no guidance
 * needed when an agent stays within their cluster.
 *
 * ACTION VOCABULARY
 * -----------------
 * Each piece of advice includes a suggested action:
 *   'continue'  — proceed without special handling
 *   'pause'     — slow down, observe carefully
 *   'verify'    — check requirements before proceeding
 *   'mediate'   — route through bridge-zone before proceeding
 *   'reassign'  — consider assigning this work to a different agent/cluster
 *
 * These actions are guidance, not enforcement. The calling system decides
 * whether to surface them, block on them, or log them.
 *
 * WHY SPECIFIC BEFORE GENERIC
 * ----------------------------
 * Specific transitions are checked before the generic fallback. This mirrors the
 * classifier pattern in SequenceRecorder (and the lesson learned from the "sign"
 * substring bug): more specific patterns must fire before more generic ones.
 *
 * Creative↔Rigor is checked first because it's the most dangerous and needs
 * specific messaging. Generic fallback only triggers for transitions not covered
 * by the three named cases — future cluster types would add cases here.
 *
 * DISPLAY NAMES AND PLAIN DESCRIPTIONS
 * -------------------------------------
 * CLUSTER_NAMES maps ClusterId to display names ("Creative Nexus").
 * CLUSTER_PLAIN maps ClusterId to plain descriptions ("creative and exploratory").
 *
 * The plain descriptions are used in L1 output to give learners context about
 * what kind of work the target cluster does, without requiring them to know
 * the cluster topology.
 *
 * @see SequenceRecorder (sequence-recorder.ts) — produces SequenceRecords with
 *   cluster fields and risk flags that are input to translateTransition()
 * @see RoutingAdvisor (routing-advisor.ts) — complementary module that advises
 *   which cluster to route to (proactive), while this translates after the fact
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "Willow: Bridge Everything" on the
 *   philosophy behind bridging technical and human understanding
 */

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
  /** Learner-facing message (L0) — plain English, no technical terms */
  learnerMessage: string;
  /** Maintainer-facing message (L2) — full technical detail with distances and risk categories */
  maintainerMessage: string;
  /** Suggested action for the calling system to take */
  action: 'continue' | 'pause' | 'verify' | 'mediate' | 'reassign';
  /** Cluster transition that caused this advice — includes source, target, and distance */
  transition: { source: ClusterId; target: ClusterId; distance: number };
}

/**
 * Cluster display names for human-readable output.
 * Used in L1 and L2 formatted advice.
 */
const CLUSTER_NAMES: Record<ClusterId, string> = {
  'creative-nexus': 'Creative Nexus',
  'bridge-zone': 'Bridge Zone',
  'rigor-spine': 'Rigor Spine',
};

/**
 * Plain-language cluster descriptions for learners.
 * Used in L1 formatted advice to explain what the target cluster does.
 */
const CLUSTER_PLAIN: Record<ClusterId, string> = {
  'creative-nexus': 'creative and exploratory',
  'bridge-zone': 'connecting and translating',
  'rigor-spine': 'precise and verification-focused',
};

/**
 * Translates SequenceRecord risk flags into mediation advice.
 * Specific cluster matches are checked before generic ones
 * (following Lex's pattern-ordering principle — more specific before more generic).
 *
 * Returns empty array for intra-cluster transitions (source === target).
 * Returns array of MediationAdvice for cross-cluster transitions — currently
 * at most one advice per record (early return after first match).
 *
 * @param record - A SequenceRecord with cluster source, target, and transition distance
 */
export function translateTransition(record: SequenceRecord): MediationAdvice[] {
  const advice: MediationAdvice[] = [];
  const { clusterSource: source, clusterTarget: target, transitionDistance: distance } = record;

  // No guidance needed for intra-cluster transitions
  if (source === target) return advice;

  const transition = { source, target, distance };

  // Specific: direct Creative ↔ Rigor hop (d=0.972, most dangerous)
  // This is a A-to-C transition without Bridge Zone mediation.
  // The two clusters have fundamentally different work styles and vocabularies.
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

  // Specific: Creative ↔ Bridge (d=0.410, moderate, common)
  // This is the most frequent cross-cluster transition — normal workflow movement.
  // A gentle note, not an alarm.
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

  // Specific: Bridge ↔ Rigor (d=0.570, moderate, needs verification awareness)
  // Moving from flexible/connecting work to precise/standards work.
  // Requirements should be clear before crossing into the rigor-spine.
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

  // Generic fallback for any unknown transition with distance > 0.
  // Severity scales with distance: above communicationFailureThreshold → critical.
  // This handles future cluster types that aren't explicitly named above.
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
 *
 * L0: Plain learner message — no technical terms
 * L1: Cluster names + plain description + action
 * L2: Full technical detail — severity, distances, risk category, action, maintainer message
 *
 * @param advice - The advice to format
 * @param level - Disclosure level: 'L0' | 'L1' | 'L2'
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
