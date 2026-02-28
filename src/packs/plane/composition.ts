/**
 * Euler Composition Engine for the Complex Plane.
 *
 * Orchestrates the full composition pipeline: complex multiplication of skill
 * positions, quality assessment, action recommendation, and human-readable
 * explanation generation. Integrates chord-based composition as a geometric
 * gate alongside existing co-activation thresholds.
 *
 * Key concept: Two skills compose via Euler multiplication (r1*r2, theta1+theta2).
 * The resulting composite position tells us whether the skills synergize well
 * (excellent) or pull in divergent directions (poor).
 *
 * Imports: types.ts, arithmetic.ts, chords.ts, cluster-detector.ts (type only).
 */

import type { SkillPosition, ChordCandidate } from './types.js';
import { composePositions, classifyByVersine, getPromotionLevel, arcDistance, chordLength } from './arithmetic.js';
import { ChordDetector, assessCompositionQuality, determineAction } from './chords.js';
import type { PositionStorePort, ChordEvaluation } from './chords.js';
import type { SkillCluster } from '../../services/agents/cluster-detector.js';

// ============================================================================
// Interfaces
// ============================================================================

/** Result of composing two skills via Euler multiplication. */
export interface CompositionResult {
  success: boolean;
  composedPosition?: SkillPosition;
  quality?: 'excellent' | 'good' | 'marginal' | 'poor';
  explanation?: string;
  reason?: string;
}

/** A concrete suggestion to create a composite skill from two constituents. */
export interface CompositeSuggestion {
  name: string;
  position: SkillPosition;
  constituents: [string, string];
  chordSavings: number;
  frequency: number;
  action: 'create_composite' | 'suggest_to_user' | 'monitor';
  explanation: string;
}

/** A skill cluster enhanced with geometric composition analysis. */
export interface EnhancedCluster {
  cluster: SkillCluster;
  averageChordQuality: number;
  geometricallySuitable: boolean;
  pairEvaluations: ChordEvaluation[];
}

// ============================================================================
// generateCompositeName
// ============================================================================

/**
 * Generate a composite skill name from two constituent skill IDs.
 *
 * If both IDs share a common prefix longer than 3 characters (trimming
 * trailing hyphens), uses "{prefix}-composite". Otherwise, sorts the names
 * alphabetically and joins them: "{shorter}-{longer}-composite".
 */
export function generateCompositeName(fromId: string, toId: string): string {
  const commonPrefix = findCommonPrefix(fromId, toId);
  const trimmedPrefix = commonPrefix.replace(/-$/, '');

  if (trimmedPrefix.length > 3) {
    return `${trimmedPrefix}-composite`;
  }

  const sorted = [fromId, toId].sort();
  return `${sorted[0]}-${sorted[1]}-composite`;
}

/**
 * Find the longest common prefix of two strings.
 */
function findCommonPrefix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return a.slice(0, i);
}

// ============================================================================
// generateCompositionExplanation
// ============================================================================

/**
 * Generate a human-readable explanation of why two skills compose well or poorly.
 *
 * References versine zones (grounded/working/frontier) and promotion levels
 * for each constituent, describes the angular relationship, and warns about
 * concerning compositions (wrapping past pi, low maturity).
 */
export function generateCompositionExplanation(
  a: SkillPosition,
  b: SkillPosition,
  composed: SkillPosition,
): string {
  const aZone = classifyByVersine(a);
  const bZone = classifyByVersine(b);
  const aLevel = getPromotionLevel(a);
  const bLevel = getPromotionLevel(b);
  const composedZone = classifyByVersine(composed);

  let explanation = `Combining a ${aZone} ${aLevel} skill (theta=${a.theta.toFixed(2)}) with a ${bZone} ${bLevel} skill (theta=${b.theta.toFixed(2)}) produces a ${composedZone} composite at theta=${composed.theta.toFixed(2)} with radius=${composed.radius.toFixed(2)}.`;

  if (composed.theta > Math.PI) {
    explanation += ` Warning: the composed angle wraps past pi, indicating the skills point in divergent directions.`;
  }

  if (composed.radius < 0.3) {
    explanation += ` The low composite radius (${composed.radius.toFixed(2)}) reflects immature constituents.`;
  }

  if (composed.theta >= Math.PI / 8 && composed.theta <= 3 * Math.PI / 8) {
    explanation += ` This is a well-balanced composite in the ideal zone.`;
  }

  return explanation;
}

// ============================================================================
// EulerCompositionEngine
// ============================================================================

/**
 * Orchestrates Euler composition of skill positions.
 *
 * Takes a PositionStorePort for looking up skill positions and a
 * ChordDetector for evaluating chord quality. All dependencies are
 * constructor-injected for testability.
 */
export class EulerCompositionEngine {
  private readonly positionStore: PositionStorePort;
  private readonly chordDetector: ChordDetector;

