/**
 * Angular Refinement Wrapper -- content direction analysis and position updates.
 *
 * Analyzes the content direction of skill refinements (more concrete vs more
 * abstract) and updates the skill's position on the complex plane accordingly.
 * More-concrete refinements decrease theta, more-abstract increase theta, and
 * all angular shifts are bounded by MAX_ANGULAR_VELOCITY * position.theta.
 *
 * Closes the feedback loop between skill refinement and complex plane position:
 * when a skill's content changes through the RefinementEngine, its position
 * rotates to reflect whether it became more concrete or more abstract.
 */

import type { SkillPosition } from './types.js';
import { MAX_ANGULAR_VELOCITY } from './types.js';
import { createPosition, normalizeAngle } from './arithmetic.js';
import type { PositionStorePort } from './promotion.js';

// ============================================================================
// Content Indicator Counting
// ============================================================================

/**
 * Count concrete indicators in content: file paths, code blocks, exact
 * commands, and numbered imperative steps.
 *
 * Higher counts indicate more concrete, tool-oriented content.
 */
export function countConcreteIndicators(content: string): number {
  let count = 0;

  // File paths: anything with file-like extension
  const filePaths = content.match(
    /\b[\w./-]+\.(ts|js|tsx|jsx|py|rs|md|json|yaml|yml|toml|sh|css|html)\b/g,
  );
  count += filePaths?.length ?? 0;

  // Code blocks: fenced with triple backticks (strong concrete signal, weighted x3)
  const codeBlocks = content.match(/```[\s\S]*?```/g);
  count += (codeBlocks?.length ?? 0) * 3;

  // Exact commands: lines with CLI-like patterns
  const commands = content.match(
    /\b(npm|npx|git|node|yarn|pnpm|cargo|make|docker|kubectl|curl|wget)\s+\S+/g,
  );
  count += commands?.length ?? 0;

  // Numbered imperative steps: "1. Run", "2. Create", "3. Add"
  const numberedSteps = content.match(
    /^\d+\.\s+(Run|Create|Add|Execute|Install|Build|Deploy|Set|Configure|Update)/gm,
  );
  count += numberedSteps?.length ?? 0;

  return count;
}

/**
 * Count abstract indicators in content: broad language, semantic terms,
 * and flexible phrasing.
 *
 * Higher counts indicate more abstract, reasoning-oriented content.
 */
export function countAbstractIndicators(content: string): number {
  let count = 0;

  // Broad/conditional language
  const broadWords = content.match(
    /\b(when|if|consider|may|might|could|should|perhaps|possibly|generally)\b/gi,
  );
  count += broadWords?.length ?? 0;

  // Semantic/architectural terms
  const semanticTerms = content.match(
    /\b(pattern|concept|approach|strategy|architecture|design|model|framework|principle|philosophy)\b/gi,
  );
  count += semanticTerms?.length ?? 0;

  // Flexible language (strong abstract signal, weighted x2)
  const flexiblePhrases = content.match(
    /\b(similar to|like|such as|for example|related to|depends on|see also|in general)\b/gi,
  );
  count += (flexiblePhrases?.length ?? 0) * 2;

  return count;
}

// ============================================================================
// Direction Analysis
// ============================================================================

/**
 * Analyze whether a content change made a skill more concrete or abstract.
 *
 * Computes the abstract-to-concrete ratio for old and new content, then
 * returns the difference. Positive means the refinement moved toward
 * abstract; negative means toward concrete; approximately zero means neutral.
 *
 * @param oldContent - Content before refinement
 * @param newContent - Content after refinement
 * @returns Direction value: positive = more abstract, negative = more concrete
 */
export function analyzeRefinementDirection(
  oldContent: string,
  newContent: string,
): number {
  const oldConcrete = countConcreteIndicators(oldContent);
  const oldAbstract = countAbstractIndicators(oldContent);
  const newConcrete = countConcreteIndicators(newContent);
  const newAbstract = countAbstractIndicators(newContent);

  const oldRatio = oldAbstract / Math.max(1, oldConcrete);
  const newRatio = newAbstract / Math.max(1, newConcrete);

  return newRatio - oldRatio;
}

// ============================================================================
// AngularRefinementWrapper
// ============================================================================

/**
 * Wraps refinement operations to update skill positions on the complex plane.
 *
 * After a skill is refined, analyzes content direction and rotates the
 * position. More-concrete refinements decrease theta (toward real axis),
 * more-abstract refinements increase theta (toward imaginary axis).
 * Angular shift is bounded by MAX_ANGULAR_VELOCITY * current theta.
 */
export class AngularRefinementWrapper {
  private readonly positionStore: PositionStorePort;

  constructor(positionStore: PositionStorePort) {
    this.positionStore = positionStore;
  }

  /**
   * Update a skill's position after content refinement.
   *
   * Computes a direction-weighted angular shift proportional to changePercent,
   * clamps it to the velocity bound, and stores the updated position.
   *
   * @param skillId - The skill whose position to update
   * @param oldContent - Content before refinement
   * @param newContent - Content after refinement
   * @param changePercent - Fraction of content changed (0-1)
   */
  onRefinement(
    skillId: string,
    oldContent: string,
    newContent: string,
    changePercent: number,
  ): void {
    const position = this.positionStore.get(skillId);
    if (!position) return;

    const direction = analyzeRefinementDirection(oldContent, newContent);
    const angularShift = direction * changePercent * 0.1;
    const maxShift = MAX_ANGULAR_VELOCITY * position.theta;
    const clampedShift = Math.sign(angularShift) *
      Math.min(Math.abs(angularShift), maxShift);

    const newPosition = createPosition(
      normalizeAngle(position.theta + clampedShift),
      position.radius,
      clampedShift,
    );

    this.positionStore.set(skillId, newPosition);
  }
}