  constructor(positionStore: PositionStorePort, chordDetector: ChordDetector) {
    this.positionStore = positionStore;
    this.chordDetector = chordDetector;
  }

  /**
   * Compose two skills via Euler multiplication (complex product).
   *
   * Looks up both positions, computes the composite via theta addition
   * and radius multiplication, assesses quality, and generates an
   * explanation.
   */
  compose(skillIdA: string, skillIdB: string): CompositionResult {
    const posA = this.positionStore.get(skillIdA);
    if (!posA) {
      return { success: false, reason: `Missing position data for ${skillIdA}` };
    }

    const posB = this.positionStore.get(skillIdB);
    if (!posB) {
      return { success: false, reason: `Missing position data for ${skillIdB}` };
    }

    const composed = composePositions(posA, posB);
    const quality = assessCompositionQuality(composed);
    const explanation = generateCompositionExplanation(posA, posB, composed);

    return {
      success: true,
      composedPosition: composed,
      quality,
      explanation,
    };
  }

  /**
   * Generate composite suggestions from chord candidates.
   *
   * Evaluates each chord, filters out 'ignore' actions, and maps to
   * CompositeSuggestion objects with name, position, and explanation.
   */
  generateCompositeSuggestions(chords: ChordCandidate[]): CompositeSuggestion[] {
    const suggestions: CompositeSuggestion[] = [];

    for (const chord of chords) {
      const evaluation = this.chordDetector.evaluateChord(chord);

      if (evaluation.recommendAction === 'ignore') {
        continue;
      }

      const name = generateCompositeName(chord.fromId, chord.toId);
      const explanation = generateCompositionExplanation(
        chord.fromPosition,
        chord.toPosition,
        evaluation.composedPosition,
      );

      suggestions.push({
        name,
        position: evaluation.composedPosition,
        constituents: [chord.fromId, chord.toId],
        chordSavings: chord.savings,
        frequency: chord.frequency,
        action: evaluation.recommendAction as 'create_composite' | 'suggest_to_user' | 'monitor',
        explanation,
      });
    }

    return suggestions;
  }
}

// ============================================================================
// enhanceClusterWithGeometry
// ============================================================================

/** Quality-to-number mapping for averaging. */
const QUALITY_SCORES: Record<string, number> = {
  excellent: 1.0,
  good: 0.75,
  marginal: 0.5,
  poor: 0.25,
};

/**
 * Enhance a skill cluster with geometric composition analysis.
 *
 * For each pair of skills in the cluster, evaluates their chord quality.
 * Returns null if any skill in the cluster lacks a position (fallback to
 * existing non-geometric behavior).
 *
 * The geometric gate does NOT replace the existing co-activation threshold --
 * it adds a geometric filter ON TOP of it. Clusters that reach this function
 * have already passed the 5+/7+ co-activation gate.
 */
export function enhanceClusterWithGeometry(
  cluster: SkillCluster,
  positionStore: PositionStorePort,
): EnhancedCluster | null {
  const { skills } = cluster;

  // Verify all skills have positions
  for (const skill of skills) {
    if (!positionStore.get(skill)) {
      return null;
    }
  }

  // Create a local ChordDetector for evaluation
  const detector = new ChordDetector(positionStore);

  // Evaluate all unique pairs
  const pairEvaluations: ChordEvaluation[] = [];

  for (let i = 0; i < skills.length; i++) {
    for (let j = i + 1; j < skills.length; j++) {
      const posA = positionStore.get(skills[i])!;
      const posB = positionStore.get(skills[j])!;

      // Build synthetic ChordCandidate
      const arc = arcDistance(posA, posB);
      const chord = chordLength(posA, posB);
      const savings = arc - chord;
      const freq = Math.round(cluster.coActivationScore * 10);

      const candidate: ChordCandidate = {
        fromId: skills[i],
        toId: skills[j],
        fromPosition: posA,
        toPosition: posB,
        arcDistance: arc,
        chordLength: chord,
        savings: Math.max(0, savings),
        frequency: freq,
      };

      pairEvaluations.push(detector.evaluateChord(candidate));
    }
  }

  // Compute average quality score
  let totalQuality = 0;
  for (const evaluation of pairEvaluations) {
    totalQuality += QUALITY_SCORES[evaluation.compositionQuality] ?? 0.5;
  }
  const averageChordQuality = pairEvaluations.length > 0
    ? totalQuality / pairEvaluations.length
    : 0;

  // Geometrically suitable if at least one pair has good or excellent quality
  const geometricallySuitable = pairEvaluations.some(
    e => e.compositionQuality === 'excellent' || e.compositionQuality === 'good',
  );

  return {
    cluster,
    averageChordQuality,
    geometricallySuitable,
    pairEvaluations,
  };
}
